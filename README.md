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

## 4.3 Live o'yinlar (server)

Server ulanganda (CFG.API_URL) **Roulette, PvP, TvT va Rocket** barcha o'yinchilar uchun bitta umumiy raundda o'ynaladi:
hamma bir-birining tikishini, avatarini va natijani ko'radi. Raund vaqti, g'olib va crash nuqtasi serverda aniqlanadi,
yutuqlar (TON va sovg'alar) g'olibning inbox'iga yoziladi va ilovada avtomatik balansga/Backpack'ga tushadi.
Server ulanmagan bo'lsa o'yinlar avvalgidek telefonda (offline) ishlaydi.

## 4.4 Depozit kursi

`.env`: `TON_RATE=100000` (1 TON = 100 000 balans), `STARS_RATE=800` (125 ⭐ = 100 000 balans).
Ilovadagi demo rejim ham shu kursni ishlatadi (`CFG.TON_RATE`, `CFG.STARS_RATE`).

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

## 🛠 Admin panel (botda `/admin`)
Faqat `.env` dagi `ADMIN_IDS` uchun ishlaydi. Tugmalar:
* **📊 Statistics** — o'yinchilar, online, 24 soatdagi yangi, haqiqiy depozitlar summasi
* **➕ Add balance / ➖ Remove balance** — `ID miqdor` yuboring (`123456789 100000`, `@user 50k`)
* **🎁 Create bonus link** — `miqdor soni [kod]` (`50000 100 welcome`) → `https://t.me/BOT?start=bonus_welcome`.
  Har bir o'yinchi 1 marta oladi, soni tugasa link yopiladi. **🔗 Bonus links** — ro'yxat va o'chirish.
* **💳 Deposits** — oxirgi depozitlar · **🔎 Find player** · **📢 Broadcast** — hammaga xabar
* Buyruqlar: `/give ID 1000`, `/take ID 1000`, `/bonus 50000 100`, `/users`

Balans o'zgarishi o'yinchi ilovani ochganda qo'llanadi (inbox orqali).

## 💳 Depozit — faqat haqiqiy to'lov
* 1 TON = 100 000 balans (`TON_RATE`), 125 ⭐ = 100 000 (`STARS_RATE=800`).
* TON: `DEPOSIT_ADDRESS` ga TON Connect orqali yoki izoh `dep_<ID>` bilan o'tkazma → toncenter tekshiradi → avtomatik qo'shiladi.
* Stars: Telegram invoice to'langandan keyin avtomatik qo'shiladi.
* Ilova o'zi hech qachon balans qo'shmaydi. Server o'chiq bo'lsa depozit bo'limi "temporarily unavailable" ko'rsatadi.


## 🌐 Hamma birga o'ynashi uchun (server ulanishi) — MUHIM
Roulette, PvP, TvT va Rocket faqat server orqali ishlaydi: hamma o'yinchi bitta raundda, bir-birini ko'radi.
Server ulanmagan bo'lsa bu o'yinlar ochilmaydi ("Server is not connected") — hech kim yolg'iz o'ynamaydi.

1. `python bot.py`
2. Boshqa oynada **aynan shunday**:
   `cloudflared tunnel --url http://localhost:8080 --metrics 127.0.0.1:45678`
3. Tamom. bot.py tunnel manzilini o'zi topadi (har 15 s tekshiradi), bot menyu tugmasiga `?api=...` qilib qo'shadi.
   `js/app.js` dagi `CFG.API_URL` ni endi qo'lda o'zgartirish shart emas.
   Logda `API manzili topildi: https://....trycloudflare.com` chiqishi kerak.
4. Tunnel qayta ishga tushsa manzil o'zgaradi — bot uni o'zi yangilaydi. O'yinchilar ilovani **bot tugmasi orqali** qayta ochishi kifoya.
5. Doimiy domeningiz bo'lsa `.env` da `PUBLIC_API_URL=https://api.sizning-domen.uz` yozing.

Rocket'da har raundda 3–4 ta bot (Astro, Comet, Nova, Orbit) tikadi, "BOT" belgisi bilan ko'rinadi; ular pul olmaydi va crash natijasiga ta'sir qilmaydi.

## 🛠 Admin panel — yangi tugmalar (`/admin`)
* **💰 Top balances** — o'yinchilarning ilovadagi balansi va sovg'alari (ilova har 4 s serverga yuboradi)
* **🚫 Ban / Unban** — ID yoki @username; bloklangan o'yinchi ilovada "Account blocked" ko'radi, hech qaysi o'yin ishlamaydi
* **⚙️ Settings**
  * 1 TON kursi, 1 Star kursi (depozitga darhol ta'sir qiladi)
  * Botlarning maksimal tikishi (PvP/TvT/Roulette/Rocket)
  * Rocket botlari soni (masalan `3 4`, 0–8)
  * Har bir o'yinni yoqish/o'chirish (✅/❌) — o'chiq o'yin "Temporarily unavailable" ko'rsatadi
  * 🔴 Maintenance — hamma uchun "Maintenance" ekrani (adminlar o'ynay oladi)
* **🧹 Reset** (har biri tasdiq so'raydi)
  * Hamma balansini 0 qilish (sovg'alar qoladi)
  * Reytingdagi barcha ballarni 0 qilish (eski telefon eski ballarni qaytara olmaydi)
  * Bitta o'yinchi balansini 0 qilish
  * To'liq reset: balans, backpack, ballar, tarix, Live, giveaway, bonus link, kutilayotgan mukofotlar o'chadi.
    Qoladi: o'yinchilar ro'yxati, banlar, sozlamalar, depozit jurnali.
* Reset o'yinchining telefoniga ilova ochiq bo'lsa ~4 s ichida, yopiq bo'lsa keyingi ochilishda yetib boradi.

⚠️ Balans hamon telefonda hisoblanadi (Mines, Dice, Plinko, Spins, Upgrade, Crafts, kaselar). Server uni ko'radi va
nolga tushira oladi, lekin o'zgartirilgan ilova bilan aldashni to'liq to'smaydi. Haqiqiy pul uchun bu o'yinlar natijasini ham
serverga ko'chirish kerak (keyingi bosqich).

## 🖥 VPS ga o'rnatish (doimiy ishlashi uchun)
1. Ubuntu 22.04/24.04 VPS oling (1 CPU / 1 GB RAM yetadi).
2. Loyihani serverga yuklang (`scp -r riki root@SERVER_IP:/root/` yoki `git clone`).
3. `sudo bash riki/deploy/install.sh`
4. `sudo nano /opt/riki/.env` → BOT_TOKEN, WEBAPP_URL, ADMIN_IDS, DEPOSIT_ADDRESS, TONCENTER_KEY
5. `sudo systemctl restart riki-bot` — tayyor. Bot va tunnel server qayta yonganda ham o'zi ishga tushadi.
* Loglar: `journalctl -u riki-bot -f` · tunnel: `journalctl -u riki-tunnel -f`
* Doimiy domen bo'lsa (`api.sizningdomen.uz`), `.env` da `PUBLIC_API_URL` ni yozing.
* GitHub Pages'ga faqat `index.html`, `css/`, `js/` (jumladan `js/vendor/`), `icon.png`, `tonconnect-manifest.json` yuklanadi.

## 🔄 GitHub Pages'dagi eski versiyani yangilash
**Brauzer orqali (eng oson):**
1. github.com → `riki` repozitoriyangizni oching.
2. **Add file → Upload files** ni bosing.
3. `riki.zip` ni kompyuterda oching va ichidagi **`index.html`, `css`, `js`, `icon.png`, `tonconnect-manifest.json`** ni sudrab tashlang
   (papkalar bilan birga; `js/vendor/lottie.min.js` ham bo'lishi shart). Bir xil nomli fayllar avtomatik almashtiriladi.
4. Pastda **Commit changes** ni bosing. 1–2 daqiqada sayt yangilanadi (Settings → Pages'da yashil belgi chiqadi).
5. Telegram'da botni to'liq yopib qayta oching. Eski versiya ko'rinsa, Telegram Settings → Data and Storage → Storage Usage → Clear cache.

⚠️ `bot.py`, `.env`, `riki_data.json` ni GitHub'ga **yuklamang** — ular VPS'da turadi.

**Terminal orqali:**
```
cd riki-repo          # GitHub'dan clone qilingan papka
cp -r ~/Downloads/riki/{index.html,css,js,icon.png,tonconnect-manifest.json} .
git add -A && git commit -m "RIKI update" && git push
```
VPS'dagi botni yangilash: yangi `bot.py` ni `/opt/riki/` ga ko'chiring va `sudo systemctl restart riki-bot`.

## 👥 Guruhda admin buyruqlari
Botni guruhga qo'shib admin qiling. O'yinchining xabariga **reply** qilib yozing (faqat ADMIN_IDS):
`/add 1000` · `/take 1000` · `/zero` · `/ban [sabab]` · `/unban` · `/bal` · `/info`
Reply'siz: `/add 123456789 1000` yoki `/add @username 1000`. Bot javobni sizning xabaringizga reply qiladi.

## 🎟 Free Box — promo-kod bilan
Admin: `/admin → 🎟 Free box code` yoki `/promo RIKI2026 100`. O'yinchi FREE kartani ochib kodni kiritadi —
har kod bitta o'yinchiga bir marta, `uses` soni tugaguncha. BOOST faqat 0.1 TON'lik (Farm) kasede.

## 📣 Kanal va postlar (`/admin` → 📣 Channel & posts)
Sozlash: `.env` da `CHANNEL_ID=@kanal_nomi` (yoki `-100...`) yozing, botni kanalga **admin** qiling ("Post messages" huquqi bilan).

- **Avto bonus link**: ON/OFF, har necha soatda (1–24), miqdori va necha kishiga (masalan 500). Post ko'rinishi:
  `🎁 Link valid for 500 people` / `👉 Click here for details 👈`.
  "Post now" tugmasi darhol joylaydi, "Preview" esa avval sizga ko'rsatadi.
- **Premium emoji**: "Set emoji" bosing va botga premium emojilarni yuboring (1-si 🎁, 2-si 👉 o'rnida, 3-si 🏆 o'rnida). `clear` yozsangiz o'chiriladi.
  ⚠️ Telegram faqat **Fragment'da sotib olingan username**ga ega botlarga premium emoji ishlatishga ruxsat beradi. Bunday username bo'lmasa, post avtomatik oddiy emoji bilan chiqadi (xato bo'lmaydi).
- **Kunlik natijalar**: har kuni tanlangan soatda (Toshkent vaqti) rasm kartochka bilan "Today's biggest wins".
- **So'rovnoma**: "Botga nima qo'shaylik?" (`default` yoki `Savol | variant | variant`).
- **Rasmli post**: `Sarlavha | matn` yozsangiz bot o'zi chiroyli rasm yasaydi, yoki o'zingiz rasm yuborib izohini yozing. Hammasida "PLAY" tugmasi bo'ladi.
- Rasm yasash uchun `pip install -r requirements.txt` (Pillow) kerak.

## 🚀 Rocket — raketa o'rniga NFT
Uchish paytida markazda raketa emas, **tikilgan summa × koeffitsiyentga mos NFT** uchadi va qiymat oshgani sari tez almashib turadi
(tagida: `Your bet 3.00 ×1.25 = 3.75`). Cash Out bosilganda aynan shu NFT (+ qoldiq balansga) beriladi.
O'zingiz tikmagan bo'lsangiz — raunddagi eng katta faol tikish ko'rsatiladi. Hech kim tikmasa — Stellar Rocket uchadi.

📘 Noldan joylash bo'yicha to'liq qo'llanma: **QOLLANMA.md**
