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
    (tashqaridan kirish uchun: cloudflared tunnel --url http://127.0.0.1:8080)
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
import html as _html
import binascii

import aiohttp
from aiohttp import web
from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import (
    FSInputFile,
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
BOT_VERSION = "2026.11.06-b"   # loglarda ko'rinadi — serverda qaysi versiya ishlayotganini tekshirish uchun
BRAND = os.getenv("BRAND", "RIKI")
CHANNEL_URL = os.getenv("CHANNEL_URL", "")
CHANNEL_ID = os.getenv("CHANNEL_ID", "").strip()   # avto-post kanali: @kanal yoki -100..., bot kanalga admin bo'lishi kerak
ADMIN_IDS = {int(x) for x in os.getenv("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip().isdigit()}
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8080"))
DATA_FILE = os.getenv("DATA_FILE", "riki_data.json")
DB_FILE = os.getenv("DB_FILE", os.path.join(os.path.dirname(os.path.abspath(DATA_FILE)) or ".", "riki.db"))   # balanslar bazasi
BACKUP_DIR = os.getenv("BACKUP_DIR", os.path.join(os.path.dirname(os.path.abspath(DATA_FILE)) or ".", "backups"))
DEV_NOAUTH = os.getenv("DEV_NOAUTH", "0") == "1"  # faqat lokal sinov uchun!
# ---- depozit
DEPOSIT_ADDRESS = os.getenv("DEPOSIT_ADDRESS", "").strip()      # TON hamyon manzili (depozit qabul qiladi)
TONCENTER_KEY = os.getenv("TONCENTER_KEY", "").strip()          # https://t.me/tonapibot dan bepul kalit
TONCENTER_URL = os.getenv("TONCENTER_URL", "https://toncenter.com/api/v2")
TON_RATE = float(os.getenv("TON_RATE", "100000"))              # 1 haqiqiy TON = shuncha balans
STARS_RATE = float(os.getenv("STARS_RATE", "800"))             # 1 Star = shuncha balans (125 ⭐ = 100 000)
MIN_TON_DEPOSIT = float(os.getenv("MIN_TON_DEPOSIT", "0.1"))
PUBLIC_API_URL = os.getenv("PUBLIC_API_URL", "").strip().rstrip("/")   # doimiy domen bo'lsa shu yerga
API_URL_FILE = os.getenv("API_URL_FILE", "").strip()   # maker.py: umumiy tunnel manzili shu faylda (o'zgarsa bot o'zi yangilaydi)
API_PREFIX = os.getenv("API_PREFIX", "").strip().rstrip("/")   # maker.py: /t/<id> — umumiy tunnel ichidagi yo'l
GIFT_BOT = os.getenv("GIFT_BOT", "").strip().lstrip("@")       # NFT sovg'a depozit akkaunti (bo'sh = ilovadagi standart)
TG_API_BASE = os.getenv("TG_API_BASE", "").strip()             # lokal Bot API server (ixtiyoriy)
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
RTP_DEF = {"mines": 97.5, "dice": 98, "upgrade": 95, "cases": 92, "plinko": 100, "spins": 100}
RK_PEPE_MIN0 = float(os.getenv("RK_PEPE_MIN", "10000"))   # Rocket: shu tikishdan Pepe beriladi
DEF_CFG = {"rk_pepe_min": RK_PEPE_MIN0, "ch_id": "", "ch_url": "", "dep_addr": "", "tix_per_ton": 5000.0, "ref_tix": 5.0, "ref_tix_day": 50.0, "ref_pct": 10.0, "ton_rate": TON_RATE, "stars_rate": STARS_RATE, "bot_max": 1000.0, "bot_min": 0.1, "rk_min": 3, "rk_max": 4,
           "off": [], "maint": False, "rtp": RTP_DEF, "post_on": bool(CHANNEL_ID), "post_min": 1000.0,
           "ab_on": False, "ab_hours": 1.0, "ab_amount": 1000.0, "ab_uses": 500.0,      # avto bonus link
           "ds_on": False, "ds_hour": 21.0,                                                  # kunlik natijalar posti (Toshkent vaqti)
           "emoji": {},
           "live_bots": 1.0,                                                                   # PvP/Roulette/TvT raundidagi botlar soni
           "bots_always": 1.0,                                                                 # 1 = botlar odam bo'lmasa ham doim o'ynaydi
           "top_on": False, "top_freq": "week", "top_dow": 6.0, "top_hour": 20.0,             # Top-10 rasmli post (kun/hafta)
           "poll_on": False, "poll_dow": 2.0, "poll_hour": 19.0,                              # haftalik "nima qo'shaylik?" so'rovnomasi                                                                      # premium emoji id'lari
           "subs": [], "subs_on": True}                                                      # majburiy obuna kanallari
GAMES = ["rocket", "pvp", "tvt", "roulette", "mines", "dice", "plinko", "upgrade", "crafts", "spins", "cases"]


def cfg(k: str):
    return store.d.setdefault("cfg", {}).get(k, DEF_CFG[k])


def ch_id() -> str:
    """Post kanali: admin paneldan ulangan (ustun) yoki .env CHANNEL_ID. 'off' — uzilgan."""
    v = str(cfg("ch_id") or "")
    return "" if v == "off" else (v or CHANNEL_ID)


def ch_url() -> str:
    v = str(cfg("ch_url") or "")
    if str(cfg("ch_id") or "") == "off":
        return ""
    return v or CHANNEL_URL or (f"https://t.me/{CHANNEL_ID.lstrip('@')}" if CHANNEL_ID.startswith("@") else "")


def dep_addr() -> str:
    """TON depozit manzili: admin paneldan (ustun) yoki .env DEPOSIT_ADDRESS."""
    v = str(cfg("dep_addr") or "")
    return "" if v == "off" else (v or DEPOSIT_ADDRESS)


def epochs(uid: str) -> dict:
    e = store.d.setdefault("epoch", {"bal": 0, "pts": 0, "all": 0})
    u = store.d["users"].get(uid, {})
    return {"bal": f'{e.get("bal", 0)}.{u.get("ep_bal", 0)}', "pts": str(e.get("pts", 0)), "all": str(e.get("all", 0))}


def client_state(uid: str) -> dict:
    """Ilova har ping/stats'da oladi: reset epoxalari, o'chirilgan o'yinlar, texnik ishlar."""
    return {"ep": epochs(uid), "off": list(cfg("off")), "maint": bool(cfg("maint")),
            "tonRate": cfg("ton_rate"), "starsRate": cfg("stars_rate"), "rtp": {**RTP_DEF, **cfg("rtp")}, "ch": ch_url()}


# ---------------------------------------------------------------- majburiy obuna
SUB_CACHE: dict[str, tuple[float, list]] = {}   # uid -> (vaqt, obuna bo'lmagan kanallar)


async def sub_missing(uid: int | str, fresh: bool = False) -> list:
    """Foydalanuvchi obuna bo'lmagan majburiy kanallar ro'yxati ([] = hammasiga obuna)."""
    chans = cfg("subs") if cfg("subs_on") else []
    bot = bot_ref.get("bot")
    if not chans or not bot or int(uid) in ADMIN_IDS:
        return []
    key = str(uid)
    c = SUB_CACHE.get(key)
    if c and not fresh and time.time() - c[0] < (300 if not c[1] else 20):
        return c[1]
    miss = []
    for ch in chans:
        try:
            m = await bot.get_chat_member(ch["id"], int(uid))
            if m.status in ("left", "kicked") or (m.status == "restricted" and not getattr(m, "is_member", True)):
                miss.append(ch)
        except Exception as e:   # bot kanalda admin emas yoki kanal o'chgan — o'yinchini to'smaymiz
            log.warning("obuna tekshiruvi %s: %s", ch.get("id"), e)
    SUB_CACHE[key] = (time.time(), miss)
    return miss


def subs_public(miss: list) -> list:
    return [{"title": c.get("title", "Channel"), "url": c.get("url", "")} for c in miss]


def sub_kb(miss: list, param: str = "") -> InlineKeyboardMarkup:
    B = InlineKeyboardButton
    rows = [[B(text=f"➕ {c.get('title', 'Channel')}", url=c["url"])] for c in miss if c.get("url")]
    rows.append([B(text="✅ I've subscribed", callback_data=("subchk:" + param)[:64])])
    return InlineKeyboardMarkup(inline_keyboard=rows)


SUB_TEXT = "📢 <b>To use {brand}, subscribe to our channel(s):</b>\n\nAfter subscribing, tap <b>✅ I've subscribed</b>."


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
from admin_i18n import LANG, t, ty, loc   # noqa: E402
from wallet import Wallet, WalletError, to_t   # noqa: E402

W = Wallet(DB_FILE)   # balans va sovg'alar — faqat serverda
from games import Games, Catalog   # noqa: E402

CATALOG = Catalog(os.path.join(os.path.dirname(os.path.abspath(__file__)), "catalog.json"))
G = Games(W, CATALOG, rtp_fn=lambda: cfg("rtp"), off_fn=lambda: cfg("off"))
from tasks import Tasks   # noqa: E402
TK = Tasks(W, cfg)   # Earn vazifalari va ticketlar — faqat serverda   # o'yin natijalari — faqat serverda


def wallet_user(user: dict, uid: str) -> None:
    """Foydalanuvchi bazada bo'lishini ta'minlaydi; eski versiyadan balansni bir marta ko'chiradi."""
    u = store.d["users"].get(uid, {})
    legacy = float(u.get("bal", 0) or 0) if not u.get("w_mig") else None
    W.ensure_user(int(uid), clean_name(user, u.get("name", "")), (user.get("username") or u.get("username") or "").lower(),
                  u.get("photo", ""), legacy_bal=legacy)
    if not u.get("w_mig") and uid in store.d["users"]:
        x = store.d["users"][uid]
        x["w_mig"] = 1
        x["inv_rep"], x["invv_rep"] = int(x.get("inv", 0) or 0), float(x.get("invv", 0) or 0)   # eski sovg'alar limiti


def wallet_out(uid: int | str, full: bool = True) -> dict:
    st = W.state(int(uid))
    out = {"bal": st["bal"], "turnover": st["turnover"], "pb": st.get("pb", 0), "dailyTs": st.get("dailyTs", 0),
           "rank": W.rank(int(uid)), "tix": TK.tix(int(uid))}
    if full:
        out["inv"] = st["inv"]
    return out


FREEBOX_CAP = float(os.getenv("FREEBOX_CAP", "50"))   # promo-kodli bepul qutidan maks. yutuq (TON)
REWARD_TYPE = {"Deposit": "deposit", "Bonus": "bonus", "Admin": "admin"}


def push_reward(uid: str, item: dict, admin: int | None = None, delay_at: int | None = None) -> dict:
    """Server pulni/sovg'ani DARHOL bazaga yozadi; inbox faqat ilovada xabar ko'rsatish uchun."""
    it = {"id": item.get("id") or uuid.uuid4().hex[:10], **item}
    if delay_at:
        it["at"] = delay_at
    k = it.get("kind")
    try:
        if k in ("gram", "win") and float(it.get("p", 0) or 0) != 0:
            typ = "win" if k == "win" else ("admin" if it.get("src") == "admin" else
                                            REWARD_TYPE.get(it.get("from", ""), "transfer_in" if it.get("n") == "TON" else "bonus"))
            W.credit(int(uid), float(it["p"]), typ, f"{it.get('reason') or it.get('from', '')}"[:120], str(it.get("game", ""))[:16] if k == "win" else "",
                     src=it.get("src", "server"), admin=admin, idem="rw:" + it["id"])
            it["paid"] = 1
        elif k == "gift":
            W.give_items(int(uid), [{"sh": it.get("sh", ""), "nm": it.get("n", ""), "v": it.get("p", 0), "m": it.get("m"), "ms": it.get("ms"),
                                     "id": it.get("iid")}], "giveaway" if it.get("ga") else ("win" if it.get("win") else "gift_in"),
                         f"{it.get('from', '')}"[:60], idem="rw:" + it["id"])
            it["paid"] = 1
    except WalletError as e:
        log.warning("reward %s %s: %s", uid, k, e)
    store.d["rewards"].setdefault(str(uid), []).append(it)
    return it
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
    return (f"{E('gift', '🎁')} <b>Link {uses} kishi uchun · Ссылка на {uses} человек</b>\n\n"
            f"{E('link', '👉')}<a href=\"{link}\">Bosing · Нажмите</a>{E('link', '👈')}")


async def auto_bonus(bot, force: bool = False, chat=None) -> str:
    uses, amount = int(cfg("ab_uses")), float(cfg("ab_amount"))
    code = "auto" + uuid.uuid4().hex[:6]
    async with store.lock:
        store.d.setdefault("bonus", {})[code] = {"amount": amount, "uses": uses, "left": uses, "by": 0, "t": int(time.time()), "claimed": [], "auto": True}
        store.d["ab_last"] = int(time.time())
        store.save()
    ok_ = await send_chat(bot, chat or ch_id(), bonus_post_text(code, uses, amount))
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
    text = (f"{E('cup', '🏆')} <b>Bugungi eng katta yutuqlar · Крупнейшие выигрыши дня</b>\n\n" +
            ("\n".join(lines) or "Hali katta yutuq yo'q — birinchi bo'ling! · Пока нет крупных выигрышей — будьте первым!") +
            f"\n\n👥 Bugun o'ynadi · Играли сегодня: <b>{act}</b>")
    return text, card_png("Kun yutuqlari · Итоги дня", f"{act} o'yinchi · {act} игроков", lines)


POLL_DEF = ("Botga nima qo'shaylik? · Что добавить в бот?", ["🪙 Coinflip 1v1", "🎡 Wheel of Fortune", "📈 Limbo", "💬 Chat · Чат", "🎰 Jackpot"])
POLL_IDEAS = [  # har hafta navbatdagi 4–5 tasi (ikki tilda)
    "🪙 Coinflip 1v1", "🎡 Wheel of Fortune", "📈 Limbo", "💬 Chat · Чат", "🎰 Jackpot", "🃏 Blackjack", "🎯 Darts",
    "🏁 Turnir · Турнир", "🎁 Ko'proq qutilar · Больше боксов", "👥 Klanlar · Кланы", "🎟 Lotereya · Лотерея",
    "📅 Kunlik vazifalar · Ежедневные задания", "🚀 Rocket x2 turbo", "💎 VIP sovg'alar · VIP подарки"]
TOP_COLORS = ["#fbbf24", "#cbd5e1", "#d97706"]


def top_rows(n: int = 10) -> list:
    users = store.d["users"]
    return [{"rank": i + 1, "name": r["name"] or users.get(str(r["id"]), {}).get("name", "Player"), "bal": r["bal"],
             "prize": LB_PRIZES[i] if i < len(LB_PRIZES) else ""} for i, r in enumerate(W.leaderboard(n))]


def top_card_png(rows: list, period: str) -> bytes | None:
    """Top-10 jadvali rasm (1280×960): o'rin, ism, balans, mukofot. RIKI uslubi, ikki tilda sarlavha."""
    try:
        from PIL import Image, ImageDraw, ImageFont, ImageFilter
    except ImportError:
        return None
    import io
    W_, H_ = 1280, 960
    im = Image.new("RGB", (W_, H_), "#1c1c1c")
    glow = Image.new("RGBA", (W_, H_), (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
    g.ellipse((760, -260, 1500, 420), fill=(135, 116, 225, 120)); g.ellipse((-260, 620, 420, 1200), fill=(62, 166, 255, 70))
    im = Image.alpha_composite(im.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(110))).convert("RGB")
    d = ImageDraw.Draw(im)

    def font(sz, bold=True):
        for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                  "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"):
            try:
                return ImageFont.truetype(f, sz)
            except OSError:
                pass
        return ImageFont.load_default(size=sz)
    d.rounded_rectangle((60, 56, 60 + 30 + d.textlength(BRAND, font=font(30)), 104), radius=14, fill="#8774e1")
    d.text((75, 62), BRAND, font=font(30), fill="#ffffff")
    d.text((60, 130), "TOP-10", font=font(84), fill="#ffffff")
    d.text((60 + d.textlength("TOP-10 ", font=font(84)), 158), period, font=font(38, False), fill="#bfb6ff")
    y = 260
    for r in rows[:10]:
        top = r["rank"] <= 3
        d.rounded_rectangle((60, y, W_ - 60, y + 58), radius=16, fill="#2a2a2a" if not top else "#302c44")
        c = TOP_COLORS[r["rank"] - 1] if top else "#8a8a8a"
        d.ellipse((76, y + 9, 116, y + 49), fill=c if top else "#3a3a3a")
        d.text((96, y + 29), str(r["rank"]), font=font(24), fill="#1c1c1c" if top else "#ffffff", anchor="mm")
        nm = r["name"][:20]
        d.text((136, y + 29), nm, font=font(30), fill="#ffffff", anchor="lm")
        if r.get("prize"):
            d.text((690, y + 29), "🎁 " + r["prize"] if False else r["prize"], font=font(24, False), fill="#c9c2ff", anchor="lm")
        bal = f"{r['bal']:,.2f}".replace(",", " ").rstrip("0").rstrip(".")
        d.text((W_ - 84, y + 29), bal + " TON", font=font(30), fill="#5ec8ff", anchor="rm")
        y += 66
    if not rows:
        d.text((60, 300), "Hali hech kim yo'q · Пока никого нет", font=font(40), fill="#ffffff")
    d.text((60, H_ - 50), "Play → @" + (bot_ref.get("uname") or "bot"), font=font(26, False), fill="#9a9a9a")
    buf = io.BytesIO(); im.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def top_post() -> tuple[str, bytes | None]:
    rows = top_rows(10)
    per = "kun · дня" if cfg("top_freq") == "day" else "hafta · недели"
    lines = [f"{['🥇', '🥈', '🥉'][r['rank'] - 1] if r['rank'] <= 3 else str(r['rank']) + '.'} <b>{r['name']}</b> — {r['bal']:g} TON"
             + (f" · 🎁 {r['prize']}" if r["prize"] else "") for r in rows]
    txt = (f"{E('cup', '🏆')} <b>TOP-10 {per}</b>\n\n" + ("\n".join(lines) or "—") +
           "\n\n🇺🇿 Haftaning oxirida Top-10 dagilar yonidagi sovg'ani oladi. O'ynang va ro'yxatga kiring!"
           "\n🇷🇺 В конце недели игроки Топ-10 получают подарок рядом со своим местом. Играйте и попадайте в список!")
    return txt, top_card_png(rows, per)


async def post_poll(bot, chat=None) -> bool:
    i = int(store.d.get("poll_i", 0))
    opts = [POLL_IDEAS[(i * 4 + k) % len(POLL_IDEAS)] for k in range(5)]
    store.d["poll_i"] = i + 1; store.save()
    try:
        await bot.send_poll(chat or ch_id(), POLL_DEF[0], opts, is_anonymous=True)
        return True
    except Exception as e:  # noqa: BLE001
        log.warning("poll: %s", e)
        return False


DOW = ["Du/Пн", "Se/Вт", "Ch/Ср", "Pa/Чт", "Ju/Пт", "Sh/Сб", "Ya/Вс"]


def top_status() -> str:
    tf = "har kuni" if cfg("top_freq") == "day" else f"har hafta ({DOW[int(cfg('top_dow')) % 7]})"
    return (f"\n🏆 Top-10 post: {'<b>ON</b>' if cfg('top_on') else 'off'} · {tf} {int(cfg('top_hour')):02d}:00"
            f"\n🗳 So'rovnoma / Опрос: {'<b>ON</b>' if cfg('poll_on') else 'off'} · {DOW[int(cfg('poll_dow')) % 7]} {int(cfg('poll_hour')):02d}:00")


async def content_loop(bot) -> None:
    while True:
        await asyncio.sleep(30)
        try:
            if not ch_id():
                continue
            now = time.time()
            if cfg("ab_on") and now - store.d.get("ab_last", 0) >= float(cfg("ab_hours")) * 3600:
                await auto_bonus(bot)
            loc = time.gmtime(now + TZ_OFF)
            today = time.strftime("%Y-%m-%d", loc)
            if cfg("top_on") and loc.tm_hour == int(cfg("top_hour")) and store.d.get("top_last") != today and \
                    (cfg("top_freq") == "day" or loc.tm_wday == int(cfg("top_dow")) % 7):
                store.d["top_last"] = today; store.save()
                txt, png = top_post()
                await send_chat(bot, ch_id(), txt, png, play_kb())
            if cfg("poll_on") and loc.tm_wday == int(cfg("poll_dow")) % 7 and loc.tm_hour == int(cfg("poll_hour")) and store.d.get("poll_last") != today:
                store.d["poll_last"] = today; store.save()
                await post_poll(bot)
            if cfg("ds_on") and loc.tm_hour == int(cfg("ds_hour")) and store.d.get("ds_last") != time.strftime("%Y-%m-%d", loc):
                store.d["ds_last"] = time.strftime("%Y-%m-%d", loc); store.save()
                txt, png = daily_summary()
                await send_chat(bot, ch_id(), txt, png, play_kb())
        except Exception as e:  # noqa: BLE001
            log.warning("content_loop: %s", e)


def ch_kb() -> InlineKeyboardMarkup:
    B = InlineKeyboardButton
    em = cfg("emoji")
    top = ([[B(text="✅ Check admin", callback_data="ad:chchk"), B(text="🔄 Change channel", callback_data="ad:chset")],
            [B(text="🗑 Disconnect channel", callback_data="ad:chdel")]] if ch_id() else
           [[B(text="➕ Connect channel", callback_data="ad:chset")]])
    return InlineKeyboardMarkup(inline_keyboard=top + [
        [B(text=("🟢 Auto bonus ON" if cfg("ab_on") else "⚪ Auto bonus OFF"), callback_data="ad:abt")],
        [B(text=f"⏱ Every {cfg('ab_hours'):g} h", callback_data="ad:sv:ab_hours"), B(text=f"💰 {cfg('ab_amount'):g} TON", callback_data="ad:sv:ab_amount"),
         B(text=f"👥 {cfg('ab_uses'):g}", callback_data="ad:sv:ab_uses")],
        [B(text="🎁 Post bonus link now", callback_data="ad:abnow"), B(text="👀 Preview to me", callback_data="ad:abprev")],
        [B(text=("🟢 Daily results ON" if cfg("ds_on") else "⚪ Daily results OFF"), callback_data="ad:dst"), B(text=f"🕘 at {int(cfg('ds_hour')):02d}:00", callback_data="ad:sv:ds_hour")],
        [B(text="🏆 Post daily results now", callback_data="ad:dsnow")],
        [B(text=("🟢 Top-10 ON" if cfg("top_on") else "⚪ Top-10 OFF"), callback_data="ad:tpt"),
         B(text=("📅 " + ("har kuni · ежедневно" if cfg("top_freq") == "day" else "hafta · неделя")), callback_data="ad:tpf")],
        [B(text=f"🗓 {DOW[int(cfg('top_dow')) % 7]}", callback_data="ad:sv:top_dow"), B(text=f"🕘 {int(cfg('top_hour')):02d}:00", callback_data="ad:sv:top_hour"),
         B(text="🏆 Hozir · Сейчас", callback_data="ad:tpnow")],
        [B(text=("🟢 So'rovnoma/Опрос ON" if cfg("poll_on") else "⚪ So'rovnoma/Опрос OFF"), callback_data="ad:plt"),
         B(text=f"🗓 {DOW[int(cfg('poll_dow')) % 7]} {int(cfg('poll_hour')):02d}:00", callback_data="ad:sv:poll_dow")],
        [B(text="🗳 Poll: what to add?", callback_data="ad:poll"), B(text="🖼 Image post", callback_data="ad:img")],
        [B(text=f"😎 Premium emoji ({len(em)} set)", callback_data="ad:emo")],
    ] + back_kb().inline_keyboard)


def ch_status_line() -> str:
    if not ch_id():
        return "📣 <b>Channel</b>\n⚠️ No channel connected. Press ➕ Connect channel."
    i = store.d.get("ch_info") or {}
    if str(i.get("id")) != str(ch_id()):
        i = {}
    st = ("✅ bot is admin, can post" if i.get("ok") else "❌ bot can't post — press ✅ Check admin") if i else "❔ not checked — press ✅ Check admin"
    nm = f"<b>{_html.escape(i.get('title') or '')}</b> " if i.get("title") else ""
    return f"📣 <b>Channel</b>: {nm}<code>{ch_id()}</code>\n{st}"


def ch_text() -> str:
    return (ch_status_line() +
            f"\n\n🎁 Auto bonus link: {'<b>ON</b>' if cfg('ab_on') else 'off'} · every {cfg('ab_hours'):g} h · {cfg('ab_amount'):g} TON × {cfg('ab_uses'):g} people"
            f"\n🏆 Daily results: {'<b>ON</b>' if cfg('ds_on') else 'off'} at {int(cfg('ds_hour')):02d}:00 (Tashkent)"
            + top_status() +
            "\n\n<i>Premium emoji work only if the bot has a Fragment username; otherwise normal emoji are used automatically.</i>")


# ---------------------------------------------------------------- kanalga avto-post
POSTQ: list[str] = []


def post(text: str) -> None:
    if ch_id() and cfg("post_on"):
        POSTQ.append(text)
        del POSTQ[:-50]


def post_win(name: str, game: str, v: float, gift: str = "") -> None:
    return   # har bir yutuq haqidagi kanal posti o'chirildi — o'rniga rasmli Top/so'rovnoma postlari (content_loop)
    if v >= float(cfg("post_min")):
        post(f"🏆 <b>{name}</b> won {'<b>' + gift + '</b> · ' if gift else ''}<b>{v:g} TON</b> in {game}!\nPlay 👉 @{bot_ref.get('uname', '')}")


async def post_loop(bot) -> None:
    while True:
        await asyncio.sleep(4)
        if POSTQ and ch_id():
            t = POSTQ.pop(0)
            await send_chat(bot, ch_id(), t)


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
        wallet_user(user, uid)
        store.save()
    miss = await sub_missing(uid, fresh=request.query.get("sub") == "1")
    return ok({"ok": True, "admin": is_admin(user), "id": user.get("id"), "subs": subs_public(miss), "wallet": wallet_out(uid),
               "legacyInv": not (W.user(int(uid)) or {}).get("legacy"),
               "ref": {"pct": float(cfg("ref_pct")), "tix": float(cfg("ref_tix")), "day": float(cfg("ref_tix_day")),
                       "earn": store.d["users"].get(uid, {}).get("ref_earn", 0)}, **client_state(uid)})


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
        if not u.get("w_mig") and str(body.get("be", "")) == ep["bal"] and str(body.get("ae", "")) == ep["all"]:
            try:   # faqat bazaga ko'chirilmagan eski foydalanuvchi uchun (bir martalik migratsiya manbai)
                # bir necha qurilmadan kelsa — kattasi saqlanadi (eski versiyada balans har telefonda alohida edi)
                u["bal"] = max(round(max(0.0, float(body.get("bal", 0) or 0)), 2), float(u.get("bal", 0) or 0))
                u["inv"] = max(int(body.get("inv", 0) or 0), int(u.get("inv", 0) or 0))
                u["invv"] = max(round(float(body.get("invv", 0) or 0), 2), float(u.get("invv", 0) or 0))
            except (TypeError, ValueError):
                pass
        u["seen"] = int(time.time())
        wallet_user(user, uid)
        st = W.state(int(uid))   # admin panel uchun ko'zgu — haqiqat manbai baza
        u["bal"] = st["bal"]; u["inv"] = len(st["inv"]); u["invv"] = round(sum(x["v"] for x in st["inv"]), 2)
        store.save()
    return ok({**client_state(uid), "wallet": wallet_out(uid, full=False)})


async def h_leaderboard(request: web.Request) -> web.Response:
    auth_user(request)
    users = store.d["users"]
    wk = week_id()
    pts = lambda v, k: v.get(k + "_week", 0) if v.get(k + "_wk") == wk else 0  # noqa: E731
    lst = [{"id": int(k), "name": v.get("name", "Player"), "photo": v.get("photo", ""),
            "points": pts(v, "points"), "pvp": pts(v, "pvp")} for k, v in users.items()
           if k.lstrip("-").isdigit() and (pts(v, "points") > 0 or pts(v, "pvp") > 0)]
    lst.sort(key=lambda x: x["pvp"], reverse=True)
    now = time.time()
    online = sum(1 for v in users.values() if now - v.get("seen", 0) < 180)
    me = auth_user(request)
    # asosiy reyting — serverdagi HAQIQIY balans bo'yicha (0 balanslilar kirmaydi)
    bal = [{"id": r["id"], "name": r["name"], "photo": r["photo"] or users.get(str(r["id"]), {}).get("photo", ""), "bal": r["bal"]}
           for r in W.leaderboard(500)]
    return ok({"list": bal, "pvpList": [x for x in lst if x["pvp"] > 0][:500], "total": len(bal), "online": online, "week": wk,
               "endsAt": int((WEEK0 + (wk + 1) * 604800) * 1000), "prizes": LB_PRIZES, "last": store.d.get("lb_last", {}),
               "me": {"rank": W.rank(int(me["id"])), "bal": W.balance(int(me["id"]))}})


# ---------------------------------------------------------------- HAMYON (server — haqiqat manbai)
async def h_wallet(request: web.Request) -> web.Response:
    user = auth_user(request)
    uid = str(user["id"])
    wallet_user(user, uid)
    return ok({**wallet_out(uid), "tx": [{"t": x["ts"], "type": x["type"], "game": x["game"], "d": to_t(x["delta"]), "bal": to_t(x["new"]),
                                          "why": x["reason"]} for x in W.history(int(uid), 30)]})


async def h_wallet_op(request: web.Request) -> web.Response:
    """Telefonda hisoblanadigan o'yinlar (Mines, Dice, Plinko, Spins, Upgrade, Crafts, kaselar), sotish/sotib olish,
    kunlik bonus. Server tekshiradi: mablag', sovg'a egaligi, raund limiti, takror so'rov."""
    user = auth_user(request)
    uid = str(user["id"])
    b = await request.json()
    g = str(b.get("game", ""))
    if g in cfg("off"):
        return web.json_response({"error": "This game is temporarily disabled"}, status=403)
    if float(b.get("delta", 0) or 0) < 0 and await sub_missing(user["id"]):
        raise web.HTTPForbidden(text=json.dumps({"error": "subscribe"}), content_type="application/json")
    wallet_user(user, uid)
    try:
        r = W.client_op(int(uid), b)
    except WalletError as e:
        return web.json_response({"error": str(e), "code": e.code, "bal": W.balance(int(uid))}, status=409)
    return ok(r)


async def h_wallet_legacy(request: web.Request) -> web.Response:
    """Eski versiyada telefonda saqlangan sovg'alarni BIR MARTA bazaga ko'chirish (soni va qiymati server ko'rgan oxirgi hisobotdan oshmaydi)."""
    user = auth_user(request)
    uid = str(user["id"])
    b = await request.json()
    wallet_user(user, uid)
    u = store.d["users"].get(uid, {})
    n = W.import_legacy_items(int(uid), list(b.get("inv") or []), int(u.get("inv_rep", u.get("inv", 0)) or 0),
                              float(u.get("invv_rep", u.get("invv", 0)) or 0))
    return ok({"imported": n, **wallet_out(uid)})


# ---------------------------------------------------------------- O'YINLAR (natija va to'lov — faqat serverda)
async def _game_call(request: web.Request, fn, bet: bool = True) -> web.Response:
    user = auth_user(request)
    uid = str(user["id"])
    if bet and await sub_missing(user["id"]):
        raise web.HTTPForbidden(text=json.dumps({"error": "subscribe"}), content_type="application/json")
    wallet_user(user, uid)
    try:
        b = await request.json() if request.can_read_body else {}
    except Exception:  # noqa: BLE001
        b = {}
    try:
        r = fn(int(uid), b)
    except WalletError as e:
        return web.json_response({"error": str(e), "code": e.code, "bal": W.balance(int(uid))}, status=409)
    except (TypeError, ValueError, KeyError) as e:
        return web.json_response({"error": f"Bad request: {e}", "bal": W.balance(int(uid))}, status=400)
    pay = float(r.get("pay", 0) or 0) + sum(float(i.get("v", 0) or 0) for i in r.get("items") or [] if r.get("pay") is None)
    if pay >= 1 and pay >= 2 * float(b.get("amount", 0) or 0.5):
        it = (r.get("items") or [None])[0]
        feed_add(int(uid), store.d["users"].get(uid, {}).get("name", ""), request.match_info.get("g", "").capitalize(), pay,
                 {"sh": it["sh"], "n": it.get("nm", ""), "m": it.get("m"), "ms": it.get("ms")} if it else None)
    return ok(r)


def _amt(b): return float(b.get("amount", 0) or 0)
def _ids(b): return [str(x) for x in (b.get("items") or [])][:20]


GAME_API = {
    "dice": lambda uid, b: G.dice(uid, _amt(b), _ids(b), bool(b.get("over", True)), float(b.get("t", 50))),
    "mines/start": lambda uid, b: G.mines_start(uid, _amt(b), _ids(b), int(b.get("n", 3))),
    "mines/pick": lambda uid, b: G.mines_pick(uid, int(b.get("i", -1))),
    "mines/cashout": lambda uid, b: G.mines_cashout(uid),
    "plinko": lambda uid, b: G.plinko(uid, _amt(b), str(b.get("d", "med"))),
    "spins": lambda uid, b: G.spins(uid, float(b.get("bet", 0.2)), bool(b.get("dc")), bool(b.get("buy"))),
    "upgrade": lambda uid, b: G.upgrade(uid, _amt(b), _ids(b), str(b.get("to", ""))),
    "crafts": lambda uid, b: G.crafts(uid, _ids(b), str(b.get("mode", "normal"))),
    "box": lambda uid, b: G.box(uid, str(b.get("id", "")), int(b.get("boost", 1) or 1)),
    "daily": lambda uid, b: G.daily(uid),
}


async def h_game(request: web.Request) -> web.Response:
    g = request.match_info["g"] + ("/" + request.match_info["a"] if request.match_info.get("a") else "")
    fn = GAME_API.get(g)
    if not fn:
        return web.json_response({"error": "unknown game"}, status=404)
    return await _game_call(request, fn, bet=g not in ("mines/pick", "mines/cashout", "daily"))


async def h_game_state(request: web.Request) -> web.Response:
    user = auth_user(request)
    uid = int(user["id"])
    wallet_user(user, str(uid))
    return ok({"mines": G.mines_state(uid), "spins": G.spins_state(uid), "dailyNext": G.daily_next(uid), "fair": G.fair(uid),
               "freebox": bool(W.db.execute("SELECT 1 FROM gstate WHERE uid=? AND game='freebox'", (uid,)).fetchone())})


async def h_game_odds(request: web.Request) -> web.Response:
    auth_user(request)
    k = request.query.get("k", "box")
    try:
        if k == "daily":
            return ok({"outs": G.daily_odds()})
        return ok({"outs": G.box_odds(request.query.get("id", ""), int(request.query.get("boost", 1) or 1))})
    except WalletError as e:
        return web.json_response({"error": str(e)}, status=400)


async def h_game_hist(request: web.Request) -> web.Response:
    user = auth_user(request)
    return ok({"list": G.history(int(user["id"]), request.query.get("game") or None, 40)})


async def h_fair_rotate(request: web.Request) -> web.Response:
    user = auth_user(request)
    b = await request.json()
    try:
        return ok(G.rotate(int(user["id"]), str(b.get("client", ""))))
    except WalletError as e:
        return web.json_response({"error": str(e)}, status=409)


async def h_catalog(request: web.Request) -> web.Response:
    return ok(CATALOG.public())


async def catalog_loop() -> None:
    """Sovg'a narxlari: har 10 daqiqada GitHub'dan (ilova ham shu narxlarni serverdan oladi — farq bo'lmaydi)."""
    url = "https://raw.githubusercontent.com/ssamy2/TelegramGiftsAssests/main/Gifts_Details.json"
    while True:
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as s:
                async with s.get(url) as r:
                    if r.status == 200:
                        n = CATALOG.apply_live(json.loads(await r.text()))
                        log.info("sovg'a narxlari yangilandi: %s ta", n)
        except Exception as e:  # noqa: BLE001
            log.warning("narxlar yangilanmadi: %s", e)
        await asyncio.sleep(600)


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
            "my": entries.get(uid, 0), "winners": g.get("winners"), "createdAt": g.get("createdAt"),
            "parts": len(entries), "top": ga_top(entries, uid)}


def mask_name(n: str) -> str:
    n = (n or "Player").strip()
    return n if len(n) <= 4 else n[:2] + "***" + n[-2:]


def ga_top(entries: dict, uid: str, k: int = 100) -> list:
    users = store.d["users"]
    top = sorted(entries.items(), key=lambda x: -x[1])[:k]
    return [{"name": (users.get(u, {}).get("name", "Player") if u == uid else mask_name(users.get(u, {}).get("name", "Player"))),
             "photo": users.get(u, {}).get("photo", ""), "n": n, "me": u == uid} for u, n in top]


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
    if await sub_missing(user["id"]):
        raise web.HTTPForbidden(text=json.dumps({"error": "subscribe"}), content_type="application/json")
    uid = str(user["id"])
    gid = request.match_info["gid"]
    b = await request.json()
    n = max(1, min(int(b.get("n", 1) or 1), 100000))
    async with store.lock:
        g = next((x for x in store.d["giveaways"] if x["id"] == gid), None)
        if not g or g.get("status") != "active" or g["endAt"] <= time.time() * 1000:
            raise web.HTTPBadRequest(text=json.dumps({"error": "giveaway has ended"}), content_type="application/json")
        if g.get("vip") and W.db.execute("SELECT turnover FROM users WHERE id=?", (int(uid),)).fetchone()[0] / 1e6 < 5000:
            raise web.HTTPBadRequest(text=json.dumps({"error": "VIP Bronze required"}), content_type="application/json")
        left = TK.tix_spend(int(uid), n, f"ga:{gid}")
        if left is None:
            raise web.HTTPBadRequest(text=json.dumps({"error": "not enough tickets", "tix": TK.tix(int(uid))}), content_type="application/json")
        g["entries"][uid] = g["entries"].get(uid, 0) + n
        u = store.d["users"].setdefault(uid, {"points": 0, "pvp": 0})
        u.setdefault("name", clean_name(user))
        store.save()
        return ok({"my": g["entries"][uid], "pool": sum(g["entries"].values()), "tix": left})


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
        g = next((x for x in store.d["giveaways"] if x["id"] == gid), None)
        if g and g.get("status") == "active":   # tugamagan giveaway o'chirilsa — ticketlar qaytariladi
            for k, n in (g.get("entries") or {}).items():
                if str(k).isdigit() and n:
                    TK.tix_add(int(k), int(n), f"ga_refund:{gid}", idem=f"garf:{gid}:{k}")
        store.d["giveaways"] = [x for x in store.d["giveaways"] if x["id"] != gid]
        store.save()
    return ok()


CHAN_MEM: dict = {}


async def chan_member(uid: int) -> bool | None:
    """Foydalanuvchi post kanaliga obuna bo'lganmi (60 s kesh). None — tekshirib bo'lmadi."""
    cid = ch_id()
    bot = bot_ref.get("bot")
    if not cid or not bot:
        return None
    k = (cid, int(uid))
    c = CHAN_MEM.get(k)
    if c and time.time() - c[1] < 60 and c[0]:
        return c[0]
    try:
        m = await bot.get_chat_member(cid, int(uid))
        v = m.status in ("member", "administrator", "creator", "restricted")
    except Exception:  # noqa: BLE001
        v = None
    CHAN_MEM[k] = (v, time.time())
    return v


def refs_today(uid: int) -> int:
    ds = TK.day_start()
    return sum(1 for u in store.d["users"].values() if u.get("ref_by") == int(uid) and u.get("joined", 0) >= ds)


def task_lang(request) -> int:
    return {"en": 0, "uz": 1, "ru": 2}.get(request.query.get("lang", "en"), 0)


async def h_tasks(request: web.Request) -> web.Response:
    user = auth_user(request)
    uid = int(user["id"])
    W.ensure_user(uid, clean_name(user), user.get("username", ""))
    ch = await chan_member(uid) if ch_url() else None
    return ok(TK.state(uid, task_lang(request), refs_today(uid), ch, ch_url()))


async def h_task_claim(request: web.Request) -> web.Response:
    user = auth_user(request)
    if await sub_missing(user["id"]):
        raise web.HTTPForbidden(text=json.dumps({"error": "subscribe"}), content_type="application/json")
    uid = int(user["id"])
    b = await request.json()
    tid = str(b.get("id", ""))[:24]
    ch = None
    if tid == "chan":
        CHAN_MEM.pop((ch_id(), uid), None)
        ch = await chan_member(uid)
    try:
        r = TK.claim(uid, tid, refs_today(uid), ch, ch_url())
    except ValueError as e:
        raise web.HTTPBadRequest(text=json.dumps({"error": str(e)}), content_type="application/json")
    return ok({**r, **TK.state(uid, task_lang(request), refs_today(uid), ch if tid == "chan" else (await chan_member(uid) if ch_url() else None), ch_url())})


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
        push_reward(uid, {"kind": "gram", "p": amount, "from": "Deposit", "src": src})
        u = store.d["users"].setdefault(uid, {"points": 0, "pvp": 0})
        u["dep"] = round(u.get("dep", 0) + amount, 2)
        store.d.setdefault("deposits", []).insert(0, {"uid": int(uid), "amount": amount, "src": src, "note": note, "t": int(time.time())})
        del store.d["deposits"][5000:]
        ref, pct = u.get("ref_by"), float(cfg("ref_pct") or 0)      # taklif qilgan do'stga depozitdan % (admin paneldan)
        bonus = round(amount * pct / 100, 2) if ref and pct > 0 and str(ref) != uid else 0
        if bonus > 0:
            push_reward(str(ref), {"kind": "gram", "p": bonus, "from": f"Referral {pct:g}%", "src": "ref"})
            r = store.d["users"].setdefault(str(ref), {"points": 0, "pvp": 0})
            r["ref_earn"] = round(r.get("ref_earn", 0) + bonus, 2)
        store.save()
    log.info("DEPOZIT %s: +%s TON (%s %s)", uid, amount, src, note)
    bot = bot_ref.get("bot")
    if bot:
        try:
            await bot.send_message(int(uid), f"✅ Depozit qabul qilindi: <b>+{amount} TON</b>\n✅ Депозит зачислен: <b>+{amount} TON</b>")
        except Exception as e:  # noqa: BLE001
            log.info("depozit xabari yuborilmadi: %s", e)


async def h_promo(request: web.Request) -> web.Response:
    """Free Box promo-kodi: har o'yinchi bitta kodni bir marta ishlatadi."""
    user = auth_user(request)
    if await sub_missing(user["id"]):
        raise web.HTTPForbidden(text=json.dumps({"error": "subscribe"}), content_type="application/json")
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
    wallet_user(user, uid)
    G.grant_freebox(int(uid))   # bepul quti — server o'zi ochadi
    return ok({"ok": True, "kind": p.get("kind", "freebox")})


async def h_dep_info(request: web.Request) -> web.Response:
    user = auth_user(request)
    return ok({"address": dep_addr(), "comment": f"dep_{user['id']}", "rate": cfg("stars_rate"), "tonRate": cfg("ton_rate"),
               "min": MIN_TON_DEPOSIT, "ton": bool(dep_addr()), "stars": bool(BOT_TOKEN)})


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
    headers = {"X-API-Key": TONCENTER_KEY} if TONCENTER_KEY else {}
    async with aiohttp.ClientSession(headers=headers) as http:
        while True:
            addr = dep_addr()
            if not addr:   # hamyon admin paneldan qo'yilguncha kutadi
                await asyncio.sleep(15); continue
            try:
                async with http.get(f"{TONCENTER_URL}/getTransactions", params={"address": addr, "limit": 50}, timeout=aiohttp.ClientTimeout(total=20)) as r:
                    data = await r.json()
                txs = data.get("result") or []
                seen = store.d.setdefault("ton_seen", [])
                first = not store.d.get("ton_init") or store.d.get("ton_init_addr", addr) != addr   # yangi hamyon — eski tranzaksiyalar hisoblanmaydi
                store.d["ton_init_addr"] = addr
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
        try:
            amount = round(float(b.get("amount", 0) or 0), 2)
        except (TypeError, ValueError):
            amount = 0
        if amount != amount or amount < 0.1:   # NaN yoki juda kichik
            return web.json_response({"error": "Amount must be at least 0.1"}, status=400)
        if amount > 1e13:
            return web.json_response({"error": "Amount is too large"}, status=400)
        item = {"id": uuid.uuid4().hex[:10], "kind": "gram", "p": amount, "from": sender, "n": "TON"}
        text = f"💎 <b>{sender}</b> sent you <b>{amount} TON</b>."
    elif kind == "gift":
        g = b.get("gift") or {}
        if not str(g.get("id", "")).strip():
            return web.json_response({"error": "Gift id missing — reopen the app and try again"}, status=400)
        item = {"id": uuid.uuid4().hex[:10], "kind": "gift", "sh": str(g.get("sh", ""))[:40], "n": str(g.get("n", ""))[:40],
                "p": round(float(g.get("p", 0) or 0), 2), "m": str(g.get("m") or "")[:40], "ms": str(g.get("ms") or "")[:60], "from": sender}
        text = f"🎁 <b>{sender}</b> sent you a <b>{item['n']}</b> gift."
    else:
        return web.json_response({"error": "kind must be gram or gift"}, status=400)
    wallet_user(user, str(user["id"]))
    try:
        if kind == "gram":
            W.credit(int(user["id"]), -amount, "transfer_out", f"To {to_u.get('name', to_uid)}", idem="tr:" + item["id"])
        else:
            gid = str((b.get("gift") or {}).get("id", ""))
            v = W.take_items(int(user["id"]), [gid], "transfer_out", f"Gift to {to_u.get('name', to_uid)}", idem="tr:" + item["id"])
            item["p"] = v; item["iid"] = gid
    except WalletError as e:
        return web.json_response({"error": str(e)}, status=400)
    async with store.lock:
        push_reward(to_uid, item)
        store.d.setdefault("transfers", []).insert(0, {"from": user["id"], "to": int(to_uid), **item, "t": int(time.time())})
        del store.d["transfers"][1000:]
        store.save()
    bot = bot_ref.get("bot")
    if bot:
        try:
            await bot.send_message(int(to_uid), text)
        except Exception as e:  # noqa: BLE001
            log.info("transfer xabari yuborilmadi: %s", e)
    return ok({"ok": True, "to": {"id": int(to_uid), "name": to_u.get("name", "Player")}})


async def h_withdraw(request: web.Request) -> web.Response:
    """Withdraw (qabul qiluvchi bo'sh): sovg'a o'yinchining o'z Telegram'iga chiqariladi.
    Sovg'a balansdan olinadi va so'rov adminlarga yuboriladi (NFT'ni admin/gift-bot yuboradi)."""
    user = auth_user(request)
    b = await request.json()
    g = b.get("gift") or {}
    gid = str(g.get("id", "")).strip()
    if not gid:
        return web.json_response({"error": "Gift id missing — reopen the app and try again"}, status=400)
    wallet_user(user, str(user["id"]))
    rid = uuid.uuid4().hex[:10]
    try:
        v = W.take_items(int(user["id"]), [gid], "withdraw", "Gift withdraw", idem="wd:" + rid)
    except WalletError as e:
        return web.json_response({"error": str(e)}, status=400)
    req = {"id": rid, "uid": int(user["id"]), "name": clean_name(user), "username": user.get("username", ""), "n": str(g.get("n", ""))[:40],
           "m": str(g.get("m") or "")[:40], "p": v, "t": int(time.time()), "status": "pending"}
    async with store.lock:
        store.d.setdefault("withdrawals", []).insert(0, req)
        del store.d["withdrawals"][2000:]
        store.save()
    bot = bot_ref.get("bot")
    if bot:
        for a in ADMIN_IDS:
            try:
                await bot.send_message(a, f"📤 <b>Withdraw</b>\n{req['name']} (@{req['username'] or '-'}, <code>{req['uid']}</code>)\n🎁 {req['n']} {req['m']} — {v} TON\nID: <code>{rid}</code>")
            except Exception as e:  # noqa: BLE001
                log.info("withdraw xabari yuborilmadi: %s", e)
    return ok({"ok": True, "id": rid})


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
                push_reward(uid, {"kind": "gift", "ga": g["id"], "from": "Giveaway", **gift})
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
                await bot.send_message(uid, f"🎉 Tabriklaymiz! Giveaway'da <b>{gift_name}</b> yutdingiz — Backpack'da.\n"
                                            f"🎉 Поздравляем! Вы выиграли <b>{gift_name}</b> в розыгрыше — он в Backpack.")
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
            if key == "points":   # asosiy reyting — hafta oxiridagi haqiqiy balans bo'yicha
                rows = [(str(r["id"]), r["bal"]) for r in W.leaderboard(len(LB_PRIZES))]
            else:
                rows = [(k, v.get(key + "_week", 0)) for k, v in store.d["users"].items()
                        if k.isdigit() and v.get(key + "_wk") == prev and v.get(key + "_week", 0) > 0]
                rows.sort(key=lambda x: x[1], reverse=True)
            winners = []
            for i, (uid, sc) in enumerate(rows[:len(LB_PRIZES)]):
                push_reward(uid, {"kind": "gift", "n": LB_PRIZES[i], "from": title, "ga": "lb"})
                winners.append({"uid": int(uid), "name": store.d["users"].get(uid, {}).get("name", uid), "rank": i + 1, "s": sc})
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
            if API_URL_FILE:   # maker.py rejimi: tunnel manzili fayldan + /t/<id>
                with open(API_URL_FILE, encoding="utf-8") as f:
                    base = f.read().strip().rstrip("/")
                url = (base + API_PREFIX) if base else ""
            else:
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
# PvP / TvT botlari — Epic videosi bo'yicha (408.mp4 6:04, 8:44): PvP'da bitta brend bot ("Ebic Gift" → RIKI),
# TvT'da har jamoada bitta bot — nomi jamoa nomi ("Ice" / "Fire"), BOT belgisi bilan, reytingga kirmaydi (uid < 0).
# Avatar — RIKI logotipi (icon.png). Chizilgan SVG/emoji avatarlar olib tashlandi.
BOT_PROFILES = {-20: {"uid": -20, "name": BRAND, "photo": "icon.png"}}
TVT_BOTS = {"ice": {"uid": -21, "name": "Ice", "photo": "icon.png"}, "fire": {"uid": -22, "name": "Fire", "photo": "icon.png"}}


def bots_join(lst: list, want: int, chance: float) -> None:
    """Raundga asta-sekin botlar qo'shiladi (umumiy soni want gacha); ba'zilari tikishni oshiradi."""
    have = [p for p in lst if p["bot"]]
    if len(have) < want and random.random() < chance:
        free = [b for uid, b in BOT_PROFILES.items() if not any(p["uid"] == uid for p in lst)]
        if free:
            add_stake(lst, dict(random.choice(free)), bot_amt(), [], True)
    elif have and random.random() < chance / 6:
        b = random.choice(have)
        if b["amt"] < cfg("bot_max"):
            add_stake(lst, b, bot_amt(cfg("bot_max") - b["amt"]), [], True)
RK_BOTS = [(-10, "Astro"), (-11, "Comet"), (-12, "Nova"), (-13, "Orbit"), (-14, "Pulsar"), (-15, "Vega"), (-16, "Zenith"), (-17, "Quasar")]   # Rocket botlari (BOT belgisi bilan ko'rinadi)


def rk_bot_auto() -> float:
    """Bot auto-cashout — crash qiymatidan mustaqil, tasodifiy."""
    return round(random.choice([1.2, 1.3, 1.5, 1.8, 2.0, 2.5, 3.0, 5.0]) * random.uniform(.95, 1.1), 2)
BET_TIME = 25.0   # 2+ o'yinchi bo'lgach kutish (s)
SPIN_TIME = 8.0   # PvP tasmasi / g'ildirak aylanishi (s) — ilovadagi 7 s animatsiyadan keyin natija
DONE_TIME = 5.0   # natija ko'rsatish (s)
RK_WAIT = 5.0     # rocket sanoq (s) — Epic: 5→1, har biri 1 s
RK_AFTER = 3.8    # crashdan keyin (s) — Epic: portlash 0.83 s + yozuv 1.1–2.65 s + pauza

def now_ms() -> int:
    return int(time.time() * 1000)


def bot_amt(cap: float | None = None) -> float:
    cap = min(cap if cap is not None else 1e9, float(cfg("bot_max")))
    lo = max(0.01, float(cfg("bot_min")))
    r = random.random()
    v = random.uniform(lo, max(lo, 3)) if r < .55 else random.uniform(3, 60) if r < .85 else random.uniform(60, 300) if r < .97 else random.uniform(300, 1000)
    return round(max(lo, min(cap, v)), 2)


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


# Epic videosidan o'lchangan ko'paytiruvchi egri chizig'i (408.mp4 5:37–5:46, jonli chip har 0.5 s):
# t (s) → m. 9.05 s dan keyin: ln m = ln 3.75 + 0.164·(t − 9.05)
RK_CURVE = [[0, 1.00], [0.55, 1.00], [1.07, 1.01], [1.54, 1.04], [2.54, 1.20], [3.06, 1.33], [3.56, 1.44], [4.04, 1.57], [4.56, 1.74], [5.05, 1.91], [5.54, 2.06], [6.07, 2.27], [6.57, 2.50], [7.07, 2.71], [7.57, 2.97], [8.04, 3.23], [8.57, 3.49], [9.05, 3.75]]


def rk_mult(t: float) -> float:
    t = min(max(0.0, t), 400.0)
    if t >= RK_CURVE[-1][0]:
        m = math.exp(math.log(RK_CURVE[-1][1]) + 0.164 * (t - RK_CURVE[-1][0]))
    else:
        j = next(k for k in range(1, len(RK_CURVE)) if RK_CURVE[k][0] > t)
        (t0, m0), (t1, m1) = RK_CURVE[j - 1], RK_CURVE[j]
        m = math.exp(math.log(m0) + (math.log(m1) - math.log(m0)) * (t - t0) / (t1 - t0))
    return int(min(m, 1e9) * 100 + 1e-9) / 100


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
                        "m": str(x.get("m") or "")[:40], "ms": str(x.get("ms") or "")[:60], "iid": str(x.get("id") or "")[:24]})
        except (TypeError, ValueError):
            pass
    return out


def reward(uid: int, item: dict, delay: float = 0) -> None:
    if uid <= 0:
        return  # botlar
    push_reward(str(uid), item, delay_at=(now_ms() + int(delay * 1000)) if delay else None)   # animatsiya tugamaguncha ko'rsatilmaydi


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


RK_PRIZE = os.getenv("RK_PRIZE", "plush_pepe")          # katta tikish yutug'i — shu sovg'a (yutuq qiymatida)
RK_PEPE_MIN = RK_PEPE_MIN0   # standart; amalda cfg("rk_pepe_min") — admin paneldan (0 = o'chiq, doim TON)  # shu summadan (TON) tiksa — Pepe; kamida — yutuqqa mos NFT + qoldiq


def rk_pay(R: dict, b: dict) -> float | None:
    """Rocket yutug'i (server, bir raundda bir marta):
    tikish ≥ RK_PEPE_MIN → backpack'ga yutuq qiymatidagi yashil Plush Pepe;
    aks holda → yutuq summasiga mos eng qimmat NFT (≤ yutuq) + qoldiq balansga."""
    if b["uid"] <= 0:
        return None
    w = round(b["amt"] * b["out"], 2)
    idem = f"rk:{R['id']}:{b['uid']}"
    try:
        thr = float(cfg("rk_pepe_min") or 0)
        if thr > 0 and b["amt"] >= thr:
            g = CATALOG.by_sh.get(RK_PRIZE) or {"sh": RK_PRIZE, "n": "Plush Pepe"}
            got = W.give_items(b["uid"], [{"sh": g["sh"], "nm": g["n"], "v": w}], "win", f"Rocket x{b['out']:.2f}", idem=idem)
            b["prize"] = {"sh": g["sh"], "v": w, "id": got[0]["id"] if got else None, "kind": "pepe"}
        else:
            nf = CATALOG.nft_for(w)
            if nf:
                got = W.give_items(b["uid"], [{"sh": nf["g"]["sh"], "nm": nf["g"]["n"], "v": nf["p"], "m": nf["m"], "ms": nf["ms"]}],
                                   "win", f"Rocket x{b['out']:.2f}", idem=idem)
                rest = round(w - nf["p"], 6)
                if rest > 0:
                    W.credit(b["uid"], rest, "win", f"Rocket x{b['out']:.2f} (rest)", "rocket", idem=idem + ":r")
                b["prize"] = {"sh": nf["g"]["sh"], "v": nf["p"], "m": nf["m"], "ms": nf["ms"], "rest": max(0, rest), "kind": "nft"}
            else:
                W.credit(b["uid"], w, "win", f"Rocket x{b['out']:.2f}", "rocket", idem=idem)
                b["prize"] = {"kind": "ton", "v": w}
        return W.balance(b["uid"])
    except WalletError as e:
        log.warning("rocket pay %s: %s", b["uid"], e)
        return None


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
                            "wuid": w["uid"], "ton": ton, "bot": bool(w.get("bot")),
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
                        humans = any(not p["bot"] for p in R["players"])
                        if humans or cfg("bots_always"):   # botlar doim o'ynaydi (BOT belgisi bilan), 3–4 tagacha
                            bots_join(R["players"], int(cfg("live_bots")), .035 if humans else .05)
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
                    if humans or cfg("bots_always"):   # har jamoaga 1–2 bot (umumiy 3–4), bo'sh jamoa birinchi to'ldiriladi
                        for team in (("fire", "ice") if not R["fire"] else ("ice", "fire")):
                            other = R["fire" if team == "ice" else "ice"]
                            taken = {p["uid"] for p in other}
                            lst = R[team]
                            if int(cfg("live_bots")) > 0 and not any(p["bot"] for p in lst) and random.random() < (.08 if not lst else .02):
                                add_stake(lst, dict(TVT_BOTS[team]), bot_amt(), [], True)
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
                            rk_pay(R, b)
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


def pot_top(g: str, t: int) -> dict | None:
    """Kunning eng katta yutug'i (PvP/Roulette) — faqat animatsiya tugagan raundlardan. Kun Toshkent vaqti bilan."""
    day = time.strftime("%Y-%m-%d", time.gmtime(time.time() + 5 * 3600))
    tops = store.d.setdefault("pot_top", {})
    best = tops.get(g) if (tops.get(g) or {}).get("day") == day else None
    ds = (int(time.time() + 5 * 3600) // 86400 * 86400 - 5 * 3600) * 1000
    for h in LIVE_HIST[g]:
        if isinstance(h, dict) and ds <= h.get("t", 0) <= t and (not best or h["tot"] > best["tot"]):
            best = {"day": day, "n": h["n"], "photo": h.get("photo", ""), "tot": h["tot"], "ch": h["ch"], "bot": h.get("bot", False), "id": h["id"]}
            tops[g] = best
    return best


def live_public(g: str) -> dict:
    R = LIVE[g]
    t = now_ms()
    out = {"g": g, "id": R["id"], "phase": R["phase"], "hash": R["hash"], "now": t,
           "hist": [h for h in LIVE_HIST[g] if not isinstance(h, dict) or h.get("t", 0) <= t][:20]}   # natija animatsiyadan oldin ko'rinmaydi
    if g == "rocket":
        out.update({"pepeMin": float(cfg("rk_pepe_min") or 0), "startAt": R["startAt"], "t0": R["t0"], "crashAt": R["crashAt"],
                    "crash": R["crash"] if R["phase"] == "crash" else None,
                    "bets": [{**{k: b[k] for k in ("uid", "name", "photo", "amt", "auto", "out", "gift")}, "bot": bool(b.get("bot"))} for b in R["bets"]]})
    elif g == "tvt":
        out.update({"endAt": R["endAt"], "ice": pub_players(R["ice"]), "fire": pub_players(R["fire"]),
                    "win": R["win"] if R["phase"] != "wait" else None, "playAt": R["playAt"]})
    else:
        out["top"] = pot_top(g, t)
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
    if await sub_missing(user["id"]):
        raise web.HTTPForbidden(text=json.dumps({"error": "subscribe"}), content_type="application/json")
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
    wallet_user(user, str(user["id"]))
    async with live_lock:
        R = LIVE[g]
        if R["phase"] != "wait" or (g != "rocket" and R.get("endAt") and now_ms() > R["endAt"] - 500):
            return web.json_response({"error": "Round in progress"}, status=409)
        if g == "rocket" and any(x["uid"] == who["uid"] for x in R["bets"]):
            return web.json_response({"error": "Bet already placed"}, status=409)
        if g == "tvt":
            team = b.get("team")
            if team not in ("ice", "fire"):
                return web.json_response({"error": "team: ice/fire"}, status=400)
            if any(x["uid"] == who["uid"] for x in R["fire" if team == "ice" else "ice"]):
                return web.json_response({"error": "You're already on the other team"}, status=409)
        # --- pul va sovg'alar SERVERDA yechiladi (telefon emas)
        key = f"lb:{g}:{R['id']}:{who['uid']}:{uuid.uuid4().hex[:6]}"
        try:
            if gifts:
                ids = [x["iid"] for x in gifts]
                if not all(ids):
                    return web.json_response({"error": "Gift not found in your backpack"}, status=400)
                srv = {it["id"]: it for it in W.items(int(user["id"]))}
                for x in gifts:                        # qiymat — serverdagi, telefon aytgani emas
                    if x["iid"] in srv:
                        x["p"] = srv[x["iid"]]["v"]
                W.take_items(int(user["id"]), ids, "bet", f"{g} gift bet", g, idem=key + ":g")
            if ton > 0:
                W.credit(int(user["id"]), -ton, "bet", f"{g} bet", g, idem=key)
        except WalletError as e:
            if gifts and ton > 0 and e.code == "insufficient":   # sovg'ani qaytaramiz
                W.give_items(int(user["id"]), [{"id": x["iid"], "sh": x["sh"], "nm": x["n"], "v": x["p"], "m": x["m"], "ms": x["ms"]} for x in gifts],
                             "refund", f"{g} bet refund", g)
            return web.json_response({"error": str(e)}, status=400)
        if g == "rocket":
            amt = round(ton + sum(x["p"] for x in gifts), 2)
            auto = float(b.get("auto", 0) or 0)
            R["bets"].append({**who, "amt": amt, "auto": round(auto, 2) if auto >= 1.01 else 0, "out": 0, "gift": bool(gifts)})
        elif g == "tvt":
            add_stake(R[b.get("team")], who, ton, gifts)
        else:
            add_stake(R["players"], who, ton, gifts)
        return ok({**live_public(g), "bal": W.balance(int(user["id"]))})


async def h_live_cancel(request: web.Request) -> web.Response:
    user = auth_user(request)
    async with live_lock:
        R = LIVE["rocket"]
        b = next((x for x in R["bets"] if x["uid"] == int(user["id"])), None)
        if not b or R["phase"] != "wait" or b["gift"]:
            return web.json_response({"error": "Can't cancel"}, status=409)
        R["bets"].remove(b)
        r = W.credit(int(user["id"]), b["amt"], "refund", "Rocket bet cancelled", "rocket", idem=f"rkc:{R['id']}:{user['id']}")
        return ok({"ok": True, "amt": b["amt"], "bal": r["bal"]})


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
        r = rk_pay(R, b)
        return ok({"m": m, "amt": b["amt"], "bal": r, "prize": b.get("prize")})


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
    r.add_get("/api/tasks", h_tasks)
    r.add_post("/api/tasks/claim", h_task_claim)
    r.add_post("/api/giveaways", h_ga_create)
    r.add_post("/api/giveaways/{gid}/join", h_ga_join)
    r.add_post("/api/giveaways/{gid}/end", h_ga_end)
    r.add_delete("/api/giveaways/{gid}", h_ga_delete)
    r.add_get("/api/user", h_user)
    r.add_get("/api/deposit/info", h_dep_info)
    r.add_post("/api/ton/bind", h_ton_bind)
    r.add_post("/api/stars/invoice", h_stars_invoice)
    r.add_post("/api/transfer", h_transfer)
    r.add_post("/api/withdraw", h_withdraw)
    r.add_get("/api/live", h_live)
    r.add_post("/api/live/bet", h_live_bet)
    r.add_post("/api/live/cancel", h_live_cancel)
    r.add_post("/api/live/cashout", h_live_cashout)
    r.add_post("/api/promo", h_promo)
    r.add_get("/api/rewards", h_rewards)
    r.add_get("/api/wallet", h_wallet)
    r.add_post("/api/wallet/op", h_wallet_op)
    r.add_post("/api/wallet/legacy", h_wallet_legacy)
    r.add_get("/api/catalog", h_catalog)
    r.add_get("/api/game/state", h_game_state)
    r.add_get("/api/game/odds", h_game_odds)
    r.add_get("/api/game/history", h_game_hist)
    r.add_post("/api/fair/rotate", h_fair_rotate)
    r.add_post("/api/game/{g}", h_game)
    r.add_post("/api/game/{g}/{a}", h_game)
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
    if bot_ref.get("uname"):
        q.append("bot=" + quote(bot_ref["uname"], safe=""))
    if GIFT_BOT:
        q.append("gb=" + quote(GIFT_BOT, safe=""))
    if start_param:
        q.append("tgWebAppStartParam=" + quote(start_param, safe=""))
    if q:
        url += ("&" if "?" in url else "?") + "&".join(q)
    return url


def app_url(start_param: str = "") -> str:
    return webapp_url(start_param)


# ---- o'yinchi tili: English / O'zbekcha (botdagi xabarlar + ilova ?lang=)
UTXT = {
    "hi": {"en": "👋 Hi, <b>{name}</b>!\n\n🎁 <b>{brand}</b> — Telegram NFT gift games:\nRocket, PvP, TvT, Roulette, Upgrade, Mines, Spins, Plinko, Dice, Crafts and boxes.\n\nTap the button below 👇",
           "uz": "👋 Salom, <b>{name}</b>!\n\n🎁 <b>{brand}</b> — Telegram NFT sovg'a o'yinlari:\nRocket, PvP, TvT, Roulette, Upgrade, Mines, Spins, Plinko, Dice, Crafts va qutilar.\n\nPastdagi tugmani bosing 👇"},
    "open": {"en": "🚀 Open {brand}", "uz": "🚀 {brand} ni ochish"},
    "channel": {"en": "📢 Channel", "uz": "📢 Kanal"},
    "lang": {"en": "🌐 Language: English", "uz": "🌐 Til: O'zbekcha"},
    "lang_pick": {"en": "🌐 Choose your language:", "uz": "🌐 Tilni tanlang:"},
    "lang_ok": {"en": "✅ Language: English", "uz": "✅ Til: O'zbekcha"},
    "help": {"en": "<b>Commands</b>\n/start — start\n/app — open the app\n/ref — your referral link\n/lang — language\n/help — help",
             "uz": "<b>Buyruqlar</b>\n/start — boshlash\n/app — ilovani ochish\n/ref — referal havolangiz\n/lang — til\n/help — yordam"},
    "ref": {"en": "🔗 Your referral link:\n<code>{link}</code>\n\nYou get <b>{pct}%</b> of your friends' deposits.",
            "uz": "🔗 Referal havolangiz:\n<code>{link}</code>\n\nDo'stlaringiz depozitidan <b>{pct}%</b> sizga tushadi."},
    "blocked": {"en": "🚫 Your account has been blocked. Contact support if you think this is a mistake.",
                "uz": "🚫 Hisobingiz bloklangan. Xato deb o'ylasangiz, yordamga yozing."},
}


def ulang(user) -> str:
    """Saqlangan til; bo'lmasa Telegram tilidan (uz → O'zbekcha, qolganlari English)."""
    if not user:
        return "en"
    v = store.d.get("ulang", {}).get(str(user.id))
    if v in ("en", "uz"):
        return v
    return "uz" if (getattr(user, "language_code", "") or "").startswith("uz") else "en"


def ut(key: str, lang: str, **kw) -> str:
    d = UTXT[key]
    return (d.get(lang) or d["en"]).format(brand=BRAND, **kw)


def main_kb(start_param: str = "", lang: str = "en") -> InlineKeyboardMarkup:
    url = app_url(start_param)
    url += ("&" if "?" in url else "?") + "lang=" + lang
    rows = [[InlineKeyboardButton(text=ut("open", lang), web_app=WebAppInfo(url=url))]]
    if ch_url():
        rows.append([InlineKeyboardButton(text=ut("channel", lang), url=ch_url())])
    rows.append([InlineKeyboardButton(text=ut("lang", lang), callback_data="ulang")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


@dp.message(Command("lang"))
async def cmd_lang(message: Message) -> None:
    lg = ulang(message.from_user)
    await message.answer(ut("lang_pick", lg), reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="🇬🇧 English", callback_data="ulang:en"), InlineKeyboardButton(text="🇺🇿 O'zbekcha", callback_data="ulang:uz")]]))


