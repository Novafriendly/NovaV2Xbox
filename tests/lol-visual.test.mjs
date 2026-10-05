import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const source=readFileSync('Public/src/lol-visual.js','utf8');
const vertex='#version 300 es\nvoid main(){gl_Position=vec4(0.0);return;}';
const fragment='#version 300 es\nprecision highp float;\nout vec4 SV_Target0;\nvoid main(){SV_Target0=vec4(1.0);return;}';
function runtime({rejectCompile=false,rejectLink=false}={}){
 class GL{
  constructor(){Object.assign(this,{SHADER_TYPE:1,VERTEX_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,CURRENT_PROGRAM:5,LINES:6});this.uniforms=[];this.draws=[];}
  shaderSource(shader,text){shader.text=text;}
  getShaderParameter(shader,param){return param===this.SHADER_TYPE?shader.type:shader.compiled;}
  compileShader(shader){shader.compiled=!(rejectCompile&&shader.text.includes('novaDepth'));}
  getAttachedShaders(program){return program.shaders;}
  linkProgram(program){program.linked=!(rejectLink&&program.shaders.some(s=>s.text.includes('novaDepth')));}
  getProgramParameter(program){return program.linked;}
  getUniformLocation(program,name){return{name,program};}
  getParameter(){return this.program;}
  uniform1i(location,value){this.uniforms.push([location.name,value]);}
  uniform1f(){}
  drawElements(...args){this.draws.push(args);}
 }
 class Canvas{getContext(type,options){this.options=options;return{};}}
 const window={WebGL2RenderingContext:GL,HTMLCanvasElement:Canvas,requestAnimationFrame(){},addEventListener(){}};
 vm.runInNewContext(source,{window,document:{hidden:false},MouseEvent:class{}});return {api:window.NovaLOLVisual,GL,Canvas};
}
function program(r){const gl=new r.GL(),v={type:2},f={type:9};gl.shaderSource(v,vertex);gl.shaderSource(f,fragment);gl.compileShader(v);gl.compileShader(f);const p={shaders:[v,f]};gl.linkProgram(p);gl.program=p;return{gl,v,f,p};}
test('patches both Unity shader exits with matching GLSL 300 varyings',()=>{
 const {api}=runtime(),v=api.patchShader(vertex,true),f=api.patchShader(fragment,false);
 assert.ok(v.startsWith('#version 300 es\n'));assert.match(v,/out highp float novaDepth/);assert.match(f,/in highp float novaDepth/);
 assert.match(v,/gl_Position.z=-0.99\*gl_Position.w/);assert.match(f,/SV_Target0=vec4\(novaColor,1.0\)/);
 assert.equal(api.patchShader('void main(){}',true),null);
});
test('unsupported shaders are unchanged and incompatible programs revert patched stages',()=>{
 const r=runtime(),gl=new r.GL(),v={type:2},f={type:9};gl.shaderSource(v,vertex);gl.shaderSource(f,'#version 300 es\nvoid main(){}');gl.compileShader(v);gl.compileShader(f);const p={shaders:[v,f]};gl.linkProgram(p);
 assert.equal(v.text,vertex);assert.equal(p.linked,true);assert.equal(r.api.state.programs,0);
});
test('failed shader compilation restores the original without recursive patching',()=>{
 const r=runtime({rejectCompile:true}),{v,f,p}=program(r);assert.equal(v.text,vertex);assert.equal(f.text,fragment);assert.equal(p.linked,true);assert.equal(r.api.state.fallbacks,2);
});
test('failed shader linking falls back to the original game shaders',()=>{
 const r=runtime({rejectLink:true}),{v,f,p}=program(r);assert.equal(p.linked,true);assert.equal(v.text,vertex);assert.equal(f.text,fragment);assert.equal(r.api.state.programs,0);
});
test('visual features start off and affect only supported candidate draw calls',()=>{
 const r=runtime(),{gl}=program(r);assert.equal(r.api.state.aim,false);assert.equal(r.api.state.wireframe,false);gl.drawElements(4,5000,0,0);assert.equal(gl.draws[0][0],4);assert.deepEqual(gl.uniforms[0],['novaEnabled',0]);
 r.api.state.movingOnly=false;r.api.state.esp=true;r.api.state.wireframe=true;gl.drawElements(4,5000,0,0);assert.equal(gl.draws[1][0],gl.LINES);assert.deepEqual(gl.uniforms[1],['novaEnabled',1]);gl.drawElements(4,6,0,0);assert.equal(gl.draws[2][0],4);assert.deepEqual(gl.uniforms[2],['novaEnabled',0]);
});
test('pixel targeting ignores isolated noise and chooses a nearby highlighted region',()=>{
 const {api}=runtime(),w=64,h=64,pixels=new Uint8Array(w*h*4);assert.equal(api.findTarget(pixels,w,h),null);
 for(let y=34;y<40;y+=2)for(let x=34;x<40;x+=2){const i=(y*w+x)*4;pixels[i]=255;pixels[i+2]=0;pixels[i+3]=255;}const point=api.findTarget(pixels,w,h);assert.equal(point.x,4);assert.ok(Math.abs(point.y-4.88)<0.01);
});
test('preserves WebGL frame sampling without changing 2D context options',()=>{
 const {Canvas}=runtime(),canvas=new Canvas();const original={alpha:false};canvas.getContext('webgl2',original);assert.equal(canvas.options.preserveDrawingBuffer,true);assert.equal(original.preserveDrawingBuffer,undefined);canvas.getContext('2d',original);assert.equal(canvas.options,original);
});


