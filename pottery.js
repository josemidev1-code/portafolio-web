/** Cerámica ática: ánfora de cuello, ánfora de vientre, crátera de cáliz e hidria.
 *  La decoración (figuras negras o rojas, grecas, lengüetas y rayos) se pinta en canvas
 *  siguiendo la altura real de cada pieza, así las bandas no se deforman. */
import { fbmField } from './materials.js';

const CLAY = '#c26b38', GLOSS = '#17110e', CLAY_LINE = '#d58a55';

/* Perfiles (radio, altura) en metros. */
const SHAPES = {
  neckAmphora: { h: .74, pts: [[0, 0], [.1, 0], [.1, .025], [.075, .04], [.07, .07], [.12, .1], [.19, .2], [.225, .32], [.23, .4], [.205, .5], [.15, .56], [.09, .59], [.075, .63], [.074, .69], [.09, .71], [.1, .725], [.095, .74], [.07, .74]] },
  bellyAmphora: { h: .66, pts: [[0, 0], [.11, 0], [.11, .02], [.085, .035], [.09, .06], [.16, .12], [.215, .24], [.235, .34], [.225, .44], [.18, .52], [.125, .565], [.115, .6], [.13, .64], [.135, .66], [.11, .66]] },
  krater: { h: .56, pts: [[0, 0], [.14, 0], [.14, .03], [.1, .045], [.065, .07], [.06, .12], [.1, .15], [.17, .2], [.2, .25], [.22, .32], [.25, .42], [.28, .52], [.3, .55], [.305, .56], [.28, .56]] },
  hydria: { h: .6, pts: [[0, 0], [.1, 0], [.1, .025], [.08, .04], [.085, .07], [.15, .13], [.2, .23], [.22, .32], [.215, .38], [.2, .42], [.13, .47], [.08, .5], [.07, .53], [.075, .56], [.11, .585], [.115, .6], [.08, .6]] }
};

/* Figuras en silueta con trazos gruesos: guerreros, corredores, búho y ramas de olivo. */
function hoplite(g, x, ground, s, dir, fill, detail) {
  g.save(); g.translate(x, ground); g.scale(dir * s, s); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = fill; g.fillStyle = fill;
  g.lineWidth = 9; g.beginPath(); g.moveTo(-6, -70); g.lineTo(-22, -32); g.lineTo(-34, 0); g.moveTo(4, -70); g.lineTo(20, -36); g.lineTo(32, 0); g.stroke(); // piernas en lunge
  g.beginPath(); g.moveTo(-14, -72); g.lineTo(14, -72); g.lineTo(10, -128); g.lineTo(-10, -128); g.fill();                                                          // torso
  g.beginPath(); g.arc(0, -140, 13, 0, Math.PI * 2); g.fill();                                                                                                       // casco
  g.beginPath(); g.moveTo(-14, -150); g.quadraticCurveTo(-4, -182, 26, -164); g.lineTo(24, -156); g.quadraticCurveTo(0, -168, -8, -146); g.fill();               // cimera
  g.lineWidth = 3.5; g.beginPath(); g.moveTo(-40, -150); g.lineTo(70, -110); g.stroke();                                                                             // lanza
  g.beginPath(); g.arc(20, -100, 36, 0, Math.PI * 2); g.fill();                                                                                                       // escudo
  g.strokeStyle = detail; g.lineWidth = 2.2; g.beginPath(); g.arc(20, -100, 30, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(20, -100, 9, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(-6, -142); g.lineTo(8, -142); g.stroke();                                  // incisiones
  g.restore();
}
function runner(g, x, ground, s, phase, fill, detail) {
  g.save(); g.translate(x, ground); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = fill; g.fillStyle = fill;
  const a = phase;
  g.lineWidth = 8.5; g.beginPath(); g.moveTo(0, -72); g.lineTo(26 * Math.cos(a), -38); g.lineTo(30 * Math.cos(a) + 14, 0);
  g.moveTo(0, -72); g.lineTo(-24 * Math.cos(a), -40); g.lineTo(-38 * Math.cos(a) - 6, -10); g.stroke();
  g.beginPath(); g.ellipse(4, -102, 11, 32, .25, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(14, -144, 11, 0, Math.PI * 2); g.fill();
  g.lineWidth = 6.5; g.beginPath(); g.moveTo(8, -124); g.lineTo(34, -112); g.lineTo(44, -132); g.moveTo(4, -124); g.lineTo(-22, -108); g.lineTo(-38, -122); g.stroke();
  g.strokeStyle = detail; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-2, -116); g.quadraticCurveTo(8, -100, 2, -82); g.stroke();
  g.restore();
}
function owl(g, x, ground, s, fill, detail) {
  g.save(); g.translate(x, ground); g.scale(s, s); g.fillStyle = fill; g.strokeStyle = detail;
  g.beginPath(); g.ellipse(0, -55, 30, 50, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(-26, -88); g.lineTo(-30, -112); g.lineTo(-8, -96); g.lineTo(8, -96); g.lineTo(30, -112); g.lineTo(26, -88); g.fill();
  g.lineWidth = 2.2; [-1, 1].forEach(k => { g.beginPath(); g.arc(k * 12, -82, 9, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(k * 12, -82, 3, 0, Math.PI * 2); g.fillStyle = detail; g.fill(); });
  for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(0, -52 + i * 9, 16 - i * 2, .3, Math.PI - .3); g.stroke(); }
  g.restore();
}
function olive(g, x, y, len, fill) {
  g.save(); g.translate(x, y); g.strokeStyle = fill; g.fillStyle = fill; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * .4, -len * .3, len, -len * .1); g.stroke();
  for (let i = 1; i < 9; i++) { const t = i / 9, px = len * t, py = -len * .3 * 4 * t * (1 - t) * .55 - len * .1 * t; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(px, py + k * 7, 10, 3.2, k * .5, 0, Math.PI * 2); g.fill(); }); }
  g.restore();
}

