/**
 * Count, book by book, the things a reader would see as damage in the text:
 *
 *   npm run corpus:audit              print the table and write corpus/quality.json
 *   npm run corpus:audit -- --check   fail when a book has more of any defect than corpus/quality.json records
 *
 * check:content proves identity, versions and sources; it says nothing about how the text reads.
 * These counts are mechanical and deliberately crude: they rank books for collation and stop a
 * release from quietly getting worse. A count of zero is not a proof-read text.
 */
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import * as OpenCC from 'opencc-js';
import type {TextBook} from '../src/types.js';

type Row={id:string;title:string;provider:string;script:'简'|'繁'|'混';characters:number;punctuationPer100:number;defects:Record<Defect,number>};
const DEFECTS=['privateUse','placeholder','composite','sourceTag','halfWidth','latin','kana','innerSpace','unbalancedChapters','unpunctuatedChapters'] as const;
type Defect=typeof DEFECTS[number];

const han=/[㐀-鿿\u{20000}-\u{3ffff}]/gu;
const count=(text:string,pattern:RegExp)=>text.match(pattern)?.length??0;
const toSimplified=OpenCC.Converter({from:'t',to:'cn'}),toTraditional=OpenCC.Converter({from:'cn',to:'t'});
const changed=(a:string,b:string)=>{let n=0;const x=Array.from(a),y=Array.from(b);for(let i=0;i<x.length;i++)if(x[i]!==y[i])n++;return n;};
const PAIRS=[['“','”'],['「','」'],['『','』'],['《','》']];

function audit(book:TextBook,provider:string):Row{
 const defects=Object.fromEntries(DEFECTS.map(d=>[d,0])) as Record<Defect,number>;
 let characters=0,marks=0,simplified=0,traditional=0;
 for(const chapter of book.chapters){
  const paragraphs=chapter.paragraphs??[];
  const whole=paragraphs.map(p=>p.text).join('');
  const chapterHan=count(whole,han);
  if(!chapterHan)continue;
  characters+=chapterHan;
  const chapterMarks=count(whole,/[，。、；：？！]/g);
  marks+=chapterMarks;
  // A sample is enough to tell the script, and keeps the conversion cheap on the long histories.
  const sample=whole.slice(0,20000);
  traditional+=changed(sample,toSimplified(sample));
  simplified+=changed(sample,toTraditional(sample));
  // Glyphs the source kept in the private use area: blank on a reader's screen.
  defects.privateUse+=count(whole,/[-\u{f0000}-\u{10ffff}]/gu);
  // A box or a black square where the source had no character.
  defects.placeholder+=count(whole,/[□■▉�]/g);
  // A character spelled out from its parts: {白大}, [斯/瓦], <囗睾>.
  defects.composite+=count(whole,/[{[<][㐀-鿿\/+]{2,4}[}\]>]/g);
  // Shelf marks and similar markup of the source: <史部,正史类,史记>.
  defects.sourceTag+=count(whole,/<[^<>]*[,，][^<>]*>/g);
  const text=whole.replace(/<[^<>]*[,，][^<>]*>/g,'');
  // Western punctuation between Chinese characters.
  defects.halfWidth+=count(text,/(?<=[㐀-鿿」』”’》）])[,;:?!](?=[㐀-鿿「『“‘《（」』”’]|$)/gm);
  defects.latin+=count(whole,/[A-Za-z]+/g);
  defects.kana+=count(whole,/[぀-ヿ]/g);
  defects.innerSpace+=count(whole,/(?<=[㐀-鿿]) +(?=[㐀-鿿])/g);
  if(PAIRS.some(([open,close])=>whole.split(open).length!==whole.split(close).length))defects.unbalancedChapters++;
  if(chapterHan>300&&chapterMarks<chapterHan/40)defects.unpunctuatedChapters++;
 }
 const script=simplified>traditional*5?'简':traditional>simplified*5?'繁':'混';
 return {id:book.id,title:book.metadata?.title??book.id,provider,script,characters,punctuationPer100:Math.round(1000*marks/Math.max(characters,1))/10,defects};
}

const dir=new URL('../src/books/',import.meta.url);
const rows:Row[]=[];
for(const name of readdirSync(dir).filter(n=>n.endsWith('.json')).sort()){
 const book:TextBook=JSON.parse(readFileSync(new URL(name,dir),'utf8'));
 const source=new URL(`../sources/corpus/${book.id}.json`,import.meta.url);
 rows.push(audit(book,existsSync(source)?JSON.parse(readFileSync(source,'utf8')).provider:'zhwikisource-legacy'));
}

const file=new URL('../corpus/quality.json',import.meta.url);
if(process.argv.includes('--check')){
 const before:Row[]=JSON.parse(readFileSync(file,'utf8')).books;
 const worse:string[]=[];
 for(const row of rows){
  const old=before.find(b=>b.id===row.id);
  // A book the record has not seen starts from zero: it must come in clean or be recorded on purpose.
  for(const d of DEFECTS)if(row.defects[d]>(old?.defects[d]??0))worse.push(`${row.id}: ${d} ${old?.defects[d]??0} → ${row.defects[d]}`);
 }
 if(worse.length){console.error(worse.join('\n'));throw new Error(`${worse.length} counts got worse than corpus/quality.json; fix the text or, if the new count is right, run corpus:audit to record it`);}
 console.log(`Quality audit: ${rows.length} books, no count worse than recorded.`);
}else{
 const total=Object.fromEntries(DEFECTS.map(d=>[d,rows.reduce((n,r)=>n+r.defects[d],0)]));
 writeFileSync(file,JSON.stringify({total,books:rows},null,1)+'\n');
 const pad=(s:string|number,n:number)=>String(s).padStart(n);
 console.log('book'.padEnd(24)+'source'.padEnd(20)+'字'+pad('chars',9)+pad('p/100',7)+DEFECTS.map(d=>pad(d.replace('Chapters','Ch').slice(0,10),11)).join(''));
 for(const r of rows)console.log(r.id.padEnd(24)+r.provider.padEnd(20)+r.script+pad(r.characters,9)+pad(r.punctuationPer100,7)+DEFECTS.map(d=>pad(r.defects[d]||'·',11)).join(''));
 console.log('total'.padEnd(45)+pad(rows.reduce((n,r)=>n+r.characters,0),9)+pad('',7)+DEFECTS.map(d=>pad(total[d],11)).join(''));
}
