/* Unity 2019 Emscripten input bridge, installed before the game loader. */
(()=>{
 'use strict';
 const handlers=new Map(),positions=new WeakMap();let captured=0;
 function isUnityHandler(callback){return typeof callback==='function'&&callback.name==='jsEventHandler'&&Function.prototype.toString.call(callback).includes('JSEvents.currentEventHandler');}
 function capture(target,type,callback,options){if(!isUnityHandler(callback)||!['keydown','keyup','keypress','mousemove','mousedown','mouseup'].includes(type))return;const list=handlers.get(type)||[];if(!list.some(item=>item.target===target&&item.callback===callback))list.push({target,callback,capture:typeof options==='object'?!!options?.capture:!!options});handlers.set(type,list);captured++;}
 const proto=window.EventTarget?.prototype;
 if(proto){const add=proto.addEventListener,remove=proto.removeEventListener;
  proto.addEventListener=function(type,callback,options){if(type==='mousemove'&&!positions.has(this)&&this===window){add.call(this,'mousemove',event=>{if(event.isTrusted&&event.target?.getBoundingClientRect)positions.set(event.target,{x:event.clientX,y:event.clientY});},true);positions.set(this,{});}capture(this,type,callback,options);return add.call(this,type,callback,options);};
  proto.removeEventListener=function(type,callback,options){const list=handlers.get(type);if(list)handlers.set(type,list.filter(item=>!(item.target===this&&item.callback===callback&&item.capture===(typeof options==='object'?!!options?.capture:!!options))));return remove.call(this,type,callback,options);};
 }
 function send(canvas,type,event){
  const selected=(handlers.get(type)||[]).filter(item=>item.target===canvas||item.target===document||item.target===window);
  if(!selected.length){canvas.dispatchEvent(event);return false;}
  Object.defineProperties(event,{target:{get:()=>canvas},currentTarget:{get:()=>canvas}});
  for(const item of selected)item.callback.call(item.target,event);return true;
 }
 function keyboard(canvas,type,key){const event=new KeyboardEvent(type,{...key,which:key.keyCode,location:0,charCode:0,bubbles:true,cancelable:true});Object.defineProperties(event,{keyCode:{get:()=>key.keyCode},which:{get:()=>key.keyCode}});return send(canvas,type,event);}
 function mouse(canvas,type,{dx=0,dy=0,button=0,buttons=0}={}){
  const rect=canvas.getBoundingClientRect(),position=positions.get(canvas),x=position?.x??rect.left+rect.width/2,y=position?.y??rect.top+rect.height/2;
  const event=new MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,screenX:x,screenY:y,button,buttons});
  Object.defineProperties(event,{movementX:{get:()=>dx},movementY:{get:()=>dy},mozMovementX:{get:()=>dx},mozMovementY:{get:()=>dy}});return send(canvas,type,event);
 }
 window.NovaLOLInput={keyboard,mouse,capture,isUnityHandler,get callbacks(){return captured;}};
})();
