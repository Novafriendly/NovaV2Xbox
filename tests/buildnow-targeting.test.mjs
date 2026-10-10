import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {buildNowTools} from '../server/buildnow-tools.mjs';
function visual(){const window={};vm.runInNewContext(readFileSync(new URL('../server/buildnow-visual.js',import.meta.url),'utf8'),{window});return window.NovaLOLVisual}
test('nearby fully visible opponents are retained while the lower-screen local body is excluded',()=>{const api=visual();assert.equal(api.isLocalViewBody({left:340,top:300,width:220,height:570,minDepth:3,head:{x:420,y:330}},1000,800),true);assert.equal(api.isLocalViewBody({left:440,top:180,width:170,height:430,minDepth:4,head:{x:515,y:205}},1000,800),false);assert.equal(api.isLocalViewBody({left:710,top:300,width:200,height:500,minDepth:4,head:{x:790,y:340}},1000,800),false)});
test('target point follows the reconstructed animated head and requires visible character pixels',()=>{const api=visual(),body={left:95,top:60,width:40,height:100,head:{x:123,y:72},torso:{x:115,y:110}},region={left:100,top:70,width:20,height:80};const heads=api.targetRegions([region],[body],400,300,'head');assert.equal(heads.length,1);assert.equal(heads[0].x,-77);assert.equal(heads[0].y,78);const torso=api.targetRegions([region],[body],400,300,'body')[0];assert.equal(torso.x,-85);assert.equal(torso.y,40);assert.equal(api.targetRegions([],[body],400,300,'head').length,0);assert.equal(api.targetRegions([{left:240,top:70,width:20,height:80}],[body],400,300,'head').length,0)});
test('exact body provenance permits wide animated poses and clipped targets without loosening unknown shapes',()=>{const api=visual(),width=120,height=120,pixels=new Uint8Array(width*height*4);for(let y=30;y<80;y++)for(let x=10;x<110;x++){const at=(y*width+x)*4;pixels[at]=255;pixels[at+3]=255}assert.equal(api.findRegions(pixels,width,height).length,0);assert.equal(api.findRegions(pixels,width,height,{verifiedGeometry:true,allowClipped:true}).length,1)});
test('detection crop includes the complete body and stays within the framebuffer',()=>{const b=visual().detectionBounds([{left:-20,top:30,width:90,height:180}],400,200);assert.equal(b.left,0);assert.equal(b.top,24);assert.equal(b.width,76);assert.equal(b.height,176)});
test('BuildNow Escape releases input without disabling the aim toggle and includes skeleton rendering',async()=>{const code=await buildNowTools();assert(code.includes("if(e.key==='Escape'){releaseMacro();window.NovaLOLVisual?.clearTracking();return;}"));assert(!code.includes("if(e.key==='Escape'){stop();return;}"));assert(code.includes('boneState?.skeleton'));assert(code.includes('nova-skeleton-esp'));new vm.Script(code)});


