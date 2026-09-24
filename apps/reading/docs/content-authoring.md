# 中文内容编写

精选与注释位于 `src/content/legacy/texts.ts` / `annotations.ts`，路径位于 `paths.ts`，概念展示文案位于 `concepts.ts`。这些是中文产品材料；不要将它们移动到 Corpus，或要求 Learn 跟随发布。legacy 的旧文本、身份与 catalog 保留用于兼容，不作为新的现行经典编辑入口。

经典更正、固定来源、稳定 ID、history、拼音及具有 target/version/review/rights 的共享辅助资料只在 Corpus 仓库修改并发布。中文产品显式升级 release 后运行 `npm test && npm run build`。原文范围仍按 Unicode 码点 `[start,end)`；不要使用转换后的字形替换底文。

中文站旧记录 key、URL、精选 ID、旧注释与路径身份不得因内容目录整理改变。内容结构校验与真实编辑审核分开。
