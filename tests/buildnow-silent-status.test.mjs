import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime} from './buildnow-engine-fixture.mjs';

const target=()=>({x:0,y:0,worldOrigin:[30,0,15],worldPoint:[30,1,15]});
const readiness=fixture=>({...fixture.api.snapshot().silentReadiness});

function equippedGunFixture(){
 const fixture=runtime(),list=42000,array=42200,weaponClass=43000;
 fixture.component(fixture.weapon,weaponClass,46000,'RaycastWeapon',33556484);
 fixture.component(list,43200,46100,'List`1');
 fixture.writeWord(list+8,array);fixture.writeWord(list+12,1);fixture.writeWord(array+12,1);fixture.writeWord(array+16,fixture.weapon);
 fixture.writeWord(fixture.weapons+84,list);fixture.writeWord(fixture.weapons+80,fixture.weapon);
 return {...fixture,list,array,weaponClass};
}


test('silent readiness distinguishes capture, trigger, empty training and visible-target states',async()=>{
 const fixture=equippedGunFixture();await fixture.load();
 assert.equal(readiness(fixture).code,'off');fixture.api.setSilent(true);
 fixture.document.pointerLockElement=null;assert.equal(readiness(fixture).code,'capture');assert.equal(fixture.api.snapshot().silent,true);
 fixture.document.pointerLockElement={id:'unity-canvas'};
 fixture.window.NovaLOLVisual.state.requireTrigger=true;assert.equal(readiness(fixture).code,'trigger');
 fixture.window.NovaLOLVisual.state.triggerDown=true;assert.equal(readiness(fixture).code,'targets');assert.match(readiness(fixture).message,/Start Training panel/);
 fixture.dispatch(5,fixture.training);assert.equal(readiness(fixture).code,'visible');
 fixture.window.NovaLOLVisual.state.regions=[{...target(),worldPoint:undefined}];assert.equal(readiness(fixture).code,'pose');
 fixture.window.NovaLOLVisual.state.regions=[{...target(),worldOrigin:[300,0,15]}];assert.equal(readiness(fixture).code,'eligible');
 fixture.window.NovaLOLVisual.state.regions=[target()];assert.equal(readiness(fixture).code,'ready');
 const snapshot=fixture.api.snapshot();snapshot.silentReadiness.code='invented';assert.equal(readiness(fixture).code,'ready','snapshot diagnostics are independent');
});

test('silent readiness never reports a stale or dead training body as ready',async()=>{
 for(const invalidate of [fixture=>fixture.advance(251),fixture=>fixture.writeByte(fixture.trainingHealth+153,1)]){
  const fixture=equippedGunFixture();await fixture.load();fixture.dispatch(5,fixture.training);fixture.window.NovaLOLVisual.state.regions=[target()];fixture.api.setSilent(true);assert.equal(readiness(fixture).code,'ready');
  invalidate(fixture);fixture.advance(101);fixture.dispatch(1);assert.equal(readiness(fixture).code,'targets');assert.equal(fixture.api.snapshot().redirectedShots,0);
 }
});

test('silent readiness reports focus pauses without losing the enabled mode',async()=>{
 const fixture=equippedGunFixture();await fixture.load();fixture.dispatch(5,fixture.training);fixture.window.NovaLOLVisual.state.regions=[target()];fixture.api.setSilent(true);
 fixture.document.hidden=true;assert.equal(readiness(fixture).code,'capture');assert.equal(fixture.api.snapshot().silent,true);
 fixture.document.hidden=false;fixture.document.hasFocus=()=>false;assert.equal(readiness(fixture).code,'capture');
 fixture.document.hasFocus=()=>true;assert.equal(readiness(fixture).code,'ready');fixture.api.setSilent(false);assert.equal(readiness(fixture).code,'off');
});

test('silent ready diagnostics expose a redirected shot only after the shot hook changes direction',async()=>{
 const fixture=equippedGunFixture();await fixture.load();fixture.dispatch(5,fixture.training);fixture.window.NovaLOLVisual.state.regions=[target()];fixture.api.setSilent(true);
 assert.match(readiness(fixture).message,/Redirected shots: 0/);fixture.writeVector(fixture.shotOrigin,[10,0,10]);fixture.writeVector(fixture.shotVelocity,[0,0,50]);fixture.dispatch(4,fixture.weapon,fixture.shotOrigin,fixture.shotVelocity);
 assert.equal(fixture.api.snapshot().shotEvents,1);assert.equal(fixture.api.snapshot().redirectedShots,1);assert.match(readiness(fixture).message,/Redirected shots: 1/);
});


test('silent readiness guides empty loadouts and pickaxes before reporting a target ready',async()=>{
 const empty=runtime();await empty.load();empty.dispatch(5,empty.training);empty.window.NovaLOLVisual.state.regions=[target()];empty.api.setSilent(true);
 assert.equal(readiness(empty).code,'guns');assert.match(readiness(empty).message,/Equip gun loadout/);
 empty.document.pointerLockElement=null;assert.equal(readiness(empty).code,'capture','cursor guidance remains first');
 empty.document.pointerLockElement={id:'unity-canvas'};empty.api.setSilent(false);assert.equal(readiness(empty).code,'off');

 const fixture=equippedGunFixture();await fixture.load();fixture.dispatch(5,fixture.training);fixture.window.NovaLOLVisual.state.regions=[target()];fixture.api.setSilent(true);
 const pickaxe=44000,pickaxeClass=44400;fixture.component(pickaxe,pickaxeClass,47000,'Pickaxe',33556477);fixture.writeWord(pickaxeClass+44,fixture.weaponClass);
 fixture.writeWord(pickaxe+140,fixture.weapons);fixture.writeByte(pickaxe+157,1);fixture.writeWord(fixture.weapons+64,pickaxe);fixture.writeWord(fixture.weapons+80,pickaxe);
 assert.equal(readiness(fixture).code,'weapon');assert.match(readiness(fixture).message,/select a gun/);
 fixture.writeWord(fixture.array+16,pickaxe);assert.equal(readiness(fixture).code,'guns','a pickaxe-only loadout has no standard guns');
});

test('silent readiness waits for a local equipped gun to initialize or finish switching',async()=>{
 const fixture=equippedGunFixture();await fixture.load();fixture.dispatch(5,fixture.training);fixture.window.NovaLOLVisual.state.regions=[target()];fixture.api.setSilent(true);
 assert.equal(readiness(fixture).code,'ready');fixture.writeByte(fixture.weapon+157,0);
 assert.equal(readiness(fixture).code,'weapon-loading','cold listed guns cannot fire until their local Start callback');
 fixture.writeByte(fixture.weapon+157,1);fixture.writeByte(fixture.weapons+132,1);assert.equal(readiness(fixture).code,'weapon-loading');
 fixture.writeByte(fixture.weapons+132,0);assert.equal(readiness(fixture).code,'ready');
 fixture.writeWord(fixture.weapons+80,0);assert.equal(readiness(fixture).code,'weapon','an unavailable current gun is not ready');
 fixture.writeWord(fixture.weapons+80,fixture.weapon);fixture.writeWord(fixture.weapon+140,22000);
 assert.equal(readiness(fixture).code,'guns','foreign weapon ownership cannot satisfy local readiness');
 assert.equal(fixture.api.snapshot().redirectedShots,0,'diagnostics do not fire or redirect shots');
});
