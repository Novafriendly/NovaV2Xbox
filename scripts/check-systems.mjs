import {access,readFile,writeFile} from 'node:fs/promises';
for(const file of ['Public/home.html','Public/search.html','Public/chat.html','Public/ai.html','Public/settings.html','Public/src/search.js','Public/src/xbox-menu.js','Public/~/sj/scram/scramjet.wasm','Public/~/sj/controller/controller.api.js','Public/~/sj/clients/index.js','Public/community-core.js','Public/voice-chat.js','api/ai-chat.js','api/voice.js'])await access(new URL('../'+file,import.meta.url));
console.log('Nova console, search runtime, chat, settings and API files present.');

const wisp=process.env.NOVA_WISP_URL||'';if(wisp&&!/^wss:\/\//.test(wisp))throw Error('NOVA_WISP_URL must be a wss:// address');await writeFile(new URL('../Public/search-config.js',import.meta.url),'window.NOVA_WISP_URL='+JSON.stringify(wisp)+';\n');
