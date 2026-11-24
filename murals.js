/** Los paneles conservan la pintura de figuras negras y el fondo de oro del museo. */
const textures = new Map();

export function muralTexture(THREE, kind, seed, compact) {
  const warrior = kind === 'hoplita' || kind === 'duelo';
  const panel = warrior ? (seed % 2 ? 'hoplita' : 'hoplita-izquierda') : kind;
  const path = `./assets/murales/${panel}${compact ? '-compacto' : ''}.webp`;
  if (!textures.has(path)) {
    const map = new THREE.TextureLoader().load(new URL(path, import.meta.url).href);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = compact ? 2 : 4;
    textures.set(path, map);
  }
  return textures.get(path);
}
