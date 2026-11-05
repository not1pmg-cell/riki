"""
RIKI — Telegram bot + API server (aiogram 3 + aiohttp)
=======================================================
Bot:
  * /start — Mini App'ni ochadigan tugma; /start ref_<id> — referal
  * /app, /ref, /help, /admin
  * Menyu tugmasini Mini App'ga o'rnatadi

API server (Mini App shu bilan ishlaydi — CFG.API_URL):
  * Real o'yinchilar Leaderboard'i      GET  /api/leaderboard
  * O'yinchi statistikasi               POST /api/stats
  * Live lenta (real yutuqlar)          GET/POST /api/feed
  * Giveaway'lar (admin yaratadi)       GET/POST /api/giveaways, POST /api/giveaways/<id>/join|end, DELETE /api/giveaways/<id>
  * Kiruvchi sovg'a/TON (inbox)        GET /api/rewards, POST /api/rewards/claim
  * Transfer (TON yoki gift)           GET /api/user?q=@username, POST /api/transfer
  Har bir so'rov Telegram initData imzosi bilan tekshiriladi (X-Init-Data).

Demo rejim: haqiqiy pul yoki NFT qabul qilinmaydi va chiqarilmaydi.

Ishga tushirish:
    pip install -r requirements.txt
    .env faylini to'ldiring
    python bot.py
    (tashqaridan kirish uchun: cloudflared tunnel --url http://localhost:8080)
"""
from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import logging
import os
import random
import time
import uuid
from urllib.parse import parse_qsl

import base64
import binascii

import aiohttp
from aiohttp import web
from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import (
    BotCommand,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonWebApp,
    Message,
    WebAppInfo,
    LabeledPrice,
    PreCheckoutQuery,
)


# ================================================================ sozlamalar
def load_env(path: str = ".env") -> None:
    """Oddiy .env o'qigich (python-dotenv shart emas)."""
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


load_env()
BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://USERNAME.github.io/riki/")
BRAND = os.getenv("BRAND", "RIKI")
CHANNEL_URL = os.getenv("CHANNEL_URL", "")
ADMIN_IDS = {int(x) for x in os.getenv("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip().isdigit()}
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8080"))
DATA_FILE = os.getenv("DATA_FILE", "riki_data.json")
DEV_NOAUTH = os.getenv("DEV_NOAUTH", "0") == "1"  # faqat lokal sinov uchun!
# ---- depozit
DEPOSIT_ADDRESS = os.getenv("DEPOSIT_ADDRESS", "").strip()      # TON hamyon manzili (depozit qabul qiladi)
TONCENTER_KEY = os.getenv("TONCENTER_KEY", "").strip()          # https://t.me/tonapibot dan bepul kalit
TONCENTER_URL = os.getenv("TONCENTER_URL", "https://toncenter.com/api/v2")
STARS_RATE = float(os.getenv("STARS_RATE", "0.004"))            # 1 Star = shuncha TON (balansga)
MIN_TON_DEPOSIT = float(os.getenv("MIN_TON_DEPOSIT", "0.1"))
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]

if not BOT_TOKEN and not DEV_NOAUTH:
    raise SystemExit("BOT_TOKEN topilmadi: .env faylga BOT_TOKEN=... yozing")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("riki")


# ================================================================ ma'lumotlar (JSON fayl)
class Store:
    def __init__(self, path: str):
        self.path = path
        self.lock = asyncio.Lock()
        self.d = {"users": {}, "feed": [], "giveaways": [], "rewards": {}}
        if os.path.exists(path):
            try:
                with open(path, encoding="utf-8") as f:
                    self.d.update(json.load(f))
            except Exception as e:  # noqa: BLE001
                log.warning("data faylni o'qib bo'lmadi: %s", e)

    def save(self) -> None:
        tmp = self.path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self.d, f, ensure_ascii=False)
        os.replace(tmp, self.path)


store = Store(DATA_FILE)
bot_ref: dict = {"bot": None}


