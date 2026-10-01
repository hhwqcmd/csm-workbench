# LLM 趋势栏目

## 用途与阅读路径

“LLM 趋势”与演示工作台、模板资产库、Seedream、Responses API 和 Managed Agents 平行。栏目用于现场讲解与选型预研，其中模型对比、十三项 benchmark 与十张榜单均为日期快照数据，纯静态展示、不调用模型或付费 API；栏目内的“鹈鹕测试”模块是唯一例外，仅在用户显式执行并勾选费用确认后才发起真实调用（详见下文“鹈鹕测试模块”）。

页面按以下顺序组织：

1. 模型比较：默认只展示文本模型、生视频模型、生图 / 图像编辑三张火山方舟主力卡；点击“友商比较”后，三类模型统一以表格展开火山方舟和指定厂商的价格、参数与关键规格。
2. 十三项 benchmark：在原有 NL2Repo-Bench、Terminal-Bench 3.0、Terminal-Bench 2.1、SWE Pro、Agents’ Last Exam (ALE)、MCP-Atlas、DeepSWE、OSWorld、MMMU-Pro、HLE with Tools、GDPval-AA v2.1、Terminal-Bench 4.0 基础上，新增 FrontierSWE v2。
3. 三方榜单：Artificial Analysis 4 张、LMArena 6 张。每张录入前 50；榜单不足 50 条时录入全部公开结果。Text-to-Video 当前 48 行全量录入；Coding Agent Index 官方发布 19 个配置（全量）；AA-Briefcase 官方页结构化数据不提供模型级序列，页面改用 benchlm.ai 模型级镜像 15 行（全量）；Agentic Index 维持镜像口径 20 行。
4. 鹈鹕测试：位于第三方测评之后的独立交互章节，用固定 Prompt 真实生成 SVG 并由裁判模型评分，是栏目内唯一会发起真实调用的模块（详见“鹈鹕测试模块”）。

## 快照与模型范围

快照日期为 **2026-09-30**；第三方榜单卡片继续保留各自独立的快照日期。

文本模型对比表与单项测评使用同一组 33 款模型：

- 火山方舟：Doubao-Seed-2.1-Pro、Doubao-Seed-2.1-Turbo
- Anthropic：Claude Fable 5、Claude Fable 5.1、Claude Mythos 5.1、Claude Opus 5、Claude Opus 5.5、Claude Sonnet 5、Claude Sonnet 5.5
- OpenAI：GPT-6 Astra、GPT-6.1 Sol、GPT-6 Sol、GPT-6 Luna、GPT-5.6 Sol、GPT-5.6 Terra、GPT-5.6 Luna
- 腾讯：Hy4 preview
- 阿里云：Qwen3.8-Max、Qwen3.8-Flash、Qwen3.8-27B
- 阶跃星辰：Step 5 Preview
- 小米：MiMo-V2.6-Pro、MiMo-V2.6-Flash
- 月之暗面：Kimi K3
- 智谱：GLM-5.3、GLM-5.3-Flash
- 深度求索：DeepSeek-V4.1-Flash、DeepSeek-V4-Pro-0813、DeepSeek-V4-Flash-0731
- SpaceXAI：Grok 4.6、Grok 4.7
- Meta：Muse Spark 1.3
- Google：Gemini 3.8 Flash

文本模型展开表先列火山方舟 Doubao-Seed-2.1-Pro / Turbo，再列 Claude、GPT、腾讯混元、Qwen、阶跃星辰、小米 MiMo、Kimi、GLM、DeepSeek、SpaceXAI、Meta、Google。2026-09-23 起新增 Claude Opus 5.5（紧随 Opus 5）、GPT-6 Sol / Luna（紧随 GPT-6 Astra）、Step 5 Preview 与 MiMo-V2.6-Pro / Flash（置于 Qwen 与 Kimi 之间）、Grok 4.7（紧随 Grok 4.6）。2026-09-30 起新增 Claude Mythos 5.1（紧随 Fable 5.1）、Claude Sonnet 5.5（紧随 Sonnet 5）与 GPT-6.1 Sol（紧随 GPT-6 Astra）。Qwen3.7-Plus、Qwen3.8-Flash-Next、GLM-5.2 与 MiniMax M3 已从当前模型范围移除；两处集合由回归测试锁定为完全一致。

视频与图像赛道分别以 Seedance 2.5、Seedream 5.0 Pro 为火山方舟最新主力。视频比较表同时保留已有公开 API 价格的 Seedance 2.0 / Fast / Mini 三档，并以阿里云 Wan3.0 Video 取代上一代 Wan2.7；图像比较表同时列出 Seedream 5.0 Pro / Lite，其中 Pro 按输出像素阈值展示 ¥0.30 / ¥0.60 两档中国区按量价。最新发布型号与 LMArena 可投票配置必须逐项对应；2026-09-04 的视频榜共 48 行，Seedance 2.0 / 2.5 的 720P 配置分列第 6 / 第 7 名，不能把两个席位互相替代。

## 价格口径

- 文本价格为每百万 tokens 的输入 / 输出价；视频主比较优先统一为纯生成的每输出秒价格，无法安全换算时保留厂商原始单位；图像保留元 / 张或每百万图像 tokens 等原始口径。
- Seed、腾讯混元、Qwen、Kimi、GLM、DeepSeek、MiniMax、阶跃星辰与小米 MiMo 优先使用中国用户可访问的人民币公开价。
- Kimi 主表使用缓存未命中输入价；DeepSeek 同样使用缓存未命中价，并按 2026-09-14 起的高峰 / 空闲双轨计价取高峰刊例（空闲约为高峰一半，高峰为北京周一至五 9–12 与 14–18 点）。
- Claude、GPT 与 Grok 保留厂商美元 API 价，不做汇率换算。
- 限时折扣、缓存命中、Batch 和套餐价不进入主比较数值；缓存命中价格写入行内说明，并作为“成本估算”列的输入之一。
- 文本模型表设“成本估算”列：按 cache input : 非缓存输入 : 输出 = 95 : 4 : 1 的混合比例估算每百万 tokens 成本（0.95 × 缓存命中输入价 + 0.04 × 缓存未命中输入价 + 0.01 × 输出价）；人民币行以 ¥ 计，美元行以 $ 计，仅作横向量级参考，不代表单一真实负载的成本。
- 厂商未披露参数量时明确显示“未披露”，不得以社区估算或推理成本反推。
- GLM-5.3 发布页未披露 API 按量价格；2026-09-23 复核后主表改用智谱开放平台中国区牌价 **¥8 / ¥28**（缓存命中 ¥2），不再显示“未披露”。上下文保留发布评测明确采用的 1M 口径，参数只写“同 GLM-5.2 底座”，不把上一代价格或参数当作新型号独立披露。
- Hy4 preview 采用腾讯云 TokenHub 广州公开价 **¥6 / ¥18**，上下文 1M，参数为 **770B / 49B 激活**。
- Qwen3.8-Flash 采用阿里云百炼华北 2 公开价 **¥0.8 / ¥2.7**，但其参数量未在独立模型页披露，不以其他型号的开放权重参数补位。
- GLM-5.3-Flash 于 2026-08-31 发布，官方页面披露 **320B / 18B 激活** 与 1M 上下文；主表采用智谱开放平台中国区牌价 **¥0.8 / ¥2.8**。截至 2026-09-09 24:00（UTC+8）的限时 5 折不进入主比较数值，防止活动结束后把促销价误当常态价。

