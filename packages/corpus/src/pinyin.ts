import data from './pinyin-aids.json' with {type:'json'};
import type {Aid} from './types.js';
export const pinyinAids=data as Aid[];
export function pinyinFor(id:string,version:string){return pinyinAids.find(a=>a.target===id&&a.version===version&&a.review.textVersion===version);}
