// Public address only; credentials stay on the primary deployment.
export const SHARED_BACKEND='https://novaoffical.vercel.app';
const endpoints=new Set(['account-login','owner-control','chat-owner','staff-users','voice','voice-account','remote','music']);
export function withSharedBackend(endpoint,handler,{env=process.env,request=fetch}={}){
 if(!endpoints.has(endpoint))throw Error('Unsupported shared endpoint');
 return async(req,res)=>{
  const host=String(req.headers?.host||'').toLowerCase();
  if(env.FIREBASE_SERVICE_ACCOUNT_JSON||host===new URL(SHARED_BACKEND).host)return handler(req,res);
  const reply=(status,error)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error}))};
  if(req.headers?.['x-nova-shared-hop'])return reply(503,'The primary Nova backend needs its server configuration.');
  if(!['POST','GET'].includes(req.method))return reply(405,'Unsupported request method.');
  try{
   let body;if(req.method==='POST'){
    if(req.body!==undefined)body=typeof req.body==='string'?req.body:JSON.stringify(req.body);
    else{body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>250000)return reply(413,'Request too large.')}}
    if(Buffer.byteLength(body)>250000)return reply(413,'Request too large.');
   }
   const headers={'Content-Type':'application/json','X-Nova-Shared-Hop':'1'};
   if(req.headers?.authorization)headers.Authorization=req.headers.authorization;
   const response=await request(SHARED_BACKEND+'/api/'+endpoint,{method:req.method,headers,body,redirect:'error',signal:AbortSignal.timeout(12000)});
   const result=await response.text();res.statusCode=response.status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(result);
  }catch{return reply(503,'The shared Nova backend is unavailable. Try again shortly.')}
 }
}
