// =====================================================================
//  v5 — videodagi ekranlar: Rocket, qutilar, Daily Box, Top Up, Earn,
//  Giveaways, Leaderboard, Invite, Backpack, VIP, Provably Fair tarix
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
  gear: svgI('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
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
const mask = n => n.length <= 4 ? n : n.slice(0, 2) + '***' + n.slice(-2);
const sec = (id, html) => { let s = $id(id); if (!s) { s = document.createElement('section'); s.className = 'screen'; s.id = id; document.querySelector('.app').appendChild(s) } if (html != null) s.innerHTML = html; return s };
function copyTxt(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Copied ✓')).catch(() => prompt('Nusxa oling:', t)) }
function openLink(u) { if (tg && u.startsWith('https://t.me/') && tg.openTelegramLink) tg.openTelegramLink(u); else if (tg && tg.openLink) tg.openLink(u); else window.open(u, '_blank') }

// ---------- holat qo'shimchalari ----------
const D5 = { tix: 4, cnt: {}, daily: 0, freeBox: 0, mh: [], tvh: [], ga: {}, dep: 0, invEarn: 0, clientSeed: '', nonce: 0, tasks5: {}, gfx: 'med', limDone: 0, dayDone: 0 };
Object.keys(D5).forEach(k => { if (S[k] === undefined) S[k] = JSON.parse(JSON.stringify(D5[k])) });
if (!S.clientSeed) S.clientSeed = rndHex(16);
save();

// =====================================================================
//  SHA-256 (provably fair uchun, sinxron)
// =====================================================================
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
// seed + client + nonce -> mina joylari (Fisher–Yates)
function minesFrom(seed, client, nonce, n) {
  const idx = [...Array(25).keys()]; let cur2 = 0, buf = '';
  const next = () => { if (buf.length < 8) { buf += sha256(`${seed}:${client}:${nonce}:${cur2++}`) } const v = parseInt(buf.slice(0, 8), 16) / 4294967296; buf = buf.slice(8); return v };
  for (let i = 24; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
  return idx.slice(0, n).sort((a, b) => a - b);
}
let PF = { seed: rndHex(32) }; PF.hash = sha256(PF.seed);

// =====================================================================
//  MODALLAR: How it works, Provably fair, umumiy
// =====================================================================
document.body.insertAdjacentHTML('beforeend', `
<div class="modal howm" id="howM"><div class="mbox"><div class="mhead"><span id="howTt"></span><button class="mx" data-close>✕</button></div><div class="mbody" id="howB2"></div></div></div>
<div class="modal pfm" id="pfM"><div class="mbox"><div class="mhead"><span id="pfT">History</span><button class="mx" data-close>✕</button></div><div class="mbody" id="pfB"></div></div></div>
<div class="modal" id="balM"><div class="mbox balm" id="balB"></div></div>
<div class="toastg" id="toastg"><i>✓</i><span></span></div>
<div id="splash"><div class="lg">${IC.rocket}</div><div class="spin"></div><small>Checking system status...</small></div>`);
function toastG(t) { const e = $id('toastg'); e.querySelector('span').textContent = t; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 2200) }
function howModal(title, steps, extra) {
  $id('howTt').textContent = title;
  $id('howB2').innerHTML = steps.map((s, i) => `<div class="st1"><i>${i + 1}</i><div><b>${s[0]}</b><small>${s[1]}</small></div></div>`).join('') + (extra || '');
  openM('howM');
}
function balModal(v, g, title) {
  $id('balB').innerHTML = `<button class="mx" data-close style="position:absolute;right:11px;top:11px">✕</button><h3>${title || 'Balance Increased!'}</h3><p>${g ? 'Gift added to your Backpack' : 'Your balance has been updated'}</p><div class="gc">${g ? GIM(g.g || g, g.ms).replace(/loading="lazy"/g, '') : GEM}</div><b>${g ? esc((g.g || g).n) : fmt(v) + ' ' + CUR + ' Balance'}</b><span class="bp">${g ? 'Gift' : 'Balance'}</span><div class="bv">${gem(v)}</div><button class="btn-g" data-close>Continue</button>`;
  openM('balM'); hapN('success');
}
const HOWS = {
  mines: ['How it works', [['Choose how many mines', 'Mines are hidden under the cells of a 5×5 board, and every other cell contains a gem. More mines mean higher multipliers and higher risk.'], ['Place your bet', `Use ${CUR} or pick a gift from your Backpack. A gift is played as one full stake for the round.`], ['Open cells', 'Each gem you find increases your multiplier. If you hit a mine, the round ends and the stake is lost.'], ['Take the win', `You can cash out after any gem. Wins are credited to your ${CUR} balance instantly.`]]],
  rocket: ['How Rocket works', [['Place your bet', `Bet ${CUR} or a gift before the countdown ends.`], ['Watch the rocket', 'The multiplier grows while the rocket flies. It can explode at any moment.'], ['Cash out in time', `Press Cash out before it explodes. Your win is paid as the most valuable real NFT that fits the amount, the rest goes to your ${CUR} balance.`], ['Auto cashout', 'Set a target multiplier and your bet will be cashed out automatically.']]],
  tvt: ['How TvT works', [['Pick a team', `Choose Ice or Fire and bet ${CUR}, gifts, or both.`], ['Wait for the round to start', 'Once both teams have bets, a 20-second betting period begins. When it ends, no more bets can be placed and the game starts to determine the winner.'], ['Winners share the pool', `The losing pool is shared among winners in proportion to their bets. Losing gifts are distributed where possible, and the remaining value is paid in ${CUR}.`], ['Stay with your team', "During the betting period, you can add to your bet, but you can't switch teams."]]],
  pvp: ['How PvP works', [['Join the battle', `Bet ${CUR} or gifts. Your chance equals your share of the total pool.`], ['Wait for the timer', 'The round starts when at least 2 players join and the timer ends.'], ['Winner takes all', 'The wheel picks one winner who receives the whole pool.']]],
  plinko: ['How Plinko works', [['Choose risk', 'Easy, Medium or Hard. Hard has 16 rows and up to 1000x.'], ['Drop the ball', 'The ball bounces through the pins and lands in a multiplier slot.'], ['Get paid', `Bet × multiplier is credited to your ${CUR} balance.`]]],
  dice: ['How Dice works', [['Pick a target', 'Drag the slider or type a multiplier or chance.'], ['Higher or Lower', 'Swap the direction with the arrows button.'], ['Roll', 'A number from 0 to 100 is rolled. Land in the green zone to win.']]],
  spins: ['How Spins works', [['Spin the board', '25 gifts drop on the board.'], ['Match gifts', '8 or more of the same gift pay out. 12+ pays the most.'], ['Features', 'Double Chance adds 25% to the bet and boosts win chance. Buy Features gives 10 free spins with x10 wins.']]],
  upgrade: ['How Upgrades Work', [['Select Your Gift', 'Choose a gift from your backpack to upgrade'], ['Choose Target', 'Pick the gift you want to upgrade to from the available pool'], ['Spin the Wheel', 'Press the upgrade button and watch as your gift is upgraded to a higher value or lost in the attempt']]],
  crafts: ['How Crafts Work', [['Add Gifts', 'Select 2 to 10 gifts from your inventory to start a craft'], ['Choose Risk Level', 'Pick SAFE, NORMAL, or RISKY mode based on your risk tolerance'], ['Execute Craft', 'Confirm and execute your craft to combine the gifts'], ['Receive Reward', 'Get a new gift based on the craft outcome']]]
};

// =====================================================================
//  SARLAVHA (header): Rocket uchun wifi + sozlama, avatar -> profil
// =====================================================================
$id('hPill').insertAdjacentHTML('afterbegin', `<div class="hrk" id="hRk"><div class="wf"><i></i>${IC.wifi}</div><button class="gr" id="gfxB">${IC.gear}</button><div class="gdd" id="gfxD"><small>GRAPHICS</small><button data-g="high">High</button><button data-g="med">Medium</button><button data-g="low">Low</button></div></div>`);
function gfxSync() { $$('#gfxD [data-g]').forEach(b => b.classList.toggle('on', b.dataset.g === S.gfx)) }
$id('gfxB').onclick = e => { e.stopPropagation(); gfxSync(); $id('gfxD').classList.toggle('on') };
$id('gfxD').onclick = e => { e.stopPropagation(); const b = e.target.closest('[data-g]'); if (!b) return; S.gfx = b.dataset.g; save(); gfxSync(); $id('gfxD').classList.remove('on'); rkResize() };
document.addEventListener('click', e => { if (!e.target.closest('#gfxB,#gfxD')) $id('gfxD').classList.remove('on') });
$$('#hMain .avw, #hAv').forEach(a => { a.style.cursor = 'pointer'; a.onclick = () => go('profile') });

// go() kengaytmasi
const _go = go;
const MAIN5 = ['boxp', 'daily', 'topup', 'profile'];
go = function (id, np) {
  _go(id, np);
  const main = MAIN_HDR.includes(id) || MAIN5.includes(id);
  $id('hMain').style.display = main ? 'flex' : 'none';
  $id('hPill').style.display = main ? 'none' : 'flex';
  const rk = id === 'rocket';
  $id('hRk').style.display = rk ? 'flex' : 'none';
  $id('hIcons').style.display = rk ? 'none' : 'flex';
};

// =====================================================================
//  ROCKET — canvas: egri chiziq, sanoq, portlash
// =====================================================================
const RKV = { rkGift: byName('Stellar Rocket'), boomAt: 0, curve: [] };
const stage = $id('rkStage');
stage.insertAdjacentHTML('beforeend', `<canvas id="rkCv"></canvas><div id="rkImg"></div><div id="rkBoom"><svg viewBox="0 0 100 100"><defs><radialGradient id="bmg"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#fde047"/><stop offset=".7" stop-color="#f97316"/><stop offset="1" stop-color="#ef4444"/></radialGradient></defs><path d="M50 2l9 26 22-16-10 25 27 3-25 12 20 18-27-5 3 27-16-22-16 22 3-27-27 5 20-18L8 40l27-3-10-25 22 16z" fill="url(#bmg)"/></svg></div><div id="rkBig"></div><div id="rkCount"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" stroke="#2e2e2e" stroke-width="5" fill="#161616"/><circle id="rkArc" cx="50" cy="50" r="44" stroke="#22c55e" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><b id="rkCnt">5</b></div><div class="rkload" id="rkLoad">${IC.rocket.replace('<svg', '<svg width="46" height="46"')}<div class="spin"></div></div>`);
const cv = $id('rkCv'), cx = cv.getContext('2d');
function rkResize() { const r = stage.getBoundingClientRect(); const dpr = S.gfx === 'low' ? 1 : Math.min(2, window.devicePixelRatio || 1); cv.width = r.width * dpr; cv.height = r.height * dpr; cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px'; RKV.dpr = dpr; RKV.W = r.width; RKV.H = r.height }
window.addEventListener('resize', rkResize);
// Rocket: faqat Stellar Rocket NFT — har raundda boshqa model (repo: models/stellar_rocket/*.webp)
const RK_MODELS = 'alien_pizza astro_peach baby_carrot banana bitcoin black_wing cardboard checkered chrome clever_bird doomsday fireworks first_step fishing_cat flower_power green_jelly gunship hornet jet_bike jewels knowledge laika lava_lamp little_journey lollipop malfunction mega_death mission_uranus neon_fuel normandy nostromo pencil pepelatz planet_express police_box popsicle rocket_plush ruby_sparkle silver_ride sky_ghost soap_bubbles space_bot space_veggie squirrel submarine telegram to_the_moon unicorn vintage_toy worm_gun'.split(' ');
let rkPrevM = '';
function rkSetSkin() { const g = byName('Stellar Rocket'); let ms; do { ms = pick(RK_MODELS) } while (ms === rkPrevM && RK_MODELS.length > 1); rkPrevM = ms; RKV.rkGift = g; RKV.rkModel = ms; $id('rkImg').innerHTML = GIM(g, ms).replace(/loading="lazy"/g, ''); setTimeout(() => { const im = $('#rkImg img'); if (im && window.RIKI_HQ) window.RIKI_HQ(im) }, 0) };
function rkPos(t) { // t: soniya
  const W = RKV.W, H = RKV.H, q = 1 - Math.exp(-t / 3.2);
  return [W * (.08 + .5 * q), H * (.86 - .52 * q)];
}
function rkDraw(now) {
  if (!RKV.W) rkResize();
  const W = RKV.W, H = RKV.H, dpr = RKV.dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
  const img = $id('rkImg'), big = $id('rkBig'), cnt = $id('rkCount');
  if (RK.phase === 'wait') {
    img.classList.remove('on'); big.classList.remove('on', 'fly'); cnt.classList.add('on');
    const left = Math.max(0, (RK.waitEnd - now) / 1000), tot = 7;
    $id('rkCnt').textContent = Math.ceil(left) || '0';
    const arc = $id('rkArc'); arc.style.strokeDashoffset = 276.5 * (1 - left / tot); arc.style.stroke = left > 3 ? '#22c55e' : '#fbbf24';
    return;
  }
  cnt.classList.remove('on');
  const t = RK.phase === 'fly' ? (now - RK.t0) / 1000 : (RK.crashAt - RK.t0) / 1000;
  const [rx, ry] = rkPos(t);
  // egri chiziq
  const x0 = -10, y0 = H * .92, c1x = rx * .55, c1y = H * .92;
  const crashed = RK.phase === 'crash';
  const col = crashed ? '#ef4444' : '#7c6cf6';
  cx.lineCap = 'round';
  if (S.gfx !== 'low') { cx.shadowColor = col; cx.shadowBlur = 16 }
  const gr = cx.createLinearGradient(x0, y0, rx, ry);
  gr.addColorStop(0, crashed ? '#ef444433' : '#6d5cf633'); gr.addColorStop(.5, col); gr.addColorStop(1, crashed ? '#f87171' : '#a5b4fc');
  cx.strokeStyle = gr; cx.lineWidth = 6; cx.beginPath(); cx.moveTo(x0, y0); cx.quadraticCurveTo(c1x, c1y, rx, ry); cx.stroke(); cx.shadowBlur = 0;
  if (!crashed) { cx.fillStyle = '#fff'; cx.shadowColor = '#fff'; cx.shadowBlur = 12; cx.beginPath(); cx.arc(rx, ry, 5, 0, 7); cx.fill(); cx.shadowBlur = 0 }
  // raketa
  const ang = Math.atan2(ry - c1y, rx - c1x) * 180 / Math.PI;
  if (!crashed) {
    const sz = Math.min(84, W * .24), bob = Math.sin(now / 160) * 3;
    img.style.width = img.style.height = sz + 'px';
    img.style.transform = `translate(${rx - sz * .25}px,${ry - sz * .78 + bob}px) rotate(${ang + 45}deg)`;
    img.classList.add('on'); big.classList.remove('on'); big.classList.add('fly'); big.textContent = RK.m.toFixed(2) + 'x';
    if (S.gfx === 'high' && Math.random() < .6) rkSpark(rx, ry);
  } else {
    img.classList.remove('on'); big.classList.remove('fly');
    const bm = $id('rkBoom'); bm.style.left = rx + 'px'; bm.style.top = ry + 'px';
    if (!bm.classList.contains('on') && now - RK.crashAt < 100) { bm.classList.remove('on'); void bm.offsetWidth; bm.classList.add('on') }
    big.textContent = RK.crash.toFixed(2) + 'x'; big.style.color = RK.crash < 1.2 ? '#ef4444' : RK.crash < 2 ? '#7c6cf6' : RK.crash < 5 ? '#8b5cf6' : '#a855f7';
    if (now - RK.crashAt > 500) big.classList.add('on');
  }
}
function rkSpark(x, y) { const s = document.createElement('i'); s.className = 'frag'; s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.background = pick(['#fde68a', '#f97316', '#fff']); s.style.setProperty('--dx', rnd(-60, -20) + 'px'); s.style.setProperty('--dy', rnd(0, 40) + 'px'); stage.appendChild(s); setTimeout(() => s.remove(), 900) }
const _rkNew = rkNew;
rkNew = function () { _rkNew(); rkSetSkin(); $id('rkBoom').classList.remove('on') };
// ro'yxat va chiplar
let rkL = 0;
const _rkRender = rkRender;
rkRender = function (force) {
  _rkRender(force);
  const now = performance.now();
  if (cur === 'rocket') rkDraw(now);
  if (!force && now - rkL < 280) return; rkL = now;
  const chip = RK.phase === 'wait' ? `<span class="bet">BET</span>` : RK.phase === 'fly' ? `<span class="now">${RK.m.toFixed(2)}x</span>` : '';
  $id('rkHist').innerHTML = chip + RK.hist.map(h => `<span class="${h < 1.2 ? 'c-red' : h < 2 ? 'c-blu' : h < 5 ? 'c-grn' : h < 10 ? 'c-pur' : 'c-gld'}">${h.toFixed(2)}x</span>`).join('');
  const list = [...RK.bets].sort((a, b) => (b.me ? 1 : 0) - (a.me ? 1 : 0) || (b.out ? 1 : 0) - (a.out ? 1 : 0) || b.amt - a.amt);
  $id('rkPl').innerHTML = list.length ? list.map(b => {
    const lose = RK.phase === 'crash' && !b.out, m = b.out || (RK.phase === 'fly' ? RK.m : RK.phase === 'crash' ? RK.crash : 1);
    const val = b.out ? b.amt * b.out : lose ? b.amt : b.amt * m;
    return `<div class="prow ${b.out ? 'win' : ''} ${lose ? 'lose' : ''} ${b.me ? 'me' : ''}">${avHTML(b.name)}<div class="pi"><b>${esc(b.name)}${b.me ? ' (you)' : ''}${b.bot ? ' <span class="bt">BOT</span>' : ''}</b><span class="chipg">${GEM}${fmt(b.amt)} ×${m.toFixed(2)}</span></div><span class="pv">${gem(val)}</span>${b.nf ? `<span class="gsq">${GIM(b.nf.g, b.nf.ms)}</span>` : ''}</div>`;
  }).join('') : `<div class="noply"><i>${ICO.rocket}</i><b>No Players Yet</b><small>Waiting for next round...</small></div>`;
};
// tikish oynasi — video bo'yicha
const _btGo = $id('btGo').onclick;
$id('betM').classList.add('bm2', 'sheet2');
$id('betM').querySelector('.mbody').innerHTML = `
  <div class="tabs" id="btTabs"><button data-t="gift">Gifts</button><button data-t="coin" class="on">${CUR}</button></div>
  <div id="btCoin" class="mcard">
    <div class="mrow"><span>Available Balance</span><b><span class="balv"></span><span class="gm">${GEM}</span></b></div>
    <div class="lbl">Bet Amount</div><div class="inp"><input id="btAmt" type="number" inputmode="decimal" placeholder="${CUR} amount" step="0.01"><span class="gm">${GEM}</span></div>
    <div class="mrow" style="margin:15px 0 0"><span>Auto cashout</span><label class="sw"><input type="checkbox" id="btAutoOn"><i></i></label></div>
    <div class="acrow" id="btAutoW" style="display:none"><button id="acM">−</button><div class="inp"><input id="btAuto" type="number" value="2.00" step="0.1"><span>x</span></div><button id="acP">+</button></div>
    <button class="mbtn dis" id="btGo">Place ${CUR} Bet ${ICO.rocket}</button>
  </div>
  <div id="btGift" style="display:none"><div class="grid" id="btGifts"></div><button class="mbtn dis hide" id="btGoG">Place Gift Bet ${ICO.rocket}</button></div>`;
$id('acM').onclick = () => { $id('btAuto').value = Math.max(1.01, (parseFloat($id('btAuto').value) || 2) - .1).toFixed(2) };
$id('acP').onclick = () => { $id('btAuto').value = ((parseFloat($id('btAuto').value) || 2) + .1).toFixed(2) };
$id('btAmt').oninput = () => { const v = parseFloat($id('btAmt').value) || 0; $id('btGo').className = 'mbtn ' + (v >= .05 && v <= S.bal ? 'go' : 'dis') };
$id('btGo').onclick = _btGo;
openBetModal = function () {
  BS.bt = BS.bt || { mode: 'coin', gifts: [], on: () => {} }; BS.bt.inp = $id('btAmt');
  const drawG = () => {
    const g = $id('btGifts');
    if (!S.inv.length) { g.style.display = 'block'; g.innerHTML = `<div class="nogift"><div class="gic">${IC.spark}</div><b>No Gifts Available</b><p>Send gifts to <a class="lnk" href="https://t.me/${GBOT}">@${GBOT}</a> and play Rocket</p><button class="btn-b" id="ngSend">${IC.ext}Send Gifts</button><div class="orsep">OR</div><p style="margin-bottom:11px">Open gift boxes to get gifts for Rocket</p><button class="btn-d" id="ngBox" style="max-width:166px;margin:0 auto">${IC.spark}Open Boxes</button></div>`; $id('btGoG').classList.add('hide'); $id('ngSend').onclick = () => openLink(`https://t.me/${GBOT}`); $id('ngBox').onclick = () => { closeM('betM'); go('home'); setTimeout(() => $('.boxes') && $('.boxes').scrollIntoView({ behavior: 'smooth' }), 100) }; return }
    g.style.display = ''; g.innerHTML = S.inv.map(it => itemCard(it, `data-id="${it.id}"`, BS.bt.gifts.includes(it.id) ? 'sel' : '')).join('');
    const v = BS.bt.gifts.reduce((s, id) => s + (invGet(id)?.v || 0), 0);
    const b = $id('btGoG'); b.classList.remove('hide'); b.className = 'mbtn ' + (v ? 'go' : 'dis'); b.innerHTML = `Place Gift Bet ${v ? '· ' + gem(v) : ''} ${ICO.rocket}`;
  };
  const setT = t => { BS.bt.mode = t; $$('#btTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); $id('btCoin').style.display = t === 'coin' ? '' : 'none'; $id('btGift').style.display = t === 'gift' ? '' : 'none'; drawG() };
  $$('#btTabs button').forEach(b => b.onclick = () => setT(b.dataset.t));
  $id('btGifts').onclick = e => { const c = e.target.closest('.gift'); if (!c) return; const id = c.dataset.id; BS.bt.gifts = BS.bt.gifts.includes(id) ? BS.bt.gifts.filter(x => x !== id) : [...BS.bt.gifts, id]; drawG() };
  $id('btAutoOn').onchange = () => $id('btAutoW').style.display = $id('btAutoOn').checked ? '' : 'none';
  $id('btGoG').onclick = () => $id('btGo').click();
  setT(BS.bt.mode); renderBal(); $id('btAmt').oninput(); openM('betM');
};
$id('rkBtn').addEventListener('click', () => { if (cur === 'rocket') setTimeout(() => rkRender(true), 0) });
ENTER.rocket = () => { const l = $id('rkLoad'); l.classList.remove('off'); rkResize(); setTimeout(() => { l.classList.add('off'); rkResize() }, 650); rkRender(true) };

// =====================================================================
//  MINES — provably fair + video bo'yicha tarix
// =====================================================================
$id('mBtn').onclick = () => {
  if (MN.on) { if (!MN.open.size) return; const k = MN.open.size, w = Math.round(MN.bet * mMul(k) * 100) / 100; setBal(w); logGame('Mines', MN.bet, w, k + ' cells'); mEnd(w, mMul(k)); hapN('success'); toast(`✅ +${g$(w)}`); mRender(); return }
  const a = takeBet('mn', 0.05); if (!a) return;
  S.nonce++;
  MN.pf = { seed: PF.seed, hash: PF.hash, client: S.clientSeed, nonce: S.nonce, n: MN.n, bet: a, t: Date.now() };
  MN.mines = new Set(minesFrom(PF.seed, S.clientSeed, S.nonce, MN.n));
  PF.seed = rndHex(32); PF.hash = sha256(PF.seed);
  MN.on = true; MN.bet = a; MN.open = new Set(); MN.revealed = false;
  hap('medium'); mRender();
};
function mEnd(pay, mult) {
  MN.on = false; MN.revealed = true;
  if (!MN.pf) return;
  const r = Object.assign({}, MN.pf, { opened: MN.open.size, max: 25 - MN.n, pay, mult, pos: [...MN.mines] });
  S.mh.unshift(r); if (S.mh.length > 40) S.mh.length = 40; save(); MN.pf = null;
}
$id('mGrid').onclick = e => {
  const c = e.target.closest('.cell'); if (!c || !MN.on) return; const i = +c.dataset.i; if (MN.open.has(i)) return;
  MN.open.add(i);
  if (MN.mines.has(i)) { logGame('Mines', MN.bet, 0, '💣'); mEnd(0, 0); hapN('error'); toast('💣 Boom!'); mRender(); return }
  hap();
  if (MN.open.size === 25 - MN.n) { const w = Math.round(MN.bet * mMul(MN.open.size) * 100) / 100; setBal(w); logGame('Mines', MN.bet, w, 'MAX'); mEnd(w, mMul(MN.open.size)); showRes(true, null, 'MAX WIN!', `+${g$(w)}`) }
  mRender();
};
function pfHistory() {
  const t = d => new Date(d).toTimeString().slice(0, 8);
  const rows = S.mh.map((r, i) => `<div class="hr2" data-i="${i}"><div class="top"><span class="xb ${r.pay > 0 ? 'w' : 'l'}">×${(r.mult || 0).toFixed(2)}</span><div class="tx"><b>${r.opened} of ${r.max} <em>· Mines: ${r.n}</em></b><small>${fmt(r.bet)} ${CUR}</small><small>${t(r.t)} · Payout: ${fmt(r.pay)} ${CUR}</small></div><span class="ch">${IC.down}</span></div><div class="bd"></div></div>`).join('');
  $id('pfT').textContent = 'History';
  $id('pfB').innerHTML = `<div class="nh">${IC.shield}<div>Next round hash, committed before the bet<b>${PF.hash}</b></div></div>${rows || '<div class="empty">No games yet</div>'}`;
  openM('pfM');
}
function pfVerify(r) {
  const okH = sha256(r.seed) === r.hash;
  const pos = minesFrom(r.seed, r.client, r.nonce, r.n);
  const okL = pos.join(',') === [...r.pos].sort((a, b) => a - b).join(',');
  return { okH, okL, pos };
}
function pfBody(r) {
  const v = pfVerify(r), fv = (x, c) => `<div class="fv"><span>${x}</span><button data-cp="${x}">${IC.copy}</button></div>`;
  return `<div class="chk ${v.okH && v.okL ? '' : 'bad'}"><b>${v.okH && v.okL ? 'Checked on your device' : 'Mismatch!'}</b>The revealed server seed matches the hash published before the round and the mine layout recomputed here matches the board you played.<small>Checked at ${new Date().toTimeString().slice(0, 8)}</small></div>
  <div class="fl">Server seed hash: committed before the round</div>${fv(r.hash)}
  <div class="fl">Server seed (revealed when the round ends)</div>${fv(r.seed)}
  <div class="fl"><span>Client seed</span><span>Nonce</span></div><div class="fvr">${fv(r.client)}<div class="fv">${r.nonce}</div></div>
  <div class="fl">Mine positions</div><div class="fv"><span>${v.pos.map(p => p + 1).join(', ')}</span></div>
  <div class="mt"><div>Seed hash <em class="${v.okH ? '' : 'no'}">${v.okH ? '✓ Matches' : '✗ No'}</em></div><div>Mine layout <em class="${v.okL ? '' : 'no'}">${v.okL ? '✓ Matches' : '✗ No'}</em></div></div>
  <button class="btn-g" data-chk style="margin-top:11px">${IC.refresh}Check again</button>
  <div class="pfn">The check runs here, on your phone, from the same public formula the server uses: SHA-256(server seed) must equal the published hash, and SHA-256(seed:client:nonce:n) drives the mine shuffle.</div>`;
}
$id('pfB').onclick = e => {
  const cp = e.target.closest('[data-cp]'); if (cp) { copyTxt(cp.dataset.cp); return }
  const row = e.target.closest('.hr2'); if (!row) return; const r = S.mh[+row.dataset.i];
  if (e.target.closest('[data-chk]')) { row.querySelector('.bd').innerHTML = pfBody(r); toastG('The round matches its seeds'); return }
  if (e.target.closest('.top')) { row.classList.toggle('open'); if (row.classList.contains('open')) { row.querySelector('.bd').innerHTML = pfBody(r); toastG(pfVerify(r).okH ? 'The round matches its seeds' : 'Mismatch!') } }
};

// =====================================================================
//  TvT — tarix, natija plashkasi
// =====================================================================
const _tvReset = tvReset;
tvReset = function () {
  if (TV.win && !NET.on) { S.tvh.unshift({ id: TV.game, win: TV.win, i: tvSum('ice'), f: tvSum('fire'), me: TV.ice.concat(TV.fire).some(p => p.me), pl: ['ice', 'fire'].flatMap(t => TV[t].map(p => ({ name: p.name, bot: !!p.bot && !p.me, me: !!p.me, team: t, amt: p.amt, photo: p.photo || '' }))) }); if (S.tvh.length > 30) S.tvh.length = 30; save() }
  $id('tvRes').classList.remove('on'); _tvReset();
};
$id('tvArena').insertAdjacentHTML('beforeend', '<div id="tvRes"><b></b><small></small></div>');
if (false) for (let i = 0; i < 14; i++) { const ic = rnd(40, 230), fi = rnd(20, 160); S.tvh.push({ id: 25504 - i, win: Math.random() < ic / (ic + fi) ? 'ice' : 'fire', i: ic, f: fi, me: false }) }
function tvHist(f) {
  f = f || 'all'; const l = S.tvh.filter(h => f === 'all' || h.me);
  $id('pfT').textContent = 'History';
  $id('pfB').innerHTML = `<div class="seg2" id="tvhSeg"><button data-f="all" class="${f === 'all' ? 'on' : ''}">All</button><button data-f="mine" class="${f === 'mine' ? 'on' : ''}">Mine</button></div>` + (l.map(h => `<div class="tvh" data-id="${h.id}"><span class="tvhic ${h.win}">${h.win === 'ice' ? ICO.snow : ICO.flame}</span><div><b>${h.win === 'ice' ? 'Ice' : 'Fire'} wins <em>#${h.id}</em></b><small>Ice ${fmt(h.i)} ${CUR}, Fire ${fmt(h.f)} ${CUR}</small></div>${IC.shield}</div>`).join('') || '<div class="empty">No games yet</div>');
  $id('tvhSeg').onclick = e => { const b = e.target.closest('[data-f]'); if (b) tvHist(b.dataset.f) };
  $$('#pfB .tvh[data-id]').forEach(r => r.onclick = () => tvRound(S.tvh.find(h => String(h.id) === r.dataset.id)));
  openM('pfM');
}
// raund natijasi (video: "Fire wins! Round #25855 · 68%" + Payouts / Losses)
document.body.insertAdjacentHTML('beforeend', `<div class="modal sheet2" id="tvRM"><div class="mbox"><div class="mhead tvrh"><span id="tvRT"></span><button class="mx" data-close>✕</button></div><div class="mbody" id="tvRB"></div></div></div>`);
function tvRound(h) {
  if (!h) return;
  const tot = (h.i + h.f) || 1, wt = h.win === 'ice' ? h.i : h.f, pct = Math.round(wt / tot * 100);
  const me = (h.pl || []).find(p => p.me), mine = me ? me.team === h.win ? 'pay' : 'loss' : 'pay';
  const ic = t => `<span class="tvhic ${t}">${t === 'ice' ? ICO.snow : ICO.flame}</span>`;
  $id('tvRT').innerHTML = `${ic(h.win)}<div><b>${h.win === 'ice' ? 'Ice' : 'Fire'} wins!</b><small>Round #${h.id} · ${pct}%</small></div>`;
  const card = t => { const w = t === h.win; return `<div class="tvrc ${t} ${w ? 'w' : 'l'}"><div><small>${t === 'ice' ? 'Ice' : 'Fire'}</small><em>${w ? 'WON' : 'LOST'}</em></div><b>${GEM}${fmt(t === 'ice' ? h.i : h.f)}</b></div>` };
  const pl = (h.pl || []).slice().sort((a, b) => (b.team === h.win) - (a.team === h.win) || b.amt - a.amt);
  const teamSum = t => (h.pl || []).filter(p => p.team === t).reduce((s, p) => s + p.amt, 0) || 1;
  const rows = pl.map(p => { const share = p.amt / teamSum(p.team) * 100, win = p.team === h.win, res = win ? p.amt / (wt || 1) * tot : -p.amt; return `<div class="tvrr ${p.me ? "me" : ""}">${avP(p.name, p.photo)}<div class="n"><b>${esc(p.name)}${p.bot ? ' <span class="bt">BOT</span>' : ''}</b><small>${share.toFixed(1)}%</small></div><span class="bt2">${GEM}${fmt(p.amt)}</span><span class="rs ${win ? 'g' : 'r'}">${win ? '+' : '−'}${fmt(Math.abs(win ? res - p.amt : res))}</span></div><!--r-->` }).join('');
  const sect = t => { const r = pl.filter(p => p.team === t); const w = t === h.win; return `<div class="tvrl tvs-${t}"><b>${t === 'ice' ? '❄ Ice' : '🔥 Fire'} · ${w ? 'Payouts' : 'Losses'}</b><small>${r.length} ${w ? 'winners' : 'losers'} · ${GEM}${fmt(t === 'ice' ? h.i : h.f)}</small></div>` + (rows.split('<!--r-->').filter((x, k) => pl[k] && pl[k].team === t).join('') || '<div class="empty">—</div>') };
  $id('tvRB').innerHTML = `<div class="tvrcs">${card('ice')}${card('fire')}</div>${sect(h.win)}${sect(h.win === 'ice' ? 'fire' : 'ice')}`;
  openM('tvRM');
}

// =====================================================================
//  PvP — yuqori statistika va hash
// =====================================================================
const PVS = { last: S.pvLast || null, top: (S.pvTop && S.pvTop.d === new Date().toDateString()) ? S.pvTop : null, hash: rndHex(20) };
$('#pvp .pvarc').insertAdjacentHTML('beforebegin', `<div class="pvst" id="pvSt"></div>`);
$id('pvPl').insertAdjacentHTML('afterend', `<div class="pvhash" id="pvHash"></div>`);
function pvStats() {
  const box = (x, lb) => x ? `<div><b>@${esc(x.n)}</b><em>+${fmt(x.w)}${GEM}</em><small><span>${lb}</span><span>${x.c.toFixed(1)}%</span></small></div>` : `<div><b style="color:#777">—</b><small><span>${lb}</span><span></span></small></div>`;
  $id('pvSt').innerHTML = box(PVS.last, 'Last Game') + box(PVS.top, 'Top of the Day');
  $id('pvHash').innerHTML = `Hash: ${PVS.hash.slice(0, 5)}...${PVS.hash.slice(-5)} <button data-cp>${IC.copy}</button>`;
}
$id('pvHash').onclick = () => copyTxt(PVS.hash);
const _pvReset = pvReset;
pvReset = function () {
  if (PV.winner) { const tot = pvTotal(); const w = { n: PV.winner.name, w: tot, c: PV.winner.amt / (tot || 1) * 100, d: new Date().toDateString() }; PVS.last = w; if (!PVS.top || w.w > PVS.top.w) PVS.top = w; S.pvLast = PVS.last; S.pvTop = PVS.top; save() }
  PVS.hash = rndHex(20); _pvReset(); pvStats();
};
pvStats();

// =====================================================================
//  PLINKO — Hard 16 qator, 1000x
// =====================================================================
PL_M.hard = [1000, 130, 26, 9, 4, 2, .2, .2, .2, .2, .2, 2, 4, 9, 26, 130, 1000];
const PLR = () => PL_M[PLS.d].length - 1;
plGeo = function () { const R = PLR(), W = PLS.W, H = PLS.H; const gap = W / (R + 3); const top = gap * .8; return { R, gap, top, rowH: (H - top - gap * 1.6) / (R - 1), W, H } };
pegXY = function (r, c) { const g = plGeo(); const n = r + 3; return [g.W / 2 + (c - (n - 1) / 2) * g.gap, g.top + r * g.rowH] };
plDraw = function () {
  const c = $id('plCv'); if (!c.width) return; const x = c.getContext('2d'); const g = plGeo(), R = g.R;
  x.setTransform(PLS.dpr, 0, 0, PLS.dpr, 0, 0); x.clearRect(0, 0, g.W, g.H);
  for (let r = 0; r < R; r++) for (let k = 0; k < r + 3; k++) { const [px, py] = pegXY(r, k); const gr = x.createRadialGradient(px - 1, py - 1, 0, px, py, 5); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#c4b5fd'); x.fillStyle = gr; x.beginPath(); x.arc(px, py, Math.max(2.5, g.gap * .14), 0, 7); x.fill() }
  const M = PL_M[PLS.d], mid = R / 2, sy = g.top + (R - 1) * g.rowH + g.gap * .55, sw = g.gap * .92;
  M.forEach((m, i) => {
    const sx = g.W / 2 + (i - mid) * g.gap - sw / 2, t = Math.abs(i - mid) / mid;
    const hit = PLS.hit[i] && performance.now() - PLS.hit[i] < 300, y = sy + (hit ? 4 : 0);
    x.fillStyle = `hsl(${262 - t * 8},${45 + t * 45}%,${hit ? 72 : 26 + t * 30}%)`;
    x.beginPath(); x.roundRect ? x.roundRect(sx, y, sw, g.gap * .85, 6) : x.rect(sx, y, sw, g.gap * .85); x.fill();
    x.strokeStyle = '#ffffff22'; x.lineWidth = 1; x.stroke();
    x.fillStyle = '#fff'; x.font = `800 ${Math.max(7, g.gap * (String(m).length > 3 ? .26 : .34))}px Inter,sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(m >= 1000 ? '1k' : m, sx + sw / 2, y + g.gap * .43);
  });
  PLS.balls.forEach(b => { x.fillStyle = '#fbbf24'; x.shadowColor = '#fbbf24'; x.shadowBlur = 10; x.beginPath(); x.arc(b.x, b.y, Math.max(4, g.gap * .2), 0, 7); x.fill(); x.shadowBlur = 0 });
};
$id('plBtn').onclick = () => {
  const a = takeBet('pl', 0.05); if (!a) return;
  const g = plGeo(), R = g.R; const pts = [[g.W / 2 + rnd(-g.gap * .3, g.gap * .3), 0]];
  let pos = 0; const p0 = pegXY(0, 1); pts.push([p0[0] + rnd(-3, 3), p0[1] - g.gap * .2]);
  for (let r = 1; r < R; r++) { if (Math.random() < .5) pos++; const [px, py] = pegXY(r, pos + 1); pts.push([px + rnd(-2, 2), py - g.gap * .2]) }
  const slot = pos + (Math.random() < .5 ? 1 : 0);
  pts.push([g.W / 2 + (slot - R / 2) * g.gap, g.top + (R - 1) * g.rowH + g.gap * .95]);
  PLS.balls.push({ pts, i: 0, t: performance.now(), x: pts[0][0], y: 0, slot, bet: a, d: PLS.d }); hap();
};
$$('#plDiff button').forEach(b => b.onclick = () => { if (PLS.balls.length) { toast('Wait for the balls to land'); return } PLS.d = b.dataset.d; $$('#plDiff button').forEach(x => x.classList.toggle('on', x === b)); plDraw() });
$$('.c-pln small').forEach(s => s.textContent = 'Win up to 1000x');

// =====================================================================
//  UPGRADE / CRAFTS — sarlavha va "How it works"
// =====================================================================
$('#upgrade .upcard').insertAdjacentHTML('afterbegin', `<div class="uph"><i>${IC.trend}</i><div><b>Gift Upgrade</b><small>Transform your gift into something better</small></div></div>`);
const howBlock = (key, open) => { const [t, st] = HOWS[key]; return `<div class="howc" id="how_${key}"><div class="hh"><i>!</i>${t}<button data-tg>${open ? 'Hide' : 'Show'} ⌃</button></div><div class="hb" ${open ? '' : 'style="display:none"'}>${st.map((s, i) => `<div class="st1"><i>${i + 1}</i><div><b>${s[0]}</b><small>${s[1]}</small></div></div>`).join('')}${key === 'upgrade' ? `<div class="sf"><div class="s"><b>Success</b>If you win, you receive the target gift from the upgrade pool</div><div class="f"><b>Failure</b>If you lose, your gift is lost and goes to the upgrade pool</div></div>` : ''}${key === 'crafts' ? `<div style="font-weight:800;margin:15px 0 3.8px">What each mode does</div><div class="mdl s"><i>${ICO.shield}</i><div><b>Safe</b>Play it safe and steady. Minimal risk of loss, but smaller potential wins.</div></div><div class="mdl n"><i>${ICO.target}</i><div><b>Normal</b>A fair game. Balanced odds. Equal chances for win or loss. Mid-range rewards.</div></div><div class="mdl r"><i>${ICO.flame}</i><div><b>Risky</b>All or nothing. High risk of total loss, but one lucky hit can pay off up to 100x.</div></div>` : ''}</div></div>` };
$id('upBtn').insertAdjacentHTML('afterend', howBlock('upgrade', true));
const howOld = $('#crafts .how'); if (howOld) howOld.outerHTML = howBlock('crafts', true);
document.addEventListener('click', e => { const b = e.target.closest('.howc [data-tg]'); if (!b) return; const hb = b.closest('.howc').querySelector('.hb'); const o = hb.style.display === 'none'; hb.style.display = o ? '' : 'none'; b.textContent = (o ? 'Hide' : 'Show') + ' ⌃' });
const _upRender = upRender;
upRender = function () { _upRender(); const b = $id('upBtn'); if (!upChance() && !UP.spinning) { b.className = 'bigbtn'; b.innerHTML = `${IC.trend.replace('class="ic"', 'class="ic" style="width:19px;height:19px;vertical-align:-3.8px;margin-right:8px"')}Select both gifts to upgrade` } };
ENTER.upgrade = upRender;

// =====================================================================
//  QUTILAR (BOXES) — home grid + box sahifasi
// =====================================================================

// =====================================================================
//  ORIGINAL ART — RIKI o'z chizmalari (SVG). Telegram stikerlari ishlatilmaydi.
// =====================================================================
const MOTIF = { // 24×24 belgilar (oq rang bilan chiziladi)
  farm: '<path d="M12 21v-8M12 13c0-4-3-6-7-6 0 4 3 6 7 6zm0-2c0-4 3-7 7-7 0 4-3 7-7 7z"/>',
  autumn: '<path d="M12 3c4 3 7 7 4 12-2 3-6 3-8 0-3-5 0-9 4-12zM12 8v13"/>',
  movie: '<path d="M4 9h16v11H4zM4 9l2-5 14 2-1 3M9 4.5l-1 4.5M14 5l-1 4"/>',
  space: '<circle cx="12" cy="12" r="5"/><path d="M3 15c3 2 15-2 18-8"/>',
  telegram: '<path d="M3 11l17-7-3 16-5-4-3 3v-5l9-7-11 6z"/>',
  adult: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  money: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3 3 7 3s7-1.3 7-3v-5"/>',
  pepe: '<circle cx="8.5" cy="9" r="3"/><circle cx="15.5" cy="9" r="3"/><path d="M5 13c2 5 12 5 14 0"/>',
  black: '<path d="M12 3c-5 0-8 3-8 7 0 3 2 4 2 6h12c0-2 2-3 2-6 0-4-3-7-8-7zM9 16v4h6v-4"/><circle cx="9" cy="10" r="1.6"/><circle cx="15" cy="10" r="1.6"/>',
  onyx: '<path d="M6 4h12l3 5-9 11L3 9zM3 9h18M12 4v16"/>',
  perfume: '<path d="M9 3h6v4H9zM6 9h12v11H6zM10 7v2M14 7v2"/>',
  oscar: '<path d="M7 4h10v4a5 5 0 0 1-10 0zM12 13v4M8 20h8M7 6H4c0 3 1 4 3 4M17 6h3c0 3-1 4-3 4"/>',
  magic: '<path d="M4 20L15 9M15 9l2-5 1 4 4 1-4 2-1 4-2-4z"/>',
  kitty: '<path d="M5 20v-9l-1-7 5 4h6l5-4-1 7v9z"/><circle cx="9.5" cy="13" r="1"/><circle cx="14.5" cy="13" r="1"/>',
  gem: '<path d="M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l3 5 3-5"/>',
  cap: '<path d="M3 15c0-6 4-9 9-9s9 3 9 9zM2 15h20v2H2zM12 6V3"/>',
  ring: '<circle cx="12" cy="14" r="6"/><path d="M9 6l3-3 3 3-3 2z"/>',
  epic: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
  elite: '<path d="M3 9l4 3 5-7 5 7 4-3-2 9H5zM8 21h8"/>',
  free: '<path d="M12 3v18M3 12h18"/>'
};
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255; const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('') };
let ARTN = 0;
function caseSVG(bx) {
  const c = bx.c, id = 'cs' + (ARTN++), m = MOTIF[bx.id] || MOTIF.free;
  return `<svg class="csvg" viewBox="0 0 120 112" aria-hidden="true"><defs>
    <radialGradient id="${id}g" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(c, .18)}"/><stop offset="1" stop-color="${shade(c, -.45)}"/></linearGradient>
    <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c, .42)}"/><stop offset="1" stop-color="${shade(c, -.05)}"/></linearGradient>
    <linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="${shade(c, .7)}"/></linearGradient></defs>
    <ellipse cx="60" cy="64" rx="56" ry="46" fill="url(#${id}g)"/>
    <ellipse cx="60" cy="103" rx="38" ry="5" fill="#000" opacity=".35"/>
    <rect x="24" y="52" width="72" height="48" rx="7" fill="url(#${id}b)"/>
    <path d="M24 60h72" stroke="#000" stroke-opacity=".25" stroke-width="2"/>
    <rect x="54" y="52" width="12" height="48" fill="url(#${id}r)" opacity=".9"/>
    <rect x="18" y="40" width="84" height="17" rx="5" fill="url(#${id}l)"/>
    <rect x="18" y="40" width="84" height="5" rx="3" fill="#fff" opacity=".22"/>
    <rect x="53" y="40" width="14" height="17" fill="url(#${id}r)"/>
    <path d="M60 41c-7-14-25-15-22-5 2 6 13 6 22 5zM60 41c7-14 25-15 22-5-2 6-13 6-22 5z" fill="url(#${id}r)" stroke="${shade(c, -.3)}" stroke-width="1.2"/>
    <circle cx="60" cy="41" r="5" fill="#fff"/>
    <circle cx="40" cy="78" r="13" fill="#000" opacity=".28"/>
    <g transform="translate(29 67) scale(.92)" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${m}</g>
    <path d="M100 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM16 26l1.4 3.4 3.4 1.4-3.4 1.4L16 35.6l-1.4-3.4-3.4-1.4 3.4-1.4z" fill="#fff" opacity=".85"/></svg>`;
}
function rocketSVG() {
  const id = 'rk' + (ARTN++);
  return `<svg class="rsvg" viewBox="0 0 140 120" aria-hidden="true"><defs>
    <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#dbe7ff"/><stop offset="1" stop-color="#94a9d6"/></linearGradient>
    <linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff3d6e"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient>
    <radialGradient id="${id}w" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#bff3ff"/><stop offset="1" stop-color="#1d6fd8"/></radialGradient>
    <linearGradient id="${id}x" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset=".5" stop-color="#ff9a1f"/><stop offset="1" stop-color="#ff3d00" stop-opacity="0"/></linearGradient></defs>
    <g transform="rotate(-38 70 60)">
      <path d="M38 60c-14-8-30-6-36 0 6 6 22 8 36 0z" fill="url(#${id}x)" class="rflame"/>
      <path d="M50 45L34 34l-2 14zM50 75L34 86l-2-14z" fill="url(#${id}f)"/>
      <path d="M36 60c0-14 22-26 58-26 18 0 30 12 34 26-4 14-16 26-34 26-36 0-58-12-58-26z" fill="url(#${id}b)"/>
      <path d="M112 42c8 5 13 11 16 18-3 7-8 13-16 18 4-6 6-12 6-18s-2-12-6-18z" fill="url(#${id}f)"/>
      <circle cx="86" cy="60" r="12" fill="url(#${id}w)" stroke="#fff" stroke-width="4"/>
      <circle cx="82" cy="56" r="3.5" fill="#fff" opacity=".8"/>
      <path d="M58 52v16" stroke="#ff4d6d" stroke-width="5" stroke-linecap="round"/>
      <path d="M48 60h-10" stroke="#94a9d6" stroke-width="3" stroke-linecap="round"/></g></svg>`;
}
function freeSVG(kind) { // FREE24: soat + sovg'a; FREE: sovg'alar to'plami
  if (kind === '24') return `<svg class="psvg" viewBox="0 0 120 110" aria-hidden="true">${caseSVG({ id: 'free', c: '#f5b301' }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}<g transform="translate(76 8)"><circle cx="17" cy="17" r="16" fill="#1c1c22" stroke="#ffd34d" stroke-width="3"/><path d="M17 8v9l6 4" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g></svg>`;
  const a = caseSVG({ id: 'adult', c: '#ec4899' }).replace(/^<svg[^>]*>|<\/svg>$/g, ''), b = caseSVG({ id: 'magic', c: '#8b5cf6' }).replace(/^<svg[^>]*>|<\/svg>$/g, ''), d = caseSVG({ id: 'gem', c: '#22d3ee' }).replace(/^<svg[^>]*>|<\/svg>$/g, '');
  return `<svg class="psvg" viewBox="0 0 120 110" aria-hidden="true"><g transform="translate(-14 30) scale(.62)">${b}</g><g transform="translate(58 30) scale(.62)">${d}</g><g transform="translate(18 4) scale(.8)">${a}</g></svg>`;
}

function gemSVG(c) { const id = 'gm' + (ARTN++); return `<svg viewBox="0 0 48 48" class="asvg"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(c, .55)}"/><stop offset="1" stop-color="${shade(c, -.35)}"/></linearGradient></defs><path d="M12 8h24l8 11-20 23L4 19z" fill="url(#${id})"/><path d="M4 19h40M18 8l6 11 6-11M24 19v23M12 8l6 11M36 8l-6 11" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/><path d="M14 10h8l-4 7z" fill="#fff" opacity=".45"/></svg>` }
function bombSVG() { return `<svg viewBox="0 0 48 48" class="asvg"><circle cx="21" cy="28" r="15" fill="#2b2b33"/><circle cx="16" cy="23" r="4" fill="#fff" opacity=".25"/><path d="M30 16l5-5" stroke="#a16207" stroke-width="4" stroke-linecap="round"/><path d="M37 5l1.4 3.4 3.4 1.4-3.4 1.4L37 15l-1.4-3.8L32 10l3.6-1.6z" fill="#fbbf24"/></svg>` }
function symSVG(k) { const P = { gem: gemSVG('#38bdf8'), heart: `<svg viewBox="0 0 48 48" class="asvg"><path d="M24 42S6 31 6 18a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 13-18 24-18 24z" fill="#ff4d8d"/><path d="M14 14a5 5 0 0 1 6 1" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/></svg>`, star: `<svg viewBox="0 0 48 48" class="asvg"><path d="M24 4l6 13 14 2-10 10 2 14-12-7-12 7 2-14L4 19l14-2z" fill="#ffd34d" stroke="#f59e0b" stroke-width="2" stroke-linejoin="round"/></svg>`, seven: `<svg viewBox="0 0 48 48" class="asvg"><path d="M10 8h28l-14 34h-9l13-26H10z" fill="#ff3d6e" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>` }; return P[k] || P.gem }
function dieSVG(n) { const pos = { 1: [[24, 24]], 2: [[15, 15], [33, 33]], 3: [[14, 14], [24, 24], [34, 34]], 4: [[15, 15], [33, 15], [15, 33], [33, 33]], 5: [[15, 15], [33, 15], [24, 24], [15, 33], [33, 33]], 6: [[15, 13], [33, 13], [15, 24], [33, 24], [15, 35], [33, 35]] }[n]; return `<svg viewBox="0 0 48 48" class="asvg"><rect x="3" y="3" width="42" height="42" rx="10" fill="#fff"/><rect x="3" y="33" width="42" height="12" rx="8" fill="#000" opacity=".08"/>${pos.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.4" fill="${n === 1 ? '#ef4444' : '#1f2937'}"/>`).join('')}</svg>` }
{ // Play Hub — Telegram stikerlari o'rniga original chizmalar
  const strip = sv => sv.replace(/^<svg[^>]*>|<\/svg>$/g, '');
  const M = { 'Astral Shard': () => gemSVG('#22d3ee'), 'Hex Pot': bombSVG, 'Neko Helmet': () => caseSVG({ id: 'gem', c: '#38bdf8' }), 'Plush Pepe': () => caseSVG({ id: 'magic', c: '#a855f7' }), 'Hypno Lollipop': () => symSVG('heart'), 'Jolly Chimp': () => symSVG('star'), 'Stellar Rocket': () => symSVG('seven'), 'Precious Peach': () => dieSVG(5), 'Kissed Frog': () => dieSVG(3), 'Signet Ring': () => caseSVG({ id: 'ring', c: '#eab308' }) };
  $$('#playhub [data-g]').forEach(e => { const f = M[e.dataset.g]; if (!f) return; let sv = f(); if (e.closest('.c-crf') && e.dataset.g === 'Kissed Frog') sv = caseSVG({ id: 'pepe', c: '#22c55e' }); if (e.closest('.c-crf') && e.dataset.g === 'Astral Shard') sv = caseSVG({ id: 'gem', c: '#22d3ee' }); if (e.closest('.c-dic') && e.dataset.g === 'Plush Pepe') sv = dieSVG(6); e.innerHTML = sv; e.removeAttribute('data-g'); e.dataset.f = 1; e.classList.add('oart') });
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
const TOPC = ['Plush Pepe', 'Heart Locket', "Durov's Cap", 'Scared Cat', 'Precious Peach', 'Heroic Helmet', 'Loot Bag', 'Astral Shard'];
const BOOSTS = [1, 3, 10, 20, 50, 100];
const gOk = n => GBN[n] || GBN[n.replace(/'/g, '’')];
function boxPool(bx) {
  const set = new Map();
  [...bx.art, ...TOPC].forEach(n => { const g = gOk(n); if (g) set.set(g.n, g) });
  BYPRICE.filter(g => g.p <= Math.max(6, bx.p * 3)).slice(0, 10).forEach(g => set.set(g.n, g));
  return [...set.values()];
}
// natijalar: sovg'alar + balans; EV = 0.92 × narx (power-law og'irliklar, bisection)
function boxOdds(bx, boost) {
  const cost = bx.p * (boost || 1); const pool = boxPool(bx);
  const outs = pool.map(g => ({ g, v: g.p }));
  [.15, .35, .6, .9, 1.4, 2.5].forEach(k => outs.push({ bal: true, v: Math.max(.01, Math.round(cost * k * 100) / 100) }));
  const target = cost * RTP('cases'); let lo = 0, hi = 8, a = 1;
  for (let i = 0; i < 50; i++) { a = (lo + hi) / 2; const w = outs.map(o => Math.pow(o.v, -a)); const s = w.reduce((x, y) => x + y); const ev = outs.reduce((t, o, j) => t + o.v * w[j] / s, 0); if (ev > target) lo = a; else hi = a }
  const w = outs.map(o => Math.pow(o.v, -a)); const s = w.reduce((x, y) => x + y);
  outs.forEach((o, j) => o.w = w[j] / s);
  return outs;
}
function rollOut(outs) { let r = Math.random(); for (const o of outs) { if (r < o.w) return o; r -= o.w } return outs[0] }
function boxArt(bx) { return `<div class="art cover" style="--bc:${bx.c}">${caseSVG(bx)}</div>` }
function boxCard(bx) {
  const rib = bx.tag === 'lim' ? `<span class="rib lim">${IC.flame}LIMITED</span>` : bx.tag === 'new' ? `<span class="rib new">${IC.bolt}NEW</span>` : '';
  return `<button class="bx ${bx.tag === 'farm' ? 'farm' : ''}" data-box="${bx.id}">${bx.tag === 'farm' ? '<span class="ttl">FARM</span>' : ''}${rib}${boxArt(bx)}<div class="ft"><b>${esc(bx.n)}</b><em>${fmt(bx.p).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')} ${GEM}</em></div></button>`;
}
// home: FREE24 / FREE kartalari va qutilar
const promos = $$('#home .half .promo');
promos.forEach((pr, k) => { pr.querySelectorAll('[data-g], .bundle, .art').forEach(e => e.remove()); pr.insertAdjacentHTML('beforeend', `<span class="part">${freeSVG(k ? 'f' : '24')}</span>`) });
{ const sh = $('#home .b-rocket .shp'); if (sh) { sh.removeAttribute('data-g'); sh.innerHTML = rocketSVG(); sh.dataset.f = 1 } }
if (promos[0]) { promos[0].dataset.go = 'daily'; promos[0].insertAdjacentHTML('beforeend', `<div class="pf"><span>Free<br>24h</span><em class="y">${IC.gift}FREE</em></div>`) }
if (promos[1]) { promos[1].removeAttribute('data-go'); promos[1].dataset.box = 'free'; promos[1].insertAdjacentHTML('beforeend', `<div class="pf"><span>Free</span><em class="p">${IC.gift}FREE</em></div>`) }
$('#home .half').insertAdjacentHTML('afterend', `<div class="boxes" id="boxGrid">${BOXES.map(boxCard).join('')}</div>`);
document.addEventListener('click', e => { const b = e.target.closest('[data-box]'); if (b && !e.target.closest('.modal')) openBox(b.dataset.box) });

const FREEBOX = { id: 'free', n: 'Free', p: 0, c: '#8b5cf6', art: ['Hypno Lollipop', 'Neko Helmet', 'Desk Calendar'] };
const BX = { cur: null, boost: 1, busy: false };
sec('boxp');
function openBox(id) { BX.cur = id === 'free' ? FREEBOX : BOXES.find(b => b.id === id); BX.boost = 1; go('boxp') }
function reelTile(o) { if (o.bal) return `<div class="tl bal">${GEM}</div>`; return `<div class="tl ${o.v > 100 ? 'rare' : 'gf'}">${GI(o.g)}</div>` }
function boxRender() {
  const bx = BX.cur; if (!bx) return; const free = !bx.p;
  const canBoost = !free && bx.p <= 0.1, bst = canBoost ? BX.boost : 1; // BOOST faqat 0.1 TON'lik kasede
  const outs = free ? dailyOdds() : boxOdds(bx, bst);
  const cost = bx.p * bst;
  const gifts = outs.filter(o => !o.bal).sort((a, b) => b.v - a.v);
  const bi = BOOSTS.indexOf(BX.boost);
  sec('boxp', `<div class="bxh">${esc(bx.n)} Box</div>
  <div class="reel2"><div class="tr" id="bxTr">${Array.from({ length: 14 }, () => reelTile(rollOut(outs))).join('')}</div><div class="dim"></div><div class="ln"></div></div>
  ${!canBoost ? '' : `<div class="boost"><small>BOOST</small><div class="row"><button id="bsM">−</button><div class="bar">${BOOSTS.map(() => '<i></i>').join('')}<b style="width:${(bi + 1) / BOOSTS.length * 100}%"></b></div><button id="bsP">+</button></div><div class="lb">${BOOSTS.map(b => `<span class="${b === BX.boost ? 'on' : ''}">x${b}</span>`).join('')}</div><p>Higher boost — better drops</p></div>`}
  <div style="margin-top:12px">${free ? (BX.promo ? `<div class="pcok">${IC.gift}Code <b>${esc(BX.promo)}</b> activated</div><button class="btn-y" id="bxGo">${IC.gift}Open Free Box</button>` : `<div class="pc2"><div class="pch"><i>${IC.gift}</i><div><b>Free Box</b><small>Enter a promo code to open this box</small></div></div><div class="pcr"><input id="pcIn" placeholder="Promo code" autocomplete="off" maxlength="32"><button id="pcGo">Activate</button></div><small class="pcn">Promo codes are posted in our channel and giveaways.</small></div>`) : cost > S.bal ? `<button class="btn-o" id="bxTop">${IC.wallet}Top Up Balance</button>` : `<button class="btn-p" id="bxGo" style="padding:16px;font-size:16px">${IC.spark}Open for ${gem(cost)}</button>`}</div>
  <div class="boxsec">${IC.box}${free ? 'Possible Outcomes' : 'Collections in this Box'}</div>
  <div class="oc">${gifts.map(o => `<div class="ocx"><div class="im">${GI(o.g)}<em>${fmt(o.v)}${GEM}</em></div><b>${esc(o.g.n)}</b><span>${o.g.n === 'Plush Pepe' && bx.id === 'onyx' ? '<i></i>Onyx Black' : 'Random'}</span><small>${(o.w * 100 < .01 ? '<0.01' : (o.w * 100).toFixed(o.w < .01 ? 3 : 2))}%</small></div>`).join('')}
  <div class="ocx bl"><div class="im">${GEM.replace('class="gem"', 'class="gem" style="width:60%;height:60%"')}<em>${fmt(outs.filter(o => o.bal)[0].v)}+</em></div><b>${CUR} Balance</b><span>${(outs.filter(o => o.bal).reduce((s, o) => s + o.w, 0) * 100).toFixed(1)}%</span></div></div>`);
  const m = $id('bsM'), p = $id('bsP');
  if (m) { m.onclick = () => { BX.boost = BOOSTS[Math.max(0, bi - 1)]; boxRender() }; p.onclick = () => { BX.boost = BOOSTS[Math.min(BOOSTS.length - 1, bi + 1)]; boxRender() } }
  const tp = $id('bxTop'); if (tp) tp.onclick = () => go('topup');
  const gb = $id('bxGo'); if (gb) gb.onclick = () => boxOpen(outs, cost, free);
  const pg = $id('pcGo'); if (pg) pg.onclick = async () => {
    const code = ($id('pcIn').value || '').trim(); if (!code) { toast('Enter a promo code'); return }
    if (!NET.on) { toast('Server is not connected'); return }
    pg.disabled = true;
    try { await api('/api/promo', { method: 'POST', body: { code } }); BX.promo = code; hapN('success'); boxRender() } catch (e) { toast(esc(e.message)); hapN('error') }
    pg.disabled = false;
  };
}
async function boxOpen(outs, cost, free) {
  if (BX.busy) return; const bx = BX.cur;
  if (free) { if (!BX.promo) return; BX.promo = null } else { if (cost > S.bal) { go('topup'); return } setBal(-cost) }
  BX.busy = true; const win = rollOut(outs);
  const items = Array.from({ length: 46 }, () => rollOut(outs)); items[38] = win;
  const tr = $id('bxTr'); tr.innerHTML = items.map(reelTile).join(''); tr.style.transition = 'none'; tr.style.transform = 'translateX(0)';
  const gbtn = $id('bxGo'); if (gbtn) { gbtn.innerHTML = `${IC.spark}Skip Animation`; gbtn.onclick = () => { tr.style.transition = 'transform .25s ease-out' } }
  await sleep(40);
  const mid = tr.parentElement.clientWidth / 2; tr.style.transition = 'transform 4.6s cubic-bezier(.12,.7,.16,1)'; const c38 = tr.children[38]; tr.style.transform = `translateX(${-(c38.offsetLeft + c38.offsetWidth / 2 - mid) + rnd(-c38.offsetWidth * .35, c38.offsetWidth * .35)}px)`;
  hap('medium');
  await new Promise(r => { const t0 = Date.now(); const ck = () => { if (Date.now() - t0 > 4700 || tr.style.transition.startsWith('transform .25')) { setTimeout(r, 300) } else setTimeout(ck, 60) }; ck() });
  boxPay(win, (free ? 'Free' : bx.n) + ' Box', cost);
  BX.busy = false; boxRender(); save();
}
function boxPay(win, game, cost) {
  if (win.bal) { setBal(win.v); logGame(game, cost, win.v, CUR); balModal(win.v) }
  else {
    const g = win.g; const mods = g.mods.filter(m => m[2] <= g.p * 1.6); const md = mods.length && Math.random() < .7 ? pick(mods) : null;
    const it = addItem(g, g.p, null, md ? md[0] : null, md ? md[1] : null);
    logGame(game, cost, g.p, itName(it)); balModal(g.p, { g, ms: it.ms }, 'You won a gift!');
  }
  S.cnt.box = (S.cnt.box || 0) + 1;
}
ENTER.boxp = boxRender;

// =====================================================================
//  DAILY BOX (FREE24)
// =====================================================================
const DAILY_R = ['Nail Bracelet', 'Bonded Ring', 'Signet Ring', 'Diamond Ring', 'Swiss Watch', 'Toy Bear', 'Jolly Chimp', 'Lush Bouquet', 'Chill Flame', 'Hypno Lollipop'];
function dailyOdds() {
  const gifts = DAILY_R.map(gOk).filter(Boolean).map(g => ({ g, v: g.p, w: .00025 * Math.min(4, 20 / g.p) }));
  const bal = [[.01, .5], [.02, .25], [.05, .12], [.1, .06], [.25, .03], [1, .005]].map(([v, w]) => ({ bal: true, v, w }));
  const all = gifts.concat(bal); const s = all.reduce((t, o) => t + o.w, 0); all.forEach(o => o.w /= s); return all;
}
function topRow() {
  const l = (NET.on ? NET.feed : (S.myFeed || [])); if (!l.length) return '<div id="topRow"></div>';
  const d = [...l].slice(0, 20).sort((a, b) => b.v - a.v)[0]; const g = GBS[d.sh] || byName(d.n); const m = Math.floor((Date.now() - d.t) / 6e4);
  return `<div class="toprow" id="topRow"><span class="hot">● HOT</span>${GI(g)}<div><b>${esc(d.n)}</b><small>${fmt(d.v)}${GEM}</small></div><time>${IC.clock}${m < 1 ? 'Just now' : m < 60 ? m + 'm ago' : Math.floor(m / 60) + 'h ago'}</time></div>`;
}
const DB = { busy: false };
// lenta to'ldiruvchi plitkalar (faqat ko'rinish; yutuq alohida rollOut bilan tanlanadi)
const dShow = outs => { const g = outs.filter(o => !o.bal); return Math.random() < .7 && g.length ? pick(g) : rollOut(outs) };
sec('daily');
function dailyRender() {
  const outs = dailyOdds(), left = Math.max(0, S.daily + 864e5 - Date.now());
  sec('daily', `<div class="dbx"><div class="dbh"><span class="ic2">${IC.box}</span>Daily Box<small>Latest TOP drops <i></i><i></i></small></div>${topRow()}
  <div class="reel2"><div class="tr" id="dbTr">${Array.from({ length: 14 }, () => reelTile(dShow(outs))).join('')}</div><div class="dim"></div><div class="ln" style="background:#a78bfa"></div></div>
  ${left && !DB.busy ? `<div class="cbin">Come back in</div><div class="cdpill" id="dbCd">${IC.clock}${hms(left)}</div>` : `<button class="btn-y" id="dbGo" style="margin-top:12px">${IC.gift}Open Daily Box</button>`}</div>
  <div class="boxsec">${IC.box}Daily Rewards</div>
  <div class="oc">${outs.filter(o => !o.bal).sort((a, b) => b.v - a.v).map(o => `<div class="ocx"><div class="im">${GI(o.g)}<em>${fmt(o.v)}${GEM}</em></div><b>${esc(o.g.n)}</b><span>Random</span></div>`).join('')}</div>`);
  const b = $id('dbGo'); if (b) b.onclick = () => dailyOpen(outs);
}
async function dailyOpen(outs) {
  if (DB.busy || S.daily + 864e5 > Date.now()) return; DB.busy = true; S.daily = Date.now(); save();
  const win = rollOut(outs); const items = Array.from({ length: 46 }, () => dShow(outs)); items[38] = win;
  const tr = $id('dbTr'); tr.innerHTML = items.map(reelTile).join(''); tr.style.transition = 'none'; tr.style.transform = 'translateX(0)';
  const b = $id('dbGo'); let skip = false; b.innerHTML = `${IC.spark}Skip Animation`; b.onclick = () => { skip = true; tr.style.transition = 'transform .25s ease-out' };
  await sleep(40); const mid = tr.parentElement.clientWidth / 2;
  tr.style.transition = 'transform 4.6s cubic-bezier(.12,.7,.16,1)'; const c38 = tr.children[38]; tr.style.transform = `translateX(${-(c38.offsetLeft + c38.offsetWidth / 2 - mid) + rnd(-c38.offsetWidth * .35, c38.offsetWidth * .35)}px)`;
  for (let t = 0; t < 47 && !skip; t++) await sleep(100); await sleep(300);
  boxPay(win, 'Daily Box', 0); DB.busy = false; dailyRender();
}
ENTER.daily = dailyRender;
setInterval(() => { if (cur === 'daily') { const c = $id('dbCd'); if (c) c.innerHTML = `${IC.clock}${hms(S.daily + 864e5 - Date.now())}` } if (cur === 'boxp' && BX.cur && !BX.cur.p && !BX.busy) { const c = $('#boxp .cdpill'); if (c) c.innerHTML = `${IC.clock}${hms(S.freeBox + 864e5 - Date.now())}` } }, 1000);

// =====================================================================
//  TOP UP (Deposit) — demo
// =====================================================================
const TU = { t: 'gram' };
sec('topup');
openDeposit = function () { closeM('depM'); go('topup') };
const fakeAddr = 'UQ' + rndHex(3).toUpperCase().slice(0, 2) + 'w...' + rndHex(2).slice(0, 2).toUpperCase() + 'Bp';
function tuRender() {
  const t = TU.t;
  const tabs = [['gram', GEM.replace('class="gem"', 'class="gem" style="width:20px;height:20px"'), CUR], ['crypto', IC.coin, 'Other Crypto'], ['stars', IC.star, 'Stars'], ['gifts', IC.gift, 'Gifts']];
  let body = '';
  if (t === 'gram') body = `<div class="wpill">${GEM}${fakeAddr}${IC.logout}</div><div class="wbal"><small>Wallet Balance ${IC.wallet.replace('class="ic"', 'class="ic" style="width:15px;height:15px"')}</small><b>0.01${GEM}</b></div><div class="tul">Amount (minimum 0.1 ${CUR})</div><div class="inp"><input id="tuA" type="number" inputmode="decimal" placeholder="Enter amount..."><span class="gm">${GEM}</span></div><div class="tuq" style="grid-template-columns:repeat(3,1fr)"><button data-a="1">+1 ${CUR}</button><button data-a="10">+10 ${CUR}</button><button data-a="100">+100 ${CUR}</button></div><button class="btn-tu" id="tuGo">Top Up</button>`;
  else if (t === 'crypto') body = `<div class="tul">Amount (minimum 0.1 ${CUR})</div><div class="inp"><input id="tuA" type="number" inputmode="decimal" placeholder="Enter amount..."><span class="gm">${GEM}</span></div><div class="tuq" style="grid-template-columns:repeat(3,1fr)"><button data-a="1">+1 ${CUR}</button><button data-a="10">+10 ${CUR}</button><button data-a="100">+100 ${CUR}</button></div><button class="btn-tu" id="tuGo">Top Up</button>`;
  else if (t === 'stars') body = `<div class="tul">Amount in Stars (10 – 10 000)</div><div class="inp"><input id="tuA" type="number" inputmode="numeric" placeholder="0"></div><div class="tuq" style="grid-template-columns:repeat(5,1fr)"><button data-a="50">+50</button><button data-a="100">+100</button><button data-a="500">+500</button><button data-a="1000">+1k</button><button data-a="5000">+5k</button></div><button class="btn-tu st" id="tuGo">Top Up</button>`;
  else body = `<div class="tug"><div class="hd"><i>${IC.gift}</i><div><b>Top Up with Gifts</b><small>Send gifts to our bot and they'll appear in your backpack</small></div></div><div class="steps"><div class="sh">How it works<span>Hide steps ⌃</span></div><div class="st1"><i>1</i><div><b>Open Gift Bot</b><small>Click the button below to open @${GBOT} bot</small></div></div><div class="st1"><i>2</i><div><b>Send Your Gift</b><small>Send your gift directly to the bot.</small></div></div><div class="st1"><i>3</i><div><b>Gift Added to Backpack</b><small>Your gift will appear in your backpack within seconds. You can then quick-sell it for balance, or use them for upgrades, crafts, or in PvP and Rocket games</small></div></div><div class="okl"><span><b>Instant processing:</b> Gifts appear in your backpack immediately after sending</span></div><div class="okl"><span><b>Quick-sell option:</b> Sell gifts from your backpack for instant ${CUR} balance</span></div></div></div><button class="btn-p" id="tuBot" style="margin-top:15px">${IC.ext}Open @${GBOT}</button>`;
  sec('topup', `<div class="tuh"><button id="tuBk">${IC.back}</button>Top Up Balance</div><div class="tut">${tabs.map(x => `<button data-t="${x[0]}" class="${x[0] === t ? 'on' : ''}">${x[1]}${x[2]}</button>`).join('')}</div>${body}<p class="note" style="margin-top:15px">⚠️ Demo mode: no real payment is taken, demo ${CUR} is added.</p>`);
  $id('tuBk').onclick = back;
  $$('#topup .tut button').forEach(b => b.onclick = () => { TU.t = b.dataset.t; tuRender() });
  const A = $id('tuA'), G = $id('tuGo');
  const sync = () => { const v = parseFloat(A.value) || 0; const ok = t === 'stars' ? v >= 10 && v <= 10000 : v >= .1; G.classList.toggle('on', ok) };
  if (A) { A.oninput = sync; $$('#topup .tuq button').forEach(b => b.onclick = () => { A.value = (parseFloat(A.value) || 0) + +b.dataset.a; sync() }) }
  if (G) G.onclick = () => { const v = parseFloat(A.value) || 0; const add = t === 'stars' ? Math.round(v * .004 * 100) / 100 : v; if (!G.classList.contains('on')) return; setBal(add); S.dep += add; save(); A.value = ''; sync(); balModal(add) };
  const bt = $id('tuBot'); if (bt) bt.onclick = () => openLink(`https://t.me/${GBOT}`);
}
ENTER.topup = tuRender;

// =====================================================================
//  BACKPACK
// =====================================================================
const _bpRender = bpRender;
function bpEmpty() { return `<div class="bph">Your Gifts</div><div class="bpe"><div class="gi0">${GEM}</div><h3>Your backpack is empty</h3><p>Send gifts to <a class="lnk" href="https://t.me/${GBOT}">@${GBOT}</a> to quick-sell them for balance, or use them for upgrades, crafts, or in PvP and Rocket games.</p><button class="btn-p" id="bpSend">${IC.ext}Send gift</button><div class="nt">Gifts sent to the bot will appear here automatically.</div><div class="orsep">OR</div><p>Open some boxes to get awesome gifts and be able to quick-sell them for balance, or use them for upgrades, crafts, or in PvP and Rocket games.</p><button class="btn-p" id="bpBuy">Buy Gifts</button></div>` }
const bpOrig = $id('backpack').innerHTML;
bpRender = function () {
  if (!S.inv.length) { $id('backpack').innerHTML = bpEmpty(); $id('bpSend').onclick = () => openLink(`https://t.me/${GBOT}`); $id('bpBuy').onclick = () => { go('home'); setTimeout(() => $id('boxGrid').scrollIntoView({ behavior: 'smooth' }), 120) }; return }
  if (!$id('bpGrid')) { $id('backpack').innerHTML = '<div class="bph">Your Gifts</div>' + bpOrig; $id('bpGrid').onclick = e => { const c = e.target.closest('.gift'); if (!c) return; const it = invGet(c.dataset.id); if (it) nftModal({ g: GIFTS[it.g], n: it.n, v: it.v, item: it, m: it.m, ms: it.ms }) }; $id('sellAll').onclick = () => { if (!S.inv.length) return; const v = Math.round(S.inv.reduce((s, x) => s + x.v, 0) * .95 * 100) / 100; if (!confirm(`Sell all for ${fmt(v)} ${CUR}?`)) return; S.inv = []; setBal(v); bpRender(); toast(`+${g$(v)}`) } }
  _bpRender();
};
ENTER.backpack = bpRender;

// =====================================================================
//  INVITE
// =====================================================================
ENTER.invite = () => {
  $id('invite').innerHTML = `<div class="ivc"><i>${IC.users}</i><div><h3>Earn up to <em>10%</em><br>by inviting friends</h3><small>from their deposits</small><div class="al">Also by ${tk(5)} for each</div><small>but no more than 50 per day</small></div><button class="q">${IC.help}</button></div>
  <div class="ivb"><button class="btn-p" id="ivInv">${IC.share}Invite Friends</button><button class="btn-d" id="ivCp">${IC.copy}Copy Link</button></div>
  <div class="ivs"><div>Total earned<b>${fmt(S.invEarn).replace(/(\.\d\d)$/, '$10')}${GEM}</b></div><div>Earned today<b>${Math.min(50, S.ref * 5)} / 50 <span class="tkic"></span></b></div></div>
  <div class="ivm"><b>My Invites <em>${S.ref}</em></b><div class="ne"><i>${IC.users}</i>No invites yet</div></div>`;
  $id('ivInv').onclick = () => openLink(`https://t.me/share/url?url=${encodeURIComponent(refLink())}&text=${encodeURIComponent('🎁 ' + BRAND + ' — NFT gifts! Join:')}`);
  $id('ivCp').onclick = () => copyTxt(refLink());
};

// =====================================================================
//  EARN + GIVEAWAYS
// =====================================================================
const _logGame = logGame;
logGame = function (game, bet, win, note) {
  const k = game.split(' ')[0]; S.cnt[k] = (S.cnt[k] || 0) + 1;
  _logGame(game, bet, win, note);
};
const LIMEND = Date.now() + 12 * 36e5 + 32 * 6e4;
const T5 = {
  lim: [{ id: 'pl20', n: 'Play Plinko 20 times', g: 'Plinko', need: 20, r: 50, go: 'plinko' }, { id: 'pl50', n: 'Play Plinko 50 times', g: 'Plinko', need: 50, r: 125, go: 'plinko' }, { id: 'pl100', n: 'Play Plinko 100 times', g: 'Plinko', need: 100, r: 250, go: 'plinko' }, { id: 'rk500', n: 'Play Rocket 500 times', g: 'Rocket', need: 500, r: 1000, go: 'rocket' }],
  day: [{ id: 'ref3', n: 'Send your refferal link to 3 friends', need: 3, r: 5, act: 'share' }, { id: 'story', n: 'Share a Story', r: 5, act: 'story' }, { id: 'open', n: `Open the ${BRAND} app`, r: 1, act: 'claim' }],
  extra: [{ id: 'dep', n: 'Make Deposit', r: 10, act: 'dep' }],
  one: [{ id: 'l25', n: 'Complete 25 limited tasks', need: 25, r: 100, cnt: 'limDone' }, { id: 'vip1', n: 'Reach VIP Level Iron', r: 1000, act: 'vip' }, { id: 'd100', n: 'Complete 100 daily tasks', need: 100, r: 250, cnt: 'dayDone' }]
};
const today = () => new Date().toDateString();
function tState(t, kind) {
  const st = S.tasks5[t.id] || {}; const doneToday = kind === 'day' && st.d === today(); const done = kind === 'day' ? doneToday : !!st.done;
  let prog = 0, need = t.need || 0;
  if (t.g) prog = S.cnt[t.g] || 0; else if (t.cnt) prog = S[t.cnt] || 0; else if (t.id === 'ref3') prog = S.ref;
  let ready = need ? prog >= need : true;
  if (t.act === 'dep') ready = S.dep > 0; if (t.act === 'vip') ready = S.wag >= 1000;
  return { done, prog: Math.min(prog, need), need, ready };
}
const E5 = { tab: 'earn', gt: 'active', gm: 'all', gs: 'end' };
function earnRender() {
  const tabs = `<div class="etabs"><button data-e="earn" class="${E5.tab === 'earn' ? 'on' : ''}">${IC.trophy}Earn</button><button data-e="ga" class="${E5.tab === 'ga' ? 'on' : ''}">${IC.gift}Giveaways ${(() => { const n = gaList().filter(g => !(g.endAt <= Date.now() || g.status === 'ended')).length; return n ? `<span class="bd">${n}</span>` : '' })()}</button></div>`;
  if (E5.tab === 'ga') { if (!NET.on) gaLocalFinalize(); $id('earn').innerHTML = tabs + gaRender(); bindEarn(); return }
  const tkRow = (t, kind, ic) => {
    const s = tState(t, kind);
    const btn = s.done ? `<button class="dn">✓ Done</button>` : s.ready ? `<button data-claim="${t.id}" data-k="${kind}">${t.act === 'share' ? IC.share + 'Share' : t.act === 'story' ? IC.share + 'Share story' : 'Claim'}</button>` : t.go ? `<button data-gogame="${t.go}">${IC.plinko}Bet</button>` : t.act === 'dep' ? `<button data-dep>Deposit</button>` : t.act === 'vip' ? `<button data-go="profile">${ICO.gem2 || GEM}VIP</button>` : t.act === 'share' ? `<button data-claim="${t.id}" data-k="${kind}">${IC.share}Share</button>` : `<button data-st="${t.id}">Start</button>`;
    return `<div class="tk">${kind === 'lim' ? `<span class="tm">${IC.clock}${hms(LIMEND - Date.now()).replace(/ \d+s$/, '')}</span>` : ''}<div class="hd"><i>${ic}</i><b>${t.n}</b></div><div class="rw"><span>${tk(t.r)}</span>${btn}</div>${s.need ? `<div class="pg"><b style="width:${s.prog / s.need * 100}%"></b></div><div class="pl"><span>Progress: ${s.prog}/${s.need}</span><span>${s.need - s.prog} remaining</span></div>` : ''}</div>`;
  };
  $id('earn').innerHTML = tabs + `<div class="tix"><i><span class="tkic"></span></i><div><small>Your Tickets</small><b>${S.tix}<em>available</em></b></div><button id="tixQ">${IC.info}</button></div>
  <div class="tkc"><small>${IC.clock.replace('class="ic"', 'class="ic" style="width:12px;height:12px"')}LIMITED TASKS</small>${T5.lim.map(t => tkRow(t, 'lim', IC.plinko)).join('')}</div>
  <div class="tkc"><small>${IC.cal}DAILY TASKS</small>${T5.day.map(t => tkRow(t, 'day', t.act === 'share' ? IC.share : t.act === 'story' ? IC.refresh : IC.cal)).join('')}</div>
  <div class="tkc"><small>${IC.spark}EXTRA TASKS</small>${T5.extra.map(t => tkRow(t, 'extra', IC.wallet)).join('')}</div>
  <div class="tkc"><small>◎ ONE-TIME TASKS</small>${T5.one.map(t => tkRow(t, 'one', t.act === 'vip' ? IC.star : IC.clock)).join('')}</div>`;
  bindEarn();
}
function bindEarn() {
  $$('#earn [data-e]').forEach(b => b.onclick = () => { E5.tab = b.dataset.e; ENTER.earn() });
  const q = $id('tixQ'); if (q) q.onclick = () => howModal('Tickets', [['Complete tasks', 'Each task gives you tickets.'], ['Join giveaways', 'Spend tickets to join giveaways and win real NFT gifts.'], ['More tickets — more chances', 'Every ticket is one entry in the draw.']]);
  $$('#earn [data-gogame]').forEach(b => b.onclick = () => go(b.dataset.gogame));
  $$('#earn [data-claim]').forEach(b => b.onclick = () => {
    const id = b.dataset.claim, k = b.dataset.k; const t = [...T5.lim, ...T5.day, ...T5.extra, ...T5.one].find(x => x.id === id);
    const fin = () => { S.tasks5[id] = k === 'day' ? { d: today() } : { done: 1 }; S.tix += t.r; if (k === 'lim') S.limDone++; if (k === 'day') S.dayDone++; save(); toastG(`+${t.r} tickets`); earnRender() };
    if (t.act === 'share') { openLink(`https://t.me/share/url?url=${encodeURIComponent(refLink())}`); setTimeout(fin, 3000); return }
    if (t.act === 'story') { try { tg.shareToStory && tg.shareToStory('https://cdn.jsdelivr.net/gh/ssamy2/TelegramGiftsAssests@main/webp/by_name/plush_pepe.webp', { text: BRAND, widget_link: { url: refLink(), name: BRAND } }) } catch (e) {} setTimeout(fin, 2000); return }
    fin();
  });
  $$('#earn [data-st]').forEach(b => b.onclick = () => toast('Complete the task — progress is tracked automatically'));
  $$('#earn .gtabs button').forEach(b => b.onclick = () => { E5.gt = b.dataset.g; earnRender() });
  $$('#earn .gflt [data-m]').forEach(b => b.onclick = () => { E5.gm = b.dataset.m; earnRender() });
  $$('#earn [data-join]').forEach(b => b.onclick = () => gaJoin(b.dataset.join));
  $$('#earn [data-win]').forEach(b => b.onclick = () => { const g = gaList().find(x => x.id === b.dataset.win); const w = g.winners || []; info('Winners', w.length ? w.map((x, i) => `<div class="lr"><span class="n">${i + 1}</span>${x.name && x.name !== '—' ? avP(x.name, x.photo) : '<span class="av">—</span>'}<b>${esc(x.name || '—')}</b><span class="pz">${GI(gaGift(x))}</span><span class="lpt">${fmt(x.p)}</span></div>`).join('') : '<div class="empty">Selecting winners...</div>') });
  $$('#earn .gflt [data-s]').forEach(b => b.onclick = () => { E5.gs = b.dataset.s; earnRender() });
  $$('#earn [data-gend]').forEach(b => b.onclick = () => gaAdminAct('end', b.dataset.gend));
  $$('#earn [data-gdel]').forEach(b => b.onclick = () => gaAdminAct('del', b.dataset.gdel));
  $$('#earn [data-gall]').forEach(b => b.onclick = () => { const g = gaList().find(x => x.id === b.dataset.gall); info(esc(g.title || 'All Gifts') + ' · ' + g.gifts.length, `<div class="grid">${g.gifts.map(x => giftCard(gaGift(x), x.p)).join('')}</div>`) });
  const gn = $id('gaNew'); if (gn) gn.onclick = gaNewOpen;
}
// =====================================================================
//  ONLINE (server) — real o'yinchilar: Leaderboard, Live lenta, Giveaway
//  CFG.API_URL bo'sh bo'lsa — offline rejim (faqat shu qurilma)
// =====================================================================
// Server manzili: bot havolasidagi ?api= (avto) → CFG.API_URL → oxirgi saqlangan. Faqat ruxsat etilgan domenlar.
const API = (() => {
  const ok = u => { try { const x = new URL(u); if (x.protocol !== 'https:' && x.hostname !== 'localhost' && x.hostname !== '127.0.0.1') return false; const cfg = CFG.API_URL ? new URL(CFG.API_URL).host : ''; return x.host === cfg || /\.trycloudflare\.com$/i.test(x.hostname) || (CFG.API_HOSTS || []).includes(x.hostname) || x.hostname === 'localhost' || x.hostname === '127.0.0.1' } catch (e) { return false } };
  let q = ''; try { q = new URLSearchParams(location.search).get('api') || '' } catch (e) {}
  let saved = ''; try { saved = localStorage.getItem('riki_api') || '' } catch (e) {}
  const pick = [q, CFG.API_URL, saved].map(x => String(x || '').replace(/\/+$/, '')).find(x => x && ok(x)) || '';
  if (pick && pick === q) { try { localStorage.setItem('riki_api', pick) } catch (e) {} }
  return pick;
})();
const NET = { on: false, admin: false, lb: [], lbTs: 0, feed: [], ga: [], gaTs: 0 };
async function api(path, opt) {
  opt = opt || {};
  if (!API) throw new Error('offline');
  const r = await fetch(API + path, { method: opt.method || 'GET', headers: { 'Content-Type': 'application/json', 'X-Init-Data': (tg && tg.initData) || '', 'X-Dev-User': tg && tg.initData ? '' : String(TGU.id || 0) + ':' + ME }, body: opt.body ? JSON.stringify(opt.body) : undefined });
  if (!r.ok) { let m = 'HTTP ' + r.status; try { m = (await r.json()).error || m } catch (e) {} throw new Error(m) }
  return r.json();
}
const isAdmin = () => NET.on ? NET.admin : (CFG.ADMIN_IDS || []).map(String).includes(String(TGU.id || 0));
const myPoints = () => Math.round(S.wag * 100);
const myPvp = () => Math.round((S.pvpScore || 0) * 100);
let statT = 0;
// ---- server boshqaruvi: reset epoxalari, blok, texnik ishlar, o'chirilgan o'yinlar
function srvState(d) {
  if (!d || !d.ep) return;
  NET.cfg = { off: d.off || [], maint: !!d.maint }; if (d.rtp) CFG.RTP = d.rtp; if (d.tonRate) CFG.TON_RATE = d.tonRate; if (d.starsRate) CFG.STARS_RATE = d.starsRate;
  const e = d.ep;
  if (!S.ep) { S.ep = e; save(); }                       // birinchi ulanish: joriy holatni qabul qilamiz
  else if (S.ep.all !== e.all) {                          // to'liq reset
    try { localStorage.removeItem(CFG.STORAGE_KEY); if (tg && tg.CloudStorage) tg.CloudStorage.removeItem(CFG.STORAGE_KEY) } catch (x) {}
    const fresh = defState(); fresh.ep = e; try { localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(fresh)) } catch (x) {}
    toastG('The game was reset by the admin'); setTimeout(() => location.reload(), 900); return;
  } else {
    let ch = false;
    if (S.ep.bal !== e.bal) { S.bal = 0; renderBal(); ch = true; toastG('Your balance was reset by the admin') }
    if (S.ep.pts !== e.pts) { S.wag = 0; S.pvpScore = 0; ch = true; NET.lbTs = 0 }
    if (ch) { S.ep = e; save(); pushStats(true) }
  }
  blockSync();
}
function srvErr(e) { const m = (e && e.message) || ''; if (m === 'banned') { NET.banned = true; blockSync() } else if (m === 'maintenance') { NET.cfg = Object.assign(NET.cfg || {}, { maint: true }); blockSync() } }
document.body.insertAdjacentHTML('beforeend', `<div class="offlv blk" id="blkLv"><div class="ob"><b id="blkT"></b><small id="blkS"></small><button class="btn-p" id="blkB">Back to Home</button></div></div>`);
function blockSync() {
  const c = NET.cfg || {}, adm = NET.admin; let t = '', st = '', home = true;
  if (NET.banned) { t = 'Account blocked'; st = 'Your account has been blocked. Contact support if you think this is a mistake.'; home = false }
  else if (c.maint && !adm) { t = 'Maintenance'; st = 'We are improving the app. Please come back in a few minutes.'; home = false }
  else if ((c.off || []).includes(cur === 'boxp' || cur === 'daily' ? 'cases' : cur) && !adm) { t = 'Temporarily unavailable'; st = 'This game is turned off for now. Please try another game.' }
  $id('blkLv').classList.toggle('on', !!t); $id('blkT').textContent = t; $id('blkS').textContent = st; $id('blkB').style.display = home ? '' : 'none';
}
$id('blkB').onclick = () => go('home');
setInterval(() => { if (API && (NET.on || NET.banned || (NET.cfg && NET.cfg.maint))) pushStats(true) }, 4000);
function pushStats(now) {
  if (!NET.on) return; clearTimeout(statT);
  statT = setTimeout(() => { const ep = S.ep || {}; api('/api/stats', { method: 'POST', body: { name: pubName(), photo: pubPhoto(), points: myPoints(), pvp: myPvp(), bal: S.bal, inv: S.inv.length, invv: r2(sumV(S.inv.map(x => x.v))), pe: ep.pts, be: ep.bal, ae: ep.all, gl: (NET.glS = (NET.gl || []).splice(0)) } }).then(srvState).catch(e => { NET.gl = (NET.glS || []).concat(NET.gl || []); srvErr(e) }) }, now ? 0 : 4000);
}
async function pullLb(force) {
  if (!NET.on || (!force && Date.now() - NET.lbTs < 15000)) return;
  try { const d = await api('/api/leaderboard'); NET.lb = d.list || []; NET.online = d.online || 0; NET.lbTs = Date.now(); NET.lbEnd = d.endsAt || 0; NET.lbLast = d.last || {}; NET.lbErr = false } catch (e) { NET.lbErr = true; console.warn('leaderboard:', e.message) }
}
// ---------------- Live lenta (real yutuqlar) ----------------
function feedPush(g, v, game) {
  const it = { kind: 'gift', sh: g.sh, n: g.n, v: Math.round(v * 100) / 100, name: pubName(), game: game || '', t: Date.now() };
  NET.feed.unshift(it); NET.feed = NET.feed.slice(0, 30);
  S.myFeed = [it].concat(S.myFeed || []).slice(0, 30); save();
  if (NET.on) api('/api/feed', { method: 'POST', body: it }).catch(e => console.warn('feed post:', e.message));
  feedDraw();
}
async function pullFeed() { if (!NET.on) return; try { const d = await api('/api/feed'); const prev = new Set((NET.feed || []).map(x => x.t + x.name)); NET.feed = d.list || []; NET.feedNew = NET.feedLoaded ? NET.feed.filter(x => !prev.has(x.t + x.name)).length : 0; NET.feedLoaded = true; NET.feedErr = false } catch (e) { NET.feedErr = true; console.warn('feed:', e.message) } feedDraw() }
function feedTile(x, i, isNew) {
  const ton = x.kind === 'ton' || !x.sh && !x.n;
  if (ton) return `<div class="fi ton ${isNew ? 'nw' : ''}" data-fi="${i}">${GEM.replace('class="gem"', 'class="gem fton"')}</div>`;
  const g = GBS[x.sh] || GBN[x.n]; if (!g) return '';
  return `<div class="fi tiers${tierOf(x.v)} ${isNew ? 'nw' : ''}" data-fi="${i}">${GI(g)}</div>`;
}
function feedDraw() {
  const f = $id('feed'); if (!f) return;
  const l = (NET.on ? NET.feed : (S.myFeed || [])).slice(0, 14);
  const loading = !!API && (!NET.pinged || (NET.on && !NET.feedLoaded));
  f.innerHTML = loading ? `<div class="fempty"><span class="spin" style="width:14px;height:14px;display:inline-block;vertical-align:-2px;margin-right:6px"></span>Loading live drops...</div>`
    : l.length ? l.map((x, i) => feedTile(x, i, i < (NET.feedNew || 0))).join('') : `<div class="fempty">${NET.feedErr ? 'Live feed is unavailable right now' : 'No drops yet — be the first!'}</div>`;
  f.onclick = e => { const d = e.target.closest('[data-fi]'); if (!d) return; const x = l[+d.dataset.fi]; const what = x.kind === 'ton' || !x.sh ? `${g$(x.v)}` : `${esc(x.n)} (${g$(x.v)})`; toast(`<b>${esc(x.name)}</b> won ${what}${x.game ? ' in ' + esc(x.game) : ''}`) };
  const f2 = $id('feed2'); if (f2) { f2.innerHTML = f.innerHTML; f2.onclick = f.onclick }
  NET.feedNew = 0;
}
function feedPushTon(v, game) {
  const it = { kind: 'ton', v: r2(v), name: pubName(), game, t: Date.now() };
  NET.feed.unshift(it); NET.feed = NET.feed.slice(0, 30); S.myFeed = [it].concat(S.myFeed || []).slice(0, 30); save();
  if (NET.on) api('/api/feed', { method: 'POST', body: it }).catch(e => console.warn('feed post:', e.message));
  feedDraw();
}
// addItem kengaytmasi: sovg'a yutilganda lentaga yoziladi (market xaridi bundan mustasno)
const _addItem = addItem;
addItem = function (g, v, n, m, ms, noFeed) { const it = _addItem(g, v, n, m, ms); if (!noFeed) feedPush(g, it.v); return it };
const _logGame5 = logGame;
const LOCAL_G = ['Mines', 'Dice', 'Plinko', 'Spins'];
logGame = function (game, bet, win, note) { _logGame5(game, bet, win, note); (NET.gl = NET.gl || []).push([game.split(' ')[0], r2(+bet || 0), r2(+win || 0)]); if (NET.gl.length > 200) NET.gl.shift(); pushStats(); if (LOCAL_G.includes(game) && win >= .5 && win >= bet * 2) feedPushTon(win, game) };

// ---------------- Leaderboard (faqat real o'yinchilar) ----------------
const LB_PRIZE = ['Heart Locket', "Durov's Cap", 'Precious Peach', 'Astral Shard', 'Ion Gem', 'Magic Potion', 'Swiss Watch', 'Kissed Frog', 'Toy Bear', 'Jolly Chimp'];
const prizeFor = i => byName(LB_PRIZE[Math.min(i, LB_PRIZE.length - 1)]);
function lbData(kind) {
  const key = kind === 'pvp' ? 'pvp' : 'points';
  let l = NET.on ? NET.lb.map(x => ({ id: x.id, name: x.name, photo: x.photo, s: x[key] || 0 })) : [];
  if (!NET.on && (key === 'pvp' ? myPvp() : myPoints()) > 0) l = [{ id: TGU.id, name: ME, photo: TGU.photo_url, s: key === 'pvp' ? myPvp() : myPoints(), me: 1 }];
  l = l.filter(x => x.s > 0).sort((a, b) => b.s - a.s);
  const mi = l.findIndex(x => String(x.id) === String(TGU.id || 0));
  return { l, rank: mi >= 0 ? mi + 1 : 0, mine: key === 'pvp' ? myPvp() : myPoints() };
}
const avP = (name, photo) => photo ? `<span class="av" style="background:#333 url('${esc(photo)}') center/cover"></span>` : avHTML(name);
function lbRows(d, max) {
  return d.l.slice(0, max).map((r, i) => `<div class="lr ${i < 3 ? 't' + (i + 1) : ''}"><span class="n">${i + 1}</span>${avP(r.name, r.photo)}<b>${esc(r.name)}${String(r.id) === String(TGU.id || 0) ? ' <span class="you">YOU</span>' : ''}</b><span class="pz">${GI(prizeFor(i))}</span><span class="lpt">${fmtK(r.s)}</span></div>`).join('') || `<div class="empty">No players yet — play and be the first!</div>`;
}
const LBEND = (() => { const W0 = (4 * 86400 + 14 * 3600) * 1000, W = 604800000; return W0 + (Math.floor((Date.now() - W0) / W) + 1) * W })(); // server bilan bir xil: dushanba 14:00 UTC
ENTER.leader = async () => {
  const draw = () => {
    const d = lbData('points');
    $id('leader').innerHTML = `<div class="lbc"><div class="bgg">${GI(byName('Heart Locket'))}</div><div class="t"><i>${IC.trophy}</i>Leaderboard<button id="lbQ">${IC.help}</button></div><div class="r"><div><small>Ends in</small><div class="ends" id="lbE">${IC.clock}${dur((NET.lbEnd || LBEND) - Date.now())}</div></div><div class="pw"><small>Prizes &amp; Winners</small><b>${IC.users.replace('class="ic"', 'class="ic" style="width:16px;height:16px"')}${Math.max(d.l.length, 1)}</b></div></div><p>Compete with others and win amazing prizes!</p></div>
    <div class="tph">${IC.trophy}Top Players <button class="rf" id="lbR">${IC.refresh}</button><span><em style="font-style:normal">Prize</em><em style="font-style:normal">Points</em></span></div>
    <div id="lbRows">${NET.on && !NET.lbTs ? `<div class="lbload"><span class="spin"></span>Loading leaderboard...</div>` : NET.lbErr && !NET.lb.length ? `<div class="empty">Couldn't load the leaderboard. Pull to refresh.</div>` : lbRows(d, 250)}</div>
    <div class="lbme"><span class="r9">${d.rank ? d.rank : '999+'}</span>${avP(pubName(), pubPhoto())}<span class="you">YOU</span><span class="x">✕</span><span class="lpt">${d.mine >= 1000 ? fmtK(d.mine) : Math.round(d.mine || 0) || 1}</span></div>`;
    $id('lbR').onclick = async () => { await pullLb(true); draw(); toast('Updated') };
    $id('lbQ').onclick = () => howModal('Leaderboard', [['Play any game', `Every ${CUR} you bet earns points (1 ${CUR} = 100 points).`], ['Climb the ranks', 'Only real active players are listed.'], ['Get your prize', 'Top players receive the prizes shown next to their rank.']]);
  };
  draw(); await pullLb(); if (cur === 'leader') draw();
};
setInterval(() => { const e = $id('lbE'); if (e && cur === 'leader') e.innerHTML = `${IC.clock}${dur(Math.max(0, (NET.lbEnd || LBEND) - Date.now()))}` }, 1000);
// PvP hub leaderboard ham real
const _pvHubEnter = ENTER.pvphub;
ENTER.pvphub = async () => {
  _pvHubEnter && _pvHubEnter();
  const draw = () => { const d = lbData('pvp'); const sw = ICO.swords.replace('class="ic"', 'class="ic" style="width:12px;height:12px;vertical-align:-2px"'); $id('phLb').innerHTML = `<div class="lrow me"><span class="rk">${d.rank || '–'}</span>${avP(pubName(), pubPhoto())}<div><b>${esc(pubName())}</b><span class="you">You</span><br><small style="color:#fbbf24">${d.rank ? 'Rank ' + d.rank : 'Unranked'}</small></div><span class="sc" style="margin-left:auto">${sw}${fmtK(d.mine)}</span></div>` + (d.l.slice(0, 10).map((r, i) => `<div class="lrow ${i < 3 ? 't' + (i + 1) : ''}"><span class="rk">${i + 1}</span>${avP(r.name, r.photo)}<b>${esc(r.name)}</b><span class="gi">${GI(prizeFor(i))}</span><span class="sc">${sw}${fmtK(r.s)}</span></div>`).join('') || `<div class="empty">No PvP players yet</div>`) };
  draw(); await pullLb(); if (cur === 'pvphub') draw();
};

// ---------------- Giveaways (admin yaratadi) ----------------
const UZM = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const uzDate = ms => { const d = new Date(ms); return `${d.getDate()} ${UZM[d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}` };
const gaList = () => NET.on ? NET.ga : (S.gaLocal || []);
async function pullGa(force) {
  if (!NET.on) { gaLocalFinalize(); return }
  if (!force && Date.now() - NET.gaTs < 10000) return;
  try { const d = await api('/api/giveaways'); NET.ga = d.list || []; NET.gaTs = Date.now() } catch (e) {}
}
// offline: tugagan giveaway — ishtirok etgan bo'lsangiz, sovg'alar sizga
function gaLocalFinalize() {
  (S.gaLocal || []).forEach(g => {
    if (g.endAt > Date.now() || g.winners) return;
    const my = S.ga[g.id] || 0;
    g.winners = g.gifts.map(x => ({ name: my ? ME : '—', sh: x.sh, n: x.n, p: x.p }));
    if (my) g.gifts.forEach(x => { const gg = GBS[x.sh] || byName(x.n); addItem(gg, gg.p) });
    if (my) setTimeout(() => balModal(g.gifts.reduce((s, x) => s + x.p, 0), { g: GBS[g.gifts[0].sh] || byName(g.gifts[0].n) }, 'You won a giveaway! 🎉'), 300);
  });
  save();
}
const gaGift = x => GBS[x.sh] || byName(x.n);
function gaCard(g) {
  const ended = g.endAt <= Date.now() || g.status === 'ended'; const my = NET.on ? (g.my || 0) : (S.ga[g.id] || 0); const pool = NET.on ? (g.pool || 0) : my;
  const adm = isAdmin() ? `<div class="gadm">${ended ? '' : `<button data-gend="${g.id}">End now</button>`}<button data-gdel="${g.id}">Delete</button></div>` : '';
  return `<div class="gac"><div class="hd" data-gall="${g.id}">${IC.gift.replace('class="ic"', 'class="ic" style="width:15px;height:15px"')}${esc(g.title || 'All Gifts')} <em>${g.gifts.length}</em>${g.vip ? `<span class="vp">${GEM}Bronze+</span>` : ''}</div><div class="gs">${g.gifts.slice(0, 3).map(x => { const gi = gaGift(x); return `<div><div class="im" style="background:radial-gradient(circle,${TIER_C[tierOf(x.p)]}55,#2d2d2d 70%)">${GI(gi)}</div><b>${esc(x.n)}</b><small>${g$(x.p)}</small></div>` }).join('')}</div><div class="st"><div><small>${IC.box}Ticket Pool</small><b>${pool.toLocaleString('ru-RU')}</b></div><div><small>${IC.clock}${ended ? 'Giveaway Ended' : 'Time Remaining'}</small><b class="${ended ? 'end' : ''}">${ended ? uzDate(g.endAt) : dur(g.endAt - Date.now()).replace(/ \d+s$/, '')}</b></div></div>${ended ? `<button class="btn-w win" data-win="${g.id}">${IC.trophy}Winners</button>` : my ? `<button class="btn-w jn" data-join="${g.id}">✓ Joined · ${my} ticket (+1)</button>` : `<button class="btn-w ${g.vip ? 'vip' : ''}" data-join="${g.id}">${g.vip ? 'Join VIP Giveaway' : 'Join Giveaway'}</button>`}${adm}</div>`;
}
function gaRender() {
  const all = gaList(); const act = all.filter(g => !(g.endAt <= Date.now() || g.status === 'ended')), fin = all.filter(g => g.endAt <= Date.now() || g.status === 'ended');
  let l = E5.gt === 'active' ? act : fin;
  const myN = g => NET.on ? (g.my || 0) : (S.ga[g.id] || 0);
  if (E5.gm === 'mine') l = l.filter(g => myN(g));
  l = [...l].sort(E5.gs === 'pool' ? (a, b) => b.gifts.reduce((s, x) => s + x.p, 0) - a.gifts.reduce((s, x) => s + x.p, 0) : E5.gt === 'active' ? (a, b) => a.endAt - b.endAt : (a, b) => b.endAt - a.endAt);
  return `${isAdmin() ? `<button class="btn-y" id="gaNew" style="margin-bottom:11px">＋ Create giveaway (admin)</button>` : ''}<div class="gtabs"><button data-g="active" class="${E5.gt === 'active' ? 'on' : ''}">Active <em>${act.length}</em></button><button data-g="fin" class="${E5.gt === 'fin' ? 'on' : ''}">Finished <em>${fin.length}</em></button></div><div class="gflt"><button data-m="all" class="${E5.gm === 'all' ? 'on' : ''}">All</button><button data-m="mine" class="${E5.gm === 'mine' ? 'on' : ''}">Mine</button><span class="sp"></span><button data-s="end" class="${E5.gs !== 'pool' ? 'on' : ''}">${IC.cal}End date</button><button data-s="pool" class="${E5.gs === 'pool' ? 'on' : ''}">${IC.gift}Prize pool</button></div>${l.map(gaCard).join('') || `<div class="empty">${E5.gt === 'active' ? 'No active giveaways' : 'No finished giveaways'}</div>`}`;
}
async function gaJoin(id) {
  const g = gaList().find(x => x.id === id); if (!g) return;
  if (g.vip && S.wag < 5000) { toast('VIP Bronze required (5 000 ' + CUR + ' turnover)'); return }
  if (S.tix < 1) { toast('Not enough tickets — complete tasks'); E5.tab = 'earn'; earnRender(); return }
  if (NET.on) { try { const d = await api(`/api/giveaways/${id}/join`, { method: 'POST', body: { n: 1 } }); g.my = d.my; g.pool = d.pool } catch (e) { toast('Error: ' + e.message); return } }
  else S.ga[id] = (S.ga[id] || 0) + 1;
  S.tix--; save(); toastG('Giveaway: +1 ticket'); earnRender();
}
async function gaAdminAct(kind, id) {
  if (kind === 'del' && !confirm('Delete this giveaway?')) return;
  if (NET.on) { try { await api(`/api/giveaways/${id}${kind === 'end' ? '/end' : ''}`, { method: kind === 'end' ? 'POST' : 'DELETE' }); await pullGa(true) } catch (e) { toast('Error: ' + e.message); return } }
  else { const l = S.gaLocal || []; const g = l.find(x => x.id === id); if (kind === 'del') S.gaLocal = l.filter(x => x.id !== id); else if (g) { g.endAt = Date.now() - 1; gaLocalFinalize() } save() }
  earnRender();
}
// ---- admin: yangi giveaway oynasi
document.body.insertAdjacentHTML('beforeend', `<div class="modal" id="gaNewM"><div class="mbox"><div class="mhead">New giveaway<button class="mx" data-close>✕</button></div><div class="mbody">
  <div class="lbl2">Title</div><div class="inp"><input id="gnT" placeholder="All Gifts" maxlength="40"></div>
  <div class="lbl2">Gifts <span id="gnCnt"></span></div><div class="gnsel" id="gnSel"></div>
  <input class="gpsearch" id="gnQ" placeholder="Search gifts: Plush Pepe, Durov's Cap..."><div class="gnpick" id="gnPick"></div>
  <div class="lbl2">Duration</div><div class="gndur" id="gnDur"><button data-h="1">1 hour</button><button data-h="6">6 hours</button><button data-h="12">12 hours</button><button data-h="24" class="on">1 day</button><button data-h="72">3 days</button><button data-h="168">7 days</button></div>
  <div class="inp" style="margin-top:8px"><input id="gnEnd" type="datetime-local"></div>
  <div class="mrow" style="margin:12px 0 0"><span>VIP only (Bronze+)</span><label class="sw"><input type="checkbox" id="gnVip"><i></i></label></div>
  <button class="btn-g" id="gnGo" style="margin-top:15px">Create giveaway</button>
  <p class="note" style="margin-top:9px">One winner is drawn per gift, weighted by tickets. Winners are notified by the bot and the gift lands in their Backpack.</p>
</div></div></div>`);
const GN = { sel: [], h: 24 };
const dtLocal = ms => { const d = new Date(ms - new Date().getTimezoneOffset() * 6e4); return d.toISOString().slice(0, 16) };
function gnDraw() {
  $id('gnCnt').textContent = GN.sel.length ? `(${GN.sel.length} · ${fmt(GN.sel.reduce((s, g) => s + g.p, 0))} ${CUR})` : '';
  $id('gnSel').innerHTML = GN.sel.map((g, i) => `<span class="gnc" data-rm="${i}">${GI(g)}${esc(g.n)} ✕</span>`).join('') || '<span class="note" style="margin:0">Pick gifts below</span>';
  const q = $id('gnQ').value.trim().toLowerCase();
  $id('gnPick').innerHTML = [...GIFTS].sort((a, b) => b.p - a.p).filter(g => !q || g.n.toLowerCase().includes(q)).slice(0, 60).map(g => `<button data-add="${g.i}">${GI(g)}<b>${esc(g.n)}</b><small>${fmt(g.p)}</small></button>`).join('');
}
function gaNewOpen() { GN.sel = []; GN.h = 24; $id('gnT').value = ''; $id('gnQ').value = ''; $id('gnVip').checked = false; $id('gnEnd').value = dtLocal(Date.now() + 24 * 36e5); $$('#gnDur button').forEach(b => b.classList.toggle('on', +b.dataset.h === 24)); gnDraw(); openM('gaNewM') }
$id('gnQ').oninput = gnDraw;
$id('gnPick').onclick = e => { const b = e.target.closest('[data-add]'); if (!b) return; if (GN.sel.length >= 50) { toast('Maximum 50'); return } GN.sel.push(GIFTS[+b.dataset.add]); hap(); gnDraw() };
$id('gnSel').onclick = e => { const b = e.target.closest('[data-rm]'); if (!b) return; GN.sel.splice(+b.dataset.rm, 1); gnDraw() };
$id('gnDur').onclick = e => { const b = e.target.closest('[data-h]'); if (!b) return; GN.h = +b.dataset.h; $$('#gnDur button').forEach(x => x.classList.toggle('on', x === b)); $id('gnEnd').value = dtLocal(Date.now() + GN.h * 36e5) };
$id('gnEnd').onchange = () => $$('#gnDur button').forEach(x => x.classList.remove('on'));
$id('gnGo').onclick = async () => {
  if (!GN.sel.length) { toast('Select at least 1 gift'); return }
  const endAt = new Date($id('gnEnd').value).getTime(); if (!(endAt > Date.now() + 6e4)) { toast('End time must be at least 1 minute ahead'); return }
  const body = { title: $id('gnT').value.trim() || 'All Gifts', gifts: GN.sel.map(g => ({ sh: g.sh, n: g.n, p: g.p })), endAt, vip: $id('gnVip').checked };
  if (NET.on) { try { await api('/api/giveaways', { method: 'POST', body }); await pullGa(true) } catch (e) { toast('Error: ' + e.message); return } }
  else { S.gaLocal = S.gaLocal || []; S.gaLocal.unshift(Object.assign({ id: 'l' + Date.now().toString(36), createdAt: Date.now() }, body)); save() }
  closeM('gaNewM'); E5.tab = 'ga'; E5.gt = 'active'; earnRender(); toastG('Giveaway created');
};
// ---- g'oliblik sovg'alari (server)
async function pullRewards() {
  if (!NET.on) return;
  try {
    const d = await api('/api/rewards'); const l = d.list || []; if (!l.length) return;
    await api('/api/rewards/claim', { method: 'POST', body: { ids: l.map(r => r.id) } });
    let firstGift = null, gram = 0, tix = 0, from = '', win = 0, wonG = 0, wonFrom = '', wonGame = 0; const wonItems = [];
    l.forEach(r => {
      if (r.kind === 'win') { win += +r.p || 0; setBal(+r.p || 0); S.pvpScore = (S.pvpScore || 0) + (+r.tot || +r.p || 0); wonFrom = r.from; wonGame = r.game || wonGame }
      else if (r.kind === 'gram') { gram += +r.p || 0; setBal(+r.p || 0); from = r.from }
      else if (r.kind === 'ref') { tix += r.tix || 5; S.tix += r.tix || 5; S.ref = (S.ref || 0) + 1 }
      else { const g = GBS[r.sh] || byName(r.n); const it = addItem(g, r.p || g.p, null, r.m || null, r.ms || null, true); if (r.win) { wonG += +r.p || 0; wonFrom = r.from; wonGame = r.game || wonGame; wonItems.push(it) } else firstGift = firstGift || { g, ms: it.ms, from: r.from, ga: !!r.ga } }
    });
    save();
    if ((win || wonG) && wonFrom === 'PvP' && $id('pvWM') && $id('pvWM').classList.contains('on')) { toastG(`+${fmt(win + wonG)} ${CUR} added to your balance`); return }
    if (win || wonG) { winSheet(wonFrom, win, wonItems, wonGame); return }
    if (firstGift) balModal(l.filter(r => r.kind !== 'gram' && r.kind !== 'ref').reduce((s, r) => s + (r.p || 0), 0), firstGift, firstGift.ga ? 'You won a giveaway! 🎉' : `🎁 ${esc(firstGift.from || '')} sent you a gift`);
    else if (gram > 0) { if (from === 'Deposit') S.dep = (S.dep || 0) + gram; save(); balModal(gram, null, from === 'Deposit' ? 'Balance Increased!' : from === 'Bonus' ? 'Bonus activated! 🎁' : `💎 ${esc(from)} sent you ${fmt(gram)} ${CUR}`) }
    else if (gram < 0) toastG(`Balance adjusted: ${fmt(gram)} ${CUR}`);
    if (tix) toastG(`+${tix} tickets — your friend joined`);
  } catch (e) {}
}
// =====================================================================
//  TRANSFER — GRAM yoki gift'ni boshqa o'yinchiga yuborish
// =====================================================================
document.body.insertAdjacentHTML('beforeend', `<div class="modal" id="trM"><div class="mbox"><div class="mhead"><span id="trT">Transfer</span><button class="mx" data-close>✕</button></div><div class="mbody">
  <div class="tabs" id="trTabs"><button data-k="gram" class="on">${GEM}${CUR}</button><button data-k="gift">${IC.gift}Gift</button></div>
  <div class="lbl2">Recipient</div><div class="inp"><input id="trTo" placeholder="@username or Telegram ID" autocomplete="off"></div>
  <div class="trwho" id="trWho"></div>
  <div id="trGram"><div class="lbl2">Amount <span style="float:right">Balance: <span class="balv"></span> ${CUR}</span></div><div class="inp"><input id="trAmt" type="number" inputmode="decimal" placeholder="${CUR} amount" step="0.01"><span class="gm">${GEM}</span></div>
    <div class="tuq" style="grid-template-columns:repeat(4,1fr);margin:10px 0 0"><button data-a="1">1</button><button data-a="10">10</button><button data-a="100">100</button><button data-a="max">Max</button></div></div>
  <div id="trGift" style="display:none"><div class="lbl2">Gift</div><div class="trgift" id="trGsel"></div></div>
  <button class="btn-p" id="trGo" style="margin-top:16px">Send</button>
  <p class="note" style="margin-top:10px">The recipient must have opened the app at least once. The bot will notify them.</p>
</div></div></div>`);
const TR = { k: 'gram', to: null, item: null };
function trOpen(kind, item) {
  if (!NET.on) { info('Transfer', `<div class="helpb">Transfers need the server connection.<br><br>1) Run <b>python bot.py</b><br>2) <b>cloudflared tunnel --url http://localhost:8080</b><br>3) Put the URL into <b>js/app.js → CFG.API_URL</b>.</div>`); return }
  TR.k = kind || 'gram'; TR.item = item || null; TR.to = null; $id('trTo').value = ''; $id('trAmt').value = ''; $id('trWho').innerHTML = '';
  trSync(); renderBal(); openM('trM');
}
function trSync() {
  $$('#trTabs button').forEach(b => b.classList.toggle('on', b.dataset.k === TR.k));
  $id('trGram').style.display = TR.k === 'gram' ? '' : 'none'; $id('trGift').style.display = TR.k === 'gift' ? '' : 'none';
  const it = TR.item && invGet(TR.item.id);
  $id('trGsel').innerHTML = it ? `<div class="trsel">${GII(it)}<div><b>${esc(itName(it))}</b><small>${g$(it.v)}</small></div><button id="trPick">Change</button></div>` : `<button class="btn-d" id="trPick">${IC.gift}Pick from Backpack</button>`;
  const pk = $id('trPick'); if (pk) pk.onclick = () => pickGifts({ multi: false, title: 'Gift to send', done: id => { TR.item = invGet(id); trSync(); openM('trM') } });
  const v = parseFloat($id('trAmt').value) || 0;
  const ok = TR.to && (TR.k === 'gram' ? v >= .1 && v <= S.bal : !!it);
  $id('trGo').className = ok ? 'btn-p' : 'btn-d'; $id('trGo').textContent = TR.k === 'gram' ? `Send${v ? ' · ' + fmt(v) + ' ' + CUR : ''}` : 'Send gift';
}
$$('#trTabs button').forEach(b => b.onclick = () => { TR.k = b.dataset.k; trSync() });
$id('trAmt').oninput = trSync;
$$('#trGram .tuq button').forEach(b => b.onclick = () => { $id('trAmt').value = b.dataset.a === 'max' ? fmt(S.bal) : b.dataset.a; trSync() });
let trLook = 0;
$id('trTo').oninput = () => {
  TR.to = null; trSync(); clearTimeout(trLook); const q = $id('trTo').value.trim(); if (q.length < 2) { $id('trWho').innerHTML = ''; return }
  $id('trWho').innerHTML = '<div class="spin" style="width:18px;height:18px"></div>';
  trLook = setTimeout(async () => { try { const u = await api('/api/user?q=' + encodeURIComponent(q)); if (String(u.id) === String(TGU.id)) throw new Error("You can't send to yourself"); TR.to = u; $id('trWho').innerHTML = `<div class="trok">${avP(u.name, u.photo)}<b>${esc(u.name)}</b>${u.username ? `<small>@${esc(u.username)}</small>` : ''}<em>✓</em></div>` } catch (e) { $id('trWho').innerHTML = `<div class="trno">${esc(e.message)}</div>` } trSync() }, 450);
};
$id('trGo').onclick = async () => {
  const v = Math.round((parseFloat($id('trAmt').value) || 0) * 100) / 100, it = TR.item && invGet(TR.item.id);
  if (!TR.to) { toast('Enter a recipient'); return }
  if (TR.k === 'gram' && !(v >= .1 && v <= S.bal)) { toast(v > S.bal ? 'Insufficient balance' : 'Minimum 0.10'); return }
  if (TR.k === 'gift' && !it) { toast("Select a gift"); return }
  if (!confirm(TR.k === 'gram' ? `${fmt(v)} ${CUR} → ${TR.to.name}?` : `${itName(it)} → ${TR.to.name}?`)) return;
  const btn = $id('trGo'); btn.disabled = true;
  try {
    const body = TR.k === 'gram' ? { to: String(TR.to.id), kind: 'gram', amount: v } : { to: String(TR.to.id), kind: 'gift', gift: { sh: GIFTS[it.g].sh, n: GIFTS[it.g].n, p: it.v, m: it.m, ms: it.ms } };
    await api('/api/transfer', { method: 'POST', body });
    if (TR.k === 'gram') setBal(-v); else { invDel([it.id]); bpRender() }
    S.hist.unshift({ game: 'Transfer', bet: TR.k === 'gram' ? v : it.v, win: 0, note: '→ ' + TR.to.name, t: Date.now() }); save();
    closeM('trM'); toastG(`Sent → ${TR.to.name}`); hapN('success');
  } catch (e) { toast('Error: ' + esc(e.message)) }
  btn.disabled = false;
};
const LIVE_G = ['roulette', 'pvp', 'tvt', 'rocket'];
document.body.insertAdjacentHTML('beforeend', `<div class="offlv" id="offLv"><div class="ob"><span class="spin"></span><b id="offT">Connecting to server…</b><small id="offS">Live games are played together with all players. Please wait.</small><button class="btn-p" id="offR">Retry</button></div></div>`);
function offSync() {
  const show = LIVE_G.includes(cur) && !NET.on;
  $id('offLv').classList.toggle('on', show);
  if (!show) return;
  $id('offT').textContent = API ? 'Connecting to server…' : 'Server is not connected';
  $id('offS').textContent = API ? 'Live games are played together with all players. Please wait.' : 'Live games need the game server. Open the app from the bot button.';
  $id('offLv').querySelector('.spin').style.display = API ? '' : 'none';
}
let netTry = 0;
setInterval(() => { if (API && !NET.on && Date.now() - netTry > 5000) netInit() }, 1000);
async function netInit() {
  netTry = Date.now();
  feedDraw();
  if (!API) return;
  try { const d = await api('/api/ping'); NET.on = true; NET.pinged = true; NET.banned = false; offSync(); srvState(d); NET.admin = !!d.admin; pushStats(true); pullFeed(); pullRewards(); pullGa(true) } catch (e) { srvErr(e); if (NET.banned || (NET.cfg && NET.cfg.maint)) { NET.pinged = true; return } NET.on = false; NET.pinged = true; feedDraw(); offSync(); console.warn('API offline:', e.message) }
}
setInterval(() => { if (!NET.on) return; pushStats(true); if (cur === 'roulette') pullLb(true); pullFeed(); pullRewards(); if (cur === 'earn' && E5.tab === 'ga') pullGa().then(() => earnRender()) }, 20000);

ENTER.earn = () => { earnRender(); if (E5.tab === 'ga') pullGa(true).then(() => { if (cur === 'earn') earnRender() }) };
renderTasks = function () { const n = [...T5.lim, ...T5.day].filter(t => { const s = tState(t, T5.day.includes(t) ? 'day' : 'lim'); return !s.done && s.ready && !t.go }).length; const b = $id('earnBadge'); if (b) { b.style.display = n ? '' : 'none'; b.textContent = n } if (cur === 'earn' && E5.tab === 'earn') earnRender() };

// =====================================================================
//  PROFIL / VIP
// =====================================================================
// ---- Anonymous mode (video: "Anonymous mode" oynasi)
const ANONI = '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M3 11h18M6 11l1.5-5h9L18 11M8 16a2 2 0 1 0 0 .01M16 16a2 2 0 1 0 0 .01M10 16h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const ANON_A = ['Vivid', 'Dreamy', 'Chrome', 'Glowing', 'Fancy', 'Cosmic', 'Jolly', 'Velvet', 'Misty', 'Giddy', 'Spicy', 'Jazzy', 'Cobalt', 'Cozy', 'Sunny', 'Polar'];
const ANON_B = ['Otter', 'Titan', 'Nomad', 'Griffin', 'Shark', 'Quasar', 'Zebra', 'Volcano', 'Galaxy', 'Pebble', 'Macaw', 'Pirate', 'Whale', 'Samurai', 'Magpie', 'Python'];
const anonName = () => { const n = Math.abs(+(TGU.id || 7) * 2654435761 % 4294967296); return ANON_A[n % 16] + ' ' + ANON_B[(n >> 4) % 16] };
function pubName() { return S.anon ? anonName() : ME }
function pubPhoto() { return S.anon ? '' : (TGU.photo_url || '') }
document.body.insertAdjacentHTML('beforeend', `<div class="modal sheet2" id="anM"><div class="mbox"><div class="mhead anh"><i>${ANONI}</i><div><b>Anonymous mode</b><small id="anSt"></small></div><button class="mx" data-close>✕</button></div><div class="mbody">
  <div class="an-id"><span class="ai">${ANONI}</span><div><small>Your secret identity</small><b id="anNm"></b><p>Turn the mode on to get a secret name and avatar.</p></div></div>
  <label class="an-sw"><span>Hide my name and photo</span><span class="sw"><input type="checkbox" id="anCb"><i></i></span></label>
  <ul class="an-ul"><li>In PvP, TvT, giveaways, and leaderboards, other players will see your anonymous name and avatar instead of your regular profile.</li><li>Your anonymous name and avatar stay the same. Contact support if you want to change them.</li><li>Only bets and giveaway wins made while Anonymous mode is on are hidden. Previous activity remains under your regular profile.</li><li>You can't turn the mode on or off during a live PvP or TvT round.</li><li>Leaderboards and giveaway top lists show your current choice, so switching back and forth makes it easy for others to tell it's you.</li></ul>
</div></div></div>`);
function anonDraw() { $id('anSt').textContent = S.anon ? 'On' : 'Off'; $id('anSt').className = S.anon ? 'on' : ''; $id('anNm').textContent = S.anon ? anonName() : 'Hidden until enabled'; $id('anCb').checked = !!S.anon }
function anonOpen() { anonDraw(); openM('anM') }
$id('anCb').onchange = () => { const live = (PV.pl || []).some(p => p.me) || (TV.ice || []).concat(TV.fire || []).some(p => p.me); if (live && PV.phase !== 'wait') { $id('anCb').checked = !!S.anon; toast("Can't change during a live round"); return } S.anon = $id('anCb').checked; save(); anonDraw(); if (cur === 'profile') ENTER.profile(); if (typeof pushStats === 'function') pushStats(true) };
const CHK = '<svg viewBox="0 0 24 24" width="17" height="17"><circle cx="12" cy="12" r="10" fill="#8b8b94"/><path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke="#262626" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// videodagi (176719, 0:22–0:34) ro'yxatlar — barcha 7 daraja kadrlardan tekshirilgan
const VIP_PERKS = {
  Iron: ['One-time task: 1 000 Tickets', 'Bonus NFT Gift for reaching a level', 'Exclusive Promo Codes', 'Surprise Gift Drops'],
  Bronze: ['One-time task: 2 500 Tickets', `10 ${CUR} Bonus for Reaching This Level`, 'Exclusive Promo Codes', 'Surprise Gift Drops', 'Exclusive VIP Giveaways'],
  Silver: ['One-time task: 5 000 Tickets', `25 ${CUR} Bonus for Reaching This Level`, 'Exclusive Promo Codes', 'Surprise Gift Drops', 'Exclusive VIP Giveaways', 'PLAYBONUS'],
  Gold: ['One-time task: 10 000 Tickets', `50 ${CUR} Bonus for Reaching This Level`, 'Exclusive Promo Codes', 'Surprise Gift Drops', 'Exclusive VIP Giveaways', 'PLAYBONUS', 'Dedicated VIP Manager'],
  Platinum: ['One-time task: 25 000 Tickets', `100 ${CUR} Bonus for Reaching This Level`, 'Exclusive Promo Codes', 'Surprise Gift Drops', 'Exclusive VIP Giveaways', 'PLAYBONUS', 'Dedicated VIP Manager', 'Bonus From VIP Manager'],
  Diamond: ['One-time task: 100 000 Tickets', `500 ${CUR} Bonus for Reaching This Level`, 'Exclusive Promo Codes', 'Surprise Gift Drops', 'Exclusive VIP Giveaways', 'PLAYBONUS', 'Dedicated VIP Manager', 'Bonus From VIP Manager'],
  Obsidian: ['One-time task: 500 000 Tickets', `2500 ${CUR} Bonus for Reaching This Level`, 'Exclusive Promo Codes', 'Surprise Gift Drops', 'Exclusive VIP Giveaways', 'PLAYBONUS', 'Dedicated VIP Manager', 'Bonus From VIP Manager'],
};
// "How VIP Status Works" — videodagi matn
document.body.insertAdjacentHTML('beforeend', `<div class="modal" id="vipHM"><div class="mbox vhm"><div class="vhh"><i><svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 4h12l3 5-9 11L3 9z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M3 9h18M9 4l3 5 3-5M12 9v11" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></i><b>How VIP Status Works</b><button class="mx" data-close>✕</button></div>
  <h4>Level</h4><p>Your VIP level increases with your total turnover. The more you play, the higher your level and the more rewards you unlock.</p>
  <h4>Privileges</h4><p>Rewards grow with every level: bigger bonuses, exclusive giveaways, promo codes, and a personal VIP manager at the top tiers.</p>
  <h4>PLAYBONUS</h4><p>Part of your bets comes back to you as a bonus. See the PLAYBONUS section for details.</p>
  <div class="vhf">VIP levels are based on your total turnover and do not reset. Some bonuses may be granted individually depending on your activity.</div></div></div>`);
const VIPS = [['Iron', 1000, '#9ca3af'], ['Bronze', 5000, '#d97706'], ['Silver', 10000, '#cbd5e1'], ['Gold', 25000, '#fbbf24'], ['Platinum', 50000, '#a5f3fc'], ['Diamond', 250000, '#c084fc'], ['Obsidian', 1000000, '#334155']];
const dmd = c => `<svg class="dm" viewBox="0 0 48 48"><defs><linearGradient id="dg${c.slice(1)}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="#111" stop-opacity=".6"/></linearGradient></defs><path d="M12 8h24l8 12-20 22L4 20z" fill="url(#dg${c.slice(1)})" stroke="${c}" stroke-width="1.5"/><path d="M4 20h40M12 8l6 12 6-12 6 12 6-12M18 20l6 22 6-22" stroke="#ffffff55" fill="none"/></svg>`;
sec('profile');
ENTER.profile = () => {
  const t = S.wag, lvl = VIPS.filter(v => t >= v[1]).pop(), nx = VIPS.find(v => t < v[1]) || VIPS[VIPS.length - 1];
  const pb = Math.round(t * .0005 * 100) / 100, silver = t >= 10000;
  sec('profile', `<div class="pfhero"><button class="pfc l" id="pfAnon">${ANONI}${S.anon ? 'ON' : 'OFF'}</button><button class="pfc r" id="pfLang">${IC.globe || '🌐'}EN</button><div class="av-wrap">${avP(pubName(), pubPhoto())}</div><b>${esc(pubName())}</b></div>
  <div class="vipc"><div class="hd">${dmd(lvl ? lvl[2] : '#6b7280')}<div><small>VIP-STATUS</small><b>${lvl ? lvl[0] : 'No status'}</b></div><button id="vipQ">${IC.info}</button></div>
  <div class="pr"><b>${fmt(t)} / ${nx[1].toLocaleString('ru-RU')} ${CUR}</b><span>To ${dmd(nx[2]).replace('class="dm"', 'style="width:15px;height:15px"')} ${nx[0]} Level</span></div><div class="bar"><b style="width:${Math.min(100, t / nx[1] * 100)}%"></b></div><div class="ft"><span>Turnover</span><span>${fmt(Math.max(0, nx[1] - t))} ${CUR} left</span></div></div>
  <div class="trbtns"><button class="btn-p" id="pfTrG">💎 Send ${CUR}</button><button class="btn-d" id="pfTrF">🎁 Send Gift</button></div>
  <div class="pbc"><div class="hd"><span>${IC.gift}PLAYBONUS</span>${IC.info}</div><div class="v">${fmt(pb)}${GEM}</div><button class="${silver ? 'btn-p' : 'btn-d'}" id="pbC">${silver ? 'Claim' : IC.lock + 'Reach Silver to claim'}</button><p>PLAYBONUS accumulates automatically and can be claimed after reaching Silver level.</p></div>
  <div class="vipl"><div class="hd">VIP Levels<small>${CUR} Turnover</small></div>${VIPS.map(v => `<div class="vl ${t >= v[1] ? 'got' : ''}">${dmd(v[2])}<div><b>${v[0]} ${t >= v[1] ? '✓' : IC.lock}</b><small>${GEM}${v[1].toLocaleString('ru-RU')} ${CUR}</small></div><span class="ch">${IC.down}</span><div class="bd2">${(VIP_PERKS[v[0]] || []).map(x => `<div class="pk">${CHK}${x}</div>`).join('')}</div></div>`).join('')}</div>`);
  $$('#profile .vl').forEach(e => e.onclick = () => e.classList.toggle('open'));
  $id('pfTrG').onclick = () => trOpen('gram'); $id('pfTrF').onclick = () => trOpen('gift');
  $id('pfAnon').onclick = anonOpen; $id('pfLang').onclick = () => toast('Language: English');
  $id('vipQ').onclick = () => openM('vipHM');
  $id('pbC').onclick = () => { if (!silver) return; const c = pb - (S.pbClaimed || 0); if (c <= 0) { toast('No bonus yet'); return } S.pbClaimed = pb; setBal(c); balModal(c) };
};

// =====================================================================
//  Tarix / yordam tugmalari
// =====================================================================
$id('hHist').onclick = () => {
  if (cur === 'mines') return pfHistory();
  if (cur === 'tvt') return tvHist('all');
  if (cur === 'pvp' && NET.on) return liveHist('pvp');
  const map = { rocket: 'Rocket', pvp: 'PvP', mines: 'Mines', spins: 'Spins', plinko: 'Plinko', dice: 'Dice' };
  const l = S.hist.filter(h => !map[cur] || h.game.startsWith(map[cur]));
  $id('pfT').textContent = 'History';
  $id('pfB').innerHTML = l.length ? l.slice(0, 60).map(h => `<div class="hr2"><div class="top"><span class="xb ${h.win > 0 ? 'w' : 'l'}">×${h.bet ? (h.win / h.bet).toFixed(2) : '—'}</span><div class="tx"><b>${esc(h.game)} <em>${esc(h.note)}</em></b><small>${fmt(h.bet)} ${CUR}</small><small>${new Date(h.t).toTimeString().slice(0, 8)} · Payout: ${fmt(h.win)} ${CUR}</small></div></div></div>`).join('') : '<div class="empty">No games yet</div>';
  openM('pfM');
};
$id('hHelp').onclick = () => { const h = HOWS[cur] || HOWS.rocket; howModal(h[0], h[1]) };

// =====================================================================
//  Valyuta matnlari (TON -> GRAM)
// =====================================================================
$$('input[placeholder="TON amount"]').forEach(i => i.placeholder = CUR + ' amount');
document.querySelectorAll('.demo').forEach(e => e.textContent = 'DEMO');

// =====================================================================
//  Ishga tushirish
// =====================================================================
rkSetSkin(); rkResize(); netInit();
setTimeout(() => $id('splash').classList.add('off'), 900);
setTimeout(() => $id('splash').remove(), 1400);
renderTasks();
setInterval(() => {
  const r = $id('tvRes');
  if (TV.phase === 'done' && TV.win) { if (!TV.doneAt) TV.doneAt = Date.now(); r.className = 'on ' + TV.win; r.querySelector('b').textContent = (TV.win === 'ice' ? 'Ice' : 'Fire') + ' wins'; r.querySelector('small').textContent = 'Next round in ' + Math.max(0, Math.ceil((TV.doneAt + 5000 - Date.now()) / 1000)) + 's' }
  else { TV.doneAt = 0; r.className = '' }
}, 250);
// =====================================================================
//  v7 — PvP Hub (PvP / TvT / Roulette), Roulette o'yini, Increase oynasi,
//  Backpack kartalari, Deposit (TON / Stars / Transfer / Send gift), P2P
// =====================================================================
const RL_COL = ['#3df2ff', '#ff2d95', '#2563eb', '#ff6b5a', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#eab308', '#14b8a6'];
const sumV = arr => arr.reduce((s, x) => s + (+x || 0), 0);
const r2 = v => Math.round(v * 100) / 100;

// ---------------------------------------------------------------- Increase oynasi (Gifts / TON)
document.body.insertAdjacentHTML('beforeend', `<div class="modal" id="incM"><div class="mbox"><div class="mhead"><span id="incT">Increase</span><button class="mx" data-close>✕</button></div><div class="mbody">
  <div class="tabs" id="incTabs"><button data-t="gift" class="on">Gifts</button><button data-t="ton">${CUR}</button></div>
  <div id="incGift"><div class="incsum"><small id="incN">No gifts selected</small><b id="incV">${GEM}0 ${CUR}</b><em id="incNew"></em></div><button class="btn-y" id="incGo">Increase</button><div class="lbl2" id="incLbl">Select gifts</div><div class="incgrid" id="incGrid"></div></div>
  <div id="incTon" style="display:none"><div class="mrow"><span>Available balance</span><b><span class="balv"></span>${GEM}</b></div><div class="lbl2">Bet amount</div><div class="inp"><input id="incAmt" type="number" inputmode="decimal" placeholder="${CUR} amount" step="0.01"><span class="gm">${GEM}</span></div><button class="btn-b" id="incGoT" style="max-width:none;margin-top:14px">Place bet</button></div>
</div></div></div>`);
const INC = { sel: [], cb: null, cur: 0 };
function incOpen(o) {
  INC.sel = []; INC.cb = o.done; INC.cur = o.current || 0;
  $id('incT').textContent = o.title || 'Increase'; $id('incGo').textContent = o.btn || 'Increase'; $id('incAmt').value = '';
  incTab(o.tab || (S.inv.length ? 'gift' : 'ton')); renderBal(); openM('incM');
}
function incTab(t) {
  $$('#incTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  $id('incGift').style.display = t === 'gift' ? '' : 'none'; $id('incTon').style.display = t === 'ton' ? '' : 'none'; incDraw();
}
function incDraw() {
  const v = sumV(INC.sel.map(id => invGet(id)?.v));
  $id('incN').textContent = INC.sel.length ? `${INC.sel.length} gifts selected` : 'No gifts selected';
  $id('incV').innerHTML = `${GEM}+${fmt(v)} ${CUR}`; $id('incNew').textContent = INC.cur || v ? `New total: ${fmt(INC.cur + v)}` : '';
  $id('incGo').className = 'btn-y' + (INC.sel.length ? '' : ' dim');
  $id('incLbl').textContent = INC.sel.length ? 'Select more gifts' : 'Select gifts';
  $id('incGrid').innerHTML = S.inv.length ? [...S.inv].sort((a, b) => b.v - a.v).map(it => `<button class="incg ${INC.sel.includes(it.id) ? 'on' : ''}" data-id="${it.id}"><i class="ck"></i><em>${fmt(it.v)}${GEM}</em>${GII(it)}<b>${esc(GIFTS[it.g].n)}</b><span>${esc(it.m || 'Random')}</span></button>`).join('') : `<div class="empty">Your backpack is empty — <a data-go="home">open boxes</a></div>`;
}
$$('#incTabs button').forEach(b => b.onclick = () => incTab(b.dataset.t));
$id('incGrid').onclick = e => { const b = e.target.closest('.incg'); if (!b) return; const id = b.dataset.id; INC.sel = INC.sel.includes(id) ? INC.sel.filter(x => x !== id) : [...INC.sel, id]; hap(); incDraw() };
$id('incGo').onclick = () => { if (!INC.sel.length) return; const items = INC.sel.map(invGet).filter(Boolean); invDel(items.map(x => x.id)); closeM('incM'); INC.cb && INC.cb({ ton: 0, gifts: items }) };
$id('incGoT').onclick = () => { const v = r2(parseFloat($id('incAmt').value) || 0); if (v < .1) { toast(`Minimum bet ${GEM}0.10`); return } if (v > S.bal) { toast('Insufficient balance'); go('topup'); return } setBal(-v); closeM('incM'); INC.cb && INC.cb({ ton: v, gifts: [] }) };

// ---------------------------------------------------------------- PvP: "Increase" (videodagidek)
const _pvRender7 = pvRender;
pvRender = function (force) {
  _pvRender7(force);
  const mine = PV.pl.find(p => p.me), b = $id('pvJoin');
  if (mine && PV.phase === 'wait') { b.className = 'bigbtn y'; b.textContent = 'Increase' }
  $$('#pvPl .vrow').forEach((r, i) => r.style.setProperty('--c', ([...PV.pl].sort((a, b) => b.amt - a.amt)[i] || {}).c || '#555'));
};
const _pvJoin7 = $id('pvJoin').onclick;
$id('pvJoin').onclick = () => {
  const mine = PV.pl.find(p => p.me);
  if (!mine && betVal('pv') > 0) return _pvJoin7();
  if (PV.phase !== 'wait') { toast('Round in progress'); return }
  incOpen({ title: mine ? 'Increase' : 'Place bet', btn: mine ? 'Increase' : 'Join the Battle', current: mine ? mine.amt : 0, done: r => { pvAdd(ME, r2(r.ton + sumV(r.gifts.map(x => x.v))), true); PV.pl.find(p => p.me).gifts = (PV.pl.find(p => p.me).gifts || []).concat(r.gifts); hap('medium'); pvRender(true) } });
};

// ---------------------------------------------------------------- ROULETTE
const GEMW = '<svg class="gw2" viewBox="0 0 24 24"><path d="M7.3 3.2h9.4a2.4 2.4 0 0 1 2 1.1l2.7 4.3a1.6 1.6 0 0 1-.1 1.9l-8.1 9.9a1.6 1.6 0 0 1-2.4 0L2.7 10.5a1.6 1.6 0 0 1-.1-1.9l2.7-4.3a2.4 2.4 0 0 1 2-1.1z" fill="currentColor"/></svg>';
const RL = { phase: 'wait', pl: [], end: 0, roll: 707990 + ri(9000), rot: 0, spinEnd: 0, winner: null, doneAt: 0, mode: 'ton', auto: false, lastBet: null, hash: rndHex(20) };
S.rlQuick = S.rlQuick || [1, 5, 10];
sec('roulette', `<div class="rlbg"></div>
  <div class="rlon"><i></i><span id="rlOnl">1</span> Online</div>
  <div class="rltop"><span class="rlme" id="rlMe"></span><div class="pill3"><span class="gm">${GEM}</span><b class="balv">0</b><button data-dep>＋</button></div></div>
  <button class="rltour" data-go="leader"><span class="ti">${['Plush Pepe', 'Scared Cat', 'Kissed Frog'].map(n => GI(byName(n))).join('')}</span><b>Weekly Tournament</b><em>›</em></button>
  <div class="rlstats"><div id="rlLast"></div><div id="rlTop"></div></div>
  <div class="rlmid"><button class="rlib" id="rlHist">${IC.refresh}</button><div class="rltot2" id="rlTot">TOTAL <b>0 ${CUR}</b></div><button class="rlib" id="rlHow">${IC.help}</button></div>
  <div class="rlw2"><svg class="rlptr2" viewBox="0 0 60 44"><path d="M6 6 H54 L30 40 Z" fill="#14072e" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg><div class="rlring"></div><div class="rlwheel" id="rlWheel"></div><div class="rlav" id="rlAv"></div><div class="rlc2" id="rlC">Waiting</div></div>
  <div class="rlctl"><button class="rlmode" id="rlMode"></button><button class="rlib" id="rlGear">${IC.gear}</button></div>
  <div class="rlq" id="rlQ"></div>
  <div class="rlgifts" id="rlGifts"></div>
  <div class="rlbtn2"><button id="rlCust"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3" fill="currentColor"/></svg>Customize</button><button id="rlAuto">＋ Autoplay</button></div>
  <div class="rlpanel"><div class="rlh"><b id="rlN">0 Players</b><span id="rlRoll">Roll #0</span></div><div id="rlPl"></div><div class="rlhash" id="rlHash"></div></div>`);
$id('roulette').classList.add('rlscr');
const rlTot = () => sumV(RL.pl.map(p => p.amt));
function rlAdd(name, ton, gifts, me, isBot) {
  let p = RL.pl.find(x => x.name === name && !!x.me === !!me);
  if (!p) { p = { name, me, bot: !!isBot, ton: 0, gifts: [], amt: 0, c: RL_COL[RL.pl.length % RL_COL.length], photo: me ? TGU.photo_url : '' }; RL.pl.push(p) }
  p.ton = r2(p.ton + ton); p.gifts = p.gifts.concat(gifts || []); p.amt = r2(p.ton + sumV(p.gifts.map(x => x.v)));
  if (RL.pl.length >= 2 && !RL.end) RL.end = Date.now() + 25000;
  rlRender(true);
}
function rlTick() {
  if (NET.on) { lvRlTick(); if (cur === 'roulette') rlRender(); if (cur === 'pvphub') rlHub(); return }
  if (RL.phase === 'wait') {
    const b = RL.pl.find(x => x.bot), humans = RL.pl.some(x => !x.bot);
    if (!b && (humans ? Math.random() < .03 : Math.random() < .004)) {
      const useGift = Math.random() < .4, g = pick(GIFTS.filter(x => x.p <= 80));
      rlAdd('Roulette', useGift ? 0 : botAmt(), useGift ? [{ g: g.i, v: g.p, n: 1 + ri(900) }] : [], false, true);
    } else if (b && b.amt < 1000 && Math.random() < .002) rlAdd('Roulette', botAmt(1000 - b.amt), [], false, true);
    if (RL.auto && RL.lastBet && !RL.pl.find(p => p.me)) { if (RL.lastBet <= S.bal) { setBal(-RL.lastBet); rlAdd(ME, RL.lastBet, [], true) } else { RL.auto = false; toast('Autoplay stopped: insufficient balance'); rlRender(true) } }
    if (RL.end && Date.now() >= RL.end) rlSpin();
  } else if (RL.phase === 'spin' && Date.now() >= RL.spinEnd) {
    RL.phase = 'done'; RL.doneAt = Date.now(); const w = RL.winner, tot = rlTot(), mine = RL.pl.find(p => p.me);
    const rec = { n: w.name, ch: Math.round(w.amt / (tot || 1) * 100), win: r2(tot - w.amt), photo: w.photo, d: new Date().toDateString() };
    S.rlLast = rec; if (!S.rlTop || S.rlTop.d !== rec.d || rec.win > S.rlTop.win) S.rlTop = rec;
    S.rlHist = [{ roll: RL.roll, n: w.name, tot, ch: rec.ch, me: !!mine, won: !!w.me, t: Date.now() }].concat(S.rlHist || []).slice(0, 50);
    if (mine) {
      if (w.me) {
        const ton = sumV(RL.pl.map(p => p.ton)); if (ton) setBal(ton);
        RL.pl.forEach(p => p.gifts.forEach(x => addItem(GIFTS[x.g], x.v, x.n, x.m, x.ms, true)));
        logGame('Roulette', mine.amt, tot, 'Win'); S.pvpScore = (S.pvpScore || 0) + tot;
        if (cur === 'roulette') showRes(true, null, 'You won! 🏆', `+${g$(tot)}`);
      } else { logGame('Roulette', mine.amt, 0, 'Winner: ' + w.name); if (cur === 'roulette') toast(`Winner: <b>${esc(w.name)}</b>`) }
    }
    save(); rlRender(true);
  } else if (RL.phase === 'done' && Date.now() - RL.doneAt > 4500) {
    RL.phase = 'wait'; RL.pl = []; RL.end = 0; RL.winner = null; RL.roll++; RL.hash = rndHex(20); rlRender(true);
  }
  if (cur === 'roulette') rlRender(); if (cur === 'pvphub') rlHub();
}
function rlSegs() { const t = rlTot() || 1; let a = 0; return RL.pl.map(p => { const s = { p, a0: a, a1: a + p.amt / t * 360 }; a = s.a1; return s }) }
function rlSpin(forced) {
  const segs = rlSegs(), tot = rlTot(); let r = Math.random() * tot, w = segs[0];
  for (const s of segs) { if (r < s.p.amt) { w = s; break } r -= s.p.amt }
  if (forced != null) { const f = segs.find(s => s.p.uid === forced); if (f) w = f }
  RL.winner = w.p; RL.phase = 'spin';
  const target = w.a0 + (w.a1 - w.a0) * rnd(.15, .85);
  const base = RL.rot - (RL.rot % 360);
  RL.rot = base + 360 * 6 + (360 - target);
  [$id('rlWheel'), $id('rlAv')].forEach(e => { e.style.transition = 'transform 5.5s cubic-bezier(.12,.67,.12,1)'; e.style.transform = `rotate(${RL.rot}deg)` });
  $id('rlAv').style.setProperty('--cr', -RL.rot + 'deg');
  RL.spinEnd = Date.now() + 5800; hap('medium');
}
const rlAvH = p => p.photo ? `<span class="av" style="background:#333 url('${esc(p.photo)}') center/cover"></span>` : avHTML(p.name);
function rlStat(x, lb, gold) { return x ? `<small><span>${lb}</span><span>CHANCE ${x.ch}%</span></small><b><span class="nm2">${x.photo ? `<i style="background:url('${esc(x.photo)}') center/cover"></i>` : `<i>${esc((x.n[0] || '?').toUpperCase())}</i>`}@${esc(x.n)}</span><em class="${gold ? 'g' : ''}">+${fmt(x.win)} ${CUR}</em></b>` : `<small><span>${lb}</span><span></span></small><b><span class="nm2" style="color:#8a7fb0">—</span></b>` }
let rlLast = 0;
function rlRender(force) {
  const now = Date.now(), tot = rlTot();
  $id('rlTot').innerHTML = `TOTAL <b>${fmt(tot).replace(/\.00$/, '')} ${CUR}</b>`;
  const c = $id('rlC');
  if (RL.phase === 'wait') c.innerHTML = RL.end ? `<b class="t">${Math.max(0, Math.ceil((RL.end - now) / 1000))}</b>` : `<b>Waiting</b>`;
  else if (RL.phase === 'spin') c.innerHTML = '<b class="l">Rolling</b>';
  else c.innerHTML = `<b class="l">Winner</b><small>@${esc(RL.winner.name)}</small>`;
  if (!force && now - rlLast < 400) return; rlLast = now;
  $id('rlMe').innerHTML = TGU.photo_url ? `<span class="av" style="background:#333 url('${esc(TGU.photo_url)}') center/cover"></span>` : avHTML(ME);
  $id('rlOnl').textContent = Math.max(1, NET.online || 0);
  $id('rlLast').innerHTML = rlStat(S.rlLast, 'LAST GAME'); $id('rlTop').innerHTML = rlStat(S.rlTop && S.rlTop.d === new Date().toDateString() ? S.rlTop : null, 'TOP GAME', 1);
  const segs = rlSegs();
  $id('rlWheel').style.background = segs.length ? `conic-gradient(${segs.map(s => `${s.p.c} ${s.a0}deg ${s.a1}deg`).join(',')})` : '#3df2ff';
  const RR = Math.round(($id('rlWheel').clientWidth || 300) * .36);
  $id('rlAv').innerHTML = segs.map(s => { const m = (s.a0 + s.a1) / 2; return `<span class="rla" style="transform:rotate(${m}deg) translateY(-${RR}px) rotate(${-m}deg)">${rlAvH(s.p)}</span>` }).join('');
  if (RL.phase === 'wait' && !segs.length) { $id('rlWheel').style.transition = 'none'; $id('rlAv').style.transition = 'none' }
  // rejim: TON yoki Gift
  $id('rlMode').innerHTML = RL.mode === 'ton' ? `${GEM}<span>›</span>` : `${IC.gift}<span>›</span>`;
  $id('rlQ').style.display = RL.mode === 'ton' ? '' : 'none'; $id('rlGifts').style.display = RL.mode === 'gift' ? '' : 'none';
  const dis = RL.phase !== 'wait' ? 'disabled' : '';
  $id('rlQ').innerHTML = S.rlQuick.map(v => `<button data-v="${v}" ${dis}>${GEMW}${v}</button>`).join('') + `<button class="all" data-v="all" ${dis}>All In</button>`;
  $id('rlGifts').innerHTML = S.inv.length ? [...S.inv].sort((a, b) => b.v - a.v).map(it => `<button class="rlgf" data-id="${it.id}" ${dis}>${GII(it)}<b>${fmt(it.v)}</b></button>`).join('') : `<div class="rlge">No gifts — <a data-go="home">open boxes</a> or <a data-dep>deposit gifts</a></div>`;
  $id('rlAuto').innerHTML = RL.auto ? '■ Stop Autoplay' : '＋ Autoplay'; $id('rlAuto').classList.toggle('on', RL.auto);
  $id('rlN').textContent = `${RL.pl.length} Player${RL.pl.length === 1 ? '' : 's'}`; $id('rlRoll').textContent = `Roll #${RL.roll}`;
  $id('rlHash').innerHTML = `Hash ${RL.hash.slice(0, 5)}...${RL.hash.slice(-5)} ${IC.copy}`;
  $id('rlPl').innerHTML = [...RL.pl].sort((a, b) => b.amt - a.amt).map(p => {
    const chips = (p.ton ? `<span class="rch" style="background:${p.c}">${GEMW}${fmt(p.ton).replace(/\.00$/, '')}</span>` : '') + p.gifts.map(x => `<span class="rch" style="background:${p.c}">${GI(GIFTS[x.g])}${fmt(x.v)}</span>`).join('');
    return `<div class="rlp2 ${RL.phase === 'done' && RL.winner === p ? 'win' : ''}" style="--c:${p.c}"><div class="top">${rlAvH(p)}<div class="nm"><b>${esc(p.name)}${p.me ? ' <span class="you2">YOU</span>' : ''}${p.bot ? ' <span class="bt">BOT</span>' : ''}</b><small style="color:${p.c}">${Math.round(p.amt / (tot || 1) * 1000) / 10}%</small></div><span class="am">${GEM}${fmt(p.amt).replace(/\.00$/, '')}</span></div><div class="chs"><div class="scr">${chips}</div><span class="ar">›</span></div></div>`;
  }).join('') || `<div class="rlempty">No players yet — place a bet to start</div>`;
}
function rlBetTon(v) {
  if (RL.phase !== 'wait') { toast('Round in progress'); return }
  v = r2(v); if (v < .1) { toast(`Minimum bet ${GEM}0.10`); return } if (v > S.bal) { toast('Insufficient balance'); go('topup'); return }
  setBal(-v); RL.lastBet = v; rlAdd(ME, v, [], true); hap('medium');
}
$id('rlQ').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; rlBetTon(b.dataset.v === 'all' ? Math.floor(S.bal * 100) / 100 : +b.dataset.v) };
$id('rlGifts').onclick = e => { const b = e.target.closest('.rlgf'); if (!b) return; if (RL.phase !== 'wait') { toast('Round in progress'); return } const it = invGet(b.dataset.id); if (!it) return; invDel([it.id]); rlAdd(ME, 0, [{ g: it.g, v: it.v, n: it.n, m: it.m, ms: it.ms }], true); hap('medium'); rlRender(true) };
$id('rlMode').onclick = () => { RL.mode = RL.mode === 'ton' ? 'gift' : 'ton'; hap(); rlRender(true) };
$id('rlCust').onclick = () => { const v = prompt('Quick bet amounts (3 numbers, comma separated)', S.rlQuick.join(', ')); if (!v) return; const a = v.split(/[ ,;]+/).map(Number).filter(x => x >= .1).slice(0, 3); if (a.length === 3) { S.rlQuick = a; save(); rlRender(true) } else toast('Enter 3 amounts, e.g. 1, 5, 10') };
$id('rlAuto').onclick = () => { if (!RL.auto && !RL.lastBet) { toast('Place a TON bet first — Autoplay repeats it every round'); return } RL.auto = !RL.auto; toastG(RL.auto ? `Autoplay on: ${fmt(RL.lastBet)} ${CUR} every round` : 'Autoplay off'); rlRender(true) };
$id('rlGear').onclick = () => $id('rlCust').click();
$id('rlHow').onclick = () => howModal('How Roulette works', [['Place a bet', `Bet ${CUR} with the quick buttons or switch to gifts with the ${CUR} button on the left.`], ['Wait for players', 'When 2+ players join, a 25-second timer starts.'], ['Winner takes all', 'Your chance equals your share of the pot. The winner gets all TON and all gifts.']]);
$id('rlHist').onclick = () => liveHist('roulette');
$id('rlHash').onclick = () => copyTxt(RL.hash);
ENTER.roulette = () => { renderBal(); rlRender(true); pullLb(true).then(() => rlRender(true)) };
window.RL = RL; window.rlAdd = rlAdd;
const _goRL = go; go = function (id, np) { _goRL(id, np); document.body.classList.toggle('rl-on', id === 'roulette'); offSync(); blockSync() };
$id('offR').onclick = () => { netTry = 0; netInit() };
setInterval(rlTick, 250);


// ---------------------------------------------------------------- PvP Hub: 3 bo'lim
$id('pvphub').querySelector('.tvtcard').insertAdjacentHTML('afterend', `<div class="rlcard" data-go="roulette"><span class="tex"></span><div class="rlct"><b>🎡 Roulette</b><small>Spin the wheel, winner takes all</small><div class="rlcp" id="rhPot">${GEM}0.00</div></div><div class="rlmini" id="rhWheel"><i>LIVE</i></div><span class="rlst" id="rhSt">Waiting for players</span><button class="joinb">Join ›</button></div>`);
$id('pvphub').insertAdjacentHTML('afterbegin', `<div class="hubtabs"><button data-go="pvp">⚔️ PvP</button><button data-go="tvt">🛡 TvT</button><button data-go="roulette">🎡 Roulette</button></div>`);
function rlHub() {
  const segs = rlSegs(); $id('rhPot').innerHTML = `${GEM}${fmt(rlTot())}`;
  $id('rhWheel').style.background = segs.length ? `conic-gradient(${segs.map(s => `${s.p.c} ${s.a0}deg ${s.a1}deg`).join(',')})` : '#2f2f2f';
  $id('rhSt').textContent = RL.phase === 'spin' ? 'LIVE' : RL.phase === 'done' ? '🏆 ' + RL.winner.name : RL.end ? 'Starts in ' + Math.max(0, Math.ceil((RL.end - Date.now()) / 1000)) + 's' : 'Waiting for players';
}

// ---------------------------------------------------------------- BACKPACK (skrinshotdagidek)
bpRender = function () {
  const head = `<div class="bph">Backpack</div><div class="sendc"><div><b>Send gifts to <a class="lnk2" href="https://t.me/${GBOT}">our gift bot</a></b><small>Use them in upgrades and games</small></div><button id="bpSendB">${IC.ext}Send</button></div>`;
  if (!S.inv.length) { $id('backpack').innerHTML = bpEmpty(); $id('bpSend').onclick = () => openLink(`https://t.me/${GBOT}`); $id('bpBuy').onclick = () => { go('home'); setTimeout(() => $id('boxGrid') && $id('boxGrid').scrollIntoView({ behavior: 'smooth' }), 120) } }
  else {
    const tot = sumV(S.inv.map(x => x.v));
    $id('backpack').innerHTML = head + `<div class="bpbar"><span>${S.inv.length} gifts · ${g$(tot)}</span><button id="bpSellAll">Sell all</button></div><div class="bpg">${S.inv.map(it => { const g = GIFTS[it.g]; return `<div class="bpc" data-id="${it.id}" style="--rc:${TIER_C[tierOf(it.v)]}"><div class="im"><em>${fmt(it.v)}${GEM}</em>${GII(it)}</div><span class="bd">${it.m ? `<i style="background:${TIER_C[tierOf(it.v)]}"></i>${esc(it.m)}` : '<i></i>Random'}</span><b>${esc(g.n)}</b><button class="wd" data-a="wd">${IC.ext.replace('class="ic"', 'class="ic" style="width:16px;height:16px"')}Withdraw</button><button class="sl" data-a="sell"><small>Sell</small>${fmt(it.v * .95)}${GEM}</button><div class="two2"><button class="up" data-a="up">${IC.trend}Upgrade</button><button class="ph" data-a="ph">${ICO.pad}Play Hub</button></div></div>` }).join('')}</div>`;
    $id('bpSellAll').onclick = () => { const v = r2(sumV(S.inv.map(x => x.v)) * .95); if (!confirm(`Sell all for ${fmt(v)} ${CUR}?`)) return; S.inv = []; setBal(v); bpRender(); toastG(`+${fmt(v)} ${CUR}`) };
  }
  const sb = $id('bpSendB'); if (sb) sb.onclick = () => openLink(`https://t.me/${GBOT}`);
};
$id('backpack').onclick = e => {
  const c = e.target.closest('.bpc'); if (!c) return; const it = invGet(c.dataset.id); if (!it) return; const a = e.target.closest('[data-a]');
  if (!a) { nftModal({ g: GIFTS[it.g], n: it.n, v: it.v, item: it, m: it.m, ms: it.ms }); return }
  if (a.dataset.a === 'wd') { TU.t = 'gift'; TU.sel = [it.id]; go('topup') }
  else if (a.dataset.a === 'sell') { sellItem(it); bpRender() }
  else if (a.dataset.a === 'up') { UP.mode = 'gift'; UP.from = it.id; UP.to = null; go('upgrade') }
  else go('playhub');
};
ENTER.backpack = bpRender;

// ---------------------------------------------------------------- DEPOSIT: TON / Stars / Transfer / Send gift
TU.t = 'ton'; TU.sel = [];
// ---------------- HAQIQIY DEPOZIT: TON Connect + Telegram Stars ----------------
const tonRate = () => (DEP.info && DEP.info.tonRate) || CFG.TON_RATE || 100000;
const starRate = () => (DEP.info && DEP.info.rate) || CFG.STARS_RATE || 800;
const DEP = { info: null, tc: null, addr: '', bal: null, loading: null };
const shortA = a => a ? a.slice(0, 4) + '...' + a.slice(-4) : '';
async function depInfo() { if (!NET.on) return null; if (DEP.info) return DEP.info; try { DEP.info = await api('/api/deposit/info') } catch (e) { DEP.info = null } return DEP.info }
function loadTC() {
  if (window.TON_CONNECT_UI) return Promise.resolve();
  if (DEP.loading) return DEP.loading;
  DEP.loading = new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'https://unpkg.com/@tonconnect/ui@2.0.9/dist/tonconnect-ui.min.js'; sc.onload = ok; sc.onerror = () => { DEP.loading = null; no(new Error('TON Connect yuklanmadi')) }; document.head.appendChild(sc) });
  return DEP.loading;
}
async function tcInit() {
  if (DEP.tc) return DEP.tc;
  await loadTC();
  const manifest = CFG.TC_MANIFEST || new URL('tonconnect-manifest.json', location.href).href;
  DEP.tc = new TON_CONNECT_UI.TonConnectUI({ manifestUrl: manifest });
  try { DEP.tc.uiOptions = { twaReturnUrl: CFG.BOT_USERNAME ? `https://t.me/${CFG.BOT_USERNAME}` : undefined } } catch (e) {}
  DEP.tc.onStatusChange(w => { tcSync(w) });
  await DEP.tc.connectionRestored.catch(() => {});
  tcSync(DEP.tc.wallet);
  return DEP.tc;
}
async function tcSync(w) {
  const raw = w && w.account && w.account.address;
  DEP.addr = raw ? TON_CONNECT_UI.toUserFriendlyAddress(raw) : ''; DEP.bal = null;
  if (raw && NET.on) api('/api/ton/bind', { method: 'POST', body: { address: raw } }).catch(() => {});
  if (raw) { try { const r = await fetch('https://toncenter.com/api/v2/getAddressBalance?address=' + encodeURIComponent(DEP.addr)); const d = await r.json(); DEP.bal = (+d.result || 0) / 1e9 } catch (e) {} }
  if (cur === 'topup' && TU.t === 'ton') tuRender();
}
async function tonPay(amount) {
  const info = await depInfo();
  if (!info || !info.ton) { toast('TON deposits are not configured'); return }
  const tc = await tcInit();
  if (!tc.wallet) { await tc.openModal(); return }
  try {
    await tc.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: info.address, amount: String(Math.round(amount * 1e9)) }] });
    sentToast('Transaction sent', `${fmt(amount)} ${CUR} — credited after confirmation (≈15–60 s)`);
    [20, 45, 90].forEach(t => setTimeout(pullRewards, t * 1000));
  } catch (e) { toast('Cancelled') }
}
async function starsPay(stars) {
  const info = await depInfo();
  if (!info || !info.stars) { toast('Stars payments need the server'); return }
  try {
    const { link } = await api('/api/stars/invoice', { method: 'POST', body: { stars } });
    if (tg && tg.openInvoice) tg.openInvoice(link, st => { if (st === 'paid') { sentToast('Payment received', `+${fmt(stars * info.rate)} ${CUR} is being credited`); [2, 6, 15].forEach(t => setTimeout(pullRewards, t * 1000)) } else if (st === 'failed') toast('Payment failed') });
    else openLink(link);
  } catch (e) { toast('Error: ' + esc(e.message)) }
}
function rcpField(id) { return `<div class="lbl2">Recipient ID</div><div class="inp"><input id="${id}" placeholder="123456789 / @username" autocomplete="off"></div><div class="trwho" id="${id}W"></div>` }
async function rcpLook(id, cb) {
  const q = $id(id).value.trim(); const W = $id(id + 'W'); cb(null);
  if (q.length < 2) { W.innerHTML = ''; return }
  if (!NET.on) { W.innerHTML = `<div class="trno">Server not connected</div>`; return }
  W.innerHTML = '<div class="spin" style="width:18px;height:18px"></div>';
  try { const u = await api('/api/user?q=' + encodeURIComponent(q)); if (String(u.id) === String(TGU.id)) throw new Error("You can't send to yourself"); W.innerHTML = `<div class="trok">${avP(u.name, u.photo)}<b>${esc(u.name)}</b>${u.username ? `<small>@${esc(u.username)}</small>` : ''}<em>✓</em></div>`; cb(u) } catch (e) { W.innerHTML = `<div class="trno">${esc(e.message)}</div>` }
}
function sentToast(t, s) { const e = $id('sentT'); e.innerHTML = `<b>✓ ${t}</b><span>${s}</span>`; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 2600) }
document.body.insertAdjacentHTML('beforeend', '<div class="sentt" id="sentT"></div>');
tuRender = function () {
  const t = TU.t;
  const tabs = [['ton', IC.wallet, CUR], ['crypto', IC.coin, 'Other Crypto'], ['stars', IC.star, 'Stars'], ['gifts', IC.gift, 'Gifts']];
  let body = '';
  const REAL = NET.on && DEP.info && DEP.info.ton, REALS = NET.on && DEP.info && DEP.info.stars;
  if (t === 'ton') body = (REAL ? (DEP.addr ? `<div class="wpill" id="tcDisc">${GEM}${shortA(DEP.addr)}${IC.logout}</div><div class="wbal"><small>Wallet Balance ${IC.wallet.replace('class="ic"', 'class="ic" style="width:16px;height:16px"')}</small><b>${DEP.bal == null ? '…' : fmt(DEP.bal)}${GEM}</b></div>` : `<button class="btn-tc" id="tcConn">${GEM}Connect Wallet</button>`) : `<div class="offc">${IC.wallet}<b>Deposits are temporarily unavailable</b><small>The payment server is not connected. Please try again later.</small></div>`) + `<div class="tul">Amount (minimum 0.1 ${CUR})</div><div class="inp"><input id="tuA" type="number" inputmode="decimal" placeholder="Enter amount..."><span class="gm">${GEM}</span></div><div class="tuq" style="grid-template-columns:repeat(3,1fr)"><button data-a="1">+1 ${CUR}</button><button data-a="10">+10 ${CUR}</button><button data-a="100">+100 ${CUR}</button></div><div class="tuget" id="tuGet"></div><button class="btn-tu" id="tuGo">Top Up</button>${REAL ? `<div class="manual"><div class="mh">Or send manually</div><div class="mr"><span>Address</span><b>${shortA(DEP.info.address)}</b><button data-cp="${DEP.info.address}">${IC.copy}</button></div><div class="mr"><span>Comment</span><b>${DEP.info.comment}</b><button data-cp="${DEP.info.comment}">${IC.copy}</button></div><small>⚠️ The comment is required, otherwise the deposit can't be matched to you. Minimum ${DEP.info.min} ${CUR}.</small></div>` : ''}<div class="tulinks"><button id="tuTf">${IC.shuffle}Transfer</button><button id="tuSg">${IC.gift}Send gift</button></div>`;
  else if (t === 'stars') body = `<div class="tul">Amount in Stars (10 – 10 000)</div><div class="inp"><input id="tuA" type="number" inputmode="numeric" placeholder="0"></div><div class="tuq" style="grid-template-columns:repeat(5,1fr)"><button data-a="50">+50</button><button data-a="100">+100</button><button data-a="500">+500</button><button data-a="1000">+1k</button><button data-a="5000">+5k</button></div><div class="tuget" id="tuGet"></div><button class="btn-tu st" id="tuGo">Top Up</button>`;
  else if (t === 'crypto') body = `<div class="tul">Amount (minimum 0.1 ${CUR})</div><div class="inp"><input id="tuA" type="number" inputmode="decimal" placeholder="Enter amount..."><span class="gm">${GEM}</span></div><div class="tuq" style="grid-template-columns:repeat(3,1fr)"><button data-a="1">+1 ${CUR}</button><button data-a="10">+10 ${CUR}</button><button data-a="100">+100 ${CUR}</button></div><button class="btn-tu" id="tuGo">Top Up</button>`;
  else if (t === 'gifts') body = `<div class="tug"><div class="tug-h"><i>${IC.gift}</i><div><b>Top Up with Gifts</b><small>Send gifts to our bot and they'll appear in your backpack</small></div></div>
    <div class="tug-how"><div class="hh">How it works<button id="tugT">Hide steps ⌃</button></div><div class="hb" id="tugB">${[['Open Gift Bot', `Click the button below to open @${GBOT} bot`], ['Send Your Gift', 'Send your gift directly to the bot.'], ['Gift Added to Backpack', 'Your gift will appear in your backpack within seconds. You can then quick-sell it for balance, or use them for upgrades, crafts, or in PvP and Rocket games']].map((x, i) => `<div class="st1"><i>${i + 1}</i><div><b>${x[0]}</b><small>${x[1]}</small></div></div>`).join('')}
    <div class="tug-ok">${IC.check || '✓'} <b>Instant processing:</b> Gifts appear in your backpack immediately after sending</div><div class="tug-ok">${IC.check || '✓'} <b>Quick-sell option:</b> Sell gifts from your backpack for instant ${CUR} balance</div></div></div>
    <button class="btn-p tug-go" id="tuGb2">${IC.ext}Open @${GBOT}</button></div>
    <div class="tug-n"><b>After sending gifts:</b><span>Check your <a data-go2="backpack">backpack</a> to quick-sell for ${CUR} balance. Need help? Contact support.</span></div>`;
  else if (t === 'transfer') body = `<p class="tuh2">Send ${CUR} from your balance to a friend — it arrives instantly.</p>${rcpField('tfTo')}<div class="tul" style="margin-top:12px">Amount <span style="float:right">Balance: <span class="balv"></span></span></div><div class="inp"><input id="tfA" type="number" inputmode="decimal" placeholder="${CUR} amount" step="0.01"><span class="gm">${GEM}</span></div><button class="btn-p" id="tfGo" style="margin-top:14px">${IC.ext}Send</button>`;
  else {
    TU.sel = TU.sel.filter(id => invGet(id)); const v = sumV(TU.sel.map(id => invGet(id).v));
    body = `<p class="tuh2">Pick gifts from your backpack and send them to a friend — they arrive instantly.</p>${rcpField('sgTo')}<div class="sgbox"><div class="r"><span>${TU.sel.length} selected</span><b>${fmt(v)}${GEM}</b></div><button class="btn-p ${TU.sel.length ? '' : 'dim'}" id="sgGo">${IC.ext}Send</button></div><div class="bpg sgg">${S.inv.map(it => `<div class="bpc sg ${TU.sel.includes(it.id) ? 'on' : ''}" data-id="${it.id}"><i class="ck"></i><div class="im"><em>${fmt(it.v)}${GEM}</em>${GII(it)}</div><b>${esc(GIFTS[it.g].n)}</b></div>`).join('') || '<div class="empty">Your backpack is empty</div>'}</div>`;
  }
  sec('topup', `<div class="tuh"><button id="tuBk">${IC.back}</button>Top Up Balance</div><div class="tut">${tabs.map(x => `<button data-t="${x[0]}" class="${x[0] === t ? 'on' : ''}">${x[3] ? `<span class="hotb">${x[3]}</span>` : ''}${x[1]}${x[2]}</button>`).join('')}</div>${body}${(t === 'ton' && !REAL) || (t === 'stars' && !REALS) ? `<p class="note" style="margin-top:16px">⚠️ Server not connected — deposits are disabled.</p>` : t === 'stars' ? `<p class="note" style="margin-top:16px">⭐ Paid inside Telegram, credited instantly.</p>` : ''}`);
  renderBal();
  $id('tuBk').onclick = back;
  $$('#topup .tut button').forEach(b => b.onclick = () => { TU.t = b.dataset.t; tuRender() });
  const A = $id('tuA'), G = $id('tuGo');
  if (A) {
    const sync = () => { const v = parseFloat(A.value) || 0; G.classList.toggle('on', t === 'stars' ? v >= 10 && v <= 10000 : v >= .1); const yg = $id('tuGet'); if (yg) yg.innerHTML = v ? `You get: <b>${GEM}${fmt(t === 'stars' ? v * starRate() : v * tonRate())}</b>` : `${t === 'stars' ? '125 ⭐' : '1 TON'} = <b>${GEM}${fmt(t === 'stars' ? 125 * starRate() : tonRate()).replace(/\.00$/, '')}</b>` };
    sync(); A.oninput = sync; $$('#topup .tuq button').forEach(b => b.onclick = () => { A.value = (parseFloat(A.value) || 0) + +b.dataset.a; sync() });
    G.onclick = () => {
      if (!G.classList.contains('on')) return; const v = parseFloat(A.value) || 0;
      if (t === 'ton' && REAL) return tonPay(v);
      if (t === 'stars' && REALS) return starsPay(Math.round(v));
      if (t === 'crypto') return info('Other Crypto', `<div class="helpb">USDT / BTC / ETH deposits are not connected to this bot yet. Please use ${CUR} or Stars.</div>`);
      toast('Deposits are temporarily unavailable');
    };
  }
  const tcb = $id('tcConn'); if (tcb) tcb.onclick = async () => { try { const tc = await tcInit(); if (!tc.wallet) tc.openModal() } catch (e) { toast(esc(e.message)) } };
  const tcd = $id('tcDisc'); if (tcd) tcd.onclick = async () => { if (confirm('Disconnect wallet?')) { await DEP.tc.disconnect(); tcSync(null) } };
  $$('#topup [data-cp]').forEach(b => b.onclick = () => copyTxt(b.dataset.cp));
  if (NET.on && !DEP.info) depInfo().then(i => { if (i && cur === 'topup') tuRender() });
  if (t === 'ton' && REAL && !DEP.tc) tcInit().catch(() => {});
  const cr = $id('tuCr'); if (cr) cr.onclick = () => info('Other Crypto', `<div class="helpb">Top up with USDT, BTC, ETH and other cryptocurrencies — coming soon.</div>`);
  const gb = $id('tuGb'); if (gb) gb.onclick = () => openLink(`https://t.me/${GBOT}`);
  const tf = $id('tuTf'); if (tf) tf.onclick = () => { TU.t = 'transfer'; tuRender() }; const sg = $id('tuSg'); if (sg) sg.onclick = () => { TU.t = 'gift'; tuRender() };
  const gb2 = $id('tuGb2'); if (gb2) gb2.onclick = () => openLink(`https://t.me/${GBOT}`);
  const tgT = $id('tugT'); if (tgT) tgT.onclick = () => { const b = $id('tugB'), o = b.style.display === 'none'; b.style.display = o ? '' : 'none'; tgT.textContent = o ? 'Hide steps ⌃' : 'Show steps ⌄' };
  $$('#topup [data-go2]').forEach(a => a.onclick = () => go(a.dataset.go2));
  if (t === 'transfer') {
    let to = null; const sync = () => { const v = parseFloat($id('tfA').value) || 0; $id('tfGo').classList.toggle('dim', !(to && v >= .1 && v <= S.bal)) }; sync();
    let lk = 0; $id('tfTo').oninput = () => { clearTimeout(lk); lk = setTimeout(() => rcpLook('tfTo', u => { to = u; sync() }), 450) };
    $id('tfA').oninput = sync;
    $id('tfGo').onclick = async () => {
      const v = r2(parseFloat($id('tfA').value) || 0); if (!to) { toast('Recipient not found'); return } if (!(v >= .1 && v <= S.bal)) { toast(v > S.bal ? 'Insufficient balance' : 'Minimum 0.10'); return }
      try { await api('/api/transfer', { method: 'POST', body: { to: String(to.id), kind: 'gram', amount: v } }); setBal(-v); S.hist.unshift({ game: 'Transfer', bet: v, win: 0, note: '→ ' + to.name, t: Date.now() }); save(); sentToast(`${CUR} sent`, `Sent ${fmt(v)} ${CUR} to ${esc(to.name)}`); $id('tfA').value = ''; sync() } catch (e) { toast('Error: ' + esc(e.message)) }
    };
  }
  if (t === 'gift') {
    let to = null; let lk = 0;
    $id('sgTo').oninput = () => { clearTimeout(lk); lk = setTimeout(() => rcpLook('sgTo', u => { to = u }), 450) };
    $('#topup .sgg').onclick = e => { const c = e.target.closest('.bpc'); if (!c) return; const id = c.dataset.id; TU.sel = TU.sel.includes(id) ? TU.sel.filter(x => x !== id) : [...TU.sel, id]; const q = $id('sgTo').value; tuRender(); $id('sgTo').value = q; if (q) $id('sgTo').oninput() };
    $id('sgGo').onclick = async () => {
      if (!TU.sel.length) return; if (!to) { toast('Recipient not found'); return }
      const items = TU.sel.map(invGet).filter(Boolean); let ok = 0;
      for (const it of items) { try { await api('/api/transfer', { method: 'POST', body: { to: String(to.id), kind: 'gift', gift: { sh: GIFTS[it.g].sh, n: GIFTS[it.g].n, p: it.v, m: it.m, ms: it.ms } } }); invDel([it.id]); ok++ } catch (e) { toast('Error: ' + esc(e.message)); break } }
      if (ok) { TU.sel = []; S.hist.unshift({ game: 'Transfer', bet: 0, win: 0, note: `${ok} gift(s) → ${to.name}`, t: Date.now() }); save(); tuRender(); sentToast('Gifts sent', `Sent ${ok} gift(s) to ${esc(to.name)}`) }
    };
  }
};
ENTER.topup = tuRender;
trOpen = function (kind, item) { TU.t = kind === 'gift' ? 'gift' : 'transfer'; TU.sel = item ? [item.id] : []; closeM('trM'); go('topup') };
// =====================================================================
//  LIVE (server) — Roulette, PvP, TvT, Rocket: barcha o'yinchilar bitta raundda
// =====================================================================
const LV = { st: {}, off: 0, played: {}, paidRk: null, lostRk: null, queue: null, doneSeen: {} };
const srvNow = () => Date.now() + LV.off;
const isMe = uid => String(uid) === String(TGU.id || 0);
const toItems = gifts => (gifts || []).map(x => { const g = GBS[x.sh] || byName(x.n); return { g: g.i, v: x.p, m: x.m || null, ms: x.ms || null } });
const giftPayload = items => items.map(it => ({ sh: GIFTS[it.g].sh, n: GIFTS[it.g].n, p: it.v, m: it.m, ms: it.ms }));
async function lvPull(g) { const d = await api('/api/live?g=' + g); LV.off = d.now - Date.now(); LV.st[g] = d; return d }
function liveStake(g, ton, items, extra) {
  const body = Object.assign({ g, ton, gifts: giftPayload(items), name: pubName(), photo: pubPhoto() }, extra || {});
  return api('/api/live/bet', { method: 'POST', body }).then(d => {
    LV.off = d.now - Date.now(); LV.st[g] = d; lvApply(g, d); hap('medium');
    logGame(g === 'rocket' ? 'Rocket' : g === 'tvt' ? 'TvT' : g === 'pvp' ? 'PvP' : 'Roulette', r2(ton + sumV(items.map(x => x.v))), 0, 'bet');
  }).catch(e => { if (ton) setBal(ton); items.forEach(it => S.inv.unshift(it)); save(); toast(esc(e.message)) });
}
function lvApply(g, d) { try { (g === 'roulette' ? lvRoulette : g === 'pvp' ? lvPvp : g === 'tvt' ? lvTvt : lvRocket)(d) } catch (e) { console.warn('live apply', e) } }
function lvPlayers(list) { return (list || []).map(p => ({ uid: p.uid, name: p.name, me: isMe(p.uid), bot: p.bot, ton: p.ton, gifts: toItems(p.gifts), amt: p.amt, c: p.c, photo: p.photo })) }
function lvEnd(endAt, now) { return endAt ? Date.now() + (endAt - now) : 0 }

