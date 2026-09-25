import type {Aid, Reference} from './types.js';

export type PinyinCell = {char:string; original:string|null; position:number|null; pinyin?:string};
export type PinyinStatus = 'complete'|'missing'|'invalid'|'unalignable';
export type PinyinAlignment = {cells:PinyinCell[];status:PinyinStatus;issues:string[]};
export const isHan = (char:string) => /^\p{Script=Han}$/u.test(char);
const syllablePattern=/^[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿê]+$/iu;
export function pinyinSyllables(value:string):string[]|undefined {
 if(typeof value!=='string')return undefined;
 const syllables=value.normalize('NFC').trim().split(/[\s\p{P}]+/u).filter(Boolean);
 return syllables.length&&syllables.every(s=>syllablePattern.test(s))?syllables:undefined;
}
function finish(cells:PinyinCell[],issues:string[]=[]):PinyinAlignment {
 const missing=cells.filter(c=>isHan(c.char)&&!c.pinyin);
 return {cells,status:issues.length?'invalid':cells.some(c=>isHan(c.char))&&!missing.length?'complete':'missing',
  issues:issues.length?issues:missing.map(c=>`Missing pinyin for ${c.original??c.char} at code point ${c.position}`)};
}
function displayCells(original:string,display:string,offset=0):PinyinAlignment {
 const source=Array.from(original),shown=Array.from(display);
 const aligned=source.length===shown.length&&source.every((char,i)=>isHan(char)===isHan(shown[i]));
 return {cells:shown.map((char,i)=>({char,original:aligned?source[i]:null,position:aligned?offset+i:null})),
  status:aligned?'missing':'unalignable',issues:aligned?[]:['Character conversion changed code-point positions or Han/non-Han structure']};
}
/** Partial annotations remain internal; every renderer shows all-or-none for its chosen excerpt. */
export function visiblePinyinCells(result:PinyinAlignment):PinyinCell[] {
 return result.status==='complete'?result.cells:result.cells.map(({pinyin:_,...cell})=>cell);
}
export function alignPhrase(original:string,pinyin:string,display=original):PinyinAlignment {
 const result=displayCells(original,display);
 if(result.status==='unalignable')return result;
 const syllables=pinyinSyllables(pinyin),han=result.cells.filter(c=>isHan(c.char));
 if(!syllables||syllables.length!==han.length)return {...result,status:'invalid',issues:[`Phrase pinyin must align with each Han character: ${han.length} characters, ${syllables?.length??0} valid syllables`]};
 let index=0;
 return finish(result.cells.map(cell=>isHan(cell.char)?{...cell,pinyin:syllables[index++]}:cell));
}
export function selectPinyinAid(reference:{id:string;start?:number}&({text:string}|{end:number}),aids:readonly Aid[]):{aid?:Aid;issues:string[]} {
 const start=reference.start??0,end='text' in reference?start+Array.from(reference.text).length:reference.end;
 const candidates=aids.filter(a=>{
  if(a.kind!=='pinyin'||a.target!==reference.id||a.review.status==='withdrawn')return false;
  const from=a.start??Math.min(...(a.tokens?.map(t=>t.start)??[start]));
  const to=a.end??Math.max(...(a.tokens?.map(t=>t.end)??[end]));
  // Empty/malformed annotations must be diagnosed, not treated as absent.
  return !a.tokens?.length||!Number.isFinite(from)||!Number.isFinite(to)||from<end&&to>start;
 });
 if(candidates.length>1)return {issues:[`Ambiguous pinyin annotations: ${candidates.map(a=>a.id).join(', ')}`]};
 return {aid:candidates[0],issues:[]};
}
export function alignReference(reference:Reference,display:string,aid?:Aid,allowDraft=false):PinyinAlignment {
 const result=displayCells(reference.text,display,reference.start??0);
 if(!aid)return result.status==='unalignable'?result:finish(result.cells);
 const issues:string[]=[];
 if(aid.kind!=='pinyin'||aid.target!==reference.id||aid.version!==reference.version||aid.review.textVersion!==reference.version)
  issues.push(`Stale or mismatched pinyin annotation ${aid.id}`);
 if(aid.review.status==='withdrawn')return {...result,status:'missing',issues:['Pinyin annotation was withdrawn']};
 if(['reviewed','published'].includes(aid.review.status)&&(!aid.review.reviewer||!aid.review.reviewedAt))issues.push(`Incomplete review metadata ${aid.id}`);
 if(aid.start!==undefined||aid.end!==undefined){
  if(!Number.isInteger(aid.start)||!Number.isInteger(aid.end)||aid.start! < 0||aid.end! <= aid.start!)issues.push(`Invalid annotation range ${aid.id}`);
 }
 let end=-1;
 const tokens=new Map<number,string>();
 const source=Array.from(reference.text),offset=reference.start??0;
 if(!aid.tokens?.length)issues.push(`Missing pinyin tokens ${aid.id}`);
 for(const token of aid.tokens??[]){
  const at=`${aid.id}: ${token.text} at code point ${token.start}`;
  if(!Number.isInteger(token.start)||!Number.isInteger(token.end)||token.start<0||token.end!==token.start+1||token.start<end)
   issues.push(`Invalid, duplicate or overlapping token ${at}`);
  end=token.end;
  if(aid.start!==undefined&&aid.end!==undefined&&(token.start<aid.start||token.end>aid.end))issues.push(`Token outside annotation range ${at}`);
  const syllables=pinyinSyllables(token.pinyin);
  if(!isHan(token.text)||!syllables||syllables.length!==1||token.pinyin.normalize('NFC').trim()!==syllables[0])issues.push(`Expected one Han character and one syllable ${at}`);
  if(reference.start===undefined&&token.end>source.length)issues.push(`Token outside source ${at}`);
  const index=token.start-offset;
  if(index>=0&&index<source.length&&source[index]!==token.text)issues.push(`Source character mismatch ${at}; expected ${source[index]}`);
  if(syllables?.length===1)tokens.set(token.start,syllables[0]);
 }
 if(issues.length)return {...result,status:'invalid',issues};
 if(result.status==='unalignable')return result;
 if(aid.review.status==='draft'&&!allowDraft)return {...result,status:'missing',issues:['Draft pinyin is not enabled here']};
 return finish(result.cells.map(cell=>isHan(cell.char)?{...cell,pinyin:tokens.get(cell.position!)}:cell));
}
/** Explicit print selections use code-point ranges, including repeated occurrences. */
export function slicePinyin(result:PinyinAlignment,start:number,end:number):PinyinAlignment {
 const cells=result.cells.slice(start,end);
 if(result.status==='invalid'||result.status==='unalignable')return {...result,cells};
 return finish(cells);
}
/** Image excerpts may adjust whitespace and append an ellipsis, but may not guess a repeated occurrence. */
export function alignExcerpt(result:PinyinAlignment,excerpt:string):PinyinAlignment {
 const source=result.cells.filter(c=>! /\s/u.test(c.char));
 const raw=Array.from(excerpt.trim()),wanted=raw.filter(c=>! /\s/u.test(c));
 const matches=(chars:string[])=>chars.length?source.flatMap((_,start)=>chars.every((c,i)=>source[start+i]?.char===c)?[start]:[]):[];
 let starts=matches(wanted),ellipsis=false;
 if(!starts.length&&wanted.at(-1)==='…'){wanted.pop();starts=matches(wanted);ellipsis=true;}
 if(starts.length!==1)return {cells:raw.map(char=>({char,original:null,position:null})),status:'unalignable',issues:[starts.length?'Repeated excerpt: include more context':'Excerpt is not a continuous source selection']};
 let cursor=0;
 const cells=raw.map((char,i)=>/\s/u.test(char)||ellipsis&&i===raw.length-1?{char,original:null,position:null}:{...source[starts[0]+cursor++],char});
 if(result.status==='invalid'||result.status==='unalignable')return {...result,cells};
 return finish(cells);
}
