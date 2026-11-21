/* Café do Morumbi: uma mesa para o mesmo Pomodoro, sem outra contagem de estudo. */
"use strict";
let cafeRascunho = null, cafeGravacao = null, cafeSujo = false;
let cafeAudio = null, cafeAmbienteAssinatura = "";

function normalizarCafe(dados) {
  const d = dados && typeof dados === "object" ? dados : {};
  const texto = (v, max) => typeof v === "string" ? v.slice(0, max) : "";
  return {
    versao: 1, objetivo: texto(d.objetivo, 80), notas: texto(d.notas, 4000),
    tarefas: Array.from({length: 3}, (_, i) => ({
      texto: texto(d.tarefas?.[i]?.texto, 180), feita: d.tarefas?.[i]?.feita === true
    })),
    som: ["cafeteria", "chuva", "misto"].includes(d.som) ? d.som : "cafeteria",
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
  let janelas = "", chuva = "";
  const casas = [[10,132,84,160,"#b98b71"],[102,95,96,197,"#cfb99c"],[206,148,78,144,"#8c9a87"],[296,112,110,180,"#b67a65"],[418,145,86,147,"#ccae88"],[516,75,84,217,"#a79d89"],[612,123,105,169,"#b6a48c"],[730,88,100,204,"#8e9e91"]];
  casas.forEach(([x,y,w,h,cor],i) => {
    janelas += `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${cor}"/><path d="M${x-3} ${y}h${w+6}" stroke="#5b5f56" stroke-width="5"/>`;
    for(let f=0;f<Math.floor((h-48)/39);f++) for(let c=0;c<3;c++)
      janelas += `<rect class="cafe-janela-rua" x="${x+10+c*(w-20)/3}" y="${y+15+f*39}" width="${(w-30)/3-3}" height="24" rx="1" style="--luz:${(i+f+c)%3===0?'#f8ce85':'#435753'}"/>`;
    janelas += `<rect x="${x+7}" y="260" width="${w-14}" height="32" fill="#3f594e"/><path d="M${x+3} 259h${w-6}" stroke="${i%2?'#6b3e37':'#ded1b3'}" stroke-width="9"/></g>`;
  });
  for(let i=0;i<38;i++) chuva += `<path d="M${(i*103)%840} ${(i*73)%315}l-9 25" style="--atraso:-${i%9/4}s"/>`;
  return `<svg viewBox="0 0 840 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="cafeCeu" x2="0" y2="1"><stop stop-color="var(--ceu-alto)"/><stop offset="1" stop-color="var(--ceu-baixo)"/></linearGradient><linearGradient id="cafeVidro" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".13"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient></defs>
    <path fill="url(#cafeCeu)" d="M0 0h840v360H0z"/><circle class="cafe-astro" cx="680" cy="59" r="23" fill="var(--astro)"/>
    <g class="cafe-nuvens" fill="#f5f0e6" opacity=".6"><path d="M60 66c-6-20 19-32 31-19 7-28 47-24 49 1 24-5 31 15 25 18z"/><path d="M358 49c-3-14 11-24 24-19 8-25 40-19 42-2 20-6 32 11 29 21z"/></g>
    <g class="cafe-predios">${janelas}</g><path d="M0 291h840v69H0z" fill="#aaa99d"/><path d="M0 317h840v43H0z" fill="#696e67"/><path d="M0 307h840" stroke="#dad3c0" stroke-width="3"/><path d="M0 348h840" stroke="#d3cbb1" stroke-width="2" stroke-dasharray="48 38"/>
    <g fill="#49664a" stroke="#394c3a" stroke-width="4"><path d="M83 310v-46m644 46v-57"/><ellipse cx="83" cy="248" rx="27" ry="37" stroke="none"/><ellipse cx="727" cy="238" rx="31" ry="40" stroke="none"/></g>
    <g transform="translate(478 304)"><path d="M0 12l5-12h16l12 12h12v13H-5V12z" fill="#a95046"/><path d="M8 3h11l7 9H5z" fill="#b9c6bd"/><circle cx="5" cy="25" r="6" fill="#343c37"/><circle cx="33" cy="25" r="6" fill="#343c37"/></g>
    <g stroke="#404d42" stroke-width="3"><path d="M259 310v-97h-12m12 0h12"/><path d="M786 310v-97h-12m12 0h12"/></g><g class="cafe-postes" fill="#ffdba2"><ellipse cx="247" cy="215" rx="8" ry="4"/><ellipse cx="271" cy="215" rx="8" ry="4"/><ellipse cx="774" cy="215" rx="8" ry="4"/><ellipse cx="798" cy="215" rx="8" ry="4"/></g>
    <path fill="url(#cafeVidro)" d="M0 0h840v360H0z"/><g class="cafe-chuva" stroke="#e3ebdf" stroke-width="1.3" opacity=".6">${chuva}</g>
  </svg>`;
}
function canecaDoCafe() {
  return `<svg viewBox="0 0 150 145" aria-hidden="true"><ellipse cx="72" cy="123" rx="60" ry="11" fill="#41281b" opacity=".22"/><ellipse cx="66" cy="116" rx="53" ry="13" fill="#dfd6be"/><ellipse cx="66" cy="113" rx="43" ry="9" fill="#f3e9d5"/><path d="M108 63c43-7 34 44-1 38" fill="none" stroke="#e7ddc5" stroke-width="12"/><path d="M27 58h83l-5 42c-2 19-69 20-73 0z" fill="#f3e9d5"/><path d="M31 85h76l-1 8H32z" fill="#a84139"/><path d="M32 95h73l-1 5H33z" fill="#343f36"/><ellipse cx="68" cy="58" rx="41" ry="11" fill="#dbd0b6"/><ellipse cx="68" cy="58" rx="35" ry="8" fill="#5f3b29"/><path d="M51 60c4-7 24-8 34-1-11 7-25 5-30 0 10-3 18-1 23 0" fill="none" stroke="#d7b58b" stroke-width="2"/><g class="cafe-vapor" stroke="#f8e7ca" stroke-width="3" fill="none" opacity=".6"><path d="M54 40c-13-16 13-15 2-32"/><path d="M76 36c-9-15 13-16 4-29"/></g></svg>`;
}
function iniciarCafe() {
  const painel = document.querySelector("#painel-cafe");
  painel.innerHTML = `<div class="cafe-cabecalho"><div><span class="cafe-sobretitulo">SEU CANTINHO DE ESTUDO</span><h2 id="cafeTitulo" tabindex="-1">Café do Morumbi</h2><p>A cidade lá fora. Um objetivo de cada vez aqui dentro.</p></div><button type="button" class="btn" id="cafeSair">← Voltar ao Foco</button></div>
    <div class="cafe-sala" data-periodo="dia" data-clima="limpo">
      <div class="cafe-parede"><div class="cafe-quadro" aria-hidden="true"><span>CAFÉ</span><b>do Morumbi</b><i>desde o primeiro bloco</i><div class="cafe-tricolor"></div></div>
        <div class="cafe-janela">${ruaDoCafe()}<div class="cafe-caixilho"></div><span id="cafeAmbiente" class="cafe-etiqueta"></span></div>
        <div class="cafe-planta" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b></b></div>
        <div class="cafe-luminaria" aria-hidden="true"><i></i><b></b></div>
      </div>
      <div class="cafe-mesa"><div class="cafe-estudo">
        <div class="cafe-relogio"><div class="cafe-relogio-topo"><span>COPEIRO</span><span id="cafeModo">FOCO</span></div><div id="cafeTempo" role="timer" aria-live="off">30:00</div><div class="cafe-progresso"><i id="cafeProgresso"></i></div><p id="cafeAssunto">Sua mesa está pronta.</p>
          <div class="cafe-tempo-ajuste"><label for="cafeDuracao">Duração</label><input id="cafeDuracao" type="number" min="1" max="180" step="1" inputmode="numeric"><span>min</span></div>
          <button type="button" id="cafePrincipal">Iniciar foco</button><div class="cafe-relogio-acoes"><button type="button" id="cafeZerar">Zerar</button><button type="button" id="cafeEncerrar">Encerrar e registrar</button></div>
        </div><p class="cafe-registro">O mesmo Pomodoro do Foco. Ao encerrar após 1 minuto, o tempo estudado é registrado.</p>
        <div class="cafe-som"><div class="cafe-som-titulo"><span>Som ambiente</span><button type="button" id="cafeSom" aria-pressed="false">Ouvir</button></div><label class="cafe-sr" for="cafeTipoSom">Ambiente sonoro</label><select id="cafeTipoSom"><option value="cafeteria">Cafeteria tranquila</option><option value="chuva">Chuva na janela</option><option value="misto">Cafeteria + chuva</option></select><div class="cafe-volume"><label for="cafeVolume">Volume</label><input id="cafeVolume" type="range" min="0" max="100" step="1"><output id="cafeVolumeValor" for="cafeVolume">45%</output></div><p id="cafeSomStatus" role="status">Toque em Ouvir para começar.</p></div>
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
  document.addEventListener("click", e => {if(e.target.closest("[data-entrar-cafe], [data-abrir-cafe]")) abrirCafe();});
  document.querySelector("#caixaEstadio").addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.code === "Space") && e.target.closest("[data-abrir-cafe]")) {e.preventDefault();e.stopPropagation();abrirCafe();}
  });
  window.addEventListener("beforeunload", salvarCafe);
  window.addEventListener("pagehide", () => {salvarCafe();pararSomCafe();});
}
function abrirCafe() {
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

/* Paisagem sonora sintética local: sem downloads, vozes ou repetição de música. */
function iniciarSomCafe() {
  if(config.mudo || config.volume<=0) {atualizarSomCafe();mostrarAviso("Ative o som em Ciclo & Ajustes para ouvir o café.");return;}
  const ctx=acordarAudio();if(!ctx){mostrarAviso("Este navegador não oferece áudio ambiente.");return;}
  const master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
  const audio={ctx,master,fontes:[],nos:[master],intervalo:null};cafeAudio=audio;
  function ruido(tipo,frequencia,ganho) {
    const buffer=ctx.createBuffer(1,ctx.sampleRate*8,ctx.sampleRate),data=buffer.getChannelData(0);
    let anterior=0;
    for(let i=0;i<data.length;i++) {const branco=Math.random()*2-1;anterior=(anterior+.025*branco)/1.025;data[i]=tipo==="brown"?anterior*7:branco;}
    const fonte=ctx.createBufferSource(),filtro=ctx.createBiquadFilter(),g=ctx.createGain();
    fonte.buffer=buffer;fonte.loop=true;filtro.type="lowpass";filtro.frequency.value=frequencia;g.gain.value=ganho;
    fonte.connect(filtro);filtro.connect(g);g.connect(master);fonte.start();audio.fontes.push(fonte);audio.nos.push(filtro,g);
  }
  const tipo=cafeRascunho.som;
  if(tipo!=="chuva") {
    ruido("brown",650,.65);
    audio.intervalo=setInterval(() => {
      if(cafeAudio!==audio || ctx.state!=="running")return;
      // Pequenos toques de porcelana, espaçados e suaves.
      const inicio=ctx.currentTime,osc=ctx.createOscillator(),g=ctx.createGain();
      osc.type="sine";osc.frequency.value=1800+Math.random()*500;
      g.gain.setValueAtTime(0,inicio);g.gain.linearRampToValueAtTime(.014,inicio+.005);g.gain.exponentialRampToValueAtTime(.0001,inicio+.32);
      osc.connect(g);g.connect(master);osc.start(inicio);osc.stop(inicio+.35);
      audio.fontes.push(osc);audio.nos.push(g);
      osc.onended=()=>{osc.disconnect();g.disconnect();audio.fontes=audio.fontes.filter(n=>n!==osc);audio.nos=audio.nos.filter(n=>n!==g);};
    },6500);
  }
  if(tipo!=="cafeteria") {ruido("white",3500,.18);ruido("brown",1000,.3);}
  atualizarSomCafe();
}
function pararSomCafe() {
  const audio=cafeAudio;cafeAudio=null;
  if(audio) {
    clearInterval(audio.intervalo);
    const fim=audio.ctx.currentTime+.08;
    audio.master.gain.cancelScheduledValues(audio.ctx.currentTime);
    audio.master.gain.setTargetAtTime(0,audio.ctx.currentTime,.015);
    audio.fontes.forEach(n=>{try{n.stop(fim);}catch{}});
    setTimeout(()=>audio.nos.forEach(n=>{try{n.disconnect();}catch{}}),150);
  }
  atualizarSomCafe();
}
function atualizarSomCafe() {
  if(!cafeRascunho || !document.querySelector("#cafeSom"))return;
  const silenciado=config.mudo || config.volume<=0;
  if(cafeAudio && silenciado) {pararSomCafe();return;}
  if(cafeAudio) cafeAudio.master.gain.setTargetAtTime(cafeRascunho.volume*config.volume*.6,cafeAudio.ctx.currentTime,.06);
  document.querySelector("#cafeSom").textContent=cafeAudio?"Silenciar":"Ouvir";
  document.querySelector("#cafeSom").setAttribute("aria-pressed",String(!!cafeAudio));
  document.querySelector("#cafeVolumeValor").textContent=Math.round(cafeRascunho.volume*100)+"%";
  document.querySelector("#cafeSomStatus").textContent=silenciado?"Som desativado em Ciclo & Ajustes.":cafeAudio?"Ambiente ligado. O alarme do bloco continua ativo.":"Toque em Ouvir para começar.";
}
