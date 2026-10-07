# New library badges

Games and apps have a New badge for seven days after addition. Existing titles were baselined without a badge. The build records new IDs in Public/library-added.json; commit that file along with catalog changes to preserve dates across deployments, especially on shallow Git checkouts. Run npm run catalog:stamp before committing new titles. Git introduction dates are used when available, or an explicit addedAt ISO date on a catalog entry. Updating a title or restoring a removed ID does not reset its recorded date.
