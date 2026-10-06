/** Desplazamiento relativo a la cámara y límites del edificio. */
export function moveVisitor(position, input, yaw, dt, speed = 3.8) {
  const length=Math.max(1,Math.hypot(input.forward,input.strafe,input.lift));
  const step=speed*Math.min(dt,.1)/length;
  const next={x:position.x+(Math.cos(yaw)*input.strafe-Math.sin(yaw)*input.forward)*step,
    y:Math.max(.85,Math.min(6.5,position.y+input.lift*step)),
    z:position.z+(-Math.cos(yaw)*input.forward-Math.sin(yaw)*input.strafe)*step};
  next.z=Math.max(-44.2,Math.min(48,next.z));
  next.x=Math.max(next.z<4?-4.7:-20,Math.min(next.z<4?4.7:20,next.x));
  for(const [z,halfWidth] of [[3.8,1.94],[-11,2.94],[-23,2.94]]) {
    if((position.z-z)*(next.z-z)<=0 && Math.abs(next.x)>halfWidth)next.z=position.z;
  }
  // Urnas, dioses, cerámica y braseros: [x, z, radio].
  const obstacles=[[0,-5.2,.92],[0,-17.2,.92],[0,-29.2,.92],[-2.8,-7.9,1.15],[-2.8,-19.9,1.15],[-2.8,-31.9,1.15],[4.25,-2.3,1.0],
    [-4.3,-3.2,.72],[-4.25,-14.6,.72],[4.25,-19.4,.72],[-4.25,-26.8,.72],[4.25,-27.2,.72],
    [4.25,-9.4,.75],[4.25,-21.6,.75],[4.25,-33.4,.75],[-6.9,9.4,.9],[6.9,9.4,.9],[9.4,33.4,.9],[0,-40,1.0]];
  // Muro grabado del ágora: se trata como una serie de círculos a lo largo de su planta.
  for(let k=-3.6;k<=3.6;k+=.9)obstacles.push([8.2+Math.cos(-.95)*k,29.5-Math.sin(-.95)*k,.8]);
  if(next.y<3)for(const [x,z,r] of obstacles){const dx=next.x-x,dz=next.z-z,d=Math.hypot(dx,dz);if(d<r){next.x=x+(d>1e-6?dx/d:1)*r;next.z=z+(dz/(d||1))*r;}}
  return next;
}
