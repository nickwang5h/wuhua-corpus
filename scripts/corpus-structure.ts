import type {TextBook,Reference,Transition,Chapter,Paragraph} from '../src/types.js';
import {digest} from './corpus-sources.js';
import {validateBooks} from '../src/validate.js';

export type StructureOperation =
 | {op:'order'; chapters:string[]; reason:string}
 | {op:'split'; chapter:string; parts:{at:string; title:string}[]; parent?:string; reason:string}
 | {op:'title'; chapter:string; title:string; reason:string}
 | {op:'withdraw'; chapter:string; reason:string};
export type Structure = Record<string,StructureOperation[]>;
export type History = {records:Reference[]; transitions:Transition[]};

// Only short, unpunctuated title lines may be withdrawn.
export function shortTitle(text:string){
 const t=text.trim();
 const verse=/^(\S{4,7})\s+(\S{4,7})$/.exec(t);
 return t.length>0&&Array.from(t).length<=20&&!/[，。；：！？、「」『』“”,.;:!?【】〈〉]/.test(t)&&!(verse&&Array.from(verse[1]).length===Array.from(verse[2]).length&&!/^第/.test(verse[1]));
}
export function applyStructure(input:TextBook,structure:Structure){
 const book=structuredClone(input);
 const withdrawn:History={records:[],transitions:[]};
 for(const edit of structure[input.id]??[]){
  if(!edit.reason?.trim())throw new Error(`Structure reason missing: ${input.id}`);
  if(edit.op==='order'){
   const byId=new Map(book.chapters.map(c=>[c.id,c]));
   if(edit.chapters.length!==byId.size||new Set(edit.chapters).size!==byId.size||edit.chapters.some(id=>!byId.has(id)))throw new Error(`Invalid chapter order: ${input.id}`);
   book.chapters=edit.chapters.map(id=>byId.get(id)!);
  }else{
   const index=book.chapters.findIndex(c=>c.id===edit.chapter);
   if(index<0)throw new Error(`Structure chapter missing: ${edit.chapter}`);
   const chapter=book.chapters[index];
   if(edit.op==='title'){
    if(!edit.title.trim())throw new Error('Empty structure title');
    chapter.title=edit.title;
   }else if(edit.op==='split'){
    const starts=edit.parts.map(p=>chapter.paragraphs.findIndex(q=>q.id===p.at));
    if(chapter.images?.length||!starts.length||starts[0]!==0||starts.some((n,i)=>n<0||(i>0&&n<=starts[i-1]))||edit.parts.some(p=>!p.title.trim()))throw new Error(`Invalid split: ${chapter.id}`);
    const pieces=edit.parts.map((p,i)=>({...chapter,id:i===0?chapter.id:`${chapter.id}-${String(i+1).padStart(2,'0')}`,title:p.title,...(edit.parent?{path:[...(chapter.path??[]),edit.parent]}:{}),paragraphs:chapter.paragraphs.slice(starts[i],starts[i+1])}));
    book.chapters.splice(index,1,...pieces);
   }else if(edit.op==='withdraw'){
    if(chapter.images?.length||!chapter.paragraphs.length||chapter.paragraphs.some(p=>!shortTitle(p.text)||p.aliases.length)||chapter.paragraphs.reduce((n,p)=>n+Array.from(p.text).length,0)>60)throw new Error(`Withdrawal requires title-only chapter: ${chapter.id}`);
    for(const p of chapter.paragraphs){
     withdrawn.records.push({id:p.id,version:p.version,text:p.text,title:chapter.title,source:chapter.source});
     withdrawn.transitions.push({from:{id:p.id,version:p.version},kind:'withdrawn',reason:edit.reason,targets:[]});
    }
    book.chapters.splice(index,1);
   }else throw new Error('Unknown structure operation');
  }
 }
 book.chapters.forEach((c,i)=>{c.number=i+1;});
 validateBooks([book]);
 return {book,withdrawn};
}
export function retainWithdrawals(history:History,withdrawn:History):History{
 const result=structuredClone(history);
 for(const record of withdrawn.records){
  const old=result.records.find(r=>r.id===record.id&&r.version===record.version);
  if(old&&JSON.stringify(old)!==JSON.stringify(record))throw new Error(`Withdrawal history changed: ${record.id}`);
  if(!old)result.records.push(record);
 }
 for(const transition of withdrawn.transitions){
  const old=result.transitions.find(t=>t.from.id===transition.from.id&&t.from.version===transition.from.version);
  if(old&&JSON.stringify(old)!==JSON.stringify(transition))throw new Error(`Withdrawal transition changed: ${transition.from.id}`);
  if(!old)result.transitions.push(transition);
 }
 return result;
}

// Retain the pre-edit layout without duplicating body text or depending on raw caches.
export type StructureInput = {sha256:string; chapters:(Omit<Chapter,'paragraphs'> & {withdrawn?:Omit<Paragraph,'text'>[]})[]};
export function structureInput(book:TextBook,structure:Structure):StructureInput{
 const removed=new Set((structure[book.id]??[]).filter(e=>e.op==='withdraw').map(e=>e.chapter));
 return {sha256:digest(JSON.stringify(book)),chapters:book.chapters.map(({paragraphs,...chapter})=>({...chapter,...(removed.has(chapter.id)?{withdrawn:paragraphs.map(({text,...p})=>p)}:{})}))};
}
export function restoreStructureInput(book:TextBook,input:StructureInput,structure:Structure,history:History):TextBook{
 const chapters=new Map(book.chapters.map(c=>[c.id,c]));
 const original={...book,chapters:input.chapters.map(({withdrawn,...chapter})=>{
  let paragraphs:Paragraph[];
  if(withdrawn)paragraphs=withdrawn.map(p=>{
   const record=history.records.find(r=>r.id===p.id&&r.version===p.version);
   if(!record)throw new Error(`Missing withdrawn source paragraph: ${p.id}`);
   return {id:p.id,version:p.version,text:record.text,...Object.fromEntries(Object.entries(p).filter(([key])=>key!=='id'&&key!=='version'))} as Paragraph;
  });
  else{
   const split=structure[book.id]?.find(e=>e.op==='split'&&e.chapter===chapter.id);
   const ids=split?.op==='split'?split.parts.map((_,i)=>i===0?chapter.id:`${chapter.id}-${String(i+1).padStart(2,'0')}`):[chapter.id];
   paragraphs=ids.flatMap(id=>{
    const current=chapters.get(id);
    if(!current)throw new Error(`Missing structural chapter: ${id}`);
    return current.paragraphs;
   });
  }
  return {...chapter,paragraphs};
 })};
 if(digest(JSON.stringify(original))!==input.sha256)throw new Error(`Pre-edit source mismatch: ${book.id}`);
 return original;
}
