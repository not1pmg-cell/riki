# RIKI — noldan ishga tushirish (to'liq qo'llanma)

Loyiha **2 qismdan** iborat, ular **2 xil joyga** yuklanadi:

| Qism | Fayllar | Qayerga | Nima qiladi |
|---|---|---|---|
| 🌐 Mini App (sayt) | `index.html`, `css/`, `js/` (ichida `vendor/`), `icon.png`, `tonconnect-manifest.json` | **GitHub Pages** (bepul) | Telegram ichida ochiladigan o'yin oynasi |
| 🤖 Bot + server | `bot.py`, `requirements.txt`, `.env`, `deploy/` | **VPS** (tavsiya) yoki o'z kompyuteringiz | Bot, admin panel, live o'yinlar, depozit, kanal postlari |

> ⚠️ `bot.py`, `.env`, `riki_data.json` ni **hech qachon GitHub'ga yuklamang** — ichida token va o'yinchilar ma'lumoti bor.

---

## 0-qadam. Tayyorgarlik (5 daqiqa)
1. Telegram'da **@BotFather** → `/newbot` → nom va username bering → **token**ni nusxalang (`123456:ABC...`).
2. O'zingizning Telegram ID'ingiz: **@userinfobot** ga `/start` yozing → `Id: 123456789`.
3. `riki.zip` ni kompyuterda oching (o'ng tugma → Extract All). `riki` papkasi chiqadi.

---

## 1-qadam. Mini App'ni GitHub Pages'ga joylash
1. https://github.com → **New repository** → nomi `riki` → **Public** → Create.
2. Ochilgan sahifada **uploading an existing file** (yoki **Add file → Upload files**).
3. `riki` papkasidan **faqat shularni** sudrab tashlang:
   `index.html`, `css`, `js`, `icon.png`, `tonconnect-manifest.json`
   (papkalarni butunligicha sudrang — `js/vendor/lottie.min.js` ham borishi shart).
4. Pastda **Commit changes**.
5. **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `/(root)` → Save.**
6. 1–2 daqiqadan keyin manzil chiqadi: `https://USERNAME.github.io/riki/` — brauzerda ochib tekshiring.
7. `tonconnect-manifest.json` ichidagi `url` va `iconUrl` ni shu manzilga moslang (GitHub'da faylni ochib ✏️ bilan tahrirlasa bo'ladi).

---

## 2-qadam. Botni serverga qo'yish

### Variant A — VPS (tavsiya: 24/7 ishlaydi)
Ubuntu 22.04/24.04, 1 CPU / 1 GB RAM yetadi (Hetzner, DigitalOcean, Timeweb, Aeza va h.k., oyiga ~4–6 $).

**Windows'dan fayllarni yuklash** (PowerShell yoki CMD):
```
scp -r C:\Users\SIZ\Downloads\riki root@SERVER_IP:/root/
```
(yoki WinSCP / FileZilla dasturi bilan `riki` papkasini `/root/` ga sudrang)

**Serverga kirish va o'rnatish:**
```
ssh root@SERVER_IP
sudo bash /root/riki/deploy/install.sh
sudo nano /opt/riki/.env
```
`.env` da to'ldiring (pastdagi jadvalga qarang), **Ctrl+O → Enter → Ctrl+X** bilan saqlang, keyin:
```
sudo systemctl restart riki-bot
journalctl -u riki-bot -f
```
Logda `API manzili topildi: https://....trycloudflare.com` chiqsa — hammasi ulandi. Server qayta yonsa ham bot va tunnel o'zi ishga tushadi.

### Variant B — o'z kompyuteringiz (Windows, sinov uchun)
1. **Python 3.11+** o'rnating (python.org, "Add to PATH" belgisini qo'ying).
2. **cloudflared**: https://github.com/cloudflare/cloudflared/releases → `cloudflared-windows-amd64.exe` → nomini `cloudflared.exe` qilib `riki` papkasiga qo'ying.
3. `riki` papkasida manzil qatoriga `cmd` yozing va:
   ```
   pip install -r requirements.txt
   copy .env.example .env
   notepad .env
   python bot.py
   ```
4. **Ikkinchi** CMD oynasida (aynan shunday):
   ```
   cloudflared tunnel --url http://localhost:8080 --metrics 127.0.0.1:45678
   ```
5. Ikkala oyna ochiq turishi kerak. Kompyuter o'chsa yoki uxlasa — bot ham to'xtaydi.

