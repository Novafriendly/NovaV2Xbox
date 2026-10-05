/* Select only the requested Achroma cloud source and game; native code owns sessions. */
(()=>{
 function attach(doc,item,{signal,onStatus=()=>{},onReady=()=>{},onError=()=>{}}={}){
  if(signal?.aborted||!['Stratus','Synapse'].includes(item.source)||!item.sourceId)return false;
  const win=doc.defaultView;let switched=false,chosen=false,searched=false,launched=false,ended=false;
  const style=doc.createElement('style');style.id='nova-achroma-player';style.textContent='#cloud-overlay:not([hidden]){position:fixed!important;inset:0!important;width:100%!important;height:100%!important;z-index:9999!important;background:#000!important}#cloud-overlay .cloud-frame{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border:0!important;border-radius:0!important}';doc.head.append(style);
  const cleanup=()=>{if(ended)return;ended=true;observer.disconnect();win.clearTimeout(timer);win.clearInterval(poll);signal?.removeEventListener('abort',cleanup);win.removeEventListener('pagehide',cleanup)};
  const update=()=>{if(ended)return;
   const mode=doc.getElementById('mode-toggle');if(!mode)return;
   if(mode.dataset.mode!=='cloud'){{const tab=mode.querySelector('[data-mode="cloud"]');if(!tab)return;switched=true;tab.click()}return}
   const option=[...doc.querySelectorAll('.source-picker-option')].find(e=>e.dataset.source===item.source);
   if(!option?.classList.contains('selected')){if(option){chosen=true;option.click()}return}
   if(!searched){const input=doc.getElementById('games-search-input');if(!input)return;searched=true;input.value=item.name;input.dispatchEvent(new win.Event('input',{bubbles:true}));onStatus('Finding '+item.name+'…')}
   if(!launched){const card=[...doc.querySelectorAll('.game-card')].find(e=>e.getAttribute('data-game-id')===item.sourceId);if(card){launched=true;win.clearTimeout(timer);card.click()}return}
   const status=doc.getElementById('cloud-status');if(status?.classList.contains('cloud-status-failed')){onError();cleanup();return}
   const message=doc.getElementById('cloud-status-text')?.textContent?.trim();if(message)onStatus(message);
   if(doc.querySelector('.cloud-frame-live')){onReady();cleanup()}
  };
  const observer=new win.MutationObserver(update);observer.observe(doc.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-mode','hidden']});
  const timer=win.setTimeout(()=>{onStatus('Could not select this game. Try another cloud source.');onError();cleanup()},45000);
  const poll=win.setInterval(update,300);signal?.addEventListener('abort',cleanup,{once:true});win.addEventListener('pagehide',cleanup,{once:true});update();return true;
 }
 window.NovaAchromaCloud={attach};
})();
