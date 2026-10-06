import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir} from 'node:fs/promises';
import {applyMetadata,type EditorialMetadata} from '../scripts/corpus-metadata.js';
import {jsonFile} from '../scripts/corpus-sources.js';
import {validateBooks} from '../src/validate.js';
import type {TextBook} from '../src/types.js';

test('editorial metadata covers every book and changes no fields outside metadata',async()=>{
 const metadata=await jsonFile<EditorialMetadata>('corpus/metadata.json');
 const names=(await readdir(new URL('../src/books/',import.meta.url))).filter(n=>n.endsWith('.json'));
 assert.deepEqual(Object.keys(metadata).sort(),names.map(n=>n.slice(0,-5)).sort());
 for(const name of names){
  const current=await jsonFile<TextBook>(`src/books/${name}`);
  const input=structuredClone(current);
  if(['laozi','lunyu','zhuangzi'].includes(input.id))delete input.metadata;
  else input.metadata={...input.metadata!,author:'Upstream commentator',era:'Upstream era',metadataMethod:'source-fields',needsReview:true};
  const snapshot=structuredClone(input);
  const result=applyMetadata(input,metadata);
  const {metadata:before,...original}=input;
  const {metadata:after,...updated}=result;
  assert.deepEqual(updated,original,input.id);
  assert.deepEqual(input,snapshot,input.id);
  assert.equal(after?.author,metadata[input.id].author);
  assert.equal(after?.era,metadata[input.id].era);
  assert.equal(after?.metadataMethod,'editorial');
  assert.equal(after?.needsReview,false);
  assert.deepEqual(applyMetadata(result,metadata),result,input.id);
  assert.deepEqual(result,current,input.id);
  validateBooks([result]);
 }
});

test('editorial metadata rejects incomplete entries and invalid review state',async()=>{
 const book=await jsonFile<TextBook>('src/books/zhouyi.json');
 assert.throws(()=>applyMetadata(book,{zhouyi:{author:'',era:'先秦'}}),/Incomplete editorial metadata/);
 assert.equal(applyMetadata(book,{}),book);
 const edited=applyMetadata(book,{zhouyi:{author:'佚名',era:'西周至战国'}});
 assert.throws(()=>validateBooks([{...edited,metadata:{...edited.metadata!,needsReview:true}}]),/Invalid metadata/);
 assert.throws(()=>validateBooks([{...edited,metadata:{...edited.metadata!,era:''}}]),/Invalid metadata/);
});
