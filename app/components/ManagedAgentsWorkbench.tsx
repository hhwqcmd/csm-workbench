"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MANAGED_AGENTS_BASE_URL } from "../lib/managed-agents-server";

type StepKey = "agent" | "environment" | "session";
type DraftKey = StepKey | "session-event";
type StepStatus = "idle" | "running" | "succeeded" | "failed";
type AgentMode = "create" | "update";
type SessionMode =
  | "create"
  | "retrieve"
  | "list"
  | "events"
  | "files"
  | "memory"
  | "delete";
type SessionEventMode = "message" | "interrupt" | "tool-confirmation";
type SessionFileMode =
  | "upload"
  | "add-resource"
  | "list-resources"
  | "delete-resource"
  | "list-generated";
type SessionMemoryMode =
  | "create-store"
  | "list-stores"
  | "delete-store"
  | "create-memory"
  | "list-memories"
  | "retrieve-memory"
  | "update-memory"
  | "delete-memory";

type AgentSkill = {
  type: "skill_hub" | "custom";
  skill_id?: string;
  version?: string;
};

type AgentTool = {
  type: "agent_toolset_20260701" | "evolution" | "mcp_toolset";
  mcp_server_name?: string;
  default_config?: { enabled: boolean };
  configs?: Array<{ name: string; enabled: boolean }>;
};

type AgentBody = {
  version?: number;
  name?: string;
  description?: string;
  model?: { id: string; speed?: "standard" | "fast" };
  system?: string;
  skills?: AgentSkill[];
  tools?: AgentTool[];
  mcp_servers?: Array<{ type: "url"; name: string; url: string }>;
  multiagent?: {
    type: "coordinator";
    agents: Array<
      | { type: "self" }
      | { type: "agent"; id: string; version?: number }
    >;
  };
  metadata?: Record<string, string>;
};

type EnvironmentPackageManager =
  | "apt"
  | "cargo"
  | "gem"
  | "go"
  | "npm"
  | "pip";

type EnvironmentPackages = Partial<
  Record<EnvironmentPackageManager, string[]>
> & {
  type?: "packages";
};

type EnvironmentBody = {
  name: string;
  description?: string;
  config: {
    type: "cloud";
    networking:
      | { type: "unrestricted" }
      | {
          type: "limited";
          allow_mcp_servers?: boolean;
          allow_package_managers?: boolean;
          allowed_hosts?: string[];
        };
    packages?: EnvironmentPackages;
    env?: Record<string, string>;
  };
  metadata?: Record<string, string>;
  scope?: "organization" | "account";
};

type SessionBody = {
  agent:
    | string
    | { type: "agent"; id: string; version: number };
  environment_id: string;
  vault_ids?: string[];
  resources?: SessionResource[];
};

type SessionResource =
  | { type: "file"; file_id: string; mount_path?: string }
  | { type: "tos"; tos_bucket: string; tos_key: string }
  | {
      type: "memory_store";
      memory_store_id: string;
      instructions?: string;
    };

type MessageBody = {
  events: Array<Record<string, unknown>>;
};

type ManagedLogEntry = {
  at: string;
  phase: StepKey | "session-event" | "stream";
  request: {
    method: "POST" | "GET" | "DELETE";
    url: string;
    headers: Record<string, string>;
    body?: unknown;
  };
  response?: {
    httpStatus: number;
    body: unknown;
  };
  error?: string;
};

type ManagedRun = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: StepStatus;
  agentId?: string;
  environmentId?: string;
  sessionId?: string;
  transcript?: string;
  error?: string;
  logs: ManagedLogEntry[];
};

type JsonResponse = {
  id?: string;
  error?: string;
  [key: string]: unknown;
};

type AgentApiResult = {
  mode: AgentMode;
  httpStatus?: number;
  receivedAt: string;
  body: unknown;
};

type EnvironmentApiResult = {
  httpStatus?: number;
  receivedAt: string;
  body: unknown;
};

type SessionApiResult = {
  action: SessionMode | SessionFileMode | SessionMemoryMode;
  httpStatus?: number;
  receivedAt: string;
  body: unknown;
};

const CREDENTIAL_STORAGE_KEY = "seedance-workbench:demo-credentials:v1";
const HISTORY_STORAGE_KEY = "seedance-workbench:managed-agents-history:v1";
const MAX_HISTORY = 20;
const ENVIRONMENT_PACKAGE_MANAGERS: Array<{
  key: EnvironmentPackageManager;
  label: string;
  description: string;
}> = [
  { key: "apt", label: "apt", description: "系统包，例如 curl、ffmpeg" },
  { key: "cargo", label: "cargo", description: "Rust crate" },
  { key: "gem", label: "gem", description: "RubyGems 包" },
  { key: "go", label: "go", description: "Go module" },
  { key: "npm", label: "npm", description: "Node.js 包" },
  { key: "pip", label: "pip", description: "Python 包，可锁定版本" },
];

const INITIAL_AGENT_BODY: AgentBody = {
  name: "QuickStartAgent",
  description: "Managed Agents 全字段演示 Agent。",
  model: { id: "doubao-seed-evolving", speed: "standard" },
  system: "你是一个高效的编程助手，擅长代码编写和问题排查。",
  metadata: {},
};

const INITIAL_ENVIRONMENT_BODY: EnvironmentBody = {
  name: "demo-env",
  description: "Managed Agents 云端沙箱演示环境。",
  config: {
    type: "cloud",
    networking: { type: "unrestricted" },
    packages: {
      type: "packages",
      pip: ["pandas"],
      apt: ["curl"],
    },
    env: {
      MY_KEY_0: "value_0",
    },
  },
  metadata: {},
};

const INITIAL_MESSAGE_BODY: MessageBody = {
  events: [
    {
      type: "user.message",
      content: [
        {
          type: "text",
          text: "用 Python 编写一个脚本，生成前 20 个斐波那契数，并将其保存到 fibonacci.txt。",
        },
      ],
    },
  ],
};

const INITIAL_SESSION_BODY: SessionBody = {
  agent: "",
  environment_id: "",
};

const INITIAL_SESSION_LIST_QUERY = {
  agent_id: "",
  limit: 20,
};

const INITIAL_FILE_RESOURCE: Extract<SessionResource, { type: "file" }> = {
  type: "file",
  file_id: "",
  mount_path: "inputs/reference.md",
};

const INITIAL_MEMORY_STORE_BODY = {
  name: "ProjectContext",
  description: "保存项目规范、用户偏好和可跨 Session 复用的背景信息。",
};

const INITIAL_MEMORY_BODY = {
  path: "/project/context.md",
  content: "项目输出使用中文，并优先给出结论和可执行步骤。",
};

const INITIAL_MEMORY_QUERY = {
  path_prefix: "/",
  order_by: "path" as const,
  depth: 2,
};

