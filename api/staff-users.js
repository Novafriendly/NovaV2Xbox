import {services} from '../server/voice-service.js';
export const createHandler=(getServices=services)=>async(req,res)=>{
 const reply=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};
 if(req.method!=='GET')return reply(405,{error:'Use GET.'});
 try{
  const {auth,db}=await getServices(false);let user;
  try{user=await auth.verifyIdToken((req.headers.authorization||'').replace(/^Bearer /,''),true);}catch{return reply(401,{error:'Sign in again to open the staff panel.'});}
  const [account,role,ban]=await Promise.all(['novaAccounts/'+user.uid,'novaChatV2/roles/'+user.uid,'novaChatV2/bans/'+user.uid].map(p=>db.ref(p).get()));
  if(user.firebase?.sign_in_provider==='anonymous'||!account.exists()||ban.exists()||!['owner','admin'].includes(role.val()))return reply(403,{error:'Owner or admin access is required.'});
  const cursor=new URL(req.url,'http://local').searchParams.get('after');
  if(cursor&&(cursor.length>128||/[.#$\[\]/]/.test(cursor)))return reply(400,{error:'Invalid page.'});
  let query=db.ref('novaAccounts').orderByKey();if(cursor)query=query.startAfter(cursor);
  const snapshot=await query.limitToFirst(101).get();const rows=[];snapshot.forEach(s=>rows.push({uid:s.key,name:s.val().name||'Nova member',createdAt:s.val().createdAt||null}));
  const more=rows.length>100;const users=rows.slice(0,100);return reply(200,{users,next:more?users.at(-1).uid:null});
 }catch{return reply(503,{error:'Account directory unavailable. Check FIREBASE_SERVICE_ACCOUNT_JSON on the server.'});}
};
export default createHandler();
