"""
RIKI — Earn vazifalari va ticketlar (SERVERDA).

Ticketlar — giveaway'larga qatnashish uchun. Hammasi riki.db da:
  users.tix          — joriy ticketlar soni (manfiy bo'lmaydi)
  tclaims            — kim qaysi vazifani qaysi davrda olgan (kunlik: sana, bir martalik: 'once')
  tlog               — ticket harakatlari (+/−, sabab)

Progress telefondan emas, serverdagi o'yin yozuvlaridan hisoblanadi (plays, tx, users.turnover),
shuning uchun localStorage'ni o'zgartirib ticket olib bo'lmaydi.
"""
from __future__ import annotations

import time

TZ_OFF = 5 * 3600   # Toshkent — kunlik vazifalar 00:00 da yangilanadi

# id, bo'lim, nomi (en / uz / ru), mukofot (ticket), kerak, manba, o'yin (Bet tugmasi)
DAILY = [
    {"id": "checkin", "n": ("Daily check-in", "Kunlik kirish", "Ежедневный вход"), "r": 10, "need": 0, "src": "none", "ic": "cal"},
    {"id": "invite", "n": ("Invite friends", "Do'stlarni taklif qiling", "Пригласите друзей"), "r": 100, "need": 1, "src": "ref", "ic": "invite"},
    {"id": "rk3", "n": ("Play 3 rocket rounds", "3 ta Rocket raund o'ynang", "Сыграйте 3 раунда Rocket"), "r": 25, "need": 3, "src": "live:rocket", "go": "rocket", "ic": "rocket"},
    {"id": "pl10", "n": ("Drop 10 balls in Plinko", "Plinko'da 10 ta shar tashlang", "Бросьте 10 шаров в Plinko"), "r": 25, "need": 10, "src": "play:plinko", "go": "plinko", "ic": "plinko"},
    {"id": "mn3", "n": ("Play 3 Mines rounds", "3 ta Mines raund o'ynang", "Сыграйте 3 раунда Mines"), "r": 25, "need": 3, "src": "play:mines", "go": "mines", "ic": "mines"},
    {"id": "dc5", "n": ("Roll the dice 5 times", "Zarni 5 marta tashlang", "Бросьте кубик 5 раз"), "r": 25, "need": 5, "src": "play:dice", "go": "dice", "ic": "dice"},
    {"id": "sp3", "n": ("Play 3 Spins", "3 marta Spins o'ynang", "Сыграйте 3 Spins"), "r": 25, "need": 3, "src": "play:spins", "go": "spins", "ic": "spins"},
    {"id": "box1", "n": ("Open a gift box", "Sovg'a qutisini oching", "Откройте подарочную коробку"), "r": 15, "need": 1, "src": "play:cases,freecase", "go": "cases", "ic": "box"},
    {"id": "pvp1", "n": ("Play a PvP round", "PvP raund o'ynang", "Сыграйте раунд PvP"), "r": 25, "need": 1, "src": "live:pvp", "go": "pvp", "ic": "pvp"},
    {"id": "up1", "n": ("Play an Upgrade round", "Upgrade raund o'ynang", "Сыграйте раунд Upgrade"), "r": 15, "need": 1, "src": "play:upgrade", "go": "upgrade", "ic": "upgrade"},
]
ONCE = [
    {"id": "chan", "n": ("Join our channel", "Kanalimizga obuna bo'ling", "Подпишитесь на наш канал"), "r": 100, "need": 0, "src": "chan", "ic": "chat"},
    {"id": "dep5", "n": ("Deposit 5 TON in total", "Jami 5 TON depozit qiling", "Пополните на 5 TON всего"), "r": 250, "need": 5, "src": "dep", "ic": "wallet"},
    {"id": "dep25", "n": ("Deposit 25 TON in total", "Jami 25 TON depozit qiling", "Пополните на 25 TON всего"), "r": 1000, "need": 25, "src": "dep", "ic": "wallet"},
    {"id": "dep100", "n": ("Deposit 100 TON in total", "Jami 100 TON depozit qiling", "Пополните на 100 TON всего"), "r": 5000, "need": 100, "src": "dep", "ic": "wallet"},
    {"id": "rkwin", "n": ("Win a rocket round", "Rocket raundda yuting", "Выиграйте раунд Rocket"), "r": 25, "need": 1, "src": "win:rocket", "go": "rocket", "ic": "rocket"},
    {"id": "uptry", "n": ("Try the Upgrade game", "Upgrade o'yinini sinab ko'ring", "Попробуйте игру Upgrade"), "r": 25, "need": 1, "src": "ever:upgrade", "go": "upgrade", "ic": "upgrade"},
]
# VIP darajalari (aylanma, ilova birligida) — ilovadagi VIPS bilan bir xil
VIP = [("Iron", 1000, 1000), ("Bronze", 5000, 2500), ("Silver", 10000, 5000), ("Gold", 25000, 10000),
       ("Platinum", 50000, 25000), ("Diamond", 250000, 100000), ("Obsidian", 1000000, 500000)]
