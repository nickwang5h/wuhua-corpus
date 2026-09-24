import {useEffect,useState} from 'react';
import {findReference,loadBook,workForId} from '../../../packages/content/src';
import {convert,type Script} from '../../../packages/content/src/display';
import type {Unit} from '../../../packages/content/src/types';

export function UnitSummary({unit,script}:{unit:Unit;script:Script}){
 const [passages,setPassages]=useState<string[]>([]),[error,setError]=useState(false);
 useEffect(()=>{let active=true;setPassages([]);setError(false);
  Promise.all(unit.refs.map(async ref=>{const work=workForId(ref.id);if(!work)throw new Error('Missing work');const found=findReference(await loadBook(work),ref.id);if(!found||found.ref.version!==ref.version)throw new Error('Missing text version');return convert(Array.from(found.ref.text).slice(ref.start,ref.end).join(''),script);})).then(texts=>{if(active)setPassages(texts);}).catch(()=>{if(active)setError(true);});
  return()=>{active=false;};
 },[unit,script]);
 const meaning=unit.aids.find(a=>a.kind==='translation-en')?.text;
 return <div className="unit-summary">
  {passages.length?passages.map((text,i)=><h2 lang={script==='simplified'?'zh-Hans':'zh-Hant'} key={`${unit.refs[i].id}:${unit.refs[i].start}`}>{text}</h2>):<p className="muted" role="status">{error?'Passage could not load. Open the lesson to retry.':'Loading passage…'}</p>}
  <p className="unit-meaning">{meaning||'English meaning is unavailable.'}</p>
 </div>;
}
