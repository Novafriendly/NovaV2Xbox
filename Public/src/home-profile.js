import {rolesFor,nameRoleFor} from './chat-server.js';
import {watchMemberGroups} from './chat-group-list.js';
import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {getDatabase,ref,onValue,query,orderByChild,equalTo} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
const app=getApps().length?getApp():initializeApp({
  apiKey: 'AIzaSyDV9MRbv7IDXjowddQoXAN1hJPlCGMyxR8',
  authDomain: 'nova-chat-43a18.firebaseapp.com',
  databaseURL: 'https://nova-chat-43a18-default-rtdb.firebaseio.com',
  projectId: 'nova-chat-43a18', storageBucket: 'nova-chat-43a18.firebasestorage.app',
  messagingSenderId: '1090469740208', appId: '1:1090469740208:web:94adbe3ee21abb3cf14575'
 });const db=getDatabase(app);let key,unsubscribe,profileSignature='';
function paint(value={}){
 const chat=chatProfiles[chatAuth.currentUser?.uid]||{},id=chatAuth.currentUser?.uid;
 const p={...chat,name:chat.name||value.displayName||value.username||'Guest',photo:chat.photo||value.profilePic||''};
 if(id){const list=rolesFor(id,{profiles:chatProfiles,roles:chatRoles,customRoles,memberRoles});p.nameRole=nameRoleFor(id,{profiles:chatProfiles,roles:chatRoles,customRoles,memberRoles})}
 p.online=!!id;p.status=chat.status|| (id?'online':'offline');
 const signature=JSON.stringify(p);if(signature===profileSignature)return;profileSignature=signature;window.novaHomeProfile=p;
 dispatchEvent(new Event('nova-profile-changed'));
}
function connect(){const next=localStorage.getItem('nova_user')||localStorage.getItem('nova_username')||'';if(next===key)return;unsubscribe?.();key=next;accountProfile={};paint();window.NovaHomeCosmetics?.balance();if(key&&!/[.#$\[\]\/]/.test(key))unsubscribe=onValue(ref(db,'novaAccounts/'+key),s=>{const p=s.val();if(p){accountProfile={displayName:p.name,profilePic:p.photo};paint(accountProfile)}},()=>{})}
// The guide reads only the new, authenticated chat namespace.
import {getAuth} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {set,onDisconnect,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
const chatAuth=getAuth(app);let chatStops=[],chatFriends={},chatProfiles={},chatPresence={},chatRoles={},customRoles={},memberRoles={},accountProfile={},heartbeat,friendsSignature;
const emit=()=>dispatchEvent(new Event('nova-guide-data'));
function paintFriends(){
 paint(accountProfile);
 const friends=Object.keys(chatFriends).map(id=>{const p=chatProfiles[id]||{},online=!!chatPresence[id]?.online&&Date.now()-Number(chatPresence[id]?.updatedAt)<90000,list=rolesFor(id,{profiles:chatProfiles,roles:chatRoles,customRoles,memberRoles});return {...p,key:id,name:p.name||'Nova member',photo:p.photo||'',online,status:online?(p.status||'online'):'offline',activity:chatPresence[id]?.activity||'',nameRole:nameRoleFor(id,{profiles:chatProfiles,roles:chatRoles,customRoles,memberRoles})}});
 const signature=JSON.stringify(friends);if(signature!==friendsSignature){friendsSignature=signature;window.novaGuideFriends=friends;emit()}
}
connect();addEventListener('storage',connect);setInterval(connect,1500);
chatAuth.onAuthStateChanged(user=>{chatStops.forEach(stop=>stop());chatStops=[];clearInterval(heartbeat);chatFriends={};chatProfiles={};chatPresence={};chatRoles={};customRoles={};memberRoles={};friendsSignature=null;profileSignature="";paint(accountProfile);window.novaGuideFriends=[];window.novaGuideGroups=[];window.novaGuideRequests=[];window.novaGuideUpdates=[];window.novaStaffRole=null;emit();if(!user||user.isAnonymous)return;
const watch=(path,fn)=>chatStops.push(onValue(ref(db,'novaChatV2/'+path),s=>fn(s.val()||{}),()=>{}));
watch('roles',v=>{chatRoles=v;window.novaStaffRole=v[user.uid]||null;paintFriends();emit()});
watch('customRoles',v=>{customRoles=v;paintFriends()});watch('memberRoles',v=>{memberRoles=v;paintFriends()});
watch('profiles',v=>{chatProfiles=v;paintFriends()});watch('friends/'+user.uid,v=>{chatFriends=v;paintFriends()});watch('presence',v=>{chatPresence=v;paintFriends()});chatStops.push(watchMemberGroups(db,user.uid,groups=>{window.novaGuideGroups=Object.entries(groups).map(([id,g])=>({id,name:g.name}));emit()},()=>{}));
watch('requests/'+user.uid,v=>{window.novaGuideRequests=Object.keys(v).map(id=>({id,from:chatProfiles[id]?.name||'Nova member',fromPic:chatProfiles[id]?.photo||''}));emit()});
const p=ref(db,'novaChatV2/presence/'+user.uid);const publish=()=>{const title=document.getElementById('panel-title')?.textContent||'';const game=document.getElementById('system')?.getAttribute('src')?.startsWith('player.html?kind=game');set(p,{online:true,updatedAt:serverTimestamp(),activity:game&&localStorage.getItem('nova_chat_activity')!=='false'?title:''}).catch(()=>{})};
chatStops.push(onValue(ref(db,'.info/connected'),s=>{if(s.val())onDisconnect(p).remove().then(publish).catch(()=>{})}));heartbeat=setInterval(()=>{publish();paintFriends()},30000);const frame=document.getElementById('system');if(frame){const observer=new MutationObserver(publish);observer.observe(frame,{attributes:true,attributeFilter:['src','hidden']});chatStops.push(()=>observer.disconnect())}
});
