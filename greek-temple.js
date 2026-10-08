/** Arquitectura del museo: pórtico dórico hexástilo, sala columnada con entablamento,
 *  techo de casetones pintados, lucernarios con haces de luz y puertas de bronce. */
import { mergeGeometries } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/utils/BufferGeometryUtils.js';
import { smootherStep } from './motion.js';
import { Reflector } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/objects/Reflector.js';
import { worldUV } from './materials.js';
import { muralTexture } from './murals.js';

// Dirección del sol: alto y desde la izquierda del pórtico, para que entre por los lucernarios.
export const SUN_OFFSET = [-7, 22, 9];
const HALL = { x: 6, top: 8, start: 4.05, end: -46.2 };

export function createGreekMuseum(THREE, scene, canvasTex, compact, M) {
  const statics = new THREE.Group(); scene.add(statics);
  // Escala de la proyección de textura en metros reales por material.
  const uvScale = new Map([[M.wall, [1 / 3.4, 1 / 1.7]], [M.darkStone, [1 / 3.2, 1 / 1.1]], [M.marble, [.45, .45]], [M.marbleWarm, [.4, .4]], [M.marbleGrey, [.5, .5]], [M.bronze, [.8, .8]], [M.paleWall, [.3, .3]], [M.dado, [.45, .45]], [M.redMarble, [.5, .5]]]);

  /* Bloques con un chaflán fino: aristas nítidas que atrapan la luz, sin aspecto blando. */
  const boxCache = new Map(), plain = new THREE.BoxGeometry(1, 1, 1);
  function chamferBox(w, h, d) {
    const key = [w, h, d].map(n => n.toFixed(3)).join('/'); if (boxCache.has(key)) return boxCache.get(key);
    const b = Math.min(.018, w * .08, h * .08, d * .08), x = w / 2 - b, y = h / 2 - b;
    const s = new THREE.Shape(); s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 1 });
    geo.translate(0, 0, -d / 2 + b); boxCache.set(key, geo); return geo;
  }
  function box(w, h, d, x, y, z, mat = M.marble, parent = statics) {
    const small = Math.min(w, h, d) < .1;
    const m = new THREE.Mesh(small ? plain : chamferBox(w, h, d), mat);
    if (small) m.scale.set(w, h, d);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
  }
  const contactMap = canvasTex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(14,11,8,.55)'); gr.addColorStop(.45, 'rgba(14,11,8,.28)'); gr.addColorStop(1, 'rgba(14,11,8,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const contactMat = new THREE.MeshBasicMaterial({ map: contactMap, transparent: true, depthWrite: false, opacity: .8 });
  function contactShadow(x, z, sx, sz = sx, y = .006) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), contactMat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = 1; scene.add(m);
  }

  /* ---------- Suelos ---------- */
  // Mármol oscuro pulido en losas de dos metros, con un reflejo real en calidad alta.
  const floorGeo = new THREE.PlaneGeometry(12, HALL.start - HALL.end);
  const floor = new THREE.Mesh(floorGeo, M.withRepeat(M.polished, 12 / 4, (HALL.start - HALL.end) / 4));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (HALL.start + HALL.end) / 2); floor.receiveShadow = true; scene.add(floor);
  const mirror = new Reflector(floorGeo, {
    textureWidth: 512, textureHeight: 512, clipBias: .003,
    shader: {
      name: 'ReflejoPulido',
      uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, strength: { value: .55 } },
      vertexShader: 'uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorld; void main(){ vUv = textureMatrix * vec4(position, 1.); vec4 w = modelMatrix * vec4(position, 1.); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      // Fresnel: casi espejo en ángulo rasante, apenas un velo mirando hacia abajo.
      fragmentShader: 'uniform sampler2D tDiffuse; uniform float strength; varying vec4 vUv; varying vec3 vWorld; void main(){ vec3 r = texture2DProj(tDiffuse, vUv).rgb; vec3 v = normalize(cameraPosition - vWorld); float f = .12 + .88 * pow(1. - max(v.y, 0.), 4.); gl_FragColor = vec4(r * strength * f, 1.); }'
    }
  });
  mirror.material.transparent = true; mirror.material.blending = THREE.AdditiveBlending; mirror.material.depthWrite = false;
  mirror.rotation.x = -Math.PI / 2; mirror.position.set(0, .003, (HALL.start + HALL.end) / 2); mirror.renderOrder = 1; scene.add(mirror);
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(42.4, 43.4), M.withRepeat(M.floor, 42.4 / 7, 43.4 / 7));
  plaza.material = plaza.material.clone(); plaza.material.color.set('#8d8475'); plaza.material.roughness = 1.25;
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, -.6, 28.9); plaza.receiveShadow = true; scene.add(plaza);
  // Filetes de oro embutidos: dos guías a lo largo, un marco junto a los muros y bandas en cada crujía.
  [-4.7, -2.4, 2.4, 4.7].forEach(x => box(Math.abs(x) > 3 ? .09 : .06, .012, 49.4, x, .002, -21, M.gilt));
  for (let z = -3; z > -45; z -= 6) box(9.4, .012, .09, 0, .002, z, M.gilt);

  /* ---------- Muros de sillería con zócalo de ortostatos ---------- */
  const wallLen = HALL.start - HALL.end, wallZ = (HALL.start + HALL.end) / 2;
  [-1, 1].forEach(s => {
    box(.4, HALL.top, wallLen, s * (HALL.x + .2), HALL.top / 2, wallZ, M.paleWall);
    box(.1, 1.15, wallLen, s * (HALL.x - .05), .575, wallZ, M.dado);               // zócalo oscuro pulido
    box(.2, .14, wallLen, s * (HALL.x - .1), .07, wallZ, M.marbleGrey);            // plinto
    box(.16, .07, wallLen, s * (HALL.x - .08), 1.18, wallZ, M.marble);             // cimacio
    box(.03, .035, wallLen, s * (HALL.x - .165), 1.235, wallZ, M.gilt);           // filete de oro
    box(.03, .035, wallLen, s * (HALL.x - .27), 6.38, wallZ, M.gilt);             // filete bajo el arquitrabe
    // Entablamento interior: arquitrabe con tenia, friso dórico y cornisa con mútulos.
    box(.26, .56, wallLen, s * (HALL.x - .13), 6.68, wallZ, M.marble);
    box(.32, .07, wallLen, s * (HALL.x - .16), 6.995, wallZ, M.marble);
    box(.18, .58, wallLen, s * (HALL.x - .09), 7.32, wallZ, M.marbleWarm);
    box(.5, .26, wallLen, s * (HALL.x - .25), 7.74, wallZ, M.marble);
    box(.56, .08, wallLen, s * (HALL.x - .28), 7.9, wallZ, M.marble);
    for (let z = HALL.start - .7; z > HALL.end + .3; z -= 1) {
      const x = s * (HALL.x - .2);
      [-.12, 0, .12].forEach(dz => box(.06, .52, .085, x, 7.31, z + dz, M.darkStone));
      box(.08, .025, .42, s * (HALL.x - .19), 7.025, z, M.darkStone);               // régula
      box(.36, .035, .42, s * (HALL.x - .32), 7.6, z, M.marbleGrey);                 // mútulo
    }
  });
  // Policromía: una greca pintada recorre la cornisa como en los templos originales.
  const meander = canvasTex(1024, 64, (g, w, h) => {
    g.fillStyle = '#6d2a1c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d9b77a'; g.lineWidth = 5; g.lineJoin = 'miter';
    for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, 52); g.lineTo(x + 56, 52); g.lineTo(x + 56, 12); g.lineTo(x + 16, 12); g.lineTo(x + 16, 38); g.lineTo(x + 42, 38); g.lineTo(x + 42, 24); g.stroke(); }
    g.fillStyle = '#d9b77a'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
  }, { repeat: [Math.round(wallLen / 1.6), 1] });
  const meanderMat = new THREE.MeshStandardMaterial({ map: meander, roughness: .85 });
  [-1, 1].forEach(s => { const band = new THREE.Mesh(new THREE.PlaneGeometry(wallLen, .2), meanderMat); band.position.set(s * (HALL.x - .505), 7.74, wallZ); band.rotation.y = -s * Math.PI / 2; statics.add(band); });

  /* ---------- Columnas dóricas: 20 estrías de arista viva, éntasis y capitel ---------- */
  function shaftGeometry(height, r0, r1) {
    const flutes = 20, perFlute = compact ? 4 : 8;
    const geo = new THREE.CylinderGeometry(r1, r0, height, flutes * perFlute, compact ? 6 : 10, false);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i) / height + .5, r = Math.hypot(x, z);
      if (r < 1e-4) continue;
      const a = Math.atan2(z, x), f = ((a / (Math.PI * 2)) * flutes % 1 + 1) % 1;
      const flute = 1 - .055 * Math.sin(Math.PI * f);                       // acanaladura cóncava
      const entasis = 1 + .028 * Math.sin(Math.PI * Math.min(1, y * 1.15)); // ligera curvatura
      p.setX(i, x * flute * entasis); p.setZ(i, z * flute * entasis);
    }
    geo.computeVertexNormals();
    // UV en metros reales para que el mármol no se estire.
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * r0 * 2 * Math.PI * .45, uv.getY(i) * height * .45);
    return geo;
  }
  function echinusGeometry(r) {
    const pts = [[r * .78, 0], [r * .8, .03], [r * .95, .1], [r * 1.12, .18], [r * 1.24, .25], [r * 1.28, .3]].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, compact ? 40 : 80);
  }
  function column(x, z, { height = 6.6, r = .45, base = 0 } = {}) {
    const g = new THREE.Group(); g.position.set(x, base, z); statics.add(g);
    const capH = .55, shaftH = height - capH;
    const shaft = new THREE.Mesh(shaftGeometry(shaftH, r, r * .8), M.marble); shaft.position.y = shaftH / 2; shaft.userData.keepUV = true; shaft.castShadow = shaft.receiveShadow = true; g.add(shaft);
    // Anillos (annuli) y collarino bajo el equino.
    [0, .035, .07].forEach(dy => { const ring = new THREE.Mesh(new THREE.TorusGeometry(r * .8, .012, 6, compact ? 32 : 64), M.marble); ring.rotation.x = Math.PI / 2; ring.position.y = shaftH - .04 + dy; ring.userData.keepUV = true; g.add(ring); });
    const ech = new THREE.Mesh(echinusGeometry(r), M.marble); ech.position.y = shaftH + .02; ech.userData.keepUV = true; ech.castShadow = true; ech.receiveShadow = true; g.add(ech);
    box(r * 2.85, .2, r * 2.85, 0, height - .1, 0, M.marble, g);   // ábaco
    contactShadow(x, z, r * 4.4, r * 4.4, base + .006);
    return g;
  }

  /* ---------- Pórtico de entrada ---------- */
  const F = { half: 9.2, wallZ: 3.7, colZ: 6.45, front: 7.2, top: 6.6 };
  // Crepidoma: estilóbato y tres gradas hasta la plaza.
  box(F.half * 2, .6, F.front - 4.05, 0, -.3, (F.front + 4.05) / 2, M.marbleWarm);
  for (let i = 1; i <= 2; i++) box(F.half * 2 + i * .9, .2, .45, 0, -.1 - i * .2, F.front + i * .45 - .225, M.marbleWarm);
  // Muro de fachada con el vano de la puerta.
  [-1, 1].forEach(s => box(F.half - 3.02, F.top, .65, s * (2.62 + (F.half - 3.02) / 2), F.top / 2, F.wallZ, M.wall));
  box(5.9, F.top - 5.95, .65, 0, (F.top + 5.95) / 2, F.wallZ, M.wall);
  [-1, 1].forEach(s => box(F.half - 3.45, 1.15, .12, s * (2.95 + (F.half - 3.45) / 2), .575, F.wallZ + .37, M.darkStone));
  [-1, 1].forEach(s => box(.7, F.top, .9, s * (F.half - .75), F.top / 2, F.wallZ + .1, M.marble)); // antas
  const colsX = [-7.6, -5.45, -3.3, 3.3, 5.45, 7.6];
  colsX.forEach(x => column(x, F.colZ, { height: F.top, r: .52 }));
  // Entablamento: arquitrabe, friso de triglifos y metopas, cornisa con mútulos.
  const depth = F.front - 3.35, cz = (F.front + 3.35) / 2;
  box(F.half * 2 - .5, .78, depth, 0, F.top + .39, cz - .05, M.marble);
  box(F.half * 2 - .4, .08, depth + .06, 0, F.top + .82, cz - .02, M.marble);              // tenia
  box(F.half * 2 - .6, .8, depth - .2, 0, F.top + 1.26, cz - .15, M.marbleWarm);
  const triX = []; for (let i = 0; i < colsX.length; i++) { triX.push(colsX[i]); if (i < colsX.length - 1) { const a = colsX[i], b = colsX[i + 1], n = Math.round((b - a) / 1.15); for (let k = 1; k < n; k++) triX.push(a + (b - a) * k / n); } }
  [-F.half + .55, F.half - .55].forEach(x => triX.push(x));
  triX.forEach(x => {
    [-.17, 0, .17].forEach(dx => box(.105, .78, .12, x + dx, F.top + 1.25, F.front - .2, M.darkStone));
    box(.5, .035, .1, x, F.top + .845, F.front - .03, M.darkStone);                       // régula
    for (let k = -2.5; k <= 2.5; k++) box(.03, .04, .03, x + k * .075, F.top + .81, F.front - .01, M.marble); // gotas
    box(.5, .04, .5, x, F.top + 1.66, F.front + .02, M.marbleGrey);                        // mútulo
  });
  box(F.half * 2 + .7, .34, depth + .7, 0, F.top + 1.85, cz + .2, M.marble);               // cornisa
  box(F.half * 2 + .8, .08, depth + .8, 0, F.top + 2.06, cz + .22, M.marble);
  // Frontón: tímpano retranqueado, cornisas inclinadas y acroteras.
  const pedBase = F.top + 2.1, pedH = 2.25, pedHalf = F.half + .35;
  const tri = new THREE.Shape(); tri.moveTo(-pedHalf + .5, 0); tri.lineTo(0, pedH - .3); tri.lineTo(pedHalf - .5, 0); tri.closePath();
  const tympanum = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 3.2, bevelEnabled: false }), M.marbleWarm);
  tympanum.position.set(0, pedBase, 3.5); tympanum.castShadow = tympanum.receiveShadow = true; statics.add(tympanum);
  const slope = Math.atan2(pedH, pedHalf), rakeLen = Math.hypot(pedH, pedHalf) + .25;
  [-1, 1].forEach(s => {
    const rake = box(rakeLen, .36, depth + .9, s * pedHalf / 2, pedBase + pedH / 2 + .02, cz + .25, M.marble); rake.rotation.z = -s * slope;
    const sima = box(rakeLen, .1, depth + 1, s * pedHalf / 2, pedBase + pedH / 2 + .24, cz + .27, M.marble); sima.rotation.z = -s * slope;
    sima.position.x -= s * Math.sin(slope) * .2;
  });
  // Acroteras: palmetas de mármol en el vértice y en los extremos.
  function palmette(scale) {
    const sh = new THREE.Shape(); sh.moveTo(0, 0);
    for (let i = 0; i <= 8; i++) { const a = Math.PI * (.12 + .76 * i / 8), len = 1 - Math.abs(i - 4) * .09; const x = Math.cos(a) * len, y = Math.sin(a) * len; sh.quadraticCurveTo(x * .55 - .03, y * .55, x, y); sh.quadraticCurveTo(x * .62 + .03, y * .62, 0, .02); }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: .1, bevelEnabled: true, bevelThickness: .02, bevelSize: .015, bevelSegments: 1, curveSegments: 6 });
    geo.scale(scale, scale, 1); geo.rotateZ(0); return geo;
  }
  [[0, pedBase + pedH + .1, 1.05], [-F.half - .1, pedBase + .1, .7], [F.half + .1, pedBase + .1, .7]].forEach(([x, y, s]) => {
    const p = new THREE.Mesh(palmette(s), M.marble); p.position.set(x, y, F.front + .15); p.castShadow = true; statics.add(p);
  });
  // Medallón del frontón: disco de bronce oscuro, greca dorada y una gran omega en relieve.
  const medY = pedBase + 1.0, medZ = 6.72, medR = .9;
  const medBronze = M.bronzeVariant(23, '#6a4a30', 2);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(medR, medR + .02, .09, compact ? 64 : 128), medBronze);
  disc.rotation.x = Math.PI / 2; disc.position.set(0, medY, medZ + .045); disc.castShadow = true; statics.add(disc);
  const keyTex = canvasTex(2048, 128, (g, w, h) => {
    g.fillStyle = '#2a1a0e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.lineWidth = 13; g.lineJoin = 'miter';
    for (let x = 0; x < w; x += 128) { g.beginPath(); g.moveTo(x, 104); g.lineTo(x + 112, 104); g.lineTo(x + 112, 24); g.lineTo(x + 32, 24); g.lineTo(x + 32, 76); g.lineTo(x + 84, 76); g.lineTo(x + 84, 50); g.stroke(); }
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
  });
  // La greca se enrolla en el anillo: la coordenada angular recorre la textura.
  const ringGeo = new THREE.RingGeometry(medR * .74, medR * .95, compact ? 96 : 192, 1);
  { const p = ringGeo.attributes.position, uv = ringGeo.attributes.uv;
    for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getY(i), p.getX(i)), r = Math.hypot(p.getX(i), p.getY(i)); uv.setXY(i, (a / (Math.PI * 2) + .5) * 12, (r - medR * .74) / (medR * .21)); } }
  const keyRing = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: '#d9ac5f', map: keyTex, metalness: 1, roughness: .32, emissive: '#5a3a12', emissiveMap: keyTex, emissiveIntensity: .45 }));
  keyRing.position.set(0, medY, medZ + .092); scene.add(keyRing);
  [medR * .96, medR * .73].forEach(r => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, .022, 10, 128), M.gilt); t.position.set(0, medY, medZ + .095); statics.add(t); });
  const omega = new THREE.Shape();
  omega.moveTo(-.4101, -.3601); omega.absarc(0, .05, .58, Math.PI * 1.25, Math.PI * 1.75, true);
  omega.lineTo(.68, -.36); omega.lineTo(.68, -.52); omega.lineTo(.2, -.52); omega.lineTo(.2, -.29);
  omega.lineTo(.2828, -.2328); omega.absarc(0, .05, .4, -Math.PI / 4, Math.PI * 1.25, false);
  omega.lineTo(-.2, -.29); omega.lineTo(-.2, -.52); omega.lineTo(-.68, -.52); omega.lineTo(-.68, -.36); omega.closePath();
  const omegaGold = new THREE.MeshStandardMaterial({ color: '#e0b264', metalness: 1, roughness: .26, emissive: '#6a4312', emissiveIntensity: .55, envMapIntensity: 1.5 });
  const omegaMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(omega, { depth: .07, bevelEnabled: true, bevelThickness: .02, bevelSize: .016, bevelSegments: 3, curveSegments: 48 }), omegaGold);
  omegaMesh.scale.setScalar(.88); omegaMesh.position.set(0, medY - .02, medZ + .09); omegaMesh.castShadow = true; scene.add(omegaMesh);
  // Inscripción tallada en el arquitrabe: el nombre del templo en letras griegas.
  const inscription = canvasTex(2048, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.font = '600 92px "EB Garamond", "GFS Didot", Georgia, serif';
    const text = 'ΠΑΡΘΕΝΩΝ';
    if (g.letterSpacing !== undefined) g.letterSpacing = '58px';
    g.fillStyle = 'rgba(255,240,214,.55)'; g.fillText(text, w / 2 + 29, 98);        // arista iluminada
    g.fillStyle = 'rgba(38,28,18,.92)'; g.fillText(text, w / 2 + 29, 95);           // fondo del surco
  }, { text: true });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(13, .82), new THREE.MeshStandardMaterial({ map: inscription, transparent: true, roughness: .9, depthWrite: false }));
  sign.position.set(0, F.top + .4, F.front - .035); scene.add(sign);
  // Techo del pórtico con pequeños casetones.
  for (let x = -8.4; x <= 8.4; x += 1.4) box(.16, .22, 3.2, x, F.top - .11, 5.05, M.marble);
  for (let z = 4.2; z <= 6.4; z += 1.1) box(17.4, .22, .16, 0, F.top - .11, z, M.marble);
  box(17.6, .1, 3.4, 0, F.top + .02, 5.05, M.coffer);

  /* ---------- Interior: columnata de mármol rojo con basas y capiteles de oro ---------- */
  function redColumn(x, z, height = 6.4) {
    const g = new THREE.Group(); g.position.set(x, 0, z); statics.add(g);
    const r = .36, shaftH = height - .62;
    box(1.02, .2, 1.02, 0, .1, 0, M.marbleGrey, g);                                       // plinto
    const lathe = (pts, mat, y) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), compact ? 32 : 64), mat); m.position.y = y; m.userData.keepUV = true; m.castShadow = m.receiveShadow = true; g.add(m); };
    // Basa ática dorada: toro, escocia y toro.
    lathe([[.47, 0], [.5, .04], [.49, .09], [.44, .12], [.41, .14], [.4, .19], [.43, .22], [.44, .25], [.41, .28], [r, .3]], M.gilt, .2);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r * .86, r, shaftH - .5, compact ? 32 : 64, 1), M.redMarble);
    shaft.position.y = .5 + (shaftH - .5) / 2; shaft.castShadow = shaft.receiveShadow = true; g.add(shaft);
    // Capitel: astrágalo, equino y ábaco de oro.
    lathe([[r * .86, 0], [r * .95, .03], [r * .86, .06], [r * .9, .1], [r * 1.12, .2], [r * 1.34, .3], [r * 1.4, .34]], M.gilt, shaftH);
    box(r * 3, .18, r * 3, 0, height - .1 - .1, 0, M.gilt, g);
    box(r * 3.2, .08, r * 3.2, 0, height - .04, 0, M.marble, g);
    contactShadow(x, z, 2, 2, .006);
  }
  for (let z = -3; z > -43; z -= 6) [-1, 1].forEach(s => redColumn(s * 5.05, z));
  // Pilastras de piedra clara frente a cada columna, con basa y capitel dorados.
  for (let z = -3; z > -43; z -= 6) [-1, 1].forEach(s => {
    box(.18, 6.4, .8, s * (HALL.x - .09), 3.2, z, M.paleWall);
    box(.26, .3, .92, s * (HALL.x - .13), .35, z, M.gilt); box(.28, .36, .96, s * (HALL.x - .14), 6.12, z, M.gilt);
  });
  box(12.8, HALL.top, .4, 0, HALL.top / 2, HALL.end, M.paleWall);
  box(12, 1.15, .1, 0, .575, HALL.end + .25, M.dado);

  /* ---------- Paneles y murales de oro en los muros ---------- */
  // Tramos libres de cada muro entre pilastras y portadas.
  const segments = [[3.4, -2.6], [-3.4, -8.6], [-11.3, -14.6], [-15.4, -20.6], [-23.3, -26.6], [-27.4, -32.6], [-33.4, -38.6], [-39.4, -45.8]];
  // Lo que ya cuelga en cada muro (placas, estandartes, rótulos): ahí el panel queda liso.
  const hung = { '-1': [[-4.7, 1.0], [-7.9, .6], [-16.9, 1.1], [-19.9, .6], [-28.9, 1.1], [-31.9, .6]], '1': [[-6, 2.4], [-18, 2.4], [-30, 2.4]] };
  const roomOf = z => z > -11 ? 'atenea' : z > -23 ? 'hermes' : z > -35 ? 'hefesto' : 'duelo';
  const muralCache = new Map(), muralMats = [];
  const muralMat = (kind, seed) => {
    const key = kind + seed % 2; if (muralCache.has(key)) return muralCache.get(key);
    const m = new THREE.MeshStandardMaterial({ map: muralTexture(THREE, kind, seed, compact), roughness: .5, metalness: .35, envMapIntensity: 1.2 });
    muralCache.set(key, m); muralMats.push(m); return m;
  };
  let muralSeed = 0;
  [-1, 1].forEach(s => segments.forEach(([a, b]) => {
    const L = a - b, n = Math.max(1, Math.round(L / 2.7)), cell = L / n;
    for (let k = 0; k < n; k++) {
      const z = a - cell * (k + .5), pw = cell - .55, y0 = 1.62, y1 = 5.72, ph = y1 - y0, x = s * (HALL.x - .02);
      // Marco de dos molduras en relieve.
      [[.07, 0], [.04, .14]].forEach(([t, inset]) => {
        box(.06 + t * .4, t, pw - inset * 2, x - s * (.03 + t * .2), y1 - inset, z, M.marble); box(.06 + t * .4, t, pw - inset * 2, x - s * (.03 + t * .2), y0 + inset, z, M.marble);
        [-1, 1].forEach(e => box(.06 + t * .4, ph - inset * 2, t, x - s * (.03 + t * .2), (y0 + y1) / 2, z + e * (pw / 2 - inset), M.marble));
      });
      const busy = hung[s].some(([hz, hw]) => Math.abs(hz - z) < hw + pw / 2 - .2);
      if (busy || pw < 1.2) continue;
      const kind = muralSeed % 3 === 1 ? 'hoplita' : roomOf(z);
      const w = Math.min(pw - .42, 1.9), h = Math.min(ph - .5, w * 1.7);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(.05, h + .12, w + .12), M.darkGilt); frame.position.set(x - s * .05, (y0 + y1) / 2, z); frame.castShadow = true; scene.add(frame);
      const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), muralMat(kind, muralSeed));
      art.position.set(x - s * .078, (y0 + y1) / 2, z); art.rotation.y = -s * Math.PI / 2; scene.add(art);
      muralSeed++;
    }
  }));
  box(12, .56, .26, 0, 6.68, HALL.end + .33, M.marble); box(12, .58, .18, 0, 7.32, HALL.end + .29, M.marbleWarm); box(12, .26, .5, 0, 7.74, HALL.end + .45, M.marble);

  /* ---------- Techo de casetones con lucernarios ---------- */
  const sunDir = new THREE.Vector3(...SUN_OFFSET).normalize();
  // Un lucernario por sala, centrado en la retícula; el haz cae por detrás de cada urna.
  const skylights = [-4, -16, -28].map(z => ({ x: -2, z }));
  const isOpen = (cx, cz) => skylights.some(s => Math.abs(cx - s.x) <= 1.01 && Math.abs(cz - s.z) <= 1.01);
  const CY = HALL.top;
  for (let x = -6; x <= 6; x += 2) box(.3, .5, HALL.start - HALL.end, x, CY + .25, wallZ, M.marble);
  for (let z = HALL.start - .05; z >= HALL.end; z -= 2) box(12, .5, .3, 0, CY + .25, z, M.marble);
  const starShape = new THREE.Shape();
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? .07 : .2; const fn = i ? 'lineTo' : 'moveTo'; starShape[fn](Math.cos(a) * r, Math.sin(a) * r); }
  const starGeo = new THREE.ShapeGeometry(starShape); starGeo.rotateX(Math.PI / 2);
  for (let cx = -5; cx <= 5; cx += 2) for (let cz = HALL.start - 1.05; cz > HALL.end; cz -= 2) {
    if (isOpen(cx, cz)) continue;
    // Dos marcos escalonados y el fondo azul con estrella dorada.
    [[1.7, 1.3, .14, CY + .57], [1.3, .96, .12, CY + .7]].forEach(([size, inner, t, y]) => {
      const bw = (size - inner) / 2;
      [-1, 1].forEach(s => { box(size, t, bw, cx, y, cz + s * (size / 2 - bw / 2), M.marble); box(bw, t, inner, cx + s * (size / 2 - bw / 2), y, cz, M.marble); });
    });
    box(1.15, .06, 1.15, cx, CY + .8, cz, M.coffer);
    const star = new THREE.Mesh(starGeo, M.gilt); star.position.set(cx, CY + .765, cz); star.castShadow = false; statics.add(star);
  }
  // Pozos de luz sobre los lucernarios y un haz de luz suave.
  const shafts = [];
  const shaftMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uColor: { value: new THREE.Color('#ffd9a6') }, uStrength: { value: compact ? .07 : .09 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: `uniform vec3 uColor; uniform float uStrength; uniform float uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float edge=sin(3.14159*fract(vUv.x*4.)); float fall=smoothstep(0.,.35,vUv.y)*mix(.35,1.,vUv.y);
        float facing=pow(abs(dot(vN,vV)),.8); float motes=.85+.15*sin(vUv.y*40.+uTime*.6+vUv.x*12.);
        float a=edge*fall*facing*motes*uStrength; gl_FragColor=vec4(uColor*a,a); }`
  });
  skylights.forEach(s => {
    [-1, 1].forEach(k => { box(4, 1.6, .25, s.x, CY + 1.3, s.z + k * 2.1, M.wall); box(.25, 1.6, 4, s.x + k * 2.1, CY + 1.3, s.z, M.wall); });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: '#f5dcb4', fog: false }));
    glow.rotation.x = Math.PI / 2; glow.position.set(s.x, CY + 2.05, s.z); glow.castShadow = false; scene.add(glow);
    const len = (CY + 1.6) / sunDir.y;
    const geo = new THREE.CylinderGeometry(2.4, 2.75, len, 4, 1, true); geo.rotateY(Math.PI / 4); geo.translate(0, -len / 2, 0);
    const beam = new THREE.Mesh(geo, shaftMat); beam.position.set(s.x, CY + 1.6, s.z);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sunDir); scene.add(beam); shafts.push(beam);
  });

  /* ---------- Portadas y puertas de bronce ---------- */
  const doors = [];
  // Bronce bruñido sin pátina: hojas limpias y cálidas.
  const leafMat = M.bronzeVariant(17, '#b48a5e', 2);
  function portal(z, width, height, front = false) {
    const half = width / 2;
    // Marco de tres fajas como un arquitrabe jónico, con cornisa sobre el dintel.
    for (let layer = 0; layer < 3; layer++) {
      const o = layer * .1, zz = z + (front ? .36 : .2) + layer * .045;
      [-1, 1].forEach(side => box(.12, height + .4 + o, .12, side * (half + .3 + o), (height + .4 + o) / 2, zz, M.marble));
      box(width + .72 + o * 2, .12, .12, 0, height + .4 + o, zz, M.marble);
    }
    box(width + 1.6, .14, .5, 0, height + .78, z + .2, M.marble);
    box(width + 1.8, .1, .62, 0, height + .9, z + .22, M.marble);
    [-1, 1].forEach(side => box(.32, height + .25, .5, side * (half + .16), (height + .25) / 2, z, M.marble));
    box(width + .9, .34, .55, 0, height + .17, z, M.marble);
    box(width + .5, .05, .7, 0, .025, z, M.marbleGrey);
    if (!front) {
      const sideW = HALL.x - half - .32;
      [-1, 1].forEach(side => { box(sideW, HALL.top, .36, side * (half + .32 + sideW / 2), HALL.top / 2, z, M.paleWall); box(sideW, 1.15, .46, side * (half + .32 + sideW / 2), .575, z, M.dado); });
      box(width + .64, HALL.top - height - .34, .36, 0, (HALL.top + height + .34) / 2, z, M.paleWall);
    }
    const hinges = [];
    [-1, 1].forEach(side => {
      const pivot = new THREE.Group(); pivot.userData.movingDoor = true; pivot.position.set(side * half, 0, z); scene.add(pivot);
      const center = -side * half / 2;
      box(half - .02, height, .2, center, height / 2, 0, leafMat, pivot);
      // Tapajuntas: la hoja derecha cubre la rendija central.
      if (side > 0) box(.07, height - .04, .05, -half + .015, height / 2, .13, M.gilt, pivot);
      [.25, .75].forEach(f => {
        const pw = half - .4, ph = height * .38, y = height * f;
        box(pw + .1, ph + .1, .05, center, y, .12, M.gilt, pivot);
        box(pw - .04, ph - .04, .07, center, y, .14, leafMat, pivot);
        // Clavos de bronce en retícula y roseta central.
        for (let i = -1; i <= 1; i++) for (let j = -2; j <= 2; j++) if (i || j) { const n = new THREE.Mesh(new THREE.SphereGeometry(.028, 8, 6), M.gilt); n.position.set(center + i * pw * .32, y + j * ph * .2, .19); pivot.add(n); }
        const ros = new THREE.Mesh(new THREE.TorusGeometry(.13, .025, 8, 32), M.gilt); ros.position.set(center, y, .19); pivot.add(ros);
        for (let p = 0; p < 8; p++) { const a = p * Math.PI / 4, leaf = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), M.gilt); leaf.scale.set(.6, 1.7, .5); leaf.position.set(center + Math.sin(a) * .075, y + Math.cos(a) * .075, .2); leaf.rotation.z = -a; pivot.add(leaf); }
      });
      const hx = -side * (half - .22);
      box(.13, .36, .05, hx, height * .49, .13, M.gilt, pivot);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.11, .02, 10, 36), M.gilt); ring.position.set(hx, height * .47, .2); pivot.add(ring);
      // Cada hoja se agrupa por material para moverse como dos o tres mallas.
      pivot.updateMatrixWorld(true);
      const groups = new Map();
      [...pivot.children].forEach(m => { if (!groups.has(m.material)) groups.set(m.material, []); groups.get(m.material).push(m); });
      groups.forEach((meshes, material) => {
        const geos = meshes.map(m => (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrix));
        geos.forEach(g => worldUV(g, .8));
        const geo = mergeGeometries(geos, false); geos.forEach(g => g.dispose()); if (!geo) return;
        meshes.forEach(m => pivot.remove(m)); const merged = new THREE.Mesh(geo, material); merged.castShadow = merged.receiveShadow = true; pivot.add(merged);
      });
      hinges.push({ pivot, side });
    });
    // La puerta principal se abre hacia el pórtico; las interiores, hacia la sala siguiente,
    // así las hojas nunca barren el espacio de las esculturas que quedan atrás.
    doors.push({ z, hinges, angle: 0, dir: front ? 1 : -1 });
  }
  portal(F.wallZ, 4.6, 5.8, true); portal(-11, 6.6, 6.45); portal(-23, 6.6, 6.45);

  /* ---------- Cielo crepuscular y montañas lejanas ---------- */
  const sky = new THREE.Mesh(new THREE.SphereGeometry(205, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 vP;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){ float y=vP.y; vec3 zen=vec3(.035,.06,.09), mid=vec3(.12,.15,.19), hor=vec3(.55,.33,.2);
        vec3 c=mix(hor,mid,smoothstep(-.02,.22,y)); c=mix(c,zen,smoothstep(.2,.8,y));
        float a=atan(vP.z,vP.x); float cl=n(vec2(a*6.,y*14.))*.6+n(vec2(a*14.,y*30.))*.4;
        c=mix(c,c*1.35+vec3(.05,.03,.02),smoothstep(.55,.85,cl)*smoothstep(.02,.15,y)*(1.-smoothstep(.25,.5,y)));
        float sun=pow(max(0.,dot(vP,normalize(vec3(-.55,.08,.35)))),24.); c+=vec3(1.,.55,.25)*sun*.6;
        gl_FragColor=vec4(c,1.);
        #include <colorspace_fragment>
      }`
  }));
  sky.renderOrder = -10; scene.add(sky);
  const hills = canvasTex(2048, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    [['#2a2f36', .55, 3], ['#1b1f25', .72, 7]].forEach(([c, base, seed]) => {
      g.fillStyle = c; g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) { const t = x / w * Math.PI * 2; g.lineTo(x, h * (base - .22 * Math.abs(Math.sin(t * 3 + seed)) - .1 * Math.sin(t * 11 + seed * 2) - .04 * Math.sin(t * 37))); }
      g.lineTo(w, h); g.fill();
    });
  });
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(200, 200, 46, 64, 1, true), new THREE.MeshBasicMaterial({ map: hills, transparent: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  ridge.position.y = 14; ridge.renderOrder = -9; scene.add(ridge);

  /* ---------- Luces ---------- */
  const sun = new THREE.DirectionalLight('#ffd7a8', 3.2);
  sun.position.set(SUN_OFFSET[0] * 2, SUN_OFFSET[1] * 2, SUN_OFFSET[2] * 2 + 2); sun.target.position.set(0, 0, 2); scene.add(sun, sun.target);
  sun.castShadow = true; const map = compact ? 1024 : 2048; sun.shadow.mapSize.set(map, map);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 58, bottom: -58, near: 1, far: 140 });
  sun.shadow.normalBias = .03; sun.shadow.bias = -.0004; sun.shadow.radius = 3;
  // Luz de cielo fría para que la sombra nunca sea negra; tono de piedra en el rebote.
  scene.add(new THREE.HemisphereLight('#a9bccd', '#5a4636', .32));
  const bounce = new THREE.DirectionalLight('#b88a62', .22); bounce.position.set(4, -2, -20); bounce.userData.extra = true; scene.add(bounce);

  /* ---------- Agrupación de la arquitectura estática por material ---------- */
  statics.updateMatrixWorld(true);
  const batches = new Map();
  statics.traverse(mesh => { if (!mesh.isMesh) return; if (!batches.has(mesh.material)) batches.set(mesh.material, []); batches.get(mesh.material).push(mesh); });
  batches.forEach((meshes, material) => {
    const scale = uvScale.get(material) || [.5, .5];
    const geos = meshes.map(m => { const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrixWorld); if (!m.userData.keepUV) worldUV(g, scale); return g; });
    const geo = mergeGeometries(geos, false); geos.forEach(g => g.dispose()); if (!geo) return;
    const merged = new THREE.Mesh(geo, material); merged.castShadow = true; merged.receiveShadow = true; scene.add(merged);
  });
  scene.remove(statics);

  return {
    sun, skylights, box, column, contactShadow, mirror,
    update(camera, dt, reduce, t) {
      sky.position.copy(camera.position); ridge.position.set(camera.position.x, 14, camera.position.z);
      shaftMat.uniforms.uTime.value = t || 0;
      doors.forEach(d => {
        const progress = smootherStep((d.z + 14 - camera.position.z) / 11);
        const target = progress * Math.PI * .48;
        d.angle = reduce ? target : THREE.MathUtils.damp(d.angle, target, 3.8, dt);
        d.hinges.forEach(({ pivot, side }) => pivot.rotation.y = side * d.dir * d.angle);
      });
    }
  };
}
