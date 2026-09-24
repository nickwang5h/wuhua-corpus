# 发布与分发

Corpus 不部署业务服务。编辑并审核后，在本仓库根将 `package.json` 的版本和 `src/index.ts` 的 contentRelease 一起升级，运行 `npm install --package-lock-only` 更新锁文件，再执行 `npm run release`。

当前首个拆分 release 为 `2026-09-24-d1`，包版本 `2026.9.24-d1`。三本书的原始 ID 和文本 version 不因这次打包而改变。

发布输出为 `releases/{release}/`：三个 books JSON（附 release）、manifest.json、wuhua-corpus-{packageVersion}.tgz、release.json。最后一项包含 tarball SHA-256。输出目录存在时拒绝覆盖：已分发版本不能重写；修复需要新 release。未发布的本地候选失败时可删除其输出后重新生成，但不得这样替换已分发版本。

将 tarball 和 release metadata 提供给两个产品，各自验证哈希、复制至 vendor 并更新依赖和 corpus-lock。它们不需要同时升级。release 文件也可在授权后作为 GitHub Release 附件上传，但本次没有创建远程仓库、tag、附件或执行 publish。

回滚由产品恢复上一份锁和部署完成；保留已经发布的 tarball 供旧产品重建。无 CDN 或数据库需要协调。

## 授权后远程操作示例

本地分支为 `split/standalone`，无 remote。用户创建或授权创建目标 GitHub 仓库后，在本仓库执行以下命令；本次未执行：

```sh
git remote add origin git@github.com:nickwang5h/wuhua-corpus.git
git push -u origin split/standalone:main
```

若要上传 release 附件，另需匹配该动作的授权；推送源码不会自动升级任一产品。

## 2026-09-24 · Private GitHub 仓库

用户已授权创建并推送独立 private 仓库。`nickwang5h/wuhua-corpus` 已创建，当前 checkout 已配置 origin；远程使用 `main`，本地保留 `split/standalone` 并跟踪 origin/main。以上“未执行/无 remote”的段落是拆分完成时的记录，本段更新 GitHub 操作状态。Vercel 绑定、生产部署及 release 附件上传没有包含在本次推送授权中。
