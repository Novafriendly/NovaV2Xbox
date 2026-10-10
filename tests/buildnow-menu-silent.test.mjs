import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(process.env.NOVA_MENU_SOURCE||new URL('../Public/src/buildnow-menu.js',import.meta.url),'utf8');
function functionSource(name){const start=source.indexOf(' function '+name+'(');assert(start>=0,'missing '+name);const open=source.indexOf('{',start);return source.slice(start,bodyEnd(open)+1);}
function bodyEnd(open){let depth=1,quote=null,escaped=false;for(let i=open+1;i<source.length;i++){const c=source[i];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue;}if(c==='"'||c==="'"||c==='`'){quote=c;continue;}if(c==='{')depth++;else if(c==='}'&&!--depth)return i;}throw Error('unclosed handler');}
function handlerSource(target,event){const start=source.indexOf(target+'.on'+event+'=');assert(start>=0,'missing '+target+' '+event);const open=source.indexOf('{',start);return source.slice(start,bodyEnd(open)+1)+';';}

function menu({offline=true,ready=true,hasPlayer=true,controlsAllowed=offline,rejectCapture=false,throwCapture=false}={}){
 const state={offline,controlsAllowed,ready,hasPlayer,silent:false},visual={state:{aim:false,silent:false,fullViewAim:false}},calls=[],statuses=[];
 visual.releaseAutoFire=()=>calls.push(['release-auto-fire']);
 const field=()=>({value:'',checked:false,disabled:false,attributes:{},setAttribute(name,value){this.attributes[name]=value;},dispatchEvent(){}});
 const aimButton=field(),silentToggle=field(),mode=field(),fullView=field(),panel={hidden:false},launcher={hidden:true};mode.value='assist';
 const status={set textContent(value){statuses.push(value);},get textContent(){return statuses.at(-1)||'';}};
 const canvas={focus(){calls.push(['focus']);},requestPointerLock(){calls.push(['capture']);if(throwCapture)throw Error('Cursor capture unavailable');return rejectCapture?Promise.reject(Error('Cursor capture unavailable')):Promise.resolve();}};
 const strength=field(),autoShoot=field();strength.value='40';strength.dispatchEvent=()=>{visual.state.speed=Number(strength.value)/100;};autoShoot.dispatchEvent=()=>{visual.state.autoShoot=autoShoot.checked;};fullView.dispatchEvent=()=>{visual.state.fullViewAim=fullView.checked;};
 const elements={'lol-status':status,'nova-lol-launch':launcher,'unity-canvas':canvas,'lol-strength':strength,'lol-auto-shoot':autoShoot};
 const engine={snapshot:()=>({...state}),setSilent(enabled){calls.push(['silent',enabled]);if(enabled&&!(state.ready&&state.controlsAllowed&&state.hasPlayer))throw Error('Enter offline Aim Training first.');state.silent=enabled;visual.state.silent=enabled;return this.snapshot();}};
 const context=vm.createContext({window:{NovaLOLVisual:visual,NovaBuildNowEngine:engine},document:{getElementById:id=>elements[id]},aimButton,silentToggle,mode,fullView,panel,visual,previousMode:'assist',originalAimClick:()=>{calls.push(['ordinary-aim']);visual.state.aim=!visual.state.aim;},trainingSnapshot:()=>engine.snapshot(),update(){},showHackerPreset(){},Event:class {constructor(type){this.type=type;}}});
 vm.runInContext(functionSource('resumeGame')+'\n'+functionSource('nativeAvailable')+'\n'+functionSource('syncAimAction')+'\n'+functionSource('applySilentTraining')+'\n'+`function syncTraining(message){const state=trainingSnapshot();silentToggle.disabled=!(state.ready&&state.offline&&state.hasPlayer);silentToggle.checked=Boolean(!silentToggle.disabled&&state.silent);if(silentToggle.checked)mode.value='silent';syncAimAction(state);if(message)document.getElementById('lol-status').textContent=message;}`+'\n'+handlerSource('aimButton','click')+'\n'+handlerSource('mode','change')+'\n'+handlerSource('silentToggle','change')+'\n'+'syncTraining();',context);
 return{state,visual,calls,statuses,aimButton,silentToggle,mode,fullView,panel,launcher,select(value){mode.value=value;mode.onchange();},activate(){aimButton.onclick({});},check(value){silentToggle.checked=value;silentToggle.onchange();}};
}

