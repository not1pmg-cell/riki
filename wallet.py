"""RIKI — server hamyoni (SQLite).

Balans va sovg'alar (inventory) FAQAT shu yerda saqlanadi — telefon emas, server haqiqat manbai.
Har bir o'zgarish `tx` jadvaliga yoziladi (oldingi balans, o'zgarish, yangi balans, turi, sababi, vaqti...).
Hamma amallar atomar (BEGIN IMMEDIATE ... COMMIT), `idem` kaliti bilan takror so'rov ikki marta hisoblanmaydi.

Pul birligi: 1 TON = 1 000 000 "micro" (butun son) — kasr xatolari bo'lmaydi.
"""
from __future__ import annotations

import json
import os
import sqlite3
import threading
import time
import uuid

U = 1_000_000                      # 1 TON = 1e6 micro
ROUND_TTL = 3 * 3600               # ochiq raund (yutuq kutilayotgan tikish) shuncha soniya yashaydi
SCHEMA_VERSION = 1

# O'yin natijalari endi FAQAT serverda (games.py) hisoblanadi — telefon tikish/yutuq yubora olmaydi.
# Telefondan faqat qiymati teng amallar qabul qilinadi: sovg'ani sotish (server narxida) va sotib olish (to'langan summadan oshmaydi).
MAXM: dict[str, int] = {}
CLIENT_GAMES: set[str] = set()
SELL_RATE = 0.95
PB_RATE = 0.0005                    # PLAYBONUS: jami tikishning 0.05% i (ilovadagi bilan bir xil)
FREE_KINDS: dict = {}   # kunlik qutilar endi serverda (games.py)


def to_u(x) -> int:
    return int(round(float(x) * U))


def to_t(u: int) -> float:
    return round(u / U, 6)


class WalletError(Exception):
    def __init__(self, code: str, msg: str = ""):
        super().__init__(msg or code)
        self.code = code


