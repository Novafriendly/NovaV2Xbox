importScripts('/~/sj/controller/controller.sw.js');
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
// The controller owns response rewriting and transport. Never retry writes or
// turn missing resources into successful responses.
async function routeSafely(event){
 try{return await $scramjetController.route(event)}catch(error){
  if(!['GET','HEAD'].includes(event.request.method)||event.request.signal.aborted||!/connect|network|socket|closed|reset|fetch|timeout/i.test(String(error)))throw error;
  await new Promise(resolve=>setTimeout(resolve,300));
  return $scramjetController.route(event);
 }
}
self.addEventListener('fetch',e=>{if($scramjetController.shouldRoute(e))e.respondWith(routeSafely(e))});
self.addEventListener('message',e=>{if(e.data?.novaHealth)e.ports[0]?.postMessage({ok:true,revision:'nova-recovery-20260930'})});
