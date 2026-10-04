import test from 'node:test';
import assert from 'node:assert/strict';
import {clampRect,centeredRect,activityTitle,normalizeUpdate} from '../Public/src/nova-os-core.mjs';

test('restored or dragged windows stay reachable above the dock after a laptop resize',()=>{
 for(const [width,height]of [[1920,1080],[1366,768],[1024,600],[390,844]]){
  for(const r of [{x:-999,y:-999,w:1200,h:900},{x:9000,y:8000,w:700,h:500},centeredRect(width,height)]){
   const v=clampRect(r,width,height);
   assert.ok(v.x>=8&&v.y>=8);
   assert.ok(v.x+v.w<=width-8);
   assert.ok(v.y+v.h<=height-88-8);
  }
 }
});
test('only actual player URLs identify game or app activity',()=>{
 assert.deepEqual(activityTitle('player.html?kind=app&id=app-7','Netflix'),{kind:'app',id:'app-7',title:'Netflix'});
 assert.equal(activityTitle('chat.html','Chat'),null);
 assert.equal(activityTitle('library-games.json','Library'),null);
});
test('update titles and descriptions preserve staff text without treating it as markup',()=>{
 const u=normalizeUpdate('u',{author:'owner',text:'Nova OS\n- Faster navigation\n<script>alert(1)</script>',createdAt:10});
 assert.equal(u.title,'Nova OS');assert.equal(u.text,'- Faster navigation\n<script>alert(1)</script>');assert.equal(u.author,'owner');
});

test('owner updates retain publish time and author UID while stripping the repeated feed title',()=>{
 const u=normalizeUpdate('owner-1',{author:'OwnerName',authorUid:'owner-uid',authorName:'OwnerName',authorRole:'owner',title:'Release',text:'Release\n- A change',at:123});
 assert.equal(u.createdAt,123);assert.equal(u.author,'owner-uid');assert.equal(u.authorName,'OwnerName');assert.equal(u.authorRole,'owner');assert.equal(u.title,'Release');assert.equal(u.text,'- A change');
});
