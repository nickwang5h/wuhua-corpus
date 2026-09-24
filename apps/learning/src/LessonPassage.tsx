import type {Reference,Unit} from '../../../packages/content/src/types';
import type {Settings} from '../../../packages/ui/data';
import {safeURL} from '../../../packages/ui/data';
import {Original} from '../../../packages/ui/components';
import {PassageActions} from '../../../packages/ui/PassageActions';
import {ChineseText} from './ChineseText';

type Props={unit:Unit;references:Reference[];settings:Settings;preview:boolean;saved:boolean;onSave:()=>void;onShare:()=>void;onPrint:()=>void};
/** Complete passage module. Lesson stages cannot hide individual sections or actions. */
export function LessonPassage({unit,references,settings,preview,saved,onSave,onShare,onPrint}:Props){
 const meaning=unit.aids.find(a=>a.kind==='translation-en');
 const words=unit.aids.find(a=>a.kind==='vocabulary-en');
 const culture=unit.aids.find(a=>a.kind==='culture-en');
 const source=safeURL(culture?.rights.source||'');
 return <>
  <h1 className="lesson-title-small">{unit.title}</h1>
  {references.map((r,i)=><section key={`${r.id}:${r.start}`}><div className="lesson-excerpt"><Original text={r.text} offset={r.start} settings={settings} aid={unit.aids.find(a=>a.kind==='pinyin'&&a.target===r.id)} preview={preview}/></div><p className="passage-citation">{unit.refs[i].label||r.title}</p></section>)}
  <section className="meaning lesson-explanation"><h2>Meaning</h2><p><ChineseText text={meaning?.text||'English guidance is unavailable. Please choose another lesson.'}/></p></section>
  <section className="word-help lesson-explanation"><h2>Words to notice</h2><p><ChineseText text={words?.text||'Word guidance is unavailable.'}/></p></section>
  <details className="lesson-context"><summary>Explore the context</summary><p><ChineseText text={culture?.text||'Context is unavailable.'}/></p>{source&&<p className="attribution"><a href={source} target="_blank" rel="noreferrer">{new URL(source).hostname==='ctext.org'?'Read the reference on CText':'Read the reference'}</a></p>}</details>
  <PassageActions english saved={saved} onSave={onSave} onShare={onShare} onPrint={onPrint}/>
 </>;
}
