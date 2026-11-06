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
import math
import os
import random
import time
import uuid
from urllib.parse import parse_qsl, quote

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
    CallbackQuery,
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
CHANNEL_ID = os.getenv("CHANNEL_ID", "").strip()   # avto-post kanali: @kanal yoki -100..., bot kanalga admin bo'lishi kerak
ADMIN_IDS = {int(x) for x in os.getenv("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip().isdigit()}
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8080"))
DATA_FILE = os.getenv("DATA_FILE", "riki_data.json")
DEV_NOAUTH = os.getenv("DEV_NOAUTH", "0") == "1"  # faqat lokal sinov uchun!
# ---- depozit
DEPOSIT_ADDRESS = os.getenv("DEPOSIT_ADDRESS", "").strip()      # TON hamyon manzili (depozit qabul qiladi)
TONCENTER_KEY = os.getenv("TONCENTER_KEY", "").strip()          # https://t.me/tonapibot dan bepul kalit
TONCENTER_URL = os.getenv("TONCENTER_URL", "https://toncenter.com/api/v2")
TON_RATE = float(os.getenv("TON_RATE", "100000"))              # 1 haqiqiy TON = shuncha balans
STARS_RATE = float(os.getenv("STARS_RATE", "800"))             # 1 Star = shuncha balans (125 ⭐ = 100 000)
MIN_TON_DEPOSIT = float(os.getenv("MIN_TON_DEPOSIT", "0.1"))
PUBLIC_API_URL = os.getenv("PUBLIC_API_URL", "").strip().rstrip("/")   # doimiy domen bo'lsa shu yerga
CF_METRICS = os.getenv("CF_METRICS", "127.0.0.1:45678")                  # cloudflared --metrics manzili (avto-aniqlash)
API_PUBLIC = {"url": PUBLIC_API_URL}
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


# ================================================================ SOZLAMALAR (admin paneldan o'zgaradi)
RTP_DEF = {"mines": 97, "dice": 98, "upgrade": 95, "cases": 92, "plinko": 100, "spins": 100}
DEF_CFG = {"ton_rate": TON_RATE, "stars_rate": STARS_RATE, "bot_max": 1000.0, "rk_min": 3, "rk_max": 4,
           "off": [], "maint": False, "rtp": RTP_DEF, "post_on": bool(CHANNEL_ID), "post_min": 1000.0,
           "ab_on": False, "ab_hours": 1.0, "ab_amount": 1000.0, "ab_uses": 500.0,      # avto bonus link
           "ds_on": False, "ds_hour": 21.0,                                                  # kunlik natijalar posti (Toshkent vaqti)
           "emoji": {}}                                                                      # premium emoji id'lari
GAMES = ["rocket", "pvp", "tvt", "roulette", "mines", "dice", "plinko", "upgrade", "crafts", "spins", "cases"]


def cfg(k: str):
    return store.d.setdefault("cfg", {}).get(k, DEF_CFG[k])


def epochs(uid: str) -> dict:
    e = store.d.setdefault("epoch", {"bal": 0, "pts": 0, "all": 0})
    u = store.d["users"].get(uid, {})
    return {"bal": f'{e.get("bal", 0)}.{u.get("ep_bal", 0)}', "pts": str(e.get("pts", 0)), "all": str(e.get("all", 0))}


def client_state(uid: str) -> dict:
    """Ilova har ping/stats'da oladi: reset epoxalari, o'chirilgan o'yinlar, texnik ishlar."""
    return {"ep": epochs(uid), "off": list(cfg("off")), "maint": bool(cfg("maint")),
            "tonRate": cfg("ton_rate"), "starsRate": cfg("stars_rate"), "rtp": {**RTP_DEF, **cfg("rtp")}}


# ---------------------------------------------------------------- statistika (kunlik)
def day_key(t: float | None = None) -> str:
    return time.strftime("%Y-%m-%d", time.gmtime(t or time.time()))


def stat_day() -> dict:
    d = store.d.setdefault("daily", {})
    k = day_key()
    if k not in d:
        d[k] = {"act": [], "g": {}}
        for old in sorted(d)[:-60]:
            d.pop(old, None)
    return d[k]


def stat_game(g: str, bet: float, win: float) -> None:
    x = stat_day()["g"].setdefault(g, {"b": 0.0, "w": 0.0, "n": 0})
    x["b"] = round(x["b"] + bet, 2); x["w"] = round(x["w"] + win, 2); x["n"] += 1


# ================================================================ KANAL KONTENTI: avto bonus link, rasmli postlar, so'rovnomalar
import re as _re
TZ_OFF = 5 * 3600   # Toshkent


def E(key: str, fb: str) -> str:
    """Premium (custom) emoji — admin sozlagan bo'lsa; aks holda oddiy emoji."""
    eid = cfg("emoji").get(key)
    return f'<tg-emoji emoji-id="{eid}">{fb}</tg-emoji>' if eid else fb


def strip_ce(t: str) -> str:
    return _re.sub(r'<tg-emoji emoji-id="\d+">(.*?)</tg-emoji>', r"\1", t or "")


def play_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text=f"🚀 Play {BRAND}", url=f"https://t.me/{bot_ref.get('uname', '')}?start=ch")]])


async def send_chat(bot, chat, text: str = "", photo=None, kb=None) -> bool:
    """Premium emoji rad etilsa (bot Fragment username'siz) — oddiy emoji bilan qayta yuboradi."""
    for attempt in (0, 1):
        t = text if attempt == 0 else strip_ce(text)
        try:
            if photo is not None:
                from aiogram.types import BufferedInputFile
                await bot.send_photo(chat, BufferedInputFile(photo, "post.png"), caption=t or None, reply_markup=kb)
            else:
                await bot.send_message(chat, t, reply_markup=kb, disable_web_page_preview=True)
            return True
        except Exception as e:  # noqa: BLE001
            if attempt == 0 and t != strip_ce(t):
                log.info("premium emoji rad etildi, oddiy emoji bilan: %s", e)
                continue
            log.info("post yuborilmadi (%s): %s", chat, e)
            return False
    return False


def bonus_post_text(code: str, uses: int, amount: float) -> str:
    link = f"https://t.me/{bot_ref.get('uname', '')}?start=bonus_{code}"
    return (f"{E('gift', '🎁')} <b>Link valid for {uses} people</b>\n\n"
            f"{E('link', '👉')}<a href=\"{link}\">Click here for details</a>{E('link', '👈')}")


async def auto_bonus(bot, force: bool = False, chat=None) -> str:
    uses, amount = int(cfg("ab_uses")), float(cfg("ab_amount"))
    code = "auto" + uuid.uuid4().hex[:6]
    async with store.lock:
        store.d.setdefault("bonus", {})[code] = {"amount": amount, "uses": uses, "left": uses, "by": 0, "t": int(time.time()), "claimed": [], "auto": True}
        store.d["ab_last"] = int(time.time())
        store.save()
    ok_ = await send_chat(bot, chat or CHANNEL_ID, bonus_post_text(code, uses, amount))
    return code if ok_ else ""


def card_png(title: str, sub: str = "", lines: list | None = None) -> bytes | None:
    """1280×720 rasmli post kartasi (RIKI uslubi). Pillow bo'lmasa — None (matnli post)."""
    try:
        from PIL import Image, ImageDraw, ImageFont, ImageFilter
    except ImportError:
        return None
    import io
    W, H = 1280, 720
    im = Image.new("RGB", (W, H), "#14072e")
    d = ImageDraw.Draw(im)
    for y in range(H):   # vertikal gradient
        k = y / H
        d.line([(0, y), (W, y)], fill=(int(40 + 30 * (1 - k)), int(14 + 6 * (1 - k)), int(90 + 60 * (1 - k))))
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
    g.ellipse((780, -160, 1440, 500), fill=(139, 108, 246, 120)); g.ellipse((-200, 420, 420, 1040), fill=(34, 211, 238, 70))
    im = Image.alpha_composite(im.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(90))).convert("RGB")
    d = ImageDraw.Draw(im)

    def font(sz, bold=True):
        for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                  "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"):
            try:
                return ImageFont.truetype(f, sz)
            except OSError:
                pass
        return ImageFont.load_default(size=sz)
    # olmos belgisi
    cx, cy, r = 1060, 250, 120
    d.polygon([(cx - r, cy - 40), (cx - r * .55, cy - r * .8), (cx + r * .55, cy - r * .8), (cx + r, cy - 40), (cx, cy + r)], fill="#2d9bff")
    d.polygon([(cx - r, cy - 40), (cx - r * .55, cy - r * .8), (cx + r * .55, cy - r * .8), (cx + r, cy - 40)], fill="#7fe3ff")
    d.polygon([(cx, cy - 60), (cx + 14, cy - 14), (cx + 60, cy), (cx + 14, cy + 14), (cx, cy + 60), (cx - 14, cy + 14), (cx - 60, cy), (cx - 14, cy - 14)], fill="#ffffff")
    d.rounded_rectangle((70, 70, 70 + 34 + d.textlength(BRAND, font=font(34)), 124), radius=14, fill="#8b6cf6")
    d.text((87, 77), BRAND, font=font(34), fill="#ffffff")
    y = 190
    for ln in _wrap(title, font(78), 820, d):
        d.text((70, y), ln, font=font(78), fill="#ffffff"); y += 92
    if sub:
        y += 10
        for ln in _wrap(sub, font(38, False), 880, d):
            d.text((70, y), ln, font=font(38, False), fill="#cfc8ff"); y += 50
    for i, ln in enumerate((lines or [])[:5]):
        yy = 470 + i * 46 if not sub else y + 20 + i * 46
        d.text((70, yy), ln, font=font(34), fill="#fde68a" if i == 0 else "#ffffff")
    d.rounded_rectangle((70, H - 120, 420, H - 56), radius=32, fill="#2d9bff")
    d.text((105, H - 110), "PLAY NOW  →", font=font(36), fill="#ffffff")
    buf = io.BytesIO(); im.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def _wrap(text: str, f, width: int, d) -> list:
    out, cur = [], ""
    for w in (text or "").split():
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= width:
            cur = t
        else:
            if cur:
                out.append(cur)
            cur = w
    if cur:
        out.append(cur)
    return out[:3]


