import {cp} from 'node:fs/promises';
await cp(new URL('../src/books',import.meta.url),new URL('../lib/src/books',import.meta.url),{recursive:true});

await cp(new URL('../src/assets',import.meta.url),new URL('../lib/src/assets',import.meta.url),{recursive:true});
