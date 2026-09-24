# 物化间 · Wuhua

一个仓库、两个独立前端、一套经典原文。中文站帮助读者安静阅读并留下理解；Wuhua Learn 以英文和语言辅助带初学者接触经典。两站记录分别保存在本机，没有账户或同步服务。

已确认设计：[产品与范围](docs/product.md) · [架构与兼容契约](docs/architecture.md) · [界面及验收](docs/ui-plan.md)。过程与证据只记在 [worklog](docs/worklog.md)。

## 项目 Skills

- [wuhua-content-intake](.agents/skills/wuhua-content-intake/SKILL.md)：获取来源、接入原文、编写两站辅助、审核和验证入库结果。
- [wuhua-development](.agents/skills/wuhua-development/SKILL.md)：定位修改、实现交互、验证双站与分享打印、记录交付结果。

## 本地运行

沿用 Node.js 22.12+、npm 锁文件和 React／TypeScript／Vite。在仓库根目录执行：

```sh
npm ci
npm run dev            # 中文站 http://127.0.0.1:4174
npm run dev:learning   # 学习站 http://127.0.0.1:4175（另一终端）
```

当前五个学习单元已按本次发布授权公开，直接访问 `https://learn.wuhua.app/` 即可使用，不需要 preview 参数。编写及人工审核状态继续在 Sources 如实记录。新增 YAML 草稿默认不公开；明确发布的 ID／版本记录在 `packages/content/src/learning-release.json`。本地 `?preview=1` 仍供作者查看尚未发布的候选。

当前公开课程：

| 单元 | 原文 | 来源 |
| --- | --- | --- |
| Practice and joy | 學而時習之，不亦說乎？ | 《论语·学而》 |
| A teacher beside you | 三人行，必有我師焉。 | 《论语·述而》 |
| Knowing others, knowing yourself | 知人者智，自知者明。 | 《道德经》三十三章 |
| What counts as enough? | 知足者富。 | 《道德经》三十三章 |
| A different view of “I” | 天地與我並生，而萬物與我爲一。 | 《庄子·齐物论》 |

五课可独立学习，均有英文释义、词义、背景、对齐拼音、两道练习与回想提示。拼音使用字典本调；如“不亦”中“不”标 bù，连续朗读时变调为 bú。英文为 Wuhua 的 AI 辅助草稿，待人工审核；外部对照材料与链接见 Sources；本地编辑复核不代替原文、读音和教学的人工审核。

```sh
npm run check:types
npm test
npm run check:content
npm run build:reading   # dist/reading
npm run build:learning  # dist/learning
npm run build           # 内容检查 + 两站构建
npm run preview         # 中文生产产物，4174
npm run preview:learning # 学习生产产物，4175
```

开发与预览默认端口相同，不能同时启动；测试时可加 `-- --port 4274` 或 `4275`。构建和预览不部署。正文 JSON 在构建／启动开发服务前从共享内容生成，运行时同站按书请求，失败可重试；来源快照也在本地，不依赖 Wikisource 在线可用。

## 当前能力与边界

- 中文：三书全文连续段落、篇章目录、简繁等价检索、旧精选与主题路径、草稿解读、回味／收藏／续读、字号／字体／明暗／拼音设置、原文图片分享。
- 学习：Starting／Building 两级，英文引导、共享原文、对齐拼音、独立译文／文化说明／教学改写、逐题练习及反馈、反思与版本化进度；Read 展示原句及分栏目的 Meaning／Words to notice；顶栏 Settings 调整字形／字号／明暗，课程 Reading aids 控制拼音；Read 均在内容末尾直接 Save／Share／Print（两站复用原文操作控件）；独立字帖预览支持整句、单字、节选及 A4／Letter。
- 两站：完整 JSON 备份恢复、可读 Markdown、未知引用保留、损坏存档保护、保存失败提示、多标签页冲突副本。JSON 包含未提交草稿；Markdown 不用于恢复。
- 当前中文解读和新教学／拼音材料均未完成人工审核。每日推荐只选已审核内容，无候选时显示替代入口。没有音频、账户、云同步或后台。

V3 沿用共享日夜配色、单列阅读、渐进学习与洛伦兹蝴蝶，首页改用完整“周与胡蝶……”引文，收紧短句留白；界面约定及本地截图见 [界面计划](docs/ui-plan.md)。分享弹窗展示实际 PNG，下载复用同一份图片；字帖先站内预览再打印。字体或 WebGL 不可用时分别保留阅读回退与静态标志；练习纸必须等字体加载完成再打印。

## 内容编辑与审核

