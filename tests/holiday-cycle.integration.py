"""Vacation cycles: isolated opening, rewards, archive, academic boundaries and offline restore.
Run: python tests/holiday-cycle.integration.py [optional deployed URL].
"""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from pathlib import Path
from datetime import datetime,timezone
import json,shutil,sys
def accept_dialog(d):d.accept()
server=None
if len(sys.argv)>1:url=sys.argv[1]
else:
 class Quiet(SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parents[1])))
 Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
  ctx=browser.new_context(viewport={'width':1440,'height':1100},timezone_id='America/Sao_Paulo',reduced_motion='reduce',accept_downloads=True)
  p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',accept_dialog)
  p.clock.install(time=datetime(2026,11,24,15,tzinfo=timezone.utc))
  p.goto(url,wait_until='networkidle');p.evaluate('config.mudo=true;config.notificar=false;salvarConfig();irParaPainel("ciclo")')
  assert p.locator('input[name=tipoCiclo][value=estudo]').is_checked()
  assert p.locator('#cicloFim').is_visible()
  assert p.evaluate('cicloAtivo()') is None
  # A legacy academic cycle remains unmodified and cannot be converted by a selection.
  p.evaluate('''()=>{
   window.legacyCycle={id:'old',nome:'Provas anteriores',inicio:'2026-10-01',fimPrevisto:'2026-10-30',encerradoEm:null,congelado:null};
   ciclos=[{...legacyCycle}];salvarCiclos();renderTudo();
  }''')
  assert p.locator('input[value=ferias]').is_disabled()
  assert p.locator('#btnSalvarCiclo').inner_text()=='Atualizar ciclo'
  assert p.evaluate('JSON.stringify(ciclos[0])===JSON.stringify(legacyCycle)')
  p.evaluate("ciclos[0].encerradoEm='2026-10-30';ciclos[0].congelado={minutos:120,blocos:4,diasAtivos:2,maiorSequencia:2};salvarCiclos();document.querySelector('#cicloInicio').value='';renderTudo()")
  old=p.evaluate('JSON.stringify(ciclos[0])')
  # Only choosing the option must not create a cycle or award anything.
  p.locator('input[value=ferias]').check()
  assert p.evaluate('cicloAtivo()') is None
  p.locator('#cicloNome').fill('Férias — livros e projetos')
  p.locator('#cicloInicio').fill('2026-11-24')
  assert p.locator('#campoCicloFim').is_visible()
  assert p.locator('#cicloFim').is_enabled()
  p.locator('#cicloFim').fill('')
  assert not p.evaluate('salvarCicloDoFormulario()')
  p.locator('#cicloFim').fill('2026-11-23')
  assert not p.evaluate('salvarCicloDoFormulario()')
  p.locator('#cicloFim').fill('2026-12-31')
  assert p.locator('#btnSalvarCiclo').inner_text()=='Abrir ciclo de férias'
  for width in [320,390,1440]:
   p.set_viewport_size({'width':width,'height':1100})
   assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  artifacts=Path('/workspace/artifacts');artifacts.mkdir(exist_ok=True)
  p.locator('#painel-ciclo .cartao').first.screenshot(path=str(artifacts/'abrir-ciclo-ferias.png'))
  # Persistence failure leaves both legacy cycles and active state untouched.
  assert p.evaluate('''()=>{const save=Armazem.gravar;Armazem.gravar=()=>false;const ok=salvarCicloDoFormulario();Armazem.gravar=save;return !ok&&cicloAtivo()===null}''')
  p.locator('#btnSalvarCiclo').click()
  holiday=p.evaluate('cicloAtivo().id')
  assert p.evaluate('cicloAtivo().tipo')=='ferias'
  assert p.evaluate('cicloAtivo().fimPrevisto')=='2026-12-31'
  assert p.evaluate('JSON.stringify(ciclos[0])')==old
  assert p.locator('body').get_attribute('class')=='em-ferias'
  assert 'No seu ritmo' in p.locator('#chipCiclo').inner_text()
  assert '31 dez 2026' in p.locator('#cicloAtualBox').inner_text()
  assert 'dia ' not in p.locator('#chipCiclo').inner_text()
  assert p.locator('#linhaComparativa').count()==0
  assert p.locator('#telaComparativo').count()==0
  assert not p.locator('#hojeSeq').is_visible()
  assert p.evaluate('ciclosDoMuseu().map(c=>c.id)')==['old']
  assert p.evaluate('ciclosEncerrados().length')==1
  assert p.locator('#modalOrfaos.aberto').count()==0
  # Simulate completion through the same timer the user starts.
  p.evaluate('''()=>{
   loja=normalizarLoja({economiaVersao:3,inicioDinheiro:new Date(2026,10,1).getTime(),inicioBonusProlongado:new Date(2026,10,1).getTime()});salvarLoja();
   irParaPainel('foco');config.duracaoFoco=1;T.alvoMs=60000;T.restanteMs=60000;T.modo='foco';T.rodando=false;
   document.querySelector('#assunto').value='Leitura nas férias';T.assunto='Leitura nas férias';renderTimer();
  }''')
  p.locator('#btnPrincipal').click();p.clock.fast_forward(61000)
  p.wait_for_function('blocos.length===1')
  assert p.evaluate('blocos[0].cicloId')==holiday
  assert p.evaluate('blocos[0].minutos')==1
  assert 'no seu ritmo' in p.locator('#fraseFim').inner_text()
  assert 'dias seguidos' not in p.locator('#resumoFim').inner_text()
  p.evaluate('fecharModalFim();registrarBloco(Date.now()-149*60000,Date.now(),"Projeto de férias",149);renderTudo()')
  assert p.evaluate('({moedas:saldoMoedas(),dinheiro:saldoDinheiro(),bonus:bonusDiarioDinheiro()})')=={'moedas':33,'dinheiro':250,'bonus':50}
  assert '2h 30' in p.locator('#cicloAtualBox').inner_text() or '2h30' in p.locator('#cicloAtualBox').inner_text()
  assert p.locator('#listaCompleta .ferias-historico').count()==2
  p.locator('#painel-foco').screenshot(path=str(artifacts/'ciclo-ferias-foco.png'))
  assert p.locator('#feriasHorasAcumuladas').inner_text()=='2h30'
  # Older holiday cycles without an end date remain readable and can be updated.
  p.evaluate('cicloAtivo().fimPrevisto=null;salvarCiclos();renderTudo()')
  p.reload(wait_until='networkidle')
  assert p.evaluate('cicloAtivo().id')==holiday
  assert p.locator('#feriasHorasAcumuladas').inner_text()=='2h30'
  assert 'Defina o fim previsto' in p.locator('#cicloAtualBox').inner_text()
  # Name/date changes, reload and JSON backups retain the type, hours and end date.
  p.evaluate('irParaPainel("ciclo")')
  p.locator('#cicloNome').fill('Férias tranquilas');p.locator('#cicloFim').fill('2027-01-10');p.locator('#btnSalvarCiclo').click()
  assert p.evaluate('cicloAtivo().nome')=='Férias tranquilas'
  p.reload(wait_until='networkidle')
  assert p.evaluate('cicloAtivo().tipo')=='ferias'
  assert p.evaluate('cicloAtivo().fimPrevisto')=='2027-01-10'
  assert p.locator('#feriasHorasAcumuladas').inner_text()=='2h30'
  with p.expect_download() as info:p.evaluate('exportarJSON()')
  backup=json.loads(Path(info.value.path()).read_text());saved=next(c for c in backup['ciclos'] if c['id']==holiday)
  assert saved['tipo']=='ferias' and saved['fimPrevisto']=='2027-01-10'
  p.evaluate('ciclos=[];salvarCiclos();renderTudo()')
  p.locator('#arquivoImport').set_input_files({'name':'ferias.json','mimeType':'application/json','buffer':json.dumps(backup).encode()})
  p.wait_for_function('cicloAtivo()?.tipo==="ferias"')
  assert p.evaluate('saldoDinheiro()')==250
  # Failed close and cancel preserve the live holiday; successful close creates no trophy.
  p.remove_listener('dialog',accept_dialog)
  def dismiss_dialog(d):d.dismiss()
  p.on('dialog',dismiss_dialog)
  assert not p.evaluate('encerrarCiclo()')
  assert p.evaluate('cicloAtivo().tipo')=='ferias'
  p.remove_listener('dialog',dismiss_dialog);p.on('dialog',accept_dialog)
  assert p.evaluate('''()=>{const save=Armazem.gravar;Armazem.gravar=()=>false;const ok=encerrarCiclo();Armazem.gravar=save;return !ok&&cicloAtivo()?.tipo==='ferias'}''')
  p.evaluate('encerrarCiclo()')
  assert p.evaluate('cicloAtivo()') is None
  assert p.evaluate('ciclosEncerrados().length')==1
  assert p.evaluate('ciclosEncerrados(true).length')==2
  assert p.evaluate('ciclosDoMuseu().map(c=>c.id)')==['old']
  assert '1 Tutoria' in p.evaluate('resumoTitulosMuseu()')
  assert p.locator('[data-ferias-arquivo]').count()==1
  assert p.locator('[data-ferias-arquivo] [data-ver-tutoria]').count()==0
  assert 'Sequência' not in p.locator('[data-ferias-arquivo]').inner_text()
  p.locator('#prateleira').screenshot(path=str(artifacts/'ferias-no-historico.png'))
  assert p.evaluate('saldoMoedas()')==33 and p.evaluate('saldoDinheiro()')==250
  # Next academic cycle has its required end date, compares to the academic predecessor.
  p.evaluate('irParaPainel("ciclo")')
  assert p.locator('input[value=estudo]').is_checked()
  assert p.locator('#cicloNome').input_value()==''
  assert p.locator('#cicloFim').is_visible()
  p.locator('#cicloNome').fill('Novas provas');p.locator('#cicloInicio').fill('2026-12-01');p.locator('#cicloFim').fill('')
  assert not p.evaluate('salvarCicloDoFormulario()')
  p.locator('#cicloFim').fill('2026-11-30');assert not p.evaluate('salvarCicloDoFormulario()')
  p.locator('#cicloFim').fill('2026-12-30');p.locator('#btnSalvarCiclo').click()
  assert p.evaluate('cicloAnteriorDe(cicloAtivo()).id')=='old'
  assert p.locator('#telaComparativo').count()==1
  assert not p.evaluate('cicloDeFerias(cicloAtivo())')
  assert 'em-ferias' not in (p.locator('body').get_attribute('class') or '')
  p.evaluate('encerrarCiclo()')
  assert p.evaluate('ciclosEncerrados().length')==2
  assert p.locator('#prateleira .selo').all_text_contents().count('Tutoria · 2')==1
  assert 'Tutoria · 3' not in p.locator('#prateleira .selo').all_text_contents()
  assert 'CICLO 03' not in p.evaluate('desenharSalaMuseu()')
  # Even a malformed secondary-trophy assignment cannot put holidays into the museum.
  p.evaluate('id=>{config.trofeusSecundariosMuseu={versao:1,conquistas:[{id:"clinicas",cicloId:id}]}}',holiday)
  assert p.evaluate('id=>trofeusSecundariosDoCiclo(cicloPorId(id))',holiday)==[]
  p.evaluate('delete config.trofeusSecundariosMuseu;prepararTrofeusSecundariosMuseu();salvarConfig()')
  assert p.evaluate('id=>!config.trofeusSecundariosMuseu.conquistas.some(t=>t.cicloId===id)',holiday)
  # Offline read of a stored active holiday and its green presentation.
  p.locator('#arquivoImport').set_input_files({'name':'ferias.json','mimeType':'application/json','buffer':json.dumps(backup).encode()})
  p.wait_for_function('cicloAtivo()?.tipo==="ferias"')
  p.evaluate('async()=>await navigator.serviceWorker.ready');p.reload(wait_until='networkidle')
  ctx.set_offline(True);p.reload(wait_until='domcontentloaded')
  assert p.evaluate('cicloAtivo().tipo')=='ferias'
  assert p.locator('#cicloAtualBox').get_attribute('class')=='ciclo-ferias-atual'
  assert p.locator('#feriasHorasAcumuladas').inner_text()=='2h30'
  assert p.evaluate('cicloAtivo().fimPrevisto')=='2027-01-10'
  assert p.locator('#chipCiclo').evaluate('(el)=>getComputedStyle(el).backgroundColor')=='rgb(237, 247, 239)'
  assert not errors,errors
  print('PASS',url,'optional holiday opening; legacy preservation; single active cycle; start/end date validation and editing; accumulated hours; legacy date-free cycles; no comparison; real timer; same rewards/bonuses; atomic saves; backup; academic archive/numbering; no trophies; offline green theme')
  browser.close()
finally:
 if server:server.shutdown();server.server_close()
