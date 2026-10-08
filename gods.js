/** Dioses del museo: una escultura protagonista por sala (estatua de Atenea, Hermes y Hefesto).
 *  Cada pieza tiene pedestal con inscripción griega, luz propia y una zona invisible para abrir su ficha. */
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/DRACOLoader.js';
import { G } from './layout.js';

// Posiciones en la galería horizontal (layout.js): el dios de cada sala a la izquierda del cuadro.
export const GODS = [
  { id: 'atenea', greek: 'ΑΘΗΝΑ', motto: 'Sabiduría y estrategia', x: -3.6, z: -3.4, rot: .42, height: 2.3, plinth: 1.0, kind: 'sculpt', src: 'assets/atenea/atenea', hero: true },
  { id: 'hermes', greek: 'ΕΡΜΗΣ', motto: 'Mensajero de los dioses', x: 12, z: -3.4, rot: .42, height: 2.45, plinth: 1.0, kind: 'scan', src: 'assets/hermes/hermes', hero: true },
  { id: 'hefesto', greek: 'ΗΦΑΙΣΤΟΣ', motto: 'El herrero del Olimpo', x: 26, z: -3.4, rot: .42, height: 1.42, plinth: 1.0, kind: 'sculpt', src: 'assets/hefesto/hefesto', hero: true }
];
/* Piezas de la colección: escaneos 3D de vaciados de la Colección Real de Vaciados (SMK, Copenhague),
   de dominio público. `wall` cuelga la pieza en el muro del fondo como un relieve. */
