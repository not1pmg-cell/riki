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
