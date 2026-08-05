"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SEEDREAM_BASE_URL,
  SEEDREAM_DEFAULT_MODEL,
  SEEDREAM_EXAMPLES,
  SEEDREAM_LITE_MODEL,
  SEEDREAM_PROMPT_MODEL,
  type SeedreamExample,
  type SeedreamRequestBody,
} from "../lib/seedream-examples";
import {
  hasSavedMaterial,
  importGeneratedMaterial,
  readMaterialAssets,
} from "../lib/material-assets";
import { SaveToMaterialLibraryButton } from "./SaveToMaterialLibraryButton";

type ResultImage = {
  url: string;
  size?: string;
};

type HistoryRecord = {
  id: string;
  createdAt: string;
  action: "generate" | "optimize";
  exampleId: string;
  exampleTitle: string;
  status: "running" | "succeeded" | "failed";
  request: {
    method: "POST";
    url: string;
    headers: Record<string, string>;
    body: unknown;
  };
  response?: {
    httpStatus: number;
    body: unknown;
  };
  error?: string;
  images?: ResultImage[];
};

type OptimizeResponse = {
  optimizedPrompt?: string;
  error?: string;
  model?: string;
  response?: unknown;
};

type PendingSeedreamJob = {
  jobId: string;
  resumeToken: string;
  historyId: string;
  createdAt: string;
};

type SeedreamJobStatusResponse = {
  status?: "pending" | "running" | "succeeded" | "failed";
  result?: unknown;
  error?: string;
};

const HISTORY_STORAGE_KEY = "seedream-workbench:history:v1";
const PENDING_JOB_STORAGE_KEY = "seedream-workbench:pending-job:v1";
const CREDENTIAL_STORAGE_KEY = "seedance-workbench:demo-credentials:v1";
const MAX_HISTORY_RECORDS = 30;
const JOB_POLL_INTERVAL_MS = 2_000;

