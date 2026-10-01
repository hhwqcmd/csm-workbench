# Messages API 工作台

## 定位

`Messages API` 是顶级栏目 05，位于 Responses API 之后、Managed Agents 之前。它只演示火山方舟提供的 Anthropic Messages 兼容入口，不是 Anthropic 原厂控制台，也不接 Agent Plan：

```text
POST https://ark.cn-beijing.volces.com/api/compatible/v1/messages
Authorization: Bearer <普通方舟 API Key>
Content-Type: application/json
anthropic-version: 2023-06-01
```

浏览器只调用同源 `POST /api/anthropic-messages`。服务端固定上游 URL 和版本头，浏览器不能传入任意 Base URL、原厂 `x-api-key` 或自定义 `anthropic-version`。

本栏目采用“方舟可执行核心子集 + Anthropic 原生只读参考”的口径。协议字段可提交不代表每个方舟模型都支持图片、PDF、Prompt Caching、Thinking 或 Tool Use；真实执行前仍需确认当前模型能力。

## 八类场景

1. **基础文本与 System**：顶层 `system`、user 消息、同步或流式返回。
2. **无状态多轮**：调用方把历史 user / assistant 消息与新问题一并提交。
3. **Assistant Prefill**：最后一条 assistant 消息作为续写前缀；模型支持度需另行确认。
4. **深度思考与 Signature**：`thinking`、`budget_tokens`、thinking / redacted_thinking 内容块和 signature 原样回传。
5. **多模态图片 / 文档**：text、image、document 内容块，素材只允许公网 HTTPS URL 或受控 Base64。
6. **Tool Use**：客户端 `tools` / `tool_choice`，模型只产生 `tool_use` 参数，不执行真实函数。
7. **tool_result 回传**：assistant 的 `tool_use.id` 与下一条 user 消息的 `tool_result.tool_use_id` 闭环。
8. **Prompt Caching**：在稳定 system、内容块或工具定义上使用 ephemeral `cache_control`，观察上游返回的缓存用量。

`stream` 是八类场景共用的通用开关，不单独占用场景。

## 可执行请求结构

同源请求包固定为：

```json
{
  "apiKey": "<只在本次请求内存中使用>",
  "trace": false,
  "requestBody": {
    "model": "doubao-seed-2-1-pro-260628",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "你好"
      }
    ],
    "stream": false
  }
}
```

服务端允许的 Request Body 顶层字段为：

- 必填：`model`、`max_tokens`、`messages`。
- 上下文：`system`。
- 返回方式：`stream`。
- 思考：`thinking`。
- 客户端工具：`tools`、`tool_choice`。
- 缓存与追踪：`cache_control`、`metadata`。
- 停止与采样：`stop_sequences`、`temperature`、`top_k`、`top_p`。

`output_config`、container/skills、Anthropic Server Tools、`inference_geo` 等原生扩展只出现在页面只读目录，并统一标记“方舟兼容性待验证”。它们不在代理白名单中，提交会被拒绝。

## 无状态多轮与内容块

Messages API 不提供 Responses API 的资源生命周期操作。工作台不实现 retrieve、Input Items、delete 或 `previous_response_id`：

```text
第 1 轮 request.messages
  → 第 1 轮 assistant Message
  → 调用方保存需要保留的 assistant 内容块
  → 第 2 轮 request.messages = 第 1 轮输入 + 第 1 轮输出 + 新 user 输入
```

消息只允许 `user` 与 `assistant`。系统提示必须使用顶层 `system`。可执行核心内容块包括：

- `text`
- user 输入的 `image`、`document`
- assistant 历史的 `thinking`、`redacted_thinking`
- assistant 的 `tool_use`
- user 的 `tool_result`

当上一轮包含 extended thinking 时，下一轮必须按上游原始顺序回传完整 assistant 内容，尤其不能编辑 `thinking` 或 `signature`。工作台结果区会显示 signature 掩码，但一键生成 tool_result 模板时使用内存中的完整响应块。

## Tool Use 闭环

