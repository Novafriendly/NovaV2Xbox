import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../api/staff-users.js';
async function request({role='owner',banned=false,anonymous=false,exists=true,invalid=false}={}){
 let directoryRead=false;
 const snapshot=v=>({exists:()=>v!==null,val:()=>v});
 const db={ref(path){if(path==='novaAccounts')return {orderByKey(){return this},limitToFirst(){return this},async get(){directoryRead=true;return {forEach(fn){fn({key:'new-uid',val:()=>({name:'New user',photo:'private',preferences:{},createdAt:123})})}}}};return {get:async()=>snapshot(path.startsWith('novaAccounts/')?(exists?{}:null):path.includes('/roles/')?role:banned?true:null)}}};
 const handler=createHandler(async()=>({db,auth:{verifyIdToken:async()=>{if(invalid)throw Error();return {uid:'actor',firebase:{sign_in_provider:anonymous?'anonymous':'password'}}}}}));
 let body;const res={setHeader(){},end(value){body=JSON.parse(value)}};await handler({method:'GET',url:'/api/staff-users',headers:{authorization:'Bearer test'}},res);return {status:res.statusCode,body,directoryRead};
}
test('owner sees only new-account directory fields',async()=>{const r=await request();assert.equal(r.status,200);assert.deepEqual(r.body.users,[{uid:'new-uid',name:'New user',createdAt:123}])});
test('admin can read directory',async()=>assert.equal((await request({role:'admin'})).status,200));
for(const [name,options] of [['member',{role:'member'}],['moderator',{role:'moderator'}],['banned',{banned:true}],['anonymous',{anonymous:true}],['old account',{exists:false}],['invalid token',{invalid:true}]])test(name+' cannot list users',async()=>{const r=await request(options);assert.ok([401,403].includes(r.status));assert.equal(r.directoryRead,false)});
