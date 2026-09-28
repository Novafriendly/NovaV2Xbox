(() => {
  'use strict';
  const url = 'https://6ab87f0e6a91203ed89fa447--neoostesting.netlify.app/neo-os/music-v2/index.html?v=20260919-scholarnook-v1&theme=system-v1&widgets=live-v1&runtime=20260908-audio-performance-v1';
  const panel = document.getElementById('panel');
  const host = document.createElement('div'); host.id = 'nova-music'; host.hidden = true;
  const status = document.createElement('div'); status.className = 'music-loading';
  const note = document.createElement('p'); note.textContent = 'Connecting Nova Music…';
  const retry = document.createElement('button'); retry.textContent = 'Try again'; retry.hidden = true;
  status.append(note, retry); host.append(status); panel.append(host);
  let view, controller, starting, timer, ready = false;
  const paths = {previous:'M6 5v14M19 5 8 12l11 7Z',next:'M18 5v14M5 5l11 7-11 7Z',play:'m8 5 11 7-11 7Z',pause:'M8 5v14M16 5v14',volume:'M3 9h4l5-4v14l-5-4H3ZM16 8q4 4 0 8'};
  const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[name]+'"/></svg>';
  const card = document.createElement('section'); card.className = 'xg-music'; card.setAttribute('aria-label','Nova Music player');
  const info = document.createElement('button'); info.className = 'music-track'; info.title = 'Open Nova Music';
  const cover = document.createElement('img'); cover.src = 'Nova12.png'; cover.alt = '';
  const meta = document.createElement('span'), title = document.createElement('b'), artist = document.createElement('small');
  title.textContent = 'Nova Music'; artist.textContent = 'Choose a song'; meta.append(title,artist); info.append(cover,meta);
  info.onclick = async () => {await document.querySelector('.guide').close(); openPage('music');};
  const controls = document.createElement('div'); controls.className = 'music-controls';
  const buttons = {};
  for (const [action,label,glyph] of [['previous','Previous song','previous'],['toggle','Play music','play'],['next','Next song','next']]) {
    const b = document.createElement('button'); b.innerHTML = icon(glyph); b.setAttribute('aria-label',label); b.disabled = true;
    b.onclick = () => command(action); buttons[action] = b; controls.append(b);
  }
  const volume = document.createElement('input'); volume.type = 'range'; volume.min = 0; volume.max = 100; volume.value = 70; volume.setAttribute('aria-label','Music volume'); volume.disabled = true;
  volume.oninput = () => command('setVolume',Number(volume.value)/100);
  const volumeIcon = document.createElement('span'); volumeIcon.innerHTML = icon('volume'); controls.append(volumeIcon,volume);
  const progress=document.createElement('div');progress.className='music-progress';
  const elapsed=document.createElement('small'),duration=document.createElement('small'),seek=document.createElement('input');
  seek.type='range';seek.min=0;seek.max=0;seek.step=.1;seek.value=0;seek.disabled=true;seek.setAttribute('aria-label','Song position');elapsed.textContent=duration.textContent='0:00';
  const stamp=n=>{n=Number.isFinite(n)?Math.max(0,Math.floor(n)):0;return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
  let dragging=false;
  seek.oninput=()=>{dragging=true;elapsed.textContent=stamp(Number(seek.value))};
  seek.onchange=()=>{command('seek',Number(seek.value));dragging=false};
  seek.onblur=()=>{dragging=false};progress.append(elapsed,seek,duration);
  card.append(info,progress,controls); const bottom = document.querySelector('.xg-bottom'); bottom.before(card);
  function player() {
    function find(win,depth=0){try{if(win.__NEO_METING_PLAYER__)return win.__NEO_METING_PLAYER__;if(depth<4)for(const f of win.document.querySelectorAll('iframe')){const p=find(f.contentWindow,depth+1);if(p)return p;}}catch{}return null;}
    return view?find(view.element.contentWindow):null;
  }
  function artwork(src){
    if(!src||!view||!controller)return;
    try{const target=new URL(src,url);if(!['https:','http:','blob:','data:'].includes(target.protocol))return;
      const proxied=target.origin===location.origin||['blob:','data:'].includes(target.protocol)?target.href:view.prefix+controller.config.codec.encode(target.href);
      if(cover.getAttribute('src')!==proxied)cover.src=proxied;
    }catch{}
  }
  async function command(action,value) {
    try {const p=player(); if(!p)throw Error('Open Nova Music to connect.'); await p[action](value); update();}
    catch {artist.textContent='Open Music to resume playback';}
  }
  function update() {
    const p=player(); if(!p)return;
    const track=p.track(), media=p.media();
    title.textContent=track?.name || track?.title || 'Nova Music';
    artist.textContent=track?.artist || track?.author || (track ? 'Now playing' : 'Choose a song');
    try {
      const image=view.element.contentDocument.getElementById('npThumb');
      const raw=track?.thumb||track?.pic||track?.cover||track?.artwork||track?.image;
      const trackImage=typeof raw==='string'?raw:raw?.src||raw?.url;
      const youtubeId=String(track?.id||'');
      artwork(trackImage||image?.getAttribute('src')||(/^[A-Za-z0-9_-]{11}$/.test(youtubeId)?'https://i.ytimg.com/vi/'+youtubeId+'/hqdefault.jpg':''));
    } catch {}
    const length=Number(media?.duration),position=Number(media?.currentTime)||0;
    seek.disabled=!Number.isFinite(length)||length<=0;seek.max=seek.disabled?0:length;
    if(!dragging){seek.value=position;elapsed.textContent=stamp(position)}
    duration.textContent=stamp(length);seek.setAttribute('aria-valuetext',stamp(Number(seek.value))+' of '+stamp(length));
    Object.values(buttons).forEach(b=>b.disabled=!track); volume.disabled=!media;
    const playing=media&&!media.paused&&!media.ended;
    buttons.toggle.innerHTML=icon(playing?'pause':'play'); buttons.toggle.setAttribute('aria-label',playing?'Pause music':'Play music');
    card.classList.toggle('playing',!!playing);
    if(media && document.activeElement!==volume)volume.value=Math.round(media.volume*100);
  }
  cover.onerror=()=>{if(!cover.src.endsWith('/Nova12.png'))cover.src='Nova12.png';};
  const glass = `html,body,.main-panel,.content-area{background:transparent!important;background-image:none!important} .sidebar,.top-bar,.spotify-player,.np-inline,.now-playing-bar{background:rgba(10,13,12,.62)!important;backdrop-filter:blur(22px);border-color:rgba(255,255,255,.1)!important} .library-panel,.music-primary-nav,.music-brand{background:rgba(20,24,22,.38)!important} .card,.music-card{background:rgba(255,255,255,.065)!important;transition:transform .2s,background .2s} .card:hover,.music-card:hover{background:rgba(255,255,255,.13)!important;transform:translateY(-3px)} .music-brand-mark{color:#76d14b!important}`;
  function customize() {
    try {
      const doc=view.element.contentDocument; if(!doc?.body)return;
      if(!doc.getElementById('nova-music-glass')) {
        const style=doc.createElement('style'); style.id='nova-music-glass'; style.textContent=glass; doc.head.append(style);
        doc.title='Nova Music';
        doc.documentElement.style.setProperty('color-scheme','normal','important');
        doc.documentElement.style.setProperty('background','transparent','important');
        doc.body.style.setProperty('background','transparent','important');
        doc.querySelectorAll('.main-panel,.content-area,.np-view').forEach(el=>el.style.setProperty('background','transparent','important'));
        doc.querySelectorAll('.sidebar,.top-bar,.spotify-player,.np-inline').forEach(el=>el.style.setProperty('background','rgba(10,13,12,.58)','important'));
        const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT); let node;
        while((node=walker.nextNode()))if(!['SCRIPT','STYLE'].includes(node.parentElement?.tagName)&&/NEO Music|NEO MUSIC/.test(node.textContent))node.textContent=node.textContent.replace(/NEO Music|NEO MUSIC/g,'Nova Music');
      }
      if(player()) {ready=true;status.hidden=true;clearTimeout(timer);update();}
    } catch {}
  }
  async function start() {
    if(starting)return starting;
    status.hidden=false;retry.hidden=true;note.textContent='Connecting Nova Music…';
    starting=(async()=>{
      try {
        controller=await NovaConnection.create();
        view=controller.createFrame(); view.element.id='nova-music-frame'; view.element.title='Nova Music'; view.element.allow='autoplay; fullscreen';
        view.element.addEventListener('load',customize); host.append(view.element); view.go(url);
        timer=setTimeout(()=>{if(!ready){note.textContent='Music is taking longer to connect. You can try again.';retry.hidden=false;}},45000);
      } catch(error) {note.textContent='Could not connect to Nova Music. '+error.message;retry.hidden=false;starting=null;}
    })();return starting;
  }
  retry.onclick=()=>{clearTimeout(timer);view?.element.remove();view=null;starting=null;ready=false;start();};
  window.NovaMusic={reload(){view?.element.contentWindow.location.reload();},open(){panel.classList.remove('full-library');panel.dataset.view='music';panel.hidden=false;document.getElementById('system').hidden=true;document.getElementById('panel-content').hidden=true;document.getElementById('panel-title').textContent='Nova Music';document.querySelectorAll('nav [data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page==='music'));host.hidden=false;start();},hide(){host.hidden=true;}};
  setInterval(()=>{if(view){customize();if(ready)update();}},750);
})();
