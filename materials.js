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

// Cada textura se inicia con el tono medio de la piedra, visible también si falla la descarga.
// En las texturas de superficie R contiene la altura, G la rugosidad y B la metalicidad.
export function createMaterials(THREE, { compact = false } = {}) {
  const folder = compact ? 'ligera' : 'detallada';
  const directory = new URL(`./assets/materiales/${folder}/`, import.meta.url);
  const loader = new THREE.ImageLoader();
  const pending = new Map();
  const textures = new Map();

  function texture(file, mean, colorSpace) {
    if (textures.has(file)) return textures.get(file);
    const pixel = document.createElement('canvas');
    pixel.width = pixel.height = 1;
    const ctx = pixel.getContext('2d');
    ctx.fillStyle = mean;
    ctx.fillRect(0, 0, 1, 1);

    const tex = new THREE.CanvasTexture(pixel);
    tex.colorSpace = colorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = compact ? 2 : 4;
    textures.set(file, tex);

    const copies = new Set([tex]);
    pending.set(tex.source, copies);
    loader.load(new URL(file + '.webp', directory).href, image => {
      // Las distintas escalas UV comparten Source y una sola imagen decodificada.
      tex.image = image;
      for (const copy of copies) copy.needsUpdate = true;
      pending.delete(tex.source);
    }, undefined, () => pending.delete(tex.source));
    return tex;
  }

  function surface(name, mean, roughness, { bump = 0, metalness = 0, detailRoughness = 1, ...settings } = {}) {
    const params = {
      ...settings, roughness, metalness,
      map: texture(name, mean, THREE.SRGBColorSpace)
    };
    if (!compact) {
      const average = `rgb(128, ${Math.round(255 * roughness / detailRoughness)}, ${Math.round(255 * metalness)})`;
      const detail = texture(name + '-superficie', average, THREE.NoColorSpace);
      params.roughness = detailRoughness;
      params.roughnessMap = detail;
      if (bump) { params.bumpMap = detail; params.bumpScale = bump; }
      if (metalness) { params.metalnessMap = detail; params.metalness = 1; }
    }
    return new THREE.MeshStandardMaterial(params);
  }

  const M = {
    marble: surface('marble', '#d3ccbe', .33, { bump: .35 }),
    marbleWarm: surface('marbleWarm', '#c9bba4', .33, { color: '#f2ebe0', bump: .35 }),
    marbleGrey: surface('marbleGrey', '#87837e', .34, { bump: .35 }),
    darkStone: surface('darkStone', '#948a7b', .74, { color: '#a39888', bump: 1 }),
    wall: surface('wall', '#cabda7', .74, { bump: 1.4 }),
    floor: surface('floor', '#c6bba8', .27, { bump: .8, envMapIntensity: 1.2 }),
    bronze: surface('bronze', '#9d7346', .48, { metalness: .86, envMapIntensity: 1.4 }),
    gilt: new THREE.MeshStandardMaterial({ color: '#c89a52', metalness: 1, roughness: .32, envMapIntensity: 1.3 }),
    darkGilt: new THREE.MeshStandardMaterial({ color: '#8f6c3e', metalness: 1, roughness: .42, envMapIntensity: 1.2 }),
    coffer: new THREE.MeshStandardMaterial({ color: '#203b5e', roughness: .8 }),
    redMarble: surface('redMarble', '#8c291c', .29, { detailRoughness: .9, bump: .15 }),
    paleWall: surface('paleWall', '#bcbac1', .53, { detailRoughness: 1.7, bump: .25 }),
    dado: surface('dado', '#48464d', .26, { detailRoughness: .8, bump: .1 }),
    polished: surface('polished', '#3c281c', .17, { envMapIntensity: 1.6 })
  };

  function copyTexture(tex) {
    const copy = tex.clone();
    pending.get(tex.source)?.add(copy);
    return copy;
  }

  function withUV(mat, configure) {
    const result = mat.clone();
    const copies = new Map();
    for (const key of ['map', 'roughnessMap', 'bumpMap', 'metalnessMap']) {
      const tex = mat[key];
      if (!tex) continue;
      if (!copies.has(tex)) {
        const copy = copyTexture(tex);
        configure(copy);
        copies.set(tex, copy);
      }
      result[key] = copies.get(tex);
    }
    return result;
  }

  const repeats = new Map();
  M.withRepeat = (mat, rx, ry) => {
    const key = `${mat.uuid}/${rx}/${ry}`;
    if (!repeats.has(key)) repeats.set(key, withUV(mat, t => t.repeat.set(rx, ry)));
    return repeats.get(key);
  };

  let cleanBronze;
  M.bronzeVariant = (seed, color, patina = .56) => {
    if (patina >= 1 && !cleanBronze) {
      cleanBronze = surface('bronceLimpio', '#a56e3e', .42, { metalness: .95, envMapIntensity: 1.4 });
    }
    const random = rng(seed);
    const x = random(), y = random();
    const variant = withUV(patina >= 1 ? cleanBronze : M.bronze, t => t.offset.set(x, y));
    variant.color.set(color);
    return variant;
  };
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
