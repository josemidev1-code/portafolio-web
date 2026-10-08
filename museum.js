import * as THREE from 'three';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/environments/RoomEnvironment.js';

import { smoothTravel, routeParameter } from './motion.js';
import { createMotionRenderer } from './cinematic.js';
import { createFreeCamera } from './free-camera.js';
import { createGreekMuseum } from './greek-temple.js';
import { createMaterials } from './materials.js';
import { createFires } from './fire.js';
import { createGods, GOD_INFO, GODS } from './gods.js';
import { createAthens, WALL } from './athens.js';
import { PRESETS, initialQuality, createGovernor, saveChoice } from './quality.js';
import { createTextureSet } from './textures.js';
import { G, ROOMS, EYE, VIEW_Z } from './layout.js';

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
// Calidad gráfica: se elige según la tarjeta del equipo antes de crear la escena.
const detectedQuality = initialQuality({ mobile: small || !finePointer });
let qualityMode = detectedQuality.mode, quality = detectedQuality.level, renderScale = 1;
// En equipos modestos la geometría, las texturas y las esculturas se cargan en su versión ligera.
const compact = small || quality === 'baja';
const pixelRatio = () => { const P = PRESETS[quality]; return Math.min(devicePixelRatio, small ? Math.min(1.35, P.pixelCap) : P.pixelCap) * P.scale * renderScale; };

