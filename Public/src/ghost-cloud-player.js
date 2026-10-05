/* Keep GhostCloud controls available without reserving space above the stream. */
(()=>{
 function attach(doc,{signal}={}){
  if(signal?.aborted||doc.getElementById('nova-ghost-player-style'))return;
  const style=doc.createElement('style');style.id='nova-ghost-player-style';style.textContent=`
#player-modal .player-container{inset:0!important;border-radius:0!important;box-shadow:none!important}
#player-modal .player-video{top:0!important;left:0!important;width:100%!important;height:100%!important;object-fit:cover!important}
#player-modal .player-status,#player-modal .player-recover{inset:0!important}
#player-modal .player-bar{position:absolute!important;inset:0 0 auto!important;z-index:10!important;padding-right:104px!important;background:rgba(12,15,20,.88)!important;backdrop-filter:blur(16px);opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:translateY(-100%);transition:opacity .18s,transform .18s,visibility .18s}
#player-modal.nova-controls-open .player-bar{opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:translateY(0)}
#player-modal .player-sound{top:12px!important}
#player-modal.nova-controls-open .player-sound{top:54px!important}
#nova-ghost-controls{position:absolute;right:12px;top:10px;z-index:12;padding:7px 12px;border:1px solid #ffffff30;border-radius:10px;background:#10131899;color:#fff;font:600 12px system-ui;cursor:pointer;backdrop-filter:blur(12px);opacity:.65;transition:opacity .18s}
#nova-ghost-controls:hover,#nova-ghost-controls:focus-visible{opacity:1;outline:2px solid #ffffff70;outline-offset:2px}
@media(prefers-reduced-motion:reduce){#player-modal .player-bar,#nova-ghost-controls{transition:none}}
`;doc.head.append(style);
  let button;const update=()=>{const modal=doc.getElementById('player-modal'),container=modal?.querySelector('.player-container');if(!container||button?.isConnected)return;
   button=doc.createElement('button');button.id='nova-ghost-controls';button.type='button';button.textContent='Controls';button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Show game controls');
   button.onclick=()=>{const open=modal.classList.toggle('nova-controls-open');button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Hide game controls':'Show game controls');button.textContent=open?'Hide':'Controls'};container.append(button);
  };
  update();const observer=new doc.defaultView.MutationObserver(update);observer.observe(doc.documentElement,{childList:true,subtree:true});
  const cleanup=()=>{observer.disconnect();button?.remove();style.remove();doc.getElementById('player-modal')?.classList.remove('nova-controls-open')};
  signal?.addEventListener('abort',cleanup,{once:true});doc.defaultView.addEventListener('pagehide',cleanup,{once:true});
 }
 window.NovaGhostCloud={attach};
})();
