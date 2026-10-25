/* First-person weapon models and hands. */
/* ---------- weapon (first-person) ---------- */
const gun=new THREE.Group(),gb=new THREE.Group(),L=c=>new THREE.MeshLambertMaterial({color:c});
const gm=L(0x1d1814),go=L(0xff6a00),gk=L(0x2e2822),gs=L(0x1a1410);
const bx=(g,w,h,d,m,x,y,z,rx,ry)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);if(rx)o.rotation.x=rx;if(ry)o.rotation.y=ry;g.add(o);return o};
const grain=(base,sp,sh)=>new THREE.MeshPhongMaterial({color:0xffffff,specular:sp,shininess:sh,map:ctex(128,128,(c,w,h)=>{c.fillStyle=base;c.fillRect(0,0,w,h);
  for(let n=0;n<900;n++){c.fillStyle='rgba('+(R()<.5?'255,255,255':'0,0,0')+','+R()*.12+')';c.fillRect(R()*w,R()*h,2+R()*18,1)}})});
const mDk=grain('#26231f',0x222222,20),mMt=grain('#5c5852',0x777777,60),steel=grain('#8d8880',0xaaaaaa,90),chrome=grain('#b9b4ac',0xdddddd,110),
  wood=new THREE.MeshPhongMaterial({color:0xffffff,specular:0x221100,shininess:25,map:ctex(128,128,(c,w,h)=>{c.fillStyle='#7c4a22';c.fillRect(0,0,w,h);
    for(let n=0;n<70;n++){c.fillStyle='rgba(40,18,4,'+(.08+R()*.2)+')';c.fillRect(0,R()*h,w,1+R()*3)}})}),
  blk=new THREE.MeshBasicMaterial({color:0x050505}),lens=new THREE.MeshBasicMaterial({color:0x6fe0ff}),lensR=new THREE.MeshBasicMaterial({color:0xff3030});
