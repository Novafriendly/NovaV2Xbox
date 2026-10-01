// Match the level thresholds used by Nova profiles and server reward grants.
export const totalXP=level=>500*(level-1)+125*(level-1)*(level-2);
export function levelForXP(xp){let level=1;while(level<2000&&xp>=totalXP(level+1))level++;return level;}
export function playerProgress(progress){
 const xp=Number.isFinite(progress?.xp)&&progress.xp>=0?progress.xp:0;
 return {coins:Number.isSafeInteger(progress?.coins)&&progress.coins>=0?progress.coins:0,level:levelForXP(xp)};
}
