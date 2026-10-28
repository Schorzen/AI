/* HUD updates and the radar. */
function hud(){
  const ae=alive(1-PT),aa=alive(PT);
  $('hpn').textContent=Math.max(0,Math.ceil(P.hp));$('hpb').style.width=Math.max(0,P.hp)+'%';$('arn').textContent=Math.ceil(P.ar);
  $('cash').textContent='$'+P.money;$('kn').textContent=P.kills;
  $('am').textContent=P.rl?'...':P.am;$('rs').textContent=P.rs;$('wn').textContent=wp().n;
  $('score').textContent=G.s[PT]+' : '+G.s[1-PT];$('rd').textContent=DUEL.on?'Duel R'+G.round:'R'+G.round+'/10';
  const t=Math.max(0,Math.ceil(G.t));$('tm').textContent=G.ph==='freeze'?(DUEL.on?'Get ready ':'Buy ')+t:G.ph==='live'?(G.bomb.ph==='planted'?'C4 armed':Math.floor(t/60)+':'+String(t%60).padStart(2,'0')):'';
  $('alive').textContent=DUEL.on?'First to '+DUEL_WIN:aa+' v '+ae;$('cash').style.display=DUEL.on?'none':'';
  const B=G.bomb;
  {const pd=canPlant(),dd=!pd&&canDefuse(),pb=$('plant'),tx=dd?'Hold to defuse C4':'Hold to plant C4';pb.style.display=pd||dd?'grid':'none';if(pb.textContent!==tx)pb.textContent=tx}
  {const nd=P.alive&&G.ph!=='end'?nearDrop():null,pb2=$('pick'),v=nd?'grid':'none';if(pb2.style.display!==v)pb2.style.display=v;if(nd){const tx='Pick up '+WP[nd.wk].n;if(pb2.textContent!==tx)pb2.textContent=tx}}
  {const v=P.pri?'grid':'none',sb=$('swp');if(sb.style.display!==v)sb.style.display=v}
  $('pbar').style.display=P.planting?'block':'none';$('pbar').firstElementChild.style.width=Math.min(100,P.pl/P.need*100)+'%';
  $('obj').textContent=B.ph==='planted'?'BOMB at '+B.site+'   '+Math.ceil(Math.max(0,B.t))+'s'+(B.df>0?'   DEFUSING '+Math.ceil(Math.max(0,5-B.df))+'s':''):PT===0?(B.car===PL?'You carry the C4 - plant it at A or B':B.car?'Escort your C4 carrier':'Pick up the dropped C4'):'Stop the plant at A and B';
  if(DUEL.on)$('obj').textContent='1v1: eliminate your friend';
  $('obj').classList.toggle('hot',B.ph==='planted');
  drawRadar();
  $('scp').classList.toggle('on',P.ads);
  $('buy').style.display=G.ph==='freeze'&&!shopOpen&&!DUEL.on?'grid':'none';
  $('dmg').style.opacity=P.dmg;
}

/* ---------- radar ---------- */
const rcv=$('radar'),rx=rcv.getContext('2d'),rbg=document.createElement('canvas');rbg.width=280;rbg.height=140;
const rp=(x,z)=>[(x+HX)*280/(2*HX),(z+HZ)*140/(2*HZ)];
{const c=rbg.getContext('2d');c.fillStyle='rgba(22,17,13,.78)';c.fillRect(0,0,280,140);c.fillStyle='rgba(255,176,102,.3)';
 cols.forEach(o=>{const q=rp(o.x1,o.z1);c.fillRect(q[0],q[1],(o.x2-o.x1)*2,(o.z2-o.z1)*2)})}
function drawRadar(){
  rx.clearRect(0,0,280,140);rx.drawImage(rbg,0,0);rx.font='700 22px sans-serif';rx.textAlign='center';rx.textBaseline='middle';
  for(const k in SITE){const q=rp(SITE[k].x,SITE[k].z);rx.fillStyle='rgba(255,106,0,.9)';rx.fillText(k,q[0],q[1])}
  const B=G.bomb;if(B.ph==='planted'){const q=rp(B.x,B.z);rx.fillStyle=Math.floor(B.t*2)%2?'#ff3030':'#fff';rx.beginPath();rx.arc(q[0],q[1],6,0,7);rx.fill()}
  if(PT===0&&B.ph==='none'&&B.mesh){const q=rp(B.mesh.position.x,B.mesh.position.z);rx.fillStyle='#ffd24a';rx.fillRect(q[0]-4,q[1]-4,8,8)}
  for(const b of bots){if(b.dead||(b.team!==PT&&b.vis<=0))continue;const q=rp(b.position.x,b.position.z);rx.fillStyle=b.team?'#2fe0ff':'#ffa040';rx.beginPath();rx.arc(q[0],q[1],4.5,0,7);rx.fill()}
  if(P.alive){const q=rp(P.x,P.z);rx.save();rx.translate(q[0],q[1]);rx.rotate(-P.yaw);rx.fillStyle='#fff';rx.beginPath();rx.moveTo(0,-8);rx.lineTo(5,6);rx.lineTo(-5,6);rx.fill();rx.restore()}
}
