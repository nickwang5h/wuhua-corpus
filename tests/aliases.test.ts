import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {applyEdits,boundaryMap,diffPlace,type Edit} from '../scripts/text-edits.js';
import {reviseParagraph,UNCHANGED,type History} from '../scripts/revision.js';
import {readBook} from '../scripts/read-book.js';
import {findReference,historicalReference,successors,transitions} from '../src/index.js';
import {validateBooks,validateHistory,currentReferences} from '../src/validate.js';
import type {Chapter,Paragraph,TextBook} from '../src/types.js';

const source='https://zh.wikisource.org/wiki/x?oldid=1';
// A paragraph cut into sentence aliases, as the three hand-imported books have them.
function paragraph(sentences:string[],version='1'):Paragraph{
 let at=0;
 const aliases=sentences.map((text,i)=>{const start=at;at+=Array.from(text).length;return {id:`ws-test-1-1-${i+1}`,start,end:at,version,text};});
 return {id:'p-test-1-1',version,text:sentences.join(''),aliases};
}
const chapter=(p:Paragraph):Chapter=>({id:'chapter-test-1',number:1,title:'篇',source,paragraphs:[p]});
const book=(p:Paragraph):TextBook=>({id:'test',chapters:[chapter(p)]});
// content:correct on one paragraph: numbered versions, as the three books have.
function correct(p:Paragraph,edits:(Edit&{reason?:string})[],history:History,version=String(Number(p.version)+1)){
 const {text,place}=applyEdits(p.text,edits,p.id);
 return reviseParagraph(p,chapter(p),{text,place,version,reason:edits.map(e=>e.reason??'訂正').join('；')},history);
}
const sentences=(p:Paragraph)=>p.aliases.map(a=>a.text);
const valid=(p:Paragraph,history:History)=>{validateBooks([book(p)]);validateHistory(history.records,history.transitions,currentReferences([book(p)]));};

test('aliases keep their sentence when text is added or removed before them, and record where they were',()=>{
 const p=paragraph(['子曰：「學而時習之，','不亦說乎？','有朋自遠方來，','不亦樂乎？」']);
 const history:History={records:[],transitions:[]};
 const moved=correct(p,[{find:'學而時習之',replace:'學而時時習之'}],history);
 assert.deepEqual(sentences(p),['子曰：「學而時時習之，','不亦說乎？','有朋自遠方來，','不亦樂乎？」']);
 assert.deepEqual(p.aliases.map(a=>[a.start,a.end,a.version]),[[0,11,'2'],[11,16,'2'],[16,23,'2'],[23,29,'2']]);
 assert.equal(moved.length,4);
 // Every alias leaves a record of its old wording and a transition to itself at the new version.
 assert.deepEqual(history.records.map(r=>`${r.id}@${r.version}`),['p-test-1-1@1',...p.aliases.map(a=>`${a.id}@1`)]);
 assert.equal(history.records[1].text,'子曰：「學而時習之，');
 assert.deepEqual(history.transitions.slice(1).map(t=>[t.from.version,t.targets,t.reason]),p.aliases.map((a,i)=>['1',[{id:a.id,version:'2'}],i===0?'訂正':UNCHANGED]));
 assert.equal(successors({id:'ws-test-1-1-2',version:'1'},history.transitions)?.targets[0].version,'2');
 valid(p,history);
});

test('a change inside a sentence becomes part of it; one-for-one replacements stay on their side',()=>{
 const p=paragraph(['子曰：『志於道，狎於德，','依於仁，游於藝。』']);
 const history:History={records:[],transitions:[]};
 correct(p,[{find:'狎於德',replace:'據於德'},{find:'『',replace:'「'},{find:'』',replace:'」'}],history);
 assert.deepEqual(sentences(p),['子曰：「志於道，據於德，','依於仁，游於藝。」']);
 // Replacing across the boundary, character for character, keeps each character with its sentence.
 correct(p,[{find:'德，依',replace:'德。依'}],history);
 assert.deepEqual(sentences(p),['子曰：「志於道，據於德。','依於仁，游於藝。」']);
 assert.deepEqual(successors({id:'ws-test-1-1-1',version:'2'},history.transitions)?.targets,[{id:'ws-test-1-1-1',version:'3'}]);
 valid(p,history);
});

