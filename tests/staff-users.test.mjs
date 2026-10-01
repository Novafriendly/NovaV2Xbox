import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../api/staff-users.js';
async function request({role='owner',banned=false,anonymous=false,exists=true,invalid=false,accounts={'new-uid':{name:'New user',photo:'private',preferences:{},createdAt:123}},progress={},after=''}={}){
 let directoryRead=false,progressRead=false,progressRange;
 const snapshot=v=>({exists:()=>v!==null,val:()=>v,forEach(fn){for(const [key,value]of Object.entries(v||{}))fn({key,val:()=>value})}});
 const db={ref(path){
  if(path==='novaAccounts'||path==='novaControl/progress'){
   let first,last,cursor,limit=Infinity;
   return {orderByKey(){return this},limitToFirst(n){limit=n;return this},startAfter(value){cursor=value;return this},startAt(value){first=value;return this},endAt(value){last=value;return this},async get(){
    if(path==='novaAccounts')directoryRead=true;else{progressRead=true;progressRange=[first,last];}
    const rows=Object.entries(path==='novaAccounts'?accounts:progress).sort(([a],[b])=>a.localeCompare(b)).filter(([key])=>(!cursor||key>cursor)&&(!first||key>=first)&&(!last||key<=last)).slice(0,limit);
    return snapshot(Object.fromEntries(rows));
   }};
  }
  return {get:async()=>snapshot(path.startsWith('novaAccounts/')?(exists?{}:null):path.includes('/roles/')?role:banned?true:null)};
 }};
 const handler=createHandler(async()=>({db,auth:{verifyIdToken:async()=>{if(invalid)throw Error();return {uid:'actor',firebase:{sign_in_provider:anonymous?'anonymous':'password'}}}}}));
 let body;const res={setHeader(){},end(value){body=JSON.parse(value)}};await handler({method:'GET',url:'/api/staff-users'+(after?'?after='+encodeURIComponent(after):''),headers:{authorization:'Bearer test'}},res);return {status:res.statusCode,body,directoryRead,progressRead,progressRange};
}
test('owner sees only directory fields and initialized player totals',async()=>{const r=await request();assert.equal(r.status,200);assert.deepEqual(r.body.users,[{uid:'new-uid',name:'New user',createdAt:123,coins:0,level:1}])});
test('admin sees saved coins and the current level derived from XP, excluding private progress fields',async()=>{
 const r=await request({role:'admin',progress:{'new-uid':{coins:95111,xp:5382,challenges:['private'],redeemed:{secret:1}},outside:{coins:99999,xp:99999}}});
 assert.equal(r.status,200);assert.deepEqual(r.body.users,[{uid:'new-uid',name:'New user',createdAt:123,coins:95111,level:6}]);assert.deepEqual(r.progressRange,['new-uid','new-uid']);assert.equal(JSON.stringify(r.body).includes('private'),false);
});
for(const [name,options] of [['member',{role:'member'}],['moderator',{role:'moderator'}],['banned',{banned:true}],['anonymous',{anonymous:true}],['old account',{exists:false}],['invalid token',{invalid:true}]])test(name+' cannot list users or progress',async()=>{const r=await request(options);assert.ok([401,403].includes(r.status));assert.equal(r.directoryRead,false);assert.equal(r.progressRead,false)});
test('all account pages remain reachable and progress reads stay inside each page',async()=>{
 const accounts=Object.fromEntries(Array.from({length:102},(_,i)=>['u'+String(i).padStart(3,'0'),{name:'Player '+i}])),progress={u099:{coins:250,xp:500},u100:{coins:1250,xp:1249.9},u101:{coins:555,xp:1250}};
 const first=await request({accounts,progress});assert.equal(first.body.users.length,100);assert.equal(first.body.next,'u099');assert.deepEqual(first.progressRange,['u000','u099']);assert.equal(first.body.users.at(-1).level,2);
 const second=await request({accounts,progress,after:first.body.next});assert.equal(second.body.users.length,2);assert.equal(second.body.next,null);assert.deepEqual(second.progressRange,['u100','u101']);assert.equal(second.body.users[0].level,2);assert.equal(second.body.users[1].level,3);assert.equal(second.body.users[1].coins,555);
});
test('an empty account page does not load economy records',async()=>{const r=await request({accounts:{}});assert.equal(r.status,200);assert.deepEqual(r.body.users,[]);assert.equal(r.progressRead,false)});
test('level thresholds, cap and invalid stored progress have safe display values',async()=>{
 const {playerProgress,totalXP}=await import('../server/player-progress.mjs');
 for(const [xp,level]of [[0,1],[499.9,1],[500,2],[1249.9,2],[1250,3],[totalXP(2000),2000],[Number.MAX_SAFE_INTEGER,2000]])assert.equal(playerProgress({coins:25,xp}).level,level);
 assert.deepEqual(playerProgress({coins:-1,xp:NaN}),{coins:0,level:1});assert.deepEqual(playerProgress(null),{coins:0,level:1});
});
