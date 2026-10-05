# Nova Music library and parties

Deploy the updated project to the primary Nova backend before deploying copies. Publish firebase-voice.rules.json so novaMusic remains server-only. No new environment variables are required; the music endpoint uses the existing Firebase service account and shared-backend forwarding.

Music search and streams still use the existing provider. The new Nova library replaces its guest library controls. Signed-in users have private Liked Songs and up to 40 named playlists, with pinning, renaming, removing songs and four-cover artwork. Each list is bounded at 200 tracks.

Listening parties have a random ten-character code, a maximum of five members including the host, and a collaborative queue of up to 100 songs. Only the host can start, pause, seek, advance, reverse and remove members. Kicked members cannot rejoin the same party. Host departure ends the party. Idle members expire after 90 seconds without a heartbeat, and parties expire after six hours. The client remembers the party code per account and reconnects after a reload while membership is still live.

Clients poll every two seconds and heartbeat every 15 seconds. A server clock and round-trip estimate determine track position, and playback drift over 1.2 seconds is corrected after media metadata loads. Each guest may need to click Enable audio to satisfy browser autoplay restrictions. This is position synchronization, not a guarantee of sample-perfect audio across different networks or providers.

music-library-preview.html uses explicitly labeled sample data and no live account writes. It previews Liked Songs, playlists and party controls. Backend tests cover private libraries, membership limits, host permissions, kicking, session expiry and synchronization calculations. Two-device live audio verification requires the endpoint deployment and rules publication; it has not been completed locally.
