export const ANTHROPIC_MESSAGES_URL =
  "https://ark.cn-beijing.volces.com/api/compatible/v1/messages";
export const ANTHROPIC_VERSION = "2023-06-01";
export const ANTHROPIC_DEFAULT_MODEL = "doubao-seed-2-1-pro-260628";

export type AnthropicCacheControl = {
  type: "ephemeral";
  ttl?: "5m" | "1h";
};

export type AnthropicContentBlock = Record<string, unknown> & {
  type: string;
};

export type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
};

export type AnthropicMessagesRequestBody = {
  model?: string;
  max_tokens?: number;
  messages?: AnthropicMessage[];
  system?: string | AnthropicContentBlock[];
  stream?: boolean;
  thinking?:
    | { type: "enabled"; budget_tokens: number }
    | { type: "adaptive" }
    | { type: "disabled" };
  tools?: Array<Record<string, unknown>>;
  tool_choice?: Record<string, unknown>;
  cache_control?: AnthropicCacheControl;
  metadata?: { user_id?: string };
  stop_sequences?: string[];
  temperature?: number;
  top_k?: number;
  top_p?: number;
};

export type AnthropicMessagesScenario = {
  id: string;
  index: string;
  title: string;
  badge: string;
  summary: string;
  guide: string[];
  capabilityTags: string[];
  expectedOutput: string[];
  requestBody: AnthropicMessagesRequestBody;
};

