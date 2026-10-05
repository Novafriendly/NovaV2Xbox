import test from 'node:test';
import assert from 'node:assert/strict';
import {sharedActivity,activityImage} from '../Public/src/shared-activity.mjs';
test('privacy clears music and recent games',()=>assert.deepEqual(sharedActivity([{id:1,name:'Game',kind:'game'}],{name:'Song'},false),{recentGames:[],music:null}));
test('only five games and cloud titles are shared, excluding apps',()=>{const data=sharedActivity([{id:'app',name:'App',kind:'app'},...Array.from({length:8},(_,id)=>({id,name:'Game',kind:id%2?'game':'cloud'}))],{name:'Song',artist:'Artist',art:'javascript:bad'});assert.equal(data.recentGames.length,5);assert.equal(data.recentGames[0].id,'0');assert.equal(data.music.art,'');assert.equal(data.music.name,'Song')});
test('unsafe or oversized artwork is rejected',()=>{assert.equal(activityImage('javascript:alert(1)'),'');assert.equal(activityImage('data:text/html;base64,abc'),'');assert.equal(activityImage('https://example.com/'+ 'a'.repeat(60000)),'');assert.equal(activityImage('/Nova12.png'),'/Nova12.png')});