2026-08-04 视频价格复核：Seedance 系列统一采用官方 16:9、720p、5 秒、输入不含视频的纯生成示例。Seedance 2.5 为 **¥1.51 / 输出秒**；Seedance 2.0 / Fast / Mini 分别为 **¥0.99 / ¥0.80 / ¥0.50 / 输出秒**。各行同时保留相同分辨率下的 token 原价：2.5 为 ¥70 / 百万 tokens，2.0 / Fast / Mini 分别为 ¥46 / ¥37 / ¥23 / 百万 tokens；输入含视频时分别为 ¥42 / ¥28 / ¥22 / ¥14 / 百万 tokens。MiniMax H3 官方价为 **768P ¥0.50 / 输出秒、2K ¥0.80 / 输出秒**。主表用 Seedance 720p 与 H3 768P 作近似同档比较，并注明分辨率并不完全相同；输入视频、图片等额外素材费用不进入主比较值。

2026-08-06 阿里云百炼模型广场复核：`wan3.0-video` 按输出秒计费，**480P ¥0.30 / 秒、720P ¥0.60 / 秒、1080P ¥1.20 / 秒**，主表采用与 Seedance 相同分辨率档的 720P 价格。官方模型页称其统一支持参考、编辑、复刻与驱动等多种创作能力，最长支持 30 秒，并标注 RPM 30；参数量未披露，继续显示“未披露”。

2026-08-13 文本价格复核：DeepSeek 官网价格页将生产别名 `deepseek-v4-pro` 的模型版本更新为 **DeepSeek-V4-Pro-0813**，中国区每百万 tokens 缓存命中输入 / 缓存未命中输入 / 输出分别为 **¥0.025 / ¥3 / ¥6**；主表继续使用缓存未命中输入 / 输出的 **¥3 / ¥6**。`deepseek-v4-flash` 同页明确为 **DeepSeek-V4-Flash-0731**，保持 **¥1 / ¥2**。SpaceXAI 官方将 Grok 4.6 的 `<200K` 提示价格定为 **$2 / $6**，缓存输入为 $0.50；提示达到 `≥200K` 后整次请求按 **$4 / $12** 计费，缓存输入为 $1，主表展示短上下文标准价并在说明中保留长上下文阶梯。

2026-09-15 文本价格复核：DeepSeek 官网价格页自 2026-09-14 起按北京时段双轨计价，主表取高峰刊例。生产别名 `deepseek-v4-pro` 现服务 **DeepSeek-V4-Pro-0813**，缓存未命中输入 / 输出高峰价 **¥9 / ¥27**，2026-08-13 采集的 ¥3 / ¥6 为旧刊例，不再使用；`deepseek-v4-flash` 请求由 **DeepSeek-V4.1-Flash** 按同价服务并按 Flash 档计费，高峰价 **¥2 / ¥8**，官方注明 2026-09-14 后 V4 Pro 继续服务。新增型号 **DeepSeek-V4.1-Flash** 进入文本模型对比与单项测评，主表价格即取 **¥2 / ¥8**。

## Benchmark 口径

每个模型行都有来源链接，按以下优先级填写：

1. 模型厂商正式发布页或官方模型卡。
2. benchmark 官方榜单或 Artificial Analysis。
3. 其他厂商模型卡中的明确交叉对比。
4. 无法找到同名、同版本值时仍显示该模型，数值标记为“—”，同时链接到本次核验的模型页或榜单；不得用相近 benchmark 替代。

单项测评固定展示 Claude Opus 4.6 作为标准对照，不参与最新模型排名。若 Opus 4.6 没有同名、同版本或同量纲公开值，仍保留对照行并显示“—”，不得用相近 benchmark 补位。

当前单项测评的模型集合与上方文本模型对比表严格一致，共 33 款；回归测试直接比较两处模型名集合并禁止重复。没有同名同版本公开成绩的模型仍保留完整行并显示“—”。Claude Opus 4.6 独立置顶为标准对照，不计入这 33 款，也不参与排名。

所有项目均保留版本、推理档位和 Agent harness 差异的阅读提示。DeepSWE 自 2026-09-03 起优先采用 DeepSWE 官方榜的同名型号行，并保留其 mini-swe-agent harness 与推理档位；官方榜未收录时才回退到厂商官方模型卡（当前仅 Qwen3.8-27B 一例），不再使用 Artificial Analysis v1.3 分项。DeepSWE 是长程软件工程任务，结果对应具体模型、Agent harness 与推理档位，不应视为裸模型分数。

SWE-bench Pro、OSWorld、MMMU-Pro 三列自 2026-09-03 起并存两种 LLM Stats 来源口径：`LLM Stats · 厂商披露` 表示分值出自厂商自己的发布材料、由 LLM Stats 汇总，配置说明写在来源串里；`LLM Stats · 框架未披露` 表示该分值只在 LLM Stats 聚合榜上以同名型号出现，榜方不公布 Agent harness 与推理档位。后者只用于填补原本空白的行，来源串本身就是缺口声明，读者不应把这两类值当成严格同口径的横向排序。

2026-07-31 补充核验使用 LLM Stats 的同名 benchmark 榜单补齐 Seed 的 OSWorld / MMMU-Pro、Qwen3.7-Max 的 NL2Repo 与当时展示的科研代码项、GPT-5.6 Sol 的 SWE Pro，以及 MiniMax M3 的 NL2Repo；Kimi K3 的 SWE Pro 使用厂商技术博客，MiniMax 的 OSWorld-Verified 与 MMMU-Pro 使用厂商正式发布页和官方模型卡。DeepSWE 采用 OpenAI 官方 GPT-5.6 发布页、Kimi K3 官方模型卡和 GLM-5.2 官方模型卡；其余型号未找到厂商自有的同型号结果，保留 AA v1.3 数据或缺失状态。第三方榜单中的厂商数据标注为“厂商披露”，不视为独立复测。

2026-08-03 将 Qwen3.7-Max 替换为 Qwen3.8-Max。价格、参数和上下文采用千问 AI 平台模型页；单项测评采用 Qwen3.8 官方发布：Terminal-Bench 2.1 86.6（Claude Code，avg@10）、SWE-bench Pro 67.7（Claude Code）、DeepSWE 1.1 56.6（Claude Code，为 Claude Code 与 mini-SWE-agent 两套框架中的较高值）、NL2Repo-Bench 55.9（Claude Code）、ALE Pass 27.0（官网未披露 Agent 框架）、OSWorld-Verified 86.1（官网未披露 Agent 框架）、MMMU-Pro 82.3（内部评估，无 Agent 框架）。MCP-Atlas 未发布同名结果，保留“—”。

2026-08-13 在单项测评中新增 DeepSeek-V4-Pro-0813，并保留 DeepSeek-V4-Flash-0731。0813 当时先采用 Artificial Analysis 的独立结果；该临时口径已在 2026-08-25 被同版本官方模型卡覆盖，不再作为当前展示值。Flash 0731 继续保留厂商正式发布成绩 NL2Repo 54.2、Terminal-Bench 2.1 82.7、Agents’ Last Exam 25.2、DeepSWE 54.4，并保留 DeepSeek Harness 极简模式 / max 的配置说明。

Grok 4.6 的单项测评采用 Terminal-Bench 3.0 官方榜的 **26.5**（Grok Build / high）、AA 的 Terminal-Bench 2.1 **88.4**（high），以及 SpaceXAI 正式发布页的 DeepSWE v1.1 **65.9**；其余项目没有同名结果时保留“—”。SpaceXAI 官方价格、上下文和发布成绩与独立榜单结果分开标注。

