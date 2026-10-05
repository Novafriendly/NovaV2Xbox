import {readFile,writeFile} from 'node:fs/promises';
import {mergeAchromaCatalog} from './achroma-cloud-catalog.mjs';
const file=new URL('../Public/library-cloud.json',import.meta.url);let games=JSON.parse(await readFile(file,'utf8'));
for(const [provider,name] of [['achroma','cloud'],['synapse','synapse']]){const rows=JSON.parse(await readFile(new URL('./data/achroma-'+name+'-20261004.json',import.meta.url),'utf8'));const result=mergeAchromaCatalog(games,rows,provider);games=result.games;console.log(provider+': '+rows.length+' titles, '+result.shared+' shared, '+result.added+' new');}
await writeFile(file,JSON.stringify(games,null,2)+'\n');console.log(games.length+' unique Nova cloud cards');
