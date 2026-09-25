import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import type {SourceImage} from '../src/types.js';
import {digest,request,root,type SourcePage} from './corpus-sources.js';
import {normalizeHtml} from './corpus-normalize.js';
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
export function verifyImageBytes(image:SourceImage,bytes:Uint8Array){
 const signature=Buffer.from(bytes);const valid=image.mime==='image/jpeg'?signature.subarray(0,3).equals(Buffer.from([255,216,255])):signature.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(!valid||hash(bytes)!==image.sha256)throw new Error(`Image bytes changed: ${image.id}`);
}
export async function verifyImage(image:SourceImage){
 if(image.asset!==`assets/${image.sha256}.${image.mime==='image/jpeg'?'jpg':'png'}`)throw new Error('Invalid image asset path');
 const bytes=await readFile(new URL('src/'+image.asset,root));verifyImageBytes(image,bytes);
}
export async function fetchImage(work:string,page:SourcePage,file:{fileTitle:string;caption:string}):Promise<SourceImage>{
 const url=new URL('https://commons.wikimedia.org/w/api.php');
 url.search=new URLSearchParams({action:'query',format:'json',formatversion:'2',titles:file.fileTitle,prop:'imageinfo',iiprop:'url|timestamp|sha1|size|mime|extmetadata',iistart:page.timestamp,iilimit:'1'}).toString();
 const {body}=await request(url.href);const info=body.query?.pages?.[0]?.imageinfo?.[0];
 if(!info||!['image/jpeg','image/png'].includes(info.mime))throw new Error(`No supported historical image: ${file.fileTitle}`);
 const imageUrl=new URL(info.url);if(imageUrl.protocol!=='https:'||imageUrl.hostname!=='upload.wikimedia.org'||!imageUrl.pathname.startsWith('/wikipedia/commons/'))throw new Error('Untrusted image URL');
 const cache=new URL(`.cache/wuhua-corpus/images/${digest(info.url+info.sha1)}`,root);let bytes:Buffer;
 try{bytes=await readFile(cache);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;const response=await fetch(imageUrl,{redirect:'error',signal:AbortSignal.timeout(45000)});if(!response.ok)throw new Error(`Image HTTP ${response.status}`);bytes=Buffer.from(await response.arrayBuffer());await mkdir(new URL('.',cache),{recursive:true});await writeFile(cache,bytes);}
 if(bytes.length!==info.size||createHash('sha1').update(bytes).digest('hex')!==info.sha1)throw new Error('Upstream image checksum mismatch');
 const sha256=hash(bytes);const asset=`assets/${sha256}.${info.mime==='image/jpeg'?'jpg':'png'}`;
 const text=(key:string)=>normalizeHtml(info.extmetadata?.[key]?.value??'').map(b=>b.text).join(' ');
 const image:SourceImage={id:`image-${work}-${digest(String(page.pageId)+':'+file.fileTitle).slice(0,16)}`,version:`sha256:${sha256}`,fileTitle:file.fileTitle,caption:file.caption,source:page.source,url:info.url,asset,mime:info.mime,width:info.width,height:info.height,sha256,fileTimestamp:info.timestamp,fileSha1:info.sha1,rights:{license:text('LicenseShortName')||'Unverified',attribution:text('Artist')||'Wikimedia Commons contributors',...(text('LicenseUrl')?{url:text('LicenseUrl')}:{})}};
 verifyImageBytes(image,bytes);
 await mkdir(new URL('src/assets/',root),{recursive:true});await writeFile(new URL('src/'+asset,root),bytes);return image;
}
