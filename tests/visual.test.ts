import test from 'node:test';
import assert from 'node:assert/strict';
import {lorenzPoints,rk4,lorenzPath} from '../packages/ui/lorenz';
import {writingCharacters} from '../apps/learning/src/writing';
import {exerciseIndex,updateProgress,progressFor,canComplete} from '../apps/learning/src/model';
import {units} from '../packages/content/src/learning';
import {emptyData,parseData,backup} from '../packages/ui/data';
import {convert} from '../packages/content/src/display';
test('Lorenz RK4 trajectory is finite, cached, framed as two wings and shared with SVG',()=>{
 const p=lorenzPoints();assert.equal(p.length,6000);assert.equal(lorenzPoints(),p);assert.ok(p.every(v=>v.every(Number.isFinite)));assert.ok(Math.min(...p.map(x=>x[0]))< -40&&Math.max(...p.map(x=>x[0]))>40);assert.ok(p.every(([x,y])=>Math.abs(x)<=49&&Math.abs(y)<=34));assert.equal(lorenzPath(true).split('L').length,500);assert.ok(lorenzPath().startsWith('M'));const whole=rk4([1,1,1]);const half=rk4(rk4([1,1,1],.0025),.0025);assert.ok(whole.every((v,i)=>Math.abs(v-half[i])<1e-5));
});
test('practice characters follow chosen script, deduplicate in order and omit punctuation',async()=>{
 const source='學而時習之，不亦說乎？學！𠮷';const shown=await convert(source,'simplified');assert.deepEqual(writingCharacters(shown),['学','而','时','习','之','不','亦','说','乎','𠮷']);assert.deepEqual(writingCharacters('ABC — 123，。'),[]);
});
test('single-question position extends old progress without losing first attempts or completion',()=>{
 const unit=units[0];let d=emptyData('learning');d=updateProgress(d,unit,{step:'practice',attempts:{[unit.exercises[0].id]:{first:2,last:0,count:2,feedback:'old feedback'}}});assert.equal(exerciseIndex(unit,progressFor(d,unit)),1);d=updateProgress(d,unit,{exerciseId:unit.exercises[0].id});assert.equal(exerciseIndex(unit,progressFor(d,unit)),0);assert.equal(progressFor(d,unit)?.attempts?.[unit.exercises[0].id].first,2);assert.equal(canComplete(d,unit),false);d=updateProgress(d,unit,{completed:true});const restored=parseData(backup(d),'learning');assert.equal(progressFor(restored,unit)?.completed,true);assert.equal(progressFor(restored,unit)?.exerciseId,unit.exercises[0].id);assert.equal(progressFor(restored,unit)?.attempts?.[unit.exercises[0].id].count,2);
});
