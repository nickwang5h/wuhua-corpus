import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {jsonFile,root} from '../scripts/corpus-sources.js';
import {imageFiles} from '../scripts/corpus-normalize.js';
import {verifyImage,verifyImageBytes} from '../scripts/corpus-images.js';
import {validateBooks} from '../src/validate.js';
import {findImage,workForId} from '../src/index.js';
import {validatePilot,type Pilot} from '../scripts/corpus-route-pilot.js';
import type {TextBook} from '../src/types.js';

test('frozen legacy JSON files accept editorial metadata without changing their text identities',async()=>{
 for(const [id,chapters,paragraphs] of [['laozi',81,81],['lunyu',20,507],['zhuangzi',33,882]] as const){
  const bytes=await readFile(new URL(`src/books/${id}.json`,root));const text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);assert.ok(!text.startsWith('\uFEFF'));
  const book:TextBook=JSON.parse(text);validateBooks([book]);assert.equal(book.id,id);assert.equal(book.chapters.length,chapters);assert.equal(book.chapters.flatMap(c=>c.paragraphs).length,paragraphs);
  assert.deepEqual(Object.keys(book).sort(),['chapters','id','metadata']);assert.equal(book.metadata?.metadataMethod,'editorial');assert.ok(book.chapters.every(c=>c.images===undefined));
 }
});
test('file extraction retains the real figure and ignores navigation icons',()=>{
 assert.deepEqual(imageFiles('<div class="ws-header"><a class="image" href="/wiki/File:Logo.png"><img /></a></div><figure><a class="mw-file-description" href="/wiki/File:%E5%9C%96.jpg"><img /></a><figcaption>原圖</figcaption></figure>'),[{fileTitle:'File:圖.jpg',caption:'原圖'}]);
});
test('image-only chapter resolves, verifies actual bytes and rejects empty or fake text pages',async()=>{
 const book=await jsonFile<TextBook>('src/books/guguolunheng.json');validateBooks([book]);assert.equal(book.chapters.length,26);
 const chapter=book.chapters.find(c=>c.kind==='image')!;assert.equal(chapter.title,'成均圖');assert.deepEqual(chapter.paragraphs,[]);const im=chapter.images![0];
 assert.equal(workForId(im.id),book.id);assert.equal(findImage(book,im.id)?.image.asset,im.asset);await verifyImage(im);
 const bytes=await readFile(new URL('src/'+im.asset,root));const bad=Buffer.from(bytes);bad[20]^=1;assert.throws(()=>verifyImageBytes(im,bad),/changed/);
 const empty=structuredClone(book);empty.chapters.find(c=>c.kind==='image')!.images=[];assert.throws(()=>validateBooks([empty]),/Invalid chapter/);
 const placeholder=structuredClone(book);placeholder.chapters.find(c=>c.kind==='image')!.paragraphs=[{id:'fake',version:'1',text:'[图片]',aliases:[]}];assert.throws(()=>validateBooks([placeholder]),/placeholder/);
});
test('six reading samples have precise current references, boundaries and the Stage 6 bridge',async()=>{
 const pilot=await jsonFile<Pilot>('corpus/route-pilot.json');const results=await validatePilot(pilot);assert.equal(results.length,6);
 assert.deepEqual([...new Set(results.map(r=>r.step.work))],['daxue','shishuoxinyu','chuanxilu']);
 const story=results.find(r=>r.step.id==='shishuo-trust')!;assert.ok(story.passages[0].text.startsWith('陳太丘與友期行'));assert.ok(story.passages.at(-1)!.text.endsWith('元方入門不顧。'));
 const stale=structuredClone(pilot);stale.steps[0].refs[0].version='stale';await assert.rejects(()=>validatePilot(stale),/Stale/);
 const range=structuredClone(pilot);range.steps[0].refs[0].end=999999;await assert.rejects(()=>validatePilot(range),/range/);
 const bridge=structuredClone(pilot);bridge.steps.at(-1)!.requiresStages=[];await assert.rejects(()=>validatePilot(bridge),/bridge/);
});
