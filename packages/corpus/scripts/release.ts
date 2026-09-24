import {mkdir,readFile,writeFile,rename,mkdtemp,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {contentRelease,manifest} from '../src';
import {readBook} from './read-book';
const root=fileURLToPath(new URL('../',import.meta.url));
const releases=join(root,'releases');await mkdir(releases,{recursive:true});
const staging=await mkdtemp(join(releases,'.staging-'));
try {
 const packed=spawnSync('npm',['pack','--json','--ignore-scripts','--pack-destination',staging],{cwd:root,encoding:'utf8'});
 if(packed.status!==0)throw new Error(packed.stderr);
 const [{filename}]=JSON.parse(packed.stdout);
 const archive=await readFile(join(staging,filename));
 const sha256=createHash('sha256').update(archive).digest('hex');
 await mkdir(join(staging,'books'));
 for(const entry of manifest)await writeFile(join(staging,'books',`${entry.id}.json`),JSON.stringify({...await readBook(entry.id),release:contentRelease})+'\n');
 await writeFile(join(staging,'manifest.json'),JSON.stringify({release:contentRelease,books:manifest},null,2)+'\n');
 await writeFile(join(staging,'release.json'),JSON.stringify({release:contentRelease,filename,sha256},null,2)+'\n');
 // Never replace an existing release, even when the source has changed.
 await rename(staging,join(releases,contentRelease));
 console.log(`Generated releases/${contentRelease}/${filename}`);
} finally {await rm(staging,{recursive:true,force:true});}
