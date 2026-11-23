import {readFile,writeFile,readdir} from 'node:fs/promises';
import {validateBooks} from '../src/validate';
import type {TextBook} from '../src/types';
const dir=new URL('../src/books/',import.meta.url);
const names=(await readdir(dir)).filter(n=>/^[a-z0-9-]+\.json$/.test(n));
const books:TextBook[]=await Promise.all(names.map(async n=>JSON.parse(await readFile(new URL(n,dir),'utf8'))));validateBooks(books);
const order=['zhuangzi','laozi','lunyu'];books.sort((a,b)=>(order.includes(a.id)?order.indexOf(a.id):3)-(order.includes(b.id)?order.indexOf(b.id):3)||a.id.localeCompare(b.id));
await writeFile(new URL('../src/manifest.json',import.meta.url),JSON.stringify(books.map(b=>({id:b.id,chapters:b.chapters.map(({id,number,title,source})=>({id,number,title,source}))})),null,2)+'\n');
// The machine report keeps each book's counts from its import; corrections and withdrawals move them.
const reportFile=new URL('../corpus/report.json',import.meta.url);
const report=JSON.parse(await readFile(reportFile,'utf8'));
const size=(b:TextBook)=>{const paragraphs=b.chapters.flatMap(c=>c.paragraphs);return {chapters:b.chapters.length,paragraphs:paragraphs.length,characters:paragraphs.reduce((n,p)=>n+Array.from(p.text.replace(/\s/g,'')).length,0)};};
const sizes=new Map(books.map(b=>[b.id,size(b)]));
for(const row of report.rows)if(sizes.has(row.id))Object.assign(row,sizes.get(row.id));
const listed=new Set(report.rows.map((r:{id:string})=>r.id));
report.newCharacters=report.rows.reduce((n:number,r:{characters?:number})=>n+(r.characters??0),0);
report.characters=report.newCharacters+books.filter(b=>!listed.has(b.id)).reduce((n,b)=>n+sizes.get(b.id)!.characters,0);
await writeFile(reportFile,JSON.stringify(report,null,2)+'\n');
console.log('Updated navigation manifest only. No text or identity was regenerated.');
