"use client";

import { useEffect, useState } from "react";
import {
  WORKSPACE_NAVIGATE_EVENT,
  type WorkspaceView,
} from "../lib/workspace-navigation";
import { AiCodingWorkbench } from "./AiCodingWorkbench";
import { ManagedAgentsWorkbench } from "./ManagedAgentsWorkbench";
import { LlmTrendsWorkbench } from "./LlmTrendsWorkbench";
import { ResponsesWorkbench } from "./ResponsesWorkbench";
import { SeedanceExampleGallery } from "./SeedanceExampleGallery";
import { SeedanceTaskRunner } from "./SeedanceTaskRunner";
import { SeedreamWorkbench } from "./SeedreamWorkbench";
import { TemplateAssetLibrary } from "./TemplateAssetLibrary";

const WORKSPACE_VIEWS: Array<{
  id: WorkspaceView;
  index: string;
  label: string;
  shortLabel: string;
}> = [
  { id: "templates", index: "01", label: "模板资产库", shortLabel: "模板" },
  { id: "seedance", index: "02", label: "Seedance", shortLabel: "视频" },
  { id: "seedream", index: "03", label: "Seedream", shortLabel: "图片" },
  { id: "responses", index: "04", label: "Responses API", shortLabel: "Resp." },
  {
    id: "managed-agents",
    index: "05",
    label: "Managed Agents",
    shortLabel: "Agent",
  },
  {
    id: "llm-trends",
    index: "06",
    label: "LLM 趋势",
    shortLabel: "趋势",
  },
  {
    id: "ai-coding",
    index: "07",
    label: "AI coding",
    shortLabel: "Code",
  },
];

function viewFromHash(): WorkspaceView {
  const hash = window.location.hash;
  if (
    window.location.hash.startsWith("#templates") ||
    window.location.hash.startsWith("#materials")
  ) {
    return "templates";
  }
  if (
    ["#seedance", "#top", "#sample", "#operations"].some((anchor) =>
      hash.startsWith(anchor),
    )
  ) {
    return "seedance";
  }
  if (window.location.hash.startsWith("#seedream")) return "seedream";
  if (window.location.hash.startsWith("#managed-agents")) {
    return "managed-agents";
  }
  if (window.location.hash.startsWith("#responses")) return "responses";
  if (
    [
      "#llm-trends",
      "#model-landscape",
      "#benchmark-lens",
      "#leaderboards",
      "#trend-sources",
    ].some((anchor) => hash.startsWith(anchor))
  ) {
    return "llm-trends";
  }
  if (
    [
      "#ai-coding",
      "#agent-assets",
      "#project-assets",
      "#code-quality",
      "#ai-metrics",
    ].some((anchor) => hash.startsWith(anchor))
  ) {
    return "ai-coding";
  }
  return "templates";
}

