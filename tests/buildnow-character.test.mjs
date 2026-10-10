import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {characterGeometry,indexFingerprint,reconstructJoints,createCharacterGeometryCache,characterRuntimeSource} from '../server/buildnow-character.mjs';

const body={lo:[-.42527747,.02813513,-.22794357],hi:[.44231462,1.78612101,.27998880]};
const assets=JSON.parse(readFileSync(new URL('../server/buildnow-character-data.json',import.meta.url),'utf8'));
const almost=(actual,expected,tolerance=1e-5)=>{
  assert.equal(actual.length,expected.length);
  for(let axis=0;axis<actual.length;axis++)assert.ok(Math.abs(actual[axis]-expected[axis])<tolerance,`${actual[axis]} should be within ${tolerance} of ${expected[axis]} at axis ${axis}`);
};

test('humanoid bounds helper excludes flat scenery, accessories and invalid values',()=>{
  assert.equal(characterGeometry(body),true);
  assert.equal(characterGeometry({lo:[-.124,-.007,-.127],hi:[.124,.228,.124]}),false);
  assert.equal(characterGeometry({lo:[0,0,0],hi:[10,.1,10]}),false);
  assert.equal(characterGeometry({lo:[0,0,0],hi:[1,1,1]}),false);
  assert.equal(characterGeometry({lo:[0,0,0],hi:[.8,Infinity,.5]}),false);
  assert.equal(characterGeometry(null),false);
});

test('topology fingerprint canonicalizes index width and covers the complete draw',()=>{
  const values=[0,1,2,3];
  // Standard FNV-1a result for 00 00 00 00 01 00 00 00 02 00 00 00 03 00 00 00.
  assert.equal(indexFingerprint(values),0x00732805);
  assert.equal(indexFingerprint(new Uint8Array(values)),0x00732805);
  assert.equal(indexFingerprint(new Uint16Array(values)),0x00732805);
  assert.equal(indexFingerprint(new Uint32Array(values)),0x00732805);
  assert.notEqual(indexFingerprint([0,1,2,4]),0x00732805);
  assert.notEqual(indexFingerprint([0,1,2,3,0]),0x00732805);
});

function meshFixture(){
  const indices=Array.from({length:12},(_,i)=>i%4);
  return {name:'Fixture body',indexCount:indices.length,indexHash:indexFingerprint(indices),vertexCount:4,
    joints:[{bone:6,name:'Head',parent:5,solvedParent:2,samples:[0,1,2,3],coefficients:[.1,.2,.3,.4]}]};
}

function fakeGL({material=false,truncated=false,wrongIndices=false}={}){
  const program={},position={},indices={},previous={},vao={};
  const positions=new Uint8Array(4*24),pv=new DataView(positions.buffer);
  const rest=[[-.4,0,-.2],[.4,0,.2],[-.4,1.8,.2],[.4,1.8,-.2]];
  const setPositions=(transform=value=>value)=>{for(let vertex=0;vertex<4;vertex++){const value=transform(rest[vertex].slice());for(let axis=0;axis<3;axis++)pv.setFloat32(vertex*24+axis*4,value[axis],true);}};
  setPositions();
  const indexBytes=new Uint8Array(12*2),iv=new DataView(indexBytes.buffer);
  for(let i=0;i<12;i++)iv.setUint16(i*2,i%4,true);
  if(wrongIndices)iv.setUint16(11*2,2,true);
  let array=previous,reads=0,indexReads=0,positionReads=0;
  const names=['hlslcc_mtx4x4unity_ObjectToWorld[0]','hlslcc_mtx4x4unity_MatrixVP[0]',material?'Texture2D_3ac85f0721aa4aaa989cabd727867508':'_DifferentSkin'];
  const gl={ACTIVE_UNIFORMS:1,VERTEX_ATTRIB_ARRAY_ENABLED:2,VERTEX_ATTRIB_ARRAY_BUFFER_BINDING:3,VERTEX_ATTRIB_ARRAY_SIZE:4,
    VERTEX_ATTRIB_ARRAY_TYPE:5,VERTEX_ATTRIB_ARRAY_STRIDE:6,VERTEX_ATTRIB_ARRAY_POINTER:7,VERTEX_ATTRIB_ARRAY_DIVISOR:8,
    ELEMENT_ARRAY_BUFFER_BINDING:9,ARRAY_BUFFER_BINDING:10,VERTEX_ARRAY_BINDING:11,ELEMENT_ARRAY_BUFFER:12,ARRAY_BUFFER:13,BUFFER_SIZE:14,
    FLOAT:5126,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123,UNSIGNED_INT:5125,
    getProgramParameter:()=>names.length,getActiveUniform:(_,i)=>({name:names[i]}),getAttribLocation:(_,name)=>name==='in_POSITION0'?0:-1,
    getVertexAttrib:(_,key)=>({2:true,3:position,4:3,5:5126,6:24,8:0})[key],getVertexAttribOffset:()=>0,
    getParameter:key=>({9:indices,10:array,11:vao})[key],bindBuffer:(target,value)=>{if(target===13)array=value;},
    getBufferParameter:target=>target===12?indexBytes.length:truncated?12:positions.length,
    getBufferSubData:(target,offset,out)=>{reads++;if(target===12)indexReads++;else positionReads++;out.set((target===12?indexBytes:positions).subarray(offset,offset+out.byteLength));}
  };
  return {gl,program,position,indices,previous,setPositions,rest,get reads(){return reads},get indexReads(){return indexReads},get positionReads(){return positionReads},get array(){return array}};
}

