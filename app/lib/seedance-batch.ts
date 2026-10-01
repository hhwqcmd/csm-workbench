import type { ApiPath } from "./seedance-config";
import type { SeedanceRequestBody } from "./seedance-examples";

export const SEEDANCE_BATCH_MAX_TASKS = 12;
export const SEEDANCE_BATCH_CONCURRENCY = 3;
export const SEEDANCE_BATCH_STORAGE_KEY =
  "seedance-workbench:controlled-batches:v1";
export const SEEDANCE_BATCH_MAX_RECORDS = 10;

export type SeedanceBatchItemStatus =
  | "pending"
  | "submitting"
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "expired"
  | "not_created"
  | "unknown";

export type SeedanceBatchItem = {
  id: string;
  promptIndex: number;
  drawIndex: number;
  prompt: string;
  historyId: string;
  status: SeedanceBatchItemStatus;
  attempts: number;
  retryable: boolean;
  taskId?: string;
  videoUrl?: string;
  lastFrameUrl?: string;
  duration?: number;
  ratio?: string;
  resolution?: string;
  outputFormat?: string;
  usage?: {
    completionTokens?: number;
    totalTokens?: number;
    webSearch?: number;
  };
  error?: string;
};

export type SeedanceBatchRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  apiPath: ApiPath;
  baseUrl: string;
  model: string;
  prompts: string[];
  draws: number;
  requestTemplate: SeedanceRequestBody;
  items: SeedanceBatchItem[];
};

export function seedanceBatchTaskCount(
  prompts: readonly string[],
  draws: number,
): number {
  return prompts.filter((item) => item.trim()).length * draws;
}

export function validateSeedanceBatchSize(
  prompts: readonly string[],
  draws: number,
): string[] {
  const errors: string[] = [];
  const promptCount = prompts.filter((item) => item.trim()).length;
  if (!Number.isInteger(draws) || draws < 1) {
    errors.push("每条 Prompt 的抽卡数必须是至少 1 的整数。");
  }
  if (promptCount < 1) errors.push("批量实验至少需要一条非空 Prompt。");
  const total = seedanceBatchTaskCount(prompts, draws);
  if (total < 2) errors.push("批量实验至少创建 2 个任务。");
  if (total > SEEDANCE_BATCH_MAX_TASKS) {
    errors.push(`批量实验最多创建 ${SEEDANCE_BATCH_MAX_TASKS} 个任务。`);
  }
  return errors;
}

export function createSeedanceBatchId(now = Date.now()): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `seedance-batch-${now}-${random}`;
}

export function replaceSeedancePrompt(
  template: SeedanceRequestBody,
  prompt: string,
): SeedanceRequestBody {
  const media = template.content.filter((item) => item.type !== "text");
  return {
    ...template,
    content: [
      ...(prompt.trim()
        ? [{ type: "text" as const, text: prompt.trim() }]
        : []),
      ...media,
    ],
  };
}

export async function mapWithConcurrency<T, R>(
  values: readonly T[],
  limit: number,
  worker: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("并发上限必须是正整数。");
  }
  const results = new Array<R>(values.length);
  let cursor = 0;
  async function runWorker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(values[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => runWorker()),
  );
  return results;
}

export function isSeedanceBatchTerminal(status: SeedanceBatchItemStatus) {
  return [
    "succeeded",
    "failed",
    "cancelled",
    "expired",
    "not_created",
    "unknown",
  ].includes(status);
}
