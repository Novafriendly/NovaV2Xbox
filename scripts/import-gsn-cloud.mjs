import { readFile, writeFile } from 'node:fs/promises';
import { mergeCloudCatalog } from './cloud-catalog.mjs';
const file = new URL('../Public/library-cloud.json', import.meta.url);
const existing = JSON.parse(await readFile(file, 'utf8'));
const source = JSON.parse(await readFile(new URL('./data/gsn-cloud-20261001.json', import.meta.url), 'utf8'));
const { games, shared, added } = mergeCloudCatalog(existing, source);
await writeFile(file, JSON.stringify(games, null, 2) + '\n');
console.log(`${source.length} GSN games: ${shared} shared, ${added} added; ${games.length} Nova entries.`);
