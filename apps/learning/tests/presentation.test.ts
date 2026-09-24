import test from 'node:test';
import assert from 'node:assert/strict';
import {wrapText,continuousExcerpt} from '../src/ui/text-layout';
import {paginatePractice,passageLines,defaultPrintOptions,type PracticeCell} from '../src/print-layout';
const cells=(text:string):PracticeCell[]=>Array.from(text).map((char,position)=>({char,position}));
test('measured share wrapping preserves line breaks and punctuation without rewriting',()=>{
 const text='学而时习之，学而时习之。\n「学」，不亦说乎？！';const lines=wrapText(text,7,s=>Array.from(s).length);assert.equal(lines.join(''),text.replaceAll('\n',''));assert.ok(lines.every(s=>! /^[，。！？！」]/.test(s)));assert.ok(lines.every(s=>Array.from(s).length<=7));assert.ok(continuousExcerpt('学而时习之，学而时习之。','学而时习之，\n学而时习之。'));assert.equal(continuousExcerpt('学而时习之。','习而学'),false);
});
test('full passage keeps repeats and punctuation; only character mode deduplicates',()=>{
 const input=cells('学而时习之，学而时习之。');const full=paginatePractice(input,defaultPrintOptions);assert.equal(full.pages.flatMap(p=>p.rows).filter(r=>r.kind==='model').flatMap(r=>r.cells).map(c=>c.char).join(''),'学而时习之，学而时习之。');
 const one=paginatePractice(input,{...defaultPrintOptions,mode:'characters'});assert.equal(one.pages.flatMap(p=>p.rows).map(r=>r.cells[0].char).join(''),'学而时习之');assert.ok(one.pages.flatMap(p=>p.rows).every(r=>r.cells.length===6));
 const lines=passageLines(cells('甲乙丙丁，，。戊己。'),5);assert.ok(lines.every(l=>! /^[，。]/.test(l[0].char)));assert.equal(lines.flat().length,10);
});
test('A4 and Letter pagination fits complete practice groups for all supported sizes',()=>{
 for(const paper of ['A4','Letter'] as const)for(const size of [12,15,18] as const){const o={...defaultPrintOptions,paper,size,pinyin:true,traces:2,blanks:3};const layout=paginatePractice(cells('学而时习之，学而时习之。'.repeat(60)),o);assert.ok(layout.pages.length>1);for(const p of layout.pages){assert.equal(p.rows.length%6,0);assert.ok(p.rows.length*layout.rowHeight<=layout.height-30-28-10);assert.ok(p.rows.every(r=>r.cells.length<=layout.columns));}}
});
