/* Café do Morumbi: uma mesa para o mesmo Pomodoro, sem outra contagem de estudo. */
"use strict";
let cafeRascunho = null, cafeGravacao = null, cafeSujo = false;
let cafeAudio = null, cafeAmbienteAssinatura = "";

function cafeDisponivel(){return temArredores() && nivelDaObra('cafeteria')>=1;}
function abrirProjetoCafe(){
  if(!temArredores()){
    irParaPainel('estadio');
    mostrarAviso('Evolua os arredores para o nível 1 para liberar o canteiro da cafeteria.');
    abrirObrasEstadio('arredores');
  }else{
    if(!document.querySelector('#painel-cafe.ativo'))irParaPainel('estadio');
    abrirObrasEstadio('cafeteria');
  }
}
function apresentacaoObraCafe(){
  const n=nivelDaObra('cafeteria');
  return `<div class="cafe-projeto"><svg viewBox="-27 -23 54 46" role="img" aria-label="${n?'Cafeteria nível '+n:'Canteiro de obras da cafeteria'}">${cafeteriaDoBairro(0,0,n,false)}</svg><div><span class="cafe-sobretitulo">UM CAFÉ QUE CRESCE COM VOCÊ</span><h3>${n?'Portas abertas para o próximo bloco':'Seu futuro cantinho de estudo'}</h3><p>${n?'A mesa, o caderno e todos os sons estão disponíveis. As próximas obras deixam o espaço mais acolhedor.':'O canteiro está pronto. Construa a cafeteria para entrar, estudar junto à janela e ouvir seus ambientes sonoros.'}</p>${n?'<button type="button" class="btn btn-principal" data-entrar-cafe>Entrar para estudar →</button>':''}</div></div>`;
}
function renderAcessoCafe(){
  const aberto=cafeDisponivel(),n=nivelDaObra('cafeteria');
  const convite=document.querySelector('.cafe-convite'),sala=document.querySelector('.cafe-sala');
  if(convite){
    convite.dataset.cafeAberto=String(aberto);
    convite.querySelector('p').textContent=aberto?'Sua mesa junto à janela está pronta. Cafeteria nível '+n+'.':temArredores()?'A cafeteria está em obras. Construa por R$ 200 para estudar aqui.':'Evolua os arredores para o nível 1 e descubra a cafeteria.';
    convite.querySelector('[data-entrar-cafe]').textContent=aberto?'Estudar no café →':temArredores()?'Ver construção · R$ 200':'Conhecer o projeto →';
  }
  if(sala){
    sala.dataset.nivel=String(n);
    document.querySelector('#cafeNivel').textContent='Cafeteria · nível '+n;
  }
  if(!aberto){
    pararSomCafe();
    if(document.querySelector('#painel-cafe.ativo'))irParaPainel('foco');
  }
}

