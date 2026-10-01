"use client";

import { useEffect, useMemo, useState } from "react";
import { renderSvgToPng } from "../lib/pelican-render";
import {
  PELICAN_BASE_URL,
  PELICAN_CREDENTIAL_KEY,
  PELICAN_DIMENSIONS,
  PELICAN_DIMENSION_HINTS,
  PELICAN_DIMENSION_LABELS,
  PELICAN_GENERATION_MAX_TOKENS,
  PELICAN_HISTORY_KEY,
  PELICAN_JUDGE_MAX_TOKENS,
  PELICAN_JUDGE_SCHEMA,
  PELICAN_MAX_HISTORY,
  PELICAN_PROMPT,
  buildJudgeText,
  buildVisionJudgeInput,
  createPelicanRunId,
  describeTruncatedGeneration,
  describeTruncatedJudgement,
  normalizeSvg,
  parseJudgePayload,
  type JudgeMode,
  type PelicanRenderMeta,
  type PelicanRun,
  type PelicanScores,
  type PelicanUsage,
} from "../lib/pelican-shared";

type Phase = "idle" | "generate" | "render" | "judge";
type Outcome = "" | "success" | "partial" | "error";

type PelicanView = {
  runId: string;
  createdAt: string;
  model: string;
  judgeModel: string;
  judgeMode: JudgeMode;
  svg: string;
  png: string;
  renderMeta?: PelicanRenderMeta;
  scores?: PelicanScores;
  overall?: number;
  comments?: string;
  usage?: PelicanUsage;
  judgeRaw?: string;
  tosObjectKey?: string;
  scored: boolean;
};

type JudgeParams = {
  runId: string;
  svg: string;
  mode: JudgeMode;
  png: string;
  model: string;
  judgeModel: string;
  usage?: PelicanUsage;
  renderMeta?: PelicanRenderMeta;
};

