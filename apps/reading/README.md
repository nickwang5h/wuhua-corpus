# Wuhua · 物化间

面向中文读者的经典阅读站：全文、精选、解读、寻径、回味与本机记录。

在本仓库根目录运行（Node.js 22.12+）：

```sh
npm install
npm test
npm run build
npm run dev
```

CI 使用 `npm ci`。`npm run preview` 查看生产构建；可追加 `-- --port 48735` 选择独立本地端口。无需另一个产品或 Corpus 源码 checkout。

- [架构](docs/architecture.md)
- [开发](docs/development.md)
- [内容编写](docs/content-authoring.md)
- [部署和 Corpus 升级](docs/deployment.md)
- [迁移记录](docs/migrations/2026-09-wuhua-repo-split.md)

两个产品只从自己的 `vendor/` 安装 `@wuhua/corpus` 发布包，锁文件保存 npm integrity；`corpus-lock.json` 同时核对数据 release 与包版本。当前为 `2026-09-24-d1` / `2026.9.24-d1`。产品构建不读取 Corpus 源码，不联系在线内容服务。

运行时读取同站 `/releases/2026-09-24-d1/books/{id}.json`，书籍响应含 release，加载器拒绝混用版本。`public/releases/` 和 `public/texts/wikisource.json` 由已锁定的包生成，不人工编辑、不提交。字体和 OpenCC 许可由各产品维护。已有 hash 路由与 `/sources` 保持；页面加载失败仍可重试。

Corpus 源库是唯一现行底文编辑源。产品 vendor 是发布产物，不是第二份编辑源；发布更新不会修改它。两个产品可在不同时间更新 vendor、package.json、package-lock.json 和 corpus-lock.json，再各自验证和部署。
