import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = (await readFile(new URL('../Public/src/cloud-background.js', import.meta.url), 'utf8')).replace('export function', 'function');
function fixture(values = {}, embedded=false) {
  const flags = {"nova-os-embedded":embedded}, listeners = {}, media = () => ({ hidden: true, attributes: {}, getAttribute(key) { return this.attributes[key] ?? null; }, set src(value) { this.attributes.src = value; }, addEventListener() {}, play() { this.played = true; return Promise.resolve(); }, pause() { this.played = false; } });
  const video = media(), image = media(), host = { style: {}, querySelector: tag => tag === 'video' ? video : image };
  const document = { hidden: false, getElementById: () => host, documentElement: { classList: { contains:key=>flags[key]===true, toggle: (key, value) => flags[key] = value } }, addEventListener: (type, callback) => listeners[type] = callback };
  const context = { document, localStorage: { getItem: key => values[key] ?? null }, matchMedia: () => ({ matches: false }), addEventListener: (type, callback) => listeners[type] = callback }; vm.runInNewContext(source, context);
  return { video, image, host, flags, document, listeners, sync: () => context.syncBackground() };
}
test('uses a black fallback and only loads an explicitly selected wallpaper', () => { const empty = fixture(); assert.equal(empty.image.hidden, true); assert.equal(empty.video.hidden, true); const chosen = fixture({ nova_wallpaper: 'backgrounds/photo.jpg' }); assert.equal(chosen.image.getAttribute('src'), 'backgrounds/photo.jpg'); assert.equal(chosen.video.hidden, true); });
test('video and hero motion pause on hidden pages and in performance mode', () => { const active = fixture({ nova_wallpaper: 'backgrounds/selected.mp4' }); assert.equal(active.video.played, true); active.document.hidden = true; active.listeners.visibilitychange(); assert.equal(active.video.played, false); assert.equal(active.flags['page-hidden'], true); const quiet = fixture({ nova_wallpaper: 'backgrounds/selected.mp4', nova_performance_mode: 'true' }); assert.equal(quiet.video.played, false); assert.equal(quiet.flags['reduce-motion'], true); });
test('selected gradients replace wallpaper without loading another video', () => { const view = fixture({ nova_grad: JSON.stringify({ dir: '135deg', c1: '#111111', c2: '#222222', c3: '#333333' }), nova_wallpaper: 'large.mp4' }); assert.equal(view.host.style.background, 'linear-gradient(135deg,#111111,#222222,#333333)'); assert.equal(view.video.getAttribute('src'), null); });

test('OS cloud windows reuse the desktop wallpaper and do not start a second video',()=>{const view=fixture({nova_wallpaper:'large.mp4'},true);assert.equal(view.host.hidden,true);assert.equal(view.video.played,false);assert.equal(view.video.getAttribute('src'),null)});
