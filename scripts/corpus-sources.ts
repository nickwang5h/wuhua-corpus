import type {SourceImage} from '../src/types.js';
import {fetchImage,verifyImage} from './corpus-images.js';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {normalize,normalizeHtml,imageFiles,type Block} from './corpus-normalize.js';
export type Target={id:string;title:string;priority?:'P0'|'P1'|'P2'};
export type Provider='gujilab'|'zhwikisource'|'guopop'|'daizhige'|'nk2028';
export type Override={provider?:Provider;aliases?:string[];archivePath?:string;rootTitle?:string;excludePages?:string[];gujilabPath?:string;expectedUnits?:number;reason?:string};
export type SourcePage={title:string;pageId?:number;revisionId?:number;timestamp:string;fetchedAt:string;source:string;revision:string;parent?:string;sha256?:string;images?:SourceImage[]};
export type Unit={identity:string;title:string;source:string;path:string[];blocks:Block[];images?:SourceImage[]};
export type Plan={work:string;provider:Provider;rootTitle:string;pages:SourcePage[];metadata:Record<string,string>;warnings:string[];candidates?:string[]};
export const root=new URL('../',import.meta.url);
const cache=new URL('.cache/wuhua-corpus/requests/',root);
export const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
export async function jsonFile<T>(path:string):Promise<T>{return JSON.parse(await readFile(new URL(path,root),'utf8'));}
export async function save(path:string,value:unknown){const file=new URL(path,root);await mkdir(new URL('.',file),{recursive:true});await writeFile(file,JSON.stringify(value,null,2)+'\n');}
let wikiQueue:Promise<void>=Promise.resolve();
let wikiLast=0;
export async function request(url:string,offline=false):Promise<{body:any;fetchedAt:string}>{
 const parsed=new URL(url);if(parsed.protocol!=='https:'||!['commons.wikimedia.org','zh.wikisource.org','api.github.com','raw.githubusercontent.com'].includes(parsed.hostname))throw new Error('Untrusted upstream URL');
 const file=new URL(digest(url)+'.json',cache);
 try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 if(offline)throw new Error('Raw cache missing; run corpus:fetch first');
 let error:unknown;
 for(let attempt=0;attempt<6;attempt++){try{if(['zh.wikisource.org','commons.wikimedia.org'].includes(parsed.hostname)){const wait=wikiQueue.then(async()=>{await new Promise(r=>setTimeout(r,Math.max(0,3500-(Date.now()-wikiLast))));wikiLast=Date.now();});wikiQueue=wait;await wait;}const res=await fetch(url,{headers:{'User-Agent':'WuhuaCorpus/1.0 (personal classical text archive)'},signal:AbortSignal.timeout(45000)});if(res.status===429){const seconds=Number(res.headers.get('retry-after'))||30;wikiLast=Date.now()+Math.min(seconds,60)*1000;}if(!res.ok)throw new Error(`HTTP ${res.status} ${url}`);const raw=await res.text();const body:any=parsed.pathname.endsWith('.txt')?raw:JSON.parse(raw);if(body.error)throw new Error(JSON.stringify(body.error));const result={body,fetchedAt:new Date().toISOString()};await mkdir(cache,{recursive:true});await writeFile(file,JSON.stringify(result));return result;}catch(e){error=e;if(attempt<5)await new Promise(r=>setTimeout(r,1000*(attempt+1)));}}
 throw error;
}
async function api(params:Record<string,string>){const u=new URL('https://zh.wikisource.org/w/api.php');u.search=new URLSearchParams({format:'json',formatversion:'2',maxlag:'5',...params}).toString();return request(u.href);}
export function stripTemplates(text:string){let prior='';while(prior!==text){prior=text;text=text.replace(/\{\{[^{}]*\}\}/g,'');}return text.replace(/<!--[\s\S]*?-->/g,'');}
export function childTitles(raw:string,title:string,workRoot:string):string[]{
 // Header notes can cite unrelated chapters; formatting templates in the TOC must retain links.
 let clean=raw.replace(/<!--[\s\S]*?-->/g,'');
 const header=/\{\{\s*header\b/i.exec(clean);
 if(header){let depth=0;let end=header.index;for(;end<clean.length-1;end++){const pair=clean.slice(end,end+2);if(pair==='{{'){depth++;end++;}else if(pair==='}}'){depth--;end++;if(depth===0){end++;break;}}}clean=clean.slice(0,header.index)+clean.slice(end);}
 const found:string[]=[];
 for(const m of clean.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)){
  let name=m[1].trim().replace(/_/g,' ');if(name.startsWith('/'))name=title+name;
  if(name.startsWith(workRoot+'/')&&name!==title&&!/(?:全[覽览文]|版本|目[錄录])$/.test(name))found.push(name);
 }
 return [...new Set(found)];
}
type WikiResult={page:SourcePage;raw:string};
const wikiMemory=new Map<string,WikiResult>();
const wikiMissing=new Set<string>();
async function wikiPages(titles:string[]):Promise<void>{
 const missing=titles.filter(t=>!wikiMemory.has(t)&&!wikiMissing.has(t));
 for(let i=0;i<missing.length;i+=40){
  const batch=missing.slice(i,i+40);const {body,fetchedAt}=await api({action:'query',titles:batch.join('|'),redirects:'1',prop:'revisions',rvprop:'ids|timestamp|content',rvslots:'main'});
  const mappings=new Map<string,string>([...(body.query.normalized??[]),...(body.query.redirects??[])].map((r:any)=>[r.from,r.to]));
  for(const title of batch){let resolved=title;const visited=new Set<string>();while(mappings.has(resolved)&&!visited.has(resolved)){visited.add(resolved);resolved=mappings.get(resolved)!;}
   const p=body.query.pages.find((p:any)=>p.title===resolved);const r=p?.revisions?.[0];if(!r){wikiMissing.add(title);continue;}
   const result={page:{title:p.title,pageId:p.pageid,revisionId:r.revid,revision:String(r.revid),timestamp:r.timestamp,fetchedAt,source:`https://zh.wikisource.org/w/index.php?oldid=${r.revid}`},raw:r.slots.main.content};wikiMemory.set(title,result);
  }
 }
}
async function wikiPage(title:string):Promise<WikiResult>{await wikiPages([title]);const p=wikiMemory.get(title);if(!p)throw new Error(`Missing Wikisource page: ${title}`);return p;}
export class WikisourceSource{
 async discover(target:Target,override:Override={}):Promise<Plan>{
  let first;try{first=await wikiPage(override.rootTitle??target.title);}catch(e){
   if(!String(e).includes('Missing Wikisource'))throw e;
   const {body}=await api({action:'query',list:'search',srsearch:target.title,srnamespace:'0',srlimit:'5'});
   throw new Error(`${String(e)}; candidates: ${(body.query?.search??[]).map((p:any)=>p.title).join(', ')}`);
  }
  const rootTitle=first.page.title;const pages:SourcePage[]=[first.page];const warnings:string[]=[];
  const metadata:Record<string,string>={};
  for(const key of ['author','author2','times','type']){const m=first.raw.match(new RegExp('\\|\\s*'+key+'\\s*=\\s*([^|}\n]+)'));if(m)metadata[key]=normalize(m[1]);}
  const seen=new Set([rootTitle]);const queue=childTitles(first.raw,rootTitle,rootTitle).map(title=>({title,parent:rootTitle}));
  if(!queue.length){
   // Prefix enumeration recovers works whose contents are supplied by templates.
   let continuation:Record<string,string>={};const prefix:string[]=[];
   do{const {body}=await api({action:'query',list:'allpages',apprefix:rootTitle+'/',apnamespace:'0',aplimit:'500',...continuation});prefix.push(...body.query.allpages.map((p:any)=>p.title));continuation=body.continue??{};}while(Object.keys(continuation).length);
   const usable=prefix.filter(t=>!/(?:全[覽览文]|版本|目[錄录])$/.test(t));
   if(usable.length)queue.push(...usable.map(title=>({title,parent:rootTitle})));
  }
  while(queue.length){
   if(!wikiMemory.has(queue[0].title)&&!wikiMissing.has(queue[0].title))await wikiPages(queue.slice(0,40).map(q=>q.title));
   const next=queue.shift()!;if(seen.has(next.title)||override.excludePages?.includes(next.title))continue;seen.add(next.title);
   const p=await wikiPage(next.title);if(pages.some(x=>x.pageId===p.page.pageId))continue;
   pages.push({...p.page,parent:next.parent});
   // Follow only descendants, never previous/next links to siblings or other books.
   for(const title of childTitles(p.raw,p.page.title,rootTitle).filter(t=>t.startsWith(p.page.title+'/')))queue.push({title,parent:p.page.title});
   if(pages.length>1500)throw new Error('Discovery exceeds 1500 pages; narrow edition root');
  }
  if(/\{\{(?:消歧義|disambig|版本信息)/i.test(first.raw)&&pages.length===1)throw new Error('Edition selection required');
  return {work:target.id,provider:'zhwikisource',rootTitle,pages,metadata,warnings};
 }
 async fetch(plan:Plan):Promise<void>{for(const p of plan.pages){const {body,fetchedAt}=await api({action:'parse',oldid:p.revision!,prop:'text|links|templates',disableeditsection:'1',disabletoc:'1'});if(body.parse?.revid!==p.revisionId)throw new Error(`Revision mismatch ${p.title}`);const hash=digest(body.parse.text);if(p.sha256&&p.sha256!==hash)throw new Error(`Pinned rendered HTML changed (template dependency): ${p.title}`);p.sha256=hash;await save(`.cache/wuhua-corpus/pages/${p.revision}.json`,{html:body.parse.text,templates:body.parse.templates,fetchedAt});if(!normalizeHtml(body.parse.text).length&&!plan.pages.some(c=>c.parent===p.title)){if(p.images?.length){for(const im of p.images)await verifyImage(im);}else{const files=imageFiles(body.parse.text);if(files.length)p.images=await Promise.all(files.map(file=>fetchImage(plan.work,p,file)));}}}}
 async build(plan:Plan):Promise<Unit[]>{
  const units:Unit[]=[];
  for(const p of plan.pages){
   const cached=await jsonFile<{html:string}>(`.cache/wuhua-corpus/pages/${p.revision}.json`);
   if(p.sha256&&p.sha256!==digest(cached.html))throw new Error(`Cached HTML changed: ${p.title}`);
   const blocks=normalizeHtml(cached.html);
   const children=plan.pages.filter(c=>c.parent===p.title);
   if(children.length)continue; // TOC pages are relationships, not body chapters.
   if(!blocks.length&&!p.images?.length)throw new Error(`Empty body ${p.title}`);
   for(const im of p.images??[])await verifyImage(im);
   units.push({identity:String(p.pageId),title:p.title===plan.rootTitle?p.title:p.title.slice(plan.rootTitle.length+1),source:p.source,path:p.title.slice(plan.rootTitle.length+1).split('/').slice(0,-1).filter(Boolean),blocks,...(p.images?.length?{images:p.images}:{})});
  }
  return units;
 }
}
export class GujilabSource{
 async discover(target:Target,override:Override={}):Promise<Plan>{
  const repo='https://api.github.com/repos/gujilab/chinese-classical-corpus';
  const commit=(await request(repo+'/commits/main')).body;
  const {body:tree,fetchedAt}=await request(repo+'/git/trees/'+commit.sha+'?recursive=1');
  if(tree.truncated)throw new Error('Incomplete upstream tree');
  const path=override.gujilabPath??tree.tree.find((p:any)=>new RegExp(`^output/(?:sishu|wujing|shisanjing|histories)/${target.id}\\.json$`).test(p.path))?.path;
  if(!path)throw new Error('No structured Gujilab work');
  const source=`https://raw.githubusercontent.com/gujilab/chinese-classical-corpus/${commit.sha}/${path}`;
  return {work:target.id,provider:'gujilab',rootTitle:target.title,pages:[{title:path,source,revision:commit.sha,timestamp:commit.commit.committer.date,fetchedAt}],metadata:{},warnings:['Upstream may include historical commentary and simplified glyphs; preserved as supplied.']};
 }
 async fetch(plan:Plan){const {body}=await request(plan.pages[0].source);const hash=digest(JSON.stringify(body));if(plan.pages[0].sha256&&plan.pages[0].sha256!==hash)throw new Error('Pinned source changed');plan.pages[0].sha256=hash;}
 async build(plan:Plan):Promise<Unit[]>{
  const {body:rows}=await request(plan.pages[0].source,true);if(plan.pages[0].sha256&&plan.pages[0].sha256!==digest(JSON.stringify(rows)))throw new Error('Cached source changed');if(!Array.isArray(rows)||!rows.length)throw new Error('Invalid Gujilab array');
  const ids=new Set();
  return rows.map((r:any)=>{
   if(typeof r.id!=='string'||ids.has(r.id)||typeof r.content!=='string'||!r.content.trim())throw new Error('Invalid Gujilab record');ids.add(r.id);
   for(const key of ['author','era','category'])if(typeof r[key]==='string')plan.metadata[key]=r[key];
   const title=r.title??r.chapter??r.source;
   const path=[r.chapter,r.subchapter].filter(x=>typeof x==='string'&&x!==title);
   const blocks=r.content.split(/\n+/).map((s:string)=>({text:normalize(s),headingPath:[]})).filter((b:Block)=>b.text);
   return {identity:r.id,title,source:plan.pages[0].source,path,blocks};
  });
 }
}
export const adapters={zhwikisource:new WikisourceSource(),gujilab:new GujilabSource()};
