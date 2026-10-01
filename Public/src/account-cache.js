// Account snapshots belong in IndexedDB, not the small synchronous localStorage quota.
const NAME='__nova_account_cache',STORE='records',FORMAT='nova-json-chunks-1',CHUNK=8192;
let opening,queue=Promise.resolve();
export const isUnreadableRecord=error=>error?.code==='NOVA_CACHE_UNREADABLE'||/failed to read large indexeddb value|data lost due to missing file/i.test(error?.message||'');
function unreadable(){const error=Error('The local account backup could not be read.');error.code='NOVA_CACHE_UNREADABLE';return error;}
const chunkKey=(key,index)=>['nova-cache-chunk',key,index];
const recordKey=key=>['nova-cache-record',key];
function database(){
 if(!opening)opening=new Promise((resolve,reject)=>{
  const req=indexedDB.open(NAME,1);
  req.onupgradeneeded=()=>req.result.createObjectStore(STORE);
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();opening=null};resolve(db)};
  req.onerror=()=>{opening=null;reject(req.error)};
  req.onblocked=()=>{opening=null;reject(Error('Close other Nova tabs to finish updating account storage.'))};
 });
 return opening;
}
function readRecord(db,key){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly'),store=tx.objectStore(STORE),req=store.get(recordKey(key));
  tx.onabort=()=>reject(tx.error||unreadable());tx.onerror=()=>reject(tx.error||unreadable());
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{
   const value=req.result;
   if(value===undefined){const legacy=store.get(key);legacy.onerror=()=>reject(legacy.error);legacy.onsuccess=()=>resolve(legacy.result);return;}
   // Old structured-clone snapshots remain readable; new large snapshots use
   // small strings so the browser need not unwrap one large external value.
   if(value?.format!==FORMAT){reject(unreadable());return;}
   if(!Number.isSafeInteger(value.parts)||value.parts<1||value.parts>1000000){reject(unreadable());return;}
   const parts=new Array(value.parts);let remaining=value.parts;
   for(let i=0;i<value.parts;i++){
    const part=store.get(chunkKey(key,i));part.onerror=()=>reject(part.error);
    part.onsuccess=()=>{if(typeof part.result!=='string'){reject(unreadable());return;}parts[i]=part.result;if(--remaining===0){const text=parts.join('');if(text.length!==value.length){reject(unreadable());return;}try{resolve(JSON.parse(text))}catch{reject(unreadable())}}};
   }
  };
 });
}
export async function readCache(key){
 await queue;
 for(let attempt=0;;attempt++){
  const db=await database();
  try{return await readRecord(db,key)}catch(error){
   if(attempt||!isUnreadableRecord(error))throw error;
   // Retry transient browser file reads once with a fresh connection. Never
   // delete an unreadable record: activation can recover from cloud/current data.
   db.close();opening=null;
  }
 }
}
export function writeCache(key,value){
 // These account/preference and controller-cookie snapshots are JSON data.
 // Serialize before queuing so later caller mutations cannot change the backup.
 const text=JSON.stringify(value);if(typeof text!=='string')return Promise.reject(Error('Account backup must contain valid data.'));
 const job=queue.then(async()=>{
  const db=await database();
  await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Account backup could not be saved.'));
   // Reading keys does not load legacy large values. Replacing chunks and the
   // manifest in one transaction preserves the old backup on any failed write.
   // Separate manifest keys leave old unreadable legacy records untouched.
   const keys=store.getAllKeys(IDBKeyRange.bound(chunkKey(key,0),chunkKey(key,Number.MAX_SAFE_INTEGER)));
   keys.onerror=()=>reject(keys.error);
   keys.onsuccess=()=>{
    try{
     for(const old of keys.result)store.delete(old);
     const count=Math.ceil(text.length/CHUNK);
     for(let i=0;i<count;i++)store.put(text.slice(i*CHUNK,(i+1)*CHUNK),chunkKey(key,i));
     store.put({format:FORMAT,parts:count,length:text.length},recordKey(key));
    }catch(error){tx.abort();reject(error);}
   };
  });
 });
 queue=job.catch(()=>{});return job;
}
export async function migrateAccountCaches(){
 for(const key of Object.keys(localStorage)){
  if(!/^(nova-account-data:|nova-account-cookies:)/.test(key))continue;
  const raw=localStorage.getItem(key);let value;
  try{value=JSON.parse(raw)}catch{continue;}
  if(!value||typeof value!=='object')continue;
  let saved;try{saved=await readCache(key)}catch(error){if(!isUnreadableRecord(error))throw error;}
  // A readable newer record wins; a damaged record can recover from its legacy copy.
  if(saved===undefined)await writeCache(key,value);
  // Only remove the old copy after a complete durable replacement is available.
  if(localStorage.getItem(key)===raw)localStorage.removeItem(key);
 }
}