// Synthetic WebGL objects exercise the actual character draw hook without a browser or native game.
function characterDraw({player = null, ready = true, hasPlayer, verified = true, localBody = false} = {}) {
  const bounds = {lo: [-.4, 0, -.25], hi: [.4, 1.8, .25]}, model = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, localBody ? -2 : 0, localBody ? 2 : 20, 1];
  const view = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0], highlights = [], matches = [];
  class GL {
    constructor() { Object.assign(this, {SHADER_TYPE: 1, VERTEX_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4, CURRENT_PROGRAM: 5, TRIANGLES: 4, ACTIVE_UNIFORMS: 6, VERTEX_ARRAY_BINDING: 7, ELEMENT_ARRAY_BUFFER_BINDING: 8}); this.canvas = {id: 'unity-canvas', width: 1000, height: 800}; this.layout = {}; }
    shaderSource(shader, text) { shader.text = text; }
    compileShader(shader) { shader.compiled = true; }
    getShaderParameter(shader, key) { return key === this.SHADER_TYPE ? shader.type : shader.compiled; }
    getAttachedShaders(program) { return program.shaders; }
    linkProgram(program) { program.linked = true; }
    getProgramParameter(program, key) { return key === this.LINK_STATUS ? program.linked : 0; }
    getUniformLocation(program, name) { return {program, name}; }
    getParameter(key) { return key === this.CURRENT_PROGRAM ? this.program : this.layout; }
    uniformMatrix4fv() {}
    uniform1i(location, value) { if (location.name === 'novaEnabled') highlights.push(value); }
    uniform1f() {}
    uniform3fv() {}
    drawElements() {}
    bufferData() {}
  }
  class Canvas { getContext() {} }
  const geometry = {character: verified}, cache = {checks: 1, classify: () => geometry, readPose: () => ({bounds, headTarget: [0, 1.65, 0], joints: [{name: 'Head', position: [0, 1.65, 0]}]})};
  const window = {WebGL2RenderingContext: GL, HTMLCanvasElement: Canvas, requestAnimationFrame() {}, addEventListener() {}, NovaBuildNowCharacters: {isWorldProgram: () => true, createCharacterGeometryCache: () => cache}, NovaBuildNowEngine: {snapshot: () => ({ready,hasPlayer}), matchPlayer: origin => { matches.push([...origin]); return player; }}};
  vm.runInNewContext(readFileSync(new URL('../server/buildnow-visual.js', import.meta.url), 'utf8'), {window, document: {hidden: false, addEventListener() {}}});
  const api = window.NovaLOLVisual, gl = new GL(), v = {type: gl.VERTEX_SHADER}, f = {type: 9}, program = {shaders: [v, f]};
  gl.shaderSource(v, '#version 300 es\nvoid main(){gl_Position=vec4(0.0);}');
  gl.shaderSource(f, '#version 300 es\nprecision highp float;\nout vec4 color;\nvoid main(){color=vec4(1.0);}');
  gl.compileShader(v); gl.compileShader(f); gl.linkProgram(program); gl.program = program;
  api.state.esp = true; api.state.skeleton = true;
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'hlslcc_mtx4x4unity_ObjectToWorld[0]'), false, model);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'hlslcc_mtx4x4unity_MatrixVP[0]'), false, view);
  gl.drawElements(gl.TRIANGLES, 12, 5123, 0);
  return {api, highlights, matches};
}

test('verified character visuals survive missing registry entries after native controls are ready', () => {
  const fixture = characterDraw();
  assert.equal(fixture.matches.length, 1, 'ready native controls attempt a registry lookup');
  assert.deepEqual(fixture.matches[0], [0, 0, 20]);
  assert.equal(fixture.api.state.projectedCharacters.length, 1);
  assert.equal(fixture.api.state.skeletons.length, 1);
  assert.equal(fixture.highlights.at(-1), 1);
  const unavailable = characterDraw({ready: false});
  assert.equal(unavailable.matches.length, 0);
  assert.equal(unavailable.api.state.projectedCharacters.length, 1);
});

test('visual character fallback retains controlled, dead, local-body, and geometry exclusions', () => {
  for (const options of [{player: {controlled: true}}, {player: {dead: true}}, {localBody: true}, {verified: false}]) {
    const fixture = characterDraw(options);
    assert.equal(fixture.api.state.projectedCharacters.length, 0);
    assert.equal(fixture.api.state.skeletons.length, 0);
    assert.equal(fixture.highlights.at(-1), 0);
  }
  const ownedTarget = characterDraw({player: {mine: true, controlled: false, dead: false}});
  assert.equal(ownedTarget.api.state.projectedCharacters.length, 1);
  assert.equal(ownedTarget.highlights.at(-1), 1, 'client ownership does not imply the local avatar');
});

 test('remembered ESP ignores menu preview bodies until the actual game character spawns',()=>{const waiting=characterDraw({hasPlayer:false});assert.equal(waiting.api.state.projectedCharacters.length,0);assert.equal(waiting.api.state.skeletons.length,0);assert.equal(waiting.highlights.at(-1),0);assert.equal(waiting.matches.length,0);const spawned=characterDraw({hasPlayer:true});assert.equal(spawned.api.state.projectedCharacters.length,1);assert.equal(spawned.highlights.at(-1),1);});
