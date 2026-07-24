"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  API_PATHS,
  DEFAULT_TASK,
  isAllowedModel,
  RATIOS,
  type ApiPath,
} from "../lib/seedance-config";

type TaskStatus =
  | "draft"
  | "submitting"
  | "queued"
  | "running"
  | "succeeded"
  | "failed";

type TaskResponse = {
  id?: string;
  status?: string;
  videoUrl?: string;
  error?: string;
};

type HistoryStatus =
  | "submitting"
  | "queued"
  | "running"
  | "succeeded"
  | "failed";

type TaskLogEntry = {
  at: string;
  phase: "create" | "status";
  request: {
    method: "POST" | "GET";
    url: string;
    headers: Record<string, string>;
    body?: unknown;
  };
  response?: {
    httpStatus: number;
    body: TaskResponse;
  };
  error?: string;
};

type HistoryRecord = {
  id: string;
  taskId?: string;
  createdAt: string;
  updatedAt: string;
  apiPath: ApiPath;
  baseUrl: string;
  model: string;
  prompt: string;
  imageUrl: string;
  referenceVideoUrl: string;
  ratio: (typeof RATIOS)[number];
  duration: number;
  generateAudio: boolean;
  watermark: boolean;
  status: HistoryStatus;
  resultVideoUrl?: string;
  error?: string;
  logs?: TaskLogEntry[];
};

type RememberedCredentials = Partial<Record<ApiPath, string>>;

const POLL_SECONDS = 30;
const HISTORY_STORAGE_KEY = "seedance-workbench:task-history:v1";
const CREDENTIAL_STORAGE_KEY = "seedance-workbench:demo-credentials:v1";
const MAX_HISTORY_RECORDS = 30;

