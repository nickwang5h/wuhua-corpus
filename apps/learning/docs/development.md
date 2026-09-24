# 开发与验证

命令均在本仓库根目录执行。`npm run check:types` 检查本产品源码、脚本和测试；`npm run check:content` 检查产品内容；`npm test` 先检查依赖边界再运行本产品测试；`npm run build` 检查内容、复制锁定 Corpus 静态产物、检查类型并构建到 `dist/`。

边界检查拒绝导入仓库外的源码、未声明依赖、逃逸的 TypeScript include 和跨仓库命令。不要用相对路径指向兄弟 checkout，也不要引用 root monorepo 配置。UI、storage 和 styles 均在本仓库维护。

浏览器回归在空的隔离本地 origin 进行；使用合成旧存档，验证阅读、收藏/笔记、刷新、旧链接与导出，不修改已有用户存档。构建成功不代表运行时走查完成。当前保留原有 OpenCC 大字典分块告警。
