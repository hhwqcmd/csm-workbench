import {
  API_PATHS,
  isAllowedModel,
  isApiPath,
  RATIOS,
  type ApiPath,
} from "./seedance-config";
import type {
  SeedanceContentItem,
  SeedanceRequestBody,
} from "./seedance-examples";

type Connection = {
  apiPath: ApiPath;
  baseUrl: string;
  model: string;
  apiKey: string;
};

export type CreateTaskInput = Connection & {
  requestBody: SeedanceRequestBody;
};

export type GetTaskInput = Connection & {
  taskId: string;
};

export class RequestValidationError extends Error {}

export function parseCreateTaskInput(value: unknown): CreateTaskInput {
  const body = asRecord(value);
  const connection = parseConnection(body);
  return {
    ...connection,
    requestBody: parseRequestBody(body.requestBody, connection.model),
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
      body: JSON.stringify(input.requestBody),
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
    lastFrameUrl: content ? stringAt(content, "last_frame_url") : undefined,
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

function parseRequestBody(
  value: unknown,
  selectedModel: string,
): SeedanceRequestBody {
  const body = asRecord(value);
  const allowedKeys = new Set([
    "model",
    "content",
    "generate_audio",
    "resolution",
    "ratio",
    "duration",
    "watermark",
    "return_last_frame",
    "tools",
  ]);
  const unsupportedKey = Object.keys(body).find((key) => !allowedKeys.has(key));
  if (unsupportedKey) {
    throw new RequestValidationError(
      `Request Body 包含未开放转发的字段：${unsupportedKey}。`,
    );
  }

  const model = requiredString(body.model, "model", 120);
  if (model !== selectedModel) {
    throw new RequestValidationError("Request Body 的 model 必须与模型选择器一致。");
  }
  if (!Array.isArray(body.content) || body.content.length < 1) {
    throw new RequestValidationError("content 必须是非空数组。");
  }

  const content = body.content.map(parseContentItem);
  if (content.filter((item) => item.type === "text").length !== 1) {
    throw new RequestValidationError("content 必须且只能包含一项 text。");
  }
  const counts = {
    image_url: content.filter((item) => item.type === "image_url").length,
    video_url: content.filter((item) => item.type === "video_url").length,
    audio_url: content.filter((item) => item.type === "audio_url").length,
  };
  if (counts.image_url > 9 || counts.video_url > 3 || counts.audio_url > 3) {
    throw new RequestValidationError(
      "参考素材上限为 9 张图片、3 段视频和 3 段音频。",
    );
  }
  const firstFrames = content.filter(
    (item) => item.type === "image_url" && item.role === "first_frame",
  ).length;
  const lastFrames = content.filter(
    (item) => item.type === "image_url" && item.role === "last_frame",
  ).length;
  if (
    (firstFrames > 0 || lastFrames > 0) &&
    (firstFrames !== 1 ||
      lastFrames !== 1 ||
      counts.image_url !== 2 ||
      counts.video_url !== 0 ||
      counts.audio_url !== 0)
  ) {
    throw new RequestValidationError(
      "首尾帧模式必须且只能包含一张 first_frame 和一张 last_frame 图片。",
    );
  }

  const ratio = requiredString(body.ratio, "ratio", 12);
  if (!RATIOS.includes(ratio as (typeof RATIOS)[number])) {
    throw new RequestValidationError("ratio 不在当前支持范围内。");
  }
  const duration = body.duration;
  if (
    typeof duration !== "number" ||
    !Number.isInteger(duration) ||
    duration < 4 ||
    duration > 15
  ) {
    throw new RequestValidationError("duration 必须是 4 到 15 的整数。");
  }
  if (
    body.generate_audio !== undefined &&
    typeof body.generate_audio !== "boolean"
  ) {
    throw new RequestValidationError("generate_audio 必须是布尔值或省略。");
  }
  if (typeof body.watermark !== "boolean") {
    throw new RequestValidationError("watermark 必须是布尔值。");
  }
  if (
    body.return_last_frame !== undefined &&
    typeof body.return_last_frame !== "boolean"
  ) {
    throw new RequestValidationError("return_last_frame 必须是布尔值或省略。");
  }
  const resolution = body.resolution;
  if (
    resolution !== undefined &&
    !["480p", "720p", "1080p", "4k"].includes(String(resolution))
  ) {
    throw new RequestValidationError(
      "resolution 只支持 480p、720p、1080p 或 4k。",
    );
  }
  if (
    resolution === "4k" &&
    model !== "doubao-seedance-2-0-260128" &&
    model !== "doubao-seedance-2.0"
  ) {
    throw new RequestValidationError("4K 仅支持 Seedance 2.0 完整模型。");
  }

  let tools: Array<{ type: "web_search" }> | undefined;
  if (body.tools !== undefined) {
    if (
      !Array.isArray(body.tools) ||
      body.tools.length !== 1 ||
      !isWebSearchTool(body.tools[0])
    ) {
      throw new RequestValidationError(
        "tools 当前只支持 [{\"type\":\"web_search\"}]。",
      );
    }
    if (content.some((item) => item.type !== "text")) {
      throw new RequestValidationError("联网搜索能力仅适用于纯文本输入。");
    }
    tools = [{ type: "web_search" }];
  }

  const parsed: SeedanceRequestBody = {
    model,
    content,
    ratio: ratio as SeedanceRequestBody["ratio"],
    duration,
    watermark: body.watermark,
  };
  if (body.generate_audio !== undefined) {
    parsed.generate_audio = body.generate_audio;
  }
  if (body.return_last_frame !== undefined) {
    parsed.return_last_frame = body.return_last_frame;
  }
  if (resolution !== undefined) {
    parsed.resolution = resolution as SeedanceRequestBody["resolution"];
  }
  if (tools) parsed.tools = tools;
  return parsed;
}

function parseContentItem(value: unknown): SeedanceContentItem {
  const item = asRecord(value);
  const type = requiredString(item.type, "content.type", 32);
  if (type === "text") {
    return {
      type: "text",
      text: requiredString(item.text, "提示词", 10_000),
    };
  }

  const definitions = {
    image_url: "image_url",
    video_url: "video_url",
    audio_url: "audio_url",
  } as const;
  if (!(type in definitions)) {
    throw new RequestValidationError(
      "content.type 只支持 text、image_url、video_url 或 audio_url。",
    );
  }
  const mediaType = type as keyof typeof definitions;
  const payloadKey = definitions[mediaType];
  const payload = asRecord(item[payloadKey]);
  const url = publicMediaUrl(payload.url, `${payloadKey}.url`);
  if (mediaType === "image_url") {
    const role = item.role;
    if (
      role !== undefined &&
      role !== "reference_image" &&
      role !== "first_frame" &&
      role !== "last_frame"
    ) {
      throw new RequestValidationError(
        "image_url 的 role 只支持 reference_image、first_frame、last_frame 或省略。",
      );
    }
    return role
      ? { type: mediaType, image_url: { url }, role }
      : { type: mediaType, image_url: { url } };
  }
  if (mediaType === "video_url") {
    if (item.role !== "reference_video") {
      throw new RequestValidationError(
        "video_url 的 role 必须是 reference_video。",
      );
    }
    return {
      type: mediaType,
      video_url: { url },
      role: "reference_video",
    };
  }
  if (item.role !== "reference_audio") {
    throw new RequestValidationError(
      "audio_url 的 role 必须是 reference_audio。",
    );
  }
  return {
    type: mediaType,
    audio_url: { url },
    role: "reference_audio",
  };
}

function isWebSearchTool(value: unknown): value is { type: "web_search" } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const tool = value as Record<string, unknown>;
  return Object.keys(tool).length === 1 && tool.type === "web_search";
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

function publicMediaUrl(value: unknown, label: string): string {
  const raw = requiredString(value, label, 2_000);
  if (raw.startsWith("asset://")) {
    if (!/^asset:\/\/asset-[A-Za-z0-9-]+$/.test(raw)) {
      throw new RequestValidationError(
        `${label}的预置素材 ID 必须使用 asset://asset-* 格式。`,
      );
    }
    return raw;
  }

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
