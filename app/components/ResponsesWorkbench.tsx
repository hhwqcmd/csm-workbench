"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RESPONSE_CONTENT_VARIANTS,
  RESPONSE_INPUT_VARIANTS,
  RESPONSE_OUTPUT_FIELDS,
  RESPONSE_OUTPUT_VARIANTS,
  RESPONSE_REQUEST_FIELDS,
  RESPONSE_TOOL_VARIANTS,
  RESPONSES_BASE_URL,
  RESPONSES_SCENARIOS,
  type ResponsesRequestBody,
  type ResponsesScenario,
} from "../lib/responses-examples";
import { CopyCurlButton } from "./CopyCurlButton";

type ResponsesAction =
  | "create"
  | "retrieve"
  | "list-input-items"
  | "delete";

type RunStatus = "idle" | "running" | "succeeded" | "failed";

type ApiDetail = {
  method: "POST" | "GET" | "DELETE";
  url: string;
  headers: Record<string, string>;
  body?: unknown;
};

type HistoryRecord = {
  id: string;
  createdAt: string;
  scenarioId: string;
  scenarioTitle: string;
  action: ResponsesAction;
  status: Exclude<RunStatus, "idle">;
  responseId?: string;
  request: ApiDetail;
  response?: {
    httpStatus: number;
    body: unknown;
  };
  error?: string;
};

type MultimodalType =
  | "input_image"
  | "input_video"
  | "input_file"
  | "input_audio";

const HISTORY_STORAGE_KEY = "responses-workbench:history:v1";
const CREDENTIAL_STORAGE_KEY = "seedance-workbench:demo-credentials:v1";
const MAX_HISTORY_RECORDS = 30;

const ACTIONS: Array<{
  id: ResponsesAction;
  label: string;
  hint: string;
}> = [
  { id: "create", label: "创建 Response", hint: "POST /responses" },
  { id: "retrieve", label: "查询详情", hint: "GET /responses/{id}" },
  {
    id: "list-input-items",
    label: "列出输入项",
    hint: "GET /responses/{id}/input_items",
  },
  { id: "delete", label: "删除 Response", hint: "DELETE /responses/{id}" },
];

