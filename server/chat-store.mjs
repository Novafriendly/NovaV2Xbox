import {readFile} from 'node:fs/promises';
import {randomInt} from 'node:crypto';
export const odds=[['common',650000],['uncommon',250000],['epic',80000],['legendary',19000],['mythic',900],['singularity',100]];
export const prices={decoration:{1:500,3:1150,7:3000,10:4999},effect:{1:1000,3:2300,7:6000,10:9998},banner:{1:1500,3:3450,7:9000,10:14997}};
export const catalog=()=>readFile(new URL('../Public/profile-assets/catalog.json',import.meta.url),'utf8').then(JSON.parse);
export function draw(items,kind,count){return Array.from({length:count},()=>{let roll=randomInt(1000000),rarity;for(const [name,weight]of odds){roll-=weight;if(roll<0){rarity=name;break}}const pool=items.filter(a=>a.kind===kind&&a.rarity===rarity);if(!pool.length)throw Error('This case is unavailable.');return pool[randomInt(pool.length)]})}
const boostCount=(root,now)=>new Set([...Object.keys(root.boosters||{}),...Object.entries(root.nitro||{}).filter(([,n])=>n===true||n?.until>now).map(([id])=>id)]).size;
export async function storeAction({db,uid,account,action,b,now,initial}){
 if(action==='storeStatus'){const root=(await db.ref('novaControl').get()).val()||{};return {coins:root.progress?.[uid]?.coins||0,inventory:root.inventory?.[uid]||{},nitro:root.nitro?.[uid]===true||root.nitro?.[uid]?.until>now,boosts:boostCount(root,now),prices,odds,gifts:Object.entries(root.nitroGifts?.[uid]||{}).filter(([,g])=>!g.seen).map(([id,g])=>({id,...g}))}}
 if(action==='ackNitroGift'){if(!/^[a-f0-9-]{36}$/.test(b.id||''))throw Error('Invalid gift.');await db.ref('novaControl/nitroGifts/'+uid+'/'+b.id+'/seen').set(true);return {ok:true}}
 if(action==='unequipCosmetic'){if(!['decoration','effect','chatBanner'].includes(b.kind))throw Error('Choose a cosmetic category.');await db.ref('novaChatV2/profiles/'+uid+'/'+b.kind).remove();return {ok:true}}
 if(action==='profileTheme'){const premium=(await db.ref('novaControl/nitro/'+uid).get()).val();if(!(premium===true||premium?.until>now))throw Error('Profile gradients require Nitro.');if(!['default','aurora','sunset','ocean'].includes(b.theme))throw Error('Choose a profile background.');await db.ref('novaChatV2/profiles/'+uid).update({profileTheme:b.theme});return {ok:true}}
 if(action==='usernameFont'){const premium=(await db.ref('novaControl/nitro/'+uid).get()).val();if(!(premium===true||premium?.until>now))throw Error('Username fonts require Nitro.');if(!['default','serif','mono','rounded','heavy'].includes(b.font))throw Error('Choose a font.');await db.ref('novaChatV2/profiles/'+uid).update({usernameFont:b.font});return {ok:true}}
 if(action==='equipCosmetic'){
  const items=await catalog(),item=items.find(a=>a.id===b.id);if(!item)throw Error('Choose a cosmetic.');if(!(await db.ref('novaControl/inventory/'+uid+'/'+item.id).get()).exists())throw Error('Open a case to unlock this cosmetic first.');const values={[item.kind==='banner'?'chatBanner':item.kind]:item.id};if(item.kind==='banner'){const old=(await db.ref('novaChatV2/profiles/'+uid+'/banner').get()).val();if(items.some(a=>a.kind==='banner'&&a.id===old))values.banner=null}await db.ref('novaChatV2/profiles/'+uid).update(values);return {ok:true};
 }
 if(action==='nitroAnimation'){
  const premium=(await db.ref('novaControl/nitro/'+uid).get()).val();if(!(premium===true||premium?.until>now))throw Error('This animation requires Nitro.');if(!['none','orbit','shimmer'].includes(b.animation))throw Error('Choose an animation.');await db.ref('novaChatV2/profiles/'+uid).update({nitroAnimation:b.animation});return {ok:true};
 }
 if(!/^[a-f0-9-]{36}$/.test(b.requestId||''))throw Error('A purchase ID is required.');
 const recipient=action==='giftNitro'?b.uid:uid;const gifting=action==='giftNitro';if(gifting){if(typeof recipient!=='string'||!recipient||/[.#$\[\]/]/.test(recipient)||recipient===uid)throw Error('Choose another Nova user.');if(!(await db.ref('novaAccounts/'+recipient).get()).exists())throw Error('User not found.')}
 const items=await catalog(),cost=['buyNitro','giftNitro'].includes(action)?5000:prices[b.kind]?.[b.count];if(!cost)throw Error('Choose a valid case bundle.');const rewards=action==='openCase'?draw(items,b.kind,Number(b.count)):[];
 let failure;
 const result=await db.ref('novaControl').transaction(root=>{
  // Returning the current value allows Firebase to resolve a cold or stale
  // cache against the server. Aborting here would reject real balances.
  failure=null;if(root===null)return null;root.purchases=root.purchases||{};root.purchases[uid]=root.purchases[uid]||{};
  if(root.purchases[uid][b.requestId])return root;
  if(['buyNitro','giftNitro'].includes(action)&&(root.boosters?.[recipient]||(root.nitro?.[recipient]===true||root.nitro?.[recipient]?.until>now))){failure=gifting?'That user already has Nitro.':'You already own Nitro.';return root}
  root.progress=root.progress||{};const p=root.progress[uid]=root.progress[uid]||initial();if(p.coins<cost){failure='You need '+cost.toLocaleString()+' Nova Coins.';return root}p.coins-=cost;
  if(['buyNitro','giftNitro'].includes(action)){root.nitro=root.nitro||{};root.nitro[recipient]=true;root.boosters=root.boosters||{};root.boosters[recipient]={at:now,name:account.name};if(gifting){root.nitroGifts=root.nitroGifts||{};root.nitroGifts[recipient]=root.nitroGifts[recipient]||{};root.nitroGifts[recipient][b.requestId]={from:uid,name:account.name,at:now}}}
  else{root.inventory=root.inventory||{};const inventory=root.inventory[uid]=root.inventory[uid]||{};for(const item of rewards)inventory[item.id]={count:(inventory[item.id]?.count||0)+1,unlockedAt:now}}
  root.purchases[uid][b.requestId]={action,recipient,cost,rewards:rewards.map(a=>a.id),at:now};return root;
 });
 if(!result.committed)throw Error(failure||'Purchase could not complete.');const root=result.snapshot.val(),receipt=root?.purchases?.[uid]?.[b.requestId];if(!receipt)throw Error(failure||'You need '+cost.toLocaleString()+' Nova Coins.');if(receipt.action!==action||receipt.recipient!==recipient)throw Error('Purchase ID was already used.');
 if(['buyNitro','giftNitro'].includes(receipt.action)){await db.ref('novaChatV2/profiles/'+recipient).update({nitroBooster:true});await db.ref('novaChatV2/server').update({boosts:boostCount(root,now)});await db.ref('novaChatV2/channels/general/messages/nitro-'+b.requestId).set({author:'nova-bot',text:account.name+(gifting?' gifted Nova Nitro and boosted the server! 🎁':' bought Nova Nitro and boosted the server! ✨'),createdAt:receipt.at})}
 if(gifting)await db.ref('novaChatV2/botMessages/'+recipient+'/nitro-'+b.requestId).set({author:'nova-bot',text:account.name+' gifted you permanent Nova Nitro! Enjoy your new backgrounds, username fonts and profile animations.',subject:'You have been gifted Nitro 🎁',kind:'nitro-gift',staffName:account.name,staffRole:'member',createdAt:receipt.at});
 return {ok:true,coins:root.progress[uid].coins,rewards:receipt.rewards.map(id=>items.find(a=>a.id===id)),nitro:receipt.action==='buyNitro',boosts:boostCount(root,now)};
}
