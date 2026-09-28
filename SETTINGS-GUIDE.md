# Nova Settings

Settings opens as a floating dialog from Home. The sections are Profile, Appearance, Tab Cloak, Panic Keys, Behaviors, Info, and Data.

## Add your backgrounds

Place JPG, PNG, WebP, GIF, MP4, or WebM files in `Public/backgrounds/` and list them in `Public/backgrounds/presets.json`. See the README in that folder for examples. Video posters are optional, but a small JPG poster makes the picker faster. Existing files and catalog entries are preserved.

## Profiles and accounts

Profile name/photo use the existing private `novaAccounts/{uid}` fields and mirror to `users/{uid}` for Nova’s existing social UI. The description uses `users/{uid}/bio`. Join date comes from the saved creation date or Firebase Authentication creation time. No new database rules are required beyond the account rules already supplied for this project. The existing users rules still apply to the public profile.

GIF uploads up to 70 KB preserve animation. Images up to 5 MB are resized to 180px; use an HTTPS image/GIF link for a larger animated image. This keeps profile records inside their existing 100,000-character limit and reduces database downloads.

Firebase does not provide passwords to clients. Info offers email reveal and password-reset email instead. No passwords are stored or exposed by Settings.

## PIN and activity

Six-digit PINs are a device privacy lock, not a substitute for Firebase authentication. They are salted and derived using PBKDF2-SHA256 (120,000 iterations), scoped by account. Seven failures trigger a five-minute lockout that persists through reloads. Browser-storage access can remove this local lock.

Activity counts are device-local. Browser sessions count Search page openings; games and launch counts are recorded when launching through the library/guide. Existing recent-game records are displayed. Turning off Remember activity stops new activity records.

## Data controls

Export includes only an explicit list of settings, never PIN hashes or Firebase credentials. Destructive device-data reset requires typing RESET and signs the user out. It does not delete the online account, chats, or game saves belonging to other origins, and does not reset Firebase bandwidth.

## Verification

Run `node --test --test-isolation=none tests/settings-pin.test.mjs` to check hashing, PIN changes/removal, seven-attempt persistent lockout, expiry, and account separation. Local browser checks cover overlay open/close, tab switching, immediate clock preference updates, and reset confirmation. Live profile writes and password-reset emails are intentionally not sent during UI verification.
