import {spawnSync} from 'node:child_process';
for(const cwd of ['apps/reading','apps/learning','packages/corpus']) {const result=spawnSync('node',['scripts/check-boundaries.mjs'],{cwd,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