// ---- Roulette
function lvRoulette(d) {
  if (d.phase === 'wait') {
    if (d.id !== RL.roll || RL.phase !== 'wait') { RL.phase = 'wait'; RL.winner = null; RL.roll = d.id; $id('rlWheel').style.transition = 'none'; $id('rlAv').style.transition = 'none' }
    RL.pl = lvPlayers(d.players); RL.end = lvEnd(d.endAt, d.now); RL.hash = d.hash;
  } else if (LV.played.roulette !== d.id) {
    LV.played.roulette = d.id; RL.roll = d.id; RL.pl = lvPlayers(d.players); RL.hash = d.hash;
    if (RL.pl.length) rlSpin(d.winner);
  }
  const h = d.hist || [];
  if (h[0]) { S.rlLast = { n: h[0].n, ch: Math.round(h[0].ch), win: h[0].win, photo: h[0].photo, d: new Date().toDateString() }; const day = new Date().toDateString(); const top = h.filter(x => new Date(x.t).toDateString() === day).sort((a, b) => b.win - a.win)[0]; if (top) S.rlTop = { n: top.n, ch: Math.round(top.ch), win: top.win, photo: top.photo, d: day } }
  S.rlHist = h.map(x => ({ id: x.id, roll: x.id, n: x.n, photo: x.photo, tot: x.tot, ch: x.ch, win: x.win, ton: x.ton, wuid: x.wuid, pl: x.pl || [], me: (x.uids || []).some(isMe), won: isMe(x.wuid), t: x.t }));
  if (cur === 'roulette') rlRender(true); if (cur === 'pvphub') rlHub();
}
function lvRlTick() {
  if (RL.phase === 'spin' && Date.now() >= RL.spinEnd) {
    RL.phase = 'done'; RL.doneAt = Date.now(); const mine = RL.pl.find(p => p.me);
    if (mine) { if (RL.winner && RL.winner.me) pullRewards(); else if (cur === 'roulette') toast(`Winner: <b>${esc(RL.winner ? RL.winner.name : '')}</b>`) }
    rlRender(true);
  }
  if (RL.auto && RL.lastBet && RL.phase === 'wait' && !RL.pl.find(p => p.me) && RL.autoRound !== RL.roll) { RL.autoRound = RL.roll; rlBetTon(RL.lastBet) }
}

