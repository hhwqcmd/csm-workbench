"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ANTHROPIC_DEFAULT_MODEL,
  ANTHROPIC_MESSAGES_SCENARIOS,
  ANTHROPIC_MESSAGES_URL,
  ANTHROPIC_NATIVE_REFERENCE,
  ANTHROPIC_REQUEST_REFERENCE,
  ANTHROPIC_RESPONSE_REFERENCE,
  ANTHROPIC_SSE_REFERENCE,
  ANTHROPIC_VERSION,
  type AnthropicContentBlock,
  type AnthropicMessage,
  type AnthropicMessagesRequestBody,
  type AnthropicMessagesScenario,
} from "../lib/anthropic-messages-examples";
import {
  consumeAnthropicMessagesStream,
  type AnthropicStreamEvent,
} from "../lib/anthropic-messages-stream";
import { CopyCurlButton } from "./CopyCurlButton";

type RunStatus = "idle" | "running" | "succeeded" | "failed";

type ApiDetail = {
  method: "POST";
  url: string;
  headers: Record<string, string>;
  body: AnthropicMessagesRequestBody;
};

type HistoryRecord = {
  id: string;
  createdAt: string;
  scenarioId: string;
  scenarioTitle: string;
  status: Exclude<RunStatus, "idle">;
  request: ApiDetail;
  response?: {
    httpStatus: number;
    requestId?: string;
    body: unknown;
  };
  error?: string;
};

const HISTORY_STORAGE_KEY = "anthropic-messages-workbench:history:v1";
const CREDENTIAL_STORAGE_KEY = "seedance-workbench:demo-credentials:v1";
const MAX_HISTORY_RECORDS = 30;

