import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const rules=JSON.parse(fs.readFileSync(new URL('../firebase-voice.rules.json',import.meta.url))).rules.novaStats;
const snap=value=>({exists:()=>value!==null,isNumber:()=>typeof value==='number',val:()=>value});
function check(rule,old,next,auth={uid:'test'},kind='game'){return Function('auth','data','newData','$kind','return ('+rule+')')(auth,snap(old),snap(next),kind)}
test('statistics require sign in without an expiry',()=>{assert.equal(check(rules['.read'],null,null,null),false);assert.equal(check(rules['.read'],null,null),true);assert.equal(rules['.write'],undefined)});
test('visits and game counts only accept increments and preserve totals',()=>{for(const entry of [rules.homeVisits,rules.popular.$kind.$game]){assert.equal(check(entry['.validate'],null,1),true);assert.equal(check(entry['.validate'],190000,190001),true);for(const next of [0,190000,200000,null,'190001'])assert.equal(check(entry['.validate'],190000,next),false);assert.equal(check(entry['.write'],0,1,null),false)}});
test('only game and app counters can be written',()=>{assert.equal(check(rules.popular.$kind.$game['.write'],0,1,{},'cloud'),false);assert.equal(check(rules.popular.$kind.$game['.write'],0,1,{},'app'),true);assert.equal(rules.$other['.validate'],false)});
