import type {ReactNode} from 'react';
import type {Reading} from './schema';
import {ReadingCard} from './ReadingCard';
import {Provenance} from './Provenance';
export function ReadingLayout({reading,related,children,actions}: {
  reading:Reading; related:Reading[]; children:ReactNode; actions:ReactNode;
}) {
  return <article className="page reading-page">
    <a className="back-link" href="#/explore">Explore readings</a>
    <header className="reading-header"><h1>{reading.title}</h1>
      <span className="reading-meta">{reading.level === 'starting' ? 'Starting' : 'Building'} · About {reading.minutes} min</span>
    </header>
    <div className="reading-body">{children}</div>
    <details className="reading-provenance"><summary>Sources and editorial notes</summary><Provenance reading={reading}/></details>
    {actions}
    {related.length > 0 && <section className="related-readings"><h2>Another way to look</h2>{related.map(r => <ReadingCard reading={r} key={r.id}/>)}</section>}
  </article>;
}
