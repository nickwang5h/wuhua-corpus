# Corpus 契约

`src/books/*.json` 是唯一现行 canonical 编辑源；`src/manifest.json` 由 catalog 命令派生。`sources/wikisource.json` 保存固定修订、贡献者与许可。`src/history.json` 保留旧引用和显式 revision/split/merge/withdrawn 映射；空历史不等于可以删除未来旧版本。

`src/index.ts` 提供稳定引用解析与同站 release 加载器，`types.ts`、`validate.ts` 提供类型与数据验证。`pinyin-aids.json` 和 `editorial-aids.json` 有稳定 target/version/range、review 和 rights，保留在 Corpus；通过明确修订与新 release 分发，审核状态反映实际情况。

`concepts.json` 只保留 16 个原中文键的 identity。逐条检查后，齐物、物我、成心、彼是、物化、逍遥、道、名、自然、无为、不争、自知、修身、学思、和而不同、仁都可作为独立引用键；原 description 含读者引导及“本页”等语义，全部留给中文站，相关推荐关系亦留给中文站。未建立 ontology 或新概念体系。works 只共享 id/title/roman，配色、符号、推荐文案属于中文产品。

发布包仅含编译后的 `lib/` 和固定来源 `sources/`，产品可在 Node/Vite 中正常加载，无 TypeScript runtime loader 要求。静态书籍以 `/releases/{release}/books/{id}.json` 消费，加载器校验 release。源仓库提交不会更新产品 vendor 或部署。

## 自动扩展 corpus

`corpus/targets.json` 与少量 overrides 驱动 `scripts/corpus.ts`。Source adapters 将 Wikisource、Gujilab 和必要的公开整书 fallback 转成统一正文单元，再由确定性 normalizer 进入原有 `src/books`；没有第二棵内容树。来源计划、revision/commit、许可声明、统计和正文摘要写入 `sources/corpus`，大型 raw response 留在 Git 忽略的 `.cache/wuhua-corpus`。

`TextBook` 新增可选 source-derived metadata；chapter 可标识完整短作品、真实章节或 anthology item，上级目录用 `path`，段落节标题用 `headingPath`。旧接口仍是 chapters/paragraphs，旧三书没有迁移。新 ID 从源身份派生，正文版本从内容派生。校验接受受支持上游的固定 revision/commit，并核对正文摘要和来源 manifest。

`corpus/route.json` 是独立的编辑规划，未导入运行时包或产品页面。结构化 corpus 的扩张不等于推荐书单扩张；详见 [路线与操作](corpus-route.md)。原三书 importer 只负责历史固定快照，新增作品不再逐本扩写该脚本。`check:content` 同时执行旧契约与新 corpus 检查。


图像专页采用可选 `Chapter.images` 与 `kind: image`，不伪造 Paragraph。图片的源文件时间、校验值和 rights 随固定来源保存，二进制原图归档到 `src/assets`；build 与 release 一并复制。已有三书不要求增加该字段，原有文字引用 API 保持原义，图片通过 `findImage` 解析。

`corpus/route-pilot.json` 保存少量编辑试读的固定段落版本与 Unicode 码点范围。校验阶段、前置背景及源引用后，生成 `docs/route-pilot.md`；没有产品 MDX、课程或第二份 canonical 正文。