export const ANTHROPIC_MESSAGES_SCENARIOS: AnthropicMessagesScenario[] = [
  {
    id: "text-system",
    index: "01",
    title: "基础文本与 System",
    badge: "基础",
    summary:
      "用顶层 system 约束角色，以 user / assistant 消息块完成一次无状态生成。",
    guide: [
      "system 是顶层字段，messages 中不能出现 system role。",
      "每次请求都必须显式携带本轮需要的上下文。",
      "stream 可随时切换；同步与流式请求使用同一个固定入口。",
    ],
    capabilityTags: ["system", "messages", "stream"],
    expectedOutput: ["content.text", "stop_reason", "usage"],
    requestBody: {
      model: ANTHROPIC_DEFAULT_MODEL,
      max_tokens: 1024,
      system: "你是火山方舟 API 演示助手，回答准确、简洁。",
      messages: [
        {
          role: "user",
          content: "请用三点说明 Messages API 的无状态调用方式。",
        },
      ],
      stream: false,
      temperature: 0.7,
    },
  },
  {
    id: "multi-turn",
    index: "02",
    title: "无状态多轮",
    badge: "上下文",
    summary:
      "把历史 user / assistant 消息随新问题一并提交，客户端自行维护完整会话。",
    guide: [
      "Messages API 不提供响应查询或删除；历史由调用方保存和裁剪。",
      "assistant 历史必须使用原始内容块，尤其不要丢失工具或思考块。",
      "本工作台历史仅用于本机演示，不会自动成为下一次请求。",
    ],
    capabilityTags: ["stateless", "user", "assistant"],
    expectedOutput: ["message", "usage", "stop_reason"],
    requestBody: {
      model: ANTHROPIC_DEFAULT_MODEL,
      max_tokens: 1024,
      messages: [
        { role: "user", content: "API 演示平台最重要的安全边界是什么？" },
        {
          role: "assistant",
          content: "真实调用必须由用户显式触发，并与页面加载和测试隔离。",
        },
        { role: "user", content: "再补充一条与凭证相关的要求。" },
      ],
      stream: false,
    },
  },
  {
    id: "assistant-prefill",
    index: "03",
    title: "Assistant Prefill",
    badge: "续写",
    summary:
      "用末尾 assistant 消息预填输出前缀，约束模型从指定格式或语气继续生成。",
    guide: [
      "最后一条消息可以是 assistant 角色，内容会作为回答前缀。",
      "预填适合固定格式，不等同于服务端保存会话状态。",
      "深度思考模型是否支持 Prefill 取决于具体模型能力，请先小流量验证。",
    ],
    capabilityTags: ["assistant prefill", "format control"],
    expectedOutput: ["content.text", "end_turn"],
    requestBody: {
      model: ANTHROPIC_DEFAULT_MODEL,
      max_tokens: 512,
      messages: [
        { role: "user", content: "只返回 JSON：北京适合演示的三个地点。" },
        { role: "assistant", content: '{"locations": [' },
      ],
      stream: false,
      temperature: 0,
    },
  },
  {
    id: "thinking-signature",
    index: "04",
    title: "深度思考与 Signature",
    badge: "思考",
    summary:
      "开启 thinking budget，并展示跨轮回传 thinking / redacted_thinking 与 signature 的正确位置。",
    guide: [
      "enabled 模式的 budget_tokens 至少 1024，且必须小于 max_tokens。",
      "继续多轮时应原样回传上一轮 assistant 的 thinking 和 signature，不得编辑。",
      "示例签名是占位符；真实多轮必须替换为上游实际返回值。",
    ],
    capabilityTags: ["thinking", "budget_tokens", "signature"],
    expectedOutput: ["thinking", "signature", "text"],
    requestBody: {
      model: ANTHROPIC_DEFAULT_MODEL,
      max_tokens: 4096,
      thinking: { type: "enabled", budget_tokens: 2048 },
      messages: [
        {
          role: "user",
          content: "设计一个既能演示真实 API、又不会在测试中误扣费的方案。",
        },
      ],
      stream: true,
    },
  },
  {
    id: "multimodal",
    index: "05",
    title: "多模态图片 / 文档",
    badge: "视觉 / PDF",
    summary:
      "组合 text、image 与 document 内容块，素材仅允许公网 HTTPS URL 或受控 Base64。",
    guide: [
      "图片使用 image block，PDF 使用 document block；具体模型能力需单独确认。",
      "Base64 数据只保存在当前编辑态，写入本机历史前会被压缩为占位摘要。",
      "不要提交包含隐私、凭证或未授权商业内容的素材。",
    ],
    capabilityTags: ["image", "document", "URL / Base64"],
    expectedOutput: ["content.text", "usage"],
    requestBody: {
      model: ANTHROPIC_DEFAULT_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: "https://example.com/demo-image.png",
              },
            },
            {
              type: "text",
              text: "描述素材中的主要信息，并明确哪些结论仍需验证。",
            },
          ],
        },
      ],
      stream: false,
    },
  },
  {
    id: "tool-use",
    index: "06",
    title: "Tool Use",
    badge: "客户端工具",
    summary:
      "用 input_schema 声明客户端函数，让模型生成 tool_use；工作台只展示参数，不执行工具。",
    guide: [
      "tools 只接受客户端工具定义，不支持 Anthropic Server Tools。",
      "模型返回的 input 仍需由业务侧校验后再执行。",
      "可从响应一键生成下一轮 tool_result 模板，结果内容需要人工替换。",
    ],
    capabilityTags: ["tools", "tool_choice", "tool_use"],
    expectedOutput: ["tool_use.id", "tool_use.input", "stop_reason"],
    requestBody: {
      model: ANTHROPIC_DEFAULT_MODEL,
      max_tokens: 1024,
      messages: [
        { role: "user", content: "查询北京今天的天气，并给出出行建议。" },
      ],
      tools: [
        {
          name: "get_weather",
          description: "根据城市名称查询当日天气。",
          input_schema: {
            type: "object",
            properties: {
              location: { type: "string", description: "城市名称" },
            },
            required: ["location"],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: { type: "auto" },
      stream: false,
    },
  },
  {
    id: "tool-result",
    index: "07",
    title: "tool_result 回传",
    badge: "工具闭环",
    summary:
      "保留 assistant 的 tool_use，再由 user 以同一个 tool_use_id 回传工具结果。",
    guide: [
      "tool_result 必须放在 user 消息中，并引用前序唯一的 tool_use ID。",
      "本示例结果是演示数据，不代表工作台执行了真实天气查询。",
      "工具出错时可设置 is_error=true，并在 content 中提供安全错误摘要。",
    ],
    capabilityTags: ["tool_use", "tool_result", "is_error"],
    expectedOutput: ["content.text", "usage"],
    requestBody: {
      model: ANTHROPIC_DEFAULT_MODEL,
      max_tokens: 1024,
      messages: [
        { role: "user", content: "北京今天适合步行吗？" },
        {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "toolu_demo_weather_01",
              name: "get_weather",
              input: { location: "北京" },
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "toolu_demo_weather_01",
              content: '{"temperature":"18°C","condition":"晴"}',
            },
          ],
        },
      ],
      tools: [
        {
          name: "get_weather",
          description: "根据城市名称查询当日天气。",
          input_schema: {
            type: "object",
            properties: { location: { type: "string" } },
            required: ["location"],
          },
        },
      ],
      stream: false,
    },
  },
  {
    id: "prompt-cache",
    index: "08",
    title: "Prompt Caching",
    badge: "缓存",
    summary:
      "在稳定的 system 或内容块上标记 ephemeral cache_control，并观察缓存 Token 用量。",
    guide: [
      "缓存标记必须附着在可缓存内容块或工具定义上；本页也保留顶层兼容字段。",
      "ttl 仅允许 5m 或 1h，具体命中和计费以模型及方舟返回 usage 为准。",
      "缓存能力存在模型差异，不能把协议字段可提交等同于一定命中。",
    ],
    capabilityTags: ["cache_control", "ephemeral", "usage"],
    expectedOutput: ["cache_creation_input_tokens", "cache_read_input_tokens"],
    requestBody: {
      model: ANTHROPIC_DEFAULT_MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: "你是企业 API 规范审阅助手。以下规则在本轮中保持不变。",
          cache_control: { type: "ephemeral", ttl: "5m" },
        },
      ],
      messages: [
        { role: "user", content: "检查方案中对凭证、日志和付费调用的边界。" },
      ],
      stream: false,
    },
  },
];

