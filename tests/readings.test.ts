import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {compile,run} from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {stringify} from 'yaml';
import {checkReadings,parseReading,validateRegistry,sourceBooks,mdxOptions,readingsDirectory} from '../scripts/readings';
import {matchesReading} from '../apps/learning/src/reading/search';
import {isReleased} from '../apps/learning/src/reading/release';
import {resolveSource,pinyinForSource} from '../apps/learning/src/reading/references';
import {ReadingContext,mdxComponents} from '../apps/learning/src/mdx/components';
import {ReadingLayout} from '../apps/learning/src/reading/ReadingLayout';
import {HomePage} from '../apps/learning/src/pages/HomePage';
import {ExplorePage} from '../apps/learning/src/pages/ExplorePage';
import {emptyData,parseData,backup,mergeData,type Entry} from '../packages/ui/data';
import {toggleSaved,writeNote,readingRecord} from '../apps/learning/src/reading/records';
import {recordReadingId,routeReadingId} from '../apps/learning/src/reading/legacy';
import {validateAids} from '../packages/content/src/validate';
import {pinyinAids} from '../packages/content/src/pinyin';
const books = await sourceBooks();
const readings = await checkReadings();
const base = {id:'tiny-reading',version:'1',title:'A small idea',summary:'A moment of attention.',level:'starting',minutes:1,order:100,focus:{chinese:'知足',pinyin:'zhī zú',gloss:'knowing enough'},concepts:[],sources:readings[0].sources,review:{status:'draft',author:'Test fixture'}};
const source = (metadata:unknown,body='Just a paragraph. No fixed sections required.') => `---\n${stringify(metadata)}---\n\n${body}\n`;

test('a new anchored MDX file needs no React edits or generated JSON',async()=>{
 const dir = await mkdtemp(join(tmpdir(),'wuhua-reading-'));
 try {
  await writeFile(join(dir,'tiny-reading.mdx'),source(base));
  const result = await checkReadings(dir,[]);
  assert.equal(result.length,1);assert.deepEqual(result[0].sources,base.sources);
  assert.equal(isReleased(result[0]),false);
  const code = await compile(source(base),{...mdxOptions,outputFormat:'function-body'});
  const {default:Body} = await run(String(code),{...runtime,baseUrl:import.meta.url});
  assert.match(renderToStaticMarkup(createElement(Body)),/Just a paragraph/);
 } finally {await rm(dir,{recursive:true,force:true});}
});

test('metadata, identity, versions, source ranges and release errors fail authoring checks',async()=>{
 const original = await readFile(join(readingsDirectory,'knowing-enough.mdx'),'utf8');
 const reading = parseReading(original,'knowing-enough.mdx',books);
 assert.throws(()=>parseReading(original,'wrong-name.mdx',books),/filename/);
 for(const change of [{sources:{}},{concepts:['invented']},{concepts:['自知','自知']},{focus:{chinese:'字'}},{version:'0'},{minutes:-1},{typo:'ignored?'},{review:{status:'reviewed',author:'Test'}}])
  assert.throws(()=>parseReading(source({...base,...change}),'tiny-reading.mdx',books));
 for(const ref of [{...reading.sources.main,id:'p-missing'},{...reading.sources.main,version:'99'},
  {...reading.sources.main,start:-1},{...reading.sources.main,end:99999},{...reading.sources.main,end:21},
  {...reading.sources.main,start:21.5}])
  assert.throws(()=>parseReading(source({...base,sources:{main:ref}}),'tiny-reading.mdx',books));
 assert.throws(()=>parseReading(source(base).replace('id: tiny-reading','id: tiny-reading\nid: duplicate'),'tiny-reading.mdx',books),/unique/);
 assert.throws(()=>validateRegistry([reading,reading],[]),/Duplicate/);
 assert.throws(()=>validateRegistry([reading],[]),/related/);
 assert.throws(()=>validateRegistry(readings,[{id:'missing',version:'1'}]),/release/);
 assert.throws(()=>validateRegistry(readings,[{id:reading.id,version:'99'}]),/release/);
 assert.equal(isReleased(reading),true);
 assert.equal(isReleased({...reading,version:'99'}),false);
 assert.equal(isReleased({...reading,review:{...reading.review,status:'withdrawn'}}),false);
 assert.equal(reading.review.status,'draft');
});

test('MDX rejects missing quote sources, unregistered components and malformed bodies before rendering',async()=>{
 for(const body of ['', '<ClassicQuote source="missing" />','<Unknown />','<Phrase chinese="字" />','<Phrase {...props} />','export const surprise = 1','{unknownValue}','# Duplicate page title','<ClassicQuote','Inline <Phrase chinese="字" pinyin="zì" gloss="character" />.'])
  await assert.rejects(()=>compile(source(base,body),mdxOptions));
});

