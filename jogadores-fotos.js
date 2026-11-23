/* Fotografias locais de todo o elenco. Crédito completo em imagens/jogadores/CREDITOS.html. */
const FOTOS_JOGADORES = {
  ...FOTOS_ELENCO,
  'rogerio-ceni': {coluna:0,linha:0,autor:'Ramthum',licenca:'CC BY-SA 4.0'},
  rai: {coluna:1,linha:0,autor:'Wilson Dias/ABr',licenca:'CC BY 3.0 BR'},
  kaka: {coluna:2,linha:0,autor:'José Cruz/ABr · recorte de Tales.ebner',licenca:'CC BY 3.0 BR'},
  cafu: {coluna:0,linha:1,autor:'Valter Campanato/Agência Brasil',licenca:'CC BY 3.0 BR'},
  'serginho-chulapa': {coluna:1,linha:1,autor:'Olimor',licenca:'Domínio público'}
};
function fotoDoJogador(j,classe=''){
  const foto=j&&FOTOS_JOGADORES[j.id];
  if(!foto)return '';
  const iniciais=j.nome.split(/\s+/).slice(0,2).map(n=>n[0]).join('');
  const arquivo=foto.arquivo||'lendas-retratos.png';
  const tratamento=foto.tratamento||!foto.arquivo;
  const credito=j.nome+' · Foto: '+foto.autor+' · '+foto.licenca+(tratamento?' · recorte e remoção de fundo assistidos por IA':'');
  const estilo=foto.individual?'--foto-largura:100%;--foto-altura:100%;--foto-x:0%;--foto-y:0%':'--foto-x:'+(-foto.coluna*100)+'%;--foto-y:'+(-foto.linha*100)+'%';
  return '<span class="jogador-retrato '+classe+'" aria-hidden="true" title="'+escapar(credito)+'" style="'+estilo+'">'+
    '<span class="jogador-foto-reserva">'+escapar(iniciais)+'</span><img src="./imagens/jogadores/'+arquivo+'?v='+(foto.arquivo?'142':'140')+'" data-foto-jogador="'+j.id+'" loading="lazy" decoding="async" alt=""></span>';
}
// Retratos individuais e atlas compartilham o mesmo enquadramento nas cartas.
document.addEventListener('load',e=>{
  if(e.target.matches?.('img[data-foto-jogador]'))e.target.parentElement.classList.add('foto-pronta');
},true);
// Sem dependência de internet na reprodução; se um arquivo falhar, ficam as iniciais.
document.addEventListener('error',e=>{
  if(e.target.matches?.('img[data-foto-jogador]')){
    e.target.hidden=true;e.target.parentElement.classList.remove('foto-pronta');
  }
},true);