test('text added at a sentence boundary goes with the sentence a closing mark ends, else with the next',()=>{
 const history:History={records:[],transitions:[]};
 const p=paragraph(['甲曰：「善。','乙曰：「然。']);
 correct(p,[{find:'善。乙',replace:'善。」乙'}],history);
 assert.deepEqual(sentences(p),['甲曰：「善。」','乙曰：「然。']);
 correct(p,[{find:'」乙',replace:'」丙乙'}],history);
 assert.deepEqual(sentences(p),['甲曰：「善。」','丙乙曰：「然。']);
 // At either end of the paragraph, added text stays inside it.
 correct(p,[{find:'然。',replace:'然。」'}],history);
 correct(p,[{find:'甲曰',replace:'丁甲曰'}],history);
 assert.deepEqual(sentences(p),['丁甲曰：「善。」','丙乙曰：「然。」']);
 // Text removed at a boundary leaves both sentences their remaining characters.
 correct(p,[{find:'。」丙乙',replace:'乙'}],history);
 assert.deepEqual(sentences(p),['丁甲曰：「善','乙曰：「然。」']);
 assert.equal(p.version,'6');
 valid(p,history);
});

test('a correction that removes a whole sentence leaves the paragraph and history as they were',()=>{
 const p=paragraph(['大直若屈，','其用不居。','大巧若拙。']);
 const before=structuredClone(p),history:History={records:[],transitions:[]};
 assert.throws(()=>correct(p,[{find:'屈，其用不居。大',replace:'屈，大'}],history),/removes the whole sentence/);
 assert.deepEqual(p,before);
 assert.deepEqual(history,{records:[],transitions:[]});
 // A stale alias must be aligned before a paragraph is corrected again.
 p.aliases[0].version='0';
 assert.throws(()=>correct(p,[{find:'大巧',replace:'大工'}],history),/align it first/);
});

test('going back to an earlier text: numbered versions run on, and an alias reaches the latest from its first',()=>{
 const p=paragraph(['子曰：「學而時習之，','不亦說乎？」']);
 const history:History={records:[],transitions:[]};
 correct(p,[{find:'時習',replace:'時時習'}],history);
 correct(p,[{find:'時時習',replace:'時習'}],history);
 assert.equal(p.version,'3');
 assert.deepEqual(sentences(p),['子曰：「學而時習之，','不亦說乎？」']);
 assert.deepEqual(p.aliases.map(a=>[a.start,a.end]),[[0,10],[10,16]]);
 let ref={id:'ws-test-1-1-1',version:'1'};
 for(let next;(next=successors(ref,history.transitions));)ref=next.targets[0];
 assert.deepEqual(ref,{id:'ws-test-1-1-1',version:'3'});
 valid(p,history);
});

test('going back to a text whose version is history again: that version and its step forward leave history',()=>{
 // Books with content versions (sha256 of the text) return to the same version; aliases do as the paragraph.
 const p=paragraph(['甲。','乙。'],'sha256:a');
 const history:History={records:[],transitions:[]};
 correct(p,[{find:'乙',replace:'丙'}],history,'sha256:b');
 correct(p,[{find:'丙',replace:'乙'}],history,'sha256:a');
 assert.deepEqual(sentences(p),['甲。','乙。']);
 assert.deepEqual(history.records.map(r=>`${r.id}@${r.version}`).sort(),['p-test-1-1@sha256:b','ws-test-1-1-1@sha256:b','ws-test-1-1-2@sha256:b']);
 assert.deepEqual(history.transitions.map(t=>`${t.from.id}@${t.from.version}→${t.targets[0].version}`).sort(),['p-test-1-1@sha256:b→sha256:a','ws-test-1-1-1@sha256:b→sha256:a','ws-test-1-1-2@sha256:b→sha256:a']);
 valid(p,history);
});

