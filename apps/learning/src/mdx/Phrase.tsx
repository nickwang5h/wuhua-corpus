import {useEffect, useState} from 'react';
import {convert} from '../../../../packages/content/src/display';
import {useReading} from './components';
export function Phrase({chinese,pinyin,gloss}: {chinese:string;pinyin:string;gloss:string}) {
  const {settings} = useReading();
  const [display,setDisplay] = useState(chinese);
  useEffect(() => {
    let active = true;
    setDisplay(chinese);
    void convert(chinese,settings.script).then(text => {if (active) setDisplay(text);}).catch(() => {});
    return () => {active = false;};
  }, [chinese,settings.script]);
  return <figure className="phrase">
    <div lang={settings.script === 'simplified' ? 'zh-Hans' : 'zh-Hant'}>{display}</div>
    {settings.pinyin && <p className="phrase-pinyin">{pinyin}</p>}
    <figcaption>{gloss}</figcaption>
  </figure>;
}
