import { control } from './control-client.js';
export const loadCloudPopular = () => control('cloudPopular');
export const recordCloudPick = id => control('cloudPick', { id });
