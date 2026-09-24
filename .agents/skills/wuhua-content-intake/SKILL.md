---
name: wuhua-content-intake
description: 为物化间与 Wuhua Learn 入库经典原文、中文解读、学习单元和语言辅助，完成来源核实、结构化编辑、审核及入库验证。用于新增篇章、增补释义与拼音、编写课程、校正内容和整理参考材料。
---

# 物化间内容入库

把材料整理成两站能引用、作者能持续增补、读者记录能继续找回的共享内容。以下路径和命令均以仓库根目录为起点。

## 1. 找到内容层与现有样例

读 [README 的内容编辑说明](../../../README.md)、`packages/content/src/types.ts` 和相近样例，按需查 [内容与记录契约](../../../docs/architecture.md)。检查 `git status --short` 与目标文件 diff，在当前工作上增量编辑。

| 内容 | 编辑位置 | 参照样例 |
| --- | --- | --- |
| 固定底本、原始 wikitext、贡献者和许可 | `public/texts/wikisource.json`；新候选放 `content/incoming/` | 现有 Wikisource 页面快照 |
| 现行正文、稳定段落和旧别名 | `packages/content/src/books/*.json` | `lunyu.json` 的学而首段 |
| 原文历史与修订／拆合关系 | `packages/content/src/history.json` | `tests/model.test.ts` 中的历史引用用例 |
| 中文理解与古注参考 | `packages/content/src/editorial-aids.json` | `xue-er-opening-understanding`、`xue-er-opening-commentary` |
| 学习单元与英文辅助 | `content/learning/*.yaml`；模板 `content/learning/templates/lesson.yaml` | `practice-and-joy.yaml` |
| 对齐拼音 | `packages/content/src/pinyin-aids.json` | `practice-pinyin` |
| 篇章导航 | `packages/content/src/manifest.json` | 使用 `content:catalog` 生成 |

`packages/content/src/legacy/` 承载历史精选、概念、路径和旧导入产物；处理这些条目时沿用其身份与调用方式。

## 2. 获取并核实具体材料

1. 底文优先核对 Wikisource 的作品、版本、页面标题、固定 oldid、贡献历史和许可，保存原始 wikitext。
2. 更新现有三书来源时运行 `npm run content:import -- --download`，检查输出的 `content/incoming/wikisource-*.json`。该命令获取既有三书页面集合；接入时逐项与当前快照比较。
3. 复用 `scripts/import-wikisource.ts` 的清理与转换逻辑，核对模板、标点、异体字和校订符号。新增书种先适配页面结构、章节识别及完整性检查，再转换样本。
4. 为译文、古注、音频、字体分别记录作者／译者、书名、版本或年份、具体链接、权利依据和本次使用方式。
5. 参考 CText 时核实对应原典或注疏页、译者信息和适用条款。将古代材料、具体译者译文、Wuhua 自行编写的说明分别归属；可复用材料按其条件接入，其余提供具体外链供读者对照。
6. rights.author 填实际编写者；AI 起稿标明 AI-assisted draft。rights.source／edition 记录具体对照材料，rights.note 说明本次实际使用方式。引用或改写署名以可核对的原句、版本及对应关系为依据；仅查阅材料时记为对照参考。当前 Learning 正文直接呈现释义，来源详情集中在 Sources。

## 3. 接入正文与稳定引用

- 现行文字写入 books，简繁转换、分句展示与拼音放在辅助层。
- 沿用已有作品、篇章、段落 ID 和旧别名；新增条目一次性分配稳定 ID。当前解析使用 `chapter-作品ID-…`、`p-作品ID-…` 和旧 `ws-作品ID-…` 前缀。章节排序由 number 承担。
- 核对 Chapter.source 固定修订、Paragraph.version，以及 aliases 中保留的文字和范围。
- 修订已使用正文时，先保存旧版本引用快照，再写新版本和 history.transitions 的 revision／split／merge／withdrawn 关系；拆合目标填写明确范围，让旧笔记仍能查看当时文字。
- 校订底文时用 sourceText 保存原始转录，在 correction 记录原因和审核，使现行文字、固定来源与历史快照相互对应。
- 新书接入时同步核对 `legacy/works.ts` 的作品元数据、转换器支持、目录排序和检查器读取路径。

`npm run content:import` 从当前快照重建 `legacy/fulltext.json`。把转换产物与规范 books 对照，再完成稳定 ID、别名和历史关系的接入。

## 4. 按 YAML 模板编写课程

```sh
npm run lessons:new -- my-lesson
# 编辑 content/learning/my-lesson.yaml，填写 TODO
npm run lessons:generate
npm run check:content
```

