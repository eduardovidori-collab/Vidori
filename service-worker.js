/* ==========================================================================
   VIDORI — Service Worker
   Estratégia offline-first: tudo que o app precisa vai pro cache na instalação.
   Depois de instalado, o app abre e funciona sem internet nenhuma.

   Caminhos relativos de propósito: assim o app funciona igual em
   https://usuario.github.io/Vidori/ e em qualquer outra subpasta.
   ========================================================================== */

const VERSAO = "vidori-v140";

/* Tudo que forma o app. Se algum arquivo mudar, é só subir o número da VERSAO. */
const ARQUIVOS = [
  "./",
  "./index.html",
  "./futebol.js",
  "./futebol.css",
  "./album-time.js?v=139",
  "./album-time.css?v=129",
  "./jogadores-fotos.js?v=140",
  "./jogadores-fotos.css?v=140",
  "./imagens/jogadores/CREDITOS.html",
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
  "./estadio-museu.js?v=135",
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
