import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {runtime} from './buildnow-engine-fixture.mjs';

function cycleFixture(){
  const fixture=runtime(),list=44000,array=44200;
  fixture.component(fixture.weapon,43000,45000,'RaycastWeapon',33556484);fixture.component(list,43200,45100,'List`1');
  fixture.writeWord(fixture.weapon+140,fixture.weapons);fixture.writeByte(fixture.weapon+157,1);fixture.writeWord(list+8,array);fixture.writeWord(list+12,1);fixture.writeWord(array+12,1);fixture.writeWord(array+16,fixture.weapon);fixture.writeWord(fixture.weapons+84,list);fixture.writeWord(fixture.weapons+80,fixture.weapon);fixture.writeWord(fixture.weapons+108,1);
  const stops=[];fixture.method(31009,weapon=>stops.push(weapon));return {...fixture,stops};
}

// Actual visual sampling and input helpers run on synthetic WebGL objects.
function installVisual(fixture){
  const pending=[],events=[],canvas=fixture.document.getElementById('unity-canvas');
  class GL{
    constructor(){this.canvas=canvas;Object.assign(this,{CURRENT_PROGRAM:1,TRIANGLES:4,READ_FRAMEBUFFER_BINDING:2,READ_FRAMEBUFFER:3,RGBA:4,UNSIGNED_BYTE:5});}
    shaderSource(){} compileShader(){} linkProgram(){} getUniformLocation(){return null;} getParameter(){return null;} bufferData(){} drawElements(){} bindFramebuffer(){}
    readPixels(x,y,width,height,format,type,pixels){pixels.fill(0);for(let row=6;row<height-6;row++)for(let col=6;col<width-6;col++){const at=(row*width+col)*4;const color=fixture.window.NovaLOLVisual.state.color;pixels[at]=color[0]*255;pixels[at+1]=color[1]*255;pixels[at+2]=color[2]*255;pixels[at+3]=255;}}
  }
  class Canvas{getContext(){}}
  fixture.window.WebGL2RenderingContext=GL;fixture.window.HTMLCanvasElement=Canvas;fixture.window.requestAnimationFrame=callback=>pending.push(callback);
  fixture.window.NovaLOLInput={mouse:(target,type,options)=>events.push({id:target.id,type,...options})};
  vm.runInNewContext(readFileSync(new URL('../server/buildnow-visual.js',import.meta.url),'utf8'),{window:fixture.window,document:fixture.document});
  const api=fixture.window.NovaLOLVisual,gl=new GL(),body={left:430,top:250,width:60,height:180,minDepth:20,worldOrigin:[20,0,10],head:{x:460,y:268,world:[20,1.8,10]},torso:{x:460,y:330,world:[20,.9,10]},joints:[]};
  const frame=now=>{fixture.window.requestAnimationFrame(()=>{gl.drawElements(gl.TRIANGLES,1,5123,0);api.state.projectedCharacters=[body];});const callback=pending.shift();assert(callback);callback(now);};
  return {api,events,body,frame};
}

const directionToTarget=()=>{const length=Math.hypot(10,1.8);return [10/length,1.8/length,0];};
const assertDirection=(actual,expected)=>actual.forEach((value,index)=>assert(Math.abs(value-expected[index])<1e-5,`${value} differs from ${expected[index]}`));

test('cycling preserves the silent target for the first synchronous shot without camera movement',async()=>{
  const fixture=cycleFixture();await fixture.load();fixture.dispatch(1,fixture.opponent);const visual=installVisual(fixture);
  fixture.api.setSilent(true);const regions=[{x:-40,y:132,worldOrigin:[20,0,10],worldPoint:[20,1.8,10]}],characters=[visual.body],locked={x:-40,y:132};Object.assign(visual.api.state,{regions,projectedCharacters:characters,target:locked,aim:false,autoShoot:false,esp:false,boxes:false,lines:false,skeleton:false});
  fixture.writeVector(fixture.own+1412,[17,9,1]);fixture.writeVector(fixture.own+1588,[0,0,1]);const beforeAngle=fixture.vectorAt(fixture.own+1412),beforeLook=fixture.vectorAt(fixture.own+1588);fixture.writeVector(fixture.shotOrigin,[0,0,1]);
  let targetOnPress=false;const mouse=[];fixture.window.NovaLOLInput.mouse=(canvas,type,options)=>{mouse.push({id:canvas.id,type,...options});if(type==='mousedown'){targetOnPress=fixture.api.hasTarget();fixture.dispatch(3,fixture.weapon,fixture.shotOrigin);}};
  fixture.api.setWeaponCycleOptions({fire:true});fixture.api.setWeaponCycle(true);fixture.dispatch(1);
  assert.equal(targetOnPress,true,'mousedown can synchronously fire before the next render sample');assertDirection(fixture.vectorAt(fixture.shotOrigin),directionToTarget());assert.equal(fixture.api.snapshot().shotEvents,1);assert.equal(fixture.api.snapshot().redirectedShots,1);
  assert.equal(visual.api.state.regions,regions);assert.equal(visual.api.state.projectedCharacters,characters);assert.equal(visual.api.state.target,locked);assert.equal(visual.api.state.aim,false);assert.equal(visual.api.state.silent,true);assert.deepEqual(fixture.vectorAt(fixture.own+1412),beforeAngle);assert.deepEqual(fixture.vectorAt(fixture.own+1588),beforeLook);assert(mouse.every(event=>event.type!=='mousemove'),'silent redirection never sends visible aiming input');
  assert(!fixture.calls.some(call=>[68234,8788].includes(call.pointer)),'silent firing never rotates the character or camera');fixture.api.setWeaponCycle(false);assert.equal(mouse.at(-1).type,'mouseup');assert.equal(fixture.stops.at(-1),fixture.weapon);
});

