# Managed Agents 演示工作流

## 产品定位

“Managed Agents”是与“演示工作台”和“模板资产库”平行的顶级栏目，用于完整演示火山方舟托管 Agent 的代码快速入门：

1. 创建 Agent；
2. 创建云端环境；
3. 开启会话；
4. 发送用户消息并通过 SSE 流式接收响应。

页面不是通用 HTTP 代理。浏览器只调用同源 `/api/managed-agents/*`，由
`app/lib/managed-agents-server.ts` 校验并转发到
`https://ark.cn-beijing.volces.com/api/v3`。

## 官方协议映射

| 步骤 | Method | 上游路径 | 成功后的联动 |
|---|---|---|---|
| 创建 Agent | POST | `/agents` | 响应 `id` 自动填入会话的 `agent` |
| 创建环境 | POST | `/environments` | 响应 `id` 自动填入会话的 `environment_id` |
| 开启会话 | POST | `/sessions` | 响应 `id` 自动进入消息与事件流 URL |
| 发送消息 | POST | `/sessions/{id}/events` | 提交一条 `user.message` |
| 接收响应 | GET | `/sessions/{id}/events/stream` | 持续读取 SSE，收到 `session.status_idle` 后结束 |

默认请求与 2026-07-06 更新的官方快速入门一致：

- 模型：`doubao-seed-2-1-pro-260628`
- 工具集：`agent_toolset_20260701`
- 环境：`cloud` + `unrestricted`
- 消息：生成前 20 个斐波那契数并写入 `fibonacci.txt`

环境名称在当前 project 内必须唯一。页面挂载时会给默认名称加入时间后缀；用户也可手工修改。

## 编辑与 API 联动

每一步都包含：

- 业务字段与填写说明；
- Method、URL、Authorization、Content-Type；
- 可编辑 Request Body；
- 表单到 JSON、JSON 到表单的双向联动；
- 显式执行按钮、步骤状态与响应资源 ID。

消息步骤会同时显示发送事件的 POST URL 与 SSE GET URL。浏览器通过一个同源 POST 进入服务端；服务端先提交消息，再连接上游事件流并把 SSE 原样转发给页面。

## 历史、日志与凭证

- Managed Agents 与 Seedance 标准官方 API 共用当前浏览器保存的 `official` Key。
- Key 不进入源码、SSR HTML、URL、Cookie、服务端持久化或日志。
- 日志中的 Authorization 只保留掩码。
- 最近 20 轮 Managed Agents 记录保存在当前浏览器，包含资源 ID、步骤状态、请求、响应和流式事件。
- 页面刷新后历史仍可查看；未完成且已经取得资源 ID 的一轮可恢复步骤上下文。
- 自动化测试只使用模拟上游，页面加载、构建和健康检查不会创建真实资源。

## 验证

真实验收见 [`validation-log.md`](./validation-log.md)。自动化回归覆盖：

- 三类资源创建路由的 URL、Method、Body 与 Authorization 转发；
- 非官方 Base URL 和未开放字段拒绝；
- 先 POST 消息、再 GET SSE 的顺序；
- SSE 内容转发且响应不包含完整 Key；
- 页面四步、完整 API 编辑器、历史与日志契约。

官方依据：[火山方舟托管 Agent 快速入门](https://docs.volcengine.com/docs/82379/2553714?lang=zh)。
