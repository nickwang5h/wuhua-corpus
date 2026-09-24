import {readFile} from 'node:fs/promises';
import type {Plugin} from 'vite';
import {checkReadings, parseReading, sourceBooks, readingsDirectory} from './readings';
import {stringify} from 'yaml';
import {isReleased} from '../apps/learning/src/reading/release';

/** Metadata-only imports keep MDX bodies lazy; no generated content files. */
export function readingContent(): Plugin {
  let publicBuild = false;
  return {
    name: 'wuhua-reading-content',
    enforce: 'pre',
    configResolved(config) { publicBuild = config.command === 'build'; },
    async buildStart() { await checkReadings(); this.addWatchFile(readingsDirectory); },
    async load(id) {
      if (!id.startsWith(readingsDirectory) || (!id.endsWith('.mdx') && !id.endsWith('.mdx?reading-meta'))) return;
      const metadataOnly = id.endsWith('?reading-meta');
      const path = metadataOnly ? id.slice(0, -'?reading-meta'.length) : id;
      this.addWatchFile(path);
      const metadata = parseReading(await readFile(path, 'utf8'), path, await sourceBooks());
      const withheld = publicBuild && !isReleased(metadata);
      if (metadataOnly) return `export default ${JSON.stringify(withheld ? null : metadata)}`;
      // Validate drafts too, but do not ship their prose in publicly fetchable chunks.
      if (withheld) return `---\n${stringify(metadata)}---\nThis reading is not available.\n`;
    },
    async handleHotUpdate(ctx) {
      if (ctx.file.endsWith('.mdx') || ctx.file.endsWith('learning-release.json')) {
        await checkReadings();
        ctx.server.ws.send({type:'full-reload'});
      }
    },
  };
}
