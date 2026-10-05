import * as THREE from 'three';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/environments/RoomEnvironment.js';

import { smoothTravel, routeParameter } from './motion.js';
import { createMotionRenderer } from './cinematic.js';
import { addMythology } from './mythology.js';
import { createFreeCamera } from './free-camera.js';
import { createGreekMuseum } from './greek-temple.js';

const root = document.documentElement;
let savedMotion=null;try{savedMotion=localStorage.getItem('museo-motion');}catch{}
const reduce=savedMotion?savedMotion==='reduce':matchMedia('(prefers-reduced-motion: reduce)').matches;
root.classList.toggle('motion-full',!reduce);
const motionButton=document.getElementById('motion-toggle');
motionButton.textContent=reduce?'Activar animaciones':'Reducir movimiento';
motionButton.setAttribute('aria-pressed',String(!reduce));
motionButton.addEventListener('click',()=>{
  try{localStorage.setItem('museo-motion',reduce?'full':'reduce');}catch{}
  location.reload();
});
const finePointer = matchMedia('(pointer: fine)').matches;
let small = innerWidth < 720;

/* ---------- Fichas (contenido real) ---------- */
const FICHAS = [
  {
    inv: 'Nº inv. JM-001 · Sala I', title: 'JOSEMI-OS', accent: '#8cf0b4',
    text: [
      'Mi primer proyecto personal como desarrollador. No quería una página típica de “sobre mí, proyectos y contacto”, así que construí un pequeño sistema operativo que se puede explorar, abrir y tocar.',
      'La web arranca con una terminal que escribe JOSEMI-OS en pantalla con ocho efectos distintos y después abre el escritorio. Todo está hecho con HTML, CSS y JavaScript, sin frameworks, y tiene pruebas para la lógica del Arcade y de la terminal.'
    ],
    list: ['Ventanas que se arrastran, minimizan, maximizan y redimensionan', 'Terminal con comandos: empieza por ayuda', 'Arcade con minijuegos', 'Seis fondos ASCII animados y siete temas', 'Buscador de aplicaciones con Ctrl+K', 'Easter eggs y acertijos escondidos'],
    links: [['Código en GitHub ↗', 'https://github.com/josemidev1-code/JOSEMI-OS']]
  },
  {
    inv: 'Nº inv. JM-002 · Sala II', title: 'Asistente de gimnasio', accent: '#8db4ff',
    text: [
      'Un prototipo que conecta WhatsApp, n8n y un modelo de IA para responder dudas de los socios de un gimnasio.',
      'Lo expongo como pieza en restauración: todavía falta la documentación pública y medir el resultado con un caso real. No se presenta como un producto terminado.'
    ],
    list: ['Entrada de mensajes por WhatsApp', 'Flujo de automatización en n8n', 'Clasificación y respuesta con IA', 'Pendiente: documentación y métricas reales'],
    links: []
  }
];

/* ---------- Recorrido: paradas de cámara ---------- */
// Cada parada: posición de cámara, punto al que mira y cuánto scroll se queda quieta.
const STOPS = [
  { name: 'Entrada',  pos: [0, 3.1, 21],     look: [0, 3.6, 3.8],   hold: .25 },
  { name: 'Sala I',   pos: [.9, 1.55, -1.2], look: [0, 1.45, -5.2], hold: 1.1 },
  { name: 'Pasillo',  pos: [-.4, 1.7, -10], look: [0, 1.5, -18],  hold: 0, pass: true },
  { name: 'Sala II',  pos: [-.9, 1.55, -13.2], look: [0, 1.45, -17.2], hold: 1.1 },
  { name: 'Pasillo',  pos: [.4, 1.7, -22],  look: [0, 1.5, -30],  hold: 0, pass: true },
  { name: 'Sala III', pos: [.9, 1.55, -25.2], look: [0, 1.45, -29.2], hold: 1.1 },
  { name: 'Pasillo',  pos: [0, 1.8, -34],    look: [0, 3.2, -44],  hold: 0, pass: true },
  { name: 'Salida',   pos: [0, 1.9, -36.5],  look: [0, 3.4, -44],  hold: .8 }
];
// Conserva el encuadre al girar el móvil o redimensionar la ventana.
const originalStops = STOPS.map(s => ({pos: [...s.pos], look: [...s.look]}));
function frameRoute() {
  small = innerWidth < 720;
  STOPS.forEach((s,i) => {
    s.pos = [...originalStops[i].pos]; s.look = [...originalStops[i].look];
    if (small && !s.pass && s.name !== 'Entrada' && s.name !== 'Salida') {
      s.pos = [0, 2.35, s.look[2] + 5.4]; s.look = [0, .55, s.look[2]];
    }
  });
  if (small) STOPS[0].pos = [0, 3.5, 29.5];
}
frameRoute();
const MAIN = STOPS.map((s, i) => s.pass ? -1 : i).filter(i => i >= 0); // índices de paradas reales
// unidades de scroll: hold de cada parada + 1 por cada tramo de viaje
const segs = []; let total = 0;
STOPS.forEach((s, i) => {
  if (s.hold) { segs.push({ type: 'hold', i, a: total, b: total + s.hold }); total += s.hold; }
  if (i < STOPS.length - 1) { const len = i === 0 ? 3.2 : (STOPS[i + 1].pass || s.pass ? 1.05 : 1.4); segs.push({ type: 'move', i, a: total, b: total + len }); total += len; }
});
const track = document.getElementById('track');
const VH_PER_UNIT = small ? 82 : 72;
track.style.height = `calc(${total * VH_PER_UNIT}vh + 100vh)`;

