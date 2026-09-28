# Nova connection — Neon Arcade integration

The connection now follows the supplied Neon Arcade bootstrap and same-origin Wisp server. Search, games and apps use /~/sj/ with /api/wisp/ on the same server. The former external/shared transport selection is no longer used. Native curl-master is not compiled by Neon or this build. Published packages are pinned in package.json and restored by npm run build.

Run npm ci --ignore-scripts, npm run build, then npm start. Open http://127.0.0.1:8780/home.html. One process now serves both Nova and its transport. The old separate 8781 service is unnecessary.

api/wisp.js exports the Node HTTP server for Vercel WebSockets. Current Vercel documentation supports this: https://vercel.com/docs/functions/websockets . Deploy the project to apply it; no deployment has been performed here. Connections remain subject to function-duration limits and upstream availability.

The Wisp 0.4.1 per-host stream-limit fix is retained. Private destinations, direct IP destinations, unsupported ports and foreign origins remain blocked. Cross-origin isolation headers match Neon Arcade.

The game loader and muted opening remain in place. The progress bar represents startup stages, not a measured percentage of every game asset. College includes its missing team/schedule files; full compatibility through the new runtime still requires testing.

To update a game, edit its served file in Public/content/games and redeploy. Local HTML is fetched without caching. Keep the bundled compatibility script for Retro Bowl and College when replacing their wrappers.
