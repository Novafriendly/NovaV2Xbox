(()=>{
 const loading=document.getElementById('loading'),status=document.getElementById('status'),progress=document.getElementById('progress'),retry=document.getElementById('retry');let ready=false;
 const timer=setTimeout(()=>fail('Tunnel Rush could not finish loading. Please retry.'),60000);
 function fail(message){if(ready)return;clearTimeout(timer);status.textContent=message;progress.hidden=true;retry.hidden=false;loading.hidden=false}
 retry.onclick=()=>location.reload();
 try{if(!window.UnityLoader)throw Error('The game loader could not download. Please retry.');window.gameInstance=UnityLoader.instantiate('gameContainer','/content/unity/tunnel-rush/build.json',{onProgress(instance,value){progress.value=value;if(value===1){ready=true;clearTimeout(timer);loading.hidden=true;const canvas=document.querySelector('#gameContainer canvas');if(canvas){canvas.tabIndex=0;canvas.focus();canvas.addEventListener('pointerdown',()=>canvas.focus())}}}})}catch(error){fail(error.message)}
 addEventListener('pagehide',()=>clearTimeout(timer),{once:true});
})();
