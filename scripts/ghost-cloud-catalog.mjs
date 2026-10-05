import {normalizeCloudTitle} from './cloud-catalog.mjs';
export const GHOST_ORIGIN='https://ghost-mathmulti.zeoghost.workers.dev';
export function mergeGhostCatalog(existing,source){
 const games=existing.filter(g=>!String(g.id).startsWith('ghost-')||Object.keys(g.providers||{}).some(p=>p!=='ghost')).map(g=>{const providers={...(g.providers||{astra:{url:g.url,name:g.name,sourceOccurrence:g.sourceOccurrence}})};delete providers.ghost;return {...g,providers}});
 const seen=new Set();let shared=0,added=0;
 for(const entry of source){const id=entry.game_key,name=String(entry.name||'').trim();if(!/^[a-zA-Z]{2}\d+$/.test(id)||!name||seen.has(id))throw Error('Invalid or duplicate GhostCloud game.');seen.add(id);
 const url=new URL('/',GHOST_ORIGIN);url.searchParams.set('play',id);const provider={url:url.href,name,sourceId:id};
 const keyed=games.filter(g=>g.id===id||Object.values(g.providers).some(p=>p.sourceId===id));const matches=keyed.length?keyed:games.filter(g=>normalizeCloudTitle(g.name)===normalizeCloudTitle(name));
 if(matches.length){for(const game of matches)game.providers.ghost=provider;shared++}
 else {const cover=new URL(entry.cover||entry.image);if(cover.protocol!=='https:')throw Error('Invalid GhostCloud cover.');games.push({id:'ghost-'+id,name,art:cover.href,url:url.href,kind:'cloud',sourceArt:cover.href,providers:{ghost:provider}});added++}
 }
 if(new Set(games.map(g=>g.id)).size!==games.length)throw Error('Cloud catalog IDs must remain unique.');return {games,shared,added};
}
