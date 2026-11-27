/**
 * Where the code points of a paragraph's old text stand in its new text, and where a range of the
 * old text lies in the new one. Corrections (scripts/correct.ts) and the alias migration
 * (scripts/migrate-aliases.ts) carry aids and sentence aliases across a change with these.
 *
 * A `place` lists, for each code point of the old text, its index in the new text, or -1 when the
 * change removed or replaced it. Kept code points keep their order.
 */
export type Edit={find:string; replace:string; nth?:number; all?:boolean};

// Apply find/replace edits to a text, from the end so earlier offsets stay put, and track every old code point.
export function applyEdits(oldText:string,edits:Edit[],id='text'){
 let text=oldText;
 let place=Array.from(oldText,(_,i)=>i);
 for(const item of edits){
  const at:number[]=[];
  // Occurrences do not overlap: 「□□」 is found once in 「□□□」, not twice.
  for(let i=text.indexOf(item.find);i>=0;i=text.indexOf(item.find,i+item.find.length))at.push(i);
  const indexes=item.all?at:[item.nth===undefined?(at.length===1?at[0]:-1):at[item.nth]??-1];
  if(!indexes.length||indexes.some(i=>i<0))throw new Error(`${id}: “${item.find}” found ${at.length} times`);
  for(const index of [...indexes].reverse()){
   // The find carries context to be unique; only what differs from the replacement is changed.
   const was=Array.from(item.find),now=Array.from(item.replace);
   let head=0,tail=0;
   while(head<was.length&&head<now.length&&was[head]===now[head])head++;
   while(tail<was.length-head&&tail<now.length-head&&was[was.length-1-tail]===now[now.length-1-tail])tail++;
   const start=Array.from(text.slice(0,index)).length+head;
   const found=was.length-head-tail,put=now.length-head-tail;
   // Where each code point of the old text stands now: gone inside the replaced run, moved after it.
   place=place.map(at=>at<0||at<start?at:at<start+found?-1:at+put-found);
   text=text.slice(0,index)+item.replace+text.slice(index+item.find.length);
  }
 }
 return {text,place};
}

// The place of each old code point in the new text along a longest common subsequence of code points.
export function diffPlace(oldText:string,newText:string):number[]{
 const a=Array.from(oldText),b=Array.from(newText);
 let head=0;
 while(head<a.length&&head<b.length&&a[head]===b[head])head++;
 let tail=0;
 while(tail<a.length-head&&tail<b.length-head&&a[a.length-1-tail]===b[b.length-1-tail])tail++;
 const x=a.slice(head,a.length-tail),y=b.slice(head,b.length-tail);
 const n=x.length,m=y.length,w=m+1;
 // lcs[i*w+j]: the length of a longest common subsequence of x[i..] and y[j..].
 const lcs=new Uint32Array((n+1)*w);
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)lcs[i*w+j]=x[i]===y[j]?lcs[(i+1)*w+j+1]+1:Math.max(lcs[(i+1)*w+j],lcs[i*w+j+1]);
 const place=a.map((_,i)=>i<head?i:-1);
 for(let i=0,j=0;i<n&&j<m;){
  if(x[i]===y[j]&&lcs[i*w+j]===lcs[(i+1)*w+j+1]+1){place[head+i]=head+j;i++;j++;}
  else if(lcs[(i+1)*w+j]>=lcs[i*w+j+1])i++;
  else j++;
 }
 for(let k=0;k<tail;k++)place[a.length-tail+k]=b.length-tail+k;
 return place;
}

// Marks that close what comes before them: text inserted at a boundary that starts with one belongs to the range ending there.
const CLOSING=new Set('，。、；：！？」』”’）〕】》〉…—·﹕');

/**
 * The boundary k (0…old length) of the old text, mapped into the new text. Unchanged text moves
 * with its characters. A boundary inside a replaced run splits it in step, so a one-for-one
 * replacement keeps each character on its own side. Text inserted at a boundary goes with the
 * range ending there when it starts with a closing mark (」, 。…), otherwise with the range
 * starting there; at either end of the text it stays inside.
 */
export function boundaryMap(place:number[],newText:string){
 const n=place.length,newLength=Array.from(newText).length,chars=Array.from(newText);
 const regions:{a:number;b:number;a2:number;b2:number}[]=[];
 let lastOld=-1,lastNew=-1;
 const close=(i:number,j:number)=>{if(i>lastOld+1||j>lastNew+1)regions.push({a:lastOld+1,b:i,a2:lastNew+1,b2:j});};
 for(let i=0;i<n;i++){
  if(place[i]<0)continue;
  if(place[i]<=lastNew||place[i]>=newLength)throw new Error('place is not an increasing map into the new text');
  close(i,place[i]);lastOld=i;lastNew=place[i];
 }
 close(n,newLength);
 return (k:number)=>{
  if(!Number.isInteger(k)||k<0||k>n)throw new Error(`boundary ${k} outside the old text`);
  const r=regions.find(r=>r.a<=k&&k<=r.b);
  if(!r)return k<n?place[k]:newLength;
  if(r.a<k&&k<r.b)return r.a2+Math.min(k-r.a,r.b2-r.a2);
  if(r.a<r.b)return k===r.a?r.a2:r.b2;
  // Only an insertion at k.
  if(k===0)return r.a2;
  if(k===n)return r.b2;
  return CLOSING.has(chars[r.a2])?r.b2:r.a2;
 };
}
