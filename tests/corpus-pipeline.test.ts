import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeHtml,residue} from '../scripts/corpus-normalize.js';
import {childTitles,digest,type Plan} from '../scripts/corpus-sources.js';
import {convertUnits,asSourced} from '../scripts/corpus.js';
import {validateBooks} from '../src/validate.js';
test('HTML conversion preserves original glyphs, entities, tables and section identity, excludes site UI',()=>{
 const blocks=normalizeHtml('<div class="mw-parser-output"><div class="header-container">作者</div><table class="ws-header"><tr><td>◄ 目錄</td></tr></table><h2>學<span class="mw-editsection">[编辑]</span></h2><p>學而&nbsp;時習之。<sup class="reference">[1]</sup></p><table><tr><th>年</th><td>元年</td></tr></table><div class="licenseContainer">Creative Commons</div></div>');
 assert.deepEqual(blocks,[{text:'學而 時習之。',headingPath:['學']},{text:'年 元年',headingPath:['學']}]);
 assert.deepEqual(residue('{{殘留}}'),['markup-residue']);
});
test('discovery excludes header citations, aggregate duplicates and unrelated works',()=>{
 assert.deepEqual(childTitles('{{header|notes=[[書/注]] {{x|y}}}}\n{{sub title|[[/甲]]}} [[書/乙|乙]] [[史記/卷一]] [[/全覽]]','書','書'),['書/甲','書/乙']);
});
test('stable source IDs do not depend on sibling ordering; text versions track content',()=>{
 const p:Plan={work:'example',provider:'zhwikisource',rootTitle:'例',pages:[],metadata:{},warnings:[]};
 const a={identity:'12',title:'甲',source:'https://zh.wikisource.org/w/index.php?oldid=123',path:[],blocks:[{text:'原文。',headingPath:[]}]};
 const b={...a,identity:'13',title:'乙'};
 const first=convertUnits({id:'example',title:'例'},p,[a,b]);const second=convertUnits({id:'example',title:'例'},p,[b,a]);
 assert.equal(first.chapters[0].id,second.chapters[1].id);assert.deepEqual(first.chapters[0].paragraphs,second.chapters[1].paragraphs);
 assert.deepEqual(first,convertUnits({id:'example',title:'例'},p,[a,b]));
 const changed=convertUnits({id:'example',title:'例'},p,[{...a,blocks:[{text:'另文。',headingPath:[]}]}]);assert.notEqual(first.chapters[0].paragraphs[0].version,changed.chapters[0].paragraphs[0].version);
 assert.throws(()=>validateBooks([{...first,chapters:[{...first.chapters[0],source:'https://raw.githubusercontent.com/gujilab/chinese-classical-corpus/main/output/a.json'}]}]));
});

test('targets exclude frozen works and every core work belongs to the separate nine-stage route',async()=>{
 const {jsonFile}=await import('../scripts/corpus-sources.js');
 const targets=await jsonFile<{id:string;priority:string}[]>('corpus/targets.json');
 const stages=await jsonFile<{stage:number;works:string[];question:string;reading:string}[]>('corpus/route.json');
 assert.equal(new Set(targets.map(t=>t.id)).size,targets.length);
 assert.ok(targets.every(t=>!['laozi','lunyu','zhuangzi'].includes(t.id)));
 assert.deepEqual(stages.map(s=>s.stage),[0,1,2,3,4,5,6,7,8,9]);
 assert.ok(stages.every(s=>s.question&&s.reading));
 const core=stages.slice(1).flatMap(s=>s.works);
 assert.deepEqual([...core].sort(),targets.filter(t=>t.priority==='P0').map(t=>t.id).sort());
});

test('modern appendix signals are flagged without rejecting historical discussion of a previous essay',()=>{
 assert.ok(residue('本文即从上述四项基本哲学问题的诠释进路，说明张载的理论体系。').includes('modern-editorial-appendix'));
 assert.deepEqual(residue('前一篇梅聖俞詠泥滑滑。大凡读书，须要先识认本文是说个甚么。'),[]);
});

test('a commentary work retains upstream zhushu as identified source commentary',async()=>{
 const {archiveJsonUnits}=await import('../scripts/corpus-archive.js');
 const plan:Plan={work:'test',provider:'guopop',rootTitle:'四書章句集注',pages:[{title:'book.json',source:'https://raw.githubusercontent.com/Guopop/chinese-philosophy/'+'a'.repeat(40)+'/book.json',revision:'a'.repeat(40),timestamp:'2026-01-01T00:00:00Z',fetchedAt:'2026-01-01T00:00:00Z'}],metadata:{},warnings:[]};
 const units=archiveJsonUnits(plan,{chapters:[{name:'章',paragraphs:[{type:2,paragraph:'經文。',zhushu:'上游所載集注。'}]}]});
 assert.equal(units[0].blocks[1].text,'上游所載集注。');assert.equal(units[0].blocks[1].role,'source-commentary');
 const book=convertUnits({id:'test',title:plan.rootTitle},plan,units);assert.equal(book.chapters[0].paragraphs[1].role,'source-commentary');
});

test('a reviewed correction is compared with its source as the uncorrected text, and needs provenance',()=>{
 const p:Plan={work:'example',provider:'zhwikisource',rootTitle:'例',pages:[],metadata:{},warnings:[]};
 const sourced=convertUnits({id:'example',title:'例'},p,[{identity:'12',title:'甲',source:'https://zh.wikisource.org/w/index.php?oldid=123',path:[],blocks:[{text:'虎不知獸畏已而走也。',headingPath:[]}]}]);
 const original=sourced.chapters[0].paragraphs[0];
 const text='虎不知獸畏己而走也。';const version=`sha256:${digest(text)}`;
 const review={status:'reviewed' as const,author:'A',reviewer:'B',reviewedAt:'2026-10-01',textVersion:version};
 const corrected=structuredClone(sourced);
 corrected.chapters[0].paragraphs[0]={id:original.id,version,text,sourceText:original.text,correction:{reason:'已 for 己',review},aliases:[]};
 const records=[{id:original.id,version:original.version,text:original.text,title:'甲',source:'https://zh.wikisource.org/w/index.php?oldid=123'}];
 // The corrected book restores to exactly what the source produced.
 assert.equal(JSON.stringify(asSourced(corrected,records)),JSON.stringify(sourced));
 assert.equal(JSON.stringify(asSourced(sourced,[])),JSON.stringify(sourced));
 // Without retained history, a reviewer, or a matching text version, the correction is refused.
 assert.throws(()=>asSourced(corrected,[]),/Correction needs reviewed provenance/);
 for(const change of [{reviewer:undefined},{status:'draft' as const},{textVersion:original.version}]){
  const bad=structuredClone(corrected);bad.chapters[0].paragraphs[0].correction!.review={...review,...change} as never;
  assert.throws(()=>asSourced(bad,records),/Correction needs reviewed provenance/);
 }
 const silent=structuredClone(sourced);silent.chapters[0].paragraphs[0]={...original,version,text};
 assert.notEqual(JSON.stringify(asSourced(silent,records)),JSON.stringify(sourced));
});
