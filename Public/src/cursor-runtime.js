import {cursorPresets} from './cursor-presets.mjs?v=3';
const style=document.createElement('style');style.id='nova-cursor-style';document.head.append(style);
function apply(){
 let selected;try{selected=cursorPresets.find(p=>p.id===localStorage.getItem('nova_cursor'))}catch{}
 if(!selected?.asset){style.textContent='';return}
 const hot=selected.hotspot?selected.hotspot.join(' '):selected.id==='circle'?'16 16':'5 3';
 const value='url("/cursors/'+selected.asset+'") '+hot;
 style.textContent=`html,body,body *:not(input):not(textarea):not(canvas){cursor:${value},auto!important}a[href],button,[role="button"],summary,select,input[type="checkbox"],input[type="radio"],input[type="range"]{cursor:${value},pointer!important}`;
}
apply();addEventListener('storage',apply);addEventListener('nova:cursorChanged',apply);
addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.novaAction==='settingsChanged')apply()});
