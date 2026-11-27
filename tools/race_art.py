# Race san'ati — Screen_Recording_2026-11-27_145037.mp4 kadrlaridan (frames3/*, /tmp/rf/*)
import cv2, numpy as np
from PIL import Image
OUT = 'assets/race/'
r12 = cv2.imread('frames3/r_012.0.png')
# 1) banner (o'rmon): status pill va raund raqami inpaint
ban = r12[176:253, 33:567].copy()
m = np.zeros(ban.shape[:2], np.uint8)
m[3:24, 205:330] = 255; m[3:24, 476:534] = 255
cv2.imwrite(OUT + 'banner_forest.png', cv2.inpaint(ban, m, 7, cv2.INPAINT_TELEA))
# 2) yo'lak plitkasi: x 345..546 (7 davr × 28.7 px), y 253..487 — poyga yo'q joy
tile = r12[253:487, 345:546].copy()
cv2.imwrite(OUT + 'lanes_tile.png', tile)
# 3) sprite'lar: kartalardagi rasm (o'ng qism), karta foni #1f1e23 kalit
cards = [(33, 543), (214, 543), (395, 543), (33, 640), (214, 640), (395, 640)]
names = ['pepe', 'dog', 'cat', 'frog', 'chimp', 'snoop']
for (x, y), n in zip(cards, names):
    F = r12[y + 1:y + 89, x + 95:x + 172].astype(float)
    bg = np.array([0x23, 0x1e, 0x1f], float)
    d = np.abs(F - bg).max(2)
    a = np.clip((d - 6) / 26, 0, 1)
    a = cv2.GaussianBlur(a, (3, 3), 0)
    B = np.broadcast_to(bg, F.shape)
    c = np.clip((F - (1 - a[..., None]) * B) / np.maximum(a[..., None], 1e-3), 0, 255)
    rgba = np.dstack([c, a * 255]).astype(np.uint8)
    ys, xs = np.where(a > .1)
    rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    cv2.imwrite(OUT + f'card_{n}.png', rgba)
# 4) yo'lakdagi kichik sprite'lar (start chizig'ida, r_012): x 136..182, har yo'lak 39 px
lane_y = [253, 292, 331, 370, 409, 448]
for ly, n in zip(lane_y, names):
    F = r12[ly + 1:ly + 39, 134:183].astype(float)
    bg = np.array([0x1b, 0x16, 0x17], float)
    d = np.abs(F - bg).max(2)
    a = np.clip((d - 10) / 30, 0, 1); a[:, -3:] = 0   # start chizig'i
    B = np.broadcast_to(bg, F.shape)
    c = np.clip((F - (1 - a[..., None]) * B) / np.maximum(a[..., None], 1e-3), 0, 255)
    rgba = np.dstack([c, a * 255]).astype(np.uint8)
    ys, xs = np.where(a > .15)
    rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    cv2.imwrite(OUT + f'run_{n}.png', rgba)
# 5) countdown halqasi (raqam inpaint)
ring = r12[326:410, 257:342].copy()
m = np.zeros(ring.shape[:2], np.uint8); cy, cx = 42, 42
yy, xx = np.mgrid[:ring.shape[0], :ring.shape[1]]; rr = np.hypot(xx - cx, yy - cy)
cv2.imwrite(OUT + 'ring_raw.png', ring)
