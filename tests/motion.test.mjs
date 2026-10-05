import test from 'node:test';
import assert from 'node:assert/strict';
import { smoothTravel, smootherStep } from '../motion.js';

function travel(target, fps, seconds) {
  let value=0, velocity=0;
  for(let i=0;i<fps*seconds;i++) {
    const step=smoothTravel(value,target,velocity,1/fps);
    assert.ok(step.value >= value-1e-8 && step.value <= target+1e-8, 'Avance sin rebote ni retroceso');
    assert.ok(step.value-value <= 1.4/fps, 'Un salto de scroll no teletransporta la cámara');
    ({value,velocity}=step);
  }
  return value;
}

test('El gesto largo permanece suave a 30, 60 y 120 Hz',()=>{
  const values=[30,60,120].map(fps=>travel(12,fps,5));
  assert.ok(Math.max(...values)-Math.min(...values)<.08);
});
test('Una inversión del gesto frena y regresa sin rebasar el destino',()=>{
  let value=2,velocity=1;
  for(let i=0;i<600;i++) {
    ({value,velocity}=smoothTravel(value,0,velocity,1/60));
    assert.ok(value>=0 && Number.isFinite(value));
  }
  assert.ok(value<.001);
});
test('Los tramos comienzan y terminan sin cambios bruscos de velocidad',()=>{
  assert.equal(smootherStep(0),0);assert.equal(smootherStep(1),1);
  assert.ok(smootherStep(.001)/.001<.0001);
  assert.ok((1-smootherStep(.999))/.001<.0001);
});

test('Al alcanzar el destino no queda una sacudida por velocidad residual',()=>{
  const step=smoothTravel(2,2,1,1/60);
  assert.equal(step.value,2);assert.equal(step.velocity,0);
});
