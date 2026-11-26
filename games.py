"""RIKI — o'yinlar SERVERDA: natija, to'lov va tekshiruv faqat shu yerda.

Telefon faqat "tikaman" deydi va server qaytargan natijani animatsiya qiladi.
Har raund bitta atomar tranzaksiya: tikish yechiladi → natija (provably fair) → yutuq yoziladi → tarixga tushadi.

Provably fair: har o'yinchining yashirin server seed'i bor (SHA-256 hash'i oldindan ko'rsatiladi),
client seed va nonce bilan birga sha256(f"{seed}:{client}:{nonce}:{cursor}") dan sonlar olinadi —
ilovadagi `minesFrom` bilan aynan bir xil algoritm, seed almashtirilgach har raundni tekshirish mumkin.
"""
from __future__ import annotations

import hashlib
import json
import math
import os
import secrets
import time
import uuid

from wallet import U, Wallet, WalletError, to_t, to_u

# ------------------------------------------------------------------ o'yin jadvallari (ilovadagi bilan bir xil)
RTP_DEF = {"mines": 97, "dice": 98, "upgrade": 95, "cases": 92, "plinko": 100, "spins": 100, "crafts": 100}
PL_M = {
    "easy": [10, 3, 1.6, 1.4, 1.1, 1, .5, 1, 1.1, 1.4, 1.6, 3, 10],
    "med": [33, 11, 4, 2, 1.1, .6, .3, .6, 1.1, 2, 4, 11, 33],
    "hard": [1000, 130, 26, 9, 4, 2, .2, .2, .2, .2, .2, 2, 4, 9, 26, 130, 1000],
}
SP_SYM = ['Hypno Lollipop', 'B-Day Candle', 'Jolly Chimp', 'Stellar Rocket', 'Artisan Brick', 'Scared Cat', 'Sharp Tongue', 'Precious Peach', 'Heart Locket']
SP_W = [22, 20, 17, 14, 11, 7, 5, 3, 1.2]
SP_PT = [[1.6, 3.5, 9], [2, 4.5, 11], [3, 6.5, 18], [4.4, 9, 26], [6.6, 13, 44], [11, 22, 88], [18, 44, 175], [35, 88, 440], [120, 280, 2500]]
CR_M = {"safe": {"x": 2, "ch": .47, "min": 2}, "normal": {"x": 8, "ch": .115, "min": 4}, "risky": {"x": 100, "ch": .0093, "min": 10}}
BOXES = {
    "farm": (0.1, ['Plush Pepe', 'Astral Shard', 'Ion Gem']), "autumn": (3.5, ["Durov's Cap", 'Mad Pumpkin', 'Spy Agaric']),
    "movie": (4, ['Mini Oscar', 'Vintage Cigar', 'Record Player']), "space": (6, ['Heart Locket', 'Stellar Rocket', 'Moon Pendant']),
    "telegram": (5, ['Input Key', "Durov's Cap", 'Star Notepad']), "adult": (7, ['Sharp Tongue', 'Sky Stilettos', 'Love Potion']),
    "money": (8, ['Loot Bag', 'Money Pot', 'Swag Bag']), "pepe": (15, ['Plush Pepe', 'Kissed Frog', 'Pet Snake']),
    "black": (20, ["Durov's Cap", 'Electric Skull', 'Scared Cat']), "onyx": (8, ['Plush Pepe', 'Swiss Watch', 'Top Hat']),
    "perfume": (2.5, ['Perfume Bottle', 'Eternal Rose', 'Love Candle']), "oscar": (2.5, ['Mini Oscar', 'Genie Lamp', 'Crystal Ball']),
    "magic": (5, ['Astral Shard', 'Magic Potion', 'Hex Pot']), "kitty": (5, ['Scared Cat', 'Witch Hat', 'Mad Pumpkin']),
    "gem": (8, ['Ion Gem', 'Gem Signet', 'Astral Shard']), "cap": (15, ["Durov's Cap", 'Top Hat', 'Jester Hat']),
    "ring": (15, ['Nail Bracelet', 'Signet Ring', 'Bonded Ring']), "epic": (40, ['Plush Pepe', 'Heart Locket', 'Precious Peach']),
    "elite": (100, ['Heart Locket', 'Plush Pepe', "Durov's Cap"]),
    "free": (0, ['Hypno Lollipop', 'Neko Helmet', 'Desk Calendar']),
}
TOPC = ['Plush Pepe', 'Heart Locket', "Durov's Cap", 'Scared Cat', 'Precious Peach', 'Heroic Helmet', 'Loot Bag', 'Astral Shard']
BOOSTS = [1, 3, 10, 20, 50, 100]
DAILY_R = ['Nail Bracelet', 'Bonded Ring', 'Signet Ring', 'Diamond Ring', 'Swiss Watch', 'Toy Bear', 'Jolly Chimp', 'Lush Bouquet', 'Chill Flame', 'Hypno Lollipop']
CASES = {"free": (0, 'Hypno Lollipop', 2, 12), "start": (2, 'Desk Calendar', .4, 25), "rare": (8, 'Toy Bear', 2, 90),
         "epic": (30, 'Magic Potion', 5, 400), "leg": (120, "Durov's Cap", 20, 1600), "pepe": (600, 'Plush Pepe', 60, 9000)}
