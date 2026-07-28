# 文档入口

本目录记录项目后续演进需要长期保留的背景、协议、决策和验证证据。

- [架构说明](./architecture.md)：官方示例与演示工作台的边界、调用链和安全设计。
- [架构决策](./decisions.md)：仍影响当前实现的取舍、原因和重新评估条件。
- [真实验证记录](./validation-log.md)：产生真实 API 调用的验收结论与长期发现。
- [Python 环境](./environment.md)：安装结果、版本、验证命令与重建方式。
- [真实任务工作流](./task-runner.md)：请求表单、服务端路由、30 秒轮询、安全与费用边界。
- [Managed Agents 工作流](./managed-agents.md)：创建 Agent、环境、会话、消息与 SSE 的协议、编辑联动和日志边界。
- [官方示例任务映射](./official-examples.md)：八个示例的素材结构、参数、模型选择依据与能力限制。
- [模板资产库](./template-library.md)：四类模板、10 个可预填场景案例、素材待补规则与维护边界。
- [原共学路线（归档）](./tutorial-roadmap.md)：保留早期教程实践过程，不代表当前产品进度。
- [火山方舟官方教程](https://docs.volcengine.com/docs/82379/2291680?lang=zh)：模型能力、输入限制、代码示例与最新规则的权威来源。
- [Managed Agents 快速入门](https://docs.volcengine.com/docs/82379/2553714?lang=zh)：四步 API、默认模型、工具集、环境与 SSE 事件流的权威来源。
- [Seedance 2.0 提示词指南](https://docs.volcengine.com/docs/82379/2222480?lang=zh)：提示词公式、编写技巧与模板案例来源。

当前规则放在仓库根目录的 `AGENTS.md`；本目录承载原因、协议和证据，避免 AGENTS.md 退化为逐文件百科或时间流水账。