const fixtureCatalogue=()=>({meshes:[meshFixture()]});

test('actual topology qualifies across materials and caches its identity per layout',()=>{
  const fixture=fakeGL({material:false}),cache=createCharacterGeometryCache(fixture.gl,fixtureCatalogue());
  const first=cache.classify(fixture.program,12,fixture.gl.UNSIGNED_SHORT,0);
  assert.equal(first.character,true);
  assert.equal(fixture.array,fixture.previous);
  const reads=fixture.reads;
  assert.equal(cache.classify(fixture.program,12,fixture.gl.UNSIGNED_SHORT,0),first);
  assert.equal(fixture.reads,reads,'unchanged draw classification must not read geometry again');
  cache.invalidateBuffer(fixture.position);
  assert.equal(cache.classify(fixture.program,12,fixture.gl.UNSIGNED_SHORT,0).character,true);
  cache.invalidateBuffer(fixture.indices);
  assert.equal(cache.classify(fixture.program,12,fixture.gl.UNSIGNED_SHORT,0).character,true);
  assert.equal(fixture.array,fixture.previous);
});

test('catalogued topology survives raw mesh unit scales instead of relying on humanoid-size heuristics',()=>{
  const fixture=fakeGL();fixture.setPositions(point=>point.map(value=>value*.01));
  const cache=createCharacterGeometryCache(fixture.gl,fixtureCatalogue());
  const classified=cache.classify(fixture.program,12,fixture.gl.UNSIGNED_SHORT,0);
  assert.equal(classified.character,true);
  assert.equal(characterGeometry(classified.bounds),false,'small local units are transformed by the game later');
});

test('unknown counts skip GPU reads while unrelated topology with the same count is rejected',()=>{
  const unknown=fakeGL(),unknownCache=createCharacterGeometryCache(unknown.gl,fixtureCatalogue());
  assert.equal(unknownCache.classify(unknown.program,9,unknown.gl.UNSIGNED_SHORT,0).character,false);
  assert.equal(unknown.reads,0);
  const unrelated=fakeGL({wrongIndices:true}),unrelatedCache=createCharacterGeometryCache(unrelated.gl,fixtureCatalogue());
  assert.equal(unrelatedCache.classify(unrelated.program,12,unrelated.gl.UNSIGNED_SHORT,0).character,false);
  assert.ok(unrelated.indexReads>0);
  assert.equal(unrelated.positionReads,0,'topology mismatch cannot become a pose candidate');
  assert.equal(unrelated.array,unrelated.previous);
});

test('readPose uses current animated vertices without invalidating topology or leaking bindings',()=>{
  const fixture=fakeGL(),cache=createCharacterGeometryCache(fixture.gl,fixtureCatalogue());
  const classified=cache.classify(fixture.program,12,fixture.gl.UNSIGNED_SHORT,0);
  assert.equal(classified.character,true);
  const first=cache.readPose(classified,{joints:true});
  assert.ok(first?.bounds);assert.equal(first.joints.length,1);
  assert.deepEqual({...first.joints[0],position:undefined},{bone:6,name:'Head',parent:2,position:undefined});
  almost(first.joints[0].position,[.08,1.26,0]);
  almost(first.bounds.lo||first.bounds.min,[-.4,0,-.2]);
  almost(first.bounds.hi||first.bounds.max,[.4,1.8,.2]);
  const checks=cache.checks,indexReads=fixture.indexReads;
  fixture.setPositions(([x,y,z])=>[x+2,y+3,z-4]);
  const second=cache.readPose(classified,{joints:true});
  almost(second.joints[0].position,[2.08,4.26,-4]);
  almost(second.bounds.lo||second.bounds.min,[1.6,3,-4.2]);
  almost(second.bounds.hi||second.bounds.max,[2.4,4.8,-3.8]);
  almost(first.joints[0].position,[.08,1.26,0]);
  assert.equal(cache.checks,checks,'animation cannot force a new topology classification');
  assert.equal(fixture.indexReads,indexReads,'pose reads cannot rescan static topology');
  assert.equal(fixture.array,fixture.previous);
});

test('pose read fails closed for a truncated current position buffer and restores bindings',()=>{
  const fixture=fakeGL({truncated:true}),cache=createCharacterGeometryCache(fixture.gl,fixtureCatalogue());
  const classified=cache.classify(fixture.program,12,fixture.gl.UNSIGNED_SHORT,0);
  if(classified.character)assert.equal(cache.readPose(classified,{joints:true}),null);
  else assert.equal(classified.character,false);
  assert.equal(fixture.array,fixture.previous);
});

