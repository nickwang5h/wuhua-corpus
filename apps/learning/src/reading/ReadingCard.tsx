import type {Reading} from './schema';
export function ReadingCard({reading}: {reading:Reading}) {
  return <article className="reading-card">
    <h2><a href={`#/reading/${reading.id}`}>{reading.title}</a></h2>
    <p>{reading.summary}</p>
    <span className="reading-meta">About {reading.minutes} min · {reading.level === 'starting' ? 'Starting' : 'Building'}</span>
  </article>;
}
