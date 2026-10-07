import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mergeAchromaCatalog,ACHROMA_PAGE} from '../scripts/achroma-cloud-catalog.mjs';
const load=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const games=await load('Public/library-cloud.json'),pc=await load('scripts/data/achroma-cloud-20261004.json'),mobile=await load('scripts/data/achroma-synapse-20261004.json');
test('all 409 cloud titles map to exact source IDs with no duplicate cards',()=>{
 assert.equal(games.length,493);assert.equal(new Set(games.map(g=>g.id)).size,493);
 for(const [provider,rows] of [['achroma',pc],['synapse',mobile]]){assert.deepEqual(mergeAchromaCatalog(games,rows,provider).games,games);for(const row of rows){const matches=games.filter(g=>g.providers[provider]?.sourceId===(row.game_key||row.id));assert.ok(matches.length);for(const g of matches){assert.equal(g.providers[provider].url,ACHROMA_PAGE);assert.equal(g.providers[provider].name,row.name.trim())}}}
});
test('original identities/providers are preserved and only new titles create cards',()=>{
 const baseline=games.filter(g=>!g.id.startsWith('achroma-')&&!g.id.startsWith('synapse-')).map(g=>({...g,providers:Object.fromEntries(Object.entries(g.providers).filter(([id])=>!['achroma','synapse'].includes(id)))}));
 const first=mergeAchromaCatalog(baseline,pc,'achroma');assert.equal(first.shared,210);assert.equal(first.added,15);
 const second=mergeAchromaCatalog(first.games,mobile,'synapse');assert.equal(second.shared,10);assert.equal(second.added,174);assert.deepEqual(second.games,games);
 assert.throws(()=>mergeAchromaCatalog([], [pc[0],pc[0]],'achroma'),/duplicate/);
 assert.throws(()=>mergeAchromaCatalog([], [{...pc[0],game_key:'../bad'}],'achroma'),/Invalid/);
});

import vm from 'node:vm';
const adapter=await readFile(new URL('../Public/src/achroma-cloud-launch.js',import.meta.url),'utf8');
test('waits for native controls, selects exact key once, and cleans up on playback',()=>{
 let poll,observer,bindings=false,launches=0,ready=0,disconnected=false,cleared=false;
 const mode={dataset:{mode:'local'},querySelector:()=>({click(){if(bindings)mode.dataset.mode='cloud'}})};
 const option={dataset:{source:'Stratus'},classList:{contains:()=>mode.dataset.mode==='cloud'}};
 const card={getAttribute:()=> 'jy0108',click(){launches++}};let live=false;
 const win={Event:class{},MutationObserver:class{constructor(fn){observer=fn}observe(){}disconnect(){disconnected=true}},setTimeout(){return 1},clearTimeout(){},setInterval(fn){poll=fn;return 2},clearInterval(){cleared=true},addEventListener(){},removeEventListener(){}};
 const doc={defaultView:win,head:{append(){}},documentElement:{},createElement:()=>({}),getElementById:id=>id==='mode-toggle'?mode:id==='games-search-input'?{dispatchEvent(){}}:null,querySelectorAll:s=>s==='.source-picker-option'?[option]:[card],querySelector:()=>live?{}:null};
 const window={};vm.runInNewContext(adapter,{window});assert.equal(window.NovaAchromaCloud.attach(doc,{source:'Stratus',sourceId:'jy0108',name:'GTA V'},{onReady:()=>ready++}),true);
 assert.equal(launches,0);bindings=true;poll();poll();observer();assert.equal(launches,1);live=true;poll();assert.equal(ready,1);assert.equal(disconnected,true);assert.equal(cleared,true);
});

test('empty proxy document is not marked attached before cloud controls hydrate',()=>{const window={};vm.runInNewContext(adapter,{window});const doc={getElementById:()=>null};assert.equal(window.NovaAchromaCloud.attach(doc,{source:'Stratus',sourceId:'jy0108'}),false)});
