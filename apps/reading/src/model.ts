import {emptyData,put,type Data,type Entry} from './ui/data';
import {loadBook,findReference,workForId} from './content';
import {curatedById} from './content/curated';
import type {Reference} from '@wuhua/corpus/types';
export const storageKey='wuhua:reading:v2';
export const legacyKey='wuhua:reading:v1';
export function oldReference(id:string):Reference {const p=curatedById[id];return p?{id,version:p.version,text:p.text,title:p.title,source:p.source}:{id,version:'unknown',text:'',title:'原文待找回',source:''};}
export function migrateLegacy(raw:string):Data {
 const d=JSON.parse(raw);if(!d||d.version!==1||typeof d!=='object')throw new Error('无法识别旧记录格式');
 let result=emptyData('reading');const now=new Date().toISOString();
 if(d.notes&&typeof d.notes==='object'&&!Array.isArray(d.notes))for(const [id,value] of Object.entries(d.notes)){
 const n=value as Record<string,unknown>;if(!n||typeof n.draft!=='string'||typeof n.saved!=='string'||typeof n.updated!=='string')throw new Error('旧笔记存在损坏；请保留原始备份');
 result=put(result,{recordId:`legacy-note:${id}`,kind:'note',updated:n.updated,ref:oldReference(id),draft:n.draft,saved:n.saved});}
 if(d.bookmarks!==undefined&&!Array.isArray(d.bookmarks))throw new Error('旧收藏格式损坏');
 for(const id of d.bookmarks||[]){if(typeof id!=='string')throw new Error('旧收藏格式损坏');result=put(result,{recordId:`bookmark:${id}`,kind:'bookmark',updated:now,ref:oldReference(id)});}
 if(typeof d.lastRead==='string'&&d.lastRead)result=put(result,{recordId:'lastRead',kind:'position',updated:now,ref:oldReference(d.lastRead)});
 if(d.bookLast&&typeof d.bookLast==='object')for(const [book,id] of Object.entries(d.bookLast)){if(typeof id!=='string')throw new Error('旧阅读位置损坏');result=put(result,{recordId:`bookLast:${book}`,kind:'position',updated:now,ref:oldReference(id)});}
 if([0,1,2].includes(d.font))result.settings.size=d.font;
 return result;
}
export function noteFor(data:Data,ref:Reference){return data.records.find(r=>r.kind==='note'&&!r.conflictOf&&r.ref?.id===ref.id&&r.ref.version===ref.version);}
export function noteEntry(ref:Reference,old:Entry|undefined,draft:string,saved=old?.saved||''):Entry{return {recordId:old?.recordId||`note:${ref.id}@${ref.version}`,kind:'note',ref,draft,saved,updated:new Date().toISOString()};}
export function readLink(id:string,mode='clear',path?:string|null){return `#/read/${encodeURIComponent(id)}/${mode}${path?`?path=${encodeURIComponent(path)}`:''}`;}

export async function migrateLegacyWithReferences(raw:string):Promise<Data>{
 const data=migrateLegacy(raw);
 const books=await Promise.all([...new Set(data.records.flatMap(r=>r.ref&&workForId(r.ref.id)?[workForId(r.ref.id)!]:[]))].map(id=>loadBook(id).catch(()=>undefined)));
 return {...data,records:data.records.map(r=>{if(r.ref?.version!=='unknown')return r;const found=books.flatMap(b=>b?[findReference(b,r.ref!.id)]:[]).find(Boolean);return found?{...r,ref:found.ref}:r;})};
}

export function linkNoteCopy(data:Data,recordId:string,target:Reference):Data {
 const original=data.records.find(r=>r.recordId===recordId&&r.kind==='note');
 if(!original)throw new Error('原笔记不存在');
 return put(data,{...original,recordId:`linked:${crypto.randomUUID()}`,ref:target,updated:new Date().toISOString(),conflictOf:undefined});
}
