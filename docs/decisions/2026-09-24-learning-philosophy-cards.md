> 历史记录：本文描述拆分前的产品或架构。当前工程入口见各仓库 README 和 architecture；迁移依据见 docs/migrations/2026-09-wuhua-repo-split.md。

# Learn 默认采用 philosophy learning card

日期：2026-09-24。状态：已实现，本地验收；未部署。延续 [MDX Reading 决策](2026-09-24-learning-mdx-readings.md)，替代其中 essay-first 与经典可选的产品约定。

## 问题

MDX Reading 解决了旧课程系统过重的问题，但自由长文让 Learn 倾向英文博客。作者需要持续承担英文随笔、哲学论述和语言课程设计，初学者也要读较多铺垫才能遇到中文与经典。

## 决策

Reading 默认是短小的 philosophy learning card：日常问题、一个中文 focus、一句现代汉语、真实经典锚点和最少但足够的解释。目标是 beginner Chinese through Chinese philosophical ideas and classics，而不是 Chinese microlearning + optional classics。

Card 描述内容和视觉形态，不新增类型或 runtime。保留 MDX、Reading、canonical classics、已有 philosophy data、Phrase、ClassicQuote、Saved / notes / sharing。普通 Markdown 仍能容纳必要差异；Building 允许更长解释。

Home / Explore 同时展示问题与中文，并展示来源。正文保留安静的单列，以中文字号、留白和少量分隔形成节奏，不为每段套盒子。未新增 Question / Example / Thought：页头承担问题，Phrase 承担核心词与例句，Markdown 承担理解。

## 最小知识连接

新增必填 focus（chinese / pinyin / gloss）与可选 concepts。concepts 引用现有共享中文键，构建拒绝未知和重复键；非空 sources 继续引用 canonical ID / version / range。两者在 Reading 内建立思想与落点的关系，不复制概念定义或经典底文。

共享库没有知足概念条目，因此这篇直接引用《道德经》33，不为覆盖率制造概念。自知引用自知，学习与向他人学习引用学思，万物引用物我／齐物。共享 editorial aids 和旧解读参与选题与解释，但没有新增 interpretation 元数据字段或自动生成系统。

`<Phrase />` 从 focus 渲染关键词，现代例句继续用原有三个属性。元数据即可支撑 Home、Explore 和搜索，不需加载 MDX 正文。

## 内容与边界

四篇 Starting 改为约 1 分钟；万物为 Building、约 2 分钟，保留齐物论上下文以及“一”与言说的张力。删除随笔铺垫、多级章节、重复例子与延伸劝告；不把思想压成鸡汤或 slogan。

五篇改为 version 3，现有五主题的本地 release manifest 同步版本，不扩大发布集合。review 仍为 AI-assisted draft；技术校验和公开配置都不等于人工语言教学或哲学审核。旧笔记、收藏、progress 均保留原身份与版本。

不采用普通 vocabulary app、essay-first、课程系统或第二套哲学数据库。不实现 HSK 课程、SRS、quiz、账户、CMS、prerequisite、完成度或双向推荐。本地完成不授权部署。
