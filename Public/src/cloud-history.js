// Small, account-scoped history: covers and names stay in the catalog.
const LIMIT = 24;
const account = store => store.getItem('nova_user') || store.getItem('nova_username') || 'guest';
const read = (store, key) => { try { const rows = JSON.parse(store.getItem(key) || '[]'); return Array.isArray(rows) ? rows : []; } catch { return []; } };
export function cloudHistory(catalog, store = localStorage) {
  try {
    const user = account(store), known = new Map(catalog.map(game => [String(game.id), game]));
    const own = read(store, 'nova_cloud_recent_' + user);
    const home = read(store, 'nova-v2-recent-' + user).filter(row => row?.kind === 'cloud');
    const merged = new Map();
    for (const row of [...own, ...home]) {
      if (!row || !known.has(String(row.id))) continue;
      const id = String(row.id), playedAt = Number(row.playedAt);
      if (!Number.isFinite(playedAt) || playedAt < 0) continue;
      if (!merged.has(id) || merged.get(id).playedAt < playedAt) merged.set(id, { ...known.get(id), playedAt });
    }
    return [...merged.values()].sort((a, b) => b.playedAt - a.playedAt).slice(0, LIMIT);
  } catch { return []; }
}
export function recordCloudGame(game, store = localStorage, now = Date.now()) {
  if (!game || game.kind !== 'cloud' || game.id == null) return false;
  try {
    const key = 'nova_cloud_recent_' + account(store), id = String(game.id);
    const rows = read(store, key).filter(row => row && row.id != null && String(row.id) !== id && Number.isFinite(Number(row.playedAt)));
    // Never let a storage failure prevent a game from opening.
    store.setItem(key, JSON.stringify([{ id, playedAt: now }, ...rows.map(row => ({ id: String(row.id), playedAt: Number(row.playedAt) }))].slice(0, LIMIT)));
    return true;
  } catch { return false; }
}
