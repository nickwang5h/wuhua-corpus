---
name: wuhua-corpus-intake
description: 自动扩展古文 corpus、修订固定来源和共享定点拼音；不编写产品页面、MDX、译文或中文路径。
---

# Corpus 入库

先读 [Corpus 操作与路线](../../../docs/corpus-route.md)，底文修订或定点拼音写入另读 [来源与修订](../../../docs/content-authoring.md)。`src/books` 是唯一 canonical tree；新增作品的固定来源在 `sources/corpus`。旧三书来源仍在 `sources/wikisource.json`，正文与身份冻结。

新增作品只在 `corpus/targets.json` 增加 id/title（可选 priority），执行 `npm run corpus:sync -- <id>`。全量运行 `npm run corpus:sync`；缺页、歧义和污染逐书报告，不阻塞其他作品。只对真实例外维护 overrides，不手工列章节 URL、不逐本扩写旧三书 importer。`corpus/route.json` 单独维护编辑路线，不自动进入产品。

Raw 缓存在 `.cache/wuhua-corpus`，不提交 Git。正文、来源 manifest 和覆盖报告保留；`corpus:report` 生成统计，`corpus:check` 离线核验。来源与许可缺失记为 warning，不阻塞基础语料建设。LLM 只能帮助 metadata 和异常判断，不能补写 canonical 原文。

ID 不随目录、标题重分配。已入库正文发生变化时保留缓存候选；真实更正仍须保留旧 version、引用、sourceText、理由和 history。不要用繁简转换覆盖底文。本阶段不批量生成拼音、注释、译文或 embedding。

完成后运行 `npm run check:content`、`npm run check:types`、`npm test`、`npm run build`，检查报告与代表性原文。发布另按 [发布文档](../../../docs/deployment.md) 升级版本；生成包不授权上传、部署或修改两个产品 vendor。产品各自决定何时升级。

共享 aid 写入 `src/pinyin-aids.json` 或 `src/editorial-aids.json`，遵循来源文档的定点写入步骤。先查已有 target/version，扩展时保留原 token，避免重叠活动候选；保持真实 review 与 rights。现代例句拼音留在产品。产品 MDX、curated、推荐、中文路径和 Learn release 不进入 Corpus。Corpus 入库工作流停用时删除本 Skill。