# ================================================================ Telegram initData tekshiruvi
def check_init_data(init_data: str) -> dict | None:
    """https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app"""
    if not init_data or not BOT_TOKEN:
        return None
    pairs = dict(parse_qsl(init_data, keep_blank_values=True))
    recv_hash = pairs.pop("hash", "")
    check = "\n".join(f"{k}={v}" for k, v in sorted(pairs.items()))
    secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    calc = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(calc, recv_hash):
        return None
    if time.time() - int(pairs.get("auth_date", "0") or 0) > 7 * 86400:
        return None
    try:
        return json.loads(pairs.get("user", "{}"))
    except json.JSONDecodeError:
        return None


def auth_user(request: web.Request) -> dict:
    user = check_init_data(request.headers.get("X-Init-Data", ""))
    if user and user.get("id"):
        return user
    if DEV_NOAUTH:  # lokal sinov: "X-Dev-User: 123:Name"
        raw = request.headers.get("X-Dev-User", "0:Dev")
        uid, _, name = raw.partition(":")
        return {"id": int(uid or 0), "first_name": name or "Dev"}
    raise web.HTTPUnauthorized(text=json.dumps({"error": "unauthorized"}), content_type="application/json")


def is_admin(user: dict) -> bool:
    return int(user.get("id", 0)) in ADMIN_IDS


def clean_name(user: dict, sent: str = "") -> str:
    name = (sent or user.get("username") or user.get("first_name") or "Player").strip()
    return name[:32]


def ok(data: dict | None = None) -> web.Response:
    return web.json_response(data or {"ok": True})


# ================================================================ API handlerlar
async def h_ping(request: web.Request) -> web.Response:
    user = auth_user(request)
    return ok({"ok": True, "admin": is_admin(user), "id": user.get("id")})


async def h_stats(request: web.Request) -> web.Response:
    user = auth_user(request)
    body = await request.json()
    uid = str(user["id"])
    async with store.lock:
        u = store.d["users"].setdefault(uid, {"points": 0, "pvp": 0})
        u["name"] = clean_name(user, str(body.get("name", "")))
        u["username"] = (user.get("username") or "").lower()
        u["photo"] = str(body.get("photo", ""))[:300]
        # ballar faqat o'sishi mumkin (demo)
        u["points"] = max(int(u.get("points", 0)), min(int(body.get("points", 0) or 0), 10**12))
        u["pvp"] = max(int(u.get("pvp", 0)), min(int(body.get("pvp", 0) or 0), 10**12))
        u["seen"] = int(time.time())
        store.save()
    return ok()


async def h_leaderboard(request: web.Request) -> web.Response:
    auth_user(request)
    users = store.d["users"]
    lst = [{"id": int(k), "name": v.get("name", "Player"), "photo": v.get("photo", ""),
            "points": v.get("points", 0), "pvp": v.get("pvp", 0)} for k, v in users.items()
           if v.get("points", 0) > 0 or v.get("pvp", 0) > 0]
    lst.sort(key=lambda x: x["points"], reverse=True)
    now = time.time()
    online = sum(1 for v in users.values() if now - v.get("seen", 0) < 180)
    return ok({"list": lst[:500], "total": len(lst), "online": online})


async def h_feed_get(request: web.Request) -> web.Response:
    auth_user(request)
    return ok({"list": store.d["feed"][:30]})


async def h_feed_post(request: web.Request) -> web.Response:
    user = auth_user(request)
    b = await request.json()
    item = {"sh": str(b.get("sh", ""))[:40], "n": str(b.get("n", ""))[:40], "v": round(float(b.get("v", 0) or 0), 2),
            "name": clean_name(user, str(b.get("name", ""))), "game": str(b.get("game", ""))[:20], "t": int(time.time() * 1000)}
    async with store.lock:
        store.d["feed"].insert(0, item)
        del store.d["feed"][50:]
        store.save()
    return ok()


