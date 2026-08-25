# Responses API 演示工作台

## 产品定位

Responses API 是与 Seedance、模板资产、Seedream 和 Managed Agents 平级的顶级栏目。它把“场景讲解、结构化填写、完整 JSON、真实请求、响应、SSE、历史和脱敏日志”放在同一页面，适合现场演示从入参设计到输出对象的完整链路。

工作台覆盖八类场景：

1. 文本生成：字符串 / InputItem 输入、instructions、采样、同步与流式输出。
2. 多轮上下文：`previous_response_id`、分支对话、`store` 与 `expire_at`。
3. 深度思考：`thinking`、`reasoning.effort` 与加密思考原文。
4. 多模态理解：图片、视频、PDF / 文件和音频输入。
5. Function Calling：函数定义、`function_call` 与 `function_call_output`。
6. 内置工具与 MCP：联网搜索、图像处理、知识库、Remote MCP 与豆包助手。
7. 上下文缓存：前缀缓存、会话缓存及其互斥约束。
8. 结构化输出：`json_object` 与严格 `json_schema`。

## 协议覆盖

页面的“完整参数结构”按官方 Create Response 与 Response Object 分类呈现：

- 请求顶层字段：`input`、`model`、`caching`、`context_management`、`expire_at`、`include`、`instructions`、`max_output_tokens`、`max_tool_calls`、`previous_response_id`、`reasoning`、`service_tier`、`store`、`stream`、`temperature`、`text`、`thinking`、`tool_choice`、`tools`、`top_p`。
- InputItem：message、function call / output、reasoning、MCP approval / tools / call、item reference。
- ContentItem：文本、图片、视频、文件、音频，以及输出文本与思考文本。
- Tool：function、web search、image process、MCP、knowledge search、doubao app。
- 输出顶层字段：创建信息、状态、缓存、上下文管理、错误 / incomplete 详情、所有请求配置回显、output 与 usage。
- OutputItem：message、function call、reasoning、transcription、联网 / 图像 / 知识库 / MCP / 豆包助手 / Agent 工具调用。
- 流式结果：保留原始 SSE 事件时间线，并同时提取文本 delta 形成可读结果。

简单高频参数由表单编辑；复杂联合结构与新增协议字段可在完整 JSON 编辑器中修改。JSON 解析成功后会立即反映到右侧 Method、URL、Headers 和 Request Body，不维护第二份请求状态。“复制 cURL”会为当前创建、查询、Input Items 或删除操作拼接完整命令；已填写 Key 时剪贴板内容包含该 Key，未填写时保留 `<ARK_API_KEY>` 占位符。

## 调用链与安全边界

```text
ResponsesWorkbench
  → POST /api/responses
  → app/lib/responses-server.ts
  → https://ark.cn-beijing.volces.com/api/v3/responses
```

- 浏览器不直连火山方舟；服务端目标地址固定，不能由用户改成任意代理。
- Key 只随同源 POST 临时转发；不得进入 URL、Cookie、SSR、源码、服务端持久化或日志。
- cURL 只在用户显式点击时于浏览器内生成并写入剪贴板，不进入历史或日志；复制内容需按敏感凭证管理。
- 创建、查询 Response、查询 Input Items 和删除均通过同一个同源入口；上游 GET / DELETE 的 Key 也不会进入 URL。
- 未知顶层字段、非法 URL、危险协议、缓存冲突和缺失的工具必填参数在上游调用前拒绝。
- 真实创建需要 API Key 与费用确认；删除需要单独的不可逆确认。
- 历史最多 30 条，仅保存在当前浏览器；Authorization、Token、Secret、Password 与 MCP headers 脱敏。
- 页面加载、切换示例、构建和自动化测试不会调用真实模型或工具。

## 缓存与生命周期限制

- Response 默认 `store=true`，默认保存 3 天；`expire_at` 最长设置为 7 天。
- 一个已存储上下文链最多 1000 个 item。
- 前缀缓存至少需要 256 tokens，且要求 `store=true`、`stream=false`。
- 缓存不与非 Function 内置工具混用；`instructions` 不进入缓存；多轮场景要保持思考配置一致。
- Files API 素材上限与有效期由独立接口管理：单文件最大 512 MB，默认 7 天，可配置 1–30 天。本工作台只接受 URL、`file_id` 或 Base64 引用，不自动上传文件。

## 验证

自动化测试使用模拟上游，覆盖：

- 顶级栏目、八类示例和完整协议目录的服务端渲染。
- 表单请求只走 `/api/responses`，凭证掩码、费用确认、删除确认、本机历史与日志。
- 创建、流式 SSE、查询 Response、查询 Input Items 和删除的同源代理。
- 未知字段、非 HTTPS 素材、任意主机代理、缓存与内置工具冲突等拒绝路径。

真实端到端验证会产生模型或工具费用，只有在用户确认账号、额度、凭证和请求摘要后才执行，并将结果写入 `docs/validation-log.md`。

## 官方依据

- [Responses API 迁移与能力总览](https://docs.volcengine.com/docs/82379/1585128?lang=zh)
- [文本生成](https://docs.volcengine.com/docs/82379/1958520?lang=zh)
- [深度思考](https://docs.volcengine.com/docs/82379/1956279?lang=zh)
- [多模态理解](https://docs.volcengine.com/docs/82379/1958521?lang=zh)
- [工具调用](https://docs.volcengine.com/docs/82379/1958524?lang=zh)
- [上下文缓存](https://docs.volcengine.com/docs/82379/1602228?lang=zh)
- [Create Response API](https://docs.volcengine.com/docs/82379/1569618?lang=zh)

模型能力、字段和计费规则会变化；修改实现前应重新核对官方文档。
