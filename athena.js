/** Atenea de la Sala I: escaneo 3D de una estatua clásica de mármol (Three D Scans,
 *  sin restricciones de copyright; versión optimizada de keijiro/ThreeDScans).
 *  Siguiendo la referencia del retrato se añade una corona de olivo de bronce dorado
 *  sobre el casco —como en las tetradracmas atenienses— y un broche en el hombro. */
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js';

export const ATHENA = { x: -2.8, z: -7.9, rot: .48, height: 2.75, plinth: 1.2 };

export function createAthena(THREE, scene, M, { compact, renderer, contactShadow }) {
  const root = new THREE.Group(); root.position.set(ATHENA.x, 0, ATHENA.z); root.rotation.y = ATHENA.rot; scene.add(root);

  /* Pedestal: zócalo, dado de mármol gris con inscripción y cornisa. */
  const add = (w, h, d, y, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.y = y; m.castShadow = m.receiveShadow = true; root.add(m); return m; };
  add(1.62, .16, 1.42, .08, M.marbleGrey); add(1.5, .1, 1.3, .21, M.marble); add(1.3, .7, 1.1, .61, M.marbleGrey);
  add(1.42, .08, 1.22, 1.0, M.marble); add(1.5, .14, 1.3, 1.11, M.marble);
  contactShadow(ATHENA.x, ATHENA.z, 2.6);
  const label = document.createElement('canvas'); label.width = 1024; label.height = 256;
  const lg = label.getContext('2d');
  const drawLabel = () => {
    lg.clearRect(0, 0, 1024, 256); lg.textAlign = 'center';
    lg.font = '600 92px "Cinzel", Georgia, serif'; if (lg.letterSpacing !== undefined) lg.letterSpacing = '22px';
    lg.fillStyle = 'rgba(255,236,206,.5)'; lg.fillText('ΑΘΗΝΑ', 512, 124); lg.fillStyle = 'rgba(30,24,18,.9)'; lg.fillText('ΑΘΗΝΑ', 512, 120);
    lg.font = 'italic 40px "Cormorant Garamond", Georgia, serif'; if (lg.letterSpacing !== undefined) lg.letterSpacing = '4px';
    lg.fillStyle = 'rgba(40,32,24,.85)'; lg.fillText('Sabiduría, técnica y estrategia', 512, 196);
  };
  drawLabel();
  const labelTex = new THREE.CanvasTexture(label); labelTex.colorSpace = THREE.SRGBColorSpace; labelTex.anisotropy = 8;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .275), new THREE.MeshStandardMaterial({ map: labelTex, transparent: true, roughness: .9, depthWrite: false }));
  plate.position.set(0, .62, .552); root.add(plate);

  /* Luz propia: foco cálido alto desde la derecha, con sombra en ordenador. */
  const key = new THREE.SpotLight('#ffe2bd', compact ? 90 : 115, 14, Math.PI / 9, .55, 1.6);
  key.position.set(ATHENA.x + 3.9, 7.4, ATHENA.z + 2.2); key.target.position.set(ATHENA.x, 2.6, ATHENA.z);
  key.castShadow = !compact; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -.0002; key.shadow.normalBias = .02; key.shadow.radius = 2;
  key.shadow.camera.near = 2; key.shadow.camera.far = 14;
  scene.add(key, key.target);
  const rim = new THREE.SpotLight('#9fb6d0', compact ? 22 : 38, 10, Math.PI / 7, .7, 1.6);
  rim.position.set(ATHENA.x - 2.2, 6.2, ATHENA.z - 2.8); rim.target.position.set(ATHENA.x, 2.8, ATHENA.z); scene.add(rim, rim.target);

  const loader = new THREE.TextureLoader(), suffix = compact ? '-1k' : '';
  const load = (url, srgb) => { const t = loader.load(url); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
  const material = new THREE.MeshStandardMaterial({
    map: load(`assets/athena/athena-albedo${suffix}.jpg`, true), normalMap: load(`assets/athena/athena-normal${suffix}.jpg`, false),
    aoMap: load('assets/athena/athena-ao.jpg', false), roughnessMap: load('assets/athena/athena-roughness.jpg', false),
    roughness: 1, aoMapIntensity: .9, envMapIntensity: .8
  });

  const ready = new Promise(resolve => {
    new GLTFLoader().load('assets/athena/athena.glb', gltf => {
      let mesh; gltf.scene.traverse(o => { if (o.isMesh) mesh = o; });
      mesh.material = material; mesh.castShadow = mesh.receiveShadow = true;
      const statue = new THREE.Group(); statue.position.y = 1.18; statue.scale.setScalar(ATHENA.height); statue.add(mesh); root.add(statue);
      addWreath(mesh.geometry, statue); addBrooch(mesh, statue);
      resolve(statue);
    }, undefined, () => resolve(null));
  });

  /* Corona de olivo: las hojas siguen el borde real del casco, medido en la malla. */
  function addWreath(geo, statue) {
    const p = geo.attributes.position, bins = 28, radius = new Array(bins).fill(0);
    let cx = 0, cz = 0, n = 0;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > .915 && y < .935) { cx += p.getX(i); cz += p.getZ(i); n++; } }
    if (!n) return; cx /= n; cz /= n;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i); if (y < .912 || y > .938) continue;
      const a = Math.atan2(p.getZ(i) - cz, p.getX(i) - cx), b = Math.floor((a + Math.PI) / (Math.PI * 2) * bins) % bins;
      radius[b] = Math.max(radius[b], Math.hypot(p.getX(i) - cx, p.getZ(i) - cz));
    }
    const leafGeo = new THREE.SphereGeometry(1, 10, 6); leafGeo.scale(.0042, .0016, .0115);
    const leaves = [], twigs = [];
    for (let b = 0; b < bins; b++) {
      const r = radius[b] || radius[(b + 1) % bins]; if (!r) continue;
      const a = (b + .5) / bins * Math.PI * 2 - Math.PI, front = Math.max(0, Math.sin(a));
      // Delante la corona baja un poco sobre la frente; detrás sube hacia la nuca.
      const y = .924 - front * .004 + (1 - front) * .003;
      const x = cx + Math.cos(a) * (r + .004), z = cz + Math.sin(a) * (r + .004);
      twigs.push(new THREE.Vector3(x, y, z));
      [-1, 1].forEach(k => {
        const m = new THREE.Matrix4(), q = new THREE.Quaternion();
        const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)), out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
        const dir = tangent.clone().multiplyScalar(.85).addScaledVector(out, .25).add(new THREE.Vector3(0, k * .55, 0)).normalize();
        q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
        m.compose(new THREE.Vector3(x, y + k * .0035, z).addScaledVector(out, .002), q, new THREE.Vector3(1, 1, 1));
        leaves.push(leafGeo.clone().applyMatrix4(m));
      });
    }
    const wreathMat = M.gilt.clone(); wreathMat.color.set('#b98a45'); wreathMat.roughness = .38;
    leaves.forEach(g => { const m = new THREE.Mesh(g, wreathMat); m.castShadow = true; statue.add(m); });
    if (twigs.length > 3) { const twig = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(twigs, true), 64, .0013, 5, true), wreathMat); statue.add(twig); }
  }
  /* Broche circular en el hombro, orientado según la superficie del manto. */
  function addBrooch(mesh, statue) {
    // El rayo se lanza en el espacio local de la estatua, sobre una copia sin transformar.
    const ray = new THREE.Raycaster(new THREE.Vector3(.07, .783, 1), new THREE.Vector3(0, 0, -1));
    const local = new THREE.Mesh(mesh.geometry); local.updateMatrixWorld(true);
    const hit = ray.intersectObject(local, false)[0]; if (!hit) return;
    const g = new THREE.Group(); g.position.copy(hit.point).addScaledVector(hit.face.normal, .002);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), hit.face.normal.clone().normalize());
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.013, .014, .004, 32), M.gilt); disc.rotation.x = Math.PI / 2; g.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.0105, .0016, 6, 32), M.bronze); ring.position.z = .0025; g.add(ring);
    const boss = new THREE.Mesh(new THREE.SphereGeometry(.004, 12, 8), M.gilt); boss.position.z = .003; g.add(boss);
    statue.add(g);
  }

  return { root, key, ready, redrawLabel() { drawLabel(); labelTex.needsUpdate = true; } };
}
