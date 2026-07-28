export const MANAGED_AGENTS_BASE_URL =
  "https://ark.cn-beijing.volces.com/api/v3";

export class ManagedAgentsValidationError extends Error {}

type ManagedConnection = {
  baseUrl: string;
  apiKey: string;
};

export type CreateManagedAgentInput = ManagedConnection & {
  requestBody: {
    name: string;
    model: { id: string };
    system: string;
    tools: Array<{ type: "agent_toolset_20260701" }>;
  };
};

export type CreateManagedEnvironmentInput = ManagedConnection & {
  requestBody: {
    name: string;
    config: {
      type: "cloud";
      networking: { type: "unrestricted" };
    };
  };
};

export type CreateManagedSessionInput = ManagedConnection & {
  requestBody: {
    agent: string;
    environment_id: string;
    title: string;
  };
};

export type SendManagedMessageInput = ManagedConnection & {
  sessionId: string;
  requestBody: {
    events: Array<{
      type: "user.message";
      content: Array<{ type: "text"; text: string }>;
    }>;
  };
};

export function parseCreateManagedAgentInput(
  value: unknown,
): CreateManagedAgentInput {
  const body = asRecord(value);
  const connection = parseConnection(body);
  const requestBody = exactRecord(body.requestBody, [
    "name",
    "model",
    "system",
    "tools",
  ]);
  const model = exactRecord(requestBody.model, ["id"]);
  const tools = requestBody.tools;

  if (
    !Array.isArray(tools) ||
    tools.length !== 1 ||
    !isExactTool(tools[0])
  ) {
    throw new ManagedAgentsValidationError(
      'tools 必须为 [{"type":"agent_toolset_20260701"}]。',
    );
  }

  return {
    ...connection,
    requestBody: {
      name: requiredString(requestBody.name, "Agent 名称", 120),
      model: {
        id: requiredString(model.id, "模型 ID", 160),
      },
      system: requiredString(requestBody.system, "系统提示词", 12_000),
      tools: [{ type: "agent_toolset_20260701" }],
    },
  };
}

export function parseCreateManagedEnvironmentInput(
  value: unknown,
): CreateManagedEnvironmentInput {
  const body = asRecord(value);
  const connection = parseConnection(body);
  const requestBody = exactRecord(body.requestBody, ["name", "config"]);
  const config = exactRecord(requestBody.config, ["type", "networking"]);
  const networking = exactRecord(config.networking, ["type"]);

  if (config.type !== "cloud") {
    throw new ManagedAgentsValidationError(
      '快速入门环境的 config.type 必须为 "cloud"。',
    );
  }
  if (networking.type !== "unrestricted") {
    throw new ManagedAgentsValidationError(
      '快速入门环境的 networking.type 必须为 "unrestricted"。',
    );
  }

  return {
    ...connection,
    requestBody: {
      name: requiredString(requestBody.name, "环境名称", 120),
      config: {
        type: "cloud",
        networking: { type: "unrestricted" },
      },
    },
  };
}

export function parseCreateManagedSessionInput(
  value: unknown,
): CreateManagedSessionInput {
  const body = asRecord(value);
  const connection = parseConnection(body);
  const requestBody = exactRecord(body.requestBody, [
    "agent",
    "environment_id",
    "title",
  ]);

  return {
    ...connection,
    requestBody: {
      agent: resourceId(requestBody.agent, "Agent ID"),
      environment_id: resourceId(
        requestBody.environment_id,
        "Environment ID",
      ),
      title: requiredString(requestBody.title, "会话标题", 200),
    },
  };
}

export function parseSendManagedMessageInput(
  value: unknown,
): SendManagedMessageInput {
  const body = asRecord(value);
  const connection = parseConnection(body);
  const sessionId = resourceId(body.sessionId, "Session ID");
  const requestBody = exactRecord(body.requestBody, ["events"]);

  if (!Array.isArray(requestBody.events) || requestBody.events.length !== 1) {
    throw new ManagedAgentsValidationError("events 必须且只能包含一条用户消息。");
  }

  const event = exactRecord(requestBody.events[0], ["type", "content"]);
  if (event.type !== "user.message") {
    throw new ManagedAgentsValidationError(
      '事件 type 必须为 "user.message"。',
    );
  }
  if (!Array.isArray(event.content) || event.content.length !== 1) {
    throw new ManagedAgentsValidationError(
      "消息 content 必须且只能包含一条文本。",
    );
  }
  const content = exactRecord(event.content[0], ["type", "text"]);
  if (content.type !== "text") {
    throw new ManagedAgentsValidationError('消息内容 type 必须为 "text"。');
  }

  return {
    ...connection,
    sessionId,
    requestBody: {
      events: [
        {
          type: "user.message",
          content: [
            {
              type: "text",
              text: requiredString(content.text, "用户消息", 20_000),
            },
          ],
        },
      ],
    },
  };
}

export async function createManagedAgent(input: CreateManagedAgentInput) {
  return postJson(input, "/agents", input.requestBody);
}