/* ---------- Fichas (contenido real) ---------- */
const FICHAS = [
  {
    inv: 'Nº inv. JM-001 · Sala I', title: 'JOSEMI-OS', accent: '#8cf0b4',
    text: [
      'Mi primer proyecto personal como desarrollador. No quería una página típica de “sobre mí, proyectos y contacto”, así que construí un pequeño sistema operativo que se puede explorar, abrir y tocar.',
      'La web arranca con una terminal que escribe JOSEMI-OS en pantalla con ocho efectos distintos y después abre el escritorio. Todo está hecho con HTML, CSS y JavaScript, sin frameworks, y tiene pruebas para la lógica del Arcade y de la terminal.'
    ],
    list: ['Ventanas que se arrastran, minimizan, maximizan y redimensionan', 'Terminal con comandos: empieza por ayuda', 'Arcade con minijuegos', 'Seis fondos ASCII animados y siete temas', 'Buscador de aplicaciones con Ctrl+K', 'Easter eggs y acertijos escondidos'],
    links: [['Probar JOSEMI-OS ↗', 'https://josemidev1.site'], ['Código en GitHub ↗', 'https://github.com/josemidev1-code/JOSEMI-OS']]
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

/* Inscripción del ágora: la misma información, accesible y legible en cualquier pantalla. */
const ABOUT = {
  inv: 'Ágora · Inscripción del autor', title: 'José Miguel Miralles Gandia', accent: '#d8b46a',
  text: ['Estudiante de 1.º de DAM (Desarrollo de Aplicaciones Multiplataforma) en el IES Dr. Lluís Simarro.',
    'Busco un lugar donde trabajar y seguir creciendo. Hago páginas web y estoy aprendiendo a crear automatizaciones con IA para empresas.'],
  listTitle: 'En este museo', list: ['Sala I · JOSEMI-OS, presidida por Atenea', 'Sala II · Asistente de gimnasio, presidida por Hermes', 'Sala III · Próximo proyecto, presidida por Hefesto'],
  links: [['Escríbeme', 'mailto:jmenterprice73@gmail.com'], ['GitHub ↗', 'https://github.com/josemidev1-code'], ['LinkedIn ↗', 'https://www.linkedin.com/in/jose-miguel-miralles-gandia-74347b43a/']]
};
const ABOUT_HIT = { about: true };

/* ---------- Recorrido: paradas de cámara ---------- */
// Cada parada: posición de cámara, punto al que mira y cuánto scroll se queda quieta.
// Punto de lectura del muro grabado: de frente, a unos ocho metros, con el muro a la derecha del encuadre.
const wallRight = [Math.cos(WALL.rot), 0, -Math.sin(WALL.rot)], wallFace = [Math.sin(WALL.rot), 0, Math.cos(WALL.rot)];
const WALL_C = [WALL.x, 1.95, WALL.z];
const along = (p, d, k) => p.map((v, i) => v + d[i] * k);
// Galería horizontal: se entra por el templo y se recorre de izquierda a derecha mirando al muro de los proyectos.
const roomStop = (i, name, card, hold = 1.1) => { const cx = ROOMS[i].cx; return { name, card, pos: [cx + .5, EYE, VIEW_Z], look: [cx + .9, 2.55, G.back], hold }; };
// Parada ante el dios de la sala, como una pieza más: de tres cuartos y a la altura del rostro.
const godStop = (id, name, title) => { const g = GODS.find(x => x.id === id), top = g.plinth + g.height * .82;
  return { name, card: `card-${id}`, title, pos: [g.x + 1.9, top - .35, g.z + 3.3], look: [g.x + .55, top - .55, g.z], hold: 1 }; };
const passStop = i => ({ name: 'Paso', pos: [ROOMS[i].x0, EYE + .05, G.doorZ + .3], look: [ROOMS[i].x0 + 5, 2.3, G.back], hold: 0, pass: true });
const STOPS = [
  { name: 'Ágora',    pos: along(along(WALL_C, wallFace, 9.6), wallRight, -1.6), look: along(WALL_C, wallRight, -1.9), hold: .35 },
  { name: 'Entrada',  pos: [3, 2.8, 25],     look: [5, 4.6, 3.8],   hold: .25 },
  { name: 'Puerta',   pos: [0, 1.8, 7.2],    look: [0, 2, -4],      hold: 0, pass: true },
  godStop('atenea', 'Atenea', ['Sala I · Atenea', 'Sistemas']), roomStop(0, 'JOSEMI-OS', 'card-1'), passStop(1),
  godStop('hermes', 'Hermes', ['Sala II · Hermes', 'Automatización']), roomStop(1, 'Asistente', 'card-2'), passStop(2),
  godStop('hefesto', 'Hefesto', ['Sala III · Hefesto', 'Lo que viene']), roomStop(2, 'Próxima', 'card-3'), passStop(3),
  { name: 'Salida', pos: [ROOMS[3].cx, 1.8, VIEW_Z], look: [ROOMS[3].cx, 3.1, G.back], hold: .8 }
];
// Conserva el encuadre al girar el móvil o redimensionar la ventana.
const originalStops = STOPS.map(s => ({pos: [...s.pos], look: [...s.look]}));
function frameRoute() {
  small = innerWidth < 720;
  STOPS.forEach((s,i) => {
    s.pos = [...originalStops[i].pos]; s.look = [...originalStops[i].look];
    // En vertical la cámara se pega a la fachada interior para que el cuadro quepa entero.
    if (small && /^card-\d$/.test(s.card || '')) { s.pos = [s.pos[0] - .2, 2.1, G.front - .35]; s.look = [s.pos[0], 2.2, G.back]; }
    // Ante los dioses, en vertical la cámara retrocede para que la estatua quepa entera.
    else if (small && s.title) { s.pos = [s.pos[0] + .6, s.pos[1] - .2, s.pos[2] + 1.6]; }
  });
  if (small) {
    // En vertical el muro se aleja y sube en el encuadre para dejar sitio a la portada.
    STOPS[0].pos = along(along(WALL_C, wallFace, 14), [0, 1, 0], .6); STOPS[0].look = along(WALL_C, [0, 1, 0], -2.4);
    STOPS[1].pos = [0, 3.6, 41]; STOPS[1].look = [0, 5.4, 3.8];
  }
}
frameRoute();
const MAIN = STOPS.map((s, i) => s.pass ? -1 : i).filter(i => i >= 0); // índices de paradas reales
// unidades de scroll: hold de cada parada + 1 por cada tramo de viaje
const segs = []; let total = 0;
STOPS.forEach((s, i) => {
  if (s.hold) { segs.push({ type: 'hold', i, a: total, b: total + s.hold }); total += s.hold; }
  if (i < STOPS.length - 1) { const len = i === 0 ? 1.8 : i === 1 ? 1.6 : i === 2 ? 1.4 : (STOPS[i + 1].pass || s.pass ? 1.05 : 1.4); segs.push({ type: 'move', i, a: total, b: total + len }); total += len; }
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
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !PRESETS[quality].post, powerPreference: 'high-performance' });
} catch (e) { root.classList.add('no-webgl', 'ready'); throw e; }
renderer.setPixelRatio(pixelRatio());
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#141518');
// Niebla cálida y lejana: da aire a la nave sin ocultar las salas.
scene.fog = new THREE.Fog('#2b2621', 45, 215);
// Reflejos suaves en bronce, cristal y piedra, sin descargar un HDR pesado.
const pmrem = new THREE.PMREMGenerator(renderer);
const reflectionRoom = new RoomEnvironment();
const reflectionTarget = pmrem.fromScene(reflectionRoom, .025);
scene.environment = reflectionTarget.texture;
scene.environmentIntensity = .14;
reflectionRoom.dispose(); pmrem.dispose();
const camera = new THREE.PerspectiveCamera(small ? 62 : 50, innerWidth / innerHeight, .1, 240);
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
const M = createMaterials(THREE, { compact });
const pbr = createTextureSet(THREE, renderer, { compact });
const architecture = createGreekMuseum(THREE, scene, canvasTex, compact, M, pbr);
const athens = createAthens(THREE, scene, M, { compact, canvasTex, contactShadow: architecture.contactShadow, pbr });
const fires = createFires(THREE, scene, M, { compact, canvasTex });
const gods = createGods(THREE, scene, M, { compact, renderer, contactShadow: architecture.contactShadow });
const cinematic = createMotionRenderer(THREE,renderer,scene,camera,{compact,reduce});

/* Textos de pared: rótulos de sala pintados sobre el muro */
// Letras grabadas en la piedra: surco oscuro con una arista de luz debajo.
function wallText(lines, { w = 4, h = 1.6, size = 150, color = 'rgba(46,34,24,.9)', sub, align = 'left', gilt = false } = {}) {
  const tex = canvasTex(1024, 410, (g, W, H) => {
    g.clearRect(0, 0, W, H); g.textAlign = align; g.textBaseline = 'alphabetic';
    const x = align === 'left' ? 10 : W / 2;
    if (sub) { g.font = '600 26px "Instrument Sans", sans-serif'; g.fillStyle = '#9a7445'; g.fillText(sub.toUpperCase().split('').join(' '), x, 46); }
    g.font = `600 ${size}px "Cinzel", "Trajan Pro", Georgia, serif`;
    lines.forEach((l, i) => {
      const y = (sub ? 70 : 0) + size * 1.02 * (i + 1) - size * .12;
      if (!gilt) { g.fillStyle = 'rgba(255,242,220,.45)'; g.fillText(l.toUpperCase(), x, y + 3); }
      g.fillStyle = color; g.fillText(l.toUpperCase(), x, y);
    });
  }, { text: true });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h * 410 / 410), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .85, depthWrite: false }));
  m.userData.tex = tex; return m;
}

