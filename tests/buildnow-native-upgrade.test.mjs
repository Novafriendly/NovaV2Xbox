import test from 'node:test';
import assert from 'node:assert/strict';
import {walkingSpeedModule} from '../server/buildnow-engine.mjs';
import {runtime} from './buildnow-engine-fixture.mjs';

test('walking wrapper is valid typed WASM and preserves the base method arguments and result',async()=>{
 const bytes=walkingSpeedModule();assert(WebAssembly.validate(bytes));const calls=[];
 const {instance}=await WebAssembly.instantiate(bytes,{m:{base:(player,info)=>{calls.push([player,info]);return 7.5;},scale:player=>player===123?2:1}});
 assert.equal(instance.exports.run(123,456),15);assert.equal(instance.exports.run(789,456),7.5);assert.deepEqual(calls,[[123,456],[789,456]]);
});

test('walking multiplier applies only to the living owned ground player while captured',async()=>{
 const f=runtime({hostname:'localhost',offline:false});await f.load();assert.equal(f.api.snapshot().walkSpeedReady,true);f.writeWord(f.own+264,1);f.api.setWalkMultiplier(2.5);f.api.setWalkSpeed(true);
 assert.equal(f.nativeMaxSpeed(),20);assert.equal(f.nativeMaxSpeed(f.opponent),8);
 f.writeWord(f.own+264,2);assert.equal(f.nativeMaxSpeed(),8);f.writeWord(f.own+264,1);
 f.document.pointerLockElement=null;assert.equal(f.nativeMaxSpeed(),8);f.document.pointerLockElement={id:'unity-canvas'};
 f.document.hasFocus=()=>false;assert.equal(f.nativeMaxSpeed(),8);f.document.hasFocus=()=>true;
 f.setOwnOwned(false);assert.equal(f.nativeMaxSpeed(),8);f.setOwnOwned(true);
 f.writeByte(f.own+1331,1);assert.equal(f.nativeMaxSpeed(),8);f.writeByte(f.own+1331,0);
 assert.equal(f.api.setWalkMultiplier(Infinity).walkMultiplier,2.5);assert.equal(f.api.setWalkMultiplier(99).walkMultiplier,5);assert.equal(f.api.setWalkMultiplier(-1).walkMultiplier,1);
 f.api.setWalkSpeed(false);assert.equal(f.nativeMaxSpeed(),8);f.api.setWalkSpeed(true);f.windowEvent('pagehide');assert.equal(f.nativeMaxSpeed(),8);assert.equal(f.api.snapshot().walkSpeedReady,false);
});

function heads({hostname='localhost',offline=false,human=true,validHead=true}={}){
 const f=runtime({hostname,offline}),animator=41000,head=43000;
 f.component(animator,44000,50000,'Animator',33554451);f.component(head,45000,50100,'Transform',validHead?33554857:0);f.writeWord(f.opponent+184,animator);
 f.method(64969,p=>{assert.equal(p,animator);return human?1:0;});f.method(65039,(p,bone)=>{assert.equal(p,animator);assert.equal(bone,10);return head;});
 f.method(3579,p=>p===head?head:p===f.opponent?26000:9000);f.method(3580,(out,p)=>new Float32Array(f.memory.buffer,out,3).set(p===head?[20,1.8,10]:p===26000?[20,0,10]:[10,0,10]));
 return f;
}

test('localhost silent shots can select a native player head outside the view without moving the camera',async()=>{
 const f=heads();await f.load();f.dispatch(1,f.opponent);f.api.setSilent(true);assert.equal(f.api.hasTarget(),false);f.api.setSilentTargetMode('all');assert.equal(f.api.hasTarget(),true);
 f.writeVector(f.shotVelocity,[0,0,-1]);f.dispatch(3,f.weapon,f.shotVelocity);
 const vector=f.vectorAt(f.shotVelocity);assert(vector[0]>.98);assert(vector[1]>.17&&vector[1]<.19);assert.equal(vector[2],0);assert.equal(f.api.snapshot().redirectedShots,1);
 assert(!f.calls.some(x=>[68234,8788].includes(x.pointer)),'neither camera nor character rotations are used to redirect a shot');
});

test('all-player silent selection rejects missing heads, nonhuman rigs, dead actors and stale records',async()=>{
 for(const options of [{human:false},{validHead:false}]){const f=heads(options);await f.load();f.dispatch(1,f.opponent);f.api.setSilentTargetMode('all');f.api.setSilent(true);assert.equal(f.api.hasTarget(),false);}
 const f=heads();await f.load();f.dispatch(1,f.opponent);f.api.setSilentTargetMode('all');f.api.setSilent(true);f.writeByte(f.opponent+1331,1);f.advance(61);f.dispatch(1,f.opponent);assert.equal(f.api.hasTarget(),false);
 f.writeByte(f.opponent+1331,0);f.advance(61);f.dispatch(1,f.opponent);assert.equal(f.api.hasTarget(),true);f.advance(251);assert.equal(f.api.hasTarget(),false);
});

test('360 target mode never enables shot redirection on a production online origin',async()=>{
 const f=heads({hostname:'nova.example'});await f.load();f.dispatch(1,f.opponent);f.api.setSilentTargetMode('all');assert.throws(()=>f.api.setSilent(true),/offline Aim Training/);f.writeVector(f.shotVelocity,[0,0,-1]);f.dispatch(3,f.weapon,f.shotVelocity);assert.deepEqual(f.vectorAt(f.shotVelocity),[0,0,-1]);
});

test('generic player rigs use the actual game head transform with verified skin ancestry',async()=>{
 const f=heads({human:false}),animation=52000,skin=52500,setter=53000,root=48000,head=43000;
 f.component(animation,53500,54000,'PlayerAnimationHandler',33556733);f.component(skin,53680,54100,'PlayerSkinHandler',33556203);f.component(setter,53880,54200,'RigBonesRuntimeSetter',33556389);f.component(root,45000,50100,'Transform',33554857);
 f.writeWord(f.opponent+1344,animation);f.writeWord(animation+312,skin);f.writeWord(skin+20,animation);f.writeWord(skin+28,setter);f.writeWord(skin+40,root);f.writeWord(setter+24,head);f.method(8724,p=>p===head?root:0);
 await f.load();f.dispatch(1,f.opponent);f.api.setSilentTargetMode('all');f.api.setSilent(true);assert.equal(f.api.hasTarget(),true);assert.equal(f.calls.some(x=>x.pointer===65039),false,'generic rigs never need a guessed humanoid mapping');
 f.method(8724,()=>0);assert.equal(f.api.hasTarget(),false,'a head outside the current skin root is rejected');f.method(8724,p=>p===head?root:0);f.writeWord(skin+20,f.own);assert.equal(f.api.hasTarget(),false,'another animation handler cannot authorize this skin');
});
