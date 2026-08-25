"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  API_PATHS,
  getModelCapabilities,
  inferSeedanceTaskKind,
  isAllowedDuration,
  isAllowedModel,
  RATIOS,
  seedanceTaskKindLabel,
  validateSeedanceConstraints,
  type ApiPath,
  type SeedanceOmniReferenceTaskType,
  type SeedanceOutputFormat,
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
import {
  createSeedanceBatchId,
  isSeedanceBatchTerminal,
  mapWithConcurrency,
  replaceSeedancePrompt,
  SEEDANCE_BATCH_CONCURRENCY,
  SEEDANCE_BATCH_MAX_RECORDS,
  SEEDANCE_BATCH_MAX_TASKS,
  SEEDANCE_BATCH_STORAGE_KEY,
  seedanceBatchTaskCount,
  validateSeedanceBatchSize,
  type SeedanceBatchItem,
  type SeedanceBatchItemStatus,
  type SeedanceBatchRecord,
} from "../lib/seedance-batch";
import {
  estimateSeedanceBatchCost,
  SEEDANCE_PRICING_SOURCE,
} from "../lib/seedance-pricing";
import { CopyCurlButton } from "./CopyCurlButton";
import { SaveToMaterialLibraryButton } from "./SaveToMaterialLibraryButton";
import { APPLY_EXAMPLE_EVENT } from "./SeedanceExampleGallery";

type TaskStatus =
  | "draft"
  | "submitting"
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "expired";

type TaskUsage = {
  completionTokens?: number;
  totalTokens?: number;
  webSearch?: number;
};

type TaskResponse = {
  id?: string;
  status?: string;
  videoUrl?: string;
  lastFrameUrl?: string;
  duration?: number;
  ratio?: string;
  resolution?: string;
  outputFormat?: string;
  usage?: TaskUsage;
  error?: string;
  creationOutcome?: "not_created" | "unknown";
  retryable?: boolean;
};