/* ---------- Proyectos colgados como cuadros ---------- */
// Cada proyecto es un lienzo en el muro del fondo de su sala, con marco dorado, lámpara de cuadro y cartela.
const works = [];
function plaqueTex(code, title) {
  return canvasTex(700, 200, (g, W, H) => {
    const grd = g.createLinearGradient(0, 0, W, H); grd.addColorStop(0, '#9a7444'); grd.addColorStop(.5, '#c9a46a'); grd.addColorStop(1, '#8b6a3e');
    g.fillStyle = grd; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(40,26,12,.6)'; g.lineWidth = 4; g.strokeRect(10, 10, W - 20, H - 20);
    g.fillStyle = '#2a1c0c'; g.font = '600 26px "Instrument Sans", sans-serif'; g.fillText(code.split('').join(' '), 34, 60);
    g.font = '600 64px "Cinzel", Georgia, serif'; g.fillText(title.toUpperCase(), 32, 148);
  }, { text: true });
}
function makeWork({ room, w, h, map, accent, plaque, ficha, y = 3.35 }) {
  const cx = ROOMS[room].cx, z = G.back;
  const g = new THREE.Group(); g.position.set(cx, y, z); scene.add(g);
  // Marco de dos molduras doradas con un listel oscuro entre ellas.
  const bar = (bw, bh, bd, x, yy, zz, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat); m.position.set(x, yy, zz); m.castShadow = true; m.receiveShadow = true; g.add(m); };
  [[.16, .1, M.gilt, 0], [.07, .14, M.darkGilt, .16], [.05, .16, M.gilt, .23]].forEach(([t, d, mat, o]) => {
    const W2 = w + 2 * (o + t), H2 = h + 2 * (o + t);
    bar(W2, t, d, 0, H2 / 2 - t / 2, d / 2, mat); bar(W2, t, d, 0, -H2 / 2 + t / 2, d / 2, mat);
    bar(t, H2 - 2 * t, d, W2 / 2 - t / 2, 0, d / 2, mat); bar(t, H2 - 2 * t, d, -W2 / 2 + t / 2, 0, d / 2, mat);
  });
  const canvasMat = new THREE.MeshStandardMaterial({ map, roughness: .55, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: .12 });
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), canvasMat); pic.position.z = .06; g.add(pic);
  // Lámpara de cuadro de latón sobre el marco.
  const lampY = h / 2 + .45;
  bar(.05, .05, .42, 0, lampY, .21, M.darkGilt);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, w * .55, 24), M.gilt); lamp.rotation.z = Math.PI / 2; lamp.position.set(0, lampY, .44); g.add(lamp);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(w * .5, .03), new THREE.MeshBasicMaterial({ color: '#fff3d6', toneMapped: false })); strip.position.set(0, lampY - .062, .44); strip.rotation.x = Math.PI / 2; g.add(strip);
  // Luz del cuadro: un foco cálido desde el techo, rasante sobre el lienzo.
  const spot = new THREE.SpotLight('#ffe9c7', small ? 60 : 85, 12, Math.PI / 8.5, .55, 1.3);
  spot.position.set(cx, G.ceil - .2, G.back + 4.2); spot.target.position.set(cx, y, z); scene.add(spot, spot.target);
  // Cartela de latón a la derecha, a la altura de los ojos.
  const plq = new THREE.Mesh(new THREE.PlaneGeometry(.62, .18), new THREE.MeshStandardMaterial({ map: plaque, metalness: .7, roughness: .38 }));
  plq.position.set(w / 2 + .75, 1.6 - y, .03); g.add(plq);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(w + .6, h + .6, .6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.z = .3; g.add(hit);
  const u = { group: g, hit, ficha, accent, canvasMat }; works.push(u); return u;
}

