"""Café decorations, stadium interior and four new cards. Uses isolated storage only."""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from pathlib import Path
import sys,shutil,json
server=None
if len(sys.argv)>1:url=sys.argv[1]
else:
 class Quiet(SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parents[1])))
 Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox']);c=b.new_context(viewport={'width':1440,'height':1500},reduced_motion='reduce',accept_downloads=True);p=c.new_page();errors=[]
  p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept())
  p.goto(url,wait_until='networkidle');p.evaluate('config.mudo=true;config.notificar=false;salvarConfig()')
  assert not p.evaluate('abrirPersonalizacaoCafe()')
  # Old wallets start with free objects and receive no extra money/cards.
  assert p.evaluate('loja.decoracaoCafe.gastas')==0
  assert len(p.evaluate('loja.decoracaoCafe.comprados'))==3
  assert p.evaluate('JOGADORES_SPFC.length')==90
  assert p.evaluate('JOGADORES_SPFC.slice(-4).map(j=>[j.id,j.ovr,rotuloPosicoes(j),raridadeDoJogador(j).id])')==[['patryck-lanza',58,'LE','comum'],['juan',60,'ATA','comum'],['ferraresi',70,'ZAG','raro'],['danielzinho',71,'MC / VOL','raro']]
  assert p.evaluate('JOGADORES_SPFC.every(j=>atributosDoJogador(j).length===6&&FOTOS_JOGADORES[j.id])')
  assert p.evaluate('nacionalidadeDoJogador(JOGADORES_SPFC.find(j=>j.id==="ferraresi")).codigo')=='VE'
  p.evaluate('''()=>{
   loja.niveis={arredores:1,cafeteria:1};loja.inicioDinheiro=Date.now()-2000*60000;
   blocos=[{id:'study-fixture',dia:chaveDia(new Date()),minutos:1000,inicio:Date.now()-1000*60000,fim:Date.now(),assunto:'Teste isolado'}];salvarBlocos();salvarLoja();renderTudo();abrirCafe();
  }''')
  assert p.locator('.cafe-planta').is_visible()
  assert p.locator('.cafe-luminaria').bounding_box()['width']>=80
  p.locator('#cafeNotas').fill('Caderno preservado durante a decoração');p.locator('#cafeNotas').press('Tab');p.evaluate('salvarCafe()')
  p.locator('#cafeDuracao').fill('10');p.locator('#cafeDuracao').press('Tab');p.locator('#cafePrincipal').click()
  timer=p.evaluate('T.fimAlvo');coins=p.evaluate('saldoMoedas()');before=p.evaluate('saldoDinheiro()')
  p.locator('[data-personalizar-cafe]').click();assert p.locator('#personalizarCafe').is_visible()
  p.locator('[data-cafe-preview="caneca-escudo"]').click()
  assert p.locator('.cafe-caneca').get_attribute('data-objeto-cafe')=='caneca-escudo'
  assert p.evaluate('saldoDinheiro()')==before
  p.locator('#fecharObjetosCafe').click()
  p.wait_for_function('document.querySelector(".cafe-caneca").dataset.objetoCafe==="caneca-tricolor"')
  assert p.evaluate('loja.decoracaoCafe.comprados.includes("caneca-escudo")') is False
  # Purchase failure changes neither cash, objects nor notebook/timer.
  p.locator('[data-personalizar-cafe]').click()
  assert not p.evaluate('''()=>{const f=Armazem.gravar;Armazem.gravar=()=>false;const ok=adquirirObjetoCafe('caneca-escudo');Armazem.gravar=f;return ok}''')
  assert p.evaluate('saldoDinheiro()')==before
  p.locator('[data-cafe-adquirir="caneca-escudo"]').click()
  assert p.evaluate('saldoDinheiro()')==before-45
  assert p.evaluate('loja.decoracaoCafe.gastas')==45
  assert not p.evaluate('adquirirObjetoCafe("caneca-escudo")')
  p.locator('[data-cafe-adquirir="caneca-tricolor"]').click()
  p.locator('[data-cafe-adquirir="caneca-escudo"]').click()
  assert p.evaluate('saldoDinheiro()')==before-45
  p.locator('[data-cafe-aba="planta"]').click();p.locator('[data-cafe-preview="planta-suculenta"]').click()
  p.locator('[data-cafe-adquirir="planta-suculenta"]').click()
  p.locator('[data-cafe-aba="luz"]').click();p.locator('[data-cafe-adquirir="luz-cobre"]').click()
  assert p.evaluate('saldoDinheiro()')==before-165
  assert p.evaluate('saldoMoedas()')==coins
  assert p.evaluate('T.fimAlvo')==timer
  assert p.locator('#cafeNotas').input_value()=='Caderno preservado durante a decoração'
  # A limited balance cannot buy an unowned item, even through the function.
  p.evaluate('window.cashReserve=loja.reaisZerados;loja.reaisZerados+=saldoDinheiro()-20;renderCatalogoObjetosCafe()')
  assert p.locator('[data-cafe-adquirir="luz-linho"]').is_disabled()
  assert not p.evaluate('adquirirObjetoCafe("luz-linho")')
  p.evaluate('loja.reaisZerados=cashReserve;renderCatalogoObjetosCafe()')
  for width in [320,390,768,1440]:
   p.set_viewport_size({'width':width,'height':1500})
   assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
   p.wait_for_function('(()=>{const e=document.querySelector("#personalizarCafe");return e.scrollWidth<=e.clientWidth+1})()')
  p.locator('#personalizarCafe').focus();p.keyboard.press('r')
  assert p.evaluate('T.fimAlvo')==timer
  p.locator('#fecharObjetosCafe').click()
  p.locator('.cafe-sala').screenshot(path='/workspace/artifacts/cafe-personalizado-atualizacao.png')
  p.locator('.cafe-caneca [data-cafe-categoria]').click()
  assert p.locator('[data-cafe-aba=caneca]').get_attribute('aria-pressed')=='true'
  p.keyboard.press('Escape');assert not p.locator('#personalizarCafe').is_visible()
  p.reload(wait_until='networkidle');p.evaluate('abrirCafe()')
  assert p.locator('.cafe-caneca').get_attribute('data-objeto-cafe')=='caneca-escudo'
  assert p.locator('.cafe-planta').get_attribute('data-objeto-cafe')=='planta-suculenta'
  assert p.locator('.cafe-sala').get_attribute('data-luz-cafe')=='luz-cobre'
  with p.expect_download() as d:p.evaluate('exportarJSON()')
  backup=json.loads(Path(d.value.path()).read_text());assert backup['loja']['decoracaoCafe']['gastas']==165
  p.evaluate('loja.decoracaoCafe=normalizarDecoracaoCafe(null);salvarLoja()')
  p.locator('#arquivoImport').set_input_files({'name':'cafe.json','mimeType':'application/json','buffer':json.dumps(backup).encode()})
  p.wait_for_function('loja.decoracaoCafe.gastas===165')
  assert p.evaluate('saldoDinheiro()')==before-165
  # Resetting stadium/sounds refunds only their own spend; decor stays owned and paid.
  p.evaluate('loja.gastas=100;salvarLoja()');cash=p.evaluate('saldoDinheiro()')
  p.evaluate('resetarLoja()');assert p.evaluate('saldoDinheiro()')==cash+100
  assert p.evaluate('loja.decoracaoCafe.gastas')==165
  p.evaluate('zerarDinheiro()');assert p.evaluate('saldoDinheiro()')==0
  p.evaluate('renderLoja()');assert p.evaluate('saldoDinheiro()')==0
  # New player cards have real local portraits; the dual position is usable in either slot.
  p.evaluate('''()=>{meuTime=normalizarMeuTime({jogadores:JOGADORES_SPFC.slice(-4).map(j=>({id:j.id,quantidade:1}))});salvarMeuTime();renderMeuTime();irParaPainel('time');selecionarVisaoDoTime('album');}''')
  assert p.evaluate('''()=>{const j=JOGADORES_SPFC.find(j=>j.id==='danielzinho');return posicaoDoJogadorNaVaga(j,POSICOES_TIME.find(p=>p.id==='vol'))==='VOL'&&posicaoDoJogadorNaVaga(j,POSICOES_TIME.find(p=>p.id==='mc-e'))==='MC'}''')
  p.evaluate('''()=>{const el=document.createElement('section');el.id='novasCartas146';el.style='display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:25px;background:#f7f2e6;width:1150px;max-width:100%;margin:20px auto';el.innerHTML=JOGADORES_SPFC.slice(-4).map(j=>cartaDoJogador(j,{modo:'pacote'})).join('');document.body.append(el)}''')
  p.locator('#novasCartas146').scroll_into_view_if_needed()
  p.wait_for_function('Array.from(document.querySelectorAll("#novasCartas146 img")).every(i=>i.complete&&i.naturalWidth>0)')
  p.evaluate('document.querySelector("#avisos").replaceChildren()')
  p.locator('#novasCartas146').screenshot(path='/workspace/artifacts/atualizacao-quatro-cartas.png')
  p.evaluate('document.querySelector("#novasCartas146").remove();irParaPainel("estadio")')
  # Distinct projections, crowd density and purchased structures follow each profile.
  p.evaluate("loja.niveis={arredores:4,cafeteria:3,publico:2,gramado:2,mosaico:1,cobertura:2,refletores:1,anel:2,camarotes:2,placar:1};renderTudo();abrirVisitaArquibancada('norte')")
  assert p.locator('[data-vista-perspectiva=lateral]').count()==1
  path_north=p.locator('#cenaVisitaArquibancada [data-vista-gol="0"]').inner_html()
  for setor in ['norte','sul','leste','oeste']:
   p.locator('[data-visita-setor="'+setor+'"]').click()
   assert p.locator('[data-vista-setor="'+setor+'"]').count()==1
   assert p.locator('[data-vista-perspectiva="'+('lateral' if setor in ['norte','sul'] else 'gol')+'"]').count()==1
   assert p.locator('#cenaVisitaArquibancada [data-vista-cobertura]').count()==1
   assert p.locator('#cenaVisitaArquibancada [data-vista-camarotes]').count()==1
   assert p.locator('#cenaVisitaArquibancada [data-vista-camarote-sala]').count()==(3 if setor in ['norte','sul'] else 6)
   assert p.locator('#cenaVisitaArquibancada [data-vista-gol]').count()==2
  assert p.locator('#cenaVisitaArquibancada [data-vista-gol="0"]').inner_html()!=path_north
  p.locator('[data-visita-setor=norte]').click()
  p.locator('[data-torcida-acao=mosaico]').click()
  assert p.locator('.visita-paisagem').get_attribute('data-efeito')=='mosaico'
  assert p.locator('#energiaTorcidaVisita').get_attribute('aria-valuenow')=='20'
  p.locator('[data-visita-bandeirao=tricolor]').click()
  assert p.locator('[data-vista-bandeirao]').count()==1
  for periodo in ['dia','entardecer','noite']:
   p.evaluate('(periodo)=>salvarAmbienteEstadio({periodo,clima:"limpo"})',periodo)
   p.evaluate('renderVisitaArquibancada()')
   assert p.locator('#cenaVisitaArquibancada [data-ceu-ambiente="'+periodo+'"]').count()==1
  for width in [320,390,768,1440]:
   p.set_viewport_size({'width':width,'height':1500})
   assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   p.wait_for_function('(()=>{const e=document.querySelector("#visitaArquibancada");return e.scrollWidth<=e.clientWidth+1})()')
  p.locator('#cenaVisitaArquibancada').screenshot(path='/workspace/artifacts/torcida-atualizacao-noite.png')
  p.locator('#aproximarVisita').click();assert p.locator('#cenaVisitaArquibancada svg').get_attribute('viewBox')!='0 0 1200 720'
  p.evaluate('loja.niveis.publico=0;renderVisitaArquibancada()');assert p.locator('#cenaVisitaArquibancada .torcedor-visita').count()==0
  p.locator('#fecharVisitaArquibancada').click()
  # Offline reload preserves both paid decor and every new photo.
  p.evaluate('loja.niveis.cafeteria=3;salvarLoja()');p.evaluate('async()=>await navigator.serviceWorker.ready');p.reload(wait_until='networkidle')
  c.set_offline(True);p.reload(wait_until='domcontentloaded');p.evaluate('abrirCafe()')
  assert p.locator('.cafe-caneca').get_attribute('data-objeto-cafe')=='caneca-escudo'
  assert p.evaluate('''async()=> (await Promise.all(JOGADORES_SPFC.slice(-4).map(async j=>{
   const r=await fetch('./imagens/jogadores/'+FOTOS_JOGADORES[j.id].arquivo+'?v=146');const im=await createImageBitmap(await r.blob());im.close();return r.ok;
  }))).every(Boolean)''')
  assert not errors,errors
  print('PASS',url,'decor previews/purchases/ownership; atomic cash; reset/refund separation; notebook/shared timer; restore/offline; 90 cards and new portraits; Danielzinho MC/VOL; 4 stadium views; upgrades/crowd; mobile/reduced motion')
  b.close()
finally:
 if server:server.shutdown();server.server_close()
