# Canonical 来源、修订与拼音

编辑源为 `src/books`、`src/history.json`、`src/pinyin-aids.json`、`src/editorial-aids.json` 与 `sources/wikisource.json`。保留固定 Wikisource oldid、贡献者、许可及处理方式。

`npm run content:import` 从固定快照离线转换，输出 `content/incoming/converted.json` 候选，不覆盖 canonical。只有明确需要下载时才执行 `npm run content:import -- --download`，输出新候选；不得用浮动在线来源静默更新已发布正文。

段落 ID 不因位置或标题重分配。真实更正须保留原版本引用、sourceText、修订理由和真实审核，添加 history 映射，再修改文本及其版本。所有范围均为原文 Unicode 码点 `[start,end)`。拼音目标版本、token 文本与码点必须匹配，不能猜测缺失/多音字读音。

`npm run content:catalog` 只生成 manifest，不重生成身份。接着执行 `npm run check:corpus` 与 `npm test`，验证来源、正文、history、pinyin、editorial rights/review。技术通过不代表人工审核。

中文 curated、paths、注释及概念展示在中文仓库；Learn MDX、Phrase 文案、ClassicQuote metadata 与公开版本在 Learn 仓库。
