---
name: wuhua-content-intake
description: 拆分 staging 的入口指引；具体操作使用对应独立项目 Skill。
---

# 拆分后入口

本分支仅保留迁移历史。中文任务读 `apps/reading/.agents/skills/`，Learn 任务读 `apps/learning/.agents/skills/`，canonical 来源/拼音/release 任务读 `packages/corpus/.agents/skills/`。每份 Skill 的相对路径以所在独立项目为根。

不要再使用 packages/ui、packages/content 或根共享内容检查作为产品开发契约。完成物理拆仓后本入口随 staging 留存，不复制到独立产品。
