"""
RIKI backend v9
  - Stars + TON depozit, promokod, referal, push
  - Jonli CRASH xonasi (WebSocket /ws, provably fair), umumiy chat
  - Haftalik turnir / klan urushi, klanlar, P2P market, sovg'a yuborish (inbox)
  - Katta admin panel: /admin?key=ADMIN_KEY

O'rnatish:   pip install aiogram aiohttp
Env:         BOT_TOKEN, TON_WALLET, ADMIN_KEY (majburiy), TONCENTER_KEY (ixtiyoriy), PORT, DB_PATH
Ishga tushirish: python deposit_backend.py   (Render: persistent disk ulang, DB_PATH=/data/ledger.json)

MUHIM: balans mijozda (demo) saqlanadi. Server faqat depozit, reyting, klan, market va crash xonasini yuritadi.
Haqiqiy pul bilan qimor o'yinlari Telegram qoidalari va ko'p mamlakatlar qonunlariga zid bo'lishi mumkin.
"""
import os, json, hmac, hashlib, time, asyncio, html, datetime, secrets, math, csv, io
from urllib.parse import parse_qsl
import aiohttp
from aiohttp import web
from aiogram import Bot, Dispatcher, F
from aiogram.types import LabeledPrice, PreCheckoutQuery, Message

BOT_TOKEN = os.environ["BOT_TOKEN"]
TON_WALLET = os.environ["TON_WALLET"]
ADMIN_KEY = os.environ.get("ADMIN_KEY", "")
ADMIN_TOTP = os.environ.get("ADMIN_TOTP", "")  # ixtiyoriy: base32 sir (Google Authenticator)
TONCENTER_KEY = os.environ.get("TONCENTER_KEY", "")
DB = os.environ.get("DB_PATH", "ledger.json")
REF_INVITER, REF_INVITEE = 500, 1000
WEEK = 604800
TOUR_PRIZES = ["swisswatch", "genielamp", "tophat"]
CW_PRIZE = "signetring"
WAIT_S, TICK = 7.0, 0.05

bot = Bot(BOT_TOKEN)
dp = Dispatcher()
last_notify, rate = {}, {}

DEFAULTS = {"seen_tx": [], "paid_stars": [], "users": {}, "deps": [], "promos": {}, "refs": {}, "ref_earn": {},
            "remind": "", "clans": {}, "mk": [], "wk": {}, "claimed": {}, "audit": [], "rounds": [], "chatlog": [],
            "rtp": {}, "wdaily": {}, "cfg": {"event": "", "xpm": 1, "until": 0, "announce": "", "maint": False, "chat": True, "star_rate": 0.0065, "min_dep": 1, "max_bet": 100000,
                    "reminder": True}}


def load():
    try:
        d = json.load(open(DB))
    except Exception:
        d = {}
    for k, v in DEFAULTS.items():
        d.setdefault(k, json.loads(json.dumps(v)))
    for k, v in DEFAULTS["cfg"].items():
        d["cfg"].setdefault(k, v)
    return d


D = load()
_dirty = False


def save():
    global _dirty
    _dirty = True


def flush_now():
    global _dirty
    tmp = DB + ".tmp"
    with open(tmp, "w") as f:
        json.dump(D, f)
    os.replace(tmp, DB)
    _dirty = False


async def saver():
    while True:
        await asyncio.sleep(3)
        if _dirty:
            try:
                flush_now()
            except Exception as e:
                print("save error", e)


def audit(msg):
    D["audit"].append({"t": int(time.time()), "m": msg})
    del D["audit"][:-300]
    save()


