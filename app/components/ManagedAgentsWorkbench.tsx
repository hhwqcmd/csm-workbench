"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MANAGED_AGENTS_BASE_URL } from "../lib/managed-agents-server";

type StepKey = "agent" | "environment" | "session" | "message";
type StepStatus = "idle" | "running" | "succeeded" | "failed";

type AgentBody = {
  name: string;
  model: { id: string };
  system: string;
  tools: Array<{ type: "agent_toolset_20260701" }>;
};

type EnvironmentBody = {
  name: string;
  config: {
    type: "cloud";
    networking: { type: "unrestricted" };
  };
};

type SessionBody = {
  agent: string;
  environment_id: string;
  title: string;
};

type MessageBody = {
  events: Array<{
    type: "user.message";
    content: Array<{ type: "text"; text: string }>;
  }>;
};

type ManagedLogEntry = {
  at: string;
  phase: StepKey | "stream";
  request: {
    method: "POST" | "GET";
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

const CREDENTIAL_STORAGE_KEY = "seedance-workbench:demo-credentials:v1";
const HISTORY_STORAGE_KEY = "seedance-workbench:managed-agents-history:v1";
const MAX_HISTORY = 20;

const INITIAL_AGENT_BODY: AgentBody = {
  name: "Quick Start Agent",
  model: { id: "doubao-seed-2-1-pro-260628" },
  system: "你是一个高效的编程助手，擅长代码编写和问题排查。",
  tools: [{ type: "agent_toolset_20260701" }],
};

const INITIAL_ENVIRONMENT_BODY: EnvironmentBody = {
  name: "demo-env",
  config: {
    type: "cloud",
    networking: { type: "unrestricted" },
  },
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

export function ManagedAgentsWorkbench() {
  const [baseUrl, setBaseUrl] = useState(MANAGED_AGENTS_BASE_URL);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [rememberApiKey, setRememberApiKey] = useState(true);
  const [agentBody, setAgentBody] = useState<AgentBody>(INITIAL_AGENT_BODY);
  const [environmentBody, setEnvironmentBody] =
    useState<EnvironmentBody>(INITIAL_ENVIRONMENT_BODY);
  const [sessionBody, setSessionBody] = useState<SessionBody>({
    agent: "",
    environment_id: "",
    title: "Quickstart session",
  });
  const [messageBody, setMessageBody] =
    useState<MessageBody>(INITIAL_MESSAGE_BODY);
  const [agentDraft, setAgentDraft] = useState(
    prettyJson(INITIAL_AGENT_BODY),
  );
  const [environmentDraft, setEnvironmentDraft] = useState(
    prettyJson(INITIAL_ENVIRONMENT_BODY),
  );
  const [sessionDraft, setSessionDraft] = useState(
    prettyJson({
      agent: "",
      environment_id: "",
      title: "Quickstart session",
    }),
  );
  const [messageDraft, setMessageDraft] = useState(
    prettyJson(INITIAL_MESSAGE_BODY),
  );
  const [draftErrors, setDraftErrors] = useState<
    Partial<Record<StepKey, string>>
  >({});
  const [stepStatus, setStepStatus] = useState<
    Record<StepKey, StepStatus>
  >({
    agent: "idle",
    environment: "idle",
    session: "idle",
    message: "idle",
  });
  const [agentId, setAgentId] = useState("");
  const [environmentId, setEnvironmentId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [streamEvents, setStreamEvents] = useState<unknown[]>([]);
  const [activeRunId, setActiveRunId] = useState("");
  const [history, setHistory] = useState<ManagedRun[]>([]);
  const [selectedLogRunId, setSelectedLogRunId] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  const baseUrlMatches =
    baseUrl.replace(/\/$/, "") === MANAGED_AGENTS_BASE_URL;
  const busy = Object.values(stepStatus).includes("running");
  const selectedRun =
    history.find((item) => item.id === selectedLogRunId) ?? null;

  const agentUrl = `${baseUrl.replace(/\/$/, "")}/agents`;
  const environmentUrl = `${baseUrl.replace(/\/$/, "")}/environments`;
  const sessionUrl = `${baseUrl.replace(/\/$/, "")}/sessions`;
  const eventsUrl = `${baseUrl.replace(/\/$/, "")}/sessions/${
    sessionId || "{SESSION_ID}"
  }/events`;

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
          title: "Quickstart session",
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
          message: "idle",
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
    clearDraftError("message");
  }

  function clearDraftError(step: StepKey) {
    setDraftErrors((current) => ({ ...current, [step]: undefined }));
  }

  function editJson(step: StepKey, value: string) {
    if (step === "agent") setAgentDraft(value);
    if (step === "environment") setEnvironmentDraft(value);
    if (step === "session") setSessionDraft(value);
    if (step === "message") setMessageDraft(value);

    try {
      const parsed = JSON.parse(value) as unknown;
      if (step === "agent") setAgentBody(parseAgentBody(parsed));
      if (step === "environment") {
        setEnvironmentBody(parseEnvironmentBody(parsed));
      }
      if (step === "session") setSessionBody(parseSessionBody(parsed));
      if (step === "message") setMessageBody(parseMessageBody(parsed));
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

  async function createAgent() {
    if (!apiReady() || draftErrors.agent) return;
    const runId = startRun();
    setAgentId("");
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
    );
    if (!result?.id) return;
    setAgentId(result.id);
    const nextSession = { ...sessionBody, agent: result.id };
    updateSession(nextSession);
    patchRun(runId, { agentId: result.id });
  }

  function setEnvironmentStatusAfterAgentReset() {
    setStepStatus({
      agent: "idle",
      environment: "idle",
      session: "idle",
      message: "idle",
    });
  }

  async function createEnvironment() {
    if (!apiReady() || !agentId || draftErrors.environment) return;
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

  async function createSession() {
    if (
      !apiReady() ||
      !agentId ||
      !environmentId ||
      draftErrors.session
    ) {
      return;
    }
    const result = await performJsonStep(
      "session",
      "/api/managed-agents/sessions",
      sessionUrl,
      sessionBody,
      activeRunId,
    );
    if (!result?.id) return;
    setSessionId(result.id);
    patchRun(activeRunId, { sessionId: result.id });
  }

  async function performJsonStep(
    step: Exclude<StepKey, "message">,
    localPath: string,
    upstreamUrl: string,
    requestBody: unknown,
    runId: string,
  ): Promise<JsonResponse | null> {
    setStepStatus((current) => ({ ...current, [step]: "running" }));
    const requestLog = buildRequestLog(step, "POST", upstreamUrl, requestBody);
    let responseCaptured = false;
    try {
      const response = await fetch(localPath, {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ baseUrl, apiKey, requestBody }),
      });
      const payload = (await response.json()) as JsonResponse;
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

  async function sendMessage() {
    if (!apiReady() || !sessionId || draftErrors.message) return;
    const runId = activeRunId;
    setStepStatus((current) => ({ ...current, message: "running" }));
    setTranscript("");
    setStreamEvents([]);

    const sendLog = buildRequestLog(
      "message",
      "POST",
      eventsUrl,
      messageBody,
    );
    const streamLog = buildRequestLog(
      "stream",
      "GET",
      `${eventsUrl}/stream`,
    );
    appendLog(runId, sendLog);

    try {
      const response = await fetch("/api/managed-agents/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          baseUrl,
          apiKey,
          sessionId,
          requestBody: messageBody,
        }),
      });
      if (!response.ok || !response.body) {
        const payload = (await response.json()) as JsonResponse;
        throw new Error(payload.error ?? "发送消息或连接事件流失败。");
      }

      const events: unknown[] = [];
      let output = "";
      let buffer = "";
      const reader = response.body.getReader();
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
            httpStatus: response.status,
            body: { events, transcript: output },
          },
        },
        {
          status: "succeeded",
          transcript: output,
          error: undefined,
        },
      );
      setStepStatus((current) => ({ ...current, message: "succeeded" }));
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
      setStepStatus((current) => ({ ...current, message: "failed" }));
    }
  }

  function apiReady() {
    return Boolean(apiKey.trim()) && baseUrlMatches && !busy;
  }

  function buildRequestLog(
    phase: ManagedLogEntry["phase"],
    method: "POST" | "GET",
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
            : { "content-type": "application/json" }),
        },
        body,
      },
    };
  }

  const stepLabels = useMemo(
    () => [
      { key: "agent" as const, label: "创建 Agent", id: agentId },
      {
        key: "environment" as const,
        label: "创建环境",
        id: environmentId,
      },
      { key: "session" as const, label: "开启会话", id: sessionId },
      { key: "message" as const, label: "流式消息", id: "" },
    ],
    [agentId, environmentId, sessionId],
  );

  return (
    <div className="managed-agents-workspace" id="managed-agents">
      <section className="managed-hero">
        <div>
          <p className="eyebrow">VOLCENGINE ARK · MANAGED AGENTS</p>
          <h1>
            四步搭好一个
            <br />
            托管 Agent。
          </h1>
          <p className="managed-hero-summary">
            从定义 Agent 到云端沙箱，再到会话与实时事件流；每一步都可编辑、可审核、可复用，并保留脱敏请求与响应日志。
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#managed-connection">
              开始 Managed Agents 演示
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
            <h2>复用当前项目的标准方舟连接</h2>
          </div>
          <p>
            Managed Agents 使用标准方舟 API Key；与 Seedance
            演示工作台共用当前浏览器中的官方 API 凭证。
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
            <p className="eyebrow">四步实操</p>
            <h2>字段编辑与完整 API 实时联动</h2>
          </div>
          <p>
            左侧填写业务字段，右侧同步生成最终 Method、URL、Headers 与 Request
            Body；也可直接编辑 JSON，格式正确时会反向更新表单。
          </p>
        </div>

        <ManagedStep
          number="01"
          title="创建 Agent"
          description="定义模型、系统提示词和可用工具。模型服务与 Managed Agents 服务需要先在控制台开通。"
          status={stepStatus.agent}
          resultId={agentId}
          actionLabel="创建 Agent"
          actionDisabled={!apiReady() || Boolean(draftErrors.agent)}
          onAction={() => void createAgent()}
          fields={
            <>
              <label>
                <span>Agent 名称</span>
                <input
                  value={agentBody.name}
                  onChange={(event) =>
                    updateAgent({ ...agentBody, name: event.target.value })
                  }
                  disabled={busy}
                />
                <small>用于识别本次演示 Agent，可自定义。</small>
              </label>
              <label>
                <span>模型 ID</span>
                <input
                  value={agentBody.model.id}
                  onChange={(event) =>
                    updateAgent({
                      ...agentBody,
                      model: { id: event.target.value },
                    })
                  }
                  disabled={busy}
                />
                <small>默认使用官方快速入门当前示例模型。</small>
              </label>
              <label className="managed-field-wide">
                <span>系统提示词</span>
                <textarea
                  value={agentBody.system}
                  onChange={(event) =>
                    updateAgent({ ...agentBody, system: event.target.value })
                  }
                  disabled={busy}
                />
                <small>描述 Agent 的角色、能力边界与工作方式。</small>
              </label>
              <label className="managed-field-wide">
                <span>工具集</span>
                <input
                  value={agentBody.tools[0]?.type ?? ""}
                  readOnly
                />
                <small>快速入门工具集允许 Agent 写文件、运行命令和读取结果。</small>
              </label>
            </>
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
        />

        <ManagedStep
          number="02"
          title="创建环境"
          description="环境定义 Agent 运行的云端沙箱。名称在当前 project 内必须唯一，默认自动加入时间后缀。"
          status={stepStatus.environment}
          resultId={environmentId}
          actionLabel="创建环境"
          actionDisabled={
            !apiReady() || !agentId || Boolean(draftErrors.environment)
          }
          onAction={() => void createEnvironment()}
          prerequisite={!agentId ? "先完成第 1 步，取得 Agent ID。" : undefined}
          fields={
            <>
              <label className="managed-field-wide">
                <span>环境名称</span>
                <input
                  value={environmentBody.name}
                  onChange={(event) =>
                    updateEnvironment({
                      ...environmentBody,
                      name: event.target.value,
                    })
                  }
                  disabled={busy}
                />
                <small>同一 project 内不可重名；再次验证时请换一个名称。</small>
              </label>
              <label>
                <span>运行类型</span>
                <input value={environmentBody.config.type} readOnly />
                <small>cloud 表示由火山方舟托管沙箱。</small>
              </label>
              <label>
                <span>网络策略</span>
                <input
                  value={environmentBody.config.networking.type}
                  readOnly
                />
                <small>快速入门使用 unrestricted 网络。</small>
              </label>
            </>
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
        />

        <ManagedStep
          number="03"
          title="开启会话"
          description="把前两步创建的 Agent 与环境绑定到一个会话。成功返回的 Session ID 会自动进入消息 API。"
          status={stepStatus.session}
          resultId={sessionId}
          actionLabel="开启会话"
          actionDisabled={
            !apiReady() ||
            !agentId ||
            !environmentId ||
            Boolean(draftErrors.session)
          }
          onAction={() => void createSession()}
          prerequisite={
            !agentId || !environmentId
              ? "先完成 Agent 与环境创建。"
              : undefined
          }
          fields={
            <>
              <label>
                <span>Agent ID</span>
                <input
                  value={sessionBody.agent}
                  onChange={(event) =>
                    updateSession({
                      ...sessionBody,
                      agent: event.target.value,
                    })
                  }
                  disabled={busy}
                />
                <small>第 1 步成功后自动填写，也可手动替换已有资源。</small>
              </label>
              <label>
                <span>Environment ID</span>
                <input
                  value={sessionBody.environment_id}
                  onChange={(event) =>
                    updateSession({
                      ...sessionBody,
                      environment_id: event.target.value,
                    })
                  }
                  disabled={busy}
                />
                <small>第 2 步成功后自动填写。</small>
              </label>
              <label className="managed-field-wide">
                <span>会话标题</span>
                <input
                  value={sessionBody.title}
                  onChange={(event) =>
                    updateSession({
                      ...sessionBody,
                      title: event.target.value,
                    })
                  }
                  disabled={busy}
                />
                <small>用于在会话列表中识别本次演示。</small>
              </label>
            </>
          }
          apiDetails={
            <ManagedApiEditor
              method="POST"
              url={sessionUrl}
              apiKey={apiKey}
              draft={sessionDraft}
              error={draftErrors.session}
              onChange={(value) => editJson("session", value)}
            />
          }
        />

        <ManagedStep
          number="04"
          title="发送消息并流式传输响应"
          description="先发送 user.message 事件，再连接同一会话的 SSE 事件流；页面会实时拼接 Agent 文本、工具调用与状态事件。"
          status={stepStatus.message}
          actionLabel="发送消息并开启流式响应"
          actionDisabled={
            !apiReady() || !sessionId || Boolean(draftErrors.message)
          }
          onAction={() => void sendMessage()}
          prerequisite={!sessionId ? "先完成第 3 步，取得 Session ID。" : undefined}
          fields={
            <label className="managed-field-wide">
              <span>用户消息</span>
              <textarea
                value={messageBody.events[0]?.content[0]?.text ?? ""}
                onChange={(event) =>
                  updateMessage({
                    events: [
                      {
                        type: "user.message",
                        content: [{ type: "text", text: event.target.value }],
                      },
                    ],
                  })
                }
                disabled={busy}
              />
              <small>
                任务会在托管沙箱中执行；示例要求生成 Python 文件并写出结果文件。
              </small>
            </label>
          }
          apiDetails={
            <ManagedApiEditor
              method="POST"
              url={eventsUrl}
              secondaryUrl={`${eventsUrl}/stream`}
              apiKey={apiKey}
              draft={messageDraft}
              error={draftErrors.message}
              onChange={(value) => editJson("message", value)}
            />
          }
          output={
            <div className="managed-stream-output" aria-live="polite">
              <div className="managed-stream-heading">
                <span>LIVE SSE OUTPUT</span>
                <span>{streamEvents.length} events</span>
              </div>
              {transcript ? (
                <pre>{transcript}</pre>
              ) : (
                <p>
                  {stepStatus.message === "running"
                    ? "已连接事件流，等待 Agent 响应…"
                    : "完成前三步并发送消息后，实时响应会显示在这里。"}
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
          }
        />
      </section>

      <section className="managed-history">
        <div className="managed-section-heading">
          <div>
            <p className="eyebrow">演示记录</p>
            <h2>每轮资源 ID、请求与响应都可追溯</h2>
          </div>
          <p>
            最近 20 轮保存在当前浏览器。Authorization
            仅保留掩码；流式日志记录事件类型、完整响应文本和最终状态。
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
    <article className="managed-step-card" data-status={status}>
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
  apiKey,
  draft,
  error,
  onChange,
}: {
  method: "POST";
  url: string;
  secondaryUrl?: string;
  apiKey: string;
  draft: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="managed-api-editor">
      <div className="managed-api-editor-heading">
        <div>
          <span>完整 API 详情</span>
          <small>表单 ↔ JSON 双向联动</small>
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
            <dt>STREAM GET</dt>
            <dd>{secondaryUrl}</dd>
          </div>
        )}
        <div>
          <dt>Authorization</dt>
          <dd>Bearer {apiKey ? maskApiKey(apiKey) : "••••••••"}</dd>
        </div>
        <div>
          <dt>Content-Type</dt>
          <dd>application/json</dd>
        </div>
      </dl>
      <label>
        <span>Request Body</span>
        <textarea
          aria-label={`${url} Request Body`}
          spellCheck={false}
          value={draft}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {error ? (
        <p className="managed-json-error">{error}</p>
      ) : (
        <p className="managed-json-ok">JSON 有效，已同步到左侧字段。</p>
      )}
    </section>
  );
}

function parseAgentBody(value: unknown): AgentBody {
  const body = asRecord(value, "Agent Request Body");
  const model = asRecord(body.model, "model");
  if (
    typeof body.name !== "string" ||
    typeof model.id !== "string" ||
    typeof body.system !== "string" ||
    !Array.isArray(body.tools)
  ) {
    throw new Error("Agent JSON 需要 name、model.id、system 与 tools。");
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
    networking.type !== "unrestricted"
  ) {
    throw new Error(
      "环境 JSON 需要 name、config.type=cloud 与 networking.type=unrestricted。",
    );
  }
  return body as EnvironmentBody;
}

function parseSessionBody(value: unknown): SessionBody {
  const body = asRecord(value, "Session Request Body");
  if (
    typeof body.agent !== "string" ||
    typeof body.environment_id !== "string" ||
    typeof body.title !== "string"
  ) {
    throw new Error("会话 JSON 需要 agent、environment_id 与 title。");
  }
  return body as SessionBody;
}

function parseMessageBody(value: unknown): MessageBody {
  const body = asRecord(value, "Message Request Body");
  if (!Array.isArray(body.events) || body.events.length !== 1) {
    throw new Error("消息 JSON 需要一条 events 记录。");
  }
  const event = asRecord(body.events[0], "event");
  if (event.type !== "user.message" || !Array.isArray(event.content)) {
    throw new Error("消息事件必须为 user.message 并包含 content。");
  }
  const content = asRecord(event.content[0], "content");
  if (content.type !== "text" || typeof content.text !== "string") {
    throw new Error("消息 content 必须包含 text 文本。");
  }
  return body as MessageBody;
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
    agent: "创建 Agent",
    environment: "创建环境",
    session: "开启会话",
    message: "发送消息",
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
