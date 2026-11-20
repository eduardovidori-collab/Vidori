/* Apresentação do estádio e Museu das Tutorias. Nenhuma alteração nas regras de estudo. */
const PRECO_MUSEU=500;
const estadoMuseu={pagina:0,selecionado:null,retorno:null};
function normalizarAmbienteEstadio(d){
  const x=d&&typeof d==='object'?d:{};
  return {periodo:['auto','dia','entardecer','noite'].includes(x.periodo)?x.periodo:'auto',clima:['limpo','nublado','chuva'].includes(x.clima)?x.clima:'limpo'};
}
function ambienteEstadioAtual(agora=new Date()){
  const a=normalizarAmbienteEstadio(config.ambienteEstadio),h=agora.getHours();
  return {...a,escolha:a.periodo,periodo:a.periodo==='auto'?(h>=6&&h<17?'dia':h>=17&&h<19?'entardecer':'noite'):a.periodo};
}
function refletoresAcesos(){return temRefletores()&&ambienteEstadioAtual().periodo!=='dia';}
function coresAmbienteEstadio(){
  const a=ambienteEstadioAtual();
  return a.periodo==='noite'?{ceu:'#102439',horizonte:'#384F58',sol:'#F1EDCB',filtro:'.58 0 0 0 .025  0 .67 0 0 .035  0 0 .82 0 .06  0 0 0 1 0'}:
    a.periodo==='entardecer'?{ceu:'#B9BDDA',horizonte:'#F2C9A0',sol:'#FFD58E',filtro:'1 0 0 0 .025  0 .88 0 0 .02  0 0 .78 0 .04  0 0 0 1 0'}:
    a.clima!=='limpo'?{ceu:'#B5C7CE',horizonte:'#E0E5DA',sol:'#E0E5DA',filtro:'.84 0 0 0 .03  0 .9 0 0 .025  0 0 .96 0 .02  0 0 0 1 0'}:
    {ceu:'#C3DFE8',horizonte:'#F2F0DB',sol:'#FFF3C5',filtro:'1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0'};
}
function renderControlesAmbiente(){
  const a=ambienteEstadioAtual(),nomes={dia:'Dia',entardecer:'Pôr do sol',noite:'Noite',limpo:'céu limpo',nublado:'nublado',chuva:'chuva'};
  document.querySelectorAll('[data-periodo-estadio]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.periodoEstadio===a.escolha)));
  document.getElementById('climaEstadio').value=a.clima;
  document.getElementById('resumoAmbienteEstadio').textContent=(a.escolha==='auto'?'Automático · ':'')+nomes[a.periodo]+' · '+nomes[a.clima];
  const cena=document.getElementById('cenaEstadio');cena.dataset.periodo=a.periodo;cena.dataset.clima=a.clima;
}
function salvarAmbienteEstadio(mudanca){
  const novo=normalizarAmbienteEstadio({...normalizarAmbienteEstadio(config.ambienteEstadio),...mudanca});
  const proximo={...config,ambienteEstadio:novo};
  if(!Armazem.gravar(CHAVES.config,proximo)){mostrarAviso('Não consegui salvar o ambiente. Tente novamente.');renderControlesAmbiente();return false;}
  config=proximo;renderEstadio();return true;
}
function astroFundoJogo(){
  const a=ambienteEstadioAtual();
  if(a.clima!=='limpo')return '<g fill="#D7E0DC" opacity=".35"><ellipse cx="730" cy="66" rx="95" ry="24"/><ellipse cx="210" cy="45" rx="120" ry="18"/></g>';
  return a.periodo==='noite'?'<path d="M750 35a29 29 0 1 0 24 50a25 25 0 0 1-24-50Z" fill="#EDE9C9"/>':'<circle cx="755" cy="68" r="32" fill="'+(a.periodo==='entardecer'?'#FFD19A':'#FFF8D6')+'" opacity=".7"/>';
}
function capacidadeMuseu(){return matchMedia('(max-width:550px)').matches?1:3;}
function chuvaSvgAmbiente(x,y,w,h,prefix){
  if(ambienteEstadioAtual().clima!=='chuva')return '';
  let linhas='';for(let i=0;i<85;i++){
    const px=x+((i*197)%997)/997*w,py=y+((i*137)%991)/991*h,l=w*.012;
    linhas+='<path d="M'+px.toFixed(2)+' '+py.toFixed(2)+'l'+(-l*.35).toFixed(2)+' '+l.toFixed(2)+'" style="--atraso:-'+((i%11)/13).toFixed(2)+'s"/>';
  }
  return '<g class="chuva-ambiente" data-chuva="'+prefix+'" stroke="#DBECF3" stroke-width="'+(w*.0008)+'" opacity=".4">'+linhas+'</g>';
}
function ceuSvgEstadio(x,y,w,h){
  const a=ambienteEstadioAtual(),cx=x+w*.14,cy=y+h*.13;
  if(a.clima!=='limpo')return '<g fill="'+(a.periodo==='noite'?'#819BAE':'#FFFFFF')+'" opacity=".15"><ellipse cx="'+(x+w*.24)+'" cy="'+(y+h*.12)+'" rx="'+w*.14+'" ry="'+h*.055+'"/><ellipse cx="'+(x+w*.74)+'" cy="'+(y+h*.18)+'" rx="'+w*.17+'" ry="'+h*.04+'"/></g>';
  if(a.periodo!=='noite')return '<circle cx="'+cx+'" cy="'+cy+'" r="'+w*.026+'" fill="'+(a.periodo==='entardecer'?'#FFD18B':'#FFF4C5')+'" opacity=".8"/>';
  let s='<path d="M'+cx+' '+(cy-w*.025)+'a'+w*.025+' '+w*.025+' 0 1 0 '+w*.018+' '+w*.044+'a'+w*.022+' '+w*.022+' 0 0 1 '+(-w*.018)+' '+(-w*.044)+'Z" fill="#F3EDCF" opacity=".85"/>';
  for(let i=0;i<26;i++)s+='<circle cx="'+(x+((i*149+80)%997)/997*w)+'" cy="'+(y+((i*79+10)%173)/997*h)+'" r="'+w*.0012+'" fill="#E3E9E7" opacity="'+(.25+(i%4)*.15)+'"/>';
  return s;
}
function pisoMolhadoEstadio(){
  if(ambienteEstadioAtual().clima!=='chuva')return '';
  return [[-23,-9,9,3],[9,15,12,3],[29,-16,7,2]].map(([x,y,rx,ry])=>{
    const p=Array.from({length:30},(_,i)=>{const a=i/29*Math.PI*2;return [x+Math.cos(a)*rx,y+Math.sin(a)*ry,.12];});
    return poligono(p,'#B8D9D7',' opacity=".2"');
  }).join('');
}
function envolverEstadioAmbiente(modelo,defs,enquadramento){
  const [x,y,w,h]=enquadramento.split(' ').map(Number),a=ambienteEstadioAtual(),c=coresAmbienteEstadio();
  let luzes='';
  if(refletoresAcesos()){
    posicoesDasTorres().forEach(([tx,ty])=>{const p=iso(...centroDoRefletor(tx,ty));luzes+='<circle cx="'+p.x+'" cy="'+p.y+'" r="7" fill="url(#amb-halo)"/><circle cx="'+p.x+'" cy="'+p.y+'" r="1.25" fill="#FFF6C9"/>';});
  }
  return '<defs>'+defs+'<filter id="amb-modelo" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="'+c.filtro+'"/></filter><radialGradient id="amb-halo"><stop stop-color="#FFF9CB" stop-opacity=".9"/><stop offset=".2" stop-color="#FFF6C4" stop-opacity=".4"/><stop offset="1" stop-color="#F9F4CA" stop-opacity="0"/></radialGradient></defs>'+ceuSvgEstadio(x,y,w,h)+'<g data-modelo-ambiente="'+a.periodo+'" filter="url(#amb-modelo)">'+modelo+'</g>'+luzes+chuvaSvgAmbiente(x,y,w,h,'morumbi');
}
function nivelMuseu(){return loja.niveis?.museu===2?2:1;}
function nomeNivelMuseu(){return nivelMuseu()===2?'Galeria de Honra':'Sala das Tutorias';}
function linhasPlacaMuseu(texto,limite=23){
  const palavras=String(texto).split(/\s+/),linhas=[''];
  for(const p of palavras){const i=linhas.length-1;if((linhas[i]+' '+p).trim().length>limite&&linhas[i])linhas.push(p);else linhas[i]=(linhas[i]+' '+p).trim();}
  return linhas.slice(0,2).map((l,i)=>l.length>limite?l.slice(0,limite-1)+'…':i===1&&linhas.length>2?l.slice(0,limite-1)+'…':l);
}
function tacaTutoriaSvg(prefix){
  return '<g><path d="M-43-57C-102-83-107-4-64 6L-42-4M43-57C102-83 107-4 64 6L42-4" fill="none" stroke="#76501F" stroke-width="13"/><path d="M-43-59C-97-78-100-8-64 1L-44-9M43-59C97-78 100-8 64 1L44-9" fill="none" stroke="url(#'+prefix+'-ouro)" stroke-width="8"/><path d="M-48-64H48L39-12Q32 17 10 25H-10Q-32 17-39-12Z" fill="url(#'+prefix+'-ouro)" stroke="#966E31" stroke-width="1.5"/><ellipse cy="-64" rx="48" ry="8" fill="#E6C76D" stroke="#FFF0B1" stroke-width="2"/><ellipse cy="-65" rx="40" ry="4" fill="#745221"/><path d="M-28-56-22-19Q-18 3-9 10" fill="none" stroke="#FFF5C8" stroke-width="4" opacity=".7"/><path d="M-9 24H9L7 57H-7Z" fill="url(#'+prefix+'-ouro)"/><ellipse cy="58" rx="27" ry="6" fill="#B58A3F"/><path d="M-31 59H31L38 72H-38Z" fill="url(#'+prefix+'-ouro)"/><ellipse cy="72" rx="38" ry="7" fill="#E0BA60" stroke="#9B7436"/><path d="M-18-36H18V-13L0 1-18-13Z" fill="#F6F2DF" stroke="#B4934D"/><path d="M-15-31H15V-24H-15Z" fill="#313A32"/><path d="M-15-20H-3V-7L-15-15Z" fill="#B73B43"/><path d="M3-20H15V-15L3-7Z" fill="#263C32"/></g>';
}
function desenharSalaMuseu(prefix='sala',interativo=true){
  const luxo=nivelMuseu()===2,lista=ciclosEncerrados(),cap=capacidadeMuseu(),pagina=interativo?estadoMuseu.pagina:0,visiveis=lista.slice(pagina*cap,pagina*cap+cap);
  const parede=luxo?'#18342D':'#E2DFCF',chao=luxo?'#778B7B':'#BBAE90',texto=luxo?'#DCD6A4':'#6E694E';
  let s='<svg viewBox="'+(cap===1?'250 100 700 620':'0 0 1200 720')+'" preserveAspectRatio="xMidYMid meet" role="'+(interativo?'group':'img')+'" aria-label="'+nomeNivelMuseu()+', '+lista.length+' Tutorias conquistadas"><defs><linearGradient id="'+prefix+'-parede" x2="0" y2="1"><stop stop-color="'+(luxo?'#29443A':'#F2F0E4')+'"/><stop offset="1" stop-color="'+parede+'"/></linearGradient><linearGradient id="'+prefix+'-piso" x2="0" y2="1"><stop stop-color="'+chao+'"/><stop offset="1" stop-color="'+(luxo?'#283E34':'#DBCCAA')+'"/></linearGradient><linearGradient id="'+prefix+'-ouro"><stop stop-color="#775020"/><stop offset=".2" stop-color="#E5BC5C"/><stop offset=".4" stop-color="#FFF0A8"/><stop offset=".57" stop-color="#C59238"/><stop offset=".8" stop-color="#F2D789"/><stop offset="1" stop-color="#906325"/></linearGradient><linearGradient id="'+prefix+'-vidro" x2="1" y2="1"><stop stop-color="#E6FFFF" stop-opacity=".12"/><stop offset=".48" stop-color="#D0E9E7" stop-opacity=".01"/><stop offset="1" stop-color="#DDEEE7" stop-opacity=".14"/></linearGradient><radialGradient id="'+prefix+'-luz"><stop stop-color="#FFF3BF" stop-opacity=".55"/><stop offset="1" stop-color="#FFF0B7" stop-opacity="0"/></radialGradient><linearGradient id="'+prefix+'-reflexo" x2="0" y2="1"><stop stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="'+prefix+'-mascara" maskUnits="userSpaceOnUse" x="0" y="500" width="1200" height="220"><rect x="0" y="500" width="1200" height="220" fill="url(#'+prefix+'-reflexo)"/></mask></defs>';
  s+='<rect width="1200" height="720" fill="'+parede+'"/><path d="M0 0H1200L1080 105H120Z" fill="'+(luxo?'#102920':'#C9C5B3')+'"/><path d="M0 0 120 105V440L0 530Z" fill="'+(luxo?'#102B25':'#C3C4B2')+'"/><path d="M1200 0 1080 105V440L1200 530Z" fill="'+(luxo?'#142D27':'#C6C8B7')+'"/><path d="M120 105H1080V440H120Z" fill="url(#'+prefix+'-parede)"/><path d="M0 530 120 440H1080L1200 530V720H0Z" fill="url(#'+prefix+'-piso)"/>';
  if(luxo){
    for(let i=0;i<8;i++)s+='<path d="M'+(120+i*137)+' 440 '+(-200+i*230)+' 720" stroke="#D4D7B926" stroke-width="2"/>';
    [497,568,657].forEach(y=>{s+='<path d="M0 '+y+'H1200" stroke="#C8D3B329"/>';});
    for(const x of [128,360,840,1072])s+='<path d="M'+x+' 110V435" stroke="#B2A064" stroke-width="7"/><path d="M'+(x+9)+' 110V435" stroke="#D6CDA51C" stroke-width="2"/>';
    s+='<path d="M160 125H1040M160 422H1040" stroke="#C6B271" stroke-width="2"/><path d="M300 45H900M390 62H810" stroke="#E6D8A3" stroke-width="4" opacity=".6"/>';
  }else{
    for(let i=0;i<13;i++)s+='<path d="M'+(i*95)+' 440 '+(-220+i*135)+' 720" stroke="#796C4C25" stroke-width="2"/>';
    for(const y of [490,555,645])s+='<path d="M0 '+y+'H1200" stroke="#F0DAB42D"/>';
    s+='<path d="M120 430H1080" stroke="#6E6A50" stroke-width="13"/>';
  }
  s+='<text x="600" y="160" text-anchor="middle" font-family="Georgia,serif" font-size="37" letter-spacing="13" fill="'+texto+'">TUTORIAS</text><text x="600" y="190" text-anchor="middle" font-size="10" letter-spacing="5" fill="'+texto+'" opacity=".7">CADA CICLO, UMA CONQUISTA.</text><path d="M450 214H750" stroke="#AF4547" stroke-width="3"/><path d="M480 222H720" stroke="'+(luxo?'#D9D9B5':'#273C32')+'" stroke-width="2"/>';
  const xs=visiveis.length===1?[600]:visiveis.length===2?[390,810]:[285,600,915];
  (visiveis.length?visiveis:[null]).forEach((c,i)=>{
    const x=c?xs[i]:600,id=prefix+'-taca-'+i,ativo=c&&c.id===estadoMuseu.selecionado,numero=lista.length-(pagina*cap+i);
    if(luxo){s+='<path d="M'+(x-65)+' 108 '+(x-130)+' 515H'+(x+130)+'L'+(x+65)+' 108Z" fill="url(#'+prefix+'-luz)" opacity=".5"/><ellipse cx="'+x+'" cy="628" rx="130" ry="27" fill="url(#'+prefix+'-luz)"/>';}
    s+='<ellipse cx="'+(x+8)+'" cy="632" rx="110" ry="20" fill="#0C211930"/>';
    if(c&&luxo)s+='<g opacity=".12" mask="url(#'+prefix+'-mascara)" aria-hidden="true"><use href="#'+id+'" transform="translate(0 1000) scale(1 -1)"/></g>';
    const attrs=c&&interativo?' data-tutoria="'+escapar(c.id)+'" role="button" tabindex="0" aria-label="Ver Tutoria: '+escapar(c.nome)+'"':'';
    s+='<g'+attrs+'>'+(c?'<title>Tutoria · '+escapar(c.nome)+'</title>':'')+'<path d="M'+(x-94)+' 502H'+(x+94)+'V620H'+(x-94)+'Z" fill="'+(luxo?'#243B32':'#74624A')+'"/><path d="M'+(x+94)+' 502l13-10v115l-13 13Z" fill="'+(luxo?'#152A22':'#504934')+'"/><path d="M'+(x-94)+' 502l13-10h188l-13 10Z" fill="'+(luxo?'#94A18B':'#A28C68')+'"/><path d="M'+(x-96)+' 509H'+(x+96)+'M'+(x-96)+' 616H'+(x+96)+'" stroke="'+(luxo?'#C3AC6B':'#8B7857')+'" stroke-width="3"/>';
    if(c)s+='<g id="'+id+'" transform="translate('+x+' 421) scale(1)">'+tacaTutoriaSvg(prefix)+'</g>';
    s+='<path class="museu-vidro" d="M'+(x-101)+' 269H'+(x+101)+'V503H'+(x-101)+'Z" fill="url(#'+prefix+'-vidro)" stroke="'+(ativo?'#EED98C':luxo?'#CDDBB28C':'#9CAFA77A')+'" stroke-width="'+(ativo?3:1.4)+'"/><path d="M'+(x-101)+' 269l15-9h200l-13 9M'+(x+101)+' 269l13-9v234l-13 9" fill="none" stroke="#C0D2BB66" stroke-width="1.2"/><path d="M'+(x-86)+' 280v185M'+(x-79)+' 280v60" stroke="#F4FFFF" opacity=".2" stroke-width="3"/>';
    if(luxo)s+='<path d="M'+(x-87)+' 495H'+(x+87)+'" stroke="#F6E3A2" stroke-width="3"/><path d="M'+(x-88)+' 498H'+(x+88)+'" stroke="#F6E3A2" stroke-width="10" opacity=".12"/>';
    s+='<rect x="'+(x-76)+'" y="536" width="152" height="59" rx="3" fill="'+(luxo?'#B39A5B':'#C3B68D')+'" stroke="#D4C795" stroke-width="1"/><text x="'+x+'" y="552" text-anchor="middle" font-size="9" letter-spacing="3" font-weight="800" fill="#263B2B">'+(c?'TUTORIA · '+String(numero).padStart(2,'0'):'EM BREVE')+'</text>';
    const linhas=linhasPlacaMuseu(c?c.nome:'Seu primeiro ciclo');
    linhas.forEach((l,k)=>{s+='<text x="'+x+'" y="'+(569+k*14)+'" text-anchor="middle" font-size="11" font-weight="600" fill="#243B2C">'+escapar(l)+'</text>';});
    s+='</g>';
  });
  s+='<path d="M0 691H1200" stroke="'+(luxo?'#D4BF7A':'#756B4F')+'" opacity=".35"/><text x="600" y="704" text-anchor="middle" font-size="9" letter-spacing="6" fill="'+(luxo?'#D7DBB8':'#74684B')+'">COPEIRO · '+(luxo?'GALERIA DE HONRA':'SALA DAS TUTORIAS')+'</text></svg>';
  return s;
}
function renderMuseuEstante(){
  const lista=ciclosEncerrados(),horas=lista.reduce((s,c)=>s+(c.congelado?.minutos||0),0);
  document.getElementById('estanteResumo').textContent=lista.length?lista.length+' '+(lista.length===1?'Tutoria conquistada':'Tutorias conquistadas')+' · '+humanoMin(horas)+' de dedicação guardados.':'Cada ciclo encerrado conquista uma Tutoria. Sua primeira vitrine está esperando.';
  document.getElementById('seloNivelMuseu').textContent='Nível '+nivelMuseu()+' de 2';
  document.getElementById('resumoEntradaMuseu').innerHTML='<strong>'+nomeNivelMuseu()+'</strong> · '+(nivelMuseu()===2?'Mármore, luz cênica e vitrines de honra.':'Uma sala acolhedora para começar sua coleção.');
  document.getElementById('previaMuseu').innerHTML=desenharSalaMuseu('previa',false);
  if(document.getElementById('museuTutorias').open)renderSalaMuseu();
}
function renderSalaMuseu(){
  const lista=ciclosEncerrados(),cap=capacidadeMuseu();estadoMuseu.pagina=Math.max(0,Math.min(estadoMuseu.pagina,Math.max(0,Math.ceil(lista.length/cap)-1)));
  if(!lista.some(c=>c.id===estadoMuseu.selecionado))estadoMuseu.selecionado=lista[estadoMuseu.pagina*cap]?.id||null;
  const c=lista.find(c=>c.id===estadoMuseu.selecionado),g=c?.congelado||{minutos:0,blocos:0,diasAtivos:0,maiorSequencia:0};
  document.getElementById('cenaMuseu').innerHTML=desenharSalaMuseu('sala',true);
  document.getElementById('subtituloMuseu').textContent=nomeNivelMuseu()+' · '+lista.length+' '+(lista.length===1?'Tutoria':'Tutorias');
  document.getElementById('museuAnterior').disabled=estadoMuseu.pagina===0;document.getElementById('museuProximo').disabled=(estadoMuseu.pagina+1)*cap>=lista.length;
  document.getElementById('paginaMuseu').textContent=lista.length?(estadoMuseu.pagina*cap+1)+'–'+Math.min(lista.length,(estadoMuseu.pagina+1)*cap)+' de '+lista.length+' Tutorias':'A primeira Tutoria virá com seu próximo ciclo encerrado.';
  document.getElementById('detalheTutoria').innerHTML=c?'<span class="museu-kicker">Tutoria · Conquistada</span><h3>'+escapar(c.nome)+'</h3><p>'+formatarDataLonga(c.inicio)+' → '+formatarDataLonga(c.encerradoEm)+'</p><div class="museu-metricas">'+[[humanoMin(g.minutos),'De estudo'],[g.blocos||0,'Blocos'],[g.diasAtivos||0,'Dias ativos'],[g.maiorSequencia||0,'Dias em sequência']].map(([v,r])=>'<div><strong>'+v+'</strong><small>'+r+'</small></div>').join('')+'</div><p class="museu-frase">“O esforço passa. A conquista fica.”</p><p>Esta Tutoria guarda os resultados do seu ciclo encerrado.</p>':'<span class="museu-kicker">Sua história começa aqui</span><h3>Uma vitrine esperando por você.</h3><p>Encerre um ciclo para conquistar sua primeira Tutoria. Cada ciclo terá a sua própria taça, com o nome e os resultados preservados.</p>';
  const max=nivelMuseu()===2,saldo=saldoDinheiro();
  document.getElementById('nivelMuseuTexto').textContent='Nível '+nivelMuseu()+' de 2 · '+nomeNivelMuseu();
  document.getElementById('descricaoNivelMuseu').textContent=max?'Sua Galeria de Honra está completa: piso de mármore, detalhes dourados, luzes cênicas e vitrines iluminadas.':'Renove para a Galeria de Honra: mármore, detalhes dourados e iluminação dedicada para suas Tutorias. Pagamento único de R$ 500.';
  document.getElementById('saldoMuseu').textContent='Seu dinheiro: '+formatarDinheiro(saldo)+(!max&&saldo<PRECO_MUSEU?' · faltam '+formatarDinheiro(PRECO_MUSEU-saldo)+'.':'');
  document.getElementById('melhorarMuseu').hidden=max;document.getElementById('melhorarMuseu').disabled=max||saldo<PRECO_MUSEU;
}
function abrirMuseu(id){
  estadoMuseu.retorno=document.activeElement;const lista=ciclosEncerrados(),index=lista.findIndex(c=>c.id===id);
  estadoMuseu.pagina=index>=0?Math.floor(index/capacidadeMuseu()):0;estadoMuseu.selecionado=index>=0?id:lista[0]?.id||null;
  document.getElementById('avisoMuseu').textContent='';renderSalaMuseu();document.getElementById('museuTutorias').showModal();document.getElementById('fecharMuseu').focus();
}
function melhorarMuseu(){
  if(nivelMuseu()===2)return false;
  if(saldoDinheiro()<PRECO_MUSEU){document.getElementById('avisoMuseu').textContent='Faltam '+formatarDinheiro(PRECO_MUSEU-saldoDinheiro())+' para renovar o museu.';return false;}
  const gastas=loja.gastas+PRECO_MUSEU;if(!Number.isSafeInteger(gastas))return false;
  const proximo={...loja,gastas,niveis:{...loja.niveis,museu:2}};
  if(!Armazem.gravar(CHAVES.loja,proximo)){document.getElementById('avisoMuseu').textContent='Não consegui salvar a melhoria. Seu dinheiro foi mantido.';return false;}
  loja=proximo;document.getElementById('avisoMuseu').textContent='';renderEstante();renderLoja();mostrarAviso('Galeria de Honra inaugurada. Suas Tutorias ganharam uma nova casa!','recorde');return true;
}
function iniciarExperiencias(){
  document.getElementById('entrarMuseu').addEventListener('click',()=>abrirMuseu());
  document.getElementById('fecharMuseu').addEventListener('click',()=>document.getElementById('museuTutorias').close());
  document.getElementById('museuTutorias').addEventListener('close',()=>{if(estadoMuseu.retorno?.isConnected)estadoMuseu.retorno.focus({preventScroll:true});});
  document.getElementById('prateleira').addEventListener('click',e=>{const b=e.target.closest('[data-ver-tutoria]');if(b)abrirMuseu(b.dataset.verTutoria);});
  document.getElementById('melhorarMuseu').addEventListener('click',melhorarMuseu);
  for(const [id,d]of [['museuAnterior',-1],['museuProximo',1]])document.getElementById(id).addEventListener('click',()=>{estadoMuseu.pagina+=d;estadoMuseu.selecionado=ciclosEncerrados()[estadoMuseu.pagina*capacidadeMuseu()]?.id||null;renderSalaMuseu();});
  const selecionar=e=>{const alvo=e.target.closest('[data-tutoria]');if(!alvo)return;estadoMuseu.selecionado=alvo.dataset.tutoria;renderSalaMuseu();document.querySelector('#cenaMuseu [data-tutoria="'+CSS.escape(estadoMuseu.selecionado)+'"]')?.focus({preventScroll:true});};
  document.getElementById('cenaMuseu').addEventListener('click',selecionar);
  document.getElementById('cenaMuseu').addEventListener('keydown',e=>{if((e.key==='Enter'||e.code==='Space')&&e.target.closest('[data-tutoria]')){e.preventDefault();e.stopPropagation();selecionar(e);}});
  document.querySelector('.ambiente-periodos').addEventListener('click',e=>{const b=e.target.closest('[data-periodo-estadio]');if(b)salvarAmbienteEstadio({periodo:b.dataset.periodoEstadio});});
  document.getElementById('climaEstadio').addEventListener('change',e=>salvarAmbienteEstadio({clima:e.target.value}));
  let ultimo=JSON.stringify(ambienteEstadioAtual());
  const atualizar=()=>{const atual=JSON.stringify(ambienteEstadioAtual());if(atual!==ultimo){ultimo=atual;renderEstadio();}};
  let capAnterior=capacidadeMuseu();
  window.addEventListener('resize',()=>{const cap=capacidadeMuseu();if(cap!==capAnterior){capAnterior=cap;const i=ciclosEncerrados().findIndex(c=>c.id===estadoMuseu.selecionado);estadoMuseu.pagina=i>=0?Math.floor(i/cap):0;renderMuseuEstante();}});
  setInterval(atualizar,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)atualizar();});
}
