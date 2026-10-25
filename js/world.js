/* The map: floor, walls, crates, barrels, lights, signs, bomb sites, collision. */
/* ---------- map (wide, two bomb sites) ---------- */
const HX=70,HZ=35,SITE={A:{x:-50,z:-14},B:{x:50,z:-14}};
function ctex(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
const noise=(c,w,h,n,a)=>{for(let i=0;i<n;i++){c.fillStyle='rgba(0,0,0,'+R()*a+')';c.fillRect(R()*w,R()*h,1+R()*3,1+R()*3)}};
const T={
 wall:ctex(256,256,(c,w,h)=>{c.fillStyle='#a39687';c.fillRect(0,0,w,h);noise(c,w,h,900,.18);
   c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=3;c.strokeRect(2,2,w-4,h-4);c.beginPath();c.moveTo(w/2,0);c.lineTo(w/2,h);c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke();
   c.fillStyle='rgba(255,106,0,.85)';c.fillRect(0,h*.78,w,14);
   c.fillStyle='rgba(0,0,0,.4)';[[10,10],[w-10,10],[10,h-10],[w-10,h-10]].forEach(p=>{c.beginPath();c.arc(p[0],p[1],3,0,7);c.fill()});
   const g=c.createLinearGradient(0,h*.6,0,h);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.35)');c.fillStyle=g;c.fillRect(0,h*.6,w,h*.4)}),
 crate:ctex(256,256,(c,w,h)=>{c.fillStyle='#c2570f';c.fillRect(0,0,w,h);
   for(let x=0;x<w;x+=32){c.fillStyle='rgba(0,0,0,'+(.08+R()*.1)+')';c.fillRect(x,0,3,h)}noise(c,w,h,700,.2);
   c.strokeStyle='#7a3206';c.lineWidth=22;c.strokeRect(11,11,w-22,h-22);c.lineWidth=14;c.beginPath();c.moveTo(20,20);c.lineTo(w-20,h-20);c.moveTo(w-20,20);c.lineTo(20,h-20);c.stroke();
   c.fillStyle='#ffb066';[[11,11],[w-11,11],[11,h-11],[w-11,h-11]].forEach(p=>{c.beginPath();c.arc(p[0],p[1],4,0,7);c.fill()})})};
const capM=new THREE.MeshLambertMaterial({color:0x241c16});
const bmats={};
function bmat(kind,tint){const key=kind+'|'+(tint||0);return bmats[key]||(bmats[key]=new THREE.MeshLambertMaterial({map:T[kind],color:tint||0xffffff}))}
const solids=[],cols=[];
function box(x,z,w,d,h,kind,collide=true,tint){
  const g=new THREE.BoxGeometry(w,h,d),k=kind==='crate'?2.5:4,uv=g.attributes.uv,ext=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];   /* tile the texture per face so one shared texture serves every box */
  for(let q=0;q<6;q++)for(let i=0;i<4;i++){const j=q*4+i;uv.setXY(j,uv.getX(j)*ext[q][0]/k,uv.getY(j)*ext[q][1]/k)}
  const m=new THREE.Mesh(g,bmat(kind,tint));m.position.set(x,h/2,z);scene.add(m);solids.push(m);
  if(collide)cols.push({x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2});
  if(kind==='wall'){const c=new THREE.Mesh(new THREE.BoxGeometry(w+.1,.14,d+.1),capM);c.position.set(x,h+.07,z);scene.add(c)}
}
const sky=new THREE.Mesh(new THREE.SphereGeometry(100,16,12),new THREE.MeshBasicMaterial({fog:false,side:THREE.BackSide,map:ctex(8,256,(c,w,h)=>{
  const g=c.createLinearGradient(0,0,0,h);[[0,'#140c18'],[.3,'#3a1a22'],[.44,'#b4501c'],[.5,'#ff9a48'],[.52,'#2a1a10'],[1,'#2a1a10']].forEach(a=>g.addColorStop(a[0],a[1]));c.fillStyle=g;c.fillRect(0,0,w,h)})}));
{const t=sky.material.map;t.generateMipmaps=false;t.minFilter=THREE.LinearFilter;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.needsUpdate=true}
scene.add(sky);sky.material.depthWrite=false;sky.material.depthTest=false;sky.renderOrder=-1;sky.frustumCulled=false;
/* painted floor (drawn in world units) */
const floor=new THREE.Mesh(new THREE.PlaneGeometry(2*HX,2*HZ),new THREE.MeshLambertMaterial({map:ctex(2048,1024,(c,w,h)=>{
  c.fillStyle='#3b2f27';c.fillRect(0,0,w,h);
  for(let i=0;i<60;i++){const g=c.createRadialGradient(0,0,0,0,0,1);c.save();c.translate(R()*w,R()*h);c.scale(20+R()*50,20+R()*50);g.addColorStop(0,'rgba(0,0,0,.22)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,7);c.fill();c.restore()}
  noise(c,w,h,20000,.25);c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=2;
  for(let i=0;i<=w;i+=64){c.beginPath();c.moveTo(i,0);c.lineTo(i,h);c.stroke()}for(let i=0;i<=h;i+=64){c.beginPath();c.moveTo(0,i);c.lineTo(w,i);c.stroke()}
  c.setTransform(w/(2*HX),0,0,h/(2*HZ),w/2,h/2);c.textAlign='center';c.textBaseline='middle';
  c.strokeStyle='#ff6a00';c.lineWidth=.4;c.setLineDash([]);c.beginPath();c.arc(0,2,11,0,7);c.stroke();
  c.beginPath();[[0,-11,0,-9],[0,13,0,15],[-13,2,-11,2],[11,2,13,2]].forEach(l=>{c.moveTo(l[0],l[1]);c.lineTo(l[2],l[3])});c.stroke();
  c.setLineDash([1.2,.8]);c.fillStyle='rgba(255,106,0,.12)';c.fillRect(-14,24,28,10);c.strokeRect(-14,24,28,10);
  c.fillStyle='rgba(47,163,181,.12)';c.strokeStyle='rgba(47,163,181,.8)';c.fillRect(-14,-34,28,10);c.strokeRect(-14,-34,28,10);c.setLineDash([]);
  c.fillStyle='rgba(255,106,0,.6)';c.font='italic 700 4px "Chakra Petch",sans-serif';c.fillText('CROSS',0,29);
  c.save();c.translate(0,-29);c.rotate(Math.PI);c.fillStyle='rgba(47,163,181,.6)';c.fillText('COUNTER',0,0);c.restore();
  for(const k in SITE){const S=SITE[k];c.setLineDash([1.2,.8]);c.fillStyle='rgba(255,106,0,.10)';c.fillRect(S.x-9,S.z-8,18,16);c.strokeStyle='rgba(255,176,102,.85)';c.strokeRect(S.x-9,S.z-8,18,16);
    c.setLineDash([]);c.strokeStyle='rgba(255,106,0,.7)';c.beginPath();c.arc(S.x,S.z,6.5,0,7);c.stroke();
    c.fillStyle='rgba(255,176,102,.45)';c.font='italic 700 11px "Chakra Petch",sans-serif';c.fillText(k,S.x,S.z+.5)}
})}));
floor.rotation.x=-Math.PI/2;scene.add(floor);
[[0,-HZ-.5,2*HX+2,1],[0,HZ+.5,2*HX+2,1],[-HX-.5,0,1,2*HZ+2],[HX+.5,0,1,2*HZ+2]].forEach(a=>box(a[0],a[1],a[2],a[3],6,'wall',false,0x8a7e72));
/* obstacles: [x,z,width,depth,height,w=wall|c=crate] */
[[-14,28,1.2,10,3,'w'],[14,28,1.2,10,3,'w'],[-20,10,1.2,18,3.5,'w'],[20,10,1.2,18,3.5,'w'],[-31,-3,10,1.2,3,'w'],[31,-3,10,1.2,3,'w'],[-42,12,1.2,14,3.5,'w'],[42,12,1.2,14,3.5,'w'],[-36,24,8,1.2,3,'w'],[36,24,8,1.2,3,'w'],[-9,-6,1.2,10,3,'w'],[9,-6,1.2,10,3,'w'],[-4,-18,8,1.2,3,'w'],[4,-18,8,1.2,3,'w'],[-24,-24,1.2,12,3.5,'w'],[24,-24,1.2,12,3.5,'w'],[-38,-27,10,1.2,3,'w'],[38,-27,10,1.2,3,'w'],[-60,6,1.2,12,3.5,'w'],[60,6,1.2,12,3.5,'w'],[-50,-3,10,1.2,3,'w'],[50,-3,10,1.2,3,'w'],[-58,-27,8,1.2,3,'w'],[58,-27,8,1.2,3,'w'],[-14,-29,1.2,10,3,'w'],[14,-29,1.2,10,3,'w'],[-66,-8,1.2,8,3,'w'],[66,-8,1.2,8,3,'w'],[0,2,6,6,3.5,'w'],[-28,20,4,4,2.5,'c'],[28,20,4,4,2.5,'c'],[-10,14,3,3,2,'c'],[10,14,3,3,2,'c'],[-26,8,3,3,2.2,'c'],[26,8,3,3,2.2,'c'],[-34,16,3,3,2.2,'c'],[34,16,3,3,2.2,'c'],[-48,22,4,4,2.5,'c'],[48,22,4,4,2.5,'c'],[-64,20,4,4,2.5,'c'],[64,20,4,4,2.5,'c'],[-14,2,3,3,2,'c'],[14,2,3,3,2,'c'],[-27,-10,3,3,2,'c'],[27,-10,3,3,2,'c'],[-54,-18,3,3,2,'c'],[54,-18,3,3,2,'c'],[-46,-9,3,3,2.2,'c'],[46,-9,3,3,2.2,'c'],[-57,-11,2.5,2.5,2,'c'],[57,-11,2.5,2.5,2,'c'],[-48,-21,2,2,1.5,'c'],[48,-21,2,2,1.5,'c'],[-53,-13,2,2,1.5,'c'],[53,-13,2,2,1.5,'c'],[-18,-13,3,3,2,'c'],[18,-13,3,3,2,'c'],[-12,-25,3,3,2.2,'c'],[12,-25,3,3,2.2,'c'],[-42,-31,3,3,2,'c'],[42,-31,3,3,2,'c'],[-64,-17,3,3,2,'c'],[64,-17,3,3,2,'c'],[-66,-31,3,3,2,'c'],[66,-31,3,3,2,'c'],[-35,-18,3,3,2.2,'c'],[35,-18,3,3,2.2,'c'],[-6,25,3,3,2,'c'],[6,25,3,3,2,'c'],[-9,6,3,3,2,'c'],[0,-9,4,3,2.2,'c'],[0,18,3,3,2,'c'],[9,6,3,3,2,'c']]
 .forEach(a=>box(a[0],a[1],a[2],a[3],a[4],a[5]==='c'?'crate':'wall'));
/* neon, signs, site markers */
const neonM=new THREE.MeshBasicMaterial({color:0xff6a00}),signM=new THREE.MeshBasicMaterial({map:ctex(512,128,(c,w,h)=>{
  c.fillStyle='#14100c';c.fillRect(0,0,w,h);c.strokeStyle='#ff6a00';c.lineWidth=8;c.strokeRect(6,6,w-12,h-12);c.fillStyle='#ff6a00';
  c.font='italic 700 62px "Chakra Petch",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('COUNTERCROSS',w/2,h/2+3)})});
[[0,-HZ+.05,2*HX,.04],[0,HZ-.05,2*HX,.04],[HX-.05,0,.04,2*HZ],[-HX+.05,0,.04,2*HZ]].forEach(a=>{const n=new THREE.Mesh(new THREE.BoxGeometry(a[2],.1,a[3]),neonM);n.position.set(a[0],4.7,a[1]);scene.add(n)});
[[-30,-HZ+.04,0],[30,-HZ+.04,0],[-30,HZ-.04,Math.PI],[30,HZ-.04,Math.PI],[HX-.04,-20,-Math.PI/2],[-HX+.04,-20,Math.PI/2],[HX-.04,18,-Math.PI/2],[-HX+.04,18,Math.PI/2]].forEach(a=>{
  const g=new THREE.Mesh(new THREE.PlaneGeometry(10,2.5),signM);g.rotation.y=a[2];g.position.set(a[0],2.9,a[1]);scene.add(g)});
for(const k in SITE){const sp=new THREE.Sprite(new THREE.SpriteMaterial({fog:false,map:ctex(128,128,(c,w,h)=>{
  c.fillStyle='rgba(20,16,12,.85)';c.beginPath();c.arc(64,64,58,0,7);c.fill();c.strokeStyle='#ff6a00';c.lineWidth=8;c.stroke();c.fillStyle='#ff6a00';
  c.font='italic 700 76px "Chakra Petch",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(k,64,70)})}));
  sp.scale.set(4,4,1);sp.position.set(SITE[k].x,7.5,SITE[k].z);scene.add(sp)}
/* props */
const bM=new THREE.MeshLambertMaterial({color:0xb8480c}),bD=new THREE.MeshLambertMaterial({color:0x3e1904}),bL=new THREE.MeshLambertMaterial({color:0xffd9a8});
function barrel(x,z){
  const g=new THREE.Group(),b=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,1.1,12),bM);b.position.y=.55;g.add(b);
  [[.2,bD],[.55,bL],[.9,bD]].forEach(a=>{const r=new THREE.Mesh(new THREE.CylinderGeometry(.47,.47,a[1]===bL?.1:.07,12),a[1]);r.position.y=a[0];g.add(r)});
  const l=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.04,12),bD);l.position.y=1.1;g.add(l);
  g.position.set(x,0,z);scene.add(g);solids.push(b);cols.push({x1:x-.45,x2:x+.45,z1:z-.45,z2:z+.45});
}
[[-53,-16],[53,-16],[-47,-13],[47,-13],[-58,-19],[58,-19],[-24,13],[24,13],[-8,18],[8,18],[-16,-19],[16,-19],[-36,9],[36,9],[-30,-7],[30,-7],[-62,-3],[62,-3],[-4,10],[4,10],[-12,-9],[12,-9],[-44,-26],[44,-26],[-60,-14],[60,-14],[0,13],[0,-13],[0,-24]].forEach(a=>barrel(a[0],a[1]));
[[-12,-14],[12,-14],[-26,3],[26,3],[-46,3],[46,3],[-8,-23],[8,-23],[-32,-22],[32,-22],[-38,6],[38,6],[-22,-4],[22,-4]].forEach(a=>{box(a[0],a[1],1.2,1.2,4,'wall');const t=new THREE.Mesh(new THREE.BoxGeometry(1.3,.12,1.3),neonM);t.position.set(a[0],3.6,a[1]);scene.add(t)});
const poolM=new THREE.MeshBasicMaterial({map:ctex(128,128,(c,w,h)=>{const g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,170,80,.6)');g.addColorStop(1,'rgba(255,170,80,0)');c.fillStyle=g;c.fillRect(0,0,w,h)}),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
const poleM=new THREE.MeshLambertMaterial({color:0x2a2420}),bulbM=new THREE.MeshBasicMaterial({color:0xffc080});
[[-34,21],[34,21],[-20,-9],[20,-9],[-56,-5],[56,-5],[-8,-27],[8,-27],[-44,8],[44,8],[-62,24],[62,24],[0,22],[0,-20]].forEach(a=>{
  const p=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,5,6),poleM);p.position.set(a[0],2.5,a[1]);scene.add(p);
  const b=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),bulbM);b.position.set(a[0],5.1,a[1]);scene.add(b);
  const d=new THREE.Mesh(new THREE.CircleGeometry(7,20),poolM);d.rotation.x=-Math.PI/2;d.position.set(a[0],.03,a[1]);scene.add(d)});
[[-50,-14],[50,-14]].forEach(a=>{const l=new THREE.PointLight(0xffa050,1,42);l.position.set(a[0],5,a[1]);scene.add(l)});
function blocked(x,z,r){
  if(Math.abs(x)>HX-1-r||Math.abs(z)>HZ-1-r)return true;
  for(const c of cols)if(x>c.x1-r&&x<c.x2+r&&z>c.z1-r&&z<c.z2+r)return true;
  return false;
}