def ga_public(g: dict, uid: str) -> dict:
    entries = g.get("entries", {})
    return {"id": g["id"], "title": g.get("title", "All Gifts"), "gifts": g["gifts"], "endAt": g["endAt"],
            "vip": g.get("vip", False), "status": g.get("status", "active"), "pool": sum(entries.values()),
            "my": entries.get(uid, 0), "winners": g.get("winners"), "createdAt": g.get("createdAt")}


async def h_ga_list(request: web.Request) -> web.Response:
    user = auth_user(request)
    uid = str(user["id"])
    gs = store.d["giveaways"]
    act = [g for g in gs if g.get("status") == "active"]
    fin = [g for g in gs if g.get("status") != "active"][:50]
    return ok({"list": [ga_public(g, uid) for g in act + fin]})


async def h_ga_create(request: web.Request) -> web.Response:
    user = auth_user(request)
    if not is_admin(user):
        raise web.HTTPForbidden(text=json.dumps({"error": "admin only"}), content_type="application/json")
    b = await request.json()
    gifts = [{"sh": str(x.get("sh", ""))[:40], "n": str(x.get("n", ""))[:40], "p": round(float(x.get("p", 0) or 0), 2)}
             for x in (b.get("gifts") or [])][:50]
    end_at = int(b.get("endAt", 0) or 0)
    if not gifts or end_at < int(time.time() * 1000) + 30_000:
        raise web.HTTPBadRequest(text=json.dumps({"error": "gifts and endAt are required"}), content_type="application/json")
    g = {"id": uuid.uuid4().hex[:10], "title": str(b.get("title", "All Gifts"))[:40], "gifts": gifts, "endAt": end_at,
         "vip": bool(b.get("vip")), "status": "active", "entries": {}, "createdAt": int(time.time() * 1000),
         "by": user["id"]}
    async with store.lock:
        store.d["giveaways"].insert(0, g)
        store.save()
    log.info("giveaway yaratildi %s (%d sovg'a) admin=%s", g["id"], len(gifts), user["id"])
    return ok({"ok": True, "id": g["id"]})


async def h_ga_join(request: web.Request) -> web.Response:
    user = auth_user(request)
    uid = str(user["id"])
    gid = request.match_info["gid"]
    b = await request.json()
    n = max(1, min(int(b.get("n", 1) or 1), 100))
    async with store.lock:
        g = next((x for x in store.d["giveaways"] if x["id"] == gid), None)
        if not g or g.get("status") != "active" or g["endAt"] <= time.time() * 1000:
            raise web.HTTPBadRequest(text=json.dumps({"error": "giveaway has ended"}), content_type="application/json")
        g["entries"][uid] = g["entries"].get(uid, 0) + n
        u = store.d["users"].setdefault(uid, {"points": 0, "pvp": 0})
        u.setdefault("name", clean_name(user))
        store.save()
        return ok({"my": g["entries"][uid], "pool": sum(g["entries"].values())})


async def h_ga_end(request: web.Request) -> web.Response:
    user = auth_user(request)
    if not is_admin(user):
        raise web.HTTPForbidden(text=json.dumps({"error": "admin only"}), content_type="application/json")
    gid = request.match_info["gid"]
    async with store.lock:
        g = next((x for x in store.d["giveaways"] if x["id"] == gid), None)
        if g and g.get("status") == "active":
            g["endAt"] = int(time.time() * 1000)
    await finalize_giveaways()
    return ok()


async def h_ga_delete(request: web.Request) -> web.Response:
    user = auth_user(request)
    if not is_admin(user):
        raise web.HTTPForbidden(text=json.dumps({"error": "admin only"}), content_type="application/json")
    gid = request.match_info["gid"]
    async with store.lock:
        store.d["giveaways"] = [x for x in store.d["giveaways"] if x["id"] != gid]
        store.save()
    return ok()


