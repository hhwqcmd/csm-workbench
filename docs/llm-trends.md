# LLM 趋势栏目

## 用途与阅读路径

“LLM 趋势”与演示工作台、模板资产库、Seedream、Responses API 和 Managed Agents 平行。栏目用于现场讲解与选型预研，纯静态展示，不调用模型或付费 API。

页面按以下顺序组织：

1. 模型比较：默认只展示文本模型、生视频模型、生图 / 图像编辑三张火山方舟主力卡；点击“友商比较”后，三类模型统一以表格展开火山方舟和指定厂商的价格、参数与关键规格。
2. 九项 benchmark：NL2Repo-Bench、Terminal-Bench 3.0、Terminal-Bench 2.1、SWE Pro、Agents’ Last Exam (ALE)、MCP-Atlas、DeepSWE、OSWorld、MMMU-Pro。
3. 三方榜单：Artificial Analysis 4 张、LMArena 6 张，每张录入前 50；榜单不足 50 条时录入全部公开结果。

## 快照与模型范围

快照日期为 **2026-08-25**；第三方榜单卡片继续保留各自独立的快照日期。

文本旗舰：

- 火山方舟：Doubao-Seed-2.1-Pro
- Anthropic：Claude Fable 5
- OpenAI：GPT-5.6 Sol
- 阿里云：Qwen3.8-Max
- 月之暗面：Kimi K3
- 智谱：GLM-5.3、GLM-5.2
- 深度求索：DeepSeek-V4-Pro-0813、DeepSeek-V4-Flash-0731
- SpaceXAI：Grok 4.6
- MiniMax：MiniMax M3

文本模型展开表先列火山方舟 Doubao-Seed-2.1-Pro / Turbo，再列 Claude、GPT、Qwen、Kimi、GLM、DeepSeek、SpaceXAI、MiniMax。最新一代存在公开多档产品时同时展示，例如 Claude Fable 5 / Opus 5 / Sonnet 5、GPT-5.6 Sol / Terra / Luna、Qwen3.8-Max / Qwen3.7-Plus、DeepSeek-V4-Pro-0813 / V4-Flash-0731；没有同代多档正式产品时不补入无公开调用入口的型号。

视频与图像赛道分别以 Seedance 2.5、Seedream 5.0 Pro 为火山方舟最新主力。视频比较表同时保留已有公开 API 价格的 Seedance 2.0 / Fast / Mini 三档，并以阿里云 Wan3.0 Video 取代上一代 Wan2.7；图像比较表同时列出 Seedream 5.0 Pro / Lite，其中 Pro 按输出像素阈值展示 ¥0.30 / ¥0.60 两档中国区按量价。最新发布型号与 LMArena 可投票配置必须逐项对应；2026-08-14 的视频榜已分别出现 Seedance 2.0 / 2.5 的 720P 配置，页面分列其第 3 / 第 4 名，不能把两个席位互相替代。

## 价格口径

- 文本价格为每百万 tokens 的输入 / 输出价；视频主比较优先统一为纯生成的每输出秒价格，无法安全换算时保留厂商原始单位；图像保留元 / 张或每百万图像 tokens 等原始口径。
- Seed、Qwen、Kimi、GLM、DeepSeek、MiniMax 使用中国用户可访问的人民币公开价。
- Kimi 主表使用缓存未命中输入价；DeepSeek 同样使用缓存未命中价。
- MiniMax M3 官方称价格不变，主表展示中国开放平台 `≤512K` 基础档起价；超过该长度需回到价格页复核阶梯。
- Claude、GPT 与 Grok 保留厂商美元 API 价，不做汇率换算。
- 限时折扣、缓存命中、Batch 和套餐价不进入主比较数值。
- 厂商未披露参数量时明确显示“未披露”，不得以社区估算或推理成本反推。
- GLM-5.3 发布页未披露 API 按量价格，主表显示“未披露”；上下文显示发布评测明确采用的 1M 口径，参数只写“同 GLM-5.2 底座”，不把上一代价格或参数当作新型号独立披露。

