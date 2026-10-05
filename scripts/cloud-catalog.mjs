const origin = 'https://gsnproxy.b-cdn.net';
export const normalizeCloudTitle = name => String(name).replace(/[™®]/g, '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
// These providers use the same upstream game key for this differently named title.
const aliases = new Map([['jy0091', ['Witchers 3', 'The Witcher 3']]]);
export function mergeCloudCatalog(existing, source) {
  const games = existing.filter(game => !String(game.id).startsWith('gsn-') || Object.keys(game.providers||{}).some(id=>id!=='gsn')).map(game => {const providers={...(game.providers||{astra:{url:game.url,name:game.name,sourceOccurrence:game.sourceOccurrence}})};delete providers.gsn;return {...game,providers}});
  const seen = new Set(); let shared = 0;
  for (const entry of source) {
    if (entry.kind !== 'cloud' || !/^cloud-[a-zA-Z]{2}\d+$/.test(entry.id) || seen.has(entry.id)) throw Error('Invalid or duplicate GSN cloud entry.');
    seen.add(entry.id);
    const sourceId = entry.id.slice(6), url = new URL(entry.appPath, origin);
    if (url.origin !== origin || url.pathname !== '/releases/browser-20261001-1/apps/cloud/index.html' || url.searchParams.get('game') !== sourceId) throw Error('Invalid GSN game launch URL.');
    const provider = { url: url.href, name: entry.title.trim(), sourceId, sourceArt: entry.sourceCover || new URL(entry.cover, origin).href };
    const match = games.filter(game => normalizeCloudTitle(game.name) === normalizeCloudTitle(entry.title) || (aliases.get(sourceId)?.[0] === entry.title.trim() && game.id === sourceId && game.name === aliases.get(sourceId)[1]));
    if (match.length) { for (const game of match) game.providers.gsn = provider; shared++; }
    else games.push({ id: 'gsn-' + sourceId, name: entry.title.trim(), art: 'cloud-covers/gsn-' + sourceId + '.webp', url: provider.url, kind: 'cloud', sourceArt: provider.sourceArt, providers: { gsn: provider } });
  }
  if (new Set(games.map(game => game.id)).size !== games.length) throw Error('Cloud catalog IDs must remain unique.');
  return { games, shared, added: source.length - shared };
}
