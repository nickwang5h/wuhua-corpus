import {ReadingFocus} from '../mdx/Phrase';
import {sourceNames} from './search';
import type {Reading} from './schema';
export function ReadingCard({reading}: {reading:Reading}) {
  return <article className="reading-card">
    <h2><a href={`#/reading/${reading.id}`}>{reading.title}</a></h2>
    <ReadingFocus focus={reading.focus}/>
    <p className="reading-source">{sourceNames(reading).join(' · ')}</p>
    <span className="reading-meta">About {reading.minutes} min · {reading.level === 'starting' ? 'Starting' : 'Building'}</span>
  </article>;
}
