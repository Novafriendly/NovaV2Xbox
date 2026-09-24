# Nova Search and console update

Search uses the vendored Scramjet 2.0.67-alpha.2, controller 0.0.14 and libcurl WebAssembly transport 2.0.5. The native curl source archive is not a browser runtime. The source folder and original Nova are preserved.

## Local development
Serve Public over HTTP (not file URLs). Run npm ci --ignore-scripts, then npm run start:transport. The transport listens on 127.0.0.1:8781; Search uses it from 127.0.0.1. Its default allowed page origins are localhost:8780 and 127.0.0.1:8780. Configure NOVA_ALLOWED_ORIGINS when using another origin.

## Vercel
The static proxy and existing AI, voice and moderation APIs deploy with NovaV2. A Wisp transport must run on a host that supports persistent WebSockets; Vercel HTTP functions cannot provide it. Set NOVA_WISP_URL to your dedicated wss:// endpoint and rebuild. Without it, Search uses the original shared Mercury Workshop endpoint. A dedicated host uses server/search-wisp.mjs; set WISP_HOST, WISP_PORT and NOVA_ALLOWED_ORIGINS explicitly for that deployment. Private destinations and non-web ports are blocked.

Google is the default engine. Its bot checks may still appear through a proxy. Search settings also offer Bing, DuckDuckGo and Brave. No CAPTCHA or access-control bypass is implemented.

Chat, guide DMs, images, reports and admin replies reuse the existing Firebase data and moderation checks. Admin actions still require the existing authorized role. Local static preview cannot serve the AI/voice/appeal APIs; use the configured backend deployment for those features.

Startup uses the supplied opening video with sound. If the browser blocks audio autoplay, Start Nova begins it with a user gesture. Reduced-motion users skip the intro. Progress reflects playback, not a fake download percentage.
