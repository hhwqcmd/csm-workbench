import {
  RESPONSES_BASE_URL,
  type ResponsesRequestBody,
} from "./responses-examples";

export class ResponsesValidationError extends Error {}

type ResponsesConnection = {
  apiKey: string;
  trace: boolean;
};

export type ManageResponsesInput = ResponsesConnection &
  (
    | {
        action: "create";
        requestBody: ResponsesRequestBody;
      }
    | {
        action: "retrieve" | "list-input-items" | "delete";
        responseId: string;
      }
  );

const REQUEST_BODY_FIELDS = new Set([
  "model",
  "input",
  "caching",
  "context_management",
  "expire_at",
  "include",
  "instructions",
  "max_output_tokens",
  "max_tool_calls",
  "previous_response_id",
  "reasoning",
  "service_tier",
  "store",
  "stream",
  "temperature",
  "text",
  "thinking",
  "tool_choice",
  "tools",
  "top_p",
]);

const TOOL_TYPES = new Set([
  "function",
  "web_search",
  "image_process",
  "mcp",
  "knowledge_search",
  "doubao_app",
]);

const SENSITIVE_KEYS = new Set([
  "authorization",
  "api_key",
  "apikey",
  "token",
  "access_token",
  "secret",
  "password",
]);

export function parseManageResponsesInput(
  value: unknown,
): ManageResponsesInput {
  const input = asRecord(value, "请求");
  const connection = {
    apiKey: apiKey(input.apiKey),
    trace: optionalBoolean(input.trace, "trace") ?? false,
  };

  if (input.action === "create") {
    return {
      ...connection,
      action: "create",
      requestBody: parseRequestBody(input.requestBody),
    };
  }

  if (
    input.action === "retrieve" ||
    input.action === "list-input-items" ||
    input.action === "delete"
  ) {
    return {
      ...connection,
      action: input.action,
      responseId: responseId(input.responseId),
    };
  }

  throw new ResponsesValidationError(
    "Responses API 操作必须是 create、retrieve、list-input-items 或 delete。",
  );
}