test('visual releaseAutoFire stops held input while keeping current targeting and visibility confidence',async()=>{
  const fixture=cycleFixture();await fixture.load();fixture.dispatch(1,fixture.opponent);const visual=installVisual(fixture);fixture.api.setSilent(true);visual.api.state.autoShoot=true;
  visual.frame(1000);assert.equal(visual.events.length,0,'one frame has not established visible-target confidence');fixture.advance(16);visual.frame(1016);assert.equal(visual.events.at(-1).type,'mousedown');assert.equal(fixture.api.hasTarget(),true);
  const regions=visual.api.state.regions,characters=visual.api.state.projectedCharacters,target=visual.api.state.target,skeletons=visual.api.state.skeletons;assert.equal(typeof visual.api.releaseAutoFire,'function');visual.api.releaseAutoFire();
  assert.equal(visual.events.at(-1).type,'mouseup');assert.equal(visual.api.state.regions,regions);assert.equal(visual.api.state.projectedCharacters,characters);assert.equal(visual.api.state.target,target);assert.equal(visual.api.state.skeletons,skeletons);assert.equal(visual.api.state.silent,true);assert.equal(visual.api.state.autoShoot,true);assert.equal(fixture.api.hasTarget(),true);
  const count=visual.events.length;visual.api.releaseAutoFire();assert.equal(visual.events.length,count,'release is idempotent once the input is up');fixture.advance(16);visual.frame(1032);assert.equal(visual.events.at(-1).type,'mousedown','the next silent frame reuses confidence instead of waiting for two new samples');assert(visual.events.every(event=>event.type!=='mousemove'));
  visual.api.clearTracking();assert.equal(visual.api.state.regions.length,0);assert.equal(visual.api.state.projectedCharacters.length,0);assert.equal(visual.events.at(-1).type,'mouseup','explicit reset retains its full cleanup behavior');
});

test('cycle takes over old automatic fire without losing the synchronous silent shot target',async()=>{
  const fixture=cycleFixture();await fixture.load();fixture.dispatch(1,fixture.opponent);const visual=installVisual(fixture);fixture.api.setSilent(true);visual.api.state.autoShoot=true;visual.frame(1000);fixture.advance(16);visual.frame(1016);assert.equal(visual.events.at(-1).type,'mousedown');
  const regions=visual.api.state.regions,characters=visual.api.state.projectedCharacters;fixture.writeVector(fixture.shotOrigin,[0,0,1]);const takeover=[];fixture.window.NovaLOLInput.mouse=(canvas,type,options)=>{takeover.push({id:canvas.id,type,...options});if(type==='mousedown')fixture.dispatch(3,fixture.weapon,fixture.shotOrigin);};
  fixture.api.setWeaponCycleOptions({fire:true});fixture.api.setWeaponCycle(true);fixture.dispatch(1);
  assert.deepEqual(takeover.map(event=>event.type),['mouseup','mousedown'],'old auto-fire is released before cycle begins its own hold');assertDirection(fixture.vectorAt(fixture.shotOrigin),directionToTarget());assert.equal(visual.api.state.regions,regions);assert.equal(visual.api.state.projectedCharacters,characters);assert.equal(fixture.api.snapshot().redirectedShots,1);assert.equal(visual.api.state.weaponCycleFire,true);
  fixture.api.disableAll();assert.equal(takeover.at(-1).type,'mouseup');assert.equal(visual.api.state.weaponCycleFire,false);
});
