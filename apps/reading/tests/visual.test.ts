import test from 'node:test';
import assert from 'node:assert/strict';
import {lorenzPoints,rk4,lorenzPath} from '../src/ui/lorenz';
test('Lorenz RK4 trajectory is finite, cached, framed as two wings and shared with SVG',()=>{
 const p=lorenzPoints();assert.equal(p.length,6000);assert.equal(lorenzPoints(),p);assert.ok(p.every(v=>v.every(Number.isFinite)));assert.ok(Math.min(...p.map(x=>x[0]))< -40&&Math.max(...p.map(x=>x[0]))>40);assert.ok(p.every(([x,y])=>Math.abs(x)<=49&&Math.abs(y)<=34));assert.equal(lorenzPath(true).split('L').length,500);assert.ok(lorenzPath().startsWith('M'));const whole=rk4([1,1,1]);const half=rk4(rk4([1,1,1],.0025),.0025);assert.ok(whole.every((v,i)=>Math.abs(v-half[i])<1e-5));
});
