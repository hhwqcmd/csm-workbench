export const RESPONSES_BASE_URL =
  "https://ark.cn-beijing.volces.com/api/v3";
export const RESPONSES_DEFAULT_MODEL = "doubao-seed-2-1-pro-260628";

export type ResponsesRequestBody = {
  model?: string;
  input?: unknown;
  caching?: {
    type: "enabled" | "disabled";
    prefix?: boolean;
  };
  context_management?: Record<string, unknown>;
  expire_at?: number;
  include?: string[];
  instructions?: string;
  max_output_tokens?: number;
  max_tool_calls?: number;
  previous_response_id?: string;
  reasoning?: {
    effort: "minimal" | "low" | "medium" | "high" | "max";
  };
  service_tier?: "default" | "fast";
  store?: boolean;
  stream?: boolean;
  temperature?: number;
  text?: {
    format: {
      type: "text" | "json_object" | "json_schema";
      name?: string;
      description?: string;
      schema?: Record<string, unknown>;
      strict?: boolean;
    };
  };
  thinking?: {
    type: "enabled" | "disabled" | "auto";
  };
  tool_choice?: string | Record<string, unknown>;
  tools?: Array<Record<string, unknown>>;
  top_p?: number;
};

export type ResponsesScenario = {
  id: string;
  index: string;
  title: string;
  badge: string;
  summary: string;
  guide: string[];
  capabilityTags: string[];
  expectedOutput: string[];
  requestBody: ResponsesRequestBody;
};

