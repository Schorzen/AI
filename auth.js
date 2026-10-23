import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithPopup,GoogleAuthProvider,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import cfg from './firebase-config.js';
const $=i=>document.getElementById(i),err=e=>$('autherr').textContent=e&&e.code?e.code.replace('auth/','').replace(/-/g,' '):(e||'');
if(cfg.apiKey.startsWith('YOUR_'))err('Add your Firebase config to firebase-config.js');
else{const auth=getAuth(initializeApp(cfg));
 $('g').onclick=()=>signInWithPopup(auth,new GoogleAuthProvider()).catch(err);
 $('si').onclick=()=>signInWithEmailAndPassword(auth,$('em').value.trim(),$('pw').value).catch(err);
 $('su').onclick=()=>createUserWithEmailAndPassword(auth,$('em').value.trim(),$('pw').value).catch(err);
 $('so').onclick=()=>signOut(auth);
 onAuthStateChanged(auth,u=>{window.playerName=u?(u.displayName||u.email.split('@')[0]):null;$('login').hidden=!!u;$('menu').hidden=!u;$('who').textContent=u?'Signed in as '+window.playerName:'';err('')})}
addEventListener('selectstart',e=>{if(!/INPUT/.test(e.target.tagName))e.preventDefault()});
