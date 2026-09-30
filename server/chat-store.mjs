import {readFile} from 'node:fs/promises';
import {randomInt} from 'node:crypto';
export const odds=[['common',650000],['uncommon',250000],['epic',80000],['legendary',19000],['mythic',900],['singularity',100]];
export const prices={decoration:{1:500,3:1150,7:3000,10:4999},effect:{1:1000,3:2300,7:6000,10:9998},banner:{1:1500,3:3450,7:9000,10:14997}};
export const catalog=()=>readFile(new URL('../Public/profile-assets/catalog.json',import.meta.url),'utf8').then(JSON.parse);
export function draw(items,kind,count){return Array.from({length:count},()=>{let roll=randomInt(1000000),rarity;for(const [name,weight]of odds){roll-=weight;if(roll<0){rarity=name;break}}const pool=items.filter(a=>a.kind===kind&&a.rarity===rarity);if(!pool.length)throw Error('This case is unavailable.');return pool[randomInt(pool.length)]})}
export async function storeAction({db,uid,account,action,b,now,initial}){
 if(action==='storeStatus'){const root=(await db.ref('novaControl').get()).val()||{};return {coins:root.progress?.[uid]?.coins||0,inventory:root.inventory?.[uid]||{},nitro:root.nitro?.[uid]===true||root.nitro?.[uid]?.until>now,boosts:Object.keys(root.boosters||{}).length,prices,odds}}
 if(action==='equipCosmetic'){
  const items=await catalog(),item=items.find(a=>a.id===b.id);if(!item)throw Error('Choose a cosmetic.');if(!(await db.ref('novaControl/inventory/'+uid+'/'+item.id).get()).exists())throw Error('Open a case to unlock this cosmetic first.');await db.ref('novaChatV2/profiles/'+uid).update({[item.kind]:item.id});return {ok:true};
 }
 if(action==='nitroAnimation'){
  const premium=(await db.ref('novaControl/nitro/'+uid).get()).val();if(!(premium===true||premium?.until>now))throw Error('This animation requires Nitro.');if(!['none','orbit','shimmer'].includes(b.animation))throw Error('Choose an animation.');await db.ref('novaChatV2/profiles/'+uid).update({nitroAnimation:b.animation});return {ok:true};
 }
 if(!/^[a-f0-9-]{36}$/.test(b.requestId||''))throw Error('A purchase ID is required.');
 const items=await catalog(),cost=action==='buyNitro'?5000:prices[b.kind]?.[b.count];if(!cost)throw Error('Choose a valid case bundle.');const rewards=action==='openCase'?draw(items,b.kind,Number(b.count)):[];
 let failure;
 const result=await db.ref('novaControl').transaction(root=>{
  root=root||{};failure=null;root.purchases=root.purchases||{};root.purchases[uid]=root.purchases[uid]||{};
  if(root.purchases[uid][b.requestId])return root;
  if(action==='buyNitro'&&root.boosters?.[uid]){failure='You already own Nitro.';return}
  root.progress=root.progress||{};const p=root.progress[uid]=root.progress[uid]||initial();if(p.coins<cost){failure='You need '+cost.toLocaleString()+' Nova Coins.';return}p.coins-=cost;
  if(action==='buyNitro'){root.nitro=root.nitro||{};root.nitro[uid]=true;root.boosters=root.boosters||{};root.boosters[uid]={at:now,name:account.name}}
  else{root.inventory=root.inventory||{};const inventory=root.inventory[uid]=root.inventory[uid]||{};for(const item of rewards)inventory[item.id]={count:(inventory[item.id]?.count||0)+1,unlockedAt:now}}
  root.purchases[uid][b.requestId]={action,cost,rewards:rewards.map(a=>a.id),at:now};return root;
 });
 if(!result.committed)throw Error(failure||'Purchase could not complete.');const root=result.snapshot.val(),receipt=root.purchases[uid][b.requestId];if(receipt.action!==action)throw Error('Purchase ID was already used.');
 if(receipt.action==='buyNitro'){await db.ref('novaChatV2/profiles/'+uid).update({nitroBooster:true});await db.ref('novaChatV2/server').update({boosts:Object.keys(root.boosters||{}).length});await db.ref('novaChatV2/channels/general/messages/nitro-'+b.requestId).set({author:'nova-bot',text:account.name+' bought Nova Nitro and boosted the server! ✨',createdAt:receipt.at})}
 return {ok:true,coins:root.progress[uid].coins,rewards:receipt.rewards.map(id=>items.find(a=>a.id===id)),nitro:receipt.action==='buyNitro',boosts:Object.keys(root.boosters||{}).length};
}
