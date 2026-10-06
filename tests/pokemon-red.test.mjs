import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {nativeGameURL} from '../Public/src/native-game-frame.mjs';
const root=new URL('../Public/content/emulator/pokemon-red/',import.meta.url);
test('native emulator route is limited to the local Pokemon Red entry',()=>{
 const base='https://nova.example/player.html?kind=game&id=505';
 assert.equal(nativeGameURL({id:505,url:'content/games/505.html'},'game',base),'https://nova.example/content/games/505.html');
 for(const [item,kind]of [[{id:504,url:'content/games/504.html'},'game'],[{id:505,url:'https://external.example/game'},'game'],[{id:505,url:'content/games/505.html'},'cloud'],[{id:505,url:'settings.html'},'game']])assert.equal(nativeGameURL(item,kind,base),null);
});
test('pinned emulator and game assets match the bundle manifest',async()=>{
 const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
 assert.equal(manifest.length,7);
 for(const file of manifest){const bytes=await readFile(new URL(file.file,root));assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256)}
 assert.deepEqual([...await readFile(new URL('pokemon-red.zip',root))].slice(0,2),[80,75]);
});
test('native bootstrap uses Game Boy core and local worker assets without tracking scripts',async()=>{
 const html=await readFile(new URL('../Public/content/games/505.html',import.meta.url),'utf8'),source=await readFile(new URL('../Public/src/pokemon-red-native.js',import.meta.url),'utf8');
 assert.ok(source.includes("EJS_core:'gb'"));assert.ok(source.includes("EJS_threads:false"));assert.ok(source.includes('/content/emulator/pokemon-red/'));assert.ok(!/googletagmanager|cloak\.js|cdn\.jsdelivr/.test(html));
});
