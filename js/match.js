/* Round and match flow: buy menu, rounds, scoring, results screen. */
/* ---------- match flow ---------- */
function banner(t){const b=$('bn');b.textContent=t;b.classList.remove('on');void b.offsetWidth;b.classList.add('on')}
function openShop(){if(G.ph!=='freeze')return;shopOpen=true;$('shop').style.display='flex';renderShop();document.exitPointerLock?.()}
function closeShop(){shopOpen=false;$('shop').style.display='none'}
function renderShop(){
  $('smoney').textContent='$'+P.money;
  $('items').innerHTML=ITEMS.map(k=>{const a=k==='armor',W=WP[k],pr=a?650:W.p,own=a?P.ar>=100:(P.pri===k||P.sec===k),off=own||P.money<pr;
    return '<button class="it" data-k="'+k+'"'+(off?' disabled':'')+'><b>'+(a?'Kevlar vest':W.n)+'</b><small>'+(a?'Absorbs 40% of incoming damage':'Damage '+W.d+', mag '+W.m+(W.a?', full auto':', semi auto'))+'</small><i>'+(own?'Owned':'$'+pr)+'</i></button>'}).join('');
}
function buy(k){
  if(G.ph!=='freeze')return;const a=k==='armor',pr=a?650:WP[k].p;
  if(P.money<pr||(a&&P.ar>=100)||(!a&&(P.pri===k||P.sec===k)))return;
  P.money-=pr;if(a)P.ar=100;else{if(PRI.includes(k))P.pri=k;else P.sec=k;P.ammo[k]=null;equip(k,true)}
  snd(700,.08,'sine',.06);renderShop();
}
function startRound(){
  bots.forEach(b=>scene.remove(b));bots=[];botMeshes=[];drops.forEach(d=>scene.remove(d.mesh));drops.length=0;
  const cs=PT===0;
  if(!P.alive){P.pri=null;P.sec='pistol';P.ammo={};P.ar=0;equip('pistol',true)}else{P.ammo={};const W=wp();P.am=W.m;P.rs=W.res}
  Object.assign(P,{alive:true,hp:100,x:0,z:cs?30:-30,y:0,vy:0,yaw:cs?0:Math.PI,pitch:0,rl:0,cd:0,dmg:0,ads:false,zm:0});gun.visible=true;
  const B=G.bomb;if(B.mesh){scene.remove(B.mesh);B.mesh=null}Object.assign(B,{ph:'none',t:40,df:0,bt:0,car:null});G.site=R()<.5?'A':'B';P.planting=false;P.pl=0;
  const spawn=(t,list)=>{let spent=0;
    list.forEach(p=>{let x=p[0],z=p[1];for(let k=0;k<30&&blocked(x,z,.6);k++){x=p[0]+(R()-.5)*4;z=p[1]+(R()-.5)*4}
      const wk=G.round===1?'pistol':pickW(G.M[t]),ar=G.round>1&&G.M[t]>=1500&&R()<.8;
      mkBot(x,z,t,wk,ar);const nb=bots[bots.length-1];if(p[2])nb.post={x:p[0],z:p[1]};if(t===0)nb.rotation.y=Math.PI;spent+=WP[wk].p+(ar?650:0)});
    G.M[t]=Math.max(0,G.M[t]-spent/list.length)};
  spawn(0,cs?[[-8,31],[-4,31],[4,31],[8,31]]:[[-8,31],[-4,31],[0,31],[4,31],[8,31]]);
  spawn(1,cs?[[-44,-12,1],[-54,-21,1],[44,-12,1],[54,-21,1],[0,-16,1]]:[[-44,-12,1],[-54,-21,1],[44,-12,1],[54,-21,1]]);
  {const mem=bots.filter(b=>!b.team);if(cs)mem.push(PL);B.car=mem[Math.floor(R()*mem.length)];if(B.car!==PL)addPack(B.car)}   /* one random Cross player carries the C4 */
  G.ph='freeze';G.t=G.round===1?12:10;openShop();banner('Round '+G.round+' of 10'+(G.round===1?' - you are '+(cs?'Cross':'Counter'):''));
}
function goLive(){G.ph='live';G.t=105;closeShop();banner('Go');snd(500,.1,'sine',.06)}
function endRound(win,msg){   /* win = Cross won the round */
  if(G.ph!=='live')return;
  G.ph='end';G.t=3.5;const wt=win?0:1;G.s[wt]++;
  const lb=i=>1400+500*Math.min(G.L[i],4),add=[0,0];
  for(let t=0;t<2;t++){if(t===wt){add[t]=3250;G.L[t]=0}else{add[t]=lb(t);G.L[t]++}}
  if(!win&&G.bomb.ph!=='none')add[0]+=800;   /* Cross planted but lost */
  G.M[0]+=add[0];G.M[1]+=add[1];P.money=Math.min(9000,P.money+add[PT]);G.M=G.M.map(m=>Math.min(9000,m));
  banner(msg||(wt===PT?'Round won':'Round lost'));
  if(wt===PT)addXP(20,'Rounds won');commit();
}
function start(){
  if(!fbUser||!fbUser.emailVerified||!modelsReady||playing)return;   /* a verified login is required */
  closeM('res');closeM('frm');closeM('invm');
  PT=R()<.5?0:1;slv.color.set(PT?0x2fa3b5:0xff6a00);   /* random side */
  matchXP=0;XB={};lvStart=lvInfo(PR.xp).l;refreshAcc();
  Object.assign(P,{kills:0,money:800,ar:0,alive:true,lock:false,pri:null,sec:'pistol',ammo:{}});if(FP_ARMS)fpInit();equip('pistol',true);
  Object.assign(G,{round:1,s:[0,0],M:[800,800],L:[0,0]});
  $('menu').style.display='none';$('hud').style.display='block';playing=true;startRound();
  try{document.documentElement.requestFullscreen?.().catch(()=>{})}catch(e){}
  try{screen.orientation?.lock?.('landscape').catch(()=>{})}catch(e){}
  snd(400,.1,'sine',.05);
}
function finish(forfeit){
  playing=false;firing=false;fid=lid=jid=null;jv={x:0,y:0};jb.style.display=jk.style.display='none';
  document.exitPointerLock?.();closeShop();$('dmg').style.opacity=0;$('sc').style.opacity=0;cam.fov=BF;cam.updateProjectionMatrix();
  $('hud').style.display='none';$('menu').style.display='flex';gun.visible=true;partyReopen();if(SO.inv.length)showInvite();
  if(forfeit){if(forfeit!=='quiet')toast('You left the match',1800);return}   /* leaving early: no result, no XP */
  const a=G.s[PT],e=G.s[1-PT];
  addXP(50,'Match played',1);if(a>e)addXP(100,'Victory bonus',1);else if(a===e)addXP(25,'Draw bonus',1);
  PR.matches++;SS.matches++;if(a>e){PR.wins++;SS.wins++}persist();commit();
  const i1=lvInfo(PR.xp),i0=lvInfo(PR.xp-matchXP),up=i1.l>i0.l;
  $('resh').textContent=a>e?'Victory':a<e?'Defeat':'Draw';$('ress').textContent=a+' - '+e+'  \u00b7  '+P.kills+' kills';
  $('resx').innerHTML=Object.keys(XB).map(k=>'<div class="rx"><span>'+k+'</span><b>+'+XB[k]+' XP</b></div>').join('')+'<div class="rx"><span><b>Total</b></span><b>+'+matchXP+' XP</b></div>';
  $('resl').textContent=(up?'LEVEL UP!  ':'')+'Lv '+i1.l;$('resn').textContent=i1.l>=100?'Max level':i1.cur+' / '+i1.need+' XP to next level';
  const bar=$('resb').firstElementChild;bar.style.transition='none';bar.style.width=(up?0:i0.cur/i0.need*100)+'%';openM('res');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{bar.style.transition='width 1.3s ease-out';bar.style.width=(i1.l>=100?100:i1.cur/i1.need*100)+'%'}));
}