function meander(g, y, h, w, color) {
  g.strokeStyle = color; g.lineWidth = Math.max(2.5, h * .1); const u = h * .9;
  for (let x = 0; x < w; x += u * 1.2) { g.beginPath(); g.moveTo(x, y + h * .9); g.lineTo(x + u, y + h * .9); g.lineTo(x + u, y + h * .12); g.lineTo(x + u * .25, y + h * .12); g.lineTo(x + u * .25, y + h * .65); g.lineTo(x + u * .7, y + h * .65); g.lineTo(x + u * .7, y + h * .4); g.stroke(); }
}
function tongues(g, y, h, w, a, b) { const step = h * .55; for (let x = 0, i = 0; x < w; x += step, i++) { g.fillStyle = i % 2 ? a : b; g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + step - 1, y); g.quadraticCurveTo(x + step, y + h, x + step / 2, y + h); g.quadraticCurveTo(x, y + h, x + 1, y); g.fill(); } }
function rays(g, y, h, w, color) { const step = h * .6; g.fillStyle = color; for (let x = 0; x < w; x += step) { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + step / 2, y); g.lineTo(x + step, y + h); g.fill(); } }
function palmettes(g, y, h, w, color) {
  g.fillStyle = color; g.strokeStyle = color; g.lineWidth = 2;
  for (let x = h * .6; x < w; x += h * 1.3) { for (let k = -3; k <= 3; k++) { g.beginPath(); g.ellipse(x + k * h * .09, y + h * .45 - Math.abs(k) * h * .04, h * .045, h * .3, k * .28, 0, Math.PI * 2); g.fill(); } g.beginPath(); g.moveTo(x - h * .5, y + h * .85); g.quadraticCurveTo(x, y + h * .55, x + h * .5, y + h * .85); g.stroke(); }
}

