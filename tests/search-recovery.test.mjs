import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('search replaces a controller when its service worker changes',async()=>{
 let active={state:'activated'},scripts=0;
 const registration={get active(){return active},addEventListener(){}};
 const sandbox={URL,setTimeout,clearTimeout,location:{origin:'https://nova.example',protocol:'https:'},navigator:{serviceWorker:{register:async()=>registration,getRegistration:async()=>registration}},document:{createElement:()=>({}),head:{append(script){scripts++;queueMicrotask(()=>script.onload())}}},LibcurlTransport:{LibcurlClient:class{init(){return Promise.resolve()}}},$scramjetController:{Controller:class{constructor(options){this.worker=options.serviceworker}wait(){return Promise.resolve()}}}};
 sandbox.window=sandbox;sandbox.isSecureContext=true;vm.runInNewContext(readFileSync('Public/src/connection.js','utf8'),sandbox);
 const first=await sandbox.NovaConnection.create();assert.equal(await sandbox.NovaConnection.ensure(first),first);
 active={state:'activated'};
 const next=await sandbox.NovaConnection.ensure(first);assert.notEqual(next,first);assert.equal(next.worker,active);assert.equal(scripts,4,'Runtime scripts load once, even during recovery');
 active=null;
 sandbox.navigator.serviceWorker.register=async()=>{active={state:'activated'};return registration};
 const restored=await sandbox.NovaConnection.ensure(next);assert.equal(restored.worker,active);assert.notEqual(restored,next);
});
