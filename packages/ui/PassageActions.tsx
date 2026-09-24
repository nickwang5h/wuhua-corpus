import {Bookmark,Share2,Printer} from 'lucide-react';

type Props={
 saved:boolean;
 onSave:()=>void;
 onShare:()=>void;
 onPrint?:()=>void;
 english?:boolean;
};

/** Presentation only: each app owns its record identity and persistence. */
export function PassageActions({saved,onSave,onShare,onPrint,english=false}:Props){
 return <div className="passage-actions" role="group" aria-label={english?'Passage actions':'原文操作'}>
  <button type="button" aria-pressed={saved} onClick={onSave}><Bookmark size={18} aria-hidden="true"/>{english?(saved?'Saved':'Save'):(saved?'已收藏':'收藏')}</button>
  <button type="button" onClick={onShare}><Share2 size={18} aria-hidden="true"/>{english?'Share':'分享'}</button>
  {onPrint&&<button type="button" onClick={onPrint}><Printer size={18} aria-hidden="true"/>{english?'Print':'打印'}</button>}
 </div>;
}
