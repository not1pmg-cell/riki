# TvT arena san'ati: frames/06 (fire yorqin) va frames/02 (ice 50%) dan; matnlar inpaint
import cv2, numpy as np
def card(f): return cv2.imread(f)[71:347, 14:557].copy()
c6, c2 = card('frames/06_tvt_countdown.png'), card('frames/02_tvt_waiting.png')
def mask(boxes, shape):
    m = np.zeros(shape[:2], np.uint8)
    for x0, y0, x1, y1 in boxes: m[y0:y1, x0:x1] = 255
    return m
b6 = [(15,32,72,53),(15,57,217,93),(15,92,82,113),(222,28,318,120),(313,57,532,93),(462,32,528,53),(468,92,537,113),
      (3,138,52,167),(478,138,537,167),(8,222,82,264),(462,220,537,264),(152,226,402,264)]
base = cv2.inpaint(c6, mask(b6, c6.shape), 9, cv2.INPAINT_TELEA)
b2 = [(15,32,72,53),(15,57,117,93),(222,28,318,120),(428,32,528,93)]
ice2 = cv2.inpaint(c2, mask(b2, c2.shape), 9, cv2.INPAINT_TELEA)
# 02 → yorqin: kanal bo'yicha chiziqli moslash (fire hududi, ikkala kadrda bir xil san'at)
A = c2[150:250, 330:460].reshape(-1, 3).astype(float); B = c6[150:250, 330:460].reshape(-1, 3).astype(float)
gain = []
for ch in range(3):
    k, b = np.polyfit(A[:, ch], B[:, ch], 1); gain.append((k, b))
print('gain', gain)
bright = np.stack([np.clip(ice2[..., ch] * gain[ch][0] + gain[ch][1], 0, 255) for ch in range(3)], 2).astype(np.uint8)
# ice qatlami: arena qismi (y >= 125), x 0..292; o'ng tomondagi olov pikselleri shaffof
L = bright[:, :292].copy()
hsv = cv2.cvtColor(L, cv2.COLOR_BGR2HSV).astype(int)
b_, g_, r_ = [L[..., i].astype(int) for i in range(3)]
fire = (r_ > b_ + 25)
alpha = np.where(fire, 0, 255).astype(np.uint8)
# divizordan chapdagi hamma narsa — muz (olov uchqunlari bo'lsa ham)
for y in range(L.shape[0]):
    row = np.where(~fire[y, 200:])[0]
    edge = 200 + (row.max() if len(row) else 0)
    alpha[y, :edge] = 255; alpha[y, edge + 1:] = 0
alpha[:125] = 0
alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
cv2.imwrite('assets/tvt/arena_base.png', base[14:275, 0:542])
cv2.imwrite('assets/tvt/ice_layer.png', np.dstack([L, alpha]))
cv2.imwrite('/tmp/w/base.png', base); cv2.imwrite('/tmp/w/ice.png', np.dstack([L, alpha]))
# ice: frames/03 (yorqin, divizor ~20%)
c3 = card('frames/03_tvt_waiting_for_ice.png')
L = c3[:, :170].copy()
b_, g_, r_ = [L[..., i].astype(int) for i in range(3)]
fire = (r_ > b_ + 25)
alpha = np.zeros(L.shape[:2], np.uint8)
for y in range(L.shape[0]):
    row = np.where(~fire[y, 40:])[0]
    edge = 40 + (row.max() if len(row) else 0)
    alpha[y, :edge + 1] = 255
alpha[:131] = 0
alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
cv2.imwrite('assets/tvt/ice_layer.png', np.dstack([L, alpha])[14:275]); cv2.imwrite('/tmp/w/ice.png', cv2.resize(np.dstack([L, alpha]), None, fx=2, fy=2))
