/* Legenda automatica (experimental): Whisper roda no proprio aparelho, via transformers.js */
var AUTO_LIB="https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
var AUTO_MODEL="Xenova/whisper-base";
var AUTO_MAX_MIN=15,AUTO_MAX_MB=150;
function vttTime(s){s=Math.max(0,s);var h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60;
  return (h<10?"0":"")+h+":"+(m<10?"0":"")+m+":"+r.toFixed(3).padStart(6,"0")}
function buildVtt(cues){
  var out="WEBVTT\n\n";
  cues.forEach(function(c,i){
    var end=Math.max(c[1],c[0]+1);if(cues[i+1])end=Math.min(end,cues[i+1][0]);
    if(end<=c[0])end=c[0]+1;
    out+=(i+1)+"\n"+vttTime(c[0])+" --> "+vttTime(end)+"\n"+c[2]+"\n\n"});
  return out}
async function autoSubs(v,c,say){
  if(v.blob.size>AUTO_MAX_MB*1048576||(v.dur||0)>AUTO_MAX_MIN*60)
    throw new Error("Muito longo para a legenda autom\u00e1tica (m\u00e1ximo "+AUTO_MAX_MIN+" minutos e "+AUTO_MAX_MB+" MB).");
  say("Lendo o \u00e1udio do v\u00eddeo\u2026");
  var buf=await v.blob.arrayBuffer(),ctx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:16000}),ab;
  try{ab=await ctx.decodeAudioData(buf)}catch(e){throw new Error("N\u00e3o consegui ler o \u00e1udio desse v\u00eddeo.")}
  finally{try{ctx.close()}catch(e){}}
  var n=ab.length,mono=new Float32Array(n),ch,i;
  for(ch=0;ch<ab.numberOfChannels;ch++){var d=ab.getChannelData(ch);for(i=0;i<n;i++)mono[i]+=d[i]/ab.numberOfChannels}
  if(c.stop)return null;
  say("Baixando o modelo (s\u00f3 na primeira vez, uns 80 MB)\u2026");
  var T,asr,files={};
  try{
    T=await import(AUTO_LIB);T.env.allowLocalModels=false;
    try{T.env.backends.onnx.wasm.proxy=true}catch(e){}
    asr=await T.pipeline("automatic-speech-recognition",AUTO_MODEL,{progress_callback:function(p){
      if(p&&p.status==="progress"&&p.file){files[p.file]=p;var l=0,t=0;for(var k in files){l+=files[k].loaded||0;t+=files[k].total||0}
        if(t)say("Baixando o modelo\u2026 "+Math.round(l/t*100)+"%")}}});
  }catch(e){throw new Error("N\u00e3o consegui baixar o modelo. Confira a internet e tente de novo.")}
  var SR=16000,W=30*SR,cues=[],o,out,off;
  for(o=0;o<n&&!c.stop;o+=W){
    say("Transcrevendo\u2026 "+Math.round(o/n*100)+"%");
    out=await asr(mono.slice(o,Math.min(n,o+W)),{language:"portuguese",task:"transcribe",return_timestamps:true});
    off=o/SR;
    (out.chunks||[]).forEach(function(k){var t=(k.text||"").trim();if(!t)return;
      var s=off+((k.timestamp&&k.timestamp[0])||0),e=(k.timestamp&&k.timestamp[1]!=null)?off+k.timestamp[1]:s+3;cues.push([s,e,t])});
  }
  if(c.stop)return null;
  if(!cues.length)throw new Error("N\u00e3o encontrei fala no v\u00eddeo.");
  return buildVtt(cues)}

/* pede ao navegador para nao apagar os videos salvos automaticamente */
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