export async function proxyResponses(
  input: ManageResponsesInput,
): Promise<Response> {
  const target = upstreamRequest(input);
  const headers: Record<string, string> = {
    authorization: `Bearer ${input.apiKey}`,
    "content-type": "application/json",
  };
  if (input.trace) headers["x-fornax-trace"] = "true";

  const upstream = await fetch(target.url, {
    method: target.method,
    headers,
    body: target.body ? JSON.stringify(target.body) : undefined,
    signal: AbortSignal.timeout(
      input.action === "create" && input.requestBody.stream
        ? 300_000
        : 180_000,
    ),
  });

  if (
    input.action === "create" &&
    input.requestBody.stream &&
    upstream.ok
  ) {
    if (!upstream.body) {
      throw new Error("火山方舟流式响应没有返回可读取内容。");
    }
    return new Response(redactStream(upstream.body, input.apiKey), {
      status: upstream.status,
      headers: {
        "cache-control": "no-store",
        "content-type": "text/event-stream; charset=utf-8",
        "x-accel-buffering": "no",
      },
    });
  }

  const rawText = await upstream.text();
  const safeText = redactText(rawText, input.apiKey);
  return new Response(safeText || (upstream.status === 204 ? null : "{}"), {
    status: upstream.status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function upstreamRequest(input: ManageResponsesInput): {
  method: "POST" | "GET" | "DELETE";
  url: string;
  body?: ResponsesRequestBody;
} {
  if (input.action === "create") {
    return {
      method: "POST",
      url: `${RESPONSES_BASE_URL}/responses`,
      body: input.requestBody,
    };
  }
  const suffix =
    input.action === "list-input-items"
      ? `/responses/${input.responseId}/input_items`
      : `/responses/${input.responseId}`;
  return {
    method: input.action === "delete" ? "DELETE" : "GET",
    url: `${RESPONSES_BASE_URL}${suffix}`,
  };
}

function parseRequestBody(value: unknown): ResponsesRequestBody {
  const body = asRecord(value, "requestBody");
  const unknownFields = Object.keys(body).filter(
    (field) => !REQUEST_BODY_FIELDS.has(field),
  );
  if (unknownFields.length > 0) {
    throw new ResponsesValidationError(
      `Request Body 包含未支持字段：${unknownFields.join("、")}。`,
    );
  }
  assertJsonShape(body);

  const model = requiredString(body.model, "model", 200);
  if (body.input === undefined) {
    throw new ResponsesValidationError("input 是必填字段。");
  }
  if (
    typeof body.input !== "string" &&
    !Array.isArray(body.input)
  ) {
    throw new ResponsesValidationError("input 必须是字符串或 InputItem 数组。");
  }
  if (typeof body.input === "string" && !body.input.trim()) {
    throw new ResponsesValidationError("input 字符串不能为空。");
  }
  if (Array.isArray(body.input)) {
    if (body.input.length === 0 || body.input.length > 1000) {
      throw new ResponsesValidationError(
        "input 数组必须包含 1 到 1000 个 InputItem。",
      );
    }
    validateInputUrls(body.input);
  }

  const parsed: ResponsesRequestBody = { ...body, model };
  optionalString(body.instructions, "instructions", 100_000);
  optionalResponseId(body.previous_response_id);
  optionalInteger(body.max_output_tokens, "max_output_tokens", 1, 131_072);
  optionalInteger(body.max_tool_calls, "max_tool_calls", 1, 10);
  optionalNumber(body.temperature, "temperature", 0, 2);
  optionalNumber(body.top_p, "top_p", 0, 1);
  optionalBoolean(body.store, "store");
  optionalBoolean(body.stream, "stream");

  if (
    body.service_tier !== undefined &&
    body.service_tier !== "default" &&
    body.service_tier !== "fast"
  ) {
    throw new ResponsesValidationError(
      'service_tier 只支持 "default" 或 "fast"。',
    );
  }

  if (body.expire_at !== undefined) {
    const expireAt = optionalInteger(
      body.expire_at,
      "expire_at",
      1,
      Number.MAX_SAFE_INTEGER,
    );
    const now = Math.floor(Date.now() / 1000);
    if (expireAt === undefined || expireAt <= now || expireAt > now + 604_800) {
      throw new ResponsesValidationError(
        "expire_at 必须是当前时刻之后且不超过 7 天的 UTC Unix 秒时间戳。",
      );
    }
  }

  if (body.include !== undefined) {
    if (
      !Array.isArray(body.include) ||
      body.include.length > 20 ||
      body.include.some(
        (item) => typeof item !== "string" || item.length > 200,
      )
    ) {
      throw new ResponsesValidationError(
        "include 必须是最多 20 项的字符串数组。",
      );
    }
  }

  const caching =
    body.caching === undefined
      ? undefined
      : asRecord(body.caching, "caching");
  if (caching) {
    exactKeys(caching, ["type", "prefix"], "caching");
    if (caching.type !== "enabled" && caching.type !== "disabled") {
      throw new ResponsesValidationError(
        'caching.type 只支持 "enabled" 或 "disabled"。',
      );
    }
    optionalBoolean(caching.prefix, "caching.prefix");
    if (caching.prefix === true && body.stream === true) {
      throw new ResponsesValidationError(
        "创建前缀缓存时 stream 不能设置为 true。",
      );
    }
    if (caching.type === "enabled" && body.instructions) {
      throw new ResponsesValidationError(
        "instructions 与上下文缓存互斥，请移除其中一项。",
      );
    }
  }

  if (body.thinking !== undefined) {
    const thinking = asRecord(body.thinking, "thinking");
    exactKeys(thinking, ["type"], "thinking");
    if (
      thinking.type !== "enabled" &&
      thinking.type !== "disabled" &&
      thinking.type !== "auto"
    ) {
      throw new ResponsesValidationError(
        "thinking.type 只支持 enabled、disabled 或 auto。",
      );
    }
  }

  if (body.reasoning !== undefined) {
    const reasoning = asRecord(body.reasoning, "reasoning");
    exactKeys(reasoning, ["effort"], "reasoning");
    if (
      reasoning.effort !== "minimal" &&
      reasoning.effort !== "low" &&
      reasoning.effort !== "medium" &&
      reasoning.effort !== "high" &&
      reasoning.effort !== "max"
    ) {
      throw new ResponsesValidationError(
        "reasoning.effort 只支持 minimal、low、medium、high 或 max。",
      );
    }
    const thinking = body.thinking as { type?: string } | undefined;
    if (
      thinking?.type === "disabled" &&
      reasoning.effort !== "minimal"
    ) {
      throw new ResponsesValidationError(
        "thinking.type=disabled 时 reasoning.effort 只能是 minimal。",
      );
    }
  }

  if (body.tools !== undefined) {
    if (!Array.isArray(body.tools) || body.tools.length > 32) {
      throw new ResponsesValidationError("tools 必须是最多 32 项的工具数组。");
    }
    for (const [index, value] of body.tools.entries()) {
      validateTool(value, index);
    }
    if (
      caching?.type === "enabled" &&
      body.tools.some(
        (tool) =>
          asRecord(tool, "tool").type !== "function",
      )
    ) {
      throw new ResponsesValidationError(
        "上下文缓存不能与 Function Calling 以外的 tools 同时使用。",
      );
    }
  }

  if (body.text !== undefined) {
    const text = asRecord(body.text, "text");
    exactKeys(text, ["format"], "text");
    const format = asRecord(text.format, "text.format");
    exactKeys(
      format,
      ["type", "name", "description", "schema", "strict"],
      "text.format",
    );
    if (
      format.type !== "text" &&
      format.type !== "json_object" &&
      format.type !== "json_schema"
    ) {
      throw new ResponsesValidationError(
        "text.format.type 只支持 text、json_object 或 json_schema。",
      );
    }
    if (
      format.type === "json_schema" &&
      (typeof format.name !== "string" ||
        !format.name.trim() ||
        !isRecord(format.schema))
    ) {
      throw new ResponsesValidationError(
        "json_schema 模式必须填写 name 和 schema 对象。",
      );
    }
    if (
      caching?.type === "enabled" &&
      format.type === "json_schema"
    ) {
      throw new ResponsesValidationError(
        "缓存链不支持 json_schema，请改用 json_object 或关闭缓存。",
      );
    }
  }

  if (body.tool_choice !== undefined) {
    if (
      typeof body.tool_choice !== "string" &&
      !isRecord(body.tool_choice)
    ) {
      throw new ResponsesValidationError(
        "tool_choice 必须是策略字符串或指定工具对象。",
      );
    }
    if (
      typeof body.tool_choice === "string" &&
      !["none", "auto", "required"].includes(body.tool_choice)
    ) {
      throw new ResponsesValidationError(
        "tool_choice 字符串只支持 none、auto 或 required。",
      );
    }
  }

  return parsed;
}

function validateTool(value: unknown, index: number) {
  const tool = asRecord(value, `tools[${index}]`);
  if (typeof tool.type !== "string" || !TOOL_TYPES.has(tool.type)) {
    throw new ResponsesValidationError(
      `tools[${index}].type 不在支持的工具类型中。`,
    );
  }
  if (tool.type === "function") {
    requiredString(tool.name, `tools[${index}].name`, 128);
    if (!isRecord(tool.parameters)) {
      throw new ResponsesValidationError(
        `tools[${index}].parameters 必须是 JSON Schema 对象。`,
      );
    }
  }
  if (tool.type === "mcp") {
    requiredString(tool.server_label, `tools[${index}].server_label`, 128);
    const serverUrl = requiredString(
      tool.server_url,
      `tools[${index}].server_url`,
      2048,
    );
    assertHttpsUrl(serverUrl, `tools[${index}].server_url`);
  }
  if (tool.type === "knowledge_search") {
    requiredString(
      tool.knowledge_resource_id,
      `tools[${index}].knowledge_resource_id`,
      256,
    );
  }
}

function validateInputUrls(value: unknown) {
  walk(value, (key, nestedValue, path) => {
    if (
      ["image_url", "video_url", "audio_url", "file_url"].includes(key) &&
      typeof nestedValue === "string" &&
      nestedValue
    ) {
      if (
        !nestedValue.startsWith("https://") &&
        !nestedValue.startsWith("data:")
      ) {
        throw new ResponsesValidationError(
          `${path} 只支持公网 HTTPS URL 或受控 Base64 data URL。`,
        );
      }
    }
  });
}

function assertJsonShape(value: unknown) {
  let nodes = 0;
  const visit = (current: unknown, depth: number) => {
    nodes += 1;
    if (nodes > 20_000) {
      throw new ResponsesValidationError("Request Body 结构过大。");
    }
    if (depth > 24) {
      throw new ResponsesValidationError("Request Body 嵌套层级不能超过 24。");
    }
    if (typeof current === "string" && current.length > 1_000_000) {
      throw new ResponsesValidationError("单个字符串字段不能超过 1 MB。");
    }
    if (Array.isArray(current)) {
      current.forEach((item) => visit(item, depth + 1));
    } else if (isRecord(current)) {
      for (const [key, nested] of Object.entries(current)) {
        if (key === "__proto__" || key === "prototype" || key === "constructor") {
          throw new ResponsesValidationError("Request Body 包含不安全的对象键。");
        }
        visit(nested, depth + 1);
      }
    } else if (
      current !== null &&
      typeof current !== "string" &&
      typeof current !== "number" &&
      typeof current !== "boolean"
    ) {
      throw new ResponsesValidationError("Request Body 必须是合法 JSON。");
    }
  };
  visit(value, 0);
}

function redactStream(stream: ReadableStream<Uint8Array>, secret: string) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let pending = "";
  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        pending += decoder.decode(chunk, { stream: true });
        let carryLength = 0;
        for (
          let length = Math.min(secret.length - 1, pending.length);
          length > 0;
          length -= 1
        ) {
          if (pending.endsWith(secret.slice(0, length))) {
            carryLength = length;
            break;
          }
        }
        const safeBoundary = pending.length - carryLength;
        if (safeBoundary === 0) return;
        controller.enqueue(
          encoder.encode(redactText(pending.slice(0, safeBoundary), secret)),
        );
        pending = pending.slice(safeBoundary);
      },
      flush(controller) {
        pending += decoder.decode();
        if (pending) {
          controller.enqueue(encoder.encode(redactText(pending, secret)));
        }
      },
    }),
  );
}

