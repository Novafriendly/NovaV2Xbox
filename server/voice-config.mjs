import {createHmac} from 'node:crypto';
export const PUBLIC_VOICE_ROOMS=['server-vc-1','server-vc-2'];
// Small calls stay bounded; larger rooms require an SFU instead of a growing mesh.
export const roomCapacity=room=>PUBLIC_VOICE_ROOMS.includes(room)?6:2;
export function voiceIceConfig(env,uid,now=Date.now()){
 const iceServers=[{urls:'stun:stun.l.google.com:19302'}];
 const urls=(env.NOVA_TURN_URL||'').split(',').map(s=>s.trim()).filter(s=>/^turns?:[^\s/?]+(?:\?transport=(?:tcp|udp))?$/.test(s));
 let username=env.NOVA_TURN_USERNAME,credential=env.NOVA_TURN_CREDENTIAL;
 if(env.NOVA_TURN_SECRET){username=Math.floor(now/1000+6*3600)+':'+uid;credential=createHmac('sha1',env.NOVA_TURN_SECRET).update(username).digest('base64');}
 if(urls.length&&username&&credential)iceServers.push({urls,username,credential});
 return {iceServers,relayConfigured:iceServers.length>1,relayTls:iceServers.some(s=>[].concat(s.urls).some(u=>u.startsWith('turns:')))};
}
