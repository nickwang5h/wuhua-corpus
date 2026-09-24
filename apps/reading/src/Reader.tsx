import {PassageActions} from '../../../packages/ui/PassageActions';
import {editorialFor} from '../../../packages/content/src/editorial';
import {ShareCard} from '../../../packages/ui/ShareCard';
import {useEffect,useRef,useState} from 'react';
import {loadBook,findReference,workForId,successors,paths,historicalReference} from '../../../packages/content/src';
import {pinyinFor} from '../../../packages/content/src/pinyin';
import {curated,curatedById} from '../../../packages/content/src/curated';
import type {Chapter,Reference,TextBook} from '../../../packages/content/src/types';
import {put,safeURL} from '../../../packages/ui/data';
import type {LocalData} from '../../../packages/ui/useLocalData';
import {Dialog,Original,SettingsPanel,SaveStatus} from '../../../packages/ui/components';
import {noteFor,noteEntry,readLink,linkNoteCopy} from './model';
export default function Reader({id,mode,pathId,version,local}:{id:string;mode:string;pathId:string|null;version:string|null;local:LocalData}){
 const legacy=curatedById[id];const [book,setBook]=useState<TextBook>(),[error,setError]=useState(''),[retry,setRetry]=useState(0),[active,setActive]=useState(id),[settings,setSettings]=useState(false),[contents,setContents]=useState(false),[share,setShare]=useState(false),[depth,setDepth]=useState(1),[term,setTerm]=useState(''),[focus,setFocus]=useState(false),[linkError,setLinkError]=useState('');
 const restored=useRef(false),positionTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>{let alive=true;const work=workForId(id);setError('');if(!work||legacy)return;loadBook(work).then(b=>{if(alive){setBook(b);const target=b.chapters.find(c=>c.id===id)?.paragraphs[0]?.id;setActive(target||id);}}).catch(e=>{if(alive)setError(String(e).includes('release changed')?'内容版本已更新，请重新加载页面。':'正文加载失败。可以重试，或回到本机记录。');});return()=>{alive=false;};},[id,retry,legacy]);
 const resolved=book?findReference(book,active):undefined;const initial=book?findReference(book,id):undefined;
 const chapter:Chapter|undefined=initial?.chapter||book?.chapters.find(c=>c.id===id);
 const historical=(version?local.data.records.find(r=>r.ref?.id===id&&r.ref.version===version)?.ref:undefined)||historicalReference(id,version||undefined);
 const lost=local.data.records.find(r=>r.ref?.id===id)?.ref;
 const ref:Reference|undefined=historical|| (legacy?{id,version:legacy.version,text:legacy.text,title:legacy.title,source:legacy.source}:resolved?.ref)||(!workForId(id)?lost:undefined);
 const isHistorical=!!historical&&historical.version!==(legacy?.version||resolved?.paragraph.version)||!!resolved&&resolved.ref.version!==resolved.paragraph.version;
 const note=ref?noteFor(local.data,ref):undefined;
 const marked=ref&&local.data.records.some(r=>r.kind==='bookmark'&&r.ref?.id===ref.id&&r.ref.version===ref.version);
 const transition=ref?successors(ref):undefined;
 const a=legacy?.annotation;const aids=ref?editorialFor(resolved?.paragraph.id||ref.id,ref.version):[];const explanation=aids.find(a=>a.kind==='explanation-zh'),commentary=aids.find(a=>a.kind==='commentary-zh');
 const path=paths.find(p=>p.id===pathId&&p.ids.includes(id));const order=legacy?(path?.ids||curated.filter(p=>p.book===legacy.book).map(p=>p.id)):book?.chapters.map(c=>c.id)||[];
 const currentIndex=order.indexOf(legacy?id:chapter?.id||'');
 const previous=order[currentIndex-1],next=order[currentIndex+1];
 useEffect(()=>{document.body.dataset.readingFocus=String(focus);return()=>{delete document.body.dataset.readingFocus;};},[focus]);
 useEffect(()=>{if(mode!=='clear')setFocus(false);},[mode]);
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.key==='Escape'){setFocus(false);return;}const target=event.target as HTMLElement;if(target.closest('textarea,input,select,button,a,dialog,[contenteditable=true]')||document.querySelector('dialog[open]')||event.metaKey||event.ctrlKey||event.altKey)return;const destination=event.key==='ArrowRight'?next:event.key==='ArrowLeft'?previous:undefined;if(destination){event.preventDefault();location.hash=readLink(destination,mode,pathId);}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[next,previous,mode,pathId]);
 useEffect(()=>{
 if(!ref||restored.current)return;restored.current=true;
 const saved=local.data.records.find(r=>r.recordId==='lastRead'&&r.ref?.id===ref.id);
 requestAnimationFrame(()=>{const target=document.getElementById(resolved?.paragraph.id||ref.id);if(target){target.scrollIntoView({block:'start'});if(saved?.offset)window.scrollBy(0,saved.offset*target.offsetHeight);}});
 },[ref?.id,resolved?.paragraph.id,local.data.records]);
 // Position updates use an anchored paragraph, never an index. The first record waits for restored layout.
 useEffect(()=>{
 if(!ref)return;
 const currentRef=ref;
 function remember(){const element=document.getElementById(resolved?.paragraph.id||currentRef.id);const offset=mode==='clear'&&element?Math.max(0,Math.min(1,-element.getBoundingClientRect().top/Math.max(1,element.offsetHeight))):0;
 local.update(d=>{const entry={recordId:'lastRead',kind:'position' as const,ref:currentRef,updated:new Date().toISOString(),offset};let next=put(d,entry);const work=legacy?.book||book?.id;if(work)next=put(next,{...entry,recordId:`bookLast:${work}`});return next;},true);}
 const timer=setTimeout(remember,100);
 const listener=()=>{clearTimeout(positionTimer.current);positionTimer.current=setTimeout(remember,350);};window.addEventListener('scroll',listener,{passive:true});
 return()=>{clearTimeout(timer);clearTimeout(positionTimer.current);window.removeEventListener('scroll',listener);};
 },[ref?.id,ref?.version,book?.id,legacy?.book,resolved?.paragraph.id,local.update,mode]);
 useEffect(()=>{
 if(!chapter||mode!=='clear')return;const observer=new IntersectionObserver(entries=>{const entry=entries.filter(e=>e.isIntersecting).sort((a,b)=>Math.abs(a.boundingClientRect.top)-Math.abs(b.boundingClientRect.top))[0];if(entry&&!document.querySelector('textarea:focus'))setActive(initial?.paragraph.id===entry.target.id?id:entry.target.id);},{rootMargin:'-10% 0px -60% 0px',threshold:0});
 chapter.paragraphs.forEach(p=>{const element=document.getElementById(p.id);if(element)observer.observe(element);});return()=>observer.disconnect();
 },[chapter?.id,mode,id]);
 useEffect(()=>{if(mode!=='clear'&&ref)requestAnimationFrame(()=>document.getElementById('passage-notes')?.scrollIntoView({block:'start'}));},[mode,ref?.id]);
 if(error)return <section className="page narrow"><h1>暂时无法加载正文</h1><p>{error}</p><div className="actions"><button onClick={()=>setRetry(n=>n+1)}>重试</button><button onClick={()=>location.reload()}>重新加载页面</button><a href="#/notes">查看本机记录</a><a href="#/library">回书架</a></div></section>;
 if(!ref&&!legacy&&workForId(id)&&!book)return <section className="page" role="status">正在打开原文…</section>;
 if(!ref)return <section className="page narrow"><h1>这个引用暂时无法找到</h1><p>没有删除你的记录。若有旧备份，可以导入后在历史记录中查看。</p><a href="#/notes">查看记录与恢复</a></section>;
 function edit(draft:string,save=false){if(!ref)return;local.update(d=>put(d,noteEntry(ref,noteFor(d,ref),draft,save?draft:noteFor(d,ref)?.saved)),!save);}
 async function linkTo(targetId:string,targetVersion:string){
  if(!note)return;
  try{const work=workForId(targetId);if(!work)throw new Error('暂时找不到后继原文');const target=findReference(await loadBook(work),targetId)?.ref;if(!target||target.version!==targetVersion)throw new Error('后继版本暂不可用，原记录未改变');if(window.confirm(`保留原记录，并将一份副本关联“${target.title}”的这个完整段落？`))local.update(d=>linkNoteCopy(d,note.recordId,target));}
  catch(e){setLinkError(String(e));}
 }
 function bookmark(){if(!ref)return;if(marked&&local.status!=='saved'){local.flush();return;}local.update(d=>marked?{...d,records:d.records.filter(r=>!(r.kind==='bookmark'&&r.ref?.id===ref.id&&r.ref.version===ref.version))}:put(d,{recordId:`bookmark:${ref.id}@${ref.version}`,kind:'bookmark',ref,updated:new Date().toISOString()}));}
 const excerptView=!!legacy||isHistorical||!chapter;
 const shortExcerpt=excerptView&&Array.from(ref.text).filter(c=>/\p{Script=Han}/u.test(c)).length<=100;
 const noteBlock=<section className="reflection"><h2>写下自己的话</h2><p>{a?.prompt||'可以留下理解，也可以只记一个问题。'}</p><label htmlFor="reflection-note">我的理解或疑问</label><textarea id="reflection-note" value={note?.draft||''} placeholder="不用急着得出答案。" onChange={e=>edit(e.target.value)} onBlur={local.flush}/><div className="actions"><button className="primary" disabled={!note?.draft?.trim()} onClick={()=>edit(note?.draft||'',true)}>留下这次理解</button><span className="muted">草稿与已保存内容分别保留</span></div><SaveStatus local={local}/>{note?.saved&&<details><summary>查看已保存的理解</summary><p className="note-copy">{note.saved}</p></details>}</section>;
 return <section className={`page reader-page ${focus?'focused':''}`}><div className="reader-toolbar"><a href={path?`#/path/${path.id}`:'#/library'}>返回{path?'路径':'书架'}</a><span>{ref.title}</span><div className="actions"><button onClick={()=>setContents(true)}>目录</button><button onClick={()=>setSettings(true)}>阅读设置</button><PassageActions saved={!!marked&&local.status==='saved'} onSave={bookmark} onShare={()=>setShare(true)}/>{mode==='clear'&&<button aria-pressed={focus} onClick={()=>setFocus(f=>!f)}>{focus?'退出专注':'专注'}</button>}</div></div><div className="reader-layout"><article className="reading-column"><h1>{chapter?.title||ref.title}</h1>{legacy&&<p className="muted">旧版精选 · 底本待核验 · 解读未审核</p>}{isHistorical&&<div className="notice">正在查看记录中的历史原文。{resolved&&<><a href={readLink(resolved.paragraph.id)}>查看当前版本</a><details><summary>对照当前原文</summary><Original text={resolved.paragraph.text} settings={local.data.settings}/></details>{note&&<button onClick={()=>void linkTo(resolved.paragraph.id,resolved.paragraph.version)}>保留原记录并关联新版副本</button>}</>}</div>}{transition&&<div className="notice"><p>{transition.reason}</p>{transition.targets.map(t=><div className="actions" key={t.id}><a href={readLink(t.id)}>查看后继段落</a>{note&&<button onClick={()=>void linkTo(t.id,t.version)}>保留原记录并关联此段副本</button>}</div>)}</div>}{legacy||isHistorical||!chapter?<div id={ref.id} className={shortExcerpt?'short-excerpt':'long-excerpt'}><Original text={ref.text||'此旧记录未保存原文快照，个人文字仍可查看和导出。'} settings={local.data.settings} aid={pinyinFor(ref.id,ref.version)} offset={ref.start}/></div>:chapter.paragraphs.map(p=><section id={p.id} className={`reading-paragraph ${resolved?.paragraph.id===p.id?'current':''}`} key={p.id}><Original text={p.text} settings={local.data.settings} aid={pinyinFor(p.id,p.version)}/></section>)}<div className="actions reader-pagination"><a className="button" href={currentIndex>0?readLink(order[currentIndex-1],'clear',pathId):'#/library'}>{currentIndex>0?'上一篇／则':'回到书架'}</a><a className="button" href={currentIndex>=0&&currentIndex<order.length-1?readLink(order[currentIndex+1],'clear',pathId):path?'#/paths':'#/library'}>{currentIndex<order.length-1?'下一篇／则':'读完，回到目录'}</a></div></article><aside id="passage-notes" className="reader-aside">{linkError&&<p role="alert">{linkError}</p>}<div className="reading-modes" aria-label="阅读方式">{['clear','explain','reflect'].map((m,i)=><a key={m} aria-current={mode===m?'page':undefined} href={readLink(ref.id,m,pathId)}>{['清读','解读','回味'][i]}</a>)}</div>{mode==='explain'&&<section>{explanation?<><h2>首句的白话理解</h2><p>{explanation.text}</p><p className="attribution">{explanation.rights.author} · 未审核草稿</p>{commentary&&<details><summary>古注参考</summary><p>{commentary.text}</p><p>{commentary.rights.author} · {commentary.rights.edition}</p><a href={commentary.rights.source} target="_blank" rel="noreferrer">CText 对应材料</a></details>}</>:a?<><p className="status-tag">独立编写的草稿，尚未审核，不是唯一解释。</p><div className="actions">{a.terms.map(t=><button key={t.word} aria-pressed={term===t.word} onClick={()=>setTerm(term===t.word?'':t.word)}>{t.word}</button>)}</div>{a.terms.filter(t=>t.word===term).map(t=><p key={t.word}><strong>{t.word}</strong> {t.pinyin}<br/>{t.meaning}</p>)}{depth>=1&&<><h3>换成今天的话</h3><p>{a.translation}</p></>}{depth>=2&&<><h3>一种理解</h3><p>{a.thought}</p></>}{depth>=3&&<><h3>放回上下文</h3><p>{a.context}</p></>}{depth<3&&<button onClick={()=>setDepth(d=>d+1)}>再展开一层</button>}<div className="actions">{a.concepts.map(c=><a href={`#/concept/${encodeURIComponent(c)}?from=${id}`} key={c}>{c}</a>)}</div></>:<p>这一段还没有解读。你可以先读原文，留下自己的理解或疑问。</p>}</section>}{mode==='reflect'&&noteBlock}{safeURL(ref.source)&&<p className="reader-sources"><a href={safeURL(ref.source)} target="_blank" rel="noreferrer">原始参考</a></p>}</aside></div>{settings&&<Dialog title="阅读设置" onClose={()=>setSettings(false)}><SettingsPanel value={local.data.settings} onChange={settings=>local.update(d=>({...d,settings}))}/></Dialog>}{contents&&<Dialog title="篇章目录" onClose={()=>setContents(false)}><div className="chapter-list">{book?book.chapters.map(c=><a key={c.id} href={readLink(c.id)} onClick={()=>setContents(false)}>{c.title}</a>):order.map(key=><a key={key} href={readLink(key,'clear',pathId)} onClick={()=>setContents(false)}>{curatedById[key]?.title}</a>)}</div></Dialog>}{share&&<ShareCard passages={[{reference:ref,caption:ref.title,link:`https://wuhua.app/#/read/${encodeURIComponent(ref.id)}/clear`}]} script={local.data.settings.script} onClose={()=>setShare(false)}/>}</section>;
}
