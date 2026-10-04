import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync('Public/src/game-hack-inject.js','utf8');
const bowl='RetroBowl.0.savedata.ini',college='RetroBowlCollege.0.savedata.ini';
function run(values=new Map(),answers=[],baseKey=bowl,token='apply-1'){
 const alerts=[],questions=[];let reloads=0;
 const element=()=>({style:{},append(){},setAttribute(){},remove(){}});
 vm.runInNewContext(source.replace('__NOVA_SAVE_KEY__',JSON.stringify(baseKey)).replace('__NOVA_APPLY_TOKEN__',JSON.stringify(token)),{
 document:{readyState:'complete',createElement:element,body:{append(){}}},setTimeout:fn=>fn(),
 localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},
 prompt:q=>{questions.push(q);return answers.shift()??null},alert:s=>alerts.push(s),location:{reload(){reloads++}}
 });return {values,alerts,questions,reloads};
}
test('detects actual slot filenames and updates only the selected save',()=>{
 const first='team="Nova"\ncoach_credit="12"',second='season="2"\ncoach_credit="30"';
 const key='RetroBowl.0.savedata2.ini',values=new Map([[bowl,first],[key,second]]);
 const r=run(values,['2','500']);assert.match(r.questions[0],/1, 2/);
 assert.equal(values.get(bowl),first);assert.equal(values.get(key),second.replace('"30"','"500"'));
 assert.equal(values.get(key+'.nova-backup'),second);assert.equal(r.reloads,1);
});
test('detects slot five without relying on storage enumeration',()=>{
 const key='RetroBowl.0.savedata5.ini',r=run(new Map([[key,'coach_credit="1"']]),['5','999999999999']);
 assert.equal(r.values.get(key),'coach_credit="999999999999"');assert.equal(r.reloads,1);
});
test('College asks only for credits',()=>{
 const r=run(new Map([[college,'coach_credit="12"']]),['500'],college);
 assert.deepEqual(r.questions,['How many credits do you want?']);assert.equal(r.values.get(college),'coach_credit="500"');
});
test('missing saves, invalid choices, invalid credits and cancellation preserve progress',()=>{
 assert.equal(run().reloads,0);
 for(const answers of [[null],['2'],['1',null],['1','abc'],['1','1000000000000']]){
 const r=run(new Map([[bowl,'coach_credit="12"']]),answers);
 assert.equal(r.values.get(bowl),'coach_credit="12"');assert.equal(r.reloads,0);assert.equal(r.values.has(bowl+'.nova-backup'),false);
 }
});
test('Apply again detects newly created saves while reload does not repeat injection',()=>{
 const values=new Map();assert.equal(run(values).alerts.length,1);
 values.set('RetroBowl.0.savedata2.ini','coach_credit="10"');
 assert.equal(run(values,['2','100']).questions.length,0);
 const r=run(values,['2','100'],bowl,'apply-2');assert.equal(r.reloads,1);
 assert.equal(values.get('RetroBowl.0.savedata2.ini'),'coach_credit="100"');
});