export const ANTHROPIC_REQUEST_REFERENCE = [
  ["model", "方舟模型或 Endpoint ID；默认值可编辑。"],
  ["max_tokens", "必填；生成 Token 上限，thinking budget 必须小于该值。"],
  ["messages", "必填；仅 user / assistant，历史由客户端完整回传。"],
  ["system", "顶层系统提示词；不能写成 messages 中的 system role。"],
  ["stream", "通用开关；true 时返回 Anthropic SSE 事件。"],
  ["thinking", "disabled / enabled + budget_tokens / adaptive。"],
  ["tools / tool_choice", "仅客户端工具；模型不会替业务执行函数。"],
  ["cache_control", "ephemeral 缓存标记，ttl 为 5m 或 1h。"],
  ["metadata", "可选 user_id；请勿传入姓名、邮箱等直接身份信息。"],
  ["sampling", "temperature、top_p、top_k 与 stop_sequences。"],
] as const;

export const ANTHROPIC_RESPONSE_REFERENCE = [
  ["message", "id、type=message、role=assistant、model。"],
  ["content", "text、thinking、redacted_thinking 或 tool_use 内容块。"],
  ["stop_reason", "end_turn、max_tokens、stop_sequence、tool_use 等。"],
  ["usage", "输入/输出 Token，以及上游提供的缓存用量字段。"],
] as const;

export const ANTHROPIC_SSE_REFERENCE = [
  "message_start",
  "content_block_start",
  "content_block_delta: text_delta",
  "content_block_delta: thinking_delta",
  "content_block_delta: signature_delta",
  "content_block_delta: input_json_delta",
  "content_block_stop",
  "message_delta",
  "message_stop",
] as const;

export const ANTHROPIC_NATIVE_REFERENCE = [
  ["output_config", "结构化输出等原生能力"],
  ["container / skills", "容器与 Skills 执行环境"],
  ["Anthropic Server Tools", "Web Search、Web Fetch、Code Execution 等"],
  ["inference_geo", "推理区域控制"],
] as const;
