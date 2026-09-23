import test from 'node:test';
import assert from 'node:assert/strict';
import { books, passages, passageById, concepts, paths } from './content';
import { emptyStore, parseStore, readingIds, readLink, notesMarkdown } from './model';
import { catalog, validateCatalog } from './content/catalog';
import { stageWikisource } from './content/wikisource';

test('every curated passage has valid sources, terms, concepts and a unique identity',()=>{
 assert.equal(new Set(passages.map(p=>p.id)).size,passages.length);
 for(const book of books) assert.equal(passages.filter(p=>p.book===book.id).length,6);
 for(const p of passages){assert.equal(new URL(p.source).hostname,'ctext.org');assert.ok(p.translation&&p.thought&&p.context&&p.prompt);for(const t of p.terms)assert.ok(p.lines.join('').includes(t.word),`${p.id}: ${t.word}`);for(const c of p.concepts)assert.ok(Object.hasOwn(concepts,c));}
 for(const c of Object.values(concepts))for(const related of c.related)assert.ok(Object.hasOwn(concepts,related));
 for(const path of paths){assert.equal(new Set(path.ids).size,path.ids.length);for(const id of path.ids)assert.ok(passageById[id]);}
});
test('catalog keeps text, editorial content and unverified provenance separate',()=>{
 validateCatalog(catalog);
 assert.deepEqual(new Set(catalog.divisions.map(d=>d.kind)),new Set(['essay','chapter','sayings']));
 for(const source of catalog.sources) assert.equal(source.rights.status,'unverified');
 const broken=structuredClone(catalog);broken.passages[0].divisionId='missing';
 assert.throws(()=>validateCatalog(broken),/passage/);
 const duplicate=structuredClone(catalog);duplicate.passages.push(duplicate.passages[0]);
 assert.throws(()=>validateCatalog(duplicate),/duplicate/);
 const rights=structuredClone(catalog);rights.sources[0].rights.status='public-domain';
 assert.throws(()=>validateCatalog(rights),/rights evidence/);
 const lines=structuredClone(catalog);lines.annotations[0].displayLines=['different'];
 assert.throws(()=>validateCatalog(lines),/display text/);
});
test('Wikisource adapter stages pinned, unreviewed candidates without changing active data',()=>{
 const snapshot={sourceId:'test',pageUrl:'https://zh.wikisource.org/wiki/莊子',revision:'123',edition:null,rights:{status:'unverified' as const,license:null,evidenceUrl:null,verifiedAt:null},passages:[{id:'test-p',divisionId:'test-d',locator:'测试',text:'测试原文。'}]};
 const staged=stageWikisource(snapshot);
 assert.equal(new URL(staged.source.url!).searchParams.get('oldid'),'123');
 assert.equal(staged.source.processing.manuallyVerified,false);
 assert.equal(staged.passages[0].sentences[0].text,'测试原文。');
 assert.throws(()=>stageWikisource({...snapshot,pageUrl:'https://ctext.org/wiki/test'}));
 assert.throws(()=>stageWikisource({...snapshot,revision:''}));
 assert.throws(()=>stageWikisource({...snapshot,passages:[...snapshot.passages,...snapshot.passages]}));
 assert.equal(catalog.passages.length,18);
});
test('reading navigation follows a selected path and falls back safely to book order',()=>{
 assert.deepEqual(readingIds('d4','self'),['d4','l2','z2','z5']);
 assert.deepEqual(readingIds('z1','self'),['z1','z2','z3','z4','z5','z6']);
 assert.deepEqual(readingIds('missing'),[]);
 assert.equal(readLink('d4','reflect','self'),'#/read/d4/reflect?path=self');
});
test('stored notes round-trip; invalid references cannot become content',()=>{
 const state=emptyStore();state.notes.z1={draft:'还在修改',saved:'先前的理解',updated:'2026-09-22T12:00:00Z'};state.bookmarks=['z1'];state.lastRead='z1';state.bookLast.zhuangzi='z1';state.font=2;
 assert.deepEqual(parseStore(JSON.stringify(state)),state);
 const parsed=parseStore(JSON.stringify({...state,lastRead:'constructor',font:99,bookmarks:['z1','z1','constructor','unknown'],bookLast:{zhuangzi:'d1'},notes:{z1:{draft:5,saved:null}}}));
 assert.equal(parsed.lastRead,'');assert.equal(parsed.font,1);assert.deepEqual(parsed.bookmarks,['z1']);assert.deepEqual(parsed.bookLast,{});assert.deepEqual(parsed.notes,{});
 assert.throws(()=>parseStore('{broken'));assert.throws(()=>parseStore('{"version":2}'));
});
test('Markdown export includes saved reflections and original context, not unsaved edits',()=>{
 const state=emptyStore();state.notes.z1={draft:'未提交的修改',saved:'我的理解\n第二行',updated:'2026-09-22T12:00:00Z'};state.notes.d1={draft:'只有草稿',saved:'',updated:''};
 const md=notesMarkdown(state);assert.match(md,/我的理解\n第二行/);assert.ok(md.includes(passages[0].source));assert.ok(md.includes('《庄子》'));assert.ok(!md.includes('未提交的修改'));assert.ok(!md.includes('只有草稿'));
});
