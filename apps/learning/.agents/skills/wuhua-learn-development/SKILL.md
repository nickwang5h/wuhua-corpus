---
name: wuhua-learn-development
description: 开发 Wuhua Learn 页面、MDX 体验、分享打印和本地记录；不修改中文产品或 canonical 数据。
---

# Learn 开发

读 [架构](../../../docs/architecture.md) 和 [开发](../../../docs/development.md)。页面在 `src/pages`，Reading schema/registry/release/records 在 `src/reading`，Phrase 与 ClassicQuote 在 `src/mdx`；MDX 编译与校验在 `scripts/readings.ts`、`reading-plugin.ts`。

UI、主题、storage、分享在 `src/ui`，字帖在 `src/PrintPreview.tsx`、`print-layout.ts`。它们由 Learn 独立维护，无 shared React package。

保留 `wuhua:learning:v1`、旧 unit 链接、旧 progress/答案/草稿/笔记和 JSON 导出；新 Reading 不承担课程门禁。变更用 local.update 函数式更新，损坏存档不得被默认空值覆盖。

Corpus 只通过 vendor 中已锁定发布包消费。ClassicQuote 引用 canonical ID/version/码点范围，不复制底文。开发 `?preview=1` 可见未公开稿；生产必须排除未公开元数据和正文。

运行本仓库 `npm run check:types`、`npm run check:content`、`npm test`、`npm run build`。浏览器用空的隔离 origin 检查 Home/Explore/Reading/Saved/Sources、Phrase/ClassicQuote、旧链接与合成存档；分享打印修改再检查实际产物。Learn 退出维护时删除本 Skill。
