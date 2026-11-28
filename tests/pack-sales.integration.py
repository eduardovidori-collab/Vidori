"""Atomic duplicate sales in pack reveal, complete portrait coverage and offline assets."""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from pathlib import Path
import shutil,sys
server=None
if len(sys.argv)>1:url=sys.argv[1]
else:
 class Quiet(SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parents[1])))
 Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
  c=b.new_context(viewport={'width':1100,'height':1200});p=c.new_page();errors=[]
  p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(url,wait_until='networkidle');p.evaluate('config.mudo=true;config.notificar=false;salvarConfig();irParaPainel("loja")')
  # Every real catalog record has a distinct valid source slot, decodable offline.
  assert p.evaluate('Object.keys(FOTOS_JOGADORES).length===90&&JOGADORES_SPFC.every(j=>FOTOS_JOGADORES[j.id])')
  assert p.evaluate('''async()=>{
   const entries=JOGADORES_SPFC.map(j=>FOTOS_JOGADORES[j.id]);
   const slots=entries.map(f=>(f.arquivo||'lendas-retratos.png')+':'+(f.coluna||0)+':'+(f.linha||0));
   if(new Set(slots).size!==90)return false;
   return (await Promise.all([...new Set(entries.map(f=>f.arquivo||'lendas-retratos.png'))].map(async file=>{
    const r=await fetch('./imagens/jogadores/'+file+'?v='+(file==='lendas-retratos.png'?'140':'142'));
    const im=await createImageBitmap(await r.blob());const ok=im.width>=180&&im.height>=180;im.close();return ok;
   }))).every(Boolean);
  }''')
  for id,price in [('pablo',5),('rafael',7),('antony',10),('lugano',15),('rogerio-ceni',20)]:
   p.evaluate('''id=>{
    fecharModalPacote();meuTime=normalizarMeuTime({jogadores:[{id,quantidade:6},{id:'orejuela',quantidade:1}],ultimoPacote:[{id,nova:false},{id:'orejuela',nova:true}],escalacao:id==='rogerio-ceni'?{gol:id}:{}});
    salvarMeuTime();renderMeuTime();renderLoja();abrirResultadoPacote(true);
   }''',id)
   assert not p.evaluate("id=>venderJogadorRepetido(id,6,'pacote')",id), 'cannot sell during animation'
   button=p.locator(f'[data-pacote-vender="{id}"]');button.wait_for(state='visible')
   assert f'+{price} moedas' in button.inner_text()
   assert p.locator('[data-pacote-vender="orejuela"]').count()==0
   before=p.evaluate('({saldo:saldoMoedas(),dinheiro:saldoDinheiro(),time:JSON.stringify(meuTime)})')
   # Failed persistence must change neither cards nor financial state.
   assert p.evaluate("id=>{const save=Armazem.gravar;Armazem.gravar=()=>false;const ok=venderJogadorRepetido(id,6,'pacote');Armazem.gravar=save;return !ok}",id)
   assert p.evaluate('JSON.stringify(meuTime)')==before['time']
   button.click()
   assert p.evaluate('saldoMoedas()')==before['saldo']+price
   assert p.evaluate('saldoDinheiro()')==before['dinheiro']
   assert p.evaluate('id=>meuTime.jogadores.find(j=>j.id===id).quantidade',id)==5
   assert p.locator('.carta-venda-concluida').count()==1
   assert not p.evaluate("id=>venderJogadorRepetido(id,5,'pacote')",id)
   p.evaluate('fecharModalPacote();abrirResultadoPacote(false)')
   assert p.locator('[data-pacote-vender]').count()==0
   if id=='rogerio-ceni':
    assert p.evaluate('meuTime.escalacao.gol')==id
    p.locator('#modalPacote .modal-caixa').screenshot(path='/workspace/artifacts/pacote-venda-repetidos.png')
  p.reload(wait_until='networkidle');p.evaluate('irParaPainel("loja");abrirResultadoPacote(false)')
  assert p.locator('.carta-venda-concluida').count()==1
  assert p.locator('[data-pacote-vender]').count()==0
  # Final copy is never sellable, even if a stale result calls it duplicate.
  p.evaluate("fecharModalPacote();meuTime.jogadores.find(j=>j.id==='rogerio-ceni').quantidade=1;meuTime.ultimoPacote[0].vendida=false;abrirResultadoPacote(false)")
  assert not p.evaluate("venderJogadorRepetido('rogerio-ceni',1,'pacote')")
  # The next actual purchase can sell its own freshly drawn extra, exactly once.
  p.evaluate('''()=>{
   fecharModalPacote();meuTime.moedasVendas=100;
   const draw=sortearJogadorDoPacote;sortearJogadorDoPacote=ex=>JOGADORES_SPFC.find(j=>j.id===(ex?'orejuela':'rogerio-ceni'));
   window.compraTeste=comprarPacoteBase();sortearJogadorDoPacote=draw;
  }''')
  assert p.evaluate('compraTeste')
  p.locator('[data-pacote-vender="rogerio-ceni"]').click()
  assert p.evaluate("meuTime.jogadores.find(j=>j.id==='rogerio-ceni').quantidade") ==1
  assert p.evaluate("meuTime.ultimoPacote.find(j=>j.id==='rogerio-ceni').vendida")
  for width in [320,390,1100]:
   p.set_viewport_size({'width':width,'height':1000})
   assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  # Pack screenshot with actionable duplicate sale, not already sold.
  p.evaluate('''()=>{
   fecharModalPacote();meuTime=normalizarMeuTime({jogadores:[{id:'denilson-show',quantidade:2},{id:'aloisio-chulapa',quantidade:1}],ultimoPacote:[{id:'denilson-show',nova:false},{id:'aloisio-chulapa',nova:true}]});salvarMeuTime();abrirResultadoPacote(false);
  }''')
  p.set_viewport_size({'width':1100,'height':1200})
  p.wait_for_function('Array.from(document.querySelectorAll("#cartasDoPacote img")).every(i=>i.complete&&i.naturalWidth)')
  p.locator('#modalPacote .modal-caixa').screenshot(path='/workspace/artifacts/pacote-venda-repetidos.png')
  p.evaluate('async()=>await navigator.serviceWorker.ready');p.reload(wait_until='networkidle')
  c.set_offline(True);p.reload(wait_until='domcontentloaded')
  p.evaluate('irParaPainel("loja");abrirResultadoPacote(false)')
  assert p.locator('[data-pacote-vender="denilson-show"]').count()==1
  p.locator('[data-pacote-vender="denilson-show"]').click()
  assert p.locator('.carta-venda-concluida').count()==1
  assert p.evaluate('''async()=> (await Promise.all([...new Set(Object.values(FOTOS_JOGADORES).map(f=>f.arquivo||'lendas-retratos.png'))].map(async file=>{
   const r=await fetch('./imagens/jogadores/'+file+'?v='+(file==='lendas-retratos.png'?'140':'142'));const im=await createImageBitmap(await r.blob());im.close();return r.ok;
  }))).every(Boolean)''')
  assert not errors,errors
  print('PASS',url,'90 unique portraits decode online/offline; all sale tiers; animation guard; atomic failure; one sale per drawn copy; final copy; lineup; reload; next purchase; mobile; offline sale')
  b.close()
finally:
 if server:server.shutdown();server.server_close()
