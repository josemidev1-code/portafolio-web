/** Materiales generados en la página: mármol veteado, sillería, losas, bronce patinado.
 *  Todo se pinta en canvas con ruido periódico, así las texturas repiten sin costuras
 *  y no hace falta descargar imágenes. */

// Ruido de valor periódico (se repite cada `period` celdas) con interpolación suave.
function lattice(period, seed) {
  const v = new Float32Array(period * period);
  let s = seed * 9301 + 49297;
  for (let i = 0; i < v.length; i++) { s = (s * 16807) % 2147483647; v[i] = s / 2147483647; }
  return v;
}
export function fbmField(size, { period = 4, octaves = 5, seed = 1, gain = .5 } = {}) {
  const out = new Float32Array(size * size);
  let amp = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    const p = period << o, grid = lattice(p, seed + o * 31), scale = p / size;
    // Índices y pesos por columna calculados una sola vez por octava.
    const C0 = new Int32Array(size), C1 = new Int32Array(size), SX = new Float32Array(size);
    for (let x = 0; x < size; x++) { const fx = x * scale, x0 = Math.floor(fx), tx = fx - x0; C0[x] = x0 % p; C1[x] = (x0 + 1) % p; SX[x] = tx * tx * (3 - 2 * tx); }
    for (let y = 0; y < size; y++) {
      const fy = y * scale, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty);
      const r0 = (y0 % p) * p, r1 = ((y0 + 1) % p) * p, row = y * size;
      for (let x = 0; x < size; x++) {
        const c0 = C0[x], c1 = C1[x], sx = SX[x];
        const g00 = grid[r0 + c0], g10 = grid[r1 + c0];
        const a = g00 + (grid[r0 + c1] - g00) * sx, b = g10 + (grid[r1 + c1] - g10) * sx;
        out[row + x] += (a + (b - a) * sy) * amp;
      }
    }
    norm += amp; amp *= gain;
  }
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}
export function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

function canvas(size, h = size) { const c = document.createElement('canvas'); c.width = size; c.height = h; return c; }
function texture(THREE, c, { srgb = true, repeat, anisotropy = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = anisotropy;
  if (repeat) t.repeat.set(...repeat);
  return t;
}
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

/** Campo de mármol: fondo lechoso con vetas finas y turbulentas. */
function marbleField(size, seed, { veins = 3.2, turbulence = 2.6, sharp = 9 } = {}) {
  const n = fbmField(size, { period: 3, octaves: 5, seed });
  const m = fbmField(size, { period: 2, octaves: 4, seed: seed + 7 });
  const vein = new Float32Array(size * size), cloud = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, u = x / size, v = y / size;
    // Dos familias de vetas cruzadas; el seno de la turbulencia da el trazo de cantera.
    const a = Math.abs(Math.sin((u * .8 + v * .45) * Math.PI * 2 * veins / 2 + n[i] * turbulence * 6));
    const b = Math.abs(Math.sin((u * -.35 + v) * Math.PI * 2 * veins + m[i] * turbulence * 5));
    vein[i] = Math.pow(1 - a, sharp) * .9 + Math.pow(1 - b, sharp * 2.2) * .55;
    cloud[i] = n[i];
  }
  return { vein, cloud };
}

