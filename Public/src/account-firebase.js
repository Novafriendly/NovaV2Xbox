import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {getDatabase} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import {automaticLogin} from './login-handoff.js';
export const app=getApps().length?getApp():initializeApp({
  apiKey: 'AIzaSyDV9MRbv7IDXjowddQoXAN1hJPlCGMyxR8',
  authDomain: 'nova-chat-43a18.firebaseapp.com',
  databaseURL: 'https://nova-chat-43a18-default-rtdb.firebaseio.com',
  projectId: 'nova-chat-43a18', storageBucket: 'nova-chat-43a18.firebasestorage.app',
  messagingSenderId: '1090469740208', appId: '1:1090469740208:web:94adbe3ee21abb3cf14575'
});
export const auth=getAuth(app),db=getDatabase(app);
await auth.authStateReady();
await automaticLogin(auth);
