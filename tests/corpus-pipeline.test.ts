import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeHtml,residue} from '../scripts/corpus-normalize.js';
import {childTitles,type Plan} from '../scripts/corpus-sources.js';
import {convertUnits} from '../scripts/corpus.js';
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