export function AnthropicMessagesWorkbench() {
  const [selectedId, setSelectedId] = useState(
    ANTHROPIC_MESSAGES_SCENARIOS[0].id,
  );
  const selectedScenario =
    ANTHROPIC_MESSAGES_SCENARIOS.find(
      (scenario) => scenario.id === selectedId,
    ) ?? ANTHROPIC_MESSAGES_SCENARIOS[0];
  const [requestBody, setRequestBody] =
    useState<AnthropicMessagesRequestBody>(() =>
      cloneBody(ANTHROPIC_MESSAGES_SCENARIOS[0].requestBody),
    );
  const [apiKey, setApiKey] = useState("");
  const [rememberApiKey, setRememberApiKey] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [trace, setTrace] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [apiEditing, setApiEditing] = useState(false);
  const [apiDraft, setApiDraft] = useState(() =>
    JSON.stringify(ANTHROPIC_MESSAGES_SCENARIOS[0].requestBody, null, 2),
  );
  const [apiDraftError, setApiDraftError] = useState("");
  const [costConfirmed, setCostConfirmed] = useState(false);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [error, setError] = useState("");
  const [latestResponse, setLatestResponse] = useState<unknown>();
  const [streamEvents, setStreamEvents] = useState<AnthropicStreamEvent[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [selectedLogId, setSelectedLogId] = useState("");

  const active = status === "running";
  const requestJson = useMemo(
    () => JSON.stringify(requestBody, null, 2),
    [requestBody],
  );
  const apiDetail = useMemo(
    () => buildApiDetail(requestBody, apiKey, trace),
    [apiKey, requestBody, trace],
  );
  const curlApiDetail = useMemo<ApiDetail>(
    () => ({
      ...apiDetail,
      headers: {
        ...apiDetail.headers,
        Authorization: `Bearer ${apiKey.trim() || "<ARK_API_KEY>"}`,
      },
    }),
    [apiDetail, apiKey],
  );
  const requestBlocker = getRequestBlocker(requestBody);
  const executeReady =
    Boolean(apiKey.trim()) && costConfirmed && !active && !requestBlocker;
  const selectedLog =
    history.find((record) => record.id === selectedLogId) ?? null;
  const outputBlocks = getOutputBlocks(latestResponse);
  const toolUseBlocks = outputBlocks.filter(
    (block) => block.type === "tool_use" && typeof block.id === "string",
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setApiKey(readOfficialCredential());
      setHistory(readHistory());
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
    writeOfficialCredential(rememberApiKey ? apiKey : "");
  }, [apiKey, rememberApiKey, storageReady]);

  function selectScenario(scenario: AnthropicMessagesScenario) {
    if (active) return;
    const nextBody = cloneBody(scenario.requestBody);
    setSelectedId(scenario.id);
    setRequestBody(nextBody);
    setApiDraft(JSON.stringify(nextBody, null, 2));
    setApiEditing(false);
    setApiDraftError("");
    setCostConfirmed(false);
    setStatus("idle");
    setError("");
    setLatestResponse(undefined);
    setStreamEvents([]);
    window.history.replaceState(null, "", `#anthropic-${scenario.id}`);
    window.setTimeout(() => {
      document
        .getElementById("anthropic-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function replaceBody(next: AnthropicMessagesRequestBody) {
    setRequestBody(next);
    setCostConfirmed(false);
    setStatus("idle");
    setError("");
  }

  function patchBody(patch: Partial<AnthropicMessagesRequestBody>) {
    replaceBody({ ...requestBody, ...patch });
  }

  function applyApiDraft() {
    try {
      const parsed = JSON.parse(apiDraft) as unknown;
      if (!isRecord(parsed)) {
        throw new Error("Request Body 必须是 JSON 对象。");
      }
      if (
        typeof parsed.model !== "string" ||
        !Number.isInteger(parsed.max_tokens) ||
        !Array.isArray(parsed.messages)
      ) {
        throw new Error(
          "Request Body 至少需要 model、整数 max_tokens 和 messages 数组。",
        );
      }
      replaceBody(parsed as AnthropicMessagesRequestBody);
      setApiEditing(false);
      setApiDraftError("");
    } catch (draftError) {
      setApiDraftError(
        draftError instanceof Error
          ? draftError.message
          : "Request Body 格式不正确。",
      );
    }
  }

  async function execute() {
    if (!executeReady) {
      setError(
        requestBlocker ||
          "请填写 API Key，并确认真实调用会消耗额度且可能产生费用。",
      );
      return;
    }

    const historyId = localId();
    const record: HistoryRecord = {
      id: historyId,
      createdAt: new Date().toISOString(),
      scenarioId: selectedScenario.id,
      scenarioTitle: selectedScenario.title,
      status: "running",
      request: redactApiDetail(apiDetail),
    };
    setHistory((current) => [record, ...current].slice(0, MAX_HISTORY_RECORDS));
    setSelectedLogId(historyId);
    setStatus("running");
    setError("");
    setLatestResponse(undefined);
    setStreamEvents([]);

    try {
      const response = await fetch("/api/anthropic-messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ apiKey, trace, requestBody }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const responseBody = contentType.includes("text/event-stream")
        ? await consumeAnthropicMessagesStream(response, (event) => {
            setStreamEvents((current) => [...current, event]);
          })
        : await readResponseBody(response);

      if (!response.ok) throw new Error(responseError(responseBody));

      setLatestResponse(responseBody);
      setStatus("succeeded");
      updateHistory(historyId, {
        status: "succeeded",
        response: {
          httpStatus: response.status,
          requestId: response.headers.get("x-request-id") ?? undefined,
          body: compactForStorage(responseBody),
        },
      });
    } catch (runError) {
      const message =
        runError instanceof Error
          ? runError.message
          : "Messages API 调用失败（Anthropic 兼容）。";
      setError(message);
      setStatus("failed");
      updateHistory(historyId, { status: "failed", error: message });
    }
  }

  function updateHistory(id: string, patch: Partial<HistoryRecord>) {
    setHistory((current) =>
      current.map((record) =>
        record.id === id ? { ...record, ...patch } : record,
      ),
    );
  }

  function createToolResultRoundTrip() {
    if (!isRecord(latestResponse) || toolUseBlocks.length === 0) return;
    const assistantMessage: AnthropicMessage = {
      role: "assistant",
      content: cloneBody(outputBlocks) as AnthropicMessage["content"],
    };
    const toolResultMessage: AnthropicMessage = {
      role: "user",
      content: toolUseBlocks.map((block) => ({
        type: "tool_result",
        tool_use_id: String(block.id),
        content: JSON.stringify({
          replace_with_real_tool_result: true,
          temperature: "18°C",
          condition: "晴（演示占位）",
        }),
      })),
    };
    const next = {
      ...requestBody,
      stream: false,
      messages: [
        ...(requestBody.messages ?? []),
        assistantMessage,
        toolResultMessage,
      ],
    };
    replaceBody(next);
    setApiDraft(JSON.stringify(next, null, 2));
    setLatestResponse(undefined);
    setStreamEvents([]);
    setSelectedId("tool-result");
    setError("");
    window.setTimeout(() => {
      document
        .getElementById("anthropic-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  return (
    <div
      className="responses-workbench anthropic-workbench"
      id="anthropic-messages"
    >
      <section className="responses-hero anthropic-hero">
        <div className="anthropic-hero-copy">
          <p className="anthropic-kicker">ARK / ANTHROPIC COMPATIBLE</p>
          <h1>Messages API</h1>
          <p className="responses-hero-summary">
            用 Anthropic Messages 协议调用方舟模型。客户端完整传递上下文，保留内容块，
            并在同一入口切换同步响应或 SSE。
          </p>
          <div className="responses-hero-actions">
            <a className="primary-action" href="#anthropic-editor">
              开始编辑
            </a>
            <a className="secondary-action" href="#anthropic-schema">
              查看协议结构
            </a>
          </div>
          <div className="anthropic-hero-trust" aria-label="接口特征">
            <span>
              <strong>无状态</strong>
              客户端回传上下文
            </span>
            <span>
              <strong>固定入口</strong>
              服务端约束版本头
            </span>
          </div>
        </div>
        <aside className="anthropic-contract" aria-label="固定请求契约">
          <header>
            <span>REQUEST CONTRACT</span>
            <small>SERVER FIXED</small>
          </header>
          <div className="anthropic-contract-endpoint">
            <strong>POST</strong>
            <code>/api/compatible/v1/messages</code>
          </div>
          <dl>
            <div>
              <dt>Authorization</dt>
              <dd>Bearer Ark API Key</dd>
            </div>
            <div>
              <dt>anthropic-version</dt>
              <dd>{ANTHROPIC_VERSION}</dd>
            </div>
            <div>
              <dt>Response</dt>
              <dd>JSON or text/event-stream</dd>
            </div>
          </dl>
          <p>
            浏览器只提交 Key、Trace 与 Request Body。Base URL 和版本头由同源代理固定。
          </p>
        </aside>
      </section>

      <section className="responses-capabilities anthropic-capabilities">
        <div className="responses-section-heading">
          <div>
            <h2>选择一个消息模式</h2>
          </div>
          <p>
            八类模板覆盖从基础文本到工具闭环。模板只负责预填，stream 始终是通用开关。
          </p>
        </div>
        <div className="responses-scenario-grid anthropic-scenario-grid">
          {ANTHROPIC_MESSAGES_SCENARIOS.map((scenario) => (
            <button
              aria-pressed={scenario.id === selectedScenario.id}
              className={scenario.id === selectedScenario.id ? "is-active" : ""}
              data-testid={`anthropic-scenario-${scenario.id}`}
              key={scenario.id}
              onClick={() => selectScenario(scenario)}
              type="button"
            >
              <span>{scenario.index}</span>
              <small>{scenario.badge}</small>
              <strong>{scenario.title}</strong>
              <p>{scenario.summary}</p>
              <div>
                {scenario.capabilityTags.slice(0, 3).map((tag) => (
                  <code key={tag}>{tag}</code>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="responses-console anthropic-console" id="anthropic-editor">
        <div className="responses-section-heading responses-console-heading">
          <div>
            <span className="anthropic-context-label">
              当前场景 {selectedScenario.index}
            </span>
            <h2>{selectedScenario.title}</h2>
          </div>
          <p>{selectedScenario.summary}</p>
        </div>

        <div className="responses-connection">
          <label>
            <span>标准方舟 API Key</span>
            <div className="responses-secret-input">
              <input
                autoComplete="off"
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="在本机输入，不写入源码"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
              />
              <button
                onClick={() => setShowApiKey((current) => !current)}
                type="button"
              >
                {showApiKey ? "隐藏" : "显示"}
              </button>
            </div>
          </label>
          <label className="responses-check-row">
            <input
              checked={rememberApiKey}
              onChange={(event) => setRememberApiKey(event.target.checked)}
              type="checkbox"
            />
            <span>
              当前浏览器记住 API Key
              <small>与标准官方 API 模块共用本机凭证槽，不跨设备同步</small>
            </span>
          </label>
          <label className="responses-check-row">
            <input
              checked={trace}
              onChange={(event) => setTrace(event.target.checked)}
              type="checkbox"
            />
            <span>
              开启 X-Fornax-Trace
              <small>用于方舟 Trace 排查；不会改变固定 Anthropic 版本头</small>
            </span>
          </label>
        </div>

        <div className="anthropic-stateless-note">
          <strong>仅创建 Message</strong>
          <p>
            这是无状态 POST 接口，不提供查询、删除或 previous_response_id。多轮内容由客户端在
            messages 中完整回传。
          </p>
        </div>

        <div className="responses-editor-grid">
          <div className="responses-form-panel">
            <div className="responses-guide-card">
              <div>
                <span>{selectedScenario.index}</span>
                <strong>填写说明</strong>
              </div>
              <ul>
                {selectedScenario.guide.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <AnthropicFormFields
              body={requestBody}
              patchBody={patchBody}
              replaceBody={replaceBody}
              scenario={selectedScenario}
            />

            <div className="responses-output-expectation">
              <strong>本场景重点观察的输出</strong>
              <div>
                {selectedScenario.expectedOutput.map((item) => (
                  <code key={item}>{item}</code>
                ))}
              </div>
            </div>
          </div>

          <div className="responses-api-editor">
            <header>
              <div>
                <span>完整 API 详情</span>
                <strong>固定 POST /v1/messages</strong>
              </div>
              <div className="anthropic-api-actions">
                <CopyCurlButton
                  body={curlApiDetail.body}
                  containsApiKey={Boolean(apiKey.trim())}
                  headers={curlApiDetail.headers}
                  method={curlApiDetail.method}
                  url={curlApiDetail.url}
                />
                {!apiEditing && (
                  <button
                    onClick={() => {
                      setApiDraft(requestJson);
                      setApiEditing(true);
                      setApiDraftError("");
                    }}
                    type="button"
                  >
                    编辑 JSON
                  </button>
                )}
              </div>
            </header>
            <ApiSummary detail={apiDetail} />
            <div className="responses-json-block">
              <div>
                <span>Request Body</span>
                <small>
                  {new TextEncoder().encode(requestJson).length} bytes
                </small>
              </div>
              {apiEditing ? (
                <>
                  <textarea
                    aria-label="Anthropic Request Body JSON"
                    onChange={(event) => setApiDraft(event.target.value)}
                    rows={28}
                    spellCheck={false}
                    value={apiDraft}
                  />
                  {apiDraftError && (
                    <p className="responses-error">{apiDraftError}</p>
                  )}
                  <div className="responses-json-actions">
                    <button
                      onClick={() => {
                        setApiEditing(false);
                        setApiDraft(requestJson);
                        setApiDraftError("");
                      }}
                      type="button"
                    >
                      取消
                    </button>
                    <button onClick={applyApiDraft} type="button">
                      应用到表单
                    </button>
                  </div>
                </>
              ) : (
                <pre>{requestJson}</pre>
              )}
            </div>
          </div>
        </div>

        <div className="responses-execute-bar">
          <div>
            <label>
              <input
                checked={costConfirmed}
                onChange={(event) => setCostConfirmed(event.target.checked)}
                type="checkbox"
              />
              <span>
                我确认执行真实 Messages API 调用会消耗模型额度并可能产生费用
              </span>
            </label>
            {requestBlocker && (
              <small className="responses-inline-warning">{requestBlocker}</small>
            )}
          </div>
          <button disabled={!executeReady} onClick={execute} type="button">
            {active ? "正在执行…" : "创建 Message"}
          </button>
        </div>

        {(status !== "idle" || latestResponse !== undefined || error) && (
          <section className="responses-result anthropic-result">
            <header>
              <div>
                <span className="responses-run-status" data-status={status}>
                  {statusLabel(status)}
                </span>
                <strong>最终 Message 与内容块</strong>
              </div>
              {isRecord(latestResponse) && typeof latestResponse.id === "string" && (
                <code>{latestResponse.id}</code>
              )}
            </header>
            {error && <p className="responses-error">{error}</p>}
            {outputBlocks.length > 0 && (
              <div className="anthropic-output-blocks">
                {outputBlocks.map((block, index) => (
                  <article key={`${String(block.type)}-${index}`}>
                    <span>{String(block.type)}</span>
                    {block.type === "text" && <p>{String(block.text ?? "")}</p>}
                    {block.type === "thinking" && (
                      <>
                        <p>{String(block.thinking ?? "")}</p>
                        <code>signature: {maskSignature(block.signature)}</code>
                      </>
                    )}
                    {block.type === "redacted_thinking" && (
                      <code>redacted payload · {String(block.data ?? "").length} chars</code>
                    )}
                    {block.type === "tool_use" && (
                      <pre>{JSON.stringify(block, null, 2)}</pre>
                    )}
                  </article>
                ))}
              </div>
            )}
            {toolUseBlocks.length > 0 && (
              <button
                className="anthropic-tool-result-button"
                onClick={createToolResultRoundTrip}
                type="button"
              >
                生成下一轮 tool_result 模板
              </button>
            )}
            {streamEvents.length > 0 && (
              <div className="anthropic-sse-timeline">
                <header>
                  <strong>SSE 原始事件时间线</strong>
                  <span>{streamEvents.length} 条</span>
                </header>
                <ol>
                  {streamEvents.map((event, index) => (
                    <li key={`${event.type}-${index}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <code>{event.type}</code>
                        <pre>{event.raw}</pre>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {latestResponse !== undefined && (
              <details className="anthropic-final-json" open>
                <summary>重建后的最终 Message JSON</summary>
                <pre>{JSON.stringify(latestResponse, null, 2)}</pre>
              </details>
            )}
          </section>
        )}
      </section>

      <section className="responses-schema anthropic-schema" id="anthropic-schema">
        <div className="responses-section-heading">
          <div>
            <h2>方舟可执行子集与原生参考</h2>
          </div>
          <p>
            可执行区只提交方舟核心兼容结构；未进入代理白名单的 Anthropic 原生扩展不会透传。
          </p>
        </div>
        <div className="anthropic-schema-grid">
          <ReferenceList title="Request" items={ANTHROPIC_REQUEST_REFERENCE} />
          <ReferenceList title="Response" items={ANTHROPIC_RESPONSE_REFERENCE} />
          <div className="responses-variant-list">
            <header>
              <strong>SSE Timeline</strong>
              <span>{ANTHROPIC_SSE_REFERENCE.length} 类</span>
            </header>
            <ol className="anthropic-event-reference">
              {ANTHROPIC_SSE_REFERENCE.map((item) => (
                <li key={item}>
                  <code>{item}</code>
                </li>
              ))}
            </ol>
          </div>
          <div className="responses-variant-list anthropic-native-reference">
            <header>
              <strong>Anthropic 原生扩展</strong>
              <span>只读</span>
            </header>
            <p className="anthropic-unverified">方舟兼容性待验证</p>
            <dl>
              {ANTHROPIC_NATIVE_REFERENCE.map(([name, description]) => (
                <div key={name}>
                  <dt><code>{name}</code></dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="responses-schema-notes">
          <p>
            <strong>固定 Header：</strong>Authorization: Bearer、Content-Type:
            application/json、anthropic-version: {ANTHROPIC_VERSION}。
          </p>
          <p>
            <strong>安全边界：</strong>HTTPS / Base64 素材、工具 ID、thinking budget / signature、
            cache_control、JSON 深度与危险对象键均在服务端校验；同步与 SSE 返回均先脱敏。
          </p>
        </div>
      </section>

      <section className="responses-history anthropic-history">
        <div className="responses-section-heading">
          <div>
            <h2>历史与脱敏日志</h2>
          </div>
          <p>
            独立保存最近 30 次 Messages 调用；不保存明文 Key，Base64 内容写入前压缩。
          </p>
        </div>
        {history.length === 0 ? (
          <p className="responses-empty">暂无 Messages API 演示记录。</p>
        ) : (
          <div className="responses-history-layout">
            <ol className="responses-history-list">
              {history.map((record) => (
                <li key={record.id}>
                  <button
                    className={selectedLogId === record.id ? "is-active" : ""}
                    onClick={() => setSelectedLogId(record.id)}
                    type="button"
                  >
                    <span className="responses-run-status" data-status={record.status}>
                      {statusLabel(record.status)}
                    </span>
                    <strong>{record.scenarioTitle}</strong>
                    <small>{formatTime(record.createdAt)}</small>
                    {record.response?.requestId && <code>{record.response.requestId}</code>}
                  </button>
                </li>
              ))}
            </ol>
            <div className="responses-log-viewer">
              {selectedLog ? (
                <>
                  <div>
                    <strong>Request</strong>
                    <pre>{JSON.stringify(selectedLog.request, null, 2)}</pre>
                  </div>
                  <div>
                    <strong>Response</strong>
                    <pre>
                      {JSON.stringify(
                        selectedLog.response ?? {
                          error: selectedLog.error ?? "等待响应",
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </>
              ) : (
                <p>选择左侧记录查看请求与响应。</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function AnthropicFormFields({
  body,
  patchBody,
  replaceBody,
  scenario,
}: {
  body: AnthropicMessagesRequestBody;
  patchBody: (patch: Partial<AnthropicMessagesRequestBody>) => void;
  replaceBody: (body: AnthropicMessagesRequestBody) => void;
  scenario: AnthropicMessagesScenario;
}) {
  const thinkingType = body.thinking?.type ?? "off";
  const media = findMediaBlock(body);
  const source = isRecord(media?.source) ? media.source : {};
  const systemText = getSystemText(body.system);

  return (
    <>
      <div className="responses-field-group">
        <header>
          <strong>通用参数</strong>
          <small>表单修改会同步到完整 JSON</small>
        </header>
        <div className="responses-fields">
          <label className="responses-field-wide">
            <span>model</span>
            <input
              onChange={(event) => patchBody({ model: event.target.value })}
              value={body.model ?? ANTHROPIC_DEFAULT_MODEL}
            />
            <small>可填写已开通的方舟模型或 Endpoint ID。</small>
          </label>
          <label>
            <span>max_tokens</span>
            <input
              min="1"
              onChange={(event) =>
                patchBody({ max_tokens: numberOrUndefined(event.target.value) })
              }
              type="number"
              value={body.max_tokens ?? ""}
            />
          </label>
          <label className="responses-check-row">
            <input
              checked={body.stream ?? false}
              onChange={(event) => patchBody({ stream: event.target.checked })}
              type="checkbox"
            />
            <span>
              stream
              <small>完整记录并聚合 Anthropic SSE</small>
            </span>
          </label>
          <label className="responses-field-wide">
            <span>system · 顶层系统提示</span>
            <textarea
              onChange={(event) =>
                replaceBody(setSystemText(body, event.target.value))
              }
              placeholder="system 不应放进 messages role"
              rows={3}
              value={systemText}
            />
          </label>
          <label className="responses-field-wide">
            <span>messages · 最近一条 user 文本</span>
            <textarea
              onChange={(event) =>
                replaceBody(setLastRoleText(body, "user", event.target.value))
              }
              rows={4}
              value={getLastRoleText(body, "user")}
            />
          </label>
          {scenario.id === "assistant-prefill" && (
            <label className="responses-field-wide">
              <span>assistant prefill</span>
              <textarea
                onChange={(event) =>
                  replaceBody(
                    setLastRoleText(body, "assistant", event.target.value),
                  )
                }
                rows={3}
                value={getLastRoleText(body, "assistant")}
              />
            </label>
          )}
          <label>
            <span>thinking.type</span>
            <select
              onChange={(event) => {
                const type = event.target.value;
                if (type === "off") {
                  const next = { ...body };
                  delete next.thinking;
                  replaceBody(next);
                } else if (type === "enabled") {
                  replaceBody({
                    ...body,
                    max_tokens: Math.max(body.max_tokens ?? 4096, 2049),
                    thinking: { type: "enabled", budget_tokens: 2048 },
                  });
                } else {
                  patchBody({ thinking: { type: type as "adaptive" | "disabled" } });
                }
              }}
              value={thinkingType}
            >
              <option value="off">未传入</option>
              <option value="disabled">disabled</option>
              <option value="enabled">enabled</option>
              <option value="adaptive">adaptive · 能力待模型确认</option>
            </select>
          </label>
          {body.thinking?.type === "enabled" && (
            <label>
              <span>thinking.budget_tokens</span>
              <input
                min="1024"
                onChange={(event) =>
                  patchBody({
                    thinking: {
                      type: "enabled",
                      budget_tokens: Number(event.target.value),
                    },
                  })
                }
                type="number"
                value={body.thinking.budget_tokens}
              />
            </label>
          )}
          <label>
            <span>temperature · {body.temperature ?? "未传入"}</span>
            <input
              max="1"
              min="0"
              onChange={(event) =>
                patchBody({ temperature: Number(event.target.value) })
              }
              step="0.05"
              type="range"
              value={body.temperature ?? 1}
            />
          </label>
        </div>
      </div>

      {scenario.id === "multimodal" && media && (
        <div className="responses-field-group">
          <header>
            <strong>多模态素材</strong>
            <small>仅 HTTPS 或 Base64</small>
          </header>
          <div className="responses-fields">
            <label>
              <span>content block type</span>
              <select
                onChange={(event) =>
                  replaceBody(
                    setMediaBlock(body, {
                      type: event.target.value,
                      source:
                        event.target.value === "image"
                          ? { type: "url", url: "" }
                          : { type: "url", url: "" },
                    }),
                  )
                }
                value={String(media.type)}
              >
                <option value="image">image</option>
                <option value="document">document / PDF</option>
              </select>
            </label>
            <label>
              <span>source.type</span>
              <select
                onChange={(event) => {
                  const mode = event.target.value;
                  replaceBody(
                    setMediaBlock(body, {
                      ...media,
                      source:
                        mode === "base64"
                          ? {
                              type: "base64",
                              media_type:
                                media.type === "image"
                                  ? "image/png"
                                  : "application/pdf",
                              data: "",
                            }
                          : { type: "url", url: "" },
                    }),
                  );
                }}
                value={String(source.type ?? "url")}
              >
                <option value="url">公网 HTTPS URL</option>
                <option value="base64">Base64</option>
              </select>
            </label>
            {source.type === "base64" ? (
              <>
                <label>
                  <span>source.media_type</span>
                  <input
                    onChange={(event) =>
                      replaceBody(
                        setMediaBlock(body, {
                          ...media,
                          source: { ...source, media_type: event.target.value },
                        }),
                      )
                    }
                    value={String(source.media_type ?? "")}
                  />
                </label>
                <label className="responses-field-wide">
                  <span>source.data · 不含 data URL 前缀</span>
                  <textarea
                    onChange={(event) =>
                      replaceBody(
                        setMediaBlock(body, {
                          ...media,
                          source: { ...source, data: event.target.value },
                        }),
                      )
                    }
                    rows={4}
                    value={String(source.data ?? "")}
                  />
                </label>
              </>
            ) : (
              <label className="responses-field-wide">
                <span>source.url</span>
                <input
                  onChange={(event) =>
                    replaceBody(
                      setMediaBlock(body, {
                        ...media,
                        source: { type: "url", url: event.target.value },
                      }),
                    )
                  }
                  placeholder="https://..."
                  value={String(source.url ?? "")}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {(scenario.id === "tool-use" || scenario.id === "tool-result") && (
        <ToolForm body={body} replaceBody={replaceBody} />
      )}

      {scenario.id === "prompt-cache" && (
        <div className="responses-field-group">
          <header>
            <strong>Prompt Caching</strong>
            <small>ephemeral</small>
          </header>
          <div className="responses-fields">
            <label>
              <span>cache_control.ttl</span>
              <select
                onChange={(event) =>
                  replaceBody(setSystemCacheTtl(body, event.target.value as "5m" | "1h"))
                }
                value={getSystemCacheTtl(body)}
              >
                <option value="5m">5m</option>
                <option value="1h">1h</option>
              </select>
            </label>
            <p className="anthropic-field-note">
              是否命中缓存及具体用量，以当前模型返回的 usage 为准。
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function ToolForm({
  body,
  replaceBody,
}: {
  body: AnthropicMessagesRequestBody;
  replaceBody: (body: AnthropicMessagesRequestBody) => void;
}) {
  const tool = body.tools?.[0] ?? {};
  return (
    <div className="responses-field-group">
      <header>
        <strong>客户端工具</strong>
        <small>只生成参数，不执行函数</small>
      </header>
      <div className="responses-fields">
        <label>
          <span>tools[0].name</span>
          <input
            onChange={(event) =>
              replaceBody({
                ...body,
                tools: [{ ...tool, name: event.target.value }],
              })
            }
            value={String(tool.name ?? "")}
          />
        </label>
        <label>
          <span>tool_choice.type</span>
          <select
            onChange={(event) =>
              replaceBody({
                ...body,
                tool_choice: { type: event.target.value },
              })
            }
            value={String(body.tool_choice?.type ?? "auto")}
          >
            <option value="auto">auto</option>
            <option value="any">any</option>
            <option value="none">none</option>
          </select>
        </label>
        <label className="responses-field-wide">
          <span>tools[0].description</span>
          <input
            onChange={(event) =>
              replaceBody({
                ...body,
                tools: [{ ...tool, description: event.target.value }],
              })
            }
            value={String(tool.description ?? "")}
          />
        </label>
        <label className="responses-field-wide">
          <span>tools[0].input_schema · 失焦时应用合法 JSON</span>
          <textarea
            defaultValue={JSON.stringify(tool.input_schema ?? {}, null, 2)}
            key={JSON.stringify(tool.input_schema ?? {})}
            onBlur={(event) => {
              try {
                const schema = JSON.parse(event.target.value) as unknown;
                if (isRecord(schema)) {
                  replaceBody({
                    ...body,
                    tools: [{ ...tool, input_schema: schema }],
                  });
                }
              } catch {
                // Full JSON editor reports syntax errors; keep the last valid schema here.
              }
            }}
            rows={8}
          />
        </label>
      </div>
    </div>
  );
}

function ApiSummary({ detail }: { detail: ApiDetail }) {
  return (
    <div className="responses-api-summary anthropic-api-summary">
      <div>
        <span>Method</span>
        <code>{detail.method}</code>
      </div>
      <div>
        <span>URL · 服务端固定</span>
        <code>{detail.url}</code>
      </div>
      <div>
        <span>Headers · 显示值已掩码</span>
        <pre>{JSON.stringify(detail.headers, null, 2)}</pre>
      </div>
    </div>
  );
}

function ReferenceList({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <div className="responses-variant-list">
      <header>
        <strong>{title}</strong>
        <span>{items.length} 项</span>
      </header>
      <dl>
        {items.map(([name, description]) => (
          <div key={name}>
            <dt><code>{name}</code></dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function buildApiDetail(
  requestBody: AnthropicMessagesRequestBody,
  apiKey: string,
  trace: boolean,
): ApiDetail {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${maskApiKey(apiKey)}`,
    "Content-Type": "application/json",
    "anthropic-version": ANTHROPIC_VERSION,
  };
  if (trace) headers["X-Fornax-Trace"] = "true";
  return {
    method: "POST",
    url: ANTHROPIC_MESSAGES_URL,
    headers,
    body: requestBody,
  };
}

function redactApiDetail(detail: ApiDetail): ApiDetail {
  return {
    ...detail,
    headers: {
      ...detail.headers,
      Authorization: "Bearer ••••••••",
    },
    body: compactForStorage(redactSensitive(detail.body)) as AnthropicMessagesRequestBody,
  };
}

function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      /authorization|api[_-]?key|access[_-]?token|secret|password|headers/i.test(key)
        ? "[REDACTED]"
        : redactSensitive(nested),
    ]),
  );
}

function getOutputBlocks(value: unknown): Record<string, unknown>[] {
  if (!isRecord(value) || !Array.isArray(value.content)) return [];
  return value.content.filter(isRecord);
}

function getSystemText(value: AnthropicMessagesRequestBody["system"]) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value
    .filter(isRecord)
    .map((block) => (typeof block.text === "string" ? block.text : ""))
    .filter(Boolean)
    .join("\n");
}

function setSystemText(
  body: AnthropicMessagesRequestBody,
  text: string,
): AnthropicMessagesRequestBody {
  if (Array.isArray(body.system)) {
    const blocks = cloneBody(body.system);
    const first = blocks.find(isRecord);
    if (first) first.text = text;
    else blocks.push({ type: "text", text });
    return { ...body, system: blocks };
  }
  if (!text) {
    const next = { ...body };
    delete next.system;
    return next;
  }
  return { ...body, system: text };
}

function getLastRoleText(
  body: AnthropicMessagesRequestBody,
  role: "user" | "assistant",
) {
  const messages = body.messages ?? [];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== role) continue;
    if (typeof message.content === "string") return message.content;
    if (Array.isArray(message.content)) {
      const text = message.content.find(
        (block) => isRecord(block) && block.type === "text",
      );
      if (isRecord(text) && typeof text.text === "string") return text.text;
    }
  }
  return "";
}

function setLastRoleText(
  body: AnthropicMessagesRequestBody,
  role: "user" | "assistant",
  text: string,
): AnthropicMessagesRequestBody {
  const messages = cloneBody(body.messages ?? []);
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== role) continue;
    if (typeof message.content === "string") message.content = text;
    else {
      const textBlock = message.content.find(
        (block) => isRecord(block) && block.type === "text",
      );
      if (isRecord(textBlock)) textBlock.text = text;
      else message.content.push({ type: "text", text });
    }
    return { ...body, messages };
  }
  messages.push({ role, content: text });
  return { ...body, messages };
}

function findMediaBlock(body: AnthropicMessagesRequestBody) {
  for (const message of body.messages ?? []) {
    if (!Array.isArray(message.content)) continue;
    const block = message.content.find(
      (item) => item.type === "image" || item.type === "document",
    );
    if (block) return block;
  }
  return undefined;
}

function setMediaBlock(
  body: AnthropicMessagesRequestBody,
  nextBlock: Record<string, unknown>,
): AnthropicMessagesRequestBody {
  const messages = cloneBody(body.messages ?? []);
  const typedBlock = nextBlock as AnthropicContentBlock;
  for (const message of messages) {
    if (!Array.isArray(message.content)) continue;
    const index = message.content.findIndex(
      (item) => item.type === "image" || item.type === "document",
    );
    if (index >= 0) {
      message.content[index] = typedBlock;
      return { ...body, messages };
    }
  }
  const user = messages.find((message) => message.role === "user");
  if (user) {
    user.content = [
      typedBlock,
      { type: "text", text: typeof user.content === "string" ? user.content : "" },
    ];
  } else {
    messages.push({ role: "user", content: [typedBlock] });
  }
  return { ...body, messages };
}

function getSystemCacheTtl(body: AnthropicMessagesRequestBody): "5m" | "1h" {
  if (!Array.isArray(body.system)) return "5m";
  const first = body.system.find(isRecord);
  if (!first || !isRecord(first.cache_control)) return "5m";
  return first.cache_control.ttl === "1h" ? "1h" : "5m";
}

function setSystemCacheTtl(
  body: AnthropicMessagesRequestBody,
  ttl: "5m" | "1h",
): AnthropicMessagesRequestBody {
  const text = getSystemText(body.system) || "稳定的系统提示内容";
  return {
    ...body,
    system: [{ type: "text", text, cache_control: { type: "ephemeral", ttl } }],
  };
}

function getRequestBlocker(body: AnthropicMessagesRequestBody) {
  if (!body.model?.trim()) return "请填写 model。";
  if (!Number.isInteger(body.max_tokens) || Number(body.max_tokens) < 1) {
    return "max_tokens 必须是正整数。";
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return "messages 至少需要一条消息。";
  }
  if (
    body.thinking?.type === "enabled" &&
    (body.thinking.budget_tokens < 1024 ||
      body.thinking.budget_tokens >= Number(body.max_tokens))
  ) {
    return "thinking.budget_tokens 至少为 1024，且必须小于 max_tokens。";
  }
  const media = findMediaBlock(body);
  if (media && isRecord(media.source)) {
    if (
      media.source.type === "url" &&
      (typeof media.source.url !== "string" ||
        !media.source.url.trim() ||
        media.source.url.includes("example.com"))
    ) {
      return "请把多模态示例地址替换为真实的公网 HTTPS 素材 URL。";
    }
    if (
      media.source.type === "base64" &&
      (typeof media.source.data !== "string" || !media.source.data.trim())
    ) {
      return "请填写不含 data URL 前缀的 Base64 内容。";
    }
  }
  return "";
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function responseError(value: unknown) {
  if (isRecord(value)) {
    if (typeof value.error === "string") return value.error;
    if (isRecord(value.error) && typeof value.error.message === "string") {
      return value.error.message;
    }
  }
  return "Messages API 返回失败状态，请查看脱敏响应日志。";
}

function maskApiKey(apiKey: string) {
  if (!apiKey || apiKey.length < 9) return "••••••••";
  return `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}`;
}

function maskSignature(value: unknown) {
  if (typeof value !== "string" || !value) return "未返回";
  if (value.length < 13) return "••••••••";
  return `${value.slice(0, 6)}••••${value.slice(-6)}`;
}

function compactForStorage(value: unknown, parentKey = ""): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => compactForStorage(item, parentKey));
  }
  if (!isRecord(value)) {
    if (
      typeof value === "string" &&
      ((parentKey === "data" && value.length > 240) ||
        (value.startsWith("data:") && value.length > 240))
    ) {
      return `[BASE64 ${value.length} chars omitted]`;
    }
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      compactForStorage(nested, key),
    ]),
  );
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
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    if (apiKey.trim()) parsed.official = apiKey;
    else delete parsed.official;
    window.localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Browser storage is optional; the in-memory credential remains usable.
  }
}

function readHistory(): HistoryRecord[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
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
    // Keep the active result if browser storage quota is unavailable.
  }
}

function localId() {
  return `anthropic-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function numberOrUndefined(value: string) {
  return value === "" ? undefined : Number(value);
}

function cloneBody<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function statusLabel(status: RunStatus) {
  if (status === "running") return "进行中";
  if (status === "succeeded") return "成功";
  if (status === "failed") return "失败";
  return "待执行";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