export function PelicanTestPanel() {
  const [model, setModel] = useState("");
  const [judgeModel, setJudgeModel] = useState("");
  const [judgeMode, setJudgeMode] = useState<JudgeMode>("vision");
  const [baseUrl, setBaseUrl] = useState(PELICAN_BASE_URL);
  const [apiKey, setApiKey] = useState("");
  const [rememberApiKey, setRememberApiKey] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [costConfirmed, setCostConfirmed] = useState(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [outcome, setOutcome] = useState<Outcome>("");
  const [error, setError] = useState("");
  const [judgeFailed, setJudgeFailed] = useState(false);
  const [renderBlocked, setRenderBlocked] = useState(false);

  const [view, setView] = useState<PelicanView | null>(null);
  const [pngLoading, setPngLoading] = useState(false);
  const [history, setHistory] = useState<PelicanRun[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState("");
  const [historyFilterModel, setHistoryFilterModel] = useState("");
  const [savingTos, setSavingTos] = useState(false);
  const [readingTos, setReadingTos] = useState(false);
  const [tosMessage, setTosMessage] = useState("");

  const running = phase !== "idle";
  const executeReady =
    Boolean(apiKey.trim()) &&
    Boolean(model.trim()) &&
    Boolean(judgeModel.trim()) &&
    costConfirmed &&
    !running;

  // Read shared credential + local history once on mount. No network on load.
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

  const historyModels = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const record of history) {
      grouped.set(record.model, (grouped.get(record.model) ?? 0) + 1);
    }
    return [...grouped.entries()];
  }, [history]);

  const filteredHistory = historyFilterModel
    ? history.filter((record) => record.model === historyFilterModel)
    : history;

  async function runTest() {
    if (!executeReady) return;
    const runId = createPelicanRunId();
    const genModel = model.trim();
    const judModel = judgeModel.trim();
    const mode = judgeMode;

    setError("");
    setOutcome("");
    setJudgeFailed(false);
    setRenderBlocked(false);
    setTosMessage("");
    setSelectedHistoryId("");
    setPhase("generate");
    setView({
      runId,
      createdAt: new Date().toISOString(),
      model: genModel,
      judgeModel: judModel,
      judgeMode: mode,
      svg: "",
      png: "",
      scored: false,
    });

    // Step 1 — generate the SVG (1st real Responses API create).
    let svg = "";
    let genBody: unknown;
    let genUsage: PelicanUsage | undefined;
    try {
      genBody = await callResponses(apiKey, baseUrl.trim(), {
        model: genModel,
        input: PELICAN_PROMPT,
        max_output_tokens: PELICAN_GENERATION_MAX_TOKENS,
        store: false,
        stream: false,
      });
      svg = normalizeSvg(extractOutputText(genBody));
      genUsage = extractUsage(genBody);
    } catch (runError) {
      setOutcome("error");
      setPhase("idle");
      setError(
        runError instanceof Error ? runError.message : "生成调用失败。",
      );
      return;
    }

    if (!svg) {
      setOutcome("error");
      setPhase("idle");
      setError(
        describeTruncatedGeneration(genBody) ??
          "模型未返回可识别的 SVG（未找到 <svg>…</svg> 片段）。",
      );
      return;
    }
    setView((current) => (current ? { ...current, svg, usage: genUsage } : current));

    // Step 2 — vision mode rasterizes locally (zero network, zero cost).
    let png = "";
    let renderMeta: PelicanRenderMeta | undefined;
    if (mode === "vision") {
      setPhase("render");
      const rendered = await renderSvgToPng(svg);
      if (rendered.ok) {
        png = rendered.dataUrl;
        renderMeta = {
          ok: true,
          width: rendered.width,
          height: rendered.height,
          bytes: rendered.bytes,
        };
        setView((current) =>
          current ? { ...current, png, renderMeta } : current,
        );
      } else {
        renderMeta = { ok: false, error: rendered.error };
        setView((current) =>
          current ? { ...current, png: "", renderMeta } : current,
        );
        setRenderBlocked(true);
        setJudgeFailed(true);
        setOutcome("partial");
        setPhase("idle");
        setError(rendered.error);
        return;
      }
    }

    // Step 3 — judge (2nd real Responses API create).
    await runJudge({
      runId,
      svg,
      mode,
      png,
      model: genModel,
      judgeModel: judModel,
      usage: genUsage,
      renderMeta,
    });
  }

  async function runJudge(params: JudgeParams) {
    setPhase("judge");
    setJudgeFailed(false);
    setOutcome("");
    setError("");
    try {
      const input =
        params.mode === "vision"
          ? buildVisionJudgeInput(params.svg, params.png)
          : buildJudgeText(params.svg, "source");
      const body = await callResponses(apiKey, baseUrl.trim(), {
        model: params.judgeModel,
        input,
        text: { format: PELICAN_JUDGE_SCHEMA },
        max_output_tokens: PELICAN_JUDGE_MAX_TOKENS,
        store: false,
        stream: false,
      });
      const rawText = extractOutputText(body);
      const judgeUsage = extractUsage(body);
      setView((current) => (current ? { ...current, judgeRaw: rawText } : current));

      const parsed = parseJudgePayload(rawText);
      if (!parsed) {
        setJudgeFailed(true);
        setOutcome("partial");
        setPhase("idle");
        setError(
          describeTruncatedJudgement(body) ??
            "裁判返回内容无法解析为评分 JSON，可尝试『仅重跑裁判』。",
        );
        return;
      }

      const merged = mergeUsage(params.usage, judgeUsage);
      setView((current) =>
        current
          ? {
              ...current,
              scores: parsed.scores,
              overall: parsed.overall,
              comments: parsed.comments,
              usage: merged,
              judgeRaw: rawText,
              scored: true,
            }
          : current,
      );

      const run: PelicanRun = {
        id: params.runId,
        createdAt: new Date().toISOString(),
        model: params.model,
        judgeModel: params.judgeModel,
        judgeMode: params.mode,
        svg: params.svg,
        scores: parsed.scores,
        overall: parsed.overall,
        comments: parsed.comments,
        ...(params.renderMeta ? { renderMeta: params.renderMeta } : {}),
        ...(merged ? { usage: merged } : {}),
      };
      setHistory((current) =>
        [run, ...current.filter((item) => item.id !== run.id)].slice(
          0,
          PELICAN_MAX_HISTORY,
        ),
      );
      setSelectedHistoryId(run.id);
      setOutcome("success");
      setPhase("idle");
    } catch (judgeError) {
      setJudgeFailed(true);
      setOutcome("partial");
      setPhase("idle");
      setError(
        judgeError instanceof Error ? judgeError.message : "裁判调用失败。",
      );
    }
  }

  function rejudgeSameMode() {
    if (!view || !view.svg || running) return;
    runJudge({
      runId: view.runId,
      svg: view.svg,
      mode: view.judgeMode,
      png: view.png,
      model: view.model,
      judgeModel: judgeModel.trim() || view.judgeModel,
      usage: view.usage,
      renderMeta: view.renderMeta,
    });
  }

  function rejudgeAsSource() {
    if (!view || !view.svg || running) return;
    setRenderBlocked(false);
    setView((current) =>
      current
        ? { ...current, judgeMode: "source", png: "", renderMeta: undefined }
        : current,
    );
    runJudge({
      runId: view.runId,
      svg: view.svg,
      mode: "source",
      png: "",
      model: view.model,
      judgeModel: judgeModel.trim() || view.judgeModel,
      usage: view.usage,
      renderMeta: undefined,
    });
  }

  async function loadHistoryRecord(record: PelicanRun) {
    setSelectedHistoryId(record.id);
    setError("");
    setOutcome("");
    setJudgeFailed(false);
    setRenderBlocked(false);
    setTosMessage("");
    setView({
      runId: record.id,
      createdAt: record.createdAt,
      model: record.model,
      judgeModel: record.judgeModel,
      judgeMode: record.judgeMode,
      svg: record.svg,
      png: "",
      renderMeta: record.renderMeta,
      scores: record.scores,
      overall: record.overall,
      comments: record.comments,
      usage: record.usage,
      tosObjectKey: record.tosObjectKey,
      scored: true,
    });
    // Vision records are re-rasterized locally from the SVG; PNG is never cached.
    if (record.judgeMode === "vision") {
      setPngLoading(true);
      const rendered = await renderSvgToPng(record.svg);
      setPngLoading(false);
      if (rendered.ok) {
        setView((current) =>
          current && current.runId === record.id
            ? { ...current, png: rendered.dataUrl }
            : current,
        );
      }
    }
  }

  async function saveToTos() {
    if (!view || !view.scored || !view.scores || savingTos) return;
    setSavingTos(true);
    setTosMessage("");
    try {
      const payload = {
        runId: view.runId,
        model: view.model,
        judgeModel: view.judgeModel,
        judgeMode: view.judgeMode,
        svg: view.svg,
        scores: view.scores,
        overall: view.overall ?? 0,
        comments: view.comments ?? "",
        ...(view.renderMeta ? { renderMeta: view.renderMeta } : {}),
        ...(view.usage ? { usage: view.usage } : {}),
        createdAt: view.createdAt,
      };
      const response = await fetch("/api/pelican/tos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(responseErrorMessage(body, response.status));
      }
      const objectKey = (body as Record<string, unknown> | null)?.objectKey;
      if (typeof objectKey === "string" && objectKey) {
        setView((current) =>
          current ? { ...current, tosObjectKey: objectKey } : current,
        );
        setHistory((current) =>
          current.map((record) =>
            record.id === view.runId
              ? { ...record, tosObjectKey: objectKey }
              : record,
          ),
        );
        setTosMessage(`已保存到 TOS：${objectKey}`);
      } else {
        setTosMessage("保存成功，但未返回对象键。");
      }
    } catch (saveError) {
      setTosMessage(
        saveError instanceof Error ? saveError.message : "保存到 TOS 失败。",
      );
    } finally {
      setSavingTos(false);
    }
  }

  async function readFromTos(objectKey: string) {
    if (readingTos) return;
    setReadingTos(true);
    setTosMessage("");
    try {
      const response = await fetch(
        `/api/pelican/tos?key=${encodeURIComponent(objectKey)}&content=bundle`,
        { cache: "no-store" },
      );
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(responseErrorMessage(body, response.status));
      }
      if (!isScoredPelicanRun(body)) {
        throw new Error("TOS 返回的内容不是完整的鹈鹕测试记录。");
      }
      await loadHistoryRecord({ ...body, tosObjectKey: objectKey });
      setTosMessage(`已从 TOS 读取：${objectKey}`);
    } catch (fetchError) {
      setTosMessage(
        fetchError instanceof Error ? fetchError.message : "从 TOS 读取失败。",
      );
    } finally {
      setReadingTos(false);
    }
  }

  function deleteHistoryRecord(id: string) {
    setHistory((current) => current.filter((record) => record.id !== id));
    if (selectedHistoryId === id) setSelectedHistoryId("");
  }

  const scores = view?.scored ? view.scores : undefined;

  return (
    <div className="pelican-panel">
      <section className="pelican-config" aria-label="鹈鹕测试配置">
        <div className="pelican-prompt">
          <span>固定 Prompt（社区标准 · 不可编辑）</span>
          <code>{PELICAN_PROMPT}</code>
        </div>
        <div className="pelican-config-grid">
          <label className="pelican-field">
            <span>生成模型 ID</span>
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="手动填写，例如 doubao-seed-2-1-pro-260628"
              disabled={running}
              autoComplete="off"
            />
          </label>
          <label className="pelican-field">
            <span>裁判模型 ID</span>
            <input
              value={judgeModel}
              onChange={(event) => setJudgeModel(event.target.value)}
              placeholder="手动填写裁判模型 ID"
              disabled={running}
              autoComplete="off"
            />
          </label>
          <fieldset className="pelican-field pelican-mode" disabled={running}>
            <legend>裁判模式</legend>
            <label>
              <input
                type="radio"
                name="pelican-judge-mode"
                checked={judgeMode === "vision"}
                onChange={() => setJudgeMode("vision")}
              />
              视觉裁判（PNG · 默认）
            </label>
            <label>
              <input
                type="radio"
                name="pelican-judge-mode"
                checked={judgeMode === "source"}
                onChange={() => setJudgeMode("source")}
              />
              源码裁判（文本）
            </label>
          </fieldset>
          <label className="pelican-field">
            <span>API Key</span>
            <span className="pelican-key-row">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="火山方舟 API Key"
                disabled={running}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((value) => !value)}
              >
                {showApiKey ? "隐藏" : "显示"}
              </button>
            </span>
            <span className="pelican-remember">
              <input
                type="checkbox"
                checked={rememberApiKey}
                onChange={(event) => setRememberApiKey(event.target.checked)}
              />
              记住 API Key（仅本机）
            </span>
          </label>
          <label className="pelican-field">
            <span>Base URL（手动填写）</span>
            <input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder={`例如 ${PELICAN_BASE_URL}`}
              disabled={running}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        </div>
        {judgeMode === "vision" ? (
          <p className="pelican-hint">
            视觉裁判需裁判模型具备图像理解能力；SVG 在浏览器本地栅格化为 PNG
            后按图像 token 计价，PNG 不上传、不落盘、不进 TOS。
          </p>
        ) : (
          <p className="pelican-hint">
            源码裁判把 SVG 源码作为文本送评，适用于无视觉能力的模型或本地渲染失败时的备选。
          </p>
        )}
      </section>

      <section className="pelican-cost" aria-label="费用确认">
        <p>
          每次测试含 2 次真实 Responses API 创建（生成 + 裁判），按所选模型 token
          计价；视觉裁判另含图像 token。TOS 保存另产生存储与流量费用。页面加载与历史记录不发起任何真实调用。
        </p>
        <label className="pelican-cost-confirm">
          <input
            type="checkbox"
            checked={costConfirmed}
            onChange={(event) => setCostConfirmed(event.target.checked)}
            disabled={running}
          />
          我已了解并自愿承担上述真实调用费用
        </label>
        <div className="pelican-actions">
          <button
            type="button"
            className="pelican-run"
            onClick={runTest}
            disabled={!executeReady}
          >
            {running ? phaseLabel(phase) : "开始测试"}
          </button>
          {outcome ? (
            <span className={`pelican-outcome is-${outcome}`}>
              {outcomeLabel(outcome)}
            </span>
          ) : null}
        </div>
        {error ? (
          <p className="pelican-error" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      {view ? (
        <section className="pelican-viewer" aria-label="测试结果">
          <div className="pelican-preview">
            <div className="pelican-preview-col">
              <h3>SVG 交互预览（沙箱 iframe）</h3>
              <iframe
                className="pelican-preview-frame"
                sandbox=""
                title="鹈鹕 SVG 预览"
                srcDoc={view.svg}
              />
            </div>
            {view.judgeMode === "vision" ? (
              <div className="pelican-preview-col">
                <h3>裁判所见 PNG（浏览器本地栅格化）</h3>
                {pngLoading ? (
                  <p className="pelican-muted">正在本地重渲染 PNG…</p>
                ) : view.png ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    className="pelican-preview-png"
                    src={view.png}
                    alt="裁判所见的 PNG 渲染结果"
                  />
                ) : (
                  <p className="pelican-muted">
                    {view.renderMeta && view.renderMeta.ok === false
                      ? `渲染失败：${view.renderMeta.error ?? "未知原因"}`
                      : "暂无 PNG。"}
                  </p>
                )}
                {view.renderMeta && view.renderMeta.ok ? (
                  <p className="pelican-rendermeta">
                    {view.renderMeta.width}×{view.renderMeta.height} ·{" "}
                    {((view.renderMeta.bytes ?? 0) / 1024).toFixed(1)} KB
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {scores ? (
            <div className="pelican-scores">
              <div className="pelican-score-head">
                <JudgeModeBadge mode={view.judgeMode} />
                <strong className="pelican-overall">
                  {(view.overall ?? 0).toFixed(1)}
                  <span>/10 总分</span>
                </strong>
              </div>
              <ul className="pelican-score-list">
                {PELICAN_DIMENSIONS.map((dimension) => (
                  <li key={dimension} title={PELICAN_DIMENSION_HINTS[dimension]}>
                    <span className="pelican-dim-label">
                      {PELICAN_DIMENSION_LABELS[dimension]}
                    </span>
                    <span className="pelican-dim-bar">
                      <i style={{ width: `${(scores[dimension] / 10) * 100}%` }} />
                    </span>
                    <b>{scores[dimension].toFixed(1)}</b>
                  </li>
                ))}
              </ul>
              {view.comments ? (
                <p className="pelican-comments">{view.comments}</p>
              ) : null}
            </div>
          ) : (
            <div className="pelican-scores pelican-scores-empty">
              <JudgeModeBadge mode={view.judgeMode} />
              <p className="pelican-muted">
                {judgeFailed ? "评分失败，可在下方重跑裁判。" : "等待评分…"}
              </p>
            </div>
          )}

          {view.usage &&
          (view.usage.inputTokens || view.usage.outputTokens) ? (
            <p className="pelican-usage">
              Tokens：输入 {view.usage.inputTokens ?? 0} · 输出{" "}
              {view.usage.outputTokens ?? 0}
            </p>
          ) : null}

          <div className="pelican-viewer-tools">
            <details>
              <summary>原始 SVG</summary>
              <pre className="pelican-code">
                <code>{view.svg}</code>
              </pre>
            </details>
            {view.judgeRaw ? (
              <details>
                <summary>裁判 JSON</summary>
                <pre className="pelican-code">
                  <code>{view.judgeRaw}</code>
                </pre>
              </details>
            ) : null}
          </div>

          <div className="pelican-tos">
            {view.scored ? (
              <button
                type="button"
                onClick={saveToTos}
                disabled={savingTos || running}
              >
                {savingTos
                  ? "保存中…"
                  : view.tosObjectKey
                    ? "重新保存到 TOS"
                    : "保存到 TOS"}
              </button>
            ) : null}
            {view.tosObjectKey ? (
              <code className="pelican-tos-key">{view.tosObjectKey}</code>
            ) : null}
            {tosMessage ? (
              <span className="pelican-tos-msg">{tosMessage}</span>
            ) : null}
          </div>

          {judgeFailed && !running ? (
            <div className="pelican-rejudge">
              {renderBlocked ? (
                <button
                  type="button"
                  onClick={rejudgeAsSource}
                  disabled={!costConfirmed}
                >
                  改用源码裁判重评
                </button>
              ) : (
                <button
                  type="button"
                  onClick={rejudgeSameMode}
                  disabled={!costConfirmed}
                >
                  仅重跑裁判
                </button>
              )}
              <span className="pelican-muted">重跑裁判仍会产生真实调用费用。</span>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="pelican-history" aria-label="历史记录与时间序列">
        <div className="pelican-history-head">
          <h3>历史记录与时间序列</h3>
          <label className="pelican-filter">
            <span>按模型筛选</span>
            <select
              value={historyFilterModel}
              onChange={(event) => setHistoryFilterModel(event.target.value)}
            >
              <option value="">全部模型（{history.length}）</option>
              {historyModels.map(([name, count]) => (
                <option key={name} value={name}>
                  {name}（{count}）
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="pelican-muted">
            暂无本地历史记录。历史仅保存在浏览器本机（上限 {PELICAN_MAX_HISTORY}{" "}
            条），不写数据库、不进素材库索引。
          </p>
        ) : (
          <div className="pelican-table-wrap">
            <table className="pelican-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>总分</th>
                  <th>物种</th>
                  <th>车架</th>
                  <th>姿态</th>
                  <th>交互</th>
                  <th>SVG</th>
                  <th>裁判模式</th>
                  <th>Δ 较上次</th>
                  <th>TOS</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((record) => {
                  const index = history.findIndex((item) => item.id === record.id);
                  const prev = previousOverall(history, index);
                  const delta = prev === null ? null : record.overall - prev;
                  return (
                    <tr
                      key={record.id}
                      className={selectedHistoryId === record.id ? "is-selected" : ""}
                    >
                      <td>{formatTime(record.createdAt)}</td>
                      <td className="pelican-cell-overall">
                        {record.overall.toFixed(1)}
                      </td>
                      {PELICAN_DIMENSIONS.map((dimension) => (
                        <td key={dimension}>{record.scores[dimension].toFixed(1)}</td>
                      ))}
                      <td>
                        <JudgeModeBadge mode={record.judgeMode} />
                      </td>
                      <td>
                        {delta === null ? (
                          "—"
                        ) : (
                          <span
                            className={
                              delta >= 0 ? "pelican-delta-up" : "pelican-delta-down"
                            }
                          >
                            {delta >= 0 ? "+" : ""}
                            {delta.toFixed(1)}
                          </span>
                        )}
                      </td>
                      <td>{record.tosObjectKey ? "已存档" : "—"}</td>
                      <td className="pelican-cell-actions">
                        <button
                          type="button"
                          onClick={() => loadHistoryRecord(record)}
                        >
                          查看
                        </button>
                        {record.tosObjectKey ? (
                          <button
                            type="button"
                            onClick={() => readFromTos(record.tosObjectKey as string)}
                            disabled={readingTos}
                          >
                            从 TOS 读取
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => deleteHistoryRecord(record.id)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="pelican-note">
          同一模型跨裁判模式的分数口径不同，Δ 仅在同模型同模式内比较，不做跨模式排名。
        </p>
      </section>
    </div>
  );
}

function JudgeModeBadge({ mode }: { mode: JudgeMode }) {
  return (
    <span className={`pelican-badge is-${mode}`}>
      {mode === "vision" ? "视觉裁判" : "源码裁判"}
    </span>
  );
}

function phaseLabel(phase: Phase): string {
  if (phase === "generate") return "生成中…";
  if (phase === "render") return "本地栅格化中…";
  if (phase === "judge") return "裁判评分中…";
  return "空闲";
}

function outcomeLabel(outcome: Outcome): string {
  if (outcome === "success") return "完成";
  if (outcome === "partial") return "部分完成（评分失败）";
  if (outcome === "error") return "失败";
  return "";
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Δ compares against the previous run of the SAME model AND SAME judge mode,
// since cross-mode scores are not directly comparable.
function previousOverall(list: PelicanRun[], index: number): number | null {
  if (index < 0) return null;
  const current = list[index];
  for (let i = index + 1; i < list.length; i += 1) {
    if (
      list[i].model === current.model &&
      list[i].judgeMode === current.judgeMode
    ) {
      return list[i].overall;
    }
  }
  return null;
}

async function callResponses(
  apiKey: string,
  baseUrl: string,
  requestBody: unknown,
): Promise<unknown> {
  // Pelican-dedicated create-only proxy: the shared /api/responses route keeps
  // its fixed upstream locked by contract, so the manual Base URL goes here.
  const response = await fetch("/api/pelican/responses", {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ apiKey, baseUrl, requestBody }),
  });
  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(responseErrorMessage(body, response.status));
  }
  return body;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function responseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const error = record.error;
    if (typeof error === "string" && error) return error;
    if (error && typeof error === "object") {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === "string" && message) return message;
    }
    if (typeof record.message === "string" && record.message) {
      return record.message;
    }
  }
  return `请求失败（HTTP ${status}）。`;
}

function extractOutputText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const record = body as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;
  const output = record.output;
  if (!Array.isArray(output)) return "";
  const parts: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part && typeof part === "object") {
        const text = (part as Record<string, unknown>).text;
        if (typeof text === "string" && text) parts.push(text);
      }
    }
  }
  return parts.join("\n");
}

function extractUsage(body: unknown): PelicanUsage | undefined {
  if (!body || typeof body !== "object") return undefined;
  const usage = (body as Record<string, unknown>).usage;
  if (!usage || typeof usage !== "object") return undefined;
  const record = usage as Record<string, unknown>;
  const inputTokens =
    typeof record.input_tokens === "number" ? record.input_tokens : undefined;
  const outputTokens =
    typeof record.output_tokens === "number" ? record.output_tokens : undefined;
  if (inputTokens === undefined && outputTokens === undefined) return undefined;
  return {
    ...(inputTokens !== undefined ? { inputTokens } : {}),
    ...(outputTokens !== undefined ? { outputTokens } : {}),
  };
}

function mergeUsage(
  generation?: PelicanUsage,
  judge?: PelicanUsage,
): PelicanUsage | undefined {
  if (!generation && !judge) return undefined;
  const inputTokens = (generation?.inputTokens ?? 0) + (judge?.inputTokens ?? 0);
  const outputTokens =
    (generation?.outputTokens ?? 0) + (judge?.outputTokens ?? 0);
  return {
    ...(inputTokens ? { inputTokens } : {}),
    ...(outputTokens ? { outputTokens } : {}),
  };
}

function readOfficialCredential(): string {
  try {
    const raw = window.localStorage.getItem(PELICAN_CREDENTIAL_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { official?: unknown };
    return typeof parsed.official === "string" ? parsed.official : "";
  } catch {
    return "";
  }
}

function writeOfficialCredential(apiKey: string) {
  try {
    const raw = window.localStorage.getItem(PELICAN_CREDENTIAL_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    if (apiKey.trim()) parsed.official = apiKey;
    else delete parsed.official;
    window.localStorage.setItem(PELICAN_CREDENTIAL_KEY, JSON.stringify(parsed));
  } catch {
    // Browser storage is optional; the in-memory credential stays usable.
  }
}

function isPelicanRun(value: unknown): value is PelicanRun {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.svg === "string" &&
    typeof record.model === "string" &&
    (record.judgeMode === "vision" || record.judgeMode === "source")
  );
}

function isScoredPelicanRun(value: unknown): value is PelicanRun {
  if (!isPelicanRun(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Boolean(record.scores) &&
    typeof record.scores === "object" &&
    typeof record.overall === "number"
  );
}

function readHistory(): PelicanRun[] {
  try {
    const raw = window.localStorage.getItem(PELICAN_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPelicanRun).slice(0, PELICAN_MAX_HISTORY);
  } catch {
    return [];
  }
}

function writeHistory(history: PelicanRun[]) {
  try {
    window.localStorage.setItem(
      PELICAN_HISTORY_KEY,
      JSON.stringify(history.slice(0, PELICAN_MAX_HISTORY)),
    );
  } catch {
    // Browser storage is optional; history stays in memory for this session.
  }
}