export function ResponsesWorkbench() {
  const [selectedId, setSelectedId] = useState(RESPONSES_SCENARIOS[0].id);
  const selectedScenario =
    RESPONSES_SCENARIOS.find((scenario) => scenario.id === selectedId) ??
    RESPONSES_SCENARIOS[0];
  const [requestBody, setRequestBody] = useState<ResponsesRequestBody>(() =>
    cloneBody(RESPONSES_SCENARIOS[0].requestBody),
  );
  const [action, setAction] = useState<ResponsesAction>("create");
  const [responseId, setResponseId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [rememberApiKey, setRememberApiKey] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [trace, setTrace] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [apiEditing, setApiEditing] = useState(false);
  const [apiDraft, setApiDraft] = useState(() =>
    JSON.stringify(RESPONSES_SCENARIOS[0].requestBody, null, 2),
  );
  const [apiDraftError, setApiDraftError] = useState("");
  const [costConfirmed, setCostConfirmed] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [error, setError] = useState("");
  const [latestResponse, setLatestResponse] = useState<unknown>();
  const [streamEvents, setStreamEvents] = useState<unknown[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [selectedLogId, setSelectedLogId] = useState("");
  const [catalogTab, setCatalogTab] = useState<
    "request" | "response" | "unions"
  >("request");

  const active = status === "running";
  const requestJson = useMemo(
    () => JSON.stringify(requestBody, null, 2),
    [requestBody],
  );
  const selectedLog =
    history.find((record) => record.id === selectedLogId) ?? null;
  const apiDetail = useMemo(
    () =>
      buildApiDetail(
        action,
        responseId,
        requestBody,
        apiKey,
        trace,
      ),
    [action, apiKey, requestBody, responseId, trace],
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
    Boolean(apiKey.trim()) &&
    !active &&
    (action === "create"
      ? costConfirmed && !requestBlocker
      : Boolean(responseId.trim()) &&
        (action !== "delete" || deleteConfirmed));

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

  function selectScenario(scenario: ResponsesScenario) {
    if (active) return;
    setSelectedId(scenario.id);
    setRequestBody(cloneBody(scenario.requestBody));
    setAction("create");
    setApiEditing(false);
    setApiDraft(JSON.stringify(scenario.requestBody, null, 2));
    setApiDraftError("");
    setCostConfirmed(false);
    setDeleteConfirmed(false);
    setStatus("idle");
    setError("");
    setLatestResponse(undefined);
    setStreamEvents([]);
    window.history.replaceState(null, "", `#responses-${scenario.id}`);
    window.setTimeout(() => {
      document
        .getElementById("responses-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function selectAction(next: ResponsesAction) {
    if (active) return;
    setAction(next);
    setDeleteConfirmed(false);
    setStatus("idle");
    setError("");
    setLatestResponse(undefined);
    setStreamEvents([]);
  }

  function patchBody(patch: Partial<ResponsesRequestBody>) {
    setRequestBody((current) => ({ ...current, ...patch }));
    setCostConfirmed(false);
    setStatus("idle");
    setError("");
  }

  function replaceBody(next: ResponsesRequestBody) {
    setRequestBody(next);
    setCostConfirmed(false);
    setStatus("idle");
    setError("");
  }

  function applyApiDraft() {
    try {
      const parsed = JSON.parse(apiDraft) as unknown;
      if (!isRecord(parsed)) {
        throw new Error("Request Body 必须是 JSON 对象。");
      }
      if (typeof parsed.model !== "string" || parsed.input === undefined) {
        throw new Error("Request Body 至少需要 model 和 input。");
      }
      replaceBody(parsed as ResponsesRequestBody);
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
        action === "create"
          ? "请填写 API Key、补齐场景输入并确认真实调用会产生费用。"
          : "请填写 API Key 和真实 Response ID，并完成必要确认。",
      );
      return;
    }

    const historyId = localId(action);
    const record: HistoryRecord = {
      id: historyId,
      createdAt: new Date().toISOString(),
      scenarioId: selectedScenario.id,
      scenarioTitle: selectedScenario.title,
      action,
      status: "running",
      responseId: responseId || undefined,
      request: redactApiDetail(apiDetail),
    };
    setHistory((current) => [record, ...current].slice(0, MAX_HISTORY_RECORDS));
    setSelectedLogId(historyId);
    setStatus("running");
    setError("");
    setLatestResponse(undefined);
    setStreamEvents([]);

    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          action,
          apiKey,
          trace,
          ...(action === "create"
            ? { requestBody }
            : { responseId: responseId.trim() }),
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      let responseBody: unknown;
      if (contentType.includes("text/event-stream")) {
        responseBody = await consumeResponsesStream(response, (event) => {
          setStreamEvents((current) => [...current, event].slice(-120));
        });
      } else {
        responseBody = await readResponseBody(response);
      }

      if (!response.ok) {
        const message = responseError(responseBody);
        throw new Error(message);
      }

      const capturedId = extractResponseId(responseBody);
      if (capturedId) setResponseId(capturedId);
      setLatestResponse(responseBody);
      setStatus("succeeded");
      updateHistory(historyId, {
        status: "succeeded",
        responseId: capturedId || responseId || undefined,
        response: {
          httpStatus: response.status,
          body: compactForStorage(responseBody),
        },
      });
    } catch (runError) {
      const message =
        runError instanceof Error
          ? runError.message
          : "Responses API 调用失败。";
      setError(message);
      setStatus("failed");
      updateHistory(historyId, {
        status: "failed",
        error: message,
      });
    }
  }

  function updateHistory(id: string, patch: Partial<HistoryRecord>) {
    setHistory((current) =>
      current.map((record) =>
        record.id === id ? { ...record, ...patch } : record,
      ),
    );
  }

  return (
    <div className="responses-workbench" id="responses">
      <section className="responses-hero">
        <div>
          <p className="eyebrow">VOLCENGINE RESPONSES API STUDIO</p>
          <h1>
            <span>Responses API</span>
            <span>输入 · 工具</span>
            <span>上下文</span>
          </h1>
          <p className="responses-hero-summary">
            文本 · 推理 · 多模态 · 工具 · 结构化输出 · 缓存
          </p>
          <div className="responses-hero-actions">
            <a className="primary-action" href="#responses-capabilities">
              选择场景
            </a>
            <a className="secondary-action" href="#responses-schema">
              查看参数结构
            </a>
          </div>
        </div>
        <aside className="responses-hero-panel">
          <div className="responses-signal">
            <span>REQUEST</span>
            <strong>20</strong>
            <small>Body 顶层字段</small>
          </div>
          <div className="responses-signal">
            <span>OUTPUT</span>
            <strong>12</strong>
            <small>OutputItem 联合类型</small>
          </div>
          <div className="responses-signal">
            <span>TOOLS</span>
            <strong>06</strong>
            <small>工具配置结构</small>
          </div>
          <p>
            <strong>同源代理</strong>
            Key 不进入 URL、存储或日志。
          </p>
        </aside>
      </section>

      <section className="responses-capabilities" id="responses-capabilities">
        <div className="responses-section-heading">
          <div>
            <p className="eyebrow">场景导航</p>
            <h2>能力场景</h2>
          </div>
          <p>
            场景切换仅预填；Request Body 可继续编辑。
          </p>
        </div>
        <div className="responses-scenario-grid">
          {RESPONSES_SCENARIOS.map((scenario) => (
            <button
              className={
                scenario.id === selectedScenario.id ? "is-active" : ""
              }
              data-testid={`responses-scenario-${scenario.id}`}
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

      <section className="responses-console" id="responses-editor">
        <div className="responses-section-heading responses-console-heading">
          <div>
            <p className="eyebrow">编辑与执行</p>
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
              <small>与标准官方 API 模块共用本机凭证，不跨设备同步</small>
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
              <small>上报请求数据到方舟分析统计，用于 Trace 排查</small>
            </span>
          </label>
        </div>

        <div className="responses-action-switch" aria-label="Responses API 操作">
          {ACTIONS.map((item) => (
            <button
              aria-pressed={action === item.id}
              className={action === item.id ? "is-active" : ""}
              key={item.id}
              onClick={() => selectAction(item.id)}
              type="button"
            >
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
            </button>
          ))}
        </div>

        {action !== "create" && (
          <div className="responses-lifecycle-fields">
            <label>
              <span>Response ID</span>
              <input
                onChange={(event) => setResponseId(event.target.value)}
                placeholder="resp_..."
                value={responseId}
              />
              <small>只接受真实返回、以 resp_ 开头的资源 ID。</small>
            </label>
            <div className="responses-lifecycle-note">
              <strong>
                {action === "delete" ? "永久删除" : "只读管理操作"}
              </strong>
              <p>
                {action === "delete"
                  ? "删除后该响应不能再用于 previous_response_id；后续缓存可能重新计算。"
                  : "查询详情与列出输入项不发送上游 Request Body，API Key 仍通过同源 POST 临时传递。"}
              </p>
            </div>
          </div>
        )}

        {action === "create" && (
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

              <CommonResponseFields
                body={requestBody}
                patchBody={patchBody}
              />
              <ScenarioFields
                body={requestBody}
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

            <ApiEditor
              apiDetail={apiDetail}
              apiDraft={apiDraft}
              apiDraftError={apiDraftError}
              apiEditing={apiEditing}
              applyApiDraft={applyApiDraft}
              cancel={() => {
                setApiEditing(false);
                setApiDraft(requestJson);
                setApiDraftError("");
              }}
              curlApiDetail={curlApiDetail}
              hasApiKey={Boolean(apiKey.trim())}
              edit={() => {
                setApiDraft(requestJson);
                setApiEditing(true);
                setApiDraftError("");
              }}
              requestJson={requestJson}
              setApiDraft={setApiDraft}
            />
          </div>
        )}

        {action !== "create" && (
          <div className="responses-lifecycle-api">
            <header className="responses-lifecycle-api-heading">
              <div>
                <span>完整 API 详情</span>
                <strong>当前生命周期操作</strong>
              </div>
              <CopyCurlButton
                body={curlApiDetail.body}
                containsApiKey={Boolean(apiKey.trim())}
                headers={curlApiDetail.headers}
                method={curlApiDetail.method}
                url={curlApiDetail.url}
              />
            </header>
            <ApiSummary detail={apiDetail} />
          </div>
        )}

        <div className="responses-execute-bar">
          <div>
            {action === "create" ? (
              <label>
                <input
                  checked={costConfirmed}
                  onChange={(event) =>
                    setCostConfirmed(event.target.checked)
                  }
                  type="checkbox"
                />
                <span>
                  我确认执行真实 Responses API
                  调用会消耗模型或工具额度并可能产生费用
                </span>
              </label>
            ) : action === "delete" ? (
              <label className="responses-danger-confirm">
                <input
                  checked={deleteConfirmed}
                  onChange={(event) =>
                    setDeleteConfirmed(event.target.checked)
                  }
                  type="checkbox"
                />
                <span>我确认永久删除该 Response，操作不可撤销</span>
              </label>
            ) : (
              <p>该操作为只读查询，不会创建新的模型响应。</p>
            )}
            {requestBlocker && (
              <small className="responses-inline-warning">
                {requestBlocker}
              </small>
            )}
          </div>
          <button
            className={action === "delete" ? "is-danger" : ""}
            disabled={!executeReady}
            onClick={execute}
            type="button"
          >
            {active
              ? "正在执行…"
              : action === "create"
                ? "执行真实 Response"
                : ACTIONS.find((item) => item.id === action)?.label}
          </button>
        </div>

        {(status !== "idle" || latestResponse !== undefined || error) && (
          <section className="responses-result">
            <header>
              <div>
                <span className="responses-run-status" data-status={status}>
                  {statusLabel(status)}
                </span>
                <strong>API 返回结果</strong>
              </div>
              {responseId && <code>{responseId}</code>}
            </header>
            {error && <p className="responses-error">{error}</p>}
            {streamEvents.length > 0 && (
              <div className="responses-stream-summary">
                <strong>SSE 事件 {streamEvents.length} 条</strong>
                <div>
                  {streamEvents.slice(-12).map((event, index) => (
                    <code key={`${eventType(event)}-${index}`}>
                      {eventType(event)}
                    </code>
                  ))}
                </div>
              </div>
            )}
            {latestResponse !== undefined && (
              <pre>{JSON.stringify(latestResponse, null, 2)}</pre>
            )}
          </section>
        )}
      </section>

      <section className="responses-schema" id="responses-schema">
        <div className="responses-section-heading">
          <div>
            <p className="eyebrow">协议总览</p>
            <h2>完整参数结构</h2>
          </div>
          <p>
            对照官方 Create Response 与 Response Object：顶层字段全部列出，复杂联合类型按
            InputItem、ContentItem、Tool 与 OutputItem 分组。
          </p>
        </div>
        <div className="responses-schema-tabs">
          {(
            [
              ["request", "请求参数"],
              ["response", "响应参数"],
              ["unions", "联合结构"],
            ] as const
          ).map(([id, label]) => (
            <button
              className={catalogTab === id ? "is-active" : ""}
              key={id}
              onClick={() => setCatalogTab(id)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div hidden={catalogTab !== "request"}>
          <ParameterTable
            columns={["字段", "类型", "要求", "说明"]}
            rows={RESPONSE_REQUEST_FIELDS}
          />
        </div>
        <div hidden={catalogTab !== "response"}>
          <ParameterTable
            columns={["字段", "类型", "说明"]}
            rows={RESPONSE_OUTPUT_FIELDS}
          />
        </div>
        <div hidden={catalogTab !== "unions"}>
          <div className="responses-union-grid">
            <VariantList
              items={RESPONSE_INPUT_VARIANTS}
              title="InputItem"
            />
            <VariantList
              items={RESPONSE_CONTENT_VARIANTS}
              title="ContentItem"
            />
            <VariantList
              items={RESPONSE_TOOL_VARIANTS}
              title="Tool"
            />
            <VariantList
              items={RESPONSE_OUTPUT_VARIANTS}
              title="OutputItem"
            />
          </div>
        </div>
        <div className="responses-schema-notes">
          <p>
            <strong>Header：</strong>Authorization、Content-Type，以及可选的
            X-Fornax-Trace。
          </p>
          <p>
            <strong>流式：</strong>按 SSE 返回 response.created、output_item、
            content_part、文本 / 思考 delta、工具 delta、completed / failed
            等事件，最后以 data: [DONE] 结束。
          </p>
        </div>
      </section>

      <section className="responses-history">
        <div className="responses-section-heading">
          <div>
            <p className="eyebrow">本机记录</p>
            <h2>历史与脱敏日志</h2>
          </div>
          <p>
            最近 30
            次操作保存在当前浏览器。Authorization、MCP headers、Token、密码等敏感字段只显示掩码。
          </p>
        </div>
        {history.length === 0 ? (
          <p className="responses-empty">暂无 Responses API 演示记录。</p>
        ) : (
          <div className="responses-history-layout">
            <ol className="responses-history-list">
              {history.map((record) => (
                <li key={record.id}>
                  <button
                    className={
                      selectedLogId === record.id ? "is-active" : ""
                    }
                    onClick={() => setSelectedLogId(record.id)}
                    type="button"
                  >
                    <span
                      className="responses-run-status"
                      data-status={record.status}
                    >
                      {statusLabel(record.status)}
                    </span>
                    <strong>{record.scenarioTitle}</strong>
                    <small>
                      {ACTIONS.find((item) => item.id === record.action)?.label}
                      {" · "}
                      {formatTime(record.createdAt)}
                    </small>
                    {record.responseId && <code>{record.responseId}</code>}
                  </button>
                </li>
              ))}
            </ol>
            <div className="responses-log-viewer">
              {selectedLog ? (
                <>
                  <div>
                    <strong>Request</strong>
                    <pre>
                      {JSON.stringify(selectedLog.request, null, 2)}
                    </pre>
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

function CommonResponseFields({
  body,
  patchBody,
}: {
  body: ResponsesRequestBody;
  patchBody: (patch: Partial<ResponsesRequestBody>) => void;
}) {
  return (
    <div className="responses-field-group">
      <header>
        <strong>通用参数</strong>
        <small>每次编辑都会同步更新右侧完整 API</small>
      </header>
      <div className="responses-fields">
        <label className="responses-field-wide">
          <span>model</span>
          <input
            onChange={(event) => patchBody({ model: event.target.value })}
            value={body.model ?? ""}
          />
          <small>填写 Model ID 或已开通的 Endpoint ID。</small>
        </label>
        <label>
          <span>service_tier</span>
          <select
            onChange={(event) =>
              patchBody({
                service_tier: event.target.value as "default" | "fast",
              })
            }
            value={body.service_tier ?? "default"}
          >
            <option value="default">default · 常规</option>
            <option value="fast">fast · 优先低延迟</option>
          </select>
        </label>
        <label>
          <span>max_output_tokens</span>
          <input
            min="1"
            onChange={(event) =>
              patchBody({
                max_output_tokens: numberOrUndefined(event.target.value),
              })
            }
            type="number"
            value={body.max_output_tokens ?? ""}
          />
        </label>
        <label className="responses-check-row">
          <input
            checked={body.store ?? true}
            onChange={(event) => patchBody({ store: event.target.checked })}
            type="checkbox"
          />
          <span>
            store
            <small>默认 true，便于查询与多轮上下文</small>
          </span>
        </label>
        <label className="responses-check-row">
          <input
            checked={body.stream ?? false}
            onChange={(event) => patchBody({ stream: event.target.checked })}
            type="checkbox"
          />
          <span>
            stream
            <small>按 SSE 接收增量事件</small>
          </span>
        </label>
      </div>
    </div>
  );
}

function ScenarioFields({
  body,
  replaceBody,
  scenario,
}: {
  body: ResponsesRequestBody;
  replaceBody: (body: ResponsesRequestBody) => void;
  scenario: ResponsesScenario;
}) {
  const patch = (patchBody: Partial<ResponsesRequestBody>) =>
    replaceBody({ ...body, ...patchBody });
  const prompt = getPrompt(body);

  return (
    <div className="responses-field-group">
      <header>
        <strong>场景参数</strong>
        <small>{scenario.badge}</small>
      </header>
      <div className="responses-fields">
        <label className="responses-field-wide">
          <span>input · 提示内容</span>
          <textarea
            onChange={(event) =>
              replaceBody(setPrompt(body, event.target.value))
            }
            rows={5}
            value={prompt}
          />
        </label>

        {scenario.id === "text" && (
          <>
            <label className="responses-field-wide">
              <span>instructions</span>
              <textarea
                onChange={(event) =>
                  patch({ instructions: event.target.value })
                }
                rows={3}
                value={body.instructions ?? ""}
              />
            </label>
            <label>
              <span>temperature · {body.temperature ?? 1}</span>
              <input
                max="2"
                min="0"
                onChange={(event) =>
                  patch({ temperature: Number(event.target.value) })
                }
                step="0.1"
                type="range"
                value={body.temperature ?? 1}
              />
            </label>
            <label>
              <span>top_p · {body.top_p ?? 0.7}</span>
              <input
                max="1"
                min="0"
                onChange={(event) =>
                  patch({ top_p: Number(event.target.value) })
                }
                step="0.05"
                type="range"
                value={body.top_p ?? 0.7}
              />
            </label>
          </>
        )}

        {scenario.id === "conversation" && (
          <>
            <label className="responses-field-wide">
              <span>previous_response_id</span>
              <input
                onChange={(event) =>
                  patch({ previous_response_id: event.target.value })
                }
                placeholder="先执行首轮，再填入 resp_..."
                value={body.previous_response_id ?? ""}
              />
            </label>
            <label>
              <span>expire_at · UTC Unix 秒</span>
              <input
                onChange={(event) =>
                  patch({
                    expire_at: numberOrUndefined(event.target.value),
                  })
                }
                placeholder="最长为当前时刻 + 604800"
                type="number"
                value={body.expire_at ?? ""}
              />
            </label>
          </>
        )}

        {scenario.id === "reasoning" && (
          <>
            <label>
              <span>thinking.type</span>
              <select
                onChange={(event) =>
                  patch({
                    thinking: {
                      type: event.target.value as
                        | "enabled"
                        | "disabled"
                        | "auto",
                    },
                  })
                }
                value={body.thinking?.type ?? "enabled"}
              >
                <option value="enabled">enabled · 强制思考</option>
                <option value="disabled">disabled · 关闭</option>
                <option value="auto">auto · 模型判断</option>
              </select>
            </label>
            <label>
              <span>reasoning.effort</span>
              <select
                onChange={(event) =>
                  patch({
                    reasoning: {
                      effort: event.target.value as
                        | "minimal"
                        | "low"
                        | "medium"
                        | "high"
                        | "max",
                    },
                  })
                }
                value={body.reasoning?.effort ?? "medium"}
              >
                {["minimal", "low", "medium", "high", "max"].map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="responses-check-row responses-field-wide">
              <input
                checked={
                  body.include?.includes("reasoning.encrypted_content") ??
                  false
                }
                onChange={(event) =>
                  patch({
                    include: event.target.checked
                      ? ["reasoning.encrypted_content"]
                      : [],
                  })
                }
                type="checkbox"
              />
              <span>
                返回 reasoning.encrypted_content
                <small>加密原文可在工具多轮中按原样回传</small>
              </span>
            </label>
          </>
        )}

        {scenario.id === "multimodal" && (
          <MultimodalFields body={body} replaceBody={replaceBody} />
        )}

        {scenario.id === "function" && (
          <FunctionFields body={body} replaceBody={replaceBody} />
        )}

        {scenario.id === "built-in-tools" && (
          <ToolFields body={body} replaceBody={replaceBody} />
        )}

        {scenario.id === "cache" && (
          <CacheFields body={body} replaceBody={replaceBody} />
        )}

        {scenario.id === "structured-output" && (
          <StructuredOutputFields
            body={body}
            replaceBody={replaceBody}
          />
        )}
      </div>
    </div>
  );
}

function MultimodalFields({
  body,
  replaceBody,
}: {
  body: ResponsesRequestBody;
  replaceBody: (body: ResponsesRequestBody) => void;
}) {
  const item = getMultimodalItem(body);
  const type = (item.type as MultimodalType | undefined) ?? "input_image";
  const sourceMode = Object.keys(item).find((key) => key === "file_id")
    ? "file_id"
    : "url";

  function changeType(nextType: MultimodalType) {
    replaceBody(setMultimodalItem(body, multimodalItem(nextType, "")));
  }

  function changeSourceMode(mode: "url" | "file_id") {
    replaceBody(
      setMultimodalItem(
        body,
        mode === "file_id"
          ? { type, file_id: "" }
          : multimodalItem(type, ""),
      ),
    );
  }

  function changeSource(value: string) {
    replaceBody(
      setMultimodalItem(
        body,
        sourceMode === "file_id"
          ? { ...item, type, file_id: value }
          : { ...item, type, [urlKey(type)]: value },
      ),
    );
  }

  return (
    <>
      <label>
        <span>ContentItem.type</span>
        <select
          onChange={(event) =>
            changeType(event.target.value as MultimodalType)
          }
          value={type}
        >
          <option value="input_image">input_image · 图片</option>
          <option value="input_video">input_video · 视频</option>
          <option value="input_file">input_file · PDF / 文档</option>
          <option value="input_audio">input_audio · 音频</option>
        </select>
      </label>
      <label>
        <span>素材来源</span>
        <select
          onChange={(event) =>
            changeSourceMode(event.target.value as "url" | "file_id")
          }
          value={sourceMode}
        >
          <option value="url">公网 HTTPS / Base64 URL</option>
          <option value="file_id">Files API file_id</option>
        </select>
      </label>
      <label className="responses-field-wide">
        <span>{sourceMode === "file_id" ? "file_id" : urlKey(type)}</span>
        <input
          onChange={(event) => changeSource(event.target.value)}
          placeholder={
            sourceMode === "file_id"
              ? "file_..."
              : "https://... 或 data:..."
          }
          value={getMultimodalSource(body)}
        />
        <small>
          Files API 单文件最大 512 MB；是否支持具体格式与时长取决于模型。
        </small>
      </label>
      {type === "input_image" && (
        <label>
          <span>detail</span>
          <select
            onChange={(event) =>
              replaceBody(
                setMultimodalItem(body, {
                  ...item,
                  detail: event.target.value,
                }),
              )
            }
            value={String(item.detail ?? "auto")}
          >
            {["auto", "low", "high", "xhigh"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}

function FunctionFields({
  body,
  replaceBody,
}: {
  body: ResponsesRequestBody;
  replaceBody: (body: ResponsesRequestBody) => void;
}) {
  const tool = body.tools?.[0] ?? {};
  const parameters = isRecord(tool.parameters) ? tool.parameters : {};
  return (
    <>
      <label>
        <span>tools.name</span>
        <input
          onChange={(event) =>
            replaceBody(
              setFirstTool(body, { ...tool, name: event.target.value }),
            )
          }
          value={String(tool.name ?? "")}
        />
      </label>
      <label>
        <span>tool_choice</span>
        <select
          onChange={(event) =>
            replaceBody({ ...body, tool_choice: event.target.value })
          }
          value={
            typeof body.tool_choice === "string" ? body.tool_choice : "auto"
          }
        >
          <option value="auto">auto</option>
          <option value="required">required</option>
          <option value="none">none</option>
        </select>
      </label>
      <label className="responses-field-wide">
        <span>tools.description</span>
        <input
          onChange={(event) =>
            replaceBody(
              setFirstTool(body, {
                ...tool,
                description: event.target.value,
              }),
            )
          }
          value={String(tool.description ?? "")}
        />
      </label>
      <label className="responses-field-wide">
        <span>tools.parameters · JSON Schema</span>
        <textarea
          onChange={(event) => {
            try {
              const next = JSON.parse(event.target.value) as unknown;
              if (isRecord(next)) {
                replaceBody(setFirstTool(body, { ...tool, parameters: next }));
              }
            } catch {
              // Keep the last valid schema while the user is typing.
            }
          }}
          rows={9}
          value={JSON.stringify(parameters, null, 2)}
        />
      </label>
    </>
  );
}

function ToolFields({
  body,
  replaceBody,
}: {
  body: ResponsesRequestBody;
  replaceBody: (body: ResponsesRequestBody) => void;
}) {
  const tool = body.tools?.[0] ?? { type: "web_search" };
  const type = String(tool.type ?? "web_search");

  function changeType(nextType: string) {
    replaceBody(setFirstTool(body, toolPreset(nextType)));
  }

  return (
    <>
      <label>
        <span>tools.type</span>
        <select
          onChange={(event) => changeType(event.target.value)}
          value={type}
        >
          <option value="web_search">web_search</option>
          <option value="image_process">image_process</option>
          <option value="knowledge_search">knowledge_search</option>
          <option value="mcp">mcp</option>
          <option value="doubao_app">doubao_app</option>
        </select>
      </label>
      <label>
        <span>max_tool_calls</span>
        <input
          max="10"
          min="1"
          onChange={(event) =>
            replaceBody({
              ...body,
              max_tool_calls: Number(event.target.value),
            })
          }
          type="number"
          value={body.max_tool_calls ?? 3}
        />
      </label>
      {type === "web_search" && (
        <>
          <label>
            <span>tools.max_keyword</span>
            <input
              max="50"
              min="1"
              onChange={(event) =>
                replaceBody(
                  setFirstTool(body, {
                    ...tool,
                    max_keyword: Number(event.target.value),
                  }),
                )
              }
              type="number"
              value={Number(tool.max_keyword ?? 2)}
            />
          </label>
          <label>
            <span>tools.limit</span>
            <input
              max="50"
              min="1"
              onChange={(event) =>
                replaceBody(
                  setFirstTool(body, {
                    ...tool,
                    limit: Number(event.target.value),
                  }),
                )
              }
              type="number"
              value={Number(tool.limit ?? 10)}
            />
          </label>
        </>
      )}
      {type === "knowledge_search" && (
        <label className="responses-field-wide">
          <span>tools.knowledge_resource_id</span>
          <input
            onChange={(event) =>
              replaceBody(
                setFirstTool(body, {
                  ...tool,
                  knowledge_resource_id: event.target.value,
                }),
              )
            }
            placeholder="知识库资源 ID"
            value={String(tool.knowledge_resource_id ?? "")}
          />
        </label>
      )}
      {type === "mcp" && (
        <>
          <label>
            <span>tools.server_label</span>
            <input
              onChange={(event) =>
                replaceBody(
                  setFirstTool(body, {
                    ...tool,
                    server_label: event.target.value,
                  }),
                )
              }
              value={String(tool.server_label ?? "")}
            />
          </label>
          <label>
            <span>tools.server_url</span>
            <input
              onChange={(event) =>
                replaceBody(
                  setFirstTool(body, {
                    ...tool,
                    server_url: event.target.value,
                  }),
                )
              }
              placeholder="https://..."
              value={String(tool.server_url ?? "")}
            />
          </label>
        </>
      )}
      {(type === "image_process" || type === "doubao_app") && (
        <p className="responses-field-note responses-field-wide">
          当前工具已预填完整可执行结构；更多子开关可在右侧 Request Body
          中编辑并应用。
        </p>
      )}
    </>
  );
}

function CacheFields({
  body,
  replaceBody,
}: {
  body: ResponsesRequestBody;
  replaceBody: (body: ResponsesRequestBody) => void;
}) {
  const caching = body.caching ?? { type: "enabled", prefix: false };
  return (
    <>
      <label>
        <span>caching.type</span>
        <select
          onChange={(event) =>
            replaceBody({
              ...body,
              caching: {
                ...caching,
                type: event.target.value as "enabled" | "disabled",
              },
            })
          }
          value={caching.type}
        >
          <option value="enabled">enabled</option>
          <option value="disabled">disabled</option>
        </select>
      </label>
      <label className="responses-check-row">
        <input
          checked={caching.prefix ?? false}
          onChange={(event) =>
            replaceBody({
              ...body,
              stream: event.target.checked ? false : body.stream,
              caching: { ...caching, prefix: event.target.checked },
            })
          }
          type="checkbox"
        />
        <span>
          prefix · 只写前缀缓存
          <small>至少 256 tokens，开启时不生成回答且不能 stream</small>
        </span>
      </label>
      <label className="responses-field-wide">
        <span>previous_response_id · Session 缓存</span>
        <input
          onChange={(event) =>
            replaceBody({
              ...body,
              previous_response_id: event.target.value,
            })
          }
          placeholder="第二轮起填入 resp_..."
          value={body.previous_response_id ?? ""}
        />
      </label>
      <label>
        <span>expire_at · UTC Unix 秒</span>
        <input
          onChange={(event) =>
            replaceBody({
              ...body,
              expire_at: numberOrUndefined(event.target.value),
            })
          }
          type="number"
          value={body.expire_at ?? ""}
        />
      </label>
    </>
  );
}

function StructuredOutputFields({
  body,
  replaceBody,
}: {
  body: ResponsesRequestBody;
  replaceBody: (body: ResponsesRequestBody) => void;
}) {
  const format = body.text?.format ?? { type: "text" as const };
  return (
    <>
      <label>
        <span>text.format.type</span>
        <select
          onChange={(event) => {
            const type = event.target.value as
              | "text"
              | "json_object"
              | "json_schema";
            replaceBody({
              ...body,
              text: {
                format:
                  type === "json_schema"
                    ? {
                        ...format,
                        type,
                        name: format.name ?? "structured_output",
                        schema: format.schema ?? {
                          type: "object",
                          properties: {},
                        },
                        strict: format.strict ?? true,
                      }
                    : { type },
              },
            });
          }}
          value={format.type}
        >
          <option value="text">text</option>
          <option value="json_object">json_object</option>
          <option value="json_schema">json_schema</option>
        </select>
      </label>
      {format.type === "json_schema" && (
        <>
          <label>
            <span>text.format.name</span>
            <input
              onChange={(event) =>
                replaceBody({
                  ...body,
                  text: {
                    format: { ...format, name: event.target.value },
                  },
                })
              }
              value={format.name ?? ""}
            />
          </label>
          <label className="responses-field-wide">
            <span>text.format.schema</span>
            <textarea
              onChange={(event) => {
                try {
                  const schema = JSON.parse(event.target.value) as unknown;
                  if (isRecord(schema)) {
                    replaceBody({
                      ...body,
                      text: { format: { ...format, schema } },
                    });
                  }
                } catch {
                  // Keep the last valid schema while the user is typing.
                }
              }}
              rows={11}
              value={JSON.stringify(format.schema ?? {}, null, 2)}
            />
          </label>
          <label className="responses-check-row">
            <input
              checked={format.strict ?? false}
              onChange={(event) =>
                replaceBody({
                  ...body,
                  text: {
                    format: { ...format, strict: event.target.checked },
                  },
                })
              }
              type="checkbox"
            />
            <span>strict · 严格按 JSON Schema 输出</span>
          </label>
        </>
      )}
    </>
  );
}

function ApiEditor({
  apiDetail,
  apiDraft,
  apiDraftError,
  apiEditing,
  applyApiDraft,
  cancel,
  curlApiDetail,
  edit,
  hasApiKey,
  requestJson,
  setApiDraft,
}: {
  apiDetail: ApiDetail;
  apiDraft: string;
  apiDraftError: string;
  apiEditing: boolean;
  applyApiDraft: () => void;
  cancel: () => void;
  curlApiDetail: ApiDetail;
  edit: () => void;
  hasApiKey: boolean;
  requestJson: string;
  setApiDraft: (value: string) => void;
}) {
  return (
    <aside className="responses-api-editor">
      <header>
        <div>
          <span>完整 API 详情</span>
          <strong>表单 ↔ JSON 双向联动</strong>
        </div>
        <div className="responses-api-actions">
          <CopyCurlButton
            body={curlApiDetail.body}
            containsApiKey={hasApiKey}
            headers={curlApiDetail.headers}
            method={curlApiDetail.method}
            url={curlApiDetail.url}
          />
          {!apiEditing && (
            <button onClick={edit} type="button">
              编辑 JSON
            </button>
          )}
        </div>
      </header>
      <ApiSummary detail={apiDetail} />
      <div className="responses-json-block">
        <div>
          <span>Request Body</span>
          <small>{new TextEncoder().encode(requestJson).length} bytes</small>
        </div>
        {apiEditing ? (
          <>
            <textarea
              aria-label="完整 Responses API Request Body"
              onChange={(event) => setApiDraft(event.target.value)}
              rows={28}
              spellCheck={false}
              value={apiDraft}
            />
            {apiDraftError && (
              <p className="responses-error">{apiDraftError}</p>
            )}
            <div className="responses-json-actions">
              <button onClick={cancel} type="button">
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
    </aside>
  );
}

function ApiSummary({ detail }: { detail: ApiDetail }) {
  return (
    <dl className="responses-api-summary">
      <div>
        <dt>Method</dt>
        <dd>{detail.method}</dd>
      </div>
      <div>
        <dt>URL</dt>
        <dd>{detail.url}</dd>
      </div>
      <div>
        <dt>Headers</dt>
        <dd>
          <pre>{JSON.stringify(detail.headers, null, 2)}</pre>
        </dd>
      </div>
      <div>
        <dt>Body</dt>
        <dd>{detail.body === undefined ? "无 Request Body" : "见下方 JSON"}</dd>
      </div>
    </dl>
  );
}

function ParameterTable({
  columns,
  rows,
}: {
  columns: readonly string[];
  rows: ReadonlyArray<readonly string[]>;
}) {
  return (
    <div className="responses-parameter-table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) => (
                <td key={`${row[0]}-${index}`}>
                  {index === 0 ? <code>{cell}</code> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VariantList({
  items,
  title,
}: {
  items: ReadonlyArray<readonly [string, string]>;
  title: string;
}) {
  return (
    <div className="responses-variant-list">
      <header>
        <strong>{title}</strong>
        <span>{items.length} 种</span>
      </header>
      <dl>
        {items.map(([name, fields]) => (
          <div key={name}>
            <dt>
              <code>{name}</code>
            </dt>
            <dd>{fields}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function buildApiDetail(
  action: ResponsesAction,
  responseId: string,
  requestBody: ResponsesRequestBody,
  apiKey: string,
  trace: boolean,
): ApiDetail {
  const id = responseId || "{response_id}";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${maskApiKey(apiKey)}`,
    "Content-Type": "application/json",
  };
  if (trace) headers["X-Fornax-Trace"] = "true";
  if (action === "create") {
    return {
      method: "POST",
      url: `${RESPONSES_BASE_URL}/responses`,
      headers,
      body: requestBody,
    };
  }
  return {
    method: action === "delete" ? "DELETE" : "GET",
    url:
      action === "list-input-items"
        ? `${RESPONSES_BASE_URL}/responses/${id}/input_items`
        : `${RESPONSES_BASE_URL}/responses/${id}`,
    headers,
  };
}

function redactApiDetail(detail: ApiDetail): ApiDetail {
  return {
    ...detail,
    headers: {
      ...detail.headers,
      Authorization: detail.headers.Authorization || "Bearer ••••",
    },
    body: detail.body === undefined ? undefined : redactSensitive(detail.body),
  };
}

function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!isRecord(value)) return compactString(value);
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      /authorization|api[_-]?key|token|secret|password|headers/i.test(key)
        ? "[REDACTED]"
        : redactSensitive(nested),
    ]),
  );
}

function getPrompt(body: ResponsesRequestBody): string {
  if (typeof body.input === "string") return body.input;
  if (!Array.isArray(body.input)) return "";
  for (const item of body.input) {
    if (!isRecord(item)) continue;
    if (typeof item.content === "string") return item.content;
    if (!Array.isArray(item.content)) continue;
    const inputText = item.content.find(
      (content) => isRecord(content) && content.type === "input_text",
    );
    if (isRecord(inputText) && typeof inputText.text === "string") {
      return inputText.text;
    }
  }
  return "";
}

function setPrompt(
  body: ResponsesRequestBody,
  prompt: string,
): ResponsesRequestBody {
  if (typeof body.input === "string") return { ...body, input: prompt };
  if (!Array.isArray(body.input)) return { ...body, input: prompt };
  const input = cloneBody(body.input);
  const message = input.find((item) => isRecord(item) && "content" in item);
  if (!isRecord(message)) return { ...body, input: prompt };
  if (typeof message.content === "string") {
    message.content = prompt;
    return { ...body, input };
  }
  if (Array.isArray(message.content)) {
    const textItem = message.content.find(
      (item) => isRecord(item) && item.type === "input_text",
    );
    if (isRecord(textItem)) textItem.text = prompt;
    else message.content.unshift({ type: "input_text", text: prompt });
  }
  return { ...body, input };
}

function getMultimodalItem(
  body: ResponsesRequestBody,
): Record<string, unknown> {
  if (!Array.isArray(body.input)) return {};
  for (const item of body.input) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    const media = item.content.find(
      (content) =>
        isRecord(content) &&
        typeof content.type === "string" &&
        content.type !== "input_text",
    );
    if (isRecord(media)) return media;
  }
  return {};
}

function setMultimodalItem(
  body: ResponsesRequestBody,
  nextItem: Record<string, unknown>,
): ResponsesRequestBody {
  const input = Array.isArray(body.input)
    ? cloneBody(body.input)
    : [
        {
          role: "user",
          content: [
            { type: "input_text", text: getPrompt(body) },
            nextItem,
          ],
        },
      ];
  const message = input.find((item) => isRecord(item) && "content" in item);
  if (!isRecord(message)) return { ...body, input };
  if (!Array.isArray(message.content)) {
    message.content = [
      { type: "input_text", text: String(message.content ?? "") },
      nextItem,
    ];
    return { ...body, input };
  }
  const mediaIndex = message.content.findIndex(
    (content) =>
      isRecord(content) &&
      typeof content.type === "string" &&
      content.type !== "input_text",
  );
  if (mediaIndex >= 0) message.content[mediaIndex] = nextItem;
  else message.content.push(nextItem);
  return { ...body, input };
}

function getMultimodalSource(body: ResponsesRequestBody): string {
  const item = getMultimodalItem(body);
  for (const key of [
    "image_url",
    "video_url",
    "file_url",
    "audio_url",
    "file_id",
  ]) {
    if (typeof item[key] === "string") return item[key] as string;
  }
  return "";
}

function getRequestBlocker(body: ResponsesRequestBody): string {
  const media = getMultimodalItem(body);
  if (
    typeof media.type === "string" &&
    ["input_image", "input_video", "input_file", "input_audio"].includes(
      media.type,
    ) &&
    !getMultimodalSource(body).trim()
  ) {
    return "多模态素材地址为空，请先填写公网 HTTPS URL 或 file_id。";
  }
  for (const tool of body.tools ?? []) {
    if (tool.type === "mcp") {
      if (
        typeof tool.server_label !== "string" ||
        !tool.server_label.trim() ||
        typeof tool.server_url !== "string" ||
        !tool.server_url.trim()
      ) {
        return "MCP 工具需要填写 server_label 与 HTTPS server_url。";
      }
    }
    if (
      tool.type === "knowledge_search" &&
      (typeof tool.knowledge_resource_id !== "string" ||
        !tool.knowledge_resource_id.trim())
    ) {
      return "知识库工具需要填写 knowledge_resource_id。";
    }
  }
  return "";
}

function multimodalItem(
  type: MultimodalType,
  source: string,
): Record<string, unknown> {
  return {
    type,
    [urlKey(type)]: source,
    ...(type === "input_image" ? { detail: "auto" } : {}),
  };
}

function urlKey(type: MultimodalType) {
  if (type === "input_image") return "image_url";
  if (type === "input_video") return "video_url";
  if (type === "input_audio") return "audio_url";
  return "file_url";
}

function setFirstTool(
  body: ResponsesRequestBody,
  tool: Record<string, unknown>,
): ResponsesRequestBody {
  return { ...body, tools: [tool] };
}

function toolPreset(type: string): Record<string, unknown> {
  if (type === "image_process") {
    return {
      type,
      grounding: { type: "enabled" },
      pointing: { type: "enabled" },
    };
  }
  if (type === "knowledge_search") {
    return {
      type,
      knowledge_resource_id: "",
      dense_weight: 0.5,
      limit: 10,
    };
  }
  if (type === "mcp") {
    return {
      type,
      server_label: "demo_mcp",
      server_url: "",
      require_approval: "always",
    };
  }
  if (type === "doubao_app") {
    return {
      type,
      feature: {
        chat: { type: "enabled" },
        thinking: { type: "disabled" },
        ai_search: { type: "disabled" },
        reasoning_search: { type: "disabled" },
      },
    };
  }
  return { type: "web_search", max_keyword: 2, limit: 10 };
}

async function consumeResponsesStream(
  response: Response,
  onEvent: (event: unknown) => void,
): Promise<unknown> {
  if (!response.body) throw new Error("流式响应没有可读取内容。");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const events: unknown[] = [];
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const data = frame
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n");
      if (!data || data === "[DONE]") continue;
      try {
        const event = JSON.parse(data) as unknown;
        events.push(event);
        onEvent(event);
      } catch {
        events.push({ type: "raw", data });
        onEvent({ type: "raw", data });
      }
    }
    if (done) break;
  }

  const completed = [...events]
    .reverse()
    .find(
      (event) =>
        isRecord(event) &&
        (event.type === "response.completed" ||
          event.type === "response.failed"),
    );
  if (isRecord(completed) && completed.response !== undefined) {
    return completed.response;
  }
  return { events };
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
  return "Responses API 返回失败状态，请查看脱敏响应日志。";
}

function extractResponseId(value: unknown): string {
  if (isRecord(value) && typeof value.id === "string") return value.id;
  if (isRecord(value) && isRecord(value.response)) {
    return typeof value.response.id === "string" ? value.response.id : "";
  }
  return "";
}

function eventType(value: unknown) {
  return isRecord(value) && typeof value.type === "string"
    ? value.type
    : "event";
}

function maskApiKey(apiKey: string) {
  if (!apiKey) return "••••••••";
  if (apiKey.length < 9) return "••••••••";
  return `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}`;
}

function localId(action: string) {
  return `${action}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function numberOrUndefined(value: string) {
  return value === "" ? undefined : Number(value);
}

function cloneBody<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

function compactString(value: unknown): unknown {
  if (
    typeof value === "string" &&
    value.startsWith("data:") &&
    value.length > 240
  ) {
    return `[BASE64 ${value.length} chars omitted]`;
  }
  return value;
}

function compactForStorage(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(compactForStorage);
  if (!isRecord(value)) return compactString(value);
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      compactForStorage(nested),
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
    // Keep the active result if the browser's storage quota is unavailable.
  }
}
