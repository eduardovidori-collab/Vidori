/* ==========================================================================
   VIDORI — Service Worker
   Estratégia offline-first: tudo que o app precisa vai pro cache na instalação.
   Depois de instalado, o app abre e funciona sem internet nenhuma.

   Caminhos relativos de propósito: assim o app funciona igual em
   https://usuario.github.io/Vidori/ e em qualquer outra subpasta.
   ========================================================================== */

const VERSAO = "vidori-v2";

/* Tudo que forma o app. Se algum arquivo mudar, é só subir o número da VERSAO. */
const ARQUIVOS = [
  "./",
  "./index.html",
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

  // Navegação (abrir o app): tenta a rede, mas cai pro index.html do cache.
  if (req.mode === "navigate") {
    evento.respondWith((async () => {
      try {
        const daRede = await fetch(req);
        const cache = await caches.open(VERSAO);
        cache.put("./index.html", daRede.clone());
        return daRede;
      } catch (e) {
        const cache = await caches.open(VERSAO);
        return (await cache.match("./index.html")) ||
               (await cache.match("./")) ||
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