工具定义只接受客户端函数结构：

```json
{
  "name": "get_weather",
  "description": "根据城市查询天气",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": { "type": "string" }
    },
    "required": ["location"]
  }
}
```

模型返回 `tool_use` 后，工作台可以生成下一轮 `tool_result` 请求模板。模板中的天气数据明确标记为演示占位，工作台不会访问天气服务、执行本地函数或自动再次调用模型。业务接入时必须先验证模型生成的 `input`，再由可信工具执行，并把结果放入 user 消息。

服务端按消息顺序记录 `tool_use.id`，拒绝重复 ID、未知引用、放在错误 role 的工具块和未定义的 `tool_choice.name`。

## SSE 时间线与最终 Message

流式模式保留每个已脱敏原始事件，并在浏览器内重建最终 Message：

- `message_start`：初始化 Message 与输入用量。
- `content_block_start`：按 `index` 创建 text、thinking 或 tool_use 内容块。
- `content_block_delta`：聚合 `text_delta`、`thinking_delta`、`signature_delta` 与跨事件 `input_json_delta`。
- `content_block_stop`：完成内容块，并解析累积的工具参数 JSON。
- `message_delta`：合并 `stop_reason`、`stop_sequence` 和输出/缓存用量。
- `message_stop`：结束事件时间线。

服务端按完整 SSE frame 处理 JSON 字段脱敏，同时跨网络 chunk 识别并替换本次 API Key。浏览器收到的原始时间线和聚合 Message 均不应包含明文凭证。

## 服务端校验

`app/lib/anthropic-messages-server.ts` 在请求到达上游前执行：

- 请求包和 Request Body 精确字段白名单，拒绝任意代理地址和原生未验证扩展。
- user / assistant role、system 位置、内容块类型与字段检查。
- 图片和文档只允许无内嵌凭证的 HTTPS URL，或白名单 MIME 的合法 Base64。
- `tool_use` ID 唯一、`tool_result` 只引用前序 ID、工具名和 JSON Schema 基本结构检查。
- `thinking.type=enabled` 时 `budget_tokens >= 1024` 且小于 `max_tokens`；历史 thinking 必须包含 signature。
- ephemeral cache_control 与 `5m` / `1h` TTL 校验。
- 采样值、停止序列、metadata、JSON 最大深度/节点/字符串长度与危险对象键检查。
- 同步 JSON、上游错误和 SSE 的 Key/Token/Secret/Password 脱敏。

## 本机存储与费用边界

- API Key 复用标准方舟模块的浏览器凭证槽；关闭“记住”后从该槽删除。
- Messages 历史使用独立 `anthropic-messages-workbench:history:v1`，最多 30 条。
- 历史 Request Header 只保存掩码；响应和请求中的敏感字段递归脱敏。
- Base64 的 `data` 或长 data URL 写入历史前替换为字符数摘要，避免 localStorage 膨胀。
- 页面加载、场景切换、表单编辑、cURL 复制、构建和自动化测试都不会调用真实模型。
- 只有填写 Key、补齐输入、勾选费用确认并点击“创建 Message”才会发起真实调用。
- 本次实现未执行真实付费调用，也未部署 Sites。

## 深链

- `#anthropic-messages`：栏目顶部。
- `#anthropic-editor`：编辑与执行区。
- `#anthropic-schema`：可执行协议与只读参考目录。
- `#anthropic-{scenario-id}`：选择场景后进入编辑区。

## 参考资料

- [火山方舟 Anthropic Messages API 接入说明](https://docs.volcengine.com/docs/82379/2160841?lang=zh)
- [Anthropic Messages API create](https://platform.claude.com/docs/en/api/messages/create)
- [OpenAI Responses create 参考](https://developers.openai.com/api/reference/typescript/resources/beta/subresources/responses/methods/create)

最后核对：2026-08-25。模型能力、兼容字段、计费与限额可能变化，真实验收前应重新核对官方文档，并把实际 URL、模型、HTTP/SSE 结果与 Request ID 写入 `validation-log.md`。
