const game=document.getElementById('game'),start=document.getElementById('start'),status=document.getElementById('status'),retry=document.getElementById('retry');
let started=false,timer;
function report(state,detail){if(parent!==window)parent.postMessage({novaAction:'pokemonCoreStatus',state,detail},location.origin)}
function fail(message){clearTimeout(timer);status.textContent=message;status.hidden=false;retry.hidden=false;report('error',message)}
start.onclick=()=>{
 if(started)return;started=true;start.hidden=true;game.hidden=false;status.hidden=true;
 const base=new URL('/content/emulator/pokemon-red/',location.href).href;
 Object.assign(window,{EJS_player:'#game',EJS_core:'gb',EJS_color:'#9ec8dc',EJS_startOnLoaded:true,EJS_threads:false,EJS_pathtodata:base,EJS_gameUrl:base+'pokemon-red.zip',EJS_gameName:'Pokemon - Red Version (USA, Europe) (SGB Enhanced)',EJS_onGameStart(){clearTimeout(timer);status.hidden=true;report('ready','Pokémon Red is running.')}});
 report('loading','Starting the Game Boy emulator…');
 timer=setTimeout(()=>fail('The emulator could not finish loading. Try again to reload the game files.'),45000);
 const script=document.createElement('script');script.src=base+'loader.js';script.onerror=()=>fail('The emulator files could not load. Refresh Nova and try again.');document.head.append(script);
};
retry.onclick=()=>location.reload();
addEventListener('pagehide',()=>clearTimeout(timer),{once:true});
