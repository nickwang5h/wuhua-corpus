// The history volumes, oldest first. Every volume but unreleased.json is sealed and never rewritten;
// `npm run history:seal` (part of `npm run release`) names unreleased.json after the release and adds it here.
import type {HistoryVolume} from '../history-volumes.js';
import v0001 from './0001.json' with {type:'json'};
import v2026_11_23_corrections22 from './2026-11-23-corrections22.json' with {type:'json'};
import v2026_11_23_corrections23 from './2026-11-23-corrections23.json' with {type:'json'};
import v2026_11_23_corrections24 from './2026-11-23-corrections24.json' with {type:'json'};
import v2026_11_23_corrections25 from './2026-11-23-corrections25.json' with {type:'json'};
import v2026_11_27_corrections26 from './2026-11-27-corrections26.json' with {type:'json'};
import vunreleased from './unreleased.json' with {type:'json'};
export const volumes=[v0001,v2026_11_23_corrections22,v2026_11_23_corrections23,v2026_11_23_corrections24,v2026_11_23_corrections25,v2026_11_27_corrections26,vunreleased] as unknown as HistoryVolume[];
