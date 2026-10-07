const configs={'505.html':{name:'Pokémon Red',core:'gb',file:'pokemon-red.zip',save:'Pokemon - Red Version (USA, Europe) (SGB Enhanced)'},'506-f.html':{name:'Pokémon Emerald',core:'gba',file:'pokemon-emerald.gba',save:'pokemonemerald'},'694.html':{name:'Pokémon FireRed',core:'gba',file:'pokemon-firered.gba',save:'Pokemon FireRed'},'696-f.html':{name:'Pokémon HeartGold',core:'nds',file:'pokemon-heartgold.nds',save:'Pokemon - HeartGold Version (USA)'}};
const config=configs[location.pathname.split('/').pop()];
const game=document.getElementById('game'),start=document.getElementById('start'),status=document.getElementById('status'),retry=document.getElementById('retry');
let started=false,timer;
function report(state,detail){if(parent!==window)parent.postMessage({novaAction:'pokemonCoreStatus',state,detail},location.origin)}
function fail(message){clearTimeout(timer);status.textContent=message;status.hidden=false;retry.hidden=false;report('error',message)}
start.onclick=async()=>{
 if(started)return;started=true;start.hidden=true;game.hidden=false;status.hidden=true;
 const base=new URL('/content/emulator/pokemon-red/',location.href).href;
 let gameUrl=base+config.file;
 if(config.core==='nds'){status.hidden=false;status.textContent='Loading HeartGold game files…';try{const chunks=await Promise.all(Array.from({length:7},async(_,i)=>{const r=await fetch(gameUrl+'.part'+(i+1));if(!r.ok)throw Error('Game download failed');return r.arrayBuffer()}));gameUrl=URL.createObjectURL(new Blob(chunks));}catch{fail('HeartGold game files could not download. Please retry.');return}}
 Object.assign(window,{EJS_player:'#game',EJS_core:config.core,EJS_color:'#9ec8dc',EJS_startOnLoaded:true,EJS_threads:false,EJS_pathtodata:base,EJS_gameUrl:gameUrl,EJS_gameName:config.save,EJS_onGameStart(){clearTimeout(timer);status.hidden=true;report('ready',config.name+' is running.')}});
 report('loading','Starting '+config.name+'…');
 timer=setTimeout(()=>fail('The emulator could not finish loading. Try again to reload the game files.'),45000);
 const script=document.createElement('script');script.src=base+'loader.js';script.onerror=()=>fail('The emulator files could not load. Refresh Nova and try again.');document.head.append(script);
};
retry.onclick=()=>location.reload();
addEventListener('pagehide',()=>clearTimeout(timer),{once:true});
