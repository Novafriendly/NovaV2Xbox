const {chromium}=require('C:/Users/willi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const catalog=JSON.parse(fs.readFileSync('Public/profile-assets/catalog.json','utf8')),effects=catalog.filter(x=>x.kind==='effect'),banners=catalog.filter(x=>x.kind==='banner'),decorations=catalog.filter(x=>x.kind==='decoration');
 const photo='http://127.0.0.1:8780/Nova12.png';
 await page.addInitScript(({effects,banners,decorations,photo})=>{
  localStorage.setItem('nova_user','me');localStorage.setItem('nova-progress-me',JSON.stringify({xp:5382,coins:95111,challenges:[],resetAt:0,balanceVersion:3}));
  window.__data={'novaAccounts/me':{name:'NovaOfficialacc',photo},'novaChatV2/profiles':{me:{name:'NovaOfficialacc',photo,decoration:decorations[0].id,effect:effects[0].id,banner:'http://127.0.0.1:8780'+banners[0].src},alex:{name:'Alex',photo,decoration:decorations[1].id,effect:effects[1].id,chatBanner:banners[1].id}},'novaChatV2/roles':{me:'owner',alex:'member'},'novaChatV2/customRoles':{helpers:{name:'Helper',from:'#ff6699',to:'#ffffff'}},'novaChatV2/memberRoles':{alex:{helpers:true}},'novaChatV2/friends/me':{alex:true},'novaChatV2/presence':{alex:{online:true,updatedAt:Date.now()}}};
 },{effects,banners,decorations,photo});
 await page.route('**/home.html',r=>{
  const keep=['home.js','home-cosmetics.js','console.js','home-profile.js','guide.js','progression.js'];
  const html=fs.readFileSync('Public/home.html','utf8').replace(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g,(tag,src)=>keep.includes(src.split('/').pop())?tag:'');
  return r.fulfill({contentType:'text/html',body:html});
 });
 await page.route('https://www.gstatic.com/firebasejs/**',r=>{
  const url=r.request().url();let body='';
  if(url.endsWith('firebase-app.js'))body='export const getApps=()=>[{}],getApp=()=>({}),initializeApp=()=>({});';
  else if(url.endsWith('firebase-auth.js'))body="const user={uid:'me',isAnonymous:false,getIdToken:async()=> 'test'};const auth={currentUser:user,authStateReady:async()=>{},onAuthStateChanged(fn){queueMicrotask(()=>fn(user));return ()=>{}}};export const getAuth=()=>auth;";
  else body=`window.__listeners ||= new Map();window.__set=(path,v)=>{window.__data[path]=v;for(const fn of window.__listeners.get(path)||[])fn({val:()=>v})};export const getDatabase=()=>({}),ref=(db,path)=>path,query=(p)=>p,orderByChild=()=>{},equalTo=()=>{},serverTimestamp=()=>Date.now(),set=async()=>{},onDisconnect=()=>({remove:async()=>{}});export function onValue(path,fn){const list=window.__listeners.get(path)||new Set();list.add(fn);window.__listeners.set(path,list);queueMicrotask(()=>{if(list.has(fn))fn({val:()=>window.__data[path]||null})});return ()=>list.delete(fn)}`;
  return r.fulfill({contentType:'text/javascript',body});
 });
 await page.route('**/api/owner-control',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(r.request().postDataJSON().action==='openCase'?{coins:93861,rewards:[]}:{progress:{xp:5382,coins:95111,challenges:[],resetAt:0,balanceVersion:3}})}));
 await page.goto('http://127.0.0.1:8780/home.html');
 await page.waitForFunction(()=>window.novaHomeProfile?.name==='NovaOfficialacc'&&window.novaHomeProfile?.nameRole?.id==='owner').catch(async e=>{console.log(errors,await page.evaluate(()=>({url:location.href,scripts:[...document.scripts].map(x=>x.src),profile:window.novaHomeProfile,listeners:[...window.__listeners?.keys()||[]]})));throw e});
 await page.locator('.profile .nova-home-decoration').waitFor();
 assert.equal(await page.locator('#username').evaluate(n=>n.style.getPropertyValue('--role-from')),'#7af0a6');
 assert.ok((await page.locator('.nova-home-coins').textContent()).includes('95,111'));
 assert.equal(await page.locator('.profile .nova-home-avatar-effect').count(),1);
 await page.locator('header .profile').click();await page.locator('.xg-top button[aria-label="Profile"]').click();
 assert.equal(await page.locator('.xg-account-hero>.nova-home-effect').count(),1);
 assert.equal(await page.locator('.xg-account-hero>.nova-home-banner').count(),1);
 assert.equal(await page.locator('.xg-profile .nova-home-decoration').count(),1);
 await page.evaluate(async()=>{await Promise.allSettled(document.getAnimations().map(a=>a.finished))});await page.screenshot({path:'home-profile-guide-preview.png'});
 await page.locator('.xg-top button[aria-label="Friends"]').click();await page.locator('.xg-row').filter({hasText:'Friends'}).first().click();
 const friend=page.locator('.xg-friends-flyout .xg-friend').first();
 assert.ok((await friend.locator(':scope>.nova-home-banner').getAttribute('src')).endsWith(banners[1].src));
 assert.equal(await friend.locator('.nova-home-name').evaluate(n=>n.style.getPropertyValue('--role-from')),'#ff6699');
 await page.evaluate(({banner,effect})=>{const p=structuredClone(window.__data['novaChatV2/profiles']);p.alex.chatBanner=banner;p.me.effect=effect;window.__set('novaChatV2/profiles',p)},{banner:banners[2].id,effect:effects[2].id});
 await page.waitForFunction(src=>document.querySelector('.xg-friend>.nova-home-banner')?.getAttribute('src')===src,banners[2].src);
 await page.evaluate(async()=>{await Promise.allSettled(document.getAnimations().map(a=>a.finished))});await page.screenshot({path:'home-friend-banners-preview.png'});
 await page.evaluate(async()=>{await document.querySelector('.guide').close();window.NovaProgress.open()});
 assert.ok((await page.locator('.nova-profile-page>.nova-home-effect').getAttribute('src')).endsWith(effects[2].src));
 await page.evaluate(()=>window.__effectNode=document.querySelector('.nova-profile-page>.nova-home-effect'));
 await page.waitForTimeout(1200);
 assert.equal(await page.evaluate(()=>window.__effectNode===document.querySelector('.nova-profile-page>.nova-home-effect')),true);
 await page.evaluate(id=>{const p=structuredClone(window.__data['novaChatV2/profiles']);p.me.effect=id;window.__set('novaChatV2/profiles',p)},effects[3].id);
 assert.ok((await page.locator('.nova-profile-page>.nova-home-effect').getAttribute('src')).endsWith(effects[3].src));
 await page.evaluate(async()=>{await Promise.allSettled(document.getAnimations().map(a=>a.finished))});await page.screenshot({path:'home-full-profile-effects-preview.png'});
 await page.evaluate(async()=>{const {control}=await import('/src/control-client.js');await control('openCase',{})});
 assert.ok((await page.locator('.nova-home-coins').textContent()).includes('93,861'));
 await page.evaluate(()=>document.querySelector('.nova-profile-page').close());
 await page.setViewportSize({width:800,height:700});
 assert.equal(await page.locator('.profile>span+span').isVisible(),true);
 await page.evaluate(async()=>{await Promise.allSettled(document.getAnimations().map(a=>a.finished))});await page.screenshot({path:'home-profile-laptop-preview.png'});
 assert.deepEqual(errors,[]);
 console.log('Passed Home/guide cosmetics, friend banners, live changes, role colors, coin updates, stable animation, and laptop layout.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
