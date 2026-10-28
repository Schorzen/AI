/* Per-frame update (step) and the main loop. */
function step(dt){
  if(DUEL.on){duelPre(dt);if(!playing)return}else G.t-=dt;   /* in a duel the round clock comes from the network */
  const fr=G.ph==='freeze',act=P.alive&&!fr&&!P.planting;
  if(!DUEL.on){if(fr&&G.t<=0)goLive();
    if(G.ph==='end'&&G.t<=0){if(G.round>=10){finish();return}G.round++;startRound()}}
  const slow=act?assist(dt,firing||lid!==null):1;
  const sens=cam.fov/BF;P.yaw-=lookX*.0045*slow*sens;P.pitch-=lookY*.0045*slow*sens;lookX=lookY=0;
  P.pitch=Math.max(-1.4,Math.min(1.4,P.pitch));
  if(act){
    let mx=jv.x+(keys.KeyD?1:0)-(keys.KeyA?1:0),mz=jv.y+(keys.KeyW?1:0)-(keys.KeyS?1:0);
    const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml}
    const sp6=6*dt*(1-.4*P.zm),s=Math.sin(P.yaw),c=Math.cos(P.yaw),vx=(-s*mz+c*mx)*sp6,vz=(-c*mz-s*mx)*sp6;
    if(!blocked(P.x+vx,P.z,.4))P.x+=vx;if(!blocked(P.x,P.z+vz,.4))P.z+=vz;
    P.vy-=20*dt;P.y=Math.max(0,P.y+P.vy*dt);if(P.y===0)P.vy=0;
  }
  P.cd-=dt;P.rec=Math.max(0,P.rec-dt*8);
  if(P.rl>0){P.rl-=dt;if(P.rl<=0){P.rl=0;snd(380,.06,'square',.06);const n=Math.min(wp().m-P.am,P.rs);P.am+=n;P.rs-=n}}
  if(!firing)P.lock=false;
  if(act&&firing&&P.cd<=0&&P.am>0&&!P.rl&&!(P.lock&&!wp().a)){shoot();if(!wp().a)P.lock=true}
  const B=G.bomb;
  if(P.planting&&!canPlant()&&!canDefuse()){P.planting=false;P.pl=0}
  if(P.planting){P.pl+=dt;if(canPlant()){if(P.pl>=3.2)plantBomb(siteAt(P.x,P.z),P.x,P.z,true)}else if(P.pl>=5){P.planting=false;P.pl=0;defuse(true)}}
  if(DUEL.on)duelBots(dt);else updBots(dt,G.ph==='live');
  for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.mesh.rotation.y+=dt*1.5;if(d.lock>0)d.lock-=dt;   /* walk over a rifle if your slot is empty or it is better; otherwise tap Pick up */
    if(!d.lock&&P.alive&&G.ph==='live'&&Math.hypot(P.x-d.x,P.z-d.z)<1.6&&(!P.pri||WP[d.wk].p>WP[P.pri].p))takeDrop(d)}
  if(B.ph==='none'&&!B.car&&B.mesh&&G.ph==='live'){const mx=B.mesh.position.x,mz=B.mesh.position.z;   /* walk over the dropped C4 */
    if(PT===0&&P.alive&&Math.hypot(P.x-mx,P.z-mz)<1.5)giveC4(PL);
    else for(const b of bots){if(!b.dead&&!b.team&&Math.hypot(b.position.x-mx,b.position.z-mz)<1.4){giveC4(b);break}}}
  if(B.ph==='planted'&&G.ph==='live'){B.t-=dt;B.bt-=dt;
    if(B.bt<=0){B.bt=Math.max(.12,B.t/40*.9);snd(1000,.04,'sine',.05);B.mesh.led.visible=true;setTimeout(()=>{if(B.mesh)B.mesh.led.visible=false},70)}
    if(B.t<=0)explode()}
  if(G.ph==='live'&&!DUEL.on){
    const ae=alive(1),aa=alive(0);
    if(ae===0)endRound(true,'Counter eliminated');
    else if(B.ph==='none'){if(aa===0)endRound(false,'Cross eliminated');else if(G.t<=0)endRound(false,'Time out')}
  }
  if(asB)asB.vis=1;
  P.kick*=.8;P.fl-=dt;fl.visible=P.fl>0&&P.alive;P.zm+=((P.ads&&P.alive&&!P.rl?1:0)-P.zm)*Math.min(1,dt*12);
  const fv=BF*(1+(ZF[P.wk]/75-1)*P.zm);if(Math.abs(cam.fov-fv)>.05){cam.fov=fv;cam.updateProjectionMatrix()}
  let rs=0;if(P.rl>0){const p=1-P.rl/P.rlT;rs=Math.sin(p*Math.PI);if(!P.rc&&p>.5){P.rc=1;snd(220,.05,'square',.06)}gb.position.y=Math.sin(p*26)*.012*rs}else gb.position.y=0;
  const ks=Math.min(1,Math.tan(fv*Math.PI/360)/Math.tan(37.5*Math.PI/180));
  gun.scale.setScalar(ks);hands.visible=!fpArms&&P.zm<.25;
  gun.position.set(.22*ks*(1-P.zm),-.2*ks*(1-P.zm)+(-TY[P.wk]*ks-.012)*P.zm-.3*ks*rs,-.45+P.kick);gun.rotation.set(.6*rs,0,-.55*rs);
  const scp=P.wk==='sniper'&&P.zm>.85;$('sc').style.opacity=scp?1:0;$('xh').style.visibility=scp?'hidden':'visible';
  gun.visible=P.alive&&!(P.wk==='sniper'&&P.zm>.5);
  P.dmg=Math.max(0,P.dmg-dt*1.2);
  if(P.alive){cam.position.set(P.x,1.7+P.y,P.z);cam.rotation.set(P.pitch,P.yaw,0)}
  else{const al=bots.find(b=>!b.dead&&b.team===PT);if(al){cam.position.set(al.position.x,1.7,al.position.z);cam.rotation.set(0,al.rotation.y+Math.PI,0)}}
  fpUpdate();
  hud();
}
/* ---------- loop ---------- */
cam.position.set(0,2.2,26);
let last=performance.now();
(function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(playing)step(dt);else{cam.rotation.y+=dt*.12;cam.position.set(0,2.2,26)}
  for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.life-=dt;if(s.life<=0){scene.remove(s);sparks.splice(i,1)}}
  for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.life-=dt*1.2;f.scale.setScalar(1+(1-f.life)*16);f.material.opacity=Math.max(0,f.life);if(f.life<=0){scene.remove(f);fx.splice(i,1)}}
  sky.position.copy(cam.position);
  ren.render(scene,cam);
})(last);
/* start the login service once every file above has loaded */
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initFB);else initFB();
