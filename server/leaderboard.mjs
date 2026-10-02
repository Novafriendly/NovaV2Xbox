import {readFile} from 'node:fs/promises';
let catalog;const rankingCache=new WeakMap();
export async function leaderboardGames(){if(!catalog){const [normal,cloud]=await Promise.all([readFile(new URL('../Public/library-games.json',import.meta.url),'utf8').then(JSON.parse),readFile(new URL('../Public/library-cloud.json',import.meta.url),'utf8').then(JSON.parse)]);catalog=[...normal.map(g=>({key:'game:'+g.id,name:g.name,art:g.art||''})),...cloud.map(g=>({key:'cloud:'+g.id,name:g.name+' · Cloud',art:g.art||''}))];}return catalog}
const number=value=>Number.isFinite(value)&&value>=0?value:0;
const safePhoto=value=>typeof value==='string'&&value.length<=100000&&/^(https:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/.test(value)?value:'';
const text=(value,max=100)=>typeof value==='string'?value.slice(0,max):'';
export async function leaderboard(db,uid,action,b={},now=Date.now()){
 const games=await leaderboardGames(),known=new Set(games.map(g=>g.key));
 if(action==='leaderboardPulse'){
  const game=known.has(b.game)?b.game:null,active=b.active===true;
  const historical=number((await db.ref('novaControl/progress/'+uid+'/activeSeconds').get()).val());
  await db.ref('novaControl/leaderboardTime/'+uid).transaction(row=>{row||={seconds:historical,gameSeconds:{}};if(now<number(row.at))return row;const delta=now-number(row.at);const seconds=active&&row.active&&delta>0&&delta<=35000?Math.min(20,delta/1000):0;row.seconds=number(row.seconds)+seconds;row.gameSeconds||={};if(seconds&&game&&row.game===game)row.gameSeconds[game]=number(row.gameSeconds[game])+seconds;row.at=now;row.active=active;row.game=game;return row});return {ok:true};
 }
 if(action==='leaderboardProfile'){
  if(typeof b.uid!=='string'||!b.uid||b.uid.length>128||/[.#$\[\]/]/.test(b.uid))throw Error('Choose a valid Nova player.');
  const [account,profile,role,progress]=await Promise.all(['novaAccounts/'+b.uid,'novaChatV2/profiles/'+b.uid,'novaChatV2/roles/'+b.uid,'novaControl/progress/'+b.uid].map(p=>db.ref(p).get().then(s=>s.val())));
  if(!account)throw Error('This profile is no longer available.');const p=profile||{};
  return {profile:{uid:b.uid,name:text(p.name||account.name),photo:safePhoto(p.photo||account.photo),bio:text(p.bio,2000),banner:text(p.banner,2000),effect:text(p.effect,128),joined:number(p.joined),role:text(role||'member'),xp:number(progress?.xp)}};
 }
 const game=typeof b.game==='string'&&b.game?b.game:null;if(game&&!known.has(game))throw Error('Choose a game from the library.');
 const offset=Number.isSafeInteger(b.offset)&&b.offset>=0?b.offset:0;
 let cached=rankingCache.get(db);if(!cached||now-cached.at>15000){const promise=Promise.all(['novaAccounts','novaControl/leaderboardTime','novaControl/progress','novaChatV2/roles'].map(p=>db.ref(p).get().then(s=>s.val()||{}))).then(([accounts,times,progress,roles])=>Object.entries(accounts).map(([id,a])=>({uid:id,name:text(a.name)||'Nova player',photo:safePhoto(a.photo),role:text(roles[id]||'member'),seconds:number(times[id]?.seconds??progress[id]?.activeSeconds),gameSeconds:times[id]?.gameSeconds||{}})));cached={at:now,promise};rankingCache.set(db,cached);promise.catch(()=>{if(rankingCache.get(db)===cached)rankingCache.delete(db)})}
 const publicPlayers=await cached.promise;
 const rows=publicPlayers.map(({gameSeconds,...p})=>({...p,seconds:game?number(gameSeconds[game]):p.seconds})).filter(p=>!game||p.seconds>0).sort((a,b)=>b.seconds-a.seconds||a.name.localeCompare(b.name)||a.uid.localeCompare(b.uid)).map((p,i)=>({...p,rank:i+1})).filter(p=>p.name.toLowerCase().includes(text(b.search).toLowerCase()));
 return {players:rows.slice(offset,offset+80),total:rows.length,next:offset+80<rows.length?offset+80:null,...(b.catalog?{games}:{}),updatedAt:now};
}
