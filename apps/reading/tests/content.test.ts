import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,validateCatalog} from '../src/content/legacy/catalog';
import {convert as display,searchText} from '../src/content/display';
test('catalog validates independent editorial material without requiring an explanation',()=>{
 validateCatalog(catalog);const copy=structuredClone(catalog);copy.annotations=[];validateCatalog(copy);copy.passages[0].divisionId='missing';assert.throws(()=>validateCatalog(copy),/passage/);assert.equal(catalog.passages.length,18);for(const source of catalog.sources)assert.equal(source.rights.status,'unverified');
});
test('simplified display and search do not mutate original text or annotation symbols',async()=>{
 const text='學而時習之，不亦說乎？';assert.equal(await display(text,'simplified'),'学而时习之，不亦说乎？');assert.equal(await display(text,'original'),text);assert.equal(await searchText(text),await searchText('学而时习之，不亦说乎？'));assert.match(await display('由(之)[是]觀之。','simplified'),/\(之\)\[是\]/);assert.equal(await display('学而时习之','traditional'),'學而時習之');
});
