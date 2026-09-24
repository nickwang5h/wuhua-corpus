export type Script = 'original'|'simplified'|'traditional';
let converters:Promise<{simplified:(s:string)=>string;traditional:(s:string)=>string}>|undefined;
async function getConverters(){
 converters ??= import('opencc-js').then(OpenCC=>({simplified:OpenCC.Converter({from:'t',to:'cn'}),traditional:OpenCC.Converter({from:'cn',to:'t'})})).catch(e=>{converters=undefined;throw e;});
 return converters;
}
export async function convert(text:string,script:Script){return script==='original'?text:(await getConverters())[script](text);}
export async function searchText(text:string){return (await convert(text,'simplified')).toLocaleLowerCase();}
// Mapping is explicit per range. Unequal lengths must not be guessed character-by-character.
export async function displayRange(text:string,script:Script){const shown=await convert(text,script);return {text:shown,start:0,end:Array.from(text).length,oneToOne:Array.from(shown).length===Array.from(text).length};}
