import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {readBook as loadBook} from '../scripts/read-book';
import {cleanText,convert,type Page} from '../scripts/import-wikisource';
import {manifest,findReference} from '../src';
import {validateBooks} from '../src/validate';
const snapshot=JSON.parse(await readFile(new URL('../sources/wikisource.json',import.meta.url),'utf8')) as {pages:Page[]};
test('three works rebuild offline from pinned snapshots; frozen identities match legacy links',async()=>{
 assert.equal(snapshot.pages.length,54);assert.deepEqual(convert(snapshot.pages).map(b=>b.chapters.length),[33,81,20]);const books=await Promise.all(manifest.map(b=>loadBook(b.id)));validateBooks(books);
 for(const book of books)for(const chapter of book.chapters)for(const paragraph of chapter.paragraphs){for(const a of paragraph.aliases)assert.equal(findReference(book,a.id)?.ref.text,a.text);}
 assert.match(books[0].chapters[0].paragraphs[0].text,/^北冥有魚/);assert.match(books[1].chapters[80].paragraphs[0].text,/聖人之道，為而不爭。$/);
});
test('converter preserves primary readings and rejects unsupported templates',()=>{
 assert.equal(cleanText('子曰：「{{另2|《[[尚書|書]]》-{云}-：|另一斷句}}好學{{另|也已|也已矣}}。」<small>註解：現代解釋</small>'),'子曰：「《書》云：好學也已。」');assert.equal(cleanText('正文<ref>腳註</ref>。'),'正文。');assert.equal(cleanText('由(之)[是]觀之。'),'由(之)[是]觀之。');assert.throws(()=>cleanText('{{unknown|text}}'),/Unknown template/);assert.throws(()=>convert(snapshot.pages.slice(1)),/Incomplete/);
});
