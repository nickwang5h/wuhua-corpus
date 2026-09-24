import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export type Page = { book: 'zhuangzi' | 'laozi' | 'lunyu'; title: string; revision: number; text: string };
const root = new URL('../', import.meta.url);
const snapshotFile = new URL('sources/wikisource.json', root);

async function query(titles: string[]) {
 const url = new URL('https://zh.wikisource.org/w/api.php');
 url.search = new URLSearchParams({action:'query',format:'json',formatversion:'2',prop:'revisions',titles:titles.join('|'),rvprop:'ids|content',rvslots:'main'}).toString();
 const response = await fetch(url,{signal:AbortSignal.timeout(60000)});
 if (!response.ok) throw new Error(`Wikisource HTTP ${response.status}`);
 const body = await response.json();
 if (!body || typeof body!=='object' || ('error' in body) || !('query' in body) || !body.query || typeof body.query!=='object' || !('pages' in body.query) || !Array.isArray(body.query.pages)) throw new Error('Invalid Wikisource response');
 return body.query.pages as {title:string; revisions?: {revid:number; slots:{main:{content:string}}}[]}[];
}
async function download(): Promise<Page[]> {
 const indexes = await query(['莊子','論語/全覽']);
 const text = (title:string) => indexes.find(p=>p.title===title)?.revisions?.[0].slots.main.content ?? '';
 const requested = [
  ...[...text('莊子').matchAll(/\*\[\[\/([^|]+)\|/g)].map(m=>({book:'zhuangzi' as const,title:`莊子/${m[1]}`})),
  {book:'laozi' as const,title:'道德經 (王弼本)'},
  ...[...text('論語/全覽').matchAll(/\{\{:([^}]+)\}\}/g)].map(m=>({book:'lunyu' as const,title:m[1]})),
 ];
 if (requested.length !== 54) throw new Error('Expected 33 Zhuangzi pages, one Laozi page and 20 Analects pages');
 const pages: Page[] = [];
 for (let i=0;i<requested.length;i+=10) {
  const batch = requested.slice(i,i+10);
  const result = await query(batch.map(p=>p.title));
  for (const request of batch) {
   const revision = result.find(p=>p.title===request.title)?.revisions?.[0];
   if (!revision?.slots.main.content) throw new Error(`Missing ${request.title}`);
   pages.push({...request,revision:revision.revid,text:revision.slots.main.content});
  }
 }
 return pages;
}

// A small converter for the three selected works, not a general MediaWiki engine.
export function cleanText(raw: string): string {
 let text = raw.replace(/<small\b[^>]*>[\s\S]*?<\/small>/gi,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<ref\b[^>]*\/>/gi,'').replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi,'');
 text = text.replace(/-\{([^{}:|]+)\}-/g,'$1')
  .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g,'$2');
 // Process innermost templates first; keep base readings, not tooltip variants.
 while (/\{\{[^{}]*\}\}/.test(text)) {
  text = text.replace(/\{\{([^{}]*)\}\}/g,(_all,body:string)=>{
   const [name,...args] = body.split('|').map(s=>s.trim());
   if (['另','另2','参','!'].includes(name)) return args[0] ?? '';
   if (['*','header','header2','PD-old','先秦作品','莊子注','道德真经注','Textquality','further','Spoken_Wikisource','wikipedia','PD-old-100','footer','Footer','reflist'].includes(name)) return '';
   throw new Error(`Unknown template: ${name}`);
  });
 }
 text = text.replace(/-\{([^{}]+)\}-/g,(_all,body:string)=>{if(body.includes(':')){const match=body.match(/(?:^|;)zh:([^;]+)/);if(!match)throw new Error('Unsupported language variant');return match[1];}if(body.includes('|'))throw new Error('Unsupported language variant');return body;})
  .replace(/\[\[(?:Category|分類|分类|en|fr):[^\]]*\]\]/gi,'')
  .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_all,title,label)=>label??title)
  .replace(/<\/?(?:onlyinclude|noinclude|includeonly|p|br|span)\b[^>]*>/gi,'')
  .replace(/^=+[^\n]*=+\s*$/gm,'')
  .replace(/'{2,3}/g,'').trim();
 const leftover = text.search(/[<>]|\[\[|\]\]|\{\{|\}\}/);
 if (leftover>=0) throw new Error(`Unprocessed markup: ${text.slice(Math.max(0,leftover-30),leftover+130)}`);
 return text;
}

export function convert(pages: Page[]) {
 const books = ['zhuangzi','laozi','lunyu'] as const;
 return books.map(book=>{
  const selected = pages.filter(p=>p.book===book);
  const chapters = selected.flatMap((page,index)=>{
   const source = `https://zh.wikisource.org/wiki/${encodeURIComponent(page.title)}?oldid=${page.revision}`;
   let body = page.text;
   if (book==='lunyu') {
    const included=body.match(/<onlyinclude>([\s\S]*?)<\/onlyinclude>/);
    if(!included)throw new Error(`Missing body: ${page.title}`);
    body=included[1].replace(/<div\b[^>]*>[\s\S]*?<\/div>/g,'');
   }
   if(book==='laozi') {
    const sections=[...body.matchAll(/^==([^=\n]+章)==\s*\n([\s\S]*?)(?=^=|$(?![\s\S]))/gm)];
    return sections.map((section,i)=>({number:i+1,title:section[1],source,paragraphs:[cleanText(section[2].replace(/^:.*$/gm,'').replace(/^=[^\n]*$/gm,'')).replace(/\s+/g,'')]}));
   }
   const cleaned=cleanText(body);
   return [{number:index+1,title:page.title.split('/').at(-1)!,source,paragraphs:cleaned.split(/\n\s*\n/).map(p=>p.replace(/\s+/g,'')).filter(Boolean)}];
  });
  const expected={zhuangzi:33,laozi:81,lunyu:20}[book];
  if(chapters.length!==expected||chapters.some(c=>!c.paragraphs.length||c.paragraphs.some(p=>!p)))throw new Error(`Incomplete ${book}: ${chapters.length} chapters`);
  return {id:book,chapters};
 });
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 const online=process.argv.includes('--download');
 const pages:Page[]=online?await download():JSON.parse(await readFile(snapshotFile,'utf8')).pages;
 if(online){
  // A download is a review candidate, never an overwrite of the active source snapshot.
  const incoming=new URL('content/incoming/',root);await mkdir(incoming,{recursive:true});
  const name=`wikisource-${Date.now()}.json`;
  await writeFile(new URL(name,incoming),JSON.stringify({acquiredAt:new Date().toISOString(),attribution:'中文維基文庫貢獻者',license:'CC-BY-SA-4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',pages},null,2)+'\n',{flag:'wx'});
  console.log(`Downloaded review candidate: content/incoming/${name}. Active sources and IDs are unchanged.`);
  process.exit(0);
 }
 const books=convert(pages);
 await mkdir(new URL('content/incoming/',root),{recursive:true});
 await writeFile(new URL('content/incoming/converted.json',root),JSON.stringify(books,null,2)+'\n');
 console.log(books.map(b=>`${b.id}: ${b.chapters.length} chapters, ${b.chapters.reduce((n,c)=>n+c.paragraphs.length,0)} paragraphs`).join('\n'));
}
