/* Touch, mouse and keyboard controls and on-screen buttons. */
/* ---------- input ---------- */
$('go').addEventListener('click',start);
$('helpb').addEventListener('click',()=>openM('helpm'));$('helpx').addEventListener('click',()=>closeM('helpm'));$('resc').addEventListener('click',()=>closeM('res'));
$('rotb').addEventListener('click',async()=>{try{await document.documentElement.requestFullscreen?.()}catch(e){}try{await screen.orientation?.lock?.('landscape')}catch(e){}});
const jb=$('jb'),jk=$('jk');
addEventListener('touchstart',e=>{
  if(!playing)return;
  for(const t of e.changedTouches){
    if(t.target.closest&&t.target.closest('#fire')){e.preventDefault();fid=t.identifier;firing=true;
      if(lid===null){lid=t.identifier;lp={x:t.clientX,y:t.clientY}}continue}
    if(t.target.closest&&t.target.closest('.btn,#shop,#rot'))continue;
    e.preventDefault();
    if(t.clientX<innerWidth*.45&&jid===null){jid=t.identifier;jo={x:t.clientX,y:t.clientY};
      jb.style.cssText=jk.style.cssText='display:block;left:'+jo.x+'px;top:'+jo.y+'px'}
    else if(t.clientX>=innerWidth*.45&&(lid===null||lid===fid)){lid=t.identifier;lp={x:t.clientX,y:t.clientY}}
  }},{passive:false});
addEventListener('touchmove',e=>{
  if(!playing)return;e.preventDefault();
  for(const t of e.changedTouches){
    if(t.identifier===jid){let dx=(t.clientX-jo.x)/50,dy=(t.clientY-jo.y)/50;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}
      jv={x:dx,y:-dy};jk.style.left=jo.x+dx*50+'px';jk.style.top=jo.y+dy*50+'px'}
    else if(t.identifier===lid){lookX+=t.clientX-lp.x;lookY+=t.clientY-lp.y;lp={x:t.clientX,y:t.clientY}}
  }},{passive:false});
function tend(e){for(const t of e.changedTouches){
  if(t.identifier===jid){jid=null;jv={x:0,y:0};jb.style.display=jk.style.display='none'}
  if(t.identifier===fid){fid=null;firing=false}
  if(t.identifier===lid)lid=null}}
addEventListener('touchend',tend);addEventListener('touchcancel',tend);

const bind=(id,dn,up)=>{const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();dn()});
  if(up)['pointerup','pointercancel','pointerleave'].forEach(n=>el.addEventListener(n,up))};
$('fire').addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')firing=true});
['pointerup','pointercancel'].forEach(n=>$('fire').addEventListener(n,e=>{if(e.pointerType!=='touch')firing=false}));
bind('rel',reload);
bind('plant',()=>{if(canPlant()||canDefuse()){P.planting=true;P.pl=0;P.need=canPlant()?3.2:5}},()=>{P.planting=false;P.pl=0});
bind('swp',swap);bind('pick',pickNear);
bind('scp',()=>{if(P.alive&&G.ph!=='freeze')P.ads=!P.ads});
const jump=()=>{if(P.y===0&&P.alive&&G.ph!=='freeze')P.vy=7};bind('jmp',jump);
$('buy').addEventListener('click',openShop);
$('ready').addEventListener('click',()=>{closeShop();if(G.t>3)G.t=3});
$('items').addEventListener('click',e=>{const b=e.target.closest('.it');if(b)buy(b.dataset.k)});

addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyR')reload();if(e.code==='KeyB')shopOpen?closeShop():openShop();if(e.code==='Space')jump();if(e.code==='KeyE'&&(canPlant()||canDefuse())){P.planting=true;P.pl=0;P.need=canPlant()?3.2:5}
  if(e.code==='KeyE'&&!(canPlant()||canDefuse()))pickNear();
  if(e.code==='KeyQ')swap();if(e.code==='Digit1'&&P.alive&&P.pri&&P.wk!==P.pri)equip(P.pri);if(e.code==='Digit2'&&P.alive&&P.wk!==P.sec)equip(P.sec)});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyE'){P.planting=false;P.pl=0}});
cv.addEventListener('mousedown',e=>{if(!playing)return;if(e.button===2){if(P.alive&&G.ph!=='freeze')P.ads=!P.ads;return}if(document.pointerLockElement!==cv)cv.requestPointerLock?.();else firing=true});
addEventListener('mouseup',()=>{if(document.pointerLockElement===cv)firing=false});
addEventListener('mousemove',e=>{if(document.pointerLockElement===cv){lookX+=e.movementX*.5;lookY+=e.movementY*.5}});
document.addEventListener('contextmenu',e=>e.preventDefault());
