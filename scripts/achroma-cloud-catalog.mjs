import {createHash} from 'node:crypto';
import {normalizeCloudTitle} from './cloud-catalog.mjs';
const titleKey=name=>normalizeCloudTitle(name)||String(name).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export const ACHROMA_PAGE='https://cdn.jsdelivr.net/gh/achroma-ubg/svg@latest/pages/games.html';
export function mergeAchromaCatalog(existing,rows,provider){
 if(!['achroma','synapse'].includes(provider))throw Error('Unknown Achroma provider');
 const games=existing.map(g=>({...g,providers:{...g.providers}}));const seen=new Set();let shared=0,added=0;
 for(const row of rows){const sourceId=provider==='achroma'?row.game_key:row.id,name=String(row.name||'').trim();
  if(!name||typeof sourceId!=='string'||!(provider==='achroma'?/^[a-zA-Z]{2}\d+$/:/^[a-zA-Z0-9_.-]+$/).test(sourceId)||seen.has(sourceId))throw Error('Invalid or duplicate source game');seen.add(sourceId);
  const metadata={url:ACHROMA_PAGE,name,sourceId,source:provider==='achroma'?'Stratus':'Synapse'};
  const keyed=games.filter(g=>g.id===sourceId||Object.entries(g.providers).some(([p,v])=>p===provider&&v.sourceId===sourceId||provider==='achroma'&&['gsn','ghost'].includes(p)&&v.sourceId===sourceId));
  const matches=keyed.length?keyed:games.filter(g=>titleKey(g.name)===titleKey(name)&&(!g.providers[provider]||g.providers[provider].sourceId===sourceId));
  if(matches.length){for(const g of matches)g.providers[provider]=metadata;shared++;continue}
  const sourceArt=new URL(row.image,'https://bikesense.org').href;if(!sourceArt.startsWith('https://'))throw Error('Invalid source cover');
  const id=provider+'-'+(provider==='achroma'?sourceId:createHash('sha256').update(sourceId).digest('hex').slice(0,16));
  games.push({id,name,art:'cloud-covers/'+id+'.webp',url:ACHROMA_PAGE,kind:'cloud',sourceArt,providers:{[provider]:metadata}});added++;
 }
 if(new Set(games.map(g=>g.id)).size!==games.length)throw Error('Duplicate catalog identity');
 return {games,shared,added};
}
