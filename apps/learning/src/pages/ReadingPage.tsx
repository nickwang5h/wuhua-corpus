import {useEffect,useState,lazy,Suspense,type ComponentType} from 'react';
import type {MDXProps} from 'mdx/types';
import type {Reference} from '../../../../packages/content/src/types';
import type {LocalData} from '../../../../packages/ui/useLocalData';
import {ShareCard} from '../../../../packages/ui/ShareCard';
import {ReadingContext,mdxComponents} from '../mdx/components';
import type {RegisteredReading} from '../reading/registry';
import {ReadingLayout} from '../reading/ReadingLayout';
import {loadSource,pinyinForSource} from '../reading/references';
import {readingRecord,toggleSaved,writeNote} from '../reading/records';
import {isReleased} from '../reading/release';
const PrintPreview = lazy(() => import('../PrintPreview'));
export function ReadingPage({reading,readings,local,preview}: {
  reading:RegisteredReading; readings:RegisteredReading[]; local:LocalData; preview:boolean;
}) {
  const [loaded,setLoaded] = useState<{Body:ComponentType<MDXProps>;references:Record<string,Reference>}>();
  const [error,setError] = useState(''),[retry,setRetry] = useState(0);
  const [share,setShare] = useState(false),[print,setPrint] = useState(false);
  useEffect(() => {
    let active = true; setLoaded(undefined); setError('');
    void Promise.all([reading.load(),Promise.all(Object.entries(reading.sources).map(async ([name,ref]) => [name,await loadSource(ref)] as const))])
      .then(([module,refs]) => {if (active) setLoaded({Body:module.default,references:Object.fromEntries(refs)});})
      .catch(e => {if (active) setError(String(e));});
    return () => {active = false;};
  },[reading,retry]);
  const note = readingRecord(local.data,reading,'note');
  const marked = !!readingRecord(local.data,reading,'bookmark');
  const showDraftPinyin = preview || isReleased(reading);
  const related = reading.related.flatMap(id => readings.filter(r => r.id === id));
  const passages = Object.values(loaded?.references || {}).map(reference => ({reference,caption:reference.title,
    aid:pinyinForSource(reference),link:isReleased(reading) ? `https://learn.wuhua.app/#/reading/${reading.id}` : undefined}));
  return <><ReadingLayout reading={reading} related={related} actions={loaded && <section className="reading-actions" aria-label="Save and notes">
    <div className="actions"><button aria-pressed={marked && local.status === 'saved'} onClick={() => {
      if (marked && local.status !== 'saved') {local.flush(); return;}
      local.update(d => toggleSaved(d,reading));
    }}>{marked && local.status === 'saved' ? 'Saved' : 'Save reading'}</button>
      {passages.length > 0 && <><button onClick={() => setShare(true)}>Share a quote</button><button onClick={() => setPrint(true)}>Print a quote</button></>}
    </div>
    <details className="personal-note"><summary>A note to keep</summary>
      <label htmlFor="reading-note">A thought or a question, in any language</label>
      <textarea id="reading-note" value={note?.draft || ''} onChange={e => local.update(d => writeNote(d,reading,e.target.value),true)} onBlur={local.flush}/>
      <button onClick={() => local.update(d => writeNote(d,reading,note?.draft || '',true))}>Save note</button>
      {note?.saved && <p className="note-copy">{note.saved}</p>}
      <p className="muted">Only in this browser. You can back up your notes from Saved.</p>
    </details>
  </section>}>
    {error ? <div role="alert"><p>We could not load this reading. Your saved records are safe.</p><div className="actions"><button onClick={() => setRetry(n => n+1)}>Try again</button><button onClick={() => location.reload()}>Reload page</button></div><details><summary>Loading details</summary>{error}</details></div>
      : !loaded ? <p role="status">Opening the reading…</p>
      : <ReadingContext.Provider value={{reading,references:loaded.references,settings:local.data.settings,showDraftPinyin}}><loaded.Body components={mdxComponents}/></ReadingContext.Provider>}
  </ReadingLayout>
    {share && <ShareCard passages={passages} english script={local.data.settings.script} onClose={() => setShare(false)}/>}
    {print && <Suspense fallback={<p role="status">Opening print preview…</p>}><PrintPreview passages={passages} title={reading.title} script={local.data.settings.script} preview={showDraftPinyin} onClose={() => setPrint(false)}/></Suspense>}
  </>;
}
