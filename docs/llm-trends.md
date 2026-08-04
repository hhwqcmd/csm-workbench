# LLM 趋势栏目

## 用途与阅读路径

“LLM 趋势”与演示工作台、模板资产库、Seedream、Responses API 和 Managed Agents 平行。栏目用于现场讲解与选型预研，纯静态展示，不调用模型或付费 API。

页面按以下顺序组织：

1. 模型比较：默认只展示文本模型、生视频模型、生图 / 图像编辑三张火山方舟主力卡；点击“友商比较”后，三类模型统一以表格展开火山方舟和指定厂商的价格、参数与关键规格。
2. 九项 benchmark：NL2Repo-Bench、SciCode、Terminal-Bench 2.1、SWE Pro、Agents’ Last Exam (ALE)、MCP-Atlas、DeepSWE、OSWorld、MMMU-Pro。
3. 三方榜单：Artificial Analysis 4 张、LMArena 6 张，每张只展示 Top 10。

## 快照与模型范围

快照日期为 **2026-08-04**；第三方榜单卡片继续保留各自独立的快照日期。

文本旗舰：

- 火山方舟：Doubao-Seed-2.1-Pro
- Anthropic：Claude Fable 5
- OpenAI：GPT-5.6 Sol
- 阿里云：Qwen3.8-Max
- 月之暗面：Kimi K3
- 智谱：GLM-5.2
- 深度求索：DeepSeek-V4-Flash-0731
- MiniMax：MiniMax M3

文本模型展开表先列火山方舟 Doubao-Seed-2.1-Pro / Turbo，再列用户指定的 Claude、GPT、Qwen、Kimi、GLM、DeepSeek、MiniMax。最新一代存在公开多档产品时同时展示，例如 Claude Fable 5 / Opus 5 / Sonnet 5、GPT-5.6 Sol / Terra / Luna、Qwen3.8-Max / Qwen3.7-Plus、DeepSeek V4 Pro / V4-Flash-0731；没有同代多档正式产品时不补入无公开调用入口的型号。

视频与图像赛道分别以 Seedance 2.5、Seedream 5.0 Pro 为火山方舟最新主力。视频比较表同时保留已有公开 API 价格的 Seedance 2.0 / Fast / Mini 三档；图像比较表同时列出 Seedream 5.0 Pro / Lite，其中 Pro 按输出像素阈值展示 ¥0.30 / ¥0.60 两档中国区按量价。最新发布型号与 LMArena 可投票型号可能不同，例如视频榜当前使用 Seedance 2.0 的可比席位，页面必须明确标注，不能把 2.0 排名冒充 2.5 排名。

## 价格口径

- 文本价格为每百万 tokens 的输入 / 输出价；视频主比较优先统一为纯生成的每输出秒价格，无法安全换算时保留厂商原始单位；图像保留元 / 张或每百万图像 tokens 等原始口径。
- Seed、Qwen、Kimi、GLM、DeepSeek、MiniMax 使用中国用户可访问的人民币公开价。
- Kimi 主表使用缓存未命中输入价；DeepSeek 同样使用缓存未命中价。
- MiniMax M3 官方称价格不变，主表展示中国开放平台 `≤512K` 基础档起价；超过该长度需回到价格页复核阶梯。
- Claude 与 GPT 保留厂商美元 API 价，不做汇率换算。
- 限时折扣、缓存命中、Batch 和套餐价不进入主比较数值。
- 厂商未披露参数量时明确显示“未披露”，不得以社区估算或推理成本反推。

2026-08-04 视频价格复核：Seedance 系列统一采用官方 16:9、720p、5 秒、输入不含视频的纯生成示例。Seedance 2.5 为 **¥1.51 / 输出秒**；Seedance 2.0 / Fast / Mini 分别为 **¥0.99 / ¥0.80 / ¥0.50 / 输出秒**。各行同时保留相同分辨率下的 token 原价：2.5 为 ¥70 / 百万 tokens，2.0 / Fast / Mini 分别为 ¥46 / ¥37 / ¥23 / 百万 tokens；输入含视频时分别为 ¥42 / ¥28 / ¥22 / ¥14 / 百万 tokens。MiniMax H3 官方价为 **768P ¥0.50 / 输出秒、2K ¥0.80 / 输出秒**。主表用 Seedance 720p 与 H3 768P 作近似同档比较，并注明分辨率并不完全相同；输入视频、图片等额外素材费用不进入主比较值。

## Benchmark 口径

每个模型行都有来源链接，按以下优先级填写：

1. 模型厂商正式发布页或官方模型卡。
2. benchmark 官方榜单或 Artificial Analysis。
3. 其他厂商模型卡中的明确交叉对比。
4. 无法找到同名、同版本值时仍显示该模型，数值标记为“—”，同时链接到本次核验的模型页或榜单；不得用相近 benchmark 替代。

单项测评固定展示 Claude Opus 4.6 作为标准对照，不参与最新模型排名。若 Opus 4.6 没有同名、同版本或同量纲公开值，仍保留对照行并显示“—”，不得用相近 benchmark 补位。