export const RESPONSES_SCENARIOS: ResponsesScenario[] = [
  {
    id: "text",
    index: "01",
    title: "文本生成",
    badge: "基础",
    summary:
      "字符串或 InputItem 数组输入，演示系统指令、采样、最大输出长度、存储和同步 / 流式返回。",
    guide: [
      "input 可以直接填写字符串；需要角色或多模态结构时切换为 InputItem 数组。",
      "instructions 只影响当前轮次，与 previous_response_id 同用时不会自动继承。",
      "temperature 与 top_p 通常只调整一个；完整 JSON 可继续编辑所有顶层字段。",
    ],
    capabilityTags: ["input", "instructions", "stream", "store"],
    expectedOutput: ["message", "usage", "status"],
    requestBody: {
      model: RESPONSES_DEFAULT_MODEL,
      input: "请用三点概括 Responses API 相比 Chat API 的优势。",
      instructions: "你是火山方舟 API 演示助手，回答准确、简洁。",
      max_output_tokens: 1024,
      service_tier: "default",
      store: true,
      stream: false,
      temperature: 1,
      top_p: 0.7,
    },
  },
  {
    id: "conversation",
    index: "02",
    title: "多轮上下文",
    badge: "上下文",
    summary:
      "通过 previous_response_id 串联历史输入与回答，也可修改父响应 ID 形成对话分支。",
    guide: [
      "先执行第一轮并复制返回的 resp_... ID，再填入 previous_response_id。",
      "默认 store=true；只有成功或因长度限制而 incomplete 的响应会进入存储链。",
      "每个存储链最多 1000 个 item，默认保存 3 天，expire_at 最长可设到 7 天。",
    ],
    capabilityTags: ["previous_response_id", "expire_at", "分支对话"],
    expectedOutput: ["previous_response_id", "output", "expire_at"],
    requestBody: {
      model: RESPONSES_DEFAULT_MODEL,
      previous_response_id: "",
      input: [
        {
          role: "user",
          content: "这个方案最需要验证的风险是什么？",
        },
      ],
      store: true,
      stream: false,
    },
  },
  {
    id: "reasoning",
    index: "03",
    title: "深度思考",
    badge: "推理",
    summary:
      "控制 thinking 开关、reasoning.effort、加密思考原文和输出 Token 上限。",
    guide: [
      "thinking.type 支持 enabled、disabled；部分模型支持 auto。",
      "reasoning.effort 控制原始思考工作量；minimal 表示直接回答。",
      "include 加入 reasoning.encrypted_content 才会返回可回传的加密思考原文。",
      "深度思考容易触发长等待，官方建议优先使用流式输出。",
    ],
    capabilityTags: ["thinking", "reasoning.effort", "encrypted_content"],
    expectedOutput: ["reasoning", "message", "reasoning_tokens"],
    requestBody: {
      model: RESPONSES_DEFAULT_MODEL,
      input:
        "一个 API 演示平台同时支持真实调用和本地历史时，如何设计安全边界？",
      thinking: { type: "enabled" },
      reasoning: { effort: "high" },
      include: ["reasoning.encrypted_content"],
      max_output_tokens: 2048,
      store: true,
      stream: true,
    },
  },
  {
    id: "multimodal",
    index: "04",
    title: "多模态理解",
    badge: "视觉 / 文件",
    summary:
      "在同一个 InputItem 中组合文本、图片、视频、PDF 文档或音频，支持 URL、file_id 和 Base64。",
    guide: [
      "先选择内容类型，再填写公网 HTTPS URL 或 Files API 返回的 file_id。",
      "图片支持 detail、image_pixel_limit；视频支持 URL / file_id 与抽帧配置；PDF 使用 input_file。",
      "本页不自动上传素材；真实执行前应确认素材不含隐私或商业敏感信息。",
    ],
    capabilityTags: [
      "input_image",
      "input_video",
      "input_file",
      "input_audio",
    ],
    expectedOutput: ["message", "annotations", "usage"],
    requestBody: {
      model: RESPONSES_DEFAULT_MODEL,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "描述素材中的主要内容，并给出三条可验证的结论。",
            },
            {
              type: "input_image",
              image_url: "",
              detail: "auto",
            },
          ],
        },
      ],
      store: true,
      stream: false,
    },
  },
  {
    id: "function",
    index: "05",
    title: "Function Calling",
    badge: "自定义工具",
    summary:
      "用 JSON Schema 定义函数，让模型返回 function_call，再以 function_call_output 回传执行结果。",
    guide: [
      "tools.function 的 name、parameters 必填；strict 默认开启。",
      "模型只生成调用参数，不会替你执行本地函数。",
      "回传结果时 call_id 必须与 function_call 输出一致。",
    ],
    capabilityTags: ["tools.function", "tool_choice", "function_call_output"],
    expectedOutput: ["function_call", "message", "usage"],
    requestBody: {
      model: RESPONSES_DEFAULT_MODEL,
      input: "查询北京今天的天气，并给出出行建议。",
      tools: [
        {
          type: "function",
          name: "get_weather",
          description: "根据城市名称查询当日天气。",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "城市名称，如北京、上海。",
              },
            },
            required: ["location"],
            additionalProperties: false,
          },
          strict: true,
        },
      ],
      tool_choice: "auto",
      store: true,
      stream: false,
    },
  },
  {
    id: "built-in-tools",
    index: "06",
    title: "内置工具与 MCP",
    badge: "工具生态",
    summary:
      "覆盖联网搜索、图像处理、私域知识库、Remote MCP 与豆包助手工具的统一 tools 结构。",
    guide: [
      "联网搜索可设置 limit、max_keyword 与 sources；会产生工具调用费用。",
      "知识库需要 knowledge_resource_id，MCP 需要 server_label 与 HTTPS server_url。",
      "图像处理应与 input_image 同用；豆包助手的 feature 子能力按需开启。",
      "复杂工具参数可直接在右侧完整 JSON 中编辑，表单与 API 详情保持联动。",
    ],
    capabilityTags: [
      "web_search",
      "image_process",
      "knowledge_search",
      "mcp",
      "doubao_app",
    ],
    expectedOutput: [
      "web_search_call",
      "image_process",
      "knowledge_search_call",
      "mcp_call",
    ],
    requestBody: {
      model: RESPONSES_DEFAULT_MODEL,
      input: "检索北京今天的天气，并说明信息来源。",
      tools: [
        {
          type: "web_search",
          max_keyword: 2,
          limit: 10,
        },
      ],
      tool_choice: "auto",
      max_tool_calls: 3,
      store: true,
      stream: true,
    },
  },
  {
    id: "cache",
    index: "07",
    title: "上下文缓存",
    badge: "降本",
    summary:
      "演示前缀缓存、Session 缓存、previous_response_id 命中与 expire_at 生命周期。",
    guide: [
      "写缓存的前提是 store=true，且前置轮次需要连续保持 caching.enabled。",
      "prefix=true 只写前缀缓存、不生成回复；输入至少 256 tokens，且不能 stream。",
      "instructions 与缓存互斥；thinking 配置需与前一轮保持一致。",
      "缓存存储会产生费用，直至手动删除或 expire_at 到期。",
    ],
    capabilityTags: ["caching.enabled", "prefix", "cached_tokens", "expire_at"],
    expectedOutput: ["caching", "cached_tokens", "expire_at"],
    requestBody: {
      model: RESPONSES_DEFAULT_MODEL,
      input:
        "你是企业 API 方案顾问。请基于本轮上下文，给出一个包含目标、输入、输出、安全边界与验收方法的演示方案。",
      caching: { type: "enabled", prefix: false },
      thinking: { type: "disabled" },
      store: true,
      stream: false,
    },
  },
  {
    id: "structured-output",
    index: "08",
    title: "结构化输出",
    badge: "Beta",
    summary:
      "通过 text.format 在 text、json_object 与 json_schema 之间切换，联动展示完整 Schema。",
    guide: [
      "json_object / json_schema 仍处于 beta 阶段，生产使用前需验证稳定性。",
      "json_schema 需要 name 与 schema；strict 控制是否严格按 Schema 输出。",
      "缓存链中只支持 json_object，不支持 json_schema。",
    ],
    capabilityTags: ["text.format", "json_object", "json_schema"],
    expectedOutput: ["message.output_text", "status", "usage"],
    requestBody: {
      model: RESPONSES_DEFAULT_MODEL,
      input: "列出三种常见的十字花科植物。",
      text: {
        format: {
          type: "json_schema",
          name: "plant_list",
          description: "十字花科植物列表。",
          strict: true,
          schema: {
            type: "object",
            properties: {
              plants: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    feature: { type: "string" },
                  },
                  required: ["name", "feature"],
                  additionalProperties: false,
                },
              },
            },
            required: ["plants"],
            additionalProperties: false,
          },
        },
      },
      thinking: { type: "disabled" },
      store: true,
      stream: false,
    },
  },
];

