import type { Edition } from './schema';

export const editions = [
  {
    "id": "zhuangzi-selected-v1",
    "workId": "zhuangzi",
    "sourceId": "legacy-zhuangzi",
    "title": "现有通行本选段（底本待核验）",
    "status": "draft"
  },
  {
    "id": "laozi-selected-v1",
    "workId": "laozi",
    "sourceId": "legacy-laozi",
    "title": "现有通行本选段（底本待核验）",
    "status": "draft"
  },
  {
    "id": "lunyu-selected-v1",
    "workId": "lunyu",
    "sourceId": "legacy-lunyu",
    "title": "现有通行本选段（底本待核验）",
    "status": "draft"
  }
] satisfies Edition[];
