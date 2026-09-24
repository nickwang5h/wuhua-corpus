import type {Entry} from '../../../../packages/ui/data';
/** Read-only bridge: old unit records retain all fields and remain exportable. */
export function recordReadingId(entry: Entry): string | undefined {
  return entry.ref?.id.startsWith('reading:') ? entry.ref.id.slice('reading:'.length) : entry.unitId;
}
export function legacyProgressCount(records: Entry[]) { return records.filter(r => r.kind === 'progress').length; }
export function routeReadingId(page: string | undefined,id: string | undefined) {
  return page === 'reading' || page === 'unit' ? id : undefined;
}