2026-08-14 将科研代码项替换为 **Terminal-Bench 3.0**。该 benchmark 与 Terminal-Bench 2.1 并列展示，不做跨版本换算。优先采用厂商发布，其次采用 Terminal-Bench 3.0 官方榜：GLM-5.3 **28.3**（智谱官方，Claude Code 2.1.207 / max / avg@3）、GLM-5.2 **4.6**（智谱官方，Claude Code / max）、Kimi K3 **17.4**（智谱官方发布交叉表，Claude Code / max）、GPT-5.6 Sol **34.6**（官方榜，Codex / max）、Claude Fable 5 **34.1**（官方榜，Claude Code / max）、Grok 4.6 **26.5**（官方榜，Grok Build / high）。其余主表型号及 Claude Opus 4.6 未找到同名同版本公开值，显示“—”并链接本次核验页。

同日新增 GLM-5.3。智谱官方发布页可映射到当时九项中的成绩为：NL2Repo **58.0**、Terminal-Bench 3.0 **28.3**、Terminal-Bench 2.1 **88.2**、ALE-CLI **28.5**、DeepSWE v1.1 **66.9**；SWE Pro、MCP-Atlas、OSWorld、MMMU-Pro 未发布同名结果，均显示“—”。ALE 采用发布页明确的 ALE-CLI / Claude Code / max 口径，DeepSWE 使用 mini-swe-agent；不以 ProgramBench、Toolathlon 或其他近似项目补位。

2026-08-25 更新单项测评模型池与可核验成绩：

- 新增 Claude Opus 5：Terminal-Bench 3.0 **42.7**（mini-SWE-agent / max）、Terminal-Bench 2.1 **89.1**（Artificial Analysis / max）、SWE Pro **79.2**（adaptive thinking / max）、ALE **27.0**（Claude Code / max）、MCP-Atlas **85.8**（max）、DeepSWE v1.1 **68.8**（max）、OSWorld 2.0 **70.6**（max）；NL2Repo 与 MMMU-Pro 未发布同名结果，显示“—”。OSWorld 2.0 与其他行的 OSWorld-Verified 不是同一版本，来源标签必须保留，不能直接视为严格同口径排序。
- 新增 Qwen3.8-27B：NL2Repo **42.3**（Claude Code）、Terminal-Bench 2.1 **73.0**（Terminus）、SWE Pro **61.7**（Claude Code / 256K）、ALE **20.4**（Claude Code / max）、DeepSWE 1.1 **42.2**（Claude Code / 256K）、OSWorld-Verified **84.3**；Terminal-Bench 3.0、MCP-Atlas、MMMU-Pro 未发布同名结果，显示“—”。
- DeepSeek-V4-Pro-0813 改用同版本官方模型卡：NL2Repo **61.5**、Terminal-Bench 2.1 **87.9**、ALE **25.7**、DeepSWE 1.1 **62.7**，均保留 DeepSeek Harness / max 口径；其余五项没有官方同名结果，显示“—”。
- 按当前 ALE 官方榜刷新 Doubao-Seed-2.1-Pro 为 **19.1**、GPT-5.6 Sol 为 **30.6**（Codex / xhigh）；Claude Fable 5 的 DeepSWE v1.1 改用 Anthropic 最新系统卡值 **69.7**（max）。GLM-5.2 与 MiniMax M3 从单项测评排名移除，Claude Opus 4.6 继续仅作固定标准对照。

2026-08-31 统一文本模型与单项测评集合，并补充新型号：

- 新增腾讯 **Hy4 preview**：NL2Repo **58.9**（Claude Code / 1000 turns）、HLE with Tools text-only **55.4**、Terminal-Bench 2.1 **85.4**（Claude Code）、SWE Pro **65.7**（swe-agent）、MCP-Atlas public **83.7**（Claude Code）、ALE-CLI **22.8**（Claude Code）、DeepSWE **64.3**（mini-swe-agent）；GDPval-AA v2、Terminal-Bench 4.0 / 3.0、OSWorld-Verified、MMMU-Pro 没有同名结果，显示“—”。
- 新增 **Qwen3.8-Flash**，并移除 Qwen3.7-Plus 与 Qwen3.8-Flash-Next。Qwen3.8-Flash 是托管生产 API，官方没有以该表头发布十二项同名成绩，因此十二项均保留“—”。
- 新增 **GLM-5.3-Flash**：NL2Repo **56.3**（1M / max）、HLE with Tools full **55.3**（max）、GDPval-AA v2 **1,765 Elo**、Terminal-Bench 2.1 **84.3**（Claude Code 2.1.207 / max）、ALE **26.3**、DeepSWE v1.1 **63.4**（mini-swe-agent / max）；Terminal-Bench 4.0 / 3.0、SWE Pro、MCP-Atlas、OSWorld、MMMU-Pro 没有同名结果，显示“—”。
- 将 Doubao-Seed-2.1-Turbo、Claude Sonnet 5、GPT-5.6 Terra / Luna 补入单项测评，将 Claude Opus 5 与 Qwen3.8-27B 同时补入模型对比与单项测评；移除 GLM-5.2 与 MiniMax M3。没有本次同口径值的型号显示“—”。两处集合由回归测试锁定为完全一致，Claude Opus 4.6 继续独立作为标准对照。

同日新增三项 Agent benchmark，原有九项继续保留：

