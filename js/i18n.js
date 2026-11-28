// =====================================================================
//  RIKI — til: English / O'zbekcha
//  Tanlov: profil → 🌐 EN/UZ (Epic kabi menyu). Botdan ?lang=uz kelsa — shu til.
//  Ishlash usuli: ekrandagi matnlar lug'at bo'yicha avtomatik almashtiriladi
//  (yangi matn qo'shsangiz — shu yerga "English": "O'zbekcha" qatorini yozing).
// =====================================================================
(function () {
'use strict';
const KEY = 'riki_lang';
const q = new URLSearchParams(location.search);
let lang = (q.get('lang') || '').toLowerCase();
try { if (lang === 'uz' || lang === 'en') localStorage.setItem(KEY, lang); else lang = localStorage.getItem(KEY) || '' } catch (e) {}
if (lang !== 'uz' && lang !== 'en') lang = 'en';   // standart — ingliz (original kabi); o'zbekcha faqat tanlanganda

const UZ = {
  "Betting Open": "Tikish ochiq",
  "Starting": "Boshlanmoqda",
  "Final stretch": "So'nggi masofa",
  "Photo finish": "Foto-finish",
  "Finished": "Tugadi",
  "bet": "tikdi",
  "on": "→",
  "players": "o'yinchi",
  "Pot": "Fond",
  "All bets": "Barcha tikishlar",
  "Leader": "Yetakchi",
  "winners": "g'olib",
  "winner": "g'olib",
  "next in": "keyingisi",
  "Select a racer above": "Yuqoridan poygachini tanlang",
  "Race in progress": "Poyga davom etmoqda",
  "Bets open in": "Tikishlar ochiladi:",
  "Bet on": "Tikish:",
  "WINNER": "G'OLIB",
  "ROUND": "RAUND",
  "chance": "imkoniyat",
  "Winners": "G'oliblar",
  "Paid out": "To'landi",
  "No winners this round": "Bu raundda g'olib yo'q",
  "No bets yet": "Hali tikish yo'q",
  "Send gifts or open boxes to get some": "Sovg'a yuboring yoki quti oching",
  "Race history": "Poygalar tarixi",
  "All races": "Barcha poygalar",
  "My races": "Mening poygalarim",
  "Winners of the last 100 races": "Oxirgi 100 poyga g'oliblari",
  "No completed races yet": "Hali tugagan poyga yo'q",
  "Finish order": "Marra tartibi",
  "Lost": "Yutqazdi",
  "Staked": "Tikilgan",
  "Fairness": "Adolatlilik",
  "Server seed is revealed after the race": "Server seed poygadan keyin ochiladi",
  "Verified: the commitment and finishing order match.": "Tasdiqlandi: majburiyat va marra tartibi mos.",
  "Verification failed": "Tekshiruv muvaffaqiyatsiz",
  "Round": "Raund",
  "Server seed": "Server seed",
  "Config hash": "Config hash",
  "Config": "Config",
  "SHA-256 commits the seed and configuration before betting. HMAC-SHA256 with the round ID, config hash and an incrementing counter draws the finishing order using rejection sampling and the published weights. Verification runs on this device.": "SHA-256 seed va sozlamalarni tikishdan oldin qayd etadi. HMAC-SHA256 raund ID, config hash va o'suvchi hisoblagich bilan e'lon qilingan og'irliklar asosida (rejection sampling) marra tartibini chiqaradi. Tekshiruv shu qurilmada bajariladi.",
  "How Race works": "Race qanday ishlaydi",
  "Pick, bet, watch": "Tanlang, tiking, tomosha qiling",
  "Pick a racer": "Poygachini tanlang",
  "Higher multiplier means a lower chance to win": "Koeffitsiyent qancha yuqori bo'lsa, yutish imkoniyati shuncha past",
  "Place your bet": "Tikishni qiling",
  "Bet TON or gifts before the countdown ends": "Sanoq tugashidan oldin TON yoki sovg'a tiking",
  "Watch the race": "Poygani tomosha qiling",
  "The winner is decided by the published, verifiable weights": "G'olib e'lon qilingan, tekshirsa bo'ladigan og'irliklar bilan aniqlanadi",
  "Multipliers & chances": "Koeffitsiyentlar va imkoniyatlar",
  "Not enough balance": "Balans yetarli emas",
  "Min bet is": "Minimal tikish",
  "Max bet is": "Maksimal tikish",
  "Round in progress": "Raund boshlangan",
  'Add to Ice': "Ice'ga qo'shish",
  'Add to Fire': "Fire'ga qo'shish",
  'How referral works': "Taklif qanday ishlaydi",
  'Got it': "Tushunarli",
  'Share your referral link with friends.': "Taklif havolangizni do'stlaringizga yuboring.",
  'Sell for': "Sotish",
  'Waiting for players..': "O'yinchilar kutilmoqda..",
  'WAITING': "KUTILMOQDA",
  'Send gifts to': "Sovg'alarni yuboring:",
  'our gift bot': "sovg'a botimizga",
  'Use them in upgrades and games': "Ularni upgrade va o'yinlarda ishlating",
  'TON amount': "TON miqdori",
  'SELECT GIFTS TO UPGRADE': "UPGRADE UCHUN SOVG'A TANLANG",
  'Waiting for Ice': "Ice kutilmoqda",
  'Waiting for Fire': "Fire kutilmoqda",
  'All': "Hammasi",
  // pastki menyu va sarlavha
  'Backpack': 'Ryukzak', 'Invite': 'Taklif', 'Home': 'Asosiy', 'Leaderboard': 'Reyting', 'Earn': 'Ishlash',
  'Your balance': 'Balansingiz', 'Deposit': 'Depozit', 'Live': 'Jonli',
  // umumiy
  'FREE': 'BEPUL', 'Free': 'Bepul', 'Free 24h': 'Bepul 24s', 'HOT': 'TOP', 'NEW': 'YANGI', 'LIMITED': 'CHEKLANGAN',
  'Random': 'Tasodifiy', 'Players': "O'yinchilar", 'Player': "O'yinchi", 'Join': "Qo'shilish", 'Join ›': "Qo'shilish ›",
  'Close': 'Yopish', 'Cancel': 'Bekor qilish', 'Confirm': 'Tasdiqlash', 'Done': 'Tayyor', 'Search...': 'Qidirish...',
  'Copied ✓': 'Nusxalandi ✓', 'Updated': 'Yangilandi', 'Loading...': 'Yuklanmoqda...', 'History': 'Tarix',
  'How it works': 'Qanday ishlaydi', 'Hide details ⌃': 'Yashirish ⌃', 'Balance': 'Balans', 'Gifts': "Sovg'alar", 'Stars': 'Stars',
  // qutilar
  'Open': 'Ochish', 'Top Up Balance': "Balansni to'ldirish", 'Possible Outcomes': 'Mumkin natijalar',
  'Collections in this Box': 'Qutidagi kolleksiyalar', "What's inside": 'Ichida nima bor', 'BOOST': 'BOOST',
  'Higher boost — better drops': "Boost qancha baland — sovg'a shuncha yaxshi",
  'Daily Box': 'Kunlik quti', 'Open Daily Box': 'Kunlik qutini ochish', 'Daily Rewards': 'Kunlik mukofotlar',
  'Latest TOP drops': "So'nggi TOP yutuqlar", 'Congratulations!': 'Tabriklaymiz!', 'Keep Gift': "Sovg'ani saqlash",
  'Free Box': 'Bepul quti', 'Open Free Box': 'Bepul qutini ochish', 'Activate': 'Faollashtirish', 'Promo code': 'Promo-kod',
  'Enter a promo code to open this box': 'Bu qutini ochish uchun promo-kod kiriting',
  'Promo codes are posted in our channel and giveaways.': "Promo-kodlar kanalimiz va giveaway'larda e'lon qilinadi.",
  // rocket
  'Place bet': 'Tikish', 'Place Bet': 'Tikish', 'Waiting': 'Kutilmoqda', 'Cash Out': 'Pulni olish', 'Cash out': 'Pulni olish',
  'Cancel Bet': 'Tikishni bekor qilish', 'No players yet': "Hali o'yinchi yo'q", 'Wait for next round': 'Keyingi raundni kuting', 'No Players Yet': "Hali o'yinchi yo'q", 'Waiting for next round...': 'Keyingi raund kutilmoqda...',
  'Available Balance': 'Mavjud balans', 'Bet Amount': 'Tikish summasi', 'Auto cashout': 'Avto olish', 'Rocket Reward!': 'Rocket yutug\'i!',
  'Place bet in rocket': "Rocket'da tikish", 'Sell': 'Sotish', 'Keep': 'Saqlash',
  // PvP / TvT
  'Winner takes all': "G'olib hammasini oladi", 'Winning team splits the pot': "G'olib jamoa potni bo'lishadi",
  'Total pot': 'Umumiy pot', 'TOTAL POOL': 'UMUMIY POT', 'Join the Battle': "Jangga qo'shilish", 'Waiting for players': "O'yinchilar kutilmoqda",
  'Waiting for other players to join...': "Boshqa o'yinchilar kutilmoqda...", 'Last Game': "Oxirgi o'yin", 'Top of the Day': 'Kun yetakchisi',
  'PvP leaderboard': 'PvP reytingi', 'Winner': "G'olib", 'Rewards': 'Mukofotlar', 'You': 'Siz', 'Unranked': "Reytingda yo'q",
  'Join Ice': "Ice'ga qo'shilish", 'Join Fire': "Fire'ga qo'shilish", 'Fire wins!': "Fire g'olib!", 'Ice wins!': "Ice g'olib!",
  'Increase Your Bet': 'Tikishni oshirish', 'Bet gifts': "Sovg'a tikish", 'No Gifts Available': "Sovg'alar yo'q", 'Send Gifts': "Sovg'a yuborish",
  'Open Boxes': 'Qutilarni ochish', 'OR': 'YOKI',
  // Play hub o'yinlari
  'Select Gifts': "Sovg'alarni tanlang", 'From your backpack': 'Ryukzakingizdan', 'Choose Target': 'Maqsadni tanlang',
  'Or use a preset below': 'Yoki pastdagi tayyorlardan foydalaning', 'Select gifts to upgrade': "Upgrade uchun sovg'a tanlang",
  'Select target to upgrade': 'Upgrade uchun maqsad tanlang', 'Upgrade': 'Upgrade', 'Upgrade Successful!': 'Upgrade muvaffaqiyatli!',
  'Enter a bet amount': 'Tikish summasini kiriting', 'Amount': 'Summa', 'Easy': 'Oson', 'Medium': "O'rta", 'Hard': 'Qiyin',
  'Multiplier': "Ko'paytiruvchi", 'Higher': 'Yuqori', 'Lower': 'Past', 'Chance Of Winning': 'Yutish ehtimoli',
  'Buy Features': 'Bonus sotib olish', 'Double Chance': 'Ikki barobar imkon', 'Speed': 'Tezlik', 'Auto Bet': 'Avto tikish', 'BIG WIN': 'KATTA YUTUQ',
  'Craft Mode': 'Craft rejimi', 'Combine your gifts to craft a new one': "Sovg'alaringizni birlashtirib yangisini yarating",
  'Craft Slots': 'Craft joylari', 'Add at least 2 gifts to start': "Boshlash uchun kamida 2 ta sovg'a qo'shing",
  'Safe': 'Xavfsiz', 'Normal': 'Oddiy', 'Risky': 'Xavfli', 'min cost': 'min narx', 'Craft Successful!': 'Craft muvaffaqiyatli!',
  // reyting
  'Ends in': 'Tugashiga', 'Prizes & Winners': "Sovrinlar va g'oliblar", 'Top Players': "Eng yaxshi o'yinchilar",
  'Prize': 'Sovrin', 'Points': 'Ochko', 'Wealth': 'Boylik', 'YOU': 'SIZ',
  'Compete with others and win amazing prizes!': "Boshqalar bilan bellashing va ajoyib sovrinlar yuting!",
  'Loading leaderboard...': 'Reyting yuklanmoqda...',
  // earn
  'Giveaways': "Giveaway'lar", 'Your Tickets': 'Chiptalaringiz', 'available': 'mavjud', 'LIMITED TASKS': 'CHEKLANGAN VAZIFALAR',
  'DAILY TASKS': 'KUNLIK VAZIFALAR', 'ONE-TIME TASKS': 'BIR MARTALIK VAZIFALAR', 'Bet': 'Tikish', 'Claim': 'Olish', 'Claimed': 'Olindi',
  'Daily check-in': 'Kunlik kirish', 'Invite friends': 'Do\'stlarni taklif qilish', 'Subscribe': "Obuna bo'lish", 'Go': "O'tish",
  // invite
  'Earn up to': 'Ishlang', 'by inviting friends': "do'stlarni taklif qilib", 'from their deposits': 'ularning depozitidan',
  'Also by': 'Yana', 'for each': 'har biri uchun', 'but no more than': 'lekin kuniga', 'per day': 'tadan ko\'p emas',
  'Invite Friends': "Do'stlarni taklif qilish", 'Copy Link': 'Havolani nusxalash', 'Total earned': 'Jami ishlangan',
  'Earned today': 'Bugun ishlangan', 'My Invites': 'Takliflarim', 'No invites yet': "Hali taklif yo'q",
  // backpack
  'Your backpack is empty': "Ryukzakingiz bo'sh", 'Send gift': "Sovg'a yuborish", 'Buy Gifts': "Sovg'a sotib olish", 'Your Gifts': "Sovg'alaringiz",
  'Gifts sent to the bot will appear here automatically.': "Botga yuborilgan sovg'alar bu yerda avtomatik paydo bo'ladi.",
  'Withdraw': 'Yechib olish', 'Play Hub': 'Play Hub', 'Need help?': 'Yordam kerakmi?', 'support': 'yordam',
  // profil / VIP
  'VIP-STATUS': 'VIP-HOLAT', 'No status': "Holat yo'q", 'Turnover': 'Aylanma', 'VIP Levels': 'VIP darajalar',
  'Reach Silver to claim': 'Olish uchun Silver darajasiga yeting', 'Current': 'Joriy', 'maximum level': 'maksimal daraja', 'max reached': 'maksimumga yetildi',
  'PLAYBONUS accumulates automatically and can be claimed after reaching Silver level.': "PLAYBONUS avtomatik yig'iladi va Silver darajasidan keyin olinadi.",
  'Anonymous mode': 'Anonim rejim', 'Hide my name and photo': 'Ismim va rasmimni yashirish', 'Your secret identity': 'Maxfiy ismingiz',
  'Other players see you under this name.': "Boshqa o'yinchilar sizni shu ism bilan ko'radi.", 'Language': 'Til',
  'Exclusive Promo Codes': 'Maxsus promo-kodlar', 'Surprise Gift Drops': "Kutilmagan sovg'alar", 'Exclusive VIP Giveaways': "Maxsus VIP giveaway'lar",
  'Dedicated VIP Manager': 'Shaxsiy VIP menejer', 'Bonus From VIP Manager': 'VIP menejerdan bonus',
  // depozit
  'Top Up': "To'ldirish", 'Connect Wallet': 'Hamyonni ulash', 'Other Crypto': 'Boshqa kripto',
  'No drops yet — be the first!': "Hali yutuq yo'q — birinchi bo'ling!", 'Loading live drops...': 'Jonli yutuqlar yuklanmoqda...', 'To': 'Keyingi:',
  'Recipient': 'Qabul qiluvchi', 'Username or ID': 'Username yoki ID', 'Transfer': "O'tkazma", 'User not found': 'Foydalanuvchi topilmadi', 'Insufficient balance': 'Balans yetarli emas', 'Withdraw request sent': "Yechib olish so'rovi yuborildi",
  'Server is not connected': 'Server ulanmagan', 'Connecting to server…': 'Serverga ulanmoqda…', 'Retry': 'Qayta urinish'
};
const RX = [   // o'zgaruvchan matnlar
  [/^Play (\w+) (\d+) times$/, (m, g, n) => `${g}'ni ${n} marta o'ynang`],
  [/^Play (\d+) (\w+) rounds$/i, (m, n, g) => `${g}'da ${n} raund o'ynang`],
  [/^Drop (\d+) balls in Plinko$/, (m, n) => `Plinko'da ${n} ta to'p tashlang`],
  [/^Progress: (.*)$/, (m, x) => `Jarayon: ${x}`],
  [/^(\d+) remaining$/, (m, n) => `${n} ta qoldi`],
  [/^Starts in (\d+)s$/, (m, n) => `${n}s dan keyin`],
  [/^Open for (.*)$/, (m, x) => `${x} ga ochish`],
  [/^To (.*) Level$/, (m, x) => `${x} darajasigacha`],
  [/^(.*) left$/, (m, x) => `${x} qoldi`],
  [/^Win up to (\d+)x$/, (m, n) => `${n}x gacha yuting`],
  [/^Send ([\d.,]+) (\w+)$/, (m, v, c) => `${v} ${c} yuborish`],
  [/^Send \((\d+)\) - (.*)$/, (m, n, v) => `Yuborish (${n}) - ${v}`],
  [/^(\S+) Box$/, (m, x) => `${x} qutisi`],
  [/^(\S+) Turnover$/, (m, x) => `${x} aylanma`],
  [/^(\w+) Level$/, (m, x) => `${x} darajasi`]
];

function tr(s) {
  if (lang !== 'uz' || !s) return s;
  const k = s.trim(); if (!k) return s;
  let v = UZ[k];
  if (v == null) for (const [re, f] of RX) { if (re.test(k)) { v = k.replace(re, f); break } }
  return v == null ? s : s.replace(k, v);
}
window.T = tr;
window.LANG = () => lang;
window.setLang = l => { lang = l === 'uz' ? 'uz' : 'en'; try { localStorage.setItem(KEY, lang) } catch (e) {} location.reload() };

// ekrandagi matnlarni avtomatik tarjima qilish
const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, svg: 1 };
function walk(root) {
  if (lang !== 'uz' || !root) return;
  if (root.nodeType === 3) { const t = tr(root.nodeValue); if (t !== root.nodeValue) root.nodeValue = t; return }
  if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
  if (root.placeholder) { const t = tr(root.placeholder); if (t !== root.placeholder) root.placeholder = t }
  for (let c = root.firstChild; c; c = c.nextSibling) walk(c);
}
if (lang === 'uz') {
  document.documentElement.lang = 'uz';
  const start = () => {
    walk(document.body);
    new MutationObserver(ms => ms.forEach(m => { if (m.type === 'characterData') walk(m.target); else m.addedNodes.forEach(walk) }))
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
}
})();
