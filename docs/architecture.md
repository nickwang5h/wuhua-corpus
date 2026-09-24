# 拆分后工程边界

本分支是拆分 staging，产品可以独立安装测试构建，根只汇总命令。最终 checkout 各自提升下列目录为根，保留原祖先提交。

```text
wuhua         <- apps/reading      -> pinned @wuhua/corpus tarball
wuhua-learn   <- apps/learning     -> pinned @wuhua/corpus tarball
wuhua-corpus  <- packages/corpus   -> versioned static release
```

详细契约见三个目录的 README、docs/architecture.md 和 [迁移记录](migrations/2026-09-wuhua-repo-split.md)。两个产品无源码依赖，无 shared React package，无公共 public 输出目录。所有旧设计文档已标明历史状态。
