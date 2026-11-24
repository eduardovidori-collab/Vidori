/* ==========================================================================
   VIDORI — Service Worker
   Estratégia offline-first: tudo que o app precisa vai pro cache na instalação.
   Depois de instalado, o app abre e funciona sem internet nenhuma.

   Caminhos relativos de propósito: assim o app funciona igual em
   https://usuario.github.io/Vidori/ e em qualquer outra subpasta.
   ========================================================================== */

const VERSAO = "vidori-v143";

/* Tudo que forma o app. Se algum arquivo mudar, é só subir o número da VERSAO. */
const ARQUIVOS = [
  "./",
  "./index.html",
  "./ciclo-ferias.css?v=143",
  "./futebol.js",
  "./futebol.css",
  "./album-time.js?v=141",
  "./album-time.css?v=129",
  "./atributos-jogadores.js?v=141",
  "./cartas-time.js?v=142",
  "./cartas-time.css?v=142",
  "./fotos-elenco.js?v=142",
  "./jogadores-fotos.js?v=142",
  "./jogadores-fotos.css?v=142",
  "./imagens/jogadores/CREDITOS.html",
  "./imagens/jogadores/elenco/alan-franco.png?v=142",
  "./imagens/jogadores/elenco/alexandre-pato.png?v=142",
  "./imagens/jogadores/elenco/alisson.png?v=142",
  "./imagens/jogadores/elenco/aloisio-boi-bandido.png?v=142",
  "./imagens/jogadores/elenco/antony.png?v=142",
  "./imagens/jogadores/elenco/arquivo-a.png?v=142",
  "./imagens/jogadores/elenco/arquivo-b.png?v=142",
  "./imagens/jogadores/elenco/benitez.png?v=142",
  "./imagens/jogadores/elenco/bobadilla.png?v=142",
  "./imagens/jogadores/elenco/bruno-alves.png?v=142",
  "./imagens/jogadores/elenco/bruno-peres.png?v=142",
  "./imagens/jogadores/elenco/caio-paulista.png?v=142",
  "./imagens/jogadores/elenco/calleri.png?v=142",
  "./imagens/jogadores/elenco/casemiro.png?v=142",
  "./imagens/jogadores/elenco/cauly.png?v=142",
  "./imagens/jogadores/elenco/cortez.png?v=142",
  "./imagens/jogadores/elenco/cueva.png?v=142",
  "./imagens/jogadores/elenco/david-neres.png?v=142",
  "./imagens/jogadores/elenco/david.png?v=142",
  "./imagens/jogadores/elenco/denis.png?v=142",
  "./imagens/jogadores/elenco/eder-militao.png?v=142",
  "./imagens/jogadores/elenco/enzo-diaz.png?v=142",
  "./imagens/jogadores/elenco/erick.png?v=142",
  "./imagens/jogadores/elenco/everton-ribeiro.png?v=142",
  "./imagens/jogadores/elenco/ferreirinha.png?v=142",
  "./imagens/jogadores/elenco/gabriel-neves.png?v=142",
  "./imagens/jogadores/elenco/gabriel-sara.png?v=142",
  "./imagens/jogadores/elenco/hernanes.png?v=142",
  "./imagens/jogadores/elenco/hudson.png?v=142",
  "./imagens/jogadores/elenco/igor-gomes.png?v=142",
  "./imagens/jogadores/elenco/igor-vinicius.png?v=142",
  "./imagens/jogadores/elenco/jandrei.png?v=142",
  "./imagens/jogadores/elenco/joao-rojas.png?v=142",
  "./imagens/jogadores/elenco/jucilei.png?v=142",
  "./imagens/jogadores/elenco/leo-pele.png?v=142",
  "./imagens/jogadores/elenco/liziero.png?v=142",
  "./imagens/jogadores/elenco/luan.png?v=142",
  "./imagens/jogadores/elenco/lucao.png?v=142",
  "./imagens/jogadores/elenco/lucas-moura.png?v=142",
  "./imagens/jogadores/elenco/lucas-perri.png?v=142",
  "./imagens/jogadores/elenco/lucas-ramon.png?v=142",
  "./imagens/jogadores/elenco/luciano.png?v=142",
  "./imagens/jogadores/elenco/lugano.png?v=142",
  "./imagens/jogadores/elenco/luis-fabiano.png?v=142",
  "./imagens/jogadores/elenco/luiz-araujo.png?v=142",
  "./imagens/jogadores/elenco/maicon.png?v=142",
  "./imagens/jogadores/elenco/marcos-antonio.png?v=142",
  "./imagens/jogadores/elenco/miranda.png?v=142",
  "./imagens/jogadores/elenco/nathan-mendes.png?v=142",
  "./imagens/jogadores/elenco/nene.png?v=142",
  "./imagens/jogadores/elenco/nikao.png?v=142",
  "./imagens/jogadores/elenco/orejuela.png?v=142",
  "./imagens/jogadores/elenco/osvaldo.png?v=142",
  "./imagens/jogadores/elenco/pablo.png?v=142",
  "./imagens/jogadores/elenco/petros.png?v=142",
  "./imagens/jogadores/elenco/rafael.png?v=142",
  "./imagens/jogadores/elenco/rafinha.png?v=142",
  "./imagens/jogadores/elenco/reinaldo.png?v=142",
  "./imagens/jogadores/elenco/rigoni.png?v=142",
  "./imagens/jogadores/elenco/rodrigo-caio.png?v=142",
  "./imagens/jogadores/elenco/rodrigo-nestor.png?v=142",
  "./imagens/jogadores/elenco/sabino.png?v=142",
  "./imagens/jogadores/elenco/shaylon.png?v=142",
  "./imagens/jogadores/elenco/sidao.png?v=142",
  "./imagens/jogadores/elenco/tche-tche.png?v=142",
  "./imagens/jogadores/elenco/thiago-mendes.png?v=142",
  "./imagens/jogadores/elenco/tiago-volpi.png?v=142",
  "./imagens/jogadores/elenco/toro.png?v=142",
  "./imagens/jogadores/elenco/trellez.png?v=142",
  "./imagens/jogadores/elenco/vitor-bueno.png?v=142",
  "./imagens/jogadores/elenco/welington.png?v=142",
  "./imagens/jogadores/elenco/wellington-rato.png?v=142",
  "./imagens/jogadores/elenco/wendell.png?v=142",

  "./imagens/jogadores/lendas-retratos.png?v=140",
  "./imagens/jogadores/rogerio-ceni.jpg?v=139",
  "./imagens/jogadores/rai.jpg?v=140",
  "./imagens/jogadores/kaka.jpg?v=139",
  "./imagens/jogadores/cafu.jpg?v=140",
  "./imagens/jogadores/serginho-chulapa.jpg?v=139",

  "./camarotes.js?v=115",
  "./cidade.js?v=139",
  "./cafe.js?v=139",
  "./cafe.css?v=139",
  "./audio/cafe/cafeteria.mp3?v=119",
  "./audio/cafe/chuva.mp3?v=136",
  "./audio/cafe/natureza.mp3?v=123",
  "./audio/cafe/melodia.mp3?v=126",
  "./audio/cafe/guitarra.mp3?v=135",
  "./audio/cafe/guitarra-variada.mp3?v=137",
  "./estadio-museu.js?v=143",
  "./estadio-museu.css?v=135",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

/* ------------------------------------------------------- instalação: cachear */
self.addEventListener("install", (evento) => {
  evento.waitUntil((async () => {
    const cache = await caches.open(VERSAO);
    // addAll falha inteiro se um único arquivo der erro; aqui cada um é
    // tratado sozinho para uma falha isolada não derrubar a instalação.
    await Promise.all(ARQUIVOS.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: "reload" }));
      } catch (e) {
        // segue o jogo: o arquivo entra no cache no primeiro acesso online
      }
    }));
    self.skipWaiting();
  })());
});

