# Nova Cloud Gaming

The local catalog includes the 275 entries returned by
https://astra-education.top/api/cg/games on October 1, 2026 and all 209 entries in
the Cloud Games collection of GSN's browser-20261001-1 release:
https://gsnproxy.b-cdn.net/releases/browser-20261001-1/?gsnApp=games&consoleOrigin=https%3A%2F%2Fgsnproxy.b-cdn.net
There are 180 shared GSN titles and 29 new entries, giving 304 Nova IDs.
The Astra source library is https://astra-education.top/lite. Its mobile apps are
included alongside games because the complete source catalog was requested.
Identical display names retain distinct IDs and source occurrence positions.

Public/library-cloud.json records source URLs and cover attribution.
Public/cloud-covers holds optimized public covers, limited to 480 px. The 29 new
GSN covers add about 0.5 MB. Covers load lazily and decode asynchronously. Cards
below the screen use content visibility. No game binaries or cloud streams load
while browsing the catalog.

Launches reuse Nova's proxy/player, recent sessions, Resume and split view.
`cloud-providers.js` pauses the player and presents a neutral white glass
“Pick Cloud” dialog only when both providers are available. It shows the game
cover, Astra and Nova Cloud (the display name for the GSN provider). Single-provider titles launch directly. No stream
requests, community pick counts or launch deadline start until a choice is made.
Cancel, Escape and page exit release the pending choice. Choice is not persisted:
resuming a still-mounted session keeps it; reloading returns to the chooser.
GSN launches its public per-game `apps/cloud/index.html?game=<sourceId>` through
the same Nova proxy. Its existing connection/queue/retry/session cleanup flows
remain intact. The GSN player adds small Switch cloud (shared titles only) and
Nova Home controls while loading or after an error. They hide when video playback starts; leaving unloads its page and lets its pagehide handler quit.

Provider metadata is merged into existing Astra IDs so account favorites,
history and popularity counts retain their identities. New IDs use `gsn-`.
Matching normalizes case, punctuation, accents and trademark marks but keeps
sequel numbers and edition names. A verified same-key alias maps GSN's
“Witchers 3” (`jy0091`) to Astra's “The Witcher 3”. Identical Astra names with
multiple IDs keep their original source occurrence and each offer the matching
GSN provider. The 209 original GSN records are in
`scripts/data/gsn-cloud-20261001.json`; rerun `node scripts/import-gsn-cloud.mjs`
to rebuild provider metadata idempotently. Cover downloads are separate.

GSN gateway compatibility (October 1, 2026): the static CDN's
`/releases/browser-20261001-1/api/console-cloud/games` returns 404 when GSN's
hosting bridge is absent. `gsn-cloud-launch.js` retries that read once after
400 ms, then uses the cloud backend declared by GSN's `apps/cloud/cloud.js`:
`https://cherrion.top`. Its published `Launcher-CCf732qv-935383dc.js` supplies
the actual endpoint names: games, createSession, getQueue, startGame,
pingSession and quitSession under `/api/cloud/`. After a successful fallback
catalog read, subsequent requests use those verified routes through Nova's
existing proxy. Only a selected GSN player's exact gateway requests and known
methods are adapted. Cookies/authorization from the CDN are not forwarded to
the different backend. Authentication, membership and provider error responses
remain unchanged; session writes are never automatically replayed by this
adapter. The existing provider's own claim retry rules remain intact.

Nova's loading screen follows GSN's queue and connection status until GSN hides
its boot screen for video playback. The 60-second document deadline is cleared
after the provider boot screen loads; GSN's own session/stream deadlines handle
the remainder. Terminal errors reveal GSN's normal Try again button and Nova's
Switch cloud/Home controls. Observers stop on completion, error, or exit. An
actual GTA V stream was verified at its game menu through Nova, then the test
session was closed. Queue length and video connectivity still depend on the
provider and network. No membership or authentication checks are bypassed.

A cloud-only transport adapter supplies the current URL to React Router's initial
two-argument history.replaceState call. The pinned Scramjet version otherwise
rewrites the omitted URL to /undefined and Astra falls back to its homepage.
The adapter applies only to successful GETs for Astra's math-sheets JS modules;
other sites, session APIs, form submissions and streaming traffic are unchanged.
The source's observed popup overlay script on
pl31545542.profitableratecpmnetwork.com is omitted for cloud players only so it
cannot intercept Play clicks; ordinary provider prompts remain available.
Astra has no normal per-game launch URL. astra-cloud-launch.js waits for the
proxied lite library to hydrate, then selects the requested game in its normal
launch panel and clicks its enabled Play Now button once. The selected launch
panel's X, backdrop clicks and Escape dismissal are disabled; Nova's own exit
controls remain available. Regions, queues, connection checks, login prompts
and errors remain available. No repeated session requests are sent on errors.
The observer stops after 30 seconds if launch is unavailable, or on page exit. This uses no private session API
or embed partner identity. A provider UI/catalog change may require updating
the snapshot or selector. Loading its page does not prove a stream is ready.

Favorites use nova_cloud_favorites_<uid> and are included in existing account
preference sync. Actual stream performance and availability depend on the selected provider.

Clash Royale diagnosis (October 1, 2026): Astra returned the same launch failure
in its own lite page and Nova's player. The optional js.rev.iq/astra-education.top
advertising loader returned 404 and is omitted only for cloud players. The
/api/auth/me 401 is the provider's unauthenticated session check; it remains
unchanged. Libcurl's version banner is informational, not a launch failure.

The stream HUD's Exit keeps Astra's original session-stop handler. After the
stream is removed, the Nova player routes to Home. Embedded players send a
same-origin message to their owning Nova frame; primary and secondary split
players close the split layout and show Home. Standalone players load home.html.


The library uses Nova’s navy glass styling, optimized local cover art, hover/focus titles, token-based search and quick title searches. Recently played stores only IDs and launch timestamps (up to 24) in `nova_cloud_recent_<account>`. It merges existing cloud entries from Nova Home history and refreshes on storage, visibility and page restore events. Standalone, Home and split-screen cloud launches are recorded; failed history writes never prevent launching. No timers, background video or additional remote cover requests are used for the library.

The cloud page uses black neutral glass over the account’s chosen image, video or gradient (black when none is selected). The header and profile dialog reuse Nova cosmetics, role name gradients and live/cached coin balance. Hero covers move in CSS transform-only columns; they pause on hover, focus or hidden pages and stop in reduced-motion/performance modes.

Most Played uses authenticated `cloudPick`/`cloudPopular` actions on the existing owner-control API. Each account is counted once per catalog ID with a transaction; counts are shared across devices/users. Responses expose counts only, not user IDs. Rankings require the existing Firebase server configuration and show an unavailable/empty state when live data cannot load. Guest/local history is never presented as a global user count.