- **HLE with Tools**：采用准确率（%），只录入明确标注 tools 的精确型号结果。当前可核验值为 Claude Fable 5.1 **65.0**、Claude Opus 5 **64.7**、Claude Fable 5 **63.9**、GLM-5.3 **62.5**、DeepSeek-V4-Pro-0813 **60.0**、GPT-5.6 Sol **58.0**、Claude Sonnet 5 **57.4**、GPT-6 Astra **57.2**（OpenAI 官方发布 · tools 口径）、Qwen3.8-Max **56.2**、Kimi K3 **56.0**、Hy4 preview **55.4**、GLM-5.3-Flash **55.3**、DeepSeek-V4-Flash-0731 **51.5**、Muse Spark 1.3 **49.1**、Gemini 3.8 Flash **47.8**；Claude Opus 4.6 标准对照为 **53.0**。其中 GPT-5.6 Sol 来自 Qwen 官方交叉评测，Hy4 preview 为 text-only 且官方注明约 2.23% 截断，Fable 5 与 Fable 5.1 含 Opus 4.8 safety fallback，Muse Spark 1.3 与 Gemini 3.8 Flash 取自 Artificial Analysis 模型页而非厂商自有 tools 跑分；来源、题集子集、工具集、harness、上下文管理与 judge 并不完全一致，因此页面将配置写入来源，不把这些结果表述为统一官方榜。
- **GDPval-AA v2**：采用 Artificial Analysis 在 Stirrup / E2B 环境对 220 项真实职业交付物进行匿名两两盲评后拟合的 raw Elo，人类专家基线为 1,000。官方于 2026-09-04 重锚定 live 比较池，全部 Elo 系统性下移，与旧快照不可比。当前最高配置为 Claude Fable 5.1 **1,764**、Claude Opus 5 **1,735**、Muse Spark 1.3 **1,703**、Grok 4.6 **1,663**、GLM-5.3-Flash 与 GLM-5.3 **1,655**、DeepSeek-V4.1-Flash **1,632**、Claude Fable 5 **1,631**、Qwen3.8-Max **1,630**、GPT-5.6 Sol **1,624**、GPT-6 Astra **1,580**、Kimi K3 **1,551**、Claude Sonnet 5 **1,501**、DeepSeek-V4-Pro-0813 **1,493**、GPT-5.6 Terra **1,477**、GPT-5.6 Luna 与 Gemini 3.8 Flash **1,464**、DeepSeek-V4-Flash-0731 **1,442**。Doubao 两档、Hy4 preview、Qwen3.8-Flash 无精确型号值，显示“—”；Qwen3.8-Flash 不以榜上的 Qwen3.8-Flash-Next 变体补位。Elo 会随 live 比较池重算，本页冻结 2026-09-15 快照并保留 95% CI。
- **Terminal-Bench 4.0**：采用 66 项任务、每题 5 次、共 330 trials 的 pooled resolution rate 与 95% CI。当前官方榜同名结果为 GPT-6 Astra **58.2 ±2.8**（Codex / max）、Claude Fable 5.1 **57.9**（Claude Code / max）、Claude Opus 5 **51.8**（Claude Code 2.1.231 / max）、Claude Fable 5 **44.5**（Claude Code 2.1.231 / max）、GLM-5.3 **41.8**（Claude Code 2.1.207 / max）、GPT-5.6 Sol **37.3**（Codex 0.149.1 / max）、GPT-5.6 Terra **21.5**（Codex 0.149.1 / max）、Grok 4.6 **20.3**（Grok Build 1.0.5 / high）、Gemini 3.8 Flash **19.1**（mini-SWE-agent / high）、GPT-5.6 Luna **17.3**（Codex 0.149.1 / max）、Claude Sonnet 5 **12.4**（Claude Code 2.1.231 / max）。4.0 统一 8 小时 Agent 时限并调整资源配置，是需要重跑的破坏性版本，不能与 3.0 / 2.1 串接或用旧分数补缺。
- **FrontierSWE v2**：采用官方榜 proximus harness 的 mean@5 通过率。当前榜与本栏目模型同名的是 Claude Fable 5.1 **56.3**、GPT-5.6 Sol **32.2**、GLM-5.3 **30.2**、Kimi K3 **25.9**、Grok 4.6 **25.3**、Gemini 3.8 Flash **19.6**、Qwen3.8-Max **15.8**、DeepSeek-V4-Flash-0731 **14.8**。榜上的 Muse Spark 1.3 之外的 Muse Spark 1.2 **12.0** 与 Inkling **4.1** 均非本栏目型号，不用来给 Muse Spark 1.3 补位，该模型保留“—”并在缺失说明中写明榜上最接近的变体及其分值。

GDPval-AA v2 的 Elo 不与百分比共用进度条；页面直接展示原始数值、单位、来源与置信区间。HLE with Tools 与 Terminal-Bench 4.0 同样把结果视为“模型 + Agent harness + effort”配置，不视为裸模型能力。

2026-09-03 新增三款模型、一项 benchmark，并按当前官方榜复核全部单项分数：

- 新增 **Claude Fable 5.1**（Anthropic，2026.09.01）：HLE with Tools **65.0**（full / Search + Fetch + Code + tools / max / Opus 4.8 fallback）、GDPval-AA v2 **1,853 Elo**、Terminal-Bench 4.0 **57.9**（Claude Code / max）、FrontierSWE v2 **56.3**（proximus）、Terminal-Bench 2.1 **91.4**、OSWorld **77.9**；NL2Repo、Terminal-Bench 3.0、SWE Pro、ALE、MCP-Atlas、DeepSWE、MMMU-Pro 无同名结果，显示“—”。
- 新增 **Muse Spark 1.3**（Meta，2026.09.02）：HLE with Tools **49.1**、GDPval-AA v2 **1,754 Elo**、Terminal-Bench 2.1 **88.8**、DeepSWE **75.4**、OSWorld **66.9**；Terminal-Bench 4.0 与 FrontierSWE v2 榜上只有上一代 Muse Spark 1.2，不用来补位，显示“—”。
- 新增 **Gemini 3.8 Flash**（Google，2026.09.02）：HLE with Tools **47.8**、GDPval-AA v2 **1,545 Elo**、Terminal-Bench 4.0 **19.1**（mini-SWE-agent / high）、Terminal-Bench 2.1 **89.4**、DeepSWE **74.0**、OSWorld **59.0**；FrontierSWE v2 榜上只有 Gemini 3.7 Flash，不用来补位。
- 新增第十三项 **FrontierSWE v2**，口径见上文对应条目。
- 按 Terminal-Bench 4.0 官方榜复核后修正两处错误：Claude Fable 5.1 原存 **55.8 ±3.2** 为过期值，榜上实为 **57.9 ±3.8**；Gemini 3.8 Flash 原把 harness 写成 Opencode、CI 写成 ±3.0，榜上实为 mini-SWE-agent / ±3.4。两处来源均标注“官方榜”，必须与榜面一致。
- DeepSWE、Agents’ Last Exam 与 GDPval-AA v2 三列按当日官方榜重取：DeepSWE 改用 `deepswe.datacurve.ai` 官方榜的 mini-swe-agent 同名行，Kimi K3 的 GDPval-AA v2 由 1,644 升至 **1,668**、GPT-5.6 Luna 由 1,544 升至 **1,569**。
- SWE-bench Pro、OSWorld、MMMU-Pro 三列对照 LLM Stats 同日更新的榜单逐行复核，原有“厂商披露”口径的值全部一致，未作改动。
- 同三列按 LLM Stats 榜上的同名型号补齐 2026-08-31 留空的行，来源统一标注 **`LLM Stats · 框架未披露`**：Doubao-Seed-2.1-Turbo（榜上别名 Seed 2.1 Turbo）SWE Pro **57.0**、OSWorld **76.4**、MMMU-Pro **82.2**；GPT-5.6 Terra SWE Pro **63.4**、MMMU-Pro **80.7**；GPT-5.6 Luna SWE Pro **62.7**、MMMU-Pro **78.4**；Claude Sonnet 5 SWE Pro **63.2**。LLM Stats 是聚合榜，只发布分值、不公布 Agent harness 与推理档位，所以来源串本身即缺口声明，这些值不与同列的厂商披露值构成严格同口径排序。
- 仍保留“—”的三处缺口及原因：Qwen3.8-Flash 在 SWE Pro 榜上与 Qwen3.8-Flash-Next 并列第 12、同为 62.5，别名歧义且非精确同名，不补位（该模型十二项整体留空的 2026-08-31 决定继续有效）；Muse Spark 1.3 在 MMMU-Pro 榜上只有不带版本号的 Muse Spark（0.804），不补位；Claude Sonnet 5 未出现在 OSWorld 与 MMMU-Pro 榜上。
- Claude Opus 4.6 标准对照行的 OSWorld **72.7** 与 LLM Stats 榜第 3 名同值，但来源继续保留 Anthropic 官方发布，不改写为聚合榜口径；对照行其余项目维持原状。
- Terminal-Bench 3.0 官方榜已随 4.0 发布下线：`frontierbench.ai` 现 301 跳转到只公布 4.0 的 `tbench.ai`，Harbor Hub 的 3.0 数据集页只提供任务清单、不再提供榜单。当前四条标注“Terminal-Bench 3.0 官方榜”的值是榜单在线时采集的历史结果，无法在原链接复核，页面保留原值与原来源描述；Terminal-Bench 3.0 的 3.0 发布博客给出的 Fable 5 为 33.8，与已采集的 34.1 属不同批次，不用来覆盖。GLM-5.3 **28.3** 与 Kimi K3 **17.4** 仍以智谱官方发布页为来源，不受影响。