export function ManagedAgentsWorkbench() {
  const [baseUrl, setBaseUrl] = useState(MANAGED_AGENTS_BASE_URL);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [rememberApiKey, setRememberApiKey] = useState(true);
  const [agentMode, setAgentMode] = useState<AgentMode>("create");
  const [targetAgentId, setTargetAgentId] = useState("");
  const [sessionMode, setSessionMode] = useState<SessionMode>("create");
  const [sessionEventMode, setSessionEventMode] =
    useState<SessionEventMode>("message");
  const [sessionFileMode, setSessionFileMode] =
    useState<SessionFileMode>("upload");
  const [sessionMemoryMode, setSessionMemoryMode] =
    useState<SessionMemoryMode>("create-store");
  const [deleteSessionConfirmed, setDeleteSessionConfirmed] = useState(false);
  const [agentBody, setAgentBody] = useState<AgentBody>(INITIAL_AGENT_BODY);
  const [environmentBody, setEnvironmentBody] =
    useState<EnvironmentBody>(INITIAL_ENVIRONMENT_BODY);
  const [sessionBody, setSessionBody] =
    useState<SessionBody>(INITIAL_SESSION_BODY);
  const [sessionListQuery, setSessionListQuery] = useState(
    INITIAL_SESSION_LIST_QUERY,
  );
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileResourceBody, setFileResourceBody] =
    useState(INITIAL_FILE_RESOURCE);
  const [sessionResourceId, setSessionResourceId] = useState("");
  const [memoryStoreId, setMemoryStoreId] = useState("");
  const [memoryId, setMemoryId] = useState("");
  const [memoryStoreBody, setMemoryStoreBody] = useState(
    INITIAL_MEMORY_STORE_BODY,
  );
  const [memoryBody, setMemoryBody] = useState(INITIAL_MEMORY_BODY);
  const [memoryQuery, setMemoryQuery] = useState(INITIAL_MEMORY_QUERY);
  const [messageBody, setMessageBody] =
    useState<MessageBody>(INITIAL_MESSAGE_BODY);
  const [agentDraft, setAgentDraft] = useState(
    prettyJson(INITIAL_AGENT_BODY),
  );
  const [environmentDraft, setEnvironmentDraft] = useState(
    prettyJson(INITIAL_ENVIRONMENT_BODY),
  );
  const [sessionDraft, setSessionDraft] = useState(
    prettyJson(INITIAL_SESSION_BODY),
  );
  const [messageDraft, setMessageDraft] = useState(
    prettyJson(INITIAL_MESSAGE_BODY),
  );
  const [draftErrors, setDraftErrors] = useState<
    Partial<Record<DraftKey, string>>
  >({});
  const [stepStatus, setStepStatus] = useState<
    Record<StepKey, StepStatus>
  >({
    agent: "idle",
    environment: "idle",
    session: "idle",
  });
  const [agentId, setAgentId] = useState("");
  const [agentApiResult, setAgentApiResult] =
    useState<AgentApiResult | null>(null);
  const [environmentId, setEnvironmentId] = useState("");
  const [environmentApiResult, setEnvironmentApiResult] =
    useState<EnvironmentApiResult | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [sessionApiResult, setSessionApiResult] =
    useState<SessionApiResult | null>(null);
  const [transcript, setTranscript] = useState("");
  const [streamEvents, setStreamEvents] = useState<unknown[]>([]);
  const [activeRunId, setActiveRunId] = useState("");
  const [history, setHistory] = useState<ManagedRun[]>([]);
  const [selectedLogRunId, setSelectedLogRunId] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  const baseUrlMatches =
    baseUrl.replace(/\/$/, "") === MANAGED_AGENTS_BASE_URL;
  const busy = Object.values(stepStatus).includes("running");
  const agentBodyReady =
    agentMode === "create"
      ? Boolean(agentBody.name?.trim() && agentBody.model?.id.trim())
      : Number.isInteger(agentBody.version) && (agentBody.version ?? 0) >= 1;
  const environmentBodyReady = Boolean(environmentBody.name.trim());
  const selectedRun =
    history.find((item) => item.id === selectedLogRunId) ?? null;

  const agentUrl =
    agentMode === "update"
      ? `${baseUrl.replace(/\/$/, "")}/agents/${
          targetAgentId || "{AGENT_ID}"
        }`
      : `${baseUrl.replace(/\/$/, "")}/agents`;
  const environmentUrl = `${baseUrl.replace(/\/$/, "")}/environments`;
  const sessionBaseUrl = `${baseUrl.replace(/\/$/, "")}/sessions`;
  const sessionResourceUrl = `${sessionBaseUrl}/${
    sessionId || "{SESSION_ID}"
  }`;
  const sessionResourcesUrl = `${sessionResourceUrl}/resources`;
  const filesUrl = `${baseUrl.replace(/\/$/, "")}/files`;
  const memoryStoresUrl = `${baseUrl.replace(/\/$/, "")}/memory_stores`;
  const memoriesUrl = `${memoryStoresUrl}/${
    memoryStoreId || "{MEMORY_STORE_ID}"
  }/memories`;
  const sessionListSearch = new URLSearchParams();
  if (sessionListQuery.agent_id.trim()) {
    sessionListSearch.set("agent_id", sessionListQuery.agent_id.trim());
  }
  if (sessionListQuery.limit) {
    sessionListSearch.set("limit", String(sessionListQuery.limit));
  }
  const sessionListUrl = `${sessionBaseUrl}${
    sessionListSearch.size > 0 ? `?${sessionListSearch.toString()}` : ""
  }`;
  const eventsUrl = `${baseUrl.replace(/\/$/, "")}/sessions/${
    sessionId || "{SESSION_ID}"
  }/events`;
  const fileApi = sessionFileApiDetails({
    mode: sessionFileMode,
    filesUrl,
    sessionResourcesUrl,
    sessionId,
    resourceId: sessionResourceId,
    uploadFile,
    requestBody: fileResourceBody,
  });
  const memoryApi = sessionMemoryApiDetails({
    mode: sessionMemoryMode,
    memoryStoresUrl,
    memoriesUrl,
    storeId: memoryStoreId,
    memoryId,
    storeBody: memoryStoreBody,
    memoryBody,
    query: memoryQuery,
  });
  const sessionApiMethod: "POST" | "GET" | "DELETE" =
    sessionMode === "files"
      ? fileApi.method
      : sessionMode === "memory"
        ? memoryApi.method
        : sessionMode === "create" || sessionMode === "events"
          ? "POST"
          : sessionMode === "delete"
            ? "DELETE"
            : "GET";
  const sessionApiUrl =
    sessionMode === "files"
      ? fileApi.url
      : sessionMode === "memory"
        ? memoryApi.url
        : sessionMode === "create"
          ? sessionBaseUrl
          : sessionMode === "list"
            ? sessionListUrl
            : sessionMode === "events"
              ? eventsUrl
              : sessionResourceUrl;
  const sessionApiBody =
    sessionMode === "files"
      ? fileApi.body
      : sessionMode === "memory"
        ? memoryApi.body
        : undefined;
  const sessionActionLabel = {
    create: "创建 Session",
    retrieve: "检索 Session",
    list: "列出 Session",
    events: "先开事件流并发送事件",
    files: sessionFileActionLabel(sessionFileMode),
    memory: sessionMemoryActionLabel(sessionMemoryMode),
    delete: "永久删除 Session",
  }[sessionMode];
  const sessionActionDisabled =
    !apiKey.trim() ||
    !baseUrlMatches ||
    busy ||
    (sessionMode === "create" &&
      (!sessionAgentId(sessionBody.agent) ||
        !sessionBody.environment_id.trim() ||
        Boolean(draftErrors.session))) ||
    ((sessionMode === "retrieve" ||
      sessionMode === "events" ||
      sessionMode === "files" ||
      sessionMode === "delete") &&
      !sessionId.trim() &&
      !(sessionMode === "files" && sessionFileMode === "upload")) ||
    (sessionMode === "events" &&
      Boolean(draftErrors["session-event"])) ||
    (sessionMode === "files" &&
      ((sessionFileMode === "upload" && !uploadFile) ||
        (sessionFileMode === "add-resource" &&
          !fileResourceBody.file_id.trim()) ||
        (sessionFileMode === "delete-resource" &&
          !sessionResourceId.trim()))) ||
    (sessionMode === "memory" &&
      ((sessionMemoryMode !== "create-store" &&
        sessionMemoryMode !== "list-stores" &&
        !memoryStoreId.trim()) ||
        ((sessionMemoryMode === "retrieve-memory" ||
          sessionMemoryMode === "update-memory" ||
          sessionMemoryMode === "delete-memory") &&
          !memoryId.trim()))) ||
    (sessionMode === "delete" && !deleteSessionConfirmed);

  const patchRun = useCallback(
    (runId: string, patch: Partial<ManagedRun>) => {
      setHistory((current) =>
        current.map((run) =>
          run.id === runId
            ? { ...run, ...patch, updatedAt: new Date().toISOString() }
            : run,
        ),
      );
    },
    [],
  );

  const appendLog = useCallback(
    (runId: string, log: ManagedLogEntry, patch: Partial<ManagedRun> = {}) => {
      setHistory((current) =>
        current.map((run) =>
          run.id === runId
            ? {
                ...run,
                ...patch,
                logs: [...run.logs, log],
                updatedAt: new Date().toISOString(),
              }
            : run,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const suffix = new Date()
        .toISOString()
        .replace(/\D/g, "")
        .slice(6, 14);
      const nextEnvironment = {
        ...INITIAL_ENVIRONMENT_BODY,
        name: `demo-env-${suffix}`,
      };
      setEnvironmentBody(nextEnvironment);
      setEnvironmentDraft(prettyJson(nextEnvironment));
      const storedHistory = readHistory();
      setHistory(storedHistory);
      const resumable = storedHistory.find(
        (run) => run.status === "running" && Boolean(run.agentId),
      );
      if (resumable) {
        const restoredSession = {
          agent: resumable.agentId ?? "",
          environment_id: resumable.environmentId ?? "",
        };
        setActiveRunId(resumable.id);
        setAgentId(resumable.agentId ?? "");
        setEnvironmentId(resumable.environmentId ?? "");
        setSessionId(resumable.sessionId ?? "");
        setSessionBody(restoredSession);
        setSessionDraft(prettyJson(restoredSession));
        setTranscript(resumable.transcript ?? "");
        setStepStatus({
          agent: resumable.agentId ? "succeeded" : "idle",
          environment: resumable.environmentId ? "succeeded" : "idle",
          session: resumable.sessionId ? "succeeded" : "idle",
        });
      }
      const credentials = readCredentials();
      setApiKey(credentials.official ?? "");
      setStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    writeHistory(history);
  }, [history, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    const credentials = readCredentials();
    if (rememberApiKey && apiKey.trim()) {
      credentials.official = apiKey;
    } else {
      delete credentials.official;
    }
    writeCredentials(credentials);
  }, [apiKey, rememberApiKey, storageReady]);

  function updateAgent(next: AgentBody) {
    setAgentBody(next);
    setAgentDraft(prettyJson(next));
    clearDraftError("agent");
  }

  function changeAgentMode(nextMode: AgentMode) {
    setAgentMode(nextMode);
    setAgentApiResult(null);
    setStepStatus((current) => ({ ...current, agent: "idle" }));
    const nextBody =
      nextMode === "update"
        ? { ...agentBody, version: agentBody.version ?? 1 }
        : Object.fromEntries(
            Object.entries(agentBody).filter(([key]) => key !== "version"),
          );
    updateAgent(nextBody);
    if (nextMode === "update" && !targetAgentId && agentId) {
      setTargetAgentId(agentId);
    }
  }

  function updateEnvironment(next: EnvironmentBody) {
    setEnvironmentBody(next);
    setEnvironmentDraft(prettyJson(next));
    clearDraftError("environment");
  }

  function updateSession(next: SessionBody) {
    setSessionBody(next);
    setSessionDraft(prettyJson(next));
    clearDraftError("session");
  }

  function updateMessage(next: MessageBody) {
    setMessageBody(next);
    setMessageDraft(prettyJson(next));
    clearDraftError("session-event");
  }

  function changeSessionMode(nextMode: SessionMode) {
    setSessionMode(nextMode);
    setSessionApiResult(null);
    setDeleteSessionConfirmed(false);
    setStepStatus((current) => ({ ...current, session: "idle" }));
    clearDraftError("session");
    clearDraftError("session-event");
  }

  function changeSessionEventMode(nextMode: SessionEventMode) {
    setSessionEventMode(nextMode);
    const nextBody: MessageBody =
      nextMode === "interrupt"
        ? { events: [{ type: "user.interrupt" }] }
        : nextMode === "tool-confirmation"
          ? {
              events: [
                {
                  type: "user.tool_confirmation",
                  tool_use_id: "",
                  result: "allow",
                },
              ],
            }
          : INITIAL_MESSAGE_BODY;
    updateMessage(nextBody);
    setSessionApiResult(null);
  }

  function clearDraftError(step: DraftKey) {
    setDraftErrors((current) => ({ ...current, [step]: undefined }));
  }

  function editJson(step: DraftKey, value: string) {
    if (step === "agent") setAgentDraft(value);
    if (step === "environment") setEnvironmentDraft(value);
    if (step === "session") setSessionDraft(value);
    if (step === "session-event") setMessageDraft(value);

    try {
      const parsed = JSON.parse(value) as unknown;
      if (step === "agent") setAgentBody(parseAgentBody(parsed));
      if (step === "environment") {
        setEnvironmentBody(parseEnvironmentBody(parsed));
      }
      if (step === "session") setSessionBody(parseSessionBody(parsed));
      if (step === "session-event") {
        setMessageBody(parseMessageBody(parsed));
      }
      clearDraftError(step);
    } catch (error) {
      setDraftErrors((current) => ({
        ...current,
        [step]:
          error instanceof Error ? error.message : "Request Body 不是有效 JSON。",
      }));
    }
  }

  function startRun(): string {
    const runId = `managed-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const now = new Date().toISOString();
    setHistory((current) =>
      [
        {
          id: runId,
          createdAt: now,
          updatedAt: now,
          status: "running",
          logs: [],
        },
        ...current,
      ].slice(0, MAX_HISTORY),
    );
    setActiveRunId(runId);
    return runId;
  }

  function ensureActiveRun(): string {
    if (activeRunId && history.some((run) => run.id === activeRunId)) {
      return activeRunId;
    }
    return startRun();
  }

  async function manageAgent() {
    if (
      !apiReady() ||
      draftErrors.agent ||
      (agentMode === "update" && !targetAgentId.trim())
    ) {
      return;
    }
    setAgentApiResult(null);
    const runId = startRun();
    if (agentMode === "create") setAgentId("");
    setEnvironmentId("");
    setSessionId("");
    setTranscript("");
    setStreamEvents([]);
    setEnvironmentStatusAfterAgentReset();
    const result = await performJsonStep(
      "agent",
      "/api/managed-agents/agents",
      agentUrl,
      agentBody,
      runId,
      {
        mode: agentMode,
        ...(agentMode === "update" ? { agentId: targetAgentId } : {}),
      },
    );
    const managedId =
      typeof result?.id === "string"
        ? result.id
        : agentMode === "update"
          ? targetAgentId
          : "";
    if (!managedId) return;
    setAgentId(managedId);
    setTargetAgentId(managedId);
    if (agentMode === "update" && typeof result?.version === "number") {
      updateAgent({ ...agentBody, version: result.version });
    }
    const nextSession = { ...sessionBody, agent: managedId };
    updateSession(nextSession);
    patchRun(runId, { agentId: managedId });
  }

  function setEnvironmentStatusAfterAgentReset() {
    setEnvironmentApiResult(null);
    setStepStatus({
      agent: "idle",
      environment: "idle",
      session: "idle",
    });
  }

  async function createEnvironment() {
    if (!apiReady() || !agentId || draftErrors.environment) return;
    setEnvironmentApiResult(null);
    const result = await performJsonStep(
      "environment",
      "/api/managed-agents/environments",
      environmentUrl,
      environmentBody,
      activeRunId,
    );
    if (!result?.id) return;
    setEnvironmentId(result.id);
    const nextSession = { ...sessionBody, environment_id: result.id };
    updateSession(nextSession);
    patchRun(activeRunId, { environmentId: result.id });
  }

  async function manageSessionFiles() {
    const runId = ensureActiveRun();
    const requestLog = buildRequestLog(
      "session",
      fileApi.method,
      fileApi.url,
      fileApi.body,
    );
    setStepStatus((current) => ({ ...current, session: "running" }));
    setSessionApiResult(null);
    try {
      let response: Response;
      if (sessionFileMode === "upload") {
        if (!uploadFile) return;
        const form = new FormData();
        form.set("baseUrl", baseUrl);
        form.set("apiKey", apiKey);
        form.set("file", uploadFile);
        response = await fetch("/api/managed-agents/files", {
          method: "POST",
          cache: "no-store",
          body: form,
        });
      } else {
        const localPath =
          sessionFileMode === "list-generated"
            ? "/api/managed-agents/files"
            : "/api/managed-agents/session-resources";
        const proxyBody =
          sessionFileMode === "list-generated"
            ? { baseUrl, apiKey, action: "list", scopeId: sessionId }
            : {
                baseUrl,
                apiKey,
                action:
                  sessionFileMode === "add-resource"
                    ? "add"
                    : sessionFileMode === "delete-resource"
                      ? "delete"
                      : "list",
                sessionId,
                ...(sessionFileMode === "add-resource"
                  ? { requestBody: fileResourceBody }
                  : {}),
                ...(sessionFileMode === "delete-resource"
                  ? { resourceId: sessionResourceId }
                  : {}),
              };
        response = await fetch(localPath, {
          method: "POST",
          headers: { "content-type": "application/json" },
          cache: "no-store",
          body: JSON.stringify(proxyBody),
        });
      }
      const payload = (await response.json()) as JsonResponse;
      setSessionApiResult({
        action: sessionFileMode,
        httpStatus: response.status,
        receivedAt: new Date().toISOString(),
        body: payload,
      });
      appendLog(
        runId,
        {
          ...requestLog,
          response: { httpStatus: response.status, body: payload },
        },
        {
          status: response.ok ? "succeeded" : "failed",
          error: response.ok ? undefined : payload.error,
        },
      );
      if (!response.ok) {
        throw new Error(payload.error ?? "管理 Session 文件失败。");
      }
      if (
        sessionFileMode === "upload" &&
        typeof payload.id === "string"
      ) {
        setFileResourceBody((current) => ({
          ...current,
          file_id: payload.id as string,
        }));
      }
      if (
        sessionFileMode === "add-resource" &&
        typeof payload.id === "string"
      ) {
        setSessionResourceId(payload.id);
      }
      setStepStatus((current) => ({ ...current, session: "succeeded" }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "管理 Session 文件失败。";
      setSessionApiResult({
        action: sessionFileMode,
        receivedAt: new Date().toISOString(),
        body: { error: message },
      });
      setStepStatus((current) => ({ ...current, session: "failed" }));
    }
  }

  async function manageSessionMemory() {
    const runId = ensureActiveRun();
    const requestLog = buildRequestLog(
      "session",
      memoryApi.method,
      memoryApi.url,
      memoryApi.body,
    );
    setStepStatus((current) => ({ ...current, session: "running" }));
    setSessionApiResult(null);
    try {
      const response = await fetch("/api/managed-agents/memory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          baseUrl,
          apiKey,
          action: sessionMemoryMode,
          ...(memoryStoreId ? { storeId: memoryStoreId } : {}),
          ...(memoryId ? { memoryId } : {}),
          ...(memoryApi.body ? { requestBody: memoryApi.body } : {}),
          ...(sessionMemoryMode === "list-memories"
            ? { query: memoryQuery }
            : {}),
        }),
      });
      const payload = (await response.json()) as JsonResponse;
      setSessionApiResult({
        action: sessionMemoryMode,
        httpStatus: response.status,
        receivedAt: new Date().toISOString(),
        body: payload,
      });
      appendLog(
        runId,
        {
          ...requestLog,
          response: { httpStatus: response.status, body: payload },
        },
        {
          status: response.ok ? "succeeded" : "failed",
          error: response.ok ? undefined : payload.error,
        },
      );
      if (!response.ok) {
        throw new Error(payload.error ?? "管理持久化记忆失败。");
      }
      if (
        sessionMemoryMode === "create-store" &&
        typeof payload.id === "string"
      ) {
        setMemoryStoreId(payload.id);
      }
      if (
        sessionMemoryMode === "create-memory" &&
        typeof payload.id === "string"
      ) {
        setMemoryId(payload.id);
      }
      setStepStatus((current) => ({ ...current, session: "succeeded" }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "管理持久化记忆失败。";
      setSessionApiResult({
        action: sessionMemoryMode,
        receivedAt: new Date().toISOString(),
        body: { error: message },
      });
      setStepStatus((current) => ({ ...current, session: "failed" }));
    }
  }

  async function manageSession() {
    if (!apiReady()) return;
    if (sessionMode === "events") {
      await sendSessionEvent();
      return;
    }
    if (sessionMode === "files") {
      await manageSessionFiles();
      return;
    }
    if (sessionMode === "memory") {
      await manageSessionMemory();
      return;
    }
    if (sessionMode === "delete" && !deleteSessionConfirmed) return;
    if (
      sessionMode === "create" &&
      (draftErrors.session ||
        !sessionAgentId(sessionBody.agent) ||
        !sessionBody.environment_id.trim())
    ) {
      return;
    }
    if (
      (sessionMode === "retrieve" || sessionMode === "delete") &&
      !sessionId.trim()
    ) {
      return;
    }

    const runId = ensureActiveRun();
    const method =
      sessionMode === "create"
        ? "POST"
        : sessionMode === "delete"
          ? "DELETE"
          : "GET";
    const upstreamUrl =
      sessionMode === "create"
        ? sessionBaseUrl
        : sessionMode === "list"
          ? sessionListUrl
          : sessionResourceUrl;
    const requestBody = sessionMode === "create" ? sessionBody : undefined;
    const requestLog = buildRequestLog(
      "session",
      method,
      upstreamUrl,
      requestBody,
    );

    setStepStatus((current) => ({ ...current, session: "running" }));
    setSessionApiResult(null);
    let responseCaptured = false;
    try {
      const response = await fetch("/api/managed-agents/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          baseUrl,
          apiKey,
          action: sessionMode,
          ...(requestBody ? { requestBody } : {}),
          ...(sessionMode === "list" ? { query: sessionListQuery } : {}),
          ...(sessionMode === "retrieve" || sessionMode === "delete"
            ? { sessionId }
            : {}),
        }),
      });
      const payload = (await response.json()) as JsonResponse;
      setSessionApiResult({
        action: sessionMode,
        httpStatus: response.status,
        receivedAt: new Date().toISOString(),
        body: payload,
      });
      responseCaptured = true;
      appendLog(
        runId,
        {
          ...requestLog,
          response: { httpStatus: response.status, body: payload },
        },
        {
          status: response.ok ? "succeeded" : "failed",
          error: response.ok ? undefined : payload.error,
        },
      );
      if (!response.ok) {
        throw new Error(payload.error ?? "管理 Session 失败。");
      }
      if (
        (sessionMode === "create" || sessionMode === "retrieve") &&
        typeof payload.id === "string"
      ) {
        setSessionId(payload.id);
        patchRun(runId, { sessionId: payload.id });
      }
      if (sessionMode === "delete") {
        setSessionId("");
        patchRun(runId, { sessionId: undefined });
        setDeleteSessionConfirmed(false);
      }
      setStepStatus((current) => ({ ...current, session: "succeeded" }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "管理 Session 失败。";
      if (!responseCaptured) {
        setSessionApiResult({
          action: sessionMode,
          receivedAt: new Date().toISOString(),
          body: { error: message },
        });
      }
      setStepStatus((current) => ({ ...current, session: "failed" }));
    }
  }

  async function performJsonStep(
    step: StepKey,
    localPath: string,
    upstreamUrl: string,
    requestBody: unknown,
    runId: string,
    proxyExtra: Record<string, unknown> = {},
  ): Promise<JsonResponse | null> {
    setStepStatus((current) => ({ ...current, [step]: "running" }));
    const requestLog = buildRequestLog(step, "POST", upstreamUrl, requestBody);
    let responseCaptured = false;
    try {
      const response = await fetch(localPath, {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          baseUrl,
          apiKey,
          requestBody,
          ...proxyExtra,
        }),
      });
      const payload = (await response.json()) as JsonResponse;
      if (step === "agent") {
        setAgentApiResult({
          mode: agentMode,
          httpStatus: response.status,
          receivedAt: new Date().toISOString(),
          body: payload,
        });
      }
      if (step === "environment") {
        setEnvironmentApiResult({
          httpStatus: response.status,
          receivedAt: new Date().toISOString(),
          body: payload,
        });
      }
      appendLog(
        runId,
        {
          ...requestLog,
          response: { httpStatus: response.status, body: payload },
        },
        { status: response.ok ? "running" : "failed", error: payload.error },
      );
      responseCaptured = true;
      if (!response.ok || !payload.id) {
        throw new Error(payload.error ?? "火山方舟未返回资源 ID。");
      }
      setStepStatus((current) => ({ ...current, [step]: "succeeded" }));
      return payload;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "请求执行失败。";
      if (!responseCaptured) {
        if (step === "agent") {
          setAgentApiResult({
            mode: agentMode,
            receivedAt: new Date().toISOString(),
            body: { error: message },
          });
        }
        if (step === "environment") {
          setEnvironmentApiResult({
            receivedAt: new Date().toISOString(),
            body: { error: message },
          });
        }
        appendLog(
          runId,
          { ...requestLog, error: message },
          {
            status: "failed",
            error: message,
          },
        );
      }
      setStepStatus((current) => ({ ...current, [step]: "failed" }));
      return null;
    }
  }

  async function sendSessionEvent() {
    if (!apiReady() || !sessionId || draftErrors["session-event"]) return;
    const runId = ensureActiveRun();
    setStepStatus((current) => ({ ...current, session: "running" }));
    setSessionApiResult(null);
    setTranscript("");
    setStreamEvents([]);

    const streamLog = buildRequestLog(
      "stream",
      "GET",
      `${eventsUrl}/stream`,
    );
    const sendLog = buildRequestLog(
      "session-event",
      "POST",
      eventsUrl,
      messageBody,
    );
    appendLog(runId, streamLog);

    try {
      const streamResponse = await fetch(
        "/api/managed-agents/session-events",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            baseUrl,
            apiKey,
            action: "stream",
            sessionId,
          }),
        },
      );
      if (!streamResponse.ok || !streamResponse.body) {
        const payload = (await streamResponse.json()) as JsonResponse;
        throw new Error(payload.error ?? "打开 Session 事件流失败。");
      }

      const sendResponse = await fetch("/api/managed-agents/session-events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          baseUrl,
          apiKey,
          action: "send",
          sessionId,
          requestBody: messageBody,
        }),
      });
      const sendPayload = (await sendResponse.json()) as JsonResponse;
      setSessionApiResult({
        action: "events",
        httpStatus: sendResponse.status,
        receivedAt: new Date().toISOString(),
        body: sendPayload,
      });
      appendLog(runId, {
        ...sendLog,
        response: {
          httpStatus: sendResponse.status,
          body: sendPayload,
        },
      });
      if (!sendResponse.ok) {
        await streamResponse.body.cancel();
        throw new Error(sendPayload.error ?? "发送 Session 事件失败。");
      }

      const events: unknown[] = [];
      let output = "";
      let buffer = "";
      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();

      streamLoop: while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const event = JSON.parse(data) as unknown;
            events.push(event);
            setStreamEvents([...events]);
            const text = textFromAgentEvent(event);
            if (text) {
              output += text;
              setTranscript(output);
            }
            if (eventType(event) === "session.status_idle") {
              await reader.cancel();
              break streamLoop;
            }
          } catch {
            events.push({ type: "raw", data });
            setStreamEvents([...events]);
          }
        }
      }

      appendLog(
        runId,
        {
          ...streamLog,
          response: {
            httpStatus: streamResponse.status,
            body: { events, transcript: output },
          },
        },
        {
          status: "succeeded",
          transcript: output,
          error: undefined,
        },
      );
      setStepStatus((current) => ({ ...current, session: "succeeded" }));
      if (!rememberApiKey) {
        setApiKey("");
        setShowApiKey(false);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "流式响应处理失败。";
      appendLog(
        runId,
        { ...streamLog, error: message },
        { status: "failed", error: message },
      );
      setSessionApiResult((current) =>
        current ?? {
          action: "events",
          receivedAt: new Date().toISOString(),
          body: { error: message },
        },
      );
      setStepStatus((current) => ({ ...current, session: "failed" }));
    }
  }

  function apiReady() {
    return Boolean(apiKey.trim()) && baseUrlMatches && !busy;
  }

  function buildRequestLog(
    phase: ManagedLogEntry["phase"],
    method: "POST" | "GET" | "DELETE",
    url: string,
    body?: unknown,
  ): ManagedLogEntry {
    return {
      at: new Date().toISOString(),
      phase,
      request: {
        method,
        url,
        headers: {
          authorization: `Bearer ${maskApiKey(apiKey)}`,
          ...(method === "GET"
            ? { accept: "text/event-stream" }
            : method === "POST"
              ? { "content-type": "application/json" }
              : {}),
        },
        body,
      },
    };
  }

  const stepLabels = useMemo(
    () => [
      { key: "agent" as const, label: "管理 Agent", id: agentId },
      {
        key: "environment" as const,
        label: "配置 Agent 环境",
        id: environmentId,
      },
      { key: "session" as const, label: "管理 Session", id: sessionId },
    ],
    [agentId, environmentId, sessionId],
  );

  return (
    <div className="managed-agents-workspace" id="managed-agents">
      <section className="managed-hero">
        <div>
          <p className="eyebrow">VOLCENGINE ARK · MANAGED AGENTS</p>
          <h1>
            Managed Agents
            <br />
            工作台
          </h1>
          <p className="managed-hero-summary">
            Agent · 云端环境 · Session · 事件流 · 文件 · 持久化记忆
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#managed-connection">
              开始配置
            </a>
            <a
              className="secondary-action"
              href="https://docs.volcengine.com/docs/82379/2553714?lang=zh"
              target="_blank"
              rel="noreferrer"
            >
              查看官方快速入门 ↗
            </a>
          </div>
        </div>
        <aside className="managed-hero-console" aria-label="Managed Agents 工作流">
          <div className="panel-topline">
            <span>MANAGED EXECUTION GRAPH</span>
            <span className="progress-label">SSE</span>
          </div>
          <ol>
            {stepLabels.map((step, index) => (
              <li key={step.key} data-status={stepStatus[step.key]}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{step.label}</strong>
                  <small>
                    {step.id
                      ? step.id
                      : statusLabel(stepStatus[step.key])}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="managed-connection" id="managed-connection">
        <div className="managed-section-heading">
          <div>
            <p className="eyebrow">连接与凭证</p>
            <h2>方舟连接</h2>
          </div>
          <p>
            标准方舟 API Key；复用当前浏览器凭证。
          </p>
        </div>
        <div className="managed-connection-card">
          <label>
            <span>Base URL</span>
            <input
              aria-label="Managed Agents Base URL"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              disabled={busy}
            />
            <small>
              官方快速入门固定使用 <code>/api/v3</code>；服务端仅转发到该地址。
            </small>
          </label>
          <label>
            <span>API Key</span>
            <div className="managed-secret-field">
              <input
                aria-label="Managed Agents API Key"
                data-testid="managed-api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                autoComplete="off"
                disabled={busy}
              />
              <button
                type="button"
                onClick={() => setShowApiKey((current) => !current)}
                disabled={!apiKey}
              >
                {showApiKey ? "隐藏" : "显示"}
              </button>
            </div>
            <small>
              不写入源码、URL 或服务端日志；演示模式只在当前浏览器保存。
            </small>
          </label>
          <label className="managed-remember-row">
            <input
              type="checkbox"
              checked={rememberApiKey}
              onChange={(event) => setRememberApiKey(event.target.checked)}
            />
            <span>演示模式：与视频工作台共用并记住官方 API Key</span>
          </label>
          {!baseUrlMatches && (
            <p className="managed-inline-error">
              Base URL 必须与官方 Managed Agents 标准地址一致。
            </p>
          )}
        </div>
      </section>

      <section className="managed-flow">
        <div className="managed-section-heading">
          <div>
            <p className="eyebrow">三步实操</p>
            <h2>Agent 与环境</h2>
          </div>
          <p>
            表单 ↔ JSON 双向联动；同步展示 Method、URL、Headers 与 Body。
          </p>
        </div>

        <ManagedStep
          number="01"
          title="管理 Agent"
          description="在创建与更新模式间切换，完整配置基本信息、模型、Skills、Tools、MCP、Multi Agent 与 metadata。"
          status={stepStatus.agent}
          resultId={agentId}
          actionLabel={agentMode === "create" ? "创建 Agent" : "更新 Agent"}
          actionDisabled={
            !apiReady() ||
            !agentBodyReady ||
            Boolean(draftErrors.agent) ||
            (agentMode === "update" && !targetAgentId.trim())
          }
          onAction={() => void manageAgent()}
          prerequisite={
            agentMode === "update" && !targetAgentId.trim()
              ? "更新模式需要填写已有 Agent ID 与当前版本号。"
              : undefined
          }
          fields={
            <AgentFields
              mode={agentMode}
              targetAgentId={targetAgentId}
              body={agentBody}
              busy={busy}
              onModeChange={changeAgentMode}
              onTargetAgentIdChange={setTargetAgentId}
              onChange={updateAgent}
            />
          }
          apiDetails={
            <ManagedApiEditor
              method="POST"
              url={agentUrl}
              apiKey={apiKey}
              draft={agentDraft}
              error={draftErrors.agent}
              onChange={(value) => editJson("agent", value)}
            />
          }
          output={
            agentApiResult ? (
              <ManagedAgentApiResult result={agentApiResult} />
            ) : (
              <div className="managed-agent-result managed-agent-result-empty">
                <div>
                  <span>API RESPONSE</span>
                  <strong>等待执行</strong>
                </div>
                <p>创建或更新 Agent 后，完整 API 返回结果会显示在这里。</p>
              </div>
            )
          }
        />

        <ManagedStep
          number="02"
          title="配置 Agent 环境"
          description="完整配置云端沙箱的身份、网络策略、预装依赖、环境变量、metadata 与预留作用域。"
          status={stepStatus.environment}
          resultId={environmentId}
          actionLabel="配置并创建环境"
          actionDisabled={
            !apiReady() ||
            !agentId ||
            !environmentBodyReady ||
            Boolean(draftErrors.environment)
          }
          onAction={() => void createEnvironment()}
          prerequisite={!agentId ? "先完成第 1 步，取得 Agent ID。" : undefined}
          fields={
            <EnvironmentFields
              body={environmentBody}
              busy={busy}
              onChange={updateEnvironment}
            />
          }
          apiDetails={
            <ManagedApiEditor
              method="POST"
              url={environmentUrl}
              apiKey={apiKey}
              draft={environmentDraft}
              error={draftErrors.environment}
              onChange={(value) => editJson("environment", value)}
            />
          }
          output={
            environmentApiResult ? (
              <ManagedEnvironmentApiResult result={environmentApiResult} />
            ) : (
              <div className="managed-agent-result managed-agent-result-empty">
                <div>
                  <span>API RESPONSE · CREATE ENVIRONMENT</span>
                  <strong>等待执行</strong>
                </div>
                <p>配置并创建环境后，完整 API 返回结果会显示在这里。</p>
              </div>
            )
          }
        />

        <ManagedStep
          number="03"
          title="管理 Session"
          description="统一管理 Session 生命周期、事件流、文件挂载与跨 Session 持久化记忆。"
          status={stepStatus.session}
          resultId={sessionId}
          actionLabel={sessionActionLabel}
          actionDisabled={sessionActionDisabled}
          onAction={() => void manageSession()}
          prerequisite={sessionPrerequisite(
            sessionMode,
            sessionBody,
            sessionId,
            deleteSessionConfirmed,
          )}
          fields={
            <SessionManagerFields
              mode={sessionMode}
              eventMode={sessionEventMode}
              fileMode={sessionFileMode}
              memoryMode={sessionMemoryMode}
              sessionId={sessionId}
              createBody={sessionBody}
              listQuery={sessionListQuery}
              eventBody={messageBody}
              uploadFile={uploadFile}
              fileResourceBody={fileResourceBody}
              sessionResourceId={sessionResourceId}
              memoryStoreId={memoryStoreId}
              memoryId={memoryId}
              memoryStoreBody={memoryStoreBody}
              memoryBody={memoryBody}
              memoryQuery={memoryQuery}
              deleteConfirmed={deleteSessionConfirmed}
              busy={busy}
              onModeChange={changeSessionMode}
              onEventModeChange={changeSessionEventMode}
              onFileModeChange={setSessionFileMode}
              onMemoryModeChange={setSessionMemoryMode}
              onSessionIdChange={setSessionId}
              onCreateBodyChange={updateSession}
              onListQueryChange={setSessionListQuery}
              onEventBodyChange={updateMessage}
              onUploadFileChange={setUploadFile}
              onFileResourceBodyChange={setFileResourceBody}
              onSessionResourceIdChange={setSessionResourceId}
              onMemoryStoreIdChange={setMemoryStoreId}
              onMemoryIdChange={setMemoryId}
              onMemoryStoreBodyChange={setMemoryStoreBody}
              onMemoryBodyChange={setMemoryBody}
              onMemoryQueryChange={setMemoryQuery}
              onDeleteConfirmedChange={setDeleteSessionConfirmed}
            />
          }
          apiDetails={
            <ManagedApiEditor
              method={sessionApiMethod}
              url={sessionApiUrl}
              secondaryUrl={
                sessionMode === "events" ? `${eventsUrl}/stream` : undefined
              }
              secondaryLabel="STREAM FIRST · GET"
              apiKey={apiKey}
              draft={
                sessionMode === "events"
                  ? messageDraft
                  : sessionMode === "create"
                    ? sessionDraft
                    : sessionApiBody === undefined
                      ? undefined
                      : prettyJson(sessionApiBody)
              }
              error={
                sessionMode === "events"
                  ? draftErrors["session-event"]
                  : sessionMode === "create"
                    ? draftErrors.session
                    : undefined
              }
              onChange={
                sessionMode === "events"
                  ? (value) => editJson("session-event", value)
                  : sessionMode === "create"
                    ? (value) => editJson("session", value)
                    : undefined
              }
              bodyNote={sessionBodyNote(sessionMode)}
              contentType={
                sessionMode === "files" && sessionFileMode === "upload"
                  ? "multipart/form-data"
                  : undefined
              }
            />
          }
          output={
            <div className="managed-session-output-stack">
              {sessionApiResult ? (
                <ManagedSessionApiResult result={sessionApiResult} />
              ) : (
                <div className="managed-agent-result managed-agent-result-empty">
                  <div>
                    <span>API RESPONSE · SESSION</span>
                    <strong>等待执行</strong>
                  </div>
                  <p>执行任一 Session 操作后，完整 API 返回结果会显示在这里。</p>
                </div>
              )}
              {sessionMode === "events" && (
                <div className="managed-stream-output" aria-live="polite">
                  <div className="managed-stream-heading">
                    <span>LIVE SSE OUTPUT</span>
                    <span>{streamEvents.length} events</span>
                  </div>
                  {transcript ? (
                    <pre>{transcript}</pre>
                  ) : (
                    <p>
                      {stepStatus.session === "running"
                        ? "事件流已先建立，正在等待 Session 响应…"
                        : "打开事件流并发送事件后，实时响应会显示在这里。"}
                    </p>
                  )}
                  {streamEvents.length > 0 && (
                    <div className="managed-event-chips">
                      {streamEvents.slice(-8).map((event, index) => (
                        <span key={`${eventType(event)}-${index}`}>
                          {eventType(event)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          }
        />
      </section>

      <section className="managed-history">
        <div className="managed-section-heading">
          <div>
            <p className="eyebrow">演示记录</p>
            <h2>Session 与资源</h2>
          </div>
          <p>
            当前浏览器保留最近 20 轮；Authorization 掩码；记录事件与最终状态。
          </p>
        </div>
        {history.length === 0 ? (
          <p className="managed-empty-history">暂无 Managed Agents 演示记录。</p>
        ) : (
          <ol className="managed-history-list">
            {history.map((run) => (
              <li key={run.id}>
                <div>
                  <span className="managed-run-status" data-status={run.status}>
                    {statusLabel(run.status)}
                  </span>
                  <time>{formatTime(run.createdAt)}</time>
                </div>
                <dl>
                  <div>
                    <dt>Agent</dt>
                    <dd>{run.agentId ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Environment</dt>
                    <dd>{run.environmentId ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Session</dt>
                    <dd>{run.sessionId ?? "—"}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={() => setSelectedLogRunId(run.id)}
                >
                  查看日志 · {run.logs.length}
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      {selectedRun && (
        <div className="log-dialog-backdrop" role="presentation">
          <section
            className="log-dialog managed-log-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="managed-log-heading"
          >
            <div className="log-dialog-heading">
              <div>
                <p className="eyebrow">MANAGED AGENTS LOG</p>
                <h3 id="managed-log-heading">请求 / 响应日志</h3>
              </div>
              <button type="button" onClick={() => setSelectedLogRunId("")}>
                关闭
              </button>
            </div>
            <div className="log-dialog-content">
              {selectedRun.logs.map((log, index) => (
                <article key={`${log.at}-${index}`} className="managed-log-entry">
                  <div>
                    <strong>{phaseLabel(log.phase)}</strong>
                    <time>{formatTime(log.at)}</time>
                  </div>
                  <pre>{prettyJson(log)}</pre>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function SessionManagerFields({
  mode,
  eventMode,
  fileMode,
  memoryMode,
  sessionId,
  createBody,
  listQuery,
  eventBody,
  uploadFile,
  fileResourceBody,
  sessionResourceId,
  memoryStoreId,
  memoryId,
  memoryStoreBody,
  memoryBody,
  memoryQuery,
  deleteConfirmed,
  busy,
  onModeChange,
  onEventModeChange,
  onFileModeChange,
  onMemoryModeChange,
  onSessionIdChange,
  onCreateBodyChange,
  onListQueryChange,
  onEventBodyChange,
  onUploadFileChange,
  onFileResourceBodyChange,
  onSessionResourceIdChange,
  onMemoryStoreIdChange,
  onMemoryIdChange,
  onMemoryStoreBodyChange,
  onMemoryBodyChange,
  onMemoryQueryChange,
  onDeleteConfirmedChange,
}: {
  mode: SessionMode;
  eventMode: SessionEventMode;
  fileMode: SessionFileMode;
  memoryMode: SessionMemoryMode;
  sessionId: string;
  createBody: SessionBody;
  listQuery: { agent_id: string; limit: number };
  eventBody: MessageBody;
  uploadFile: File | null;
  fileResourceBody: Extract<SessionResource, { type: "file" }>;
  sessionResourceId: string;
  memoryStoreId: string;
  memoryId: string;
  memoryStoreBody: { name: string; description: string };
  memoryBody: { path: string; content: string };
  memoryQuery: { path_prefix: string; order_by: "path"; depth: number };
  deleteConfirmed: boolean;
  busy: boolean;
  onModeChange: (mode: SessionMode) => void;
  onEventModeChange: (mode: SessionEventMode) => void;
  onFileModeChange: (mode: SessionFileMode) => void;
  onMemoryModeChange: (mode: SessionMemoryMode) => void;
  onSessionIdChange: (value: string) => void;
  onCreateBodyChange: (body: SessionBody) => void;
  onListQueryChange: (query: { agent_id: string; limit: number }) => void;
  onEventBodyChange: (body: MessageBody) => void;
  onUploadFileChange: (file: File | null) => void;
  onFileResourceBodyChange: (
    body: Extract<SessionResource, { type: "file" }>,
  ) => void;
  onSessionResourceIdChange: (value: string) => void;
  onMemoryStoreIdChange: (value: string) => void;
  onMemoryIdChange: (value: string) => void;
  onMemoryStoreBodyChange: (body: {
    name: string;
    description: string;
  }) => void;
  onMemoryBodyChange: (body: { path: string; content: string }) => void;
  onMemoryQueryChange: (query: {
    path_prefix: string;
    order_by: "path";
    depth: number;
  }) => void;
  onDeleteConfirmedChange: (confirmed: boolean) => void;
}) {
  const pinnedAgent =
    typeof createBody.agent === "object" ? createBody.agent : null;
  const firstEvent = eventBody.events[0] ?? {};
  const systemEvent =
    eventBody.events[1]?.type === "system.message"
      ? eventBody.events[1]
      : null;
  const firstContent =
    Array.isArray(firstEvent.content) && firstEvent.content.length > 0
      ? (firstEvent.content[0] as Record<string, unknown>)
      : {};

  return (
    <div className="managed-session-fields managed-field-wide">
      <section className="managed-session-mode managed-field-wide">
        <div>
          <span>Session 操作</span>
          <small>
            Session 运行期间不能更新字段；配置变化需要新建 Session。
          </small>
        </div>
        <div className="managed-session-mode-switch" role="group" aria-label="Session 操作">
          {(
            [
              ["create", "创建"],
              ["retrieve", "检索"],
              ["list", "列出"],
              ["events", "事件与流"],
              ["files", "文件与挂载"],
              ["memory", "持久化记忆"],
              ["delete", "删除"],
            ] as Array<[SessionMode, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={mode === value ? "is-active" : ""}
              onClick={() => onModeChange(value)}
              disabled={busy}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="managed-session-lifecycle managed-field-wide">
        <div>
          <span>idle</span>
          <small>等待输入；进入 idle 时创建沙箱检查点。</small>
        </div>
        <div>
          <span>running</span>
          <small>Agent 正在执行，不能删除 Session。</small>
        </div>
        <div>
          <span>rescheduled</span>
          <small>暂时错误，平台正在自动重试。</small>
        </div>
        <div>
          <span>terminated</span>
          <small>不可恢复错误；记录与事件历史仍保留。</small>
        </div>
      </section>

      {mode === "create" && (
        <>
          <section className="managed-agent-section managed-agent-basics">
            <div className="managed-field-wide managed-capability-heading">
              <div>
                <span>01 · 绑定 Agent 与 Environment</span>
                <small>创建只配置沙箱，不会让 Agent 开始工作。</small>
              </div>
              <a
                href="https://docs.volcengine.com/docs/82379/2553723?lang=zh"
                target="_blank"
                rel="noreferrer"
              >
                启动 Session 文档 ↗
              </a>
            </div>
            <label>
              <span>agent 绑定方式 · 必填</span>
              <select
                value={pinnedAgent ? "pinned" : "latest"}
                onChange={(event) =>
                  onCreateBodyChange({
                    ...createBody,
                    agent:
                      event.target.value === "pinned"
                        ? {
                            type: "agent",
                            id: sessionAgentId(createBody.agent),
                            version: 1,
                          }
                        : sessionAgentId(createBody.agent),
                  })
                }
                disabled={busy}
              >
                <option value="latest">字符串 ID · 使用最新版本</option>
                <option value="pinned">对象 · 固定 Agent 版本</option>
              </select>
              <small>最新版本适合入门；固定版本适合灰度、回滚和产品定版。</small>
            </label>
            <label>
              <span>agent.id · 必填</span>
              <input
                value={sessionAgentId(createBody.agent)}
                onChange={(event) =>
                  onCreateBodyChange({
                    ...createBody,
                    agent: pinnedAgent
                      ? { ...pinnedAgent, id: event.target.value }
                      : event.target.value,
                  })
                }
                disabled={busy}
              />
              <small>第 1 步成功后自动填写，也可使用已有 Agent ID。</small>
            </label>
            {pinnedAgent && (
              <label>
                <span>agent.version · 必填</span>
                <input
                  type="number"
                  min={1}
                  value={pinnedAgent.version}
                  onChange={(event) =>
                    onCreateBodyChange({
                      ...createBody,
                      agent: {
                        ...pinnedAgent,
                        version: Number(event.target.value) || 1,
                      },
                    })
                  }
                  disabled={busy}
                />
                <small>固定后不会随 Agent 新版本自动变化。</small>
              </label>
            )}
            <label className={pinnedAgent ? "" : "managed-field-wide"}>
              <span>environment_id · 必填</span>
              <input
                value={createBody.environment_id}
                onChange={(event) =>
                  onCreateBodyChange({
                    ...createBody,
                    environment_id: event.target.value,
                  })
                }
                disabled={busy}
              />
              <small>第 2 步成功后自动填写；每个 Session 获得独立沙箱。</small>
            </label>
          </section>
          <section className="managed-agent-section managed-agent-optional-section">
            <div className="managed-field-wide managed-capability-heading">
              <div>
                <span>02 · vault_ids · 选填</span>
                <small>为需要鉴权的 MCP 工具注入终端用户凭据。</small>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = { ...createBody };
                  if (next.vault_ids === undefined) next.vault_ids = [];
                  else delete next.vault_ids;
                  onCreateBodyChange(next);
                }}
                disabled={busy}
              >
                {createBody.vault_ids === undefined
                  ? "添加 vault_ids"
                  : "移除 vault_ids"}
              </button>
            </div>
            {createBody.vault_ids === undefined ? (
              <EmptyCapability text="选填项未添加。只有 Agent 的 MCP 工具需要终端用户凭据时才填写。" />
            ) : (
              <label className="managed-field-wide">
                <span>vault_ids[]</span>
                <textarea
                  value={createBody.vault_ids.join("\n")}
                  onChange={(event) =>
                    onCreateBodyChange({
                      ...createBody,
                      vault_ids: event.target.value
                        .split(/[\n,]/)
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="vlt-20260701120000-pqrst"
                  disabled={busy}
                />
                <small>每行一个 Vault ID；令牌刷新和运行时注入由方舟管理。</small>
              </label>
            )}
          </section>
          <section className="managed-agent-section managed-agent-optional-section">
            <div className="managed-field-wide managed-capability-heading">
              <div>
                <span>03 · resources · 选填</span>
                <small>
                  创建时可挂载 Files、TOS 目录和 Memory Store；文件只读，记忆也只读。
                </small>
              </div>
              <a
                href="https://docs.volcengine.com/docs/82379/2553727?lang=zh"
                target="_blank"
                rel="noreferrer"
              >
                挂载文件文档 ↗
              </a>
            </div>
            <div className="managed-resource-add-row managed-field-wide">
              <button
                type="button"
                onClick={() =>
                  onCreateBodyChange({
                    ...createBody,
                    resources: [
                      ...(createBody.resources ?? []),
                      { type: "file", file_id: "", mount_path: "inputs/file.txt" },
                    ],
                  })
                }
                disabled={busy}
              >
                + Files ID
              </button>
              <button
                type="button"
                onClick={() =>
                  onCreateBodyChange({
                    ...createBody,
                    resources: [
                      ...(createBody.resources ?? []),
                      { type: "tos", tos_bucket: "", tos_key: "project-resources/" },
                    ],
                  })
                }
                disabled={busy}
              >
                + TOS 目录
              </button>
              <button
                type="button"
                onClick={() =>
                  onCreateBodyChange({
                    ...createBody,
                    resources: [
                      ...(createBody.resources ?? []),
                      {
                        type: "memory_store",
                        memory_store_id: memoryStoreId,
                        instructions: "开始任务前读取项目规范与用户偏好。",
                      },
                    ],
                  })
                }
                disabled={busy}
              >
                + Memory Store
              </button>
            </div>
            {(createBody.resources ?? []).length === 0 ? (
              <EmptyCapability text="尚未挂载资源。单个 Session 最多 100 个文件资源和 10 个 Memory Store。" />
            ) : (
              <div className="managed-resource-list managed-field-wide">
                {(createBody.resources ?? []).map((resource, index) => (
                  <SessionResourceEditor
                    key={`${resource.type}-${index}`}
                    resource={resource}
                    index={index}
                    busy={busy}
                    onChange={(nextResource) => {
                      const resources = [...(createBody.resources ?? [])];
                      resources[index] = nextResource;
                      onCreateBodyChange({ ...createBody, resources });
                    }}
                    onRemove={() => {
                      const resources = (createBody.resources ?? []).filter(
                        (_, itemIndex) => itemIndex !== index,
                      );
                      const next = { ...createBody };
                      if (resources.length > 0) next.resources = resources;
                      else delete next.resources;
                      onCreateBodyChange(next);
                    }}
                  />
                ))}
              </div>
            )}
            <p className="managed-field-wide managed-inline-note">
              Files 挂载到 <code>/mnt/session/uploads/</code>；TOS 目录挂载到{" "}
              <code>/mnt/session/storage/</code>；Memory Store 位于{" "}
              <code>/mnt/memory/</code>。TOS 与 Managed Agents 必须属于同一账号。
            </p>
          </section>
        </>
      )}

      {(mode === "retrieve" ||
        mode === "events" ||
        (mode === "files" && fileMode !== "upload") ||
        mode === "delete") && (
        <section className="managed-agent-section managed-agent-basics">
          <div className="managed-field-wide managed-capability-heading">
            <div>
              <span>目标 Session</span>
              <small>
                可使用本工作流创建后自动回填的 ID，也可输入已有 Session。
              </small>
            </div>
            <a
              href="https://docs.volcengine.com/docs/82379/2553724?lang=zh"
              target="_blank"
              rel="noreferrer"
            >
              管理 Session 文档 ↗
            </a>
          </div>
          <label className="managed-field-wide">
            <span>session_id · 必填</span>
            <input
              value={sessionId}
              onChange={(event) => onSessionIdChange(event.target.value)}
              disabled={busy}
            />
            <small>形如 sesn-…；检索会返回状态、用量和绑定配置快照。</small>
          </label>
        </section>
      )}

      {mode === "list" && (
        <section className="managed-agent-section managed-agent-basics">
          <div className="managed-field-wide managed-capability-heading">
            <div>
              <span>列出 Session</span>
              <small>按创建时间倒序返回 data 数组，可按 Agent 过滤。</small>
            </div>
            <a
              href="https://docs.volcengine.com/docs/82379/2553724?lang=zh"
              target="_blank"
              rel="noreferrer"
            >
              列表说明 ↗
            </a>
          </div>
          <label>
            <span>agent_id · 选填</span>
            <input
              value={listQuery.agent_id}
              onChange={(event) =>
                onListQueryChange({
                  ...listQuery,
                  agent_id: event.target.value,
                })
              }
              disabled={busy}
            />
            <small>只查看绑定到指定 Agent 的 Session。</small>
          </label>
          <label>
            <span>limit · 选填</span>
            <input
              type="number"
              min={1}
              max={100}
              value={listQuery.limit}
              onChange={(event) =>
                onListQueryChange({
                  ...listQuery,
                  limit: Math.min(100, Math.max(1, Number(event.target.value) || 20)),
                })
              }
              disabled={busy}
            />
            <small>单次返回 1–100 条，默认 20 条。</small>
          </label>
        </section>
      )}

      {mode === "events" && (
        <section className="managed-agent-section managed-agent-optional-section">
          <div className="managed-field-wide managed-capability-heading">
            <div>
              <span>事件与 SSE</span>
              <small>管理台会先打开事件流，再发送事件，避免漏掉实时响应。</small>
            </div>
            <a
              href="https://docs.volcengine.com/docs/82379/2553725?lang=zh"
              target="_blank"
              rel="noreferrer"
            >
              事件流文档 ↗
            </a>
          </div>
          <label className="managed-field-wide">
            <span>事件类型</span>
            <select
              value={eventMode}
              onChange={(event) =>
                onEventModeChange(event.target.value as SessionEventMode)
              }
              disabled={busy}
            >
              <option value="message">user.message · 发送消息</option>
              <option value="interrupt">user.interrupt · 中断执行</option>
              <option value="tool-confirmation">
                user.tool_confirmation · 工具确认
              </option>
            </select>
            <small>
              多模态图片、文档和高级 content 块可继续在右侧完整 JSON 中编辑。
            </small>
          </label>
          {eventMode === "message" && (
            <>
              <label className="managed-field-wide">
                <span>user.message.content[0].text</span>
                <textarea
                  value={typeof firstContent.text === "string" ? firstContent.text : ""}
                  onChange={(event) =>
                    onEventBodyChange({
                      events: [
                        {
                          type: "user.message",
                          content: [{ type: "text", text: event.target.value }],
                        },
                        ...(systemEvent ? [systemEvent] : []),
                      ],
                    })
                  }
                  disabled={busy}
                />
                <small>消息会进入 Session 历史并使状态从 idle 转为 running。</small>
              </label>
              <label className="managed-field-wide managed-remember-row">
                <input
                  type="checkbox"
                  checked={Boolean(systemEvent)}
                  onChange={(event) =>
                    onEventBodyChange({
                      events: event.target.checked
                        ? [
                            firstEvent,
                            {
                              type: "system.message",
                              content: [{ type: "text", text: "" }],
                            },
                          ]
                        : [firstEvent],
                    })
                  }
                  disabled={busy}
                />
                <span>追加运行时 system.message</span>
              </label>
              {systemEvent && (
                <label className="managed-field-wide">
                  <span>system.message.content[0].text</span>
                  <textarea
                    value={
                      Array.isArray(systemEvent.content) &&
                      typeof (systemEvent.content[0] as Record<string, unknown>)
                        ?.text === "string"
                        ? String(
                            (systemEvent.content[0] as Record<string, unknown>).text,
                          )
                        : ""
                    }
                    onChange={(event) =>
                      onEventBodyChange({
                        events: [
                          firstEvent,
                          {
                            type: "system.message",
                            content: [
                              { type: "text", text: event.target.value },
                            ],
                          },
                        ],
                      })
                    }
                    disabled={busy}
                  />
                  <small>必须紧跟 user.message，且必须是 events 最后一项。</small>
                </label>
              )}
            </>
          )}
          {eventMode === "interrupt" && (
            <label className="managed-field-wide">
              <span>session_thread_id · 选填</span>
              <input
                value={
                  typeof firstEvent.session_thread_id === "string"
                    ? firstEvent.session_thread_id
                    : ""
                }
                onChange={(event) =>
                  onEventBodyChange({
                    events: [
                      {
                        type: "user.interrupt",
                        ...(event.target.value
                          ? { session_thread_id: event.target.value }
                          : {}),
                      },
                    ],
                  })
                }
                disabled={busy}
              />
              <small>不填写时中断所有活跃线程；等待状态回到 idle 后再发新消息。</small>
            </label>
          )}
          {eventMode === "tool-confirmation" && (
            <>
              <label>
                <span>tool_use_id · 必填</span>
                <input
                  value={
                    typeof firstEvent.tool_use_id === "string"
                      ? firstEvent.tool_use_id
                      : ""
                  }
                  onChange={(event) =>
                    onEventBodyChange({
                      events: [
                        {
                          ...firstEvent,
                          type: "user.tool_confirmation",
                          tool_use_id: event.target.value,
                        },
                      ],
                    })
                  }
                  disabled={busy}
                />
                <small>对应 requires_action 中阻塞的工具事件 ID。</small>
              </label>
              <label>
                <span>result · 必填</span>
                <select
                  value={firstEvent.result === "deny" ? "deny" : "allow"}
                  onChange={(event) =>
                    onEventBodyChange({
                      events: [
                        {
                          type: "user.tool_confirmation",
                          tool_use_id:
                            typeof firstEvent.tool_use_id === "string"
                              ? firstEvent.tool_use_id
                              : "",
                          result: event.target.value,
                          ...(event.target.value === "deny"
                            ? { deny_message: "" }
                            : {}),
                        },
                      ],
                    })
                  }
                  disabled={busy}
                >
                  <option value="allow">allow · 允许</option>
                  <option value="deny">deny · 拒绝</option>
                </select>
                <small>所有阻塞事件确认后 Session 才会继续 running。</small>
              </label>
              {firstEvent.result === "deny" && (
                <label className="managed-field-wide">
                  <span>deny_message · 选填</span>
                  <textarea
                    value={
                      typeof firstEvent.deny_message === "string"
                        ? firstEvent.deny_message
                        : ""
                    }
                    onChange={(event) =>
                      onEventBodyChange({
                        events: [
                          {
                            ...firstEvent,
                            deny_message: event.target.value,
                          },
                        ],
                      })
                    }
                    disabled={busy}
                  />
                  <small>把拒绝原因回传给 Agent，便于调整策略或改用替代工具。</small>
                </label>
              )}
            </>
          )}
        </section>
      )}

      {mode === "files" && (
        <section className="managed-agent-section managed-agent-optional-section">
          <div className="managed-field-wide managed-capability-heading">
            <div>
              <span>上传与挂载文件</span>
              <small>
                Files API 上传后返回 file_id；可在创建时或运行中挂载到只读目录。
              </small>
            </div>
            <a
              href="https://docs.volcengine.com/docs/82379/2553727?lang=zh"
              target="_blank"
              rel="noreferrer"
            >
              文件指南 ↗
            </a>
          </div>
          <label className="managed-field-wide">
            <span>文件操作</span>
            <select
              value={fileMode}
              onChange={(event) =>
                onFileModeChange(event.target.value as SessionFileMode)
              }
              disabled={busy}
            >
              <option value="upload">上传到 Files API</option>
              <option value="add-resource">运行中添加文件资源</option>
              <option value="list-resources">查询 Session 资源</option>
              <option value="delete-resource">移除 Session 文件资源</option>
              <option value="list-generated">查询 Session 生成文件</option>
            </select>
            <small>
              TOS 目录和 Memory Store 只能在上方“创建 Session”的 resources 中配置。
            </small>
          </label>
          {fileMode === "upload" && (
            <label className="managed-field-wide managed-file-picker">
              <span>file · 必填</span>
              <input
                type="file"
                onChange={(event) =>
                  onUploadFileChange(event.target.files?.[0] ?? null)
                }
                disabled={busy}
              />
              <small>
                工作台固定发送 <code>purpose=agent</code>；成功后的 file_id
                会自动填入“添加文件资源”。
                {uploadFile
                  ? ` 当前：${uploadFile.name} · ${formatBytes(uploadFile.size)}`
                  : ""}
              </small>
            </label>
          )}
          {fileMode === "add-resource" && (
            <>
              <label>
                <span>file_id · 必填</span>
                <input
                  value={fileResourceBody.file_id}
                  onChange={(event) =>
                    onFileResourceBodyChange({
                      ...fileResourceBody,
                      file_id: event.target.value,
                    })
                  }
                  disabled={busy}
                />
                <small>来自 Files API 上传响应；挂载后会生成 Session 内副本 ID。</small>
              </label>
              <label>
                <span>mount_path · 选填</span>
                <input
                  value={fileResourceBody.mount_path ?? ""}
                  onChange={(event) =>
                    onFileResourceBodyChange({
                      ...fileResourceBody,
                      ...(event.target.value
                        ? { mount_path: event.target.value }
                        : { mount_path: undefined }),
                    })
                  }
                  disabled={busy}
                />
                <small>
                  相对路径；最终位于 <code>/mnt/session/uploads/</code> 下。
                </small>
              </label>
            </>
          )}
          {fileMode === "delete-resource" && (
            <label className="managed-field-wide">
              <span>resource_id · 必填</span>
              <input
                value={sessionResourceId}
                onChange={(event) =>
                  onSessionResourceIdChange(event.target.value)
                }
                disabled={busy}
              />
              <small>
                使用添加或查询 Session Resources 返回的资源 ID，不是原始 file_id。
              </small>
            </label>
          )}
          {(fileMode === "list-resources" ||
            fileMode === "list-generated") && (
            <p className="managed-field-wide managed-inline-note">
              {fileMode === "list-resources"
                ? "查询返回当前挂载资源及其 resource_id，可用于后续移除。"
                : "通过 Files API 的 scope_id=Session ID 查询 Agent 在该 Session 中生成的文件。"}
            </p>
          )}
          <div className="managed-resource-guidance managed-field-wide">
            <div>
              <strong>只读输入</strong>
              <span>挂载文件是原文件的只读副本，Agent 不能覆盖上传源。</span>
            </div>
            <div>
              <strong>产出新文件</strong>
              <span>要求 Agent 把修改结果写到新路径，再按 Session ID 查询。</span>
            </div>
          </div>
        </section>
      )}

      {mode === "memory" && (
        <section className="managed-agent-section managed-agent-optional-section">
          <div className="managed-field-wide managed-capability-heading">
            <div>
              <span>管理和使用持久化记忆</span>
              <small>
                Memory Store 跨 Session 保留；Agent 只读，内容由 API 或控制台维护。
              </small>
            </div>
            <a
              href="https://docs.volcengine.com/docs/82379/2553728?lang=zh"
              target="_blank"
              rel="noreferrer"
            >
              记忆指南 ↗
            </a>
          </div>
          <label className="managed-field-wide">
            <span>Memory 操作</span>
            <select
              value={memoryMode}
              onChange={(event) =>
                onMemoryModeChange(event.target.value as SessionMemoryMode)
              }
              disabled={busy}
            >
              <optgroup label="Memory Store">
                <option value="create-store">创建 Store</option>
                <option value="list-stores">列出 Store</option>
                <option value="delete-store">删除 Store</option>
              </optgroup>
              <optgroup label="Memory 内容">
                <option value="create-memory">创建 Memory</option>
                <option value="list-memories">列出 Memory</option>
                <option value="retrieve-memory">读取 Memory</option>
                <option value="update-memory">更新 Memory</option>
                <option value="delete-memory">删除 Memory</option>
              </optgroup>
            </select>
            <small>
              创建后回填 ID；挂载请回到“创建 Session”并添加 memory_store 资源。
            </small>
          </label>
          {memoryMode === "create-store" && (
            <>
              <label>
                <span>name · 必填</span>
                <input
                  value={memoryStoreBody.name}
                  onChange={(event) =>
                    onMemoryStoreBodyChange({
                      ...memoryStoreBody,
                      name: event.target.value,
                    })
                  }
                  disabled={busy}
                />
                <small>按用户、项目或团队共享场景拆分 Store。</small>
              </label>
              <label>
                <span>description · 必填</span>
                <textarea
                  value={memoryStoreBody.description}
                  onChange={(event) =>
                    onMemoryStoreBodyChange({
                      ...memoryStoreBody,
                      description: event.target.value,
                    })
                  }
                  disabled={busy}
                />
                <small>会展示给 Agent，说明记忆内容和使用场景。</small>
              </label>
            </>
          )}
          {memoryMode !== "create-store" &&
            memoryMode !== "list-stores" && (
              <label className="managed-field-wide">
                <span>memory_store_id · 必填</span>
                <input
                  value={memoryStoreId}
                  onChange={(event) =>
                    onMemoryStoreIdChange(event.target.value)
                  }
                  placeholder="memstore_..."
                  disabled={busy}
                />
                <small>创建 Store 成功后自动填写。</small>
              </label>
            )}
          {(memoryMode === "create-memory" ||
            memoryMode === "update-memory") && (
            <>
              <label>
                <span>path · {memoryMode === "create-memory" ? "必填" : "选填"}</span>
                <input
                  value={memoryBody.path}
                  onChange={(event) =>
                    onMemoryBodyChange({
                      ...memoryBody,
                      path: event.target.value,
                    })
                  }
                  disabled={busy}
                />
                <small>以 / 开头；更新 path 可用于重命名或归档。</small>
              </label>
              <label>
                <span>
                  content · {memoryMode === "create-memory" ? "必填" : "选填"}
                </span>
                <textarea
                  value={memoryBody.content}
                  onChange={(event) =>
                    onMemoryBodyChange({
                      ...memoryBody,
                      content: event.target.value,
                    })
                  }
                  disabled={busy}
                />
                <small>单条上限 100 KB，建议拆成小而聚焦的 Markdown 文件。</small>
              </label>
            </>
          )}
          {memoryMode === "list-memories" && (
            <>
              <label>
                <span>path_prefix · 选填</span>
                <input
                  value={memoryQuery.path_prefix}
                  onChange={(event) =>
                    onMemoryQueryChange({
                      ...memoryQuery,
                      path_prefix: event.target.value,
                    })
                  }
                  disabled={busy}
                />
                <small>按路径前缀浏览，类似查看目录。</small>
              </label>
              <label>
                <span>depth · 选填</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={memoryQuery.depth}
                  onChange={(event) =>
                    onMemoryQueryChange({
                      ...memoryQuery,
                      depth: Math.min(
                        20,
                        Math.max(1, Number(event.target.value) || 2),
                      ),
                    })
                  }
                  disabled={busy}
                />
                <small>工作台同时固定 order_by=path。</small>
              </label>
            </>
          )}
          {(memoryMode === "retrieve-memory" ||
            memoryMode === "update-memory" ||
            memoryMode === "delete-memory") && (
              <label className="managed-field-wide">
                <span>memory_id · 必填</span>
                <input
                  value={memoryId}
                  onChange={(event) => onMemoryIdChange(event.target.value)}
                  disabled={busy}
                />
                <small>由创建或列表响应返回；读取会返回完整 content。</small>
              </label>
            )}
          <div className="managed-resource-guidance managed-field-wide">
            <div>
              <strong>挂载限制</strong>
              <span>每个 Session 最多 10 个 Store，且只能在创建时挂载。</span>
            </div>
            <div>
              <strong>容量限制</strong>
              <span>每个 Store 最多 2,000 条 Memory；满额后仍可读和更新。</span>
            </div>
            <div>
              <strong>Agent Toolset</strong>
              <span>Agent 必须启用 Agent Toolset 才能用标准文件工具读取记忆。</span>
            </div>
          </div>
        </section>
      )}

      {mode === "delete" && (
        <section className="managed-session-danger managed-field-wide">
          <div>
            <strong>永久删除，无法恢复</strong>
            <p>
              会移除 Session 记录、全部事件和关联沙箱；running 状态不能删除。
              Agent、Environment、Vaults、文件与 Memory 等独立资源不受影响。
            </p>
          </div>
          <label>
            <input
              type="checkbox"
              checked={deleteConfirmed}
              onChange={(event) =>
                onDeleteConfirmedChange(event.target.checked)
              }
              disabled={busy}
            />
            <span>我确认永久删除这个 Session</span>
          </label>
        </section>
      )}

      <p className="managed-field-wide managed-agent-notice">
        Session 历史除非显式删除会永久保留；idle 检查点保存文件系统、已安装包和产物，
        自最后活动时间起保留 30 天。
      </p>
    </div>
  );
}

function SessionResourceEditor({
  resource,
  index,
  busy,
  onChange,
  onRemove,
}: {
  resource: SessionResource;
  index: number;
  busy: boolean;
  onChange: (resource: SessionResource) => void;
  onRemove: () => void;
}) {
  return (
    <article className="managed-resource-editor">
      <div>
        <strong>
          #{index + 1} · {resource.type}
        </strong>
        <button type="button" onClick={onRemove} disabled={busy}>
          移除
        </button>
      </div>
      {resource.type === "file" && (
        <>
          <label>
            <span>file_id · 必填</span>
            <input
              value={resource.file_id}
              onChange={(event) =>
                onChange({ ...resource, file_id: event.target.value })
              }
              disabled={busy}
            />
          </label>
          <label>
            <span>mount_path · 选填</span>
            <input
              value={resource.mount_path ?? ""}
              onChange={(event) =>
                onChange({
                  ...resource,
                  ...(event.target.value
                    ? { mount_path: event.target.value }
                    : { mount_path: undefined }),
                })
              }
              disabled={busy}
            />
          </label>
        </>
      )}
      {resource.type === "tos" && (
        <>
          <label>
            <span>tos_bucket · 必填</span>
            <input
              value={resource.tos_bucket}
              onChange={(event) =>
                onChange({ ...resource, tos_bucket: event.target.value })
              }
              disabled={busy}
            />
          </label>
          <label>
            <span>tos_key · 必填</span>
            <input
              value={resource.tos_key}
              onChange={(event) =>
                onChange({ ...resource, tos_key: event.target.value })
              }
              disabled={busy}
            />
            <small>必须是以 / 结尾的目录键。</small>
          </label>
        </>
      )}
      {resource.type === "memory_store" && (
        <>
          <label>
            <span>memory_store_id · 必填</span>
            <input
              value={resource.memory_store_id}
              onChange={(event) =>
                onChange({
                  ...resource,
                  memory_store_id: event.target.value,
                })
              }
              disabled={busy}
            />
          </label>
          <label>
            <span>instructions · 选填</span>
            <textarea
              value={resource.instructions ?? ""}
              maxLength={4096}
              onChange={(event) =>
                onChange({
                  ...resource,
                  ...(event.target.value
                    ? { instructions: event.target.value }
                    : { instructions: undefined }),
                })
              }
              disabled={busy}
            />
            <small>最长 4,096 字符，会连同 Store 名称和描述展示给 Agent。</small>
          </label>
        </>
      )}
    </article>
  );
}

function EnvironmentFields({
  body,
  busy,
  onChange,
}: {
  body: EnvironmentBody;
  busy: boolean;
  onChange: (body: EnvironmentBody) => void;
}) {
  const packages = body.config.packages;
  const envEntries = Object.entries(body.config.env ?? {});
  const metadataEntries = Object.entries(body.metadata ?? {});
  const networking = body.config.networking;

  function updatePackageManager(
    manager: EnvironmentPackageManager,
    value: string,
  ) {
    const items = value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
    const nextPackages: EnvironmentPackages = {
      ...(packages ?? {}),
    };
    if (items.length > 0) {
      nextPackages[manager] = items;
    } else {
      delete nextPackages[manager];
    }
    onChange({
      ...body,
      config: { ...body.config, packages: nextPackages },
    });
  }

  function removeConfigField(key: "packages" | "env") {
    const config = { ...body.config };
    delete config[key];
    onChange({ ...body, config });
  }

  return (
    <div className="managed-environment-fields managed-field-wide">
      <section className="managed-agent-section managed-agent-basics">
        <div className="managed-field-wide managed-capability-heading">
          <div>
            <span>01 · 环境身份</span>
            <small>用于识别、复用和追踪云端沙箱模板。</small>
          </div>
          <a
            href="https://docs.volcengine.com/docs/82379/2553721?lang=zh"
            target="_blank"
            rel="noreferrer"
          >
            环境文档 ↗
          </a>
        </div>
        <label>
          <span>name · 必填</span>
          <input
            value={body.name}
            onChange={(event) =>
              onChange({ ...body, name: event.target.value })
            }
            disabled={busy}
          />
          <small>在当前组织或工作区内保持清晰且唯一。</small>
        </label>
        <label>
          <span>description · 选填</span>
          <input
            value={body.description ?? ""}
            onChange={(event) =>
              onChange({ ...body, description: event.target.value })
            }
            disabled={busy}
          />
          <small>说明用途、依赖或适用的 Agent 场景。</small>
        </label>
        <label>
          <span>config.type · 必填</span>
          <input value="cloud" readOnly />
          <small>本环节按官方“配置云环境”文档固定为 cloud。</small>
        </label>
        <label>
          <span>scope · 选填</span>
          <select
            value={body.scope ?? ""}
            onChange={(event) => {
              const scope = event.target.value as
                | ""
                | EnvironmentBody["scope"];
              const next = { ...body };
              if (scope) next.scope = scope;
              else delete next.scope;
              onChange(next);
            }}
            disabled={busy}
          >
            <option value="">不传入</option>
            <option value="organization">organization · 组织级</option>
            <option value="account">account · 账号内</option>
          </select>
          <small>官方标记为协议兼容预留字段，本期不启用。</small>
        </label>
      </section>

      <section className="managed-agent-section managed-agent-optional-section">
        <div className="managed-field-wide managed-capability-heading">
          <div>
            <span>02 · networking</span>
            <small>控制沙箱的出站网络访问范围。</small>
          </div>
          <a
            href="https://docs.volcengine.com/docs/82379/2553721?lang=zh"
            target="_blank"
            rel="noreferrer"
          >
            网络说明 ↗
          </a>
        </div>
        <label className="managed-field-wide">
          <span>config.networking.type · 必填</span>
          <select
            value={networking.type}
            onChange={(event) =>
              onChange({
                ...body,
                config: {
                  ...body.config,
                  networking:
                    event.target.value === "limited"
                      ? {
                          type: "limited",
                          allow_mcp_servers: true,
                          allow_package_managers: true,
                          allowed_hosts: [],
                        }
                      : { type: "unrestricted" },
                },
              })
            }
            disabled={busy}
          >
            <option value="unrestricted">unrestricted · 完整出站访问</option>
            <option value="limited">limited · 白名单访问</option>
          </select>
          <small>
            unrestricted 仍受通用安全拦截列表限制；limited 仅开放下方显式能力与主机。
          </small>
        </label>
        {networking.type === "limited" && (
          <>
            <label className="managed-boolean-field">
              <span>allow_mcp_servers · 选填</span>
              <select
                value={
                  networking.allow_mcp_servers === undefined
                    ? ""
                    : String(networking.allow_mcp_servers)
                }
                onChange={(event) =>
                  onChange({
                    ...body,
                    config: {
                      ...body.config,
                      networking: {
                        ...networking,
                        allow_mcp_servers:
                          event.target.value === ""
                            ? undefined
                            : event.target.value === "true",
                      },
                    },
                  })
                }
                disabled={busy}
              >
                <option value="">不传入</option>
                <option value="true">true · 允许</option>
                <option value="false">false · 禁止</option>
              </select>
              <small>允许访问 Agent 已配置的 MCP Servers。</small>
            </label>
            <label className="managed-boolean-field">
              <span>allow_package_managers · 选填</span>
              <select
                value={
                  networking.allow_package_managers === undefined
                    ? ""
                    : String(networking.allow_package_managers)
                }
                onChange={(event) =>
                  onChange({
                    ...body,
                    config: {
                      ...body.config,
                      networking: {
                        ...networking,
                        allow_package_managers:
                          event.target.value === ""
                            ? undefined
                            : event.target.value === "true",
                      },
                    },
                  })
                }
                disabled={busy}
              >
                <option value="">不传入</option>
                <option value="true">true · 允许</option>
                <option value="false">false · 禁止</option>
              </select>
              <small>允许 pip、npm、apt 等访问各自官方源。</small>
            </label>
            <label className="managed-field-wide">
              <span>allowed_hosts[] · 选填</span>
              <textarea
                value={(networking.allowed_hosts ?? []).join("\n")}
                onChange={(event) =>
                  onChange({
                    ...body,
                    config: {
                      ...body.config,
                      networking: {
                        ...networking,
                        allowed_hosts: event.target.value
                          .split(/[\n,]/)
                          .map((item) => item.trim())
                          .filter(Boolean),
                      },
                    },
                  })
                }
                disabled={busy}
                placeholder={"api.example.com\n10.0.0.8"}
              />
              <small>每行一个允许访问的域名或 IP，不填写协议和路径。</small>
            </label>
          </>
        )}
      </section>

      <section className="managed-agent-section managed-agent-optional-section">
        <CapabilityEditorHeading
          index="03"
          title="预安装依赖 · config.packages"
          description="Session 启动时安装并缓存依赖；可显式锁定版本。"
          href="https://docs.volcengine.com/docs/82379/2553721?lang=zh"
          actionLabel={packages ? "移除 packages" : "添加 packages"}
          actionDisabled={busy}
          onAction={() =>
            packages
              ? removeConfigField("packages")
              : onChange({
                  ...body,
                  config: {
                    ...body.config,
                    packages: { type: "packages" },
                  },
                })
          }
        />
        {!packages ? (
          <EmptyCapability text="选填项未添加。点击“添加 packages”后展开六类包管理器。" />
        ) : (
          <>
            <label className="managed-field-wide">
              <span>config.packages.type · 选填</span>
              <select
                value={packages.type ?? ""}
                onChange={(event) =>
                  onChange({
                    ...body,
                    config: {
                      ...body.config,
                      packages: {
                        ...packages,
                        ...(event.target.value
                          ? { type: "packages" }
                          : { type: undefined }),
                      },
                    },
                  })
                }
                disabled={busy}
              >
                <option value="">不传入</option>
                <option value="packages">packages · 固定值</option>
              </select>
              <small>依赖配置类型；传入时固定为 packages。</small>
            </label>
            <div className="managed-field-wide managed-package-grid">
              {ENVIRONMENT_PACKAGE_MANAGERS.map((manager) => (
                <label key={manager.key}>
                  <span>config.packages.{manager.label}[] · 选填</span>
                  <textarea
                    value={(packages[manager.key] ?? []).join("\n")}
                    onChange={(event) =>
                      updatePackageManager(manager.key, event.target.value)
                    }
                    disabled={busy}
                    placeholder={
                      manager.key === "pip"
                        ? "pandas\nnumpy==2.0.0"
                        : manager.description
                    }
                  />
                  <small>{manager.description}；每行或逗号分隔一个包。</small>
                </label>
              ))}
            </div>
          </>
        )}
      </section>

      <EnvironmentMapEditor
        index="04"
        title="环境变量 · config.env"
        description="注入 sandbox 进程的字符串键值对。"
        entries={envEntries}
        fieldPresent={body.config.env !== undefined}
        busy={busy}
        reservedPrefixWarning
        onAddField={() =>
          onChange({
            ...body,
            config: { ...body.config, env: {} },
          })
        }
        onRemoveField={() => removeConfigField("env")}
        onChange={(entries) =>
          onChange({
            ...body,
            config: {
              ...body.config,
              env: Object.fromEntries(entries),
            },
          })
        }
      />

      <EnvironmentMapEditor
        index="05"
        title="metadata"
        description="业务侧自定义字符串键值，用于外部标识和追踪。"
        entries={metadataEntries}
        fieldPresent={body.metadata !== undefined}
        busy={busy}
        onAddField={() => onChange({ ...body, metadata: {} })}
        onRemoveField={() => {
          const next = { ...body };
          delete next.metadata;
          onChange(next);
        }}
        onChange={(entries) =>
          onChange({ ...body, metadata: Object.fromEntries(entries) })
        }
      />

      <p className="managed-field-wide managed-agent-notice">
        一个环境可被多个 Session 复用，但每个 Session 都会启动独立沙箱，文件系统互不共享。
        环境本身不做版本化管理；频繁修改时应在业务侧记录配置版本。
      </p>
    </div>
  );
}

function EnvironmentMapEditor({
  index,
  title,
  description,
  entries,
  fieldPresent,
  busy,
  reservedPrefixWarning = false,
  onAddField,
  onRemoveField,
  onChange,
}: {
  index: string;
  title: string;
  description: string;
  entries: Array<[string, string]>;
  fieldPresent: boolean;
  busy: boolean;
  reservedPrefixWarning?: boolean;
  onAddField: () => void;
  onRemoveField: () => void;
  onChange: (entries: Array<[string, string]>) => void;
}) {
  return (
    <section className="managed-agent-section managed-agent-optional-section">
      <CapabilityEditorHeading
        index={index}
        title={title}
        description={description}
        href="https://docs.volcengine.com/docs/82379/2553721?lang=zh"
        actionLabel={fieldPresent ? `移除 ${title}` : `添加 ${title}`}
        actionDisabled={busy}
        onAction={fieldPresent ? onRemoveField : onAddField}
      />
      {!fieldPresent ? (
        <EmptyCapability text={`选填项未添加。点击“添加 ${title}”后展开键值编辑。`} />
      ) : (
        <>
          <CapabilityItemsToolbar
            label={`已添加 ${title} 字段 · ${entries.length} 项`}
            actionLabel="新增键值对"
            disabled={busy}
            onAction={() =>
              onChange([...entries, [`KEY_${entries.length + 1}`, ""]])
            }
          />
          {entries.length === 0 && (
            <EmptyCapability text={`${title} 已加入 Request Body，可继续新增键值对。`} />
          )}
          {entries.map(([key, value], entryIndex) => (
            <div
              className="managed-capability-row managed-metadata-row"
              key={`${title}-${entryIndex}-${key}`}
            >
              <label>
                <span>{title} key</span>
                <input
                  value={key}
                  onChange={(event) => {
                    const next = [...entries];
                    next[entryIndex] = [event.target.value, value];
                    onChange(next);
                  }}
                  disabled={busy}
                />
              </label>
              <label>
                <span>{title} value</span>
                <input
                  value={value}
                  onChange={(event) => {
                    const next = [...entries];
                    next[entryIndex] = [key, event.target.value];
                    onChange(next);
                  }}
                  disabled={busy}
                />
              </label>
              <RemoveButton
                label={`移除 ${entryIndex + 1}`}
                disabled={busy}
                onClick={() =>
                  onChange(
                    entries.filter((_, itemIndex) => itemIndex !== entryIndex),
                  )
                }
              />
            </div>
          ))}
          {reservedPrefixWarning && (
            <p className="managed-field-wide managed-inline-error">
              环境变量 key 禁止使用 ARK_ 或 VOLC_ 保留前缀。
            </p>
          )}
        </>
      )}
    </section>
  );
}

function AgentFields({
  mode,
  targetAgentId,
  body,
  busy,
  onModeChange,
  onTargetAgentIdChange,
  onChange,
}: {
  mode: AgentMode;
  targetAgentId: string;
  body: AgentBody;
  busy: boolean;
  onModeChange: (mode: AgentMode) => void;
  onTargetAgentIdChange: (value: string) => void;
  onChange: (body: AgentBody) => void;
}) {
  const skills = body.skills ?? [];
  const tools = body.tools ?? [];
  const mcpServers = body.mcp_servers ?? [];
  const metadataEntries = Object.entries(body.metadata ?? {});
  const multiagentMembers = body.multiagent?.agents ?? [];

  function patchTool(index: number, patch: Partial<AgentTool>) {
    onChange({
      ...body,
      tools: tools.map((tool, itemIndex) =>
        itemIndex === index ? { ...tool, ...patch } : tool,
      ),
    });
  }

  function withoutField(key: keyof AgentBody): AgentBody {
    const next = { ...body };
    delete next[key];
    return next;
  }

  return (
    <div className="managed-agent-fields managed-field-wide">
      <div className="managed-field-wide managed-agent-mode">
        <div>
          <span>管理模式</span>
          <small>创建返回初始版本 1；更新需携带当前版本并生成新版本。</small>
        </div>
        <div className="managed-mode-switch" role="group" aria-label="Agent 管理模式">
          <button
            type="button"
            data-active={mode === "create"}
            onClick={() => onModeChange("create")}
            disabled={busy}
          >
            创建 Agent
          </button>
          <button
            type="button"
            data-active={mode === "update"}
            onClick={() => onModeChange("update")}
            disabled={busy}
          >
            更新 Agent
          </button>
        </div>
      </div>

      {mode === "update" && (
        <>
          <label>
            <span>Agent ID</span>
            <input
              aria-label="待更新 Agent ID"
              value={targetAgentId}
              onChange={(event) => onTargetAgentIdChange(event.target.value)}
              disabled={busy}
            />
            <small>URL 路径中的已有 Agent ID，不进入 Request Body。</small>
          </label>
          <label>
            <span>当前 version</span>
            <input
              aria-label="Agent 当前版本"
              type="number"
              min={1}
              value={body.version ?? 1}
              onChange={(event) =>
                onChange({
                  ...body,
                  version: Math.max(1, Number(event.target.value) || 1),
                })
              }
              disabled={busy}
            />
            <small>版本不匹配会更新失败；成功后响应返回新的版本号。</small>
          </label>
          <p className="managed-field-wide managed-agent-notice">
            UpdateAgent 支持部分更新；当前结构化表单展示完整配置。若只更新部分字段，可在右侧
            Request Body 中删除不变字段。<strong>skills 一旦传入会整组覆盖</strong>，请先把需要保留的
            Skill 一并写回。
          </p>
        </>
      )}

      <section className="managed-agent-section managed-agent-basics">
        <div className="managed-field-wide managed-capability-heading">
          <div>
            <span>01 · 基本信息与模型</span>
            <small>创建 Agent 的核心身份、模型和长期行为定义。</small>
          </div>
          <a
            href="https://docs.volcengine.com/docs/82379/2553716?lang=zh"
            target="_blank"
            rel="noreferrer"
          >
            Agent 文档 ↗
          </a>
        </div>
        <label>
        <span>name {mode === "create" ? "· 必填" : "· 选填"}</span>
        <input
          value={body.name ?? ""}
          onChange={(event) => onChange({ ...body, name: event.target.value })}
          disabled={busy}
        />
        <small>仅英文字母、汉字、数字，长度 1–64。</small>
        </label>
        <label>
        <span>description · 选填</span>
        <input
          value={body.description ?? ""}
          maxLength={300}
          onChange={(event) =>
            onChange({ ...body, description: event.target.value })
          }
          disabled={busy}
        />
        <small>用于检索和维护，不超过 300 个字符。</small>
        </label>
        <label>
        <span>model.id {mode === "create" ? "· 必填" : "· 选填"}</span>
        <input
          value={body.model?.id ?? ""}
          onChange={(event) =>
            onChange({
              ...body,
              model: {
                id: event.target.value,
                ...(body.model?.speed ? { speed: body.model.speed } : {}),
              },
            })
          }
          disabled={busy}
        />
        <small>填写已开通的模型 ID。</small>
        </label>
        <label>
        <span>model.speed · 选填</span>
        <select
          value={body.model?.speed ?? ""}
          onChange={(event) => {
            const speed = event.target.value as "" | "standard" | "fast";
            onChange({
              ...body,
              model: {
                id: body.model?.id ?? "",
                ...(speed ? { speed } : {}),
              },
            });
          }}
          disabled={busy}
        >
          <option value="">不传入</option>
          <option value="standard">standard · 标准</option>
          <option value="fast">fast · 更快</option>
        </select>
        <small>可选 standard 或 fast。</small>
        </label>
        <label className="managed-field-wide">
        <span>system · 选填</span>
        <textarea
          value={body.system ?? ""}
          onChange={(event) => onChange({ ...body, system: event.target.value })}
          disabled={busy}
        />
        <small>定义长期角色、行为边界与工作方式；一次性任务应放到 Session 消息。</small>
        </label>
      </section>

      <section className="managed-agent-section managed-agent-optional-section">
        <CapabilityEditorHeading
        index="02"
        title="Skills"
        description="可复用的知识、流程与最佳实践；最多 20 个。更新时 skills 一旦传入会整组覆盖。"
        href="https://docs.volcengine.com/docs/82379/2553717?lang=zh"
        actionLabel={body.skills === undefined ? "添加 Skills" : "移除 Skills"}
        actionDisabled={busy}
        onAction={() =>
          onChange(
            body.skills === undefined
              ? { ...body, skills: [] }
              : withoutField("skills"),
          )
        }
        />
        {body.skills === undefined ? (
          <EmptyCapability text="选填项未添加。点击“添加 Skills”后展开配置。" />
        ) : (
          <>
          <CapabilityItemsToolbar
            label={`已添加 Skills 字段 · ${skills.length}/20`}
            actionLabel="新增 Skill"
            disabled={busy || skills.length >= 20}
            onAction={() =>
              onChange({
                ...body,
                skills: [...skills, { type: "skill_hub" }],
              })
            }
          />
          {skills.length === 0 && (
            <EmptyCapability text="Skills 字段已加入 Request Body；可继续新增 Skill 条目，或移除整个字段。" />
          )}
          {skills.map((skill, index) => (
          <div className="managed-capability-row" key={`skill-${index}`}>
            <label>
              <span>skills[{index}].type · 必填</span>
              <select
                value={skill.type}
                onChange={(event) => {
                  const next = [...skills];
                  next[index] = {
                    ...skill,
                    type: event.target.value as AgentSkill["type"],
                  };
                  onChange({ ...body, skills: next });
                }}
                disabled={busy}
              >
                <option value="skill_hub">skill_hub · 预置</option>
                <option value="custom">custom · 自定义</option>
              </select>
              <small>SkillHub 预置能力或 CreateSkill 上传的自定义能力。</small>
            </label>
            <label>
              <span>skill_id · 选填</span>
              <input
                value={skill.skill_id ?? ""}
                onChange={(event) => {
                  const next = [...skills];
                  next[index] = { ...skill, skill_id: event.target.value };
                  onChange({ ...body, skills: next });
                }}
                disabled={busy}
              />
              <small>预置 Skill ID 或 CreateSkill 返回的 id。</small>
            </label>
            <label>
              <span>version · 选填</span>
              <input
                value={skill.version ?? ""}
                onChange={(event) => {
                  const next = [...skills];
                  next[index] = { ...skill, version: event.target.value };
                  onChange({ ...body, skills: next });
                }}
                disabled={busy}
              />
              <small>需要锁定自定义 Skill 版本时填写。</small>
            </label>
            <RemoveButton
              label={`移除 Skill ${index + 1}`}
              disabled={busy}
              onClick={() =>
                onChange({
                  ...body,
                  skills: skills.filter((_, itemIndex) => itemIndex !== index),
                })
              }
            />
          </div>
          ))}
          </>
        )}
      </section>

      <section className="managed-agent-section managed-agent-optional-section">
        <CapabilityEditorHeading
        index="03"
        title="Tools"
        description="内置工具、Evolution 与 MCP 工具集；支持总开关和逐工具配置。"
        href="https://docs.volcengine.com/docs/82379/2553719?lang=zh"
        actionLabel={body.tools === undefined ? "添加 Tools" : "移除 Tools"}
        actionDisabled={busy}
        onAction={() =>
          onChange(
            body.tools === undefined
              ? { ...body, tools: [] }
              : withoutField("tools"),
          )
        }
        />
        {body.tools === undefined ? (
          <EmptyCapability text="选填项未添加。点击“添加 Tools”后展开配置。" />
        ) : (
          <>
          <CapabilityItemsToolbar
            label={`已添加 Tools 字段 · ${tools.length} 项`}
            actionLabel="新增 Tool"
            disabled={busy}
            onAction={() =>
              onChange({
                ...body,
                tools: [...tools, { type: "agent_toolset_20260701" }],
              })
            }
          />
          {tools.length === 0 && (
            <EmptyCapability text="Tools 字段已加入 Request Body；可新增内置、Evolution 或 MCP Tool。" />
          )}
          {tools.map((tool, index) => (
          <div className="managed-capability-row" key={`tool-${index}`}>
            <label>
              <span>tools[{index}].type · 必填</span>
              <select
                value={tool.type}
                onChange={(event) => {
                  const type = event.target.value as AgentTool["type"];
                  const next: AgentTool = { type };
                  if (type === "mcp_toolset") next.mcp_server_name = "";
                  if (type === "evolution") {
                    next.configs = [{ name: "advisor", enabled: true }];
                  }
                  const nextTools = [...tools];
                  nextTools[index] = next;
                  onChange({ ...body, tools: nextTools });
                }}
                disabled={busy}
              >
                <option value="agent_toolset_20260701">
                  agent_toolset_20260701 · 内置
                </option>
                <option value="evolution">evolution · Advisor</option>
                <option value="mcp_toolset">mcp_toolset · 外部 MCP</option>
              </select>
              <small>当前不支持自定义 Tool；外部系统通过 MCP 接入。</small>
            </label>
            {tool.type === "mcp_toolset" && (
              <label>
                <span>mcp_server_name · 必填</span>
                <input
                  value={tool.mcp_server_name ?? ""}
                  onChange={(event) =>
                    patchTool(index, { mcp_server_name: event.target.value })
                  }
                  disabled={busy}
                />
                <small>必须与 mcp_servers.name 完全一致。</small>
              </label>
            )}
            <label>
              <span>default_config.enabled · 选填</span>
              <select
                value={
                  tool.default_config
                    ? String(tool.default_config.enabled)
                    : ""
                }
                onChange={(event) =>
                  patchTool(index, {
                    default_config:
                      event.target.value === ""
                        ? undefined
                        : { enabled: event.target.value === "true" },
                  })
                }
                disabled={busy || tool.type === "evolution"}
              >
                <option value="">使用默认</option>
                <option value="true">true · 默认开启</option>
                <option value="false">false · 默认关闭</option>
              </select>
              <small>Evolution / advisor 不支持 permission policy；显式开关放在 configs。</small>
            </label>
            <div className="managed-field-wide managed-tool-configs">
              <div>
                <span>configs[] · 选填</span>
                <button
                  type="button"
                  onClick={() =>
                    patchTool(index, {
                      configs: [
                        ...(tool.configs ?? []),
                        {
                          name:
                            tool.type === "evolution" ? "advisor" : "read",
                          enabled: true,
                        },
                      ],
                    })
                  }
                  disabled={busy}
                >
                  添加逐工具配置
                </button>
              </div>
              {(tool.configs ?? []).map((config, configIndex) => (
                <div
                  className="managed-inline-config"
                  key={`tool-${index}-config-${configIndex}`}
                >
                  <input
                    aria-label={`工具 ${index + 1} 配置名 ${configIndex + 1}`}
                    value={config.name}
                    onChange={(event) => {
                      const configs = [...(tool.configs ?? [])];
                      configs[configIndex] = {
                        ...config,
                        name: event.target.value,
                      };
                      patchTool(index, { configs });
                    }}
                    disabled={busy}
                  />
                  <select
                    aria-label={`工具 ${index + 1} 配置状态 ${configIndex + 1}`}
                    value={String(config.enabled)}
                    onChange={(event) => {
                      const configs = [...(tool.configs ?? [])];
                      configs[configIndex] = {
                        ...config,
                        enabled: event.target.value === "true",
                      };
                      patchTool(index, { configs });
                    }}
                    disabled={busy}
                  >
                    <option value="true">enabled: true</option>
                    <option value="false">enabled: false</option>
                  </select>
                  <RemoveButton
                    label="移除配置"
                    disabled={busy}
                    onClick={() =>
                      patchTool(index, {
                        configs: (tool.configs ?? []).filter(
                          (_, itemIndex) => itemIndex !== configIndex,
                        ),
                      })
                    }
                  />
                </div>
              ))}
              <small>
                内置名包括 bash、read、write、edit、glob、grep、web_fetch、web_search；
                evolution 当前为 advisor；MCP 使用 Server 暴露的工具名。
              </small>
            </div>
            <RemoveButton
              label={`移除 Tool ${index + 1}`}
              disabled={busy}
              onClick={() =>
                onChange({
                  ...body,
                  tools: tools.filter((_, itemIndex) => itemIndex !== index),
                })
              }
            />
          </div>
          ))}
          </>
        )}
      </section>

      <section className="managed-agent-section managed-agent-optional-section">
        <CapabilityEditorHeading
        index="04"
        title="MCP Servers"
        description="Agent 只声明地址；终端用户凭证应在 Session 中通过 Vaults 注入。"
        href="https://docs.volcengine.com/docs/82379/2553718?lang=zh"
        actionLabel={
          body.mcp_servers === undefined ? "添加 MCP" : "移除 MCP"
        }
        actionDisabled={busy}
        onAction={() =>
          onChange(
            body.mcp_servers === undefined
              ? { ...body, mcp_servers: [] }
              : withoutField("mcp_servers"),
          )
        }
        />
        {body.mcp_servers === undefined ? (
          <EmptyCapability text="选填项未添加。点击“添加 MCP”后展开 Server 配置。" />
        ) : (
          <>
          <CapabilityItemsToolbar
            label={`已添加 MCP 字段 · ${mcpServers.length} 个 Server`}
            actionLabel="新增 MCP Server"
            disabled={busy}
            onAction={() =>
              onChange({
                ...body,
                mcp_servers: [
                  ...mcpServers,
                  { type: "url", name: "", url: "https://" },
                ],
              })
            }
          />
          {mcpServers.length === 0 && (
            <EmptyCapability text="MCP 字段已加入 Request Body；新增 Server 后还需配置同名 mcp_toolset。" />
          )}
          {mcpServers.map((server, index) => (
          <div className="managed-capability-row" key={`mcp-${index}`}>
            <label>
              <span>mcp_servers[{index}].type · 必填</span>
              <input value="url" readOnly />
              <small>当前统一使用 URL 声明方式。</small>
            </label>
            <label>
              <span>name · 必填</span>
              <input
                value={server.name}
                onChange={(event) => {
                  const next = [...mcpServers];
                  next[index] = { ...server, name: event.target.value };
                  onChange({ ...body, mcp_servers: next });
                }}
                disabled={busy}
              />
              <small>同一 Agent 内唯一，并由 mcp_toolset 引用。</small>
            </label>
            <label className="managed-field-wide">
              <span>url · 必填</span>
              <input
                value={server.url}
                onChange={(event) => {
                  const next = [...mcpServers];
                  next[index] = { ...server, url: event.target.value };
                  onChange({ ...body, mcp_servers: next });
                }}
                disabled={busy}
              />
              <small>MCP Server HTTPS 地址；不要在此写入终端用户 token。</small>
            </label>
            <RemoveButton
              label={`移除 MCP Server ${index + 1}`}
              disabled={busy}
              onClick={() =>
                onChange({
                  ...body,
                  mcp_servers: mcpServers.filter(
                    (_, itemIndex) => itemIndex !== index,
                  ),
                })
              }
            />
          </div>
          ))}
          </>
        )}
      </section>

      <section className="managed-agent-section managed-agent-optional-section">
        <CapabilityEditorHeading
        index="05"
        title="Multi Agent"
        description="协调器把任务委派给子 Agent；只支持一层委派，最多 20 个成员。"
        href="https://docs.volcengine.com/docs/82379/2553730?lang=zh"
        actionLabel={body.multiagent ? "移除 Multi Agent" : "添加 Multi Agent"}
        actionDisabled={busy}
        onAction={() =>
          onChange(
            body.multiagent
              ? withoutField("multiagent")
              : {
                  ...body,
                  multiagent: { type: "coordinator", agents: [] },
                },
          )
        }
        />
        {!body.multiagent ? (
          <EmptyCapability text="选填项未添加。点击“添加 Multi Agent”后展开协调器与成员配置。" />
        ) : (
          <div className="managed-capability-row">
          <label>
            <span>multiagent.type · 必填</span>
            <input value="coordinator" readOnly />
            <small>协调器不能再被选作其他协调器的子 Agent。</small>
          </label>
          <div className="managed-field-wide managed-tool-configs">
            <div>
              <span>multiagent.agents[] · 最多 20 个</span>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...body,
                    multiagent: {
                      type: "coordinator",
                      agents: [
                        ...multiagentMembers,
                        { type: "agent", id: "" },
                      ],
                    },
                  })
                }
                disabled={busy || multiagentMembers.length >= 20}
              >
                添加成员
              </button>
            </div>
            {multiagentMembers.map((member, index) => (
              <div
                className="managed-inline-config managed-multiagent-row"
                key={`member-${index}`}
              >
                <select
                  value={member.type}
                  onChange={(event) => {
                    const members = [...multiagentMembers];
                    members[index] =
                      event.target.value === "self"
                        ? { type: "self" }
                        : { type: "agent", id: "" };
                    onChange({
                      ...body,
                      multiagent: { type: "coordinator", agents: members },
                    });
                  }}
                  disabled={busy}
                >
                  <option value="agent">agent · 子智能体</option>
                  <option value="self">self · 协调器自身</option>
                </select>
                {member.type === "agent" && (
                  <>
                    <input
                      aria-label={`子 Agent ID ${index + 1}`}
                      placeholder="Agent ID"
                      value={member.id}
                      onChange={(event) => {
                        const members = [...multiagentMembers];
                        members[index] = {
                          ...member,
                          id: event.target.value,
                        };
                        onChange({
                          ...body,
                          multiagent: {
                            type: "coordinator",
                            agents: members,
                          },
                        });
                      }}
                      disabled={busy}
                    />
                    <input
                      aria-label={`子 Agent 版本 ${index + 1}`}
                      type="number"
                      min={1}
                      placeholder="version 可选"
                      value={member.version ?? ""}
                      onChange={(event) => {
                        const members = [...multiagentMembers];
                        const version = Number(event.target.value);
                        members[index] = {
                          ...member,
                          ...(version >= 1 ? { version } : { version: undefined }),
                        };
                        onChange({
                          ...body,
                          multiagent: {
                            type: "coordinator",
                            agents: members,
                          },
                        });
                      }}
                      disabled={busy}
                    />
                  </>
                )}
                <RemoveButton
                  label="移除成员"
                  disabled={busy}
                  onClick={() =>
                    onChange({
                      ...body,
                      multiagent: {
                        type: "coordinator",
                        agents: multiagentMembers.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      },
                    })
                  }
                />
              </div>
            ))}
            <small>
              Agent ID 必填，version 可选。协调器会锁定子 Agent 版本，子 Agent 更新后需手动更新协调器。
            </small>
          </div>
          </div>
        )}
      </section>

      <section className="managed-agent-section managed-agent-optional-section">
        <div className="managed-field-wide managed-capability-heading">
          <div>
            <span>06 · metadata</span>
            <small>业务侧自定义 map&lt;string,string&gt;，用于外部标识或标签。</small>
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...body,
                metadata: {
                  ...(body.metadata ?? {}),
                  [`key_${metadataEntries.length + 1}`]: "",
                },
              })
            }
            disabled={busy}
          >
            添加键值对
          </button>
        </div>
        {metadataEntries.length === 0 ? (
          <EmptyCapability text="当前没有 metadata。" />
        ) : (
          metadataEntries.map(([key, value], index) => (
          <div
            className="managed-capability-row managed-metadata-row"
            key={`metadata-${index}-${key}`}
          >
            <label>
              <span>metadata key</span>
              <input
                value={key}
                onChange={(event) => {
                  const next = { ...(body.metadata ?? {}) };
                  delete next[key];
                  next[event.target.value] = value;
                  onChange({ ...body, metadata: next });
                }}
                disabled={busy}
              />
            </label>
            <label>
              <span>metadata value</span>
              <input
                value={value}
                onChange={(event) =>
                  onChange({
                    ...body,
                    metadata: {
                      ...(body.metadata ?? {}),
                      [key]: event.target.value,
                    },
                  })
                }
                disabled={busy}
              />
            </label>
            <RemoveButton
              label={`移除 metadata ${index + 1}`}
              disabled={busy}
              onClick={() => {
                const next = { ...(body.metadata ?? {}) };
                delete next[key];
                onChange({ ...body, metadata: next });
              }}
            />
          </div>
          ))
        )}
      </section>
    </div>
  );
}

function CapabilityEditorHeading({
  index,
  title,
  description,
  href,
  actionLabel,
  actionDisabled,
  onAction,
}: {
  index: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  actionDisabled: boolean;
  onAction: () => void;
}) {
  return (
    <div className="managed-field-wide managed-capability-heading">
      <div>
        <span>
          {index} · {title}
        </span>
        <small>{description}</small>
      </div>
      <div>
        <a href={href} target="_blank" rel="noreferrer">
          参考文档 ↗
        </a>
        <button type="button" onClick={onAction} disabled={actionDisabled}>
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function CapabilityItemsToolbar({
  label,
  actionLabel,
  disabled,
  onAction,
}: {
  label: string;
  actionLabel: string;
  disabled: boolean;
  onAction: () => void;
}) {
  return (
    <div className="managed-field-wide managed-capability-items-toolbar">
      <span>{label}</span>
      <button type="button" onClick={onAction} disabled={disabled}>
        {actionLabel}
      </button>
    </div>
  );
}

function EmptyCapability({ text }: { text: string }) {
  return <p className="managed-field-wide managed-empty-capability">{text}</p>;
}

function RemoveButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="managed-remove-button"
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function ManagedAgentApiResult({ result }: { result: AgentApiResult }) {
  const succeeded =
    typeof result.httpStatus === "number" &&
    result.httpStatus >= 200 &&
    result.httpStatus < 300;
  return (
    <section
      className="managed-agent-result"
      data-status={succeeded ? "succeeded" : "failed"}
      aria-live="polite"
    >
      <div>
        <span>API RESPONSE · {result.mode === "create" ? "CREATE" : "UPDATE"}</span>
        <strong>
          {result.httpStatus ? `HTTP ${result.httpStatus}` : "请求未完成"}
        </strong>
        <time>{formatTime(result.receivedAt)}</time>
      </div>
      <pre>{prettyJson(result.body)}</pre>
    </section>
  );
}

function ManagedEnvironmentApiResult({
  result,
}: {
  result: EnvironmentApiResult;
}) {
  const succeeded =
    typeof result.httpStatus === "number" &&
    result.httpStatus >= 200 &&
    result.httpStatus < 300;
  return (
    <section
      className="managed-agent-result"
      data-status={succeeded ? "succeeded" : "failed"}
      aria-live="polite"
    >
      <div>
        <span>API RESPONSE · CREATE ENVIRONMENT</span>
        <strong>
          {result.httpStatus ? `HTTP ${result.httpStatus}` : "请求未完成"}
        </strong>
        <time>{formatTime(result.receivedAt)}</time>
      </div>
      <pre>{prettyJson(result.body)}</pre>
    </section>
  );
}

function ManagedSessionApiResult({ result }: { result: SessionApiResult }) {
  const succeeded =
    typeof result.httpStatus === "number" &&
    result.httpStatus >= 200 &&
    result.httpStatus < 300;
  const actionLabel = {
    create: "CREATE",
    retrieve: "RETRIEVE",
    list: "LIST",
    events: "EVENTS",
    files: "FILES",
    memory: "MEMORY",
    upload: "UPLOAD FILE",
    "add-resource": "ADD RESOURCE",
    "list-resources": "LIST RESOURCES",
    "delete-resource": "DELETE RESOURCE",
    "list-generated": "LIST GENERATED FILES",
    "create-store": "CREATE STORE",
    "list-stores": "LIST STORES",
    "delete-store": "DELETE STORE",
    "create-memory": "CREATE MEMORY",
    "list-memories": "LIST MEMORIES",
    "retrieve-memory": "RETRIEVE MEMORY",
    "update-memory": "UPDATE MEMORY",
    "delete-memory": "DELETE MEMORY",
    delete: "DELETE",
  }[result.action];
  return (
    <section
      className="managed-agent-result"
      data-status={succeeded ? "succeeded" : "failed"}
      aria-live="polite"
    >
      <div>
        <span>API RESPONSE · SESSION {actionLabel}</span>
        <strong>
          {result.httpStatus ? `HTTP ${result.httpStatus}` : "请求未完成"}
        </strong>
        <time>{formatTime(result.receivedAt)}</time>
      </div>
      <pre>{prettyJson(result.body)}</pre>
    </section>
  );
}

function ManagedStep({
  number,
  title,
  description,
  status,
  resultId,
  actionLabel,
  actionDisabled,
  onAction,
  prerequisite,
  fields,
  apiDetails,
  output,
}: {
  number: string;
  title: string;
  description: string;
  status: StepStatus;
  resultId?: string;
  actionLabel: string;
  actionDisabled: boolean;
  onAction: () => void;
  prerequisite?: string;
  fields: React.ReactNode;
  apiDetails: React.ReactNode;
  output?: React.ReactNode;
}) {
  return (
    <article
      className="managed-step-card"
      data-status={status}
      data-step={number}
    >
      <header>
        <span>{number}</span>
        <div>
          <p>{statusLabel(status)}</p>
          <h3>{title}</h3>
          <small>{description}</small>
        </div>
        {resultId && <code>{resultId}</code>}
      </header>
      <div className="managed-step-grid">
        <div className="managed-step-fields">{fields}</div>
        {apiDetails}
      </div>
      {output}
      <footer className="managed-step-actions">
        <p>{prerequisite ?? "确认字段和完整 API 后再执行本步骤。"}</p>
        <button
          data-testid={`managed-action-${number}`}
          type="button"
          onClick={onAction}
          disabled={actionDisabled}
        >
          {status === "running" ? "执行中…" : actionLabel}
        </button>
      </footer>
    </article>
  );
}

function ManagedApiEditor({
  method,
  url,
  secondaryUrl,
  secondaryLabel = "STREAM GET",
  apiKey,
  draft,
  error,
  onChange,
  bodyNote,
  contentType = "application/json",
}: {
  method: "POST" | "GET" | "DELETE";
  url: string;
  secondaryUrl?: string;
  secondaryLabel?: string;
  apiKey: string;
  draft?: string;
  error?: string;
  onChange?: (value: string) => void;
  bodyNote?: string;
  contentType?: string;
}) {
  return (
    <section className="managed-api-editor">
      <div className="managed-api-editor-heading">
        <div>
          <span>完整 API 详情</span>
          <small>{onChange ? "表单 ↔ JSON 双向联动" : "随左侧字段实时生成"}</small>
        </div>
        <strong>{method}</strong>
      </div>
      <dl>
        <div>
          <dt>URL</dt>
          <dd>{url}</dd>
        </div>
        {secondaryUrl && (
          <div>
            <dt>{secondaryLabel}</dt>
            <dd>{secondaryUrl}</dd>
          </div>
        )}
        <div>
          <dt>Authorization</dt>
          <dd>Bearer {apiKey ? maskApiKey(apiKey) : "••••••••"}</dd>
        </div>
        {method === "POST" && (
          <div>
            <dt>Content-Type</dt>
            <dd>{contentType}</dd>
          </div>
        )}
      </dl>
      {draft !== undefined ? (
        <>
          <label>
            <span>Request Body</span>
            <textarea
              aria-label={`${url} Request Body`}
              spellCheck={false}
              value={draft}
              readOnly={!onChange}
              onChange={(event) => onChange?.(event.target.value)}
            />
          </label>
          {onChange &&
            (error ? (
              <p className="managed-json-error">{error}</p>
            ) : (
              <p className="managed-json-ok">JSON 有效，已同步到左侧字段。</p>
            ))}
          {!onChange && (
            <p className="managed-json-ok">
              API 详情由左侧字段生成；请在左侧编辑本操作参数。
            </p>
          )}
        </>
      ) : (
        <div className="managed-api-no-body">
          <span>REQUEST BODY</span>
          <strong>无请求体</strong>
          <p>{bodyNote ?? "该操作的参数已经完整体现在 URL 中。"}</p>
        </div>
      )}
    </section>
  );
}

function parseAgentBody(value: unknown): AgentBody {
  const body = asRecord(value, "Agent Request Body");
  const supported = new Set([
    "version",
    "name",
    "description",
    "model",
    "system",
    "skills",
    "tools",
    "mcp_servers",
    "multiagent",
    "metadata",
  ]);
  const unsupported = Object.keys(body).find((key) => !supported.has(key));
  if (unsupported) {
    throw new Error(`Agent JSON 包含未支持字段：${unsupported}。`);
  }
  if (body.version !== undefined && !Number.isInteger(body.version)) {
    throw new Error("version 必须是整数。");
  }
  if (body.name !== undefined && typeof body.name !== "string") {
    throw new Error("name 必须是字符串。");
  }
  if (
    body.description !== undefined &&
    typeof body.description !== "string"
  ) {
    throw new Error("description 必须是字符串。");
  }
  if (body.model !== undefined) {
    const model = asRecord(body.model, "model");
    if (typeof model.id !== "string") {
      throw new Error("model.id 必须是字符串。");
    }
    if (
      model.speed !== undefined &&
      model.speed !== "standard" &&
      model.speed !== "fast"
    ) {
      throw new Error("model.speed 必须是 standard 或 fast。");
    }
  }
  if (body.system !== undefined && typeof body.system !== "string") {
    throw new Error("system 必须是字符串。");
  }
  for (const key of ["skills", "tools", "mcp_servers"] as const) {
    if (body[key] !== undefined && !Array.isArray(body[key])) {
      throw new Error(`${key} 必须是数组。`);
    }
  }
  if (body.multiagent !== undefined) {
    const multiagent = asRecord(body.multiagent, "multiagent");
    if (
      multiagent.type !== "coordinator" ||
      !Array.isArray(multiagent.agents)
    ) {
      throw new Error("multiagent 需要 type=coordinator 与 agents 数组。");
    }
  }
  if (body.metadata !== undefined) {
    const metadata = asRecord(body.metadata, "metadata");
    if (Object.values(metadata).some((item) => typeof item !== "string")) {
      throw new Error("metadata 的值必须全部是字符串。");
    }
  }
  return body as AgentBody;
}

function parseEnvironmentBody(value: unknown): EnvironmentBody {
  const body = asRecord(value, "Environment Request Body");
  const config = asRecord(body.config, "config");
  const networking = asRecord(config.networking, "networking");
  if (
    typeof body.name !== "string" ||
    config.type !== "cloud" ||
    (networking.type !== "unrestricted" && networking.type !== "limited")
  ) {
    throw new Error(
      "环境 JSON 需要 name、config.type=cloud，以及 unrestricted 或 limited 网络策略。",
    );
  }
  if (body.description !== undefined && typeof body.description !== "string") {
    throw new Error("description 必须是字符串。");
  }
  if (
    body.scope !== undefined &&
    body.scope !== "organization" &&
    body.scope !== "account"
  ) {
    throw new Error("scope 只能是 organization 或 account。");
  }
  if (networking.type === "limited") {
    if (
      networking.allow_mcp_servers !== undefined &&
      typeof networking.allow_mcp_servers !== "boolean"
    ) {
      throw new Error("allow_mcp_servers 必须是布尔值。");
    }
    if (
      networking.allow_package_managers !== undefined &&
      typeof networking.allow_package_managers !== "boolean"
    ) {
      throw new Error("allow_package_managers 必须是布尔值。");
    }
    if (
      networking.allowed_hosts !== undefined &&
      (!Array.isArray(networking.allowed_hosts) ||
        networking.allowed_hosts.some((item) => typeof item !== "string"))
    ) {
      throw new Error("allowed_hosts 必须是字符串数组。");
    }
  }
  if (config.packages !== undefined) {
    const packages = asRecord(config.packages, "config.packages");
    if (packages.type !== undefined && packages.type !== "packages") {
      throw new Error("config.packages.type 只能是 packages。");
    }
    for (const manager of ENVIRONMENT_PACKAGE_MANAGERS) {
      const items = packages[manager.key];
      if (
        items !== undefined &&
        (!Array.isArray(items) ||
          items.some((item) => typeof item !== "string"))
      ) {
        throw new Error(`config.packages.${manager.key} 必须是字符串数组。`);
      }
    }
  }
  for (const [field, recordValue] of [
    ["config.env", config.env],
    ["metadata", body.metadata],
  ] as const) {
    if (recordValue !== undefined) {
      const record = asRecord(recordValue, field);
      if (Object.values(record).some((item) => typeof item !== "string")) {
        throw new Error(`${field} 的值必须全部是字符串。`);
      }
    }
  }
  return body as EnvironmentBody;
}

function parseSessionBody(value: unknown): SessionBody {
  const body = asRecord(value, "Session Request Body");
  if (typeof body.environment_id !== "string") {
    throw new Error("Session JSON 需要 environment_id。");
  }
  if (typeof body.agent !== "string") {
    const agent = asRecord(body.agent, "agent");
    if (
      agent.type !== "agent" ||
      typeof agent.id !== "string" ||
      !Number.isInteger(agent.version)
    ) {
      throw new Error(
        "agent 必须是 Agent ID 字符串，或包含 type、id、version 的对象。",
      );
    }
  }
  if (
    body.vault_ids !== undefined &&
    (!Array.isArray(body.vault_ids) ||
      body.vault_ids.some((item) => typeof item !== "string"))
  ) {
    throw new Error("vault_ids 必须是字符串数组。");
  }
  if (body.resources !== undefined) {
    if (!Array.isArray(body.resources)) {
      throw new Error("resources 必须是数组。");
    }
    body.resources.forEach((item, index) => {
      const resource = asRecord(item, `resources[${index}]`);
      if (
        resource.type !== "file" &&
        resource.type !== "tos" &&
        resource.type !== "memory_store"
      ) {
        throw new Error(
          `resources[${index}].type 必须为 file、tos 或 memory_store。`,
        );
      }
    });
  }
  return body as SessionBody;
}

function parseMessageBody(value: unknown): MessageBody {
  const body = asRecord(value, "Message Request Body");
  if (
    !Array.isArray(body.events) ||
    body.events.length < 1 ||
    body.events.length > 2
  ) {
    throw new Error("事件 JSON 需要 1 项，或 message + system 两项。");
  }
  const first = asRecord(body.events[0], "events[0]");
  if (
    first.type !== "user.message" &&
    first.type !== "user.interrupt" &&
    first.type !== "user.tool_confirmation"
  ) {
    throw new Error(
      "首个事件必须是 user.message、user.interrupt 或 user.tool_confirmation。",
    );
  }
  if (
    first.type === "user.message" &&
    (!Array.isArray(first.content) || first.content.length < 1)
  ) {
    throw new Error("user.message 必须包含 content 数组。");
  }
  if (body.events.length === 2) {
    const second = asRecord(body.events[1], "events[1]");
    if (
      first.type !== "user.message" ||
      second.type !== "system.message" ||
      !Array.isArray(second.content)
    ) {
      throw new Error(
        "第二项只能是紧跟 user.message 的 system.message。",
      );
    }
  }
  return body as MessageBody;
}

function sessionAgentId(agent: SessionBody["agent"]): string {
  return typeof agent === "string" ? agent : agent.id;
}

function sessionPrerequisite(
  mode: SessionMode,
  body: SessionBody,
  sessionId: string,
  deleteConfirmed: boolean,
): string | undefined {
  if (
    mode === "create" &&
    (!sessionAgentId(body.agent) || !body.environment_id.trim())
  ) {
    return "创建 Session 需要 Agent ID 与 Environment ID。";
  }
  if (
    (mode === "retrieve" || mode === "events" || mode === "delete") &&
    !sessionId.trim()
  ) {
    return "请填写要管理的 Session ID。";
  }
  if (mode === "delete" && !deleteConfirmed) {
    return "删除不可逆，请先勾选永久删除确认。";
  }
  return undefined;
}

function sessionBodyNote(mode: SessionMode): string {
  return {
    create: "",
    retrieve: "检索参数已进入 /sessions/{session_id} URL。",
    list: "agent_id 与 limit 已作为查询参数进入 URL。",
    events: "",
    files: "上传采用 multipart/form-data；查询和删除操作不发送上游 Request Body。",
    memory: "列表参数进入 URL；检索与删除操作不发送上游 Request Body。",
    delete: "DELETE 只使用目标 Session URL，不发送 Request Body。",
  }[mode];
}

function sessionFileActionLabel(mode: SessionFileMode): string {
  return {
    upload: "上传文件",
    "add-resource": "挂载到运行中 Session",
    "list-resources": "查询挂载资源",
    "delete-resource": "移除文件资源",
    "list-generated": "查询 Session 生成文件",
  }[mode];
}

function sessionMemoryActionLabel(mode: SessionMemoryMode): string {
  return {
    "create-store": "创建 Memory Store",
    "list-stores": "列出 Memory Store",
    "delete-store": "删除 Memory Store",
    "create-memory": "创建 Memory",
    "list-memories": "列出 Memory",
    "retrieve-memory": "读取 Memory",
    "update-memory": "更新 Memory",
    "delete-memory": "删除 Memory",
  }[mode];
}

function sessionFileApiDetails({
  mode,
  filesUrl,
  sessionResourcesUrl,
  sessionId,
  resourceId,
  uploadFile,
  requestBody,
}: {
  mode: SessionFileMode;
  filesUrl: string;
  sessionResourcesUrl: string;
  sessionId: string;
  resourceId: string;
  uploadFile: File | null;
  requestBody: Extract<SessionResource, { type: "file" }>;
}): {
  method: "POST" | "GET" | "DELETE";
  url: string;
  body?: unknown;
} {
  if (mode === "upload") {
    return {
      method: "POST",
      url: filesUrl,
      body: {
        purpose: "agent",
        file: uploadFile
          ? {
              name: uploadFile.name,
              size: uploadFile.size,
              content_type: uploadFile.type || "application/octet-stream",
            }
          : "{LOCAL_FILE}",
      },
    };
  }
  if (mode === "add-resource") {
    return { method: "POST", url: sessionResourcesUrl, body: requestBody };
  }
  if (mode === "delete-resource") {
    return {
      method: "DELETE",
      url: `${sessionResourcesUrl}/${resourceId || "{RESOURCE_ID}"}`,
    };
  }
  if (mode === "list-generated") {
    const search = new URLSearchParams({
      scope_id: sessionId || "{SESSION_ID}",
    });
    return { method: "GET", url: `${filesUrl}?${search}` };
  }
  return { method: "GET", url: sessionResourcesUrl };
}

function sessionMemoryApiDetails({
  mode,
  memoryStoresUrl,
  memoriesUrl,
  storeId,
  memoryId,
  storeBody,
  memoryBody,
  query,
}: {
  mode: SessionMemoryMode;
  memoryStoresUrl: string;
  memoriesUrl: string;
  storeId: string;
  memoryId: string;
  storeBody: { name: string; description: string };
  memoryBody: { path: string; content: string };
  query: { path_prefix: string; order_by: "path"; depth: number };
}): {
  method: "POST" | "GET" | "DELETE";
  url: string;
  body?: unknown;
} {
  if (mode === "create-store") {
    return { method: "POST", url: memoryStoresUrl, body: storeBody };
  }
  if (mode === "list-stores") {
    return { method: "GET", url: memoryStoresUrl };
  }
  if (mode === "delete-store") {
    return {
      method: "DELETE",
      url: `${memoryStoresUrl}/${storeId || "{MEMORY_STORE_ID}"}`,
    };
  }
  if (mode === "create-memory") {
    return { method: "POST", url: memoriesUrl, body: memoryBody };
  }
  if (mode === "list-memories") {
    const search = new URLSearchParams({
      path_prefix: query.path_prefix,
      order_by: query.order_by,
      depth: String(query.depth),
    });
    return { method: "GET", url: `${memoriesUrl}?${search}` };
  }
  const itemUrl = `${memoriesUrl}/${memoryId || "{MEMORY_ID}"}`;
  if (mode === "retrieve-memory") {
    return { method: "GET", url: itemUrl };
  }
  if (mode === "update-memory") {
    return {
      method: "POST",
      url: itemUrl,
      body: {
        ...(memoryBody.path.trim() ? { path: memoryBody.path } : {}),
        ...(memoryBody.content.trim() ? { content: memoryBody.content } : {}),
      },
    };
  }
  return { method: "DELETE", url: itemUrl };
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} 必须是 JSON 对象。`);
  }
  return value as Record<string, unknown>;
}

