import {put,type Data,type Entry} from '../../../packages/ui/data';
import type {Unit} from '../../../packages/content/src/types';
export const storageKey='wuhua:learning:v1';
export const steps=['read','practice','review'] as const;
export function currentStep(step?:string):typeof steps[number]{return step==='practice'||step==='review'?step:'read';}
export function progressFor(data:Data,unit:Unit){return data.records.find(r=>r.kind==='progress'&&!r.conflictOf&&r.unitId===unit.id&&r.unitVersion===unit.version);}
export function updateProgress(data:Data,unit:Unit,change:Partial<Entry>){const old=progressFor(data,unit);return put(data,{recordId:`progress:${unit.id}@${unit.version}`,kind:'progress',unitId:unit.id,unitVersion:unit.version,step:'read',completed:false,attempts:{},...old,...change,updated:new Date().toISOString()});}
export function canComplete(data:Data,unit:Unit){const p=progressFor(data,unit);return !!p&&unit.exercises.every(e=>Object.hasOwn(p.attempts||{},e.id));}

// Older progress has no exerciseId: resume the first unanswered question, or the last feedback.
export function exerciseIndex(unit:Unit,progress:Entry|undefined){
 const explicit=unit.exercises.findIndex(e=>e.id===progress?.exerciseId);
 if(explicit>=0)return explicit;
 const unanswered=unit.exercises.findIndex(e=>!Object.hasOwn(progress?.attempts||{},e.id));
 return unanswered>=0?unanswered:Math.max(0,unit.exercises.length-1);
}
