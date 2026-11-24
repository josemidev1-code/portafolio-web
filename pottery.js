/** Las pinturas áticas están horneadas a partir de las figuras, grecas y
 *  esmaltes originales. Las seis vasijas comparten cuatro perfiles de revolución. */
/* Perfiles (radio, altura) en metros. */
const SHAPES = {
  neckAmphora: { h: .74, pts: [[0, 0], [.1, 0], [.1, .025], [.075, .04], [.07, .07], [.12, .1], [.19, .2], [.225, .32], [.23, .4], [.205, .5], [.15, .56], [.09, .59], [.075, .63], [.074, .69], [.09, .71], [.1, .725], [.095, .74], [.07, .74]] },
  bellyAmphora: { h: .66, pts: [[0, 0], [.11, 0], [.11, .02], [.085, .035], [.09, .06], [.16, .12], [.215, .24], [.235, .34], [.225, .44], [.18, .52], [.125, .565], [.115, .6], [.13, .64], [.135, .66], [.11, .66]] },
  krater: { h: .56, pts: [[0, 0], [.14, 0], [.14, .03], [.1, .045], [.065, .07], [.06, .12], [.1, .15], [.17, .2], [.2, .25], [.22, .32], [.25, .42], [.28, .52], [.3, .55], [.305, .56], [.28, .56]] },
  hydria: { h: .6, pts: [[0, 0], [.1, 0], [.1, .025], [.08, .04], [.085, .07], [.15, .13], [.2, .23], [.22, .32], [.215, .38], [.2, .42], [.13, .47], [.08, .5], [.07, .53], [.075, .56], [.11, .585], [.115, .6], [.08, .6]] }
};

function vaseGeometry(THREE, kind, compact) {
  const { h, pts } = SHAPES[kind];
  // Densifica el perfil para curvas suaves y añade el grosor del labio.
  const curve = new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const prof = curve.getPoints(compact ? 32 : 56);
  const geo = new THREE.LatheGeometry(prof, compact ? 24 : 48);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setY(i, p.getY(i) / h);
  return geo;
}
function handle(THREE, points, r, mat, compact) {
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), compact ? 12 : 24, r, compact ? 5 : 8, false), mat);
  m.castShadow = true; return m;
}

export function createPottery(THREE, scene, M, { compact, contactShadow }) {
  const pieces = [];
  const geometries = new Map();
  const loader = new THREE.TextureLoader();
  const black = new THREE.MeshStandardMaterial({ color: '#17110e', roughness: .32 });
  function vase({ kind, style, x, z, rot = 0, scale = 1.25, plinth = .95 }) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
    // Peana de museo: mármol gris con moldura y tapa clara.
    const add = (w, h, y, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat); m.position.y = y; m.castShadow = m.receiveShadow = true; g.add(m); };
    add(.78, .1, .05, M.marbleGrey); add(.66, plinth - .16, (plinth - .16) / 2 + .1, M.marbleWarm); add(.74, .06, plinth - .03, M.marble);
    contactShadow(x, z, 1.5);
    const prefix = `./assets/ceramica/${kind}-${style}`;
    const map = loader.load(new URL(`${prefix}${compact ? '-compacta' : ''}.webp`, import.meta.url).href);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = compact ? 2 : 4;
    const roughnessMap = compact ? null : loader.load(new URL(`${prefix}-rugosidad.webp`, import.meta.url).href);
    const mat = new THREE.MeshStandardMaterial({
      map, roughnessMap, roughness: compact ? .57 : 1, envMapIntensity: .9
    });
    if (!geometries.has(kind)) geometries.set(kind, vaseGeometry(THREE, kind, compact));
    const geo = geometries.get(kind);
    const v = new THREE.Group(); v.position.y = plinth; v.scale.setScalar(scale); g.add(v);
    const body = new THREE.Mesh(geo, mat); body.castShadow = body.receiveShadow = true; v.add(body);
    if (kind === 'neckAmphora') [-1, 1].forEach(s => v.add(handle(THREE, [[s * .08, .67, 0], [s * .15, .69, 0], [s * .19, .64, 0], [s * .18, .58, 0], [s * .14, .55, 0]], .016, black, compact)));
    if (kind === 'bellyAmphora') [-1, 1].forEach(s => v.add(handle(THREE, [[s * .12, .6, 0], [s * .2, .62, 0], [s * .23, .57, 0], [s * .21, .5, 0], [s * .17, .52, 0]], .017, black, compact)));
    if (kind === 'krater') [-1, 1].forEach(s => v.add(handle(THREE, [[s * .17, .2, -.07], [s * .26, .24, -.08], [s * .31, .3, 0], [s * .26, .24, .08], [s * .17, .2, .07]], .015, black, compact)));
    if (kind === 'hydria') {
      [-1, 1].forEach(s => v.add(handle(THREE, [[s * .2, .33, -.06], [s * .27, .36, -.05], [s * .29, .38, 0], [s * .27, .36, .05], [s * .2, .33, .06]], .014, black, compact)));
      v.add(handle(THREE, [[0, .44, -.17], [0, .5, -.21], [0, .57, -.19], [0, .59, -.12], [0, .585, -.1]], .016, black, compact));
    }
    pieces.push({ group: g, x, z, r: .55 });
  }
  vase({ kind: 'hydria', style: 'black', x: -4.3, z: -3.2, rot: 1.0, scale: 1.3 });
  vase({ kind: 'neckAmphora', style: 'black', x: 4.25, z: -2.3, rot: -1.1, scale: 1.3 });
  // Las piezas de las salas II y III quedan fuera del barrido de las puertas (1,5 m tras cada portada).
  vase({ kind: 'krater', style: 'red', x: -4.25, z: -15.9, rot: 1.1, scale: 1.35 });
  vase({ kind: 'bellyAmphora', style: 'red', x: 4.25, z: -19.4, rot: -1.0 });
  vase({ kind: 'hydria', style: 'red', x: -4.25, z: -27.9, rot: 1.2, scale: 1.25 });
  vase({ kind: 'krater', style: 'black', x: 4.25, z: -28.3, rot: -1.1, scale: 1.3 });
  return { pieces };
}
