import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function visual(){const window={};vm.runInNewContext(readFileSync(new URL('../server/buildnow-visual.js',import.meta.url),'utf8'),{window});return window.NovaLOLVisual;}

test('player overlay formats actual stats, zero values, and unavailable data distinctly',()=>{
 const lines=visual().playerInfoLines;
 assert.deepEqual([...lines({name:'Player One',health:100,shield:0})],['Player One','HP 100 · Shield 0']);
 assert.deepEqual([...lines({source:'training',health:35.7,shield:null})],['Training bot','HP 36 · Shield —']);
 assert.deepEqual([...lines(null)],['Player','HP — · Shield —']);
 for(const value of [NaN,Infinity,-1,29000000,'100'])assert.match(lines({health:value,shield:value})[1],/^HP — · Shield —$/);
});

test('player labels retain Unicode and bound names without interpreting markup',()=>{
 const lines=visual().playerInfoLines;
 assert.equal(lines({name:'  玩家 💜\nOne\0  ',health:100})[0],'玩家 💜One');
 assert.equal(lines({name:'x'.repeat(200)})[0].length,42);
 assert.equal(lines({name:'<img src=x onerror=alert(1)>'})[0],'<img src=x onerror=alert(1)>');
});

 test('extra ESP details use only finite health, shield and player distance',()=>{const api=visual();const known=api.espDetails({health:75,shield:20,distance:12.7});assert.equal(known.healthRatio,.75);assert.equal(known.shieldRatio,.2);assert.equal(known.distanceLabel,'13 m');const missing=api.espDetails({health:NaN,shield:'100',distance:-1});assert.equal(missing.healthRatio,null);assert.equal(missing.shieldRatio,null);assert.equal(missing.distanceLabel,'');});
