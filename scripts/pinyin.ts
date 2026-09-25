import {readFile,writeFile,rename,rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {manifest} from '../src/index.js';
import {readBook} from './read-book.js';
import {preparePinyin,applyPinyin,type PinyinRequest,type PinyinProposal} from '../src/pinyin-workflow.js';
import {validateAids} from '../src/validate.js';
import type {Aid,Reference} from '../src/types.js';

const [command,input,output,...extra]=process.argv.slice(2);
if(!input||extra.length||!['prepare','apply'].includes(command)||command==='prepare'&&!output||command==='apply'&&output)throw new Error('Usage: pinyin:prepare -- requests.json candidates.json | pinyin:apply -- candidates.json');
const aidPath=new URL('../src/pinyin-aids.json',import.meta.url);
if(command==='prepare'&&resolve(output)===resolve(aidPath.pathname))throw new Error('Candidates must not overwrite shared annotations');
const books=await Promise.all(manifest.map(b=>readBook(b.id)));
const refs=new Map<string,Reference>(books.flatMap(b=>b.chapters.flatMap(c=>c.paragraphs.map(p=>[p.id,{id:p.id,version:p.version,text:p.text,title:c.title,source:c.source}] as const))));
const existingText=await readFile(aidPath,'utf8');const aids=JSON.parse(existingText) as Aid[];
validateAids(aids,books);
const items=JSON.parse(await readFile(input,'utf8')) as unknown;
if(!Array.isArray(items))throw new Error('Expected a JSON array');
function reference(target:string){const ref=refs.get(target);if(!ref)throw new Error(`Unknown paragraph: ${target}`);return ref;}
if(command==='prepare'){
 const candidates=items.map((r:PinyinRequest)=>preparePinyin(reference(r.target),r,aids));
 await writeFile(output,JSON.stringify(candidates,null,2)+'\n',{flag:'wx'});
 console.log(`${candidates.length} candidates prepared; inspect tokens and add decision.author / decision.note before applying.`);
}else{
 let next=aids;
 // Every accepted item is checked before a single atomic write; pending candidates are left alone.
 for(const p of items as PinyinProposal[])if(p.decision)next=applyPinyin(reference(p.request.target),p,next);
 validateAids(next,books);
 if(await readFile(aidPath,'utf8')!==existingText)throw new Error('Annotations changed during apply');
 if(JSON.stringify(next)!==JSON.stringify(aids)){
  const temporary=new URL(`../src/.pinyin-aids.${randomUUID()}.pending.json`,import.meta.url);
  try{await writeFile(temporary,JSON.stringify(next,null,4)+'\n',{flag:'wx'});await rename(temporary,aidPath);}finally{await rm(temporary,{force:true});}
 }
 console.log(`Applied accepted candidates; ${items.filter((p:PinyinProposal)=>!p.decision).length} still pending.`);
}
