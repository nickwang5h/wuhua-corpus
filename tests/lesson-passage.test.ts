import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {LessonPassage} from '../apps/learning/src/LessonPassage';
import {units} from '../packages/content/src/learning';
import {emptyData} from '../packages/ui/data';
import {readBook} from '../scripts/read-book';

test('every lesson renders a complete passage with context and all actions, without a stage flag',async()=>{
 for(const unit of units){
  const references=await Promise.all(unit.refs.map(async r=>{const b=await readBook(r.id.split('-')[1]);const p=b.chapters.flatMap(c=>c.paragraphs).find(p=>p.id===r.id)!;return {...r,text:Array.from(p.text).slice(r.start,r.end).join(''),title:unit.title,source:''};}));
  const html=renderToStaticMarkup(createElement(LessonPassage,{unit,references,settings:emptyData('learning').settings,preview:true,saved:false,onSave:()=>{},onShare:()=>{},onPrint:()=>{}}));
  for(const label of ['Meaning','Words to notice','Explore the context','Save','Share','Print'])assert.ok(html.includes(`>${label}<`),`${unit.id}: ${label}`);
  assert.ok(html.indexOf('Explore the context')<html.indexOf('aria-label="Passage actions"'));
  assert.ok(!html.includes('Context is unavailable.'));
 }
});
