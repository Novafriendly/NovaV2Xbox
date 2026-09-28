import {cp} from 'node:fs/promises';
import './patch-wisp.mjs';
for(const [pkg,dest] of [['scramjet','scram'],['scramjet-controller','controller'],['scramjet-utils','scram'],['libcurl-transport','clients']])await cp(new URL('../node_modules/@mercuryworkshop/'+pkg+'/dist/',import.meta.url),new URL('../Public/~/sj/'+dest+'/',import.meta.url),{recursive:true});
console.log('Built Neon Arcade pinned connection bundles.');
