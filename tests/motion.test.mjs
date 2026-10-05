import test from 'node:test';
import assert from 'node:assert/strict';
import { smoothTravel, smootherStep, routeParameter } from '../motion.js';

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

test('El recorrido no se congela ni salta al cruzar las salas',()=>{
  const anchors=[{u:0,t:0},{u:3.5,t:.2},{u:5.2,t:.4},{u:8,t:.65},{u:12,t:1}];
  let previous=0;
  for(let u=.01;u<12;u+=.01){const value=routeParameter(u,anchors);assert.ok(value>previous && value<=1);previous=value;}
  for(const p of anchors.slice(1,-1)){
    const h=.0001,left=(routeParameter(p.u,anchors)-routeParameter(p.u-h,anchors))/h,right=(routeParameter(p.u+h,anchors)-routeParameter(p.u,anchors))/h;
    assert.ok(left>.01 && right>.01);assert.ok(Math.abs(left-right)<.0001);
  }
});
