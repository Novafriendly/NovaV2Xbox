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
 const {data,storage}=local(seed),records=new Map(),state={failWrites:false,readFailures:new Map(),reads:new Map(),opens:0};let created=false;
 const identity=key=>Array.isArray(key)?JSON.stringify(key):key;
 const db={close(){},createObjectStore(){},transaction(_store,mode){
  const tx={},updates=new Map();let scheduled=false;
  const commit=()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{if(state.failWrites){tx.error=Error('Disk storage unavailable');tx.onabort?.()}else{for(const [key,entry]of updates)entry.deleted?records.delete(key):records.set(key,entry.value);tx.oncomplete?.()}})};
  tx.objectStore=()=>({
   get(key){key=identity(key);const req={};state.reads.set(key,(state.reads.get(key)||0)+1);queueMicrotask(()=>{const failure=state.readFailures.get(key);if(failure?.times){failure.times--;req.error=failure.error;req.onerror?.();return;}req.result=structuredClone(records.get(key));req.onsuccess?.()});return req;},
   getAllKeys(range){return request([...records.keys()].filter(key=>{if(!key.startsWith('['))return false;const parts=JSON.parse(key);return parts[0]===range.lower[0]&&parts[1]===range.lower[1]}).map(JSON.parse));},
   delete(key){updates.set(identity(key),{deleted:true});commit();},
   put(value,key){updates.set(identity(key),{value:structuredClone(value)});commit();}
  });return tx;
 }};
 const indexedDB={open(){state.opens++;const req={};queueMicrotask(()=>{req.result=db;if(!created){created=true;req.onupgradeneeded?.()}req.onsuccess?.()});return req}};
 const context={indexedDB,IDBKeyRange:{bound:(lower,upper)=>({lower,upper})},localStorage:storage};vm.createContext(context);
 const source=readFileSync('Public/src/account-cache.js','utf8').replace(/export /g,'');vm.runInContext(source+'\nthis.api={readCache,writeCache,migrateAccountCaches};',context);
 return {api:context.api,data,records,state};
}

test('legacy account and private cookie backups migrate only after durable commit',async()=>{
 const c=cacheRuntime({'nova-account-data:one':JSON.stringify({values:{nova_wallpaper:'one'}}),'nova-account-cookies:one':JSON.stringify({stores:[]})});
 await c.api.migrateAccountCaches();assert.equal(c.data.size,0);assert.equal((await c.api.readCache('nova-account-data:one')).values.nova_wallpaper,'one');assert.equal(c.records.size,4);
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

const largeReadError=()=>Object.assign(Error('Failed to read large IndexedDB value'),{name:'UnknownError'});
test('large Unicode snapshots round-trip in small records and replacements remove old chunks atomically',async()=>{
 const c=cacheRuntime(),key='nova-account-data:one',value={values:{nova_wallpaper:'🌌'.repeat(550000)},pending:{'site@save':'pending'}};
 await c.api.writeCache(key,value);assert.deepEqual(structuredClone(await c.api.readCache(key)),value);
 assert(c.records.size>100);for(const [recordKey,part]of c.records)if(JSON.parse(recordKey)[0]==='nova-cache-chunk'){assert.equal(typeof part,'string');assert(part.length<=8192);}
 c.state.failWrites=true;await assert.rejects(c.api.writeCache(key,{values:{nova_wallpaper:'new'}}),/unavailable/);assert.deepEqual(structuredClone(await c.api.readCache(key)),value);
 c.state.failWrites=false;await c.api.writeCache(key,{values:{nova_wallpaper:'new'}});assert.equal(c.records.size,2);assert.equal((await c.api.readCache(key)).values.nova_wallpaper,'new');
});
test('legacy IndexedDB records still load and a transient large-value read gets one reconnect',async()=>{
 const c=cacheRuntime(),key='nova-account-data:one';c.records.set(key,{values:{nova_wallpaper:'legacy'}});c.state.readFailures.set(key,{times:1,error:largeReadError()});
 assert.equal((await c.api.readCache(key)).values.nova_wallpaper,'legacy');assert.equal(c.state.reads.get(key),2);assert.equal(c.state.opens,2);assert.equal(c.records.size,1);
});
test('persistent unreadable records are retained, and missing chunks never become an empty account',async()=>{
 const c=cacheRuntime(),key='nova-account-data:one';c.records.set(key,{values:{nova_wallpaper:'keep'}});c.state.readFailures.set(key,{times:Infinity,error:largeReadError()});
 await assert.rejects(c.api.readCache(key),/Failed to read large/);assert.equal(c.state.reads.get(key),2);assert.equal(c.records.get(key).values.nova_wallpaper,'keep');
 c.state.readFailures.clear();await c.api.writeCache(key,{values:{nova_wallpaper:'large'.repeat(20000)}});c.records.delete(JSON.stringify(['nova-cache-chunk',key,0]));
 await assert.rejects(c.api.readCache(key),error=>error.code==='NOVA_CACHE_UNREADABLE');assert(c.records.has(key));
});
test('an unreadable IndexedDB cache recovers from a legacy localStorage copy without reading the damaged value during commit',async()=>{
 const key='nova-account-data:one',c=cacheRuntime({[key]:JSON.stringify({values:{nova_wallpaper:'legacy'}})});c.records.set(key,{values:{nova_wallpaper:'damaged-old-copy'}});c.state.readFailures.set(key,{times:2,error:largeReadError()});
 await c.api.migrateAccountCaches();assert.equal(c.data.has(key),false);assert.equal((await c.api.readCache(key)).values.nova_wallpaper,'legacy');assert.equal(c.records.get(key).values.nova_wallpaper,'damaged-old-copy');
});
