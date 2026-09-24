/** One deterministic trajectory shared by the WebGL mark and its SVG fallback. */
export type Point3 = readonly [number, number, number];
let trajectory: readonly Point3[] | undefined;
function derivative([x,y,z]: Point3): Point3 { return [10*(y-x), x*(28-z)-y, x*y-(8/3)*z]; }
function add(p:Point3,k:Point3,h:number):Point3{return [p[0]+k[0]*h,p[1]+k[1]*h,p[2]+k[2]*h];}
export function rk4(p:Point3,h=0.005):Point3{
 const a=derivative(p),b=derivative(add(p,a,h/2)),c=derivative(add(p,b,h/2)),d=derivative(add(p,c,h));
 return [0,1,2].map(i=>p[i]+h*(a[i]+2*b[i]+2*c[i]+d[i])/6) as unknown as Point3;
}
export function lorenzPoints():readonly Point3[]{
 if(trajectory)return trajectory;
 let p:Point3=[1,1,1];const points:Point3[]=[];
 for(let i=0;i<7000;i++){p=rk4(p);if(i>=1000)points.push(p);}
 const xs=points.map(p=>p[0]),zs=points.map(p=>p[2]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
 trajectory=Object.freeze(points.map(([x,y,z])=>Object.freeze([(x-(minX+maxX)/2)*96/(maxX-minX),(z-(minZ+maxZ)/2)*66/(maxZ-minZ),y*.2] as const)));
 return trajectory;
}
export function lorenzPath(simple=false):string{return lorenzPoints().filter((_,i)=>i%(simple?12:2)===0).map(([x,y],i)=>`${i?'L':'M'}${(56+x).toFixed(2)},${(42-y).toFixed(2)}`).join(' ');}
