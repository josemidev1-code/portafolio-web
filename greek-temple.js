/** Arquitectura del museo: mármol, pórtico dórico y puertas articuladas. */
import { mergeGeometries } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/utils/BufferGeometryUtils.js';
import { smootherStep } from './motion.js';

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
  const marble = new THREE.MeshStandardMaterial({ color: '#eee8dc', map: marbleMap, bumpMap: marbleMap, bumpScale: .018, roughness: .52 });
  const darkStone = new THREE.MeshStandardMaterial({ color: '#a69d89', map: marbleMap, roughness: .75 });
  const bronze = new THREE.MeshStandardMaterial({ color: '#b89a61', metalness: .78, roughness: .27 });
  const woodMap = canvasTex(256,512,(g,w,h)=> {
    g.fillStyle='#443d32';g.fillRect(0,0,w,h);
    for(let i=0;i<180;i++){g.strokeStyle=i%3?'rgba(20,16,11,.12)':'rgba(173,145,94,.12)';g.lineWidth=.5;
      g.beginPath();g.moveTo(i*1.6,0);for(let y=0;y<h;y+=12)g.lineTo(i*1.6+Math.sin(y*.017+i)*1.5,y);g.stroke();}
  });
  const doorMat = new THREE.MeshStandardMaterial({ color: '#6b6252', map: woodMap, bumpMap: woodMap, bumpScale:.015, metalness: .12, roughness: .42 });
  // Los biseles capturan la luz sin cargar modelos externos.
  const bevelCache = new Map();
  function softBox(w,h,d) {
    const key=[w,h,d].join('/'); if(bevelCache.has(key))return bevelCache.get(key);
    const b=Math.min(.055,w*.09,h*.09,d*.18),x=w/2-b,y=h/2-b,r=Math.min(b,x*.3,y*.3);
    const s=new THREE.Shape();s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);
    s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);s.lineTo(-x+r,y);s.quadraticCurveTo(-x,y,-x,y-r);
    s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);
    const geo=new THREE.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:compact?2:3,steps:1,curveSegments:3});
    geo.translate(0,0,-d/2+b);bevelCache.set(key,geo);return geo;
  }
  const contactMap=canvasTex(128,128,(g,w,h)=>{
    const gradient=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);gradient.addColorStop(0,'rgba(19,16,12,.5)');gradient.addColorStop(.3,'rgba(19,16,12,.3)');gradient.addColorStop(1,'rgba(19,16,12,0)');g.fillStyle=gradient;g.fillRect(0,0,w,h);
  });
  function contactShadow(x,z,size) {
    const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:contactMap,transparent:true,depthWrite:false,opacity:.75}));
    m.rotation.x=-Math.PI/2;m.position.set(x,.012,z);scene.add(m);
  }
  function box(w, h, d, x, y, z, mat = marble, parent = scene) {
    const m = new THREE.Mesh(softBox(w,h,d),mat); m.position.set(x,y,z);
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
    const flute=(1-.085*(.5+.5*Math.cos(a*20)))*(1+.022*Math.sin((positions.getY(i)/5.55+.5)*Math.PI)); positions.setX(i,x*flute); positions.setZ(i,z*flute);
  }
  shaftGeo.computeVertexNormals();
  const ringGeo = new THREE.TorusGeometry(.42,.075,8,32);
  function column(x,z,height=1) {
    const g=new THREE.Group();g.position.set(x,0,z);g.scale.y=height;scene.add(g); contactShadow(x,z,2.3);
    box(1,.24,1,0,.12,0,darkStone,g);box(.84,.15,.84,0,.32,0,marble,g);
    const shaft=new THREE.Mesh(shaftGeo,marble);shaft.position.y=3.2;shaft.castShadow=true;shaft.receiveShadow=true;g.add(shaft);
    [.52,.65,5.98].forEach(y=>{const ring=new THREE.Mesh(ringGeo,marble);ring.rotation.x=Math.PI/2;ring.position.y=y;g.add(ring);});
    const echinus=new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(.33,0),new THREE.Vector2(.38,.06),new THREE.Vector2(.46,.15),new THREE.Vector2(.49,.23)],compact?32:64),marble);echinus.position.y=5.94;echinus.castShadow=true;echinus.receiveShadow=true;g.add(echinus);
    box(.95,.14,.95,0,6.2,0,marble,g); box(1.05,.15,1.05,0,6.31,0,marble,g);
  }
  [-5,-3.5,3.5,5].forEach(x=>column(x,5.2));
  for(let z=-3;z>-43;z-=6) [-5,5].forEach(x=>column(x,z,1.14));
  // Fachada con paso central, frontón triangular y friso de triglifos.
  [-4.3,4.3].forEach(x=>box(3.4,6.5,.65,x,3.25,3.7));
  box(12,1.05,1.7,0,6.9,4.35); box(12.6,.22,2,0,7.55,4.35);
  for(let x=-5.6;x<=5.6;x+=.8) { box(.22,.56,.12,x,6.98,5.25,darkStone); [-.065,.065].forEach(dx=>box(.018,.48,.035,x+dx,6.98,5.33,bronze)); }
  const triangle=new THREE.Shape();triangle.moveTo(-6.3,0);triangle.lineTo(0,2.15);triangle.lineTo(6.3,0);triangle.closePath();
  const pediment=new THREE.Mesh(new THREE.ExtrudeGeometry(triangle,{depth:.65,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:3}),marble);pediment.position.set(0,7.68,3.6);pediment.castShadow=true;scene.add(pediment);
  [-1,1].forEach(side=> { const cornice=box(6.7,.18,1.2,side*3.15,8.78,4.15); cornice.rotation.z=-side*Math.atan2(2.15,6.3); });
  const meanderMap=canvasTex(1024,64,(g,w,h)=>{
    g.clearRect(0,0,w,h);g.strokeStyle='#75644a';g.lineWidth=4;
    for(let x=0;x<w;x+=64){g.beginPath();g.moveTo(x,50);g.lineTo(x+54,50);g.lineTo(x+54,12);g.lineTo(x+14,12);g.lineTo(x+14,37);g.lineTo(x+39,37);g.lineTo(x+39,25);g.stroke();}
  });
  const frieze=new THREE.Mesh(new THREE.PlaneGeometry(11.8,.38),new THREE.MeshStandardMaterial({map:meanderMap,transparent:true,roughness:.65}));frieze.position.set(0,7.49,5.39);scene.add(frieze);
  const emblem = new THREE.Mesh(new THREE.TorusGeometry(.45,.035,8,48),bronze);emblem.position.set(0,8.34,4.28);scene.add(emblem);
  // Las puertas siguen la cámara también al retroceder.
  const doors=[];
  function portal(z,width,height,front=false) {
    const half=width/2;
    // Marco escalonado: cada moldura proyecta su propia sombra.
    for(let layer=0;layer<3;layer++) {
      const offset=layer*.105;
      [-1,1].forEach(side=>box(.11,height+.45+offset*2,.13,side*(half+.34+offset),(height+.45)/2,z+.28+layer*.055));
      box(width+.78+offset*2,.11,.13,0,height+.43+offset,z+.28+layer*.055);
    }
    [-1,1].forEach(side=>box(.35,height+.25,.55,side*(half+.2),(height+.25)/2,z));
    box(width+1,.35,.6,0,height+.18,z);
    if(!front) {[-1,1].forEach(side=>box(6-half-.35,7.5,.3,side*(half+.35+(6-half-.35)/2),3.75,z)); box(width,.8,.3,0,7.05,z);}
    const hinges=[];
    [-1,1].forEach(side=> {
      const pivot=new THREE.Group(); pivot.userData.movingDoor=true; pivot.position.set(side*half,0,z);scene.add(pivot);
      const center=-side*half/2;
      box(half-.018,height,.22,center,height/2,0,doorMat,pivot);
      // Paneles en relieve, molduras finas y rosetas de bronce.
      [-1,1].forEach(edge=>box(.034,height-.18,.055,center+edge*(half/2-.075),height/2,.145,bronze,pivot));
      [.13,height-.13].forEach(y=>box(half-.15,.034,.05,center,y,.15,bronze,pivot));
      [.25,.75].forEach(f=>{
        const panelW=half-.42,panelH=height*.39,y=height*f;
        box(panelW,panelH,.075,center,y,.135,bronze,pivot);
        box(panelW-.07,panelH-.07,.08,center,y,.18,doorMat,pivot);
        [-1,1].forEach(edge=>{
          box(.025,panelH-.18,.035,center+edge*(panelW/2-.085),y,.23,bronze,pivot);
          box(panelW-.17,.025,.035,center,y+edge*(panelH/2-.085),.23,bronze,pivot);
        });
        const medallion=new THREE.Mesh(new THREE.TorusGeometry(.16,.018,8,32),bronze);medallion.position.set(center,y,.25);pivot.add(medallion);
        for(let petal=0;petal<8;petal++){
          const angle=petal*Math.PI/4;
          const leaf=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),bronze);leaf.scale.set(.65,1.8,.4);leaf.position.set(center+Math.sin(angle)*.092,y+Math.cos(angle)*.092,.255);leaf.rotation.z=-angle;pivot.add(leaf);
        }
      });
      const handleX=-side*(half-.21);
      box(.12,.34,.055,handleX,height*.49,.17,bronze,pivot);
      const handle=new THREE.Mesh(new THREE.TorusGeometry(.105,.018,12,40),bronze);handle.position.set(handleX,height*.48,.255);pivot.add(handle);
      [.8,height-.8].forEach(y=>{
        const hinge=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.28,12),bronze);hinge.position.set(0,y,.05);pivot.add(hinge);
      });
      // Cada hoja gira como dos superficies agrupadas, en lugar de decenas de piezas.
      pivot.updateMatrixWorld(true);
      const leafBatches=new Map();
      [...pivot.children].forEach(mesh=>{
        if(!leafBatches.has(mesh.material))leafBatches.set(mesh.material,[]);
        leafBatches.get(mesh.material).push(mesh);
      });
      leafBatches.forEach((meshes,material)=>{
        const geometries=meshes.map(m=>(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(m.matrix));
        const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
        if(!geometry)return;
        meshes.forEach(m=>pivot.remove(m));const merged=new THREE.Mesh(geometry,material);merged.castShadow=true;merged.receiveShadow=true;pivot.add(merged);
      });
      hinges.push({pivot,side});
    });
    doors.push({z,hinges,angle:0});
  }
  portal(3.8,4.6,5.8,true);portal(-11,6.6,6.45);portal(-23,6.6,6.45);
  const sun=new THREE.DirectionalLight('#ffe7c6',2.5);sun.position.set(-12,18,14);sun.target.position.set(0,0,-8);scene.add(sun,sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(compact?1024:2048,compact?1024:2048);sun.shadow.radius=4;sun.shadow.blurSamples=8;sun.shadow.camera.left=-13;sun.shadow.camera.right=13;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.camera.far=65;sun.shadow.normalBias=.035;sun.shadow.bias=-.0003;
  const fill=new THREE.DirectionalLight('#a6c9ee',.65);fill.position.set(6,9,-20);scene.add(fill);
  scene.add(new THREE.HemisphereLight('#c8d5e4','#544739',.72));
  const inscription=canvasTex(1024,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#d8b881';g.font='500 56px Georgia';g.textAlign='center';g.fillText('M U S E O   J O S E M I',w/2,82);});
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(5.2,.65),new THREE.MeshBasicMaterial({map:inscription,transparent:true}));sign.position.set(0,6.28,5.22);scene.add(sign);
  // Agrupa la arquitectura inmóvil por material para reducir trabajo de la GPU.
  scene.updateMatrixWorld(true);
  const batches=new Map();
  scene.traverse(mesh=>{
    if(!mesh.isMesh || mesh.material.transparent)return;
    for(let parent=mesh.parent;parent;parent=parent.parent)if(parent.userData.movingDoor)return;
    const key=mesh.material;
    if(!batches.has(key))batches.set(key,[]);
    batches.get(key).push(mesh);
  });
  batches.forEach((meshes,material)=>{
    if(meshes.length<2)return;
    const geometries=meshes.map(m=>(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(m.matrixWorld));
    const geometry=mergeGeometries(geometries,false);
    geometries.forEach(g=>g.dispose());
    if(!geometry)return;
    meshes.forEach(m=>m.parent.remove(m));
    const merged=new THREE.Mesh(geometry,material);merged.castShadow=true;merged.receiveShadow=true;scene.add(merged);
  });
  return { update(camera,dt,reduce) {
    doors.forEach(d=>{
      const progress=smootherStep((d.z+14-camera.position.z)/11);
      const target=progress*Math.PI*.48;
      d.angle=reduce?target:THREE.MathUtils.damp(d.angle,target,3.8,dt);
      d.hinges.forEach(({pivot,side})=>pivot.rotation.y=side*d.angle);
    });
  }};
}
