import test from 'node:test';
import assert from 'node:assert/strict';
import { moveVisitor } from '../navigation.js';
const forward={forward:1,strafe:0,lift:0};
test('W avanza en la dirección de la cámara',()=>{
  const straight=moveVisitor({x:0,y:1.75,z:20},forward,0,.1);assert.ok(straight.z<20);assert.equal(straight.x,0);
  const turned=moveVisitor({x:0,y:1.75,z:20},forward,Math.PI/2,.1);assert.ok(turned.x<0);assert.ok(Math.abs(turned.z-20)<1e-8);
});
test('Diagonal no aumenta la velocidad',()=>{
  const p={x:0,y:1.75,z:20};const a=moveVisitor(p,forward,0,.1),b=moveVisitor(p,{...forward,strafe:1},0,.1);
  assert.ok(Math.abs(Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))<1e-8);
});
test('La cámara atraviesa el vano y no la fachada',()=>{
  assert.equal(moveVisitor({x:4,y:1.75,z:3.9},forward,0,.1).z,3.9);
  assert.ok(moveVisitor({x:0,y:1.75,z:3.9},forward,0,.1).z<3.8);
});
test('La cámara no atraviesa las urnas ni sale del edificio',()=>{
  const p=moveVisitor({x:0,y:1.75,z:-4.2},forward,0,.1);assert.ok(Math.hypot(p.x,p.z+5.2)>=.92-1e-8);
  const outside=moveVisitor({x:4.7,y:6.5,z:-44.2},{forward:1,strafe:1,lift:1},0,.1);assert.ok(outside.x<=4.7&&outside.z>=-44.2&&outside.y<=6.5);
});

test('La aceleración gradual y la suelta de teclas conservan velocidades pequeñas',()=>{
  const p={x:0,y:1.75,z:20};const full=moveVisitor(p,forward,0,.1),slow=moveVisitor(p,{forward:.1,strafe:0,lift:0},0,.1);
  assert.ok(Math.abs((20-slow.z)/(20-full.z)-.1)<1e-8);
  assert.deepEqual(moveVisitor(p,{forward:0,strafe:0,lift:0},0,.1),p);
});
