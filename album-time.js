/* Álbum do Meu time: uma figurinha por jogador, sempre derivada do elenco. */
const POSICOES_ALBUM = [
  ["GOL","Goleiros"],["LD","Laterais direitos"],["ZAG","Zagueiros"],
  ["LE","Laterais esquerdos"],["VOL","Volantes"],["MC","Meias centrais"],
  ["MEI","Meias armadores"],["PE","Pontas esquerdas"],["PD","Pontas direitas"],["ATA","Atacantes"]
];
const albumDoTimeUI = {visao:"escalacao",pagina:0,porVista:12,busca:"",posicao:"",raridade:"",situacao:"todas",animacao:null};

function textoDeBuscaAlbum(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();
}
function selecionarVisaoDoTime(visao) {
  albumDoTimeUI.visao=visao==="album"?"album":"escalacao";
  const album=albumDoTimeUI.visao==="album";
  document.getElementById("painel-time").dataset.timeModo=albumDoTimeUI.visao;
  document.querySelectorAll("[data-time-visao]").forEach(b=>{
    const ativa=b.dataset.timeVisao===albumDoTimeUI.visao;
    b.setAttribute("aria-selected",String(ativa));b.tabIndex=ativa?0:-1;
  });
  document.getElementById("timeEscalacao").hidden=album;
  document.getElementById("timeAlbum").hidden=!album;
  if(album) renderAlbumDoTime();
}
function cartasFiltradasDoAlbum() {
  const possuidas=new Map(meuTime.jogadores.map(j=>[j.id,j]));
  const busca=textoDeBuscaAlbum(albumDoTimeUI.busca);
  return JOGADORES_SPFC.map((j,i)=>({j,numero:i+1,quantidade:possuidas.get(j.id)?.quantidade||0}))
    .filter(({j,quantidade})=>(!busca||textoDeBuscaAlbum(j.nome).includes(busca))&&
      (!albumDoTimeUI.posicao||jogaNaPosicao(j,albumDoTimeUI.posicao))&&
      (!albumDoTimeUI.raridade||raridadeDoJogador(j)?.id===albumDoTimeUI.raridade)&&
      (albumDoTimeUI.situacao==="todas"||
       albumDoTimeUI.situacao==="obtidas"&&quantidade>0||
       albumDoTimeUI.situacao==="faltantes"&&!quantidade||
       albumDoTimeUI.situacao==="repetidas"&&quantidade>1))
    .sort((a,b)=>POSICOES_ALBUM.findIndex(p=>p[0]===a.j.posicao)-POSICOES_ALBUM.findIndex(p=>p[0]===b.j.posicao)||
      b.j.ovr-a.j.ovr||a.j.nome.localeCompare(b.j.nome,"pt-BR"));
}
function figurinhaDoAlbum({j,numero,quantidade}) {
  const r=raridadeDoJogador(j),obtida=quantidade>0,foto=obtida?fotoDoJogador(j):"";
  const iniciais=j.nome.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase();
  return '<article class="album-figurinha raridade-'+r.id+(obtida?' obtida':' faltante')+(foto?' com-foto':'')+'" data-album-jogador="'+j.id+'" data-obtida="'+obtida+'" aria-labelledby="albumNome-'+j.id+'">'+
    '<div class="album-figurinha-topo"><span class="album-ovr">'+j.ovr+'<small>OVR</small></span><span class="album-numero">Nº '+String(numero).padStart(3,"0")+'</span></div>'+
    '<div class="album-arte" aria-hidden="true"><span class="album-halo"></span>'+(foto||camisaDoTime())+
    '<span class="album-iniciais">'+(obtida?escapar(iniciais):'?')+'</span>'+
    (quantidade>1?'<span class="album-copias">+'+(quantidade-1)+' extra'+(quantidade>2?'s':'')+'</span>':'')+'</div>'+
    '<span class="album-posicao">'+escapar(rotuloPosicoes(j))+'</span><h5 id="albumNome-'+j.id+'">'+escapar(j.nome)+'</h5>'+
    '<span class="album-raridade">'+r.nome+'</span><span class="album-selo">'+(obtida?'<span aria-hidden="true">✓</span> No álbum':'A conquistar')+'</span></article>';
}
function paginaDoAlbum(cartas,numero) {
  const posicoes=[...new Set(cartas.map(c=>c.j.posicao))];
  const capitulo=posicoes.map(sigla=>POSICOES_ALBUM.find(p=>p[0]===sigla)?.[1]||sigla).join(" · ");
  return '<section class="album-pagina" aria-label="Página '+numero+'"><div class="album-pagina-cabecalho"><span>'+escapar(capitulo)+'</span><i aria-hidden="true"></i></div>'+
    '<div class="album-grade">'+cartas.map(figurinhaDoAlbum).join("")+'</div><div class="album-pagina-rodape"><span>'+escapar(meuTime.nome)+'</span><b>'+String(numero).padStart(2,"0")+'</b></div></section>';
}
function renderAlbumDoTime() {
  const ids=new Set(meuTime.jogadores.map(j=>j.id));
  const total=JOGADORES_SPFC.length,obtidas=JOGADORES_SPFC.filter(j=>ids.has(j.id)).length;
  const extras=meuTime.jogadores.reduce((s,j)=>s+Math.max(0,j.quantidade-1),0);
  document.getElementById("timeAlbumContagem").textContent=obtidas+"/"+total;
  document.getElementById("albumPossuidas").textContent=obtidas;
  document.getElementById("albumTotal").textContent=total;
  document.getElementById("albumFaltantes").textContent=total-obtidas;
  document.getElementById("albumExtras").textContent=extras;
  const porcentagem=total?Math.round(obtidas/total*100):0;
  const progresso=document.getElementById("albumProgresso");
  progresso.value=obtidas;progresso.max=Math.max(1,total);
  progresso.textContent=porcentagem+"%";
  document.getElementById("albumPorcentagem").textContent=porcentagem+"%";
  document.getElementById("albumMensagem").textContent=obtidas===total&&total
    ?"Coleção completa. Todas as camisas têm seu lugar!"
    :obtidas?"As cartas dos pacotes entram aqui automaticamente.":"Seu álbum começa com os jogadores dos pacotes.";
  if(albumDoTimeUI.visao!=="album") return;
  document.getElementById("albumRaridades").innerHTML=RARIDADES_TIME.map(r=>{
    const cartas=JOGADORES_SPFC.filter(j=>raridadeDoJogador(j)?.id===r.id);
    const n=cartas.filter(j=>ids.has(j.id)).length;
    return '<button type="button" class="album-raridade-filtro raridade-'+r.id+'" data-album-raridade="'+r.id+'" aria-pressed="'+(albumDoTimeUI.raridade===r.id)+'" aria-label="'+r.nome+': '+n+' de '+cartas.length+'. Filtrar raridade."><span>'+r.nome+'</span><strong>'+n+'<small> / '+cartas.length+'</small></strong><i aria-hidden="true" style="--completo:'+(cartas.length?n/cartas.length*100:0)+'%"></i></button>';
  }).join("");
  const cartas=cartasFiltradasDoAlbum(),tamanho=albumDoTimeUI.porVista;
  const vistas=Math.max(1,Math.ceil(cartas.length/tamanho));
  albumDoTimeUI.pagina=Math.max(0,Math.min(albumDoTimeUI.pagina,vistas-1));
  const inicio=albumDoTimeUI.pagina*tamanho;
  const filtrando=!!(albumDoTimeUI.busca.trim()||albumDoTimeUI.posicao||albumDoTimeUI.raridade||albumDoTimeUI.situacao!=="todas");
  document.getElementById("albumLimpar").hidden=!filtrando;
  document.getElementById("albumResultados").textContent=cartas.length+(cartas.length===1?" figurinha":" figurinhas")+(filtrando?" com estes filtros":" no catálogo")+" · "+cartas.filter(c=>c.quantidade>0).length+" no seu álbum";
  const livro=document.getElementById("albumLivro"),primeira=inicio/6+1;
  if(!cartas.length) {
    livro.innerHTML='<div class="album-sem-resultados"><span class="album-vazio-icone" aria-hidden="true">◇</span><h4>Nenhuma figurinha por aqui</h4><p>'+(filtrando?'Tente outro nome ou limpe os filtros para ver o álbum inteiro.':'As figurinhas aparecerão quando houver jogadores no catálogo.')+'</p>'+(filtrando?'<button class="btn btn-pequeno" type="button" data-album-limpar>Limpar filtros</button>':'')+'</div>';
  } else {
    livro.innerHTML=paginaDoAlbum(cartas.slice(inicio,inicio+6),primeira)+
      (tamanho===12&&cartas.length>inicio+6?paginaDoAlbum(cartas.slice(inicio+6,inicio+12),primeira+1):
        tamanho===12?'<div class="album-pagina album-pagina-final" aria-hidden="true"><span class="album-final-escudo escudo"></span><span>Uma coleção.<br>Muitas histórias.</span><i></i></div>':'');
  }
  document.getElementById("albumAnterior").disabled=!cartas.length||albumDoTimeUI.pagina===0;
  document.getElementById("albumProxima").disabled=!cartas.length||albumDoTimeUI.pagina===vistas-1;
  const ultima=Math.ceil(Math.min(inicio+tamanho,cartas.length)/6);
  document.getElementById("albumPaginaStatus").textContent=cartas.length
    ?(primeira===ultima?'Página '+primeira:'Páginas '+primeira+' e '+ultima)+' de '+Math.ceil(cartas.length/6)
    :'Nenhuma página';
}
function limparFiltrosDoAlbum() {
  Object.assign(albumDoTimeUI,{pagina:0,busca:"",posicao:"",raridade:"",situacao:"todas"});
  document.getElementById("albumBusca").value="";
  document.getElementById("albumPosicao").value="";
  document.getElementById("albumSituacao").value="todas";
  renderAlbumDoTime();
  document.getElementById("albumBusca").focus({preventScroll:true});
}
function folhearAlbum(direcao) {
  const tamanho=cartasFiltradasDoAlbum().length;
  const proxima=Math.max(0,Math.min(albumDoTimeUI.pagina+direcao,Math.max(0,Math.ceil(tamanho/albumDoTimeUI.porVista)-1)));
  if(proxima===albumDoTimeUI.pagina) return;
  const peloBotao=["albumAnterior","albumProxima"].includes(document.activeElement?.id);
  albumDoTimeUI.pagina=proxima;renderAlbumDoTime();
  const livro=document.getElementById("albumLivro");
  if(peloBotao) {
    livro.focus({preventScroll:true});
    const cabecalho=document.querySelector(".cabecalho").getBoundingClientRect().height;
    window.scrollTo({top:Math.max(0,window.scrollY+livro.getBoundingClientRect().top-cabecalho-20),
      behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  }
  albumDoTimeUI.animacao?.cancel();
  if(!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    albumDoTimeUI.animacao=livro.animate(
      [{opacity:.6,transform:'translateX('+(direcao*5)+'px)'},{opacity:1,transform:'translateX(0)'}],
      {duration:170,easing:"ease-out"});
  }
}
function iniciarAlbumDoTime() {
  const painel=document.getElementById("painel-time");
  document.getElementById("albumPosicao").innerHTML='<option value="">Todas as posições</option>'+POSICOES_ALBUM.map(([sigla,nome])=>'<option value="'+sigla+'">'+sigla+' · '+nome+'</option>').join("");
  painel.addEventListener("click",e=>{
    const aba=e.target.closest("[data-time-visao]");
    if(aba) selecionarVisaoDoTime(aba.dataset.timeVisao);
    const raridade=e.target.closest("[data-album-raridade]");
    if(raridade) {
      albumDoTimeUI.raridade=albumDoTimeUI.raridade===raridade.dataset.albumRaridade?"":raridade.dataset.albumRaridade;
      albumDoTimeUI.pagina=0;renderAlbumDoTime();
      document.querySelector('[data-album-raridade="'+raridade.dataset.albumRaridade+'"]').focus({preventScroll:true});
    }
    if(e.target.closest("[data-album-limpar]")) limparFiltrosDoAlbum();
  });
  document.getElementById("timeVisoes").addEventListener("keydown",e=>{
    if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key)) return;
    e.preventDefault();
    const visao=e.key==="Home"?"escalacao":e.key==="End"?"album":albumDoTimeUI.visao==="album"?"escalacao":"album";
    selecionarVisaoDoTime(visao);document.querySelector('[data-time-visao="'+visao+'"]').focus();
  });
  for(const [id,chave,evento] of [["albumBusca","busca","input"],["albumPosicao","posicao","change"],["albumSituacao","situacao","change"]]) {
    document.getElementById(id).addEventListener(evento,e=>{
      albumDoTimeUI[chave]=e.target.value;albumDoTimeUI.pagina=0;renderAlbumDoTime();
    });
  }
  document.getElementById("albumAnterior").addEventListener("click",()=>folhearAlbum(-1));
  document.getElementById("albumProxima").addEventListener("click",()=>folhearAlbum(1));
  document.getElementById("albumLivro").addEventListener("keydown",e=>{
    if(e.target!==e.currentTarget||e.altKey||e.ctrlKey||e.metaKey) return;
    if(e.key==="ArrowLeft"||e.key==="ArrowRight") {e.preventDefault();folhearAlbum(e.key==="ArrowRight"?1:-1);}
    // Space on the book must not trigger the application's timer shortcut.
    e.stopPropagation();
  });
  const estreito=matchMedia("(max-width: 760px)");
  function ajustarPaginas() {
    const inicio=albumDoTimeUI.pagina*albumDoTimeUI.porVista;
    albumDoTimeUI.porVista=estreito.matches?6:12;
    albumDoTimeUI.pagina=Math.floor(inicio/albumDoTimeUI.porVista);
    renderAlbumDoTime();
  }
  estreito.addEventListener("change",ajustarPaginas);ajustarPaginas();
}
