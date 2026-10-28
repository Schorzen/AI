/* Friends, online status, and the party lobby (Firebase Firestore). Everything here needs a signed-in player.
   Collections: players (profile + friend code), presence (last seen), friendships (requests/friends), lobbies (parties). */
let modelsReady=false;
const SO={fdocs:[],friends:[],inReq:[],outReq:[],party:null,inv:[],dismiss:new Set(),tab:'friends',unsubs:[],pu:null,hb:null,ft:null,lastStatus:null,curInv:null};
const ONLINE_MS=75000,PARTY_MAX=4,FRIEND_MAX=30;
const col=n=>fbDb.collection(n),FV=()=>window.firebase.firestore.FieldValue,myId=()=>fbUser&&fbUser.uid;
const isOn=s=>s>0&&Date.now()-s<ONLINE_MS;
const say=t=>{const e=$('fmsg');if(e)e.textContent=t};

/* ---- start / stop (called when you sign in or out) ---- */
function socialStart(){
  socialStop(true);const uid=myId();if(!uid||!fbDb)return;
  beat();SO.hb=setInterval(beat,30000);SO.ft=setInterval(loadFriends,30000);
  SO.unsubs.push(col('friendships').where('members','array-contains',uid).onSnapshot(s=>{SO.fdocs=s.docs.map(d=>Object.assign({id:d.id},d.data()));loadFriends()},()=>{}));
  SO.unsubs.push(col('lobbies').where('invited','array-contains',uid).onSnapshot(s=>onInvites(s.docs.map(d=>Object.assign({id:d.id},d.data()))),()=>{}));
  renderParty();updatePlay();
}
function socialStop(keep){
  SO.unsubs.forEach(f=>{try{f()}catch(e){}});SO.unsubs=[];unwatchParty();clearInterval(SO.hb);clearInterval(SO.ft);
  Object.assign(SO,{fdocs:[],friends:[],inReq:[],outReq:[],party:null,inv:[],lastStatus:null});
  if(!keep){badges();renderParty();renderFriends(true);updatePlay()}
}
function beat(){if(!fbUser||!fbDb)return;const now=Date.now(),p=SO.party;
  col('presence').doc(myId()).set({seen:now}).catch(()=>{});
  if(p&&p.host===myId())col('lobbies').doc(p.id).update({seen:now}).catch(()=>{})}
async function goOffline(){if(!fbUser||!fbDb)return;await leaveParty();await col('presence').doc(myId()).set({seen:0})}
window.addEventListener('pagehide',()=>{if(!fbUser||!fbDb)return;try{col('presence').doc(myId()).set({seen:0});const p=SO.party;if(p&&p.host===myId())col('lobbies').doc(p.id).delete()}catch(e){}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)beat()});

