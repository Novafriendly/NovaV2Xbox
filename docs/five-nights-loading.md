# Five Nights at loading fixes

All 16 matching catalog titles use their exact same-origin game wrappers rather than proxy rewriting their runtimes. The 11 Clickteam archive ports share a bounded three-file downloader, explicit download/extraction progress, pinned sources and fallback file mirrors, local JSZip and per-title runtimes. Large archives still require the upstream game downloads on first launch. Downloads are aborted on close and blob resources are released.

Freddy's 1 now points to its own game instead of Ultimate Custom Night. Winston's no longer requests the missing /FNAW/runtime.js file. Frickbear's uses matching runner/assets commit and handles fullscreen exit when no fullscreen element is active. The remaining Unity/Clickteam fan wrappers retain their game configuration, use native loading and show failures rather than swallow them.

Run node scripts/vendor-five-nights.cjs to reproduce the pinned runtime files. Embedded runtime and JSZip license notices remain intact.