export async function createManagedEnvironment(
  input: CreateManagedEnvironmentInput,
) {
  return postJson(input, "/environments", input.requestBody);
}

export async function createManagedSession(input: CreateManagedSessionInput) {
  return postJson(input, "/sessions", input.requestBody);
}

export async function sendManagedMessageAndOpenStream(
  input: SendManagedMessageInput,
): Promise<Response> {
  const eventsPath = `/sessions/${encodeURIComponent(input.sessionId)}/events`;
  const sendResponse = await fetch(`${input.baseUrl}${eventsPath}`, {
    method: "POST",
    headers: upstreamHeaders(input.apiKey),
    body: JSON.stringify(input.requestBody),
    signal: AbortSignal.timeout(30_000),
  });

  if (!sendResponse.ok) {
    const payload = await readPayload(sendResponse);
    throw upstreamFailure(sendResponse.status, payload, input.apiKey);
  }

  const streamResponse = await fetch(
    `${input.baseUrl}${eventsPath}/stream`,
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${input.apiKey}`,
        accept: "text/event-stream",
      },
      signal: AbortSignal.timeout(10 * 60_000),
    },
  );

  if (!streamResponse.ok || !streamResponse.body) {
    const payload = await readPayload(streamResponse);
    throw upstreamFailure(streamResponse.status, payload, input.apiKey);
  }

  return new Response(streamResponse.body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-store",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

async function postJson(
  input: ManagedConnection,
  path: string,
  requestBody: unknown,
) {
  const response = await fetch(`${input.baseUrl}${path}`, {
    method: "POST",
    headers: upstreamHeaders(input.apiKey),
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await readPayload(response);

  if (!response.ok) {
    throw upstreamFailure(response.status, payload, input.apiKey);
  }

  const record = asOptionalRecord(payload);
  if (!record || typeof record.id !== "string" || !record.id.trim()) {
    throw new Error("火山方舟已响应，但未返回资源 ID。");
  }

  return payload;
}

function parseConnection(body: Record<string, unknown>): ManagedConnection {
  const baseUrl = requiredString(body.baseUrl, "Base URL", 240).replace(
    /\/$/,
    "",
  );
  const apiKey = requiredString(body.apiKey, "API Key", 512);

  if (baseUrl !== MANAGED_AGENTS_BASE_URL) {
    throw new ManagedAgentsValidationError(
      `Managed Agents 必须使用 ${MANAGED_AGENTS_BASE_URL}。`,
    );
  }
  if (/\s/.test(apiKey)) {
    throw new ManagedAgentsValidationError("API Key 不能包含空白字符。");
  }

  return { baseUrl, apiKey };
}

function resourceId(value: unknown, label: string): string {
  const id = requiredString(value, label, 256);
  if (!/^[A-Za-z0-9._:-]+$/.test(id)) {
    throw new ManagedAgentsValidationError(`${label} 格式不正确。`);
  }
  return id;
}

function exactRecord(value: unknown, keys: string[]): Record<string, unknown> {
  const record = asRecord(value);
  const allowed = new Set(keys);
  const unsupportedKey = Object.keys(record).find((key) => !allowed.has(key));
  if (unsupportedKey) {
    throw new ManagedAgentsValidationError(
      `Request Body 包含未开放转发的字段：${unsupportedKey}。`,
    );
  }
  return record;
}

function isExactTool(value: unknown): boolean {
  const tool = asOptionalRecord(value);
  return (
    Boolean(tool) &&
    Object.keys(tool ?? {}).length === 1 &&
    tool?.type === "agent_toolset_20260701"
  );
}

function requiredString(
  value: unknown,
  label: string,
  maxLength: number,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ManagedAgentsValidationError(`${label} 不能为空。`);
  }
  if (value.length > maxLength) {
    throw new ManagedAgentsValidationError(
      `${label} 不能超过 ${maxLength} 个字符。`,
    );
  }
  return value.trim();
}

function asRecord(value: unknown): Record<string, unknown> {
  const record = asOptionalRecord(value);
  if (!record) {
    throw new ManagedAgentsValidationError("请求体必须是 JSON 对象。");
  }
  return record;
}

function asOptionalRecord(
  value: unknown,
): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function upstreamHeaders(apiKey: string): HeadersInit {
  return {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  };
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 2_000) };
  }
}

function upstreamFailure(
  status: number,
  payload: unknown,
  apiKey: string,
): Error {
  const record = asOptionalRecord(payload);
  const nestedError = asOptionalRecord(record?.error);
  const message =
    stringValue(nestedError?.message) ??
    stringValue(nestedError?.code) ??
    stringValue(record?.message) ??
    stringValue(record?.error) ??
    `火山方舟返回 HTTP ${status}。`;
  return new Error(safeError(message, apiKey));
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function safeError(message: string, apiKey: string): string {
  return message.replaceAll(apiKey, "[REDACTED]").slice(0, 1_000);
}
