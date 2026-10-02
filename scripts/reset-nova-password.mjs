// Local recovery tool only. Never deploy this script as an API.
import {readFile} from 'node:fs/promises';
import {initializeApp,cert} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
const uid='q99CRq78vcgR8Uxg9TMHEyuq1aE3';
try {
 if(!['--inspect','--reset'].includes(process.argv[2]))throw Object.assign(Error(),{code:'invalid-mode'});
 let raw='';for await(const chunk of process.stdin){raw+=chunk;if(Buffer.byteLength(raw)>16384)throw Object.assign(Error(),{code:'input-too-large'})}
 const input=JSON.parse(raw);raw='';
 const credentials=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON||await readFile(input.credentialPath,'utf8'));
 if(credentials.project_id!=='nova-chat-43a18')throw Object.assign(Error(),{code:'wrong-firebase-project'});
 const auth=getAuth(initializeApp({credential:cert(credentials)}));
 const user=await auth.getUser(uid);
 if(process.argv[2]==='--inspect'){process.stdout.write(JSON.stringify({uid:user.uid,email:user.email||'',name:user.displayName||'',disabled:user.disabled}));}
 else {
  if(input.confirmUid!==uid||typeof input.password!=='string'||input.password.length<8||input.password.length>4096)throw Object.assign(Error(),{code:'invalid-reset-input'});
  await auth.updateUser(uid,{password:input.password});input.password='';
  let sessionsRevoked=true;try{await auth.revokeRefreshTokens(uid)}catch{sessionsRevoked=false}
  process.stdout.write(JSON.stringify({ok:true,uid,sessionsRevoked}));
 }
} catch(error){process.stderr.write('Reset helper failed: '+(error.code||'configuration-or-network-error')+'\n');process.exitCode=1;}
