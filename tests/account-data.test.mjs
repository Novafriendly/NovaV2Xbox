import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
function client(seed={},cloud={}){
 const store=new Map(Object.entries(seed)),auth={currentUser:null},events=[],calls=[];
 let source=readFileSync('Public/src/account-data.js','utf8').replace(/^import .*;$/gm,'').replace(/export /g,'');
 const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const localStorage=new Proxy(storage,{ownKeys:()=>[...store.keys()],getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});
 const context={auth,localStorage,compactSlots:async()=>{},archived:async()=>null,captureGames:async()=>{},restoreGames:async()=>{},captureWebSession:async()=>{},restoreWebSession:async()=>{},setInterval(){},setTimeout(){},clearTimeout(){},addEventListener(){},document:{hidden:false,addEventListener(){}},dispatchEvent:e=>events.push(e),Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},fetch:async(_,options)=>{const body=JSON.parse(options.body);const user=options.headers.Authorization.slice(7);calls.push({user,...body});if(body.operation==='load')return {ok:true,json:async()=>({entries:Object.entries(cloud[user]||{}).map(([key,value])=>({key,value}))})};cloud[user]??={};for(const row of body.entries){if(row.value===null)delete cloud[user][row.key];else cloud[user][row.key]=row.value;}return {ok:true,json:async()=>({ok:true})};}};
 context.window=context;context.parent=context;vm.createContext(context);vm.runInContext(source,context);
 const login=async(uid,options)=>{auth.currentUser={uid,getIdToken:async()=>uid};await context.NovaAccountData.activate(auth.currentUser,options);};
 return {context,store,cloud,calls,login,localStorage};
}
test('new accounts start fresh and returning accounts restore their separate settings and game saves',async()=>{
 const c=client({nova_user:'one',nova_wallpaper:'one.jpg','nova-content.invalid@save':'one-save'});
 await c.login('one');await c.context.NovaAccountData.flush();
 await c.login('two',{fresh:true});assert.equal(c.store.has('nova_wallpaper'),false);assert.equal(c.store.has('nova-content.invalid@save'),false);
 c.localStorage.setItem('nova_wallpaper','two.jpg');c.localStorage.setItem('nova-content.invalid@save','two-save');await c.context.NovaAccountData.flush();
 await c.login('one');assert.equal(c.store.get('nova_wallpaper'),'one.jpg');assert.equal(c.store.get('nova-content.invalid@save'),'one-save');
 assert.equal(c.cloud.two.nova_wallpaper,'two.jpg');
});
test('another computer restores account data and excludes authentication credentials',async()=>{
 const c=client({}, {one:{nova_wallpaper:'cloud.jpg','nova-content.invalid@save':'cloud-save','firebase:authUser':'secret','site@access_token':'secret'}});
 await c.login('one');assert.equal(c.store.get('nova_wallpaper'),'cloud.jpg');assert.equal(c.store.get('nova-content.invalid@save'),'cloud-save');assert.equal(c.store.has('site@access_token'),false);
});
test('offline login keeps local backup and pending changes for retry',async()=>{
 const c=client({nova_user:'one',nova_wallpaper:'local.jpg'});c.context.fetch=async()=>{throw Error('offline')};await c.login('one');assert.equal(c.store.get('nova_wallpaper'),'local.jpg');assert(c.store.has('nova-account-data:one'));
});

test('a large or unavailable game backup does not block the current account',async()=>{const c=client({nova_user:'one',nova_wallpaper:'keep.jpg'});c.context.captureGames=async()=>{throw Error('Game saves exceed the current cloud backup limit.')};await c.login('one');assert.equal(c.store.get('nova_wallpaper'),'keep.jpg');});
