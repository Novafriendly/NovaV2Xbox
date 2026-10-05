export function patchProxyHistory(source){
 const marker='e.Proxy(["History.prototype.pushState","History.prototype.replaceState"],{apply(t){';
 if(!source.includes(marker))throw Error('Proxy history implementation changed; update the compatibility patch.');
 return source.replace(marker,marker+'if(t.args.length<3||t.args[2]==null)return t.call();');
}
