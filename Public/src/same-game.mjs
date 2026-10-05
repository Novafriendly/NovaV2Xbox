export function sameGamePlayers(members,game,self){
 const kind=game.kind||(game._kind==='apps'?'app':'game');
 if(!['game','cloud'].includes(kind))return [];
 const seen=new Set();return members.filter(p=>{const uid=p.key||p.uid;if(!uid||uid===self||seen.has(uid)||!p.online||p.status==='offline')return false;const match=p.activityId!=null?String(p.activityId)===String(game.id)&&p.activityKind===kind:p.activity===game.name&&(!p.activityKind||p.activityKind===kind);if(match)seen.add(uid);return match});
}
