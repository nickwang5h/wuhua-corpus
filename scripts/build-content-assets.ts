import {mkdir,writeFile} from 'node:fs/promises';
import {manifest,contentRelease} from '../packages/content/src';
import {validateBooks} from '../packages/content/src/validate';
import {readBook} from './read-book';
const books=await Promise.all(manifest.map(b=>readBook(b.id)));validateBooks(books);
const dir=new URL('../public/texts/books/',import.meta.url);await mkdir(dir,{recursive:true});
for(const book of books)await writeFile(new URL(`${book.id}.json`,dir),JSON.stringify({...book,release:contentRelease})+'\n');
console.log('Prepared local text assets for both apps.');
