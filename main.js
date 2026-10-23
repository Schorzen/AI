import * as THREE from 'three';
import {PointerLockControls} from 'three/addons/controls/PointerLockControls.js';
const $=i=>document.getElementById(i),V=(x,y,z)=>new THREE.Vector3(x,y,z);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9ec5e8);scene.fog=new THREE.Fog(0x9ec5e8,30,110);
const cam=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.05,200);cam.rotation.order='YXZ';scene.add(cam);
const ren=new THREE.WebGLRenderer({antialias:true});ren.setPixelRatio(Math.min(devicePixelRatio,2));ren.setSize(innerWidth,innerHeight);document.body.prepend(ren.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x556655,1.5));const sun=new THREE.DirectionalLight(0xffffff,1);sun.position.set(30,50,20);scene.add(sun);
const ctl=new PointerLockControls(cam,document.body);
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();ren.setSize(innerWidth,innerHeight)});
// ---- map ----
const walls=[],boxes=[];
function box(x,z,w,d,h=3,c=0x777f88){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:c}));m.position.set(x,h/2,z);scene.add(m);walls.push(m);boxes.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2})}
const fl=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshLambertMaterial({color:0x8a8a7a}));fl.rotation.x=-Math.PI/2;scene.add(fl);
const gr=new THREE.GridHelper(80,40,0x666666,0x777777);gr.position.y=.02;scene.add(gr);
box(0,-40,80,1,6);box(0,40,80,1,6);box(-40,0,1,80,6);box(40,0,1,80,6);
[[0,0,10,2],[-15,10,2,10],[15,-10,2,10],[-10,-15,8,2],[10,15,8,2],[0,-25,6,6,3,0x9a7a50],[0,25,6,6,3,0x9a7a50],[-25,0,3,3,2,0x9a7a50],[25,0,3,3,2,0x9a7a50],[-25,-25,4,4,2,0x9a7a50],[25,25,4,4,2,0x9a7a50],[-25,25,4,4,2,0x9a7a50],[25,-25,4,4,2,0x9a7a50]].forEach(a=>box(...a));
function collide(p){for(const b of boxes){const cx=Math.max(b.x0,Math.min(p.x,b.x1)),cz=Math.max(b.z0,Math.min(p.z,b.z1)),dx=p.x-cx,dz=p.z-cz,d=Math.hypot(dx,dz);if(d<.5){if(d>1e-4){p.x+=dx/d*(.5-d);p.z+=dz/d*(.5-d)}else p.x=b.x1+.5}}
 p.x=Math.max(-39,Math.min(39,p.x));p.z=Math.max(-39,Math.min(39,p.z))}
// ---- weapons ----
const W={knife:{n:'Knife',d:55,r:.55,range:2.6,mag:Infinity},pistol:{n:'Pistol',d:26,r:.22,sp:.01,mag:12,rc:.012},shotgun:{n:'Shotgun',d:12,r:.9,sp:.07,pel:8,mag:6,rc:.06,range:35},rifle:{n:'Assault Rifle',d:24,r:.1,sp:.012,mag:30,auto:1,rc:.012},sniper:{n:'Sniper',d:100,r:1.3,sp:0,mag:5,rc:.04}};
const ORDER=['knife','pistol','shotgun','rifle','sniper'],GS={knife:[.04,.04,.4],pistol:[.06,.1,.3],shotgun:[.08,.08,.9],rifle:[.07,.1,.75],sniper:[.06,.08,1.1]};
const gun=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0x222222}));cam.add(gun);
// ---- actors ----
const actors=[],cols=[0xd9534f,0x428bff],ray=new THREE.Raycaster();
let me,remote,conn,online=false,started=false,over=0,rl=0,scoped=false,firing=false,vy=0,tn=0;const wins=[0,0],keys={};
function mk(team,bot,rem){const g=new THREE.Group(),m=new THREE.MeshLambertMaterial({color:cols[team]});
 const body=new THREE.Mesh(new THREE.BoxGeometry(.7,1.1,.4),m);body.position.y=1;
 const head=new THREE.Mesh(new THREE.SphereGeometry(.22,12,8),new THREE.MeshLambertMaterial({color:0xffd7b0}));head.position.y=1.8;head.userData.head=1;
 const legs=new THREE.Mesh(new THREE.BoxGeometry(.6,.5,.35),m);legs.position.y=.25;g.add(body,head,legs);scene.add(g);
 const a={team,bot,remote:rem,g,hit:[body,head,legs],hp:100,p:g.position,w:'rifle',cd:0,react:0,k:0,ammo:{}};
 a.hit.forEach(h=>h.userData.a=a);actors.push(a);return a}
