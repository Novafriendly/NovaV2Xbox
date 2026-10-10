import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime} from './buildnow-engine-fixture.mjs';

// Catalogue, manager, and inventory below are synthetic native fixtures.
const catalogueIds=[4,0,6,1,2,5,3,7,8,9,10];
function loadoutFixture({ids=catalogueIds,maximum=5}={}){
  const fixture=runtime(),words=new Uint32Array(fixture.memory.buffer),bytes=new Uint8Array(fixture.memory.buffer),put=fixture.writeWord;
  const manager=44000,library=44100,list=44200,array=44300,records=new Map(),queries=[],addCalls=[],freeCalls=[],events=[];
  const classes={GameManager:[41000,43000,33554550],AllItemsLibrary:[41200,43064,33556890],WeaponItem:[41400,43128,33556604],WeaponDataObject:[41600,43192,33556497],WeaponData:[41800,43256,33556502],RaycastWeapon:[42000,43320,33556484],'List`1':[42200,43384,0],MiniShield:[42400,43448,33556464],Pickaxe:[42600,43512,33556477],BuildHands:[42800,43576,33556475]};
  const object=(pointer,type)=>{const [klass,name,token]=classes[type];fixture.component(pointer,klass,name,type,token);if(['MiniShield','Pickaxe','BuildHands'].includes(type))put(klass+44,classes.RaycastWeapon[0]);};
  object(manager,'GameManager');object(library,'AllItemsLibrary');object(list,'List`1');put(manager+24,library);put(manager+60,fixture.own);put(manager+64,fixture.weapons);
  put(fixture.weapons+108,maximum);put(fixture.weapons+84,list);put(list+8,array);put(list+12,Math.max(0,Math.min(16,maximum)));put(array+12,16);put(fixture.weapons+80,0);
  for(const id of ids){const base=45000+id*512,item=base,dataObject=base+80,data=base+128,prefab=base+256;object(item,'WeaponItem');object(dataObject,'WeaponDataObject');object(data,'WeaponData');object(prefab,'RaycastWeapon');put(item+44,id);put(item+36,1);put(item+56,dataObject);put(dataObject+12,data);put(data+8,prefab);records.set(id,{id,item,dataObject,data,prefab});}
  const inventory=()=>Array.from({length:words[(list+12)>>>2]},(_,index)=>words[(array+16+index*4)>>>2]);
  const firstFree=()=>inventory().findIndex(pointer=>!pointer);
  const insert=(index,id,{type='RaycastWeapon',owner=fixture.weapons,local=false,dataObject=records.get(id)?.dataObject}={})=>{const pointer=52000+index*256;object(pointer,type);put(pointer+16,dataObject||0);put(pointer+140,owner);fixture.writeByte(pointer+157,local?1:0);put(array+16+index*4,pointer);return pointer;};
  const options={freeAvailable:true,forcedFree:null,commitLimit:Infinity,addMode:'commit'},mouse=[],stops=[];
  fixture.method(20231,()=>manager);
  fixture.method(33461,(source,id)=>{assert.equal(source,library);queries.push(id);return records.get(id)?.item||0;});
  fixture.method(31125,(weapons,out)=>{assert.equal(weapons,fixture.weapons);const index=options.forcedFree??firstFree();freeCalls.push(index);put(out,index);return options.freeAvailable&&index>=0?1:0;});
  fixture.method(31119,(weapons,item,pickup)=>{
    assert.equal(weapons,fixture.weapons);assert.deepEqual([...bytes.subarray(pickup,pickup+8)],[0,0,0,0,0,0,0,0],'native pickup payload uses the supported empty value');
    const id=words[(item+44)>>>2];addCalls.push(id);events.push('add:'+id);
    if(addCalls.length>options.commitLimit||options.addMode==='noChange')return;
    if(options.addMode==='countOnly'){put(list+12,words[(list+12)>>>2]+1);return;}
    const index=firstFree();if(index<0)return;
    insert(index,id,{owner:options.addMode==='wrongOwner'?22000:fixture.weapons,dataObject:options.addMode==='wrongData'?0:words[(item+56)>>>2]});
  });
  fixture.method(31009,weapon=>{stops.push(weapon);events.push('stop');});
  fixture.window.NovaLOLInput={mouse:(canvas,type,options)=>{mouse.push({id:canvas.id,type,...options});events.push(type);}};
  return {...fixture,manager,library,list,array,records,classes,queries,addCalls,freeCalls,events,options,mouse,stops,object,inventory,insert};
}

