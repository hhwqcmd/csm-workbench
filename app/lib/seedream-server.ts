import {
  getSeedreamExample,
  SEEDREAM_BASE_URL,
  SEEDREAM_DEFAULT_MODEL,
  SEEDREAM_LITE_MODEL,
  SEEDREAM_PROMPT_MODEL,
  type SeedreamModel,
  type SeedreamRequestBody,
} from "./seedream-examples";
import { validateSeedreamAnnotations } from "./seedream-annotations";

export class SeedreamValidationError extends Error {}

export type GenerateSeedreamInput = {
  apiKey: string;
  requestBody: SeedreamRequestBody;
};

export type OptimizeSeedreamPromptInput = {
  apiKey: string;
  scenarioId: string;
  prompt: string;
};

export function parseGenerateSeedreamInput(
  value: unknown,
): GenerateSeedreamInput {
  const input = asRecord(value);
  return {
    apiKey: apiKey(input.apiKey),
    requestBody: parseRequestBody(input.requestBody),
  };
}

export function parseOptimizeSeedreamPromptInput(
  value: unknown,
): OptimizeSeedreamPromptInput {
  const input = asRecord(value);
  const scenarioId = requiredString(input.scenarioId, "示例 ID", 80);
  if (!getSeedreamExample(scenarioId)) {
    throw new SeedreamValidationError("未找到对应的 Seedream 示例。");
  }
  return {
    apiKey: apiKey(input.apiKey),
    scenarioId,
    prompt: requiredString(input.prompt, "提示词", 10_000),
  };
}

