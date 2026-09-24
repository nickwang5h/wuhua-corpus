# Wuhua repository split staging

此分支保存两阶段拆分的可审查迁移历史。中文产品、Learn 与 Corpus 各有独立安装、锁文件、测试和构建入口；根目录只汇总本地命令，不是产品依赖。

- [中文站](apps/reading/README.md)
- [Wuhua Learn](apps/learning/README.md)
- [Wuhua Corpus](packages/corpus/README.md)
- [迁移记录与文件归属](docs/migrations/2026-09-wuhua-repo-split.md)

首次分别在 `apps/reading`、`apps/learning`、`packages/corpus` 执行 `npm ci`。然后根目录可运行 `npm test`、`npm run check:content`、`npm run build:reading`、`npm run build:learning`。根 `npm install` 不安装子项目，也不把 Corpus 源码链接进产品。

最终独立仓库使用各自根目录的 `npm install`、`npm test`、`npm run build`（Corpus 使用 `npm run release`）。旧根 docs 中已标记的历史记录不再是当前架构规范。没有创建远程仓库、推送或部署。
