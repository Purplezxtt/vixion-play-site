var ICON={
  heart:'<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-9-9.5A5 5 0 0 1 12 7a5 5 0 0 1 9 3.5C19.5 15.4 12 20 12 20z"/></svg>',
  chat:'<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  trash:'<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  vol:'<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM17 9a4 4 0 0 1 0 6"/></svg>',
  mute:'<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM17 9l4 6M21 9l-4 6"/></svg>',
  play:'<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>',
  x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back:'<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  up:'<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M5 14v6h14v-6"/></svg>',
  film:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5l5 2.5-5 2.5z"/></svg>',
  rect:'<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="3"/><path d="M11 9l3 1.8-3 1.8z"/></svg>',
  note:'<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>'
};
function $(s,r){return (r||document).querySelector(s)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function fmt(n){if(n>=1e6)return (n/1e6).toFixed(1).replace(".0","").replace(".",",")+" mi";if(n>=1e3)return (n/1e3).toFixed(n>=1e4?0:1).replace(".0","").replace(".",",")+" mil";return String(n)}
function dur(s){s=Math.round(s||0);var h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60;return (h?h+":"+(m<10?"0":""):"")+m+":"+(r<10?"0":"")+r}
function ago(t){var m=Math.floor((Date.now()-t)/60000);if(m<1)return "agora";if(m<60)return "h\u00e1 "+m+" min";var h=Math.floor(m/60);if(h<24)return "h\u00e1 "+h+" h";var d=Math.floor(h/24);if(d<30)return "h\u00e1 "+d+(d===1?" dia":" dias");var mo=Math.floor(d/30);return "h\u00e1 "+mo+(mo===1?" m\u00eas":" meses")}
function init(n){return (n||"V").replace("@","").trim().charAt(0).toUpperCase()}
function toast(m){var t=$("#toast");t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(function(){t.hidden=true},2200)}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}

var st={tab:"videos",q:"",muted:true,liked:lsGet("vx-liked",{}),ch:lsGet("vx-channel","")};
var LIB=[],POSTS=lsGet("vx-posts",[]),URLS={},DB=null,dbOk=true;
var PROF=lsGet("vx-profile",null);
function pName(){return PROF?PROF.name:"Meu canal"}
function pHandle(){return PROF?"@"+PROF.handle:"@canal"}
function avH(){return '<div class="av" style="background:hsl('+(PROF?PROF.hue:180)+' 55% 38%);color:#fff">'+(PROF&&PROF.avatar?'<img alt="" src="'+PROF.avatar+'">':esc(init(pName())))+'</div>'}

/* armazenamento de v\u00eddeos no aparelho */
function openDB(){return new Promise(function(res,rej){
  if(!window.indexedDB){rej();return}
  var r=indexedDB.open("vixion",1);
  r.onupgradeneeded=function(){r.result.createObjectStore("videos",{keyPath:"id"})};
  r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)};
})}
function dbAll(){return new Promise(function(res,rej){var q=DB.transaction("videos").objectStore("videos").getAll();q.onsuccess=function(){res(q.result||[])};q.onerror=function(){rej(q.error)}})}
function dbPut(v){return new Promise(function(res,rej){var t=DB.transaction("videos","readwrite");t.objectStore("videos").put(v);t.oncomplete=res;t.onerror=function(){rej(t.error)};t.onabort=function(){rej(t.error)}})}
function dbDel(id){return new Promise(function(res,rej){var t=DB.transaction("videos","readwrite");t.objectStore("videos").delete(id);t.oncomplete=res;t.onerror=function(){rej(t.error)}})}
function urlOf(v){if(!URLS[v.id])URLS[v.id]=URL.createObjectURL(v.blob);return URLS[v.id]}
function pubOnly(l){return l.filter(function(v){return v.vis!=="private"})}
function kind(k){return LIB.filter(function(v){return v.kind===k}).sort(function(a,b){return b.created-a.created})}