export async function proxySeedreamGeneration(
  input: GenerateSeedreamInput,
): Promise<Response> {
  const upstream = await fetch(`${SEEDREAM_BASE_URL}/images/generations`, {
    method: "POST",
    headers: upstreamHeaders(input.apiKey),
    body: JSON.stringify(input.requestBody),
    signal: AbortSignal.timeout(input.requestBody.stream ? 300_000 : 180_000),
  });

  if (!upstream.ok) {
    const payload = await readJson(upstream);
    throw upstreamFailure(upstream.status, payload, input.apiKey);
  }

  if (input.requestBody.stream) {
    if (!upstream.body) {
      throw new Error("火山方舟流式响应没有返回可读取内容。");
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "content-type": "text/event-stream; charset=utf-8",
        "x-accel-buffering": "no",
      },
    });
  }

  const safeBody = (await upstream.text()).replaceAll(
    input.apiKey,
    "[REDACTED]",
  );
  return new Response(safeBody || "{}", {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export async function optimizeSeedreamPrompt(
  input: OptimizeSeedreamPromptInput,
) {
  const example = getSeedreamExample(input.scenarioId);
  if (!example) {
    throw new SeedreamValidationError("未找到对应的 Seedream 示例。");
  }

  const requestBody = {
    model: SEEDREAM_PROMPT_MODEL,
    messages: [
      {
        role: "system",
        content: [
          "你是 Seedream 图片生成提示词优化器。",
          `当前典型场景：${example.title}。`,
          "请严格参考以下技巧优化用户提示词：",
          ...example.promptTips.map((tip, index) => `${index + 1}. ${tip}`),
          "保留用户原始意图、专有名词、数字和必须生成的文字。",
          "补足主体、行为、环境及必要的风格、色彩、光影、构图或编辑约束。",
          "不要虚构用户没有要求的品牌、人物或事实。",
          "只返回优化后的提示词正文，不要解释、不要标题、不要 Markdown。",
        ].join("\n"),
      },
      {
        role: "user",
        content: input.prompt,
      },
    ],
    thinking: { type: "disabled" },
    max_tokens: 1_200,
  };

  const upstream = await fetch(`${SEEDREAM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: upstreamHeaders(input.apiKey),
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(120_000),
  });
  const payload = await readJson(upstream);
  if (!upstream.ok) {
    throw upstreamFailure(upstream.status, payload, input.apiKey);
  }

  const optimizedPrompt = extractChatContent(payload);
  if (!optimizedPrompt) {
    throw new Error("提示词优化已完成，但响应中没有可用文本。");
  }

  return {
    model: SEEDREAM_PROMPT_MODEL,
    optimizedPrompt,
    response: redactValue(payload, input.apiKey),
  };
}

function parseRequestBody(value: unknown): SeedreamRequestBody {
  const body = exactRecord(value, [
    "model",
    "prompt",
    "image",
    "size",
    "sequential_image_generation",
    "sequential_image_generation_options",
    "stream",
    "tools",
    "optimize_prompt_options",
    "output_format",
    "response_format",
    "watermark",
  ]);
  const model = parseModel(body.model);
  const prompt = requiredString(body.prompt, "prompt", 10_000);
  const image = parseImages(body.image, model);
  const imageCount = Array.isArray(image) ? image.length : image ? 1 : 0;
  const annotationErrors = validateSeedreamAnnotations({
    prompt,
    imageCount,
    model,
  });
  if (annotationErrors.length > 0) {
    throw new SeedreamValidationError(annotationErrors[0]);
  }
  const size = parseSize(body.size, model);
  const outputFormat = oneOf(body.output_format, "output_format", [
    "png",
    "jpeg",
  ] as const);
  const responseFormat = oneOf(body.response_format, "response_format", [
    "url",
    "b64_json",
  ] as const);
  if (typeof body.watermark !== "boolean") {
    throw new SeedreamValidationError("watermark 必须是布尔值。");
  }

  const sequential = body.sequential_image_generation;
  if (
    sequential !== undefined &&
    sequential !== "auto" &&
    sequential !== "disabled"
  ) {
    throw new SeedreamValidationError(
      'sequential_image_generation 只支持 "auto" 或 "disabled"。',
    );
  }
  if (model === SEEDREAM_DEFAULT_MODEL && sequential === "auto") {
    throw new SeedreamValidationError(
      "Seedream 5.0 Pro 暂不支持组图，请改用 Seedream 5.0 Lite。",
    );
  }

  let sequentialOptions: { max_images: number } | undefined;
  if (body.sequential_image_generation_options !== undefined) {
    const options = exactRecord(body.sequential_image_generation_options, [
      "max_images",
    ]);
    if (
      !Number.isInteger(options.max_images) ||
      Number(options.max_images) < 1 ||
      Number(options.max_images) > 15
    ) {
      throw new SeedreamValidationError("max_images 必须是 1 到 15 的整数。");
    }
    sequentialOptions = { max_images: Number(options.max_images) };
    if (sequential !== "auto") {
      throw new SeedreamValidationError(
        "设置 max_images 时 sequential_image_generation 必须为 auto。",
      );
    }
    const inputCount = Array.isArray(image) ? image.length : image ? 1 : 0;
    if (inputCount + sequentialOptions.max_images > 15) {
      throw new SeedreamValidationError(
        "参考图数量与最终生成图片数量合计不能超过 15 张。",
      );
    }
  }

  let stream: boolean | undefined;
  if (body.stream !== undefined) {
    if (typeof body.stream !== "boolean") {
      throw new SeedreamValidationError("stream 必须是布尔值。");
    }
    stream = body.stream;
    if (stream && model !== SEEDREAM_LITE_MODEL) {
      throw new SeedreamValidationError(
        "Seedream 5.0 Pro 暂不支持流式输出，请改用 Seedream 5.0 Lite。",
      );
    }
  }

  let tools: Array<{ type: "web_search" }> | undefined;
  if (body.tools !== undefined) {
    if (
      !Array.isArray(body.tools) ||
      body.tools.length !== 1 ||
      !isWebSearchTool(body.tools[0])
    ) {
      throw new SeedreamValidationError(
        'tools 当前只支持 [{"type":"web_search"}]。',
      );
    }
    if (model !== SEEDREAM_LITE_MODEL) {
      throw new SeedreamValidationError(
        "Seedream 5.0 Pro 暂不支持联网搜索，请改用 Seedream 5.0 Lite。",
      );
    }
    if (image) {
      throw new SeedreamValidationError("联网搜索示例只支持纯文本输入。");
    }
    tools = [{ type: "web_search" }];
  }

  let optimizePromptOptions:
    | { mode: "standard" | "fast" }
    | undefined;
  if (body.optimize_prompt_options !== undefined) {
    const options = exactRecord(body.optimize_prompt_options, ["mode"]);
    const mode = oneOf(options.mode, "optimize_prompt_options.mode", [
      "standard",
      "fast",
    ] as const);
    if (model === SEEDREAM_LITE_MODEL && mode === "fast") {
      throw new SeedreamValidationError(
        "Seedream 5.0 Lite 的图片 API 提示词优化只支持 standard 模式。",
      );
    }
    optimizePromptOptions = { mode };
  }

  const parsed: SeedreamRequestBody = {
    model,
    prompt,
    size,
    output_format: outputFormat,
    response_format: responseFormat,
    watermark: body.watermark,
  };
  if (image) parsed.image = image;
  if (sequential !== undefined) parsed.sequential_image_generation = sequential;
  if (sequentialOptions) {
    parsed.sequential_image_generation_options = sequentialOptions;
  }
  if (stream !== undefined) parsed.stream = stream;
  if (tools) parsed.tools = tools;
  if (optimizePromptOptions) {
    parsed.optimize_prompt_options = optimizePromptOptions;
  }
  return parsed;
}

function parseModel(value: unknown): SeedreamModel {
  if (value === SEEDREAM_DEFAULT_MODEL || value === SEEDREAM_LITE_MODEL) {
    return value;
  }
  throw new SeedreamValidationError("当前仅开放 Seedream 5.0 Pro 与 Lite。");
}

function parseImages(
  value: unknown,
  model: SeedreamModel,
): string | string[] | undefined {
  if (value === undefined) return undefined;
  const rawImages = Array.isArray(value) ? value : [value];
  const maxImages = model === SEEDREAM_DEFAULT_MODEL ? 10 : 14;
  if (rawImages.length < 1 || rawImages.length > maxImages) {
    throw new SeedreamValidationError(
      `${model === SEEDREAM_DEFAULT_MODEL ? "Seedream 5.0 Pro" : "Seedream 5.0 Lite"} 最多支持 ${maxImages} 张参考图。`,
    );
  }
  const parsed = rawImages.map((image, index) =>
    publicImage(image, `image[${index}]`),
  );
  return Array.isArray(value) ? parsed : parsed[0];
}

function parseSize(value: unknown, model: SeedreamModel): string {
  const size = requiredString(value, "size", 32);
  const presets =
    model === SEEDREAM_DEFAULT_MODEL
      ? new Set(["1K", "2K"])
      : new Set(["2K", "3K", "4K"]);
  if (presets.has(size)) return size;

  const match = /^(\d{2,5})x(\d{2,5})$/.exec(size);
  if (!match) {
    throw new SeedreamValidationError(
      `size 不符合 ${model === SEEDREAM_DEFAULT_MODEL ? "Pro" : "Lite"} 支持的分辨率档位或“宽x高”格式。`,
    );
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  const pixels = width * height;
  const ratio = width / height;
  const [minPixels, maxPixels] =
    model === SEEDREAM_DEFAULT_MODEL
      ? [921_600, 4_624_220]
      : [3_686_400, 16_777_216];
  if (
    width <= 14 ||
    height <= 14 ||
    pixels < minPixels ||
    pixels > maxPixels ||
    ratio < 1 / 16 ||
    ratio > 16
  ) {
    throw new SeedreamValidationError(
      `自定义 size 超出 ${model === SEEDREAM_DEFAULT_MODEL ? "Pro" : "Lite"} 的像素或宽高比范围。`,
    );
  }
  return size;
}

function publicImage(value: unknown, label: string): string {
  const raw = requiredString(value, label, 42_000_000);
  if (/^data:image\/(jpeg|png|webp|bmp|tiff|gif|heic|heif);base64,/i.test(raw)) {
    if (!/^data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$/.test(raw)) {
      throw new SeedreamValidationError(`${label} 的 Base64 图片格式不正确。`);
    }
    return raw;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SeedreamValidationError(`${label} 不是有效 URL。`);
  }
  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    hostname === "localhost" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    /^(127|10|0)\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  ) {
    throw new SeedreamValidationError(
      `${label} 必须是无账号信息且可由火山方舟访问的公网 HTTPS URL。`,
    );
  }
  return url.href;
}

function isWebSearchTool(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const tool = value as Record<string, unknown>;
  return Object.keys(tool).length === 1 && tool.type === "web_search";
}

function apiKey(value: unknown): string {
  const key = requiredString(value, "API Key", 512);
  if (/\s/.test(key)) {
    throw new SeedreamValidationError("API Key 不能包含空白字符。");
  }
  return key;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SeedreamValidationError("请求格式不正确。");
  }
  return value as Record<string, unknown>;
}

function exactRecord(
  value: unknown,
  allowedKeys: string[],
): Record<string, unknown> {
  const record = asRecord(value);
  const unsupported = Object.keys(record).find(
    (key) => !allowedKeys.includes(key),
  );
  if (unsupported) {
    throw new SeedreamValidationError(`请求包含未开放字段：${unsupported}。`);
  }
  return record;
}

function requiredString(
  value: unknown,
  label: string,
  maxLength: number,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new SeedreamValidationError(`${label} 不能为空。`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new SeedreamValidationError(`${label} 长度超过限制。`);
  }
  return trimmed;
}

function oneOf<const T extends readonly string[]>(
  value: unknown,
  label: string,
  options: T,
): T[number] {
  if (typeof value !== "string" || !options.includes(value)) {
    throw new SeedreamValidationError(
      `${label} 只支持 ${options.join("、")}。`,
    );
  }
  return value as T[number];
}

function upstreamHeaders(apiKeyValue: string): HeadersInit {
  return {
    authorization: `Bearer ${apiKeyValue}`,
    "content-type": "application/json",
  };
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text) return {};
  try {
    return asRecord(JSON.parse(text));
  } catch {
    return {};
  }
}

function upstreamFailure(
  status: number,
  payload: Record<string, unknown>,
  apiKeyValue: string,
): Error {
  const nested =
    payload.error && typeof payload.error === "object"
      ? (payload.error as Record<string, unknown>)
      : undefined;
  const code =
    typeof nested?.code === "string"
      ? nested.code
      : typeof payload.code === "string"
        ? payload.code
        : undefined;
  const message =
    typeof nested?.message === "string"
      ? nested.message
      : typeof payload.message === "string"
        ? payload.message
        : undefined;
  const detail = [code, message].filter(Boolean).join(" · ");
  return new Error(
    safeError(
      detail
        ? `火山方舟请求失败（HTTP ${status}）：${detail}`
        : `火山方舟请求失败（HTTP ${status}）。`,
      apiKeyValue,
    ),
  );
}

function extractChatContent(payload: Record<string, unknown>): string {
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const choice =
    choices[0] && typeof choices[0] === "object"
      ? (choices[0] as Record<string, unknown>)
      : undefined;
  const message =
    choice?.message && typeof choice.message === "object"
      ? (choice.message as Record<string, unknown>)
      : undefined;
  if (typeof message?.content === "string") {
    return cleanOptimizedPrompt(message.content);
  }
  if (Array.isArray(message?.content)) {
    const combined = message.content
      .map((item) =>
        item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).text === "string"
          ? String((item as Record<string, unknown>).text)
          : "",
      )
      .filter(Boolean)
      .join("\n");
    return cleanOptimizedPrompt(combined);
  }
  return "";
}

function cleanOptimizedPrompt(value: string): string {
  return value
    .trim()
    .replace(/^```(?:text|markdown)?\s*/i, "")
    .replace(/\s*```$/, "")
    .replace(/^优化后的提示词[:：]\s*/i, "")
    .trim();
}

function safeError(message: string, apiKeyValue: string): string {
  return message.replaceAll(apiKeyValue, "[REDACTED]").slice(0, 800);
}

function redactValue(value: unknown, apiKeyValue: string): unknown {
  if (typeof value === "string") {
    return value.replaceAll(apiKeyValue, "[REDACTED]");
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, apiKeyValue));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        redactValue(item, apiKeyValue),
      ]),
    );
  }
  return value;
}
