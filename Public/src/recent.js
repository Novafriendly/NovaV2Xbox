(() => {
  'use strict';
  const pages=new Map();const sessions=new Map();let defaults=[];
  const account=()=>localStorage.getItem('nova_user')||localStorage.getItem('nova_username')||'guest';
  const key=()=> 'nova-v2-recent-'+account();
  const kind=g=>g.kind==='app'||g._kind==='apps'?'app':'game';
  const identity=g=>kind(g)+':'+g.id;
  function list(){try{const rows=JSON.parse(localStorage.getItem(key())||'[]');return Array.isArray(rows)?rows.filter(g=>g&&g.id!=null&&typeof g.name==='string').slice(0,12):[]}catch{return []}}
  function record(g){const item={id:g.id,name:g.name,art:g.art,kind:kind(g),playedAt:Date.now()};const rows=[item,...list().filter(x=>identity(x)!==identity(item))].slice(0,12);localStorage.setItem(key(),JSON.stringify(rows));render();window.novaGuideRender?.('home');}
  function freshFrame(){const el=document.createElement('iframe');el.id='system';el.title='Nova';el.allow='microphone; autoplay; fullscreen';el.hidden=true;document.getElementById('panel-content').before(el);return el;}
  function park(){if(frame.dataset.session!=='true')return;frame.hidden=true;frame.removeAttribute('id');frame=freshFrame();}
  function launch(g){
    cancelAIMotion();window.NovaMusic?.hide();const id=account()+':'+identity(g);
    if(frame.dataset.session==='true'){frame.hidden=true;frame.removeAttribute('id');}else frame.remove();
    let el=sessions.get(id);
    if(!el){el=freshFrame();el.dataset.session='true';el.src='player.html?kind='+kind(g)+'&id='+encodeURIComponent(g.id);sessions.set(id,el);}
    else {sessions.delete(id);sessions.set(id,el);}
    frame=el;frame.id='system';frame.title=g.name;frame.hidden=false;
    panel.classList.remove('full-library');panel.dataset.view=kind(g);panel.hidden=false;content.hidden=true;document.getElementById('panel-title').textContent=g.name;
    document.querySelectorAll('nav [data-page]').forEach(b=>b.classList.remove('active'));
    stopInactive();
    record(g);
  }
  function stopInactive(){
    for(const [id,el] of sessions){
      const visible=el===frame&&!panel.hidden&&!el.hidden&&['game','app'].includes(panel.dataset.view);
      if(visible)continue;
      // Unload the entire browsing context, including nested Web Audio and timers.
      // Muting HTML media alone leaves many games' audio engines running.
      el.src='about:blank';el.remove();sessions.delete(id);
      if(frame===el)frame=freshFrame();
    }
  }
  new MutationObserver(stopInactive).observe(panel,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','data-view']});
  function render(){
    const host=document.getElementById('tiles'),recent=list();host.replaceChildren();
    const rows=recent.length?recent:defaults;
    rows.slice(0,9).forEach((g,i)=>{
      const b=document.createElement('button');b.className='tile'+(i===0?' selected':'')+(recent.length&&i===0?' resume-tile':'');
      b.setAttribute('aria-label',(recent.length&&i===0?'Resume ':'Open ')+g.name);
      const img=document.createElement('img');img.src=g.art||'Nova12.png';img.alt='';img.onerror=()=>{img.onerror=null;img.src='Nova12.png';};
      const caption=document.createElement('span');const name=document.createElement('b');name.textContent=g.name;caption.append(name);
      if(recent.length&&i===0){const label=document.createElement('small');label.textContent='▶ Resume '+(kind(g)==='app'?'app':'game');caption.prepend(label);}
      b.append(img,caption);b.onclick=()=>launch(g);const select=()=>{host.querySelectorAll('.tile').forEach(x=>x.classList.toggle('selected',x===b));};b.onmouseenter=select;b.onfocus=select;host.append(b);
    });
  }
  function openSystem(page){
    if(!['search','ai','novatube'].includes(page)){park();return;}
    const key=account()+':'+page;
    if(frame.dataset.session==='true'){frame.hidden=true;frame.removeAttribute('id');}else frame.remove();
    if(!pages.has(key)){const el=freshFrame();el.dataset.session='true';pages.set(key,el);}
    frame=pages.get(key);frame.id='system';frame.hidden=false;
  }
  window.NovaRecent={list,record,park,launch,openSystem};
  fetch('home-covers.json').then(r=>r.json()).then(rows=>{defaults=rows;render();}).catch(render);
  addEventListener('storage',render);addEventListener('nova-profile-changed',render);render();window.novaGuideRender?.('home');
})();