def daily_summary() -> tuple[str, bytes | None]:
    now = time.time()
    day0 = int((now + TZ_OFF) // 86400 * 86400 - TZ_OFF) * 1000
    wins = sorted([x for x in store.d.get("feed", []) if x.get("t", 0) >= day0], key=lambda x: -x.get("v", 0))[:5]
    act = len(store.d.get("daily", {}).get(day_key(), {}).get("act", []))
    lines = [f"{i + 1}. {w['name']} — {w['v']:g} TON{(' · ' + w['n']) if w.get('n') else ''}" for i, w in enumerate(wins)]
    text = (f"{E('cup', '🏆')} <b>Today's biggest wins</b>\n\n" + ("\n".join(lines) or "No big wins yet — be the first!") +
            f"\n\n👥 Players today: <b>{act}</b>")
    return text, card_png("Today's biggest wins", f"{act} players played today", lines)


POLL_DEF = ("What should we add to RIKI next?", ["🪙 Coinflip 1 vs 1", "🎡 Wheel of Fortune", "📈 Limbo", "💬 Chat", "🇷🇺 Russian language"])


async def content_loop(bot) -> None:
    while True:
        await asyncio.sleep(30)
        try:
            if not CHANNEL_ID:
                continue
            now = time.time()
            if cfg("ab_on") and now - store.d.get("ab_last", 0) >= float(cfg("ab_hours")) * 3600:
                await auto_bonus(bot)
            loc = time.gmtime(now + TZ_OFF)
            if cfg("ds_on") and loc.tm_hour == int(cfg("ds_hour")) and store.d.get("ds_last") != time.strftime("%Y-%m-%d", loc):
                store.d["ds_last"] = time.strftime("%Y-%m-%d", loc); store.save()
                txt, png = daily_summary()
                await send_chat(bot, CHANNEL_ID, txt, png, play_kb())
        except Exception as e:  # noqa: BLE001
            log.warning("content_loop: %s", e)


def ch_kb() -> InlineKeyboardMarkup:
    B = InlineKeyboardButton
    em = cfg("emoji")
    return InlineKeyboardMarkup(inline_keyboard=[
        [B(text=("🟢 Auto bonus ON" if cfg("ab_on") else "⚪ Auto bonus OFF"), callback_data="ad:abt")],
        [B(text=f"⏱ Every {cfg('ab_hours'):g} h", callback_data="ad:sv:ab_hours"), B(text=f"💰 {cfg('ab_amount'):g} TON", callback_data="ad:sv:ab_amount"),
         B(text=f"👥 {cfg('ab_uses'):g}", callback_data="ad:sv:ab_uses")],
        [B(text="🎁 Post bonus link now", callback_data="ad:abnow"), B(text="👀 Preview to me", callback_data="ad:abprev")],
        [B(text=("🟢 Daily results ON" if cfg("ds_on") else "⚪ Daily results OFF"), callback_data="ad:dst"), B(text=f"🕘 at {int(cfg('ds_hour')):02d}:00", callback_data="ad:sv:ds_hour")],
        [B(text="🏆 Post daily results now", callback_data="ad:dsnow")],
        [B(text="🗳 Poll: what to add?", callback_data="ad:poll"), B(text="🖼 Image post", callback_data="ad:img")],
        [B(text=f"😎 Premium emoji ({len(em)} set)", callback_data="ad:emo")],
    ] + back_kb().inline_keyboard)


def ch_text() -> str:
    return ("📣 <b>Channel</b>" + (f" · <code>{CHANNEL_ID}</code>" if CHANNEL_ID else "\n⚠️ <b>CHANNEL_ID</b> is empty in .env — add it and make the bot a channel admin.") +
            f"\n\n🎁 Auto bonus link: {'<b>ON</b>' if cfg('ab_on') else 'off'} · every {cfg('ab_hours'):g} h · {cfg('ab_amount'):g} TON × {cfg('ab_uses'):g} people"
            f"\n🏆 Daily results: {'<b>ON</b>' if cfg('ds_on') else 'off'} at {int(cfg('ds_hour')):02d}:00 (Tashkent)"
            f"\n📣 Big win posts: {'<b>ON</b>' if cfg('post_on') else 'off'} (≥ {cfg('post_min'):g})"
            "\n\n<i>Premium emoji work only if the bot has a Fragment username; otherwise normal emoji are used automatically.</i>")


# ---------------------------------------------------------------- kanalga avto-post
POSTQ: list[str] = []


def post(text: str) -> None:
    if CHANNEL_ID and cfg("post_on"):
        POSTQ.append(text)
        del POSTQ[:-50]


def post_win(name: str, game: str, v: float, gift: str = "") -> None:
    if v >= float(cfg("post_min")):
        post(f"🏆 <b>{name}</b> won {'<b>' + gift + '</b> · ' if gift else ''}<b>{v:g} TON</b> in {game}!\nPlay 👉 @{bot_ref.get('uname', '')}")


async def post_loop(bot) -> None:
    while True:
        await asyncio.sleep(4)
        if POSTQ and CHANNEL_ID:
            t = POSTQ.pop(0)
            await send_chat(bot, CHANNEL_ID, t)


def _auth_raw(request: web.Request) -> dict:
    user = check_init_data(request.headers.get("X-Init-Data", ""))
    if user and user.get("id"):
        return user
    if DEV_NOAUTH:  # lokal sinov: "X-Dev-User: 123:Name"
        raw = request.headers.get("X-Dev-User", "0:Dev")
        uid, _, name = raw.partition(":")
        return {"id": int(uid or 0), "first_name": name or "Dev"}
    raise web.HTTPUnauthorized(text=json.dumps({"error": "unauthorized"}), content_type="application/json")


def auth_user(request: web.Request) -> dict:
    user = _auth_raw(request)
    if store.d["users"].get(str(user["id"]), {}).get("banned") and int(user["id"]) not in ADMIN_IDS:
        raise web.HTTPForbidden(text=json.dumps({"error": "banned"}), content_type="application/json")
    if cfg("maint") and int(user["id"]) not in ADMIN_IDS and request.path not in ("/api/ping", "/api/stats", "/api/rewards"):
        raise web.HTTPServiceUnavailable(text=json.dumps({"error": "maintenance"}), content_type="application/json")
    return user


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
    uid = str(user["id"])
    async with store.lock:
        u = store.d["users"].setdefault(uid, {"points": 0, "pvp": 0})
        u["name"] = u.get("name") or clean_name(user)
        u["username"] = (user.get("username") or u.get("username") or "").lower()
        u["seen"] = int(time.time())
        u.setdefault("joined", int(time.time()))
        store.save()
    return ok({"ok": True, "admin": is_admin(user), "id": user.get("id"), **client_state(uid)})


async def h_stats(request: web.Request) -> web.Response:
    user = auth_user(request)
    body = await request.json()
    uid = str(user["id"])
    async with store.lock:
        u = store.d["users"].setdefault(uid, {"points": 0, "pvp": 0})
        u["name"] = clean_name(user, str(body.get("name", "")))
        u["username"] = (user.get("username") or u.get("username") or "").lower()
        u["photo"] = str(body.get("photo", ""))[:300]
        # ballar faqat o'sishi mumkin (demo)
        ep = epochs(uid)
        if str(body.get("pe", "")) == ep["pts"] and str(body.get("ae", "")) == ep["all"]:   # eski qurilma reset'dan oldingi ballarni qaytara olmaydi
            week_points(u, min(int(body.get("points", 0) or 0), 10**12), "points")
            week_points(u, min(int(body.get("pvp", 0) or 0), 10**12), "pvp")
        sd = stat_day()
        if uid not in sd["act"]:
            sd["act"].append(uid)
        for row in (body.get("gl") or [])[:200]:
            try:
                g, bt, wn = str(row[0])[:16].lower(), float(row[1]), float(row[2])
                if 0 <= bt < 1e9 and 0 <= wn < 1e10:
                    stat_game(g, bt, wn)
            except (TypeError, ValueError, IndexError):
                pass
        if str(body.get("be", "")) == ep["bal"] and str(body.get("ae", "")) == ep["all"]:
            try:
                u["bal"] = round(max(0.0, float(body.get("bal", 0) or 0)), 2)
                u["inv"] = int(body.get("inv", 0) or 0)
                u["invv"] = round(float(body.get("invv", 0) or 0), 2)
            except (TypeError, ValueError):
                pass
        u["seen"] = int(time.time())
        store.save()
    return ok(client_state(uid))


async def h_leaderboard(request: web.Request) -> web.Response:
    auth_user(request)
    users = store.d["users"]
    wk = week_id()
    pts = lambda v, k: v.get(k + "_week", 0) if v.get(k + "_wk") == wk else 0  # noqa: E731
    lst = [{"id": int(k), "name": v.get("name", "Player"), "photo": v.get("photo", ""),
            "points": pts(v, "points"), "pvp": pts(v, "pvp")} for k, v in users.items()
           if k.lstrip("-").isdigit() and (pts(v, "points") > 0 or pts(v, "pvp") > 0)]
    lst.sort(key=lambda x: x["points"], reverse=True)
    now = time.time()
    online = sum(1 for v in users.values() if now - v.get("seen", 0) < 180)
    return ok({"list": lst[:500], "total": len(lst), "online": online, "week": wk, "endsAt": int((WEEK0 + (wk + 1) * 604800) * 1000),
               "prizes": LB_PRIZES, "last": store.d.get("lb_last", {})})


async def h_feed_get(request: web.Request) -> web.Response:
    auth_user(request)
    t = now_ms()
    return ok({"list": [x for x in store.d["feed"] if x.get("t", 0) <= t][:30]})


async def h_feed_post(request: web.Request) -> web.Response:
    user = auth_user(request)
    b = await request.json()
    item = {"sh": str(b.get("sh", ""))[:40], "n": str(b.get("n", ""))[:40], "v": round(float(b.get("v", 0) or 0), 2),
            "name": clean_name(user, str(b.get("name", ""))), "game": str(b.get("game", ""))[:20], "t": int(time.time() * 1000),
            "uid": int(user["id"]), "kind": "gift" if b.get("sh") else "ton"}
    if item["v"] <= 0 or (item["kind"] == "gift" and not item["n"]):
        return web.json_response({"error": "bad item"}, status=400)
    post_win(item["name"], item["game"] or "RIKI", item["v"], item["n"])
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
    t = now_ms()
    return ok({"list": [r for r in store.d["rewards"].get(str(user["id"]), []) if r.get("at", 0) <= t]})


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


async def h_promo(request: web.Request) -> web.Response:
    """Free Box promo-kodi: har o'yinchi bitta kodni bir marta ishlatadi."""
    user = auth_user(request)
    uid = str(user["id"])
    code = str((await request.json()).get("code", "")).strip().upper()[:32]
    async with store.lock:
        p = store.d.get("promo", {}).get(code)
        if not p:
            return web.json_response({"error": "Invalid promo code"}, status=404)
        if uid in p["claimed"]:
            return web.json_response({"error": "You already used this code"}, status=409)
        if p["left"] <= 0:
            return web.json_response({"error": "This code has run out"}, status=410)
        p["left"] -= 1
        p["claimed"].append(uid)
        store.save()
    return ok({"ok": True, "kind": p.get("kind", "freebox")})


async def h_dep_info(request: web.Request) -> web.Response:
    user = auth_user(request)
    return ok({"address": DEPOSIT_ADDRESS, "comment": f"dep_{user['id']}", "rate": cfg("stars_rate"), "tonRate": cfg("ton_rate"),
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
        description=f"Balance top up: +{round(stars * cfg('stars_rate'), 2)} TON",
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
                        await credit_deposit(str(uid), value * cfg("ton_rate"), "TON", h[:16])
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
            if winners:
                post("🎉 <b>Giveaway finished!</b>\n" + "\n".join(f"🎁 {w.get('n', '')} — <b>{w.get('name', '—')}</b>" for w in winners[:20]))
        store.save()
    bot = bot_ref.get("bot")
    for uid, gift_name in notify:
        if bot:
            try:
                await bot.send_message(uid, f"🎉 Congratulations! You won <b>{gift_name}</b> in a giveaway.\n"
                                            "Open the app — the gift will be in your Backpack.", reply_markup=main_kb())
            except Exception as e:  # noqa: BLE001
                log.info("g'olibga xabar yuborilmadi %s: %s", uid, e)


async def payout_week() -> None:
    """Hafta tugaganda TOP-10 o'yinchiga LB_PRIZES sovg'alari inbox orqali beriladi."""
    wk = week_id()
    if store.d.get("lb_paid_wk") is None:
        store.d["lb_paid_wk"] = wk - 1
        return
    if store.d["lb_paid_wk"] >= wk - 1:
        return
    prev = wk - 1
    async with store.lock:
        for key, title in (("points", "Leaderboard"), ("pvp", "PvP leaderboard")):
            rows = [(k, v.get(key + "_week", 0)) for k, v in store.d["users"].items()
                    if k.isdigit() and v.get(key + "_wk") == prev and v.get(key + "_week", 0) > 0]
            rows.sort(key=lambda x: x[1], reverse=True)
            winners = []
            for i, (uid, sc) in enumerate(rows[:len(LB_PRIZES)]):
                store.d["rewards"].setdefault(uid, []).append({"id": uuid.uuid4().hex[:10], "kind": "gift", "n": LB_PRIZES[i], "from": title, "ga": "lb"})
                winners.append({"uid": int(uid), "name": store.d["users"][uid].get("name", uid), "rank": i + 1, "s": sc})
            store.d.setdefault("lb_last", {})[key] = {"week": prev, "winners": winners}
        store.d["lb_paid_wk"] = prev
        store.save()
    log.info("haftalik reyting mukofotlari berildi: hafta %s", prev)


async def tunnel_loop(bot: "Bot | None") -> None:
    """cloudflared quick tunnel manzilini o'zi topadi (har qayta ishga tushganda o'zgaradi) va menyu tugmasini yangilaydi."""
    if PUBLIC_API_URL:
        return
    while True:
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=4)) as s:
                async with s.get(f"http://{CF_METRICS}/quicktunnel") as r:
                    host = (await r.json(content_type=None)).get("hostname", "")
            url = f"https://{host}" if host else ""
            if url and url != API_PUBLIC["url"]:
                API_PUBLIC["url"] = url
                log.info("API manzili topildi: %s", url)
                if bot:
                    await bot.set_chat_menu_button(menu_button=MenuButtonWebApp(text=BRAND, web_app=WebAppInfo(url=webapp_url())))
        except Exception as e:  # noqa: BLE001
            if not API_PUBLIC["url"]:
                log.warning("cloudflared topilmadi (%s): 'cloudflared tunnel --url http://localhost:%s --metrics %s' ni ishga tushiring yoki .env da PUBLIC_API_URL yozing",
                            type(e).__name__, API_PORT, CF_METRICS)
        await asyncio.sleep(15)


async def giveaway_loop() -> None:
    while True:
        try:
            await payout_week()
        except Exception as e:  # noqa: BLE001
            log.warning("reyting mukofoti xato: %s", e)
        try:
            await finalize_giveaways()
        except Exception as e:  # noqa: BLE001
            log.warning("finalize xato: %s", e)
        await asyncio.sleep(20)



# ================================================================ LIVE O'YINLAR (barcha o'yinchilar bitta raundda)
# Roulette / PvP — umumiy pot, g'olib hammasini oladi
# TvT          — Ice va Fire jamoalari
# Rocket       — umumiy crash raund, cashout server vaqti bo'yicha
LIVE_COLORS = ["#3df2ff", "#ff2d95", "#2563eb", "#ff6b5a", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#eab308"]
BOT_NAMES = {"roulette": "Roulette", "pvp": "PvP"}
RK_BOTS = [(-10, "Astro"), (-11, "Comet"), (-12, "Nova"), (-13, "Orbit"), (-14, "Pulsar"), (-15, "Vega"), (-16, "Zenith"), (-17, "Quasar")]   # Rocket botlari (BOT belgisi bilan ko'rinadi)


def rk_bot_auto() -> float:
    """Bot auto-cashout — crash qiymatidan mustaqil, tasodifiy."""
    return round(random.choice([1.2, 1.3, 1.5, 1.8, 2.0, 2.5, 3.0, 5.0]) * random.uniform(.95, 1.1), 2)
BET_TIME = 25.0   # 2+ o'yinchi bo'lgach kutish (s)
SPIN_TIME = 6.0   # g'ildirak aylanishi (s)
DONE_TIME = 5.0   # natija ko'rsatish (s)
RK_WAIT = 7.0     # rocket tikish vaqti (s)
RK_AFTER = 3.0    # crashdan keyin (s)

def now_ms() -> int:
    return int(time.time() * 1000)


def bot_amt(cap: float | None = None) -> float:
    cap = min(cap if cap is not None else 1e9, float(cfg("bot_max")))
    r = random.random()
    v = random.uniform(.1, 3) if r < .55 else random.uniform(3, 60) if r < .85 else random.uniform(60, 300) if r < .97 else random.uniform(300, 1000)
    return round(min(cap, v), 2)


def new_round(g: str, rid: int) -> dict:
    seed = uuid.uuid4().hex + uuid.uuid4().hex
    base = {"id": rid, "phase": "wait", "seed": seed, "hash": hashlib.sha256(seed.encode()).hexdigest(), "createdAt": now_ms()}
    if g == "rocket":
        r = random.random()
        crash = 1.0 if r < .03 else min(1000.0, max(1.0, int(0.97 / (1 - r) * 100) / 100))
        base.update({"startAt": now_ms() + int(RK_WAIT * 1000), "t0": 0, "crash": crash, "crashAt": 0, "bets": []})
    elif g == "tvt":
        base.update({"endAt": 0, "ice": [], "fire": [], "win": None, "doneAt": 0, "playAt": 0})
    else:
        base.update({"endAt": 0, "players": [], "winner": None, "spinAt": 0, "doneAt": 0})
    return base


LIVE: dict = {"roulette": new_round("roulette", 708000 + random.randint(0, 9000)), "pvp": new_round("pvp", 468000 + random.randint(0, 900)),
              "tvt": new_round("tvt", 25500 + random.randint(0, 900)), "rocket": new_round("rocket", 10200 + random.randint(0, 900))}
LIVE_HIST: dict = {"roulette": [], "pvp": [], "tvt": [], "rocket": []}
live_lock = asyncio.Lock()


def rk_mult(t: float) -> float:
    return int(math.exp(0.085 * max(0.0, t)) * 100) / 100


def pinfo(user: dict, body: dict) -> dict:
    u = store.d["users"].get(str(user["id"]), {})
    return {"uid": int(user["id"]), "name": clean_name(user, str(body.get("name", "") or u.get("name", ""))), "photo": str(body.get("photo", "") or u.get("photo", ""))[:300]}


def add_stake(lst: list, who: dict, ton: float, gifts: list, bot: bool = False) -> dict:
    p = next((x for x in lst if x["uid"] == who["uid"]), None)
    if not p:
        p = {**who, "ton": 0.0, "gifts": [], "amt": 0.0, "bot": bot, "c": LIVE_COLORS[len(lst) % len(LIVE_COLORS)]}
        lst.append(p)
    p["ton"] = round(p["ton"] + ton, 2)
    p["gifts"] += gifts
    p["amt"] = round(p["ton"] + sum(x["p"] for x in p["gifts"]), 2)
    return p


def clean_gifts(raw) -> list:
    out = []
    for x in (raw or [])[:50]:
        try:
            out.append({"sh": str(x.get("sh", ""))[:40], "n": str(x.get("n", ""))[:40], "p": round(float(x.get("p", 0) or 0), 2),
                        "m": str(x.get("m") or "")[:40], "ms": str(x.get("ms") or "")[:60]})
        except (TypeError, ValueError):
            pass
    return out


def reward(uid: int, item: dict, delay: float = 0) -> None:
    if uid <= 0:
        return  # botlar
    it = {"id": uuid.uuid4().hex[:10], **item}
    if delay:
        it["at"] = now_ms() + int(delay * 1000)   # animatsiya tugamaguncha ko'rsatilmaydi
    store.d["rewards"].setdefault(str(uid), []).append(it)


def pick_weighted(players: list, seed: str) -> dict:
    tot = sum(p["amt"] for p in players) or 1
    r = int(hashlib.sha256(seed.encode()).hexdigest()[:13], 16) / float(16 ** 13) * tot
    for p in players:
        if r < p["amt"]:
            return p
        r -= p["amt"]
    return players[-1]


WEEK0 = 4 * 86400 + 14 * 3600          # 1970-01-05 (dushanba) 14:00 UTC — haftalik reyting chegarasi
LB_PRIZES = ["Heart Locket", "Durov's Cap", "Precious Peach", "Astral Shard", "Ion Gem", "Magic Potion", "Swiss Watch", "Kissed Frog", "Toy Bear", "Jolly Chimp"]


def week_id(t: float | None = None) -> int:
    return int(((t or time.time()) - WEEK0) // 604800)


def feed_add(uid: int, name: str, game: str, v: float, gift: dict | None = None, delay: float = 0) -> None:
    """Live lenta: faqat haqiqiy o'yinchilar (uid > 0) va yakunlangan o'yinlar."""
    if uid <= 0 or v <= 0:
        return
    it = {"uid": uid, "name": name[:32], "game": game, "v": round(v, 2), "t": now_ms() + int(delay * 1000), "kind": "gift" if gift else "ton"}
    if gift:
        it.update({"sh": str(gift.get("sh", ""))[:40], "n": str(gift.get("n", ""))[:40], "v": round(float(gift.get("p", v) or v), 2)})
    store.d["feed"].insert(0, it)
    del store.d["feed"][60:]
    post_win(name, game, it["v"], it.get("n", ""))


def week_points(u: dict, total: int, key: str) -> None:
    """Umumiy ballardan haftalik ballarni hisoblaydi (hafta boshida asos saqlanadi)."""
    wk = week_id()
    if u.get(key + "_wk") != wk:
        u[key + "_wk"] = wk
        u[key + "_base"] = int(u.get(key, 0))
    u[key] = max(int(u.get(key, 0)), total)
    u[key + "_week"] = max(0, u[key] - int(u.get(key + "_base", 0)))


def settle_pot(g: str, R: dict) -> None:
    w = pick_weighted(R["players"], R["seed"])
    R["winner"] = w["uid"]
    tot = round(sum(p["amt"] for p in R["players"]), 2)
    ton = round(sum(p["ton"] for p in R["players"]), 2)
    label = "Roulette" if g == "roulette" else "PvP"
    if ton > 0:
        reward(w["uid"], {"kind": "win", "p": ton, "from": label, "tot": tot, "game": R["id"]}, SPIN_TIME)
        feed_add(w["uid"], w["name"], label, ton, delay=SPIN_TIME)
    for p in R["players"]:
        for x in p["gifts"]:
            reward(w["uid"], {"kind": "gift", "from": label, "win": True, "game": R["id"], **x}, SPIN_TIME)
            feed_add(w["uid"], w["name"], label, float(x.get("p", 0) or 0), x, delay=SPIN_TIME)
    LIVE_HIST[g].insert(0, {"id": R["id"], "n": w["name"], "photo": w.get("photo", ""), "tot": tot, "ch": round(w["amt"] / (tot or 1) * 100, 1),
                            "win": round(tot - w["amt"], 2), "t": now_ms() + int(SPIN_TIME * 1000), "uids": [p["uid"] for p in R["players"]],
                            "wuid": w["uid"], "ton": ton,
                            "pl": [{"uid": p["uid"], "name": p["name"], "photo": p.get("photo", ""), "bot": p["bot"], "ton": p["ton"], "amt": p["amt"],
                                    "gifts": [{k: x.get(k) for k in ("n", "sh", "p", "m", "ms")} for x in p["gifts"]]} for p in R["players"]]})
    del LIVE_HIST[g][50:]
    for p in R["players"]:
        if p["uid"] > 0:
            u = store.d["users"].setdefault(str(p["uid"]), {"points": 0, "pvp": 0})
            if p["uid"] == w["uid"]:
                u["pvp"] = int(u.get("pvp", 0) + tot * 100)


def settle_tvt(R: dict) -> None:
    it = sum(p["amt"] for p in R["ice"]); ft = sum(p["amt"] for p in R["fire"]); tot = it + ft
    r = int(hashlib.sha256(R["seed"].encode()).hexdigest()[:13], 16) / float(16 ** 13)
    win = "ice" if r < it / (tot or 1) else "fire"
    R["win"] = win
    wt = it if win == "ice" else ft
    for p in R[win]:
        share = round(p["amt"] / (wt or 1) * tot, 2)
        gv = round(sum(x["p"] for x in p["gifts"]), 2)
        for x in p["gifts"]:
            reward(p["uid"], {"kind": "gift", "from": "TvT", "win": True, "game": R["id"], **x}, 8)
            feed_add(p["uid"], p["name"], "TvT", float(x.get("p", 0) or 0), x, delay=8)
        if share - gv > 0:
            reward(p["uid"], {"kind": "win", "p": round(share - gv, 2), "from": "TvT", "tot": share, "game": R["id"]}, 8)
            feed_add(p["uid"], p["name"], "TvT", share - gv, delay=8)
    LIVE_HIST["tvt"].insert(0, {"id": R["id"], "win": win, "i": round(it, 2), "f": round(ft, 2), "t": now_ms() + 8000,
                                "uids": [p["uid"] for p in R["ice"] + R["fire"]],
                                "pl": [{"uid": p["uid"], "name": p["name"], "photo": p.get("photo", ""), "bot": p["bot"], "team": tm,
                                        "amt": round(p["amt"], 2)} for tm in ("ice", "fire") for p in R[tm]]})
    del LIVE_HIST["tvt"][60:]


async def live_loop() -> None:
    while True:
        try:
            async with live_lock:
                t = now_ms()
                for g in ("roulette", "pvp"):
                    R = LIVE[g]
                    if R["phase"] == "wait":
                        bot = next((p for p in R["players"] if p["bot"]), None)
                        humans = any(not p["bot"] for p in R["players"])
                        if not bot and humans and random.random() < .03:
                            add_stake(R["players"], {"uid": -1 if g == "roulette" else -2, "name": BOT_NAMES[g], "photo": ""}, bot_amt(), [], True)
                        elif bot and bot["amt"] < cfg("bot_max") and random.random() < .002:
                            add_stake(R["players"], bot, bot_amt(cfg("bot_max") - bot["amt"]), [], True)
                        if len(R["players"]) >= 2 and not R["endAt"]:
                            R["endAt"] = t + int(BET_TIME * 1000)
                        if R["endAt"] and t >= R["endAt"]:
                            settle_pot(g, R); R["phase"] = "spin"; R["spinAt"] = t
                            store.save()
                    elif R["phase"] == "spin" and t >= R["spinAt"] + SPIN_TIME * 1000:
                        R["phase"] = "done"; R["doneAt"] = t
                    elif R["phase"] == "done" and t >= R["doneAt"] + DONE_TIME * 1000:
                        LIVE[g] = new_round(g, R["id"] + 1)
                R = LIVE["tvt"]
                if R["phase"] == "wait":
                    humans = any(not p["bot"] for p in R["ice"] + R["fire"])
                    for team, nm, bid in (("ice", "Ice", -3), ("fire", "Fire", -4)):
                        bot = next((p for p in R[team] if p["bot"]), None)
                        other = R["fire" if team == "ice" else "ice"]
                        if not bot and humans and (other and not R[team] and random.random() < .06 or random.random() < .012):
                            add_stake(R[team], {"uid": bid, "name": nm, "photo": ""}, bot_amt(), [], True)
                        elif bot and bot["amt"] < cfg("bot_max") and random.random() < .0025:
                            add_stake(R[team], bot, bot_amt(cfg("bot_max") - bot["amt"]), [], True)
                    if R["ice"] and R["fire"] and not R["endAt"]:
                        R["endAt"] = t + 20000
                    if R["endAt"] and t >= R["endAt"]:
                        settle_tvt(R); R["phase"] = "play"; R["playAt"] = t
                        store.save()
                elif R["phase"] == "play" and t >= R["playAt"] + 7500:
                    R["phase"] = "done"; R["doneAt"] = t
                elif R["phase"] == "done" and t >= R["doneAt"] + DONE_TIME * 1000:
                    LIVE["tvt"] = new_round("tvt", R["id"] + 1)
                R = LIVE["rocket"]
                if R["phase"] == "wait":
                    if "nbots" not in R:
                        R["nbots"] = random.randint(int(cfg("rk_min")), max(int(cfg("rk_min")), int(cfg("rk_max"))))
                    have = [b for b in R["bets"] if b.get("bot")]
                    if len(have) < min(R["nbots"], len(RK_BOTS)) and random.random() < .07:
                        uid, nm = next(x for x in RK_BOTS if x[0] not in {b["uid"] for b in have})
                        R["bets"].append({"uid": uid, "name": nm, "photo": "", "amt": bot_amt(), "auto": rk_bot_auto(), "out": 0, "gift": False, "bot": True})
                if R["phase"] == "wait" and t >= R["startAt"]:
                    R["phase"] = "fly"; R["t0"] = t
                if R["phase"] == "fly":
                    m = rk_mult((t - R["t0"]) / 1000)
                    for b in R["bets"]:
                        if not b["out"] and b["auto"] and m >= b["auto"] and b["auto"] <= R["crash"]:
                            b["out"] = b["auto"]
                            feed_add(b["uid"], b.get("name", ""), "Rocket", b["amt"] * b["auto"])
                    if m >= R["crash"]:
                        R["phase"] = "crash"; R["crashAt"] = t
                        LIVE_HIST["rocket"].insert(0, R["crash"]); del LIVE_HIST["rocket"][20:]
                elif R["phase"] == "crash" and t >= R["crashAt"] + RK_AFTER * 1000:
                    LIVE["rocket"] = new_round("rocket", R["id"] + 1)
        except Exception as e:  # noqa: BLE001
            log.warning("live_loop xato: %s", e)
        await asyncio.sleep(.25)


def pub_players(lst: list) -> list:
    return [{k: p[k] for k in ("uid", "name", "photo", "ton", "gifts", "amt", "bot", "c")} for p in lst]


def live_public(g: str) -> dict:
    R = LIVE[g]
    t = now_ms()
    out = {"g": g, "id": R["id"], "phase": R["phase"], "hash": R["hash"], "now": t,
           "hist": [h for h in LIVE_HIST[g] if not isinstance(h, dict) or h.get("t", 0) <= t][:20]}   # natija animatsiyadan oldin ko'rinmaydi
    if g == "rocket":
        out.update({"startAt": R["startAt"], "t0": R["t0"], "crashAt": R["crashAt"],
                    "crash": R["crash"] if R["phase"] == "crash" else None,
                    "bets": [{**{k: b[k] for k in ("uid", "name", "photo", "amt", "auto", "out", "gift")}, "bot": bool(b.get("bot"))} for b in R["bets"]]})
    elif g == "tvt":
        out.update({"endAt": R["endAt"], "ice": pub_players(R["ice"]), "fire": pub_players(R["fire"]),
                    "win": R["win"] if R["phase"] != "wait" else None, "playAt": R["playAt"]})
    else:
        out.update({"endAt": R["endAt"], "players": pub_players(R["players"]), "spinAt": R["spinAt"],
                    "winner": R["winner"] if R["phase"] != "wait" else None,
                    "seed": R["seed"] if R["phase"] != "wait" else None})
    return out


async def h_live(request: web.Request) -> web.Response:
    user = auth_user(request)
    g = request.query.get("g", "")
    if g not in LIVE:
        return web.json_response({"error": "unknown game"}, status=400)
    u = store.d["users"].get(str(user["id"]))
    if u is not None:
        u["seen"] = int(time.time())
    return ok(live_public(g))


async def h_live_bet(request: web.Request) -> web.Response:
    user = auth_user(request)
    b = await request.json()
    g = b.get("g", "")
    if g not in LIVE:
        return web.json_response({"error": "unknown game"}, status=400)
    if g in cfg("off"):
        return web.json_response({"error": "This game is temporarily disabled"}, status=403)
    ton = round(float(b.get("ton", 0) or 0), 2)
    gifts = clean_gifts(b.get("gifts"))
    if ton < 0 or (ton < .1 and not gifts):
        return web.json_response({"error": "Minimum bet 0.10"}, status=400)
    who = pinfo(user, b)
    async with live_lock:
        R = LIVE[g]
        if R["phase"] != "wait" or (g != "rocket" and R.get("endAt") and now_ms() > R["endAt"] - 500):
            return web.json_response({"error": "Round in progress"}, status=409)
        if g == "rocket":
            if any(x["uid"] == who["uid"] for x in R["bets"]):
                return web.json_response({"error": "Bet already placed"}, status=409)
            amt = round(ton + sum(x["p"] for x in gifts), 2)
            auto = float(b.get("auto", 0) or 0)
            R["bets"].append({**who, "amt": amt, "auto": round(auto, 2) if auto >= 1.01 else 0, "out": 0, "gift": bool(gifts)})
        elif g == "tvt":
            team = b.get("team")
            if team not in ("ice", "fire"):
                return web.json_response({"error": "team: ice/fire"}, status=400)
            other = "fire" if team == "ice" else "ice"
            if any(x["uid"] == who["uid"] for x in R[other]):
                return web.json_response({"error": "You're already on the other team"}, status=409)
            add_stake(R[team], who, ton, gifts)
        else:
            add_stake(R["players"], who, ton, gifts)
        return ok(live_public(g))


async def h_live_cancel(request: web.Request) -> web.Response:
    user = auth_user(request)
    async with live_lock:
        R = LIVE["rocket"]
        b = next((x for x in R["bets"] if x["uid"] == int(user["id"])), None)
        if not b or R["phase"] != "wait" or b["gift"]:
            return web.json_response({"error": "Can't cancel"}, status=409)
        R["bets"].remove(b)
        return ok({"ok": True, "amt": b["amt"]})


async def h_live_cashout(request: web.Request) -> web.Response:
    user = auth_user(request)
    async with live_lock:
        R = LIVE["rocket"]
        b = next((x for x in R["bets"] if x["uid"] == int(user["id"])), None)
        if not b:
            return web.json_response({"error": "No bet"}, status=404)
        if b["out"]:
            return ok({"m": b["out"], "amt": b["amt"]})
        if R["phase"] != "fly":
            return web.json_response({"error": "Crashed"}, status=409)
        m = rk_mult((now_ms() - R["t0"]) / 1000)
        if m >= R["crash"]:
            return web.json_response({"error": "Crashed"}, status=409)
        b["out"] = m
        feed_add(b["uid"], b.get("name", ""), "Rocket", b["amt"] * m)
        return ok({"m": m, "amt": b["amt"]})


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
    r.add_get("/api/live", h_live)
    r.add_post("/api/live/bet", h_live_bet)
    r.add_post("/api/live/cancel", h_live_cancel)
    r.add_post("/api/live/cashout", h_live_cashout)
    r.add_post("/api/promo", h_promo)
    r.add_get("/api/rewards", h_rewards)
    r.add_post("/api/rewards/claim", h_rewards_claim)
    r.add_get("/", lambda req: web.Response(text=f"{BRAND} API ishlayapti"))
    return app


# ================================================================ bot
dp = Dispatcher()


def webapp_url(start_param: str = "") -> str:
    """Mini App havolasi: server manzili (?api=) avtomatik qo'shiladi — ilova o'zi serverga ulanadi."""
    url = WEBAPP_URL
    q = []
    if API_PUBLIC["url"]:
        q.append("api=" + quote(API_PUBLIC["url"], safe=""))
    if start_param:
        q.append("tgWebAppStartParam=" + quote(start_param, safe=""))
    if q:
        url += ("&" if "?" in url else "?") + "&".join(q)
    return url


def app_url(start_param: str = "") -> str:
    return webapp_url(start_param)


def main_kb(start_param: str = "") -> InlineKeyboardMarkup:
    rows = [[InlineKeyboardButton(text=f"🚀 Open {BRAND}", web_app=WebAppInfo(url=app_url(start_param)))]]
    if CHANNEL_URL:
        rows.append([InlineKeyboardButton(text="📢 Channel", url=CHANNEL_URL)])
    return InlineKeyboardMarkup(inline_keyboard=rows)


@dp.message(CommandStart())
async def cmd_start(message: Message, command: CommandObject) -> None:
    param = (command.args or "").strip()
    if message.from_user and store.d["users"].get(str(message.from_user.id), {}).get("banned"):
        await message.answer("🚫 Your account has been blocked. Contact support if you think this is a mistake.")
        return
    name = message.from_user.first_name if message.from_user else "do'st"
    text = (
        f"👋 Hi, <b>{name}</b>!\n\n"
        f"🎁 <b>{BRAND}</b> — Telegram NFT gift games:\n"
        "Rocket, PvP, TvT, Roulette, Upgrade, Mines, Spins, Plinko, Dice, Crafts and boxes.\n\n"
        "Tap the button below 👇"
    )
    if param.startswith("bonus_") and message.from_user:
        await redeem_bonus(message, param[6:])
        return
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


ADMIN_WAIT: dict[int, str] = {}   # admin_id -> kutilayotgan amal (add/sub/bonus/bc/find)


def admin_kb() -> InlineKeyboardMarkup:
    B = InlineKeyboardButton
    return InlineKeyboardMarkup(inline_keyboard=[
        [B(text="📊 Dashboard", callback_data="ad:stats"), B(text="📈 Charts", callback_data="ad:chart")],
        [B(text="➕ Add balance", callback_data="ad:add"), B(text="➖ Remove", callback_data="ad:sub")],
        [B(text="🔎 Find player", callback_data="ad:find"), B(text="👥 Players", callback_data="ad:users")],
        [B(text="💰 Top balances", callback_data="ad:topbal"), B(text="🚫 Ban / Unban", callback_data="ad:ban")],
        [B(text="🎁 Bonus link", callback_data="ad:bonus"), B(text="🔗 Links", callback_data="ad:blist")],
        [B(text="🎟 Free box code", callback_data="ad:pc"), B(text="📋 Codes", callback_data="ad:pclist")],
        [B(text="🎉 Giveaways", callback_data="ad:ga"), B(text="📢 Broadcast", callback_data="ad:bc")],
        [B(text="💳 Deposits", callback_data="ad:deps"), B(text="🎰 RTP", callback_data="ad:rtp")],
        [B(text="⚙️ Settings", callback_data="ad:set"), B(text="🧹 Reset", callback_data="ad:rst")],
        [B(text="📣 Channel & posts", callback_data="ad:ch"), B(text="❓ Group commands", callback_data="ad:gh")],
        [B(text=f"🚀 Open {BRAND}", web_app=WebAppInfo(url=webapp_url()))],
    ])


def back_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="⬅️ Back", callback_data="ad:home")]])