2026-08-04 视频价格复核：Seedance 系列统一采用官方 16:9、720p、5 秒、输入不含视频的纯生成示例。Seedance 2.5 为 **¥1.51 / 输出秒**；Seedance 2.0 / Fast / Mini 分别为 **¥0.99 / ¥0.80 / ¥0.50 / 输出秒**。各行同时保留相同分辨率下的 token 原价：2.5 为 ¥70 / 百万 tokens，2.0 / Fast / Mini 分别为 ¥46 / ¥37 / ¥23 / 百万 tokens；输入含视频时分别为 ¥42 / ¥28 / ¥22 / ¥14 / 百万 tokens。MiniMax H3 官方价为 **768P ¥0.50 / 输出秒、2K ¥0.80 / 输出秒**。主表用 Seedance 720p 与 H3 768P 作近似同档比较，并注明分辨率并不完全相同；输入视频、图片等额外素材费用不进入主比较值。

2026-08-06 阿里云百炼模型广场复核：`wan3.0-video` 按输出秒计费，**480P ¥0.30 / 秒、720P ¥0.60 / 秒、1080P ¥1.20 / 秒**，主表采用与 Seedance 相同分辨率档的 720P 价格。官方模型页称其统一支持参考、编辑、复刻与驱动等多种创作能力，最长支持 30 秒，并标注 RPM 30；参数量未披露，继续显示“未披露”。

2026-08-13 文本价格复核：DeepSeek 官网价格页将生产别名 `deepseek-v4-pro` 的模型版本更新为 **DeepSeek-V4-Pro-0813**，中国区每百万 tokens 缓存命中输入 / 缓存未命中输入 / 输出分别为 **¥0.025 / ¥3 / ¥6**；主表继续使用缓存未命中输入 / 输出的 **¥3 / ¥6**。`deepseek-v4-flash` 同页明确为 **DeepSeek-V4-Flash-0731**，保持 **¥1 / ¥2**。SpaceXAI 官方将 Grok 4.6 的 `<200K` 提示价格定为 **$2 / $6**，缓存输入为 $0.50；提示达到 `≥200K` 后整次请求按 **$4 / $12** 计费，缓存输入为 $1，主表展示短上下文标准价并在说明中保留长上下文阶梯。

## Benchmark 口径

每个模型行都有来源链接，按以下优先级填写：

1. 模型厂商正式发布页或官方模型卡。
2. benchmark 官方榜单或 Artificial Analysis。
3. 其他厂商模型卡中的明确交叉对比。
4. 无法找到同名、同版本值时仍显示该模型，数值标记为“—”，同时链接到本次核验的模型页或榜单；不得用相近 benchmark 替代。

单项测评固定展示 Claude Opus 4.6 作为标准对照，不参与最新模型排名。若 Opus 4.6 没有同名、同版本或同量纲公开值，仍保留对照行并显示“—”，不得用相近 benchmark 补位。

当前参与单项测评排名的模型为 Doubao-Seed-2.1-Pro、Claude Fable 5、Claude Opus 5、GPT-5.6 Sol、Qwen3.8-Max、Qwen3.8-27B、Kimi K3、GLM-5.3、DeepSeek-V4-Pro-0813、DeepSeek-V4-Flash-0731、Grok 4.6。GLM-5.2 与 MiniMax M3 已从单项测评排名中移除，但仍保留在“模型对比”的代际产品表中；两处模型范围彼此独立。

所有项目均保留版本、推理档位和 Agent harness 差异的阅读提示。DeepSWE 优先采用当前型号厂商正式发布页或官方模型卡中的同名结果，并保留其版本与 harness；厂商未发布时才回退到 Artificial Analysis v1.3 的公开分项。DeepSWE 是长程软件工程任务，结果对应具体模型、Agent harness 与推理档位，不应视为裸模型分数。

