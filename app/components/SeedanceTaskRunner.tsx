"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  API_PATHS,
  isAllowedModel,
  RATIOS,
  type ApiPath,
} from "../lib/seedance-config";
import {
  DEFAULT_REQUEST_BODY,
  type SeedanceContentItem,
  type SeedanceExample,
  type SeedanceImageRole,
  type SeedanceMediaType,
  type SeedanceRequestBody,
  type SeedanceSequencePlan,
} from "../lib/seedance-examples";
import { APPLY_EXAMPLE_EVENT } from "./SeedanceExampleGallery";

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
  lastFrameUrl?: string;
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
  generateAudio?: boolean;
  watermark: boolean;
  status: HistoryStatus;
  resultVideoUrl?: string;
  resultLastFrameUrl?: string;
  error?: string;
  logs?: TaskLogEntry[];
  requestBody?: SeedanceRequestBody;
  exampleTitle?: string;
};

type SequenceStep = {
  prompt: string;
  status:
    | "pending"
    | "submitting"
    | "queued"
    | "running"
    | "succeeded"
    | "failed";
  taskId?: string;
  videoUrl?: string;
  lastFrameUrl?: string;
  error?: string;
};

type RememberedCredentials = Partial<Record<ApiPath, string>>;

const POLL_SECONDS = 30;
const SEQUENCE_POLL_SECONDS = 10;
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
  const [prompt, setPrompt] = useState(getPrompt(DEFAULT_REQUEST_BODY));
  const [mediaItems, setMediaItems] = useState(() =>
    getMediaItems(DEFAULT_REQUEST_BODY),
  );
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>(
    DEFAULT_REQUEST_BODY.ratio,
  );
  const [duration, setDuration] = useState(DEFAULT_REQUEST_BODY.duration);
  const [generateAudio, setGenerateAudio] = useState<boolean | undefined>(
    DEFAULT_REQUEST_BODY.generate_audio,
  );
  const [watermark, setWatermark] = useState(DEFAULT_REQUEST_BODY.watermark);
  const [resolution, setResolution] =
    useState<SeedanceRequestBody["resolution"]>();
  const [webSearch, setWebSearch] = useState(false);
  const [returnLastFrame, setReturnLastFrame] = useState(false);
  const [selectedExampleTitle, setSelectedExampleTitle] = useState(
    "官方示例任务一：把香水替换成面霜",
  );
  const [selectedSequencePlan, setSelectedSequencePlan] =
    useState<SeedanceSequencePlan>();
  const [sequenceConfirmed, setSequenceConfirmed] = useState(false);
  const [sequenceStatus, setSequenceStatus] =
    useState<"idle" | "running" | "succeeded" | "failed">("idle");
  const [sequenceError, setSequenceError] = useState("");
  const [sequenceSteps, setSequenceSteps] = useState<SequenceStep[]>([]);
  const [costConfirmed, setCostConfirmed] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("draft");
  const [taskId, setTaskId] = useState("");
  const [resultVideoUrl, setResultVideoUrl] = useState("");
  const [resultLastFrameUrl, setResultLastFrameUrl] = useState("");
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
  const singleTaskActive = ["submitting", "queued", "running"].includes(
    taskStatus,
  );
  const active = singleTaskActive || sequenceStatus === "running";
  const baseUrlMatches = baseUrl.replace(/\/$/, "") === selectedPath.baseUrl;
  const modelMatches = isAllowedModel(apiPath, model);
  const requestReady =
    Boolean(apiKey.trim()) &&
    Boolean(prompt.trim()) &&
    mediaItems.every((item) => Boolean(item.url.trim())) &&
    baseUrlMatches &&
    modelMatches &&
    duration >= 4 &&
    duration <= 15 &&
    mediaRolesValid(mediaItems) &&
    (!webSearch || mediaItems.length === 0) &&
    (resolution !== "4k" ||
      model === "doubao-seedance-2-0-260128" ||
      model === "doubao-seedance-2.0") &&
    costConfirmed &&
    !active;
  const sequenceReady =
    Boolean(selectedSequencePlan) &&
    Boolean(apiKey.trim()) &&
    apiPath === "official" &&
    baseUrlMatches &&
    modelMatches &&
    model === selectedSequencePlan?.model &&
    sequenceConfirmed &&
    !active;
  const upstreamRequestBody = useMemo(
    () =>
      buildUpstreamRequestBody({
        model,
        prompt,
        mediaItems,
        ratio,
        duration,
        generateAudio,
        watermark,
        resolution,
        webSearch,
        returnLastFrame,
      }),
    [
      duration,
      generateAudio,
      mediaItems,
      model,
      prompt,
      ratio,
      resolution,
      returnLastFrame,
      watermark,
      webSearch,
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
    // Hydration restore is intentionally a one-time action; later history changes
    // are persisted by the dedicated storage effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    function handleApplyExample(event: Event) {
      if (active) return;
      const example = (event as CustomEvent<SeedanceExample>).detail;
      if (!example?.requestBody) return;
      setApiPath("official");
      setBaseUrl(API_PATHS.official.baseUrl);
      setSelectedExampleTitle(example.title);
      setSelectedSequencePlan(example.continuousSequence);
      setSequenceSteps(
        example.continuousSequence?.prompts.map((sequencePrompt) => ({
          prompt: sequencePrompt,
          status: "pending",
        })) ?? [],
      );
      setSequenceStatus("idle");
      setSequenceError("");
      setSequenceConfirmed(false);
      applyRequestBody(example.requestBody);
    }

    window.addEventListener(APPLY_EXAMPLE_EVENT, handleApplyExample);
    return () =>
      window.removeEventListener(APPLY_EXAMPLE_EVENT, handleApplyExample);
  });

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
    if (record.requestBody) {
      applyRequestBody(record.requestBody, false);
    } else {
      setPrompt(record.prompt);
      setMediaItems(
        [
          record.imageUrl
            ? {
                type: "image_url" as const,
                url: record.imageUrl,
                role: "reference_image" as const,
              }
            : null,
          record.referenceVideoUrl
            ? {
                type: "video_url" as const,
                url: record.referenceVideoUrl,
                role: "reference_video" as const,
              }
            : null,
        ].filter(Boolean) as MediaEditorItem[],
      );
      setRatio(record.ratio);
      setDuration(record.duration);
      setGenerateAudio(record.generateAudio);
      setWatermark(record.watermark);
      setResolution(undefined);
      setWebSearch(false);
    }
    setSelectedExampleTitle(record.exampleTitle ?? "历史任务");
    setTaskStatus(record.status);
    setTaskId(record.taskId ?? record.id);
    setActiveHistoryId(record.id);
    setResultVideoUrl(record.resultVideoUrl ?? "");
    setResultLastFrameUrl(record.resultLastFrameUrl ?? "");
    setTaskError(record.error ?? "");
    setNextPollIn(
      record.status === "queued" || record.status === "running"
        ? POLL_SECONDS
        : null,
    );
    setCostConfirmed(false);
    setPollCycle((current) => current + 1);
  }

  function applyRequestBody(
    body: SeedanceRequestBody,
    shouldReset = true,
  ) {
    setModel(body.model);
    setPrompt(getPrompt(body));
    setMediaItems(getMediaItems(body));
    setRatio(body.ratio);
    setDuration(body.duration);
    setGenerateAudio(body.generate_audio);
    setWatermark(body.watermark);
    setResolution(body.resolution);
    setWebSearch(body.tools?.some((tool) => tool.type === "web_search") ?? false);
    setReturnLastFrame(body.return_last_frame ?? false);
    setApiBodyEditing(false);
    setApiBodyError("");
    if (shouldReset) resetTaskResult();
  }

  function resetTaskResult() {
    setCostConfirmed(false);
    setTaskStatus("draft");
    setTaskId("");
    setActiveHistoryId("");
    setResultVideoUrl("");
    setResultLastFrameUrl("");
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
      if (payload.lastFrameUrl) setResultLastFrameUrl(payload.lastFrameUrl);
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
          resultLastFrameUrl: payload.lastFrameUrl,
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
      applyRequestBody(next);
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
    setResultLastFrameUrl("");
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
      imageUrl: mediaItems.find((item) => item.type === "image_url")?.url ?? "",
      referenceVideoUrl:
        mediaItems.find((item) => item.type === "video_url")?.url ?? "",
      ratio,
      duration,
      generateAudio,
      watermark,
      requestBody: upstreamRequestBody,
      exampleTitle: selectedExampleTitle,
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
          requestBody: upstreamRequestBody,
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

  function patchSequenceStep(index: number, patch: Partial<SequenceStep>) {
    setSequenceSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch } : step,
      ),
    );
  }

  async function runContinuousSequence() {
    const plan = selectedSequencePlan;
    if (!plan || !sequenceReady) return;

    setSequenceStatus("running");
    setSequenceError("");
    setSequenceSteps(
      plan.prompts.map((sequencePrompt) => ({
        prompt: sequencePrompt,
        status: "pending",
      })),
    );

    let currentFrameUrl = plan.initialImageUrl;

    try {
      for (const [index, sequencePrompt] of plan.prompts.entries()) {
        const attemptId = createLocalHistoryId();
        const submittedAt = new Date().toISOString();
        const sequenceTitle = `生成多个连续视频 · 第 ${index + 1}/${plan.prompts.length} 段`;
        const requestBody: SeedanceRequestBody = {
          model: plan.model,
          content: [
            { type: "text", text: sequencePrompt },
            {
              type: "image_url",
              image_url: { url: currentFrameUrl },
            },
          ],
          return_last_frame: true,
          ratio: plan.ratio,
          duration: plan.duration,
          watermark: plan.watermark,
        };
        const createRequest: TaskLogEntry["request"] = {
          method: "POST",
          url: createEndpoint,
          headers: {
            authorization: `Bearer ${maskApiKey(apiKey)}`,
            "content-type": "application/json",
          },
          body: requestBody,
        };
        const createLog: TaskLogEntry = {
          at: submittedAt,
          phase: "create",
          request: createRequest,
        };

        patchSequenceStep(index, { status: "submitting", error: undefined });
        upsertHistory({
          id: attemptId,
          createdAt: submittedAt,
          updatedAt: submittedAt,
          apiPath,
          baseUrl,
          model: plan.model,
          prompt: sequencePrompt,
          imageUrl: currentFrameUrl,
          referenceVideoUrl: "",
          ratio: plan.ratio,
          duration: plan.duration,
          watermark: plan.watermark,
          requestBody,
          exampleTitle: sequenceTitle,
          status: "submitting",
          logs: [createLog],
        });

        let taskPayload: TaskResponse = {};
        let taskHttpStatus = 0;
        try {
          const response = await fetch("/api/seedance/tasks", {
            method: "POST",
            headers: { "content-type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              ...connectionPayload(),
              model: plan.model,
              requestBody,
            }),
          });
          taskHttpStatus = response.status;
          taskPayload = (await response.json()) as TaskResponse;
          if (!response.ok) {
            throw new Error(taskPayload.error ?? "创建连续视频任务失败。");
          }
          if (!taskPayload.id) {
            throw new Error("连续视频任务已提交，但响应中没有任务 ID。");
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "创建连续视频任务失败。";
          patchHistory(attemptId, {
            status: "failed",
            error: message,
            logs: [
              {
                ...createLog,
                response: taskHttpStatus
                  ? { httpStatus: taskHttpStatus, body: taskPayload! }
                  : undefined,
                error: taskHttpStatus ? undefined : message,
              },
            ],
          });
          patchSequenceStep(index, { status: "failed", error: message });
          throw error;
        }

        const remoteTaskId = taskPayload.id;
        let normalizedStatus = normalizeStatus(taskPayload.status);
        patchHistory(attemptId, {
          taskId: remoteTaskId,
          status: normalizedStatus,
          logs: [
            {
              ...createLog,
              response: { httpStatus: taskHttpStatus, body: taskPayload },
            },
          ],
        });
        patchSequenceStep(index, {
          status: normalizedStatus,
          taskId: remoteTaskId,
        });

        let consecutiveStatusErrors = 0;
        while (
          normalizedStatus === "queued" ||
          normalizedStatus === "running"
        ) {
          await wait(SEQUENCE_POLL_SECONDS * 1_000);
          const statusRequest: TaskLogEntry["request"] = {
            method: "GET",
            url: `${baseUrl.replace(/\/$/, "")}/contents/generations/tasks/${encodeURIComponent(remoteTaskId)}`,
            headers: {
              authorization: `Bearer ${maskApiKey(apiKey)}`,
              "content-type": "application/json",
            },
          };
          let responseStatus = 0;
          try {
            const response = await fetch("/api/seedance/tasks/status", {
              method: "POST",
              headers: { "content-type": "application/json" },
              cache: "no-store",
              body: JSON.stringify({
                ...connectionPayload(),
                model: plan.model,
                taskId: remoteTaskId,
              }),
            });
            responseStatus = response.status;
            taskPayload = (await response.json()) as TaskResponse;
            if (!response.ok) {
              throw new Error(taskPayload.error ?? "查询连续视频任务失败。");
            }
            consecutiveStatusErrors = 0;
            normalizedStatus = normalizeStatus(taskPayload.status);
            appendHistoryLog(
              attemptId,
              {
                at: new Date().toISOString(),
                phase: "status",
                request: statusRequest,
                response: {
                  httpStatus: response.status,
                  body: taskPayload,
                },
              },
              {
                status: normalizedStatus,
                resultVideoUrl: taskPayload.videoUrl,
                resultLastFrameUrl: taskPayload.lastFrameUrl,
                error: taskPayload.error,
              },
            );
            patchSequenceStep(index, {
              status: normalizedStatus,
              videoUrl: taskPayload.videoUrl,
              lastFrameUrl: taskPayload.lastFrameUrl,
              error: taskPayload.error,
            });
          } catch (error) {
            consecutiveStatusErrors += 1;
            const message =
              error instanceof Error ? error.message : "查询连续视频任务失败。";
            appendHistoryLog(attemptId, {
              at: new Date().toISOString(),
              phase: "status",
              request: statusRequest,
              response: responseStatus
                ? { httpStatus: responseStatus, body: taskPayload }
                : undefined,
              error: message,
            });
            if (consecutiveStatusErrors >= 3) {
              patchHistory(attemptId, { status: "failed", error: message });
              patchSequenceStep(index, { status: "failed", error: message });
              throw error;
            }
          }
        }

        if (normalizedStatus === "failed") {
          throw new Error(taskPayload.error ?? `第 ${index + 1} 段生成失败。`);
        }
        if (!taskPayload.videoUrl || !taskPayload.lastFrameUrl) {
          const message = `第 ${index + 1} 段未同时返回视频和尾帧，无法继续串联。`;
          patchHistory(attemptId, { error: message });
          patchSequenceStep(index, { status: "failed", error: message });
          throw new Error(message);
        }

        currentFrameUrl = taskPayload.lastFrameUrl;
      }

      setSequenceStatus("succeeded");
      setSequenceConfirmed(false);
      if (!rememberApiKey) {
        setApiKey("");
        setShowApiKey(false);
      }
    } catch (error) {
      setSequenceStatus("failed");
      setSequenceError(
        error instanceof Error ? error.message : "连续视频生成失败。",
      );
    }
  }

  function updateMediaItem(index: number, patch: Partial<MediaEditorItem>) {
    setMediaItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
    resetTaskResult();
  }

  function addMediaItem(type: SeedanceMediaType) {
    const roles = {
      image_url: "reference_image",
      video_url: "reference_video",
      audio_url: "reference_audio",
    } as const;
    setMediaItems((current) => [
      ...current,
      { type, url: "", role: roles[type] },
    ]);
    resetTaskResult();
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
            <h3 id="request-heading">{selectedExampleTitle}</h3>
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

          <div className="request-field request-field-wide">
            <span>多模态素材</span>
            <div className="media-editor-list">
              {mediaItems.length === 0 ? (
                <p>当前为纯文本输入，没有参考素材。</p>
              ) : (
                mediaItems.map((item, index) => (
                  <div className="media-editor-row" key={`${item.type}-${index}`}>
                    <select
                      aria-label={`素材 ${index + 1} 类型`}
                      value={item.type}
                      onChange={(event) => {
                        const type = event.target.value as SeedanceMediaType;
                        const roles = {
                          image_url: "reference_image",
                          video_url: "reference_video",
                          audio_url: "reference_audio",
                        } as const;
                        updateMediaItem(index, { type, role: roles[type] });
                      }}
                      disabled={active}
                    >
                      <option value="image_url">图片</option>
                      <option value="video_url">视频</option>
                      <option value="audio_url">音频</option>
                    </select>
                    <select
                      aria-label={`素材 ${index + 1} 角色`}
                      value={item.role ?? ""}
                      onChange={(event) =>
                        updateMediaItem(index, {
                          role:
                            (event.target.value ||
                              undefined) as MediaEditorItem["role"],
                        })
                      }
                      disabled={active || item.type !== "image_url"}
                    >
                      {item.type === "image_url" ? (
                        <>
                          <option value="">自动识别</option>
                          <option value="reference_image">参考图</option>
                          <option value="first_frame">首帧</option>
                          <option value="last_frame">尾帧</option>
                        </>
                      ) : item.type === "video_url" ? (
                        <option value="reference_video">参考视频</option>
                      ) : (
                        <option value="reference_audio">参考音频</option>
                      )}
                    </select>
                    <input
                      aria-label={`素材 ${index + 1} URL`}
                      type="url"
                      value={item.url}
                      onChange={(event) =>
                        updateMediaItem(index, { url: event.target.value })
                      }
                      disabled={active}
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      aria-label={`删除素材 ${index + 1}`}
                      onClick={() => {
                        setMediaItems((current) =>
                          current.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        );
                        resetTaskResult();
                      }}
                      disabled={active}
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="media-editor-actions">
              <button type="button" onClick={() => addMediaItem("image_url")} disabled={active}>
                + 图片
              </button>
              <button type="button" onClick={() => addMediaItem("video_url")} disabled={active}>
                + 视频
              </button>
              <button type="button" onClick={() => addMediaItem("audio_url")} disabled={active}>
                + 音频
              </button>
            </div>
            <small>
              支持最多 9 张图片、3 段视频和 3 段音频；素材可使用公网 HTTPS URL，
              图片还支持官方预置人像的 asset://asset-* ID。首尾帧模式必须各有一张
              first_frame 与 last_frame。
            </small>
          </div>

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

          <label className="request-field">
            <span>分辨率</span>
            <select
              value={resolution ?? ""}
              onChange={(event) => {
                setResolution(
                  (event.target.value || undefined) as
                    | SeedanceRequestBody["resolution"]
                    | undefined,
                );
                resetTaskResult();
              }}
              disabled={active}
            >
              <option value="">模型默认</option>
              <option value="480p">480p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
              <option value="4k">4K</option>
            </select>
          </label>

          <label className="request-field">
            <span>生成音频</span>
            <select
              value={
                generateAudio === undefined ? "" : String(generateAudio)
              }
              onChange={(event) => {
                setGenerateAudio(
                  event.target.value === ""
                    ? undefined
                    : event.target.value === "true",
                );
                resetTaskResult();
              }}
              disabled={active}
            >
              <option value="">不传参数</option>
              <option value="true">是</option>
              <option value="false">否</option>
            </select>
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

          <label className="toggle-field">
            <input
              type="checkbox"
              checked={webSearch}
              onChange={(event) => {
                setWebSearch(event.target.checked);
                resetTaskResult();
              }}
              disabled={active || mediaItems.length > 0}
            />
            <span>
              <strong>联网搜索</strong>
              <small>tools: web_search（仅纯文本）</small>
            </span>
          </label>

          <label className="toggle-field">
            <input
              type="checkbox"
              checked={returnLastFrame}
              onChange={(event) => {
                setReturnLastFrame(event.target.checked);
                resetTaskResult();
              }}
              disabled={active}
            />
            <span>
              <strong>返回尾帧</strong>
              <small>return_last_frame: {String(returnLastFrame)}</small>
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
            <dd>{mediaSummary(mediaItems)}</dd>
          </div>
          <div>
            <dt>输出</dt>
            <dd>
              {ratio} · {duration} 秒
              {resolution ? ` · ${resolution.toUpperCase()}` : ""} ·{" "}
              {generateAudio === undefined
                ? "音频由模型默认"
                : generateAudio
                  ? "有声"
                  : "无声"}{" "}
              · {watermark ? "有水印" : "无水印"}
              {webSearch ? " · 联网搜索" : ""}
              {returnLastFrame ? " · 返回尾帧" : ""}
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
          {singleTaskActive && taskId && (
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
            {resultLastFrameUrl && (
              <a href={resultLastFrameUrl} target="_blank" rel="noreferrer">
                打开返回的尾帧图 ↗
              </a>
            )}
          </div>
        )}
      </section>

      {selectedSequencePlan && (
        <section
          className="sequence-panel"
          aria-labelledby="sequence-heading"
        >
          <div className="sequence-heading">
            <div>
              <span className="config-kicker">CONTINUOUS VIDEO CHAIN</span>
              <h3 id="sequence-heading">生成多个连续视频</h3>
            </div>
            <span className={`task-status status-${sequenceStatus}`}>
              {sequenceStatusLabel(sequenceStatus)}
            </span>
          </div>
          <div className="sequence-intro">
            <p>
              按官方示例顺序生成 {selectedSequencePlan.prompts.length} 段视频。
              每段都请求返回尾帧，并自动把该尾帧作为下一段的首帧。
            </p>
            <dl>
              <div>
                <dt>模型</dt>
                <dd>{selectedSequencePlan.model}</dd>
              </div>
              <div>
                <dt>单段输出</dt>
                <dd>
                  {selectedSequencePlan.ratio} ·{" "}
                  {selectedSequencePlan.duration} 秒 · 返回尾帧
                </dd>
              </div>
            </dl>
          </div>
          <ol className="sequence-steps">
            {sequenceSteps.map((step, index) => (
              <li
                className={`sequence-step sequence-step-${step.status}`}
                key={`${index}-${step.prompt}`}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{sequenceStepLabel(step.status)}</strong>
                  <p>{step.prompt}</p>
                  {step.taskId && <code>{step.taskId}</code>}
                  {step.error && <small>{step.error}</small>}
                  {step.videoUrl && (
                    <a href={step.videoUrl} target="_blank" rel="noreferrer">
                      打开第 {index + 1} 段视频 ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {sequenceStatus !== "running" && (
            <label className="cost-confirmation sequence-cost-confirmation">
              <input
                type="checkbox"
                checked={sequenceConfirmed}
                onChange={(event) =>
                  setSequenceConfirmed(event.target.checked)
                }
              />
              <span>
                我确认连续生成会依次创建{" "}
                {selectedSequencePlan.prompts.length} 个真实任务，并消耗对应额度或产生费用。
              </span>
            </label>
          )}
          <div className="execution-actions">
            <button
              className="execute-button"
              type="button"
              data-testid="run-continuous-sequence"
              onClick={() => void runContinuousSequence()}
              disabled={!sequenceReady}
            >
              {sequenceStatus === "running"
                ? "正在连续生成…"
                : `执行 ${selectedSequencePlan.prompts.length} 段连续视频`}
            </button>
            <span>
              {sequenceError ||
                "连续任务按顺序创建；前一段成功返回尾帧后，才会创建下一段。"}
            </span>
          </div>
        </section>
      )}

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
                {record.exampleTitle && <strong>{record.exampleTitle}</strong>}
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
                {record.resultLastFrameUrl && (
                  <a
                    href={record.resultLastFrameUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    打开尾帧图 ↗
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

type MediaEditorItem = {
  type: SeedanceMediaType;
  url: string;
  role?:
    | SeedanceImageRole
    | "reference_video"
    | "reference_audio";
};

type EditableApiParameters = {
  model: string;
  prompt: string;
  mediaItems: MediaEditorItem[];
  ratio: (typeof RATIOS)[number];
  duration: number;
  generateAudio?: boolean;
  watermark: boolean;
  resolution?: SeedanceRequestBody["resolution"];
  webSearch: boolean;
  returnLastFrame: boolean;
};

function buildUpstreamRequestBody(
  parameters: EditableApiParameters,
): SeedanceRequestBody {
  const body: SeedanceRequestBody = {
    model: parameters.model,
    content: [
      {
        type: "text",
        text: parameters.prompt,
      },
      ...parameters.mediaItems.map(mediaEditorToContent),
    ],
    ratio: parameters.ratio,
    duration: parameters.duration,
    watermark: parameters.watermark,
  };
  if (parameters.generateAudio !== undefined) {
    body.generate_audio = parameters.generateAudio;
  }
  if (parameters.resolution) body.resolution = parameters.resolution;
  if (parameters.webSearch) body.tools = [{ type: "web_search" }];
  if (parameters.returnLastFrame) body.return_last_frame = true;
  return body;
}

function parseEditableApiBody(
  raw: string,
  apiPath: ApiPath,
): SeedanceRequestBody {
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
  if (!isRecord(textItem)) throw new Error("content 必须包含一项 text。");
  const prompt = stringValue(textItem.text, "content.text");
  const mediaItems = body.content
    .filter((item) => isRecord(item) && item.type !== "text")
    .map(parseMediaContent);
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
    body.generate_audio !== undefined &&
    typeof body.generate_audio !== "boolean"
  ) {
    throw new Error("generate_audio 必须是布尔值或省略。");
  }
  if (typeof body.watermark !== "boolean") {
    throw new Error("watermark 必须是布尔值。");
  }
  if (
    body.return_last_frame !== undefined &&
    typeof body.return_last_frame !== "boolean"
  ) {
    throw new Error("return_last_frame 必须是布尔值或省略。");
  }
  if (
    body.resolution !== undefined &&
    !["480p", "720p", "1080p", "4k"].includes(String(body.resolution))
  ) {
    throw new Error("resolution 只支持 480p、720p、1080p 或 4k。");
  }
  const webSearch =
    Array.isArray(body.tools) &&
    body.tools.some(
      (tool) => isRecord(tool) && tool.type === "web_search",
    );
  if (webSearch && mediaItems.length > 0) {
    throw new Error("联网搜索仅适用于纯文本输入，请移除参考素材。");
  }

  return buildUpstreamRequestBody({
    model,
    prompt,
    mediaItems,
    ratio: ratio as (typeof RATIOS)[number],
    duration: body.duration,
    generateAudio: body.generate_audio as boolean | undefined,
    watermark: body.watermark,
    resolution: body.resolution as SeedanceRequestBody["resolution"],
    webSearch,
    returnLastFrame: body.return_last_frame === true,
  });
}

function parseMediaContent(value: unknown): MediaEditorItem {
  const item = objectValue(value, "content 素材");
  const type = stringValue(item.type, "content.type") as SeedanceMediaType;
  if (
    type !== "image_url" &&
    type !== "video_url" &&
    type !== "audio_url"
  ) {
    throw new Error("素材 type 只支持 image_url、video_url 或 audio_url。");
  }
  const payloadName = type;
  const payload = objectValue(item[payloadName], payloadName);
  const role = item.role as MediaEditorItem["role"];
  if (type === "image_url") {
    if (
      role !== undefined &&
      role !== "reference_image" &&
      role !== "first_frame" &&
      role !== "last_frame"
    ) {
      throw new Error(
        "image_url.role 只支持 reference_image、first_frame、last_frame 或省略。",
      );
    }
  } else {
    const requiredRole =
      type === "video_url" ? "reference_video" : "reference_audio";
    if (role !== requiredRole) {
      throw new Error(`${type}.role 必须是 ${requiredRole}。`);
    }
  }
  if (typeof payload.url !== "string") {
    throw new Error(`${payloadName}.url 必须是字符串。`);
  }
  return {
    type,
    // 模板资产可以用空 URL 表达“素材待补”；requestReady 会在补齐前阻止提交。
    url: payload.url.trim(),
    role,
  };
}

function mediaEditorToContent(item: MediaEditorItem): SeedanceContentItem {
  if (item.type === "image_url") {
    const content: SeedanceContentItem = {
      type: "image_url",
      image_url: { url: item.url },
    };
    if (
      item.role === "reference_image" ||
      item.role === "first_frame" ||
      item.role === "last_frame"
    ) {
      content.role = item.role;
    }
    return content;
  }
  if (item.type === "video_url") {
    return {
      type: "video_url",
      video_url: { url: item.url },
      role: "reference_video",
    };
  }
  return {
    type: "audio_url",
    audio_url: { url: item.url },
    role: "reference_audio",
  };
}

function getPrompt(body: SeedanceRequestBody): string {
  const textItem = body.content.find((item) => item.type === "text");
  return textItem?.type === "text" ? textItem.text : "";
}

function getMediaItems(body: SeedanceRequestBody): MediaEditorItem[] {
  return body.content
    .filter((item) => item.type !== "text")
    .map(parseMediaContent);
}

function mediaSummary(items: MediaEditorItem[]): string {
  const counts = {
    image_url: 0,
    video_url: 0,
    audio_url: 0,
  };
  items.forEach((item) => {
    counts[item.type] += 1;
  });
  const parts = [
    counts.image_url ? `${counts.image_url} 张图片` : "",
    counts.video_url ? `${counts.video_url} 段视频` : "",
    counts.audio_url ? `${counts.audio_url} 段音频` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" + ") : "纯文本";
}

function mediaRolesValid(items: MediaEditorItem[]): boolean {
  const imageItems = items.filter((item) => item.type === "image_url");
  const firstFrames = imageItems.filter(
    (item) => item.role === "first_frame",
  ).length;
  const lastFrames = imageItems.filter(
    (item) => item.role === "last_frame",
  ).length;
  if (firstFrames === 0 && lastFrames === 0) return true;
  return (
    firstFrames === 1 &&
    lastFrames === 1 &&
    imageItems.length === 2 &&
    items.every((item) => item.type === "image_url")
  );
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

function sequenceStatusLabel(
  status: "idle" | "running" | "succeeded" | "failed",
): string {
  const labels = {
    idle: "待执行",
    running: "连续生成中",
    succeeded: "全部完成",
    failed: "链路中断",
  };
  return labels[status];
}

function sequenceStepLabel(status: SequenceStep["status"]): string {
  const labels: Record<SequenceStep["status"], string> = {
    pending: "等待上一段",
    submitting: "正在创建",
    queued: "已排队",
    running: "生成中",
    succeeded: "已完成",
    failed: "生成失败",
  };
  return labels[status];
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
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
    (record.generateAudio === undefined ||
      typeof record.generateAudio === "boolean") &&
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