async def h_rewards(request: web.Request) -> web.Response:
    user = auth_user(request)
    return ok({"list": store.d["rewards"].get(str(user["id"]), [])})


async def h_rewards_claim(request: web.Request) -> web.Response:
    user = auth_user(request)
    ids = set((await request.json()).get("ids") or [])
    uid = str(user["id"])
    async with store.lock:
        store.d["rewards"][uid] = [r for r in store.d["rewards"].get(uid, []) if r["id"] not in ids]
        store.save()
    return ok()


# ================================================================ DEPOZIT (TON + Telegram Stars)
def ton_raw(addr: str) -> str:
    """Har qanday TON manzil formatini '0:hex' (raw) ko'rinishiga keltiradi."""
    addr = (addr or "").strip()
    if not addr:
        return ""
    if ":" in addr:
        wc, h = addr.split(":", 1)
        return f"{int(wc)}:{h.lower()}"
    try:
        b = base64.urlsafe_b64decode(addr.replace("+", "-").replace("/", "_") + "==")
        if len(b) != 36:
            return ""
        wc = b[1] if b[1] < 128 else b[1] - 256
        return f"{wc}:{binascii.hexlify(b[2:34]).decode()}"
    except (binascii.Error, ValueError):
        return ""


async def credit_deposit(uid: str, amount: float, src: str, note: str = "") -> None:
    """Depozitni foydalanuvchi inbox'iga yozadi — ilova ochilganda balansga tushadi."""
    amount = round(amount, 2)
    if amount <= 0:
        return
    async with store.lock:
        store.d["rewards"].setdefault(uid, []).append({"id": uuid.uuid4().hex[:10], "kind": "gram", "p": amount, "from": "Deposit", "src": src})
        u = store.d["users"].setdefault(uid, {"points": 0, "pvp": 0})
        u["dep"] = round(u.get("dep", 0) + amount, 2)
        store.d.setdefault("deposits", []).insert(0, {"uid": int(uid), "amount": amount, "src": src, "note": note, "t": int(time.time())})
        del store.d["deposits"][5000:]
        store.save()
    log.info("DEPOZIT %s: +%s TON (%s %s)", uid, amount, src, note)
    bot = bot_ref.get("bot")
    if bot:
        try:
            await bot.send_message(int(uid), f"✅ Deposit received: <b>+{amount} TON</b> ({src}).\nOpen the app — it will be added to your balance.", reply_markup=main_kb())
        except Exception as e:  # noqa: BLE001
            log.info("depozit xabari yuborilmadi: %s", e)


async def h_dep_info(request: web.Request) -> web.Response:
    user = auth_user(request)
    return ok({"address": DEPOSIT_ADDRESS, "comment": f"dep_{user['id']}", "rate": STARS_RATE,
               "min": MIN_TON_DEPOSIT, "ton": bool(DEPOSIT_ADDRESS), "stars": bool(BOT_TOKEN)})


async def h_ton_bind(request: web.Request) -> web.Response:
    """TON Connect orqali ulangan hamyon manzilini foydalanuvchiga bog'laydi."""
    user = auth_user(request)
    raw = ton_raw(str((await request.json()).get("address", "")))
    if not raw:
        return web.json_response({"error": "invalid address"}, status=400)
    async with store.lock:
        store.d.setdefault("wallets", {})[raw] = str(user["id"])
        store.save()
    return ok()


async def h_stars_invoice(request: web.Request) -> web.Response:
    user = auth_user(request)
    stars = int((await request.json()).get("stars", 0) or 0)
    if not 10 <= stars <= 10000:
        return web.json_response({"error": "10 – 10 000 Stars"}, status=400)
    bot = bot_ref.get("bot")
    if not bot:
        return web.json_response({"error": "bot is not running"}, status=503)
    link = await bot.create_invoice_link(
        title=f"{BRAND} — {stars} ⭐",
        description=f"Balance top up: +{round(stars * STARS_RATE, 2)} TON",
        payload=f"dep:{user['id']}:{uuid.uuid4().hex[:8]}",
        currency="XTR",
        prices=[LabeledPrice(label=f"{stars} Stars", amount=stars)],
    )
    return ok({"link": link})


