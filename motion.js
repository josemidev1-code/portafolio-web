// Resorte amortiguado: conserva la velocidad al invertir el recorrido.
function travelStep(current, target, velocity, dt, smoothTime = .58, maxSpeed = 1.35) {
  const omega = 2 / smoothTime;
  const error = Math.max(-maxSpeed * smoothTime, Math.min(maxSpeed * smoothTime, current - target));
  const localTarget = current - error;
  const decay = Math.exp(-omega * dt);
  const impulse = (velocity + omega * error) * dt;
  const next = localTarget + (error + impulse) * decay;
  const nextVelocity = (velocity - omega * impulse) * decay;
  if ((target - current) * (target - next) < 0 || Math.abs(target - current) < 1e-10) return {value: target, velocity: 0};
  return {value: next, velocity: nextVelocity};
}

export function smoothTravel(current, target, velocity, dt, smoothTime = .58, maxSpeed = 1.35) {
  // Pasos internos constantes evitan que una GPU lenta cambie la sensación del recorrido.
  const steps = Math.max(1, Math.ceil(dt * 240));
  let result = {value: current, velocity};
  for (let i = 0; i < steps; i++) result = travelStep(result.value, target, result.velocity, dt / steps, smoothTime, maxSpeed);
  return result;
}

export const smootherStep = t => {
  t = Math.max(0, Math.min(1, t));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// Interpolación cúbica monótona: velocidad continua sin detenerse en cada sala.
export function routeParameter(u, anchors) {
  if(u<=anchors[0].u)return anchors[0].t;
  if(u>=anchors.at(-1).u)return anchors.at(-1).t;
  const slopes=anchors.slice(1).map((p,i)=>(p.t-anchors[i].t)/(p.u-anchors[i].u));
  const tangent=i=> {
    if(i===0)return slopes[0];if(i===anchors.length-1)return slopes.at(-1);
    const a=slopes[i-1],b=slopes[i];
    if(a*b<=0)return 0;
    const h0=anchors[i].u-anchors[i-1].u,h1=anchors[i+1].u-anchors[i].u;
    return 3*(h0+h1)/((2*h1+h0)/a+(h1+2*h0)/b);
  };
  const i=anchors.findIndex((p,n)=>n<anchors.length-1 && u>=p.u && u<=anchors[n+1].u);
  const a=anchors[i],b=anchors[i+1],h=b.u-a.u,x=(u-a.u)/h;
  return (2*x**3-3*x*x+1)*a.t+(x**3-2*x*x+x)*h*tangent(i)+(-2*x**3+3*x*x)*b.t+(x**3-x*x)*h*tangent(i+1);
}
