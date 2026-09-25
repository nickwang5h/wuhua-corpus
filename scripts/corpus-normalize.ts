import {parseFragment} from 'parse5';
import type {DefaultTreeAdapterMap} from 'parse5';
type Node = DefaultTreeAdapterMap['node'];
export type Block = {text:string; headingPath:string[]; role?:'source-commentary'};
export const normalize = (text:string) => text.normalize('NFC').replace(/[\u200b\ufeff]/g,'').replace(/\s+/gu,' ').trim();
const attr=(n:Node,key:string)=> 'attrs' in n ? n.attrs.find(a=>a.name===key)?.value??'' : '';
const children=(n:Node):Node[]=>'childNodes' in n?n.childNodes:[];
const plain=(n:Node):string=>'value' in n?n.value:children(n).map(plain).join('');
const skipClasses=/^(?:mw-editsection|mw-empty-elt|mw-indicators|noprint|navbox|vertical-navbox|catlinks|ws-noexport|ws-noinclude|licenseContainer|licensetpl|reference|references|reflist|header|ws-header|ws-footer|wst-header|wst-footer|header-container|headerTemplate|headertemplate|sisitem|sistersitebox|thumb|thumbinner|pagenum|wst-pagenum|mw-cite-backlink|toc|printfooter|authority-control)$/i;
export function normalizeHtml(html:string):Block[]{
 const tree=parseFragment(html); const blocks:Block[]=[];let buffer='';const headings:string[]=[];
 const flush=()=>{const text=normalize(buffer);buffer='';if(text)blocks.push({text,headingPath:headings.filter(Boolean).slice()});};
 function walk(n:Node){
  if('value' in n){buffer+=n.value;return;}
  if(!('tagName' in n)){for(const c of children(n))walk(c);return;}
  const tag=n.tagName;
  if(['script','style','noscript','nav','figure','img','math','audio','video','rt','rp'].includes(tag)||attr(n,'class').split(/\s+/).some(c=>skipClasses.test(c))||/^(?:header|footer|toc|catlinks|license|ws-data)/i.test(attr(n,'id'))||attr(n,'role')==='navigation')return;
  if(/^h[1-6]$/.test(tag)){flush();const level=Number(tag[1])-1;headings.length=level;headings[level]=normalize(plain(n).replace(/\[編輯\]|\[编辑\]/g,''));return;}
  if(tag==='br'){flush();return;}
  const block=['p','div','li','dd','dt','tr','blockquote','pre','ul','ol','dl','table'].includes(tag);
  if(block)flush();if(tag==='td'||tag==='th')buffer+=' ';
  for(const c of children(n))walk(c);
  if(block)flush();
 }
 walk(tree);flush();return blocks;
}
export function residue(text:string):string[]{
 const warnings:string[]=[];
 if(/\{\{|\}\}|\[\[|\]\]|<\/?(?:ref|div|span)\b|Template:|模板:|Category:|分類:|分类:|Lua错误|Lua 錯誤|腳本錯誤|脚本错误/.test(text))warnings.push('markup-residue');
 if(/^[◄►]/.test(text))warnings.push('ui-residue');
 if(/維基文庫|维基文库|此作品在|本作品在|維基文庫，自由的圖書館|维基文库，自由的图书馆|本页最后|本頁最後|自由的圖書館|Creative Commons/.test(text))warnings.push('ui-residue');
 if(/参考文献|參考文獻|本文旨在|本文即从|本文即從/.test(text))warnings.push('modern-editorial-appendix');
 if(/[\uE000-\uF8FF\uFFFD□]/u.test(text))warnings.push('source-missing-glyph');
 return warnings;
}

export function volumeNumber(title:string):number|undefined{
 const match=title.match(/卷(?:第|之)?([一二三四五六七八九十百千零〇○\d]+)/);if(!match)return;
 const value=match[1];if(/^\d+$/.test(value))return Number(value);
 const digits:Record<string,number>={'零':0,'〇':0,'○':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
 if(!/[十百千]/.test(value))return Number([...value].map(c=>digits[c]).join(''));
 let total=0;let digit=0;for(const c of value){const place:Record<string,number>={'十':10,'百':100,'千':1000};if(place[c]){total+=(digit||1)*place[c];digit=0;}else digit=digits[c];}return total+digit;
}

// Only content-file anchors count; navigation icons and decorative images do not.
export function imageFiles(html:string):{fileTitle:string;caption:string}[]{
 const found=new Map<string,{fileTitle:string;caption:string}>();
 function walk(n:Node,caption=''){
  if('tagName' in n){
   if(['script','style','nav'].includes(n.tagName)||attr(n,'role')==='navigation'||attr(n,'class').split(/\s+/).some(c=>skipClasses.test(c)&&!['thumb','thumbinner'].includes(c)))return;
   if(n.tagName==='figure')caption=normalize(children(n).filter(c=>'tagName' in c&&c.tagName==='figcaption').map(plain).join(''));
   if(n.tagName==='a'&&/(?:^|\s)(?:mw-file-description|image)(?:\s|$)/.test(attr(n,'class'))){
    const url=new URL(attr(n,'href'),'https://zh.wikisource.org');
    const match=decodeURIComponent(url.pathname).match(/^\/wiki\/(File:[^#]+)$/);
    if(['zh.wikisource.org','commons.wikimedia.org'].includes(url.hostname)&&match){const fileTitle=match[1].replace(/_/g,' ');found.set(fileTitle,{fileTitle,caption:caption||fileTitle.slice(5)});}
   }
  }
  for(const c of children(n))walk(c,caption);
 }
 walk(parseFragment(html));return [...found.values()];
}