/* ------------------------------------------- ativação: limpar caches antigos */
self.addEventListener("activate", (evento) => {
  evento.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.map((n) => (n === VERSAO ? null : caches.delete(n))));
    await self.clients.claim();
  })());
});

/* --------------------------------------------------------------- requisições */
self.addEventListener("fetch", (evento) => {
  const req = evento.request;

  // Só interessa GET do mesmo domínio.
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  // Cada página preserva sua própria cópia. Abrir os créditos das fotos não
  // pode substituir a entrada do app nem devolver o app no lugar dos créditos.
  if (req.mode === "navigate") {
    evento.respondWith((async () => {
      const raiz = new URL("./", self.location.href).pathname;
      const caminho = new URL(req.url).pathname;
      const entradaApp = caminho === raiz || caminho === raiz + "index.html";
      const chave = entradaApp ? "./index.html" : req;
      try {
        const daRede = await fetch(req);
        const cache = await caches.open(VERSAO);
        if (daRede.ok) await cache.put(chave, daRede.clone());
        return daRede;
      } catch (e) {
        const cache = await caches.open(VERSAO);
        return (await cache.match(chave)) ||
               (entradaApp && await cache.match("./")) ||
               Response.error();
      }
    })());
    return;
  }

  // Demais arquivos: cache primeiro (rápido e offline), rede como reforço.
  evento.respondWith((async () => {
    const cache = await caches.open(VERSAO);
    const doCache = await cache.match(req);
    if (doCache) return doCache;
    try {
      const daRede = await fetch(req);
      if (daRede && daRede.status === 200 && daRede.type === "basic") {
        cache.put(req, daRede.clone());
      }
      return daRede;
    } catch (e) {
      return Response.error();
    }
  })());
});

/* ------------------------ clicar na notificação traz a janela do app pra frente */
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  evento.waitUntil((async () => {
    const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const janela of janelas) {
      if ("focus" in janela) return janela.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow("./index.html");
  })());
});