已有课程直接编辑同名 YAML；`packages/content/src/learning-units.json` 由生成命令维护。模板见 [lesson.yaml](../../../content/learning/templates/lesson.yaml)，具体填写方式见 [README](../../../README.md#新增或编辑-learning-课程)。未完成的候选可放在 `content/incoming/`；模板中的示例引用换成实际原句后，同步节选范围和拼音引用。

| YAML 数据 | 编写与核对方法 | 显示位置 |
| --- | --- | --- |
| `lesson.id`／`version`／`order` | 冻结身份，按实际内容修订处理版本，order 仅调整排序 | 路由、记录、目录 |
| `lesson.refs` | 引用共享底文，核对版本、出处和 Unicode 码点半开区间 | 首页及目录中文原句、Read、练习回看、分享和打印 |
| `lesson.pinyinAidIds` | 对应共享拼音层，按完整底文位置核对 token、多音字与异体字 | 原句上的可选拼音 |
| `sections.meaning` | 直接解释本句意思，使用易懂英文 | 首页及目录英文释义、Read 的 Meaning |
| `sections.wordsToNotice` | 至多两句解释关键字词及本句读音 | Words to notice |
| `sections.context` | 解释周围原文如何帮助理解本句，附具体对照材料 | Explore the context |
| `lesson.exercises` | 问题、选项、答案和反馈对应本课已展示的材料；保留题目 ID | Try it |
| `lesson.reflection`／`goal` | 回想围绕本句，允许英文；目标具体可完成 | Reflect 及学习回顾 |
| 每节 `review`／`rights` | 填实际作者、审阅者、来源、使用方式及针对的原文版本 | 审核门槛与 Sources |

`sections` 的名称由生成器映射为对应 Aid kind。每节的 id、target、version、start／end 以及 review.textVersion 与原文引用相互对应。用 `Array.from(source).slice(start, end).join('')` 核对节选。可选 teachingParaphrase 保持中文教学改写身份；历史 intro 字段可省略，当前页面不展示。

以 `practice-and-joy.yaml` 为完整材料样例，确保每课独立提供题目所需信息；确有必要的已学知识才填 prerequisites。课程流程固定为 Read → Try it → Reflect。首页和目录使用中文原句＋英文释义，Read 使用固定完整模块，具体页面约定见 [页面内容清单](../../../docs/ui-plan.md#learning-页面内容清单)。新增课程通过数据接入这些组件。

中文辅助仍在 editorial-aids 编写：explanation-zh 提供直接可读的白话，commentary-zh 提供可展开的古注参考；各自记录原文范围、具体材料和实际审核状态。

## 5. 审核与验证

AI 起稿及待核材料标 draft，记录编写者和参考依据。人工审核完成后填写 reviewer、reviewedAt、textVersion 和实际权利信息，再更新相应材料及单元状态。通过 `learning.ts` 的 isReady 核对审核完整度。公开可用同时读取 learning-release.json 的明确发布清单；收到具体发布授权后记录 ID／版本，保留真实 review，新增 YAML 草稿默认不公开。

按实际改动选择检查；纯课程编辑先生成并检查内容，公共组件及内容契约变化再执行相应回归：

```sh
npm run lessons:generate # 校验课程 YAML 并生成运行时 JSON
npm run content:catalog   # books／目录变化后生成导航
npm run content:assets    # 从规范正文生成两站静态 JSON
npm run check:content     # 来源、身份、范围、拼音和审核字段
npm test                 # 导入、修订兼容和学习契约
npm run build            # 内容检查与双站构建
```

先按页面清单走读：确认首页原句与英文释义对应，Read 的释义／词义／背景各有用途，练习所需信息已展示，回想围绕本句。将发现的重复、缺项或歧义修回数据，再验证对应页面。

在开发站核对原文、简繁、标点和缺失辅助；通过 `?preview=1#/unit/单元ID` 检查 Read → Try it → Reflect。检查 Sources 署名与本课节选。新增课程沿用 UnitSummary、UnitReader、LessonPassage、PassageActions、ShareCard、PrintPreview；内容任务核对材料、范围、读音、题目依据及数据驱动展示。公共控件的保存、分享、打印与布局回归在这些组件或调用契约变化时执行；新内容触及已有模型未覆盖的多段、特殊字符或超长范围时，针对该样例验证。版本有变化时，用合成旧记录检查链接、收藏、笔记、完成状态及导出恢复。

确认两站共享文字一致，新增篇章或单元能由数据驱动显示。接入内容发布批次时同步 `packages/content/src/index.ts` 的 contentRelease、静态资源和该版本所需来源档案。

## 6. 交付与维护

在 `docs/worklog.md` 追加目的、来源证据、决定、实际变化、已执行验证、剩余审核和下一步。给用户提供内容入口、审核状态、兼容影响和验证结果，按事实区分已获取、已入库、已审核和已上线。

随真实入库任务修订本 Skill；当仓库命令完整承接人工步骤时，将入口收敛为命令说明并移除重复步骤。
