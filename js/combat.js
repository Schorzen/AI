/* Damage, kills, line of sight, the C4 (plant, drop, defuse, explode) and dropped weapons. */
function pickW(m){m*=.8+R()*.4;return m>=4750&&R()<.25?'sniper':m>=2700?'rifle':m>=1200?'smg':m>=900&&R()<.5?'hc':'pistol'}
function hurtBot(b,dmg,byP){if(b.dead)return;if(b.ar>0){dmg*=.6;b.ar-=dmg}b.hp-=dmg;if(b.hp<=0)killBot(b,byP)}
function killBot(b,byP){
  b.dead=true;b.rotation.x=-Math.PI/2;b.position.y=.3;
  if(byP){P.kills++;P.money=Math.min(9000,P.money+300);addKillStat();addXP(10+(lastHead?5:0),'Kills')}
  botMeshes=botMeshes.filter(m=>m.userData.bot!==b);
  dropLoot(b,b.position.x,b.position.z,b.wk);
  setTimeout(()=>scene.remove(b),2500);
}
function hurtP(dmg){
  if(!P.alive)return;
  if(P.ar>0){dmg*=.6;P.ar=Math.max(0,P.ar-dmg)}
  P.hp-=dmg;P.dmg=.7;snd(120,.15,'square',.1);
  if(P.hp<=0){P.alive=false;firing=false;gun.visible=false;dropLoot(PL,P.x,P.z,P.pri);if(G.ph==='live')banner('You died')}
}
function los(from,to){const d=to.clone().sub(from),l=d.length();rc.set(from,d.normalize());rc.far=l;return rc.intersectObjects(solids).length===0}
function mv(b,vx,vz){let m=false;
  if(!blocked(b.position.x+vx,b.position.z,.45)){b.position.x+=vx;m=true}
  if(!blocked(b.position.x,b.position.z+vz,.45)){b.position.z+=vz;m=true}
  if(m){b.ph+=.16;b.moved=true}return m}
