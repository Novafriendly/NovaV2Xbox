// Animated wallpaper previews are local to a tile; still images never animate.
const activePreviews=new Set();
document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const stop of [...activePreviews])stop()});
export function createWallpaperTile(item,onSelect){
 const button=document.createElement('button'),label=document.createElement('span');
 const video=item.type==='video',gif=item.type==='gif'||/\.gif(?:[?#]|$)/i.test(item.src);
 const media=document.createElement(video?'video':'img');let playing=false,disposed=false;
 label.textContent=item.name;button.append(media,label);button.onclick=()=>onSelect(item.src,video?'video':'image');
 media.className='wallpaper-media';
 if(!video&&!gif){media.src=item.poster||item.src;media.alt='';media.loading='lazy';return {button,dispose(){}}}
 let canvas;
 if(video){media.muted=true;media.defaultMuted=true;media.loop=true;media.playsInline=true;media.preload=item.poster?'none':'metadata';if(item.poster)media.poster=item.poster;
  media.addEventListener('loadedmetadata',()=>{if(!playing&&!item.poster&&Number.isFinite(media.duration))media.currentTime=Math.min(.1,media.duration/2)});
 }else{media.alt='';canvas=document.createElement('canvas');canvas.className='wallpaper-still';canvas.setAttribute('aria-hidden','true');button.insertBefore(canvas,media);media.style.opacity='0';
  media.onload=()=>{if(disposed)return;canvas.width=Math.min(360,media.naturalWidth);canvas.height=Math.round(canvas.width*media.naturalHeight/media.naturalWidth);try{canvas.getContext('2d').drawImage(media,0,0,canvas.width,canvas.height);canvas.dataset.ready='true'}catch{}if(!playing){media.removeAttribute('src');media.style.opacity='0'}};
 }
 const load=()=>{if(!media.getAttribute('src'))media.src=item.src};
 function stop(){playing=false;activePreviews.delete(stop);button.classList.remove('previewing');if(video){media.pause();if(media.readyState>0)media.currentTime=item.poster?0:Math.min(.1,media.duration/2||0)}else{media.style.opacity='0';media.removeAttribute('src')}}
 function start(){if(disposed||document.hidden)return;for(const other of [...activePreviews])if(other!==stop)other();playing=true;activePreviews.add(stop);button.classList.add('previewing');load();if(video)media.play().then(()=>{if(!playing)media.pause()}).catch(()=>{if(playing)stop()});else media.style.opacity='1'}
 button.addEventListener('pointerenter',start);button.addEventListener('pointerleave',stop);button.addEventListener('focus',start);button.addEventListener('blur',stop);
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){if(video&&!item.poster&&!media.getAttribute('src'))load();if(gif&&!canvas.dataset.ready)load()}else stop()}},{rootMargin:'80px'});observer.observe(button);
 return {button,dispose(){disposed=true;observer.disconnect();stop();media.removeAttribute('src');if(video)media.load()}};
}

