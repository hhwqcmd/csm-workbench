import "server-only";

// Dedicated Pelican Test proxy for Responses-style creates.
// The shared /api/responses proxy keeps its fixed upstream base URL locked by
// contract (browser requests there must not carry a baseUrl); the Pelican
// panel is the only module allowed to fill the Base URL manually, so it gets
// its own narrow route: create-only, store/stream forced false, no retrieve,
// no delete, no tools.

export class PelicanResponsesValidationError extends Error {}

export type PelicanResponsesInput = {
  apiKey: string;
  baseUrl: string;
  requestBody: {
    model: string;
    input: string | Array<Record<string, unknown>>;
    max_output_tokens: number;
    store: false;
    stream: false;
    text?: { format: Record<string, unknown> };
  };
};

const REQUEST_BODY_FIELDS = new Set([
  "model",
  "input",
  "max_output_tokens",
  "store",
  "stream",
  "text",
]);

const MAX_BASE_URL_LENGTH = 2048;

export function parsePelicanResponsesInput(
  value: unknown,
): PelicanResponsesInput {
  const input = asRecord(value, "请求");
  const apiKey = requiredString(input.apiKey, "API Key", 4096);
  const baseUrl = parseBaseUrl(input.baseUrl);
  return { apiKey, baseUrl, requestBody: parseRequestBody(input.requestBody) };
}

// Manual Base URL: http/https only (local gateways may use http), no embedded
// credentials, no query or fragment, trailing slash normalized away.
function parseBaseUrl(value: unknown): string {
  const raw = requiredString(value, "Base URL", MAX_BASE_URL_LENGTH);
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new PelicanResponsesValidationError("Base URL 必须是合法 URL。");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new PelicanResponsesValidationError(
      "Base URL 只支持 HTTPS 或 HTTP（本地网关）地址。",
    );
  }
  if (parsed.username || parsed.password) {
    throw new PelicanResponsesValidationError(
      "Base URL 不得内嵌用户名或密码等凭证。",
    );
  }
  if (parsed.search || parsed.hash) {
    throw new PelicanResponsesValidationError(
      "Base URL 不得包含查询参数或锚点。",
    );
  }
  return raw.replace(/\/+$/, "");
}

function parseRequestBody(
  value: unknown,
): PelicanResponsesInput["requestBody"] {
  const body = asRecord(value, "requestBody");
  const unknownFields = Object.keys(body).filter(
    (field) => !REQUEST_BODY_FIELDS.has(field),
  );
  if (unknownFields.length > 0) {
    throw new PelicanResponsesValidationError(
      `requestBody 包含未开放字段：${unknownFields.join("、")}。`,
    );
  }
  assertJsonShape(body);

  const model = requiredString(body.model, "model", 200);
  if (body.store !== false || body.stream !== false) {
    throw new PelicanResponsesValidationError(
      "鹈鹕测试固定 store:false 与 stream:false。",
    );
  }
  const maxOutputTokens = body.max_output_tokens;
  if (
    typeof maxOutputTokens !== "number" ||
    !Number.isInteger(maxOutputTokens) ||
    maxOutputTokens < 1 ||
    maxOutputTokens > 131_072
  ) {
    throw new PelicanResponsesValidationError(
      "max_output_tokens 必须是 1 到 131072 的整数。",
    );
  }

  let input: string | Array<Record<string, unknown>>;
  if (typeof body.input === "string") {
    if (!body.input.trim()) {
      throw new PelicanResponsesValidationError("input 字符串不能为空。");
    }
    input = body.input;
  } else if (Array.isArray(body.input)) {
    if (body.input.length === 0 || body.input.length > 10) {
      throw new PelicanResponsesValidationError(
        "input 数组必须包含 1 到 10 个 InputItem。",
      );
    }
    for (const item of body.input) {
      if (!isRecord(item)) {
        throw new PelicanResponsesValidationError(
          "input 数组项必须是 JSON 对象。",
        );
      }
    }
    validateInputUrls(body.input);
    input = body.input as Array<Record<string, unknown>>;
  } else {
    throw new PelicanResponsesValidationError(
      "input 必须是字符串或 InputItem 数组。",
    );
  }

  let text: { format: Record<string, unknown> } | undefined;
  if (body.text !== undefined) {
    const textRecord = asRecord(body.text, "text");
    exactKeys(textRecord, ["format"], "text");
    const format = asRecord(textRecord.format, "text.format");
    exactKeys(
      format,
      ["type", "name", "description", "schema", "strict"],
      "text.format",
    );
    if (format.type !== "json_schema") {
      throw new PelicanResponsesValidationError(
        "鹈鹕测试裁判只支持 text.format.type=json_schema。",
      );
    }
    if (
      typeof format.name !== "string" ||
      !format.name.trim() ||
      !isRecord(format.schema)
    ) {
      throw new PelicanResponsesValidationError(
        "json_schema 模式必须填写 name 和 schema 对象。",
      );
    }
    text = { format };
  }

  return {
    model,
    input,
    max_output_tokens: maxOutputTokens,
    store: false,
    stream: false,
    ...(text ? { text } : {}),
  };
}

