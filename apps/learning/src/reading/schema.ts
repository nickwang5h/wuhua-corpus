import {z} from 'zod';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const version = z.string().regex(/^[1-9]\d*$/);
const text = z.string().trim().min(1);
export const sourceSchema = z.object({
  id, version,
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  label: text.optional(),
}).strict().refine(r => r.end > r.start, 'end must be greater than start');

export const readingSchema = z.object({
  id, version, title: text, summary: text,
  level: z.enum(['starting', 'building']),
  minutes: z.number().int().positive().max(60),
  order: z.number().int().nonnegative(),
  sources: z.record(id, sourceSchema).default({}),
  related: z.array(id).default([]),
  review: z.object({
    status: z.enum(['draft', 'reviewed', 'published', 'withdrawn']),
    author: text,
    reviewer: text.optional(),
    reviewedAt: z.iso.date().optional(),
  }).strict().refine(r => !['reviewed', 'published'].includes(r.status) || !!(r.reviewer && r.reviewedAt),
    'Reviewed content requires reviewer and reviewedAt'),
  references: z.array(z.object({title: text, url: z.url().refine(u => u.startsWith('https://')), note: text.optional()}).strict()).default([]),
}).strict();

/** Article metadata only. The body is MDX; no stages or legacy progress fields. */
export type Reading = z.infer<typeof readingSchema>;
export type SourceRef = z.infer<typeof sourceSchema>;