2026-07-31 补充核验使用 LLM Stats 的同名 benchmark 榜单补齐 Seed 的 OSWorld / MMMU-Pro、Qwen3.7-Max 的 NL2Repo 与当时展示的科研代码项、GPT-5.6 Sol 的 SWE Pro，以及 MiniMax M3 的 NL2Repo；Kimi K3 的 SWE Pro 使用厂商技术博客，MiniMax 的 OSWorld-Verified 与 MMMU-Pro 使用厂商正式发布页和官方模型卡。DeepSWE 采用 OpenAI 官方 GPT-5.6 发布页、Kimi K3 官方模型卡和 GLM-5.2 官方模型卡；其余型号未找到厂商自有的同型号结果，保留 AA v1.3 数据或缺失状态。第三方榜单中的厂商数据标注为“厂商披露”，不视为独立复测。

2026-08-03 将 Qwen3.7-Max 替换为 Qwen3.8-Max。价格、参数和上下文采用千问 AI 平台模型页；单项测评采用 Qwen3.8 官方发布：Terminal-Bench 2.1 86.6（Claude Code，avg@10）、SWE-bench Pro 67.7（Claude Code）、DeepSWE 1.1 56.6（Claude Code，为 Claude Code 与 mini-SWE-agent 两套框架中的较高值）、NL2Repo-Bench 55.9（Claude Code）、ALE Pass 27.0（官网未披露 Agent 框架）、OSWorld-Verified 86.1（官网未披露 Agent 框架）、MMMU-Pro 82.3（内部评估，无 Agent 框架）。MCP-Atlas 未发布同名结果，保留“—”。

2026-08-13 在单项测评中新增 DeepSeek-V4-Pro-0813，并保留 DeepSeek-V4-Flash-0731。0813 当时先采用 Artificial Analysis 的独立结果；该临时口径已在 2026-08-25 被同版本官方模型卡覆盖，不再作为当前展示值。Flash 0731 继续保留厂商正式发布成绩 NL2Repo 54.2、Terminal-Bench 2.1 82.7、Agents’ Last Exam 25.2、DeepSWE 54.4，并保留 DeepSeek Harness 极简模式 / max 的配置说明。

Grok 4.6 的单项测评采用 Terminal-Bench 3.0 官方榜的 **26.5**（Grok Build / high）、AA 的 Terminal-Bench 2.1 **88.4**（high），以及 SpaceXAI 正式发布页的 DeepSWE v1.1 **65.9**；其余项目没有同名结果时保留“—”。SpaceXAI 官方价格、上下文和发布成绩与独立榜单结果分开标注。

2026-08-14 将科研代码项替换为 **Terminal-Bench 3.0**。该 benchmark 与 Terminal-Bench 2.1 并列展示，不做跨版本换算。优先采用厂商发布，其次采用 Terminal-Bench 3.0 官方榜：GLM-5.3 **28.3**（智谱官方，Claude Code 2.1.207 / max / avg@3）、GLM-5.2 **4.6**（智谱官方，Claude Code / max）、Kimi K3 **17.4**（智谱官方发布交叉表，Claude Code / max）、GPT-5.6 Sol **34.6**（官方榜，Codex / max）、Claude Fable 5 **34.1**（官方榜，Claude Code / max）、Grok 4.6 **26.5**（官方榜，Grok Build / high）。其余主表型号及 Claude Opus 4.6 未找到同名同版本公开值，显示“—”并链接本次核验页。

同日新增 GLM-5.3，保留 GLM-5.2。智谱官方发布页可映射到当前九项中的成绩为：NL2Repo **58.0**、Terminal-Bench 3.0 **28.3**、Terminal-Bench 2.1 **88.2**、ALE-CLI **28.5**、DeepSWE v1.1 **66.9**；SWE Pro、MCP-Atlas、OSWorld、MMMU-Pro 未发布同名结果，均显示“—”。ALE 采用发布页明确的 ALE-CLI / Claude Code / max 口径，DeepSWE 使用 mini-swe-agent；不以 ProgramBench、Toolathlon 或其他近似项目补位。

