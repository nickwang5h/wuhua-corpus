---
name: wuhua-content-intake
description: 为物化间与 Wuhua Learn 维护固定经典来源、中文解读、MDX Reading 与拼音。用于新增篇章、编写独立英文短文、核对引用和审核信息；页面实现使用 wuhua-development。
---

# 物化间内容入库

先读 [README 作者入口](../../../README.md#新增一篇-reading) 和相近内容。经典与记录契约见 [architecture](../../../docs/architecture.md)，Learn 产品目标见 [product](../../../docs/product.md)。检查目标 diff，保留已有工作。

## 内容归属

| 内容 | 事实源 |
| --- | --- |
| 固定 wikitext、oldid、贡献者与许可 | `public/texts/wikisource.json` |
| 当前经典正文与稳定 ID | `packages/content/src/books/*.json` |
| 历史引用／修订／拆合 | `packages/content/src/history.json` |
| 中文独立说明 | `packages/content/src/editorial-aids.json` |
| Learn 短文 | `content/learning/*.mdx` |
| 经典对齐拼音 | `packages/content/src/pinyin-aids.json` |
| Learn 公开版本 | `packages/content/src/learning-release.json` |

旧精选和兼容档案留在 `packages/content/src/legacy/`。目录与静态正文是可重建产物，不当作人工编辑源。

## 来源与经典入库

1. 核实作品、版本、Wikisource 固定 oldid、贡献历史、许可及实际处理方式，保存原始快照。
2. 更新来源时用 `content:import -- --download` 获取候选，不直接覆盖既有快照／正文。普通 `content:import` 从固定快照离线转换，未知模板报错。
3. 现有段落 ID 不因排序或标题变化重分配。更正原文前保存旧引用、版本及明确 history 映射；校订记录 sourceText、原因和实际审核。
4. 拼音与原文版本、Unicode 码点范围对齐。不能用字形转换结果覆盖底文，也不猜测多音字或缺失读音。
5. 外部译文、古注、字体、音频分别核实作者、版本、具体链接与权利；查阅链接不等于采用该译者的文字。CText 的古典正文、历史译本和现代改写分别判断，不批量复制现代说明。

## 编写 MDX Reading

新增一个 `.mdx` 文件即可，参考当前五篇或 README 的最小示例。frontmatter 只填写稳定身份、标题、摘要、level、minutes、order、review，以及需要的 sources、related、references。正文直接使用 Markdown，不填固定 meaning/context/exercise/reflection 表。

每篇独立成立，从容易理解的问题、想法或词语进入，让经典成为来源而非入口门槛。related 是继续阅读建议，不是 prerequisite。可以没有练习、思考题或经典引句，不强迫所有文章遵循同一章节顺序。

- Phrase 用于现代词句、显式拼音和英文解释。
- ClassicQuote 通过命名 source 引用 ID / version / start / end，从共享数据读取经典。禁止把经典原句再次硬编码在 MDX。
- 现代例句与独立解释明确归属 Wuhua，不冒充原典或参考译者的译文。
- 可选 references 每项保存 title、HTTPS url、note；来源与审核 UI 由页面框架呈现。
- AI 起稿标 draft 和真实 author；人工审阅后才写 reviewer / reviewedAt。词义、文化解释和读音分别核对，结构校验不代替内容判断。

```sh
npm run check:content
npm run dev:learning
# http://127.0.0.1:4175/?preview=1#/reading/文章ID
```

修改 MDX 后自动加载，无 JSON generator 或课程模板。未发布草稿在生产不可用；公开清单只在匹配发布决定下更新，保留真实 review。新版本不会自动延续公开状态。

## 验证和交付

检查文章能被直接读懂、现代词句和拼音正确、经典范围及版本准确、具体材料的使用关系清楚。用桌面和手机实际阅读，核对来源区与文章对应；不要检查已经删除的课程三阶段。

```sh
npm run content:catalog  # 仅正文／目录改变时
npm run check:content
npm test                # 契约、新形态或兼容改变时
npm run build           # 共享内容变化验证两站
```

正文修订保留历史与旧引用；记录升级用合成旧数据检查，不操作真实用户数据。分享打印触及新引用形态时检查实际产物。

按任务要求同步当前文档及实际 worklog，区分已编写、已校验、已审核、已配置公开和已部署。不要用旧课程类型或失效命令指导下一位作者。
