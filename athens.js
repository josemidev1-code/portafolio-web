/** Exterior: ágora ante el Partenón con el muro grabado del autor, y Atenas sobre las colinas al atardecer.
 *  La ciudad se dibuja con instancias (casas, tejados, cipreses y luces) para que cueste pocas llamadas de dibujo. */
import { fbmField, rng, worldUV } from './materials.js';
import { mergeGeometries } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/utils/BufferGeometryUtils.js';

export const WALL = { x: 8.2, z: 29.5, rot: -.95, w: 7.2, h: 4.2 };
const PLAZA_Y = -.6;

export function createAthens(THREE, scene, M, { compact, canvasTex, contactShadow }) {
  const random = rng(4242), group = new THREE.Group(); scene.add(group);
  /* Bloques de piedra agrupados por material al final; la textura se proyecta en metros reales. */
  const UVS = new Map([[M.wall, [1 / 3.4, 1 / 1.7]], [M.marbleGrey, [.5, .5]], [M.marble, [.45, .45]], [M.marbleWarm, [.4, .4]]]);
  const pending = new Map();
  function box(w, h, d, x, y, z, mat, matrix) {
    const g = new THREE.BoxGeometry(w, h, d).translate(x, y, z); if (matrix) g.applyMatrix4(matrix);
    worldUV(g, UVS.get(mat) || [.5, .5]);
    if (!pending.has(mat)) pending.set(mat, []); pending.get(mat).push(g);
  }
  function flush() {
    pending.forEach((list, mat) => { const m = new THREE.Mesh(mergeGeometries(list, false), mat); m.castShadow = m.receiveShadow = true; group.add(m); list.forEach(g => g.dispose()); });
    pending.clear();
  }
  // La meseta de la Acrópolis: superelipse que abraza la plaza y el templo.
  const AX = 27, AZ = 58, CZ = 0;
  const rInner = a => 1 / Math.pow(Math.pow(Math.abs(Math.cos(a)) / AX, 4) + Math.pow(Math.abs(Math.sin(a)) / AZ, 4), .25);

  /* ---------- Terreno: colinas alrededor de la Acrópolis ---------- */
  const segR = compact ? 40 : 70, segA = compact ? 120 : 200, SPAN = 165;
  const H = fbmField(256, { period: 4, octaves: 5, seed: 77 });
  // Fuera de la meseta el terreno cae hacia la ciudad y sube en colinas lejanas (Licabeto, Himeto).
  const height = (x, z) => {
    const a = Math.atan2(z - CZ, x), t = Math.max(0, Math.hypot(x, z - CZ) - rInner(a));
    const n = H[(Math.floor((a / (Math.PI * 2) + .5) * 255) & 255) * 256 + Math.min(255, Math.floor(t / SPAN * 255))];
    return PLAZA_Y - 1.5 - 10 * Math.min(1, t / 22) + Math.max(0, t - 45) * .24 + (n - .5) * 24 * Math.min(1, t / 70);
  };
  const tg = new THREE.BufferGeometry(), tp = [], tc = [], ti = [];
  for (let i = 0; i <= segR; i++) for (let j = 0; j <= segA; j++) {
    const a = j / segA * Math.PI * 2, r = rInner(a) + 1.5 + SPAN * Math.pow(i / segR, 1.4);
    const x = Math.cos(a) * r, z = Math.sin(a) * r + CZ, y = height(x, z);
    tp.push(x, y, z);
    const g = .5 + .5 * Math.sin(x * .07 + z * .05);
    tc.push(.36 + .06 * g, .33 + .05 * g, .26 + .03 * g);
  }
  for (let i = 0; i < segR; i++) for (let j = 0; j < segA; j++) { const a = i * (segA + 1) + j, b = a + segA + 1; ti.push(a, b, a + 1, b, b + 1, a + 1); }
  tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setAttribute('color', new THREE.Float32BufferAttribute(tc, 3)); tg.setIndex(ti); tg.computeVertexNormals();
  const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); terrain.receiveShadow = true; group.add(terrain);
  // Acantilado de la Acrópolis y suelo de la meseta.
  const cliff = [], cliffIdx = [], top = [];
  const NC = 160;
  for (let j = 0; j <= NC; j++) {
    const a = j / NC * Math.PI * 2, r = rInner(a), x = Math.cos(a) * r, z = Math.sin(a) * r + CZ;
    cliff.push(x, PLAZA_Y - .02, z, x * 1.06, PLAZA_Y - 13, z * 1.04 + CZ * -.04); top.push(new THREE.Vector2(x, -z));
    if (j < NC) { const k = j * 2; cliffIdx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cliff, 3)); cg.setIndex(cliffIdx); cg.computeVertexNormals();
  const cuv = []; for (let j = 0; j <= NC; j++) cuv.push(j / NC * 60, 0, j / NC * 60, 4); cg.setAttribute('uv', new THREE.Float32BufferAttribute(cuv, 2));
  group.add(new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: '#8a7b68', map: M.wall.map, roughness: 1, side: THREE.DoubleSide })));
  const plateau = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(top)), new THREE.MeshStandardMaterial({ color: '#7d7264', roughness: 1 }));
  plateau.rotation.x = -Math.PI / 2; plateau.position.y = PLAZA_Y - .03; plateau.receiveShadow = true; group.add(plateau);

  /* ---------- Casas, tejados, cipreses y luces de la ciudad ---------- */
  const houses = [], spots = [];
  const N = compact ? 650 : 1500;
  for (let k = 0; k < N * 3 && houses.length < N; k++) {
    const a = random() * Math.PI * 2, r = rInner(a) + 7 + Math.pow(random(), .8) * 125;
    const x = Math.cos(a) * r, z = Math.sin(a) * r + CZ;
    const y = height(x, z); if (y > 22) continue;
    houses.push({ x, y, z, w: 2.5 + random() * 4, d: 2.5 + random() * 4, h: 2.2 + random() * 3.2 * (random() < .15 ? 2 : 1), rot: Math.round(random() * 4) * Math.PI / 2 + (random() - .5) * .3 });
  }
  const wallGeo = new THREE.BoxGeometry(1, 1, 1); wallGeo.translate(0, .5, 0);
  const roofGeo = new THREE.CylinderGeometry(.62, .62, 1, 3, 1); roofGeo.rotateZ(Math.PI / 2); roofGeo.rotateY(Math.PI / 2); roofGeo.scale(1.08, .5, 1.08); roofGeo.translate(0, .17, 0);
  // Fachada encalada con ventanas y puerta en sombra, y un zócalo más oscuro: las casas dejan de ser bloques.
  const facade = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, h, 0, h * .6); gr.addColorStop(0, 'rgba(90,70,50,.45)'); gr.addColorStop(1, 'rgba(90,70,50,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3a2c22'; [[40, 60], [150, 60], [40, 130], [190, 130]].forEach(([x, y]) => g.fillRect(x, y, 26, 34));
    g.fillStyle = '#2a1f18'; g.fillRect(104, 160, 44, 96);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, w, 10);
  });
  const walls = new THREE.InstancedMesh(wallGeo, new THREE.MeshStandardMaterial({ roughness: .95, map: facade }), houses.length);
  const roofs = new THREE.InstancedMesh(roofGeo, new THREE.MeshStandardMaterial({ roughness: .8 }), houses.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  const wallTones = ['#e8dfcf', '#dcccb0', '#cfb995', '#e9e2d6', '#c9a77f', '#d8c3a2'], roofTones = ['#8f4a31', '#9a5a3c', '#7f432e', '#a0633f', '#74402c'];
  houses.forEach((h, i) => {
    q.setFromEuler(e.set(0, h.rot, 0));
    m4.compose(new THREE.Vector3(h.x, h.y - .4, h.z), q, new THREE.Vector3(h.w, h.h + .4, h.d)); walls.setMatrixAt(i, m4);
    walls.setColorAt(i, col.set(wallTones[i % wallTones.length]).multiplyScalar(.9 + random() * .15));
    m4.compose(new THREE.Vector3(h.x, h.y + h.h, h.z), q, new THREE.Vector3(h.w, Math.min(h.w, h.d) * .9, h.d)); roofs.setMatrixAt(i, m4);
    roofs.setColorAt(i, col.set(roofTones[(i * 7) % roofTones.length]).multiplyScalar(.85 + random() * .2));
    if (random() < .45) spots.push(h.x + (random() - .5) * h.w, h.y + 1 + random() * h.h * .6, h.z + (random() - .5) * h.d);
  });
  walls.receiveShadow = roofs.receiveShadow = true; group.add(walls, roofs);
  // Cipreses y olivos.
  const cyp = new THREE.InstancedMesh(new THREE.ConeGeometry(.9, 7, 7).translate(0, 3.5, 0), new THREE.MeshStandardMaterial({ color: '#2c3a26', roughness: 1 }), compact ? 220 : 520);
  for (let i = 0; i < cyp.count; i++) {
    const a = random() * Math.PI * 2, r = rInner(a) + 4 + random() * 115, x = Math.cos(a) * r, z = Math.sin(a) * r + CZ;
    const s = .6 + random() * .8; m4.compose(new THREE.Vector3(x, height(x, z) - .3, z), q.identity(), new THREE.Vector3(s, s * (.8 + random() * .6), s)); cyp.setMatrixAt(i, m4);
  }
  group.add(cyp);
  // Luces cálidas de ventanas y hogueras: puntos aditivos que titilan.
  const lightGeo = new THREE.BufferGeometry(); lightGeo.setAttribute('position', new THREE.Float32BufferAttribute(spots, 3));
  const seeds = new Float32Array(spots.length / 3).map(() => random()); lightGeo.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  const cityLights = new THREE.Points(lightGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 } },
    vertexShader: 'attribute float seed; uniform float uTime; varying float vA; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vA=.55+.45*sin(uTime*(1.5+seed*3.)+seed*40.); gl_PointSize=(2.+seed*2.5)*(140./-mv.z); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'varying float vA; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d)*vA; gl_FragColor=vec4(vec3(1.,.62,.28)*a*1.4,a); }'
  }));
  group.add(cityLights);
  // Algunos templos y una estoa en las colinas, con columnas a escala.
  const minor = [[-80, 40, 1.2], [95, -10, 1], [-105, -70, 1.4], [70, -120, 1.1], [-45, -140, .9], [40, 120, 1.2]];
  minor.forEach(([x, z, s]) => {
    const y = height(x, z), g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s * 1.6); g.rotation.y = Math.atan2(-x, -z); group.add(g);
    const add = (w, h, d, px, py, pz, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(px, py, pz); g.add(m); };
    add(9, .8, 5, 0, .4, 0, M.marbleWarm); add(7.6, 3.6, 3.6, 0, 2.6, 0, M.marbleWarm);
    for (let i = 0; i < 6; i++) add(.45, 3.6, .45, -3.6 + i * 1.44, 2.6, 2.1, M.marble);
    add(8.6, .7, 4.8, 0, 4.75, 0, M.marble);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 8.6, 3, 1), new THREE.MeshStandardMaterial({ color: '#9a4e30', roughness: .9 }));
    roof.rotation.z = Math.PI / 2; roof.rotation.x = Math.PI / 2; roof.scale.set(1, 1, .45); roof.position.y = 5.35; g.add(roof);
  });

  /* ---------- Plaza: muro perimetral, cipreses en jardineras, estandartes y mosaico ---------- */
  [-1, 1].forEach(s => {
    box(.6, 1.1, 44, s * 21, PLAZA_Y + .55, 28, M.wall); box(.8, .12, 44.2, s * 21, PLAZA_Y + 1.16, 28, M.marble);
  });
  [-1, 1].forEach(s => { box(15.4, 1.1, .6, s * 13.3, PLAZA_Y + .55, 50, M.wall); box(15.6, .12, .8, s * 13.3, PLAZA_Y + 1.16, 50, M.marble); });
  // Propileo de entrada: dos antas y un dintel.
  [-1, 1].forEach(s => box(1.1, 5, 1.1, s * 5.3, PLAZA_Y + 2.5, 50, M.marbleWarm));
  box(12, .9, 1.4, 0, PLAZA_Y + 5.45, 50, M.marble);
  const cypMat = new THREE.MeshStandardMaterial({ color: '#2f3d29', roughness: 1 });
  for (let z = 14; z <= 44; z += 6) [-1, 1].forEach(s => {
    const x = s * (s > 0 && Math.abs(z - WALL.z) < 5 ? 15 : 11.5);
    box(1.6, .7, 1.6, x, PLAZA_Y + .35, z, M.marbleGrey);
    const c = new THREE.Mesh(new THREE.ConeGeometry(.75, 6.2, 10).translate(0, 3.1, 0), cypMat); c.position.set(x, PLAZA_Y + .7, z); c.castShadow = true; group.add(c);
    contactShadow(x, z, 2.6, 2.6, PLAZA_Y + .006);
  });
  // Mosaico circular en el centro de la plaza.
  const mosaic = canvasTex(1024, 1024, (g, w) => {
    const c = w / 2; g.fillStyle = '#d9cbb0'; g.fillRect(0, 0, w, w);
    const ring = (r0, r1, color) => { g.beginPath(); g.arc(c, c, r1, 0, Math.PI * 2); g.arc(c, c, r0, 0, Math.PI * 2, true); g.fillStyle = color; g.fill(); };
    ring(470, 505, '#7a2e1d'); ring(400, 470, '#e2d5bc'); ring(380, 400, '#26324a'); ring(250, 380, '#c9b48f'); ring(235, 250, '#7a2e1d');
    g.strokeStyle = '#26324a'; g.lineWidth = 12;
    for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; g.save(); g.translate(c, c); g.rotate(a); g.beginPath(); g.moveTo(-18, -405); g.lineTo(18, -405); g.lineTo(18, -462); g.lineTo(-10, -462); g.lineTo(-10, -428); g.lineTo(6, -428); g.stroke(); g.restore(); }
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.save(); g.translate(c, c); g.rotate(a); g.fillStyle = k % 2 ? '#8a3a22' : '#b28a4a'; g.beginPath(); g.moveTo(0, -250); g.quadraticCurveTo(40, -150, 0, -40); g.quadraticCurveTo(-40, -150, 0, -250); g.fill(); g.restore(); }
    ring(0, 60, '#b28a4a'); ring(0, 30, '#7a2e1d');
    // Teselas: retícula fina para leer el mosaico de cerca.
    g.globalAlpha = .18; g.strokeStyle = '#3a2e22'; g.lineWidth = 1; for (let x = 0; x < w; x += 9) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, w); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(w, x); g.stroke(); } g.globalAlpha = 1;
  });
  const mos = new THREE.Mesh(new THREE.CircleGeometry(5.2, 96), new THREE.MeshStandardMaterial({ map: mosaic, roughness: .7 }));
  mos.rotation.x = -Math.PI / 2; mos.position.set(0, PLAZA_Y + .012, 31); mos.receiveShadow = true; group.add(mos);

  /* ---------- Muro grabado del autor ---------- */
  const wall = new THREE.Group(); wall.position.set(WALL.x, PLAZA_Y, WALL.z); wall.rotation.y = WALL.rot; scene.add(wall); wall.updateMatrixWorld(true);
  const add = (w, h, d, x, y, z, mat) => box(w, h, d, x, y, z, mat, wall.matrixWorld);
  const W = WALL.w, Hh = WALL.h;
  add(W + 1.2, .35, 1.4, 0, .175, 0, M.marbleGrey); add(W + .9, .25, 1.2, 0, .475, 0, M.marbleWarm);
  add(W, Hh, .8, 0, .6 + Hh / 2, -.1, M.wall);
  [-1, 1].forEach(s => add(.55, Hh + .1, .95, s * (W / 2 - .1), .6 + (Hh + .1) / 2, 0, M.marble));
  add(W + .7, .35, 1.15, 0, .6 + Hh + .17, 0, M.marble); add(W + .9, .14, 1.25, 0, .6 + Hh + .41, 0, M.marble);
  // Frontón pequeño sobre el muro.
  const tri = new THREE.Shape(); tri.moveTo(-W / 2 - .4, 0); tri.lineTo(0, 1.05); tri.lineTo(W / 2 + .4, 0); tri.closePath();
  const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: .9, bevelEnabled: false }), M.marbleWarm); ped.position.set(0, .6 + Hh + .48, -.5); ped.castShadow = true; wall.add(ped);
  // Panel de mármol con el texto grabado: color y relieve salen del mismo lienzo.
  const PW = W - 1.2, PH = Hh - .7, S = compact ? 1536 : 2048;
  const lines = [
    ['name', 'JOSÉ MIGUEL MIRALLES GANDIA'],
    ['rule'],
    ['role', 'Estudiante de 1.º de DAM'],
    ['role2', 'Desarrollo de Aplicaciones Multiplataforma'],
    ['school', 'IES Dr. Lluís Simarro'],
    ['gap'],
    ['body', 'Busco un lugar donde trabajar y seguir creciendo.'],
    ['body', 'Hago páginas web y estoy aprendiendo a crear'],
    ['body', 'automatizaciones con IA para empresas.']
  ];
  function drawInscription(g, w, h, relief) {
    g.fillStyle = relief ? '#ffffff' : 'rgba(0,0,0,0)'; g.fillRect(0, 0, w, h); if (!relief) g.clearRect(0, 0, w, h);
    const u = w / 2048; g.textAlign = 'center';
    const styles = { name: [`600 ${132 * u}px "Cinzel", Georgia, serif`, 165, '10px'], role: [`600 ${76 * u}px "Cinzel", Georgia, serif`, 104, '4px'],
      role2: [`italic 500 ${72 * u}px "Cormorant Garamond", Georgia, serif`, 94, '1px'], school: [`600 ${64 * u}px "Cinzel", Georgia, serif`, 112, '6px'],
      body: [`500 ${76 * u}px "Cormorant Garamond", Georgia, serif`, 94, '0px'] };
    let y = 150 * u;
    lines.forEach(([kind, text]) => {
      if (kind === 'rule') { g.fillStyle = relief ? '#000' : 'rgba(30,22,14,.75)'; g.fillRect(w / 2 - 220 * u, y - 46 * u, 440 * u, 6 * u); g.fillRect(w / 2 - 8 * u, y - 57 * u, 16 * u, 28 * u); y += 70 * u; return; }
      if (kind === 'gap') { y += 30 * u; return; }
      const [font, adv, ls] = styles[kind]; g.font = font; if (g.letterSpacing !== undefined) g.letterSpacing = ls;
      // Cada línea se ajusta al ancho del panel con margen: nunca se corta el grabado.
      const fit = Math.min(1, w * .88 / g.measureText(text).width);
      if (fit < 1) g.font = font.replace(/([\d.]+)px/, (m, n) => `${n * fit}px`);
      if (relief) { g.fillStyle = '#000'; g.fillText(text, w / 2, y); }
      else { g.fillStyle = 'rgba(255,244,226,.5)'; g.fillText(text, w / 2, y + 3 * u); g.fillStyle = kind === 'name' ? 'rgba(64,40,18,.95)' : 'rgba(40,28,18,.9)'; g.fillText(text, w / 2, y); }
      y += adv * u;
    });
  }
  const textTex = canvasTex(S, S / 2, (g, w, h) => drawInscription(g, w, h, false), { text: true });
  const reliefTex = canvasTex(S, S / 2, (g, w, h) => drawInscription(g, w, h, true), { text: true }); reliefTex.colorSpace = THREE.NoColorSpace;
  add(PW + .2, PH + .2, .08, 0, .6 + Hh / 2 - .05, .33, M.marble);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: textTex, transparent: true, bumpMap: reliefTex, bumpScale: 2.2, roughness: .75, depthWrite: false }));
  panel.position.set(0, .6 + Hh / 2 - .05, .372); panel.receiveShadow = true; wall.add(panel);
  // El relieve necesita un soporte opaco: se dibuja sobre el mármol del panel.
  const reliefOnly = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: M.marble.map, color: '#efe6d6', bumpMap: reliefTex, bumpScale: 2.2, roughness: .6 }));
  reliefOnly.position.set(0, .6 + Hh / 2 - .05, .371); wall.add(reliefOnly);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, 1), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(0, .6 + Hh / 2, .3); wall.add(hit);
  contactShadow(WALL.x, WALL.z, 9, 3, PLAZA_Y + .006);
  // Un brasero ilumina el texto desde abajo y a un lado.
  flush();

  return {
    wallHit: hit,
    update(t, camera) { cityLights.material.uniforms.uTime.value = t; }
  };
}
