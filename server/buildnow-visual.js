/* Render-based practice tools. Character geometry is verified; live player controllers are checked when available. */
(()=>{
 'use strict';
 const state={zoom:1,color:[1,0,0],esp:false,healthBars:false,distanceLabels:false,playerInfo:false,skeleton:false,skeletons:[],boxes:false,lines:false,regions:[],aim:false,silent:false,autoShoot:false,broadMeshes:false,wireframe:false,threshold:.05,speed:0.4,fov:512,fullViewAim:false,movingOnly:false,motion:false,motionPercent:0,spin:false,spinSpeed:350,target:null,inputMoves:0,boneCount:0,modelUpdates:0,movingDraws:0,programs:0,fallbacks:0,candidates:0,characterDraws:0,nearCameraDraws:0,geometryChecks:0,projectedCharacters:[],message:'Waiting for WebGL 2.'};
 const originals=new WeakMap(),patched=new WeakSet(),programs=new WeakMap();let context=null,canvas=null,lastSample=0,frameStamp=0,lastFrame=0,remainderX=0,remainderY=0,motionPrevious=null,scanBuffer=null,drawSerial=0,drawFrame=-1;
 function patchShader(source,vertex){
  if(!/^\s*#version\s+300\s+es\b/m.test(source))return null;
  const output=vertex?'':source.match(/\bout\s+(?:(?:lowp|mediump|highp)\s+)?vec4\s+(\w+)\s*;/)?.[1];
  if(vertex&&!source.includes('gl_Position')||!vertex&&!output)return null;
  const main=/\bvoid\s+main\s*\([^)]*\)\s*\{/.exec(source);if(!main)return null;
  let end=main.index+main[0].length,depth=1;for(;end<source.length&&depth;end++){if(source[end]==='{')depth++;else if(source[end]==='}')depth--;}
  if(depth)return null;
  const operation=vertex?'novaDepth=gl_Position.z; if(abs(gl_Position.w-1.0)>0.001){gl_Position.xy*=novaZoom;}':`if(novaEnabled && novaDepth>novaThreshold){${output}=vec4(novaColor,1.0);}`;
  const start=main.index+main[0].length,body=source.slice(start,end-1);
  // Apply on normal exit and the early return emitted by Unity's shader translator.
  const changed=body.replace(/\breturn\s*;/g,operation+' return;')+'\n'+operation+'\n';
  const declaration=`\n${vertex?'out':'in'} highp float novaDepth;\nuniform highp float novaZoom;\nuniform bool novaEnabled;\nuniform highp vec3 novaColor;\nuniform highp float novaThreshold;\n`;
  const modified=source.slice(0,start)+changed+source.slice(end-1);return modified.slice(0,main.index)+declaration+modified.slice(main.index);
 }
 function findRegions(pixels,width,height,{allowClipped=false,verifiedGeometry=false}={}){
  const cols=Math.ceil(width/2),rows=Math.ceil(height/2),mask=new Uint8Array(cols*rows);const regions=[];const red=state.color[0]*255,green=state.color[1]*255,blue=state.color[2]*255;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=((y*2)*width+x*2)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(Math.abs(r-red)<=20&&Math.abs(g-green)<=20&&Math.abs(b-blue)<=20&&pixels[i+3]>=200)mask[y*cols+x]=1;}
  for(let start=0;start<mask.length;start++){if(!mask[start])continue;const queue=[start];mask[start]=0;let minX=cols,maxX=0,minY=rows,maxY=0,count=0;
   for(let n=0;n<queue.length;n++){const index=queue[n],x=index%cols,y=Math.floor(index/cols);count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    for(const next of [x>0?index-1:-1,x+1<cols?index+1:-1,y>0?index-cols:-1,y+1<rows?index+cols:-1])if(next>=0&&mask[next]){mask[next]=0;queue.push(next);}
   }
   const bw=(maxX-minX+1)*2,bh=(maxY-minY+1)*2;if(count<(verifiedGeometry?3:8)||bw<(verifiedGeometry?2:6)||bh<(verifiedGeometry?4:12)||!verifiedGeometry&&(bw>bh*.9||bw>width*0.7||bh>height*0.9)||!allowClipped&&(minX===0||minY===0||maxX===cols-1||maxY===rows-1))continue;
   const x=minX+maxX-width/2,y=(minY+(maxY-minY)*(state.aimPoint==='head'?.9:.5))*2-height/2,d=x*x+y*y;
   regions.push({x,y,distance:d,left:minX*2,top:height-(maxY+1)*2,width:bw,height:bh});
  }return regions;
 }
 function selectTarget(regions,width,height){let best=null;for(const point of regions)if(point.distance<=(Math.min(width,height)/2)**2&&(!best||point.distance<best.distance))best=point;return best;}
 function findTarget(pixels,width,height){return selectTarget(findRegions(pixels,width,height),width,height);}
 function aimDelta(point,speed,elapsed=16){const strength=Math.max(0,Math.min(.95,Number(speed)||0)),gain=1-Math.pow(1-strength,Math.max(1,Math.min(50,elapsed))/16);return {dx:Math.abs(point.x)<1?0:Math.max(-36,Math.min(36,point.x*gain)),dy:Math.abs(point.y)<1?0:Math.max(-12,Math.min(12,-point.y*gain))};}
 function aimAreaDiameter(width,height,range,fullView=false){const diameter=Math.max(96,Number(range)||512);return fullView&&width>0&&height>0?2*Math.hypot(width/2,height/2)+2:diameter}
 function applyPreset(name,targetState=state){if(name!=='hacker')throw new RangeError('Unknown aim preset.');Object.assign(targetState,{speed:.75,fov:1600,fullViewAim:true,aimPoint:'head',autoShoot:true,movingOnly:false,requireTrigger:false,triggerDown:false,boxes:true,lines:true,skeleton:true,headCircles:true});return targetState}
 function alignedTarget(point){return Math.abs(point.x)<=Math.max(3,Math.min(10,(point.width||0)*.25))&&Math.abs(point.y)<=Math.max(3,Math.min(10,(point.height||0)*.1));}
 function createTargetLock(){let previous=null,stamp=0;return {reset(){previous=null;stamp=0},update(regions,width,height,now){const valid=regions.filter(p=>p.distance<=(Math.min(width,height)/2)**2);let target=null;if(previous&&now-stamp<=120){const radius=Math.max(24,Math.min(64,Math.max(previous.width||0,previous.height||0)*.6));let best=radius*radius;for(const p of valid){const distance=(p.x-previous.x)**2+(p.y-previous.y)**2;if(distance<best){best=distance;target=p}}}if(!target)target=selectTarget(valid,width,height);if(!target){previous=null;stamp=0;return null}const same=previous&&(target.x-previous.x)**2+(target.y-previous.y)**2<64*64;const result=same?{...target,x:target.x*.9+previous.x*.1,y:target.y*.9+previous.y*.1}:{...target};previous=result;stamp=now;return result}}}
 function createRegionConfidence(){let previous=[];return {reset(){previous=[]},update(regions){const accepted=[],next=[],used=new Set();for(const region of regions){let match=null,best=32*32;for(const old of previous){if(used.has(old))continue;const d=(region.x-old.x)**2+(region.y-old.y)**2,scale=region.height/Math.max(1,old.height);if(d<best&&scale>.65&&scale<1.5){best=d;match=old}}if(match)used.add(match);const seen=(match?.seen||0)+1;next.push({...region,seen});if(seen>=2)accepted.push(region)}previous=next;return accepted}}}
 function projectCharacter(bounds,model,view,width,height,zoom=1){
  if(!bounds?.lo||!bounds?.hi||model?.length!==16||view?.length!==16)return null;
  const multiply=(m,p)=>[0,1,2,3].map(i=>m[i]*p[0]+m[i+4]*p[1]+m[i+8]*p[2]+m[i+12]*p[3]);
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity,minDepth=Infinity;
  for(const x of [bounds.lo[0],bounds.hi[0]])for(const y of [bounds.lo[1],bounds.hi[1]])for(const z of [bounds.lo[2],bounds.hi[2]]){const clip=multiply(view,multiply(model,[x,y,z,1]));if(!clip.every(Number.isFinite)||clip[3]<=0)return null;minDepth=Math.min(minDepth,clip[3]);const px=(clip[0]*zoom/clip[3]+1)*width/2,py=(1-clip[1]*zoom/clip[3])*height/2;left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py)}
  if(right<0||bottom<0||left>width||top>height)return null;
  return {left,top,width:right-left,height:bottom-top,minDepth,worldOrigin:Array.from(model.slice(12,15))};
 }
 function projectPoint(point,model,view,width,height,zoom=1){const mul=(m,p)=>[0,1,2,3].map(i=>m[i]*p[0]+m[i+4]*p[1]+m[i+8]*p[2]+m[i+12]*p[3]);if(!point||!model||!view)return {};const world=mul(model,[...point,1]),clip=mul(view,world);if(clip[3]<=.01||!clip.every(Number.isFinite))return {};return {x:(clip[0]*zoom/clip[3]+1)*width/2,y:(1-clip[1]*zoom/clip[3])*height/2,world:world.slice(0,3)}}
 function isLocalViewBody(body,width,height){const head=body.head||{x:body.left+body.width/2,y:body.top+body.height*.1};const feet=Math.max(body.top+body.height,...(body.joints||[]).filter(j=>/Ankle|Foot/i.test(j.name)).map(j=>j.y));return body.minDepth<6&&body.height>height*.25&&feet>height*.88&&head.x>width*.2&&head.x<width*.6&&head.y>height*.22}
 function characterTargetAllowed(body,player,width,height){if(player?.controlled||player?.dead)return false;return player?true:!isLocalViewBody(body,width,height);}
 function playerInfoLines(actor){
  const name=typeof actor?.name==='string'?actor.name.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,42):'';
  const value=n=>Number.isFinite(n)&&n>=0&&n<=1000000?String(Math.round(n)):'—';
  return [name||(actor?.source==='training'?'Training bot':'Player'), 'HP '+value(actor?.health)+' · Shield '+value(actor?.shield)];
 }
 function espDetails(actor){const ratio=n=>Number.isFinite(n)&&n>=0?Math.max(0,Math.min(1,n/100)):null;return {healthRatio:ratio(actor?.health),shieldRatio:ratio(actor?.shield),distanceLabel:Number.isFinite(actor?.distance)&&actor.distance>=0?Math.round(actor.distance)+' m':''};}
 function targetRegions(regions,characters,width,height,aimPoint){const targets=[];for(const body of characters){const matched=matchCharacterRegions(regions,[body],width,height,width,height);if(!matched.length)continue;const anchor=(aimPoint==='head'?body.head:body.torso)||{x:body.left+body.width/2,y:body.top+body.height*(aimPoint==='head'?.1:.45)};const x=anchor.x-width/2,y=height/2-anchor.y;targets.push({x,y,distance:x*x+y*y,left:body.left,top:body.top,width:body.width,height:body.height,joints:body.joints,head:body.head,worldOrigin:body.worldOrigin,worldPoint:anchor.world})}return targets}
 function detectionBounds(characters,width,height){if(!characters.length)return null;const left=Math.max(0,Math.floor(Math.min(...characters.map(c=>c.left))-6)),top=Math.max(0,Math.floor(Math.min(...characters.map(c=>c.top))-6)),right=Math.min(width,Math.ceil(Math.max(...characters.map(c=>c.left+c.width))+6)),bottom=Math.min(height,Math.ceil(Math.max(...characters.map(c=>c.top+c.height))+6));return right>left&&bottom>top?{left,top,width:right-left,height:bottom-top}:null}
 function matchCharacterRegions(regions,characters,scanWidth,scanHeight,canvasWidth,canvasHeight){
  const ox=(canvasWidth-scanWidth)/2,oy=(canvasHeight-scanHeight)/2;
  return regions.filter(r=>{const left=r.left+ox,top=r.top+oy,cx=left+r.width/2,cy=top+r.height/2;return characters.some(c=>{if(cx<c.left-4||cx>c.left+c.width+4||cy<c.top-4||cy>c.top+c.height+4)return false;const overlap=Math.max(0,Math.min(left+r.width,c.left+c.width+4)-Math.max(left,c.left-4))*Math.max(0,Math.min(top+r.height,c.top+c.height+4)-Math.max(top,c.top-4));return overlap>=r.width*r.height*.7})})
 }

 const regionConfidence=createRegionConfidence();
 const targetLock=createTargetLock();
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
   for(const entry of pool){if(entry.stamp===stamp)continue;let d=0;for(const i of [12,13,14])d+=(matrix[i]-entry.matrix[i])**2;if(d<distance){distance=d;best=entry;}}
   let moving=false;if(best&&distance<4){const translated=distance>0.0001;best.streak=translated?(best.streak||0)+1:0;moving=translated&&best.streak>=2;best.matrix=matrix.slice();best.stamp=stamp;}else{if(pool.length>=64)pool.shift();pool.push({matrix:matrix.slice(),stamp,streak:0});}
   if(groups.size>2048)groups.clear();groups.set(key,pool);return moving;
  };return {observe};
 }
 const blocks=new WeakMap();const tracker=createMotionTracker(),uniformNames=new WeakMap(),modelMatrices=new WeakMap(),viewMatrices=new WeakMap(),geometryCaches=new WeakMap(),objectIds=new WeakMap();let nextObjectId=1;
 const objectId=value=>{if(!value||typeof value!=='object')return 0;if(!objectIds.has(value))objectIds.set(value,nextObjectId++);return objectIds.get(value);};
 function readUniform(data,offset=0,length=0){
  const size=Math.min(16,Math.max(0,(data?.length||0)-offset),length>0?length:16);
  return Array.from({length:size},(_,i)=>data[offset+i]);
 }
 function recordModel(location,data,offset=0,length=0){
  const meta=location&&uniformNames.get(location);if(!meta)return;
  const isView=/unity_MatrixVP/.test(meta.name),isModel=/unity_ObjectToWorld/.test(meta.name);if(!isView&&!isModel)return;
  if(!isView&&!state.aim&&!state.silent&&!state.esp&&!state.boxes&&!state.lines&&!state.headCircles&&!state.skeleton&&!state.playerInfo&&!state.healthBars&&!state.distanceLabels)return;
  const matrices=isView?viewMatrices:modelMatrices,values=readUniform(data,offset,length);let record=matrices.get(meta.program)||{matrix:Array(16).fill(0),rows:0};
  if(values.length>=16){record={matrix:values.slice(0,16),rows:15};}else if(values.length>=4){const row=Number(meta.name.match(/\[(\d)\]/)?.[1]||0);if(row>3)return;record.matrix.splice(row*4,4,...values.slice(0,4));record.rows|=1<<row;}
  matrices.set(meta.program,record);if(isModel)state.modelUpdates++;
 }
 function viewMatrix(gl,program,uniforms){let record=viewMatrices.get(program);if(record?.rows===15)return record.matrix;if(!uniforms.viewLocations)uniforms.viewLocations=[0,1,2,3].map(i=>gl.getUniformLocation(program,'hlslcc_mtx4x4unity_MatrixVP['+i+']'));if(uniforms.viewLocations.some(x=>!x))return null;const matrix=uniforms.viewLocations.flatMap(location=>Array.from(gl.getUniform(program,location)||[]));if(matrix.length!==16)return null;viewMatrices.set(program,{matrix,rows:15});return matrix;}

 window.NovaLOLVisual={state,patchShader,findTarget,findRegions,selectTarget,aimDelta,aimAreaDiameter,applyPreset,createAutoFire,createMotionTracker,readUniform,createTargetLock,alignedTarget,createRegionConfidence,projectCharacter,projectPoint,isLocalViewBody,characterTargetAllowed,playerInfoLines,espDetails,targetRegions,detectionBounds,matchCharacterRegions,clearTracking,releaseAutoFire};
 if(!window.WebGL2RenderingContext||!window.HTMLCanvasElement){state.message='WebGL 2 hooks unavailable.';return;}
 const proto=window.WebGL2RenderingContext.prototype,sourceNative=proto.shaderSource;
 const hook=(object,name,handler)=>{const original=object[name];object[name]=function(...args){return handler.call(this,original,args)};};
 hook(window.HTMLCanvasElement.prototype,'getContext',function(original,args){if(args[0]==='webgl2')args[1]={...(args[1]||{}),preserveDrawingBuffer:true};return original.apply(this,args);});
 hook(proto,'bufferData',function(original,args){const target=args[0],binding=target===this.ARRAY_BUFFER?this.ARRAY_BUFFER_BINDING:target===this.ELEMENT_ARRAY_BUFFER?this.ELEMENT_ARRAY_BUFFER_BINDING:target===this.COPY_WRITE_BUFFER?this.COPY_WRITE_BUFFER_BINDING:target===this.COPY_READ_BUFFER?this.COPY_READ_BUFFER_BINDING:null;const buffer=binding===null?null:this.getParameter(binding),result=original.apply(this,args);if(buffer)geometryCaches.get(this)?.invalidateBuffer(buffer);return result;});
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
  if(supported&&this.getProgramParameter(program,this.LINK_STATUS)){programs.set(program,{zoom:this.getUniformLocation(program,'novaZoom'),enabled:this.getUniformLocation(program,'novaEnabled'),threshold:this.getUniformLocation(program,'novaThreshold'),color:this.getUniformLocation(program,'novaColor'),character:window.NovaBuildNowCharacters?.isWorldProgram(shaders.map(shader=>originals.get(shader)||'').join('\n'))||false});state.programs++;state.message='Character body filtering available.';}return result;
 }
 hook(proto,'linkProgram',link);
 hook(proto,'useProgram',function(original,args){const result=original.apply(this,args),uniforms=args[0]&&programs.get(args[0]);if(uniforms?.zoom)this.uniform1f(uniforms.zoom,Math.max(.5,Math.min(2,Number(state.zoom)||1)));return result;});
 function blockModel(gl,program){
 if(!state.aim&&!state.silent&&!state.esp&&!state.boxes&&!state.lines&&!state.headCircles&&!state.skeleton&&!state.playerInfo&&!state.healthBars&&!state.distanceLabels)return;
 let block=blocks.get(program);if(block===undefined){block=null;const count=gl.getProgramParameter(program,gl.ACTIVE_UNIFORMS);for(let i=0;i<count;i++){const info=gl.getActiveUniform(program,i);if(info&&/unity_ObjectToWorld\[0\]/.test(info.name)){const index=gl.getActiveUniforms(program,[i],gl.UNIFORM_BLOCK_INDEX)[0];if(index!==-1&&index!==0xffffffff){block={index,offset:gl.getActiveUniforms(program,[i],gl.UNIFORM_OFFSET)[0],matrix:new Float32Array(16)};break;}}}blocks.set(program,block)}if(!block)return;
 const binding=gl.getActiveUniformBlockParameter(program,block.index,gl.UNIFORM_BLOCK_BINDING),buffer=gl.getIndexedParameter(gl.UNIFORM_BUFFER_BINDING,binding);if(!buffer)return;const offset=Number(gl.getIndexedParameter(gl.UNIFORM_BUFFER_START,binding)||0)+block.offset,previous=gl.getParameter(gl.UNIFORM_BUFFER_BINDING);try{gl.bindBuffer(gl.UNIFORM_BUFFER,buffer);gl.getBufferSubData(gl.UNIFORM_BUFFER,offset,block.matrix);modelMatrices.set(program,{matrix:Array.from(block.matrix),rows:15});state.modelUpdates++;}catch{}finally{gl.bindBuffer(gl.UNIFORM_BUFFER,previous)}
 }
 function drawElements(original,args){
  if(this.canvas?.id!=='unity-canvas')return original.apply(this,args);
  context=this;canvas=this.canvas;drawSerial++;if(drawFrame!==frameStamp){drawFrame=frameStamp;state.movingDraws=0;state.candidates=0;state.characterDraws=0;state.nearCameraDraws=0;state.projectedCharacters=[];state.skeletons=[];}
  const session=window.NovaBuildNowEngine?.snapshot();const program=this.getParameter(this.CURRENT_PROGRAM),uniforms=program&&programs.get(program),active=!(session?.ready&&session.hasPlayer===false)&&(state.aim||state.silent||state.esp||state.boxes||state.lines||state.headCircles||state.skeleton||state.playerInfo||state.healthBars||state.distanceLabels);
  if(uniforms){let candidate=false,eligible=false,moving=false;
   if(active&&uniforms.character&&args[0]===this.TRIANGLES&&args[1]>0&&(args.length<5||args[4]===1)){
    let cache=geometryCaches.get(this);if(!cache&&window.NovaBuildNowCharacters){cache=window.NovaBuildNowCharacters.createCharacterGeometryCache(this);geometryCaches.set(this,cache)}
    const geometry=cache?.classify(program,args[1],args[2],args[3]);candidate=Boolean(geometry?.character);state.geometryChecks=cache?.checks||state.geometryChecks;
    if(candidate){state.characterDraws++;const pose=cache.readPose(geometry,{joints:state.aim||state.silent||state.skeleton||state.headCircles});if(!pose){this.uniform1i(uniforms.enabled,0);return original.apply(this,args);}blockModel(this,program);const model=modelMatrices.get(program),view=viewMatrix(this,program,uniforms);
     if(model?.rows===15){const key=objectId(program)+':'+objectId(this.getParameter(this.VERTEX_ARRAY_BINDING))+':'+objectId(this.getParameter(this.ELEMENT_ARRAY_BUFFER_BINDING))+':'+args[1]+':'+args[3];moving=tracker.observe(key,model.matrix,frameStamp);const projected=projectCharacter(pose.bounds,model.matrix,view,canvas.width,canvas.height,state.zoom);
      if(projected){const joints=pose.joints.map(j=>({...j,...projectPoint(j.position,model.matrix,view,canvas.width,canvas.height,state.zoom)})).filter(j=>Number.isFinite(j.x)&&Number.isFinite(j.y));const head=pose.headTarget?projectPoint(pose.headTarget,model.matrix,view,canvas.width,canvas.height,state.zoom):joints.find(j=>j.name==='Head'),torso=joints.find(j=>/Spine_?02|Spine2|Chest/i.test(j.name))||joints.find(j=>/Spine/i.test(j.name));projected.head=head;projected.torso=torso;projected.joints=joints;state.boneCount=joints.length;
       const engine=window.NovaBuildNowEngine,nativeReady=engine?.snapshot().ready,player=nativeReady?engine.matchPlayer(projected.worldOrigin):null;const ownPosition=engine?.snapshot().ownPosition;projected.actor=player?.stats?{...player.stats,source:player.source,distance:player.position&&ownPosition?Math.hypot(...player.position.map((value,index)=>value-ownPosition[index])):null}:null;const opponent=characterTargetAllowed(projected,player,canvas.width,canvas.height);if(opponent&&(!state.movingOnly||moving)){eligible=true;state.projectedCharacters.push(projected);if(state.skeleton&&joints.length)state.skeletons.push({joints})}else state.nearCameraDraws++;
      }
     }
    }
   }
   if(uniforms.zoom)this.uniform1f(uniforms.zoom,Math.max(.5,Math.min(2,Number(state.zoom)||1)));this.uniform1i(uniforms.enabled,active&&eligible?1:0);this.uniform1f(uniforms.threshold,state.threshold);if(this.uniform3fv)this.uniform3fv(uniforms.color,state.color);if(candidate)state.candidates++;if(moving)state.movingDraws++;
  }return original.apply(this,args);
 }
 for(const name of ['drawElements','drawElementsInstanced'])if(typeof proto[name]==='function')hook(proto,name,drawElements);

 const autoFire=createAutoFire((type,options)=>{if(canvas)window.NovaLOLInput?.mouse(canvas,type,options);});
 function releaseAutoFire(){autoFire.stop();}
 function clearTracking(){state.regions=[];state.skeletons=[];state.target=null;state.projectedCharacters=[];motionPrevious=null;lastSample=0;targetLock.reset();regionConfidence.reset();remainderX=remainderY=0;autoFire.stop();}
 function sample(now){
  if(!context||!canvas||document.hidden){clearTracking();return;}
  if(state.weaponCycleFire||!state.aim&&!state.silent||state.requireTrigger&&!state.triggerDown||!state.autoShoot||document.pointerLockElement!==canvas)autoFire.stop();
  lastFrame=now;
  if(document.pointerLockElement!==canvas&&!state.silent&&!state.motion&&!state.boxes&&!state.lines&&!state.headCircles&&!state.skeleton&&!state.playerInfo&&!state.healthBars&&!state.distanceLabels){clearTracking();return;}
  if(!state.aim&&!state.silent&&!state.motion&&!state.boxes&&!state.lines&&!state.headCircles&&!state.skeleton&&!state.playerInfo&&!state.healthBars&&!state.distanceLabels){clearTracking();return;}
  if(!state.projectedCharacters.length&&!state.motion){clearTracking();return;}
  if(now-lastSample<8)return;const elapsed=lastSample?now-lastSample:16;lastSample=now;
  const gl=context,rect=canvas.getBoundingClientRect(),sx=rect.width/canvas.width,sy=rect.height/canvas.height,bounds=detectionBounds(state.projectedCharacters,canvas.width,canvas.height);if(!bounds){clearTracking();return;}const w=bounds.width,h=bounds.height;
  if(!scanBuffer||scanBuffer.length!==w*h*4)scanBuffer=new Uint8Array(w*h*4);const pixels=scanBuffer,previous=gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
  try{gl.bindFramebuffer(gl.READ_FRAMEBUFFER,null);gl.readPixels(bounds.left,canvas.height-bounds.top-h,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);}catch{state.aim=false;state.motion=false;state.message='Frame sampling unavailable.';clearTracking();return;}finally{gl.bindFramebuffer(gl.READ_FRAMEBUFFER,previous);}
  if(state.motion){let changed=0,total=0;for(let i=0;i<pixels.length;i+=64){total++;if(motionPrevious&&Math.abs(pixels[i]-motionPrevious[i])+Math.abs(pixels[i+1]-motionPrevious[i+1])+Math.abs(pixels[i+2]-motionPrevious[i+2])>70)changed++;}state.motionPercent=Math.round(changed/total*100);motionPrevious=new Uint8Array(pixels);}else motionPrevious=null;
  const visible=findRegions(pixels,w,h,{allowClipped:true,verifiedGeometry:true}).map(r=>({...r,left:r.left+bounds.left,top:r.top+bounds.top,x:r.x+bounds.left+w/2-canvas.width/2,y:r.y+canvas.height/2-bounds.top-h/2}));state.regions=regionConfidence.update(targetRegions(visible,state.projectedCharacters,canvas.width,canvas.height,state.aimPoint||'head'));state.scanWidth=canvas.width;state.scanHeight=canvas.height;
  if(!state.aim&&!state.silent||state.requireTrigger&&!state.triggerDown||document.pointerLockElement!==canvas){autoFire.stop();targetLock.reset();remainderX=remainderY=0;return;}
  const point=targetLock.update(state.regions.map(p=>({...p,x:p.x*sx,y:p.y*sy,distance:(p.x*sx)**2+(p.y*sy)**2,width:p.width*sx,height:p.height*sy})),aimAreaDiameter(rect.width,rect.height,state.fov,state.fullViewAim),aimAreaDiameter(rect.width,rect.height,state.fov,state.fullViewAim),now);state.target=point;if(!point){autoFire.stop();remainderX=remainderY=0;return;}
  if(state.silent){autoFire.update(now,state.autoShoot&&!state.weaponCycleFire&&Boolean(window.NovaBuildNowEngine?.hasTarget()));return;}
  // Pixel readback is bottom-up; negative Y moves the camera upward.
  const {dx,dy}=aimDelta(point,state.speed,elapsed);
  remainderX+=dx;remainderY+=dy;const moveX=Math.trunc(remainderX),moveY=Math.trunc(remainderY);remainderX-=moveX;remainderY-=moveY;
  if(window.NovaLOLInput&&(moveX||moveY)){window.NovaLOLInput.mouse(canvas,'mousemove',{dx:moveX,dy:moveY,buttons:state.weaponCycleFire||autoFire.held?1:0});state.inputMoves++;}
  const aligned=alignedTarget(point);autoFire.update(now,state.autoShoot&&!state.weaponCycleFire&&aligned);
 }
 hook(window,'requestAnimationFrame',function(original,args){const callback=args[0];args[0]=function(now){if(frameStamp!==now)frameStamp=now;const before=drawSerial,result=callback(now);if(drawSerial!==before)sample(now);return result;};return original.apply(this,args);});
 window.addEventListener('blur',clearTracking);
 document.addEventListener?.('visibilitychange',()=>{if(document.hidden)clearTracking();});
 document.addEventListener?.('pointerlockchange',()=>{if(document.pointerLockElement!==canvas)clearTracking();});
 window.addEventListener('pagehide',()=>{clearTracking();state.esp=state.aim=state.autoShoot=state.wireframe=state.spin=state.motion=state.skeleton=state.playerInfo=false;},{once:true});
})();
