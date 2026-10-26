/* Soldier models (3D + blocky), skeleton and IK, bot creation and posing. */
/* ---------- bots (team 0 = your squad, team 1 = enemies) ---------- */
const mk=c=>new THREE.MeshLambertMaterial({color:c});
const mB=[mk(0xff6a00),mk(0x2fa3b5)],mHm=[mk(0xd95a00),mk(0x287a88)],mP=[mk(0x2d2420),mk(0x1f2a30)],mH=mk(0xe3b38a),mG=mk(0x141414);
const mV=[new THREE.MeshBasicMaterial({color:0xffd9a8}),new THREE.MeshBasicMaterial({color:0x9ff4ff})],mS=new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.35,depthWrite:false});
const BG=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const gT=BG(.72,.7,.4),gVs=BG(.8,.55,.46),gL=BG(.26,.8,.3),gBt=BG(.28,.15,.4),gA=BG(.15,.15,.55),gHd=new THREE.SphereGeometry(.2,10,8),
  gHl=new THREE.SphereGeometry(.235,10,8,0,Math.PI*2,0,Math.PI/2),gGg=BG(.32,.08,.1),gBp=BG(.5,.55,.2),gBe=BG(.76,.08,.44),gSh=new THREE.CircleGeometry(.6,12),
  gGb=BG(.08,.12,.55),gGm=BG(.06,.2,.08),gGr=BG(.04,.04,.3),gGs=BG(.07,.1,.2);
/* ---- 3D soldier models (assets/*.glb), blocky soldiers are the fallback ---- */
const MODELS={};
const smt=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
/* fills w[0..12]: 0 Hips, then Left (UpLeg,Leg,Foot,Arm,ForeArm,Hand), then Right */
function cWeights(x,y,w){
  w.fill(0);
  for(let s=0;s<2;s++){const sg=s?-1:1,o=1+s*6,ax=Math.abs(x),
    lw=smt(-.02,-.22,y)*(1-smt(.30,.36,ax)*smt(-.30,-.20,y))*smt(-.05,.05,x*sg),kn=smt(-.50,-.72,y),an=smt(-.86,-.92,y);
    w[o]=lw*(1-kn);w[o+1]=lw*kn*(1-an);w[o+2]=lw*kn*an;
    const ar=x*sg>0&&y>-.30?smt(.22,.33,ax)*smt(.80,.60,y):0,fo=smt(.40,.14,y),ha=smt(.06,-.04,y);
    w[o+3]=ar*(1-fo);w[o+4]=ar*fo*(1-ha);w[o+5]=ar*fo*ha}
  let t=0;for(let i=1;i<13;i++)t+=w[i];w[0]=Math.max(0,1-t);
}

/* ---- the Counter soldier is a static mesh: give it a simple 13-bone skeleton (weights from position) so it can
   walk and hold its gun with the same IK as your squad. If anything fails it falls back to the old static model. ---- */