function normalizarCafe(dados) {
  const d = dados && typeof dados === "object" ? dados : {};
  const texto = (v, max) => typeof v === "string" ? v.slice(0, max) : "";
  return {
    versao: 1, objetivo: texto(d.objetivo, 80), notas: texto(d.notas, 4000),
    tarefas: Array.from({length: 3}, (_, i) => ({
      texto: texto(d.tarefas?.[i]?.texto, 180), feita: d.tarefas?.[i]?.feita === true
    })),
    som: ["cafeteria", "chuva", "misto", "natureza", "melodia", "guitarra", "guitarraVariada"].includes(d.som) ? d.som : "cafeteria",
    volume: typeof d.volume === "number" && Number.isFinite(d.volume) ? Math.max(0, Math.min(1, d.volume)) : .45
  };
}
function dadosCafeParaBackup() { return normalizarCafe(cafeRascunho || config.cafe); }
function salvarCafe() {
  clearTimeout(cafeGravacao);
  if (!cafeSujo || !cafeRascunho) return true;
  const proxima = {...config, cafe: dadosCafeParaBackup()};
  const salvo = Armazem.gravar(CHAVES.config, proxima);
  if (salvo) { config = proxima; cafeSujo = false; }
  const status = document.querySelector("#cafeSalvo");
  if (status) status.textContent = salvo ? "Caderno salvo neste navegador" : "Sem espaço para salvar. Exporte um backup para guardar o caderno.";
  return salvo;
}
function agendarCafe() {
  cafeSujo = true;
  document.querySelector("#cafeSalvo").textContent = "Salvando caderno…";
  clearTimeout(cafeGravacao);
  cafeGravacao = setTimeout(salvarCafe, 400);
}
function recarregarCafe() {
  clearTimeout(cafeGravacao); pararSomCafe(); cafeSujo = false;
  cafeRascunho = normalizarCafe(config.cafe);
  const objetivo = document.querySelector("#cafeObjetivo");
  if (!objetivo) return;
  objetivo.value = cafeRascunho.objetivo;
  document.querySelector("#cafeNotas").value = cafeRascunho.notas;
  cafeRascunho.tarefas.forEach((t, i) => {
    document.querySelector("#cafeTarefa" + i).value = t.texto;
    document.querySelector("#cafeFeita" + i).checked = t.feita;
  });
  document.querySelector("#cafeTipoSom").value = cafeRascunho.som;
  document.querySelector("#cafeVolume").value = Math.round(cafeRascunho.volume * 100);
  document.querySelector("#cafeSalvo").textContent = "Caderno salvo neste navegador";
  renderTarefasCafe(); renderTimerCafe(); atualizarSomCafe();
}