type HistoryStatus =
  | "submitting"
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "expired";

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
  resultDuration?: number;
  resultRatio?: string;
  resultResolution?: string;
  resultOutputFormat?: SeedanceOutputFormat;
  resultUsage?: TaskUsage;
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
  const [outputFormat, setOutputFormat] =
    useState<SeedanceOutputFormat>("mp4");
  const [omniReferenceTaskType, setOmniReferenceTaskType] =
    useState<SeedanceOmniReferenceTaskType>("auto");
  const [omniCompatibilityNotice, setOmniCompatibilityNotice] = useState("");
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
  const [resultDuration, setResultDuration] = useState<number>();
  const [resultRatio, setResultRatio] = useState("");
  const [resultResolution, setResultResolution] = useState("");
  const [resultOutputFormat, setResultOutputFormat] =
    useState<SeedanceOutputFormat>();
  const [resultUsage, setResultUsage] = useState<TaskUsage>();
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
  const [experimentMode, setExperimentMode] =
    useState<"single" | "batch">("single");
  const [batchPrompts, setBatchPrompts] = useState(() => {
    const initialPrompt = getPrompt(DEFAULT_REQUEST_BODY);
    return [initialPrompt, initialPrompt];
  });
  const [batchDraws, setBatchDraws] = useState(1);
  const [batchCostConfirmed, setBatchCostConfirmed] = useState(false);
  const [batchRecords, setBatchRecords] = useState<SeedanceBatchRecord[]>([]);
  const [batchStorageReady, setBatchStorageReady] = useState(false);
  const [batchCredentialEntryUnlocked, setBatchCredentialEntryUnlocked] =
    useState(false);
  const [batchConfirmation, setBatchConfirmation] = useState<{
    batchId: string;
    retryItemIds?: string[];
  } | null>(null);
  const [batchFinalConfirmed, setBatchFinalConfirmed] = useState(false);
  const pollingRef = useRef(false);
  const batchRecordsRef = useRef<SeedanceBatchRecord[]>([]);
  const batchMonitorsRef = useRef(new Set<string>());
  const batchAutoResumeRef = useRef(false);

  const selectedPath = API_PATHS[apiPath];
  const singleTaskActive = ["submitting", "queued", "running"].includes(
    taskStatus,
  );
  const activeBatch = batchRecords.some((record) =>
    record.items.some((item) => !isSeedanceBatchTerminal(item.status)),
  );
  const active =
    singleTaskActive || sequenceStatus === "running" || activeBatch;
  const baseUrlMatches = baseUrl.replace(/\/$/, "") === selectedPath.baseUrl;
  const modelMatches = isAllowedModel(apiPath, model);
  const modelCapabilities = getModelCapabilities(apiPath, model);
  const constraintContent = useMemo(
    () => buildConstraintContent(prompt, mediaItems),
    [mediaItems, prompt],
  );
  const inferredTaskKind = useMemo(
    () => inferSeedanceTaskKind(constraintContent),
    [constraintContent],
  );
  const omniReferenceEligible = Boolean(
    apiPath === "official" &&
      modelCapabilities?.isSeedance25 &&
      (inferredTaskKind === "reference" ||
        inferredTaskKind === "edit" ||
        inferredTaskKind === "extend"),
  );
  const requestOmniReferenceTaskType = omniReferenceEligible
    ? omniReferenceTaskType
    : undefined;
  const effectiveTaskKind =
    requestOmniReferenceTaskType === "edit" ||
    requestOmniReferenceTaskType === "extend"
      ? requestOmniReferenceTaskType
      : inferredTaskKind;
  const mediaCounts = useMemo(() => countMediaItems(mediaItems), [mediaItems]);
  const ratioLockedToAdaptive = Boolean(
    modelCapabilities?.isSeedance25 &&
      (effectiveTaskKind === "edit" ||
        effectiveTaskKind === "extend" ||
        effectiveTaskKind === "first-frame" ||
        effectiveTaskKind === "first-last-frame"),
  );
  const durationLockedToAuto = Boolean(
    modelCapabilities?.isSeedance25 && effectiveTaskKind === "edit",
  );
  const durationOptions = useMemo(() => {
    if (!modelCapabilities) return [];
    const values = Array.from(
      {
        length:
          modelCapabilities.duration.max -
          modelCapabilities.duration.min +
          1,
      },
      (_, index) => modelCapabilities.duration.min + index,
    );
    return modelCapabilities.duration.allowAuto ? [-1, ...values] : values;
  }, [modelCapabilities]);
  const constraintErrors = useMemo(
    () =>
      validateSeedanceConstraints({
        apiPath,
        model,
        content: constraintContent,
        ratio,
        duration,
        resolution,
        outputFormat,
        omniReferenceTaskType: requestOmniReferenceTaskType,
        webSearch,
      }),
    [
      apiPath,
      constraintContent,
      duration,
      model,
      outputFormat,
      requestOmniReferenceTaskType,
      ratio,
      resolution,
      webSearch,
    ],
  );
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
        outputFormat,
        omniReferenceTaskType: requestOmniReferenceTaskType,
        webSearch,
        returnLastFrame,
      }),
    [
      duration,
      generateAudio,
      mediaItems,
      model,
      outputFormat,
      requestOmniReferenceTaskType,
      prompt,
      ratio,
      resolution,
      returnLastFrame,
      watermark,
      webSearch,
    ],
  );
  const requestReady =
    experimentMode === "single" &&
    Boolean(apiKey.trim()) &&
    mediaItems.every((item) => Boolean(item.url.trim())) &&
    baseUrlMatches &&
    modelMatches &&
    constraintErrors.length === 0 &&
    costConfirmed &&
    !active;
  const nonEmptyBatchPrompts = useMemo(
    () => batchPrompts.map((item) => item.trim()).filter(Boolean),
    [batchPrompts],
  );
  const batchTaskCount = seedanceBatchTaskCount(batchPrompts, batchDraws);
  const batchSizeErrors = useMemo(
    () => validateSeedanceBatchSize(batchPrompts, batchDraws),
    [batchDraws, batchPrompts],
  );
  const batchConstraintErrors = useMemo(() => {
    const errors = nonEmptyBatchPrompts.flatMap((batchPrompt, index) => {
      const body = replaceSeedancePrompt(upstreamRequestBody, batchPrompt);
      return validateSeedanceConstraints({
        apiPath,
        model,
        content: body.content,
        ratio: body.ratio,
        duration: body.duration,
        resolution: body.resolution,
        outputFormat: body.output_format,
        omniReferenceTaskType: body.omni_reference_task_type,
        webSearch: Boolean(body.tools?.length),
      }).map((message) => `Prompt ${index + 1}：${message}`);
    });
    return errors;
  }, [apiPath, model, nonEmptyBatchPrompts, upstreamRequestBody]);
  const batchCostEstimate = useMemo(
    () =>
      estimateSeedanceBatchCost({
        apiPath,
        model,
        ratio,
        resolution,
        duration,
        minimumDuration: modelCapabilities?.duration.min ?? 4,
        maximumDuration: modelCapabilities?.duration.max ?? 30,
        taskCount: batchTaskCount,
        content: upstreamRequestBody.content,
      }),
    [
      apiPath,
      batchTaskCount,
      duration,
      model,
      modelCapabilities,
      ratio,
      resolution,
      upstreamRequestBody.content,
    ],
  );
  const batchReady =
    experimentMode === "batch" &&
    Boolean(apiKey.trim()) &&
    mediaItems.every((item) => Boolean(item.url.trim())) &&
    baseUrlMatches &&
    modelMatches &&
    batchSizeErrors.length === 0 &&
    batchConstraintErrors.length === 0 &&
    batchCostConfirmed &&
    !active;
  const confirmationRecord = batchConfirmation
    ? batchRecords.find((record) => record.id === batchConfirmation.batchId)
    : undefined;
  const confirmationTaskCount = batchConfirmation?.retryItemIds?.length ??
    (batchConfirmation ? batchTaskCount : 0);
  const confirmationCapabilities = confirmationRecord
    ? getModelCapabilities(confirmationRecord.apiPath, confirmationRecord.model)
    : modelCapabilities;
  const confirmationRequest =
    confirmationRecord?.requestTemplate ?? upstreamRequestBody;
  const confirmationCostEstimate = useMemo(
    () =>
      estimateSeedanceBatchCost({
        apiPath: confirmationRecord?.apiPath ?? apiPath,
        model: confirmationRecord?.model ?? model,
        ratio: confirmationRequest.ratio,
        resolution: confirmationRequest.resolution,
        duration: confirmationRequest.duration,
        minimumDuration: confirmationCapabilities?.duration.min ?? 4,
        maximumDuration: confirmationCapabilities?.duration.max ?? 30,
        taskCount: confirmationTaskCount,
        content: confirmationRequest.content,
      }),
    [
      apiPath,
      confirmationCapabilities,
      confirmationRecord,
      confirmationRequest,
      confirmationTaskCount,
      model,
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
      cancelled: "已取消",
      expired: "已过期",
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

  const updateBatchRecords = useCallback(
    (
      updater: (
        current: SeedanceBatchRecord[],
      ) => SeedanceBatchRecord[],
    ) => {
      const next = updater(batchRecordsRef.current).slice(
        0,
        SEEDANCE_BATCH_MAX_RECORDS,
      );
      batchRecordsRef.current = next;
      setBatchRecords(next);
    },
    [],
  );

  const patchBatchItem = useCallback(
    (
      batchId: string,
      itemId: string,
      patch: Partial<SeedanceBatchItem>,
    ) => {
      updateBatchRecords((current) =>
        current.map((record) =>
          record.id === batchId
            ? {
                ...record,
                updatedAt: new Date().toISOString(),
                items: record.items.map((item) =>
                  item.id === itemId ? { ...item, ...patch } : item,
                ),
              }
            : record,
        ),
      );
    },
    [updateBatchRecords],
  );

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const storedHistory = readHistory();
      const credentials = readCredentials();
      const storedBatches = readBatchRecords();
      setHistory(storedHistory);
      batchRecordsRef.current = storedBatches;
      setBatchRecords(storedBatches);
      const activeBatchWithoutKey = storedBatches.some(
        (record) =>
          record.items.some(
            (item) => item.status === "queued" || item.status === "running",
          ) && !credentials[record.apiPath],
      );
      setBatchCredentialEntryUnlocked(activeBatchWithoutKey);

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
      setBatchStorageReady(true);
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
    if (!batchStorageReady) return;
    writeBatchRecords(batchRecords);
  }, [batchRecords, batchStorageReady]);

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
    if (omniReferenceTaskType !== "auto" && nextPath !== "official") {
      setOmniCompatibilityNotice(
        "已移除 omni_reference_task_type：Agent Plan 不支持该字段。",
      );
    } else {
      setOmniCompatibilityNotice("");
    }
    const nextConfig = API_PATHS[nextPath];
    setApiPath(nextPath);
    setBaseUrl(nextConfig.baseUrl);
    setModel(nextConfig.defaultModel);
    const nextCapabilities = getModelCapabilities(nextPath, nextConfig.defaultModel);
    if (nextCapabilities) {
      setDuration(nextCapabilities.duration.defaultValue);
      setResolution(undefined);
      setOutputFormat("mp4");
      setOmniReferenceTaskType("auto");
    }
    setApiKey(rememberApiKey ? (readCredentials()[nextPath] ?? "") : "");
    setShowApiKey(false);
    resetTaskResult();
  }

  function selectModel(nextModel: string) {
    const nextCapabilities = getModelCapabilities(apiPath, nextModel);
    if (
      omniReferenceTaskType !== "auto" &&
      (!nextCapabilities?.isSeedance25 || apiPath !== "official")
    ) {
      setOmniCompatibilityNotice(
        "已移除 omni_reference_task_type：当前模型不支持该字段。",
      );
    } else {
      setOmniCompatibilityNotice("");
    }
    setModel(nextModel);
    if (nextCapabilities) {
      if (nextCapabilities.isSeedance25) {
        setRatio("adaptive");
        setDuration(nextCapabilities.duration.defaultValue);
      } else if (!isAllowedDuration(nextCapabilities, duration)) {
        setDuration(nextCapabilities.duration.defaultValue);
      }
      if (
        resolution &&
        !nextCapabilities.resolutions.includes(resolution)
      ) {
        setResolution(undefined);
      }
      if (!nextCapabilities.outputFormats.includes(outputFormat)) {
        setOutputFormat("mp4");
      }
      if (!nextCapabilities.isSeedance25 || apiPath !== "official") {
        setOmniReferenceTaskType("auto");
      }
    }
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
      setOutputFormat("mp4");
      setOmniReferenceTaskType("auto");
      setWebSearch(false);
    }
    setSelectedExampleTitle(record.exampleTitle ?? "历史任务");
    setTaskStatus(record.status);
    setTaskId(record.taskId ?? record.id);
    setActiveHistoryId(record.id);
    setResultVideoUrl(record.resultVideoUrl ?? "");
    setResultLastFrameUrl(record.resultLastFrameUrl ?? "");
    setResultDuration(record.resultDuration);
    setResultRatio(record.resultRatio ?? "");
    setResultResolution(record.resultResolution ?? "");
    setResultOutputFormat(record.resultOutputFormat);
    setResultUsage(record.resultUsage);
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
    const nextMediaItems = getMediaItems(body);
    setModel(body.model);
    setPrompt(getPrompt(body));
    setMediaItems(nextMediaItems);
    setRatio(body.ratio);
    setDuration(body.duration);
    setGenerateAudio(body.generate_audio);
    setWatermark(body.watermark);
    setResolution(body.resolution);
    setOutputFormat(body.output_format ?? "mp4");
    setOmniReferenceTaskType(body.omni_reference_task_type ?? "auto");
    setOmniCompatibilityNotice("");
    setWebSearch(body.tools?.some((tool) => tool.type === "web_search") ?? false);
    setReturnLastFrame(body.return_last_frame ?? false);
    applyForcedTaskParameters(body.model, getPrompt(body), nextMediaItems);
    setApiBodyEditing(false);
    setApiBodyError("");
    if (shouldReset) resetTaskResult();
  }

  function applyForcedTaskParameters(
    nextModel: string,
    nextPrompt: string,
    nextMediaItems: MediaEditorItem[],
  ) {
    const nextPath = isAllowedModel(apiPath, nextModel)
      ? apiPath
      : isAllowedModel("official", nextModel)
        ? "official"
        : "agent-plan";
    const capabilities = getModelCapabilities(nextPath, nextModel);
    if (!capabilities?.isSeedance25) return;
    const kind = inferSeedanceTaskKind(
      buildConstraintContent(nextPrompt, nextMediaItems),
    );
    if (
      kind === "edit" ||
      kind === "extend" ||
      kind === "first-frame" ||
      kind === "first-last-frame"
    ) {
      setRatio("adaptive");
    }
    if (kind === "edit") setDuration(-1);
  }

  function resetTaskResult() {
    setCostConfirmed(false);
    setTaskStatus("draft");
    setTaskId("");
    setActiveHistoryId("");
    setResultVideoUrl("");
    setResultLastFrameUrl("");
    setResultDuration(undefined);
    setResultRatio("");
    setResultResolution("");
    setResultOutputFormat(undefined);
    setResultUsage(undefined);
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
      if (payload.duration !== undefined) setResultDuration(payload.duration);
      if (payload.ratio) setResultRatio(payload.ratio);
      if (payload.resolution) setResultResolution(payload.resolution);
      if (payload.outputFormat === "mp4" || payload.outputFormat === "mov") {
        setResultOutputFormat(payload.outputFormat);
      }
      if (payload.usage) setResultUsage(payload.usage);
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
          resultDuration: payload.duration,
          resultRatio: payload.ratio,
          resultResolution: payload.resolution,
          resultOutputFormat:
            payload.outputFormat === "mov" ? "mov" :
            payload.outputFormat === "mp4" ? "mp4" : undefined,
          resultUsage: payload.usage,
          error: payload.error,
        },
      );
      if (isTerminalTaskStatus(normalizedStatus)) {
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
    setResultDuration(undefined);
    setResultRatio("");
    setResultResolution("");
    setResultOutputFormat(undefined);
    setResultUsage(undefined);
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

  function prepareNewBatch() {
    if (!batchReady) return;
    setBatchConfirmation({ batchId: createSeedanceBatchId() });
    setBatchFinalConfirmed(false);
  }

  function prepareBatchRetry(batchId: string, itemIds: string[]) {
    const record = batchRecordsRef.current.find((item) => item.id === batchId);
    if (!record || active) return;
    const retryableIds = itemIds.filter((itemId) =>
      record.items.some(
        (item) =>
          item.id === itemId &&
          item.status === "not_created" &&
          item.retryable,
      ),
    );
    if (retryableIds.length === 0) return;
    setExperimentMode("batch");
    setApiPath(record.apiPath);
    setBaseUrl(record.baseUrl);
    setModel(record.model);
    applyRequestBody(record.requestTemplate, false);
    setApiKey(readCredentials()[record.apiPath] ?? "");
    setBatchConfirmation({ batchId, retryItemIds: retryableIds });
    setBatchFinalConfirmed(false);
  }

  async function startConfirmedBatch() {
    if (!batchConfirmation || !batchFinalConfirmed || !apiKey.trim()) return;
    const { batchId, retryItemIds } = batchConfirmation;
    let record = batchRecordsRef.current.find((item) => item.id === batchId);

    if (!record) {
      if (!batchReady) return;
      const now = new Date().toISOString();
      const items: SeedanceBatchItem[] = nonEmptyBatchPrompts.flatMap(
        (batchPrompt, promptIndex) =>
          Array.from({ length: batchDraws }, (_, drawIndex) => ({
            id: `${batchId}-p${promptIndex + 1}-d${drawIndex + 1}`,
            promptIndex,
            drawIndex,
            prompt: batchPrompt,
            historyId: createLocalHistoryId(),
            status: "pending" as const,
            attempts: 0,
            retryable: false,
          })),
      );
      record = {
        id: batchId,
        createdAt: now,
        updatedAt: now,
        apiPath,
        baseUrl,
        model,
        prompts: nonEmptyBatchPrompts,
        draws: batchDraws,
        requestTemplate: upstreamRequestBody,
        items,
      };
      updateBatchRecords((current) => [record!, ...current]);
    }

    setBatchConfirmation(null);
    setBatchFinalConfirmed(false);
    setBatchCostConfirmed(false);
    await createBatchItems(record, retryItemIds);
  }

  async function createBatchItems(
    record: SeedanceBatchRecord,
    retryItemIds?: string[],
  ) {
    const targetItems = record.items.filter((item) =>
      retryItemIds
        ? retryItemIds.includes(item.id) &&
          item.status === "not_created" &&
          item.retryable
        : item.status === "pending",
    );
    await mapWithConcurrency(
      targetItems,
      SEEDANCE_BATCH_CONCURRENCY,
      async (item) => submitBatchItem(record, item),
    );
    await monitorBatch(record.id);
  }

  async function submitBatchItem(
    record: SeedanceBatchRecord,
    item: SeedanceBatchItem,
  ) {
    const requestBody = replaceSeedancePrompt(
      record.requestTemplate,
      item.prompt,
    );
    const attemptedAt = new Date().toISOString();
    const createRequest: TaskLogEntry["request"] = {
      method: "POST",
      url: `${record.baseUrl.replace(/\/$/, "")}/contents/generations/tasks`,
      headers: {
        authorization: `Bearer ${maskApiKey(apiKey)}`,
        "content-type": "application/json",
      },
      body: requestBody,
    };
    const createLog: TaskLogEntry = {
      at: attemptedAt,
      phase: "create",
      request: createRequest,
    };
    patchBatchItem(record.id, item.id, {
      status: "submitting",
      attempts: item.attempts + 1,
      retryable: false,
      error: undefined,
    });

    const existingHistory = history.find(
      (historyItem) => historyItem.id === item.historyId,
    );
    if (existingHistory) {
      patchHistory(item.historyId, {
        status: "submitting",
        error: undefined,
        requestBody,
      });
    } else {
      upsertHistory({
        id: item.historyId,
        createdAt: attemptedAt,
        updatedAt: attemptedAt,
        apiPath: record.apiPath,
        baseUrl: record.baseUrl,
        model: record.model,
        prompt: item.prompt,
        imageUrl:
          mediaItems.find((media) => media.type === "image_url")?.url ?? "",
        referenceVideoUrl:
          mediaItems.find((media) => media.type === "video_url")?.url ?? "",
        ratio: requestBody.ratio,
        duration: requestBody.duration,
        generateAudio: requestBody.generate_audio,
        watermark: requestBody.watermark,
        requestBody,
        exampleTitle: `批量实验 ${record.id} · Prompt ${item.promptIndex + 1} / 抽卡 ${item.drawIndex + 1}`,
        status: "submitting",
        logs: [],
      });
    }

    let capturedResponse: TaskLogEntry["response"];
    try {
      const response = await fetch("/api/seedance/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          apiPath: record.apiPath,
          baseUrl: record.baseUrl,
          model: record.model,
          apiKey,
          requestBody,
        }),
      });
      const payload = (await response.json()) as TaskResponse;
      capturedResponse = { httpStatus: response.status, body: payload };
      if (!response.ok) {
        const outcome =
          payload.creationOutcome === "not_created"
            ? "not_created"
            : "unknown";
        const message = payload.error ?? "创建任务失败。";
        patchBatchItem(record.id, item.id, {
          status: outcome,
          retryable: outcome === "not_created" && payload.retryable === true,
          error: message,
        });
        appendHistoryLog(
          item.historyId,
          { ...createLog, response: capturedResponse },
          { status: "failed", error: message },
        );
        return;
      }
      if (!payload.id) {
        const message = "任务创建响应没有 task ID，创建结果未知，禁止直接重试。";
        patchBatchItem(record.id, item.id, {
          status: "unknown",
          retryable: false,
          error: message,
        });
        appendHistoryLog(
          item.historyId,
          { ...createLog, response: capturedResponse },
          { status: "failed", error: message },
        );
        return;
      }
      const normalizedStatus = normalizeStatus(payload.status);
      patchBatchItem(record.id, item.id, {
        taskId: payload.id,
        status: normalizedStatus,
        retryable: false,
      });
      appendHistoryLog(
        item.historyId,
        { ...createLog, response: capturedResponse },
        { taskId: payload.id, status: normalizedStatus },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "创建请求发生网络错误。";
      patchBatchItem(record.id, item.id, {
        status: "unknown",
        retryable: false,
        error: `${message} 创建结果未知，禁止直接重试。`,
      });
      appendHistoryLog(
        item.historyId,
        { ...createLog, error: message },
        { status: "failed", error: message },
      );
    }
  }

  async function monitorBatch(batchId: string) {
    if (batchMonitorsRef.current.has(batchId) || !apiKey.trim()) return;
    setBatchCredentialEntryUnlocked(false);
    batchMonitorsRef.current.add(batchId);
    try {
      while (true) {
        const record = batchRecordsRef.current.find(
          (item) => item.id === batchId,
        );
        if (!record) return;
        const activeItems = record.items.filter(
          (item) => item.status === "queued" || item.status === "running",
        );
        if (activeItems.length === 0) return;
        await mapWithConcurrency(
          activeItems,
          SEEDANCE_BATCH_CONCURRENCY,
          async (item) => pollBatchItem(record, item),
        );
        const refreshed = batchRecordsRef.current.find(
          (item) => item.id === batchId,
        );
        if (
          !refreshed?.items.some(
            (item) => item.status === "queued" || item.status === "running",
          )
        ) {
          return;
        }
        await wait(POLL_SECONDS * 1_000);
      }
    } finally {
      batchMonitorsRef.current.delete(batchId);
    }
  }

  async function pollBatchItem(
    record: SeedanceBatchRecord,
    item: SeedanceBatchItem,
  ) {
    if (!item.taskId) return;
    const requestedAt = new Date().toISOString();
    const statusRequest: TaskLogEntry["request"] = {
      method: "GET",
      url: `${record.baseUrl.replace(/\/$/, "")}/contents/generations/tasks/${encodeURIComponent(item.taskId)}`,
      headers: {
        authorization: `Bearer ${maskApiKey(apiKey)}`,
        "content-type": "application/json",
      },
    };
    try {
      const response = await fetch("/api/seedance/tasks/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          apiPath: record.apiPath,
          baseUrl: record.baseUrl,
          model: record.model,
          apiKey,
          taskId: item.taskId,
        }),
      });
      const payload = (await response.json()) as TaskResponse;
      const statusLog: TaskLogEntry = {
        at: requestedAt,
        phase: "status",
        request: statusRequest,
        response: { httpStatus: response.status, body: payload },
      };
      if (!response.ok) {
        appendHistoryLog(item.historyId, statusLog);
        return;
      }
      const normalizedStatus = normalizeStatus(payload.status);
      const resultPatch = {
        status: normalizedStatus,
        videoUrl: payload.videoUrl,
        lastFrameUrl: payload.lastFrameUrl,
        duration: payload.duration,
        ratio: payload.ratio,
        resolution: payload.resolution,
        outputFormat: payload.outputFormat,
        usage: payload.usage,
        error: payload.error,
      };
      patchBatchItem(record.id, item.id, resultPatch);
      appendHistoryLog(item.historyId, statusLog, {
        status: normalizedStatus,
        resultVideoUrl: payload.videoUrl,
        resultLastFrameUrl: payload.lastFrameUrl,
        resultDuration: payload.duration,
        resultRatio: payload.ratio,
        resultResolution: payload.resolution,
        resultOutputFormat: payload.outputFormat as
          | SeedanceOutputFormat
          | undefined,
        resultUsage: payload.usage,
        error: payload.error,
      });
    } catch (error) {
      appendHistoryLog(item.historyId, {
        at: requestedAt,
        phase: "status",
        request: statusRequest,
        error: error instanceof Error ? error.message : "状态查询失败。",
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
    const nextItems = mediaItems.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    );
    setMediaItems(nextItems);
    applyForcedTaskParameters(model, prompt, nextItems);
    resetTaskResult();
  }

  function removeMediaItem(index: number) {
    const nextItems = mediaItems.filter((_, itemIndex) => itemIndex !== index);
    setMediaItems(nextItems);
    applyForcedTaskParameters(model, prompt, nextItems);
    resetTaskResult();
  }

  function addMediaItem(type: SeedanceMediaType) {
    if (!modelCapabilities) return;
    const typeLimit = {
      image_url: modelCapabilities.mediaLimits.images,
      video_url: modelCapabilities.mediaLimits.videos,
      audio_url: modelCapabilities.mediaLimits.audios,
    }[type];
    if (
      mediaCounts[type] >= typeLimit ||
      mediaCounts.total >= modelCapabilities.mediaLimits.total
    ) {
      return;
    }
    const roles = {
      image_url: "reference_image",
      video_url: "reference_video",
      audio_url: "reference_audio",
    } as const;
    const nextItems = [
      ...mediaItems,
      { type, url: "", role: roles[type] },
    ];
    setMediaItems(nextItems);
    applyForcedTaskParameters(model, prompt, nextItems);
    resetTaskResult();
  }

  useEffect(() => {
    if (!batchStorageReady || batchAutoResumeRef.current) return;
    const activeRecord = batchRecordsRef.current.find((record) =>
      record.items.some(
        (item) => item.status === "queued" || item.status === "running",
      ),
    );
    if (!activeRecord) return;
    const rememberedKey = readCredentials()[activeRecord.apiPath];
    if (!rememberedKey) return;
    if (
      apiPath !== activeRecord.apiPath ||
      baseUrl !== activeRecord.baseUrl ||
      model !== activeRecord.model
    ) {
      setApiPath(activeRecord.apiPath);
      setBaseUrl(activeRecord.baseUrl);
      setModel(activeRecord.model);
      applyRequestBody(activeRecord.requestTemplate, false);
    }
    if (apiKey !== rememberedKey) {
      setApiKey(rememberedKey);
      return;
    }
    batchAutoResumeRef.current = true;
    void monitorBatch(activeRecord.id);
    // monitorBatch intentionally follows the persisted snapshot rather than
    // becoming a reactive dependency that could start duplicate loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, apiPath, baseUrl, batchStorageReady, model]);

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
              onChange={(event) => selectModel(event.target.value)}
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
                disabled={active && !batchCredentialEntryUnlocked}
              />
              <button
                type="button"
                aria-pressed={showApiKey}
                onClick={() => setShowApiKey((current) => !current)}
                disabled={!apiKey || (active && !batchCredentialEntryUnlocked)}
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
                disabled={active && !batchCredentialEntryUnlocked}
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
          <div className="experiment-mode-switch" aria-label="任务执行模式">
            <button
              type="button"
              className={experimentMode === "single" ? "is-active" : undefined}
              onClick={() => setExperimentMode("single")}
              disabled={active}
            >
              单任务
            </button>
            <button
              type="button"
              className={experimentMode === "batch" ? "is-active" : undefined}
              onClick={() => {
                setExperimentMode("batch");
                setBatchCostConfirmed(false);
                setCostConfirmed(false);
              }}
              disabled={active}
            >
              批量实验
            </button>
          </div>
        </div>

        <div className="request-fields">
          {experimentMode === "single" ? (
            <label className="request-field request-field-wide">
              <span>提示词</span>
              <textarea
                value={prompt}
                onChange={(event) => {
                  const nextPrompt = event.target.value;
                  setPrompt(nextPrompt);
                  applyForcedTaskParameters(model, nextPrompt, mediaItems);
                  resetTaskResult();
                }}
                rows={3}
                disabled={active}
              />
              <small>
                有参考素材时可留空；纯文本任务必须填写。Seedance 2.5 支持仅音频参考。
              </small>
            </label>
          ) : (
            <div className="request-field request-field-wide batch-prompt-editor">
              <span>批量 Prompt 卡片</span>
              {batchPrompts.map((batchPrompt, index) => (
                <div className="batch-prompt-card" key={`batch-prompt-${index}`}>
                  <div className="batch-prompt-index">
                    <strong>Prompt {index + 1}</strong>
                    <small>共享参数</small>
                  </div>
                  <textarea
                    aria-label={`批量 Prompt ${index + 1}`}
                    value={batchPrompt}
                    onChange={(event) => {
                      const nextPrompts = batchPrompts.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item,
                      );
                      setBatchPrompts(nextPrompts);
                      if (index === 0) setPrompt(event.target.value);
                      setBatchCostConfirmed(false);
                    }}
                    rows={3}
                    disabled={active}
                  />
                  <button
                    className="batch-prompt-remove"
                    type="button"
                    onClick={() => {
                      const nextPrompts = batchPrompts.filter(
                        (_, itemIndex) => itemIndex !== index,
                      );
                      setBatchPrompts(nextPrompts);
                      setPrompt(nextPrompts[0] ?? "");
                      setBatchCostConfirmed(false);
                    }}
                    disabled={active || batchPrompts.length <= 1}
                  >
                    删除
                  </button>
                </div>
              ))}
              <button
                className="batch-add-prompt"
                type="button"
                onClick={() => {
                  setBatchPrompts((current) => [...current, ""]);
                  setBatchCostConfirmed(false);
                }}
                disabled={
                  active || batchPrompts.length >= SEEDANCE_BATCH_MAX_TASKS
                }
              >
                + 添加 Prompt
              </button>
              <small>
                所有 Prompt 共用下方素材和输出参数；完整 JSON 展示第一条 Prompt
                的请求快照，创建时只替换 text 内容。
              </small>
            </div>
          )}

          <div
            className={`omni-reference-control request-field-wide ${
              omniReferenceEligible ? "is-eligible" : "is-ineligible"
            }`}
          >
            <div className="omni-inference-summary">
              <span>任务类型预判</span>
              <strong>{seedanceTaskKindLabel(inferredTaskKind)}</strong>
              <small className={constraintErrors.length ? "field-error" : undefined}>
                {constraintErrors[0] ??
                  "根据 content.role 与官方关键词预判；最终任务类型仍以模型判定为准。"}
              </small>
            </div>

            <label className="omni-type-selector">
              <span>
                全模态参考任务类型
                <em>{omniReferenceEligible ? "2.5 可用" : "当前省略"}</em>
              </span>
              <select
                value={omniReferenceTaskType}
                onChange={(event) => {
                  const nextType = event.target
                    .value as SeedanceOmniReferenceTaskType;
                  setOmniReferenceTaskType(nextType);
                  setOmniCompatibilityNotice("");
                  if (nextType === "edit") {
                    setRatio("adaptive");
                    setDuration(-1);
                  } else if (nextType === "extend") {
                    setRatio("adaptive");
                  }
                  resetTaskResult();
                }}
                disabled={active || !omniReferenceEligible}
              >
                <option value="auto">auto · 自动推断</option>
                <option value="reference">reference · 全模态参考</option>
                <option value="edit">edit · 视频编辑</option>
                <option value="extend">extend · 视频延长</option>
              </select>
              <small
                className={omniCompatibilityNotice ? "field-error" : undefined}
              >
                {omniCompatibilityNotice ||
                  (omniReferenceEligible
                    ? "仅标准 API 的 Seedance 2.5 全模态参考任务发送；显式类型必须与 Prompt 意图一致。"
                    : "当前任务不会发送 omni_reference_task_type；纯文本、首帧、首尾帧和非 2.5 模型均保持省略。")}
              </small>
            </label>
          </div>

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
                      type="text"
                      inputMode="url"
                      placeholder="https://… 或 asset://asset-*"
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
                      onClick={() => removeMediaItem(index)}
                      disabled={active}
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="media-editor-actions">
              <button
                type="button"
                onClick={() => addMediaItem("image_url")}
                disabled={
                  active ||
                  !modelCapabilities ||
                  mediaCounts.image_url >= modelCapabilities.mediaLimits.images ||
                  mediaCounts.total >= modelCapabilities.mediaLimits.total
                }
              >
                + 图片
              </button>
              <button
                type="button"
                onClick={() => addMediaItem("video_url")}
                disabled={
                  active ||
                  !modelCapabilities ||
                  mediaCounts.video_url >= modelCapabilities.mediaLimits.videos ||
                  mediaCounts.total >= modelCapabilities.mediaLimits.total
                }
              >
                + 视频
              </button>
              <button
                type="button"
                onClick={() => addMediaItem("audio_url")}
                disabled={
                  active ||
                  !modelCapabilities ||
                  mediaCounts.audio_url >= modelCapabilities.mediaLimits.audios ||
                  mediaCounts.total >= modelCapabilities.mediaLimits.total
                }
              >
                + 音频
              </button>
            </div>
            <small>
              当前模型支持最多 {modelCapabilities?.mediaLimits.images ?? 0} 张图片、
              {modelCapabilities?.mediaLimits.videos ?? 0} 段视频和
              {modelCapabilities?.mediaLimits.audios ?? 0} 段音频，总计不超过
              {modelCapabilities?.mediaLimits.total ?? 0} 项。素材支持公网 HTTPS URL
              或官方 asset://asset-* 素材 ID；不开放 Base64。单首帧使用一张
              first_frame，首尾帧模式各一张且不得混用参考素材。
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
              disabled={active || ratioLockedToAdaptive}
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
              disabled={active || durationLockedToAuto}
            >
              {durationOptions.map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds === -1 ? "智能时长（-1）" : `${seconds} 秒`}
                </option>
              ))}
            </select>
            <small>
              {duration === -1
                ? `模型将在 ${modelCapabilities?.duration.min ?? 4}–${modelCapabilities?.duration.max ?? 30} 秒内自适应；按实际结果计费。`
                : "使用明确的整数秒时长。"}
            </small>
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
              {modelCapabilities?.resolutions.map((option) => (
                <option key={option} value={option}>
                  {option === "4k" ? "4K" : option}
                </option>
              ))}
            </select>
          </label>

          <label className="request-field">
            <span>输出格式</span>
            <select
              value={outputFormat}
              onChange={(event) => {
                setOutputFormat(event.target.value as SeedanceOutputFormat);
                resetTaskResult();
              }}
              disabled={active || (modelCapabilities?.outputFormats.length ?? 0) <= 1}
            >
              {modelCapabilities?.outputFormats.map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </select>
            <small>
              MOV 仅 Seedance 2.5 支持，部分浏览器可能无法直接播放。
            </small>
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
          <div className="api-details-actions">
            <span className="sync-badge">双向联动</span>
            <CopyCurlButton
              body={upstreamRequestBody}
              containsApiKey={Boolean(apiKey.trim())}
              headers={{
                Authorization: `Bearer ${apiKey.trim() || "<ARK_API_KEY>"}`,
                "Content-Type": "application/json",
              }}
              method="POST"
              url={createEndpoint}
            />
          </div>
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
              "模型、提示词、素材、比例、时长、分辨率、输出格式、音频与水印参数和上方表单共用同一份状态。"}
          </p>
        </div>
      </section>

      {experimentMode === "batch" && (
        <section className="batch-panel" aria-labelledby="batch-heading">
          <div className="execution-summary batch-command-header">
            <div>
              <span className="config-kicker">CONTROLLED BATCH</span>
              <h3 id="batch-heading">受控批量实验</h3>
            </div>
            <span className="task-status status-draft batch-limit-badge">
              上限 {SEEDANCE_BATCH_MAX_TASKS} · 并发 {SEEDANCE_BATCH_CONCURRENCY}
            </span>
          </div>
          <div className="batch-controls">
            <label className="request-field batch-draw-control">
              <span>每条 Prompt 抽卡数</span>
              <input
                type="number"
                min={1}
                max={SEEDANCE_BATCH_MAX_TASKS}
                value={batchDraws}
                onChange={(event) => {
                  setBatchDraws(Number(event.target.value));
                  setBatchCostConfirmed(false);
                }}
                disabled={active}
              />
            </label>
            <dl className="review-grid batch-review-grid">
              <div>
                <dt>调用次数</dt>
                <dd>{batchTaskCount} 次</dd>
              </div>
              <div>
                <dt>组合</dt>
                <dd>
                  {nonEmptyBatchPrompts.length} 条 Prompt × {batchDraws} 抽
                </dd>
              </div>
              <div>
                <dt>总输出时长</dt>
                <dd>
                  {duration === -1
                    ? `${batchTaskCount * (modelCapabilities?.duration.min ?? 4)}–${batchTaskCount * (modelCapabilities?.duration.max ?? 30)} 秒`
                    : `${batchTaskCount * duration} 秒`}
                </dd>
              </div>
              <div>
                <dt>输入与输出</dt>
                <dd>
                  {model} · {resolution?.toUpperCase() ?? "模型默认"} · {ratio}
                  · {mediaSummary(mediaItems)}
                  {webSearch ? " · 联网搜索" : ""}
                </dd>
              </div>
            </dl>
          </div>
          <div className={`batch-cost-summary cost-${batchCostEstimate.kind}`}>
            <span className="batch-cost-kicker">COST PREVIEW · 参考费用</span>
            <div>
              <strong>{batchCostEstimate.label}</strong>
              <span>{batchCostEstimate.disclaimer}</span>
            </div>
            <a
              href={SEEDANCE_PRICING_SOURCE.url}
              target="_blank"
              rel="noreferrer"
            >
              定价口径来源 ↗
            </a>
          </div>
          {(batchSizeErrors.length > 0 || batchConstraintErrors.length > 0) && (
            <ul className="batch-errors">
              {[...batchSizeErrors, ...batchConstraintErrors].map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
          {!active && (
            <label className="cost-confirmation batch-first-confirmation">
              <input
                type="checkbox"
                checked={batchCostConfirmed}
                onChange={(event) =>
                  setBatchCostConfirmed(event.target.checked)
                }
              />
              <span>
                我理解本批次将创建 {batchTaskCount} 个真实任务；每项都会独立计费，
                且本页不会自动重试。
              </span>
            </label>
          )}
          <div className="execution-actions batch-panel-actions">
            <button
              className="execute-button"
              type="button"
              onClick={prepareNewBatch}
              disabled={!batchReady}
            >
              进入最终费用确认
            </button>
            <span>
              创建和状态查询最多同时 3 个；页面预览与费用计算不会创建任务。
            </span>
          </div>
        </section>
      )}

      {experimentMode === "single" && (
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
              {ratio} · {formatRequestedDuration(duration, modelCapabilities)}
              {resolution ? ` · ${resolution.toUpperCase()}` : ""} ·{" "}
              {outputFormat.toUpperCase()} ·{" "}
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
                : isTerminalTaskStatus(taskStatus)
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
                : taskStatus === "failed" ||
                    taskStatus === "cancelled" ||
                    taskStatus === "expired"
                  ? "timeline-step is-error"
                  : "timeline-step"
            }
          >
            <span>03</span>
            <p>
              <strong>
                {taskStatus === "failed"
                  ? "任务失败"
                  : taskStatus === "cancelled"
                    ? "任务已取消"
                    : taskStatus === "expired"
                      ? "任务已过期"
                      : "取得结果"}
              </strong>
              {taskError ||
                (resultVideoUrl ? "视频 URL 已返回" : "等待生成完成")}
            </p>
          </div>
        </div>

        {resultVideoUrl && (
          <div className="result-card">
            <video src={resultVideoUrl} controls playsInline preload="metadata" />
            <p>
              实际输出：{resultRatio || ratio} ·{" "}
              {resultDuration !== undefined ? `${resultDuration} 秒` : "时长待返回"} ·{" "}
              {(resultResolution || resolution || "模型默认").toUpperCase()} ·{" "}
              {(resultOutputFormat || outputFormat).toUpperCase()}
              {resultUsage?.totalTokens !== undefined
                ? ` · ${resultUsage.totalTokens} tokens`
                : ""}
            </p>
            <div className="result-card-actions">
              <div>
                <a href={resultVideoUrl} target="_blank" rel="noreferrer">
                  在新窗口打开结果视频 ↗
                </a>
                <a
                  href={resultVideoUrl}
                  download={`${selectedExampleTitle}-${taskId || activeHistoryId || "result"}.${resultOutputFormat || outputFormat}`}
                >
                  下载结果视频 ↓
                </a>
                {resultLastFrameUrl && (
                  <a href={resultLastFrameUrl} target="_blank" rel="noreferrer">
                    打开返回的尾帧图 ↗
                  </a>
                )}
              </div>
              <SaveToMaterialLibraryButton
                kind="video"
                name={`${selectedExampleTitle}-${taskId || activeHistoryId || "result"}.${resultOutputFormat || outputFormat}`}
                source="seedance"
                sourceRef={`seedance:${taskId || activeHistoryId || resultVideoUrl}`}
                sourceValue={resultVideoUrl}
              />
            </div>
          </div>
        )}
      </section>
      )}

      {batchRecords.length > 0 && (
        <section className="batch-results-panel" aria-labelledby="batch-results-heading">
          <div className="execution-summary batch-results-header">
            <div>
              <span className="config-kicker">BATCH COMPARISON</span>
              <h3 id="batch-results-heading">批次结果对比</h3>
            </div>
            <span>{batchRecords.length} / {SEEDANCE_BATCH_MAX_RECORDS} 个本地批次</span>
          </div>
          <div className="batch-record-list">
            {batchRecords.map((record, recordIndex) => {
              const counts = summarizeBatch(record);
              const retryableItems = record.items.filter(
                (item) => item.status === "not_created" && item.retryable,
              );
              return (
                <details key={record.id} open={recordIndex === 0}>
                  <summary>
                    <span>
                      <strong>{record.id}</strong>
                      <small>{formatHistoryTime(record.createdAt)}</small>
                    </span>
                    <span className="batch-record-counts">
                      <span className="is-success">成功 {counts.succeeded}</span>
                      <span className="is-active">运行 {counts.active}</span>
                      <span className="is-failed">失败 {counts.failed}</span>
                      <span className="is-pending">未创建 {counts.notCreated}</span>
                      <span className="is-unknown">结果未知 {counts.unknown}</span>
                    </span>
                  </summary>
                  <div className="batch-record-meta">
                    <code>{record.model}</code>
                    <span>{record.prompts.length} Prompt × {record.draws} 抽</span>
                    {retryableItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          prepareBatchRetry(
                            record.id,
                            retryableItems.map((item) => item.id),
                          )
                        }
                        disabled={active}
                      >
                        重新确认并重试 {retryableItems.length} 个未创建项
                      </button>
                    )}
                    {record.items.some(
                      (item) => item.status === "queued" || item.status === "running",
                    ) && (
                      <>
                        <button
                          type="button"
                          onClick={() => void monitorBatch(record.id)}
                          disabled={!apiKey.trim()}
                        >
                          手动恢复轮询
                        </button>
                        {!apiKey.trim() && (
                          <span className="field-error">
                            此批次未保存 API Key，请在连接区重新输入后手动恢复。
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="batch-comparison-scroll">
                    <table className="batch-comparison-table">
                      <thead>
                        <tr>
                          <th>Prompt</th>
                          {Array.from({ length: record.draws }, (_, index) => (
                            <th key={index}>抽卡 {index + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {record.prompts.map((recordPrompt, promptIndex) => (
                          <tr key={`${record.id}-prompt-${promptIndex}`}>
                            <th>
                              <span>Prompt {promptIndex + 1}</span>
                              <small>{recordPrompt}</small>
                            </th>
                            {Array.from({ length: record.draws }, (_, drawIndex) => {
                              const item = record.items.find(
                                (candidate) =>
                                  candidate.promptIndex === promptIndex &&
                                  candidate.drawIndex === drawIndex,
                              );
                              return (
                                <td
                                  className={`batch-cell state-${item?.status ?? "not_created"}`}
                                  key={drawIndex}
                                >
                                  {item ? (
                                    <BatchResultCell
                                      item={item}
                                      batchId={record.id}
                                      onRetry={() =>
                                        prepareBatchRetry(record.id, [item.id])
                                      }
                                      retryDisabled={active}
                                    />
                                  ) : (
                                    <span>未创建</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}

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
                  {record.model} · {record.ratio} ·{" "}
                  {formatStoredDuration(record.duration)} ·{" "}
                  {(record.resultOutputFormat ||
                    record.requestBody?.output_format ||
                    "mp4").toUpperCase()}
                </p>
                {record.exampleTitle && <strong>{record.exampleTitle}</strong>}
                {record.error && (
                  <p className="history-error">{record.error}</p>
                )}
                {record.resultVideoUrl && (
                  <div className="history-material-row">
                    <a
                      href={record.resultVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      打开结果视频 ↗
                    </a>
                    <a
                      href={record.resultVideoUrl}
                      download={`${record.exampleTitle || "Seedance 生成视频"}-${record.taskId || record.id}.${record.resultOutputFormat || record.requestBody?.output_format || "mp4"}`}
                    >
                      下载结果视频 ↓
                    </a>
                    <SaveToMaterialLibraryButton
                      compact
                      kind="video"
                      name={`${record.exampleTitle || "Seedance 生成视频"}-${record.taskId || record.id}.${record.resultOutputFormat || record.requestBody?.output_format || "mp4"}`}
                      source="seedance"
                      sourceRef={`seedance:${record.taskId || record.id}`}
                      sourceValue={record.resultVideoUrl}
                    />
                  </div>
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

      {batchConfirmation && (
        <div
          className="log-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setBatchConfirmation(null);
              setBatchFinalConfirmed(false);
            }
          }}
        >
          <section
            className="log-dialog batch-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="batch-confirm-heading"
          >
            <div className="log-dialog-heading">
              <div>
                <span className="config-kicker">FINAL COST CONFIRMATION</span>
                <h3 id="batch-confirm-heading">
                  {batchConfirmation.retryItemIds ? "重试费用确认" : "批量费用确认"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBatchConfirmation(null);
                  setBatchFinalConfirmed(false);
                }}
              >
                取消
              </button>
            </div>
            <div className="batch-confirm-content">
              <dl className="review-grid">
                <div>
                  <dt>本地批次 ID</dt>
                  <dd><code>{batchConfirmation.batchId}</code></dd>
                </div>
                <div>
                  <dt>新增调用数</dt>
                  <dd>{confirmationTaskCount} 次</dd>
                </div>
                <div>
                  <dt>费用摘要</dt>
                  <dd>{confirmationCostEstimate.label}</dd>
                </div>
                <div>
                  <dt>重试规则</dt>
                  <dd>
                    {batchConfirmation.retryItemIds
                      ? "只重试明确未创建项"
                      : "失败后不自动重试"}
                  </dd>
                </div>
              </dl>
              <p className="batch-confirm-warning">
                {confirmationCostEstimate.disclaimer}
              </p>
              <label className="cost-confirmation">
                <input
                  type="checkbox"
                  checked={batchFinalConfirmed}
                  onChange={(event) =>
                    setBatchFinalConfirmed(event.target.checked)
                  }
                />
                <span>
                  我再次确认批次 ID、{confirmationTaskCount} 次新增调用和费用摘要，
                  并同意开始创建真实任务。
                </span>
              </label>
              <div className="execution-actions">
                <button
                  className="execute-button"
                  type="button"
                  onClick={() => void startConfirmedBatch()}
                  disabled={!batchFinalConfirmed || !apiKey.trim()}
                >
                  确认并启动批次
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

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

function BatchResultCell({
  item,
  batchId,
  onRetry,
  retryDisabled,
}: {
  item: SeedanceBatchItem;
  batchId: string;
  onRetry: () => void;
  retryDisabled: boolean;
}) {
  return (
    <div className="batch-result-cell">
      <span className={`task-status status-${item.status}`}>
        {batchItemStatusLabel(item.status)}
      </span>
      <small>尝试 {item.attempts} 次</small>
      {item.taskId && <code>{item.taskId}</code>}
      {item.videoUrl && (
        <video src={item.videoUrl} controls playsInline preload="metadata" />
      )}
      {(item.duration !== undefined || item.resolution || item.ratio) && (
        <small>
          {item.ratio ?? "比例待返回"} · {item.duration ?? "时长待返回"} 秒 · {" "}
          {item.resolution?.toUpperCase() ?? "分辨率待返回"}
          {item.outputFormat ? ` · ${item.outputFormat.toUpperCase()}` : ""}
        </small>
      )}
      {item.usage?.totalTokens !== undefined && (
        <small>{item.usage.totalTokens} tokens</small>
      )}
      {item.error && <p className="field-error">{item.error}</p>}
      <div className="batch-cell-actions">
        {item.videoUrl && (
          <>
            <a href={item.videoUrl} target="_blank" rel="noreferrer">
              打开 ↗
            </a>
            <a
              href={item.videoUrl}
              download={`${batchId}-${item.promptIndex + 1}-${item.drawIndex + 1}.${item.outputFormat ?? "mp4"}`}
            >
              下载 ↓
            </a>
            <SaveToMaterialLibraryButton
              kind="video"
              name={`${batchId}-${item.promptIndex + 1}-${item.drawIndex + 1}.${item.outputFormat ?? "mp4"}`}
              source="seedance"
              sourceRef={`seedance:${item.taskId ?? item.id}`}
              sourceValue={item.videoUrl}
            />
          </>
        )}
        {item.status === "not_created" && item.retryable && (
          <button type="button" onClick={onRetry} disabled={retryDisabled}>
            重新确认后重试
          </button>
        )}
      </div>
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
  outputFormat: SeedanceOutputFormat;
  omniReferenceTaskType?: SeedanceOmniReferenceTaskType;
  webSearch: boolean;
  returnLastFrame: boolean;
};

function buildUpstreamRequestBody(
  parameters: EditableApiParameters,
): SeedanceRequestBody {
  const body: SeedanceRequestBody = {
    model: parameters.model,
    content: [
      ...(parameters.prompt.trim()
        ? [{ type: "text" as const, text: parameters.prompt.trim() }]
        : []),
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
  if (parameters.outputFormat !== "mp4") {
    body.output_format = parameters.outputFormat;
  }
  if (parameters.omniReferenceTaskType !== undefined) {
    body.omni_reference_task_type = parameters.omniReferenceTaskType;
  }
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
  const allowedKeys = new Set([
    "model",
    "content",
    "generate_audio",
    "resolution",
    "ratio",
    "duration",
    "output_format",
    "omni_reference_task_type",
    "watermark",
    "return_last_frame",
    "tools",
  ]);
  const unsupportedKey = Object.keys(body).find((key) => !allowedKeys.has(key));
  if (unsupportedKey) {
    throw new Error(`Request Body 包含未开放转发的字段：${unsupportedKey}。`);
  }
  const model = stringValue(body.model, "model");
  if (!isAllowedModel(apiPath, model)) {
    throw new Error("model 必须属于当前 API 路径。");
  }
  if (!Array.isArray(body.content)) {
    throw new Error("content 必须是数组。");
  }

  const textItems = body.content.filter(
    (item) => isRecord(item) && item.type === "text",
  );
  if (textItems.length > 1) throw new Error("content 最多包含一项 text。");
  const textItem = textItems[0];
  const prompt = isRecord(textItem)
    ? stringValue(textItem.text, "content.text")
    : "";
  const mediaItems = body.content
    .filter((item) => isRecord(item) && item.type !== "text")
    .map(parseMediaContent);
  const ratio = stringValue(body.ratio, "ratio");
  if (!RATIOS.includes(ratio as (typeof RATIOS)[number])) {
    throw new Error("ratio 不在当前支持范围内。");
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
  if (
    body.output_format !== undefined &&
    body.output_format !== "mp4" &&
    body.output_format !== "mov"
  ) {
    throw new Error("output_format 只支持 mp4 或 mov。");
  }
  if (
    body.omni_reference_task_type !== undefined &&
    body.omni_reference_task_type !== "auto" &&
    body.omni_reference_task_type !== "reference" &&
    body.omni_reference_task_type !== "edit" &&
    body.omni_reference_task_type !== "extend"
  ) {
    throw new Error(
      "omni_reference_task_type 只支持 auto、reference、edit 或 extend。",
    );
  }
  if (
    body.tools !== undefined &&
    (!Array.isArray(body.tools) ||
      body.tools.length !== 1 ||
      !isRecord(body.tools[0]) ||
      Object.keys(body.tools[0]).length !== 1 ||
      body.tools[0].type !== "web_search")
  ) {
    throw new Error('tools 当前只支持 [{"type":"web_search"}]。');
  }
  const webSearch = body.tools !== undefined;
  const outputFormat = (body.output_format ?? "mp4") as SeedanceOutputFormat;
  const content = [
    ...(prompt ? [{ type: "text", text: prompt }] : []),
    ...mediaItems.map(mediaEditorToContent),
  ];
  const constraintErrors = validateSeedanceConstraints({
    apiPath,
    model,
    content,
    ratio,
    duration: body.duration,
    resolution: body.resolution,
    outputFormat,
    omniReferenceTaskType: body.omni_reference_task_type,
    webSearch,
  });
  if (constraintErrors.length > 0) {
    throw new Error(constraintErrors[0]);
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
    outputFormat,
    omniReferenceTaskType:
      body.omni_reference_task_type as
        | SeedanceOmniReferenceTaskType
        | undefined,
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

function countMediaItems(items: MediaEditorItem[]) {
  const counts = {
    image_url: 0,
    video_url: 0,
    audio_url: 0,
    total: items.length,
  };
  items.forEach((item) => {
    counts[item.type] += 1;
  });
  return counts;
}

function buildConstraintContent(
  prompt: string,
  items: MediaEditorItem[],
) {
  return [
    ...(prompt.trim()
      ? [{ type: "text", text: prompt.trim() }]
      : []),
    ...items.map((item) => ({ type: item.type, role: item.role })),
  ];
}

function formatRequestedDuration(
  duration: number,
  modelCapabilities: ReturnType<typeof getModelCapabilities>,
): string {
  if (duration !== -1) return `${duration} 秒`;
  return `智能时长（${modelCapabilities?.duration.min ?? 4}–${modelCapabilities?.duration.max ?? 30} 秒）`;
}

function formatStoredDuration(duration: number): string {
  return duration === -1 ? "智能时长" : `${duration} 秒`;
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
  if (
    status === "succeeded" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "expired" ||
    status === "queued"
  ) {
    return status;
  }
  return "running";
}

function isTerminalTaskStatus(status: string): boolean {
  return (
    status === "succeeded" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "expired"
  );
}

function statusLabel(status: HistoryRecord["status"]): string {
  const labels: Record<HistoryRecord["status"], string> = {
    submitting: "提交中",
    queued: "已排队",
    running: "生成中",
    succeeded: "已完成",
    failed: "失败",
    cancelled: "已取消",
    expired: "已过期",
  };
  return labels[status];
}

function batchItemStatusLabel(status: SeedanceBatchItemStatus): string {
  const labels: Record<SeedanceBatchItemStatus, string> = {
    pending: "等待创建",
    submitting: "正在创建",
    queued: "已排队",
    running: "生成中",
    succeeded: "已完成",
    failed: "远端失败",
    cancelled: "已取消",
    expired: "已过期",
    not_created: "未创建",
    unknown: "创建结果未知",
  };
  return labels[status];
}

function summarizeBatch(record: SeedanceBatchRecord) {
  return record.items.reduce(
    (summary, item) => {
      if (item.status === "succeeded") summary.succeeded += 1;
      else if (
        item.status === "pending" ||
        item.status === "submitting" ||
        item.status === "queued" ||
        item.status === "running"
      ) {
        summary.active += 1;
      } else if (item.status === "not_created") summary.notCreated += 1;
      else if (item.status === "unknown") summary.unknown += 1;
      else summary.failed += 1;
      return summary;
    },
    { succeeded: 0, active: 0, failed: 0, notCreated: 0, unknown: 0 },
  );
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

function readBatchRecords(): SeedanceBatchRecord[] {
  try {
    const raw = window.localStorage.getItem(SEEDANCE_BATCH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isSeedanceBatchRecord)
      .map((record) => ({
        ...record,
        items: record.items.map((item) =>
          item.status === "pending" || item.status === "submitting"
            ? {
                ...item,
                status: "unknown" as const,
                retryable: false,
                error:
                  "页面在创建阶段中断，无法确认是否已产生远端任务，禁止直接重试。",
              }
            : item,
        ),
      }))
      .slice(0, SEEDANCE_BATCH_MAX_RECORDS);
  } catch {
    return [];
  }
}

function writeBatchRecords(records: SeedanceBatchRecord[]) {
  try {
    window.localStorage.setItem(
      SEEDANCE_BATCH_STORAGE_KEY,
      JSON.stringify(records.slice(0, SEEDANCE_BATCH_MAX_RECORDS)),
    );
  } catch {
    // Batch execution remains usable when local persistence is unavailable.
  }
}

function isSeedanceBatchRecord(value: unknown): value is SeedanceBatchRecord {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    (value.apiPath !== "official" && value.apiPath !== "agent-plan") ||
    typeof value.baseUrl !== "string" ||
    typeof value.model !== "string" ||
    !Array.isArray(value.prompts) ||
    !value.prompts.every((prompt) => typeof prompt === "string") ||
    typeof value.draws !== "number" ||
    !isRecord(value.requestTemplate) ||
    !Array.isArray(value.items)
  ) {
    return false;
  }
  return value.items.every((item) => {
    if (!isRecord(item)) return false;
    return (
      typeof item.id === "string" &&
      typeof item.promptIndex === "number" &&
      typeof item.drawIndex === "number" &&
      typeof item.prompt === "string" &&
      typeof item.historyId === "string" &&
      typeof item.status === "string" &&
      typeof item.attempts === "number" &&
      typeof item.retryable === "boolean"
    );
  });
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
      record.status === "failed" ||
      record.status === "cancelled" ||
      record.status === "expired") &&
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
