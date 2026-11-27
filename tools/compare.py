# Original kadr | RIKI | diff heatmap.  python3 tools/compare.py <name> [<name>...]   (screens.json dan)
import asyncio, json, sys, os
import numpy as np
from PIL import Image, ImageFilter
from playwright.async_api import async_playwright
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SC = json.load(open(os.path.join(R, 'tools/screens.json')))

def orig(path):
    im = Image.open(os.path.join(R, path)).convert('RGB')
    if im.width >= 586:                       # telefon kadri 588 → 390; Telegram sarlavhasi (src 0–122) kesiladi
        im = im.crop((0, 122, im.width, im.height - 3))
        return im.resize((390, round(im.height * 390 / im.width)), Image.LANCZOS)
    k = 2 / 3                                  # desktop kadr: viewport 585, 570 ko'rinadi
    s = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    o = Image.new('RGB', (390, s.height), s.getpixel((s.width - 2, s.height // 2))); o.paste(s, (0, 0)); return o

def score(a, b, masks):
    A = np.asarray(a.filter(ImageFilter.GaussianBlur(1.2))).astype(int)
    B = np.asarray(b.filter(ImageFilter.GaussianBlur(1.2))).astype(int)
    d = np.abs(A - B).sum(2) > 60
    m = np.ones(d.shape, bool)
    for x0, y0, x1, y1 in masks: m[y0:y1, x0:x1] = False
    d &= m
    return d, 100 * d.sum() / m.sum()

async def main(names):
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        res = {}
        for n in names:
            c = SC[n]; o = orig(c['frame'])
            pg = await br.new_page(viewport={'width': 390, 'height': o.height}, device_scale_factor=1)
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.route('**/*', lambda r: r.abort() if not r.request.url.startswith('http://localhost') else r.continue_())
            await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1200)
            await pg.add_style_tag(content='#offLv{display:none!important}*{caret-color:transparent!important}')
            await pg.evaluate("document.getElementById('splash')&&document.getElementById('splash').remove()")
            if c.get('go'): await pg.evaluate(f"go('{c['go']}')"); await pg.wait_for_timeout(600)
            if c.get('js'):
                try: await pg.evaluate(c['js'])
                except Exception as e: errs.append('JS: ' + str(e)[:200])
                await pg.wait_for_timeout(c.get('wait', 700))
            path = f'/tmp/mine_{n}.png'; await pg.screenshot(path=path); await pg.close()
            mine = Image.open(path).convert('RGB')
            d, sc = score(o, mine, c.get('mask', []))
            hm = np.asarray(mine.convert('L').convert('RGB')).astype(float) * .35
            hm[d] = [255, 40, 40]
            W = 390 * 3 + 20; out = Image.new('RGB', (W, o.height + 24), (255, 255, 255))
            out.paste(o, (0, 24)); out.paste(mine, (400, 24)); out.paste(Image.fromarray(hm.astype(np.uint8)), (800, 24))
            from PIL import ImageDraw
            dr = ImageDraw.Draw(out); dr.text((4, 6), 'EPIC (original)', fill=0); dr.text((404, 6), 'RIKI', fill=0); dr.text((804, 6), f'diff {sc:.1f}%', fill=(200, 0, 0))
            os.makedirs(os.path.join(R, 'compare'), exist_ok=True); out.save(os.path.join(R, f'compare/{n}.png'))
            res[n] = round(sc, 1); print(n, f'{sc:.1f}%', ' '.join(errs)[:300])
        await br.close()
        json.dump({**(json.load(open('/tmp/cmpres.json')) if os.path.exists('/tmp/cmpres.json') else {}), **res}, open('/tmp/cmpres.json', 'w'))
asyncio.run(main(sys.argv[1:] or list(SC)))
