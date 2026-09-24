import {readFile,writeFile} from 'node:fs/promises';
// Shared proxy bundles are vendored at the versions recorded in nova-proxy/runtime-versions.json.
for(const file of ['scram/scramjet.js','scram/scramjet.wasm','controller/controller.api.js','controller/controller.sw.js','controller/controller.inject.js','clients/index.js']) await readFile(new URL('../Public/nova-proxy/'+file,import.meta.url));
// Wisp 0.4.1 stores streams in an object; keep its per-host limit working.
const filterPath=new URL('../node_modules/@mercuryworkshop/wisp-js/src/server/filter.mjs',import.meta.url);
let filter=await readFile(filterPath,'utf8');
const brokenLoop='for (let stream of connection.streams) {';
const fixedLoop='for (let stream of Object.values(connection.streams)) {';
if (!filter.includes(brokenLoop) && !filter.includes(fixedLoop)) throw Error('Wisp changed; review stream-limit compatibility patch.');
await writeFile(filterPath,filter.replace(brokenLoop,fixedLoop));
// Keep game launch paths tied to files on disk, not catalog links.
const {readdir}=await import('node:fs/promises');
try {
 const names=await readdir(new URL('../Public/math-tutors-main/',import.meta.url));
 const games={};
 for(const name of names.sort()) { const match=name.match(/^(\d+).*\.html(?:-[a-z]+)?$/i); if(match&&(!games[match[1]]||name===match[1]+'.html'))games[match[1]]=name; }
 await writeFile(new URL('../Public/game-html-files.js',import.meta.url),'// Generated from local HTML filenames.\nwindow.NovaGameHtmlFiles='+JSON.stringify(games,null,2)+';\n');
} catch(error) { if(error.code!=='ENOENT')throw error; }
