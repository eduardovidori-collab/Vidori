/* Apresentação do estádio e Museu das Tutorias. Nenhuma alteração nas regras de estudo. */
const PRECO_MUSEU=500;
const estadoMuseu={pagina:0,selecionado:null,trofeu:'tutoria',retorno:null};
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
function nuvemAmbienteSvg(prefix,cx,cy,largura,altura,indice){
  // Uma silhueta contínua, com volumes iluminados e sombra na base.
  const forma='M-112 15C-130 11-131-12-113-19C-108-39-86-46-69-34C-59-63-18-68-1-41C19-57 45-45 50-27C70-43 98-32 103-11C133-13 138 15 115 24C64 35-56 33-112 15Z';
  return `<g class="nuvem-ambiente" data-nuvem="${indice}" style="--deriva:${largura*.07}px;--duracao:${76+indice*13}s;--atraso-nuvem:-${indice*17}s"><g transform="translate(${cx} ${cy}) scale(${largura/260} ${altura/100})"><path d="${forma}" fill="url(#${prefix}-nuvem)"/><path d="M-110 16Q-49 32 9 22T114 19Q65 39-20 30T-110 16Z" fill="url(#${prefix}-sombra-nuvem)"/><path d="M-108-17Q-88-34-70-26M-60-36Q-32-57-9-36M7-36Q30-46 46-25" fill="none" stroke="url(#${prefix}-borda-nuvem)" stroke-width="3.5" stroke-linecap="round" opacity=".65"/></g></g>`;
}
function desenharCeuAmbiente(x,y,w,h,prefix,astroDireita=false){
  const a=ambienteEstadioAtual(),noite=a.periodo==='noite',tarde=a.periodo==='entardecer',chuva=a.clima==='chuva',limpo=a.clima==='limpo';
  const paleta=noite?(chuva?['#152435','#324B58','#718390','#3A4B62']:['#101F36','#385167','#A9BDCB','#53667F']):tarde?(chuva?['#697387','#CCAD9F','#E8C7B4','#8C8799']:['#909DBF','#F4C5A0','#FFF1D4','#C99CAB']):(chuva?['#93A7B6','#CCD8D5','#E7EDEA','#9CACB7']:['#9ECADB','#E9F0E5','#FFFFFF','#B2CDD9']);
  if(!limpo&&!chuva){paleta[0]=noite?'#182A3E':tarde?'#969CB2':'#B1C6CE';paleta[1]=noite?'#3B5263':tarde?'#DDC0AB':'#DEE7DD';}
  const solX=x+w*(astroDireita?.84:.13),solY=y+h*(tarde?.24:.13),r=w*(noite?.023:tarde?.032:.024);
  let s=`<defs><linearGradient id="${prefix}-ciel" x2="0" y2="1"><stop stop-color="${paleta[0]}"/><stop offset=".65" stop-color="${paleta[1]}"/><stop offset="1" stop-color="${noite?'#435F62':tarde?'#F3D8B6':'#EDF1DF'}"/></linearGradient><radialGradient id="${prefix}-aureola"><stop stop-color="${noite?'#CEE6E3':'#FFE6AD'}" stop-opacity="${noite?'.14':'.55'}"/><stop offset=".35" stop-color="${tarde?'#F8AE83':'#E8F0DF'}" stop-opacity=".14"/><stop offset="1" stop-color="#FFF6DD" stop-opacity="0"/></radialGradient><linearGradient id="${prefix}-nuvem" x2=".12" y2="1"><stop stop-color="${paleta[2]}" stop-opacity="${noite?'.66':'.96'}"/><stop offset=".48" stop-color="${paleta[2]}" stop-opacity="${noite?'.44':'.85'}"/><stop offset="1" stop-color="${paleta[3]}" stop-opacity="${noite?'.55':'.75'}"/></linearGradient><linearGradient id="${prefix}-sombra-nuvem" x2="0" y2="1"><stop stop-color="${paleta[3]}" stop-opacity="0"/><stop offset="1" stop-color="${paleta[3]}" stop-opacity=".4"/></linearGradient><linearGradient id="${prefix}-borda-nuvem"><stop stop-color="${noite?'#B6D0DA':tarde?'#FFE7BE':'#FFFFFF'}" stop-opacity=".8"/><stop offset="1" stop-color="${paleta[2]}" stop-opacity="0"/></linearGradient></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${prefix}-ciel)"/><ellipse cx="${solX}" cy="${solY}" rx="${w*.19}" ry="${h*.32}" fill="url(#${prefix}-aureola)"/>`;
  if(noite){
    const n=limpo?43:chuva?0:12;
    for(let i=0;i<n;i++){
      const sx=x+((i*163+53)%997)/997*w,sy=y+((i*83+9)%193)/997*h,raio=w*(i%9===0?.0014:.0008);
      s+=`<circle cx="${sx}" cy="${sy}" r="${raio}" fill="#E1EEE9" opacity="${.23+(i%5)*.12}"/>`;
      if(i%13===0)s+=`<path d="M${sx-raio*2.8} ${sy}h${raio*5.6}M${sx} ${sy-raio*2.8}v${raio*5.6}" stroke="#D6E8E3" stroke-width="${raio*.45}" opacity=".3"/>`;
    }
    if(!chuva)s+=`<path d="M${solX} ${solY-r}a${r} ${r} 0 1 0 ${r*.74} ${r*1.79}a${r*.91} ${r*.91} 0 0 1 ${-r*.74} ${-r*1.79}Z" fill="#EEEAD1" opacity="${limpo?.9:.55}"/>`;
  }else{
    s+=`<circle cx="${solX}" cy="${solY}" r="${r*1.5}" fill="#FFEAB7" opacity="${limpo?.12:.04}"/><circle cx="${solX}" cy="${solY}" r="${r}" fill="${tarde?'#FFE2A9':'#FFF8DC'}" opacity="${limpo?.92:.27}"/>`;
    if(tarde)s+=`<path d="M${x} ${y+h*.34}Q${x+w*.5} ${y+h*.24} ${x+w} ${y+h*.36}" stroke="#F9D4B3" stroke-width="${h*.023}" fill="none" opacity=".2"/>`;
  }
  // As nuvens ficam atrás do modelo, preservando a leitura das arquibancadas.
  const masses=limpo?(noite?[[.79,.14,.16,.055],[.28,.24,.12,.04]]:[[.27,.12,.19,.08],[.81,.17,.24,.09],[.08,.29,.13,.04]]):[[.08,.1,.28,.115],[.38,.075,.29,.10],[.76,.115,.34,.13],[.96,.25,.28,.10],[.17,.29,.27,.09]];
  masses.forEach(([px,py,pw,ph],i)=>{s+=nuvemAmbienteSvg(prefix,x+w*px,y+h*py,w*pw,h*ph,i);});
  if(chuva)s+=`<path d="M${x} ${y+h*.29}Q${x+w*.25} ${y+h*.22} ${x+w*.47} ${y+h*.28}T${x+w} ${y+h*.26}" fill="none" stroke="#A1B2BE" stroke-width="${h*.065}" opacity=".12"/>`;
  return `<g data-ceu-ambiente="${a.periodo}" aria-hidden="true" pointer-events="none">${s}</g>`;
}
function astroFundoJogo(prefix='jogo'){return desenharCeuAmbiente(0,0,900,540,prefix+'-ceu-ambiente',true);}
function ceuSvgEstadio(x,y,w,h){return desenharCeuAmbiente(x,y,w,h,'morumbi-ceu');}
/** Registra as Clínicas nos dois ciclos existentes, uma única vez por perfil. */
function prepararTrofeusSecundariosMuseu(){
  if(Object.hasOwn(config,'trofeusSecundariosMuseu'))return true;
  const fontes=ciclos.filter(c=>c&&typeof c.id==='string').slice().sort((a,b)=>String(b.inicio).localeCompare(String(a.inicio))).slice(0,2);
  const registro={versao:1,conquistas:fontes.map(c=>({id:'clinicas',nome:'Clínicas',cicloId:c.id}))};
  const proximo={...config,trofeusSecundariosMuseu:registro};
  if(!Armazem.gravar(CHAVES.config,proximo))return false;
  config=proximo;return true;
}
function trofeusSecundariosDoCiclo(c){
  if(!c)return [];
  const fontes=config.trofeusSecundariosMuseu?.conquistas;
  return Array.isArray(fontes)&&fontes.some(t=>t&&t.id==='clinicas'&&t.cicloId===c.id)?[{id:'clinicas',nome:'Clínicas'}]:[];
}
function ciclosDoMuseu(){
  return ciclos.filter(c=>c&&(c.encerradoEm||trofeusSecundariosDoCiclo(c).length)).slice().sort((a,b)=>String(b.inicio).localeCompare(String(a.inicio)));
}
function resumoTitulosMuseu(){
  const principais=ciclosEncerrados().length,secundarios=ciclosDoMuseu().reduce((s,c)=>s+trofeusSecundariosDoCiclo(c).length,0);
  return principais+' '+(principais===1?'Tutoria':'Tutorias')+(secundarios?' · '+secundarios+' '+(secundarios===1?'troféu Clínicas':'troféus Clínicas'):'');
}
function tacaClinicasSvg(prefix){
  // A mesma família de materiais, com uma copa compacta e sem a gravação Tutoria.
  return `<g class="taca-clinicas"><ellipse cy="79" rx="48" ry="3" fill="#13251B" opacity=".24"/>
    <path d="M-35-79C-78-97-90-51-64-35L-34-24M35-79C78-97 90-51 64-35L34-24" fill="none" stroke="#795523" stroke-width="11"/>
    <path d="M-35-81C-76-94-86-53-62-38L-35-28M35-81C76-94 86-53 62-38L35-28" fill="none" stroke="url(#${prefix}-metal)" stroke-width="7"/>
    <path d="M-43-93H43L35-45Q29-19 8-12H-8Q-29-19-35-45Z" fill="url(#${prefix}-ouro)" stroke="#A07A35" stroke-width="1.2"/>
    <ellipse cy="-93" rx="43" ry="8" fill="url(#${prefix}-metal)"/><ellipse cy="-94" rx="35" ry="4.5" fill="url(#${prefix}-interior)"/>
    <path d="M-28-83-22-48Q-19-31-10-24" fill="none" stroke="#FFF2C3" stroke-width="3" opacity=".55"/>
    <path d="M-7-11H7L5 29H-5Z" fill="url(#${prefix}-ouro)"/><path d="M-5 27Q-11 40-27 44L-32 51H32L27 44Q11 40 5 27Z" fill="url(#${prefix}-ouro)"/><ellipse cy="51" rx="32" ry="5" fill="url(#${prefix}-metal)"/>
    <rect x="-40" y="60" width="80" height="17" rx="2" fill="url(#${prefix}-pedra)"/><path d="M-38 59H38M-41 77H41" stroke="url(#${prefix}-metal)" stroke-width="3"/>
    <circle cy="-57" r="17" fill="#EDD697" stroke="#A47E39" stroke-width="1.5"/><path d="m0-69 3.5 7.6 8.3 1-6.2 5.7 1.6 8.2L0-50.6l-7.2 4.1 1.6-8.2-6.2-5.7 8.3-1Z" fill="#967031"/>
    <rect x="-23" y="63" width="46" height="9" rx="1" fill="#C4A66B"/><text x="0" y="69.5" font-size="5.2" letter-spacing=".9" text-anchor="middle" fill="#354235">CLÍNICAS</text></g>`;
}
function vitrineClinicasSvg(prefix,c,x,interativo,luxo){
  const ativo=estadoMuseu.selecionado===c.id&&estadoMuseu.trofeu==='clinicas';
  const attrs=interativo?` data-tutoria="${escapar(c.id)}" data-trofeu="clinicas" role="button" tabindex="0" aria-label="Ver troféu Clínicas: ${escapar(c.nome)}" aria-pressed="${ativo}"`:'';
  return `<g data-vitrine-secundaria="clinicas"${attrs}><title>Clínicas · ${escapar(c.nome)}</title>
    <path d="M${x-79} 546V397Q${x-79} 355 ${x} 355Q${x+79} 355 ${x+79} 397V546Z" fill="url(#${prefix}-nicho)" stroke="#BDA873" stroke-opacity=".35"/>
    <ellipse cx="${x}" cy="456" rx="77" ry="101" fill="url(#${prefix}-luz)"/><rect x="${x-17}" y="353" width="34" height="4" rx="2" fill="#C1AB74"/><path d="M${x-12} 358h24" stroke="#FFF0C1" opacity=".6"/>
    <ellipse cx="${x+5}" cy="628" rx="87" ry="13" fill="#11251B" opacity=".16"/>
    <path d="M${x-74} 553H${x+74}V621H${x-74}Z" fill="url(#${prefix}-pedestal)"/><path d="M${x+74} 553l10-8v68l-10 8Z" fill="${luxo?'#182E29':'#594C35'}"/><path d="M${x-79} 553l10-8h158l-10 8Z" fill="${luxo?'#8E9C86':'#BA9D70'}"/>
    <path d="M${x-76} 558H${x+76}M${x-76} 618H${x+76}" stroke="#B9A16B" stroke-width="1.5"/>
    <g data-taca-secundaria="clinicas" transform="translate(${x} 491) scale(.74)">${tacaClinicasSvg(prefix)}</g>
    <path class="museu-vidro" d="M${x-69} 376H${x+69}V553H${x-69}Z" fill="url(#${prefix}-vidro)" stroke="${ativo?'#EBD695':'#BCD0BB'}" stroke-opacity="${ativo?'.95':'.6'}" stroke-width="${ativo?2:1.2}"/>
    <path d="M${x-69} 376l10-7h138l-10 7M${x+69} 376l10-7v177l-10 7M${x-64} 383v163" fill="none" stroke="#E3F3E8" stroke-width="1" opacity=".4"/>
    ${luxo?`<path d="M${x-63} 550H${x+63}" stroke="#F4DF9F" stroke-width="2"/>`:''}
    <rect x="${x-61}" y="569" width="122" height="36" rx="2" fill="${luxo?'#CAB77E':'#CCBC92'}" stroke="#DDCCA0"/>
    <text x="${x}" y="584" text-anchor="middle" font-size="10" letter-spacing="1.8" font-weight="800" fill="#30402E">CLÍNICAS</text><text x="${x}" y="597" text-anchor="middle" font-size="7.8" fill="#405039">PROVA SECUNDÁRIA</text></g>`;
}
function capacidadeMuseu(){return matchMedia('(max-width:550px)').matches?1:ciclosDoMuseu().some(c=>trofeusSecundariosDoCiclo(c).length)?2:3;}
function chuvaSvgAmbiente(x,y,w,h,prefix){
  if(ambienteEstadioAtual().clima!=='chuva')return '';
  let linhas='';for(let i=0;i<85;i++){
    const px=x+((i*197)%997)/997*w,py=y+((i*137)%991)/991*h,l=w*.012;
    linhas+='<path d="M'+px.toFixed(2)+' '+py.toFixed(2)+'l'+(-l*.35).toFixed(2)+' '+l.toFixed(2)+'" style="--atraso:-'+((i%11)/13).toFixed(2)+'s"/>';
  }
  return '<g class="chuva-ambiente" data-chuva="'+prefix+'" stroke="#DBECF3" stroke-width="'+(w*.0008)+'" opacity=".4">'+linhas+'</g>';
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
function defsTacaMuseu(prefix){
  return `<linearGradient id="${prefix}-ouro"><stop stop-color="#80511B"/><stop offset=".13" stop-color="#C48E32"/><stop offset=".3" stop-color="#FFE9A2"/><stop offset=".43" stop-color="#FFF4C1"/><stop offset=".55" stop-color="#D8AB51"/><stop offset=".76" stop-color="#F1CD77"/><stop offset=".9" stop-color="#B77C29"/><stop offset="1" stop-color="#79501E"/></linearGradient><linearGradient id="${prefix}-metal" x2=".2" y2="1"><stop stop-color="#FFF1B7"/><stop offset=".28" stop-color="#DAB361"/><stop offset=".57" stop-color="#9E6C25"/><stop offset=".76" stop-color="#E7C77B"/><stop offset="1" stop-color="#886024"/></linearGradient><linearGradient id="${prefix}-interior" x2="0" y2="1"><stop stop-color="#674318"/><stop offset="1" stop-color="#C79C4D"/></linearGradient><linearGradient id="${prefix}-pedra"><stop stop-color="#142B29"/><stop offset=".4" stop-color="#3A4B41"/><stop offset=".68" stop-color="#1B302C"/><stop offset="1" stop-color="#0D211F"/></linearGradient>`;
}
function tacaTutoriaSvg(prefix){
  let s=`<g class="taca-tutoria"><ellipse cy="79" rx="48" ry="3" fill="#13251B" opacity=".24"/>
    <path d="M-40-90C-86-113-105-69-76-39Q-60-23-36-43M40-90C86-113 105-69 76-39Q60-23 36-43" fill="none" stroke="#78521F" stroke-width="12"/>
    <path d="M-40-92C-85-110-101-69-74-41Q-61-29-38-45M40-92C85-110 101-69 74-41Q61-29 38-45" fill="none" stroke="url(#${prefix}-metal)" stroke-width="8"/>
    <path d="M-51-95C-81-101-89-79-81-61M51-95C81-101 89-79 81-61" fill="none" stroke="#FFF1BA" stroke-width="1.7" opacity=".8"/>
    <path d="M-45-101Q0-92 45-101L38-61Q34-28 11-16H-11Q-34-28-38-61Z" fill="url(#${prefix}-ouro)" stroke="#9C712E" stroke-width="1.1"/>`;
  for(const d of [-29,-20,20,29])s+=`<path d="M${d}-92Q${d*.85}-39 ${d*.28}-21" fill="none" stroke="${d<0?'#FFF2BF':'#936528'}" stroke-width="${Math.abs(d)===20?1.4:.8}" opacity=".28"/>`;
  s+=`<ellipse cy="-101" rx="45" ry="8.5" fill="url(#${prefix}-metal)" stroke="#FBE6A0" stroke-width="1.3"/><ellipse cy="-102" rx="37" ry="5" fill="url(#${prefix}-interior)"/><path d="M-31-105Q0-111 31-105" fill="none" stroke="#FFF0B0" stroke-width="1.2" opacity=".8"/>
    <path d="M-32-91-27-64Q-24-39-14-29" fill="none" stroke="#FFF8D7" stroke-width="3" opacity=".55"/>
    <path d="M-11-16H11L8-9H-8ZM-6-9H6L5 28H-5Z" fill="url(#${prefix}-ouro)" stroke="#AF853B" stroke-width=".7"/><ellipse cy="-9" rx="12" ry="3.3" fill="url(#${prefix}-metal)"/>
    <path d="M-5 25Q-10 37-24 41L-29 48H29L24 41Q10 37 5 25Z" fill="url(#${prefix}-ouro)" stroke="#B28A42" stroke-width=".8"/><ellipse cy="47" rx="30" ry="5" fill="url(#${prefix}-metal)"/>
    <path d="M-34 53-40 59H40L34 53Z" fill="#AB8B4B"/><rect x="-40" y="59" width="80" height="17" rx="2" fill="url(#${prefix}-pedra)" stroke="#172A23"/><path d="M-36 61 7 70 20 65 37 73M-27 74-2 70" fill="none" stroke="#97A699" stroke-width=".6" opacity=".25"/><path d="M-40 59H40M-41 77H41" stroke="url(#${prefix}-metal)" stroke-width="3"/>
    <rect x="-17" y="63" width="34" height="9" rx="1" fill="#C4A66B"/><text x="0" y="69.5" font-family="Georgia,serif" font-size="4.8" letter-spacing="1.1" text-anchor="middle" fill="#354235">TUTORIA</text>
    <path d="M-12-74H12V-58L0-47-12-58Z" fill="#F3E4AF" stroke="#B48C42" stroke-width="1.5"/><path d="M-10-71H10V-65H-10Z" fill="#263932"/><path d="M-10-62H-1V-51L-10-59Z" fill="#AA3A42"/><path d="M1-62H10V-59L1-51Z" fill="#2F4036"/>
    <path d="M-17-48Q-28-59-22-73M17-48Q28-59 22-73" fill="none" stroke="#F8E1A0" stroke-width="1" opacity=".8"/>`;
  for(const lado of [-1,1])for(let i=0;i<4;i++)s+=`<ellipse cx="${lado*(21+i*.6)}" cy="${-53-i*4.8}" rx="1.6" ry="3.3" transform="rotate(${lado*35} ${lado*(21+i*.6)} ${-53-i*4.8})" fill="#FAE5AB" opacity=".65"/>`;
  return s+'</g>';
}
function desenharSalaMuseu(prefix='sala',interativo=true){
  const luxo=nivelMuseu()===2,lista=ciclosDoMuseu(),cap=capacidadeMuseu(),pagina=interativo?estadoMuseu.pagina:0,visiveis=lista.slice(pagina*cap,pagina*cap+cap);
  const C=luxo?{parede:'#213B35',paredeTopo:'#344A40',teto:'#142A25',lateral:'#182F29',piso:'#D8D9CD',pisoFrente:'#9FAEA2',pedestal:'#263D35',madeira:'#182E29',borda:'#BAA46E',texto:'#E5D6A2',nicho:'#152C26'}:
    {parede:'#DAD9C8',paredeTopo:'#F3EFDF',teto:'#C6C7B7',lateral:'#BDC5B6',piso:'#BB9E77',pisoFrente:'#E0C8A0',pedestal:'#816448',madeira:'#594C35',borda:'#A58E5C',texto:'#5D6650',nicho:'#B4B8A2'};
  let s=`<svg viewBox="${cap===1?'250 100 700 620':'0 0 1200 720'}" preserveAspectRatio="${interativo?'xMidYMid meet':'xMidYMid slice'}" role="${interativo?'group':'img'}" aria-label="${nomeNivelMuseu()}, ${resumoTitulosMuseu()}"><defs>
    ${defsTacaMuseu(prefix)}
    <linearGradient id="${prefix}-parede" x2="0" y2="1"><stop stop-color="${C.paredeTopo}"/><stop offset="1" stop-color="${C.parede}"/></linearGradient>
    <linearGradient id="${prefix}-piso" x2="0" y2="1"><stop stop-color="${C.piso}"/><stop offset="1" stop-color="${C.pisoFrente}"/></linearGradient>
    <linearGradient id="${prefix}-pedestal"><stop stop-color="${C.madeira}"/><stop offset=".22" stop-color="${C.pedestal}"/><stop offset=".8" stop-color="${C.pedestal}"/><stop offset="1" stop-color="${C.madeira}"/></linearGradient>
    <linearGradient id="${prefix}-nicho" x2=".1" y2="1"><stop stop-color="${C.nicho}"/><stop offset="1" stop-color="${luxo?'#314C3E':'#E5DFBD'}"/></linearGradient>
    <linearGradient id="${prefix}-vidro" x2="1" y2=".5"><stop stop-color="#DEF5EE" stop-opacity=".09"/><stop offset=".25" stop-color="#D8EEE9" stop-opacity=".015"/><stop offset=".72" stop-color="#FFFFFF" stop-opacity=".025"/><stop offset="1" stop-color="#D5EEE7" stop-opacity=".14"/></linearGradient>
    <radialGradient id="${prefix}-luz"><stop stop-color="#FFF1BC" stop-opacity="${luxo?'.45':'.3'}"/><stop offset=".55" stop-color="#FFF0C3" stop-opacity=".14"/><stop offset="1" stop-color="#FFF0B7" stop-opacity="0"/></radialGradient>
    <linearGradient id="${prefix}-facho" x2="0" y2="1"><stop stop-color="#FFF0BA" stop-opacity=".16"/><stop offset="1" stop-color="#FFF0BA" stop-opacity="0"/></linearGradient>
    <linearGradient id="${prefix}-reflexo" x2="0" y2="1"><stop stop-color="white" stop-opacity=".65"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>
    <mask id="${prefix}-mascara" maskUnits="userSpaceOnUse" x="0" y="621" width="1200" height="90"><rect y="621" width="1200" height="90" fill="url(#${prefix}-reflexo)"/></mask>
    <clipPath id="${prefix}-chao"><path d="M0 530 120 450H1080L1200 530V720H0Z"/></clipPath>
    <pattern id="${prefix}-veios" width="330" height="170" patternUnits="userSpaceOnUse"><path d="M-40 18Q15 49 77 31T201 63L240 80Q280 87 340 61M75 32 103 69 150 77M202 63 231 31" fill="none" stroke="${luxo?'#617668':'#684E32'}" stroke-width="${luxo?1.3:.6}" opacity="${luxo?'.16':'.14'}"/><path d="M-25 23Q20 54 80 37T199 69L246 87Q280 94 340 67" fill="none" stroke="#F7F1D8" stroke-width=".8" opacity=".3"/></pattern>
    <radialGradient id="${prefix}-vinheta"><stop offset=".45" stop-color="#0C231C" stop-opacity="0"/><stop offset="1" stop-color="#0C231C" stop-opacity=".22"/></radialGradient>
    </defs><rect width="1200" height="720" fill="${C.lateral}"/>
    <path d="M0 0H1200L1080 105H120Z" fill="${C.teto}"/><path d="M40 15H1160L1066 90H134Z" fill="#FFF3C9" opacity=".04"/>
    <path d="M0 0 120 105V450L0 530Z" fill="${C.lateral}"/><path d="M1200 0 1080 105V450L1200 530Z" fill="${luxo?'#102A24':'#B5BFAE'}"/>
    <path d="M120 105H1080V450H120Z" fill="url(#${prefix}-parede)"/>
    <path d="M0 530 120 450H1080L1200 530V720H0Z" fill="url(#${prefix}-piso)"/>
    <g clip-path="url(#${prefix}-chao)"><rect y="450" width="1200" height="270" fill="url(#${prefix}-veios)"/>`;
  // Juntas convergentes dão escala e profundidade sem competir com as taças.
  for(let i=0;i<(luxo?8:15);i++){
    const x=120+i*(luxo?137:69),frente=600+(x-600)*1.9;
    s+=`<path d="M${x} 450 ${frente} 720" stroke="${luxo?'#697C6B':'#785E3B'}" stroke-width="${luxo?1.2:.9}" opacity="${luxo?'.25':'.22'}"/>`;
  }
  for(const y of luxo?[494,554,644]:[478,517,569,635,711])s+=`<path d="M0 ${y}H1200" stroke="${luxo?'#728470':'#81633F'}" stroke-width="1" opacity=".2"/>`;
  s+=`<path d="M25 701 145 467H1055L1175 701Z" fill="none" stroke="${luxo?'#AD9E6B':'#F0D7A9'}" stroke-width="2" opacity=".38"/></g>`;
  // Rodapés, painéis laterais e luz indireta ancoram a sala ao piso.
  s+=`<path d="M0 521 120 442H1080L1200 521" fill="none" stroke="${luxo?'#112B25':'#50604B'}" stroke-width="15"/><path d="M0 513 120 434H1080L1200 513" fill="none" stroke="${C.borda}" stroke-width="2" opacity=".8"/>
    <path d="M0 20 120 112H1080L1200 20" fill="none" stroke="${C.borda}" stroke-width="4"/><path d="M124 117H1076" stroke="#FFF1BD" stroke-width="2" opacity=".55"/>
    <path d="M24 108 91 153V405L24 449ZM1176 108 1109 153V405L1176 449Z" fill="none" stroke="${C.borda}" stroke-width="2" opacity=".4"/>
    <path d="M150 131V415M1050 131V415" stroke="${C.borda}" stroke-width="${luxo?4:2}" opacity=".6"/>`;
  if(luxo){
    for(const x of [172,371,829,1028])s+=`<path d="M${x} 121V427" stroke="#0D241F" stroke-width="15" opacity=".3"/><path d="M${x+5} 121V427" stroke="#C1AB70" stroke-width="1.2" opacity=".6"/>`;
    s+=`<path d="M285 37H915M340 52H860" stroke="#F0D9A0" stroke-width="3" opacity=".65"/><path d="M260 35H940" stroke="#F3DCA0" stroke-width="13" opacity=".045"/>`;
  }else{
    s+=`<path d="M135 122H1065V225H135Z" fill="none" stroke="#FFF8DA" stroke-width="2" opacity=".4"/><path d="M300 45H900" stroke="#FDF4D8" stroke-width="5" opacity=".7"/>`;
  }
  s+=`<text x="600" y="162" text-anchor="middle" font-family="Georgia,serif" font-size="35" letter-spacing="12" fill="${C.texto}">${lista.some(c=>trofeusSecundariosDoCiclo(c).length)?'CONQUISTAS':'TUTORIAS'}</text><text x="600" y="190" text-anchor="middle" font-size="9" letter-spacing="4.5" fill="${C.texto}" opacity=".75">CADA ESFORÇO, UMA CONQUISTA.</text><path d="M470 211H730" stroke="${C.borda}" stroke-width="1" opacity=".7"/><path d="M563 218H587" stroke="#B3454A" stroke-width="3"/><path d="M591 218H609" stroke="${luxo?'#F2E9CE':'#FAF7E9'}" stroke-width="3"/><path d="M613 218H637" stroke="#263E33" stroke-width="3"/>`;
  const xs=visiveis.length===1?[600]:visiveis.length===2?[390,810]:[285,600,915];
  (visiveis.length?visiveis:[null]).forEach((c,i)=>{
    const secundaria=c&&trofeusSecundariosDoCiclo(c)[0],x=(c?xs[i]:600)-(secundaria?70:0),id=prefix+'-vitrine-'+i,ativo=!!(c&&c.id===estadoMuseu.selecionado&&estadoMuseu.trofeu==='tutoria'),numero=c?ciclosEncerrados().length-ciclosEncerrados().findIndex(t=>t.id===c.id):0;
    s+=`<path d="M${x-122} 441V302Q${x-122} 239 ${x} 239Q${x+122} 239 ${x+122} 302V441Z" fill="url(#${prefix}-nicho)" stroke="${C.borda}" stroke-opacity="${luxo?'.45':'.3'}" stroke-width="1.5"/><path d="M${x-118} 439V302Q${x-118} 244 ${x} 244Q${x+118} 244 ${x+118} 302" fill="none" stroke="#071C17" stroke-width="6" opacity=".1"/>
      <ellipse cx="${x}" cy="343" rx="126" ry="127" fill="url(#${prefix}-luz)"/>
      <path d="M${x-20} 244 ${x-88} 470H${x+88}L${x+20} 244Z" fill="url(#${prefix}-facho)"/>
      <rect x="${x-24}" y="237" width="48" height="5" rx="2" fill="${C.borda}"/><path d="M${x-18} 243H${x+18}" stroke="#FFF1C2" stroke-width="2" opacity=".8"/>
      <ellipse cx="${x+7}" cy="629" rx="125" ry="19" fill="#11251B" opacity=".18"/>`;
    if(luxo)s+=`<g class="museu-reflexo" opacity=".18" mask="url(#${prefix}-mascara)" aria-hidden="true" pointer-events="none"><use href="#${id}" transform="translate(0 744) scale(1 -.2)"/></g>`;
    const attrs=c&&interativo?` data-tutoria="${escapar(c.id)}" data-trofeu="tutoria" role="button" tabindex="0" aria-label="Ver ${c.encerradoEm?'Tutoria':'ciclo em andamento'}: ${escapar(c.nome)}" aria-pressed="${ativo}"`:'';
    s+=`<g id="${id}"${attrs}>${c?'<title>'+ (c.encerradoEm?'Tutoria':'Ciclo em andamento')+' · '+escapar(c.nome)+'</title>':''}
      <path d="M${x-104} 503H${x+104}V621H${x-104}Z" fill="url(#${prefix}-pedestal)"/><path d="M${x+104} 503l14-10v116l-14 12Z" fill="${C.madeira}"/>
      <path d="M${x-110} 503l14-11h220l-14 11Z" fill="${luxo?'#8E9C86':'#BA9D70'}"/>
      <path d="M${x-107} 509H${x+107}M${x-107} 618H${x+107}" stroke="${C.borda}" stroke-width="2"/>
      <path d="M${x-95} 516V608M${x+95} 516V608" stroke="${C.borda}" stroke-width="1" opacity=".5"/>`;
    if(luxo)s+=`<path d="M${x-100} 526q50 6 81 36t117 27M${x-80} 544l16 27 34 8" stroke="#B6C5AC" stroke-width=".8" opacity=".1" fill="none"/>`;
    else for(let j=0;j<9;j++)s+=`<path d="M${x-88+j*22} 513q6 44 0 99" stroke="#C1A87B" stroke-width=".6" opacity=".12" fill="none"/>`;
    s+=`<ellipse cx="${x}" cy="499" rx="56" ry="5" fill="#1E2C21" opacity=".2"/>`;
    if(c?.encerradoEm)s+=`<g id="${prefix}-taca-${i}" transform="translate(${x} 421)">${tacaTutoriaSvg(prefix)}</g>`;
    s+=`<path class="museu-vidro" d="M${x-101} 269H${x+101}V503H${x-101}Z" fill="url(#${prefix}-vidro)" stroke="${ativo?'#DCC78A':luxo?'#C6D9C7':'#9DAF9E'}" stroke-opacity="${ativo?'.9':'.65'}" stroke-width="${ativo?2:1.2}"/>
      <path d="M${x-101} 269l15-9h200l-13 9M${x+101} 269l13-9v234l-13 9" fill="none" stroke="#D8E9DC" stroke-opacity=".45" stroke-width="1"/>
      <path d="M${x-96} 278v214M${x-90} 278v58M${x+96} 281v202" stroke="#F2FFFF" opacity=".26" stroke-width="1.7"/>
      <path d="M${x-93} 278h14l122 214h-14Z" fill="#F5FFF8" opacity=".045"/>`;
    if(luxo)s+=`<path d="M${x-94} 498H${x+94}" stroke="#FFE5A3" stroke-width="2"/><path d="M${x-94} 499H${x+94}" stroke="#FFE5A3" stroke-width="8" opacity=".09"/>`;
    s+=`<rect x="${x-78}" y="536" width="156" height="58" rx="3" fill="${luxo?'#CAB77E':'#CCBC92'}" stroke="${luxo?'#E0D3A2':'#E0CCA0'}" stroke-width="1"/><path d="M${x-74} 540H${x+74}" stroke="#F4E9C1" opacity=".5"/>
      <text x="${x}" y="551" text-anchor="middle" font-size="8.8" letter-spacing="2.6" font-weight="800" fill="#31402E">${c?(c.encerradoEm?'TUTORIA · '+String(numero).padStart(2,'0'):'EM ANDAMENTO'):'EM BREVE'}</text>`;
    linhasPlacaMuseu(c?c.nome:'Seu primeiro ciclo').forEach((l,k)=>{s+=`<text x="${x}" y="${568+k*14}" text-anchor="middle" font-size="11" font-weight="600" fill="#293B2B">${escapar(l)}</text>`;});
    s+='</g>';
    if(secundaria)s+=vitrineClinicasSvg(prefix,c,x+175,interativo,luxo);
  });
  s+=`<rect width="1200" height="720" fill="url(#${prefix}-vinheta)" pointer-events="none"/><path d="M0 690H1200" stroke="${C.borda}" opacity=".35"/><text x="600" y="705" text-anchor="middle" font-size="8.5" letter-spacing="5" fill="${luxo?'#405C49':'#786548'}">COPEIRO · ${luxo?'GALERIA DE HONRA':'SALA DAS TUTORIAS'}</text></svg>`;
  return s;
}
function detalheConquistaMuseu(c){
  if(!c)return '<span class="museu-kicker">Sua história começa aqui</span><h3>Uma vitrine esperando por você.</h3><p>Encerre um ciclo para conquistar sua primeira Tutoria. Cada ciclo terá a sua própria taça, com o nome e os resultados preservados.</p>';
  const secundario=estadoMuseu.trofeu==='clinicas',g=c.congelado;
  const titulos=[...(c.encerradoEm?[{id:'tutoria',nome:'Tutoria',tipo:'Principal'}]:[]),...trofeusSecundariosDoCiclo(c).map(t=>({...t,tipo:'Secundário'}))];
  const seletor='<div class="museu-conquistas-ciclo" role="group" aria-label="Conquistas deste ciclo">'+titulos.map(t=>`<button type="button" data-tutoria="${escapar(c.id)}" data-trofeu="${t.id}" aria-pressed="${estadoMuseu.trofeu===t.id}"><strong>${t.nome}</strong><small>${t.tipo}</small></button>`).join('')+'</div>';
  const numeros=g?'<span class="museu-contexto">Resultados gerais do ciclo</span><div class="museu-metricas">'+[[humanoMin(g.minutos),'De estudo'],[g.blocos||0,'Blocos'],[g.diasAtivos||0,'Dias ativos'],[g.maiorSequencia||0,'Dias em sequência']].map(([v,r])=>'<div><strong>'+v+'</strong><small>'+r+'</small></div>').join('')+'</div>':'';
  return `<span class="museu-kicker">${secundario?'Clínicas · Troféu secundário':'Tutoria · Conquistada'}</span><h3>${escapar(c.nome)}</h3><p>${formatarDataLonga(c.inicio)}${c.encerradoEm?' → '+formatarDataLonga(c.encerradoEm):' · Ciclo em andamento'}</p>${seletor}<p class="museu-descricao-conquista">${secundario?'Clínicas celebra uma prova secundária deste mesmo ciclo. Uma taça menor, guardada ao lado da conquista principal.':'A Tutoria é a conquista principal deste ciclo encerrado.'}</p>${numeros}<p class="museu-frase">“O esforço passa. A conquista fica.”</p>`;
}
function renderMuseuEstante(){
  const lista=ciclosDoMuseu(),horas=lista.reduce((s,c)=>s+(c.congelado?.minutos||0),0);
  document.getElementById('estanteResumo').textContent=lista.length?resumoTitulosMuseu()+' · '+humanoMin(horas)+' de dedicação guardados.':'Cada ciclo encerrado conquista uma Tutoria. Sua primeira vitrine está esperando.';
  document.getElementById('seloNivelMuseu').textContent='Nível '+nivelMuseu()+' de 2';
  document.getElementById('resumoEntradaMuseu').innerHTML='<strong>'+nomeNivelMuseu()+'</strong> · '+(nivelMuseu()===2?'Mármore, luz cênica e vitrines de honra.':'Uma sala acolhedora para começar sua coleção.');
  document.getElementById('previaMuseu').innerHTML=desenharSalaMuseu('previa',false);
  if(document.getElementById('museuTutorias').open)renderSalaMuseu();
}
function renderSalaMuseu(){
  const lista=ciclosDoMuseu(),cap=capacidadeMuseu();estadoMuseu.pagina=Math.max(0,Math.min(estadoMuseu.pagina,Math.max(0,Math.ceil(lista.length/cap)-1)));
  if(!lista.some(c=>c.id===estadoMuseu.selecionado))estadoMuseu.selecionado=lista[estadoMuseu.pagina*cap]?.id||null;
  const c=lista.find(c=>c.id===estadoMuseu.selecionado);
  if(c&&!c.encerradoEm)estadoMuseu.trofeu='clinicas';
  else if(c&&estadoMuseu.trofeu==='clinicas'&&!trofeusSecundariosDoCiclo(c).length)estadoMuseu.trofeu='tutoria';
  document.getElementById('cenaMuseu').innerHTML=desenharSalaMuseu('sala',true);
  document.getElementById('subtituloMuseu').textContent=nomeNivelMuseu()+' · '+resumoTitulosMuseu();
  document.getElementById('museuAnterior').disabled=estadoMuseu.pagina===0;document.getElementById('museuProximo').disabled=(estadoMuseu.pagina+1)*cap>=lista.length;
  document.getElementById('paginaMuseu').textContent=lista.length?(estadoMuseu.pagina*cap+1)+'–'+Math.min(lista.length,(estadoMuseu.pagina+1)*cap)+' de '+lista.length+' ciclos':'A primeira Tutoria virá com seu próximo ciclo encerrado.';
  document.getElementById('detalheTutoria').innerHTML=detalheConquistaMuseu(c);
  const max=nivelMuseu()===2,saldo=saldoDinheiro();
  document.getElementById('nivelMuseuTexto').textContent='Nível '+nivelMuseu()+' de 2 · '+nomeNivelMuseu();
  document.getElementById('descricaoNivelMuseu').textContent=max?'Sua Galeria de Honra está completa: piso de mármore, detalhes dourados, luzes cênicas e vitrines iluminadas.':'Renove para a Galeria de Honra: mármore, detalhes dourados e iluminação dedicada para suas Tutorias. Pagamento único de R$ 500.';
  document.getElementById('saldoMuseu').textContent='Seu dinheiro: '+formatarDinheiro(saldo)+(!max&&saldo<PRECO_MUSEU?' · faltam '+formatarDinheiro(PRECO_MUSEU-saldo)+'.':'');
  document.getElementById('melhorarMuseu').hidden=max;document.getElementById('melhorarMuseu').disabled=max||saldo<PRECO_MUSEU;
}
function abrirMuseu(id){
  estadoMuseu.retorno=document.activeElement;const lista=ciclosDoMuseu(),index=lista.findIndex(c=>c.id===id);
  estadoMuseu.pagina=index>=0?Math.floor(index/capacidadeMuseu()):0;estadoMuseu.selecionado=index>=0?id:lista[0]?.id||null;estadoMuseu.trofeu=lista[index>=0?index:0]?.encerradoEm?'tutoria':'clinicas';
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
  prepararTrofeusSecundariosMuseu();
  document.getElementById('entrarMuseu').addEventListener('click',()=>abrirMuseu());
  document.getElementById('fecharMuseu').addEventListener('click',()=>document.getElementById('museuTutorias').close());
  document.getElementById('museuTutorias').addEventListener('close',()=>{if(estadoMuseu.retorno?.isConnected)estadoMuseu.retorno.focus({preventScroll:true});});
  document.getElementById('prateleira').addEventListener('click',e=>{const b=e.target.closest('[data-ver-tutoria]');if(b)abrirMuseu(b.dataset.verTutoria);});
  document.getElementById('melhorarMuseu').addEventListener('click',melhorarMuseu);
  for(const [id,d]of [['museuAnterior',-1],['museuProximo',1]])document.getElementById(id).addEventListener('click',()=>{estadoMuseu.pagina+=d;estadoMuseu.selecionado=ciclosDoMuseu()[estadoMuseu.pagina*capacidadeMuseu()]?.id||null;estadoMuseu.trofeu='tutoria';renderSalaMuseu();});
  const selecionar=e=>{const alvo=e.target.closest('[data-tutoria]');if(!alvo)return;const painel=!!alvo.closest('#detalheTutoria');estadoMuseu.selecionado=alvo.dataset.tutoria;estadoMuseu.trofeu=alvo.dataset.trofeu||'tutoria';renderSalaMuseu();document.querySelector((painel?'#detalheTutoria':'#cenaMuseu')+' [data-tutoria="'+CSS.escape(estadoMuseu.selecionado)+'"][data-trofeu="'+estadoMuseu.trofeu+'"]').focus({preventScroll:true});};
  document.getElementById('cenaMuseu').addEventListener('click',selecionar);
  document.getElementById('detalheTutoria').addEventListener('click',selecionar);
  document.getElementById('cenaMuseu').addEventListener('keydown',e=>{if((e.key==='Enter'||e.code==='Space')&&e.target.closest('[data-tutoria]')){e.preventDefault();e.stopPropagation();selecionar(e);}});
  document.querySelector('.ambiente-periodos').addEventListener('click',e=>{const b=e.target.closest('[data-periodo-estadio]');if(b)salvarAmbienteEstadio({periodo:b.dataset.periodoEstadio});});
  document.getElementById('climaEstadio').addEventListener('change',e=>salvarAmbienteEstadio({clima:e.target.value}));
  let ultimo=JSON.stringify(ambienteEstadioAtual());
  const atualizar=()=>{const atual=JSON.stringify(ambienteEstadioAtual());if(atual!==ultimo){ultimo=atual;renderEstadio();}};
  let capAnterior=capacidadeMuseu();
  window.addEventListener('resize',()=>{const cap=capacidadeMuseu();if(cap!==capAnterior){capAnterior=cap;const i=ciclosDoMuseu().findIndex(c=>c.id===estadoMuseu.selecionado);estadoMuseu.pagina=i>=0?Math.floor(i/cap):0;renderMuseuEstante();}});
  setInterval(atualizar,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)atualizar();});
}
