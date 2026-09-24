import {createContext, useContext, useEffect, useState} from 'react';
import {convert} from '../content/display';
import type {Settings} from '../ui/data';
import {emptyData} from '../ui/data';
import type {Reading} from '../reading/schema';
import {useReading} from './components';
export const DisplaySettings = createContext<Settings>(emptyData('learning').settings);
export function Phrase(props: Reading['focus'] | Record<string, never>) {
  const {settings,reading} = useReading();
  return <PhraseDisplay {...('chinese' in props ? props as Reading['focus'] : reading.focus)} settings={settings} focus={!('chinese' in props)}/>;
}
export function PhraseDisplay({chinese,pinyin,gloss,settings,focus=false}: Reading['focus'] & {settings:Settings;focus?:boolean}) {
  const [display,setDisplay] = useState(chinese);
  useEffect(() => {
    let active = true;
    setDisplay(chinese);
    void convert(chinese,settings.script).then(text => {if (active) setDisplay(text);}).catch(() => {});
    return () => {active = false;};
  }, [chinese,settings.script]);
  return <figure className={focus ? "phrase phrase-focus" : "phrase"}>
    <div lang={settings.script === 'simplified' ? 'zh-Hans' : 'zh-Hant'}>{display}</div>
    {settings.pinyin && <p className="phrase-pinyin">{pinyin}</p>}
    <figcaption>{gloss}</figcaption>
  </figure>;
}

export function ReadingFocus({focus}: {focus:Reading['focus']}) {
  const settings = useContext(DisplaySettings);
  return <PhraseDisplay {...focus} settings={settings} focus/>;
}
