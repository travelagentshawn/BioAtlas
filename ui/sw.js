const VERSION = "bioatlas-shell-v1";
const SHELL = [ "./", "./index.html", "./config.js", "./manifest.webmanifest", "./css/bioatlas.css", "./js/app.js", "./js/api.js", "./js/dom.js", "./js/i18n.js", "./js/labels.js", "./js/components.js", "./js/viz.js", "./js/tree-layout.js", "./js/md.js", "./api/v1/manifest.json", "./api/v1/species.json", "./api/v1/taxa.json", "./api/v1/regions.json", "./api/v1/calendar.json", "./api/v1/sources.json", "./api/v1/search.json", "./docs/index.json" ];
self.addEventListener("install", event => {
 event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL.map(path=>new Request(new URL(path,self.registration.scope),{cache:"reload"})))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", event => {
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("bioatlas-")&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("message", event => {
 if(event.data?.type!=="BIOATLAS_CACHE_URLS"||!Array.isArray(event.data.urls))return;
 event.waitUntil(caches.open(VERSION).then(async cache=>{
  for(const raw of event.data.urls){
   try{const url=new URL(raw,self.registration.scope);if(url.origin!==self.location.origin)continue;const response=await fetch(url);if(response.ok)await cache.put(url,response.clone());}catch{/* retain any older cached copy */}
  }
 }));
});
self.addEventListener("fetch", event => {
 const req=event.request;if(req.method!=="GET")return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 event.respondWith(caches.match(req).then(cached=>{
  const network=fetch(req).then(response=>{
   if(response.ok)caches.open(VERSION).then(cache=>cache.put(req,response.clone()));
   return response;
  }).catch(()=>cached);
  return cached||network;
 }));
});
