/* Stop decorative work behind an active game/app without resetting its state. */
(()=>{
 const panel=document.getElementById('panel'),video=document.getElementById('bg-video');
 let lastVisible;
 const backgroundVisible=()=>!document.hidden&&(!panel||panel.hidden)&&!document.querySelector?.('.os-window.os-maximized:not([hidden])');
 function update(){
  const visible=backgroundVisible();document.body.classList.toggle('nova-content-active',!visible);
  if(visible!==lastVisible){lastVisible=visible;dispatchEvent(new CustomEvent('nova-background-visibility',{detail:{visible}}));}
  if(!video)return;
  if(!visible||video.hidden||localStorage.getItem('nova_grad')||localStorage.getItem('nova_performance_mode')==='true'||localStorage.getItem('nova_reduce_motion')==='true')video.pause();
  else if(video.paused)video.play().catch(()=>{});
 }
 window.NovaPerformance={backgroundVisible,update};
 if(panel)new MutationObserver(update).observe(panel,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',update);addEventListener('nova-os-windows',update);addEventListener('storage',update);video?.addEventListener('play',()=>{if(!backgroundVisible())video.pause()});update();
})();