for _i, (_n, _need, _r) in enumerate(VIP):
    ONCE.append({"id": "vip_" + _n.lower(), "n": (f"Reach the {_n} VIP level", f"{_n} VIP darajasiga yeting", f"Достигните уровня VIP {_n}"),
                 "r": _r, "need": _i + 1, "src": "vip", "vneed": _need, "ic": "star"})
ALL = {t["id"]: t for t in DAILY + ONCE}


class Tasks:
    def __init__(self, W, cfg):
        """W — Wallet, cfg — sozlama o'qish funksiyasi (bot.py)."""
        self.W, self.cfg = W, cfg
        with W.lock:
            cols = {r[1] for r in W.db.execute("PRAGMA table_info(users)").fetchall()}
            if "tix" not in cols:
                W.db.execute("ALTER TABLE users ADD COLUMN tix INTEGER NOT NULL DEFAULT 0")
            W.db.executescript("""
                CREATE TABLE IF NOT EXISTS tclaims (uid INTEGER NOT NULL, tid TEXT NOT NULL, period TEXT NOT NULL, tix INTEGER NOT NULL, ts INTEGER NOT NULL,
                                                    PRIMARY KEY(uid, tid, period));
                CREATE TABLE IF NOT EXISTS tlog (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER NOT NULL, delta INTEGER NOT NULL, new INTEGER NOT NULL,
                                                 reason TEXT DEFAULT '', ts INTEGER NOT NULL, idem TEXT UNIQUE);
                CREATE INDEX IF NOT EXISTS ix_tlog_uid ON tlog(uid, ts DESC);
            """)

    # ------------------------------------------------------------ vaqt
    @staticmethod
    def day_key(ts: float | None = None) -> str:
        return time.strftime("%Y-%m-%d", time.gmtime((ts or time.time()) + TZ_OFF))

    @staticmethod
    def day_start(ts: float | None = None) -> int:
        t = (ts or time.time()) + TZ_OFF
        return int(t - t % 86400 - TZ_OFF)

    # ------------------------------------------------------------ ticketlar
    def tix(self, uid: int) -> int:
        r = self.W.db.execute("SELECT tix FROM users WHERE id=?", (int(uid),)).fetchone()
        return int(r[0]) if r else 0

    def _tix_apply(self, uid: int, delta: int, reason: str, idem: str | None) -> int | None:
        """Tranzaksiya ichida chaqiriladi. None — yetarli emas yoki takroriy."""
        if idem and self.W.db.execute("SELECT 1 FROM tlog WHERE idem=?", (idem,)).fetchone():
            return None
        cur = self.tix(uid)
        if cur + delta < 0:
            return None
        self.W.db.execute("UPDATE users SET tix=? WHERE id=?", (cur + delta, int(uid)))
        self.W.db.execute("INSERT INTO tlog(uid, delta, new, reason, ts, idem) VALUES (?,?,?,?,?,?)",
                          (int(uid), delta, cur + delta, reason[:80], int(time.time()), idem))
        return cur + delta

    def tix_add(self, uid: int, n: int, reason: str, idem: str | None = None) -> int | None:
        with self.W.lock:
            self.W.ensure_user(uid) if not self.W._user(uid) else None
            self.W._begin()
            try:
                r = self._tix_apply(uid, int(n), reason, idem)
                self.W.db.execute("COMMIT")
                return r
            except Exception:
                self.W.db.execute("ROLLBACK")
                raise

    def tix_spend(self, uid: int, n: int, reason: str) -> int | None:
        """Ticket sarflash (giveaway). Yetmasa None."""
        if n <= 0:
            return None
        return self.tix_add(uid, -int(n), reason)

    def tix_today(self, uid: int, reason_prefix: str) -> int:
        r = self.W.db.execute("SELECT COALESCE(SUM(delta),0) FROM tlog WHERE uid=? AND reason LIKE ? AND ts>=? AND delta>0",
                              (int(uid), reason_prefix + "%", self.day_start())).fetchone()
        return int(r[0])

    # ------------------------------------------------------------ progress (serverdagi yozuvlardan)
    def _counts(self, uid: int) -> dict:
        db, uid, ds = self.W.db, int(uid), self.day_start()
        c = {"play": {}, "live": {}}
        for g, n in db.execute("SELECT game, COUNT(*) FROM plays WHERE uid=? AND ts>=? GROUP BY game", (uid, ds)).fetchall():
            c["play"][g] = n
        for g, n in db.execute("SELECT game, COUNT(*) FROM tx WHERE uid=? AND type='bet' AND ts>=? AND status='ok' GROUP BY game", (uid, ds)).fetchall():
            c["live"][g] = n
        c["dep_u"] = db.execute("SELECT COALESCE(SUM(delta),0) FROM tx WHERE uid=? AND type='deposit'", (uid,)).fetchone()[0]
        c["rkwin"] = bool(db.execute("SELECT 1 FROM tx WHERE uid=? AND type='win' AND game='rocket' LIMIT 1", (uid,)).fetchone())
        c["upever"] = bool(db.execute("SELECT 1 FROM plays WHERE uid=? AND game='upgrade' LIMIT 1", (uid,)).fetchone())
        r = db.execute("SELECT turnover FROM users WHERE id=?", (uid,)).fetchone()
        c["turn"] = (r[0] if r else 0) / 1e6
        c["claims"] = {(t, p) for t, p in db.execute("SELECT tid, period FROM tclaims WHERE uid=?", (uid,)).fetchall()}
        c["dep_tix"] = db.execute("SELECT COALESCE(SUM(tix),0) FROM tclaims WHERE uid=? AND tid='deposit'", (uid,)).fetchone()[0]
        return c

    def dep_ton(self, c: dict) -> float:
        """Jami depozit — haqiqiy TON'da (ilova balansi / kurs)."""
        rate = float(self.cfg("ton_rate") or 1) or 1
        return round(c["dep_u"] / 1e6 / rate, 4)

    def _prog(self, t: dict, c: dict, refs_today: int, chan_ok: bool | None) -> tuple[float, float]:
        s = t["src"]
        if s == "none":
            return 0, 0
        if s == "ref":
            return min(refs_today, t["need"]), t["need"]
        if s.startswith("play:"):
            n = sum(c["play"].get(g, 0) for g in s[5:].split(","))
            return min(n, t["need"]), t["need"]
        if s.startswith("live:"):
            return min(c["live"].get(s[5:], 0), t["need"]), t["need"]
        if s == "dep":
            return min(self.dep_ton(c), t["need"]), t["need"]
        if s == "win:rocket":
            return (1 if c["rkwin"] else 0), 1
        if s == "ever:upgrade":
            return (1 if c["upever"] else 0), 1
        if s == "vip":
            lvl = sum(1 for _, need, _ in VIP if c["turn"] >= need)
            return min(lvl, t["need"]), t["need"]
        if s == "chan":
            return (1 if chan_ok else 0), 0
        return 0, 0

    def state(self, uid: int, lang: int = 0, refs_today: int = 0, chan_ok: bool | None = None, chan_url: str = "") -> dict:
        c = self._counts(uid)
        dk = self.day_key()
        rate = float(self.cfg("tix_per_ton") or 0)

        def row(t, period):
            prog, need = self._prog(t, c, refs_today, chan_ok)
            done = (t["id"], period) in c["claims"]
            ready = (not done) and (prog >= need if need else (t["src"] != "chan" or bool(chan_ok)))
            if t["src"] == "chan" and not chan_url:
                return None
            r = {"id": t["id"], "n": t["n"][lang] if lang < len(t["n"]) else t["n"][0], "r": t["r"], "ic": t["ic"],
                 "st": "done" if done else ("claim" if ready else "go"), "go": t.get("go", "")}
            if need and t["src"] not in ("chan",):
                r["prog"], r["need"] = round(prog, 2), need
            if t["src"] == "chan":
                r["url"] = chan_url
            if t["src"] == "ref":
                r["act"] = "invite"
            if t["src"] == "dep":
                r["act"] = "dep"
            if t["src"] == "vip":
                r["act"] = "vip"
            return r

        daily = [x for x in (row(t, dk) for t in DAILY) if x]
        once = [x for x in (row(t, "once") for t in ONCE) if x]
        owed = int(self.dep_ton(c) * rate) - int(c["dep_tix"]) if rate > 0 else 0
        return {"tix": self.tix(uid), "daily": daily, "once": once, "reset": self.day_start() + 86400,
                "dep": {"rate": rate, "owed": max(0, owed), "total": self.dep_ton(c)}}

    def claim(self, uid: int, tid: str, refs_today: int = 0, chan_ok: bool | None = None, chan_url: str = "") -> dict:
        """Vazifa mukofotini beradi — faqat server hisoblagan progress yetarli bo'lsa. Bir davrda bir marta."""
        uid = int(uid)
        with self.W.lock:
            if not self.W._user(uid):
                self.W.ensure_user(uid)
            if tid == "deposit":
                rate = float(self.cfg("tix_per_ton") or 0)
                if rate <= 0:
                    raise ValueError("disabled")
                self.W._begin()
                try:
                    c = self._counts(uid)
                    owed = int(self.dep_ton(c) * rate) - int(c["dep_tix"])
                    if owed <= 0:
                        raise ValueError("nothing to claim")
                    period = "d" + str(time.time_ns())
                    self.W.db.execute("INSERT INTO tclaims(uid, tid, period, tix, ts) VALUES (?,?,?,?,?)", (uid, "deposit", period, owed, int(time.time())))
                    new = self._tix_apply(uid, owed, "task:deposit", None)
                    self.W.db.execute("COMMIT")
                except Exception:
                    self.W.db.execute("ROLLBACK")
                    raise
                return {"tix": new, "got": owed}
            t = ALL.get(tid)
            if not t:
                raise ValueError("unknown task")
            period = self.day_key() if t in DAILY else "once"
            self.W._begin()
            try:
                c = self._counts(uid)
                if (tid, period) in c["claims"]:
                    raise ValueError("already claimed")
                prog, need = self._prog(t, c, refs_today, chan_ok)
                if t["src"] == "chan":
                    if not chan_ok:
                        raise ValueError("subscribe first")
                elif need and prog < need:
                    raise ValueError("not completed yet")
                self.W.db.execute("INSERT INTO tclaims(uid, tid, period, tix, ts) VALUES (?,?,?,?,?)", (uid, tid, period, t["r"], int(time.time())))
                new = self._tix_apply(uid, t["r"], "task:" + tid, None)
                self.W.db.execute("COMMIT")
            except Exception:
                self.W.db.execute("ROLLBACK")
                raise
            return {"tix": new, "got": t["r"]}