@dp.callback_query(F.data.startswith("ulang"))
async def on_ulang(cq: CallbackQuery) -> None:
    if cq.data == "ulang":
        lg = ulang(cq.from_user)
        await cq.message.answer(ut("lang_pick", lg), reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text="🇬🇧 English", callback_data="ulang:en"), InlineKeyboardButton(text="🇺🇿 O'zbekcha", callback_data="ulang:uz")]]))
        await cq.answer()
        return
    lg = cq.data.split(":", 1)[1]
    if lg not in ("en", "uz"):
        await cq.answer()
        return
    async with store.lock:
        store.d.setdefault("ulang", {})[str(cq.from_user.id)] = lg
        store.save()
    await cq.answer(ut("lang_ok", lg))
    name = cq.from_user.first_name or ""
    try:
        await cq.message.edit_text(ut("hi", lg, name=name), reply_markup=main_kb("", lg))
    except Exception:
        await cq.message.answer(ut("hi", lg, name=name), reply_markup=main_kb("", lg))


@dp.message(CommandStart())
async def cmd_start(message: Message, command: CommandObject) -> None:
    param = (command.args or "").strip()
    if message.from_user and store.d["users"].get(str(message.from_user.id), {}).get("banned"):
        await message.answer(ut("blocked", ulang(message.from_user)))
        return
    if message.from_user:
        miss = await sub_missing(message.from_user.id, fresh=True)
        if miss:
            await message.answer(SUB_TEXT.format(brand=BRAND), reply_markup=sub_kb(miss, param))
            return
    await start_flow(message, message.from_user, param)