async def ton_deposit_loop() -> None:
    """Depozit manzilini toncenter orqali kuzatadi va yangi tushumlarni hisobga yozadi."""
    if not DEPOSIT_ADDRESS:
        log.info("DEPOSIT_ADDRESS yo'q — TON depozit kuzatilmaydi")
        return
    headers = {"X-API-Key": TONCENTER_KEY} if TONCENTER_KEY else {}
    async with aiohttp.ClientSession(headers=headers) as http:
        while True:
            try:
                async with http.get(f"{TONCENTER_URL}/getTransactions", params={"address": DEPOSIT_ADDRESS, "limit": 50}, timeout=aiohttp.ClientTimeout(total=20)) as r:
                    data = await r.json()
                txs = data.get("result") or []
                seen = store.d.setdefault("ton_seen", [])
                first = not store.d.get("ton_init")
                for tx in reversed(txs):
                    h = (tx.get("transaction_id") or {}).get("hash", "")
                    if not h or h in seen:
                        continue
                    seen.append(h)
                    if first:
                        continue  # birinchi ishga tushishda eski tranzaksiyalarni hisoblamaymiz
                    msg = tx.get("in_msg") or {}
                    value = int(msg.get("value", "0") or 0) / 1e9
                    if value < MIN_TON_DEPOSIT:
                        continue
                    comment = (msg.get("message") or "").strip()
                    uid = comment[4:] if comment.startswith("dep_") and comment[4:].isdigit() else store.d.get("wallets", {}).get(ton_raw(msg.get("source", "")))
                    if uid:
                        await credit_deposit(str(uid), value, "TON", h[:16])
                    else:
                        log.warning("Egasi noma'lum TON tushum: %s TON, from %s, comment=%r", value, msg.get("source"), comment)
                del seen[:-3000]
                store.d["ton_init"] = True
                async with store.lock:
                    store.save()
            except Exception as e:  # noqa: BLE001
                log.warning("toncenter xato: %s", e)
            await asyncio.sleep(15)


# ================================================================ transfer
def find_user(q: str) -> tuple[str, dict] | None:
    q = (q or "").strip().lstrip("@").lower()
    if not q:
        return None
    users = store.d["users"]
    if q.isdigit() and q in users:
        return q, users[q]
    for uid, u in users.items():
        if u.get("username") == q or (u.get("name") or "").lower() == q:
            return uid, u
    return None


async def h_user(request: web.Request) -> web.Response:
    auth_user(request)
    f = find_user(request.query.get("q", ""))
    if not f:
        return web.json_response({"error": "User not found (they must open the app at least once)"}, status=404)
    uid, u = f
    return ok({"id": int(uid), "name": u.get("name", "Player"), "photo": u.get("photo", ""), "username": u.get("username", "")})


