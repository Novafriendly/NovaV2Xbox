# Achroma cloud sources

Source page: https://cdn.jsdelivr.net/gh/achroma-ubg/svg@latest/pages/games.html
Checked October 5, 2026. Public snapshots are saved in scripts/data/achroma-cloud-20261004.json and achroma-synapse-20261004.json.

Stratus: 225 titles, 210 matching Nova cards, 15 new cards.
Synapse: 184 titles, 10 matching cards, 174 new cards. Different package IDs for regional editions retain separate cards.
Total Nova cloud catalog: 493 unique cards. New covers are local resized WebP images.

The shared provider picker opens the source page through NovaConnection/Scramjet. The Achroma adapter waits for native event handlers, switches to Cloud and the requested source, searches the native library, and clicks only the exact source game ID once. Native provider code owns queue, session allocation, heartbeat, stream and cleanup. Nested cloud players fill the available space. Cancellation/page exit releases adapter timers and observers.

The CDN serves the HTML entry as text/plain. The transport sets text/html only for this exact entry and only in Achroma cloud players. Other URLs and responses are unchanged.

Refresh snapshots and run node scripts/import-achroma-cloud.mjs to update provider mappings. Imports preserve identities, other providers and existing cover paths. Download and optimize any new covers before publishing.

Validation: 34 cloud tests and normal build passed. A local GTA V Stratus launch reached the provider stream through the proxy. Synapse selected Brawl Stars, initialized a session and joined its room, but its player reported Unable to Join Session. Mobile gameplay is therefore not confirmed. Both test tabs were closed to release their sessions. Provider queue availability and service limits remain external.
