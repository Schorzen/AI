/* Player shooting, reload and aim assist. */
/* ---------- player ---------- */
function spark(p){const m=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.12),new THREE.MeshBasicMaterial({color:0xffa040}));m.position.copy(p);m.life=.15;scene.add(m);sparks.push(m)}
function mark(head){const x=$('xh');x.className=head?'head':'hit';clearTimeout(mark.t);mark.t=setTimeout(()=>x.className='',110)}
function shoot(){
  if(DUEL.on)DUEL.fire++;
  const W=wp();P.cd=W.r;P.am--;P.fl=.05;P.kick=W.a?.05:.09;
  const moving=Math.abs(jv.x)+Math.abs(jv.y)>.1||keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD;
  const sp=(W.s+(moving?(P.wk==='sniper'?.05:.012):0)+(P.wk==='sniper'&&P.zm<.5?.04:0)+P.rec*.004)*(1-.55*P.zm);
  const dir=new V(0,0,-1).applyEuler(cam.rotation);
  dir.x+=(R()-.5)*sp;dir.y+=(R()-.5)*sp;dir.normalize();
  rc.set(cam.position,dir);rc.far=80;
  const h=rc.intersectObjects(solids.concat(botMeshes)).find(x=>{const u=x.object.userData;return !(u.bot&&u.bot.team===PT)});  /* bullets pass through your own squad */
  if(h){const u=h.object.userData;
    if(u.bot){const b=u.bot;
      if(b.remote){if(!b.dead&&DUEL.ph==='live'){sendHit(W.d*(u.head?2.5:1),u.head);mark(u.head);snd(u.head?1300:900,.06,'sine',.08)}}   /* a friend: report the hit */
      else if(b.team!==PT&&!b.dead){lastHead=!!u.head;hurtBot(b,W.d*(u.head?2.5:1),true);mark(u.head);snd(u.head?1300:900,.06,'sine',.08)}}
    else spark(h.point);}
  P.pitch+=W.a?.005:.012;P.yaw+=(R()-.5)*.004;P.rec=Math.min(P.rec+1,6);
  snd(P.wk==='sniper'?90:P.wk==='hc'?130:190,.09,'sawtooth',.1);
  if(P.am<=0)reload();
}
function reload(){if(!P.rl&&P.alive&&P.am<wp().m&&P.rs>0){P.rl=P.rlT=P.wk==='sniper'?2.2:P.wk==='hc'?1.6:1.4;P.rc=0;P.ads=false;snd(300,.12,'square',.04)}}

/* aim assist: gentle pull and slight slowdown near a visible enemy */
const CONE=10*Math.PI/180;let asB=null,asT=0;
const wrap=a=>((a+Math.PI*3)%(Math.PI*2))-Math.PI;
function aimTo(b){const dx=b.position.x-P.x,dz=b.position.z-P.z,dy=1.35-1.7;
  return{y:Math.atan2(-dx,-dz),p:Math.atan2(dy,Math.hypot(dx,dz))}}
function assist(dt,active){
  asT-=dt;
  if(asT<=0){asT=.12;asB=null;let best=CONE;
    for(const b of bots){if(b.dead||b.team===PT||b.visible===false)continue;const a=aimTo(b),ey=wrap(a.y-P.yaw),ep=a.p-P.pitch,e=Math.hypot(ey*Math.cos(P.pitch),ep);
      if(e<best&&los(cam.position,new V(b.position.x,1.35,b.position.z))){best=e;asB=b}}}
  if(!asB||asB.dead){asB=null;$('xh').classList.remove('lock');return 1}
  const a=aimTo(asB),ey=wrap(a.y-P.yaw),ep=a.p-P.pitch,e=Math.hypot(ey*Math.cos(P.pitch),ep);
  if(e>CONE*1.3){asB=null;$('xh').classList.remove('lock');return 1}
  $('xh').classList.add('lock');
  if(active){const k=Math.min(1,dt*3.5*(1-e/(CONE*1.3)));P.yaw+=ey*k;P.pitch+=ep*k}
  return e<CONE*.7?.55:.8;
}