2026-08-25 更新单项测评模型池与可核验成绩：

- 新增 Claude Opus 5：Terminal-Bench 3.0 **42.7**（mini-SWE-agent / max）、Terminal-Bench 2.1 **89.1**（Artificial Analysis / max）、SWE Pro **79.2**（adaptive thinking / max）、ALE **27.0**（Claude Code / max）、MCP-Atlas **85.8**（max）、DeepSWE v1.1 **68.8**（max）、OSWorld 2.0 **70.6**（max）；NL2Repo 与 MMMU-Pro 未发布同名结果，显示“—”。OSWorld 2.0 与其他行的 OSWorld-Verified 不是同一版本，来源标签必须保留，不能直接视为严格同口径排序。
- 新增 Qwen3.8-27B：NL2Repo **42.3**（Claude Code）、Terminal-Bench 2.1 **73.0**（Terminus）、SWE Pro **61.7**（Claude Code / 256K）、ALE **20.4**（Claude Code / max）、DeepSWE 1.1 **42.2**（Claude Code / 256K）、OSWorld-Verified **84.3**；Terminal-Bench 3.0、MCP-Atlas、MMMU-Pro 未发布同名结果，显示“—”。
- DeepSeek-V4-Pro-0813 改用同版本官方模型卡：NL2Repo **61.5**、Terminal-Bench 2.1 **87.9**、ALE **25.7**、DeepSWE 1.1 **62.7**，均保留 DeepSeek Harness / max 口径；其余五项没有官方同名结果，显示“—”。
- 按当前 ALE 官方榜刷新 Doubao-Seed-2.1-Pro 为 **19.1**、GPT-5.6 Sol 为 **30.6**（Codex / xhigh）；Claude Fable 5 的 DeepSWE v1.1 改用 Anthropic 最新系统卡值 **69.7**（max）。GLM-5.2 与 MiniMax M3 从单项测评排名移除，Claude Opus 4.6 继续仅作固定标准对照。

2026-08-13 三方榜单改为“前 50，不足则全量”：AA Intelligence / Agentic 中 Grok 4.6 分别第 6 / 第 2，DeepSeek V4 Pro 0813 分别第 23 / 第 14，DeepSeek V4 Flash 0731 分别第 29 / 第 18；AA-Briefcase 中 Grok 4.6 第 4、Flash 0731 第 15，0813 暂无同名结果；Coding Agent Index 当前只有 45 个完整配置，尚无 Grok 4.6 或 DeepSeek V4 Pro 0813 的明确同名配置。Arena Text 中 `grok-4.6-high` 第 43、`deepseek-v4-pro` 第 50；Coding 中 Grok 4.6 第 44；WebDev 中 Grok 4.6 第 5、`deepseek-v4-pro` 第 46。Arena 未显式标注 DeepSeek 的日期版本，因此原始别名不强写成 0813。

2026-08-25 再次刷新三方榜单。Arena 页面公布的快照日期分别为：Text / Coding / WebDev / Vision **2026-08-21**、Text-to-Image **2026-08-10**、Text-to-Video **2026-08-14**；前五张保留前 50，视频榜当前 45 行全量录入。Text 中 `grok-4.6-high` 第 46、`deepseek-v4-pro-high-20260813` 第 50；Coding 中 `dola-seed-2.0-pro` 第 40、DeepSeek 0813 第 43、Grok 4.6 第 44；WebDev 中 Grok 4.6 第 5、DeepSeek 0813 第 12；Vision 改为与保存数据一致的模型配置排名，`dola-seed-2.0-pro` 第 35；Text-to-Image 中 Seedream 5.0 Pro / Lite 分列第 8 / 第 35；Text-to-Video 中 Seedance 2.0 / 2.5 的 720P 配置分列第 3 / 第 4。