/* JOSEMI-OS: el lienzo es la pantalla viva del sistema, arrancando y mostrando su logotipo. */
const screenTex = canvasTex(1024, 768, () => {});
const screenCtx = screenTex.userData.ctx;
const BOOT = ['josemi@portfolio:~$ ./boot JOSEMI-OS', '[ ok ] cargando núcleo html.css.js', '[ ok ] montando escritorio', '[ ok ] abriendo terminal', '[ ok ] arcade listo', '[ ok ] 6 fondos ascii', '', 'bienvenido a JOSEMI-OS', 'build, learn, repeat.'];
const ASCII = [
  ' _  ___  ___ ___ __  __ ___    ___  ___ ',
  '| |/ _ \\/ __| __|  \\/  |_ _|  / _ \\/ __|',
  '| | (_) \\__ \\ _|| |\\/| || |  | (_) \\__ \\',
  '\\__/\\___/|___/___|_|  |_|___|  \\___/|___/'
];
function drawScreen(t) {
  const g = screenCtx, W = 512, H = 384;
  g.setTransform(2, 0, 0, 2, 0, 0);
  g.fillStyle = '#04110a'; g.fillRect(0, 0, W, H);
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
  g.fillStyle = 'rgba(0,0,0,.22)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
  g.setTransform(1, 0, 0, 1, 0, 0);
  screenTex.needsUpdate = true;
}
drawScreen(0);

