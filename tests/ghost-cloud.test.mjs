import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mergeGhostCatalog,GHOST_ORIGIN} from '../scripts/ghost-cloud-catalog.mjs';
const games=JSON.parse(await readFile(new URL('../Public/library-cloud.json',import.meta.url))),source=JSON.parse(await readFile(new URL('../scripts/data/ghost-cloud-20261004.json',import.meta.url)));
test('all 209 GhostCloud titles merge without duplicates and retain other providers',()=>{
 const result=mergeGhostCatalog(games,source);assert.equal(result.shared,209);assert.equal(result.added,0);assert.deepEqual(result.games,games);
 for(const entry of source){const matches=games.filter(g=>g.providers.ghost?.sourceId===entry.game_key);assert.ok(matches.length);for(const game of matches){const url=new URL(game.providers.ghost.url);assert.equal(url.origin,GHOST_ORIGIN);assert.equal(url.searchParams.get('play'),entry.game_key);assert.ok(game.providers.astra||game.providers.gsn)}}
});
test('new titles get their own card and invalid or duplicate keys are rejected',()=>{
 const entry={name:'New game',game_key:'aa9999',cover:'https://example.com/cover.jpg'};
 const result=mergeGhostCatalog([], [entry]);assert.equal(result.added,1);assert.equal(result.games[0].id,'ghost-aa9999');assert.deepEqual(mergeGhostCatalog(result.games,[entry]).games,result.games);
 assert.throws(()=>mergeGhostCatalog([], [entry,entry]),/duplicate/);assert.throws(()=>mergeGhostCatalog([], [{...entry,game_key:'../bad'}]),/Invalid/);
});
