import type { CanonicalPassage, Source } from './schema';

// Accept a reviewed transcription, not arbitrary HTML/wikitext or modern commentary.
// This stages a candidate only; it never overwrites the active catalog.
export type WikisourceSnapshot = {
 sourceId: string; pageUrl: string; revision: string; edition: string | null;
 rights: Source['rights'];
 passages: { id: string; divisionId: string; locator: string; text: string }[];
};
export function stageWikisource(snapshot: WikisourceSnapshot): { source: Source; passages: CanonicalPassage[] } {
 const url = new URL(snapshot.pageUrl);
 if (url.protocol !== 'https:' || url.hostname !== 'zh.wikisource.org' || url.username || url.password || !url.pathname.startsWith('/wiki/')) throw new Error('Expected a Chinese Wikisource page URL');
 if (!snapshot.sourceId.trim() || !/^\d+$/.test(snapshot.revision)) throw new Error('Source ID and numeric revision required');
 if (snapshot.rights.status !== 'unverified' && (!snapshot.rights.license || !snapshot.rights.evidenceUrl || !snapshot.rights.verifiedAt)) throw new Error('Rights evidence required');
 const ids = new Set<string>();
 if (!snapshot.passages.length) throw new Error('No passages');
 const passages = snapshot.passages.map(p=>{
  if (!p.id.trim() || ids.has(p.id) || !p.divisionId.trim() || !p.locator.trim() || !p.text.trim()) throw new Error('Invalid or duplicate passage');
  ids.add(p.id);
  return { id:p.id, divisionId:p.divisionId, locator:p.locator, sentences:[{id:`${p.id}-s1`,text:p.text}], referenceUrl:url.href };
 });
 url.searchParams.set('oldid',snapshot.revision);
 return {
  source:{id:snapshot.sourceId,provider:'wikisource',url:url.href,revision:snapshot.revision,edition:snapshot.edition,
   rights:{...snapshot.rights},processing:{imported:true,normalized:false,punctuationModified:false,manuallyVerified:false}},
  passages,
 };
}