def admin_home_text() -> str:
    us = store.d["users"]
    deps = store.d.get("deposits", [])
    now = time.time(); day = now - 86400
    real = [x for x in deps if x.get("src") in ("TON", "Stars")]
    act = [g for g in store.d["giveaways"] if g.get("status") == "active"]
    online = sum(1 for v in us.values() if v.get("seen", 0) > now - 120)
    today = store.d.get("daily", {}).get(day_key(), {})
    prof = round(sum(g["b"] - g["w"] for g in today.get("g", {}).values()), 2)
    st = "🔴 MAINTENANCE" if cfg("maint") else "🟢 Online"
    return (
        f"🛠 <b>{BRAND} · Admin panel</b>   {st}\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"👥 <b>Players</b>\n"
        f"   Total <b>{len(us)}</b> · online <b>{online}</b> · new 24h <b>{sum(1 for v in us.values() if v.get('joined', 0) > day)}</b>\n"
        f"   Active today <b>{len(today.get('act', []))}</b> · banned <b>{sum(1 for v in us.values() if v.get('banned'))}</b>\n\n"
        f"💳 <b>Deposits</b>\n"
        f"   Today <b>{round(sum(x['amount'] for x in real if x['t'] > day), 2):g}</b> · all time <b>{round(sum(x['amount'] for x in real), 2):g}</b> ({len(real)})\n\n"
        f"🏦 <b>House profit today</b>: <b>{'+' if prof >= 0 else ''}{prof:g}</b>\n\n"
        f"🎁 Bonus links <b>{sum(1 for b in store.d.get('bonus', {}).values() if b['left'] > 0)}</b> · "
        f"🎟 codes <b>{sum(1 for b in store.d.get('promo', {}).values() if b['left'] > 0)}</b> · 🎉 giveaways <b>{len(act)}</b>\n"
        f"{('❌ Off: ' + ', '.join(cfg('off')) + chr(10)) if cfg('off') else ''}"
        f"💱 1 TON = <b>{cfg('ton_rate'):g}</b> · 125 ⭐ = <b>{125 * cfg('stars_rate'):g}</b>\n"
        f"━━━━━━━━━━━━━━━━━━"
    )


