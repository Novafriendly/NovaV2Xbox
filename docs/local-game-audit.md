# Local game audit — October 6, 2026

Checked all **843 local HTML entries**; excluded **15 external-link entries**. All local HTML files now pass the syntax and missing-local-script scan.

This was a bounded startup audit, not a complete playthrough. A visible canvas or Play screen does not prove every level, sound, or control works. Some early browser observations predate the shared fixes; they remain flagged until individually retested.

## Current evidence

- 4 additional emulator titles verified running after repair: Super Mario Bros, Sonic.EXE, Cooking Mama 3, and Zelda: Ocarina of Time.
- 525 entries showed startup screens without captured script errors in their latest recorded check.
- 159 entries have captured issues requiring follow-up or verification after shared fixes.
- 155 entries did not yield enough evidence within the inspection window.

Per-game results: [results.csv](game-audit/results.csv). Raw evidence and screenshots are in the ignored local game-audit directory.

## Repairs applied

- Removed obsolete tracker/redirect wrappers from 760 files and retained no-network analytics callback compatibility. Checked the original tracker blocks to ensure game code was not removed.
- Removed six concatenated duplicate documents. Assigned distinct IDs to three duplicate catalog variants while preserving the original IDs and preventing unintended New badges.
- Fixed missing helper scripts, recovered complete Territorial.io and Sandstone HTML, and restored Vena's asset location/start call. Those latter games still require runtime follow-up; source repair does not imply a complete successful launch.
- Fixed Scramjet's incorrect synchronous-XHR flag API; converted 16 synchronous existence checks to async checks.
- Added standalone host adapters to 58 YouTube exports, 49 Yandex exports, and one Poki export. They keep local saves, do not impersonate platform accounts, and do not award unavailable ad rewards or enable purchases. Fixed 29 early Unity start races.
- Added native launchers for broken legacy Unity cases, AudioWorklet response compatibility, and shared native emulator loading for 38 additional ROM entries with four pinned additional cores. Existing ROM sources and configured save names were retained.

## Verification

30 related regression tests and the production build passed. Representative NES, Sega, DS, and N64 emulators reached running canvases without captured page errors. Existing Pokémon, cloud-provider, Tunnel Rush, and Five Nights at regression checks still pass.

## Remaining limits

Unavailable upstream assets, old platform integrations, large downloads, and games requiring manual interaction remain in the per-game report. BOPCITY became unresponsive during inspection; its native launcher attempt also exceeded the startup window. It is explicitly unconfirmed. All changes are local; no live deployment was performed.

## Repeat the audit

Run `node scripts/audit-local-games.mjs`, then `node tests/local-games-audit.cjs` on localhost. Set `NOVA_AUDIT_WAIT_MS` for a longer startup window. Generated logs are excluded from Git and deployment uploads.
