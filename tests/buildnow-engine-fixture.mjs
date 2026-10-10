import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash, webcrypto} from 'node:crypto';
import {installEngine, directedVector, bindPlayer, choosePlayerTarget, walkingSpeedModule} from '../server/buildnow-engine.mjs';

export function runtime({offline = true, validPatch = true, expectedHash, hostname = 'nova.example'} = {}) {
  const emptyWasm = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);
  const profile = {magic: 0x4e564100, hooks: [{id: 5}], sha256: expectedHash ?? createHash('sha256').update(emptyWasm).digest('hex')};
  const windowListeners = new Map(), documentListeners = new Map(), notifications = [], calls = [], physicsWrites = [], physicsOwners = [], freed = [];
  const on = listeners => (type, callback) => { const callbacks = listeners.get(type) || []; callbacks.push(callback); listeners.set(type, callbacks); };
  const trigger = (listeners, type, event = {}) => { for (const callback of listeners.get(type) || []) callback(event); };
  class Memory { constructor() { this.buffer = new ArrayBuffer(65536); } }
  class Table { constructor(methods) { this.methods = methods; } set(pointer,fn) { this.methods[pointer]=fn; } get(pointer) { assert(this.methods[pointer], `unexpected test method ${pointer}`); return this.methods[pointer]; } }
  const memory = new Memory(), words = new Uint32Array(memory.buffer), bytes = new Uint8Array(memory.buffer);
  const own = 2048, weapons = 5000, photon = 7000, motor = 8000, transform = 9000, scratch = 16000;
  const weapon = 18000, shotOrigin = 18500, shotVelocity = 18516, opponent = 20000, opponentWeapons = 22000, opponentPhoton = 24000, opponentTransform = 26000, camera = 27000;
  const training = 28000, trainingTransform = 28500, trainingHealth = 29000, trainingRenderer = 29500, trainingRendererTransform = 36000;
  const trainingClass = 31500, healthClass = 32000, healthBaseClass = 32500, rendererClass = 33500, rendererBaseClass = 34500;
  const opponentMotor = 8400, opponentRenderer = 37000, opponentRendererTransform = 37500, rendererCollection = 38000, arrayClass = 35500;
  const put = (pointer, value) => { words[pointer >>> 2] = value; };
  function component(pointer, classPointer, namePointer, name, token = 0) {
    put(pointer, classPointer); put(pointer + 8, 1); put(classPointer + 8, namePointer); put(classPointer + 164, token);
    bytes.set(Buffer.from(name + '\0'), namePointer);
  }
  component(own, 30000, 40000, 'BaseCharacterController', 33556690);
  component(weapons, 30500, 40100, 'WeaponsSystem', 33556494);
  component(photon, 31000, 40200, 'PhotonView');
  component(opponent, 30000, 40000, 'BaseCharacterController', 33556690);
  component(opponentWeapons, 30500, 40100, 'WeaponsSystem', 33556494);
  component(opponentPhoton, 31000, 40200, 'PhotonView');
  put(transform + 8, 1); put(opponentTransform + 8, 1); put(own + 1348, weapons); put(weapons + 120, photon); put(weapons + 128, own); put(weapons + 72, transform); put(own + 180, motor); put(own + 264, 2);
  put(opponent + 1348, opponentWeapons); put(opponentWeapons + 120, opponentPhoton); put(opponentWeapons + 128, opponent);
  component(training, trainingClass, 40300, 'TrainingBotAI', 33556747);
  component(trainingHealth, healthClass, 40400, 'TrainingHealth');
  put(healthClass + 44, healthBaseClass); put(healthBaseClass + 8, 40500); put(healthBaseClass + 164, 33554586); bytes.set(Buffer.from('Health\0'), 40500);
  component(trainingRenderer, rendererClass, 40600, 'SkinnedMeshRenderer');
  component(opponentRenderer, rendererClass, 40600, 'SkinnedMeshRenderer');
  put(rendererClass + 44, rendererBaseClass); put(rendererBaseClass + 8, 40700); bytes.set(Buffer.from('Renderer\0'), 40700);
  put(training + 64, trainingHealth); put(training + 28, trainingRenderer);
  for (const pointer of [trainingTransform, trainingRendererTransform, opponentRendererTransform]) put(pointer + 8, 1);
  put(opponent + 180, opponentMotor); put(opponent + 264, 2);
  put(rendererCollection, arrayClass); put(arrayClass + 8, 40800); bytes.set(Buffer.from('Renderer[]\0'), 40800); put(rendererCollection + 12, 1); put(rendererCollection + 16, opponentRenderer);
  put(weapon + 8, 1); put(weapon + 140, weapons); bytes[weapon + 157] = 1;
  const ownedViews = new Set([photon]);
  const transforms = new Map([[own, transform], [opponent, opponentTransform], [training, trainingTransform], [trainingRenderer, trainingRendererTransform], [opponentRenderer, opponentRendererTransform]]);
  const positions = new Map([[transform, [10, 0, 10]], [opponentTransform, [20, 0, 10]], [trainingTransform, [40, 0, 15]], [trainingRendererTransform, [30, 0, 15]], [opponentRendererTransform, [50, 0, 10]]]);
  let now = 1000, isOffline = offline, patchCalls = 0, cameraForward = [0, 0, 1];
  const method = (pointer, fn) => (...args) => { calls.push({pointer, args}); return fn(...args); };
  const table = new Table({
    32332: method(32332, () => 8),
    41570: method(41570, () => isOffline ? 1 : 0),
    41757: method(41757, pointer => ownedViews.has(pointer) ? 1 : 0),
    3579: method(3579, pointer => transforms.get(pointer) || transform),
    3580: method(3580, (out, pointer) => new Float32Array(memory.buffer, out, 3).set(positions.get(pointer) || [10, 0, 10])),
    26353: method(26353, (pointer, movement) => put(pointer + 264, movement)),
    6009: method(6009, out => new Float32Array(memory.buffer, out, 3).set(cameraForward)),
    26349: method(26349, (pointer, velocity) => { physicsOwners.push(pointer); physicsWrites.push([...new Float32Array(memory.buffer, velocity, 3)]); }),
  });
  const exports = {Ck: table, ek: memory, tk: () => scratch, uk: pointer => freed.push(pointer)};
  const window = {location: {hostname}, addEventListener: on(windowListeners), dispatchEvent: event => notifications.push(event.type), NovaLOLVisual: {state: {silent: false, regions: [], fov: 512}}};
  const canvas = {id: 'unity-canvas', width: 1000, height: 800, getBoundingClientRect: () => ({width: 1000, height: 800})};
  const document = {hidden: false, pointerLockElement: canvas, hasFocus: () => true, addEventListener: on(documentListeners), getElementById: () => canvas};
  const wasm = {Memory, Table, validate: output => validPatch && WebAssembly.validate(output), instantiate: async (source,imports) => source?.byteLength>8?WebAssembly.instantiate(source,imports):({instance: {exports}}), instantiateStreaming: async () => ({instance: {exports}})};
  const context = vm.createContext({window, document, WebAssembly: wasm, performance: {now: () => now}, crypto: webcrypto, Blob, CustomEvent: class {constructor(type) { this.type = type; }}, profile, patch: input => { patchCalls++; return new Uint8Array(input); }, direction: directedVector, bind: bindPlayer, targetSelector: choosePlayerTarget, speedModule:Array.from(walkingSpeedModule())});
  vm.runInContext(`(${installEngine.toString()})(profile,patch,direction,bind,targetSelector,speedModule)`, context);
  const originalImportCalls = [], imports = {a: {Ki: (...args) => { originalImportCalls.push(args); return 123; }}};
  const api = window.NovaBuildNowEngine;
  return {
    api, window, document, wasm, context, profile, emptyWasm, memory, component, weapons, photon, method: (pointer, fn) => { table.methods[pointer] = method(pointer, fn); }, own, motor, opponent, weapon, shotOrigin, shotVelocity, training, trainingHealth, trainingClass, healthBaseClass, opponentMotor, calls, physicsWrites, physicsOwners, freed, notifications, originalImportCalls,
    nativeMaxSpeed: pointer=>table.get(32332)(pointer??own,0),
    get patchCalls() { return patchCalls; },
    get movement() { return words[(own + 264) >>> 2]; },
    get opponentMovement() { return words[(opponent + 264) >>> 2]; },
    writeWord: put,
    writeByte: (pointer, value) => { bytes[pointer] = value; },
    setOwnOwned: value => { if (value) ownedViews.add(photon); else ownedViews.delete(photon); },
    setOpponentOwned: value => { if (value) ownedViews.add(opponentPhoton); else ownedViews.delete(opponentPhoton); },
    exposeOpponentRenderer: () => put(opponentWeapons + 104, rendererCollection),
    advance: amount => { now += amount; },
    setOffline: value => { isOffline = value; },
    setCamera: forward => { cameraForward = forward; put(camera + 8, 1); put(own + 192, camera); },
    vectorAt: pointer => [...new Float32Array(memory.buffer, pointer, 3)],
    writeVector: (pointer, values) => new Float32Array(memory.buffer, pointer, 3).set(values),
    key: (type, code, extra = {}) => { const event = {code, target: {closest: () => false}, prevented: false, preventDefault() { this.prevented = true; }, ...extra}; trigger(windowListeners, type, event); return event; },
    windowEvent: type => trigger(windowListeners, type),
    documentEvent: type => trigger(documentListeners, type),
    dispatch: (kind, a = own, b = 0, c = 0) => imports.a.Ki(a, b, c, profile.magic + kind),
    async load({observe = true} = {}) { await api.prepareWasm(new Blob([emptyWasm])); await wasm.instantiate(emptyWasm, imports); if (observe) this.dispatch(1); },
  };
}
