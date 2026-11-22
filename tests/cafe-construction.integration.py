"""Café construction and progression in isolated Chromium profiles.

Run: python tests/cafe-construction.integration.py [optional deployed URL]
Requires: pip install playwright; Chromium installed or CHROMIUM_PATH set.
"""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
import pathlib, json, sys, os, shutil
server=None
if len(sys.argv)>1:url=sys.argv[1]
else:
 class Quiet(SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(pathlib.Path(__file__).resolve().parents[1])))
 Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
  c=b.new_context(viewport={'width':1440,'height':1000},timezone_id='America/Sao_Paulo',accept_downloads=True)
  p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept())
  p.goto(url,wait_until='networkidle');p.evaluate('config.mudo=true;config.notificar=false;salvarConfig()')
  assert not p.evaluate('cafeDisponivel()')
  assert p.locator('[data-arredores="cafeteria"]').count()==0
  assert p.locator('[data-estadio-grupo="cafeteria"]').count()==0
  assert not p.evaluate('comprarNivel("cafeteria",1)')
  assert p.evaluate('loja.gastas')==0
  p.locator('.cafe-convite [data-entrar-cafe]').click()
  assert p.locator('#painel-estadio').is_visible()
  assert p.locator('#tituloObraEstadio').inner_text()=='Arredores'
  assert not p.locator('#painel-cafe').is_visible()
  p.locator('#fecharObraEstadio').click()
  # Simulated study credits exist only in this isolated browser profile.
  p.evaluate("""()=>{const fim=Date.now();loja.inicioDinheiro=fim-90000000;
   blocos=[{id:'cafe-test',dia:chaveDia(new Date()),minutos:1000,inicio:fim-60000000,fim,assunto:'Teste'}];
   salvarBlocos();salvarLoja();renderTudo();}""")
  coins=p.evaluate('saldoMoedas()');cash=p.evaluate('saldoDinheiro()')
  assert not p.evaluate('comprarNivel("cafeteria",2)')
  assert p.evaluate('saldoDinheiro()')==cash
  assert p.evaluate('comprarNivel("arredores",1)')
  assert p.evaluate('saldoDinheiro()')==cash-250
  assert p.locator('[data-arredores="predio"]').count()==0
  assert p.locator('#caixaEstadio [data-cafe-nivel="0"]').count()==1
  assert p.locator('[data-abrir-cafe]').count()==0
  construction=p.locator('#caixaEstadio [data-projeto-cafe]');construction.focus();construction.press('Enter')
  assert p.locator('#tituloObraEstadio').inner_text()=='Café do Morumbi'
  button=p.locator('[data-obra-comprar="cafeteria"]')
  assert button.get_attribute('data-obra-nivel')=='1' and '200' in button.inner_text()
  # Both purchase entry points enforce insufficient funds before changing ownership.
  p.evaluate('window.reservaCafe=loja.reaisZerados;loja.reaisZerados=saldoDinheiro()-199;renderDetalheObraEstadio()')
  assert p.locator('[data-obra-comprar="cafeteria"]').is_disabled()
  assert not p.evaluate('comprarNivel("cafeteria",1)')
  assert p.evaluate('saldoDinheiro()')==199
  p.evaluate('loja.reaisZerados=reservaCafe;renderDetalheObraEstadio()')
  # Storage failures must not charge cash or open the cafe.
  p.evaluate('window.gravarOriginal=Armazem.gravar;Armazem.gravar=()=>false')
  assert not p.evaluate('comprarNivel("cafeteria",1)')
  assert not p.evaluate('cafeDisponivel()') and p.evaluate('saldoDinheiro()')==cash-250
  p.evaluate('Armazem.gravar=gravarOriginal')
  button.click();assert p.evaluate('cafeDisponivel()')
  assert p.evaluate('saldoDinheiro()')==cash-450
  assert 'cafeteria nível 1 aberta' in p.locator('#legendaEstadio').inner_text()
  assert p.evaluate('saldoMoedas()')==coins
  assert not p.evaluate('comprarNivel("cafeteria",1)')
  assert p.locator('#caixaEstadio [data-cafe-nivel="1"]').count()==1
  p.locator('#caixaEstadio [data-abrir-cafe]').click()
  assert p.locator('#painel-cafe').is_visible()
  assert p.locator('.cafe-sala').get_attribute('data-nivel')=='1'
  assert not p.locator('.cafe-estante-parede').is_visible()
  p.locator('#cafeNotas').fill('Minha cafeteria — preservar caderno')
  p.locator('#cafeDuracao').fill('10');p.locator('#cafeDuracao').press('Tab');p.locator('#cafePrincipal').click()
  timer=p.evaluate('T.fimAlvo')
  p.locator('#painel-cafe [data-projeto-cafe]').click()
  assert p.evaluate('T.rodando') and p.evaluate('T.fimAlvo')==timer
  assert '400' in p.locator('[data-obra-comprar="cafeteria"]').inner_text()
  p.locator('[data-obra-comprar="cafeteria"]').click()
  assert p.evaluate('saldoDinheiro()')==cash-850
  assert p.evaluate('saldoMoedas()')==coins
  assert p.locator('.cafe-sala').get_attribute('data-nivel')=='2'
  assert p.locator('.cafe-estante-parede').is_visible()
  assert p.locator('#cafeNotas').input_value()=='Minha cafeteria — preservar caderno'
  assert p.evaluate('T.fimAlvo')==timer
  assert not p.evaluate('comprarNivel("cafeteria",3)')
  # All surroundings tiers and lighting keep one cafe on the original lot.
  for tier in [1,2,3,4]:
   p.evaluate('(n)=>{loja.niveis.arredores=n;renderEstadio()}',tier)
   assert p.locator('#caixaEstadio [data-arredores="cafeteria"]').count()==1
   assert p.locator('#caixaEstadio [data-abrir-cafe]').count()==1
   assert p.locator('[data-arredores="predio"]').count()==0
  p.evaluate('document.querySelector("#avisos").replaceChildren()')
  artifacts=pathlib.Path('/workspace/artifacts');artifacts.mkdir(exist_ok=True)
  for tier in [1,2]:
   p.evaluate('(n)=>{loja.niveis.cafeteria=n;renderEstadio()}',tier)
   for width in [320,390,650,900,1440]:
    p.set_viewport_size({'width':width,'height':1000})
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(tier,width)
   p.set_viewport_size({'width':1440,'height':1600})
   p.locator('.cafe-sala').screenshot(path=str(artifacts/f'cafeteria-interior-nivel-{tier}.png'))
  p.evaluate('irParaPainel("estadio");mostrarBaloesEstadio=false;renderBaloesEstadio()')
  for tier in [0,1,2]:
   p.evaluate('(n)=>{loja.niveis.cafeteria=n;loja.niveis.arredores=1;renderEstadio()}',tier)
   p.locator('#caixaEstadio').screenshot(path=str(artifacts/f'cafeteria-estadio-nivel-{tier}.png'))
   p.evaluate('abrirObrasEstadio("cafeteria")')
   for width in [320,390,1440]:
    p.set_viewport_size({'width':width,'height':1000})
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    assert p.locator('#modalObraEstadio').evaluate('(el)=>el.scrollWidth<=el.clientWidth+1')
   p.locator('#modalObraEstadio').screenshot(path=str(artifacts/f'cafeteria-projeto-nivel-{tier}.png'))
   p.locator('#fecharObraEstadio').click()
  p.evaluate('loja.niveis.cafeteria=2;salvarLoja();renderEstadio();irParaPainel("foco")')
  p.locator('.cafe-convite [data-entrar-cafe]').click()
  with p.expect_download() as dl:p.evaluate('exportarJSON()')
  backup=json.loads(pathlib.Path(dl.value.path()).read_text())
  assert backup['loja']['niveis']['cafeteria']==2
  p.reload(wait_until='networkidle');p.locator('.cafe-convite [data-entrar-cafe]').click()
  assert p.locator('.cafe-sala').get_attribute('data-nivel')=='2'
  assert p.locator('#cafeNotas').input_value()=='Minha cafeteria — preservar caderno'
  p.evaluate('async()=>await navigator.serviceWorker.ready');p.reload(wait_until='networkidle')
  c.set_offline(True);p.reload(wait_until='domcontentloaded');p.locator('.cafe-convite [data-entrar-cafe]').click()
  assert p.locator('#painel-cafe').is_visible()
  # Reset relocks the cafe, stops audio, refunds purchases and retains the notebook.
  p.evaluate('config.mudo=false;atualizarSomCafe()');p.locator('#cafeSom').click()
  p.wait_for_function('cafeAudio && !cafeAudio.carregando')
  p.evaluate('resetarLoja()')
  assert not p.locator('#painel-cafe').is_visible()
  assert not p.evaluate('cafeDisponivel()') and p.evaluate('cafeAudio===null')
  assert p.evaluate('loja.gastas')==0
  assert p.evaluate('config.cafe.notas')=='Minha cafeteria — preservar caderno'
  p.evaluate('irParaPainel("cafe")')
  assert not p.locator('#painel-cafe').is_visible()
  p.locator('#fecharObraEstadio').click()
  # Restoring a paid backup brings back the same stage and notebook.
  p.evaluate('(d)=>importarJSON(new File([JSON.stringify(d)],"cafe.json"))',backup)
  p.wait_for_function('cafeDisponivel()')
  p.locator('#caixaEstadio [data-abrir-cafe]').click()
  assert p.locator('.cafe-sala').get_attribute('data-nivel')=='2'
  assert p.evaluate('loja.gastas')==850
  assert p.locator('#cafeNotas').input_value()=='Minha cafeteria — preservar caderno'
  assert not errors,errors
  print('PASS',url,'cafe prerequisite; construction; atomic R$200/R$400 purchases; no repeated charge; one building; both interiors; responsive; shared timer; persistence/backup/import/reset; offline')
  b.close()
finally:
 if server:server.shutdown();server.server_close()
