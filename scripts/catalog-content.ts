import {readFile,writeFile,readdir} from 'node:fs/promises';
import {validateBooks} from '../src/validate';
import type {TextBook} from '../src/types';
const dir=new URL('../src/books/',import.meta.url);
const names=(await readdir(dir)).filter(n=>/^[a-z0-9-]+\.json$/.test(n));
const books:TextBook[]=await Promise.all(names.map(async n=>JSON.parse(await readFile(new URL(n,dir),'utf8'))));validateBooks(books);
const order=['zhuangzi','laozi','lunyu'];books.sort((a,b)=>(order.includes(a.id)?order.indexOf(a.id):3)-(order.includes(b.id)?order.indexOf(b.id):3)||a.id.localeCompare(b.id));
await writeFile(new URL('../src/manifest.json',import.meta.url),JSON.stringify(books.map(b=>({id:b.id,chapters:b.chapters.map(({id,number,title,source})=>({id,number,title,source}))})),null,2)+'\n');
console.log('Updated navigation manifest only. No text or identity was regenerated.');