def is_adm(uid: int) -> bool:
    return uid in ADMIN_IDS


@dp.message(Command("admin"))
async def cmd_admin(message: Message) -> None:
    uid = message.from_user.id if message.from_user else 0
    if not is_adm(uid):
        await message.answer(f"You are not an admin. ID: <code>{uid}</code>\n(add it to ADMIN_IDS in .env)")
        return
    ADMIN_WAIT.pop(uid, None)
    await message.answer(admin_home_text(), reply_markup=admin_kb())


def find_user_any(q: str):
    f = find_user(q)
    if f:
        return f
    q = (q or "").strip().lstrip("@")
    if q.isdigit():
        return q, store.d["users"].setdefault(q, {"points": 0, "pvp": 0, "name": q})
    return None


def parse_amount(x: str) -> float | None:
    try:
        x = x.lower().replace(",", ".").replace(" ", "")
        mul = 1000 if x.endswith("k") else 1_000_000 if x.endswith("m") else 1
        return round(float(x.rstrip("km")) * mul, 2)
    except ValueError:
        return None


async def admin_adjust(bot: Bot, admin_id: int, who: str, amount: float, sign: int) -> str:
    f = find_user_any(who)
    if not f or not amount or amount <= 0:
        return "❌ User not found (they must open the app once) or bad amount"
    uid, u = f
    val = round(amount * sign, 2)
    async with store.lock:
        store.d["rewards"].setdefault(uid, []).append({"id": uuid.uuid4().hex[:10], "kind": "gram", "p": val,
                                                      "from": "Deposit" if sign > 0 else "Admin", "src": "admin"})
        u["adm"] = round(u.get("adm", 0) + val, 2)
        store.d.setdefault("admin_log", []).insert(0, {"uid": int(uid), "amount": val, "by": admin_id, "t": int(time.time())})
        del store.d["admin_log"][2000:]
        store.save()
    try:
        if sign > 0:
            await bot.send_message(int(uid), f"✅ Your balance was topped up: <b>+{amount:g} TON</b>.\nOpen the app to see it.", reply_markup=main_kb())
    except Exception as e:  # noqa: BLE001
        log.info("admin xabari yuborilmadi: %s", e)
    return f"✅ {'+' if sign > 0 else '−'}{amount:g} TON → <b>{u.get('name', uid)}</b> (<code>{uid}</code>)\nApplied when they open the app."


