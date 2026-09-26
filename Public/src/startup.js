(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const screen=document.createElement('section');screen.className='startup';screen.setAttribute('aria-label','Nova startup');screen.innerHTML='<video class="startup-video" src="nova-opening.mp4" autoplay muted playsinline preload="auto" aria-label="Nova opening video"></video><div class="startup-halo"></div><div class="startup-brand"><img src="Nova12.png" alt="Nova"><span>N O V A</span></div><div class="startup-caption">YOUR WORLD. READY TO PLAY.</div><div class="startup-progress" role="progressbar" aria-label="Starting Nova" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><form class="startup-form" hidden><h1></h1><p class="startup-hint"></p><label for="startup-input"></label><input id="startup-input" autocomplete="username" maxlength="16" required><p class="startup-error" role="alert"></p><button>Continue <span>→</span></button></form>';document.body.append(screen);const roots=[...document.querySelectorAll('body>header,body>main,#panel,.guide')];roots.forEach(el=>el.inert=true);let mode='username';const form=screen.querySelector('form'),input=form.querySelector('input'),error=form.querySelector('.startup-error');const read=k=>localStorage.getItem(k);function finish(){roots.forEach(el=>el.inert=false);screen.classList.add('leaving');document.querySelector('main').classList.add('arrived');setTimeout(()=>{screen.remove();document.querySelector('nav button[data-page="home"]').focus()},reduced?0:650)}function prompt(which){mode=which;screen.classList.add('setup');form.hidden=false;input.value='';error.textContent='';form.querySelector('h1').textContent=which==='pin'?'Welcome back.':'Make yourself at home.';form.querySelector('.startup-hint').textContent=which==='pin'?'Enter your PIN to open Nova.':'Choose the username your friends will see.';form.querySelector('label').textContent=which==='pin'?'Your 4-digit PIN':'Username';input.type=which==='pin'?'password':'text';input.inputMode=which==='pin'?'numeric':'text';input.maxLength=which==='pin'?4:16;input.autocomplete=which==='pin'?'off':'username';input.focus()}form.onsubmit=e=>{e.preventDefault();const value=input.value.trim();if(mode==='pin'){if(value!==read('nova_pin')){error.textContent='That PIN doesn’t match. Try again.';input.value='';input.focus();return}finish();return}if(!/^[a-zA-Z0-9_ -]{2,16}$/.test(value)){error.textContent='Use 2–16 letters, numbers, spaces, underscores or hyphens.';return}try{localStorage.setItem('nova_user',value);document.getElementById('username').textContent=value;document.querySelector('.avatar').textContent=value[0].toUpperCase();dispatchEvent(new Event('storage'));if(read('nova_pin'))prompt('pin');else finish()}catch{error.textContent='Nova could not save your username. Allow browser storage and try again.'}};const video=screen.querySelector('video');
video.muted=true;video.defaultMuted=true;video.volume=0;
let advanced=false,watchdog,fallbackTimer,frame;
const started=performance.now(),bar=screen.querySelector('.startup-progress i'),progressElement=screen.querySelector('[role=progressbar]');
function enterNova(){
 if(advanced)return;advanced=true;clearTimeout(watchdog);clearTimeout(fallbackTimer);cancelAnimationFrame(frame);video.pause();
 screen.classList.add('intro-ended');
 const user=read('nova_user')||read('nova_username');
 if(!user)prompt('username');else if(read('nova_pin'))prompt('pin');else finish();
}
function fallback(){
 if(advanced||screen.classList.contains('video-fallback'))return;
 clearTimeout(watchdog);video.pause();screen.classList.add('video-fallback');
 const from=performance.now(),duration=reduced?1400:3000;
 function animate(now){if(advanced)return;const amount=Math.min(1,(now-from)/duration);bar.style.transform='scaleX('+amount+')';progressElement.setAttribute('aria-valuenow',Math.round(amount*100));if(amount<1)frame=requestAnimationFrame(animate);else enterNova()}
 cancelAnimationFrame(frame);frame=requestAnimationFrame(animate);
}
function watch(){clearTimeout(watchdog);watchdog=setTimeout(fallback,8000)}
function track(){if(advanced||screen.classList.contains('video-fallback'))return;const fraction=Number.isFinite(video.duration)&&video.duration>0?Math.min(1,video.currentTime/video.duration):0;bar.style.transform='scaleX('+fraction+')';progressElement.setAttribute('aria-valuenow',Math.round(fraction*100));frame=requestAnimationFrame(track)}
video.addEventListener('playing',()=>{if(screen.classList.contains('video-fallback')){video.pause();return}clearTimeout(watchdog);cancelAnimationFrame(frame);frame=requestAnimationFrame(track)});
video.addEventListener('waiting',watch);video.addEventListener('stalled',watch);
video.addEventListener('ended',()=>{if(performance.now()-started<1000)fallback();else enterNova()});
video.addEventListener('error',fallback);
// Reduced motion still gets an opening screen, without the full animated film.
if(reduced)fallback();else{watch();video.play().catch(fallback)}
})();
