// Service worker simples: sempre tenta a rede primeiro, usa o cache so se estiver sem internet.
self.addEventListener("install",function(){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){
  if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request).then(function(r){var c=r.clone();caches.open("vixion-net").then(function(ch){ch.put(e.request,c)});return r}).catch(function(){return caches.match(e.request)}));
});
