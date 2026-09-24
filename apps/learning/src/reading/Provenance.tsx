import {works,workForId} from '../content';
import {pinyinFor} from '@wuhua/corpus/pinyin';
import type {Reading} from './schema';
export function Provenance({reading}: {reading:Reading}) {
  return <div className="provenance">
    <p>Writing: {reading.review.author}. Editorial status: {reading.review.status}.
      {reading.review.reviewer && ` Reviewed by ${reading.review.reviewer} on ${reading.review.reviewedAt}.`}</p>
    <p>Classical quotations use the shared source edition. Links below identify reference material; each note explains how it was used.</p>
    {Object.entries(reading.sources).map(([name,source]) => {
      const work = works.find(w => w.id === workForId(source.id));
      const aid = pinyinFor(source.id,source.version);
      return <p key={name}>{source.label || work?.title || name}.{' '}
        <a href={`https://wuhua.app/#/read/${encodeURIComponent(source.id)}/clear?version=${encodeURIComponent(source.version)}`}>Read in the Chinese library</a>
        {aid && ` Pinyin: ${aid.review.author}; ${aid.review.status}.`}</p>;
    })}
    {reading.references.length > 0 && <ul>{reading.references.map(ref => <li key={ref.url}>
      <a href={ref.url} target="_blank" rel="noreferrer">{ref.title}</a>{ref.note && <p>{ref.note}</p>}
    </li>)}</ul>}
  </div>;
}