| 位置 | 用途 |
| --- | --- |
| `public/texts/wikisource.json` | 当前固定修订的原始 wikitext、贡献者与许可，不能被转换覆盖 |
| `scripts/import-wikisource.ts` | 原有三书离线转换器；未知模板报错 |
| `packages/content/src/legacy/` | 旧精选、解读、概念及路径；`fulltext.json` 是离线导入派生产物，不是第二份人工编辑底本 |
| `packages/content/src/books/*.json` | 当前规范正文、稳定段落身份、旧句子别名及版本；只在这里维护现行段落 |
| `packages/content/src/history.json` | 历史原文快照、修订／拆合／撤回的明确映射 |
| `packages/content/src/pinyin-aids.json` | 与原文版本和 Unicode 码点范围关联的拼音，候选与审核状态明确 |
| `content/learning/*.yaml` | 课程编辑事实源，一课一文件；固定栏目、练习、引用与审核 |
| `packages/content/src/learning-units.json` | 自动生成的课程运行时数据，使用 lessons:generate 更新 |
| `packages/content/src/editorial-aids.json` | 与原文版本、节选范围对应的独立中文理解及古注参考，保留 rights／review |
| `packages/content/src/manifest.json` | 目录派生产物，由 `content:catalog` 更新 |
| `public/texts/books/` | 同站正文请求产物，已忽略；`content:assets` 可重建 |

修改正文或增加篇章：保存固定来源 → 用转换器生成候选 → 编辑共享正文数据（已有 ID 不改、新 ID 不按排序重算）→ 原文改动先保存历史及映射 → `npm run content:catalog` → `npm run check:content` → 两站验证。作品内新篇使用相同章节／段落结构，阅读组件按目录渲染，不复制页面代码。新增书种可能需要来源转换适配，不把现有三书转换器冒充通用 MediaWiki 引擎。

当前正文使用 `p-作品ID-…`，兼容旧 `ws-…` 句子别名。新段落可使用 `p-作品ID-随机标识`；名字中的序号仅是已冻结的历史标识，不作为后续排序规则。规范正文更正可保存 `sourceText`（原始转录）、`correction`（原因及针对新版本的审核），同时保留旧版本和映射；检查器拒绝没有历史与审核依据的底文替换。

### 新增或编辑 Learning 课程

模板：[lesson.yaml](content/learning/templates/lesson.yaml)；完整样例：[学而](content/learning/practice-and-joy.yaml)。一课一个 YAML，页面由现有 UnitReader 和共享控件生成。

```sh
npm run lessons:new -- my-lesson   # 创建 content/learning/my-lesson.yaml；同名文件报错
# 填写 YAML 内 TODO，核实引用、读音、材料与练习
npm run lessons:generate           # 校验全部课程，再更新运行时 JSON
npm run check:content              # 校验产物新鲜度与共享内容契约
npm run dev:learning               # ?preview=1#/unit/my-lesson
```

开发服务运行期间修改 YAML 后，再执行 `npm run lessons:generate`，生成 JSON 的变化会触发 Vite 更新。启动开发服务与构建均会自动生成。模板占位未填完会阻止生成；可把暂不接入的草稿保存在 `content/incoming/`，模板目录也不进入课程集合。

| YAML 栏目 | 填写内容／页面位置 |
| --- | --- |
| `schemaVersion`、`order` | 格式版本；目录顺序（与稳定 ID 无关） |
| `lesson` | 稳定 ID／版本、英文标题、级别、目标、原文 refs、拼音 ID、练习、回想及审核 |
| `sections.meaning` | 独立英文释义 → Meaning |
| `sections.wordsToNotice` | 本句关键字词、语境读音 → Words to notice |
| `sections.context` | 周围原文与理解依据、具体材料链接 → Explore the context |
| 每节的 `review`／`rights` | 实际编写者、审核状态、原文版本、来源与使用方式；外链本身不证明译者或改写归属 |
| `lesson.exercises`／`reflection` | 题目、选项、从0开始的答案序号、解释反馈；个人回想 |

模板提供的是《学而》引用样例。换原句时，同步 sections 的 target／version／start／end 与 pinyinAidIds；拼音仍在 `packages/content/src/pinyin-aids.json` 维护。原文只在共享 books 保存，YAML 引用它而不复制底文。`intro` 是旧字段，可省略，当前页面不展示；现有中文教学改写作为可选 `teachingParaphrase` 保留。

