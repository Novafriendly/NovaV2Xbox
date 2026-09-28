// Local-only UI preview. This module never connects to Firebase.
const data={profiles:{preview:{name:'Nova Preview',joined:Date.now(),photo:''},alex:{name:'Alex',joined:Date.now(),bio:'One more game.'},sam:{name:'Sam',joined:Date.now()}},friends:{preview:{alex:true}},requests:{preview:{sam:{createdAt:Date.now()}}},presence:{preview:{online:true},alex:{online:true,activity:'Retro Bowl'}},roles:{preview:'owner'},bans:{},groups:{}};
const listeners=[];const at=p=>p.split('/').reduce((n,k)=>n?.[k],data);
function update(p,value){const parts=p.split('/');let n=data;for(const k of parts.slice(0,-1))n=n[k]??={};if(value===null)delete n[parts.at(-1)];else n[parts.at(-1)]=value;for(const l of [...listeners])l.fn(at(l.p)||{})}
export async function login(){return {uid:'preview',name:'Nova Preview',email:'preview@example.com',createdAt:Date.now()}}
export async function read(p){return at(p)}
export async function write(p,v){update(p,v)}
export async function patch(v){for(const [p,x]of Object.entries(v))update(p,x)}
export async function del(p){update(p,null)}
export async function send(p,v){update(p+'/'+crypto.randomUUID(),{...v,createdAt:Date.now()})}
export function watch(p,fn){const l={p,fn};listeners.push(l);queueMicrotask(()=>fn(at(p)||{}));return ()=>{const i=listeners.indexOf(l);if(i>=0)listeners.splice(i,1)}}
export async function presence(){return ()=>{}}
export async function saveAccount(uid,name,photo){update('profiles/'+uid,{...at('profiles/'+uid),name,photo})}
export async function resetPassword(){throw Error('Email actions are unavailable in the local preview.')}
export async function claimOwner(){throw Error('This is sample data. Real owner setup requires your signed-in account and server configuration.')}
export const watchGroups=(uid,fn)=>watch('groups',fn);
export async function createGroup(uid,name,members){const id=crypto.randomUUID();update('groups/'+id,{name,owner:uid,members:Object.fromEntries([uid,...members].map(k=>[k,true]))});return id}
