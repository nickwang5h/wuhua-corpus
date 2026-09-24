import {useEffect,useRef} from 'react';
import {BrandMark} from './BrandMark';
export default function HomeButterfly(){
 const ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  const host=ref.current!;const motion=matchMedia('(prefers-reduced-motion: reduce)');let disposed=false,loading=false,visible=false,cleanup:(()=>void)|undefined;
  const fallback=()=>{cleanup?.();cleanup=undefined;host.dataset.renderer='svg';};
  async function start(){if(disposed||loading||cleanup||motion.matches||!visible||document.hidden)return;loading=true;try{const {createButterfly}=await import('./lorenz-renderer');if(!disposed&&!motion.matches&&visible&&!document.hidden)cleanup=createButterfly(host,()=>{queueMicrotask(()=>{if(!disposed)fallback();});});}catch{if(!disposed)fallback();}finally{loading=false;}}
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;if(visible)void start();});observer.observe(host);
  const onMotion=()=>{if(motion.matches)fallback();else void start();};const onVisible=()=>{if(!document.hidden)void start();};motion.addEventListener('change',onMotion);document.addEventListener('visibilitychange',onVisible);
  return()=>{disposed=true;observer.disconnect();motion.removeEventListener('change',onMotion);document.removeEventListener('visibilitychange',onVisible);cleanup?.();};
 },[]);
 return <span ref={ref} className="home-butterfly" aria-hidden="true" data-renderer="svg"><BrandMark large/></span>;
}
