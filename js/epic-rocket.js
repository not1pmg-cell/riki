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
const T = { cnt: 5000, boom: [170, 330, 830], txtOn: 996, txtOff: 99999 };   // 409.mp4: raqam portlashdan 996 ms keyin, keyingi raundgacha turadi
// portlash — 17 ta PNG kadr (409.mp4 643.548 s dan), har biri shu ms da almashadi
const BOOM_T = [0, 55, 96, 139, 179, 217, 242, 280, 305, 345, 384, 425, 465, 493, 536, 575, 646], BOOM_END = 690;
const BOOM_IMG = BOOM_T.map((_, k) => { const im = new Image(); im.src = `assets/rocket/boom_${String(k).padStart(2, '0')}.png`; return im });
const COUNT_COL = { 5: '#5fa3f6', 4: '#32d196', 3: '#f9bd23', 2: '#f77115', 1: '#ec4345' };   // 409.mp4 635.5–638.5 s
const TRAIL_FLY = '#ded147', TRAIL_CRASH = '#d44242';   // crash: 408.mp4 353.3 s
const Y0 = 312.7 - 56;   // iz y (ekranda 312.7 px; sahna ekran tepasidan 56 px pastda)
// iz rangi — ko'paytiruvchiga qarab silliq (409.mp4 641.1–643.5 s; 408.mp4 346–352 s)
const TC = [[1, [0x2d, 0x84, 0x63]], [1.3, [0x28, 0x93, 0x7b]], [1.5, [0x2d, 0x8f, 0xa2]], [1.86, [0x31, 0x86, 0xc5]], [4, [0x60, 0x67, 0xe5]], [5.2, [0x7e, 0x56, 0xdf]], [6.2, [0x94, 0x61, 0xa8]], [7.7, [0xa7, 0x6c, 0x68]]];
function trailCol(m) { let j = 1; while (j < TC.length - 1 && TC[j][0] < m) j++; const [m0, c0] = TC[j - 1], [m1, c1] = TC[j], k = Math.max(0, Math.min(1, (m - m0) / (m1 - m0))); return '#' + c0.map((v, i) => Math.round(v + (c1[i] - v) * k).toString(16).padStart(2, '0')).join('') }
const TRAIL_COL = { red: '#c93346', grn: '#2fbf71', blu: '#4874e6', pur: '#9b5de5', yel: '#ded147' };   // grn/blu: 409.mp4 10:55/10:59; yel: desktop 80x; pur: chip rangidan (UNCLEAR)
const W = 390, H = 300;
const P0 = [0, 218], PC = [230, 210], P2 = [W, 125];          // iz egri chizig'i (31, 36 kadrlar)
const bz = t => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * PC[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * PC[1] + t * t * P2[1]];
const chipCls = m => m < 1.2 ? 'red' : m < 2 ? 'grn' : m < 5 ? 'blu' : m < 10 ? 'pur' : 'yel';   // 408/409.mp4: 1.08 qizil, 1.20/1.52 yashil, 2.21/2.56/3.11 ko'k, 5.31/9.04 binafsha, 10.0/39.0 sariq
const txtCol = m => m < 10 ? '#4181ef' : '#ec9e12';      // 1.48x → #4181ef, 80.03x → #ec9e12 (UNCLEAR: oraliq chegaralar)
const chipTxt = m => (m >= 10 ? m.toFixed(1) : m.toFixed(2)) + 'x';   // "11.3x", "3.11x"

const stage = document.getElementById('rkStage');
if (!stage) return;
stage.insertAdjacentHTML('beforeend', `<div id="erk"><canvas id="erkCv"></canvas><div id="erkG" class="off"></div>
  <div id="erkC"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="47.9" fill="none" stroke="#403630" stroke-width="4.25"/><circle id="erkA" cx="50" cy="50" r="47.9" fill="none" stroke-width="4.25" stroke-linecap="round" stroke-dasharray="301" stroke-dashoffset="0"/></svg><b id="erkN">5</b><i class="halo"></i></div>
  <div id="erkT"></div><div id="erkH"></div></div>`);
const cv = document.getElementById('erkCv'), cx = cv.getContext('2d');
const G = document.getElementById('erkG'), C = document.getElementById('erkC'), A = document.getElementById('erkA'), N = document.getElementById('erkN'), TX = document.getElementById('erkT'), HI = document.getElementById('erkH');
const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr;

