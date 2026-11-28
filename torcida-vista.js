/* Uma câmera dentro do Morumbi, com projeção do campo por setor e arquibancadas em camadas. */
function projetarCampoTorcida(u,v,setor){
  const lateral=setor==='norte'||setor==='sul';
  if(lateral){
    if(setor==='sul')u=1-u;
    return [600+(u-.5)*(840+440*v),344+288*v];
  }
  if(setor==='oeste')v=1-v;
  return [600+(v-.5)*(500+920*(1-u)),344+294*(1-u)];
}
function caminhoCampoTorcida(pontos,setor,fechar=false){
  return pontos.map(([u,v],i)=>{const [x,y]=projetarCampoTorcida(u,v,setor);return (i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2);}).join('')+(fechar?'Z':'');
}
function golVistaTorcida(u,setor,prefix){
  const v1=.446,v2=.554,prof=u===0?-.025:.025;
  const [x1,y1]=projetarCampoTorcida(u,v1,setor),[x2,y2]=projetarCampoTorcida(u,v2,setor);
  const [b1,c1]=projetarCampoTorcida(u+prof,v1,setor),[b2,c2]=projetarCampoTorcida(u+prof,v2,setor);
  const lateral=setor==='norte'||setor==='sul',h=lateral?34:u===0?43:18;
  let rede='';
  for(let i=0;i<=10;i++){
    const t=i/10,xa=x1+(x2-x1)*t,ya=y1+(y2-y1)*t,xb=b1+(b2-b1)*t,yb=c1+(c2-c1)*t;
    rede+=`<path d="M${xa} ${ya-h}V${ya}M${xb} ${yb-h*.88}V${yb}M${xa} ${ya-h} ${xb} ${yb-h*.88}"/>`;
  }
  for(let i=1;i<6;i++){
    const z=h*i/6;rede+=`<path d="M${b1} ${c1-z*.88} ${b2} ${c2-z*.88}M${x1} ${y1-z} ${b1} ${c1-z*.88}M${x2} ${y2-z} ${b2} ${c2-z*.88}"/>`;
  }
  return `<g data-vista-gol="${u}" id="${prefix}-gol-${u}"><path d="M${x1} ${y1} ${b1} ${c1} ${b2} ${c2} ${x2} ${y2}Z" fill="#213c2728"/><path d="M${b1} ${c1}V${c1-h*.88}L${b2} ${c2-h*.88}V${c2}" stroke="#c1cec0" stroke-width="1.2" fill="none"/><g stroke="#e9edda" stroke-width=".7" fill="none" opacity=".6">${rede}</g><path d="M${x1} ${y1}V${y1-h}L${x2} ${y2-h}V${y2}" fill="none" stroke="#f5f3df" stroke-width="${lateral?3.2:u===0?4:2}" stroke-linejoin="round"/><path d="M${x1} ${y1-h} ${b1} ${c1-h*.88}M${x2} ${y2-h} ${b2} ${c2-h*.88}" stroke="#e5e7d3" stroke-width="1.5"/></g>`;
}
function pessoaDaVistaTorcida(x,y,escala,indice,prefix){
  const pele=['#c49a78','#92664f','#d1ae87','#704e3f','#b08262'][indice%5];
  const camisa=['#e8e4d6','#b34448','#293b36','#ddd9c9','#efe9d7'][indice%5];
  const cabelo=['#382d27','#272a26','#65503c','#292c28','#463a2e'][indice%5];
  const altura=indice%3===0?4:indice%3===1?-3:0,comprido=indice%4===0;
  return `<g transform="translate(${x} ${y}) scale(${escala})" style="--atraso:${indice*.07}s"><g class="torcedor-visita"><ellipse cx="0" cy="37" rx="25" ry="6" fill="#12251d30"/><path d="M-18 5Q0-4 18 5l9 31H-26Z" fill="${camisa}" stroke="#1c302c30" stroke-width="1"/><path d="M-18 8-28 25l4 5 14-13m28-9 9 21-5 4-14-15" fill="${camisa}"/><path d="M-22 25-24 30m47-2 2 4" stroke="${pele}" stroke-width="5" stroke-linecap="round"/><path d="M-4 0v7h8V0" fill="${pele}"/><ellipse cx="0" cy="${-12-altura}" rx="11" ry="13" fill="${pele}"/><path d="M-11 ${-10-altura}q-4-20 11-20 15 2 11 20l-6-9-13 3Z" fill="${cabelo}"/>${comprido?`<path d="M-12 ${-15-altura}l-2 19 7 4 2-22m15 0 3 18-6 5-2-24" fill="${cabelo}"/>`:''}<path d="M-15 15h30v4h-30Z" fill="${indice%5===1?'#eee6d3':'#b74447'}"/><path d="M-15 21h30v3h-30Z" fill="#283832"/><path d="M-11 30h22" stroke="#fff" stroke-opacity=".13" stroke-width="2"/><rect class="cartolina-visita" x="-26" y="-58" width="52" height="33" rx="2" fill="${indice%3===0?'#af3c43':indice%3===1?'#eee6d5':'#263530'}" stroke="#1d2f2830"/></g></g>`;
}
function desenharVistaDaTorcida(){
  const setor=estadoArquibancada.setor,prefix='visita-'+setor,amb=ambienteEstadioAtual();
  const noite=amb.periodo==='noite',tarde=amb.periodo==='entardecer',lateral=['norte','sul'].includes(setor);
  const oposto={norte:'SUL',sul:'NORTE',leste:'OESTE',oeste:'LESTE'}[setor];
  const aneis=temTerceiroAnel()?3:temAnel()?2:1;
  let s=`<svg viewBox="0 0 1200 720" role="img" aria-label="Vista ${lateral?'lateral do campo':'atrás do gol'} no setor ${SETORES_ARQUIBANCADA[setor].nome} do Morumbi" data-vista-setor="${setor}" data-vista-perspectiva="${lateral?'lateral':'gol'}"><defs><linearGradient id="${prefix}-concreto" x2="0" y2="1"><stop stop-color="${noite?'#828e8a':'#d1d4ca'}"/><stop offset="1" stop-color="${noite?'#3c514c':'#899e96'}"/></linearGradient><linearGradient id="${prefix}-grama" x2=".2" y2="1"><stop stop-color="${temGrama()?(noite?'#3a7055':'#699363'):'#9d7d52'}"/><stop offset="1" stop-color="${temGrama()?(noite?'#1f503e':'#3d704a'):'#816842'}"/></linearGradient><linearGradient id="${prefix}-sombra" x2="0" y2="1"><stop stop-color="#132b2390"/><stop offset="1" stop-color="#132b2300"/></linearGradient><linearGradient id="${prefix}-cobertura" x2="0" y2="1"><stop stop-color="${noite?'#82908b':'#f1efe1'}"/><stop offset="1" stop-color="${noite?'#3d504b':'#aab5a8'}"/></linearGradient><radialGradient id="${prefix}-luz"><stop stop-color="#fff4bc" stop-opacity=".42"/><stop offset="1" stop-color="#fff4bc" stop-opacity="0"/></radialGradient></defs>`;
  s+=desenharCeuAmbiente(0,0,1200,720,prefix+'-ceu',setor==='sul'||setor==='oeste');
  s+=`<path d="M-80 235Q600 ${aneis===3?-10:aneis===2?90:160} 1280 235V371H-80Z" fill="url(#${prefix}-concreto)"/>`;
  const topos=aneis===3?[126,197,268]:aneis===2?[195,268]:[268];
  topos.forEach((topo,anel)=>{
    for(let fila=0;fila<6;fila++){
      const y=topo+fila*9,c=temMosaico()?['#ac4448','#e4e2d6','#35443e'][anel%3]:fila%2?'#a7b6a8':'#bcc7b7';
      s+=`<path d="M-80 ${y+38}Q600 ${y-78} 1280 ${y+38}" fill="none" stroke="${c}" stroke-width="7"/>`;
      for(let col=0;col<65;col++){
        const x=-48+col*20,curva=58*Math.pow((x-600)/680,2)-58,yy=y+curva+9;
        if([12,30,48].some(a=>Math.abs(col-a)<=1))continue;
        if(temPublico()&&(nivelDaObra('publico')>=2||(col+fila)%3===0)){
          const cor=['#dddccb','#a33a41','#293b34'][Math.floor(col/9)%3];
          s+=`<path d="M${x-2.4} ${yy+4}q2.4-5 4.8 0" stroke="${cor}" stroke-width="3.4" fill="none"/><circle cx="${x}" cy="${yy}" r="1.7" fill="${col%2?'#bb9674':'#80614b'}"/>`;
        }else s+=`<path d="M${x-3} ${yy+3}h6" stroke="#35483f" stroke-opacity=".3" stroke-width="2"/>`;
      }
    }
    const y=topo+58;
    s+=`<path d="M-70 ${y+20}Q600 ${y-95} 1270 ${y+20}" fill="none" stroke="#52675f" stroke-width="13"/><path d="M-70 ${y+14}Q600 ${y-101} 1270 ${y+14}" fill="none" stroke="#d9ddd0" stroke-width="3"/><path d="M-70 ${y+20}Q600 ${y-95} 1270 ${y+20}" fill="none" stroke="#b74b4d" stroke-width="3"/>`;
  });
  [192,552,912].forEach((x,i)=>{
    s+=`<path d="M${x} 320 ${x+(x-600)*.14} ${aneis===3?105:aneis===2?173:247}" stroke="#d5d9ce" stroke-width="10"/><rect x="${x-15}" y="284" width="30" height="24" rx="3" fill="#253b33"/><path d="M${x-13} 305h26m-27 4h28m-29 4h30" stroke="#9aac9d" stroke-width="1.6"/>`;
  });
  if(temCamarotes()){
    const alas=lateral?(setoresComCamarotes().includes(oposto.toLowerCase())?[{x:300,y:190,w:600}]:[]):setoresComCamarotes().map(id=>({x:id==='sul'?25:925,y:231,w:250}));
    if(alas.length){
      s+='<g data-vista-camarotes>';
      alas.forEach(ala=>{
        s+=`<path d="M${ala.x-8} ${ala.y-4}h${ala.w+16}v39h-${ala.w+16}Z" fill="#728176" stroke="#c4cec0" stroke-width="2"/>`;
        for(let i=0;i<3;i++){
          const x=ala.x+i*ala.w/3,w=ala.w/3-6,y=ala.y+Math.pow((i-1)/2,2)*5;
          s+=`<g data-vista-camarote-sala><rect x="${x}" y="${y}" width="${w}" height="24" fill="${noite?'#d6b780':'#748e87'}" stroke="#d4d9c9" stroke-width="2"/><path d="M${x+w/2} ${y}v24" stroke="#9caba0"/>`;
          if(nivelDaObra('camarotes')>=2)s+=`<path d="M${x+6} ${y+18}h${w-12}" stroke="#9c4f50" stroke-width="3"/><path d="M${x+8} ${y+4}h${w-16}" stroke="#fff0c1" stroke-opacity=".5" stroke-width="1.3"/>`;
          s+='</g>';
        }
      });
      s+='</g>';
    }
  }
  if(temCobertura()){
    const topo=aneis===3?87:aneis===2?154:222;
    s+=`<g data-vista-cobertura data-nivel="${nivelDaObra('cobertura')}"><path d="M-70 ${topo+23}Q600 ${topo-133} 1270 ${topo+23}l-16 31Q600 ${topo-83}-54 ${topo+54}Z" fill="url(#${prefix}-cobertura)" stroke="#8fa096" stroke-width="2"/><path d="M-65 ${topo+52}Q600 ${topo-84} 1265 ${topo+52}" fill="none" stroke="#ae3f44" stroke-width="5"/>`;
    for(let i=0;i<15;i++){const x=i*90-30,t=(x+70)/1340,y=topo+23-312*t*(1-t);s+=`<path d="M${x} ${y+4}l16 27 19-23" fill="none" stroke="#677d70" stroke-width="1.8"/>`;}
    if(temCoberturaAmpliada())s+=`<path d="M-62 ${topo+47}Q600 ${topo-89} 1262 ${topo+47}" fill="none" stroke="#d4e8de" stroke-opacity=".55" stroke-width="9"/>`;
    s+='</g>';
  }
  if(temRefletores()){
    [135,1065].forEach(x=>{
      s+=`<g data-vista-refletor><path d="M${x} 240V84" stroke="#657e76" stroke-width="5"/><path d="M${x-12} 160h24m-24-34h24m-24 69h24" stroke="#849b8c" stroke-width="2"/><rect x="${x-29}" y="69" width="58" height="24" rx="3" fill="#3d5750" stroke="#a5b3a1" stroke-width="2"/>`;
      for(let c=0;c<5;c++)for(let r=0;r<2;r++)s+=`<rect x="${x-23+c*10}" y="${75+r*8}" width="7" height="5" rx="1" fill="${refletoresAcesos()?'#fff5ca':'#b9c9bc'}"/>`;
      if(refletoresAcesos())s+=`<ellipse cx="${x}" cy="83" rx="90" ry="65" fill="url(#${prefix}-luz)"/>`;
      s+='</g>';
    });
  }
  s+=`<path d="M-60 332Q600 270 1260 332v35H-60Z" fill="#344f41"/><path d="M-60 345Q600 287 1260 345" fill="none" stroke="#d5d7c1" stroke-width="2"/><text x="600" y="320" text-anchor="middle" fill="#ede9d5" font-family="Arial,sans-serif" font-size="11" letter-spacing="7">MORUMBI · SETOR ${oposto}</text>`;
  const limite=caminhoCampoTorcida([[0,0],[1,0],[1,1],[0,1]],setor,true);
  s+=`<path d="${limite}" fill="url(#${prefix}-grama)"/>`;
  if(temListras())for(let i=0;i<10;i+=2)s+=`<path d="${caminhoCampoTorcida([[i/10,0],[(i+1)/10,0],[(i+1)/10,1],[i/10,1]],setor,true)}" fill="#c3d6a1" opacity=".10"/>`;
  const marcacoes=[[[0,0],[1,0],[1,1],[0,1],[0,0]],[[.5,0],[.5,1]],[[0,.20],[.157,.20],[.157,.80],[0,.80]],[[1,.20],[.843,.20],[.843,.80],[1,.80]],[[0,.365],[.052,.365],[.052,.635],[0,.635]],[[1,.365],[.948,.365],[.948,.635],[1,.635]]];
  s+='<g fill="none" stroke="#e1e6cf" stroke-width="2" stroke-linejoin="round" opacity=".85">'+marcacoes.map(p=>'<path d="'+caminhoCampoTorcida(p,setor)+'"/>').join('');
  const circulo=Array.from({length:65},(_,i)=>[.5+Math.cos(i/64*Math.PI*2)*9.15/105,.5+Math.sin(i/64*Math.PI*2)*9.15/68]);s+='<path d="'+caminhoCampoTorcida(circulo,setor)+'"/></g>';
  for(const u of [.105,.5,.895]){const [x,y]=projetarCampoTorcida(u,.5,setor);s+=`<ellipse cx="${x}" cy="${y}" rx="2.5" ry="1.5" fill="#e2e8d1"/>`;}
  s+=golVistaTorcida(1,setor,prefix)+golVistaTorcida(0,setor,prefix);
  if(temCobertura())s+=`<path d="${caminhoCampoTorcida([[0,.84],[1,.84],[1,1],[0,1]],setor,true)}" fill="#1f392b" opacity="${noite?.12:.16}"/>`;
  const modelo=estadoArquibancada.bandeiroes[setor];
  if(modelo!=='nenhum'){
    const texto=modelo==='meu-time'?(meuTime.nome||'MEU TIME'):modelo==='soberano'?'SOBERANO':'TRICOLOR';
    s+=`<g data-vista-bandeirao><path d="M70 242Q238 217 404 236l-4 51Q233 265 77 292Z" fill="#eee7d5" stroke="#a84a47" stroke-width="2"/><path d="M76 272Q238 248 402 265" stroke="#b24748" stroke-width="8" fill="none"/><path d="M77 283Q238 260 401 276" stroke="#283c33" stroke-width="6" fill="none"/><text x="237" y="253" text-anchor="middle" fill="#9f393f" font-size="${texto.length>24?10:16}" font-weight="800">${escapar(texto.toUpperCase())}</text></g>`;
  }
  if(temPlacar())s+=`<g data-vista-placar transform="translate(${setor==='oeste'?140:920} 190)"><path d="M-5-5h136v79H-5Z" fill="#526458"/><rect width="126" height="68" rx="3" fill="#182f27"/><text x="63" y="17" fill="#b9c6aa" text-anchor="middle" font-size="8" letter-spacing="1.5">GOLS DO CICLO</text><text x="63" y="49" fill="#f0e8c4" text-anchor="middle" font-size="29" font-family="monospace">${golsDoPlacar()}</text><path d="M20 74v15m86-15v15" stroke="#62766b" stroke-width="4"/></g>`;
  s+=`<path d="M0 648Q600 627 1200 648v72H0Z" fill="${noite?'#40524b':'#b3b8a5'}"/><path d="M0 659Q600 638 1200 659M0 686Q600 665 1200 686" fill="none" stroke="${noite?'#61736a':'#dce0ce'}" stroke-width="4"/>`;
  for(let i=0;i<15;i++){const x=i*87-9,y=665+Math.pow((x-600)/600,2)*10;s+=`<path d="M${x-20} ${y}q20-7 40 0v19q-20 8-40 0Z" fill="${i%7<2?'#a64a48':'#aeb8a7'}" stroke="#6c847366" stroke-width="1.2"/>`;}
  if(temPublico()){
    const quantidade=nivelDaObra('publico')>=2?13:6;
    for(let i=0;i<quantidade;i++)s+=pessoaDaVistaTorcida(45+i*1110/(quantidade-1),693+(i%3)*3,.72,i,prefix);
    [[55,740,1.25],[250,758,1.35],[1000,750,1.3],[1185,744,1.25]].forEach(([x,y,k],i)=>s+=pessoaDaVistaTorcida(x,y,k,i+15,prefix));
  }
  s+=`<path d="M0 647Q600 626 1200 647" fill="none" stroke="${noite?'#8a9a87':'#d4d8c1'}" stroke-width="5"/><path d="M18 649v49m1164-49v49" stroke="#80937e" stroke-width="4"/>`;
  if(noite||tarde)s+='<path d="M0 0h1200v720H0Z" fill="'+(noite?'#102e2910':'#e4ad7610')+'" pointer-events="none"/>';
  s+=chuvaSvgAmbiente(0,0,1200,720,prefix+'-chuva');
  return s+'</svg>';
}
