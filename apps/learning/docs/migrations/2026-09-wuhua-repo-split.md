# 2026-09 · Wuhua 仓库拆分

## Before / dependency map

起点为本地干净 main（2026-09-24 的 Learn philosophy reading 实现）。本次未读取或修改生产部署配置状态，也未查询远程仓库是否已创建。

```text
reading  -> packages/content/index (works, paths, concepts, canonical)
         -> curated -> legacy/catalog -> 中文文本、注释、路径
         -> packages/ui (React、storage、主题、分享、蝴蝶)
learning -> packages/content/index (间接带入中文 paths/concepts 展示)
         -> packages/content/learning-release.json
         -> packages/ui + 根 content/learning/*.mdx
scripts  -> build-content-assets 写共同 public/texts/books
         -> check-content 同时校验 Corpus、中文 catalog、Learn MDX/release
         -> readings / reading-plugin 直接读取 Learn schema 和 shared content
 tests   -> content-import 混合来源/catalog/display
         -> visual 混合品牌轨迹与 Learn writing
         -> presentation 混合分享文字与 Learn 打印
 Vercel  -> 两份配置均执行全量 check:content 和 npm test
```

直接 build:reading 原来不解析 Learn MDX，但两站 tsconfig 都 include 全部 packages；两份部署配置都检查 Learn。build:learning 的 Vite 插件解析 MDX，content index 仍引入中文产品资料。根 public 同时承载快照、字体、许可和两站生成文本。

## Decisions

共享稳定事实，不共享产品。Corpus 负责 canonical/identity/version/provenance/history/pinyin/可溯源 aids/schema/reference/validation；两个产品拥有各自的页面、存档、主题、分享、搜索与编辑发布流程。

取消 packages/ui。复制的小型品牌/UI/storage/helper 现在由产品分别维护，未来修改无需同步。中文概念 description 和 related 含页面与引导语义，因此留在中文站；Corpus 仅提取原中文 identity。没有重写既有概念文案，没有建立 ontology。

editorial aids 有 ID、source target、version/range、review、rights，符合可复用知识条件；它们原样保留在 Corpus。中文 legacy annotations、curated、paths 属于产品，不因可能复用而共享。

Corpus 采用本地 versioned tarball：包内为编译 JS、类型声明、canonical 静态数据与来源。产品各自 vendor + package-lock integrity + corpus-lock.json 固定版本，不使用 workspace link、submodule、registry、CDN、数据库或服务。新源码提交不会更新 vendor 或生产站。产品可独立升级，回滚完整产品部署同时回滚其 JS 与数据。

## Classification / Migration

以下 target 相对最终所有者仓库根；phase 1 分别置于 apps/reading、apps/learning、packages/corpus。

