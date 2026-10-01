import "server-only";

import {
  PELICAN_DIMENSIONS,
  PELICAN_DIMENSION_LABELS,
  PELICAN_OBJECT_KEY_PATTERN,
  pelicanObjectKey,
  type JudgeMode,
  type PelicanDimension,
  type PelicanRenderMeta,
  type PelicanScores,
  type PelicanUsage,
} from "./pelican-shared";

export class PelicanValidationError extends Error {}

const encoder = new TextEncoder();

const PELICAN_RUN_ID_PATTERN = /^pel-[0-9]{14}-[a-f0-9]{8}$/;
const MAX_MODEL_LENGTH = 200;
const MAX_SVG_BYTES = 1.5 * 1024 * 1024;
const MAX_COMMENTS_LENGTH = 5000;

// Defense-in-depth: even though every object level is checked with exactRecord,
// recursively reject credential-bearing keys so a secret can never be archived.
// Token *counts* (inputTokens/outputTokens) are legitimate and must not trip
// this filter, so bare "token" is only rejected as an exact key name.
const SENSITIVE_KEY_EXACT = new Set([
  "token",
  "apikey",
  "authorization",
  "secret",
  "password",
  "bearer",
  "credential",
]);
const SENSITIVE_KEY_SUBSTRINGS = [
  "apikey",
  "api_key",
  "api-key",
  "authorization",
  "secret",
  "password",
  "bearer",
  "credential",
  "access_token",
  "accesstoken",
  "auth_token",
  "authtoken",
  "refresh_token",
  "refreshtoken",
  "id_token",
  "idtoken",
  "private_key",
  "privatekey",
];

export type PelicanSaveInput = {
  runId: string;
  objectKey: string;
  model: string;
  judgeModel: string;
  judgeMode: JudgeMode;
  svg: string;
  scores: PelicanScores;
  overall: number;
  comments: string;
  renderMeta?: PelicanRenderMeta;
  usage?: PelicanUsage;
  createdAt: string;
};

export type PelicanFetchInput = {
  key: string;
  content: boolean;
};

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (SENSITIVE_KEY_EXACT.has(lower)) return true;
  return SENSITIVE_KEY_SUBSTRINGS.some((needle) => lower.includes(needle));
}

function assertNoSensitiveKeys(value: unknown, depth = 0): void {
  if (depth > 24) {
    throw new PelicanValidationError("请求嵌套层级过深。");
  }
  if (Array.isArray(value)) {
    for (const item of value) assertNoSensitiveKeys(item, depth + 1);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        throw new PelicanValidationError("请求包含不安全的对象键。");
      }
      if (isSensitiveKey(key)) {
        throw new PelicanValidationError(`请求包含不允许的敏感字段：${key}。`);
      }
      assertNoSensitiveKeys(nested, depth + 1);
    }
  }
}

function exactRecord(
  value: unknown,
  allowed: string[],
  label: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PelicanValidationError(`${label}格式不正确。`);
  }
  const record = value as Record<string, unknown>;
  const unsupported = Object.keys(record).find((key) => !allowed.includes(key));
  if (unsupported) {
    throw new PelicanValidationError(`${label}包含未开放字段：${unsupported}。`);
  }
  return record;
}

function requiredString(value: unknown, label: string, maximum: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new PelicanValidationError(`${label}不能为空。`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maximum) {
    throw new PelicanValidationError(`${label}长度超过限制。`);
  }
  return trimmed;
}

function optionalString(value: unknown, label: string, maximum: number): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw new PelicanValidationError(`${label}必须是字符串。`);
  }
  if (value.length > maximum) {
    throw new PelicanValidationError(`${label}长度超过限制。`);
  }
  return value;
}

function parseScoreValue(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 10) {
    throw new PelicanValidationError(`${label}必须是 0 到 10 之间的数字。`);
  }
  return Math.round(value * 10) / 10;
}

function parseNonNegativeInt(value: unknown, label: string, max: number): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > max
  ) {
    throw new PelicanValidationError(`${label}数值超出允许范围。`);
  }
  return Math.floor(value);
}

function parseJudgeMode(value: unknown): JudgeMode {
  if (value === "vision" || value === "source") return value;
  throw new PelicanValidationError("裁判模式只支持 vision 或 source。");
}