// ---- PvP
function lvPvp(d) {
  if (d.phase === 'wait') {
    if (d.id !== PV.game && PV.phase !== 'wait') pvReset();
    PV.phase = 'wait'; PV.game = d.id; PV.winner = null; PV.pl = lvPlayers(d.players); PV.end = lvEnd(d.endAt, d.now);
  } else if (LV.played.pvp !== d.id) {
    LV.played.pvp = d.id; PV.game = d.id; PV.pl = lvPlayers(d.players);
    const w = PV.pl.find(p => p.uid === d.winner); if (w) pvSpin(w);
  }
  S.pvHist = (d.hist || []).map(x => ({ id: x.id, roll: x.id, n: x.n, photo: x.photo, tot: x.tot, ch: x.ch, win: x.win, ton: x.ton, wuid: x.wuid, pl: x.pl || [], me: (x.uids || []).some(isMe), won: isMe(x.wuid), t: x.t }));
  if (cur === 'pvp') pvRender(true); if (cur === 'pvphub') pvHub();
}
function lvPvTick() {
  if (PV.phase === 'spin' && Date.now() >= PV.spinEnd) {
    PV.phase = 'done'; const mine = PV.pl.find(p => p.me);
    if (mine) { if (PV.winner && PV.winner.me) pullRewards(); else if (cur === 'pvp') toast(`Winner: <b>${esc(PV.winner ? PV.winner.name : '')}</b>`) }
  }
}

