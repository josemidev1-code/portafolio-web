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