const fl=new THREE.Mesh(new THREE.SphereGeometry(.08,6,6),new THREE.MeshBasicMaterial({color:0xffb040}));fl.visible=false;gun.add(fl);
function mkG(f){const g=new THREE.Group();f(g);g.visible=false;gb.add(g);return g}
const cy=(g,r1,r2,len,m,x,y,z,seg)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,len,seg||10),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);g.add(o);return o};
const rail=(g,x,y,z0,z1,m)=>{bx(g,.036,.01,z1-z0,m,x,y,(z0+z1)/2);for(let z=z0;z<z1;z+=.028)bx(g,.042,.012,.012,m,x,y+.008,z)};
const guard=(g,y,z,w,m)=>{bx(g,.012,.012,w,m,0,y-.03,z);bx(g,.012,.03,.012,m,0,y-.015,z-w/2);bx(g,.01,.034,.012,steel,0,y,z+.012,.3)};
const GB={
 pistol:mkG(g=>{bx(g,.068,.062,.3,mMt,0,.035,-.06);bx(g,.04,.008,.3,steel,0,.068,-.06);bx(g,.06,.05,.04,mMt,0,.03,-.225);
  [0,1,2,3,4].forEach(i=>bx(g,.07,.05,.008,mDk,0,.035,.04+i*.02));[0,1,2].forEach(i=>bx(g,.07,.04,.008,mDk,0,.035,-.17-i*.016));
  bx(g,.01,.03,.07,blk,.035,.045,-.04);cy(g,.016,.016,.03,steel,0,.032,-.235);cy(g,.007,.007,.032,blk,0,.032,-.236,6);
  bx(g,.062,.04,.27,mDk,0,-.02,-.04);bx(g,.05,.012,.08,mDk,0,-.045,-.15);bx(g,.052,.004,.008,blk,0,-.039,-.13);
  guard(g,-.06,-.01,.09,mDk);bx(g,.064,.15,.085,mDk,0,-.1,.095,.2);[0,1,2,3,4,5].forEach(i=>bx(g,.066,.005,.07,blk,0,-.07-i*.02,.09+i*.007,.2));
  bx(g,.066,.015,.09,mMt,0,-.18,.12,.2);bx(g,.066,.008,.07,go,0,-.04,.07,.2);
  bx(g,.014,.02,.014,go,0,.082,-.2);[-1,1].forEach(k=>bx(g,.01,.02,.014,go,k*.014,.08,.08));bx(g,.008,.015,.04,steel,.035,.0,-.02)}),
 hc:mkG(g=>{bx(g,.09,.085,.42,steel,0,.035,-.09);rail(g,0,.083,-.28,.1,mMt);bx(g,.092,.02,.38,mMt,0,.0,-.09);
  cy(g,.03,.03,.1,chrome,0,.03,-.34);cy(g,.016,.016,.012,blk,0,.03,-.395,8);[0,1,2].forEach(i=>bx(g,.092,.05,.012,mDk,0,.04,.06+i*.028));
  bx(g,.01,.045,.1,blk,.047,.05,-.02);bx(g,.075,.055,.32,mMt,0,-.035,-.05);bx(g,.05,.012,.1,mDk,0,-.07,-.18);
  guard(g,-.075,-.02,.1,mMt);bx(g,.078,.17,.09,wood,0,-.125,.1,.18);bx(g,.06,.17,.01,mMt,0,-.125,.15,.18);bx(g,.07,.015,.1,mMt,0,-.215,.12,.18);
  bx(g,.02,.045,.03,mMt,0,.09,.13,-.3);bx(g,.01,.02,.03,steel,.05,.03,.07);bx(g,.008,.008,.01,go,0,.09,-.02);
  bx(g,.018,.03,.02,go,0,.12,-.26);[-1,1].forEach(k=>bx(g,.012,.03,.02,go,k*.018,.12,.1))}),
 smg:mkG(g=>{bx(g,.082,.11,.36,mDk,0,0,0);rail(g,0,.062,-.17,.17,mMt);bx(g,.078,.085,.24,mDk,0,.005,-.29);
  [0,1,2,3,4].forEach(i=>{bx(g,.08,.012,.022,blk,0,.02,-.2-i*.045);bx(g,.08,.012,.022,blk,0,-.015,-.2-i*.045)});
  cy(g,.028,.028,.22,mMt,0,.01,-.57);cy(g,.032,.032,.02,steel,0,.01,-.68);cy(g,.016,.016,.01,blk,0,.01,-.69,8);cy(g,.032,.032,.012,go,0,.01,-.46);
  bx(g,.052,.14,.075,mDk,0,-.12,-.03,.08);bx(g,.052,.14,.075,mDk,0,-.25,0,.2);bx(g,.054,.03,.077,go,0,-.33,.02,.2);
  bx(g,.058,.13,.07,mDk,0,-.115,.12,.3);guard(g,-.06,.04,.1,mDk);cy(g,.012,.012,.26,mMt,.018,.03,.32);cy(g,.012,.012,.26,mMt,-.018,.03,.32);
  bx(g,.05,.11,.12,mDk,0,.0,.44);bx(g,.052,.1,.01,go,0,0,.51);bx(g,.05,.02,.04,mMt,0,.07,.12);bx(g,.01,.03,.07,blk,.042,.03,-.05);
  bx(g,.05,.02,.1,mMt,0,.085,-.05);bx(g,.05,.05,.07,mMt,0,.12,-.05);bx(g,.04,.04,.006,lens,0,.12,-.088);bx(g,.006,.006,.004,lensR,0,.12,-.092);
  bx(g,.086,.02,.2,go,0,.02,.05)}),
 rifle:mkG(g=>{bx(g,.086,.11,.44,mMt,0,0,.05);bx(g,.078,.05,.38,mMt,0,.075,.05);cy(g,.04,.04,.38,mMt,0,.07,.05);
  bx(g,.04,.03,.06,steel,0,.125,-.1);bx(g,.03,.012,.03,blk,0,.142,-.1);bx(g,.08,.07,.27,wood,0,-.015,-.33);bx(g,.07,.035,.25,wood,0,.06,-.33);
  bx(g,.076,.076,.02,steel,0,.01,-.2);bx(g,.07,.07,.02,steel,0,.01,-.46);cy(g,.014,.014,.34,steel,0,.095,-.37,8);
  cy(g,.017,.017,.3,steel,0,0,-.62,8);bx(g,.04,.05,.04,mMt,0,.045,-.62);cy(g,.028,.028,.08,mMt,0,0,-.78);cy(g,.014,.014,.01,blk,0,0,-.82,8);
  bx(g,.01,.05,.01,go,0,.075,-.76);bx(g,.03,.012,.03,mMt,0,.1,-.76);
  bx(g,.06,.12,.095,mMt,0,-.095,-.03,.12);bx(g,.06,.12,.095,mMt,0,-.2,.02,.3);bx(g,.06,.1,.095,mMt,0,-.29,.09,.5);bx(g,.062,.02,.097,go,0,-.35,.13,.5);
  [0,1,2].forEach(i=>bx(g,.062,.006,.097,blk,0,-.11-i*.1,-.02+i*.055,.12+i*.18));
  bx(g,.058,.14,.07,mDk,0,-.12,.2,.28);guard(g,-.06,.12,.12,mMt);bx(g,.092,.01,.1,steel,0,.03,0);bx(g,.02,.03,.04,steel,.05,.04,.04);
  bx(g,.07,.12,.34,wood,0,-.015,.44,-.04);bx(g,.072,.14,.015,mDk,0,-.02,.615);bx(g,.092,.02,.3,go,0,.035,.05)}),
 sniper:mkG(g=>{bx(g,.085,.1,.46,mDk,0,0,.03);cy(g,.022,.022,.72,steel,0,.01,-.68);cy(g,.03,.03,.1,mMt,0,.01,-1.1);cy(g,.013,.013,.01,blk,0,.01,-1.151,8);
  [0,1,2].forEach(i=>bx(g,.07,.012,.012,blk,0,.01,-1.07-i*.03));cy(g,.032,.032,.012,go,0,.01,-1.04);bx(g,.075,.07,.3,mDk,0,-.01,-.28);
  [-1,1].forEach(k=>{cy(g,.008,.008,.22,steel,k*.036,-.06,-.36,6);bx(g,.02,.02,.03,mMt,k*.03,-.04,-.26)});
  cy(g,.03,.03,.32,mDk,0,.125,-.02,12);cy(g,.04,.034,.07,mDk,0,.125,-.22,12);cy(g,.034,.04,.06,mDk,0,.125,.17,12);cy(g,.036,.036,.004,lens,0,.125,-.256,12);
  rail(g,0,.052,-.2,.2,mMt);bx(g,.04,.045,.035,mMt,0,.085,-.12);bx(g,.04,.045,.035,mMt,0,.085,.1);bx(g,.03,.02,.03,mMt,0,.16,-.03);bx(g,.02,.03,.03,mMt,.045,.125,-.03);bx(g,.034,.006,.034,go,0,.172,-.03);
  bx(g,.03,.03,.1,steel,0,.03,.14);bx(g,.08,.016,.016,steel,.06,.03,.1);const kn=new THREE.Mesh(new THREE.SphereGeometry(.02,8,6),go);kn.position.set(.105,.03,.1);g.add(kn);
  bx(g,.06,.07,.1,mMt,0,-.08,0);guard(g,-.06,.12,.12,mDk);bx(g,.075,.14,.36,mDk,0,-.03,.45,-.06);bx(g,.07,.035,.2,go,0,.045,.43,-.06);
  bx(g,.078,.15,.02,mDk,0,-.04,.64);bx(g,.06,.14,.075,mDk,0,-.12,.15,.3)})};
