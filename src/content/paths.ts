import type { ReadingPath } from './schema';

export const paths = [
  {
    "id": "self",
    "title": "我，究竟是谁？",
    "intro": "从认识自己，到松开对自己的执着。",
    "ids": [
      "d4",
      "l2",
      "z2",
      "z5"
    ],
    "label": "自知与物我"
  },
  {
    "id": "others",
    "title": "不同的人，如何相处？",
    "intro": "看见立场的差异，也为彼此留出位置。",
    "ids": [
      "z3",
      "z4",
      "l5",
      "l6"
    ],
    "label": "彼此与相处"
  },
  {
    "id": "nature",
    "title": "什么才是顺其自然？",
    "intro": "顺应并非放任，无为也不等于不做。",
    "ids": [
      "d3",
      "d2",
      "d6",
      "z6"
    ],
    "label": "自然与行动"
  },
  {
    "id": "learn",
    "title": "读过的，怎样成为自己的？",
    "intro": "从读懂文字，到形成自己的理解。",
    "ids": [
      "l1",
      "l4",
      "d5",
      "l3"
    ],
    "label": "学习与内化"
  }
] satisfies ReadingPath[];
