// =====================================================================
//  RACE — Epic "Race" 1:1 (Screen_Recording_2026-11-27_145037.mp4)
//  Natija serverda betting tugashi bilan aniqlanadi (HMAC-SHA256, rejection sampling) — animatsiya shu tartibdan
//  deterministik quriladi. O'lchovlar: desktop px × 0.784 → telefon css; vaqtlar kadrma-kadr (30 fps).
// =====================================================================
(function () {
const $id = id => document.getElementById(id);
const RC_N = ['Plush Pepe', 'Resistance Dog', 'Scared Cat', 'Kissed Frog', 'Jolly Chimp', 'Snoop Dogg'];
const RC_S = ['Pepe', 'Dog', 'Cat', 'Frog', 'Chimp', 'Snoop'];
const RC_K = ['pepe', 'dog', 'cat', 'frog', 'chimp', 'snoop'];
const RC_SLUG = ['plush_pepe', 'resistance_dog', 'scared_cat', 'kissed_frog', 'jolly_chimp', 'snoop_dogg'];
// koeffitsiyent ranglari (r_012 kartalardan o'lchangan)
const RC_C = ['#ebbd3d', '#e3335a', '#7f62d5', '#40abff', '#3dcf69', '#98adc0'];
// iz ranglari (f_0215: o'rta nuqta)
const RC_T = ['#c7a33c', '#c53050', '#6e52b5', '#3b94d4', '#3ab85e', '#8598ad'];
const PLACE = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
// Lider progressi (GO dan, s) — f_0001..0270 "Leader %" chizig'i o'lchovi; g'olib 7.75 s da marradan o'tadi
const LEAD = [[0, 0], [.5, .02], [1, .08], [1.5, .18], [2.1, .26], [2.7, .33], [3.9, .49], [4.3, .55], [5.5, .72], [5.9, .81], [6.3, .87], [6.5, .92], [7.1, .95], [7.75, 1], [10.1, 1.12]];
const T_GO = .1, T_FINAL = 5.75, T_PHOTO = 6.5, T_WIN = 7.75;   // "Final stretch" 29.75, "Photo finish" 30.5, g'olib pufagi 31.75 (GO = 24.0)
const RC = { d: null, sel: -1, mode: 'coin', raf: 0, seenRes: 0, lastBet: null, histTab: 'all', anim: null, pollT: 0 };
window.RC = RC;
const lerpTab = (tab, t) => { if (t <= tab[0][0]) return tab[0][1]; for (let i = 1; i < tab.length; i++) if (t <= tab[i][0]) { const [a, va] = tab[i - 1], [b, vb] = tab[i]; return va + (vb - va) * (t - a) / (b - a) } return tab[tab.length - 1][1] };
const imgR = i => `${ASSET}webp/by_name/${RC_SLUG[i]}.webp`;
const runImg = (i, cls = '') => `<img class="rcimg ${cls}" src="${imgR(i)}" onerror="this.onerror=null;this.src='assets/race/run_${RC_K[i]}.png'" alt="">`;
const gem = '<img class="rgem" src="assets/ui/ic_gem_sm.png" alt="">';
const fmtA = v => { const n = Math.round(v * 100) / 100; return String(n) };
const chances = k => { const w = k.map(x => Math.round(1e6 / x)), T = w.reduce((a, b) => a + b, 0); return w.map(x => x / T * 100) };

function rcHTML() {
  $id('race').innerHTML = `
  <div class="rtrack" id="rTrack"><img class="rban" id="rBan" src="assets/race/banner_forest.png" alt="">
    <div class="rst"><span class="rpill" id="rSt"><i></i><b>Betting Open</b></span><span class="rid" id="rId">#—</span></div>
    <div class="rbub" id="rBub"></div>
    <div class="rlanes" id="rLanes">${RC_N.map((n, i) => `<div class="rln" data-i="${i}"><div class="rlb" id="rLb${i}"></div><div class="rtr" id="rTr${i}"></div><div class="rrun" id="rRun${i}">${runImg(i)}<img class="rcrown" src="assets/race/crown.png" alt=""></div></div>`).join('')}
      <i class="rstart" id="rStart"></i><img class="rfin" id="rFin" src="assets/race/finish.png" alt="">
      <div class="rring" id="rRing"><svg viewBox="0 0 66 66"><circle cx="33" cy="33" r="31" fill="#29233a"/><circle cx="33" cy="33" r="26.5" fill="#14121e"/><circle id="rArc" cx="33" cy="33" r="26.5" fill="none" stroke="#9a6cfb" stroke-width="5.5" stroke-linecap="round" stroke-dasharray="166.5" transform="rotate(-90 33 33)"/></svg><b id="rSec">12</b><small>SEC</small></div>
      <b class="rbig" id="rBig"></b><img class="rgo" id="rGo" src="assets/race/go.png" alt="">
      <div class="rwin" id="rWin"></div>
    </div></div>
  <div class="rinfo" id="rInfo"></div>
  <div class="rcards" id="rCards">${RC_N.map((n, i) => `<button class="rcard" data-i="${i}"><span class="rpl" id="rPl${i}"></span><img class="rart" src="assets/race/card_${RC_K[i]}.png" alt=""><b>${n}</b><span class="rk"><em style="color:${RC_C[i]}" id="rK${i}">—</em><small id="rP${i}"></small></span><span class="ra">${gem}<i id="rA${i}">0</i></span></button>`).join('')}</div>
  <div class="dock rdock"><div class="brow"><div class="tog rtog"><button data-m="gift"><img class="tgi" src="assets/ui/ic_gift_tog.png" alt=""></button><button data-m="coin" class="on"><img class="tgk" src="assets/ui/ic_gem_pill.png" alt=""></button></div><div class="inp"><input id="rAmt" type="number" inputmode="decimal" placeholder="${CUR} amount" step="0.01"><img class="tgs" src="assets/ui/ic_gem_sm.png" alt=""></div></div>
    <button class="rgo2" id="rBtn"><b>Select a racer above</b><small></small></button></div>`;
  $$('#rCards .rcard').forEach(b => b.onclick = () => { RC.sel = +b.dataset.i; hap(); rcStatic(); });
  $$('#race .rtog button').forEach(b => b.onclick = () => { if (b.dataset.m === 'gift') return rcGiftSheet(); });
  $id('rAmt').oninput = rcStatic;
  $id('rBtn').onclick = rcBet;
}

// ---- server holati
async function rcPull() {
  if (cur !== 'race') return;
  try { const d = await lvPull('race'); rcSet(d) } catch (e) { if (!RC.d) rcSet(null) }
  clearTimeout(RC.pollT); RC.pollT = setTimeout(rcPull, RC.d && RC.d.phase === 'race' ? 1500 : 800);
}
function rcSet(d) {
  const prev = RC.d; RC.d = d;
  if (!d) { $id('rId').textContent = '#—'; rcStatic(); return }
  if (prev && prev.id !== d.id) { RC.anim = null; $id('rBan').src = `assets/race/banner_${d.theme === 'city' ? 'city' : 'forest'}.png` }
  if (!prev) $id('rBan').src = `assets/race/banner_${d.theme === 'city' ? 'city' : 'forest'}.png`;
  $id('rId').textContent = '#' + d.id;
  if (d.phase !== 'wait') $id('rBub').classList.remove('on');
  const last = (d.bets || []).slice(-1)[0];
  if (d.phase === 'wait' && last && (!RC.lastBet || RC.lastBet !== last.uid + ':' + last.amt + ':' + (d.bets.length))) { RC.lastBet = last.uid + ':' + last.amt + ':' + d.bets.length; rcBubble(last) }
  if (d.phase !== 'wait' && d.order && !RC.anim) RC.anim = rcPlan(d);
  if (d.phase === 'done' && RC.seenRes !== d.id) { RC.seenRes = d.id; setTimeout(() => { if (RC.d && RC.d.id === d.id) rcResult(d) }, 650) }
  rcStatic();
}
const rcT = () => { const d = RC.d; return d ? srvNow() : Date.now() };

// ---- deterministik poyga rejasi (marra tartibidan)
function rcPlan(d) {
  const order = d.order, rank = []; order.forEach((r, k) => rank[r] = k);
  let s = 0; for (const ch of (d.rid || 'x')) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const G = [0, .012, .026, .041, .057, .076];
  const wob = RC_N.map(() => [0, 1, 2].map(() => ({ a: .012 + rnd() * .022, f: .5 + rnd() * 1.1, p: rnd() * 6.28 })));
  return { rank, G, wob, t0: d.raceAt };
}
function rcProg(i, t, A) {   // t — GO dan beri soniya
  const L = lerpTab(LEAD, t), fade = t < 1 ? t : t > T_PHOTO ? 0 : t > 5 ? (T_PHOTO - t) / 1.5 : 1;
  let w = 0; for (const o of A.wob[i]) w += o.a * Math.sin(o.f * t + o.p);
  const g = A.G[A.rank[i]] * Math.min(1, t / T_PHOTO + .25);
  return L - g + w * fade * .55;
}

// ---- har kadr (60 fps, transform/opacity)
function rcFrame() {
  RC.raf = requestAnimationFrame(rcFrame);
  if (cur !== 'race') return;
  const d = RC.d, now = rcT();
  const W = $id('rLanes').clientWidth;
  if (!d) return;
  const ring = $id('rRing'), big = $id('rBig'), goI = $id('rGo');
  if (d.phase === 'wait') {
    const left = Math.max(0, (d.endAt - now) / 1000), n = Math.ceil(left);
    ring.style.opacity = left > 3 ? 1 : 0;
    $id('rSec').textContent = n; $id('rArc').style.strokeDashoffset = 166.5 * (1 - left / (d.bettingMs / 1000));
    // katta 3-2-1: har biri 0.7 s, 1.0 → 0.75 masshtab, oxirida so'nadi (20.83–21.55 s o'lchovi)
    if (left <= 3 && left > 0) { const ph = 1 - (left - Math.floor(left)); const k = ph < .07 ? 1 : 1 - .25 * Math.min(1, (ph - .07) / .63); big.textContent = n; big.style.opacity = ph < .7 ? 1 : Math.max(0, 1 - (ph - .7) / .05); big.style.transform = `translate(-50%,-50%) scale(${k})` } else big.style.opacity = 0;
    goI.style.opacity = 0;
    RC_N.forEach((_, i) => { $id('rRun' + i).style.transform = `translateX(${W * .235}px)`; $id('rTr' + i).style.opacity = 0; $id('rRun' + i).classList.remove('lead') });
    $id('rStart').style.transform = 'translateX(0)'; $id('rFin').style.opacity = 0; $id('rLanes').style.backgroundPositionX = '0px';
    $id('rWin').classList.remove('on');
    return;
  }
  ring.style.opacity = 0; big.style.opacity = 0;
  const A = RC.anim || (RC.anim = d.order ? rcPlan(d) : null); if (!A) return;
  const t = (now - d.raceAt) / 1000 - T_GO;
  // GO! (24.10–24.50: masshtab 0.72→1.0, shaffoflik cho'qqisi 24.27)
  if (t > -.03 && t < .43) { const p = (t + .03) / .46; goI.style.opacity = p < .4 ? p / .4 : Math.max(0, 1 - (p - .4) / .6); goI.style.transform = `translate(-50%,-50%) scale(${.72 + .28 * Math.min(1, p / .6)})` } else goI.style.opacity = 0;
  const tt = Math.max(0, t), L = lerpTab(LEAD, tt);
  // kamera: start 23.5% → 0.9 s da 57.6%; photo finish (6.3 s dan) — marra 96% ga, kamera to'xtaydi
  const camX = tt < .9 ? .235 + (.576 - .235) * (1 - Math.pow(1 - tt / .9, 2)) : .576;
  const photo = tt >= 6.3, fx = photo ? Math.max(.96, 1.04 - (tt - 6.3) / .3 * .08) : 1.2;
  $id('rFin').style.opacity = photo ? 1 : 0; $id('rFin').style.transform = `translateX(${fx * W}px)`;
  const scroll = Math.min(L, lerpTab(LEAD, 6.3)) * 2400;
  $id('rLanes').style.backgroundPositionX = -scroll + 'px';
  $id('rStart').style.transform = `translateX(${-Math.min(scroll, 400)}px)`;
  const P = RC_N.map((_, i) => rcProg(i, tt, A));
  let lead = 0; P.forEach((p, i) => { if (p > P[lead]) lead = i });
  const LP = lerpTab(LEAD, Math.min(tt, 6.3));
  RC_N.forEach((_, i) => {
    let x;
    if (!photo) x = camX + (P[i] - L) * 2.5;
    else { const xL = .576 + (fx - .576) * Math.min(1, (L - LP) / Math.max(.001, 1 - LP)); x = xL + (P[i] - L) * 2.5 }
    x = Math.min(x, 1.06);
    const sp = Math.max(0, Math.min(1, (lerpTab(LEAD, tt + .1) - lerpTab(LEAD, tt)) / .02));
    $id('rRun' + i).style.transform = `translateX(${x * W}px)`;
    const tr = $id('rTr' + i); tr.style.opacity = tt < .15 ? 0 : 1; tr.style.transform = `translateX(${x * W}px) scaleX(${.55 + sp * .75})`;
    $id('rRun' + i).classList.toggle('lead', i === lead);
  });
  // lider qatori
  const li = $id('rLeadF'); if (li) { li.style.width = Math.min(100, L * 100) + '%'; li.style.background = RC_T[lead]; $id('rLeadP').textContent = Math.min(100, Math.round(L * 100)) + '%'; $id('rLeadA').innerHTML = runImg(lead) }
  // joylar (kartalarda)
  const ord = P.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  const fin = tt >= T_WIN ? d.order : ord;
  fin.forEach((r, k) => { const e = $id('rPl' + r); if (e) { e.textContent = PLACE[k]; e.className = 'rpl on' + (k === 0 ? ' g' : '') } });
  // status yorlig'i
  const st = tt < 0 ? 'Starting' : tt < T_FINAL ? 'Live' : tt < T_PHOTO ? 'Final stretch' : (now - d.raceAt) / 1000 < d.raceMs / 1000 ? 'Photo finish' : 'Finished';
  rcPill(st);
  // g'olib pufagi
  const w = $id('rWin');
  if (tt >= T_WIN) { const r = d.order[0]; if (!w.classList.contains('on')) { w.innerHTML = `${runImg(r, 'wa')}<b>${RC_S[r]} wins</b><em style="color:${RC_C[r]}">${d.coefs[r]}x</em>`; w.classList.add('on') } }
  else w.classList.remove('on');
}
function rcPill(st) {
  const p = $id('rSt'); if (p.dataset.s === st) return; p.dataset.s = st;
  p.querySelector('b').textContent = T(st); p.className = 'rpill ' + (st === 'Betting Open' ? 'g' : st === 'Starting' ? 'y' : st === 'Finished' ? 'n' : 'r');
}
function rcBubble(b) {
  const e = $id('rBub'); e.innerHTML = `<b>${esc(b.name)}</b> ${T('bet')} ${gem}<b>${fmtA(b.amt)}</b> ${T('on')} <b>${RC_N[b.racer]}</b>`;
  e.classList.remove('on'); void e.offsetWidth; e.classList.add('on');
}

// ---- statik qismlar (kartalar, info qatori, tugma, yo'lak tikishlari)
function rcStatic() {
  const d = RC.d, k = d ? d.coefs : [50, 20, 12, 8, 4, 2], ch = chances(k), bets = d ? d.bets || [] : [];
  RC_N.forEach((_, i) => {
    $id('rK' + i).textContent = k[i] + 'x'; $id('rP' + i).textContent = ch[i].toFixed(2) + '%';
    const sum = bets.filter(b => b.racer === i).reduce((a, b) => a + b.amt, 0); $id('rA' + i).textContent = fmtA(sum);
    const mine = bets.some(b => b.racer === i && isMe(b.uid));
    const c = $$('#rCards .rcard')[i]; c.classList.toggle('sel', RC.sel === i || (RC.sel < 0 && mine)); c.style.setProperty('--rc', RC_C[i]);
    const ln = $$('#rLanes .rln')[i]; ln.classList.toggle('sel', RC.sel === i || mine); ln.style.setProperty('--rt', RC_T[i]);
    // yo'lakdagi tikuvchilar (avatar to'plami + summa) — faqat betting
    const lb = $id('rLb' + i); const who = bets.filter(b => b.racer === i);
    lb.innerHTML = d && d.phase === 'wait' && who.length ? `<span class="rav">${who.slice(-2).map(b => pvAv(b)).join('')}</span>${gem}<b>${fmtA(sum)}</b>` : '';
    if (!d || d.phase === 'wait') { const e = $id('rPl' + i); e.className = 'rpl'; e.textContent = '' }
  });
  const pot = bets.reduce((a, b) => a + b.amt, 0), pl = new Set(bets.map(b => b.uid)).size;
  const info = $id('rInfo');
  if (!d || d.phase === 'wait') info.innerHTML = `<span class="ri1"><img src="assets/race/ic_users.png" alt="">${pl} ${T('players')} · ${T('Pot')} ${gem}<b>${fmtA(pot)}</b></span><button class="rsh" id="rShB"><img src="assets/race/ic_shield.png" alt=""></button><button class="rall" id="rAllB">${T('All bets')} <i>›</i></button>`;
  else if (d.phase === 'race') { if (!$id('rLeadF')) info.innerHTML = `<span class="ri2">${T('Leader')} <span class="rla" id="rLeadA"></span><span class="rlbar"><i id="rLeadF"></i></span><b id="rLeadP">0%</b></span><button class="rsh" id="rShB"><img src="assets/race/ic_shield.png" alt=""></button><button class="rall" id="rAllB">${T('All bets')} <i>›</i></button>` }
  else { const wn = new Set(bets.filter(b => b.win > 0).map(b => b.uid)).size, nx = Math.max(0, Math.ceil((d.resAt + d.resultMs - srvNow()) / 1000)); info.innerHTML = `<span class="ri1"><img src="assets/race/ic_users.png" alt="">${wn} ${T('winners')} · <em>${T('next in')} ${nx}s</em></span><button class="rsh" id="rShB"><img src="assets/race/ic_shield.png" alt=""></button><button class="rall" id="rAllB">${T('All bets')} <i>›</i></button>` }
  const sb = $id('rShB'); if (sb) sb.onclick = () => rcFair(d && d.phase === 'done' ? null : 'cur');
  const ab = $id('rAllB'); if (ab) ab.onclick = rcAllBets;
  // tugma
  const btn = $id('rBtn'), amt = parseFloat($id('rAmt').value) || 0;
  let t1 = 'Place Bet', t2 = '', on = false;
  if (d && d.phase !== 'wait') { t1 = 'Race in progress'; const left = Math.max(0, Math.ceil(((d.phase === 'race' ? d.raceAt + d.raceMs + d.resultMs : d.resAt + d.resultMs) - srvNow()) / 1000)); t2 = `${T('Bets open in')} ${left} s` }
  else if (RC.sel < 0) t1 = 'Select a racer above';
  else if (amt > 0) { on = true; t1 = `${T('Bet on')} ${RC_S[RC.sel]}`; t2 = `${fmtA(amt)} ${CUR} → ${fmtA(amt * k[RC.sel])} ${CUR}` }
  btn.querySelector('b').textContent = T(t1); btn.querySelector('small').textContent = t2; btn.classList.toggle('on', on); btn.classList.toggle('two', !!t2);
}

async function rcBet() {
  const d = RC.d; if (!d || d.phase !== 'wait' || RC.sel < 0) return;
  const amt = Math.round((parseFloat($id('rAmt').value) || 0) * 100) / 100; if (!(amt > 0)) return toast(T('Enter a bet amount'));
  if (amt > S.bal) return toast(T('Not enough balance'));
  setBal(-amt);
  liveStake('race', amt, [], { racer: RC.sel });
}

// ---- natija oynasi (r_038: WINNER · ROUND #3065)
function rcResult(d) {
  const r = d.order[0], ch = chances(d.coefs)[r], ws = (d.bets || []).filter(b => b.win > 0);
  const paid = ws.reduce((a, b) => a + b.win, 0);
  const agg = {}; ws.forEach(b => { const a = agg[b.uid] || (agg[b.uid] = { ...b, amt: 0, win: 0 }); a.amt += b.amt; a.win += b.win });
  rcSheet('rResM', `<div class="rres" style="--rc:${RC_C[r]}"><div class="rrh"><span class="rra">${runImg(r)}<img class="rcrown2" src="assets/race/crown.png" alt=""></span><div><small>${T('WINNER')} · ${T('ROUND')} #${d.id}</small><b>${RC_N[r]} <em>${d.coefs[r]}x</em></b><i>${ch.toFixed(2)}% ${T('chance')}</i></div><button class="rx" data-close>✕</button></div></div>
    <div class="rwh"><span><img src="assets/race/ic_trophy.png" alt="">${T('Winners')} <em>${Object.keys(agg).length}</em></span><span class="po">${T('Paid out')} ${gem}<b>${fmtA(paid)}</b></span></div>
    ${Object.values(agg).sort((a, b) => b.win - a.win).map(b => `<div class="rwr">${pvAv(b)}<div><b>${esc(b.name)}${b.bot ? ' <span class="bt">BOT</span>' : ''}</b><small>${T('bet')} ${gem}${fmtA(b.amt)}</small></div><span class="rp">${gem}+${fmtA(b.win)}</span></div>`).join('') || `<div class="rnone">${T('No winners this round')}</div>`}`);
  const mine = ws.filter(b => isMe(b.uid)).reduce((a, b) => a + b.win, 0);
  if (mine > 0) { if (!(window.NET && NET.on)) setBal(mine); else if (typeof syncBal === 'function') syncBal(); logGame('Race', 0, mine, 'win') }
}
function rcSheet(id, html, cls = '') {
  let m = $id(id); if (!m) { document.body.insertAdjacentHTML('beforeend', `<div class="modal rsheet ${cls}" id="${id}"><div class="mbox"><i class="grab"></i><div class="rsb"></div></div></div>`); m = $id(id); m.onclick = e => { if (e.target === m || e.target.closest('[data-close]')) m.classList.remove('on') } }
  m.querySelector('.rsb').innerHTML = html; m.classList.add('on'); return m;
}
function rcAllBets() {
  const d = RC.d, bets = d ? d.bets || [] : [];
  rcSheet('rAllM', `<div class="rshh"><b>${T('All bets')}</b><button class="rx" data-close>✕</button></div>${bets.length ? [...bets].reverse().map(b => `<div class="rwr">${pvAv(b)}<div><b>${esc(b.name)}${b.bot ? ' <span class="bt">BOT</span>' : ''}</b><small>${gem}${fmtA(b.amt)} ${T('on')} <span class="rtag" style="--rc:${RC_C[b.racer]}">${runImg(b.racer)}${RC_S[b.racer]} <em>${d.coefs[b.racer]}x</em></span></small></div></div>`).join('') : `<div class="rnone">${T('No bets yet')}</div>`}`);
}
function rcGiftSheet() {
  rcSheet('rGiftM', `<div class="rshh"><b>${T('Bet gifts')}</b><button class="rx" data-close>✕</button></div><div class="rng"><img src="assets/ui/ic_gift_tog.png" alt=""><b>${T('No Gifts Available')}</b><small>${T('Send gifts or open boxes to get some')}</small><div class="rngb"><button class="rgs" onclick="openLink('https://t.me/buyernewss')">${T('Send Gifts')}</button><button class="rob" data-close onclick="go('home')">${T('Open Boxes')}</button></div></div>`);
}

// ---- tarix (r_049: Race history, All races | My races, oxirgi 100 ta g'oliblar)
function rcHist(tab) {
  RC.histTab = tab || RC.histTab; const d = RC.d, h = d ? d.hist || [] : [];
  const cnt = [0, 0, 0, 0, 0, 0]; h.forEach(x => cnt[x.win]++);
  const me = String(TGU.id || 0), list = RC.histTab === 'mine' ? h.filter(x => (x.uids || []).map(String).includes(me)) : h;
  rcSheet('rHistM', `<div class="rshh"><b>${T('Race history')}</b><button class="rx" data-close>✕</button></div>
   <div class="rtabs"><button data-t="all" class="${RC.histTab === 'all' ? 'on' : ''}">${T('All races')}</button><button data-t="mine" class="${RC.histTab === 'mine' ? 'on' : ''}">${T('My races')}</button></div>
   <div class="rw100"><small>${T('Winners of the last 100 races')}</small><div>${RC_N.map((n, i) => `<span>${runImg(i)}<b style="color:${RC_C[i]}">${cnt[i]}</b></span>`).join('')}</div></div>
   ${list.map((x, k) => `<div class="rhr" style="--rc:${RC_C[x.win]}" data-id="${x.id}"><span class="rha">${runImg(x.win)}</span><div class="rht"><b>${RC_N[x.win]} <em>${x.coef}×</em></b><small>#${x.id} · ${new Date(x.t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>${k === 0 && RC.histTab === 'all' ? '<i class="rlt">LATEST</i>' : ''}</div><div class="rhp"><span>${T('Pot')} ${gem}<b>${fmtA(x.pot)}</b></span><small>${x.winners} ${T(x.winners === 1 ? 'winner' : 'winners')}</small></div><i class="rch">›</i><button class="rsh2" data-f="${x.id}"><img src="assets/race/ic_shield.png" alt=""></button></div>`).join('') || `<div class="rnone">${T('No completed races yet')}</div>`}`);
  const m = $id('rHistM');
  m.querySelectorAll('.rtabs button').forEach(b => b.onclick = () => rcHist(b.dataset.t));
  m.querySelectorAll('.rhr').forEach(r => r.onclick = e => { const f = e.target.closest('.rsh2'); f ? rcFair(+f.dataset.f) : rcDetails(+r.dataset.id) });
}
async function rcRound(id) { return api('/api/race/round?id=' + id) }
async function rcDetails(id) {
  let x; try { x = await rcRound(id) } catch (e) { return toast(esc(e.message)) }
  const ws = x.bets.filter(b => b.win > 0), ls = x.bets.filter(b => !(b.win > 0)), r = x.win, ch = chances(JSON.parse(x.cfg).coefficients)[r];
  const row = (b, won) => `<div class="rwr">${pvAv(b)}<div><b>${esc(b.name)}${b.bot ? ' <span class="bt">BOT</span>' : ''}</b><small>${gem}${fmtA(b.amt)} ${T('on')} <span class="rtag" style="--rc:${RC_C[b.racer]}">${runImg(b.racer)}${RC_S[b.racer]} <em>${JSON.parse(x.cfg).coefficients[b.racer]}x</em></span></small></div>${won ? `<span class="rp">${gem}+${fmtA(b.win)}</span>` : `<span class="rlost">${T('Lost')}</span>`}</div>`;
  rcSheet('rDetM', `<div class="rshh"><button class="rbk" data-close>‹ ${T('Race history')}</button><small>${new Date(x.t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></div>
   <div class="rres" style="--rc:${RC_C[r]}"><div class="rrh"><span class="rra">${runImg(r)}<img class="rcrown2" src="assets/race/crown.png" alt=""></span><div><small>${T('WINNER')} · ${T('ROUND')} #${x.id}</small><b>${RC_N[r]} <em>${x.coef}x</em></b><i>${ch.toFixed(2)}% ${T('chance')}</i></div></div><div class="rrs">${x.players} ${T('players')} · ${T('Pot')} ${gem}<b>${fmtA(x.pot)}</b></div></div>
   <div class="rfo"><small>${T('Finish order')}</small><div>${x.order.map((o, k) => `<span><i>${PLACE[k]}</i>${runImg(o)}</span>`).join('')}</div></div>
   <div class="rwh"><span><img src="assets/race/ic_trophy.png" alt="">${T('Winners')} <em>${ws.length}</em></span><span class="po">${T('Paid out')} ${gem}<b>${fmtA(x.paid)}</b></span></div>${ws.map(b => row(b, 1)).join('')}
   <div class="rwh"><span>⊘ ${T('Lost')} <em>${ls.length}</em></span><span class="po">${T('Staked')} ${gem}<b>${fmtA(ls.reduce((a, b) => a + b.amt, 0))}</b></span></div>${ls.map(b => row(b, 0)).join('')}`, 'rdet');
}
// ---- Fairness (r_060): brauzerda tekshiriladi (SubtleCrypto)
async function sha256hex(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('') }
async function hmacBytes(keyHex, msg) { const k = await crypto.subtle.importKey('raw', new Uint8Array(keyHex.match(/../g).map(h => parseInt(h, 16))), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg))) }
async function rcVerify(x) {
  const cfg = JSON.parse(x.cfg), ch = await sha256hex(x.cfg); if (ch !== x.chash) return false;
  if (await sha256hex(`${x.seed}:${x.rid}:${x.chash}`) !== x.commit) return false;
  const left = cfg.coefficients.map((_, i) => i), out = []; let n = 0;
  while (left.length) {
    const w = left.map(i => Math.round(1e6 / cfg.coefficients[i])), Tt = w.reduce((a, b) => a + b, 0);
    const h = await hmacBytes(x.seed, `${x.rid}:${x.chash}:${n}`); n++;
    let r = 0; for (let j = 0; j < 6; j++) r = r * 256 + h[j];
    const lim = 2 ** 48 - (2 ** 48 % Tt); if (r >= lim) continue; r %= Tt;
    for (let k = 0; k < left.length; k++) { if (r < w[k]) { out.push(left[k]); left.splice(k, 1); break } r -= w[k] }
  }
  return out.join() === x.order.join();
}
async function rcFair(id) {
  let x;
  if (id === 'cur' || id == null) { const d = RC.d; if (!d) return; if (id === 'cur' || d.phase !== 'done') { x = { rid: d.rid, commit: d.hash, chash: d.chash, cfg: d.cfg, seed: null } } else id = d.id }
  if (!x) { try { x = await rcRound(id) } catch (e) { return toast(esc(e.message)) } }
  const ok = x.seed ? await rcVerify(x).catch(() => false) : null;
  const fld = (l, v, cls = '', cp = true) => `<small class="rfl">${l}</small><div class="rfv ${cls}"><span>${esc(v)}</span>${cp ? `<button onclick="copyTxt('${esc(v)}')"><img src="assets/inv/ic_copy.png" alt=""></button>` : ''}</div>`;
  rcSheet('rFairM', `<div class="rshh"><b>${T('Fairness')}</b><button class="rx" data-close>✕</button></div>
   ${ok === null ? `<div class="rver wait">${T('Server seed is revealed after the race')}</div>` : `<div class="rver ${ok ? '' : 'bad'}">${ok ? '✓ ' + T('Verified: the commitment and finishing order match.') : '✕ ' + T('Verification failed')}</div>`}
   ${fld(T('Round'), x.rid, '', false)}${fld('SHA-256', x.commit)}${x.seed ? fld(T('Server seed'), x.seed, 'g') : ''}${fld(T('Config hash'), x.chash, 'p')}
   <small class="rfl">${T('Config')}</small><div class="rfv code"><span>${esc(x.cfg)}</span></div>
   <p class="rfn">${T('SHA-256 commits the seed and configuration before betting. HMAC-SHA256 with the round ID, config hash and an incrementing counter draws the finishing order using rejection sampling and the published weights. Verification runs on this device.')}</p>`);
}
function rcHow() {
  const d = RC.d, k = d ? d.coefs : [50, 20, 12, 8, 4, 2], ch = chances(k);
  rcSheet('rHowM', `<div class="rshh"><b>${T('How Race works')}</b><button class="rx" data-close>✕</button></div><small class="rhs">${T('Pick, bet, watch')}</small>
   <div class="rstp"><i>1</i><div><b>${T('Pick a racer')}</b><small>${T('Higher multiplier means a lower chance to win')}</small></div></div>
   <div class="rstp"><i>2</i><div><b>${T('Place your bet')}</b><small>${T('Bet TON or gifts before the countdown ends')}</small></div></div>
   <div class="rstp"><i>3</i><div><b>${T('Watch the race')}</b><small>${T('The winner is decided by the published, verifiable weights')}</small></div></div>
   <small class="rfl">${T('Multipliers & chances')}</small><div class="rmc">${k.map((x, i) => `<span style="--rc:${RC_C[i]}">${runImg(i)}<b>${x}x</b><small>${ch[i].toFixed(2)}%</small></span>`).join('')}</div>
   <button class="rok" data-close>${T('Got it')}</button>`);
}
window.rcHist = rcHist; window.rcHow = rcHow; window.rcSet = rcSet; window.rcVerify = rcVerify;

ENTER.race = () => { if (!$id('rTrack')) rcHTML(); RC.d = LV.st.race || RC.d; rcStatic(); rcPull(); if (!RC.raf) rcFrame() };
setInterval(() => { if (cur === 'race' && RC.d) rcStatic() }, 500);
// headerdagi tarix / ? tugmalari
const hh = $id('hHist'), hq = $id('hHelp'), oh = hh.onclick, oq = hq.onclick;
hh.onclick = () => cur === 'race' ? rcHist('all') : oh && oh();
hq.onclick = () => cur === 'race' ? rcHow() : oq && oq();
})();
