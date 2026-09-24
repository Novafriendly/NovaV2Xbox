import {getApps,initializeApp,cert} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getDatabase} from 'firebase-admin/database';
export async function services(){
  if(!process.env.FIREBASE_SERVICE_ACCOUNT_JSON||!process.env.NOVA_OWNER_UIDS)throw Error('SETUP_REQUIRED');
  const app=getApps().find(a=>a.name==='nova-secure')||initializeApp({credential:cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),databaseURL:'https://nova-chat-43a18-default-rtdb.firebaseio.com'},'nova-secure');
  const db=getDatabase(app);
  // Reject inherited or descendant client write grants before privileged automation.
  const rules=JSON.parse((await db.getRules()).source).rules;
  const denied=(node,key)=>!Object.entries(node||{}).some(([k,v])=>k===key?v!==false:(v&&typeof v==='object'&&!denied(v,key)));
  if(['bans','novaModeration','novaSecureAccounts','novaSecureAppeals'].some(key=>!rules[key]||rules[key]['.write']!==false)||['novaSecureAccounts','novaSecureAppeals'].some(key=>rules[key]?.['.read']!==false)||Object.entries(rules).some(([key,node])=>key.startsWith('!==false||rules['.read']!==false||!denied(rules.bans,'.write')||!denied(rules.novaModeration,'.write')||!denied(rules.novaSecureAccounts,'.write')||!denied(rules.novaSecureAccounts,'.read')||!denied(rules.novaSecureAppeals,'.write')||!denied(rules.novaSecureAppeals,'.read'))throw Error('RULES_REQUIRED');
  return {db,auth:getAuth(app)};
}
export const owner=uid=>(process.env.NOVA_OWNER_UIDS||'').split(',').map(s=>s.trim()).includes(uid);
export const validAccount=s=>typeof s==='string'&&s.length>0&&s.length<=100&&!/[.#$\[\]/]/.test(s);
export const banPath=(account,scope)=>scope==='chat'?'bans/'+account:'novaModeration/'+account+'/siteBan';
export const fingerprint=value=>JSON.stringify(value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,fingerprint(value[key])])):value);
)&&(!denied(node,'.read')||!denied(node,'.write'))))throw Error('RULES_REQUIRED');
  if(rules['.write']!==false||rules['.read']!==false||!denied(rules.bans,'.write')||!denied(rules.novaModeration,'.write')||!denied(rules.novaSecureAccounts,'.write')||!denied(rules.novaSecureAccounts,'.read')||!denied(rules.novaSecureAppeals,'.write')||!denied(rules.novaSecureAppeals,'.read'))throw Error('RULES_REQUIRED');
  return {db,auth:getAuth(app)};
}
export const owner=uid=>(process.env.NOVA_OWNER_UIDS||'').split(',').map(s=>s.trim()).includes(uid);
export const validAccount=s=>typeof s==='string'&&s.length>0&&s.length<=100&&!/[.#$\[\]/]/.test(s);
export const banPath=(account,scope)=>scope==='chat'?'bans/'+account:'novaModeration/'+account+'/siteBan';
export const fingerprint=value=>JSON.stringify(value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,fingerprint(value[key])])):value);
