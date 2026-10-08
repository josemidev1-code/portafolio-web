/** Dioses del museo: una escultura protagonista por sala (busto de Atenea, Hermes y Hefesto).
 *  Cada pieza tiene pedestal con inscripción griega, luz propia y una zona invisible para abrir su ficha. */
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/DRACOLoader.js';

export const GODS = [
  // Busto monumental: el rostro lleva pintado el trazo del retrato de referencia, como la policromía de las estatuas griegas.
  { id: 'atenea', greek: 'ΑΘΗΝΑ', motto: 'Sabiduría y estrategia', x: -2.8, z: -7.9, rot: .48, height: 2.25, plinth: 1.15, kind: 'sculpt', src: 'assets/atenea-busto/atenea', paint: 'assets/atenea-busto/rostro.png', hero: true },
  { id: 'hermes', greek: 'ΕΡΜΗΣ', motto: 'Mensajero de los dioses', x: -2.8, z: -19.9, rot: .48, height: 2.45, plinth: 1.0, kind: 'scan', src: 'assets/hermes/hermes', hero: true },
  { id: 'hefesto', greek: 'ΗΦΑΙΣΤΟΣ', motto: 'El herrero del Olimpo', x: -2.8, z: -31.9, rot: .48, height: 1.42, plinth: 1.0, kind: 'sculpt', src: 'assets/hefesto/hefesto', hero: true }
];

