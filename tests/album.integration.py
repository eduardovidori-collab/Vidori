"""Album flows in isolated Chromium storage. Run with an optional deployed URL.

Requires Playwright and Chromium; never touches an existing browser profile.
"""
from playwright.sync_api import sync_playwright, expect
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from pathlib import Path
import json, os, shutil, sys

server = None
if len(sys.argv)>1:
    url=sys.argv[1]
else:
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self,*args): pass
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parents[1])))
    Thread(target=server.serve_forever,daemon=True).start()
    url=f'http://127.0.0.1:{server.server_port}/'

try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':1440,'height':1100},reduced_motion='reduce',accept_downloads=True)
        p=context.new_page(); errors=[]
        p.on('pageerror',lambda e:errors.append(str(e)))
        p.on('dialog',lambda d:d.accept())
        p.goto(url,wait_until='networkidle')
        p.evaluate('config.mudo=true;config.notificar=false;salvarConfig()')
        original=p.evaluate('JSON.stringify({meuTime,loja,blocos})')
        catalog=p.evaluate('JOGADORES_SPFC.map(j=>j.id)'); total=len(catalog)
        p.locator('[data-painel=time]').click()
        assert p.locator('#timeEscalacao').is_visible()
        p.locator('#timeAbaAlbum').click()
        assert p.locator('#timeAlbum').is_visible() and not p.locator('#timeEscalacao').is_visible()
        assert p.locator('#albumPossuidas').inner_text()=='0'
        assert p.locator('#albumTotal').inner_text()==str(total)
        assert p.locator('.album-figurinha').count()==12
        assert p.locator('.album-figurinha.obtida').count()==0
        # Every catalog card appears exactly once, across all spreads.
        seen=[]
        while True:
            seen+=p.locator('[data-album-jogador]').evaluate_all('(els)=>els.map(e=>e.dataset.albumJogador)')
            if p.locator('#albumProxima').is_disabled(): break
            p.locator('#albumProxima').click()
        assert len(seen)==total and set(seen)==set(catalog)
        p.locator('#albumLivro').focus(); p.keyboard.press('ArrowLeft')
        assert not p.locator('#albumProxima').is_disabled()
        p.keyboard.press('Space'); assert not p.evaluate('T.rodando')
        assert p.evaluate('JSON.stringify({meuTime,loja,blocos})')==original
        # Restore a representative collection, including secondary positions and extras.
        p.evaluate('''()=>{
          const ids=['rogerio-ceni','rafael','liziero','nikao','dagoberto','pablo','rai'];
          meuTime=normalizarMeuTime({nome:'<img src=x onerror=window.albumXss=1>',
            jogadores:ids.map(id=>({id,quantidade:id==='liziero'?3:id==='rogerio-ceni'?2:1})),
            escalacao:{gol:'rogerio-ceni','mc-e':'liziero',ata:'pablo'}});
          salvarMeuTime();renderMeuTime();
        }''')
        state=p.evaluate('JSON.stringify({meuTime,loja,blocos})')
        assert p.locator('#albumPossuidas').inner_text()=='7'
        assert p.locator('#albumExtras').inner_text()=='3'
        assert p.locator('#albumFaltantes').inner_text()==str(total-7)
        assert p.locator('#timeAlbum img:not([data-foto-jogador])').count()==0
        assert p.evaluate('typeof window.albumXss')=='undefined'
        p.locator('#albumBusca').fill('ROGERIO')
        assert p.locator('[data-album-jogador]').count()==1
        assert p.locator('[data-album-jogador=rogerio-ceni]').get_attribute('data-obtida')=='true'
        number=p.locator('[data-album-jogador=rogerio-ceni] .album-numero').inner_text()
        assert p.locator('.album-copias').inner_text()=='+1 extra'
        # Clear filters and combine secondary position with collection status.
        p.locator('#albumLimpar').click()
        p.locator('#albumPosicao').select_option('VOL')
        p.locator('#albumSituacao').select_option('obtidas')
        assert p.locator('[data-album-jogador]').count()==1
        assert p.locator('[data-album-jogador=liziero] .album-copias').inner_text()=='+2 extras'
        p.locator('#albumPosicao').select_option('PD')
        assert p.locator('[data-album-jogador]').count()==1
        assert p.locator('[data-album-jogador=nikao]').count()==1
        # All filters intersect; no-result navigation is disabled and recoverable.
        p.locator('[data-album-raridade=lenda]').click()
        assert p.locator('.album-sem-resultados').is_visible()
        assert p.locator('#albumAnterior').is_disabled() and p.locator('#albumProxima').is_disabled()
        p.locator('.album-sem-resultados [data-album-limpar]').click()
        assert p.locator('[data-album-jogador=rogerio-ceni] .album-numero').inner_text()==number
        assert p.evaluate('JSON.stringify({meuTime,loja,blocos})')==state
        # Narrow layouts show one page; resizing preserves a valid reading position.
        p.locator('#albumProxima').click()
        for width in [320,390,650,760,768,900,1440]:
            p.set_viewport_size({'width':width,'height':1000})
            expected=6 if width<=760 else 12
            expect(p.locator('[data-album-jogador]')).to_have_count(expected)
            assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
        # Rarity counts are unique players, not copies or positions.
        p.locator('[data-album-raridade=lenda]').click()
        assert p.locator('.album-figurinha.obtida').count()==2
        p.locator('#albumLimpar').click()
        # Existing duplicate controls remain reachable from the album.
        p.locator('[data-time-repetidos]').click()
        assert p.locator('#timeEscalacao').is_visible() and p.locator('#tituloRepetidos').is_visible()
        p.locator('[data-time-vender=liziero]').click()
        p.locator('#timeAbaAlbum').click()
        assert p.locator('#albumExtras').inner_text()=='2'
        assert p.locator('#albumPossuidas').inner_text()=='7'
        assert p.evaluate('meuTime.escalacao["mc-e"]')=='liziero'
        # Field navigation must reveal the lineup when the album was selected.
        p.evaluate('posicaoTimeSelecionada="gol";focarPosicaoTime()')
        assert p.locator('#timeEscalacao').is_visible()
        assert p.locator('[data-time-pos=gol]').evaluate('(el)=>el===document.activeElement')
        p.locator('#timeAbaAlbum').click()
        # A real pack purchase updates the album immediately and deducts its usual cost.
        p.evaluate('blocos.push({id:"album-test-funds",dia:chaveDia(new Date()),minutos:100,assunto:"Teste isolado"});salvarBlocos();renderTudo()')
        before=p.evaluate('({saldo:saldoMoedas(),ids:meuTime.jogadores.map(j=>j.id)})')
        assert before['saldo']>=15
        assert p.evaluate('comprarPacoteBase()')
        p.wait_for_function('!document.getElementById("pacoteMeuTime").hidden')
        expected=p.evaluate('meuTime.jogadores.length')
        assert p.locator('#albumPossuidas').inner_text()==str(expected)
        assert p.evaluate('saldoMoedas()')==before['saldo']-15
        p.locator('#pacoteMeuTime').click()
        assert p.locator('#timeEscalacao').is_visible()
        p.locator('#timeAbaAlbum').click()
        # Persistence and backup use the existing roster, without a second album save.
        with p.expect_download() as dl: p.evaluate('exportarJSON()')
        backup=json.loads(Path(dl.value.path()).read_text())
        assert len(backup['meuTime']['jogadores'])==expected
        p.reload(wait_until='networkidle');p.locator('[data-painel=time]').click();p.locator('#timeAbaAlbum').click()
        assert p.locator('#albumPossuidas').inner_text()==str(expected)
        p.evaluate('resetarTime()')
        assert p.locator('#albumPossuidas').inner_text()=='0'
        assert p.locator('#albumExtras').inner_text()=='0'
        p.locator('#arquivoImport').set_input_files({'name':'album-backup.json','mimeType':'application/json','buffer':json.dumps(backup).encode()})
        p.wait_for_function('(n)=>meuTime.jogadores.length===n',arg=expected)
        assert p.locator('#albumPossuidas').inner_text()==str(expected)
        # A complete album reaches 100%; searching missing cards is an empty result.
        p.evaluate('meuTime=normalizarMeuTime({jogadores:JOGADORES_SPFC.map(j=>({id:j.id,quantidade:1}))});salvarMeuTime();renderMeuTime()')
        assert p.locator('#albumPorcentagem').inner_text()=='100%'
        assert 'Coleção completa' in p.locator('#albumMensagem').inner_text()
        p.locator('#albumSituacao').select_option('faltantes')
        assert p.locator('.album-sem-resultados').is_visible()
        p.locator('#albumLimpar').click()
        # Both new modules and the roster remain usable offline after installation.
        p.evaluate('navigator.serviceWorker.ready');p.reload(wait_until='networkidle')
        context.set_offline(True);p.reload(wait_until='networkidle')
        p.locator('[data-painel=time]').click();p.locator('#timeAbaAlbum').click()
        assert p.locator('#albumPorcentagem').inner_text()=='100%'
        assert p.locator('[data-album-jogador]').count()==12
        p.locator('#timeAbaAlbum').focus();p.keyboard.press('ArrowLeft')
        assert p.locator('#timeAbaEscalacao').get_attribute('aria-selected')=='true'
        p.keyboard.press('ArrowRight');assert p.locator('#timeAlbum').is_visible()
        assert not errors,errors
        browser.close()
        print('PASS',url,'album: full catalog once; owned/missing/extras; accent search; secondary positions; rarity filters; pagination/resize/keyboard; read-only browsing; sales/lineup/pack/reset; backup/restore; completion; offline')
finally:
    if server:server.shutdown()
