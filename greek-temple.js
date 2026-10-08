/** Arquitectura del museo: una galería horizontal de cuatro salas en fila (como las del Prado),
 *  sin columnas dentro; fuera, una estoa de columnas de mármol rojo con el frontón del templo
 *  sobre la puerta. Muros, suelos y sillares llevan texturas fotografiadas. */
import { mergeGeometries } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/utils/BufferGeometryUtils.js';
import { smootherStep } from './motion.js';
import { Reflector } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/objects/Reflector.js';
import { worldUV } from './materials.js';
import { G, ROOMS, LEFT, RIGHT } from './layout.js';

// Dirección del sol: alto y desde la izquierda del pórtico, para que entre por los lucernarios.
export const SUN_OFFSET = [-7, 22, 9];

export function createGreekMuseum(THREE, scene, canvasTex, compact, M, pbr) {
  const statics = new THREE.Group(); scene.add(statics);
  /* Materiales fotografiados: la textura se proyecta en metros reales (worldUV). */
  const P = {
    floor: pbr('marmol-suelo', { color: '#efe4d2', roughness: .62, envMapIntensity: 1.2 }),
    plaster: pbr('estuco', { color: '#c3bdd0', roughness: 1, normalScale: .8 }),
    ashlar: pbr('sillar', { color: '#efe2cc', roughness: 1, normalScale: 1.2 }),
    ceiling: pbr('estuco', { color: '#e9e1d3', roughness: 1, normalScale: .5 })
  };
  const uvScale = new Map([[M.wall, [1 / 3.4, 1 / 1.7]], [M.darkStone, [1 / 3.2, 1 / 1.1]], [M.marble, [.45, .45]], [M.marbleWarm, [.4, .4]], [M.marbleGrey, [.5, .5]],
    [M.bronze, [.8, .8]], [M.dado, [.45, .45]], [M.redMarble, [.5, .5]], [P.plaster, [1 / 2.6, 1 / 2.6]], [P.ashlar, [1 / 2.2, 1 / 2.2]], [P.ceiling, [1 / 2.6, 1 / 2.6]]]);

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

  /* ---------- Suelo de la galería: mármol crema en grandes losas, pulido ---------- */
  const W = RIGHT - LEFT, D = G.front - G.back, CX = (LEFT + RIGHT) / 2, CZ = (G.front + G.back) / 2;
  const floorGeo = new THREE.PlaneGeometry(W, D);
  { const uv = floorGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * W / 3, uv.getY(i) * D / 3); }
  const floor = new THREE.Mesh(floorGeo, P.floor);
  floor.rotation.x = -Math.PI / 2; floor.position.set(CX, 0, CZ); floor.receiveShadow = true; scene.add(floor);
  const mirror = new Reflector(floorGeo, {
    textureWidth: 512, textureHeight: 512, clipBias: .003,
    shader: {
      name: 'ReflejoPulido',
      uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, strength: { value: .32 } },
      vertexShader: 'uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorld; void main(){ vUv = textureMatrix * vec4(position, 1.); vec4 w = modelMatrix * vec4(position, 1.); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      // Fresnel: casi espejo en ángulo rasante, apenas un velo mirando hacia abajo.
      fragmentShader: 'uniform sampler2D tDiffuse; uniform float strength; varying vec4 vUv; varying vec3 vWorld; void main(){ vec3 r = texture2DProj(tDiffuse, vUv).rgb; vec3 v = normalize(cameraPosition - vWorld); float f = .1 + .9 * pow(1. - max(v.y, 0.), 4.); gl_FragColor = vec4(r * strength * f, 1.); }'
    }
  });
  mirror.material.transparent = true; mirror.material.blending = THREE.AdditiveBlending; mirror.material.depthWrite = false;
  mirror.rotation.x = -Math.PI / 2; mirror.position.set(CX, .003, CZ); mirror.renderOrder = 1; scene.add(mirror);
  // Cenefa de mármol oscuro junto a los muros y filetes de oro que enmarcan cada sala.
  ROOMS.forEach(r => {
    const w = r.x1 - r.x0 - G.wall;
    box(w, .012, .5, r.cx, .003, G.back + .25, M.dado); box(w, .012, .5, r.cx, .003, G.front - .25, M.dado);
    box(.5, .012, D - 1, r.x0 + G.wall / 2 + .25, .003, CZ, M.dado); box(.5, .012, D - 1, r.x1 - G.wall / 2 - .25, .003, CZ, M.dado);
    box(w - 1.1, .014, .05, r.cx, .004, G.back + .55, M.gilt); box(w - 1.1, .014, .05, r.cx, .004, G.front - .55, M.gilt);
    box(.05, .014, D - 1.1, r.x0 + G.wall / 2 + .55, .004, CZ, M.gilt); box(.05, .014, D - 1.1, r.x1 - G.wall / 2 - .55, .004, CZ, M.gilt);
  });
  // Plaza delante de la estoa: losas de piedra gastada.
  const plazaW = W + 28, plazaCX = CX;
  const plazaGeo = new THREE.PlaneGeometry(plazaW, 43.4);
  { const uv = plazaGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * plazaW / 4, uv.getY(i) * 43.4 / 4); }
  const plaza = new THREE.Mesh(plazaGeo, pbr('losas', { color: '#b9ad9a', roughness: 1 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(plazaCX, -.6, 28.9); plaza.receiveShadow = true; scene.add(plaza);

  /* ---------- Muros de la galería ---------- */
  // Estuco lila como las salas del Prado, sobre un zócalo de mármol oscuro con cimacio y filete de oro.
  const OUT = .3; // medio grosor de los muros perimetrales
  function wallRun(axis, from, to, at, face, { door, th = OUT * 2 } = {}) {
    // axis 'x': muro a lo largo de x en z = at; axis 'z': a lo largo de z en x = at. `face` es el lado hacia la sala.
    const spans = door ? [[from, door[0]], [door[1], to]] : [[from, to]];
    const put = (len, h, th, c, y, off, mat) => axis === 'x' ? box(len, h, th, c, y, at + face * off, mat) : box(th, h, len, at + face * off, y, c, mat);
    spans.forEach(([a, b]) => {
      const len = b - a, c = (a + b) / 2; if (len < .05) return;
      put(len, G.ceil + .9, th, c, (G.ceil + .9) / 2, -th / 2, P.plaster);
      put(len, 1.1, .06, c, .55, .03, M.dado);                                  // zócalo
      put(len, .14, .12, c, .07, .06, M.marbleGrey);                            // rodapié
      put(len, .07, .14, c, 1.14, .07, M.marble);                               // cimacio
      put(len, .035, .04, c, 1.2, .14, M.gilt);                                 // filete
      // Cornisa: filete de oro, friso con greca pintada, moldura y media caña hasta el techo.
      put(len, .05, .05, c, G.top - .06, .025, M.gilt);
      put(len, .32, .1, c, G.top + .2, .05, M.marble);
      put(len, .12, .26, c, G.top + .42, .13, M.marble);
      put(len, .1, .4, c, G.top + .53, .2, M.marbleWarm);
      put(len, .2, .55, c, G.top + .68, .27, M.marble);
    });
    if (door) {
      const [a, b, dh = G.doorH] = door, c = (a + b) / 2, len = b - a;
      put(len, G.ceil + .9 - dh, th, c, (G.ceil + .9 + dh) / 2, -th / 2, P.plaster);
      [[.05, G.top - .06, .025, M.gilt], [.32, G.top + .2, .05, M.marble], [.12, G.top + .42, .13, M.marble], [.1, G.top + .53, .2, M.marbleWarm], [.2, G.top + .68, .27, M.marble]]
        .forEach(([h, y, th, mat]) => put(len, h, th * 2, c, y, th, mat));
    }
    return { axis, from, to, at, face };
  }
  const meander = canvasTex(1024, 64, (g, w, h) => {
    g.fillStyle = '#5e2418'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d9b77a'; g.lineWidth = 5; g.lineJoin = 'miter';
    for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, 52); g.lineTo(x + 56, 52); g.lineTo(x + 56, 12); g.lineTo(x + 16, 12); g.lineTo(x + 16, 38); g.lineTo(x + 42, 38); g.lineTo(x + 42, 24); g.stroke(); }
    g.fillStyle = '#d9b77a'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
  });
  meander.wrapS = THREE.RepeatWrapping;
  const meanderMat = new THREE.MeshStandardMaterial({ map: meander, roughness: .8, metalness: .1 });
  function frieze(axis, a, b, at, face) {
    const len = b - a, t = meander.clone(); t.repeat.set(Math.max(1, Math.round(len / 1.6)), 1); t.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, .22), meanderMat.clone()); m.material.map = t;
    if (axis === 'x') { m.position.set((a + b) / 2, G.top + .2, at + face * .101); m.rotation.y = face > 0 ? 0 : Math.PI; }
    else { m.position.set(at + face * .101, G.top + .2, (a + b) / 2); m.rotation.y = face > 0 ? Math.PI / 2 : -Math.PI / 2; }
    scene.add(m);
  }
  // Muro del fondo y fachada (por dentro), extremos y tabiques con vano entre salas.
  const doorZ0 = G.doorZ - G.doorW / 2, doorZ1 = G.doorZ + G.doorW / 2;
  ROOMS.forEach((r, i) => {
    const a = r.x0 + (i ? G.wall / 2 : 0), b = r.x1 - (i < ROOMS.length - 1 ? G.wall / 2 : 0);
    wallRun('x', a, b, G.back, 1); frieze('x', a, b, G.back, 1);
    wallRun('x', a, b, G.front, -1, r.cx === 0 ? { door: [-2.3, 2.3, 5.95] } : {}); frieze('x', a, b, G.front, -1);
  });
  wallRun('z', G.back, G.front, LEFT, 1); frieze('z', G.back, G.front, LEFT, 1);
  wallRun('z', G.back, G.front, RIGHT, -1); frieze('z', G.back, G.front, RIGHT, -1);
  ROOMS.slice(1).forEach(r => {
    const x = r.x0;
    [-1, 1].forEach(face => {
      wallRun('z', G.back, G.front, x + face * (G.wall / 2), face, { door: [doorZ0, doorZ1], th: G.wall / 2 });
      frieze('z', G.back, doorZ0, x + face * (G.wall / 2), face); frieze('z', doorZ1, G.front, x + face * (G.wall / 2), face);
    });
    // Portada del vano: jambas y dintel de mármol con tres fajas, umbral oscuro.
    for (let layer = 0; layer < 3; layer++) {
      const o = layer * .09;
      [-1, 1].forEach(face => {
        const xx = x + face * (G.wall / 2 + .03 + layer * .035);
        [doorZ0 - .1 - o, doorZ1 + .1 + o].forEach(z => box(.06, G.doorH + .2 + o, .12, xx, (G.doorH + .2 + o) / 2, z, M.marble));
        box(.06, .12, G.doorW + .32 + o * 2, xx, G.doorH + .2 + o, G.doorZ, M.marble);
      });
    }
    box(G.wall + .3, .05, G.doorW, x, .025, G.doorZ, M.dado);
    [-1, 1].forEach(face => box(.16, .3, G.doorW + 1.2, x + face * (G.wall / 2 + .1), G.doorH + .62, G.doorZ, M.marble));
  });

  /* ---------- Techo: casetones azules con estrella de oro y un lucernario por sala ---------- */
  const sunDir = new THREE.Vector3(...SUN_OFFSET).normalize();
  const CY = G.ceil, skylights = [];
  const starShape = new THREE.Shape();
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? .07 : .2; starShape[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
  const starGeo = new THREE.ShapeGeometry(starShape); starGeo.rotateX(Math.PI / 2);
  ROOMS.forEach((r, i) => {
    const a = r.x0 + (i ? G.wall / 2 : 0), b = r.x1 - (i < ROOMS.length - 1 ? G.wall / 2 : 0), w = b - a;
    const sky = { x: r.cx, z: CZ - .4, w: Math.min(6, w - 6), d: 4 }; skylights.push(sky);
    // Retícula de vigas cada ~2 m, ajustada al ancho de la sala.
    const nx = Math.round(w / 2), ny = Math.round(D / 2), cw = w / nx, cd = D / ny;
    for (let k = 0; k <= nx; k++) box(.26, .42, D, a + k * cw, CY + .21, CZ, M.marble);
    for (let k = 0; k <= ny; k++) box(w, .42, .26, (a + b) / 2, CY + .21, G.back + k * cd, M.marble);
    for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < ny; iz++) {
      const cx = a + (ix + .5) * cw, cz = G.back + (iz + .5) * cd;
      if (Math.abs(cx - sky.x) < sky.w / 2 && Math.abs(cz - sky.z) < sky.d / 2) continue;
      [[.84, .12, CY + .48], [.66, .1, CY + .6]].forEach(([k, t, y]) => {
        const sw = cw * k, sd = cd * k, bw = cw * .09;
        [-1, 1].forEach(s => { box(sw, t, bw, cx, y, cz + s * (sd / 2 - bw / 2), M.marble); box(bw, t, sd, cx + s * (sw / 2 - bw / 2), y, cz, M.marble); });
      });
      box(cw * .62, .05, cd * .62, cx, CY + .68, cz, M.coffer);
      const star = new THREE.Mesh(starGeo, M.gilt); star.position.set(cx, CY + .65, cz); statics.add(star);
    }
    // Pozo del lucernario: cuatro paredes de estuco, vidrio esmerilado y una retícula de bronce.
    const { x, z, w: lw, d: ld } = sky;
    [-1, 1].forEach(k => { box(lw + .3, 1.6, .15, x, CY + 1.2, z + k * (ld / 2 + .07), P.ceiling); box(.15, 1.6, ld, x + k * (lw / 2 + .07), CY + 1.2, z, P.ceiling); });
    for (let k = -2; k <= 2; k++) box(.05, .08, ld, x + k * lw / 5, CY + 1.9, z, M.darkGilt);
    for (let k = -1; k <= 1; k++) box(lw, .08, .05, x, CY + 1.9, z + k * ld / 3, M.darkGilt);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(lw, ld), new THREE.MeshBasicMaterial({ color: '#f4e7cf', fog: false }));
    glass.rotation.x = Math.PI / 2; glass.position.set(x, CY + 1.98, z); glass.castShadow = false; scene.add(glass);
    // Luz cenital de la sala, como la de un lucernario del Prado.
    const top = new THREE.SpotLight('#fff1dc', compact ? 55 : 70, 14, Math.PI / 2.6, .9, 1.2);
    top.position.set(x, CY + 1.6, z); top.target.position.set(x, 0, z - .5); top.userData.extra = true; scene.add(top, top.target);
  });
  // Plano del techo y cubierta, con el hueco de cada lucernario: así solo entra el sol por ellos.
  function holeySlab(y, t, mat) {
    ROOMS.forEach((r, i) => {
      const s = skylights[i], a = r.x0 - (i ? 0 : OUT), b = r.x1 + (i < ROOMS.length - 1 ? 0 : OUT), z0 = G.back - OUT, z1 = G.front + OUT;
      const sx0 = s.x - s.w / 2, sx1 = s.x + s.w / 2, sz0 = s.z - s.d / 2, sz1 = s.z + s.d / 2;
      box(sx0 - a, t, z1 - z0, (a + sx0) / 2, y, (z0 + z1) / 2, mat); box(b - sx1, t, z1 - z0, (sx1 + b) / 2, y, (z0 + z1) / 2, mat);
      box(s.w, t, sz0 - z0, s.x, y, (z0 + sz0) / 2, mat); box(s.w, t, z1 - sz1, s.x, y, (sz1 + z1) / 2, mat);
    });
  }
  holeySlab(CY + .74, .08, P.ceiling); holeySlab(CY + 1.05, .3, M.marbleGrey);
  // Haces de sol a través de los lucernarios.
  const shafts = [];
  const shaftMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uColor: { value: new THREE.Color('#ffd9a6') }, uStrength: { value: compact ? .05 : .065 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: `uniform vec3 uColor; uniform float uStrength; uniform float uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float edge=sin(3.14159*fract(vUv.x*4.)); float fall=smoothstep(0.,.35,vUv.y)*mix(.35,1.,vUv.y);
        float facing=pow(abs(dot(vN,vV)),.8); float motes=.85+.15*sin(vUv.y*40.+uTime*.6+vUv.x*12.);
        float a=edge*fall*facing*motes*uStrength; gl_FragColor=vec4(uColor*a,a); }`
  });
  skylights.forEach(s => {
    const len = (CY + 1.6) / sunDir.y;
    const geo = new THREE.CylinderGeometry(s.d * .55, s.d * .65, len, 4, 1, true); geo.rotateY(Math.PI / 4); geo.translate(0, -len / 2, 0);
    const beam = new THREE.Mesh(geo, shaftMat); beam.scale.set(s.w / s.d, 1, 1); beam.position.set(s.x, CY + 1.6, s.z);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sunDir); scene.add(beam); shafts.push(beam);
  });

  /* ---------- Exterior: estoa de columnas de mármol rojo y frontón sobre la puerta ---------- */
  const F = { half: 9.2, wallZ: G.front + OUT, colZ: 6.45, front: 7.2, top: 6.6 };
  const X0 = LEFT - 1.2, X1 = RIGHT + 1.2, XM = (X0 + X1) / 2, XL = X1 - X0;
  // Fachada de sillería por fuera (el estuco queda dentro), con el vano de la puerta.
  const skin = (x0, x1, h) => box(x1 - x0, h, .06, (x0 + x1) / 2, h / 2, G.front + OUT * 2 + .03, P.ashlar);
  skin(LEFT - OUT, -2.62, G.ceil + .9); skin(2.62, RIGHT + OUT, G.ceil + .9);
  box(5.24, G.ceil + .9 - 5.95, .06, 0, (G.ceil + .9 + 5.95) / 2, G.front + OUT * 2 + .03, P.ashlar);
  [-1, 1].forEach(s => box(.06, G.ceil + .9, D + OUT * 4, s < 0 ? LEFT - OUT * 2 - .03 : RIGHT + OUT * 2 + .03, (G.ceil + .9) / 2, CZ, P.ashlar));
  box(XL, 1.15, .1, XM, .575, G.front + OUT * 2 + .1, M.darkStone);                        // ortostatos
  // Crepidoma: estilóbato y gradas hasta la plaza a lo largo de toda la estoa.
  box(XL, .6, F.front - 4.05, XM, -.3, (F.front + 4.05) / 2, M.marbleWarm);
  for (let i = 1; i <= 2; i++) box(XL + i * .9, .2, .45, XM, -.1 - i * .2, F.front + i * .45 - .225, M.marbleWarm);
  // Columnas de mármol rojo con basa y capitel de oro, como en los palacios del Olimpo.
  function redColumn(x, z, height = F.top) {
    const g = new THREE.Group(); g.position.set(x, 0, z); statics.add(g);
    const r = .4, shaftH = height - .62;
    box(1.1, .2, 1.1, 0, .1, 0, M.marbleGrey, g);
    const lathe = (pts, mat, y) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), compact ? 32 : 64), mat); m.position.y = y; m.userData.keepUV = true; m.castShadow = m.receiveShadow = true; g.add(m); };
    lathe([[.52, 0], [.55, .04], [.54, .09], [.49, .12], [.45, .14], [.44, .19], [.47, .22], [.48, .25], [.45, .28], [r, .3]], M.gilt, .2);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r * .86, r, shaftH - .5, compact ? 32 : 64, 1), M.redMarble);
    shaft.position.y = .5 + (shaftH - .5) / 2; shaft.castShadow = shaft.receiveShadow = true; g.add(shaft);
    lathe([[r * .86, 0], [r * .95, .03], [r * .86, .06], [r * .9, .1], [r * 1.12, .2], [r * 1.34, .3], [r * 1.4, .34]], M.gilt, shaftH);
    box(r * 3, .18, r * 3, 0, height - .2, 0, M.gilt, g);
    box(r * 3.2, .08, r * 3.2, 0, height - .04, 0, M.marble, g);
    contactShadow(x, z, 2, 2, .006);
  }
  const colsX = [-7.6, -5.45, -3.3, 3.3, 5.45, 7.6];
  for (let x = 9.9; x < X1 - .6; x += 2.3) colsX.push(x);
  colsX.forEach(x => redColumn(x, F.colZ));
  [X0 + .35, X1 - .35].forEach(x => box(.7, F.top, 1.1, x, F.top / 2, F.colZ, M.marble)); // antas
  // Entablamento corrido: arquitrabe, friso de triglifos y metopas, cornisa con mútulos.
  const depth = F.front - 3.35, cz = (F.front + 3.35) / 2;
  box(XL - .2, .78, depth, XM, F.top + .39, cz - .05, M.marble);
  box(XL - .1, .08, depth + .06, XM, F.top + .82, cz - .02, M.marble);
  box(XL - .3, .8, depth - .2, XM, F.top + 1.26, cz - .15, M.marbleWarm);
  const triX = [];
  const sorted = [X0 + .35, ...colsX.slice().sort((a, b) => a - b), X1 - .35];
  for (let i = 0; i < sorted.length; i++) { triX.push(sorted[i]); if (i < sorted.length - 1) { const a = sorted[i], b = sorted[i + 1], n = Math.max(1, Math.round((b - a) / 1.15)); for (let k = 1; k < n; k++) triX.push(a + (b - a) * k / n); } }
  triX.forEach(x => {
    [-.17, 0, .17].forEach(dx => box(.105, .78, .12, x + dx, F.top + 1.25, F.front - .2, M.darkStone));
    box(.5, .035, .1, x, F.top + .845, F.front - .03, M.darkStone);
    for (let k = -2.5; k <= 2.5; k++) box(.03, .04, .03, x + k * .075, F.top + .81, F.front - .01, M.marble);
    box(.5, .04, .5, x, F.top + 1.66, F.front + .02, M.marbleGrey);
  });
  box(XL + .7, .34, depth + .7, XM, F.top + 1.85, cz + .2, M.marble);
  box(XL + .8, .08, depth + .8, XM, F.top + 2.06, cz + .22, M.marble);
  // Techo de la estoa con casetones.
  for (let x = X0 + .6; x <= X1 - .6; x += 1.4) box(.16, .22, 3.2, x, F.top - .11, 5.05, M.marble);
  for (let z = 4.2; z <= 6.4; z += 1.1) box(XL - 1, .22, .16, XM, F.top - .11, z, M.marble);
  box(XL - .8, .1, 3.4, XM, F.top + .02, 5.05, M.coffer);
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
  portal(F.wallZ, 4.6, 5.8, true);

  /* ---------- Cielo crepuscular y montañas lejanas ---------- */
  // Cielo fotografiado (Poly Haven, CC0): atardecer con nubes, con el sol bajo detrás de la Acrópolis.
  const skyMap = new THREE.TextureLoader().load(`assets/texturas/cielo-${compact ? '2k' : '4k'}.jpg`);
  skyMap.colorSpace = THREE.SRGBColorSpace; skyMap.anisotropy = 4;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(205, 64, 32), new THREE.MeshBasicMaterial({ map: skyMap, side: THREE.BackSide, fog: false, depthWrite: false, color: '#e6ddd6' }));
  sky.rotation.y = 1.26;
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
  sun.target.position.set(XM, 0, 4); sun.position.set(XM + SUN_OFFSET[0] * 2, SUN_OFFSET[1] * 2, 4 + SUN_OFFSET[2] * 2); scene.add(sun, sun.target);
  sun.castShadow = true; const map = compact ? 1024 : 2048; sun.shadow.mapSize.set(map, map);
  Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 40, bottom: -40, near: 1, far: 150 });
  sun.shadow.normalBias = .03; sun.shadow.bias = -.0004; sun.shadow.radius = 3;
  // Luz de cielo fría para que la sombra nunca sea negra; tono de piedra en el rebote.
  scene.add(new THREE.HemisphereLight('#a9bccd', '#5a4636', .32));
  const bounce = new THREE.DirectionalLight('#b88a62', .22); bounce.position.set(XM, -2, -20); bounce.target.position.set(XM, 0, 0); scene.add(bounce.target); bounce.userData.extra = true; scene.add(bounce);

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
    sun, skylights, box, contactShadow, mirror,
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
