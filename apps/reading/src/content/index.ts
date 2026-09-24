export * from '@wuhua/corpus';
export {works} from './legacy/works';
export {paths} from './legacy/paths';
import {concepts as presentationConcepts} from './legacy/concepts';
export const concepts:Record<string,{description:string;related:string[]}>=presentationConcepts;
export function localDay(date=new Date()){return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;}
export function daily<T>(items:T[],date=new Date()):T|undefined {if(!items.length)return; const seed=Array.from(localDay(date)).reduce((n,c)=>n*31+c.charCodeAt(0),0);return items[Math.abs(seed)%items.length];}
