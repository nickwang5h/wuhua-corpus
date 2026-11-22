/**
 * Collate a book against another edition on Wikisource and list where the two differ:
 *
 *   npm run corpus:collate -- <book> <维基文库根标题> [--out <file.md>] [--offline]
 *
 * The witness is the root page and its subpages at their current revisions, kept in the raw cache
 * with the revision ids. Both texts are compared on their characters alone, traditional and
 * simplified folded together, punctuation and notes' brackets left out. Each paragraph of ours is
 * found in the witness and the two are diffed; a difference is reported when it is short and sits
 * between runs that agree, so a commentary only one side carries is skipped.
 *
 * The output is a list of candidates for a person to judge, never a correction list: the witness
 * is one more edition with its own slips, and a variant reading is not an error. What survives
 * that judgement goes through `content:correct`.
 */
import {writeFileSync} from 'node:fs';
import * as OpenCC from 'opencc-js';
import {request} from './corpus-sources.js';
import type {TextBook} from '../src/types.js';

const args=process.argv.slice(2);
const flag=(name:string)=>{const i=args.indexOf(name);if(i<0)return undefined;const v=args[i+1];args.splice(i,2);return v;};
const out=flag('--out');
const offline=args.includes('--offline');
const [bookId,rootTitle]=args.filter(a=>!a.startsWith('--'));
if(!bookId||!rootTitle)throw new Error('Usage: corpus:collate <book> <Wikisource root title> [--out file.md] [--offline]');