所有项目均保留版本、推理档位和 Agent harness 差异的阅读提示。DeepSWE 优先采用当前型号厂商正式发布页或官方模型卡中的同名结果，并保留其版本与 harness；厂商未发布时才回退到 Artificial Analysis v1.3 的公开分项。DeepSWE 是长程软件工程任务，结果对应具体模型、Agent harness 与推理档位，不应视为裸模型分数。

2026-07-31 补充核验使用 LLM Stats 的同名 benchmark 榜单补齐 Seed 的 OSWorld / MMMU-Pro、Qwen3.7-Max 的 NL2Repo / SciCode、GPT-5.6 Sol 的 SWE Pro，以及 MiniMax M3 的 NL2Repo；Kimi K3 的 SWE Pro 使用厂商技术博客，MiniMax 的 OSWorld-Verified 与 MMMU-Pro 使用厂商正式发布页和官方模型卡。DeepSWE 采用 OpenAI 官方 GPT-5.6 发布页、Kimi K3 官方模型卡和 GLM-5.2 官方模型卡；其余型号未找到厂商自有的同型号结果，保留 AA v1.3 数据或缺失状态。第三方榜单中的厂商数据标注为“厂商披露”，不视为独立复测。

2026-08-03 将 Qwen3.7-Max 替换为 Qwen3.8-Max。价格、参数和上下文采用千问 AI 平台模型页；单项测评采用 Qwen3.8 官方发布：Terminal-Bench 2.1 86.6（Claude Code，avg@10）、SWE-bench Pro 67.7（Claude Code）、DeepSWE 1.1 56.6（Claude Code，为 Claude Code 与 mini-SWE-agent 两套框架中的较高值）、NL2Repo-Bench 55.9（Claude Code）、ALE Pass 27.0（官网未披露 Agent 框架）、OSWorld-Verified 86.1（官网未披露 Agent 框架）、MMMU-Pro 82.3（内部评估，无 Agent 框架）。SciCode 与 MCP-Atlas 未发布同名结果，保留“—”。

2026-08-03 将单项测评中的 DeepSeek-V4 Pro 替换为 2026-07-31 正式发布的 DeepSeek-V4-Flash-0731。官方公开成绩为 NL2Repo 54.2、Terminal-Bench 2.1 82.7、Agents’ Last Exam 25.2、DeepSWE 54.4；其中公开 Code Agent 任务统一使用 DeepSeek Harness 极简模式、max 档位、top_p=0.95、temperature=1.0。ALE 的 Agent 框架未在发布说明中单独披露；SciCode、MCP-Atlas、SWE Pro、OSWorld、MMMU-Pro 未发布同名结果，保留“—”。

三方榜单保留 Top 10 规则：AA Intelligence / Agentic 分别记录 DeepSeek-V4-Flash-0731 的 50 / 46 作为榜外关注值，AA Coding Agent 与 AA-Briefcase 尚未收录同名 0731 配置；Arena 2026-08-01 快照中 `deepseek-v4-flash` 在 Text / Coding 分别为第 80（1436 ± 4）和第 81（1484 ± 6），`deepseek-v4-flash-high` 在 WebDev 为第 8（1577 +18/-18，Preliminary）。Arena 未显式标注 0731 版本，因此页面不把其模型别名直接写作 0731。

## 榜单选择

榜单区使用两级切换：先选择 Artificial Analysis 或 LMArena，再在横向分段栏中选择具体榜单。页面一次只展开一张 Top 10，切换平台时保留各自上次查看的位置，减少十张长榜同时铺开的信息噪声。

每张榜单左栏必须包含“评估方法”表和一句“评估逻辑”。页面标题使用名词型短语，避免问句、口号和重复解释：

- 官方披露权重时直接展示权重，例如 Intelligence Index v4.1 的 Agents 34%、Coding 24%、科学推理 24%、通用能力 18%。
- 官方只披露等权合成时显示等权或 `⅓`，例如 Coding Agent Index 和 Agentic Index。
- 官方未披露固定权重时只展示计分方式，不自行推算，例如 AA-Briefcase 的 rubric、分析质量 Elo 与呈现 Elo。
- Arena 榜单统一说明匿名两两比较与 Bradley–Terry 排名，同时按榜单区分输入、样本筛选和人类实际判断对象。

Artificial Analysis：

- Intelligence Index v4.1：九项推理、编程与 Agent 评测构成的综合能力信号。
- Coding Agent Index：DeepSWE、Terminal-Bench v2、SWE-Atlas-QnA 等权合成，按三次运行的 pass@1 计分。
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
4. 复核十张榜单的 Top 10、快照日期、排序方向和筛选条件。
5. 同步更新 `app/components/LlmTrendsWorkbench.tsx`、本文件及对应测试。
6. 运行 `npm test`、`npm run lint` 和项目级完整验证命令。

页面不自动抓取榜单；每次更新都应作为人工核验的研究快照。
