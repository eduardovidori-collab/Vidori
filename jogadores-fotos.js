/* Fotografias locais das Lendas. Crédito completo em imagens/jogadores/CREDITOS.html. */
const FOTOS_JOGADORES = {
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
  return '<span class="jogador-retrato '+classe+'" aria-hidden="true" title="'+escapar(j.nome+' · Foto: '+foto.autor+' · '+foto.licenca+' · recorte e remoção de fundo assistidos por IA')+'" style="--foto-x:'+(-foto.coluna*100)+'%;--foto-y:'+(-foto.linha*100)+'%">'+
    '<span class="jogador-foto-reserva">'+escapar(iniciais)+'</span><img src="./imagens/jogadores/lendas-retratos.png?v=140" data-foto-jogador="'+j.id+'" loading="lazy" decoding="async" alt=""></span>';
}
// Os cinco retratos ocupam células quadradas em uma única imagem transparente
// de três colunas por duas linhas. Cada carta mostra apenas sua própria célula.
document.addEventListener('load',e=>{
  if(e.target.matches?.('img[data-foto-jogador]'))e.target.parentElement.classList.add('foto-pronta');
},true);
// Sem dependência de internet na reprodução; se um arquivo falhar, ficam as iniciais.
document.addEventListener('error',e=>{
  if(e.target.matches?.('img[data-foto-jogador]')){
    e.target.hidden=true;e.target.parentElement.classList.remove('foto-pronta');
  }
},true);
