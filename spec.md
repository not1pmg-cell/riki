# RIKI — Epic videosidan 1:1 spetsifikatsiya (4-QADAM: tasdiqlash uchun)

> Bu hujjat **kod yozishdan oldin** tasdiqlash uchun. Kod siz tasdiqlagandan keyin yoziladi.
> Manba: `A` = Screen_Recording_2026-11-26_111948.mp4 (1224×1196, 30 fps, 111.4 s),
> `B` = Screen_Recording_2026-11-26_112507.mp4 (1912×1186, 30 fps, 252.1 s).
> Ilova oynasi ikkala videoda ham **570 px** keng (A: x=160…730, B: x=667…1237).
> Barcha o'lchamlar **390 px** kenglikka o'tkazilgan: `1 px (390) = 1.4615 px (video)`.
> Barcha HEX qiymatlari kadrdan piksel olib o'lchangan (Pillow), ko'z bilan emas.

---

## 0-QADAM — O'chiriladiganlar ro'yxati (videoda YO'Q, men qo'shganman)

Kodning hammasi hali to'liq ko'rib chiqilmagan (≈10 000 qator). Quyidagilar tekshirilgani; ro'yxat ustida ishlash davom etadi.

| # | Element | Fayl:qator | Videoda |
|---|---|---|---|
| 1 | **Roulette** o'yini (butun ekran) | js/screens.js:1391 `sec('roulette')`, css .rl* | yo'q |
| 2 | Roulette kartasi PvP Hub'da (yashirilgan, lekin kodda bor) | js/screens.js:1509, css:1408–1414, 2798 | yo'q |
| 3 | PvP Hub tablari (⚔️ PvP / 🛡 TvT / 🎡 Roulette) | js/screens.js:1510, css:1406–1407, 2047 | yo'q |
| 4 | **Market** ekrani | index.html:237–244 | yo'q |
| 5 | Eski **Cases** ekrani | index.html:229–235 | yo'q |
| 6 | Profil: "💎 Send TON / 🎁 Send Gift" tugmalari | js/screens.js:1289, 1293; css:1335 | yo'q (profil skrinshotida yo'q) |
| 7 | Rocket tarix chiplarida "BET" chipi | js/screens.js:223 | yo'q (faqat ko'paytiruvchi chiplar) |
| 8 | Rocket qatorlarida "(you)" yozuvi | js/screens.js:229 | yo'q |
| 9 | PvP ro'yxatida "(you)" yozuvi (Epic'da "YOU" badge) | js/app.js:566 | boshqacha |
| 10 | Banner ustidagi oq "shimmer" nur | css/style.css:2677–2678 | yo'q |
| 11 | "Server is not connected" oynasi | js/screens.js:1222–1229 | yo'q (videoda faqat "Checking system status…") |
| 12 | Deposit oynasidagi "Reset everything" tugmasi | index.html:302 | yo'q |
| 13 | "Demo mode" yozuvlari | js/app.js:1159, js/screens.js:702 | yo'q |
| 14 | Welcome modal (`welM`) | index.html:305 | yo'q |
| 15 | Spins "BIG WIN" yozuvi | index.html:182 | videoda ko'rinmadi → UNCLEAR |
| 16 | Home tab faol holati uchun 2 xil qoida (biri ortiqcha) | css/style.css:2444, 2465 | bittasi qoladi |
| 17 | `css/style.css` dagi ~2 800 qator: bir-birini `!important` bilan bosib turgan eski qatlamlar | butun fayl | toza tokenlar fayliga ko'chiriladi |
| 18 | Mening bugun qo'shgan yutuq oynalarimdagi taxminiy o'lchamlar (rwm) | css/style.css oxiri | kadr o'lchamlari bilan qayta yoziladi |

Brauzer default uslublari: `button` default border/font, `input` default fon — bular tokenlar bilan nolga tushiriladi.

---

## 1-QADAM — Ekranlar va holatlar ro'yxati

85 ta holat `frames/` papkasida (to'liq o'lcham, 570 px keng). Manba vaqti `measurements/states.txt` da.

