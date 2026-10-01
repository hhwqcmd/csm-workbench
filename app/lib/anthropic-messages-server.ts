import {
  ANTHROPIC_MESSAGES_URL,
  ANTHROPIC_VERSION,
  type AnthropicMessagesRequestBody,
} from "./anthropic-messages-examples";

export class AnthropicMessagesValidationError extends Error {}

export type CreateAnthropicMessagesInput = {
  apiKey: string;
  trace: boolean;
  requestBody: AnthropicMessagesRequestBody;
};

const REQUEST_BODY_FIELDS = new Set([
  "model",
  "max_tokens",
  "messages",
  "system",
  "stream",
  "thinking",
  "tools",
  "tool_choice",
  "cache_control",
  "metadata",
  "stop_sequences",
  "temperature",
  "top_k",
  "top_p",
]);

const SENSITIVE_KEYS = new Set([
  "authorization",
  "api_key",
  "apikey",
  "access_token",
  "token",
  "secret",
  "password",
  "x-api-key",
]);

const IMAGE_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const DOCUMENT_MEDIA_TYPES = new Set(["application/pdf", "text/plain"]);

export function parseCreateAnthropicMessagesInput(
  value: unknown,
): CreateAnthropicMessagesInput {
  const input = asRecord(value, "请求");
  exactKeys(input, ["apiKey", "trace", "requestBody"], "请求包");
  return {
    apiKey: requiredString(input.apiKey, "API Key", 4096),
    trace: optionalBoolean(input.trace, "trace") ?? false,
    requestBody: parseRequestBody(input.requestBody),
  };
}

export async function proxyAnthropicMessages(
  input: CreateAnthropicMessagesInput,
): Promise<Response> {
  const headers: Record<string, string> = {
    authorization: `Bearer ${input.apiKey}`,
    "content-type": "application/json",
    "anthropic-version": ANTHROPIC_VERSION,
  };
  if (input.trace) headers["x-fornax-trace"] = "true";

  const upstream = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(input.requestBody),
    signal: AbortSignal.timeout(input.requestBody.stream ? 300_000 : 180_000),
  });

  if (input.requestBody.stream && upstream.ok) {
    if (!upstream.body) {
      throw new Error("火山方舟流式响应没有返回可读取内容。");
    }
    return new Response(
      redactAnthropicMessagesStream(upstream.body, input.apiKey),
      {
        status: upstream.status,
        headers: responseHeaders(
          "text/event-stream; charset=utf-8",
          upstream,
        ),
      },
    );
  }

  const rawText = await upstream.text();
  const safeText = redactAnthropicMessagesText(rawText, input.apiKey);
  return new Response(safeText || (upstream.status === 204 ? null : "{}"), {
    status: upstream.status,
    headers: responseHeaders("application/json; charset=utf-8", upstream),
  });
}

function responseHeaders(contentType: string, upstream: Response) {
  const headers: Record<string, string> = {
    "cache-control": "no-store",
    "content-type": contentType,
  };
  if (contentType.startsWith("text/event-stream")) {
    headers["x-accel-buffering"] = "no";
  }
  const requestId = upstream.headers.get("x-request-id");
  if (requestId && /^[A-Za-z0-9._:-]{1,256}$/.test(requestId)) {
    headers["x-request-id"] = requestId;
  }
  return headers;
}

