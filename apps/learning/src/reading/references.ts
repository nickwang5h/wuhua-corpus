import {findReference, loadBook, workForId} from '../content';
import type {Reference, TextBook} from '@wuhua/corpus/types';
import type {SourceRef} from './schema';
import {pinyinAids} from '@wuhua/corpus/pinyin';

export function resolveSource(book: TextBook, source: SourceRef): Reference {
  const found = findReference(book, source.id);
  if (!found || found.ref.version !== source.version || source.start < 0 || source.end <= source.start || source.end > Array.from(found.ref.text).length)
    throw new Error('This source has changed. Reload the page to read the current edition.');
  return {...found.ref, text: Array.from(found.ref.text).slice(source.start, source.end).join(''),
    start: source.start + (found.ref.start || 0), end: source.end + (found.ref.start || 0), title: source.label || found.ref.title};
}
export async function loadSource(source: SourceRef) {
  const book = workForId(source.id);
  if (!book) throw new Error('Source not found.');
  return resolveSource(await loadBook(book), source);
}

// A paragraph can have separate pronunciation aids for different excerpts.
export function pinyinForSource(ref: Reference) {
  return pinyinAids.find(a => a.target === ref.id && a.version === ref.version && a.review.textVersion === ref.version && a.review.status !== 'withdrawn'
    && Array.from(ref.text).every((char, i) => !/\p{Script=Han}/u.test(char)
      || a.tokens?.some(t => t.start === i + (ref.start || 0) && t.end === i + (ref.start || 0) + 1)));
}
