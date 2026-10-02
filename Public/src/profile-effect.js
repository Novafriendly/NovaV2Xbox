// Set the APNG's native play count; no timers or per-frame JavaScript rendering.
export function twiceAnimatedPNG(buffer){
 const bytes=new Uint8Array(buffer.slice(0)),view=new DataView(bytes.buffer);
 if(bytes.length<8||[137,80,78,71,13,10,26,10].some((n,i)=>bytes[i]!==n))return bytes;
 for(let offset=8;offset+12<=bytes.length;){
  const length=view.getUint32(offset),end=offset+12+length;if(end>bytes.length)break;
  if(length===8&&String.fromCharCode(...bytes.subarray(offset+4,offset+8))==='acTL'){
   view.setUint32(offset+12,2);
   let crc=0xffffffff;
   for(let i=offset+4;i<offset+8+length;i++){crc^=bytes[i];for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
   view.setUint32(offset+8+length,(crc^0xffffffff)>>>0);break;
  }
  offset=end;
 }
 return bytes;
}
// Retain only the latest effect's bytes, not the entire cosmetics collection.
let latestSource,latestBytes;
export async function playProfileEffect(image,source){
 try{
  if(latestSource!==source){latestSource=source;latestBytes=fetch(source).then(r=>{if(!r.ok)throw Error('Effect unavailable');return r.arrayBuffer()}).then(twiceAnimatedPNG);}
  const bytes=await latestBytes;
  // A distinct object URL starts a fresh animation for every profile view.
  const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
  const release=()=>URL.revokeObjectURL(url);
  image.addEventListener('load',release,{once:true});image.addEventListener('error',release,{once:true});image.src=url;
 }catch{if(latestSource===source){latestSource=undefined;latestBytes=undefined;}image.remove();}
}
