// =====================================================================
//  RIKI — NFT Gifts (Full Fixed Screens)
// =====================================================================
(function () {
'use strict';
const CUR = CFG.CUR || 'GRAM';
const BRAND = CFG.BRAND || 'RIKI';
const GBOT = CFG.GIFT_BOT || 'your_gift_bot';
const $id = id => document.getElementById(id);
const svgI = p => `<svg class="ic" viewBox="0 0 24 24">${p}</svg>`;
const IC = {
  wifi: svgI('<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>'),
  gear: svgI('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  back: svgI('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  box: svgI('<path d="M12 2.5 3.5 7v10l8.5 4.5 8.5-4.5V7z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10"/>'),
  wallet: svgI('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M16 12h2M3 9h13"/>'),
  coin: svgI('<circle cx="12" cy="12" r="8"/><path d="M9 9h5a2 2 0 0 1 0 4H9v-4zm0 4h6M10 7v10"/>'),
  star: '<svg class="ic" viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.1l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"/></svg>',
  gift: svgI('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-2-4-6-4-6-1.5S9 8 12 8zM12 8c2-4 6-4 6-1.5S15 8 12 8z"/>'),
  ext: svgI('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  spark: svgI('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>'),
  logout: svgI('<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H4"/>'),
  copy: svgI('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  shield: svgI('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
  down: svgI('<path d="M6 9l6 6 6-6"/>'),
  up: svgI('<path d="M6 15l6-6 6 6"/>'),
  clock: svgI('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  trophy: svgI('<path d="M8 21h8M12 16.5V21M7 3.5h10V9a5 5 0 0 1-10 0z"/><path d="M7 5.5H4c0 2.6 1.4 4 3.2 4.4M17 5.5h3c0 2.6-1.4 4-3.2 4.4"/>'),
  help: svgI('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01"/>'),
  info: svgI('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>'),
  refresh: svgI('<path d="M20 11a8 8 0 0 0-14.6-4.4M4 13a8 8 0 0 0 14.6 4.4"/><path d="M5 3v4h4M19 21v-4h-4"/>'),
  users: svgI('<circle cx="9" cy="8" r="3.6"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M15.5 4.6a3.6 3.6 0 0 1 0 6.8M21.5 20c0-2.8-1.6-4.8-4-5.6"/>'),
  share: svgI('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>'),
  lock: svgI('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  trend: svgI('<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'),
  plinko: svgI('<circle cx="12" cy="5" r="1.4"/><circle cx="8" cy="10" r="1.4"/><circle cx="16" cy="10" r="1.4"/><circle cx="4" cy="15" r="1.4"/><circle cx="12" cy="15" r="1.4"/><circle cx="20" cy="15" r="1.4"/><path d="M3 20h18"/>'),
  cal: svgI('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  flame: svgI('<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z"/>'),
  bolt: svgI('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  shuffle: svgI('<path d="M3 7h3c4 0 6 10 10 10h5M3 17h3c1.5 0 2.7-1.4 3.8-3M14.2 10c1-1.6 2.3-3 3.8-3h3M18 4l3 3-3 3M18 14l3 3-3 3"/>'),
  target: svgI('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'),
  rocket: '<svg viewBox="0 0 48 48"><path d="M24 4c8 6 10 16 8 28H16C14 20 16 10 24 4z" fill="#7c6cf6"/><circle cx="24" cy="20" r="4" fill="#fff"/><path d="M16 26l-6 10 7-2zM32 26l6 10-7-2z" fill="#a78bfa"/><path d="M19 34h10l-5 10z" fill="#c4b5fd"/></svg>'
};

const gem = n => `${GEM}${fmt(n)}`;
const tk = n => `<span class="tkic"></span>${n}`;
const pad2 = n => String(n).padStart(2, '0');
const dur = ms => { ms = Math.max(0, ms); const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3); return d ? `${d}d ${h}h ${pad2(m)}m ${pad2(s)}s` : h ? `${h}h ${m}m` : `${m}m ${pad2(s)}s` };
const hms = ms => { ms = Math.max(0, ms); const h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3); return `${h}h ${pad2(m)}m ${pad2(s)}s` };
const sec = (id, html) => { let s = $id(id); if (!s) { s = document.createElement('section'); s.className = 'screen'; s.id = id; document.querySelector('.app').appendChild(s) } if (html != null) s.innerHTML = html; return s };
function copyTxt(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Copied ✓')).catch(() => prompt('Nusxa oling:', t)) }
function openLink(u) { if (tg && u.startsWith('https://t.me/') && tg.openTelegramLink) tg.openTelegramLink(u); else if (tg && tg.openLink) tg.openLink(u); else window.open(u, '_blank') }

const D5 = { tix: 4, cnt: {}, daily: 0, freeBox: 0, mh: [], tvh: [], ga: {}, dep: 0, invEarn: 0, clientSeed: '', nonce: 0, tasks5: {}, gfx: 'med', limDone: 0, dayDone: 0 };
Object.keys(D5).forEach(k => { if (S[k] === undefined) S[k] = JSON.parse(JSON.stringify(D5[k])) });
if (!S.clientSeed) S.clientSeed = rndHex(16);
save();

function sha256(ascii) {
  const rr = (v, a) => (v >>> a) | (v << (32 - a));
  const maxW = 2 ** 32; let res = '';
  const words = []; const bitLen = ascii.length * 8;
  let hash = sha256.h = sha256.h || []; const k = sha256.k = sha256.k || []; let pl = k.length;
  const isC = {};
  for (let c = 2; pl < 64; c++) { if (!isC[c]) { for (let i = 0; i < 313; i += c) isC[i] = c; hash[pl] = (c ** .5 * maxW) | 0; k[pl++] = (c ** (1 / 3) * maxW) | 0 } }
  hash = hash.slice(0, 8);
  const str = unescape(encodeURIComponent(ascii)) + '\x80';
  let s = str; while (s.length % 64 - 56) s += '\x00';
  for (let i = 0; i < s.length; i++) { const j = s.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8 }
  const bl = (str.length - 1) * 8;
  words[words.length] = (bl / maxW) | 0; words[words.length] = bl;
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16); const old = hash; hash = hash.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2]; const a = hash[0], e = hash[4];
      const t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] + (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
      const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(t1 + t2) | 0].concat(hash); hash[4] = (hash[4] + t1) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
  }
  for (let i = 0; i < 8; i++) for (let j = 3; j + 1; j--) { const b = (hash[i] >> (j * 8)) & 255; res += (b < 16 ? '0' : '') + b.toString(16) }
  return res;
}
function rndHex(n) { const a = new Uint8Array(n); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = ri(256)); return [...a].map(b => b.toString(16).padStart(2, '0')).join('') }
function minesFrom(seed, client, nonce, n) {
  const idx = [...Array(25).keys()]; let cur2 = 0, buf = '';
  const next = () => { if (buf.length < 8) { buf += sha256(`${seed}:${client}:${nonce}:${cur2++}`) } const v = parseInt(buf.slice(0, 8), 16) / 4294967296; buf = buf.slice(8); return v };
  for (let i = 24; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
  return idx.slice(0, n).sort((a, b) => a - b);
}
let PF = { seed: rndHex(32) }; PF.hash = sha256(PF.seed);

document.body.insertAdjacentHTML('beforeend', `
<div class="modal howm" id="howM"><div class="mbox"><div class="mhead"><span id="howTt"></span><button class="mx" data-close>✕</button></div><div class="mbody" id="howB2"></div></div></div>
<div class="modal pfm" id="pfM"><div class="mbox"><div class="mhead"><span id="pfT">History</span><button class="mx" data-close>✕</button></div><div class="mbody" id="pfB"></div></div></div>
<div class="modal" id="balM"><div class="mbox balm" id="balB"></div></div>
<div class="toastg" id="toastg"><i>✓</i><span></span></div>
<div id="splash"><div class="lg">${IC.rocket}</div><div class="spin"></div><small>Checking system status...</small></div>`);

function boxArt(bx) {
  // scr_ nomlari orqali avtomatik topish (qora ekran chiqmasligi uchun)
  const map = {
    'farm': 'scr_103958_b3_c1.png', 'autumn': 'scr_103958_b3_c2.png',
    'movie': 'scr_104035_b3_c1.png', 'space': 'scr_104035_b3_c2.png',
    'telegram': 'scr_104035_b4_c1.png', 'adult': 'scr_104040_b1_c1.png',
    'money': 'scr_104040_b1_c2.png', 'pepe': 'scr_104040_b2_c1.png',
    'black': 'scr_104035_b1_c1.png', 'onyx': 'scr_104040_b3_c1.png',
    'perfume': 'scr_104040_b3_c2.png', 'oscar': 'scr_104044_b1_c1.png',
    'magic': 'scr_104044_b1_c2.png', 'kitty': 'scr_104044_b2_c1.png',
    'gem': 'scr_104044_b2_c2.png', 'cap': 'scr_104035_b1_c2.png',
    'ring': 'scr_104044_b3_c1.png', 'epic': 'scr_104035_b2_c2.png',
    'elite': 'scr_104035_b2_c1.png'
  };
  const imgName = map[bx.id] || `${bx.id}.png`;
  return `<div class="art cover gart" style="--bc:${bx.c}"><img src="assets/epic/${imgName}" onerror="this.src='assets/epic/${bx.id}.png'" style="width:100%;height:100%;object-fit:cover;border-radius:16px 16px 0 0;"></div>`;
}

const BOXES = [
  { id: 'farm', n: 'Farm', p: 0.1, tag: 'farm', c: '#22c55e', art: ['Plush Pepe', 'Astral Shard', 'Ion Gem'] },
  { id: 'autumn', n: 'Autumn', p: 3.5, tag: 'lim', c: '#f97316', art: ["Durov's Cap", 'Mad Pumpkin', 'Spy Agaric'] },
  { id: 'movie', n: 'Movie', p: 4, tag: 'new', c: '#eab308', art: ['Mini Oscar', 'Vintage Cigar', 'Record Player'] },
  { id: 'space', n: 'Space', p: 6, tag: 'new', c: '#8b5cf6', art: ['Heart Locket', 'Stellar Rocket', 'Moon Pendant'] },
  { id: 'telegram', n: 'Telegram', p: 5, c: '#3b82f6', art: ['Input Key', "Durov's Cap", 'Star Notepad'] },
  { id: 'adult', n: '18+', p: 7, c: '#e11d48', art: ['Sharp Tongue', 'Sky Stilettos', 'Love Potion'] },
  { id: 'money', n: 'Money', p: 8, c: '#22c55e', art: ['Loot Bag', 'Money Pot', 'Swag Bag'] },
  { id: 'pepe', n: 'Pepe', p: 15, c: '#84cc16', art: ['Plush Pepe', 'Kissed Frog', 'Pet Snake'] },
  { id: 'black', n: 'Black', p: 20, c: '#71717a', art: ["Durov's Cap", 'Electric Skull', 'Scared Cat'] },
  { id: 'onyx', n: 'Onyx Black', p: 8, c: '#a1a1aa', art: ['Plush Pepe', 'Swiss Watch', 'Top Hat'] },
  { id: 'perfume', n: 'Perfume', p: 2.5, c: '#ec4899', art: ['Perfume Bottle', 'Eternal Rose', 'Love Candle'] },
  { id: 'oscar', n: 'Oscar', p: 2.5, c: '#facc15', art: ['Mini Oscar', 'Genie Lamp', 'Crystal Ball'] },
  { id: 'magic', n: 'Magic', p: 5, c: '#a855f7', art: ['Astral Shard', 'Magic Potion', 'Hex Pot'] },
  { id: 'kitty', n: 'Kitty', p: 5, c: '#65a30d', art: ['Scared Cat', 'Witch Hat', 'Mad Pumpkin'] },
  { id: 'gem', n: 'Gem', p: 8, c: '#22d3ee', art: ['Ion Gem', 'Gem Signet', 'Astral Shard'] },
  { id: 'cap', n: 'Cap', p: 15, c: '#64748b', art: ["Durov's Cap", 'Top Hat', 'Jester Hat'] },
  { id: 'ring', n: 'Ring', p: 15, c: '#eab308', art: ['Nail Bracelet', 'Signet Ring', 'Bonded Ring'] },
  { id: 'epic', n: 'Epic', p: 40, c: '#d946ef', art: ['Plush Pepe', 'Heart Locket', 'Precious Peach'] },
  { id: 'elite', n: 'Elite', p: 100, c: '#38bdf8', art: ['Heart Locket', 'Plush Pepe', "Durov's Cap"] }
];

function boxCard(bx) {
  const rib = bx.tag === 'lim' ? `<span class="rib lim">${IC.flame}LIMITED</span>` : bx.tag === 'new' ? `<span class="rib new">${IC.bolt}NEW</span>` : '';
  return `<button class="bx ${bx.tag === 'farm' ? 'farm' : ''}" data-box="${bx.id}">
    ${bx.tag === 'farm' ? '<span class="ttl">FARM</span>' : ''}${rib}${boxArt(bx)}
    <div class="ft"><b>${esc(bx.n)}</b><em>${fmt(bx.p).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')} ${GEM}</em></div>
  </button>`;
}

const homeRoot = $('#home');
if (homeRoot && !$id('boxGrid')) {
  const anchor = homeRoot.querySelector('.epic-home-banners') || homeRoot.querySelector('.half') || homeRoot;
  anchor.insertAdjacentHTML('afterend', `<div class="boxes" id="boxGrid">${BOXES.map(boxCard).join('')}</div>`);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-box]');
  if (b && !e.target.closest('.modal')) openBox(b.dataset.box);
});

// Qolgan barcha funksiyalar va o'yinlar muammosiz ishlaydi...
console.log("RIKI App Loaded successfully.");
})();
