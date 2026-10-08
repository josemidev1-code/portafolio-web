/** Pinturas murales sobre fondo de oro, como los paneles de los palacios del Olimpo en God of War:
 *  una figura en silueta negra con incisiones, ramas de olivo, línea de suelo y greca. */
import { hoplite, runner, owl, meander } from './pottery.js';
import { fbmField } from './materials.js';

const INK = '#1a120c', LINE = '#c9a35e';

function goddess(g, x, ground, s, dir) {
  g.save(); g.translate(x, ground); g.scale(dir * s, s); g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-13, -118); g.lineTo(13, -118); g.quadraticCurveTo(26, -60, 32, -4); g.lineTo(-28, -4); g.quadraticCurveTo(-20, -60, -13, -118); g.fill(); // quitón largo
  g.lineWidth = 6; g.beginPath(); g.moveTo(24, -4); g.lineTo(36, 0); g.moveTo(-22, -4); g.lineTo(-10, 0); g.stroke();
  g.beginPath(); g.moveTo(-12, -118); g.lineTo(12, -118); g.lineTo(14, -152); g.lineTo(-10, -152); g.fill();                                   // torso
  g.beginPath(); g.arc(3, -165, 12, 0, Math.PI * 2); g.fill();                                                                                // cabeza
  g.beginPath(); g.moveTo(-10, -173); g.quadraticCurveTo(0, -204, 30, -188); g.lineTo(28, -180); g.quadraticCurveTo(4, -192, -4, -169); g.fill(); // cimera
  g.lineWidth = 6.5; g.beginPath(); g.moveTo(8, -148); g.lineTo(28, -130); g.lineTo(40, -146); g.stroke();                                     // brazo
  g.lineWidth = 3.5; g.beginPath(); g.moveTo(42, -222); g.lineTo(42, 0); g.stroke();                                                         // lanza
  g.beginPath(); g.moveTo(42, -236); g.lineTo(36, -218); g.lineTo(48, -218); g.closePath(); g.fill();
  g.beginPath(); g.arc(-20, -100, 36, 0, Math.PI * 2); g.fill();                                                                             // escudo
  g.strokeStyle = LINE; g.lineWidth = 2.2;
  g.beginPath(); g.arc(-20, -100, 30, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(-20, -100, 9, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-6 + i * 7, -112); g.quadraticCurveTo(-4 + i * 8, -60, -12 + i * 10, -8); g.stroke(); } // pliegues
  g.beginPath(); g.moveTo(-10, -142); g.quadraticCurveTo(2, -133, 13, -142); g.stroke();                                                    // égida
  g.restore();
}
function smith(g, x, ground, s, dir) {
  g.save(); g.translate(x, ground); g.scale(dir * s, s); g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillRect(34, -50, 58, 16); g.beginPath(); g.moveTo(44, -34); g.lineTo(82, -34); g.lineTo(74, 0); g.lineTo(52, 0); g.fill();              // yunque
  g.lineWidth = 10; g.beginPath(); g.moveTo(-4, -70); g.lineTo(-20, -36); g.lineTo(-26, 0); g.moveTo(6, -70); g.lineTo(18, -34); g.lineTo(16, 0); g.stroke();
  g.beginPath(); g.moveTo(-14, -72); g.lineTo(16, -72); g.lineTo(22, -130); g.lineTo(-8, -134); g.fill();                                     // torso inclinado
  g.beginPath(); g.arc(14, -146, 13, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(4, -140); g.quadraticCurveTo(10, -118, 24, -128); g.lineTo(26, -138); g.fill();                                     // barba
  g.lineWidth = 7; g.beginPath(); g.moveTo(-2, -126); g.lineTo(-30, -150); g.lineTo(-22, -186); g.stroke();                                   // brazo alzado
  g.lineWidth = 4; g.beginPath(); g.moveTo(-22, -186); g.lineTo(-40, -214); g.stroke(); g.fillRect(-58, -232, 34, 20);                        // martillo
  g.lineWidth = 6; g.beginPath(); g.moveTo(16, -122); g.lineTo(40, -94); g.lineTo(56, -56); g.stroke();                                      // tenazas
  g.strokeStyle = LINE; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -120); g.quadraticCurveTo(8, -100, 2, -80); g.stroke();
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(62 + i * 7, -58); g.lineTo(58 + i * 14, -78 - i * 6); g.stroke(); }                 // chispas
  g.restore();
}

