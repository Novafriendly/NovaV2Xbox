export function clampRect(rect, width, height, reserve=88){
 const maxW=Math.max(250,width-16),maxH=Math.max(180,height-reserve-16);
 const w=Math.max(Math.min(340,maxW),Math.min(maxW,rect.w)),h=Math.max(Math.min(220,maxH),Math.min(maxH,rect.h));
 return {x:Math.max(8,Math.min(width-w-8,rect.x)),y:Math.max(8,Math.min(height-reserve-h-8,rect.y)),w,h};
}
export function centeredRect(width,height,w=780,h=530){return clampRect({x:(width-w)/2,y:(height-88-h)/2,w,h},width,height)}
export function activityTitle(url,title){try{const p=new URL(url,'https://nova.local');return p.pathname.endsWith('/player.html')?{kind:p.searchParams.get('kind')||'game',id:p.searchParams.get('id'),title}:null}catch{return null}}
export function elapsedLabel(since,now=Date.now()){const seconds=Math.max(0,Math.floor((now-Number(since))/1000));return Math.floor(seconds/3600)?Math.floor(seconds/3600)+'h '+Math.floor(seconds%3600/60)+'m':Math.floor(seconds/60)+'m '+seconds%60+'s'}
export function normalizeUpdate(id,value){const lines=String(value.text||value.description||'').split('\n');if(value.title&&lines[0]===value.title)lines.shift();return {id,author:value.authorUid||value.author||'',authorName:value.authorName||'',authorRole:value.authorRole||'',title:String(value.subject||value.title||lines.shift()||'Nova update').slice(0,120),text:lines.join('\n'),createdAt:Number(value.createdAt||value.at)||0};}