/* v\u00eddeos */
function emptyBlock(icon,title,text,btn){
  return '<div class="empty"><div class="ic">'+icon+'</div><h2>'+title+'</h2><p>'+text+'</p>'+(btn?'<button class="btn" data-publish>'+btn+'</button>':'')+'</div>';
}
function drawGrid(){
  var q=st.q.toLowerCase();
  var list=pubOnly(kind("video")).filter(function(v){return !q||(v.title+" "+pName()+" "+pHandle()).toLowerCase().indexOf(q)>-1});
  if(!list.length){
    $("#grid").innerHTML=st.q?'<div class="empty" style="grid-column:1/-1"><p>Nenhum v\u00eddeo encontrado.</p></div>':
      '<div style="grid-column:1/-1">'+emptyBlock(ICON.film,"Nenhum v\u00eddeo ainda","Publique o primeiro v\u00eddeo do seu canal. Ele aparece aqui.","Publicar v\u00eddeo")+'</div>';
    return;
  }
  $("#grid").innerHTML=list.map(function(v){
    return '<button class="vid" data-vid="'+v.id+'"><div class="thumb">'+(v.thumb?'<img alt="" src="'+v.thumb+'">':'')+'<span class="dur">'+dur(v.dur)+'</span></div>'+
    '<div class="meta">'+avH()+'<div class="minw"><h3>'+esc(v.title)+'</h3><div class="sub">'+esc(pName())+' \u00b7 '+fmt(v.views||0)+' views \u00b7 '+ago(v.created)+'</div></div></div></button>';
  }).join("");
}

/* shorts */
var io=null;
function pauseAll(){document.querySelectorAll("#shortsbox video").forEach(function(v){try{v.pause()}catch(e){}})}
function drawShorts(){
  var box=$("#shortsbox"),list=pubOnly(kind("short"));
  if(io){io.disconnect();io=null}
  if(!list.length){box.innerHTML=emptyBlock(ICON.rect,"Nenhum short ainda","V\u00eddeos gravados em p\u00e9 aparecem aqui, em tela cheia.","Publicar v\u00eddeo");return}
  box.innerHTML='<div class="shorts" id="shorts">'+list.map(function(s){
    var on=st.liked["s"+s.id];
    return '<article class="short" data-s="'+s.id+'"><video src="'+urlOf(s)+'" '+(s.thumb?'poster="'+s.thumb+'" ':'')+'loop playsinline '+(st.muted?'muted ':'')+'preload="metadata"></video>'+
    '<button class="tap" data-tap aria-label="Pausar ou continuar"></button><div class="pauseflag"><span>'+ICON.play+'</span></div>'+
    '<div class="sinfo"><b>'+esc(pHandle())+'</b><p>'+esc(s.title)+'</p></div>'+
    '<div class="rail"><button class="'+(on?"liked":"")+'" data-slike="'+s.id+'"><span class="b">'+ICON.heart+'</span><span>'+fmt((s.likes||0)+(on?1:0))+'</span></button>'+
    '<button data-mute><span class="b">'+(st.muted?ICON.mute:ICON.vol)+'</span><span>'+(st.muted?"Mudo":"Som")+'</span></button>'+
    '<button data-del="'+s.id+'"><span class="b">'+ICON.trash+'</span><span>Excluir</span></button></div>'+
    '<div class="prog"><i></i></div></article>';
  }).join("")+'</div>';
  var root=$("#shorts");
  io=new IntersectionObserver(function(es){es.forEach(function(e){
    var v=e.target.querySelector("video");
    if(e.isIntersecting&&e.intersectionRatio>.7){e.target.classList.remove("paused");var p=v.play();if(p&&p.catch)p.catch(function(){})}
    else{try{v.pause()}catch(x){}}
  })},{root:root,threshold:[0,.7,1]});
  root.querySelectorAll(".short").forEach(function(el){
    io.observe(el);
    var v=el.querySelector("video"),bar=el.querySelector(".prog i");
    v.ontimeupdate=function(){if(v.duration)bar.style.width=(v.currentTime/v.duration*100)+"%"};
  });
}

/* posts */
function drawPosts(){
  if(!POSTS.length){$("#posts").innerHTML=emptyBlock(ICON.note,"Nenhum post ainda","Escreva algo no campo acima para abrir o feed.");return}
  $("#posts").innerHTML=POSTS.map(function(p){
    var on=st.liked["p"+p.id];
    return '<article class="post">'+avH()+'<div class="body"><div class="who"><b>'+esc(pName())+'</b> <span>'+esc(pHandle())+' \u00b7 '+ago(p.id)+'</span></div>'+
    '<p>'+esc(p.t)+'</p><div class="acts"><button class="'+(on?"liked":"")+'" data-plike="'+p.id+'">'+ICON.heart+fmt((p.l||0)+(on?1:0))+'</button>'+
    '<button data-pdel="'+p.id+'" aria-label="Excluir post">'+ICON.trash+'</button></div></div></article>';
  }).join("");
}

