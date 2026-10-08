/** Posproceso de la escena 3D: oclusión ambiental en pantalla y desenfoque de cámara
 *  calculado con la profundidad. Los textos y botones HTML permanecen nítidos. */
export function createMotionRenderer(THREE, renderer, scene, camera, { compact, reduce }) {
  const size = new THREE.Vector2(); renderer.getDrawingBufferSize(size);
  const type = renderer.extensions.has('EXT_color_buffer_float') ? THREE.HalfFloatType : THREE.UnsignedByteType;
  let target = null, enabled = true;
  const makeTarget = samples => {
    const t = new THREE.WebGLRenderTarget(size.x, size.y, { type, samples });
    t.depthTexture = new THREE.DepthTexture(size.x, size.y, THREE.UnsignedIntType);
    return t;
  };
  target = makeTarget(compact ? 0 : 2);
  const previous = new THREE.Matrix4(), current = new THREE.Matrix4(), inverse = new THREE.Matrix4();
  let initialized = false;
  const uniforms = {
    image: { value: target.texture }, depth: { value: target.depthTexture }, previous: { value: previous }, inverse: { value: inverse },
    shutter: { value: .45 }, resolution: { value: size }, near: { value: camera.near }, far: { value: camera.far }, projScale: { value: 1 },
    blur: { value: reduce ? 0 : 1 }, aoStrength: { value: 1 }
  };
  const SAMPLES = compact ? 3 : 5;
  // El número de pares de oclusión fija el coste del sombreado: se recompila al cambiar de calidad.
  const shader = PAIRS => `
      #include <packing>
      varying vec2 vUv;
      uniform sampler2D image,depth;
      uniform mat4 previous,inverse;
      uniform float shutter,near,far,projScale,blur,aoStrength;
      uniform vec2 resolution;
      float viewZ(vec2 uv){ return perspectiveDepthToViewZ(texture2D(depth,uv).x,near,far); }
      // Oclusión por pares simétricos: una superficie plana no se oscurece, un rincón sí.
      float ambientOcclusion(float d){
        if(${PAIRS}==0 || d>.9999) return 1.;
        float z=perspectiveDepthToViewZ(d,near,far);
        float radius=min(48.,.42*projScale*resolution.y*.5/-z);
        if(radius<1.5) return 1.;
        float noise=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
        float occ=0.;
        for(int i=0;i<${PAIRS};i++){
          float a=(float(i)+noise)*${(Math.PI / Math.max(1, PAIRS)).toFixed(5)};
          float r=radius*(.35+.65*fract(noise+float(i)*.618));
          vec2 o=vec2(cos(a),sin(a))*r/resolution;
          float za=viewZ(clamp(vUv+o,vec2(.001),vec2(.999))), zb=viewZ(clamp(vUv-o,vec2(.001),vec2(.999)));
          float crease=(za+zb)*.5-z;
          float range=1.-smoothstep(.45,1.2,max(za,zb)-z);
          occ+=smoothstep(.012,.16,crease)*range;
        }
        return 1.-aoStrength*.62*occ/${Math.max(1, PAIRS)}.;
      }
      void main(){
        float d=texture2D(depth,vUv).x;
        vec4 base=texture2D(image,vUv);
        vec4 sum=base*2.;float weight=2.;
        if(blur>.5){
          vec4 world=inverse*vec4(vUv*2.-1.,d*2.-1.,1.);world/=world.w;
          vec4 old=previous*world;
          vec2 velocity=(vUv-(old.xy/max(old.w,.001)*.5+.5))*shutter;
          float lengthPixels=length(velocity*resolution);
          velocity*=min(1.,10./max(lengthPixels,.001));
          if(lengthPixels>.05)for(int i=1;i<=${SAMPLES};i++){
            float fraction=float(i)/${SAMPLES}.;
            vec2 uv=clamp(vUv-velocity*fraction,vec2(.001),vec2(.999));
            float sampleDepth=texture2D(depth,uv).x;
            float w=1.-smoothstep(.002,.015,abs(sampleDepth-d));
            sum+=texture2D(image,uv)*w;weight+=w;
          }
        }
        gl_FragColor=vec4((sum/weight).rgb*ambientOcclusion(d),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`;
  let pairs = compact ? 4 : 6;
  const material = new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: shader(pairs)
  });
  const screen = new THREE.Scene(); screen.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  const screenCamera = new THREE.Camera();
  return {
    render(dt) {
      camera.updateMatrixWorld(); current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); inverse.copy(current).invert();
      if (!initialized || dt > .08) { previous.copy(current); initialized = true; }
      uniforms.shutter.value = Math.min(.65, .38 / (Math.max(dt, .008) * 60));
      uniforms.projScale.value = camera.projectionMatrix.elements[5]; uniforms.near.value = camera.near; uniforms.far.value = camera.far;
      // Sin posproceso la escena se pinta directamente en pantalla: una sola pasada.
      renderer.setRenderTarget(enabled ? target : null); renderer.render(scene, camera);
      renderer.domElement.dataset.sceneDrawCalls = String(renderer.info.render.calls);
      renderer.domElement.dataset.sceneTriangles = String(renderer.info.render.triangles);
      if (enabled) { renderer.setRenderTarget(null); renderer.render(screen, screenCamera); }
      previous.copy(current);
    },
    /** Ajusta el posproceso a la calidad elegida: oclusión, desenfoque y multimuestreo. */
    configure({ post, ao, blur, samples }) {
      enabled = post;
      uniforms.blur.value = blur && !reduce ? 1 : 0;
      if (post && ao !== pairs) { pairs = ao; material.fragmentShader = shader(pairs); material.needsUpdate = true; }
      if (post && samples !== target.samples) { target.depthTexture.dispose(); target.dispose(); target = makeTarget(samples); uniforms.image.value = target.texture; uniforms.depth.value = target.depthTexture; }
      initialized = false;
    },
    resize() { renderer.getDrawingBufferSize(size); target.setSize(size.x, size.y); initialized = false; },
    reset() { initialized = false; }
  };
}
