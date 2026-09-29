import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../api/account-login.js';
const run=async({names={a:{name:'Player'}},password='correct',ready=true}={})=>{
 let issued=false;
 const handler=createHandler(async()=>{if(!ready)throw Error('missing');return {db:{ref:()=>({get:async()=>({val:()=>names})})},auth:{getUser:async()=>({email:'private@example.com'}),createCustomToken:async()=>{issued=true;return 'token'}}}},async(_url,options)=>({ok:JSON.parse(options.body).password==='correct',json:async()=>({localId:'a'})}));
 const res={setHeader(){},end(value){this.body=JSON.parse(value)}};
 await handler({method:'POST',body:{username:' PLAYER ',password}},res);return {res,issued};
};
test('username is case insensitive and returns only a token',async()=>{const {res,issued}=await run();assert.equal(res.statusCode,200);assert.deepEqual(res.body,{token:'token'});assert.ok(issued)});
test('wrong password never issues token',async()=>{const {res,issued}=await run({password:'wrong'});assert.equal(res.statusCode,401);assert.equal(issued,false)});
test('duplicate usernames require email',async()=>{const {res,issued}=await run({names:{a:{name:'Player'},b:{name:'player'}}});assert.equal(res.statusCode,401);assert.equal(issued,false)});
test('missing server credentials reports unavailable',async()=>{assert.equal((await run({ready:false})).res.statusCode,503)});
