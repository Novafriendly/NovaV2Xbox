import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
function local(seed={}){
 const data=new Map(Object.entries(seed));
 const api={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
 return {data,api,storage:new Proxy(api,{ownKeys:()=>[...data.keys()],getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})})};
}
function request(value){const req={};queueMicrotask(()=>{req.result=structuredClone(value);req.onsuccess?.()});return req}
function cacheRuntime(seed={}){
 const {data,storage}=local(seed),records=new Map(),state={failWrites:false};let created=false;
 const db={close(){},createObjectStore(){},transaction(_store,mode){const tx={};tx.objectStore=()=>({get:key=>request(records.get(key)),put(value,key){const copy=structuredClone(value);queueMicrotask(()=>{if(state.failWrites){tx.error=Error('Disk storage unavailable');tx.onabort?.()}else{records.set(key,copy);tx.oncomplete?.()}})}});return tx}};
 const indexedDB={open(){const req={};queueMicrotask(()=>{req.result=db;if(!created){created=true;req.onupgradeneeded?.()}req.onsuccess?.()});return req}};
 const context={indexedDB,localStorage:storage};vm.createContext(context);
 const source=readFileSync('Public/src/account-cache.js','utf8').replace(/export /g,'');vm.runInContext(source+'\nthis.api={readCache,writeCache,migrateAccountCaches};',context);
 return {api:context.api,data,records,state};
}
test('legacy account and private cookie backups migrate only after durable commit',async()=>{
 const c=cacheRuntime({'nova-account-data:one':JSON.stringify({values:{nova_wallpaper:'one'}}),'nova-account-cookies:one':JSON.stringify({stores:[]})});
 await c.api.migrateAccountCaches();assert.equal(c.data.size,0);assert.equal((await c.api.readCache('nova-account-data:one')).values.nova_wallpaper,'one');assert.equal(c.records.size,2);
});
test('failed IndexedDB migrations retain the original data and can be retried',async()=>{
 const legacy=JSON.stringify({values:{nova_wallpaper:'keep'}}),c=cacheRuntime({'nova-account-data:one':legacy});c.state.failWrites=true;
 await assert.rejects(c.api.migrateAccountCaches(),/unavailable/);assert.equal(c.data.get('nova-account-data:one'),legacy);assert.equal(c.records.size,0);
 c.state.failWrites=false;await c.api.migrateAccountCaches();assert.equal(c.data.size,0);assert.equal((await c.api.readCache('nova-account-data:one')).values.nova_wallpaper,'keep');
});
test('migration does not replace a newer backup and queued writes retain latest pending changes',async()=>{
 const c=cacheRuntime({'nova-account-data:one':JSON.stringify({values:{nova_wallpaper:'old'}})});
 await c.api.writeCache('nova-account-data:one',{values:{nova_wallpaper:'new'}});await c.api.migrateAccountCaches();
 assert.equal((await c.api.readCache('nova-account-data:one')).values.nova_wallpaper,'new');
 await Promise.all([c.api.writeCache('nova-account-data:one',{pending:{nova_wallpaper:'first'}}),c.api.writeCache('nova-account-data:one',{pending:{nova_wallpaper:'latest'}})]);
 assert.equal((await c.api.readCache('nova-account-data:one')).pending.nova_wallpaper,'latest');
});
function gameRuntime(failArchive=false){
 const {data,api,storage}=local({nova_game_save_manifest:'{"parts":1,"version":"old"}',nova_game_save_part_old_0:'old-save'}),archives=new Map();
 const quota=Object.assign(Error('Storage quota exceeded'),{name:'QuotaExceededError'});const originalSet=api.setItem;api.setItem=(key,value)=>{if(key.startsWith('nova_game_save_part_'))throw quota;originalSet(key,value)};
 const game={name:'unity_fs',version:1,objectStoreNames:['saves'],close(){},transaction(){return {objectStore(){return {keyPath:null,autoIncrement:false,indexNames:[],getAllKeys:()=>request(['save']),getAll:()=>request([{credits:42}])}}}}};
 const archive={close(){},createObjectStore(){},transaction(){const tx={};tx.objectStore=()=>({put(value,key){queueMicrotask(()=>{if(failArchive){tx.error=Error('Archive unavailable');tx.onabort?.()}else{archives.set(key,value);tx.oncomplete?.()}})}});return tx}};
 const indexedDB={databases:async()=>[{name:'unity_fs'}],open(name){const req={};queueMicrotask(()=>{req.result=name==='unity_fs'?game:archive;req.onupgradeneeded?.();req.onsuccess?.()});return req}};
 const context={indexedDB,localStorage:storage,crypto:webcrypto,TextEncoder,Blob,ArrayBuffer,Uint8Array,Date,btoa};vm.createContext(context);
 const source=readFileSync('Public/src/account-game-data.js','utf8').replace(/^import .*;$/gm,'').replace(/export /g,'');vm.runInContext(source+'\nthis.capture=captureGames;',context);
 return {capture:context.capture,data,archives};
}
test('game chunk quota overflow preserves the complete save in IndexedDB',async()=>{
 const c=gameRuntime();await c.capture();const manifest=JSON.parse(c.data.get('nova_game_save_manifest'));
 assert.equal(manifest.localOnly,true);assert.equal(manifest.parts,0);assert.equal(c.data.has('nova_game_save_part_old_0'),false);
 const save=JSON.parse(c.archives.get(manifest.version));assert.equal(save[0].stores[0].rows[0][1].credits,42);
});
test('game archive failure never discards the previous save or manifest',async()=>{
 const c=gameRuntime(true);await assert.rejects(c.capture(),/unavailable/);assert.equal(c.data.get('nova_game_save_part_old_0'),'old-save');assert.equal(JSON.parse(c.data.get('nova_game_save_manifest')).version,'old');
});
