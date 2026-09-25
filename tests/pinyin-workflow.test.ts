import test from 'node:test';
import assert from 'node:assert/strict';
import {generatePinyin,generatePinyinCandidate} from '../src/pinyin-generator';
import {preparePinyin,applyPinyin} from '../src/pinyin-workflow';
import {alignPhrase,alignReference,alignExcerpt,slicePinyin,selectPinyinAid} from '../src/pinyin-core';
import {validateAids} from '../src/validate';
import type {Aid,Reference,TextBook} from '../src/types';
const ref:Reference={id:'p-test',version:'1',text:'😀不亦說乎？銀行。',title:'Test',source:'https://example.org/source'};
const request={target:ref.id,version:ref.version,start:1,end:5};
const accept={author:'Test author',note:'Fixture readings independently checked.'};
const book:TextBook={id:'test',chapters:[{id:'chapter-test',number:1,title:'Test',source:ref.source,paragraphs:[{id:ref.id,version:ref.version,text:ref.text,aliases:[]}]}]};

test('generation preserves dictionary tones, light syllables and context in both scripts',async()=>{
 for(const text of ['学而时习之，不亦说乎？','學而時習之，不亦說乎？'])assert.equal(await generatePinyin(text),'xué ér shí xí zhī bù yì yuè hū');
 assert.equal(await generatePinyin('莫見乎隱'),'mò xiàn hū yǐn');
 assert.equal(await generatePinyin('朝三暮四'),'zhāo sān mù sì');
 assert.equal(await generatePinyin('君子喻於義'),'jūn zǐ yù yú yì');
 assert.equal(await generatePinyin('处众人之所恶，故几于道。'),'chǔ zhòng rén zhī suǒ wù gù jī yú dào');
 assert.equal(await generatePinyin('她笑得很自然。'),'tā xiào de hěn zì ran');
 assert.equal(await generatePinyin('你好，不是，一个。'),'nǐ hǎo bù shì yī gè');
 assert.equal(await generatePinyin('银行行走，音乐快乐。'),'yín háng xíng zǒu yīn yuè kuài lè');
 assert.equal(await generatePinyin('喜欢朋友，谢谢。'),'xǐ huān péng you xiè xie');
});
test('an unknown Han character cannot shift the following syllables',async()=>{
 const result=generatePinyinCandidate('😀你𠮷好 abc，行走');
 assert.ok(result.issues.some(i=>i.kind==='unknown'&&i.start===2));
 assert.deepEqual(result.tokens.find(t=>t.start===3),{start:3,end:4,text:'好',pinyin:'hǎo'});
 assert.equal(result.tokens.find(t=>t.text==='走')?.pinyin,'zǒu');
 await assert.rejects(generatePinyin('你𠮷好'));
});
test('conflicting phrase rules are visible and cannot silently choose a reading',()=>{
 const result=generatePinyinCandidate('銀行',[{text:'銀行',pinyin:'yín háng',source:'test'},{text:'银行',pinyin:'yín xíng',source:'test'}]);
 assert.ok(result.issues.some(i=>i.kind==='rule-conflict'&&i.start===1));
});
test('prepare uses whole-paragraph context while retaining absolute code points',()=>{
 const r=preparePinyin(ref,{target:ref.id,version:'1',start:7,end:8},[]);
 assert.deepEqual(r.tokens,[{start:7,end:8,text:'行',pinyin:'háng'}]);
 assert.equal(r.context,ref.text);
});
test('applying reviewed candidates is additive and idempotent',()=>{
 const candidate=preparePinyin(ref,request,[]);
 assert.throws(()=>applyPinyin(ref,candidate,[]),/editorial decision/);
 candidate.decision=accept;const aids=applyPinyin(ref,candidate,[]);
 validateAids(aids,[book]);
 assert.deepEqual(applyPinyin(ref,candidate,aids),aids);
 const before=structuredClone(aids);
 const more=preparePinyin(ref,{...request,end:8},aids);more.decision=accept;
 const extended=applyPinyin(ref,more,aids);
 assert.equal(extended[0].id,aids[0].id);
 assert.deepEqual(extended[0].tokens?.slice(0,4),aids[0].tokens);
 assert.deepEqual(aids,before);
});
test('stale versions, edited context and old pronunciation replacement are rejected',()=>{
 assert.throws(()=>preparePinyin(ref,{...request,version:'2'},[]),/stale/);
 const c=preparePinyin(ref,request,[]);c.decision=accept;
 assert.throws(()=>applyPinyin({...ref,text:ref.text.replace('？','！')},c,[]),/context changed/);
 const aids=applyPinyin(ref,c,[]);const next=preparePinyin(ref,{...request,end:8},aids);next.decision=accept;
 next.tokens.find(t=>t.text==='說')!.pinyin='shuō';
 assert.throws(()=>applyPinyin(ref,next,aids),/overwrite/);
});
test('overlapping active candidates and invalid tokens fail shared validation',()=>{
 const c=preparePinyin(ref,request,[]);c.decision=accept;const [aid]=applyPinyin(ref,c,[]);
 assert.throws(()=>validateAids([aid,{...aid,id:'conflict'}],[book]),/Overlapping/);
 assert.equal(selectPinyinAid({...ref,start:1,end:5,text:'不亦說乎'},[aid,{...aid,id:'conflict'}]).aid,undefined);
 assert.throws(()=>validateAids([{...aid,tokens:[{start:1,end:3,text:'不亦',pinyin:'bù yì'}]}],[book]),/alignment/);
 const bad={...aid,tokens:aid.tokens!.map((t,i)=>i===0?{...t,text:'错'}:t)};
 assert.equal(alignReference(ref,ref.text,bad,true).status,'invalid');
});
test('display conversion and repeated excerpts retain positions or fail explicitly',()=>{
 const a=alignPhrase('銀行，銀行。','yín háng yín háng','银行，银行。');
 assert.equal(slicePinyin(a,1,2).cells[0].pinyin,'háng');
 assert.equal(alignExcerpt(a,'银行').status,'unalignable');
 assert.deepEqual(alignExcerpt(a,'银行。').cells.filter(c=>c.pinyin).map(c=>c.position),[3,4]);
 assert.equal(alignPhrase('銀行','yín háng','银').status,'unalignable');
});
