# Nova voice setup

The current Chat uses signed-in Nova Firebase accounts. Voice rooms VC#1 and VC#2 are separate, with at most six users each; private calls allow the two invited friends only. Existing Firebase text messages are unchanged. Media travels through WebRTC, not Firebase or the browsing proxy.

## Deployment

1. Deploy this update to Vercel. Keep FIREBASE_SERVICE_ACCOUNT_JSON configured on the server. The existing firebase-voice.rules.json must already be published; its novaVoice and novaVoiceInvites roots remain private (server access only). Do not make those roots public.
2. Configure a real TURN provider with UDP, TCP and TLS support. Set NOVA_TURN_URL to the provider's comma-separated TURN URLs, including its actual `turns:HOST:443?transport=tcp` endpoint if offered. Never substitute an invented hostname or port.
3. For a TURN REST/coturn provider, set NOVA_TURN_SECRET on the server. Nova generates expiring per-user credentials. Otherwise retain the provider's NOVA_TURN_USERNAME and NOVA_TURN_CREDENTIAL on the server. The authenticated join response supplies the browser the credentials it needs; never commit the provider secret to source control.
4. Redeploy after environment changes. Enable microphone/camera permissions for Nova when using those features. Screen sharing always uses the browser's chooser.
5. Sign in to two different Nova accounts. Add each other as friends, then test VC#1, VC#2 and private calls. Confirm both users hear one another, then test camera and screen sharing simultaneously. Test again on the actual permitted school network. Browser/organization policies can still prevent media; this update does not bypass them.

## While playing

Open Chat through Nova Home. The Home shell keeps Chat's iframe alive while games, apps or other Nova panels open. The collapsible top-left call panel provides mute, deafen, camera, screen sharing, open call and leave controls. Home also checks for incoming calls without loading the whole Chat. Reloading/closing Nova, logging out, or navigating outside the Home shell ends the call. For minimal lag, collapse video previews when you do not need them.

## Connection recovery and limits

Calls first try normal ICE connectivity. A failed/timed-out connection automatically retries with TURN relay candidates, up to two times. Missing relay configuration is reported honestly. TURN/TLS must be supported by the provider and permitted by the network; JavaScript alone cannot repair a missing or blocked relay.

The current implementation is bounded peer-to-peer for small rooms. Do not increase room capacity to support large groups: provision an SFU (for example LiveKit) and authenticated room tokens first. Vercel hosts the website/signaling endpoints, not a media relay/SFU.

## Local verification

`node --test --test-isolation=none tests/voice.test.mjs` verifies account permissions, private invitations, room/session ownership, capacity, media-state updates, and TURN credential expiry.

Open `http://localhost:8780/voice-check.html` and click Run verification for two synthetic WebRTC clients. This checks inbound audio packets, decoded camera video, simultaneous screen sharing, stopping sharing, and leaving. It uses generated silent audio/canvas video with an in-memory signaling broker and no real account writes or device permissions. The test pages are disabled outside localhost. This does not replace a two-device test on the actual network.

`http://localhost:8780/chat.html?preview=1` shows sample voice-room participants. Joining from preview is disabled; real calls require signed-in accounts.
