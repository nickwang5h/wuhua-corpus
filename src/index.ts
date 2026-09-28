import manifest from './manifest.json' with {type:'json'};
import history from './history.json' with {type:'json'};
import type { TextBook, Reference, Paragraph, Chapter, Transition } from './types.js';
import works from './works.json' with {type:'json'};
export {works};
import conceptData from './concepts.json' with {type:'json'};
export const concepts:Record<string,{id:string}>=conceptData;
export { manifest };
export const contentRelease = '2026-09-28-sunzi1';
const cache = new Map<string,Promise<TextBook>>();
export function loadBook(id:string):Promise<TextBook> {
 if(!/^[a-z0-9-]+$/.test(id)||!manifest.some(b=>b.id===id))return Promise.reject(new Error('Book not found'));
 if(!cache.has(id))cache.set(id,fetch(`/releases/${contentRelease}/books/${id}.json`).then(async response=>{
  if(!response.ok)throw new Error(`Text loading failed (${response.status})`);
  const data=await response.json();
  if(!data||typeof data!=='object'||!('release' in data)||data.release!==contentRelease||!('id' in data)||data.id!==id||!('chapters' in data)||!Array.isArray(data.chapters))throw new Error('Text release changed; reload this page');
  return data as TextBook;
 }).catch(error=>{cache.delete(id);throw error;}));
 return cache.get(id)!;
}
export function workForId(id:string):string|undefined {return manifest.find(b=>id.startsWith(`image-${b.id}-`)||id.startsWith(`p-${b.id}-`)||id.startsWith(`ws-${b.id}-`)||id.startsWith(`chapter-${b.id}-`))?.id;}
export function findReference(book:TextBook,id:string):{chapter:Chapter;paragraph:Paragraph;ref:Reference}|undefined {
 for(const chapter of book.chapters) for(const paragraph of chapter.paragraphs) {
  const alias=paragraph.aliases.find(a=>a.id===id);
  if(paragraph.id===id||alias) return {chapter,paragraph,ref:{id,version:alias?.version||paragraph.version,text:alias?alias.text:paragraph.text,title:`${book.metadata?.title||works.find(w=>w.id===book.id)?.title||book.id} · ${chapter.title}`,source:chapter.source,...(alias?{start:alias.start,end:alias.end}:{})}};
 }
}
// Reviewed transitions are explicit data. Empty means no published text has been replaced yet.
export const transitions=history.transitions as Transition[];
export const historicalReferences=history.records as Reference[];
export function historicalReference(id:string,version?:string){return historicalReferences.find(r=>r.id===id&&(!version||r.version===version));}
export function successors(ref:Pick<Reference,'id'|'version'>,changes:Transition[]=transitions){return changes.find(t=>t.from.id===ref.id&&t.from.version===ref.version);}

export function findImage(book:TextBook,id:string){for(const chapter of book.chapters){const image=chapter.images?.find(im=>im.id===id);if(image)return {chapter,image};}}
