import {readFileSync} from 'node:fs';
const characterData=JSON.parse(readFileSync(new URL('./buildnow-character-data.json',import.meta.url),'utf8'));

export function characterGeometry(bounds){
 const lo=bounds?.lo||bounds?.min,hi=bounds?.hi||bounds?.max;if(!lo||!hi||lo.length<3||hi.length<3||![...lo,...hi].every(Number.isFinite))return false;
 const [w,h,d]=hi.map((v,i)=>v-lo[i]);return h>=1.05&&h<=3.2&&w>=.25&&w<=1.8&&d>=.12&&d<=1.35&&h>=w*1.25&&h>=d*1.35;
}
export function isCharacterMaterial(value){return /\bTexture2D_3ac85f0721aa4aaa989cabd727867508\b/.test(Array.isArray(value)?value.join('\n'):String(value||''))}
export function isWorldProgram(value){const text=Array.isArray(value)?value.join('\n'):String(value||'');return /unity_ObjectToWorld/.test(text)&&/unity_MatrixVP/.test(text)}
export function indexFingerprint(indices){let hash=2166136261;for(const index of indices){const value=Number(index)>>>0;for(let shift=0;shift<32;shift+=8)hash=Math.imul(hash^((value>>>shift)&255),16777619)}return hash>>>0}
export function reconstructJoints(mesh,readPosition,{validate=false}={}){
 const joints=[];for(const joint of mesh?.joints||[]){
  const samples=joint.samples||[],coefficients=joint.coefficients||[];if(!samples.length||samples.length!==coefficients.length)continue;
  try{const indices=samples.map(sample=>typeof sample==='number'?sample:sample.index);if(indices.some(index=>!Number.isInteger(index)||index<0||Number.isFinite(mesh.vertexCount)&&index>=mesh.vertexCount))continue;const points=samples.map(sample=>readPosition(typeof sample==='number'?sample:sample.index));if(points.some(p=>!p||p.length<3||!p.every(Number.isFinite))||!coefficients.every(Number.isFinite))continue;
   const sum=weights=>[0,1,2].map(axis=>points.reduce((total,p,i)=>total+p[axis]*weights[i],0));
   const position=sum(coefficients);if(!position.every(Number.isFinite))continue;
   let valid=true;for(const check of validate?joint.validation||[]:[]){if(check.coefficients?.length!==points.length)continue;if(!Number.isInteger(check.index)||check.index<0||Number.isFinite(mesh.vertexCount)&&check.index>=mesh.vertexCount){valid=false;break}const expected=readPosition(check.index),predicted=sum(check.coefficients);if(!expected?.every(Number.isFinite)||Math.hypot(...predicted.map((v,i)=>v-expected[i]))>.015){valid=false;break}}
   if(valid)joints.push({bone:joint.bone,name:joint.name,parent:joint.solvedParent??joint.parent,position});
  }catch{}
 }return joints;
}
export function createCharacterGeometryCache(gl,catalogue=characterData){
 const meshes=catalogue?.meshes||catalogue||[],byCount=new Map();for(const mesh of meshes){const list=byCount.get(mesh.indexCount)||[];list.push(mesh);byCount.set(mesh.indexCount,list)}
 const programs=new WeakMap(),cache=new WeakMap(),records=new WeakMap(),generations=new WeakMap(),ids=new WeakMap();let nextId=1,checks=0;const maximumBytes=2*1024*1024;
 const id=value=>{if(!value||typeof value!=='object')return 0;if(!ids.has(value))ids.set(value,nextId++);return ids.get(value)};
 const rejected=reason=>({character:false,bounds:null,mesh:null,reason});
 function metadata(program){let result=programs.get(program);if(result)return result;const names=[];for(let i=0;i<gl.getProgramParameter(program,gl.ACTIVE_UNIFORMS);i++){const u=gl.getActiveUniform(program,i);if(u)names.push(u.name)}result={world:isWorldProgram(names),position:gl.getAttribLocation(program,'in_POSITION0')};programs.set(program,result);return result}
 function readVertices(record){
  const previous=gl.getParameter(gl.ARRAY_BUFFER_BINDING);try{gl.bindBuffer(gl.ARRAY_BUFFER,record.position);const length=(record.vertexCount-1)*record.stride+12;if(length>maximumBytes||record.pointer+length>gl.getBufferParameter(gl.ARRAY_BUFFER,gl.BUFFER_SIZE))throw Error('Vertex range unavailable.');const bytes=new Uint8Array(length);gl.getBufferSubData(gl.ARRAY_BUFFER,record.pointer,bytes);const view=new DataView(bytes.buffer);
   const read=index=>{if(!Number.isInteger(index)||index<0||index>=record.vertexCount)throw Error('Vertex index unavailable.');const at=index*record.stride;return [0,1,2].map(axis=>view.getFloat32(at+axis*4,true))};
   const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const index of record.used){const p=read(index);if(!p.every(Number.isFinite))throw Error('Invalid vertex.');for(let axis=0;axis<3;axis++){lo[axis]=Math.min(lo[axis],p[axis]);hi[axis]=Math.max(hi[axis],p[axis])}}
   return {read,bounds:{lo,hi,extent:hi.map((v,i)=>v-lo[i])}};
  }finally{gl.bindBuffer(gl.ARRAY_BUFFER,previous)}
 }
 function classify(program,count,type,offset=0){
  if(!program||!Number.isInteger(count)||!byCount.has(count)||!Number.isInteger(offset)||offset<0)return rejected('Not an indexed character body.');
  const info=metadata(program);if(!info.world||info.position<0)return rejected('Not a world body program.');const a=info.position;
  if(!gl.getVertexAttrib(a,gl.VERTEX_ATTRIB_ARRAY_ENABLED))return rejected('Position attribute disabled.');const position=gl.getVertexAttrib(a,gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING),indices=gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);if(!position||!indices)return rejected('Buffers unavailable.');
  const size=gl.getVertexAttrib(a,gl.VERTEX_ATTRIB_ARRAY_SIZE),format=gl.getVertexAttrib(a,gl.VERTEX_ATTRIB_ARRAY_TYPE),stride=gl.getVertexAttrib(a,gl.VERTEX_ATTRIB_ARRAY_STRIDE)||size*4,pointer=gl.getVertexAttribOffset(a,gl.VERTEX_ATTRIB_ARRAY_POINTER),divisor=gl.getVertexAttrib(a,gl.VERTEX_ATTRIB_ARRAY_DIVISOR),bytesPerIndex=type===gl.UNSIGNED_BYTE?1:type===gl.UNSIGNED_SHORT?2:type===gl.UNSIGNED_INT?4:0;
  if(format!==gl.FLOAT||size<3||divisor||!bytesPerIndex||stride<12||!Number.isInteger(pointer)||pointer<0)return rejected('Unsupported body layout.');
  const key=[id(gl.getParameter(gl.VERTEX_ARRAY_BINDING)),id(indices),generations.get(position)||0,generations.get(indices)||0,count,type,offset,size,format,stride,pointer].join(':');let entries=cache.get(position);if(!entries){entries=new Map();cache.set(position,entries)}if(entries.has(key))return entries.get(key);checks++;
  let result;try{const length=count*bytesPerIndex;if(length>maximumBytes||offset+length>gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER,gl.BUFFER_SIZE))throw Error('Index range unavailable.');const bytes=new Uint8Array(length);gl.getBufferSubData(gl.ELEMENT_ARRAY_BUFFER,offset,bytes);const view=new DataView(bytes.buffer),values=Array.from({length:count},(_,i)=>bytesPerIndex===1?view.getUint8(i):bytesPerIndex===2?view.getUint16(i*2,true):view.getUint32(i*4,true)),hash=indexFingerprint(values),mesh=byCount.get(count).find(m=>m.indexHash===hash);
   if(!mesh)result=rejected('Index topology is not a character.');else{const record={position,stride,pointer,vertexCount:mesh.vertexCount,used:[...new Set(values)],mesh};const readback=readVertices(record);result={character:true,bounds:readback.bounds,mesh,reason:'Exact character mesh topology.'};records.set(result,record)}
  }catch(error){result=rejected(error.message||'Body read unavailable.')}if(entries.size>=64)entries.clear();entries.set(key,result);return result;
 }
 function readPose(result,{joints=true}={}){const record=records.get(result);if(!record)return null;try{const readback=readVertices(record);return {bounds:readback.bounds,joints:joints?reconstructJoints(record.mesh,readback.read,{validate:true}):[],headTarget:joints&&record.mesh.headTarget?reconstructJoints({vertexCount:record.mesh.vertexCount,joints:[record.mesh.headTarget]},readback.read,{validate:true})[0]?.position:null}}catch{return null}}
 function invalidateBuffer(buffer){if(!buffer||typeof buffer!=='object')return;generations.set(buffer,(generations.get(buffer)||0)+1);cache.delete(buffer)}
 return {classify,readPose,invalidateBuffer,get checks(){return checks}};
}
export function characterRuntimeSource(){
 const compact={version:characterData.version,meshes:characterData.meshes.map(mesh=>({name:mesh.name,indexCount:mesh.indexCount,indexHash:mesh.indexHash,vertexCount:mesh.vertexCount,headTarget:mesh.headTarget,joints:mesh.joints.map(joint=>({bone:joint.bone,name:joint.name,parent:joint.parent,solvedParent:joint.solvedParent,samples:joint.samples.map(s=>s.index),coefficients:joint.coefficients,validation:joint.validation}))}))};
 return '(()=>{"use strict";const characterData='+JSON.stringify(compact)+';\n'+[characterGeometry,isCharacterMaterial,isWorldProgram,indexFingerprint,reconstructJoints,createCharacterGeometryCache].map(fn=>fn.toString()).join('\n')+'\nwindow.NovaBuildNowCharacters={characterGeometry,isCharacterMaterial,isWorldProgram,indexFingerprint,reconstructJoints,createCharacterGeometryCache};})();';
}
