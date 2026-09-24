---
name: wuhua-development
description: 开发物化间中文阅读站；用于 Reader、中文 UI、storage、路径和兼容修复，不处理 Learn 或 Corpus 原文。
---

# 中文站开发

先读 [架构](../../../docs/architecture.md) 和 [开发](../../../docs/development.md)。入口是 `src/App.tsx`、`Reader.tsx`、`model.ts`；UI/storage 属于 `src/ui/`，中文精选、路径和概念展示属于 `src/content/`。

保留 `wuhua:reading:v2`、旧 v1 显式迁移、hash URL、引用快照、冲突副本和无法解析记录。不要重写已工作的 storage。复制来的 UI 是本产品代码，修改不要求 Learn 同步。

只通过已锁定的 `@wuhua/corpus` 使用经典；不得相对路径 import 兄弟仓库或编辑 vendor 底文。升级见 [部署](../../../docs/deployment.md)。

按影响执行 `npm run check:types`、`npm run check:content`、`npm test`、`npm run build`。浏览器用隔离本地 origin 与合成存档，检查首页、Library、Reader 清读/解读、路径、笔记、来源。修改分享时验证实际图像。

部署与推送需明确授权，不能从本地构建推断线上状态。若中文产品取消，删除本 Skill。
