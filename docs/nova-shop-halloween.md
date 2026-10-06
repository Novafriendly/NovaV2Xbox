# Nova Shop: Halloween season

Deploy the updated main shared backend and frontend together. The first authenticated shop request starts the one-time `2026-halloween-v2` reset: archive every old inventory under the private `novaControl/shopArchives/2026-halloween-v2` node, clear inventories and crate credits, and remove equipped catalog cosmetics from all profiles. Coins, XP/levels, Nitro, and uploaded profile art remain. A server lease blocks shop purchases during preparation; a completed marker prevents future resets. This source update does not itself change the live database.

The same existing cosmetic items are retained. The 15 Halloween items are added from Profile/HalloweenPack. Original artwork is copied unchanged; still WebP thumbnails keep lists and ten-reel openings light. Halloween crates end at midnight immediately after October 31, 2026, America/New_York (2026-11-01T00:00:00-04:00), enforced by the server. After that, owned Halloween cosmetics remain usable and their cosmetic wagers award regular category crates.

Rarity probabilities per opening: Common 80%, Uncommon 18%, Epic 1.9%, Legendary 0.099%, Mythic 0.0009%, Singularity 0.0001%. Items within each tier are equally likely. Regular crates exclude the Halloween collection; the limited crate spans all three cosmetic categories. All six tiers have Halloween rewards.

Black or Red uses a 37-number wheel (0 is green). Colors pay 2x the coin stake total at 18/37 odds; numbers pay 36x total at 1/37 odds. A number-and-color prediction must use the number's real color and has the same 1/37 probability and 36x total payout. Nova Flip and High / Low Dice each have 50% win chances and pay 1.9x total. Wagers are 100–10,000 Nova Coins, capped at 50 coin rounds and 3 cosmetic rounds each Eastern calendar day. A cosmetic loss consumes one copy; a win keeps it and grants 5/5/6/7/8/10 standard category crate credits by rarity. Credits open regular crates at their normal odds; rare outcomes are not guaranteed.

Every outcome uses node:crypto on the authenticated backend. Wallet/inventory changes and receipts commit together in a Firebase transaction. Retries return the same receipt, changed parameters cannot reuse an ID, and concurrent requests cannot double spend. The client locks uncertain wager details until the same receipt can be retried. It never chooses real outcomes. Purchases and wager results can still fail if the main Vercel backend is restricted or unavailable.

Astra's current launch modal lacks the old launch-session-title ID. The adapter now recognizes the selected title in the current dialog, waits for Play Now, and clicks it once. The public live-DOM test intercepted stream launch, so it verifies selection without claiming the provider's actual streaming availability.

Nova OS now uses an invite icon, sends invites into private messages, removes Welcome Back prompts, and includes a compact Today in Shop card that opens the Shop tab.
