import type { Work } from './schema';

export const works = [
  {
    "id": "zhuangzi",
    "title": "庄子",
    "roman": "Zhuāng Zǐ",
    "subtitle": "在万物之间，松开自己。",
    "description": "从齐物到逍遥，试着站到熟悉的边界之外。",
    "color": "#34574e",
    "symbol": "游"
  },
  {
    "id": "laozi",
    "title": "道德经",
    "roman": "Dào Dé Jīng",
    "subtitle": "让事物，回到它的自然。",
    "description": "在有与无、进与退之间，辨认另一种力量。",
    "color": "#69766c",
    "symbol": "道"
  },
  {
    "id": "lunyu",
    "title": "论语",
    "roman": "Lún Yǔ",
    "subtitle": "从日常出发，学着成为自己。",
    "description": "学习、相处与自省，都从身边的一件小事开始。",
    "color": "#866c56",
    "symbol": "仁"
  }
] satisfies Work[];
