# MINES san'ati — 409.mp4 62–89 s (telefon, 588 px) va frames/53,55 (desktop) kadrlaridan
import numpy as np, cv2
P = 'assets/mines2/'
X = lambda c: int(round(43 + 102.4 * c)); Y = lambda r: int(round(346 + 102.4 * r))
m62 = cv2.imread('frames4/m_62.5.png'); m70 = cv2.imread('frames4/m_70.2.png')
cv2.imwrite(P + 'tile_closed.png', m62[Y(0):Y(0) + 92, X(0):X(0) + 92])           # 62.5 s
cv2.imwrite(P + 'tile_gem.png', m70[Y(2):Y(2) + 92, X(1):X(1) + 92])              # 70.2 s
b = lambda i: cv2.imread('/tmp/mf/b_%03d.png' % i).astype(float)                  # 75.8 s + kadrlar (y −300)
yb = lambda r: Y(r) - 300
C = np.array([0, 0, 243.])   # BGR — qizil qatlam rangi (o'lchangan)
def untint(f, a): return np.clip((f - C * a) / (1 - a), 0, 255)
cv2.imwrite(P + 'tile_hit0.png', b(13)[yb(3):yb(3) + 92, X(3):X(3) + 92])          # 76.27 s: qizil, nuqta
cv2.imwrite(P + 'tile_mine.png', b(14)[yb(0):yb(0) + 92, X(0):X(0) + 92])          # 76.30 s: ochilgan mina
cv2.imwrite(P + 'tile_hit_flash.png', untint(b(15)[yb(3):yb(3) + 92, X(3):X(3) + 92], .256))
cv2.imwrite(P + 'tile_hit.png', untint(b(30)[yb(3):yb(3) + 92, X(3):X(3) + 92], .205))
# qizil nur — b_015 (cho'qqi) va b_014 (nursiz, minalar ochilgan) piksel farqidan: a = 1 − G/G0 (ichkari), (R−24)/219 (tashqari)
f = b(15); f0 = b(14)
y0, y1, x0, x1 = 327 - 300 - 30, 866 - 300 + 30, 25 - 30, 563 + 30
pad_t = -y0 if y0 < 0 else 0; pad_l = -x0 if x0 < 0 else 0
F = f[max(0, y0):y1, max(0, x0):x1]; F0 = f0[max(0, y0):y1, max(0, x0):x1]
a_out = np.clip((F[..., 2] - 24) / (243 - 24), 0, 1)
a_in = np.clip(1 - F[..., 1] / np.maximum(F0[..., 1], 1), 0, 1)
H, W = F.shape[:2]; yy, xx = np.mgrid[:H, :W]
cx0, cy0 = 30 - pad_l, 30 - pad_t
inside = (xx >= cx0 + 4) & (xx < cx0 + 534) & (yy >= cy0 + 4) & (yy < cy0 + 535)
al = np.where(inside, a_in, a_out)
hx, hy = X(3) - max(0, x0), Y(3) - 300 - max(0, y0)
bad = np.zeros((H, W), np.uint8); bad[hy - 3:hy + 95, hx - 3:hx + 95] = 255
bad |= ((F0.max(2) - F0.min(2)) > 40).astype(np.uint8) * 255 * inside      # rangli piksellar (mina/kristal) — ishonchsiz
al8 = cv2.inpaint((al * 255).astype(np.uint8), cv2.dilate(bad, np.ones((5, 5), np.uint8)), 9, cv2.INPAINT_TELEA)
al8 = cv2.medianBlur(al8, 5)
full = np.zeros((H + pad_t, W + pad_l), np.uint8); full[pad_t:, pad_l:] = al8
if pad_l: full[:, :pad_l] = full[:, pad_l:2 * pad_l][:, ::-1]
if pad_t: full[:pad_t] = full[pad_t:2 * pad_t][::-1]
out = np.zeros(full.shape + (4,)); out[..., 2] = 243; out[..., 3] = full
out[:, -40:] = out[:, :40][:, ::-1]   # o'ng chetdagi sahifa nuqtasi (kadr x≈580) — chapdan ko'zgu
cv2.imwrite(P + 'glow_red.png', out.astype(np.uint8))
# yashil (yutuq) — frames/55 vs 53 (desktop): halo + ichki qatlam
a53 = cv2.imread('frames/53_mines_cashout.png').astype(float); a55 = cv2.imread('frames/55_mines_win_243x.png').astype(float)
G = np.array([80, 200, 20.])
d = a55[150:850, 0:570]; base = a53[150:850, 0:570]
al = np.clip((d[..., 1] - base[..., 1]) / np.maximum(G[1] - base[..., 1], 1), 0, 1)
cv2.imwrite('/tmp/w/galpha.png', (al * 255).astype(np.uint8))
print('green interior median', np.median(al[300:600, 300:500]))
# --- yashil halo (frames/55 − frames/53), telefon geometriyasiga (glow_red bilan bir xil o'lcham) moslanadi
a53 = cv2.imread('frames/53_mines_cashout.png').astype(float); a55 = cv2.imread('frames/55_mines_win_243x.png').astype(float)
CG = np.array([88, 223, 18.])          # BGR — o'lchangan yashil (#12df58)
mg = 30; bx0, by0, bx1, by1 = 22 - mg, 228 - mg, 562 + mg, 768 + mg
base = np.zeros((by1 - by0, bx1 - bx0, 3)) + 24; out = base.copy()
sx0 = max(0, bx0); sx1 = min(570, bx1)
base[:, sx0 - bx0:sx1 - bx0] = a53[by0:by1, sx0:sx1]; out[:, sx0 - bx0:sx1 - bx0] = a55[by0:by1, sx0:sx1]
al = np.clip((out[..., 1] - base[..., 1]) / np.maximum(CG[1] - base[..., 1], 1), 0, 1)
sat_b = base.max(2) - base.min(2); bad = (sat_b > 12) | ((out[..., 0] - out[..., 2]) > 40) | (out.min(2) > 150)
bad = cv2.dilate(bad.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
al8 = (al * 255).astype(np.uint8); al8 = cv2.inpaint(al8, bad.astype(np.uint8) * 255, 15, cv2.INPAINT_TELEA)
al8 = cv2.medianBlur(al8, 7)
if sx0 > bx0: al8[:, :sx0 - bx0] = al8[:, (sx0 - bx0) * 2:sx0 - bx0:-1][:, :sx0 - bx0]
if sx1 < bx1: al8[:, sx1 - bx0:] = al8[:, :bx1 - sx1][:, ::-1]
g = np.zeros(al8.shape + (4,), np.uint8); g[..., :3] = CG; g[..., 3] = al8
g = cv2.resize(g, (593, 596), interpolation=cv2.INTER_AREA)
cv2.imwrite(P + 'glow_green.png', g)
# ichki qism: kartaning chetidan masofaga bog'liq profil (chap chetdagi toza qator bo'yicha), markaz — doimiy
row = 500 - by0
prof = [al[row, mg + k] for k in range(0, 14)]
center = float(np.median([al[row, x] for x in range(mg + 60, mg + 480) if not bad[row, x]] or [.34]))
print('green edge profile', [round(p, 2) for p in prof[:16]], 'center', round(center, 3))
H, W = al.shape; yy, xx = np.mgrid[:H, :W]
inside = (xx >= mg) & (xx < W - mg) & (yy >= mg) & (yy < H - mg)
dist = np.minimum.reduce([xx - mg, W - mg - 1 - xx, yy - mg, H - mg - 1 - yy])
pa = np.array(prof + list(np.linspace(prof[-1], center, 10)) + [center] * 420)
al2 = al8.astype(float) / 255
al2[inside] = np.maximum(pa[np.clip(dist[inside], 0, 439)], center)
# tashqi halo: chap tomondagi toza profil bilan simmetrik
g = np.zeros(al2.shape + (4,), np.uint8); g[..., :3] = CG; g[..., 3] = (np.clip(al2, 0, 1) * 255).astype(np.uint8)
g = cv2.resize(g, (593, 596), interpolation=cv2.INTER_AREA)
cv2.imwrite(P + 'glow_green.png', g)
# tepa halo — chiplar aralashgan; pastki halo ko'zgusi bilan almashtiriladi (ikkala rang)
for nm in ('glow_red', 'glow_green'):
    g = cv2.imread(P + nm + '.png', -1); m = int(round(30 * g.shape[0] / 596)) + 2
    g[:m] = g[-m:][::-1]; cv2.imwrite(P + nm + '.png', g)