function parseRequestBody(value: unknown): AnthropicMessagesRequestBody {
  const body = asRecord(value, "requestBody");
  const unknownFields = Object.keys(body).filter(
    (field) => !REQUEST_BODY_FIELDS.has(field),
  );
  if (unknownFields.length > 0) {
    throw new AnthropicMessagesValidationError(
      `Request Body 包含未支持字段：${unknownFields.join("、")}。原生扩展仅供只读参考。`,
    );
  }
  assertJsonShape(body);

  const model = requiredString(body.model, "model", 200);
  const maxTokens = requiredInteger(body.max_tokens, "max_tokens", 1, 131_072);
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    throw new AnthropicMessagesValidationError(
      "messages 必须是至少包含一条消息的数组。",
    );
  }
  if (body.messages.length > 1000) {
    throw new AnthropicMessagesValidationError("messages 最多包含 1000 条消息。");
  }

  const seenToolIds = new Set<string>();
  for (const [index, messageValue] of body.messages.entries()) {
    validateMessage(messageValue, index, seenToolIds);
  }

  if (body.system !== undefined) validateSystem(body.system);
  optionalBoolean(body.stream, "stream");
  optionalNumber(body.temperature, "temperature", 0, 1);
  optionalNumber(body.top_p, "top_p", 0, 1);
  optionalInteger(body.top_k, "top_k", 0, 500);

  if (body.stop_sequences !== undefined) {
    if (
      !Array.isArray(body.stop_sequences) ||
      body.stop_sequences.length > 4 ||
      body.stop_sequences.some(
        (item) => typeof item !== "string" || !item || item.length > 1000,
      )
    ) {
      throw new AnthropicMessagesValidationError(
        "stop_sequences 必须是最多 4 项的非空字符串数组。",
      );
    }
  }

  if (body.metadata !== undefined) {
    const metadata = asRecord(body.metadata, "metadata");
    exactKeys(metadata, ["user_id"], "metadata");
    optionalString(metadata.user_id, "metadata.user_id", 256);
  }

  if (body.cache_control !== undefined) {
    validateCacheControl(body.cache_control, "cache_control");
  }
  if (body.thinking !== undefined) {
    validateThinking(body.thinking, maxTokens, body.temperature);
  }
  if (body.tools !== undefined) validateTools(body.tools);
  if (body.tool_choice !== undefined) {
    validateToolChoice(body.tool_choice, body.tools);
  }

  return {
    ...(body as AnthropicMessagesRequestBody),
    model,
    max_tokens: maxTokens,
    messages: body.messages as AnthropicMessagesRequestBody["messages"],
  };
}

function validateMessage(
  value: unknown,
  index: number,
  seenToolIds: Set<string>,
) {
  const path = `messages[${index}]`;
  const message = asRecord(value, path);
  exactKeys(message, ["role", "content"], path);
  if (message.role !== "user" && message.role !== "assistant") {
    throw new AnthropicMessagesValidationError(
      `${path}.role 只支持 user 或 assistant；system 必须使用顶层字段。`,
    );
  }
  validateContent(message.content, message.role, `${path}.content`, seenToolIds);
}

function validateContent(
  value: unknown,
  role: "user" | "assistant",
  path: string,
  seenToolIds: Set<string>,
) {
  if (typeof value === "string") {
    requiredString(value, path, 1_000_000);
    return;
  }
  if (!Array.isArray(value) || value.length === 0 || value.length > 1000) {
    throw new AnthropicMessagesValidationError(
      `${path} 必须是非空字符串或 1 到 1000 个内容块。`,
    );
  }
  for (const [blockIndex, blockValue] of value.entries()) {
    validateBlock(
      blockValue,
      role,
      `${path}[${blockIndex}]`,
      seenToolIds,
    );
  }
}

