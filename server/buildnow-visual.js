/* Adapted from the supplied WebGL userscript. Mesh selection is a heuristic. */
(()=>{
 'use strict';
 const state={color:[1,0,0],esp:false,boxes:false,lines:false,regions:[],aim:false,autoShoot:false,broadMeshes:false,wireframe:false,threshold:4.5,speed:0.4,fov:256,movingOnly:true,motion:false,motionPercent:0,spin:false,spinSpeed:350,modelUpdates:0,movingDraws:0,programs:0,fallbacks:0,candidates:0,message:'Waiting for WebGL 2.'};
 const originals=new WeakMap(),patched=new WeakSet(),programs=new WeakMap();let context=null,canvas=null,lastSample=0,frameStamp=0,lastFrame=0,remainderX=0,remainderY=0,motionPrevious=null,scanBuffer=null;
 function patchShader(source,vertex){
  if(!/^\s*#version\s+300\s+es\b/m.test(source))return null;
  const output=vertex?'':source.match(/\bout\s+(?:(?:lowp|mediump|highp)\s+)?vec4\s+(\w+)\s*;/)?.[1];
  if(vertex&&!source.includes('gl_Position')||!vertex&&!output)return null;
  const main=/\bvoid\s+main\s*\([^)]*\)\s*\{/.exec(source);if(!main)return null;
  let end=main.index+main[0].length,depth=1;for(;end<source.length&&depth;end++){if(source[end]==='{')depth++;else if(source[end]==='}')depth--;}
  if(depth)return null;
  const operation=vertex?'novaDepth=gl_Position.z; if(novaEnabled && novaDepth>novaThreshold){gl_Position.z=-0.99*gl_Position.w;}':`if(novaEnabled && novaDepth>novaThreshold){${output}=vec4(novaColor,1.0);}`;
  const start=main.index+main[0].length,body=source.slice(start,end-1);
  // Apply on normal exit and the early return emitted by Unity's shader translator.
  const changed=body.replace(/\breturn\s*;/g,operation+' return;')+'\n'+operation+'\n';
  const declaration=`\n${vertex?'out':'in'} highp float novaDepth;\nuniform bool novaEnabled;\nuniform highp vec3 novaColor;\nuniform highp float novaThreshold;\n`;
  const modified=source.slice(0,start)+changed+source.slice(end-1);return modified.slice(0,main.index)+declaration+modified.slice(main.index);
 }
 function findRegions(pixels,width,height){
  const cols=Math.ceil(width/2),rows=Math.ceil(height/2),mask=new Uint8Array(cols*rows);const regions=[];
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=((y*2)*width+x*2)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(Math.max(r,g,b)>=Math.max(0,Math.max(...state.color)*255-55)&&Math.abs(r-state.color[0]*255)<55&&Math.abs(g-state.color[1]*255)<55&&Math.abs(b-state.color[2]*255)<55&&pixels[i+3]>=200)mask[y*cols+x]=1;}
  for(let start=0;start<mask.length;start++){if(!mask[start])continue;const queue=[start];mask[start]=0;let minX=cols,maxX=0,minY=rows,maxY=0,count=0;
   for(let n=0;n<queue.length;n++){const index=queue[n],x=index%cols,y=Math.floor(index/cols);count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    for(const next of [x>0?index-1:-1,x+1<cols?index+1:-1,y>0?index-cols:-1,y+1<rows?index+cols:-1])if(next>=0&&mask[next]){mask[next]=0;queue.push(next);}
   }
   const bw=(maxX-minX+1)*2,bh=(maxY-minY+1)*2;if(count<4||bw>bh*1.8||bw>width*0.7||bh>height*0.9)continue;
   const x=minX+maxX-width/2,y=(minY+(maxY-minY)*0.72)*2-height/2,d=x*x+y*y;
   regions.push({x,y,distance:d,left:minX*2,top:height-(maxY+1)*2,width:bw,height:bh});
  }return regions;
 }
 function selectTarget(regions,width,height){let best=null;for(const point of regions)if(point.distance<=(Math.min(width,height)/2)**2&&(!best||point.distance<best.distance))best=point;return best;}
 function findTarget(pixels,width,height){return selectTarget(findRegions(pixels,width,height),width,height);}
 function aimDelta(point,speed,elapsed=16){const gain=speed*Math.max(0.5,Math.min(3,elapsed/16));return {dx:Math.abs(point.x)<2?0:Math.max(-36,Math.min(36,point.x*gain)),dy:Math.abs(point.y)<2?0:Math.max(-36,Math.min(36,-point.y*gain))};}
 function createAutoFire(send){let held=false,last=-Infinity;
  const stop=()=>{if(held){send('mouseup',{button:0,buttons:0});held=false;}last=-Infinity;};
  const update=(now,active)=>{if(!active){stop();return;}if(held&&now-last>=45){send('mouseup',{button:0,buttons:0});held=false;}if(!held&&now-last>=110){send('mousedown',{button:0,buttons:1});held=true;last=now;}};
  return {update,stop,get held(){return held;}};
 }
 function createMotionTracker(){
  const groups=new Map();
  const observe=(key,matrix,stamp)=>{
   if(!matrix||matrix.length!==16||!matrix.every(Number.isFinite))return false;
   let pool=groups.get(key)||[];pool=pool.filter(entry=>stamp-entry.stamp<1200);let best=null,distance=Infinity;
   for(const entry of pool){if(entry.stamp===stamp)continue;let d=0;for(let i=0;i<16;i++)d+=(matrix[i]-entry.matrix[i])**2;if(d<distance){distance=d;best=entry;}}
   let moving=false;if(best&&distance<100){moving=distance>0.00001;best.matrix=matrix.slice();best.stamp=stamp;}else{if(pool.length>=64)pool.shift();pool.push({matrix:matrix.slice(),stamp});}
   if(groups.size>2048)groups.clear();groups.set(key,pool);return moving;
  };return {observe};
 }
 const blocks=new WeakMap();const tracker=createMotionTracker(),uniformNames=new WeakMap(),modelMatrices=new WeakMap(),objectIds=new WeakMap();let nextObjectId=1;
 const objectId=value=>{if(!value||typeof value!=='object')return 0;if(!objectIds.has(value))objectIds.set(value,nextObjectId++);return objectIds.get(value);};
 function readUniform(data,offset=0,length=0){
  const size=Math.min(16,Math.max(0,(data?.length||0)-offset),length>0?length:16);
  return Array.from({length:size},(_,i)=>data[offset+i]);
 }
 function recordModel(location,data,offset=0,length=0){
  if(!state.aim&&!state.esp)return;const meta=location&&uniformNames.get(location);if(!meta||!/unity_ObjectToWorld/.test(meta.name))return;
  const values=readUniform(data,offset,length);let record=modelMatrices.get(meta.program)||{matrix:Array(16).fill(0),rows:0};
  if(values.length>=16){record={matrix:values.slice(0,16),rows:15};}else if(values.length>=4){const row=Number(meta.name.match(/\[(\d)\]/)?.[1]||0);if(row>3)return;record.matrix.splice(row*4,4,...values.slice(0,4));record.rows|=1<<row;}
  modelMatrices.set(meta.program,record);state.modelUpdates++;
 }
 window.NovaLOLVisual={state,patchShader,findTarget,findRegions,selectTarget,aimDelta,createAutoFire,createMotionTracker,readUniform};
 if(!window.WebGL2RenderingContext||!window.HTMLCanvasElement){state.message='WebGL 2 hooks unavailable.';return;}
 const proto=window.WebGL2RenderingContext.prototype,sourceNative=proto.shaderSource;
 const hook=(object,name,handler)=>{const original=object[name];object[name]=function(...args){return handler.call(this,original,args)};};
 hook(window.HTMLCanvasElement.prototype,'getContext',function(original,args){if(args[0]==='webgl2')args[1]={...(args[1]||{}),preserveDrawingBuffer:true};return original.apply(this,args);});
 hook(proto,'getUniformLocation',function(original,args){const result=original.apply(this,args);if(result)uniformNames.set(result,{program:args[0],name:args[1]});return result;});
 for(const name of ['uniform4fv','uniformMatrix4fv'])if(typeof proto[name]==='function')hook(proto,name,function(original,args){const result=original.apply(this,args);recordModel(args[0],args[name==='uniform4fv'?1:2],Number(args[name==='uniform4fv'?2:3])||0,Number(args[name==='uniform4fv'?3:4])||0);return result;});
 hook(proto,'shaderSource',function(original,args){const [shader,source]=args;originals.set(shader,source);const next=patchShader(source,this.getShaderParameter(shader,this.SHADER_TYPE)===this.VERTEX_SHADER);if(next){patched.add(shader);args[1]=next;}return original.apply(this,args);});
 const rawCompile=proto.compileShader;
 function restore(gl,shader){sourceNative.call(gl,shader,originals.get(shader));patched.delete(shader);}
 hook(proto,'compileShader',function(original,args){const result=original.apply(this,args),shader=args[0];if(patched.has(shader)&&!this.getShaderParameter(shader,this.COMPILE_STATUS)){
   restore(this,shader);original.call(this,shader);state.fallbacks++;
  }return result;});
 function link(original,args){const program=args[0],shaders=this.getAttachedShaders(program)||[];let supported=shaders.length>=2&&shaders.every(shader=>patched.has(shader));
  if(!supported){for(const shader of shaders)if(patched.has(shader)){restore(this,shader);rawCompile.call(this,shader);}}
  let result=original.apply(this,args);
  if(supported&&!this.getProgramParameter(program,this.LINK_STATUS)){for(const shader of shaders){restore(this,shader);rawCompile.call(this,shader);}result=original.apply(this,args);supported=false;state.fallbacks++;}
  if(supported&&this.getProgramParameter(program,this.LINK_STATUS)){programs.set(program,{enabled:this.getUniformLocation(program,'novaEnabled'),threshold:this.getUniformLocation(program,'novaThreshold'),color:this.getUniformLocation(program,'novaColor')});state.programs++;state.message='Experimental mesh highlighting available.';}return result;
 }
 hook(proto,'linkProgram',link);
 function blockModel(gl,program){
 if(!state.aim&&!state.esp&&!state.boxes&&!state.lines)return;
 let block=blocks.get(program);if(block===undefined){block=null;const count=gl.getProgramParameter(program,gl.ACTIVE_UNIFORMS);for(let i=0;i<count;i++){const info=gl.getActiveUniform(program,i);if(info&&/unity_ObjectToWorld\[0\]/.test(info.name)){const index=gl.getActiveUniforms(program,[i],gl.UNIFORM_BLOCK_INDEX)[0];if(index!==-1&&index!==0xffffffff){block={index,offset:gl.getActiveUniforms(program,[i],gl.UNIFORM_OFFSET)[0],matrix:new Float32Array(16)};break;}}}blocks.set(program,block)}if(!block)return;
 const binding=gl.getActiveUniformBlockParameter(program,block.index,gl.UNIFORM_BLOCK_BINDING),buffer=gl.getIndexedParameter(gl.UNIFORM_BUFFER_BINDING,binding);if(!buffer)return;const offset=Number(gl.getIndexedParameter(gl.UNIFORM_BUFFER_START,binding)||0)+block.offset,previous=gl.getParameter(gl.UNIFORM_BUFFER_BINDING);try{gl.bindBuffer(gl.UNIFORM_BUFFER,buffer);gl.getBufferSubData(gl.UNIFORM_BUFFER,offset,block.matrix);modelMatrices.set(program,{matrix:Array.from(block.matrix),rows:15});state.modelUpdates++;}catch{}finally{gl.bindBuffer(gl.UNIFORM_BUFFER,previous)}
 }
 hook(proto,'drawElements',function(original,args){
  context=this;canvas=this.canvas;const program=this.getParameter(this.CURRENT_PROGRAM),uniforms=program&&programs.get(program);
  if(uniforms){const candidate=args[1]>(state.broadMeshes?1000:4000);if(candidate)blockModel(this,program);const model=modelMatrices.get(program);let moving=false;
   if(candidate&&(state.aim||state.esp)&&model?.rows===15){const key=objectId(program)+':'+objectId(this.getParameter(this.VERTEX_ARRAY_BINDING))+':'+objectId(this.getParameter(this.ELEMENT_ARRAY_BUFFER_BINDING))+':'+args[1]+':'+args[3];moving=tracker.observe(key,model.matrix,frameStamp);}
   const eligible=candidate&&(!state.aim||!state.movingOnly||model?.rows===15&&moving);
   this.uniform1i(uniforms.enabled,(state.esp||state.aim||state.boxes||state.lines)&&eligible?1:0);this.uniform1f(uniforms.threshold,state.threshold);if(this.uniform3fv)this.uniform3fv(uniforms.color,state.color);if(candidate)state.candidates++;if(moving)state.movingDraws++;if(state.wireframe&&candidate)args[0]=this.LINES;
  }return original.apply(this,args);
 });
 const autoFire=createAutoFire((type,options)=>{if(canvas)window.NovaLOLInput?.mouse(canvas,type,options);});
 function sample(now){
  if(!context||!canvas||document.hidden){autoFire.stop();return;}
  if(!state.aim||!state.autoShoot||document.pointerLockElement!==canvas)autoFire.stop();
  lastFrame=now;
  if((!state.aim&&!state.motion&&!state.boxes&&!state.lines)||now-lastSample<8)return;const elapsed=lastSample?now-lastSample:16;lastSample=now;
  const gl=context,w=Math.min(state.fov,canvas.width),h=Math.min(state.fov,canvas.height);if(!w||!h)return;
  if(!scanBuffer||scanBuffer.length!==w*h*4)scanBuffer=new Uint8Array(w*h*4);const pixels=scanBuffer,previous=gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
  try{gl.bindFramebuffer(gl.READ_FRAMEBUFFER,null);gl.readPixels(Math.floor((canvas.width-w)/2),Math.floor((canvas.height-h)/2),w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);}catch{state.aim=false;state.motion=false;state.message='Frame sampling unavailable.';autoFire.stop();return;}finally{gl.bindFramebuffer(gl.READ_FRAMEBUFFER,previous);}
  if(state.motion){let changed=0,total=0;for(let i=0;i<pixels.length;i+=64){total++;if(motionPrevious&&Math.abs(pixels[i]-motionPrevious[i])+Math.abs(pixels[i+1]-motionPrevious[i+1])+Math.abs(pixels[i+2]-motionPrevious[i+2])>70)changed++;}state.motionPercent=Math.round(changed/total*100);motionPrevious=new Uint8Array(pixels);}else motionPrevious=null;
  state.regions=findRegions(pixels,w,h);state.scanWidth=w;state.scanHeight=h;
  if(!state.aim||document.pointerLockElement!==canvas){remainderX=remainderY=0;return;}
  const point=selectTarget(state.regions,w,h);if(!point){autoFire.stop();remainderX=remainderY=0;return;}
  // Pixel readback is bottom-up; negative Y moves the camera upward.
  const {dx,dy}=aimDelta(point,state.speed,elapsed);
  remainderX+=dx;remainderY+=dy;const moveX=Math.trunc(remainderX),moveY=Math.trunc(remainderY);remainderX-=moveX;remainderY-=moveY;
  if(window.NovaLOLInput&&(moveX||moveY))window.NovaLOLInput.mouse(canvas,'mousemove',{dx:moveX,dy:moveY,buttons:autoFire.held?1:0});
  autoFire.update(now,state.autoShoot);
 }
 hook(window,'requestAnimationFrame',function(original,args){const callback=args[0];args[0]=function(now){if(frameStamp!==now){frameStamp=now;state.movingDraws=0;state.candidates=0;}const result=callback(now);if(lastFrame!==now)sample(now);return result;};return original.apply(this,args);});
 window.addEventListener('blur',()=>{state.aim=false;autoFire.stop();});
 document.addEventListener?.('visibilitychange',()=>{if(document.hidden)autoFire.stop();});
 document.addEventListener?.('pointerlockchange',()=>{if(document.pointerLockElement!==canvas)autoFire.stop();});
 window.addEventListener('pagehide',()=>{autoFire.stop();state.esp=state.aim=state.autoShoot=state.wireframe=state.spin=state.motion=false;},{once:true});
})();
