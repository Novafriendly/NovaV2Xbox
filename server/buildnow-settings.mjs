export function normalizeTools(input={}){
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};input=object(input);const enabled=object(input.enabled),engine=object(input.engine),visual=object(input.visual),flight=object(engine.flight),cycle=object(engine.cycle);
 const number=(x,min,max,fallback)=>Number.isFinite(x)?Math.max(min,Math.min(max,x)):fallback;
 const choice=(x,allowed,fallback)=>allowed.includes(x)?x:fallback;
 const flags={};for(const name of ['flight','silent','bodySpin','weaponCycle','walkSpeed','aim','autoShoot','boxes','lines','skeleton','headCircles','playerInfo','healthBars','distanceLabels','movingOnly','ring','cross','reloadSpam','macro'])flags[name]=enabled[name]===true;
 return {version:1,remember:input.remember!==false,enabled:flags,engine:{flight:{speed:number(flight.speed,2,60,12),boost:number(flight.boost,1,4,2),acceleration:number(flight.acceleration,5,120,40),followPitch:flight.followPitch===true},spinSpeed:number(engine.spinSpeed,30,1440,360),walkMultiplier:number(engine.walkMultiplier,1,5,1),cycle:{intervalMs:number(cycle.intervalMs,120,1500,300),fire:cycle.fire===true},silentTargetMode:choice(engine.silentTargetMode,['visible','all'],'all')},visual:{mode:choice(visual.mode,['assist','soft','auto','hacker','silent'],'assist'),strength:number(visual.strength,0,95,40),range:number(visual.range,96,1600,512),fullView:visual.fullView===true,point:choice(visual.point,['head','body'],'head'),requireTrigger:visual.requireTrigger===true,trigger:typeof visual.trigger==='string'&&/^[a-z0-9]$/i.test(visual.trigger)?visual.trigger.toLowerCase():'e',crosshair:choice(visual.crosshair,['cross','dot','circle','diamond'],'cross')}};
}

export function createToolsStore(storage,normalize=normalizeTools){
 const key='nova_buildnow_tools_v1';let value=normalize(),error='';
 try{const raw=storage.getItem(key);if(raw)value=normalize(JSON.parse(raw));}catch{error='Saved controls could not be read.';}
 const copy=()=>JSON.parse(JSON.stringify(value));
 return {key,get error(){return error;},read:copy,update(patch={}){value=normalize({...value,...patch,enabled:{...value.enabled,...patch.enabled},engine:{...value.engine,...patch.engine,flight:{...value.engine.flight,...patch.engine?.flight},cycle:{...value.engine.cycle,...patch.engine?.cycle}},visual:{...value.visual,...patch.visual}});try{storage.setItem(key,JSON.stringify(value));error='';}catch{error='Browser storage could not save your controls.';}return copy();},clear(){value=normalize();try{storage.removeItem(key);error='';}catch{error='Saved controls could not be removed.';}return copy();}};
}

export function createToolsRestorer(getConfig,getEngine,now=()=>performance.now()){
 let applying=false,stopped=false,lastOptions='',lastConfig='',failures=new Map();
 const reset=()=>{lastOptions='';failures.clear();};
 return {get applying(){return applying;},reset,stop(){stopped=true;reset();},sync(state){
  if(applying||stopped)return '';const config=getConfig(),engine=getEngine();
  if(!config.remember||!engine||!state.ready||!(state.controlsAllowed??state.offline)||!state.hasPlayer){reset();return config.remember?'Saved controls will apply when your character spawns.':'Automatic restore is off.';}
  const signature=JSON.stringify(config);if(signature!==lastConfig){lastConfig=signature;failures.clear();lastOptions='';}
  const optionsKey=String(state.playerId||1)+':'+String(state.playerGeneration||0)+'|'+JSON.stringify(config.engine);applying=true;let waiting=false;
  try{
   if(optionsKey!==lastOptions){engine.setFlightOptions?.(config.engine.flight);engine.setSpinSpeed?.(config.engine.spinSpeed);engine.setWalkMultiplier?.(config.engine.walkMultiplier);engine.setWeaponCycleOptions?.(config.engine.cycle);engine.setSilentTargetMode?.(config.engine.silentTargetMode);lastOptions=optionsKey;}
   for(const [flag,method]of [['flight','setFlight'],['silent','setSilent'],['bodySpin','setBodySpin'],['weaponCycle','setWeaponCycle'],['walkSpeed','setWalkSpeed']]){
    if(!config.enabled[flag]||state[flag])continue;
    if(flag==='weaponCycle'&&!(state.availableGuns>0)||flag==='walkSpeed'&&!state.walkSpeedReady){waiting=true;continue;}
    if((failures.get(flag)||0)>now()){waiting=true;continue;}
    try{if(typeof engine[method]!=='function')throw Error('Control unavailable');engine[method](true);failures.delete(flag);}catch{failures.set(flag,now()+500);waiting=true;}
   }
  }finally{applying=false;}
  return waiting?'Saved controls · waiting for your character or loadout.':'Saved controls applied automatically.';
 }};
}

export function settingsRuntimeSource(){return `(()=>{const normalize=${normalizeTools.toString()};window.NovaBuildNowSettings={normalize,createStore:storage=>(${createToolsStore.toString()})(storage,normalize),createRestorer:${createToolsRestorer.toString()}};})();`;}
