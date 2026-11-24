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
  const fontes=ciclos.filter(c=>c&&!cicloDeFerias(c)&&typeof c.id==='string').slice().sort((a,b)=>String(b.inicio).localeCompare(String(a.inicio))).slice(0,2);
  const registro={versao:1,conquistas:fontes.map(c=>({id:'clinicas',nome:'Clínicas',cicloId:c.id}))};
  const proximo={...config,trofeusSecundariosMuseu:registro};
  if(!Armazem.gravar(CHAVES.config,proximo))return false;
  config=proximo;return true;
}
function trofeusSecundariosDoCiclo(c){
  if(!c||cicloDeFerias(c))return [];
  const fontes=config.trofeusSecundariosMuseu?.conquistas;
  return Array.isArray(fontes)&&fontes.some(t=>t&&t.id==='clinicas'&&t.cicloId===c.id)?[{id:'clinicas',nome:'Clínicas'}]:[];
}
function ciclosDoMuseu(){
  return ciclos.filter(c=>c&&!cicloDeFerias(c)&&(c.encerradoEm||trofeusSecundariosDoCiclo(c).length)).slice().sort((a,b)=>String(b.inicio).localeCompare(String(a.inicio)));
}
function resumoTitulosMuseu(){
  const principais=ciclosEncerrados().length,secundarios=ciclosDoMuseu().reduce((s,c)=>s+trofeusSecundariosDoCiclo(c).length,0);
  return principais+' '+(principais===1?'Tutoria':'Tutorias')+(secundarios?' · '+secundarios+' '+(secundarios===1?'troféu Clínicas':'troféus Clínicas'):'');
}
function colunasMuseu(){return matchMedia('(max-width:700px)').matches?1:matchMedia('(max-width:1250px)').matches?2:3;}
function capacidadeMuseu(){return colunasMuseu()*2;}
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
function nomeNivelMuseu(){return nivelMuseu()===2?'Armário de Honra':'Armário de Madeira';}
function linhasPlacaMuseu(texto,limite=23){
  const palavras=String(texto).split(/\s+/),linhas=[''];
  for(const p of palavras){const i=linhas.length-1;if((linhas[i]+' '+p).trim().length>limite&&linhas[i])linhas.push(p);else linhas[i]=(linhas[i]+' '+p).trim();}
  return linhas.slice(0,2).map((l,i)=>l.length>limite?l.slice(0,limite-1)+'…':i===1&&linhas.length>2?l.slice(0,limite-1)+'…':l);
}
function defsTacaMuseu(prefix){
  return `<linearGradient id="${prefix}-ouro"><stop stop-color="#80511E"/><stop offset=".15" stop-color="#C79A45"/><stop offset=".31" stop-color="#FFF0BA"/><stop offset=".42" stop-color="#FFF8D3"/><stop offset=".54" stop-color="#D7AA50"/><stop offset=".72" stop-color="#F4D888"/><stop offset=".88" stop-color="#BA8431"/><stop offset="1" stop-color="#80551F"/></linearGradient>
    <linearGradient id="${prefix}-metal" x2=".2" y2="1"><stop stop-color="#FFF1BB"/><stop offset=".25" stop-color="#DAB362"/><stop offset=".53" stop-color="#9E6F2D"/><stop offset=".76" stop-color="#F4D992"/><stop offset="1" stop-color="#987132"/></linearGradient>
    <linearGradient id="${prefix}-interior" x2="0" y2="1"><stop stop-color="#4F3418"/><stop offset="1" stop-color="#C59A4D"/></linearGradient>
    <linearGradient id="${prefix}-prata"><stop stop-color="#637583"/><stop offset=".15" stop-color="#A7B9C7"/><stop offset=".32" stop-color="#F3F8FC"/><stop offset=".43" stop-color="#FFFFFF"/><stop offset=".57" stop-color="#A5B4C2"/><stop offset=".76" stop-color="#E5EDF3"/><stop offset=".9" stop-color="#91A3B1"/><stop offset="1" stop-color="#596F7E"/></linearGradient>
    <linearGradient id="${prefix}-prata-aro" x2=".18" y2="1"><stop stop-color="#FAFCFF"/><stop offset=".35" stop-color="#BAC9D4"/><stop offset=".61" stop-color="#758B9C"/><stop offset="1" stop-color="#DBE5EC"/></linearGradient>
    <linearGradient id="${prefix}-prata-dentro" x2="0" y2="1"><stop stop-color="#3D5261"/><stop offset="1" stop-color="#B3C6D2"/></linearGradient>
    <linearGradient id="${prefix}-pedra"><stop stop-color="#142721"/><stop offset=".3" stop-color="#34463C"/><stop offset=".65" stop-color="#172C25"/><stop offset="1" stop-color="#0C211C"/></linearGradient>
    <linearGradient id="${prefix}-ardosia"><stop stop-color="#172934"/><stop offset=".4" stop-color="#3D505B"/><stop offset=".7" stop-color="#263B47"/><stop offset="1" stop-color="#122630"/></linearGradient>`;
}
function tacaTutoriaSvg(prefix){
  let s=`<g class="taca-tutoria" data-material="ouro"><ellipse cy="88" rx="53" ry="3" fill="#10281D" opacity=".18"/>
    <path d="M-40-120C-87-153-113-116-91-77Q-78-48-39-50M40-120C87-153 113-116 91-77Q78-48 39-50" fill="none" stroke="#77501F" stroke-width="13"/>
    <path d="M-40-123C-87-150-109-116-88-78Q-75-53-40-54M40-123C87-150 109-116 88-78Q75-53 40-54" fill="none" stroke="url(#${prefix}-metal)" stroke-width="8.5"/>
    <path d="M-53-129C-85-141-100-122-94-102M53-129C85-141 100-122 94-102" fill="none" stroke="#FFF2BD" stroke-width="1.8" opacity=".8"/>
    <path d="M-43-139Q0-131 43-139L37-82Q33-43 12-28H-12Q-33-43-37-82Z" fill="url(#${prefix}-ouro)" stroke="#9B712F" stroke-width="1.2"/>
    <ellipse cy="-139" rx="43" ry="8" fill="url(#${prefix}-metal)" stroke="#F8DFA0"/><ellipse cy="-140" rx="35" ry="4.7" fill="url(#${prefix}-interior)"/>
    <path d="M-35-129Q0-119 35-129M-34-119Q0-110 34-119" fill="none" stroke="url(#${prefix}-metal)" stroke-width="2.5"/>
    <path d="M-29-112-24-80Q-20-50-10-40" fill="none" stroke="#FFF6CB" stroke-width="3.5" opacity=".58"/>`;
  for(const x of [-27,-19,19,27])s+=`<path d="M${x}-112Q${x*.92}-59 ${x*.36}-34" fill="none" stroke="${x<0?'#FFF3C2':'#9F732F'}" stroke-width="1" opacity=".3"/>`;
  s+=`<path d="M-11-28H11L8-19H-8Z" fill="url(#${prefix}-metal)"/><ellipse cy="-19" rx="12" ry="4" fill="url(#${prefix}-metal)"/>
    <path d="M-6-17H6L8 9Q8 24 17 30H-17Q-8 24-8 9Z" fill="url(#${prefix}-ouro)"/><path d="M-17 30H17L24 39H-24Z" fill="url(#${prefix}-metal)"/><ellipse cy="40" rx="26" ry="5" fill="url(#${prefix}-ouro)"/>
    <path d="M-28 45H28L37 53H-37Z" fill="url(#${prefix}-metal)"/><path d="M-39 56H39L45 63V84H-45V63Z" fill="url(#${prefix}-pedra)" stroke="#132A20"/>
    <path d="M-39 59 2 68 17 65 41 76M-29 81-5 70" fill="none" stroke="#C0CCB8" stroke-width=".7" opacity=".28"/><path d="M-42 62H42M-45 85H45" stroke="url(#${prefix}-metal)" stroke-width="3"/>
    <rect x="-23" y="69" width="46" height="9" rx="1" fill="#DBC48A"/><text x="0" y="75.5" font-size="4.7" letter-spacing="1.3" text-anchor="middle" fill="#354333">TUTORIAS</text>
    <path d="M-13-96H13V-77L0-65-13-77Z" fill="#F8EBC2" stroke="#A37E3C" stroke-width="1.2"/><path d="M-11-93H11V-86H-11Z" fill="#293B32"/><text x="0" y="-88" font-size="4" text-anchor="middle" fill="#F9F5DF" letter-spacing=".5">SPFC</text><path d="M-11-83H-1V-69L-11-79Z" fill="#A52F3E"/><path d="M1-83H11V-79L1-69Z" fill="#263A31"/>
    <path d="M-18-65Q-31-80-24-97M18-65Q31-80 24-97" fill="none" stroke="#F9E4A8" stroke-width="1.2"/>`;
  for(const l of [-1,1])for(let i=0;i<5;i++)s+=`<ellipse cx="${l*(23.5+i*.35)}" cy="${-70-i*5}" rx="1.8" ry="3.8" transform="rotate(${l*38} ${l*(23.5+i*.35)} ${-70-i*5})" fill="#FBE7AF"/>`;
  s+='<path d="m0-109 1.8 3.7 4 .6-2.9 2.9.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.9 4-.6Z" fill="#F8E1A0"/>';
  return s+'</g>';
}
function tacaClinicasSvg(prefix){
  let s=`<g class="taca-clinicas" data-material="prata"><ellipse cy="86" rx="46" ry="3" fill="#132935" opacity=".18"/>
    <path d="M-44-93Q0-106 44-93L36-51Q29-14 0-5Q-29-14-36-51Z" fill="url(#${prefix}-prata)" stroke="#7B90A0" stroke-width="1.1"/>
    <ellipse cy="-93" rx="44" ry="8" fill="url(#${prefix}-prata-aro)" stroke="#F6FBFF" stroke-width="1"/><ellipse cy="-94" rx="36" ry="4.8" fill="url(#${prefix}-prata-dentro)"/>
    <path d="M-30-82-24-55Q-19-29-9-18" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".6"/>`;
  for(const x of [-23,-13,13,23])s+=`<path d="M${x}-82Q${x*.85}-29 ${x*.18}-12" fill="none" stroke="${x<0?'#F7FCFF':'#6B8497'}" opacity=".4" stroke-width="1.1"/>`;
  s+=`<path d="M-27-36Q0-23 27-36" fill="none" stroke="#334A59" stroke-width="2.5"/><path d="M-26-32Q0-19 26-32" fill="none" stroke="#F7FAFC" stroke-width="2"/><path d="M-24-28Q0-17 24-28" fill="none" stroke="#A93D49" stroke-width="1.8"/>
    <circle cy="-63" r="13" fill="url(#${prefix}-prata-aro)" stroke="#F6FAFD"/><path d="m0-72 2.5 5.1 5.7.8-4.1 4 1 5.6L0-59.1l-5.1 2.6 1-5.6-4.1-4 5.7-.8Z" fill="#5B7487"/><circle cy="-63" r="15.5" fill="none" stroke="#8199AA" stroke-width=".6" stroke-dasharray="1 2"/>
    <path d="M-5-5H5L7 19Q9 31 22 39H-22Q-9 31-7 19Z" fill="url(#${prefix}-prata)"/><ellipse cy="40" rx="24" ry="4.5" fill="url(#${prefix}-prata-aro)"/><path d="M-26 45H26L34 53H-34Z" fill="url(#${prefix}-prata)"/>
    <path d="M-36 58H36L42 64V82H-42V64Z" fill="url(#${prefix}-ardosia)" stroke="#1A3443"/><path d="M-39 62H39M-42 83H42" stroke="url(#${prefix}-prata-aro)" stroke-width="2.5"/>
    <rect x="-23" y="68" width="46" height="9" rx="1" fill="#D5E0E8"/><text x="0" y="74.5" font-size="5" letter-spacing="1" text-anchor="middle" fill="#344E60">CLÍNICAS</text></g>`;
  return s;
}
function desenharSalaMuseu(prefix='sala',interativo=true,cicloExibido){
  const individual=cicloExibido!==undefined;
  const luxo=nivelMuseu()===2,lista=ciclosDoMuseu(),cap=individual||matchMedia('(max-width:550px)').matches?1:2;
  const pagina=interativo?estadoMuseu.pagina:0,visiveis=individual?(cicloExibido?[cicloExibido]:[]):lista.slice(pagina*cap,pagina*cap+cap),mobile=cap===1;
  const C=luxo?{parede:'#283A33',piso:'#AEB7A5',madeira:'#2A3027',clara:'#55604C',escura:'#17221C',fundo:'#233F34',borda:'#C6B180',texto:'#F1E5C3'}:
    {parede:'#DEE0D1',piso:'#CEBA96',madeira:'#8B6949',clara:'#B29166',escura:'#574A35',fundo:'#556851',borda:'#C3AA77',texto:'#F6E9CC'};
  const bx=mobile?308:80,bw=mobile?584:1040,slots=visiveis.length||1,espaco=24,margem=38,largura=(bw-margem*2-espaco*(slots-1))/slots;
  let s=`<svg viewBox="${mobile?'285 0 630 720':'0 0 1200 720'}" preserveAspectRatio="xMidYMid meet" role="${interativo?'group':'img'}" aria-label="${individual&&cicloExibido?'Conquistas de '+escapar(cicloExibido.nome):'Armário de conquistas dividido por ciclos: '+resumoTitulosMuseu()}"><defs>${defsTacaMuseu(prefix)}
    <linearGradient id="${prefix}-ambiente" x2="0" y2="1"><stop stop-color="${C.parede}"/><stop offset="1" stop-color="${luxo?'#122A22':'#B8C2AC'}"/></linearGradient>
    <linearGradient id="${prefix}-madeira"><stop stop-color="${C.escura}"/><stop offset=".18" stop-color="${C.madeira}"/><stop offset=".48" stop-color="${C.clara}"/><stop offset=".66" stop-color="${C.madeira}"/><stop offset="1" stop-color="${C.escura}"/></linearGradient>
    <linearGradient id="${prefix}-frente" x2="0" y2="1"><stop stop-color="${C.clara}"/><stop offset=".14" stop-color="${C.madeira}"/><stop offset="1" stop-color="${C.escura}"/></linearGradient>
    <linearGradient id="${prefix}-fundo" x2="0" y2="1"><stop stop-color="${luxo?'#183026':'#44583F'}"/><stop offset=".68" stop-color="${C.fundo}"/><stop offset="1" stop-color="${luxo?'#3B5040':'#6C7B59'}"/></linearGradient>
    <radialGradient id="${prefix}-luz"><stop stop-color="#FFE6A3" stop-opacity="${luxo?'.27':'.17'}"/><stop offset="1" stop-color="#FFE8AF" stop-opacity="0"/></radialGradient>
    <linearGradient id="${prefix}-vidro" x2="1" y2=".4"><stop stop-color="#EEFFF3" stop-opacity=".05"/><stop offset=".4" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#D9F4E2" stop-opacity=".06"/></linearGradient>
    <pattern id="${prefix}-grao" width="24" height="110" patternUnits="userSpaceOnUse"><path d="M4 0q9 50 0 110M15 0q-6 70 0 110" fill="none" stroke="#F8E0A8" stroke-width=".7" opacity="${luxo?'.05':'.13'}"/></pattern>
    </defs><rect width="1200" height="720" fill="url(#${prefix}-ambiente)"/><path d="M0 610H1200V720H0Z" fill="${C.piso}"/>
    <path d="M0 612H1200" stroke="${C.escura}" stroke-width="5" opacity=".35"/><path d="M130 720 270 610M460 720 510 610M800 720 750 610M1130 720 990 610" stroke="${C.escura}" opacity=".12"/>
    <ellipse cx="600" cy="689" rx="${bw*.49}" ry="20" fill="#0A2118" opacity=".28"/>
    <text x="600" y="43" text-anchor="middle" font-size="10" letter-spacing="5" fill="${luxo?'#B7C4A6':'#63735C'}">COPEIRO · MEMÓRIA DO CLUBE</text>
    <path d="M${bx+20} 650h32v38h-32ZM${bx+bw-52} 650h32v38h-32Z" fill="${C.escura}"/><path d="M${bx+19} 681h34M${bx+bw-53} 681h34" stroke="${C.borda}" stroke-width="2"/>
    <path d="M${bx+bw} 91l17-13v570l-17 17Z" fill="${C.escura}"/><rect x="${bx}" y="88" width="${bw}" height="576" rx="5" fill="url(#${prefix}-madeira)" stroke="${C.escura}" stroke-width="3"/>
    <rect x="${bx}" y="88" width="${bw}" height="576" rx="5" fill="url(#${prefix}-grao)" pointer-events="none"/>
    <path d="M${bx-14} 80l13-12h${bw+28}l-13 12Z" fill="${C.clara}"/><path d="M${bx-14} 80h${bw+28}v16H${bx-14}Z" fill="url(#${prefix}-frente)"/><path d="M${bx-10} 94H${bx+bw+10}" stroke="${C.borda}" stroke-width="2"/>
    <rect x="${bx+22}" y="108" width="${bw-44}" height="52" rx="2" fill="${C.escura}"/><path d="M${bx+25} 111H${bx+bw-25}M${bx+25} 157H${bx+bw-25}" stroke="${C.borda}" stroke-width=".8" opacity=".65"/>
    <text x="600" y="142" text-anchor="middle" font-family="Georgia,serif" font-size="${mobile?24:28}" letter-spacing="7" fill="${C.texto}">CONQUISTAS</text>`;
  (visiveis.length?visiveis:[null]).forEach((c,i)=>{
    const x=bx+margem+i*(largura+espaco),cx=x+largura/2,clinicas=c&&trofeusSecundariosDoCiclo(c).length,numero=c?ciclos.filter(t=>!cicloDeFerias(t)).slice().sort((a,b)=>String(a.inicio).localeCompare(String(b.inicio))).findIndex(t=>t.id===c.id)+1:1;
    s+=`<g data-ciclo-armario="${c?escapar(c.id):'vazio'}"><rect x="${x}" y="176" width="${largura}" height="62" rx="2" fill="${C.escura}" stroke="${C.borda}" stroke-opacity=".4"/>
      <text x="${cx}" y="191" text-anchor="middle" font-size="${mobile?12:9}" letter-spacing="2.5" fill="${C.borda}">${c?'CICLO '+String(numero).padStart(2,'0'):'SUA PRIMEIRA CONQUISTA'}</text>`;
    linhasPlacaMuseu(c?c.nome:'Cada ciclo terá seu espaço.',mobile?37:32).forEach((l,j)=>{s+=`<text x="${cx}" y="${mobile?209+j*21:211+j*16}" text-anchor="middle" font-family="Georgia,serif" font-size="${mobile?20:15}" fill="${C.texto}">${escapar(l)}</text>`;});
    s+=`<rect x="${x}" y="249" width="${largura}" height="343" rx="2" fill="url(#${prefix}-fundo)" stroke="${C.escura}" stroke-width="5"/>
      <ellipse cx="${cx}" cy="377" rx="${largura*.48}" ry="152" fill="url(#${prefix}-luz)"/>
      <path d="M${x+13} 256H${x+largura-13}" stroke="${luxo?'#FFE4A1':'#E7D6A9'}" stroke-width="${luxo?3:2}" opacity=".8"/>
      <path d="M${x+12} 258H${x+largura-12}" stroke="#FFDEA1" stroke-width="17" opacity="${luxo?'.06':'.025'}"/>
      <path d="M${x+2} 546H${x+largura-2}v9H${x+2}Z" fill="url(#${prefix}-madeira)"/><path d="M${x+2} 546H${x+largura-2}" stroke="${C.borda}" stroke-width="1.5"/>`;
    const trofeus=c?[...(c.encerradoEm?[{id:'tutoria',nome:'Tutorias',tx:clinicas?x+largura*.31:cx}]:[]),...(clinicas?[{id:'clinicas',nome:'Clínicas',tx:c.encerradoEm?x+largura*.76:cx}]:[])]:[];
    trofeus.forEach(t=>{
      const principal=t.id==='tutoria',ativo=estadoMuseu.selecionado===c.id&&estadoMuseu.trofeu===t.id,escala=principal?1.04:1,y=principal?449:455;
      const attrs=interativo?` data-tutoria="${escapar(c.id)}" data-trofeu="${t.id}" role="button" tabindex="0" aria-label="Ver ${t.nome}: ${escapar(c.nome)}" aria-pressed="${ativo}"`:'';
      s+=`<g${attrs}><title>${t.nome} · ${escapar(c.nome)}</title><rect class="armario-selecao" x="${t.tx-(principal?108:78)}" y="274" width="${principal?216:156}" height="312" rx="5" fill="#FBE6B3" fill-opacity="${ativo?'.045':'0'}" stroke="${ativo?'#EAD08F':'transparent'}" stroke-opacity=".25" pointer-events="all"/>
        <path d="M${t.tx-54} 539H${t.tx+54}v7H${t.tx-54}Z" fill="${principal?C.escura:'#334B58'}"/><path d="M${t.tx-54} 539H${t.tx+54}" stroke="${principal?C.borda:'#B8CEDB'}" stroke-width="1.2"/>
        <g id="${prefix}-taca-${principal?i:'clinicas-'+i}" ${principal?'data-taca-principal="tutoria"':'data-taca-secundaria="clinicas"'} transform="translate(${t.tx} ${y}) scale(${escala})">${principal?tacaTutoriaSvg(prefix):tacaClinicasSvg(prefix)}</g>
        <rect x="${t.tx-65}" y="565" width="130" height="20" rx="2" fill="${principal?'#C8B47D':'#CFDCE3'}" stroke="${principal?'#DDC98E':'#ECF4F7'}" stroke-width=".6"/><text x="${t.tx}" y="579" text-anchor="middle" font-size="${mobile?13:11}" font-weight="700" letter-spacing="1.5" fill="${principal?'#34412E':'#364E5B'}">${t.nome}</text></g>`;
    });
    if(!trofeus.length)s+=`<text x="${cx}" y="412" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#DFE4C8">Seu espaço está reservado.</text><text x="${cx}" y="440" text-anchor="middle" font-size="11" fill="#BFCBB0">Encerre um ciclo para conquistar Tutorias.</text>`;
    // Uma única porta de vidro protege a prateleira inteira de cada ciclo.
    s+=`<rect class="armario-porta" x="${x+4}" y="250" width="${largura-8}" height="341" rx="2" fill="url(#${prefix}-vidro)" stroke="${C.borda}" stroke-width="1.2" stroke-opacity=".55" pointer-events="none"/>
      <path d="M${x+11} 268v258M${x+18} 268v48" stroke="#EEFFF4" stroke-width="1.4" opacity=".18" pointer-events="none"/>
      <rect x="${x+largura+5}" y="406" width="4" height="29" rx="2" fill="${C.borda}"/>
      <rect x="${x}" y="607" width="${largura}" height="36" rx="2" fill="url(#${prefix}-frente)" stroke="${C.escura}" stroke-width="1.5"/><rect x="${cx-18}" y="622" width="36" height="4" rx="2" fill="${C.borda}"/>
      </g>`;
  });
  s+=`<path d="M${bx-5} 650H${bx+bw+5}v16H${bx-5}Z" fill="url(#${prefix}-frente)"/><path d="M${bx} 652H${bx+bw}" stroke="${C.borda}" stroke-width="1.5"/>
    <text x="600" y="710" text-anchor="middle" font-size="9" letter-spacing="3.8" fill="${luxo?'#344D3D':'#766649'}">${luxo?'ARMÁRIO DE HONRA':'ARMÁRIO DE MADEIRA'}</text></svg>`;
  return s;
}
function detalheConquistaMuseu(c){
  if(!c)return '<span class="museu-kicker">Sua história começa aqui</span><h3>Um compartimento esperando por você.</h3><p>Encerre um ciclo para conquistar sua primeira Tutoria. Cada ciclo terá a sua própria taça, com o nome e os resultados preservados.</p>';
  const secundario=estadoMuseu.trofeu==='clinicas',g=c.congelado;
  const titulos=[...(c.encerradoEm?[{id:'tutoria',nome:'Tutorias'}]:[]),...trofeusSecundariosDoCiclo(c)];
  const seletor='<div class="museu-conquistas-ciclo" role="group" aria-label="Conquistas deste ciclo">'+titulos.map(t=>`<button type="button" data-tutoria="${escapar(c.id)}" data-trofeu="${t.id}" aria-pressed="${estadoMuseu.trofeu===t.id}"><strong>${t.nome}</strong></button>`).join('')+'</div>';
  const numeros=g?'<span class="museu-contexto">Resultados gerais do ciclo</span><div class="museu-metricas">'+[[humanoMin(g.minutos),'De estudo'],[g.blocos||0,'Blocos'],[g.diasAtivos||0,'Dias ativos'],[g.maiorSequencia||0,'Dias em sequência']].map(([v,r])=>'<div><strong>'+v+'</strong><small>'+r+'</small></div>').join('')+'</div>':'';
  return `<span class="museu-kicker">${secundario?'Clínicas':'Tutorias'}</span><h3>${escapar(c.nome)}</h3><p>${formatarDataLonga(c.inicio)}${c.encerradoEm?' → '+formatarDataLonga(c.encerradoEm):' · Ciclo em andamento'}</p>${seletor}<p class="museu-descricao-conquista">${secundario?'A taça Clínicas registra mais uma conquista deste ciclo.':'A taça Tutorias celebra a conclusão deste ciclo.'}</p>${numeros}<p class="museu-frase">“O esforço passa. A conquista fica.”</p>`;
}
function renderMuseuEstante(){
  const lista=ciclosDoMuseu(),horas=lista.reduce((s,c)=>s+(c.congelado?.minutos||0),0);
  document.getElementById('estanteResumo').textContent=lista.length?resumoTitulosMuseu()+' · '+humanoMin(horas)+' de dedicação guardados.':'Cada ciclo encerrado conquista uma Tutoria. Seu primeiro compartimento está esperando.';
  document.getElementById('seloNivelMuseu').textContent='Nível '+nivelMuseu()+' de 2';
  document.getElementById('resumoEntradaMuseu').innerHTML='<strong>'+nomeNivelMuseu()+'</strong> · '+(nivelMuseu()===2?'Madeira escura, detalhes em metal e prateleiras iluminadas.':'Um espaço de madeira para as conquistas de cada ciclo.');
  document.getElementById('previaMuseu').innerHTML=desenharSalaMuseu('previa',false);
  if(document.getElementById('museuTutorias').open)renderSalaMuseu();
}
function renderSalaMuseu(){
  const lista=ciclosDoMuseu(),cap=capacidadeMuseu();estadoMuseu.pagina=Math.max(0,Math.min(estadoMuseu.pagina,Math.max(0,Math.ceil(lista.length/cap)-1)));
  if(!lista.some(c=>c.id===estadoMuseu.selecionado))estadoMuseu.selecionado=lista[estadoMuseu.pagina*cap]?.id||null;
  const indice=lista.findIndex(c=>c.id===estadoMuseu.selecionado);
  if(indice>=0&&(indice<estadoMuseu.pagina*cap||indice>=(estadoMuseu.pagina+1)*cap))estadoMuseu.pagina=Math.floor(indice/cap);
  const c=lista.find(c=>c.id===estadoMuseu.selecionado);
  if(c&&!c.encerradoEm)estadoMuseu.trofeu='clinicas';
  else if(c&&estadoMuseu.trofeu==='clinicas'&&!trofeusSecundariosDoCiclo(c).length)estadoMuseu.trofeu='tutoria';
  const visiveis=lista.slice(estadoMuseu.pagina*cap,(estadoMuseu.pagina+1)*cap);
  const colunas=Math.min(colunasMuseu(),visiveis.length||1);
  document.getElementById('cenaMuseu').innerHTML='<div class="museu-galeria" data-nivel="'+nivelMuseu()+'" role="group" aria-label="Armários de conquistas por ciclo" style="--colunas:'+colunas+';max-width:'+(colunas*520+(colunas-1)*16)+'px">'+
    (visiveis.length?visiveis:[null]).map((c,i)=>'<div class="museu-modulo">'+desenharSalaMuseu('sala-'+i,true,c)+'</div>').join('')+'</div>';
  const seletor=document.getElementById('irCicloMuseu');
  seletor.innerHTML=lista.length?lista.map(c=>'<option value="'+escapar(c.id)+'">'+escapar(c.nome)+'</option>').join(''):'<option value="">Seu primeiro ciclo</option>';
  seletor.disabled=!lista.length;seletor.value=c?.id||'';
  document.getElementById('subtituloMuseu').textContent=nomeNivelMuseu()+' · '+resumoTitulosMuseu();
  document.getElementById('museuAnterior').disabled=estadoMuseu.pagina===0;document.getElementById('museuProximo').disabled=(estadoMuseu.pagina+1)*cap>=lista.length;
  document.getElementById('paginaMuseu').textContent=lista.length?(estadoMuseu.pagina*cap+1)+'–'+Math.min(lista.length,(estadoMuseu.pagina+1)*cap)+' de '+lista.length+' ciclos':'A primeira Tutoria virá com seu próximo ciclo encerrado.';
  document.getElementById('detalheTutoria').innerHTML=detalheConquistaMuseu(c);
  const max=nivelMuseu()===2,saldo=saldoDinheiro();
  document.getElementById('nivelMuseuTexto').textContent='Nível '+nivelMuseu()+' de 2 · '+nomeNivelMuseu();
  document.getElementById('descricaoNivelMuseu').textContent=max?'Seu Armário de Honra está completo: madeira escura, ferragens em metal e iluminação para cada compartimento.':'Melhore para o Armário de Honra: madeira escura, detalhes em metal e iluminação nas prateleiras. Pagamento único de R$ 500.';
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
  loja=proximo;document.getElementById('avisoMuseu').textContent='';renderEstante();renderLoja();mostrarAviso('Armário de Honra pronto. Cada ciclo ganhou seu espaço!','recorde');return true;
}
function iniciarExperiencias(){
  prepararTrofeusSecundariosMuseu();
  document.getElementById('entrarMuseu').addEventListener('click',()=>abrirMuseu());
  document.getElementById('fecharMuseu').addEventListener('click',()=>document.getElementById('museuTutorias').close());
  document.getElementById('museuTutorias').addEventListener('close',()=>{if(estadoMuseu.retorno?.isConnected)estadoMuseu.retorno.focus({preventScroll:true});});
  document.getElementById('prateleira').addEventListener('click',e=>{const b=e.target.closest('[data-ver-tutoria]');if(b)abrirMuseu(b.dataset.verTutoria);});
  document.getElementById('melhorarMuseu').addEventListener('click',melhorarMuseu);
  document.getElementById('irCicloMuseu').addEventListener('change',e=>{
    const lista=ciclosDoMuseu(),index=lista.findIndex(c=>c.id===e.target.value);
    if(index<0)return;
    estadoMuseu.pagina=Math.floor(index/capacidadeMuseu());estadoMuseu.selecionado=lista[index].id;
    estadoMuseu.trofeu=lista[index].encerradoEm?'tutoria':'clinicas';renderSalaMuseu();
    const alvo=document.querySelector('#cenaMuseu [data-tutoria="'+CSS.escape(estadoMuseu.selecionado)+'"][data-trofeu="'+estadoMuseu.trofeu+'"]');
    if(alvo){alvo.focus({preventScroll:true});alvo.closest('.museu-modulo').scrollIntoView({block:'nearest',behavior:'auto'});}
  });
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
