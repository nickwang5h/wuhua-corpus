/**
 * A paragraph moving to a new version, as content:correct makes it: the old version goes into
 * history with a revision transition to the new one, and the paragraph's sentence aliases (the
 * `ws-…` ids of the three hand-imported books) follow. Each alias moves to the paragraph's new
 * version: its range becomes where that sentence now stands (the changed characters included), its
 * text the slice of the new paragraph there, and the alias as it was goes into history with a
 * transition of its own, so an old ref reaches the current one by `successors`.
 */
import type {Alias,Paragraph,Reference,Transition} from '../src/types.js';
import {boundaryMap} from './text-edits.js';

export type History={records:Reference[]; transitions:Transition[]};
// The reason recorded for an alias whose sentence the revision left as it was.
export const UNCHANGED='所在段落另处订正，本句文字未变';
const slice=(text:string,start:number,end:number)=>Array.from(text).slice(start,end).join('');

// History for one id leaving `from` for `to`.
function retire(history:History,id:string,from:{version:string;text:string},to:string,reason:string,chapter:{title:string;source:string}){
 // Going back to a text this id once had: that version is current again, so it stops being history
 // and its old step forward goes, or the chain would run in a circle.
 const back=history.transitions.findIndex(t=>t.from.id===id&&t.from.version===to);
 if(back>=0){
  history.transitions.splice(back,1);
  const kept=history.records.findIndex(r=>r.id===id&&r.version===to);
  if(kept>=0)history.records.splice(kept,1);
 }
 if(!history.records.some(r=>r.id===id&&r.version===from.version))history.records.push({id,version:from.version,text:from.text,title:chapter.title,source:chapter.source});
 history.transitions.push({from:{id,version:from.version},kind:'revision',reason,targets:[{id,version:to}]});
}

/**
 * Move the aliases of `paragraph` that are at `from.version` (whose paragraph text was `from.text`)
 * to the paragraph's current version and text, along `place` (old code point → new index or -1).
 * Nothing changes unless every one of them can move. Returns the aliases moved, with what they were.
 */
export function followAliases(paragraph:Paragraph,from:{version:string;text:string},place:number[],chapter:{title:string;source:string},history:History,reason:string){
 const {version,text}=paragraph;
 if(from.version===version)throw new Error(`${paragraph.id}: aliases are already at version ${version}`);
 if(place.length!==Array.from(from.text).length)throw new Error(`${paragraph.id}: place does not cover the old text`);
 const map=boundaryMap(place,text);
 const moves=paragraph.aliases.filter(a=>a.version===from.version).map(alias=>{
  if(slice(from.text,alias.start,alias.end)!==alias.text)throw new Error(`${alias.id}: the alias does not match its paragraph at version ${from.version}`);
  const start=map(alias.start),end=map(alias.end);
  if(end<=start)throw new Error(`${alias.id}: the change removes the whole sentence; edit the aliases by hand`);
  return {alias,start,end};
 });
 const moved:{alias:Alias;was:Alias}[]=[];
 for(const {alias,start,end} of moves){
  const was={...alias},now=slice(text,start,end);
  retire(history,alias.id,was,version,now===was.text?UNCHANGED:reason,chapter);
  Object.assign(alias,{start,end,version,text:now});
  moved.push({alias,was});
 }
 return moved;
}

/**
 * Take `paragraph` to `next.text` at `next.version`, `place` mapping its current text into the new
 * one: history and aliases as above. The first text is kept as `sourceText`; the correction note
 * is the caller's.
 */
export function reviseParagraph(paragraph:Paragraph,chapter:{title:string;source:string},next:{text:string;place:number[];version:string;reason:string},history:History){
 const from={version:paragraph.version,text:paragraph.text};
 const stale=paragraph.aliases.find(a=>a.version!==from.version);
 if(stale)throw new Error(`${paragraph.id}: alias ${stale.id} is at version ${stale.version}, not ${from.version}; align it first (scripts/migrate-aliases.ts)`);
 // Aliases are checked before anything changes.
 const trial=structuredClone(paragraph);
 trial.text=next.text;trial.version=next.version;
 followAliases(trial,from,next.place,chapter,{records:[],transitions:[]},next.reason);
 retire(history,paragraph.id,from,next.version,next.reason,chapter);
 paragraph.sourceText??=from.text;
 paragraph.text=next.text;
 paragraph.version=next.version;
 return followAliases(paragraph,from,next.place,chapter,history,next.reason);
}