/* Asistente de gimnasio: un lienzo con la conversación de WhatsApp y el flujo de n8n hasta la IA. */
const gymTex = canvasTex(1200, 900, (g, W, H) => {
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#101826'); bg.addColorStop(1, '#0b0f17'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(141,180,255,.08)'; g.lineWidth = 1; for (let x = 0; x < W; x += 30) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 30) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // Chat
  const bubble = (x, y, w, text, mine) => { g.fillStyle = mine ? '#1f6f50' : '#1d2635'; g.beginPath(); g.roundRect(x, y, w, 64, 16); g.fill(); g.fillStyle = '#e8eef7'; g.font = '500 24px "Instrument Sans", sans-serif'; g.fillText(text, x + 20, y + 40); };
  g.fillStyle = '#e8eef7'; g.font = '600 28px "Instrument Sans", sans-serif'; g.fillText('WhatsApp · Gimnasio', 60, 90);
  bubble(60, 130, 380, '¿A qué hora abrís el sábado?', false);
  bubble(140, 214, 360, 'De 9:00 a 14:00 💪', true);
  bubble(60, 298, 400, '¿Puedo congelar mi cuota?', false);
  bubble(120, 382, 380, 'Sí, desde la app o aquí.', true);
  // Flujo n8n
  const node = (x, y, label, color) => { g.fillStyle = '#172033'; g.strokeStyle = color; g.lineWidth = 4; g.beginPath(); g.roundRect(x - 95, y - 48, 190, 96, 18); g.fill(); g.stroke(); g.fillStyle = color; g.font = '600 26px "Instrument Sans", sans-serif'; g.textAlign = 'center'; g.fillText(label, x, y + 9); g.textAlign = 'left'; };
  const link = (x0, y0, x1, y1) => { g.strokeStyle = 'rgba(141,180,255,.7)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y0); g.bezierCurveTo((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, x1, y1); g.stroke(); };
  link(735, 250, 835, 420); link(835, 420, 1035, 420); link(1035, 420, 935, 640); link(935, 640, 735, 640);
  node(735, 250, 'WhatsApp', '#5bd69a'); node(840, 420, 'n8n', '#ff8a65'); node(1040, 420, 'IA', '#8db4ff'); node(940, 640, 'Respuesta', '#e8c37a'); node(735, 640, 'Socio', '#5bd69a');
  g.fillStyle = '#d8b46a'; g.font = '600 46px "Cinzel", Georgia, serif'; g.fillText('ASISTENTE DE GIMNASIO', 60, 820);
  g.fillStyle = 'rgba(232,238,247,.6)'; g.font = 'italic 500 28px "Cormorant Garamond", Georgia, serif'; g.fillText('WhatsApp · n8n · IA — pieza en restauración', 60, 862);
}, { text: true });

/* Sala III: el hueco de la próxima obra, cubierto con un paño hasta que se presente. */
const nextTex = canvasTex(900, 1100, (g, W, H) => {
  const bg = g.createLinearGradient(0, 0, W, 0); bg.addColorStop(0, '#3a0d0f'); bg.addColorStop(.5, '#6a1a1c'); bg.addColorStop(1, '#3a0d0f'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // Pliegues del paño: franjas verticales de luz y sombra.
  for (let x = 0; x < W; x += 2) { const v = Math.sin(x / W * Math.PI * 9) * .5 + Math.sin(x / W * Math.PI * 23 + 1) * .25; g.fillStyle = v > 0 ? `rgba(255,170,140,${v * .1})` : `rgba(0,0,0,${-v * .3})`; g.fillRect(x, 0, 2, H); }
  const sh = g.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, 'rgba(0,0,0,.4)'); sh.addColorStop(.25, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = sh; g.fillRect(0, 0, W, H);
  g.textAlign = 'center'; g.fillStyle = '#d9b77a'; g.font = '600 64px "Cinzel", Georgia, serif'; g.fillText('PRÓXIMA', W / 2, H / 2 - 30); g.fillText('ADQUISICIÓN', W / 2, H / 2 + 50);
  g.font = 'italic 500 34px "Cormorant Garamond", Georgia, serif'; g.fillStyle = 'rgba(240,220,190,.8)'; g.fillText('Se está forjando en el taller de Hefesto', W / 2, H / 2 + 120);
}, { text: true });

makeWork({ room: 0, w: 3.6, h: 2.7, map: screenTex, accent: '#8cf0b4', plaque: plaqueTex('JM-001 · 2026', 'JOSEMI-OS'), ficha: 0 });
makeWork({ room: 1, w: 3.6, h: 2.7, map: gymTex, accent: '#8db4ff', plaque: plaqueTex('JM-002 · 2026', 'Asistente gym'), ficha: 1 });
makeWork({ room: 2, w: 2.4, h: 2.95, map: nextTex, accent: '#c9a46a', plaque: plaqueTex('JM-003 · —', 'Reservada'), ficha: -1 });

/* Rótulos de sala grabados en el muro del fondo, sobre el cuadro. */
const rooms = [
  { lines: ['Sala I · Atenea', 'Sistemas'], sub: 'JM-001', room: 0 },
  { lines: ['Sala II · Hermes', 'Automatización'], sub: 'JM-002', room: 1 },
  { lines: ['Sala III · Hefesto', 'Lo que viene'], sub: 'JM-003', room: 2 }
];
rooms.forEach(r => {
  const t = wallText(r.lines, { w: 3.4, h: 1.36, size: 112, sub: r.sub + ' · colección permanente', align: 'center' });
  t.position.set(ROOMS[r.room].cx, 6.3, G.back + .02); scene.add(t);
});
/* Sala de salida: inscripción de despedida en oro sobre el muro del fondo. */
const neon = wallText(['Gracias por', 'la visita'], { w: 5, h: 2, size: 120, color: '#e9c98f', align: 'center', gilt: true });
neon.material = new THREE.MeshStandardMaterial({ map: neon.userData.tex, transparent: true, depthWrite: false, metalness: .6, roughness: .35, emissive: '#7a4a18', emissiveMap: neon.userData.tex, emissiveIntensity: .35 });
neon.position.set(ROOMS[3].cx, 5.7, G.back + .03); scene.add(neon);
const neonGlow = new THREE.PointLight('#ffb866', 6, 9, 1.5); neonGlow.position.set(ROOMS[3].cx, 4.6, G.back + 2.2); scene.add(neonGlow);
// Banco de mármol en el centro de la sala de salida, sobre dos patas.
const bench = new THREE.Group(); bench.position.set(ROOMS[3].cx, 0, -.6); scene.add(bench);
[[2.6, .1, .7, .47, M.marble], [.16, .42, .56, .21, M.marbleGrey]].forEach(([w, h, d, y, mat], i) => {
  (i ? [-1.05, 1.05] : [0]).forEach(x => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, 0); m.castShadow = m.receiveShadow = true; bench.add(m); });
});
architecture.contactShadow(ROOMS[3].cx, -.6, 3.2, 1.4);


