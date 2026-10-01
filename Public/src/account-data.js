import {captureGames,restoreGames,captureWebSession,restoreWebSession} from './account-game-data.js';
import {auth} from './account-firebase.js';
const META='nova-account-data:',OWNER='nova-data-owner';
const identity=new Set(['nova_user','nova_username','nova_account_version']);
export const managed=key=>!identity.has(key)&&!/^nova_(pin|server_progress|server_coins|owner_code)/.test(key)&&!/(?:firebase|password|credential|access.?token|refresh.?token|auth.?token|cookie|session.?token)/i.test(key)&&(key.startsWith('nova_')||/^nova-(ai-chats|v2-favorites|v2-recent-|search)/.test(key)||key.includes('@'));
const snapshot=()=>Object.fromEntries(Object.keys(localStorage).filter(managed).map(key=>[key,localStorage.getItem(key)]));
const read=uid=>{try{return JSON.parse(localStorage.getItem(META+uid)||'{}')}catch{return {}}};
let uid=null,baseline={},pending={},timer,saving,restoring=false,gameCapture;
async function capture(){if(!gameCapture)gameCapture=captureGames().finally(()=>gameCapture=null);return gameCapture;}
async function request(user,operation,entries){const response=await fetch('/api/owner-control',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await user.getIdToken()},body:JSON.stringify({action:'accountData',operation,entries})});const data=await response.json();if(!response.ok)throw Error(data.error||'Account backup is unavailable.');return data;}
function saveLocal(){if(uid)localStorage.setItem(META+uid,JSON.stringify({...read(uid),values:snapshot(),pending,localPin:localStorage.getItem('nova_pin')}));}
function changed(){if(!uid||restoring)return;const now=snapshot();if(JSON.stringify(now)===JSON.stringify(baseline))return;for(const key of new Set([...Object.keys(baseline),...Object.keys(now)])){if(baseline[key]!==now[key])pending[key]=now[key]??null;}baseline=now;saveLocal();clearTimeout(timer);if(Object.keys(pending).length)timer=setTimeout(()=>flush().catch(()=>{}),1500);}
export async function flush(){clearTimeout(timer);if(saving){await saving;return flush();}if(!uid||auth.currentUser?.uid!==uid)return;
 await capture();changedWithoutScheduling();const user=auth.currentUser,owner=uid;
 saving=(async()=>{const rows=Object.entries(pending).sort(([a,av],[b,bv])=>{const priority=(k,v)=>v===null?2:k==='nova_game_save_manifest'?1:0;return priority(a,av)-priority(b,bv)});let batch=[],size=0;
 async function send(){if(!batch.length)return;const sent=batch;await request(user,'save',sent);if(uid===owner)for(const {key,value}of sent)if(pending[key]===value)delete pending[key];batch=[];size=0;saveLocal();}
 for(const [key,value]of rows){const entry={key,value},length=JSON.stringify(entry).length;if(length>180000){dispatchEvent(new CustomEvent('nova-sync-status',{detail:{state:'limited',message:'A large local save could not be backed up.'}}));continue;}if(size+length>190000||batch.length>=90)await send();batch.push(entry);size+=length;}
 await send();dispatchEvent(new CustomEvent('nova-sync-status',{detail:{state:'saved'}}));})().catch(error=>{saveLocal();dispatchEvent(new CustomEvent('nova-sync-status',{detail:{state:'offline',message:error.message}}));throw error;}).finally(()=>saving=null);return saving;
}
function changedWithoutScheduling(){const now=snapshot();for(const key of new Set([...Object.keys(baseline),...Object.keys(now)]))if(baseline[key]!==now[key])pending[key]=now[key]??null;baseline=now;saveLocal();}
export async function activate(user,{fresh=false}={}){
 if(parent!==window&&parent.NovaAccountData){await parent.NovaAccountData.activate(user);return;}
 if(uid===user.uid)return;restoring=true;
 const previous=localStorage.getItem(OWNER)||localStorage.getItem('nova_user');
 if(previous)try{await capture();await captureWebSession(previous)}catch(error){restoring=false;throw error;}
 if(previous&&previous!==user.uid){const prior=read(previous),values=snapshot(),queued={...(prior.pending||{})};for(const key of new Set([...Object.keys(prior.values||{}),...Object.keys(values)]))if(prior.values?.[key]!==values[key])queued[key]=values[key]??null;localStorage.setItem(META+previous,JSON.stringify({values,pending:queued,localPin:localStorage.getItem('nova_pin')}));}
 const local=read(user.uid);let values=local.values||{};pending=local.pending||{};
 if(previous===user.uid&&local.values){const current=snapshot();for(const key of new Set([...Object.keys(local.values),...Object.keys(current)]))if(local.values[key]!==current[key])pending[key]=current[key]??null;values=current;}
 // Adopt existing browser data only for its established owner, never a new account.
 if(!fresh&&!local.values&&previous===user.uid){values=snapshot();pending={...values,...pending};}
 if(fresh){values={};pending={};}
 let cloudError;
 try{const cloud=await request(user,'load');values=Object.fromEntries((cloud.entries||[]).filter(e=>managed(e.key)&&typeof e.value==='string').map(e=>[e.key,e.value]));for(const [key,value]of Object.entries(pending)){if(value===null)delete values[key];else values[key]=value;}}
 catch(error){cloudError=error;}
 try{for(const key of Object.keys(localStorage).filter(managed))localStorage.removeItem(key);for(const [key,value]of Object.entries(values))if(managed(key))localStorage.setItem(key,value);uid=user.uid;localStorage.removeItem('nova_pin');if(!fresh&&local.localPin)localStorage.setItem('nova_pin',local.localPin);localStorage.setItem(OWNER,uid);baseline=snapshot();saveLocal();await restoreGames();if(previous!==user.uid)await restoreWebSession(user.uid);}
 finally{restoring=false;}
 dispatchEvent(new Event('storage'));dispatchEvent(new CustomEvent('nova-sync-status',{detail:{state:cloudError?'offline':'ready',message:cloudError?.message}}));
 if(!cloudError&&Object.keys(pending).length)flush().catch(()=>{});
}
// Polling also observes writes inside proxied frames, which have separate JS realms.
setInterval(()=>{if(uid&&!document.hidden)changed()},5000);
setInterval(()=>{if(uid&&!document.hidden)capture().then(changed).catch(error=>dispatchEvent(new CustomEvent('nova-sync-status',{detail:{state:'limited',message:error.message}})))},60000);
addEventListener('storage',event=>{if(event.key===OWNER&&uid&&event.newValue!==uid){uid=null;location.replace('home.html');return;}if(!restoring)changed()});
addEventListener('pagehide',()=>{if(uid){changedWithoutScheduling();flush().catch(()=>{})}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&uid){changedWithoutScheduling();flush().catch(()=>{})}});
window.NovaAccountData={activate,flush};
