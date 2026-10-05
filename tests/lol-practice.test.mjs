import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
function fixture(){const window={addEventListener(){},removeEventListener(){}},tasks=new Map(),events=[];let id=0,boot;class KeyboardEvent{constructor(type,options){this.type=type;Object.assign(this,options)}};
 vm.runInNewContext(readFileSync('Public/src/lol-practice.js','utf8'),{window,KeyboardEvent,setInterval:fn=>{boot=fn;return 1},clearInterval(){},addEventListener(){},document:{querySelector:()=>null}});
 const canvas={focus(){},dispatchEvent:e=>events.push(e)};const input=window.NovaLOLPractice.createInput(canvas,{schedule:(fn,ms)=>{const key=++id;tasks.set(key,{fn,ms});return key},cancel:key=>tasks.delete(key)});
 const flush=()=>{for(const [key,t] of [...tasks].sort((a,b)=>a[1].ms-b[1].ms)){if(tasks.has(key)){tasks.delete(key);t.fn();}}};return{api:window.NovaLOLPractice,input,events,tasks,flush,boot};}
test('parses edit sequences and rejects unbounded or unsupported inputs',()=>{const f=fixture();assert.equal(f.api.parse('g, g, space')[2].keyCode,32);for(const value of ['', 'mouse2','g,'.repeat(20)])assert.throws(()=>f.api.parse(value));});
test('macro sends correctly ordered Unity keyboard events',()=>{const f=fixture();f.input.play(f.api.parse('g, g'),100);f.flush();assert.deepEqual(f.events.map(e=>[e.type,e.code,e.keyCode]),[['keydown','KeyG',71],['keyup','KeyG',71],['keydown','KeyG',71],['keyup','KeyG',71]]);});
test('stopping releases held keys and cancels remaining input',()=>{const f=fixture();f.input.play(f.api.parse('g, e'),100);const first=[...f.tasks][0];f.tasks.delete(first[0]);first[1].fn();f.input.stop();f.flush();assert.deepEqual(f.events.map(e=>e.type),['keydown','keyup']);assert.equal(f.tasks.size,0);});
test('starting a new sequence cancels the old sequence',()=>{const f=fixture();f.input.play(f.api.parse('g, e'),100);f.input.play(f.api.parse('q'),100);f.flush();assert.deepEqual(f.events.map(e=>e.code),['KeyG','KeyG','KeyQ','KeyQ']);});
test('panel boot waits for the game load signal and a canvas',()=>{const f=fixture();assert.doesNotThrow(()=>f.boot());const source=readFileSync('Public/src/connection.js','utf8');assert.match(source,/if\(progress === 1\) window\.novaLOLLoaded = true/);assert.match(source,/options\.gameHack===58/);});


test('editor capture guard blocks Unity while preserving native typing defaults',()=>{
 const f=fixture(),listeners=new Map(),field={},outside={};let edits=0;
 const target={addEventListener:(type,fn,capture)=>{assert.equal(capture,true);listeners.set(type,fn)},removeEventListener:type=>listeners.delete(type)};
 const remove=f.api.installEditorGuard(target,()=>({contains:node=>node===field}),()=>edits++);
 for(const type of ['keydown','keyup','keypress','mousedown','pointerdown']){
  let blocked=false,prevented=false;
  listeners.get(type)({type,target:field,stopImmediatePropagation(){blocked=true},preventDefault(){prevented=true}});
  assert.equal(blocked,true);assert.equal(prevented,false);
 }
 assert.equal(edits,2);
 let blocked=false;listeners.get('keydown')({type:'keydown',target:outside,stopImmediatePropagation(){blocked=true}});assert.equal(blocked,false);
 remove();assert.equal(listeners.size,0);
});
test('practice protection is injected before Unity loads',()=>{
 const source=readFileSync('Public/src/connection.js','utf8');
 assert.ok(source.includes("html.replace(/<head>/i,'<head><script>'+script+'</script>')"));
});


test('hold macro repeats complete sequences and release cancels the repeat',()=>{
 const f=fixture();f.input.play(f.api.parse('g'),100,{repeat:true,hold:60});assert.equal(f.events.length,1);f.flush();assert.equal(f.events.length,3);
 f.flush();assert.equal(f.events.length,5);f.input.stop();f.flush();assert.equal(f.events.length,6);assert.equal(f.tasks.size,0);
});
test('mouse selections and modifier keys are accepted in edit sequences',()=>{
 const {api}=fixture(),sequence=api.parse('g, mouse0, g');assert.equal(sequence[1].mouse,true);assert.equal(sequence[1].button,0);assert.equal(api.parse('shift')[0].keyCode,16);
});


test('edit-select-confirm macro routes keyboard and mouse actions through Unity bridge',()=>{
 const window={addEventListener(){},removeEventListener(){}},actions=[],tasks=[];
 window.NovaLOLInput={keyboard:(_canvas,type,key)=>actions.push(type+':'+key.code),mouse:(_canvas,type,options)=>actions.push(type+':'+options.button)};
 vm.runInNewContext(readFileSync('Public/src/lol-practice.js','utf8'),{window,setInterval:()=>1,clearInterval(){},addEventListener(){},document:{querySelector:()=>null}});
 const input=window.NovaLOLPractice.createInput({focus(){}},{schedule:(fn,ms)=>{tasks.push({fn,ms});return tasks.length},cancel(){}});
 input.play(window.NovaLOLPractice.parse('g, mouse0, g'),140,{hold:60});for(const task of tasks.sort((a,b)=>a.ms-b.ms))task.fn();
 assert.deepEqual(actions,['keydown:KeyG','keyup:KeyG','mousedown:0','mouseup:0','keydown:KeyG','keyup:KeyG']);
});


test('edit bind selection supports different users rather than hardcoding Q',()=>{
 const {api}=fixture();assert.deepEqual(Array.from(api.editSequence('q','q'),key=>key.code),['KeyQ','mouse0','KeyQ']);
 assert.deepEqual(Array.from(api.editSequence('e','f','mouse1'),key=>key.code),['KeyE','mouse1','KeyF']);
 assert.throws(()=>api.editSequence('q,g','q'));assert.throws(()=>api.editSequence('invalid','q'));
});