export function createMaterials(THREE, { compact = false } = {}) {
  const S = compact ? 512 : 768, S0 = S;
  const cache = {};

  /* Mármol pentélico: blanco cálido, vetas grises y alguna oxidación dorada. */
  function marbleSet(seed, tint, veinColor, { veins, sharp, size } = {}) {
    const S = size || S0;
    const { vein, cloud } = marbleField(S, seed, { veins, sharp });
    const grain = fbmField(S, { period: 32, octaves: 2, seed: seed + 3 });
    const col = canvas(S), rough = canvas(S), bump = canvas(S);
    const ci = col.getContext('2d').createImageData(S, S), ri = rough.getContext('2d').createImageData(S, S), bi = bump.getContext('2d').createImageData(S, S);
    for (let i = 0; i < S * S; i++) {
      const c = cloud[i], v = clamp01(vein[i]), g = grain[i];
      const shade = .9 + (c - .5) * .14 + (g - .5) * .015;
      for (let k = 0; k < 3; k++) ci.data[i * 4 + k] = 255 * clamp01(tint[k] * shade * (1 - v * .55) + veinColor[k] * v * .55);
      ci.data[i * 4 + 3] = 255;
      // Las vetas y las zonas gastadas son algo más ásperas que el pulido.
      const r = clamp01(.3 + v * .14 + (g - .5) * .1 + (c - .5) * .12);
      ri.data[i * 4] = ri.data[i * 4 + 1] = ri.data[i * 4 + 2] = r * 255; ri.data[i * 4 + 3] = 255;
      const h = clamp01(.5 + (g - .5) * .25 + (c - .5) * .3 - v * .2);
      bi.data[i * 4] = bi.data[i * 4 + 1] = bi.data[i * 4 + 2] = h * 255; bi.data[i * 4 + 3] = 255;
    }
    col.getContext('2d').putImageData(ci, 0, 0); rough.getContext('2d').putImageData(ri, 0, 0); bump.getContext('2d').putImageData(bi, 0, 0);
    return { col, rough, bump };
  }
  const marbleTex = marbleSet(11, [.93, .9, .84], [.42, .4, .38], { veins: 2.4, sharp: 14 });
  const warmTex = marbleSet(23, [.88, .82, .72], [.55, .45, .35], { veins: 1.4, sharp: 16 });
  const greyTex = marbleSet(37, [.6, .58, .56], [.28, .27, .26], { veins: 3.4, sharp: 7 });

  function marbleMaterial(set, { repeat = [1, 1], color = '#ffffff', roughness = 1, bumpScale = .35 } = {}) {
    return new THREE.MeshStandardMaterial({
      color, map: texture(THREE, set.col, { repeat }), roughness, roughnessMap: texture(THREE, set.rough, { srgb: false, repeat }),
      bumpMap: texture(THREE, set.bump, { srgb: false, repeat }), bumpScale
    });
  }

  /* Sillería: hiladas isódomas de piedra caliza, cada sillar con su tono y juntas hundidas. */
  function ashlar({ seed = 5, courses = 4, perCourse = 2, base = [.78, .72, .62], spread = .07, w = S, h = S / 2 }) {
    const col = canvas(w, h), bump = canvas(w, h), rough = canvas(w, h);
    const field = fbmField(w, { period: 4, octaves: 6, seed });
    const pits = fbmField(w, { period: 48, octaves: 2, seed: seed + 1 });
    const g = col.getContext('2d'), gb = bump.getContext('2d'), gr = rough.getContext('2d');
    const ci = g.createImageData(w, h), bi = gb.createImageData(w, h), ri = gr.createImageData(w, h);
    const ch = h / courses, random = rng(seed * 101 + 7), tones = [];
    for (let c = 0; c < courses; c++) { tones.push([]); for (let k = 0; k <= perCourse; k++) tones[c].push((random() - .5) * 2 * spread); }
    const joint = Math.max(1.5, w / 600);
    for (let y = 0; y < h; y++) {
      const c = Math.floor(y / ch), yy = y - c * ch, offset = (c % 2) * (w / perCourse / 2);
      for (let x = 0; x < w; x++) {
        const bw = w / perCourse, xs = (x + offset) % w, k = Math.floor(xs / bw), xx = xs - k * bw;
        const i = y * w + x, f = field[(y % w) * w + x], p = pits[(y % w) * w + x];
        const edge = Math.min(xx, bw - xx, yy, ch - yy);
        const inJoint = edge < joint, bevel = clamp01(edge / (joint * 4));
        const t = tones[c][k] + (f - .5) * .18 + (p > .8 ? -.06 : 0);
        for (let q = 0; q < 3; q++) ci.data[i * 4 + q] = 255 * clamp01(inJoint ? base[q] * .6 : base[q] * (1 + t) * (.93 + .07 * bevel));
        ci.data[i * 4 + 3] = 255;
        const height = inJoint ? 0 : .35 + .45 * bevel + (f - .5) * .25 - (p > .78 ? .15 : 0);
        bi.data[i * 4] = bi.data[i * 4 + 1] = bi.data[i * 4 + 2] = 255 * clamp01(height); bi.data[i * 4 + 3] = 255;
        const r = inJoint ? .95 : .72 + (f - .5) * .2;
        ri.data[i * 4] = ri.data[i * 4 + 1] = ri.data[i * 4 + 2] = 255 * clamp01(r); ri.data[i * 4 + 3] = 255;
      }
    }
    g.putImageData(ci, 0, 0); gb.putImageData(bi, 0, 0); gr.putImageData(ri, 0, 0);
    return { col, bump, rough };
  }

  /* Losas de pavimento: mármol blanco y gris alternado; cada losa toma otra zona del bloque. */
  function floorSlabs() {
    const n = 4, size = S, cell = size / n;
    const col = canvas(size), rough = canvas(size), bump = canvas(size);
    const g = col.getContext('2d'), gr = rough.getContext('2d'), gb = bump.getContext('2d');
    const random = rng(913);
    gb.fillStyle = '#000'; gb.fillRect(0, 0, size, size);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const src = random() > .45 ? marbleTex : warmTex;
      const sx = random() * (S - cell), sy = random() * (S - cell);
      g.save(); g.translate(x * cell + cell / 2, y * cell + cell / 2); g.rotate(Math.floor(random() * 4) * Math.PI / 2);
      g.drawImage(src.col, sx, sy, cell, cell, -cell / 2, -cell / 2, cell, cell);
      gr.drawImage(src.rough, sx, sy, cell, cell, -cell / 2, -cell / 2, cell, cell); g.restore();
      // Desgaste del paso: un velo de polvo en el centro de cada losa.
      const wear = g.createRadialGradient(x * cell + cell / 2, y * cell + cell / 2, 0, x * cell + cell / 2, y * cell + cell / 2, cell * .7);
      wear.addColorStop(0, 'rgba(120,104,84,.0)'); wear.addColorStop(1, `rgba(70,60,48,${.04 + random() * .08})`);
      g.fillStyle = wear; g.fillRect(x * cell, y * cell, cell, cell);
      gb.fillStyle = '#c8c8c8'; gb.fillRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4);
    }
    g.strokeStyle = 'rgba(52,44,36,.7)'; g.lineWidth = 2.5; gr.strokeStyle = '#fff'; gr.lineWidth = 3;
    for (let k = 0; k <= n; k++) { [g, gr].forEach(c => { c.beginPath(); c.moveTo(k * cell, 0); c.lineTo(k * cell, size); c.moveTo(0, k * cell); c.lineTo(size, k * cell); c.stroke(); }); }
    // El suelo pulido refleja más que los muros, pero no es un espejo.
    gr.globalCompositeOperation = 'multiply'; gr.fillStyle = '#9a9a9a'; gr.fillRect(0, 0, size, size);
    return { col, rough, bump };
  }

  /* Bronce antiguo: cobre oscurecido, pátina verde en huecos y brillo en relieves. */
  function bronzeSet(seed, patina = .56) {
    const s = compact ? 256 : 512;
    const f = fbmField(s, { period: 4, octaves: 6, seed }), spots = fbmField(s, { period: 8, octaves: 4, seed: seed + 5 });
    const col = canvas(s), orm = canvas(s);
    const ci = col.getContext('2d').createImageData(s, s), oi = orm.getContext('2d').createImageData(s, s);
    for (let i = 0; i < s * s; i++) {
      const v = f[i], p = clamp01((spots[i] - patina) * 5);
      const bronze = [.55 + v * .2, .36 + v * .14, .2 + v * .08], verdigris = [.32, .5, .42];
      for (let k = 0; k < 3; k++) ci.data[i * 4 + k] = 255 * clamp01(bronze[k] * (1 - p) + verdigris[k] * p);
      ci.data[i * 4 + 3] = 255;
      oi.data[i * 4] = 255; oi.data[i * 4 + 1] = 255 * clamp01(.3 + (1 - v) * .25 + p * .45); oi.data[i * 4 + 2] = 255 * clamp01(.95 - p * .85); oi.data[i * 4 + 3] = 255;
    }
    col.getContext('2d').putImageData(ci, 0, 0); orm.getContext('2d').putImageData(oi, 0, 0);
    return { col, orm };
  }
  function bronzeMaterial(seed, repeat = [1, 1], color = '#ffffff', patina) {
    const b = bronzeSet(seed, patina), orm = texture(THREE, b.orm, { srgb: false, repeat });
    return new THREE.MeshStandardMaterial({ color, map: texture(THREE, b.col, { repeat }), roughnessMap: orm, metalnessMap: orm, metalness: 1, roughness: 1, envMapIntensity: 1.4 });
  }

  /* Interior del templo, a la manera de los palacios del Olimpo de God of War:
     mármol rojo en los fustes, piedra clara en los muros, zócalo oscuro y suelo pulido. */
  const half = compact ? 256 : 512;
  const redTex = marbleSet(51, [.6, .16, .11], [.86, .55, .42], { veins: 1.8, sharp: 11, size: half });
  const paleTex = marbleSet(61, [.82, .81, .84], [.6, .58, .64], { veins: 1.1, sharp: 20, size: half });
  const dadoTex = marbleSet(71, [.3, .29, .32], [.62, .6, .62], { veins: 2.2, sharp: 12, size: half });
  const polishA = marbleSet(81, [.3, .2, .14], [.5, .4, .3], { veins: 1.4, sharp: 22 });
  const polishB = marbleSet(83, [.22, .14, .1], [.44, .34, .25], { veins: 2, sharp: 24 });
  /* Losas pulidas de mármol oscuro: grandes, alternadas en dos tonos y con juntas finas. */
  function polishedSlabs() {
    const n = 2, size = S, cell = size / n;
    const col = canvas(size), rough = canvas(size);
    const g = col.getContext('2d'), gr = rough.getContext('2d'), random = rng(517);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const src = (x + y) % 2 ? polishB : polishA, sx = random() * (S - cell), sy = random() * (S - cell);
      g.save(); g.translate(x * cell + cell / 2, y * cell + cell / 2); g.rotate(Math.floor(random() * 4) * Math.PI / 2);
      g.drawImage(src.col, sx, sy, cell, cell, -cell / 2, -cell / 2, cell, cell);
      gr.drawImage(src.rough, sx, sy, cell, cell, -cell / 2, -cell / 2, cell, cell); g.restore();
    }
    g.strokeStyle = 'rgba(16,10,6,.85)'; g.lineWidth = 2; gr.strokeStyle = '#999'; gr.lineWidth = 2;
    for (let k = 0; k <= n; k++) [g, gr].forEach(c => { c.beginPath(); c.moveTo(k * cell, 0); c.lineTo(k * cell, size); c.moveTo(0, k * cell); c.lineTo(size, k * cell); c.stroke(); });
    // Pulido de espejo: la rugosidad baja a la mitad.
    gr.globalCompositeOperation = 'multiply'; gr.fillStyle = '#6a6a6a'; gr.fillRect(0, 0, size, size);
    return { col, rough };
  }
  const polished = polishedSlabs();

  const wall = ashlar({ seed: 5, courses: 3, perCourse: 2, base: [.8, .75, .66], spread: .05 });
  const orthostat = ashlar({ seed: 9, courses: 1, perCourse: 2, base: [.6, .56, .5], spread: .05 });
  const floor = floorSlabs();

  const M = {
    marble: marbleMaterial(marbleTex, { repeat: [1, 1] }),
    marbleWarm: marbleMaterial(warmTex, { repeat: [1, 1], color: '#f2ebe0' }),
    marbleGrey: marbleMaterial(greyTex, { repeat: [1, 1] }),
    darkStone: new THREE.MeshStandardMaterial({ color: '#a39888', map: texture(THREE, orthostat.col), roughnessMap: texture(THREE, orthostat.rough, { srgb: false }), bumpMap: texture(THREE, orthostat.bump, { srgb: false }), bumpScale: 1, roughness: 1 }),
    wall: new THREE.MeshStandardMaterial({ map: texture(THREE, wall.col), roughness: 1, roughnessMap: texture(THREE, wall.rough, { srgb: false }), bumpMap: texture(THREE, wall.bump, { srgb: false }), bumpScale: 1.4 }),
    floor: new THREE.MeshStandardMaterial({ map: texture(THREE, floor.col), roughness: 1, roughnessMap: texture(THREE, floor.rough, { srgb: false }), bumpMap: texture(THREE, floor.bump, { srgb: false }), bumpScale: .8, envMapIntensity: 1.2 }),
    bronze: bronzeMaterial(3),
    gilt: new THREE.MeshStandardMaterial({ color: '#c89a52', metalness: 1, roughness: .32, envMapIntensity: 1.3 }),
    // Pigmento del techo: azul egipcio, como los restos de policromía de los templos.
    coffer: new THREE.MeshStandardMaterial({ color: '#203b5e', roughness: .8 }),
    redMarble: marbleMaterial(redTex, { repeat: [1, 1], roughness: .9, bumpScale: .15 }),
    paleWall: marbleMaterial(paleTex, { repeat: [1, 1], roughness: 1.7, bumpScale: .25 }),
    dado: marbleMaterial(dadoTex, { repeat: [1, 1], roughness: .8, bumpScale: .1 }),
    polished: new THREE.MeshStandardMaterial({ map: texture(THREE, polished.col), roughness: 1, roughnessMap: texture(THREE, polished.rough, { srgb: false }), envMapIntensity: 1.6 }),
  };
  // Ajustes de escala de textura por superficie; se clonan para no compartir `repeat`.
  M.withRepeat = (mat, rx, ry) => {
    const key = mat.uuid + rx + '/' + ry; if (cache[key]) return cache[key];
    const m = mat.clone();
    ['map', 'roughnessMap', 'bumpMap', 'metalnessMap'].forEach(k => { if (m[k]) { m[k] = m[k].clone(); m[k].repeat.set(rx, ry); m[k].needsUpdate = true; } });
    if (m.metalnessMap && mat.roughnessMap === mat.metalnessMap) m.metalnessMap = m.roughnessMap;
    return (cache[key] = m);
  };
  M.bronzeVariant = (seed, color, patina) => bronzeMaterial(seed, [1, 1], color, patina);
  M.darkGilt = new THREE.MeshStandardMaterial({ color: '#8f6c3e', metalness: 1, roughness: .42, envMapIntensity: 1.2 });
  return M;
}

/** Proyección triplanar en UV: para piezas sueltas (cajas, cilindros) la textura se escala con el tamaño real. */
export function worldUV(geometry, scale = .5) {
  const [su, sv] = Array.isArray(scale) ? scale : [scale, scale];
  const p = geometry.attributes.position, n = geometry.attributes.normal, uv = geometry.attributes.uv;
  if (!uv || !n) return geometry;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (ay >= ax && ay >= az) uv.setXY(i, x * su, z * su);
    else if (ax >= az) uv.setXY(i, z * su, y * sv);
    else uv.setXY(i, x * su, y * sv);
  }
  uv.needsUpdate = true; return geometry;
}
