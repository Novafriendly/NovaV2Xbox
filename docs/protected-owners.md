# Protected owner accounts

Protected UIDs: `FR37Ekbg1iYz8jVbbiQvHXHSUNQ2` and `Te5tfn6BjZaZ3hbqD46oO0hOETo2`. Authorization never matches display names. Nova moderation rejects bans, mutes and role changes for these identities regardless of stored role. On an authenticated request the server restores their owner role and clears existing Nova/chat bans and mutes.

Deploy the updated API and publish `firebase-voice.rules.json` in Firebase Realtime Database Rules to activate all layers in production. Direct client writes to their roles and chat bans are independently rejected by the rules. This protects against other Nova owners, not people with Firebase admin credentials or access to alter application code.
