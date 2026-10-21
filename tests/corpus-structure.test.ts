import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir} from 'node:fs/promises';
import {applyStructure,retainWithdrawals,restoreStructureInput,type StructureInput,type Structure,type History} from '../scripts/corpus-structure.js';
import {asSourced} from '../scripts/corpus.js';
import {jsonFile,digest} from '../scripts/corpus-sources.js';
import type {TextBook} from '../src/types.js';
import {validateHistory} from '../src/validate.js';

test('structure preserves every paragraph identity, version, text and heading, except recorded withdrawals',async()=>{
 const structure=await jsonFile<Structure>('corpus/structure.json');
 const history=await jsonFile<History>('src/history.json');
 const tuples=(book:TextBook)=>book.chapters.flatMap(c=>c.paragraphs.map(p=>JSON.stringify([p.id,p.version,p.text]))).sort();
 for(const name of await readdir(new URL('../src/books/',import.meta.url))){
  if(!name.endsWith('.json'))continue;
  const current=await jsonFile<TextBook>(`src/books/${name}`);
  const original=structure[current.id]?restoreStructureInput(asSourced(current,history.records),(await jsonFile<{structureInput:StructureInput}>(`sources/corpus/${current.id}.json`)).structureInput,structure,history):current;
  const result={original,...applyStructure(original,structure)};
  const {book,withdrawn}=result;
  // Inserted paragraphs are the only ones the source never had.
  const inserted=new Set((structure[current.id]??[]).flatMap(e=>e.op==='insert'?e.paragraphs.map(p=>p.id):[]));
  const kept={...book,chapters:book.chapters.map(c=>({...c,paragraphs:c.paragraphs.filter(p=>!inserted.has(p.id))}))};
  assert.deepEqual(tuples(original),[...tuples(kept),...withdrawn.records.map(p=>JSON.stringify([p.id,p.version,p.text]))].sort(),current.id);
  const before=new Map(original.chapters.flatMap(c=>c.paragraphs.map(p=>[p.id,p] as const)));
  for(const chapter of kept.chapters)for(const p of chapter.paragraphs)assert.deepEqual(p,before.get(p.id),p.id);
  assert.deepEqual(book,structure[current.id]?asSourced(current,history.records):current,current.id);
  assert.deepEqual(retainWithdrawals(history,withdrawn),history,current.id);
  for(const p of withdrawn.records){
   assert.ok(history.records.some(r=>r.id===p.id&&r.version===p.version&&r.text===p.text));
   // A corrected paragraph is withdrawn at the version its corrections reached.
   let version=p.version;
   for(let next;(next=history.transitions.find(t=>t.kind==='revision'&&t.from.id===p.id&&t.from.version===version));)version=next.targets[0].version;
   assert.ok(history.transitions.some(t=>t.from.id===p.id&&t.from.version===version&&t.kind==='withdrawn'&&t.reason&&t.targets.length===0));
  }
  validateHistory(withdrawn.records,withdrawn.transitions,book.chapters.flatMap(c=>c.paragraphs.map(p=>({...p,title:c.title,source:c.source}))));
 }
});

test('a move places a contiguous run after another paragraph and nothing else',async()=>{
 const book=await jsonFile<TextBook>('src/books/lunyu.json');
 const chapter=book.chapters[0];
 const ids=chapter.paragraphs.map(p=>p.id);
 const {book:moved}=applyStructure(book,{lunyu:[{op:'move',chapter:chapter.id,paragraphs:ids.slice(1,3),after:ids[4],reason:'test'}]});
 assert.deepEqual(moved.chapters[0].paragraphs.map(p=>p.id),[ids[0],ids[3],ids[4],ids[1],ids[2],...ids.slice(5)]);
 assert.throws(()=>applyStructure(book,{lunyu:[{op:'move',chapter:chapter.id,paragraphs:[ids[1],ids[3]],after:ids[4],reason:'test'}]}),/Invalid move/);
 assert.throws(()=>applyStructure(book,{lunyu:[{op:'move',chapter:chapter.id,paragraphs:[ids[1]],after:ids[1],reason:'test'}]}),/Invalid move/);
});

