# Wuhua Corpus

共享、有固定来源与稳定引用的古文语料。新增作品由小型收录清单自动发现、下载、清洗并进入 `src/books`；中国思想阅读路线独立于 corpus 的收录范围。老子、论语、庄子的已有正文与引用冻结。没有产品 UI、译文批量生成、数据库或服务端。

在仓库根目录运行（Node.js 22.12+）：

```sh
npm ci
npm run corpus:sync -- chuanxilu
npm run corpus:report
npm run check:content
npm test
npm run build
```

全量执行 `npm run corpus:sync`，失败作品独立报告，成功作品不会因此丢弃。缓存不提交，canonical 正文和小型 source manifests 提交。现有固定来源默认不追随上游，重复运行不应产生正文变动。

- [Corpus 操作、覆盖与阅读路线](docs/corpus-route.md)
- [三书六段试读](docs/route-pilot.md)
- [架构](docs/architecture.md)
- [来源与修订](docs/content-authoring.md)
- [开发](docs/development.md)
- [发布](docs/deployment.md)
- [拆仓记录](docs/migrations/2026-09-wuhua-repo-split.md)

## 写入与发布入口

- 新原典、来源异常、定点拼音：[intake skill](.agents/skills/wuhua-corpus-intake/SKILL.md)
- 底文更正与共享标注：[来源与修订](docs/content-authoring.md)
- 打包和产品升级边界：[发布](docs/deployment.md)

`npm run build` 生成本地包内容；`npm run release` 生成不可变发布目录，不自动部署产品。当前版本读取 package.json 和 src/index.ts，产品版本读取各自的 corpus-lock.json。主分支为 main，远程为 nickwang5h/wuhua-corpus。

Learn 的解释、现代例句和公开清单不写入 Corpus。早期建设过程保留在 [历史工作记录](docs/worklog.md)，它不代替当前操作文档。
