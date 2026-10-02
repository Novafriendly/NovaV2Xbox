# Nova Remote · Windows agent

Nova website: https://novaoffical.vercel.app/computer

## Use

Install `NovaRemote.exe` on a Windows computer you own or have permission to control. Open the agent, get a pairing code, enter it in Nova → Computer → Add computer, then confirm your account in the Windows agent. Windows encrypts the device credential; the database stores its hash.

Access starts disabled. Click Enable remote access locally. Sign into the same Nova account in another browser and click Connect. On the Windows computer review the request, Allow this session, then Start screen sharing. The agent stays visible. Disconnect immediately or press Ctrl+Shift+F12 to stop. Closing the agent disables access. Each request expires after 45 seconds; an approved session lasts at most one hour. Disable or remove the computer from Nova to revoke access. Lost server contact stops local input and sharing after ten seconds.

The first version shares the primary Windows display, at up to 1080p/60fps (a target, not a guaranteed frame rate), with keyboard and mouse control. Clipboard, file transfer, unattended access, startup services, and Windows secure-desktop/UAC control are not included. Browsers may reserve some keyboard shortcuts.

## Build

```
cd remote-agent
npm ci
npm run dist
```

The installer is produced at `dist/NovaRemote.exe`. Run `node scripts/package-remote-download.mjs` from the repository root before deploying the website. This publishes two chunks below Git's per-file limit; the download button verifies SHA-256 checksums and reconstructs `NovaRemote.exe`. Packaging does not install or launch the agent. The executable is unsigned; obtain a signing certificate for a production release. No security-warning bypass or automatic installation is implemented.

## Deployment

Keep Nova on Vercel. Deploy the updated website and `/api/remote` function; publish `firebase-voice.rules.json` to the existing Firebase Realtime Database. Keep `FIREBASE_SERVICE_ACCOUNT_JSON` in server environment settings. `novaRemote` is private: browsers and agents go through authenticated API operations, never direct database writes.

Configure a TURN service which supports TLS on port 443 for networks that allow HTTPS but block direct WebRTC. Set `NOVA_TURN_URL` to the provider's actual TURN URLs. Prefer `NOVA_TURN_SECRET` for coturn REST credentials (HMAC credentials expiring with the authorized session); existing `NOVA_TURN_USERNAME` and `NOVA_TURN_CREDENTIAL` are supported as a fallback. STUN alone is not enough on many restricted networks. Nova does not bypass school or device policies. TURN relay bandwidth, availability, and costs are external to Vercel.

Device credentials, pairing tokens, and session signaling must not be logged. Private database records contain ICE addresses as part of connection negotiation; the UI never displays raw IPs or opens inbound remote-control ports. Pairing codes expire in ten minutes, session records in one hour; Nova cleans expired pairing/session/limit records in bounded batches when the computer list is opened (at most once per ten minutes). Add scheduled cleanup if you need retention enforcement even when nobody opens the page. Neither API tokens nor credentials are baked into the agent.

## Verification scope

Server tests cover pairing possession, ownership, revocation, request locking, expiry, bans, signaling direction/limits, and fail-closed database rules. Native input is constrained to validated coordinates/buttons/known keys and only accepted for the approved session. A full two-computer test and a school-network test require deployment, a running agent on the owner PC, and the TURN service; passing unit tests does not prove those network environments work.

Click the browser desktop to lock the mouse; Esc unlocks it. The first click engages control without clicking anything on the remote desktop. Relative mouse movement is supported for games. The connection fills the Computer page; the Fullscreen button expands it further. Actual FPS is displayed in the toolbar and depends on the host GPU/CPU and network. The video sender uses a 24 Mbps maximum; The sender prioritizes maintaining full resolution; congestion and device limits can still reduce delivered FPS. Fullscreen hides the toolbar; Esc leaves fullscreen.
