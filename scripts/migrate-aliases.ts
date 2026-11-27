/**
 * One-off: bring the sentence aliases that corrections left behind up to their paragraph's version.
 *
 *   node --import tsx scripts/migrate-aliases.ts [--dry-run]
 *
 * Until 2026-11-27 scripts/correct.ts moved a paragraph to a new version without touching its
 * aliases, so they kept the old version and the old wording. For each such alias the paragraph's
 * text at the alias's version is taken from history, a code-point diff against the current text
 * maps the alias's range to where its sentence now stands, and the alias moves to the current
 * version with the slice there as its text. The old alias goes into history with a revision
 * transition to the new one (scripts/revision.ts, as correct.ts now does for every correction).
 * Every paragraph's aliases must then still cover its text exactly, in order, end to end. The
 * aliases whose wording changed are listed in docs/collation/2026-11/aliases.md. Running it again
 * finds nothing to do.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {readHistory,writeHistory} from './history-store.js';
import {diffPlace} from './text-edits.js';
import {followAliases} from './revision.js';
import {aliasProblems,validateBooks} from '../src/validate.js';
import type {TextBook} from '../src/types.js';

const dryRun=process.argv.includes('--dry-run');
const BOOKS=['laozi','lunyu','zhuangzi'];
const TITLES:Record<string,string>={laozi:'老子',lunyu:'论语',zhuangzi:'庄子'};
const REPORT='docs/collation/2026-11/aliases.md';
const raw=new Map<string,string>();
const read=(f:string)=>{const s=readFileSync(f,'utf8');raw.set(f,s);return JSON.parse(s);};
const write=(f:string,data:unknown)=>{const s=raw.get(f)!;writeFileSync(f,JSON.stringify(data,null,/\n( +)/.exec(s)?.[1].length??2)+(s.endsWith('\n')?'\n':''));};

// What a change replaced, as 「old→new」 runs, empty sides shown as ∅.
function changes(before:string,after:string){
 const place=diffPlace(before,after),a=Array.from(before),b=Array.from(after),runs:string[]=[];
 let i=0,j=0;
 const flush=(i2:number,j2:number)=>{if(i2>i||j2>j)runs.push(`${a.slice(i,i2).join('')||'∅'}→${b.slice(j,j2).join('')||'∅'}`);};
 a.forEach((_,k)=>{if(place[k]<0)return;flush(k,place[k]);i=k+1;j=place[k]+1;});
 flush(a.length,b.length);
 return runs.join('；');
}

const history=readHistory();
const books=BOOKS.map(id=>read(`src/books/${id}.json`) as TextBook);
type Row={book:string;chapter:string;alias:string;from:string;to:string;was:string;now:string;range:string;stale:boolean};
// Aliases whose wording changed, and those that only moved within the paragraph.
const rows:Row[]=[],shifted:Row[]=[];
let moved=0,paragraphs=0,stale=0;
for(const book of books)for(const chapter of book.chapters)for(const p of chapter.paragraphs){
 const behind=[...new Set(p.aliases.filter(a=>a.version!==p.version).map(a=>a.version))];
 if(!behind.length)continue;
 paragraphs++;
 for(const version of behind){
  const record=history.records.find(r=>r.id===p.id&&r.version===version);
  if(!record)throw new Error(`${p.id}: no history of version ${version}`);
  // The corrections that took the paragraph from the alias's version to its own.
  const reasons:string[]=[];
  for(let at=version;at!==p.version;){
   const t=history.transitions.find(t=>t.from.id===p.id&&t.from.version===at&&t.kind==='revision'&&t.targets.length===1&&t.targets[0].id===p.id);
   if(!t)throw new Error(`${p.id}: no revision from version ${at} toward ${p.version}`);
   reasons.push(t.reason);at=t.targets[0].version;
  }
  const place=diffPlace(record.text,p.text),chars=Array.from(p.text);
  for(const {alias,was} of followAliases(p,{version,text:record.text},place,chapter,history,reasons.join('；'))){
   moved++;
   // The old range read against the current text gave something else.
   const misread=chars.slice(was.start,was.end).join('')!==was.text;
   if(misread)stale++;
   const row={book:book.id,chapter:chapter.title,alias:alias.id,from:was.version,to:alias.version,was:was.text,now:alias.text,range:`[${was.start},${was.end})→[${alias.start},${alias.end})`,stale:misread};
   if(alias.text!==was.text)rows.push(row);else if(alias.start!==was.start||alias.end!==was.end)shifted.push(row);
  }
 }
 const problems=aliasProblems(p);
 if(problems.length)throw new Error(problems.join('\n'));
}
validateBooks(books);
// Every paragraph with aliases, moved or not, is covered exactly: in order, end to end, as the import made them.
for(const book of books)for(const c of book.chapters)for(const p of c.paragraphs)if(p.aliases.length&&(p.aliases[0].start!==0||p.aliases.at(-1)!.end!==Array.from(p.text).length||p.aliases.some((a,i)=>i&&a.start!==p.aliases[i-1].end)))throw new Error(`${p.id}: aliases do not cover the text end to end`);
console.log(`${moved} aliases in ${paragraphs} paragraphs moved to their paragraph's version: ${rows.length} with changed wording, ${shifted.length} moved only; ${stale} read wrongly against the current text before${dryRun?' (dry run)':''}`);
if(!moved||dryRun)process.exit(0);
for(const b of books)write(`src/books/${b.id}.json`,b);
writeHistory(history);
const cell=(s:string)=>s.replace(/\|/g,'\\|');
const lines=[
 '# 旧三书句子别名对齐（2026-11-27）',
 '',
 `老子、论语、庄子的段落带有早期版本的句子编号（别名，\`ws-…\`）。从前 \`content:correct\` 改了段落正文、升了段落版本，却不动别名，于是 ${moved} 个别名（${paragraphs} 段）停在旧版本，存着旧字句和旧码点范围；其中 ${stale} 个的旧范围放到现行正文上已读出别的字。\`scripts/migrate-aliases.ts\` 把它们一次对齐：从历史取出该段在别名版本时的正文，与现行正文逐码点比对（最长公共子序列），把别名的范围映射到这句话在现行正文里的位置（含被改的字），版本改为段落现行版本，文字取现行正文在新范围的切片；旧别名记进历史，并加一条迁移指向现行别名，旧链接经 \`successors\` 可走到现行。之后 \`content:correct\` 每次订正都照此办理，\`validateBooks\` 要求每个别名都与段落同版本、文字等于切片、按序不重叠。`,
 '',
 `范围映射的规则：改动落在句内的随句；句界上新增的文字，以收尾标点（」。，等）开头的归上一句，否则归下一句；跨句界的替换按位置逐字对应（一换一时各归原句）。对齐后每段的别名仍首尾相接、覆盖全段，与导入时一样。`,
 '',
 `${rows.length} 个别名文字变了（下表）；${shifted.length} 个文字未变、只因前面增删字而挪了位置（文末另表）；其余 ${moved-rows.length-shifted.length} 个文字和范围都没变，只升了版本（迁移理由记“所在段落另处订正，本句文字未变”）。表中“旧句”是别名原存的文字，“新句”是对齐后的文字，“改动”是两者的逐字差异（∅ 表示空）。`,
 '',
];
for(const id of BOOKS){
 const list=rows.filter(r=>r.book===id);
 if(!list.length)continue;
 lines.push(`## ${TITLES[id]}（${list.length}）`,'','| 别名 | 篇章 | 版本 | 旧句 | 新句 | 改动 |','|---|---|---|---|---|---|');
 for(const r of list)lines.push(`| \`${r.alias}\` | ${cell(r.chapter)} | ${r.from}→${r.to} | ${cell(r.was)} | ${cell(r.now)} | ${cell(changes(r.was,r.now))} |`);
 lines.push('');
}
lines.push(`## 只挪了位置的（${shifted.length}）`,'','| 别名 | 篇章 | 版本 | 范围 | 句子 |','|---|---|---|---|---|');
for(const r of shifted)lines.push(`| \`${r.alias}\` | ${cell(r.chapter)} | ${r.from}→${r.to} | ${r.range} | ${cell(r.now)} |`);
lines.push('');
writeFileSync(REPORT,lines.join('\n'));
console.log(`wrote ${REPORT}`);