function paint(THREE, kind, style, seed, compact) {
  const W = compact ? 768 : 1024, H = W / 2, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const red = style === 'red', ground = red ? GLOSS : CLAY, fig = red ? CLAY : GLOSS, detail = red ? GLOSS : CLAY_LINE;
  // Coordenada vertical del lienzo: 0 arriba (boca) y H abajo (pie).
  const Y = v => H * (1 - v);
  g.fillStyle = CLAY; g.fillRect(0, 0, W, H);
  g.fillStyle = GLOSS; g.fillRect(0, Y(.06), W, H); g.fillRect(0, 0, W, Y(.95));        // pie y labio
  const zones = {
    neckAmphora: { rays: [.07, .2], meander: [.22, .27], panel: [.28, .66], tongue: [.68, .75], neck: [.79, .93], neckBlack: false },
    bellyAmphora: { rays: [.07, .18], meander: [.2, .25], panel: [.26, .72], tongue: [.74, .8], neck: [.84, .94] },
    krater: { rays: [.13, .3], meander: [.32, .38], panel: [.4, .9], tongue: [.92, .96] },
    hydria: { rays: [.07, .2], meander: [.22, .26], panel: [.27, .62], tongue: [.66, .74], neck: [.8, .93] }
  }[kind];
  if (red) { g.fillStyle = GLOSS; g.fillRect(0, Y(zones.panel[1] + .02), W, Y(zones.panel[0] - .02) - Y(zones.panel[1] + .02)); }
  rays(g, Y(zones.rays[1]), Y(zones.rays[0]) - Y(zones.rays[1]), W, GLOSS);
  const mh = Y(zones.meander[0]) - Y(zones.meander[1]);
  g.fillStyle = red ? GLOSS : CLAY; g.fillRect(0, Y(zones.meander[1]), W, mh); meander(g, Y(zones.meander[1]), mh, W, red ? CLAY : GLOSS);
  tongues(g, Y(zones.tongue[1]), Y(zones.tongue[0]) - Y(zones.tongue[1]), W, GLOSS, '#7d2a17');
  if (zones.neck) { const nh = Y(zones.neck[0]) - Y(zones.neck[1]); g.fillStyle = red ? GLOSS : CLAY; g.fillRect(0, Y(zones.neck[1]), W, nh); palmettes(g, Y(zones.neck[1]), nh, W, red ? CLAY : GLOSS); }
  // Escenas: dos paneles enfrentados (frente y dorso), separados por las asas.
  const base = Y(zones.panel[0]) - 8, top = Y(zones.panel[1]), ph = base - top, s = ph / 200;
  const scenes = {
    duel: (cx) => { hoplite(g, cx - 120 * s, base, s, 1, fig, detail); hoplite(g, cx + 120 * s, base, s, -1, fig, detail); },
    race: (cx) => { [-1, 0, 1].forEach((k, i) => runner(g, cx + k * 150 * s, base, s * .95, .9 - i * .5, fig, detail)); },
    athena: (cx) => { owl(g, cx, base, s * 1.15, fig, detail); olive(g, cx - 210 * s, base - 70 * s, 150 * s, fig); g.save(); g.translate(cx + 210 * s, base - 70 * s); g.scale(-1, 1); olive(g, 0, 0, 150 * s, fig); g.restore(); }
  };
  const order = { neckAmphora: ['duel', 'race'], bellyAmphora: ['race', 'duel'], krater: ['duel', 'athena'], hydria: ['athena', 'race'] }[kind];
  const pick = (seed % 2) ? [order[1], order[0]] : order;
  scenes[pick[0]](W * .0 + 0); scenes[pick[0]](W);                // frente (u=0, con costura repartida)
  scenes[pick[1]](W * .5);                                         // dorso
  if (!red) { g.fillStyle = '#7d2a17'; g.globalAlpha = .55; g.fillRect(0, Y(zones.panel[1] + .015), W, 6); g.globalAlpha = 1; }
  // Desgaste: el barniz negro se aclara y el barro tiene manchas de enterramiento.
  const S = 128, n = fbmField(S, { period: 4, octaves: 4, seed: 40 + seed });
  const img = g.getImageData(0, 0, W, H), d = img.data;
  const rough = document.createElement('canvas'); rough.width = W / 4; rough.height = H / 4; const gr = rough.getContext('2d'); const ri = gr.createImageData(W / 4, H / 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, nv = n[((y * S / H) | 0) * S + ((x * S / W) | 0)];
    const dark = d[i] < 80, wear = Math.max(0, nv - .62) * 2.2, throwing = Math.sin(y * .9) * 3;
    if (dark) { d[i] += 40 * wear; d[i + 1] += 28 * wear; d[i + 2] += 20 * wear; }
    else { const k = .9 + (nv - .5) * .25 + throwing * .01 - (y > H * .85 ? .12 : 0); d[i] *= k; d[i + 1] *= k; d[i + 2] *= k * .97; }
    if (!(x & 3) && !(y & 3)) { const j = ((y >> 2) * (W / 4) + (x >> 2)) * 4; const r = dark ? .3 + wear * .4 : .66 + (nv - .5) * .2; ri.data[j] = ri.data[j + 1] = ri.data[j + 2] = 255 * r; ri.data[j + 3] = 255; }
  }
  g.putImageData(img, 0, 0); gr.putImageData(ri, 0, 0);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const rmap = new THREE.CanvasTexture(rough); rmap.colorSpace = THREE.NoColorSpace;
  return new THREE.MeshStandardMaterial({ map, roughnessMap: rmap, roughness: 1, metalness: 0, envMapIntensity: .9 });
}

