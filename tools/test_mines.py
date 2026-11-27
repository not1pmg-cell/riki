import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':390,'height':766}, has_touch=True)
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append('console: '+m.text))
        await pg.route('**/*', lambda r: r.abort() if not r.request.url.startswith('http://localhost') else r.continue_())
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1500)
        await pg.evaluate("document.getElementById('splash')&&document.getElementById('splash').remove();S.bal=100;renderBal();go('mines')")
        E=pg.evaluate; bugs=[]
        async def st(): return await E("({bal:S.bal,on:RIKI_M2.st().on,open:RIKI_M2.st().open.size,btn:document.getElementById('m2Go').textContent,boom:RIKI_M2.st().boom})")
        # 1 bo'sh miqdor bilan katakka bosish
        await pg.click('#m2Board .mx-t >> nth=0'); s=await st()
        if s['on']: bugs.append('empty amount started round')
        # 2 miqdor + bosish
        await pg.fill('#bbA_mn','1'); await pg.click('#m2Board .mx-t >> nth=0'); await pg.wait_for_timeout(200); s=await st(); print('after tap',s)
        if not s['on'] and not s['boom']: bugs.append('tap did not start')
        # 3 raund davomida minalar sonini o'zgartirish
        n0=await E("RIKI_M2.st().n"); await pg.select_option('#m2Sel','5'); n1=await E("RIKI_M2.st().n")
        if s['on'] and n1!=n0: bugs.append('mines changed mid-round')
        # 4 bir necha raund: xavfsiz kataklarni ochib cash out
        for r in range(6):
            M=await E("(()=>{const M=RIKI_M2.st();return {on:M.on,mines:[...M.mines]}})()")
            if not M['on']:
                await pg.wait_for_timeout(1000); await pg.fill('#bbA_mn','1')
                safe=[i for i in range(25)]
                await pg.click('#m2Board .mx-t >> nth=%d'%safe[0]); await pg.wait_for_timeout(150)
                M=await E("(()=>{const M=RIKI_M2.st();return {on:M.on,mines:[...M.mines]}})()")
            if M['on']:
                safe=[i for i in range(25) if i not in M['mines'] and not await E(f"RIKI_M2.st().open.has({i})")]
                b0=await E("S.bal")
                await pg.click('#m2Board .mx-t >> nth=%d'%safe[0]); await pg.wait_for_timeout(120)
                await pg.dblclick('#m2Go'); await pg.wait_for_timeout(300)
                b1=await E("S.bal"); s=await st(); print('round',r,'bal',b0,'->',b1,s)
                if s['on']: bugs.append('cashout did not end round')
        # 5 mina bosish
        await pg.wait_for_timeout(1000); await pg.fill('#bbA_mn','1')
        await pg.click('#m2Board .mx-t >> nth=24'); await pg.wait_for_timeout(150)
        M=await E("(()=>{const M=RIKI_M2.st();return {on:M.on,mines:[...M.mines]}})()")
        if M['on']:
            await pg.click('#m2Board .mx-t >> nth=%d'%M['mines'][0]); await pg.wait_for_timeout(100)
            s=await st(); print('boom',s)
            await pg.click('#m2Go'); await pg.click('#m2Board .mx-t >> nth=3'); s2=await st()
            if s2['on']: bugs.append('could start during boom animation')
            await pg.wait_for_timeout(1000); s=await st(); print('after boom',s)
        # 6 katta miqdor
        await pg.fill('#bbA_mn','999999'); await pg.click('#m2Board .mx-t >> nth=1'); await pg.wait_for_timeout(300); s=await st(); print('huge',s)
        if s['on']: bugs.append('huge bet started')
        await E("go('mines')")
        # 7 boshqa ekranga o'tib qaytish raund paytida
        await pg.fill('#bbA_mn','1'); await pg.click('#m2Board .mx-t >> nth=2'); await pg.wait_for_timeout(150)
        await E("go('home')"); await E("go('mines')"); s=await st(); print('reopen',s)
        print('BUGS',bugs); print('ERRS',errs[:10])
        await b.close()
asyncio.run(main())
