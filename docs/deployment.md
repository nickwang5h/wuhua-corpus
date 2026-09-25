# Corpus 发布与分发

Corpus 远程为 `nickwang5h/wuhua-corpus`，主分支 `main`。它不部署业务服务。当前包版本以 `package.json` 为准，数据 release 以 `src/index.ts` 的 contentRelease 为准；仓库提交与产品上线分别进行。

## 生成新包

在本仓库根完成内容修订与检查后，同时升级 package.json 版本和 contentRelease；用 `npm install --package-lock-only` 同步锁文件，再执行：

```sh
npm run release
```

该命令依次检查类型、内容、边界和测试，构建后生成 `releases/{release}/`，包含 books JSON、manifest、原图 assets、npm tarball 和记录 SHA-256 的 release.json。没有内容变化的文档清理不需要新 release。

已分发目录和 tarball 不可覆盖。修复需要新版本。生成失败、尚未分发的临时候选可清理重做，但不得以此替换已被产品使用的版本。正文版本只因真实底文更正而变化，不随打包日期变化。

## 产品消费

产品先核对 release.json 的 SHA-256，再复制 `.tgz` 到自己的 vendor，更新依赖锁和 corpus-lock，并运行各自检查。源码提交、生成包、产品升级、网站部署是四个不同动作；Learn 和中文产品可以使用不同版本。

保留已分发包供回滚和重建。本地 releases 被 Git 忽略；产品提交自己实际依赖的包。需要持久外部分发时，按明确授权上传 Release 附件，不自动执行 npm publish、创建 tag 或上传整个缓存。

## Git 与回滚

提交前检查改动范围和远程 main；正常快进，不强推或自动合并真实分叉。源码提交不要求两个产品同步升级。

网站回滚由产品恢复上一完整部署，或恢复原提交与原锁重建。Corpus 不需要 DNS、数据库迁移或 CDN 服务切换。
