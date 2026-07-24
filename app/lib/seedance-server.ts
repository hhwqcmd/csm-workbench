import {
  API_PATHS,
  isAllowedModel,
  isApiPath,
  RATIOS,
  type ApiPath,
} from "./seedance-config";

type Connection = {
  apiPath: ApiPath;
  baseUrl: string;
  model: string;
  apiKey: string;
};

export type CreateTaskInput = Connection & {
  prompt: string;
  imageUrl: string;
  videoUrl: string;
  ratio: (typeof RATIOS)[number];
  duration: number;
  generateAudio: boolean;
  watermark: boolean;
};

export type GetTaskInput = Connection & {
  taskId: string;
};

export class RequestValidationError extends Error {}

export function parseCreateTaskInput(value: unknown): CreateTaskInput {
  const body = asRecord(value);
  const connection = parseConnection(body);
  const prompt = requiredString(body.prompt, "提示词", 2_000);
  const imageUrl = publicHttpsUrl(body.imageUrl, "参考图片 URL");
  const videoUrl = publicHttpsUrl(body.videoUrl, "参考视频 URL");
  const ratio = requiredString(body.ratio, "宽高比", 8);
  const duration = body.duration;

  if (!RATIOS.includes(ratio as (typeof RATIOS)[number])) {
    throw new RequestValidationError("宽高比不在当前 Seedance 2.0 支持范围内。");
  }
  if (
    typeof duration !== "number" ||
    !Number.isInteger(duration) ||
    duration < 4 ||
    duration > 15
  ) {
    throw new RequestValidationError("视频时长必须是 4 到 15 秒的整数。");
  }
  if (typeof body.generateAudio !== "boolean") {
    throw new RequestValidationError("有声视频选项格式不正确。");
  }
  if (typeof body.watermark !== "boolean") {
    throw new RequestValidationError("水印选项格式不正确。");
  }

  return {
    ...connection,
    prompt,
    imageUrl,
    videoUrl,
    ratio: ratio as (typeof RATIOS)[number],
    duration,
    generateAudio: body.generateAudio,
    watermark: body.watermark,
  };
}

export function parseGetTaskInput(value: unknown): GetTaskInput {
  const body = asRecord(value);
  const connection = parseConnection(body);
  const taskId = requiredString(body.taskId, "任务 ID", 256);

  if (!/^[A-Za-z0-9._:-]+$/.test(taskId)) {
    throw new RequestValidationError("任务 ID 格式不正确。");
  }

  return { ...connection, taskId };
}

export async function createSeedanceTask(input: CreateTaskInput) {
  const response = await fetch(
    `${input.baseUrl}/contents/generations/tasks`,
    {
      method: "POST",
      headers: upstreamHeaders(input.apiKey),
      body: JSON.stringify({
        model: input.model,
        content: [
          {
            type: "text",
            text: input.prompt,
          },
          {
            type: "image_url",
            image_url: { url: input.imageUrl },
            role: "reference_image",
          },
          {
            type: "video_url",
            video_url: { url: input.videoUrl },
            role: "reference_video",
          },
        ],
        generate_audio: input.generateAudio,
        ratio: input.ratio,
        duration: input.duration,
        watermark: input.watermark,
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  const payload = await readJson(response);
  if (!response.ok) {
    throw upstreamFailure(response.status, payload, input.apiKey);
  }

  const taskId = stringAt(payload, "id");
  if (!taskId) {
    throw new Error("火山方舟已响应，但未返回任务 ID。");
  }

  return {
    id: taskId,
    status: stringAt(payload, "status") ?? "queued",
  };
}

export async function getSeedanceTask(input: GetTaskInput) {
  const response = await fetch(
    `${input.baseUrl}/contents/generations/tasks/${encodeURIComponent(input.taskId)}`,
    {
      method: "GET",
      headers: upstreamHeaders(input.apiKey),
      signal: AbortSignal.timeout(30_000),
    },
  );

  const payload = await readJson(response);
  if (!response.ok) {
    throw upstreamFailure(response.status, payload, input.apiKey);
  }

  const status = stringAt(payload, "status") ?? "running";
  const content = asOptionalRecord(payload.content);
  const error = asOptionalRecord(payload.error);

  return {
    id: stringAt(payload, "id") ?? input.taskId,
    status,
    videoUrl: content ? stringAt(content, "video_url") : undefined,
    error:
      status === "failed"
        ? safeError(
            (error && stringAt(error, "message")) ??
              (error && stringAt(error, "code")) ??
              "任务执行失败。",
            input.apiKey,
          )
        : undefined,
  };
}

function parseConnection(body: Record<string, unknown>): Connection {
  const apiPathValue = body.apiPath;
  if (!isApiPath(apiPathValue)) {
    throw new RequestValidationError("API 路径不正确。");
  }

  const apiPath = apiPathValue;
  const baseUrl = requiredString(body.baseUrl, "Base URL", 200).replace(/\/$/, "");
  const model = requiredString(body.model, "模型", 120);
  const apiKey = requiredString(body.apiKey, "API Key", 512);

  if (baseUrl !== API_PATHS[apiPath].baseUrl) {
    throw new RequestValidationError(
      `${API_PATHS[apiPath].label} 必须使用 ${API_PATHS[apiPath].baseUrl}。`,
    );
  }
  if (!isAllowedModel(apiPath, model)) {
    throw new RequestValidationError("模型与当前 API 路径不匹配。");
  }
  if (/\s/.test(apiKey)) {
    throw new RequestValidationError("API Key 不能包含空白字符。");
  }

  return { apiPath, baseUrl, model, apiKey };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("请求格式不正确。");
  }
  return value as Record<string, unknown>;
}

function asOptionalRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new RequestValidationError(`${label}不能为空。`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new RequestValidationError(`${label}长度超过限制。`);
  }
  return trimmed;
}

function publicHttpsUrl(value: unknown, label: string): string {
  const raw = requiredString(value, label, 2_000);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new RequestValidationError(`${label}不是有效 URL。`);
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new RequestValidationError(`${label}必须是无账号信息的公网 HTTPS URL。`);
  }
  if (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1" ||
    url.hostname.endsWith(".local")
  ) {
    throw new RequestValidationError(`${label}必须可由火山方舟公网访问。`);
  }
  return url.href;
}

function upstreamHeaders(apiKey: string): HeadersInit {
  return {
    authorization: `Bearer ${apiKey}`,
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

function stringAt(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  return typeof value[key] === "string" ? value[key] : undefined;
}

function upstreamFailure(
  status: number,
  payload: Record<string, unknown>,
  apiKey: string,
): Error {
  const nestedError = asOptionalRecord(payload.error);
  const code =
    (nestedError && stringAt(nestedError, "code")) ?? stringAt(payload, "code");
  const message =
    (nestedError && stringAt(nestedError, "message")) ??
    stringAt(payload, "message");
  const detail = [code, message].filter(Boolean).join(" · ");
  return new Error(
    safeError(
      detail
        ? `火山方舟请求失败（HTTP ${status}）：${detail}`
        : `火山方舟请求失败（HTTP ${status}）。`,
      apiKey,
    ),
  );
}

function safeError(message: string, apiKey: string): string {
  return message.replaceAll(apiKey, "[REDACTED]").slice(0, 600);
}
