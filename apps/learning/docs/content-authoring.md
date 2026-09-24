# Learn 内容编写

## 新增一篇 Reading

1. 先查Corpus concept identities、editorial aids 和 canonical passages，选一个可教思想；再新建 `content/learning/foo.mdx`，文件名与 id 一致。
2. 填 frontmatter，默认围绕一个问题、一个中文 focus、现代例句与经典锚点，解释使用 Markdown；无需 React 页面或生成 JSON。
3. 执行 `npm run check:content`。
4. `npm run dev`，访问 `http://127.0.0.1:4175/?preview=1#/reading/foo`。
5. 核对文章、现代汉语、经典引用、来源及读音，按真实情况填写 review。
6. 决定公开时，在 `content/learning-release.json` 加入 id / version；实际部署另按授权进行。

最小可用文件：

```mdx
---
id: foo
version: "1"
title: What counts as enough?
summary: Contentment as a kind of wealth.
focus:
  chinese: 知足
  pinyin: zhī zú
  gloss: knowing what is enough
concepts: []
sources:
  main:
    id: p-laozi-2354026-33-1
    version: "1"
    start: 21
    end: 26
    label: Daodejing 33
level: starting
minutes: 2
order: 60
review:
  status: draft
  author: Wuhua
---
<Phrase />

<Phrase chinese="我很知足。" pinyin="wǒ hěn zhī zú." gloss="I am content." />

<ClassicQuote source="main" />

The Daodejing treats knowing what is enough as a kind of wealth.
Why might these ideas belong together?
```

focus 与非空 sources 必填；concepts 只引用现有Corpus 中文身份键，找不到合适概念时可省略并直接锚定段落。不要求 exercise、reflection、context 等固定栏目。`level` 为 starting / building；`order` 仅是编辑排序。`related` 可列其他 Reading ID，不是先修关系。人工审核状态 reviewed / published 需实际 reviewer 和 reviewedAt（YYYY-MM-DD）。新文件、审核通过或新版本均不会自动加入公开集合。

### 词语与经典引句

`<Phrase />` 读取 focus；现代例句用三个显式属性。现代词句可直接写入 Phrase：

```mdx
<Phrase chinese="知足" pinyin="zhī zú" gloss="to be content with what is enough" />
```

经典原文不能复制为第二份底文。在 frontmatter 增加引用：

```yaml
sources:
  main:
    id: p-laozi-2354026-33-1
    version: "1"
    start: 21
    end: 26
    label: Daodejing 33
```

然后在文章需要的位置使用 `<ClassicQuote source="main" />`。范围是原文 Unicode 码点的 `[start,end)`，可用 `Array.from(text).slice(start,end).join('')` 检查。经典正文、现成对齐拼音和简繁转换由共享实现提供。普通段落、标题、列表、强调、引用仍使用 Markdown，正文标题从 `##` 开始。

组件仅支持上述字面字符串属性；不在正文 import 页面、写脚本、表达式或全局布局。具体参考材料可放可选 `references` 数组，每项 `title`、HTTPS `url`、可选 `note`，由来源 UI 统一呈现。现有五篇 MDX 是完整样例；没有模板生成步骤。修改 MDX 后开发页自动重新加载。


经典正文、历史、拼音和来源更正在 Corpus 仓库进行；本仓库通过明确 release 升级消费。Learn release 与人工 review 分开，不能把技术校验冒充人工审核。