function validateBlock(
  value: unknown,
  role: "user" | "assistant",
  path: string,
  seenToolIds: Set<string>,
) {
  const block = asRecord(value, path);
  switch (block.type) {
    case "text":
      exactKeys(block, ["type", "text", "cache_control"], path);
      requiredString(block.text, `${path}.text`, 1_000_000);
      optionalCacheControl(block.cache_control, `${path}.cache_control`);
      return;
    case "image":
      exactKeys(block, ["type", "source", "cache_control"], path);
      if (role !== "user") {
        throw new AnthropicMessagesValidationError(
          `${path} 的 image 输入块只能放在 user 消息中。`,
        );
      }
      validateSource(block.source, path, "image");
      optionalCacheControl(block.cache_control, `${path}.cache_control`);
      return;
    case "document":
      exactKeys(
        block,
        ["type", "source", "title", "context", "cache_control"],
        path,
      );
      if (role !== "user") {
        throw new AnthropicMessagesValidationError(
          `${path} 的 document 输入块只能放在 user 消息中。`,
        );
      }
      validateSource(block.source, path, "document");
      optionalString(block.title, `${path}.title`, 500);
      optionalString(block.context, `${path}.context`, 10_000);
      optionalCacheControl(block.cache_control, `${path}.cache_control`);
      return;
    case "thinking":
      exactKeys(block, ["type", "thinking", "signature"], path);
      if (role !== "assistant") {
        throw new AnthropicMessagesValidationError(
          `${path} 的 thinking 块只能原样回传到 assistant 消息。`,
        );
      }
      requiredString(block.thinking, `${path}.thinking`, 1_000_000);
      requiredString(block.signature, `${path}.signature`, 1_000_000);
      return;
    case "redacted_thinking":
      exactKeys(block, ["type", "data"], path);
      if (role !== "assistant") {
        throw new AnthropicMessagesValidationError(
          `${path} 的 redacted_thinking 块只能原样回传到 assistant 消息。`,
        );
      }
      requiredString(block.data, `${path}.data`, 8_000_000);
      return;
    case "tool_use": {
      exactKeys(block, ["type", "id", "name", "input", "cache_control"], path);
      if (role !== "assistant") {
        throw new AnthropicMessagesValidationError(
          `${path} 的 tool_use 块只能放在 assistant 消息中。`,
        );
      }
      const id = requiredString(block.id, `${path}.id`, 256);
      if (!/^[A-Za-z0-9_-]+$/.test(id)) {
        throw new AnthropicMessagesValidationError(`${path}.id 包含不安全字符。`);
      }
      if (seenToolIds.has(id)) {
        throw new AnthropicMessagesValidationError(`tool_use ID ${id} 重复。`);
      }
      requiredString(block.name, `${path}.name`, 128);
      asRecord(block.input, `${path}.input`);
      optionalCacheControl(block.cache_control, `${path}.cache_control`);
      seenToolIds.add(id);
      return;
    }
    case "tool_result": {
      exactKeys(
        block,
        ["type", "tool_use_id", "content", "is_error", "cache_control"],
        path,
      );
      if (role !== "user") {
        throw new AnthropicMessagesValidationError(
          `${path} 的 tool_result 块只能放在 user 消息中。`,
        );
      }
      const toolUseId = requiredString(
        block.tool_use_id,
        `${path}.tool_use_id`,
        256,
      );
      if (!seenToolIds.has(toolUseId)) {
        throw new AnthropicMessagesValidationError(
          `${path}.tool_use_id 必须引用前序 assistant 消息中的 tool_use ID。`,
        );
      }
      validateToolResultContent(block.content, `${path}.content`);
      optionalBoolean(block.is_error, `${path}.is_error`);
      optionalCacheControl(block.cache_control, `${path}.cache_control`);
      return;
    }
    default:
      throw new AnthropicMessagesValidationError(
        `${path}.type 不在方舟可执行核心内容块中。`,
      );
  }
}

function validateToolResultContent(value: unknown, path: string) {
  if (typeof value === "string") {
    optionalString(value, path, 1_000_000);
    return;
  }
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    throw new AnthropicMessagesValidationError(
      `${path} 必须是字符串或 text / image / document 内容块数组。`,
    );
  }
  for (const [index, nestedValue] of value.entries()) {
    const nested = asRecord(nestedValue, `${path}[${index}]`);
    if (nested.type === "text") {
      exactKeys(nested, ["type", "text", "cache_control"], `${path}[${index}]`);
      requiredString(nested.text, `${path}[${index}].text`, 1_000_000);
      optionalCacheControl(
        nested.cache_control,
        `${path}[${index}].cache_control`,
      );
    } else if (nested.type === "image" || nested.type === "document") {
      exactKeys(
        nested,
        ["type", "source", "title", "context", "cache_control"],
        `${path}[${index}]`,
      );
      validateSource(
        nested.source,
        `${path}[${index}]`,
        nested.type,
      );
      optionalCacheControl(
        nested.cache_control,
        `${path}[${index}].cache_control`,
      );
    } else {
      throw new AnthropicMessagesValidationError(
        `${path}[${index}].type 只支持 text、image 或 document。`,
      );
    }
  }
}

