import test from 'node:test';
import assert from 'node:assert/strict';
import {readBook} from '../scripts/read-book';
import {manifest,transitions,concepts} from '../src';
import {readHistory} from '../scripts/history-store';
import {validateAids,validateHistory} from '../src/validate';
import {pinyinAids} from '../src/pinyin';
import {editorialAids} from '../src/editorial';
test('history, pinyin and editorial references resolve against canonical versions',async()=>{
 const books=await Promise.all(manifest.map(b=>readBook(b.id)));
 validateAids([...pinyinAids,...editorialAids],books);
 validateHistory(readHistory().records,transitions,books.flatMap(b=>b.chapters.flatMap(c=>c.paragraphs.map(p=>({...p,title:c.title,source:c.source})))));
 assert.ok(pinyinAids.length);assert.ok(editorialAids.length);
 const invalid=structuredClone(pinyinAids);invalid[0].version='missing';assert.throws(()=>validateAids(invalid,books));
 for(const [id,concept] of Object.entries(concepts))assert.equal(concept.id,id);
});
