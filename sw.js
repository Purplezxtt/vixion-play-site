// Vixion Play: funciona sem internet. Guarda o app no aparelho e atualiza quando ha rede.
var V="vixion-v8";
var SHELL=["./","index.html","style.css?v=8","app1.js?v=8","app2.js?v=8","app3.js?v=8","manifest.webmanifest","icon-192.png","icon-512.png"];
self.addEventListener("install",function(e){
  e.waitUntil(caches.open(V).then(function(c){return Promise.all(SHELL.map(function(u){return c.add(u).catch(function(){})}))}).then(function(){return self.skipWaiting()}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
self.addEventListener("fetch",function(e){
  var r=e.request;if(r.method!=="GET"||r.url.indexOf("http")!==0)return;
  var u=new URL(r.url);if(u.origin!==location.origin&&u.hostname.indexOf("fonts.g")!==0)return;
  if(r.mode==="navigate"){
    e.respondWith(fetch(r).then(function(n){var c=n.clone();caches.open(V).then(function(ch){ch.put("index.html",c)});return n}).catch(function(){return caches.match("index.html").then(function(m){return m||caches.match("./")})}));
    return;
  }
  e.respondWith(caches.match(r).then(function(m){
    var net=fetch(r).then(function(n){if(n&&(n.ok||n.type==="opaque")){var c=n.clone();caches.open(V).then(function(ch){ch.put(r,c)})}return n}).catch(function(){return m});
    return m||net;
  }));
});
