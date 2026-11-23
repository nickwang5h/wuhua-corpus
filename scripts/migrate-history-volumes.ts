/**
 * One-off: move src/history.json into volumes.
 *
 *   node --import tsx scripts/migrate-history-volumes.ts
 *
 * The file is moved byte for byte to src/history/0001.json, so Git LFS keeps the object it already
 * has and no new one is uploaded; an empty unreleased.json and src/history/index.ts are written.
 * The merged history must equal the old file, order included. It may be run again when
 * src/history.json comes back (a correction on a branch that still had the single file), as long
 * as src/history/ holds nothing but 0001.json and an empty unreleased.json.
 */
import {existsSync,mkdirSync,readFileSync,renameSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {deepStrictEqual} from 'node:assert/strict';
import {historyDir,indexSource,readHistory,readVolume,OPEN} from './history-store.js';

const single=fileURLToPath(new URL('../src/history.json',import.meta.url));
if(!existsSync(single)){console.log('src/history.json is gone: already migrated');process.exit(0);}
const bytes=readFileSync(single);
if(bytes.subarray(0,40).toString().startsWith('version https://git-lfs'))throw new Error('src/history.json is a Git LFS pointer: run git lfs pull');
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const original=JSON.parse(bytes.toString('utf8'));
deepStrictEqual(Object.keys(original),['records','transitions']);
mkdirSync(historyDir,{recursive:true});
const present=readdirSync(historyDir).filter(n=>n!=='index.ts');
const unexpected=present.filter(n=>n!=='0001.json'&&n!==`${OPEN}.json`);
if(unexpected.length)throw new Error(`src/history/ already holds ${unexpected.join(', ')}: migrate by hand`);
if(present.includes(`${OPEN}.json`)){
 const open=readVolume(OPEN);
 if(open.records.length||open.transitions.length||open.drop)throw new Error(`src/history/${OPEN}.json is not empty: migrate by hand`);
}
renameSync(single,join(historyDir,'0001.json'));
writeFileSync(join(historyDir,`${OPEN}.json`),JSON.stringify({records:[],transitions:[]},null,2)+'\n');
writeFileSync(join(historyDir,'index.ts'),indexSource(['0001',OPEN]));

if(sha(readFileSync(join(historyDir,'0001.json')))!==sha(bytes))throw new Error('0001.json differs from src/history.json');
const merged=readHistory();
deepStrictEqual(merged,original);
if(JSON.stringify(merged)!==JSON.stringify(original))throw new Error('Merged history is out of order');
console.log(`history: ${merged.records.length} records and ${merged.transitions.length} transitions now in src/history/0001.json (sha256 ${sha(bytes).slice(0,12)}…)`);