### `.env` — nimani yozish kerak
| Kalit | Misol | Majburiy |
|---|---|---|
| `BOT_TOKEN` | `123456:ABC...` (BotFather) | ✅ |
| `WEBAPP_URL` | `https://USERNAME.github.io/riki/` | ✅ |
| `ADMIN_IDS` | `123456789` (bir nechta: `111,222`) | ✅ |
| `CHANNEL_ID` | `@kanalim` yoki `-100...` — avto bonus link va postlar | kanal uchun |
| `CHANNEL_URL` | `https://t.me/kanalim` (Earn vazifasi) | ixtiyoriy |
| `DEPOSIT_ADDRESS` | Tonkeeper hamyon manzili | TON depozit uchun |
| `TONCENTER_KEY` | @tonapibot dan kalit | tavsiya |
| `TON_RATE`, `STARS_RATE` | kurslar (admin paneldan ham o'zgaradi) | ixtiyoriy |
| `PUBLIC_API_URL` | doimiy domen bo'lsa: `https://api.domen.uz` | ixtiyoriy |

---

## 3-qadam. Telegram sozlamalari
1. Botga `/start` yozing → pastda **RIKI** tugmasi chiqadi (bot uni o'zi qo'yadi). Bosing — o'yin ochiladi.
2. `/admin` → admin panel. Ochilmasa — `ADMIN_IDS` noto'g'ri.
3. **Kanal:** botni kanalga qo'shing → **Admin** qiling ("Post messages" yoqilgan) → `/admin → 📣 Channel & posts`.
4. **Guruh buyruqlari:** botni guruhga qo'shib admin qiling → o'yinchi xabariga reply qilib `/add 1000`.
5. (Ixtiyoriy) BotFather → `/mybots → Bot Settings → Configure Mini App` ga ham `WEBAPP_URL` ni qo'ying.

---

## 4-qadam. Tekshirish ro'yxati ✅
- [ ] Brauzerda `https://USERNAME.github.io/riki/` ochiladi
- [ ] Botda RIKI tugmasi → o'yin ochiladi, yuqorida yashil Wi-Fi belgisi (server ulangan)
- [ ] Rocket / PvP / TvT / Roulette'da "Server is not connected" **chiqmaydi**
- [ ] Ikki xil telefondan kirilsa, ikkalasi bitta raundni ko'radi
- [ ] `/admin` ishlaydi, `📣 Channel & posts → Preview` sizga post yuboradi

---

## Yangilash (yangi versiya chiqqanda)
**Sayt (GitHub):** repo → **Add file → Upload files** → yangi `index.html`, `css`, `js`, `icon.png`, `tonconnect-manifest.json` ni sudrang → **Commit changes**. Bir xil nomlilar o'zi almashadi. 1–2 daqiqa kuting, Telegram'ni to'liq yopib qayta oching.

**Bot (VPS):** yangi `riki` papkasini yana `/root/` ga yuklang va:
```
sudo bash /root/riki/deploy/update.sh
```
`.env` va `riki_data.json` (o'yinchilar, balanslar) saqlanadi, eski versiya `/opt/riki/backup/` ga zaxiralanadi.

**Bot (Windows):** CMD'da `Ctrl+C` → yangi `bot.py` ni ustiga ko'chiring → `python bot.py`.

---

## Tez-tez uchraydigan xatolar
| Belgi | Sabab va yechim |
|---|---|
| "Server is not connected" | cloudflared ishlamayapti yoki `--metrics 127.0.0.1:45678` yozilmagan. VPS: `journalctl -u riki-tunnel -f`. Ilovani **bot tugmasi orqali** qayta oching. |
| Eski dizayn ko'rinadi | GitHub hali yangilanmagan (Settings → Pages'da yashil belgi kuting) yoki Telegram keshi: Settings → Data and Storage → Storage Usage → Clear cache. |
| 404 sahifa | Pages yoqilmagan yoki `index.html` repo **ildizida** emas (`riki/index.html` bo'lib qolgan). |
| `/admin` javob bermaydi | `ADMIN_IDS` da ID xato yoki bot qayta ishga tushirilmagan. |
| `TelegramConflictError` | Bot ikki joyda ishlayapti (kompyuter + VPS). Bittasini o'chiring. |
| `ModuleNotFoundError: aiogram / PIL` | `pip install -r requirements.txt` qiling (VPS'da `update.sh` o'zi qiladi). |
| Kanalga post chiqmaydi | Bot kanalda admin emas yoki `CHANNEL_ID` xato (`@` bilan yoki `-100...`). |
| Premium emoji oddiy chiqadi | Bot Fragment'da sotib olingan username'ga ega emas — Telegram cheklovi. Post baribir chiqadi. |
| Rasmlar xira/sekin | Birinchi ochilishda yuklanadi, keyin keshdan. Internet sekin bo'lsa `⚙️ → Graphics: Low`. |
