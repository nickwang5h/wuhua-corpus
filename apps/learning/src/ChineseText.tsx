export function ChineseText({text}:{text:string}){
 return <>{text.split(/(\p{Script=Han}+)/gu).map((part,i)=>i%2?<span className="learning-han" lang="zh" key={i}>{part}</span>:part)}</>;
}
