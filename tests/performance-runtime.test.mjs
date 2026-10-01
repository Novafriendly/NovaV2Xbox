import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('background lifecycle pauses decoration and deduplicates visibility events',()=>{
 const panel={hidden:true},events=[],classes=new Map(),handlers={};let plays=0,pauses=0,observer;
 const video={hidden:false,paused:true,pause(){pauses++;this.paused=true},play(){plays++;this.paused=false;return Promise.resolve()},addEventListener(type,fn){handlers[type]=fn}};
 const document={hidden:false,getElementById:id=>id==='panel'?panel:video,body:{classList:{toggle:(key,value)=>classes.set(key,value)}},addEventListener(type,fn){handlers[type]=fn}};
 const context={document,localStorage:{getItem:()=>null},MutationObserver:class{constructor(fn){observer=fn}observe(){}},addEventListener(type,fn){handlers[type]=fn},dispatchEvent:e=>events.push(e),CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail}}};context.window=context;
 vm.runInNewContext(readFileSync('Public/src/performance-runtime.js','utf8'),context);
 assert.equal(plays,1);panel.hidden=false;observer();assert.equal(pauses,1);assert.equal(classes.get('nova-content-active'),true);
 const count=events.length;observer();assert.equal(events.length,count,'No repeated lifecycle work when state is unchanged');
 panel.hidden=true;observer();assert.equal(plays,2);assert.equal(events.at(-1).detail.visible,true);
 document.hidden=true;handlers.visibilitychange();assert.equal(events.at(-1).detail.visible,false);
 document.hidden=false;handlers.visibilitychange();assert.equal(plays,3);
});
