import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync('Public/content/games/580-f.html','utf8');
test('Traffic Rider downloads known parts in order, retries failures and bounds concurrency',async()=>{
 const source=html.slice(html.indexOf('async function mergeParts'),html.indexOf('async function preMergeAll'));
 let active=0,max=0,blob;const attempts=new Map();
 const context={URL:{createObjectURL:b=>{blob=b;return 'blob:game'}},document:{baseURI:'https://assets.example/'},Blob,Uint8Array,Promise,setTimeout:fn=>{fn()},fetch:async url=>{
  const index=Number(url.split('.part')[1]);attempts.set(index,(attempts.get(index)||0)+1);
  active++;max=Math.max(max,active);await Promise.resolve();active--;
  if(index===2&&attempts.get(index)===1)throw Error('partial file');
  return {ok:true,arrayBuffer:async()=>Uint8Array.of(index).buffer};
 }};
 context.URL=class extends URL {static createObjectURL(b){blob=b;return 'blob:game'}};
 vm.createContext(context);vm.runInContext(source,context);
 assert.equal(await context.mergeParts('Build/y8.data',3),'blob:game');
 assert.deepEqual([...new Uint8Array(await blob.arrayBuffer())],[1,2,3]);
 assert.equal(attempts.get(2),2);assert(max<=2);assert.equal(attempts.size,3);
});
