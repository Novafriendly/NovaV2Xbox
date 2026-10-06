import {parseInvite} from './os-feature-core.mjs';
export function appendGameInvite(host,text){
 const key=parseInvite(text);if(!key)return;
 const link=document.createElement('a');link.className='os-invite-link';link.textContent='Open game invite ↗';link.href='/home.html?nova-invite='+encodeURIComponent(key);link.target='_top';host.append(link);
}
