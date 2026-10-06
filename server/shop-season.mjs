import {randomUUID} from 'node:crypto';
export const SHOP_SEASON='2026-halloween-v2';
export const HALLOWEEN_END=Date.parse('2026-11-01T00:00:00-04:00');
export async function ensureShopSeason(db,now,items){
 const current=(await db.ref('novaControl/shopSeason').get()).val();
 if(current?.version===SHOP_SEASON&&current.status==='ready')return;
 const token=randomUUID(),profiles=(await db.ref('novaChatV2/profiles').get()).val()||{};
 const result=await db.ref('novaControl').transaction(root=>{
  root||={};
  const season=root.shopSeason;
  if(season?.version===SHOP_SEASON&&(season.status==='ready'||season.until>now))return root;
  if(season?.version!==SHOP_SEASON){
   root.shopArchives||={};root.shopArchives[SHOP_SEASON]={at:now,inventory:root.inventory||{}};
   root.inventory={};root.crateCredits={};root.shopReceipts={};
  }
  root.shopSeason={version:SHOP_SEASON,status:'resetting',token,until:now+310000};return root;
 });
 const season=result.snapshot.val()?.shopSeason;
 if(season?.status==='ready'&&season.version===SHOP_SEASON)return;
 if(!result.committed||season?.token!==token)throw Error('The new shop is preparing. Please retry shortly.');
 const patch={};
 for(const [uid,p]of Object.entries(profiles)){
  for(const field of ['decoration','effect','chatBanner'])patch['novaChatV2/profiles/'+uid+'/'+field]=null;
  if(items.some(item=>item.kind==='banner'&&item.id===p.banner))patch['novaChatV2/profiles/'+uid+'/banner']=null;
 }
 patch['novaControl/shopSeason']={version:SHOP_SEASON,status:'ready',at:now};
 await db.ref().update(patch);
}
