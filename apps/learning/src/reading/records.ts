import {put,type Data,type Entry} from '../ui/data';
import type {Reference} from '@wuhua/corpus/types';
import type {Reading} from './schema';
export const storageKey = 'wuhua:learning:v1';
export function readingReference(reading: Reading): Reference {
  return {id:`reading:${reading.id}`,version:reading.version,text:reading.summary,title:reading.title,
    source:`https://learn.wuhua.app/#/reading/${reading.id}`};
}
export function readingRecord(data: Data,reading: Reading,kind: 'note' | 'bookmark') {
  return data.records.find(r => r.kind === kind && !r.conflictOf && r.ref?.id === `reading:${reading.id}` && r.ref.version === reading.version);
}
export function toggleSaved(data: Data,reading: Reading): Data {
  const old = readingRecord(data,reading,'bookmark');
  return old ? {...data,records:data.records.filter(r => r.recordId !== old.recordId)} : put(data,{
    recordId:`reading-bookmark:${reading.id}@${reading.version}`,kind:'bookmark',updated:new Date().toISOString(),ref:readingReference(reading),
  });
}
export function writeNote(data: Data,reading: Reading,draft: string,save = false): Data {
  const old = readingRecord(data,reading,'note');
  const entry: Entry = {recordId:old?.recordId || `reading-note:${reading.id}@${reading.version}`,
    kind:'note',updated:new Date().toISOString(),ref:readingReference(reading),draft,saved:save ? draft : old?.saved || ''};
  return put(data,entry);
}