// ---- TvT
function lvTvt(d) {
  const map = l => lvPlayers(l).map(p => Object.assign(p, { gifts: p.gifts.map(x => x.g) }));
  if (d.phase === 'wait') {
    if (d.id !== TV.game && TV.phase !== 'wait') tvReset();
    TV.phase = 'wait'; TV.game = d.id; TV.ice = map(d.ice); TV.fire = map(d.fire); TV.end = lvEnd(d.endAt, d.now);
  } else if (LV.played.tvt !== d.id && d.win) {
    LV.played.tvt = d.id; TV.game = d.id; TV.ice = map(d.ice); TV.fire = map(d.fire); tvPlay(d.win);
  }
  S.tvh = (d.hist || []).map(h => ({ id: h.id, win: h.win, i: h.i, f: h.f, me: (h.uids || []).some(isMe), pl: (h.pl || []).map(p => ({ name: p.name, bot: p.bot, me: isMe(p.uid), team: p.team, amt: p.amt, photo: p.photo })) }));
  if (cur === 'tvt') tvRender(true); if (cur === 'pvphub') pvHub();
}

// ---- Rocket
function lvRocket(d) { LV.rk = d; LV.rkAt = performance.now() }
function lvRkTick(now) {
  const d = LV.rk; if (!d) return;
  const sNow = d.now + (now - LV.rkAt);
  if (d.id !== RK.round) {
    RK.round = d.id; RK.my = null; $('#rkStage').classList.remove('fly', 'boom'); $id('rkBoom').classList.remove('on'); rkSetSkin();
    if (LV.queue) { const q = LV.queue; LV.queue = null; RK.next = null; liveStake('rocket', q.ton, q.items, { auto: q.auto }) }
  }
  if (d.phase === 'wait') { RK.phase = 'wait'; RK.waitEnd = now + (d.startAt - sNow) }
  else if (d.phase === 'fly') { if (RK.phase !== 'fly') { RK.phase = 'fly'; $('#rkStage').classList.add('fly') } RK.t0 = now - (sNow - d.t0); RK.m = Math.floor(Math.exp(0.085 * Math.max(0, (now - RK.t0) / 1000)) * 100) / 100 }
  else if (d.phase === 'crash' && RK.phase !== 'crash') {
    RK.phase = 'crash'; RK.crash = d.crash; RK.m = d.crash; RK.crashAt = now - (sNow - d.crashAt);
    $('#rkStage').classList.remove('fly'); $('#rkStage').classList.add('boom'); rkFrags();
    if (RK.my && !RK.my.out && LV.lostRk !== d.id) { LV.lostRk = d.id; if (cur === 'rocket') { hapN('error'); toast('💥 Crashed at ' + d.crash.toFixed(2) + 'x') } }
  }
  RK.hist = (d.hist || []).slice(0, 14);
  RK.bets = (d.bets || []).map(b => ({ name: b.name, amt: b.amt, auto: b.auto, out: b.out, gift: b.gift, photo: b.photo, bot: !!b.bot, me: isMe(b.uid) }));
  RK.my = RK.bets.find(b => b.me) || null;
  RK.next = LV.queue ? { amt: LV.queue.ton + sumV(LV.queue.items.map(x => x.v)) } : null;
  if (RK.my && RK.my.out && LV.paidRk !== d.id) { LV.paidRk = d.id; const b = { me: true, amt: RK.my.amt, out: 0 }; rkCash(b, RK.my.out); RK.my.nf = b.nf; LV.rkNf = b.nf || null }
}

