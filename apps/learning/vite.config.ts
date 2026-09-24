import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import mdx from '@mdx-js/rollup';
import {readingContent} from './scripts/reading-plugin';
import {mdxOptions} from './scripts/readings';
const mdxCompiler = mdx(mdxOptions);
export default defineConfig({
 root: fileURLToPath(new URL('.', import.meta.url)),
 publicDir: fileURLToPath(new URL('./public', import.meta.url)),
 plugins: [readingContent(), {
  ...mdxCompiler, enforce:'pre',
  transform(code,id) {
   // MDX's filter strips query strings; metadata modules are already JavaScript.
   if(id.endsWith('?reading-meta'))return null;
   return mdxCompiler.transform(code,id);
  },
 }, react()],
 server: {host:'127.0.0.1',port:4175,strictPort:true},
 preview: {host:'127.0.0.1',port:4175,strictPort:true},
 build: {outDir:fileURLToPath(new URL('./dist',import.meta.url)),emptyOutDir:true},
});
