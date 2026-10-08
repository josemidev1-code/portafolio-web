/** Texturas PBR fotografiadas (Poly Haven, CC0): color, normal y ARM (oclusión, rugosidad, metal).
 *  En equipos modestos se cargan a 1k; en el resto, a 2k las que tienen esa versión. */
const HAS_2K = new Set(['marmol-suelo', 'estuco', 'sillar']);

export function createTextureSet(THREE, renderer, { compact }) {
  const loader = new THREE.TextureLoader(), cache = new Map();
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  function tex(name, map, srgb) {
    const res = !compact && HAS_2K.has(name) ? '2k' : '1k', key = `${name}-${map}-${res}`;
    if (cache.has(key)) return cache.get(key);
    const t = loader.load(`assets/texturas/${key}.jpg`);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso;
    cache.set(key, t); return t;
  }
  /** Material con los tres mapas; `repeat` se aplica sobre UV en metros (worldUV). */
  return function pbr(name, { color = '#ffffff', roughness = 1, normalScale = 1, repeat = 1, ao = 1, envMapIntensity = 1 } = {}) {
    const clone = t => { const c = t.clone(); c.repeat.set(repeat, repeat); c.needsUpdate = true; return c; };
    const arm = clone(tex(name, 'arm', false));
    return new THREE.MeshStandardMaterial({
      color, map: clone(tex(name, 'color', true)), normalMap: clone(tex(name, 'normal', false)), normalScale: new THREE.Vector2(normalScale, normalScale),
      roughnessMap: arm, roughness, aoMap: arm, aoMapIntensity: ao, metalness: 0, envMapIntensity
    });
  };
}
