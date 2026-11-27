# RIKI ↔ Epic Gift — ekranma-ekran solishtirish

Asos: telefon kadrlari `frames2/*` (588×1280 → 390 css, Telegram sarlavhasi src 0–122 kesilgan). Desktop kadrlari `frames/*` faqat telefonda yo'q holatlar uchun (desktop UI ~1.176× kichikroq — o'lchovlar telefon masshtabiga o'tkaziladi).
Vosita: `python3 tools/compare.py <ekran>` → `compare/<ekran>.png` (original | RIKI | diff heatmap). Diff = blur 1.2 px dan keyin piksel farqi > 60 bo'lgan ulush (header avatar/balans kabi dinamik joylar maskalangan).
Davom ettirish: shu jadvaldagi ⚠️/❌ qatorlardan boshlanadi.

## Statik holatlar

| Ekran | Original kadr | Diff % | Holat | Qolgan farq |
|---|---|---|---|---|
| Home | frames2/01_home | 21.3% | ⚠️ | Live lenta bo'sh (mock yo'q), Free24 kartasi cooldown holatida emas; banner chiplar o'rni ±2 px |
| Upgrade (bo'sh) | frames2/26 (target tanlash) | 9.5% | ⚠️ | Kadrda Mousse Cake tanlangan, bizda bo'sh holat; dial ±3 px |
| Mines | frames2/31 (o'yin davomida) | 14.9% | ⚠️ | Kadr o'yin holatida (Cash Out, ochilgan plitka), bizda bo'sh; ochilgan plitka/bomba san'ati hali PNG emas |
| PvP (bo'sh) | frames2/18 | 9.3% | ⚠️ | Kafel matni "RIKI GIFT" (nom o'zgarishi), kafel soyasi; o'yinchilar bilan holat (frames/19) hali o'lchanmagan |
| TvT (countdown) | frames/06 (desktop) | 29.1% | ⚠️ | Desktop kadrda scrollbar (380 px) — to'g'ri telefon kadri yo'q; halqa sariq (sizning ko'rsatmangiz, desktopda binafsha) |
| PvP Hub | frames2/14b | — | ⚠️ | oldingi commitda (1d948fe) |
| Banners | frames2/01 | — | ⚠️ | avtoskroll/nuqtalar — videoda ko'rinmadi (UNCLEAR) |
| Boxes, Crafts, Dice, Plinko, Spins, Rocket, Backpack, Invite, Leaderboard, Earn, Profile, Top Up, Withdraw, modallar | frames2/02–72 | — | ❌ | navbatda |

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