2026-08-13 三方榜单改为“前 50，不足则全量”：AA Intelligence / Agentic 中 Grok 4.6 分别第 6 / 第 2，DeepSeek V4 Pro 0813 分别第 23 / 第 14，DeepSeek V4 Flash 0731 分别第 29 / 第 18；AA-Briefcase 中 Grok 4.6 第 4、Flash 0731 第 15，0813 暂无同名结果；Coding Agent Index 当前只有 45 个完整配置，尚无 Grok 4.6 或 DeepSeek V4 Pro 0813 的明确同名配置。Arena Text 中 `grok-4.6-high` 第 43、`deepseek-v4-pro` 第 50；Coding 中 Grok 4.6 第 44；WebDev 中 Grok 4.6 第 5、`deepseek-v4-pro` 第 46。Arena 未显式标注 DeepSeek 的日期版本，因此原始别名不强写成 0813。

2026-08-25 再次刷新三方榜单。Arena 页面公布的快照日期分别为：Text / Coding / WebDev / Vision **2026-08-21**、Text-to-Image **2026-08-10**、Text-to-Video **2026-08-14**；前五张保留前 50，视频榜当前 45 行全量录入。Text 中 `grok-4.6-high` 第 46、`deepseek-v4-pro-high-20260813` 第 50；Coding 中 `dola-seed-2.0-pro` 第 40、DeepSeek 0813 第 43、Grok 4.6 第 44；WebDev 中 Grok 4.6 第 5、DeepSeek 0813 第 12；Vision 改为与保存数据一致的模型配置排名，`dola-seed-2.0-pro` 第 35；Text-to-Image 中 Seedream 5.0 Pro / Lite 分列第 8 / 第 35；Text-to-Video 中 Seedance 2.0 / 2.5 的 720P 配置分列第 3 / 第 4。

2026-09-03 十张榜单全部重取。Artificial Analysis 四张：Intelligence Index 仍为 **v4.1.1**，完整榜已扩到 **291** 个配置，录入前 50，榜单链接由 `/models` 改为 `/leaderboards/models`，Claude Fable 5.1 · max with fallback 第 1、Muse Spark 1.3 · max 第 6、Grok 4.6 · high 第 10、GLM-5.3 · max 第 15、DeepSeek V4 Pro 0813 · max 第 34；Coding Agent Index 仍为 **v1.4**，当前 66 个配置中 64 个三项齐备且可用，录入前 50，Claude Code - Opus 5 · xhigh 第 1、Codex - DeepSeek V4 Flash 0731 · max 第 43，Grok Build 一栏仍只有 Grok 4.5 · high（第 10），没有 Grok 4.6 同名配置；Agentic Index 的官方结构化数据当前只发布 **20** 个有分配置，已全量录入，Claude Fable 5.1 · max with fallback 第 1、Muse Spark 1.3 · max 第 2、GLM-5.3 · max 第 4、Grok 4.6 · high 第 5、DeepSeek V4 Pro 0813 · max 第 15，图表另标称 26 个点位但不输出可读取的数值，`/evaluations/agentic-index` 返回 404，因此不把这 20 行与 2026-08-25 的旧 28 行混排；AA-Briefcase 完整榜 **88** 个配置，录入前 50，Claude Fable 5.1 · max with fallback 第 1、Grok 4.6 · xhigh / high 分列第 7 / 第 10、DeepSeek V4 Pro 0813 / Flash 0731 分列第 29 / 第 30。

LMArena 六张同日重取，前五张保留前 50，Text-to-Video 当前 **46** 行全量录入。Text / Overall 中 `claude-fable-5.1-max` 第 3、`gemini-3.8-flash-high` 第 8、`grok-4.6-high` 第 49，前 50 已无火山方舟与 DeepSeek 配置；Coding Arena 中 `gemini-3.8-flash-high` 第 7、`claude-fable-5.1-max` 第 34、`dola-seed-2.0-pro` 第 43、`grok-4.6-high` 第 45；WebDev Arena 中 `claude-fable-5.1-max` 第 1、`grok-4.6-high` 第 7、`hy4-preview` 第 9、`deepseek-v4-pro-high-20260813` 第 17、`seed-2.1-pro-preview` 第 32；Vision Arena 中 `qwen3.8-max` 第 3、`dola-seed-2.0-pro` 第 36；Text-to-Image 中 Seedream 5.0 Pro 第 8，Seedream 4.5 / 4-2K / 5.0 Lite 分列第 32 / 34 / 35；Text-to-Video 中 Seedance 2.0 / 2.5 的 720P 配置分列第 4 / 第 5。Arena 仍未显式标注 DeepSeek 的日期版本，除 WebDev 外不把原始别名强写成 0813。

2026-09-15 刷新全部十张榜单与单项测评，模型池由 21 款扩到 23 款：

