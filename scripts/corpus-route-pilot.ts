import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {jsonFile,root} from './corpus-sources.js';
import {findReference} from '../src/index.js';
import type {TextBook} from '../src/types.js';
export type Pilot={introduction:string;findings:string[];steps:{id:string;stage:number;work:string;title:string;purpose:string;readingFocus:string;question:string;requiresStages:number[];refs:{id:string;version:string;start:number;end:number}[]}[]};
export async function validatePilot(pilot:Pilot){
 const route=await jsonFile<{stage:number;works:string[];extensions:string[]}[]>('corpus/route.json');const seen=new Set<string>();const results=[];
 for(const step of pilot.steps){
  if(!step.id||seen.has(step.id)||!step.title||!step.purpose||!step.question||!step.readingFocus||!step.refs.length)throw new Error('Invalid route pilot step');seen.add(step.id);
  const stage=route.find(s=>s.stage===step.stage);if(!stage?.works.includes(step.work)||step.requiresStages.some(n=>n>=step.stage||!route.some(s=>s.stage===n)))throw new Error('Invalid route stage');
  if(step.work==='chuanxilu'&&!step.requiresStages.includes(6))throw new Error('Missing Neo-Confucian bridge');
  const book=await jsonFile<TextBook>(`src/books/${step.work}.json`);const order=book.chapters.flatMap(c=>c.paragraphs.map(p=>p.id));let previous=-1;let previousEnd=0;
  const passages=step.refs.map(ref=>{
   const hit=findReference(book,ref.id);if(!hit||hit.ref.version!==ref.version)throw new Error(`Stale pilot reference ${ref.id}`);
   const points=Array.from(hit.ref.text);if(!Number.isInteger(ref.start)||!Number.isInteger(ref.end)||ref.start<0||ref.end<=ref.start||ref.end>points.length)throw new Error(`Invalid pilot range ${ref.id}`);
   const position=order.indexOf(ref.id);if(position<previous||position===previous&&ref.start<previousEnd)throw new Error('Unordered/overlapping pilot references');previous=position;previousEnd=ref.end;
   return {text:points.slice(ref.start,ref.end).join(''),source:hit.ref.source,chapter:hit.chapter.title};
  });
  const characters=passages.reduce((n,p)=>n+Array.from(p.text).length,0);if(characters>800)throw new Error(`Pilot too long ${step.id}`);
  results.push({step,passages,characters});
 }
 return results;
}
async function main(){
 const pilot=await jsonFile<Pilot>('corpus/route-pilot.json');const results=await validatePilot(pilot);
 if(process.argv.includes('--write')){
  const lines=['# 阅读路线试读：大学、世说新语、传习录','',pilot.introduction,'','## 验证结果','',`六个样本共 ${results.reduce((n,r)=>n+r.characters,0)} 字符；引用、版本、范围、阅读顺序和阶段归属均通过检查。旧三书格式另经现有来源、身份和别名契约验证。`,'',...pilot.findings.map(s=>'- '+s),''];
  for(const {step,passages,characters} of results){lines.push(`## ${step.title}`,'',`Stage ${step.stage} · ${characters} 字符${step.requiresStages.length?' · 前置：Stage '+step.requiresStages.join('、'):''}`,'',step.purpose,'',...passages.map(p=>'> '+p.text),'',`读法：${step.readingFocus}`,'',`讨论：${step.question}`,'',`出处：${[...new Map(passages.map(p=>[p.source,`[${p.chapter}](${p.source})`])).values()].join('；')}。固定段落版本与选段范围见 [试读清单](../corpus/route-pilot.json)。`,'');}
  await writeFile(new URL('docs/route-pilot.md',root),lines.join('\n')+'\n');
 }
 console.log(`Route pilot: ${results.length} selections, ${results.reduce((n,r)=>n+r.characters,0)} characters; all references resolve.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
