# 文档入口

本目录记录项目后续演进需要长期保留的背景、协议、决策和验证证据。

- [架构说明](./architecture.md)：官方示例与演示工作台的边界、调用链和安全设计。
- [架构决策](./decisions.md)：仍影响当前实现的取舍、原因和重新评估条件。
- [真实验证记录](./validation-log.md)：产生真实 API 调用的验收结论与长期发现。
- [Python 环境](./environment.md)：安装结果、版本、验证命令与重建方式。
- [真实任务工作流](./task-runner.md)：请求表单、服务端路由、30 秒轮询、安全与费用边界。
- [Seedream 图片生成演示](./seedream.md)：十类官方图片玩法、Prompt 技巧、一键优化、流式输出、历史与安全边界。
- [Responses API 演示](./responses-api.md)：八类场景、完整输入/输出协议、SSE、生命周期、缓存、工具、安全与日志边界。
- [Managed Agents 工作流](./managed-agents.md)：Agent、云环境、Session 生命周期、SSE、文件挂载、Memory Store 与日志边界。
- [LLM 趋势栏目](./llm-trends.md)：Seed 主力模型、最新竞品、价格/参数/重点 benchmark、Arena 与 Artificial Analysis 快照及更新口径。
- [AI coding 最佳实践](./ai-coding.md)：规格、知识、计划、受控执行、验收与经验回流的六步演示，18 个可复制模板，以及面向全链路结果的模拟指标和同源 API 口径。
- [官方示例任务映射](./official-examples.md)：八个示例的素材结构、参数、模型选择依据与能力限制。
- [模板资产库](./template-library.md)：四类模板、10 个可预填场景案例、素材待补规则与维护边界。
- [原共学路线（归档）](./tutorial-roadmap.md)：保留早期教程实践过程，不代表当前产品进度。
- [火山方舟官方教程](https://docs.volcengine.com/docs/82379/2291680?lang=zh)：模型能力、输入限制、代码示例与最新规则的权威来源。
- [Managed Agents 快速入门](https://docs.volcengine.com/docs/82379/2553714?lang=zh)：三步工作台的 Agent、环境与 Session 协议入口。
- [Managed Agents Agent](https://docs.volcengine.com/docs/82379/2553716?lang=zh)：Agent 全字段、创建、版本化更新与覆盖语义。
- [Managed Agents 环境配置](https://docs.volcengine.com/docs/82379/2553721?lang=zh)：网络策略、依赖包、环境变量与 Session 沙箱语义。
- [启动 Session](https://docs.volcengine.com/docs/82379/2553723?lang=zh)、[管理 Session](https://docs.volcengine.com/docs/82379/2553724?lang=zh)、[Session 事件流](https://docs.volcengine.com/docs/82379/2553725?lang=zh)：创建、生命周期、检索/列表/删除与事件协议。
- [上传与挂载文件](https://docs.volcengine.com/docs/82379/2553727?lang=zh)、[持久化记忆](https://docs.volcengine.com/docs/82379/2553728?lang=zh)：Files API、Session Resources、TOS 挂载、Memory Store 与 Memory 内容管理。
- [Managed Agents Skills](https://docs.volcengine.com/docs/82379/2553717?lang=zh)、[Tools](https://docs.volcengine.com/docs/82379/2553719?lang=zh)、[MCP](https://docs.volcengine.com/docs/82379/2553718?lang=zh)、[Multi Agent](https://docs.volcengine.com/docs/82379/2553730?lang=zh)：能力扩展字段与约束。
- [Seedance 2.0 提示词指南](https://docs.volcengine.com/docs/82379/2222480?lang=zh)：提示词公式、编写技巧与模板案例来源。
- [Seedream 图片生成教程](https://docs.volcengine.com/docs/82379/1824121?lang=zh)、[Seedream 4.0–5.0 提示词指南](https://docs.volcengine.com/docs/82379/1829186?lang=zh)：图片示例类型、能力约束、请求字段和场景化 Prompt 技巧。
- [Responses API 总览](https://docs.volcengine.com/docs/82379/1585128?lang=zh)、[文本](https://docs.volcengine.com/docs/82379/1958520?lang=zh)、[推理](https://docs.volcengine.com/docs/82379/1956279?lang=zh)、[多模态](https://docs.volcengine.com/docs/82379/1958521?lang=zh)、[工具](https://docs.volcengine.com/docs/82379/1958524?lang=zh)、[缓存](https://docs.volcengine.com/docs/82379/1602228?lang=zh)：Responses 工作台的协议和能力依据。

当前规则放在仓库根目录的 `AGENTS.md`；本目录承载原因、协议和证据，避免 AGENTS.md 退化为逐文件百科或时间流水账。
