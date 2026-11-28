"""Café integration in isolated Chromium profiles (never touches a real account).

Run: python tests/cafe.integration.py [optional deployed URL]
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
  # Ownership is a fixture here; real purchases and locking are tested separately.
  p.evaluate('loja.niveis.arredores=1;loja.niveis.cafeteria=1;salvarLoja();renderEstadio()')
  money=p.evaluate('JSON.stringify(loja)');cards=p.evaluate('JSON.stringify(meuTime)')
  p.locator('[data-entrar-cafe]').click();assert p.locator('#painel-cafe').is_visible()
  assert p.locator('#abas .ativa').get_attribute('data-painel')=='foco'
  assert p.locator('.cafe-tarefa').count()==3
  # Notebook text is never interpolated as HTML; keyboard shortcuts do not start while writing.
  goal='Antibióticos e resistência';note='<img src=x onerror="window.cafeXSS=1"> — R S + espaço'
  p.locator('#cafeObjetivo').fill(goal);p.locator('#cafeNotas').fill(note);p.locator('#cafeNotas').press('Space')
  assert not p.evaluate('T.rodando');note+=' '
  for i,text in enumerate(['Rever mecanismos','Resolver questões','Revisar erros']):p.locator('#cafeTarefa'+str(i)).fill(text)
  p.locator('#cafeFeita0').check();p.locator('#cafeFeita2').check();assert p.locator('#cafeTarefasResumo').inner_text()=='2/3 concluídos'
  # Immediate export captures the latest input, even before its debounce.
  with p.expect_download() as dl:p.evaluate('exportarJSON()')
  backup=json.loads(pathlib.Path(dl.value.path()).read_text());assert backup['config']['cafe']['notas']==note
  p.reload(wait_until='networkidle');p.locator('[data-entrar-cafe]').click()
  assert p.locator('#cafeObjetivo').input_value()==goal;assert p.locator('#cafeNotas').input_value()==note
  assert p.locator('#cafeFeita2').is_checked();assert p.evaluate('typeof window.cafeXSS')=='undefined'
  assert p.evaluate('cafeAudio===null')
  assert p.evaluate('JSON.stringify(loja)')==money
  assert p.evaluate('JSON.stringify(meuTime)')==cards
  # The cafe starts the original timer. Switching views, pausing and reload preserve it.
  p.locator('#cafeDuracao').fill('10');p.locator('#cafeDuracao').press('Tab');p.locator('#cafePrincipal').click()
  assert p.evaluate('T.rodando&&T.assunto')==goal
  t0=p.evaluate('({inicio:T.inicioBloco,fim:T.fimAlvo,alvo:T.alvoMs})')
  assert p.locator('#cafeObjetivo').get_attribute('readonly') is not None
  p.evaluate('irParaPainel("estadio")');assert p.evaluate('T.fimAlvo')==t0['fim']
  p.evaluate('irParaPainel("foco")');assert p.locator('#btnPrincipal').inner_text()=='Pausar'
  p.locator('[data-entrar-cafe]').click();assert p.evaluate('T.inicioBloco')==t0['inicio']
  p.locator('#cafePrincipal').click();left=p.evaluate('T.restanteMs');assert not p.evaluate('T.rodando')
  p.reload(wait_until='networkidle');p.locator('[data-entrar-cafe]').click();assert p.evaluate('T.restanteMs')==left
  p.locator('#cafePrincipal').click();assert p.evaluate('T.inicioBloco')==t0['inicio']
  end=p.evaluate('T.fimAlvo');p.reload(wait_until='networkidle');p.locator('[data-entrar-cafe]').click()
  assert p.evaluate('T.fimAlvo')==end;assert p.evaluate('T.rodando')
  # Finish a real partial block (5 minutes of a 10-minute block), never 10-minute rewards.
  p.evaluate('T.fimAlvo=Date.now()+300000;T.inicioBloco=Date.now()-300000;loja.inicioDinheiro=Date.now()-600000;salvarLoja();renderTimer()')
  p.locator('#cafeEncerrar').click();assert p.evaluate('blocos.length')==1
  recorded=p.evaluate('blocos[0]');assert abs(recorded['minutos']-5)<.03 and recorded['assunto']==goal
  assert p.evaluate('saldoMoedas()')==1;assert p.evaluate('saldoDinheiro()')==6
  assert p.evaluate('T.modo')=='pausa'
  # A separate next-block objective written during a pause survives navigation.
  p.locator('#cafeObjetivo').fill('Foco seguinte');p.evaluate('irParaPainel("foco")');p.locator('[data-entrar-cafe]').click()
  assert p.locator('#cafeObjetivo').input_value()=='Foco seguinte'
  p.locator('#cafeEncerrar').click();p.locator('#cafeDuracao').fill('1');p.locator('#cafeDuracao').press('Tab')
  p.locator('#cafePrincipal').click();assert p.evaluate('T.assunto')=='Foco seguinte'
  p.evaluate('T.fimAlvo=Date.now()-1;tique()');assert p.locator('#modalFim').get_attribute('class').find('aberto')>=0
  assert p.evaluate('blocos.length')==2;assert p.evaluate('blocos[1].minutos')==1
  p.evaluate('tique()');assert p.evaluate('blocos.length')==2;p.evaluate('fecharModalFim()')
  assert p.evaluate('JSON.stringify(meuTime)')==cards
  # The owned cafe is already reachable at Surroundings 1; City 4 never duplicates it.
  p.evaluate('irParaPainel("estadio")');assert p.locator('[data-abrir-cafe]').count()==1
  p.evaluate('loja.niveis.arredores=4;renderEstadio()')
  cafe=p.locator('[data-abrir-cafe]');assert cafe.count()==1;cafe.focus();cafe.press('Enter')
  assert p.locator('#painel-cafe').is_visible()
  p.evaluate('irParaPainel("estadio")');p.locator('[data-abrir-cafe]').click();assert p.locator('#painel-cafe').is_visible()
  # All nine combinations of atmosphere update only the scene, leaving notebook contents untouched.
  for periodo in ['dia','entardecer','noite']:
   for clima in ['limpo','nublado','chuva']:
    p.evaluate('([periodo,clima])=>salvarAmbienteEstadio({periodo,clima})',[periodo,clima])
    assert p.locator('.cafe-sala').get_attribute('data-periodo')==periodo
    assert p.locator('.cafe-sala').get_attribute('data-clima')==clima
    assert p.locator('#cafeNotas').input_value()==note
  for width in [320,390,650,768,900,1440]:
   p.set_viewport_size({'width':width,'height':900});assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
  # Ambient audio is opt-in, respects mute/volume, switches without accumulating nodes and stops on app navigation.
  p.evaluate('config.mudo=false;config.volume=.6;atualizarSomCafe()');assert p.evaluate('cafeAudio===null')
  p.locator('#cafeSom').click();p.wait_for_function('cafeAudio && !cafeAudio.carregando')
  assert p.evaluate('cafeAudio.fontes.length')==1
  assert p.evaluate('cafeAudio.fontes[0].buffer.duration')>80
  p.locator('#cafeTipoSom').select_option('chuva');p.wait_for_function('cafeAudio && !cafeAudio.carregando')
  assert p.evaluate('cafeAudio.fontes.length')==1
  p.locator('#cafeTipoSom').select_option('misto');p.wait_for_function('cafeAudio && !cafeAudio.carregando')
  assert p.evaluate('cafeAudio.fontes.length')==2
  # Check actual decoded output, rather than merely the presence of an audio graph.
  assert p.evaluate('''async()=>{
   const a=cafeAudio,analyser=a.ctx.createAnalyser();a.master.connect(analyser);
   await new Promise(r=>setTimeout(r,500));const samples=new Float32Array(analyser.fftSize);
   analyser.getFloatTimeDomainData(samples);a.master.disconnect(analyser);analyser.disconnect();
   return samples.some(x=>Math.abs(x)>.0001);
  }''')
  p.locator('#cafeVolume').fill('30');assert p.locator('#cafeVolumeValor').inner_text()=='30%'
  p.evaluate('config.mudo=true;atualizarSomCafe()');assert p.evaluate('cafeAudio===null')
  p.evaluate('config.mudo=false;atualizarSomCafe()');assert p.evaluate('cafeAudio===null')
  p.locator('#cafeSom').click();p.evaluate('irParaPainel("foco")');assert p.evaluate('cafeAudio===null')
  p.locator('[data-entrar-cafe]').click();assert p.evaluate('cafeAudio===null')
  # A cancelled pending load cannot start audio after the user has left or silenced it.
  p.locator('#cafeTipoSom').select_option('cafeteria')
  p.evaluate('''()=>{
   cafeBuffers.clear();window.fetchCafeOriginal=window.fetch;
   window.fetch=(...args)=>String(args[0]).includes('/audio/cafe/')
    ?new Promise(resolve=>{window.liberarCafe=()=>resolve(fetchCafeOriginal(...args));})
    :fetchCafeOriginal(...args);
  }''')
  p.locator('#cafeSom').click();p.wait_for_function('typeof liberarCafe==="function"')
  assert p.locator('#cafeSom').inner_text()=='Cancelar';p.locator('#cafeSom').click()
  p.evaluate('window.fetch=fetchCafeOriginal;liberarCafe()')
  p.evaluate('async()=>await cafeBuffers.get("cafeteria")');assert p.evaluate('cafeAudio===null')
  # Failed loads report the problem, leave no player running, and can be retried.
  p.evaluate('()=>{cafeBuffers.clear();window.fetch=()=>Promise.reject(new Error("offline"));}')
  p.locator('#cafeSom').click();p.wait_for_function('cafeAudio===null')
  assert 'tentar novamente' in p.locator('#cafeSomStatus').inner_text()
  p.evaluate('()=>{window.fetch=fetchCafeOriginal;}');p.locator('#cafeSom').click()
  p.wait_for_function('cafeAudio && !cafeAudio.carregando');p.locator('#cafeSom').click()
  # New long recordings play real audio, preserve the selected environment and never autoplay.
  assert p.locator('#cafeTipoSom option').count()==7
  for ambiente in ['natureza','melodia','guitarra','guitarraVariada']:
   p.locator('#cafeTipoSom').select_option(ambiente)
   p.locator('#cafeSom').click();p.wait_for_function('cafeAudio && !cafeAudio.carregando')
   assert p.evaluate('cafeAudio.fontes.length')==(2 if ambiente=='natureza' else 1)
   assert p.evaluate('cafeAudio.fontes.every(f=>f.loop)')
   assert p.evaluate('cafeAudio.fontes[0].buffer.duration')>90
   if ambiente in ['melodia','guitarra','guitarraVariada']:
    duracao=150 if ambiente=='melodia' else 209*240/91.2 if ambiente=='guitarraVariada' else 320/.95
    assert abs(p.evaluate('cafeAudio.fontes[0].buffer.duration')-duracao)<.1
   if ambiente=='guitarraVariada':
    assert '9min10' in p.locator('#cafeTipoSom option:checked').inner_text()
    assert p.evaluate("""()=>{
     const b=cafeAudio.fontes[0].buffer,a=b.getChannelData(0);
     if(a[0]!==0||a[a.length-1]!==0)return false;
     return [60,180,300,480,540].every(t=>{
      let e=0;const start=Math.round(t*b.sampleRate),n=4*b.sampleRate;
      for(let i=start;i<start+n;i++)e+=a[i]*a[i];return Math.sqrt(e/n)>.005;
     });
    }""")
   assert p.evaluate('''async()=>{
    const a=cafeAudio,analyser=a.ctx.createAnalyser();a.master.connect(analyser);
    const data=new Float32Array(analyser.fftSize);let tocando=false;
    for(let i=0;i<25&&!tocando;i++){
     await new Promise(r=>setTimeout(r,100));analyser.getFloatTimeDomainData(data);
     tocando=data.some(x=>Math.abs(x)>.00001);
    }
    a.master.disconnect(analyser);analyser.disconnect();return tocando;
   }''')
   p.evaluate('salvarCafe()');p.reload(wait_until='networkidle');p.locator('[data-entrar-cafe]').click()
   assert p.locator('#cafeTipoSom').input_value()==ambiente
   assert p.evaluate('cafeAudio===null')
   assert p.locator('#cafeNotas').input_value()==note
   with p.expect_download() as dl:p.evaluate('exportarJSON()')
   ambiente_backup=json.loads(pathlib.Path(dl.value.path()).read_text())
   assert ambiente_backup['config']['cafe']['som']==ambiente
   p.evaluate('(d)=>importarJSON(new File([JSON.stringify(d)],"ambiente.json"))',ambiente_backup)
   p.wait_for_function('(som)=>cafeRascunho.som===som',arg=ambiente)
   assert p.evaluate('cafeAudio===null')
  # A failed storage write keeps the draft visible and exportable without claiming it was saved.
  p.evaluate('window.originalGravar=Armazem.gravar;Armazem.gravar=()=>false')
  p.locator('#cafeNotas').fill('Rascunho ainda não salvo');p.evaluate('salvarCafe()')
  assert 'Sem espaço' in p.locator('#cafeSalvo').inner_text()
  with p.expect_download() as dl:p.evaluate('exportarJSON()')
  failed_backup=json.loads(pathlib.Path(dl.value.path()).read_text());assert failed_backup['config']['cafe']['notas']=='Rascunho ainda não salvo'
  p.evaluate('Armazem.gravar=window.originalGravar;salvarCafe()')
  # Import round-trip replaces the editor too; old backups clear it rather than merging another person's notebook.
  p.evaluate('(d)=>importarJSON(new File([JSON.stringify(d)],"cafe.json"))',backup)
  p.wait_for_function('cafeRascunho.notas.includes("onerror")');assert p.locator('#cafeNotas').input_value()==note
  old={**backup,'config':{k:v for k,v in backup['config'].items() if k!='cafe'}}
  p.evaluate('(d)=>importarJSON(new File([JSON.stringify(d)],"antigo.json"))',old)
  p.wait_for_function('cafeRascunho.notas===""');assert p.locator('#cafeNotas').input_value()==''
  # Assets and notebook are available offline after install and remain usable.
  p.evaluate('async()=>await navigator.serviceWorker.ready');p.reload(wait_until='networkidle')
  c.set_offline(True);p.reload(wait_until='domcontentloaded');p.locator('[data-entrar-cafe]').click();assert p.locator('#cafePrincipal').is_visible()
  assert p.evaluate('typeof iniciarCafe')=='function';assert p.evaluate('cafeAudio===null')
  p.evaluate('config.mudo=false;config.volume=.6;atualizarSomCafe()')
  p.locator('#cafeTipoSom').select_option('misto');p.locator('#cafeSom').click()
  p.wait_for_function('cafeAudio && !cafeAudio.carregando')
  assert p.evaluate('cafeAudio.fontes.length')==2;p.locator('#cafeSom').click()
  for ambiente in ['natureza','melodia','guitarra','guitarraVariada']:
   p.locator('#cafeTipoSom').select_option(ambiente);p.locator('#cafeSom').click()
   p.wait_for_function('cafeAudio && !cafeAudio.carregando')
   assert p.evaluate('cafeAudio.fontes.length')==(2 if ambiente=='natureza' else 1)
   p.locator('#cafeSom').click()
  assert not errors,errors
  print('PASS',url,'one shared timer; partial/full registration once; rewards; pause/resume/reload/navigation; notebook/3 tasks/export/import/XSS/write failure; city mouse/keyboard entry; nine atmospheres; six widths; opt-in local audio/mute/navigation; offline')
  b.close()
finally:
 if server:server.shutdown();server.server_close()
