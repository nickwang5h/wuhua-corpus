export type BookId = 'zhuangzi' | 'laozi' | 'lunyu';
export type Passage = { id: string; book: BookId; chapter: string; lines: string[]; terms: { word: string; pinyin: string; meaning: string }[]; translation: string; thought: string; context: string; prompt: string; concepts: string[]; source: string };
export const books: { id: BookId; title: string; roman: string; subtitle: string; description: string; color: string; symbol: string }[] = [
  { id: 'zhuangzi', title: '庄子', roman: 'Zhuāng Zǐ', subtitle: '在万物之间，松开自己。', description: '从齐物到逍遥，试着站到熟悉的边界之外。', color: '#34574e', symbol: '游' },
  { id: 'laozi', title: '道德经', roman: 'Dào Dé Jīng', subtitle: '让事物，回到它的自然。', description: '在有与无、进与退之间，辨认另一种力量。', color: '#69766c', symbol: '道' },
  { id: 'lunyu', title: '论语', roman: 'Lún Yǔ', subtitle: '从日常出发，学着成为自己。', description: '学习、相处与自省，都从身边的一件小事开始。', color: '#866c56', symbol: '仁' },
];
const qiwu = 'https://ctext.org/zhuangzi/adjustment-of-controversies/zh';
const xiaoyao = 'https://ctext.org/zhuangzi/enjoyment-in-untroubled-ease/zh';
const dao = 'https://ctext.org/dao-de-jing/zh';
const xue = 'https://ctext.org/analects/xue-er/zh';
const wei = 'https://ctext.org/analects/wei-zheng/zh';
export const passages: Passage[] = [
 {id:'z1',book:'zhuangzi',chapter:'内篇 · 齐物论',lines:['天地与我并生，','而万物与我为一。'],terms:[{word:'并生',pinyin:'bìng shēng',meaning:'一同存在、生成。这里不宜只按出生时刻相同来理解。'},{word:'为一',pinyin:'wéi yī',meaning:'成为一体、看作一个整体。这里提出的是一种观看万物的视角。'}],translation:'天地和我共同存在，万物和我连成一个整体。',thought:'我们习惯把自己放在世界的对面：我在这里，其他东西在那里。这句话邀请我们暂时松开这种划分。但“齐一”并不必然意味着抹去一切差异；它首先是在追问，差异为什么会被我们变成高下。',context:'本句前文谈大小与寿夭，后文随即追问：既然已经说成“一”，说话本身是否又添了一个区分？不要把这一句读成文章不再追问的最终结论。',prompt:'如果暂时不把自己放在世界的对面，你会怎样描述今天的一次相遇？',concepts:['齐物','物我'],source:qiwu},
 {id:'z2',book:'zhuangzi',chapter:'内篇 · 齐物论',lines:['今者吾丧我，','汝知之乎？'],terms:[{word:'丧',pinyin:'sàng',meaning:'丧失、忘却。此处可作为暂时松开固执自我立场来理解，而非身体消失。'},{word:'汝',pinyin:'rǔ',meaning:'你。此句是南郭子綦对子游的回答。'}],translation:'此刻我忘却了那个执着的自己，你明白吗？',thought:'“吾”和“我”的区分有不同解释。一种入门读法是：能够觉察的我，暂时放下了那个被成见、身份与得失固定住的我。这不是要求否定自己的感受，而是为别的声音腾出一点位置。',context:'《齐物论》开头以南郭子綦的状态和子游的发问引入此句，随后展开人籁、地籁、天籁。它先是一段对话里的经验描述，再通向整篇的认识问题。',prompt:'最近一次争论里，你想保护的是一个事实，还是“我不能错”的感觉？',concepts:['成心','物我'],source:qiwu},
 {id:'z3',book:'zhuangzi',chapter:'内篇 · 齐物论',lines:['物无非彼，','物无非是。'],terms:[{word:'彼',pinyin:'bǐ',meaning:'那、彼方。相对于观看者而言的另一边。'},{word:'是',pinyin:'shì',meaning:'此、这一边。这里先与“彼”相对，不宜直接一律译成“正确”。'}],translation:'事物无不可以被看成彼方，也无不可以被看成此方。',thought:'“这里”和“那里”会随站立的位置改变。庄子借此提醒我们：某些看起来像事物本身的界限，其实也包含观看者的立场。发现立场，不等于一切判断都失去根据。',context:'这一段随后讨论彼与是如何相生，再推进到是非判断。先把指示位置的“彼／是”读清，才能看见文章如何转入论辩。',prompt:'你和别人对同一件事的分歧，哪些来自不同的位置？',concepts:['彼是','齐物'],source:qiwu},
 {id:'z4',book:'zhuangzi',chapter:'内篇 · 齐物论',lines:['彼亦一是非，','此亦一是非。'],terms:[{word:'是非',pinyin:'shì fēi',meaning:'肯定与否定、对与错的判断。'},{word:'亦',pinyin:'yì',meaning:'也、同样。这里让双方的判断被并置看见。'}],translation:'彼方有一套是非，此方也有一套是非。',thought:'当两边都坚信自己正确，仅仅重复结论很难让讨论继续。试着往后退一步，问各自从什么前提出发。理解判断的来路，并不要求放弃辨别和责任。',context:'本句承接“是亦彼也，彼亦是也”，后文继续发问彼是的区分，并提出“道枢”的意象。它不是一句孤立的“谁都对”。',prompt:'选一个你不同意的观点，先替它写出最有力的理由。',concepts:['彼是','成心'],source:qiwu},
 {id:'z5',book:'zhuangzi',chapter:'内篇 · 齐物论',lines:['周与胡蝶，则必有分矣。','此之谓物化。'],terms:[{word:'胡蝶',pinyin:'hú dié',meaning:'即蝴蝶，保留原文用字。'},{word:'物化',pinyin:'wù huà',meaning:'事物的变化、转化。此处关联梦与觉、庄周与蝴蝶的转换，不是现代语境的“把人当作物品”。'}],translation:'庄周与蝴蝶，当然有其分别。这就叫作物的变化与转化。',thought:'梦中是蝶，醒来是周；叙述既保留二者的分别，也让身份的确定性发生松动。可以同时追问：差异真实存在，变化又如何让我们越过原先的界限？',context:'这是《齐物论》结尾梦蝶寓言的收束。前文提出“不知周之梦为胡蝶与，胡蝶之梦为周与”的疑问。关于“物化”的具体含义，历来有不同解释。',prompt:'有什么变化让你发现，自己并不是一个早已定型的人？',concepts:['物化','物我'],source:qiwu},
 {id:'z6',book:'zhuangzi',chapter:'内篇 · 逍遥游',lines:['至人无己，神人无功，','圣人无名。'],terms:[{word:'无己',pinyin:'wú jǐ',meaning:'不执着于一己之成见与局限。入门时不宜理解为取消个人的存在。'},{word:'无功',pinyin:'wú gōng',meaning:'不把功绩据为自我执著的对象，不等于毫无作为。'}],translation:'理想的至人不执着于自我，神人不居功，圣人不被名声束缚。',thought:'如果自由总要等到获得赞扬、证明价值之后才能开始，它便始终有外在的条件。这里把我们引向一种更少受自我、功绩和名声牵引的生活想象。',context:'前文写宋荣子面对毁誉、列子御风，逐层追问“有所待”。这三句是这一段的归结，放回这些层次中读，更能看见它的指向。',prompt:'如果今天不用证明自己，你仍然愿意做的一件事是什么？',concepts:['逍遥','物我'],source:xiaoyao},
 {id:'d1',book:'laozi',chapter:'第一章 · 节选',lines:['道可道，非常道。','名可名，非常名。'],terms:[{word:'道',pinyin:'dào',meaning:'第一个“道”作名词，第二个可读为言说、表述。原句的具体解释有不同传统。'},{word:'常',pinyin:'cháng',meaning:'恒常、长久不变。这里不是现代词语“非常”的“很”。'}],translation:'能够被说出的道，不是恒常的道；能够被命定的名，不是恒常的名。',thought:'命名使我们可以交流，也容易让我们以为名称已经穷尽事物。这句话可以作为阅读的提醒：解释是入口，不必急着把一种解释当作全部。',context:'本句位于通行本第一章。古本用字与断句存在差异，本版采用常见的“常”字通行读法，不混用不同版本作为唯一原文。',prompt:'有没有一个标签，曾让你以为已经认识了一个人？',concepts:['道','名'],source:dao},
 {id:'d2',book:'laozi',chapter:'第八章 · 节选',lines:['上善若水。','水善利万物而不争。'],terms:[{word:'上善',pinyin:'shàng shàn',meaning:'最高、最好的善。'},{word:'不争',pinyin:'bù zhēng',meaning:'不以争夺居先作为自己的方式，并非不分辨、不行动。'}],translation:'最好的善像水。水善于使万物受益，却不与万物争夺。',thought:'水的力量不总是显现在占据中心的时候。它也能通过滋养、流动和处下发挥作用。可以借这个比喻重新观察：一件事除了赢过别人，还能怎样做好？',context:'后文继续写水处于众人不愿处的位置，并列举居、心、与、言、正、事、动等方面的“善”。只取“不争”，容易忽略这些具体的行为要求。',prompt:'你正在推进的事，有没有一种不靠争夺注意力的做法？',concepts:['不争','道'],source:dao},
 {id:'d3',book:'laozi',chapter:'第二十五章 · 节选',lines:['人法地，地法天，','天法道，道法自然。'],terms:[{word:'法',pinyin:'fǎ',meaning:'取法、效法。'},{word:'自然',pinyin:'zì rán',meaning:'自己如此、自然而然；不宜直接等同于今天作为环境或物理世界的“大自然”。'}],translation:'人取法于地，地取法于天，天取法于道，道以自身如此为法。',thought:'最后的“自然”未必是在“道”之上再摆一个更高的外在对象。一种常见读法是：它指向事物自身的运行与生成，不强加一个预设模板。',context:'本章先描述“有物混成”，继而命名为“道”，再讨论“大”与周行往复。末句应放在全章关于道的描述中理解。',prompt:'什么事情需要你认真参与，却不适合由你完全控制？',concepts:['自然','道'],source:dao},
 {id:'d4',book:'laozi',chapter:'第三十三章 · 节选',lines:['知人者智，','自知者明。'],terms:[{word:'知人',pinyin:'zhī rén',meaning:'认识、理解他人。'},{word:'自知',pinyin:'zì zhī',meaning:'认识自己，包括自己的能力、局限与欲望。'}],translation:'能认识他人是智慧，能认识自己才是明察。',thought:'我们常把了解别人当成能力，却对自己的动机习以为常。“自知”可以从一个具体问题开始：我说自己想要的，与实际投入时间的，是否相符？',context:'后文把“胜人”与“自胜”并置，也谈知足与坚持。整章持续把目光从对外的掌握转向对自己的认识。',prompt:'你最近的一个选择，让你看见了自己什么真实的需要？',concepts:['自知','修身'],source:dao},
 {id:'d5',book:'laozi',chapter:'第四十八章 · 节选',lines:['为学日益，','为道日损。'],terms:[{word:'益',pinyin:'yì',meaning:'增加。'},{word:'损',pinyin:'sǔn',meaning:'减少。关于所减为何物有不同解释，可从减去过度干预、成见和欲求入手。'}],translation:'从事学习，日有增加；体会道，则日有减损。',thought:'积累知识与松开执着，可能是两种不同的练习。这里不必读成“学习无用”，而可以追问：我增加了许多知识之后，有没有也增加了不必要的控制欲？',context:'下文是“损之又损，以至于无为”，随后转入取天下的讨论。“减法”不仅指个人生活清理，也与治理方式相连。',prompt:'有哪些原本帮助你的知识或规则，如今反而让你看不见眼前的事？',concepts:['无为','成心'],source:dao},
 {id:'d6',book:'laozi',chapter:'第六十三章 · 节选',lines:['天下难事，必作于易；','天下大事，必作于细。'],terms:[{word:'作',pinyin:'zuò',meaning:'开始、兴起或做起。'},{word:'细',pinyin:'xì',meaning:'细小的事情、尚未显大的开端。'}],translation:'天下的难事，必从容易之处做起；天下的大事，必从细小之处做起。',thought:'大的困难并非总要靠更猛烈的行动解决。在事情尚小、尚易的时候留心，可能更有力量。这也是一种对时机与分寸的敏感。',context:'本章先说“为无为，事无事，味无味”，又说“图难于其易，为大于其细”。末尾还提醒不要轻诺、不要轻视困难。',prompt:'你正在拖延的一件难事，最小的起点是什么？',concepts:['无为','修身'],source:dao},
 {id:'l1',book:'lunyu',chapter:'学而 · 1.1 节选',lines:['学而时习之，','不亦说乎？'],terms:[{word:'时习',pinyin:'shí xí',meaning:'适时温习、实践所学；“习”不只限于重复背诵。'},{word:'说',pinyin:'yuè',meaning:'通“悦”，喜悦。此处不读 shuō。'}],translation:'学了之后，适时温习和实践，不也是令人喜悦的事吗？',thought:'学到的东西在生活中重新出现，才可能成为自己的能力。“习”让学习从一次接收，变成反复经历和体会。',context:'这是《论语》开篇的一问，后面接朋友远来、别人不了解自己而不愠。学习在这里与交往和自我修养相连。',prompt:'最近学到的一件事，你能在今天的生活里怎样试一次？',concepts:['学思','修身'],source:xue},
 {id:'l2',book:'lunyu',chapter:'学而 · 1.4 节选',lines:['吾日三省吾身。'],terms:[{word:'省',pinyin:'xǐng',meaning:'反省、检查。'},{word:'三省',pinyin:'sān xǐng',meaning:'可联系后文三项反省来读，也有多次反省的解释，不必机械规定每日三次。'}],translation:'我每天从多方面反省自己。',thought:'自省不必变成笼统的自责。可以把问题落在具体的关系与行动上：我有没有尽心？有没有守信？有没有实践所学？',context:'说话者是曾子。后文依次问为人谋是否忠、与朋友交是否信、传是否习，给出了反省的具体方向。',prompt:'今天有哪一件小事，你下次愿意做得更诚实一些？',concepts:['修身','自知'],source:xue},
 {id:'l3',book:'lunyu',chapter:'为政 · 2.11',lines:['温故而知新，','可以为师矣。'],terms:[{word:'温故',pinyin:'wēn gù',meaning:'温习、重访旧有的知识与经验。'},{word:'知新',pinyin:'zhī xīn',meaning:'在重访中获得新的认识，而非只增加新的材料。'}],translation:'温习旧知而获得新的理解，就可以成为老师了。',thought:'同一句话，在不同经历之后可能呈现不同含义。重新阅读不是倒退；它能让旧有知识与你此刻的经验相遇。',context:'本句出自《为政》，以温故知新说明为师的条件。它把知识能否不断生出理解，与能否教人联系在一起。',prompt:'重读这句话时，你今天的理解和过去有什么不同？',concepts:['学思','修身'],source:wei},
 {id:'l4',book:'lunyu',chapter:'为政 · 2.15',lines:['学而不思则罔，','思而不学则殆。'],terms:[{word:'罔',pinyin:'wǎng',meaning:'迷惑而无所得。'},{word:'殆',pinyin:'dài',meaning:'危险、困惑不安；此处常用来指空想而缺少依据的处境。'}],translation:'只学习而不思考，就容易迷惑；只思考而不学习，就容易陷入危险的空想。',thought:'读得多并不自动带来理解，想得多也不自动带来可靠判断。让材料与问题相互修正，学习才可能成为自己的认识。',context:'《为政》中多处谈学习、求知与认识自己所知的边界。本句把“学”和“思”并列为不可偏废的活动。',prompt:'你现在最需要的是再读一些材料，还是停下来把已有材料想清楚？',concepts:['学思','自知'],source:wei},
 {id:'l5',book:'lunyu',chapter:'子路 · 13.23',lines:['君子和而不同，','小人同而不和。'],terms:[{word:'和',pinyin:'hé',meaning:'协调、和谐相处；可以包含不同意见。'},{word:'同',pinyin:'tóng',meaning:'这里侧重附和、苟同，不是说所有共同点都不好。'}],translation:'君子能和谐相处，却不盲目附和；小人表面附和，却未必真正和谐。',thought:'关系的稳固，不一定来自永远意见一致。能够把差异说出来，又愿意顾及彼此，或许比维持表面的一致更需要功夫。',context:'本句以“君子／小人”和“和／同”交错成对。这里讨论的不是两种固定的人群标签，而可用来反观两种相处方式。',prompt:'你能怎样表达一次不同意，同时让对方知道你仍然尊重他？',concepts:['和而不同','仁'],source:'https://ctext.org/analects/zi-lu/zh'},
 {id:'l6',book:'lunyu',chapter:'卫灵公 · 15.24 节选',lines:['己所不欲，','勿施于人。'],terms:[{word:'欲',pinyin:'yù',meaning:'想要、愿意接受。'},{word:'施',pinyin:'shī',meaning:'施加。把某种行为或处境加在别人身上。'}],translation:'自己不愿接受的，不要施加给别人。',thought:'把自己的感受当作理解别人的起点，可以帮助我们停下某些伤害。但进一步还要记得：别人和自己的需要未必相同，愿意询问也很重要。',context:'子贡问有没有一个字可以终身奉行，孔子以“恕”回答，继而说出此句。这里的重点是如何由自身推及他人。',prompt:'一件你以为“为别人好”的事，你是否问过对方愿不愿意？',concepts:['仁','和而不同'],source:'https://ctext.org/analects/wei-ling-gong/zh'},
];
export const concepts: Record<string, { description: string; related: string[] }> = {
 '齐物':{description:'重新审视万物之间、观点之间被划定的差别。不是把一切简单变成相同，而是追问判断的立场与限度。',related:['彼是','物我','成心']},
 '物我':{description:'事物与自我之间的关系。阅读《庄子》时，试着同时看见分别的存在，以及分别如何随视角发生变化。',related:['齐物','物化','逍遥']},
 '成心':{description:'已经形成、被执定的心见。这个概念提醒我们留意，既有判断如何先于新的经验作出裁决。',related:['彼是','齐物','无为']},
 '彼是':{description:'彼方与此方，也由此牵动彼此的是非。先看见立场，才有机会反思自己的判断从何而来。',related:['齐物','成心','和而不同']},
 '物化':{description:'《庄子》语境中的事物变化与转化。梦与觉、物与我并非一个不可移动的界面。它不同于现代语境中把人当作物品的“物化”。',related:['物我','齐物','自然']},
 '逍遥':{description:'从外在条件与固执的自我中松开，探问一种更自由的存在方式。它不只是闲暇或任性。',related:['物我','自然','不争']},
 '道':{description:'不同经典中的“道”并不只有一个意思。在《老子》中，它关联万物的生成与运行，也提醒我们言说和命名的限度。',related:['自然','无为','名']},
 '名':{description:'事物的名称，以及命名带来的辨认和界分。名称使交流成为可能，也可能遮住事物尚未被说出的部分。',related:['道','彼是']},
 '自然':{description:'古义可从“自己如此”理解，不宜直接等同于现代的自然环境。它关乎生成、运行与不被强制扭曲的状态。',related:['道','无为','物化']},
 '无为':{description:'减少强作妄为和不必要的干预，不等于什么都不做。阅读时需要区分个人修养与治理语境。',related:['自然','不争','道']},
 '不争':{description:'不把争夺居先当作唯一的行动方式。它可以与积极做事并存，也不等于放弃一切边界。',related:['无为','道','和而不同']},
 '自知':{description:'认识自身的能力、局限和欲望。了解自己不只是一份性格描述，也是在具体选择中辨认自己的动机。',related:['修身','学思','物我']},
 '修身':{description:'在具体行动和关系中反省、练习，逐渐成就自己。本页把不同经典的反思主题并置，并不主张它们有完全相同的思想。',related:['自知','仁','学思']},
 '学思':{description:'学习材料与独立思考彼此支持。重读、实践、提问与反省，让原本属于书页的知识进入自己的生活。',related:['修身','自知']},
 '和而不同':{description:'在保留差异的同时寻求协调。人与人的连接，不必以消灭不同意见为代价。',related:['仁','彼是','不争']},
 '仁':{description:'《论语》中的重要德性概念，涉及待人、成己与关系中的实践。这里从推己及人、认真相处的选段进入，并非完整定义。',related:['修身','和而不同']},
};
export const paths = [
 {id:'self',title:'我，究竟是谁？',intro:'从认识自己，到松开对自己的执着。',ids:['d4','l2','z2','z5'],label:'自知与物我'},
 {id:'others',title:'不同的人，如何相处？',intro:'看见立场的差异，也为彼此留出位置。',ids:['z3','z4','l5','l6'],label:'彼此与相处'},
 {id:'nature',title:'什么才是顺其自然？',intro:'顺应并非放任，无为也不等于不做。',ids:['d3','d2','d6','z6'],label:'自然与行动'},
 {id:'learn',title:'读过的，怎样成为自己的？',intro:'从读懂文字，到形成自己的理解。',ids:['l1','l4','d5','l3'],label:'学习与内化'},
];
export const passageById: Record<string, Passage> = Object.assign(Object.create(null), Object.fromEntries(passages.map(p => [p.id, p])));
export const bookById: Record<string, typeof books[number]> = Object.assign(Object.create(null), Object.fromEntries(books.map(b => [b.id, b])));
