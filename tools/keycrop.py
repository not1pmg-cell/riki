# Kadrdan ikonka kesish (fon rangi chiqarib tashlanadi → shaffof PNG). python3 tools/keycrop.py frame x0 y0 x1 y1 out.png [bgHEX]
import sys
import numpy as np
from PIL import Image
f, x0, y0, x1, y1, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
im = np.asarray(Image.open(f).convert('RGB')).astype(float)
F = im[y0:y1, x0:x1]
if len(sys.argv) > 7: bg = np.array([int(sys.argv[7][i:i + 2], 16) for i in (0, 2, 4)], float)
else: bg = np.median(np.concatenate([F[0], F[-1], F[:, 0], F[:, -1]]), axis=0)
B = np.broadcast_to(bg, F.shape)
a = np.where(F >= B, (F - B) / np.maximum(255 - B, 1), (B - F) / np.maximum(B, 1)).max(2)
a = np.clip(a, 0, 1); a[a < .04] = 0
c = np.clip(np.where(a[..., None] > 0, (F - (1 - a[..., None]) * B) / np.maximum(a[..., None], 1e-3), 0), 0, 255)
Image.fromarray(np.dstack([c, a * 255]).astype(np.uint8)).save(out)
print(out, 'bg #%02x%02x%02x' % tuple(int(v) for v in bg), F.shape[1], 'x', F.shape[0])
