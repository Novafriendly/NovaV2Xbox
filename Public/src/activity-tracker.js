(()=>{
const uid=()=>localStorage.getItem('nova_user')||'guest';function record(kind,g){if(localStorage.getItem('nova_remember_activity')==='false')return;const key='nova-activity-'+uid();let data;try{data=JSON.parse(localStorage.getItem(key)||'null')}catch{}data=data||{games:[],launches:0,sessions:0};if(kind==='game'){data.launches++;if(!data.games.includes(g.id))data.games.push(g.id)}else data.sessions++;localStorage.setItem(key,JSON.stringify(data))}
if(location.pathname.endsWith('/search.html'))record('browser');else{const previous=window.novaRecordGame;window.novaRecordGame=g=>{if(localStorage.getItem('nova_remember_activity')==='false')return;previous?.(g);record('game',g)}}
})();