async def h_transfer(request: web.Request) -> web.Response:
    user = auth_user(request)
    b = await request.json()
    f = find_user(str(b.get("to", "")))
    if not f:
        return web.json_response({"error": "Recipient not found"}, status=404)
    to_uid, to_u = f
    if to_uid == str(user["id"]):
        return web.json_response({"error": "You can't send to yourself"}, status=400)
    kind = b.get("kind")
    sender = clean_name(user)
    if kind == "gram":
        amount = round(float(b.get("amount", 0) or 0), 2)
        if not 0.1 <= amount <= 1_000_000:
            return web.json_response({"error": "Amount must be at least 0.1"}, status=400)
        item = {"id": uuid.uuid4().hex[:10], "kind": "gram", "p": amount, "from": sender, "n": "TON"}
        text = f"💎 <b>{sender}</b> sent you <b>{amount} TON</b>."
    elif kind == "gift":
        g = b.get("gift") or {}
        item = {"id": uuid.uuid4().hex[:10], "kind": "gift", "sh": str(g.get("sh", ""))[:40], "n": str(g.get("n", ""))[:40],
                "p": round(float(g.get("p", 0) or 0), 2), "m": str(g.get("m") or "")[:40], "ms": str(g.get("ms") or "")[:60], "from": sender}
        text = f"🎁 <b>{sender}</b> sent you a <b>{item['n']}</b> gift."
    else:
        return web.json_response({"error": "kind must be gram or gift"}, status=400)
    async with store.lock:
        store.d["rewards"].setdefault(to_uid, []).append(item)
        store.d.setdefault("transfers", []).insert(0, {"from": user["id"], "to": int(to_uid), **item, "t": int(time.time())})
        del store.d["transfers"][1000:]
        store.save()
    bot = bot_ref.get("bot")
    if bot:
        try:
            await bot.send_message(int(to_uid), text + "\nOpen the app to receive it.", reply_markup=main_kb())
        except Exception as e:  # noqa: BLE001
            log.info("transfer xabari yuborilmadi: %s", e)
    return ok({"ok": True, "to": {"id": int(to_uid), "name": to_u.get("name", "Player")}})


# ================================================================ giveaway yakunlash
async def finalize_giveaways() -> None:
    now = time.time() * 1000
    notify: list[tuple[int, str]] = []
    async with store.lock:
        for g in store.d["giveaways"]:
            if g.get("status") != "active" or g["endAt"] > now:
                continue
            entries = {k: v for k, v in g.get("entries", {}).items() if v > 0}
            winners = []
            pool = dict(entries)
            for gift in g["gifts"]:
                if not pool:
                    pool = dict(entries)  # har kim kamida bittadan yutgach, qayta
                if not pool:
                    winners.append({"name": "—", **gift})
                    continue
                uid = random.choices(list(pool.keys()), weights=list(pool.values()))[0]
                pool.pop(uid, None)
                u = store.d["users"].get(uid, {})
                winners.append({"uid": int(uid), "name": u.get("name", "Player"), "photo": u.get("photo", ""), **gift})
                store.d["rewards"].setdefault(uid, []).append({"id": uuid.uuid4().hex[:10], "kind": "gift", "ga": g["id"], "from": "Giveaway", **gift})
                notify.append((int(uid), gift["n"]))
            g["winners"] = winners
            g["status"] = "ended"
        store.save()
    bot = bot_ref.get("bot")
    for uid, gift_name in notify:
        if bot:
            try:
                await bot.send_message(uid, f"🎉 Congratulations! You won <b>{gift_name}</b> in a giveaway.\n"
                                            "Open the app — the gift will be in your Backpack.", reply_markup=main_kb())
            except Exception as e:  # noqa: BLE001
                log.info("g'olibga xabar yuborilmadi %s: %s", uid, e)


async def giveaway_loop() -> None:
    while True:
        try:
            await finalize_giveaways()
        except Exception as e:  # noqa: BLE001
            log.warning("finalize xato: %s", e)
        await asyncio.sleep(20)


# ================================================================ CORS + server
@web.middleware
async def cors(request: web.Request, handler):
    origin = request.headers.get("Origin", "*")
    allow = origin if ("*" in ALLOWED_ORIGINS or origin in ALLOWED_ORIGINS) else ALLOWED_ORIGINS[0]
    if request.method == "OPTIONS":
        resp = web.Response()
    else:
        try:
            resp = await handler(request)
        except web.HTTPException as e:
            resp = web.Response(status=e.status, text=e.text or json.dumps({"error": e.reason}), content_type="application/json")
        except Exception as e:  # noqa: BLE001
            log.exception("API xato")
            resp = web.json_response({"error": str(e)}, status=500)
    resp.headers["Access-Control-Allow-Origin"] = allow
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type,X-Init-Data,X-Dev-User"
    resp.headers["Access-Control-Max-Age"] = "86400"
    return resp