test('a withdrawn run, a relocated run and an inserted run change only what they name',async()=>{
 const book=await jsonFile<TextBook>('src/books/lunyu.json');
 for(const c of book.chapters)for(const p of c.paragraphs)p.aliases=[];
 const [first,second]=book.chapters;
 const a=first.paragraphs.map(p=>p.id),b=second.paragraphs.map(p=>p.id);
 const {book:out,withdrawn}=applyStructure(book,{lunyu:[
  {op:'withdraw-run',chapter:first.id,paragraphs:a.slice(1,3),reason:'test'},
  {op:'relocate',chapter:second.id,from:first.id,paragraphs:a.slice(3,5),after:b[0],reason:'test'},
  {op:'insert',chapter:first.id,source:'https://zh.wikisource.org/w/index.php?oldid=1',paragraphs:[{id:'p-lunyu-test-a0001',text:'子曰'}],reason:'test'},
 ]});
 assert.deepEqual(out.chapters[0].paragraphs.map(p=>p.id),['p-lunyu-test-a0001',a[0],...a.slice(5)]);
 assert.deepEqual(out.chapters[1].paragraphs.map(p=>p.id),[b[0],a[3],a[4],...b.slice(1)]);
 assert.deepEqual(withdrawn.records.map(r=>r.id),a.slice(1,3));
 assert.equal(out.chapters[0].paragraphs[0].version,`sha256:${digest('子曰')}`);
 assert.throws(()=>applyStructure(book,{lunyu:[{op:'withdraw-run',chapter:first.id,paragraphs:[a[1],a[3]],reason:'test'}]}),/Invalid withdrawal/);
 assert.throws(()=>applyStructure(book,{lunyu:[{op:'withdraw-run',chapter:first.id,paragraphs:a,reason:'test'}]}),/Invalid withdrawal/);
 assert.throws(()=>applyStructure(book,{lunyu:[{op:'relocate',chapter:first.id,from:first.id,paragraphs:a.slice(1,2),reason:'test'}]}),/Invalid relocation/);
 assert.throws(()=>applyStructure(book,{lunyu:[{op:'insert',chapter:first.id,source:'https://example.com/',paragraphs:[{id:'p-lunyu-test-a0001',text:'子曰'}],reason:'test'}]}),/Invalid insertion/);
 assert.throws(()=>applyStructure(book,{lunyu:[{op:'insert',chapter:first.id,source:'https://zh.wikisource.org/w/index.php?oldid=1',paragraphs:[{id:'p-mengzi-test-a0001',text:'子曰'}],reason:'test'}]}),/Invalid insertion/);
});

test('structure rejects incomplete orders, missing boundaries, body withdrawals and missing reasons',async()=>{
 const book=await jsonFile<TextBook>('src/books/lunyu.json');
 const chapter=book.chapters[0];
 assert.throws(()=>applyStructure(book,{lunyu:[{op:'order',chapters:[chapter.id],reason:'test'}]}),/Invalid chapter order/);
 assert.throws(()=>applyStructure(book,{lunyu:[{op:'split',chapter:chapter.id,parts:[{at:'missing',title:'test'}],reason:'test'}]}),/Invalid split/);
 assert.throws(()=>applyStructure(book,{lunyu:[{op:'withdraw',chapter:chapter.id,reason:'test'}]}),/title-only/);
 assert.throws(()=>applyStructure(book,{lunyu:[{op:'title',chapter:chapter.id,title:'test',reason:''}]}),/reason missing/);
 const titleOnly=structuredClone(book);
 titleOnly.chapters[0].paragraphs=[{...chapter.paragraphs[0],text:'甲'.repeat(21),aliases:[]}];
 assert.throws(()=>applyStructure(titleOnly,{lunyu:[{op:'withdraw',chapter:chapter.id,reason:'test'}]}),/title-only/);
 titleOnly.chapters[0].paragraphs=Array.from({length:4},(_,i)=>({...chapter.paragraphs[0],id:`title-${i}`,text:'甲'.repeat(16),aliases:[]}));
 assert.throws(()=>applyStructure(titleOnly,{lunyu:[{op:'withdraw',chapter:chapter.id,reason:'test'}]}),/title-only/);
});