/* Mármol sin UV: se proyecta la textura veteada desde las tres direcciones del espacio. */
function triplanar(THREE, material, map, scale = 1.6, paint = null) {
  if (paint) material.defines = { ...(material.defines || {}), USE_UV: '' };
  material.onBeforeCompile = shader => {
    shader.uniforms.marbleMap = { value: map }; shader.uniforms.marbleScale = { value: scale };
    if (paint) { shader.uniforms.faceMap = { value: paint.map }; shader.uniforms.faceDir = { value: paint.dir }; }
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos; varying vec3 vWorldN;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.)).xyz; vWorldN = normalize(mat3(modelMatrix) * objectNormal);');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D marbleMap; uniform float marbleScale; varying vec3 vWorldPos; varying vec3 vWorldN;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 bw = pow(abs(vWorldN), vec3(4.)); bw /= bw.x + bw.y + bw.z;
        vec3 tri = texture2D(marbleMap, vWorldPos.zy * marbleScale).rgb * bw.x + texture2D(marbleMap, vWorldPos.xz * marbleScale).rgb * bw.y + texture2D(marbleMap, vWorldPos.xy * marbleScale).rgb * bw.z;
        diffuseColor.rgb *= mix(vec3(1.), tri * 1.12, .85);${paint ? `
        // Pigmento del retrato: solo en las caras que miran al frente, para que no se estire por los lados.
        vec4 ink = texture2D(faceMap, vUv);
        float facing = smoothstep(.3, .8, dot(normalize(vWorldN), faceDir));
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(.3, .25, .21), ink.a * facing * .9);` : ''}`);
    if (paint) shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D faceMap; uniform vec3 faceDir;');
  };
  material.customProgramCacheKey = () => paint ? 'triplanar-marble-paint' : 'triplanar-marble';
  return material;
}

export function createGods(THREE, scene, M, { compact, renderer, contactShadow }) {
  const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/gltf/');
  const loader = new GLTFLoader().setDRACOLoader(draco), texLoader = new THREE.TextureLoader();
  const loadTex = (url, srgb) => { const t = texLoader.load(url); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
  const sculptMarble = triplanar(THREE, new THREE.MeshStandardMaterial({ color: '#f3ede2', roughness: .5, vertexColors: true, envMapIntensity: .8 }), M.marble.map, 1.4);
  const sculptGold = new THREE.MeshStandardMaterial({ color: '#c9994f', metalness: 1, roughness: .34, vertexColors: true, envMapIntensity: 1.3 });
  const hits = [], labels = [], pieces = {};

  function pedestal(root, g) {
    const add = (w, h, d, y, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.y = y; m.castShadow = m.receiveShadow = true; root.add(m); return m; };
    const s = g.hero ? 1 : .82, H = g.plinth;
    add(1.62 * s, .16, 1.42 * s, .08, M.marbleGrey); add(1.5 * s, .1, 1.3 * s, .21, M.marble);
    add(1.3 * s, H - .42, 1.1 * s, .26 + (H - .42) / 2, M.marbleGrey);
    add(1.42 * s, .08, 1.22 * s, H - .12, M.marble); add(1.5 * s, .1, 1.3 * s, H - .05, M.marble);
    // Inscripción grabada en el dado.
    const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const ctx = c.getContext('2d');
    const draw = () => {
      ctx.clearRect(0, 0, 1024, 256); ctx.textAlign = 'center';
      const big = g.greek.length > 8 ? 70 : 92;
      ctx.font = `600 ${big}px "EB Garamond", "GFS Didot", Georgia, serif`; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '16px';
      ctx.fillStyle = 'rgba(255,236,206,.5)'; ctx.fillText(g.greek, 512, 124); ctx.fillStyle = 'rgba(30,24,18,.9)'; ctx.fillText(g.greek, 512, 120);
      ctx.font = 'italic 500 40px "Cormorant Garamond", Georgia, serif'; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '3px';
      ctx.fillStyle = 'rgba(40,32,24,.88)'; ctx.fillText(g.motto, 512, 196);
    };
    draw();
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.1 * s, .275 * s), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .9, depthWrite: false }));
    plate.position.set(0, .26 + (H - .42) / 2, .552 * s + .001); root.add(plate);
    labels.push(() => { draw(); tex.needsUpdate = true; });
  }

  function lights(g) {
    const key = new THREE.SpotLight('#ffe2bd', (compact ? 80 : 110) * (g.hero ? 1 : .7), 14, Math.PI / 9, .55, 1.6);
    // Luz lateral alta desde el recorrido: modela el rostro y deja sombra en el muro.
    const side = g.x < 0 ? 1 : -1;
    key.position.set(g.x + side * 3.9, 7.4, g.z + 2.2); key.target.position.set(g.x, g.plinth + 1.5, g.z);
    key.castShadow = !compact && g.hero; key.userData.heroShadow = g.hero; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -.0002; key.shadow.normalBias = .02; key.shadow.radius = 2;
    key.shadow.camera.near = 2; key.shadow.camera.far = 14;
    scene.add(key, key.target);
    if (!compact && g.hero) {
      const rim = new THREE.SpotLight('#9fb6d0', 34, 10, Math.PI / 7, .7, 1.6);
      rim.userData.extra = true; rim.position.set(g.x - side * 2.2, 6.2, g.z - 2.8); rim.target.position.set(g.x, g.plinth + 1.6, g.z); scene.add(rim, rim.target);
    }
    return key;
  }

  const ready = Promise.all(GODS.map(g => new Promise(resolve => {
    const root = new THREE.Group(); root.position.set(g.x, 0, g.z); root.rotation.y = g.rot; scene.add(root);
    pedestal(root, g); contactShadow(g.x, g.z, g.hero ? 2.6 : 2.2);
    const key = lights(g);
    // Zona de clic: un volumen invisible que cubre pedestal y figura.
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1.5, g.plinth + 2.9, 1.4), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = (g.plinth + 2.9) / 2; root.add(hit); hits.push({ mesh: hit, god: g.info || g.id, root });
    pieces[g.id] = { root, key };
    const url = g.kind === 'sculpt' ? `${g.src}${compact ? '-movil' : ''}.glb` : `${g.src}.glb`;
    let material = null;
    if (g.kind === 'scan') {
      const sfx = compact ? '-1k' : '', base = g.src;
      material = new THREE.MeshStandardMaterial({
        map: loadTex(`${base}-albedo${sfx}.jpg`, true), normalMap: loadTex(`${base}-normal${sfx}.jpg`, false),
        aoMap: loadTex(`${base}-ao.jpg`, false), roughnessMap: loadTex(`${base}-roughness.jpg`, false), roughness: 1, aoMapIntensity: .9, envMapIntensity: .8
      });
    }
    loader.load(url, gltf => {
      const statue = new THREE.Group(); statue.position.y = g.plinth; statue.scale.setScalar(g.height);
      gltf.scene.traverse(o => {
        if (!o.isMesh) return;
        o.castShadow = o.receiveShadow = true;
        if (material) o.material = material;
        else if (/gold|oro/i.test(o.material.name)) o.material = sculptGold;
        else if (g.paint) {
          const map = texLoader.load(g.paint); map.flipY = false; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = renderer.capabilities.getMaxAnisotropy();
          const dir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rot);
          o.material = triplanar(THREE, new THREE.MeshStandardMaterial({ color: '#f3ede2', roughness: .5, vertexColors: true, envMapIntensity: .8 }), M.marble.map, 1.4, { map, dir });
        } else o.material = sculptMarble;
      });
      statue.add(gltf.scene); root.add(statue); pieces[g.id].statue = statue; resolve(statue);
    }, undefined, () => resolve(null));
  })));

  /* Relieve de Atenea tallado a partir del retrato: la misma cara, el pelo, la corona y el broche del dibujo. */
  {
    const R = { x: -5.84, y: 3.67, z: -4.7, w: 1.62, h: 2.36 };
    const g = new THREE.Group(); g.position.set(R.x, R.y, R.z); g.rotation.y = Math.PI / 2; scene.add(g);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(R.w + .2, R.h + .2, .1), M.marble); frame.castShadow = frame.receiveShadow = true; g.add(frame);
    const ground = new THREE.Mesh(new THREE.BoxGeometry(R.w + .02, R.h + .02, .1), M.marbleWarm); ground.position.z = .02; g.add(ground);
    const tex = (name, srgb) => { const t = loadTex(`assets/atenea-relieve/relieve-${name}`, srgb); return t; };
    const seg = compact ? [70, 102] : [150, 218];
    const relief = new THREE.Mesh(new THREE.PlaneGeometry(R.w, R.h, ...seg), new THREE.MeshStandardMaterial({
      color: '#f2eadf', map: tex('patina.jpg', true), normalMap: tex('normal.jpg', false), normalScale: new THREE.Vector2(1.1, 1.1),
      displacementMap: tex('altura.png', false), displacementScale: .075, roughness: .55, envMapIntensity: .8
    }));
    relief.position.z = .072; relief.castShadow = relief.receiveShadow = true; g.add(relief);
    const lamp = new THREE.SpotLight('#ffe6c4', compact ? 40 : 55, 7, Math.PI / 7, .6, 1.6);
    lamp.position.set(R.x + 2.6, 6.6, R.z + 1.6); lamp.target.position.set(R.x, R.y, R.z); scene.add(lamp, lamp.target);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(R.w, R.h, .3), new THREE.MeshBasicMaterial({ visible: false })); g.add(hit);
    hits.push({ mesh: hit, god: 'atenea', root: g });
  }

  return { hits, ready, pieces, redraw() { labels.forEach(f => f()); } };
}

/* Fichas de los dioses: quiénes eran, su papel en la saga griega de God of War y por qué están aquí. */
export const GOD_INFO = {
  atenea: {
    title: 'Atenea', inv: 'Ἀθηνᾶ · Sala I · Símbolo del templo', accent: '#d8b46a',
    text: [
      'Diosa de la sabiduría y de la guerra estratégica. Hija de Zeus, nació ya armada de su cabeza. Protegía los oficios, la artesanía y la ciudad de Atenas, que llevó su nombre después de que ella le regalara el olivo. El Partenón de la Acrópolis se levantó en su honor.',
      'En la saga griega de God of War es la guía de Kratos: le encarga detener a Ares cuando asedia Atenas y lo acompaña en su camino hasta que él ocupa el trono del dios de la guerra.',
      'Es mi diosa favorita. Me gusta mucho la sabiduría y la mitología griega, y Atenea reúne las dos cosas: pensar antes de actuar, aprender y crear con oficio. Por eso es el símbolo principal de este templo y preside la sala de mi primer proyecto.'
    ],
    listTitle: 'En esta sala',
    list: ['Relieve de mármol tallado a partir del retrato a lápiz: su rostro, su corona de laurel y su broche', 'Busto de Atenea modelado para este museo con los rasgos del mismo retrato y el trazo pintado en el rostro, como la policromía de las estatuas griegas', 'Atributos: el búho, el olivo, la lanza y la égida']
  },
  hermes: {
    title: 'Hermes', inv: 'Ἑρμῆς · Sala II', accent: '#8db4ff',
    text: [
      'Mensajero de los dioses, de sandalias aladas. Dios de los viajeros, el comercio, la astucia y la comunicación, y guía de las almas hacia el inframundo.',
      'En God of War III, Kratos lo persigue por el Olimpo y se queda con sus botas aladas.',
      'Preside la sala del asistente de gimnasio porque esa pieza trata de mensajes: recibirlos, entenderlos y responderlos, ahora con ayuda de la IA.'
    ],
    listTitle: 'La escultura', list: ['Escaneo 3D de una estatua clásica de Hermes', 'Atributos: el caduceo, el sombrero y las sandalias aladas']
  },
  hefesto: {
    title: 'Hefesto', inv: 'Ἥφαιστος · Sala III', accent: '#e0894a',
    text: [
      'Dios del fuego, la forja y los artesanos. En su fragua, bajo los volcanes, forjó las armas y los tesoros del Olimpo.',
      'En God of War III forja para Kratos el Látigo de Némesis.',
      'Preside la sala de lo que viene: aquí se forjan los próximos proyectos.'
    ],
    listTitle: 'La escultura', list: ['Modelada para este museo: herrero barbudo con píleo y exomis', 'Atributos: el martillo, las tenazas y el yunque']
  }
};
