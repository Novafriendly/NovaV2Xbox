import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../Public/',import.meta.url),path=new URL('library-added.json',root);
const dates=JSON.parse(await readFile(path,'utf8')),now=new Date().toISOString();let added=0;
for(const [kind,file]of [['game','library-games.json'],['app','library-apps.json']]){
 const introductions=new Map();
 try{const history=execFileSync('git',['log','--reverse','--format=NOVA_ADDED_DATE:%cI','-p','--','Public/'+file],{cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8',maxBuffer:32*1024*1024});let date;
 for(const line of history.split('\n')){if(line.startsWith('NOVA_ADDED_DATE:'))date=line.slice(16).trim();const match=line.match(/^\+\s*"id"\s*:\s*("[^"]+"|\d+)/);if(date&&match){const id=String(JSON.parse(match[1]));if(!introductions.has(id))introductions.set(id,date)}}}catch{}
 const rows=JSON.parse(await readFile(new URL(file,root),'utf8'));
 for(const row of rows){const key=kind+':'+row.id;if(!Object.hasOwn(dates,key)){dates[key]=row.addedAt||introductions.get(String(row.id))||now;added++}}
}
// Keep removed IDs so restoring or updating a title never restarts its badge.
if(added)await writeFile(path,JSON.stringify(dates,null,2)+'\n');
console.log('Library: recorded '+added+' new titles.');
