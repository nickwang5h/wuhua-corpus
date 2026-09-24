# Wuhua Learn 架构

`src/` 拥有全部页面、UI、主题、storage、分享、打印和显示字形转换。`content/learning/*.mdx` 是正文事实源；`content/learning-release.json` 决定公开 ID/version。`scripts/readings.ts` 与 `reading-plugin.ts` 只检查本产品。概念键来自 Corpus identity，不消费中文站说明、paths 或 curated。

两个产品只从自己的 `vendor/` 安装 `@wuhua/corpus` 发布包，锁文件保存 npm integrity；`corpus-lock.json` 同时核对数据 release 与包版本。当前为 `2026-09-24-d1` / `2026.9.24-d1`。产品构建不读取 Corpus 源码，不联系在线内容服务。

运行时读取同站 `/releases/2026-09-24-d1/books/{id}.json`，书籍响应含 release，加载器拒绝混用版本。`public/releases/` 和 `public/texts/wikisource.json` 由已锁定的包生成，不人工编辑、不提交。字体和 OpenCC 许可由各产品维护。已有 hash 路由与 `/sources` 保持；页面加载失败仍可重试。

Corpus 源库是唯一现行底文编辑源。产品 vendor 是发布产物，不是第二份编辑源；发布更新不会修改它。两个产品可在不同时间更新 vendor、package.json、package-lock.json 和 corpus-lock.json，再各自验证和部署。

没有 shared UI、CMS、数据库、API 服务或跨产品源码导入。两个产品的少量相同 UI 是各自拥有的代码，后续变更无需同步。
存档继续使用 `wuhua:learning:v1`；旧 unit 链接映射到 Reading，旧 progress/答案/笔记保持在存档及导出。开发 `?preview=1` 可见草稿；生产忽略该参数并排除未公开正文与元数据。
