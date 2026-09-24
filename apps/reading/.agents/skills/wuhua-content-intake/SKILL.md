---
name: wuhua-content-intake
description: 维护中文站精选、解读、路径及概念展示；canonical 入库与拼音更正在 Corpus 仓库。
---

# 中文内容

读 [内容编写](../../../docs/content-authoring.md)。中文 `src/content/legacy/` 保留精选、注释、路径与兼容身份；历史 fulltext 不再生成现行经典。

不要改变旧 URL、精选 ID 或用新文字覆盖用户引用快照。编辑与人工审核分开；不能编造 reviewer 或 reviewedAt。经典、来源、history、拼音及共享 aid 更正在 Corpus 仓库完成，再显式升级包。

本产品运行 `npm run check:content`，按影响运行 `npm test`、`npm run build`。不运行 Learn 检查，不修改 Learn MDX/release。中文编辑流程退出时删除本 Skill。