Artificial Analysis 同日按当前版本重取：Intelligence Index 已升至 **v4.1.1**，当前所选 29 个配置中 28 个有综合分并全量录入，Grok 4.6、GLM-5.3、DeepSeek V4 Pro 0813 分列第 4 / 第 6 / 第 11；Coding Agent Index 已升至 **v1.4**，56 个完整的“模型 + harness”配置取前 50，DeepSeek V4 Flash 0731 / Pro 0813 分列第 34 / 第 42；Agentic Index 28 行全量录入，GLM-5.3、Grok 4.6、DeepSeek V4 Pro 0813 分列第 2 / 第 3 / 第 10；AA-Briefcase 19 行全量录入，Grok 4.6 xhigh / high 分列第 4 / 第 5，当前没有 DeepSeek 同名成绩。旧快照仅保留为变更记录，不再代表页面现值。

## 榜单选择

榜单区使用两级切换：先选择 Artificial Analysis 或 LMArena，再在横向分段栏中选择具体榜单。页面一次只展开一张前 50 榜单，切换平台时保留各自上次查看的位置，减少十张长榜同时铺开的信息噪声。

每张榜单左栏必须包含“评估方法”表和一句“评估逻辑”。页面标题使用名词型短语，避免问句、口号和重复解释：

- 官方披露权重时直接展示权重，例如 Intelligence Index v4.1.1 的 Agents 34%、Coding 24%、科学推理 24%、通用能力 18%。
- 官方只披露等权合成时显示等权或 `⅓`，例如 Coding Agent Index 和 Agentic Index。
- 官方未披露固定权重时只展示计分方式，不自行推算，例如 AA-Briefcase 的 rubric、分析质量 Elo 与呈现 Elo。
- Arena 榜单统一说明匿名两两比较与 Bradley–Terry 排名，同时按榜单区分输入、样本筛选和人类实际判断对象。

Artificial Analysis：

- Intelligence Index v4.1.1：九项推理、编程与 Agent 评测构成的综合能力信号。
- Coding Agent Index v1.4：DeepSWE 113 项、Terminal-Bench v2.1 89 项、SWE-Atlas-QnA 124 项等权合成，按三次运行的 pass@1 计分。
- Agentic Index：GDPval-AA v2 与 τ³-Banking 等权合成，观察工具使用、规划和自主执行。
- AA-Briefcase：以私有真实知识工作任务衡量正确性、分析质量和交付物呈现质量。

LMArena：

- Text / Overall：看真实用户对文本回答的整体盲测偏好。
- Coding Arena：聚焦代码回答质量。
- WebDev Arena：比较模型生成可运行前端应用的交互体验。
- Vision Arena：比较多模态模型对图片输入的理解与回答质量。
- Text-to-Image：比较纯文本生成图片的用户偏好。
- Text-to-Video：比较文本生成视频的用户偏好。

LMArena 使用匿名两两对比和 Elo 风格统计，需同时阅读置信区间、投票量、preliminary 状态和别名合并。Artificial Analysis 使用固定评测方法，同一模型不同 reasoning effort 可以分别占位。

## 更新流程

1. 复核厂商正式发布页、国内 API 价格页和官方模型卡。
2. 复核三条赛道的最新一代与同代档位，不把上一代低价型号混入“最新一代”。
3. 复核九项 benchmark 的名称、版本、分数、推理配置、Agent harness 及 Claude Opus 4.6 标准对照。
4. 复核十张榜单的前 50（不足则全量）、快照日期、排序方向和筛选条件。
5. 同步更新 `app/components/LlmTrendsWorkbench.tsx`、本文件及对应测试。
6. 运行 `npm test`、`npm run lint` 和项目级完整验证命令。

页面不自动抓取榜单；每次更新都应作为人工核验的研究快照。
