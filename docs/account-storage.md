# Account storage quota recovery

Full account snapshots, queued cloud updates and private embedded-site session
backups are stored per account in `__nova_account_cache` IndexedDB. Active Nova
preferences still use localStorage so existing games, apps and settings keep
their current interfaces. The duplicate `nova-account-data:<uid>` backup no
longer consumes localStorage's small quota.

On activation, older account and cookie records are copied to IndexedDB and
removed from localStorage only after the transaction commits. Failed migrations
retain the original record; retries preserve any newer IndexedDB snapshot.
Writes are serialized so autosave cannot overtake newer cloud acknowledgements.
Private cookie records remain local and are excluded from cloud uploads.

Game snapshot chunks that encounter QuotaExceededError fall back to the existing
IndexedDB game archive. Old chunks are removed only after the archive commits.
The manifest marks such backups local-only; existing cloud size limits and the
sync status explaining that limitation still apply.

Validation: account-cache and account-data regression tests cover migration,
commit failure/retry, pending changes, cloud retry, separate fresh accounts,
legacy records at quota and game chunk fallback. An isolated real-browser fixture
filled localStorage to its actual limit, reproduced the original snapshot write
failure, and verified offline login plus two-account switching and preserved
settings/game-save values. No production account or user storage was cleared.

## Unreadable IndexedDB value recovery

The profile picker no longer stops on an unreadable account-cache record.
Reads retry once with a fresh database connection. Persistent large-value read
errors or incomplete chunked records can recover from the current account's
active preferences, a readable legacy copy, or that account's cloud backup.
Current game saves, pending changes and the active profile PIN are retained.
An offline switch to a damaged target profile stops before clearing the previous
profile's data. Unrelated storage/permission failures still surface normally.
Data stored only in an unreadable record cannot be guaranteed recoverable.

New account/preference and private controller-cookie snapshots use JSON strings
of at most 8,192 UTF-16 code units in separate IndexedDB records. The manifest
and chunks commit together; an aborted replacement leaves the previous snapshot
intact. Reads use one transaction, validate completeness, and keep legacy
structured-clone records readable. Separate manifest keys leave damaged legacy
IndexedDB values untouched. Replacing a chunked snapshot removes its previous
chunks without reading large legacy values. Cloud limits are unchanged.

Regression tests exercise transient reads, persistent errors, missing chunks,
Unicode snapshots, failed atomic replacements, cloud recovery, offline recovery,
account separation and PIN preservation. An isolated browser origin additionally
round-tripped a 2.2-million-character Unicode snapshot and verified the real
profile picker opened after an incomplete local backup with cloud unavailable.
Only synthetic test storage was used; no user data was cleared.

Browser error semantics reference:
https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/indexeddb/idb_request_loader.cc
