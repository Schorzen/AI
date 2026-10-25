/* Renderer, scene, camera, lights, screen resize. */
const V=THREE.Vector3,R=Math.random;
const cv=$('c'),ren=new THREE.WebGLRenderer({canvas:cv,antialias:true});
ren.setPixelRatio(Math.min(devicePixelRatio,1.75));
const SKY=0x2b1a10,scene=new THREE.Scene();
scene.background=new THREE.Color(SKY);scene.fog=new THREE.Fog(0x3a2216,30,125);
const cam=new THREE.PerspectiveCamera(75,1,.1,190);cam.rotation.order='YXZ';scene.add(cam);
let BF=75;const HFOV=100;  /* base vertical FOV, derived from the screen so the horizontal FOV stays about HFOV degrees */
function rsz(){ren.setSize(innerWidth,innerHeight,false);const a=innerWidth/innerHeight;
  BF=Math.max(55,Math.min(75,2*Math.atan(Math.tan(HFOV*Math.PI/360)/a)*180/Math.PI));cam.fov=BF;cam.aspect=a;cam.updateProjectionMatrix()}
addEventListener('resize',rsz);rsz();
scene.add(new THREE.HemisphereLight(0xffd2a8,0x2a1a10,.95));
const sun=new THREE.DirectionalLight(0xffa860,.8);sun.position.set(20,40,10);scene.add(sun);
