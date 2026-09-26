import {readFile,writeFile} from 'node:fs/promises';
const entry=import.meta.resolve('@mercuryworkshop/wisp-js/server');
const file=new URL('../server/filter.mjs',entry);
const source=await readFile(file,'utf8');
// Wisp 0.4.1 stores streams in an object, but its per-host limiter iterates it as an array.
if(source.includes('for (let stream of connection.streams)')){
 await writeFile(file,source.replace('for (let stream of connection.streams)','for (let stream of Object.values(connection.streams))'));
 console.log('Applied Wisp 0.4.1 stream-limit compatibility fix.');
}else if(!source.includes('Object.values(connection.streams)'))throw Error('Unexpected Wisp version; review the stream-limit compatibility fix.');
