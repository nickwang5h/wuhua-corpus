import type {TextBook,Aid,Reference,Transition} from './types';
export function validateBooks(books:TextBook[]){
 const ids=new Set<string>();const add=(id:string)=>{if(!id||ids.has(id))throw new Error(`Duplicate/empty identity ${id}`);ids.add(id);};
 for(const b of books){add(b.id);for(const c of b.chapters){add(c.id);const source=new URL(c.source);if(source.protocol!=='https:'||source.hostname!=='zh.wikisource.org'||!source.searchParams.get('oldid'))throw new Error(`Unpinned source ${c.id}`);for(const p of c.paragraphs){add(p.id);if(!p.text||!p.version)throw new Error(`Empty text ${p.id}`);for(const a of p.aliases){add(a.id);if(!a.version||!a.text||a.start<0||a.end<=a.start)throw new Error(`Invalid alias ${a.id}`);if(a.version===p.version&&Array.from(p.text).slice(a.start,a.end).join('')!==a.text)throw new Error(`Alias alignment ${a.id}`);}}}}
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
   let end=-1;
   if(!aid.tokens?.length)throw new Error(`Missing pinyin tokens ${aid.id}`);
   for(const t of aid.tokens){
    if(!Number.isInteger(t.start)||!Number.isInteger(t.end)||t.start<0||t.start<end||t.end<=t.start||t.end>Array.from(p.text).length||!t.pinyin||Array.from(p.text).slice(t.start,t.end).join('')!==t.text)throw new Error(`Pinyin alignment ${aid.id}`);
    end=t.end;
   }
  }else if(!aid.text)throw new Error(`Empty aid ${aid.id}`);
 }
}
