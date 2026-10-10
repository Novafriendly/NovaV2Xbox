/* Experimental local practice controls. Screen changes are not player positions. */

(()=>{

 'use strict';

 const codes={space:32,shift:16,ctrl:17,alt:18,enter:13};

 function parse(text){

  const parts=text.toLowerCase().split(',').map(s=>s.trim());

  if(!parts.length||parts.length>12||parts.some(s=>!/^([a-z0-9]|space|shift|ctrl|alt|enter|mouse0|mouse1)$/.test(s)))throw Error('Use up to 12 keys or mouse0/mouse1, separated by commas.');

  return parts.map(key=>key.startsWith('mouse')?{mouse:true,button:Number(key.slice(5)),code:key}:{key:key==='space'?' ':key,code:key.length===1?(/\d/.test(key)?'Digit':'Key')+key.toUpperCase():({ctrl:'ControlLeft',shift:'ShiftLeft',alt:'AltLeft',space:'Space',enter:'Enter'})[key],keyCode:codes[key]||key.toUpperCase().charCodeAt(0)});

 }

 function editSequence(edit,confirm,select='mouse0'){

  const bind=value=>{const sequence=parse(value);if(sequence.length!==1)throw Error('Each binding must be one key or mouse button.');return sequence[0];};

  return [bind(edit),bind(select),bind(confirm||edit)];

 }

 function createInput(canvas,{schedule=setTimeout,cancel=clearTimeout}={}){

  let generation=0;const held=new Map(),timers=new Set();

  const emit=(type,key)=>{

   if(key.mouse){window.NovaLOLInput?.mouse(canvas,type==='keydown'?'mousedown':'mouseup',{button:key.button,buttons:type==='keydown'?(key.button===0?1:2):0});return;}

   if(window.NovaLOLInput){window.NovaLOLInput.keyboard(canvas,type,key);return;}

   const event=new KeyboardEvent(type,{...key,which:key.keyCode,bubbles:true,cancelable:true});Object.defineProperties(event,{keyCode:{get:()=>key.keyCode},which:{get:()=>key.keyCode}});canvas.dispatchEvent(event);

  };

  const stop=()=>{generation++;for(const id of timers)cancel(id);timers.clear();for(const key of held.values())emit('keyup',key);held.clear();};

  const later=(fn,ms)=>{const id=schedule(()=>{timers.delete(id);fn()},ms);timers.add(id);};

  const play=(sequence,delay,{repeat=false,hold=60}={})=>{

   stop();const current=generation;canvas.focus();const dwell=Math.max(32,Math.min(hold,delay-8));

   const cycle=()=>{if(current!==generation)return;sequence.forEach((key,i)=>{

    const press=()=>{if(current!==generation)return;held.set(key.code,key);emit('keydown',key);};if(i===0)press();else later(press,i*delay);

    later(()=>{if(current!==generation)return;held.delete(key.code);emit('keyup',key);},i*delay+dwell);

   });if(repeat)later(cycle,sequence.length*delay);};cycle();

  };

  return {play,stop};

 }

 function installEditorGuard(target,getPanel,onEdit=()=>{}){

  // Run before Unity's window capture handlers. Keep native input defaults intact.

  const guard=e=>{const panel=getPanel();if(!panel?.contains(e.target))return;

   if(e.type==='mousedown'||e.type==='pointerdown')onEdit();

   if(e.type.startsWith('pointer')&&e.target.closest?.('header')&&!e.target.closest?.('button'))return;
   e.stopImmediatePropagation();

  };

  const types=['keydown','keyup','keypress','pointerdown','pointermove','mousemove','mousedown','mouseup'];

  for(const type of types)target.addEventListener(type,guard,true);

  return ()=>{for(const type of types)target.removeEventListener(type,guard,true);};

 }

 let releaseMacro=()=>{},macroDown=()=>{},macroUp=()=>{};

 const onMacroDown=e=>macroDown(e),onMacroUp=e=>macroUp(e);

 window.addEventListener('keydown',onMacroDown,true);window.addEventListener('keyup',onMacroUp,true);

 const removeEditorGuard=installEditorGuard(window,()=>document.getElementById('nova-lol-practice'),()=>{

  releaseMacro();if(document.pointerLockElement)document.exitPointerLock?.();

 });

 window.NovaLOLPractice={parse,editSequence,createInput,installEditorGuard};

 let bootTimer=setInterval(()=>{const canvas=document.querySelector('#gameContainer canvas');if(!window.novaLOLLoaded||!canvas)return;clearInterval(bootTimer);mount(canvas);},250);

 addEventListener('pagehide',()=>{clearInterval(bootTimer);removeEditorGuard();window.removeEventListener('keydown',onMacroDown,true);window.removeEventListener('keyup',onMacroUp,true);},{once:true});

 function mount(canvas){

  if(document.getElementById('nova-lol-practice'))return;

  const style=document.createElement('style');style.textContent=`

   #nova-lol-practice{position:fixed;z-index:2147483646;top:18px;right:18px;width:246px;max-width:calc(100vw - 24px);max-height:calc(100vh - 36px);overflow:auto;background:linear-gradient(135deg,#17090af7,#080809f7);color:#eef3fa;border:1px solid #ffffff22;border-radius:13px;padding:12px;font:12px system-ui;box-shadow:0 12px 40px #0008;backdrop-filter:blur(18px);animation:novaLolIn .18s ease-out}

   @keyframes novaLolIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}

   #nova-lol-practice *{box-sizing:border-box}#nova-lol-practice header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}#nova-lol-practice header small{display:block;font-size:9px;color:#bda4a8;letter-spacing:1.1px;margin-top:3px}

   #nova-lol-practice button,#nova-lol-practice input,#nova-lol-practice select{font:inherit;color:inherit;background:#ffffff0b;border:1px solid #ffffff20;border-radius:6px;padding:6px}#nova-lol-practice button{cursor:pointer;transition:background .15s}#nova-lol-practice button:hover{background:#ffffff1c}#nova-lol-practice button:focus-visible,#nova-lol-practice input:focus-visible{outline:2px solid #ef3340;outline-offset:1px}#nova-lol-practice select option{background:#15090b}#nova-lol-practice input[type=checkbox]{accent-color:#ef3340}

   #nova-lol-practice nav{display:flex;gap:4px;padding:3px;background:#0003;border-radius:8px;margin-bottom:10px}#nova-lol-practice nav button{flex:1;border:0;color:#9babbe}#nova-lol-practice nav button[aria-selected=true]{color:#fff;background:#ef334022}

   #nova-lol-practice label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0;min-height:23px}#nova-lol-practice label.check{justify-content:flex-start}#nova-lol-practice label.stack{display:block}#nova-lol-practice .stack input{width:100%;margin-top:5px}#nova-lol-practice input[type=number]{width:72px}#nova-lol-practice input[type=range]{width:112px;padding:0;accent-color:#ef3340}#nova-lol-practice p{font-size:10px;line-height:1.45;color:#c0aeb1;margin:8px 0}#nova-lol-practice footer{border-top:1px solid #ffffff15;padding-top:8px;margin-top:10px;color:#bda4a8;font-size:10px;line-height:1.4}#nova-lol-practice output{display:block}#nova-lol-practice [hidden]{display:none!important}#nova-lol-practice #lol-status{color:#ff8189;margin-top:4px}

   #nova-lol-launch{position:fixed;right:18px;top:18px;z-index:2147483646;border:1px solid #ffffff30;border-radius:9px;background:#10151aed;color:#b7ecf0;padding:7px 11px;font:11px system-ui;cursor:pointer}#nova-lol-crosshair,#nova-lol-fov{position:fixed;pointer-events:none;z-index:2147483645;left:50%;top:50%;transform:translate(-50%,-50%)}#nova-lol-crosshair{width:14px;height:14px}#nova-lol-crosshair:before,#nova-lol-crosshair:after{content:'';position:absolute;background:var(--cross-color,#ef3340);box-shadow:0 0 3px #000}#nova-lol-crosshair:before{width:100%;height:2px;top:calc(50% - 1px)}#nova-lol-crosshair:after{height:100%;width:2px;left:calc(50% - 1px)}#nova-lol-fov{border:1px solid #ef334088;border-radius:50%}

   #nova-lol-practice{isolation:isolate;border-color:#ef334044;box-shadow:0 18px 50px #000b,0 0 24px #a0081018;resize:horizontal;min-width:226px}
   #nova-lol-practice:before{content:'';position:absolute;inset:50px 12px 0;background:url('/Nova12.png') center/180px no-repeat;opacity:.055;pointer-events:none;z-index:-1}
   #nova-lol-practice header{cursor:grab;touch-action:none;user-select:none;padding-bottom:10px;border-bottom:1px solid #ef334029}
   #nova-lol-practice header:active{cursor:grabbing}
   #nova-lol-practice button{background:#170d10;border-color:#ef33402b;transition:background .15s,border-color .15s,box-shadow .15s}
   #nova-lol-practice button:hover{background:#361015;border-color:#ef334088}
   #nova-lol-practice button[aria-pressed=true],#nova-lol-practice nav button[aria-selected=true]{background:#a51a27;color:white;box-shadow:0 2px 12px #ef334025}
   #nova-lol-practice input:focus-visible{outline-color:#ef3340}#nova-lol-practice label{padding:3px 0}
   #nova-lol-practice{width:520px;min-width:300px;padding:0;border-radius:10px;background:#0b0b0ef7;border:1px solid #69202b;--panel-opacity:.97}
   #nova-lol-practice header{margin:0;padding:15px 16px;background:linear-gradient(110deg,#251015,#0f0f13);border-bottom:1px solid #ef334027}
   #nova-lol-practice header strong{font-size:17px;letter-spacing:2px}#nova-lol-practice header img{width:24px;height:24px;object-fit:contain;vertical-align:middle;margin-right:8px}
   #nova-lol-practice .lol-session{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 16px;border-bottom:1px solid #ffffff0a;background:#121216}
   #nova-lol-practice .lol-session span{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#8c858d}#nova-lol-practice .lol-session strong{display:block;font-size:12px;color:#eee;margin-top:4px;letter-spacing:0}
   #nova-lol-practice .lol-layout{display:grid;grid-template-columns:108px minmax(0,1fr);min-height:300px}
   #nova-lol-practice nav{display:flex;flex-direction:column;gap:7px;margin:0;padding:13px 8px;border-radius:0;background:#101014;border-right:1px solid #ffffff0b}
   #nova-lol-practice nav button{flex:0;text-align:left;padding:10px 8px;border-radius:5px;background:transparent;font-size:11px}
   #nova-lol-practice nav button[aria-selected=true]{background:#ef334014;box-shadow:inset 2px 0 #ef3340;color:#ff5363}
   #nova-lol-practice .lol-content{padding:14px;min-width:0}#nova-lol-practice [role=tabpanel]{border:1px solid #ffffff0b;border-radius:7px;padding:12px;background:#101014bd;animation:novaLolIn .16s ease-out}
   #nova-lol-practice label.check{justify-content:space-between;flex-direction:row-reverse;border-bottom:1px solid #ffffff06;padding:7px 0;margin:2px 0}
   #nova-lol-practice input[type=checkbox]{appearance:none;width:27px;height:15px;padding:0;border:0;border-radius:12px;background:#36323a;position:relative;flex-shrink:0;transition:background .15s}
   #nova-lol-practice input[type=checkbox]:before{content:'';position:absolute;top:3px;left:3px;width:9px;height:9px;border-radius:50%;background:white;transition:transform .15s}
   #nova-lol-practice input[type=checkbox]:checked{background:#ef3340}#nova-lol-practice input[type=checkbox]:checked:before{transform:translateX(12px)}
   #nova-lol-practice footer{margin:0;padding:10px 16px;background:#0a0a0d;border-top:1px solid #ffffff0b}
   #nova-lol-practice .lol-metrics{display:flex;justify-content:space-between;padding:9px 0;color:#b4aab4;font-size:11px}
   #nova-lol-practice[data-compact=true]{width:370px}#nova-lol-practice[data-compact=true] .lol-layout{grid-template-columns:78px minmax(0,1fr)}
   @media(max-height:800px),(min-width:441px) and (max-width:1440px){#nova-lol-practice{width:400px;top:10px;right:10px;font-size:11px;max-height:calc(100dvh - 20px)}#nova-lol-practice header{padding:10px 12px}#nova-lol-practice .lol-layout{grid-template-columns:84px minmax(0,1fr);min-height:0}#nova-lol-practice .lol-content{padding:9px}#nova-lol-practice .lol-session{padding:8px 12px}#nova-lol-practice nav{padding:9px 6px}#nova-lol-practice label{margin:5px 0}#nova-lol-practice footer{padding:7px 12px}}
   @media(max-width:440px){#nova-lol-practice{width:calc(100vw - 24px);min-width:0}#nova-lol-practice .lol-layout{grid-template-columns:75px minmax(0,1fr)}#nova-lol-practice .lol-content{padding:8px}#nova-lol-practice input[type=range]{width:90px}}
   #nova-lol-practice{border-color:var(--accent,#ef3340)}#nova-lol-practice header{background:linear-gradient(110deg,var(--accent-tint,#251015),var(--menu-bg,#0b0b0e))}
   #nova-lol-practice .lol-session,#nova-lol-practice nav,#nova-lol-practice footer,#nova-lol-practice [role=tabpanel]{background:var(--surface,#101014)}
   #nova-lol-practice input[type=range]{accent-color:var(--accent,#ef3340)}#nova-lol-practice input[type=checkbox]:checked,#nova-lol-practice button[aria-pressed=true]{background:var(--accent,#ef3340)}
   #nova-lol-practice nav button[aria-selected=true]{color:var(--accent,#ef3340);box-shadow:inset 2px 0 var(--accent,#ef3340);background:var(--accent-tint,#251015)}
   #nova-lol-practice button:hover{border-color:var(--accent,#ef3340);background:var(--accent-tint,#251015)}#nova-lol-practice input:focus-visible,#nova-lol-practice button:focus-visible{outline-color:var(--accent,#ef3340)}
  `;document.head.append(style);

  const panel=document.createElement('section');panel.id='nova-lol-practice';panel.setAttribute('aria-label','1v1.LOL practice controls');

  panel.innerHTML=`<header><div><strong>Nova · 1v1.LOL</strong><small>PRACTICE TOOLS · F8 TO HIDE</small></div><button id="lol-hide" aria-label="Hide panel">×</button></header>

   <div class="lol-session"><div><span>User</span><strong>Unknown</strong></div><div><span>Players</span><strong>Unknown</strong></div><div><span>Game mode</span><strong>Unknown</strong></div></div><div class="lol-layout">
   <nav role="tablist" aria-label="Practice categories"><button id="lol-tab-aim" role="tab" aria-selected="true" aria-controls="lol-pane-aim">Aim</button><button id="lol-tab-visual" role="tab" aria-selected="false" aria-controls="lol-pane-visual">Visual</button><button id="lol-tab-macro" role="tab" aria-selected="false" aria-controls="lol-pane-macro">Macro</button><button id="lol-tab-settings" role="tab" aria-selected="false" aria-controls="lol-pane-settings">Settings</button></nav><div class="lol-content">

   <div id="lol-pane-aim" role="tabpanel" aria-labelledby="lol-tab-aim"><button id="lol-aim" type="button" aria-pressed="false" style="width:100%">Enable aim assist</button><label class="check"><input id="lol-auto-shoot" type="checkbox"> Auto shoot</label><label class="check"><input id="lol-broad-meshes" type="checkbox"> Include smaller meshes</label><label class="check"><input id="lol-moving" type="checkbox"> Prefer moving meshes</label><label>Aim speed<input id="lol-strength" type="range" min="1" max="100" value="40"></label><label>Scan range<input id="lol-range" type="range" min="96" max="768" step="16" value="256"></label><label class="check"><input id="lol-ring" type="checkbox"> Show range circle</label><p>Click Enable, then return to the game. Tracks highlighted shapes while the pointer is locked; Auto shoot clicks while a shape is detected. Smaller meshes may include scenery; expand Scan range to detect farther around the crosshair.</p></div>
   <div id="lol-pane-visual" role="tabpanel" aria-labelledby="lol-tab-visual" hidden><label class="check"><input id="lol-esp" type="checkbox"> Mesh highlight</label><label class="check"><input id="lol-boxes" type="checkbox"> Box ESP</label><label class="check"><input id="lol-lines" type="checkbox"> Tracer lines</label><p>Boxes mark candidate shapes within the scan range; they may include non-player meshes.</p><label class="check"><input id="lol-wireframe" type="checkbox"> Wireframe</label><label class="check"><input id="lol-cross" type="checkbox"> Custom crosshair</label><label>Crosshair color<input id="lol-cross-color" type="color" value="#ef3340"></label><label>Crosshair size<input id="lol-cross-size" type="range" min="8" max="28" value="14"></label><label class="check"><input id="lol-motion" type="checkbox"> Screen motion meter</label><label>Depth threshold<input id="lol-depth" type="number" min="0" max="100" step="0.5" value="4.5"></label><output id="lol-motion-value"></output></div>
   <div id="lol-pane-macro" role="tabpanel" aria-labelledby="lol-tab-macro" hidden><label class="check"><input id="lol-enabled" type="checkbox"> Enable macro</label><label>Trigger<input id="lol-trigger" type="text" maxlength="1" value="v" style="width:64px" autocomplete="off" spellcheck="false"></label><label>Edit bind<input id="lol-edit-bind" type="text" maxlength="6" value="q" style="width:64px" autocomplete="off" spellcheck="false"></label><button id="lol-run">Test once</button> <button id="lol-stop">Stop</button><p>Hold Trigger to repeat. Set Edit bind to your in-game edit key. Sends your edit key, then left click. Release Trigger to stop.</p></div>
   <div id="lol-pane-settings" role="tabpanel" aria-labelledby="lol-tab-settings" hidden><label class="check"><input id="lol-compact" type="checkbox"> Compact panel</label><label>Menu accent<input id="lol-menu-accent" type="color" value="#ef3340"></label><label>Menu background<input id="lol-menu-bg" type="color" value="#0b0b0e"></label><label>Mesh highlight<input id="lol-mesh-color" type="color" value="#ff0000"></label><label>ESP boxes<input id="lol-box-color" type="color" value="#ff2438"></label><label>Tracer lines<input id="lol-line-color" type="color" value="#ff2438"></label><label>Range circle<input id="lol-ring-color" type="color" value="#ef3340"></label><label>Panel opacity<input id="lol-opacity" type="range" min="60" max="100" value="97"></label><button id="lol-position">Reset position</button> <button id="lol-disable-all">Disable all</button><div class="lol-metrics"><span>Detected shapes</span><strong id="lol-shape-count">0</strong></div><div class="lol-metrics"><span>Game loaded</span><strong>Yes</strong></div><p>Tools load after the game starts and stay available when modes change. Player identity, lobby count and mode are not exposed by this build. Detected shapes are not a player count.</p></div></div></div>
   <footer><output id="lol-visual-status"></output><output id="lol-status" aria-live="polite">Ready · features start off.</output></footer>`;

  const header=panel.querySelector('header');let drag=null;
  header.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button'))return;const rect=panel.getBoundingClientRect();drag={x:e.clientX-rect.left,y:e.clientY-rect.top};header.setPointerCapture(e.pointerId);e.preventDefault();});
  header.addEventListener('pointermove',e=>{if(!drag)return;panel.style.right='auto';panel.style.left=Math.max(0,Math.min(innerWidth-panel.offsetWidth,e.clientX-drag.x))+'px';panel.style.top=Math.max(0,Math.min(innerHeight-panel.offsetHeight,e.clientY-drag.y))+'px';});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])header.addEventListener(type,()=>{drag=null;});
  const launch=document.createElement('button');launch.id='nova-lol-launch';launch.textContent='Nova tools · F8';launch.hidden=true;

  const cross=document.createElement('div');cross.id='nova-lol-crosshair';cross.hidden=true;const ring=document.createElement('div');ring.id='nova-lol-fov';ring.hidden=true;document.body.append(panel,launch,cross,ring);
  const overlay=document.createElement('canvas');overlay.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2147483644';document.body.append(overlay);const pen=overlay.getContext('2d');

  const get=id=>panel.querySelector('#lol-'+id),status=get('status'),input=createInput(canvas),visual=window.NovaLOLVisual;

  const preferenceKey='nova-lol-practice-bindings-v2',preferences=['trigger','edit-bind'];
  try{const saved=JSON.parse(localStorage.getItem(preferenceKey)||'{}');for(const name of preferences)if(typeof saved[name]==='string')get(name).value=saved[name];}catch{}
  const savePreferences=()=>{try{const saved={};for(const name of preferences)saved[name]=get(name).value;localStorage.setItem(preferenceKey,JSON.stringify(saved));}catch{}};
  for(const name of preferences)get(name).addEventListener('input',()=>{releaseMacro();savePreferences();});
  canvas.tabIndex=0;let triggered=false;

  releaseMacro=()=>{input.stop();triggered=false;};

  panel.addEventListener('focusin',()=>{releaseMacro();if(document.pointerLockElement)document.exitPointerLock?.();});

  const setAim=enabled=>{if(visual){visual.state.aim=enabled;visual.state.spin=false;}get('aim').setAttribute('aria-pressed',String(enabled));get('aim').textContent=enabled?'Disable aim assist':'Enable aim assist';};
  const stop=()=>{releaseMacro();setAim(false);status.textContent='Stopped - all keys released.';};
  function play(repeat=false){try{const bind=parse(get('trigger').value);if(bind.length!==1||bind[0].mouse)throw Error('Trigger must be one keyboard key.');const sequence=editSequence(get('edit-bind').value,get('edit-bind').value).slice(0,2);input.play(sequence,65,{repeat,hold:32});status.textContent=repeat?'Repeating - release Trigger to stop.':'Sequence sent to Unity input.';}catch(e){triggered=false;status.textContent=e.message;}}
  for(const name of ['aim','visual','macro','settings'])get('tab-'+name).onclick=()=>{for(const tab of ['aim','visual','macro','settings']){get('tab-'+tab).setAttribute('aria-selected',String(tab===name));get('pane-'+tab).hidden=tab!==name;}};

  for(const name of ['esp','boxes','lines','wireframe','motion']){get(name).disabled=!visual;get(name).onchange=()=>{visual.state[name]=get(name).checked;};}
  get('aim').disabled=!visual;get('aim').onclick=()=>{setAim(!visual.state.aim);status.textContent=visual.state.aim?'Aim enabled - click the game to lock the pointer.':'Aim disabled.';};
  get('auto-shoot').onchange=()=>{if(visual)visual.state.autoShoot=get('auto-shoot').checked;};get('broad-meshes').onchange=()=>{if(visual)visual.state.broadMeshes=get('broad-meshes').checked;};
  get('moving').onchange=()=>{if(visual)visual.state.movingOnly=get('moving').checked;};get('strength').oninput=()=>{if(visual)visual.state.speed=Number(get('strength').value)/100;};get('range').oninput=()=>{if(visual)visual.state.fov=Number(get('range').value);};
  get('depth').onchange=()=>{const value=Number(get('depth').value);if(visual&&Number.isFinite(value)&&value>=0&&value<=100)visual.state.threshold=value;};

  get('cross-size').oninput=()=>{cross.style.width=cross.style.height=get('cross-size').value+'px';};
  const appearanceKey='nova-lol-appearance-v1',colors=['menu-accent','menu-bg','mesh-color','box-color','line-color','ring-color','cross-color'];
  const rgb=hex=>[1,3,5].map(start=>parseInt(hex.slice(start,start+2),16));
  const applyAppearance=()=>{const accent=get('menu-accent').value,bg=get('menu-bg').value,values=rgb(bg);panel.dataset.compact=String(get('compact').checked);panel.style.background='rgba('+values.join(',')+','+Number(get('opacity').value)/100+')';panel.style.setProperty('--accent',accent);panel.style.setProperty('--accent-tint',accent+'22');panel.style.setProperty('--menu-bg',bg);panel.style.setProperty('--surface',bg+'bb');cross.style.setProperty('--cross-color',get('cross-color').value);ring.style.borderColor=get('ring-color').value+'88';if(visual)visual.state.color=rgb(get('mesh-color').value).map(value=>value/255);try{const saved={compact:get('compact').checked,opacity:Number(get('opacity').value)};for(const name of colors)saved[name]=get(name).value;localStorage.setItem(appearanceKey,JSON.stringify(saved));}catch{}};
  try{const saved=JSON.parse(localStorage.getItem(appearanceKey)||'{}');get('compact').checked=saved.compact===true;if(Number.isFinite(saved.opacity))get('opacity').value=Math.max(60,Math.min(100,saved.opacity));for(const name of colors)if(typeof saved[name]==='string'&&/^#[0-9a-f]{6}$/i.test(saved[name]))get(name).value=saved[name];}catch{}
  applyAppearance();get('compact').onchange=applyAppearance;get('opacity').oninput=applyAppearance;for(const name of colors)get(name).oninput=applyAppearance;
  get('position').onclick=()=>{panel.style.left='auto';panel.style.right='18px';panel.style.top='18px';};
  get('disable-all').onclick=()=>{stop();for(const name of ['auto-shoot','broad-meshes','moving','esp','boxes','lines','wireframe','cross','motion','ring','enabled']){get(name).checked=false;get(name).dispatchEvent(new Event('change'));}status.textContent='All features disabled.';};
  get('run').onclick=()=>play(false);get('stop').onclick=stop;

  const toggle=()=>{panel.hidden=!panel.hidden;launch.hidden=!panel.hidden;if(!panel.hidden){releaseMacro();if(document.pointerLockElement)document.exitPointerLock?.();}};get('hide').onclick=toggle;launch.onclick=toggle;

  get('enabled').onchange=()=>{if(!get('enabled').checked)releaseMacro();};

  const down=e=>{if(!e.isTrusted||panel.contains(e.target)||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName))return;

   if(e.key==='F8'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)toggle();return;}if(e.key==='Escape'){stop();return;}

   if(get('enabled').checked&&e.key.toLowerCase()===get('trigger').value.toLowerCase()){e.preventDefault();e.stopImmediatePropagation();if(e.repeat||triggered)return;triggered=true;play(true);}

  };

  const up=e=>{if(e.isTrusted&&triggered&&e.key.toLowerCase()===get('trigger').value.toLowerCase()){triggered=false;e.preventDefault();e.stopImmediatePropagation();input.stop();}};

  // Window capture runs ahead of Unity and suppresses the physical macro trigger.

  macroDown=down;macroUp=up;

  let raf,last=0;

  const frame=now=>{raf=requestAnimationFrame(frame);if(document.hidden||now-last<16)return;last=now;

   cross.hidden=!get('cross').checked;ring.hidden=!get('ring').checked;const rect=canvas.getBoundingClientRect();for(const el of [cross,ring]){el.style.left=rect.left+rect.width/2+'px';el.style.top=rect.top+rect.height/2+'px';}const size=visual?.state.fov||256;ring.style.width=size*rect.width/canvas.width+'px';ring.style.height=size*rect.height/canvas.height+'px';

   if(pen){if(overlay.width!==innerWidth||overlay.height!==innerHeight){overlay.width=innerWidth;overlay.height=innerHeight;}pen.clearRect(0,0,overlay.width,overlay.height);const s=visual?.state;if(s&&(s.boxes||s.lines)){pen.strokeStyle=get('box-color').value;pen.lineWidth=1.5;const sx=rect.width/canvas.width,sy=rect.height/canvas.height,ox=rect.left+(rect.width-(s.scanWidth||0)*sx)/2,oy=rect.top+(rect.height-(s.scanHeight||0)*sy)/2;for(const region of s.regions||[]){const x=ox+region.left*sx,y=oy+region.top*sy,w=region.width*sx,h=region.height*sy;if(s.boxes){pen.strokeStyle=get('box-color').value;pen.strokeRect(x,y,w,h);}if(s.lines){pen.strokeStyle=get('line-color').value;pen.beginPath();pen.moveTo(rect.left+rect.width/2,rect.bottom);pen.lineTo(x+w/2,y+h/2);pen.stroke();}}}}
   if(visual){const s=visual.state;get('shape-count').textContent=String(s.regions?.length||0);get('visual-status').textContent=s.programs?(s.modelUpdates?'Transform tracking active · '+s.movingDraws+' moving draws':'Mesh hooks active · waiting for world transforms'):s.message;

    if(window.NovaLOLInput)get('visual-status').textContent+=' · '+window.NovaLOLInput.callbacks+' input callbacks';

    get('motion-value').textContent=s.motion?'Screen motion: '+s.motionPercent+'%':'';

   }

  };raf=requestAnimationFrame(frame);

  addEventListener('blur',releaseMacro);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseMacro();});

  addEventListener('pagehide',()=>{releaseMacro();overlay.remove();cancelAnimationFrame(raf);macroDown=macroUp=()=>{};},{once:true});

 }

})();