/* Motas de polvo en el aire */
const DUST = small ? 500 : 1400;
const dustGeo = new THREE.BufferGeometry(); const dp = new Float32Array(DUST * 3);
for (let i = 0; i < DUST; i++) { dp[i * 3] = ROOMS[0].x0 + Math.random() * (ROOMS[3].x1 - ROOMS[0].x0); dp[i * 3 + 1] = Math.random() * 6.5; dp[i * 3 + 2] = G.back + Math.random() * (G.front - G.back + 4); }
dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
const dotTex = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: '#ffe6c2', map: dotTex, size: .028, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(dust);

/* ---------- Calidad gráfica ---------- */
const QUALITY_NAMES = { alta: 'Alta', media: 'Media', baja: 'Baja' };
const qualityButton = document.getElementById('quality-toggle');
function applyQuality() {
  const P = PRESETS[quality];
  renderer.setPixelRatio(pixelRatio()); renderer.setSize(innerWidth, innerHeight);
  cinematic.configure(P); cinematic.resize();
  const sun = architecture.sun;
  if (sun.shadow.mapSize.x !== P.sunMap) { sun.shadow.mapSize.set(P.sunMap, P.sunMap); sun.shadow.map?.dispose(); sun.shadow.map = null; }
  // Luces de relleno y sombras secundarias: three.js recompila los materiales al cambiar su número.
  scene.traverse(o => { if (!o.isLight) return; if (o.userData.extra) o.visible = P.extraLights; if (o.userData.heroShadow) o.castShadow = P.heroShadow; });
  // En calidad baja las sombras se recalculan cada pocos fotogramas: la escena casi no se mueve.
  renderer.shadowMap.autoUpdate = P.shadowEvery === 1; renderer.shadowMap.needsUpdate = true;
  dust.visible = P.dust;
  // Reflejo del suelo pulido: vuelve a pintar la escena, solo en calidad alta.
  architecture.mirror.visible = P.reflect;
  canvas.dataset.quality = quality; canvas.dataset.qualityMode = qualityMode;
  qualityButton.textContent = `Gráficos · ${qualityMode === 'auto' ? 'Auto ' : ''}${QUALITY_NAMES[quality]}`;
  qualityButton.title = `${qualityMode === 'auto' ? 'Calidad elegida según tu equipo' : 'Calidad fijada a mano'}. Pulsa para cambiarla.`;
}
const governor = createGovernor({
  getLevel: () => quality,
  setLevel: level => { quality = level; applyQuality(); },
  setScale: s => { renderScale = s; applyQuality(); },
  isAuto: () => qualityMode === 'auto',
  isBusy: () => dlg.open || freeCamera.active
});
// Auto → Alta → Media → Baja → Auto
qualityButton.addEventListener('click', () => {
  const order = ['auto', 'alta', 'media', 'baja'];
  const next = order[(order.indexOf(qualityMode === 'auto' ? 'auto' : quality) + 1) % order.length];
  qualityMode = next === 'auto' ? 'auto' : 'manual';
  quality = next === 'auto' ? detectedQuality.detected : next;
  renderScale = 1; saveChoice(next); applyQuality();
  if (qualityMode === 'auto') governor.start(performance.now());
});
applyQuality();