function validateSystem(value: unknown) {
  if (typeof value === "string") {
    requiredString(value, "system", 1_000_000);
    return;
  }
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    throw new AnthropicMessagesValidationError(
      "system 必须是非空字符串或 text 内容块数组。",
    );
  }
  value.forEach((item, index) => {
    const block = asRecord(item, `system[${index}]`);
    exactKeys(block, ["type", "text", "cache_control"], `system[${index}]`);
    if (block.type !== "text") {
      throw new AnthropicMessagesValidationError(
        `system[${index}].type 只支持 text。`,
      );
    }
    requiredString(block.text, `system[${index}].text`, 1_000_000);
    optionalCacheControl(
      block.cache_control,
      `system[${index}].cache_control`,
    );
  });
}

function validateSource(
  value: unknown,
  path: string,
  kind: "image" | "document",
) {
  const source = asRecord(value, `${path}.source`);
  if (source.type === "url") {
    exactKeys(source, ["type", "url"], `${path}.source`);
    const url = requiredString(source.url, `${path}.source.url`, 4096);
    assertHttpsUrl(url, `${path}.source.url`);
    return;
  }
  if (source.type === "base64") {
    exactKeys(source, ["type", "media_type", "data"], `${path}.source`);
    const mediaType = requiredString(
      source.media_type,
      `${path}.source.media_type`,
      128,
    );
    const allowed = kind === "image" ? IMAGE_MEDIA_TYPES : DOCUMENT_MEDIA_TYPES;
    if (!allowed.has(mediaType)) {
      throw new AnthropicMessagesValidationError(
        `${path}.source.media_type 不是支持的 ${kind} Base64 类型。`,
      );
    }
    const data = requiredString(source.data, `${path}.source.data`, 25_000_000);
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data) || data.length % 4 !== 0) {
      throw new AnthropicMessagesValidationError(
        `${path}.source.data 必须是不含 data URL 前缀的合法 Base64。`,
      );
    }
    return;
  }
  throw new AnthropicMessagesValidationError(
    `${path}.source.type 只支持 url 或 base64。`,
  );
}

function validateThinking(
  value: unknown,
  maxTokens: number,
  temperature: unknown,
) {
  const thinking = asRecord(value, "thinking");
  if (thinking.type === "enabled") {
    exactKeys(thinking, ["type", "budget_tokens"], "thinking");
    const budget = requiredInteger(
      thinking.budget_tokens,
      "thinking.budget_tokens",
      1024,
      131_071,
    );
    if (budget >= maxTokens) {
      throw new AnthropicMessagesValidationError(
        "thinking.budget_tokens 必须小于 max_tokens。",
      );
    }
    if (temperature !== undefined && temperature !== 1) {
      throw new AnthropicMessagesValidationError(
        "开启 thinking 时 temperature 如需传入只能设置为 1。",
      );
    }
    return;
  }
  if (thinking.type === "adaptive" || thinking.type === "disabled") {
    exactKeys(thinking, ["type"], "thinking");
    return;
  }
  throw new AnthropicMessagesValidationError(
    "thinking.type 只支持 enabled、adaptive 或 disabled。",
  );
}

function validateTools(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 64) {
    throw new AnthropicMessagesValidationError("tools 必须是 1 到 64 项的数组。");
  }
  const names = new Set<string>();
  value.forEach((item, index) => {
    const path = `tools[${index}]`;
    const tool = asRecord(item, path);
    exactKeys(
      tool,
      ["name", "description", "input_schema", "cache_control"],
      path,
    );
    const name = requiredString(tool.name, `${path}.name`, 128);
    if (!/^[A-Za-z0-9_-]+$/.test(name)) {
      throw new AnthropicMessagesValidationError(`${path}.name 包含不安全字符。`);
    }
    if (names.has(name)) {
      throw new AnthropicMessagesValidationError(`工具名称 ${name} 重复。`);
    }
    names.add(name);
    optionalString(tool.description, `${path}.description`, 10_000);
    const schema = asRecord(tool.input_schema, `${path}.input_schema`);
    if (schema.type !== "object") {
      throw new AnthropicMessagesValidationError(
        `${path}.input_schema.type 必须是 object。`,
      );
    }
    optionalCacheControl(tool.cache_control, `${path}.cache_control`);
  });
}