function ruaDoCafe() {
  let casas = "", chuva = "";
  const lotes = [[-15,163,132,"#b6ae94"],[127,173,115,"#d8bd97"],[254,145,131,"#b57965"],[397,157,155,"#ded1b3"],[564,175,118,"#a9b29c"],[694,150,139,"#c7a389"],[845,170,130,"#d2c3a3"]];
  lotes.forEach(([x,y,w,cor],i) => {
    casas += `<g><path d="M${x+w} ${y+8}l9 6v162h-9Z" fill="#7f8070"/><rect x="${x}" y="${y}" width="${w}" height="${276-y}" fill="${cor}"/>
      <path d="M${x-5} ${y}l${w/2+5} -15 ${w/2+5} 15Z" fill="${i%2?'#826b59':'#6a776d'}"/><path d="M${x-2} ${y+4}h${w+4}m-${w+4} 49h${w+4}" stroke="#ede0c5" stroke-width="4"/>`;
    for(let c=0;c<3;c++) {
      const wx=x+13+c*(w-20)/3,wy=y+15,ww=(w-35)/3;
      casas += `<rect x="${wx-3}" y="${wy-3}" width="${ww+6}" height="35" rx="2" fill="#e6d9bc"/><rect class="cafe-janela-rua" x="${wx}" y="${wy}" width="${ww}" height="29" style="--luz:${(i+c)%3===0?'#f8d59c':'#4e625a'}"/><path d="M${wx+ww/2} ${wy}v29m${-ww/2} -15h${ww}" stroke="#b7bba1" stroke-width="1.5"/><path d="M${wx-3} ${wy+33}h${ww+6}" stroke="#7d826c" stroke-width="2"/>`;
    }
    const loja=i===2?'LIVRARIA':i===4?'FLORES':i===3?'ARMAZÉM':'';
    casas += `<rect x="${x+10}" y="${y+64}" width="${w-20}" height="${211-y}" fill="#e8d9bc"/><rect x="${x+15}" y="${y+68}" width="${w-30}" height="${203-y}" fill="#4d685c"/><path d="M${x+w*.55} ${y+68}v${203-y}" stroke="#aeb69e" stroke-width="2"/>
      <path d="M${x+8} ${y+60}h${w-16}l6 12H${x+2}Z" fill="${i%2?'#9b5e51':'#6e806b'}"/><path d="M${x+3} ${y+73}h${w-6}" stroke="#f0d6b2" stroke-width="2"/>
      ${loja?`<text x="${x+w/2}" y="${y+57}" text-anchor="middle" font-family="Georgia,serif" font-size="7" letter-spacing="2" fill="#4b5142">${loja}</text>`:''}
      <path d="M${x} 276h${w}" stroke="#7b7c6a" stroke-width="5"/></g>`;
  });
  for(let i=0;i<36;i++) chuva += `<path d="M${(i*137)%960} ${(i*83)%355}q-2 5-3 10" style="--atraso:-${i%11/2}s"/>`;
  const arvore=(x,y,k)=>`<g transform="translate(${x} ${y}) scale(${k})"><ellipse cy="3" rx="32" ry="5" fill="#334b3830"/><path d="M0 0v-77m0 41-19-24m19 13 18-26" stroke="#6e7254" stroke-width="5" fill="none"/><path d="M-37-64c-16-15-7-39 7-40-3-25 22-37 37-23 18-12 40 5 35 23 22 7 21 35 2 42-8 18-30 19-42 9-17 13-35 4-39-11Z" fill="#5b7857"/><path d="M-32-100c-3-19 21-33 38-21 19-6 32 9 29 23-18-11-31 0-39-5-13 11-18-1-28 3Z" fill="#819568" opacity=".7"/></g>`;
  return `<svg viewBox="0 0 960 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true" data-cafe-vista>
    <defs><linearGradient id="cafeCeu" x2="0" y2="1"><stop stop-color="var(--ceu-alto)"/><stop offset="1" stop-color="var(--ceu-baixo)"/></linearGradient><linearGradient id="cafeVidro" x2="1" y2=".3"><stop stop-color="#fff" stop-opacity=".09"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".07"/></linearGradient><linearGradient id="cafeAsfalto" x2="0" y2="1"><stop stop-color="#7e8982"/><stop offset="1" stop-color="#a2a89a"/></linearGradient></defs>
    <path fill="url(#cafeCeu)" d="M0 0h960v360H0z"/><circle class="cafe-astro" cx="773" cy="63" r="20" fill="var(--astro)"/>
    <g class="cafe-nuvens" fill="#faf3df" opacity=".65"><path d="M52 74c-3-10 11-17 22-13 5-15 25-21 38-11 12-19 43-12 46 7 19-5 38 5 35 17Z"/><path d="M445 48c-6-9 9-20 22-15 9-19 36-18 46-2 17-8 38 3 36 17Z"/></g>
    <g fill="#91aaa0" opacity=".4"><path d="M0 180v-45h43v-24h36v42h35v-16h48v-25h31v64h39v-43h38v20h44v-46h40v50h52v-27h29v20h44v-33h45v50h53v-42h43v23h34v-41h38v54h62v-33h35v39h42v-50h48v55h44v-29h46v38h44v-42h39v48h36v-59h35v83Z"/></g>
    <path d="M0 187q93-50 168-15t158-3 177 2 165-3 164-5 128 1v40H0Z" fill="#9aaf91" opacity=".55"/>
    <g class="cafe-predios">${casas}</g>
    <path d="M0 279h960v21H0z" fill="#c3c4af"/><path d="M0 286h960m-960 12h960" stroke="#ede3cb" stroke-width="2"/><path d="M0 299h960v61H0z" fill="url(#cafeAsfalto)"/>
    <path d="M0 332h960" stroke="#e0d8be" stroke-width="2" stroke-dasharray="35 38" opacity=".65"/><path d="M0 353h960v7H0z" fill="#d3c8ac"/>
    ${arvore(105,290,.75)}${arvore(800,289,.9)}
    <g transform="translate(418 307)"><ellipse cx="34" cy="18" rx="42" ry="5" fill="#344a3c25"/><path d="M-4 4 9 1l9-13h25L57 1l15 3v13H-4Z" fill="#ad6b57"/><path d="M22-9h18L51 1H15Z" fill="#c2cfc1"/><path d="M33-9V1m-33 5h67" stroke="#c78e75" stroke-width="1.5"/><circle cx="11" cy="16" r="7" fill="#47544a"/><circle cx="56" cy="16" r="7" fill="#47544a"/><circle cx="11" cy="16" r="3" fill="#aeb5a6"/><circle cx="56" cy="16" r="3" fill="#aeb5a6"/><path d="M-4 7h7m60 0h8" stroke="#eddbac" stroke-width="3"/></g>
    <g stroke="#566553" fill="none" stroke-width="2.5"><path d="M226 286v-86q0-9 9-9h13m-22 13h-8m498 82v-86q0-9 9-9h13"/></g><g class="cafe-postes" fill="#ffdda0"><ellipse cx="246" cy="193" rx="7" ry="3"/><ellipse cx="736" cy="193" rx="7" ry="3"/></g>
    <g fill="#718866"><path d="M0 350c25-29 55-8 61 10H0Zm960 10h-75c18-31 54-35 75-22Z"/></g>
    <path fill="url(#cafeVidro)" d="M0 0h960v360H0z"/><path d="M160 0 85 215M185 0 135 151M842 64l-52 151" stroke="#fff" stroke-width="3" opacity=".1"/>
    <g class="cafe-chuva" stroke="#e5efea" stroke-width="1.2" stroke-linecap="round" opacity=".55">${chuva}</g>
  </svg>`;
}
function canecaDoCafe() {
  return `<svg viewBox="0 0 150 145" aria-hidden="true"><ellipse cx="72" cy="123" rx="60" ry="11" fill="#41281b" opacity=".22"/><ellipse cx="66" cy="116" rx="53" ry="13" fill="#dfd6be"/><ellipse cx="66" cy="113" rx="43" ry="9" fill="#f3e9d5"/><path d="M108 63c43-7 34 44-1 38" fill="none" stroke="#e7ddc5" stroke-width="12"/><path d="M27 58h83l-5 42c-2 19-69 20-73 0z" fill="#f3e9d5"/><path d="M31 85h76l-1 8H32z" fill="#a84139"/><path d="M32 95h73l-1 5H33z" fill="#343f36"/><ellipse cx="68" cy="58" rx="41" ry="11" fill="#dbd0b6"/><ellipse cx="68" cy="58" rx="35" ry="8" fill="#5f3b29"/><path d="M51 60c4-7 24-8 34-1-11 7-25 5-30 0 10-3 18-1 23 0" fill="none" stroke="#d7b58b" stroke-width="2"/><g class="cafe-vapor" stroke="#f8e7ca" stroke-width="3" fill="none" opacity=".6"><path d="M54 40c-13-16 13-15 2-32"/><path d="M76 36c-9-15 13-16 4-29"/></g></svg>`;
}
function iniciarCafe() {
  const painel = document.querySelector("#painel-cafe");
  painel.innerHTML = `<div class="cafe-cabecalho"><div><span class="cafe-sobretitulo">SEU CANTINHO DE ESTUDO</span><h2 id="cafeTitulo" tabindex="-1">Café do Morumbi</h2><p>A cidade lá fora. Um objetivo de cada vez aqui dentro.</p></div><div class="cafe-cabecalho-acoes"><span id="cafeNivel"></span><button type="button" class="btn" data-projeto-cafe>Ver melhorias</button><button type="button" class="btn" id="cafeSair">← Voltar ao Foco</button></div></div>
    <div class="cafe-sala" data-nivel="0" data-periodo="dia" data-clima="limpo">
      <div class="cafe-parede"><div class="cafe-quadro" aria-hidden="true"><span>CAFÉ</span><b>do Morumbi</b><i>desde o primeiro bloco</i><div class="cafe-tricolor"></div></div>
        <div class="cafe-janela">${ruaDoCafe()}<div class="cafe-caixilho" aria-hidden="true"><i></i><i></i></div></div><span id="cafeAmbiente" class="cafe-etiqueta"></span>
        <div class="cafe-planta" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b></b></div>
        <div class="cafe-luminaria" aria-hidden="true"><i></i><b></b></div>
        <div class="cafe-estante-parede" aria-hidden="true"><div><i></i><i></i><i></i><i></i><span class="cafe-vasinho"><b></b></span></div><small>PAUSA PARA RESPIRAR</small></div><div class="cafe-boiserie" aria-hidden="true"></div>
      </div>
      <div class="cafe-mesa"><div class="cafe-estudo">
        <div class="cafe-relogio"><div class="cafe-relogio-topo"><span>COPEIRO</span><span id="cafeModo">FOCO</span></div><div id="cafeTempo" role="timer" aria-live="off">30:00</div><div class="cafe-progresso"><i id="cafeProgresso"></i></div><p id="cafeAssunto">Sua mesa está pronta.</p>
          <div class="cafe-tempo-ajuste"><label for="cafeDuracao">Duração</label><input id="cafeDuracao" type="number" min="1" max="180" step="1" inputmode="numeric"><span>min</span></div>
          <button type="button" id="cafePrincipal">Iniciar foco</button><div class="cafe-relogio-acoes"><button type="button" id="cafeZerar">Zerar</button><button type="button" id="cafeEncerrar">Encerrar e registrar</button></div>
        </div><p class="cafe-registro">O mesmo Pomodoro do Foco. Ao encerrar após 1 minuto, o tempo estudado é registrado.</p>
        <div class="cafe-som"><div class="cafe-som-titulo"><span>Som ambiente</span><button type="button" id="cafeSom" aria-pressed="false">Ouvir</button></div><label class="cafe-sr" for="cafeTipoSom">Ambiente sonoro</label><select id="cafeTipoSom"><option value="cafeteria">Cafeteria tranquila</option><option value="chuva">Chuva suave na janela</option><option value="misto">Cafeteria + chuva</option><option value="natureza">Natureza + chuva</option><option value="melodia">Piano tranquilo</option><option value="guitarra">Guitarra tranquila · 5min37</option><option value="guitarraVariada">Guitarra · temas variados · 5min37</option></select><div class="cafe-volume"><label for="cafeVolume">Volume</label><input id="cafeVolume" type="range" min="0" max="100" step="1"><output id="cafeVolumeValor" for="cafeVolume">45%</output></div><p id="cafeSomStatus" role="status">Toque em Ouvir para começar.</p></div>
      </div>
      <div class="cafe-caderno"><div class="cafe-caderno-topo"><span>CADERNO DE MESA</span><span id="cafeTarefasResumo">0/3</span></div><h3>O que vamos estudar?</h3><label for="cafeObjetivo">Objetivo do bloco</label><input type="text" id="cafeObjetivo" maxlength="80" placeholder="Ex.: Revisar os antibióticos" autocomplete="off"><p id="cafeObjetivoAjuda">Um objetivo claro para este bloco.</p>
        <fieldset><legend>Três pequenos passos</legend>${[0,1,2].map(i=>`<div class="cafe-tarefa"><input type="checkbox" id="cafeFeita${i}" aria-label="Concluir tarefa ${i+1}"><label class="cafe-sr" for="cafeTarefa${i}">Tarefa ${i+1}</label><input type="text" id="cafeTarefa${i}" maxlength="180" placeholder="${["Ler e entender","Praticar ou revisar","Anotar o que ficou"][i]}" autocomplete="off"></div>`).join("")}</fieldset>
        <label for="cafeNotas">Anotações</label><textarea id="cafeNotas" maxlength="4000" rows="4" placeholder="Uma dúvida, uma ideia, o que lembrar depois…"></textarea><p id="cafeSalvo" role="status">Caderno salvo neste navegador</p>
      </div><div class="cafe-caneca" aria-hidden="true">${canecaDoCafe()}</div><div class="cafe-lapis" aria-hidden="true"></div></div>
    </div><p class="cafe-rodape">Sua mesa é livre. Estude com ou sem ciclo aberto; moedas e reais seguem o tempo registrado.</p>`;
  recarregarCafe();
  document.querySelector("#cafeSair").addEventListener("click", () => { irParaPainel("foco"); document.querySelector("[data-entrar-cafe]")?.focus({preventScroll:true}); });
  document.querySelector("#cafePrincipal").addEventListener("click", () => T.rodando ? pausarTimer() : iniciarTimer());
  document.querySelector("#cafeZerar").addEventListener("click", zerarTimer);
  document.querySelector("#cafeEncerrar").addEventListener("click", () => {
    if (T.modo === "foco" && T.inicioBloco && T.alvoMs-restanteAgora() < 60000 && !confirm("Este bloco ainda não tem 1 minuto e não será registrado. Encerrar mesmo assim?")) return;
    pularBloco();
  });
  document.querySelector("#cafeDuracao").addEventListener("change", e => definirDuracao(Number(e.target.value)));
  document.querySelector("#cafeObjetivo").addEventListener("input", e => {
    cafeRascunho.objetivo = e.target.value;
    if (T.modo === "foco" && !T.inicioBloco) document.querySelector("#assunto").value = e.target.value;
    agendarCafe();
  });
  document.querySelector("#cafeNotas").addEventListener("input", e => {cafeRascunho.notas=e.target.value;agendarCafe();});
  [0,1,2].forEach(i => {
    document.querySelector("#cafeTarefa"+i).addEventListener("input", e => {cafeRascunho.tarefas[i].texto=e.target.value;renderTarefasCafe();agendarCafe();});
    document.querySelector("#cafeFeita"+i).addEventListener("change", e => {cafeRascunho.tarefas[i].feita=e.target.checked;renderTarefasCafe();agendarCafe();});
  });
  painel.addEventListener("focusout", salvarCafe);
  document.querySelector("#cafeSom").addEventListener("click", () => cafeAudio ? pararSomCafe() : iniciarSomCafe());
  document.querySelector("#cafeTipoSom").addEventListener("change", e => {
    cafeRascunho.som=e.target.value;agendarCafe();
    if(cafeAudio) {pararSomCafe();iniciarSomCafe();}
  });
  document.querySelector("#cafeVolume").addEventListener("input", e => {cafeRascunho.volume=Number(e.target.value)/100;agendarCafe();atualizarSomCafe();});
  document.addEventListener("click", e => {
    if(e.target.closest("[data-projeto-cafe]"))abrirProjetoCafe();
    else if(e.target.closest("[data-entrar-cafe], [data-abrir-cafe]"))abrirCafe();
  });
  document.querySelector("#caixaEstadio").addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.code === "Space") && e.target.closest("[data-abrir-cafe], [data-projeto-cafe]")) {e.preventDefault();e.stopPropagation();if(e.target.closest('[data-projeto-cafe]'))abrirProjetoCafe();else abrirCafe();}
  });
  window.addEventListener("beforeunload", salvarCafe);
  window.addEventListener("pagehide", () => {salvarCafe();pararSomCafe();});
}
function abrirCafe() {
  if(!cafeDisponivel()){abrirProjetoCafe();return;}
  const modal=document.querySelector('#modalObraEstadio');if(modal.open)modal.close();
  const temBloco = T.modo === "foco" && !!T.inicioBloco;
  const assunto = temBloco ? T.assunto : T.modo === "foco" ? document.querySelector("#assunto").value.trim() : "";
  if (assunto && assunto !== "Sem assunto" && cafeRascunho.objetivo !== assunto) {cafeRascunho.objetivo=assunto;agendarCafe();}
  document.querySelector("#cafeObjetivo").value = temBloco && assunto === "Sem assunto" ? "" : cafeRascunho.objetivo;
  irParaPainel("cafe");
  document.querySelector("#cafeTitulo").focus({preventScroll:true});
}
function prepararInicioCafe() {
  if (cafeRascunho && document.querySelector("#painel-cafe.ativo") && T.modo === "foco" && !T.inicioBloco) {
    document.querySelector("#assunto").value = cafeRascunho.objetivo.trim();
    // Um objetivo vazio inicia um bloco novo sem herdar o assunto anterior.
    T.assunto = cafeRascunho.objetivo.trim();
    salvarCafe();
  }
}
function renderTarefasCafe() {
  if (!cafeRascunho) return;
  let total=0, feitas=0;
  cafeRascunho.tarefas.forEach((t,i) => {
    if(t.texto.trim()) {total++;if(t.feita)feitas++;}
    document.querySelector("#cafeTarefa"+i).closest(".cafe-tarefa").classList.toggle("feita",t.feita);
  });
  document.querySelector("#cafeTarefasResumo").textContent = total ? `${feitas}/${total} concluídos` : "Até 3 passos";
}
function renderTimerCafe() {
  if (!cafeRascunho || !document.querySelector("#cafeTempo")) return;
  const restante=restanteAgora(), seg=Math.ceil(restante/1000), foco=T.modo==="foco";
  document.querySelector("#cafeTempo").textContent=String(Math.floor(seg/60)).padStart(2,"0")+":"+String(seg%60).padStart(2,"0");
  document.querySelector("#cafeModo").textContent=foco?"FOCO":T.pausaLonga?"PAUSA LONGA":"PAUSA";
  document.querySelector(".cafe-relogio").classList.toggle("em-pausa",!foco);
  document.querySelector("#cafePrincipal").textContent=T.rodando?"Pausar":restante<T.alvoMs?"Retomar":foco?"Iniciar foco":"Iniciar pausa";
  document.querySelector("#cafeEncerrar").textContent=foco?"Encerrar e registrar":"Voltar ao foco";
  document.querySelector("#cafeEncerrar").disabled=foco && !T.inicioBloco;
  document.querySelector("#cafeAssunto").textContent=foco?(T.inicioBloco?T.assunto:"Sua mesa está pronta."):"Solte os ombros. Respire um pouco.";
  document.querySelector("#cafeProgresso").style.width=Math.max(0,Math.min(100,100*restante/T.alvoMs))+"%";
  const duracao=document.querySelector("#cafeDuracao");
  if(document.activeElement!==duracao) duracao.value=T.alvoMs/60000;
  duracao.disabled=T.rodando || (foco && !!T.inicioBloco);
  document.querySelector("#cafeObjetivo").readOnly=foco && !!T.inicioBloco;
  document.querySelector("#cafeObjetivoAjuda").textContent=foco && T.inicioBloco?"Objetivo do bloco em andamento. As anotações continuam livres.":"Um objetivo claro para o próximo bloco.";
  renderAmbienteCafe();
}
function renderAmbienteCafe() {
  const sala=document.querySelector(".cafe-sala");if(!sala)return;
  const a=ambienteEstadioAtual(), assinatura=a.periodo+":"+a.clima;
  if(assinatura===cafeAmbienteAssinatura)return;
  cafeAmbienteAssinatura=assinatura;sala.dataset.periodo=a.periodo;sala.dataset.clima=a.clima;
  const periodo={dia:"Dia",entardecer:"Entardecer",noite:"Noite"}[a.periodo];
  document.querySelector("#cafeAmbiente").textContent=periodo+" · "+({limpo:"Céu limpo",nublado:"Nublado",chuva:"Chuva"}[a.clima]||"Céu limpo");
}

