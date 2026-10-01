# Nova Cloud Gaming

The local catalog contains every entry returned by
https://astra-education.top/api/cg/games on October 1, 2026: 275 unique IDs.
The source library is https://astra-education.top/lite. Its mobile apps are
included alongside games because the complete source catalog was requested.
Identical display names retain distinct IDs and source occurrence positions.

Public/library-cloud.json records source URLs and cover attribution.
Public/cloud-covers holds optimized public covers: 275 WebP images, about 6.2 MB
in total, limited to 480 px. Covers load lazily and decode asynchronously. Cards
below the screen use content visibility. No game binaries or cloud streams load
while browsing the catalog.

Launches reuse Nova's proxy/player, recent sessions, Resume and split view.
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
preference sync. Actual stream performance and availability depend on Astra.

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