async def start_flow(message: Message, user, param: str) -> None:
    name = user.first_name if user else "do'st"
    if user:   # bazada yozuv + til (e'lonlar shu tilda yuboriladi)
        try:
            W.ensure_user(user.id, clean_name({"username": user.username, "first_name": user.first_name}), (user.username or "").lower())
            W.set_lang(user.id, "ru" if (user.language_code or "").startswith(("ru", "uk", "be", "kk")) else "uz")
        except Exception as e:  # noqa: BLE001
            log.warning("start user: %s", e)
    lg = ulang(user)
    text = ut("hi", lg, name=name)
    if param.startswith("bonus_") and user:
        await redeem_bonus(message, param[6:], user)
        return
    if param.startswith("ref_") and user:
        ref_id = param[4:]
        me_id = str(user.id)
        async with store.lock:
            is_new = me_id not in store.d["users"]
            if is_new and ref_id.isdigit() and ref_id != me_id:
                store.d["users"][me_id] = {"name": clean_name({"username": user.username, "first_name": name}),
                                           "username": (user.username or "").lower(), "points": 0, "pvp": 0, "ref_by": int(ref_id), "joined": int(time.time())}
                give = int(cfg("ref_tix")) if TK.tix_today(int(ref_id), "ref") < int(cfg("ref_tix_day")) else 0
                if give:
                    TK.tix_add(int(ref_id), give, "ref:" + me_id, idem="ref:" + me_id)
                store.d["rewards"].setdefault(ref_id, []).append({"id": uuid.uuid4().hex[:10], "kind": "ref", "n": "ref", "p": 0, "tix": give, "from": name, "srv": 1})
                store.save()
                log.info("referal: %s -> %s", ref_id, me_id)
    await message.answer(text, reply_markup=main_kb(param, lg))


