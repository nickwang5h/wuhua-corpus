import type {TextBook,Aid,Reference,Transition} from './types.js';
import {alignReference} from './pinyin-core.js';
export function pinnedSource(value:string){
 const source=new URL(value);
 if(source.protocol!=='https:')return false;
 if(source.hostname==='zh.wikisource.org')return /^[1-9]\d*$/.test(source.searchParams.get('oldid')??'');
 return source.hostname==='raw.githubusercontent.com'&&/^\/(?:gujilab\/chinese-classical-corpus|Guopop\/chinese-philosophy|garychowcmu\/daizhigev20|nk2028\/lzh-collection)\/[a-f0-9]{40}\/.+\.(?:json|txt)$/.test(source.pathname);
}
export function validateBooks(books:TextBook[]){
 const ids=new Set<string>();
 const add=(id:string)=>{if(typeof id!=='string'||!id||ids.has(id))throw new Error(`Duplicate/empty identity ${id}`);ids.add(id);};
 const strings=(value:unknown)=>Array.isArray(value)&&value.every(x=>typeof x==='string'&&x.trim());
 for(const b of books){
  add(b.id);
  if(!Array.isArray(b.chapters)||!b.chapters.length)throw new Error(`Empty book ${b.id}`);
  if(b.metadata&&(!b.metadata.title||typeof b.metadata.needsReview!=='boolean'||b.metadata.metadataMethod!=='source-fields'||b.metadata.genre!==undefined&&!strings(b.metadata.genre)))throw new Error(`Invalid metadata ${b.id}`);
  for(const c of b.chapters){
   add(c.id);
   if(!pinnedSource(c.source))throw new Error(`Unpinned source ${c.id}`);
   if(!Number.isInteger(c.number)||c.number<1||!c.title||!Array.isArray(c.paragraphs)||(!c.paragraphs.length&&!(c.kind==='image'&&c.images?.length))||c.path!==undefined&&!strings(c.path)||c.kind!==undefined&&!['work','chapter','anthology-item','image'].includes(c.kind))throw new Error(`Invalid chapter ${c.id}`);
   if(c.kind==='image'&&c.paragraphs.length)throw new Error(`Image page cannot contain placeholder text ${c.id}`);
   if(c.images!==undefined&&!Array.isArray(c.images))throw new Error(`Invalid images ${c.id}`);
   for(const im of c.images??[]){
    add(im.id);
    const url=new URL(im.url);
    if(!['image/jpeg','image/png'].includes(im.mime)||!Number.isInteger(im.width)||!Number.isInteger(im.height)||im.width<=0||im.height<=0||!im.fileTitle?.startsWith('File:')||!im.caption||!im.rights?.license||!im.rights.attribution||!Number.isFinite(Date.parse(im.fileTimestamp))||!(/^[a-f0-9]{40}$/).test(im.fileSha1)||!(/^[a-f0-9]{64}$/).test(im.sha256)||im.version!==`sha256:${im.sha256}`||im.asset!==`assets/${im.sha256}.${im.mime==='image/jpeg'?'jpg':'png'}`||im.source!==c.source||url.protocol!=='https:'||url.hostname!=='upload.wikimedia.org'||!url.pathname.startsWith('/wikipedia/commons/'))throw new Error(`Invalid image ${im.id}`);
   }
   for(const p of c.paragraphs){
    add(p.id);
    if(typeof p.text!=='string'||!p.text.trim()||!p.version||!Array.isArray(p.aliases)||p.role!==undefined&&p.role!=='source-commentary'||p.headingPath!==undefined&&!strings(p.headingPath))throw new Error(`Empty/invalid text ${p.id}`);
    for(const a of p.aliases){
     add(a.id);
     if(!a.version||!a.text||a.start<0||a.end<=a.start)throw new Error(`Invalid alias ${a.id}`);
     if(a.version===p.version&&Array.from(p.text).slice(a.start,a.end).join('')!==a.text)throw new Error(`Alias alignment ${a.id}`);
    }
   }
  }
 }
 return ids;
}
export function validateHistory(records:Reference[],transitions:Transition[],current:Reference[]){
 const all=new Map([...current,...records].map(r=>[`${r.id}@${r.version}`,r]));
 if(new Set(records.map(r=>`${r.id}@${r.version}`)).size!==records.length)throw new Error('Duplicate history');
 const edges=new Map<string,string[]>();
 for(const t of transitions){const from=`${t.from.id}@${t.from.version}`;if(!all.has(from)||edges.has(from)||!t.reason)throw new Error('Invalid historical transition');const targets=t.targets.map(x=>`${x.id}@${x.version}`);if(targets.some(x=>!all.has(x)))throw new Error('Missing successor');if(t.kind==='split'&&targets.length<2)throw new Error('Split needs successors');if(t.kind==='withdrawn'&&targets.length)throw new Error('Withdrawal cannot silently redirect');for(const target of t.targets)if(target.start!==undefined||target.end!==undefined){const r=all.get(`${target.id}@${target.version}`)!;if(!Number.isInteger(target.start)||!Number.isInteger(target.end)||target.start!<0||target.end!<=target.start!||target.end!>Array.from(r.text).length)throw new Error('Invalid successor range');}edges.set(from,targets);}
 const visit=(key:string,stack:Set<string>)=>{if(stack.has(key))throw new Error('Transition cycle');for(const next of edges.get(key)||[])visit(next,new Set([...stack,key]));};for(const k of edges.keys())visit(k,new Set());
}
// Auxiliary data remains independent of Learn's editorial format.
export function validateAids(aids:Aid[],books:TextBook[]) {
 const ids=new Set<string>();
 const activePinyin:Aid[]=[];
 const paragraphs=new Map(books.flatMap(b=>b.chapters.flatMap(c=>c.paragraphs.map(p=>[p.id,p] as const))));
 for(const aid of aids){
  const p=paragraphs.get(aid.target);
  if(ids.has(aid.id)||!aid.rights.author||!aid.rights.license)throw new Error(`Invalid aid identity/rights ${aid.id}`);
  ids.add(aid.id);
  if(!p||p.version!==aid.version||aid.review.textVersion!==aid.version)throw new Error(`Stale aid ${aid.id}`);
  if(['reviewed','published'].includes(aid.review.status)&&(!aid.review.reviewer||!aid.review.reviewedAt))throw new Error(`Incomplete review ${aid.id}`);
  if(aid.start!==undefined||aid.end!==undefined){
   if(!Number.isInteger(aid.start)||!Number.isInteger(aid.end)||aid.start!<0||aid.end!<=aid.start!||aid.end!>Array.from(p.text).length)throw new Error(`Invalid aid range ${aid.id}`);
  }
  if(aid.kind==='pinyin'){
   if(aid.review.status!=='withdrawn'){
    const lo=aid.start??Math.min(...(aid.tokens??[]).map(t=>t.start)),hi=aid.end??Math.max(...(aid.tokens??[]).map(t=>t.end));
    if(activePinyin.some(a=>a.target===aid.target&&a.version===aid.version&&(a.start??Math.min(...a.tokens!.map(t=>t.start)))<hi&&(a.end??Math.max(...a.tokens!.map(t=>t.end)))>lo))throw new Error(`Overlapping active pinyin ${aid.id}`);
    activePinyin.push(aid);
   }
   const result=alignReference({id:p.id,version:p.version,text:p.text,title:'',source:''},p.text,aid,true);
   if(result.status==='invalid'||result.status==='unalignable')throw new Error(`Pinyin alignment ${aid.id}: ${result.issues.join('; ')}`);
  }else if(!aid.text)throw new Error(`Empty aid ${aid.id}`);
 }
}
