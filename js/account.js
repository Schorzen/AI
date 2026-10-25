/* Accounts, XP and levels, leaderboard (Firebase Auth + Firestore). Guests are saved on the device. */
const PR={name:'Guest',xp:0,kills:0,wins:0,matches:0},SS={xp:0,kills:0,wins:0,matches:0};   /* PR = totals shown, SS = earned but not saved to the server yet */
let FB_ON=false,fbUser=null,fbAuth=null,fbDb=null,committing=false,matchXP=0,lvStart=1,authMode='in',pendingName='',lbTab='xp';
const lvNeed=l=>100+60*(l-1);   /* XP to go from level l to l+1 */
function lvInfo(xp){let l=1;while(l<100&&xp>=lvNeed(l)){xp-=lvNeed(l);l++}return{l,cur:xp,need:l>=100?1:lvNeed(l)}}
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const zero=o=>{o.xp=o.kills=o.wins=o.matches=0};
function loadGuest(){zero(PR);PR.name='Guest';const g=store.get('cc_guest');if(g)Object.assign(PR,{xp:g.xp|0,kills:g.kills|0,wins:g.wins|0,matches:g.matches|0})}
function persist(){if(fbUser)store.set('cc_pend',Object.assign({uid:fbUser.uid},SS));else store.set('cc_guest',{xp:PR.xp,kills:PR.kills,wins:PR.wins,matches:PR.matches})}
function refreshAcc(){const i=lvInfo(PR.xp);$('accn').textContent=PR.name;$('av').textContent=(PR.name||'G').charAt(0).toUpperCase();$('acclv').textContent='Lv '+i.l;$('accbar').style.width=(i.l>=100?100:i.cur/i.need*100)+'%';
  $('accx').textContent=i.l>=100?'Max level':i.cur+' / '+i.need+' XP to next level';$('accs').textContent=PR.kills+' kills \u00b7 '+PR.wins+' wins \u00b7 '+PR.matches+' matches';
  $('accint').textContent=fbUser?'Sign out':'Sign in';$('lvc').textContent='Lv '+i.l}
let XB={};   /* XP earned this match, by category */
function addXP(n,cat,quiet){const b=lvInfo(PR.xp).l;PR.xp+=n;SS.xp+=n;matchXP+=n;if(cat)XB[cat]=(XB[cat]||0)+n;persist();const a=lvInfo(PR.xp).l;refreshAcc();
  if(!quiet){toast(a>b?'LEVEL UP!  Lv '+a:'+'+n+' XP',a>b?2500:900);if(a>b)snd(900,.3,'sine',.08)}}
function addKillStat(){PR.kills++;SS.kills++;persist()}
/* save what was earned; small chunks so the server rules can cap each write */
async function commit(){
  if(!fbUser||!fbDb||committing)return;committing=true;
  const F=window.firebase.firestore.FieldValue,ref=fbDb.collection('players').doc(fbUser.uid);
  try{while(SS.xp>0||SS.kills>0||SS.wins>0||SS.matches>0){
    const dx=Math.min(SS.xp,1000),dk=Math.min(SS.kills,40),dm=Math.min(SS.matches,1),dw=Math.min(SS.wins,1);
    await ref.update({xp:F.increment(dx),kills:F.increment(dk),matches:F.increment(dm),wins:F.increment(dw),updated:Date.now()});
    SS.xp-=dx;SS.kills-=dk;SS.matches-=dm;SS.wins-=dw;persist()}}
  catch(e){}
  committing=false;
}
async function onUser(u){
  fbUser=u||null;
  if(!u){zero(SS);loadGuest();refreshAcc();return}
  PR.name=(pendingName||u.displayName||'Player').slice(0,16);
  try{
    const ref=fbDb.collection('players').doc(u.uid);let snap=await ref.get();
    if(!snap.exists){await ref.set({name:PR.name,xp:0,kills:0,wins:0,matches:0,updated:Date.now()});snap=await ref.get()}
    const d=snap.data(),p=store.get('cc_pend');zero(SS);if(p&&p.uid===u.uid)Object.assign(SS,{xp:p.xp|0,kills:p.kills|0,wins:p.wins|0,matches:p.matches|0});
    Object.assign(PR,{name:d.name||PR.name,xp:(d.xp|0)+SS.xp,kills:(d.kills|0)+SS.kills,wins:(d.wins|0)+SS.wins,matches:(d.matches|0)+SS.matches});
    refreshAcc();commit();
  }catch(e){refreshAcc();toast('Could not load your profile',2000)}
}
function initFB(){
  const fb=window.firebase;
  if(!fb||!FIREBASE_CONFIG.apiKey)return;
  try{fb.initializeApp(FIREBASE_CONFIG);fbAuth=fb.auth();fbDb=fb.firestore();FB_ON=true;fbAuth.onAuthStateChanged(onUser)}catch(e){FB_ON=false}
}
function authErr(e){const c=(e&&e.code)||'';
  return c.includes('email-already')?'That email is already registered.':c.includes('invalid-email')?'Enter a valid email.':c.includes('weak-password')?'Password must be 6+ characters.':
  c.includes('invalid-credential')||c.includes('wrong-password')||c.includes('user-not-found')?'Wrong email or password.':c.includes('network')?'No connection.':
  c.includes('operation-not-allowed')?'Email sign-in is not enabled yet.':'Could not sign in. Try again.'}