const curve = new THREE.CatmullRomCurve3(STOPS.map(s => new THREE.Vector3(...s.pos)), false, 'centripetal');
// Recorrido continuo: las cartelas ralentizan el paso sin congelar la cámara.
const routeAnchors = [{u:0,t:0}];
STOPS.forEach((s,i) => {
  if(i===0 || i===STOPS.length-1)return;
  const hold=segs.find(g=>g.type==='hold' && g.i===i);
  const incoming=segs.find(g=>g.type==='move' && g.i===i-1);
  routeAnchors.push({u:hold?(hold.a+hold.b)/2:incoming.b,t:i/(STOPS.length-1)});
});
routeAnchors.push({u:total,t:1});
const lookCurve = new THREE.CatmullRomCurve3(STOPS.map(s=>new THREE.Vector3(...s.look)),false,'centripetal');
function sample(u) {
  const parameter=routeParameter(u,routeAnchors);
  return {pos:curve.getPoint(parameter),look:lookCurve.getPoint(parameter),at:Math.round(parameter*(STOPS.length-1))};
}
// centro de scroll (en unidades) de cada parada real, para navegar
const stopU = i => { const h = segs.find(s => s.type === 'hold' && s.i === i); return h ? (h.a + h.b) / 2 : 0; };
const unitPx = () => (track.offsetHeight - innerHeight) / total;
let directNavigation = false;
function goTo(stopIndex) {
  freeCamera.exit();
  directNavigation = true;
  const top = stopU(stopIndex) * unitPx();
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
}

/* ---------- Renderer y escena ---------- */
const canvas = document.getElementById('scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { root.classList.add('no-webgl', 'ready'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.35 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#18212b');
scene.fog = new THREE.Fog('#18212b', 24, 65);
// Reflejos suaves en bronce, cristal y piedra, sin descargar un HDR pesado.
const pmrem = new THREE.PMREMGenerator(renderer);
const reflectionRoom = new RoomEnvironment();
const reflectionTarget = pmrem.fromScene(reflectionRoom, .025);
scene.environment = reflectionTarget.texture;
scene.environmentIntensity = .22;
reflectionRoom.dispose(); pmrem.dispose();
const camera = new THREE.PerspectiveCamera(small ? 62 : 50, innerWidth / innerHeight, .1, 80);
camera.position.set(...STOPS[0].pos);



/* Texturas generadas en canvas */
const TEXTS = [];
function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  if (opts.text) TEXTS.push(() => { g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  t.userData = { canvas: c, ctx: g };
  return t;
}
const architecture = createGreekMuseum(THREE, scene, canvasTex, small);
const mythology = addMythology(THREE,scene,canvasTex,small);
const cinematic = createMotionRenderer(THREE,renderer,scene,camera,{compact:small,reduce});

/* Textos de pared: rótulos de sala pintados sobre el muro */
function wallText(lines, { w = 4, h = 1.6, size = 150, color = '#524638', sub, align = 'left' } = {}) {
  const tex = canvasTex(1024, 410, (g, W, H) => {
    g.clearRect(0, 0, W, H); g.fillStyle = color; g.textAlign = align; g.textBaseline = 'alphabetic';
    const x = align === 'left' ? 10 : W / 2;
    if (sub) { g.font = '500 30px "JetBrains Mono", monospace'; g.fillStyle = '#c9a46a'; g.fillText(sub.toUpperCase().split('').join(' '), x, 46); g.fillStyle = color; }
    g.font = `900 ${size}px "Big Shoulders Display", "Arial Narrow", sans-serif`;
    lines.forEach((l, i) => g.fillText(l.toUpperCase(), x, (sub ? 70 : 0) + size * .86 * (i + 1)));
  }, { text: true });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h * 410 / 410), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .8 }));
  m.userData.tex = tex; return m;
}

