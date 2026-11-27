/**
 * Apply reviewed corrections of the canonical text from a JSON list:
 *
 *   npm run content:correct -- <corrections.json> [--dry-run]
 *
 * Each item is {book, id, find, replace, reason, nth?, all?}: `find` must occur in
 * the paragraph exactly once, or give `nth` (counting from 0), or `all` for every
 * occurrence of a placeholder that always stands for the same character. A paragraph keeps its
 * ID; its first sourceText is kept, its version moves on (sha256 of the text, or
 * the next number for the three hand-imported books), the old version goes into
 * history with a revision transition, and pinyin or editorial aids on the old
 * version follow it when the change lies outside their range (moving with their
 * characters when text is added or removed before them), or when the change touches only
 * punctuation. Sentence aliases always follow: each moves to the new version, its range to
 * where its sentence now stands, and the old alias goes into history (scripts/revision.ts).
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {digest} from './corpus-sources.js';
import {readHistory,writeHistory} from './history-store.js';
import {applyEdits} from './text-edits.js';
import {reviseParagraph} from './revision.js';
import type {TextBook,Reference,Transition} from '../src/types.js';

type Item={book:string; id:string; find:string; replace:string; reason:string; nth?:number; all?:boolean};
type Aid={target:string; version:string; start?:number; end?:number; review?:{textVersion?:string}; tokens?:{start:number;end:number}[]};
const PUNCTUATION=new Set('，。、；：！？“”‘’「」『』《》〈〉（）〔〕【】·—…﹕');
// When `after` differs from `before` only in punctuation (marks added, dropped or moved), the new
// code-point index of each old character that is not punctuation.
function punctuationOnly(before:string,after:string):Map<number,number>|undefined{
 const keep=(s:string)=>Array.from(s).flatMap((c,i)=>PUNCTUATION.has(c)?[]:[[i,c] as const]);
 const a=keep(before),b=keep(after);
 if(a.length!==b.length||a.some(([,c],k)=>c!==b[k][1])||before===after)return undefined;
 return new Map(a.map(([i],k)=>[i,b[k][0]]));
}
// An aid's range [start,end) in the new text: from its first to its last character that is not punctuation.
function moved(shift:Map<number,number>,start:number,end:number):[number,number]{
 let s=start,e=end-1;
 while(s<e&&!shift.has(s))s++;
 while(e>s&&!shift.has(e))e--;
 if(!shift.has(s)||!shift.has(e))throw new Error(`an aid range [${start},${end}) holds only punctuation`);
 return [shift.get(s)!,shift.get(e)!+1];
}
const [file,flag]=process.argv.slice(2);
if(!file)throw new Error('Usage: content:correct <corrections.json> [--dry-run]');
const items:Item[]=JSON.parse(readFileSync(file,'utf8'));
const reviewer=process.env.CORRECTION_REVIEWER;
if(!reviewer)throw new Error('Set CORRECTION_REVIEWER to who reviewed these corrections');
const author=process.env.CORRECTION_AUTHOR??reviewer;
const today=new Date().toISOString().slice(0,10);
// Written back with each file's own indentation and final newline, so a correction diffs as one.
const raw=new Map<string,string>();
const read=(f:string)=>{const s=readFileSync(f,'utf8');raw.set(f,s);return JSON.parse(s);};
const write=(f:string,data:unknown)=>{const s=raw.get(f)!;writeFileSync(f,JSON.stringify(data,null,/\n( +)/.exec(s)?.[1].length??2)+(s.endsWith('\n')?'\n':''));};
const history:{records:Reference[];transitions:Transition[]}=readHistory();
const aidFiles=['src/pinyin-aids.json','src/editorial-aids.json'];
const aids:Record<string,Aid[]>=Object.fromEntries(aidFiles.map(f=>[f,read(f)]));
const books=new Map<string,TextBook>();
const book=(id:string)=>{if(!books.has(id))books.set(id,read(`src/books/${id}.json`));return books.get(id)!;};

const byParagraph=new Map<string,Item[]>();
for(const item of items){
 if(!item.book||!item.id||!item.find||item.replace===undefined||!item.reason?.trim())throw new Error(`Incomplete correction: ${JSON.stringify(item)}`);
 const key=`${item.book}\u0000${item.id}`;
 byParagraph.set(key,[...(byParagraph.get(key)??[]),item]);
}
for(const list of byParagraph.values()){
 const {book:bookId,id}=list[0];
 const b=book(bookId);
 const chapter=b.chapters.find(c=>c.paragraphs.some(p=>p.id===id));
 if(!chapter)throw new Error(`Paragraph not found: ${bookId} ${id}`);
 const p=chapter.paragraphs.find(q=>q.id===id)!;
 const oldText=p.text,oldVersion=p.version;
 const {text,place}=applyEdits(oldText,list,id);
 if(text===oldText)throw new Error(`${id}: the corrections leave the text unchanged`);
 const version=/^\d+$/.test(oldVersion)?String(Number(oldVersion)+1):`sha256:${digest(text)}`;
 const reason=list.map(i=>i.reason.trim()).join('；');
 const shift=punctuationOnly(oldText,text);
 for(const [f,list2] of Object.entries(aids))for(const aid of list2){
  if(aid.target!==id||aid.version!==oldVersion)continue;
  const s=aid.start??0,e=aid.end??Array.from(oldText).length;
  if(shift){
   // Only punctuation changed: every other character keeps its order, so ranges move with it.
   if(aid.start!==undefined&&aid.end!==undefined)[aid.start,aid.end]=moved(shift,aid.start,aid.end);
   for(const t of aid.tokens??[])[t.start,t.end]=moved(shift,t.start,t.end);
  }else{
   // The aid's characters must all survive, still side by side; then it moves with them.
   const kept=place.slice(s,e);
   if(!kept.length||kept.some((at,k)=>at<0||at!==kept[0]+k))throw new Error(`${id}: an aid in ${f} covers the change; edit it by hand`);
   const by=kept[0]-s;
   if(by){
    if(aid.start!==undefined&&aid.end!==undefined){aid.start+=by;aid.end+=by;}
    for(const t of aid.tokens??[]){t.start+=by;t.end+=by;}
   }
  }
  aid.version=version;
  if(aid.review?.textVersion===oldVersion)aid.review.textVersion=version;
 }
 reviseParagraph(p,chapter,{text,place,version,reason},history);
 const earlier=p.correction?.reason;
 if(p.sourceText===text){delete p.sourceText;delete p.correction;console.log(`${bookId} ${id}: back to the source text`);continue;}
 p.correction={reason:earlier?`${earlier}；${reason}`:reason,review:{status:'reviewed',author,reviewer,reviewedAt:today,textVersion:version}};
 console.log(`${bookId} ${id}: ${list.map(i=>`${i.find}→${i.replace}`).join('，')}`);
}
if(flag!=='--dry-run'){
 for(const [id,b] of books)write(`src/books/${id}.json`,b);
 writeHistory(history);
 for(const [f,list] of Object.entries(aids))write(f,list);
}
console.log(`${byParagraph.size} paragraphs${flag==='--dry-run'?' (dry run)':''}`);
