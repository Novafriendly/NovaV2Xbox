export async function controlMusic(player,doc,action,value){
 const media=player.media?.();
 if(action==='toggle'&&media){if(media.paused||media.ended)await media.play();else media.pause();return}
 if(action==='previous'||action==='next'){
  if(typeof player[action]==='function'){await player[action]();return}
  const button=doc?.querySelector(action==='previous'?'#spotifyPrevBtn':'#spotifyNextBtn');
  if(button&&!button.disabled){button.click();return}
  throw Error('No track is available in that direction.');
 }
 if(typeof player[action]!=='function')throw Error('This music control is unavailable.');
 await player[action](value);
}
