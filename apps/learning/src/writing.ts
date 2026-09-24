export function writingCharacters(text:string):string[]{return [...new Set(Array.from(text).filter(c=>/\p{Script=Han}/u.test(c)))];}
export const scriptLabels={original:'Source edition',simplified:'Simplified',traditional:'Traditional'};