GROUP_HELP = (
    "👥 <b>Group commands</b> (admins only)\n"
    "Add the bot to your group and make it an admin. Then <b>reply</b> to a player's message:\n\n"
    "<code>/add 1000</code> — add balance\n"
    "<code>/take 1000</code> — remove balance\n"
    "<code>/zero</code> — balance to 0\n"
    "<code>/ban</code> · <code>/unban</code> — block / unblock in the app\n"
    "<code>/bal</code> — show balance & gifts\n"
    "<code>/info</code> — full player card\n\n"
    "Without reply: <code>/add 123456789 1000</code> or <code>/add @username 1000</code>.\n"
    "Amounts: <code>1000</code>, <code>50k</code>, <code>1.5m</code>."
)


async def cmd_target(message: Message, command: CommandObject):
    """Kim haqida: reply qilingan xabar egasi yoki birinchi argument (ID/@username). Qaytaradi (uid, user, qolgan argumentlar)."""
    args = (command.args or "").split()
    r = message.reply_to_message
    if r and r.from_user and not r.from_user.is_bot:
        fu = r.from_user
        uid = str(fu.id)
        async with store.lock:
            u = store.d["users"].setdefault(uid, {"points": 0, "pvp": 0})
            u["name"] = u.get("name") or clean_name({"username": fu.username, "first_name": fu.first_name})
            if fu.username:
                u["username"] = fu.username.lower()
            store.save()
        return uid, u, args
    if args:
        f = find_user_any(args[0])
        if f:
            return f[0], f[1], args[1:]
    return None, None, args


def who(uid: str, u: dict) -> str:
    return f"<b>{u.get('name', uid)}</b>{(' @' + u['username']) if u.get('username') else ''} (<code>{uid}</code>)"


async def admin_cmd(message: Message, command: CommandObject, bot: Bot, kind: str) -> None:
    if not message.from_user or not is_adm(message.from_user.id):
        return
    uid, u, rest = await cmd_target(message, command)
    if not uid:
        await message.reply("↩️ Reply to a player's message, or give an ID / @username (e.g. <code>/add 123456789 1000</code>).")
        return
    if kind in ("add", "take"):
        amt = parse_amount(rest[0]) if rest else None
        if not amt or amt <= 0:
            await message.reply(f"Usage: reply + <code>/{kind} 1000</code>")
            return
        res = await admin_adjust(bot, message.from_user.id, uid, amt, 1 if kind == "add" else -1)
        await message.reply(res.replace("\nApplied when they open the app.", "") + "\n<i>Applied when they open the app.</i>")
    elif kind == "zero":
        async with store.lock:
            u["ep_bal"] = u.get("ep_bal", 0) + 1; u["bal"] = 0; store.save()
        await message.reply(f"🧹 Balance → 0 for {who(uid, u)}")
    elif kind in ("ban", "unban"):
        async with store.lock:
            u["banned"] = kind == "ban"
            if kind == "ban" and rest:
                u["ban_reason"] = " ".join(rest)[:100]
            store.save()
        await message.reply(f"{'🚫 Banned' if kind == 'ban' else '✅ Unbanned'}: {who(uid, u)}" + (f"\nReason: {u.get('ban_reason')}" if kind == "ban" and u.get("ban_reason") else ""))
        try:
            await bot.send_message(int(uid), "🚫 Your account has been blocked." if kind == "ban" else "✅ Your account has been unblocked.")
        except Exception:  # noqa: BLE001
            pass
    elif kind in ("bal", "info"):
        deps = [x for x in store.d.get("deposits", []) if str(x["uid"]) == uid and x.get("src") in ("TON", "Stars")]
        seen = u.get("seen")
        txt = (f"👤 {who(uid, u)}{'  🚫 BANNED' if u.get('banned') else ''}\n"
               f"💰 Balance: <b>{u.get('bal', 0):g}</b> TON · 🎁 {u.get('inv', 0)} gifts ({u.get('invv', 0):g})")
        if kind == "info":
            txt += (f"\n💳 Deposits: <b>{len(deps)}</b> · {round(sum(x['amount'] for x in deps), 2):g}"
                    f"\n🛠 Admin adjustments: {u.get('adm', 0):g}"
                    f"\n🏆 Points: {u.get('points', 0)} · PvP: {u.get('pvp', 0)}"
                    f"\n🕒 Last seen: {time.strftime('%d.%m %H:%M', time.localtime(seen)) if seen else '—'}")
        await message.reply(txt)


