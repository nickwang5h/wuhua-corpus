# Wuhua · 物化间 架构

`src/` 拥有阅读页面、UI、主题、storage、分享和显示字形转换。`src/content/` 拥有 curated、paths、概念展示与 legacy 兼容材料；它们不进入 Corpus。`src/content/legacy/fulltext.json` 仅是拆分前冻结的转换档案，不用于更新现行底文。

两个产品只从自己的 `vendor/` 安装 `@wuhua/corpus` 发布包，锁文件保存 npm integrity；`corpus-lock.json` 同时核对数据 release 与包版本。当前为 `2026-09-24-d1` / `2026.9.24-d1`。产品构建不读取 Corpus 源码，不联系在线内容服务。

运行时读取同站 `/releases/2026-09-24-d1/books/{id}.json`，书籍响应含 release，加载器拒绝混用版本。`public/releases/` 和 `public/texts/wikisource.json` 由已锁定的包生成，不人工编辑、不提交。字体和 OpenCC 许可由各产品维护。已有 hash 路由与 `/sources` 保持；页面加载失败仍可重试。

Corpus 源库是唯一现行底文编辑源。产品 vendor 是发布产物，不是第二份编辑源；发布更新不会修改它。两个产品可在不同时间更新 vendor、package.json、package-lock.json 和 corpus-lock.json，再各自验证和部署。

没有 shared UI、CMS、数据库、API 服务或跨产品源码导入。两个产品的少量相同 UI 是各自拥有的代码，后续变更无需同步。
存档继续使用 `wuhua:reading:v2`；旧 v1 迁移、无法解析引用、草稿、冲突副本和重挂接行为保留。
