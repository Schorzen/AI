/* 1v1 duel with a friend (Firebase Realtime Database). One shared match, no bots, first to 5 rounds.
   Each phone moves and shoots for itself and sends its state about 15 times a second. The shooter reports a hit,
   the victim applies it. The host (the party leader) runs the round clock. */
const DUEL={on:false},DUEL_WIN=5,SEND_S=1/15;
const sNow=()=>Date.now()+(DUEL.off||0);   /* server time, so both phones agree on the round clock */
const r2=v=>Math.round(v*100)/100,r3=v=>Math.round(v*1000)/1000;

function startDuel(p){
  if(!fbUser||!fbUser.emailVerified||!modelsReady||playing||!fbRtdb)return;
  const ids=Object.keys(p.members||{});if(ids.length!==2)return;
  const me=fbUser.uid,opp=ids.find(i=>i!==me),idx=me===p.host?0:1;
  closeM('res');closeM('frm');closeM('invm');
  PT=idx;slv.color.set(PT?0x2fa3b5:0xff6a00);matchXP=0;XB={};lvStart=lvInfo(PR.xp).l;refreshAcc();
  bots.forEach(b=>scene.remove(b));bots=[];botMeshes=[];drops.forEach(d=>scene.remove(d.mesh));drops.length=0;
  const B=G.bomb;if(B.mesh){scene.remove(B.mesh);B.mesh=null}Object.assign(B,{ph:'none',car:null});
  Object.assign(P,{kills:0,money:0,ar:0,alive:true,lock:false,pri:'rifle',sec:'pistol',ammo:{},planting:false,pl:0});
  if(FP_ARMS)fpInit();equip('rifle',true);
  Object.assign(G,{round:0,s:[0,0],ph:'freeze',t:4});
  const ref=fbRtdb.ref('duels/'+p.id);
  Object.assign(DUEL,{on:true,id:p.id,idx,me,opp,ref,r:0,ph:'wait',ctl:null,os:null,oAt:performance.now(),t0:performance.now(),tick:0,fire:0,lastF:0,off:0,by:'',bot:null,subs:[],s:[0,0],wr:'',over:false,armed:-1e9});
  $('menu').style.display='none';$('hud').style.display='block';$('dlv').style.display='grid';playing=true;
  fbRtdb.ref('.info/serverTimeOffset').once('value').then(s=>{DUEL.off=+s.val()||0}).catch(()=>{});
  if(idx===0)ref.child('host').set(me).catch(()=>{});
  const on=(q,ev,fn)=>{q.on(ev,fn);DUEL.subs.push(()=>q.off(ev,fn))};
  on(ref.child('p/'+opp),'value',s=>{const v=s.val();if(v){DUEL.os=v;DUEL.oAt=performance.now()}});
  on(ref.child('ctl'),'value',s=>onCtl(s.val()));
  on(ref.child('hit/'+me),'child_added',s=>onHit(s.val()));
  duelSend();try{ref.child('p/'+me+'/gone').onDisconnect().set(1)}catch(e){}
  try{document.documentElement.requestFullscreen?.().catch(()=>{})}catch(e){}
  try{screen.orientation?.lock?.('landscape').catch(()=>{})}catch(e){}
  snd(400,.1,'sine',.05);
}
function duelSend(){
  const D=DUEL;if(!D.ref)return;
  D.ref.child('p/'+D.me).set({x:r2(P.x),z:r2(P.z),y:r2(P.y),yaw:r3(P.yaw),pitch:r3(P.pitch),hp:Math.max(0,Math.round(P.hp)),al:P.alive?1:0,wk:P.wk,f:D.fire,by:D.by||'',rd:D.r,gone:0,n:D.seq=(D.seq|0)+1}).catch(()=>{});   /* n changes every send, so a player standing still still counts as alive */
}
/* called at the start of every frame while a duel runs */
function duelPre(dt){
  const D=DUEL,now=sNow();
  if(D.ctl)G.t=(D.ctl.until-now)/1000;
  D.tick+=dt;if(D.tick>=SEND_S){D.tick=0;duelSend()}
  if(D.idx===0)duelHost(now);
  const t=performance.now(),gone=D.os&&(D.os.gone||t-D.oAt>6000),never=!D.os&&t-D.t0>20000;
  if((gone||never)&&!D.over)duelOppLeft(!!D.os);
}
/* the host writes the round clock; everyone reacts to it in onCtl */
function ctlWrite(c){const D=DUEL,sig=c.ph+':'+c.r;if(D.wr===sig)return;D.wr=sig;D.ref.child('ctl').set(c).catch(()=>{})}
function duelHost(now){
  const D=DUEL,c=D.ctl;
  if(!c){if(D.os)ctlWrite({r:1,ph:'freeze',until:now+4000,s0:0,s1:0,w:-1,k:0,m:0});return}
  if(c.ph==='freeze'){if(now>=c.until)ctlWrite(Object.assign({},c,{ph:'live',until:now+90000}))}
  else if(c.ph==='live'){
    const os=D.os&&D.os.rd===c.r?D.os:null,meDead=!P.alive,opDead=!!os&&os.al===0;let w=null,k=0;
    if(meDead&&opDead)w=-1;else if(meDead){w=1;k=1}else if(opDead){w=0;k=1}
    else if(now>=c.until){const mh=P.hp,oh=os?os.hp:0;w=mh>oh?0:mh<oh?1:-1}   /* time up: more health wins */
    if(w!==null){const s=[c.s0,c.s1];if(w>=0)s[w]++;ctlWrite({r:c.r,ph:'end',until:now+3200,s0:s[0],s1:s[1],w,k,m:(s[0]>=DUEL_WIN||s[1]>=DUEL_WIN)?1:0})}}
  else if(c.ph==='end'&&now>=c.until){
    if(c.m)ctlWrite(Object.assign({},c,{ph:'over',until:now}));
    else ctlWrite({r:c.r+1,ph:'freeze',until:now+3000,s0:c.s0,s1:c.s1,w:-1,k:0,m:0})}
}
function onCtl(c){
  const D=DUEL;if(!D.on)return;
  if(!c){if(D.ctl&&D.ctl.ph==='end'&&D.ctl.m&&!D.over){D.over=true;duelCleanup();finish()}return}   /* the host already tidied up after the last round */
  D.ctl=c;D.s=[c.s0|0,c.s1|0];G.s[D.idx]=D.s[D.idx];G.s[1-D.idx]=D.s[1-D.idx];
  if(c.r!==D.r){D.r=c.r;G.round=c.r;duelSpawn()}
  if(c.ph!==D.ph){D.ph=c.ph;
    if(c.ph==='freeze'){G.ph='freeze';banner('Round '+c.r)}
    else if(c.ph==='live'){G.ph='live';banner('Go');snd(500,.1,'sine',.06)}
    else if(c.ph==='end'){G.ph='end';const me=c.w===D.idx;banner(c.w<0?'Draw':me?'Round won':'Round lost');
      if(me){addXP(25,'Rounds won');if(c.k){P.kills++;addKillStat()}}}
    else if(c.ph==='over'&&!D.over){D.over=true;duelCleanup();finish()}}
}
function duelSpawn(){
  const D=DUEL,top=(D.idx===0)!==(D.r%2===0),mine=top?[0,30,0]:[0,-30,Math.PI],theirs=top?[0,-30]:[0,30];   /* the two ends swap every round */
  Object.assign(P,{alive:true,hp:100,ar:0,x:mine[0],z:mine[1],y:0,vy:0,yaw:mine[2],pitch:0,rl:0,cd:0,dmg:0,ads:false,zm:0,pri:'rifle',sec:'pistol',ammo:{}});
  equip('rifle',true);gun.visible=true;D.by='';
  if(D.bot)scene.remove(D.bot);bots=[];botMeshes=[];
  mkBot(theirs[0],theirs[1],1-PT,'rifle',false);D.bot=bots[bots.length-1];
  D.bot.remote=true;D.bot.visible=false;D.bot.rotation.y=theirs[1]>0?Math.PI:0;
}
/* the friend's soldier: follows the state they send, no AI */
function duelBots(dt){
  const D=DUEL,b=D.bot,os=D.os;if(!b)return;
  if(os&&os.rd===D.r&&D.r>0){
    b.visible=true;const px=b.position.x,pz=b.position.z,k=Math.min(1,dt*14);
    if(!b.seen){b.position.x=os.x;b.position.z=os.z;b.seen=true}else{b.position.x+=(os.x-px)*k;b.position.z+=(os.z-pz)*k}
    const sp=Math.hypot(b.position.x-px,b.position.z-pz)/Math.max(dt,.001);b.moved=sp>.8;if(b.moved)b.ph+=sp*dt*3.2;
    b.rotation.y+=wrap(os.yaw+Math.PI-b.rotation.y)*k;
    if(!os.al&&!b.dead){b.dead=true;b.rotation.x=-Math.PI/2;b.position.y=.3;botMeshes=botMeshes.filter(m=>m.userData.bot!==b)}
    if(os.f!==D.lastF){D.lastF=os.f;const d=Math.hypot(P.x-b.position.x,P.z-b.position.z);snd(190,.09,'sawtooth',Math.max(.01,.1-d*.0025));spark(new V(b.position.x,1.4,b.position.z))}
  }
  if(b.dead)return;
  b.amp+=((b.moved?1:0)-b.amp)*Math.min(1,dt*8);b.moved=false;
  if(b.rig)poseBot(b);
  else if(b.l1){const sw=Math.sin(b.ph)*.7;b.l1.rotation.x=sw;b.l2.rotation.x=-sw;b.body.position.y=Math.abs(Math.sin(b.ph))*.05}
  else{b.body.position.y=Math.abs(Math.sin(b.ph))*.05*b.amp;b.body.rotation.z=Math.sin(b.ph)*.05*b.amp}
}
/* hits: I report mine, I apply the ones against me */
function sendHit(dmg,head){const D=DUEL;D.ref.child('hit/'+D.opp).push({f:D.me,d:Math.round(dmg),h:head?1:0}).catch(()=>{})}
function onHit(h){if(!h||!DUEL.on||DUEL.ph!=='live'||!P.alive)return;DUEL.by=h.f;hurtP(Math.min(270,+h.d||0))}
function duelOppLeft(started){
  const D=DUEL;if(D.over)return;D.over=true;toast(started?'Your friend left the match':"Your friend didn't connect",2500);
  duelCleanup();
  if(started&&D.r>0){G.s[D.idx]=Math.max(G.s[D.idx],DUEL_WIN);finish()}else finish('quiet');
}
function duelCleanup(){
  const D=DUEL;D.subs.forEach(f=>{try{f()}catch(e){}});D.subs=[];
  try{D.ref.child('p/'+D.me+'/gone').onDisconnect().cancel()}catch(e){}
  if(D.idx===0&&D.ref){const ref=D.ref;setTimeout(()=>{try{ref.remove()}catch(e){}},6000)}   /* host removes the duel data a bit later, so the friend still sees the end */
  D.on=false;$('dlv').style.display='none';if(D.bot)scene.remove(D.bot);D.bot=null;bots=[];botMeshes=[];
}
function duelLeave(){const D=DUEL;if(!D.on||D.over)return;D.over=true;try{D.ref.child('p/'+D.me+'/gone').set(1)}catch(e){}duelCleanup();finish(true)}
$('dlv').addEventListener('click',()=>{const D=DUEL;
  if(performance.now()-D.armed<3000){duelLeave();return}
  D.armed=performance.now();$('dlv').textContent='Tap again to leave';setTimeout(()=>{$('dlv').textContent='Leave'},3000)});
