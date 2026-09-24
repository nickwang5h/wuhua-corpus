# 部署与 Corpus 升级

以下为待执行步骤，不表示已上线。远程仓库创建、Git 推送和 Vercel 生产绑定需要用户明确授权；此次没有执行。

1. 将独立仓库推送至目标 GitHub 仓库；中文目标 `nickwang5h/wuhua`，Learn 目标 `nickwang5h/wuhua-learn`。现有 wuhua 必须确认远程 main 没有新增提交，再将保留祖先历史的拆分提交正常快进；出现分叉立即停止，不强推。
2. 在匹配的 Vercel 项目连接该仓库。Root Directory 设为仓库根（空），Install Command 为 `npm ci`，Build Command 为 `npm test && npm run build`，Output Directory 为 `dist`。仓库根 `vercel.json` 保留 `/sources` rewrite。
3. 先生成 Preview deployment，核对首页、来源、读文、旧 URL、静态 `/releases/{release}/books/*.json` 和已有存档读取。确认后再将生产项目切换到新仓库/分支。
4. 中文域名 `wuhua.app` 留在中文项目；`learn.wuhua.app` 留在 Learn 项目。不需要更改 DNS，也不要复用旧根 `.vercel` 绑定。
5. 保留切换前 Vercel deployment 和 Git 设置。回滚时重新提升该产品上一份完整 deployment；它包含当时的 JS 和 Corpus 静态数据，另一产品不动。

## 显式升级 Corpus

在 Corpus checkout 执行其发布流程。将新 release 的 `.tgz` 和 `release.json` 取到本地，先验证公布的 SHA-256；不要重新打包或编辑压缩包内正文。将 `.tgz` 复制到本产品 `vendor/`，然后在本产品根执行：

```sh
npm install --save-exact ./vendor/wuhua-corpus-YYYY.M.D-dN.tgz
```

将 `corpus-lock.json` 更新为包对应的 release 和 package version。运行 `npm test && npm run build`，检查引用与本地用户数据兼容，再提交 vendor、package.json、package-lock.json 和 corpus-lock.json。另一产品可继续使用旧版本。更新包时不要覆盖旧版本文件名；回滚产品提交即可恢复旧锁。

Corpus 不需要 CDN、在线服务或 npm registry。当前发布产物可通过本地文件传递；将来如用 GitHub Release 附件分发也必须明确发布授权，不改变版本锁定契约。
