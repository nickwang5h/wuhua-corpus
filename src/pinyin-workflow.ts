import type {Aid,Reference,PinyinToken} from './types.js';
import {alignReference,isHan,pinyinSyllables} from './pinyin-core.js';
import {generatePinyinCandidate,type PinyinCandidate} from './pinyin-generator.js';

export type PinyinRequest={target:string;version:string;start:number;end:number};
export type PinyinProposal=PinyinCandidate & {
 request:PinyinRequest; context:string; existing:Aid[];
 decision?:{author:string;note:string};
};
function checkRequest(ref:Reference,r:PinyinRequest){
 if(ref.start!==undefined||ref.id!==r.target||ref.version!==r.version||!Number.isInteger(r.start)||!Number.isInteger(r.end)||r.start<0||r.end<=r.start||r.end>Array.from(ref.text).length)throw new Error('Invalid or stale pinyin request');
}
function active(ref:Reference,aids:readonly Aid[]){return aids.filter(a=>a.kind==='pinyin'&&a.target===ref.id&&a.review.status!=='withdrawn');}
function checkExisting(ref:Reference,aids:readonly Aid[]){
 const seen=new Set<number>();
 for(const a of active(ref,aids)){
  const result=alignReference(ref,ref.text,a,true);
  if(result.status==='invalid'||result.status==='unalignable')throw new Error(result.issues.join('; '));
  for(const t of a.tokens??[]){if(seen.has(t.start))throw new Error('Overlapping active pinyin tokens');seen.add(t.start);}
 }
}
/** Full source context goes to the engine; only requested source positions are proposed. */
export function preparePinyin(ref:Reference,request:PinyinRequest,aids:readonly Aid[]):PinyinProposal{
 checkRequest(ref,request);checkExisting(ref,aids);
 const generated=generatePinyinCandidate(ref.text);
 const existing=active(ref,aids);
 const old=new Map(existing.flatMap(a=>a.tokens??[]).map(t=>[t.start,t]));
 const tokens=generated.tokens.filter(t=>t.start>=request.start&&t.end<=request.end);
 const issues=generated.issues.filter(x=>x.start>=request.start&&x.start<request.end);
 for(let i=0;i<tokens.length;i++){
  const prior=old.get(tokens[i].start);
  if(prior){
   if(prior.pinyin!==tokens[i].pinyin)issues.push({kind:'existing-difference',start:prior.start,text:prior.text,candidates:[prior.pinyin,tokens[i].pinyin],existing:prior.pinyin,proposed:tokens[i].pinyin});
   tokens[i]={...prior};
  }
 }
 // A previously annotated rare character remains usable even if the engine cannot read it.
 for(const t of old.values())if(t.start>=request.start&&t.end<=request.end&&!tokens.some(x=>x.start===t.start))tokens.push({...t});
 tokens.sort((a,b)=>a.start-b.start);
 return {request,context:ref.text,existing:structuredClone(existing),tokens,issues,generator:generated.generator};
}
function sameToken(a:PinyinToken,b:PinyinToken){return a.start===b.start&&a.end===b.end&&a.text===b.text&&a.pinyin===b.pinyin;}

/** Add only. Corrections of already distributed readings require a separate explicit edit. */
export function applyPinyin(ref:Reference,proposal:PinyinProposal,aids:readonly Aid[]):Aid[]{
 checkRequest(ref,proposal.request);checkExisting(ref,aids);
 if(ref.text!==proposal.context)throw new Error('Source context changed');
 if(!proposal.decision?.author?.trim()||!proposal.decision.note?.trim())throw new Error('Pinyin candidate needs an editorial decision and evidence note');
 const {start,end}=proposal.request,chars=Array.from(ref.text);
 const wanted=chars.flatMap((c,i)=>i>=start&&i<end&&isHan(c)?[i]:[]);
 if(!wanted.length||wanted.length!==proposal.tokens.length||proposal.tokens.some((t,i)=>t.start!==wanted[i]||t.end!==t.start+1||t.text!==chars[t.start]||pinyinSyllables(t.pinyin)?.length!==1||pinyinSyllables(t.pinyin)?.[0]!==t.pinyin))throw new Error('Incomplete or invalid candidate alignment');
 const current=active(ref,aids),old=new Map(current.flatMap(a=>a.tokens??[]).map(t=>[t.start,t]));
 for(const t of proposal.tokens){const prior=old.get(t.start);if(prior&&!sameToken(prior,t))throw new Error(`Refusing to overwrite existing pronunciation at ${t.start}`);}
 if(proposal.tokens.every(t=>old.has(t.start)))return [...aids];
 if(JSON.stringify(current)!==JSON.stringify(proposal.existing))throw new Error('Existing annotations changed; prepare a new candidate');
 const overlapping=current.filter(a=>{
  const from=a.start??Math.min(...a.tokens!.map(t=>t.start)),to=a.end??Math.max(...a.tokens!.map(t=>t.end));
  return from<end&&to>start;
 });
 if(overlapping.length>1)throw new Error('Request spans multiple annotation ranges; split the request');
 const previous=overlapping[0];
 if(previous&&previous.review.status!=='draft')throw new Error('Extending a reviewed annotation requires a separate editorial revision');
 const tokens=[...(previous?.tokens??[]),...proposal.tokens.filter(t=>!old.has(t.start))].sort((a,b)=>a.start-b.start);
 const id=previous?.id??`${ref.id}-pinyin-${start}-${end}`;
 if(!previous&&aids.some(a=>a.id===id))throw new Error('Pinyin identity already exists');
 const author=proposal.decision.author;
 const aid:Aid={...(previous??{}),id,target:ref.id,version:ref.version,kind:'pinyin',start:Math.min(start,previous?.start??start,...tokens.map(t=>t.start)),end:Math.max(end,previous?.end??end,...tokens.map(t=>t.end)),tokens,
  review:previous?.review??{status:'draft',author,textVersion:ref.version},
  rights:{...(previous?.rights??{author,license:'unreleased editorial draft',source:ref.source}),note:[previous?.rights.note,proposal.decision.note,`Candidate generator: ${JSON.stringify(proposal.generator)}. AI-assisted draft; pronunciation review remains pending.`].filter(Boolean).join('\n')}
 };
 return previous?aids.map(a=>a.id===id?aid:a):[...aids,aid];
}