let COUNTER_RIG=false;
const CJ={UpLeg:[.15,-.12],Leg:[.17,-.62],Foot:[.19,-.93],Arm:[.33,.58],ForeArm:[.41,.27],Hand:[.38,-.02]};  /* joints on the +x side, model space */
function skinCounter(sc){
  sc.updateMatrixWorld(true);
  let src=null;sc.traverse(o=>{if(!src&&o.isMesh)src=o});if(!src)throw 0;
  const g=src.geometry.clone();g.applyMatrix4(src.matrixWorld);
  const pa=g.attributes.position,N=pa.count,si=new Uint16Array(N*4),sw=new Float32Array(N*4),w=new Float32Array(13),ord=[0,1,2,3,4,5,6,7,8,9,10,11,12];
  for(let i=0;i<N;i++){cWeights(pa.getX(i),pa.getY(i),w);   /* getX/getY: the GLB's vertex data is interleaved */
    const top=ord.slice().sort((a,b)=>w[b]-w[a]);let t=0;for(let k=0;k<4;k++)t+=w[top[k]];
    for(let k=0;k<4;k++){si[i*4+k]=top[k];sw[i*4+k]=w[top[k]]/t}}
  g.applyMatrix4(new THREE.Matrix4().makeScale(.95,.95,.95).premultiply(new THREE.Matrix4().makeTranslation(0,.95,0)));  /* 1.9m tall, feet on y=0 */
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
  const bones=[],wps=new Map(),bp=(x,y)=>new V(x*.95,y*.95+.95,0);
  const mkb=(name,par,wpos)=>{const b=new THREE.Bone();b.name=name;b.position.copy(wpos);if(par){b.position.sub(wps.get(par));par.add(b)}wps.set(b,wpos);bones.push(b);return b};
  const hips=mkb('Hips',null,bp(0,0));
  for(const [s,sg] of [['Left',1],['Right',-1]]){const J=n=>bp(CJ[n][0]*sg,CJ[n][1]);
    const ul=mkb(s+'UpLeg',hips,J('UpLeg')),lg=mkb(s+'Leg',ul,J('Leg'));mkb(s+'Foot',lg,J('Foot'));
    const ar=mkb(s+'Arm',hips,J('Arm')),fa=mkb(s+'ForeArm',ar,J('ForeArm'));mkb(s+'Hand',fa,J('Hand'))}
  (Array.isArray(src.material)?src.material:[src.material]).forEach(m=>{m.skinning=true;m.needsUpdate=true});
  const mesh=new THREE.SkinnedMesh(g,src.material);mesh.frustumCulled=false;
  const root=new THREE.Group();root.add(mesh);root.add(hips);root.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones));
  return root;
}
function prepModel(k,sc){
  if(k==='counter'){try{sc=skinCounter(sc);COUNTER_RIG=true}catch(e){COUNTER_RIG=false}}
  sc.traverse(o=>{if(o.isMesh){o.frustumCulled=false;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
    if(m.map){m.map.encoding=THREE.LinearEncoding;m.map.needsUpdate=true}
    m.metalness=.1;m.roughness=.85;if(m.emissive)m.emissive.setRGB(.1,.08,.07);m.color.set(k==='cross'?0xffe0c8:0xc8e4ff)})}});
  MODELS[k]=sc;
}
{let n=2,fin=false;
 const done=()=>{if(fin)return;fin=true;modelsReady=true;updatePlay();
   $('mstat').textContent=!THREE.GLTFLoader||!THREE.SkeletonUtils?'3D soldier loader was blocked, using blocky soldiers.':MODELS.cross&&MODELS.counter?'3D soldiers loaded.':MODELS.cross||MODELS.counter?'Only one 3D soldier file was found in the assets folder.':'3D soldier files not found. Upload soldier_cross.glb and soldier_counter.glb next to index.html. Using blocky soldiers for now.'};
 if(!THREE.GLTFLoader||!THREE.SkeletonUtils)done();
 else{const L=new THREE.GLTFLoader();
  [['cross','soldier_cross.glb'],['counter','soldier_counter.glb']].forEach(a=>{
    const ok=g=>{try{prepModel(a[0],g.scene)}catch(e){}if(--n===0)done()},fail=()=>{if(--n===0)done()};
    L.load(a[1],ok,undefined,()=>L.load('assets/'+a[1],ok,undefined,fail))});
  setTimeout(done,20000)}}
const mHit=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false});
function rigOf(m){
  const bn={};m.traverse(o=>{if(o.isBone)bn[o.name.replace(/^mixamorig:?/,'')]=o});
  for(const sd of ['Left','Right']){for(const f of ['Index','Middle','Ring','Pinky'])[[1,.8],[2,1.1],[3,.9]].forEach(a=>{const b=bn[sd+'Hand'+f+a[0]];if(b)b.rotation.x+=a[1]});
    [[1,.25],[2,.35]].forEach(a=>{const b=bn[sd+'HandThumb'+a[0]];if(b)b.rotation.x+=a[1]})}
  m.updateMatrixWorld(true);
  const wp=n=>bn[n].getWorldPosition(new V()),ln=(a,b)=>wp(a).distanceTo(wp(b));
  return{bn,l:{Arm:ln('LeftArm','LeftForeArm'),Fore:ln('LeftForeArm','LeftHand'),Up:ln('LeftUpLeg','LeftLeg'),Low:ln('LeftLeg','LeftFoot')},lf:[wp('LeftFoot'),wp('RightFoot')]};
}
const GUNCFG={
  pistol:{s:1,p:[-.03,1.3,.42],rg:[0,-.1,.09],lg:[-.02,-.09,.03]},hc:{s:1,p:[-.03,1.3,.4],rg:[0,-.12,.1],lg:[-.01,-.09,.02]},
  smg:{s:.95,p:[-.04,1.3,.22],rg:[0,-.115,.12],lg:[0,-.03,-.2]},rifle:{s:.85,p:[-.05,1.3,.18],rg:[0,-.12,.17],lg:[0,-.03,-.3]},
  sniper:{s:.75,p:[-.05,1.3,.2],rg:[0,-.12,.15],lg:[0,-.04,-.28]}};
