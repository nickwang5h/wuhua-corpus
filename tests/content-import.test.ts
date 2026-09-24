import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {readBook as loadBook} from '../scripts/read-book';
import {cleanText,convert,type Page} from '../scripts/import-wikisource';
import {fullBooks,splitSentences} from '../packages/content/src/legacy/fulltext';
import {manifest,findReference} from '../packages/content/src';
import {validateBooks} from '../packages/content/src/validate';
import {catalog,validateCatalog} from '../packages/content/src/legacy/catalog';
import {convert as display,searchText} from '../packages/content/src/display';
const snapshot=JSON.parse(await readFile(new URL('../public/texts/wikisource.json',import.meta.url),'utf8')) as {pages:Page[]};
test('three works rebuild offline from pinned snapshots; frozen identities match legacy links',async()=>{
 assert.equal(snapshot.pages.length,54);assert.deepEqual(convert(snapshot.pages),fullBooks);assert.deepEqual(fullBooks.map(b=>b.chapters.length),[33,81,20]);const books=await Promise.all(manifest.map(b=>loadBook(b.id)));validateBooks(books);
 for(const book of books)for(const chapter of book.chapters)for(const paragraph of chapter.paragraphs){assert.equal(splitSentences(paragraph.text).join(''),paragraph.text);for(const a of paragraph.aliases)assert.equal(findReference(book,a.id)?.ref.text,a.text);}
 assert.match(books[0].chapters[0].paragraphs[0].text,/^北冥有魚/);assert.match(books[1].chapters[80].paragraphs[0].text,/聖人之道，為而不爭。$/);
});
test('converter preserves primary readings and rejects unsupported templates',()=>{
 assert.equal(cleanText('子曰：「{{另2|《[[尚書|書]]》-{云}-：|另一斷句}}好學{{另|也已|也已矣}}。」<small>註解：現代解釋</small>'),'子曰：「《書》云：好學也已。」');assert.equal(cleanText('正文<ref>腳註</ref>。'),'正文。');assert.equal(cleanText('由(之)[是]觀之。'),'由(之)[是]觀之。');assert.throws(()=>cleanText('{{unknown|text}}'),/Unknown template/);assert.throws(()=>convert(snapshot.pages.slice(1)),/Incomplete/);
});
test('catalog validates independent editorial material without requiring an explanation',()=>{
 validateCatalog(catalog);const copy=structuredClone(catalog);copy.annotations=[];validateCatalog(copy);copy.passages[0].divisionId='missing';assert.throws(()=>validateCatalog(copy),/passage/);assert.equal(catalog.passages.length,18);for(const source of catalog.sources)assert.equal(source.rights.status,'unverified');
});
test('simplified display and search do not mutate original text or annotation symbols',async()=>{
 const text='學而時習之，不亦說乎？';assert.equal(await display(text,'simplified'),'学而时习之，不亦说乎？');assert.equal(await display(text,'original'),text);assert.equal(await searchText(text),await searchText('学而时习之，不亦说乎？'));assert.match(await display('由(之)[是]觀之。','simplified'),/\(之\)\[是\]/);assert.equal(await display('学而时习之','traditional'),'學而時習之');
});