| CURRENT PATH | OWNER | TARGET PATH | REASON |
| --- | --- | --- | --- |
| packages/content/src/books | CORPUS | src/books | 唯一现行 canonical source，正文/身份不改 |
| manifest.json | CORPUS | src/manifest.json | 原书章 identity 目录 |
| history.json | CORPUS | src/history.json | 跨产品旧引用/修订映射 |
| pinyin-aids.json、pinyin.ts | CORPUS | src/ | 原文版本/码点对齐辅助 |
| editorial-aids.json、editorial.ts | CORPUS | src/ | 有 ID/target/version/review/rights 的共享知识 |
| types.ts、validate.ts、index reference helpers | CORPUS | src/ | 静态契约与解析、无 UI |
| legacy/concepts.ts 的键 | CORPUS | src/concepts.json | 16 个既有稳定身份，无展示文案 |
| legacy/works.ts 的 id/title/roman | CORPUS | src/works.json | 作品标识与名称 |
| legacy/concepts.ts 的展示定义和关系 | READING | src/content/legacy/concepts.ts | 中文读者引导；含“本页”语义 |
| legacy/works.ts 完整展示配置 | READING | src/content/legacy/works.ts | 色彩、符号、推荐文案 |
| curated.ts、legacy/annotations、paths、catalog 等 | READING | src/content/ | 精选、解读、寻径、旧记录兼容 |
| legacy/fulltext.json、fulltext.ts | READING | src/content/legacy/ | 冻结旧档案，不再生成现行底文 |
| learning-release.json | LEARNING | content/learning-release.json | Learn 独立公开版本 |
| content/learning/*.mdx | LEARNING | content/learning/*.mdx | Learn 唯一正文编辑源 |
| apps/reading | READING | src、index.html、vite.config.ts | 中文产品 |
| apps/learning | LEARNING | src、index.html、vite.config.ts | Learn 产品 |
| ui/HomeButterfly、lorenz-renderer、AidCredits、PassageActions | READING | src/ui/ | 当前只有中文运行时使用 |
| ui/BrandMark、lorenz、ThemeToggle、ErrorBoundary、components | READING | src/ui/ | 中文自行拥有副本 |
| 同上小型基础 UI | LEARNING | src/ui/ | Learn 自行拥有副本 |
| ui/data、useLocalData、ShareCard、share-image、text-layout、base.css | READING | src/ui/ | 原样迁移，保护存档与分享行为 |
| 同上存档/分享模块 | LEARNING | src/ui/ | 原样复制，允许以后分化 |
| content/display.ts、opencc.d.ts | READING | src/content/display.ts、src/opencc.d.ts | 字形是呈现，不是 canonical |
| 同上显示模块 | LEARNING | src/content/display.ts、src/opencc.d.ts | 独立显示实现 |
| public/texts/wikisource.json | CORPUS | sources/wikisource.json | 固定 provenance 事实源 |
| public/fonts、licenses | READING | public/fonts、licenses | 产品静态资产副本 |
| 同上字体、许可 | LEARNING | public/fonts、licenses | 产品静态资产副本 |
| public/texts/books 生成物 | READING | public/releases/{release}/books | 从本产品锁定的包生成 |
| 同上生成物 | LEARNING | public/releases/{release}/books | 与中文输出目录完全隔离 |
| scripts/import-wikisource、catalog-content、read-book、Corpus validation | CORPUS | scripts/ | 离线来源转换、数据校验 |
| scripts/readings、reading-plugin | LEARNING | scripts/ | MDX、Learn schema/release 校验 |
| check-content 的 catalog 部分 | READING | scripts/check-content.ts | 中文产品内容检查 |
| build-content-assets | READING | scripts/build-content-assets.ts | 只复制自己锁定的产物 |
| build-content-assets 副本 | LEARNING | scripts/build-content-assets.ts | 不读取 Corpus 源码 |
| tests/content-import 的来源/身份检查 | CORPUS | tests/content-import.test.ts | Corpus 自身契约 |
| tests/content-import 的 catalog/display；model | READING | tests/ | 中文内容、存档兼容 |
| tests/readings、打印与 writing | LEARNING | tests/ | MDX/公开过滤/旧 Learn 数据 |
| 品牌轨迹、文字换行测试 | READING | tests/ | 复制代码由自己验证 |
| 同上品牌/分享测试 | LEARNING | tests/ | 不跨产品运行测试 |
| 根 package/tsconfig/混合 docs | TEMPORARY | staging 分支 | 只保留迁移汇总，非产品依赖 |
| 根两份混合 Skill | TEMPORARY | staging 指向三个精确 owner | 独立仓库各自具备专属 Skill |

Corpus 导出的共享项目均属于数据或身份契约；没有 shared UI。根锁文件不再解析子项目，三个项目各自拥有锁文件及显式依赖。

## Phase 1 verification

实际执行：

- Corpus：`npm install`（离线缓存）、`npm run check:types`、`npm run check:corpus`、`npm test`、`npm run release` 通过。发布包最初直接带 TS 导致 Node/Vite 配置加载失败，已改为 JS+声明文件并重新验证；初始候选未分发。
- Reading：`npm install`（缺失的固定 three 包从 npm 获取）、`npm test`、`npm run build` 通过。
- Learn：`npm install`（缓存）、`npm test`、`npm run build` 通过。补充原来隐式使用的 @types/mdx、@types/mdast、vfile 直接开发依赖，没有升级既有功能依赖。
- 隔离实验：临时移走另一产品目录和 Corpus 源码，分别运行 `npm run test:reading && npm run build:reading`、`npm run test:learning && npm run build:learning`，均通过。两站 public 内容摘要分别保持不变。目录均在 finally 中恢复。
- 边界负例：给产品临时加入跨仓库源码导入，`check:boundaries` 拒绝；fixture 已删除。
- 三本 books、manifest、history、pinyin-aids、editorial-aids、固定来源快照与起点逐字节相同。书籍/章节/段落/alias ID、version、范围不改。仅数据包 release 从旧批次转为新的拆分批次。
- 两站只保留现有 OpenCC 大字典及中文蝴蝶渲染 chunk 体积告警，构建成功。

## Compatibility

路由源码只改 import，保留中文 hash 路由、/sources、Learn #/unit 旧链接与 MDX 路由。保留 wuhua:reading:v2、wuhua:learning:v1、旧迁移、未知引用、草稿、历史 progress、答案、冲突副本与备份语义。storage 模块除 import 路径外没有重写。

经典加载改用同站带 release 的路径。固定来源下载仍保留 /texts/wikisource.json。旧部署仍自带旧静态资源，新部署不依赖旧站或在线 Wikisource。

## Remaining / production migration

未创建或删除任何远程 repo/branch，未 force push，未推送，未改 Vercel 项目或域名，没有操作真实用户数据。目标仍为 nickwang5h/wuhua、nickwang5h/wuhua-learn、nickwang5h/wuhua-corpus。需要单独授权远程创建/推送/绑定/生产切换。

各仓库 docs/deployment.md 提供 root directory、install/build/output、preview、域名保留与回滚步骤。内容仍保留原 draft 审核状态，未把迁移验证当作教学或文义审核。刻意保留中文 legacy 兼容资料与两个产品的旧存档结构。
