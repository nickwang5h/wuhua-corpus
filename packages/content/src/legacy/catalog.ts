import type { Catalog } from './schema';
import { works } from './works';
import { sources } from './sources';
import { editions } from './editions';
import { divisions } from './divisions';
import { texts } from './texts';
import { annotations } from './annotations';
import { concepts } from './concepts';
import { paths } from './paths';

export function validateCatalog(c: Catalog): void {
 const require = (ok: unknown, message: string) => { if (!ok) throw new Error(`Content: ${message}`); };
 const index = <T extends {id: string}>(rows: T[]) => {
  const map = new Map<string,T>();
  for (const row of rows) { require(row.id && !map.has(row.id), `duplicate/empty id ${row.id}`); map.set(row.id,row); }
  return map;
 };
 const works = index(c.works), sources = index(c.sources), editions = index(c.editions), divisions = index(c.divisions), passages = index(c.passages);
 index(c.annotations); index(c.paths);
 const url = (value: string) => { const parsed = new URL(value); require(parsed.protocol === 'https:', `unsafe URL ${value}`); };
 for (const s of c.sources) {
  if (s.url) url(s.url);
  if (s.rights.evidenceUrl) url(s.rights.evidenceUrl);
  if (s.rights.status !== 'unverified') require(s.rights.license && s.rights.evidenceUrl && s.rights.verifiedAt, `missing rights evidence ${s.id}`);
  if (s.processing.imported) require(s.url && s.revision, `missing import provenance ${s.id}`);
 }
 for (const e of c.editions) {
  require(works.has(e.workId) && sources.has(e.sourceId), `edition references ${e.id}`);
  const s = sources.get(e.sourceId)!;
  if (e.status === 'verified') require(s.rights.status !== 'unverified' && s.processing.manuallyVerified && s.edition, `unverified edition ${e.id}`);
 }
 for (const d of c.divisions) require(editions.has(d.editionId) && Number.isInteger(d.number) && d.number > 0, `division ${d.id}`);
 const sentences = new Set<string>();
 for (const p of c.passages) {
  require(divisions.has(p.divisionId) && p.sentences.length, `passage ${p.id}`); url(p.referenceUrl);
  for (const s of p.sentences) { require(s.id && !sentences.has(s.id) && s.text.trim(), `sentence ${s.id}`); sentences.add(s.id); }
 }
 const targets = new Set<string>();
 for (const a of c.annotations) {
  const p = passages.get(a.target);
  require(p && !targets.has(a.target), `annotation target ${a.target}`); targets.add(a.target);
  require(a.displayLines.join('') === p!.sentences.map(s=>s.text).join(''), `display text differs ${a.target}`);
  for (const id of a.concepts) require(Object.hasOwn(c.concepts,id), `concept ${id}`);
 }
 // Original text remains valid without editorial annotation.
 for (const concept of Object.values(c.concepts)) for (const id of concept.related) require(Object.hasOwn(c.concepts,id), `related concept ${id}`);
 for (const path of c.paths) require(new Set(path.ids).size === path.ids.length && path.ids.every(id=>passages.has(id)), `path ${path.id}`);
}

export const catalog: Catalog = { works, sources, editions, divisions, passages: texts, annotations, concepts, paths };
validateCatalog(catalog);
