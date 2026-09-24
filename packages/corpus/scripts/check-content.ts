import {editorialAids} from '../src/editorial';
import {readFile} from 'node:fs/promises';
import {readBook} from './read-book';
import {manifest,historicalReferences,transitions} from '../src';
import {pinyinAids} from '../src/pinyin';
import {validateBooks,validateHistory,validateAids} from '../src/validate';
import {convert} from './import-wikisource';
const books=await Promise.all(manifest.map(b=>readBook(b.id)));
for(const a of editorialAids){const p=books.flatMap(b=>b.chapters.flatMap(c=>c.paragraphs)).find(p=>p.id===a.target);if(!p||p.version!==a.version||a.review.textVersion!==p.version||!a.rights.author||!a.rights.license||!a.text||!Number.isInteger(a.start)||!Number.isInteger(a.end)||a.start!<0||a.end!<=a.start!||a.end!>Array.from(p.text).length)throw new Error(`Invalid editorial aid ${a.id}`);}
validateBooks(books);validateAids([...editorialAids,...pinyinAids],books);
validateHistory(historicalReferences,transitions,books.flatMap(b=>b.chapters.flatMap(c=>c.paragraphs.map(p=>({...p,title:c.title,source:c.source})))));
const snapshot=JSON.parse(await readFile(new URL('../sources/wikisource.json',import.meta.url),'utf8'));
if(!snapshot.license||!snapshot.licenseUrl||!snapshot.attribution)throw new Error('Missing source rights');
const imported=convert(snapshot.pages);
for(const b of books){const m=manifest.find(m=>m.id===b.id)!;if(JSON.stringify(m.chapters)!==JSON.stringify(b.chapters.map(({id,number,title,source})=>({id,number,title,source}))))throw new Error(`Stale manifest ${b.id}`);const source=imported.find(x=>x.id===b.id);if(!source)throw new Error('Source book missing');for(const c of b.chapters){const original=source.chapters.find(x=>x.source===c.source&&x.number===c.number);if(!original)throw new Error(`Missing pinned chapter ${c.id}`);for(const p of c.paragraphs){if(p.sourceText!==undefined&&p.sourceText!==p.text){if(!p.correction?.reason||!['reviewed','published'].includes(p.correction.review.status)||!p.correction.review.reviewer||!p.correction.review.reviewedAt||p.correction.review.textVersion!==p.version||!historicalReferences.some(r=>r.id===p.id&&r.version!==p.version))throw new Error(`Correction needs reviewed provenance and retained history ${p.id}`);}}if(c.paragraphs.map(p=>p.sourceText??p.text).join('')!==original.paragraphs.join(''))throw new Error(`Text differs from pinned source ${c.id}; record a corrected text revision and review before replacing it`);}}
console.log('Corpus contracts pass; editorial review remains separate.');