DAY = 24 * 3600
MIN_BET = 0.1


def r2(x: float) -> float:
    return math.floor(x * 100 + 1e-9) / 100 if x >= 0 else -math.floor(-x * 100 + 1e-9) / 100


def rnd2(x: float) -> float:
    return round(x + 1e-12, 2)


# ------------------------------------------------------------------ katalog (ilova bilan bir xil narxlar)
class Catalog:
    def __init__(self, path: str):
        self.path = path
        d = json.load(open(path, encoding="utf-8"))
        self.ts = d.get("ts", 0)
        self.gifts = [self._mk(i, r) for i, r in enumerate(d["gifts"])]
        self._index()

    @staticmethod
    def _mk(i, r):
        n, sh, p, e, mods = (list(r) + [None] * 5)[:5]
        return {"i": i, "n": n, "sh": sh, "p": float(p), "e": e or "🎁", "mods": [list(m) for m in (mods or [])]}

    def _index(self):
        self.by_sh = {g["sh"]: g for g in self.gifts}
        self.by_n = {g["n"]: g for g in self.gifts}
        self.byprice = sorted(self.gifts, key=lambda g: g["p"])
        nf = []
        for g in self.gifts:
            nf.append({"g": g, "m": None, "ms": None, "p": g["p"]})
            for m, ms, mp in g["mods"]:
                if mp >= g["p"] * .6:
                    nf.append({"g": g, "m": m, "ms": ms, "p": float(mp)})
        self.nfts = sorted(nf, key=lambda x: x["p"])

    def name(self, n: str):
        return self.by_n.get(n) or self.by_n.get(n.replace("'", "’"))

    def nft_for(self, v: float):
        best = None
        for x in self.nfts:
            if x["p"] <= v + 1e-9:
                best = x
            else:
                break
        return best

    def apply_live(self, d: dict) -> int:
        """GitHub Gifts_Details.json — ilovadagi loadLivePrices bilan aynan bir xil o'zgartirish."""
        n = 0
        for x in d.get("upgraded") or []:
            fp = float(x.get("floor_price_ton") or 0)
            if fp <= 0:
                continue
            g = self.by_sh.get(x.get("short_name"))
            if g:
                k = fp / g["p"] if g["p"] else 1
                g["p"] = round(fp, 2)
                for mm in g["mods"]:
                    mm[2] = round(mm[2] * min(3, max(.33, k)), 2)
            else:
                self.gifts.append(self._mk(len(self.gifts), [x.get("full_name", "").replace("’", "'"), x.get("short_name"), fp, "🎁", []]))
            n += 1
        self.ts = int(d.get("last_updated") or time.time())
        self._index()
        return n

    def public(self) -> dict:
        return {"ts": self.ts, "gifts": [[g["n"], g["sh"], g["p"], g["e"], g["mods"]] for g in self.gifts]}


# ------------------------------------------------------------------ provably fair
def pf_floats(seed: str, client: str, nonce: int):
    """ilovadagi minesFrom generatori: sha256(seed:client:nonce:cursor) dan 8 hex'lik bo'laklar."""
    cur, buf = 0, ""
    while True:
        if len(buf) < 8:
            buf += hashlib.sha256(f"{seed}:{client}:{nonce}:{cur}".encode()).hexdigest()
            cur += 1
        v = int(buf[:8], 16) / 4294967296
        buf = buf[8:]
        yield v


def mines_from(seed: str, client: str, nonce: int, n: int) -> list[int]:
    idx = list(range(25))
    g = pf_floats(seed, client, nonce)
    for i in range(24, 0, -1):
        j = int(next(g) * (i + 1))
        idx[i], idx[j] = idx[j], idx[i]
    return sorted(idx[:n])


def weighted(outs: list, f: float, key="w"):
    r = f
    for o in outs:
        if r < o[key]:
            return o
        r -= o[key]
    return outs[0]


