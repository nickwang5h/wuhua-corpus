---
name: wuhua-learn-content
description: 编写和审核 Learn MDX 哲学短阅读、Phrase、ClassicQuote 与发布清单；不编辑 Corpus canonical。
---

# Learn 内容

先读 [作者指南](../../../docs/content-authoring.md) 和相近 `content/learning/*.mdx`。先选一个有经典依据的思想，再选一个中文 focus、现代例句和最少但足够的解释，不先写泛泛英文主题再找古文装饰。

每篇是一个 MDX：frontmatter 需 focus 与非空 sources，concepts 可引用 Corpus 现有 identity；找不到合适键时直接锚定段落。原概念说明属于中文产品，不导入中文源码。需要新通用 identity 时在 Corpus 单独修订发布，不在 Learn 建第二份知识库。

`<Phrase />` 复用 focus；现代例句显式 chinese/pinyin/gloss。`<ClassicQuote source="main" />` 读取 ID/version/[start,end) 对应经典与拼音，不硬编码原句。现代拼音采用字典声调，解释不冒充古注或外部译文。

MDX 用普通 Markdown，不带脚本、import、页面布局或任意表达式。新建文件自动发现，不生成正文 JSON。Starting 通常 1–2 分钟，Building 2–3 分钟，不机械限字数、不加 quiz 或先修。

AI 起稿保留真实 draft/author；只有实际人工审核才能填写 reviewer/reviewedAt。`content/learning-release.json` 单独锁定公开 ID/version，新版本不自动延续公开资格。发布决定与部署授权分开。

运行 `npm run check:content`；`npm run dev` 加 `?preview=1#/reading/ID` 检查。发布前 `npm test && npm run build`，确认生产排除未公开内容。MDX 流程移除时删除本 Skill。
