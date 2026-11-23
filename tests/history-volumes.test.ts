import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {mergeHistory,mergeVolumes,type History,type HistoryVolume} from '../src/history-volumes.js';
import {indexSource,overlay,readHistory,sealHistory,volumeNames,writeHistory} from '../scripts/history-store.js';
import {retainWithdrawals} from '../scripts/corpus-structure.js';
import type {Reference,Transition} from '../src/types.js';

const record=(id:string,version:string):Reference=>({id,version,text:`${id}@${version}`,title:'篇',source:'https://zh.wikisource.org/?oldid=1'});
const revision=(id:string,from:string,to:string):Transition=>({from:{id,version:from},kind:'revision',reason:'訂正',targets:[{id,version:to}]});
// A paragraph taken from `from` to `to`, as content:correct does it, going back included.
function correct(history:History,id:string,from:string,to:string){
 const back=history.transitions.findIndex(t=>t.from.id===id&&t.from.version===to);
 if(back>=0){
  history.transitions.splice(back,1);
  const kept=history.records.findIndex(r=>r.id===id&&r.version===to);
  if(kept>=0)history.records.splice(kept,1);
 }
 if(!history.records.some(r=>r.id===id&&r.version===from))history.records.push(record(id,from));
 history.transitions.push(revision(id,from,to));
}
const sealed=():History=>{const h:History={records:[],transitions:[]};for(let i=0;i<5;i++)correct(h,`p${i}`,'1','2');return h;};

test('volumes merge in order: drops of earlier entries first, then additions',()=>{
 const base:HistoryVolume={records:[record('a','1'),record('b','1')],transitions:[revision('a','1','2'),revision('b','1','2')]};
 const next:HistoryVolume={records:[record('c','1'),record('a','1')],transitions:[revision('c','1','2')],drop:{records:[{id:'a',version:'1'}],transitions:[{id:'a',version:'1'}]}};
 assert.deepEqual(mergeHistory([base,next]),{records:[record('b','1'),record('c','1'),record('a','1')],transitions:[revision('b','1','2'),revision('c','1','2')]});
 assert.throws(()=>mergeVolumes([base,{records:[],transitions:[],drop:{records:[{id:'z',version:'1'}]}}],'records'),/drops records z@1/);
 assert.throws(()=>mergeVolumes([base,{records:[record('a','1')],transitions:[]}],'records'),/adds records a@1 twice/);
});

test('a correction only appends to the open volume',()=>{
 const prior=sealed(),desired=structuredClone(prior);
 correct(desired,'q','1','2');
 assert.deepEqual(overlay(prior,desired),{records:[record('q','1')],transitions:[revision('q','1','2')]});
});

test('going back to a text whose history is sealed drops it by key and leaves the sealed volume alone',()=>{
 const prior=sealed(),desired=structuredClone(prior);
 correct(desired,'p2','2','1');
 const volume=overlay(prior,desired);
 assert.deepEqual(volume,{records:[record('p2','2')],transitions:[revision('p2','2','1')],drop:{records:[{id:'p2',version:'1'}],transitions:[{id:'p2',version:'1'}]}});
 assert.deepEqual(mergeHistory([prior,volume]),desired);
 assert.deepEqual(prior,sealed());
});

test('going back within the open volume needs no drop; going back and forth again drops and re-adds',()=>{
 const prior=sealed();
 const once=structuredClone(prior);correct(once,'q','1','2');correct(once,'q','2','1');
 assert.deepEqual(overlay(prior,once),{records:[record('q','2')],transitions:[revision('q','2','1')]});
 const twice=structuredClone(prior);correct(twice,'p0','2','1');correct(twice,'p0','1','2');
 const volume=overlay(prior,twice);
 assert.deepEqual(volume.drop,{records:[{id:'p0',version:'1'}],transitions:[{id:'p0',version:'1'}]});
 assert.deepEqual(volume.records,[record('p0','1')]);
 assert.deepEqual(mergeHistory([prior,volume]),twice);
});

