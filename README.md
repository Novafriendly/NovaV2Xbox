# NovaV2 — systems for your new UI

Public contains the retained chat, voice chat, AI, settings, Firebase/profile and account helpers. These keep the original data keys and Firebase project. Settings assets and legal pages remain because the retained settings page uses them. nova-music-wallpaper.js remains only because AI uses it for wallpaper.

The old home, games, apps, browser, music and proxy have been removed from the public site. Build your new home/index and navigation separately. Existing Back to Home actions target home.html; embedded pages send their existing postMessage events to your new shell. Home notification, onboarding and personal/profile helpers are available to integrate into that shell. No old home UI is included.

api and server contain retained backend services. Keep secrets in Vercel environment variables. Use npm ci --ignore-scripts and npm run build. Vercel publishes Public.

_migration-backup holds the removed copied files for recovery; it is excluded from Git and Vercel. Your original root source folders and original Nova project are untouched. Browser preferences require the same origin to carry over.