function msg(t){$('msg').textContent=t}
function newRound(){over=0;msg('');rl=0;const c=[0,0];
 actors.forEach(a=>{const i=c[a.team]++;a.hp=100;a.g.visible=!a.isMe;a.cd=0;a.react=0;a.p.set((i-2)*5,0,a.team?-34:34);a.g.rotation.y=a.team?0:Math.PI;for(const k in W)a.ammo[k]=W[k].mag});
 cam.rotation.set(0,me.team?Math.PI:0,0);vy=0}
function start(m,team=1){online=m==='on';me=mk(team);me.isMe=1;
 if(online)remote=mk(1-team,0,1);else{for(let i=0;i<4;i++)mk(team,1).w=Math.random()<.3?'pistol':'rifle';for(let i=0;i<5;i++)mk(1-team,1).w=Math.random()<.3?'pistol':'rifle'}
 $('menu').hidden=true;$('hud').hidden=false;started=true;newRound();setW('rifle');wpnBtns();if(isTouch)$('touch').hidden=false;else if(online)$('pause').hidden=false;else ctl.lock()}
function setW(k){me.w=k;scoped=false;rl=0;gun.scale.set(...GS[k]);gun.position.set(.3,-.25,-.6)}
// ---- combat ----
function tracer(a,b){const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color:0xffee88}));scene.add(l);setTimeout(()=>{scene.remove(l);l.geometry.dispose()},50)}
function los(from,t){const to=t.p.clone();to.y+=1.3;const d=to.sub(from),L=d.length();ray.set(from,d.normalize());ray.far=L;return!ray.intersectObjects(walls).length}
function fire(a,o,dir,k,mul=1){const w=W[k];
 for(let i=0;i<(w.pel||1);i++){const d=dir.clone(),sp=(w.sp||0)+(k==='sniper'&&!(a===me&&scoped)?.07:0);
  d.x+=(Math.random()-.5)*2*sp;d.y+=(Math.random()-.5)*2*sp;d.z+=(Math.random()-.5)*2*sp;d.normalize();ray.set(o,d);ray.far=w.range||200;
  const h=ray.intersectObjects([...walls,...actors.filter(x=>x!==a&&x.hp>0).flatMap(x=>x.hit)])[0];
  if(h){const t=h.object.userData.a;if(t)hurt(t,w.d*mul*(h.object.userData.head?2.5:1)*(k==='shotgun'?Math.max(.15,1-h.distance/35):1),a);if(k!=='knife')tracer(o.clone().add(V(0,-.15,0)),h.point)}}}
function hurt(t,d,by){if(t.hp<=0||over||t.team===by.team)return;if(t.remote){conn&&conn.send({hit:d});return}
 t.hp-=d;if(t===me){$('hurt').style.opacity=1;setTimeout(()=>$('hurt').style.opacity=0,120)}if(t.hp<=0)die(t,by)}
function die(t,by){t.hp=0;t.g.visible=false;by.k++;if(online&&t===me&&conn)conn.send({dead:1});check()}
function check(){if(over)return;const al=[0,0];actors.forEach(a=>a.hp>0&&al[a.team]++);if(al[0]&&al[1])return;over=1;const w=al[1]?1:0;wins[w]++;msg((w?'Blue':'Red')+' wins the round');setTimeout(newRound,3000)}
function playerFire(){const w=W[me.w];if(me.cd>0||rl>0)return;if(me.ammo[me.w]<=0){reload();return}
 me.ammo[me.w]--;me.cd=w.r;const d=new THREE.Vector3();cam.getWorldDirection(d);fire(me,cam.position.clone(),d,me.w);cam.rotation.x+=w.rc||0;gun.position.z=-.45;if(!w.auto)firing=false}