test('training loadout requires a living owned offline avatar and its current manager identity',async()=>{
  const unloaded=loadoutFixture();assert.throws(()=>unloaded.api.equipTrainingGuns(),/still loading/);
  for(const corrupt of [
    fixture=>fixture.setOffline(false),
    fixture=>fixture.writeByte(fixture.own+1331,1),
    fixture=>fixture.method(41757,()=>0),
    fixture=>fixture.writeWord(fixture.manager+60,fixture.opponent),
    fixture=>fixture.writeWord(fixture.manager+64,22000),
    fixture=>fixture.writeWord(fixture.classes.GameManager[0]+164,0),
  ]){const fixture=loadoutFixture();await fixture.load();corrupt(fixture);assert.throws(()=>fixture.api.equipTrainingGuns(),/offline|living|controller|loadout|world/i);assert.equal(fixture.addCalls.length,0);assert.equal(fixture.queries.length,0);}
});

test('training loadout validates capacity and the catalogue before native gun additions',async()=>{
  for(const maximum of [0,17,0xffffffff]){const fixture=loadoutFixture({maximum});await fixture.load();assert.throws(()=>fixture.api.equipTrainingGuns(),/loadout is unavailable/);assert.equal(fixture.addCalls.length,0);}
  const fixture=loadoutFixture();await fixture.load();fixture.writeWord(fixture.manager+24,fixture.own);assert.throws(()=>fixture.api.equipTrainingGuns(),/catalogue is unavailable/);assert.equal(fixture.addCalls.length,0);
});

test('native training additions use validated catalogue guns and cold owned inventory objects',async()=>{
  const fixture=loadoutFixture({maximum:3});await fixture.load();const result=fixture.api.equipTrainingGuns();
  assert.equal(result.addedGuns,3);assert.equal(result.availableGuns,3);assert.deepEqual(fixture.addCalls,[4,0,6]);assert.match(result.message,/Added 3 training guns/);
  const words=new Uint32Array(fixture.memory.buffer);fixture.inventory().forEach((weapon,index)=>{assert.equal(words[(weapon+140)>>>2],fixture.weapons);assert.equal(words[(weapon+16)>>>2],fixture.records.get(fixture.addCalls[index]).dataObject);assert.equal(new Uint8Array(fixture.memory.buffer)[weapon+157],0,'equipping does not forge native IsMine initialization');});
  assert.equal(fixture.mouse.length,0,'equipping alone does not fire');assert.equal(fixture.api.snapshot().availableGuns,3);
});

test('wrong catalogue IDs, categories, data classes, and tool prefabs never authorize additions',async()=>{
  for(const invalidate of [
    fixture=>fixture.writeWord(fixture.records.get(4).item+44,0),
    fixture=>fixture.writeWord(fixture.records.get(4).item+36,0),
    fixture=>fixture.writeWord(fixture.classes.WeaponItem[0]+164,0),
    fixture=>fixture.writeWord(fixture.records.get(4).item+56,fixture.own),
    fixture=>fixture.writeWord(fixture.classes.WeaponDataObject[0]+164,0),
    fixture=>fixture.writeWord(fixture.records.get(4).dataObject+12,fixture.own),
    fixture=>fixture.writeWord(fixture.classes.WeaponData[0]+164,0),
    fixture=>fixture.writeWord(fixture.records.get(4).data+8,fixture.own),
    fixture=>fixture.object(fixture.records.get(4).prefab,'MiniShield'),
    fixture=>fixture.object(fixture.records.get(4).prefab,'Pickaxe'),
    fixture=>fixture.object(fixture.records.get(4).prefab,'BuildHands'),
  ]){const fixture=loadoutFixture({ids:[4]});await fixture.load();invalidate(fixture);const result=fixture.api.equipTrainingGuns();assert.equal(result.addedGuns,0);assert.equal(result.availableGuns,0);assert.equal(fixture.addCalls.length,0);assert.doesNotMatch(result.message,/^Added/);}
});

test('duplicate gun data is skipped in existing loadouts and repeated catalogue entries',async()=>{
  const fixture=loadoutFixture({maximum:3});await fixture.load();fixture.insert(0,4);const result=fixture.api.equipTrainingGuns();assert.equal(result.addedGuns,2);assert.equal(result.availableGuns,3);assert.deepEqual(fixture.addCalls,[0,6],'the existing gun is retained once');
  const alias=loadoutFixture({ids:[4,0],maximum:3});await alias.load();alias.writeWord(alias.records.get(0).item+56,alias.records.get(4).dataObject);const aliased=alias.api.equipTrainingGuns();assert.equal(aliased.addedGuns,1);assert.equal(aliased.availableGuns,1);assert.deepEqual(alias.addCalls,[4],'matching catalogue data cannot create a second copy');
});

