/* publicar v\u00eddeo */
function probe(file){return new Promise(function(res,rej){
  var u=URL.createObjectURL(file),v=document.createElement("video"),done=false;
  v.muted=true;v.playsInline=true;v.preload="metadata";
  function fail(){if(done)return;done=true;URL.revokeObjectURL(u);rej()}
  var to=setTimeout(fail,12000);
  v.onerror=fail;
  v.onloadedmetadata=function(){try{v.currentTime=Math.min(1,(v.duration||2)/2)}catch(e){}};
  v.onseeked=function(){
    if(done)return;done=true;clearTimeout(to);
    var w=v.videoWidth,h=v.videoHeight,c=document.createElement("canvas"),sc=Math.min(1,640/Math.max(w,h));
    c.width=Math.round(w*sc);c.height=Math.round(h*sc);
    var thumb="";try{c.getContext("2d").drawImage(v,0,0,c.width,c.height);thumb=c.toDataURL("image/jpeg",.72)}catch(e){}
    var d=v.duration;URL.revokeObjectURL(u);res({thumb:thumb,dur:d,vertical:h>w});
  };
  v.src=u;
})}
function openPublish(){
  closeMenu();
  if(!PROF){openProfileEdit(openPublish);return}
  var sh=$("#sheet"),info=null,file=null,cthumb=null,vis="public",subs="";
  sh.innerHTML='<div class="in"><div class="hdr"><button class="icon-btn" id="cl" aria-label="Voltar">'+ICON.back+'</button><h2>Publicar v\u00eddeo</h2></div>'+
   '<form class="sec" id="pf"><label class="pick" for="f">'+ICON.up+'<b style="color:var(--fg)">Escolher v\u00eddeo</b><span>Da galeria ou dos arquivos do aparelho</span><input id="f" type="file" accept="video/*"></label>'+
   '<div class="pv" id="pv" hidden><img id="pi" alt=""><div class="minw"><div id="pk"><b></b></div><div class="sub" id="pd"></div></div></div><p class="err" id="er" hidden></p>'+
   '<div class="field" id="thf" hidden><span class="lb">Miniatura</span><div class="thbtns"><label class="btn ghost" for="tf" style="cursor:pointer;position:relative">Escolher imagem<input id="tf" type="file" accept="image/*" style="position:absolute;width:1px;height:1px;opacity:0"></label><button type="button" class="btn ghost" id="trs" hidden>Usar quadro do v\u00eddeo</button></div><p class="help">Sem escolher, usamos um quadro do v\u00eddeo.</p></div>'+
   '<div class="field"><label for="tt">T\u00edtulo</label><input id="tt" maxlength="100" placeholder="D\u00ea um t\u00edtulo ao v\u00eddeo"></div>'+
   '<div class="field"><span class="lb">Legenda (opcional)</span><div class="thbtns"><label class="btn ghost" for="sf2" style="cursor:pointer;position:relative">Escolher .srt ou .vtt<input id="sf2" type="file" accept=".srt,.vtt,text/vtt" style="position:absolute;width:1px;height:1px;opacity:0"></label><button type="button" class="btn ghost" id="srm" hidden>Remover</button></div><p class="help" id="sfn">Sem legenda.</p></div>'+
   '<div class="field"><span class="lb">Visibilidade</span><div class="seg" id="vis"><button type="button" data-v="public" aria-pressed="true"><b>P\u00fablico</b><span>Aparece em V\u00eddeos e Shorts</span></button><button type="button" data-v="private" aria-pressed="false"><b>Privado</b><span>S\u00f3 voc\u00ea v\u00ea, no seu perfil</span></button></div></div>'+
   '<p class="sub">O v\u00eddeo fica salvo neste aparelho e neste navegador. N\u00e3o limpe os dados do navegador e guarde o arquivo original. Outras pessoas ainda n\u00e3o conseguem ver.</p>'+
   '<button class="btn block" id="go" type="submit" disabled>Publicar</button></form></div>';
  sh.hidden=false;sh.scrollTop=0;document.body.style.overflow="hidden";
  $("#cl",sh).onclick=closeSheet;
  var er=$("#er",sh),goBtn=$("#go",sh);
  $("#f",sh).onchange=function(){
    file=this.files&&this.files[0];if(!file)return;
    er.hidden=true;goBtn.disabled=true;info=null;cthumb=null;$("#thf",sh).hidden=true;$("#trs",sh).hidden=true;
    $("#pv",sh).hidden=false;$("#pk",sh).innerHTML="<b>Lendo o v\u00eddeo\u2026</b>";$("#pd",sh).textContent="";$("#pi",sh).removeAttribute("src");
    if(!$("#tt",sh).value)$("#tt",sh).value=file.name.replace(/\.[^.]+$/,"").slice(0,100);
    probe(file).then(function(r){
      info=r;$("#pi",sh).src=r.thumb;$("#pv",sh).classList.toggle("v",r.vertical);
      $("#pk",sh).innerHTML="<b>"+(r.vertical?"Vai para Shorts":"Vai para V\u00eddeos")+"</b>";
      $("#pd",sh).textContent=dur(r.dur)+" \u00b7 "+(file.size/1048576).toFixed(1).replace(".",",")+" MB";
      goBtn.disabled=false;$("#thf",sh).hidden=false;
    }).catch(function(){
      $("#pv",sh).hidden=true;er.textContent="N\u00e3o consegui abrir esse v\u00eddeo neste navegador. Tente um arquivo MP4.";er.hidden=false;
    });
  };
  $("#sf2",sh).onchange=function(){var f=this.files&&this.files[0];this.value="";if(!f)return;
    readSubs(f).then(function(t){subs=t;$("#sfn",sh).textContent="Legenda: "+f.name;$("#srm",sh).hidden=false}).catch(function(){toast("Arquivo de legenda inv\u00e1lido. Use .srt ou .vtt")})};
  $("#srm",sh).onclick=function(){subs="";$("#sfn",sh).textContent="Sem legenda.";this.hidden=true};
  $("#vis",sh).onclick=function(e){var b=e.target.closest("button");if(!b)return;vis=b.dataset.v;
    this.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",x===b)})};
  $("#tf",sh).onchange=function(){var f=this.files&&this.files[0];this.value="";if(!f||!info)return;
    var v=info.vertical;
    toCover(f,v?360:640,v?640:360,.85).then(function(t){cthumb=t;$("#pi",sh).src=t;$("#trs",sh).hidden=false;toast("Miniatura escolhida")}).catch(function(){toast("N\u00e3o consegui abrir essa imagem")})};
  $("#trs",sh).onclick=function(){cthumb=null;$("#pi",sh).src=info.thumb;this.hidden=true};
  $("#pf",sh).onsubmit=function(e){
    e.preventDefault();
    if(!info||!file||!DB){if(!DB){er.textContent="Este navegador n\u00e3o permite salvar v\u00eddeos.";er.hidden=false}return}
    var title=$("#tt",sh).value.trim()||"Sem t\u00edtulo",ch=pName();
    goBtn.disabled=true;goBtn.textContent="Salvando\u2026";
    var rec={id:Date.now(),title:title,ch:ch,kind:info.vertical?"short":"video",dur:info.dur,thumb:cthumb||info.thumb,blob:file,created:Date.now(),views:0,likes:0,vis:vis,subs:subs};
    dbPut(rec).then(function(){
      LIB.unshift(rec);closeSheet();drawGrid();go(rec.kind==="short"?"shorts":"videos");toast("V\u00eddeo publicado");
    }).catch(function(){
      goBtn.disabled=false;goBtn.textContent="Publicar";er.textContent="N\u00e3o coube no espa\u00e7o deste aparelho. Tente um v\u00eddeo menor.";er.hidden=false;
    });
  };
}

/* menu criar */
function closeMenu(){$("#menu").hidden=true;$("#menu").innerHTML=""}
function openMenu(){
  var m=$("#menu");
  m.innerHTML='<div class="card"><button class="opt" data-publish>'+ICON.up+'<span><b>Publicar v\u00eddeo</b><span class="sub">Envie da galeria do aparelho</span></span></button>'+
   '<button class="opt" data-newpost>'+ICON.note+'<span><b>Escrever post</b><span class="sub">Texto curto de at\u00e9 280 letras</span></span></button></div>';
  m.hidden=false;
}

/* perfil do canal */
var HUES=[175,210,265,330,18,45,130];
function updateProfBtn(){$("#prof").innerHTML=PROF?avH():ICON.user}
function updateMyAv(){$("#myavbox").innerHTML=avH()}
function cleanHandle(x){return String(x).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/^@+/,"").replace(/[^a-z0-9_.]/g,"").slice(0,20)}
function toAvatar(file){return new Promise(function(res,rej){
  var u=URL.createObjectURL(file),i=new Image();
  i.onload=function(){var m=Math.min(i.width,i.height),c=document.createElement("canvas");c.width=c.height=256;
    c.getContext("2d").drawImage(i,(i.width-m)/2,(i.height-m)/2,m,m,0,0,256,256);URL.revokeObjectURL(u);res(c.toDataURL("image/jpeg",.85))};
  i.onerror=function(){URL.revokeObjectURL(u);rej()};i.src=u;
})}
function toCover(file,w,h,q){return new Promise(function(res,rej){
  var u=URL.createObjectURL(file),i=new Image();
  i.onload=function(){var r=w/h,sw=i.width,sh=i.height;
    if(sw/sh>r)sw=sh*r;else sh=sw/r;
    var c=document.createElement("canvas");c.width=w;c.height=h;
    c.getContext("2d").drawImage(i,(i.width-sw)/2,(i.height-sh)/2,sw,sh,0,0,w,h);
    URL.revokeObjectURL(u);res(c.toDataURL("image/jpeg",q||.85))};
  i.onerror=function(){URL.revokeObjectURL(u);rej()};i.src=u;
})}
function bannerBg(p){return p.banner?"url("+p.banner+") center/cover":"linear-gradient(135deg,hsl("+p.hue+" 70% 45%),hsl("+(p.hue+50)+" 65% 28%))"}
function bigAv(p){return '<div class="bigav" style="background:hsl('+p.hue+' 55% 38%)">'+(p.avatar?'<img alt="" src="'+p.avatar+'">':esc(init(p.name||"V")))+'</div>'}
var ptab="videos";
function profCards(list){return '<div class="grid">'+list.map(function(v){return '<button class="vid" data-vid="'+v.id+'"><div class="thumb">'+(v.thumb?'<img alt="" src="'+v.thumb+'">':'')+(v.kind==="short"?'<span class="tag">Short</span>':'')+(v.vis==="private"?'<span class="tag priv">Privado</span>':'')+'<span class="dur">'+dur(v.dur)+'</span></div><div class="meta"><div class="minw"><h3>'+esc(v.title)+'</h3><div class="sub">'+fmt(v.views||0)+' views \u00b7 '+ago(v.created)+'</div></div></div></button>'}).join("")+'</div>'}
function profBody(){
  var all=LIB.slice().sort(function(a,b){return b.created-a.created});
  if(ptab==="posts")return POSTS.length?POSTS.map(function(p){return '<article class="post"><div class="body"><p>'+esc(p.t)+'</p><div class="sub">'+ago(p.id)+'</div></div></article>'}).join(""):'<p class="sub">Voc\u00ea ainda n\u00e3o escreveu posts.</p>';
  var l=all.filter(function(v){return v.kind===(ptab==="shorts"?"short":"video")});
  return l.length?profCards(l):'<p class="sub">'+(ptab==="shorts"?"Nenhum short publicado ainda.":"Nenhum v\u00eddeo publicado ainda.")+'</p>';
}
function openProfile(){
  if(!PROF){openProfileEdit();return}
  var nv=kind("video").length,ns=kind("short").length;
  var sh=$("#sheet");
  sh.innerHTML='<div class="in"><div class="banner" style="background:'+bannerBg(PROF)+'"><button class="close" id="cl" aria-label="Fechar">'+ICON.x+'</button></div>'+
   '<div class="sec"><div class="pavrow">'+bigAv(PROF)+'<div class="pacts"><button class="btn ghost" id="ed">Editar canal</button><button class="btn" data-publish>Publicar</button></div></div>'+
   '<h2 class="pn">'+esc(PROF.name)+'</h2><div class="pmeta"><span>@'+esc(PROF.handle)+'</span><span><b>'+nv+'</b> v\u00eddeos</span><span><b>'+ns+'</b> shorts</span><span><b>'+POSTS.length+'</b> posts</span></div>'+(PROF.bio?'<p class="bio">'+esc(PROF.bio)+'</p>':'')+
   '<div class="ptabs" role="tablist">'+[["videos","V\u00eddeos"],["shorts","Shorts"],["posts","Posts"]].map(function(t){return '<button role="tab" data-pt="'+t[0]+'" aria-selected="'+(t[0]===ptab)+'">'+t[1]+'</button>'}).join("")+'</div><div id="pbody">'+profBody()+'</div></div></div>';
  sh.hidden=false;sh.scrollTop=0;document.body.style.overflow="hidden";
  $("#cl",sh).onclick=closeSheet;
  $("#ed",sh).onclick=function(){openProfileEdit()};
  $(".ptabs",sh).onclick=function(e){var b=e.target.closest("button");if(!b)return;ptab=b.dataset.pt;
    this.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-selected",x===b)});$("#pbody",sh).innerHTML=profBody()};
}
function openProfileEdit(after){
  closeMenu();
  var first=!PROF;
  var d=PROF?{name:PROF.name,handle:PROF.handle,bio:PROF.bio||"",hue:PROF.hue,avatar:PROF.avatar||"",banner:PROF.banner||""}:{name:st.ch||"",handle:"",bio:"",hue:180,avatar:"",banner:""};
  var touched=!!d.handle,okH=/^[a-z0-9_.]{3,20}$/;
  var sh=$("#sheet");
  sh.innerHTML='<div class="in"><div class="hdr"><button class="icon-btn" id="cl" aria-label="Voltar">'+ICON.back+'</button><h2>'+(first?"Criar seu canal":"Editar canal")+'</h2></div>'+
   '<form class="sec" id="pfm"><div class="field" style="margin-top:4px"><span class="lb">Banner do canal</span><div class="bnprev" id="bn" style="background:'+bannerBg(d)+'"></div><div class="thbtns" style="margin-top:8px"><label class="btn ghost" for="bfile" style="cursor:pointer;position:relative">Escolher banner<input id="bfile" type="file" accept="image/*" style="position:absolute;width:1px;height:1px;opacity:0"></label><button type="button" class="btn ghost" id="brm"'+(d.banner?'':' hidden')+'>Remover banner</button></div></div><div class="edav"><div id="av">'+bigAv(d)+'</div><div style="display:flex;flex-direction:column;gap:8px"><label class="btn ghost" for="pfile" style="cursor:pointer;position:relative">Escolher foto<input id="pfile" type="file" accept="image/*" style="position:absolute;width:1px;height:1px;opacity:0"></label><button type="button" class="btn ghost" id="rm"'+(d.avatar?'':' hidden')+'>Remover foto</button></div></div>'+
   '<div class="field"><span class="lb">Cor do canal</span><div class="swatches" id="sws">'+HUES.map(function(h){return '<button type="button" class="sw" data-hue="'+h+'" aria-label="Cor '+h+'" aria-pressed="'+(h===d.hue)+'" style="background:hsl('+h+' 60% 42%)"></button>'}).join("")+'</div></div>'+
   '<div class="field"><label for="pn">Nome do canal</label><input id="pn" maxlength="30" placeholder="Ex.: Pesca do Z\u00e9" value="'+esc(d.name)+'" autocomplete="off"></div>'+
   '<div class="field"><label for="ph">Seu @</label><div class="hrow"><span>@</span><input id="ph" maxlength="20" placeholder="pescadoze" value="'+esc(d.handle)+'" autocomplete="off" autocapitalize="none" spellcheck="false"></div><p class="help" id="hh">3 a 20 caracteres: letras min\u00fasculas, n\u00fameros, _ ou .</p></div>'+
   '<div class="field"><label for="pbio">Sobre o canal</label><input id="pbio" maxlength="120" placeholder="Uma frase sobre voc\u00ea" value="'+esc(d.bio)+'" autocomplete="off"></div>'+
   '<p class="sub">O canal fica salvo neste aparelho. O @ ainda n\u00e3o \u00e9 \u00fanico entre pessoas.</p>'+
   '<button class="btn block" id="sv" type="submit" disabled>'+(first?"Criar canal":"Salvar")+'</button></form></div>';
  sh.hidden=false;sh.scrollTop=0;document.body.style.overflow="hidden";
  function preview(){$("#av",sh).innerHTML=bigAv(d);$("#bn",sh).style.background=bannerBg(d)}
  function validate(){
    var ok=d.name.trim().length>=2&&okH.test(d.handle);$("#sv",sh).disabled=!ok;
    $("#hh",sh).textContent=d.handle&&!okH.test(d.handle)?"Use pelo menos 3 caracteres: letras, n\u00fameros, _ ou .":"3 a 20 caracteres: letras min\u00fasculas, n\u00fameros, _ ou .";
  }
  $("#cl",sh).onclick=closeSheet;
  $("#pn",sh).oninput=function(){d.name=this.value;if(!touched){d.handle=cleanHandle(d.name);$("#ph",sh).value=d.handle}preview();validate()};
  $("#ph",sh).oninput=function(){touched=true;d.handle=cleanHandle(this.value);this.value=d.handle;validate()};
  $("#pbio",sh).oninput=function(){d.bio=this.value};
  $("#sws",sh).onclick=function(e){var b=e.target.closest("button");if(!b)return;d.hue=+b.dataset.hue;
    this.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",x===b)});preview()};
  $("#pfile",sh).onchange=function(){var f=this.files&&this.files[0];if(!f)return;
    toAvatar(f).then(function(a){d.avatar=a;preview();$("#rm",sh).hidden=false}).catch(function(){toast("N\u00e3o consegui abrir essa imagem")})};
  $("#bfile",sh).onchange=function(){var f=this.files&&this.files[0];this.value="";if(!f)return;
    toCover(f,960,360,.82).then(function(a){d.banner=a;preview();$("#brm",sh).hidden=false}).catch(function(){toast("N\u00e3o consegui abrir essa imagem")})};
  $("#brm",sh).onclick=function(){d.banner="";preview();this.hidden=true};
  $("#rm",sh).onclick=function(){d.avatar="";preview();this.hidden=true};
  $("#pfm",sh).onsubmit=function(e){
    e.preventDefault();if(!(d.name.trim().length>=2&&okH.test(d.handle)))return;
    PROF={name:d.name.trim(),handle:d.handle,bio:d.bio.trim(),hue:d.hue,avatar:d.avatar,banner:d.banner,created:PROF?PROF.created:Date.now()};
    lsSet("vx-profile",PROF);
    updateProfBtn();updateMyAv();drawGrid();drawPosts();if(st.tab==="shorts")drawShorts();
    closeSheet();toast(first?"Canal criado":"Canal atualizado");
    if(after)after();else if(first)openProfile();
  };
  validate();
}

/* eventos */
document.addEventListener("click",function(e){
  var menu=$("#menu");
  if(!menu.hidden&&e.target===menu){closeMenu();return}
  var t=e.target.closest("button");if(!t)return;
  if(t.dataset.tab){go(t.dataset.tab);return}
  if(t.dataset.vid){openVideo(t.dataset.vid);return}
  if(t.hasAttribute("data-publish")){openPublish();return}
  if(t.hasAttribute("data-newpost")){closeMenu();go("posts");setTimeout(function(){$("#ptxt").focus()},50);return}
  if(t.dataset.slike){var k=t.dataset.slike;st.liked["s"+k]=!st.liked["s"+k];lsSet("vx-liked",st.liked);
    var el=t.closest(".short"),on=st.liked["s"+k],s=LIB.filter(function(x){return x.id==k})[0];
    t.classList.toggle("liked",on);t.querySelector("span:last-child").textContent=fmt((s.likes||0)+(on?1:0));return}
  if(t.dataset.plike){var k2="p"+t.dataset.plike;st.liked[k2]=!st.liked[k2];lsSet("vx-liked",st.liked);drawPosts();return}
  if(t.dataset.pdel){POSTS=POSTS.filter(function(p){return String(p.id)!==t.dataset.pdel});lsSet("vx-posts",POSTS);drawPosts();return}
  if(t.dataset.del){askDelete(+t.dataset.del);return}
  if(t.hasAttribute("data-mute")){st.muted=!st.muted;document.querySelectorAll("#shortsbox video").forEach(function(v){v.muted=st.muted});
    document.querySelectorAll("[data-mute]").forEach(function(b){b.innerHTML='<span class="b">'+(st.muted?ICON.mute:ICON.vol)+'</span><span>'+(st.muted?"Mudo":"Som")+'</span>'});return}
  if(t.hasAttribute("data-tap")){var sh=t.closest(".short"),v=sh.querySelector("video");
    if(v.paused){v.play();sh.classList.remove("paused")}else{v.pause();sh.classList.add("paused")}return}
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"){if(!$("#menu").hidden)closeMenu();else if(!$("#sheet").hidden)closeSheet()}});
$("#q").addEventListener("input",function(){st.q=this.value;if(st.tab!=="videos")go("videos");drawGrid()});
$("#theme").addEventListener("click",function(){
  var r=document.documentElement,cur=r.getAttribute("data-theme");
  if(!cur)cur=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
  r.setAttribute("data-theme",cur==="dark"?"light":"dark");
});
$("#plus").addEventListener("click",openMenu);
$("#prof").addEventListener("click",openProfile);
var pt=$("#ptxt"),pb=$("#pbtn"),cn=$("#cnt");
pt.addEventListener("input",function(){
  var left=280-pt.value.length;cn.textContent=left;cn.classList.toggle("over",left<0);
  pb.disabled=!pt.value.trim()||left<0;
});
pb.addEventListener("click",function(){
  var t=pt.value.trim();if(!t||t.length>280)return;
  if(!PROF){openProfileEdit(function(){pb.click()});return}
  POSTS.unshift({id:Date.now(),t:t,l:0});lsSet("vx-posts",POSTS);
  pt.value="";cn.textContent="280";pb.disabled=true;drawPosts();toast("Post publicado");
});
window.addEventListener("hashchange",function(){var h=location.hash.slice(1);if(["videos","shorts","posts"].indexOf(h)>-1)go(h,true)});

updateProfBtn();updateMyAv();
drawGrid();drawPosts();
var h0=location.hash.slice(1);go(["videos","shorts","posts"].indexOf(h0)>-1?h0:"videos",true);
openDB().then(function(d){DB=d;return dbAll()}).then(function(all){LIB=all;drawGrid();if(st.tab==="shorts")drawShorts()}).catch(function(){dbOk=false});
