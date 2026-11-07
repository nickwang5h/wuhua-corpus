# 开发

`src/history.json`（全部底文更正的旧版本，六十多 MB）自 2026-11-06 起由 Git LFS 保存，此前的版本仍在普通 Git 历史里。克隆或拉取前装好 git-lfs（`brew install git-lfs`，再在仓库里 `git lfs install --local`），否则拿到的是指针文件，`check:content`、`content:correct` 和打包都会失败。GitHub 免费账户含 10 GiB LFS 存储和每月 10 GiB 流量，这个文件每改一版约占 60 MB。

在本仓库运行 `npm ci`、`npm run check:types`、`npm run check:content`、`npm test`。类型检查不包含 DOM lib。自动边界检查禁止 React/DOM/storage、跨仓库导入和未声明依赖。产品 UI、产品搜索、MDX schema 与产品测试不得加入。

`npm run build` 生成编译后的 `lib/` 和类型声明并复制 canonical books，`npm run release` 在类型、数据、边界和测试通过后打包。构建产物不能当作编辑源。新增 release 需要同时更新包版本和 `src/index.ts` 的 contentRelease；正文 ID/version 只因真实内容修订改变，不能随打包日期变化。
