// Account snapshots belong in IndexedDB, not the small synchronous localStorage quota.
const NAME='__nova_account_cache',STORE='records';
let opening,queue=Promise.resolve();
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
export async function readCache(key){
 await queue;const db=await database();
 return new Promise((resolve,reject)=>{
  const req=db.transaction(STORE,'readonly').objectStore(STORE).get(key);
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
export function writeCache(key,value){
 // Preserve write order even when autosave and cloud sync finish close together.
 const job=queue.then(async()=>{
  const db=await database();
  await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,key);
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Account backup could not be saved.'));
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
  // A leftover legacy record must not overwrite a newer IndexedDB snapshot.
  if(await readCache(key)===undefined)await writeCache(key,value);
  // Only remove the old copy after the transaction has committed. A failed
  // migration leaves the original record untouched for recovery.
  if(localStorage.getItem(key)===raw)localStorage.removeItem(key);
 }
}
