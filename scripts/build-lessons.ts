import {readFile,readdir,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {parseLesson} from './lesson-schema';
import {validateUnits} from '../packages/content/src/validate';
import {readBook} from './read-book';
import {pinyinAids} from '../packages/content/src/pinyin';
import type {Unit} from '../packages/content/src/types';
export async function compileLessons(){
 const root=new URL('../content/learning/',import.meta.url);
 const names=(await readdir(root)).filter(n=>n.endsWith('.yaml')).sort();
 if(!names.length)throw new Error('没有课程 YAML');
 const lessons=await Promise.all(names.map(async name=>{const item=parseLesson(await readFile(new URL(name,root),'utf8'),name);if(name!==`${item.unit.id}.yaml`)throw new Error(`${name}: 文件名必须匹配课程 ID`);return item;}));
 const orders=new Set(lessons.map(l=>l.order));if(orders.size!==lessons.length)throw new Error('课程 order 重复');
 lessons.sort((a,b)=>a.order-b.order);
 const units=lessons.map(l=>l.unit);
 const expanded=units.map(u=>({...u,aids:[...u.aids,...u.pinyinAidIds.map(id=>{const aid=pinyinAids.find(a=>a.id===id);if(!aid)throw new Error(`${u.id}: 缺少拼音 ${id}`);return aid;})]})) as Unit[];
 const books=await Promise.all(['lunyu','laozi','zhuangzi'].map(readBook));validateUnits(expanded,books);
 for(const u of expanded){for(const r of u.refs){const p=books.flatMap(b=>b.chapters.flatMap(c=>c.paragraphs)).find(p=>p.id===r.id)!;const aid=u.aids.find(a=>a.kind==='pinyin'&&a.target===r.id&&a.version===r.version);for(let i=r.start;i<r.end;i++)if(/\p{Script=Han}/u.test(Array.from(p.text)[i])&&!aid?.tokens?.some(t=>t.start===i&&t.end===i+1))throw new Error(`${u.id}: 原文位置 ${i} 缺少对齐拼音`);}}
 return units;
}
export async function buildLessons(check=false){
 const units=await compileLessons();const target=new URL('../packages/content/src/learning-units.json',import.meta.url);
 // Canonical JSON key order; this artifact is not the editing source.
 const keys=['id','version','title','level','goal','prerequisites','intro','refs','aids','exercises','reflection','review','compatibleVersions','pinyinAidIds'];
 const output=JSON.stringify(units.map(u=>Object.fromEntries(keys.map(k=>[k,u[k as keyof typeof u]]))),null,2)+'\n';
 const old=await readFile(target,'utf8').catch(()=>null);
 if(check){if(old!==output)throw new Error('课程生成文件已过期：运行 npm run lessons:generate');}
 else if(old!==output){const temp=new URL(`learning-units.${process.pid}.tmp`,target);await writeFile(temp,output);await rename(temp,target);}
 console.log(`${units.length} lessons ${check?'validated; generated JSON is current':'validated and generated'} (editorial review remains separate).`);
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{if(process.argv.slice(2).some(a=>a!=='--check'))throw new Error('用法：build-lessons.ts [--check]');await buildLessons(process.argv.includes('--check'));}catch(e){console.error(e instanceof Error?e.message:e);process.exitCode=1;}
}
