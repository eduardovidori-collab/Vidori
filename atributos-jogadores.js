/* Atributos do Copeiro, definidos para cada carta. Não são notas oficiais da EA.
 * Linha: ritmo, finalização, passe, drible, defesa, físico.
 * Goleiros: elasticidade, manejo, reposição, reflexos, velocidade, posicionamento.
 * O OVR do catálogo continua sendo a referência das regras de jogo existentes.
 */
const ATRIBUTOS_JOGADORES = {
  pablo:[60,59,48,55,28,67], orejuela:[69,32,43,52,43,58],
  sidao:[61,49,51,63,39,50], jucilei:[37,40,58,50,64,71],
  jandrei:[65,59,58,68,43,60], 'bruno-alves':[45,31,50,36,69,73],
  ferreirinha:[78,55,52,68,25,48], reinaldo:[59,66,75,64,56,66],
  'joao-rojas':[77,59,57,70,24,50], 'marcos-antonio':[72,57,82,80,65,56],
  'alan-franco':[59,34,58,45,77,78], 'leo-pele':[61,29,51,47,57,64],
  petros:[61,50,67,61,80,79], luciano:[72,85,77,80,35,77],
  erick:[81,61,57,70,28,53], wendell:[62,30,56,53,63,68],
  'igor-vinicius':[81,36,52,61,49,53], liziero:[65,43,67,66,62,60],
  'tche-tche':[70,56,74,72,61,62], sabino:[52,42,48,35,72,80],
  'everton-ribeiro':[63,64,76,78,40,48], rafael:[79,78,65,82,49,78],
  antony:[88,73,77,91,31,61], calleri:[64,85,58,66,36,87],
  dagoberto:[89,86,80,88,31,76], lugano:[65,52,63,43,97,97],
  hernanes:[77,91,95,91,74,83], 'rogerio-ceni':[99,98,100,99,78,100],
  cauly:[65,62,70,74,30,48], nikao:[52,69,70,66,36,75],
  'wellington-rato':[66,67,75,69,41,59], welington:[82,31,57,64,58,62],
  'igor-gomes':[63,49,69,63,51,55], david:[75,53,44,60,30,74],
  maicon:[50,40,63,38,84,88], rai:[83,95,99,97,62,89],
  'luis-fabiano':[80,97,75,86,36,90], luan:[55,39,58,49,80,82],
  'vitor-bueno':[61,64,68,67,30,56], 'lucas-ramon':[73,35,59,57,61,68],
  'eder-militao':[87,41,71,65,88,88], 'alexandre-pato':[84,82,66,82,25,64],
  'david-neres':[86,73,74,86,28,53], 'lucas-moura':[94,83,82,93,37,75],
  'rodrigo-nestor':[65,62,76,70,50,52], casemiro:[69,72,81,74,94,96],
  kaka:[95,95,94,98,42,84], 'tiago-volpi':[68,60,69,70,42,58],
  cueva:[71,65,79,82,25,44], 'enzo-diaz':[73,38,63,60,72,76],
  cafu:[96,72,91,93,94,94], zetti:[96,95,79,97,63,95],
  alisson:[76,55,71,70,76,78], rafinha:[65,44,79,71,79,69],
  mineiro:[80,65,78,73,91,91], junior:[89,65,86,85,83,83],
  osvaldo:[89,67,64,82,25,57], denis:[65,54,43,67,38,54],
  lucao:[47,22,40,32,50,63], 'rodrigo-caio':[67,32,62,54,75,70],
  'gabriel-neves':[58,38,73,64,74,66], hudson:[63,42,58,49,75,77],
  'everton-felipe':[67,43,58,65,24,44], 'luiz-araujo':[86,67,70,81,32,57],
  trellez:[52,54,36,40,25,78], 'aloisio-boi-bandido':[73,77,50,64,32,87],
  toro:[79,49,43,65,22,56], shaylon:[57,56,71,65,28,43],
  'thiago-mendes':[75,58,73,69,74,76], 'bruno-peres':[84,45,60,68,61,67],
  'lucas-perri':[76,67,64,79,44,68], 'nathan-mendes':[73,28,52,55,60,66],
  benitez:[55,65,79,80,27,41], 'caio-paulista':[80,43,53,62,55,71],
  bobadilla:[66,53,66,59,72,77], rigoni:[75,68,68,74,26,56],
  'gabriel-sara':[73,72,82,76,57,65], cortez:[77,33,62,59,72,73],
  nene:[62,85,91,87,28,56], 'waldir-peres':[91,88,65,93,57,90],
  'fabio-aurelio':[79,70,87,78,76,68], miranda:[75,38,67,54,93,88],
  muller:[93,91,85,94,30,77], 'denilson-show':[95,75,83,99,25,68],
  'aloisio-chulapa':[63,79,67,62,35,94], 'serginho-chulapa':[83,98,70,82,39,97]
};
const NOMES_ATRIBUTOS = {
  linha:[['RIT','Ritmo'],['FIN','Finalização'],['PAS','Passe'],['DRI','Drible'],['DEF','Defesa'],['FIS','Físico']],
  goleiro:[['ELA','Elasticidade'],['MAN','Manejo'],['REP','Reposição'],['REF','Reflexos'],['VEL','Velocidade'],['POS','Posicionamento']]
};
const NACIONALIDADES_JOGADORES = {
  orejuela:'CO','joao-rojas':'EC','alan-franco':'AR',calleri:'AR',lugano:'UY',
  cueva:'PE','enzo-diaz':'AR','gabriel-neves':'UY',trellez:'CO',benitez:'AR',
  bobadilla:'PY',rigoni:'AR'
};
function nacionalidadeDoJogador(j){
  const codigo=NACIONALIDADES_JOGADORES[j.id]||'BR';
  return {codigo,nome:{BR:'Brasil',CO:'Colômbia',EC:'Equador',AR:'Argentina',UY:'Uruguai',PE:'Peru',PY:'Paraguai'}[codigo]};
}
function atributosDoJogador(j){
  const valores=ATRIBUTOS_JOGADORES[j.id];
  if(!valores)return [];
  const nomes=NOMES_ATRIBUTOS[j.posicao==='GOL'?'goleiro':'linha'];
  return nomes.map(([sigla,nome],i)=>({sigla,nome,valor:valores[i]}));
}
