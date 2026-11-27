# kadrda ustun/qator bo'yicha rang o'tishlari (telefon: css = (src-122)*390/588)
import sys
from PIL import Image
f, ax, pos, a, b = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
th = int(sys.argv[6]) if len(sys.argv) > 6 else 20
im = Image.open(f).convert('RGB'); ph = im.width >= 586
K = 390 / im.width if ph else 2 / 3; oy = 122 if ph else 0
prev = None
for t in range(a, b):
    c = im.getpixel((pos, t) if ax == 'x' else (t, pos))
    if prev is None or sum(abs(u - v) for u, v in zip(c, prev)) > th:
        css = (t - oy) * K if ax == 'x' else t * K
        print(f'{t:5d} css {css:6.1f}  #%02x%02x%02x' % c)
    prev = c
