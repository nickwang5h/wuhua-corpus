import {works, workForId} from '../content';
import type {Reading} from './schema';
export function sourceNames(reading:Reading) {
  return [...new Set(Object.values(reading.sources).map(s => s.label || works.find(w => w.id === workForId(s.id))?.title || s.id))];
}
const normalize = (s:string) => s.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase().trim();
export function matchesReading(reading:Reading, query:string) {
  const worksText = Object.values(reading.sources).map(s => {
    const work = works.find(w => w.id === workForId(s.id));
    return work ? Object.values(work).join(' ') : '';
  }).join(' ');
  return normalize([reading.title,reading.summary,reading.focus.chinese,reading.focus.pinyin,...reading.concepts,...sourceNames(reading),worksText].join(' ')).includes(normalize(query));
}