test('joint reconstruction accepts integer and sample-object indices, and applies solved parents',()=>{
  const mesh=meshFixture(),positions=[[0,0,0],[1,0,0],[0,1,0],[0,0,1]];
  const integer=reconstructJoints(mesh,index=>positions[index]);
  assert.equal(integer.length,1);assert.equal(integer[0].parent,2);
  almost(integer[0].position,[.2,.3,.4]);
  const objects={...mesh,joints:mesh.joints.map(joint=>({...joint,samples:joint.samples.map(index=>({index}))}))};
  const object=reconstructJoints(objects,index=>positions[index]);
  assert.deepEqual(object,integer);
});

test('invalid, missing and out-of-range joint samples are omitted instead of producing fake bones',()=>{
  const base=meshFixture().joints[0];
  const mesh={vertexCount:4,joints:[
    {...base,bone:1,samples:[0],coefficients:[1]},
    {...base,bone:2,samples:[4],coefficients:[1]},
    {...base,bone:3,samples:[-1],coefficients:[1]},
    {...base,bone:4,samples:[1],coefficients:[1]},
    {...base,bone:5,samples:[2],coefficients:[Infinity]},
    {...base,bone:6,samples:[3],coefficients:[1]},
    {...base,bone:7,samples:[.5],coefficients:[1]}
  ]};
  const reconstructed=reconstructJoints(mesh,index=>index===0||index===4||index===-1||index===.5?[1,2,3]:index===1?[NaN,0,0]:index===3?[1,2]:null);
  assert.deepEqual(reconstructed.map(joint=>joint.bone),[1]);
});

test('live pose validation rejects a bone when an independent vertex disagrees or is missing',()=>{
  const mesh=meshFixture();mesh.vertexCount=5;
  mesh.joints[0].validation=[{index:4,coefficients:[.1,.2,.3,.4]}];
  const positions=[[0,0,0],[1,0,0],[0,1,0],[0,0,1],[.2,.3,.4]];
  assert.equal(reconstructJoints(mesh,index=>positions[index],{validate:true}).length,1);
  positions[4]=[2,2,2];
  assert.equal(reconstructJoints(mesh,index=>positions[index],{validate:true}).length,0);
  assert.equal(reconstructJoints(mesh,index=>index===4?null:positions[index],{validate:true}).length,0);
});

for(const name of ['Character_Male_Hoodie','Character_SportyMale_02']){
  test(`${name} asset reconstructs all 18 real joint origins at rest and after rigid motion`,()=>{
    const mesh=assets.meshes.find(mesh=>mesh.name===name);
    assert.ok(mesh,`${name} must be in the shipped game catalogue`);
    assert.equal(mesh.joints.length,18);
    const positions=new Map();
    for(const joint of mesh.joints)for(const sample of joint.samples){
      assert.equal(typeof sample,'object');
      const previous=positions.get(sample.index);
      if(previous)almost(previous,sample.rest,1e-9);
      positions.set(sample.index,sample.rest);
    }
    const rest=reconstructJoints(mesh,index=>positions.get(index));
    assert.equal(rest.length,18);
    for(const actual of rest){
      const expected=mesh.joints.find(joint=>joint.bone===actual.bone);
      assert.equal(actual.name,expected.name);
      assert.equal(actual.parent,expected.solvedParent??expected.parent);
      almost(actual.position,expected.rest);
    }
    const angle=.63,c=Math.cos(angle),s=Math.sin(angle);
    const transform=([x,y,z])=>[c*x-s*z+7,y-2,s*x+c*z+3];
    const moved=reconstructJoints(mesh,index=>{const point=positions.get(index);return point?transform(point):null});
    assert.equal(moved.length,18);
    for(const actual of moved){const expected=mesh.joints.find(joint=>joint.bone===actual.bone);almost(actual.position,transform(expected.rest));}
  });
}

test('serialized browser runtime includes the compact catalogue and reconstructs real samples',()=>{
  const window={};
  vm.runInNewContext(characterRuntimeSource(),{window});
  const api=window.NovaBuildNowCharacters;
  assert.equal(typeof api.createCharacterGeometryCache,'function');
  assert.equal(typeof api.indexFingerprint,'function');
  assert.equal(typeof api.reconstructJoints,'function');
  assert.equal(api.indexFingerprint([0,1,2,3]),0x00732805);
  const mesh=assets.meshes.find(mesh=>mesh.name==='Character_SportyMale_02'),positions=new Map();
  for(const joint of mesh.joints)for(const sample of joint.samples)positions.set(sample.index,sample.rest);
  const reconstructed=api.reconstructJoints(mesh,index=>positions.get(index));
  assert.equal(reconstructed.length,18);
  for(const actual of reconstructed)almost(Array.from(actual.position),mesh.joints.find(joint=>joint.bone===actual.bone).rest);
  assert.ok(characterRuntimeSource().includes(String(mesh.indexHash)),'known topology must be present in the browser catalogue');
});
