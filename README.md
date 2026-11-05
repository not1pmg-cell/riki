# RIKI — Telegram Mini App (demo)

Telegram NFT gift o'yinlari: Rocket, PvP, TvT, Upgrade, Mines, Spins, Plinko, Dice, Crafts, qutilar (Box), Daily Box, Market, Earn/Giveaways, Leaderboard, VIP.

> ⚠️ **Demo**: balans (GRAM) va sovg'alar haqiqiy emas. Ilova haqiqiy pul yoki NFT qabul qilmaydi va chiqarmaydi.

## Fayllar

```
riki/
├── index.html        — sahifa tuzilmasi
├── css/style.css     — barcha uslublar
├── js/app.js         — asosiy o'yinlar (Rocket, PvP, TvT, Upgrade, Mines, Spins, Plinko, Dice, Crafts, Market)
├── js/screens.js     — yangi ekranlar (Box, Daily Box, Top Up, Earn, Giveaways, Leaderboard, VIP, Provably Fair)
├── bot.py            — Telegram bot (aiogram 3)
├── requirements.txt
└── .env.example
```

## 1. Mini App'ni GitHub Pages'ga joylash

1. GitHub repo'ga (`not1pmg-cell/riki`) `index.html`, `css/`, `js/` papkalarini yuklang.
2. **Settings → Pages → Branch: main / root** → Save.
3. Manzil: `https://<username>.github.io/<repo>/`

## 2. Sozlamalar (`js/app.js` boshida, `CFG`)

| Kalit | Ma'nosi |
|---|---|
| `BOT_USERNAME` | botingiz username'i (@ siz) — referal havola uchun |
| `CHANNEL_URL` | kanal havolasi (Earn vazifasi) |
| `START_BALANCE` | birinchi kirishdagi demo balans |
| `CUR` | valyuta nomi (`GRAM`) |
| `BRAND` | ilova nomi |
| `GIFT_BOT` | sovg'a qabul qiladigan bot nomi (matnlarda ko'rsatiladi) |
| `API_URL` | bot.py server manzili (cloudflared tunnel URL). Bo'sh bo'lsa — offline rejim |
| `ADMIN_IDS` | offline rejimda admin bo'ladigan Telegram ID'lar (online'da `.env` dagi `ADMIN_IDS` ishlaydi) |

## 3. Botni ishga tushirish

```bash
pip install -r requirements.txt
copy .env.example .env      # Windows   (Linux: cp .env.example .env)
# .env ni to'ldiring: BOT_TOKEN va WEBAPP_URL
python bot.py
```

BotFather'da: `/mybots → Bot Settings → Configure Mini App` ga ham shu URL'ni qo'yishingiz mumkin.
Botning Telegram'dagi nomi (sarlavhada ko'rinadigan) BotFather → `/setname` orqali o'zgartiriladi.

## 4. Real o'yinchilar (online rejim)

`bot.py` ichida API server bor (port 8080). U quyidagilarni barcha o'yinchilar uchun umumiy qiladi:

* **Leaderboard** — faqat real o'yinchilar (soxta ismlar yo'q)
* **Live lenta** — o'yinchilarning real yutuqlari
* **Giveaway** — admin yaratadi, hamma qatnashadi, g'oliblar avtomatik tanlanadi, bot ularga xabar yuboradi va sovg'a Backpack'ga tushadi