export const RESPONSE_REQUEST_FIELDS = [
  ["input", "string / object[]", "必选", "文本或 InputItem 列表"],
  ["model", "string", "必选", "Model ID 或 Endpoint ID"],
  ["caching", "object", "选填", "type、prefix"],
  ["context_management", "object", "选填", "上下文编辑策略"],
  ["expire_at", "integer", "选填", "UTC Unix 秒，最长 7 天"],
  ["include", "string[]", "选填", "附加输出数据"],
  ["instructions", "string", "选填", "当前轮系统 / 开发者指令"],
  ["max_output_tokens", "integer", "选填", "回答与思考总 Token 上限"],
  ["max_tool_calls", "integer", "选填", "工具调用轮次 1–10"],
  ["previous_response_id", "string", "选填", "上轮响应 ID"],
  ["reasoning", "object", "选填", "effort 思考工作量"],
  ["service_tier", "string", "选填", "default / fast"],
  ["store", "boolean", "默认 true", "是否存储响应"],
  ["stream", "boolean", "默认 false", "SSE 流式输出"],
  ["temperature", "number", "默认 1.0", "采样温度 0–2"],
  ["text", "object", "选填", "text.format 输出格式"],
  ["thinking", "object", "选填", "enabled / disabled / auto"],
  ["tool_choice", "string / object", "选填", "工具调用策略"],
  ["tools", "object[]", "选填", "函数与内置工具列表"],
  ["top_p", "number", "默认 0.7", "核采样阈值 0–1"],
] as const;
export const RESPONSE_OUTPUT_FIELDS = [
  ["created_at", "integer", "创建时间戳"],
  ["id", "string", "resp_... 响应 ID"],
  ["model", "string", "实际模型与版本"],
  ["object", "string", "固定为 response"],
  ["caching", "object", "实际缓存配置"],
  ["context_management", "object", "已应用的上下文编辑"],
  ["error", "object", "code、message"],
  ["expire_at", "integer", "存储 / 缓存过期时刻"],
  ["incomplete_details", "object", "未完成原因与内容过滤详情"],
  ["instructions", "string", "本轮系统指令"],
  ["max_output_tokens", "integer", "最大输出长度"],
  ["max_tool_calls", "integer", "最大工具调用轮次"],
  ["output", "object[]", "消息、思考和工具调用条目"],
  ["previous_response_id", "string", "本轮引用的历史响应"],
  ["reasoning", "object", "实际思考工作量"],
  ["service_tier", "string", "实际推理模式"],
  ["status", "string", "completed / incomplete / failed 等"],
  ["store", "boolean", "实际存储状态"],
  ["temperature", "number", "实际采样温度"],
  ["text", "object", "实际输出格式"],
  ["thinking", "object", "实际思考配置"],
  ["tool_choice", "string / object", "实际工具策略"],
  ["tools", "object[]", "实际工具配置"],
  ["top_p", "number", "实际核采样阈值"],
  ["usage", "object", "输入、输出、缓存与工具用量"],
] as const;

