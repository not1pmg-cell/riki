# RIKI elementlar o'lchami: python3 tools/boxes.py <screen> "<sel1>" "<sel2>" ...
import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 390, 'height': 768})
        await pg.route('**/*', lambda r: r.abort() if not r.request.url.startswith('http://localhost') else r.continue_())
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1200)
        await pg.evaluate(f"go('{sys.argv[1]}')"); await pg.wait_for_timeout(500)
        for s in sys.argv[2:]:
            r = await pg.evaluate("s=>[...document.querySelectorAll(s)].filter(e=>e.offsetParent).slice(0,4).map(e=>{const b=e.getBoundingClientRect(),c=getComputedStyle(e);return `${Math.round(b.x*10)/10},${Math.round(b.y*10)/10} ${Math.round(b.width*10)/10}x${Math.round(b.height*10)/10} r${c.borderRadius} fs${c.fontSize} ${c.color} bg${c.backgroundColor}`})", s)
            print(s, r)
        await b.close()
asyncio.run(main())
