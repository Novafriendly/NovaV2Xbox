import {timingSafeEqual,createHash} from 'node:crypto';
import {services} from '../server/voice-service.js';
export default async function handler(req,res){
 const reply=(status,value)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value))};
 if(req.method!=='POST')return reply(405,{error:'Use POST.'});
 if(!process.env.NOVA_CHAT_OWNER_CODE)return reply(503,{error:'Owner setup is disabled. Set the private server setup code first.'});
 try{
 const {auth,db}=await services(false);const token=(req.headers.authorization||'').replace(/^Bearer /,'');const user=await auth.verifyIdToken(token,true);
 if(user.firebase?.sign_in_provider==='anonymous'||!(await db.ref('novaAccounts/'+user.uid).get()).exists())return reply(403,{error:'A new Nova account is required.'});
 let body=req.body;if(!body){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2048)return reply(413,{error:'Request too large.'})}body=JSON.parse(raw)}
 const hash=v=>createHash('sha256').update(String(v||'')).digest();if(!timingSafeEqual(hash(body.code),hash(process.env.NOVA_CHAT_OWNER_CODE)))return reply(403,{error:'Incorrect setup code.'});
 const result=await db.ref('novaChatV2/ownerClaim').transaction(current=>current?undefined:{uid:user.uid,claimedAt:Date.now()});
 if(!result.committed&&result.snapshot.val()?.uid!==user.uid)return reply(409,{error:'Owner setup has already been claimed.'});
 await db.ref('novaChatV2/roles/'+user.uid).set('owner');return reply(200,{ok:true});
 }catch{return reply(503,{error:'Owner setup could not complete. Check your sign-in and server Firebase admin configuration.'})}
}
