import {BufferGeometry,Float32BufferAttribute,Line,LineBasicMaterial,OrthographicCamera,Scene,WebGLRenderer,Group} from 'three';
import {lorenzPoints} from './lorenz';
export function createButterfly(host:HTMLElement,onFallback:()=>void){
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 let renderer:WebGLRenderer;
 try{renderer=new WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch{onFallback();return undefined;}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setSize(112,84);renderer.setClearColor(0x000000,0);
 const scene=new Scene(),group=new Group();scene.add(group);const camera=new OrthographicCamera(-56,56,42,-42,.1,300);camera.position.z=120;
 const points=lorenzPoints();const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(points.flatMap(p=>[...p]),3));
 const main=new LineBasicMaterial({transparent:true,opacity:.65}),accent=new LineBasicMaterial({transparent:true,opacity:.36});
 const line=new Line(geometry,main);group.add(line);
 const detailGeometry=new BufferGeometry();detailGeometry.setAttribute('position',new Float32BufferAttribute(points.slice(4300,4900).flatMap(p=>[...p]),3));const detail=new Line(detailGeometry,accent);group.add(detail);
 let visible=true,disposed=false,frame=0,last=0,elapsed=0,angle=0,target=0;
 function colors(){const css=getComputedStyle(host);main.color.set(css.getPropertyValue('--accent').trim());accent.color.set(css.getPropertyValue('--ornament').trim());}
 function render(now:number){frame=0;if(disposed||!visible||document.hidden)return;const dt=last?Math.min(now-last,80):0;last=now;elapsed=Math.min(2400,elapsed+dt);angle+=(target-angle)*.18;if(Math.abs(target-angle)<.0005)angle=target;group.rotation.y=angle;geometry.setDrawRange(0,Math.max(2,Math.floor(points.length*elapsed/2400)));detailGeometry.setDrawRange(0,Math.max(0,Math.min(600,Math.floor(points.length*elapsed/2400)-4300)));renderer.render(scene,camera);host.dataset.renderCount=String(Number(host.dataset.renderCount||0)+1);host.dataset.animation=elapsed<2400?'revealing':'complete';if(elapsed<2400||angle!==target)frame=requestAnimationFrame(render);}
 function wake(){if(!disposed&&visible&&!document.hidden&&!frame){last=0;frame=requestAnimationFrame(render);}}
 function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
 function visibility(){if(document.hidden)stop();else wake();}
 function enter(){target=.12;wake();}function leave(){target=0;wake();}
 function lost(event:Event){event.preventDefault();stop();onFallback();}
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;if(visible)wake();else stop();});observer.observe(host);
 const theme=new MutationObserver(()=>{colors();wake();});theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 const scheme=matchMedia('(prefers-color-scheme: dark)');const onScheme=()=>{colors();wake();};scheme.addEventListener('change',onScheme);
 const link=host.closest('a')||host;link.addEventListener('pointerenter',enter);link.addEventListener('pointerleave',leave);link.addEventListener('focus',enter);link.addEventListener('blur',leave);
 document.addEventListener('visibilitychange',visibility);canvas.addEventListener('webglcontextlost',lost);
 colors();host.append(canvas);host.dataset.renderer='webgl';wake();
 return ()=>{disposed=true;stop();observer.disconnect();theme.disconnect();scheme.removeEventListener('change',onScheme);document.removeEventListener('visibilitychange',visibility);link.removeEventListener('pointerenter',enter);link.removeEventListener('pointerleave',leave);link.removeEventListener('focus',enter);link.removeEventListener('blur',leave);canvas.removeEventListener('webglcontextlost',lost);geometry.dispose();detailGeometry.dispose();main.dispose();accent.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();delete host.dataset.renderer;};
}
