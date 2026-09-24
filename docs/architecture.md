# Corpus 契约

`src/books/*.json` 是唯一现行 canonical 编辑源；`src/manifest.json` 由 catalog 命令派生。`sources/wikisource.json` 保存固定修订、贡献者与许可。`src/history.json` 保留旧引用和显式 revision/split/merge/withdrawn 映射；空历史不等于可以删除未来旧版本。

`src/index.ts` 提供稳定引用解析与同站 release 加载器，`types.ts`、`validate.ts` 提供类型与数据验证。`pinyin-aids.json` 和 `editorial-aids.json` 有稳定 target/version/range、review 和 rights，保留在 Corpus；没有借迁移修改其正文或审核状态。

`concepts.json` 只保留 16 个原中文键的 identity。逐条检查后，齐物、物我、成心、彼是、物化、逍遥、道、名、自然、无为、不争、自知、修身、学思、和而不同、仁都可作为独立引用键；原 description 含读者引导及“本页”等语义，全部留给中文站，相关推荐关系亦留给中文站。未建立 ontology 或新概念体系。works 只共享 id/title/roman，配色、符号、推荐文案属于中文产品。

发布包仅含编译后的 `lib/` 和固定来源 `sources/`，产品可在 Node/Vite 中正常加载，无 TypeScript runtime loader 要求。静态书籍以 `/releases/{release}/books/{id}.json` 消费，加载器校验 release。源仓库提交不会更新产品 vendor 或部署。
