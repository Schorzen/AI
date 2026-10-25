/* Bot behaviour: moving, aiming, shooting, planting, defusing. */
function updBots(dt,live){
  const B=G.bomb;let pl=null,df=null;
  let pk=null;
  if(B.ph==='none'){if(B.car&&B.car!==PL&&!B.car.dead)pl=B.car;   /* only the carrier plants */
    else if(!B.car&&B.mesh){let bd=1e9;for(const o of bots){if(o.dead||o.team)continue;const d=Math.hypot(o.position.x-B.mesh.position.x,o.position.z-B.mesh.position.z);if(d<bd){bd=d;pk=o}}}}   /* nearest Cross bot fetches a dropped C4 */
  if(B.ph==='planted'){let bd=1e9;for(const o of bots){if(o.dead||!o.team)continue;const d=Math.hypot(o.position.x-B.x,o.position.z-B.z);if(d<bd){bd=d;df=o}}}
  for(const b of bots){if(b.dead)continue;
    b.vis=Math.max(0,b.vis-dt);b.t-=dt;
    if(b.t<=0){b.t=.3;b.tg=null;let bd=55;const eye=new V(b.position.x,1.6,b.position.z);
      for(const o of foes(b)){const q=tpos(o),d=Math.hypot(q.x-b.position.x,q.z-b.position.z);
        if(d<bd&&los(eye,new V(q.x,q.y,q.z))){bd=d;b.tg=o}}
      if(b.tg&&b.tg!==PL&&b.team===PT)b.tg.vis=1.5}
    if(!live)continue;
    if(b.tg&&(b.tg.dead||(b.tg===PL&&!P.alive)))b.tg=null;
    const px=b.position.x,pz=b.position.z;
    const run=(b===pk||b===pl)&&b.tg&&Math.hypot(tpos(b.tg).x-px,tpos(b.tg).z-pz)>(b===pl?20:16);   /* the C4 carrier, or whoever fetches a dropped C4, keeps moving unless the enemy is close */
    if(b.tg&&!run){
      b.pl=0;b.df=0;
      const q=tpos(b.tg),dx=q.x-px,dz=q.z-pz,d=Math.hypot(dx,dz)||1;
      b.rotation.y=Math.atan2(dx,dz);b.st-=dt;if(b.st<=0){b.st=1+R()*2;b.sd*=-1}
      const sp=2.4*dt,leash=!b.team||B.ph!=='none'||Math.hypot(px-b.post.x,pz-b.post.z)<14;
      if(d>14&&leash)mv(b,dx/d*sp,dz/d*sp);else mv(b,-dz/d*sp*b.sd*.6,dx/d*sp*b.sd*.6);
      b.cd-=dt;if(b.cd<=0){b.cd=b.w.bi*(.8+R()*.5);bshoot(b,b.tg,d)}
    }else if(b===pl){
      const S=SITE[G.site],dx=S.x-px,dz=S.z-pz,d=Math.hypot(dx,dz)||1;b.rotation.y=Math.atan2(dx,dz);
      if(d>2.5){b.pl=0;mv(b,dx/d*3*dt,dz/d*3*dt)}else{b.pl+=dt;if(b.pl>=3.2)plantBomb(G.site,px,pz,false)}
    }else if(b===pk){
      const dx=B.mesh.position.x-px,dz=B.mesh.position.z-pz,d=Math.hypot(dx,dz)||1;b.rotation.y=Math.atan2(dx,dz);mv(b,dx/d*3*dt,dz/d*3*dt);
    }else if(b===df){
      const dx=B.x-px,dz=B.z-pz,d=Math.hypot(dx,dz)||1;b.rotation.y=Math.atan2(dx,dz);
      if(d>1.8){b.df=0;mv(b,dx/d*3.2*dt,dz/d*3.2*dt)}else{b.df+=dt;if(b.df>=5)defuse()}
    }else{
      let ax,az,sr;
      if(B.ph==='planted'){ax=B.x;az=B.z;sr=8}else if(b.team){ax=b.post.x;az=b.post.z;sr=5}else{const S=SITE[G.site];ax=S.x;az=S.z;sr=9}
      if(!b.wy||Math.hypot(b.wy.x-px,b.wy.z-pz)<1.5)b.wy={x:ax+(R()-.5)*2*sr,z:az+(R()-.5)*2*sr};
      const wx=b.wy.x-px,wz=b.wy.z-pz,wd=Math.hypot(wx,wz)||1;b.rotation.y=Math.atan2(wx,wz);
      const spd=b.team&&B.ph==='none'?2:3;
      if(!mv(b,wx/wd*spd*dt,wz/wd*spd*dt))b.wy=null;
    }
  }
  for(const b of bots){if(b.dead)continue;
    b.amp+=((b.moved?1:0)-b.amp)*Math.min(1,dt*8);b.moved=false;
    if(b.rig)poseBot(b);
    else if(b.l1){const sw=Math.sin(b.ph)*.7;b.l1.rotation.x=sw;b.l2.rotation.x=-sw;b.body.position.y=Math.abs(Math.sin(b.ph))*.05}
    else{b.body.position.y=Math.abs(Math.sin(b.ph))*.05*b.amp;b.body.rotation.z=Math.sin(b.ph)*.05*b.amp}}
  B.df=df?df.df:0;
}