export function WorkspaceShell() {
  const [view, setView] = useState<WorkspaceView>("templates");

  useEffect(() => {
    function syncHash() {
      setView(viewFromHash());
      const targetId = window.location.hash.slice(1);
      if (!targetId) return;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document
            .getElementById(targetId)
            ?.scrollIntoView({ behavior: "auto", block: "start" });
        });
      });
    }

    function handleNavigate(event: Event) {
      const nextView = (event as CustomEvent<WorkspaceView>).detail;
      if (
        nextView !== "seedance" &&
        nextView !== "templates" &&
        nextView !== "seedream" &&
        nextView !== "managed-agents" &&
        nextView !== "responses" &&
        nextView !== "llm-trends" &&
        nextView !== "ai-coding"
      ) {
        return;
      }
      setView(nextView);
      const nextHash =
        nextView === "templates"
          ? "#templates"
          : nextView === "seedream"
            ? "#seedream"
            : nextView === "managed-agents"
              ? "#managed-agents"
              : nextView === "responses"
                ? "#responses"
                : nextView === "llm-trends"
                  ? "#llm-trends"
                  : nextView === "ai-coding"
                    ? "#ai-coding"
                : "#operations";
      window.history.replaceState(null, "", nextHash);
      window.setTimeout(() => {
        document
          .getElementById(
            nextView === "templates"
              ? "templates"
              : nextView === "seedream"
                ? "seedream"
                : nextView === "managed-agents"
                  ? "managed-agents"
                  : nextView === "responses"
                    ? "responses"
                    : nextView === "llm-trends"
                      ? "llm-trends"
                      : nextView === "ai-coding"
                        ? "ai-coding"
                    : "operations",
          )
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener(WORKSPACE_NAVIGATE_EVENT, handleNavigate);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener(WORKSPACE_NAVIGATE_EVENT, handleNavigate);
    };
  }, []);

  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    if (!targetId) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "auto", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [view]);

  function selectView(nextView: WorkspaceView) {
    setView(nextView);
    const nextHash =
      nextView === "templates"
        ? "#templates"
        : nextView === "seedance"
          ? "#seedance"
        : nextView === "seedream"
          ? "#seedream"
          : nextView === "managed-agents"
            ? "#managed-agents"
            : nextView === "responses"
              ? "#responses"
              : nextView === "llm-trends"
                ? "#llm-trends"
                : nextView === "ai-coding"
                  ? "#ai-coding"
              : "#top";
    window.history.replaceState(null, "", nextHash);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main>
      <header className="topbar">
        <button
          className="brand brand-button"
          onClick={() => selectView("templates")}
          type="button"
          aria-label="返回模板资产库顶部"
        >
          <span className="brand-mark">ARK</span>
          <span>
            <strong>火山方舟 Demo Studio</strong>
            <small>全链路 API 演示控制台</small>
          </span>
        </button>

        <nav className="workspace-switcher" aria-label="顶级栏目">
          {WORKSPACE_VIEWS.map((item) => (
            <button
              aria-current={view === item.id ? "page" : undefined}
              className={view === item.id ? "is-active" : ""}
              data-short-label={item.shortLabel}
              data-testid={`workspace-${item.id}`}
              key={item.id}
              onClick={() => selectView(item.id)}
              type="button"
            >
              <span className="workspace-tab-index">{item.index}</span>
              <span className="workspace-tab-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <a
            className="doc-link"
            href={
              view === "responses"
                ? "https://docs.volcengine.com/docs/82379/1585128?lang=zh"
                : view === "ai-coding"
                ? "https://docs.trae.cn/cli_what-is-trae-cli"
                : view === "llm-trends"
                ? "https://www.volcengine.com/product/doubao"
                : view === "managed-agents"
                ? "https://docs.volcengine.com/docs/82379/2553714?lang=zh"
                : view === "seedream"
                  ? "https://docs.volcengine.com/docs/82379/1824121?lang=zh"
                : "https://docs.volcengine.com/docs/82379/2291680?lang=zh"
            }
            target="_blank"
            rel="noreferrer"
          >
            <span className="doc-link-full">
              {view === "ai-coding" ? "实践来源 ↗" : "官方 API 文档 ↗"}
            </span>
            <span className="doc-link-short">文档 ↗</span>
          </a>
        </div>
      </header>

      <div
        className="workspace-view"
        data-active={view === "seedance"}
        hidden={view !== "seedance"}
      >
        <section className="hero demo-hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">SEEDANCE API DEMO CONSOLE</p>
            <h1>
              视频生成
              <br />
              API 工作台
            </h1>
            <p className="hero-summary">
              标准 API / Agent Plan · 请求编辑 · 任务状态 · 脱敏日志
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="#operations">
                开始配置
              </a>
              <a className="secondary-action" href="#sample">
                官方示例
              </a>
              <button
                className="text-action"
                onClick={() => selectView("templates")}
                type="button"
              >
                模板资产库 →
              </button>
            </div>
          </div>

          <aside className="hero-panel demo-flow-panel" aria-label="演示流程">
            <div className="panel-topline">
              <span>演示流程</span>
              <span className="progress-label">LIVE</span>
            </div>
            <ol className="objective-list">
              <li>
                <span>01</span>
                选择 API 通道、模型与凭证
              </li>
              <li>
                <span>02</span>
                编辑素材与输出参数
              </li>
              <li>
                <span>03</span>
                审核完整 Method、URL、Headers 与 Body
              </li>
              <li>
                <span>04</span>
                提交任务并打开请求 / 响应日志
              </li>
            </ol>
            <div className="security-note">
              <span aria-hidden="true">✦</span>
              <p>
                <strong>本地记录</strong>
                最近 30 次任务；含状态、结果与脱敏日志。
              </p>
            </div>
          </aside>
        </section>

        <SeedanceExampleGallery />

        <section className="config-section" id="operations">
          <div className="section-heading">
            <div>
              <p className="eyebrow">实操控制台</p>
              <h2>配置、审核、提交、追踪</h2>
            </div>
            <p>
              表单 ↔ Request Body 双向联动；自动记录创建与状态查询日志。
            </p>
          </div>
          <SeedanceTaskRunner />
        </section>
      </div>

      <div
        className="workspace-view"
        data-active={view === "templates"}
        hidden={view !== "templates"}
      >
        <TemplateAssetLibrary />
      </div>

      <div
        className="workspace-view"
        data-active={view === "seedream"}
        hidden={view !== "seedream"}
      >
        <SeedreamWorkbench />
      </div>

      <div
        className="workspace-view"
        data-active={view === "managed-agents"}
        hidden={view !== "managed-agents"}
      >
        <ManagedAgentsWorkbench />
      </div>

      <div
        className="workspace-view"
        data-active={view === "responses"}
        hidden={view !== "responses"}
      >
        <ResponsesWorkbench />
      </div>

      <div
        className="workspace-view"
        data-active={view === "llm-trends"}
        hidden={view !== "llm-trends"}
      >
        <LlmTrendsWorkbench />
      </div>

      <div
        className="workspace-view"
        data-active={view === "ai-coding"}
        hidden={view !== "ai-coding"}
      >
        <AiCodingWorkbench />
      </div>

      <footer>
        <p>火山方舟 API 演示与模板资产平台</p>
        <span>
          Seedance · Seedream · Responses API · Managed Agents · LLM 趋势 · AI coding ·
          完整请求审核 · 历史与脱敏日志
        </span>
      </footer>
    </main>
  );
}
