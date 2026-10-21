/**
 * Apply corpus/structure.json to books already in src/books, keeping their corrections:
 *
 *   npm run content:structure -- <book> [<book> ...]
 *
 * The pre-edit layout is restored from the source record (or is the book itself, for a
 * book without one), the whole structure is applied to it, and each paragraph that
 * survives keeps its current text and correction. The source record gets the new layout
 * and hash, history gets any withdrawals, and the manifest is rebuilt afterwards with
 * `npm run content:catalog`.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {applyStructure,retainWithdrawals,restoreStructureInput,structureInput,type Structure,type History,type StructureInput} from './corpus-structure.js';
import {asSourced} from './corpus.js';
import {digest} from './corpus-sources.js';
import type {TextBook} from '../src/types.js';

const ids=process.argv.slice(2);
if(!ids.length)throw new Error('Usage: content:structure <book> [<book> ...]');
// Written back with each file's own indentation and final newline.
const raw=new Map<string,string>();
const read=<T>(f:string):T=>{const s=readFileSync(f,'utf8');raw.set(f,s);return JSON.parse(s);};
const write=(f:string,data:unknown)=>{const s=raw.get(f)!;writeFileSync(f,JSON.stringify(data,null,/\n( +)/.exec(s)?.[1].length??2)+(s.endsWith('\n')?'\n':''));};
const structure=read<Structure>('corpus/structure.json');
let history=read<History>('src/history.json');
const results:[string,TextBook,unknown][]=[];
for(const id of ids){
 const current=read<TextBook>(`src/books/${id}.json`);
 const source=read<{normalizedSha256:string;structureInput?:StructureInput}>(`sources/corpus/${id}.json`);
 const sourced=asSourced(current,history.records);
 const original=source.structureInput?restoreStructureInput(sourced,source.structureInput,structure,history):sourced;
 const {book,withdrawn}=applyStructure(original,structure);
 const corrected=new Map(current.chapters.flatMap(c=>c.paragraphs.map(p=>[p.id,p] as const)));
 // A corrected paragraph leaves at its corrected version, so history keeps that text too.
 const where=new Map(current.chapters.flatMap(c=>c.paragraphs.map(p=>[p.id,c] as const)));
 for(const r of withdrawn.records){
  const p=corrected.get(r.id)!;
  if(p.sourceText!==undefined&&!history.records.some(x=>x.id===p.id&&x.version===p.version))history={...history,records:[...history.records,{id:p.id,version:p.version,text:p.text,title:where.get(p.id)!.title,source:where.get(p.id)!.source}]};
 }
 const result:TextBook={...book,chapters:book.chapters.map(c=>({...c,paragraphs:c.paragraphs.map(p=>corrected.get(p.id)??p)}))};
 history=retainWithdrawals(history,withdrawn);
 if(digest(JSON.stringify(asSourced(result,history.records)))!==digest(JSON.stringify(book)))throw new Error(`${id}: corrections do not carry over`);
 results.push([id,result,{...source,normalizedSha256:digest(JSON.stringify(book)),...(structure[id]?.length?{structureInput:structureInput(original,structure)}:{})}]);
 console.log(`${id}: ${withdrawn.records.length} paragraphs withdrawn`);
}
// Nothing is written until every book has gone through.
for(const [id,book,source] of results){write(`src/books/${id}.json`,book);write(`sources/corpus/${id}.json`,source);}
write('src/history.json',history);
