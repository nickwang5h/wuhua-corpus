---
name: wuhua-development
description: 在物化间 reading、Wuhua Learn learning 和共享 UI 上实施功能、修复交互及调整界面，完成针对性的本地验证与交付记录。用于本项目页面修改、用户记录兼容、分享图片、打印预览及双应用开发。
---

# 物化间开发

从当前工作区完成用户要改的具体行为，验证读者能继续阅读、学习和找回记录。以下路径和命令均以仓库根目录为起点。

## 1. 把请求落到当前实现

1. 读项目规则和 [README](../../../README.md)，查看 `git status --short`、当前分支及相关 diff，把已有修改作为增量起点。
2. 对照截图或描述，确定页面、状态、操作及实际问题，用 rg 定位 JSX、样式、数据与调用链。
3. 按需查阅 [产品](../../../docs/product.md)、[架构](../../../docs/architecture.md)、[界面约定](../../../docs/ui-plan.md)，把当前用户修正落实到代码与有效约定。
4. 修改 Learning 页面时，逐项对照 [页面内容清单](../../../docs/ui-plan.md#learning-页面内容清单)，列清当前阶段展示的材料、辅助入口与下一步操作。把字形／字号／主题放在顶栏 Settings，把拼音开关及帮助放在课程 Reading aids；按清单复核 Read、Try it、Reflect 的内容顺序。
5. 选取能直接检验结果的场景，例如去重链接、取消相邻双边框、保存失败时仍显示 Save，或下载文件与预览完全一致。

## 2. 找准修改位置

| 任务 | 主要入口 |
| --- | --- |
| 中文首页、导航、页脚 | `apps/reading/src/App.tsx` |
| 原文、解读、回味和阅读位置 | `apps/reading/src/Reader.tsx`、`model.ts` |
| Learning 首页、课程入口、Sources | `apps/learning/src/App.tsx` |
| 首页／目录的中文原句与英文释义 | `apps/learning/src/UnitSummary.tsx` |
| Read → Try it → Reflect 导航 | `apps/learning/src/UnitReader.tsx`、`model.ts` |
| 完整阅读页 | `apps/learning/src/LessonPassage.tsx` |
| 两站共用收藏／分享／可选打印按钮 | `packages/ui/PassageActions.tsx` |
| 单题、反馈、题目位置 | `apps/learning/src/PracticeQuestion.tsx`、`model.ts` |
| 共享主题、设置、原文和对话框 | `packages/ui/base.css`、`components.tsx`、`ThemeToggle.tsx` |
| 本地存档和失败／冲突处理 | `packages/ui/data.ts`、`useLocalData.ts` |
| 分享图、预览与下载 | `packages/ui/ShareCard.tsx`、`share-image.ts`、`text-layout.ts` |
| 字帖设置、分页与打印 | `apps/learning/src/PrintPreview.tsx`、`print-layout.ts` |
| 字体与蝴蝶资源 | `public/fonts/lxgw-wenkai-gb-screen/`、`packages/ui/BrandMark.tsx`、`HomeButterfly.tsx`、`lorenz-renderer.ts` |

各站业务流程在各自应用实现，相同基础控件放共享 UI，原文与来源从 packages/content 引用。内容入库按 [wuhua-content-intake](../wuhua-content-intake/SKILL.md) 操作。

## 3. 实施修改

### 页面与视觉

先按职责修改一个公共入口，使所有课程一起生效：

- `UnitSummary`：首页推荐、首页课程列表与 Units 共用。按 refs 显示中文原句，按 meaning 显示英文释义，字形跟随设置。
- `LessonPassage`：Read 的完整固定模块，按顺序呈现原句、出处、Meaning、Words to notice、context、Save／Share／Print。它直接提供完整栏目与操作，不接收阶段开关。
- `UnitReader`：仅组织 Read → Try it → Reflect、加载数据与课程状态。进入课程直接 Read，Continue 进入练习。
- `PassageActions`／`ShareCard`／`PrintPreview`：分别承接共用按钮、分享、学习打印；业务记录与引用由应用传入。

新增课程编辑 `content/learning/*.yaml`，经 `lessons:generate` 接入上述组件。字体、栏目顺序和操作位置在公共组件／样式中维护。Meaning 与 Words to notice 共用 lesson-explanation 排版；具体参数以 [ui-plan](../../../docs/ui-plan.md) 为准。

纯内容变更按入库 Skill 检查材料与引用。公共组件或调用契约变化时回归受影响的调用方式；新数据形态按具体样例补测。已有 `tests/lesson-passage.test.ts` 渲染各课完整模块，`tests/learning-stages.test.ts` 检查三阶段，`tests/lesson-authoring.test.ts` 检查 YAML 入库。扩展这些测试覆盖实际修复，确保新增课程自然继承固定结构。

- 复用现有 token、字体和组件，按最新界面约定调整信息顺序、间距和强调程度。
- 重复入口保留用户指定位置；标签准确描述动作，并检查手机上的可发现性、触点和键盘焦点。
- 核对相邻元素各自的边框、margin 和 padding，确定分隔线和留白由哪一层负责。
- 长文与解释自然折行，短句区域随内容增长；保持字号设置、拼音行距和触点有效。
- 用 ruby 标注已确定读音；学习中文使用实际自托管字体，英文 UI 使用系统字体。

### 状态与兼容

- 通过 local.update 的函数式更新和现有 flush 保存，成功反馈以实际持久化结果为依据。
- 根据当前实际发布及数据状态评估影响；测试阶段使用合成数据验证行为。涉及存储格式变化时检查快照、版本、答案、完成状态与导出恢复，交付按实际情况说明。
- 将缺内容、加载失败、配额失败和多标签冲突接回已有状态出口，用合成数据验证恢复结果。
- 字形与排版作为显示层处理，底文、引用和审核状态按各自内容契约维护。

### 分享与打印

- 分享完成字形转换、字体加载和实测折行后生成 PNG；预览、下载共用同一 Blob。识别过期异步结果，更新和关闭时释放 object URL。
- 调用方提供品牌、出处和可用地址；多段引用提供明确选择。检查节选、主题、字体失败和快速编辑。
- 打印设置保留在面板会话；同一分页模型生成预览与输出，按位置保留整句重复、标点和拼音对齐。
- 检查 A4／Letter、格子尺寸、完整行组和实际页数；打印媒体设置白底黑字及 color-scheme: light，核对夜间界面的 PDF 外边距。

## 4. 启动与针对性检查

```sh
npm run dev               # reading，4174
npm run dev:learning      # learning，4175，另一终端
```

验证可选择空闲的独立端口，例如 `npm run dev -- --port 4574` 与 `npm run dev:learning -- --port 4575`。开发与 production preview 默认共用端口；遇到占用先检查监听进程、命令与所属目录，再复用服务或选择测试端口。学习草稿入口为开发站 `?preview=1#/units`。

| 改动 | 验证方式 |
| --- | --- |
| 单一文案、链接、边框或间距 | 核对 JSX／CSS 与 diff；TSX 变化运行类型检查，布局按需浏览器查看 |
| 阅读／学习状态和保存逻辑 | 类型检查、相关测试、实际成功／失败／刷新路径 |
| 共享内容、基础 UI 或契约 | 相关测试、内容检查、双站构建及两站受影响路径 |
| 分享、字体或打印 | 浏览器实际生成、下载并打开产物，核对布局和状态 |

```sh
npm run check:types
npm test
npm run check:content
npm run build:reading
npm run build:learning
npm run build             # 内容检查＋双站构建
```

新增测试覆盖实际行为、失败恢复和兼容结果。已有检查通过后，将后续验证集中于新改动或仍未解决的问题。

## 5. 浏览器与产物走查

使用当前环境可用的浏览器工具，在隔离测试 origin 放置合成记录。保持验证会话，直到所有截图、下载文件和 PDF 渲染均已检查。

- 布局：390px／1440px 日夜模式；核对实际 innerWidth 与页面／弹窗 scrollWidth，打开截图查看折行、触点、字号和空白。
- 阅读：短句、长段、缺解释、字号和字形切换，以及收藏／回味／离开续读。
- 学习：核对首页原句／释义与 Read 内容对应，阅读页有完整词义、背景与操作；走 Read → Try it（错答重试、下一题、返回）→ Reflect；检查首次答案、笔记、收藏和完成记录。检查顶栏 Settings 与课程 Reading aids 各自的控件、手机布局及设置恢复。
- 分享：打开即生成实际图片，将下载文件与预览 Blob 比对；检查品牌、署名、字形、换行、颜色及尺寸，确认最后一次编辑生效。
- 打印：先查站内预览，再生成实际浏览器 PDF，读取页数和尺寸并渲染检查；用“学而时习之，学而时习之。”及加长样例检查重复、标点和分页。
- 资源：检查字体实际请求和失败状态；蝴蝶变化检查减少动态、WebGL 回退、离屏／隐藏停止与卸载清理。
- 发布入口：用本地生产预览核对内容可见性和审核门禁。

按本次改动选择场景，将有说明价值的截图保存到 docs/screenshots。完成产物检查后关闭测试会话，结束本次启动的服务。

## 6. 记录与交付

实施完成后更新实际变化对应的文档：界面规则放 ui-plan，用户操作放 product，数据／分享／打印契约放 architecture，可用命令和入口放 README。过程事实追加到同一份 worklog，记录目的、依据、决定、变更、验证、影响和下一步。

检查最终增量 diff，向用户说明实现结果、验证证据、未测或待审核事项、用户数据影响及部署状态。交付需要发布时，准备好目标、构建产物和验证结论，再按该任务已确认的发布安排执行。

随真实开发修订本 Skill，把具体页面规范留在设计文档；当双站流程被新工程入口接替时，合并或移除相应步骤。
