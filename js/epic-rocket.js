// =====================================================================
//  ROCKET — Epic videosidan 1:1 (spec.md). O'yin mantig'i (RK, tikish, server) o'zgarmaydi,
//  faqat ko'rinish va vaqtlar shu fayldan.
//  O'lchangan vaqtlar (B video, 30 fps):
//    sanoq: har raqam 1000 ms (5→1), 1 dan 1000 ms keyin uchish
//    portlash: 0–170 ms olov yulduz, 170–330 ms oq-oltin yulduz, 330–830 ms oltin halqa (d 61→94 px) so'nadi
//    crash yozuvi: portlashdan 1100 ms keyin chiqadi, 1550 ms turadi
//    iz: uchishda #ded147 (7.5 px), crashda #c93346 (6.2 px)
// =====================================================================
(function () {
'use strict';
const T = { cnt: 5000, boom: [170, 330, 830], txtOn: 1100, txtOff: 2650 };
const COUNT_COL = { 5: '#65a5f4', 4: '#41e49b', 3: '#ecc32e', 2: '#eb6c1b', 1: '#de3243' };
const TRAIL_FLY = '#ded147', TRAIL_CRASH = '#c93346';
const W = 390, H = 300;
const P0 = [0, 218], PC = [230, 210], P2 = [W, 125];          // iz egri chizig'i (31, 36 kadrlar)
const bz = t => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * PC[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * PC[1] + t * t * P2[1]];
const chipCls = m => m < 1.2 ? 'red' : m < 2 ? 'grn' : m < 5 ? 'blu' : m < 10 ? 'pur' : 'yel';
const txtCol = m => m < 10 ? '#4181ef' : '#ec9e12';      // 1.48x → #4181ef, 80.03x → #ec9e12 (UNCLEAR: oraliq chegaralar)
const chipTxt = m => (m >= 10 ? m.toFixed(1) : m.toFixed(2)) + 'x';   // "11.3x", "3.11x"

const stage = document.getElementById('rkStage');
if (!stage) return;
stage.insertAdjacentHTML('beforeend', `<div id="erk"><canvas id="erkCv"></canvas><div id="erkG" class="off"></div>
  <div id="erkC"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="#2b2b2b" stroke-width="5"/><circle id="erkA" cx="50" cy="50" r="46" fill="none" stroke-width="5" stroke-linecap="round" stroke-dasharray="289" stroke-dashoffset="0"/></svg><b id="erkN">5</b></div>
  <div id="erkT"></div><div id="erkH"></div></div>`);
const cv = document.getElementById('erkCv'), cx = cv.getContext('2d');
const G = document.getElementById('erkG'), C = document.getElementById('erkC'), A = document.getElementById('erkA'), N = document.getElementById('erkN'), TX = document.getElementById('erkT'), HI = document.getElementById('erkH');
const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr;

// yulduzlar (pastel nuqtalar)
const STAR_C = ['#cdb6ea', '#e9d3b8', '#ffffff', '#b9a3e3', '#d8c4f0'];
const stars = Array.from({ length: 26 }, () => ({ x: Math.random() * W, y: Math.random() * (H - 50), r: 2 + Math.random() * 2.5, c: STAR_C[Math.floor(Math.random() * STAR_C.length)] }));

let roundGift = null, lastRound = -1, lastPhase = '', boomAt = 0, tipX = 200, tipY = 144;
function pickGift() { const pool = (typeof GIFTS !== 'undefined' ? GIFTS : []).filter(g => g && g.p > 3); return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null }
function setGift(g) { if (!g || G._g === g) return; G._g = g; G.innerHTML = GI(g).replace(/loading="lazy"/g, '') }

function draw(now) {
  if (cur !== 'rocket') return;
  const ph = RK.phase;
  if (RK.round !== lastRound) { lastRound = RK.round; roundGift = pickGift() }
  if (ph === 'crash' && lastPhase !== 'crash') boomAt = now;
  lastPhase = ph;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
  // yulduzlar: uchishda chapga suriladi
  const sp = ph === 'fly' ? 1.1 : .15;
  stars.forEach(s => { s.x -= sp; if (s.x < -6) { s.x = W + 6; s.y = Math.random() * (H - 50) } cx.fillStyle = s.c; cx.globalAlpha = .85; cx.beginPath(); cx.ellipse(s.x, s.y, s.r * .75, s.r * (ph === 'fly' ? 1.5 : 1), 0, 0, 7); cx.fill() });
  cx.globalAlpha = 1;
  // sanoq
  if (ph === 'wait') {
    const left = Math.max(0, (RK.waitEnd - now) / 1000), n = Math.min(5, Math.max(1, Math.ceil(left))), col = COUNT_COL[n];
    C.classList.add('on'); C.style.setProperty('--cc', col); A.style.stroke = col; A.style.strokeDashoffset = 289 * (1 - Math.min(1, left / 5)); N.textContent = n;
    G.classList.add('off'); TX.classList.remove('on');
    return;
  }
  C.classList.remove('on');
  // iz
  const crashed = ph === 'crash';
  const tf = crashed ? (RK.crashAt - RK.t0) / 1000 : (now - RK.t0) / 1000;
  const grow = Math.min(1, 1 - Math.pow(1 - Math.min(1, tf / 1.2), 3));   // UNCLEAR: iz o'sishi videoda ko'rinmaydi
  const col = crashed ? TRAIL_CRASH : TRAIL_FLY;
  cx.lineCap = 'round'; cx.strokeStyle = col; cx.lineWidth = crashed ? 6.2 : 7.5; cx.shadowColor = col; cx.shadowBlur = 14;
  cx.beginPath(); cx.moveTo(P0[0], P0[1]);
  for (let i = 1; i <= 40; i++) { const p = bz(i / 40 * grow); cx.lineTo(p[0], p[1]) }
  cx.stroke(); cx.shadowBlur = 0;
  // sovg'a — iz ustida, markazda
  const tp = bz(Math.min(grow, .52)); tipX = tp[0]; tipY = tp[1] - 34;
  if (!crashed) {
    const g = RK.my && !RK.my.out && typeof giftFor === 'function' ? (giftFor(RK.my.amt * RK.m) || {}).g || roundGift : roundGift;
    setGift(g); G.classList.remove('off');
    const bob = Math.sin(now / 230) * 3;
    G.style.transform = `translate(${tipX - 36}px,${tipY - 36 + bob}px)`;
    TX.classList.remove('on');
  } else {
    G.classList.add('off');
    const e = now - boomAt;
    if (e < T.boom[2]) boom(e, tipX, tipY);
    TX.classList.toggle('on', e >= T.txtOn && e < T.txtOff);
    TX.textContent = RK.crash.toFixed(2) + 'x'; TX.style.color = txtCol(RK.crash);
  }
}
function star(x, y, rO, rI, n, fill) { cx.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? rI : rO, a = i * Math.PI / n - Math.PI / 2; cx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) } cx.closePath(); cx.fillStyle = fill; cx.fill() }
function boom(e, x, y) {
  if (e < T.boom[0]) {                                   // 1) olov yulduz
    const k = e / T.boom[0], r = 22 + 14 * k;
    star(x, y, r, r * .45, 10, '#f0452e'); star(x, y, r * .7, r * .3, 10, '#f99a1c'); star(x, y, r * .35, r * .15, 8, '#ffe36a');
  } else if (e < T.boom[1]) {                            // 2) oq-oltin yulduz
    const r = 28; star(x, y, r, r * .35, 12, '#f4c34a'); star(x, y, r * .62, r * .25, 12, '#fff6d6');
  } else {                                               // 3) oltin halqa, d 61 → 94, so'nadi
    const k = (e - T.boom[1]) / (T.boom[2] - T.boom[1]), r = (61 + 33 * k) / 2;
    cx.globalAlpha = 1 - k; cx.strokeStyle = '#f5c84c'; cx.lineWidth = 2.5; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.stroke();
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; cx.beginPath(); cx.moveTo(x + Math.cos(a) * (r + 2), y + Math.sin(a) * (r + 2)); cx.lineTo(x + Math.cos(a) * (r + 7), y + Math.sin(a) * (r + 7)); cx.stroke() }
    cx.globalAlpha = 1;
  }
}
// ro'yxat, chiplar, tugma
let listAt = 0;
function ui(now) {
  if (now - listAt < 200) return; listAt = now;
  HI.innerHTML = (RK.hist || []).slice(0, 12).map(m => `<span class="${chipCls(m)}">${chipTxt(m)}</span>`).join('');
  const L = document.getElementById('rkPl');
  const bets = [...RK.bets].sort((a, b) => (b.me ? 1 : 0) - (a.me ? 1 : 0) || b.amt - a.amt);
  if (!bets.length) L.innerHTML = `<div class="none"><i><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.6"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M15.5 4.6a3.6 3.6 0 0 1 0 6.8M21.5 20c0-2.8-1.6-4.8-4-5.6"/></svg></i><b>No players yet</b><small>Wait for next round</small><em>•••</em></div>`;
  else {
    const rows = bets.slice(0, 5).map(b => {
      const lose = RK.phase === 'crash' && !b.out, m = b.out || (RK.phase === 'fly' ? RK.m : RK.phase === 'crash' ? RK.crash : 1);
      const val = b.out ? b.amt * b.out : lose ? b.amt : b.amt * m;
      return `<div class="er ${b.out ? 'w' : lose ? 'l' : ''}">${avHTML(b.name)}<div class="nm"><b>${esc(b.name)}</b><small>${GEM}${fmt(b.amt)} ×${m.toFixed(2)}</small></div><span class="v">${GEM}${fmt(val)}</span></div>`;
    }).join('');
    L.innerHTML = rows + (bets.length > 5 ? `<div class="more">+${bets.length - 5} more players</div>` : '');
  }
  const B = document.getElementById('rkBtn');
  let cls = '', txt = 'Place bet';
  if (RK.next && RK.phase !== 'wait') { cls = 'e-grey'; txt = 'Cancel Bet' }
  else if (RK.my && !RK.my.out && RK.phase === 'fly') { cls = 'e-cash'; txt = 'Cash Out' }
  else if (RK.my && !RK.my.out && RK.phase === 'wait') { cls = 'e-grey'; txt = 'Waiting' }
  B.className = 'bigbtn ' + cls; if (B.textContent !== txt) B.textContent = txt;
}
(function loop(now) { if (cur === 'rocket') { draw(now); ui(now) } requestAnimationFrame(loop) })(performance.now());
// sarlavha: Rocket ekranida body.e-rk
const _go = window.go;
window.go = go = function (id, np) { _go(id, np); document.body.classList.toggle('e-rk', id === 'rocket'); document.body.dataset.cur = id };
document.body.dataset.cur = typeof cur !== 'undefined' ? cur : 'home';
})();
