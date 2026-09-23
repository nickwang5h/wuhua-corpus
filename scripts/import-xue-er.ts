import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { stageWikisource } from '../src/content/wikisource';
import type { Division, Edition } from '../src/content/schema';

const revision = '2058123';
const editionId = `lunyu-wikisource-${revision}`;
const divisionId = `${editionId}-1`;
const sourceUrl = 'https://zh.wikisource.org/wiki/論語/學而第一';
const labels = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六'];

// Deliberately handles this pinned chapter only, not general MediaWiki syntax.
// Unknown markup, missing sections, or reordered labels fail closed.
export function importXueEr(raw: string) {
 const blocks = [...raw.matchAll(/<onlyinclude>([\s\S]*?)<\/onlyinclude>/g)];
 if (blocks.length !== 1) throw new Error('Expected exactly one text block');
 const pieces = blocks[0][1].trim().split(/<div id="(一之[一二三四五六七八九十]+)" style="background: #d9e3f1">'''\1'''<\/div>/);
 if (pieces[0].trim() || pieces.length !== 33) throw new Error('Expected sixteen labeled sections');
 const variants: { target: string; base: string; note: string; sourceUrl: string }[] = [];
 const passages = labels.map((label,index)=>{
  if (pieces[index*2+1] !== `一之${label}`) throw new Error('Unexpected section order');
  const id = `${divisionId}-${index+1}`;
  const text = pieces[index*2+2].trim()
   .replace(/\{\{(另2?)\|([^{}|]+)\|([^{}|]+)\}\}/g,(_match,kind,base,note)=>{
    variants.push({target:id,base,note:kind==='另'?`一作「${note}」`:note,sourceUrl:`${sourceUrl}?oldid=${revision}`});
    return base;
   })
   .replace(/\[\[詩經\|詩\]\]/g,'詩');
  if (!text || /[{}\[\]<>|\n\r]/.test(text)) throw new Error(`Unrecognized markup in ${id}`);
  return {id,divisionId,locator:`學而 · 1.${index+1}`,text};
 });
 const staged = stageWikisource({
  sourceId:`wikisource-lunyu-xue-er-${revision}`,pageUrl:sourceUrl,revision,edition:null,
  rights:{status:'licensed',license:'CC-BY-SA-4.0',evidenceUrl:sourceUrl,verifiedAt:'2026-09-23'},passages,
 });
 const edition: Edition = {id:editionId,workId:'lunyu',sourceId:staged.source.id,title:'維基文庫《論語·學而第一》（紙本底本未注明）',status:'draft'};
 const division: Division = {id:divisionId,editionId,title:'學而第一',number:1,kind:'sayings'};
 return {
  ...staged,edition,division,variants,
  attribution:{
   title:'論語/學而第一',author:'孔子弟子與再傳弟子；數字整理：維基文庫貢獻者',
   pageUrl:`${sourceUrl}?oldid=${revision}`,
   historyUrl:'https://zh.wikisource.org/w/index.php?title=論語/學而第一&action=history',
   licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',
   changes:'保留正文用字與標點；移除章節標記、導航及錄音資訊；異文模板主讀留在正文、附讀移至 variants；詩經連結轉為顯示文字；未簡繁轉換。',
  },
  review:{
   status:'candidate',retrievedAt:'2026-09-23',
   workRightsEvidence:'https://zh.wikisource.org/wiki/論語',
   note:'作品主頁標示公有領域；本頁頁腳聲明 CC BY-SA 4.0。此候選保守遵循後者，不宣稱數字文本已核驗為公版。紙本底本及標點來源未確定，未經人工對照掃描校勘，不接入正式閱讀目錄。',
  },
 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 const folder = new URL('../content/candidates/lunyu-xue-er/',import.meta.url);
 const raw = await readFile(new URL('source.wikitext',folder),'utf8');
 const candidate = importXueEr(raw);
 await writeFile(new URL('candidate.json',folder),`${JSON.stringify(candidate,null,2)}\n`);
 console.log(`Staged ${candidate.passages.length} passages; active reader unchanged.`);
}
