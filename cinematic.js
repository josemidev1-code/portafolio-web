/** Desenfoque de cámara a partir de la profundidad, limitado a la escena 3D. */
export function createMotionRenderer(THREE,renderer,scene,camera,{compact,reduce}) {
  if(reduce)return {render:()=>renderer.render(scene,camera),resize(){},reset(){}};
  const size=new THREE.Vector2();renderer.getDrawingBufferSize(size);
  const target=new THREE.WebGLRenderTarget(size.x,size.y,{type:renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType,samples:compact?0:2});
  target.depthTexture=new THREE.DepthTexture(size.x,size.y,THREE.UnsignedIntType);
  const previous=new THREE.Matrix4(),current=new THREE.Matrix4(),inverse=new THREE.Matrix4();
  let initialized=false;
  const uniforms={image:{value:target.texture},depth:{value:target.depthTexture},previous:{value:previous},inverse:{value:inverse},shutter:{value:.45},resolution:{value:size}};
  const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`
      varying vec2 vUv;
      uniform sampler2D image,depth;
      uniform mat4 previous,inverse;
      uniform float shutter;
      uniform vec2 resolution;
      void main(){
        float d=texture2D(depth,vUv).x;
        vec4 world=inverse*vec4(vUv*2.-1.,d*2.-1.,1.);world/=world.w;
        vec4 old=previous*world;
        vec2 velocity=(vUv-(old.xy/max(old.w,.001)*.5+.5))*shutter;
        float lengthPixels=length(velocity*resolution);
        velocity*=min(1.,10./max(lengthPixels,.001));
        vec4 sum=texture2D(image,vUv)*2.;float weight=2.;
        if(lengthPixels>.05)for(int i=1;i<=${compact?3:5};i++){
          float fraction=float(i)/${compact?'3.':'5.'};
          vec2 uv=clamp(vUv-velocity*fraction,vec2(.001),vec2(.999));
          float sampleDepth=texture2D(depth,uv).x;
          float w=1.-smoothstep(.002,.015,abs(sampleDepth-d));
          sum+=texture2D(image,uv)*w;weight+=w;
        }
        gl_FragColor=vec4((sum/weight).rgb,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const screen=new THREE.Scene();screen.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
  const screenCamera=new THREE.Camera();
  return {
    render(dt){
      camera.updateMatrixWorld();current.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);inverse.copy(current).invert();
      if(!initialized || dt>.08){previous.copy(current);initialized=true;}
      uniforms.shutter.value=Math.min(.65,.38/(Math.max(dt,.008)*60));
      renderer.setRenderTarget(target);renderer.render(scene,camera);
      renderer.domElement.dataset.sceneDrawCalls=String(renderer.info.render.calls);
      renderer.domElement.dataset.sceneTriangles=String(renderer.info.render.triangles);
      renderer.setRenderTarget(null);renderer.render(screen,screenCamera);previous.copy(current);
    },
    resize(){renderer.getDrawingBufferSize(size);target.setSize(size.x,size.y);initialized=false;},
    reset(){initialized=false;}
  };
}