Ulash:
1. `.env` da `ADMIN_IDS` ni yozing (ID'ni bilish uchun botga `/admin` yozing).
2. `python bot.py` — bot va API birga ishga tushadi.
3. Boshqa oynada: `cloudflared tunnel --url http://localhost:8080` → chiqqan `https://....trycloudflare.com` manzilini
   `js/app.js` dagi `CFG.API_URL` ga yozing va GitHub'ga qayta yuklang.
4. Ilovada: **Earn → Giveaways → ➕ Giveaway yaratish** (faqat adminga ko'rinadi): sovg'alarni tanlang, muddatini tanlang
   (1 soat … 7 kun yoki aniq sana-vaqt), kerak bo'lsa "Faqat VIP". Faol giveaway'ni **⏹ Hozir tugatish** yoki **🗑 O'chirish** mumkin.

Har bir so'rov Telegram `initData` imzosi bilan tekshiriladi, shuning uchun boshqa odam sizning nomingizdan yozolmaydi.

## 4.1 Transfer va depozit

* **Transfer** — Profil (avatar) → **Send GRAM** / **Send Gift**, yoki Backpack'da sovg'ani bosib → **↗ Transfer**.
  Qabul qiluvchini `@username` yoki Telegram ID bilan topadi; bot unga xabar yuboradi, GRAM balansga, sovg'a Backpack'ga tushadi.
* **Deposit** — yuqoridagi **Deposit** tugmasi: GRAM, Other Crypto, Stars, Gifts tablari (demo).
* Transfer server (online rejim) talab qiladi.

## 4.1.1 Haqiqiy depozit (TON va Stars)

**TON (TON Connect):**
1. `.env` → `DEPOSIT_ADDRESS=` ga o'z TON hamyoningiz manzilini yozing (Tonkeeper va h.k.).
2. `TONCENTER_KEY=` — https://t.me/tonapibot dan bepul kalit (ixtiyoriy, tezroq ishlaydi).
3. `tonconnect-manifest.json` va `icon.png` ni GitHub Pages'ga index.html yoniga yuklang va
   manifest ichidagi `USERNAME` ni o'zingiznikiga almashtiring.
4. Foydalanuvchi: Deposit → TON → **Connect Wallet** → summa → **Top Up** → hamyonda tasdiqlaydi.
   Bot har 15 soniyada manzilni tekshiradi va tushumni balansga yozadi (≈15–60 s).
   Qo'lda yuborish ham mumkin: manzil + izoh `dep_<ID>` (ilovada ko'rsatiladi).

**Telegram Stars:**
* Deposit → Stars → summa (10–10 000) → Telegram to'lov oynasi ochiladi. To'lovdan keyin balansga
  `STARS_RATE` bo'yicha TON tushadi (standart: 1 ⭐ = 0.004 TON). Hech qanday qo'shimcha sozlama kerak emas.
* Qaytarish (admin): botga `/refund <user_id> <charge_id>`.

Server ulanmagan bo'lsa (CFG.API_URL bo'sh) depozit demo rejimda ishlaydi.

> ⚠️ Balans hozir foydalanuvchi telefonida (localStorage) saqlanadi. Haqiqiy pul bilan ishlashdan oldin balansni
> serverda saqlash va pul yechish (withdraw) uchun alohida himoyalangan tizim kerak.

## 4.2 PvP Hub — 3 bo'lim

* **PvP** — g'ildirak + tasma, "Increase" (Gifts / TON) bilan tikishni oshirish
* **TvT** — Ice va Fire jamoalari
* **Roulette** — rangli g'ildirak, LIVE/taymer, "Add to PvP", ROLL #, o'yinchi kartalari (TON va gift chiplari). G'olib hamma TON va sovg'alarni oladi
* **Earn** (pastki menyu) — vazifalar va Giveaways

## 5. O'yin botlari

* **PvP** — `PvP` nomli bot (BOT belgisi bilan)
* **TvT** — `Ice` va `Fire` botlari
* **Roulette** — `Roulette` boti
* Botlar eng ko'pi bilan **1000 GRAM** tikadi. Rocket'da soxta o'yinchilar yo'q.

## 6. Narxlar va rasmlar

* Gift floor narxlari va model narxlari ochiq manbadan olinadi: `github.com/ssamy2/TelegramGiftsAssests`
  (Portals / GetGems / Tonnel). Ilova ochilganda jonli yangilanadi, internet bo'lmasa ichki snapshot ishlatiladi.
* Rasmlar jsDelivr CDN orqali yuklanadi.

## 7. Provably Fair (Mines)

Har raund oldidan server seed'ning SHA-256 hash'i ko'rsatiladi. Raunddan keyin seed ochiladi va
**History** oynasida telefonning o'zida qayta tekshiriladi: `SHA-256(seed) == hash` va mina joylashuvi
`SHA-256(seed:client:nonce:n)` dan qayta hisoblanadi.
