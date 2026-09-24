import {readFile} from 'node:fs/promises';
import type {TextBook} from '../src/types.js';
export async function readBook(id:string):Promise<TextBook>{if(!/^[a-z0-9-]+$/.test(id))throw new Error('Invalid book ID');return JSON.parse(await readFile(new URL(`../src/books/${id}.json`,import.meta.url),'utf8'));}