function reload(){if(rl<=0&&me.ammo[me.w]<W[me.w].mag)rl=1.4}
// ---- aim assist: gentle pull toward a target within ~4 degrees of the crosshair ----
function assist(dt){const fwd=new THREE.Vector3();cam.getWorldDirection(fwd);let best,ba=.07;
 for(const t of actors){if(t.team===me.team||t.hp<=0)continue;const to=t.p.clone();to.y+=1.4;to.sub(cam.position).normalize();const ang=Math.acos(Math.min(1,fwd.dot(to)));if(ang<ba&&los(cam.position,t)){ba=ang;best=to}}
 if(best){const k=dt*(scoped?1:2.2)*(1-ba/.07),ty=Math.atan2(-best.x,-best.z),tx=Math.asin(best.y);let dy=ty-cam.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));cam.rotation.y+=dy*k;cam.rotation.x+=(tx-cam.rotation.x)*k}}
// ---- bots ----
function botAI(b,dt){if(b.hp<=0)return;b.cd-=dt;let t,bd=1e9;actors.forEach(e=>{if(e.team!==b.team&&e.hp>0){const d=e.p.distanceTo(b.p);if(d<bd){bd=d;t=e}}});if(!t)return;
 const eye=b.p.clone();eye.y+=1.6;const vis=bd<50&&los(eye,t),a=Math.atan2(t.p.x-b.p.x,t.p.z-b.p.z);b.g.rotation.y=a;
 b.st=(b.st||0)-dt;if(b.st<0){b.st=1+Math.random()*2;b.dir=Math.random()<.5?-1:1}
 const fw=vis?(bd>14?1:bd<8?-.5:0):1,sd=(b.dir||1)*(vis?.8:.5);
 b.p.x+=(Math.sin(a)*fw+Math.cos(a)*sd)*3.2*dt;b.p.z+=(Math.cos(a)*fw-Math.sin(a)*sd)*3.2*dt;collide(b.p);
 if(vis){b.react+=dt;if(b.react>.6&&b.cd<=0){const tc=t.p.clone();tc.y+=1.3;const d=tc.sub(eye).normalize();d.x+=(Math.random()-.5)*.08;d.y+=(Math.random()-.5)*.08;d.z+=(Math.random()-.5)*.08;fire(b,eye,d.normalize(),b.w,.4);b.cd=b.w==='rifle'?.14:.5}}else b.react=0}
// ---- online (PeerJS, 1v1) ----
function wire(){conn.on('data',m=>{if(m.s){remote.p.set(...m.s);remote.g.rotation.y=m.r}if(m.hit)hurt(me,m.hit,remote);if(m.dead)die(remote,me)});conn.on('close',()=>msg('Opponent left'))}
$('host').onclick=()=>{const p=new Peer();$('hostid').textContent='Connecting…';p.on('open',id=>$('hostid').textContent='Your host ID: '+id+' (waiting for opponent)');p.on('connection',c=>{conn=c;wire();c.on('open',()=>start('on',1))})};
$('join').onclick=()=>{const p=new Peer();p.on('open',()=>{conn=p.connect($('jid').value.trim());wire();conn.on('open',()=>start('on',0))})};
$('off').onclick=()=>start('off',1);
// ---- touch controls (landscape phone) ----
const isTouch=matchMedia('(pointer:coarse)').matches,mv={x:0,y:0};
function goFS(){if(isTouch&&!document.fullscreenElement)document.documentElement.requestFullscreen?.().then(()=>screen.orientation?.lock?.('landscape')).catch(()=>{})}
$('menu').addEventListener('click',goFS);
function wpnBtns(){const b=$('wpns');if(b.children.length)return;ORDER.forEach((k,i)=>{const e=document.createElement('button');e.textContent=i+1;e.addEventListener('touchstart',ev=>{ev.preventDefault();setW(k)},{passive:false});b.append(e)})}
if(isTouch){document.body.classList.add('touch');
 const z=$('touch'),st=$('stick'),knob=$('knob'),hold=(id,on,off)=>{const e=$(id);e.addEventListener('touchstart',ev=>{ev.preventDefault();on()},{passive:false});e.addEventListener('touchend',off);e.addEventListener('touchcancel',off)};
 hold('fire',()=>firing=true,()=>firing=false);hold('jump',()=>keys.Space=1,()=>keys.Space=0);hold('rld',reload,()=>{});hold('scp',()=>{if(me.w==='sniper')scoped=!scoped},()=>{});
 let sid=null,lid=null,sx=0,sy=0,lx=0,ly=0;
 z.addEventListener('touchstart',e=>{for(const t of e.changedTouches){if(t.target.closest('button'))continue;
  if(t.clientX<innerWidth/2&&sid===null){sid=t.identifier;sx=t.clientX;sy=t.clientY;st.style.cssText=`left:${sx-50}px;top:${sy-50}px;bottom:auto;opacity:.8`}
  else if(t.clientX>=innerWidth/2&&lid===null){lid=t.identifier;lx=t.clientX;ly=t.clientY}}e.preventDefault()},{passive:false});
 z.addEventListener('touchmove',e=>{for(const t of e.changedTouches){
  if(t.identifier===sid){let dx=(t.clientX-sx)/50,dy=(t.clientY-sy)/50;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}mv.x=dx;mv.y=dy;knob.style.transform=`translate(${dx*30}px,${dy*30}px)`}
  else if(t.identifier===lid){const k=.005*(scoped?.3:1);cam.rotation.y-=(t.clientX-lx)*k;cam.rotation.x=Math.max(-1.4,Math.min(1.4,cam.rotation.x-(t.clientY-ly)*k));lx=t.clientX;ly=t.clientY}}e.preventDefault()},{passive:false});
 const end=e=>{for(const t of e.changedTouches){if(t.identifier===sid){sid=null;mv.x=mv.y=0;knob.style.transform='';st.style.cssText=''}if(t.identifier===lid)lid=null}};
 z.addEventListener('touchend',end);z.addEventListener('touchcancel',end)}
