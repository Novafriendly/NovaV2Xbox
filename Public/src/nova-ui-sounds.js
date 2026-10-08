let context, lastPlayed=0;
// Short synthesized chime: no download, autoplay loop or background timer.
export function playAppOpenSound(){
  try{
    const levels=JSON.parse(localStorage.getItem('nova_os_audio')||'{}');
    const volume=Math.max(0,Math.min(1,Number(levels.system??0.65)));
    if(!volume||!Number.isFinite(volume)||!navigator.userActivation?.hasBeenActive)return;
    if(performance.now()-lastPlayed<120)return;
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    context??=new Audio();lastPlayed=performance.now();
    const play=()=>{if(context.state!=='running')return;const start=context.currentTime;
      for(const [offset,frequency] of [[0,523.25],[0.055,783.99]]){
        const tone=context.createOscillator(),gain=context.createGain();tone.type='sine';tone.frequency.value=frequency;
        gain.gain.setValueAtTime(0,start+offset);gain.gain.linearRampToValueAtTime(volume*0.045,start+offset+0.012);gain.gain.exponentialRampToValueAtTime(0.0001,start+offset+0.19);
        tone.connect(gain);gain.connect(context.destination);tone.onended=()=>{tone.disconnect();gain.disconnect()};tone.start(start+offset);tone.stop(start+offset+0.2);
      }
    };
    if(context.state==='suspended')context.resume().then(play).catch(()=>{});else play();
  }catch{}
}
