// Low-cost whole-work fallback. Its upstream schema never escapes this adapter.
import {Converter} from 'opencc-js';
import {request,type Target,type Override,type Plan,type Unit,digest} from './corpus-sources.js';
import {normalize,volumeNumber} from './corpus-normalize.js';
const simplify=Converter({from:'tw',to:'cn'});
const key=(s:string)=>simplify(s).replace(/[\s·・]/g,'');
const repos={guopop:'Guopop/chinese-philosophy',daizhige:'garychowcmu/daizhigev20',nk2028:'nk2028/lzh-collection'};
export class ArchiveSource{
 constructor(readonly provider:keyof typeof repos){}
 async discover(target:Target,override:Override={}):Promise<Plan>{
  const repository=repos[this.provider];const base='https://api.github.com/repos/'+repository;
  const info=(await request(base)).body;const commit=(await request(base+'/commits/'+info.default_branch)).body;
  const {body:tree,fetchedAt}=await request(base+'/git/trees/'+commit.sha+'?recursive=1');if(tree.truncated)throw new Error('Incomplete archive tree');
  const names=[target.title,...(override.aliases??[])].map(key);
  const candidates=tree.tree.filter((p:any)=>p.type==='blob'&& !p.path.startsWith('back/') && (this.provider==='guopop'?p.path.endsWith('.json'):p.path.endsWith('.txt')) && names.includes(key(p.path.split('/').at(-1).replace(/\.(json|txt)$/,''))));
  const path=override.archivePath??(candidates.length===1?candidates[0].path:undefined);if(!path)throw new Error(`${this.provider}: ${candidates.length} matching files (${candidates.map((p:any)=>p.path).join(', ')})`);
  const source=`https://raw.githubusercontent.com/${repository}/${commit.sha}/${path.split('/').map(encodeURIComponent).join('/')}`;
  return {work:target.id,provider:this.provider,rootTitle:target.title,pages:[{title:path,source,revision:commit.sha,timestamp:commit.commit.committer.date,fetchedAt}],metadata:{},warnings:['Fallback archive: upstream glyphs and historical commentary preserved; bibliographic metadata may be incomplete.'],...(override.omitLines?{omitLines:override.omitLines}:{}),...(override.headingLines?{headingLines:override.headingLines}:{}),...(override.variantVolumeHeadings?{variantVolumeHeadings:true}:{})};
 }
 async fetch(plan:Plan){const result=await request(plan.pages[0].source);const hash=digest(typeof result.body==='string'?result.body:JSON.stringify(result.body));if(plan.pages[0].sha256&&plan.pages[0].sha256!==hash)throw new Error('Pinned archive changed');plan.pages[0].sha256=hash;}
 async build(plan:Plan):Promise<Unit[]>{
  const {body}=await request(plan.pages[0].source,true);
  const hash=digest(typeof body==='string'?body:JSON.stringify(body));if(plan.pages[0].sha256&&plan.pages[0].sha256!==hash)throw new Error('Cached source changed');
  if(this.provider==='guopop')return archiveJsonUnits(plan,body);
  if(typeof body!=='string'||!body.trim())throw new Error('Invalid archive text');
  const prepared=body.replace(/^[ \t　]*[●◎]\s*(卷[第之]?[一二三四五六七八九十百零〇0-9]+)(?=[○◎]|\s)/gm,'$1\n');
  let lines=prepared.replace(/^\uFEFF/,'').split(/\r?\n/).map(normalize).filter(Boolean);
  lines=lines.filter(line=>!plan.omitLines?.includes(line)&&! /^(?:回目[录錄]|<[^<>]*(?:部|藏)[^<>]*>|注[释釋]：|第\s*\d+\s*[页頁]\s*[［〔\[])/.test(line));
  const toc=lines.findIndex(line=>/^(目[录錄])$/.test(line));
  if(toc>=0){const repeated=lines.indexOf(lines[toc+1],toc+2);if(repeated>toc+1&&repeated-toc<150&&lines.slice(toc+1,repeated).every(s=>s.length<60))lines.splice(toc,repeated-toc);}
  const units:Unit[]=[];let title=plan.rootTitle;let blocks:Unit['blocks']=[];let ordinal=0;
  const flush=()=>{if(blocks.length){units.push({identity:`${plan.pages[0].title}#${++ordinal}`,title,source:plan.pages[0].source,path:[],blocks});blocks=[];}};
  const volume=/^(?:[○◎●]?\s*)?(?:卷[第之]?[一二三四五六七八九十百零〇上下中0-9]+|第[一二三四五六七八九十百0-9]+[卷篇]|[上下中]卷)(?:\s|　|$)/;
  for(const line of lines){
   const simplified=key(line);const titleKey=key(plan.rootTitle);const sourceTitle=simplified.startsWith(titleKey)?simplified.slice(titleKey.length):line;
   // Preserve pinned segmentation unless variant volume headings are selected.
   const withoutTitle=plan.variantVolumeHeadings?sourceTitle.replace(/巻/g,'卷'):sourceTitle;const headingLine=plan.variantVolumeHeadings?line.replace(/巻/g,'卷'):line;
   const heading=line.length<60&&(plan.headingLines?.includes(line)||volume.test(headingLine)||volume.test(withoutTitle)||/^[^。！？；，]{1,24}卷(?:第|之)?[一二三四五六七八九十百上下中]+(?:\s|$)/.test(headingLine)||/^.{1,18}篇第[一二三四五六七八九十百]+$/.test(line)||/^(?:导言|導言|论|論)[一二三四五六七八九十]+\s/.test(line)||/^(?:自序|吳序|吴序|譯例言|译例言)$/.test(line));
   if(heading){if(volumeNumber(line)!==undefined&&volumeNumber(line)===volumeNumber(title))continue;flush();title=line;}else blocks.push({text:line,headingPath:[]});
  }flush();
  return units;
 }
}


export function archiveJsonUnits(plan:Plan,body:any):Unit[]{
 if(!Array.isArray(body.chapters)||!body.chapters.length)throw new Error('Invalid archive chapters');
 if(typeof body.author==='string')plan.metadata.author=body.author;
 // When the requested work IS a commentary, zhushu is essential authored content.
 const includeNotes=/(?:章句|集[注註]|正義|注疏|集解|箋|疏證)/.test(plan.rootTitle);
 plan.metadata.annotationPolicy=includeNotes?'include-source-commentary':'primary-field-only';
 return body.chapters.map((c:any,i:number)=>{
  if(typeof c.name!=='string'||!Array.isArray(c.paragraphs))throw new Error('Invalid archive chapter');
  const blocks:Unit['blocks']=[];
  for(const p of c.paragraphs){
   if(typeof p.paragraph!=='string')throw new Error('Invalid archive paragraph');
   if(p.type!==1)for(const s of p.paragraph.split(/\n+/)){const text=normalize(s);if(text)blocks.push({text,headingPath:[]});}
   if(includeNotes&&p.zhushu){if(typeof p.zhushu!=='string')throw new Error('Invalid source commentary');for(const s of p.zhushu.split(/\n+/)){const text=normalize(s);if(text)blocks.push({text,headingPath:p.type===1?[normalize(p.paragraph)]:[],role:'source-commentary'});}}
  }
  return {identity:`${plan.pages[0].title}#${i+1}`,title:c.name,source:plan.pages[0].source,path:[],blocks};
 });
}
