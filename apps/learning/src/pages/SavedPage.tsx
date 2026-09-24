import {BackupPanel} from '../../../../packages/ui/components';
import type {LocalData} from '../../../../packages/ui/useLocalData';
import type {Reading} from '../reading/schema';
import {recordReadingId,legacyProgressCount} from '../reading/legacy';
export function SavedPage({local,readings}: {local:LocalData;readings:Reading[]}) {
  const records = local.data.records.filter(r => r.kind === 'note' || r.kind === 'bookmark');
  const legacyCount = legacyProgressCount(local.data.records);
  return <section className="page saved-page"><h1>Saved and notes</h1><p>A place for things you would like to return to.</p>
    {!records.length && <p>No saved readings yet. <a href="#/explore">Find something to read</a>.</p>}
    {records.map(r => {
      const reading = readings.find(x => x.id === recordReadingId(r));
      return <article className="record" key={r.recordId}>
        <h2>{reading ? <a href={`#/reading/${reading.id}`}>{r.ref?.title || reading.title}</a> : r.ref?.title || 'An earlier saved passage'}</h2>
        {r.conflictOf && <p className="status-tag">Conflict copy — both versions have been kept.</p>}
        {r.ref && <blockquote>{r.ref.text}</blockquote>}
        {r.kind === 'note' && <><p className="note-copy">{r.saved}</p>{r.draft !== r.saved && <details><summary>Unsubmitted draft</summary><p className="note-copy">{r.draft}</p></details>}</>}
        {(!r.ref?.id.startsWith('reading:') || r.ref.version !== reading?.version) && <p className="muted">Kept from an earlier version. The original record is included in your backup.</p>}
        <button onClick={() => local.update(d => ({...d,records:d.records.filter(x => x.recordId !== r.recordId)}))}>{r.kind === 'bookmark' ? 'Remove from saved' : 'Delete note'}</button>
      </article>;
    })}
    {legacyCount > 0 && <p className="muted">Your earlier learning history is still stored here and included in full exports.</p>}
    <BackupPanel local={local} english/>
  </section>;
}
