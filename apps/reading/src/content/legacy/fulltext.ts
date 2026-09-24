import data from './fulltext.json';
import type { WorkId } from './schema';

export type TextBook = { id: WorkId; chapters: {number:number; title:string; source:string; paragraphs:string[]}[] };
export const fullBooks = data as TextBook[];

// Reading units, not a scholarly claim about sentence boundaries. Preserve every character.
export function splitSentences(text:string): string[] {
 return text.match(/[^。！？]*[。！？]+[」』”’]*|[^。！？]+$/gu) ?? [];
}