// ---- input ----
ctl.addEventListener('lock',()=>$('pause').hidden=true);ctl.addEventListener('unlock',()=>{if(started)$('pause').hidden=false;firing=false});
$('pause').onclick=()=>ctl.lock();
addEventListener('keydown',e=>{keys[e.code]=1;if(!started||!me)return;const n=+e.key;if(n>=1&&n<=5)setW(ORDER[n-1]);if(e.code==='KeyR')reload()});
addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousedown',e=>{if(isTouch||!ctl.isLocked)return;if(e.button===0)firing=true;if(e.button===2&&me.w==='sniper')scoped=true});
addEventListener('mouseup',e=>{if(e.button===0)firing=false;if(e.button===2)scoped=false});
// ---- loop ----
let last=performance.now(),lf=75;
function loop(t){requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000);last=t;
 if(started){actors.forEach(a=>a.cd-=dt);
  if(me.hp>0&&(isTouch||ctl.isLocked)){const cl=v=>Math.max(-1,Math.min(1,v)),f=cl((keys.KeyW?1:0)-(keys.KeyS?1:0)-mv.y),s=cl((keys.KeyD?1:0)-(keys.KeyA?1:0)+mv.x),y=cam.rotation.y,sp=(me.w==='knife'?7:5.5)*(scoped?.5:1);
   me.p.x+=(-Math.sin(y)*f+Math.cos(y)*s)*sp*dt;me.p.z+=(-Math.cos(y)*f-Math.sin(y)*s)*sp*dt;vy-=22*dt;me.p.y+=vy*dt;
   if(me.p.y<=0){me.p.y=0;vy=keys.Space?7.5:0}collide(me.p);ctl.pointerSpeed=scoped?.3:1;
   if(rl>0){rl-=dt;if(rl<=0)me.ammo[me.w]=W[me.w].mag}assist(dt);if(firing)playerFire()}
  cam.position.set(me.p.x,me.p.y+(me.hp>0?1.65:.4),me.p.z);
  gun.position.z+=(-.6-gun.position.z)*Math.min(1,10*dt);gun.visible=!scoped&&me.hp>0;
  const fov=scoped?20:75;if(fov!==lf){lf=fov;cam.fov=fov;cam.updateProjectionMatrix();$('scope').hidden=!scoped}
  if(!online&&!over)actors.forEach(a=>a.bot&&botAI(a,dt));
  tn+=dt;if(online&&conn&&conn.open&&tn>.05){tn=0;conn.send({s:[me.p.x,me.p.y,me.p.z],r:cam.rotation.y})}
  const w=W[me.w],am=me.ammo[me.w];$('hp').textContent='HP '+Math.max(0,me.hp|0);$('ammo').textContent=w.n+(isFinite(am)?'  '+am+'/'+w.mag:'')+(rl>0?'  reloading':'');
  $('score').textContent=`Red ${wins[0]} : ${wins[1]} Blue   ·   ${window.playerName||'You'}: ${me.k} kills`}
 ren.render(scene,cam)}
requestAnimationFrame(loop);
