import test from 'node:test';
import assert from 'node:assert/strict';
import {currentStep,steps,updateProgress,progressFor} from '../apps/learning/src/model';
import {emptyData,put} from '../packages/ui/data';
import {units} from '../packages/content/src/learning';
test('three-stage reading merges legacy guide and read without discarding stored records',()=>{
 assert.deepEqual(steps,['read','practice','review']);
 for(const unit of units)for(const oldStep of ['guide','read','practice','review']){
  const attempts={[unit.exercises[0].id]:{first:1,last:0,count:2,feedback:'Synthetic feedback'}};
  const d=put(emptyData('learning'),{recordId:`progress:${unit.id}@${unit.version}`,kind:'progress',unitId:unit.id,unitVersion:unit.version,updated:'2026-09-23T00:00:00Z',step:oldStep,completed:true,attempts});
  const original=JSON.stringify(d);const p=progressFor(d,unit)!;
  assert.equal(currentStep(p.step),oldStep==='guide'?'read':oldStep);assert.equal(JSON.stringify(d),original);
  const next=updateProgress(d,unit,{step:'practice'});const saved=progressFor(next,unit)!;
  assert.deepEqual(saved.attempts,attempts);assert.equal(saved.completed,true);assert.equal(saved.unitVersion,unit.version);assert.equal(saved.recordId,p.recordId);
 }
});
