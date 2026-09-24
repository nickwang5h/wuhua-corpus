import {useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';
import type {Settings} from './data';
export function ThemeToggle({settings,onChange,english=false}:{settings:Settings;onChange:(settings:Settings)=>void;english?:boolean}){
 const [systemDark,setSystemDark]=useState(()=>matchMedia('(prefers-color-scheme: dark)').matches);
 useEffect(()=>{const media=matchMedia('(prefers-color-scheme: dark)');const changed=()=>setSystemDark(media.matches);media.addEventListener('change',changed);return()=>media.removeEventListener('change',changed);},[]);
 const dark=settings.theme==='dark'||settings.theme==='system'&&systemDark;
 const label=english?(dark?'Switch to day theme':'Switch to night theme'):(dark?'切换日间配色':'切换夜间配色');
 return <button className="theme-toggle" onClick={()=>onChange({...settings,theme:dark?'light':'dark'})} aria-label={label} title={label}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button>;
}