function parseScores(value: unknown): PelicanScores {
  const record = exactRecord(value, [...PELICAN_DIMENSIONS], "评分");
  const scores = {} as PelicanScores;
  for (const dimension of PELICAN_DIMENSIONS as readonly PelicanDimension[]) {
    scores[dimension] = parseScoreValue(
      record[dimension],
      PELICAN_DIMENSION_LABELS[dimension],
    );
  }
  return scores;
}

function parseRenderMeta(value: unknown): PelicanRenderMeta | undefined {
  if (value === undefined || value === null) return undefined;
  const record = exactRecord(
    value,
    ["ok", "width", "height", "bytes", "error"],
    "渲染元数据",
  );
  if (typeof record.ok !== "boolean") {
    throw new PelicanValidationError("渲染元数据 ok 必须是布尔值。");
  }
  const meta: PelicanRenderMeta = { ok: record.ok };
  if (record.width !== undefined) {
    meta.width = parseNonNegativeInt(record.width, "渲染宽度", 100_000);
  }
  if (record.height !== undefined) {
    meta.height = parseNonNegativeInt(record.height, "渲染高度", 100_000);
  }
  if (record.bytes !== undefined) {
    meta.bytes = parseNonNegativeInt(record.bytes, "PNG 字节数", 8 * 1024 * 1024);
  }
  if (record.error !== undefined) {
    meta.error = optionalString(record.error, "渲染错误", 500);
  }
  return meta;
}

function parseUsage(value: unknown): PelicanUsage | undefined {
  if (value === undefined || value === null) return undefined;
  const record = exactRecord(value, ["inputTokens", "outputTokens"], "用量");
  const usage: PelicanUsage = {};
  if (record.inputTokens !== undefined) {
    usage.inputTokens = parseNonNegativeInt(
      record.inputTokens,
      "输入 token 数",
      1_000_000_000,
    );
  }
  if (record.outputTokens !== undefined) {
    usage.outputTokens = parseNonNegativeInt(
      record.outputTokens,
      "输出 token 数",
      1_000_000_000,
    );
  }
  return usage;
}

function parseSvg(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new PelicanValidationError("SVG 内容不能为空。");
  }
  if (encoder.encode(value).byteLength > MAX_SVG_BYTES) {
    throw new PelicanValidationError("SVG 内容超过 1.5MB 上限。");
  }
  return value;
}

function parseCreatedAt(value: unknown): string {
  const text = requiredString(value, "创建时间", 40);
  const time = Date.parse(text);
  if (!Number.isFinite(time)) {
    throw new PelicanValidationError("创建时间不是合法的时间戳。");
  }
  return new Date(time).toISOString();
}

export function parsePelicanSaveInput(value: unknown): PelicanSaveInput {
  assertNoSensitiveKeys(value);
  const input = exactRecord(
    value,
    [
      "runId",
      "model",
      "judgeModel",
      "judgeMode",
      "svg",
      "scores",
      "overall",
      "comments",
      "renderMeta",
      "usage",
      "createdAt",
    ],
    "请求",
  );

  const runId = requiredString(input.runId, "运行 ID", 64);
  if (!PELICAN_RUN_ID_PATTERN.test(runId)) {
    throw new PelicanValidationError("运行 ID 格式不正确。");
  }

  return {
    runId,
    objectKey: pelicanObjectKey(runId),
    model: requiredString(input.model, "生成模型", MAX_MODEL_LENGTH),
    judgeModel: requiredString(input.judgeModel, "裁判模型", MAX_MODEL_LENGTH),
    judgeMode: parseJudgeMode(input.judgeMode),
    svg: parseSvg(input.svg),
    scores: parseScores(input.scores),
    overall: parseScoreValue(input.overall, "总分"),
    comments: optionalString(input.comments, "点评", MAX_COMMENTS_LENGTH),
    renderMeta: parseRenderMeta(input.renderMeta),
    usage: parseUsage(input.usage),
    createdAt: parseCreatedAt(input.createdAt),
  };
}

export function parsePelicanFetchInput(
  searchParams: URLSearchParams,
): PelicanFetchInput {
  const key = requiredString(searchParams.get("key"), "对象键", 1_024);
  if (!PELICAN_OBJECT_KEY_PATTERN.test(key)) {
    throw new PelicanValidationError("鹈鹕测试结果对象键格式不正确。");
  }
  return { key, content: searchParams.get("content") === "bundle" };
}
