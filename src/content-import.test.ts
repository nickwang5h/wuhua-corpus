import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { importXueEr } from '../scripts/import-xue-er';
import { catalog } from './content/catalog';
import { stageWikisource } from './content/wikisource';

const folder = new URL('../content/candidates/lunyu-xue-er/',import.meta.url);
const raw = await readFile(new URL('source.wikitext',folder),'utf8');

test('real pinned chapter reproduces the checked-in candidate offline',async()=>{
 const candidate = importXueEr(raw);
 assert.deepEqual(candidate,JSON.parse(await readFile(new URL('candidate.json',folder),'utf8')));
 assert.equal(candidate.passages.length,16);
 assert.equal(candidate.variants.length,5);
 assert.equal(candidate.source.revision,'2058123');
 assert.equal(candidate.source.edition,null);
 assert.equal(candidate.edition.status,'draft');
 assert.equal(candidate.source.processing.manuallyVerified,false);
 assert.equal(candidate.source.rights.license,'CC-BY-SA-4.0');
 assert.equal(candidate.passages[0].sentences[0].text,'子曰：「學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？」');
 for (const p of candidate.passages) {
  assert.equal(new URL(p.referenceUrl).searchParams.get('oldid'),'2058123');
  assert.equal(catalog.passages.some(active=>active.id===p.id),false);
  assert.ok(!/一作|錄音|\{\{|\[\[/.test(p.sentences[0].text));
 }
 assert.match(candidate.passages[13].sentences[0].text,/好學也已。/);
 assert.match(candidate.passages[14].sentences[0].text,/貧而樂，富而好禮/);
 assert.ok(candidate.variants.some(v=>v.note==='一作「貧而樂道」'));
});

test('chapter importer rejects changed section structure and unknown markup',()=>{
 for (const changed of [raw.replace('一之十六','一之十七'),raw.replace('子曰：','{{未知|正文}}子曰：'),raw.replace('<onlyinclude>',''),raw.replace('[[詩經|詩]]','[[未知|詩]]')]) {
  assert.throws(()=>importXueEr(changed));
 }
});

test('all staged references pin the revision and discard unrelated URL actions',()=>{
 const candidate=stageWikisource({sourceId:'test',pageUrl:'https://zh.wikisource.org/wiki/論語?oldid=1&action=edit#foo',revision:'2058123',edition:null,rights:{status:'unverified',license:null,evidenceUrl:null,verifiedAt:null},passages:[{id:'p',divisionId:'d',locator:'1',text:'文'}]});
 assert.equal(candidate.passages[0].referenceUrl,candidate.source.url);
 const url=new URL(candidate.passages[0].referenceUrl);
 assert.equal(url.search,'?oldid=2058123');
 assert.equal(url.hash,'');
});