function textFromAgentEvent(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const event = value as Record<string, unknown>;
  if (event.type !== "agent.message" || !Array.isArray(event.content)) {
    return "";
  }
  return event.content
    .filter(
      (item): item is { type: string; text: string } =>
        Boolean(item) &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        (item as Record<string, unknown>).type === "text" &&
        typeof (item as Record<string, unknown>).text === "string",
    )
    .map((item) => item.text)
    .join("");
}

function eventType(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "event";
  const type = (value as Record<string, unknown>).type;
  return typeof type === "string" ? type : "event";
}

function readHistory(): ManagedRun[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? (value as ManagedRun[]).slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function writeHistory(history: ManagedRun[]) {
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // The workbench remains usable when browser storage is unavailable.
  }
}

function readCredentials(): { official?: string; "agent-plan"?: string } {
  try {
    const raw = window.localStorage.getItem(CREDENTIAL_STORAGE_KEY);
    if (!raw) return {};
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as { official?: string; "agent-plan"?: string })
      : {};
  } catch {
    return {};
  }
}

function writeCredentials(credentials: {
  official?: string;
  "agent-plan"?: string;
}) {
  try {
    window.localStorage.setItem(
      CREDENTIAL_STORAGE_KEY,
      JSON.stringify(credentials),
    );
  } catch {
    // Credential remembering is optional.
  }
}

function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 10) return "••••••••";
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function statusLabel(status: StepStatus): string {
  return {
    idle: "待执行",
    running: "执行中",
    succeeded: "已完成",
    failed: "失败",
  }[status];
}

function phaseLabel(phase: ManagedLogEntry["phase"]): string {
  return {
    agent: "管理 Agent",
    environment: "配置 Agent 环境",
    session: "管理 Session",
    "session-event": "发送 Session 事件",
    stream: "SSE 事件流",
  }[phase];
}

function formatTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
