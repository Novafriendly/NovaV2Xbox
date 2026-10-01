import { readFile } from 'node:fs/promises';
let catalog;
const titles = async () => catalog ||= JSON.parse(await readFile(new URL('../Public/library-cloud.json', import.meta.url), 'utf8'));
export async function cloudPopular(db, uid, action, body = {}) {
  const games = await titles(), known = new Set(games.map(game => String(game.id)));
  if (action === 'cloudPick') {
    const id = String(body.id || '');
    if (!known.has(id)) throw Error('Choose a game from the cloud library.');
    const result = await db.ref('novaControl/cloudPopular/' + id).transaction(record => {
      record ||= { users: {}, count: 0 }; record.users ||= {};
      if (Object.hasOwn(record.users, uid)) return;
      record.users[uid] = true;
      record.count = (Number.isSafeInteger(record.count) && record.count >= 0 ? record.count : 0) + 1;
      return record;
    });
    return { ok: true, count: result.snapshot.val()?.count || 0 };
  }
  const records = (await db.ref('novaControl/cloudPopular').get()).val() || {};
  return { rankings: Object.entries(records).filter(([id, value]) => known.has(id) && Number.isSafeInteger(value?.count) && value.count > 0).map(([id, value]) => ({ id, users: value.count })).sort((a, b) => b.users - a.users || a.id.localeCompare(b.id)).slice(0, 10) };
}
