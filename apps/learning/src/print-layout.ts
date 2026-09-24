export type PracticeCell={char:string;pinyin?:string;position:number};
export type PrintOptions={mode:'passage'|'characters'|'selected';traces:number;blanks:number;traceCells:number;blankCells:number;size:12|15|18;paper:'A4'|'Letter';pinyin:boolean;midlines:boolean;heading:boolean};
export const defaultPrintOptions:PrintOptions={mode:'passage',traces:1,blanks:1,traceCells:2,blankCells:3,size:15,paper:'A4',pinyin:false,midlines:true,heading:true};
export type PracticeRow={cells:PracticeCell[];kind:'model'|'trace'|'blank'|'characters'};
export type PrintPage={rows:PracticeRow[]};
const closing=/^[，。、；：！？,.!?;:）】》」』”’]/u,opening=/[（【《「『“‘]/u;
export function passageLines(cells:PracticeCell[],columns:number){
 const lines:PracticeCell[][]=[];let paragraph:PracticeCell[]=[];
 function flush(){while(paragraph.length){let n=Math.min(columns,paragraph.length);if(n<paragraph.length)while(n>1&&(closing.test(paragraph[n].char)||opening.test(paragraph[n-1].char)))n--;if(n===1)while(n<paragraph.length&&closing.test(paragraph[n].char))n++;lines.push(paragraph.slice(0,n));paragraph=paragraph.slice(n);}}
 for(const cell of cells){if(cell.char==='\n')flush();else paragraph.push(cell);}flush();return lines;
}
export function paginatePractice(cells:PracticeCell[],options:PrintOptions){
 const {size,paper,pinyin,heading}=options;const width=paper==='A4'?210:215.9,height=paper==='A4'?297:279.4,columns=Math.floor((width-30)/size);const rowHeight=size+(pinyin?6:0)+3;
 const usableHeight=height-30-(heading?28:0)-10;
 const groups:PracticeRow[][]=[];
 if(options.mode==='characters'){
  const seen=new Set<string>();for(const cell of cells){if(!/\p{Script=Han}/u.test(cell.char)||seen.has(cell.char))continue;seen.add(cell.char);groups.push([{kind:'characters',cells:Array.from({length:1+options.traceCells+options.blankCells},()=>cell)}]);}
 }else for(const line of passageLines(cells,columns)){groups.push([{kind:'model',cells:line},...Array.from({length:options.traces},()=>({kind:'trace' as const,cells:line})),...Array.from({length:options.blanks},()=>({kind:'blank' as const,cells:line}))]);}
 const pages:PrintPage[]=[];let rows:PracticeRow[]=[];let used=0;
 for(const group of groups){const h=group.length*rowHeight;if(rows.length&&used+h>usableHeight){pages.push({rows});rows=[];used=0;}rows.push(...group);used+=h;}
 if(rows.length)pages.push({rows});return {pages,width,height,columns,rowHeight};
}