// The vision judge embeds a browser-local PNG data URL; anything else must be
// a public HTTPS URL, mirroring the shared proxy's rule.
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
        throw new PelicanResponsesValidationError(
          `${path} 只支持公网 HTTPS URL 或受控 Base64 data URL。`,
        );
      }
    }
  });
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

function assertJsonShape(value: unknown) {
  let nodes = 0;
  const visit = (current: unknown, depth: number) => {
    nodes += 1;
    if (nodes > 20_000) {
      throw new PelicanResponsesValidationError("requestBody 结构过大。");
    }
    if (depth > 24) {
      throw new PelicanResponsesValidationError(
        "requestBody 嵌套层级不能超过 24。",
      );
    }
    if (typeof current === "string" && current.length > 1_000_000) {
      throw new PelicanResponsesValidationError("单个字符串字段不能超过 1 MB。");
    }
    if (Array.isArray(current)) {
      current.forEach((item) => visit(item, depth + 1));
    } else if (isRecord(current)) {
      for (const [key, nested] of Object.entries(current)) {
        if (
          key === "__proto__" ||
          key === "prototype" ||
          key === "constructor"
        ) {
          throw new PelicanResponsesValidationError(
            "requestBody 包含不安全的对象键。",
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
      throw new PelicanResponsesValidationError("requestBody 必须是合法 JSON。");
    }
  };
  visit(value, 0);
}

export async function proxyPelicanResponses(
  input: PelicanResponsesInput,
): Promise<Response> {
  const upstream = await fetch(`${input.baseUrl}/responses`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input.requestBody),
    // Reasoning models can spend minutes on chain-of-thought before the
    // visible output; generation and judging share the same headroom.
    signal: AbortSignal.timeout(600_000),
  });

  const rawText = await upstream.text();
  return new Response(
    redactText(rawText, input.apiKey) ||
      (upstream.status === 204 ? null : "{}"),
    {
      status: upstream.status,
      headers: {
        "cache-control": "no-store",
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
}

function redactText(value: string, secret: string): string {
  return value.replaceAll(secret, "[REDACTED]");
}

function exactKeys(
  value: Record<string, unknown>,
  fields: string[],
  label: string,
) {
  const allowed = new Set(fields);
  const unknown = Object.keys(value).filter((field) => !allowed.has(field));
  if (unknown.length > 0) {
    throw new PelicanResponsesValidationError(
      `${label} 包含未开放字段：${unknown.join("、")}。`,
    );
  }
}

function requiredString(value: unknown, label: string, maxLength: number) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > maxLength
  ) {
    throw new PelicanResponsesValidationError(
      `${label} 必须是 1 到 ${maxLength} 个字符的字符串。`,
    );
  }
  return value.trim();
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new PelicanResponsesValidationError(`${label} 必须是 JSON 对象。`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
