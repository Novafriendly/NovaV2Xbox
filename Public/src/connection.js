/* Shared Scramjet 2 startup for Search and the standalone game/app player. */
(()=>{
const base='/~/sj/',revision='20260926-1';let resources;
const deadline=(promise,ms,message)=>new Promise((resolve,reject)=>{const id=setTimeout(()=>reject(Error(message)),ms);promise.then(v=>{clearTimeout(id);resolve(v)},e=>{clearTimeout(id);reject(e)})});
const load=src=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=base+src+'?v='+revision;script.onload=resolve;script.onerror=()=>reject(Error('A connection component could not load. Refresh and try again.'));document.head.append(script)});
async function prepare(){
 if(!window.isSecureContext||!navigator.serviceWorker)throw Error('Open Nova over HTTPS, or on localhost. This browser cannot start the connection here.');
 const registration=await navigator.serviceWorker.register(base+'sw.js',{scope:base,updateViaCache:'none'});
 const active=registration.active||await deadline(new Promise(resolve=>{const worker=registration.installing||registration.waiting;const check=()=>{if(worker?.state==='activated')resolve(worker)};worker?.addEventListener('statechange',check);check()}),15000,'The connection worker did not start. Reload Nova.');
 await Promise.all([load('scram/scramjet.js'),load('clients/index.js')]);await load('controller/controller.api.js');
 return active;
}
async function create(options={}){
 resources??=prepare().catch(e=>{resources=null;throw e});const worker=await resources;
 const endpoint=localStorage.getItem('nova_wisp_url')||window.NOVA_WISP_URL||(['127.0.0.1','localhost'].includes(location.hostname)?'ws://127.0.0.1:8781/':'wss://wisp.mercurywork.shop/');
 const url=new URL(endpoint);if(!['ws:','wss:'].includes(url.protocol)||(location.protocol==='https:'&&url.protocol!=='wss:'))throw Error('Choose a secure wss:// transport server in Search settings.');
 if(!url.pathname.endsWith('/'))url.pathname+='/';
 const remote=new LibcurlTransport.LibcurlClient({wisp:url.href,connections:[32,24,6]});
 let initialization;
 const transport={get ready(){return remote.ready},init(){return initialization??=deadline(remote.init(),15000,'The curl connection did not start. Try again.').catch(e=>{initialization=null;throw e})},meta:()=>remote.meta(),connect:(...args)=>remote.connect(...args),async request(target,method,body,headers,signal){
  if(target.origin==='https://nova-content.invalid'&&target.pathname.startsWith('/content/')){
   const response=await fetch(new URL(target.pathname+target.search,location.origin),{method,body:['GET','HEAD'].includes(method)?undefined:body,signal,credentials:'omit',cache:'no-store'});
   return {body:response.body,headers:[...response.headers],status:response.status,statusText:response.statusText};
  }
  // Retry a transient connection failure once, only for reads. Never replay forms.
  for(let attempt=0;;attempt++)try{return await remote.request(target,method,body,headers,signal)}catch(error){if(attempt||!['GET','HEAD'].includes(method)||signal?.aborted||!/connect|code 35|code 56|socket/i.test(String(error))){options.onRequestError?.(target.href,error);throw error;}await new Promise(r=>setTimeout(r,250))}
 }};
 const controller=new $scramjetController.Controller({serviceworker:worker,transport,config:{prefix:base+'p/',injectPath:base+'controller/controller.inject.js',wasmPath:base+'scram/scramjet.wasm',scramjetPath:base+'scram/scramjet.js'}});
 await deadline(controller.wait(),20000,'The connection could not start. Check the transport server in Search settings.');return controller;
}
window.NovaConnection={create};
})();
