# 物化间与 Wuhua Learn 当前架构

更新：2026-09-24。本文描述仓库当前实现；Learn 的产品依据是 [Reading / MDX 决策](decisions/2026-09-24-learning-mdx-readings.md)。历史任务记录不构成当前设计约束。

## 一个仓库、两个静态应用

```text
apps/reading                 中文全文阅读、解读、回味、续读
apps/learning                英文短文 Home / Explore / Reading / Saved / Sources
packages/content             经典原文、固定来源、稳定引用、历史与辅助数据
packages/ui                  共享主题、基础组件、本地存储、备份、分享
content/learning/*.mdx        Learn 唯一正文编辑源
scripts                      来源转换、内容校验、MDX 构建接入
public                       固定来源快照、字体、生成的静态正文
```

两站使用 React / TypeScript / Vite，npm workspaces 管理同一份锁文件。应用之间不互相 import；共享内容不依赖 React 或 localStorage。分别构建 `dist/reading` 和 `dist/learning`，各自部署到 Vercel。没有业务 API、数据库、CMS、账户或云同步。

中文站继续使用现有 hash 路由、书架、清读／解读／回味和本地存档。本次 Learn 重构未修改其页面、规范正文或共享存档格式。

## 经典内容：独立的 canonical source

| 数据 | 当前事实源与职责 |
| --- | --- |
| 固定来源 | `public/texts/wikisource.json` 保存 Wikisource 原始 wikitext、固定 oldid、贡献者及许可 |
| 规范正文 | `packages/content/src/books/*.json` 保存作品、篇章、段落、版本及旧句子别名 |
| 导航 | `manifest.json` 由 `content:catalog` 从正文生成，不重新分配 ID |
| 历史 | `history.json` 保存旧引用及修订、拆分、合并、撤回映射 |
| 拼音 | `pinyin-aids.json` 保存对应原文版本和码点跨度的读音及审核信息 |
| 中文辅助 | `editorial-aids.json` 与 `legacy/` 中现有独立解读、概念、精选及路径 |
| 运行时正文 | `content:assets` 生成 `public/texts/books/*.json`，不人工编辑、不提交 |

外露经典引用使用 `id + version + start + end`。跨度为 Unicode 码点的半开区间，不是 JavaScript UTF-16 下标。经典引句只由共享正文解析，MDX 不另存底文。原文版本必须匹配，范围必须有效；引用解析失败时显示可重试的加载错误。

浏览器按书请求同站 `/texts/books/{id}.json?v={contentRelease}`。成功的请求在会话内复用，失败请求移出缓存，可以重试。响应携带发布标识，加载器拒绝混用不同批次的正文。浏览器运行不依赖 Wikisource 在线可用。

稳定 ID 与顺序、标题分开。正文更正、拆合或撤回需保留历史及明确映射；旧记录保留自己的引用快照，不按相似度静默关联新版本。`legacy/` 是旧精选与兼容档案，不是第二份现行底文。OpenCC 只改变显示字形；共享拼音继续锚定底本码点。

## Reading：自由的 MDX 表达层

一个 `content/learning/{id}.mdx` 就是一篇 Reading。frontmatter 保存机器需要的元数据：身份、版本、标题、摘要、级别、时长、排序、命名经典引用、编辑状态，以及可选相关推荐和参考材料。正文用普通 Markdown，自由决定段落、标题、列表与内容顺序；没有固定释义、练习、回想栏目。

`Reading` 类型定义在 `apps/learning/src/reading/schema.ts`，不含 step、completion、exercise 或 prerequisite。`related` 只是阅读建议；`order` 只是编辑排序。新增纯段落文章不需要经典引用、专用 React 页面或 App 修改。

```text
MDX frontmatter ── Zod / source validation ── metadata-only module
MDX body        ── @mdx-js/rollup            ── lazy React module
                                                │
                         import.meta.glob → registry
                                                │
                                  Home / Explore / ReadingPage
```

没有 YAML 课程文件、正文 JSON 生成物或中间内容数据库。frontmatter 仍采用 YAML 语法，但它只是 MDX 文件的元数据区。`scripts/readings.ts` 共用于内容检查和 Vite 构建检查；`reading-plugin.ts` 提供元数据查询模块，使首页无需加载所有文章正文。元数据模块只存在于构建过程中，不产生需要维护的 JSON 文件。

构建检查覆盖严格字段类型、ID 唯一、文件名与 ID 一致、正整数版本、来源身份／版本／码点范围、相关推荐、发布清单和 MDX 语法。所有草稿同样检查。拼音与中文辅助继续由共享检查器独立验证，不依赖课程类型。

第一阶段只注册两个作者组件：