window.LIVE_HOOK = { on: () => NET.on, rk: lvRkTick, pv: lvPvTick, tv: () => {}, rewards: () => pullRewards() };
async function lvLoop() {
  let wait = 1500;
  if (NET.on) {
    const gs = cur === 'roulette' ? ['roulette'] : cur === 'pvp' ? ['pvp'] : cur === 'tvt' ? ['tvt'] : cur === 'rocket' ? ['rocket'] : cur === 'pvphub' ? ['roulette', 'pvp', 'tvt'] : [];
    if ((RK.my || LV.queue) && !gs.includes('rocket')) gs.push('rocket');
    for (const g of gs) { try { lvApply(g, await lvPull(g)) } catch (e) {} }
    wait = gs.includes('rocket') && RK.phase === 'fly' ? 250 : gs.length ? 700 : 1500;
  }
  setTimeout(lvLoop, wait);
}
setTimeout(lvLoop, 1200);

// ---- foydalanuvchi tikishlari (live rejimda serverga)
const _rlBetTonL = rlBetTon;
rlBetTon = function (v) {
  if (!NET.on) return _rlBetTonL(v);
  if (RL.phase !== 'wait') { toast('Round in progress'); return }
  v = r2(v); if (v < .1) { toast(`Minimum bet ${GEM}0.10`); return } if (v > S.bal) { toast('Insufficient balance'); go('topup'); return }
  setBal(-v); RL.lastBet = v; liveStake('roulette', v, []);
};
$id('rlGifts').onclick = e => {
  const b = e.target.closest('.rlgf'); if (!b) return; if (RL.phase !== 'wait') { toast('Round in progress'); return }
  const it = invGet(b.dataset.id); if (!it) return; invDel([it.id]);
  if (NET.on) { liveStake('roulette', 0, [it]); return }
  rlAdd(ME, 0, [{ g: it.g, v: it.v, n: it.n, m: it.m, ms: it.ms }], true); hap('medium'); rlRender(true);
};
// PvP
$id('pvJoin').onclick = () => {
  if (PV.phase !== 'wait') { toast('Round in progress'); return }
  const mine = PV.pl.find(p => p.me);
  if (!mine && betVal('pv') > 0 && BS.pv.mode === 'coin') {
    if (!NET.on) return _pvJoin7();
    const v = betVal('pv'); if (v < .1) { toast('Minimum bet 0.10'); return } if (v > S.bal) { toast('Insufficient balance'); go('topup'); return }
    setBal(-v); BS.pv.inp.value = ''; liveStake('pvp', v, []); return;
  }
  incOpen({ title: mine ? 'Increase' : 'Place bet', btn: mine ? 'Increase' : 'Join the Battle', current: mine ? mine.amt : 0, done: r => {
    if (NET.on) { liveStake('pvp', r.ton, r.gifts); return }
    pvAdd(ME, r2(r.ton + sumV(r.gifts.map(x => x.v))), true); const me = PV.pl.find(p => p.me); me.gifts = (me.gifts || []).concat(r.gifts); hap('medium'); pvRender(true);
  } });
};
// TvT
$$('[data-team]').forEach(b => { const old = b.onclick; b.onclick = () => {
  if (!NET.on) return old();
  if (TV.phase !== 'wait') { toast('Round in progress'); return }
  const team = b.dataset.team; let ton = 0, items = [];
  if (BS.tv.mode === 'gift') { items = BS.tv.gifts.map(invGet).filter(Boolean); if (!items.length) { toast('Select a gift'); return } invDel(items.map(x => x.id)); BS.tv.gifts = []; BS.tv.inp.value = '' }
  else { ton = betVal('tv'); if (ton < .1) { toast('Minimum bet 0.10'); return } if (ton > S.bal) { toast('Insufficient balance'); go('topup'); return } setBal(-ton) }
  liveStake('tvt', ton, items, { team });
} });
// Rocket
const _btGoL = $id('btGo').onclick;
$id('btGo').onclick = () => {
  if (!NET.on) return _btGoL();
  const auto = $id('btAutoOn').checked ? Math.max(1.01, parseFloat($id('btAuto').value) || 2) : 0;
  let ton = 0, items = [];
  if (BS.bt.mode === 'gift') { items = BS.bt.gifts.map(invGet).filter(Boolean); if (!items.length) { toast('Select a gift'); return } invDel(items.map(x => x.id)); BS.bt.gifts = [] }
  else { ton = r2(parseFloat($id('btAmt').value) || 0); if (ton < .1) { toast('Minimum bet 0.10'); return } if (ton > S.bal) { toast('Insufficient balance'); go('topup'); return } setBal(-ton) }
  closeM('betM');
  if (RK.phase !== 'wait' || (RK.waitEnd - performance.now()) < 600) { LV.queue = { ton, items, auto }; toast('Bet placed for next round'); return }
  liveStake('rocket', ton, items, { auto }).then(() => toast('🚀 Bet placed'));
};
const _rkBtnL = $id('rkBtn').onclick;
$id('rkBtn').onclick = async () => {
  if (!NET.on) return _rkBtnL();
  if (RK.phase === 'fly' && RK.my && !RK.my.out) {
    try { const r = await api('/api/live/cashout', { method: 'POST', body: {} }); if (LV.paidRk !== RK.round) { LV.paidRk = RK.round; RK.my.out = r.m; const bb = { me: true, amt: r.amt, out: 0 }; rkCash(bb, r.m); LV.rkNf = bb.nf || null } } catch (e) { toast(esc(e.message)) }
    rkRender(true); return;
  }
  if (RK.phase === 'wait' && RK.my) {
    if (RK.my.gift) { toast("Gift bets can't be cancelled"); return }
    try { const r = await api('/api/live/cancel', { method: 'POST', body: {} }); setBal(r.amt); toast('Cancelled') } catch (e) { toast(esc(e.message)) } return;
  }
  if (LV.queue) { if (LV.queue.ton) setBal(LV.queue.ton); LV.queue.items.forEach(it => S.inv.unshift(it)); LV.queue = null; RK.next = null; save(); toast('Cancelled'); return }
  openBetModal();
};

