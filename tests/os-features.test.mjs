import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanSession,inviteText,parseInvite,searchItems} from '../Public/src/os-feature-core.mjs';
import {validateShowcase} from '../server/profile-showcase.mjs';
test('restore filters unsupported apps, caps windows and ignores stale sessions',()=>{
 const now=1000000000;
 assert.deepEqual(cleanSession({version:1,at:now,apps:['chat','chat','invalid','music','search','computer'],game:'cloud:123'},now).apps,['chat','music','search']);
 assert.equal(cleanSession({version:1,at:now-8*86400000,apps:['chat']},now),null);
 assert.equal(cleanSession({version:1,at:now,apps:['javascript:alert(1)'],game:'https://evil.example'},now),null);
});
test('invites identify catalog entries and never arbitrary URLs',()=>{
 assert.equal(parseInvite(inviteText({kind:'cloud',id:'brawl',name:'Brawl Stars'})),'cloud:brawl');
 assert.equal(parseInvite('Nova game invite: https://evil.example\nClick'),null);
 assert.equal(parseInvite('Nova game invite: game:123 extra\nClick'),null);
});
test('command search matches multiple terms and bounds results',()=>{
 const rows=[{name:'Retro Bowl College'},{name:'Retro Bowl'},{name:'Nova Chat'}];
 assert.deepEqual(searchItems(rows,'college retro'),[rows[0]]);
 assert.equal(searchItems(rows,'',2).length,2);
});
test('showcase allows real distinct games, rejects forged games, apps and oversized picks',async()=>{
 const games=async()=>[{key:'game:1'},{key:'cloud:2'},{key:'app:3'}];
 assert.deepEqual(await validateShowcase(['game:1','cloud:2'],games),['game:1','cloud:2']);
 assert.deepEqual(await validateShowcase([],games),[]);
 for(const bad of [['game:unknown'],['app:3'],['game:1','game:1'],['a','b','c','d'],null])await assert.rejects(validateShowcase(bad,games));
});
