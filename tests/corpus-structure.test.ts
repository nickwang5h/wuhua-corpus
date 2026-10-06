import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir} from 'node:fs/promises';
import {applyStructure,retainWithdrawals,restoreStructureInput,type StructureInput,type Structure,type History} from '../scripts/corpus-structure.js';
import {asSourced} from '../scripts/corpus.js';
import {jsonFile} from '../scripts/corpus-sources.js';
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
  assert.deepEqual(tuples(original),[...tuples(book),...withdrawn.records.map(p=>JSON.stringify([p.id,p.version,p.text]))].sort(),current.id);
  const before=new Map(original.chapters.flatMap(c=>c.paragraphs.map(p=>[p.id,p] as const)));
  for(const chapter of book.chapters)for(const p of chapter.paragraphs)assert.deepEqual(p,before.get(p.id),p.id);
  assert.deepEqual(book,structure[current.id]?asSourced(current,history.records):current,current.id);
  assert.deepEqual(retainWithdrawals(history,withdrawn),history,current.id);
  for(const p of withdrawn.records){
   assert.ok(history.records.some(r=>r.id===p.id&&r.version===p.version&&r.text===p.text));
   assert.ok(history.transitions.some(t=>t.from.id===p.id&&t.from.version===p.version&&t.kind==='withdrawn'&&t.reason&&t.targets.length===0));
  }
  validateHistory(withdrawn.records,withdrawn.transitions,book.chapters.flatMap(c=>c.paragraphs.map(p=>({...p,title:c.title,source:c.source}))));
 }
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