function redactText(value: string, secret: string) {
  let safe = value.replaceAll(secret, "[REDACTED]");
  try {
    const parsed = JSON.parse(safe) as unknown;
    safe = JSON.stringify(redactValue(parsed));
  } catch {
    // SSE and plain-text upstream errors are sanitized by direct secret replacement.
  }
  return safe;
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      SENSITIVE_KEYS.has(key.toLowerCase())
        ? "[REDACTED]"
        : redactValue(nested),
    ]),
  );
}

function walk(
  value: unknown,
  visitor: (key: string, value: unknown, path: string) => void,
  path = "input",
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    const nextPath = `${path}.${key}`;
    visitor(key, nested, nextPath);
    walk(nested, visitor, nextPath);
  }
}

function apiKey(value: unknown) {
  return requiredString(value, "API Key", 4096);
}

function responseId(value: unknown) {
  const id = requiredString(value, "Response ID", 256);
  if (!/^resp_[A-Za-z0-9_-]+$/.test(id)) {
    throw new ResponsesValidationError(
      "Response ID 必须是以 resp_ 开头的安全资源 ID。",
    );
  }
  return id;
}

function optionalResponseId(value: unknown) {
  if (value === undefined || value === "") return undefined;
  return responseId(value);
}

function requiredString(value: unknown, label: string, maxLength: number) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > maxLength
  ) {
    throw new ResponsesValidationError(
      `${label} 必须是 1 到 ${maxLength} 个字符的字符串。`,
    );
  }
  return value.trim();
}