// --- the witness ---------------------------------------------------------------------------------
const api=async(params:Record<string,string>)=>{const u=new URL('https://zh.wikisource.org/w/api.php');u.search=new URLSearchParams({format:'json',formatversion:'2',maxlag:'5',...params}).toString();return (await request(u.href,offline)).body;};
async function witnessPages():Promise<{title:string;revision:number;text:string}[]>{
 const titles=[rootTitle];
 for(let from:string|undefined;;){
  const body=await api({action:'query',list:'allpages',apprefix:rootTitle+'/',apnamespace:'0',aplimit:'500',...(from?{apcontinue:from}:{})});
  titles.push(...body.query.allpages.map((p:{title:string})=>p.title));
  from=body.continue?.apcontinue;
  if(!from)break;
 }
 const pages:{title:string;revision:number;text:string}[]=[];
 for(let i=0;i<titles.length;i+=25){
  const body=await api({action:'query',prop:'revisions',rvprop:'ids|content',rvslots:'main',titles:titles.slice(i,i+25).join('|'),redirects:'1'});
  for(const p of body.query.pages)if(p.revisions)pages.push({title:p.title,revision:p.revisions[0].revid,text:plain(p.revisions[0].slots.main.content)});
 }
 return pages.sort((a,b)=>titles.indexOf(a.title)-titles.indexOf(b.title));
}
const DROPPED=new Set(['header','Header','header2','footer','Textquality','PD-old','pd-old','reflist','alsosee','原文沒有標點','gap','wikipedia','further','TOC','注本']);
/** Wikitext to the words on the page: templates keep their text, notes {{*|…}} become 【…】. */
function plain(text:string):string{
 text=text.replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g,'').replace(/<!--[\s\S]*?-->/g,'').replace(/-\{(?:[A-Za-z]\|)?([^{}]*)\}-/g,(_,inner:string)=>/zh(?:-[a-z]+)?:/.test(inner)?inner.split(';')[0].replace(/^\s*zh(?:-[a-z]+)?:/,''):inner).replace(/<\/?[a-zA-Z][^>]*>/g,'');
 for(let prior='';prior!==text;){
  prior=text;
  text=text.replace(/\{\{([^{}|]*)((?:\|[^{}]*)?)\}\}/g,(_,name:string,rest:string)=>{
   name=name.trim();
   const parts=rest?rest.slice(1).split('|'):[];
   if(DROPPED.has(name)||name.startsWith('#'))return '';
   if(name==='*')return `【${parts.join('')}】`;
   return parts.filter(a=>!/^\s*\w+\s*=/.test(a)).join('');
  });
 }
 return text.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g,'$1').replace(/\[\[([^\]]*)\]\]/g,'$1').replace(/'''?/g,'');
}

// --- folding -------------------------------------------------------------------------------------
const simplified=OpenCC.Converter({from:'t',to:'cn'});
const folds=new Map<string,string>();
// Written either way with no difference in meaning; not worth a line in the report.
const SAME:Record<string,string>={爲:'为',眞:'真',旣:'既',敎:'教',卽:'即',槪:'概',鄕:'乡',緖:'绪',吿:'告',愼:'慎',內:'内',說:'说',悅:'悦',靑:'青',淸:'清',黃:'黄',絕:'绝',產:'产',衆:'众',羣:'群',峯:'峰',牀:'床',㑹:'会',啓:'启',尙:'尚',冄:'冉',於:'于',並:'并',竝:'并'};
function fold(c:string):string{
 let f=folds.get(c);
 if(f===undefined){f=SAME[c]??simplified(c);f=SAME[f]??f;folds.set(c,f);}
 return f;
}
const isHan=(c:string)=>/[㐀-鿿豈-﫿\u{20000}-\u{3ffff}]/u.test(c);
/** The characters of a text that take part in the comparison, each with its place in the text. */
function letters(text:string):{c:string[];at:number[];raw:string[]}{
 const raw=Array.from(text),c:string[]=[],at:number[]=[];
 raw.forEach((ch,i)=>{if(isHan(ch)){c.push(fold(ch));at.push(i);}});
 return {c,at,raw};
}

// --- diff ----------------------------------------------------------------------------------------
type Op={a:number;b:number;del:number;ins:number};
/** Myers' diff: the places where b departs from a, as (index in a, index in b, characters dropped, characters added). */
function diff(a:string[],b:string[],limit:number):Op[]|undefined{
 const n=a.length,m=b.length,max=Math.min(n+m,limit),off=max+1;
 const v=new Int32Array(2*max+3),trace:Int32Array[]=[];
 let found=-1;
 for(let d=0;d<=max&&found<0;d++){
  trace.push(v.slice());
  for(let k=-d;k<=d;k+=2){
   let x=k===-d||(k!==d&&v[off+k-1]<v[off+k+1])?v[off+k+1]:v[off+k-1]+1;
   let y=x-k;
   while(x<n&&y<m&&a[x]===b[y]){x++;y++;}
   v[off+k]=x;
   if(x>=n&&y>=m){found=d;break;}
  }
 }
 if(found<0)return undefined;
 const steps:[number,number,boolean][]=[];
 let x=n,y=m;
 for(let d=found;d>0;d--){
  const w=trace[d],k=x-y;
  const down=k===-d||(k!==d&&w[off+k-1]<w[off+k+1]);
  const pk=down?k+1:k-1,px=w[off+pk],py=px-pk;
  steps.push([down?px:px,down?py:py,down]);
  x=px;y=py;
 }
 steps.reverse();
 // Merge adjacent single steps into runs.
 const ops:Op[]=[];
 for(const [sx,sy,down] of steps){
  const last=ops.at(-1);
  if(last&&last.a+last.del===sx&&last.b+last.ins===sy){if(down)last.ins++;else last.del++;}
  else ops.push({a:sx,b:sy,del:down?0:1,ins:down?1:0});
 }
 return ops;
}

// --- collation -----------------------------------------------------------------------------------
const book:TextBook=JSON.parse((await import('node:fs')).readFileSync(new URL(`../src/books/${bookId}.json`,import.meta.url),'utf8'));
const pages=await witnessPages();
const witness=letters(pages.map(p=>p.text).join('\n'));
const pageAt:number[]=[];{let n=0;for(const p of pages){pageAt.push(n);n+=letters(p.text).c.length;}}
const pageOf=(i:number)=>{let k=0;while(k+1<pageAt.length&&pageAt[k+1]<=i)k++;return pages[k];};
const GRAM=6;
const index=new Map<string,number[]>();
for(let i=0;i+GRAM<=witness.c.length;i++){const g=witness.c.slice(i,i+GRAM).join('');const list=index.get(g);if(list)list.push(i);else index.set(g,[i]);}

// Pairs a scribe, an OCR pass or a script conversion confuses; these come first in the report.
const CONFUSED=['己已巳','曰日','未末','干乾幹','刺剌','母毋','士土','王五玉主','天夭','子予于','人入八','大太犬','戊戌戍','治冶','徒徙','候侯','祇祗','傅傳传','壺壼','微徽','曆歷历','云雲','后後','余餘','谷穀','里裡','征徵','范範','复復覆','舍捨','发發髮','尽盡儘','只隻祇','书晝昼'];
const confused=(x:string,y:string)=>CONFUSED.some(set=>set.includes(x)&&set.includes(y));
type Finding={kind:'字不同'|'本书少字'|'本书多字';likely:boolean;paragraph:string;chapter:string;ours:string;theirs:string;context:string;witnessContext:string;page:string};
const findings:Finding[]=[];
let matched=0,total=0,unlocated=0;
const around=(t:{raw:string[];at:number[]},from:number,to:number,pad=8)=>{const a=t.at[Math.max(0,from-pad)]??0,z=(t.at[Math.min(t.at.length-1,to+pad-1)]??t.raw.length-1)+1;return t.raw.slice(a,z).join('').replace(/\s+/g,'');};
for(const chapter of book.chapters)for(const p of chapter.paragraphs??[]){
 const ours=letters(p.text);
 total+=ours.c.length;
 if(ours.c.length<GRAM+2)continue;
 // Where in the witness this paragraph lies: the grams of ours that occur there exactly once.
 const hits:number[]=[];
 for(let i=0;i+GRAM<=ours.c.length;i+=2){const list=index.get(ours.c.slice(i,i+GRAM).join(''));if(list?.length===1)hits.push(list[0]-i);}
 if(hits.length<Math.max(2,ours.c.length/GRAM/8)){unlocated+=ours.c.length;continue;}
 hits.sort((x,y)=>x-y);
 const median=hits[hits.length>>1],reach=ours.c.length*3+400;
 const near=hits.filter(h=>Math.abs(h-median)<=reach);
 const start=Math.max(0,near[0]-20),end=Math.min(witness.c.length,near.at(-1)!+ours.c.length+20);
 const theirs=witness.c.slice(start,end);
 const ops=diff(ours.c,theirs,4000);
 if(!ops){unlocated+=ours.c.length;continue;}
 matched+=ours.c.length-ops.reduce((n,o)=>n+o.del,0);
 ops.forEach((op,k)=>{
  if(op.del>3||op.ins>3)return;
  // Agreement on both sides, or it is the ragged edge of a longer disagreement.
  const before=op.a-(k?ops[k-1].a+ops[k-1].del:0),after=(k+1<ops.length?ops[k+1].a:ours.c.length)-(op.a+op.del);
  if(before<4||after<4)return;
  const mine=ours.c.slice(op.a,op.a+op.del).join(''),other=theirs.slice(op.b,op.b+op.ins).join('');
  const rawMine=op.del?ours.raw.slice(ours.at[op.a],ours.at[op.a+op.del-1]+1).join(''):'';
  const rawOther=op.ins?witness.raw.slice(witness.at[start+op.b],witness.at[start+op.b+op.ins-1]+1).join(''):'';
  findings.push({
   kind:op.del&&op.ins?'字不同':op.ins?'本书少字':'本书多字',
   likely:op.del===op.ins&&Array.from(mine).every((c,i)=>confused(c,Array.from(other)[i])),
   paragraph:p.id,chapter:chapter.title.replace(/\s+/g,' '),ours:rawMine,theirs:rawOther,
   context:around(ours,op.a,op.a+op.del),witnessContext:around(witness,start+op.b,start+op.b+op.ins),page:pageOf(start+op.b).title,
  });
 });
}

// The same pair of characters three times over is how the two editions write a word, not a slip:
// 高 and 髙, 樹 and 𣗳. Those are counted in one line each at the end.
const pairs=new Map<string,number>();
for(const f of findings)if(f.kind==='字不同'&&!f.likely)pairs.set(`${f.ours}→${f.theirs}`,(pairs.get(`${f.ours}→${f.theirs}`)??0)+1);
const habit=(f:Finding)=>f.kind==='字不同'&&!f.likely&&(pairs.get(`${f.ours}→${f.theirs}`)??0)>=3;
const habits=[...pairs].filter(([,n])=>n>=3).sort((x,y)=>y[1]-x[1]);
const listed=findings.filter(f=>!habit(f));
const coverage=total?Math.round(1000*matched/total)/10:0;
const order={字不同:0,本书少字:1,本书多字:2};
listed.sort((x,y)=>Number(y.likely)-Number(x.likely)||order[x.kind]-order[y.kind]);
const lines=[
 `# ${book.metadata?.title??bookId} 对校 维基文库《${rootTitle}》`,'',
 `对校本 ${pages.length} 页（修订号 ${pages[0]?.revision}–）；本书 ${total} 字，对上 ${coverage}%，找不到对应的段落共 ${unlocated} 字。`,
 `差异 ${listed.length} 处，其中形近字 ${listed.filter(f=>f.likely).length} 处；另有 ${habits.length} 组两本惯用字不同（列在最后）。这是待判断的候选，不是订正清单：对校本也会错，异文不是错字。`,'',
 '| 类别 | 段落 | 本书 | 对校本 | 本书上下文 | 对校本上下文 | 对校页 |','| --- | --- | --- | --- | --- | --- | --- |',
 ...listed.map(f=>`| ${f.likely?'形近':f.kind} | ${f.chapter.slice(0,12)} ${f.paragraph} | ${f.ours||'　'} | ${f.theirs||'　'} | ${f.context} | ${f.witnessContext} | ${f.page} |`),
 '','两本惯用字不同（本书→对校本，次数）：'+habits.map(([pair,n])=>`${pair} ${n}`).join('，'),
];
if(out)writeFileSync(out,lines.join('\n')+'\n');
console.log(lines.slice(0,4).join('\n'));
if(!out)console.log(lines.slice(4,44).join('\n'));