test('five readings render ordinary prose and canonical quotations in the shared layout',async()=>{
 const migratedIds = ['knowing-enough','knowing-yourself','learning-from-others','one-with-things','practice-and-joy'];
 assert.ok(migratedIds.every(id => readings.some(r => r.id === id)));
 for(const reading of readings.filter(r => migratedIds.includes(r.id))){
  const refs = Object.fromEntries(Object.entries(reading.sources).map(([name,ref])=>{
   const book = books.find(b=>b.chapters.some(c=>c.paragraphs.some(p=>p.id===ref.id)))!;
   return [name,resolveSource(book,ref)];
  }));
  const original = await readFile(join(readingsDirectory,`${reading.id}.mdx`),'utf8');
  assert.ok(!original.includes(refs.main.text),'canonical quotation must not be copied into MDX');
  const code = await compile(original,{...mdxOptions,outputFormat:'function-body'});
  const {default:Body} = await run(String(code),{...runtime,baseUrl:import.meta.url});
  const settings = {...emptyData('learning').settings,pinyin:false};
  const html = renderToStaticMarkup(createElement(ReadingLayout,{reading,related:[],actions:null,children:
   createElement(ReadingContext.Provider,{value:{reading,references:refs,settings,showDraftPinyin:true}},createElement(Body,{components:mdxComponents}))}));
  assert.ok(html.includes(refs.main.text));
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
  assert.match(html,/Sources and editorial notes/);
  assert.ok(!/lesson-progress|step-actions|Next question|Complete lesson/.test(html));
  const aid=pinyinForSource(refs.main);assert.ok(aid,`${reading.id} has correctly aligned pronunciation`);
  validateAids([aid],books);
 }
 for(const Page of [HomePage,ExplorePage]) {
  const html=renderToStaticMarkup(createElement(Page,{readings}));
  assert.ok(!/Start a lesson|Units|Lesson progress|prerequisite|3 stages/.test(html));
 }
 const stale=structuredClone(pinyinAids[0]);stale.tokens![0].start=9999;
 assert.throws(()=>validateAids([stale],books),/alignment/);
});

test('new saves, notes, backup and merge preserve old learning records verbatim',()=>{
 const old:Entry[]=[
  {recordId:'progress:knowing-enough@1',kind:'progress',updated:'2026-09-23',unitId:'knowing-enough',unitVersion:'1',step:'practice',exerciseId:'enough-word',completed:true,attempts:{'enough-word':{first:1,last:0,count:2,feedback:'Old feedback'}}},
  {recordId:'note:knowing-enough@1',kind:'note',updated:'2026-09-23',unitId:'knowing-enough',unitVersion:'1',ref:{id:'old-ref',version:'1',text:'旧引文',title:'Old note',source:''},draft:'unfinished '.repeat(1000),saved:'keep my note'},
  {recordId:'unknown-bookmark',kind:'bookmark',updated:'2026-09-23',ref:{id:'unknown',version:'unknown',text:'',title:'Unknown source',source:''}},
 ];
 const data={...emptyData('learning'),records:old};
 const reading=readings.find(r=>r.id==='knowing-enough')!;
 let next=toggleSaved(data,reading);next=writeNote(next,reading,'A new note',true);
 assert.deepEqual(next.records.slice(0,old.length),old);
 assert.equal(readingRecord(next,reading,'note')?.saved,'A new note');
 assert.deepEqual(parseData(backup(next),'learning').records,next.records);
 assert.deepEqual(mergeData(next,data).data.records,next.records);
 assert.deepEqual(data.records,old);
 assert.equal(recordReadingId(old[1]),reading.id);
 assert.equal(routeReadingId('unit',reading.id),reading.id);
 assert.equal(routeReadingId('reading',reading.id),reading.id);
 assert.deepEqual(toggleSaved(next,reading).records.filter(r=>old.some(o=>o.recordId===r.recordId)),old);
});

test('philosophy cards expose their question, focus and source without loading MDX',()=>{
  const enough=readings.find(r=>r.id==='knowing-enough')!;
  for(const query of ['知足','zhī zú','zhi zu','Daodejing','enough']) assert.ok(matchesReading(enough,query),query);
  assert.ok(!matchesReading(enough,'unrelated word'));
  for(const Page of [HomePage,ExplorePage]) {
    const html=renderToStaticMarkup(createElement(Page,{readings}));
    for(const text of [enough.title,enough.focus.chinese,'Daodejing']) assert.ok(html.includes(text));
  }
  assert.equal(readings.find(r=>r.id==='one-with-things')?.level,'building');
  assert.ok(readings.every(r=>r.review.status==='draft'));
 });
