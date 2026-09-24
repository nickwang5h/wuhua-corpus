import type {Reading} from '../reading/schema';
import {ReadingCard} from '../reading/ReadingCard';
export function HomePage({readings}: {readings:Reading[]}) {
  const first = readings[0];
  return <div className="page learning-home">
    <header className="learning-opening"><h1>A little Chinese.<br/>A philosophical question.</h1>
      <p>Learn a little Chinese through ideas from the Chinese classics.</p></header>
    {first ? <section className="featured-reading" aria-label="A reading to start with">
      <ReadingCard reading={first}/><a className="button primary" href={`#/reading/${first.id}`}>Begin reading</a>
    </section> : <p>New readings are being prepared. Please visit again soon.</p>}
    <section className="home-explore"><div className="section-heading"><h2>Explore more</h2><a href="#/explore">All readings</a></div>
      {readings.slice(1,4).map(reading => <ReadingCard reading={reading} key={reading.id}/>)}</section>
  </div>;
}
