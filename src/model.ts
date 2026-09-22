import { books, passages, passageById, paths } from './content';
export type Mode = 'clear' | 'explain' | 'reflect';
export type Note = { draft: string; saved: string; updated: string };
export type Store = { version: 1; notes: Record<string, Note>; bookmarks: string[]; lastRead: string; bookLast: Record<string, string>; font: number };
export const storageKey = 'wuhua:reading:v1';
export const emptyStore = (): Store => ({version:1,notes:{},bookmarks:[],lastRead:'',bookLast:{},font:1});
export function parseStore(raw: string | null): Store {
  if (!raw) return emptyStore();
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1) throw new Error('存档格式无法识别');
  const input = data as Record<string, unknown>, result = emptyStore();
  if (typeof input.lastRead === 'string' && passageById[input.lastRead]) result.lastRead = input.lastRead;
  if (typeof input.font === 'number' && [0,1,2].includes(input.font)) result.font = input.font;
  if (Array.isArray(input.bookmarks)) result.bookmarks = [...new Set(input.bookmarks.filter((id): id is string => typeof id === 'string' && Boolean(passageById[id])))];
  if (input.notes && typeof input.notes === 'object') for (const p of passages) {
    const n = (input.notes as Record<string, unknown>)[p.id];
    if (!n || typeof n !== 'object') continue;
    const note = n as Record<string, unknown>;
    if (typeof note.draft === 'string' && typeof note.saved === 'string' && typeof note.updated === 'string') result.notes[p.id] = {draft:note.draft.slice(0,2000),saved:note.saved.slice(0,2000),updated:note.updated};
  }
  if (input.bookLast && typeof input.bookLast === 'object') for (const b of books) {
    const id = (input.bookLast as Record<string, unknown>)[b.id];
    if (typeof id === 'string' && passageById[id]?.book === b.id) result.bookLast[b.id] = id;
  }
  return result;
}
export function readingIds(passageId: string, pathId?: string | null): string[] {
  const path = paths.find(p => p.id === pathId && p.ids.includes(passageId));
  if (path) return path.ids;
  return passages.filter(p => p.book === passageById[passageId]?.book).map(p => p.id);
}
export function readLink(id: string, mode: Mode = 'clear', path?: string | null): string {
  return `#/read/${encodeURIComponent(id)}/${mode}${path ? `?path=${encodeURIComponent(path)}` : ''}`;
}
export function notesMarkdown(store: Store): string {
  const body = passages.filter(p => store.notes[p.id]?.saved).map(p => {
    const n=store.notes[p.id], book=books.find(b=>b.id===p.book)!;
    return `## 《${book.title}》· ${p.chapter}\n\n> ${p.lines.join('\n> ')}\n\n${n.saved}\n\n记录时间：${n.updated}\n\n[原文出处](${p.source})`;
  });
  return `# 物化间 · 我的回味\n\n${body.join('\n\n---\n\n')}\n`;
}
