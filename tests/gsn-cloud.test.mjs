import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../Public/src/gsn-cloud-launch.js',import.meta.url),'utf8');
function runtime(){const window={};vm.runInNewContext(source,{window,URL,DOMException,setTimeout:fn=>{queueMicrotask(fn);return 1},clearTimeout(){}});return window.NovaGSNCloud}
const gateway=name=>new URL('https://gsnproxy.b-cdn.net/releases/browser-20261001-1/api/console-cloud/'+name);
test('maps only the published GSN endpoints and their allowed methods',()=>{
 const api=runtime();const paths={games:'games',queue:'getQueue',session:'createSession',start:'startGame',ping:'pingSession',quit:'quitSession'};
 for(const [name,path] of Object.entries(paths)){const method=['games','queue'].includes(name)?'GET':'POST';assert.equal(api.endpoint(gateway(name),method).href,'https://cherrion.top/api/cloud/'+path);assert.equal(api.endpoint(gateway(name),method==='GET'?'POST':'GET'),null)}
 assert.equal(api.endpoint(gateway('unknown'),'POST'),null);assert.equal(api.endpoint(new URL('https://other.example'+gateway('games').pathname),'GET'),null);
 assert.equal(api.endpoint(gateway('queue?uuid=test-session'),'GET').search,'?uuid=test-session');
});
test('retries a missing catalog once then uses the declared backend; sends each session write once',async()=>{
 const calls=[],recoveries=[];const request=async(...args)=>{calls.push(args);return {status:args[0].origin==='https://cherrion.top'?200:404,body:'provider response'}};
 const proxy=runtime().createGateway(request,{onRecovery:message=>recoveries.push(message)});
 const headers=[['Cookie','private-provider-cookie'],['Authorization','private-provider-token'],['Host','gsnproxy.b-cdn.net'],['Content-Type','application/json']];
 assert.equal((await proxy(gateway('games'),'GET',null,headers)).status,200);
 assert.deepEqual(calls.map(([url])=>url.href),[gateway('games').href,gateway('games').href,'https://cherrion.top/api/cloud/games']);assert.equal(recoveries.length,1);
 assert.deepEqual(calls[2][3],[['Content-Type','application/json']]);
 for(const [name,path] of Object.entries({session:'createSession',start:'startGame',ping:'pingSession',quit:'quitSession'})){
  const count=calls.length,body='{"uuid":"test-session"}';await proxy(gateway(name),'POST',body,headers);assert.equal(calls.length,count+1);assert.equal(calls.at(-1)[0].pathname,'/api/cloud/'+path);assert.equal(calls.at(-1)[2],body);
 }
});
test('a transient catalog 404 can recover without switching backends',async()=>{
 const calls=[];const proxy=runtime().createGateway(async(url)=>{calls.push(url.href);return {status:calls.length===1?404:200}});
 assert.equal((await proxy(gateway('games'),'GET')).status,200);await proxy(gateway('session'),'POST','body');assert.deepEqual(calls,[gateway('games').href,gateway('games').href,gateway('session').href]);
});
test('auth/membership errors are preserved and session errors never trigger automatic reservation retries',async()=>{
 for(const status of [401,403,429,500]){
  let calls=0;const response={status,body:'original error'},proxy=runtime().createGateway(async()=>{calls++;return response});
  assert.equal(await proxy(gateway('games'),'GET'),response);assert.equal(calls,1);
 }
 let calls=0;const proxy=runtime().createGateway(async()=>{calls++;return {status:404}});assert.equal((await proxy(gateway('session'),'POST')).status,404);assert.equal(calls,1);
 const denied=runtime().createGateway(async url=>({status:url.origin==='https://cherrion.top'?403:404}));assert.equal((await denied(gateway('games'),'GET')).status,403);
});
test('unrelated requests and an aborted recovery are left alone',async()=>{
 const calls=[];const controller=new AbortController();const proxy=runtime().createGateway(async(...args)=>{calls.push(args);return {status:404}},{onRecovery:()=>controller.abort()});
 const unknown=new URL('https://other.example/file');await proxy(unknown,'GET',null,[['Cookie','unchanged']]);assert.equal(calls.length,1);assert.deepEqual(calls[0][3],[['Cookie','unchanged']]);
 await assert.rejects(proxy(gateway('games'),'GET',null,[],controller.signal),{name:'AbortError'});assert.equal(calls.length,2);
});
function documentFixture(){
 let notify,exited;const boot={hidden:false,dataset:{}},status={textContent:'Preparing your cloud session…'};let disconnects=0;
 const win={MutationObserver:class{constructor(fn){notify=fn}observe(){}disconnect(){disconnects++}},addEventListener(_type,fn){exited=fn},removeEventListener(){}};
 const doc={defaultView:win,getElementById:id=>id==='boot'?boot:id==='status'?status:null};
 return{doc,boot,status,update:()=>notify(),exit:()=>exited(),get disconnects(){return disconnects}};
}
test('GSN loading follows queue/status updates and ends only when the stream is shown',()=>{
 const api=runtime(),f=documentFixture(),messages=[];let ready=0,error=0;
 assert.equal(api.attach(f.doc,{onStatus:m=>messages.push(m),onReady:()=>ready++,onError:()=>error++}),true);assert.equal(ready,0);
 f.status.textContent='Waiting for a server · Queue 4';f.update();assert.equal(ready,0);assert.equal(messages.at(-1),f.status.textContent);
 f.boot.hidden=true;f.update();f.update();assert.equal(ready,1);assert.equal(error,0);assert.equal(f.disconnects,1);
});
test('terminal provider errors reveal its retry UI, and page exit removes loading observers',()=>{
 const api=runtime(),f=documentFixture();let ready=0,error;
 api.attach(f.doc,{onReady:()=>ready++,onError:m=>error=m});f.boot.dataset.state='error';f.status.textContent='Provider unavailable (403)';f.update();assert.equal(error,f.status.textContent);assert.equal(ready,0);assert.equal(f.disconnects,1);
 const other=documentFixture();api.attach(other.doc);other.exit();assert.equal(other.disconnects,1);
 const missing={defaultView:{},getElementById:()=>null};assert.equal(api.attach(missing),false);
});
