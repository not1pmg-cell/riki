# RIKI ↔ Epic Gift — ekranma-ekran solishtirish

Asos: telefon kadrlari `frames2/*` (588×1280 → 390 css, Telegram sarlavhasi src 0–122 kesilgan). Desktop kadrlari `frames/*` faqat telefonda yo'q holatlar uchun (desktop UI ~1.176× kichikroq — o'lchovlar telefon masshtabiga o'tkaziladi).
Vosita: `python3 tools/compare.py <ekran>` → `compare/<ekran>.png` (original | RIKI | diff heatmap). Diff = blur 1.2 px dan keyin piksel farqi > 60 bo'lgan ulush (header avatar/balans kabi dinamik joylar maskalangan).
Davom ettirish: shu jadvaldagi ⚠️/❌ qatorlardan boshlanadi.

## Statik holatlar

| Ekran | Original kadr | Diff % | Holat | Qolgan farq |
|---|---|---|---|---|
| home | frames2/01_home.png | 19.2% | ⚠️ | Free24 cooldown holati mock qilinmagan; Live lenta mock TON plitkalari |
| upgrade | frames2/26_upgrade_select_target.png | 9.2% | ⚠️ | kadrda sovg'a tanlangan (Mousse Cake), bizda bo'sh; dial ±3 px |
| mines | frames2/31_mines_cashout.png | 14.6% | ⚠️ | kadr o'yin holatida (Cash Out, ochilgan plitka); ochilgan plitka/bomba san'ati PNG emas |
| pvp | frames2/18_pvp_place_bet_empty.png | 9.2% | ⚠️ | kafel matni RIKI GIFT; o'yinchilar bilan holat (frames/19) qilinmagan |
| tvt | frames/06_tvt_countdown.png | 28.6% | ⚠️ | desktop kadr (scrollbar 380px); halqa sariq (ko'rsatmangiz) |
| playhub | frames2/30_playhub.png (eski joylashuv — yangi videoda Race kartasi qo'shilgan, diff shuning uchun oshgan) | 17.2% | ⚠️ | Crafts kartasi desktopdan; Live lenta mock |
| rocket_wait | frames2/13_rocket_waiting_5.png | 35.3% | ⚠️ | kadrda bet oynasi ochiq; Rocket sahifasi alohida o'lchanadi |
| spins | frames2/34_spins.png | 37.8% | ⚠️ | plitkalar ochilgan holatda; Buy Features/Double Chance kartalari |
| plinko | frames2/37_plinko.png | 33.1% | ⚠️ | piramida o'lchami, Easy/Medium/Hard tugmalari |
| dice | frames2/39_dice.png | 25.1% | ⚠️ | slayder, maydonlar o'lchami |
| crafts | frames2/43_crafts_mode.png | 18.4% | ⚠️ | slotlar, rejim kartalari |
| profile | frames2/48_profile.png | 34.6% | ⚠️ | VIP kartasi, Guest/anonim holat |
| leader | frames2/54_earn.png (kadr nomi xato — aslida Leaderboard) | 9.5% | ⚠️ | qator o'lchamlari, top-3 |
| earn | frames2/55_earn_daily_tasks.png | 21.2% | ⚠️ | vazifalar ro'yxati |
| invite | frames2/60_my_invites.png | 7.7% | ⚠️ | taklif kartasi |
| backpack | frames2/62_backpack_items.png | 22.6% | ⚠️ | bo'sh/to'la holat |
| topup | frames2/65_topup_transfer.png | 12.9% | ⚠️ | TON/Stars tablari |
| pvphub | frames2/14b_pvphub_loaded.png | 29.4% | ⚠️ | kartalar, leaderboard (1d948fe) |
| Boxes (02–09), PvP tarix/g'olib/detallar (16,17,19,20), TvT tarix/fair (23,24), Upgrade natija (28,29), Spins/Plinko/Dice/Crafts qo'shimcha holatlari, VIP/til (49–52), Earn tablar (55–58), My invites (60), Backpack items/withdraw (62,70), Top Up Stars/Transfer (64–69), VIP box (71) | frames2 | — | ❌ | navbatda |

## Harakatlar (motion)

| Ekran | Harakat | Vaqt farqi | Pozitsiya farqi | Holat |
|---|---|---|---|---|
| Rocket | countdown, uchish, iz, portlash | ±1 kadr (oldingi o'lchov, 409.mp4) | ±2 px | ✅ (compare/rocket_strip.png) |
| Upgrade | igna aylanishi → natija | o'lchanmagan | — | ❌ |
| PvP | g'ildirak idle aylanishi (4.8°/s), strip sekinlashuvi | idle ✅, strip ❌ | — | ⚠️ |
| TvT | countdown halqasi, to'p, natija | o'lchanmagan | — | ❌ |
| Qolganlari | — | — | — | ❌ |

## UNCLEAR (videoda ko'rinmaydi — taxmin qilinmadi)
1. Mines oltin chip qiymati: n=3 → 560.62x (k=21), n=1 → 24.37x (k=24). Qoida aniq emas; hozir n>1 da safe−1 ishlatilgan.
2. Pastki menyu faol tugmasi: telefon kadrlarida o'yin ekranlarida binafsha (frames2/18, 31). Siz kulrang dedingiz — kulrang qilindi.
3. TvT countdown halqasi rangi: desktop kadrda binafsha #9573e0; siz sariq dedingiz — sariq #f9bd23.
4. TvT tugmalari (hech kimga qo'shilmagan holat) — kadr yo'q; ko'rsatmangiz bo'yicha Join Ice ko'k-feruza, Join Fire olovrang.
5. TvT ice > 20% bo'lgandagi muz san'ati — kadrlar faqat 6–20% ni ko'rsatadi.
6. PvP qo'lqoplar harakati (bo'sh holatda) — statik kadr.
7. Earn qizil badge — kadrlarda ko'rinmadi.

## Eslatma: kadr nomlari
frames2/53 = Profile, 54 = Leaderboard (qatorlar), 55 = Earn daily, 59 = Wealth ro'yxati, 60 = Invite + "How referral works", 62 = Backpack (sovg'alar), 65 = Top Up Transfer.

## Savol (pul mantiqi)
Backpack: originalda "Sell for 95.29" = sovg'a narxi (100%). Bizda server 95% to'laydi (wallet.py SELL_RATE = 0.95) va "Sell for 90.53" ko'rinadi. 1:1 uchun SELL_RATE = 1.0 kerak — tasdiqlang.

## RACE (yangi o'yin — Screen_Recording_2026-11-27_145037.mp4)
compare/race.png — Betting | Live | Result | History (original vs RIKI)

| Qism | Holat | Izoh |
|---|---|---|
| Config / koeffitsiyent / vaqtlar | ✅ | Fairness oynasidagi Config bilan bir xil. **Config hash biznikida ham `85ab5034d7…` — originalnikiga bayt-ma-bayt mos** |
| Provably fair | ✅ | SHA-256(serverSeed:roundId:configHash) majburiyat; HMAC-SHA256(serverSeed, roundId:configHash:counter), 48-bit, rejection sampling, og'irlik 1e6/k. Brauzerda tekshiriladi (sinov: to'g'ri → ✓, buzilgan tartib → ✕) |
| Trek, banner (o'rmon/shahar), yo'laklar, iz, toj, marra, GO! | ⚠️ | PNG kadrlardan. Sprite'lar — sovg'a rasmlari (CDN), offline'da kadr kesimi |
| Countdown halqa 12→4, katta 3-2-1 | ⚠️ | vaqt o'lchangan (1.0 s/raqam, 0.7 s ko'rinadi, 1.0→0.75 masshtab) |
| GO! | ⚠️ | 24.10–24.50 s: masshtab 0.72→1.0, cho'qqi 24.27 |
| Poyga harakati | ⚠️ | Lider progressi o'lchangan jadval (g'olib 7.75 s da marrada); quvib o'tishlar deterministik (round ID dan) |
| Kartalar, o'rinlar (1st–6th), tanlangan yo'lak rangi | ⚠️ | |
| Natija oynasi, tarix, tafsilotlar, Fairness, How it works, All bets, Bet gifts | ⚠️ | |
| Play Hub kartasi | ⚠️ | statik kadr; kartadagi mini-poyga animatsiyasi UNCLEAR |

UNCLEAR (Race): banner mavzusi qoidasi (o'rmon/shahar — raundga qarab tasodifiy qilindi); Play Hub kartasidagi animatsiya to'liq sikli (videoda kursor bilan yopilgan); "All bets" oynasi videoda ko'rinmadi; "Leaderboard multiplier" ma'nosi.