/* ---------- Urnas ---------- */
const urns = [];
const glassMat = new THREE.MeshStandardMaterial({ color: '#c3d5db', roughness: .22, metalness: .08, transparent: true, opacity: .07, envMapIntensity: .35, side: THREE.FrontSide, depthWrite: false });
const plinthMat = new THREE.MeshStandardMaterial({ color: '#e8e2d8', roughness: .55 });

function addSpot(x, z, color, intensity, target) {
  const spot = new THREE.SpotLight(color, intensity, 14, Math.PI / 9, .55, 1.4);
  spot.position.set(x, 6.8, z + 1.4); spot.target = target; spot.castShadow = false;
  spot.shadow.mapSize.set(1024, 1024); spot.shadow.radius = 2; spot.shadow.blurSamples = 6; spot.shadow.bias = -.0004; scene.add(spot); scene.add(spot.target);
  // cono volumétrico falso
  const coneH = 5.4;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.25, coneH, 48, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: .16 } },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = uv.y; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 uColor; uniform float uStrength; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float rim = pow(abs(dot(vN, vV)), 1.6); float a = vY * vY * rim * uStrength; gl_FragColor = vec4(uColor * a, a); }'
  }));
  const top = new THREE.Vector3(x, 6.8, z + 1.4), bottom = target.position.clone();
  cone.position.copy(top).lerp(bottom, .5); cone.lookAt(bottom); cone.rotateX(-Math.PI / 2);
  cone.scale.y = top.distanceTo(bottom) / coneH; scene.add(cone);
  return { spot, cone };
}

function makeUrn({ z, accent, inner, plaque }) {
  const g = new THREE.Group(); g.position.set(0, 0, z); scene.add(g);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.0, 1.15), plinthMat);
  plinth.position.y = .5; plinth.castShadow = plinth.receiveShadow = true; g.add(plinth);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(1.2, .04, 1.2), new THREE.MeshStandardMaterial({ color: '#c9c2b6', roughness: .4 }));
  lip.position.y = 1.02; g.add(lip);
  // base metálica del cristal
  const rim = new THREE.Mesh(new THREE.BoxGeometry(1.08, .05, 1.08), new THREE.MeshStandardMaterial({ color: '#2b2c30', metalness: .9, roughness: .3 }));
  rim.position.y = 1.065; g.add(rim);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.15, 1.0), glassMat);
  glass.position.y = 1.665; glass.renderOrder = 2; g.add(glass);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: '#f1ebdf', transparent: true, opacity: .35 }));
  edges.position.copy(glass.position); g.add(edges);
  // pieza interior
  inner.position.y = 1.62; g.add(inner);
  // luz interior de color
  const glow = new THREE.PointLight(accent, small ? 1.2 : 2.2, 2.6, 2); glow.position.set(0, 1.5, .1); g.add(glow);
  // cartela de latón en la peana
  const plq = new THREE.Mesh(new THREE.PlaneGeometry(.7, .2), new THREE.MeshStandardMaterial({ map: plaque, metalness: .6, roughness: .35 }));
  plq.position.set(0, .72, .578); g.add(plq);
  // caja de impacto para el ratón
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.4, 1.3), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 1.2; g.add(hit);
  const target = new THREE.Object3D(); target.position.set(0, 1.2, z);
  const { cone } = addSpot(0, z, '#ffe9c7', small ? 70 : 110, target);
  const u = { group: g, inner, edges, glow, hit, cone, accent };
  urns.push(u); return u;
}
function plaqueTex(code, title) {
  return canvasTex(700, 200, (g, W, H) => {
    const grd = g.createLinearGradient(0, 0, W, H); grd.addColorStop(0, '#b8925a'); grd.addColorStop(.5, '#e3c48f'); grd.addColorStop(1, '#a8834e');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2a1e0e'; g.font = '500 30px "JetBrains Mono", monospace'; g.fillText(code, 34, 62);
    g.font = '900 78px "Big Shoulders Display", "Arial Narrow", sans-serif'; g.fillText(title.toUpperCase(), 32, 150);
  }, { text: true });
}

