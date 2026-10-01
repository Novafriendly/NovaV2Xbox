import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../Public/src/cloud-history.js', import.meta.url), 'utf8');
const { cloudHistory, recordCloudGame } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const catalog = Array.from({ length: 32 }, (_, i) => ({ id: String(i), kind: 'cloud', name: 'Game ' + i, art: 'cover-' + i + '.webp' }));
function storage() { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }; }
test('recent cloud games stay separate for each account and guest', () => {
  const store = storage(); recordCloudGame(catalog[0], store, 10);
  store.setItem('nova_user', 'first'); recordCloudGame(catalog[1], store, 20);
  store.setItem('nova_user', 'second'); assert.deepEqual(cloudHistory(catalog, store), []); recordCloudGame(catalog[2], store, 30);
  store.setItem('nova_user', 'first'); assert.deepEqual(cloudHistory(catalog, store).map(row => row.id), ['1']);
  store.setItem('nova_user', ''); assert.deepEqual(cloudHistory(catalog, store).map(row => row.id), ['0']);
});
test('merges existing Nova history, keeps newest duplicate and resolves current catalog art', () => {
  const store = storage(); recordCloudGame(catalog[1], store, 20); recordCloudGame(catalog[2], store, 15);
  store.setItem('nova-v2-recent-guest', JSON.stringify([{ id: '1', kind: 'cloud', playedAt: 40, art: 'stale.webp' }, { id: '0', kind: 'cloud', playedAt: 30 }, { id: '3', kind: 'game', playedAt: 50 }, { id: 'unknown', kind: 'cloud', playedAt: 60 }]));
  const rows = cloudHistory(catalog, store); assert.deepEqual(rows.map(row => row.id), ['1', '0', '2']); assert.equal(rows[0].art, catalog[1].art); assert.equal(rows[0].playedAt, 40);
});
test('limits the stored history and moves replayed titles to the front without growing data', () => {
  const store = storage(); catalog.forEach((game, i) => recordCloudGame(game, store, i)); recordCloudGame(catalog[10], store, 100);
  const rows = cloudHistory(catalog, store); assert.equal(rows.length, 24); assert.equal(rows[0].id, '10'); assert.equal(rows.filter(row => row.id === '10').length, 1);
  const stored = JSON.parse(store.getItem('nova_cloud_recent_guest')); assert.equal(stored.length, 24); assert.deepEqual(Object.keys(stored[0]), ['id', 'playedAt']);
});
test('corrupt history and full browser storage cannot block launching a game', () => {
  const store = storage(); store.setItem('nova_cloud_recent_guest', '{bad'); assert.deepEqual(cloudHistory(catalog, store), []); assert.equal(recordCloudGame(catalog[0], store, 1), true);
  store.setItem = () => { throw Error('QuotaExceededError'); }; assert.equal(recordCloudGame(catalog[1], store, 2), false); assert.equal(cloudHistory(catalog, store)[0].id, '0');
  assert.equal(recordCloudGame({ id: '1', kind: 'app' }, store), false);
});
