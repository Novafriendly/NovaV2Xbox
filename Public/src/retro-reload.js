// Only the currently embedded Retro Bowl frame may request a game reload.
export function createRetroReloadHandler(getFrame,reload){
 return event=>{const frame=getFrame();if(!frame||event.source!==frame||event.data?.novaAction!=='retroGameReload')return;reload();};
}
