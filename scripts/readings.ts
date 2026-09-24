import {readFile, readdir} from 'node:fs/promises';
import {basename, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'yaml';
import {compile, type CompileOptions} from '@mdx-js/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import type {Root} from 'mdast';
import type {VFile} from 'vfile';
import {readingSchema, type Reading} from '../apps/learning/src/reading/schema';
import {manifest, findReference} from '../packages/content/src';
import type {TextBook} from '../packages/content/src/types';
import {readBook} from './read-book';
import release from '../packages/content/src/learning-release.json';

export const readingsDirectory = fileURLToPath(new URL('../content/learning/', import.meta.url));
export async function sourceBooks() { return Promise.all(manifest.map(b => readBook(b.id))); }

export function parseReading(source: string, filename: string, books: TextBook[]): Reading {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
  if (!match) throw new Error(`${filename}: missing frontmatter`);
  let reading: Reading;
  try { reading = readingSchema.parse(parse(match[1], {uniqueKeys: true})); }
  catch (error) { throw new Error(`${filename}: ${String(error)}`); }
  if (basename(filename, '.mdx') !== reading.id) throw new Error(`${filename}: filename must match id ${reading.id}`);
  for (const [name, ref] of Object.entries(reading.sources)) {
    const found = books.map(b => findReference(b, ref.id)).find(Boolean);
    if (!found || found.ref.version !== ref.version || ref.end > Array.from(found.ref.text).length)
      throw new Error(`${filename}: invalid source ${name} (identity, version or code-point range)`);
  }
  return reading;
}

// Inspect authored syntax, never evaluate article JavaScript during validation.
export function readingSyntax() {
  return (tree: Root, file: VFile) => {
    const frontmatter = tree.children.find(n => n.type === 'yaml');
    const meta = readingSchema.parse(parse(frontmatter && 'value' in frontmatter ? frontmatter.value : ''));
    if (!tree.children.some(n => n.type !== 'yaml')) throw new Error(`${file.path}: Reading body is empty`);
    function visit(node: Record<string, unknown>) {
      if (['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression'].includes(String(node.type)))
        throw new Error(`${file.path}: write prose and registered components; article scripts are not supported`);
      if (node.type === 'heading' && node.depth === 1) throw new Error(`${file.path}: the layout owns h1; start body headings at ##`);
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        const name = String(node.name);
        if (node.type === 'mdxJsxTextElement') throw new Error(`${file.path}: place ${name} on its own paragraph`);
        if (!['Phrase', 'ClassicQuote'].includes(name)) throw new Error(`${file.path}: unknown component ${name}`);
        const attrs: Record<string, string> = {};
        for (const a of node.attributes as {type:string;name:string;value:unknown}[]) {
          if (a.type !== 'mdxJsxAttribute' || typeof a.value !== 'string' || Object.hasOwn(attrs, a.name))
            throw new Error(`${file.path}: ${name} attributes must be unique literal strings`);
          attrs[a.name] = a.value;
        }
        const expected = name === 'Phrase' ? ['chinese', 'pinyin', 'gloss'] : ['source'];
        if (Object.keys(attrs).some(k => !expected.includes(k)) || expected.some(k => !attrs[k]?.trim()))
          throw new Error(`${file.path}: ${name} requires ${expected.join(', ')}`);
        if (name === 'ClassicQuote' && !Object.hasOwn(meta.sources, attrs.source))
          throw new Error(`${file.path}: ClassicQuote source ${attrs.source} is not declared`);
        if ((node.children as unknown[])?.length) throw new Error(`${file.path}: ${name} has no authored children`);
      }
      if ((node.type === 'link' || node.type === 'definition') && typeof node.url === 'string' && !/^(https:\/\/|#)/.test(node.url))
        throw new Error(`${file.path}: links must use HTTPS or an in-page anchor`);
      for (const child of (node.children as Record<string, unknown>[] | undefined) || []) visit(child);
    }
    visit(tree as unknown as Record<string, unknown>);
  };
}
export const mdxOptions: CompileOptions = {remarkPlugins: [remarkFrontmatter, readingSyntax]};

export function validateRegistry(readings: Reading[], releases: {id:string;version:string}[] = release) {
  const ids = new Set<string>();
  for (const r of readings) {
    if (ids.has(r.id)) throw new Error(`Duplicate Reading id ${r.id}`);
    ids.add(r.id);
  }
  for (const r of readings) {
    if (new Set(r.related).size !== r.related.length || r.related.some(id => id === r.id || !ids.has(id)))
      throw new Error(`Invalid related reading in ${r.id}`);
  }
  const released = new Set<string>();
  for (const entry of releases) {
    const key = `${entry.id}@${entry.version}`;
    if (released.has(key) || !readings.some(r => r.id === entry.id && r.version === entry.version && r.review.status !== 'withdrawn'))
      throw new Error(`Invalid Reading release ${key}`);
    released.add(key);
  }
}

export async function checkReadings(directory = readingsDirectory, releases = release) {
  const books = await sourceBooks();
  const readings: Reading[] = [];
  for (const filename of (await readdir(directory)).filter(f => f.endsWith('.mdx')).sort()) {
    const path = join(directory, filename), source = await readFile(path, 'utf8');
    readings.push(parseReading(source, filename, books));
    await compile({value:source, path}, mdxOptions);
  }
  validateRegistry(readings, releases);
  return readings.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
