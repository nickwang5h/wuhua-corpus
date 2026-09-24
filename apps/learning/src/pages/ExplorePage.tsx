import {matchesReading} from '../reading/search';
import {useState} from 'react';
import type {Reading} from '../reading/schema';
import {ReadingCard} from '../reading/ReadingCard';
export function ExplorePage({readings}: {readings:Reading[]}) {
  const [query,setQuery] = useState('');
  const matches = readings.filter(r => matchesReading(r,query));
  return <section className="page explore-page"><h1>Explore</h1><p>Follow a question, a word, or your curiosity. Begin anywhere.</p>
    <label className="reading-search">Find a reading<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try “知足”, “enough” or “Daodejing”"/></label>
    <div className="reading-list">{matches.map(r => <ReadingCard reading={r} key={r.id}/>)}</div>
    {!matches.length && <p role="status">No readings match that search. Try another word.</p>}
  </section>;
}
