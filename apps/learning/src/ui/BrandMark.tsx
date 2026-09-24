import {lorenzPath} from './lorenz';
const simplePath=lorenzPath(true),fullPath=lorenzPath();
export function BrandMark({large=false}:{large?:boolean}){
 return <svg className={`butterfly-mark ${large?'large':''}`} width={large?112:40} height={large?84:32} viewBox="0 0 112 84" aria-hidden="true" focusable="false"><path d={large?fullPath:simplePath} fill="none" stroke="currentColor" strokeWidth={large?.48:.8} strokeLinecap="round" opacity={large?.78:.85}/><path d={simplePath} fill="none" stroke="var(--ornament)" strokeWidth=".55" opacity=".35"/></svg>;
}