/* ---------- Interfaz ---------- */
const cards = Object.fromEntries(STOPS.map((s, i) => [i, s.card && document.getElementById(s.card)]).filter(([, el]) => el));
const roomTitle = document.getElementById('room-title'), roomKicker = document.getElementById('room-kicker'), roomText = document.getElementById('room-text');
const ROOM_TITLES = Object.fromEntries(STOPS.map((s, i) => [i, s.title]).filter(([, t]) => t));
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
function openFicha(i) { openInfo(FICHAS[i]); }
function openGod(id) { openInfo(GOD_INFO[id]); }
const fichaListTitle = document.querySelector('#ficha .ficha-grid h4');
function openInfo(f) {
  if (!f) return;
  fichaListTitle.textContent = f.listTitle || 'Qué contiene';
  dlg.style.setProperty('--accent', f.accent);
  document.getElementById('ficha-inv').textContent = f.inv;
  document.getElementById('ficha-title').textContent = f.title;
  const text = document.getElementById('ficha-text'); text.replaceChildren(...f.text.map(t => Object.assign(document.createElement('p'), { textContent: t })));
  document.getElementById('ficha-list').replaceChildren(...f.list.map(t => Object.assign(document.createElement('li'), { textContent: t })));
  const acts = document.getElementById('ficha-actions'); acts.replaceChildren();
  (f.links || []).forEach(([label, href]) => { const a = Object.assign(document.createElement('a'), { className: 'btn', href, target: '_blank', rel: 'noopener noreferrer', textContent: label }); acts.append(a); });
  const back = Object.assign(document.createElement('button'), { className: 'btn ghost', type: 'button', textContent: 'Seguir el recorrido' }); back.addEventListener('click', () => dlg.close()); acts.append(back);
  dlg.showModal();
}
document.querySelectorAll('[data-ficha]').forEach(b => b.addEventListener('click', () => openFicha(+b.dataset.ficha)));
document.querySelectorAll('[data-god]').forEach(b => b.addEventListener('click', () => openGod(b.dataset.god)));
document.querySelectorAll('[data-about]').forEach(b => b.addEventListener('click', () => openInfo(ABOUT)));
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
const cursor = document.getElementById('cursor'), cursorLabel = cursor.querySelector('span');
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
canvas.addEventListener('click', () => { if (freeCamera.consumeClick()) return; activateHovered(); });
function activateHovered() { if (!hovered) return; if (hovered.about) openInfo(ABOUT); else if (hovered.god) openGod(hovered.god); else if (hovered.ficha >= 0) openFicha(hovered.ficha); }
// los clics caen sobre la pista de scroll (encima del canvas): reenviar
track.addEventListener('click', activateHovered);

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
  const approaching = Object.keys(ROOM_TITLES).map(Number).find(i => { const h = segs.find(g => g.type === 'hold' && g.i === i); return smoothU > h.a - 1.0 && smoothU < h.a + .55; });
  if (approaching != null) { roomKicker.textContent = ROOM_TITLES[approaching][0]; roomText.textContent = ROOM_TITLES[approaching][1]; }
  roomTitle.classList.toggle('on', approaching != null);
  railFill.style.width = `${smoothU / total * 100}%`;
  railButtons.forEach((b, n) => { b.classList.toggle('passed', stopU(MAIN[n]) <= smoothU + .05); b.classList.toggle('current', MAIN[n] === mainAt); });
  if (mainAt !== lastAt) { roomName.textContent = STOPS[mainAt].name; roomCount.textContent = `${String(currentMain).padStart(2, '0')} / ${String(MAIN.length - 1).padStart(2, '0')}`; lastAt = mainAt; }
}

