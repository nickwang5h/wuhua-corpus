import {useEffect,useState} from 'react';
import {BrandMark} from './ui/BrandMark';
import {ThemeToggle} from './ui/ThemeToggle';
import {useLocalData} from './ui/useLocalData';
import {Dialog,SaveStatus,SettingsPanel,useAppearance} from './ui/components';
import {availableReadings,preview} from './reading/registry';
import {storageKey} from './reading/records';
import {routeReadingId} from './reading/legacy';
import {DisplaySettings} from './mdx/Phrase';
import {HomePage} from './pages/HomePage';
import {ExplorePage} from './pages/ExplorePage';
import {ReadingPage} from './pages/ReadingPage';
import {SourcesPage} from './pages/SourcesPage';
import {SavedPage} from './pages/SavedPage';
export default function App() {
  const [hash,setHash] = useState(location.hash || '#/');
  const [settings,setSettings] = useState(false);
  const local = useLocalData('learning',storageKey);
  useAppearance(local.data.settings);
  useEffect(() => {
    const change = () => {setHash(location.hash || '#/');window.scrollTo(0,0);document.getElementById('main')?.focus({preventScroll:true});};
    window.addEventListener('hashchange',change);
    return () => window.removeEventListener('hashchange',change);
  },[]);
  let parts: string[];
  try {parts = hash.slice(2).split('/').map(decodeURIComponent);} catch {parts = ['missing'];}
  const [page,id] = parts;
  const readingId = routeReadingId(page,id);
  const reading = availableReadings.find(r => r.id === readingId);
  useEffect(() => {document.title = reading ? `${reading.title} · Wuhua Learn` : 'Wuhua Learn · Chinese through philosophy';},[reading]);
  let content;
  if (!page) content = <HomePage readings={availableReadings}/>;
  else if (page === 'explore' || page === 'units') content = <ExplorePage readings={availableReadings}/>;
  else if (page === 'saved' || page === 'notes') content = <SavedPage local={local} readings={availableReadings}/>;
  else if (page === 'sources') content = <SourcesPage readings={availableReadings}/>;
  else if (reading) content = <ReadingPage key={reading.id} reading={reading} readings={availableReadings} local={local} preview={preview}/>;
  else content = <section className="page"><h1>This reading is not available.</h1><p><a href="#/explore">Find another reading</a>, or visit <a href="#/saved">your saved notes</a>.</p></section>;
  return <>
    <button className="skip" onClick={() => document.getElementById('main')?.focus()}>Skip to content</button>
    <header className="site-header"><a href="#/" className="brand"><BrandMark/>Wuhua Learn</a>
      <nav aria-label="Main navigation">{[['','Home'],['explore','Explore'],['saved','Saved']].map(([route,label]) => <a key={route} href={`#/${route}`} aria-current={page === route ? 'page' : undefined}>{label}</a>)}</nav>
      <div className="header-settings"><button onClick={() => setSettings(true)}>Settings</button><ThemeToggle english settings={local.data.settings} onChange={settings => local.update(d => ({...d,settings}))}/></div>
    </header>
    {!['saved','pending'].includes(local.status) && <SaveStatus local={local} english/>}
    {preview && <p className="preview-notice">Author preview — includes unreleased readings.</p>}
    <DisplaySettings.Provider value={local.data.settings}><main id="main" tabIndex={-1}>{content}</main></DisplaySettings.Provider>
    <footer className="site-footer"><span>Wuhua Learn</span><a href="#/sources">Sources and writing</a><a href="https://wuhua.app/">中文阅读</a></footer>
    {settings && <Dialog title="Reading settings" onClose={() => setSettings(false)}><SettingsPanel english value={local.data.settings} onChange={settings => local.update(d => ({...d,settings}))}/></Dialog>}
  </>;
}
