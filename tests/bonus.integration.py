"""Daily cash milestones, migration and persistence in isolated browser storage.

Run: python tests/bonus.integration.py [optional deployed URL]
Requires Playwright and Chromium. No real browser profile is used.
"""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from pathlib import Path
from datetime import datetime, timezone
import json, os, shutil, sys

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
        context=browser.new_context(viewport={'width':1300,'height':1000},timezone_id='America/Sao_Paulo',accept_downloads=True)
        p=context.new_page();errors=[]
        p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept())
        # UTC is already Nov 22, while the user's local study date is Nov 21.
        p.clock.set_fixed_time(datetime(2026,11,22,1,tzinfo=timezone.utc))
        p.goto(url,wait_until='networkidle')
        p.evaluate('config.mudo=true;config.notificar=false;salvarConfig()')
        assert p.evaluate('chaveDia(new Date())')=='2026-11-21'
        roster=p.evaluate('JSON.stringify(meuTime)')
        p.evaluate('''()=>{
          window.seedBonus=(entries,startDay='2026-11-21')=>{
            loja=normalizarLoja({economiaVersao:3,inicioDinheiro:new Date(2026,10,1).getTime(),
              inicioBonusProlongado:diaDeChave(startDay).getTime()});
            blocos=entries.map(([day,minutes],i)=>{
              const fim=diaDeChave(day).getTime()+18*3600000;
              return {id:'bonus-test-'+i,dia:day,minutos:minutes,fim,inicio:fim-minutes*60000,assunto:'Teste isolado',cicloId:null};
            });
            salvarLoja();salvarBlocos();renderLoja();
          };
          window.bonusSnapshot=()=>({base:dinheiroBaseGanho(),bonus:bonusDiarioDinheiro(),saldo:saldoDinheiro(),coins:saldoMoedas()});
        }''')
        for minutes,bonus,total,coins in [(0,0,0,0),(59,0,78,11),(60,10,90,12),(149,10,208,29),(150,35,235,30),(180,35,275,36),(300,35,435,60)]:
            p.evaluate('(n)=>seedBonus(n?[["2026-11-21",n]]:[])',minutes)
            got=p.evaluate('bonusSnapshot()')
            assert got=={'base':total-bonus,'bonus':bonus,'saldo':total,'coins':coins},(minutes,got)
            assert p.locator('#progressoBonusProlongado').get_attribute('aria-valuemax')=='150'
            assert float(p.locator('#progressoBonusProlongado').get_attribute('aria-valuenow'))==min(minutes,150)
            assert ('feito' in p.locator('#bonusProlongadoDinheiro').get_attribute('class'))==(minutes>=150)
        # Three separate blocks combine; two separate dates never combine for 150.
        p.evaluate('seedBonus([["2026-11-21",50],["2026-11-21",50],["2026-11-21",50]])')
        assert p.evaluate('bonusSnapshot().saldo')==235
        p.evaluate('seedBonus([["2026-11-20",90],["2026-11-21",60]])')
        assert p.evaluate('bonusSnapshot().bonus')==20
        p.evaluate('seedBonus([["2026-11-20",150],["2026-11-21",150]])')
        assert p.evaluate('bonusSnapshot().bonus')==45  # Old date keeps only its existing R$10.
        p.evaluate('seedBonus([["2026-11-20",150],["2026-11-21",150]],"2026-11-20")')
        assert p.evaluate('bonusSnapshot().bonus')==70
        # Only the eligible portion of a block spanning cash activation counts.
        p.evaluate('''()=>{
          seedBonus([]);const day=diaDeChave('2026-11-21').getTime();loja.inicioDinheiro=day+14*3600000;
          blocos=[{id:'overlap',dia:'2026-11-21',minutos:150,inicio:day+12.5*3600000,fim:day+15*3600000}];renderLoja();
        }''')
        assert p.evaluate('bonusSnapshot().base')==80 and p.evaluate('bonusSnapshot().bonus')==10
        # Crossing each milestone announces once. A long block awards both together.
        p.evaluate('''()=>{
          seedBonus([['2026-11-21',59]]);window.bonusNotices=[];
          window.originalBonusNotice=mostrarAviso;mostrarAviso=(msg)=>bonusNotices.push(msg);
          registrarBloco(Date.now()-60000,Date.now(),'Sem ciclo',1);
          registrarBloco(Date.now()-89*60000,Date.now(),'Sem ciclo',89);
          registrarBloco(Date.now()-60000,Date.now(),'Sem ciclo',1);
          registrarBloco(Date.now()-30*60000,Date.now(),'Sem ciclo',30);
        }''')
        notices=[s.replace('\xa0',' ') for s in p.evaluate('bonusNotices')]
        assert len(notices)==2 and 'R$ 10' in notices[0] and 'R$ 25' in notices[1],notices
        assert p.evaluate('blocos.every(b=>b.cicloId===null)')
        p.evaluate('seedBonus([]);bonusNotices=[];registrarBloco(Date.now()-150*60000,Date.now(),"Sem ciclo",150);renderLoja()')
        notices=[s.replace('\xa0',' ') for s in p.evaluate('bonusNotices')]
        assert len(notices)==1 and 'R$ 35' in notices[0],notices
        assert p.evaluate('bonusSnapshot().saldo')==235
        for _ in range(3):p.evaluate('renderLoja();renderTudo()')
        assert p.evaluate('bonusSnapshot().saldo')==235
        p.evaluate('mostrarAviso=originalBonusNotice')
        # An existing v3 wallet migrates once, preserving its old cash and purchases.
        p.evaluate('''()=>{
          seedBonus([['2026-11-18',180],['2026-11-20',150]]);
          const legacy={...loja,gastas:120,niveis:{vestiario:1},comprados:['gol:virada']};
          delete legacy.inicioBonusProlongado;Armazem.gravar(CHAVES.loja,legacy);
        }''')
        p.reload(wait_until='networkidle')
        assert p.evaluate('bonusDiarioDinheiro()')==20
        assert p.evaluate('saldoDinheiro()')==340  # R$440 base + R$20 old bonuses - R$120 spent.
        assert p.evaluate('loja.niveis.vestiario')==1
        assert p.evaluate('loja.comprados.includes("gol:virada")')
        activation=p.evaluate('loja.inicioBonusProlongado')
        assert p.evaluate('chaveDia(loja.inicioBonusProlongado)')=='2026-11-21'
        p.reload(wait_until='networkidle');assert p.evaluate('loja.inicioBonusProlongado')==activation
        # Add today's 150 minutes, then preserve the earned amount across reload/export/import.
        p.evaluate('registrarBloco(Date.now()-150*60000,Date.now(),"Teste isolado",150);renderTudo()')
        assert p.evaluate('bonusDiarioDinheiro()')==55
        with p.expect_download() as dl:p.evaluate('exportarJSON()')
        backup=json.loads(Path(dl.value.path()).read_text())
        assert backup['loja']['inicioBonusProlongado']==activation
        expected=p.evaluate('saldoDinheiro()')
        p.reload(wait_until='networkidle');assert p.evaluate('saldoDinheiro()')==expected
        p.evaluate('blocos=[];salvarBlocos();renderTudo()')
        p.locator('#arquivoImport').set_input_files({'name':'bonus-backup.json','mimeType':'application/json','buffer':json.dumps(backup).encode()})
        p.wait_for_function('(n)=>blocos.length===n',arg=len(backup['blocos']))
        assert p.evaluate('saldoDinheiro()')==expected and p.evaluate('bonusDiarioDinheiro()')==55
        assert p.evaluate('JSON.stringify(meuTime)')==roster
        # Zeroing cash does not claim completed bonuses again; the next date earns its own.
        p.evaluate('zerarDinheiro();renderLoja()');assert p.evaluate('saldoDinheiro()')==0
        p.evaluate('registrarBloco(Date.now()-30*60000,Date.now(),"Outro bloco",30);renderTudo()')
        assert p.evaluate('saldoDinheiro()')==40
        p.clock.set_fixed_time(datetime(2026,11,23,1,tzinfo=timezone.utc))
        p.evaluate('renderLoja()')
        assert p.locator('#progressoBonusProlongado').get_attribute('aria-valuenow')=='0'
        p.evaluate('registrarBloco(Date.now()-150*60000,Date.now(),"Novo dia",150);renderTudo()')
        assert p.evaluate('saldoDinheiro()')==275
        assert p.evaluate('loja.inicioBonusProlongado')==activation
        p.locator('[data-painel=loja]').click()
        for width in [320,390,768,1300]:
            p.set_viewport_size({'width':width,'height':1000})
            assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
        p.evaluate('navigator.serviceWorker.ready');p.reload(wait_until='networkidle')
        context.set_offline(True);p.reload(wait_until='networkidle');p.locator('[data-painel=loja]').click()
        assert p.locator('#bonusProlongadoDinheiro').is_visible()
        assert p.evaluate('saldoDinheiro()')==275
        assert not errors,errors
        browser.close()
        print('PASS',url,'daily bonuses: 60/150 thresholds; stacking; one award per day; split blocks/dates; activation overlap; no retroactive credits; notifications; migration; reload/backup/import; zeroing; next day; Sao Paulo timezone; responsive/offline')
finally:
    if server:server.shutdown()
