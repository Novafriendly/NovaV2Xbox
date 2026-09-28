import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../Public/src/activity-tracker.js',import.meta.url),'utf8');
function fixture(path='/home.html'){const data=new Map([['nova_user','fixture-user']]);let recentCalls=0;const localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};const window={novaRecordGame:()=>recentCalls++};const run=()=>vm.runInNewContext(code,{window,localStorage,location:{pathname:path}});run();return {data,window,run,recentCalls:()=>recentCalls,stats:()=>JSON.parse(data.get('nova-activity-fixture-user')||'{}')}}
test('game launches count separately from unique games and preserve recent-game recording',()=>{const f=fixture();f.window.novaRecordGame({id:'one'});f.window.novaRecordGame({id:'one'});f.window.novaRecordGame({id:'two'});assert.equal(f.stats().launches,3);assert.deepEqual(f.stats().games,['one','two']);assert.equal(f.recentCalls(),3);f.data.set('nova_remember_activity','false');f.window.novaRecordGame({id:'three'});assert.equal(f.stats().launches,3);assert.equal(f.recentCalls(),3)});
test('Search opens count browser sessions and respect activity opt-out',()=>{const f=fixture('/search.html');assert.equal(f.stats().sessions,1);f.run();assert.equal(f.stats().sessions,2);f.data.set('nova_remember_activity','false');f.run();assert.equal(f.stats().sessions,2)});
