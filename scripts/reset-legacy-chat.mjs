// This reset deliberately preserves Firebase Auth and novaAccounts.
import {services} from '../server/voice-service.js';
import fs from 'node:fs/promises';
const execute=process.argv.includes('--execute');
if(!process.env.FIREBASE_SERVICE_ACCOUNT_JSON)throw Error('Firebase admin credentials are unavailable. Nothing was deleted.');
const credentials=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);if(credentials.project_id!=='nova-chat-43a18')throw Error('Wrong Firebase project.');
const {db}=await services(false);
const paths=['channels','directMessages','dms','messages','friends','friendRequests','groups','blocked','nicknames','notifications','presence','typing','unreadMessages','streaks'];
console.log(JSON.stringify({project:credentials.project_id,paths,preserves:['Firebase Authentication','novaAccounts','users entries belonging to novaAccounts','novaChatV2'],execute},null,2));
if(execute){const backup={};for(const path of paths)backup[path]=(await db.ref(path).get()).val();const file='chat-legacy-backup-'+Date.now()+'.json';await fs.writeFile(file,JSON.stringify(backup),{flag:'wx',mode:0o600});const accounts=(await db.ref('novaAccounts').get()).val()||{};const users=(await db.ref('users').get()).val()||{};await fs.writeFile('chat-legacy-profiles-backup-'+Date.now()+'.json',JSON.stringify(users),{flag:'wx',mode:0o600});const patch=Object.fromEntries(paths.map(p=>[p,null]));for(const uid of Object.keys(users))if(!Object.hasOwn(accounts,uid))patch['users/'+uid]=null;await db.ref().update(patch);console.log('Legacy chat reset completed. Private backup saved locally.');}else console.log('Dry run. Add --execute to back up and permanently remove only these legacy chat paths.');