export const RESPONSE_INPUT_VARIANTS = [
  ["message", "content、role、id、partial"],
  ["function_call", "arguments、call_id、name、status"],
  ["function_call_output", "call_id、output、status"],
  ["reasoning", "content、summary、encrypted_content、status"],
  ["mcp_approval_request", "arguments、name、server_label"],
  ["mcp_approval_response", "approval_request_id、approve、reason"],
  ["mcp_list_tools", "server_label、tools、error"],
  ["mcp_call", "name、server_label、arguments、output、error"],
  ["item_reference", "id"],
] as const;

export const RESPONSE_CONTENT_VARIANTS = [
  ["input_text", "text、translation_options"],
  ["input_image", "image_url / file_id、detail、image_pixel_limit"],
  ["input_video", "video_url / file_id、fps、detail"],
  ["input_file", "file_url / file_id、filename"],
  ["input_audio", "audio_url / file_id、chunking_strategy"],
  ["output_text", "text、annotations"],
  ["reasoning_text", "text、annotations"],
] as const;

export const RESPONSE_TOOL_VARIANTS = [
  ["function", "name、description、parameters、strict"],
  ["web_search", "limit、max_keyword、sources、user_location"],
  ["image_process", "grounding、pointing、zoom、rotate"],
  ["mcp", "server_label、server_url、headers、allowed_tools、require_approval"],
  [
    "knowledge_search",
    "knowledge_resource_id、dense_weight、limit、ranking_options",
  ],
  ["doubao_app", "feature.chat / thinking / ai_search / reasoning_search"],
] as const;

export const RESPONSE_OUTPUT_VARIANTS = [
  ["message", "content[]、role、status、id"],
  ["function_call", "arguments、call_id、name、status"],
  ["reasoning", "content、summary、encrypted_content、status"],
  ["transcription", "transcription[]、status"],
  ["web_search_call", "action.query、results、status"],
  ["image_process", "action、image_url、status、error"],
  ["mcp_approval_request", "arguments、name、server_label"],
  ["mcp_list_tools", "server_label、tools、error"],
  ["mcp_call", "arguments、name、output、error"],
  ["knowledge_search_call", "knowledge_resource_id、queries、results"],
  ["doubao_app_call", "blocks、status、usage"],
  ["agent_tool_call", "name、status、id"],
] as const;