| Ekran | Holatlar (fayl) | Manba |
|---|---|---|
| Home | 17_home_top, 41_home_loading_feed, 42_home | A 67.0; B 24.0, 24.5 |
| Yuklanish | 43_loading_checking_system ("Checking system status…") | B 25.0 |
| Play Hub | 44_playhub | B 25.5 |
| PvP Hub | 01_pvphub_scrolled, 71_pvphub | A 0.0; B 192.5 |
| PvP | 18 (1 o'yinchi), 19 (3 o'yinchi, sanoq), 20 (Increase Your Bet), 21 (LIVE lenta) | A 69.5–77.5 |
| TvT | 02, 03, 06, 07, 08, 09 (Fire wins oynasi), 04/05 (History All/Mine) | A 5.0–47.0 |
| Rocket | 26, 28, 29, 31, 34, 35, 36, 37, 38, 40, 79, 80 | A 99–106; B 0–22, 227–230 |
| Rocket tikish oynasi | 27, 32 (Gifts), 33 (TON) | A 99.5; B 1.5, 2.0 |
| Rocket Reward | 30, 39 | A 110; B 17.5 |
| Upgrade | 45, 46 (Select Your Gifts), 47, 48 (Select Target Gift), 49 (49.8%), 50 (Upgrading…), 51 (Successful) | B 26.5–42.5 |
| Mines | 52, 53 (Cashout), 54 (Boom — qizil), 55 (2.43X yutuq), 56 (Bet a gift) | B 59–100 |
| Spins | 57, 58, 59 (zarrachalar), 60 (mos kelish), 61 (Confirm purchase), 62 (Buy features: 10/25/50/100/250) | B 105–125.5 |
| Plinko | 63 Medium, 64 Hard, 65 Easy, 66 Bet Gifts | B 129.5–147.5 |
| Dice | 67, 68 (sovg'a banneri), 69, 70 (Select Gift to Bet) | B 163–186 |
| Crafts | 72, 73, 74, 75 (Executing), 76 (shar), 77 (Craft Successful!), 78 (toast) | B 199.5–216 |
| Box (Heaven) | 22, 23, 24 (Congratulations!), 25 ("Gift added to your backpack!" toast) | A 88.5–95.6 |
| Leaderboard | 10, 11, 81 (Loading leaderboard…), 82 | A 51.5; B 239–240.5 |
| Invite | 12, 13, 83, 84 | A 55.5–58.5; B 241.5–242 |
| Earn | 15 (Daily tasks), 16 (Deposit tasks) | A 63–65.5 |
| Backpack | 14 (bo'sh), 85 (sovg'alar bilan) | A 59.5; B 243.5 |
| Profil, VIP, Anonymous, Til menyusi | faqat skrinshotlar (videoda yo'q) | sizning skrinshotlaringiz |

**Navigatsiya (videoda ko'ringan):**
Home → ROCKET banner → Rocket · PVP HUB banner → PvP Hub → (PvP kartasi → PvP, TvT kartasi → TvT) · PLAY HUB banner → Play Hub → (Upgrade, Mines, Spins, Plinko, Dice, Crafts) · Box kartasi → Box ekrani → Open → Congratulations oynasi.
Pastki menyu: Backpack · Invite · Home · Leaderboard · Earn. Har bir o'yin ochilganda avval "Checking system status…" (spinner) ekrani chiqadi (B 25.0, 58.5, 104.5, 162.5, 191.5).

---

## 2-QADAM — Ranglar (HEX, kadrdan)

| Token | HEX | Qayerdan |
|---|---|---|
| --bg-page | `#181818` | 42_home @195,640 |
| --bg-header | `#242424` | 42_home @300,20 |
| --bg-nav | `#1e1d1d` | 42_home @40,790 |
| --nav-active | `#7c62ca` | 44_playhub @195,770 |
| --rk-stage | `#191919` | 31 @300,60 |
| --rk-list | `#263334` | 37 @195,500 |
| --rk-row-sep | `#282828` | blocks: 31 |
| --rk-btn-bet (gradient →) | `#2193e3` → `#247be3` | 31 @10,320 / @380,320 |
| --rk-btn-wait / cancel | `#4b5461` | 37, 34 |
| --rk-btn-cashout | `#27d66b` | 38 |
| --rk-trail-fly | `#ded147` (qalinligi 7.5 px) | B 3.6 s |
| --rk-trail-crash | `#c93346` (6.2 px) | B 5.5 s |
| --rk-crash-text | `#ec9e12` (balandlik 52.7 px) | B 6.17 s |
| --rk-count-5 / 4 / 3 / 2 / 1 | `#65a5f4` / `#41e49b` / `#ecc32e` / `#eb6c1b` / `#de3243` | B 8.9 / 9.9 / 10.9 / 11.9 / 12.9 s |
| --rk-chip (binafsha / ko'k / yashil fon) | `#342044` / `#202c44` / `#1c3c24` | 37 |
| --pvp-join (gradient →) | `#f5aa09` → `#f9d848` | 18 |
| --pvphub-pvp-card | `#f5ad1a` | 71 |
| --tvt-add-ice | `#28c1cb` | 07 |
| --tvt-join-fire (nofaol) | `#66646c` | 07 |
| --reward-sell | `#20cd78` | 39 |
| --reward-place-bet | `#1ba9e1` → ko'k | 39 |
| --upgrade-btn (gradient →) | `#33e96d` → `#9efd7e` | 49 |
| Live lenta plitkalari | `#c058f0`, `#30dce8`, `#38a4ec`, `#a05cf0`, `#b06cf4` (har biri gradient) | 42 |

Qolgan har bir blokning rangi (dom/L/R) `measurements/blocks_all.txt` da, 85 holatning hammasi uchun.

## 2-QADAM — O'lchamlar (390 px bo'yicha)

**Home (42_home):**

| Element | x | y | w × h | radius |
|---|---|---|---|---|
| Header | 0 | 0 | 390 × 55.4 | 0 |
| Live plitkalar (7 ta) | 39.0 dan, qadam 46.4 | 73.9 | 43 × 43.8 | 4.8 |
| ROCKET banneri | 10.3 | 131.4 | 371.5 × 88.9 | 12.3 |
| PVP HUB banneri | 10.3 | 231.3 | 371.5 × 88.9 | 11.6 |
| PLAY HUB banneri | 10.3 | 331.2 | 371.5 × 95.8 | 12.3 |
| Free24 kartasi | 10.3 | 435.2 | 179.9 × 258.6 | 17.1 |
| Free kartasi | 201.2 | 435.2 | 180.6 × 258.6 | 16.4 |
| Pastki menyu | 0 | 704.7 | 390 × 106.7 | — |

Bannerlar orasi **10.0 px**, chetdan **10.3 px**, kartalar orasi **11.3 px**.

**Play Hub (44_playhub):** Upgrade 10.3, 131.4, 371.5 × 140.9, r 15.1 · Mines 9.6, 283.3, 183.4 × 159.4 · Spins 199.1, 283.3, 182.7 × 159.4 · ustunlar orasi 6.1 px.

**Rocket (31, 37, 38):** sahna 0–374.9 px · tarix chiplari y 265.5, 49–51 × 30.1, r 7.5, orasi 4.9 · tugma y 301.1, 390 × 54.1, **burchaksiz (to'liq kenglik)** · o'yinchilar ro'yxati 361.9 dan, qatorlar orasi 9.6 px (`#282828`) · sanoq halqasi diametri **122.5 px**, raqam balandligi **39.7 px**.

**PvP:** g'ildirak markazi (189, 238), plitkalar radiusi **161 px**.

Shriftlar: **UNCLEAR** (pastga qarang). Ko'rinishidan geometrik sans-serif, raqamlar qalin (800–900). Aniq nomini kadrdan aniqlab bo'lmaydi.

---

## 3-QADAM — Animatsiyalar jadvali (o'lchanganlari)

| Animatsiya | Nima o'zgaradi | Qiymatlar | Davomiylik | Manba |
|---|---|---|---|---|
| Rocket sanoq | raqam 5→4→3→2→1, halqa (stroke) kamayadi, rang o'zgaradi | rang: yuqoridagi --rk-count-* | har raqam **1000 ms**; 1 dan keyin **1000 ms** o'tib uchish | B 8.8 / 9.8 / 10.8 / 11.8 / 12.8 / 13.8 s |
| Rocket uchish | NFT sovg'a iz uchida, iz `#ded147` + porlash, yulduzlar (pastel nuqtalar) suzadi | — | — | B 0–4.8 s |
| Rocket sovg'a almashishi | uchish paytida sovg'a rasmi boshqasiga almashadi, ostida model nomi chipi ("Onyx Black") | — | ~170 ms (4.00 → 4.17 s) | B 4.0–4.83 s |
| Rocket portlash | 1) to'q sariq/qizil yulduz-portlash, 2) oq-oltin yulduz, 3) kengayadigan oltin halqa (61→94 px) so'nadi | iz shu kadrda qizil `#c93346` | jami **≈830 ms** (5.00 → 5.83 s) | B 5.00–5.83 s |
| Rocket crash raqami | "80.03x" `#ec9e12` paydo bo'ladi | balandlik 52.7 px | portlashdan **1170 ms** keyin | B 6.17 s |
| PvP sanoq | "00:07" → "00:00" | — | sekundiga 1 | A 70–76 s |
| PvP → LIVE | 00:00 da **~1170 ms** turadi, keyin "LIVE" pill + avatarlar to'liq kenglikdagi lentaga aylanadi, markazda ko'k chiziq | — | — | A 76.0 → 77.17 s |
| PvP lenta | chapga suriladi, sekinlashib boradi (82.7 s da 0.5 s ichida ~2 karta; 84 s da 0.8 s ichida ~1 karta) | — | ≥ 8 s (oxiri videoda yo'q) | A 77.17–85.8 s |
| PvP g'ildirak | kutish paytida soat yo'nalishida aylanadi | **4.8°/s** (1 aylanish ≈ 75 s); LIVE paytida turadi | cheksiz | A 72 → 75 s |
| Rocket banneri chiplari | katta chip x1.51 → x1.78 → x2.19 → x2.49 (jonli), kichiklari x1.00 | — | qiymat har ~0.25 s | B 194.8–197.4 s |

Hali o'lchanmaganlar (keyingi navbat — har kadr, 30 fps): Box reel, Upgrade strelkasi, Mines katakchalari, Spins tushishi, Plinko to'pi, Dice slayderi, Crafts shari, oynalarning ochilishi/yopilishi, tugma bosilganda kichrayishi, pastki menyu almashishi, konfetti.

---

## 4-QADAM — UNCLEAR (sizdan so'rayman)

1. **Shrift nomi** — kadrdan aniqlab bo'lmaydi. Bilsangiz ayting; bo'lmasa Inter qoladimi?
2. **Profil, VIP darajalari, Anonymous mode, Til menyusi** — videoda yo'q, faqat skrinshotlarda. Skrinshotdagi o'lchamlar yetadimi yoki video yuborasizmi?
3. **Deposit oynasi** — videoda ochilmagan. Qanday ko'rinishini bilmayman.
4. **Free24 kartasi bosilganda** nima ochiladi — videoda faqat taymer holati bor.
5. **PvP g'olib oynasi** — videoda PvP raundining oxiri yo'q (85.8 s da hali aylanyapti).
6. **Spins "BIG WIN"** — videoda ko'rinmadi.
7. **Rocket o'yinchilar ro'yxatidagi qator ichi** — video B'da qatorlar bo'sh (faqat yashil/qizil chiziqlar). A'dagi qatorlar juda kichik. Sizning skrinshotingizdagi ("Libertas 0.50 ×1.80") ko'rinish asos bo'ladimi?
8. **NFT sovg'a rasmlari** — kadrdan qirqilmaydi (sizning qoidangiz). Telegram'ning ochiq manbasidan olinadi (hozir ham shunday).
9. **Box rasmlari, banner rasmlari** (ROCKET / PVP HUB / PLAY HUB) — ularda Epic nomi yo'q. Sizning qoidangiz: faqat nom va logo RIKI ga almashtiriladi, qolgani 1:1 qoladi. Shundaymi?
10. **"EPIC GIFT"** yozuvi (PvP g'ildiragidagi bo'sh kartalarda) → **"RIKI GIFT"**. Bot nomi "Ebic Gift" → "RIKI"?
