import {useState} from 'react';
import type {Unit} from '../../../packages/content/src/types';
import type {LocalData} from '../../../packages/ui/useLocalData';
import {exerciseIndex,progressFor,updateProgress} from './model';
import {ChineseText} from './ChineseText';
export default function PracticeQuestion({unit,local,onRead,onFinish}:{unit:Unit;local:LocalData;onRead:()=>void;onFinish:()=>void}){
 const progress=progressFor(local.data,unit);const index=exerciseIndex(unit,progress);const question=unit.exercises[index];
 const [choices,setChoices]=useState<Record<string,number|undefined>>(()=>Object.fromEntries(Object.entries(progress?.attempts||{}).map(([id,a])=>[id,a.last])));
 const attempt=progress?.attempts?.[question.id];const selected=choices[question.id];const checked=selected!==undefined&&attempt?.last===selected;
 function check(){if(selected===undefined)return;local.update(d=>{const old=progressFor(d,unit);const previous=old?.attempts?.[question.id];return updateProgress(d,unit,{exerciseId:question.id,attempts:{...old?.attempts,[question.id]:{first:previous?.first??selected,last:selected,count:(previous?.count||0)+1,feedback:question.feedback}}});});}
 function move(next:number){local.update(d=>updateProgress(d,unit,{exerciseId:unit.exercises[next].id}));}
 return <section className="single-question"><p className="question-count" aria-live="polite">{index+1} / {unit.exercises.length}</p><fieldset className="exercise" key={question.id}><legend><ChineseText text={question.prompt}/></legend>{question.options.map((option,i)=><label className="option" key={option}><input type="radio" name={question.id} value={i} checked={selected===i} onChange={()=>setChoices(c=>({...c,[question.id]:i}))}/><span><ChineseText text={option}/></span></label>)}</fieldset>{checked&&<section className="feedback" role="status"><h3>{attempt.last===question.answer?'That fits the passage.':'Look at it another way.'}</h3><p><ChineseText text={attempt.feedback}/></p>{attempt.last!==question.answer&&<button className="quiet" onClick={()=>setChoices(c=>({...c,[question.id]:undefined}))}>Try again</button>}</section>}<div className="step-actions"><button className="quiet" onClick={()=>index>0?move(index-1):onRead()}>Back</button>{checked?<button className="primary" onClick={()=>index<unit.exercises.length-1?move(index+1):onFinish()}>{index<unit.exercises.length-1?'Next question':'Reflect'}</button>:<button className="primary" disabled={selected===undefined} onClick={check}>Check</button>}</div></section>;
}
