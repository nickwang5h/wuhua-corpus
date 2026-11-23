/**
 * Seal src/history/unreleased.json as the volume of the release in src/index.ts:
 *
 *   npm run history:seal
 *
 * `npm run release` runs it before building. Nothing happens when unreleased.json is empty.
 */
import {readFileSync} from 'node:fs';
import {sealHistory} from './history-store.js';

const release=/export const contentRelease = '([^']+)'/.exec(readFileSync(new URL('../src/index.ts',import.meta.url),'utf8'))?.[1];
if(!release)throw new Error('contentRelease not found in src/index.ts');
sealHistory(release);