function holdGun(g,body,wk,mode){   /* mode 0 rigged soldier, 1 static soldier, 2 blocky */
  const c=GUNCFG[wk],m=GB[wk].clone(true),gn=new THREE.Group();m.visible=true;m.rotation.y=Math.PI;gn.add(m);body.add(gn);
  if(mode===1){m.scale.setScalar(c.s*.8);gn.position.set(-.4,.95,.4)}
  else{m.scale.setScalar(c.s);gn.position.set(c.p[0],c.p[1],c.p[2]);
    const h=a=>new V(c.p[0]-a[0]*c.s,c.p[1]+a[1]*c.s,c.p[2]-a[2]*c.s);g.hr=h(c.rg);g.hl=h(c.lg)}
}
function mkBot(x,z,team,wk,ar){
  const g=new THREE.Group(),body=new THREE.Group();g.add(body);
  const part=(par,geo,m,px,py,pz,head)=>{const o=new THREE.Mesh(geo,m);o.position.set(px,py,pz);o.userData={bot:g,head:!!head};par.add(o);botMeshes.push(o);return o};
  const plain=(par,geo,m,px,py,pz)=>{const o=new THREE.Mesh(geo,m);o.position.set(px,py,pz);par.add(o);return o};
  const src=MODELS[team?'counter':'cross'];
  if(src){
    let rig=null,mdl;
    if(team&&!COUNTER_RIG){mdl=src.clone(true);mdl.scale.setScalar(.95);mdl.position.y=.95}
    else{mdl=THREE.SkeletonUtils.clone(src);rig=rigOf(mdl)}
    body.add(mdl);
    const hy=team?[1.25,.65,1.8,.22,.5,1]:[1.25,.62,1.68,.2,.45,.9];
    part(body,BG(.6,hy[1],.36),mHit,0,hy[0],0);part(body,new THREE.SphereGeometry(hy[3],8,6),mHit,0,hy[2],0,true);part(body,BG(.5,hy[5],.32),mHit,0,hy[4],0);
    holdGun(g,body,wk,team&&!COUNTER_RIG?1:0);
    Object.assign(g,{rig,mdl,mod:true});
  }else{
    const leg=sx=>{const l=new THREE.Group();l.position.set(sx,.8,0);body.add(l);part(l,gL,mP[team],0,-.4,0);part(l,gBt,mG,0,-.74,.05);return l};
    g.l1=leg(-.17);g.l2=leg(.17);
    part(body,gT,mP[team],0,1.15,0);part(body,gVs,mB[team],0,1.22,.01);part(body,gBe,mG,0,.84,0);part(body,gBp,mG,0,1.2,-.3);
    part(body,gA,mP[team],-.38,1.28,.25).rotation.y=.45;part(body,gA,mP[team],.42,1.3,.3).rotation.y=-.2;
    part(body,gHd,mH,0,1.76,0,true);part(body,gHl,mHm[team],0,1.78,0,true);part(body,gGg,mV[team],0,1.77,.17,true);
    holdGun(g,body,wk,2);
  }
  const sh=new THREE.Mesh(gSh,mS);sh.rotation.x=-Math.PI/2;sh.position.y=.03;g.add(sh);
  Object.assign(g,{team,body,amp:0,moved:false,pl:0,df:0,vis:0,post:null,pack:null,wk,ph:R()*6,w:WP[wk],ar:ar?100:0,hp:100,cd:1.2+R()*1.2,t:R()*.3,tg:null,wy:null,sd:R()<.5?1:-1,st:1+R()*2,dead:false,acc:.8+R()*.3});
  g.position.set(x,0,z);scene.add(g);bots.push(g);
}
/* two-bone IK on the Mixamo skeleton (arms hold the rifle, legs walk) */
const _a1=new V(),_a2=new V(),_aq=new THREE.Quaternion(),_aw=new THREE.Quaternion(),_ap=new THREE.Quaternion(),_gq=new THREE.Quaternion();
function aim(bone,child,dw){
  bone.updateWorldMatrix(true,false);child.updateWorldMatrix(true,false);
  bone.getWorldPosition(_a1);child.getWorldPosition(_a2);_a2.sub(_a1).normalize();
  _aq.setFromUnitVectors(_a2,dw);bone.getWorldQuaternion(_aw);_aw.premultiply(_aq);
  bone.parent.getWorldQuaternion(_ap);bone.quaternion.copy(_ap.invert().multiply(_aw));bone.updateMatrixWorld(true);
}
function ik(a,b,c,l1,l2,T,pole){
  const A=a.getWorldPosition(new V()),u=T.clone().sub(A),d0=u.length();u.normalize();
  const d=Math.min(Math.max(d0,Math.abs(l1-l2)+.01),l1+l2-.005),x=(d*d+l1*l1-l2*l2)/(2*d),h=Math.sqrt(Math.max(l1*l1-x*x,0));
  const p=pole.clone().addScaledVector(u,-pole.dot(u)).normalize(),E=A.clone().addScaledVector(u,x).addScaledVector(p,h),H=A.clone().addScaledVector(u,d);
  aim(a,b,E.clone().sub(A).normalize());
  const E2=b.getWorldPosition(new V());aim(b,c,H.sub(E2).normalize());
}
/* first-person arms: the Cross soldier's arms and hands, clipped so only the forearms show */
let fpArms=null,fpRig=null;const FS=1.75,FPL={pistol:[-.02,-.09,.02],hc:[-.02,-.09,.02],smg:[0,-.03,-.14],rifle:[0,-.04,-.22],sniper:[0,-.04,-.2]},fpPlane=new THREE.Plane(),fpTop=new THREE.Plane(),fpBot=new THREE.Plane(),_fw=new V(),_fq=new V(),_fu=new V();
function fpInit(){
  if(fpArms||!MODELS.cross)return;
  const m=THREE.SkeletonUtils.clone(MODELS.cross);
  m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.clippingPlanes=[fpPlane,fpTop,fpBot];o.frustumCulled=false;o.renderOrder=5}});
  fpRig=rigOf(m);fpArms=new THREE.Group();fpArms.add(m);fpArms.rotation.y=Math.PI;fpArms.scale.setScalar(FS);
  fpArms.position.set(.2,-3.08,-.168);fpRig.bn.LeftHand.scale.setScalar(.62);fpRig.bn.RightHand.scale.setScalar(.62);cam.add(fpArms);ren.localClippingEnabled=true;
}
function fpUpdate(){
  if(!fpArms)return;const vis=gun.visible&&P.alive;fpArms.visible=vis;if(!vis)return;
  cam.updateMatrixWorld(true);cam.getWorldDirection(_fw);cam.getWorldPosition(_fq).addScaledVector(_fw,.02);fpPlane.setFromNormalAndCoplanarPoint(_fw,_fq);
  _fu.set(0,1,0).transformDirection(cam.matrixWorld);cam.getWorldPosition(_fq);
  fpTop.setFromNormalAndCoplanarPoint(_fu.clone().negate(),_fq.clone().addScaledVector(_fu,-.06));fpBot.setFromNormalAndCoplanarPoint(_fu,_fq.clone().addScaledVector(_fu,-.62));
  const n=fpRig.bn,r=fpRig.l,c=GUNCFG[P.wk],T=a=>gun.localToWorld(new V(a[0],a[1],a[2])),D=(x,y,z)=>new V(x,y,z).transformDirection(cam.matrixWorld);
  ik(n.RightArm,n.RightForeArm,n.RightHand,r.Arm*FS,r.Fore*FS,T(c.rg),D(.6,-1,.5));
  ik(n.LeftArm,n.LeftForeArm,n.LeftHand,r.Arm*FS,r.Fore*FS,T(FPL[P.wk]),D(-.6,-1,.5));
}
function poseBot(b){
  const r=b.rig,bd=b.body;b.mdl.position.y=-.06-.025*b.amp;b.updateMatrixWorld(true);bd.getWorldQuaternion(_gq);
  const W=(x,y,z)=>bd.localToWorld(new V(x,y,z)),D=(x,y,z)=>new V(x,y,z).applyQuaternion(_gq),n=r.bn,s=Math.sin(b.ph),c=Math.cos(b.ph),a=b.amp,f=r.lf;
  ik(n.RightArm,n.RightForeArm,n.RightHand,r.l.Arm,r.l.Fore,bd.localToWorld(b.hr.clone()),D(-.6,-1,-.3));
  ik(n.LeftArm,n.LeftForeArm,n.LeftHand,r.l.Arm,r.l.Fore,bd.localToWorld(b.hl.clone()),D(.6,-1,-.3));
  ik(n.LeftUpLeg,n.LeftLeg,n.LeftFoot,r.l.Up,r.l.Low,W(f[0].x,f[0].y+Math.max(0,c)*.1*a,f[0].z+s*.22*a),D(0,.2,1));
  ik(n.RightUpLeg,n.RightLeg,n.RightFoot,r.l.Up,r.l.Low,W(f[1].x,f[1].y+Math.max(0,-c)*.1*a,f[1].z-s*.22*a),D(0,.2,1));
}
