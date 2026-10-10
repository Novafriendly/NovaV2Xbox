import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {normalizeTools,createToolsStore,createToolsRestorer,settingsRuntimeSource} from '../server/buildnow-settings.mjs';
const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key),values};};

test('saved controls survive a new store instance and reject malformed or unbounded settings',()=>{
 const disk=storage(),store=createToolsStore(disk);store.update({enabled:{flight:true,silent:true,walkSpeed:true,macro:true,scenery:true},engine:{flight:{speed:999,boost:3},walkMultiplier:99,cycle:{intervalMs:10,fire:true}},visual:{strength:200,trigger:'invalid'}});
 const loaded=createToolsStore(disk).read();assert.equal(loaded.enabled.flight,true);assert.equal(loaded.enabled.macro,true);assert.equal(loaded.enabled.scenery,undefined);assert.equal(loaded.engine.flight.speed,60);assert.equal(loaded.engine.walkMultiplier,5);assert.equal(loaded.engine.cycle.intervalMs,120);assert.equal(loaded.visual.strength,95);assert.equal(loaded.visual.trigger,'e');
 store.read().enabled.flight=false;assert.equal(store.read().enabled.flight,true);disk.setItem(store.key,'bad json');assert.equal(createToolsStore(disk).read().enabled.flight,false);assert.equal(normalizeTools(null).remember,true);
});

test('blocked browser storage reports the failure while controls retain valid in-memory intent',()=>{
 const store=createToolsStore({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}});assert.match(store.error,/read/);assert.equal(store.update({enabled:{flight:true}}).enabled.flight,true);assert.match(store.error,/save/);store.clear();assert.equal(store.read().enabled.flight,false);
});

function setup(){
 const store=createToolsStore(storage());store.update({enabled:{flight:true,silent:true,bodySpin:true,weaponCycle:true,walkSpeed:true},engine:{walkMultiplier:2,cycle:{intervalMs:120,fire:true}}});
 let now=0,restorer;const calls=[],state={ready:true,controlsAllowed:true,offline:false,hasPlayer:true,playerId:123,walkSpeedReady:true,availableGuns:4};
 const engine={};for(const [flag,method]of [['flight','setFlight'],['silent','setSilent'],['bodySpin','setBodySpin'],['weaponCycle','setWeaponCycle'],['walkSpeed','setWalkSpeed']])engine[method]=value=>{calls.push([method,value]);state[flag]=value;restorer?.sync({...state});};
 for(const method of ['setFlightOptions','setSpinSpeed','setWalkMultiplier','setWeaponCycleOptions','setSilentTargetMode'])engine[method]=value=>calls.push([method,value]);
 restorer=createToolsRestorer(()=>store.read(),()=>engine,()=>now);
 return {store,state,calls,engine,restorer,advance:n=>now+=n};
}

test('saved native controls wait for spawn, restore once, and restore again after a respawn without erasing intent',()=>{
 const s=setup();s.state.hasPlayer=false;s.restorer.sync({...s.state});assert.equal(s.calls.length,0);s.state.hasPlayer=true;s.restorer.sync({...s.state});assert.equal(s.calls.filter(x=>x[1]===true).length,5);const count=s.calls.length;s.restorer.sync({...s.state});assert.equal(s.calls.length,count,'active native state is not spammed');
 s.state.hasPlayer=false;for(const key of ['flight','silent','bodySpin','weaponCycle','walkSpeed'])s.state[key]=false;s.restorer.sync({...s.state});assert.equal(s.store.read().enabled.flight,true);
 s.state.hasPlayer=true;s.state.playerId=456;s.restorer.sync({...s.state});assert.equal(s.calls.filter(x=>x[1]===true).length,10);assert.equal(s.state.walkSpeed,true);
});

test('saving an explicit off choice before the native announcement prevents automatic re-enabling',()=>{
 const s=setup();s.restorer.sync({...s.state});s.store.update({enabled:{flight:false,silent:false}});s.engine.setFlight(false);s.engine.setSilent(false);s.restorer.sync({...s.state});assert.equal(s.state.flight,false);assert.equal(s.state.silent,false);assert.equal(s.store.read().enabled.flight,false);
});

test('restore waits for real guns and native speed availability, and retries failed models with a bounded delay',()=>{
 const s=setup();s.state.availableGuns=0;s.state.walkSpeedReady=false;let attempts=0;s.engine.setBodySpin=()=>{attempts++;throw Error('model loading');};assert.match(s.restorer.sync({...s.state}),/waiting/);assert.equal(s.state.weaponCycle,undefined);assert.equal(s.state.walkSpeed,undefined);s.restorer.sync({...s.state});assert.equal(attempts,1);
 s.advance(501);s.restorer.sync({...s.state});assert.equal(attempts,2);s.state.availableGuns=4;s.state.walkSpeedReady=true;s.store.update({enabled:{bodySpin:false}});s.restorer.sync({...s.state});assert.equal(s.state.weaponCycle,true);assert.equal(s.state.walkSpeed,true);assert.equal(attempts,2);
});

test('restore respects disabled remember, remote mode restrictions, and absent players',()=>{
 for(const block of ['remember','mode','player']){const s=setup();if(block==='remember')s.store.update({remember:false});if(block==='mode')s.state.controlsAllowed=false;if(block==='player')s.state.hasPlayer=false;s.restorer.sync({...s.state});assert.equal(s.calls.length,0);}
});

test('serialized settings API works without module closure dependencies',()=>{
 const context={window:{},disk:storage(),performance:{now:()=>0}};vm.runInNewContext(settingsRuntimeSource(),context);const api=context.window.NovaBuildNowSettings,store=api.createStore(context.disk,api.normalize);store.update({enabled:{silent:true}});assert.equal(store.read().enabled.silent,true);assert.equal(api.normalize({engine:{walkMultiplier:20}}).engine.walkMultiplier,5);
});

 test('page exit stops restoration before native cleanup announcements without discarding saved intent',()=>{const s=setup();s.restorer.sync({...s.state});s.restorer.stop();const count=s.calls.length;s.state.flight=false;s.state.silent=false;s.state.bodySpin=false;s.restorer.sync({...s.state});assert.equal(s.calls.length,count);assert.equal(s.store.read().enabled.flight,true);assert.equal(s.store.read().enabled.silent,true);});
