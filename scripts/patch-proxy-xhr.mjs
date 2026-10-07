export function patchProxyXHR(source){
 const old='!e.getFlag("syncxhr")';
 if(!source.includes(old))throw Error('Proxy synchronous XHR implementation changed; review the compatibility patch.');
 return source.replace(old,'!e.flagEnabled("syncxhr")');
}
