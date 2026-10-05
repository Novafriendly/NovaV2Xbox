import {readFile,writeFile} from 'node:fs/promises';
import {mergeGhostCatalog} from './ghost-cloud-catalog.mjs';
const file=new URL('../Public/library-cloud.json',import.meta.url);
const existing=JSON.parse(await readFile(file,'utf8')),source=JSON.parse(await readFile(new URL('./data/ghost-cloud-20261004.json',import.meta.url),'utf8'));
const {games,shared,added}=mergeGhostCatalog(existing,source);await writeFile(file,JSON.stringify(games,null,2)+'\n');console.log(`${source.length} GhostCloud games: ${shared} shared, ${added} new; ${games.length} Nova entries.`);