class Wallet:
    def __init__(self, path: str):
        self.path = path
        self.lock = threading.RLock()
        self.db = sqlite3.connect(path, check_same_thread=False, isolation_level=None, timeout=30)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("PRAGMA synchronous=NORMAL")
        self.db.execute("PRAGMA foreign_keys=ON")
        self.migrate()

    # ------------------------------------------------------------ sxema / migratsiya
    def migrate(self) -> None:
        with self.lock:
            self.db.execute("CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)")
            r = self.db.execute("SELECT v FROM meta WHERE k='schema'").fetchone()
            ver = int(r["v"]) if r else 0
            if ver < 1:
                self.db.executescript("""
                BEGIN;
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,               -- Telegram ID (initData orqali tekshirilgan)
                    name TEXT DEFAULT '', username TEXT DEFAULT '', photo TEXT DEFAULT '',
                    bal INTEGER NOT NULL DEFAULT 0 CHECK (bal >= 0),
                    bal_ts INTEGER DEFAULT 0,             -- balans oxirgi o'zgargan vaqt (reytingda tenglikda)
                    turnover INTEGER NOT NULL DEFAULT 0,  -- jami tikilgan (micro)
                    pb_claimed INTEGER NOT NULL DEFAULT 0,
                    daily_ts INTEGER DEFAULT 0,
                    created INTEGER, seen INTEGER,
                    status TEXT NOT NULL DEFAULT 'active', lang TEXT DEFAULT 'uz', legacy INTEGER DEFAULT 0);
                CREATE INDEX IF NOT EXISTS ix_users_rank ON users(bal DESC, bal_ts ASC, id ASC);
                CREATE INDEX IF NOT EXISTS ix_users_seen ON users(seen);
                CREATE TABLE IF NOT EXISTS items (
                    id TEXT PRIMARY KEY, uid INTEGER NOT NULL REFERENCES users(id),
                    g INTEGER, sh TEXT, nm TEXT, v INTEGER NOT NULL, n INTEGER, m TEXT, ms TEXT, src TEXT, created INTEGER);
                CREATE INDEX IF NOT EXISTS ix_items_uid ON items(uid);
                CREATE TABLE IF NOT EXISTS tx (
                    id TEXT PRIMARY KEY, uid INTEGER NOT NULL, prev INTEGER NOT NULL, delta INTEGER NOT NULL, new INTEGER NOT NULL,
                    type TEXT NOT NULL, reason TEXT DEFAULT '', game TEXT DEFAULT '', items TEXT DEFAULT '',
                    ts INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'ok', src TEXT DEFAULT '', admin INTEGER,
                    idem TEXT UNIQUE);
                CREATE INDEX IF NOT EXISTS ix_tx_uid ON tx(uid, ts DESC);
                CREATE INDEX IF NOT EXISTS ix_tx_ts ON tx(ts DESC);
                CREATE INDEX IF NOT EXISTS ix_tx_type ON tx(type, ts DESC);
                CREATE TABLE IF NOT EXISTS rounds (
                    id TEXT PRIMARY KEY, uid INTEGER NOT NULL, game TEXT NOT NULL, stake INTEGER NOT NULL,
                    cap INTEGER NOT NULL, paid INTEGER NOT NULL DEFAULT 0, open INTEGER NOT NULL DEFAULT 1, ts INTEGER NOT NULL);
                CREATE INDEX IF NOT EXISTS ix_rounds ON rounds(uid, game, open, ts);
                CREATE TABLE IF NOT EXISTS audit (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, admin INTEGER, action TEXT, target TEXT, detail TEXT);
                CREATE INDEX IF NOT EXISTS ix_audit_ts ON audit(ts DESC);
                CREATE TABLE IF NOT EXISTS ann (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, uz TEXT DEFAULT '', ru TEXT DEFAULT '',
                    sent INTEGER DEFAULT 0, sent_n INTEGER DEFAULT 0, by INTEGER, active INTEGER DEFAULT 1);
                INSERT OR REPLACE INTO meta(k, v) VALUES ('schema', '1');
                COMMIT;
                """)

    # ------------------------------------------------------------ yordamchi
    def _begin(self):
        self.db.execute("BEGIN IMMEDIATE")

    def _user(self, uid: int) -> sqlite3.Row | None:
        return self.db.execute("SELECT * FROM users WHERE id=?", (int(uid),)).fetchone()

    def ensure_user(self, uid: int, name: str = "", username: str = "", photo: str = "",
                    legacy_bal: float | None = None) -> tuple[dict, bool]:
        """Foydalanuvchi yozuvini yaratadi (yo'q bo'lsa). (user, yangi_mi) qaytaradi.
        legacy_bal — eski versiyadan (telefon hisoblagan) ko'chiriladigan balans: faqat BIRINCHI marta."""
        uid = int(uid)
        now = int(time.time())
        with self.lock:
            u = self._user(uid)
            if u:
                self.db.execute("UPDATE users SET seen=?, name=COALESCE(NULLIF(?, ''), name), username=COALESCE(NULLIF(?, ''), username),"
                                " photo=COALESCE(NULLIF(?, ''), photo) WHERE id=?", (now, name, username, photo, uid))
                return dict(self._user(uid)), False
            self._begin()
            try:
                self.db.execute("INSERT INTO users(id, name, username, photo, created, seen, bal_ts) VALUES (?,?,?,?,?,?,?)",
                                (uid, name, username, photo, now, now, now))
                if legacy_bal and legacy_bal > 0:
                    self._apply(uid, to_u(legacy_bal), "migration", "Old app balance moved to server", src="migration")
                self.db.execute("COMMIT")
            except Exception:
                self.db.execute("ROLLBACK")
                raise
            return dict(self._user(uid)), True

    def _apply(self, uid: int, delta: int, typ: str, reason: str = "", game: str = "", src: str = "server",
               admin: int | None = None, idem: str | None = None, items: list | None = None, allow_negative=False) -> dict:
        """Tranzaksiya ichida chaqiriladi. Balansni o'zgartiradi va tx yozadi."""
        u = self._user(uid)
        if not u:
            raise WalletError("no_user", "User not found")
        prev = u["bal"]
        new = prev + delta
        if new < 0:
            if not allow_negative:
                raise WalletError("insufficient", "Insufficient balance")
            delta, new = -prev, 0
        now_ms = int(time.time() * 1000)
        tid = uuid.uuid4().hex[:16]
        self.db.execute("INSERT INTO tx(id, uid, prev, delta, new, type, reason, game, items, ts, status, src, admin, idem)"
                        " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        (tid, uid, prev, delta, new, typ, reason[:200], game, json.dumps(items or [])[:4000], now_ms, "ok", src, admin, idem))
        sets = "bal=?, bal_ts=?"
        args = [new, now_ms]
        if typ == "bet" and delta < 0:
            sets += ", turnover=turnover+?"
            args.append(-delta)
        self.db.execute(f"UPDATE users SET {sets} WHERE id=?", (*args, uid))
        return {"tx": tid, "prev": prev, "delta": delta, "new": new}

    def _idem(self, idem: str | None) -> dict | None:
        if not idem:
            return None
        r = self.db.execute("SELECT * FROM tx WHERE idem=?", (idem,)).fetchone()
        return dict(r) if r else None

    # ------------------------------------------------------------ o'qish
    def balance(self, uid: int) -> float:
        with self.lock:
            u = self._user(uid)
            return to_t(u["bal"]) if u else 0.0

    def items(self, uid: int) -> list[dict]:
        with self.lock:
            rows = self.db.execute("SELECT * FROM items WHERE uid=? ORDER BY created DESC", (int(uid),)).fetchall()
        return [{"id": r["id"], "g": r["g"], "sh": r["sh"], "nm": r["nm"], "v": to_t(r["v"]), "n": r["n"], "m": r["m"], "ms": r["ms"]} for r in rows]

    def state(self, uid: int) -> dict:
        with self.lock:
            u = self._user(uid)
            if not u:
                return {"bal": 0.0, "inv": [], "turnover": 0.0}
            return {"bal": to_t(u["bal"]), "inv": self.items(uid), "turnover": to_t(u["turnover"]),
                    "pb": to_t(u["pb_claimed"]), "dailyTs": u["daily_ts"] or 0}

    def user(self, uid: int) -> dict | None:
        with self.lock:
            u = self._user(uid)
            return dict(u) if u else None

    def history(self, uid: int | None = None, limit: int = 30, typ: str | None = None, since_ms: int = 0) -> list[dict]:
        q, a = "SELECT * FROM tx WHERE ts>=?", [since_ms]
        if uid is not None:
            q += " AND uid=?"; a.append(int(uid))
        if typ:
            q += " AND type=?"; a.append(typ)
        q += " ORDER BY ts DESC LIMIT ?"; a.append(limit)
        with self.lock:
            return [dict(r) for r in self.db.execute(q, a).fetchall()]

    # ------------------------------------------------------------ server tomonidan pul harakatlari
    def credit(self, uid: int, amount: float, typ: str, reason: str = "", game: str = "", src: str = "server",
               admin: int | None = None, idem: str | None = None) -> dict:
        """Server o'zi hisoblagan kirim/chiqim (live yutuq, depozit, bonus, admin). amount<0 — yechish."""
        with self.lock:
            done = self._idem(idem)
            if done:
                return {"dup": True, "bal": to_t(self._user(uid)["bal"]), "tx": done["id"]}
            self._begin()
            try:
                if not self._user(uid):
                    self.db.execute("INSERT INTO users(id, created, seen, bal_ts) VALUES (?,?,?,?)",
                                    (int(uid), int(time.time()), int(time.time()), int(time.time() * 1000)))
                r = self._apply(int(uid), to_u(amount), typ, reason, game, src, admin, idem,
                                allow_negative=(admin is not None and amount < 0))
                self.db.execute("COMMIT")
            except Exception:
                self.db.execute("ROLLBACK")
                raise
            return {"bal": to_t(r["new"]), "prev": to_t(r["prev"]), "delta": to_t(r["delta"]), "tx": r["tx"]}

    def take_items(self, uid: int, ids: list[str], typ: str, reason: str = "", game: str = "", idem: str | None = None) -> float:
        """Foydalanuvchi inventaridan sovg'alarni oladi (live tikish, transfer). Qiymatini (TON) qaytaradi."""
        ids = [str(i) for i in ids][:50]
        if not ids:
            return 0.0
        with self.lock:
            self._begin()
            try:
                rows = self.db.execute(f"SELECT * FROM items WHERE uid=? AND id IN ({','.join('?' * len(ids))})", (int(uid), *ids)).fetchall()
                if len(rows) != len(set(ids)):
                    raise WalletError("no_item", "Gift not found in your backpack")
                self.db.execute(f"DELETE FROM items WHERE uid=? AND id IN ({','.join('?' * len(ids))})", (int(uid), *ids))
                v = sum(r["v"] for r in rows)
                self._apply(int(uid), 0, typ, reason, game, "server", idem=idem, items=[{"id": r["id"], "sh": r["sh"], "v": to_t(r["v"]), "out": 1} for r in rows])
                self.db.execute("COMMIT")
            except Exception:
                self.db.execute("ROLLBACK")
                raise
            return to_t(v)

    def give_items(self, uid: int, items: list[dict], typ: str, reason: str = "", game: str = "", idem: str | None = None) -> list[dict]:
        """Server bergan sovg'alar (giveaway, live yutuq, transfer qabul)."""
        out = []
        with self.lock:
            if self._idem(idem):
                return []
            self._begin()
            try:
                if not self._user(uid):
                    self.db.execute("INSERT INTO users(id, created, seen, bal_ts) VALUES (?,?,?,?)",
                                    (int(uid), int(time.time()), int(time.time()), int(time.time() * 1000)))
                for x in items[:50]:
                    it = self._ins_item(int(uid), x, typ)
                    out.append(it)
                self._apply(int(uid), 0, typ, reason, game, "server", idem=idem, items=[{**o, "in": 1} for o in out])
                self.db.execute("COMMIT")
            except Exception:
                self.db.execute("ROLLBACK")
                raise
        return out

    def _ins_item(self, uid: int, x: dict, src: str) -> dict:
        iid = str(x.get("id") or "s" + uuid.uuid4().hex[:11])[:24]
        if self.db.execute("SELECT 1 FROM items WHERE id=?", (iid,)).fetchone():
            iid = "s" + uuid.uuid4().hex[:11]
        v = max(0, to_u(x.get("v", x.get("p", 0)) or 0))
        g = x.get("g")
        nm = str(x.get("nm") or (x.get("n") if isinstance(x.get("n"), str) else "") or "")[:40]
        num = x.get("n") if isinstance(x.get("n"), (int, float)) else None
        self.db.execute("INSERT INTO items(id, uid, g, sh, nm, v, n, m, ms, src, created) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                        (iid, uid, int(g) if isinstance(g, (int, float)) else None, str(x.get("sh", ""))[:40], nm, v,
                         int(num or 0) or None, (x.get("m") or None), (x.get("ms") or None), src, int(time.time() * 1000)))
        return {"id": iid, "g": g, "sh": x.get("sh", ""), "nm": nm, "v": to_t(v), "n": num, "m": x.get("m"), "ms": x.get("ms")}

    # ------------------------------------------------------------ ilovadan kelgan amal (telefonda hisoblanadigan o'yinlar)
    def client_op(self, uid: int, op: dict) -> dict:
        """op = {id, game, delta, add:[items], del:[item ids], why}
        Qoidalar:
          bet  : delta<=0 va/yoki del → balansdan yechiladi, raund ochiladi (cap = tikish × MAXM[game])
          win  : delta>=0 va/yoki add → faqat shu o'yinning ochiq raundi limiti doirasida
          sell : del + delta>0 → server qiymatining 95% i (telefon aytgan summadan qat'i nazar)
          buy  : delta<0 + add → qo'shilgan sovg'alar qiymati to'langan summadan oshmasligi kerak
          daily: kuniga bir marta, belgilangan limitgacha
          pb   : PLAYBONUS — jami tikishning 0.5% i, olinmagan qismi
        """
        idem = "op:" + str(op.get("id", ""))[:40]
        game = str(op.get("game", ""))[:16]
        delta = to_u(op.get("delta", 0) or 0)
        add = list(op.get("add") or [])[:20]
        dels = [str(x) for x in (op.get("del") or [])][:50]
        why = str(op.get("why", ""))[:16]
        with self.lock:
            done = self._idem(idem)
            if done:
                return {"ok": True, "dup": True, "bal": to_t(self._user(uid)["bal"])}
            if not self._user(uid):
                raise WalletError("no_user", "User not found")
            self._begin()
            try:
                res = self._client_op(int(uid), game, delta, add, dels, why, idem)
                self.db.execute("COMMIT")
            except Exception:
                self.db.execute("ROLLBACK")
                raise
            return {"ok": True, **res, "bal": to_t(self._user(uid)["bal"])}

    def _client_op(self, uid, game, delta, add, dels, why, idem) -> dict:
        now = int(time.time())
        del_rows = []
        if dels:
            del_rows = self.db.execute(f"SELECT * FROM items WHERE uid=? AND id IN ({','.join('?' * len(dels))})", (uid, *dels)).fetchall()
            if len(del_rows) != len(set(dels)):
                raise WalletError("no_item", "Gift not found in your backpack")
        del_v = sum(r["v"] for r in del_rows)
        add_v = sum(max(0, to_u(x.get("v", 0) or 0)) for x in add)
        items_log = [{"id": r["id"], "sh": r["sh"], "v": to_t(r["v"]), "out": 1} for r in del_rows]

        def drop_items():
            if dels:
                self.db.execute(f"DELETE FROM items WHERE uid=? AND id IN ({','.join('?' * len(dels))})", (uid, *dels))

        def put_items():
            for x in add:
                items_log.append({**self._ins_item(uid, x, game or why), "in": 1})

        # ---- kunlik bepul qutilar (Daily Box, bepul kase) — har biri 20 soatda bir marta
        if why in FREE_KINDS:
            cap_bal, cap_items = FREE_KINDS[why]
            last = self.db.execute("SELECT ts FROM tx WHERE uid=? AND type='bonus' AND game=? ORDER BY ts DESC LIMIT 1", (uid, why)).fetchone()
            if last and now * 1000 - last["ts"] < 20 * 3600 * 1000:
                raise WalletError("too_early", "Already claimed — come back later")
            if delta < 0 or delta > to_u(cap_bal) or add_v > to_u(cap_items) or dels:
                raise WalletError("limit", "Free reward limit")
            put_items()
            r = self._apply(uid, delta, "bonus", f"Free reward ({why})", why, "app", idem=idem, items=items_log)
            return {"kind": why, "tx": r["tx"]}
        # ---- PLAYBONUS
        if why == "pb":
            u = self._user(uid)
            avail = int(u["turnover"] * PB_RATE) - u["pb_claimed"]
            if delta <= 0 or delta > avail + to_u(0.01) or add or dels:
                raise WalletError("limit", "Nothing to claim yet")
            self.db.execute("UPDATE users SET pb_claimed=pb_claimed+? WHERE id=?", (delta, uid))
            r = self._apply(uid, delta, "bonus", "PLAYBONUS", "pb", "app", idem=idem)
            return {"kind": "pb", "tx": r["tx"]}
        # ---- sotish
        if dels and not add and delta > 0:
            pay = int(del_v * SELL_RATE)
            drop_items()
            r = self._apply(uid, pay, "sell", f"Sold {len(dels)} gift(s)", game, "app", idem=idem, items=items_log)
            return {"kind": "sell", "paid": to_t(pay), "tx": r["tx"]}
        # ---- sotib olish / yutuqni NFT'ga almashtirish (pul bilan teng qiymatli sovg'a)
        if add and delta < 0 and not dels:
            if add_v > -delta + to_u(0.01):
                raise WalletError("limit", "Gift value is higher than the price")
            put_items()
            r = self._apply(uid, delta, "buy", f"Bought {len(add)} gift(s)", game, "app", idem=idem, items=items_log)
            return {"kind": "buy", "tx": r["tx"]}
        if game not in CLIENT_GAMES:
            raise WalletError("not_allowed", f"Balance changes for '{game or '?'}' are handled by the server")
        # ---- tikish
        if (delta < 0 or dels) and not add and delta <= 0:
            stake = -delta + del_v
            if stake <= 0:
                raise WalletError("bad_op", "Empty bet")
            drop_items()
            r = self._apply(uid, delta, "bet", f"{game} bet", game, "app", idem=idem, items=items_log)
            if not delta:   # faqat sovg'a tikildi — aylanma ham hisoblanadi
                self.db.execute("UPDATE users SET turnover=turnover+? WHERE id=?", (del_v, uid))
            rid = uuid.uuid4().hex[:12]
            self.db.execute("INSERT INTO rounds(id, uid, game, stake, cap, ts) VALUES (?,?,?,?,?,?)",
                            (rid, uid, game, stake, stake * MAXM[game], now))
            return {"kind": "bet", "round": rid, "tx": r["tx"]}
        # ---- yutuq
        if (delta > 0 or add) and not dels and delta >= 0:
            total = delta + add_v
            self.db.execute("UPDATE rounds SET open=0 WHERE uid=? AND open=1 AND ts<?", (uid, now - ROUND_TTL))
            rows = self.db.execute("SELECT * FROM rounds WHERE uid=? AND game=? AND open=1 ORDER BY ts ASC", (uid, game)).fetchall()
            room = sum(r["cap"] - r["paid"] for r in rows)
            if total > room:
                raise WalletError("limit", "Win is larger than allowed for your bet")
            left = total
            for rw in rows:          # eng eski raunddan boshlab limitni ishlatamiz
                if left <= 0:
                    break
                use = min(left, rw["cap"] - rw["paid"])
                left -= use
                self.db.execute("UPDATE rounds SET paid=paid+?, open=CASE WHEN paid+?>=cap THEN 0 ELSE 1 END WHERE id=?", (use, use, rw["id"]))
            put_items()
            r = self._apply(uid, delta, "win", f"{game} win", game, "app", idem=idem, items=items_log)
            return {"kind": "win", "tx": r["tx"]}
        raise WalletError("bad_op", "Unsupported operation")

    def open_round(self, uid: int, game: str, cap: float, stake: float = 0) -> str:
        """Server tomonidan ochilgan raund (masalan promo-kod bilan bepul quti): yutuq shu limitgacha qabul qilinadi."""
        rid = uuid.uuid4().hex[:12]
        with self.lock:
            self.db.execute("INSERT INTO rounds(id, uid, game, stake, cap, ts) VALUES (?,?,?,?,?,?)",
                            (rid, int(uid), game, to_u(stake), to_u(cap), int(time.time())))
        return rid

    # ------------------------------------------------------------ eski versiyadagi sovg'alarni bir marta ko'chirish
    def import_legacy_items(self, uid: int, items: list[dict], max_count: int, max_value: float) -> int:
        with self.lock:
            u = self._user(uid)
            if not u or u["legacy"]:
                return 0
            self._begin()
            try:
                n, tot = 0, 0
                for x in items[:max(0, max_count)]:
                    v = to_u(x.get("v", 0) or 0)
                    if tot + v > to_u(max_value) + to_u(0.01):
                        continue
                    self._ins_item(int(uid), x, "migration"); n += 1; tot += v
                self.db.execute("UPDATE users SET legacy=1 WHERE id=?", (int(uid),))
                if n:
                    self._apply(int(uid), 0, "migration", f"{n} gift(s) moved to server", src="migration")
                self.db.execute("COMMIT")
            except Exception:
                self.db.execute("ROLLBACK")
                raise
            return n

    # ------------------------------------------------------------ reyting
    def leaderboard(self, limit: int = 100, offset: int = 0) -> list[dict]:
        """Faqat musbat balanslilar. Tartib: balans ↓, teng bo'lsa — shu balansga ertaroq erishgan ↑, keyin ID."""
        with self.lock:
            rows = self.db.execute("SELECT id, name, username, photo, bal FROM users WHERE bal>0 AND status='active'"
                                   " ORDER BY bal DESC, bal_ts ASC, id ASC LIMIT ? OFFSET ?", (limit, offset)).fetchall()
        return [{"id": r["id"], "name": r["name"] or "Player", "username": r["username"], "photo": r["photo"], "bal": to_t(r["bal"])} for r in rows]

    def rank(self, uid: int) -> int | None:
        with self.lock:
            u = self._user(uid)
            if not u or u["bal"] <= 0 or u["status"] != "active":
                return None
            r = self.db.execute("SELECT COUNT(*) c FROM users WHERE status='active' AND bal>0 AND (bal>? OR (bal=? AND (bal_ts<? OR (bal_ts=? AND id<?))))",
                                (u["bal"], u["bal"], u["bal_ts"], u["bal_ts"], u["id"])).fetchone()
            return r["c"] + 1

    def zero_users(self, limit: int = 50) -> list[dict]:
        with self.lock:
            rows = self.db.execute("SELECT id, name, username FROM users WHERE bal=0 ORDER BY seen DESC LIMIT ?", (limit,)).fetchall()
        return [dict(r) for r in rows]

    # ------------------------------------------------------------ admin
    def set_lang(self, uid: int, lang: str) -> None:
        with self.lock:
            self.db.execute("UPDATE users SET lang=? WHERE id=?", (lang, int(uid)))

    def set_status(self, uid: int, status: str) -> None:
        with self.lock:
            self.db.execute("UPDATE users SET status=? WHERE id=?", (status, int(uid)))

    def zero_all(self, admin: int) -> int:
        with self.lock:
            self._begin()
            try:
                rows = self.db.execute("SELECT id, bal FROM users WHERE bal>0").fetchall()
                for r in rows:
                    self._apply(r["id"], -r["bal"], "reset", "Admin reset: all balances", src="admin", admin=admin)
                self.db.execute("UPDATE rounds SET open=0")
                self.db.execute("COMMIT")
            except Exception:
                self.db.execute("ROLLBACK")
                raise
            return len(rows)

    def wipe_items(self, admin: int, uid: int | None = None) -> int:
        with self.lock:
            q = "DELETE FROM items" + (" WHERE uid=?" if uid else "")
            return self.db.execute(q, (int(uid),) if uid else ()).rowcount

    def log(self, admin: int, action: str, target: str = "", detail: str = "") -> None:
        with self.lock:
            self.db.execute("INSERT INTO audit(ts, admin, action, target, detail) VALUES (?,?,?,?,?)",
                            (int(time.time() * 1000), admin, action, str(target)[:64], str(detail)[:500]))

    def audit(self, limit: int = 30) -> list[dict]:
        with self.lock:
            return [dict(r) for r in self.db.execute("SELECT * FROM audit ORDER BY id DESC LIMIT ?", (limit,)).fetchall()]

    def stats(self) -> dict:
        now = int(time.time())
        ms = now * 1000
        with self.lock:
            q = lambda s, a=(): self.db.execute(s, a).fetchone()[0] or 0  # noqa: E731
            per = {}
            for k, sec in (("day", 86400), ("week", 7 * 86400), ("month", 30 * 86400)):
                since = ms - sec * 1000
                per[k] = {"dep": to_t(q("SELECT SUM(delta) FROM tx WHERE type='deposit' AND ts>=?", (since,))),
                          "wd": to_t(-q("SELECT SUM(delta) FROM tx WHERE type='withdraw' AND ts>=?", (since,))),
                          "bets": to_t(-q("SELECT SUM(delta) FROM tx WHERE type='bet' AND ts>=?", (since,))),
                          "wins": to_t(q("SELECT SUM(delta) FROM tx WHERE type='win' AND ts>=?", (since,))),
                          "tx": q("SELECT COUNT(*) FROM tx WHERE ts>=?", (since,)),
                          "new": q("SELECT COUNT(*) FROM users WHERE created>=?", (now - sec,)),
                          "active": q("SELECT COUNT(*) FROM users WHERE seen>=?", (now - sec,))}
            return {"users": q("SELECT COUNT(*) FROM users"),
                    "online": q("SELECT COUNT(*) FROM users WHERE seen>=?", (now - 300,)),
                    "active": q("SELECT COUNT(*) FROM users WHERE seen>=?", (now - 86400,)),
                    "banned": q("SELECT COUNT(*) FROM users WHERE status='banned'"),
                    "total_bal": to_t(q("SELECT SUM(bal) FROM users")),
                    "positive": q("SELECT COUNT(*) FROM users WHERE bal>0"),
                    "items": q("SELECT COUNT(*) FROM items"), "items_v": to_t(q("SELECT SUM(v) FROM items")),
                    "dep": to_t(q("SELECT SUM(delta) FROM tx WHERE type='deposit'")),
                    "wd": to_t(-q("SELECT SUM(delta) FROM tx WHERE type='withdraw'")),
                    "tx": q("SELECT COUNT(*) FROM tx"), "per": per}

    def search(self, text: str, limit: int = 10) -> list[dict]:
        t = text.strip().lstrip("@").lower()
        with self.lock:
            if t.isdigit():
                rows = self.db.execute("SELECT * FROM users WHERE id=?", (int(t),)).fetchall()
            else:
                rows = self.db.execute("SELECT * FROM users WHERE lower(username)=? OR lower(name) LIKE ? ORDER BY seen DESC LIMIT ?",
                                       (t, f"%{t}%", limit)).fetchall()
        return [dict(r) for r in rows]

    def users_page(self, offset: int = 0, limit: int = 15, order: str = "seen") -> list[dict]:
        col = {"seen": "seen DESC", "bal": "bal DESC", "new": "created DESC"}.get(order, "seen DESC")
        with self.lock:
            return [dict(r) for r in self.db.execute(f"SELECT * FROM users ORDER BY {col} LIMIT ? OFFSET ?", (limit, offset)).fetchall()]

    def export_csv(self, path: str, since_ms: int = 0, uid: int | None = None, typ: str | None = None) -> int:
        import csv
        q, a = "SELECT * FROM tx WHERE ts>=?", [since_ms]
        if uid:
            q += " AND uid=?"; a.append(uid)
        if typ:
            q += " AND type=?"; a.append(typ)
        q += " ORDER BY ts DESC LIMIT 100000"
        with self.lock:
            rows = self.db.execute(q, a).fetchall()
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["id", "user_id", "time_utc", "type", "game", "prev_TON", "change_TON", "new_TON", "reason", "status", "source", "admin"])
            for r in rows:
                w.writerow([r["id"], r["uid"], time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(r["ts"] / 1000)), r["type"], r["game"],
                            to_t(r["prev"]), to_t(r["delta"]), to_t(r["new"]), r["reason"], r["status"], r["src"], r["admin"] or ""])
        return len(rows)

    # ------------------------------------------------------------ e'lonlar
    def ann_add(self, uz: str, ru: str, by: int) -> int:
        with self.lock:
            return self.db.execute("INSERT INTO ann(ts, uz, ru, by) VALUES (?,?,?,?)", (int(time.time() * 1000), uz, ru, by)).lastrowid

    def ann_list(self, limit: int = 10) -> list[dict]:
        with self.lock:
            return [dict(r) for r in self.db.execute("SELECT * FROM ann WHERE active=1 ORDER BY id DESC LIMIT ?", (limit,)).fetchall()]

    def ann_get(self, aid: int) -> dict | None:
        with self.lock:
            r = self.db.execute("SELECT * FROM ann WHERE id=?", (aid,)).fetchone()
            return dict(r) if r else None

    def ann_edit(self, aid: int, uz: str | None = None, ru: str | None = None) -> None:
        with self.lock:
            if uz is not None:
                self.db.execute("UPDATE ann SET uz=? WHERE id=?", (uz, aid))
            if ru is not None:
                self.db.execute("UPDATE ann SET ru=? WHERE id=?", (ru, aid))

    def ann_del(self, aid: int) -> None:
        with self.lock:
            self.db.execute("UPDATE ann SET active=0 WHERE id=?", (aid,))

    def ann_sent(self, aid: int, n: int) -> None:
        with self.lock:
            self.db.execute("UPDATE ann SET sent=?, sent_n=? WHERE id=?", (int(time.time() * 1000), n, aid))

    def all_user_ids(self) -> list[tuple[int, str]]:
        with self.lock:
            return [(r["id"], r["lang"] or "uz") for r in self.db.execute("SELECT id, lang FROM users WHERE status='active'").fetchall()]

    # ------------------------------------------------------------ zaxira nusxa
    def backup(self, folder: str, keep: int = 14) -> str:
        os.makedirs(folder, exist_ok=True)
        dst = os.path.join(folder, time.strftime("riki-%Y%m%d-%H%M%S.db"))
        with self.lock:
            b = sqlite3.connect(dst)
            self.db.backup(b)
            b.close()
        files = sorted(f for f in os.listdir(folder) if f.startswith("riki-") and f.endswith(".db"))
        for f in files[:-keep]:
            try:
                os.remove(os.path.join(folder, f))
            except OSError:
                pass
        return dst
