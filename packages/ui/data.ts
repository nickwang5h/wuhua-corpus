import type {Reference} from '../content/src/types';
import type {Script} from '../content/src/display';
export type Settings={script:Script;pinyin:boolean;font:'serif'|'sans';size:0|1|2;theme:'system'|'light'|'dark'};
export type Entry={recordId:string;kind:'note'|'bookmark'|'position'|'progress';updated:string;ref?:Reference;draft?:string;saved?:string;unitId?:string;unitVersion?:string;step?:string;exerciseId?:string;completed?:boolean;attempts?:Record<string,{first:number;last:number;count:number;feedback:string}>;offset?:number;conflictOf?:string};
export type Data={schemaVersion:number;app:'reading'|'learning';contentRelease:string;revision:number;settings:Settings;records:Entry[];exportedAt?:string;lastBackup?:string};
export function settings(app:Data['app']):Settings{return {script:app==='reading'?'original':'simplified',pinyin:app==='learning',font:app==='reading'?'serif':'sans',size:1,theme:'system'};}
export function emptyData(app:Data['app']):Data{return {schemaVersion:app==='reading'?2:1,app,contentRelease:'2026-09-23-d1',revision:0,settings:settings(app),records:[]};}
function object(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
function string(v:unknown){return typeof v==='string';}
export function parseData(raw:string,app:Data['app']):Data {
 if(new Blob([raw]).size>10*1024*1024)throw new Error('Backup exceeds 10 MB / 备份超过 10 MB');
 const d:unknown=JSON.parse(raw);
 if(!object(d)||d.app!==app||d.schemaVersion!==(app==='reading'?2:1)||!Number.isInteger(d.revision)||Number(d.revision)<0||!string(d.contentRelease)||!object(d.settings)||!Array.isArray(d.records))throw new Error('Unsupported backup format or site / 格式或站点不匹配');
 const s=d.settings;
 if(!['original','simplified','traditional'].includes(String(s.script))||!['serif','sans'].includes(String(s.font))||![0,1,2].includes(Number(s.size))||typeof s.size!=='number'||typeof s.pinyin!=='boolean'||!['system','light','dark'].includes(String(s.theme)))throw new Error('Invalid settings / 设置无效');
 const ids=new Set<string>();
 for(const r of d.records){
  if(!object(r)||!string(r.recordId)||!r.recordId||ids.has(r.recordId as string)||!['note','bookmark','position','progress'].includes(String(r.kind))||!string(r.updated))throw new Error('Invalid record / 记录无效');
  ids.add(r.recordId as string);
  if(r.ref!==undefined){const x=r.ref;if(!object(x)||!['id','version','text','title','source'].every(k=>string(x[k]))||!x.id)throw new Error('Invalid reference / 引用无效');for(const k of ['start','end'])if(x[k]!==undefined&&(!Number.isInteger(x[k])||Number(x[k])<0))throw new Error('Invalid text range');}
  if((r.kind==='note'||r.kind==='bookmark')&&!r.ref)throw new Error('Missing reference');
  if(r.kind==='note'&&(!string(r.draft)||!string(r.saved)))throw new Error('Invalid note');
  if(r.kind==='position'&&!r.ref&&!string(r.unitId))throw new Error('Invalid position');
  if(r.offset!==undefined&&(typeof r.offset!=='number'||!Number.isFinite(r.offset)||r.offset<0||r.offset>1))throw new Error('Invalid position offset');
  if(r.exerciseId!==undefined&&typeof r.exerciseId!=='string')throw new Error('Invalid exercise position');
  if(r.kind==='progress'&&(!string(r.unitId)||!string(r.unitVersion)||!string(r.step)||typeof r.completed!=='boolean'||!object(r.attempts)))throw new Error('Invalid progress');
  if(app==='reading'&&r.kind==='progress')throw new Error('Learning data in reading backup');
  if(r.attempts!==undefined){if(!object(r.attempts))throw new Error('Invalid attempts');for(const a of Object.values(r.attempts)){if(!object(a)||!Number.isInteger(a.first)||!Number.isInteger(a.last)||!Number.isInteger(a.count)||Number(a.first)<0||Number(a.last)<0||Number(a.count)<1||!string(a.feedback))throw new Error('Invalid attempt');}}
 }
 return d as unknown as Data;
}
export function put(data:Data,entry:Entry):Data{return {...data,records:[...data.records.filter(r=>r.recordId!==entry.recordId),entry]};}
export function backup(data:Data){return JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2);}
export function markdown(data:Data){return `# ${data.app==='reading'?'物化间 · 我的记录':'Wuhua Learn · My records'}\n\n`+data.records.map(r=>`## ${r.ref?.title||r.unitId||r.kind}\n\n${r.ref?'> '+r.ref.text.replaceAll('\n','\n> ')+'\n\n':''}${r.kind==='note'?`Saved / 已保存\n\n${r.saved}\n\nDraft / 草稿\n\n${r.draft}`:r.kind==='progress'?`${r.completed?'Completed':'In progress'} · ${r.unitVersion} · ${r.step}\n\n${JSON.stringify(r.attempts)}`:r.kind}\n\nReference: ${r.ref?.id||r.unitId} @ ${r.ref?.version||r.unitVersion||''}\n${r.ref?.source||''}\nUpdated: ${r.updated}${r.conflictOf?'\nConflict copy / 冲突副本':''}`).join('\n\n---\n\n');}
export function mergeData(current:Data,incoming:Data){
 if(current.app!==incoming.app||current.schemaVersion!==incoming.schemaVersion)throw new Error('Incompatible backup');
 const result=structuredClone(current);let added=0,duplicates=0,conflicts=0;
 for(const entry of incoming.records){const old=result.records.find(r=>r.recordId===entry.recordId);
 if(!old){result.records.push(entry);added++;}
 else if(JSON.stringify(old)===JSON.stringify(entry)){duplicates++;}
 else{const copy={...entry,recordId:`${entry.recordId}:conflict:${crypto.randomUUID()}`,conflictOf:entry.recordId};result.records.push(copy);conflicts++;}}
 return {data:result,added,duplicates,conflicts};
}
export function safeURL(value:string){try{const url=new URL(value);return url.protocol==='https:'?url.href:undefined;}catch{return undefined;}}
