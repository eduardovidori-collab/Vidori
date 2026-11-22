"""Expanded museum in isolated Chromium profiles; accepts an optional live URL."""
from playwright.sync_api import sync_playwright, expect
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from pathlib import Path
import os, shutil, sys

server=None
if len(sys.argv)>1:url=sys.argv[1]
else:
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parents[1])))
    Thread(target=server.serve_forever,daemon=True).start()
    url=f'http://127.0.0.1:{server.server_port}/'
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':1600,'height':1100},reduced_motion='reduce',timezone_id='America/Sao_Paulo')
        p=context.new_page();errors=[]
        p.on('pageerror',lambda e:errors.append(str(e)))
        p.goto(url,wait_until='networkidle')
        p.evaluate('''()=>{
          config.mudo=true;config.notificar=false;
          ciclos=Array.from({length:13},(_,i)=>({id:'m'+i,nome:i===0?'Ciclo <img src=x onerror=window.museuXss=1>':'Tutoria '+(i+1),
            inicio:'2026-01-'+String(i+1).padStart(2,'0'),fimPrevisto:'2026-01-'+String(i+2).padStart(2,'0'),
            encerradoEm:'2026-01-'+String(i+2).padStart(2,'0'),
            congelado:{minutos:720,blocos:24,diasAtivos:12,maiorSequencia:8}}));
          config.trofeusSecundariosMuseu={versao:1,conquistas:ciclos.slice(0,2).map(c=>({id:'clinicas',nome:'Clínicas',cicloId:c.id}))};
          const now=Date.now();loja.inicioDinheiro=now-48*3600000;
          blocos=[{id:'museum-test-funds',inicio:now-600*60000,fim:now,minutos:600,dia:chaveDia(now),assunto:'Teste isolado'}];
          salvarBlocos();salvarLoja();salvarConfig();salvarCiclos();renderTudo();
        }''')
        snapshot=p.evaluate('JSON.stringify({ciclos,blocos,meuTime,loja,conquistas:config.trofeusSecundariosMuseu})')
        p.locator('[data-painel=estante]').click();p.locator('#entrarMuseu').click()
        assert p.locator('#museuTutorias').is_visible()
        assert p.locator('#cenaMuseu [data-ciclo-armario]').count()==6
        assert p.locator('#irCicloMuseu option').count()==13
        assert p.locator('#previaMuseu [data-ciclo-armario]').count()==2
        assert '1–6 de 13' in p.locator('#paginaMuseu').inner_text()
        # SVG gradients and trophy IDs are unique even with six cabinets.
        assert p.locator('#cenaMuseu [id]').evaluate_all('(els)=>new Set(els.map(e=>e.id)).size===els.length')
        seen=[]
        while True:
            seen+=p.locator('#cenaMuseu [data-ciclo-armario]').evaluate_all('(els)=>els.map(e=>e.dataset.cicloArmario)')
            if p.locator('#museuProximo').is_disabled():break
            p.locator('#museuProximo').click()
        assert len(seen)==13 and set(seen)=={f'm{i}' for i in range(13)}
        # Direct access selects the correct page and retains both trophy designs.
        p.locator('#irCicloMuseu').select_option('m0')
        assert p.locator('#cenaMuseu [data-ciclo-armario=m0]').count()==1
        assert p.locator('#cenaMuseu [data-material=ouro]').count()==1
        assert p.locator('#cenaMuseu [data-material=prata]').count()==1
        trophy=p.locator('#cenaMuseu [data-trofeu=clinicas]')
        trophy.focus();p.keyboard.press('Space')
        assert p.evaluate('estadoMuseu.trofeu')=='clinicas' and not p.evaluate('T.rodando')
        assert p.locator('#detalheTutoria [data-trofeu=clinicas]').get_attribute('aria-pressed')=='true'
        assert p.locator('#museuTutorias img').count()==0 and p.evaluate('typeof window.museuXss')=='undefined'
        for width,capacity in [(900,4),(390,2),(320,2),(1600,6)]:
            p.set_viewport_size({'width':width,'height':1000})
            p.wait_for_function('(n)=>capacidadeMuseu()===n',arg=capacity)
            expect(p.locator('#cenaMuseu [data-ciclo-armario=m0]')).to_have_count(1)
            assert p.locator('#irCicloMuseu').input_value()=='m0'
            assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
            assert p.evaluate('(()=>{const d=document.getElementById("museuTutorias");return d.scrollWidth<=d.clientWidth+1})()')
        assert p.evaluate('JSON.stringify({ciclos,blocos,meuTime,loja,conquistas:config.trofeusSecundariosMuseu})')==snapshot
        # Both existing finish levels work; an unsuccessful save never charges cash.
        before=p.evaluate('({cash:saldoDinheiro(),coins:saldoMoedas(),cycles:JSON.stringify(ciclos),team:JSON.stringify(meuTime)})')
        assert before['cash']>=500
        assert p.evaluate('''()=>{const original=Armazem.gravar;Armazem.gravar=()=>false;
          const result=melhorarMuseu();Armazem.gravar=original;return result===false&&nivelMuseu()===1}''')
        assert p.evaluate('saldoDinheiro()')==before['cash']
        p.locator('#melhorarMuseu').click()
        assert p.evaluate('nivelMuseu()')==2 and p.evaluate('saldoDinheiro()')==before['cash']-500
        assert not p.evaluate('melhorarMuseu()')
        assert p.evaluate('saldoMoedas()')==before['coins']
        assert p.evaluate('JSON.stringify(ciclos)')==before['cycles']
        assert p.evaluate('JSON.stringify(meuTime)')==before['team']
        assert p.locator('.museu-galeria').get_attribute('data-nivel')=='2'
        # Additional cycles appear automatically; current cycles require a real conquest.
        p.evaluate('''()=>{ciclos.push({id:'future',nome:'Novo ciclo concluído',inicio:'2026-02-01',fimPrevisto:'2026-02-28',encerradoEm:'2026-02-28',congelado:{minutos:900}});renderEstante()}''')
        assert p.locator('#irCicloMuseu option').count()==14
        p.locator('#irCicloMuseu').select_option('future')
        assert p.locator('#cenaMuseu [data-ciclo-armario=future] [data-trofeu=tutoria]').count()==1
        assert p.locator('#cenaMuseu [data-ciclo-armario=future] [data-trofeu=clinicas]').count()==0
        p.evaluate('''()=>{ciclos.push({id:'ongoing',nome:'Ciclo em andamento',inicio:'2026-03-01',fimPrevisto:'2026-03-28'});renderEstante()}''')
        assert p.locator('#irCicloMuseu option').count()==14
        p.evaluate('config.trofeusSecundariosMuseu.conquistas.push({id:"clinicas",nome:"Clínicas",cicloId:"ongoing"});renderEstante()')
        p.locator('#irCicloMuseu').select_option('ongoing')
        assert p.locator('#cenaMuseu [data-ciclo-armario=ongoing] [data-trofeu=tutoria]').count()==0
        assert p.locator('#cenaMuseu [data-ciclo-armario=ongoing] [data-trofeu=clinicas]').count()==1
        p.evaluate('salvarCiclos();salvarConfig();salvarLoja()')
        p.locator('#fecharMuseu').click()
        assert p.locator('#entrarMuseu').evaluate('(el)=>el===document.activeElement')
        p.evaluate('navigator.serviceWorker.ready');p.reload(wait_until='networkidle')
        context.set_offline(True);p.reload(wait_until='networkidle')
        p.locator('[data-painel=estante]').click();p.locator('#entrarMuseu').click()
        assert p.locator('#irCicloMuseu option').count()==15
        p.locator('#irCicloMuseu').select_option('m0')
        assert p.locator('#cenaMuseu [data-ciclo-armario=m0]').count()==1
        assert p.evaluate('nivelMuseu()')==2
        # Empty collections still reserve a readable cabinet and disable navigation.
        p.evaluate('ciclos=[];config.trofeusSecundariosMuseu.conquistas=[];renderEstante()')
        assert p.locator('#cenaMuseu [data-ciclo-armario=vazio]').count()==1
        assert p.locator('#irCicloMuseu').is_disabled()
        assert p.locator('#museuAnterior').is_disabled() and p.locator('#museuProximo').is_disabled()
        assert 'NaN' not in p.locator('#cenaMuseu').inner_html()
        assert not errors,errors
        browser.close()
        print('PASS',url,'expanded museum: 13+ cycles; 6/4/2 capacity; complete pagination; direct cycle access; unique SVG IDs; both trophies; keyboard/resize; readonly browsing; atomic R$500 upgrade; future/ongoing cycles; empty state; persistence/offline')
finally:
    if server:server.shutdown()
