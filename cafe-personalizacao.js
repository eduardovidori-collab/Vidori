/* Objetos do café: prévia temporária e compras em uma única gravação da carteira. */
const OBJETOS_CAFE = [
  {id:'caneca-tricolor',categoria:'caneca',nome:'Tricolor clássica',preco:0,descricao:'A companheira dos primeiros blocos.'},
  {id:'caneca-porcelana',categoria:'caneca',nome:'Porcelana creme',preco:30,descricao:'Cerâmica clara e café bem servido.'},
  {id:'caneca-escudo',categoria:'caneca',nome:'Orgulho tricolor',preco:45,descricao:'Escudo na caneca, clube no coração.'},
  {id:'planta-folhagem',categoria:'planta',nome:'Folhagem da janela',preco:0,descricao:'Um pouco de verde junto à luz.'},
  {id:'planta-suculenta',categoria:'planta',nome:'Suculenta de barro',preco:40,descricao:'Folhas delicadas em um vaso de terracota.'},
  {id:'planta-flor',categoria:'planta',nome:'Vaso florido',preco:60,descricao:'Flores claras e um vaso verde esmaltado.'},
  {id:'luz-verde',categoria:'luz',nome:'Pendente verde',preco:0,descricao:'A luz acolhedora do Café do Morumbi.'},
  {id:'luz-cobre',categoria:'luz',nome:'Cobre acetinado',preco:80,descricao:'Metal quente e luz dourada sobre a mesa.'},
  {id:'luz-linho',categoria:'luz',nome:'Cúpula de linho',preco:70,descricao:'Luz macia, quente e espalhada.'}
];
const NOMES_OBJETOS_CAFE={caneca:'Canecas',planta:'Plantas',luz:'Luminárias'};
function normalizarDecoracaoCafe(dados){
  const d=dados&&typeof dados==='object'?dados:{};
  const comprados=OBJETOS_CAFE.filter(o=>o.preco===0||(Array.isArray(d.comprados)&&d.comprados.includes(o.id))).map(o=>o.id);
  const selecionados={};
  for(const categoria of Object.keys(NOMES_OBJETOS_CAFE)){
    const item=OBJETOS_CAFE.find(o=>o.id===d.selecionados?.[categoria]&&o.categoria===categoria&&comprados.includes(o.id));
    selecionados[categoria]=(item||OBJETOS_CAFE.find(o=>o.categoria===categoria&&o.preco===0)).id;
  }
  return {comprados,selecionados,gastas:Number.isSafeInteger(d.gastas)&&d.gastas>=0?d.gastas:0};
}
let previaObjetosCafe=null,categoriaObjetoCafe='caneca',retornoObjetosCafe=null;
function arteObjetoCafe(id){
  const inicio='<svg viewBox="0 0 150 160" aria-hidden="true" focusable="false">';
  if(id.startsWith('caneca')){
    const escudo=id==='caneca-escudo',tricolor=id==='caneca-tricolor';
    return inicio+`<ellipse cx="74" cy="139" rx="60" ry="9" fill="#392c2820"/><ellipse cx="70" cy="130" rx="54" ry="12" fill="#d9cdb4"/><ellipse cx="70" cy="127" rx="47" ry="8" fill="#f5ead4"/><path d="M112 64c40-3 30 44-3 38" fill="none" stroke="${escudo?'#c4b18d':'#e4d8bd'}" stroke-width="13"/><path d="M29 60h84l-6 47q-4 23-72 0Z" fill="${escudo?'#ebe5d6':'#f6e8ca'}" stroke="#bba98a" stroke-width="1.4"/><path d="M36 65v37q1 10 10 12" fill="none" stroke="#fff9e7" stroke-width="5" opacity=".65"/>${tricolor?'<path d="M32 83h78v9H33Z" fill="#a83c37"/><path d="M33 98h76v6H34Z" fill="#293b32"/>':escudo?'<path d="M54 73h36v26l-18 18-18-18Z" fill="#faf4e9" stroke="#655442"/><path d="M57 76h30v9H57Z" fill="#262b28"/><text x="72" y="83" font-size="7" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="800">SPFC</text><path d="M58 88h12v20l-12-12Z" fill="#af393b"/><path d="M74 88h12v8l-12 12Z" fill="#282d29"/>':'<path d="M44 91q26 11 55 0" fill="none" stroke="#c1a47b" stroke-width="2"/>'}<ellipse cx="71" cy="60" rx="42" ry="11" fill="#d2bea0"/><ellipse cx="71" cy="60" rx="35" ry="8" fill="#573b2a"/><path d="M53 60q17-10 33 0-16 9-26 0 10-4 17 0" fill="none" stroke="#d7b88b" stroke-width="2"/><g class="cafe-vapor" fill="none" stroke="#f5e4c5" stroke-width="3"><path d="M58 42c-14-18 12-18 0-34M79 39c-11-15 12-18 2-32"/></g></svg>`;
  }
  if(id.startsWith('planta')){
    let folhas='';
    if(id==='planta-suculenta'){
      for(let i=0;i<9;i++)folhas+=`<ellipse cx="75" cy="77" rx="14" ry="37" fill="${i%2?'#718c69':'#9caf89'}" stroke="#547454" stroke-width="1" transform="rotate(${i*40} 75 104)"/>`;
    }else if(id==='planta-flor'){
      folhas='<path d="M74 111 66 41m9 67 24-60m-25 62-26-42" stroke="#57724d" stroke-width="3" fill="none"/><path d="M72 89q-40-35-36-8 5 16 36 8m5-10q32-25 33-9-7 17-33 9" fill="#718e5c"/>';
      [[65,37],[101,43],[45,64]].forEach(([x,y])=>{for(let i=0;i<5;i++)folhas+=`<ellipse cx="${x}" cy="${y-8}" rx="6" ry="10" fill="#f0e8cc" stroke="#c2bda0" stroke-width=".6" transform="rotate(${i*72} ${x} ${y})"/>`;folhas+=`<circle cx="${x}" cy="${y}" r="5" fill="#b89754"/>`;});
    }else{
      folhas='<path d="M74 114V31" stroke="#526f48" stroke-width="4"/>';
      [[-34,25,52],[26,-25,60],[-8,0,78],[48,35,42],[-53,45,40]].forEach(([a,x,h],i)=>{folhas+=`<path d="M75 112q${x-25} ${-h} 0 ${-h} 28 8 0 ${h}Z" fill="${i%2?'#8b9e6d':'#58764e'}" stroke="#486644" stroke-width=".8" transform="rotate(${a} 75 112)"/>`;});
    }
    return inicio+`<ellipse cx="76" cy="149" rx="43" ry="7" fill="#3b382327"/>${folhas}<ellipse cx="75" cy="111" rx="35" ry="10" fill="#665539"/><path d="M40 110h70l-9 35q-26 11-52 0Z" fill="${id==='planta-flor'?'#557b65':'#b17b5c'}" stroke="${id==='planta-flor'?'#3f614f':'#895b43'}" stroke-width="2"/><path d="M47 119h56" stroke="#ecd0a1" stroke-width="3" opacity=".5"/></svg>`;
  }
  const cobre=id==='luz-cobre',linho=id==='luz-linho';
  return inicio+`<path d="M75 0v54" stroke="#494b3e" stroke-width="3"/><path d="M43 91h65l24 61H18Z" fill="${cobre?'#f2c87a25':'#f8e9bc20'}"/><ellipse cx="75" cy="148" rx="57" ry="9" fill="#ffe8aa20"/><path d="${linho?'M48 52h54l23 42H25Z':'M24 92q0-74 102 0Z'}" fill="${linho?'#e7d8b9':cobre?'#ad7753':'#486553'}" stroke="${linho?'#b4a17c':cobre?'#78503d':'#304d3c'}" stroke-width="2"/>${linho?'<path d="m50 55-13 35m29-35-4 35m20-35 4 35m11-35 15 35" stroke="#bcaa863f" stroke-width="2"/>':'<path d="M37 81q8-32 36-36" stroke="#fff3cd" stroke-width="3" opacity=".35" fill="none"/>'}<ellipse cx="75" cy="93" rx="${linho?49:51}" ry="7" fill="#f4d59b"/><ellipse cx="75" cy="93" rx="18" ry="4" fill="#fff0c6"/></svg>`;
}
function renderObjetosCafe(){
  const sala=document.querySelector('.cafe-sala');if(!sala)return;
  const d=normalizarDecoracaoCafe(loja.decoracaoCafe),objetos=previaObjetosCafe||d.selecionados;
  for(const [categoria,seletor] of Object.entries({caneca:'.cafe-caneca',planta:'.cafe-planta',luz:'.cafe-luminaria'})){
    const el=sala.querySelector(seletor);el.removeAttribute('aria-hidden');
    const arte=arteObjetoCafe(objetos[categoria]);
    el.innerHTML='<button type="button" class="cafe-objeto-acao" data-cafe-categoria="'+categoria+'" aria-label="Personalizar '+NOMES_OBJETOS_CAFE[categoria].toLowerCase()+'">'+(categoria==='luz'?arte.replace('viewBox="0 0 150 160"','viewBox="0 -70 150 230"').replace('M75 0v54','M75 -70v124'):arte)+'</button>';
    el.dataset.objetoCafe=objetos[categoria];
  }
  sala.dataset.luzCafe=objetos.luz;sala.classList.toggle('cafe-em-previa',!!previaObjetosCafe);
}
function abrirPersonalizacaoCafe(categoria='caneca'){
  if(!cafeDisponivel())return false;
  categoriaObjetoCafe=Object.hasOwn(NOMES_OBJETOS_CAFE,categoria)?categoria:'caneca';
  retornoObjetosCafe=document.activeElement;
  previaObjetosCafe={...normalizarDecoracaoCafe(loja.decoracaoCafe).selecionados};
  const dialog=document.querySelector('#personalizarCafe');if(!dialog.open)dialog.showModal();
  renderCatalogoObjetosCafe();dialog.querySelector('[data-cafe-aba="'+categoriaObjetoCafe+'"]').focus();return true;
}
function renderCatalogoObjetosCafe(){
  const d=normalizarDecoracaoCafe(loja.decoracaoCafe),saldo=saldoDinheiro();
  document.querySelector('#saldoObjetosCafe').textContent='Seu saldo: '+formatarDinheiro(saldo);
  document.querySelectorAll('[data-cafe-aba]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cafeAba===categoriaObjetoCafe)));
  document.querySelector('#catalogoObjetosCafe').innerHTML=OBJETOS_CAFE.filter(o=>o.categoria===categoriaObjetoCafe).map(o=>{
    const tem=d.comprados.includes(o.id),emUso=d.selecionados[o.categoria]===o.id,previa=previaObjetosCafe?.[o.categoria]===o.id;
    return '<article class="cafe-peca'+(previa?' previa':'')+'"><button type="button" class="cafe-peca-arte" data-cafe-preview="'+o.id+'" aria-pressed="'+previa+'" aria-label="Experimentar '+o.nome+'">'+arteObjetoCafe(o.id)+'</button><span class="cafe-peca-selo">'+(emUso?'Na sua mesa':tem?'Seu acervo':formatarDinheiro(o.preco))+'</span><h3>'+o.nome+'</h3><p>'+o.descricao+'</p><button type="button" class="btn" data-cafe-adquirir="'+o.id+'"'+(emUso||(!tem&&saldo<o.preco)?' disabled':'')+'>'+(emUso?'Em uso':tem?'Usar na mesa':'Comprar · '+formatarDinheiro(o.preco))+'</button></article>';
  }).join('');
  renderObjetosCafe();
}
function adquirirObjetoCafe(id){
  const item=OBJETOS_CAFE.find(o=>o.id===id);if(!item||!cafeDisponivel()||!document.querySelector('#personalizarCafe').open)return false;
  const d=normalizarDecoracaoCafe(loja.decoracaoCafe),tem=d.comprados.includes(id);
  if(d.selecionados[item.categoria]===id)return false;
  if(!tem&&saldoDinheiro()<item.preco){document.querySelector('#avisoObjetosCafe').textContent='Faltam '+formatarDinheiro(item.preco-saldoDinheiro())+' para esta peça.';return false;}
  const gastas=d.gastas+(tem?0:item.preco);if(!Number.isSafeInteger(gastas))return false;
  const proximo={...loja,decoracaoCafe:{comprados:tem?d.comprados:[...d.comprados,id],selecionados:{...d.selecionados,[item.categoria]:id},gastas}};
  if(!Armazem.gravar(CHAVES.loja,proximo)){document.querySelector('#avisoObjetosCafe').textContent='Não consegui salvar. Suas peças e seu dinheiro foram mantidos.';return false;}
  loja=proximo;previaObjetosCafe={...proximo.decoracaoCafe.selecionados};
  renderLoja();renderCatalogoObjetosCafe();
  document.querySelector('#avisoObjetosCafe').textContent=item.nome+(tem?' escolhida para sua mesa.':' comprada. Ela já está na sua mesa!');
  document.querySelector('[data-cafe-preview="'+id+'"]').focus({preventScroll:true});return true;
}
function iniciarPersonalizacaoCafe(){
  const painel=document.querySelector('#painel-cafe');
  painel.querySelector('.cafe-cabecalho-acoes').insertAdjacentHTML('afterbegin','<button type="button" class="btn cafe-personalizar" data-personalizar-cafe>Personalizar meu café</button>');
  painel.insertAdjacentHTML('beforeend',`<dialog id="personalizarCafe" class="cafe-personalizacao" aria-labelledby="tituloObjetosCafe"><header><div><span class="cafe-sobretitulo">PEQUENAS ESCOLHAS, SEU PRÓPRIO CAFÉ</span><h2 id="tituloObjetosCafe">Uma mesa com a sua cara</h2><p>Experimente na cena. As peças compradas ficam no seu acervo.</p></div><button type="button" class="btn" id="fecharObjetosCafe">Concluir</button></header><p id="saldoObjetosCafe"></p><div class="cafe-pecas-abas" role="group" aria-label="Tipos de objetos">${Object.entries(NOMES_OBJETOS_CAFE).map(([id,nome])=>'<button type="button" class="btn" data-cafe-aba="'+id+'">'+nome+'</button>').join('')}</div><div id="catalogoObjetosCafe"></div><p id="avisoObjetosCafe" role="status" aria-live="polite">A prévia é temporária até você comprar ou escolher Usar na mesa.</p><button type="button" class="btn cafe-ver-previa" id="verPreviaCafe">Ver a prévia na cafeteria</button></dialog>`);
  painel.addEventListener('click',e=>{
    if(e.target.closest('[data-personalizar-cafe]'))abrirPersonalizacaoCafe();
    const objeto=e.target.closest('[data-cafe-categoria]');if(objeto)abrirPersonalizacaoCafe(objeto.dataset.cafeCategoria);
    const aba=e.target.closest('[data-cafe-aba]');if(aba){categoriaObjetoCafe=aba.dataset.cafeAba;renderCatalogoObjetosCafe();}
    const previa=e.target.closest('[data-cafe-preview]');if(previa){const item=OBJETOS_CAFE.find(o=>o.id===previa.dataset.cafePreview);if(item){previaObjetosCafe[item.categoria]=item.id;renderCatalogoObjetosCafe();document.querySelector('#avisoObjetosCafe').textContent='Prévia de '+item.nome+'. Escolha Comprar ou Usar na mesa para manter.';document.querySelector('[data-cafe-preview="'+item.id+'"]').focus({preventScroll:true});}}
    const compra=e.target.closest('[data-cafe-adquirir]');if(compra)adquirirObjetoCafe(compra.dataset.cafeAdquirir);
  });
  const dialog=document.querySelector('#personalizarCafe');
  document.querySelector('#fecharObjetosCafe').addEventListener('click',()=>dialog.close());
  document.querySelector('#verPreviaCafe').addEventListener('click',()=>{dialog.classList.toggle('cafe-dialogo-compacto');document.querySelector('#verPreviaCafe').textContent=dialog.classList.contains('cafe-dialogo-compacto')?'Voltar ao catálogo':'Ver a prévia na cafeteria';});
  dialog.addEventListener('close',()=>{previaObjetosCafe=null;dialog.classList.remove('cafe-dialogo-compacto');document.querySelector('#verPreviaCafe').textContent='Ver a prévia na cafeteria';renderObjetosCafe();const retorno=retornoObjetosCafe?.isConnected?retornoObjetosCafe:document.querySelector('[data-cafe-categoria="'+categoriaObjetoCafe+'"]');retorno?.focus({preventScroll:true});});
  renderObjetosCafe();
}