test('selected Silent mode activates and returns to the game without invoking ordinary camera aim',()=>{
 const m=menu();m.visual.state.aim=true;m.select('silent');assert.equal(m.state.silent,true);assert.equal(m.visual.state.aim,false);assert.equal(m.visual.state.silent,true);assert.equal(m.fullView.checked,true);assert.equal(m.panel.hidden,false,'dropdown leaves settings open');assert.equal(m.aimButton.textContent,'Return to game · silent aim');assert.equal(m.aimButton.attributes['aria-pressed'],'true');
 m.activate();assert.equal(m.state.silent,true);assert.equal(m.visual.state.aim,false);assert.equal(m.panel.hidden,true);assert.equal(m.launcher.hidden,false);assert.equal(m.calls.filter(call=>call[0]==='ordinary-aim').length,0);assert(m.calls.some(call=>call[0]==='release-auto-fire'),'old visual fire is released without clearing the target');assert.deepEqual(m.calls.slice(-2),[['focus'],['capture']]);
});
test('silent checkbox remains the off control and the main action can re-enable the selected mode',()=>{
 const m=menu();m.check(true);assert.equal(m.state.silent,true);assert.equal(m.panel.hidden,true);assert.equal(m.mode.value,'silent');m.check(false);assert.equal(m.state.silent,false);assert.equal(m.visual.state.aim,false);assert.equal(m.mode.value,'silent');assert.equal(m.aimButton.textContent,'Use silent aim');assert.equal(m.aimButton.attributes['aria-pressed'],'false');m.activate();assert.equal(m.state.silent,true);assert.equal(m.visual.state.aim,false);
});
test('failed cursor capture explains how to return to the game without dropping Silent activation',async()=>{
 for(const options of [{rejectCapture:true},{throwCapture:true}]){const m=menu(options);m.select('silent');m.activate();await Promise.resolve();assert.equal(m.state.silent,true);assert.equal(m.visual.state.silent,true);assert.equal(m.visual.state.aim,false);assert.match(m.statuses.at(-1),/Silent aim enabled.*click the game.*capture the cursor/);assert.equal(m.aimButton.attributes['aria-pressed'],'true');}
});
test('unavailable offline avatar refuses Silent activation and never captures or activates camera aim',()=>{
 for(const options of [{offline:false},{ready:false},{hasPlayer:false}]){const m=menu(options);m.mode.value='silent';m.activate();assert.equal(m.state.silent,false);assert.equal(m.visual.state.aim,false);assert.equal(m.aimButton.disabled,true);assert.equal(m.calls.some(call=>call[0]==='ordinary-aim'||call[0]==='capture'),false);assert.equal(m.panel.hidden,false);}
});
test('switching back to ordinary aim preserves the normal toggle handler',()=>{
 const m=menu();m.select('silent');m.select('assist');assert.equal(m.state.silent,false);assert.equal(m.mode.value,'assist');assert.equal(m.aimButton.textContent,'Enable aim assist');m.activate();assert.equal(m.state.silent,false);assert.equal(m.visual.state.aim,true);assert.equal(m.calls.filter(call=>call[0]==='ordinary-aim').length,1);assert.equal(m.aimButton.textContent,'Disable aim assist');m.activate();assert.equal(m.visual.state.aim,false);assert.equal(m.calls.filter(call=>call[0]==='ordinary-aim').length,2);
});


test('native menu readiness enables localhost match controls while preserving explicit permission and spawn gates',()=>{
 const context=vm.createContext({});vm.runInContext(functionSource('nativeAvailable'),context);
 for(const state of [{ready:true,controlsAllowed:true,offline:false,hasPlayer:true},{ready:true,offline:true,hasPlayer:true}])assert.equal(context.nativeAvailable(state),true);
 for(const state of [{ready:true,controlsAllowed:false,offline:true,hasPlayer:true},{ready:true,controlsAllowed:true,hasPlayer:false},{ready:false,controlsAllowed:true,hasPlayer:true},{ready:true,offline:false,hasPlayer:true}])assert.equal(context.nativeAvailable(state),false);
});

 test('Silent activation is available in localhost match snapshots with native permission',()=>{const m=menu({offline:false,controlsAllowed:true});m.select('silent');m.activate();assert.equal(m.state.silent,true);assert.equal(m.visual.state.aim,false);assert.equal(m.panel.hidden,true);});


test('saved aim and ESP reapply at each spawn or character generation, respecting explicit off choices',()=>{
 const state={ready:true,controlsAllowed:true,hasPlayer:true,playerId:12,playerGeneration:1},saved={remember:true,enabled:{aim:true,silent:false,skeleton:true,autoShoot:true},visual:{mode:'assist'}},calls=[];
 const visual={state:{aim:false},clearTracking:()=>calls.push('clear')},elements={};let context;
 for(const [id,flag]of Object.entries({'skeleton-toggle':'skeleton','shoot-toggle':'autoShoot'}))elements[id]={checked:false,dispatchEvent(){visual.state[flag]=this.checked;calls.push(flag);vm.runInContext('restoreSaved()',context);}};
 const restorer={applying:false,sync:()=>{calls.push('native');return 'restored';}},mode={value:''};
 context=vm.createContext({trainingSnapshot:()=>({...state}),nativeAvailable:s=>s.ready&&s.controlsAllowed&&s.hasPlayer,savedStore:{read:()=>saved,error:''},restorer,savedStatus:{},visual,flags:{'skeleton-toggle':'skeleton','shoot-toggle':'autoShoot'},mode,applyingSaved:false,document:{getElementById:id=>elements[id]},Event:class {},syncReload:()=>calls.push('reload'),syncTraining(){}});
 const start=source.indexOf('const restoreSaved=()=>{'),open=source.indexOf('{',start);assert(start>=0);vm.runInContext('let restoredSpawn="",hadSpawn=false;'+source.slice(start,bodyEnd(open)+1)+';restoreSaved();',context);
 assert.equal(visual.state.aim,true);assert.equal(visual.state.skeleton,true);assert.equal(visual.state.autoShoot,true);const count=calls.filter(x=>x==='skeleton').length;
 vm.runInContext('restoreSaved()',context);assert.equal(calls.filter(x=>x==='skeleton').length,count,'polling does not constantly overwrite active controls');
 state.hasPlayer=false;vm.runInContext('restoreSaved()',context);visual.state.aim=false;visual.state.skeleton=false;state.hasPlayer=true;vm.runInContext('restoreSaved()',context);assert.equal(visual.state.aim,true);assert.equal(visual.state.skeleton,true,'same pointer respawn restores ESP');
 saved.enabled.skeleton=false;state.playerGeneration++;visual.state.skeleton=true;vm.runInContext('restoreSaved()',context);assert.equal(visual.state.skeleton,false,'explicitly saved off choices survive round changes');
 saved.remember=false;state.playerGeneration++;visual.state.aim=false;vm.runInContext('restoreSaved()',context);assert.equal(visual.state.aim,false);
});