test('physical free slots limit training additions and preserve occupied tool slots',async()=>{
  const fixture=loadoutFixture();await fixture.load();const existing=fixture.insert(0,4),tool1=fixture.insert(1,0,{type:'MiniShield'}),tool2=fixture.insert(3,6,{type:'BuildHands'});
  const result=fixture.api.equipTrainingGuns();assert.equal(result.addedGuns,2);assert.equal(result.availableGuns,3);assert.deepEqual(fixture.addCalls,[0,6]);assert.deepEqual(fixture.freeCalls,[2,4,-1]);assert.equal(fixture.inventory()[0],existing);assert.equal(fixture.inventory()[1],tool1);assert.equal(fixture.inventory()[3],tool2);
  const occupied=loadoutFixture();await occupied.load();occupied.inventory().forEach((_,index)=>occupied.insert(index,4,{type:'MiniShield'}));const unchanged=occupied.api.equipTrainingGuns();assert.equal(unchanged.addedGuns,0);assert.equal(unchanged.availableGuns,0);assert.equal(occupied.addCalls.length,0,'non-gun occupancy cannot be overwritten to satisfy a gun count');
});

test('native free-slot indices outside capacity or reserved for tools are rejected',async()=>{
  for(const forcedFree of [7,8,10,0xffffffff]){const fixture=loadoutFixture({maximum:10});await fixture.load();fixture.options.forcedFree=forcedFree;const result=fixture.api.equipTrainingGuns();assert.equal(result.addedGuns,0);assert.equal(fixture.addCalls.length,0);}
  const fixture=loadoutFixture();await fixture.load();fixture.options.freeAvailable=false;const result=fixture.api.equipTrainingGuns();assert.equal(result.addedGuns,0);assert.equal(fixture.addCalls.length,0);
});

test('a full gun inventory is reported without additional native calls',async()=>{
  const fixture=loadoutFixture();await fixture.load();catalogueIds.slice(0,5).forEach((id,index)=>fixture.insert(index,id));const result=fixture.api.equipTrainingGuns();assert.equal(result.addedGuns,0);assert.equal(result.availableGuns,5);assert.match(result.message,/loadout is full/);assert.equal(fixture.queries.length,0);assert.equal(fixture.freeCalls.length,0);assert.equal(fixture.addCalls.length,0);
});

test('an AddWeapon call cannot claim success unless verified owned inventory actually changes',async()=>{
  for(const addMode of ['noChange','wrongOwner','wrongData','countOnly']){const fixture=loadoutFixture({ids:[4],maximum:3});await fixture.load();fixture.options.addMode=addMode;assert.throws(()=>fixture.api.equipTrainingGuns(),/has not added the gun|loadout is ready/i);assert.deepEqual(fixture.addCalls,[4]);assert.doesNotMatch(fixture.api.snapshot().message,/^Added/);}
  const partial=loadoutFixture({maximum:3});await partial.load();partial.options.commitLimit=1;const result=partial.api.equipTrainingGuns();assert.equal(result.addedGuns,1);assert.equal(result.availableGuns,1);assert.deepEqual(partial.addCalls,[4,0]);assert.match(result.message,/Added 1 training guns/,'partial success is counted from completed inventory updates only');
});

test('equipping training guns releases existing automatic fire before adding to the loadout',async()=>{
  const fixture=loadoutFixture({maximum:3});await fixture.load();const equipped=fixture.insert(0,4,{local:true});fixture.writeWord(fixture.weapons+80,equipped);fixture.api.setWeaponCycleOptions({fire:true});fixture.api.setWeaponCycle(true);fixture.dispatch(1);assert.equal(fixture.mouse.at(-1).type,'mousedown');
  const result=fixture.api.equipTrainingGuns();assert.equal(result.addedGuns,2);assert.equal(fixture.mouse.at(-1).type,'mouseup');assert.equal(fixture.stops.at(-1),equipped);assert(fixture.events.indexOf('mouseup')<fixture.events.findIndex(event=>event.startsWith('add:')));assert.equal(fixture.window.NovaLOLVisual.state.weaponCycleFire,false);
});