function optionalString(value: unknown, label: string, maxLength: number) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new ResponsesValidationError(
      `${label} 必须是不超过 ${maxLength} 个字符的字符串。`,
    );
  }
  return value;
}

function optionalBoolean(value: unknown, label: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new ResponsesValidationError(`${label} 必须是布尔值。`);
  }
  return value;
}

function optionalInteger(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
) {
  if (value === undefined) return undefined;
  if (
    !Number.isInteger(value) ||
    Number(value) < minimum ||
    Number(value) > maximum
  ) {
    throw new ResponsesValidationError(
      `${label} 必须是 ${minimum} 到 ${maximum} 的整数。`,
    );
  }
  return Number(value);
}

function optionalNumber(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
) {
  if (value === undefined) return undefined;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new ResponsesValidationError(
      `${label} 必须是 ${minimum} 到 ${maximum} 的数字。`,
    );
  }
  return value;
}

function assertHttpsUrl(value: string, label: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ResponsesValidationError(`${label} 必须是合法 URL。`);
  }
  if (parsed.protocol !== "https:") {
    throw new ResponsesValidationError(`${label} 只支持 HTTPS URL。`);
  }
}

function exactKeys(
  value: Record<string, unknown>,
  fields: string[],
  label: string,
) {
  const allowed = new Set(fields);
  const unknown = Object.keys(value).filter((field) => !allowed.has(field));
  if (unknown.length > 0) {
    throw new ResponsesValidationError(
      `${label} 包含未支持字段：${unknown.join("、")}。`,
    );
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new ResponsesValidationError(`${label} 必须是 JSON 对象。`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
