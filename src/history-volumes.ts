import type {Reference,Transition} from './types.js';

/**
 * History is kept in volumes (src/history/), applied oldest first. Each volume may drop entries
 * that earlier volumes added (a paragraph back at a text it once had stops being history), then
 * appends its own. A record is known by id@version, a transition by the id@version it leaves.
 */
export type HistoryKey = {id:string; version:string};
export type HistoryVolume = {records:Reference[]; transitions:Transition[]; drop?:{records?:HistoryKey[]; transitions?:HistoryKey[]}};
export type History = {records:Reference[]; transitions:Transition[]};
type Kind = 'records'|'transitions';
type Entry<K extends Kind> = K extends 'records'?Reference:Transition;

export function historyKey(kind:Kind,entry:Reference|Transition){
 const {id,version}=kind==='records'?entry as Reference:(entry as Transition).from;
 return `${id}@${version}`;
}
// One list (records or transitions) of the merged history, in the order a single file would hold it.
export function mergeVolumes<K extends Kind>(volumes:HistoryVolume[],kind:K):Entry<K>[]{
 const slots:(Entry<K>|undefined)[]=[];
 const at=new Map<string,number>();
 volumes.forEach((volume,n)=>{
  for(const {id,version} of volume.drop?.[kind]??[]){
   const key=`${id}@${version}`,i=at.get(key);
   if(i===undefined)throw new Error(`History volume ${n+1} drops ${kind} ${key}, which no earlier volume holds`);
   slots[i]=undefined;at.delete(key);
  }
  for(const entry of volume[kind] as Entry<K>[]){
   const key=historyKey(kind,entry);
   if(at.has(key))throw new Error(`History volume ${n+1} adds ${kind} ${key} twice`);
   at.set(key,slots.push(entry)-1);
  }
 });
 return slots.filter((entry):entry is Entry<K>=>entry!==undefined);
}
export function mergeHistory(volumes:HistoryVolume[]):History{
 return {records:mergeVolumes(volumes,'records'),transitions:mergeVolumes(volumes,'transitions')};
}
