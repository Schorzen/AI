/* Sound, weapon stats, player and match state, equip and swap. */
/* ---------- audio ---------- */
let ac;
function snd(f,d,t,v){try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const n=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();
  o.type=t;o.frequency.setValueAtTime(f,n);o.frequency.exponentialRampToValueAtTime(Math.max(30,f/4),n+d);
  g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(n+d)}catch(e){}}

/* ---------- state ---------- */
const WP={
 pistol:{n:'P9 Pistol',p:0,d:20,r:.18,m:12,res:36,s:.008,a:0,bi:.6},
 hc:{n:'Hand Cannon',p:700,d:48,r:.45,m:7,res:21,s:.006,a:0,bi:.85},
 smg:{n:'Vector SMG',p:1200,d:17,r:.075,m:30,res:90,s:.022,a:1,bi:.28},
 rifle:{n:'AK-X Rifle',p:2700,d:30,r:.1,m:30,res:90,s:.012,a:1,bi:.4},
 sniper:{n:'Longshot',p:4750,d:105,r:1.3,m:5,res:20,s:.002,a:0,bi:1.6}};
const ITEMS=['hc','smg','rifle','sniper','armor'];
const P={x:0,z:26,y:0,vy:0,yaw:0,pitch:0,hp:100,ar:0,wk:'pistol',am:12,rs:36,kills:0,money:800,alive:true,cd:0,rl:0,rec:0,kick:0,fl:0,dmg:0,lock:false,ads:false,zm:0,rlT:1.4,rc:0,planting:false,pl:0,need:3.2,pri:null,sec:'pistol',ammo:{}};
const G={round:1,ph:'freeze',t:10,s:[0,0],M:[800,800],L:[0,0],site:'A',bomb:{ph:'none',t:40,x:0,z:0,mesh:null,df:0,bt:0,site:'A',car:null}},PL={};
let fid=null,playing=false,firing=false,shopOpen=false,lookX=0,lookY=0,jv={x:0,y:0},lid=null,jid=null,jo={x:0,y:0},lp={x:0,y:0};
let bots=[],botMeshes=[];const keys={};
const rc=new THREE.Raycaster(),sparks=[];
const wp=()=>WP[P.wk];
let lastHead=false,PT=0;const PRI=['smg','rifle','sniper'];   /* PT: your side, 0 = Cross (plants the C4), 1 = Counter */
const alive=t=>bots.filter(b=>!b.dead&&b.team===t).length+(PT===t&&P.alive?1:0);
const TY={pistol:.09,hc:.14,smg:.145,rifle:.14,sniper:.14},ZF={pistol:62,hc:55,smg:55,rifle:48,sniper:20},SY={pistol:-.08,hc:-.12,smg:-.15,rifle:-.11,sniper:-.12};
function equip(k,fresh){if(P.wk)P.ammo[P.wk]=[P.am,P.rs];P.wk=k;P.ads=false;P.zm=0;showGun(k);const W=WP[k],a=!fresh&&P.ammo[k];P.am=a?a[0]:W.m;P.rs=a?a[1]:W.res;P.rl=0}
function swap(){if(!P.alive||!P.pri||G.ph==='end')return;equip(P.wk===P.pri?P.sec:P.pri)}
