import {Original} from '../../../../packages/ui/components';
import {pinyinForSource} from '../reading/references';
import {useReading} from './components';
export function ClassicQuote({source}: {source:string}) {
  const {references,settings,showDraftPinyin} = useReading();
  const ref = references[source];
  if (!ref) return <p role="alert">This quotation is unavailable. Reload the reading to try again.</p>;
  return <figure className="classic-quote">
    <blockquote><Original text={ref.text} offset={ref.start} settings={settings}
      aid={pinyinForSource(ref)} preview={showDraftPinyin}/></blockquote>
    <figcaption><a href={ref.source} target="_blank" rel="noreferrer">{ref.title}</a></figcaption>
  </figure>;
}
