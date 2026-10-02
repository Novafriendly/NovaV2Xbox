import {readFile,mkdir,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const {version}=JSON.parse(await readFile(new URL('../remote-agent/package.json',import.meta.url),'utf8'));
const data=await readFile(new URL('../remote-agent/dist/NovaRemote.exe',import.meta.url)),destination=new URL('../Public/downloads/',import.meta.url);await mkdir(destination,{recursive:true});const parts=[];
for(let offset=0,index=1;offset<data.length;offset+=56000000,index++){const bytes=data.subarray(offset,offset+56000000),file='NovaRemote.part'+index+'.bin';await writeFile(new URL(file,destination),bytes);parts.push({file,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
await writeFile(new URL('nova-remote.json',destination),JSON.stringify({version,filename:'NovaRemote.exe',size:data.length,parts},null,2)+'\n');console.log('Packaged Nova Remote download with verified chunks.');
