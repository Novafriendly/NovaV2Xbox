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
