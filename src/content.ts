// Compatibility projection: reader URLs and persisted notes keep their original IDs.
import { catalog } from './content/catalog';
import type { WorkId } from './content/schema';
export type BookId = WorkId;
export type Passage = { id: string; book: BookId; chapter: string; lines: string[]; terms: { word: string; pinyin: string; meaning: string }[]; translation: string; thought: string; context: string; prompt: string; concepts: string[]; source: string; provenanceStatus: string };
export const books = catalog.works;
export const concepts = catalog.concepts;
export const paths = catalog.paths;
const divisions = new Map(catalog.divisions.map(d=>[d.id,d]));
const editions = new Map(catalog.editions.map(e=>[e.id,e]));
const annotations = new Map(catalog.annotations.map(a=>[a.target,a]));
export const passages: Passage[] = catalog.passages.map(p=>{
 const division = divisions.get(p.divisionId)!;
 const edition = editions.get(division.editionId)!;
 const a = annotations.get(p.id)!;
 return { id:p.id, book:edition.workId, chapter:p.locator, lines:a.displayLines,
  terms:a.terms, translation:a.translation, thought:a.thought, context:a.context,
  prompt:a.prompt, concepts:a.concepts, source:p.referenceUrl,
  provenanceStatus:edition.status === 'verified' ? '底本已核验' : '底本与授权待核验；链接仅供交叉参考',
 };
});
export const passageById: Record<string, Passage> = Object.assign(Object.create(null), Object.fromEntries(passages.map(p => [p.id, p])));
export const bookById: Record<string, typeof books[number]> = Object.assign(Object.create(null), Object.fromEntries(books.map(b => [b.id, b])));
