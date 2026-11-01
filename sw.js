/* TinkerPET PWA. Escopo estático: nunca acessa nem apaga projetos do navegador. */
'use strict';
const PREFIX='tinkerpet-offline-shell-';
const BOOT='20261031-first-install-v1';
const BOOT_CACHE=PREFIX+BOOT;
const META_CACHE='tinkerpet-offline-meta-v1';
const ACTIVE_URL=new URL('__active-shell__',self.registration.scope).href;
const PRECACHE=[
 "index.html",
 "projects.html",
 "editor.html",
 "gabarito.html",
 "como-funciona.html",
 "home.css",
 "home.js",
 "projects.css",
 "projects.js",
 "styles.css",
 "editor-layout.css",
 "editor-layout.js",
 "mobile-editor.css",
 "mobile-editor.js",
 "app.js",
 "app-mobile.js",
 "answer-key.css",
 "answer-key.js",
 "studio-preview.css",
 "studio-preview.js",
 "step-hints.css",
 "step-hints.js",
 "gabarito-guide.js",
 "como-funciona.css",
 "como-funciona.js",
 "presentation-mode.css",
 "presentation-mode.js",
 "nick-registry.js",
 "manifest.webmanifest",
 "pwa.js",
 "assets/logo-pet.svg",
 "assets/welcome-clean-2026.svg",
 "assets/welcome-approved.avif",
 "assets/bateria-9v-desenhada.svg",
 "assets/esp32-devkit-v1-30p.svg",
 "assets/fios-jumper-ilustracao.svg",
 "assets/gangorra-desenhada.svg",
 "assets/lm2596-desenhado.svg",
 "assets/motor-dc.svg",
 "assets/motor-frontal.svg",
 "assets/motor-lateral.svg",
 "assets/mx1508-desenhado.svg",
 "assets/suporte-6-pilhas.svg",
 "assets/tinkerpet-app-192.png",
 "assets/tinkerpet-app-512.png",
 "preview-melhorias.html",
 "preview-melhorias.css",
 "preview-melhorias.js",
 "studio-preview.html"
];
const urlOf=path=>new URL(path,self.registration.scope).href;
const cacheRequests=()=>PRECACHE.map(path=>new Request(urlOf(path),{cache:'reload'}));
async function activeCacheName(){
 const meta=await caches.open(META_CACHE);
 const saved=await meta.match(ACTIVE_URL);
 return saved?await saved.text():BOOT_CACHE;
}
async function cleanup(keep){
 const keys=await caches.keys();
 await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==keep).map(key=>caches.delete(key)));
}
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(BOOT_CACHE).then(cache=>cache.addAll(cacheRequests())));
 // Não chama skipWaiting automaticamente: versões futuras exigem confirmação.
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const meta=await caches.open(META_CACHE);
  await meta.put(ACTIVE_URL,new Response(BOOT_CACHE));
  await cleanup(BOOT_CACHE);
  await self.clients.claim();
 })());
});
async function offlineResponse(request){
 const active=await caches.open(await activeCacheName());
 let saved=await active.match(request,{ignoreSearch:true});
 if(!saved&&request.mode==='navigate'){
  saved=await active.match(urlOf('index.html'))||await active.match(urlOf('projects.html'));
 }
 return saved||Response.error();
}
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 if(/\/(?:backend|data)\//.test(url.pathname))return;
 if(!/\.(?:html|js|css|svg|png|webp|avif|ico|webmanifest)$/.test(url.pathname)&&
    url.pathname!==new URL(self.registration.scope).pathname)return;
 event.respondWith((async()=>{
  // Rede primeiro: mudanças no editor continuam acessíveis imediatamente.
  // Offline: cópia local. Nunca intercepta backup, IndexedDB ou localStorage.
  try{
   const response=await fetch(req,{cache:'no-store'});
   if(response.ok&&response.type==='basic'){
    const active=await caches.open(await activeCacheName());
    const key=new URL(url.href);key.search='';key.hash='';
    if(key.pathname.endsWith('/'))key.pathname+='index.html';
    await active.put(key.href,response.clone());
   }
   return response;
  }catch{
   return offlineResponse(req);
  }
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='ACTIVATE_WAITING'){
  event.waitUntil(self.skipWaiting());
  return;
 }
 if(event.data?.type!=='REFRESH_OFFLINE')return;
 const port=event.ports?.[0];
 const revision=event.data.revision;
 if(typeof revision!=='string'||!/^[a-f0-9]{40}$/.test(revision)){
  port?.postMessage({ok:false,error:'Versão não reconhecida.'});return;
 }
 event.waitUntil((async()=>{
  const next=PREFIX+revision;
  try{
   // Preparação em cache novo: a versão antiga continua intacta se falhar.
   await caches.delete(next);
   const fresh=await caches.open(next);
   await fresh.addAll(cacheRequests());
   const meta=await caches.open(META_CACHE);
   await meta.put(ACTIVE_URL,new Response(next));
   await cleanup(next);
   port?.postMessage({ok:true});
  }catch{
   await caches.delete(next);
   port?.postMessage({ok:false,error:'Não foi possível baixar todos os arquivos. Verifique a conexão e tente novamente.'});
  }
 })());
});