test('moving-only tracking rejects static meshes and recognizes changed world transforms',()=>{
 const {api}=runtime(),t=api.createMotionTracker(),matrix=Array(16).fill(0);matrix[0]=matrix[5]=matrix[10]=matrix[15]=1;
 assert.equal(t.observe('actor',matrix,1),false);assert.equal(t.observe('actor',matrix,2),false);
 const moved=matrix.slice();moved[12]=0.5;assert.equal(t.observe('actor',moved,3),true);
 assert.equal(t.observe('actor',moved,4),false);assert.equal(t.observe('different geometry',moved,5),false);
});
test('motion tracking does not confuse same-frame repeated draws with movement',()=>{
 const {api}=runtime(),t=api.createMotionTracker(),matrix=Array(16).fill(0),other=matrix.slice();other[12]=3;
 t.observe('shared',matrix,1);t.observe('shared',other,1);
 assert.equal(t.observe('shared',matrix,2),false);assert.equal(t.observe('shared',other,2),false);
});


test('uniform reader copies only the requested matrix values from a large WASM heap',()=>{
 const {api}=runtime();let reads=0;
 const heap=new Proxy({length:100000000},{get(target,key){if(key==='length')return target.length;reads++;return Number(key);}});
 const matrix=api.readUniform(heap,2000,16);assert.equal(reads,16);assert.equal(matrix.length,16);assert.equal(matrix[0],2000);assert.equal(matrix[15],2015);
 reads=0;const row=api.readUniform(heap,3000,4);assert.equal(row.length,4);assert.equal(reads,4);assert.equal(row[3],3003);
});

test('target selection rejects a wide floor highlight',()=>{
 const {api}=runtime(),w=128,h=128,pixels=new Uint8Array(w*h*4);
 for(let y=60;y<70;y++)for(let x=10;x<110;x++){const i=(y*w+x)*4;pixels[i]=255;pixels[i+2]=0;pixels[i+3]=255;}
 assert.equal(api.findTarget(pixels,w,h),null);
});
test('aim preserves highlighted candidates when world transforms are unavailable',()=>{
 const r=runtime(),{gl}=program(r);r.api.state.aim=true;r.api.state.movingOnly=true;gl.drawElements(4,5000,0,0);assert.deepEqual(gl.uniforms[0],['novaEnabled',1]);
});

test('red regions provide boxes with top-down coordinates for tracer overlays',()=>{const {api}=runtime(),pixels=new Uint8Array(64*64*4);for(let y=20;y<40;y++)for(let x=30;x<38;x++){const i=(y*64+x)*4;pixels[i]=255;pixels[i+3]=255;}const regions=api.findRegions(pixels,64,64);assert.equal(regions.length,1);assert.equal(regions[0].left,30);assert.equal(regions[0].top,24);assert.equal(regions[0].height,20);});
test('new default aim speed corrects faster while bounding camera steps',()=>{const {api}=runtime();assert.ok(api.aimDelta({x:40,y:0},api.state.speed).dx>6);assert.equal(api.aimDelta({x:1000,y:0},api.state.speed).dx,36);assert.equal(api.aimDelta({x:1,y:1},api.state.speed).dx,0);});

test('target selection immediately switches when the previous shape disappears',()=>{const {api}=runtime(),first={x:10,y:0,distance:100},second={x:40,y:0,distance:1600};assert.equal(api.selectTarget([first,second],256,256),first);assert.equal(api.selectTarget([second],256,256),second);assert.equal(api.selectTarget([],256,256),null);});
test('aim timing compensates for slower sampling without exceeding the step limit',()=>{const {api}=runtime();assert.equal(api.aimDelta({x:10,y:0},0.4,32).dx,8);assert.equal(api.aimDelta({x:1000,y:0},1,1000).dx,36);});

test('auto fire pulses and releases immediately when detection is lost',()=>{const {api}=runtime(),events=[],fire=api.createAutoFire((type,options)=>events.push([type,options.buttons]));fire.update(0,true);fire.update(30,true);fire.update(50,true);fire.update(110,true);fire.update(111,false);assert.deepEqual(events,[['mousedown',1],['mouseup',0],['mousedown',1],['mouseup',0]]);assert.equal(fire.held,false);fire.stop();assert.equal(events.length,4);});
test('broader mesh detection includes smaller supported draw calls only when selected',()=>{const r=runtime(),{gl}=program(r);r.api.state.esp=true;gl.drawElements(4,2000,0,0);assert.deepEqual(gl.uniforms[0],['novaEnabled',0]);r.api.state.broadMeshes=true;gl.drawElements(4,2000,0,0);assert.deepEqual(gl.uniforms[1],['novaEnabled',1]);});

test('mesh detection follows the selected highlight color',()=>{const {api}=runtime(),pixels=new Uint8Array(64*64*4);api.state.color=[0,1,0];for(let y=20;y<40;y++)for(let x=30;x<38;x++){const i=(y*64+x)*4;pixels[i+1]=255;pixels[i+3]=255;}assert.equal(api.findRegions(pixels,64,64).length,1);api.state.color=[1,0,0];assert.equal(api.findRegions(pixels,64,64).length,0);});
