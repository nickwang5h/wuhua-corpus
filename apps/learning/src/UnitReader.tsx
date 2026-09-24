import {ChineseText} from './ChineseText';
import PracticeQuestion from './PracticeQuestion';
import PrintPreview from './PrintPreview';
import {ShareCard} from '../../../packages/ui/ShareCard';
import {LessonPassage} from './LessonPassage';
import {useEffect,useState} from 'react';
import {findReference,loadBook,workForId} from '../../../packages/content/src';
import type {Reference,Unit} from '../../../packages/content/src/types';
import {put,type Entry} from '../../../packages/ui/data';
import {Dialog,Original,SaveStatus} from '../../../packages/ui/components';
import type {LocalData} from '../../../packages/ui/useLocalData';
import {canComplete,currentStep,progressFor,steps,updateProgress} from './model';
export default function UnitReader({unit,local,preview,publicLesson=false}:{unit:Unit;local:LocalData;preview:boolean;publicLesson?:boolean}){
 const progress=progressFor(local.data,unit);const step=currentStep(progress?.step);const stepIndex=steps.indexOf(step);
 const [refs,setRefs]=useState<Reference[]>([]),[error,setError]=useState(''),[retry,setRetry]=useState(0),[settings,setSettings]=useState(false),[share,setShare]=useState(false),[print,setPrint]=useState(false);
 useEffect(()=>{let alive=true;setError('');Promise.all(unit.refs.map(async r=>{const work=workForId(r.id);if(!work)throw new Error('Missing work');const found=findReference(await loadBook(work),r.id);if(!found||found.ref.version!==r.version)throw new Error('Text version unavailable');return {...found.ref,text:Array.from(found.ref.text).slice(r.start,r.end).join(''),start:r.start,end:r.end};})).then(v=>{if(alive)setRefs(v);}).catch(()=>{if(alive)setError('This passage could not load. Your progress is still on this device.');});return()=>{alive=false;};},[unit,retry]);
 function go(next:typeof steps[number]){local.flush();local.update(d=>updateProgress(d,unit,{step:next}));window.scrollTo(0,0);}
 const ref=refs[0];const note=local.data.records.find(r=>r.kind==='note'&&!r.conflictOf&&r.unitId===unit.id&&r.unitVersion===unit.version);
 function writeNote(draft:string,save=false){if(!ref)return;local.update(d=>{const old=d.records.find(r=>r.recordId===`note:${unit.id}@${unit.version}`);const entry:Entry={recordId:`note:${unit.id}@${unit.version}`,kind:'note',updated:new Date().toISOString(),ref,unitId:unit.id,unitVersion:unit.version,draft,saved:save?draft:old?.saved||''};return put(d,entry);},!save);}
 const marked=local.data.records.some(r=>r.kind==='bookmark'&&r.unitId===unit.id&&r.unitVersion===unit.version);
 const meaning=unit.aids.find(a=>a.kind==='translation-en');
 return <section className="page lesson-page">
  <div className="lesson-top"><a className="lesson-exit" href="#/units" aria-label="Exit lesson">Exit</a><div className="lesson-progress" role="progressbar" aria-label="Lesson progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={stepIndex+1}>{steps.map((s,i)=><span key={s} className={i<=stepIndex?'reached':''}/>)}</div><button className="quiet" onClick={()=>setSettings(true)}>Reading aids</button></div>
  <p className="stage-label" aria-live="polite">{['Read','Try it','Reflect'][stepIndex]} · {stepIndex+1} of {steps.length}</p>
  
  {!['saved','pending'].includes(local.status)&&<SaveStatus local={local} english/>}
  <article className="lesson-content">
  {error?<div role="alert"><p>{error}</p><button onClick={()=>setRetry(n=>n+1)}>Try again</button><a href="#/notes">My saved records</a></div>:!refs.length?<p role="status">Loading the passage…</p>:<>
   {step==='read'&&<LessonPassage unit={unit} references={refs} settings={local.data.settings} preview={preview} saved={marked&&local.status==='saved'} onSave={()=>{if(!ref)return;if(marked&&local.status!=='saved'){local.flush();return;}local.update(d=>marked?{...d,records:d.records.filter(r=>!(r.kind==='bookmark'&&r.unitId===unit.id&&r.unitVersion===unit.version))}:put(d,{recordId:`bookmark:${unit.id}@${unit.version}`,kind:'bookmark',updated:new Date().toISOString(),ref,unitId:unit.id,unitVersion:unit.version}));}} onShare={()=>setShare(true)} onPrint={()=>setPrint(true)}/>}
   {step==='practice'&&<><details className="practice-help"><summary>Read the passage again</summary>{refs.map(r=><Original key={r.id} text={r.text} offset={r.start} settings={local.data.settings} aid={unit.aids.find(a=>a.kind==='pinyin'&&a.target===r.id)} preview={preview}/>)}<p><ChineseText text={meaning?.text||''}/></p></details><PracticeQuestion unit={unit} local={local} onRead={()=>go('read')} onFinish={()=>go('review')}/></>}
   {step==='review'&&<><h1>Take the idea with you.</h1><p><ChineseText text={unit.reflection}/></p><label htmlFor="learning-note">A personal note (optional)</label><textarea id="learning-note" value={note?.draft||''} onChange={e=>writeNote(e.target.value)} onBlur={local.flush} placeholder="A thought or a question. English is welcome."/><button className="quiet" onClick={()=>writeNote(note?.draft||'',true)}>Save note</button><p className="muted">Your reflection is personal, not graded.</p>{note?.saved&&<details><summary>Saved reflection</summary><p className="note-copy">{note.saved}</p></details>}<details><summary>What you practised</summary><p><ChineseText text={unit.goal}/></p></details>{progress?.completed&&<p className="completion-message">{local.status==='saved'?'Completed on this device.':'Completed in this session — not saved yet.'}</p>}</>}
   {step!=='practice'&&<div className="step-actions">{stepIndex>0&&<button className="quiet" onClick={()=>go(steps[stepIndex-1])}>Back</button>}{stepIndex<steps.length-1?<button className="primary" onClick={()=>go(steps[stepIndex+1])}>Continue</button>:progress?.completed?<a className="button primary" href="#/units">Choose the next unit</a>:<button className="primary" disabled={!canComplete(local.data,unit)} onClick={()=>local.update(d=>updateProgress(d,unit,{completed:true,step:'review'}))}>Finish this unit</button>}</div>}
  </>}
  </article>
  {settings&&<Dialog title="Reading aids" onClose={()=>setSettings(false)}><label className="checkbox"><input type="checkbox" checked={local.data.settings.pinyin} onChange={e=>{const pinyin=e.target.checked;local.update(d=>({...d,settings:{...d.settings,pinyin}}));}}/>Show pinyin</label><p className="muted">Your choice is remembered for other lessons. Pinyin appears where position-aligned readings are available.</p><details><summary>How to read pinyin</summary><p>Pinyin uses letters and tone marks to show Mandarin pronunciation. Readings here use dictionary tones; tones can change in connected speech, such as bù becoming bú before another fourth tone.</p><p>You can complete the lesson with English help. Audio is not available yet.</p></details></Dialog>}
  {share&&<ShareCard passages={refs.map((r,i)=>({reference:r,caption:`${unit.refs[i].label||r.title}\n${unit.title}`,link:publicLesson&&location.protocol==='https:'?`${location.origin}/#/unit/${encodeURIComponent(unit.id)}`:undefined}))} script={local.data.settings.script} english onClose={()=>setShare(false)}/>}
  {print&&<PrintPreview passages={refs.map((r,i)=>({reference:r,caption:unit.refs[i].label||r.title,aid:unit.aids.find(a=>a.kind==='pinyin'&&a.target===r.id)}))} title={unit.title} script={local.data.settings.script} preview={preview} onClose={()=>setPrint(false)}/>}
 </section>;
}