/* ---- friends ---- */
async function loadFriends(){
  if(!fbUser||!fbDb)return;const me=myId(),acc=[],inn=[],out=[];
  (SO.fdocs||[]).forEach(f=>{const o=(f.members||[]).find(x=>x!==me);if(!o)return;const e={id:f.id,uid:o};
    if(f.status==='accepted')acc.push(e);else if(f.from===me)out.push(e);else inn.push(e)});
  await Promise.all([].concat(acc,inn,out).map(async x=>{
    try{const r=await Promise.all([col('players').doc(x.uid).get(),col('presence').doc(x.uid).get()]);
      const d=r[0].exists?r[0].data():{};x.name=String(d.name||'Player');x.xp=+d.xp||0;x.seen=r[1].exists?(+r[1].data().seen||0):0}
    catch(e){x.name='Player';x.xp=0;x.seen=0}}));
  acc.sort((a,b)=>(isOn(b.seen)-isOn(a.seen))||a.name.localeCompare(b.name));
  SO.friends=acc;SO.inReq=inn;SO.outReq=out;renderFriends();badges();
}
async function addFriend(raw){
  const code=String(raw||'').trim().toUpperCase();
  if(code.length!==6)return say('Enter the 6-character friend code.');
  if(code===PR.code)return say('That is your own code.');
  if(SO.friends.length+SO.outReq.length>=FRIEND_MAX)return say('Your friends list is full.');
  try{
    const s=await col('players').where('code','==',code).limit(1).get();
    if(s.empty)return say('No player has that code.');
    const o=s.docs[0].id,fid=[myId(),o].sort().join('_'),ref=col('friendships').doc(fid),ex=await ref.get();
    if(ex.exists){const d=ex.data();return say(d.status==='accepted'?'You are already friends.':d.from===myId()?'Request already sent.':'They already sent you a request. Accept it in Requests.')}
    await ref.set({members:[myId(),o].sort(),from:myId(),status:'pending'});
    say('Request sent to '+String(s.docs[0].data().name||'that player')+'.');
  }catch(e){say('Could not send the request.')}
}
const acceptFriend=id=>col('friendships').doc(id).update({status:'accepted'}).catch(()=>toast('Could not accept',1500));
const removeFriend=id=>col('friendships').doc(id).delete().catch(()=>toast('Could not remove',1500));
function badges(){const n=SO.inReq.length+SO.inv.length,b=$('frbd');b.textContent=n;b.style.display=n?'block':'none'}
function renderFriends(force){
  const box=$('frl');if(!box||(SO.tab==='add'&&!force&&$('fcode')))return;
  ['frt1','frt2','frt3'].forEach((id,i)=>$(id).classList.toggle('on',['friends','req','add'][i]===SO.tab));
  $('frt2').textContent='Requests'+(SO.inReq.length?' ('+SO.inReq.length+')':'');
  let h='';
  if(SO.tab==='friends'){
    if(!SO.friends.length)h='<div class="fe">No friends yet. Open the Add tab and share your friend code.</div>';
    SO.friends.forEach(f=>{const on=isOn(f.seen),inP=SO.party&&SO.party.members&&SO.party.members[f.uid];
      h+='<div class="fr"><i class="dot'+(on?' on':'')+'"></i><span class="nm">'+esc(f.name)+'</span><span class="lv">Lv '+lvInfo(f.xp).l+'</span>'+
        (inP?'<span class="vl">In party</span>':on?'<button class="mini" data-act="inv" data-id="'+esc(f.uid)+'">Invite</button>':'<span class="vl">Offline</span>')+
        '<button class="mini x" data-act="rm" data-id="'+esc(f.id)+'">&times;</button></div>'})}
  else if(SO.tab==='req'){
    SO.inReq.forEach(r=>{h+='<div class="fr"><span class="nm">'+esc(r.name)+'</span><span class="lv">Lv '+lvInfo(r.xp).l+'</span><button class="mini" data-act="acc" data-id="'+esc(r.id)+'">Accept</button><button class="mini x" data-act="rm" data-id="'+esc(r.id)+'">Decline</button></div>'});
    SO.outReq.forEach(r=>{h+='<div class="fr"><span class="nm">'+esc(r.name)+'</span><span class="vl">Request sent</span><button class="mini x" data-act="rm" data-id="'+esc(r.id)+'">Cancel</button></div>'});
    if(!h)h='<div class="fe">No pending requests.</div>'}
  else h='<div class="fe">Your friend code: <b class="code">'+esc(PR.code||'...')+'</b><button class="mini" data-act="copy">Copy</button></div>'+
    '<div class="row"><input id="fcode" placeholder="Friend code" maxlength="6" autocapitalize="characters" autocomplete="off"><button class="pbtn" data-act="add">Add friend</button></div>'+
    '<div class="fe" style="margin-top:8px">Have a party code?</div>'+
    '<div class="row"><input id="pcodein" placeholder="Party code" maxlength="5" autocapitalize="characters" autocomplete="off"><button class="pbtn" data-act="join">Join party</button></div><div id="fmsg" class="fe"></div>';
  box.innerHTML=h;
}
function openFriends(tab){SO.tab=tab||'friends';openM('frm');renderFriends(true);loadFriends()}
function onFriendClick(act,id){
  if(act==='inv')inviteFriend(id);else if(act==='acc')acceptFriend(id);else if(act==='rm')removeFriend(id);
  else if(act==='add'){const e=$('fcode');addFriend(e&&e.value)}
  else if(act==='join'){const e=$('pcodein');joinByCode(e&&e.value)}
  else if(act==='copy'){try{navigator.clipboard.writeText(PR.code);toast('Code copied',1000)}catch(e){}}
}