window.RIKI_TR = trOpen;

// ---------------------------------------------------------------- P2P (nav) + Earn kartasi
const navE = $('nav [data-go="earn"]');
if (navE) { navE.innerHTML = `${ICO.coins}Earn<span class="badge" id="earnBadge" style="display:none"></span>` }
const mh = $('#market .mkhead b'); if (mh) mh.textContent = 'P2P Market';
$('#market .mkhead').insertAdjacentHTML('afterend', `<button class="btn-p" id="p2pSell" style="margin:10px 0 12px">＋ Sell my gift on P2P</button>`);
$id('p2pSell').onclick = () => pickGifts({ multi: false, title: 'Gift to sell', done: id => {
  const it = invGet(id); if (!it) return; const pr = parseFloat(prompt(`Price in ${CUR} (floor ${fmt(GIFTS[it.g].p)})`, fmt(it.v)) || 0); if (!(pr >= .1)) return;
  invDel([it.id]); S.myList = (S.myList || []).concat([{ id: uid(), g: it.g, n: it.n, price: r2(pr), seller: ME, mine: 1, it }]); save(); mkMerge(); mkRender(); toastG('Listed on P2P');
} });
function mkMerge() { MK.list = MK.list.filter(x => !x.mine).concat(S.myList || []) }
const _mkRender = mkRender;
mkRender = function () { mkMerge(); _mkRender(); $$('#mkGrid .mkc').forEach(c => { const x = MK.list.find(y => y.id === c.dataset.id); if (x && x.mine) { const b = c.querySelector('.mkb'); b.textContent = 'Cancel'; b.classList.add('mine') } }) };
$id('mkGrid').addEventListener('click', e => {
  const b = e.target.closest('.mkb.mine'); if (!b) return; e.stopImmediatePropagation();
  const x = MK.list.find(y => y.id === b.closest('.mkc').dataset.id); S.myList = (S.myList || []).filter(y => y.id !== x.id); S.inv.unshift(x.it); save(); mkRender(); toast('Listing cancelled');
}, true);

// ---------------------------------------------------------------- Upgrade: Potential Profit + x2/x5/x10
$('#upgrade .upcard').insertAdjacentHTML('beforeend', `<div class="upq" id="upQ"><button data-x="1.5">x1.5</button><button data-x="2">x2</button><button data-x="5">x5</button><button data-x="10">x10</button></div><div class="ppro" id="upPP"></div>`);
$id('upQ').onclick = e => { const b = e.target.closest('[data-x]'); if (!b || UP.spinning) return; const fv = upFromVal(); if (!fv) { toast('Select your gift first'); return } const t = fv * +b.dataset.x; let best = null; for (const g of BYPRICE) { if (g.p > fv * 1.05 && g.p <= t) best = g } best = best || BYPRICE.find(g => g.p > fv * 1.05); if (best) { UP.to = best.i; upRender() } };
const _upR7 = upRender;
upRender = function () { _upR7(); const fv = upFromVal(), p = UP.to != null && fv ? GIFTS[UP.to].p - fv : 0; $id('upPP').innerHTML = p > 0 ? `${IC.trend}Potential Profit <b>+${fmt(p)}${GEM}</b>` : ''; $id('upPP').style.display = p > 0 ? '' : 'none' };
ENTER.upgrade = upRender;