export const PIEZAS = [
  { id: 'atenea-egina', label: 'Atenea · Egina', height: 1.705, plinth: .7, x: 3.9, z: -3, rot: -.45, pw: 1.1 },
  { id: 'atenea-pergamo', label: 'Altar de Pérgamo', height: 3.0, wall: true, x: 5.7, y: .95 },
  { id: 'discobolo', label: 'Discóbolo', height: 1.68, plinth: .8, x: 19.5, z: -3, rot: -.5, pw: 1.1 },
  { id: 'lapita-centauro', label: 'Metopa del Partenón', height: 1.36, wall: true, x: 21.0, y: 2.4 },
  { id: 'guerrero-carrera', label: 'Guerrero · Egina', height: .95, plinth: .7, x: 10.2, z: -6.9, rot: .35, pw: 1.5 },
  { id: 'gladiador-borghese', label: 'Gladiador Borghese', height: 1.66, plinth: .7, x: 33.5, z: -3, rot: -.6, pw: 1.3 },
  { id: 'centauro-lapita', label: 'Metopa del Partenón', height: 1.36, wall: true, x: 35.0, y: 2.4 },
  { id: 'guerrero-escudo', label: 'Guerrero con escudo', height: 1.48, plinth: .7, x: 24.4, z: -6.9, rot: .35, pw: 1.2 },
  { id: 'arquero', label: 'Arquero · Egina', height: 1.04, plinth: .6, x: 29.6, z: -6.9, rot: 0, pw: 1.2 },
  { id: 'escudo-strangford', label: 'Escudo Strangford', height: .5, wall: true, x: 27.2, y: 3.1 },
  { id: 'poseidon', label: 'Poseidón · Artemisio', height: 2.01, plinth: 1.1, x: 42.6, z: -4.6, rot: 0, pw: 1.4, hero: true },
  { id: 'laocoonte', label: 'Laocoonte', height: 2.2, plinth: .6, x: 38.6, z: -5.8, rot: .4, pw: 1.7 },
  { id: 'ares-ludovisi', label: 'Ares Ludovisi', height: 1.58, plinth: .8, x: 46.6, z: -5.8, rot: -.4, pw: 1.4 },
  { id: 'cariatide', label: 'Cariátide', height: 2.3, plinth: .45, x: -3.3, z: 4.75, rot: 0, pw: .9, outside: true },
  { id: 'cariatide', label: 'Cariátide', height: 2.3, plinth: .45, x: 3.3, z: 4.75, rot: 0, pw: .9, outside: true }
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
    const s = g.pw ? g.pw / 1.3 : g.hero ? 1 : .82, H = g.plinth;
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
    const side = 1; // desde la derecha y el recorrido, hacia el muro del fondo
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

  /* Piezas de la colección: estatuas sobre peana y relieves colgados en el muro del fondo. */
  PIEZAS.forEach(p => {
    const root = new THREE.Group(); scene.add(root);
    const info = GOD_INFO[p.id];
    if (p.wall) { root.position.set(p.x, p.y, G.back + .02); }
    else {
      root.position.set(p.x, p.outside ? 0 : 0, p.z); root.rotation.y = p.rot;
      pedestal(root, { greek: info.greek, motto: p.label, plinth: p.plinth, pw: p.pw });
      contactShadow(p.x, p.z, p.pw * 1.8);
    }
    const H = p.wall ? p.height : p.plinth + p.height;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(p.wall ? p.height * 1.3 : p.pw + .3, H + .3, p.wall ? .5 : p.pw + .3), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = p.wall ? p.height / 2 : H / 2; root.add(hit); hits.push({ mesh: hit, god: p.id, root, piece: true });
    loader.load(`assets/piezas/${p.id}${compact ? '-movil' : ''}.glb`, gltf => {
      const statue = new THREE.Group(); statue.position.y = p.wall ? 0 : p.plinth; statue.scale.setScalar(p.height);
      gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = !p.wall; o.receiveShadow = true; o.material = sculptMarble; } });
      statue.add(gltf.scene); root.add(statue);
    });
  });

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
    list: ['Estatua de cuerpo entero creada para este museo a partir de una hoja de referencia con vistas frontal, de perfil y trasera', 'Quitón ceñido bajo el pecho, escote drapeado con broche, brazalete de greca, trenza y corona de laurel', 'La acompañan la Atenea del frontón de Egina y la Atenea del Altar de Pérgamo']
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
  },
  'atenea-egina': { title: 'Atenea del frontón de Egina', greek: 'ΑΘΗΝΑ', inv: 'ΑΘΗΝΑ · Sala I', accent: '#d8b46a', piece: true,
    text: ['Templo de Afaya, en la isla de Egina, hacia el 500 a. C. El original está en la Gliptoteca de Múnich.', 'Atenea preside en el frontón la guerra de Troya: de pie entre los guerreros, con el casco, la lanza y la égida, decide sin moverse quién gana.'], listTitle: 'La pieza', list: ['Mármol de Paros pintado en origen', 'Estilo arcaico tardío: la sonrisa y los pliegues rígidos', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] },
  'atenea-pergamo': { title: 'Atenea en el Altar de Pérgamo', greek: 'ΑΘΗΝΑ', inv: 'ΑΘΗΝΑ · Sala I', accent: '#d8b46a', piece: true,
    text: ['Friso de la Gigantomaquia del Altar de Pérgamo, hacia el 170 a. C. El original está en el Museo de Pérgamo de Berlín.', 'Atenea arrastra por el pelo al gigante Alcioneo y lo separa de su madre, Gea, que surge del suelo suplicando; Nike vuela para coronarla. Es la batalla de los dioses contra los gigantes, la misma escala épica que inspira a God of War.'], listTitle: 'La pieza', list: ['Relieve helenístico de gran tamaño', 'Gea, Alcioneo, Atenea y Nike', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] },
  'discobolo': { title: 'Discóbolo', greek: 'ΔΙΣΚΟΒΟΛΟΣ', inv: 'ΔΙΣΚΟΒΟΛΟΣ · Sala II', accent: '#8db4ff', piece: true,
    text: ['Mirón lo fundió en bronce hacia el 450 a. C.; lo conocemos por copias romanas en mármol.', 'El atleta está congelado en el instante antes de soltar el disco: todo el cuerpo es un muelle.'], listTitle: 'La pieza', list: ['Copia de un original de Mirón', 'Uno de los cuerpos en movimiento más famosos del arte clásico', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] },
  'lapita-centauro': { title: 'Metopa del Partenón: lápita y centauro', greek: 'ΜΕΤΟΠΗ', inv: 'ΜΕΤΟΠΗ · Sala II', accent: '#8db4ff', piece: true,
    text: ['Metopa sur del Partenón, hacia el 440 a. C., hoy en el Museo Británico.', 'Un lápita salta sobre el lomo de un centauro en la Centauromaquia, la lucha que los atenienses leían como el orden contra el caos.'], listTitle: 'La pieza', list: ['Relieve del templo de Atenea en la Acrópolis', 'Taller de Fidias', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] },
  'guerrero-carrera': { title: 'Guerrero a la carrera', greek: 'ΠΟΛΕΜΙΣΤΗΣ', inv: 'ΠΟΛΕΜΙΣΤΗΣ · Sala II', accent: '#8db4ff', piece: true,
    text: ['Frontón del templo de Afaya en Egina, hacia el 490 a. C.', 'Un guerrero se lanza al ataque en el combate ante Troya; las figuras se adaptaban al triángulo del frontón.'], listTitle: 'La pieza', list: ['Gliptoteca de Múnich', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] },
  'gladiador-borghese': { title: 'Gladiador Borghese', greek: 'ΑΓΑΣΙΑΣ', inv: 'ΑΓΑΣΙΑΣ · Sala III', accent: '#e0894a', piece: true,
    text: ['Firmado por Agasias de Éfeso hacia el 100 a. C.; está en el Louvre.', 'No es un gladiador sino un guerrero que alza el escudo contra un jinete y prepara el golpe. Cada músculo está en tensión.'], listTitle: 'La pieza', list: ['Mármol helenístico', 'Modelo de anatomía para artistas durante siglos', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] },
  'centauro-lapita': { title: 'Metopa del Partenón: centauro y lápita', greek: 'ΜΕΤΟΠΗ', inv: 'ΜΕΤΟΠΗ · Sala III', accent: '#e0894a', piece: true,
    text: ['Metopa sur del Partenón, hacia el 440 a. C.', 'Un centauro levanta un ánfora para lanzarla contra un lápita durante la boda de Pirítoo, que acabó en batalla.'], listTitle: 'La pieza', list: ['Museo Británico', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] },
  'guerrero-escudo': { title: 'Guerrero con escudo', greek: 'ΟΠΛΙΤΗΣ', inv: 'ΟΠΛΙΤΗΣ · Sala III', accent: '#e0894a', piece: true,
    text: ['Frontón del templo de Afaya en Egina, hacia el 490 a. C.', 'Un hoplita con casco corintio avanza cubierto por su escudo redondo.'], listTitle: 'La pieza', list: ['Gliptoteca de Múnich', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] },
  'arquero': { title: 'Arquero arrodillado', greek: 'ΤΟΞΟΤΗΣ', inv: 'ΤΟΞΟΤΗΣ · Sala III', accent: '#e0894a', piece: true,
    text: ['Frontón del templo de Afaya en Egina, hacia el 490 a. C.', 'Rodilla en tierra y brazos extendidos, apunta un arco que se ha perdido.'], listTitle: 'La pieza', list: ['Gliptoteca de Múnich', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] },
  'escudo-strangford': { title: 'Escudo Strangford', greek: 'ΑΣΠΙΣ', inv: 'ΑΣΠΙΣ · Sala III', accent: '#e0894a', piece: true,
    text: ['Copia romana del escudo de la Atenea Pártenos de Fidias, la gran estatua de oro y marfil del Partenón.', 'Muestra la Amazonomaquia, la batalla de los atenienses contra las amazonas.'], listTitle: 'La pieza', list: ['Museo Británico', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] },
  'poseidon': { title: 'Poseidón del cabo Artemisio', greek: 'ΠΟΣΕΙΔΩΝ', inv: 'ΠΟΣΕΙΔΩΝ · Salida', accent: '#d8b46a', piece: true,
    text: ['Bronce de hacia el 460 a. C. rescatado del mar frente al cabo Artemisio; está en el Museo Arqueológico Nacional de Atenas.', 'No se sabe si es Zeus a punto de lanzar el rayo o Poseidón con su tridente. En God of War III, Poseidón es el primer dios al que se enfrenta Kratos.'], listTitle: 'La pieza', list: ['Bronce griego original', 'Más de dos metros de envergadura', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] },
  'laocoonte': { title: 'Laocoonte y sus hijos', greek: 'ΛΑΟΚΟΩΝ', inv: 'ΛΑΟΚΟΩΝ · Salida', accent: '#d8b46a', piece: true,
    text: ['Obra de Agesandro, Atenodoro y Polidoro de Rodas; está en los Museos Vaticanos.', 'El sacerdote troyano que advirtió contra el caballo de madera muere con sus hijos atrapado por las serpientes que enviaron los dioses.'], listTitle: 'La pieza', list: ['Escultura helenística', 'Descubierta en Roma en 1506', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] },
  'ares-ludovisi': { title: 'Ares Ludovisi', greek: 'ΑΡΗΣ', inv: 'ΑΡΗΣ · Salida', accent: '#d8b46a', piece: true,
    text: ['Copia romana de un original griego del siglo IV a. C.; está en el Palazzo Altemps de Roma.', 'El dios de la guerra descansa con el escudo a sus pies. En God of War, Kratos mata a Ares para salvar Atenas y ocupa su trono.'], listTitle: 'La pieza', list: ['Mármol', 'Un pequeño Eros juega a sus pies', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] },
  'cariatide': { title: 'Cariátide del Erecteion', greek: 'ΚΑΡΥΑΤΙΣ', inv: 'ΚΑΡΥΑΤΙΣ · Pórtico', accent: '#d8b46a', piece: true,
    text: ['El Pórtico de las Cariátides del Erecteion, en la Acrópolis de Atenas, hacia el 420 a. C.', 'Seis muchachas sostienen el techo con la cabeza. Aquí guardan la puerta del museo.'], listTitle: 'La pieza', list: ['Museo de la Acrópolis y Museo Británico', 'Escaneo 3D de un vaciado de la Colección Real de Vaciados (SMK, Copenhague), de dominio público.'] }
};
