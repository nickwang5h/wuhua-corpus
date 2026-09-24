import {readFile} from 'node:fs/promises';
import type {TextBook} from '../packages/content/src/types';
export async function readBook(id:string):Promise<TextBook>{if(!/^[a-z0-9-]+$/.test(id))throw new Error('Invalid book ID');return JSON.parse(await readFile(new URL(`../packages/content/src/books/${id}.json`,import.meta.url),'utf8'));}
