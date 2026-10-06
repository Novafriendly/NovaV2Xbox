# Nova OS additions

Quick Settings is available from the taskbar, or through the Ctrl/Cmd + K command bar. It controls supported Nova audio, visual effects, reduced motion, notification quiet mode, and links to appearance settings and connection status.

The command bar searches cached games, cloud games, apps, friends, and settings. It supports arrow keys, Enter, and Escape. Same-origin app frames forward its shortcut; third-party frames that cannot expose their document retain their own keyboard handling.

The Welcome Back/session restore prompt has been removed at the user's request. Existing windows can still resume within the current desktop session; a refresh opens the desktop without a restore prompt.

Game invites are normal private messages with a validated catalog identifier. Friends can open the same title using the invite link. A game's own lobby or invite code is required to join an actual multiplayer match. Nova does not invent multiplayer support for single-player games.

Connections & downloads reports real player loading messages, supported cloud error dialogs, remote connection updates, and verified Nova Remote download progress. Retry asks before restarting a connection. It does not poll providers or promise that a provider session can be restored.

My account's Showcase editor pins up to three real games. Public profiles and Nova Chat show these favorites. OS profiles also show earned game ranks, level, completed current challenges, and equipped cosmetics. Showcase updates require the existing authenticated owner-control API; a caller cannot pick another user to edit.

Deployment: publish the updated Firebase rules from firebase-voice.rules.json and deploy the frontend and backend updates, including the main shared backend. No additional serverless functions were added (12 total). A restricted Vercel backend still needs to be restored separately.

Verification: node --test --test-isolation=none tests/os-features.test.mjs tests/owner-control.test.mjs tests/nova-os.test.mjs tests/shared-backend.test.mjs tests/vercel-functions.test.mjs tests/remote-video.test.mjs. Run the laptop preview browser test with Playwright available and the local Nova server on port 8790 (or NOVA_PREVIEW_URL): node tests/os-features-ui.cjs.
