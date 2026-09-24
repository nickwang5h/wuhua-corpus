import {useCallback,useEffect,useRef,useState} from 'react';
import {emptyData,parseData,mergeData,type Data} from './data';
export function useLocalData(app:Data['app'],key:string,legacy?:{key:string;migrate:(raw:string)=>Data|Promise<Data>}){
 const [initial]=useState(()=>{try{const raw=localStorage.getItem(key);const old=!raw&&legacy?localStorage.getItem(legacy.key):null;return {data:raw?parseData(raw,app):emptyData(app),raw,old,error:''};}catch(e){let raw:string|null=null;try{raw=localStorage.getItem(key);}catch{}return {data:emptyData(app),raw,old:null,error:String(e)};}});
 const [data,setData]=useState(initial.data),[status,setStatus]=useState(initial.error?'blocked':initial.old?'legacy':'saved');
 const [error,setError]=useState(initial.error),[rawRecovery,setRawRecovery]=useState(initial.raw||initial.old||'');
 const migrationRunning=useRef(false);
 const state=useRef(data),baseline=useRef(initial.raw),blocked=useRef(!!initial.error||!!initial.old),blockReason=useRef(initial.old?'legacy':'blocked'),dirty=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const flush=useCallback(()=>{
 clearTimeout(timer.current);if(!dirty.current)return !blocked.current;
 if(blocked.current){setStatus(blockReason.current);return false;}
 try{
  if(localStorage.getItem(key)!==baseline.current){blocked.current=true;blockReason.current='conflict';setStatus('conflict');setError('Another tab changed this data. Keep both before saving / 另一标签页已更新，请先保留两份记录');return false;}
  const next={...state.current,revision:state.current.revision+1};const raw=JSON.stringify(next);
  localStorage.setItem(key,raw);baseline.current=raw;
  if(localStorage.getItem(key)!==raw)throw new Error('Saved data could not be verified');
  state.current=next;setData(next);dirty.current=false;setStatus('saved');setError('');return true;
 }catch(e){setStatus('unsaved');setError(String(e));return false;}
 },[key]);
 const update=useCallback((change:(d:Data)=>Data,defer=false)=>{
  const next=change(state.current);state.current=next;setData(next);dirty.current=true;setStatus(blocked.current?blockReason.current:'pending');
  clearTimeout(timer.current);if(defer){timer.current=setTimeout(flush,300);return false;}return flush();
 },[flush]);
 useEffect(()=>{
 const external=(e:StorageEvent)=>{if(e.key===key&&e.newValue!==baseline.current){blocked.current=true;blockReason.current='conflict';setStatus('conflict');setError('Another tab changed this data / 另一标签页已更新记录');}};
 const unload=(e:BeforeUnloadEvent)=>{flush();if(dirty.current){e.preventDefault();e.returnValue='';}};
 const hide=()=>{if(document.visibilityState==='hidden')flush();};
 window.addEventListener('storage',external);window.addEventListener('beforeunload',unload);window.addEventListener('hashchange',flush);document.addEventListener('visibilitychange',hide);
 return()=>{clearTimeout(timer.current);window.removeEventListener('storage',external);window.removeEventListener('beforeunload',unload);window.removeEventListener('hashchange',flush);document.removeEventListener('visibilitychange',hide);};
 },[key,flush]);
 function keepBoth(){try{const raw=localStorage.getItem(key);const remote=raw?parseData(raw,app):emptyData(app);const merged=mergeData(remote,state.current).data;baseline.current=raw;blocked.current=false;return update(()=>merged);}catch(e){setError(String(e));return false;}}
 async function migrate(){
  if(!legacy||!initial.old||migrationRunning.current)return false;
  migrationRunning.current=true;
  try{
   if(localStorage.getItem(legacy.key)!==initial.old)throw new Error('旧记录已被其他页面更新，请先导出当前会话并重新加载。');
   const next=await legacy.migrate(initial.old);
   if(localStorage.getItem(legacy.key)!==initial.old)throw new Error('旧记录在升级期间发生变化；未写入新存档。');
   localStorage.setItem(`${legacy.key}:backup`,initial.old);
   if(localStorage.getItem(`${legacy.key}:backup`)!==initial.old)throw new Error('Backup failed');
   const merged=mergeData(next,state.current).data;
   blocked.current=false;return update(()=>merged);
  }catch(e){blocked.current=true;blockReason.current='blocked';setError(String(e));setStatus('blocked');return false;}
  finally{migrationRunning.current=false;}
 }

 // Recovery never clears damaged bytes automatically. A validated explicit import is the only replacement path.
 function restore(next:Data){try{if(localStorage.getItem(key)!==baseline.current){blocked.current=true;blockReason.current='conflict';setStatus('conflict');setError('Another tab changed this data. Keep both before restoring / 另一标签页已更新，请先保留两份记录');return false;}if(initial.error&&initial.raw){localStorage.setItem(`${key}:damaged-backup`,initial.raw);if(localStorage.getItem(`${key}:damaged-backup`)!==initial.raw)throw new Error('Backup failed');}baseline.current=localStorage.getItem(key);blocked.current=false;return update(()=>next);}catch(e){setError(String(e));return false;}}
 return {data,status,error,rawRecovery,setRawRecovery,update,flush,keepBoth,migrate,restore};
}
export type LocalData=ReturnType<typeof useLocalData>;
