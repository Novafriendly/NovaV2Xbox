import {readFile} from 'node:fs/promises';
export const statuses=['unchecked','checking','working','issues','broken'];
let catalog;
export async function gameCatalog(){return catalog??=JSON.parse(await readFile(new URL('../Public/library-games.json',import.meta.url),'utf8'))}
export function publicStatuses(records={},games=[]){const known=new Set(games.map(g=>String(g.id)));return Object.fromEntries(Object.entries(records).filter(([id,v])=>known.has(id)&&v&&statuses.includes(v.status)).map(([id,v])=>[id,{status:v.status,note:typeof v.note==='string'?v.note.slice(0,300):'',updatedAt:Number.isSafeInteger(v.updatedAt)?v.updatedAt:0}]))}
export async function statusUpdate(body,now){const id=String(body.id??'');if(!(await gameCatalog()).some(g=>String(g.id)===id)||!statuses.includes(body.status))throw Error('Choose a valid game and status.');if(typeof body.note!=='string'||body.note.length>300)throw Error('Use a note of up to 300 characters.');return {id,value:{status:body.status,note:body.note.trim(),updatedAt:now}}}
