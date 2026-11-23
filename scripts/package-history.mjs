// Run by `npm run build` after tsc: the history volumes in lib/ keep every transition and record but
// no record text, which is what took the package past GitHub's 100 MB file limit in the sites that
// vendor it. src/history/ keeps the full volumes for the scripts and tests here.
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {packagedVolume} from '../lib/src/history-volumes.js';
const dir=new URL('../lib/src/history/',import.meta.url);
for(const name of (await readdir(dir)).filter(name=>name.endsWith('.json'))){
 const file=new URL(name,dir);
 await writeFile(file,JSON.stringify(packagedVolume(JSON.parse(await readFile(file,'utf8'))))+'\n');
}
