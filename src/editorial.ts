import data from './editorial-aids.json' with {type:'json'};
import type {Aid} from './types.js';
export const editorialAids=data as Aid[];
export function editorialFor(id:string,version:string){return editorialAids.filter(a=>a.target===id&&a.version===version&&a.review.status!=='withdrawn');}