@dp.callback_query(F.data.startswith("subchk"))
async def on_subchk(cq: CallbackQuery) -> None:
    param = cq.data[7:] if cq.data.startswith("subchk:") else ""
    miss = await sub_missing(cq.from_user.id, fresh=True)
    if miss:
        await cq.answer("❌ You haven't subscribed to all channels yet.", show_alert=True)
        try:
            await cq.message.edit_reply_markup(reply_markup=sub_kb(miss, param))
        except Exception:
            pass
        return
    await cq.answer("✅ Thank you!")
    try:
        await cq.message.delete()
    except Exception:
        pass
    await start_flow(cq.message, cq.from_user, param)


@dp.message(Command("app"))
async def cmd_app(message: Message) -> None:
    lg = ulang(message.from_user)
    await message.answer("🚀 " + ("Ilovani oching:" if lg == "uz" else "Open the app:"), reply_markup=main_kb("", lg))


@dp.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(ut("help", ulang(message.from_user)))


@dp.message(Command("ref"))
async def cmd_ref(message: Message, bot: Bot) -> None:
    me = await bot.get_me()
    uid = message.from_user.id if message.from_user else 0
    await message.answer(ut("ref", ulang(message.from_user), link=f"https://t.me/{me.username}?start=ref_{uid}", pct=f"{cfg('ref_pct'):g}"))


