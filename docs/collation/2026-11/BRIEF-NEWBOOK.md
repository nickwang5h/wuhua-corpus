# 新对校一部书的做法（corrections17）

先完整读同目录的 BRIEF.md 和 BRIEF-COLLATE.md：工具、订正清单格式、判定标准都照它们。这份只说怎样从头对校一部还没对过的书。语料库在 /Users/congwang/Projects/wuhua-corpus（只读；不要改里面任何文件，不要碰 git），原文是 src/books/<书id>.json 的现状。

1. 找对校本。维基文库上找同一部书最接近我们底本的本子（多数是四库全书本，根标题常是“某某 (四庫全書本)”；也可能是别的整理本）。可用 MediaWiki API 搜索（`https://zh.wikisource.org/w/api.php?action=query&list=search&srsearch=…&format=json`，User-Agent 用 `WuhuaCorpus/1.0 (personal classical text archive)`，请求间隔 3 秒以上，被 429 限流就等一两分钟）。
2. 出候选表。在 /Users/congwang/Projects/wuhua-corpus 下运行 `npm run -s corpus:collate -- <书id> "<根标题>" --out ~/.cache/wuhua-annotate/c13/collate/<书id>.md`（它只读语料、把对校本存进忽略于 git 的缓存；一次只跑一部，别并行）。看输出的“对上 x%”：低于六成多半是根标题不对或卷目结构不同，换一个本子再试；实在对不上的书，在 md 里写明试过哪些根标题、各对上多少，然后跳过。也可以用 `python3 ../tools/wsfetch.py ws/<根标题>.json --sub <根标题>` 把对校本取到 c13/ws/ 以便 `python3 tools.py ws <根标题> <字串>` 查。
3. 裁决。照 BRIEF-COLLATE.md：形近、本书少字、本书多字逐条给结论，“字不同”先按“本书字→对校本字”分组排除异体、通假、避讳、简繁写法，再挑讲不通的细查。每条订正要两样依据：对校本，加第二个本子（维基文库别本、本语料库里引同一句的书、同篇内证）；只有一个字成词的纯形近错，对校本加文义即可。底本是机器转的简体时，注意转换造成的错（著/着、云/雲、余/馀、里/裡、后/後、干/乾幹等）只在确实转错时才改。数字、人名地名没有第二依据不改。
4. 输出。每部书一份 `<书id>-collate.json`（`python3 tools.py check` 必须 bad 0）和 `<书id>-collate.md`（对校本及其对上率、各类候选数、采纳的逐条两样依据、不改的按类说明、需要人再看的条目）。没有可改的也写 md，json 写 `[]`。

不要改 c13/ 以外的文件（除了 corpus:collate 自己写的缓存）。完成后只回几行：每部书的对校本、对上率、采纳数，以及需要人看的。
