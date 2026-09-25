# 原典、修订与共享拼音

在 Corpus 仓库根操作。新作品入口是 [intake skill](../.agents/skills/wuhua-corpus-intake/SKILL.md) 和 [自动收录流程](corpus-route.md)；不是手写 JSON 或修改产品 vendor。

## 新作品与现有原典

在 `corpus/targets.json` 增加 id/title（可选 priority），执行 `npm run corpus:sync -- <id>`。脚本从固定来源生成 `src/books` 与 `sources/corpus`，raw 缓存不提交。已有来源默认固定，变化只进入候选，不静默覆盖正文。缺页、来源歧义和未知许可保留明确状态，不用模型补写原文。

旧三书的来源仍在 `sources/wikisource.json`。`npm run content:import` 只从固定快照重建历史转换候选，输出 `content/incoming/converted.json`，不作为新作品入口。只有明确要重新下载时才加 `-- --download`。

真实底文更正保留原 ID 和旧 version、sourceText、修订理由、真实审核及 history 映射。所有范围按原文 Unicode 码点 `[start,end)`；不得用繁简转换覆盖底文。修改身份目录时用 `content:catalog` 派生 manifest，不借排序重分配已有身份。

## 定点拼音写入

目标是给选定原文增加可核验的现代普通话阅读辅助，不批量生成整书注音，也不把拼音写回 canonical 正文。

1. 找到稳定 paragraph ID、version 与所需范围；从 `src/books` 读取原文，用 `Array.from(text)` 确认码点，先核对多音字和语境。
2. 检查 `src/pinyin-aids.json` 是否已有同 target/version 的非 withdrawn 标注。能扩展原标注时复用该条，保留已有 token；不要追加一个与已有范围重叠的活动候选。
3. 新 token 为一个原文汉字、一个字典声调音节及准确 start/end。标点不占音节，轻声按词语用法处理。扩展显式 start/end 时包含所有旧新 token；不通过修改旧读音来消除拼接冲突，冲突需回查来源。
4. 填真实 review、textVersion 与 rights。AI 辅助稿保持 draft，rights 说明来源、阅读依据及待审状态；不能把拼音标注误称为古代实际读音。
5. 运行 `npm run check:content`、`npm run check:types`、`npm test`、`npm run build`；核对目标节选及其使用处。技术检查不等于人工读音审核。

一个版本范围有互相冲突的活动候选时先解决歧义，不让产品随机选用。Learn 额外检查所引用范围的逐字完整性与候选歧义；缺少覆盖可不显示拼音，错误对齐不能发布。

新增 annotation 或真实更正都通过新 Corpus release 分发。已经分发的包保持不变，产品显式升级；不要修改旧压缩包来补标注。

## 归属与交付

共享 aids 位于 `src/pinyin-aids.json` 和 `src/editorial-aids.json`，原典和来源留在 Corpus。Learn 的英文解释、现代例句、Phrase 拼音、MDX metadata 和公开清单由 Learn 编写；中文产品的阅读路径和展示文案由中文产品维护。

检查通过后按 [发布流程](deployment.md) 打包。生成包不会自动升级或部署任何产品。
