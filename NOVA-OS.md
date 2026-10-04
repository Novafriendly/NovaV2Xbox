Nova OS is a second home style. Xbox remains the default existing layout until a user makes their first choice. Both styles use home.html, the same Nova account picker, account save sync, game library, proxy, music player, and voice runtime.

The home chooser appears after the profile picker only when that account has no nova_home_style preference. Settings → Display contains both previews and can change the preference later. The preference is stored through Nova's existing account data sync. If cloud sync is unavailable, it remains saved on the current device.

Nova OS provides a glass taskbar, draggable/resizable windows, minimize and restore, large app windows, a direct-message window using existing Firebase DM paths, friend requests, updates from the existing owner-control public feed and novaChatV2/channels/updates/messages, Nova Personal, and a dedicated player toolbar. Music and chat sessions are retained when switching pages. Closing a player ends its context; Resume can launch it again. Closing Computer sends the existing disconnect request. Fullscreen hides the outer player toolbar.

Reports and suggestions use the existing private staff support inbox and reply notifications. Staff rewards, role changes, Nitro grants and full cosmetic grants also notify the affected account through its private Nova Bot inbox. No separate public inbox or database access has been added.

Publish the updated firebase-voice.rules.json to Firebase Realtime Database for the optional activityId, activityKind, and activityStartedAt presence fields. Until then, presence falls back to the existing title-only shape. All access checks and private message permissions remain in place. These activity fields describe what a user says they are doing; leaderboard time remains server timed.

App activity now contributes to app-specific rankings, starting with this version. Existing minutes and rankings are preserved. Production rankings and public profile statistics still require the existing FIREBASE_SERVICE_ACCOUNT_JSON server configuration.

The audio mixer controls HTML media reachable inside Nova's same-origin player/proxy frames. Browser restrictions and remote game engines can require their own volume controls. It does not promise control over Windows system audio or arbitrary third-party cross-origin frames.

nova-os-preview.html is a labelled sample preview with no Firebase messaging or friend-request writes. Its desktop and window manager are the same implementation used by the authenticated home. Actual conversations and counts are loaded only in normal Nova home.
