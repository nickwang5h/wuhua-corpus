import type {ComponentType} from 'react';
import type {MDXProps} from 'mdx/types';
import type {Reading} from './schema';
import {isReleased} from './release';

const metadata = import.meta.glob<Reading | null>('../../content/learning/*.mdx', {
  eager: true, query: '?reading-meta', import: 'default',
});
const bodies = import.meta.glob<{default: ComponentType<MDXProps>}>('../../content/learning/*.mdx');
export type RegisteredReading = Reading & {load: () => Promise<{default: ComponentType<MDXProps>}>};
export const readings: RegisteredReading[] = Object.entries(metadata)
  .flatMap(([path, data]) => data ? [{...data, load: bodies[path]}] : [])
  .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
export const preview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === '1';
export const availableReadings = readings.filter(r => r.review.status !== 'withdrawn' && (preview || isReleased(r)));
