import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse,stringify} from 'yaml';
import {parseLesson} from '../scripts/lesson-schema';
import {compileLessons,buildLessons} from '../scripts/build-lessons';
import current from '../packages/content/src/learning-units.json';
const sample=()=>readFile(new URL('../content/learning/practice-and-joy.yaml',import.meta.url),'utf8');
test('YAML authoring preserves every runtime lesson field, order and stable identity',async()=>{
 assert.deepEqual(await compileLessons(),current);await buildLessons(true);
});
test('missing sections, unknown fields, placeholders and duplicate YAML keys stop intake',async()=>{
 const source=await sample();const d=parse(source);
 delete d.sections.context;assert.throws(()=>parseLesson(stringify(d),'missing.yaml'),/sections.context/);
 const typo=parse(source);typo.sections.meaning.typo='lost text';assert.throws(()=>parseLesson(stringify(typo),'typo.yaml'),/Unrecognized key/);
 assert.throws(()=>parseLesson(source+'order: 999\n','duplicate.yaml'),/unique/);
 const template=await readFile(new URL('../content/learning/templates/lesson.yaml',import.meta.url),'utf8');assert.throws(()=>parseLesson(template,'template.yaml'),/TODO/);
});
test('invalid answers and unsubstantiated review status fail with the file and field',async()=>{
 const d=parse(await sample());d.lesson.exercises[0].answer=100;assert.throws(()=>parseLesson(stringify(d),'bad.yaml'),/bad.yaml.*answer/);
 d.lesson.exercises[0].answer=0;d.lesson.review.status='reviewed';assert.throws(()=>parseLesson(stringify(d),'review.yaml'),/reviewer/);
});
