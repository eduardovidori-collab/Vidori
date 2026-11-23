"""Legend portraits, new cards and offline rendering in isolated browser storage.

Run: python tests/legends-photos.integration.py [optional deployed URL]
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
  c=b.new_context(viewport={'width':1440,'height':1200},reduced_motion='reduce')
  p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(url,wait_until='networkidle');p.evaluate('config.mudo=true;config.notificar=false;salvarConfig()')
  assert p.evaluate('new Set(JOGADORES_SPFC.map(j=>j.id)).size===JOGADORES_SPFC.length')
  new_cards=p.evaluate('JOGADORES_SPFC.filter(j=>["denilson-show","aloisio-chulapa","serginho-chulapa"].includes(j.id)).map(j=>[j.id,j.posicao,j.ovr,raridadeDoJogador(j).id])')
  assert new_cards==[['denilson-show','PE',91,'idolo'],['aloisio-chulapa','ATA',83,'epico'],['serginho-chulapa','ATA',95,'lenda']]
  chances=p.evaluate('chancesDoPacote().map(r=>r.chance)')
  assert all(abs(a-b)<.000001 for a,b in zip(chances,[88,9,2.4,.5,.1]))
  legends=p.evaluate('JOGADORES_SPFC.filter(j=>raridadeDoJogador(j).id==="lenda").map(j=>j.id).sort()')
  assert len(legends)==5 and legends==p.evaluate('Object.keys(FOTOS_JOGADORES).sort()')
  assert p.evaluate('distribuicaoDoPacote().filter(c=>["denilson-show","aloisio-chulapa","serginho-chulapa"].includes(c.jogador.id)).every(c=>c.chance>0)')
  p.evaluate('irParaPainel("time");selecionarVisaoDoTime("album")')
  assert p.locator('#timeAlbum [data-foto-jogador]').count()==0
  # Owned cards are a fixture; looking at photos must not award cards or money.
  p.evaluate('''()=>{
   const ids=[...Object.keys(FOTOS_JOGADORES),'denilson-show','aloisio-chulapa'];
   meuTime=normalizarMeuTime({jogadores:ids.map(id=>({id,quantidade:id==='rogerio-ceni'?2:1})),
    escalacao:{gol:'rogerio-ceni',ld:'cafu','mc-d':'rai',ata:'serginho-chulapa',pe:'denilson-show'}});
   salvarMeuTime();renderMeuTime();
  }''')
  state=p.evaluate('JSON.stringify({meuTime,loja,blocos})')
  p.locator('[data-album-raridade=lenda]').click()
  assert p.locator('#timeAlbum [data-foto-jogador]').count()==5
  p.wait_for_function('Array.from(document.querySelectorAll("#timeAlbum img")).every(img=>img.complete&&img.naturalWidth>0)')
  # Five headshots have real alpha; an opaque rectangle cannot pass this check.
  assert p.evaluate('''async()=>{
   const src=document.querySelector('#timeAlbum img').src;
   const bitmap=await createImageBitmap(await (await fetch(src)).blob());
   const side=bitmap.width/3;
   if(bitmap.height!==side*2)return false;
   const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
   const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);
   const alpha=(x,y)=>ctx.getImageData(Math.round(x),Math.round(y),1,1).data[3];
   const ok=[[0,0],[1,0],[2,0],[0,1],[1,1]].every(([col,row])=>
    alpha(col*side+side/2,row*side+side/2)>200&&
    alpha(col*side+4,row*side+4)<6&&alpha((col+1)*side-5,row*side+4)<6);
   bitmap.close();return ok;
  }''')
  artifacts=Path('/workspace/artifacts');artifacts.mkdir(exist_ok=True)
  p.locator('#timeAlbum').screenshot(path=str(artifacts/'atualizacao-lendas-album.png'))
  for width in [320,390,760,900,1440]:
   p.set_viewport_size({'width':width,'height':1100})
   assert p.locator('#timeAlbum [data-foto-jogador]').count()==5
   assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  assert p.evaluate('JSON.stringify({meuTime,loja,blocos})')==state
  # A decode failure leaves readable initials, and re-rendering restores the photo.
  p.evaluate('document.querySelector("#timeAlbum img").src="data:image/png;base64,invalid"')
  p.wait_for_function('document.querySelector("#timeAlbum img").hidden')
  assert p.locator('#timeAlbum .jogador-foto-reserva').first.inner_text()
  p.evaluate('renderAlbumDoTime()')
  p.wait_for_function('Array.from(document.querySelectorAll("#timeAlbum img")).every(img=>img.complete&&img.naturalWidth>0)')
  p.locator('#timeAbaEscalacao').click()
  assert p.locator('#timePosicoes [data-foto-jogador]').count()==4
  p.locator('[data-time-pos=gol]').click()
  assert p.locator('#timeOpcoes [data-foto-jogador=rogerio-ceni]').count()==1
  p.locator('.time-campo-card').screenshot(path=str(artifacts/'atualizacao-time-fotos.png'))
  p.evaluate('meuTime.ultimoPacote=[{id:"serginho-chulapa",nova:true},{id:"aloisio-chulapa",nova:true}];abrirResultadoPacote(false)')
  assert p.locator('#cartasDoPacote [data-foto-jogador=serginho-chulapa]').count()==1
  p.wait_for_function('document.querySelector("#cartasDoPacote img").complete&&document.querySelector("#cartasDoPacote img").naturalWidth>0')
  p.locator('#cartasDoPacote').screenshot(path=str(artifacts/'atualizacao-novas-cartas.png'))
  p.evaluate('fecharModalPacote()')
  # An isolated display of the three actual cards is the release-art reference.
  p.evaluate('''()=>{
   const cards=['serginho-chulapa','denilson-show','aloisio-chulapa'].map(id=>JOGADORES_SPFC.find(j=>j.id===id));
   const section=document.createElement('section');section.id='previaAtualizacao';
   section.style='display:flex;gap:20px;padding:35px;background:#f7f2e6;max-width:950px;margin:30px auto';
   section.innerHTML=cards.map(j=>'<article class="carta-revelada raridade-'+raridadeDoJogador(j).id+'" style="width:260px"><div class="carta-revelada-topo"><span class="carta-ovr">'+j.ovr+'<small>OVR</small></span><span class="carta-pos">'+j.posicao+'</span></div>'+(fotoDoJogador(j)||camisaDoTime())+'<span class="carta-raridade">'+raridadeDoJogador(j).nome+'</span><h3>'+j.nome+'</h3></article>').join('');
   document.body.append(section);
  }''')
  p.locator('#previaAtualizacao').screenshot(path=str(artifacts/'atualizacao-tres-cartas.png'))
  p.evaluate('document.querySelector("#previaAtualizacao").remove();irParaPainel("loja")')
  assert p.locator('#catalogoPacote [data-foto-jogador]').count()==5
  p.evaluate('async()=>await navigator.serviceWorker.ready');p.reload(wait_until='networkidle')
  # Reading a separate page online must not replace the cached app entry.
  credit_online=c.new_page();credit_online.goto(url+'imagens/jogadores/CREDITOS.html',wait_until='networkidle')
  assert credit_online.locator('article').count()==5
  credit_online.close()
  c.set_offline(True);p.reload(wait_until='domcontentloaded')
  p.evaluate('irParaPainel("time");selecionarVisaoDoTime("album")')
  p.locator('[data-album-raridade=lenda]').click()
  p.wait_for_function('document.querySelectorAll("#timeAlbum img").length===5&&Array.from(document.querySelectorAll("#timeAlbum img")).every(img=>img.complete&&img.naturalWidth>0)')
  credit=c.new_page();credit.goto(url+'imagens/jogadores/CREDITOS.html',wait_until='domcontentloaded')
  assert credit.locator('article').count()==5
  assert not errors,errors
  print('PASS',url,'three new cards; unchanged rarity odds; five local portraits; missing/owned states; roster/lineup/pack/catalog; responsive; fallback; offline photos and credits')
  b.close()
finally:
 if server:server.shutdown();server.server_close()
