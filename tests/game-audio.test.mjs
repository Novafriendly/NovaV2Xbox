import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../Public/src/game-audio-inject.js',import.meta.url),'utf8');
test('Web Audio mixer routes game output, changes volume, and preserves disconnect',()=>{
 const calls=[];
 class AudioNode{connect(destination,...ports){calls.push(['connect',this,destination,ports]);return destination}disconnect(...args){calls.push(['disconnect',this,...args])}}
 class AudioDestinationNode extends AudioNode{}
 const context={state:'running',currentTime:4,createGain(){const gain=new AudioNode();gain.context=context;gain.gain={value:1,setValueAtTime(value){this.value=value}};return gain}};
 const destination=new AudioDestinationNode();destination.context=context;
 const window={AudioNode};vm.runInNewContext(source,{window,AudioDestinationNode});
 const a=new AudioNode(),b=new AudioNode();assert.equal(a.connect(destination),destination);b.connect(destination);
 const gain=calls[0][1];assert.equal(calls[1][2],gain);assert.equal(calls[2][2],gain);
 window.__novaAudioMixer.setVolume(.25);assert.equal(gain.gain.value,.25);
 window.__novaAudioMixer.setVolume(0);assert.equal(gain.gain.value,0);
 a.disconnect(destination);assert.equal(calls.at(-1)[2],gain);
 a.disconnect();assert.equal(calls.at(-1).length,2);
 assert.equal(a.connect(b),b);
});
