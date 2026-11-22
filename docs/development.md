# 开发

`src/history.json`（全部底文更正的旧版本，六十多 MB）自 2026-11-06 起由 Git LFS 保存，此前的版本仍在普通 Git 历史里。克隆或拉取前装好 git-lfs（`brew install git-lfs`，再在仓库里 `git lfs install --local`），否则拿到的是指针文件，`check:content`、`content:correct` 和打包都会失败。GitHub 免费账户含 10 GiB LFS 存储和每月 10 GiB 流量，这个文件每改一版约占 60 MB。

在本仓库运行 `npm ci`、`npm run check:types`、`npm run check:content`、`npm test`。类型检查不包含 DOM lib。自动边界检查禁止 React/DOM/storage、跨仓库导入和未声明依赖。产品 UI、产品搜索、MDX schema 与产品测试不得加入。

`npm run build` 生成编译后的 `lib/` 和类型声明并复制 canonical books，`npm run release` 在类型、数据、边界和测试通过后打包。构建产物不能当作编辑源。新增 release 需要同时更新包版本和 `src/index.ts` 的 contentRelease；正文 ID/version 只因真实内容修订改变，不能随打包日期变化。

## 文字质量：体检与对校

`check:content` 只证明身份、版本和来源对得上，不看文字读起来对不对。另有两条命令：

- `npm run corpus:audit`：逐书数读者会看到的破损：私用区字、占位符（□■）、拆字（{白大}、[斯/瓦]）、来源标记、汉字间的半角标点、夹杂的拉丁字母和假名、字间空格、引号不配对的章、无标点的章，并记下每部书的来源和简繁。结果写进 `corpus/quality.json` 并提交。`npm run corpus:audit -- --check` 与记录的数字比较，哪一项多了就失败；`npm run release` 带这一步。数字变多而确属应当时（比如新收了一部书），重跑不带 `--check` 的命令记下新数字。这些计数很粗，零不等于校对过。
- `npm run corpus:collate -- <书> <维基文库根标题> [--out 文件.md] [--offline]`：取维基文库上另一个本子（根页面和全部子页面的当前修订，存进原始缓存），和本书逐字对齐，列出字不同、本书少字、本书多字。比较时只看汉字，繁简折叠，标点和注文括号不计；每段先在对校本里定位再求差异，差异短而两头相合才报，一方独有的整段注疏跳过。形近字排在最前，两本惯用字不同（同一对字出现三次以上）归到最后一行。

对校的结果是候选，不是订正清单：对校本只是另一个本子，自己也会错，异文也不是错字。2026-11 的做法是每条候选再找一样独立依据（第二个本子、同篇他处、同段古注、本库里引同一句的书），本书字句讲不通才写进清单，再走 `content:correct`。新书入库或换来源后，先对校一遍再发布。
