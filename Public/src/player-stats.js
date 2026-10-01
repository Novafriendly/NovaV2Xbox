// Shared display for the server-verified player summaries in staff panels.
export function playerStats(user){
 const stats=document.createElement('dl');stats.className='player-stats';stats.setAttribute('aria-label','Player progress for '+user.name);
 const icons={coins:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v5c0 4 16 4 16 0V6M4 11v5c0 4 16 4 16 0v-5"/>',level:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>'};
 for(const [key,label]of [['coins','Nova Coins'],['level','Level']]){
  const item=document.createElement('div');item.className='player-stat';
  const term=document.createElement('dt'),value=document.createElement('dd');term.textContent=label;
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.innerHTML=icons[key];
  const valid=Number.isSafeInteger(user[key])&&user[key]>=(key==='level'?1:0);value.textContent=valid?user[key].toLocaleString():'—';
  item.append(icon,term,value);stats.append(item);
 }
 return stats;
}
