/** Fuego de los braseros: llamas con ruido en el sombreador, brasas, humo y luz que titila.
 *  Cada fuego tiene su semilla, su ritmo y su tamaño: nunca laten sincronizados. */

const NOISE = `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*vnoise(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }`;

function flameMaterial(THREE, seed, { core = false } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed }, uGain: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec2 vUv; uniform float uTime, uSeed, uGain; ${NOISE}
      void main(){
        float t=uTime*${core ? '1.9' : '1.45'}+uSeed*13.;
        // La altura respira con un ruido lento: cada fuego crece y se encoge a su ritmo.
        float grow=.78+.32*vnoise(vec2(t*.55,uSeed*7.))+.08*vnoise(vec2(t*2.1,uSeed));
        float y=vUv.y/grow, x=(vUv.x-.5)*2.;
        // Distorsión del dominio: las lenguas suben, se curvan y se separan.
        vec2 q=vec2(x*1.6+uSeed, y*2.4-t*1.25);
        float warp=fbm(q+vec2(0.,fbm(q*1.7-t*.35)*1.6));
        float detail=fbm(vec2(x*4.5+uSeed*3., y*5.5-t*2.6));
        float sway=sin(t*.9+y*2.6)*.09*y + (warp-.5)*.55*y;
        float halfW=mix(${core ? '.42' : '.82'}, .03, pow(clamp(y,0.,1.), ${core ? '.7' : '.5'}));
        float body=1.-smoothstep(halfW*.3, halfW, abs(x-sway));
        // Varias lenguas: el borde superior se recorta en picos que suben y se separan.
        float tongues=.5+.5*sin(x*${core ? '5.' : '8.'}+warp*6.-t*1.7+uSeed*4.);
        float top=1.-smoothstep(${core ? '.28' : '.36'}, .96, y+(detail-.5)*.6+(warp-.5)*.4-tongues*.16*y);
        float bottom=smoothstep(0., .08, vUv.y);
        float f=body*top*bottom*(.55+.75*detail);
        // Temperatura: núcleo casi blanco, cuerpo naranja, puntas rojizas.
        float heat=clamp(f*(1.1-y*.95), 0., 1.);
        vec3 c=mix(vec3(.45,.05,.01), vec3(1.,.32,.04), smoothstep(.05,.35,heat));
        c=mix(c, vec3(1.,.66,.22), smoothstep(.3,.65,heat));
        c=mix(c, vec3(1.,.82,.5), smoothstep(.75,1.,heat));
        float a=smoothstep(.04, .45, f);
        gl_FragColor=vec4(c*a*uGain*${core ? '1.05' : '1.15'}, a);
      }`
  });
}

function smokeMaterial(THREE, seed) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed }, uOpacity: { value: .22 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec2 vUv; uniform float uTime, uSeed, uOpacity; ${NOISE}
      void main(){
        float y=vUv.y, x=(vUv.x-.5)*2.; float t=uTime*.45+uSeed*7.;
        float n=fbm(vec2(x*1.8+sin(y*2.+t*.4)*.6, y*2.2-t));
        float w=mix(.2,.95,y);
        float shape=(1.-smoothstep(w*.3,w,abs(x+(n-.5)*.8*y)))*smoothstep(0.,.25,y)*(1.-smoothstep(.55,1.,y));
        float a=shape*smoothstep(.35,.75,n)*uOpacity;
        gl_FragColor=vec4(vec3(.11,.1,.095), a);
      }`
  });
}

function emberPoints(THREE, count, seed, height) {
  const geo = new THREE.BufferGeometry(), data = new Float32Array(count * 4);
  let s = seed * 1000 + 17; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) data.set([r(), r(), r(), r()], i * 4);
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('seed', new THREE.BufferAttribute(data, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, height / 2, 0), height);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uTime: { value: 0 }, uHeight: { value: height }, uScale: { value: 1 } },
    vertexShader: `attribute vec4 seed; uniform float uTime, uHeight, uScale; varying float vLife; varying float vHot;
      void main(){
        float life=fract(uTime*(.18+seed.x*.22)+seed.y); vLife=life; vHot=seed.w;
        float ang=seed.z*6.2831+uTime*(.6+seed.x);
        vec3 p=vec3(cos(ang)*(.05+life*.35*seed.w), life*uHeight*(.6+seed.x*.6), sin(ang)*(.05+life*.35*seed.w));
        p.x+=sin(uTime*2.3+seed.y*20.)*.06*life; p.z+=cos(uTime*1.7+seed.z*20.)*.06*life;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_PointSize=uScale*(1.5+seed.w*2.5)*(1.-life*.7)*(18./-mv.z);
        gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying float vLife; varying float vHot;
      void main(){ vec2 d=gl_PointCoord-.5; float a=smoothstep(.5,.0,length(d)); a*=smoothstep(0.,.08,vLife)*(1.-smoothstep(.55,1.,vLife));
        vec3 c=mix(vec3(1.,.75,.35), vec3(.9,.22,.04), vLife)*(1.5+vHot);
        gl_FragColor=vec4(c*a, a); }`
  });
  return new THREE.Points(geo, mat);
}

