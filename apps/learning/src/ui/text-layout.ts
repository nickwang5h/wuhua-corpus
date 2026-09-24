// Greedy measured wrapping, respecting explicit breaks and basic CJK punctuation.
const closing=/^[，。、；：！？,.!?;:）】》」』”’％%]/u;
const opening=/[（【《「『“‘]$/u;
export function wrapText(text:string,width:number,measure:(s:string)=>number):string[]{
 const lines:string[]=[];
 for(const paragraph of text.replace(/\r\n?/g,'\n').split('\n')){
  let chars=Array.from(paragraph);if(!chars.length){lines.push('');continue;}
  while(chars.length){let n=1;while(n<chars.length&&measure(chars.slice(0,n+1).join(''))<=width)n++;
   if(n<chars.length)while(n>1&&(closing.test(chars[n])||opening.test(chars[n-1])))n--;
   // An unbreakable punctuation cluster wider than a line stays intact.
   if(n===1)while(n<chars.length&&closing.test(chars[n]))n++;
   lines.push(chars.slice(0,n).join(''));chars=chars.slice(n);
  }
 }
 return lines;
}
export function continuousExcerpt(source:string,excerpt:string){return !!excerpt.trim()&&source.replace(/\s/g,'').includes(excerpt.trim().replace(/…$/,'').replace(/\s/g,''));}
