/* Fotografias locais das Lendas. Crédito completo em imagens/jogadores/CREDITOS.html. */
const FOTOS_JOGADORES = {
  'rogerio-ceni': {arquivo:'rogerio-ceni.jpg',autor:'Ramthum',licenca:'CC BY-SA 4.0',foco:'58% 8%',zoom:1.12},
  rai: {arquivo:'rai.jpg',autor:'Elza Fiúza/ABr · recorte de Yanguas',licenca:'CC BY 3.0 BR',foco:'50% 12%',zoom:1},
  kaka: {arquivo:'kaka.jpg',autor:'José Cruz/ABr · recorte de Tales.ebner',licenca:'CC BY 3.0 BR',foco:'50% 10%',zoom:1},
  cafu: {arquivo:'cafu.jpg',autor:'Александр Мельников / soccer.ru',licenca:'CC BY-SA 3.0',foco:'50% 0%',zoom:2},
  'serginho-chulapa': {arquivo:'serginho-chulapa.jpg',autor:'Olimor',licenca:'Domínio público',foco:'50% 14%',zoom:1.65}
};
function fotoDoJogador(j,classe=''){
  const foto=j&&FOTOS_JOGADORES[j.id];
  if(!foto)return '';
  const iniciais=j.nome.split(/\s+/).slice(0,2).map(n=>n[0]).join('');
  return '<span class="jogador-retrato '+classe+'" aria-hidden="true" title="'+escapar(j.nome+' · Foto: '+foto.autor+' · '+foto.licenca)+'" style="--foto-foco:'+foto.foco+';--foto-zoom:'+foto.zoom+'">'+
    '<span class="jogador-foto-reserva">'+escapar(iniciais)+'</span><img src="./imagens/jogadores/'+foto.arquivo+'?v=139" data-foto-jogador="'+j.id+'" loading="lazy" decoding="async" alt=""></span>';
}
// Sem dependência de internet na reprodução; se um arquivo falhar, ficam as iniciais.
document.addEventListener('error',e=>{
  if(e.target.matches?.('img[data-foto-jogador]'))e.target.hidden=true;
},true);
