# 物化间 · Wuhua

一个仓库、两个独立前端、一套经典原文。中文站供全文阅读与回味；Wuhua Learn 是几分钟的英文小短文，从想法和词语自然走近中文与经典。没有课程完成要求、账户、后台或云同步，个人记录保存在当前浏览器。

- [产品](docs/product.md) · [当前架构](docs/architecture.md) · [界面约定](docs/ui-plan.md)
- [MDX Reading 决策](docs/decisions/2026-09-24-learning-mdx-readings.md) · [实际执行记录](docs/worklog.md)
- 项目 Skill：[开发](.agents/skills/wuhua-development/SKILL.md) · [内容入库](.agents/skills/wuhua-content-intake/SKILL.md)

## 本地运行

Node.js 22.12+、npm，命令均在仓库根目录执行：

```sh
npm ci
npm run dev               # 中文站，4174
npm run dev:learning      # Learn，4175；另开终端
npm run check:types
npm test
npm run check:content
npm run build             # 内容检查及双站构建
```

单站命令为 `build:reading` / `build:learning`，输出 `dist/reading` / `dist/learning`；`preview` / `preview:learning` 打开各自生产产物。开发与预览默认共用端口，可用 `-- --port 48735` 指定独立端口。

## 新增一篇 Reading

1. 新建 `content/learning/foo.mdx`，文件名与 id 一致。
2. 填 frontmatter，正文直接写 Markdown；无需 React 页面或生成 JSON。
3. 执行 `npm run check:content`。
4. `npm run dev:learning`，访问 `http://127.0.0.1:4175/?preview=1#/reading/foo`。
5. 核对文章、现代汉语、经典引用、来源及读音，按真实情况填写 review。
6. 决定公开时，在 `packages/content/src/learning-release.json` 加入 id / version；实际部署另按授权进行。

最小可用文件：

```mdx
---
id: foo
version: "1"
title: A small moment of attention
summary: Something ordinary, seen a little differently.
level: starting
minutes: 2
order: 60
review:
  status: draft
  author: Wuhua
---
What did you notice on your way home today?

A familiar place can feel different when you give it a little attention.
```

不要求 exercise、reflection、context 或任何固定正文栏目。`level` 为 starting / building；`order` 仅是编辑排序。`related` 可列其他 Reading ID，不是先修关系。人工审核状态 reviewed / published 需实际 reviewer 和 reviewedAt（YYYY-MM-DD）。新文件、审核通过或新版本均不会自动加入公开集合。

### 词语与经典引句

现代词句可直接写入 Phrase：

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

## 内容层与校验

| 内容 | 编辑源 |
| --- | --- |
| 固定 wikitext、贡献者与许可 | `public/texts/wikisource.json` |
| 当前经典正文与稳定身份 | `packages/content/src/books/*.json` |
| 旧版本与修订映射 | `packages/content/src/history.json` |
| 拼音 | `packages/content/src/pinyin-aids.json` |
| 中文独立说明 | `packages/content/src/editorial-aids.json` |
| Learn 正文与元数据 | `content/learning/*.mdx` |
| Learn 公开版本 | `packages/content/src/learning-release.json` |

`content:import` 离线转换固定快照；只有明确需要新来源时使用 `content:import -- --download`，下载进入候选目录，不直接覆盖当前底本。正文修改后运行 `content:catalog`；`content:assets` 在启动／构建时生成同站正文文件，无需手工维护。来源与旧 ID 的处理细节见内容入库 Skill。

`check:content` 检查来源、正文、历史、拼音和 MDX；Learning 的 Vite 构建也会检查全部 MDX。缺失引用、错误版本／范围、重复 ID、不匹配文件名、无效元数据或组件会使构建失败。校验通过不代表人工内容审核完成。

五个主题已迁移：knowing-enough、knowing-yourself、learning-from-others、one-with-things、practice-and-joy。当前为 Reading version 2，均保留 draft 编辑状态和具体参考材料，发布清单承接原公开主题。

## 本机记录

中文存档 `wuhua:reading:v2`，Learn 继续使用 `wuhua:learning:v1`。新 Reading 收藏与笔记独立编号；旧收藏、笔记和 progress 不删除，进度不再控制页面。Saved 可查看旧笔记与引用快照，完整 JSON 导出仍包含旧答案和完成历史。

JSON 用于恢复，Markdown 用于阅读。默认合并并保留冲突副本；替换前下载备份。记录不跨站点、浏览器或设备同步。清理浏览器后不能自动找回，请保管导出的 JSON。

## 部署状态与边界

中文站：`https://wuhua.app/`，Vercel 项目 wuhua；Learn：`https://learn.wuhua.app/`，项目 wuhua-learn。

本次重构前核实，main 推送会自动部署中文站，学习项目没有 Git 绑定。根 `.vercel` 绑定中文站；Learn 必须选择自己的项目。`vercel.json` 与 `vercel.learning.json` 分别描述源码构建。MDX 重构的本地完成状态及实际部署情况以最新 worklog 为准，本地构建不表示上线。