/* ---- party lobby ---- */
const meEntry=r=>({n:PR.name,l:lvInfo(PR.xp).l,r});
async function ensureParty(){
  if(SO.party)return true;
  try{const ref=col('lobbies').doc(),d={host:myId(),code:randCode(5),status:'open',mode:'bots',members:{[myId()]:meEntry(true)},invited:[],created:Date.now(),seen:Date.now()};
    await ref.set(d);SO.party=Object.assign({id:ref.id},d);SO.lastStatus='open';watchParty(ref.id);renderParty();updatePlay();return true}
  catch(e){toast('Could not create a party',1800);return false}
}
function unwatchParty(){if(SO.pu){try{SO.pu()}catch(e){}SO.pu=null}}
function watchParty(id){
  unwatchParty();
  SO.pu=col('lobbies').doc(id).onSnapshot(s=>{
    if(!s.exists||!s.data().members||!s.data().members[myId()]){
      if(SO.party)toast(s.exists?'You left the party':'The party was closed',1800);
      SO.party=null;SO.lastStatus=null;unwatchParty();renderParty();renderFriends();updatePlay();return}
    const d=s.data(),prev=SO.lastStatus;SO.party=Object.assign({id:s.id},d);SO.lastStatus=d.status;
    if(d.status==='started'&&prev!=='started')startFromParty();
    if(d.status==='open'&&prev==='started'&&myId()!==d.host&&d.members[myId()].r)setReady(false);
    renderParty();renderFriends();updatePlay()},()=>{});
}
function startFromParty(){const p=SO.party;if(playing||!modelsReady)return;if(p&&p.mode==='duel')startDuel(p);else start()}
async function setMode(){const p=SO.party;if(!p||p.host!==myId())return;const to=p.mode==='duel'?'bots':'duel';
  if(to==='duel'&&!fbRtdb)return toast('Duels are not set up yet',2000);
  if(to==='duel'&&Object.keys(p.members||{}).length>2)return toast('A duel is 1v1: only 2 players can be in the party',2500);
  try{await col('lobbies').doc(p.id).update({mode:to})}catch(e){toast('Could not change the mode',1500)}}
async function inviteFriend(uid){
  if(!await ensureParty())return;
  if(Object.keys(SO.party.members||{}).length>=PARTY_MAX)return toast('The party is full',1500);
  try{await col('lobbies').doc(SO.party.id).update({invited:FV().arrayUnion(uid)});toast('Invite sent',1200)}catch(e){toast('Could not invite',1500)}
}
async function joinParty(id){
  if(SO.party)await leaveParty();
  try{await col('lobbies').doc(id).update({['members.'+myId()]:meEntry(false)});watchParty(id);closeM('invm');toast('Joined the party',1500);return true}
  catch(e){toast('Could not join (party full or closed)',2000);return false}
}
async function joinByCode(raw){
  const c=String(raw||'').trim().toUpperCase();if(c.length!==5)return say('Enter the 5-character party code.');
  try{const s=await col('lobbies').where('code','==',c).limit(5).get();
    const d=s.docs.map(x=>Object.assign({id:x.id},x.data())).find(x=>x.status==='open'&&Date.now()-(x.seen||0)<120000);
    if(!d)return say('No open party with that code.');
    if(await joinParty(d.id)){say('');closeM('frm')}}
  catch(e){say('Could not join that party.')}
}
async function leaveParty(){
  const p=SO.party;unwatchParty();SO.party=null;SO.lastStatus=null;
  if(p){try{if(p.host===myId())await col('lobbies').doc(p.id).delete();else await col('lobbies').doc(p.id).update({['members.'+myId()]:FV().delete()})}catch(e){}}
  renderParty();renderFriends();updatePlay();
}
const setReady=r=>{const p=SO.party;if(p)col('lobbies').doc(p.id).update({['members.'+myId()+'.r']:!!r}).catch(()=>{})};
async function partyStart(){const p=SO.party;if(!p||p.host!==myId())return;
  try{await col('lobbies').doc(p.id).update({status:'started',seen:Date.now()})}catch(e){toast('Could not start the party',1500)}}
async function partyReopen(){const p=SO.party;if(!p||p.host!==myId()||p.status!=='started')return;
  try{await col('lobbies').doc(p.id).update({status:'open',seen:Date.now()})}catch(e){}}
function onInvites(list){
  const me=myId();
  SO.inv=list.filter(d=>d.status==='open'&&Date.now()-(d.seen||0)<120000&&!(d.members&&d.members[me])&&!SO.dismiss.has(d.id)&&!(SO.party&&SO.party.id===d.id));
  badges();if(SO.inv.length&&!playing&&$('invm').style.display!=='flex')showInvite();
}
function showInvite(){const i=SO.inv[0];if(!i)return;const h=i.members&&i.members[i.host];SO.curInv=i.id;
  $('invt').textContent=(h?h.n:'A friend')+' invited you to a party ('+Object.keys(i.members||{}).length+'/'+PARTY_MAX+').';openM('invm')}
