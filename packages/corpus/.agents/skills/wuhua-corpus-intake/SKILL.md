---
name: wuhua-corpus-intake
description: 维护 canonical 来源、稳定身份、历史更正、拼音与静态 release；不编写产品 MDX、页面或中文路径。
---

# Corpus 入库与发布

读 [来源与修订](../../../docs/content-authoring.md) 和 [发布](../../../docs/deployment.md)。`src/books` 是唯一现行底文；固定快照在 `sources/wikisource.json`。Corpus 不依赖 React、DOM、localStorage 或任一产品。

只离线转换固定快照；明确下载任务才用 `content:import -- --download`，候选不直接覆盖 canonical。核实 oldid、贡献者、许可、处理方式，不把现代译注误当公共领域原文。

ID 不随目录、标题、排序重分配。修订保留旧 version、引用、sourceText、理由、真实审核和 history 映射。拼音对应原文 Unicode 码点与版本；不猜测缺字/多音字，不用简繁转换覆盖底文。

共享 aid 须有 ID、target、version、review 和 rights。中文推荐、concept presentation、curated/paths、Learn schema/MDX/release 不得入库。concept identity 保持最小，不建设 ontology。

运行 `npm run content:catalog`（仅正文目录变化）、`npm run check:types`、`npm run check:corpus`、`npm test`。新 release 同时更新 package version 和 contentRelease，再 `npm run release`。已分发版本不得覆盖；两个产品分别决定何时升级，生成 release 不授权远程上传或生产部署。Corpus 工作流停用时删除本 Skill。
