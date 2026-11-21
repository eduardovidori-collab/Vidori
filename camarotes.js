/* Ala de camarotes integrada à fachada de concreto, abaixo do passeio superior. */
function temCamarotes(){return nivelDaObra('camarotes')>=1;}
function elevacaoCoberturaCamarotes(){return temCamarotes() ? 0.6 : 0;}
function elevacaoPlacarCamarotes(){return temCamarotes()?Math.max(0,perfilDaArquibancada().altura-11)+3:0;}
function setoresComCamarotes(){return nivelDaObra('camarotes')>=2?['sul','norte']:temCamarotes()?['sul']:[];}
function camarotesDoSetor(a){
  const nivel=nivelDaObra('camarotes'),setor=a.perto==='y0'?'sul':'norte';
  if(!nivel||!a.aoLongoDeX||!setoresComCamarotes().includes(setor))return '';
  const amplo=nivel>=2,noite=ambienteEstadioAtual().periodo==='noite';
  const sinal=a.perto==='y0'?1:-1,borda=sinal>0?a.y1:a.y0;
  // O teto da ala coincide com a arquibancada; a laje existente apoia a obra.
  const z=perfilDaArquibancada().altura-7.1,topo=5.85,dentro=-4.4,fora=3.25;
  const ponto=(x,d,h)=>[x,borda+sinal*d,z+h];
  const face=(x0,x1,d,h0,h1,cor,extra='')=>poligono([ponto(x0,d,h0),ponto(x1,d,h0),ponto(x1,d,h1),ponto(x0,d,h1)],cor,extra);
  const piso=(x0,x1,d0,d1,h,cor,extra='')=>poligono([ponto(x0,d0,h),ponto(x1,d0,h),ponto(x1,d1,h),ponto(x0,d1,h)],cor,extra);
  const bloco=(x0,x1,d0,d1,h0,h1,cores)=>{
    const y0=borda+sinal*d0,y1=borda+sinal*d1;
    return caixa(x0,Math.min(y0,y1),x1,Math.max(y0,y1),z+h0,z+h1,...cores);
  };
  const de=amplo?-49:-42,ate=-de,n=amplo?8:6,passo=(ate-de)/n;
  const concreto=['#DFE1DA','#BBC2BC','#9FAAA3'],metal='#44585B',vermelho='#AD3440';
  let s=bloco(de-1,ate+1,dentro-.2,fora+.7,-.45,.28,concreto);
  // Consoles curtos ficam ligados à parede, sem ocupar a praça.
  for(let i=0;i<=n;i+=2){
    const x=de+i*passo;
    s+=poligono([ponto(x-.4,0,-1.5),ponto(x-.4,fora+.5,-.3),ponto(x-.4,0,-.3)],'#96A49C');
    s+=poligono([ponto(x+.4,0,-1.5),ponto(x+.4,fora+.5,-.3),ponto(x-.4,fora+.5,-.3),ponto(x-.4,0,-1.5)],'#AAB5AC');
  }
  // Um único volume de concreto reúne as salas, sem coberturas individuais.
  s+=face(de,ate,dentro,.3,topo,noite?'#ECCB8D':'#D5D8CC');
  [de-1,ate].forEach(x=>{s+=bloco(x,x+1,dentro,fora+.55,.25,6.5,concreto);});
  const salas=[];
  for(let i=0;i<n;i++){
    const x0=de+i*passo+.23,x1=de+(i+1)*passo-.23,cx=(x0+x1)/2;
    let sala=piso(x0,x1,dentro,fora,.3,noite?'#D6BB87':'#C8CCBC');
    // Bancadas de madeira e sofás vermelhos aparecem por trás do vidro recuado.
    sala+=bloco(x0+.9,x0+5.2,.05,1.9,.3,.75,['#707A6E','#535F54','#43564A']);
    sala+=bloco(x0+.75,x0+5.35,-.05,1.95,.75,1.45,['#A94A50','#85333F','#642B36']);
    sala+=bloco(x0+.75,x0+5.35,-.05,.45,1.45,2.55,['#A94A50','#85333F','#642B36']);
    // Mesa de apoio com tampo claro e pé apoiado na laje.
    sala+=bloco(cx+.6,cx+.82,-.65,-.43,.3,1.35,['#7B8B82','#5A6F63','#435D50']);
    sala+=bloco(cx-.45,cx+1.9,-1.3,.25,1.35,1.55,['#DDD4B8','#B6AF94','#929A81']);
    if(amplo){
      [x1-3.4,x1-1.65].forEach(x=>{
        sala+=bloco(x-.5,x+.5,.5,1.6,.3,1.1,['#C8C8B1','#959F8B','#738A75']);
        sala+=bloco(x-.5,x+.5,1.3,1.7,1.1,2.1,['#D3D0B6','#A3A68D','#7E917C']);
      });
      sala+=bloco(x1-1.2,x1-.6,dentro+.7,dentro+1.3,.3,.95,['#D8DACE','#AAB6A3','#8F9D8D']);
      sala+=bloco(x1-1.25,x1-.55,dentro+.65,dentro+1.35,.95,1.85,['#678964','#4F7653','#3E6448']);
      sala+=face(x0+.4,x1-.4,dentro+.03,4.8,5.1,noite?'#FFE7AC':'#E4D8B8');
    }
    // A fachada permanece contínua; divisórias e caixilhos são discretos.
    [dentro-.02].forEach(d=>{
      sala+=face(x0+.06,x1-.06,d,.7,topo-.28,noite?'#E8BB71':'#72949D',' fill-opacity="'+(noite?'.15':'.22')+'"');
      sala+=traco([ponto(x0,d,.55),ponto(x0,d,topo-.18)],metal,.2);
      sala+=traco([ponto(cx,d,.65),ponto(cx,d,topo-.28)],'#5B7275',.1,.8);
      sala+=traco([ponto(x0+.9,d,1),ponto(x0+2.8,d,topo-.55)],noite?'#F9DDA3':'#F1FAF4',.18,.32);
    });
    // Marcas de fôrma e pontos de fixação discretos no concreto aparente.
    const furo=iso(...ponto(cx,fora+1.03,6.35));
    sala+='<circle cx="'+furo.x+'" cy="'+furo.y+'" r=".12" fill="#6B7C74" opacity=".45"/>';
    salas.push({d:cx,s:'<g data-camarote-sala="'+(i+1)+'">'+sala+'</g>'});
  }
  s+=salas.sort((a,b)=>a.d-b.d).map(s=>s.s).join('');
  // A pele de vidro é contínua; um caixilho principal reúne cada par de salas.
  s+=face(de+.15,ate-.15,fora+.04,.65,topo-.2,noite?'#E8BA70':'#71949E',' fill-opacity="'+(noite?'.19':'.40')+'"');
  s+=traco([ponto(de,fora+.07,.66),ponto(ate,fora+.07,.66)],metal,.19);
  s+=traco([ponto(de,fora+.07,topo-.17),ponto(ate,fora+.07,topo-.17)],metal,.18);
  for(let i=0;i<=n;i+=2){
    const x=de+i*passo;
    s+=traco([ponto(x,fora+.08,.66),ponto(x,fora+.08,topo-.17)],metal,.24);
    if(i<n)s+=traco([ponto(x+1.6,fora+.09,1),ponto(x+4.2,fora+.09,topo-.5)],noite?'#F5D693':'#E8F4F2',.2,.32);
  }
  // Marquise monolítica, com sombra sob a borda e um friso vermelho contínuo.
  s+=bloco(de-1.35,ate+1.35,-.1,fora+1.05,5.95,7.1,concreto);
  s+=face(de-1.35,ate+1.35,fora+1.07,5.93,6.1,'#667870');
  s+=face(de-1.35,ate+1.35,fora+1.09,6.08,6.5,vermelho);
  s+=face(de-1,ate+1,fora+.72,-.26,.08,'#A6B1A7');
  s+=traco([ponto(de,fora+.74,.31),ponto(ate,fora+.74,.31)],amplo?'#96323E':'#5F7370',.2);
  if(amplo){
    s+=traco([ponto(de-1,fora+1.11,6.65),ponto(ate+1,fora+1.11,6.65)],'#EDF0E6',.13);
    s+=traco([ponto(de-1,fora+1.11,6.82),ponto(ate+1,fora+1.11,6.82)],'#354A45',.12);
  }
  return '<g data-camarotes="'+nivel+'" data-camarotes-estilo="morumbi" data-camarotes-setor="'+setor+'" data-camarotes-luz="'+(noite?'acesa':'natural')+'">'+s+'</g>';
}
/** Faixa de concreto e vidro nas vistas do campo e nas cobranças. */
function camarotesFundoJogo(){
  if(!temCamarotes())return '';
  const amplo=nivelDaObra('camarotes')>=2,noite=ambienteEstadioAtual().periodo==='noite',n=amplo?8:6;
  let s='<path d="M45 201Q450 155 855 201V238Q450 194 45 238Z" fill="#B7C2B7" stroke="#DCE1D5" stroke-width="2"/>';
  for(let i=0;i<n;i++){
    const x=52+i*796/n,w=796/n-3,y=207-39*Math.sin(Math.PI*(x+w/2)/900);
    s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="21" fill="'+(noite?'#D6BB83':'#789A9C')+'"/><path d="M'+(x+w*.5)+' '+y+'v21" stroke="#455E5A" stroke-width="1.5"/>';
    if(amplo)s+='<path d="M'+(x+7)+' '+(y+16)+'h'+(w-14)+'" stroke="#994550" stroke-width="3"/>';
  }
  s+='<path d="M45 203Q450 157 855 203" stroke="#AE3540" stroke-width="3" fill="none"/>';
  return '<g data-camarotes-vista="'+nivelDaObra('camarotes')+'">'+s+'</g>';
}
