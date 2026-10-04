import {initNovaOS} from './nova-os.js';
// Preview data is never written to Firebase or account storage.
const demo={key:'preview-nova',name:'Nova Player',photo:'',bio:'Your space. Your games. Your Nova.',online:true,role:'member'};
const friends=[{key:'preview-friend-1',name:'Axcel',photo:'',online:true,activity:'Grand Theft Auto V',activityKind:'cloud',activityId:'jy0108',activityStartedAt:Date.now()-780000,nameRole:{from:'#c9dfff',to:'#fff'}},{key:'preview-friend-2',name:'NovaOfficial',photo:'',online:true,activity:'Nova Music',nameRole:{from:'#dfcfff',to:'#fff'}},{key:'preview-friend-3',name:'Zep',photo:'',online:false,nameRole:{from:'#cee6dd',to:'#fff'}}];
window.novaHomeProfile=demo;window.NovaHomeCosmetics.header();
const challenge=document.createElement('section');challenge.className='home-challenges';challenge.innerHTML='<div class="hc-heading"><span>YOUR CHALLENGES</span><span>↗</span></div><small class="hc-footer">View your profile & challenges</small>';document.body.append(challenge);
const covers=await fetch('home-covers.json').then(r=>r.json());
const actualRecent=window.NovaRecent.list;
window.NovaRecent.list=()=>covers.slice(0,6).map(g=>({...g,kind:'game'}));
const os=await initNovaOS({preview:true,friends,members:[demo,...friends],requests:[{id:'preview-friend-3',from:'Zep'}],messages:{one:{author:'preview-friend-1',text:'Want to play something?',createdAt:Date.now()-120000},two:{author:'preview-nova',text:'Let’s find a game on Nova.',createdAt:Date.now()-60000}},updates:[{author:'preview-nova',subject:'A new space to call home',text:'Welcome to Nova OS.\n- Move and minimize your windows\n- Keep your chats close\n- Switch home styles in Display',createdAt:Date.now()}]});
document.querySelector('.os-desktop-mark span').textContent='NOVA OS · SAMPLE PREVIEW';
const discover=document.getElementById('home-discover');discover.innerHTML='<section class="popular-section"><div class="popular-heading"><h2>Top played games</h2><span>Sample preview</span></div><div class="popular-grid" data-grid="game"></div></section><section class="popular-section"><div class="popular-heading"><h2>Top apps</h2><span>Sample preview</span></div><div class="popular-grid" data-grid="app"></div></section><section class="nova-personal-home"><strong id="nova-visits">Sample</strong><strong id="nova-active">3</strong></section>';
for(const g of covers.slice(0,6)){const b=document.createElement('button');b.className='popular-tile';b.innerHTML='<div class="popular-art"></div><strong></strong><small>Sample preview</small>';const img=new Image();img.src=g.art;img.alt='';b.querySelector('.popular-art').append(img);b.querySelector('strong').textContent=g.name;b.onclick=()=>os.open('library');discover.querySelector('[data-grid=game]').append(b)}
// Restore the real recent list when leaving this preview.
addEventListener('pagehide',()=>{window.NovaRecent.list=actualRecent},{once:true});