function validateToolChoice(value: unknown, tools: unknown) {
  const choice = asRecord(value, "tool_choice");
  if (!["auto", "any", "tool", "none"].includes(String(choice.type))) {
    throw new AnthropicMessagesValidationError(
      "tool_choice.type 只支持 auto、any、tool 或 none。",
    );
  }
  const allowed =
    choice.type === "tool"
      ? ["type", "name", "disable_parallel_tool_use"]
      : ["type", "disable_parallel_tool_use"];
  exactKeys(choice, allowed, "tool_choice");
  optionalBoolean(
    choice.disable_parallel_tool_use,
    "tool_choice.disable_parallel_tool_use",
  );
  if (choice.type === "tool") {
    const name = requiredString(choice.name, "tool_choice.name", 128);
    const toolNames = Array.isArray(tools)
      ? tools.map((item) => asRecord(item, "tool").name)
      : [];
    if (!toolNames.includes(name)) {
      throw new AnthropicMessagesValidationError(
        "tool_choice.name 必须引用 tools 中已定义的工具。",
      );
    }
  }
  if (!Array.isArray(tools) || tools.length === 0) {
    throw new AnthropicMessagesValidationError(
      "设置 tool_choice 时必须同时提供 tools。",
    );
  }
}

function optionalCacheControl(value: unknown, path: string) {
  if (value !== undefined) validateCacheControl(value, path);
}

function validateCacheControl(value: unknown, path: string) {
  const cacheControl = asRecord(value, path);
  exactKeys(cacheControl, ["type", "ttl"], path);
  if (cacheControl.type !== "ephemeral") {
    throw new AnthropicMessagesValidationError(`${path}.type 只支持 ephemeral。`);
  }
  if (
    cacheControl.ttl !== undefined &&
    cacheControl.ttl !== "5m" &&
    cacheControl.ttl !== "1h"
  ) {
    throw new AnthropicMessagesValidationError(`${path}.ttl 只支持 5m 或 1h。`);
  }
}

function assertJsonShape(value: unknown) {
  let nodes = 0;
  const visit = (current: unknown, depth: number) => {
    nodes += 1;
    if (nodes > 20_000) {
      throw new AnthropicMessagesValidationError("Request Body 结构过大。");
    }
    if (depth > 24) {
      throw new AnthropicMessagesValidationError(
        "Request Body 嵌套层级不能超过 24。",
      );
    }
    if (typeof current === "string" && current.length > 25_000_000) {
      throw new AnthropicMessagesValidationError(
        "单个字符串字段不能超过 25 MB。",
      );
    }
    if (Array.isArray(current)) {
      current.forEach((item) => visit(item, depth + 1));
    } else if (isRecord(current)) {
      for (const [key, nested] of Object.entries(current)) {
        if (key === "__proto__" || key === "prototype" || key === "constructor") {
          throw new AnthropicMessagesValidationError(
            "Request Body 包含不安全的对象键。",
          );
        }
        visit(nested, depth + 1);
      }
    } else if (
      current !== null &&
      typeof current !== "string" &&
      typeof current !== "number" &&
      typeof current !== "boolean"
    ) {
      throw new AnthropicMessagesValidationError("Request Body 必须是合法 JSON。");
    }
  };
  visit(value, 0);
}

export function redactAnthropicMessagesStream(
  stream: ReadableStream<Uint8Array>,
  secret: string,
) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let pending = "";
  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        pending += decoder.decode(chunk, { stream: true });
        let boundary = nextSseBoundary(pending);
        while (boundary) {
          const frame = pending.slice(0, boundary.end);
          pending = pending.slice(boundary.end);
          controller.enqueue(
            encoder.encode(sanitizeSseFrame(frame, secret)),
          );
          boundary = nextSseBoundary(pending);
        }
        if (pending.length > 30_000_000) {
          throw new Error("上游 SSE 单个事件超过安全上限。");
        }
      },
      flush(controller) {
        pending += decoder.decode();
        if (pending) {
          controller.enqueue(
            encoder.encode(sanitizeSseFrame(pending, secret)),
          );
        }
      },
    }),
  );
}

