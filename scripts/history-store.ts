/**
 * Reading and writing the history volumes in src/history/. The volumes are listed, oldest first,
 * by the imports of src/history/index.ts. Every volume but unreleased.json is sealed: it shipped in
 * a release and is never rewritten. Scripts read the merged history, change it as they always did,
 * and hand it back: only unreleased.json is written, holding what is new since the sealed volumes
 * and dropping, by key, whatever of theirs is no longer history.
 */
import {existsSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {historyKey,mergeHistory,type History,type HistoryKey,type HistoryVolume} from '../src/history-volumes.js';

export const historyDir=fileURLToPath(new URL('../src/history/',import.meta.url));
export const OPEN='unreleased';
const empty=():HistoryVolume=>({records:[],transitions:[]});
const format=(volume:HistoryVolume)=>JSON.stringify(volume,null,2)+'\n';
const identifier=(name:string)=>`v${name.replace(/-/g,'_')}`;

export function volumeNames(dir=historyDir){
 const names=[...readFileSync(join(dir,'index.ts'),'utf8').matchAll(/^import \w+ from '\.\/([0-9a-z-]+)\.json'/gm)].map(m=>m[1]);
 if(names.at(-1)!==OPEN||names.indexOf(OPEN)!==names.length-1)throw new Error(`src/history/index.ts must list ${OPEN}.json last`);
 return names;
}
export function readVolume(name:string,dir=historyDir):HistoryVolume{
 const text=readFileSync(join(dir,`${name}.json`),'utf8');
 if(text.startsWith('version https://git-lfs'))throw new Error(`src/history/${name}.json is a Git LFS pointer: run git lfs pull`);
 return JSON.parse(text);
}
export function readHistory(dir=historyDir):History{
 return mergeHistory(volumeNames(dir).map(name=>readVolume(name,dir)));
}
export function indexSource(names:string[]){
 return `// The history volumes, oldest first. Every volume but ${OPEN}.json is sealed and never rewritten;\n`+
  `// \`npm run history:seal\` (part of \`npm run release\`) names ${OPEN}.json after the release and adds it here.\n`+
  `import type {HistoryVolume} from '../history-volumes.js';\n`+
  names.map(name=>`import ${identifier(name)} from './${name}.json' with {type:'json'};\n`).join('')+
  `export const volumes=[${names.map(identifier).join(',')}] as unknown as HistoryVolume[];\n`;
}

/**
 * The volume that, applied after `prior`, gives exactly `desired`, order included. Entries of
 * `prior` that `desired` keeps in place stay where they are; any other entry of `prior` is dropped,
 * and what follows the kept ones is appended. Corrections and structure edits only append and
 * remove, so the volume holds just their change.
 */
export function overlay(prior:History,desired:History):HistoryVolume{
 const volume=empty();
 const drop:{records:HistoryKey[];transitions:HistoryKey[]}={records:[],transitions:[]};
 for(const kind of ['records','transitions'] as const){
  const before=prior[kind] as (History[typeof kind][number])[],after=desired[kind] as (History[typeof kind][number])[];
  let i=0;
  for(const entry of before){
   const next=after[i];
   if(next!==undefined&&historyKey(kind,next)===historyKey(kind,entry)&&JSON.stringify(next)===JSON.stringify(entry)){i++;continue;}
   const {id,version}=kind==='records'?entry as History['records'][number]:(entry as History['transitions'][number]).from;
   drop[kind].push({id,version});
  }
  (volume[kind] as unknown[]).push(...after.slice(i).map(x=>structuredClone(x)));
 }
 if(drop.records.length||drop.transitions.length)volume.drop=Object.fromEntries(Object.entries(drop).filter(([,keys])=>keys.length));
 return volume;
}

// Write `desired` as the merged history: only unreleased.json changes.
export function writeHistory(desired:History,dir=historyDir){
 const names=volumeNames(dir);
 const prior=mergeHistory(names.slice(0,-1).map(name=>readVolume(name,dir)));
 const volume=overlay(prior,desired);
 const merged=mergeHistory([prior,volume]);
 if(JSON.stringify(merged)!==JSON.stringify({records:desired.records,transitions:desired.transitions}))throw new Error('History volume does not reproduce the history');
 const file=join(dir,`${OPEN}.json`),text=format(volume);
 if(readFileSync(file,'utf8')!==text)writeFileSync(file,text);
 const dropped=(volume.drop?.records?.length??0)+(volume.drop?.transitions?.length??0);
 console.log(`history: ${OPEN}.json holds ${volume.records.length} records, ${volume.transitions.length} transitions${dropped?`, drops ${dropped} sealed entries`:''}`);
 return volume;
}

/**
 * Seal unreleased.json as `<release>.json` and open an empty one. Nothing happens when it is
 * empty. A release name already used by a volume or a generated release is refused: contentRelease
 * has not been bumped.
 */
export function sealHistory(release:string,dir=historyDir,releases=fileURLToPath(new URL('../releases/',import.meta.url))){
 if(!/^[0-9a-z][0-9a-z-]*$/.test(release)||release===OPEN)throw new Error(`Invalid release name ${release}`);
 const names=volumeNames(dir);
 const open=readVolume(OPEN,dir);
 if(!open.records.length&&!open.transitions.length&&!open.drop)return console.log('history: nothing to seal'),undefined;
 if(names.includes(release)||existsSync(join(dir,`${release}.json`)))throw new Error(`src/history/${release}.json already exists: bump contentRelease first`);
 if(existsSync(join(releases,release)))throw new Error(`releases/${release} already exists: bump contentRelease first`);
 const before=JSON.stringify(readHistory(dir));
 renameSync(join(dir,`${OPEN}.json`),join(dir,`${release}.json`));
 writeFileSync(join(dir,`${OPEN}.json`),format(empty()));
 writeFileSync(join(dir,'index.ts'),indexSource([...names.slice(0,-1),release,OPEN]));
 if(JSON.stringify(readHistory(dir))!==before)throw new Error('Sealing changed the history');
 console.log(`history: sealed src/history/${release}.json`);
 return release;
}

// Sealed volumes already committed must match HEAD byte for byte (Git LFS compares by pointer).
export function checkSealed(dir=historyDir){
 const sealed=volumeNames(dir).slice(0,-1).map(name=>join(dir,`${name}.json`));
 const tracked=spawnSync('git',['ls-files','--',...sealed],{cwd:dir,encoding:'utf8'});
 if(tracked.status!==0)return;
 const files=tracked.stdout.split('\n').filter(Boolean);
 if(!files.length)return;
 const diff=spawnSync('git',['diff','--name-only','HEAD','--',...files],{cwd:dir,encoding:'utf8'});
 if(diff.status!==0)throw new Error(diff.stderr);
 if(diff.stdout.trim())throw new Error(`Sealed history volumes were rewritten: ${diff.stdout.trim().split('\n').join(', ')}`);
}
