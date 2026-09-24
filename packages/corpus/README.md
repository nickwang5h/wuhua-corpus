# Wuhua Corpus

共享且有版本的静态经典知识资产。三本 canonical books、稳定身份、版本、来源、history、拼音、可溯源辅助资料，以及最小概念身份。没有 React、DOM、localStorage、产品页面、MDX 或 Learn release。

```sh
npm install
npm run check:types
npm run check:corpus
npm test
npm run release
```

Node.js 22.12+。CI 用 `npm ci`。发布输出 `releases/2026-09-24-d1/`，包含 manifest、books、编译后的 JS/类型声明/静态数据 tarball 和 SHA-256 release metadata。同名输出已存在时拒绝覆盖。没有上传、registry publish 或长期运行服务。

- [架构](docs/architecture.md)
- [来源与修订](docs/content-authoring.md)
- [开发](docs/development.md)
- [发布](docs/deployment.md)
- [迁移记录](docs/migrations/2026-09-wuhua-repo-split.md)
