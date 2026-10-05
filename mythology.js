/** Motivos originales de Atenea, Hermes y Hefesto para las salas del museo. */
export function addMythology(THREE,scene,canvasTex,compact) {
  const stone=new THREE.MeshStandardMaterial({color:'#dbd2bd',roughness:.72});
  const bronze=new THREE.MeshStandardMaterial({color:'#a99060',metalness:.68,roughness:.36});
  const clayMap=canvasTex(512,512,(g,w,h)=>{
    g.fillStyle='#ac623e';g.fillRect(0,0,w,h);
    g.fillStyle='#292421';g.fillRect(0,65,w,20);g.fillRect(0,390,w,20);
    g.lineWidth=4;g.strokeStyle='#292421';
    for(let x=0;x<w;x+=48){g.beginPath();g.moveTo(x,40);g.lineTo(x+38,40);g.lineTo(x+38,15);g.lineTo(x+12,15);g.lineTo(x+12,30);g.lineTo(x+26,30);g.stroke();}
    // Siluetas de hojas de olivo en la cerámica de figuras negras.
    for(let x=0;x<w;x+=85){g.beginPath();g.moveTo(x+25,340);g.quadraticCurveTo(x+60,250,x+40,140);g.stroke();
      for(let y=170;y<335;y+=32){g.beginPath();g.ellipse(x+35,y,18,6,-.6,0,Math.PI*2);g.fill();g.beginPath();g.ellipse(x+55,y+14,18,6,.6,0,Math.PI*2);g.fill();}}
  });
  const clay=new THREE.MeshStandardMaterial({map:clayMap,roughness:.64,bumpMap:clayMap,bumpScale:.01});
  const vaseGeometry=new THREE.LatheGeometry([
    [0,0],[.2,0],[.21,.08],[.14,.17],[.26,.3],[.42,.65],[.43,.9],[.32,1.14],[.16,1.28],[.15,1.51],[.23,1.57],[.23,1.65],[.17,1.65]
  ].map(([x,y])=>new THREE.Vector2(x,y)),compact?24:40);
  const handleGeometry=new THREE.TorusGeometry(.23,.035,8,24,Math.PI*1.45);
  for(const [x,z] of [[-4,-4],[4,-7],[-4,-16],[4,-19],[-4,-28],[4,-31]]) {
    const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.55,.6,.3,24),stone);base.position.y=.15;base.castShadow=true;base.receiveShadow=true;group.add(base);
    const vase=new THREE.Mesh(vaseGeometry,clay);vase.position.y=.3;vase.castShadow=true;vase.receiveShadow=true;group.add(vase);
    [-1,1].forEach(side=>{const handle=new THREE.Mesh(handleGeometry,clay);handle.position.set(side*.28,1.53,0);handle.rotation.z=side<0?Math.PI*.75:Math.PI*-.25;group.add(handle);});
  }
  const panels=[{name:'ATENEA',caption:'SABIDURÍA · SALA I',z:-5.5,side:1,icon:'owl'},
    {name:'HERMES',caption:'INGENIO · SALA II',z:-17.5,side:-1,icon:'wings'},
    {name:'HEFESTO',caption:'CREACIÓN · SALA III',z:-29.5,side:1,icon:'hammer'}];
  function drawIcon(g,icon,x,y) {
    g.save();g.translate(x,y);g.strokeStyle='#ddbd83';g.fillStyle='#ddbd83';g.lineWidth=5;
    if(icon==='owl') {
      g.beginPath();g.ellipse(0,20,76,105,0,0,Math.PI*2);g.stroke();
      [-1,1].forEach(side=>{g.beginPath();g.arc(side*37,-12,33,0,Math.PI*2);g.stroke();g.beginPath();g.arc(side*37,-12,10,0,Math.PI*2);g.fill();
        g.beginPath();g.moveTo(side*70,-36);g.lineTo(side*85,-85);g.lineTo(side*20,-46);g.stroke();});
      g.beginPath();g.moveTo(-12,13);g.lineTo(0,39);g.lineTo(12,13);g.stroke();
      for(let i=0;i<3;i++){g.beginPath();g.moveTo(-40,55+i*19);g.lineTo(0,75+i*16);g.lineTo(40,55+i*19);g.stroke();}
    } else if(icon==='wings') {
      g.beginPath();g.moveTo(0,-90);g.lineTo(0,100);g.stroke();
      [-1,1].forEach(side=>{
        g.beginPath();g.moveTo(0,-15);g.bezierCurveTo(side*65,-70,side*125,-80,side*145,-115);g.bezierCurveTo(side*140,-20,side*70,10,0,10);g.stroke();
        for(let i=0;i<4;i++){g.beginPath();g.moveTo(side*(25+i*20),-18);g.lineTo(side*(60+i*18),-62-i*8);g.stroke();}
      });
      for(let side of [-1,1]){g.beginPath();g.moveTo(0,75);g.bezierCurveTo(side*70,45,side*60,20,0,0);g.stroke();}
    } else {
      g.rotate(-.35);g.strokeRect(-23,-95,118,46);g.fillRect(11,-46,16,155);
      g.rotate(.35);g.beginPath();g.moveTo(-90,95);g.lineTo(-67,54);g.lineTo(-48,74);g.lineTo(-23,25);g.stroke();
    }
    g.restore();
  }
  panels.forEach(p=>{
    const texture=canvasTex(512,768,(g,w,h)=>{
      g.fillStyle='#252c30';g.fillRect(0,0,w,h);g.strokeStyle='#a68b58';g.lineWidth=2;g.strokeRect(26,26,w-52,h-52);
      g.textAlign='center';g.fillStyle='#cab38b';g.font='20px Georgia';g.fillText('ΜΟΥΣΕΙΟΝ',w/2,100);
      drawIcon(g,p.icon,w/2,330);
      g.font='42px Georgia';g.fillStyle='#e8dcca';g.fillText(p.name,w/2,595);g.font='15px monospace';g.fillStyle='#a99474';g.fillText(p.caption,w/2,643);
      g.font='italic 19px Georgia';g.fillText('Donde las ideas cobran forma',w/2,700);
    });
    const backing=new THREE.Mesh(new THREE.BoxGeometry(2.05,3.08,.1),bronze);
    const group=new THREE.Group();group.position.set(p.side*5.72,3.45,p.z);group.rotation.y=p.side<0?Math.PI/2:-Math.PI/2;group.add(backing);
    const image=new THREE.Mesh(new THREE.PlaneGeometry(2,3),new THREE.MeshStandardMaterial({map:texture,roughness:.75}));image.position.z=.058;group.add(image);scene.add(group);
  });
  // Dos pebeteros custodian el pórtico. La luz fluctúa con suavidad.
  const flames=[];
  const fireMap=canvasTex(64,128,(g,w,h)=>{
    g.translate(w/2,h*.55);g.scale(1,2);
    const gradient=g.createRadialGradient(0,0,1,0,0,w*.48);gradient.addColorStop(0,'rgba(255,244,193,1)');gradient.addColorStop(.2,'rgba(255,177,72,.8)');gradient.addColorStop(.65,'rgba(245,88,23,.25)');gradient.addColorStop(1,'rgba(240,80,20,0)');g.fillStyle=gradient;g.fillRect(-w/2,-h/2,w,h);
  });
  [-1,1].forEach(side=>{
    const x=side*4.5,z=10;
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.3,.44,.18,24),stone);base.position.set(x,.09,z);scene.add(base);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.095,.18,1.2,20),bronze);stem.position.set(x,.75,z);scene.add(stem);
    const bowl=new THREE.Mesh(new THREE.SphereGeometry(.38,24,12,0,Math.PI*2,Math.PI/2,Math.PI/2),bronze);bowl.position.set(x,1.4,z);scene.add(bowl);
    const fire=new THREE.Group();fire.position.set(x,1.66,z);scene.add(fire);
    for(let i=0;i<3;i++){const plane=new THREE.Mesh(new THREE.PlaneGeometry(.6,.85),new THREE.MeshBasicMaterial({map:fireMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false}));plane.rotation.y=i*Math.PI/3;fire.add(plane);}
    const light=new THREE.PointLight('#ffb365',4,6,2);light.position.set(x,1.85,z);scene.add(light);flames.push({fire,light,phase:side*2});
  });
  return {update(t,reduce){flames.forEach(({fire,light,phase})=>{const pulse=reduce?1:1+Math.sin(t*2.3+phase)*.07+Math.sin(t*4.1+phase)*.03;fire.scale.set(1,pulse,1);light.intensity=3.8*pulse;});}};
}
