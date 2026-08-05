import "server-only";

import { after } from "next/server";
import {
  parseGenerateSeedreamInput,
  proxySeedreamGeneration,
  SeedreamValidationError,
  type GenerateSeedreamInput,
} from "./seedream-server";

type JobStatus = "pending" | "running" | "succeeded" | "failed";

type SeedreamJobRow = {
  status: JobStatus;
  response_json: string | null;
  error: string | null;
};

const JOB_TTL_SECONDS = 24 * 60 * 60;
const MAX_RESULT_BYTES = 1_500_000;

export async function createSeedreamJob(value: unknown) {
  const input = parseGenerateSeedreamInput(value);
  if (input.requestBody.response_format === "b64_json") {
    throw new SeedreamValidationError(
      "支持刷新恢复的后台任务需要 response_format=url；Base64 结果过大，无法安全写入任务状态。",
    );
  }
  const database = await databaseBinding();
  const jobId = crypto.randomUUID();
  const resumeToken = randomToken();
  const tokenHash = await sha256Hex(resumeToken);
  const now = Math.floor(Date.now() / 1_000);
  await database
    .prepare(
      `INSERT INTO seedream_jobs
       (id, resume_token_hash, status, created_at, updated_at, expires_at)
       VALUES (?, ?, 'pending', ?, ?, ?)`,
    )
    .bind(jobId, tokenHash, now, now, now + JOB_TTL_SECONDS)
    .run();
  after(() => runSeedreamJob(jobId, input));
  void cleanupExpiredJobs(database, now);
  return { jobId, resumeToken, status: "pending" as const };
}

export async function getSeedreamJob(value: unknown) {
  const input = exactRecord(value, ["jobId", "resumeToken"]);
  const jobId = requiredString(input.jobId, "任务 ID", 80);
  const resumeToken = requiredString(input.resumeToken, "恢复令牌", 200);
  const row = await (await databaseBinding())
    .prepare(
      `SELECT status, response_json, error
       FROM seedream_jobs
       WHERE id = ? AND resume_token_hash = ? AND expires_at > ?`,
    )
    .bind(jobId, await sha256Hex(resumeToken), Math.floor(Date.now() / 1_000))
    .first<SeedreamJobRow>();
  if (!row) {
    throw new SeedreamValidationError("任务不存在、已过期或恢复令牌不正确。");
  }
  if (row.status === "succeeded") {
    return {
      status: row.status,
      result: row.response_json ? JSON.parse(row.response_json) : {},
    };
  }
  return { status: row.status, ...(row.error ? { error: row.error } : {}) };
}

async function runSeedreamJob(jobId: string, input: GenerateSeedreamInput) {
  const database = await databaseBinding();
  const now = () => Math.floor(Date.now() / 1_000);
  try {
    await database
      .prepare("UPDATE seedream_jobs SET status = 'running', updated_at = ? WHERE id = ?")
      .bind(now(), jobId)
      .run();
    const response = await proxySeedreamGeneration(input);
    const result = input.requestBody.stream
      ? { events: parseSse(await response.text()) }
      : JSON.parse((await response.text()) || "{}");
    const responseJson = JSON.stringify(result);
    if (new TextEncoder().encode(responseJson).byteLength > MAX_RESULT_BYTES) {
      throw new Error(
        "生成已完成，但结果超过可恢复任务的存储上限；请使用 URL 返回格式后重试。",
      );
    }
    await database
      .prepare(
        `UPDATE seedream_jobs
         SET status = 'succeeded', response_json = ?, error = NULL, updated_at = ?
         WHERE id = ?`,
      )
      .bind(responseJson, now(), jobId)
      .run();
  } catch (error) {
    const message = safeJobError(error);
    await database
      .prepare(
        `UPDATE seedream_jobs
         SET status = 'failed', error = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(message, now(), jobId)
      .run();
  }
}

async function cleanupExpiredJobs(database: D1Database, now: number) {
  try {
    await database
      .prepare("DELETE FROM seedream_jobs WHERE expires_at <= ?")
      .bind(now)
      .run();
  } catch {
    // Opportunistic cleanup must not block a newly-created generation task.
  }
}

async function databaseBinding(): Promise<D1Database> {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) {
    throw new Error("图片任务恢复服务尚未配置。");
  }
  return env.DB;
}

function parseSse(value: string): unknown[] {
  const events: unknown[] = [];
  for (const frame of value.split(/\r?\n\r?\n/)) {
    const data = frame
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    if (!data || data === "[DONE]") continue;
    try {
      events.push(JSON.parse(data));
    } catch {
      events.push(data);
    }
  }
  return events;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeJobError(error: unknown): string {
  return (error instanceof Error ? error.message : "图片生成失败。")
    .replaceAll(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .slice(0, 800);
}

function exactRecord(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SeedreamValidationError("请求格式不正确。");
  }
  const record = value as Record<string, unknown>;
  const unsupported = Object.keys(record).find((key) => !allowed.includes(key));
  if (unsupported) {
    throw new SeedreamValidationError(`请求包含未开放字段：${unsupported}。`);
  }
  return record;
}

function requiredString(value: unknown, label: string, maximum: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new SeedreamValidationError(`${label}不能为空。`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maximum) {
    throw new SeedreamValidationError(`${label}长度超过限制。`);
  }
  return trimmed;
}