// ---------------------------------------------------------------- Crafts: Craft value / Potential profit
$id('cSlots').insertAdjacentHTML('beforeend', `<div class="cval" id="cVal"></div>`);
const _crR7 = crRender;
crRender = function () { _crR7(); const t = crTotal(); $id('cVal').innerHTML = CR.slots.length ? `<div><span>Craft Value</span><b>${fmt(t)}${GEM}</b></div><div><span>Potential Profit</span><b class="g">${fmt(t * CR_M[CR.mode].x * .5)} – ${fmt(t * CR_M[CR.mode].x)} ${CUR}</b></div>` : '' };
ENTER.crafts = crRender;

// ---------------------------------------------------------------- Mines: "Tap a cell to start the round" + qizil chaqnash
const _mR7 = mRender;
mRender = function () { _mR7(); const b = $id('mBtn'); if (MN.on && !MN.open.size) { b.className = 'bigbtn wait'; b.textContent = 'Tap a cell to start the round' } };
ENTER.mines = mRender;
$id('mGrid').addEventListener('click', () => setTimeout(() => { if (!MN.on && MN.revealed && [...MN.open].some(i => MN.mines.has(i))) { const m = $('.mbox2'); m.classList.remove('boomr'); void m.offsetWidth; m.classList.add('boomr') } }, 0));

// ---------------------------------------------------------------- Rocket: Auto @x belgisi va "Cash Out"
const _rkR7 = rkRender;
rkRender = function (f) { _rkR7(f); const b = $id('rkBtn'); if (b.classList.contains('out')) b.innerHTML = b.innerHTML.replace('Cash out', 'Cash Out'); if (RK.my && RK.my.auto) { const r = $('#rkPl .prow.me .pi'); if (r && !r.querySelector('.auto')) r.insertAdjacentHTML('beforeend', `<span class="auto">Auto @${RK.my.auto.toFixed(2)}x</span>`) } };

window.RIKI_TR = trOpen;
window.RIKI = { BOXES, openBox, sha256, minesFrom, boxOdds, dailyOdds };
// =====================================================================
//  v10 — qayta ishlangan o'yinlar: Mines, Dice, Upgrade, Crafts,
//  Spins (Buy Feature oynasi), quti ochish animatsiyasi, sovg'a tanlash
// =====================================================================
const RAR = ['#5eead4', '#4ade80', '#60a5fa', '#a78bfa', '#fbbf24'];
const rarC = v => RAR[tierOf(v)];
const BOMB = '<svg viewBox="0 0 64 64" class="bombi"><circle cx="28" cy="38" r="20" fill="#1f1f24"/><circle cx="21" cy="31" r="6" fill="#ffffff22"/><rect x="34" y="12" width="10" height="10" rx="3" transform="rotate(35 39 17)" fill="#3a3a44"/><path d="M44 10c4-6 10-4 12 0" stroke="#f59e0b" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="57" cy="10" r="4" fill="#fde047"/><circle cx="57" cy="10" r="2" fill="#fff"/></svg>';
const GEMBIG = '<svg viewBox="0 0 64 64" class="gemi"><defs><linearGradient id="gg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a7f3d0"/><stop offset=".5" stop-color="#10b981"/><stop offset="1" stop-color="#047857"/></linearGradient></defs><path d="M18 10h28l12 16-26 30L6 26z" fill="url(#gg1)"/><path d="M6 26h52M18 10l8 16 6-16 6 16 8-16M26 26l6 30 6-30" stroke="#ffffff66" stroke-width="1.5" fill="none"/></svg>';
function burst(el, col, n) { const r = el.getBoundingClientRect(); for (let i = 0; i < (n || 14); i++) { const p = document.createElement('i'); p.className = 'pfx'; p.style.left = r.left + r.width / 2 + 'px'; p.style.top = r.top + r.height / 2 + 'px'; p.style.background = Array.isArray(col) ? pick(col) : col; const a = Math.random() * 6.28, d = rnd(30, 90); p.style.setProperty('--dx', Math.cos(a) * d + 'px'); p.style.setProperty('--dy', Math.sin(a) * d + 'px'); document.body.appendChild(p); setTimeout(() => p.remove(), 800) } }

// ---------------------------------------------------------------- umumiy tikish paneli (TON yoki sovg'a)
const BB = {};
function betBar(key) {
  return `<div class="bb2" id="bb_${key}"><div class="bbm"><button data-m="ton" class="on">${GEM}</button><button data-m="gift">${IC.gift}</button></div><div class="bbi"><input id="bbA_${key}" type="number" inputmode="decimal" placeholder="Bet amount" step="0.01"><div class="bbg" id="bbG_${key}"></div><span class="gm">${GEM}</span></div><div class="bbq"><button data-q="half">½</button><button data-q="dbl">2×</button><button data-q="max">Max</button></div></div>`;
}
function bbInit(key, onChange) {
  BB[key] = { mode: 'ton', items: [], on: onChange || (() => {}) };
  const root = $id('bb_' + key), A = $id('bbA_' + key);
  root.querySelectorAll('.bbm button').forEach(b => b.onclick = () => {
    BB[key].mode = b.dataset.m; root.querySelectorAll('.bbm button').forEach(x => x.classList.toggle('on', x === b));
    if (b.dataset.m === 'gift') pickGifts({ multi: true, title: 'Gifts to bet', sel: BB[key].items, done: ids => { BB[key].items = ids; bbDraw(key) } });
    bbDraw(key);
  });
  root.querySelectorAll('.bbq button').forEach(b => b.onclick = () => {
    if (BB[key].mode !== 'ton') return; const v = parseFloat(A.value) || 0, q = b.dataset.q;
    A.value = fmt(q === 'max' ? S.bal : q === 'half' ? Math.max(.1, v / 2) : Math.min(S.bal, Math.max(.1, v * 2))); BB[key].on();
  });
  A.oninput = () => BB[key].on();
  $id('bbG_' + key).onclick = () => pickGifts({ multi: true, title: 'Gifts to bet', sel: BB[key].items, done: ids => { BB[key].items = ids; bbDraw(key) } });
  bbDraw(key);
}
function bbDraw(key) {
  const b = BB[key], A = $id('bbA_' + key), G = $id('bbG_' + key); if (!A) return;
  b.items = b.items.filter(id => invGet(id));
  A.style.display = b.mode === 'ton' ? '' : 'none'; G.style.display = b.mode === 'gift' ? 'flex' : 'none';
  G.innerHTML = b.items.length ? b.items.slice(0, 4).map(id => GII(invGet(id))).join('') + `<b>${fmt(sumV(b.items.map(id => invGet(id).v)))}</b>` : '<em>Tap to select gifts</em>';
  b.on();
}
function bbVal(key) { const b = BB[key]; return b.mode === 'ton' ? r2(parseFloat($id('bbA_' + key).value) || 0) : r2(sumV(b.items.map(id => invGet(id) ? invGet(id).v : 0))) }
function bbTake(key, min) {
  min = min || .1; const b = BB[key], v = bbVal(key);
  if (b.mode === 'gift') { if (!b.items.length) { toast('Select gifts'); return 0 } invDel(b.items); b.items = []; bbDraw(key); return v }
  if (v < min) { toast(`Minimum bet ${GEM}${fmt(min)}`); return 0 }
  if (v > S.bal) { toast('Insufficient balance'); go('topup'); return 0 }
  setBal(-v); return v;
}

// =====================================================================
//  MINES
// =====================================================================
const M2 = { on: false, n: 3, bet: 0, mines: new Set(), open: new Set(), pf: null, done: false };
const RTP = g => ((CFG.RTP || {})[g] || { mines: 97, dice: 98, upgrade: 95, cases: 92, plinko: 100, spins: 100, crafts: 100 }[g]) / 100;
const m2Mul = k => { let m = 1; for (let i = 0; i < k; i++) m *= (25 - i) / (25 - M2.n - i); return Math.floor(m * RTP('mines') * 100) / 100 };
// video uslubidagi tikish paneli: [sovg'a | TON] + miqdor (+ qo'shimcha)
function betBar3(key, extra, ph) {
  return `<div class="bb2 bb3" id="bb_${key}"><div class="bbm"><button data-m="gift">${IC.gift}</button><button data-m="ton" class="on">${GEM}</button></div><div class="bbi"><input id="bbA_${key}" type="number" inputmode="decimal" placeholder="${ph || 'Amount'}" step="0.01"><div class="bbg" id="bbG_${key}"></div><span class="gm">${GEM}</span></div>${extra || ''}</div>`;
}
const GBOX = '<svg viewBox="0 0 24 24" class="gbx"><path d="M3 9h18v4H3zM5 13h14v8H5zM12 9v12M12 9c-2-4-6-4-6-1.5S9 9 12 9zm0 0c2-4 6-4 6-1.5S15 9 12 9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const BOMBI = '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="10" cy="14" r="7" fill="#3f6212"/><circle cx="8" cy="12" r="2" fill="#a3e63566"/><path d="M14 8l3-3" stroke="#a16207" stroke-width="2.2" stroke-linecap="round"/><circle cx="18.5" cy="4" r="1.6" fill="#f97316"/></svg>';
sec('mines', `<div class="mn3-hid"><b id="m2Next"></b><b id="m2Prof"></b><b id="m2Left"></b><button id="m2Rand"></button><div id="m2N"></div></div>
  <div class="mn2-chips mn3-chips" id="m2Chips"></div>
  <div class="mn2-wrap mn3-wrap"><div class="mn2-board" id="m2Board">${Array.from({ length: 25 }, (_, i) => `<button class="t2" data-i="${i}"><span class="fr">${GBOX}</span><span class="bk"></span></button>`).join('')}</div><div class="mn2-win" id="m2Win"></div></div>
  <button class="go3" id="m2Go">Enter a bet amount</button>
  ${betBar3('mn', `<button class="mn2-dd" id="m2Dd">${BOMBI}<b id="m2DdN">3</b><svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>`)}`);
function m2Render() {
  const k = M2.open.size, safe = 25 - M2.n;
  $id('m2Next').textContent = M2.on && k < safe ? m2Mul(k + 1).toFixed(2) + 'x' : m2Mul(1).toFixed(2) + 'x';
  $id('m2Prof').innerHTML = `${GEM}${fmt(M2.on && k ? M2.bet * m2Mul(k) - M2.bet : 0)}`;
  $id('m2Left').textContent = M2.on ? safe - k : safe;
  let c = ''; for (let i = 1; i <= safe; i++) c += `<span class="${M2.on && i === k + 1 ? 'cur' : M2.on && i <= k ? 'past' : ''}${i === safe ? ' max' : ''}">${m2Mul(i).toFixed(2)}x</span>`;
  $id('m2Chips').innerHTML = c; const cc = $('#m2Chips .cur'); if (cc) { const C = $id('m2Chips'); C.scrollTo({ left: cc.offsetLeft - C.clientWidth / 2 + cc.offsetWidth / 2, behavior: 'smooth' }) }
  const b = $id('m2Go');
  if (M2.on) { if (k) { b.className = 'go3 grn'; b.innerHTML = `Cash Out ${GEM}${fmt(M2.bet * m2Mul(k))}` } else { b.className = 'go3 dim'; b.textContent = 'Pick a tile' } }
  else { const v = BB.mn ? bbVal('mn') : 0; b.className = 'go3' + (v > 0 ? ' on' : ''); b.textContent = v > 0 ? 'Place Bet' : 'Enter a bet amount' }
  $id('m2Rand').disabled = !M2.on; $id('m2Dd').classList.toggle('dis', M2.on);
  $id('m2Board').classList.toggle('live', M2.on);
}
function m2Flip(i, kind, dim) {
  const t = $(`#m2Board .t2[data-i="${i}"]`); if (!t || t.classList.contains('rv')) return;
  t.querySelector('.bk').innerHTML = kind === 'gem' ? GEMBIG : BOMB; t.classList.add('rv', kind); if (dim) t.classList.add('dim');
}
function m2Reset() { $$('#m2Board .t2').forEach(t => { t.className = 't2'; t.querySelector('.bk').innerHTML = '' }); $id('m2Win').className = 'mn2-win' }
function m2End(pay, mult) {
  M2.on = false; M2.done = true;
  for (let i = 0; i < 25; i++) if (!M2.open.has(i)) setTimeout(() => m2Flip(i, M2.mines.has(i) ? 'bomb' : 'gem', true), 40 + (i % 5) * 30);
  if (M2.pf) { S.mh.unshift(Object.assign({}, M2.pf, { opened: M2.open.size, max: 25 - M2.n, pay, mult, pos: [...M2.mines] })); if (S.mh.length > 40) S.mh.length = 40; save(); M2.pf = null }
  m2Render();
}
function m2Start() {
  const a = bbTake('mn'); if (!a) return;
  if (M2.done) m2Reset(); M2.done = false;
  S.nonce++; M2.pf = { seed: PF.seed, hash: PF.hash, client: S.clientSeed, nonce: S.nonce, n: M2.n, bet: a, t: Date.now() };
  M2.mines = new Set(minesFrom(PF.seed, S.clientSeed, S.nonce, M2.n)); PF.seed = rndHex(32); PF.hash = sha256(PF.seed);
  M2.on = true; M2.bet = a; M2.open = new Set(); hap('medium'); m2Render();
}
function m2Pick(i) {
  if (!M2.on || M2.open.has(i)) return; M2.open.add(i); const t = $(`#m2Board .t2[data-i="${i}"]`);
  if (M2.mines.has(i)) {
    m2Flip(i, 'bomb'); burst(t, ['#ef4444', '#f97316', '#fde047'], 18); hapN('error');
    const bd = $id('m2Board'); bd.classList.remove('shake'); void bd.offsetWidth; bd.classList.add('shake');
    logGame('Mines', M2.bet, 0, '💣'); setTimeout(() => m2End(0, 0), 350); return;
  }
  m2Flip(i, 'gem'); burst(t, ['#34d399', '#a7f3d0'], 8); hap();
  if (M2.open.size === 25 - M2.n) return m2Cash();
  m2Render();
}
function m2Cash() {
  const k = M2.open.size, m = m2Mul(k), w = r2(M2.bet * m); payWin(w, 'Mines'); logGame('Mines', M2.bet, w, k + ' gems'); hapN('success');
  const W = $id('m2Win'); W.innerHTML = `<b>${m.toFixed(2)}x</b><span>${GEM}+${fmt(w)}</span>`; W.className = 'mn2-win on';
  m2End(w, m);
}
$id('m2Board').onclick = e => { const t = e.target.closest('.t2'); if (t) m2Pick(+t.dataset.i) };
$id('m2Go').onclick = () => { if (M2.on) { if (M2.open.size) m2Cash(); return } m2Start() };
$id('m2Rand').onclick = () => { if (!M2.on) return; const free = [...Array(25).keys()].filter(i => !M2.open.has(i)); if (free.length) m2Pick(pick(free)) };
document.body.insertAdjacentHTML('beforeend', `<div class="modal sheet2" id="mnSh"><div class="mbox"><div class="mhead"><span>Number of mines</span><button class="mx" data-close>✕</button></div><div class="mbody"><div class="mnl" id="mnL">${Array.from({ length: 24 }, (_, i) => `<button data-n="${i + 1}"><span>${i + 1}</span><i></i></button>`).join('')}</div></div></div></div>`);
function m2SetN(n) { M2.n = n; $id('m2DdN').textContent = n; $$('#mnL button').forEach(x => x.classList.toggle('on', +x.dataset.n === n)); if (M2.done) { m2Reset(); M2.done = false } m2Render() }
$id('m2Dd').onclick = () => { if (M2.on) return toast('Finish the current round first'); m2SetN(M2.n); openM('mnSh'); setTimeout(() => { const b = $('#mnL button.on'); b && b.scrollIntoView({ block: 'center' }) }, 60) };
$id('mnL').onclick = e => { const b = e.target.closest('[data-n]'); if (!b) return; hap(); m2SetN(+b.dataset.n); setTimeout(() => closeM('mnSh'), 150) };
bbInit('mn', () => { if (!M2.on) m2Render() });
ENTER.mines = m2Render;

// =====================================================================
//  DICE
// =====================================================================
const D2 = { over: true, t: 49.99, busy: false, hist: [] };
const SWAP = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 8h14l-4-4M20 16H6l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
sec('dice', `<div class="dc3-c dc3-sl"><div class="dc3-rg">0 – 100</div>
    <div class="dc3-tk">${[0, 25, 50, 75, 100].map(v => `<span style="left:${v}%">${v}<i></i></span>`).join('')}</div>
    <div class="dc3-trk"><div class="dc3-bar" id="d2Bar"></div><div class="dc3-knob" id="d2K"></div><div class="dc3-pin" id="d2Pin"><span id="d2PinV"></span></div><input type="range" id="d2R" min="2" max="98" step="0.01" value="49.99"></div>
  </div>
  <div class="dc3-c dc3-f">
    <div class="dc3-row"><label><small>Multiplier</small><div class="dc3-in"><input id="d2M" type="number" step="0.01" inputmode="decimal"><em>✕</em></div></label><label><small id="d2HL">Higher</small><div class="dc3-in"><input id="d2T" type="number" step="0.01" inputmode="decimal"><button id="d2Sw">${SWAP}</button></div></label></div>
    <label class="dc3-ch"><small>Chance Of Winning</small><div class="dc3-in"><input id="d2C" type="number" step="0.01" inputmode="decimal"><em>%</em></div></label>
  </div>
  <div class="dc3-c dc3-b">${betBar3('dc', '', CUR + ' amount')}<button class="go3" id="d2Go">Place Bet</button></div>
  <div class="dc3-hist" id="d2Hist"></div>`);
const d2Ch = () => D2.over ? 100 - D2.t : D2.t;
function d2Sync(from) {
  D2.t = Math.round(clamp(D2.t, 2, 98) * 100) / 100; const ch = Math.round(d2Ch() * 100) / 100, m = RTP('dice') * 100 / ch;
  if (from !== 'r') $id('d2R').value = D2.t;
  if (from !== 'm') $id('d2M').value = m.toFixed(2);
  if (from !== 'c') $id('d2C').value = ch.toFixed(2);
  if (from !== 't') $id('d2T').value = D2.t.toFixed(2);
  $id('d2HL').textContent = D2.over ? 'Higher' : 'Lower';
  $id('d2K').style.left = D2.t + '%';
  const r = 'repeating-linear-gradient(120deg,#ff3b5c 0 6px,#e0153f 6px 12px)', g = 'repeating-linear-gradient(120deg,#22e06b 0 6px,#12b955 6px 12px)';
  $id('d2Bar').style.background = D2.over ? `${r} 0 0/${D2.t}% 100% no-repeat,${g}` : `${g} 0 0/${D2.t}% 100% no-repeat,${r}`;
  $id('d2Bar').style.setProperty('--gl', D2.over ? '#22c55e' : '#f43f5e');
  const v = bbVal('dc'), G = $id('d2Go'); if (!D2.busy) { G.className = 'go3' + (v > 0 ? ' pur' : ''); G.textContent = 'Place Bet' }
}
$id('d2R').oninput = () => { D2.t = parseFloat($id('d2R').value); d2Sync('r') };
$id('d2M').onchange = () => { const m = clamp(parseFloat($id('d2M').value) || 1.96, 1.0001, 49), ch = RTP('dice') * 100 / m; D2.t = D2.over ? 100 - ch : ch; d2Sync('m') };
$id('d2C').onchange = () => { const ch = clamp(parseFloat($id('d2C').value) || 50, 2, 98); D2.t = D2.over ? 100 - ch : ch; d2Sync('c') };
$id('d2T').onchange = () => { D2.t = parseFloat($id('d2T').value) || 50; d2Sync('t') };
$id('d2Sw').onclick = () => { D2.over = !D2.over; D2.t = 100 - D2.t; hap(); d2Sync() };
$id('d2Go').onclick = async () => {
  if (D2.busy) return; const a = bbTake('dc'); if (!a) return; D2.busy = true;
  const ch = d2Ch(), m = RTP('dice') * 100 / ch, r = Math.floor(Math.random() * 10001) / 100, win = D2.over ? r > D2.t : r < D2.t;
  const P = $id('d2Pin'), V = $id('d2PinV'), G = $id('d2Go'); G.className = 'go3 dim'; G.textContent = 'Rolling…';
  P.className = 'dc3-pin on roll'; const t0 = performance.now();
  await new Promise(res => { const st = now => { const k = Math.min(1, (now - t0) / 800), e = 1 - Math.pow(1 - k, 3), x = k < 1 ? (Math.random() * 100 * (1 - e) + r * e) : r; P.style.left = x + '%'; V.textContent = x.toFixed(2); if (k < 1) requestAnimationFrame(st); else res() }; requestAnimationFrame(st) });
  P.className = 'dc3-pin on ' + (win ? 'w' : 'l');
  const w = win ? r2(a * m) : 0;
  if (win) { payWin(w, 'Dice'); hapN('success'); burst(P, ['#22c55e', '#86efac'], 14) } else { hapN('error'); toast(`Rolled ${r.toFixed(2)} — no luck`) }
  logGame('Dice', a, w, r.toFixed(2));
  D2.hist.unshift({ r, win }); D2.hist = D2.hist.slice(0, 12);
  $id('d2Hist').innerHTML = D2.hist.map(h => `<span class="${h.win ? 'w' : 'l'}">${h.r.toFixed(2)}</span>`).join('');
  setTimeout(() => { D2.busy = false; d2Sync() }, 300);
};
bbInit('dc', () => d2Sync());
ENTER.dice = () => d2Sync();

// =====================================================================
//  UPGRADE
// =====================================================================
sec('upgrade', `<div class="up3-top"><div class="up3-col"><span class="up3-lb"><i>1</i>Your Gift</span><button class="up2-c" id="u2From"></button></div><div class="up2-arr"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="#fff"/></svg></div><div class="up3-col"><span class="up3-lb"><i>2</i>Target Gift</span><button class="up2-c tgt" id="u2To"></button></div></div>
  <div class="up2-wheel up3-wheel" id="u2Wheel"><div class="up3-ring">${Array.from({ length: 72 }, (_, i) => `<i style="transform:rotate(${i * 5}deg)"></i>`).join('')}</div><div class="up3-disc" id="u2Disc"></div><svg viewBox="0 0 220 220" style="display:none"><circle id="u2Arc"/></svg>
    <div class="up2-nd" id="u2Nd"><i></i></div><div class="up2-cen"><b id="u2Ch">100.0%</b><small id="u2Lv">VERY HIGH</small></div></div>
  <div class="up2-tog" style="display:none"><button data-m="gift" class="on">${IC.gift} Gift</button><button data-m="ton">${GEM} ${CUR}</button></div>
  <div class="inp up2-ton" id="u2TonW" style="display:none"><input id="u2Ton" type="number" inputmode="decimal" placeholder="${CUR} amount" step="0.01"><span class="gm">${GEM}</span></div>
  <div class="up2-q" id="u2Q" style="display:none">${[1.5, 2, 3, 5, 10, 20].map(x => `<button data-x="${x}">x${x}</button>`).join('')}</div>
  <button class="go3 up3-go" id="u2Go"></button>
  ${howBlock('upgrade', true)}`);
const upLvl = c => c >= 80 ? 'VERY HIGH' : c >= 50 ? 'HIGH' : c >= 25 ? 'MEDIUM' : c >= 10 ? 'LOW' : 'VERY LOW';
const U2 = { rot: 0 };
const u2From = () => UP.mode === 'gift' ? (invGet(UP.from) ? invGet(UP.from).v : 0) : r2(parseFloat($id('u2Ton').value) || 0);
const u2Chance = () => { const f = u2From(); return f && UP.to != null ? clamp(f / GIFTS[UP.to].p * RTP('upgrade') * 100, .5, 90) : 0 };
function u2Render() {
  const it = UP.mode === 'gift' ? (invGet(UP.from) || (UP.spinning ? U2.lockIt : null)) : null, fv = UP.spinning && U2.lockIt ? U2.lockIt.v : u2From();
  $id('u2From').innerHTML = it ? `<span class="rb" style="--rc:${rarC(it.v)}"></span>${GII(it)}<b>${esc(GIFTS[it.g].n)}</b><em>${GEM}${fmt(it.v)}</em>` : UP.mode === 'ton' && fv ? `<span class="rb" style="--rc:#38bdf8"></span><span class="bigg">${GEM}</span><b>${CUR}</b><em>${GEM}${fmt(fv)}</em>` : `<span class="pl2">＋</span><b>Select Gift</b><small>Choose a gift to upgrade</small>`;
  const tg_ = UP.to != null ? GIFTS[UP.to] : null;
  $id('u2To').innerHTML = tg_ ? `<span class="rb" style="--rc:${rarC(tg_.p)}"></span>${GI(tg_)}<b>${esc(tg_.n)}</b><em>${GEM}${fmt(tg_.p)}</em>` : `<span class="pl2">＋</span><b>${fv ? 'Select Target' : 'Select a gift first'}</b><small>${fv ? 'Choose a gift to win' : 'Select a gift to continue'}</small>`;
  const ch = UP.spinning && U2.lock ? U2.lock : u2Chance(), shown = ch || 100;
  $id('u2Disc').style.setProperty('--p', shown * 3.6 + 'deg');
  $id('u2Ch').textContent = shown.toFixed(1) + '%';
  $id('u2Lv').textContent = upLvl(shown);
  $id('u2Ch').style.color = shown >= 25 ? '#34d399' : shown >= 10 ? '#fbbf24' : '#f87171';
  $$('.up2-tog button').forEach(b => b.classList.toggle('on', b.dataset.m === UP.mode)); $id('u2TonW').style.display = UP.mode === 'ton' ? '' : 'none';
  const g = $id('u2Go'); g.className = 'go3 up3-go' + (ch && !UP.spinning ? ' grn' : ''); g.innerHTML = UP.spinning ? 'Upgrading…' : ch ? `${IC.trend}Upgrade · ${ch.toFixed(1)}%` : `${IC.trend}Select both gifts to upgrade`;
}
$id('u2From').onclick = () => { if (UP.spinning || UP.mode !== 'gift') return; pickGifts({ multi: false, title: 'Select your gift', done: id => { UP.from = id; if (UP.to != null && GIFTS[UP.to].p <= u2From()) UP.to = null; u2Render() } }) };
$id('u2To').onclick = () => { if (UP.spinning) return; const fv = u2From(); if (!fv) { toast('Select your gift first'); return } pickGifts({ source: 'cat', title: 'Select target gift', filter: g => g.p > fv * 1.05 && g.p <= fv * 200, done: gi => { UP.to = gi; u2Render() } }) };
$$('.up2-tog button').forEach(b => b.onclick = () => { if (UP.spinning) return; UP.mode = b.dataset.m; UP.from = null; UP.to = null; u2Render() });
$id('u2Ton').oninput = u2Render;
$id('u2Q').onclick = e => { const b = e.target.closest('[data-x]'); if (!b || UP.spinning) return; const fv = u2From(); if (!fv) { toast('Select your gift first'); return } const t = fv * +b.dataset.x; let best = null; for (const g of BYPRICE) { if (g.p > fv * 1.05 && g.p <= t) best = g } best = best || BYPRICE.find(g => g.p > fv * 1.05); if (best) { UP.to = best.i; hap(); u2Render() } };
$id('u2Go').onclick = async () => {
  const ch = u2Chance(); if (!ch || UP.spinning) return; const fv = u2From(), tg_ = GIFTS[UP.to];
  if (UP.mode === 'ton') { if (fv > S.bal) { toast('Insufficient balance'); return } if (fv < .1) { toast('Minimum 0.10'); return } setBal(-fv) } else { U2.lockIt = invGet(UP.from); invDel([UP.from]) }
  UP.spinning = true; U2.lock = ch; U2.lockTo = UP.to; u2Render(); const W = $id('u2Wheel'); W.className = 'up2-wheel up3-wheel uspin';
  const r = Math.random() * 100, win = r < ch;
  const land = win ? rnd(.08, .92) * ch : ch + rnd(.08, .92) * (100 - ch); // yashil yoy ichida = yutuq
  U2.rot += 360 * 6 + (360 - (U2.rot % 360)) + land * 3.6;
  const nd = $id('u2Nd'); nd.style.transition = 'transform 4.6s cubic-bezier(.12,.75,.1,1)'; nd.style.transform = `rotate(${U2.rot}deg)`;
  hap('medium'); await sleep(4700);
  UP.spinning = false; U2.lock = 0; U2.lockIt = null; W.className = 'up2-wheel up3-wheel ' + (win ? 'win' : 'lose');
  if (win) { const it = addItem(tg_, tg_.p); burst(W, ['#34d399', '#fde047', '#a78bfa'], 26); logGame('Upgrade', fv, tg_.p, tg_.n); setTimeout(() => showRes(true, tg_, 'Upgrade successful! ⚡', `${esc(tg_.n)} · ${g$(tg_.p)}`), 500) }
  else { logGame('Upgrade', fv, 0, tg_.n); hapN('error'); setTimeout(() => showRes(false, tg_, 'Upgrade failed', `${ch.toFixed(1)}% chance`), 500) }
  UP.from = null; if (UP.mode === 'ton') $id('u2Ton').value = ''; setTimeout(() => { W.className = 'up2-wheel up3-wheel'; u2Render() }, 1600); u2Render();
};
ENTER.upgrade = u2Render;

// =====================================================================
//  CRAFTS
// =====================================================================
sec('crafts', `<div class="cf3-mode"><div class="cf3-h"><i>${IC.shuffle}</i><div><b>Craft Mode</b><small>Combine your gifts to craft a new one</small></div></div><div class="cf3-ms" id="c2Modes"></div></div>
  <div class="cf3-sl" id="c2Forge"><div class="cf3-sh"><b>Craft Slots</b><span id="c2Cnt">0/10</span><em id="c2Val"></em></div><div class="cf3-grid" id="c2Slots"></div><div class="cf3-fx"><i></i></div></div>
  <div class="cf2-tgt cf3-tgt" id="c2Tgt"></div>
  <button class="go3 cf3-go" id="c2Go"></button>
  <div class="cf3-clr"><button id="c2Add">＋ Add gifts</button><button id="c2Clr">Clear</button></div>
  ${howBlock('crafts', true)}`);
const SPARK = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8zM5 2l.6 1.4L7 4l-1.4.6L5 6l-.6-1.4L3 4l1.4-.6z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
function c2Target() { const tot = crTotal(), t = tot * CR_M[CR.mode].x; let best = null; for (const g of BYPRICE) { if (g.p <= t && g.p > tot) best = g } return best || BYPRICE.find(g => g.p > tot) || BYPRICE[BYPRICE.length - 1] }
function c2Render() {
  CR.slots = CR.slots.filter(id => invGet(id));
  $id('c2Modes').innerHTML = Object.entries(CR_M).map(([k, m]) => `<button class="${CR.mode === k ? 'on' : ''} ${k}" data-m="${k}"><span class="ic">${ICO[m.ic]}</span><b>${m.n}</b><em>x${m.x}</em><small>min cost</small><i>${fmt(m.min)}${GEM}</i></button>`).join('');
  let h = ''; const nx = CR.slots.length; for (let i = 0; i < 10; i++) { const it = invGet(CR.slots[i]); h += `<button class="cs3 ${it ? 'f' : ''} ${i === nx ? 'nx' : ''}" data-i="${i}">${it ? GII(it) + `<i>${fmt(it.v)}</i>` : '＋'}</button>` }
  $id('c2Slots').innerHTML = h;
  const tot = crTotal(), m = CR_M[CR.mode];
  $id('c2Cnt').textContent = `${CR.slots.length}/10`; $id('c2Cnt').className = CR.slots.length >= 2 ? 'ok' : '';
  $id('c2Val').innerHTML = tot ? `${GEM}${fmt(tot)}` : '';
  const tg_ = CR.slots.length >= 2 ? c2Target() : null;
  $id('c2Tgt').innerHTML = tg_ ? `${GI(tg_)}<div><small>Possible reward</small><b>${esc(tg_.n)}</b><em>${GEM}${fmt(tg_.p)} · x${(tg_.p / tot).toFixed(1)}</em></div><span class="ch">${(m.ch * Math.min(1, tot * m.x / tg_.p) * 100).toFixed(1)}%</span>` : '';
  $id('c2Tgt').style.display = tg_ ? '' : 'none';
  const ok = CR.slots.length >= 2 && tot >= m.min && !CR.busy, g = $id('c2Go');
  g.className = 'go3 cf3-go' + (ok ? (CR.mode === 'risky' ? ' red' : ' pur') : '');
  g.innerHTML = CR.busy ? 'Crafting…' : CR.slots.length < 2 ? `${SPARK}Add at least 2 gifts to start` : tot < m.min ? `${SPARK}Min cost ${fmt(m.min)} ${CUR}` : `${SPARK}Craft · ${m.n}`;
}
$id('c2Modes').onclick = e => { const b = e.target.closest('[data-m]'); if (!b || CR.busy) return; CR.mode = b.dataset.m; hap(); c2Render() };
const c2Pick = () => pickGifts({ multi: true, max: 10, title: 'Gifts to craft', sel: CR.slots, done: ids => { CR.slots = ids.slice(0, 10); c2Render() } });
$id('c2Slots').onclick = e => { if (CR.busy) return; const s = e.target.closest('.cs3'); if (!s) return; const i = +s.dataset.i; if (CR.slots[i]) { CR.slots.splice(i, 1); c2Render() } else c2Pick() };
$id('c2Add').onclick = () => { if (!CR.busy) c2Pick() };
$id('c2Clr').onclick = () => { if (!CR.busy) { CR.slots = []; c2Render() } };
$id('c2Go').onclick = async () => {
  const tot = crTotal(), m = CR_M[CR.mode]; if (CR.busy || CR.slots.length < 2 || tot < m.min) { if (CR.slots.length < 2 && !CR.busy) c2Pick(); return }
  const t = c2Target(), ids = [...CR.slots]; CR.busy = true; c2Render();
  const F = $id('c2Forge'), G = $id('c2Slots'), gr = G.getBoundingClientRect(), cx0 = gr.left + gr.width / 2, cy0 = gr.top + gr.height / 2;
  F.classList.add('go');
  $$('#c2Slots .cs3.f').forEach((s, i) => { const r = s.getBoundingClientRect(); s.style.transition = `transform .7s ${i * .07}s cubic-bezier(.5,0,.75,0), opacity .7s ${i * .07}s`; s.style.transform = `translate(${cx0 - (r.left + r.width / 2)}px,${cy0 - (r.top + r.height / 2)}px) scale(.3) rotate(${rnd(-90, 90)}deg)`; s.style.opacity = '0' });
  hap('heavy'); await sleep(1900);
  invDel(ids); CR.slots = [];
  const win = Math.random() < m.ch * Math.min(1, tot * m.x / t.p);
  F.classList.remove('go'); F.classList.add(win ? 'win' : 'lose'); burst(G, win ? ['#fde047', '#a78bfa', '#34d399'] : ['#ef4444', '#555'], 26);
  if (win) { addItem(t, t.p); logGame('Crafts', tot, t.p, t.n) } else logGame('Crafts', tot, 0, t.n);
  await sleep(450); showRes(win, t, win ? 'Craft successful! ✨' : 'Craft failed', win ? `${esc(t.n)} · ${g$(t.p)}` : `${ids.length} gifts lost`);
  F.classList.remove('win', 'lose'); CR.busy = false; c2Render();
};
ENTER.crafts = c2Render;