- 新增 **GPT-6 Astra**（OpenAI，2026.09.03，$10 / $50，上下文 1.05M）：HLE with Tools **57.2**（官方发布 · tools 口径）、GDPval-AA v2 **1,580 Elo**（max）、Terminal-Bench 4.0 **58.2 ±2.8**（Codex / max，登顶）、ALE **59.3**、DeepSWE **74%**（mini-swe-agent / xhigh）、OSWorld **72.6**（OSWorld 2.0 口径）；其余七项无同名同版本公开值，显示“—”。openai.com 新闻稿页访问受限，引用统一走已核验的 developers.openai.com 模型对比页。
- 新增 **DeepSeek-V4.1-Flash**（深度求索，2026.09，¥2 / ¥8 高峰刊例，1M 上下文）：仅 GDPval-AA v2 **1,632 Elo**（reasoning / max）有精确型号值，其余十二项保留“—”，不以 V4-Flash-0731 或其他变体补位。
- GDPval-AA v2 官方于 2026-09-04 重锚定 live 比较池，页面 18 行全部按新池重取并保留 95% CI；新值整体下移约 80–100 分，与 09-03 旧值不可比。
- Terminal-Bench 4.0 官方榜易主：GPT-6 Astra **58.2** 超过 Claude Fable 5.1 的 **57.9**；其余九行与 09-03 一致，未发现新值。
- DeepSWE 官方榜随 09-14 更新复核：Grok 4.6 的推理档位实为 **medium**（页面原串 xhigh）、Claude Fable 5 实为 **xhigh**（原串 max），两处口径串已按榜面更正，分值不变。
- FrontierSWE v2 官方榜新增 Gemini 3.8 Flash 同名行 **19.6**（proximus），此前“—”缺口补上；原“榜上只有 Gemini 3.7 Flash”的缺口语不再成立。
- AA Intelligence Index 两周内连跳 v4.2、v4.3：v4.1.1 榜首 Fable 5.1 单独 66 分（第二名 61）→ v4.2 的 57:55 → v4.3 四个配置并列 **53**（Fable 5.1 max / xhigh with fallback 与 GPT-6 Astra max / xhigh）。v4.3 共 641 个配置，计分改为 10 项基准按 4 类不等权合成（Agents 30%：Briefcase 15 + GDPval-AA v2 10 + AutomationBench-AA 5；Coding 20%：Terminal-Bench v4.0 10 + SciCode 10；通用 30%：AA-Omniscience 15 + GDP.pdf 10 + AA-LCR v1.1 5；科学推理 20%：HLE 10 + CritPt 10），私有测试集占 45%，与 v4.1.1 九项口径不可比。关键名次：Muse Spark 1.3 · max 第 13、GLM-5.3 · max 第 19、Grok 4.6 · high 第 20、GLM-5.3-Flash 第 27、DeepSeek V4.1 Flash · max 第 36（新配置上榜）、DeepSeek V4 Pro 0813 · max 第 44。
- AA Coding Agent Index 由 v1.4 升至 **v1.5**：Terminal-Bench 4.0（66 项）替换 Terminal-Bench 2.1（89 项），DeepSWE 113 项与 SWE-Atlas-QnA 124 项不变，等权与三次运行 pass@1 计分不变；官方当前仅发布 10 个配置，全量录入。Claude Code - Fable 5.1 · max (with fallback) 与 Codex - GPT-6 Astra · max 并列 62 居首，Grok Build - Grok 4.6 · xhigh 第 7，Codex - DeepSeek V4 Pro 0813 · max 第 9。
- AA Agentic Index 官方配置级入口（`/models/capabilities/agentic/`）已下线，页面降级为 benchlm.ai 镜像口径（Model-level，09-14 更新，20 行按模型聚合），与 09-03 配置级快照不可比；镜像口径下 Claude Fable 5.1 第 1、Claude Opus 5 第 2、Muse Spark 1.3 第 3、GLM-5.3 与 Grok 4.6 并列第 4。
- AA-Briefcase 完整榜仍为 88 个配置，官方页结构化数据仅嵌入前 20，页面按前 20 全量录入；Claude Fable 5.1 · max with fallback **1,662** 第 1，Claude Opus 5 · max 第 3，GPT-6 Astra · max 第 8，Grok 4.6 · high 第 10，DeepSeek V4.1 Flash · max 第 17。
- LMArena 六张重取，快照分别为 Text / Coding / Vision **2026-09-13**、WebDev **2026-09-11**、Text-to-Image **2026-09-08**、Text-to-Video **2026-09-04**。Text / Overall 中上代配置 `claude-fable-5` 登顶（1,506），`fable-5.1-max` 掉至第 5，`gpt-6-astra-max` 第 24，`glm-5.3-flash` 第 29，`deepseek-v4-pro-high-20260813` 第 50，前 50 无火山方舟配置；Coding Arena 中 `claude-fable-5` 第 1、`gpt-6-astra-max` 第 6、`kimi-k3-max` 第 7、`fable-5.1-max` 掉至第 32、`dola-seed-2.0-pro` 第 44，`deepseek-v4-pro-high-20260813`（第 59）掉出前 50；WebDev Arena 中 `gpt-6-astra-max` 发布首周登顶（1,800），`fable-5.1-max` 第 2，`hy4-preview` 第 11，`grok-4.6-high` 第 13，新配置 `deepseek-v4.1-flash-max` 第 16，`seed-2.1-pro-preview` 第 38；Vision Arena 中 `claude-fable-5` 第 1、`qwen3.8-max` 第 2、`dola-seed-2.0-pro` 第 41；Text-to-Image 中 Seedream 5.0 Pro 第 10，Seedream 4.5 / 4-2K / 5.0 Lite 分列第 34 / 36 / 37；Text-to-Video 当前 48 行全量录入，Seedance 2.5 / 2.0 的 720P 配置分列第 6 / 第 7，前五为 Gemini omni 两档、Wan3.0、FLUX.3 Video 与 Grok Imagine Video 1.5。
- DeepSeek 价格页自 2026-09-14 起双轨计价，V4-Pro-0813 主表价更正为 ¥9 / ¥27（高峰刊例），V4-Flash-0731 并入 V4.1-Flash 同价服务；详见“价格口径”一节。

2026-09-23 全面复核：模型池由 23 款扩到 30 款，文本模型表新增“成本估算”列。

- 新增 **Claude Opus 5.5**（Anthropic，2026.09.22，$4 / $20，缓存读取 $0.20，1M 上下文）：Intelligence Index v4.3.2 以 **58** 分登顶（max with fallback）；GDPval-AA v2.1 **1,846 ±23**（adaptive / max / default fallback）为表内最高；HLE with Tools **67.7**；Terminal-Bench 4.0 **66.4%**（xhigh / 生产护栏启用 · ±2.6，Anthropic 官方口径，非官方榜）；OSWorld 2.0 **81.8%**（partial）；其余项目无同名同版本公开值，显示“—”。
- 新增 **GPT-6 Sol**（OpenAI，2026.09.22，$2 / $10，缓存输入 $0.20，872k 上下文）与 **GPT-6 Luna**（$0.10 / $0.50，缓存输入 $0.01，1M）：GDPval-AA v2.1 分别为 **1,487** / **1,367**（max），其余单项显示“—”；两者同时进入 AA 榜单，Codex - GPT-6 Sol · max 在 Coding Agent Index 第 6、Codex - GPT-6 Luna · max 第 18，Intelligence Index v4.3.2 分列第 14 / 第 41。
- 新增 **Step 5 Preview**（阶跃星辰，¥7 / ¥20，缓存命中 ¥0.35，1M / 64k 输出，600B / 27B 激活）：Intelligence Index v4.3.2 第 26（44 分）；GDPval-AA v2.1 **1,566 ±31**；HLE with Tools **59.4**（High / 纯文本子集）；Terminal-Bench 4.0 **33.3%**、Terminal-Bench 2.1 **85.0%**、ALE **29.5%**、MCP-Atlas **85.6%**、MMMU-Pro **76.0%**、DeepSWE v1.1 **67.7%**，均阶跃官方口径且 harness 未披露，来源串注明“非官方榜口径”。
- 新增 **MiMo-V2.6-Pro**（小米，¥3 / ¥6，缓存命中 ¥0.025，1M，1.02T / 42B 激活）与 **MiMo-V2.6-Flash**（¥1 / ¥2，缓存命中 ¥0.02，上下文未披露）：Pro 的 Intelligence Index v4.3.2 第 18（46 分，榜上开源最高）、GDPval-AA v2.1 **1,673 ±19**、DeepSWE v1.1 **72.6%**（RL 后）；Flash 的 DeepSWE v1.1 **65.7%**；两者其余单项显示“—”。
- 新增 **Grok 4.7**（SpaceXAI，2026.09.21，$2 / $6，缓存输入 $0.50，500K）：Intelligence Index v4.3.2 第 16；GDPval-AA v2.1 **1,695 ±20**（xhigh）；Terminal-Bench 4.0 **37.6%**（xhigh）与 DeepSWE v1.1 **71.0%**（high），均为 xAI 官方口径；Coding Agent Index 中 Grok Build - Grok 4.7 · xhigh 第 7。
- **成本估算列**使用本轮收集的缓存命中价，按 95 : 4 : 1 混合换算（见“价格口径”）。示例：Claude Opus 5.5 $0.55、GPT-6 Luna $0.0185、Kimi K3 ¥3.7、GLM-5.3 ¥2.5、Step 5 Preview ¥0.8125、MiMo-V2.6-Pro ¥0.20375、MiMo-V2.6-Flash ¥0.079。
- 单项测评复核：Claude Opus 5.5 与 Step 5 Preview 补入 HLE with Tools（67.7 / 59.4）；全部 GDPval-AA 行升级为 **v2.1** 口径（AA 榜单侧由 v2 更名 v2.1，220 项任务、Stirrup harness 与 1,600 锚定不变），原 19 行分数全部重取并保留 95% CI，另新增 6 个模型行；Terminal-Bench 4.0 新增 Opus 5.5、Grok 4.7、Step 5 Preview 三行。
- AA Intelligence Index 由 v4.3 升至 **v4.3.2**（权重结构不变：Agents 30% / Coding 20% / 通用 30% / 科学推理 20%；完整榜扩至 **664** 个配置）：Claude Opus 5.5 · max with fallback 以 58 分第 1，GPT-6 Astra · max 第 6，Grok 4.7 · xhigh 第 16，MiMo-V2.6-Pro 第 18，GLM-5.3 · max 第 22，Step 5 Preview 第 26，DeepSeek V4.1 Flash · max 第 38。
- AA Coding Agent Index 仍为 **v1.5**，官方配置由 10 个扩到 **19** 个（全量录入）：Claude Code - Fable 5.1 · max (with fallback) **62.2** 居首，新配置 Devin Fusion CLI 两行分列第 2 / 第 5，Grok Build - Grok 4.7 · xhigh 第 7。
- AA-Briefcase 当前为 **v1.1** 口径：AA 官方页结构化数据不再提供模型级序列，页面改用 benchlm.ai 模型级镜像（09-22 更新，14 行全量录入）；Claude Opus 5.5 **1,822** 第 1、Claude Opus 5 第 2、Claude Fable 5.1 第 3、Grok 4.7 第 4。
- AA Agentic Index 镜像与 LMArena 六张榜单本次未发现新版本发布，沿用 2026-09-15 快照。
- GLM-5.3 主表价格由“未披露”改为智谱开放平台中国区牌价 **¥8 / ¥28**（缓存命中 ¥2）；其余主表价格与 2026-09-15 一致。
- 数据来源增补：Anthropic Claude Opus 5.5 发布页、xAI Grok 4.7 发布页、小米 MiMo 价格页与模型卡、阶跃星辰 Step 5 Preview 页面；GDPval-AA 链接版本号同步更名。

