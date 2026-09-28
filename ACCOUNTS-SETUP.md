# Firebase account system

The account UI is at Public/account.html. Email/password authentication uses the existing nova-chat-43a18 Firebase project. Profile metadata and onboarding choices live in novaAccounts/{auth.uid}; public display names/photos are mirrored to users/{uid} for existing Nova UI compatibility. Passwords are handled by Firebase Authentication only. Old saved usernames do not count as authenticated sessions.

## Required Firebase setup (not performed)
- Enable Email/Password in Firebase Authentication → Sign-in method.
- Add your deployed hostname and localhost under Authentication → Settings → Authorized domains as needed.
- Publish the updated firebase-voice.rules.json in Realtime Database. Preserve other project rules only after reviewing their compatibility. Existing legacy rules are not comprehensively hardened by this UI change.
- No Firebase admin credential is present locally. No live profiles, chats, or Auth users were deleted.
- Before accepting new accounts, supply FIREBASE_SERVICE_ACCOUNT_JSON through your private environment and run node scripts/reset-legacy-accounts.mjs to inspect the exact reset paths. Run it with --execute to perform the authorized permanent reset. The script verifies the project and stops if new-system accounts already exist. It preserves channel definitions and app configuration; it removes the listed legacy profile/chat/voice data and Auth users. Review any other user-data roots separately.

## Behavior
Sign-up → welcome → profile photo (optional) → appearance (optional) → tab title/icon (optional) → complete → Home. Logging in to a completed account shows its photo and a spinner, then Home. Incomplete accounts resume onboarding. Uploaded photos are resized to a 160px JPEG and stored in the profile; image links must be HTTPS. Preferences are copied to existing local settings on login. The cover wall is CSS animation with reduced-motion support and a pause button.

## Verification limits
The frontend can be previewed locally without admin credentials. Live registration, sign-in, database writes, and permanent deletion must be verified after Firebase setup. Do not describe the reset or live authentication migration as completed before that verification.