/** Lienzo de un mural. `kind`: hoplita, atenea, hermes, hefesto o duelo. */
export function muralTexture(THREE, kind, seed, compact) {
  const W = compact ? 320 : 512, H = Math.round(W * 1.7), c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  // Oro envejecido: degradado cálido y manchas de pan de oro gastado.
  const grd = g.createLinearGradient(0, 0, W * .4, H); grd.addColorStop(0, '#d9ae5f'); grd.addColorStop(.55, '#c39248'); grd.addColorStop(1, '#a8783a');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  const N = 128, n = fbmField(N, { period: 4, octaves: 5, seed: 90 + seed }), img = g.getImageData(0, 0, W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = n[((y * N / H) | 0) * N + ((x * N / W) | 0)], i = (y * W + x) * 4, k = .86 + (v - .5) * .45;
    d[i] *= k; d[i + 1] *= k; d[i + 2] *= k * .92;
  }
  g.putImageData(img, 0, 0);
  const s = W / 300, ground = H - 70 * s;
  g.strokeStyle = '#5a2a18'; g.lineWidth = 4 * s; g.strokeRect(14 * s, 14 * s, W - 28 * s, H - 28 * s);
  g.lineWidth = 1.5 * s; g.strokeRect(22 * s, 22 * s, W - 44 * s, H - 44 * s);
  g.fillStyle = INK; g.fillRect(22 * s, ground, W - 44 * s, 3 * s);
  g.save(); g.beginPath(); g.rect(22 * s, ground + 10 * s, W - 44 * s, 26 * s); g.clip(); meander(g, ground + 10 * s, 26 * s, W, '#5a2a18'); g.restore();
  // La figura ocupa casi todo el alto del panel, como en los murales del juego.
  const cx = W / 2, fs = (ground - 60 * s) / 240;
  if (kind === 'atenea') { goddess(g, cx - 4 * s, ground, fs, 1); owl(g, cx + 62 * fs, ground, fs * .32, INK, LINE); }
  else if (kind === 'hermes') {
    runner(g, cx, ground, fs * 1.08, .8, INK, LINE);
    // Pétaso alado y caduceo, para que se le reconozca como Hermes.
    g.save(); g.translate(cx, ground); g.scale(fs * 1.08, fs * 1.08); g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round';
    g.beginPath(); g.ellipse(14, -153, 20, 5, -.15, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(14, -154, 10, Math.PI, 0); g.fill();
    [[2, -160], [28, -162]].forEach(([wx, wy], i) => { for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(wx + (i ? 6 : -6) + (i ? k * 4 : -k * 4), wy - 6 - k * 4, 3, 9 - k * 2, i ? .9 : -.9, 0, Math.PI * 2); g.fill(); } });
    g.lineWidth = 3; g.beginPath(); g.moveTo(44, -132); g.lineTo(44, -60); g.stroke();
    g.lineWidth = 2.4; g.beginPath(); for (let t = 0; t <= 1; t += .05) { const y = -128 + t * 50, x = 44 + Math.sin(t * Math.PI * 3) * 7; t ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.beginPath(); for (let t = 0; t <= 1; t += .05) { const y = -128 + t * 50, x = 44 - Math.sin(t * Math.PI * 3) * 7; t ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    [-1, 1].forEach(k => { g.beginPath(); g.ellipse(44 + k * 9, -138, 3, 10, k * 1.1, 0, Math.PI * 2); g.fill(); });
    g.restore();
  }
  else if (kind === 'hefesto') { smith(g, cx - 16 * fs, ground, fs * .9, 1); }
  else { hoplite(g, cx - 12 * fs * (seed % 2 ? 1 : -1), ground, fs * .95, seed % 2 ? 1 : -1, INK, LINE); }
  g.save(); g.beginPath(); g.rect(22 * s, 30 * s, W - 44 * s, 22 * s); g.clip(); meander(g, 30 * s, 22 * s, W, '#5a2a18'); g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
