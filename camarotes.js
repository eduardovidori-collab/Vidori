/* Camarotes apoiados no passeio superior, sem substituir assentos ou anéis. */
function temCamarotes(){return nivelDaObra('camarotes')>=1;}
function elevacaoCoberturaCamarotes(){return temCamarotes()?2.4:0;}
function elevacaoPlacarCamarotes(){return temCamarotes()?Math.max(0,perfilDaArquibancada().altura-11)+3:0;}
function setoresComCamarotes(){return nivelDaObra('camarotes')>=2?['sul','norte']:temCamarotes()?['sul']:[];}
function camarotesDoSetor(a){
  const nivel=nivelDaObra('camarotes'),setor=a.perto==='y0'?'sul':'norte';
  if(!nivel||!a.aoLongoDeX||!setoresComCamarotes().includes(setor))return '';
  const luxo=nivel>=2,noite=ambienteEstadioAtual().periodo==='noite',z=perfilDaArquibancada().altura;
  const sinal=a.perto==='y0'?1:-1,borda=sinal>0?a.y1:a.y0;
  const ponto=(x,d,h)=>[x,borda+sinal*d,z+h];
  const face=(x0,x1,d,h0,h1,cor,extra='')=>poligono([ponto(x0,d,h0),ponto(x1,d,h0),ponto(x1,d,h1),ponto(x0,d,h1)],cor,extra);
  const piso=(x0,x1,d0,d1,h,cor,extra='')=>poligono([ponto(x0,d0,h),ponto(x1,d0,h),ponto(x1,d1,h),ponto(x0,d1,h)],cor,extra);
  const bloco=(x0,x1,d0,d1,h0,h1,cores)=>{
    const y0=borda+sinal*d0,y1=borda+sinal*d1;
    return caixa(x0,Math.min(y0,y1),x1,Math.max(y0,y1),z+h0,z+h1,...cores);
  };
  const de=luxo?-49:-41,ate=-de,n=luxo?8:6,passo=(ate-de)/n;
  const topo=luxo?6.4:5.8,dentro=-4.7,fora=2.65;
  const estrutura=luxo?'#344A4B':'#627881',pisoClaro=luxo?'#E5DDC9':'#CCD4CF';
  let s=bloco(de-.65,ate+.65,dentro-.35,fora+.55,-.35,.22,[pisoClaro,'#93A4A1','#70857F']);
  // Mãos francesas ligam o pequeno balanço à parede do estádio.
  for(let i=0;i<=n;i++){
    const x=de+i*passo;
    s+=traco([ponto(x,.06,-2.3),ponto(x,fora+.1,-.25),ponto(x,.06,-.25)],'#718780',.38);
  }
  for(let i=0;i<n;i++){
    const x0=de+i*passo+.22,x1=de+(i+1)*passo-.22,cx=(x0+x1)/2;
    let sala='';
    // Fundo claro e divisórias permitem ler cada ambiente através do vidro.
    sala+=piso(x0,x1,dentro,fora,.25,noite?'#E4CC91':pisoClaro);
    sala+=face(x0,x1,dentro,.25,topo,noite?'#FFD172':luxo?'#D9D5BC':'#C9D1C4');
    [x0,x1].forEach(x=>{sala+=bloco(x-.11,x+.11,dentro,fora,.25,topo,[estrutura,estrutura,'#3E5355']);});
    // Sofás, mesa e poltronas em escala, com pés apoiados no piso.
    const cor=luxo?'#9E3B48':'#4C6D6A';
    sala+=bloco(x0+.65,x0+3.45,dentro+.8,dentro+2.25,.25,.7,['#6E7870','#4B5C55','#3D514A']);
    sala+=bloco(x0+.55,x0+3.55,dentro+.65,dentro+2.35,.7,1.25,[cor,'#73313E','#532C36']);
    sala+=bloco(x0+.55,x0+3.55,dentro+.65,dentro+1.1,1.25,2.05,[cor,'#73313E','#532C36']);
    sala+=bloco(cx-.12,cx+.12,-.1,.14,.25,1.1,['#879B98','#617D7A','#496762']);
    sala+=bloco(cx-1.25,cx+1.25,-.8,.85,1.1,1.28,[luxo?'#F2E8CE':'#B1C1B6','#92AAA2','#6E8980']);
    [x1-2.9,x1-1.2].forEach(x=>{
      sala+=bloco(x-.46,x+.46,.9,1.9,.25,.7,['#89948A','#566E65','#435E55']);
      sala+=bloco(x-.5,x+.5,.83,1.85,.7,1.12,[luxo?'#CFB992':'#829D8C','#8E846C','#6E7664']);
      sala+=bloco(x-.5,x+.5,1.55,1.9,1.12,1.85,[luxo?'#CFB992':'#829D8C','#8E846C','#6E7664']);
    });
    if(luxo){
      sala+=bloco(x1-1.35,x1-.65,dentro+.8,dentro+1.5,.25,.85,['#E2D8BC','#ACB8A5','#8A9A8B']);
      sala+=bloco(x1-1.4,x1-.6,dentro+.75,dentro+1.55,.85,1.75,['#6E9068','#527951','#3C6243']);
      sala+=face(x0+.4,x1-.4,dentro+.03,topo-.4,topo-.2,noite?'#FFF2B3':'#DBCEA2');
    }
    // Vidros nas duas fachadas: o camarote olha para o campo e para o entorno.
    [dentro-.025,fora+.025].forEach(d=>{
      sala+=face(x0+.12,x1-.12,d,.7,topo-.12,noite?'#FFD47D':'#83B8C8',' fill-opacity="'+(noite?'.23':'.38')+'"');
      sala+=traco([ponto(cx,d,.7),ponto(cx,d,topo-.12)],estrutura,.14);
      sala+=traco([ponto(x0+.7,d,.85),ponto(x0+2.5,d,topo-.35)],noite?'#FFF1BD':'#E8FAF9',.22,.4);
      sala+=face(x0,x1,d,.3,.65,estrutura);
      sala+=traco([ponto(x0,d,topo-.08),ponto(x1,d,topo-.08)],luxo?'#D5C491':'#D5DDCF',.15,.9);
    });
    sala+=piso(x0,x1,dentro-.1,fora+.18,topo+.12,luxo?'#3D5553':'#AEBDB6');
    if(luxo)sala+=piso(x0+1,x1-1,dentro+.8,fora-.6,topo+.14,'#8CAFAE',' fill-opacity=".45"');
    sala+=face(x0-.05,x1+.05,fora+.2,topo-.05,topo+.18,luxo?'#C7B783':'#D7DFD5');
    s+='<g data-camarote-sala="'+(i+1)+'">'+sala+'</g>';
  }
  s+=face(de-.6,ate+.6,fora+.56,-.26,.06,luxo?'#D0BA84':'#B73946');
  if(luxo)s+=traco([ponto(de-.6,fora+.58,-.38),ponto(ate+.6,fora+.58,-.38)],'#314B48',.22);
  return '<g data-camarotes="'+nivel+'" data-camarotes-setor="'+setor+'" data-camarotes-luz="'+(noite?'acesa':'natural')+'">'+s+'</g>';
}
/** A faixa vista da arquibancada e nas cobranças acompanha a obra comprada. */
function camarotesFundoJogo(){
  if(!temCamarotes())return '';
  const luxo=nivelDaObra('camarotes')>=2,noite=ambienteEstadioAtual().periodo==='noite',n=luxo?8:6;
  let s='<path d="M45 206Q450 160 855 206V236Q450 192 45 236Z" fill="#344E49" stroke="#AEBFAD" stroke-width="2"/>';
  for(let i=0;i<n;i++){
    const x=51+i*798/n,w=798/n-5,y=205-39*Math.sin(Math.PI*(x+w/2)/900);
    s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="22" rx="1" fill="'+(noite?'#E5D39C':luxo?'#ACC7BE':'#86ADB1')+'"/><path d="M'+(x+w*.48)+' '+y+'v22" stroke="#45615C" stroke-width="2"/>';
    if(luxo)s+='<path d="M'+(x+5)+' '+(y+16)+'h'+(w-10)+'" stroke="#9C5660" stroke-width="4"/>';
  }
  return '<g data-camarotes-vista="'+nivelDaObra('camarotes')+'">'+s+'</g>';
}
