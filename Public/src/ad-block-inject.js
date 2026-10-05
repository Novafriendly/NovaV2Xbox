/* Remote pages cannot spawn tabs. Nova toolbar links run outside this frame. */
(()=>{
 if(window.__novaAdBlock)return;window.__novaAdBlock=true;
 const original=window.open;
 const enabled=()=>{try{return adBlockingEnabled(window.top.localStorage)}catch{return true}};
 window.open=function(url,...args){if(enabled())return null;return original.call(this,url,...args)};
 document.addEventListener('click',event=>{if(!enabled())return;const link=event.target.closest?.('a[href]');if(link&&(isAdRequest(link.href)||(link.target&&!['_self','_parent','_top'].includes(link.target.toLowerCase())))){event.preventDefault();event.stopImmediatePropagation();}},true);
 const clean=()=>{if(!enabled())return;for(const node of document.querySelectorAll('iframe[src],script[src],ins.adsbygoogle,#sidebarad1,#sidebarad2')){if(node.matches('ins.adsbygoogle,#sidebarad1,#sidebarad2')||isAdRequest(node.src))node.remove();}};
 let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;clean()},100)}).observe(document,{childList:true,subtree:true});clean();
})();
