import {browserLocalPersistence,setPersistence,signInWithCustomToken} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
const storageKey='nova-login-handoff',attemptKey='nova-login-handoff-attempted';
const random=()=>{const bytes=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')};
const hash=async value=>btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
async function request(url,options={}){const response=await fetch(url,{...options,cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)});const data=await response.json();if(!response.ok)throw Error(data.error||'Shared login is unavailable.');return data}
export const loginConfig=()=>request('/api/login-handoff');
export async function automaticLogin(auth){
 if(window.top!==window||!['/','/home.html','/account.html','/index.html'].includes(location.pathname))return;
 try{
  const query=new URLSearchParams(location.search);
  if(query.has('logout')){localStorage.setItem('nova-login-handoff-signed-out','1');return}
  if(auth.currentUser&&!auth.currentUser.isAnonymous||query.has('add')||localStorage.getItem('nova-login-handoff-signed-out')||sessionStorage.getItem('nova-adding-account')||sessionStorage.getItem(attemptKey))return;
  const config=await loginConfig();
  if(!config.primary||config.primary===location.origin||!config.trusted.includes(location.origin))return;
  // Check reachability and the ORIGINAL site's allowlist before navigating away.
  const original=await request(new URL('/api/login-handoff',config.primary));
  if(original.primary!==config.primary||!original.trusted.includes(location.origin))return;
  const state=random(),verifier=random(),challenge=await hash(verifier);
  sessionStorage.setItem(attemptKey,'1');sessionStorage.setItem(storageKey,JSON.stringify({state,verifier,primary:config.primary,expiresAt:Date.now()+120000,returnPath:location.pathname==='/account.html'?'/home.html':location.pathname+location.search}));
  const url=new URL('/login-bridge.html',config.primary);url.hash=new URLSearchParams({state,challenge,target:location.origin}).toString();
  location.replace(url.href);await new Promise(()=>{});
 }catch{ /* Normal login remains available when configuration or the network is unavailable. */ }
}
export async function bridge(auth){
 const parameters=new URLSearchParams(location.hash.slice(1)),state=parameters.get('state'),target=parameters.get('target'),challenge=parameters.get('challenge'),config=await loginConfig();
 if(location.origin!==config.primary||target===config.primary||!config.trusted.includes(target)||!/^[-_A-Za-z0-9]{43}$/.test(state||'')||!/^[-_A-Za-z0-9]{43}$/.test(challenge||''))throw Error('This Nova login destination has not been approved.');
 history.replaceState(null,'',location.pathname);
 const callback=new URL('/login-callback.html',target),result=new URLSearchParams({state});
 try{
  if(!auth.currentUser||auth.currentUser.isAnonymous)throw Error('not-signed-in');
  const response=await request('/api/login-handoff',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await auth.currentUser.getIdToken()},body:JSON.stringify({action:'issue',target,challenge})});result.set('code',response.code);
 }catch{result.set('error','unavailable')}
 callback.hash=result.toString();location.replace(callback.href);
}
export async function completeLogin(auth){
 const parameters=new URLSearchParams(location.hash.slice(1));history.replaceState(null,'',location.pathname);
 let pending;try{pending=JSON.parse(sessionStorage.getItem(storageKey)||'null')}catch{}
 sessionStorage.removeItem(storageKey);
 if(!pending||parameters.get('state')!==pending.state||pending.expiresAt<Date.now())throw Error('This login request expired. Please sign in normally.');
 const config=await loginConfig();
 if(config.primary!==pending.primary||!config.trusted.includes(location.origin))throw Error('Shared login is not enabled on this Nova site.');
 if(parameters.has('error')){location.replace('/account.html');return}
 if(!auth.currentUser||auth.currentUser.isAnonymous){
  const result=await request(new URL('/api/login-handoff',pending.primary),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'redeem',code:parameters.get('code'),verifier:pending.verifier})});
  await setPersistence(auth,browserLocalPersistence);await signInWithCustomToken(auth,result.token);
 }
 const path=typeof pending.returnPath==='string'&&pending.returnPath.startsWith('/')&&!pending.returnPath.startsWith('//')?pending.returnPath:'/home.html';
 location.replace(new URL(path,location.origin).origin===location.origin?path:'/home.html');
}