export function SeedreamWorkbench() {
  const [selectedId, setSelectedId] = useState(SEEDREAM_EXAMPLES[0].id);
  const selectedExample =
    SEEDREAM_EXAMPLES.find((example) => example.id === selectedId) ??
    SEEDREAM_EXAMPLES[0];
  const [requestBody, setRequestBody] = useState<SeedreamRequestBody>(() =>
    cloneBody(SEEDREAM_EXAMPLES[0].requestBody),
  );
  const [apiKey, setApiKey] = useState("");
  const [rememberApiKey, setRememberApiKey] = useState(true);
  const [storageReady, setStorageReady] = useState(false);
  const [apiEditing, setApiEditing] = useState(false);
  const [apiDraft, setApiDraft] = useState(() =>
    JSON.stringify(SEEDREAM_EXAMPLES[0].requestBody, null, 2),
  );
  const [apiDraftError, setApiDraftError] = useState("");
  const [costConfirmed, setCostConfirmed] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "optimizing" | "generating" | "succeeded" | "failed"
  >("idle");
  const [error, setError] = useState("");
  const [images, setImages] = useState<ResultImage[]>([]);
  const [activeGenerationId, setActiveGenerationId] = useState("");
  const [bulkSaveState, setBulkSaveState] = useState<
    "idle" | "saving" | "saved" | "failed"
  >("idle");
  const [bulkSaveError, setBulkSaveError] = useState("");
  const [latestResponse, setLatestResponse] = useState<unknown>();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [selectedLogId, setSelectedLogId] = useState("");
  const pollingJobRef = useRef("");
  const pollingAbortRef = useRef<AbortController | null>(null);

  const active = status === "optimizing" || status === "generating";
  const generationEndpoint = `${SEEDREAM_BASE_URL}/images/generations`;
  const promptEndpoint = `${SEEDREAM_BASE_URL}/chat/completions`;
  const imageText = Array.isArray(requestBody.image)
    ? requestBody.image.join("\n")
    : (requestBody.image ?? "");
  const requestJson = useMemo(
    () => JSON.stringify(requestBody, null, 2),
    [requestBody],
  );
  const selectedLog =
    history.find((record) => record.id === selectedLogId) ?? null;
  const generationReady =
    Boolean(apiKey.trim()) &&
    Boolean(requestBody.prompt.trim()) &&
    requestBody.response_format !== "b64_json" &&
    costConfirmed &&
    !active;

  const upsertHistory = useCallback((record: HistoryRecord) => {
    setHistory((current) => {
      const next = [
        record,
        ...current.filter((item) => item.id !== record.id),
      ].slice(0, MAX_HISTORY_RECORDS);
      writeHistory(next);
      return next;
    });
  }, []);

  const patchHistory = useCallback(
    (id: string, patch: Partial<HistoryRecord>) => {
      setHistory((current) => {
        const next = current.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        );
        writeHistory(next);
        return next;
      });
    },
    [],
  );

  const pollSeedreamJob = useCallback(
    async (pendingJob: PendingSeedreamJob) => {
      if (pollingJobRef.current === pendingJob.jobId) return;
      pollingAbortRef.current?.abort();
      const controller = new AbortController();
      pollingAbortRef.current = controller;
      pollingJobRef.current = pendingJob.jobId;
      setActiveGenerationId(pendingJob.historyId);
      setStatus("generating");

      try {
        while (!controller.signal.aborted) {
          let response: Response;
          let payload: SeedreamJobStatusResponse;
          try {
            response = await fetch("/api/seedream/jobs", {
              method: "POST",
              headers: { "content-type": "application/json" },
              cache: "no-store",
              signal: controller.signal,
              body: JSON.stringify({
                action: "status",
                jobId: pendingJob.jobId,
                resumeToken: pendingJob.resumeToken,
              }),
            });
            payload = (await response.json()) as SeedreamJobStatusResponse;
          } catch {
            if (controller.signal.aborted) return;
            setError("任务仍在后台执行，状态查询暂时失败，将自动重试。");
            await waitForJobPoll(controller.signal);
            continue;
          }

          if (!response.ok) {
            if (response.status >= 500) {
              setError("任务仍在后台执行，状态查询暂时失败，将自动重试。");
              await waitForJobPoll(controller.signal);
              continue;
            }
            const message = payload.error ?? "无法恢复图片生成任务。";
            setStatus("failed");
            setError(message);
            setCostConfirmed(false);
            patchHistory(pendingJob.historyId, {
              status: "failed",
              error: message,
            });
            clearPendingSeedreamJob(pendingJob.jobId);
            return;
          }

          if (payload.status === "pending" || payload.status === "running") {
            setStatus("generating");
            setError("");
            await waitForJobPoll(controller.signal);
            continue;
          }

          if (payload.status === "failed") {
            const message = payload.error ?? "图片生成失败。";
            setStatus("failed");
            setError(message);
            setCostConfirmed(false);
            patchHistory(pendingJob.historyId, {
              status: "failed",
              error: message,
            });
            clearPendingSeedreamJob(pendingJob.jobId);
            return;
          }

          if (payload.status === "succeeded") {
            const responseBody = payload.result ?? {};
            const resultImages = extractImages(responseBody);
            setImages(resultImages);
            setLatestResponse(responseBody);
            setStatus("succeeded");
            setError("");
            setCostConfirmed(false);
            patchHistory(pendingJob.historyId, {
              status: "succeeded",
              response: {
                httpStatus: 200,
                body: compactForStorage(responseBody),
              },
              images: resultImages.filter(
                (image) => !image.url.startsWith("data:"),
              ),
            });
            clearPendingSeedreamJob(pendingJob.jobId);
            return;
          }

          setError("任务状态暂不可识别，将自动重试。");
          await waitForJobPoll(controller.signal);
        }
      } finally {
        if (pollingJobRef.current === pendingJob.jobId) {
          pollingJobRef.current = "";
          pollingAbortRef.current = null;
        }
      }
    },
    [patchHistory],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setApiKey(readOfficialCredential());
      setHistory(readHistory());
      setStorageReady(true);
      const pendingJob = readPendingSeedreamJob();
      if (pendingJob) {
        setActiveGenerationId(pendingJob.historyId);
        setStatus("generating");
        setError("");
        void pollSeedreamJob(pendingJob);
      }
    }, 0);
    return () => {
      window.clearTimeout(timer);
      pollingAbortRef.current?.abort();
    };
  }, [pollSeedreamJob]);

  useEffect(() => {
    if (!storageReady) return;
    writeHistory(history);
  }, [history, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    writeOfficialCredential(rememberApiKey ? apiKey : "");
  }, [apiKey, rememberApiKey, storageReady]);

  function selectExample(example: SeedreamExample) {
    if (active) return;
    setSelectedId(example.id);
    setRequestBody(cloneBody(example.requestBody));
    setApiEditing(false);
    setApiDraft(JSON.stringify(example.requestBody, null, 2));
    setApiDraftError("");
    setCostConfirmed(false);
    setStatus("idle");
    setError("");
    setImages([]);
    setActiveGenerationId("");
    setBulkSaveState("idle");
    setBulkSaveError("");
    setLatestResponse(undefined);
    window.history.replaceState(null, "", `#seedream-${example.id}`);
    window.setTimeout(() => {
      document
        .getElementById("seedream-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function patchBody(patch: Partial<SeedreamRequestBody>) {
    setRequestBody((current) => ({ ...current, ...patch }));
    setCostConfirmed(false);
    setStatus("idle");
    setError("");
  }

  function focusApiKey() {
    const input = document.getElementById("seedream-api-key");
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input?.focus(), 250);
  }

  function setImageText(value: string) {
    const urls = value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    setRequestBody((current) => {
      const next = { ...current };
      if (urls.length === 0) {
        delete next.image;
      } else {
        next.image = urls.length === 1 ? urls[0] : urls;
      }
      return next;
    });
    setCostConfirmed(false);
  }

  function setSequentialMode(value: "disabled" | "auto") {
    setRequestBody((current) => {
      const next = { ...current };
      if (value === "disabled") {
        delete next.sequential_image_generation;
        delete next.sequential_image_generation_options;
        next.stream = false;
      } else {
        next.sequential_image_generation = "auto";
        next.sequential_image_generation_options ??= { max_images: 4 };
        next.stream ??= false;
      }
      return next;
    });
    setCostConfirmed(false);
  }

  function setWebSearch(enabled: boolean) {
    setRequestBody((current) => {
      const next = { ...current };
      if (enabled) next.tools = [{ type: "web_search" }];
      else delete next.tools;
      return next;
    });
    setCostConfirmed(false);
  }

  function setOptimizeMode(value: "none" | "standard" | "fast") {
    setRequestBody((current) => {
      const next = { ...current };
      if (value === "none") delete next.optimize_prompt_options;
      else next.optimize_prompt_options = { mode: value };
      return next;
    });
    setCostConfirmed(false);
  }

  function applyApiDraft() {
    try {
      const parsed = JSON.parse(apiDraft) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Request Body 必须是 JSON 对象。");
      }
      const body = parsed as SeedreamRequestBody;
      if (
        typeof body.model !== "string" ||
        typeof body.prompt !== "string" ||
        typeof body.size !== "string"
      ) {
        throw new Error("Request Body 至少需要 model、prompt 和 size。");
      }
      setRequestBody(body);
      setApiEditing(false);
      setApiDraftError("");
      setCostConfirmed(false);
      setStatus("idle");
      setError("");
    } catch (draftError) {
      setApiDraftError(
        draftError instanceof Error
          ? draftError.message
          : "Request Body 格式不正确。",
      );
    }
  }

  async function optimizePrompt() {
    if (!apiKey.trim() || !requestBody.prompt.trim() || active) {
      setError("请先填写 API Key 和提示词。");
      return;
    }
    const historyId = localId("optimize");
    const submittedAt = new Date().toISOString();
    const logRequest: HistoryRecord["request"] = {
      method: "POST",
      url: promptEndpoint,
      headers: maskedHeaders(apiKey),
      body: {
        model: SEEDREAM_PROMPT_MODEL,
        scenario: selectedExample.title,
        prompt: requestBody.prompt,
        prompt_tips: selectedExample.promptTips,
      },
    };
    const record: HistoryRecord = {
      id: historyId,
      createdAt: submittedAt,
      action: "optimize",
      exampleId: selectedExample.id,
      exampleTitle: selectedExample.title,
      status: "running",
      request: logRequest,
    };
    upsertHistory(record);
    setStatus("optimizing");
    setError("");
    setLatestResponse(undefined);

    try {
      const response = await fetch("/api/seedream/optimize-prompt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          apiKey,
          scenarioId: selectedExample.id,
          prompt: requestBody.prompt,
        }),
      });
      const payload = (await response.json()) as OptimizeResponse;
      if (!response.ok || !payload.optimizedPrompt) {
        throw new Error(payload.error ?? "提示词优化失败。");
      }
      patchBody({ prompt: payload.optimizedPrompt });
      setStatus("succeeded");
      setLatestResponse(payload);
      patchHistory(historyId, {
        status: "succeeded",
        response: {
          httpStatus: response.status,
          body: compactForStorage(payload),
        },
      });
    } catch (optimizeError) {
      const message =
        optimizeError instanceof Error
          ? optimizeError.message
          : "提示词优化失败。";
      setStatus("failed");
      setError(message);
      patchHistory(historyId, { status: "failed", error: message });
    }
  }

  async function generateImages() {
    if (!generationReady) return;
    const historyId = localId("generate");
    const submittedAt = new Date().toISOString();
    const submittedBody = cloneBody(requestBody);
    const logRequest: HistoryRecord["request"] = {
      method: "POST",
      url: generationEndpoint,
      headers: maskedHeaders(apiKey),
      body: submittedBody,
    };
    const record: HistoryRecord = {
      id: historyId,
      createdAt: submittedAt,
      action: "generate",
      exampleId: selectedExample.id,
      exampleTitle: selectedExample.title,
      status: "running",
      request: logRequest,
    };
    upsertHistory(record);
    setActiveGenerationId(historyId);
    setBulkSaveState("idle");
    setBulkSaveError("");
    setStatus("generating");
    setError("");
    setImages([]);
    setLatestResponse(undefined);

    try {
      const response = await fetch("/api/seedream/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          action: "create",
          apiKey,
          requestBody: submittedBody,
        }),
      });
      const payload = (await response.json()) as {
        jobId?: string;
        resumeToken?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "图片生成失败。");
      }
      if (!payload.jobId || !payload.resumeToken) {
        throw new Error("后台任务创建成功，但没有返回恢复凭证。");
      }
      const pendingJob: PendingSeedreamJob = {
        jobId: payload.jobId,
        resumeToken: payload.resumeToken,
        historyId,
        createdAt: submittedAt,
      };
      if (!writePendingSeedreamJob(pendingJob)) {
        setError("浏览器无法保存任务恢复凭证，请保持页面打开直到本次生成完成。");
      }
      await pollSeedreamJob(pendingJob);
    } catch (generateError) {
      const message =
        generateError instanceof Error
          ? generateError.message
          : "图片生成失败。";
      setStatus("failed");
      setError(message);
      setCostConfirmed(false);
      patchHistory(historyId, { status: "failed", error: message });
    }
  }

  async function saveAllImages() {
    if (!images.length || !activeGenerationId || bulkSaveState === "saving") {
      return;
    }
    setBulkSaveState("saving");
    setBulkSaveError("");
    try {
      for (const [index, image] of images.entries()) {
        const sourceRef = `seedream:${activeGenerationId}:${index}`;
        if (hasSavedMaterial(readMaterialAssets(), "image", sourceRef)) continue;
        await importGeneratedMaterial({
          kind: "image",
          source: "seedream",
          sourceRef,
          sourceValue: image.url,
          name: `${selectedExample.title}-${String(index + 1).padStart(2, "0")}.png`,
        });
      }
      setBulkSaveState("saved");
    } catch (saveError) {
      setBulkSaveState("failed");
      setBulkSaveError(
        saveError instanceof Error ? saveError.message : "批量保存图片失败。",
      );
    }
  }

  return (
    <section className="seedream-workbench" id="seedream">
      <header className="seedream-hero">
        <div>
          <p className="eyebrow">SEEDREAM IMAGE API STUDIO</p>
          <h1>
            Seedream
            <br />
            图片工作台
          </h1>
          <p>
            文生图 · 图像编辑 · 组图 · 联网 · 流式输出
          </p>
          <div className="seedream-hero-badges">
            <span>默认 {SEEDREAM_DEFAULT_MODEL}</span>
            <span>Prompt 优化 {SEEDREAM_PROMPT_MODEL}</span>
            <span>同源代理 · 本地脱敏日志</span>
          </div>
        </div>
        <aside>
          <strong>模型适配</strong>
          <p>
            默认 Seedream 5.0 Pro；组图、联网与流式按能力切换 Lite。
          </p>
          <a
            href="https://docs.volcengine.com/docs/82379/1824121?lang=zh"
            target="_blank"
            rel="noreferrer"
          >
            查看图片生成教程 ↗
          </a>
        </aside>
      </header>

      <div className="seedream-example-grid" aria-label="Seedream 示例类型">
        {SEEDREAM_EXAMPLES.map((example) => (
          <button
            aria-current={selectedId === example.id ? "true" : undefined}
            className={selectedId === example.id ? "is-active" : ""}
            data-testid={`seedream-example-${example.id}`}
            key={example.id}
            onClick={() => selectExample(example)}
            type="button"
          >
            <span>{example.index}</span>
            <small>{example.category}</small>
            <strong>{example.title}</strong>
            <p>{example.summary}</p>
          </button>
        ))}
      </div>

      <section className="seedream-editor-shell" id="seedream-editor">
        <header className="seedream-editor-heading">
          <div>
            <p className="eyebrow">
              {selectedExample.index} · {selectedExample.category}
            </p>
            <h2>{selectedExample.title}</h2>
            <p>{selectedExample.summary}</p>
          </div>
          <span className="seedream-model-chip">{requestBody.model}</span>
        </header>

        {selectedExample.modelNote && (
          <div className="seedream-capability-note">
            <strong>模型自动适配</strong>
            <span>{selectedExample.modelNote}</span>
          </div>
        )}

        <div className="seedream-editor-grid">
          <div className="seedream-form-column">
            <section className="seedream-panel seedream-instructions">
              <header>
                <span>填写说明</span>
                <small>切换示例会恢复官方参考参数</small>
              </header>
              <ol>
                {selectedExample.instructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ol>
            </section>

            <section className="seedream-panel seedream-connection">
              <header>
                <span>连接与模型</span>
                <small>复用演示工作台的普通方舟 API Key</small>
              </header>
              <label className="seedream-field seedream-field-wide">
                <span>API Key</span>
                <input
                  autoComplete="off"
                  id="seedream-api-key"
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="填入普通方舟 API Key"
                  type="password"
                  value={apiKey}
                />
              </label>
              <label className="seedream-check seedream-field-wide">
                <input
                  checked={rememberApiKey}
                  onChange={(event) => setRememberApiKey(event.target.checked)}
                  type="checkbox"
                />
                <span>演示模式：在当前浏览器记住 API Key</span>
              </label>
              <label className="seedream-field">
                <span>图片模型</span>
                <select
                  onChange={(event) =>
                    patchBody({
                      model: event.target.value as SeedreamRequestBody["model"],
                    })
                  }
                  value={requestBody.model}
                >
                  <option value={SEEDREAM_DEFAULT_MODEL}>
                    Seedream 5.0 Pro（默认）
                  </option>
                  <option value={SEEDREAM_LITE_MODEL}>
                    Seedream 5.0 Lite（能力兼容）
                  </option>
                </select>
              </label>
              <label className="seedream-field">
                <span>Base URL</span>
                <input readOnly value={SEEDREAM_BASE_URL} />
              </label>
            </section>

            <section className="seedream-panel seedream-prompt-section">
              <header>
                <span>Prompt 与参考图</span>
                <small>编辑内容会立即联动右侧 Request Body</small>
              </header>
              <label className="seedream-field seedream-field-wide">
                <span>Prompt</span>
                <div className="seedream-prompt-editor">
                  <textarea
                    onChange={(event) =>
                      patchBody({ prompt: event.target.value })
                    }
                    rows={9}
                    value={requestBody.prompt}
                  />
                  <button
                    disabled={active || !requestBody.prompt.trim()}
                    onClick={() =>
                      apiKey.trim() ? void optimizePrompt() : focusApiKey()
                    }
                    type="button"
                  >
                    {status === "optimizing"
                      ? "优化中…"
                      : !apiKey.trim()
                        ? "先填写 API Key 后优化"
                      : `✦ 用 ${SEEDREAM_PROMPT_MODEL} 优化`}
                  </button>
                </div>
              </label>
              <label className="seedream-field seedream-field-wide">
                <span>参考图 URL（每行一张，可留空）</span>
                <textarea
                  onChange={(event) => setImageText(event.target.value)}
                  placeholder="https://example.com/reference.png"
                  rows={Math.max(3, imageText.split("\n").length + 1)}
                  value={imageText}
                />
              </label>
            </section>

            <section className="seedream-panel seedream-tips">
              <header>
                <span>{selectedExample.title} · Prompt 使用技巧</span>
                <a
                  href="https://docs.volcengine.com/docs/82379/1829186?lang=zh"
                  target="_blank"
                  rel="noreferrer"
                >
                  官方指南 ↗
                </a>
              </header>
              <ul>
                {selectedExample.promptTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
              <p>
                右上方优化按钮会把当前场景与这些技巧一并交给
                {SEEDREAM_PROMPT_MODEL}，成功后直接回填 Prompt。
              </p>
            </section>

            <section className="seedream-panel seedream-parameters">
              <header>
                <span>输出与进阶参数</span>
                <small>所有字段均进入同一 Image generation API</small>
              </header>
              <label className="seedream-field">
                <span>size</span>
                <input
                  onChange={(event) => patchBody({ size: event.target.value })}
                  value={requestBody.size}
                />
              </label>
              <label className="seedream-field">
                <span>output_format</span>
                <select
                  onChange={(event) =>
                    patchBody({
                      output_format: event.target
                        .value as SeedreamRequestBody["output_format"],
                    })
                  }
                  value={requestBody.output_format}
                >
                  <option value="png">png</option>
                  <option value="jpeg">jpeg</option>
                </select>
              </label>
              <label className="seedream-field">
                <span>response_format</span>
                <select
                  onChange={(event) =>
                    patchBody({
                      response_format: event.target
                        .value as SeedreamRequestBody["response_format"],
                    })
                  }
                  value={requestBody.response_format}
                >
                  <option value="url">url</option>
                  <option value="b64_json">b64_json</option>
                </select>
              </label>
              <label className="seedream-field">
                <span>组图模式</span>
                <select
                  onChange={(event) =>
                    setSequentialMode(
                      event.target.value as "disabled" | "auto",
                    )
                  }
                  value={
                    requestBody.sequential_image_generation === "auto"
                      ? "auto"
                      : "disabled"
                  }
                >
                  <option value="disabled">disabled · 单图</option>
                  <option value="auto">auto · 组图</option>
                </select>
              </label>
              {requestBody.sequential_image_generation === "auto" && (
                <label className="seedream-field">
                  <span>max_images</span>
                  <input
                    max={15}
                    min={1}
                    onChange={(event) =>
                      patchBody({
                        sequential_image_generation_options: {
                          max_images: Number(event.target.value),
                        },
                      })
                    }
                    type="number"
                    value={
                      requestBody.sequential_image_generation_options
                        ?.max_images ?? 4
                    }
                  />
                </label>
              )}
              <label className="seedream-field">
                <span>图片 API Prompt 优化</span>
                <select
                  onChange={(event) =>
                    setOptimizeMode(
                      event.target.value as "none" | "standard" | "fast",
                    )
                  }
                  value={requestBody.optimize_prompt_options?.mode ?? "none"}
                >
                  <option value="none">不显式设置</option>
                  <option value="standard">standard</option>
                  <option value="fast">fast</option>
                </select>
              </label>
              <label className="seedream-check">
                <input
                  checked={requestBody.watermark}
                  onChange={(event) =>
                    patchBody({ watermark: event.target.checked })
                  }
                  type="checkbox"
                />
                <span>添加“AI生成”水印</span>
              </label>
              <label className="seedream-check">
                <input
                  checked={Boolean(requestBody.tools?.length)}
                  onChange={(event) => setWebSearch(event.target.checked)}
                  type="checkbox"
                />
                <span>启用 web_search</span>
              </label>
              <label className="seedream-check">
                <input
                  checked={Boolean(requestBody.stream)}
                  disabled={
                    requestBody.sequential_image_generation !== "auto"
                  }
                  onChange={(event) =>
                    patchBody({ stream: event.target.checked })
                  }
                  type="checkbox"
                />
                <span>流式逐张返回（需组图）</span>
              </label>
            </section>

            <section className="seedream-execute">
              <label className="seedream-check">
                <input
                  checked={costConfirmed}
                  onChange={(event) =>
                    setCostConfirmed(event.target.checked)
                  }
                  type="checkbox"
                />
                <span>
                  我确认执行真实图片生成会消耗额度或产生费用；返回 URL 仅保留
                  24 小时。
                </span>
              </label>
              <button
                className="seedream-primary-action"
                disabled={!generationReady}
                onClick={() => void generateImages()}
                type="button"
              >
                {status === "generating"
                  ? "后台生成中…"
                  : requestBody.stream
                    ? "执行流式图片生成"
                    : "执行真实图片生成"}
              </button>
              {!apiKey.trim() && <small>请先填写普通方舟 API Key。</small>}
              {requestBody.response_format === "b64_json" && (
                <small>
                  可刷新恢复的后台任务要求 response_format=url，请在参数区切换后执行。
                </small>
              )}
              {status === "generating" && (
                <small>
                  任务已在服务端后台执行；可刷新或稍后返回，本浏览器会自动恢复进度。
                </small>
              )}
            </section>
          </div>

          <aside className="seedream-api-column">
            <section className="seedream-api-card">
              <header>
                <div>
                  <span>完整 API 请求详情</span>
                  <small>表单 ↔ JSON 双向联动</small>
                </div>
                <button
                  onClick={() => {
                    setApiEditing((current) => !current);
                    setApiDraft(requestJson);
                    setApiDraftError("");
                  }}
                  type="button"
                >
                  {apiEditing ? "取消编辑" : "编辑 JSON"}
                </button>
              </header>
              <dl>
                <div>
                  <dt>Method</dt>
                  <dd>POST</dd>
                </div>
                <div>
                  <dt>URL</dt>
                  <dd>{generationEndpoint}</dd>
                </div>
                <div>
                  <dt>Authorization</dt>
                  <dd>
                    Bearer {apiKey ? maskApiKey(apiKey) : "••••••••"}
                  </dd>
                </div>
                <div>
                  <dt>Content-Type</dt>
                  <dd>application/json</dd>
                </div>
              </dl>
              {apiEditing ? (
                <div className="seedream-api-editor">
                  <textarea
                    aria-label="编辑完整 Seedream Request Body"
                    onChange={(event) => setApiDraft(event.target.value)}
                    rows={24}
                    spellCheck={false}
                    value={apiDraft}
                  />
                  {apiDraftError && (
                    <p className="seedream-inline-error">{apiDraftError}</p>
                  )}
                  <button onClick={applyApiDraft} type="button">
                    应用 JSON 到表单
                  </button>
                </div>
              ) : (
                <pre>{requestJson}</pre>
              )}
            </section>

            <section className="seedream-response-card">
              <header>
                <span>本次 API 返回</span>
                <small>{statusLabel(status)}</small>
              </header>
              {error && <p className="seedream-error">{error}</p>}
              {latestResponse ? (
                <pre>{JSON.stringify(compactForDisplay(latestResponse), null, 2)}</pre>
              ) : (
                <p>完整脱敏响应会显示在这里；流式模式会保留事件序列。</p>
              )}
            </section>
          </aside>
        </div>
      </section>

      <section className="seedream-results">
        <header>
          <div>
            <p className="eyebrow">生成结果</p>
            <h2>图片预览</h2>
          </div>
          <div className="seedream-result-actions">
            <span>{images.length ? `${images.length} 张` : "等待执行"}</span>
            {images.length > 1 && activeGenerationId && (
              <button
                disabled={bulkSaveState === "saving" || bulkSaveState === "saved"}
                onClick={() => void saveAllImages()}
                type="button"
              >
                {bulkSaveState === "saving"
                  ? "保存中…"
                  : bulkSaveState === "saved"
                    ? "已全部保存"
                    : bulkSaveState === "failed"
                      ? "重试全部保存"
                      : "全部保存到素材库"}
              </button>
            )}
          </div>
        </header>
        {bulkSaveError && <p className="seedream-save-error">{bulkSaveError}</p>}
        {images.length ? (
          <div className="seedream-result-grid">
            {images.map((image, index) => (
              <article key={`${image.url.slice(0, 80)}-${index}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={`${selectedExample.title} 生成结果 ${index + 1}`}
                  src={image.url}
                />
                <footer>
                  <div>
                    <span>IMAGE {String(index + 1).padStart(2, "0")}</span>
                    {image.size && <small>{image.size}</small>}
                    {!image.url.startsWith("data:") && (
                      <a href={image.url} target="_blank" rel="noreferrer">
                        打开原图 ↗
                      </a>
                    )}
                  </div>
                  {activeGenerationId && (
                    <SaveToMaterialLibraryButton
                      compact
                      kind="image"
                      name={`${selectedExample.title}-${String(index + 1).padStart(2, "0")}.png`}
                      source="seedream"
                      sourceRef={`seedream:${activeGenerationId}:${index}`}
                      sourceValue={image.url}
                    />
                  )}
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <div className="seedream-empty-result">
            选择示例、编辑参数并显式执行后，生成图片会显示在这里。
          </div>
        )}
      </section>

      <section className="seedream-history">
        <header>
          <div>
            <p className="eyebrow">本地历史与日志</p>
            <h2>最近 30 次 Seedream 操作</h2>
          </div>
          <p>只保存在当前浏览器；Authorization 始终掩码。</p>
        </header>
        {history.length ? (
          <div className="seedream-history-list">
            {history.map((record) => (
              <article key={record.id}>
                <div>
                  <span>
                    {record.action === "generate" ? "图片生成" : "Prompt 优化"}
                  </span>
                  <strong>{record.exampleTitle}</strong>
                  <small>{formatDate(record.createdAt)}</small>
                </div>
                <em data-status={record.status}>
                  {historyStatus(record.status)}
                </em>
                <button
                  onClick={() =>
                    setSelectedLogId((current) =>
                      current === record.id ? "" : record.id,
                    )
                  }
                  type="button"
                >
                  {selectedLogId === record.id ? "收起日志" : "查看日志"}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="seedream-empty-history">暂无 Seedream 演示记录。</p>
        )}
        {selectedLog && (
          <div className="seedream-log-detail">
            <header>
              <strong>{selectedLog.exampleTitle}</strong>
              <span>
                {selectedLog.request.method} {selectedLog.request.url}
              </span>
            </header>
            <h3>Request</h3>
            <pre>
              {JSON.stringify(
                {
                  headers: selectedLog.request.headers,
                  body: selectedLog.request.body,
                },
                null,
                2,
              )}
            </pre>
            <h3>Response</h3>
            <pre>
              {JSON.stringify(
                selectedLog.response ?? { error: selectedLog.error },
                null,
                2,
              )}
            </pre>
          </div>
        )}
      </section>
    </section>
  );
}

function cloneBody(body: SeedreamRequestBody): SeedreamRequestBody {
  return JSON.parse(JSON.stringify(body)) as SeedreamRequestBody;
}

function maskApiKey(value: string): string {
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

function maskedHeaders(apiKey: string): Record<string, string> {
  return {
    authorization: apiKey.trim()
      ? `Bearer ${maskApiKey(apiKey)}`
      : "Bearer 未填写",
    "content-type": "application/json",
  };
}

function localId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function statusLabel(
  status: "idle" | "optimizing" | "generating" | "succeeded" | "failed",
): string {
  return {
    idle: "等待执行",
    optimizing: "Prompt 优化中",
    generating: "图片生成中",
    succeeded: "请求成功",
    failed: "请求失败",
  }[status];
}

function historyStatus(status: HistoryRecord["status"]): string {
  return {
    running: "执行中",
    succeeded: "成功",
    failed: "失败",
  }[status];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function readOfficialCredential(): string {
  try {
    const raw = window.localStorage.getItem(CREDENTIAL_STORAGE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { official?: unknown };
    return typeof parsed.official === "string" ? parsed.official : "";
  } catch {
    return "";
  }
}

function writeOfficialCredential(apiKey: string) {
  try {
    const raw = window.localStorage.getItem(CREDENTIAL_STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as Record<string, unknown>)
      : {};
    if (apiKey.trim()) parsed.official = apiKey;
    else delete parsed.official;
    window.localStorage.setItem(
      CREDENTIAL_STORAGE_KEY,
      JSON.stringify(parsed),
    );
  } catch {
    // Browser storage is optional; the current in-memory value remains usable.
  }
}

function readHistory(): HistoryRecord[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed.slice(0, MAX_HISTORY_RECORDS) as HistoryRecord[])
      : [];
  } catch {
    return [];
  }
}

function writeHistory(history: HistoryRecord[]) {
  try {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(0, MAX_HISTORY_RECORDS)),
    );
  } catch {
    // Keep the active result even if large responses exceed localStorage quota.
  }
}

function readPendingSeedreamJob(): PendingSeedreamJob | null {
  try {
    const raw = window.localStorage.getItem(PENDING_JOB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingSeedreamJob>;
    return typeof parsed.jobId === "string" &&
      typeof parsed.resumeToken === "string" &&
      typeof parsed.historyId === "string" &&
      typeof parsed.createdAt === "string"
      ? (parsed as PendingSeedreamJob)
      : null;
  } catch {
    return null;
  }
}

function writePendingSeedreamJob(job: PendingSeedreamJob): boolean {
  try {
    window.localStorage.setItem(PENDING_JOB_STORAGE_KEY, JSON.stringify(job));
    return true;
  } catch {
    return false;
  }
}

function clearPendingSeedreamJob(jobId: string) {
  try {
    const current = readPendingSeedreamJob();
    if (!current || current.jobId === jobId) {
      window.localStorage.removeItem(PENDING_JOB_STORAGE_KEY);
    }
  } catch {
    // A finished task must remain usable even if localStorage is unavailable.
  }
}

function waitForJobPoll(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, JOB_POLL_INTERVAL_MS);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

function extractImages(value: unknown): ResultImage[] {
  const found: ResultImage[] = [];
  const visit = (item: unknown) => {
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    const size = typeof record.size === "string" ? record.size : undefined;
    if (typeof record.url === "string") {
      found.push({ url: record.url, size });
    }
    if (typeof record.b64_json === "string") {
      found.push({
        url: `data:image/png;base64,${record.b64_json}`,
        size,
      });
    }
    for (const [key, nested] of Object.entries(record)) {
      if (key !== "url" && key !== "b64_json") visit(nested);
    }
  };
  visit(value);
  return mergeImages([], found);
}

function mergeImages(
  current: ResultImage[],
  incoming: ResultImage[],
): ResultImage[] {
  const map = new Map(current.map((item) => [item.url, item]));
  incoming.forEach((item) => map.set(item.url, item));
  return [...map.values()];
}

function compactForDisplay(value: unknown): unknown {
  return transformBase64(value, (length) => `[Base64 图片数据，共 ${length} 字符]`);
}

function compactForStorage(value: unknown): unknown {
  return transformBase64(
    value,
    (length) => `[BASE64_IMAGE_OMITTED_FROM_LOCAL_HISTORY:${length}]`,
  );
}

function transformBase64(
  value: unknown,
  replacement: (length: number) => string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => transformBase64(item, replacement));
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      key === "b64_json" && typeof item === "string"
        ? replacement(item.length)
        : transformBase64(item, replacement),
    ]),
  );
}