function nextSseBoundary(value: string): { end: number } | null {
  const unix = value.indexOf("\n\n");
  const windows = value.indexOf("\r\n\r\n");
  if (unix === -1 && windows === -1) return null;
  if (windows !== -1 && (unix === -1 || windows < unix)) {
    return { end: windows + 4 };
  }
  return { end: unix + 2 };
}

function sanitizeSseFrame(frame: string, secret: string) {
  const lineEnding = frame.includes("\r\n") ? "\r\n" : "\n";
  return frame
    .split(/\r?\n/)
    .map((line) => {
      if (!line.startsWith("data:")) {
        return redactAnthropicMessagesText(line, secret);
      }
      const prefix = line.startsWith("data: ") ? "data: " : "data:";
      const data = line.slice(prefix.length);
      if (!data || data === "[DONE]") return `${prefix}${data}`;
      try {
        const sanitized = JSON.stringify(redactValue(JSON.parse(data))).replaceAll(
          secret,
          "[REDACTED]",
        );
        return `${prefix}${sanitized}`;
      } catch {
        return `${prefix}${data.replaceAll(secret, "[REDACTED]")}`;
      }
    })
    .join(lineEnding);
}

export function redactAnthropicMessagesText(value: string, secret: string) {
  let safe = value.replaceAll(secret, "[REDACTED]");
  try {
    safe = JSON.stringify(redactValue(JSON.parse(safe)));
  } catch {
    // Plain-text upstream errors are sanitized by direct secret replacement.
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

function assertHttpsUrl(value: string, label: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new AnthropicMessagesValidationError(`${label} 必须是合法 URL。`);
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new AnthropicMessagesValidationError(
      `${label} 只支持不含内嵌凭证的 HTTPS URL。`,
    );
  }
  if (isPrivateHostname(parsed.hostname)) {
    throw new AnthropicMessagesValidationError(
      `${label} 必须使用公网 HTTPS 主机，不能指向本机或私有网络。`,
    );
  }
}

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host.startsWith("::ffff:")) {
    return isPrivateHostname(host.slice("::ffff:".length));
  }
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    (host.includes(":") &&
      (host === "::" ||
        host === "::1" ||
        host.startsWith("fc") ||
        host.startsWith("fd") ||
        /^fe[89ab]/.test(host)))
  ) {
    return true;
  }
  const octets = host.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)
  ) {
    return false;
  }
  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    first >= 224
  );
}

function exactKeys(
  value: Record<string, unknown>,
  fields: string[],
  label: string,
) {
  const allowed = new Set(fields);
  const unknown = Object.keys(value).filter((field) => !allowed.has(field));
  if (unknown.length > 0) {
    throw new AnthropicMessagesValidationError(
      `${label} 包含未支持字段：${unknown.join("、")}。`,
    );
  }
}

function requiredString(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new AnthropicMessagesValidationError(
      `${label} 必须是 1 到 ${maxLength} 个字符的字符串。`,
    );
  }
  return value.trim();
}

function optionalString(value: unknown, label: string, maxLength: number) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new AnthropicMessagesValidationError(
      `${label} 必须是不超过 ${maxLength} 个字符的字符串。`,
    );
  }
  return value;
}

function requiredInteger(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
) {
  if (!Number.isInteger(value) || Number(value) < minimum || Number(value) > maximum) {
    throw new AnthropicMessagesValidationError(
      `${label} 必须是 ${minimum} 到 ${maximum} 的整数。`,
    );
  }
  return Number(value);
}

function optionalInteger(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
) {
  if (value === undefined) return undefined;
  return requiredInteger(value, label, minimum, maximum);
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
    throw new AnthropicMessagesValidationError(
      `${label} 必须是 ${minimum} 到 ${maximum} 的数字。`,
    );
  }
  return value;
}

function optionalBoolean(value: unknown, label: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new AnthropicMessagesValidationError(`${label} 必须是布尔值。`);
  }
  return value;
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new AnthropicMessagesValidationError(`${label} 必须是 JSON 对象。`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