const clock = new THREE.Clock();
let screenAcc = 0, running = true, fpsFrames = 0, fpsStart = 0, frameNo = 0;
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); running = false; window.museumFallback(); });
canvas.addEventListener('webglcontextrestored', () => location.reload());
document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { clock.getDelta(); cinematic.reset(); governor.reset(performance.now()); loop(); } });
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
  architecture.update(camera,dt,reduce,t);
  athens.update(reduce ? 0 : t, camera);
  fires.update(t,camera,reduce);

  // Al pasar el ratón, el lienzo se ilumina un poco, como si se encendiera su lámpara.
  works.forEach(u => { const m = u.canvasMat; m.emissiveIntensity += ((hovered === u ? .3 : .12) - m.emissiveIntensity) * .12; });
  screenAcc += dt; if (screenAcc > 1 / 24) { drawScreen(t); screenAcc = 0; }
  if (frameNo % PRESETS[quality].shadowEvery === 0) renderer.shadowMap.needsUpdate = true;
  if (!reduce && dust.visible) { const p = dustGeo.attributes.position; for (let i = 0; i < DUST; i++) { let y = p.array[i * 3 + 1] + dt * .04 * ((i % 7) - 3) * .3; if (y > 6.5) y = 0; if (y < 0) y = 6.5; p.array[i * 3 + 1] = y; } p.needsUpdate = true; }

  // hover sobre cuadros, dioses y piezas
  if (finePointer && !dlg.open) {
    ray.setFromCamera(ndc, camera);
    const targets = [...works.map(u => u.hit), ...gods.hits.map(g => g.mesh), athens.wallHit];
    const hit = ray.intersectObjects(targets, false)[0];
    const u = hit && hit.distance < 12 ? (works.find(x => x.hit === hit.object) || gods.hits.find(g => g.mesh === hit.object) || (hit.object === athens.wallHit ? ABOUT_HIT : null)) : null;
    hovered = u && (u.god || u.about || u.ficha >= 0) ? u : null;
    if (hovered) cursorLabel.textContent = hovered.about ? 'Sobre mí' : hovered.god ? (GOD_INFO[hovered.god].piece ? 'Ver pieza' : `Conocer a ${GOD_INFO[hovered.god].title}`) : 'Ver ficha';
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
  cinematic.render(dt);
  governor.tick(performance.now()); frameNo++;
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
  renderer.setPixelRatio(pixelRatio());
  cinematic.resize();
  readScroll();
});

/* ---------- Telón de carga ---------- */
const count = document.getElementById('count');
// Los lienzos solo usan una fuente web si ya está cargada: se piden de forma explícita.
const fontsReady = document.fonts ? Promise.all(['600 64px "Cinzel"', '600 92px "EB Garamond"', '500 22px "Cinzel"', 'italic 500 24px "Cormorant Garamond"', '600 26px "Instrument Sans"', '17px "JetBrains Mono"'].map(f => document.fonts.load(f).catch(() => {}))).then(() => document.fonts.ready) : Promise.resolve();
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
  TEXTS.forEach(redraw => redraw()); gods.redraw();
  // La escultura se espera unos segundos; si la red va lenta aparece en cuanto llegue.
  return Promise.race([gods.ready, new Promise(r => setTimeout(r, 6000))]);
}).then(() => {
  renderer.compile(scene, camera);
  const wait = Math.max(0, (reduce ? 400 : 1250) - (performance.now() - start));
  setTimeout(() => { shown = 100; count.textContent = '100'; clearTimeout(window.museumLoadTimer); root.classList.remove('no-webgl'); root.classList.add('ready'); governor.start(performance.now()); }, wait);
});
loop();