function setAuthMode(m){authMode=m;const up=m==='up';$('authh').textContent=up?'Create account':'Sign in';$('aname').style.display=up?'block':'none';$('authgo').textContent=up?'Create account':'Sign in';$('authsw').textContent=up?'I have an account':'Create account';$('autherr').textContent=''}
async function doAuth(){
  const em=$('aemail').value.trim(),pw=$('apass').value,nm=$('aname').value.trim(),err=$('autherr');err.textContent='';
  if(authMode==='up'&&!/^[A-Za-z0-9_ ]{3,16}$/.test(nm)){err.textContent='Name: 3-16 letters, numbers, _ or spaces.';return}
  if(!em||pw.length<6){err.textContent='Enter your email and a 6+ character password.';return}
  $('authgo').disabled=true;
  try{
    if(authMode==='up'){pendingName=nm;const c=await fbAuth.createUserWithEmailAndPassword(em,pw);try{await c.user.updateProfile({displayName:nm})}catch(e){}}
    else await fbAuth.signInWithEmailAndPassword(em,pw);
    closeM('authm');$('apass').value=''}
  catch(e){err.textContent=authErr(e)}
  $('authgo').disabled=false;
}
async function openLB(tab){
  lbTab=tab||lbTab;openM('lbm');const box=$('lbl');
  $('lbt1').classList.toggle('on',lbTab==='xp');$('lbt2').classList.toggle('on',lbTab==='kills');
  const i=lvInfo(PR.xp);$('lbme').textContent=fbUser?'You: '+PR.name+', Lv '+i.l+', '+PR.xp+' XP, '+PR.kills+' kills':'Sign in to appear on the leaderboard.';
  if(!FB_ON){box.textContent='The leaderboard is not available right now.';return}
  box.textContent='Loading...';
  try{const sn=await fbDb.collection('players').orderBy(lbTab,'desc').limit(20).get();let h='',n=0;
    sn.docs.forEach(d=>{const x=d.data(),xp=+x.xp||0;n++;
      h+='<div class="lbr'+(fbUser&&d.id===fbUser.uid?' me':'')+'"><span>#'+n+'</span><span class="nm">'+esc(String(x.name||'Player').slice(0,16))+'</span><span class="lv">Lv '+lvInfo(xp).l+'</span><span class="vl">'+(lbTab==='xp'?xp+' XP':(+x.kills||0)+' kills')+'</span></div>'});
    box.innerHTML=h||'No players yet. Be the first!'}
  catch(e){box.textContent='Could not load the leaderboard.'}
}
$('accin').addEventListener('click',()=>{if(!FB_ON){toast('Accounts are not available right now',1800);return}
  if(fbUser){fbAuth.signOut()}else{setAuthMode('in');openM('authm')}});
$('acclb').addEventListener('click',()=>openLB());
$('authgo').addEventListener('click',doAuth);
$('authsw').addEventListener('click',()=>setAuthMode(authMode==='in'?'up':'in'));
$('authx').addEventListener('click',()=>closeM('authm'));
$('lbx').addEventListener('click',()=>closeM('lbm'));
$('lbt1').addEventListener('click',()=>openLB('xp'));$('lbt2').addEventListener('click',()=>openLB('kills'));
loadGuest();refreshAcc();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initFB);else initFB();