# ------------------------------------------------------------------ o'yin dvigateli
class Games:
    def __init__(self, wallet: Wallet, catalog: Catalog, rtp_fn=None, off_fn=None):
        self.W = wallet
        self.C = catalog
        self.rtp_fn = rtp_fn or (lambda: {})
        self.off_fn = off_fn or (lambda: [])
        db = self.W.db
        with self.W.lock:
            db.executescript("""
            CREATE TABLE IF NOT EXISTS seeds (uid INTEGER PRIMARY KEY, seed TEXT NOT NULL, client TEXT NOT NULL, nonce INTEGER NOT NULL DEFAULT 0,
                                              prev_seed TEXT, prev_hash TEXT, prev_client TEXT, prev_nonce INTEGER);
            CREATE TABLE IF NOT EXISTS gstate (uid INTEGER NOT NULL, game TEXT NOT NULL, state TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY(uid, game));
            CREATE TABLE IF NOT EXISTS plays (id TEXT PRIMARY KEY, uid INTEGER NOT NULL, game TEXT NOT NULL, bet INTEGER NOT NULL, pay INTEGER NOT NULL,
                                              mult REAL, detail TEXT, hash TEXT, client TEXT, nonce INTEGER, ts INTEGER NOT NULL);
            CREATE INDEX IF NOT EXISTS ix_plays_uid ON plays(uid, ts DESC);
            CREATE INDEX IF NOT EXISTS ix_plays_game ON plays(game, ts DESC);
            """)

    # ---- yordamchi
    def rtp(self, g: str) -> float:
        return float({**RTP_DEF, **(self.rtp_fn() or {})}.get(g, 100)) / 100

    def _check_on(self, g: str):
        if g in (self.off_fn() or []):
            raise WalletError("off", "This game is temporarily disabled")

    def _seed(self, uid: int) -> dict:
        r = self.W.db.execute("SELECT * FROM seeds WHERE uid=?", (uid,)).fetchone()
        if not r:
            s, c = secrets.token_hex(32), secrets.token_hex(8)
            self.W.db.execute("INSERT INTO seeds(uid, seed, client, nonce) VALUES (?,?,?,0)", (uid, s, c))
            r = self.W.db.execute("SELECT * FROM seeds WHERE uid=?", (uid,)).fetchone()
        return dict(r)

    def _next(self, uid: int) -> tuple[str, str, int, str]:
        s = self._seed(uid)
        nonce = s["nonce"] + 1
        self.W.db.execute("UPDATE seeds SET nonce=? WHERE uid=?", (nonce, uid))
        return s["seed"], s["client"], nonce, hashlib.sha256(s["seed"].encode()).hexdigest()

    def fair(self, uid: int) -> dict:
        with self.W.lock:
            s = self._seed(int(uid))
        return {"hash": hashlib.sha256(s["seed"].encode()).hexdigest(), "client": s["client"], "nonce": s["nonce"],
                "prev": {"seed": s["prev_seed"], "hash": s["prev_hash"], "client": s["prev_client"], "nonce": s["prev_nonce"]} if s["prev_seed"] else None}

    def rotate(self, uid: int, client: str | None = None) -> dict:
        """Seed almashtirish: eski seed ochiladi (barcha o'tgan raundlarni tekshirish mumkin), yangisi yashirin."""
        uid = int(uid)
        with self.W.lock:
            if self.W.db.execute("SELECT 1 FROM gstate WHERE uid=? AND game='mines'", (uid,)).fetchone():
                raise WalletError("busy", "Finish the current Mines round first")
            s = self._seed(uid)
            c = (client or "").strip()[:32] or secrets.token_hex(8)
            self.W.db.execute("UPDATE seeds SET prev_seed=?, prev_hash=?, prev_client=?, prev_nonce=?, seed=?, client=?, nonce=0 WHERE uid=?",
                              (s["seed"], hashlib.sha256(s["seed"].encode()).hexdigest(), s["client"], s["nonce"], secrets.token_hex(32), c, uid))
        return self.fair(uid)

    def _stake(self, uid: int, amount: float, ids: list, game: str, min_bet: float = MIN_BET) -> tuple[int, list]:
        """Tranzaksiya ichida: TON yoki sovg'alarni yechadi. Server qiymatini (micro) qaytaradi."""
        amt = to_u(amount or 0)
        ids = [str(i) for i in (ids or [])][:20]
        if amt < 0:
            raise WalletError("bad", "Bad amount")
        if ids and amt:
            raise WalletError("bad", "Bet either TON or gifts")
        if ids:
            rows = self.W.db.execute(f"SELECT * FROM items WHERE uid=? AND id IN ({','.join('?' * len(ids))})", (uid, *ids)).fetchall()
            if len(rows) != len(set(ids)):
                raise WalletError("no_item", "Gift not found in your backpack")
            self.W.db.execute(f"DELETE FROM items WHERE uid=? AND id IN ({','.join('?' * len(ids))})", (uid, *ids))
            v = sum(r["v"] for r in rows)
            self.W._apply(uid, 0, "bet", f"{game} gift bet", game, "game", items=[{"id": r["id"], "sh": r["sh"], "v": to_t(r["v"]), "out": 1} for r in rows])
            self.W.db.execute("UPDATE users SET turnover=turnover+? WHERE id=?", (v, uid))
            return v, [r["id"] for r in rows]
        if amt < to_u(min_bet):
            raise WalletError("min", f"Minimum bet {min_bet:g}")
        self.W._apply(uid, -amt, "bet", f"{game} bet", game, "game")
        return amt, []

    def _give(self, uid: int, g: dict, value: float, m=None, ms=None, src="game") -> dict:
        return self.W._ins_item(uid, {"sh": g["sh"], "nm": g["n"], "v": value, "m": m, "ms": ms}, src)

    def _pay(self, uid: int, pay_u: int, game: str, as_nft: bool = True) -> tuple[list, int]:
        """Yutuq: summaga mos eng qimmat NFT (≤ yutuq) + qoldiq balansga. (berilgan sovg'alar, balansga tushgan micro)"""
        if pay_u <= 0:
            return [], 0
        items, cash = [], pay_u
        if as_nft:
            nf = self.C.nft_for(to_t(pay_u))
            if nf:
                items.append(self._give(uid, nf["g"], nf["p"], nf["m"], nf["ms"]))
                cash = max(0, pay_u - to_u(nf["p"]))
        if cash > 0:
            self.W._apply(uid, cash, "win", f"{game} win", game, "game", items=[{**i, "in": 1} for i in items])
        elif items:
            self.W._apply(uid, 0, "win", f"{game} win", game, "game", items=[{**i, "in": 1} for i in items])
        return items, cash

    def _log(self, uid, game, bet_u, pay_u, mult, detail, h="", client="", nonce=0) -> str:
        pid = uuid.uuid4().hex[:12]
        self.W.db.execute("INSERT INTO plays(id, uid, game, bet, pay, mult, detail, hash, client, nonce, ts) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                          (pid, uid, game, bet_u, pay_u, mult, json.dumps(detail)[:4000], h, client, nonce, int(time.time() * 1000)))
        return pid

    def _run(self, uid: int, fn):
        """Bitta atomar raund."""
        uid = int(uid)
        with self.W.lock:
            if not self.W._user(uid):
                raise WalletError("no_user", "User not found")
            self.W._begin()
            try:
                bal0 = self.W._user(uid)["bal"]
                res = fn()
                u = self.W._user(uid)
                if u["status"] != "active":
                    raise WalletError("banned", "Account blocked")
                self.W.db.execute("COMMIT")
            except Exception:
                self.W.db.execute("ROLLBACK")
                raise
        res["bal"] = to_t(u["bal"])
        res.setdefault("bal0", to_t(bal0))
        return res

    # ================================================================ DICE
    def dice(self, uid: int, amount: float, items: list, over: bool, t: float) -> dict:
        self._check_on("dice")
        t = round(float(t), 2)
        if not 2 <= t <= 98:
            raise WalletError("bad", "Target must be between 2 and 98")
        uid = int(uid)

        def fn():
            stake, used = self._stake(uid, amount, items, "dice")
            bal_after = self.W._user(uid)["bal"]
            seed, client, nonce, h = self._next(uid)
            ch = round(100 - t if over else t, 2)
            m = self.rtp("dice") * 100 / ch
            r = math.floor(next(pf_floats(seed, client, nonce)) * 10001) / 100
            win = r > t if over else r < t
            pay = int(stake * m) if win else 0
            got, cash = self._pay(uid, pay, "dice")
            self._log(uid, "dice", stake, pay, round(m, 4) if win else 0, {"t": t, "over": over, "r": r}, h, client, nonce)
            return {"r": r, "win": win, "m": round(m, 4), "pay": to_t(pay), "items": got, "cash": to_t(cash), "used": used,
                    "bal0": to_t(bal_after), "hash": h, "nonce": nonce}
        return self._run(uid, fn)

    # ================================================================ MINES (bosqichma-bosqich, holat serverda)
    def mines_mul(self, n: int, k: int) -> float:
        m = 1.0
        for i in range(k):
            m *= (25 - i) / (25 - n - i)
        return math.floor(m * self.rtp("mines") * 100) / 100

    def _mstate(self, uid: int) -> dict | None:
        r = self.W.db.execute("SELECT state FROM gstate WHERE uid=? AND game='mines'", (uid,)).fetchone()
        return json.loads(r["state"]) if r else None

    def mines_state(self, uid: int) -> dict | None:
        with self.W.lock:
            s = self._mstate(int(uid))
        return {"on": True, "n": s["n"], "bet": to_t(s["bet"]), "open": s["open"], "hash": s["hash"], "nonce": s["nonce"]} if s else None

    def mines_start(self, uid: int, amount: float, items: list, n: int) -> dict:
        self._check_on("mines")
        n = int(n)
        if not 1 <= n <= 24:
            raise WalletError("bad", "Mines: 1–24")
        uid = int(uid)

        def fn():
            if self._mstate(uid):
                raise WalletError("busy", "Finish the current round first")
            stake, used = self._stake(uid, amount, items, "mines")
            seed, client, nonce, h = self._next(uid)
            st = {"bet": stake, "n": n, "mines": mines_from(seed, client, nonce, n), "open": [], "seed": seed, "client": client, "nonce": nonce, "hash": h}
            self.W.db.execute("INSERT INTO gstate(uid, game, state, ts) VALUES (?,?,?,?)", (uid, "mines", json.dumps(st), int(time.time())))
            return {"on": True, "n": n, "bet": to_t(stake), "used": used, "hash": h, "nonce": nonce, "next": self.mines_mul(n, 1)}
        return self._run(uid, fn)

    def mines_pick(self, uid: int, i: int) -> dict:
        uid, i = int(uid), int(i)
        if not 0 <= i < 25:
            raise WalletError("bad", "Bad cell")

        def fn():
            st = self._mstate(uid)
            if not st:
                raise WalletError("no_round", "No active round")
            if i in st["open"]:
                return {"gem": True, "open": st["open"], "dup": True}
            st["open"].append(i)
            if i in st["mines"]:
                return self._mines_end(uid, st, lost=True, hit=i)
            k = len(st["open"])
            if k == 25 - st["n"]:
                return self._mines_end(uid, st, lost=False)
            self.W.db.execute("UPDATE gstate SET state=? WHERE uid=? AND game='mines'", (json.dumps(st), uid))
            return {"gem": True, "open": st["open"], "mult": self.mines_mul(st["n"], k), "next": self.mines_mul(st["n"], k + 1)}
        return self._run(uid, fn)

    def mines_cashout(self, uid: int) -> dict:
        uid = int(uid)

        def fn():
            st = self._mstate(uid)
            if not st:
                raise WalletError("no_round", "No active round")
            if not st["open"]:
                raise WalletError("bad", "Open at least one tile")
            return self._mines_end(uid, st, lost=False)
        return self._run(uid, fn)

    def _mines_end(self, uid: int, st: dict, lost: bool, hit: int | None = None) -> dict:
        k = len(st["open"]) - (1 if lost else 0)
        m = 0 if lost else self.mines_mul(st["n"], k)
        pay = 0 if lost else int(st["bet"] * m)
        got, cash = self._pay(uid, pay, "mines")
        self.W.db.execute("DELETE FROM gstate WHERE uid=? AND game='mines'", (uid,))
        self._log(uid, "mines", st["bet"], pay, m, {"n": st["n"], "open": st["open"], "mines": st["mines"], "hit": hit}, st["hash"], st["client"], st["nonce"])
        return {"gem": not lost, "end": True, "lost": lost, "hit": hit, "mines": st["mines"], "open": st["open"], "mult": m, "pay": to_t(pay),
                "items": got, "cash": to_t(cash), "seed": None}

    # ================================================================ PLINKO
    def plinko(self, uid: int, amount: float, d: str) -> dict:
        self._check_on("plinko")
        if d not in PL_M:
            raise WalletError("bad", "Bad difficulty")
        uid = int(uid)
        M = PL_M[d]

        def fn():
            stake, _ = self._stake(uid, amount, [], "plinko", min_bet=0.05)
            bal_after = self.W._user(uid)["bal"]
            seed, client, nonce, h = self._next(uid)
            g = pf_floats(seed, client, nonce)
            bits = [1 if next(g) < .5 else 0 for _ in range(len(M) - 1)]
            slot = sum(bits)
            m = M[slot]
            pay = int(stake * m * self.rtp("plinko"))
            got, cash = self._pay(uid, pay, "plinko")
            self._log(uid, "plinko", stake, pay, m, {"d": d, "bits": bits, "slot": slot}, h, client, nonce)
            return {"bits": bits, "slot": slot, "m": m, "pay": to_t(pay), "items": got, "cash": to_t(cash), "bal0": to_t(bal_after)}
        return self._run(uid, fn)

    # ================================================================ SPINS (free spins holati serverda)
    def spins_state(self, uid: int) -> dict:
        with self.W.lock:
            r = self.W.db.execute("SELECT state FROM gstate WHERE uid=? AND game='spins'", (int(uid),)).fetchone()
        s = json.loads(r["state"]) if r else {}
        return {"free": s.get("free", 0), "mul": s.get("mul", 1), "bet": to_t(s.get("bet", 0))}

    def spins(self, uid: int, bet: float, dc: bool, buy: bool = False) -> dict:
        self._check_on("spins")
        uid = int(uid)
        bet = rnd2(float(bet))
        if not 0.05 <= bet <= 500:
            raise WalletError("bad", "Bet 0.05 – 500")

        def fn():
            r = self.W.db.execute("SELECT state FROM gstate WHERE uid=? AND game='spins'", (uid,)).fetchone()
            st = json.loads(r["state"]) if r else {"free": 0, "mul": 1, "bet": 0}
            if buy:
                if st["free"] > 0:
                    raise WalletError("busy", "Free spins in progress")
                cost, _ = self._stake(uid, rnd2(bet * 100), [], "spins")
                st = {"free": 10, "mul": 10, "bet": to_u(bet)}
                self.W.db.execute("INSERT OR REPLACE INTO gstate(uid, game, state, ts) VALUES (?,?,?,?)", (uid, "spins", json.dumps(st), int(time.time())))
                self._log(uid, "spins", cost, 0, 0, {"buy": True})
                return {"bought": True, "free": 10, "mul": 10}
            free = st["free"] > 0
            if free:
                b_u, mul, cost = st["bet"], st["mul"], 0
            else:
                b_u, mul = to_u(bet), 1
                cost, _ = self._stake(uid, rnd2(bet * (1.25 if dc else 1)), [], "spins", min_bet=0.05)
            bal_after = self.W._user(uid)["bal"]
            seed, client, nonce, h = self._next(uid)
            g = pf_floats(seed, client, nonce)
            tot = sum(SP_W)

            def roll():
                out = []
                for _ in range(25):
                    x, k = next(g) * tot, 0
                    while x >= SP_W[k]:
                        x -= SP_W[k]; k += 1
                    out.append(k)
                return out

            def ev(grid):
                c = [0] * 9
                for k in grid:
                    c[k] += 1
                w, wins = 0.0, []
                for k, n in enumerate(c):
                    if n >= 8:
                        w += SP_PT[k][2 if n >= 12 else 1 if n >= 10 else 0]; wins.append(k)
                return w, wins
            grid = roll(); w, wins = ev(grid)
            if dc and not free and not w and next(g) < .3:
                grid = roll(); w, wins = ev(grid)
            pay = int(w * b_u * mul * self.rtp("spins"))
            got, cash = self._pay(uid, pay, "spins")
            if free:
                st["free"] -= 1
                if st["free"] <= 0:
                    self.W.db.execute("DELETE FROM gstate WHERE uid=? AND game='spins'", (uid,))
                else:
                    self.W.db.execute("UPDATE gstate SET state=? WHERE uid=? AND game='spins'", (json.dumps(st), uid))
            self._log(uid, "spins", cost, pay, round(pay / b_u, 4) if b_u else 0, {"grid": grid, "wins": wins, "free": free}, h, client, nonce)
            return {"grid": grid, "wins": wins, "w": w, "mul": mul, "pay": to_t(pay), "items": got, "cash": to_t(cash), "free": max(0, st.get("free", 0)) if free else 0,
                    "wasFree": free, "bal0": to_t(bal_after), "bet": to_t(b_u)}
        return self._run(uid, fn)

    # ================================================================ UPGRADE
    def upgrade(self, uid: int, amount: float, items: list, target_sh: str) -> dict:
        self._check_on("upgrade")
        uid = int(uid)
        tg = self.C.by_sh.get(target_sh)
        if not tg:
            raise WalletError("bad", "Unknown target gift")
        if len(items or []) > 1:
            raise WalletError("bad", "Upgrade one gift at a time")

        def fn():
            stake, used = self._stake(uid, amount, items, "upgrade")
            fv = to_t(stake)
            if not (tg["p"] > fv * 1.05 and tg["p"] <= fv * 200):
                raise WalletError("bad", "Target must be worth more than your gift (up to 200x)")
            ch = min(90.0, max(.5, fv / tg["p"] * self.rtp("upgrade") * 100))
            bal_after = self.W._user(uid)["bal"]
            seed, client, nonce, h = self._next(uid)
            r = next(pf_floats(seed, client, nonce)) * 100
            win = r < ch
            got = [self._give(uid, tg, tg["p"])] if win else []
            if win:
                self.W._apply(uid, 0, "win", "upgrade win", "upgrade", "game", items=[{**got[0], "in": 1}])
            self._log(uid, "upgrade", stake, to_u(tg["p"]) if win else 0, round(tg["p"] / fv, 4) if win else 0, {"to": tg["sh"], "ch": ch, "r": r}, h, client, nonce)
            return {"win": win, "ch": round(ch, 4), "r": round(r, 4), "items": got, "used": used, "bal0": to_t(bal_after), "pay": tg["p"] if win else 0}
        return self._run(uid, fn)

    # ================================================================ CRAFTS
    def craft_target(self, tot: float, mode: str) -> dict:
        t = tot * CR_M[mode]["x"]
        best = None
        for g in self.C.byprice:
            if tot < g["p"] <= t:
                best = g
        return best or next((g for g in self.C.byprice if g["p"] > tot), self.C.byprice[-1])

    def crafts(self, uid: int, items: list, mode: str) -> dict:
        self._check_on("crafts")
        if mode not in CR_M:
            raise WalletError("bad", "Bad mode")
        if not 2 <= len(items or []) <= 10:
            raise WalletError("bad", "Use 2–10 gifts")
        uid = int(uid)
        M = CR_M[mode]

        def fn():
            stake, used = self._stake(uid, 0, items, "crafts")
            tot = to_t(stake)
            if tot < M["min"]:
                raise WalletError("min", f"Min cost {M['min']}")
            t = self.craft_target(tot, mode)
            ch = M["ch"] * min(1, tot * M["x"] / t["p"]) * self.rtp("crafts")
            seed, client, nonce, h = self._next(uid)
            win = next(pf_floats(seed, client, nonce)) < ch
            got = [self._give(uid, t, t["p"])] if win else []
            if win:
                self.W._apply(uid, 0, "win", "craft win", "crafts", "game", items=[{**got[0], "in": 1}])
            self._log(uid, "crafts", stake, to_u(t["p"]) if win else 0, round(t["p"] / tot, 4) if win else 0, {"mode": mode, "to": t["sh"], "ch": ch}, h, client, nonce)
            return {"win": win, "to": t["sh"], "ch": round(ch * 100, 3), "items": got, "used": used}
        return self._run(uid, fn)

    # ================================================================ QUTILAR / DAILY BOX / KASELAR
    def box_pool(self, art: list, cost: float) -> list:
        seen = {}
        for n in list(art) + TOPC:
            g = self.C.name(n)
            if g:
                seen[g["n"]] = g
        for g in [g for g in self.C.byprice if g["p"] <= max(6, cost * 3)][:10]:
            seen[g["n"]] = g
        return list(seen.values())

    def box_odds(self, box_id: str, boost: int = 1) -> list:
        if box_id not in BOXES:
            raise WalletError("bad", "Unknown box")
        p, art = BOXES[box_id]
        if boost not in BOOSTS or (boost > 1 and p > 0.1):
            raise WalletError("bad", "Boost is only available for the 0.1 box")
        cost = p * boost
        outs = [{"sh": g["sh"], "v": g["p"]} for g in self.box_pool(art, p)]
        if 0 < p <= 0.1:
            # Farm (BOOST): sovg'a yoki hech narsa — Epic videosi 408.mp4 0:36–0:46 ("Not This Time")
            w = [1 / o["v"] for o in outs]; s = sum(w)
            evv = sum(o["v"] * w[j] / s for j, o in enumerate(outs))
            q = min(1.0, cost * self.rtp("cases") / evv)
            for j, o in enumerate(outs):
                o["w"] = q * w[j] / s
            outs.append({"none": True, "v": 0, "w": 1 - q})
            return outs
        for k in (.15, .35, .6, .9, 1.4, 2.5):
            outs.append({"bal": True, "v": max(.01, round(cost * k, 2))})
        target = cost * self.rtp("cases")
        lo, hi, a = 0.0, 8.0, 1.0
        for _ in range(50):
            a = (lo + hi) / 2
            w = [o["v"] ** -a for o in outs]; s = sum(w)
            evv = sum(o["v"] * w[j] / s for j, o in enumerate(outs))
            if evv > target:
                lo = a
            else:
                hi = a
        w = [o["v"] ** -a for o in outs]; s = sum(w)
        for j, o in enumerate(outs):
            o["w"] = w[j] / s
        return outs

    def daily_odds(self) -> list:
        outs = []
        for n in DAILY_R:
            g = self.C.name(n)
            if g:
                outs.append({"sh": g["sh"], "v": g["p"], "w": .00025 * min(4, 20 / g["p"])})
        for v, w in ((.01, .5), (.02, .25), (.05, .12), (.1, .06), (.25, .03), (1, .005)):
            outs.append({"bal": True, "v": v, "w": w})
        s = sum(o["w"] for o in outs)
        for o in outs:
            o["w"] /= s
        return outs

    def _box_pay(self, uid: int, o: dict, f: float, game: str) -> tuple[list, float]:
        if o.get("none"):
            return [], 0.0
        if o.get("bal"):
            self.W._apply(uid, to_u(o["v"]), "win", f"{game} win", game, "game")
            return [], o["v"]
        g = self.C.by_sh[o["sh"]]
        mods = [m for m in g["mods"] if m[2] <= g["p"] * 1.6]
        md = mods[int(f * 10007) % len(mods)] if mods and (f * 7919) % 1 < .7 else None
        it = self._give(uid, g, g["p"], md[0] if md else None, md[1] if md else None)
        self.W._apply(uid, 0, "win", f"{game} win", game, "game", items=[{**it, "in": 1}])
        return [it], 0.0

    def box(self, uid: int, box_id: str, boost: int = 1) -> dict:
        self._check_on("cases")
        uid = int(uid)
        boost = int(boost or 1)
        outs = self.box_odds(box_id, boost)
        p = BOXES[box_id][0]

        def fn():
            if box_id == "free":
                r = self.W.db.execute("SELECT state FROM gstate WHERE uid=? AND game='freebox'", (uid,)).fetchone()
                if not r:
                    raise WalletError("promo", "Enter a promo code to open the Free box")
                self.W.db.execute("DELETE FROM gstate WHERE uid=? AND game='freebox'", (uid,))
                stake = 0
            else:
                stake, _ = self._stake(uid, rnd2(p * boost), [], "cases", min_bet=0.01)
            bal_after = self.W._user(uid)["bal"]
            seed, client, nonce, h = self._next(uid)
            g = pf_floats(seed, client, nonce)
            f = next(g)
            idx = 0
            acc = f
            for j, o in enumerate(outs):
                if acc < o["w"]:
                    idx = j; break
                acc -= o["w"]
            o = outs[idx]
            got, cash = self._box_pay(uid, o, next(g), "cases")
            val = o["v"]
            self._log(uid, "cases", stake, to_u(val), round(val / to_t(stake), 4) if stake else 0, {"box": box_id, "boost": boost, "out": idx}, h, client, nonce)
            return {"out": idx, "o": o, "items": got, "cash": cash, "bal0": to_t(bal_after)}
        return self._run(uid, fn)

    def daily(self, uid: int) -> dict:
        uid = int(uid)
        outs = self.daily_odds()

        def fn():
            r = self.W.db.execute("SELECT ts FROM plays WHERE uid=? AND game='daily' ORDER BY ts DESC LIMIT 1", (uid,)).fetchone()
            if r and time.time() * 1000 - r["ts"] < DAY * 1000:
                raise WalletError("too_early", "Come back later")
            seed, client, nonce, h = self._next(uid)
            g = pf_floats(seed, client, nonce)
            f = next(g)
            idx, acc = 0, f
            for j, o in enumerate(outs):
                if acc < o["w"]:
                    idx = j; break
                acc -= o["w"]
            o = outs[idx]
            got, cash = self._box_pay(uid, o, next(g), "daily")
            self._log(uid, "daily", 0, to_u(o["v"]), 0, {"out": idx}, h, client, nonce)
            return {"out": idx, "o": o, "items": got, "cash": cash, "next": int(time.time() * 1000) + DAY * 1000}
        return self._run(uid, fn)

    def daily_next(self, uid: int) -> int:
        with self.W.lock:
            r = self.W.db.execute("SELECT ts FROM plays WHERE uid=? AND game='daily' ORDER BY ts DESC LIMIT 1", (int(uid),)).fetchone()
        return (r["ts"] + DAY * 1000) if r else 0

    def grant_freebox(self, uid: int) -> None:
        with self.W.lock:
            self.W.db.execute("INSERT OR REPLACE INTO gstate(uid, game, state, ts) VALUES (?,?,?,?)", (int(uid), "freebox", "{}", int(time.time())))

    def case_drops(self, cid: str) -> list:
        p, _, lo_v, hi_v = CASES[cid]
        lst = [g for g in self.C.gifts if lo_v <= g["p"] <= hi_v]
        if not lst:
            return []
        if not p:
            w = [1 / g["p"] ** 2 for g in lst]; s = sum(w)
            return [{"sh": g["sh"], "v": g["p"], "w": w[i] / s} for i, g in enumerate(lst)]
        lo, hi, a = 0.0, 5.0, 1.0
        for _ in range(40):
            a = (lo + hi) / 2
            w = [g["p"] ** -a for g in lst]; s = sum(w)
            evv = sum(g["p"] * w[i] / s for i, g in enumerate(lst))
            if evv > p * .92:
                lo = a
            else:
                hi = a
        w = [g["p"] ** -a for g in lst]; s = sum(w)
        return sorted([{"sh": g["sh"], "v": g["p"], "w": w[i] / s} for i, g in enumerate(lst)], key=lambda x: -x["v"])

    def case(self, uid: int, cid: str) -> dict:
        self._check_on("cases")
        if cid not in CASES:
            raise WalletError("bad", "Unknown case")
        uid = int(uid)
        drops = self.case_drops(cid)
        p = CASES[cid][0]

        def fn():
            if not p:
                r = self.W.db.execute("SELECT ts FROM plays WHERE uid=? AND game='freecase' ORDER BY ts DESC LIMIT 1", (uid,)).fetchone()
                if r and time.time() * 1000 - r["ts"] < DAY * 1000:
                    raise WalletError("too_early", "Free case is available once a day")
                stake = 0
            else:
                stake, _ = self._stake(uid, p, [], "cases")
            seed, client, nonce, h = self._next(uid)
            g = pf_floats(seed, client, nonce)
            o = weighted(drops, next(g))
            gg = self.C.by_sh[o["sh"]]
            v = round(gg["p"] * (.95 + next(g) * .3), 2)
            it = self._give(uid, gg, v)
            self.W._apply(uid, 0, "win", "case win", "cases", "game", items=[{**it, "in": 1}])
            self._log(uid, "freecase" if not p else "cases", stake, to_u(v), round(v / to_t(stake), 4) if stake else 0, {"case": cid, "sh": gg["sh"]}, h, client, nonce)
            return {"sh": gg["sh"], "v": v, "items": [it]}
        return self._run(uid, fn)

    # ================================================================ tarix va statistika
    def history(self, uid: int, game: str | None = None, limit: int = 30) -> list:
        q, a = "SELECT * FROM plays WHERE uid=?", [int(uid)]
        if game:
            q += " AND game=?"; a.append(game)
        q += " ORDER BY ts DESC LIMIT ?"; a.append(limit)
        with self.W.lock:
            rows = self.W.db.execute(q, a).fetchall()
        return [{"id": r["id"], "game": r["game"], "bet": to_t(r["bet"]), "pay": to_t(r["pay"]), "mult": r["mult"], "t": r["ts"],
                 "hash": r["hash"], "client": r["client"], "nonce": r["nonce"], "d": json.loads(r["detail"] or "{}")} for r in rows]

    def game_stats(self, since_ms: int = 0) -> list:
        with self.W.lock:
            rows = self.W.db.execute("SELECT game, COUNT(*) n, SUM(bet) b, SUM(pay) p, COUNT(DISTINCT uid) u FROM plays WHERE ts>=? GROUP BY game ORDER BY b DESC",
                                     (since_ms,)).fetchall()
        return [{"game": r["game"], "n": r["n"], "bet": to_t(r["b"] or 0), "pay": to_t(r["p"] or 0), "users": r["u"],
                 "rtp": round((r["p"] or 0) / r["b"] * 100, 1) if r["b"] else 0} for r in rows]
