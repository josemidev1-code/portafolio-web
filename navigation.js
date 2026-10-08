import { G, ROOMS, LEFT, RIGHT } from './layout.js';
import { GODS, PIEZAS } from './gods.js';

// Peanas y braseros: [x, z, radio]. Se calculan una vez a partir de la colección.
const OBSTACLES = [
  ...GODS.map(g => [g.x, g.z, 1.05]),
  ...PIEZAS.filter(p => !p.wall).map(p => [p.x, p.z, p.pw * .75 + .25]),
  [7.5, -7.5, .7], [21.4, -7.6, .7], [35.4, -7.6, .7], [-6.9, 9.4, .9], [6.9, 9.4, .9], [9.4, 33.4, .9],
  [ROOMS[3].cx, -.6, 1.4]
];
// Muro grabado del ágora: una serie de círculos a lo largo de su planta.
for (let k = -3.6; k <= 3.6; k += .9) OBSTACLES.push([8.2 + Math.cos(-.95) * k, 29.5 - Math.sin(-.95) * k, .8]);
const M = .35; // distancia mínima a los muros

/** Desplazamiento relativo a la cámara y límites del edificio. */
export function moveVisitor(position, input, yaw, dt, speed = 3.8) {
  const length = Math.max(1, Math.hypot(input.forward, input.strafe, input.lift));
  const step = speed * Math.min(dt, .1) / length;
  const next = {
    x: position.x + (Math.cos(yaw) * input.strafe - Math.sin(yaw) * input.forward) * step,
    y: Math.max(.85, Math.min(6.5, position.y + input.lift * step)),
    z: position.z + (-Math.cos(yaw) * input.forward - Math.sin(yaw) * input.strafe) * step
  };
  const inside = p => p.z < G.front + .6;
  if (inside(position)) {
    // Dentro de la galería: muros perimetrales y vanos entre salas.
    next.x = Math.max(LEFT + M, Math.min(RIGHT - M, next.x));
    next.z = Math.max(G.back + M, next.z);
    // La fachada solo se cruza por la puerta del templo.
    if (next.z > G.front - M && Math.abs(next.x) > 2.3 - M) next.z = G.front - M;
    for (const r of ROOMS.slice(1)) {
      const x = r.x0, half = G.wall / 2 + M;
      const crossing = (position.x - x) * (next.x - x) <= 0 || Math.abs(next.x - x) < half;
      const inDoor = next.z > G.doorZ - G.doorW / 2 + M && next.z < G.doorZ + G.doorW / 2 - M;
      if (crossing && !inDoor) next.x = position.x < x ? Math.min(next.x, x - half) : Math.max(next.x, x + half);
    }
  } else {
    // Fuera: la plaza, sin atravesar la fachada salvo por la puerta.
    next.z = Math.min(48, next.z);
    next.x = Math.max(LEFT - 14, Math.min(RIGHT + 14, next.x));
    if (next.z < G.front + .6 + M && Math.abs(next.x) > 2.3 - M) next.z = G.front + .6 + M;
  }
  if (next.y < 3) for (const [x, z, r] of OBSTACLES) {
    const dx = next.x - x, dz = next.z - z, d = Math.hypot(dx, dz);
    if (d < r) { next.x = x + (d > 1e-6 ? dx / d : 1) * r; next.z = z + (dz / (d || 1)) * r; }
  }
  return next;
}
