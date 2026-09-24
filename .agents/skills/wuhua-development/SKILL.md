---
name: wuhua-development
description: 在物化间中文阅读站、Wuhua Learn MDX Reading 和共享 UI 上实施功能、修复交互及调整界面。用于双应用开发、旧本机记录兼容、分享图片与打印预览；纯内容编写使用 wuhua-content-intake。
---

# 物化间开发

先核对本轮任务、仓库状态与相关入口。当前实现由 [架构](../../../docs/architecture.md)、[产品](../../../docs/product.md) 和 [界面约定](../../../docs/ui-plan.md) 说明；旧工作记录保留历史，不覆盖用户的新目标。

## 找准边界

| 任务 | 入口 |
| --- | --- |
| 中文首页、导航、阅读、回味 | `apps/reading/src/App.tsx`、`Reader.tsx`、`model.ts` |
| Learn 站点与路由 | `apps/learning/src/App.tsx` |
| Home / Explore / Reading / Saved / Sources | `apps/learning/src/pages/` |
| Reading 元数据与加载 | `apps/learning/src/reading/schema.ts`、`registry.ts` |
| 文章布局和来源 | `reading/ReadingLayout.tsx`、`reading/Provenance.tsx` |
| MDX 作者组件 | `apps/learning/src/mdx/Phrase.tsx`、`ClassicQuote.tsx` |
| MDX 校验与 Vite 接入 | `scripts/readings.ts`、`scripts/reading-plugin.ts` |
| 新文章记录／旧记录桥 | `reading/records.ts`、`reading/legacy.ts` |
| 共享主题与存档 | `packages/ui/components.tsx`、`data.ts`、`useLocalData.ts`、`base.css` |
| 原文分享 | `packages/ui/ShareCard.tsx`、`share-image.ts`、`text-layout.ts` |
| 字帖 | `apps/learning/src/PrintPreview.tsx`、`print-layout.ts` |

Learn 的 Reading 是独立 MDX 短文，没有课程阶段、完成门禁或 prerequisite。先判断既有代码是否服务当前目标，不为保留旧页面而重建课程框架。

## 实施

- 经典仍只有 `packages/content/src/books` 一份 canonical source；MDX 用 ID / version / start / end 引用，不复制底文。范围为 Unicode 码点。
- MDX 正文不负责页头、路由、主题或来源 UI。普通文章无需固定栏目；第一阶段只有 Phrase 和 ClassicQuote 两个作者组件。
- 元数据变动在构建期验证。新 MDX 自动发现，不修改 App 或生成正文 JSON。review 与 release manifest 分开。
- Learn 保留 `wuhua:learning:v1`。新记录用 Reading 身份，旧 progress 等字段只留在兼容存档和导出，不能污染新 Reading 类型。
- 写入继续用 local.update 函数式更新；失败状态和多标签冲突可见，未知／损坏存档不可被空数据覆盖。
- 沿用共享色彩、字体和触点。布局用真实文章检查长句、标题、字号、日夜和手机宽度。
- 分享预览与下载同 Blob；打印预览与输出同分页模型。转换不修改 canonical text；字体失败有明确出口。

## 针对性验证

```sh
npm run check:types
npm test
npm run check:content
npm run build:reading
npm run build:learning
```

单站纯 UI 改动按实际影响选检查；共享内容／契约变化检查两站。Learn 重点验证自由正文、编译错误、版本／范围、未发布门禁、旧数据保留。不要保留强制课程测试。

浏览器使用隔离 origin 和合成存档：先确认没有已有数据，再测试新收藏／笔记、刷新、旧记录和 JSON 导出。390px / 1440px 查看截图；检查 Home、Explore、Reading、Saved 与来源。设置、失败重试和分享打印按调用变化回归。实际生成的 PNG / PDF 要打开检查。

开发 `dev` / `dev:learning`，生产预览 `preview` / `preview:learning`；用 `-- --port 48735` 等空闲端口，不能清理未知服务或旧存档。开发草稿入口 `?preview=1#/explore`；生产构建不会因此公开草稿。结束后关闭本次测试资源。

## 文档与交付

按任务范围同步实际界面、数据契约和作者工作流。涉及 Learn 模型变化时检查两个项目 Skill，删去失效入口。用户要求执行记录时在同一 worklog 追加实际验证，不复制完整设计。

报告真实结果、未测事项及部署状态。main 推送可能自动部署中文站，Learn 是独立目标；发布需匹配授权，不能误用根项目绑定。