/* Gravações CC0 tratadas e incluídas no app; créditos em audio/cafe/CREDITOS.md. */
const cafeBuffers = new Map();
const GRAVACOES_CAFE = {
  cafeteria: "./audio/cafe/cafeteria.mp3?v=119",
  chuva: "./audio/cafe/chuva.mp3?v=136",
  natureza: "./audio/cafe/natureza.mp3?v=123",
  melodia: "./audio/cafe/melodia.mp3?v=126",
  guitarra: "./audio/cafe/guitarra.mp3?v=135",
  guitarraVariada: "./audio/cafe/guitarra-variada.mp3?v=137"
};
async function carregarGravacaoCafe(nome, ctx) {
  if (!cafeBuffers.has(nome)) {
    const pedido = fetch(new URL(GRAVACOES_CAFE[nome], document.baseURI))
      .then(r => {if(!r.ok)throw new Error("Áudio indisponível");return r.arrayBuffer();})
      .then(dados => ctx.decodeAudioData(dados))
      .then(buffer => {
        // Elimina pequenos saltos nas bordas deixados pela compressão MP3.
        const borda=Math.min(Math.round(buffer.sampleRate*.016),Math.floor(buffer.length/2));
        for(let canal=0;canal<buffer.numberOfChannels;canal++) {
          const amostras=buffer.getChannelData(canal);
          for(let i=0;i<borda;i++) {
            const ganho=Math.sin(i/(borda-1)*Math.PI/2);
            amostras[i]*=ganho;amostras[amostras.length-1-i]*=ganho;
          }
        }
        return buffer;
      })
      .catch(erro => {cafeBuffers.delete(nome);throw erro;});
    cafeBuffers.set(nome, pedido);
  }
  return cafeBuffers.get(nome);
}
async function iniciarSomCafe() {
  if(!cafeDisponivel())return;
  if (cafeAudio) return;
  if(config.mudo || config.volume<=0) {atualizarSomCafe();mostrarAviso("Ative o som em Ciclo & Ajustes para ouvir o café.");return;}
  const ctx=acordarAudio();if(!ctx){mostrarAviso("Este navegador não oferece áudio ambiente.");return;}
  const master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
  const audio={ctx,master,fontes:[],nos:[master],carregando:true};cafeAudio=audio;
  const tipo=cafeRascunho.som;
  const faixas=tipo==="misto" ? [["cafeteria",.7],["chuva",.55]]
    : tipo==="natureza" ? [["natureza",.7],["chuva",.7]]
    : [[tipo,["melodia","guitarra","guitarraVariada"].includes(tipo) ? .85 : 1]];
  atualizarSomCafe();
  try {
    const buffers=await Promise.all(faixas.map(([nome])=>carregarGravacaoCafe(nome,ctx)));
    // Um clique em Silenciar, troca de ambiente ou saída do café cancela o início pendente.
    if(cafeAudio!==audio)return;
    if(config.mudo || config.volume<=0){pararSomCafe();return;}
    const inicio=ctx.currentTime+.04;
    buffers.forEach((buffer,i)=>{
      const fonte=ctx.createBufferSource(),ganho=ctx.createGain();
      fonte.buffer=buffer;fonte.loop=true;ganho.gain.value=faixas[i][1];
      fonte.connect(ganho);ganho.connect(master);fonte.start(inicio);
      audio.fontes.push(fonte);audio.nos.push(fonte,ganho);
    });
    audio.carregando=false;atualizarSomCafe();
  } catch {
    if(cafeAudio!==audio)return;
    pararSomCafe();
    document.querySelector("#cafeSomStatus").textContent="Não foi possível abrir o som. Toque em Ouvir para tentar novamente.";
  }
}
function pararSomCafe() {
  const audio=cafeAudio;cafeAudio=null;
  if(audio) {
    const fim=audio.ctx.currentTime+.3;
    audio.master.gain.cancelScheduledValues(audio.ctx.currentTime);
    audio.master.gain.setTargetAtTime(0,audio.ctx.currentTime,.06);
    audio.fontes.forEach(n=>{try{n.stop(fim);}catch{}});
    setTimeout(()=>audio.nos.forEach(n=>{try{n.disconnect();}catch{}}),350);
  }
  atualizarSomCafe();
}
function atualizarSomCafe() {
  if(!cafeRascunho || !document.querySelector("#cafeSom"))return;
  const silenciado=config.mudo || config.volume<=0;
  if(cafeAudio && silenciado) {pararSomCafe();return;}
  if(cafeAudio) cafeAudio.master.gain.setTargetAtTime(cafeAudio.carregando?0:cafeRascunho.volume*config.volume*1.25,cafeAudio.ctx.currentTime,.25);
  document.querySelector("#cafeSom").textContent=cafeAudio?.carregando?"Cancelar":cafeAudio?"Silenciar":"Ouvir";
  document.querySelector("#cafeSom").setAttribute("aria-pressed",String(!!cafeAudio));
  document.querySelector("#cafeVolumeValor").textContent=Math.round(cafeRascunho.volume*100)+"%";
  document.querySelector("#cafeSomStatus").textContent=silenciado?"Som desativado em Ciclo & Ajustes.":cafeAudio?.carregando?"Preparando o ambiente…":cafeAudio?"Ambiente ligado. O alarme do bloco continua ativo.":"Toque em Ouvir para começar.";
}
