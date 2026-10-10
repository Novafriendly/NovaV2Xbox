const control=async()=>{throw Error('Preview only — no invitation is sent.');};
const auth={currentUser:{uid:'preview-user'}};
export const pendingKey='nova_buildnow_party_join_v1';
export function mountBuildNowInvites(){
 if(window!==top)return ()=>{};
 const host=document.createElement('section');host.id='nova-buildnow-invite';host.hidden=true;host.setAttribute('aria-live','polite');host.setAttribute('popover','manual');document.body.append(host);
 const style=document.createElement('style');style.textContent='#nova-buildnow-invite{position:fixed;inset:auto 18px 24px auto;margin:0;padding:20px;width:min(360px,calc(100vw - 36px));box-sizing:border-box;border:1px solid #aaa0ed55;border-radius:18px;background:#14131eed;backdrop-filter:blur(20px);color:#f4f2ff;box-shadow:0 18px 60px #0008;z-index:2147483647;font:14px/1.5 Segoe UI,sans-serif}#nova-buildnow-invite[hidden]{display:none}#nova-buildnow-invite h3{font-size:20px;margin:12px 0 8px}#nova-buildnow-invite p{margin:8px 0;color:#c7c2db}#nova-buildnow-invite img{width:36px;height:36px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:10px}#nova-buildnow-invite button{padding:9px 16px;margin:10px 8px 0 0;color:#fff;border:1px solid #ffffff25;border-radius:10px;background:#ffffff0a;cursor:pointer;font:inherit}#nova-buildnow-invite button:first-of-type{background:#8173ca;border-color:#a99bf2}#nova-buildnow-invite button:disabled{opacity:.5;cursor:wait}#nova-buildnow-invite button:focus-visible{outline:2px solid white;outline-offset:3px}';document.head.append(style);
 let current='',busy=false;const seen=new Set();const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const hide=()=>{host.hidden=true;try{host.hidePopover();}catch{}};
 const launch=async()=>{const response=await fetch('/library-games.json');if(!response.ok)throw Error('The game library could not load.');const game=(await response.json()).find(g=>Number(g.id)===581);if(!game)throw Error('BuildNow is unavailable in the library.');if(window.NovaRecent?.launch)window.NovaRecent.launch({...game,kind:'game'});else location.href='/player.html?kind=game&id=581';};
 return data=>{
  const invite=data?.invite,uid=auth.currentUser?.uid||'';
  if(invite?.isHost){for(const join of data.joins||[]){const key=invite.id+':'+join.uid;let recorded=false;try{recorded=localStorage.getItem('nova-buildnow-notified-'+uid+'-'+key)==='true';}catch{}if(seen.has(key)||recorded||!window.NovaNotice)continue;seen.add(key);try{localStorage.setItem('nova-buildnow-notified-'+uid+'-'+key,'true');}catch{}window.NovaNotice?.('chat',{sender:'buildnow-'+join.uid,label:'BuildNow · owner invite',title:join.name||'Nova member',text:'Joined your BuildNow GG lobby through your owner invitation.',art:join.photo||'',hint:'View lobby joins',action:()=>window.openPage?.('owner')});}hide();return;}
  if(!invite||invite.expiresAt<=Date.now()||['declined','joined'].includes(invite.phase)){hide();current='';return;}
  if(invite.id===current||busy)return;current=invite.id;host.replaceChildren();const owner=el('div'),photo=el('img');photo.src=invite.photo||'/Nova12.png';photo.alt='';photo.onerror=()=>{photo.onerror=null;photo.src='/Nova12.png';};owner.append(photo,el('strong',invite.name||'Nova Owner'));const note=el('p','Join the owner’s lobby. This will open BuildNow GG and load the party code for you.');host.append(owner,el('h3','Want to join BuildNow GG?'),note);
  const join=el('button','Join'),decline=el('button','Decline');host.append(join,decline);host.hidden=false;try{host.showPopover();}catch{}
  decline.onclick=async()=>{decline.disabled=join.disabled=true;try{await control('buildNowInviteDecline',{id:invite.id});hide();}catch(error){note.textContent=error.message;decline.disabled=join.disabled=false;}};
  join.onclick=async()=>{busy=true;decline.disabled=join.disabled=true;note.textContent='Loading BuildNow GG…';try{const result=await control('buildNowInviteAccept',{id:invite.id});if(auth.currentUser?.uid!==uid)throw Error('Your account changed. Sign in and try again.');if(result.invite.joined){hide();return;}sessionStorage.setItem(pendingKey,JSON.stringify(result.invite));await launch();hide();}catch(error){note.textContent=error.message;decline.disabled=join.disabled=false;}finally{busy=false;}};
 };
}

