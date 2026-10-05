/** Arquitectura del museo: mármol, pórtico dórico y puertas articuladas. */
export function createGreekMuseum(THREE, scene, canvasTex, compact) {
  const marbleMap = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#c7bfae'; g.fillRect(0, 0, w, h);
    let seed = 73;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 28; i++) {
      g.beginPath(); const x = random() * w; g.moveTo(x, 0);
      for (let y = 0; y <= h; y += 16) g.lineTo(x + Math.sin(y * .017 + i) * 35 + random() * 12, y);
      g.strokeStyle = `rgba(83,74,58,${.025 + random() * .065})`; g.lineWidth = .6 + random() * 2; g.stroke();
    }
    for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(255,255,255,${random() * .1})`; g.fillRect(random()*w, random()*h, 2, 2); }
  });
  const marble = new THREE.MeshStandardMaterial({ color: '#ede4d2', map: marbleMap, roughness: .65 });
  const darkStone = new THREE.MeshStandardMaterial({ color: '#a69d89', map: marbleMap, roughness: .75 });
  const bronze = new THREE.MeshStandardMaterial({ color: '#a77a40', metalness: .65, roughness: .34 });
  const doorMat = new THREE.MeshStandardMaterial({ color: '#453727', metalness: .35, roughness: .5 });
  function box(w, h, d, x, y, z, mat = marble, parent = scene) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  const tile = canvasTex(512,512,(g,w,h) => {
    g.drawImage(marbleMap.userData.canvas,0,0); g.strokeStyle='#817760'; g.lineWidth=2; g.strokeRect(0,0,w,h);
  },{repeat:[7,48]});
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(22,100),new THREE.MeshStandardMaterial({map:tile,color:'#dbd2bd',roughness:.36,metalness:.08}));
  floor.rotation.x=-Math.PI/2; floor.position.set(0,-.015,-14); floor.receiveShadow=true; scene.add(floor);
  // Dos líneas de bronce guían la mirada hasta la última sala.
  [-2.75,2.75].forEach(x=>box(.035,.012,62,x,0,-15,bronze));
  [-6,6].forEach(x=> {
    box(.35,7.8,50,x,3.9,-21);
    box(.48,.32,50,x, .16,-21,darkStone);
    box(.55,.28,50,x,7.2,-21);
  });
  // Techo con casetones y lucernarios centrales.
  [-4.2,4.2].forEach(x=>box(3.6,.28,50,x,7.65,-21));
  const skylightMat = new THREE.MeshBasicMaterial({color:'#b7c7d1', transparent:true, opacity:.34});
  for(let z=1;z>-45;z-=6) {
    box(12,.3,.3,0,7.6,z);
    box(4.4,.035,4.5,0,7.8,z-2.8,skylightMat);
    [-4.2,4.2].forEach(x=>{box(2.9,.1,4.7,x,7.43,z-2.8,darkStone); box(2.6,.12,4.3,x,7.38,z-2.8);});
  }
  box(12,7.8,.4,0,3.9,-46);
  // Geometría acanalada compartida por todas las columnas.
  const shaftGeo = new THREE.CylinderGeometry(.32,.43,5.55,compact?48:96,6);
  const positions=shaftGeo.attributes.position;
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i),z=positions.getZ(i),a=Math.atan2(z,x);
    const flute=1-.055*(.5+.5*Math.cos(a*20)); positions.setX(i,x*flute); positions.setZ(i,z*flute);
  }
  shaftGeo.computeVertexNormals();
  const ringGeo = new THREE.TorusGeometry(.42,.075,8,32);
  function column(x,z,height=1) {
    const g=new THREE.Group();g.position.set(x,0,z);g.scale.y=height;scene.add(g);
    box(1,.24,1,0,.12,0,darkStone,g);box(.84,.15,.84,0,.32,0,marble,g);
    const shaft=new THREE.Mesh(shaftGeo,marble);shaft.position.y=3.2;shaft.castShadow=true;shaft.receiveShadow=true;g.add(shaft);
    [.52,5.98].forEach(y=>{const ring=new THREE.Mesh(ringGeo,marble);ring.rotation.x=Math.PI/2;ring.position.y=y;g.add(ring);});
    box(.95,.21,.95,0,6.13,0,marble,g); box(1.05,.15,1.05,0,6.31,0,marble,g);
  }
  [-5,-3.5,3.5,5].forEach(x=>column(x,5.2));
  for(let z=-3;z>-43;z-=6) [-5,5].forEach(x=>column(x,z,1.14));
  // Fachada con paso central, frontón triangular y friso de triglifos.
  [-4.3,4.3].forEach(x=>box(3.4,6.5,.65,x,3.25,3.7));
  box(12,1.05,1.7,0,6.9,4.35); box(12.6,.22,2,0,7.55,4.35);
  for(let x=-5.6;x<=5.6;x+=.8) { box(.22,.56,.12,x,6.98,5.25,darkStone); [-.065,.065].forEach(dx=>box(.018,.48,.035,x+dx,6.98,5.33,bronze)); }
  const triangle=new THREE.Shape();triangle.moveTo(-6.3,0);triangle.lineTo(0,2.15);triangle.lineTo(6.3,0);triangle.closePath();
  const pediment=new THREE.Mesh(new THREE.ExtrudeGeometry(triangle,{depth:.65,bevelEnabled:false}),marble);pediment.position.set(0,7.68,3.6);pediment.castShadow=true;scene.add(pediment);
  [-1,1].forEach(side=> { const cornice=box(6.7,.18,1.2,side*3.15,8.78,4.15); cornice.rotation.z=-side*Math.atan2(2.15,6.3); });
  const emblem = new THREE.Mesh(new THREE.TorusGeometry(.45,.035,8,48),bronze);emblem.position.set(0,8.34,4.28);scene.add(emblem);
  // Las puertas siguen la cámara también al retroceder.
  const doors=[];
  function portal(z,width,height,front=false) {
    const half=width/2;
    [-1,1].forEach(side=>box(.35,height+.25,.55,side*(half+.2),(height+.25)/2,z));
    box(width+1,.35,.6,0,height+.18,z);
    if(!front) {[-1,1].forEach(side=>box(6-half-.35,7.5,.3,side*(half+.35+(6-half-.35)/2),3.75,z)); box(width,.8,.3,0,7.05,z);}
    const hinges=[];
    [-1,1].forEach(side=> {
      const pivot=new THREE.Group(); pivot.position.set(side*half,0,z);scene.add(pivot);
      const center=-side*half/2;
      box(half,height,.15,center,height/2,0,doorMat,pivot);
      [-1,1].forEach(edge=>box(.065,height-.14,.035,center+edge*(half/2-.09),height/2,.09,bronze,pivot));
      [.12,height*.5,height-.12].forEach(y=>box(half-.16,.06,.045,center,y,.1,bronze,pivot));
      [.25,.75].forEach(f=>{box(half-.42,height*.38,.06,center,height*f,.12,bronze,pivot);box(half-.53,height*.38-.12,.075,center,height*f,.16,doorMat,pivot);});
      const handle=new THREE.Mesh(new THREE.TorusGeometry(.115,.025,8,24),bronze);handle.position.set(-side*(half-.22),height*.48,.27);pivot.add(handle);
      hinges.push({pivot,side});
    });
    doors.push({z,hinges,angle:0});
  }
  portal(3.8,4.6,5.8,true);portal(-11,6.6,6.45);portal(-23,6.6,6.45);
  const sun=new THREE.DirectionalLight('#ffe4b3',3.2);sun.position.set(-8,16,12);sun.target.position.set(0,0,-8);scene.add(sun,sun.target);
  sun.castShadow=!compact;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-13;sun.shadow.camera.right=13;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.camera.far=65;sun.shadow.normalBias=.035;sun.shadow.bias=-.0003;
  const fill=new THREE.DirectionalLight('#a6c9ee',1.1);fill.position.set(6,9,-20);scene.add(fill);
  scene.add(new THREE.HemisphereLight('#c8d5e4','#72604a',1.25));
  const inscription=canvasTex(1024,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#d8b881';g.font='500 56px Georgia';g.textAlign='center';g.fillText('M U S E O   J O S E M I',w/2,82);});
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(5.2,.65),new THREE.MeshBasicMaterial({map:inscription,transparent:true}));sign.position.set(0,6.28,5.22);scene.add(sign);
  return { update(camera,dt,reduce) {
    doors.forEach(d=>{
      const progress=THREE.MathUtils.smoothstep(d.z+9-camera.position.z,0,6);
      const target=progress*Math.PI*.48;
      d.angle=reduce?target:THREE.MathUtils.damp(d.angle,target,9,dt);
      d.hinges.forEach(({pivot,side})=>pivot.rotation.y=side*d.angle);
    });
  }};
}
