import {createHash} from 'node:crypto';
const key=s=>createHash('sha256').update(s).digest('hex');
export async function accountData(db,uid,body){
 const root=db.ref('novaPrivateData/'+uid);
 if(body.operation==='load')return {entries:Object.values((await root.get()).val()?.entries||{})};
 if(body.operation!=='save'||!Array.isArray(body.entries)||body.entries.length>100)throw Error('Invalid account backup.');
 const changes=[];
 for(const entry of body.entries){
  if(!entry||typeof entry.key!=='string'||entry.key.length>512||!entry.key.length||!(entry.value===null||typeof entry.value==='string')||entry.value?.length>180000)throw Error('Account backup entry is too large or invalid.');
  changes.push([key(entry.key),entry.value===null?null:{key:entry.key,value:entry.value}]);
 }
 let oversized=false;const result=await root.transaction(current=>{const next={entries:{...(current?.entries||{})},updatedAt:Date.now()};for(const [key,value]of changes){if(value===null)delete next.entries[key];else next.entries[key]=value;}if(Object.keys(next.entries).length>4000||JSON.stringify(next).length>8000000){oversized=true;return;}oversized=false;return next;});if(oversized||!result.committed)throw Error('Account backup is too large.');return {ok:true};
}
