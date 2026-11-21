/* Bairro do estádio: quarteirões, comércio e mobiliário urbano em escala. */
function cidadeIluminada(){return ambienteEstadioAtual().periodo!=='dia';}
function textoNaFaceCidade(cx,cy,z,texto,tamanho,cor,eixo='y'){
  const q=iso(cx,cy,z),inclinacao=eixo==='x'?-ISO_SEN:ISO_SEN;
  return '<g transform="matrix('+ISO_COS+' '+inclinacao+' 0 1 '+q.x+' '+q.y+')"><text text-anchor="middle" dominant-baseline="middle" font-family="Segoe UI,Arial,sans-serif" font-weight="700" font-size="'+tamanho+'" fill="'+cor+'">'+escapar(texto)+'</text></g>';
}
function pisoDaCidade(){
  const asfalto='#626D70',calcada='#D6D6C9',borda='#ABB9AC',z=.21;
  let s='';
  // Três ruas conectadas deixam a entrada e as praças livres no lado sul.
  s+=caixa(-145,-135,-94,108,0,.16,calcada,borda,'#99AC9A');
  s+=caixa(-145,-135,164,-92,0,.16,calcada,borda,'#99AC9A');
  s+=caixa(151,-96,164,108,0,.16,calcada,borda,'#99AC9A');
  s+=caixa(-110,-135,-100,108,.16,.19,asfalto,asfalto,asfalto);
  s+=caixa(-145,-106,164,-96,.16,.19,asfalto,asfalto,asfalto);
  s+=caixa(156,-106,164,108,.16,.19,asfalto,asfalto,asfalto);
  for(const y of [-45,-2,41])s+=caixa(-145,y,-110,y+6,.16,.19,asfalto,asfalto,asfalto);
  // Bolsões de estacionamento fora das faixas de circulação.
  for(const y of [-77,10]){
    s+=caixa(-117,y,-110,y+23,.16,.2,'#78827E','#78827E','#78827E');
    for(let t=y+1;t<y+23;t+=7)s+=traco([[-116.7,t,z],[-110.5,t,z]],'#E9E8D6',.2);
  }
  s+=caixa(-65,-112,-37,-106,.16,.2,'#78827E','#78827E','#78827E');
  for(let x=-64;x<-37;x+=8)s+=traco([[x,-111.7,z],[x,-106.4,z]],'#E9E8D6',.2);
  for(let y=-130;y<105;y+=11){
    if(y>-115&&y<-89||y>-10&&y<8||y>83&&y<100)continue;
    s+=traco([[-105,y,z],[-105,y+4.5,z]],'#E4D8AE',.25);
  }
  for(let x=-141;x<160;x+=11){
    if(x>-119&&x<-91||x>26&&x<45||x>147)continue;
    s+=traco([[x,-101,z],[x+4.5,-101,z]],'#E4D8AE',.25);
  }
  for(let y=-90;y<105;y+=12){if(y>-76&&y<-55)continue;s+=traco([[160,y,z],[160,y+5,z]],'#DED3AF',.21);}
  // Guias e juntas de calçada; interrupções nas travessias e no cruzamento.
  for(const x of [-110,-100])for(const [a,b]of [[-133,-107],[-95,-10],[8,83],[100,107]])s+=traco([[x,a,z],[x,b,z]],'#F1ECDD',.35);
  for(const y of [-106,-96])for(const [a,b]of [[-144,-111],[-99,27],[44,153]])s+=traco([[a,y,z],[b,y,z]],'#F1ECDD',.35);
  for(const x of [156,163.7])for(const [a,b]of [[-95,-77],[-56,108]])s+=traco([[x,a,z],[x,b,z]],'#ECE6D7',.27);
  for(let y=-132;y<108;y+=5){
    for(const [x0,x1]of [[-121,-117],[-100,-94]])s+=traco([[x0,y,.18],[x1,y,.18]],'#B7C1B2',.12,.6);
  }
  for(let x=-90;x<151;x+=6)s+=traco([[x,-114,.18],[x,-107,.18]],'#B8C1B3',.12,.6);
  // Faixas de pedestres em escala, conectadas à praça e ao ponto de ônibus.
  for(const y0 of [-8,86])for(let y=y0;y<=y0+10;y+=1.8)s+=caixa(-109.5,y,-100.5,y+.85,.2,.23,'#F5F0DE',borda,borda);
  for(let x=30;x<42;x+=1.8)s+=caixa(x,-105.5,x+.85,-96.5,.2,.23,'#F5F0DE',borda,borda);
  for(let y=-74;y<-59;y+=2)s+=caixa(156.4,y,163.6,y+.9,.2,.23,'#F5F0DE',borda,borda);
  s+=caixa(-94,90,-56,98,0,.17,'#DDDCD0',borda,'#A6B4AA');
  s+=caixa(136,-72,156,-64,0,.18,'#D9D9CC',borda,'#A6B4AA');
  // Canteiros de árvores nas calçadas, afastados da estrutura do estádio.
  for(const [x,y]of [[-96,-48],[-96,2],[-96,79],[-118,-95],[-64,-91],[63,-91],[148,-88],[150,63]]){
    s+=caixa(x-2.5,y-2.5,x+2.5,y+2.5,.17,.36,'#B6C2AA','#A6B59C','#92A58D');
    s+=caixa(x-1.9,y-1.9,x+1.9,y+1.9,.36,.39,'#69896A','#69896A','#69896A');
  }
  return '<g data-cidade="ruas">'+s+'</g>';
}
function predioDaCidade(cx,cy,lx,ly,pisos,paleta,lojaNome,opcoes={}){
  const [topo,dir,esq]=paleta,altura=.6+pisos*3.6,frente=opcoes.frente||'y',tipo=opcoes.tipo||'apartamento',acesas=cidadeIluminada();
  const face=(e,t,d,z)=>e==='x'?[cx+lx+d,cy-t,z]:[cx+t,cy+ly+d,z];
  const painel=(e,a,b,z0,z1,cor,d=.035,extra='')=>poligono([face(e,a,d,z0),face(e,b,d,z0),face(e,b,d,z1),face(e,a,d,z1)],cor,extra);
  const largura=frente==='x'?ly:lx;
  let s=sombraNoChao(cx+1,cy+1,lx+1.7,ly+1.7);
  s+=caixa(cx-lx-.6,cy-ly-.6,cx+lx+.6,cy+ly+.6,.17,.6,'#C3C7B9','#A9B6A5','#91A28E');
  s+=caixa(cx-lx,cy-ly,cx+lx,cy+ly,.6,altura,topo,dir,esq);
  for(const eixo of ['x','y']){
    const meio=eixo==='x'?ly:lx,colunas=Math.max(2,Math.floor(meio/3.3));
    for(let piso=0;piso<pisos;piso++){
      if(lojaNome&&piso===0&&eixo===frente)continue;
      for(let col=0;col<colunas;col++){
        const t=-meio+2.3+(2*meio-4.6)*(colunas===1?.5:col/(colunas-1)),z0=1.55+piso*3.6,z1=z0+1.9;
        const acesa=acesas&&((Math.abs(cx*7+cy*11)+piso*13+col*7+(eixo==='x'?3:0))%5<3),cor=acesa?'#EDC782':'#536E78';
        let janela=painel(eixo,t-1.0,t+1.0,z0,z1,cor);
        janela+=painel(eixo,t-.075,t+.075,z0,z1,acesa?'#8B8668':'#B2C1BD',.07);
        janela+=painel(eixo,t-1.18,t+1.18,z0-.17,z0-.02,'#E9E5D5',.08);
        s+=(acesa?'<g data-'+(opcoes.principal?'arredores':'cidade')+'="janela-acesa">':'<g>')+janela+'</g>';
      }
      if(piso>0)s+=traco([face(eixo,-meio,.025,piso*3.6+.65),face(eixo,meio,.025,piso*3.6+.65)],'#E4E1D1',.13,.55);
    }
  }
  if(lojaNome){
    s+='<g data-cidade="comercio">'+painel(frente,-largura+1,largura-1,.62,3.25,acesas?'#BBAA77':'#3F646B');
    for(let t=-largura+2.5;t<largura-1;t+=3)s+=painel(frente,t-.09,t+.09,.62,3.25,'#ADBCB5',.08);
    const toldo=opcoes.toldo||'#9E3E48',fim=largura+.35,partes=Math.max(6,Math.round(largura*1.1));
    for(let j=0;j<partes;j++){
      const a=-fim+2*fim*j/partes,b=-fim+2*fim*(j+1)/partes,cor=j%2?'#EFE5CA':toldo;
      s+=poligono([face(frente,a,.05,3.5),face(frente,b,.05,3.5),face(frente,b,1.7,3.1),face(frente,a,1.7,3.1)],cor);
      s+=painel(frente,a,b,2.8,3.1,cor,1.72);
    }
    s+=painel(frente,-largura+.35,largura-.35,3.68,4.36,toldo,.09);
    const q=face(frente,0,.13,4.01);
    s+=textoNaFaceCidade(q[0],q[1],q[2],lojaNome,Math.min(.95,(2*largura-1)/(lojaNome.length*.66)),'#FFF5D9',frente);
    s+='</g>';
  }else{
    s+=painel(frente,-1.05,1.05,.6,3.3,'#3F5753');
    s+=painel(frente,.72,.8,1.1,1.55,'#D4C7A0',.07);
  }
  // Sacadas apenas em alguns edifícios: volumes distintos, sem repetir a mesma torre.
  if(tipo==='apartamento'&&pisos>=3){
    for(let p=1;p<pisos;p++){
      const h=.65+p*3.6,metade=Math.min(4.4,largura-1.6);
      s+=poligono([face(frente,-metade,0,h),face(frente,metade,0,h),face(frente,metade,1.05,h),face(frente,-metade,1.05,h)],'#D9DBCC');
      s+=painel(frente,-metade,metade,h,h+.9,'#A2BEB5',1.08,' fill-opacity=".56"');
      s+=traco([face(frente,-metade,1.1,h+.94),face(frente,metade,1.1,h+.94)],'#536D61',.17);
    }
  }
  if(tipo==='sobrado'){
    s+=poligono([[cx-lx-.6,cy-ly-.6,altura],[cx+lx+.6,cy-ly-.6,altura],[cx+lx+.6,cy,altura+2.2],[cx-lx-.6,cy,altura+2.2]],'#AA7157');
    s+=poligono([[cx-lx-.6,cy,altura+2.2],[cx+lx+.6,cy,altura+2.2],[cx+lx+.6,cy+ly+.6,altura],[cx-lx-.6,cy+ly+.6,altura]],'#C38A66');
    for(let x=cx-lx;x<cx+lx;x+=1.4)s+=traco([[x,cy-ly-.6,altura+.04],[x,cy,altura+2.25],[x,cy+ly+.6,altura+.04]],'#805D48',.1,.55);
    s+=traco([[cx-lx-.7,cy,altura+2.2],[cx+lx+.7,cy,altura+2.2]],'#D6A87C',.3);
  }else{
    s+=caixa(cx-lx-.45,cy-ly-.45,cx+lx+.45,cy+ly+.45,altura,altura+.45,'#E6E4D6','#C5CCBB','#A6B7A0');
    s+=caixa(cx-lx+1,cy-ly+1,cx+lx-1,cy+ly-1,altura+.45,altura+.47,'#AEB8A4','#AEB8A4','#AEB8A4');
    if(pisos>=3){
      const tx=cx-lx*.28,ty=cy-ly*.2,base=altura+.5;
      s+=caixa(tx-1.8,ty-1.6,tx+1.8,ty+1.6,base,base+.35,'#BDC5B5','#9EAE9A','#889D87');
      for(let k=0;k<12;k++){
        const a=k*Math.PI/6,b=(k+1)*Math.PI/6;
        if(Math.cos((a+b)/2)+Math.sin((a+b)/2)>0)s+=poligono([[tx+1.4*Math.cos(a),ty+1.4*Math.sin(a),base+.35],[tx+1.4*Math.cos(b),ty+1.4*Math.sin(b),base+.35],[tx+1.4*Math.cos(b),ty+1.4*Math.sin(b),base+2],[tx+1.4*Math.cos(a),ty+1.4*Math.sin(a),base+2]],'#6D919B');
      }
      const disco=Array.from({length:20},(_,i)=>[tx+1.4*Math.cos(i*Math.PI/10),ty+1.4*Math.sin(i*Math.PI/10),base+2]);s+=poligono(disco,'#9EB8B9');
      s+=traco([[cx+lx*.5,cy-ly*.4,base],[cx+lx*.5,cy-ly*.4,base+3.2]],'#6D8079',.15);
    }
  }
  const entradaCafe=lojaNome==='CAFÉ'?' data-abrir-cafe="true" role="button" tabindex="0" aria-label="Entrar no Café do Morumbi para estudar"':'';
  return '<g '+(opcoes.principal?'data-arredores="predio"':'data-cidade="predio"')+' data-pavimentos="'+pisos+'"'+entradaCafe+'>'+s+'</g>';
}
function carroDaCidade(cx,cy,aoLongoDeX,paleta){
  const p=(x,y,z)=>aoLongoDeX?[cx+x,cy+y,z]:[cx+y,cy+x,z];
  const bloco=(x0,y0,x1,y1,z0,z1,cores)=>{const a=p(x0,y0,0),b=p(x1,y1,0);return caixa(a[0],a[1],b[0],b[1],z0,z1,...cores);};
  let s=sombraNoChao(cx,cy,aoLongoDeX?3.3:1.8,aoLongoDeX?1.8:3.3);
  [-1.75,1.75].forEach(x=>[-1,1].forEach(y=>{s+=bloco(x-.42,y*1.25-.17,x+.42,y*1.25+.17,.25,.82,['#293737','#202E2D','#172624']);}));
  s+=bloco(-2.85,-1.25,2.85,1.25,.55,1.25,paleta);
  s+=bloco(-1.3,-1.08,1.15,1.08,1.25,1.95,['#BED2D4','#587C89','#416774']);
  s+=bloco(-1.3,-1.08,1.15,1.08,1.94,2.07,paleta);
  [-1,1].forEach(y=>{s+=traco([p(2.88,y*.75-.23,.93),p(2.88,y*.75+.23,.93)],'#F2DBA5',.35);s+=traco([p(-2.88,y*.75-.23,.93),p(-2.88,y*.75+.23,.93)],'#AC4A42',.25);});
  return '<g data-cidade="carro">'+s+'</g>';
}
function onibusDaCidade(cx,cy){
  let s=caixa(cx-1.6,cy-6.4,cx+1.6,cy+6.4,.6,3.8,'#DEDCD0','#B5C4BC','#8CA89A');
  for(const x of [cx-1.61,cx+1.61])for(let y=cy-4.7;y<cy+5.2;y+=2)s+=poligono([[x,y,.9],[x,y+1.5,.9],[x,y+1.5,3.2],[x,y,3.2]],'#557A87');
  s+=poligono([[cx-1.61,cy-6.4,1.2],[cx+1.61,cy-6.4,1.2],[cx+1.61,cy-6.4,3.2],[cx-1.61,cy-6.4,3.2]],'#557A87');
  s+=caixa(cx-1.62,cy-6.45,cx+1.62,cy+6.45,1.05,1.45,'#AF3945','#AF3945','#8D2D3C');
  s+=caixa(cx-1.6,cy-6.4,cx+1.6,cy+6.4,3.8,4.1,'#EAE8D9','#B5C4BC','#8CA89A');
  for(const y of [cy-4.5,cy+4.5])for(const x of [cx-1.65,cx+1.65]){
    const q=iso(x,y,.6);s+='<ellipse cx="'+q.x+'" cy="'+q.y+'" rx=".45" ry=".75" fill="#263733"/>';
  }
  return '<g data-cidade="onibus">'+s+'</g>';
}
function pedestreDaCidade(cx,cy,cor='#9A4550',semente=0){
  const q=iso(cx,cy,.2),pele=['#B88E6B','#E0B998','#87644D'][semente%3];
  return '<g data-cidade="pedestre" transform="translate('+q.x+' '+q.y+')"><ellipse cy=".1" rx=".7" ry=".26" fill="#213E2526"/><path d="M-.24-.75-.33 0M.23-.75.35 0" stroke="#3B4C48" stroke-width=".23"/><path d="M-.35-1.6H.35L.42-.7H-.42Z" fill="'+cor+'"/><circle cy="-1.99" r=".35" fill="'+pele+'"/><path d="M-.38-1.45-.61-.9M.38-1.45.61-.9" stroke="'+pele+'" stroke-width=".18"/></g>';
}
function posteDaCidade(cx,cy,altura=8,praca=false){
  let s=caixa(cx-.25,cy-.25,cx+.25,cy+.25,.18,altura,'#8A9A8C','#657F6F','#506C5B');
  s+=traco([[cx,cy,altura],[cx+1.6,cy,altura+.35]],'#526E61',.22);
  s+=caixa(cx+.7,cy-.42,cx+2.3,cy+.42,altura+.2,altura+.43,'#DAE0D0','#A6B9A5','#8AA88C');
  if(cidadeIluminada()){
    s+=poligono([[cx+.7,cy-.42,altura+.18],[cx+2.3,cy-.42,altura+.18],[cx+2.3,cy+.42,altura+.18],[cx+.7,cy+.42,altura+.18]],'#FFE2A2');
    const q=iso(cx+1.5,cy,altura+.12),id='cidade-lampada-'+cx+'-'+cy;
    s+='<defs><radialGradient id="'+id+'"><stop stop-color="#FFE7AD" stop-opacity=".55"/><stop offset="1" stop-color="#FFE7AD" stop-opacity="0"/></radialGradient></defs><circle cx="'+q.x+'" cy="'+q.y+'" r="3.2" fill="url(#'+id+')"/>';
    const pts=Array.from({length:24},(_,i)=>[cx+2+4.5*Math.cos(i*Math.PI/12),cy+3*Math.sin(i*Math.PI/12),.2]);
    s+=poligono(pts,'#F9D98B',' fill-opacity=".11"');
  }
  return '<g data-'+(praca?'arredores':'cidade')+'="'+(cidadeIluminada()?'poste-aceso':'poste')+'">'+s+'</g>';
}
function semaforoDaCidade(cx,cy,eixo='x'){
  let s=caixa(cx-.18,cy-.18,cx+.18,cy+.18,.2,6.1,'#6F8574','#526F5B','#405D4B');
  s+=caixa(cx-.45,cy-.35,cx+.45,cy+.35,4.8,6.6,'#3F5347','#304B3B','#243C2E');
  const q=iso(cx+.46,cy+.36,5.8);for(let i=0;i<3;i++)s+='<circle cx="'+q.x+'" cy="'+(q.y-.55+i*.55)+'" r=".16" fill="'+(i===(eixo==='x'?2:0)?(i===2?'#8EB56B':'#D17E67'):'#536B54')+'"/>';
  return '<g data-cidade="semaforo">'+s+'</g>';
}
function pontoDeOnibus(cx,cy){
  let s=caixa(cx-2.5,cy-7,cx+2.5,cy+7,.17,.5,'#C4CAB9','#9BAC98','#7E967D');
  for(const d of [-5.8,5.8])s+=caixa(cx+1.4,cy+d-.2,cx+1.75,cy+d+.2,.5,5.6,'#758C7B','#526F5A','#405D49');
  s+=poligono([[cx+1.7,cy-5.8,.6],[cx+1.7,cy+5.8,.6],[cx+1.7,cy+5.8,5.4],[cx+1.7,cy-5.8,5.4]],'#A7C4BA',' fill-opacity=".5"');
  s+=caixa(cx-1.1,cy-4.5,cx+.6,cy+4.5,1.5,1.85,'#B4A37A','#8F805B','#726B4B');
  s+=caixa(cx-2.8,cy-7.1,cx+2.8,cy+7.1,5.6,6.1,'#E2E2D0','#B1C1A8','#8FA986');
  s+=caixa(cx-2.3,cy+8.2,cx-1.9,cy+8.6,.3,7,'#718970','#526D52','#40583F');
  s+=caixa(cx-2.9,cy+7.8,cx-1.3,cy+9,5.8,7.4,'#719F9D','#457F7E','#346565');
  return '<g data-cidade="ponto-onibus">'+s+'</g>';
}
function mobiliarioDaCidade(cx,cy,tipo='banco'){
  let s='';
  if(tipo==='banco')s=bancoDaPraca(cx,cy);
  else if(tipo==='mesa'){
    s=caixa(cx-.12,cy-.12,cx+.12,cy+.12,.2,1.3,'#8C9784','#647E60','#4E6949');
    s+=caixa(cx-1.1,cy-.8,cx+1.1,cy+.8,1.3,1.5,'#D3B98D','#B1966D','#917E54');
    for(const d of [-1.65,1.65])s+=caixa(cx-.65,cy+d-.42,cx+.65,cy+d+.42,.2,.95,'#A5675D','#854D49','#6A3D3C');
  }
  else if(tipo==='lixeira'){
    s=caixa(cx-.6,cy-.6,cx+.6,cy+.6,.2,1.65,'#758D6D','#506E4C','#3E5C3A');
    s+=caixa(cx-.7,cy-.7,cx+.7,cy+.7,1.65,1.85,'#9CAA89','#6D8663','#55764C');
  }else{
    s=caixa(cx-.15,cy-.15,cx+.15,cy+.15,.2,3.1,'#81957B','#5E7B57','#486444');
    s+=caixa(cx-1.2,cy-.6,cx+1.2,cy+.6,2.7,3.7,'#527B79','#3A625F','#2E514C');
  }
  return '<g data-cidade="'+tipo+'">'+s+'</g>';
}
const LOTES_CIDADE = [
  {x:-128,y:-122,lx:10,ly:8,p:2,c:['#E2D3BC','#C6B08F','#A79576'],loja:'FLORICULTURA',o:{frente:'x',tipo:'sobrado',toldo:'#637F67'}},
  {x:-132,y:-80,lx:9,ly:8,p:3,c:['#E2D5BB','#C8B792','#A99A78'],loja:'MERCEARIA',o:{frente:'x',tipo:'sobrado',toldo:'#8F4550'}},
  {x:-130,y:-61,lx:10,ly:8,p:4,c:['#DBDCCE','#BCC8B5','#9CAB91']},
  {x:-132,y:-27,lx:9,ly:8,p:2,c:['#D4B5A4','#B58E7E','#997567'],loja:'BARBEARIA',o:{frente:'x',tipo:'sobrado',toldo:'#566F79'}},
  {x:-131,y:-10,lx:10,ly:7,p:3,c:['#CEDAD5','#A9C2B4','#8FAE9B'],o:{frente:'x'}},
  {x:-131,y:17,lx:10,ly:12,p:4,c:['#D6D4C3','#BDBBA2','#9DA78B'],o:{frente:'x'}},
  {x:-132,y:58,lx:9,ly:9,p:2,c:['#E0C8AF','#C8A586','#A98C6D'],loja:'LANCHONETE',o:{frente:'x',tipo:'sobrado',toldo:'#9A4549'}},
  {x:-131,y:78,lx:10,ly:7,p:3,c:['#D5DEDC','#B2CAC5','#97B5AD'],o:{frente:'x'}},
  {x:-132,y:98,lx:9,ly:7,p:2,c:['#DDD8C3','#C3BDA3','#A7AD8F'],loja:'LIVRARIA',o:{frente:'x',tipo:'sobrado',toldo:'#647D6A'}},
  {x:-80,y:-123,lx:10,ly:8,p:3,c:['#DADCCB','#BBC5AC','#9EAE90']},
  {x:-55,y:-123,lx:10,ly:8,p:4,c:['#CFDAD9','#A7C1C0','#8AA7A8']},
  {x:-27,y:-123,lx:11,ly:8,p:2,c:['#E2C8AA','#C6A27F','#A48967'],loja:'PADARIA',o:{tipo:'sobrado',toldo:'#A25845'}},
  {x:3,y:-123,lx:9,ly:8,p:3,c:['#DCDCCF','#C0C5B2','#A2B098']},
  {x:29,y:-123,lx:10,ly:8,p:2,c:['#E6D7BC','#CFB994','#AF9F7C'],loja:'CAFÉ',o:{tipo:'sobrado',toldo:'#7F4B4A'}},
  {x:56,y:-123,lx:10,ly:8,p:3,c:['#D9C7BC','#BDA69A','#A28E81']},
  {x:84,y:-123,lx:9,ly:8,p:2,c:['#DDDCC6','#C0C4A5','#A1AF88'],loja:'MERCADO',o:{toldo:'#63806A'}},
  {x:110,y:-123,lx:9,ly:8,p:4,c:['#D2DADD','#AEC4CA','#91ABB4']},
  {x:137,y:-123,lx:10,ly:8,p:2,c:['#DDE2D2','#C2CCB3','#A3B88F'],loja:'FARMÁCIA',o:{toldo:'#668C7C'}}
];
const CIDADE_NIVEL_4 = [
  ...LOTES_CIDADE.map(l=>({x:l.x,y:l.y,svg:()=>predioDaCidade(l.x,l.y,l.lx,l.ly,l.p,l.c,l.loja,l.o)})),
  ...[[-107.5,-68,false,['#B96E61','#96594C','#7D493D']],[-102.5,10,false,['#E7E2CF','#C5C7B0','#A6B49A']],[65,-103.5,true,['#6D919C','#4D7280','#3C5C69']],[124,-98.5,true,['#B9A276','#988453','#7F7245']],[-113.5,-72.5,false,['#C1CACC','#95A9AB','#728E91']],[-113.5,21.5,false,['#A66560','#844D4B','#6B3D3C']],[-52,-109,true,['#DEDBC8','#B9C2B2','#9AAC97']],[158,-38,false,['#BE9D78','#9B7C56','#7C6749']],[162,73,false,['#8CABB0','#678992','#4D6E7B']]].map(([x,y,e,c])=>({x,y,svg:()=>carroDaCidade(x,y,e,c)})),
  {x:-102.5,y:43,svg:()=>onibusDaCidade(-102.5,43)},
  {x:-96.5,y:54,svg:()=>pontoDeOnibus(-96.5,54)},
  ...[[-96,-48],[-96,2],[-96,79],[-118,-95],[-64,-91],[63,-91],[148,-88],[150,63]].map(([x,y])=>({x,y,svg:()=>arvore(x,y,.39)})),
  ...[[-97,-77],[-97,-22],[-97,27],[-97,91],[-67,-94],[17,-94],[100,-94],[153,-87],[153,18],[153,83]].map(([x,y])=>({x,y,svg:()=>posteDaCidade(x,y)})),
  ...[[-112,-94,'x'],[-98,-108,'y'],[153,-94,'y']].map(([x,y,e])=>({x,y,svg:()=>semaforoDaCidade(x,y,e)})),
  ...[[-118,-55,'#A54C51'],[-119,-19,'#D6D3BC'],[-96,47,'#A54C51'],[-95,59,'#D6D3BC'],[-96,66,'#6B8B80'],[-34,-112,'#8E6D56'],[20,-112,'#A54C51'],[41,-111,'#D5C7A8'],[146,-65,'#D4D6BF'],[152,32,'#68877F'],[-118,89,'#A54C51']].map(([x,y,c],i)=>({x,y,svg:()=>pedestreDaCidade(x,y,c,i)})),
  {x:24,y:-110,svg:()=>mobiliarioDaCidade(24,-110,'mesa')},
  {x:33,y:-110,svg:()=>mobiliarioDaCidade(33,-110,'mesa')},
  {x:-96,y:20,svg:()=>mobiliarioDaCidade(-96,20,'lixeira')},
  {x:148,y:-77,svg:()=>mobiliarioDaCidade(148,-77,'lixeira')},
  {x:-118,y:38,svg:()=>mobiliarioDaCidade(-118,38,'placa')},
  {x:152,y:93,svg:()=>mobiliarioDaCidade(152,93,'placa')}
];