def make_app() -> web.Application:
    app = web.Application(middlewares=[cors], client_max_size=256 * 1024)
    r = app.router
    r.add_get("/api/ping", h_ping)
    r.add_post("/api/stats", h_stats)
    r.add_get("/api/leaderboard", h_leaderboard)
    r.add_get("/api/feed", h_feed_get)
    r.add_post("/api/feed", h_feed_post)
    r.add_get("/api/giveaways", h_ga_list)
    r.add_post("/api/giveaways", h_ga_create)
    r.add_post("/api/giveaways/{gid}/join", h_ga_join)
    r.add_post("/api/giveaways/{gid}/end", h_ga_end)
    r.add_delete("/api/giveaways/{gid}", h_ga_delete)
    r.add_get("/api/user", h_user)
    r.add_get("/api/deposit/info", h_dep_info)
    r.add_post("/api/ton/bind", h_ton_bind)
    r.add_post("/api/stars/invoice", h_stars_invoice)
    r.add_post("/api/transfer", h_transfer)
    r.add_get("/api/rewards", h_rewards)
    r.add_post("/api/rewards/claim", h_rewards_claim)
    r.add_get("/", lambda req: web.Response(text=f"{BRAND} API ishlayapti"))
    return app


# ================================================================ bot
dp = Dispatcher()


def app_url(start_param: str = "") -> str:
    if not start_param:
        return WEBAPP_URL
    sep = "&" if "?" in WEBAPP_URL else "?"
    return f"{WEBAPP_URL}{sep}tgWebAppStartParam={start_param}"


def main_kb(start_param: str = "") -> InlineKeyboardMarkup:
    rows = [[InlineKeyboardButton(text=f"🚀 Open {BRAND}", web_app=WebAppInfo(url=app_url(start_param)))]]
    if CHANNEL_URL:
        rows.append([InlineKeyboardButton(text="📢 Channel", url=CHANNEL_URL)])
    return InlineKeyboardMarkup(inline_keyboard=rows)


@dp.message(CommandStart())
async def cmd_start(message: Message, command: CommandObject) -> None:
    param = (command.args or "").strip()
    name = message.from_user.first_name if message.from_user else "do'st"
    text = (
        f"👋 Hi, <b>{name}</b>!\n\n"
        f"🎁 <b>{BRAND}</b> — Telegram NFT gift games:\n"
        "Rocket, PvP, TvT, Roulette, Upgrade, Mines, Spins, Plinko, Dice, Crafts and boxes.\n\n"
        "Tap the button below 👇"
    )
    if param.startswith("ref_") and message.from_user:
        ref_id = param[4:]
        me_id = str(message.from_user.id)
        async with store.lock:
            is_new = me_id not in store.d["users"]
            if is_new and ref_id.isdigit() and ref_id != me_id:
                store.d["users"][me_id] = {"name": clean_name({"username": message.from_user.username, "first_name": name}),
                                           "username": (message.from_user.username or "").lower(), "points": 0, "pvp": 0, "ref_by": int(ref_id)}
                store.d["rewards"].setdefault(ref_id, []).append({"id": uuid.uuid4().hex[:10], "kind": "ref", "n": "ref", "p": 0, "tix": 5, "from": name})
                store.save()
                log.info("referal: %s -> %s", ref_id, me_id)
    await message.answer(text, reply_markup=main_kb(param))


@dp.message(Command("app"))
async def cmd_app(message: Message) -> None:
    await message.answer("🚀 Open the app:", reply_markup=main_kb())


@dp.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer("<b>Commands</b>\n/start — start\n/app — open the app\n/ref — your referral link\n/help — help")


@dp.message(Command("ref"))
async def cmd_ref(message: Message, bot: Bot) -> None:
    me = await bot.get_me()
    uid = message.from_user.id if message.from_user else 0
    await message.answer(f"🔗 Your referral link:\n<code>https://t.me/{me.username}?start=ref_{uid}</code>")