@dp.message(Command("add", "give"))
async def cmd_add(message: Message, command: CommandObject, bot: Bot) -> None:
    await admin_cmd(message, command, bot, "add")


@dp.message(Command("take"))
async def cmd_take(message: Message, command: CommandObject, bot: Bot) -> None:
    await admin_cmd(message, command, bot, "take")


@dp.message(Command("zero"))
async def cmd_zero(message: Message, command: CommandObject, bot: Bot) -> None:
    await admin_cmd(message, command, bot, "zero")


@dp.message(Command("ban"))
async def cmd_ban(message: Message, command: CommandObject, bot: Bot) -> None:
    await admin_cmd(message, command, bot, "ban")


@dp.message(Command("unban"))
async def cmd_unban(message: Message, command: CommandObject, bot: Bot) -> None:
    await admin_cmd(message, command, bot, "unban")


@dp.message(Command("bal"))
async def cmd_bal(message: Message, command: CommandObject, bot: Bot) -> None:
    await admin_cmd(message, command, bot, "bal")


@dp.message(Command("info"))
async def cmd_info(message: Message, command: CommandObject, bot: Bot) -> None:
    await admin_cmd(message, command, bot, "info")


@dp.message(Command("promo"))
async def cmd_promo(message: Message, command: CommandObject) -> None:
    """Admin: /promo CODE 100 — Free Box kodi."""
    if not message.from_user or not is_adm(message.from_user.id):
        return
    parts = (command.args or "").split()
    if len(parts) != 2 or not parts[1].isdigit():
        await message.reply("Usage: <code>/promo RIKI2026 100</code>")
        return
    code = parts[0].upper()[:32]
    async with store.lock:
        store.d.setdefault("promo", {})[code] = {"uses": int(parts[1]), "left": int(parts[1]), "claimed": [], "kind": "freebox", "t": int(time.time())}
        store.save()
    await message.reply(f"✅ Free box code <code>{code}</code> · {parts[1]} uses")


async def bot_username(bot: Bot) -> str:
    if not bot_ref.get("uname"):
        bot_ref["uname"] = (await bot.get_me()).username
    return bot_ref["uname"]


async def create_bonus(bot: Bot, admin_id: int, amount: float, uses: int, code: str = "") -> str:
    code = (code or uuid.uuid4().hex[:8]).strip()
    async with store.lock:
        store.d.setdefault("bonus", {})[code] = {"amount": amount, "uses": uses, "left": uses, "by": admin_id,
                                                  "t": int(time.time()), "claimed": []}
        store.save()
    link = f"https://t.me/{await bot_username(bot)}?start=bonus_{code}"
    return (f"🎁 <b>Bonus link created</b>\nAmount: <b>{amount:g} TON</b> · uses: <b>{uses}</b>\n\n"
            f"<code>{link}</code>\n\nEach player can claim it once.")


@dp.message(Command("bonus"))
async def cmd_bonus(message: Message, command: CommandObject, bot: Bot) -> None:
    """Admin: /bonus <miqdor> <soni> [kod]"""
    if not message.from_user or not is_adm(message.from_user.id):
        return
    parts = (command.args or "").split()
    amt = parse_amount(parts[0]) if parts else None
    uses = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
    if not amt or amt <= 0 or uses <= 0:
        await message.answer("Usage: <code>/bonus 50000 100</code> (amount, number of uses)")
        return
    await message.answer(await create_bonus(bot, message.from_user.id, amt, uses, parts[2] if len(parts) > 2 else ""))


async def redeem_bonus(message: Message, code: str) -> None:
    uid = str(message.from_user.id)
    async with store.lock:
        b = store.d.get("bonus", {}).get(code)
        if not b:
            await message.answer("❌ This bonus link is invalid.", reply_markup=main_kb())
            return
        if uid in b["claimed"]:
            await message.answer("ℹ️ You have already claimed this bonus.", reply_markup=main_kb())
            return
        if b["left"] <= 0:
            await message.answer("⌛ This bonus link has run out.", reply_markup=main_kb())
            return
        b["left"] -= 1
        b["claimed"].append(uid)
        u = store.d["users"].setdefault(uid, {"points": 0, "pvp": 0, "name": clean_name({"username": message.from_user.username, "first_name": message.from_user.first_name})})
        u.setdefault("joined", int(time.time()))
        store.d["rewards"].setdefault(uid, []).append({"id": uuid.uuid4().hex[:10], "kind": "gram", "p": b["amount"], "from": "Bonus", "src": "bonus"})
        store.save()
    await message.answer(f"🎁 <b>Bonus activated!</b>\n+<b>{b['amount']:g} TON</b> will be added when you open the app 👇", reply_markup=main_kb())


def set_kb() -> InlineKeyboardMarkup:
    B = InlineKeyboardButton
    off = cfg("off")
    rows = [[B(text=f"💱 1 TON = {cfg('ton_rate'):g}", callback_data="ad:sv:ton_rate"), B(text=f"⭐ 1 Star = {cfg('stars_rate'):g}", callback_data="ad:sv:stars_rate")],
            [B(text=f"🤖 Bot max bet: {cfg('bot_max'):g}", callback_data="ad:sv:bot_max"), B(text=f"🚀 Rocket bots: {cfg('rk_min')}–{cfg('rk_max')}", callback_data="ad:sv:rk")],
            [B(text=("🔴 Maintenance ON — tap to turn off" if cfg("maint") else "🟢 Maintenance OFF — tap to turn on"), callback_data="ad:maint")]]
    rows.append([B(text=(f"📣 Auto-post ON (≥ {cfg('post_min'):g})" if cfg("post_on") else "📣 Auto-post OFF") + ("" if CHANNEL_ID else " · no CHANNEL_ID"), callback_data="ad:post"),
                 B(text="✏️ Post min", callback_data="ad:sv:post_min")])
    g = [B(text=("❌ " if x in off else "✅ ") + x.capitalize(), callback_data=f"ad:gt:{x}") for x in GAMES]
    rows += [g[i:i + 3] for i in range(0, len(g), 3)]
    return InlineKeyboardMarkup(inline_keyboard=rows + back_kb().inline_keyboard)


def rst_kb() -> InlineKeyboardMarkup:
    B = InlineKeyboardButton
    return InlineKeyboardMarkup(inline_keyboard=[
        [B(text="💰 Zero ALL balances", callback_data="ad:rq:bal")],
        [B(text="🏆 Zero ALL leaderboard points", callback_data="ad:rq:pts")],
        [B(text="👤 Zero one player's balance", callback_data="ad:rq1")],
        [B(text="♻️ FULL bot reset", callback_data="ad:rq:all")],
    ] + back_kb().inline_keyboard)


RST_TXT = {"bal": "💰 <b>Zero ALL balances?</b>\nEvery player's balance becomes 0 the next time their app connects. Gifts in backpacks stay.",
           "pts": "🏆 <b>Zero ALL leaderboard points?</b>\nWeekly and PvP points of every player become 0. The leaderboard starts from scratch.",
           "all": "♻️ <b>FULL reset?</b>\nBalances, backpacks, points, history, Live feed, giveaways, bonus links and pending rewards are erased for everyone.\n"
                  "Kept: player list, bans, settings and the deposit log."}


async def do_reset(kind: str) -> str:
    async with store.lock:
        e = store.d.setdefault("epoch", {"bal": 0, "pts": 0, "all": 0})
        us = store.d["users"]
        if kind in ("pts", "all"):
            for u in us.values():
                for k in ("points", "pvp", "points_week", "pvp_week", "points_base", "pvp_base"):
                    u[k] = 0
                u.pop("points_wk", None); u.pop("pvp_wk", None)
            store.d["lb_last"] = {}
        if kind in ("bal", "all"):
            for u in us.values():
                u["bal"] = 0; u["inv"] = 0; u["invv"] = 0
        if kind == "all":
            store.d["feed"] = []; store.d["giveaways"] = []; store.d["rewards"] = {}
            store.d["bonus"] = {}; store.d["admin_log"] = []
            for g in LIVE_HIST:
                LIVE_HIST[g] = []
            async with live_lock:
                for g in list(LIVE):
                    LIVE[g] = new_round(g, LIVE[g]["id"] + 1)
        e[kind] = e.get(kind, 0) + 1
        store.d.setdefault("admin_log", []).insert(0, {"reset": kind, "t": int(time.time())})
        store.save()
    return {"bal": "✅ All balances will be 0 on next connect.", "pts": "✅ Leaderboard points reset.", "all": "✅ Full reset done."}[kind]


def rtp_kb() -> InlineKeyboardMarkup:
    B = InlineKeyboardButton
    r = {**RTP_DEF, **cfg("rtp")}
    b = [B(text=f"{k.capitalize()}: {v:g}%", callback_data=f"ad:sv:rtp_{k}") for k, v in r.items()]
    return InlineKeyboardMarkup(inline_keyboard=[b[i:i + 2] for i in range(0, len(b), 2)] + back_kb().inline_keyboard)


def bar(v: float, mx: float, w: int = 14) -> str:
    n = 0 if mx <= 0 else round(abs(v) / mx * w)
    return "█" * n + "·" * (w - n)


def chart_text() -> str:
    days = [day_key(time.time() - i * 86400) for i in range(6, -1, -1)]
    D = store.d.get("daily", {})
    act = [len(D.get(k, {}).get("act", [])) for k in days]
    dep = [round(sum(x["amount"] for x in store.d.get("deposits", []) if x.get("src") in ("TON", "Stars") and day_key(x["t"]) == k), 2) for k in days]
    prof = [round(sum(g["b"] - g["w"] for g in D.get(k, {}).get("g", {}).values()), 2) for k in days]
    out = ["<b>📈 Last 7 days</b>", "", "<b>👥 Active players</b>", "<pre>"]
    out += [f"{k[5:]} {bar(v, max(act) or 1)} {v}" for k, v in zip(days, act)] + ["</pre>", "<b>💳 Real deposits (balance)</b>", "<pre>"]
    out += [f"{k[5:]} {bar(v, max(dep) or 1)} {v:g}" for k, v in zip(days, dep)] + ["</pre>", "<b>🏦 House profit (bets − wins)</b>", "<pre>"]
    mp = max([abs(x) for x in prof] or [1]) or 1
    out += [f"{k[5:]} {bar(v, mp)} {'+' if v >= 0 else ''}{v:g}" for k, v in zip(days, prof)] + ["</pre>"]
    games: dict = {}
    for k in days:
        for g, x in D.get(k, {}).get("g", {}).items():
            a = games.setdefault(g, {"b": 0.0, "w": 0.0, "n": 0}); a["b"] += x["b"]; a["w"] += x["w"]; a["n"] += x["n"]
    if games:
        out += ["<b>🎮 Per game (7 days)</b>", "<pre>game    plays      bet   profit RTP"]
        for g, a in sorted(games.items(), key=lambda kv: -(kv[1]["b"] - kv[1]["w"])):
            rtp = a["w"] / a["b"] * 100 if a["b"] else 0
            out.append(f"{g[:7]:<7}{a['n']:>5}x {a['b']:>8.0f} {a['b'] - a['w']:>+8.0f} {rtp:3.0f}%")
        out.append("</pre>")
    out.append("<i>Solo game data is reported by players' apps.</i>")
    return "\n".join(out)