- `Phrase`：现代汉语词句、显式拼音、英文解释；字形跟随设置。
- `ClassicQuote`：按 `source="main"` 查当前 frontmatter 的命名引用，由共享经典数据得到正文；复用原文展示、OpenCC 和已有对齐拼音。

普通文章不需要组件。作者组件只接受指定的字面字符串属性；拼错名称、漏参、不存在的 source、任意脚本／表达式在编译阶段报错。MDX 不负责路由、全站页头、主题、布局或来源 UI。不是通用页面构建器。

## 页面职责与加载

`App` 负责站点页头、导航、设置、路由和存档实例。`HomePage` 提供一个编辑排序靠前的 Reading 和更多入口；`ExplorePage` 按标题／摘要检索。`ReadingPage` 并行加载正文模块和所需经典正文，负责错误重试、收藏、笔记、分享与打印。

`ReadingLayout` 统一呈现标题／摘要／级别与时长、正文、来源说明、可选动作和相关推荐。文章使用约 680px 的单列正文宽度，手机自然折行。经典出现在文章需要的位置，不要求读者先读古文。没有强制阶段导航、进度条或完成动作。

来源说明在页面框架中展示编写者、真实 review、经典链接和具体参考材料；公开与审阅通过不是一回事。正文中的现代例句与独立英文解释不冒充古典原话或外部译者译文。

分享复用 `packages/ui/ShareCard`，只分享解析出的经典节选，不包含私人笔记。预览和下载复用 PNG Blob。学习站保留通用 `PrintPreview`、`print-layout` 和字体加载：整句保留重复与标点，单字模式才去重；A4 / Letter 预览与打印共用分页数据。文章没有经典引用时不显示引句分享／打印按钮。

## 编辑状态与公开状态

`review` 表达编辑状态和真实编写／审阅者。`packages/content/src/learning-release.json` 只记录允许公开的 Reading ID 与版本。是否 reviewed 不会绕过发布清单，新增 MDX 也不会自动公开。

五篇迁移文章改为 Reading version 2，清单承接这五个现有公开主题；旧课程 version 1 的个人记录没有升级或改写。此处是仓库发布配置，实际部署仍需授权。

开发环境 `?preview=1#/explore` 可以查看未发布草稿，撤回内容除外。生产构建忽略 preview 参数，registry 只含发布清单内文章；未发布元数据返回空模块，草稿正文不进入可公开下载的 JS 产物。所有文章在过滤前仍经过构建校验。

## 用户记录与旧存档

继续使用 `wuhua:reading:v2` 和 `wuhua:learning:v1`；主域、子域、不同浏览器各自独立。没有自动迁移或清空 Learn 的旧 key。

新的 Reading 收藏与笔记以 `reading:{id}` 引用和独立 `reading-bookmark:` / `reading-note:` 记录 ID 保存，附文章版本、标题与摘要快照。不会复用旧课程笔记的 ID。用户数据外层仍为既有 Data 格式，含 schemaVersion、app、contentRelease、revision、settings、records。

`reading/legacy.ts` 是只读兼容桥：旧 `#/unit/{id}` 链接可以打开对应 Reading；旧课程收藏／笔记在 Saved 中保留快照并可链接当前文章，明确标记为早期版本。旧 progress、答案、反馈、exerciseId、completed 字段不参与主页面决策，仍原样保存在存档与完整导出中。新的 Reading 类型不承担这些字段。

共享 `useLocalData` 保持原机制：笔记防抖、失焦／页面离开冲刷，收藏和明确保存立即写入；写后读回核验，失败保留内存数据和导出入口。storage 事件及写前基线检查发现多标签冲突时阻止静默覆盖，由用户保留两份。损坏原串不会被默认空数据覆盖。中文 v1 的显式升级路径不变。

完整 JSON 包含新旧记录、草稿、设置、引用快照和冲突副本，恢复验证 app/schema 后默认合并；同 ID 不同内容保留副本。Markdown 是阅读副本，不是恢复格式。清理浏览器或换设备后只能通过用户保管的 JSON 恢复。

## 构建与部署

根 `npm run build` 执行共享与 MDX 内容检查，再构建两站。直接 `build:learning` 也由 Vite 插件强制检查 MDX，不依赖作者记住额外命令。`npm test` 覆盖正文来源、旧引用、存档保留、MDX 自由正文、编译错误与来源契约；类型检查使用 `npm run check:types`。

本次任务前已核实：GitHub main 推送触发中文 Vercel 项目 wuhua 生产部署，学习项目 wuhua-learn 未绑定 Git。学习站需单独发布；根 `.vercel` 仍绑定中文项目，不能用它误覆盖中文站。重构本地完成不表示线上已切换架构。
