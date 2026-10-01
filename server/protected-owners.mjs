// Permanent account identities supplied by the site owner. Never match display names.
export const protectedOwnerIds = Object.freeze(["FR37Ekbg1iYz8jVbbiQvHXHSUNQ2", "Te5tfn6BjZaZ3hbqD46oO0hOETo2"]);
export const isProtectedOwner = uid => protectedOwnerIds.includes(uid);
export async function restoreProtectedOwner(db, uid, role) {
  if (!isProtectedOwner(uid)) return;
  const paths = ['novaChatV2/bans/', 'novaChatV2/mutes/', 'novaControl/siteBans/'];
  await Promise.all(paths.map(async path => { const entry = db.ref(path + uid); if ((await entry.get()).exists()) await entry.remove(); }));
  if (role !== 'owner') await db.ref('novaChatV2/roles/' + uid).set('owner');
}
