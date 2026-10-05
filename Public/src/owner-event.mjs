export function eventNotice(event,now=Date.now()){
 if(!event?.id||!Number.isFinite(event.until)||event.until<=now)return null;
 return {id:event.id,title:event.title||'Community boost',text:(event.authorName||'Nova Owner')+' started this event: '+(event.xpMultiplier||1)+'× gameplay XP and '+(event.coinMultiplier||1)+'× challenge coins. Ends '+new Date(event.until).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'.'};
}