test('withdrawals only append, also after a sealed correction',()=>{
 const prior=sealed();
 const withdrawn:History={records:[record('p1','1'),record('w','1')],transitions:[{from:{id:'p1',version:'1'},kind:'withdrawn',reason:'撤',targets:[]},{from:{id:'w',version:'1'},kind:'withdrawn',reason:'撤',targets:[]}]};
 prior.records.push(record('p1','2'));
 const desired=retainWithdrawals(prior,withdrawn);
 const volume=overlay(prior,desired);
 assert.equal(volume.drop,undefined);
 assert.deepEqual(volume.records,[record('w','1')]);
 assert.deepEqual(volume.transitions.map(t=>`${t.from.id}@${t.from.version}`),['p1@2','w@1']);
 assert.deepEqual(mergeHistory([prior,volume]),desired);
});

test('random corrections, back and forth, always merge back to the same history',()=>{
 let seed=7;const rand=(n:number)=>(seed=(seed*1103515245+12345)%2147483648)%n;
 for(let round=0;round<50;round++){
  const prior=sealed();
  const versions=new Map(prior.transitions.map(t=>[t.from.id,t.targets[0].version]));
  const desired=structuredClone(prior);
  for(let step=0;step<8;step++){
   const id=`p${rand(7)}`,from=versions.get(id)??'1',to=String(rand(3)+1);
   if(to===from)continue;
   correct(desired,id,from,to);versions.set(id,to);
  }
  const volume=overlay(prior,desired);
  assert.equal(JSON.stringify(mergeHistory([prior,volume])),JSON.stringify(desired));
  // Each step adds at most a record and a transition; what the sealed volume keeps is never copied.
  assert.ok(volume.records.length+volume.transitions.length<=16);
 }
});

test('writing touches only unreleased.json; sealing names it after the release',()=>{
 const dir=mkdtempSync(join(tmpdir(),'history-'));
 const releases=join(dir,'releases');mkdirSync(releases);
 const base=sealed();
 writeFileSync(join(dir,'0001.json'),JSON.stringify(base,null,2)+'\n');
 writeFileSync(join(dir,'unreleased.json'),JSON.stringify({records:[],transitions:[]},null,2)+'\n');
 writeFileSync(join(dir,'index.ts'),indexSource(['0001','unreleased']));
 const frozen=readFileSync(join(dir,'0001.json'));
 assert.equal(sealHistory('r1',dir,releases),undefined);
 const history=readHistory(dir);
 correct(history,'p3','2','1');correct(history,'q','1','2');
 writeHistory(history,dir);
 assert.deepEqual(readFileSync(join(dir,'0001.json')),frozen);
 assert.deepEqual(readHistory(dir),history);
 mkdirSync(join(releases,'r0'));
 assert.throws(()=>sealHistory('r0',dir,releases),/bump contentRelease/);
 assert.throws(()=>sealHistory('0001',dir,releases),/bump contentRelease/);
 assert.equal(sealHistory('r1',dir,releases),'r1');
 assert.deepEqual(volumeNames(dir),['0001','r1','unreleased']);
 assert.deepEqual(readHistory(dir),history);
 assert.deepEqual(JSON.parse(readFileSync(join(dir,'unreleased.json'),'utf8')),{records:[],transitions:[]});
 // The next release goes back on the correction sealed in r1: both sealed volumes stay as they are.
 const r1=readFileSync(join(dir,'r1.json'));
 const later=readHistory(dir);correct(later,'q','2','1');
 writeHistory(later,dir);
 assert.deepEqual(readFileSync(join(dir,'0001.json')),frozen);
 assert.deepEqual(readFileSync(join(dir,'r1.json')),r1);
 assert.deepEqual(readHistory(dir),later);
 assert.deepEqual(JSON.parse(readFileSync(join(dir,'unreleased.json'),'utf8')).drop,{records:[{id:'q',version:'1'}],transitions:[{id:'q',version:'1'}]});
 assert.ok(!existsSync(join(dir,'r0.json')));
});