2026-09-30 新增两款 Anthropic 与一款 OpenAI 模型，模型池由 30 款扩到 33 款，快照日期推进：

- 新增 **Claude Mythos 5.1**（Anthropic，2026.09.01，$10 / $50，缓存读取 $0.25，1M / 128k 输出，Cyber 门控）：唯一非统一榜口径的官方值为 Terminal-Bench 4.0 **60.9%**（Anthropic 系统卡 · Mythos 门控），其余十二项无同名同版本公开值显示“—”；无 Artificial Analysis 公开分，不进入任何第三方榜单。
- 新增 **Claude Sonnet 5.5**（Anthropic，2026.09.28，$2 / $10，缓存读取 $0.20，1M / 128k 输出）：HLE with Tools **64.5%**（Anthropic 官方 / max）、GDPval-AA v2.1 **1,844 ±24**（adaptive / max / default fallback）、Terminal-Bench 4.0 **70.6%**（Anthropic 官方 · 非统一榜口径）、OSWorld **80.1%**（OSWorld 2.1 / partial），其余显示“—”。榜单侧 Intelligence Index v4.3.2 · max with fallback 以 **56** 分第 3，AA-Briefcase 模型级镜像 **1,811** 第 2。
- 新增 **GPT-6.1 Sol**（OpenAI，2026.09.29，$2 / $10，缓存输入 $0.10，1.1M 上下文）：十三项均无公开同名成绩显示“—”；仅以 5 个 effort 档进入 Intelligence Index v4.3.2（max **52** 第 9、xhigh 51 第 13、high 50 第 15、medium 48 第 19、low 42 第 38）。
- **成本估算列**按 95 : 4 : 1 混合：Claude Mythos 5.1 **$1.1375**、Claude Sonnet 5.5 **$0.37**、GPT-6.1 Sol **$0.275**。
- 榜单联动：Intelligence Index v4.3.2 插入 Sonnet 5.5 与 GPT-6.1 Sol 五个档位后，为守住前 50 上限按降序移除原榜单底部的 6 个低分档位配置，仍保持 50 行且降序；AA-Briefcase 模型级镜像由 14 行增至 **15 行**（全量）。文本模型对比表与单项测评同步为 33 款，两处集合由回归测试锁定一致。

旧快照仅保留为变更记录，不再代表页面现值。

## 榜单选择

榜单区使用两级切换：先选择 Artificial Analysis 或 LMArena，再在横向分段栏中选择具体榜单。页面一次只展开一张前 50 榜单，切换平台时保留各自上次查看的位置，减少十张长榜同时铺开的信息噪声。

每张榜单左栏必须包含“评估方法”表和一句“评估逻辑”。页面标题使用名词型短语，避免问句、口号和重复解释：

- 官方披露权重时直接展示权重，例如 Intelligence Index v4.3.2 的 Agents 30%、Coding 20%、通用能力 30%、科学推理 20%。
- 官方只披露等权合成时显示等权或 `⅓`，例如 Coding Agent Index 和 Agentic Index。
- 官方未披露固定权重时只展示计分方式，不自行推算，例如 AA-Briefcase 的 rubric、分析质量 Elo 与呈现 Elo。
- Arena 榜单统一说明匿名两两比较与 Bradley–Terry 排名，同时按榜单区分输入、样本筛选和人类实际判断对象。

Artificial Analysis：

- Intelligence Index v4.3.2：十项推理、编程与 Agent 评测按 4 类不等权合成的综合能力信号。
- Coding Agent Index v1.5：DeepSWE 113 项、Terminal-Bench v4.0 66 项、SWE-Atlas-QnA 124 项等权合成，按三次运行的 pass@1 计分。
- Agentic Index：官方配置级入口下线后降级为 benchlm.ai 按模型聚合的镜像口径，观察工具使用、规划和自主执行。
- AA-Briefcase：以私有真实知识工作任务衡量正确性、分析质量和交付物呈现质量；官网结构化数据不提供模型级序列，当前按 benchlm.ai 模型级镜像口径录入。

LMArena：

- Text / Overall：看真实用户对文本回答的整体盲测偏好。
- Coding Arena：聚焦代码回答质量。
- WebDev Arena：比较模型生成可运行前端应用的交互体验。
- Vision Arena：比较多模态模型对图片输入的理解与回答质量。
- Text-to-Image：比较纯文本生成图片的用户偏好。
- Text-to-Video：比较文本生成视频的用户偏好。

LMArena 使用匿名两两对比和 Elo 风格统计，需同时阅读置信区间、投票量、preliminary 状态和别名合并。Artificial Analysis 使用固定评测方法，同一模型不同 reasoning effort 可以分别占位。

## 鹈鹕测试模块

“鹈鹕测试”是栏目内唯一交互章节，位于第三方测评（`#leaderboards`）之后、数据来源（`#trend-sources`）之前，与第三方测评同级。它复刻社区非正式基准：用固定 Prompt 让模型生成一张 SVG，再由裁判模型评分，用于快速直观地比较不同模型的图像 / 代码生成质量。快照数据保持纯静态；本模块只在用户显式点击“开始测试”并勾选费用确认后才发起真实调用。