export function startPartyJoin(runtime){
 let active='',busy=false,attempted=false,leaving=false,started=0,complete=false,nextAck=0,ackFailures=0,attemptedAt=0,nativeStarted=0;
 const host=document.createElement('section');host.id='nova-party-join-status';host.hidden=true;host.style.cssText='position:fixed;inset:20px 20px auto auto;z-index:2147483647;max-width:320px;padding:18px;border:1px solid #a394db77;border-radius:14px;background:#171322ee;color:white;font:14px/1.5 system-ui;box-shadow:0 12px 40px #0007';const title=document.createElement('strong'),note=document.createElement('p'),retry=document.createElement('button');title.textContent='Owner lobby invitation';retry.textContent='Try again';retry.hidden=true;retry.style.cssText='padding:8px 12px;border:1px solid #ab9ddd;border-radius:8px;background:#7565b4;color:white;cursor:pointer';host.append(title,note,retry);document.body.append(host);
 const read=()=>{try{return JSON.parse(sessionStorage.getItem(pendingKey)||'null');}catch{return null;}};
 retry.onclick=()=>{active='';started=0;attempted=false;leaving=false;complete=false;nextAck=0;ackFailures=0;nativeStarted=0;retry.hidden=true;};
 const tick=async()=>{
  if(busy)return;const pending=read();if(!pending?.id)return;if(complete&&active===pending.id)return;if(active!==pending.id)complete=false;
  if(active!==pending.id){active=pending.id;started=Date.now();attempted=false;leaving=false;host.hidden=false;note.textContent='Loading owner code…';retry.hidden=true;}
  if(pending.expiresAt<=Date.now()){note.textContent='This owner invitation has ended.';sessionStorage.removeItem(pendingKey);return;}
  if(attempted&&Date.now()-attemptedAt>120000){note.textContent='Could not join the owner lobby. It may be full, closed, or in another server region. Check the game message and try again.';retry.hidden=false;return;}
  const adapter=runtime.adapter();if(!adapter)return;if(!nativeStarted)nativeStarted=Date.now();if(!attempted&&Date.now()-nativeStarted>120000){note.textContent='BuildNow is not ready to join. Return to its main menu and check your connection, then try again.';retry.hidden=false;return;}
  busy=true;
  try{
   if(adapter.joined(pending.code)){
    if(Date.now()<nextAck)return;await auth.authStateReady();if(auth.currentUser?.uid!==pending.uid)throw Error('This invitation belongs to a different Nova account.');
    try{await control('buildNowInviteJoined',{id:pending.id,code:pending.code,nonce:pending.nonce});}catch(error){ackFailures++;nextAck=Date.now()+Math.min(15000,1000*2**Math.min(ackFailures,4));note.textContent='Joined the lobby · waiting to notify the owner. '+error.message;return;}
    note.textContent='Joined the owner lobby. The owner has been notified.';sessionStorage.removeItem(pendingKey);complete=true;setTimeout(()=>host.hidden=true,6000);return;
   }
   if(!attempted&&adapter.ready()){
    await auth.authStateReady();if(auth.currentUser?.uid!==pending.uid)throw Error('This invitation belongs to a different Nova account.');
    if(!leaving&&adapter.inRoom()){adapter.leave();leaving=true;note.textContent='Leaving your current room…';return;}
    if(adapter.inRoom())return;adapter.join(pending.code);attempted=true;attemptedAt=Date.now();note.textContent='Loading owner code · joining the party…';
   }else if(attempted&&Date.now()-attemptedAt>30000){note.textContent='BuildNow has not confirmed the party join. Check that the lobby is open and that you use the owner’s server region.';retry.hidden=false;}
  }catch(error){note.textContent=error.message;retry.hidden=false;}finally{busy=false;}
 };
 const timer=setInterval(tick,750);tick();window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}

mountBuildNowInvites()({invite:{id:'preview',name:'Nova Owner',photo:'/Nova12.png',expiresAt:Date.now()+600000},joins:[]});
