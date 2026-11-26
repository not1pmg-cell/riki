# Audit — RIKI vs Epic videolari (ui-from-video branch)

Manba kadrlar: `frames/NN_*.png` (vaqtlari `measurements/states.txt` da). Taqqoslash: `compare/*.png` (chapda Epic, o'ngda RIKI).

## 1. Jadval

| Nima | Fayl + qator (o'zgarishdan oldin) | Originalda? | Amal | Holat |
|---|---|---|---|---|
| Roulette o'yini (ekran, live sinxron, tikish, CSS .rl*) | js/screens.js 1386–1503, 1507–1512, 1684–1707, 1787–1800; css .rl* | yo'q | DELETE | ✅ o'chirildi |
| Market / P2P ekrani (mkGen, mkRender, mkBuy, "Sell my gift on P2P") | index.html 237–244; js/app.js 979–1064; js/screens.js 1860–1874 | yo'q | DELETE | ✅ |
| Eski Cases ekrani | index.html 229–235; js/app.js 979–1028 | yo'q | DELETE | ✅ |
| PvP Hub tablari / Roulette kartasi | js/screens.js 1509–1510; css 1406–1414 | yo'q (frames/71) | DELETE | ✅ |
| Welcome oynasi | index.html 305–314; js/app.js 1221 | yo'q | DELETE | ✅ |
| "Reset everything" | index.html 302; js/app.js 1166 | yo'q | DELETE | ✅ |
| "Demo mode" matnlari | js/app.js 1159 | yo'q | DELETE | ✅ |
| Spins "BIG WIN" | index.html 182; js/app.js 833 | videoda yo'q (B 105–125 s) | DELETE | ✅ |
| Profil "Send TON / Send Gift" | js/screens.js 1289, 1293 | yo'q | DELETE → Deposit\|Transfer + Withdraw | ✅ |
| Banner ustidagi oq nur (shimmer) | css 2677–2678 | yo'q | DELETE | ✅ |
| 269 ta ishlatilmagan CSS qoidasi (rkship, rkmodel, boomfx, hchips, mk*, rl*…) | css/style.css | — | DELETE | ✅ |
| "Server is not connected" oynasi | js/screens.js 1222–1229 | yo'q → "Checking system status..." (frames/43, B 25.0 s) | FIX | ✅ |
| Upgrade "How Upgrades Work" | js/screens.js 128 | yo'q (frames/45–51) | DELETE (yashirildi) | ✅ |
| Crafts "+ Add gifts / Clear" | js/screens.js 1978 | yo'q (frames/72–78) | DELETE | ✅ |
| Invite "Also by 5… / Earned today" | js/screens.js 730–732 | yo'q (frames/12,13,84) | DELETE | ✅ |
| Earn offline "LIMITED TASKS" | js/screens.js 833 | yo'q (frames/15,16) | DELETE | ✅ |
| Rocket "BET" chipi, "(you)" | js/screens.js 223, 229 | yo'q | DELETE | ✅ (Rocket qayta qurildi) |
| PvP "(you)" | js/app.js 566 | "YOU" belgisi (frames/19) | FIX | ✅ #433572 / #8069c7 |
| PvP "Hash: …" qatori | js/screens.js 370 | yo'q | DELETE | ✅ |
| Rocket ekrani (sahna, sanoq, iz, portlash, chiplar, tugma, qatorlar) | js/screens.js 155–264, 2301–2355 | bor, boshqacha | FIX | ✅ css/epic-rocket.css, js/epic-rocket.js |
| Rocket vaqtlari (server) | bot.py RK_WAIT 7.0, RK_AFTER 3.0 | 5.0 / 3.8 s (B 5.0–13.8 s) | FIX | ✅ |
| PvP joylashuvi, g'ildirak (161 px, 76 px plitka, 4.8°/s) | css, js/app.js 553–555 | bor, boshqacha | FIX | ✅ css/epic-pvp.css |
| Upgrade joylashuvi va matnlari | js/screens.js 1903–1926 | bor, boshqacha | FIX | ✅ css/epic-upgrade.css |
| Backpack bo'sh holat matnlari | js/screens.js 717 | bor, boshqacha (frames/14) | FIX | ✅ |
| Home Free24/Free/quti paneli, FREE tugmalari | css | bor, boshqacha (frames/17) | FIX | ✅ |
| Pastki menyu "Home" holati | css 2444, 2465 | Home'da to'q, ichki ekranlarda binafsha | FIX | ✅ |
| O'yin ekranlarida header (Upgrade, Crafts) | js/app.js 244 | kichik pill header (frames/45, 72) | FIX | ✅ |
| TvT / Mines / Plinko / Dice pastki panel | css | ekran pastida | FIX | ✅ |
| GRAM belgisi, VIP olmoslari, banner/hub rasmlari | assets/epic2 | kadrdan qirqilgan | KEEP | ✅ |
| Yutuq oynalari (Congratulations / Rocket Reward / Upgrade Successful) | js/screens.js oxiri | bor (frames/24, 30, 51) | KEEP | ✅ |
| TON/Gift transfer backend (`/api/transfer`) + yangi `/api/withdraw` | bot.py | — | KEEP (logic) | ✅ |
| Deposit \| Transfer oynasi, Withdraw + Recipient | js/screens.js oxiri, css/epic-transfer.css | spec.md "ISTISNO" | qurildi | ✅ |
| Profil VIP ro'yxati, Anonymous, til menyusi | js/screens.js 1281–1300 | faqat skrinshotlarda | KEEP | ⚠️ videoda yo'q |
| Rocket sozlama (gear) menyusi "GRAPHICS" | js/screens.js 135 | gear bor, menyu ko'rinmaydi | UNCLEAR | ⚠️ |
| Asosiy header "Your balance / Deposit" | index.html 26–30 | videoda header bo'sh (frames/17, 42) | UNCLEAR | ⚠️ |
| Mines / Spins / Plinko / Dice / Crafts / Box ichki o'lchamlari va animatsiyalari | js/screens.js 1946–2260 | bor | FIX | ⚠️ qisman (pastga qarang) |

## 2. UNCLEAR va qaysi video kerak

| # | Nima | Qanday video yozish kerak |
|---|---|---|
| 1 | Asosiy header (balans + Deposit) Home/Backpack/Earn'da ko'rinadimi | Epic'ni telefonda (Telegram mobil) ochib, Home'dan Backpack, Invite, Leaderboard, Earn'ga o'tish |
| 2 | Deposit oynasining ichi | "+" va "Deposit" tugmasini bosib, oynadagi barcha tablarni ko'rsatish |
| 3 | Profil, VIP, Anonymous mode, til menyusi | Avatar bosilib profil ochilishi, VIP ro'yxatini ochib-yopish, Anonymous va tilni almashtirish |
| 4 | PvP g'olib oynasi va lenta oxiri | Bitta PvP raundini boshidan oxirigacha (lenta to'xtaguncha va oyna chiqquncha) |
| 5 | Rocket: uchish boshlanishi (iz qanday o'sadi), sovg'aning almashish qoidasi, crash raqam rangi chegaralari | Kamida 3 ta to'liq Rocket raundi (har xil koeffitsiyentlar: <2x, 2–10x, >10x) |
| 6 | Rocket o'yinchilar qatorining ichi | Rocket'da o'yinchilar ko'p bo'lgan raund, ekranni yaqinroq/kattaroq yozish |
| 7 | Rocket sozlama (gear) menyusi | Gear tugmasini bosish |
| 8 | Box (case) ochilishi: reel tezligi va to'xtashi | 2–3 ta qutini ochish, ekranni to'liq 30–60 fps |
| 9 | Mines katakcha ochilishi, Plinko shar tushishi, Dice raqami, Spins tushishi, Crafts shari, Upgrade strelkasi — har biri sekinlashtirilmagan holda | Har bir o'yinda 2–3 marta o'ynash |
| 10 | Spins "BIG WIN" (o'chirildi) — Epic'da bormi | Spins'da katta yutuq |
| 11 | Ekranlar orasidagi o'tish animatsiyasi, tugma bosilgandagi effekt | Sekin, bitta-bitta bosib yozilgan video |
| 12 | Free24 kartasi bosilganda | Free24 ni bosish (taymer tugagan holda) |
