import {auth} from './account-firebase.js';
import {bridge,completeLogin} from './login-handoff.js';
await auth.authStateReady();
try{await (location.pathname==='/login-bridge.html'?bridge(auth):completeLogin(auth))}catch(error){document.getElementById('status').textContent=error.message||'Could not connect your Nova login.';document.getElementById('continue').hidden=false;document.getElementById('spinner').hidden=true}