ADMIN_WAIT: dict[int, str] = {}   # admin_id -> kutilayotgan amal (add/sub/bonus/bc/find)


def admin_kb() -> InlineKeyboardMarkup:
    B = InlineKeyboardButton
    a = lambda k, cb, **kw: B(text=t(k, **kw), callback_data=cb)  # noqa: E731
    return InlineKeyboardMarkup(inline_keyboard=[
        [a("m_dash", "a2:dash"), a("m_sys", "a2:sys")],
        [a("m_users", "a2:ul:seen:0"), a("m_find", "a2:find")],
        [a("m_bal", "a2:bal"), a("m_tx", "a2:tx:all:day:0")],
        [a("m_lb", "a2:lb:0"), a("m_games", "a2:gm:day")],
        [a("m_ann", "a2:an"), a("m_bc", "ad:bc")],
        [a("m_bonus", "ad:bonus"), a("m_links", "ad:blist")],
        [a("m_pc", "ad:pc"), a("m_codes", "ad:pclist")],
        [a("m_ga", "ad:ga"), a("m_deps", "ad:deps")],
        [a("m_ch", "ad:ch"), a("m_subs", "ad:subs", n=len(cfg("subs")))],
        [a("m_set", "ad:set"), a("m_rtp", "ad:rtp")],
        [a("m_ban", "ad:ban"), a("m_rst", "ad:rst")],
        [a("m_roles", "a2:rl"), a("m_audit", "a2:aud")],
        [a("m_chart", "ad:chart"), a("m_gh", "ad:gh")],
        [B(text=t("lang_btn"), callback_data="a2:lang")],
        [B(text=t("open_app", brand=BRAND), web_app=WebAppInfo(url=webapp_url()))],
    ])


def back_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text=t("back"), callback_data="ad:home")]])


def admin_home_text() -> str:
    st = W.stats()
    p = st["per"]
    fmt_ = lambda v: f"{v:,.2f}".replace(",", " ").rstrip("0").rstrip(".")  # noqa: E731
    row = lambda k, key: f"   {t(k):<9} " + " · ".join(fmt_(p[x][key]) if isinstance(p[x][key], float) else str(p[x][key]) for x in ("day", "week", "month"))  # noqa: E731
    prof = " · ".join(fmt_(round(p[x]["bets"] - p[x]["wins"], 2)) for x in ("day", "week", "month"))
    recent = W.history(None, 5)
    names = store.d["users"]
    rec = "\n".join(f"   {time.strftime('%H:%M', time.localtime(r['ts'] / 1000))} {names.get(str(r['uid']), {}).get('name', r['uid'])}: {ty(r['type'])} "
                    f"{to_t(r['delta']):+g}" for r in recent) or "   —"
    return (f"{t('panel', brand=BRAND)}   {t('st_maint') if cfg('maint') else t('st_online')}\n━━━━━━━━━━━━━━━━━━\n"
            f"{t('h_users')}\n   {t('h_users_l', **st)}\n\n"
            f"{t('h_money')}\n   " + t('h_money_l', **{k: (fmt_(v) if isinstance(v, float) else v) for k, v in st.items() if k != 'per'}).replace("\n", "\n   ") + "\n\n"
            f"{t('h_period')}\n{row('p_new', 'new')}\n{row('p_active', 'active')}\n{row('p_dep', 'dep')}\n{row('p_bets', 'bets')}\n{row('p_wins', 'wins')}\n"
            f"   {t('p_profit'):<9} {prof}\n{row('p_tx', 'tx')}\n\n{t('h_recent')}\n{rec}\n━━━━━━━━━━━━━━━━━━")


ROLE_LVL = {"support": 1, "admin": 2, "owner": 3}


def role_of(uid: int) -> str:
    if uid in ADMIN_IDS:
        return "owner"
    return store.d.get("roles", {}).get(str(uid), "")


def is_adm(uid: int) -> bool:
    return bool(role_of(uid))


def can(uid: int, need: str) -> bool:
    return ROLE_LVL.get(role_of(uid), 0) >= ROLE_LVL[need]


def set_alang(uid: int) -> None:
    LANG.set(store.d.get("adm_lang", {}).get(str(uid), "uz"))


# eski admin tugmalari uchun kerakli huquq (qolganlari — "admin")
PERM_SUPPORT = {"home", "stats", "chart", "users", "find", "topbal", "deps", "ga", "gh", "ban"}
PERM_OWNER = {"set", "rst", "rtp", "maint", "subs", "subadd", "subtog", "chset", "chdel", "depset"}
PERM_OWNER_P = ("sv:", "gt:", "rq:", "rok:", "subdel:")


def need_for(act: str) -> str:
    if act in PERM_SUPPORT:
        return "support"
    if act in PERM_OWNER or act.startswith(PERM_OWNER_P):
        return "owner"
    return "admin"


@dp.message(Command("admin"))
async def cmd_admin(message: Message) -> None:
    uid = message.from_user.id if message.from_user else 0
    if not is_adm(uid):
        await message.answer(f"You are not an admin. ID: <code>{uid}</code>\n(add it to ADMIN_IDS in .env)")
        return
    ADMIN_WAIT.pop(uid, None)
    set_alang(uid)
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


async def admin_adjust(bot: Bot, admin_id: int, who: str, amount: float, sign: int, reason: str = "") -> str:
    f = find_user_any(who)
    if not f or not amount or amount <= 0:
        return "❌ User not found (they must open the app once) or bad amount"
    uid, u = f
    val = round(amount * sign, 2)
    async with store.lock:
        if not W.user(int(uid)):
            W.ensure_user(int(uid), u.get("name", ""), u.get("username", ""), legacy_bal=float(u.get("bal", 0) or 0) if not u.get("w_mig") else None)
            u["w_mig"] = 1
        push_reward(uid, {"kind": "gram", "p": val, "from": "Admin", "src": "admin", "reason": reason}, admin=admin_id)
        W.log(admin_id, "balance_add" if sign > 0 else "balance_sub", uid, f"{val:+g} TON · {reason}")
        u["adm"] = round(u.get("adm", 0) + val, 2)
        store.d.setdefault("admin_log", []).insert(0, {"uid": int(uid), "amount": val, "by": admin_id, "t": int(time.time())})
        del store.d["admin_log"][2000:]
        store.save()
    try:
        if sign > 0:
            await bot.send_message(int(uid), f"✅ Balansingiz to'ldirildi: <b>+{amount:g} TON</b>\n✅ Ваш баланс пополнен: <b>+{amount:g} TON</b>")
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
        cb = W.balance(int(uid))
        if cb > 0:
            W.credit(int(uid), -cb, "admin", "Admin: balance set to 0", src="admin", admin=message.from_user.id)
        W.log(message.from_user.id, "balance_zero", uid, f"-{cb:g} TON")
        await message.reply(f"🧹 Balance → 0 for {who(uid, u)}")
    elif kind in ("ban", "unban"):
        async with store.lock:
            u["banned"] = kind == "ban"
            W.set_status(int(uid), "banned" if kind == "ban" else "active")
            W.log(message.from_user.id, kind, uid, " ".join(rest)[:100])
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


async def redeem_bonus(message: Message, code: str, user=None) -> None:
    user = user or message.from_user
    uid = str(user.id)
    async with store.lock:
        b = store.d.get("bonus", {}).get(code)
        if not b:
            await message.answer("❌ Bu bonus link yaroqsiz.\n❌ Эта бонус-ссылка недействительна.")
            return
        if uid in b["claimed"]:
            await message.answer("ℹ️ Siz bu bonusni allaqachon olgansiz.\nℹ️ Вы уже получили этот бонус.")
            return
        if b["left"] <= 0:
            await message.answer("⌛ Bu bonus link tugagan.\n⌛ Эта бонус-ссылка закончилась.")
            return
        b["left"] -= 1
        b["claimed"].append(uid)
        u = store.d["users"].setdefault(uid, {"points": 0, "pvp": 0, "name": clean_name({"username": user.username, "first_name": user.first_name})})
        u.setdefault("joined", int(time.time()))
        push_reward(uid, {"kind": "gram", "p": b["amount"], "from": "Bonus", "src": "bonus"})
        store.save()
    await message.answer(f"🎁 Bonus faollashdi: <b>+{b['amount']:g} TON</b> balansingizga qo'shildi.\n🎁 Бонус активирован: <b>+{b['amount']:g} TON</b> зачислено на баланс.")


def set_kb() -> InlineKeyboardMarkup:
    B = InlineKeyboardButton
    off = cfg("off")
    rows = [[B(text=f"💱 1 TON = {cfg('ton_rate'):g}", callback_data="ad:sv:ton_rate"), B(text=f"⭐ 1 Star = {cfg('stars_rate'):g}", callback_data="ad:sv:stars_rate")],
            [B(text=f"🤖 Bots: {'ON' if cfg('live_bots') else 'OFF'} ({cfg('live_bots'):g})", callback_data="ad:sv:live_bots"), B(text=f"🤖 Bot bet: {cfg('bot_min'):g}–{cfg('bot_max'):g}", callback_data="ad:sv:bot_rng")],
            [ B(text=f"🚀 Rocket bots: {cfg('rk_min')}–{cfg('rk_max')}", callback_data="ad:sv:rk")],
            [B(text=(f"🐸 Rocket Pepe from {cfg('rk_pepe_min'):g} TON" if cfg("rk_pepe_min") else "🐸 Rocket Pepe: OFF (TON)"), callback_data="ad:sv:rk_pepe_min")],
            [B(text=f"🤝 Referral: {cfg('ref_pct'):g}% of deposits", callback_data="ad:sv:ref_pct")],
            [B(text=f"🎟 Ref tickets: {cfg('ref_tix'):g}", callback_data="ad:sv:ref_tix"), B(text=f"📅 Max/day: {cfg('ref_tix_day'):g}", callback_data="ad:sv:ref_tix_day")],
            [B(text=("🟢 Bots always play" if cfg("bots_always") else "⚪ Bots only with players"), callback_data="ad:botal")],
            [B(text=("🔴 Maintenance ON — tap to turn off" if cfg("maint") else "🟢 Maintenance OFF — tap to turn on"), callback_data="ad:maint")]]
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
            W.zero_all(admin=0)
        if kind == "all":
            W.wipe_items(admin=0)
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
    W.log(0, "reset_" + kind)
    return {"bal": "✅ All balances are now 0 (server database).", "pts": "✅ Leaderboard points reset.", "all": "✅ Full reset done."}[kind]


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


def subs_text() -> str:
    l = cfg("subs")
    st = "✅ <b>ON</b>" if cfg("subs_on") else "⏸ <b>OFF</b>"
    rows = "\n".join(f"{i + 1}. <b>{c.get('title', '')}</b> — <code>{c['id']}</code>\n    {c.get('url', '')}" for i, c in enumerate(l)) or "No channels yet."
    return (f"📢 <b>Required subscription</b> · {st}\n\n{rows}\n\n"
            "Players must join every channel here before they can use the bot and the app "
            "(admins are never blocked).\n⚠️ Add the bot to each channel as <b>admin</b> first — otherwise it can't check members.")


