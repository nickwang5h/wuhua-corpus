import release from './learning-release.json';
import data from './learning-units.json';
import type {Unit} from './types';
import {pinyinAids} from './pinyin';
export const units:Unit[]=data.map(u=>({...u,aids:[...u.aids,...u.pinyinAidIds.map(id=>{const aid=pinyinAids.find(a=>a.id===id);if(!aid)throw new Error('Missing pinyin aid '+id);return aid;})]})) as Unit[];
export function isReady(unit:Unit){const approved=(r:Unit['review'])=>(r.status==='reviewed'||r.status==='published')&&!!r.reviewer&&!!r.reviewedAt;return approved(unit.review)&&unit.aids.every(a=>approved(a.review)&&a.review.textVersion===a.version)&&unit.aids.some(a=>a.kind==='pinyin')&&unit.aids.some(a=>a.kind==='translation-en')&&unit.exercises.length>0;}
export function completionStatus(unit:Unit,versions:string[]){return versions.includes(unit.version)||unit.compatibleVersions.some(v=>versions.includes(v))?'complete':versions.length?'previous-version':'new';}

// Public availability is an explicit release decision, separate from editorial review.
export function isReleased(unit:Unit){return release.some(r=>r.id===unit.id&&r.version===unit.version)&&unit.review.status!=='withdrawn'&&unit.aids.every(a=>a.review.status!=='withdrawn');}