// yulduzlar (pastel nuqtalar)
const STAR_C = ['#cdb6ea', '#e9d3b8', '#ffffff', '#b9a3e3', '#d8c4f0'];
const stars = Array.from({ length: 12 }, () => ({ x: Math.random() * W, y: Math.random() * (H - 50), r: 2 + Math.random() * 2.5, c: STAR_C[Math.floor(Math.random() * STAR_C.length)] }));

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
    const left = Math.max(0, (RK.waitEnd - now) / 1000), n = Math.min(5, Math.max(1, Math.ceil(left))), col = COUNT_COL[n];   // 409.mp4 634.61/635.67/636.61/637.67 → 638.61: har raqam 1000 ms
    if (N.textContent != n) { C.classList.remove('pop'); void C.offsetWidth; C.classList.add('pop') } C.classList.add('on'); C.style.setProperty('--cc', col); A.style.stroke = col; A.style.strokeDashoffset = 301 * (1 - Math.max(0, left - (n - 1))); N.textContent = n;   // yoy har raqamda to'ladi va 1 s da soat yo'nalishida bo'shaydi
    G.classList.add('off'); TX.classList.remove('on');
    return;
  }
  C.classList.remove('on');
  // iz — o'lchangan: chapdan y=313, uchi x = 21.6 + 18.3·(t−1.38)^1.06; x>60 dan keyin y = 312.8 − 4.61e-9·(x−60)^4.55 (408.mp4 7.95x kadri)
  const crashed = ph === 'crash';
  const m = crashed ? RK.crash : RK.m;
  const col = crashed ? TRAIL_CRASH : trailCol(m);
  const tf = Math.max(0, ((crashed ? RK.crashAt : now) - RK.t0) / 1000);
  const tx = Math.min(W - 6, 21.6 + 18.3 * Math.pow(Math.max(0, tf - 1.38), 1.06));   // 408.mp4 5:37–5:47 + 409.mp4 10:39–10:43, xato ≈1.7 px
  const yAt = x => Y0 - 4.61e-9 * Math.pow(Math.max(0, x - 60), 4.55);
  cx.lineCap = 'round'; cx.strokeStyle = col; cx.lineWidth = 7.3; cx.shadowColor = col; cx.shadowBlur = 9;
  cx.beginPath(); cx.moveTo(17, yAt(17)); for (let x = 20; x <= tx; x += 3) cx.lineTo(x, yAt(x)); cx.lineTo(tx, yAt(tx)); cx.stroke();
  if (!crashed) { cx.shadowColor = '#fff'; cx.shadowBlur = 12; cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(tx, yAt(tx), 5, 0, 7); cx.fill() }
  cx.shadowBlur = 0;
  tipX = 196; tipY = 179;   // sovg'a markazi: ekranda (196, 236) — 409.mp4 643.4 s
  if (!crashed) {
    const g = RK.my && !RK.my.out && typeof giftFor === 'function' ? (giftFor(RK.my.amt * RK.m) || {}).g || roundGift : roundGift;
    setGift(g); G.classList.remove('off');
    const bob = Math.sin(now / 230) * 3;
    G.style.transform = `translate(${tipX - 56}px,${tipY - 56 + bob}px)`;
    TX.classList.remove('on');
  } else {
    G.classList.add('off');
    const e = now - boomAt;
    boom(e, tipX, tipY);
    TX.classList.toggle('on', e >= T.txtOn && e < T.txtOff);
    TX.textContent = RK.crash.toFixed(2) + 'x'; TX.style.color = txtCol(RK.crash);
  }
}
function boom(e, x, y) {
  if (e >= BOOM_END) return; let k = 0; while (k < BOOM_T.length - 1 && BOOM_T[k + 1] <= e) k++;
  const im = BOOM_IMG[k]; if (!im.complete) return;
  // sprite 210×210 px kadr (588 px video) → 139 px (390 px); markaz = sovg'a markazi
  cx.drawImage(im, x - 70, y - 70, 139.3, 139.3);
}
// ro'yxat, chiplar, tugma
let listAt = 0;
function ui(now) {
  if (now - listAt < 200) return; listAt = now;
  const first = RK.phase === 'crash' ? '' : RK.phase === 'fly' ? `<span class="${chipCls(RK.m)} live">${chipTxt(RK.m)}</span>` : RK.phase === 'wait' ? `<span class="bet">BET</span>` : '';   // 409.mp4 10:26 "BET", 408.mp4 4:56 jonli chip
  HI.innerHTML = first + (RK.hist || []).slice(0, 12).map(m => `<span class="${chipCls(m)}">${chipTxt(m)}</span>`).join('');
  const L = document.getElementById('rkPl');
  const bets = [...RK.bets].sort((a, b) => (b.me ? 1 : 0) - (a.me ? 1 : 0) || b.amt - a.amt);
  if (!bets.length) L.innerHTML = `<div class="none"><i><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.6"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M15.5 4.6a3.6 3.6 0 0 1 0 6.8M21.5 20c0-2.8-1.6-4.8-4-5.6"/></svg></i><b>No players yet</b><small>Wait for next round</small><em>•••</em></div>`;
  else {
    const rows = bets.slice(0, 5).map(b => {
      const lose = RK.phase === 'crash' && !b.out, m = b.out || (RK.phase === 'fly' ? RK.m : RK.phase === 'crash' ? RK.crash : 1);
      const val = b.out ? b.amt * b.out : lose ? b.amt : b.amt * m;
      const gg = typeof giftFor === 'function' ? (giftFor(val) || {}).g : null;
      return `<div class="er ${b.out ? 'w' : lose ? 'l' : ''}">${avHTML(b.name)}<div class="nm"><b>${esc(b.name)}${b.bot ? ' <span class="bt">BOT</span>' : ''}</b><small>${GEM}${fmt(b.amt)} ×${m.toFixed(2)}</small></div><span class="v">${GEM}${fmt(val)}</span><span class="gt">${gg ? GI(gg) : ''}</span></div>`;
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