export function SeedanceTaskRunner() {
  const [apiPath, setApiPath] = useState<ApiPath>("official");
  const [baseUrl, setBaseUrl] = useState<string>(API_PATHS.official.baseUrl);
  const [model, setModel] = useState<string>(
    API_PATHS.official.defaultModel,
  );
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_TASK.prompt as string);
  const [imageUrl, setImageUrl] = useState(DEFAULT_TASK.imageUrl as string);
  const [videoUrl, setVideoUrl] = useState(DEFAULT_TASK.videoUrl as string);
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>(
    DEFAULT_TASK.ratio,
  );
  const [duration, setDuration] = useState(DEFAULT_TASK.duration as number);
  const [generateAudio, setGenerateAudio] = useState(
    DEFAULT_TASK.generateAudio as boolean,
  );
  const [watermark, setWatermark] = useState(
    DEFAULT_TASK.watermark as boolean,
  );
  const [costConfirmed, setCostConfirmed] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("draft");
  const [taskId, setTaskId] = useState("");
  const [resultVideoUrl, setResultVideoUrl] = useState("");
  const [taskError, setTaskError] = useState("");
  const [nextPollIn, setNextPollIn] = useState<number | null>(null);
  const [pollCycle, setPollCycle] = useState(0);
  const [rememberApiKey, setRememberApiKey] = useState(true);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState("");
  const [logRecordId, setLogRecordId] = useState("");
  const [apiBodyDraft, setApiBodyDraft] = useState("");
  const [apiBodyEditing, setApiBodyEditing] = useState(false);
  const [apiBodyError, setApiBodyError] = useState("");
  const pollingRef = useRef(false);

  const selectedPath = API_PATHS[apiPath];
  const active = ["submitting", "queued", "running"].includes(taskStatus);
  const baseUrlMatches = baseUrl.replace(/\/$/, "") === selectedPath.baseUrl;
  const modelMatches = isAllowedModel(apiPath, model);
  const requestReady =
    Boolean(apiKey.trim()) &&
    Boolean(prompt.trim()) &&
    Boolean(imageUrl.trim()) &&
    Boolean(videoUrl.trim()) &&
    baseUrlMatches &&
    modelMatches &&
    duration >= 4 &&
    duration <= 15 &&
    costConfirmed &&
    !active;
  const upstreamRequestBody = useMemo(
    () =>
      buildUpstreamRequestBody({
        model,
        prompt,
        imageUrl,
        videoUrl,
        ratio,
        duration,
        generateAudio,
        watermark,
      }),
    [
      duration,
      generateAudio,
      imageUrl,
      model,
      prompt,
      ratio,
      videoUrl,
      watermark,
    ],
  );
  const upstreamRequestBodyJson = useMemo(
    () => JSON.stringify(upstreamRequestBody, null, 2),
    [upstreamRequestBody],
  );
  const createEndpoint = `${baseUrl.replace(/\/$/, "")}/contents/generations/tasks`;
  const selectedLogRecord =
    history.find((record) => record.id === logRecordId) ?? null;

  const taskStatusLabel = useMemo(() => {
    const labels: Record<TaskStatus, string> = {
      draft: "待确认",
      submitting: "正在创建",
      queued: "已排队",
      running: "生成中",
      succeeded: "已完成",
      failed: "失败",
    };
    return labels[taskStatus];
  }, [taskStatus]);

  const upsertHistory = useCallback((record: HistoryRecord) => {
    setHistory((current) =>
      [record, ...current.filter((item) => item.id !== record.id)].slice(
        0,
        MAX_HISTORY_RECORDS,
      ),
    );
  }, []);

  const patchHistory = useCallback(
    (id: string, patch: Partial<HistoryRecord>) => {
      setHistory((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, ...patch, updatedAt: new Date().toISOString() }
            : item,
        ),
      );
    },
    [],
  );

  const appendHistoryLog = useCallback(
    (
      id: string,
      log: TaskLogEntry,
      patch: Partial<HistoryRecord> = {},
    ) => {
      setHistory((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                ...patch,
                logs: [...(item.logs ?? []), log],
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const storedHistory = readHistory();
      const credentials = readCredentials();
      setHistory(storedHistory);

      const activeRecord = storedHistory.find(
        (item) =>
          (item.status === "queued" || item.status === "running") &&
          Boolean(credentials[item.apiPath]),
      );

      if (activeRecord) {
        restoreRecord(activeRecord, credentials[activeRecord.apiPath] ?? "");
      } else if (credentials.official) {
        setApiKey(credentials.official ?? "");
      }
      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    writeHistory(history);
  }, [history, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    const credentials = readCredentials();
    if (rememberApiKey && apiKey.trim()) {
      credentials[apiPath] = apiKey;
    } else {
      delete credentials[apiPath];
    }
    writeCredentials(credentials);
  }, [apiKey, apiPath, rememberApiKey, storageReady]);

  function selectPath(nextPath: ApiPath) {
    if (active) return;
    const nextConfig = API_PATHS[nextPath];
    setApiPath(nextPath);
    setBaseUrl(nextConfig.baseUrl);
    setModel(nextConfig.defaultModel);
    setApiKey(rememberApiKey ? (readCredentials()[nextPath] ?? "") : "");
    setShowApiKey(false);
    resetTaskResult();
  }

  function restoreRecord(record: HistoryRecord, rememberedKey: string) {
    setApiPath(record.apiPath);
    setBaseUrl(record.baseUrl);
    setModel(record.model);
    setApiKey(rememberedKey);
    setPrompt(record.prompt);
    setImageUrl(record.imageUrl);
    setVideoUrl(record.referenceVideoUrl);
    setRatio(record.ratio);
    setDuration(record.duration);
    setGenerateAudio(record.generateAudio);
    setWatermark(record.watermark);
    setTaskStatus(record.status);
    setTaskId(record.taskId ?? record.id);
    setActiveHistoryId(record.id);
    setResultVideoUrl(record.resultVideoUrl ?? "");
    setTaskError(record.error ?? "");
    setNextPollIn(
      record.status === "queued" || record.status === "running"
        ? POLL_SECONDS
        : null,
    );
    setCostConfirmed(false);
    setPollCycle((current) => current + 1);
  }

  function resetTaskResult() {
    setCostConfirmed(false);
    setTaskStatus("draft");
    setTaskId("");
    setActiveHistoryId("");
    setResultVideoUrl("");
    setTaskError("");
    setNextPollIn(null);
  }

  const connectionPayload = useCallback(
    () => ({ apiPath, baseUrl, model, apiKey }),
    [apiPath, apiKey, baseUrl, model],
  );

  const pollTask = useCallback(async () => {
    if (!taskId || !apiKey || pollingRef.current) return;
    pollingRef.current = true;
    const historyRecordId = activeHistoryId || taskId;
    const statusRequest: TaskLogEntry["request"] = {
      method: "GET",
      url: `${baseUrl.replace(/\/$/, "")}/contents/generations/tasks/${encodeURIComponent(taskId)}`,
      headers: {
        authorization: `Bearer ${maskApiKey(apiKey)}`,
        "content-type": "application/json",
      },
    };
    let capturedStatusResponse: TaskLogEntry["response"];

    try {
      const response = await fetch("/api/seedance/tasks/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          ...connectionPayload(),
          taskId,
        }),
      });
      const payload = (await response.json()) as TaskResponse;
      capturedStatusResponse = {
        httpStatus: response.status,
        body: payload,
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "查询任务状态失败。");
      }

      const normalizedStatus = normalizeStatus(payload.status);
      setTaskStatus(normalizedStatus);
      setTaskError(payload.error ?? "");
      if (payload.videoUrl) setResultVideoUrl(payload.videoUrl);
      appendHistoryLog(
        historyRecordId,
        {
          at: new Date().toISOString(),
          phase: "status",
          request: statusRequest,
          response: capturedStatusResponse,
        },
        {
          status: normalizedStatus,
          resultVideoUrl: payload.videoUrl,
          error: payload.error,
        },
      );
      if (normalizedStatus === "succeeded" || normalizedStatus === "failed") {
        if (!rememberApiKey) {
          setApiKey("");
          setShowApiKey(false);
        }
        setNextPollIn(null);
      } else {
        setNextPollIn(POLL_SECONDS);
        setPollCycle((current) => current + 1);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "查询任务状态失败。";
      const retryMessage = `状态查询暂时失败，将在 30 秒后重试：${message}`;
      setTaskStatus("running");
      setTaskError(retryMessage);
      appendHistoryLog(
        historyRecordId,
        {
          at: new Date().toISOString(),
          phase: "status",
          request: statusRequest,
          response: capturedStatusResponse,
          error: message,
        },
        { status: "running", error: retryMessage },
      );
      setNextPollIn(POLL_SECONDS);
      setPollCycle((current) => current + 1);
    } finally {
      pollingRef.current = false;
    }
  }, [
    apiKey,
    activeHistoryId,
    appendHistoryLog,
    baseUrl,
    connectionPayload,
    rememberApiKey,
    taskId,
  ]);

  useEffect(() => {
    if (!taskId || (taskStatus !== "queued" && taskStatus !== "running")) {
      return;
    }

    const countdown = window.setInterval(() => {
      setNextPollIn((current) =>
        current === null ? null : Math.max(0, current - 1),
      );
    }, 1_000);
    const pollTimer = window.setTimeout(() => {
      void pollTask();
    }, POLL_SECONDS * 1_000);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(pollTimer);
    };
  }, [pollCycle, pollTask, taskId, taskStatus]);

  function applyApiBodyDraft() {
    try {
      const next = parseEditableApiBody(apiBodyDraft, apiPath);
      setModel(next.model);
      setPrompt(next.prompt);
      setImageUrl(next.imageUrl);
      setVideoUrl(next.videoUrl);
      setRatio(next.ratio);
      setDuration(next.duration);
      setGenerateAudio(next.generateAudio);
      setWatermark(next.watermark);
      setApiBodyEditing(false);
      setApiBodyError("");
      resetTaskResult();
    } catch (error) {
      setApiBodyError(
        error instanceof Error ? error.message : "API 请求体格式不正确。",
      );
    }
  }

  function resetApiBodyDraft() {
    setApiBodyDraft(upstreamRequestBodyJson);
    setApiBodyEditing(false);
    setApiBodyError("");
  }

  async function createTask() {
    if (!requestReady) return;

    const attemptId = createLocalHistoryId();
    const submittedAt = new Date().toISOString();
    const createRequestLog: TaskLogEntry = {
      at: submittedAt,
      phase: "create",
      request: {
        method: "POST",
        url: createEndpoint,
        headers: {
          authorization: `Bearer ${maskApiKey(apiKey)}`,
          "content-type": "application/json",
        },
        body: upstreamRequestBody,
      },
    };
    let capturedResponse: TaskLogEntry["response"];

    setTaskStatus("submitting");
    setTaskError("");
    setResultVideoUrl("");
    setTaskId("");
    setActiveHistoryId(attemptId);
    upsertHistory({
      id: attemptId,
      createdAt: submittedAt,
      updatedAt: submittedAt,
      apiPath,
      baseUrl,
      model,
      prompt,
      imageUrl,
      referenceVideoUrl: videoUrl,
      ratio,
      duration,
      generateAudio,
      watermark,
      status: "submitting",
      logs: [createRequestLog],
    });

    try {
      const response = await fetch("/api/seedance/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          ...connectionPayload(),
          prompt,
          imageUrl,
          videoUrl,
          ratio,
          duration,
          generateAudio,
          watermark,
        }),
      });
      const payload = (await response.json()) as TaskResponse;
      capturedResponse = {
        httpStatus: response.status,
        body: payload,
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "创建任务失败。");
      }
      if (!payload.id) {
        throw new Error("任务已提交，但响应中没有任务 ID。");
      }

      const normalizedStatus = normalizeStatus(payload.status);
      setTaskId(payload.id);
      setTaskStatus(normalizedStatus);
      patchHistory(attemptId, {
        taskId: payload.id,
        status: normalizedStatus,
        logs: [{ ...createRequestLog, response: capturedResponse }],
      });
      if (normalizedStatus === "queued" || normalizedStatus === "running") {
        setNextPollIn(POLL_SECONDS);
        setPollCycle((current) => current + 1);
      }
      setCostConfirmed(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "创建任务失败。";
      setTaskStatus("failed");
      setTaskError(message);
      patchHistory(attemptId, {
        status: "failed",
        error: message,
        logs: [
          {
            ...createRequestLog,
            response: capturedResponse,
            error: capturedResponse ? undefined : message,
          },
        ],
      });
    }
  }

  return (
    <div className="task-runner">
      <section className="api-config-panel" aria-labelledby="connection-heading">
        <div className="config-panel-heading">
          <div>
            <span className="config-kicker">CONNECTION PROFILE</span>
            <h3 id="connection-heading">连接与凭证</h3>
          </div>
          <span className={`path-badge path-${apiPath}`}>
            {apiPath === "agent-plan" ? "PLAN" : "STANDARD"}
          </span>
        </div>

        <div className="config-fields">
          <label className="config-field">
            <span>API 路径</span>
            <select
              id="api-path"
              value={apiPath}
              onChange={(event) => selectPath(event.target.value as ApiPath)}
              disabled={active}
            >
              <option value="official">{API_PATHS.official.label}</option>
              <option value="agent-plan">{API_PATHS["agent-plan"].label}</option>
            </select>
            <small>{selectedPath.billing}</small>
          </label>

          <label className="config-field">
            <span>模型</span>
            <select
              aria-label="模型"
              value={model}
              onChange={(event) => {
                setModel(event.target.value);
                resetTaskResult();
              }}
              disabled={active}
            >
              {selectedPath.models.map((modelOption) => (
                <option key={modelOption.value} value={modelOption.value}>
                  {modelOption.label} · {modelOption.value}
                </option>
              ))}
            </select>
            <small>
              模型必须属于当前路径；即将下线的模型只用于兼容已有任务。
            </small>
          </label>

          <label className="config-field config-field-wide">
            <span>Base URL</span>
            <input
              aria-label="Base URL"
              type="url"
              value={baseUrl}
              onChange={(event) => {
                setBaseUrl(event.target.value);
                resetTaskResult();
              }}
              autoComplete="off"
              spellCheck={false}
              disabled={active}
            />
            <small className={baseUrlMatches ? undefined : "field-error"}>
              {baseUrlMatches
                ? `${selectedPath.label} 地址校验通过。`
                : `为防止密钥被发送到未知主机，执行时必须使用 ${selectedPath.baseUrl}。`}
            </small>
          </label>

          <div className="config-field config-field-wide">
            <label htmlFor="api-key">
              API Key
              <code>{selectedPath.keyName}</code>
            </label>
            <div className="secret-input">
              <input
                id="api-key"
                aria-label={`${selectedPath.label} API Key`}
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(event) => {
                  setApiKey(event.target.value);
                  setCostConfirmed(false);
                }}
                placeholder={`填写 ${selectedPath.keyName}`}
                autoComplete="off"
                spellCheck={false}
                disabled={active}
              />
              <button
                type="button"
                aria-pressed={showApiKey}
                onClick={() => setShowApiKey((current) => !current)}
                disabled={!apiKey || active}
              >
                {showApiKey ? "隐藏" : "显示"}
              </button>
            </div>
            <small>
              {rememberApiKey
                ? "演示模式已开启：Key 会保存在当前浏览器，刷新后自动恢复。"
                : "仅在当前页面内存和本次同源请求中使用。"}
            </small>
            <label className="remember-field">
              <input
                type="checkbox"
                checked={rememberApiKey}
                onChange={(event) => setRememberApiKey(event.target.checked)}
                disabled={active}
              />
              <span>
                <strong>演示模式：在当前浏览器记住 API Key</strong>
                <small>仅建议用于受控的个人演示设备。</small>
              </span>
            </label>
          </div>
        </div>

        <div className="config-summary">
          <span aria-hidden="true">→</span>
          <p>
            <strong>任务创建地址</strong>
            <code>
              {baseUrl.replace(/\/$/, "")}/contents/generations/tasks
            </code>
          </p>
        </div>
      </section>

      <section className="request-panel" aria-labelledby="request-heading">
        <div className="request-panel-heading">
          <div>
            <span className="config-kicker">TASK PAYLOAD</span>
            <h3 id="request-heading">视频编辑请求</h3>
          </div>
          <span className="request-mode">REAL API</span>
        </div>

        <div className="request-fields">
          <label className="request-field request-field-wide">
            <span>提示词</span>
            <textarea
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                resetTaskResult();
              }}
              rows={3}
              disabled={active}
            />
          </label>

          <label className="request-field request-field-wide">
            <span>参考图片 URL</span>
            <input
              type="url"
              value={imageUrl}
              onChange={(event) => {
                setImageUrl(event.target.value);
                resetTaskResult();
              }}
              disabled={active}
              spellCheck={false}
            />
            <small>作为 reference_image，必须是公网可访问的 HTTPS URL。</small>
          </label>

          <label className="request-field request-field-wide">
            <span>参考视频 URL</span>
            <input
              type="url"
              value={videoUrl}
              onChange={(event) => {
                setVideoUrl(event.target.value);
                resetTaskResult();
              }}
              disabled={active}
              spellCheck={false}
            />
            <small>作为 reference_video，必须是公网可访问的 HTTPS URL。</small>
          </label>

          <label className="request-field">
            <span>宽高比</span>
            <select
              value={ratio}
              onChange={(event) => {
                setRatio(event.target.value as (typeof RATIOS)[number]);
                resetTaskResult();
              }}
              disabled={active}
            >
              {RATIOS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="request-field">
            <span>时长</span>
            <select
              value={duration}
              onChange={(event) => {
                setDuration(Number(event.target.value));
                resetTaskResult();
              }}
              disabled={active}
            >
              {Array.from({ length: 12 }, (_, index) => index + 4).map(
                (seconds) => (
                  <option key={seconds} value={seconds}>
                    {seconds} 秒
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="toggle-field">
            <input
              type="checkbox"
              checked={generateAudio}
              onChange={(event) => {
                setGenerateAudio(event.target.checked);
                resetTaskResult();
              }}
              disabled={active}
            />
            <span>
              <strong>生成音频</strong>
              <small>generate_audio: {String(generateAudio)}</small>
            </span>
          </label>

          <label className="toggle-field">
            <input
              type="checkbox"
              checked={watermark}
              onChange={(event) => {
                setWatermark(event.target.checked);
                resetTaskResult();
              }}
              disabled={active}
            />
            <span>
              <strong>添加水印</strong>
              <small>watermark: {String(watermark)}</small>
            </span>
          </label>
        </div>
      </section>

      <section
        className="api-details-panel"
        aria-labelledby="api-details-heading"
      >
        <div className="api-details-heading">
          <div>
            <span className="config-kicker">LIVE API REQUEST</span>
            <h3 id="api-details-heading">完整 API 请求详情</h3>
          </div>
          <span className="sync-badge">双向联动</span>
        </div>

        <div className="api-meta-grid">
          <div>
            <span>Method</span>
            <code>POST</code>
          </div>
          <label>
            <span>Request URL</span>
            <input
              aria-label="完整 API Request URL"
              value={createEndpoint}
              readOnly
            />
          </label>
          <label>
            <span>Content-Type</span>
            <input value="application/json" readOnly />
          </label>
          <label>
            <span>Authorization</span>
            <input
              aria-label="Authorization 请求头"
              value={
                apiKey
                  ? `Bearer ${showApiKey ? apiKey : maskApiKey(apiKey)}`
                  : "Bearer <待填写 API Key>"
              }
              readOnly
            />
          </label>
        </div>

        <div className="api-body-editor">
          <div className="api-body-toolbar">
            <div>
              <strong>Request Body</strong>
              <span>编辑 JSON 后点击“应用参数”，上方控件会同步更新。</span>
            </div>
            <div>
              <button
                type="button"
                onClick={resetApiBodyDraft}
                disabled={active}
              >
                恢复当前配置
              </button>
              <button
                className="apply-api-button"
                type="button"
                onClick={applyApiBodyDraft}
                disabled={active || !apiBodyEditing}
              >
                应用参数
              </button>
            </div>
          </div>
          <textarea
            aria-label="完整 API 请求体"
            value={apiBodyEditing ? apiBodyDraft : upstreamRequestBodyJson}
            onFocus={() => {
              if (!apiBodyEditing) {
                setApiBodyDraft(upstreamRequestBodyJson);
                setApiBodyEditing(true);
              }
            }}
            onChange={(event) => {
              setApiBodyDraft(event.target.value);
              setApiBodyEditing(true);
              setApiBodyError("");
            }}
            rows={22}
            spellCheck={false}
            disabled={active}
          />
          <p className={apiBodyError ? "api-body-error" : "api-body-hint"}>
            {apiBodyError ||
              "模型、提示词、素材、比例、时长、音频与水印参数和上方表单共用同一份状态。"}
          </p>
        </div>
      </section>

      <section className="execution-panel" aria-labelledby="execution-heading">
        <div className="execution-summary">
          <div>
            <span className="config-kicker">FINAL REVIEW</span>
            <h3 id="execution-heading">提交前确认</h3>
          </div>
          <span className={`task-status status-${taskStatus}`}>
            {taskStatusLabel}
          </span>
        </div>

        <dl className="review-grid">
          <div>
            <dt>路径</dt>
            <dd>{apiPath === "agent-plan" ? "Agent Plan" : "标准 API"}</dd>
          </div>
          <div>
            <dt>模型</dt>
            <dd>{model}</dd>
          </div>
          <div>
            <dt>素材</dt>
            <dd>1 张图片 + 1 段视频</dd>
          </div>
          <div>
            <dt>输出</dt>
            <dd>
              {ratio} · {duration} 秒 · {generateAudio ? "有声" : "无声"} ·{" "}
              {watermark ? "有水印" : "无水印"}
            </dd>
          </div>
        </dl>

        {!active && taskStatus !== "succeeded" && (
          <label className="cost-confirmation">
            <input
              type="checkbox"
              checked={costConfirmed}
              onChange={(event) => setCostConfirmed(event.target.checked)}
            />
            <span>
              我确认上述路径、模型、素材与输出参数无误，并理解点击后会创建真实任务、消耗套餐额度或产生费用。
            </span>
          </label>
        )}

        <div className="execution-actions">
          <button
            className="execute-button"
            type="button"
            onClick={() => void createTask()}
            disabled={!requestReady}
          >
            {taskStatus === "submitting"
              ? "正在创建任务…"
              : "执行真实视频生成任务"}
          </button>
          {active && taskId && (
            <button
              className="refresh-status-button"
              type="button"
              onClick={() => void pollTask()}
            >
              立即查询状态
            </button>
          )}
          <span>
            {active
              ? "任务参数已锁定。"
              : "按钮只在全部字段有效且完成费用确认后启用。"}
          </span>
        </div>

        <div className="task-timeline" aria-live="polite">
          <div className={taskId ? "timeline-step is-done" : "timeline-step"}>
            <span>01</span>
            <p>
              <strong>创建任务</strong>
              {taskId ? `任务 ID：${taskId}` : "等待点击执行"}
            </p>
          </div>
          <div
            className={
              taskStatus === "queued" || taskStatus === "running"
                ? "timeline-step is-current"
                : taskStatus === "succeeded" || taskStatus === "failed"
                  ? "timeline-step is-done"
                  : "timeline-step"
            }
          >
            <span>02</span>
            <p>
              <strong>轮询状态</strong>
              {nextPollIn !== null
                ? `${nextPollIn} 秒后再次查询`
                : "每 30 秒查询一次"}
            </p>
          </div>
          <div
            className={
              taskStatus === "succeeded"
                ? "timeline-step is-done"
                : taskStatus === "failed"
                  ? "timeline-step is-error"
                  : "timeline-step"
            }
          >
            <span>03</span>
            <p>
              <strong>{taskStatus === "failed" ? "任务失败" : "取得结果"}</strong>
              {taskError ||
                (resultVideoUrl ? "视频 URL 已返回" : "等待生成完成")}
            </p>
          </div>
        </div>

        {resultVideoUrl && (
          <div className="result-card">
            <video src={resultVideoUrl} controls playsInline preload="metadata" />
            <a href={resultVideoUrl} target="_blank" rel="noreferrer">
              在新窗口打开结果视频 ↗
            </a>
          </div>
        )}
      </section>

      <section className="history-panel" aria-labelledby="history-heading">
        <div className="history-heading">
          <div>
            <span className="config-kicker">LOCAL HISTORY</span>
            <h3 id="history-heading">历史任务</h3>
          </div>
          <div className="history-actions">
            <span>{history.length} 条</span>
            {history.length > 0 && (
              <button type="button" onClick={() => setHistory([])}>
                清空本机记录
              </button>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <p className="empty-history">
            暂无历史任务。成功取得任务 ID 后会自动保存在当前浏览器。
          </p>
        ) : (
          <ol className="history-list">
            {history.map((record) => (
              <li key={record.id}>
                <div className="history-record-topline">
                  <div>
                    <span
                      className={`task-status status-${record.status}`}
                    >
                      {statusLabel(record.status)}
                    </span>
                    <time dateTime={record.createdAt}>
                      {formatHistoryTime(record.createdAt)}
                    </time>
                  </div>
                  <div className="history-record-actions">
                    <button
                      type="button"
                      onClick={() => setLogRecordId(record.id)}
                    >
                      查看日志
                    </button>
                    {(record.status === "queued" ||
                      record.status === "running") && (
                      <button
                        type="button"
                        onClick={() =>
                          restoreRecord(
                            record,
                            readCredentials()[record.apiPath] ?? "",
                          )
                        }
                      >
                        恢复轮询
                      </button>
                    )}
                  </div>
                </div>
                <code>{displayTaskId(record)}</code>
                <p>
                  {record.apiPath === "agent-plan" ? "Agent Plan" : "标准 API"} ·{" "}
                  {record.model} · {record.ratio} · {record.duration} 秒
                </p>
                {record.error && (
                  <p className="history-error">{record.error}</p>
                )}
                {record.resultVideoUrl && (
                  <a
                    href={record.resultVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    打开结果视频 ↗
                  </a>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {selectedLogRecord && (
        <div
          className="log-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLogRecordId("");
          }}
        >
          <section
            className="log-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-dialog-heading"
          >
            <div className="log-dialog-heading">
              <div>
                <span className="config-kicker">REQUEST / RESPONSE LOG</span>
                <h3 id="log-dialog-heading">任务日志</h3>
                <code>{displayTaskId(selectedLogRecord)}</code>
              </div>
              <button
                type="button"
                aria-label="关闭任务日志"
                onClick={() => setLogRecordId("")}
              >
                关闭
              </button>
            </div>

            <div className="log-dialog-content">
              {(selectedLogRecord.logs ?? []).length === 0 ? (
                <p className="empty-log">
                  此记录来自旧版本，暂无结构化请求与响应日志。
                </p>
              ) : (
                (selectedLogRecord.logs ?? []).map((log, index) => (
                  <details
                    className="log-entry"
                    key={`${log.at}-${index}`}
                    open={index === (selectedLogRecord.logs?.length ?? 1) - 1}
                  >
                    <summary>
                      <span>
                        {log.phase === "create" ? "创建任务" : "查询状态"}
                      </span>
                      <time dateTime={log.at}>{formatLogTime(log.at)}</time>
                    </summary>
                    <div className="log-block">
                      <h4>Request</h4>
                      <pre>{JSON.stringify(log.request, null, 2)}</pre>
                    </div>
                    <div className="log-block">
                      <h4>Response</h4>
                      <pre>
                        {JSON.stringify(
                          log.response ?? { error: log.error ?? "等待响应" },
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  </details>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

type EditableApiParameters = {
  model: string;
  prompt: string;
  imageUrl: string;
  videoUrl: string;
  ratio: (typeof RATIOS)[number];
  duration: number;
  generateAudio: boolean;
  watermark: boolean;
};

function buildUpstreamRequestBody(parameters: EditableApiParameters) {
  return {
    model: parameters.model,
    content: [
      {
        type: "text",
        text: parameters.prompt,
      },
      {
        type: "image_url",
        image_url: { url: parameters.imageUrl },
        role: "reference_image",
      },
      {
        type: "video_url",
        video_url: { url: parameters.videoUrl },
        role: "reference_video",
      },
    ],
    generate_audio: parameters.generateAudio,
    ratio: parameters.ratio,
    duration: parameters.duration,
    watermark: parameters.watermark,
  };
}

function parseEditableApiBody(
  raw: string,
  apiPath: ApiPath,
): EditableApiParameters {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Request Body 必须是有效 JSON。");
  }
  const body = objectValue(parsed, "Request Body");
  const model = stringValue(body.model, "model");
  if (!isAllowedModel(apiPath, model)) {
    throw new Error("model 必须属于当前 API 路径。");
  }
  if (!Array.isArray(body.content)) {
    throw new Error("content 必须是数组。");
  }

  const textItem = body.content.find(
    (item) => isRecord(item) && item.type === "text",
  );
  const imageItem = body.content.find(
    (item) => isRecord(item) && item.type === "image_url",
  );
  const videoItem = body.content.find(
    (item) => isRecord(item) && item.type === "video_url",
  );
  if (!isRecord(textItem) || !isRecord(imageItem) || !isRecord(videoItem)) {
    throw new Error("content 必须包含 text、image_url 和 video_url 三项。");
  }
  const imagePayload = objectValue(imageItem.image_url, "image_url");
  const videoPayload = objectValue(videoItem.video_url, "video_url");
  const ratio = stringValue(body.ratio, "ratio");
  if (!RATIOS.includes(ratio as (typeof RATIOS)[number])) {
    throw new Error("ratio 不在当前支持范围内。");
  }
  if (
    typeof body.duration !== "number" ||
    !Number.isInteger(body.duration) ||
    body.duration < 4 ||
    body.duration > 15
  ) {
    throw new Error("duration 必须是 4–15 的整数。");
  }
  if (
    typeof body.generate_audio !== "boolean" ||
    typeof body.watermark !== "boolean"
  ) {
    throw new Error("generate_audio 和 watermark 必须是布尔值。");
  }

  return {
    model,
    prompt: stringValue(textItem.text, "content.text"),
    imageUrl: stringValue(imagePayload.url, "image_url.url"),
    videoUrl: stringValue(videoPayload.url, "video_url.url"),
    ratio: ratio as (typeof RATIOS)[number],
    duration: body.duration,
    generateAudio: body.generate_audio,
    watermark: body.watermark,
  };
}

function objectValue(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} 必须是对象。`);
  return value;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} 不能为空。`);
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 4)}••••••••${trimmed.slice(-4)}`;
}

function createLocalHistoryId(): string {
  return `attempt-${crypto.randomUUID()}`;
}

function displayTaskId(record: HistoryRecord): string {
  if (record.taskId) return record.taskId;
  if (!record.id.startsWith("attempt-")) return record.id;
  return "未取得远端任务 ID";
}

function normalizeStatus(
  status: string | undefined,
): HistoryRecord["status"] {
  if (status === "succeeded" || status === "failed" || status === "queued") {
    return status;
  }
  return "running";
}

function statusLabel(status: HistoryRecord["status"]): string {
  const labels: Record<HistoryRecord["status"], string> = {
    submitting: "提交中",
    queued: "已排队",
    running: "生成中",
    succeeded: "已完成",
    failed: "失败",
  };
  return labels[status];
}

function readHistory(): HistoryRecord[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isHistoryRecord)
      .slice(0, MAX_HISTORY_RECORDS);
  } catch {
    return [];
  }
}

function writeHistory(records: HistoryRecord[]) {
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Private browsing or storage quotas can disable local persistence.
  }
}

function readCredentials(): RememberedCredentials {
  try {
    const raw = window.localStorage.getItem(CREDENTIAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as RememberedCredentials;
  } catch {
    return {};
  }
}

function writeCredentials(credentials: RememberedCredentials) {
  try {
    window.localStorage.setItem(
      CREDENTIAL_STORAGE_KEY,
      JSON.stringify(credentials),
    );
  } catch {
    // The UI remains usable for the current page even when storage is blocked.
  }
}

function isHistoryRecord(value: unknown): value is HistoryRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Partial<HistoryRecord>;
  return (
    typeof record.id === "string" &&
    (record.apiPath === "official" || record.apiPath === "agent-plan") &&
    typeof record.baseUrl === "string" &&
    typeof record.model === "string" &&
    typeof record.prompt === "string" &&
    typeof record.imageUrl === "string" &&
    typeof record.referenceVideoUrl === "string" &&
    RATIOS.includes(record.ratio as (typeof RATIOS)[number]) &&
    typeof record.duration === "number" &&
    typeof record.generateAudio === "boolean" &&
    typeof record.watermark === "boolean" &&
    (record.status === "queued" ||
      record.status === "submitting" ||
      record.status === "running" ||
      record.status === "succeeded" ||
      record.status === "failed") &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string"
  );
}

function formatHistoryTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatLogTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