/* Pieza 01: monitor de JOSEMI-OS con pantalla viva */
const screenTex = canvasTex(512, 384, () => {});
const screenCtx = screenTex.userData.ctx;
const BOOT = ['josemi@portfolio:~$ ./boot JOSEMI-OS', '[ ok ] cargando núcleo html.css.js', '[ ok ] montando escritorio', '[ ok ] abriendo terminal', '[ ok ] arcade listo', '[ ok ] 6 fondos ascii', '', 'bienvenido a JOSEMI-OS', 'build, learn, repeat.'];
const ASCII = [
  ' _  ___  ___ ___ __  __ ___    ___  ___ ',
  '| |/ _ \\/ __| __|  \\/  |_ _|  / _ \\/ __|',
  '| | (_) \\__ \\ _|| |\\/| || |  | (_) \\__ \\',
  '\\__/\\___/|___/___|_|  |_|___|  \\___/|___/'
];
let screenT = 0;
function drawScreen(t) {
  const g = screenCtx, W = 512, H = 384;
  g.fillStyle = '#04110a'; g.fillRect(0, 0, W, H);
  // lluvia de código tenue al fondo
  g.font = '14px "JetBrains Mono", monospace';
  for (let x = 0; x < W; x += 16) {
    const y = ((t * 60 + x * 37) % (H + 200)) - 100;
    for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(140,240,180,${.06 * (6 - k) / 6})`; g.fillText('/', x, y - k * 16); }
  }
  const phase = t % 14;
  g.fillStyle = '#8cf0b4'; g.font = '17px "JetBrains Mono", monospace';
  if (phase < 7) {
    const chars = Math.floor(phase * 55);
    let used = 0;
    BOOT.forEach((line, i) => { const n = Math.max(0, Math.min(line.length, chars - used)); used += line.length + 4; g.fillText(line.slice(0, n), 22, 40 + i * 30); });
    if (Math.floor(t * 2) % 2) g.fillRect(22, 330, 10, 18);
  } else {
    g.font = '13.5px "JetBrains Mono", monospace';
    ASCII.forEach((l, i) => { g.fillStyle = `rgba(140,240,180,${.85 + .15 * Math.sin(t * 3 + i)})`; g.fillText(l, 36, 150 + i * 20); });
    g.font = '15px "JetBrains Mono", monospace'; g.fillStyle = 'rgba(140,240,180,.7)';
    g.fillText('// portfolio interactivo', 36, 260);
    g.fillText('> ayuda_', 36, 300);
  }
  // líneas de barrido CRT
  g.fillStyle = 'rgba(0,0,0,.22)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
  screenTex.needsUpdate = true;
}
drawScreen(0);
function makeMonitor() {
  const m = new THREE.Group();
  const caseMat = new THREE.MeshStandardMaterial({ color: '#d9d2c3', roughness: .55 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(.62, .5, .46), caseMat); body.castShadow = true; m.add(body);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(.56, .44, .02), new THREE.MeshStandardMaterial({ color: '#1a1b1d', roughness: .6 }));
  bezel.position.z = .235; m.add(bezel);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(.48, .36), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.z = .247; m.add(screen);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, .1, 24), caseMat); neck.position.y = -.3; m.add(neck);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(.4, .03, .3), caseMat); foot.position.y = -.36; m.add(foot);
  const kb = new THREE.Mesh(new THREE.BoxGeometry(.5, .03, .14), caseMat); kb.position.set(0, -.36, .3); kb.rotation.x = .08; m.add(kb);
  m.position.y = .2; m.scale.setScalar(1);
  const wrap = new THREE.Group(); wrap.add(m); wrap.position.y = 0;
  wrap.userData.float = .03; wrap.userData.spin = .25; wrap.userData.yOffset = -.1;
  return wrap;
}

/* Pieza 02: mancuerna + nodos de automatización */
function makeGym() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: '#2e3036', metalness: .85, roughness: .28 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#c8ccd4', metalness: 1, roughness: .15 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .62, 16), chrome); bar.rotation.z = Math.PI / 2; g.add(bar);
  [-1, 1].forEach(s => {
    [0, 1].forEach(k => {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(.14 - k * .03, .14 - k * .03, .05, 6), metal);
      plate.rotation.z = Math.PI / 2; plate.position.x = s * (.24 - k * .055); plate.castShadow = true; g.add(plate);
    });
  });
  const nodes = new THREE.Group(); g.add(nodes);
  const nodeMat = new THREE.MeshBasicMaterial({ color: '#8db4ff', toneMapped: false });
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2, p = new THREE.Vector3(Math.cos(a) * .36, Math.sin(a * 2) * .1 + .05, Math.sin(a) * .36);
    const n = new THREE.Mesh(new THREE.SphereGeometry(.028, 16, 16), nodeMat); n.position.copy(p); nodes.add(n); pts.push(p);
  }
  pts.push(pts[0].clone());
  nodes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#8db4ff', transparent: true, opacity: .55 })));
  g.userData.nodes = nodes; g.userData.float = .04; g.userData.spin = .35; g.rotation.x = .25;
  return g;
}

/* Pieza 03: urna reservada, una forma que aún se está montando */
function makeNext() {
  const g = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(.28, 1);
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: '#c9a46a', transparent: true, opacity: .8 }));
  g.add(wire);
  const p = geo.attributes.position; const dots = new THREE.BufferGeometry();
  dots.setAttribute('position', p.clone());
  const pts = new THREE.Points(dots, new THREE.PointsMaterial({ color: '#f3dcb2', size: .025, toneMapped: false }));
  g.add(pts); g.userData.float = .05; g.userData.spin = .2; g.userData.wire = wire;
  return g;
}

const U1 = makeUrn({ z: -5.2, accent: '#8cf0b4', inner: makeMonitor(), plaque: plaqueTex('JM-001 · 2026', 'JOSEMI-OS') });
const U2 = makeUrn({ z: -17.2, accent: '#8db4ff', inner: makeGym(), plaque: plaqueTex('JM-002 · 2026', 'Asistente gym') });
const U3 = makeUrn({ z: -29.2, accent: '#c9a46a', inner: makeNext(), plaque: plaqueTex('JM-003 · —', 'Reservada') });
U1.ficha = 0; U2.ficha = 1; U3.ficha = -1;

/* Rótulos de sala en los muros */
const rooms = [
  { lines: ['Sala I · Atenea', 'Sistemas'], sub: 'JM-001', z: -5.6, x: -5.79 },
  { lines: ['Sala II · Hermes', 'Automatización'], sub: 'JM-002', z: -17.6, x: 5.79 },
  { lines: ['Sala III · Hefesto', 'Lo que viene'], sub: 'JM-003', z: -29.6, x: -5.79 }
];
rooms.forEach(r => {
  const t = wallText(r.lines, { w: 5, h: 2, size: 140, sub: r.sub + ' · colección permanente' });
  t.position.set(r.x, 3.4, r.z); t.rotation.y = r.x < 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(t);
});
// cuadros en los muros: lienzos abstractos con luz rasante
/* Muro final: neón de contacto */
const neon = wallText(['Gracias por', 'la visita'], { w: 6, h: 2.4, size: 150, color: '#f6e7cc', align: 'center' });
neon.material = new THREE.MeshBasicMaterial({ map: neon.userData.tex, transparent: true, toneMapped: false, color: new THREE.Color('#ffd9a0').multiplyScalar(1.4) });
neon.position.set(0, 5.2, -45.75); neon.visible = !small; scene.add(neon);
const neonGlow = new THREE.PointLight('#ffb866', 12, 10, 1.5); neonGlow.position.set(0, 3, -44.5); scene.add(neonGlow);
// banco del museo frente a la salida
const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, .42, .6), new THREE.MeshStandardMaterial({ color: '#3b2f25', roughness: .6 }));
bench.position.set(0, .21, -40); bench.castShadow = !small; scene.add(bench);

/* Motas de polvo en el aire */
const DUST = small ? 500 : 1400;
const dustGeo = new THREE.BufferGeometry(); const dp = new Float32Array(DUST * 3);
for (let i = 0; i < DUST; i++) { dp[i * 3] = (Math.random() - .5) * 11; dp[i * 3 + 1] = Math.random() * 6.5; dp[i * 3 + 2] = 8 - Math.random() * 54; }
dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
const dotTex = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: '#ffe6c2', map: dotTex, size: .03, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(dust);

/* ---------- Interfaz ---------- */
const cards = { 1: document.getElementById('card-1'), 3: document.getElementById('card-2'), 5: document.getElementById('card-3') };
const roomTitle = document.getElementById('room-title'), roomKicker = document.getElementById('room-kicker'), roomText = document.getElementById('room-text');
const ROOM_TITLES = { 1: ['Sala I', 'Sistemas'], 3: ['Sala II', 'Automatización'], 5: ['Sala III', 'Lo que viene'] };
const entrance = document.querySelector('.entrance'), exit = document.getElementById('contacto');
const railFill = document.getElementById('rail-fill'), railStops = document.getElementById('rail-stops');
const roomName = document.getElementById('room-name'), roomCount = document.getElementById('room-count');
MAIN.forEach((i, n) => {
  const b = document.createElement('button'); b.type = 'button';
  b.style.left = `${stopU(i) / total * 100}%`;
  b.setAttribute('aria-label', `Ir a ${STOPS[i].name}`);
  b.innerHTML = `<span>${STOPS[i].name}</span>`; b.addEventListener('click', () => goTo(i));
  railStops.append(b);
});
const railButtons = [...railStops.children];
document.querySelectorAll('[data-goto]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); goTo(MAIN[+el.dataset.goto]); }));

// ficha
const dlg = document.getElementById('ficha');
const freeCamera=createFreeCamera(THREE,camera,canvas,{
  button:document.getElementById('free-toggle'),hud:document.getElementById('free-hud'),dialog:dlg,
  onReset:()=>cinematic.reset(),
  onExit:()=>{let best=0,distance=Infinity;for(let n=0;n<=200;n++){const u=n/200*total,d=sample(u).pos.distanceTo(camera.position);if(d<distance){distance=d;best=u;}}
    scrollU=smoothU=best;travelVelocity=0;window.scrollTo({top:best*unitPx(),behavior:'instant'});}
});
function openFicha(i) {
  const f = FICHAS[i]; if (!f) return;
  dlg.style.setProperty('--accent', f.accent);
  document.getElementById('ficha-inv').textContent = f.inv;
  document.getElementById('ficha-title').textContent = f.title;
  const text = document.getElementById('ficha-text'); text.replaceChildren(...f.text.map(t => Object.assign(document.createElement('p'), { textContent: t })));
  document.getElementById('ficha-list').replaceChildren(...f.list.map(t => Object.assign(document.createElement('li'), { textContent: t })));
  const acts = document.getElementById('ficha-actions'); acts.replaceChildren();
  f.links.forEach(([label, href]) => { const a = Object.assign(document.createElement('a'), { className: 'btn', href, target: '_blank', rel: 'noopener noreferrer', textContent: label }); acts.append(a); });
  const back = Object.assign(document.createElement('button'), { className: 'btn ghost', type: 'button', textContent: 'Seguir el recorrido' }); back.addEventListener('click', () => dlg.close()); acts.append(back);
  dlg.showModal();
}
document.querySelectorAll('[data-ficha]').forEach(b => b.addEventListener('click', () => openFicha(+b.dataset.ficha)));
document.getElementById('ficha-close').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
document.getElementById('copy').addEventListener('click', async e => {
  const b = e.currentTarget;
  try { await navigator.clipboard.writeText('jmenterprice73@gmail.com'); b.textContent = 'Copiado'; }
  catch { const r = document.createRange(); r.selectNodeContents(document.getElementById('mail')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Seleccionado'; }
  setTimeout(() => b.textContent = 'Copiar', 1800);
});

// teclado: flechas y avance de página saltan de parada en parada
let currentMain = 0;
addEventListener('keydown', e => {
  if (freeCamera.active || dlg.open || e.target.closest('input,textarea')) return;
  const next = { ArrowDown: 1, PageDown: 1, ArrowRight: 1, ArrowUp: -1, PageUp: -1, ArrowLeft: -1 }[e.key];
  if (!next) return; e.preventDefault();
  const n = Math.min(Math.max(currentMain + next, 0), MAIN.length - 1); goTo(MAIN[n]);
});

/* Cursor y raycast */
const cursor = document.getElementById('cursor');
const mouse = new THREE.Vector2(0, 0), mouseTarget = new THREE.Vector2(0, 0), ndc = new THREE.Vector2(9, 9);
const ray = new THREE.Raycaster(); let hovered = null;
let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
if (finePointer) document.body.classList.add('has-cursor');
addEventListener('pointermove', e => {
  tx = e.clientX; ty = e.clientY;
  mouseTarget.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1));
  ndc.copy(mouseTarget);
  const overUI = e.target.closest('a,button,dialog,.label-card,.exit .lc-actions,.mailbox');
  cursor.style.opacity = '1';
  cursor.style.borderColor = overUI ? 'var(--brass)' : '';
}, { passive: true });
canvas.addEventListener('click', () => { if (freeCamera.consumeClick()) return; if (hovered && hovered.ficha >= 0) openFicha(hovered.ficha); });
// los clics caen sobre la pista de scroll (encima del canvas): reenviar
track.addEventListener('click', () => { if (hovered && hovered.ficha >= 0) openFicha(hovered.ficha); });

/* ---------- Bucle ---------- */
let scrollU = 0, smoothU = 0, travelVelocity = 0;
const camPos = new THREE.Vector3(...STOPS[0].pos), camLook = new THREE.Vector3(...STOPS[0].look);
function readScroll() { const max = track.offsetHeight - innerHeight; scrollU = max > 0 ? scrollY / max * total : 0; }
addEventListener('scroll', readScroll, { passive: true });
addEventListener('wheel', () => { directNavigation = false; }, { passive: true });
addEventListener('touchstart', () => { directNavigation = false; }, { passive: true });
readScroll(); smoothU = scrollU;

let lastAt = -1;
function updateUI(s) {
  const at = s.at;
  // índice de parada real más cercana para la interfaz
  const mainAt = MAIN.reduce((best, i) => Math.abs(stopU(i) - smoothU) < Math.abs(stopU(best) - smoothU) ? i : best, MAIN[0]);
  currentMain = MAIN.indexOf(mainAt);
  const inHold = segs.some(g => g.type === 'hold' && g.i === mainAt && smoothU >= g.a - .25 && smoothU <= g.b + .25);
  Object.entries(cards).forEach(([i, el]) => {
    const visible = inHold && +i === mainAt;
    el.classList.toggle('on', visible); el.inert = !visible; el.setAttribute('aria-hidden', String(!visible));
  });
  entrance.style.opacity = String(Math.max(0, 1 - smoothU / .9));
  entrance.style.transform = `translateY(${-Math.min(smoothU, 1.2) * 40}px)`;
  document.querySelector('.museum-caption').style.opacity = String(Math.max(0, 1 - smoothU / .8));
  entrance.style.visibility = smoothU > 1 ? 'hidden' : 'visible';
  const exitVisible = mainAt === STOPS.length - 1 && inHold;
  exit.classList.toggle('on', exitVisible); exit.inert = !exitVisible; exit.setAttribute('aria-hidden', String(!exitVisible));
  // rótulo de sala al llegar
  const approaching = Object.keys(ROOM_TITLES).map(Number).find(i => { const h = segs.find(g => g.type === 'hold' && g.i === i); return smoothU > h.a - .7 && smoothU < h.a - .05; });
  if (approaching != null) { roomKicker.textContent = ROOM_TITLES[approaching][0]; roomText.textContent = ROOM_TITLES[approaching][1]; }
  roomTitle.classList.toggle('on', approaching != null);
  railFill.style.width = `${smoothU / total * 100}%`;
  railButtons.forEach((b, n) => { b.classList.toggle('passed', stopU(MAIN[n]) <= smoothU + .05); b.classList.toggle('current', MAIN[n] === mainAt); });
  if (mainAt !== lastAt) { roomName.textContent = STOPS[mainAt].name; roomCount.textContent = `${String(currentMain).padStart(2, '0')} / ${String(MAIN.length - 1).padStart(2, '0')}`; lastAt = mainAt; }
}

const clock = new THREE.Clock();
let screenAcc = 0, running = true, fpsFrames = 0, fpsStart = 0;
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); running = false; window.museumFallback(); });
canvas.addEventListener('webglcontextrestored', () => location.reload());
document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { clock.getDelta(); cinematic.reset(); loop(); } });
function loop() {
  if (!running) return;
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  if(reduce){smoothU=scrollU;travelVelocity=0;}
  else {
    const travel=smoothTravel(smoothU,scrollU,travelVelocity,dt,.38,directNavigation?4:2.2);
    smoothU=travel.value;travelVelocity=travel.velocity;
  }
  const s = sample(smoothU);
  const par = reduce ? 0 : 1;
  if(freeCamera.active) freeCamera.update(dt);
  else {
    camPos.copy(s.pos);camLook.lerp(s.look,reduce?1:1-Math.exp(-5*dt));mouse.lerp(mouseTarget,1-Math.pow(.02,dt));
    camera.position.set(camPos.x+mouse.x*.10*par,camPos.y+mouse.y*.05*par+Math.sin(t*.9)*.005*par,camPos.z);
    camera.lookAt(camLook.x+mouse.x*.2*par,camLook.y+mouse.y*.12*par,camLook.z);
    canvas.dataset.cameraMode='recorrido';
  }
  architecture.update(camera,dt,reduce);

  urns.forEach((u, i) => {
    const d = u.inner.userData;
    if (!reduce) { u.inner.rotation.y += d.spin * dt; u.inner.position.y = 1.62 + (d.yOffset || 0) + Math.sin(t * 1.3 + i) * d.float; }
    else u.inner.position.y = 1.62 + (d.yOffset || 0);
    if (d.nodes) d.nodes.rotation.y -= dt * .8 * par;
    if (d.wire) d.wire.material.opacity = reduce ? .7 : .45 + .4 * Math.abs(Math.sin(t * 1.2));
    const isHover = hovered === u;
    u.edges.material.opacity += ((isHover ? .9 : .35) - u.edges.material.opacity) * .12;
    u.glow.intensity += (((isHover ? 4 : 2.2) * (small ? .6 : 1)) - u.glow.intensity) * .1;
  });
  screenAcc += dt; if (screenAcc > 1 / 24) { drawScreen(t); screenAcc = 0; }
  if (!reduce) { const p = dustGeo.attributes.position; for (let i = 0; i < DUST; i++) { let y = p.array[i * 3 + 1] + dt * .04 * ((i % 7) - 3) * .3; if (y > 6.5) y = 0; if (y < 0) y = 6.5; p.array[i * 3 + 1] = y; } p.needsUpdate = true; }
  neon.material.color.setScalar(reduce ? 1.25 : 1.25 + (Math.sin(t * 13) > .97 ? -.6 : 0) + Math.sin(t * 2) * .05);

  // hover sobre urnas
  if (finePointer && !dlg.open) {
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(urns.map(u => u.hit), false)[0];
    const u = hit && hit.distance < 9 ? urns.find(x => x.hit === hit.object) : null;
    hovered = u && u.ficha >= 0 ? u : null;
    cursor.classList.toggle('view', !!hovered);
  } else hovered = null;
  cx += (tx - cx) * (1 - Math.pow(.0001, dt)); cy += (ty - cy) * (1 - Math.pow(.0001, dt));
  cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;

  if(freeCamera.active){
    let nearest=MAIN[0],distance=Infinity;MAIN.forEach(i=>{const d=camera.position.distanceTo(new THREE.Vector3(...STOPS[i].pos));if(d<distance){distance=d;nearest=i;}});
    const prior=smoothU;smoothU=stopU(nearest);updateUI(s);smoothU=prior;
    entrance.style.visibility='hidden';document.querySelector('.museum-caption').style.opacity='0';roomTitle.classList.remove('on');
    Object.entries(cards).forEach(([i,el])=>{const visible=+i===nearest&&distance<6;el.classList.toggle('on',visible);el.inert=!visible;el.setAttribute('aria-hidden',String(!visible));});
  }else updateUI(s);
  mythology.update(t,reduce);
  cinematic.render(dt);
  fpsFrames++;
  if(t-fpsStart>=1){canvas.dataset.frameRate=String(Math.round(fpsFrames/(t-fpsStart)));fpsFrames=0;fpsStart=t;}
}

addEventListener('resize', () => {
  frameRoute();
  curve.points = STOPS.map(s => new THREE.Vector3(...s.pos));
  curve.updateArcLengths();
  lookCurve.points = STOPS.map(s => new THREE.Vector3(...s.look));
  lookCurve.updateArcLengths();
  camera.fov = small ? 62 : 50;
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 720 ? 1.35 : 1.75));
  cinematic.resize();
  readScroll();
});

/* ---------- Telón de carga ---------- */
const count = document.getElementById('count');
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
let shown = 0; const start = performance.now();
const tick = () => {
  const elapsed = performance.now() - start;
  shown = Math.min(100, Math.max(shown, Math.floor(elapsed / (reduce ? 4 : 12))));
  count.textContent = String(shown).padStart(2, '0');
  if (shown < 100) requestAnimationFrame(tick);
};
tick();
Promise.race([fontsReady, new Promise(r => setTimeout(r, 2500))]).then(() => {
  // redibuja los rótulos ya con las fuentes cargadas
  TEXTS.forEach(redraw => redraw());
  renderer.compile(scene, camera);
  const wait = Math.max(0, (reduce ? 400 : 1250) - (performance.now() - start));
  setTimeout(() => { shown = 100; count.textContent = '100'; clearTimeout(window.museumLoadTimer); root.classList.remove('no-webgl'); root.classList.add('ready'); }, wait);
});
loop();
