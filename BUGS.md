# BUGS — Playwright o'yin testlari (tools/test_*.py)

## Mines (tools/test_mines.py) — 2026-11-27
| # | Test | Natija |
|---|---|---|
| 1 | Miqdorsiz katakka bosish | ✅ raund boshlanmaydi, maydonga fokus |
| 2 | Miqdor + katak → raund boshlanadi va katak ochiladi | ✅ |
| 3 | Raund paytida minalar sonini o'zgartirish | ✅ bloklangan |
| 4 | 5 raund ketma-ket: katak + Cash Out (ikki marta bosish) | ✅ balans to'g'ri (bitta to'lov) |
| 5 | Minaga bosish → animatsiya paytida Cash Out / yangi raund | ✅ bloklangan, 0.92 s dan keyin tiklanadi |
| 6 | Juda katta tikish (999999) | ✅ raund boshlanmaydi → Top Up ochiladi |
| 7 | Raund paytida boshqa ekranga o'tib qaytish | ✅ raund saqlanadi |
| — | Konsol xatolari | faqat sovg'a rasmlari CDN (sinov muhitida internet yo'q) |

Tuzatilgan: splash ikki marta o'chirilganda xato (screens.js) — himoya qo'shildi.

## Rocket (tools/test_rocket.py) — 2026-11-27
| # | Test | Natija |
|---|---|---|
| 1 | Kutish: tugma "Place bet" | ✅ |
| 2 | Ro'yxat 1 s davomida bir xil (ikki renderer almashib miltillamaydi) | ✅ (tuzatildi: screens.js va epic-rocket.js ikkalasi #rkPl ni chizardi) |
| 3 | TON tikish: tugma "Place 5.00 TON Bet", balansdan yechiladi, tugma "Waiting" | ✅ |
| 4 | Uchish: "Cash Out" → to'lov, keyin tugma "Place bet" (409.mp4 10:44) | ✅ (tuzatildi: "✓ Won …" va "Cashed out ✓" matnlari o'chirildi) |
| 5 | Cash Out ikki marta bosish | ✅ bitta to'lov |
| 6 | Portlash: "2.21x" #21c35c, yutqazgan qator qizil, qiymat amt×crash | ✅ (tuzatildi: rang ko'k edi, qiymat amt edi) |
| 7 | Gifts tabi: tanlovsiz "Choose a gift", karta bosilganda yuqori karta + "Choose a different gift:" | ✅ |
| 8 | Sovg'a tikish va uni bekor qilib bo'lmasligi | ✅ |
| — | Konsol xatolari | 0 |

Tuzatilgan: tugma klassini app.js va epic-rocket.js navbatma-navbat o'zgartirardi (Cash Out ko'k bo'lib qolardi) — endi faqat epic-rocket.js.