校验会指出文件和字段，阻止缺少三种解释、未知字段、重复 YAML 键、占位文本、错误范围、拼音缺项、无效答案和不完整审核状态；失败时保留上一次有效生成文件。检查只证明结构与引用成立，英文文义、读音与实际权利仍需编辑审阅。AI 起稿保持 draft，人工审核完成后填写真实 reviewer／reviewedAt。

新增课程的工作是编辑内容和检查实际材料。字体、栏目、按钮、分享和打印由公共组件管理；仅在公共组件、调用契约或新数据形态影响行为时做对应交互回归。

```sh
npm run content:import             # 离线重建既有转换产物，不访问网络
npm run content:catalog            # 从稳定正文重建导航；不生成新 ID
npm run content:assets             # 准备两站静态正文
npm run check:content
npm test
npm run build

# 仅明确要更新来源时：访问 Wikisource，写入新的 content/incoming/ 候选
npm run content:import -- --download
```

下载命令不再直接覆盖当前快照／正文。核对候选、许可与转换结果后才人工接入；接入新修订前，将旧原始快照另存为带版本的档案，保留历史引用所需原文。每次内容发布更新 `contentRelease`；正文请求校验发布标识，避免旧应用静默混读新数据。实际发布另需授权。

Wikisource 主源、固定修订、集中署名、独立解读的路线保持。ctext 仅作交叉参考，不批量搬用现代翻译或注释；新增翻译、音频和字体分别核实许可，不以逐页扫描校勘作为普通发布前提。OpenCC 的随站许可位于 `public/licenses/opencc.txt`，中文站沿用本机宋体栈；学习中文使用自托管霞鹜文楷 GB 屏幕阅读版（WOFF2 Unicode 分包、SIL OFL 1.1），见 [字体来源与授权](public/fonts/lxgw-wenkai-gb-screen/SOURCE.md)。历史讨论见 [内容路线讨论](docs/content-strategy-discussion.md)，不作为当前实现规范。

## 本机记录与兼容

中文存档 `wuhua:reading:v2`，学习存档 `wuhua:learning:v1`；主域与子域互不读取。旧中文 v1 通过明确的升级入口保留原 key、备份原串后写新格式；未知引用不丢弃，能证实来源的旧全文引用补上快照。损坏原串可下载，禁止用空状态覆盖。

“我的回味”／“My learning”可导出完整 JSON 或 Markdown。恢复先预览，默认合并；冲突保留副本，可比较后分别删除。导入不同站点或不支持的格式会拒绝写入。替换需明确勾选且先下载当前备份。清理浏览器、换设备和隐私模式结束都可能丢失本机数据，下载文件才是用户持有的备份。

## 发布状态

两站已通过 Vercel 生产部署：中文站 `https://wuhua.app/`（项目 wuhua），学习站 `https://learn.wuhua.app/`（项目 wuhua-learn）。本次从本地双站构建的静态产物发布，未推送 Git。Cloudflare 的 learn CNAME 已按授权指向 Vercel，DNS only。仓库根 `.vercel` 仍绑定中文项目；发布 Learning 应明确选择独立学习项目，不能复用根绑定误覆盖中文站。`vercel.json` 与 `vercel.learning.json` 分别描述两站源码构建。

共享内容改动必须检查两站；仅改一个应用可以只选择该发布对象。发布、可能自动部署的推送／合并、域名操作和真实数据迁移均须另行明确授权。回退应用时保留新存档与旧 key，不能以旧格式覆盖较新的用户记录。

## V3 分享、打印与来源样例

课程 Read 的 Save 成功才变 Saved；Share 支持字形、Day／Night、连续节选与换行，原文卡不包含个人笔记。未发布草稿没有正式课程链接。多段课程先选择要分享／打印的段落。PNG 默认 900px 宽、按内容增高；字体失败时可复制文字，恢复连接后重新加载可重试字体。

Print 打开站内分页预览。Full passage 保留重复与标点；Individual characters 才去重；Selected text 选连续范围。字形仅对本次打印生效；支持描摹／空白行或格数、12／15／18mm、A4／Letter，以及默认关闭的现有对齐拼音。缺失或多字拼音不拆猜。系统打印时使用默认／100% 缩放及应用指定纸张，关闭浏览器额外页眉页脚；用户在系统窗口另改纸张或缩放会改变输出。

《学而》首句有独立中文整理及 Wuhua AI 辅助英文草稿；朱熹《朱子语类》卷二十等外部材料仅按实际使用方式记录。CText FAQ 与对齐译文条款区分旧译、获授权译文及 AI／众包译文；本站只链接具体参考，不批量复制 CText 或其现代改写。材料的作者、版本、节选范围和权利说明在 Sources 展示，仍待人工内容与教学审核。
