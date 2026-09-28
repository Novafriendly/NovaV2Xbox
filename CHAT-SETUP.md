# Nova Chat setup

The rebuilt Chat uses Firebase Authentication UIDs and novaAccounts. Chat data lives under novaChatV2; old username-based chat data is not imported. New members appear after opening Chat.

## Preview
http://127.0.0.1:8780/chat.html?preview=1 uses temporary, clearly labeled sample data and is restricted to localhost. It never changes Firebase or grants a real role. Open chat.html without the parameter for your actual account.

## Live setup still required
No Firebase admin credentials were available during implementation. Live deletion, rule deployment, and owner assignment have not been performed.

1. Back up your deployed rules and publish firebase-voice.rules.json in Firebase Realtime Database Rules. The supplied rules disable legacy chat paths and protect the new chat.
2. Configure FIREBASE_SERVICE_ACCOUNT_JSON privately on the server for project nova-chat-43a18. Never put it in Public or commit it.
3. Run `node scripts/reset-legacy-chat.mjs` for a dry run. Run with `--execute` to back up and delete the listed legacy chat paths and old users records with no corresponding novaAccounts entry. Firebase Authentication, new accounts, their mirrored profiles, and novaChatV2 are preserved. Backups contain private data and are gitignored. Do not use the old account reset script for this task.
4. Set a long random NOVA_CHAT_OWNER_CODE privately on the server. Generate one with `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`. Restart localhost or redeploy after environment changes. server.mjs does not automatically load .env files; use environment variables or Node's --env-file option.
5. Sign in with the intended account. In Chat Settings, open Owner setup and enter the code. The server verifies the signed-in account and reserves the first owner atomically. Retrying an interrupted claim from that same account is safe.
6. Remove NOVA_CHAT_OWNER_CODE and restart/redeploy. Owner setup disappears once a role is assigned. The owner can assign admin/moderator roles from member profiles.

## Features and permissions
- Nova server categories: Start here, Community, Feedback, and private Staff lounge. DMs appear only in the direct-message sidebar. The profile controls stay pinned at the bottom.
- Friends, requests, groups, private DMs, message editing/deletion, profile editor, welcome page, Nitro game showcase, and cosmetic gallery.
- Only participants read DMs. Staff may delete server messages, not DMs. The owner manages roles; moderators can ban regular members.
- Reports and suggestions are private forms saved to novaChatV2/feedback/{uid}. Only their sender and the owner can read them. Settings > Owner inbox shows submissions. No email or external message is sent.
- Settings > Server appearance lets the owner change the name, banner URL/upload, and icon. The 40/100 boost bar is decorative, not an actual subscription or purchase count.
- The shop previews 157 supplied cosmetics, with Coming soon labels. Equipping is disabled in both the UI and profile rules; previously selected cosmetics remain. Original files are preserved in Profile; public copies/catalog are in Public/profile-assets.
- Firebase send reservations enforce at least 1.5 seconds between new messages or submissions for each account. The composer adds a 1.8-second cooldown and rejects repeated text for 15 seconds. Message edits are not covered by the new-message cooldown. Publish rules with the client update or sends will fail.
- The welcome page greets each account on its first visit on this device and lists recent members.

## Validation and limits
Preview browser tests cover welcome, fixed layout, sidebar separation, private feedback/inbox, owner server editing, messaging/duplicate protection, group creation, and the preview-only shop. Tests use sample data and do not send live messages. Rule-expression tests check ownership, staff privacy, feedback privacy, and send reservations with local fixtures; they are not Firebase emulator tests. Live Firebase rule enforcement and owner/reset operations remain unverified.

The latest 100 messages are displayed per conversation. Older-history pagination and voice/video calls are not included. The boost display and preview account role are presentation-only.
