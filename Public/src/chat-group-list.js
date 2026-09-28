import {ref,onValue} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
// Read membership IDs privately, then fetch only groups the account belongs to.
export function watchMemberGroups(db,uid,notify,onError){
 const subscriptions=new Map(),groups={};let disposed=false;
 const stop=onValue(ref(db,'novaChatV2/userGroups/'+uid),snapshot=>{
  const ids=snapshot.val()||{};
  for(const [id,off]of subscriptions)if(!ids[id]){off();subscriptions.delete(id);delete groups[id]}
  for(const id of Object.keys(ids))if(!subscriptions.has(id)){
   subscriptions.set(id,onValue(ref(db,'novaChatV2/groups/'+id),s=>{if(disposed)return;const group=s.val();if(group?.members?.[uid])groups[id]=group;else delete groups[id];notify({...groups})},onError));
  }
  notify({...groups});
 },onError);
 return ()=>{disposed=true;stop();subscriptions.forEach(off=>off());subscriptions.clear()};
}
