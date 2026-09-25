import {pinyin,polyphonic} from 'pinyin-pro';
import {Converter} from 'opencc-js/t2cn';
import {alignPhrase,isHan,pinyinSyllables} from './pinyin-core.js';
import type {PinyinToken} from './types.js';

/** Fixed engine and editorial rules; generated readings remain candidates. */
export const generatorVersion={engine:'pinyin-pro@3.29.4',normalizer:'opencc-js@1.4.2',rules:'1',tones:'dictionary'} as const;
export type PronunciationRule={text:string;pinyin:string;source:string};
const analects='https://dict.mini.moe.edu.tw/SearchIndex/word_detail?wordID=D0001117';
const mean='https://raw.githubusercontent.com/Guopop/chinese-philosophy/8619f79cb168d8c6ad852f2ac4bec877665f4fed/%E7%BB%8F/%E5%9B%9B%E4%B9%A6%E7%B1%BB/%E5%9B%9B%E4%B9%A6%E7%AB%A0%E5%8F%A5%E9%9B%86%E6%B3%A8.json';
const laozi='https://zh.wikisource.org/wiki/道德經_(王弼本)?oldid=2354026';
// Phrase rules never change the default reading of an isolated character.
export const pronunciationRules:readonly PronunciationRule[]=[
 {text:'不亦说乎',pinyin:'bù yì yuè hū',source:analects},
 {text:'莫见乎隐',pinyin:'mò xiàn hū yǐn',source:mean},
 {text:'朝三暮四',pinyin:'zhāo sān mù sì',source:'https://dict.idioms.moe.edu.tw/idiomView.jsp?ID=6&webMd=2'},
 {text:'朝三而暮四',pinyin:'zhāo sān ér mù sì',source:'https://zh.wikisource.org/wiki/莊子/齊物論?oldid=9852855'},
 {text:'朝四而暮三',pinyin:'zhāo sì ér mù sān',source:'https://zh.wikisource.org/wiki/莊子/齊物論?oldid=9852855'},
 {text:'处众人之所恶',pinyin:'chǔ zhòng rén zhī suǒ wù',source:laozi},
 {text:'故几于道',pinyin:'gù jī yú dào',source:laozi},
 {text:'觉得',pinyin:'jué de',source:'https://dict.concised.moe.edu.tw/dictView.jsp?ID=24188&la=0&powerMode=0'},
 {text:'当众',pinyin:'dāng zhòng',source:'https://dict.concised.moe.edu.tw/dictView.jsp?ID=8052&la=0&powerMode=0'},
 {text:'谢谢',pinyin:'xiè xie',source:'https://dict.revised.moe.edu.tw/dictView.jsp?ID=106288&la=1&powerMode=0'},
 {text:'朋友',pinyin:'péng you',source:'https://www.trainchinese.com/v2/wordDetails.php?rAp=0&tcLanguage=en&wordId=360'},
 {text:'喜欢',pinyin:'xǐ huān',source:'https://dict.concised.moe.edu.tw/dictView.jsp?ID=26428'},
 {text:'的时候',pinyin:'de shí hou',source:'https://dict.cn/时候'},
 {text:'学过的东西',pinyin:'xué guò de dōng xi',source:'https://teric.naer.edu.tw/wSite/PDFReader?fileName=1611004814880&format=pdf&xmlId='},
 {text:'笑得很自然',pinyin:'xiào de hěn zì ran',source:'https://dict.revised.moe.edu.tw/dictView.jsp?ID=137901&la=0&powerMode=0'},
];
export type PinyinIssue={kind:'polyphonic'|'unknown'|'rule-conflict'|'existing-difference';start:number;text:string;candidates:string[];proposed?:string;existing?:string};
export type PinyinCandidate={tokens:PinyinToken[];issues:PinyinIssue[];generator:typeof generatorVersion};
const simplify:(text:string)=>string=Converter({from:'tw',to:'cn'});

export function generatePinyinCandidate(text:string,rules:readonly PronunciationRule[]=pronunciationRules):PinyinCandidate {
 const original=Array.from(text),normalized=Array.from(simplify(text));
 if(original.length!==normalized.length||original.some((c,i)=>isHan(c)!==isHan(normalized[i])))throw new Error('Normalization changed source positions');
 const converted=pinyin(normalized.join(''),{type:'all',toneType:'symbol',toneSandhi:false});
 if(converted.length!==normalized.length||converted.some((entry,i)=>entry.origin!==normalized[i]))throw new Error('Engine changed source positions');
 const readings=new Map(converted.map((entry,i)=>[i,entry.pinyin]));
 const overrides=new Map<number,Set<string>>();
 for(const rule of rules){
  const chars=Array.from(simplify(rule.text));
  if(!rule.source||!chars.length||alignPhrase(rule.text,rule.pinyin).status!=='complete')throw new Error(`Invalid pronunciation rule: ${rule.text}`);
  const values=pinyinSyllables(rule.pinyin)!;
  for(let at=0;at+chars.length<=normalized.length;at++)if(chars.every((c,i)=>c===normalized[at+i])){
   let n=0;chars.forEach((c,i)=>{if(isHan(c)){const choices=overrides.get(at+i)??new Set<string>();choices.add(values[n++]);overrides.set(at+i,choices);}});
  }
 }
 const tokens:PinyinToken[]=[],issues:PinyinIssue[]=[];
 for(const [at,char]of original.entries()){
  if(!isHan(char))continue;
  const choices=overrides.get(at);let value=readings.get(at);
  if(choices?.size===1)value=[...choices][0];
  if(choices&&choices.size>1)issues.push({kind:'rule-conflict',start:at,text:char,candidates:[...choices]});
  if(!value||pinyinSyllables(value)?.length!==1||pinyinSyllables(value)?.[0]!==value){issues.push({kind:'unknown',start:at,text:char,candidates:[]});continue;}
  tokens.push({start:at,end:at+1,text:char,pinyin:value});
  const variants=[...new Set([char,normalized[at]].flatMap(c=>polyphonic(c,{type:'array',toneType:'symbol',nonZh:'removed'})[0]??[]))].filter(s=>pinyinSyllables(s)?.length===1);
  if(variants.length>1&&!choices)issues.push({kind:'polyphonic',start:at,text:char,candidates:variants,proposed:value});
 }
 return {tokens,issues,generator:generatorVersion};
}

export async function generatePinyin(text:string):Promise<string>{
 const candidate=generatePinyinCandidate(text);
 const result=candidate.tokens.map(t=>t.pinyin).join(' ');
 if(candidate.issues.some(x=>x.kind==='unknown'||x.kind==='rule-conflict')||alignPhrase(text,result).status!=='complete')throw new Error('Pinyin could not be aligned with this text.');
 return result;
}