def subs_kb() -> InlineKeyboardMarkup:
    B = InlineKeyboardButton
    rows = [[B(text=f"🗑 {c.get('title', c['id'])[:30]}", callback_data=f"ad:subdel:{i}")] for i, c in enumerate(cfg("subs"))]
    rows.append([B(text="➕ Add channel", callback_data="ad:subadd"),
                 B(text=("⏸ Turn OFF" if cfg("subs_on") else "✅ Turn ON"), callback_data="ad:subtog")])
    return InlineKeyboardMarkup(inline_keyboard=rows + back_kb().inline_keyboard)


def chat_ref(raw: str) -> str | None:
    """@kanal, t.me/kanal, -100… ID → get_chat uchun identifikator."""
    raw = (raw or "").strip()
    m = _re.search(r"(?:t\.me/|telegram\.me/|@)([A-Za-z0-9_]{4,})", raw)
    if m and "+" not in raw and "joinchat" not in raw:
        return "@" + m.group(1)
    if _re.fullmatch(r"-100\d{5,}", raw):
        return raw
    return None


async def chan_report(bot: Bot, cid) -> tuple[bool, object, list]:
    """Kanalni tekshiradi: topildimi, bot adminmi, post yoza oladimi. (ok, chat, qatorlar)"""
    try:
        chat = await bot.get_chat(cid)
    except Exception as e:  # noqa: BLE001
        log.info("get_chat(%s): %s", cid, e)
        return False, None, [f"❌ Channel not found: <code>{_html.escape(str(cid))}</code>",
                             "→ Check the @username. For a private channel: add the bot as admin, then forward any post from it here."]
    title = _html.escape(chat.title or str(cid))
    lines = [f"✅ Channel found: <b>{title}</b>" + (f" (@{chat.username})" if chat.username else " (private)")]
    try:
        lines.append(f"👥 Subscribers: <b>{await bot.get_chat_member_count(chat.id)}</b>")
    except Exception:  # noqa: BLE001
        pass
    me = await bot.get_me()
    try:
        mem = await bot.get_chat_member(chat.id, me.id)
        st = getattr(mem, "status", "")
    except Exception:  # noqa: BLE001
        mem, st = None, ""
    if st not in ("administrator", "creator"):
        lines += ["❌ The bot is NOT an admin of this channel",
                  f"→ Channel → Administrators → Add admin → @{me.username} → turn on “Post messages” → then press ✅ Check admin"]
        return False, chat, lines
    lines.append("✅ The bot is an admin")
    can_post = st == "creator" or chat.type != "channel" or bool(getattr(mem, "can_post_messages", False))
    lines.append(("✅" if can_post else "❌") + " Post messages")
    lines.append(("✅" if getattr(mem, "can_edit_messages", False) else "⚪") + " Edit messages")
    lines.append(("✅" if getattr(mem, "can_delete_messages", False) else "⚪") + " Delete messages")
    if not chat.username:
        lines.append(("✅" if getattr(mem, "can_invite_users", False) else "⚠️") + " Invite users (needed for a private channel link)")
    if not can_post:
        lines.append("→ Turn on “Post messages” for the bot in the channel admin settings, then press ✅ Check admin")
    return can_post, chat, lines


async def chan_link(bot: Bot, chat) -> str:
    if chat.username:
        return f"https://t.me/{chat.username}"
    if getattr(chat, "invite_link", None):
        return chat.invite_link
    try:
        return await bot.export_chat_invite_link(chat.id)
    except Exception:  # noqa: BLE001
        return ""


async def chan_connect(bot: Bot, raw) -> tuple[bool, str]:
    cid = raw if isinstance(raw, int) else chat_ref(str(raw))
    if cid is None:
        return False, "❌ Send <code>@channel</code>, <code>https://t.me/channel</code> or a <code>-100…</code> ID — or forward any post from the channel."
    ok_, chat, lines = await chan_report(bot, cid)
    if chat is None:
        return False, "\n".join(lines)
    url = await chan_link(bot, chat)
    async with store.lock:
        c = store.d.setdefault("cfg", {})
        c["ch_id"] = str(chat.id)
        c["ch_url"] = url
        store.d["ch_info"] = {"id": str(chat.id), "title": chat.title or "", "ok": ok_, "t": int(time.time())}
        store.save()
    head = "✅ <b>Channel connected</b>" if ok_ else "⚠️ <b>Channel saved, but the bot can't post yet</b>"
    return ok_, head + "\n\n" + "\n".join(lines)


async def subs_add(bot: Bot, raw: str) -> str:
    raw = raw.strip()
    m = _re.search(r"(?:t\.me/|telegram\.me/|@)([A-Za-z0-9_]{4,})", raw)
    if m and "+" not in raw and "joinchat" not in raw:
        cid = "@" + m.group(1)
    elif _re.fullmatch(r"-100\d{5,}", raw):
        cid = raw
    else:
        return "❌ Send <code>@channel</code>, <code>https://t.me/channel</code> or <code>-100…</code> ID (for private channels), or forward any post from the channel."
    try:
        chat = await bot.get_chat(cid)
        me = await bot.get_me()
        mem = await bot.get_chat_member(chat.id, me.id)
        if mem.status not in ("administrator", "creator"):
            return f"❌ The bot is not an admin in <b>{chat.title}</b>. Add it as admin and try again."
    except Exception as e:
        return f"❌ Can't access {cid}: {e}\nAdd the bot to the channel as admin first."
    url = f"https://t.me/{chat.username}" if chat.username else (chat.invite_link or "")
    if not url:
        try:
            url = await bot.export_chat_invite_link(chat.id)
        except Exception:
            url = ""
    entry = {"id": chat.username and "@" + chat.username or chat.id, "title": chat.title or cid, "url": url}
    async with store.lock:
        l = [c for c in cfg("subs") if str(c["id"]) != str(entry["id"])] + [entry]
        store.d.setdefault("cfg", {})["subs"] = l[:10]
        store.save()
    SUB_CACHE.clear()
    return f"✅ Added: <b>{entry['title']}</b>"


@dp.callback_query(F.data.startswith("ad:"))
async def on_admin_cb(cq: CallbackQuery, bot: Bot) -> None:
    uid = cq.from_user.id
    if not is_adm(uid):
        await cq.answer("Not an admin", show_alert=True)
        return
    set_alang(uid)
    act = cq.data[3:]
    if not can(uid, need_for(act)):
        await cq.answer(t("no_perm"), show_alert=True)
        return
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
        a = dep_addr()
        await edit("<b>💳 Last deposits</b>\n" + ("\n".join(lines) or "—") + "\n\n💎 TON wallet: " + (f"<code>{a}</code>" if a else "⚠️ not set — TON deposits are off"),
                   reply_markup=InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="💎 Set TON wallet" if not a else "💎 Change TON wallet", callback_data="ad:depset")]] + back_kb().inline_keyboard))
    elif act == "find":
        ADMIN_WAIT[uid] = "find"
        await edit("🔎 Send player ID or @username", reply_markup=back_kb())
    elif act == "bc":
        ADMIN_WAIT[uid] = "bc"
        await edit("📢 Send the broadcast text (HTML allowed). It goes to all players.", reply_markup=back_kb())
    elif act == "set":
        await edit("⚙️ <b>Settings</b>\nTap a value to change it. Game buttons turn a game on/off for everyone.", reply_markup=set_kb())
    elif act == "botal":
        store.d.setdefault("cfg", {})["bots_always"] = 0.0 if cfg("bots_always") else 1.0; store.save()
        await edit("⚙️ <b>Settings</b>", reply_markup=set_kb())
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
                "bot_max": "max bot bet, e.g. <code>1000</code>", "bot_rng": "bot bet range as <code>min max</code>, e.g. <code>0.1 1000</code>",
                "live_bots": "bots in PvP/TvT: <code>0</code> = off, <code>1</code> = on (Epic: 1 bot per PvP round, 1 per TvT team)", "rk": "rocket bots per round as <code>min max</code>, e.g. <code>3 4</code> (0–8)",
                "post_min": "minimum win to post in the channel, e.g. <code>1000</code>",
                "ab_hours": "auto bonus interval in hours, e.g. <code>1</code> or <code>0.5</code>", "ab_amount": "TON per player, e.g. <code>1000</code>",
                "ab_uses": "how many people, e.g. <code>500</code>",
                "ref_pct": "referral reward in % of each deposit made by invited friends, e.g. <code>10</code> (0–50). <code>0</code> = off",
                "ref_tix": "tickets per invited friend, e.g. <code>5</code>", "ref_tix_day": "max referral tickets per day, e.g. <code>50</code>", "rk_pepe_min": "Rocket: from this bet the win is given as a Plush Pepe gift, e.g. <code>10000</code>. <code>0</code> = off (always TON)", "ds_hour": "hour 0–23 (Tashkent), e.g. <code>21</code>",
                "top_hour": "hour 0–23 (Tashkent), e.g. <code>21</code>",
                "top_dow": "<code>1</code>–<code>7</code> (1 = Du/Пн … 7 = Ya/Вс)",
                "poll_dow": "<code>1</code>–<code>7</code> + hour 0–23 (Tashkent), e.g. <code>3 19</code>"}.get(k, f"{k[4:].capitalize()} RTP in %, e.g. <code>95</code> (50–100)")
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
    elif act == "subs":
        await edit(subs_text(), reply_markup=subs_kb(), disable_web_page_preview=True)
    elif act == "subadd":
        ADMIN_WAIT[uid] = "subadd"
        await edit("➕ <b>Add required channel</b>\n\n1. Add this bot to the channel as <b>admin</b>.\n2. Send here: <code>@channel</code> or <code>https://t.me/channel</code>\n   Private channel: send its <code>-100…</code> ID or <b>forward any post</b> from it.", reply_markup=back_kb())
    elif act == "subtog":
        async with store.lock:
            store.d.setdefault("cfg", {})["subs_on"] = not cfg("subs_on"); store.save()
        SUB_CACHE.clear()
        await edit(subs_text(), reply_markup=subs_kb(), disable_web_page_preview=True)
    elif act.startswith("subdel:"):
        i = int(act[7:])
        async with store.lock:
            l = list(cfg("subs"))
            if 0 <= i < len(l):
                l.pop(i)
            store.d.setdefault("cfg", {})["subs"] = l; store.save()
        SUB_CACHE.clear()
        await edit(subs_text(), reply_markup=subs_kb(), disable_web_page_preview=True)
    elif act == "ch":
        await edit(ch_text(), reply_markup=ch_kb())
    elif act == "chset":
        ADMIN_WAIT[uid] = "chset"
        me = await bot.get_me()
        await edit("➕ <b>Connect channel</b>\n\n1. Add @" + (me.username or "bot") + " to your channel as <b>admin</b> and turn on “Post messages”.\n"
                   "2. Send here <code>@channel</code> or <code>https://t.me/channel</code>.\n"
                   "   Private channel — just <b>forward any post</b> from it here.", reply_markup=back_kb())
    elif act == "chchk":
        if not ch_id():
            await edit(ch_text(), reply_markup=ch_kb()); return
        ok_, chat, lines = await chan_report(bot, ch_id())
        if chat is not None:
            async with store.lock:
                store.d["ch_info"] = {"id": str(ch_id()), "title": chat.title or "", "ok": ok_, "t": int(time.time())}
                if not cfg("ch_url"):
                    store.d.setdefault("cfg", {})["ch_url"] = await chan_link(bot, chat)
                store.save()
        await edit("🔎 <b>Channel check</b>\n\n" + "\n".join(lines) + "\n\n" + ch_text(), reply_markup=ch_kb())
    elif act == "chdel":
        async with store.lock:
            c = store.d.setdefault("cfg", {})
            c["ch_id"] = "off"; c["ch_url"] = ""
            store.d.pop("ch_info", None); store.save()
        await edit("🗑 Channel disconnected — no more posts.\n\n" + ch_text(), reply_markup=ch_kb())
    elif act == "depset":
        ADMIN_WAIT[uid] = "depset"
        await edit("💎 <b>TON wallet for deposits</b>\nNow: <code>" + (dep_addr() or "—") + "</code>\n\n"
                   "Send your wallet <b>address</b> (UQ… or EQ…, Tonkeeper → Receive). Send <code>-</code> to turn TON deposits off.\n"
                   "⚠️ Only the address — never send the 24 secret words.", reply_markup=back_kb())
    elif act in ("tpt", "plt", "tpf"):
        async with store.lock:
            c = store.d.setdefault("cfg", {})
            if act == "tpf":
                c["top_freq"] = "week" if cfg("top_freq") == "day" else "day"
            else:
                k = "top_on" if act == "tpt" else "poll_on"
                c[k] = not cfg(k)
            store.save()
        await edit(ch_text(), reply_markup=ch_kb())
    elif act == "tpnow":
        txt, png = top_post()
        ok_ = await send_chat(bot, ch_id() or uid, txt, png, play_kb())
        await edit(("✅ Posted." if ok_ else "❌ Not posted.") + "\n\n" + ch_text(), reply_markup=ch_kb())
    elif act in ("abt", "dst"):
        k = "ab_on" if act == "abt" else "ds_on"
        async with store.lock:
            store.d.setdefault("cfg", {})[k] = not cfg(k)
            if k == "ab_on" and cfg(k):
                store.d["ab_last"] = 0   # yoqilganda darhol birinchi post
            store.save()
        await edit(ch_text(), reply_markup=ch_kb())
    elif act == "abnow":
        code = await auto_bonus(bot) if ch_id() else ""
        await edit((f"✅ Posted bonus link <code>{code}</code>" if code else "❌ Not posted — connect a channel and press ✅ Check admin.") + "\n\n" + ch_text(), reply_markup=ch_kb())
    elif act == "abprev":
        await auto_bonus(bot, chat=uid)
        await edit("👀 Preview sent to you (a real link with the current settings).\n\n" + ch_text(), reply_markup=ch_kb())
    elif act == "dsnow":
        txt, png = daily_summary()
        okk = await send_chat(bot, ch_id() or uid, txt, png, play_kb())
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
                   ("" if ch_id() else "\n⚠️ Connect a channel: 📣 Channel & posts → ➕ Connect channel."), reply_markup=set_kb())
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


@dp.message(F.chat.type == "private", lambda m: m.from_user and ADMIN_WAIT.get(m.from_user.id) in ("subadd", "chset") and getattr(getattr(m, "forward_origin", None), "chat", None))
async def on_admin_sub_fwd(message: Message, bot: Bot) -> None:
    """Admin kanal postini forward qildi — kanal ID'sini shundan olamiz (yopiq kanallar uchun)."""
    set_alang(message.from_user.id)
    mode = ADMIN_WAIT.pop(message.from_user.id, None)
    if mode == "chset":
        ok_, r = await chan_connect(bot, message.forward_origin.chat.id)
        if r.startswith("❌"):
            ADMIN_WAIT[message.from_user.id] = "chset"
            await message.answer(r, reply_markup=back_kb())
        else:
            await message.answer(r + "\n\n" + ch_text(), reply_markup=ch_kb(), disable_web_page_preview=True)
        return
    r = await subs_add(bot, str(message.forward_origin.chat.id))
    if r.startswith("❌"):
        ADMIN_WAIT[message.from_user.id] = "subadd"
        await message.answer(r, reply_markup=back_kb())
    else:
        await message.answer(r + "\n\n" + subs_text(), reply_markup=subs_kb(), disable_web_page_preview=True)


