import {showStore} from './shop-revamp.js';
import {shopPrices,shopOdds} from './shop-config.mjs';
const assets=await fetch('/profile-assets/catalog.json').then(r=>{if(!r.ok)throw Error('Preview assets could not load.');return r.json()});
const shop=document.getElementById('shop'),mode=document.getElementById('demo-mode'),profile={name:'Nova Preview',photo:''};
let coins,inventory,credits,receipts,recent,toastTimer;
const choose=list=>list[Math.floor(Math.random()*list.length)];
function reset(){coins=100000;inventory={};credits={decoration:5,effect:5,banner:5};receipts=new Map();recent=[];for(const kind of ['decoration','effect','banner']){const item=assets.find(a=>a.kind===kind&&a.collection!=='halloween'&&a.rarity==='epic');inventory[item.id]={count:2}}}
function toast(text){const box=document.getElementById('preview-toast');box.textContent=text;box.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.remove('visible'),3000)}
const ctx={state:{me:{uid:'preview'},profiles:{preview:profile},assets},person:()=>profile,avatar(){const avatar=document.createElement('span');avatar.className='preview-avatar';avatar.textContent='N';return avatar},button(text,fn,cls=''){const b=document.createElement('button');b.type='button';b.textContent=text;b.className=cls;b.onclick=fn;return b},toast,task:fn=>async()=>{try{await fn()}catch(e){toast(e.message)}},modal(title){const d=document.createElement('dialog');d.className='preview-modal';d.setAttribute('aria-label',title);const header=document.createElement('header'),h=document.createElement('h2'),close=document.createElement('button');h.textContent=title;close.textContent='×';close.className='modal-close';close.setAttribute('aria-label','Close '+title);close.onclick=()=>d.close();header.append(h,close);d.append(header);document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal();return d},async shopRequest(action,b={}){
 if(action==='storeStatus')return {coins,inventory:structuredClone(inventory),crateCredits:{...credits},odds:shopOdds,halloween:{active:true},recentWagers:structuredClone(recent)};
 if(action==='equipCosmetic'){if(!inventory[b.id])throw Error('Unlock this demo item first.');return {ok:true}}
 if(receipts.has(b.requestId))return receipts.get(b.requestId);
 if(action==='openCase'){
  if(b.useCredits){if((credits[b.kind]||0)<b.count)throw Error('Not enough demo credits.');credits[b.kind]-=b.count}else{const cost=shopPrices[b.kind]?.[b.count];if(!cost||coins<cost)throw Error('Not enough sample coins.');coins-=cost}
  const pool=assets.filter(a=>b.kind==='halloween'?a.collection==='halloween':a.kind===b.kind&&a.collection!=='halloween');
  const rewards=Array.from({length:b.count},(_,i)=>{let rarity='common';if(mode.value==='rare')rarity=i%2?'mythic':'singularity';else{let roll=Math.random()*1000000;for(const [tier,weight]of shopOdds){roll-=weight;if(roll<0){rarity=tier;break}}}return choose(pool.filter(a=>a.rarity===rarity))});
  for(const item of rewards)inventory[item.id]={count:(inventory[item.id]?.count||0)+1};const response={coins,rewards};receipts.set(b.requestId,response);return response;
 }
 if(action==='storeGamble'){
  const won=mode.value==='win'?true:mode.value==='lose'?false:Math.random()<.5;let outcome;
  if(b.game==='roulette'){if(b.pick==='both'){const red=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];if((red.includes(b.number)?'red':b.number===0?'green':'black')!==b.color)throw Error('Choose your number’s actual color.')}const number=won?(b.pick==='color'?(b.color==='red'?1:2):b.number):(b.pick!=='color'&&b.number===0?1:0);outcome={number,color:number===0?'green':[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(number)?'red':'black'}}else if(b.game==='flip')outcome={side:won?b.choice:b.choice==='heads'?'tails':'heads'};else outcome={number:won?(b.choice==='high'?5:2):(b.choice==='high'?2:5)};
  let crates=null,payout=0;if(b.stake==='coins'){if(!Number.isSafeInteger(b.coins)||b.coins<100||b.coins>10000||coins<b.coins)throw Error('Use 100–10,000 sample coins.');payout=won?Math.floor(b.coins*(b.game==='roulette'?(b.pick==='color'?2:36):1.9)):0;coins+=payout-b.coins}else{const item=assets.find(a=>a.id===b.item);if(!item||!inventory[b.item]?.count)throw Error('Choose a demo cosmetic.');if(won){crates={kind:item.kind,count:5};credits[item.kind]=(credits[item.kind]||0)+5}else if(--inventory[b.item].count===0)delete inventory[b.item]}
  const receipt={game:b.game,stake:b.stake,item:b.item,coins:b.coins,won,outcome,payout,crates,at:Date.now()};recent.unshift(receipt);recent=recent.slice(0,5);const response={coins,receipt};receipts.set(b.requestId,response);return response;
 }
 throw Error('This action is not available in the preview.');
}};
function render(){shop.replaceChildren();showStore(shop,ctx)}
reset();render();document.getElementById('reset-demo').onclick=()=>{for(const d of document.querySelectorAll('dialog'))d.close();reset();render();toast('Sample balance and inventory reset.')};
