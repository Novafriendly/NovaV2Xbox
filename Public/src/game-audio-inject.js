/* Installed before proxied game scripts create their Web Audio nodes. */
(()=>{
 if(window.__novaAudioMixer)return;
 let volume=1;
 try{if(window.location?.pathname.startsWith('/content/games/')){const saved=JSON.parse(window.localStorage.getItem('nova_os_audio')||'{}');if(Number.isFinite(saved.game))volume=Math.max(0,Math.min(1,saved.game));}}catch{}
 const gains=new Set(),routes=new WeakMap();
 const clamp=value=>Math.max(0,Math.min(1,Number(value)||0));
 const node=window.AudioNode?.prototype;
 if(node){
  const connect=node.connect,disconnect=node.disconnect;
  function route(destination){let gain=routes.get(destination);if(!gain){gain=destination.context.createGain();gain.gain.value=clamp(volume);connect.call(gain,destination);routes.set(destination,gain);gains.add(gain)}return gain}
  node.connect=function(destination,...args){const output=destination instanceof AudioDestinationNode?route(destination):destination;const result=connect.call(this,output,...args);return result===output?destination:result};
  node.disconnect=function(destination,...args){if(destination instanceof AudioDestinationNode&&routes.has(destination))return disconnect.call(this,routes.get(destination),...args);return arguments.length?disconnect.call(this,destination,...args):disconnect.call(this)};
 }
 window.__novaAudioMixer={setVolume(value){volume=clamp(value);for(const gain of gains){if(gain.context.state==='closed'){gains.delete(gain);continue}gain.gain.setValueAtTime(volume,gain.context.currentTime)}},get volume(){return volume}};
})();
