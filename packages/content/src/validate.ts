import type {TextBook,Unit,Reference,Transition} from './types';
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
export function validateUnits(units:Unit[],books:TextBook[]){
 const refs=new Map(books.flatMap(b=>b.chapters.flatMap(c=>c.paragraphs.map(p=>[p.id,p] as const))));
 const ids=new Set(units.map(u=>u.id));if(ids.size!==units.length)throw new Error('Duplicate unit');
 for(const u of units){if(!u.version||!u.goal||!u.intro||!['Starting','Building'].includes(u.level)||!u.refs.length||!u.exercises.length)throw new Error(`Incomplete unit ${u.id}`);if(u.prerequisites.some(p=>!ids.has(p)||p===u.id))throw new Error(`Invalid prerequisite ${u.id}`);
 for(const r of u.refs){const p=refs.get(r.id);if(!p||p.version!==r.version||r.start<0||r.end>Array.from(p.text).length||r.end<=r.start)throw new Error(`Invalid unit reference ${u.id}`);}
 const aids=new Set<string>();for(const a of u.aids){if(aids.has(a.id)||!a.rights.author||!a.rights.license)throw new Error(`Invalid aid rights/id ${a.id}`);aids.add(a.id);const p=refs.get(a.target);if(!p||p.version!==a.version||!u.refs.some(r=>r.id===a.target))throw new Error(`Stale aid ${a.id}`);if(a.start!==undefined||a.end!==undefined){if(!Number.isInteger(a.start)||!Number.isInteger(a.end)||a.start!<0||a.end!<=a.start!||a.end!>Array.from(p.text).length||!u.refs.some(r=>r.id===a.target&&a.start!>=r.start&&a.end!<=r.end))throw new Error(`Invalid aid range ${a.id}`);}if(['reviewed','published'].includes(a.review.status)&&(!a.review.reviewer||!a.review.reviewedAt||a.review.textVersion!==p.version||a.rights.license.includes('unreleased')))throw new Error(`Incomplete review ${a.id}`);if(a.kind==='pinyin'){let end=-1;for(const t of a.tokens||[]){if(t.start<end||!t.pinyin||Array.from(p.text).slice(t.start,t.end).join('')!==t.text)throw new Error(`Pinyin alignment ${a.id}`);end=t.end;}}else if(!a.text)throw new Error(`Empty aid ${a.id}`);}
 if(['reviewed','published'].includes(u.review.status)&&(!u.review.reviewer||!u.review.reviewedAt))throw new Error(`Missing teaching review ${u.id}`);
 const eids=new Set<string>();for(const e of u.exercises){if(eids.has(e.id)||!e.prompt||!e.feedback||e.options.length<2||!Number.isInteger(e.answer)||e.answer<0||e.answer>=e.options.length)throw new Error(`Invalid exercise ${e.id}`);eids.add(e.id);}
 }
 const visit=(id:string,path:Set<string>)=>{if(path.has(id))throw new Error('Prerequisite cycle');for(const p of units.find(u=>u.id===id)?.prerequisites||[])visit(p,new Set([...path,id]));};for(const id of ids)visit(id,new Set());
}
