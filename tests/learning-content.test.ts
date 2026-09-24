import test from 'node:test';
import assert from 'node:assert/strict';
import {units,isReady,isReleased} from '../packages/content/src/learning';
import {readBook} from '../scripts/read-book';
import {convert} from '../packages/content/src/display';
test('every lesson has bounded learner aids, concrete references and fully aligned Han readings',async()=>{
 for(const unit of units){
  for(const kind of ['translation-en','vocabulary-en','culture-en'] as const){const aid=unit.aids.find(a=>a.kind===kind);assert.ok(aid,`${unit.id}: ${kind}`);assert.ok(aid.rights.edition);assert.equal(new URL(aid.rights.source!).protocol,'https:');assert.equal(aid.review.textVersion,aid.version);}
  for(const ref of unit.refs){const book=await readBook(ref.id.split('-')[1]);const p=book.chapters.flatMap(c=>c.paragraphs).find(p=>p.id===ref.id)!;const excerpt=Array.from(p.text).slice(ref.start,ref.end).join('');assert.ok(excerpt);const aid=unit.aids.find(a=>a.kind==='pinyin'&&a.target===ref.id)!;for(let at=ref.start;at<ref.end;at++)if(/\p{Script=Han}/u.test(Array.from(p.text)[at])){const t=aid.tokens!.filter(t=>t.start===at&&t.end===at+1);assert.equal(t.length,1,`${unit.id}: ${at}`);assert.equal(t[0].text,Array.from(p.text)[at]);assert.match(t[0].pinyin,/^[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+$/u);}for(const script of ['simplified','traditional'] as const)assert.equal(Array.from(await convert(excerpt,script)).length,Array.from(excerpt).length);}
 }
});
test('new units quote the pinned excerpts and retain context-specific readings',async()=>{
 const expected={'knowing-enough':'知足者富。','learning-from-others':'三人行，必有我師焉。'};
 for(const [id,text] of Object.entries(expected)){const u=units.find(u=>u.id===id)!;assert.ok(u);assert.equal(isReady(u),false);const ref=u.refs[0];const book=await readBook(ref.id.split('-')[1]);const p=book.chapters.flatMap(c=>c.paragraphs).find(p=>p.id===ref.id)!;assert.equal(Array.from(p.text).slice(ref.start,ref.end).join(''),text);assert.equal(u.exercises.length,2);}
 const readings=units.flatMap(u=>u.aids.filter(a=>a.kind==='pinyin').flatMap(a=>a.tokens||[]));assert.equal(readings.find(t=>t.text==='行')?.pinyin,'xíng');assert.equal(readings.find(t=>t.text==='說')?.pinyin,'yuè');assert.equal(readings.find(t=>t.text==='爲')?.pinyin,'wéi');
});

test('public release is explicit and independent from editorial approval',()=>{
 const u=units.find(u=>u.id==='practice-and-joy')!;assert.equal(isReleased(u),true);assert.equal(isReady(u),false);assert.equal(isReleased({...u,id:'new-unlisted-lesson'}),false);assert.equal(isReleased({...u,version:'unreleased-next-version'}),false);assert.equal(isReleased({...u,review:{...u.review,status:'withdrawn'}}),false);
});
