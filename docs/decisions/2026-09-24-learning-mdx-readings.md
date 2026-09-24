# Learn 从课程系统转向 MDX Reading

日期：2026-09-24。状态：按用户任务卡采纳。当前实施契约见 [architecture](../architecture.md)。

## 产品变化

Learn 的入口变为一篇几分钟、独立成立的短文：从容易理解的问题或词语进入，接触一点中文，再发现经典联系。课程完成、阶段推进和先修关系不再代表这个目标。保留刚完成的课程系统会持续要求作者适配固定栏目，也会让读者面对不必要的学习流程。

因此将最小内容实体改为 Reading。MDX 是编辑事实源，frontmatter 只保存机器需要的稳定元数据，正文由作者用普通 Markdown 组织。迁移的五篇改写为 version 2，以区别早期课程的内容版本。

## 为什么选直接 MDX

现有 Vite / React 已能用 [官方 MDX Rollup 集成](https://mdxjs.com/packages/rollup/) 编译正文，并通过 [Vite glob imports](https://vite.dev/guide/features#glob-import) 自动发现文章。元数据校验在构建阶段完成，正文按需加载，不需要正文 JSON 生成层。

没有采用 Docusaurus：此处需要短文阅读与已有字体、存档、原文动作的整合，不需要文档站的侧栏、文档版本或另一套站点框架。没有引入 CMS、数据库、block builder 或插件平台。

## 经典与表达分别维护

经典原文有固定修订、版权、稳定段落 ID、版本、节选范围及旧引用兼容责任。将原句复制进 MDX 会产生两份可分叉的事实源。因此经典仍由 packages/content 管理，MDX 只声明引用；ClassicQuote 从同一份正文解析文字。

现代中文例句、词语介绍和独立英文说明属于表达层，可以在 MDX 中写。来源、审核与外部材料使用关系仍明确记录，AI 起稿不自动成为已审核内容。

## MDX 与 React 边界

MDX 决定内容顺序和普通文章结构。第一阶段只有 Phrase 与 ClassicQuote 两个功能组件，没有固定 meaning/context/exercise/reflection schema，也不要求每篇都使用组件。

React 管理站点导航、设置、路由、标题与摘要、单列排版、来源 UI、收藏和笔记、分享打印与相关推荐。新增文章只需文件；字体或页面行为变化只改公共实现。

## 移除的机制

删除 Unit / Exercise 内容类型、UnitReader、UnitSummary、LessonPassage、强制 PracticeQuestion 流程、课程 model、YAML 课程与模板、lesson schema / generator / new 命令、learning-units.json 和强制课程测试。没有保留两套并行内容模型。

Read / Practice / Reflect、先修图、完成门禁与首页续课推荐退出产品。分享图片、字帖分页、经典引用、拼音、OpenCC、来源与本机数据适配继续使用。

## 个人数据的代价与选择

不清空、不自动转换 `wuhua:learning:v1`。新 Reading 记录使用独立身份空间，避免覆盖同主题的旧课程笔记。旧 progress 只作为存档历史保留，导出和合并仍携带全部字段；旧收藏与笔记可以查看快照和访问当前主题。

代价是存档编码器仍认识旧进度结构，但新的 Reading 类型和页面不受它控制。不为兼容重建课程运行时。

## 公开与编辑状态

保留简化的 ID / version 发布清单，与 MDX review 分开。当前五个公开主题迁移到新的 Reading 版本，不扩大发布集合。新文章默认仅开发预览可见；生产构建不携带未发布正文和元数据。真正部署仍是单独操作。

内容校验能证明引用、结构和编译成立，不能替代英文、文化解释和读音的人工审核。
