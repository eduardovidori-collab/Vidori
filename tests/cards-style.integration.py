"""Shield card presentation, attribute coverage and responsive layout.

Run: python tests/cards-style.integration.py [optional deployed URL].
Uses an isolated browser profile; never touches existing study or collection data.
"""
from playwright.sync_api import sync_playwright
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
 Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
  c=b.new_context(viewport={'width':1440,'height':1300},device_scale_factor=2,reduced_motion='reduce')
  p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(url,wait_until='networkidle');p.evaluate('config.mudo=true;config.notificar=false;salvarConfig()')
  assert p.evaluate('JOGADORES_SPFC.every(j=>atributosDoJogador(j).length===6&&atributosDoJogador(j).every(a=>Number.isInteger(a.valor)&&a.valor>=1&&a.valor<=100))')
  assert p.evaluate('Object.keys(ATRIBUTOS_JOGADORES).length===JOGADORES_SPFC.length')
  assert p.evaluate('ATRIBUTOS_JOGADORES["rogerio-ceni"]')==[99,98,100,99,78,100]
  assert p.evaluate('ATRIBUTOS_JOGADORES.lugano[4]>ATRIBUTOS_JOGADORES.lugano[3]')
  assert p.evaluate('nacionalidadeDoJogador(JOGADORES_SPFC.find(j=>j.id==="lugano")).nome')=='Uruguai'
  assert p.evaluate('nacionalidadeDoJogador(JOGADORES_SPFC.find(j=>j.id==="calleri")).nome')=='Argentina'
  assert p.evaluate('ATRIBUTOS_JOGADORES["denilson-show"][3]>ATRIBUTOS_JOGADORES["denilson-show"][4]')
  initial=p.evaluate('JSON.stringify({meuTime,loja,blocos})')
  p.evaluate('irParaPainel("time");selecionarVisaoDoTime("album")')
  assert p.locator('.carta-futebol.faltante').count()==12
  assert p.locator('#timeAlbum img').count()==0
  p.locator('.album-atributos-ajuda summary').focus();p.keyboard.press('Space')
  assert p.locator('.album-atributos-ajuda').get_attribute('open') is not None
  assert not p.evaluate('T.rodando')
  assert p.evaluate('JSON.stringify({meuTime,loja,blocos})')==initial
  # Preserve the real player records; only ownership is a test fixture.
  p.evaluate('''()=>{
   meuTime=normalizarMeuTime({jogadores:JOGADORES_SPFC.map(j=>({id:j.id,quantidade:1}))});
   salvarMeuTime();renderMeuTime();
  }''')
  state=p.evaluate('JSON.stringify({meuTime,loja,blocos})')
  for rarity in ['comum','raro','epico','idolo','lenda']:
   p.locator('[data-album-raridade='+rarity+']').click()
   assert p.locator('.carta-futebol.obtida').count()>0
   assert p.locator('.carta-futebol .carta-futebol-atributos>span').count()==6*p.locator('.carta-futebol').count()
   assert p.locator('.carta-futebol .carta-futebol-raridade').first.inner_text()
  p.locator('#albumLimpar').click()
  # Every page, including long names and multiposition cards, has readable text.
  for width in [320,390,650,760,900,1440]:
   p.set_viewport_size({'width':width,'height':1300})
   p.locator('#albumBusca').fill('Aloísio Boi')
   assert p.locator('[data-album-jogador=aloisio-boi-bandido]').count()==1
   assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
   assert p.locator('.carta-futebol-nome').evaluate('(el)=>el.scrollWidth<=el.clientWidth+1'),width
   assert p.locator('.carta-futebol-atributos').evaluate('(el)=>el.scrollWidth<=el.clientWidth+1'),width
   p.locator('#albumBusca').fill('Dagoberto')
   assert 'ATA / PE' in p.locator('.carta-futebol-outras-posicoes').inner_text()
   p.locator('#albumBusca').fill('Rogério')
   card=p.locator('[data-album-jogador=rogerio-ceni]')
   assert card.locator('.carta-futebol-nota').inner_text().replace('\n','')=='100GOL'
   assert [x.strip() for x in card.locator('.carta-futebol-atributos abbr').all_text_contents()]==['ELA','REF','MAN','VEL','REP','POS']
   assert card.locator('.carta-futebol-moldura').is_visible()
   assert card.locator('[data-foto-jogador]').count()==1
  assert p.evaluate('JSON.stringify({meuTime,loja,blocos})')==state
  artifacts=Path('/workspace/artifacts');artifacts.mkdir(exist_ok=True)
  # Capture the real component at a large display size, without changing the app.
  p.evaluate('''()=>{
   const section=document.createElement('section');section.id='cartasPrevia';
   section.style='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;max-width:1000px;margin:25px auto;padding:30px;background:#eae6d9';
   section.innerHTML=['rogerio-ceni','denilson-show','dagoberto','luiz-araujo','orejuela','rai'].map(id=>cartaDoJogador(JOGADORES_SPFC.find(j=>j.id===id),{modo:'pacote'})).join('');
   document.body.append(section);
  }''')
  p.locator('#cartasPrevia').scroll_into_view_if_needed()
  p.wait_for_function('Array.from(document.querySelectorAll("#cartasPrevia img")).every(i=>i.complete&&i.naturalWidth>0)')
  p.locator('#cartasPrevia').screenshot(path=str(artifacts/'cartas-estilo-fifa-preview.png'))
  p.locator('#cartasPrevia .carta-futebol').first.screenshot(path=str(artifacts/'carta-rogerio-ceni-implementada.png'))
  p.evaluate('document.querySelector("#cartasPrevia").remove()')
  # The pack uses the same actual values as the album and retains its existing message.
  p.evaluate('meuTime.ultimoPacote=[{id:"rogerio-ceni",nova:true},{id:"dagoberto",nova:false}];abrirResultadoPacote(false)')
  assert p.locator('#cartasDoPacote .carta-futebol').count()==2
  assert p.locator('#cartasDoPacote .carta-futebol-atributos>span').count()==12
  assert p.locator('#cartasDoPacote .carta-futebol').first.locator('.carta-futebol-atributos span:has(abbr[title="Reposição"]) b').inner_text()=='100'
  for width in [320,390,760,1440]:
   p.set_viewport_size({'width':width,'height':1000})
   assert p.locator('#modalPacote .modal-caixa').evaluate('(el)=>el.scrollWidth<=el.clientWidth+1')
   assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   if width<=390:
    assert float(p.locator('#cartasDoPacote .carta-futebol-atributos b').first.evaluate('(el)=>getComputedStyle(el).fontSize').replace('px',''))>=12
  # All decorative gradients and clipping paths are unique across simultaneous instances.
  assert p.evaluate('''()=>{
   const ids=Array.from(document.querySelectorAll('.carta-futebol svg [id]')).map(el=>el.id);
   return ids.length===new Set(ids).size;
  }''')
  p.evaluate('fecharModalPacote()')
  p.evaluate('async()=>await navigator.serviceWorker.ready');p.reload(wait_until='networkidle')
  c.set_offline(True);p.reload(wait_until='domcontentloaded')
  p.evaluate('irParaPainel("time");selecionarVisaoDoTime("album")')
  p.locator('#albumBusca').fill('Rogério')
  assert p.locator('.carta-futebol-atributos>span').count()==6
  assert p.locator('.carta-futebol-nota').inner_text().replace('\n','')=='100GOL'
  assert not errors,errors
  print('PASS',url,'attributes for all players; keeper/outfield profiles; all rarity finishes; responsive names/stats/pack; help keyboard; SVG isolation; unchanged roster/wallet; shared card renderer; offline')
  b.close()
finally:
 if server:server.shutdown();server.server_close()
