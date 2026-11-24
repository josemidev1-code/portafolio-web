import test from 'node:test';
import assert from 'node:assert/strict';
import { createGovernor } from '../quality.js';

test('La visita automática sólo cambia al recorrido ligero si sigue por debajo de 8 fps a resolución mínima', () => {
  let scale = 1, changes = 0;
  const governor = createGovernor({
    getLevel: () => 'baja', setLevel: assert.fail,
    setScale: value => { scale = value; },
    isAuto: () => true, isBusy: () => false,
    onStall: () => { changes++; }
  });
  governor.start(0);
  for (let t = 0; t <= 25000; t += 75) governor.tick(t);
  assert.equal(scale, .6);
  assert.equal(changes, 0);
  for (let t = 25000; t <= 40000; t += 250) governor.tick(t);
  assert.equal(changes, 1);
});
