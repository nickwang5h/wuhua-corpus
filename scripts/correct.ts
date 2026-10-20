/**
 * Apply reviewed corrections of the canonical text from a JSON list:
 *
 *   npm run content:correct -- <corrections.json> [--dry-run]
 *
 * Each item is {book, id, find, replace, reason, nth?}: `find` must occur in the
 * paragraph exactly once (or give `nth`, counting from 0). A paragraph keeps its
 * ID; its first sourceText is kept, its version moves on (sha256 of the text, or
 * the next number for the three hand-imported books), the old version goes into
 * history with a revision transition, and pinyin or editorial aids on the old
 * version follow it when the change lies outside their range.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {digest} from './corpus-sources.js';
import type {TextBook,Reference,Transition} from '../src/types.js';

type Item={book:string; id:string; find:string; replace:string; reason:string; nth?:number};
type Aid={target:string; version:string; start?:number; end?:number; review?:{textVersion?:string}; tokens?:{start:number;end:number}[]};
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
const history:{records:Reference[];transitions:Transition[]}=read('src/history.json');
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
 let text=oldText;
 const changed:[number,number][]=[];
 for(const item of list){
  const at:number[]=[];
  for(let i=text.indexOf(item.find);i>=0;i=text.indexOf(item.find,i+1))at.push(i);
  const index=item.nth===undefined?(at.length===1?at[0]:-1):at[item.nth]??-1;
  if(index<0)throw new Error(`${id}: “${item.find}” found ${at.length} times`);
  // Code-point range of the change in the text before it, for aids.
  const start=Array.from(text.slice(0,index)).length;
  changed.push([start,start+Array.from(item.find).length]);
  text=text.slice(0,index)+item.replace+text.slice(index+item.find.length);
 }
 if(text===oldText)throw new Error(`${id}: the corrections leave the text unchanged`);
 const version=/^\d+$/.test(oldVersion)?String(Number(oldVersion)+1):`sha256:${digest(text)}`;
 const reason=list.map(i=>i.reason.trim()).join('；');
 for(const [f,list2] of Object.entries(aids))for(const aid of list2){
  if(aid.target!==id||aid.version!==oldVersion)continue;
  const s=aid.start??0,e=aid.end??Array.from(oldText).length;
  if(changed.some(([a,z])=>a<e&&z>s)||Array.from(text).length!==Array.from(oldText).length)throw new Error(`${id}: an aid in ${f} covers the change; edit it by hand`);
  aid.version=version;
  if(aid.review?.textVersion===oldVersion)aid.review.textVersion=version;
 }
 if(!history.records.some(r=>r.id===id&&r.version===oldVersion))history.records.push({id,version:oldVersion,text:oldText,title:chapter.title,source:chapter.source});
 history.transitions.push({from:{id,version:oldVersion},kind:'revision',reason,targets:[{id,version}]});
 p.sourceText??=oldText;
 p.text=text;
 p.version=version;
 const earlier=p.correction?.reason;
 p.correction={reason:earlier?`${earlier}；${reason}`:reason,review:{status:'reviewed',author,reviewer,reviewedAt:today,textVersion:version}};
 console.log(`${bookId} ${id}: ${list.map(i=>`${i.find}→${i.replace}`).join('，')}`);
}
if(flag!=='--dry-run'){
 for(const [id,b] of books)write(`src/books/${id}.json`,b);
 write('src/history.json',history);
 for(const [f,list] of Object.entries(aids))write(f,list);
}
console.log(`${byParagraph.size} paragraphs${flag==='--dry-run'?' (dry run)':''}`);
