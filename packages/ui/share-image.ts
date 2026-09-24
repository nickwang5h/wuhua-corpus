import {wrapText} from './text-layout';
export type CardInput={text:string;caption:string;credit:string;brand:string;link?:string;notice?:string;theme:'day'|'night';family:string;requireWebFont:boolean};
export async function loadTextFont(family:string,text:string,requireWebFont=false){
 let timer:ReturnType<typeof setTimeout>|undefined;
 const loaded=await Promise.race([document.fonts.load(`46px ${family}`,text),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Font loading timed out')),10000);})]).finally(()=>clearTimeout(timer));
 if((requireWebFont&&!loaded.length)||loaded.some(f=>f.status!=='loaded')||!document.fonts.check(`46px ${family}`,text))throw new Error('The text font is unavailable');
}
export async function makeShareImage(input:CardInput):Promise<{blob:Blob;width:number;height:number}>{
 await loadTextFont(input.family,input.text,input.requireWebFont);
 const canvas=document.createElement('canvas');const c=canvas.getContext('2d');if(!c)throw new Error('Canvas unavailable');
 const font=`46px ${input.family}`;c.font=font;const lines=wrapText(input.text,772,s=>c.measureText(s).width);
 c.font='24px sans-serif';const captions=wrapText(input.caption,772,s=>c.measureText(s).width);c.font='22px sans-serif';
 const footer=[input.credit,input.brand,input.link?.replace(/^https:\/\//,''),input.notice].filter(Boolean).flatMap(t=>wrapText(t!,772,s=>c.measureText(s).width));
 const height=96+lines.length*72+24+captions.length*34+24+footer.length*32;
 if(height>30000)throw new Error('Please choose a shorter passage for this image');
 canvas.width=900;canvas.height=height;const dark=input.theme==='night';c.fillStyle=dark?'#2C2F3B':'#EBEEE8';c.fillRect(0,0,900,height);c.fillStyle=dark?'#EBEEE8':'#45465E';c.textBaseline='top';
 const short=Array.from(input.text).length<=100;c.textAlign=short?'center':'left';c.font=font;let y=48;for(const line of lines){c.fillText(line,short?450:64,y+8);y+=72;}
 y+=24;c.font='24px sans-serif';for(const line of captions){c.fillText(line,short?450:64,y);y+=34;}
 y+=24;c.font='22px sans-serif';c.fillStyle=dark?'#BEC2B3':'#626475';for(const line of footer){c.fillText(line,short?450:64,y);y+=32;}
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG generation failed')),'image/png'));return {blob,width:900,height};
}