/** Brasero trípode de bronce: cuenco con labio moldurado, patas con garras y anillo de unión. */
function tripod(THREE, M, compact, h = 1.1) {
  const g = new THREE.Group(), seg = compact ? 32 : 64;
  const bowlPts = [[0, .0], [.18, .01], [.34, .05], [.46, .13], [.52, .22], [.54, .28], [.6, .3], [.61, .34], [.56, .35], [.5, .3], [.42, .22], [.2, .14], [0, .13]];
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlPts.map(([x, y]) => new THREE.Vector2(x, y)), seg), M.bronze);
  bowl.position.y = h - .14; bowl.castShadow = true; bowl.receiveShadow = true; g.add(bowl);
  const band = new THREE.Mesh(new THREE.TorusGeometry(.5, .022, 8, seg), M.gilt); band.rotation.x = Math.PI / 2; band.position.y = h + .06; g.add(band);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3, cx = Math.cos(a), cz = Math.sin(a);
    const curve = new THREE.CatmullRomCurve3([[.5, h + .05], [.44, h * .78], [.34, h * .5], [.36, h * .2], [.44, .08]].map(([r, y]) => new THREE.Vector3(cx * r, y, cz * r)));
    const leg = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .032, 8, false), M.bronze); leg.castShadow = true; g.add(leg);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), M.bronze); paw.scale.set(1.2, .7, 1.4); paw.position.set(cx * .45, .045, cz * .45); paw.rotation.y = -a; g.add(paw);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), M.gilt); knob.position.set(cx * .5, h + .08, cz * .5); g.add(knob);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.345, .018, 8, seg), M.bronze); ring.rotation.x = Math.PI / 2; ring.position.y = h * .45; g.add(ring);
  return g;
}

