import type {Reading} from '../reading/schema';
import {Provenance} from '../reading/Provenance';
import {works} from '../content';
export function SourcesPage({readings}: {readings:Reading[]}) {
  return <section className="page sources-page"><h1>Sources and writing</h1>
    <p>These short readings connect everyday questions with Chinese words and classical texts. English explanations are Wuhua's own editorial writing; classical quotations come from the shared Chinese library.</p>
    <p>Each reading lists its author and editorial status. Draft writing and pronunciation aids have not completed human review. Public availability is a separate decision. Pinyin uses dictionary tones; pronunciation can change in connected speech.</p>
    <h2>Classical editions</h2>
    <p>Fixed Wikisource revisions preserve the original text, contributor history and attribution. Transcriptions are credited to Chinese Wikisource contributors under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. The site normalises markup, selects excerpts and optionally converts displayed characters; the pinned source remains available.</p>
    {works.map(work => <p key={work.id}><a href={`https://wuhua.app/#/library?book=${work.id}`}>{work.title}</a></p>)}
    <p><a href="https://wuhua.app/sources">Full source attribution and licensing</a></p>
    <h2>Type and display</h2>
    <p>Chinese examples use LXGW WenKai GB Screen by LXGW, under the <a href="/fonts/lxgw-wenkai-gb-screen/OFL.txt">SIL Open Font License 1.1</a>. <a href="/fonts/lxgw-wenkai-gb-screen/SOURCE.md">Font source and packaging</a>.</p>
    <p>Optional character conversion uses OpenCC. <a href="/licenses/opencc.txt">OpenCC license</a>. Conversion changes the display, not the source edition.</p>
    <h2>Reading notes</h2>{readings.map(r => <details key={r.id}><summary>{r.title}</summary><Provenance reading={r}/></details>)}
  </section>;
}
