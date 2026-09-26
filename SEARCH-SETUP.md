# Nova connection and loading update

Search, games and apps now share Public/src/connection.js and use /~/sj/. No runtime assets are loaded from the original Nova project. The old Public/nova-proxy folder is excluded from deployment.

## Runtime provenance
Scramjet JavaScript was rebuilt from your supplied scramjet-2.0.67-alpha.2 source. Its missing client.getFlag call in the synchronous-XHR handler is guarded: this alpha does not implement that worker. Retro Bowl and College preload their packaged text data instead. College's missing local save files no longer trigger a network request. Existing local saves are read first and are not cleared.

The matching 2.0.67-alpha.2 release supplies the WASM rewriter and generated binding. Controller 0.0.14 and libcurl-transport 2.0.5 are pinned release builds. The native curl 8.22.0 C source archive is NOT compiled or used as a browser transport: that requires a separate WebAssembly build and browser socket integration. See Public/~/sj/runtime-versions.json for provenance.

## Run locally
Serve Public over HTTP on localhost:8780. Install dependencies with npm ci --ignore-scripts and run npm run start:transport. This applies the Wisp 0.4.1 object-iteration fix before starting the server. Without it, enabling per-host limits crashes Wisp on its first request. Limits, origin checks, private-address restrictions and certificate verification remain enabled. DNS prefers IPv4 for hosts without working IPv6 connectivity.

## Deploy
Run npm run build and deploy NovaV2 to update the static files. This task did not deploy your live website.

Vercel functions do not host the persistent WebSocket transport. Run npm run start:transport on a WebSocket-capable host, put it behind HTTPS/WSS, and set NOVA_ALLOWED_ORIGINS to your Nova origin, WISP_HOST and WISP_PORT for that host. Set NOVA_WISP_URL to its wss:// endpoint in the Vercel build environment, then rebuild. Without a configured endpoint, the existing shared endpoint is used; its performance and TLS errors are outside this static app's control. No endpoint or credentials were supplied for a dedicated deployment.

The route change alone does not fix a school network block, a site's bot checks, or an upstream TLS error. Connection failures get retry/back controls; safe reads retry one transient connection error. Form submissions are never automatically replayed.

## Loading
The opening movie autoplays muted. Failed autoplay, a decode error, an eight-second stall, or reduced-motion preferences show a short silent Nova fallback before username/PIN/Home. Username and PIN setup still run.

The ship uses transform and opacity animations with a smoothly interpolated stage bar and a moving waiting highlight. The loader stays visible for at least 1.4 seconds. The bar represents connection and document-load stages, not a measured download percentage for all third-party game assets. Required blocking-script failures show an error instead of silently displaying an empty player. Reduced-motion preferences disable travel animations.

## Updating a game
Edit Public/content/games/33-ff.html (Retro Bowl) or 34-fixed.html (College); the editable html-main copies are kept in sync for these fixes. Open games through Nova over HTTPS/localhost, not file://. The player fetches local HTML with cache disabled, so reopening uses the current deployed file. Publish the updated Public file to update the live site. Preserve the compatibility script when replacing a GameMaker game wrapper.