@dp.message(Command("admin"))
async def cmd_admin(message: Message) -> None:
    uid = message.from_user.id if message.from_user else 0
    if uid not in ADMIN_IDS:
        await message.answer(f"You are not an admin. ID: <code>{uid}</code>\n(add it to ADMIN_IDS in .env)")
        return
    gs = store.d["giveaways"]
    act = [g for g in gs if g.get("status") == "active"]
    users = len(store.d["users"])
    await message.answer(
        f"🛠 <b>Admin</b>\nPlayers: <b>{users}</b>\nActive giveaways: <b>{len(act)}</b>\n\n"
        "Create a giveaway: app → Earn → Giveaways → <b>➕ Create giveaway</b>",
        reply_markup=main_kb(),
    )


@dp.pre_checkout_query()
async def on_pre_checkout(q: PreCheckoutQuery) -> None:
    ok_ = q.currency == "XTR" and q.invoice_payload.startswith(f"dep:{q.from_user.id}:")
    await q.answer(ok=ok_, error_message=None if ok_ else "Invalid payment")


@dp.message(F.successful_payment)
async def on_paid(message: Message) -> None:
    sp = message.successful_payment
    if sp.currency != "XTR" or not message.from_user:
        return
    async with store.lock:
        done = store.d.setdefault("stars_seen", [])
        if sp.telegram_payment_charge_id in done:
            return
        done.append(sp.telegram_payment_charge_id)
        del done[:-5000]
        store.save()
    await credit_deposit(str(message.from_user.id), sp.total_amount * STARS_RATE, "Stars", sp.telegram_payment_charge_id)


@dp.message(Command("refund"))
async def cmd_refund(message: Message, command: CommandObject, bot: Bot) -> None:
    """Admin: /refund <user_id> <charge_id> — Stars to'lovini qaytarish."""
    if not message.from_user or message.from_user.id not in ADMIN_IDS:
        return
    try:
        uid, charge = (command.args or "").split()
        await bot.refund_star_payment(user_id=int(uid), telegram_payment_charge_id=charge)
        await message.answer("✅ Refunded")
    except Exception as e:  # noqa: BLE001
        await message.answer(f"Error: {e}")


@dp.message(F.web_app_data)
async def on_webapp_data(message: Message) -> None:
    log.info("web_app_data: %s", message.web_app_data.data)
    await message.answer("✅ Received")


@dp.message()
async def fallback(message: Message) -> None:
    await message.answer("Tap the button to open the app 👇", reply_markup=main_kb())


async def on_startup(bot: Bot) -> None:
    await bot.set_my_commands([
        BotCommand(command="start", description="Start"),
        BotCommand(command="app", description="Open the app"),
        BotCommand(command="ref", description="Referral link"),
        BotCommand(command="help", description="Help"),
    ])
    await bot.set_chat_menu_button(menu_button=MenuButtonWebApp(text=BRAND, web_app=WebAppInfo(url=WEBAPP_URL)))
    me = await bot.get_me()
    log.info("Bot: @%s | Mini App: %s | API: http://%s:%s | adminlar: %s", me.username, WEBAPP_URL, API_HOST, API_PORT, ADMIN_IDS or "yo'q")


async def main() -> None:
    runner = web.AppRunner(make_app())
    await runner.setup()
    await web.TCPSite(runner, API_HOST, API_PORT).start()
    log.info("API server: http://%s:%s", API_HOST, API_PORT)
    asyncio.create_task(giveaway_loop())
    asyncio.create_task(ton_deposit_loop())
    if not BOT_TOKEN:  # DEV_NOAUTH lokal sinov: faqat API
        log.warning("BOT_TOKEN yo'q — faqat API ishlayapti (DEV_NOAUTH)")
        await asyncio.Event().wait()
        return
    bot = Bot(BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    bot_ref["bot"] = bot
    dp.startup.register(on_startup)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
