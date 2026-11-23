/* Uma apresentação compartilhada pelo álbum e pela revelação dos pacotes. */
let sequenciaArteCarta=0;
const CONTORNO_CARTA='M150 6 178 23 204 12 254 35 280 43 282 115 290 296Q291 340 267 356L150 423 33 356Q9 340 10 296L18 115 20 43 46 35 96 12 122 23Z';
function molduraDaCarta(){
  const id='carta-arte-'+(++sequenciaArteCarta);
  return `<svg class="carta-futebol-moldura" viewBox="0 0 300 430" aria-hidden="true"><defs>
    <linearGradient id="${id}-metal" x2=".8" y2="1"><stop stop-color="var(--metal-luz)"/><stop offset=".19" stop-color="var(--metal-sombra)"/><stop offset=".33" stop-color="var(--metal-luz)"/><stop offset=".57" stop-color="var(--metal)"/><stop offset=".8" stop-color="var(--metal-luz)"/><stop offset="1" stop-color="var(--metal-sombra)"/></linearGradient>
    <linearGradient id="${id}-papel" x2=".3" y2="1"><stop stop-color="var(--papel-luz)"/><stop offset=".5" stop-color="var(--papel)"/><stop offset="1" stop-color="var(--papel-baixo)"/></linearGradient>
    <linearGradient id="${id}-faixa" x2="0" y2="1"><stop stop-color="var(--papel-luz)"/><stop offset=".55" stop-color="var(--papel)"/><stop offset="1" stop-color="var(--papel-baixo)"/></linearGradient>
    <clipPath id="${id}-recorte"><path d="${CONTORNO_CARTA}" transform="translate(13.5 19.35) scale(.91)"/></clipPath>
    <pattern id="${id}-textura" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M1 1h.7M4 4h.5" stroke="#5D4938" stroke-width=".45" opacity=".13"/></pattern>
    </defs><path d="${CONTORNO_CARTA}" fill="url(#${id}-metal)" stroke="var(--metal-sombra)" stroke-width="1.2"/>
    <path d="${CONTORNO_CARTA}" transform="translate(3 4.3) scale(.98)" fill="none" stroke="var(--metal-luz)" stroke-width=".8"/>
    <path d="${CONTORNO_CARTA}" transform="translate(7.5 10.75) scale(.95)" fill="var(--borda-interna)" stroke="var(--metal-sombra)" stroke-width="1.2"/>
    <path d="${CONTORNO_CARTA}" transform="translate(13.5 19.35) scale(.91)" fill="url(#${id}-papel)" stroke="var(--metal-luz)" stroke-width="1"/>
    <g clip-path="url(#${id}-recorte)"><path d="M-20 250 320 68v29L-20 279Z" fill="var(--faixa-vermelha)"/><path d="M-20 285 320 103v17L-20 302Z" fill="#FFFCED" opacity=".85"/><path d="M-20 308 320 126v31L-20 339Z" fill="var(--faixa-escura)"/>
    <path d="M0 270h300v160H0Z" fill="url(#${id}-papel)"/>
    <rect width="300" height="430" fill="url(#${id}-textura)"/>
    <path d="M12 246Q150 238 288 246v40H12Z" fill="url(#${id}-faixa)" stroke="var(--metal)" stroke-width=".8"/>
    <path d="M150 299v55" stroke="var(--metal)" stroke-width=".65"/>
    <path d="m103 368 94 0 10 11-10 11h-94l-10-11Z" fill="var(--selo-fundo)" stroke="var(--metal)" stroke-width="1"/>
    <g stroke="var(--metal)" stroke-width=".7" fill="var(--metal)"><path d="M76 348Q79 364 100 374m-19-15q-10-2-9-10 8 3 9 10m7 8q-10-1-11-9 9 1 11 9m7 5q-10 2-13-5 9-1 13 5" transform="translate(15 10)"/><path d="M76 348Q79 364 100 374m-19-15q-10-2-9-10 8 3 9 10m7 8q-10-1-11-9 9 1 11 9m7 5q-10 2-13-5 9-1 13 5" transform="translate(285 10) scale(-1 1)"/></g>
    </g></svg>`;
}
function bandeiraDaCarta(j){
  const n=nacionalidadeDoJogador(j);
  let s='';
  if(n.codigo==='BR')s='<path fill="#177748" d="M0 0h32v22H0z"/><path fill="#F3D461" d="m16 2 13 9-13 9L3 11Z"/><circle cx="16" cy="11" r="6.3" fill="#244582"/><path d="M10.5 9.1q6 .1 11.3 4" stroke="#F7F2D8" stroke-width="1" fill="none"/><g fill="#FAF6E6"><circle cx="14" cy="12" r=".4"/><circle cx="17" cy="14" r=".4"/><circle cx="19" cy="10" r=".4"/></g>';
  else if(n.codigo==='AR')s='<path fill="#80B8DA" d="M0 0h32v22H0z"/><path fill="#FFFBEF" d="M0 7.3h32v7.4H0z"/><circle cx="16" cy="11" r="2.1" fill="#D8AB4D"/>';
  else if(n.codigo==='UY')s='<path fill="#FFFBEF" d="M0 0h32v22H0z"/><path stroke="#3268A0" stroke-width="2.45" d="M0 3.7h32M0 8.6h32M0 13.5h32M0 18.4h32"/><path fill="#FFFBEF" d="M0 0h13v12.2H0z"/><path fill="#D9AB41" d="m6.5 1.6 1 2.4 2.5-.5-1 2.3 2 1.3-2.5.5.1 2.6-2.1-1.5-2.1 1.5.1-2.6-2.5-.5 2-1.3-1-2.3 2.5.5Z"/>';
  else if(n.codigo==='CO'||n.codigo==='EC'){
    s='<path fill="#E8C650" d="M0 0h32v22H0z"/><path fill="#244C93" d="M0 11h32v5.5H0z"/><path fill="#B8323B" d="M0 16.5h32V22H0z"/>';
    if(n.codigo==='EC')s+='<path d="M11 7q5-4 10 0l-5 2Z" fill="#5C4936"/><ellipse cx="16" cy="11.2" rx="2.8" ry="4" fill="#D3AE4C"/><ellipse cx="16" cy="11" rx="1.8" ry="2.6" fill="#7FABB8"/>';
  }else if(n.codigo==='PE')s='<path fill="#B92F40" d="M0 0h32v22H0z"/><path fill="#FFFBEF" d="M10.7 0h10.6v22H10.7z"/>';
  else if(n.codigo==='PY')s='<path fill="#B63443" d="M0 0h32v22H0z"/><path fill="#FFFBEF" d="M0 7.3h32v7.4H0z"/><path fill="#294D92" d="M0 14.7h32V22H0z"/><circle cx="16" cy="11" r="2.6" fill="none" stroke="#4E7954" stroke-width=".7"/><circle cx="16" cy="11" r="1" fill="#D4AD43"/>';
  return '<svg class="carta-futebol-bandeira" viewBox="0 0 32 22" role="img" aria-label="'+n.nome+'"><title>'+n.nome+'</title>'+s+'</svg>';
}
function escudoDaCarta(){
  return '<svg class="carta-futebol-escudo" viewBox="0 0 42 47" aria-hidden="true"><path d="M1 1h40v25L21 46 1 26Z" fill="#FDFBF1" stroke="var(--metal-sombra)" stroke-width="1"/><path d="M4 4h34v13H4Z" fill="#252424"/><text x="21" y="14" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="900" fill="#FFF">SPFC</text><path d="M4 20h15v20L4 25Z" fill="#B92F37"/><path d="M23 20h15v5L23 40Z" fill="#242323"/></svg>';
}
function cartaDoJogador(j,opcoes={}){
  const {modo='album',numero=0,quantidade=1,obtida=true,nota='',venda=null}=opcoes;
  const r=raridadeDoJogador(j),album=modo==='album';
  const foto=obtida?fotoDoJogador(j):'';
  const nomeId=(album?'albumNome-':'pacoteNome-')+j.id;
  const atributos=atributosDoJogador(j);
  const dados=[0,3,1,4,2,5].map(i=>atributos[i]).filter(Boolean);
  const acaoVenda=venda?(venda.vendida?'<p class="carta-venda-concluida" role="status">✓ Repetido vendido</p>':`<button type="button" class="btn carta-venda-pacote" data-pacote-vender="${j.id}" data-pacote-quantidade="${quantidade}" aria-label="Vender a cópia repetida de ${escapar(j.nome)} por ${venda.valor} moedas">Vender repetido · +${venda.valor} moedas</button>`):'';
  const meta=album?`<div class="carta-futebol-colecao"><span class="album-numero">Nº ${String(numero).padStart(3,'0')}</span>${quantidade>1?`<span class="album-copias">+${quantidade-1} extra${quantidade>2?'s':''}</span>`:''}<span class="album-selo">${obtida?'✓ No álbum':'A conquistar'}</span></div>`:`<p class="carta-repetida">${escapar(nota)}</p>${acaoVenda}`;
  return `<article class="carta-futebol ${album?'album-figurinha':'carta-revelada'} raridade-${r.id} ${obtida?'obtida':'faltante'}${foto?' com-foto':''}" ${album?`data-album-jogador="${j.id}" data-obtida="${obtida}"`:''} aria-labelledby="${nomeId}">
    <div class="carta-futebol-corpo">${molduraDaCarta()}
      <div class="carta-futebol-nota"><b>${j.ovr}</b><span>${escapar(j.posicao)}</span></div>
      ${bandeiraDaCarta(j)}${escudoDaCarta()}
      <div class="carta-futebol-retrato" aria-hidden="true">${foto||`<div class="carta-futebol-camisa">${camisaDoTime()}${obtida?'':'<span>?</span>'}</div>`}</div>
      <h5 class="carta-futebol-nome" id="${nomeId}" style="--nome-tamanho:${j.nome.length>19?'5.2':j.nome.length>15?'5.8':'6.7'}cqw">${escapar(j.nome)}</h5>
      ${posicoesDoJogador(j).length>1?`<span class="carta-futebol-outras-posicoes">${escapar(rotuloPosicoes(j))}</span>`:''}
      <div class="carta-futebol-atributos" aria-label="Atributos de ${escapar(j.nome)}">${dados.map(a=>`<span><b>${a.valor}</b><abbr title="${a.nome}">${a.sigla}</abbr></span>`).join('')}</div>
      <span class="carta-futebol-raridade">${r.nome}</span><span class="carta-futebol-marca">COPEIRO</span>
    </div>${meta}</article>`;
}