来源：Simon Willison 的定性基准 “Generate an SVG of a pelican riding a bicycle”，见 [The last six months in LLMs, illustrated by pelicans on bicycles](https://simonwillison.net/2025/Jun/6/six-months-in-llms/) 与 [simonw/pelican-bicycle](https://github.com/simonw/pelican-bicycle)。Prompt 逐字固定，不做改写。

### 执行流程

1. 生成：POST `/api/pelican/responses`（鹈鹕专用 create-only 代理）以固定 Prompt 调用用户手填的生成模型，`max_output_tokens:32768`、`store:false`、`stream:false`；从输出文本提取并 `normalizeSvg` 归一化出 `<svg>…</svg>`。推理模型的思维链 token 同样计入 `max_output_tokens`，故预留 32768 余量；若输出仍在上限处截断（`incomplete/length`），面板会给出含 output_tokens / reasoning 占用诊断，而不是静默报“未找到 SVG”。
2. 栅格化（仅视觉模式）：在浏览器本地把 SVG 渲染为 PNG（零网络、零费用），记录 `renderMeta`；失败则中止裁判并提示改用源码裁判，不静默切换模式。
3. 裁判：POST `/api/pelican/responses` 调用用户手填的裁判模型，带 `text.format` 的 json_schema 结构化输出、`max_output_tokens:16384`（原为 2048；推理型裁判如 Kimi K3 的思维链会挤占该预算并在吐出完整评分 JSON 前被截断，故上调留出余量）、`store:false`、`stream:false`；视觉模式送 `input_image`（PNG data URL）+ 评分文本，源码模式只送内嵌 SVG 源码的评分文本。裁判响应若为 `incomplete/length` 截断，面板复用与生成同源的诊断（`describeTruncatedJudgement`）显式提示“被截断”，而非笼统报“无法解析为评分 JSON”。
4. 归档：组装 `PelicanRun` 写入本地历史；用户可显式点击“保存到 TOS”把 JSON bundle 归档，并把 `tosObjectKey` 回写历史。

生成与裁判都走鹈鹕专用的 `/api/pelican/responses` 同源 create-only 代理与普通方舟 Key；Base URL 由面板手动填写，预填默认标准 `https://ark.cn-beijing.volces.com/api/v3`，服务端只放行 HTTP/HTTPS、不含内嵌凭证与查询串的地址并脱敏响应中的 Key；共享 `/api/responses` 代理保持固定上游，不接受 baseUrl。

### 五维评分口径

每维 0–10 分，总分取五维均值（`overall` 由裁判给出，前端解析后按均值复核）：

- `species` 物种特征：长喙、喉囊、体型等鹈鹕辨识度。
- `bicycle` 车架结构：双轮、车架、车把、车座、踏板齐备且连接合理。
- `posture` 骑乘姿态：鹈鹕是否合理地坐在车上。
- `interaction` 肢体交互：翅膀 / 腿与车把、踏板的接触关系。
- `svgValidity` SVG 有效性：视觉模式按实际渲染画面是否完整无破损评估；源码模式按代码结构是否良好、可渲染评估。

两种裁判模式共用同一 json_schema（`pelican_judgement`，`strict:true`），保证字段一致；但 `svgValidity` 口径不同，历史记录标注模式，且不做跨模式排名。

### 双裁判模式与可比性

- 视觉裁判（默认）：把 SVG 在浏览器本地栅格化为 PNG，以 `input_image` data URL 送具备图像理解能力的多模态裁判模型，评的是“裁判实际看到的画面”。
- 源码裁判：把 SVG 源码作为文本送任意文本裁判模型，评的是“代码本身”，是无视觉能力模型或本地渲染失败时的备选。
- 面板并排展示“裁判所见 PNG”，保证视觉模式评分透明可复核；同一模型跨模式记录并列展示并标注模式，提醒分数口径差异。

### 本地栅格化边界

SVG→PNG 仅在浏览器本地完成：Blob(`image/svg+xml`) → `URL.createObjectURL` → `HTMLImageElement`（secure static mode，脚本与外部资源不执行 / 不加载）→ canvas `drawImage` → `toDataURL("image/png")`，完成后 `revokeObjectURL`。内在尺寸由 `width/height` 或 `viewBox` 推导，按 `maxEdge`（默认 1024）等比封顶。受 `responses-server` 单字符串 ≤1MB 限制，data URL >900KB 时以 512 重渲一次，仍超限则返回错误并提示改用源码裁判；加载超时 10 秒。PNG 字节不上传、不落盘、不进 TOS bundle（仅记录 `renderMeta`），可由 SVG 随时重渲染。交互预览由沙箱 iframe（`sandbox` + `srcDoc`）承担，杜绝脚本执行。

### 历史与 TOS 归档

- 历史仅存当前浏览器 localStorage（键 `llm-trends:pelican-history:v1`，上限 30 条），不保存 API Key；`runId` 格式 `pel-{yyyyMMddHHmmss}-{8位hex}`。
- TOS 为显式归档，只存 JSON bundle 到固定 `demo/pelican/{runId}.json`（≤2MB），复用 `materials-server` 的固定 bucket / Region 与服务端 AK/SK；不写 D1、不进素材库索引（素材库只列举 `demo/{video|image|audio}/`，天然隔离）。保存经 POST `/api/pelican/tos`（201），读取经 GET 预签名（3600 秒，不持久化）或服务端内容代理。

### 费用与安全边界

- 每次测试含 2 次真实 Responses API 创建（生成 + 裁判），按所选模型 token 计价，视觉裁判另含图像 token；TOS 保存另产生存储与流量费用。面板固定提示并要求勾选费用确认，未勾选或字段不全时“开始测试”禁用。
- 挂载时只读 localStorage，绝不发网络请求；页面加载、历史读取与自动化测试零真实调用。
- API Key 复用共享演示凭证槽位（`seedance-workbench:demo-credentials:v1` 的 `official` 字段），仅随同源 POST 临时到达服务端并立即转发，不落服务端、不回显；服务端保存前递归拒绝任何 `apiKey/authorization/token/secret/password` 等敏感键。
- 生成成功但裁判失败时保留 SVG / PNG 于查看器并标记“评分失败”，提供“仅重跑裁判”（沿用当前模式，仍需费用确认）。

## 观察项

以下为 2026-09-30 快照时无法闭环核验、后续更新需跟踪的缺口，页面暂不因此扩列或补位：

- **AutomationBench-AA**：Intelligence Index v4.3 新增计分项（权重 5%），独立榜页当前返回 404，暂无可核验的独立链接，页面仅保留 II 方法学中的整体描述。
- **GDP.pdf**：Intelligence Index v4.3 新增计分项（权重 10%），AA 未发布独立可读榜单，无法单独复核各模型分值。
- **Frontier-Bench v0.1**：新出现的 Agent 基准，尚无官方榜与一致口径，暂不录入。
- **Terminal-Bench-Science 0.1**：Terminal-Bench 系新分支，任务集与计分方式未定稿，暂不录入。
- **SWE-bench Pro 审计传闻**：社区存在对部分高分配置的审计讨论，官方尚未回应；结果落地前维持现有“厂商披露 / 框架未披露”双口径不变。

## 更新流程

1. 复核厂商正式发布页、国内 API 价格页和官方模型卡。
2. 复核三条赛道的最新一代与同代档位，不把上一代低价型号混入“最新一代”。
3. 复核十三项 benchmark 的名称、版本、分数、推理配置、Agent harness 及 Claude Opus 4.6 标准对照。
4. 复核十张榜单的前 50（不足则全量）、快照日期、排序方向和筛选条件。
5. 同步更新 `app/components/LlmTrendsWorkbench.tsx`、本文件及对应测试。
6. 运行 `npm test`、`npm run lint` 和项目级完整验证命令。

页面不自动抓取榜单；每次更新都应作为人工核验的研究快照。
