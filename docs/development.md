# 开发

在本仓库运行 `npm ci`、`npm run check:types`、`npm run check:content`、`npm test`。类型检查不包含 DOM lib。自动边界检查禁止 React/DOM/storage、跨仓库导入和未声明依赖。产品 UI、产品搜索、MDX schema 与产品测试不得加入。

`npm run build` 生成编译后的 `lib/` 和类型声明并复制 canonical books，`npm run release` 在类型、数据、边界和测试通过后打包。构建产物不能当作编辑源。新增 release 需要同时更新包版本和 `src/index.ts` 的 contentRelease；正文 ID/version 只因真实内容修订改变，不能随打包日期变化。

## 文字质量：体检与对校

`check:content` 只证明身份、版本和来源对得上，不看文字读起来对不对。另有两条命令：

- `npm run corpus:audit`：逐书数读者会看到的破损：私用区字、占位符（□■）、拆字（{白大}、[斯/瓦]）、来源标记、汉字间的半角标点、夹杂的拉丁字母和假名、字间空格、引号不配对的章、无标点的章，并记下每部书的来源和简繁。结果写进 `corpus/quality.json` 并提交。`npm run corpus:audit -- --check` 与记录的数字比较，哪一项多了就失败；`npm run release` 带这一步。数字变多而确属应当时（比如新收了一部书），重跑不带 `--check` 的命令记下新数字。这些计数很粗，零不等于校对过。
- `npm run corpus:collate -- <书> <维基文库根标题> [--out 文件.md] [--offline]`：取维基文库上另一个本子（根页面和全部子页面的当前修订，存进原始缓存），和本书逐字对齐，列出字不同、本书少字、本书多字。比较时只看汉字，繁简折叠，标点和注文括号不计；每段先在对校本里定位再求差异，差异短而两头相合才报，一方独有的整段注疏跳过。形近字排在最前，两本惯用字不同（同一对字出现三次以上）归到最后一行。

对校的结果是候选，不是订正清单：对校本只是另一个本子，自己也会错，异文也不是错字。2026-11 的做法是每条候选再找一样独立依据（第二个本子、同篇他处、同段古注、本库里引同一句的书），本书字句讲不通才写进清单，再走 `content:correct`。新书入库或换来源后，先对校一遍再发布。

## 历史分卷

全部旧版本文字（records）和版本迁移（transitions）存在 `src/history/` 的几卷里，`src/history/index.ts` 按先后列出各卷；包导出的 `transitions`、`historicalReferences` 和脚本读到的，都是各卷依次合并的结果，与从前单个 `src/history.json` 的内容和顺序相同。

- `0001.json`：2026-11-23 拆卷时的整份历史（到 2026-11-23-corrections21 为止，一百多 MB），由 Git LFS 保存，从此只读。拆卷是把原文件原样挪过来，LFS 对象没变。
- `<release>.json`：每个 release 新增的部分，以 contentRelease 命名，发出后只读。小文件，普通 Git 保存。
- `unreleased.json`：尚未发版的改动。`content:correct`、`content:structure`、`corpus:sync` 等读入合并后的历史，照旧追加或删去几条，写回时只改这一卷：里面是比已封存各卷多出的条目，以及要删去的旧条目的键（`drop`，记录按 `id@version`，迁移按出发的 `id@version`）。合并时每卷先删后加。

“回到旧文本”（一段改回它曾有的文字）要删掉一条旧记录和从它出发的旧迁移；它们若在已封存的卷里，就由 `unreleased.json` 的 `drop` 删去，封存卷不动。撤回（structure 的 withdraw 系列）只追加。删的键在前面各卷里找不到、或同一键加了两次，加载即报错。`check:content` 另外核对已提交的封存卷与 HEAD 逐字节相同，并核对包和脚本读出的历史一致。

`npm run release` 在构建前跑 `npm run history:seal`：把非空的 `unreleased.json` 改名为 `<contentRelease>.json`、加进 index.ts，再放一份空的 `unreleased.json`；它为空时什么也不做。所以 contentRelease 必须在发版前升好：同名卷或 `releases/<contentRelease>` 已存在时拒绝封存。封存后重跑 release（比如打包失败）不受影响；封存后又做了改动，须换一个新的 release 名。一版只新增与改动量相当的字节：每改一段多一条旧文字记录（连标题、来源）和一条迁移，按现有历史平均约 2.6 KB、中位数约 1.3 KB，长段可到十来 KB。

小卷不必归并：它们不走 LFS，数目多了也只是多几行 import。不要把小卷并进 `0001.json`，那会生成一个新的百兆 LFS 对象。若一卷大到十几 MB 以上（比如一次订正几千段），可以在 `.gitattributes` 里把这一卷加进 LFS，再提交。

装好 git-lfs 再克隆或拉取（`brew install git-lfs`，再在仓库里 `git lfs install --local`），否则 `0001.json` 是指针文件，`check:content`、`content:correct` 和打包都会失败。2026-11-06 到拆卷前，单个 `src/history.json` 每发一版就在 LFS 里多一份百兆对象；更早的版本在普通 Git 历史里。GitHub 免费账户含 10 GiB LFS 存储和每月 10 GiB 流量。
