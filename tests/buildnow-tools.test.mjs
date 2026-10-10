import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {buildNowTools} from '../server/buildnow-tools.mjs';
test('BuildNow shader declarations follow required GLSL precision statements',()=>{const window={};vm.runInNewContext(readFileSync(new URL('../server/buildnow-visual.js',import.meta.url),'utf8'),{window});const source='#version 300 es\nprecision highp float;\nprecision highp int;\nout highp vec4 result;\nvoid main(){result=vec4(1.0);}',patched=window.NovaLOLVisual.patchShader(source,false);assert(patched.indexOf('uniform bool novaEnabled')>patched.indexOf('precision highp int;'));assert(patched.includes('result=vec4(novaColor,1.0)'))});
test('BuildNow bundle uses character geometry filtering and the correct game canvas',async()=>{const code=await buildNowTools();new vm.Script(code);assert(code.includes('UNIFORM_BLOCK_BINDING'));assert(code.includes('getBufferSubData'));assert(code.includes('characterGeometry'));assert(code.includes("document.querySelector('#unity-canvas')"));});

function tracking(){const window={};vm.runInNewContext(readFileSync(new URL('../server/buildnow-visual.js',import.meta.url),'utf8'),{window});return window.NovaLOLVisual}
const point=(x,y=0)=>({x,y,distance:x*x+y*y,width:30,height:60});
test('tracking holds a nearby moving target instead of switching to a closer shape',()=>{const lock=tracking().createTargetLock();assert.equal(lock.update([point(40)],256,256,0).x,40);const held=lock.update([point(44),point(5)],256,256,16);assert(held.x>40);assert(held.x<44);assert.equal(lock.update([],256,256,32),null);assert.equal(lock.update([point(5)],256,256,48).x,5)});
test('tracking drops missing and out-of-range targets and resets after focus loss',()=>{const lock=tracking().createTargetLock();lock.update([point(40)],256,256,0);assert.equal(lock.update([point(200)],256,256,16),null);lock.update([point(40)],256,256,32);lock.reset();assert.equal(lock.update([point(5),point(40)],256,256,48).x,5)});
test('aim correction is consistent across frame rates and remains bounded',()=>{const {aimDelta}=tracking();const full=aimDelta(point(20),.4,16).dx,half=aimDelta(point(20),.4,8).dx;assert(Math.abs((1-half/20)**2-(1-full/20))<1e-9);assert.equal(aimDelta(point(.5),.4,16).dx,0);assert(aimDelta(point(1000),1,1000).dx<=36)});

test('candidate regions reject tiny objects and flat ground but retain upright shapes',()=>{const api=tracking(),width=100,height=100;const rect=(x,y,w,h)=>{const pixels=new Uint8Array(width*height*4);for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++){const i=(py*width+px)*4;pixels[i]=255;pixels[i+3]=255}return api.findRegions(pixels,width,height)};assert.equal(rect(48,48,4,4).length,0);assert.equal(rect(35,45,30,8).length,0);assert.equal(rect(44,35,12,28).length,1)});
test('automatic fire requires alignment and vertical aim movement stays bounded',()=>{const api=tracking();assert.equal(api.alignedTarget({x:0,y:0,width:30,height:60}),true);assert.equal(api.alignedTarget({x:25,y:0,width:30,height:60}),false);assert.equal(api.alignedTarget({x:0,y:20,width:30,height:60}),false);assert(Math.abs(api.aimDelta({x:0,y:500},.9,16).dy)<=12)});
test('BuildNow highlighting does not move hidden geometry through the depth buffer',()=>{const patched=tracking().patchShader('#version 300 es\nprecision highp float;\nvoid main(){gl_Position=vec4(1.0);}',true);assert(!patched.includes('gl_Position.z=-'));assert(patched.includes('gl_Position.xy*=novaZoom'))});
test('BuildNow motion ignores prop rotation and scale, requires sustained translation',()=>{const tracker=tracking().createMotionTracker(),matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];assert.equal(tracker.observe('body',matrix,0),false);const rotated=matrix.slice();rotated[0]=.5;rotated[1]=.5;assert.equal(tracker.observe('body',rotated,16),false);const scaled=rotated.slice();scaled[5]=2;assert.equal(tracker.observe('body',scaled,32),false);const moved=scaled.slice();moved[12]=.1;assert.equal(tracker.observe('body',moved,48),false);moved[12]=.2;assert.equal(tracker.observe('body',moved,64),true);moved[12]=100;assert.equal(tracker.observe('body',moved,80),false)});
test('single-frame or missing regions cannot become aim/tracer targets',()=>{const tracker=tracking().createRegionConfidence(),region={...point(30),height:40};assert.equal(tracker.update([region]).length,0);assert.equal(tracker.update([{...region,x:32}]).length,1);assert.equal(tracker.update([]).length,0);assert.equal(tracker.update([region]).length,0);tracker.reset();assert.equal(tracker.update([region]).length,0)});


function paintedRegion(api,{x=44,y=35,width=12,height=28,color=[163,144,229],alpha=255,frameWidth=100,frameHeight=100}={}){
  api.state.color=[163/255,144/255,229/255];
  const pixels=new Uint8Array(frameWidth*frameHeight*4);
  for(let py=y;py<y+height;py++)for(let px=x;px<x+width;px++){
    const offset=(py*frameWidth+px)*4;
    pixels.set([...color,alpha],offset);
  }
  return api.findRegions(pixels,frameWidth,frameHeight);
}

test('violet target mask rejects natural grey and blue weapon pixels',()=>{
  const api=tracking();
  assert.equal(paintedRegion(api,{color:[180,180,190]}).length,0,'grey rifle pixels must not become targets');
  assert.equal(paintedRegion(api,{color:[155,179,205]}).length,0,'blue-grey arm pixels must not become targets');
});

test('violet target mask keeps painted bodies while rejecting broad color matches',()=>{
  const api=tracking();
  assert.equal(paintedRegion(api).length,1,'exact shader-painted body remains detectable');
  assert.equal(paintedRegion(api,{color:[173,134,239]}).length,1,'small color variation remains detectable');
  assert.equal(paintedRegion(api,{color:[193,144,229]}).length,0,'a thirty-level red mismatch is not a marker');
  assert.equal(paintedRegion(api,{alpha:150}).length,0,'transparent effects are not opaque body markers');
});

test('clipped local body and weapon regions are not aim or tracer candidates',()=>{
  const api=tracking();
  assert.equal(paintedRegion(api,{x:38,y:0,width:24,height:40}).length,0,'local body clipped at bottom of scan is rejected');
  assert.equal(paintedRegion(api,{x:0,y:35,width:12,height:28}).length,0,'partial weapon at scan boundary is rejected');
  assert.equal(paintedRegion(api,{x:88,y:35,width:12,height:28}).length,0,'partial body at opposite boundary is rejected');
  assert.equal(paintedRegion(api).length,1,'a complete body inside the scan remains eligible');
});

test('a split region cannot reuse one prior target confidence twice',()=>{
  const confidence=tracking().createRegionConfidence();
  assert.equal(confidence.update([point(30)]).length,0);
  const divided=[point(28),point(32)];
  assert.equal(confidence.update(divided).length,1,'one previous region can confirm only one current region');
  assert.equal(confidence.update(divided).length,2,'independent persistent regions can both acquire confidence');
  confidence.reset();
  assert.equal(confidence.update(divided).length,0,'reset discards inherited confidence');
});