@dp.message(F.chat.type == "private", F.text, lambda m: m.from_user and m.from_user.id in ADMIN_WAIT and not (m.text or "").startswith("/"))
async def on_admin_input(message: Message, bot: Bot) -> None:
    uid = message.from_user.id
    set_alang(uid)
    act = ADMIN_WAIT.pop(uid, "")
    if act.startswith("a2"):
        await a2_input(message, bot, act)
        return
    parts = message.text.split()
    if act == "chset":
        ok_, r = await chan_connect(bot, message.text)
        if r.startswith("❌"):
            ADMIN_WAIT[uid] = act
            await message.answer(r, reply_markup=back_kb())
        else:
            await message.answer(r + "\n\n" + ch_text(), reply_markup=ch_kb(), disable_web_page_preview=True)
        return
    if act == "depset":
        a = message.text.strip()
        if a != "-" and not _re.fullmatch(r"[A-Za-z0-9_-]{48}|-?\d:[0-9a-fA-F]{64}", a):
            ADMIN_WAIT[uid] = act
            await message.answer("❌ This is not a TON address. Tonkeeper → Receive → copy the address (UQ… or EQ…, 48 characters).", reply_markup=back_kb())
            return
        async with store.lock:
            store.d.setdefault("cfg", {})["dep_addr"] = "off" if a == "-" else a; store.save()
        await message.answer(("✅ TON wallet saved — deposits are checked on this address." if a != "-" else "✅ TON deposits turned off."), reply_markup=admin_kb())
        return
    if act == "subadd":
        r = await subs_add(bot, message.text)
        if r.startswith("❌"):
            ADMIN_WAIT[uid] = act
            await message.answer(r, reply_markup=back_kb())
        else:
            await message.answer(r + "\n\n" + subs_text(), reply_markup=subs_kb(), disable_web_page_preview=True)
        return
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
            await bot.send_poll(ch_id() or uid, q[:300], [o[:100] for o in opts], is_anonymous=True)
            await message.answer("✅ Poll posted.", reply_markup=ch_kb())
        except Exception as e:  # noqa: BLE001
            await message.answer(f"❌ {e}", reply_markup=ch_kb())
    elif act == "img":
        xs = [x.strip() for x in message.text.split("|")]
        png = card_png(xs[0], xs[1] if len(xs) > 1 else "")
        cap = f"<b>{xs[0]}</b>" + (f"\n\n{xs[1]}" if len(xs) > 1 and xs[1] else "")
        okk = await send_chat(bot, ch_id() or uid, cap, png, play_kb())
        await message.answer("✅ Posted." if okk else "❌ Not posted — connect a channel and press ✅ Check admin.", reply_markup=ch_kb())
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
            elif k in ("ds_hour", "top_hour"):
                v = int(parts[0])
                if not 0 <= v <= 23:
                    raise ValueError
                upd = {k: float(v)}
            elif k == "top_dow":
                v = int(parts[0])
                if not 1 <= v <= 7:
                    raise ValueError
                upd = {k: float(v - 1)}
            elif k == "poll_dow":
                v, h = int(parts[0]), int(parts[1]) if len(parts) > 1 else int(cfg("poll_hour"))
                if not (1 <= v <= 7 and 0 <= h <= 23):
                    raise ValueError
                upd = {"poll_dow": float(v - 1), "poll_hour": float(h)}
            elif k == "bot_rng":
                lo, hi = (parse_amount(x) for x in parts[:2]) if len(parts) >= 2 else (None, None)
                if lo is None or hi is None or lo <= 0 or hi < lo:
                    raise ValueError
                upd = {"bot_min": float(lo), "bot_max": float(hi)}
            elif k == "live_bots":
                v = parse_amount(parts[0]) if parts else None
                if v is None or v < 0 or v > 1:
                    raise ValueError
                upd = {"live_bots": float(int(v))}
            elif k in ("ref_pct", "ref_tix", "ref_tix_day"):
                v = parse_amount(parts[0]) if parts else None
                if v is None or v < 0 or (k == "ref_pct" and v > 50):
                    raise ValueError
                upd = {k: float(v)}
            elif k == "rk_pepe_min":
                v = parse_amount(parts[0]) if parts else None
                if v is None or v < 0:
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
                cb = W.balance(int(k))
                if cb > 0:
                    W.credit(int(k), -cb, "admin", "Admin: balance set to 0", src="admin", admin=uid)
                W.log(uid, "balance_zero", k, f"-{cb:g} TON")
                txt = f"✅ Balance of <b>{v.get('name', k)}</b> (<code>{k}</code>) is now 0."
            else:
                v["banned"] = not v.get("banned")
                W.set_status(int(k), "banned" if v["banned"] else "active")
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
                await bot.send_message(int(k), message.html_text)   # oddiy matn — tugmasiz
                n += 1
                await asyncio.sleep(0.05)
            except Exception:  # noqa: BLE001
                pass
        await message.answer(f"📢 Sent to <b>{n}</b> players.", reply_markup=admin_kb())


@dp.message(F.chat.type == "private", F.photo, lambda m: m.from_user and ADMIN_WAIT.get(m.from_user.id) == "img")
async def on_admin_photo(message: Message, bot: Bot) -> None:
    ADMIN_WAIT.pop(message.from_user.id, None)
    try:
        await bot.send_photo(ch_id() or message.from_user.id, message.photo[-1].file_id, caption=message.html_text or None, reply_markup=play_kb())
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
    lg = ulang(message.from_user)
    await message.answer("Ilovani ochish uchun tugmani bosing 👇" if lg == "uz" else "Tap the button to open the app 👇", reply_markup=main_kb("", lg))