export function createFires(THREE, scene, M, { compact, canvasTex }) {
  const fires = [];
  const coalTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#120804'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { const x = Math.random() * w, y = Math.random() * h, r = 4 + Math.random() * 10; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,${120 + Math.random() * 90 | 0},40,${.5 + Math.random() * .5})`); gr.addColorStop(1, 'rgba(60,10,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  });
  const glowTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,170,90,.32)'); gr.addColorStop(.3, 'rgba(255,110,40,.1)'); gr.addColorStop(1, 'rgba(255,90,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });

  function brazier({ x, z, base = 0, pedestal = false, size = 1, light = 5, range = 9, seed = 1 }) {
    const root = new THREE.Group(); root.position.set(x, base, z); scene.add(root);
    let top = 0;
    if (pedestal) {
      // Basa cuadrada de mármol con molduras: el trípode descansa sobre piedra.
      const add = (w, h, y, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat); m.position.y = y; m.castShadow = m.receiveShadow = true; root.add(m); };
      add(1.25, .14, .07, M.marbleGrey); add(1.12, .08, .18, M.marble); add(.96, .52, .48, M.marbleWarm); add(1.1, .08, .78, M.marble); add(1.2, .06, .85, M.marbleGrey);
      top = .88;
    }
    const legH = 1.05 * size, stand = tripod(THREE, M, compact, legH); stand.position.y = top; stand.scale.setScalar(1); root.add(stand);
    const coals = new THREE.Mesh(new THREE.CircleGeometry(.5, 24), new THREE.MeshStandardMaterial({ color: '#160b06', emissive: '#ff6a1c', emissiveMap: coalTex, emissiveIntensity: 2, roughness: 1 }));
    coals.rotation.x = -Math.PI / 2; coals.position.y = top + legH + .02; root.add(coals);
    // Unos trozos de leña carbonizada asoman sobre el cuenco.
    for (let i = 0; i < 5; i++) { const log = new THREE.Mesh(new THREE.CylinderGeometry(.035, .045, .5, 6), new THREE.MeshStandardMaterial({ color: '#1a1410', roughness: 1, emissive: '#5a1a04', emissiveIntensity: .6 })); log.rotation.set(Math.PI / 2 - .25, i * 1.3, 0); log.rotation.order = 'YXZ'; log.position.set(Math.cos(i * 1.3) * .08, top + legH + .07, Math.sin(i * 1.3) * .08); root.add(log); }
    const flameY = top + legH + .02, fire = new THREE.Group(); fire.position.y = flameY; root.add(fire);
    const layers = [];
    // Capas: cuerpo, segunda envoltura, dos lenguas laterales y núcleo.
    [[1.5, 1.85, 0, false, 0], [1.15, 1.45, .13, false, .04], [.8, 1.15, .61, false, -.24], [.7, .95, .83, false, .26], [.7, 1.0, .37, true, 0]].forEach(([w, h, s, core, ox], i) => {
      const mat = flameMaterial(THREE, seed * 3.1 + s + i, { core });
      const q = new THREE.Mesh(new THREE.PlaneGeometry(w * size, h * size), mat); q.position.y = h * size / 2 - .05; q.position.x = ox * size; q.position.z = (i % 2 ? -.01 : .01) * i; q.renderOrder = 5 + i;
      fire.add(q); layers.push(mat);
    });
    const smoke = smokeMaterial(THREE, seed);
    const smokeQuad = new THREE.Mesh(new THREE.PlaneGeometry(1.4 * size, 3 * size), smoke); smokeQuad.position.y = 1.2 * size + 1.3 * size; smokeQuad.renderOrder = 4; fire.add(smokeQuad);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
    halo.scale.setScalar(2.2 * size); halo.position.y = .6 * size; fire.add(halo);
    const embers = emberPoints(THREE, compact ? 24 : 48, seed, 2.6 * size); embers.position.y = flameY + .15; root.add(embers);
    const pl = new THREE.PointLight('#ff9a4a', light, range, 1.8); pl.position.y = flameY + .45 * size; root.add(pl);
    fires.push({ root, fire, layers, smoke, embers, light: pl, base: light, coals, seed, halo, flameY, size });
  }

  // Dos braseros sobre basas flanquean la escalinata; uno en cada sala.
  brazier({ x: -6.9, z: 9.4, base: -.6, pedestal: true, size: 1, light: 9, range: 12, seed: 1.3 });
  brazier({ x: 6.9, z: 9.4, base: -.6, pedestal: true, size: 1.06, light: 9, range: 12, seed: 4.7 });
  // Brasero junto al muro grabado del ágora.
  brazier({ x: 9.4, z: 33.4, base: -.6, pedestal: true, size: .9, light: 8, range: 12, seed: 3.3 });
  brazier({ x: 4.25, z: -9.4, size: .8, light: 4.5, range: 8, seed: 7.9 });
  brazier({ x: 4.25, z: -21.6, size: .8, light: 4.5, range: 8, seed: 2.2 });
  brazier({ x: 4.25, z: -33.4, size: .8, light: 4.5, range: 8, seed: 5.6 });

  // Ruido 1D suave para la intensidad: varias frecuencias, sin patrón regular.
  const n1 = (t) => { const i = Math.floor(t), f = t - i, h = k => { const s = Math.sin(k * 127.1) * 43758.5453; return s - Math.floor(s); }; const u = f * f * (3 - 2 * f); return h(i) * (1 - u) + h(i + 1) * u; };
  return {
    fires,
    update(t, camera, reduce) {
      const time = reduce ? 0 : t;
      fires.forEach(f => {
        // Cartel cilíndrico: las llamas miran a la cámara sin inclinarse.
        f.fire.rotation.y = Math.atan2(camera.position.x - f.root.position.x, camera.position.z - f.root.position.z);
        const k = reduce ? 1 : .78 + .16 * n1(t * 7 + f.seed * 10) + .1 * n1(t * 19 + f.seed * 3) - .05 * n1(t * 2.3 + f.seed);
        f.layers.forEach((m, i) => { m.uniforms.uTime.value = time * (1 + i * .07) + f.seed; m.uniforms.uGain.value = .85 + k * .25; });
        f.smoke.uniforms.uTime.value = time;
        f.embers.material.uniforms.uTime.value = time;
        f.embers.visible = !reduce;
        f.light.intensity = f.base * k;
        f.light.position.x = reduce ? 0 : (n1(t * 5 + f.seed) - .5) * .08; f.light.position.z = reduce ? 0 : (n1(t * 4 + f.seed * 2) - .5) * .08;
        f.coals.material.emissiveIntensity = 1.4 + k * .9;
        f.halo.material.opacity = .65 + k * .3;
      });
    }
  };
}