// =====================================================================
//  SPINS — Buy Feature oynasi
// =====================================================================
document.body.insertAdjacentHTML('beforeend', `<div class="modal" id="bfM"><div class="mbox bf2"><button class="mx" data-close>✕</button>
  <div class="bf2-art">${['Plush Pepe', 'Heart Locket', 'Precious Peach', 'Scared Cat', 'Stellar Rocket'].map((n, i) => `<span style="--i:${i}">${GI(byName(n))}</span>`).join('')}</div>
  <small>BUY FEATURE</small><h3>10 FREE SPINS</h3><p>Every win in free spins is multiplied <b>×10</b></p>
  <div class="bf2-bet"><button id="bfM1">−</button><div><small>Bet per spin</small><b id="bfBet"></b></div><button id="bfP1">＋</button></div>
  <div class="bf2-cost"><span>Price</span><b id="bfCost"></b></div>
  <button class="btn-y" id="bfGo">Buy Feature</button></div></div>
  <div class="fsban" id="fsBan"><small>FEATURE ACTIVATED</small><b>10 FREE SPINS</b><span>×10 multiplier</span></div>`);
function bfDraw() { const b = spBet(); $id('bfBet').innerHTML = `${GEM}${fmt(b)}`; $id('bfCost').innerHTML = `${GEM}${fmt(b * 100)}`; $id('bfGo').className = 'btn-y' + (b * 100 > S.bal ? ' dim' : '') }
$id('spBuy').onclick = () => { if (SP.free || SP.busy) { toast('Free spins in progress'); return } bfDraw(); openM('bfM') };
$id('bfM1').onclick = () => { $('#spBet').value = fmt(Math.max(.05, spBet() - (spBet() > 1 ? .5 : .05))); spUI(); bfDraw() };
$id('bfP1').onclick = () => { $('#spBet').value = fmt(Math.min(500, spBet() + (spBet() >= 1 ? .5 : .05))); spUI(); bfDraw() };
$id('bfGo').onclick = () => {
  const c = r2(spBet() * 100); if (c > S.bal) { toast('Insufficient balance'); go('topup'); return }
  setBal(-c); logGame('Spins', c, 0, 'Buy feature'); SP.free = 10; SP.freeMul = 10; spUI(); closeM('bfM');
  const B = $id('fsBan'); B.classList.add('on'); hapN('success'); setTimeout(() => { B.classList.remove('on'); spSpin() }, 1700);
};

// =====================================================================
//  QUTI OCHISH — rarity, sekinlashuv, "tik" va g'olib kartochka
// =====================================================================
reelTile = function (o) {
  if (o.bal) return `<div class="tl bal" style="--rc:#38bdf8">${GEM}<em>${fmt(o.v)}</em></div>`;
  return `<div class="tl" style="--rc:${rarC(o.v)}">${GI(o.g)}<em>${fmt(o.v)}</em></div>`;
};
async function reelRun(tr, idx, dur, skipRef) {
  const mid = tr.parentElement.clientWidth / 2, c = tr.children[idx];
  const x = -(c.offsetLeft + c.offsetWidth / 2 - mid) + rnd(-c.offsetWidth * .35, c.offsetWidth * .35);
  tr.parentElement.classList.add('run');
  tr.style.transition = `transform ${dur}ms cubic-bezier(.08,.72,.12,1)`; tr.style.transform = `translateX(${x}px)`;
  const w = c.offsetWidth + 10; let last = 0; const t0 = performance.now();
  await new Promise(res => { const st = now => {
    const m = new DOMMatrix(getComputedStyle(tr).transform); const k = Math.floor(-m.m41 / w);
    if (k !== last) { last = k; hap('light') }
    if (now - t0 < dur + 80 && !(skipRef && skipRef.skip)) requestAnimationFrame(st); else res();
  }; requestAnimationFrame(st) });
  if (skipRef && skipRef.skip) { tr.style.transition = 'transform .25s ease-out'; tr.style.transform = `translateX(${x}px)`; await sleep(280) }
  tr.parentElement.classList.remove('run'); c.classList.add('winr'); burst(c, [c.style.getPropertyValue('--rc') || '#a78bfa', '#fff'], 16); hapN('success');
  await sleep(750);
}
boxOpen = async function (outs, cost, free) {
  if (BX.busy) return; const bx = BX.cur;
  if (free) { if (!BX.promo) return; BX.promo = null } else { if (cost > S.bal) { go('topup'); return } setBal(-cost) }
  BX.busy = true; const win = rollOut(outs);
  const items = Array.from({ length: 52 }, () => rollOut(outs)); items[44] = win;
  const tr = $id('bxTr'); tr.innerHTML = items.map(reelTile).join(''); tr.style.transition = 'none'; tr.style.transform = 'translateX(0)';
  const skip = { skip: false }, gb = $id('bxGo'); if (gb) { gb.innerHTML = `${IC.spark}Skip Animation`; gb.onclick = () => skip.skip = true }
  await sleep(40); hap('medium'); await reelRun(tr, 44, 5200, skip);
  boxPay(win, (free ? 'Free' : bx.n) + ' Box', cost); BX.busy = false; boxRender(); save();
};
dailyOpen = async function (outs) {
  if (DB.busy || S.daily + 864e5 > Date.now()) return; DB.busy = true; S.daily = Date.now(); save();
  const win = rollOut(outs), items = Array.from({ length: 52 }, () => dShow(outs)); items[44] = win;
  const tr = $id('dbTr'); tr.innerHTML = items.map(reelTile).join(''); tr.style.transition = 'none'; tr.style.transform = 'translateX(0)';
  const skip = { skip: false }, b = $id('dbGo'); b.innerHTML = `${IC.spark}Skip Animation`; b.onclick = () => skip.skip = true;
  await sleep(40); await reelRun(tr, 44, 5200, skip);
  boxPay(win, 'Daily Box', 0); DB.busy = false; dailyRender();
};

// =====================================================================
//  SOVG'A TANLASH oynasi (yangi)
// =====================================================================
document.body.insertAdjacentHTML('beforeend', `<div class="modal gp2" id="gp2M"><div class="mbox"><div class="gp2h"><b id="gp2T">Select gifts</b><span id="gp2N"></span><button class="mx" data-close>✕</button></div>
  <div class="gp2s"><input id="gp2Q" placeholder="Search gifts…" autocomplete="off"><div class="gp2o" id="gp2O"><button data-o="hi" class="on">Price ↓</button><button data-o="lo">Price ↑</button><button data-o="az">A–Z</button></div></div>
  <div class="gp2g" id="gp2G"></div>
  <div class="gp2b" id="gp2B"><div><small id="gp2C">0 selected</small><b id="gp2V"></b></div><button id="gp2Ok">Confirm</button></div></div></div>`);
const GP = { o: null, sel: [], sort: 'hi' };
pickGifts = function (o) {
  GP.o = o; GP.sel = [...(o.sel || [])]; GP.sort = o.source === 'cat' ? 'lo' : 'hi';
  $id('gp2T').textContent = o.title || 'Select gifts'; $id('gp2Q').value = '';
  $id('gp2B').style.display = o.multi ? 'flex' : 'none';
  $$('#gp2O button').forEach(b => b.classList.toggle('on', b.dataset.o === GP.sort));
  gpDraw(); openM('gp2M'); setTimeout(() => $id('gp2G').scrollTop = 0, 0);
};
function gpDraw() {
  const o = GP.o, q = $id('gp2Q').value.trim().toLowerCase(), cat = o.source === 'cat';
  let l = cat ? GIFTS.filter(g => !o.filter || o.filter(g)).map(g => ({ k: g.i, g, v: g.p, ms: null, m: null }))
    : S.inv.filter(it => !o.filter || o.filter(it)).map(it => ({ k: it.id, g: GIFTS[it.g], v: it.v, ms: it.ms, m: it.m, it }));
  if (q) l = l.filter(x => (x.g.n + ' ' + (x.m || '')).toLowerCase().includes(q));
  l.sort(GP.sort === 'hi' ? (a, b) => b.v - a.v : GP.sort === 'lo' ? (a, b) => a.v - b.v : (a, b) => a.g.n.localeCompare(b.g.n));
  $id('gp2N').textContent = `${l.length} ${cat ? 'gifts' : 'available'}`;
  $id('gp2G').innerHTML = l.length ? l.map(x => `<button class="gc2 ${GP.sel.includes(x.k) ? 'on' : ''}" data-k="${x.k}" style="--rc:${rarC(x.v)}"><i class="ck"></i><em>${fmt(x.v)}${GEM}</em><span class="im">${x.it ? GII(x.it) : GI(x.g)}</span><b>${esc(x.g.n)}</b><small>${esc(x.m || (cat ? TIER_N[tierOf(x.v)] : 'Random'))}</small></button>`).join('')
    : `<div class="gp2e">${cat ? 'No gifts match' : `Your backpack is empty<br><a data-go2="home">Open boxes</a> or <a data-go2="topup">deposit gifts</a>`}</div>`;
  const tv = sumV(GP.sel.map(id => invGet(id) ? invGet(id).v : 0));
  $id('gp2C').textContent = `${GP.sel.length} selected`; $id('gp2V').innerHTML = `${GEM}${fmt(tv)}`;
  $id('gp2Ok').className = GP.sel.length ? '' : 'dim';
}
$id('gp2Q').oninput = gpDraw;
$id('gp2O').onclick = e => { const b = e.target.closest('[data-o]'); if (!b) return; GP.sort = b.dataset.o; $$('#gp2O button').forEach(x => x.classList.toggle('on', x === b)); gpDraw() };
$id('gp2G').onclick = e => {
  const a = e.target.closest('[data-go2]'); if (a) { closeM('gp2M'); go(a.dataset.go2); return }
  const c = e.target.closest('.gc2'); if (!c) return; const o = GP.o; hap();
  if (o.source === 'cat') { closeM('gp2M'); o.done(+c.dataset.k); return }
  const id = c.dataset.k;
  if (!o.multi) { closeM('gp2M'); o.done(id); return }
  if (GP.sel.includes(id)) GP.sel = GP.sel.filter(x => x !== id); else { if (o.max && GP.sel.length >= o.max) { toast(`Maximum ${o.max}`); return } GP.sel.push(id) }
  gpDraw();
};
$id('gp2Ok').onclick = () => { closeM('gp2M'); GP.o.done(GP.sel) };


// =====================================================================
//  v11 ROCKET — video bo'yicha: markazda sovg'a-raketa, chapda iz, sanoq halqasi
// =====================================================================

const trailCol = m => m < 2 ? '#22c55e' : m < 5 ? '#3b82f6' : m < 10 ? '#a855f7' : '#facc15';
const bigCol = m => m < 1.2 ? '#ef4444' : m < 2 ? '#3b82f6' : '#22c55e';
const cntCol = n => n >= 4 ? '#3b82f6' : n === 3 ? '#facc15' : n === 2 ? '#f97316' : '#ef4444';
rkDraw = function (now) {
  if (!RKV.W) rkResize();
  const W = RKV.W, H = RKV.H, dpr = RKV.dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
  const img = $id('rkImg'), big = $id('rkBig'), cnt = $id('rkCount'), cyc = H * .44;
  stage.classList.toggle('v11', true);
  if (RK.phase === 'wait') {
    img.classList.remove('on'); big.classList.remove('on', 'fly'); cnt.classList.add('on'); $id('rkBoom').classList.remove('on');
    const left = Math.max(0, (RK.waitEnd - now) / 1000), n = Math.max(1, Math.ceil(left)), c = cntCol(n);
    $id('rkCnt').textContent = n;
    const arc = $id('rkArc'); arc.style.strokeDashoffset = 276.5 * (1 - (left - Math.floor(left) || 1)); arc.style.stroke = c;
    cnt.style.setProperty('--cc', c); cnt.style.top = cyc + 'px';
    return;
  }
  cnt.classList.remove('on');
  const crashed = RK.phase === 'crash';
  const t = crashed ? (RK.crashAt - RK.t0) / 1000 : (now - RK.t0) / 1000;
  const m = crashed ? RK.crash : RK.m, col = crashed ? '#ef4444' : trailCol(m);
  // iz: chap chetdan chiqib keladi
  const sz0 = Math.min(112, W * .3), rx = W / 2 - sz0 * .42; // iz raketa tomon uzluksiz cho'ziladi (asimptotik)
  const hx = 18 + (rx - 18) * (1 - Math.exp(-t / 7)), hy = H * .7 + Math.sin(now / 420) * 2;
  const gr = cx.createLinearGradient(0, hy, hx, hy); gr.addColorStop(0, col + '00'); gr.addColorStop(1, col);
  cx.lineCap = 'round'; if (S.gfx !== 'low') { cx.shadowColor = col; cx.shadowBlur = 14 }
  cx.strokeStyle = gr; cx.lineWidth = 6; cx.beginPath(); cx.moveTo(-6, hy + 2); cx.quadraticCurveTo(hx * .5, hy + 3, hx, hy); cx.stroke();
  cx.fillStyle = crashed ? '#ef4444' : '#fff'; cx.shadowColor = col; cx.shadowBlur = 16; cx.beginPath(); cx.arc(hx, hy, 6.5, 0, 7); cx.fill(); cx.shadowBlur = 0;
  if (!crashed) {
    const sz = Math.min(112, W * .3), bob = Math.sin(now / 230) * 5, sw = Math.sin(now / 610) * 6, rot = -18 + Math.sin(now / 500) * 4;
    img.style.width = img.style.height = sz + 'px';
    img.style.transform = `translate(${W / 2 - sz / 2 + sw}px,${cyc - sz / 2 + bob}px) rotate(${rot}deg)`;
    img.classList.add('on'); big.classList.remove('on', 'fly');
    if (S.gfx === 'high' && Math.random() < .35) rkSpark(W / 2 - sz * .35 + sw, cyc + sz * .2 + bob);
  } else {
    img.classList.remove('on');
    const bm = $id('rkBoom'); bm.style.left = W / 2 + 'px'; bm.style.top = cyc + 'px';
    if (!bm.classList.contains('on') && now - RK.crashAt < 120) { void bm.offsetWidth; bm.classList.add('on') }
    big.textContent = RK.crash.toFixed(2) + 'x'; big.style.color = bigCol(RK.crash); big.style.top = (cyc - 36) + 'px';
    if (now - RK.crashAt > 380) big.classList.add('on');
  }
};
const _rkR11 = rkRender;
rkRender = function (f) {
  _rkR11(f);
  const b = $id('rkBtn'); if (b && RK.my && RK.my.out && RK.phase === 'fly') { b.className = 'bigbtn ok'; const nf = RK.my.nf || (typeof LV !== 'undefined' && LV.paidRk === RK.round ? LV.rkNf : null); b.innerHTML = nf ? `✓ Won ${esc(nf.g.n)} · ${g$(nf.p)}` : `✓ Cashed out ${g$(RK.my.amt * RK.my.out)}` }
  if (b && /^Place bet \(next round\)$/.test(b.textContent.trim())) b.textContent = 'Place bet';
  if (b && RK.next && RK.phase !== 'wait') { b.className = 'bigbtn wait'; b.innerHTML = `Next round · ${g$(RK.next.amt)} <small style="opacity:.7;font-weight:600">tap to cancel</small>` }
  const h = $id('rkHist'); if (h && !h._v11) { h._v11 = 1 }
  $$('#rkHist span').forEach(e => { const v = parseFloat(e.textContent); if (!isNaN(v) && !e.classList.contains('bet')) { e.className = (e.classList.contains('now') ? 'now ' : '') + (v < 1.2 ? 'c-red' : v < 2 ? 'c-grn' : v < 5 ? 'c-blu' : v < 10 ? 'c-pur' : 'c-gld') } });
};

// =====================================================================
//  PvP WINNER sheet — video: "Winner · Game #…" + Rewards kartalari
// =====================================================================
document.body.insertAdjacentHTML('beforeend', `<div class="modal sheet2" id="pvWM"><div class="mbox"><div class="mhead"><div><b>Winner</b><small id="pvWG"></small></div><button class="mx" data-close>✕</button></div><div class="mbody" id="pvWB"></div></div></div>`);
// Live o'yin g'alabasi — videodagi "Winner" oynasi: nima yutilgani (TON + sovg'alar) kartalar bilan
function winSheet(from, ton, items, game) {
  const tot = r2((ton || 0) + sumV(items.map(it => it.v)));
  $id('pvWG').textContent = `${from || 'Game'}${game ? ' · Game #' + game : ''}`;
  const cards = (ton > 0 ? [`<div class="pwr gram" style="--d:0"><em>${fmt(ton)}${GEM}</em><div class="ic">${GEM.replace('class="gem"', 'class="gem" style="width:46px;height:46px"')}</div><span class="lb">${CUR} Prize</span><b>${CUR}</b></div>`] : [])
    .concat(items.map((it, i) => `<div class="pwr" style="--rc:${TIER_C[tierOf(it.v)]};--d:${i + 1}"><em>${fmt(it.v)}${GEM}</em><div class="ic">${GII(it)}</div><span class="lb">${it.m ? esc(it.m) : 'Random'}</span><b>${esc(GIFTS[it.g].n)}</b></div>`));
  $id('pvWB').innerHTML = `<div class="pwin me wnew">${avP(pubName(), pubPhoto())}<div class="n"><b>${esc(pubName())}</b><small>You won! 🏆</small></div><div class="r"><b>${GEM}${fmt(tot)}</b><small>added to balance</small></div></div>
    <div class="pwl">Rewards</div><div class="pwg">${cards.join('')}</div>`;
  openM('pvWM'); hapN('success');
  const box = $id('pvWM').querySelector('.mbox'); box.classList.remove('wfx'); void box.offsetWidth; box.classList.add('wfx');
  setTimeout(() => burst($id('pvWB').querySelector('.pwin'), ['#fde047', '#a78bfa', '#34d399', '#38bdf8', '#f472b6'], 40), 250);
}
function pvWinner(w, pl, game) {
  if (!w) return;
  const tot = pl.reduce((s, p) => s + (+p.amt || 0), 0) || 1, ton = pl.reduce((s, p) => s + (+p.ton || 0), 0);
  const items = pl.flatMap(p => (p.gifts || []).filter(it => it && typeof it.g === 'number' && GIFTS[it.g]));
  $id('pvWG').textContent = 'Game #' + (game || PV.game || '');
  const cards = (ton > 0 ? [`<div class="pwr gram"><em>${fmt(ton)}${GEM}</em><div class="ic">${GEM.replace('class="gem"', 'class="gem" style="width:46px;height:46px"')}</div><span class="lb">${CUR} Prize</span><b>${CUR}</b></div>`] : [])
    .concat(items.map(it => `<div class="pwr" style="--rc:${TIER_C[tierOf(it.v)]}"><em>${fmt(it.v)}${GEM}</em><div class="ic">${GII(it)}</div><span class="lb">${it.m ? esc(it.m) : 'Random'}</span><b>${esc(GIFTS[it.g].n)}</b></div>`));
  $id('pvWB').innerHTML = `<div class="pwin ${w.me ? 'me' : ''}">${avP(w.name, w.photo)}<div class="n"><b>${esc(w.name)}</b><small>${w.me ? 'You won! 🏆' : 'Winner'}</small></div><div class="r"><b>${GEM}${fmt(tot)}</b><small>${(w.amt / tot * 100).toFixed(1)}% chance</small></div></div>
    <div class="pwl">Rewards</div><div class="pwg">${cards.join('') || `<div class="empty">—</div>`}</div>`;
  openM('pvWM');
}
const _pvSpin11 = pvSpin;
pvSpin = function (forced) {
  const pl = PV.pl.map(p => Object.assign({}, p)), game = PV.game;
  _pvSpin11(forced);
  const w = PV.winner;
  if (pl.some(p => p.me)) setTimeout(() => { if (cur === 'pvp') { const o = $id('resOv'); if (o && w && w.me) o.classList.remove('on'); pvWinner(w, pl, game) } }, 5700);
};
['gp2M', 'trM', 'infoM', 'pfM'].forEach(id => { const m = $id(id); if (m) m.classList.add('sheet2') });

// =====================================================================
//  HQ NFT: modellarning webp rasmi 128px — kattada xira. Vektor .tgs (Lottie) bilan almashtiramiz.
// =====================================================================
const HQ = { cache: {}, live: 0, MAX_LIVE: 8 };
async function tgsData(path) {
  if (HQ.cache[path]) return HQ.cache[path];
  HQ.cache[path] = (async () => {
    if (!window.DecompressionStream || !window.lottie) throw new Error('no-hq');
    for (const base of [ASSET, RAWB]) {
      try {
        const r = await fetch(base + path); if (!r.ok) continue;
        const txt = await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text();
        return JSON.parse(txt);
      } catch (e) {}
    }
    throw new Error('tgs not found');
  })();
  HQ.cache[path].catch(() => {});
  return HQ.cache[path];
}
async function hqImg(img) {
  if (img.dataset.hq) return; img.dataset.hq = 1;
  const m = (img.getAttribute('src') || '').match(/models\/([^/]+)\/([^/?]+)\.webp/); if (!m) return;
  const wrap = img.parentElement; if (!wrap || !wrap.isConnected) return;
  try {
    const data = await tgsData(`models/${m[1]}/${m[2]}.tgs`);
    if (!wrap.isConnected || !img.isConnected) return;
    const box = document.createElement('span'); box.className = 'lt'; wrap.appendChild(box);
    const animate = HQ.live < HQ.MAX_LIVE; if (animate) HQ.live++;
    const an = lottie.loadAnimation({ container: box, renderer: 'svg', loop: true, autoplay: animate, animationData: JSON.parse(JSON.stringify(data)), rendererSettings: { preserveAspectRatio: 'xMidYMid meet' } });
    an.addEventListener('DOMLoaded', () => { img.style.opacity = '0'; wrap.classList.remove('ld'); if (!animate) an.goToAndStop(0, true) });
    const mo = new MutationObserver(() => { if (!box.isConnected) { an.destroy(); if (animate) HQ.live--; mo.disconnect() } });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch (e) { /* webp qoladi */ }
}
let hqT = 0;
function hqScan() {
  clearTimeout(hqT);
  hqT = setTimeout(() => {
    $$('img.gim').forEach(img => { if (img.dataset.hq || !/\/models\//.test(img.getAttribute('src') || '')) return; const w = img.getBoundingClientRect().width; if (w >= 56) hqImg(img) });
  }, 120);
}
new MutationObserver(hqScan).observe(document.body, { childList: true, subtree: true });
window.RIKI_HQ = hqImg; { const im = $('#rkImg img'); if (im) hqImg(im) }
hqScan();

// Play Hub yutuqlari: TON o'rniga summaga mos NFT (eng qimmat ≤ yutuq); qoldiq balansga. NFT'dan arzon yutuq — balansga.
function payWin(w, game, quiet) {
  w = r2(w); if (w <= 0) return null;
  const nf = giftFor(w);
  if (!nf) { setBal(w); if (!quiet) toastG(`+${fmt(w)} ${CUR}`); return null }
  const it = addItem(nf.g, nf.p, null, nf.m, nf.ms);
  const rest = r2(w - nf.p); if (rest > 0) setBal(rest);
  toastG(`🎁 ${nf.g.n}${nf.m ? ' · ' + nf.m : ''} (${fmt(nf.p)}) → Backpack${rest > 0 ? ' · +' + fmt(rest) : ''}`);
  return it;
}
window.payWin = payWin;

// ---- Onlayn o'yinlar tarixi: har raundda kim qancha tikkan, kim nima yutgan
document.body.insertAdjacentHTML('beforeend', `<div class="modal sheet2" id="rdM"><div class="mbox"><div class="mhead"><div><b id="rdT"></b><small id="rdS"></small></div><button class="mx" data-close>✕</button></div><div class="mbody" id="rdB"></div></div></div>`);
const giftIt = x => { const g = GBS[x.sh] || GBN[x.n]; return g ? { g: g.i, v: +x.p || g.p, m: x.m || null, ms: x.ms || null } : null };
function liveHist(game) {
  const l = (game === 'pvp' ? S.pvHist : S.rlHist) || [];
  $id('pfT').textContent = game === 'pvp' ? 'PvP history' : 'Roulette history';
  $id('pfB').innerHTML = l.length ? l.map((h, i) => `<div class="lhr ${h.won ? 'won' : ''}" data-i="${i}">${avP(h.n, h.photo)}<div class="n"><b>${esc(h.n)} <em>won</em></b><small>${game === 'pvp' ? 'Game' : 'Roll'} #${h.id} · ${(h.pl || []).length} players · ${h.ch}%${h.me ? ' · you played' : ''}</small></div><div class="r"><b>${GEM}${fmt(h.tot)}</b><span class="gs">${(h.pl || []).flatMap(p => p.gifts || []).slice(0, 3).map(x => { const it = giftIt(x); return it ? GII(it) : '' }).join('')}</span></div><i class="ch">›</i></div>`).join('') : '<div class="empty">No games yet</div>';
  $$('#pfB .lhr').forEach(r => r.onclick = () => roundSheet(game, l[+r.dataset.i]));
  openM('pfM');
}
function roundSheet(game, h) {
  if (!h) return;
  const pl = [...(h.pl || [])].sort((a, b) => (b.uid === h.wuid) - (a.uid === h.wuid) || b.amt - a.amt), tot = h.tot || 1;
  $id('rdT').textContent = 'Winner'; $id('rdS').textContent = `${game === 'pvp' ? 'Game' : 'Roll'} #${h.id}`;
  const w = pl.find(p => p.uid === h.wuid) || { name: h.n, photo: h.photo, amt: 0 };
  const items = pl.flatMap(p => (p.gifts || []).map(giftIt).filter(Boolean));
  const cards = (h.ton > 0 ? [`<div class="pwr gram"><em>${fmt(h.ton)}${GEM}</em><div class="ic">${GEM.replace('class="gem"', 'class="gem" style="width:46px;height:46px"')}</div><span class="lb">${CUR} Prize</span><b>${CUR}</b></div>`] : [])
    .concat(items.map(it => `<div class="pwr" style="--rc:${TIER_C[tierOf(it.v)]}"><em>${fmt(it.v)}${GEM}</em><div class="ic">${GII(it)}</div><span class="lb">${it.m ? esc(it.m) : 'Random'}</span><b>${esc(GIFTS[it.g].n)}</b></div>`));
  const rows = pl.map(p => { const win = p.uid === h.wuid; return `<div class="rdr ${win ? 'w' : ''} ${isMe(p.uid) ? 'me' : ''}">${avP(p.name, p.photo)}<div class="n"><b>${esc(p.name)}${p.bot ? ' <span class="bt">BOT</span>' : ''}${isMe(p.uid) ? ' <span class="bt you">YOU</span>' : ''}</b><small>${(p.amt / tot * 100).toFixed(1)}% chance</small></div><span class="gs">${(p.gifts || []).slice(0, 3).map(x => { const it = giftIt(x); return it ? GII(it) : '' }).join('')}</span><span class="bt2">${GEM}${fmt(p.amt)}</span><span class="rs ${win ? 'g' : 'r'}">${win ? '+' + fmt(tot - p.amt) : '−' + fmt(p.amt)}</span></div>` }).join('');
  $id('rdB').innerHTML = `<div class="pwin ${isMe(w.uid) ? 'me' : ''}">${avP(w.name, w.photo)}<div class="n"><b>${esc(w.name)}</b><small>Winner 🏆</small></div><div class="r"><b>${GEM}${fmt(tot)}</b><small>${h.ch}% chance</small></div></div>
    <div class="pwl">Rewards</div><div class="pwg">${cards.join('') || '<div class="empty">—</div>'}</div>
    <div class="pwl">Players <small style="color:#8b8b95;font-weight:600">${pl.length}</small></div>${rows || '<div class="empty">No player data</div>'}`;
  openM('rdM');
}

// =====================================================================
//  Rocket: raketa o'rniga NFT uchadi — tikilgan summa × koeffitsiyentga mos NFT, tez almashadi
// =====================================================================
stage.insertAdjacentHTML('beforeend', `<div id="rkTag"><b id="rtName"></b><span><i id="rtBet"></i><em id="rtVal"></em></span></div>`);
const RW = { key: '', t: 0 }, RW_PRE = new Set();
function rwSrc() { // kimning tikishi: avval o'zimniki, bo'lmasa eng katta faol tikish
  if (RK.my && !RK.my.out) return { b: RK.my, me: true };
  const act = RK.bets.filter(x => !x.out).sort((x, y) => y.amt - x.amt)[0];
  return act ? { b: act, me: false } : null;
}
const _rkD12 = rkDraw;
rkDraw = function (now) {
  _rkD12(now);
  const img = $id('rkImg'), tag = $id('rkTag');
  const src = RK.phase === 'fly' ? rwSrc() : null;
  if (!src) {
    tag.classList.remove('on');
    if (RW.key) { RW.key = ''; img.classList.remove('nft'); if (RKV.rkGift) img.innerHTML = GIM(RKV.rkGift, RKV.rkModel).replace(/loading="lazy"/g, '') }
    return;
  }
  const val = src.b.amt * RK.m, nf = giftFor(val);
  if (!nf) { tag.classList.remove('on'); return }
  const key = nf.g.i + ':' + (nf.m || '');
  if (key !== RW.key && now - RW.t > 140) {
    RW.key = key; RW.t = now;
    img.innerHTML = GIM(nf.g, nf.ms).replace(/loading="lazy"/g, ''); img.classList.add('nft');
    img.style.setProperty('--rwc', TIER_C[tierOf(nf.p)]);
    img.classList.remove('pop'); void img.offsetWidth; img.classList.add('pop');
    $id('rtName').textContent = nf.g.n + (nf.m ? ' · ' + nf.m : '');
    const k = NFTS.indexOf(nf); // keyingi NFT rasmlarini oldindan yuklash
    for (let j = k + 1; j < Math.min(NFTS.length, k + 6); j++) { const u = (GIM(NFTS[j].g, NFTS[j].ms).match(/src="([^"]+)"/) || [])[1]; if (u && !RW_PRE.has(u)) { RW_PRE.add(u); const x = new Image(); x.src = u } }
  }
  // raketa emas — NFT tekis uchadi (aylanmaydi)
  const sz = parseFloat(img.style.width) || 100, H = RKV.H, W = RKV.W, cyc = H * .44, bob = Math.sin(now / 230) * 5, sw = Math.sin(now / 610) * 6;
  img.style.transform = `translate(${W / 2 - sz / 2 + sw}px,${cyc - sz / 2 + bob - 10}px) scale(${1 + Math.sin(now / 300) * .03})`;
  $id('rtBet').innerHTML = (src.me ? 'Your bet ' : esc(src.b.name) + ' ') + g$(src.b.amt) + ` <b class="rtm">×${RK.m.toFixed(2)}</b> =`;
  $id('rtVal').innerHTML = g$(val);
  tag.style.top = (cyc + sz / 2 - 6) + 'px'; tag.classList.add('on');
};
Object.assign(window, { RIKI_STAKE: (g, ton, items, ex) => liveStake(g, ton, items, ex), winSheet, offSync, M2, m2Pick, u2Render, c2Render, NET, pushStats, pullFeed, balModal });
})();

