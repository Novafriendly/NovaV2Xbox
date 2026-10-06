export function nativeGameURL(item,kind,base){
 if(kind!=='game'||String(item?.id)!=='505')return null;
 const url=new URL(item.url,base),home=new URL(base);
 if(url.origin!==home.origin||url.pathname!=='/content/games/505.html')return null;
 return url.href;
}