async def on_startup(bot: Bot) -> None:
    await bot.set_my_commands([
        BotCommand(command="start", description="Start"),
        BotCommand(command="app", description="Open the app"),
        BotCommand(command="ref", description="Referral link"),
        BotCommand(command="lang", description="Language / Til"),
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
    try:
        await bot.delete_webhook(drop_pending_updates=False)   # webhook qolgan bo'lsa polling ishlamaydi
    except Exception as e:  # noqa: BLE001
        log.info("delete_webhook: %s", e)
    me = await bot.get_me()
    bot_ref["uname"] = me.username
    await bot.set_chat_menu_button(menu_button=MenuButtonWebApp(text=BRAND, web_app=WebAppInfo(url=webapp_url())))
    log.info("RIKI v%s", BOT_VERSION); log.info("Bot: @%s | Mini App: %s | API: http://%s:%s | adminlar: %s", me.username, WEBAPP_URL, API_HOST, API_PORT, ADMIN_IDS or "yo'q")



# ================================================================ ADMIN PANEL v2 — foydalanuvchilar, balans, tranzaksiyalar, reyting, o'yinlar, e'lonlar, audit, rollar
START_TS = time.time()
GAME_NAMES = ["dice", "mines", "plinko", "spins", "upgrade", "crafts", "cases", "daily", "rocket", "pvp", "tvt", "roulette"]
PER_MS = {"day": 86400_000, "week": 7 * 86400_000, "month": 30 * 86400_000, "all": 0}
TX_TYPES = ["all", "deposit", "withdraw", "bet", "win", "admin", "bonus", "sell", "transfer_in", "transfer_out", "refund"]


def _ago(ts_s: float | None) -> str:
    if not ts_s:
        return "—"
    return time.strftime("%d.%m.%Y %H:%M", time.localtime(ts_s))


def _num(v) -> str:
    return f"{v:,.2f}".replace(",", " ").rstrip("0").rstrip(".") if isinstance(v, float) else str(v)


def _kb(rows) -> InlineKeyboardMarkup:
    B = InlineKeyboardButton
    out = []
    for r in rows:
        out.append([B(text=x[0], callback_data=x[1]) if isinstance(x[1], str) else B(text=x[0], **x[1]) for x in r])
    return InlineKeyboardMarkup(inline_keyboard=out)


def _back_row(cb="ad:home"):
    return [(t("back"), cb)]


def a2_user_card(uid: int) -> tuple[str, InlineKeyboardMarkup]:
    u = W.user(uid)
    if not u:
        return t("not_found"), _kb([_back_row()])
    su = store.d["users"].get(str(uid), {})
    last = W.history(uid, 1)
    items = W.items(uid)
    plays = W.db.execute("SELECT COUNT(*) FROM plays WHERE uid=?", (uid,)).fetchone()[0]
    dep = to_t(W.db.execute("SELECT COALESCE(SUM(delta),0) FROM tx WHERE uid=? AND type='deposit'", (uid,)).fetchone()[0])
    rank = W.rank(uid)
    txt = t("uc", name=u["name"] or su.get("name", "Player"), un=("@" + u["username"]) if u["username"] else "", id=uid,
            status=t("st_banned") if u["status"] == "banned" else t("st_active"), bal=_num(to_t(u["bal"])),
            prev=_num(to_t(last[0]["prev"])) if last else "—", rank=f"#{rank}" if rank else t("no_rank"),
            ni=len(items), iv=_num(round(sum(x["v"] for x in items), 2)), turn=_num(to_t(u["turnover"])), plays=plays, dep=_num(dep),
            created=_ago(u["created"]), seen=_ago(u["seen"]), lang=u["lang"] or "uz")
    ban = (t("uc_unban"), f"a2:ub:{uid}") if u["status"] == "banned" else (t("uc_ban"), f"a2:ub:{uid}")
    kb = _kb([[(t("uc_add"), f"a2:ua:{uid}"), (t("uc_sub"), f"a2:us:{uid}"), (t("uc_zero"), f"a2:uz:{uid}")],
              [(t("uc_tx"), f"a2:ut:{uid}"), (t("uc_games"), f"a2:ug:{uid}"), (t("uc_items"), f"a2:ui:{uid}")],
              [ban, (t("uc_csv"), f"a2:ux:{uid}"), (t("refresh"), f"a2:uc:{uid}")], _back_row("a2:ul:seen:0")])
    return txt, kb


def _tx_line(r) -> str:
    nm = store.d["users"].get(str(r["uid"]), {}).get("name", r["uid"])
    adm = f" 👮{r['admin']}" if r.get("admin") else ""
    return (f"<code>{time.strftime('%d.%m %H:%M', time.localtime(r['ts'] / 1000))}</code> {nm} · {ty(r['type'])}"
            f"{(' ' + r['game']) if r['game'] else ''} <b>{to_t(r['delta']):+g}</b> → {to_t(r['new']):g}{adm}"
            + (f"\n      <i>{r['reason'][:60]}</i>" if r["type"] in ("admin", "bonus", "transfer_in", "transfer_out") and r["reason"] else ""))


async def a2_apply_adjust(bot: Bot, admin: int, uid: int, amount: float, reason: str) -> str:
    u = W.user(uid)
    if not u:
        return t("not_found")
    su = store.d["users"].setdefault(str(uid), {"points": 0, "pvp": 0})
    try:
        r = W.credit(uid, amount, "admin", f"{reason} (admin {admin})", src="admin", admin=admin, idem=f"adm:{admin}:{uuid.uuid4().hex[:8]}")
    except WalletError as e:
        return t("error", e=e)
    W.log(admin, "balance_add" if amount > 0 else "balance_sub", str(uid), f"{amount:+g} TON · {reason}")
    async with store.lock:
        su["bal"] = r["bal"]
        store.d["rewards"].setdefault(str(uid), []).append({"id": uuid.uuid4().hex[:10], "kind": "gram", "p": r["delta"], "from": "Admin", "paid": 1})
        store.save()
    try:
        await bot.send_message(uid, (f"💎 +{r['delta']:g} TON" if amount > 0 else f"💎 {r['delta']:g} TON") + f"\n{reason}")
    except Exception:  # noqa: BLE001
        pass
    return t("adj_ok", name=u["name"] or uid, delta=r["delta"], prev=_num(r["prev"]), new=_num(r["bal"]), reason=reason)


@dp.callback_query(F.data.startswith("a2:"))
async def on_admin2(cq: CallbackQuery, bot: Bot) -> None:
    uid = cq.from_user.id
    if not is_adm(uid):
        await cq.answer("Not an admin", show_alert=True)
        return
    set_alang(uid)
    a = cq.data[3:].split(":")
    act = a[0]
    need = {"rl": "owner", "rl+": "owner", "rl-": "owner", "ua": "admin", "us": "admin", "uz": "admin", "bal": "admin", "an": "admin",
            "an+": "admin", "ane": "admin", "anu": "admin", "anr": "admin", "ans": "admin", "and": "admin", "gmt": "owner", "bk": "owner",
            "aud": "admin", "ux": "admin", "txx": "admin"}.get(act, "support")
    if not can(uid, need):
        await cq.answer(t("no_perm"), show_alert=True)
        return
    await cq.answer()

    async def edit(text, kb=None):
        try:
            await cq.message.edit_text(text, reply_markup=kb or _kb([_back_row()]), disable_web_page_preview=True)
        except Exception:  # noqa: BLE001
            await cq.message.answer(text, reply_markup=kb or _kb([_back_row()]), disable_web_page_preview=True)

    if act == "lang":
        d = store.d.setdefault("adm_lang", {})
        d[str(uid)] = "ru" if d.get(str(uid), "uz") == "uz" else "uz"
        store.save(); set_alang(uid)
        await edit(admin_home_text(), admin_kb())
    elif act == "dash":
        await edit(admin_home_text(), _kb([[(t("refresh"), "a2:dash"), (t("m_sys"), "a2:sys")], _back_row()]))
    elif act in ("sys", "bk"):
        extra = ""
        if act == "bk":
            extra = "\n\n" + t("sys_backup_ok", f=os.path.basename(W.backup(BACKUP_DIR, keep=28)))
            W.log(uid, "backup")
        bks = sorted(f for f in os.listdir(BACKUP_DIR) if f.endswith(".db")) if os.path.isdir(BACKUP_DIR) else []
        up = int(time.time() - START_TS)
        live = " · ".join(f"{g}:{LIVE[g]['phase']}" for g in LIVE)
        txt = t("sys_title") + "\n" + t("sys_body", up=f"{up // 86400}d {up % 86400 // 3600}h {up % 3600 // 60}m", db=os.path.basename(DB_FILE),
                                        dbsize=f"{os.path.getsize(DB_FILE) / 1e6:.1f} MB" if os.path.exists(DB_FILE) else "?", nb=len(bks),
                                        last=bks[-1][5:20] if bks else "—", api=API_PUBLIC.get("url") or "—", cat=_ago(CATALOG.ts), ng=len(CATALOG.gifts),
                                        live=live, maint="ON" if cfg("maint") else "off", off=", ".join(cfg("off")) or "—") + extra
        await edit(txt, _kb([[(t("sys_backup"), "a2:bk"), (t("refresh"), "a2:sys")], _back_row()]))
    elif act == "ul":
        order, off = a[1], int(a[2])
        us = W.users_page(off, 12, order)
        rows = [[(f"{'🚫' if x['status'] == 'banned' else '👤'} {x['name'] or x['id']} · {_num(to_t(x['bal']))}", f"a2:uc:{x['id']}")] for x in us]
        nav = []
        if off:
            nav.append((t("prev"), f"a2:ul:{order}:{max(0, off - 12)}"))
        if len(us) == 12:
            nav.append((t("next"), f"a2:ul:{order}:{off + 12}"))
        sort = [(("• " if order == k else "") + t("ord_" + k), f"a2:ul:{k}:0") for k in ("seen", "bal", "new")]
        await edit(t("users_title", order=t("ord_" + order), a=off + 1, b=off + len(us)), _kb(rows + ([nav] if nav else []) + [sort, [(t("m_find"), "a2:find")], _back_row()]))
    elif act == "find":
        ADMIN_WAIT[uid] = "a2find"
        await edit(t("find_ask"))
    elif act == "uc":
        txt, kb = a2_user_card(int(a[1]))
        await edit(txt, kb)
    elif act in ("ua", "us"):
        u = W.user(int(a[1])) or {}
        ADMIN_WAIT[uid] = f"a2adj:{'+' if act == 'ua' else '-'}:{a[1]}"
        await edit(t("adj_ask", sign="➕" if act == "ua" else "➖", name=u.get("name", ""), id=a[1], bal=_num(W.balance(int(a[1])))), _kb([_back_row(f"a2:uc:{a[1]}")]))
    elif act == "uz":
        tu = int(a[1]); cb = W.balance(tu)
        if cb > 0:
            W.credit(tu, -cb, "admin", f"Balance set to 0 (admin {uid})", src="admin", admin=uid)
        W.log(uid, "balance_zero", str(tu), f"-{cb:g} TON")
        txt, kb = a2_user_card(tu)
        await edit(t("zero_ok", v=_num(cb)) + "\n\n" + txt, kb)
    elif act == "ub":
        tu = int(a[1]); u = W.user(tu) or {}
        ban = u.get("status") != "banned"
        W.set_status(tu, "banned" if ban else "active")
        async with store.lock:
            store.d["users"].setdefault(str(tu), {"points": 0, "pvp": 0})["banned"] = ban; store.save()
        W.log(uid, "ban" if ban else "unban", str(tu))
        try:
            await bot.send_message(tu, "🚫 Your account has been blocked." if ban else "✅ Your account has been unblocked.")
        except Exception:  # noqa: BLE001
            pass
        txt, kb = a2_user_card(tu)
        await edit((t("ban_ok") if ban else t("unban_ok")) + "\n\n" + txt, kb)
    elif act == "ut":
        tu = int(a[1]); rows = W.history(tu, 25)
        await edit(f"📜 <b>{(W.user(tu) or {}).get('name', tu)}</b>\n" + ("\n".join(_tx_line(r) for r in rows) or t("tx_none")), _kb([_back_row(f"a2:uc:{tu}")]))
    elif act == "ug":
        tu = int(a[1]); h = G.history(tu, None, 20)
        lines = [f"<code>{time.strftime('%d.%m %H:%M', time.localtime(x['t'] / 1000))}</code> {x['game']} · {x['bet']:g} → <b>{x['pay']:g}</b>" + (f" (x{x['mult']:g})" if x["mult"] else "") for x in h]
        await edit(t("gm_hist", name=(W.user(tu) or {}).get("name", tu)) + "\n" + ("\n".join(lines) or "—"), _kb([_back_row(f"a2:uc:{tu}")]))
    elif act == "ui":
        tu = int(a[1]); its = W.items(tu)
        lines = [f"• {CATALOG.by_sh.get(x['sh'], {}).get('n', x.get('nm') or x['sh'])}{(' · ' + x['m']) if x.get('m') else ''} — {x['v']:g}" for x in its[:40]]
        await edit(t("items_title", name=(W.user(tu) or {}).get("name", tu), n=len(its)) + "\n" + ("\n".join(lines) or "—"), _kb([_back_row(f"a2:uc:{tu}")]))
    elif act == "ux":
        tu = int(a[1]); path = os.path.join(BACKUP_DIR, f"tx_{tu}.csv"); os.makedirs(BACKUP_DIR, exist_ok=True)
        n = W.export_csv(path, 0, tu)
        await bot.send_document(uid, FSInputFile(path, filename=f"riki_tx_{tu}.csv"), caption=t("tx_exported", n=n))
        W.log(uid, "export", str(tu), f"{n} rows")
    elif act == "bal":
        ADMIN_WAIT[uid] = "a2bal"
        await edit(t("bal_ask"))
    elif act in ("tx", "txx"):
        typ, per, off = a[1], a[2], int(a[3]) if len(a) > 3 else 0
        since = int(time.time() * 1000) - PER_MS[per] if PER_MS[per] else 0
        if act == "txx":
            path = os.path.join(BACKUP_DIR, "tx_export.csv"); os.makedirs(BACKUP_DIR, exist_ok=True)
            n = W.export_csv(path, since, None, None if typ == "all" else typ)
            await bot.send_document(uid, FSInputFile(path, filename=f"riki_tx_{typ}_{per}.csv"), caption=t("tx_exported", n=n))
            W.log(uid, "export", "", f"{typ}/{per} {n} rows")
            return
        rows = W.history(None, 15 + off, None if typ == "all" else typ, since)[off:]
        types = [(("• " if typ == k else "") + (t("tx_all") if k == "all" else ty(k)), f"a2:tx:{k}:{per}:0") for k in TX_TYPES]
        pers = [(("• " if per == k else "") + t("per_" + k), f"a2:tx:{typ}:{k}:0") for k in ("day", "week", "month", "all")]
        nav = [(t("next"), f"a2:tx:{typ}:{per}:{off + 15}")] if len(rows) == 15 else []
        if off:
            nav.insert(0, (t("prev"), f"a2:tx:{typ}:{per}:{max(0, off - 15)}"))
        kb = _kb([types[i:i + 4] for i in range(0, len(types), 4)] + [pers] + ([nav] if nav else []) +
                 [[(t("tx_user"), "a2:txu"), (t("tx_export"), f"a2:txx:{typ}:{per}")], _back_row()])
        await edit(t("tx_title", typ=t("tx_all") if typ == "all" else ty(typ), per=t("per_" + per)) + "\n\n" + ("\n".join(_tx_line(r) for r in rows) or t("tx_none")), kb)
    elif act == "txu":
        ADMIN_WAIT[uid] = "a2txu"
        await edit(t("find_ask"))
    elif act == "lb":
        off = int(a[1]); rows = W.leaderboard(20, off)
        n = W.db.execute("SELECT COUNT(*) FROM users WHERE bal>0 AND status='active'").fetchone()[0]
        last = W.db.execute("SELECT MAX(ts) FROM tx").fetchone()[0]
        lines = [f"{off + i + 1}. {r['name']} — <b>{_num(r['bal'])}</b>" for i, r in enumerate(rows)]
        nav = []
        if off:
            nav.append((t("prev"), f"a2:lb:{max(0, off - 20)}"))
        if len(rows) == 20:
            nav.append((t("next"), f"a2:lb:{off + 20}"))
        btns = [[(f"{off + i + 1}. {r['name'][:18]}", f"a2:uc:{r['id']}") for i, r in enumerate(rows[j:j + 2], j)] for j in range(0, min(len(rows), 10), 2)]
        await edit(t("lb_title", a=off + 1, b=off + len(rows), n=n) + "\n\n" + ("\n".join(lines) or "—") + "\n\n" + t("lb_sync", t=_ago(last / 1000 if last else None)),
                   _kb(btns + ([nav] if nav else []) + [[(t("lb_zero"), "a2:lbz"), (t("refresh"), f"a2:lb:{off}")], _back_row()]))
    elif act == "lbz":
        z = W.zero_users(40)
        await edit(t("lb_zero_title", n=len(z)) + "\n" + ("\n".join(f"• {x['name'] or x['id']} <code>{x['id']}</code>" for x in z) or "—"), _kb([_back_row("a2:lb:0")]))
    elif act in ("gm", "gmt"):
        per = a[1]
        if act == "gmt":
            g = a[2]
            async with store.lock:
                off_ = list(cfg("off"))
                off_ = [x for x in off_ if x != g] if g in off_ else off_ + [g]
                store.d.setdefault("cfg", {})["off"] = off_; store.save()
            W.log(uid, "game_toggle", g, "off" if g in off_ else "on")
        since = int(time.time() * 1000) - PER_MS[per] if PER_MS[per] else 0
        stats = {x["game"]: x for x in G.game_stats(since)}
        live_tx = {r["game"]: r for r in W.db.execute("SELECT game, -SUM(CASE WHEN type='bet' THEN delta ELSE 0 END) b, SUM(CASE WHEN type='win' THEN delta ELSE 0 END) p, "
                                                      "COUNT(DISTINCT uid) u, SUM(type='bet') n FROM tx WHERE ts>=? AND game IN ('rocket','pvp','tvt','roulette') GROUP BY game", (since,)).fetchall()}
        lines = []
        for g in GAME_NAMES:
            x = stats.get(g)
            if not x and g in live_tx:
                r = live_tx[g]; x = {"n": r["n"], "users": r["u"], "bet": to_t(r["b"] or 0), "pay": to_t(r["p"] or 0)}
                x["rtp"] = round(x["pay"] / x["bet"] * 100, 1) if x["bet"] else 0
            st_ = "❌" if g in cfg("off") else "✅"
            if x:
                lines.append(t("gm_row", st=st_, g=g, n=x["n"], u=x["users"], bet=_num(x["bet"]), pay=_num(x["pay"]), rtp=x["rtp"], pr=round(x["bet"] - x["pay"], 2)))
            else:
                lines.append(f"{st_} <b>{g}</b>: —")
        tg_ = [(("❌ " if g in cfg("off") else "✅ ") + g, f"a2:gmt:{per}:{g}") for g in GAME_NAMES if g != "daily"]
        pers = [(("• " if per == k else "") + t("per_" + k), f"a2:gm:{k}") for k in ("day", "week", "month", "all")]
        await edit(t("gm_title", per=t("per_" + per)) + "\n\n" + "\n".join(lines), _kb([tg_[i:i + 3] for i in range(0, len(tg_), 3)] + [pers, [(t("m_rtp"), "ad:rtp")], _back_row()]))
    elif act == "an":
        l = W.ann_list(10)
        rows = [[(f"#{x['id']} {'📤' if x['sent'] else '📝'} {(x['uz'] or x['ru'])[:30]}", f"a2:ane:{x['id']}")] for x in l]
        await edit(t("ann_title") + "\n\n" + ("" if l else t("ann_none")), _kb(rows + [[(t("ann_new"), "a2:an+")], _back_row()]))
    elif act == "an+":
        ADMIN_WAIT[uid] = "a2an_uz"
        await edit(t("ann_ask_uz"), _kb([_back_row("a2:an")]))
    elif act == "ane":
        x = W.ann_get(int(a[1]))
        if not x:
            await edit(t("not_found"), _kb([_back_row("a2:an")])); return
        sent = t("ann_was_sent", t=_ago(x["sent"] / 1000), n=x["sent_n"]) if x["sent"] else t("ann_not_sent")
        await edit(t("ann_view", id=x["id"], sent=sent, uz=x["uz"] or "—", ru=x["ru"] or "—"),
                   _kb([[(t("ann_send"), f"a2:ans:{x['id']}")], [(t("ann_edit_uz"), f"a2:anu:{x['id']}"), (t("ann_edit_ru"), f"a2:anr:{x['id']}")],
                        [(t("ann_del"), f"a2:and:{x['id']}")], _back_row("a2:an")]))
    elif act in ("anu", "anr"):
        ADMIN_WAIT[uid] = f"a2an_edit:{'uz' if act == 'anu' else 'ru'}:{a[1]}"
        await edit(t("ann_ask_uz") if act == "anu" else t("ann_ask_ru"), _kb([_back_row(f"a2:ane:{a[1]}")]))
    elif act == "and":
        W.ann_del(int(a[1])); W.log(uid, "ann_delete", a[1])
        await edit(t("ann_deleted"), _kb([_back_row("a2:an")]))
    elif act == "ans":
        x = W.ann_get(int(a[1]))
        if not x:
            return
        ids = W.all_user_ids()
        await edit(t("ann_sending", n=len(ids)), _kb([_back_row("a2:an")]))
        ok_n = bad = 0
        for i, (tu, lang) in enumerate(ids):
            txt = (x["ru"] if lang == "ru" and x["ru"] else x["uz"]) or x["ru"]
            try:
                if await send_chat(bot, tu, txt):   # e'lon — oddiy matn, tugmasiz
                    ok_n += 1
                else:
                    bad += 1
            except Exception:  # noqa: BLE001
                bad += 1
            if i % 25 == 24:
                await asyncio.sleep(1)   # Telegram cheklovi: ~30 xabar/soniya
        W.ann_sent(x["id"], ok_n); W.log(uid, "ann_send", str(x["id"]), f"ok {ok_n} / fail {bad}")
        await cq.message.answer(t("ann_done", ok=ok_n, bad=bad), reply_markup=_kb([_back_row("a2:an")]))
    elif act == "aud":
        l = W.audit(30)
        lines = [f"<code>{time.strftime('%d.%m %H:%M', time.localtime(x['ts'] / 1000))}</code> 👮{x['admin']} {x['action']} {x['target'] or ''} {x['detail'] or ''}"[:160] for x in l]
        await edit(t("audit_title", n=len(l)) + "\n\n" + ("\n".join(lines) or "—"), _kb([[(t("refresh"), "a2:aud")], _back_row()]))
    elif act in ("rl", "rl-"):
        if act == "rl-":
            async with store.lock:
                store.d.setdefault("roles", {}).pop(a[1], None); store.save()
            W.log(uid, "role_remove", a[1])
        roles = store.d.get("roles", {})
        lst = "\n".join(f"• <code>{k}</code> {store.d['users'].get(k, {}).get('name', '')} — <b>{v}</b>" for k, v in roles.items()) or "—"
        rows = [[(f"🗑 {k} ({v})", f"a2:rl-:{k}")] for k, v in roles.items()]
        await edit(t("roles_title", owners=", ".join(map(str, ADMIN_IDS)) or "—", list=lst), _kb(rows + [[(t("roles_add"), "a2:rl+")], _back_row()]))
    elif act == "rl+":
        ADMIN_WAIT[uid] = "a2role"
        await edit(t("roles_ask"), _kb([_back_row("a2:rl")]))


async def a2_input(message: Message, bot: Bot, act: str) -> None:
    uid = message.from_user.id
    txt = (message.text or "").strip()
    if act == "a2find" or act == "a2txu":
        res = W.search(txt)
        if not res:
            await message.answer(t("not_found"), reply_markup=_kb([_back_row()])); return
        if act == "a2txu":
            tu = res[0]["id"]; rows = W.history(tu, 25)
            await message.answer(f"📜 <b>{res[0]['name'] or tu}</b>\n" + ("\n".join(_tx_line(r) for r in rows) or t("tx_none")), reply_markup=_kb([_back_row(f"a2:uc:{tu}")]))
            return
        if len(res) == 1:
            c, kb = a2_user_card(res[0]["id"])
            await message.answer(c, reply_markup=kb); return
        await message.answer(t("found_n", n=len(res)), reply_markup=_kb([[(f"👤 {x['name'] or x['id']} · {_num(to_t(x['bal']))}", f"a2:uc:{x['id']}")] for x in res] + [_back_row()]))
    elif act.startswith("a2adj:") or act == "a2bal":
        parts = txt.split(maxsplit=2 if act == "a2bal" else 1)
        if act == "a2bal":
            if len(parts) < 3:
                ADMIN_WAIT[uid] = act; await message.answer(t("adj_need_reason") if len(parts) == 2 else t("bad_format")); return
            f = W.search(parts[0]); amt = parse_amount(parts[1].lstrip("+-")); sign = -1 if parts[1].startswith("-") else 1; reason = parts[2]
            if not f or not amt:
                ADMIN_WAIT[uid] = act; await message.answer(t("not_found") if not f else t("bad_format")); return
            tu = f[0]["id"]
        else:
            _, sg, tu = act.split(":"); tu = int(tu); sign = 1 if sg == "+" else -1
            if len(parts) < 2:
                ADMIN_WAIT[uid] = act; await message.answer(t("adj_need_reason")); return
            amt = parse_amount(parts[0].lstrip("+-")); reason = parts[1]
            if not amt:
                ADMIN_WAIT[uid] = act; await message.answer(t("bad_format")); return
        res = await a2_apply_adjust(bot, uid, tu, sign * amt, reason[:150])
        c, kb = a2_user_card(tu)
        await message.answer(res + "\n\n" + c, reply_markup=kb)
    elif act == "a2an_uz":
        ADMIN_WAIT[uid] = "a2an_ru:" + message.html_text[:3500]
        await message.answer(t("ann_ask_ru"))
    elif act.startswith("a2an_ru:"):
        uz = act[8:]; ru = "" if txt == "-" else message.html_text[:3500]
        aid = W.ann_add(uz, ru, uid); W.log(uid, "ann_create", str(aid))
        await message.answer(t("ann_saved", id=aid), reply_markup=_kb([[(f"#{aid}", f"a2:ane:{aid}")], _back_row("a2:an")]))
    elif act.startswith("a2an_edit:"):
        _, lang, aid = act.split(":")
        W.ann_edit(int(aid), **{lang: message.html_text[:3500]}); W.log(uid, "ann_edit", aid, lang)
        await message.answer(t("done"), reply_markup=_kb([[(f"#{aid}", f"a2:ane:{aid}")]]))
    elif act == "a2role":
        p2 = txt.split()
        if len(p2) != 2 or p2[1] not in ("admin", "support") or not p2[0].isdigit():
            ADMIN_WAIT[uid] = act; await message.answer(t("roles_ask")); return
        async with store.lock:
            store.d.setdefault("roles", {})[p2[0]] = p2[1]; store.save()
        W.log(uid, "role_set", p2[0], p2[1])
        await message.answer(t("roles_ok"), reply_markup=_kb([[(t("m_roles"), "a2:rl")]]))


# ---- admin chatiga ketayotgan eski inglizcha matn va tugmalarni tanlangan tilga o'girish (lug'at: admin_i18n.LEGACY)
from aiogram.client.session.middlewares.base import BaseRequestMiddleware   # noqa: E402
from aiogram.methods import SendMessage, EditMessageText, EditMessageReplyMarkup, SendPhoto, SendDocument   # noqa: E402


def _loc_kb(kb, lang):
    if not isinstance(kb, InlineKeyboardMarkup):
        return kb
    rows = [[b.model_copy(update={"text": loc(b.text, lang)}) for b in row] for row in kb.inline_keyboard]
    return InlineKeyboardMarkup(inline_keyboard=rows)


class AdminLoc(BaseRequestMiddleware):
    async def __call__(self, make_request, bot, method):
        try:
            if isinstance(method, (SendMessage, EditMessageText, EditMessageReplyMarkup, SendPhoto, SendDocument)):
                chat = getattr(method, "chat_id", None)
                if isinstance(chat, int) and chat > 0 and is_adm(chat):
                    lang = store.d.get("adm_lang", {}).get(str(chat), "uz")
                    if getattr(method, "text", None):
                        method.text = loc(method.text, lang)
                    if getattr(method, "caption", None):
                        method.caption = loc(method.caption, lang)
                    if getattr(method, "reply_markup", None) is not None:
                        method.reply_markup = _loc_kb(method.reply_markup, lang)
        except Exception as e:  # noqa: BLE001
            log.debug("admin loc: %s", e)
        return await make_request(bot, method)


async def backup_loop() -> None:
    """Balanslar bazasining zaxira nusxasi: ishga tushganda va har 6 soatda (oxirgi 28 tasi saqlanadi)."""
    while True:
        try:
            log.info("zaxira nusxa: %s", W.backup(BACKUP_DIR, keep=28))
        except Exception as e:  # noqa: BLE001
            log.warning("zaxira xato: %s", e)
        await asyncio.sleep(6 * 3600)


async def main() -> None:
    runner = web.AppRunner(make_app())
    await runner.setup()
    await web.TCPSite(runner, API_HOST, API_PORT).start()
    log.info("API server: http://%s:%s", API_HOST, API_PORT)
    asyncio.create_task(giveaway_loop())
    asyncio.create_task(ton_deposit_loop())
    asyncio.create_task(live_loop())
    asyncio.create_task(backup_loop())
    asyncio.create_task(catalog_loop())
    if not BOT_TOKEN:  # DEV_NOAUTH lokal sinov: faqat API
        log.warning("BOT_TOKEN yo'q — faqat API ishlayapti (DEV_NOAUTH)")
        asyncio.create_task(tunnel_loop(None))
        await asyncio.Event().wait()
        return
    if TG_API_BASE:
        from aiogram.client.session.aiohttp import AiohttpSession
        from aiogram.client.telegram import TelegramAPIServer
        bot = Bot(BOT_TOKEN, session=AiohttpSession(api=TelegramAPIServer.from_base(TG_API_BASE)), default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    else:
        bot = Bot(BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    bot_ref["bot"] = bot
    bot.session.middleware(AdminLoc())   # admin panel — O'zbek / Русский
    asyncio.create_task(tunnel_loop(bot))
    asyncio.create_task(post_loop(bot))
    asyncio.create_task(content_loop(bot))
    dp.startup.register(on_startup)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