def wk():
    return int(time.time() // WEEK)


def verify(init_data: str):
    data = dict(parse_qsl(init_data, keep_blank_values=True))
    h = data.pop("hash", "")
    check = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    if not hmac.compare_digest(hmac.new(secret, check.encode(), hashlib.sha256).hexdigest(), h):
        raise web.HTTPForbidden()
    if time.time() - int(data.get("auth_date", 0)) > 86400 * 7:
        raise web.HTTPForbidden()
    return json.loads(data["user"])


def limit(uid, name, n=30, per=60):
    k = (uid, name)
    now = time.time()
    L = [t for t in rate.get(k, []) if now - t < per]
    if len(L) >= n:
        raise web.HTTPTooManyRequests()
    L.append(now)
    rate[k] = L


def user(u):
    uid = str(u["id"])
    r = D["users"].setdefault(uid, {"first": int(time.time()), "wag": 0, "inv": 0, "best": 0, "lvl": 1, "inbox": [],
                                    "banned": False, "clan": None, "av": "🙂", "pend": 0, "games": 0})
    r["name"] = (u.get("first_name") or "")[:24]
    r["un"] = (u.get("username") or "").lower()
    r["seen"] = int(time.time())
    return uid, r


async def auth(req, name="api", n=40):
    b = await req.json()
    u = verify(b["initData"])
    limit(u["id"], name, n)
    uid, r = user(u)
    if r.get("banned"):
        raise web.HTTPForbidden(text="banned")
    if D["cfg"]["maint"]:
        raise web.HTTPServiceUnavailable()
    return u, uid, r, b


def J(o):
    return web.json_response(o)


# ---------------- hello / promo / referral / push ----------------
async def hello(req):
    u, uid, r, b = await auth(req)
    save()
    return J({"ok": 1})


async def promo(req):
    u, uid, r, b = await auth(req, "promo", 10)
    code = str(b.get("code", "")).strip().upper()[:24]
    p = D["promos"].get(code)
    if not p or not p.get("on", True):
        return J({"error": "Noto'g'ri promokod"})
    if p.get("exp") and time.time() > p["exp"]:
        return J({"error": "Kod muddati tugagan"})
    if uid in p["used"]:
        return J({"error": "Bu kod ishlatilgan"})
    if len(p["used"]) >= p["max"]:
        return J({"error": "Kod limiti tugagan"})
    p["used"].append(uid)
    save()
    return J({"amount": p["amount"]})


async def ref(req):
    u, uid, r, b = await auth(req, "ref", 5)
    inv = str(b.get("code", "")).lstrip("U")
    if uid == inv or uid in D["refs"] or inv not in D["users"]:
        return J({"bonus": 0})
    D["refs"][uid] = inv
    D["ref_earn"][inv] = D["ref_earn"].get(inv, 0) + REF_INVITER
    D["users"][inv]["inbox"].append({"type": "bonus", "amount": REF_INVITER, "note": "Do'st taklifi"})
    save()
    try:
        await bot.send_message(int(inv), f"👥 Do'stingiz {r['name']} qo'shildi! +{REF_INVITER} TON bonus.")
    except Exception:
        pass
    return J({"bonus": REF_INVITEE})


async def ref_stats(req):
    u, uid, r, b = await auth(req)
    return J({"friends": sum(1 for v in D["refs"].values() if v == uid), "earned": D["ref_earn"].get(uid, 0)})


async def notify(req):
    u, uid, r, b = await auth(req)
    if time.time() - last_notify.get(u["id"], 0) < 60:
        return J({"ok": 0})
    last_notify[u["id"]] = time.time()
    try:
        await bot.send_message(u["id"], str(b.get("text", ""))[:200])
    except Exception:
        pass
    return J({"ok": 1})


async def config(req):
    c = D["cfg"]
    on = c.get("until", 0) > time.time()
    return J({"announce": c["announce"], "maint": c["maint"], "chat": c["chat"],
              "xpm": c["xpm"] if on else 1, "event": c["event"] if on else ""})


# ---------------- wager / leaderboard / claim / inbox ----------------
async def wager(req):
    u, uid, r, b = await auth(req, "wager", 30)
    amt = max(0, min(float(b.get("amt", 0) or 0), 5_000_000))
    r["wag"] += amt
    r["inv"] = max(0, min(float(b.get("inv", 0) or 0), 1e9))
    r["best"] = max(r["best"], min(float(b.get("best", 0) or 0), 1e9))
    r["lvl"] = int(min(max(1, int(b.get("lvl", 1) or 1)), 99))
    for g, o in (b.get("games") or {}).items():
        try:
            t = D["rtp"].setdefault(str(g)[:16], {"b": 0, "p": 0, "n": 0})
            t["b"] += max(0, min(float(o["b"]), 5e6)); t["p"] += max(0, min(float(o["p"]), 5e8)); t["n"] += min(int(o["n"]), 1000)
        except Exception:
            pass
    dk = datetime.date.today().isoformat()
    D["wdaily"][dk] = D["wdaily"].get(dk, 0) + amt
    for k in sorted(D["wdaily"])[:-60]:
        del D["wdaily"][k]
    w = D["wk"].setdefault(str(wk()), {})
    w[uid] = w.get(uid, 0) + amt
    for k in list(D["wk"]):
        if int(k) < wk() - 3:
            del D["wk"][k]
    save()
    return J({"ok": 1})


def clan_stats(cid, week):
    t = w = m = 0
    for uid, r in D["users"].items():
        if r.get("clan") == cid:
            m += 1
            t += r["wag"]
            w += D["wk"].get(str(week), {}).get(uid, 0)
    return m, t, w


def rows(L, key):
    return [{"n": D["users"][i]["name"] or "Player", "e": D["users"][i].get("av", "🙂"), "v": round(v)}
            for i, v in L[:10]]


async def lb(req):
    u, uid, r, b = await auth(req, "lb", 20)
    tour = sorted(D["wk"].get(str(wk()), {}).items(), key=lambda x: -x[1])
    us = D["users"]
    rich = sorted(((i, x["inv"]) for i, x in us.items() if x["inv"] > 0), key=lambda x: -x[1])
    best = sorted(((i, x["best"]) for i, x in us.items() if x["best"] > 0), key=lambda x: -x[1])
    out = {"tour": rows(tour, 0), "rich": rows(rich, 0), "best": rows(best, 0)}
    for L, k in ((tour, "tour"), (rich, "rich"), (best, "best")):
        for n, (i, v) in enumerate(L[:10]):
            out[k][n]["me"] = i == uid
    cl = []
    for cid, c in D["clans"].items():
        m, t, w = clan_stats(cid, wk())
        cl.append({"id": cid, "n": c["n"], "e": c["e"], "m": m, "t": round(t), "w": round(w)})
    out["clans"] = sorted(cl, key=lambda x: -x["w"])[:20]
    return J(out)


async def claim(req):
    u, uid, r, b = await auth(req, "claim", 5)
    prev = str(wk() - 1)
    rewards = []
    done = D["claimed"].setdefault(prev, [])
    if uid not in done:
        L = sorted(D["wk"].get(prev, {}).items(), key=lambda x: -x[1])[:3]
        for n, (i, _) in enumerate(L):
            if i == uid:
                rewards.append({"type": "gift", "slug": TOUR_PRIZES[n]})
        cl = sorted(((c, clan_stats(c, int(prev))[2]) for c in D["clans"]), key=lambda x: -x[1])
        if cl and cl[0][1] > 0 and r.get("clan") == cl[0][0] and D["wk"].get(prev, {}).get(uid, 0) > 0:
            rewards.append({"type": "gift", "slug": CW_PRIZE})
            rewards.append({"type": "bonus", "amount": 3000, "note": "Klan urushi"})
        if rewards:
            done.append(uid)
            save()
    return J({"rewards": rewards})


async def inbox(req):
    u, uid, r, b = await auth(req, "inbox", 30)
    items, r["inbox"] = r["inbox"], []
    save()
    return J({"items": items})


async def gift_send(req):
    u, uid, r, b = await auth(req, "gift", 10)
    to = str(b.get("to", "")).lstrip("@").lower()
    slug = str(b.get("slug", ""))[:40]
    tid = next((i for i, x in D["users"].items() if x.get("un") == to), None)
    if not tid or tid == uid or not slug:
        return J({"ok": 0, "error": "Foydalanuvchi topilmadi (u botni ochgan bo'lishi kerak)"})
    D["users"][tid]["inbox"].append({"type": "gift", "slug": slug, "from": r["name"]})
    save()
    try:
        await bot.send_message(int(tid), f"🎁 {r['name']} sizga NFT sovg'a yubordi! RIKI'ni oching.")
    except Exception:
        pass
    return J({"ok": 1})


# ---------------- clans ----------------
async def clan_list(req):
    u, uid, r, b = await auth(req, "clan", 30)
    out = []
    for cid, c in D["clans"].items():
        m, t, w = clan_stats(cid, wk())
        out.append({"id": cid, "n": c["n"], "e": c["e"], "m": m, "t": round(t), "w": round(w)})
    return J({"clans": out})


async def clan_create(req):
    u, uid, r, b = await auth(req, "clan_c", 5)
    n, e = str(b.get("n", "")).strip()[:20], str(b.get("e", "🛡️"))[:4]
    if len(n) < 3 or any(c["n"].lower() == n.lower() for c in D["clans"].values()):
        raise web.HTTPBadRequest()
    cid = secrets.token_hex(3)
    D["clans"][cid] = {"n": n, "e": e, "owner": uid, "t": int(time.time())}
    r["clan"] = cid
    save()
    return J({"id": cid})


async def clan_join(req):
    u, uid, r, b = await auth(req, "clan_j", 10)
    cid = str(b.get("id", ""))
    if cid not in D["clans"]:
        raise web.HTTPBadRequest()
    r["clan"] = cid
    save()
    return J({"ok": 1})


async def clan_leave(req):
    u, uid, r, b = await auth(req, "clan_l", 10)
    r["clan"] = None
    save()
    return J({"ok": 1})


# ---------------- market ----------------
async def mk_list(req):
    u, uid, r, b = await auth(req, "mk", 30)
    return J({"items": [{"id": x["id"], "slug": x["slug"], "p": x["p"], "s": x["sn"], "mine": x["s"] == uid} for x in D["mk"]][:100]})


async def mk_sell(req):
    u, uid, r, b = await auth(req, "mk_s", 10)
    p = float(b.get("p", 0))
    if not 1 <= p <= 10_000_000 or len([x for x in D["mk"] if x["s"] == uid]) >= 20:
        return J({"ok": 0})
    D["mk"].append({"id": secrets.token_hex(4), "slug": str(b["slug"])[:40], "p": round(p, 2), "s": uid, "sn": r["name"], "t": int(time.time())})
    save()
    return J({"ok": 1})


async def mk_buy(req):
    u, uid, r, b = await auth(req, "mk_b", 10)
    x = next((i for i in D["mk"] if i["id"] == b.get("id")), None)
    if not x or x["s"] == uid:
        return J({"ok": 0})
    D["mk"].remove(x)
    D["users"][x["s"]]["inbox"].append({"type": "bonus", "amount": round(x["p"] * .95, 2), "note": "Market sotuvi"})
    save()
    return J({"ok": 1, "slug": x["slug"]})


async def mk_cancel(req):
    u, uid, r, b = await auth(req, "mk_c", 10)
    x = next((i for i in D["mk"] if i["id"] == b.get("id") and i["s"] == uid), None)
    if not x:
        return J({"ok": 0})
    D["mk"].remove(x)
    save()
    return J({"ok": 1, "slug": x["slug"]})


# ---------------- Stars / TON ----------------
async def stars_invoice(req):
    u, uid, r, b = await auth(req, "inv", 10)
    n = int(b["stars"])
    if not D["cfg"]["min_dep"] <= n <= 100000:
        raise web.HTTPBadRequest()
    link = await bot.create_invoice_link(title="RIKI balans", description=f"{n} Stars", payload=f"dep:{u['id']}:{n}",
                                         provider_token="", currency="XTR", prices=[LabeledPrice(label="Balans", amount=n)])
    return J({"link": link, "ton": round(n * D["cfg"]["star_rate"], 2)})


@dp.pre_checkout_query()
async def pre(q: PreCheckoutQuery):
    await q.answer(ok=True)


@dp.message(F.successful_payment)
async def paid(m: Message):
    p = m.successful_payment
    if p.telegram_payment_charge_id in D["paid_stars"]:
        return
    D["paid_stars"].append(p.telegram_payment_charge_id)
    D["deps"].append({"uid": m.from_user.id, "kind": "stars", "amount": p.total_amount, "t": int(time.time())})
    save()
    await m.answer("✅ To'lov qabul qilindi!")


@dp.message(F.text == "/start")
async def start(m: Message):
    await m.answer("🎮 RIKI — o'ynash uchun pastdagi tugmani bosing.")


async def ton_info(req):
    u, uid, r, b = await auth(req)
    return J({"address": TON_WALLET, "comment": f"NP{u['id']}"})


async def ton_check(req):
    u, uid, r, b = await auth(req, "tonchk", 6)
    comment, credited = f"NP{u['id']}", 0.0
    async with aiohttp.ClientSession() as s:
        res = await s.get("https://toncenter.com/api/v2/getTransactions", params={"address": TON_WALLET, "limit": 50, "api_key": TONCENTER_KEY})
        txs = (await res.json()).get("result", [])
    for t in txs:
        m = t.get("in_msg") or {}
        h = t["transaction_id"]["hash"]
        if h in D["seen_tx"] or m.get("message") != comment:
            continue
        val = int(m.get("value", 0)) / 1e9
        if val > 0:
            D["seen_tx"].append(h)
            D["deps"].append({"uid": u["id"], "kind": "ton", "amount": val, "t": int(time.time())})
            credited += val
    save()
    return J({"credited": round(credited, 4)})


async def deps(req):
    u, uid, r, b = await auth(req)
    return J({"items": [x for x in D["deps"] if str(x["uid"]) == uid][-30:][::-1]})


# ---------------- WebSocket: chat + CRASH ----------------
clients = {}  # ws -> {"uid","name"}
CR = {"ph": "wait", "id": 20000, "seed": "", "hash": "", "cp": 1.0, "ends": 0, "t0": 0, "players": {}}


def calc_cp(seed, i):
    r = int(hashlib.sha256(f"{seed}:{i}".encode()).hexdigest()[:13], 16) / 4503599627370496
    return min(1000, max(1, math.floor(97 / (1 - r)) / 100))


def mult_at(ms):
    return math.exp(0.13 * max(0, (ms - CR["t0"]) / 1000))


def nowms():
    return int(time.time() * 1000)


async def bc(msg, skip=None):
    for c in list(clients):
        if c is not skip:
            try:
                await c.send_json(msg)
            except Exception:
                clients.pop(c, None)


def plist():
    return [dict(p, k=k) for k, p in CR["players"].items()]


async def cash(k, mult=None):
    p = CR["players"].get(k)
    if not p or p.get("cashed") or CR["ph"] != "run":
        return
    m = mult if mult else math.floor(mult_at(nowms()) * 100) / 100
    if m < 1.01 or m >= CR["cp"]:
        return
    p["cashed"] = round(m, 2)
    await bc({"t": "c_cash", "k": k, "mult": p["cashed"], "bet": p["bet"], "name": p["name"]})


async def crash_loop():
    while True:
        CR["id"] += 1
        CR["seed"] = secrets.token_hex(16)
        CR["hash"] = hashlib.sha256(CR["seed"].encode()).hexdigest()
        CR["cp"] = calc_cp(CR["seed"], CR["id"])
        CR["ph"], CR["players"] = "wait", {}
        CR["ends"] = nowms() + int(WAIT_S * 1000)
        await bc({"t": "c_wait", "id": CR["id"], "hash": CR["hash"], "ends": CR["ends"], "now": nowms()})
        await asyncio.sleep(WAIT_S)
        CR["ph"], CR["t0"] = "run", nowms()
        await bc({"t": "c_run", "t0": CR["t0"], "now": nowms()})
        while True:
            await asyncio.sleep(TICK)
            m = mult_at(nowms())
            for k, p in list(CR["players"].items()):
                if p.get("auto") and not p.get("cashed") and p["auto"] > 1 and m >= p["auto"] and p["auto"] < CR["cp"]:
                    await cash(k, p["auto"])
            if m >= CR["cp"]:
                break
        CR["ph"] = "boom"
        pl = list(CR["players"].values())
        rec = {"id": CR["id"], "cp": CR["cp"], "hash": CR["hash"], "seed": CR["seed"], "t": int(time.time() * 1000),
               "n": len(pl), "tot": round(sum(p["bet"] for p in pl)), "w": sum(1 for p in pl if p.get("cashed")),
               "paid": round(sum(p["bet"] * p["cashed"] for p in pl if p.get("cashed")))}
        D["rounds"].append(rec)
        del D["rounds"][:-200]
        save()
        await bc({"t": "c_boom", "cp": CR["cp"], "seed": CR["seed"], "hash": CR["hash"]})
        await asyncio.sleep(4)


async def ws_h(req):
    ws = web.WebSocketResponse(heartbeat=30)
    await ws.prepare(req)
    clients[ws] = {"uid": None, "name": "Player"}
    await bc({"t": "online", "n": len(clients)})
    last = 0
    async for m in ws:
        if m.type != web.WSMsgType.TEXT:
            continue
        try:
            j = json.loads(m.data)
        except Exception:
            continue
        t = j.get("t")
        try:
            if t is None:  # chat
                if not D["cfg"]["chat"] or time.time() - last < 1:
                    continue
                n, txt = str(j.get("n", ""))[:20], str(j.get("m", ""))[:120]
                if txt.strip():
                    last = time.time()
                    D["chatlog"].append({"t": int(last), "n": n, "m": txt})
                    del D["chatlog"][:-200]
                    await bc({"t": "chat", "n": n, "m": txt}, skip=ws)
                continue
            if not str(t).startswith("c_"):
                continue
            if t != "c_join" or "initData" in j:
                u = verify(j["initData"])
                uid, r = user(u)
                if r.get("banned") or D["cfg"]["maint"]:
                    continue
                clients[ws] = {"uid": uid, "name": r["name"]}
            k = "u" + (clients[ws]["uid"] or "0")
            if t == "c_join":
                await ws.send_json({"t": "c_state", "now": nowms(), "ph": CR["ph"], "id": CR["id"], "hash": CR["hash"],
                                    "ends": CR["ends"], "t0": CR["t0"], "players": plist(),
                                    "cp": CR["cp"] if CR["ph"] == "boom" else 0,
                                    "hist": [{"id": x["id"], "cp": x["cp"], "hash": x["hash"], "seed": x["seed"], "t": x["t"], "n": x["n"], "tot": x["tot"], "w": x["w"]} for x in D["rounds"][-30:][::-1]]})
            elif t == "c_bet":
                bet = float(j.get("bet", 0))
                ok = CR["ph"] == "wait" and k not in CR["players"] and 1 <= bet <= D["cfg"]["max_bet"] and clients[ws]["uid"]
                if ok:
                    av = str(j.get("av", "🙂"))[:4]
                    CR["players"][k] = {"name": str(j.get("name", clients[ws]["name"]))[:20], "av": av, "bet": round(bet),
                                        "gift": bool(j.get("gift")), "auto": min(1000, float(j.get("auto", 0) or 0)), "cashed": 0}
                    D["users"][clients[ws]["uid"]]["av"] = av
                    await bc({"t": "c_bet", "p": dict(CR["players"][k], k=k)}, skip=ws)
                else:
                    await ws.send_json({"t": "c_ack", "ok": False, "msg": "Tikish rad etildi"})
            elif t == "c_cancel":
                if CR["ph"] == "wait" and k in CR["players"]:
                    del CR["players"][k]
                    await bc({"t": "c_state", "now": nowms(), "ph": "wait", "id": CR["id"], "hash": CR["hash"], "ends": CR["ends"], "t0": 0, "players": plist()})
            elif t == "c_cash":
                await cash(k)
        except web.HTTPException:
            continue
        except Exception as e:
            print("ws err", e)
    clients.pop(ws, None)
    await bc({"t": "online", "n": len(clients)})
    return ws


# ---------------- ADMIN ----------------
def totp_ok(code):
    import base64, struct
    try:
        key = base64.b32decode(ADMIN_TOTP.upper().replace(" ", ""), casefold=True)
        for off in (-1, 0, 1):
            c = int(time.time() // 30) + off
            h = hmac.new(key, struct.pack(">Q", c), hashlib.sha1).digest()
            o = h[-1] & 15
            if f"{(struct.unpack('>I', h[o:o+4])[0] & 0x7fffffff) % 1000000:06d}" == str(code).strip():
                return True
    except Exception:
        pass
    return False


def adm_token():
    return hmac.new(ADMIN_KEY.encode(), b"adm" + str(int(time.time() // 43200)).encode(), hashlib.sha256).hexdigest()


def need_admin(req, key=None):
    if not ADMIN_KEY:
        raise web.HTTPForbidden()
    ck = req.cookies.get("adm", "")
    if ck and any(hmac.compare_digest(ck, t) for t in (adm_token(),)):
        return
    k = key if key is not None else req.query.get("key", "")
    if not ADMIN_TOTP and hmac.compare_digest(k.encode(), ADMIN_KEY.encode()):
        return
    raise web.HTTPFound("/admin/login")


async def a_login(req):
    msg = ""
    if req.method == "POST":
        f = await req.post()
        if hmac.compare_digest(f.get("key", "").encode(), ADMIN_KEY.encode()) and (not ADMIN_TOTP or totp_ok(f.get("code", ""))):
            r = web.HTTPFound("/admin")
            r.set_cookie("adm", adm_token(), max_age=43200, httponly=True, samesite="Strict")
            raise r
        msg = "<p class=bad>Noto'g'ri</p>"
        await asyncio.sleep(1.5)
    return web.Response(content_type="text/html", text=f'<!doctype html><meta name=viewport content="width=device-width"><style>{CSS}</style><main style="max-width:340px;margin-top:80px"><h2>RIKI admin</h2>{msg}<form method=post><input type=password name=key placeholder="Admin kalit" style="width:100%;margin:6px 0"><input name=code placeholder="2FA kod" style="width:100%;margin:6px 0" {"" if ADMIN_TOTP else "hidden"}><button style="width:100%">Kirish</button></form></main>')


e = html.escape
TABS = [("home", "📊 Umumiy"), ("users", "👥 Foydalanuvchilar"), ("deps", "💳 Depozitlar"), ("promo", "🎟️ Promokodlar"),
        ("cast", "📣 Xabar"), ("refs", "🤝 Referal"), ("clans", "🛡️ Klanlar"), ("market", "🏪 Market"),
        ("crash", "🚀 Crash"), ("rtp", "🎰 RTP"), ("chat", "💬 Chat"), ("set", "⚙️ Sozlamalar"), ("log", "📜 Log")]
CSS = """body{font-family:system-ui,sans-serif;background:#0e0f14;color:#eceef7;margin:0}a{color:#9aa4ff;text-decoration:none}
nav{display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:#15171f;position:sticky;top:0}nav a{padding:7px 11px;border-radius:9px;background:#1d2030;font-size:13px}nav a.on{background:#5b6cff;color:#fff}
main{padding:14px;max-width:1100px;margin:auto}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.c{background:#171923;border:1px solid #262a3b;border-radius:12px;padding:12px}
.c b{font-size:22px;display:block}.c small{color:#8b90a8}table{border-collapse:collapse;width:100%;font-size:13px;margin:8px 0}td,th{border-bottom:1px solid #262a3b;padding:6px;text-align:left}th{color:#8b90a8}
input,select,textarea,button{background:#1d2030;color:#fff;border:1px solid #2d3248;border-radius:8px;padding:8px;font-size:13px}button{background:#5b6cff;border:0;cursor:pointer}button.r{background:#d1485c}
form{margin:8px 0}h3{margin:20px 0 6px}.ok{color:#2fbf8a}.bad{color:#e0566a}.bar{height:8px;background:#5b6cff;border-radius:4px}"""


def page(tab, body):
    nav = "".join(f'<a class="{"on" if t == tab else ""}" href="/admin?key={e(ADMIN_KEY)}&tab={t}">{n}</a>' for t, n in TABS)
    return web.Response(content_type="text/html", text=f'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>RIKI admin</title><style>{CSS}</style><nav>{nav}</nav><main>{body}</main>')


def fm(t):
    return datetime.datetime.fromtimestamp(t).strftime("%m-%d %H:%M")


def hf(action, inner, extra=""):
    return f'<form method=post action="/admin/{action}">{extra}<input type=hidden name=key value="{e(ADMIN_KEY)}">{inner}</form>'


async def admin(req):
    need_admin(req)
    tab = req.query.get("tab", "home")
    q = req.query.get("q", "").lower()
    us, now = D["users"], time.time()
    day = 86400
    stars = sum(x["amount"] for x in D["deps"] if x["kind"] == "stars")
    ton = sum(x["amount"] for x in D["deps"] if x["kind"] == "ton")
    b = ""
    if tab == "home":
        dau = sum(1 for x in us.values() if now - x.get("seen", 0) < day)
        new = sum(1 for x in us.values() if now - x.get("first", 0) < day)
        d7 = [0] * 7
        for x in D["deps"]:
            a = int((now - x["t"]) // day)
            if a < 7:
                d7[6 - a] += x["amount"] if x["kind"] == "ton" else x["amount"] * D["cfg"]["star_rate"]
        mx = max(d7) or 1
        wag = sum(D["wk"].get(str(wk()), {}).values())
        rd = D["rounds"][-50:]
        nu = [0] * 7
        for x in us.values():
            a = int((now - x.get("first", 0)) // day)
            if a < 7:
                nu[6 - a] += 1
        b = f'''<div class=g><div class=c><small>Foydalanuvchilar</small><b>{len(us)}</b></div><div class=c><small>Bugun faol</small><b>{dau}</b></div><div class=c><small>Bugun yangi</small><b>{new}</b></div><div class=c><small>Online (WS)</small><b>{len(clients)}</b></div>
<div class=c><small>Stars jami</small><b>{stars:,.0f}</b></div><div class=c><small>TON jami</small><b>{ton:.2f}</b></div><div class=c><small>Referallar</small><b>{len(D["refs"])}</b></div><div class=c><small>Klanlar</small><b>{len(D["clans"])}</b></div>
<div class=c><small>Hafta aylanmasi</small><b>{wag:,.0f}</b></div><div class=c><small>Market e'lonlar</small><b>{len(D["mk"])}</b></div><div class=c><small>Crash raundlari</small><b>{len(D["rounds"])}</b></div><div class=c><small>Crash o'yinchi (hozir)</small><b>{len(CR["players"])}</b></div></div>
<h3>Oxirgi 7 kun depozit (TON ekv.)</h3><div class=c>{"".join(f'<div style="display:flex;gap:8px;align-items:center;margin:4px 0"><small style="width:60px">{(datetime.date.today()-datetime.timedelta(days=6-i)):%m-%d}</small><div class=bar style="width:{v/mx*100:.0f}%;min-width:2px"></div><small>{v:.1f}</small></div>' for i, v in enumerate(d7))}</div>
<h3>Kunlik aylanma (oxirgi 7 kun)</h3><div class=c>{"".join(f'<div style="display:flex;gap:8px;align-items:center;margin:4px 0"><small style="width:60px">{k[5:]}</small><div class=bar style="width:{v/(max(D["wdaily"].values()) or 1)*100:.0f}%;min-width:2px"></div><small>{v:,.0f}</small></div>' for k, v in sorted(D["wdaily"].items())[-7:])}</div><h3>Yangi foydalanuvchilar (7 kun)</h3><div class=c>{"".join(f'<div style="display:flex;gap:8px;align-items:center;margin:4px 0"><small style="width:60px">{(datetime.date.today()-datetime.timedelta(days=6-i)):%m-%d}</small><div class=bar style="width:{nu[i]/(max(nu) or 1)*100:.0f}%;min-width:2px"></div><small>{nu[i]}</small></div>' for i in range(7))}</div><h3>Crash holati</h3><div class=c>Raund #{CR["id"]} · {CR["ph"]} · oxirgi 50 raund o'rtacha: {(sum(x["cp"] for x in rd)/len(rd) if rd else 0):.2f}×</div>'''
    elif tab == "users":
        L = [(i, x) for i, x in us.items() if not q or q in i or q in x.get("name", "").lower() or q in x.get("un", "")]
        L.sort(key=lambda p: -p[1].get("seen", 0))
        b = f'''<form method=get action=/admin><input type=hidden name=key value="{e(ADMIN_KEY)}"><input type=hidden name=tab value=users><input name=q value="{e(q)}" placeholder="ID / ism / @username"> <button>Qidirish</button></form>
<table><tr><th>ID</th><th>Ism</th><th>@</th><th>Aylanma</th><th>Dar.</th><th>Klan</th><th>Oxirgi</th><th>Amallar</th></tr>{"".join(f"""<tr><td>{i}</td><td>{e(x.get("name",""))}</td><td>{e(x.get("un",""))}</td><td>{x["wag"]:,.0f}</td><td>{x["lvl"]}</td><td>{e(str(D["clans"].get(x.get("clan"),{}).get("n","")))}</td><td>{fm(x.get("seen",0))}</td><td>{hf("ban",f'<input type=hidden name=id value={i}><button class={"" if x.get("banned") else "r"}>{"Ochish" if x.get("banned") else "Ban"}</button>')}{hf("bonus",f'<input type=hidden name=id value={i}><input name=amount type=number placeholder=TON style=width:80px><button>Bonus</button>')}{hf("dm",f'<input type=hidden name=id value={i}><input name=text placeholder=xabar style=width:120px><button>DM</button>')}</td></tr>""" for i, x in L[:100])}</table><small>{len(L)} ta topildi (100 tasi ko'rsatilgan)</small>'''
    elif tab == "deps":
        b = f'<a href="/admin/export?key={e(ADMIN_KEY)}&what=deps">⬇ CSV</a> · <a href="/admin/export?key={e(ADMIN_KEY)}&what=backup">⬇ To\'liq zaxira (JSON)</a><table><tr><th>Vaqt</th><th>User</th><th>Tur</th><th>Miqdor</th></tr>{"".join(f"<tr><td>{fm(x["t"])}</td><td>{x["uid"]}</td><td>{x["kind"]}</td><td>{x["amount"]}</td></tr>" for x in D["deps"][-200:][::-1])}</table>'
    elif tab == "promo":
        b = hf("promo", '<input name=code placeholder=KOD> <input name=amount type=number step=any placeholder=miqdor> <input name=max type=number value=100> <input name=days type=number placeholder="kun (ixtiyoriy)"> <button>Qo\'shish</button>') + f'<table><tr><th>Kod</th><th>Miqdor</th><th>Ishlatilgan</th><th>Holat</th><th></th></tr>{"".join(f"""<tr><td>{e(k)}</td><td>{v["amount"]}</td><td>{len(v["used"])}/{v["max"]}</td><td>{"✅" if v.get("on",True) else "⏸"} {fm(v["exp"]) if v.get("exp") else ""}</td><td>{hf("promo_t",f"<input type=hidden name=code value={e(k)}><button>On/Off</button>")}{hf("promo_d",f"<input type=hidden name=code value={e(k)}><button class=r>O'chirish</button>")}</td></tr>""" for k, v in D["promos"].items())}</table>'
    elif tab == "cast":
        b = '<h3>Hammaga xabar</h3>' + hf("broadcast", '<textarea name=text rows=3 cols=50 maxlength=300></textarea><br><button>Yuborish</button>') + '<h3>Bannerli e\'lon (Arena)</h3>' + hf("announce", f'<input name=text size=50 value="{e(D["cfg"]["announce"])}"> <button>Saqlash</button>')
    elif tab == "refs":
        top = sorted(D["ref_earn"].items(), key=lambda x: -x[1])[:30]
        b = f'<table><tr><th>User</th><th>Do\'stlar</th><th>Daromad</th></tr>{"".join(f"<tr><td>{e(us.get(i,{}).get("name",i))} ({i})</td><td>{sum(1 for v in D["refs"].values() if v==i)}</td><td>{v}</td></tr>" for i, v in top)}</table>'
    elif tab == "clans":
        b = f'<table><tr><th>ID</th><th>Klan</th><th>A\'zo</th><th>Jami</th><th>Hafta</th><th></th></tr>{"".join(f"""<tr><td>{c}</td><td>{e(x["e"])} {e(x["n"])}</td><td>{clan_stats(c,wk())[0]}</td><td>{clan_stats(c,wk())[1]:,.0f}</td><td>{clan_stats(c,wk())[2]:,.0f}</td><td>{hf("clan_d",f"<input type=hidden name=id value={c}><button class=r>O'chirish</button>")}</td></tr>""" for c, x in D["clans"].items())}</table>'
    elif tab == "market":
        b = f'<table><tr><th>ID</th><th>NFT</th><th>Narx</th><th>Sotuvchi</th><th></th></tr>{"".join(f"""<tr><td>{x["id"]}</td><td>{e(x["slug"])}</td><td>{x["p"]}</td><td>{e(x["sn"])}</td><td>{hf("mk_d",f"<input type=hidden name=id value={x["id"]}><button class=r>Olib tashlash</button>")}</td></tr>""" for x in D["mk"])}</table>'
    elif tab == "crash":
        R = D["rounds"][-60:][::-1]
        b = f'<div class=c>Hozir: #{CR["id"]} {CR["ph"]} · o\'yinchilar {len(CR["players"])}</div><table><tr><th>#</th><th>Vaqt</th><th>Crash</th><th>Ishtirokchi</th><th>Tikish</th><th>Yutganlar</th><th>To\'langan</th></tr>{"".join(f"<tr><td>{x["id"]}</td><td>{fm(x["t"]/1000)}</td><td>{x["cp"]:.2f}×</td><td>{x["n"]}</td><td>{x["tot"]}</td><td>{x["w"]}</td><td>{x.get("paid",0)}</td></tr>" for x in R)}</table>'
    elif tab == "rtp":
        R = sorted(D["rtp"].items(), key=lambda x: -x[1]["b"])
        tb = sum(v["b"] for v in D["rtp"].values()); tp = sum(v["p"] for v in D["rtp"].values())
        b = f'<div class=g><div class=c><small>Jami tikish</small><b>{tb:,.0f}</b></div><div class=c><small>Jami to\'langan</small><b>{tp:,.0f}</b></div><div class=c><small>Umumiy RTP</small><b>{(tp/tb*100 if tb else 0):.1f}%</b></div></div><table><tr><th>O\'yin</th><th>Raundlar</th><th>Tikish</th><th>To\'langan</th><th>RTP</th></tr>{"".join(f"<tr><td>{e(k)}</td><td>{v["n"]}</td><td>{v["b"]:,.0f}</td><td>{v["p"]:,.0f}</td><td>{(v["p"]/v["b"]*100 if v["b"] else 0):.1f}%</td></tr>" for k, v in R)}</table><small>Ma\'lumot mijozlar hisobotidan olinadi (demo balans, taxminiy).</small>'
    elif tab == "chat":
        b = hf("chat_clear", "<button class=r>Chatni tozalash</button>") + f'<table>{"".join(f"<tr><td>{fm(x["t"])}</td><td>{e(x["n"])}</td><td>{e(x["m"])}</td></tr>" for x in D["chatlog"][-100:][::-1])}</table>'
    elif tab == "set":
        c = D["cfg"]
        b = hf("cfg", f'''<div class=c><label><input type=checkbox name=maint {"checked" if c["maint"] else ""}> Texnik ishlar rejimi (hamma uchun yopiq)</label><br><br>
<label><input type=checkbox name=chat {"checked" if c["chat"] else ""}> Chat yoqilgan</label><br><br>
<label><input type=checkbox name=reminder {"checked" if c["reminder"] else ""}> Kunlik eslatma</label><br><br>
Star → balans kursi: <input name=star_rate value={c["star_rate"]} size=8><br><br>Min Stars depozit: <input name=min_dep value={c["min_dep"]} size=6> Crash max tikish: <input name=max_bet value={c["max_bet"]} size=8><br><br><b>🎉 Tadbir</b> (masalan 2× XP): nomi <input name=event value="{e(c["event"])}" size=16> XP ko'paytma <input name=xpm value={c["xpm"]} size=3> soat <input name=hours size=3 placeholder=0><br><br><button>Saqlash</button></div>''')
    elif tab == "log":
        b = f'<table>{"".join(f"<tr><td>{fm(x["t"])}</td><td>{e(x["m"])}</td></tr>" for x in D["audit"][::-1])}</table>'
    return page(tab, b)


def back(tab):
    raise web.HTTPFound(f"/admin?key={ADMIN_KEY}&tab={tab}")


async def adm_post(req, tab):
    f = await req.post()
    need_admin(req, f.get("key", ""))
    return f


async def a_promo(req):
    f = await adm_post(req, "promo")
    code = f["code"].strip().upper()[:24]
    D["promos"][code] = {"amount": float(f["amount"]), "max": int(f["max"] or 100), "used": [], "on": True,
                         "exp": int(time.time() + float(f["days"]) * 86400) if f.get("days") else 0}
    audit(f"promo {code}")
    back("promo")


async def a_promo_t(req):
    f = await adm_post(req, "promo")
    p = D["promos"].get(f["code"])
    if p:
        p["on"] = not p.get("on", True)
        audit(f"promo toggle {f['code']}")
    back("promo")


async def a_promo_d(req):
    f = await adm_post(req, "promo")
    D["promos"].pop(f["code"], None)
    audit(f"promo del {f['code']}")
    back("promo")


async def a_ban(req):
    f = await adm_post(req, "users")
    r = D["users"].get(f["id"])
    if r:
        r["banned"] = not r.get("banned")
        audit(f"ban {f['id']} -> {r['banned']}")
    back("users")


async def a_bonus(req):
    f = await adm_post(req, "users")
    r = D["users"].get(f["id"])
    if r and f.get("amount"):
        r["inbox"].append({"type": "bonus", "amount": float(f["amount"]), "note": "Admin bonusi"})
        audit(f"bonus {f['id']} {f['amount']}")
    back("users")


async def a_dm(req):
    f = await adm_post(req, "users")
    try:
        await bot.send_message(int(f["id"]), f["text"][:300])
    except Exception:
        pass
    back("users")


async def a_broadcast(req):
    f = await adm_post(req, "cast")
    text = f["text"][:300]
    audit("broadcast: " + text[:60])

    async def run():
        for uid, r in list(D["users"].items()):
            if r.get("banned"):
                continue
            try:
                await bot.send_message(int(uid), text)
            except Exception:
                pass
            await asyncio.sleep(.05)
    asyncio.create_task(run())
    back("cast")


async def a_announce(req):
    f = await adm_post(req, "cast")
    D["cfg"]["announce"] = f["text"][:200]
    audit("announce")
    save()
    back("cast")


async def a_clan_d(req):
    f = await adm_post(req, "clans")
    D["clans"].pop(f["id"], None)
    for r in D["users"].values():
        if r.get("clan") == f["id"]:
            r["clan"] = None
    audit(f"clan del {f['id']}")
    back("clans")


async def a_mk_d(req):
    f = await adm_post(req, "market")
    x = next((i for i in D["mk"] if i["id"] == f["id"]), None)
    if x:
        D["mk"].remove(x)
        D["users"].get(x["s"], {"inbox": []})["inbox"].append({"type": "gift", "slug": x["slug"], "from": "Admin"})
        audit(f"mk del {f['id']}")
    back("market")


async def a_chat_clear(req):
    await adm_post(req, "chat")
    D["chatlog"].clear()
    audit("chat clear")
    back("chat")


async def a_cfg(req):
    f = await adm_post(req, "set")
    c = D["cfg"]
    c["maint"], c["chat"], c["reminder"] = "maint" in f, "chat" in f, "reminder" in f
    try:
        c["event"], c["xpm"] = f.get("event", "")[:30], max(1, min(10, float(f.get("xpm", 1))))
        if float(f.get("hours") or 0) > 0:
            c["until"] = int(time.time() + float(f["hours"]) * 3600)
        c["star_rate"], c["min_dep"], c["max_bet"] = float(f["star_rate"]), int(f["min_dep"]), int(f["max_bet"])
    except Exception:
        pass
    audit("cfg " + json.dumps(c))
    save()
    back("set")


async def a_export(req):
    need_admin(req)
    what = req.query.get("what", "deps")
    if what == "backup":
        return web.Response(body=json.dumps(D), content_type="application/json", headers={"Content-Disposition": "attachment; filename=ledger-backup.json"})
    s = io.StringIO()
    w = csv.writer(s)
    w.writerow(["time", "uid", "kind", "amount"])
    for x in D["deps"]:
        w.writerow([fm(x["t"]), x["uid"], x["kind"], x["amount"]])
    return web.Response(text=s.getvalue(), content_type="text/csv", headers={"Content-Disposition": "attachment; filename=deposits.csv"})


# ---------------- misc ----------------
async def reminder():
    while True:
        await asyncio.sleep(60)
        now = datetime.datetime.utcnow()
        if D["cfg"]["reminder"] and now.hour == 7 and D["remind"] != str(now.date()):
            D["remind"] = str(now.date())
            save()
            for uid, r in list(D["users"].items()):
                if r.get("banned"):
                    continue
                try:
                    await bot.send_message(int(uid), "🔥 Bugungi streak bonusini olishni unutmang! RIKI'ni oching.")
                except Exception:
                    pass
                await asyncio.sleep(.05)


@web.middleware
async def cors(req, handler):
    try:
        resp = web.Response() if req.method == "OPTIONS" else await handler(req)
    except web.HTTPException as ex:
        resp = ex
    if req.path != "/ws":
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp


async def main():
    app = web.Application(middlewares=[cors])
    P = web.post
    app.add_routes([
        P("/api/hello", hello), P("/api/promo", promo), P("/api/ref", ref), P("/api/ref/stats", ref_stats), P("/api/notify", notify),
        web.get("/api/config", config), P("/api/wager", wager), P("/api/lb", lb), P("/api/claim", claim), P("/api/inbox", inbox),
        P("/api/gift/send", gift_send), P("/api/clan/list", clan_list), P("/api/clan/create", clan_create), P("/api/clan/join", clan_join),
        P("/api/clan/leave", clan_leave), P("/api/mk/list", mk_list), P("/api/mk/sell", mk_sell), P("/api/mk/buy", mk_buy), P("/api/mk/cancel", mk_cancel),
        P("/api/stars/invoice", stars_invoice), P("/api/ton/info", ton_info), P("/api/ton/check", ton_check), P("/api/deps", deps),
        web.get("/ws", ws_h), web.get("/admin", admin), web.get("/admin/login", a_login), P("/admin/login", a_login), web.get("/admin/export", a_export),
        P("/admin/promo", a_promo), P("/admin/promo_t", a_promo_t), P("/admin/promo_d", a_promo_d), P("/admin/ban", a_ban),
        P("/admin/bonus", a_bonus), P("/admin/dm", a_dm), P("/admin/broadcast", a_broadcast), P("/admin/announce", a_announce),
        P("/admin/clan_d", a_clan_d), P("/admin/mk_d", a_mk_d), P("/admin/chat_clear", a_chat_clear), P("/admin/cfg", a_cfg),
        web.get("/", lambda r: web.Response(text="RIKI API ok")), web.options("/{p:.*}", lambda r: web.Response())])
    runner = web.AppRunner(app)
    await runner.setup()
    await web.TCPSite(runner, "0.0.0.0", int(os.environ.get("PORT", 8080))).start()
    asyncio.create_task(reminder())
    asyncio.create_task(saver())
    asyncio.create_task(crash_loop())
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())