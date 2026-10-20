# 原典、修订与共享拼音

在 Corpus 仓库根操作。新作品入口是 [intake skill](../.agents/skills/wuhua-corpus-intake/SKILL.md) 和 [自动收录流程](corpus-route.md)；不是手写 JSON 或修改产品 vendor。

## 新作品与现有原典

在 `corpus/targets.json` 增加 id/title（可选 priority），执行 `npm run corpus:sync -- <id>`。脚本从固定来源生成 `src/books` 与 `sources/corpus`，raw 缓存不提交。已有来源默认固定，变化只进入候选，不静默覆盖正文。缺页、来源歧义和未知许可保留明确状态，不用模型补写原文。

旧三书的来源仍在 `sources/wikisource.json`。`npm run content:import` 只从固定快照重建历史转换候选，输出 `content/incoming/converted.json`，不作为新作品入口。只有明确要重新下载时才加 `-- --download`。

真实底文更正保留原 ID 和旧 version、sourceText、修订理由、真实审核及 history 映射。自动收录的书同样适用：`check:content` 把带更正的段落还原成 sourceText 再与固定来源比对，缺修订理由、审核人、审核日期或旧版本的 history 记录时拒绝。同一段已有的拼音标注要改指新 version，对应 token 的原字一并更正。所有范围按原文 Unicode 码点 `[start,end)`；不得用繁简转换覆盖底文。修改身份目录时用 `content:catalog` 派生 manifest，不借排序重分配已有身份。

成批的底文更正写成 JSON 清单 `[{book, id, find, replace, reason, nth?, all?}]`，用 `npm run content:correct -- <清单> [--dry-run]` 写入：脚本按上述规则保留 ID、sourceText 与旧版本，追加 revision 历史，并让改动范围之外的拼音、解释标注跟到新版本；改动落在标注范围内时拒绝，需手工处理。审核人用环境变量 `CORRECTION_REVIEWER` 写明真实情况（作者用 `CORRECTION_AUTHOR`）。整段的来源页脚之类用 `corpus/structure.json` 的 `withdraw-tail` 撤下，不要用更正把正文改空。

## 定点拼音写入

目标是给选定原文增加可核验的现代普通话阅读辅助，不批量保存整书机器注音，也不把拼音写回 canonical 正文。

### 候选生成与合并

产品提交通用 JSON 请求数组，每项为 `{target, version, start, end}`；target 必须是规范段落 ID，范围是该段原文的 Unicode 码点。产品先解析别名和节选，只请求实际展示且缺覆盖的范围。Corpus 不解析 MDX 或产品清单。

```sh
npm run pinyin:prepare -- /tmp/pinyin-requests.json /tmp/pinyin-candidates.json
npm run pinyin:apply -- /tmp/pinyin-candidates.json
```

prepare 用整段提供语境，只输出请求范围的 tokens、疑难项、生成器版本和现有标注快照；输出必须是新文件。读完整上下文、核对候选，并在接受的项中填写 `decision.author` 和 `decision.note`（判断依据、具体来源及待审状态），再 apply。没有 decision 的项不写入。未知字或读音规则冲突必须在候选中解决，不能仅凭音节数量通过便接受。

apply 是增量操作：保留旧 token，不自动改读音；重复应用无变化，版本或原文变更、旧标注被改、范围冲突则拒绝。扩展已审标注或修改既有读音需单独编辑及说明，不用生成器覆盖。跨多条活动标注的请求需拆分；同一段多份候选应逐次 prepare/apply，避免依据过期快照写入。通过全部校验后才原子写入 aids。

`@wuhua/corpus/pinyin-core` 统一解析、选择、对齐及节选检查，无 UI 或生成词典依赖；`pinyin-generator` 独立提供候选生成和临时字符串生成；`pinyin-workflow` 提供准备与合并的纯函数。旧 `pinyin` 数据及 `pinyinFor` 接口保持兼容。消费者需显式更新发布包；普通阅读只加载核心与已存标注，生成器仅在写作命令或用户工具需要时加载。

生成器锁定依赖及规则版本，关闭一／不语流变调，保留有依据的词语轻声。规则按词句限定、记录来源，不把一个古文用法推广为单字默认读音。繁体归一化只用于生成输入，原文、token.text 与码点不变；原字的多音候选也参与提示。中途未知字保持原位置，不移动后续读音。候选差异不等于旧读音错误，词典地域差异和语域须结合原句核对。已存标注始终优先。

### 定点编辑


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
