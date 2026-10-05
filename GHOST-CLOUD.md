# GhostCloud integration

Source: https://ghost-mathmulti.zeoghost.workers.dev/
Catalog snapshot: scripts/data/ghost-cloud-20261004.json (209 games, checked October 4, 2026).

All source keys match existing Nova titles. The catalog therefore stays at 304 cards, with GhostCloud added to the matching provider options. Existing local WebP covers are reused.

GhostCloud supports native /?play=<game_key> links. The shared player opens that link through NovaConnection and Scramjet; it does not bypass the proxy or rewrite GhostCloud session/authentication requests. Known popup advertising scripts are omitted only in cloud players. Streaming availability and queues remain controlled by GhostCloud.

Run `node scripts/import-ghost-cloud.mjs` after replacing the snapshot with an updated public games.json. Imports are idempotent and preserve other providers. The GSN importer also preserves GhostCloud options.

Validation: cloud catalog/provider/transport tests, including selection of the exact GhostCloud game URL, and the normal build. Local browser test reached the selected GTA V session through the proxy.