const tpos=o=>o===PL?{x:P.x,z:P.z,y:1.7+P.y}:{x:o.position.x,z:o.position.z,y:1.6};
function foes(b){const c=bots.filter(o=>!o.dead&&o.team!==b.team);if(b.team!==PT&&P.alive)c.push(PL);return c}
function bshoot(b,tg,d){
  const dmg=b.w.d*(.8+R()*.4);
  if(R()<Math.max(.1,.55-d*.014)*b.acc){if(tg===PL)hurtP(dmg);else hurtBot(tg,dmg,false)}
  else if(tg===PL)snd(150,.06,'sawtooth',.03);
}
const fx=[];
function siteAt(x,z){for(const k in SITE)if(Math.hypot(x-SITE[k].x,z-SITE[k].z)<6.5)return k;return null}
function canPlant(){return P.alive&&PT===0&&G.bomb.car===PL&&G.ph==='live'&&G.bomb.ph==='none'&&!!siteAt(P.x,P.z)&&P.y===0}
function canDefuse(){const B=G.bomb;return P.alive&&PT===1&&G.ph==='live'&&B.ph==='planted'&&Math.hypot(P.x-B.x,P.z-B.z)<2.2&&P.y===0}
const c4M=new THREE.MeshLambertMaterial({color:0x3a4a2a}),c4D=new THREE.MeshBasicMaterial({color:0x0b160b});
/* tall glowing marker for dropped items */
const beaM=new THREE.MeshBasicMaterial({color:0xffa040,transparent:true,opacity:.4,depthWrite:false,blending:THREE.AdditiveBlending});
function beacon(g,h){const m=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,h,6,1,true),beaM);m.position.y=h/2;g.add(m);const r=new THREE.Mesh(new THREE.RingGeometry(.45,.6,20),beaM);r.rotation.x=-Math.PI/2;r.position.y=.04;g.add(r)}
function mkC4(x,z,bc){
  const g=new THREE.Group(),a=(geo,m,px,py,pz)=>{const o=new THREE.Mesh(geo,m);o.position.set(px,py,pz);g.add(o);return o};
  a(BG(.6,.16,.4),c4M,0,.08,0);a(BG(.62,.165,.08),go,0,.082,.1);a(BG(.24,.02,.12),c4D,-.1,.17,-.05);
  const led=a(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:0xff2020}),.18,.19,-.05);
  a(BG(.02,.02,.3),mG,-.22,.17,.05);if(bc)beacon(g,6);g.position.set(x,0,z);g.led=led;scene.add(g);return g;
}
function plantBomb(site,x,z,byP){
  const B=G.bomb;if(B.ph!=='none'||G.ph!=='live')return;
  if(B.car&&B.car!==PL)dropPack(B.car);
  Object.assign(B,{ph:'planted',t:40,site,x,z,df:0,bt:0,car:null});B.mesh=mkC4(x,z);
  bots.forEach(b=>{b.wy=null;b.pl=0});
  if(byP){P.money=Math.min(9000,P.money+300);addXP(15,'Objectives')}P.planting=false;P.pl=0;
  banner('Bomb planted at '+site);snd(180,.4,'square',.1);
}
/* ---- C4 carrier and dropped items ---- */
const drops=[];
function addPack(b){const m=new THREE.Mesh(BG(.34,.14,.22),c4M);m.position.set(0,1.3,-.3);b.body.add(m);b.pack=m}
function dropPack(b){if(b.pack){b.body.remove(b.pack);b.pack=null}}
function giveC4(o){const B=G.bomb;B.car=o;if(B.mesh){scene.remove(B.mesh);B.mesh=null}if(o===PL)banner('You picked up the C4');else addPack(o);snd(600,.07,'sine',.06)}
function dropWeapon(wk,x,z,ammo,lock){const g=new THREE.Group(),m=GB[wk].clone(true);m.visible=true;m.rotation.z=Math.PI/2;m.position.y=.14;g.add(m);beacon(g,3);g.position.set(x,0,z);scene.add(g);drops.push({wk,x,z,mesh:g,ammo,lock:lock||0})}
function nearDrop(){let best=null,bd=2.2;for(const d of drops){if(d.lock>0||d.wk===P.pri)continue;const q=Math.hypot(P.x-d.x,P.z-d.z);if(q<bd){bd=q;best=d}}return best}
function takeDrop(d){const i=drops.indexOf(d);if(i<0)return;
  if(P.pri){const old=P.pri;dropWeapon(old,P.x,P.z,P.wk===old?[P.am,P.rs]:P.ammo[old],1.5)}   /* your old rifle drops at your feet */
  drops.splice(i,1);scene.remove(d.mesh);P.pri=d.wk;P.ammo[d.wk]=d.ammo||null;equip(d.wk,!d.ammo);banner('Picked up '+WP[d.wk].n);snd(700,.08,'sine',.06)}
function pickNear(){if(!P.alive)return;const d=nearDrop();if(d)takeDrop(d)}
function dropLoot(o,x,z,wk){const B=G.bomb;
  if(PRI.includes(wk))dropWeapon(wk,x,z);
  if(B.car===o&&B.ph==='none'){if(o!==PL)dropPack(o);B.car=null;B.mesh=mkC4(x,z,true)}}
function defuse(byP){const B=G.bomb;if(B.ph!=='planted')return;if(byP)addXP(25,'Objectives');B.ph='defused';if(B.mesh)B.mesh.led.material.color.set(0x30ff60);snd(700,.3,'sine',.1);endRound(false,'Bomb defused')}
function explode(){
  const B=G.bomb;if(B.ph!=='planted')return;B.ph='exploded';
  const bm=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshBasicMaterial({color:0xffa040,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));
  bm.position.set(B.x,1,B.z);bm.life=1;scene.add(bm);fx.push(bm);if(B.mesh)B.mesh.visible=false;
  const fl2=$('flash');fl2.style.transition='none';fl2.style.opacity=.9;requestAnimationFrame(()=>{fl2.style.transition='opacity 1.2s';fl2.style.opacity=0});
  snd(60,.9,'sawtooth',.25);endRound(true,'Target bombed');
  const RD=16;
  if(P.alive){const d=Math.hypot(P.x-B.x,P.z-B.z);if(d<RD)hurtP(200*(1-d/RD)+20)}
  for(const b of bots){if(b.dead)continue;const d=Math.hypot(b.position.x-B.x,b.position.z-B.z);if(d<RD)hurtBot(b,200*(1-d/RD)+20,false)}
}