@dp.callback_query(F.data.startswith("ad:"))
async def on_admin_cb(cq: CallbackQuery, bot: Bot) -> None:
    uid = cq.from_user.id
    if not is_adm(uid):
        await cq.answer("Not an admin", show_alert=True)
        return
    act = cq.data[3:]
    await cq.answer()
    edit = cq.message.edit_text if cq.message else None
    if act == "home":
        ADMIN_WAIT.pop(uid, None)
        await edit(admin_home_text(), reply_markup=admin_kb())
    elif act == "stats":
        await edit(admin_home_text(), reply_markup=admin_kb())
    elif act == "users":
        us = sorted(store.d["users"].items(), key=lambda kv: kv[1].get("seen", 0), reverse=True)[:30]
        lines = [f"<code>{k}</code> {v.get('name', '')} {('@' + v['username']) if v.get('username') else ''}" for k, v in us]
        await edit("<b>👥 Players (last active)</b>\n" + ("\n".join(lines) or "—"), reply_markup=back_kb())
    elif act in ("add", "sub"):
        ADMIN_WAIT[uid] = act
        await edit(f"{'➕ Add' if act == 'add' else '➖ Remove'} balance\n\nSend: <code>ID amount</code>\nExample: <code>123456789 100000</code> or <code>@user 50k</code>", reply_markup=back_kb())
    elif act == "bonus":
        ADMIN_WAIT[uid] = "bonus"
        await edit("🎁 Create bonus link\n\nSend: <code>amount uses</code>\nExample: <code>50000 100</code> — 100 players get 50 000 TON each.\nOptional custom code: <code>50000 100 welcome</code>", reply_markup=back_kb())
    elif act == "blist":
        bs = list(store.d.get("bonus", {}).items())[-15:]
        un = await bot_username(bot)
        rows = [[InlineKeyboardButton(text=f"🗑 {c} ({b['left']}/{b['uses']})", callback_data=f"ad:bdel:{c}")] for c, b in bs]
        txt = "\n".join(f"<code>https://t.me/{un}?start=bonus_{c}</code>\n  {b['amount']:g} TON · left {b['left']}/{b['uses']}" for c, b in bs) or "No bonus links yet."
        await edit("<b>🔗 Bonus links</b>\n\n" + txt, reply_markup=InlineKeyboardMarkup(inline_keyboard=rows + back_kb().inline_keyboard))
    elif act.startswith("bdel:"):
        async with store.lock:
            store.d.get("bonus", {}).pop(act[5:], None)
            store.save()
        await edit("🗑 Deleted.", reply_markup=back_kb())
    elif act == "deps":
        ds = store.d.get("deposits", [])[:15]
        lines = [f"{time.strftime('%d.%m %H:%M', time.localtime(x['t']))} · <code>{x['uid']}</code> · +{x['amount']:g} · {x['src']}" for x in ds]
        await edit("<b>💳 Last deposits</b>\n" + ("\n".join(lines) or "—"), reply_markup=back_kb())
    elif act == "find":
        ADMIN_WAIT[uid] = "find"
        await edit("🔎 Send player ID or @username", reply_markup=back_kb())
    elif act == "bc":
        ADMIN_WAIT[uid] = "bc"
        await edit("📢 Send the broadcast text (HTML allowed). It goes to all players.", reply_markup=back_kb())
    elif act == "set":
        await edit("⚙️ <b>Settings</b>\nTap a value to change it. Game buttons turn a game on/off for everyone.", reply_markup=set_kb())
    elif act == "maint":
        async with store.lock:
            store.d.setdefault("cfg", {})["maint"] = not cfg("maint"); store.save()
        await edit("⚙️ <b>Settings</b>\n" + ("🔴 Maintenance is ON — players see a maintenance screen (admins can still play)." if cfg("maint") else "🟢 Maintenance is OFF."), reply_markup=set_kb())
    elif act.startswith("gt:"):
        g = act[3:]
        async with store.lock:
            off = set(cfg("off")); off.symmetric_difference_update({g}); store.d.setdefault("cfg", {})["off"] = sorted(off); store.save()
        await edit(f"⚙️ <b>Settings</b>\n{g.capitalize()} is now {'❌ OFF' if g in cfg('off') else '✅ ON'}.", reply_markup=set_kb())
    elif act.startswith("sv:"):
        k = act[3:]
        ADMIN_WAIT[uid] = "sv:" + k
        hint = {"ton_rate": "balance per 1 TON, e.g. <code>100000</code>", "stars_rate": "balance per 1 Star, e.g. <code>800</code> (125 ⭐ = 100 000)",
                "bot_max": "max bot bet, e.g. <code>1000</code>", "rk": "rocket bots per round as <code>min max</code>, e.g. <code>3 4</code> (0–8)",
                "post_min": "minimum win to post in the channel, e.g. <code>1000</code>",
                "ab_hours": "auto bonus interval in hours, e.g. <code>1</code> or <code>0.5</code>", "ab_amount": "TON per player, e.g. <code>1000</code>",
                "ab_uses": "how many people, e.g. <code>500</code>", "ds_hour": "hour 0–23 (Tashkent), e.g. <code>21</code>"}.get(k, f"{k[4:].capitalize()} RTP in %, e.g. <code>95</code> (50–100)")
        await edit(f"✏️ Send new value: {hint}", reply_markup=back_kb())
    elif act == "pc":
        ADMIN_WAIT[uid] = "pc"
        await edit("🎟 <b>Free Box promo code</b>\nSend: <code>CODE uses</code> — e.g. <code>RIKI2026 100</code>\nOr just <code>100</code> for a random code.\n"
                   "Players type the code on the FREE box to open it once.", reply_markup=back_kb())
    elif act == "pclist":
        ps = list(store.d.get("promo", {}).items())[-15:]
        rows = [[InlineKeyboardButton(text=f"🗑 {c} ({p['left']}/{p['uses']})", callback_data=f"ad:pcdel:{c}")] for c, p in ps]
        txt = "\n".join(f"<code>{c}</code> — left <b>{p['left']}</b>/{p['uses']}" for c, p in ps) or "No codes yet."
        await edit("<b>📋 Free box codes</b>\n\n" + txt, reply_markup=InlineKeyboardMarkup(inline_keyboard=rows + back_kb().inline_keyboard))
    elif act.startswith("pcdel:"):
        async with store.lock:
            store.d.get("promo", {}).pop(act[6:], None); store.save()
        await edit("🗑 Deleted.", reply_markup=back_kb())
    elif act == "ch":
        await edit(ch_text(), reply_markup=ch_kb())
    elif act in ("abt", "dst"):
        k = "ab_on" if act == "abt" else "ds_on"
        async with store.lock:
            store.d.setdefault("cfg", {})[k] = not cfg(k)
            if k == "ab_on" and cfg(k):
                store.d["ab_last"] = 0   # yoqilganda darhol birinchi post
            store.save()
        await edit(ch_text(), reply_markup=ch_kb())
    elif act == "abnow":
        code = await auto_bonus(bot) if CHANNEL_ID else ""
        await edit((f"✅ Posted bonus link <code>{code}</code>" if code else "❌ Not posted — check CHANNEL_ID and that the bot is a channel admin.") + "\n\n" + ch_text(), reply_markup=ch_kb())
    elif act == "abprev":
        await auto_bonus(bot, chat=uid)
        await edit("👀 Preview sent to you (a real link with the current settings).\n\n" + ch_text(), reply_markup=ch_kb())
    elif act == "dsnow":
        txt, png = daily_summary()
        okk = await send_chat(bot, CHANNEL_ID or uid, txt, png, play_kb())
        await edit(("✅ Posted." if okk else "❌ Not posted.") + "\n\n" + ch_text(), reply_markup=ch_kb())
    elif act == "poll":
        ADMIN_WAIT[uid] = "poll"
        await edit("🗳 Send the poll as <code>Question | option 1 | option 2 | ...</code>\nor send <code>default</code> for:\n<i>"
                   + POLL_DEF[0] + "</i> — " + ", ".join(POLL_DEF[1]), reply_markup=back_kb())
    elif act == "img":
        ADMIN_WAIT[uid] = "img"
        await edit("🖼 <b>Image post</b>\nSend <code>Title | text</code> — I'll draw a branded picture card and post it with a Play button.\n"
                   "Or send your own <b>photo with a caption</b> — it will be posted as is.", reply_markup=back_kb())
    elif act == "emo":
        ADMIN_WAIT[uid] = "emo"
        await edit("😎 Send one message with premium emoji in this order:\n1️⃣ title emoji (🎁)  2️⃣ link emoji (👉)  3️⃣ trophy emoji (🏆)\n"
                   "Send <code>clear</code> to remove them.", reply_markup=back_kb())
    elif act == "gh":
        await edit(GROUP_HELP, reply_markup=back_kb())
    elif act == "chart":
        await edit(chart_text(), reply_markup=back_kb())
    elif act == "rtp":
        await edit("🎰 <b>RTP</b> — how much of the bets returns to players on average.\n"
                   "Mines/Dice/Upgrade/Cases: target %. Plinko/Spins: % of the base payout table (100 = default).\n"
                   "Lower = more profit for the house.", reply_markup=rtp_kb())
    elif act == "post":
        async with store.lock:
            store.d.setdefault("cfg", {})["post_on"] = not cfg("post_on"); store.save()
        await edit("⚙️ <b>Settings</b>\n" + ("📣 Auto-post ON" if cfg("post_on") else "📣 Auto-post OFF") +
                   ("" if CHANNEL_ID else "\n⚠️ Set CHANNEL_ID in .env and make the bot an admin of the channel."), reply_markup=set_kb())
    elif act == "rst":
        await edit("🧹 <b>Reset</b>\nChoose what to reset. You will be asked to confirm.", reply_markup=rst_kb())
    elif act.startswith("rq:"):
        k = act[3:]
        await edit(RST_TXT[k], reply_markup=InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="✅ Yes, reset", callback_data=f"ad:rok:{k}"), InlineKeyboardButton(text="✖️ Cancel", callback_data="ad:rst")]]))
    elif act.startswith("rok:"):
        await edit(await do_reset(act[4:]), reply_markup=admin_kb())
    elif act == "rq1":
        ADMIN_WAIT[uid] = "zero1"
        await edit("👤 Send player ID or @username — their balance becomes 0.", reply_markup=back_kb())
    elif act == "ban":
        ADMIN_WAIT[uid] = "ban"
        await edit("🚫 Send player ID or @username to ban / unban (toggle).", reply_markup=back_kb())
    elif act == "topbal":
        us = sorted(store.d["users"].items(), key=lambda kv: kv[1].get("bal", 0), reverse=True)[:25]
        lines = [f"<code>{k}</code> {v.get('name', '')} — <b>{v.get('bal', 0):g}</b> TON · 🎁 {v.get('inv', 0)} ({v.get('invv', 0):g}){' 🚫' if v.get('banned') else ''}" for k, v in us if v.get("bal", 0) or v.get("inv", 0)]
        await edit("<b>💰 Top balances</b> (as reported by players' apps)\n" + ("\n".join(lines) or "—"), reply_markup=back_kb())
    elif act == "ga":
        act_g = [g for g in store.d["giveaways"] if g.get("status") == "active"]
        await edit(f"🎉 Active giveaways: <b>{len(act_g)}</b>\n\nCreate: open the app → <b>Earn → Giveaways → ➕ Create giveaway</b> (choose gifts and duration).",
                   reply_markup=InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="🚀 Open app", web_app=WebAppInfo(url=webapp_url()))]] + back_kb().inline_keyboard))


