import type {TextBook,Reference,Transition,Chapter,Paragraph} from '../src/types.js';
import {digest} from './corpus-sources.js';
import {validateBooks,pinnedSource} from '../src/validate.js';

export type StructureOperation =
 | {op:'order'; chapters:string[]; reason:string}
 | {op:'split'; chapter:string; parts:{at:string; title:string}[]; parent?:string; reason:string}
 | {op:'title'; chapter:string; title:string; reason:string}
 | {op:'withdraw'; chapter:string; reason:string}
 | {op:'withdraw-tail'; chapter:string; paragraphs:string[]; reason:string}
 | {op:'move'; chapter:string; paragraphs:string[]; after:string; reason:string}
 | {op:'withdraw-run'; chapter:string; paragraphs:string[]; reason:string}
 | {op:'relocate'; chapter:string; from:string; paragraphs:string[]; after?:string; reason:string}
 | {op:'insert'; chapter:string; after?:string; source:string; paragraphs:{id:string;text:string}[]; reason:string};
export type Structure = Record<string,StructureOperation[]>;
export type History = {records:Reference[]; transitions:Transition[]};

// Only short, unpunctuated title lines may be withdrawn.
export function shortTitle(text:string){
 const t=text.trim();
 const verse=/^(\S{4,7})\s+(\S{4,7})$/.exec(t);
 return t.length>0&&Array.from(t).length<=20&&!/[，。；：！？、「」『』“”,.;:!?【】〈〉]/.test(t)&&!(verse&&Array.from(verse[1]).length===Array.from(verse[2]).length&&!/^第/.test(verse[1]));
}
// The paragraphs named, in order and adjacent, within a chapter; empty when they are not.
function run(chapter:Chapter,ids:string[]){
 const start=chapter.paragraphs.findIndex(p=>p.id===ids[0]);
 const found=start<0?[]:chapter.paragraphs.slice(start,start+ids.length);
 return ids.length&&found.length===ids.length&&found.every((p,i)=>p.id===ids[i])?{start,found}:{start:-1,found:[]};
}
// Where a run goes: after the named paragraph, or at the start when none is named.
function position(chapter:Chapter,after:string|undefined){
 return after===undefined?0:chapter.paragraphs.findIndex(p=>p.id===after)+1;
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
   }else if(edit.op==='move'){
    // A contiguous run of paragraphs placed after another paragraph of the same chapter, e.g. a commentary block the source put out of order.
    const start=chapter.paragraphs.findIndex(p=>p.id===edit.paragraphs[0]);
    const run=start<0?[]:chapter.paragraphs.slice(start,start+edit.paragraphs.length);
    const rest=chapter.paragraphs.filter(p=>!edit.paragraphs.includes(p.id));
    const at=rest.findIndex(p=>p.id===edit.after);
    if(!edit.paragraphs.length||run.length!==edit.paragraphs.length||run.some((p,i)=>p.id!==edit.paragraphs[i])||at<0)throw new Error(`Invalid move: ${chapter.id}`);
    chapter.paragraphs=[...rest.slice(0,at+1),...run,...rest.slice(at+1)];
   }else if(edit.op==='withdraw-run'){
    // A run anywhere in a chapter, such as a duplicate of the next chapter or a navigation line from the source site.
    const {start,found}=run(chapter,edit.paragraphs);
    if(start<0||found.length>=chapter.paragraphs.length||found.some(p=>p.aliases.length))throw new Error(`Invalid withdrawal: ${chapter.id}`);
    for(const p of found){
     withdrawn.records.push({id:p.id,version:p.version,text:p.text,title:chapter.title,source:chapter.source});
     withdrawn.transitions.push({from:{id:p.id,version:p.version},kind:'withdrawn',reason:edit.reason,targets:[]});
    }
    chapter.paragraphs.splice(start,found.length);
   }else if(edit.op==='relocate'){
    // A run the source attached to another chapter, moved to the chapter it belongs to.
    const from=book.chapters.find(c=>c.id===edit.from);
    const {start,found}=from&&from!==chapter?run(from,edit.paragraphs):{start:-1,found:[]};
    const at=position(chapter,edit.after);
    if(!from||start<0||found.length>=from.paragraphs.length||at<0||(edit.after!==undefined&&at===0))throw new Error(`Invalid relocation: ${chapter.id}`);
    from.paragraphs.splice(start,found.length);
    chapter.paragraphs.splice(at,0,...found);
   }else if(edit.op==='insert'){
    // Text the source lost, taken from a pinned page; new identities, never reused ones.
    const at=position(chapter,edit.after);
    if(!pinnedSource(edit.source)||!edit.paragraphs.length||at<0||(edit.after!==undefined&&at===0)||edit.paragraphs.some(p=>!p.id.startsWith(`p-${input.id}-`)||!p.text.trim()))throw new Error(`Invalid insertion: ${chapter.id}`);
    chapter.paragraphs.splice(at,0,...edit.paragraphs.map(p=>({id:p.id,version:`sha256:${digest(p.text)}`,text:p.text,aliases:[]})));
   }else if(edit.op==='withdraw-tail'){
    // Only a short run at the very end of a chapter, such as a source site's licence footer.
    const tail=chapter.paragraphs.slice(-edit.paragraphs.length);
    if(!edit.paragraphs.length||edit.paragraphs.length>=chapter.paragraphs.length||tail.some((p,i)=>p.id!==edit.paragraphs[i]||p.aliases.length)||tail.reduce((n,p)=>n+Array.from(p.text).length,0)>200)throw new Error(`Withdrawal requires a short chapter tail: ${chapter.id}`);
    for(const p of tail){
     withdrawn.records.push({id:p.id,version:p.version,text:p.text,title:chapter.title,source:chapter.source});
     withdrawn.transitions.push({from:{id:p.id,version:p.version},kind:'withdrawn',reason:edit.reason,targets:[]});
    }
    chapter.paragraphs=chapter.paragraphs.slice(0,-tail.length);
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
// The version a paragraph reached through corrections, starting from the version the structure saw.
function latest(history:History,id:string,version:string){
 for(let next;(next=history.transitions.find(t=>t.kind==='revision'&&t.from.id===id&&t.from.version===version&&t.targets.length===1&&t.targets[0].id===id));)version=next.targets[0].version;
 return version;
}
export function retainWithdrawals(history:History,withdrawn:History):History{
 const result=structuredClone(history);
 // A corrected paragraph is withdrawn at its corrected version, whose text history must already hold.
 const corrected=new Set<string>();
 for(const transition of withdrawn.transitions){
  const {id,version}=transition.from,last=latest(result,id,version);
  if(last===version)continue;
  corrected.add(`${id}@${version}`);
  if(!result.records.some(r=>r.id===id&&r.version===last))throw new Error(`Withdrawn correction missing from history: ${id}`);
  const t={...transition,from:{id,version:last}};
  const old=result.transitions.find(x=>x.from.id===id&&x.from.version===last);
  if(old&&JSON.stringify(old)!==JSON.stringify(t))throw new Error(`Withdrawal transition changed: ${id}`);
  if(!old)result.transitions.push(t);
 }
 withdrawn={records:withdrawn.records.filter(r=>!corrected.has(`${r.id}@${r.version}`)),transitions:withdrawn.transitions.filter(t=>!corrected.has(`${t.from.id}@${t.from.version}`))};
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
export type StructureInput = {sha256:string; chapters:(Omit<Chapter,'paragraphs'> & {withdrawn?:Omit<Paragraph,'text'>[]; withdrawnTail?:Omit<Paragraph,'text'>[]; removed?:Omit<Paragraph,'text'>[]; order?:string[]})[]};
export function structureInput(book:TextBook,structure:Structure):StructureInput{
 const edits=structure[book.id]??[];
 const removed=new Set(edits.filter(e=>e.op==='withdraw').map(e=>e.chapter));
 const tails=new Map(edits.flatMap(e=>e.op==='withdraw-tail'?[[e.chapter,new Set(e.paragraphs)] as const]:[]));
 // A piece of a split chapter is recorded under the chapter it was cut from.
 const pieces=new Map(edits.flatMap(e=>e.op==='split'?e.parts.map((_,i)=>[i===0?e.chapter:`${e.chapter}-${String(i+1).padStart(2,'0')}`,e.chapter] as const):[]));
 const whole=(id:string)=>pieces.get(id)??id;
 const moved=new Set(edits.flatMap(e=>e.op==='move'||e.op==='withdraw-run'||e.op==='insert'?[whole(e.chapter)]:e.op==='relocate'?[whole(e.chapter),whole(e.from)]:[]));
 const runs=new Set(edits.flatMap(e=>e.op==='withdraw-run'?e.paragraphs:[]));
 return {sha256:digest(JSON.stringify(book)),chapters:book.chapters.map(({paragraphs,...chapter})=>({...chapter,...(removed.has(chapter.id)?{withdrawn:paragraphs.map(({text,...p})=>p)}:{}),...(tails.has(chapter.id)?{withdrawnTail:paragraphs.filter(p=>tails.get(chapter.id)!.has(p.id)).map(({text,...p})=>p)}:{}),...(paragraphs.some(p=>runs.has(p.id))?{removed:paragraphs.filter(p=>runs.has(p.id)).map(({text,...p})=>p)}:{}),...(moved.has(chapter.id)?{order:paragraphs.map(p=>p.id)}:{})}))};
}
const fromHistory=(history:History,p:Omit<Paragraph,'text'>)=>{
 const record=history.records.find(r=>r.id===p.id&&r.version===p.version);
 if(!record)throw new Error(`Missing withdrawn source paragraph: ${p.id}`);
 return {id:p.id,version:p.version,text:record.text,...Object.fromEntries(Object.entries(p).filter(([key])=>key!=='id'&&key!=='version'))} as Paragraph;
};
export function restoreStructureInput(book:TextBook,input:StructureInput,structure:Structure,history:History):TextBook{
 const chapters=new Map(book.chapters.map(c=>[c.id,c]));
 // Paragraphs may have moved between chapters, so a recorded order looks them up anywhere in the book.
 const everywhere=new Map(book.chapters.flatMap(c=>c.paragraphs.map(p=>[p.id,p] as const)));
 const original={...book,chapters:input.chapters.map(({withdrawn,withdrawnTail,removed,order,...chapter})=>{
  let paragraphs:Paragraph[];
  if(withdrawn)paragraphs=withdrawn.map(p=>fromHistory(history,p));
  else{
   const split=structure[book.id]?.find(e=>e.op==='split'&&e.chapter===chapter.id);
   const ids=split?.op==='split'?split.parts.map((_,i)=>i===0?chapter.id:`${chapter.id}-${String(i+1).padStart(2,'0')}`):[chapter.id];
   paragraphs=ids.flatMap(id=>{
    const current=chapters.get(id);
    if(!current)throw new Error(`Missing structural chapter: ${id}`);
    return current.paragraphs;
   });
   if(withdrawnTail)paragraphs=[...paragraphs,...withdrawnTail.map(p=>fromHistory(history,p))];
   if(order){
    const byId=new Map([...paragraphs.map(p=>[p.id,p] as const),...(removed??[]).map(p=>[p.id,fromHistory(history,p)] as const)]);
    for(const id of order)if(!byId.has(id)&&everywhere.has(id))byId.set(id,everywhere.get(id)!);
    if(order.some(id=>!byId.has(id)))throw new Error(`Pre-edit order mismatch: ${chapter.id}`);
    paragraphs=order.map(id=>byId.get(id)!);
   }
  }
  return {...chapter,paragraphs};
 })};
 if(digest(JSON.stringify(original))!==input.sha256)throw new Error(`Pre-edit source mismatch: ${book.id}`);
 return original;
}
