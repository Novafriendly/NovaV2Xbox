(() => {
 const loading=document.getElementById('loading'),status=document.getElementById('status'),retry=document.getElementById('retry');
 let view,observer,timer;let currentURL='https://voidgpt.xyz/~v/';
 function navigate(url){currentURL=url;view.go(url)}
 function customize(){try{
  const doc=view.element.contentDocument;if(!doc?.body||doc.URL==='about:blank')return;
  const actual=new URL(doc.URL);if(actual.origin===location.origin&&actual.pathname.startsWith('/~v/')){navigate('https://voidgpt.xyz'+actual.pathname+actual.search+actual.hash);return;}
  if(!doc.getElementById('novatube-theme')){
   const style=doc.createElement('style');style.id='novatube-theme';style.textContent=`html,body,.shell{background:transparent!important;background-image:none!important;color-scheme:normal!important}.eaq,#vn-bg,body::before,body::after,.nav__out,.nav__acct,.nav__div{display:none!important}.nav__isl{background:rgba(15,19,17,.65)!important;backdrop-filter:blur(22px)}.find,.desc{background:rgba(15,19,17,.5)!important}.vc__art{background:rgba(255,255,255,.06)!important}html{scrollbar-width:thin;scrollbar-color:#777 transparent}`;doc.head.append(style);
   doc.documentElement.style.setProperty('background','transparent','important');doc.documentElement.style.setProperty('color-scheme','normal','important');doc.body.style.setProperty('background','transparent','important');
   doc.addEventListener('submit',event=>{
    const form=event.target;if(!form.matches('#find,form[role=search]'))return;
    const input=form.querySelector('input[type=search],input');if(!input)return;
    event.preventDefault();event.stopImmediatePropagation();const target=new URL('https://voidgpt.xyz/~v/');if(input.value.trim())target.searchParams.set('q',input.value.trim());navigate(target.href);
   },true);
   doc.addEventListener('click',event=>{
    const a=event.target.closest?.('a[href]');if(!a||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    let target;try{target=new URL(a.getAttribute('href'),currentURL)}catch{return}
    if(target.origin===location.origin&&target.pathname.startsWith('/~v/'))target=new URL(target.pathname+target.search+target.hash,'https://voidgpt.xyz');
    if(target.origin!=='https://voidgpt.xyz'||!target.pathname.startsWith('/~v/'))return;
    event.preventDefault();event.stopImmediatePropagation();navigate(target.href);
   },true);
   observer?.disconnect();observer=new MutationObserver(customize);observer.observe(doc.body,{childList:true,subtree:true});
  }
  doc.title=doc.title.replace(/VoidTube/gi,'NovaTube');
  for(const heading of doc.querySelectorAll('#heading,.page-title'))if(/VoidTube/i.test(heading.textContent))heading.textContent=heading.textContent.replace(/VoidTube/gi,'NovaTube');
  loading.hidden=true;clearTimeout(timer);
 }catch{}}
 async function start(){retry.hidden=true;loading.hidden=false;status.textContent='Connecting through Nova…';try{
  const controller=await NovaConnection.create();view=controller.createFrame();view.element.title='NovaTube videos';view.element.allow='autoplay; fullscreen; picture-in-picture';view.element.allowFullscreen=true;view.element.addEventListener('load',customize);document.body.append(view.element);navigate('https://voidgpt.xyz/~v/');timer=setTimeout(()=>{if(!loading.hidden){status.textContent='The video site is taking longer to respond.';retry.hidden=false}},45000);
 }catch(e){status.textContent='Could not connect. '+e.message;retry.hidden=false}}
 retry.onclick=()=>{observer?.disconnect();clearTimeout(timer);view?.element.remove();start()};setInterval(customize,1500);start();
})();
