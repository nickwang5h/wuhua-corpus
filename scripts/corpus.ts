import {readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {adapters as primaryAdapters,digest,jsonFile,save,root,type Target,type Override,type Plan,type Unit} from './corpus-sources.js';
import {verifyImage} from './corpus-images.js';
import {residue,volumeNumber} from './corpus-normalize.js';
import {validateBooks,validateHistory} from '../src/validate.js';
import {applyStructure,retainWithdrawals,structureInput,restoreStructureInput,type Structure,type History} from './corpus-structure.js';
import type {TextBook,Chapter} from '../src/types.js';
import {ArchiveSource} from './corpus-archive.js';
const adapters={...primaryAdapters,guopop:new ArchiveSource('guopop'),daizhige:new ArchiveSource('daizhige'),nk2028:new ArchiveSource('nk2028')};
const frozen=new Set(['laozi','lunyu','zhuangzi']);
export function convertUnits(target:Target,plan:Plan,units:Unit[]):TextBook{
 if(!units.length||units.some(u=>(!u.blocks.length&&!u.images?.length)||u.blocks.some(b=>!b.text.trim())))throw new Error('Empty body unit');
 const chapters:Chapter[]=units.map((u,i)=>{
  const key=digest(plan.provider+':'+u.identity).slice(0,16);
  const paragraphs=u.blocks.map((b,j)=>({id:`p-${target.id}-${key}-${String(j+1).padStart(4,'0')}`,version:`sha256:${digest(b.text)}`,text:b.text,...(b.role?{role:b.role}:{}),aliases:[],...(b.headingPath.length?{headingPath:b.headingPath}:{})}));
  return {id:`chapter-${target.id}-${key}`,number:i+1,title:u.title,source:u.source,...(u.images?.length?{images:u.images}:{}),kind:!paragraphs.length&&u.images?.length?'image':target.id==='guwenguanzhi'&&!/^(序[一二]?|例言)$/.test(u.title)?'anthology-item':units.length===1&&u.title===plan.rootTitle?'work':'chapter',...(u.path.length?{path:u.path}:{}),paragraphs};
 });
 const author=[plan.metadata.author,plan.metadata.author2].filter(Boolean).join('、');
 const metadata={title:target.title,...(author?{author}:{}),...(plan.metadata.era||plan.metadata.times?{era:plan.metadata.era??plan.metadata.times}:{}),...(plan.metadata.category||plan.metadata.type?{genre:[plan.metadata.category??plan.metadata.type]}:{}),metadataMethod:'source-fields' as const,needsReview:!author||/\[\[|\{\{/.test(author), ...(target.id==='guwenguanzhi'?{kind:'anthology' as const}:{} )};
 const book={id:target.id,metadata,chapters};validateBooks([book]);return book;
}
export function metrics(book:TextBook){const paragraphs=book.chapters.flatMap(c=>c.paragraphs);return {chapters:book.chapters.length,paragraphs:paragraphs.length,characters:paragraphs.reduce((n,p)=>n+Array.from(p.text.replace(/\s/g,'')).length,0),emptyChapters:book.chapters.filter(c=>!c.paragraphs.length&&!c.images?.length).length,images:book.chapters.reduce((n,c)=>n+(c.images?.length??0),0),imageChapters:book.chapters.filter(c=>c.kind==='image').length};}
/**
 * A synced book must equal what its pinned source produced. A reviewed correction
 * keeps the paragraph ID, stores the source wording in sourceText and the old
 * version in history; for the comparison it is restored to that source wording.
 */
export function asSourced(book:TextBook,records:{id:string;version:string}[]):TextBook{
 return {...book,chapters:book.chapters.map(c=>({...c,paragraphs:c.paragraphs.map(p=>{
  if(p.sourceText===undefined||p.sourceText===p.text)return p;
  const review=p.correction?.review,sourceVersion=`sha256:${digest(p.sourceText)}`;
  if(!p.correction?.reason||!review||!['reviewed','published'].includes(review.status)||!review.reviewer||!review.reviewedAt||review.textVersion!==p.version||!records.some(r=>r.id===p.id&&r.version===sourceVersion))throw new Error(`Correction needs reviewed provenance and retained history ${p.id}`);
  return Object.fromEntries(Object.entries(p).filter(([k])=>k!=='sourceText'&&k!=='correction').map(([k,v])=>[k,k==='text'?p.sourceText:k==='version'?sourceVersion:v])) as typeof p;
 })}))};
}
export async function checkCorpus(){
 const targets=await jsonFile<Target[]>('corpus/targets.json');
 const books:TextBook[]=[];
 const navigation=await jsonFile<any[]>('src/manifest.json');
 const history=await jsonFile<History>('src/history.json');
 const structure=await jsonFile<Structure>('corpus/structure.json');
 for(const t of targets){let book:TextBook;try{book=await jsonFile<TextBook>(`src/books/${t.id}.json`);}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')continue;throw e;}
  const source=await jsonFile<any>(`sources/corpus/${t.id}.json`);
  if(JSON.stringify(navigation.find(b=>b.id===t.id)?.chapters)!==JSON.stringify(book.chapters.map(({id,number,title,source})=>({id,number,title,source}))))throw new Error(`Stale navigation ${t.id}`);
  if(source.work!==book.id||source.normalizedSha256!==digest(JSON.stringify(asSourced(book,history.records))))throw new Error(`Canonical/source mismatch: ${t.id}`);
  if(structure[t.id]){
   if(!source.structureInput)throw new Error(`Missing pre-edit layout: ${t.id}`);
   const rebuilt=applyStructure(restoreStructureInput(asSourced(book,history.records),source.structureInput,structure,history),structure);
   if(JSON.stringify(rebuilt.book)!==JSON.stringify(asSourced(book,history.records)))throw new Error(`Stale structure: ${t.id}`);
   if(JSON.stringify(retainWithdrawals(history,rebuilt.withdrawn))!==JSON.stringify(history))throw new Error(`Missing withdrawal history: ${t.id}`);
  }
  if(!source.pages?.length||source.pages.some((p:any)=>!p.revision||!p.timestamp||!p.fetchedAt))throw new Error(`Missing provenance ${t.id}`);
  const allowed=new Set(source.pages.map((p:any)=>p.source));
  for(const c of book.chapters){if(!allowed.has(c.source)||(!c.paragraphs.length&&!c.images?.length))throw new Error(`Invalid body source ${c.id}`);for(const im of c.images??[]){if(!source.pages.some((p:any)=>p.images?.some((x:any)=>JSON.stringify(x)===JSON.stringify(im))))throw new Error(`Image provenance mismatch ${im.id}`);await verifyImage(im);}for(const p of c.paragraphs){if(p.version!==`sha256:${digest(p.text)}`)throw new Error(`Text version mismatch ${p.id}`);if(residue(p.text).some(w=>w!=='source-missing-glyph'))throw new Error(`Contamination ${p.id}`);}}
  books.push(book);
 }
 validateBooks(books);validateHistory(history.records,history.transitions,books.flatMap(b=>b.chapters.flatMap(c=>c.paragraphs.map(p=>({...p,title:c.title,source:c.source})))));return books;
}
async function catalog(){
 const names=(await readdir(new URL('src/books/',root))).filter(n=>/^[a-z0-9-]+\.json$/.test(n));
 const old=await jsonFile<any[]>('src/manifest.json');const existing=old.filter(x=>frozen.has(x.id));
 const books=await Promise.all(names.filter(n=>!frozen.has(n.slice(0,-5))).sort().map(n=>jsonFile<TextBook>('src/books/'+n)));
 await save('src/manifest.json',[...existing,...books.map(b=>({id:b.id,chapters:b.chapters.map(({id,number,title,source})=>({id,number,title,source}))}))]);
}
async function build(target:Target,plan:Plan,override:Override){
 const units=await adapters[plan.provider].build(plan);
 if(override.expectedUnits!==undefined&&units.length!==override.expectedUnits)throw new Error(`Expected ${override.expectedUnits} units, found ${units.length}`);
 const original=convertUnits(target,plan,units);
 const structure=await jsonFile<Structure>('corpus/structure.json');
 const {book,withdrawn}=applyStructure(original,structure);const warnings=plan.warnings.filter(w=>!/^(?:source-missing-glyph|short-unit|volume-number-gap):/.test(w));
 for(const c of book.chapters){const text=c.paragraphs.map(p=>p.text).join('');for(const w of residue(text)){if(w!=='source-missing-glyph')throw new Error(`${w}: ${c.title}`);warnings.push(`${w}: ${c.title}`);}if(c.paragraphs.length&&text.length<30)warnings.push(`short-unit: ${c.title}`);}
 const volumes=[...new Set(book.chapters.map(c=>volumeNumber(c.title)).filter((n):n is number=>n!==undefined))];
 if(volumes.length>1&&Math.max(...volumes)<1500){const missing=Array.from({length:Math.max(...volumes)},(_,i)=>i+1).filter(n=>!volumes.includes(n));if(missing.length)warnings.push(`volume-number-gap: ${missing.join(', ')} (text may be present without headings; check upstream structure)`);}
 const stats=metrics(book);if(stats.characters<100&&!stats.images)throw new Error('Suspiciously short work / possible index');
 const source={...plan,normalizer:'wuhua-html-v1',...(structure[target.id]?{structureInput:structureInput(original,structure)}:{}),license:plan.provider==='zhwikisource'?{name:'Wikisource contributor terms; underlying work rights retained upstream',url:'https://zh.wikisource.org/wiki/Wikisource:版權信息',attribution:'中文維基文庫貢獻者'}:{name:plan.provider==='gujilab'?'CC0-1.0 (upstream dataset declaration)':'Unverified; upstream repository terms recorded for later review',url:plan.provider==='gujilab'?`https://github.com/gujilab/chinese-classical-corpus/blob/${plan.pages[0].revision}/LICENSE`:plan.pages[0].source,attribution:plan.provider},warnings:[...new Set(warnings)],normalizedSha256:digest(JSON.stringify(book)),stats};
 // Never silently revise previously ingested text: changed candidates remain in cache.
 let previous:TextBook|undefined;try{previous=await jsonFile<TextBook>(`src/books/${target.id}.json`);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 const history=await jsonFile<History>('src/history.json');
 // Only an explicit structure edit may replace the exact pinned, unedited book.
 const structuralUpdate=structure[target.id]?.length&&previous&&JSON.stringify(previous)===JSON.stringify(original);
 if(previous&&JSON.stringify(asSourced(previous,history.records))!==JSON.stringify(book)&&!structuralUpdate){await save(`.cache/wuhua-corpus/candidates/${target.id}.json`,book);throw new Error('Canonical changed; candidate saved. Explicit revision/history required.');}
 const retained=retainWithdrawals(history,withdrawn);
 validateHistory(withdrawn.records,withdrawn.transitions,book.chapters.flatMap(c=>c.paragraphs.map(p=>({...p,title:c.title,source:c.source}))));
 if(JSON.stringify(retained)!==JSON.stringify(history))await save('src/history.json',retained);
 await save(`src/books/${target.id}.json`,previous&&!structuralUpdate?previous:book);await save(`sources/corpus/${target.id}.json`,source);
 return {id:target.id,title:target.title,priority:target.priority??'P1',status:'resolved',provider:plan.provider,...stats,warnings:source.warnings};
}
export async function report(){
 const targets=await jsonFile<Target[]>('corpus/targets.json');const rows=[];
 let previous:any;try{previous=await jsonFile<any>('corpus/report.json');}catch{}
 for(const t of targets){let s:any;try{s=await jsonFile<any>(`sources/corpus/${t.id}.json`);}catch{}let failure:any;try{failure=await jsonFile<any>(`.cache/wuhua-corpus/status/${t.id}.json`);}catch{}
  let discovery:Plan|undefined;if(!s){try{discovery=await jsonFile<Plan>(`.cache/wuhua-corpus/plans/${t.id}.json`);}catch{discovery=previous?.rows?.find((r:any)=>r.id===t.id)?.discovery;}}
  rows.push({id:t.id,title:t.title,priority:t.priority??'P1',status:s?'resolved':'unresolved',...(s?{provider:s.provider,revisions:[...new Set(s.pages.map((p:any)=>p.revision))],sourcePages:s.pages.length,fetchedPages:s.pages.filter((p:any)=>p.sha256).length,...s.stats,warnings:s.warnings}: {reason:failure?.reason??previous?.rows?.find((r:any)=>r.id===t.id)?.reason??'Not yet ingested',...(discovery?{discovery}:{})})});
 }
 const legacy=await Promise.all([...frozen].map(id=>jsonFile<TextBook>(`src/books/${id}.json`)));
 const newCharacters=rows.reduce((n,x)=>n+(x.characters??0),0);
 const summary={targets:rows.length,resolved:rows.filter(x=>x.status==='resolved').length,unresolved:rows.filter(x=>x.status!=='resolved').length,coreWorks:rows.filter(x=>x.priority==='P0').length,coreResolved:rows.filter(x=>x.priority==='P0'&&x.status==='resolved').length,sourcePages:rows.reduce((n,x)=>n+(x.sourcePages??0),0),fetchedPages:rows.reduce((n,x)=>n+(x.fetchedPages??0),0),images:rows.reduce((n,x)=>n+(x.images??0),0),imageChapters:rows.reduce((n,x)=>n+(x.imageChapters??0),0),emptyChapters:rows.reduce((n,x)=>n+(x.emptyChapters??0),0),warnings:rows.reduce((n,x)=>n+(x.warnings?.length??0),0),legacyWorks:legacy.length,newCharacters,characters:newCharacters+legacy.reduce((n,b)=>n+metrics(b).characters,0)};
 await save('corpus/report.json',{...summary,rows});
 console.log(JSON.stringify(summary));
 for(const row of rows)console.log(`${row.priority} ${row.id}: ${row.status} ${row.provider??''} ${row.chapters??0} units, ${row.characters??0} chars${row.reason?' — '+row.reason:''}`);
 return rows;
}
async function main(){
 const [command='sync',...args]=process.argv.slice(2);const bootstrap=args.includes('--bootstrap');const ids=args.filter(a=>a!=='--bootstrap');const targets=await jsonFile<Target[]>('corpus/targets.json');const overrides=await jsonFile<Record<string,Override>>('corpus/overrides.json');
 if(new Set(targets.map(t=>t.id)).size!==targets.length||targets.some(t=>!/^[a-z0-9-]+$/.test(t.id)||!t.title||frozen.has(t.id)))throw new Error('Invalid/frozen targets');
 if(ids.some(id=>!targets.some(t=>t.id===id)))throw new Error('Unknown target ID');
 if(command==='check'){console.log(`Validated ${(await checkCorpus()).length} new works`);return;}
 if(command==='report'){await report();return;}
 if(!['sync','discover','fetch','build'].includes(command))throw new Error('Unknown command');
 const selected=targets.filter(t=>!ids.length||ids.includes(t.id)).sort((a,b)=>(a.priority??'P1').localeCompare(b.priority??'P1'));let failures=0;
 // Bounded concurrency; each work has a single primary provider and independent failure.
 let next=0;await Promise.all(Array.from({length:3},async()=>{while(next<selected.length){const t=selected[next++];try{
  const o=overrides[t.id]??{};let plan:Plan;
  try{plan=await jsonFile<Plan>(`sources/corpus/${t.id}.json`);}catch{
   if(command==='discover'||command==='sync'){
    try{
     let candidate:Plan|undefined;
     if(bootstrap&&!o.provider){for(const provider of ['gujilab','nk2028','guopop','daizhige'] as const){try{candidate=await adapters[provider].discover(t,o);candidate.warnings.push('Explicit bulk bootstrap: one indexed whole-work archive selected. Normal single-work discovery defaults to Wikisource.');break;}catch{}}}
     plan=candidate??await adapters[o.provider??'zhwikisource'].discover(t,o);
    }catch(e){if(o.provider)throw e;let fallback:Plan|undefined;for(const provider of ['gujilab','nk2028','guopop','daizhige'] as const){try{fallback=await adapters[provider].discover(t,o);break;}catch{}}if(!fallback)throw e;plan=fallback;plan.warnings.push(`Wikisource discovery failed: ${String(e)}`);}
    if(plan.provider==='zhwikisource'&&plan.pages.length>24&&!o.provider){
     for(const provider of ['gujilab','guopop'] as const){try{const candidate=await adapters[provider].discover(t,o);candidate.warnings.push(`Structured whole-work bootstrap selected after discovering ${plan.pages.length} Wikisource pages.`);plan=candidate;break;}catch{}}
    }
    await save(`.cache/wuhua-corpus/plans/${t.id}.json`,plan);
   }else plan=await jsonFile<Plan>(`.cache/wuhua-corpus/plans/${t.id}.json`);
  }
  if(command==='sync'||command==='fetch'){await adapters[plan.provider].fetch(plan);await save(`.cache/wuhua-corpus/plans/${t.id}.json`,plan);}
  let status:unknown;
  if(command==='sync'||command==='build'){
   try{status=await build(t,plan,o);}catch(error){
    if(command!=='sync'||o.provider||plan.provider!=='zhwikisource'||String(error).includes('Canonical changed'))throw error;
    let recovered=false;
    for(const provider of ['gujilab','nk2028','guopop','daizhige'] as const){try{
     const alternative=await adapters[provider].discover(t,o);alternative.warnings.push(`Wikisource conversion failed: ${String(error)}`);
     await adapters[provider].fetch(alternative);status=await build(t,alternative,o);recovered=true;break;
    }catch{}}
    if(!recovered)throw error;
   }
  }else status={id:t.id,status:command,pages:plan.pages.length};
  await save(`.cache/wuhua-corpus/status/${t.id}.json`,status);console.log(t.id,JSON.stringify({...status as object,warnings:(status as any).warnings?.length}));
 }catch(e){failures++;const status={id:t.id,status:'unresolved',reason:String(e)};await save(`.cache/wuhua-corpus/status/${t.id}.json`,status);console.error(JSON.stringify(status));}}}));
 if(command==='sync'||command==='build'){await catalog();await checkCorpus();await report();}
 if(failures)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
