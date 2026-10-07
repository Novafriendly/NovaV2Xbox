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


test('selecting an already running game minimizes its library and restores the same iframe',async()=>{
 const {readFile}=await import('node:fs/promises'),{runInNewContext}=await import('node:vm');
 const source=await readFile(new URL('../Public/src/nova-os.js',import.meta.url),'utf8');
 const launch=source.split('window.NovaRecent.launch=g=>{')[1].split('};')[0];
 const events=[],iframe={isConnected:true,hidden:true};let maximized=false;
 const game={id:12,kind:'game'},entry={iframe,win:{get maximized(){return maximized},show(){events.push('show-game')},toggleMaximize(){maximized=true;events.push('maximize-game')}}};
 const context={window:{NovaHacks:{hide(){}}},retireOtherGames(){},g:game,activeGame:null,playerKind:g=>g.kind,playerWindows:new Map([['game:12',entry]]),primary:{minimize(){events.push('minimize-library')}},frame:null,currentPage:'library'};
 runInNewContext('(function(){'+launch+'})()',context);
 assert.deepEqual(events,['minimize-library','show-game','maximize-game']);assert.equal(context.frame,iframe);assert.equal(iframe.hidden,false);assert.equal(context.currentPage,'game');
 events.length=0;runInNewContext('(function(){'+launch+'})()',context);assert.deepEqual(events,['minimize-library','show-game'],'Do not toggle a maximized game back to a small window');
});

test('opening the library keeps retained games hidden until a game is selected',async()=>{const {readFile}=await import('node:fs/promises'),{runInNewContext}=await import('node:vm');const source=await readFile(new URL('../Public/src/nova-os.js',import.meta.url),'utf8');const handler=source.split("window.openLibrary=(page,filter='all')=>{")[1].split('};')[0];const events=[],root={classList:{remove(){}}},frame={};const context={page:'library',filter:'all',window:{NovaHacks:{hide(){}},NovaMusic:{hide(){}}},detachPlayer(){events.push('retain-game');return true},playerWindows:new Map([['game:12',{win:{visible:true,minimize(){events.push('hide-game')}}}],['game:13',{win:{visible:false,minimize(){throw Error('Do not reopen hidden game')}}}]]),workspaceUsed:true,allowWindow:()=>true,ensurePrimaryFrame(){},primary:{root,header:{},show(){events.push('show-library')}},document:{body:{classList:{remove(){}}}},legacyLibrary(){events.push('render-library')},prepareLibraryRail(){},frame};runInNewContext('(function(){'+handler+'})()',context);assert.deepEqual(events,['retain-game','hide-game','render-library','show-library']);assert.equal(context.currentPage,'library')});

test('system apps detach a visible game and allocate their own frame before opening',async()=>{const {readFile}=await import('node:fs/promises');const s=await readFile(new URL('../Public/src/nova-os.js',import.meta.url),'utf8'),app=s.split('function openApp(page){')[1].split('// The old home')[0];assert(app.indexOf('if(!detachPlayer())return;primary.minimize()')>=0);assert(app.indexOf('if(!detachPlayer())return;ensurePrimaryFrame();const previous=frame')<app.indexOf('window.NovaRecent.openSystem(page)'));assert(s.includes('if(!wasVisible)win.minimize();playerWindows.set(key,{win,iframe})'))});