const MZ={pistol:-.27,hc:-.4,smg:-.69,rifle:-.83,sniper:-1.16};
function showGun(k){for(const n in GB)GB[n].visible=n===k;fl.position.z=MZ[k];const h=HG[k];hgR.position.set(h.r[0],h.r[1],h.r[2]);hgL.position.set(h.l[0],h.l[1],h.l[2])}
const hands=new THREE.Group();gun.add(hands);
/* first-person hands: a glove on the grip plus a sleeve running off the bottom of the screen.
   (The cloned 3D soldier arms looked cut open, so they are off. Set FP_ARMS=true to try them again.) */
const FP_ARMS=false;
const HG={pistol:{r:[0,-.1,.09],l:[-.035,-.1,.03]},hc:{r:[0,-.12,.1],l:[-.035,-.12,.05]},smg:{r:[0,-.115,.12],l:[0,-.085,-.2]},
  rifle:{r:[0,-.12,.17],l:[0,-.09,-.3]},sniper:{r:[0,-.12,.15],l:[0,-.09,-.28]}};
const hgR=new THREE.Group(),hgL=new THREE.Group(),slv=L(0xff6a00);hands.add(hgR,hgL);
bx(hgR,.075,.1,.09,gs,0,0,0,.2);bx(hgR,.07,.07,.5,slv,.012,-.12,.27,.45);
bx(hgL,.085,.075,.12,gs,0,0,0);bx(hgL,.07,.07,.55,slv,-.096,-.106,.29,.35,-.3);
gun.add(gb);gun.position.set(.22,-.2,-.45);cam.add(gun);