function vaseGeometry(THREE, kind, compact) {
  const { h, pts } = SHAPES[kind];
  // Densifica el perfil para curvas suaves y añade el grosor del labio.
  const curve = new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const prof = curve.getPoints(compact ? 48 : 96);
  const geo = new THREE.LatheGeometry(prof, compact ? 40 : 72);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setY(i, p.getY(i) / h);
  return { geo, h };
}
function handle(THREE, points, r, mat) {
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 32, r, 10, false), mat);
  m.castShadow = true; return m;
}

export function createPottery(THREE, scene, M, { compact, box, contactShadow }) {
  const pieces = [];
  function vase({ kind, style, x, z, rot = 0, seed = 1, scale = 1.25, plinth = .95 }) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
    // Peana de museo: mármol gris con moldura y tapa clara.
    const add = (w, h, y, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat); m.position.y = y; m.castShadow = m.receiveShadow = true; g.add(m); };
    add(.78, .1, .05, M.marbleGrey); add(.66, plinth - .16, (plinth - .16) / 2 + .1, M.marbleWarm); add(.74, .06, plinth - .03, M.marble);
    contactShadow(x, z, 1.5);
    const mat = paint(THREE, kind, style, seed, compact), { geo, h } = vaseGeometry(THREE, kind, compact);
    const v = new THREE.Group(); v.position.y = plinth; v.scale.setScalar(scale); g.add(v);
    const body = new THREE.Mesh(geo, mat); body.castShadow = body.receiveShadow = true; v.add(body);
    const black = new THREE.MeshStandardMaterial({ color: GLOSS, roughness: .32 });
    if (kind === 'neckAmphora') [-1, 1].forEach(s => v.add(handle(THREE, [[s * .08, .67, 0], [s * .15, .69, 0], [s * .19, .64, 0], [s * .18, .58, 0], [s * .14, .55, 0]], .016, black)));
    if (kind === 'bellyAmphora') [-1, 1].forEach(s => v.add(handle(THREE, [[s * .12, .6, 0], [s * .2, .62, 0], [s * .23, .57, 0], [s * .21, .5, 0], [s * .17, .52, 0]], .017, black)));
    if (kind === 'krater') [-1, 1].forEach(s => v.add(handle(THREE, [[s * .17, .2, -.07], [s * .26, .24, -.08], [s * .31, .3, 0], [s * .26, .24, .08], [s * .17, .2, .07]], .015, black)));
    if (kind === 'hydria') {
      [-1, 1].forEach(s => v.add(handle(THREE, [[s * .2, .33, -.06], [s * .27, .36, -.05], [s * .29, .38, 0], [s * .27, .36, .05], [s * .2, .33, .06]], .014, black)));
      v.add(handle(THREE, [[0, .44, -.17], [0, .5, -.21], [0, .57, -.19], [0, .59, -.12], [0, .585, -.1]], .016, black));
    }
    pieces.push({ group: g, x, z, r: .55 });
  }
  vase({ kind: 'hydria', style: 'black', x: -4.3, z: -3.2, rot: 1.0, seed: 2, scale: 1.3 });
  vase({ kind: 'krater', style: 'red', x: -4.25, z: -14.6, rot: 1.1, seed: 3, scale: 1.35 });
  vase({ kind: 'bellyAmphora', style: 'red', x: 4.25, z: -19.4, rot: -1.0, seed: 4 });
  vase({ kind: 'hydria', style: 'red', x: -4.25, z: -26.8, rot: 1.2, seed: 5, scale: 1.25 });
  vase({ kind: 'krater', style: 'black', x: 4.25, z: -27.2, rot: -1.1, seed: 6, scale: 1.3 });
  return { pieces };
}