function slotH(n,l,cls,tag){return '<div class="slot '+cls+'"><i class="av">'+esc(String(n||'?').charAt(0).toUpperCase())+'</i><b>'+esc(n||'')+'</b><small>Lv '+l+(tag?' \u00b7 '+tag:'')+'</small></div>'}
const emptySlot='<button class="slot empty" data-act="open"><i class="av">+</i><b>Invite</b></button>';
function renderParty(){
  const box=$('ptyslots');if(!box)return;const p=SO.party,me=myId();let h='';
  if(!p){h=slotH(PR.name||'You',lvInfo(PR.xp).l,'me','')+emptySlot+emptySlot+emptySlot;$('ptyinfo').style.display='none'}
  else{const ids=Object.keys(p.members||{}).sort((a,b)=>(b===p.host)-(a===p.host));
    ids.forEach(id=>{const m=p.members[id],rdy=id===p.host||m.r;h+=slotH(m.n,+m.l||1,(id===me?'me ':'')+(rdy?'rdy':''),id===p.host?'Host':m.r?'Ready':'')});
    for(let i=ids.length;i<PARTY_MAX;i++)h+=emptySlot;
    $('ptycode').textContent=p.code;$('ptyinfo').style.display='flex';
    const md=$('ptymode');md.textContent=p.mode==='duel'?'Duel 1v1':'Vs bots';md.disabled=p.host!==me}
  box.innerHTML=h;
}
/* ---- the big Play button doubles as Start / Ready in a party ---- */
const partyAllReady=p=>Object.keys(p.members||{}).every(id=>id===p.host||(p.members[id]&&p.members[id].r));
function updatePlay(){
  const b=$('go'),sub=$('gosub'),p=SO.party;let t='Play',dis=false,s='BOMB DEFUSAL \u00b7 5 v 5';
  if(!modelsReady){t='Loading...';dis=true}
  else if(!fbUser){t='Sign in';dis=true}
  else if(!fbUser.emailVerified){t='Verify email';dis=true}
  else if(p){const n=Object.keys(p.members||{}).length;s='PARTY '+n+'/'+PARTY_MAX;
    if(p.host===myId()){const nr=Object.keys(p.members||{}).filter(id=>id!==p.host&&!(p.members[id]&&p.members[id].r)).length;t='Start';dis=nr>0||p.status==='started';if(nr)s+=' \u00b7 '+nr+' NOT READY';
      if(p.mode==='duel'){s='DUEL 1v1 \u00b7 '+n+'/2';if(!fbRtdb){dis=true;s='DUELS NOT SET UP'}else if(n!==2){dis=true;s='DUEL NEEDS 2 PLAYERS'}else if(nr)s+=' \u00b7 NOT READY'}}
    else{const mine=p.members[myId()];t=mine&&mine.r?'Unready':'Ready';dis=p.status==='started';if(p.mode==='duel')s='DUEL 1v1 \u00b7 '+n+'/2'}}
  b.textContent=t;b.disabled=dis;sub.textContent=s;
}
function onPlay(){
  if(!fbUser||!modelsReady)return;const p=SO.party;
  if(!p)return start();
  if(p.host===myId()){if(!partyAllReady(p))return toast('Waiting for everyone to be ready',1200);return partyStart()}
  const mine=p.members[myId()];setReady(!(mine&&mine.r));
}
/* ---- wiring ---- */
$('frb').addEventListener('click',()=>openFriends());
$('frx').addEventListener('click',()=>closeM('frm'));
[['frt1','friends'],['frt2','req'],['frt3','add']].forEach(a=>$(a[0]).addEventListener('click',()=>{SO.tab=a[1];renderFriends(true)}));
$('frl').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act]');if(b)onFriendClick(b.dataset.act,b.dataset.id)});
$('ptyslots').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act]');if(b&&fbUser)openFriends('friends')});
$('ptyleave').addEventListener('click',leaveParty);$('ptymode').addEventListener('click',setMode);
$('invj').addEventListener('click',()=>{if(SO.curInv)joinParty(SO.curInv)});
$('invd').addEventListener('click',()=>{if(SO.curInv)SO.dismiss.add(SO.curInv);closeM('invm');SO.inv=SO.inv.filter(x=>x.id!==SO.curInv);badges();if(SO.inv.length)setTimeout(showInvite,300)});
renderParty();updatePlay();