test('code-point diff keeps a longest common subsequence in order, and boundaries map through it',()=>{
 const place=diffPlace('大直若屈，其用不居。大巧若拙，','大直若屈，大巧若拙，');
 assert.deepEqual(place,[0,1,2,3,4,-1,-1,-1,-1,-1,5,6,7,8,9]);
 const map=boundaryMap(place,'大直若屈，大巧若拙，');
 assert.deepEqual([0,5,10,15].map(map),[0,5,5,10]);
 assert.deepEqual(diffPlace('𠀀甲乙','𠀀丙乙'),[0,-1,2]);
 assert.throws(()=>boundaryMap([1,0],'甲乙'),/increasing/);
});

test('validateBooks holds every alias to its paragraph: version, wording, order and bounds',()=>{
 const ok=paragraph(['甲。','乙。']);
 validateBooks([book(ok)]);
 for(const [change,pattern] of [
  [(p:Paragraph)=>{p.aliases[0].version='0';},/version 0, paragraph 1/],
  [(p:Paragraph)=>{p.aliases[1].text='丙。';},/text differs/],
  [(p:Paragraph)=>{p.aliases[1].start=1;p.aliases[1].text='。乙。';},/before the previous alias ends/],
  [(p:Paragraph)=>{p.aliases[1].end=5;},/beyond the text/],
 ] as const){
  const p=structuredClone(ok);change(p);
  assert.throws(()=>validateBooks([book(p)]),pattern);
 }
});

test('the three books: every alias is current, covers its paragraph end to end, and old refs reach it',async()=>{
 const books=await Promise.all(['laozi','lunyu','zhuangzi'].map(id=>readBook(id)));
 for(const b of books)for(const c of b.chapters)for(const p of c.paragraphs){
  assert.ok(p.aliases.length,p.id);
  assert.equal(p.aliases[0].start,0,p.id);assert.equal(p.aliases.at(-1)!.end,Array.from(p.text).length,p.id);
  p.aliases.forEach((a,i)=>{assert.equal(a.version,p.version,a.id);if(i)assert.equal(a.start,p.aliases[i-1].end,a.id);});
 }
 const lunyu=books[1];
 const found=findReference(lunyu,'ws-lunyu-2177439-7-6-1')!;
 assert.equal(found.ref.version,'3');assert.equal(found.ref.text,'子曰：「志於道，據於德，依於仁，游於藝。」');
 assert.deepEqual(successors({id:'ws-lunyu-2177439-7-6-1',version:'1'})?.targets,[{id:'ws-lunyu-2177439-7-6-1',version:'3'}]);
 assert.equal(historicalReference('ws-lunyu-2177439-7-6-1','1')?.title,'述而第七');
 // Every alias transition leads from an alias to the same alias at its paragraph's version.
 const current=new Map(books.flatMap(b=>b.chapters.flatMap(c=>c.paragraphs.flatMap(p=>p.aliases.map(a=>[a.id,a.version] as const)))));
 const aliasTransitions=transitions.filter(t=>t.from.id.startsWith('ws-'));
 assert.ok(aliasTransitions.length>=443);
 for(const t of aliasTransitions){assert.equal(t.kind,'revision');assert.equal(t.targets.length,1);assert.equal(t.targets[0].id,t.from.id);assert.ok(current.has(t.from.id));}
});

test('the alias migration has nothing left to do',()=>{
 const run=spawnSync(process.execPath,['--import','tsx','scripts/migrate-aliases.ts','--dry-run'],{cwd:fileURLToPath(new URL('..',import.meta.url)),encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);
 assert.match(run.stdout,/^0 aliases in 0 paragraphs/);
});
