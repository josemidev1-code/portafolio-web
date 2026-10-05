import { moveVisitor } from './navigation.js';

export function createFreeCamera(THREE,camera,canvas,{button,hud,dialog,onExit,onReset}) {
  let active=false,dragging=false,dragDistance=0,lastDrag=false,yaw=0,pitch=0,targetYaw=0,targetPitch=0,lastX=0,lastY=0;
  const keys=new Set();const velocity={forward:0,strafe:0,lift:0};
  function allowed(){return innerWidth>=721 && matchMedia('(pointer: fine)').matches;}
  function setActive(value){
    active=value&&allowed();keys.clear();dragging=false;velocity.forward=velocity.strafe=velocity.lift=0;
    document.documentElement.classList.toggle('free-camera',active);
    button.textContent=active?'Volver al recorrido':'Cámara libre · WASD';button.setAttribute('aria-pressed',String(active));hud.hidden=!active;
    if(active){const angle=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');yaw=targetYaw=angle.y;pitch=targetPitch=angle.x;}
    else onExit();
    onReset();
  }
  button.addEventListener('click',()=>setActive(!active));
  addEventListener('keydown',e=>{
    if(!active||dialog.open||e.target.closest('input,textarea,[contenteditable]'))return;
    if(e.code==='Escape'){setActive(false);return;}
    if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}
  });
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear();});
  canvas.addEventListener('pointerdown',e=>{if(!active||dialog.open||e.button!==0)return;dragging=true;dragDistance=0;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{
    if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;dragDistance+=Math.abs(dx)+Math.abs(dy);
    targetYaw-=dx*.003;targetPitch=THREE.MathUtils.clamp(targetPitch-dy*.003,-1.35,1.35);
  });
  canvas.addEventListener('pointerup',()=>{lastDrag=dragDistance>4;dragging=false;});canvas.addEventListener('pointercancel',()=>{dragging=false;});
  addEventListener('resize',()=>{button.hidden=!allowed();if(active&&!allowed())setActive(false);});button.hidden=!allowed();
  return {get active(){return active;},exit(){if(active)setActive(false);},consumeClick(){const value=lastDrag;lastDrag=false;return value;},
    update(dt){
      if(!active)return;
      const damping=1-Math.exp(-12*dt);yaw+=(targetYaw-yaw)*damping;pitch+=(targetPitch-pitch)*damping;
      const target={forward:Number(keys.has('KeyW'))-Number(keys.has('KeyS')),strafe:Number(keys.has('KeyD'))-Number(keys.has('KeyA')),lift:Number(keys.has('KeyE'))-Number(keys.has('KeyQ'))};
      for(const axis of Object.keys(velocity))velocity[axis]+=((dialog.open?0:target[axis])-velocity[axis])*damping;
      const pos=moveVisitor(camera.position,velocity,yaw,dt,keys.has('ShiftLeft')||keys.has('ShiftRight')?6:3.8);
      camera.position.set(pos.x,pos.y,pos.z);camera.quaternion.setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
      canvas.dataset.cameraPosition=[pos.x,pos.y,pos.z].map(n=>n.toFixed(2)).join(',');canvas.dataset.cameraMode='libre';canvas.dataset.cameraYaw=yaw.toFixed(3);
    }
  };
}
