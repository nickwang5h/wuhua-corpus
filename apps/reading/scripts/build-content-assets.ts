import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {manifest,contentRelease} from '@wuhua/corpus';
import {readBook} from '@wuhua/corpus/node';
import {validateBooks} from '@wuhua/corpus/validate';
import lock from '../corpus-lock.json';
import pkg from '@wuhua/corpus/package.json';
if(lock.release!==contentRelease||lock.package!==pkg.version)throw new Error('Corpus lock mismatch');
const books=await Promise.all(manifest.map(b=>readBook(b.id)));validateBooks(books);
const root=new URL(`../public/releases/${contentRelease}/`,import.meta.url);
await mkdir(new URL('books/',root),{recursive:true});
for(const book of books)await writeFile(new URL(`books/${book.id}.json`,root),JSON.stringify({...book,release:contentRelease})+'\n');
await writeFile(new URL('manifest.json',root),JSON.stringify({release:contentRelease,books:manifest})+'\n');
// Retain the public source-snapshot URL without owning an editable copy.
const snapshot=await readFile(new URL(import.meta.resolve('@wuhua/corpus/sources/wikisource.json')));
await mkdir(new URL('../public/texts/',import.meta.url),{recursive:true});
await writeFile(new URL('../public/texts/wikisource.json',import.meta.url),snapshot);
console.log(`Prepared product-local Corpus ${contentRelease}`);