/* abas */
function go(tab,silent){
  st.tab=tab;
  ["videos","shorts","posts"].forEach(function(t){$("#v-"+t).hidden=t!==tab});
  document.querySelectorAll(".tab").forEach(function(b){if(b.dataset.tab===tab)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
  if(tab!=="shorts")pauseAll();
  if(tab==="shorts")drawShorts();
  if(!silent){try{history.replaceState(null,"","#"+tab)}catch(e){location.hash=tab}}
  window.scrollTo(0,0);
}

/* excluir com confirma\u00e7\u00e3o */
var pend=null;
function askDelete(id){
  if(pend&&pend.id===id){clearTimeout(pend.t);pend=null;removeVideo(id);return}
  if(pend)clearTimeout(pend.t);
  pend={id:id,t:setTimeout(function(){pend=null},3500)};
  toast("Toque de novo para excluir");
}
function removeVideo(id){
  dbDel(id).catch(function(){}).then(function(){
    LIB=LIB.filter(function(v){return v.id!==id});
    if(URLS[id]){URL.revokeObjectURL(URLS[id]);delete URLS[id]}
    closeSheet();drawGrid();if(st.tab==="shorts")drawShorts();toast("V\u00eddeo exclu\u00eddo");
  });
}

/* player */
function closeSheet(){var sh=$("#sheet");var v=sh.querySelector("video");if(v)try{v.pause()}catch(e){}sh.hidden=true;sh.innerHTML="";document.body.style.overflow=""}
function openVideo(id){
  var v=LIB.filter(function(x){return x.id==id})[0];if(!v)return;
  v.views=(v.views||0)+1;dbPut(v).catch(function(){});
  var sh=$("#sheet"),cms=[],on=st.liked["v"+v.id];
  sh.innerHTML='<div class="in"><div class="player"><video controls autoplay playsinline src="'+urlOf(v)+'"></video>'+
   '<button class="close" id="cl" aria-label="Fechar">'+ICON.x+'</button></div>'+
   '<div class="sec"><h2>'+esc(v.title)+'</h2><div class="sub">'+fmt(v.views)+' views \u00b7 '+ago(v.created)+'</div>'+
   '<div class="row2">'+avH()+'<div class="grow"><b>'+esc(pName())+'</b><div class="sub">'+esc(pHandle())+'</div></div></div>'+
   '<div class="row2"><button class="btn ghost" id="lk">'+ICON.heart.replace('<svg','<svg width="18" height="18"')+'<span id="lkn">'+fmt((v.likes||0)+(on?1:0))+'</span></button>'+
   '<button class="btn ghost" id="vz"></button><button class="btn danger" id="dl">Excluir v\u00eddeo</button></div>'+
   '<b>Coment\u00e1rios</b><div id="cms"></div>'+
   '<form class="cin" id="cf"><input id="ci" placeholder="Adicionar coment\u00e1rio" aria-label="Coment\u00e1rio" maxlength="200"><button class="btn" type="submit">Enviar</button></form></div></div>';
  sh.hidden=false;sh.scrollTop=0;document.body.style.overflow="hidden";
  function cdraw(){$("#cms",sh).innerHTML=cms.length?cms.map(function(c){return '<div class="cm">'+avH()+'<div class="minw"><div class="sub">'+esc(c.n)+'</div><p>'+esc(c.t)+'</p></div></div>'}).join(""):'<p class="sub" style="margin:8px 0">Seja o primeiro a comentar.</p>'}
  cdraw();
  $("#cl",sh).onclick=function(){closeSheet();drawGrid()};
  $("#lk",sh).onclick=function(){st.liked["v"+v.id]=!st.liked["v"+v.id];lsSet("vx-liked",st.liked);$("#lkn",sh).textContent=fmt((v.likes||0)+(st.liked["v"+v.id]?1:0))};
  function vzLabel(){$("#vz",sh).textContent=v.vis==="private"?"Privado: tornar p\u00fablico":"P\u00fablico: tornar privado"}
  vzLabel();
  $("#vz",sh).onclick=function(){v.vis=v.vis==="private"?"public":"private";vzLabel();dbPut(v).catch(function(){});drawGrid();if(st.tab==="shorts")drawShorts();toast(v.vis==="private"?"V\u00eddeo agora \u00e9 privado":"V\u00eddeo agora \u00e9 p\u00fablico")};
  $("#dl",sh).onclick=function(){askDelete(v.id)};
  $("#cf",sh).onsubmit=function(e){e.preventDefault();var i=$("#ci",sh),t=i.value.trim();if(!t)return;cms.unshift({n:pName(),t:t});i.value="";cdraw()};
}
