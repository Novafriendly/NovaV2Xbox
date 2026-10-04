export function loadedMusicArtwork(doc){
 for(const image of doc?.querySelectorAll?.('#npThumb,#npmCover,.np-thumb img,.np-art img,.now-playing-art img,[data-now-playing-art]')||[]){
  const src=image.currentSrc||image.getAttribute?.('src')||'';
  if(image.complete&&image.naturalWidth>0&&!image.classList?.contains('is-fallback-cover')&&!/cover-fallback|placeholder|Nova12\.png/i.test(src))return image;
 }
 return null;
}
export function copyMusicArtwork(image,canvas){
 if(!image?.complete||!image.naturalWidth)return null;
 try{canvas.width=canvas.height=96;const context=canvas.getContext('2d');if(!context)return null;context.drawImage(image,0,0,96,96);return canvas.toDataURL('image/png')}catch{return null}
}
export function musicArtworkCandidates(track,doc){
 const result=[];
 const add=value=>{if(typeof value==='string'&&value.trim())result.push(value.trim());else if(Array.isArray(value))value.forEach(add);else if(value&&typeof value==='object')add(value.src||value.url||value.href)};
 // The rendered player knows the final provider/proxy artwork URL.
 for(const image of doc?.querySelectorAll?.('#npThumb,#npmCover,.np-thumb img,.np-art img,.now-playing-art img,[data-now-playing-art]')||[]){
  add(image.currentSrc||image.getAttribute?.('src'));
  const background=image.style?.backgroundImage||doc.defaultView?.getComputedStyle?.(image).backgroundImage;
  const match=/url\(["']?(.*?)["']?\)/.exec(background||'');if(match)add(match[1]);
 }
 for(const key of ['thumb','pic','cover','artwork','image','albumArt','album_art','thumbnail','thumbnails'])add(track?.[key]);
 if(/^[A-Za-z0-9_-]{11}$/.test(String(track?.id||'')))add('https://i.ytimg.com/vi/'+track.id+'/hqdefault.jpg');
 return [...new Set(result)];
}
