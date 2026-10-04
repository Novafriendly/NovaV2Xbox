/* Shared Scramjet 2 startup for Search and the standalone game/app player. */
(()=>{
const base='/~/sj/',revision='nova-recovery-20260930';let resources;const workers=new WeakMap();
const deadline=(promise,ms,message)=>new Promise((resolve,reject)=>{const id=setTimeout(()=>reject(Error(message)),ms);promise.then(v=>{clearTimeout(id);resolve(v)},e=>{clearTimeout(id);reject(e)})});
const load=src=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=base+src+'?v='+revision;script.onload=resolve;script.onerror=()=>reject(Error('A connection component could not load. Refresh and try again.'));document.head.append(script)});
async function prepare(){
 if(!window.isSecureContext||!navigator.serviceWorker)throw Error('Open Nova over HTTPS, or on localhost. This browser cannot start the connection here.');
 await Promise.all([load('scram/scramjet.js'),load('clients/index.js')]);await load('controller/controller.api.js');await load('scram/scramjet-utils.js');

}
function preload(){return resources??=prepare().catch(e=>{resources=null;throw e})}
async function create(options={}){
 await preload();
 const registration=await navigator.serviceWorker.register(base+'sw.js',{scope:base,updateViaCache:'none'});
 const worker=await deadline(new Promise(resolve=>{const check=()=>{if(registration.active?.state==='activated')resolve(registration.active)};const watch=()=>{registration.installing?.addEventListener('statechange',check);registration.waiting?.addEventListener('statechange',check);check()};registration.addEventListener('updatefound',watch);watch()}),15000,'The connection worker did not start. Try again.');
 const url=new URL('/api/wisp/',location.origin);url.protocol=location.protocol==='https:'?'wss:':'ws:';
 if(!url.pathname.endsWith('/'))url.pathname+='/';
 let remote=new LibcurlTransport.LibcurlClient({wisp:url.href,connections:[32,24,6]});
 let initialization,reconnecting;
 const recover=()=>reconnecting??=(async()=>{options.onRecovery?.('Reconnecting…');remote=new LibcurlTransport.LibcurlClient({wisp:url.href,connections:[32,24,6]});initialization=null;await deadline(remote.init(),15000,'The connection is temporarily unavailable.');options.onRecovery?.('Connection restored.');})().finally(()=>{reconnecting=null});
 const gsnGateway=options.cloudProvider==='gsn'?window.NovaGSNCloud?.createGateway((...args)=>remote.request(...args),{onRecovery:options.onRecovery}):null;
 const transport={get ready(){return remote.ready},init(){return initialization??=deadline(remote.init(),15000,'The curl connection did not start. Try again.').catch(e=>{initialization=null;throw e})},meta:()=>remote.meta(),connect:(...args)=>remote.connect(...args),async request(target,method,body,headers,signal){
  // Omit Astra's click-stealing popup and its broken optional advertising loader.
  // Authentication and game APIs always keep the provider's original responses.
  if(options.cloudGame&&method==='GET'&&((target.hostname==='pl31545542.profitableratecpmnetwork.com'&&target.pathname.endsWith('.js'))||(target.origin==='https://js.rev.iq'&&target.pathname==='/astra-education.top')))return {body:'/* Popup overlay omitted in Nova Cloud Gaming. */',headers:[['Content-Type','text/javascript']],status:200,statusText:'OK'};
  if(target.origin==='https://nova-content.invalid'&&target.pathname.startsWith('/content/')){
   const response=await fetch(new URL(target.pathname+target.search,location.origin),{method,body:['GET','HEAD'].includes(method)?undefined:body,signal,credentials:'omit',cache:'default'});
   if(response.ok&&options.gameHack&&target.pathname===('/content/games/'+(options.gameHack===33?'33-ff.html':'34-fixed.html'))){const id=options.gameHack;const script=await fetch('/src/game-hack-inject.js',{cache:'default'}).then(r=>{if(!r.ok)throw Error('Credit tool could not load.');return r.text()});const key=id===33?'RetroBowl.0.savedata.ini':'RetroBowlCollege.0.savedata.ini';const html=await response.text();const injected='<script>'+script.replace('__NOVA_SAVE_KEY__',JSON.stringify(key)).replace('__NOVA_APPLY_TOKEN__',JSON.stringify(options.gameHackToken||'initial'))+'</script>';return {body:html+injected,headers:[...response.headers].filter(([name])=>!['content-length','content-encoding'].includes(name.toLowerCase())),status:response.status,statusText:response.statusText};}
   return {body:response.body,headers:[...response.headers],status:response.status,statusText:response.statusText};
  }
  // Retry a transient connection failure once, only for reads. Never replay forms.
  for(let attempt=0;;attempt++)try{const response=await (gsnGateway?gsnGateway(target,method,body,headers,signal):remote.request(target,method,body,headers,signal));if(options.cloudGame&&method==='GET'&&target.origin==='https://astra-education.top'&&/^\/assets\/math-sheets-[^/]+\.js$/.test(target.pathname)&&response.status===200)return window.NovaAstraCloud.patchRouter(response);return response}catch(error){if(attempt||!['GET','HEAD'].includes(method)||signal?.aborted||!/connect|code 18|code 35|code 56|code 92|partial file|HTTP\/2|socket|network|fetch|closed|reset|timeout/i.test(String(error))){options.onRequestError?.(target.href,error);throw error;}try{if(!/code 18|code 92|partial file|HTTP\/2/i.test(String(error)))await recover()}catch(recoveryError){options.onRequestError?.(target.href,recoveryError);throw recoveryError}await new Promise(r=>setTimeout(r,250))}
 }};
 const controller=new $scramjetController.Controller({serviceworker:worker,transport,config:{prefix:base+'p/',injectPath:base+'controller/controller.inject.js?v=nova-audio-20261004',wasmPath:base+'scram/scramjet.wasm',scramjetPath:base+'scram/scramjet.js'}});
 await deadline(controller.wait(),20000,'The connection could not start. Check the transport server in Search settings.');workers.set(controller,worker);controller.novaOptions=options;return controller;
}
async function ensure(controller){const registration=await navigator.serviceWorker.getRegistration(base);return registration?.active?.state==='activated'&&registration.active===workers.get(controller)?controller:create(controller.novaOptions||{})}
window.NovaConnection={create,ensure,prepare:preload};
})();
