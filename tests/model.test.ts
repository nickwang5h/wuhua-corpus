import test from 'node:test';
import {readBook as loadBook} from '../scripts/read-book';
import assert from 'node:assert/strict';
import {migrateLegacy,noteEntry,readLink} from '../apps/reading/src/model';
import {emptyData,parseData,backup,markdown,mergeData,put} from '../packages/ui/data';
import {curated} from '../packages/content/src/curated';
import {validateHistory} from '../packages/content/src/validate';
import {successors,findReference} from '../packages/content/src';
import type {Reference,Transition} from '../packages/content/src/types';
const ref:Reference={id:'p-a',version:'1',text:'學而時習之，不亦說乎？',title:'学而',source:'https://zh.wikisource.org/wiki/test?oldid=1'};
test('v1 migration keeps unknown IDs, drafts, long notes and all reading positions',()=>{
 const original={version:1,notes:{z1:{draft:'未提交',saved:'先前理解',updated:'2026-09-23'},retired:{draft:'甲'.repeat(3000),saved:'失联记录',updated:'2026-09-23'}},bookmarks:['z1','retired'],lastRead:'retired',bookLast:{zhuangzi:'retired'},font:2};
 const migrated=migrateLegacy(JSON.stringify(original));assert.equal(migrated.records.filter(r=>r.kind==='note').length,2);assert.equal(migrated.records.find(r=>r.ref?.id==='retired'&&r.kind==='note')?.draft?.length,3000);assert.equal(migrated.records.find(r=>r.recordId==='lastRead')?.ref?.id,'retired');assert.equal(migrated.settings.size,2);assert.equal(migrated.records.find(r=>r.ref?.id==='z1')?.ref?.text,curated[0].text);assert.match(markdown(migrated),/失联记录/);assert.match(markdown(migrated),/未提交/);assert.throws(()=>migrateLegacy('{broken'));assert.throws(()=>migrateLegacy('{"version":1,"notes":{"x":{"saved":5}}}'));
});
test('full backup restores draft, settings, unknown references and versions without truncation',()=>{
 let data=emptyData('reading');data=put(data,noteEntry(ref,undefined,'草稿','理解'));data=put(data,{recordId:'orphan',kind:'bookmark',updated:'now',ref:{...ref,id:'unknown',text:''}});data.settings.theme='dark';
 const restored=parseData(backup(data),'reading');assert.deepEqual(restored.records,data.records);assert.deepEqual(restored.settings,data.settings);assert.throws(()=>parseData(backup(data),'learning'));assert.throws(()=>parseData('{"schemaVersion":99}','reading'));assert.throws(()=>parseData(JSON.stringify({...data,records:[{...data.records[0],draft:42}]}),'reading'));
});
test('import conflict preserves both versions and does not mutate either input',()=>{
 const a=put(emptyData('reading'),noteEntry(ref,undefined,'甲','理解甲'));const b=put(emptyData('reading'),noteEntry(ref,undefined,'乙','理解乙'));const m=mergeData(a,b);assert.equal(m.conflicts,1);assert.equal(m.data.records.length,2);assert.equal(a.records[0].draft,'甲');assert.equal(b.records[0].draft,'乙');assert.match(markdown(m.data),/理解甲/);assert.match(markdown(m.data),/理解乙/);assert.equal(mergeData(a,a).duplicates,1);
});
test('revision, split, merge and withdrawal retain record snapshots and explicit successors',()=>{
 const b={...ref,id:'p-b',text:'學而時習之，'},c={...ref,id:'p-c',text:'不亦說乎？'},d={...ref,id:'p-d',version:'2'};
 const transitions:Transition[]=[{from:ref,kind:'split',reason:'拆段',targets:[b,c]},{from:b,kind:'merge',reason:'合段',targets:[{...d,start:0,end:6}]},{from:c,kind:'merge',reason:'合段',targets:[{...d,start:6,end:11}]}];
 validateHistory([ref,b,c],transitions,[d]);assert.equal(successors(ref,transitions)?.targets.length,2);let data=put(emptyData('reading'),noteEntry(ref,undefined,'问题甲','理解甲'));data=put(data,noteEntry(b,undefined,'问题乙','理解乙'));const roundtrip=parseData(backup(data),'reading');assert.equal(roundtrip.records.length,2);assert.equal(roundtrip.records[0].ref?.version,'1');assert.equal(roundtrip.records[0].ref?.text,ref.text);
 validateHistory([ref],[{from:ref,kind:'withdrawn',reason:'撤回',targets:[]}],[]);
 assert.throws(()=>validateHistory([ref,b],[{from:ref,kind:'revision',reason:'bad',targets:[b]},{from:b,kind:'revision',reason:'bad',targets:[ref]}],[]),/cycle/);
});
test('old sentence alias is frozen independently of a revised paragraph',async()=>{
 const book=structuredClone(await loadBook('lunyu'));const p=book.chapters[0].paragraphs[0];const id=p.aliases[0].id;const before=findReference(book,id)!.ref;p.version='2';p.text='更正后的正文。';const after=findReference(book,id)!.ref;assert.deepEqual(after,before);assert.equal(after.version,'1');assert.equal(readLink('z1','reflect','self'),'#/read/z1/reflect?path=self');
});


test('reserved property names stay unresolved records rather than becoming inherited content',()=>{
 const d=migrateLegacy(JSON.stringify({version:1,notes:{constructor:{draft:'still mine',saved:'keep me',updated:'now'}},bookmarks:['constructor']}));assert.equal(d.records[0].ref?.id,'constructor');assert.equal(d.records[0].ref?.version,'unknown');assert.match(markdown(d),/keep me/);
});
test('an added chapter is structured content with independent identity, without new page code',async()=>{
 const book=structuredClone(await loadBook('lunyu'));
 book.chapters.push({id:'chapter-lunyu-disposable',number:21,title:'可丢弃增补样例',source:book.chapters[0].source,paragraphs:[{id:'p-lunyu-disposable',version:'1',text:'學而時習之。',aliases:[]}]});
 const {validateBooks}=await import('../packages/content/src/validate');validateBooks([book]);assert.equal(findReference(book,'p-lunyu-disposable')?.chapter.title,'可丢弃增补样例');
});
test('explicit reattachment creates a new note and retains both old text and any existing target note',async()=>{
 const {linkNoteCopy}=await import('../apps/reading/src/model');const target={...ref,id:'p-b',version:'2',text:'新版文字'};let d=put(emptyData('reading'),noteEntry(ref,undefined,'旧草稿','旧理解'));d=put(d,noteEntry(target,undefined,'已有新版草稿','已有新版理解'));const next=linkNoteCopy(d,d.records[0].recordId,target);assert.equal(next.records.length,3);assert.equal(next.records[0].ref?.text,ref.text);assert.equal(next.records[1].saved,'已有新版理解');assert.equal(next.records[2].saved,'旧理解');assert.equal(next.records[2].ref?.version,'2');
});