@dp.message(F.chat.type == "private", F.text, lambda m: m.from_user and m.from_user.id in ADMIN_WAIT and not (m.text or "").startswith("/"))
async def on_admin_input(message: Message, bot: Bot) -> None:
    uid = message.from_user.id
    act = ADMIN_WAIT.pop(uid, "")
    parts = message.text.split()
    if act in ("add", "sub"):
        if len(parts) != 2:
            ADMIN_WAIT[uid] = act
            await message.answer("Format: <code>ID amount</code>", reply_markup=back_kb())
            return
        await message.answer(await admin_adjust(bot, uid, parts[0], parse_amount(parts[1]) or 0, 1 if act == "add" else -1), reply_markup=admin_kb())
    elif act == "bonus":
        amt = parse_amount(parts[0]) if parts else None
        uses = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
        if not amt or amt <= 0 or uses <= 0:
            ADMIN_WAIT[uid] = act
            await message.answer("Format: <code>amount uses</code> e.g. <code>50000 100</code>", reply_markup=back_kb())
            return
        await message.answer(await create_bonus(bot, uid, amt, uses, parts[2] if len(parts) > 2 else ""), reply_markup=admin_kb())
    elif act == "poll":
        if message.text.strip().lower() == "default":
            q, opts = POLL_DEF
        else:
            xs = [x.strip() for x in message.text.split("|") if x.strip()]
            q, opts = (xs[0], xs[1:11]) if xs else ("", [])
        if not q or len(opts) < 2:
            ADMIN_WAIT[uid] = act
            await message.answer("Format: <code>Question | option 1 | option 2</code>", reply_markup=back_kb())
            return
        try:
            await bot.send_poll(CHANNEL_ID or uid, q[:300], [o[:100] for o in opts], is_anonymous=True)
            await message.answer("✅ Poll posted.", reply_markup=ch_kb())
        except Exception as e:  # noqa: BLE001
            await message.answer(f"❌ {e}", reply_markup=ch_kb())
    elif act == "img":
        xs = [x.strip() for x in message.text.split("|")]
        png = card_png(xs[0], xs[1] if len(xs) > 1 else "")
        cap = f"<b>{xs[0]}</b>" + (f"\n\n{xs[1]}" if len(xs) > 1 and xs[1] else "")
        okk = await send_chat(bot, CHANNEL_ID or uid, cap, png, play_kb())
        await message.answer("✅ Posted." if okk else "❌ Not posted — check CHANNEL_ID.", reply_markup=ch_kb())
    elif act == "emo":
        if message.text.strip().lower() == "clear":
            ids = []
        else:
            ids = [e.custom_emoji_id for e in (message.entities or []) if getattr(e, "type", "") == "custom_emoji" and e.custom_emoji_id]
            if not ids:
                ADMIN_WAIT[uid] = act
                await message.answer("No premium emoji found in your message. Send premium emoji (Telegram Premium needed to send them).", reply_markup=back_kb())
                return
        keys = ["gift", "link", "cup"]
        async with store.lock:
            store.d.setdefault("cfg", {})["emoji"] = {k: ids[min(i, len(ids) - 1)] for i, k in enumerate(keys)} if ids else {}
            store.save()
        await message.answer(f"✅ Premium emoji saved: {len(ids)}" if ids else "✅ Cleared.", reply_markup=ch_kb())
    elif act == "pc":
        code = (parts[0] if len(parts) > 1 else uuid.uuid4().hex[:8]).upper()[:32]
        n = parse_amount(parts[-1]) if parts else None
        if not n or n < 1 or not code.replace("_", "").replace("-", "").isalnum():
            ADMIN_WAIT[uid] = act
            await message.answer("Format: <code>CODE uses</code> or <code>uses</code>", reply_markup=back_kb())
            return
        async with store.lock:
            store.d.setdefault("promo", {})[code] = {"uses": int(n), "left": int(n), "claimed": [], "kind": "freebox", "t": int(time.time())}
            store.save()
        await message.answer(f"✅ Code <code>{code}</code> created · {int(n)} uses\nPlayers enter it on the FREE box.", reply_markup=admin_kb())
    elif act.startswith("sv:"):
        k = act[3:]
        try:
            if k == "rk":
                a, b2 = (int(x) for x in (parts + parts)[:2])
                if not (0 <= a <= b2 <= len(RK_BOTS)):
                    raise ValueError
                upd = {"rk_min": a, "rk_max": b2}
            elif k == "ds_hour":
                v = int(parts[0])
                if not 0 <= v <= 23:
                    raise ValueError
                upd = {k: float(v)}
            elif k.startswith("rtp_"):
                v = parse_amount(parts[0]) if parts else None
                if not v or not 50 <= v <= 100:
                    raise ValueError
                upd = {"rtp": {**RTP_DEF, **cfg("rtp"), k[4:]: v}}
            else:
                v = parse_amount(parts[0]) if parts else None
                if not v or v <= 0:
                    raise ValueError
                upd = {k: v}
        except (ValueError, IndexError):
            ADMIN_WAIT[uid] = act
            await message.answer("❌ Bad value, try again.", reply_markup=back_kb())
            return
        async with store.lock:
            store.d.setdefault("cfg", {}).update(upd); store.save()
        await message.answer("✅ Saved.", reply_markup=rtp_kb() if k.startswith("rtp_") else ch_kb() if k[:3] in ("ab_", "ds_") else set_kb())
    elif act in ("zero1", "ban"):
        f = find_user_any(message.text.strip())
        if not f:
            await message.answer("Not found.", reply_markup=admin_kb())
            return
        k, v = f
        async with store.lock:
            if act == "zero1":
                v["ep_bal"] = v.get("ep_bal", 0) + 1; v["bal"] = 0
                txt = f"✅ Balance of <b>{v.get('name', k)}</b> (<code>{k}</code>) will be 0 on next connect."
            else:
                v["banned"] = not v.get("banned")
                txt = f"{'🚫 Banned' if v['banned'] else '✅ Unbanned'}: <b>{v.get('name', k)}</b> (<code>{k}</code>)"
            store.save()
        await message.answer(txt, reply_markup=admin_kb())
    elif act == "find":
        f = find_user(message.text)
        if not f:
            await message.answer("Not found.", reply_markup=admin_kb())
            return
        k, v = f
        deps = [x for x in store.d.get("deposits", []) if str(x["uid"]) == k and x.get("src") in ("TON", "Stars")]
        await message.answer(
            f"👤 <b>{v.get('name', '')}</b> {('@' + v['username']) if v.get('username') else ''}\nID: <code>{k}</code>\n"
            f"Deposits: <b>{len(deps)}</b> · {round(sum(x['amount'] for x in deps), 2)} TON\n"
            f"Balance (app): <b>{v.get('bal', 0):g}</b> TON · 🎁 {v.get('inv', 0)} gifts ({v.get('invv', 0):g})\n"
            f"Admin adjustments: {v.get('adm', 0)}\nPvP score: {v.get('pvp', 0)} · points: {v.get('points', 0)}"
            f"{chr(10) + '🚫 BANNED' if v.get('banned') else ''}",
            reply_markup=admin_kb())
    elif act == "bc":
        n = 0
        for k in list(store.d["users"].keys()):
            if not k.isdigit():
                continue
            try:
                await bot.send_message(int(k), message.html_text, reply_markup=main_kb())
                n += 1
                await asyncio.sleep(0.05)
            except Exception:  # noqa: BLE001
                pass
        await message.answer(f"📢 Sent to <b>{n}</b> players.", reply_markup=admin_kb())


@dp.message(F.chat.type == "private", F.photo, lambda m: m.from_user and ADMIN_WAIT.get(m.from_user.id) == "img")
async def on_admin_photo(message: Message, bot: Bot) -> None:
    ADMIN_WAIT.pop(message.from_user.id, None)
    try:
        await bot.send_photo(CHANNEL_ID or message.from_user.id, message.photo[-1].file_id, caption=message.html_text or None, reply_markup=play_kb())
        await message.answer("✅ Posted.", reply_markup=ch_kb())
    except Exception as e:  # noqa: BLE001
        await message.answer(f"❌ {e}", reply_markup=ch_kb())


@dp.message(Command("users"))
async def cmd_users(message: Message) -> None:
    """Admin: oxirgi o'yinchilar ro'yxati (ID va username)."""
    if not message.from_user or message.from_user.id not in ADMIN_IDS:
        return
    us = sorted(store.d["users"].items(), key=lambda kv: kv[1].get("seen", 0), reverse=True)[:30]
    lines = [f"<code>{k}</code> {v.get('name', '')} {('@' + v['username']) if v.get('username') else ''}" for k, v in us]
    await message.answer("<b>Players</b>\n" + ("\n".join(lines) or "—"))


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
    await credit_deposit(str(message.from_user.id), sp.total_amount * cfg("stars_rate"), "Stars", sp.telegram_payment_charge_id)


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


@dp.message(F.chat.type == "private")
async def fallback(message: Message) -> None:
    await message.answer("Tap the button to open the app 👇", reply_markup=main_kb())


async def on_startup(bot: Bot) -> None:
    await bot.set_my_commands([
        BotCommand(command="start", description="Start"),
        BotCommand(command="app", description="Open the app"),
        BotCommand(command="ref", description="Referral link"),
        BotCommand(command="help", description="Help"),
    ])
    for a in ADMIN_IDS:
        try:
            from aiogram.types import BotCommandScopeChat
            await bot.set_my_commands([
                BotCommand(command="admin", description="Admin panel"),
                BotCommand(command="add", description="Add balance (reply or ID amount)"),
                BotCommand(command="take", description="Remove balance (reply or ID amount)"),
                BotCommand(command="ban", description="Ban player (reply or ID)"),
                BotCommand(command="unban", description="Unban player"),
                BotCommand(command="info", description="Player card"),
                BotCommand(command="promo", description="Free box code: CODE uses"),
                BotCommand(command="bonus", description="Bonus link: amount uses"),
                BotCommand(command="users", description="Players"),
                BotCommand(command="start", description="Start"),
            ], scope=BotCommandScopeChat(chat_id=a))
        except Exception as e:  # noqa: BLE001
            log.info("admin buyruqlari: %s", e)
    await bot.set_chat_menu_button(menu_button=MenuButtonWebApp(text=BRAND, web_app=WebAppInfo(url=webapp_url())))
    me = await bot.get_me()
    bot_ref["uname"] = me.username
    log.info("Bot: @%s | Mini App: %s | API: http://%s:%s | adminlar: %s", me.username, WEBAPP_URL, API_HOST, API_PORT, ADMIN_IDS or "yo'q")


async def main() -> None:
    runner = web.AppRunner(make_app())
    await runner.setup()
    await web.TCPSite(runner, API_HOST, API_PORT).start()
    log.info("API server: http://%s:%s", API_HOST, API_PORT)
    asyncio.create_task(giveaway_loop())
    asyncio.create_task(ton_deposit_loop())
    asyncio.create_task(live_loop())
    if not BOT_TOKEN:  # DEV_NOAUTH lokal sinov: faqat API
        log.warning("BOT_TOKEN yo'q — faqat API ishlayapti (DEV_NOAUTH)")
        asyncio.create_task(tunnel_loop(None))
        await asyncio.Event().wait()
        return
    bot = Bot(BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    bot_ref["bot"] = bot
    asyncio.create_task(tunnel_loop(bot))
    asyncio.create_task(post_loop(bot))
    asyncio.create_task(content_loop(bot))
    dp.startup.register(on_startup)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
