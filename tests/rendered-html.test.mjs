import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

async function request(path = "/", init) {
  const worker = await loadWorker();
  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
      ...init,
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test("server-renders the Ark demonstration platform", async () => {
  const response = await request();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /火山方舟 API 演示与模板资产平台/);
  assert.match(
    html,
    /property="og:image" content="http:\/\/localhost:3001\/og-llm-trends\.png"/,
  );
  assert.match(html, /模板资产库/);
  assert.match(html, /Seedance/);
  assert.match(html, /Seedream/);
  assert.match(html, /Managed Agents/);
  assert.match(html, /LLM 趋势/);
  assert.match(html, /AI coding/);
  assert.match(html, /顶级栏目/);
  assert.match(html, /全链路 API 演示控制台/);
  assert.equal((html.match(/data-short-label=/g) ?? []).length, 7);
  assert.ok(
    html.indexOf('data-testid="workspace-templates"') <
      html.indexOf('data-testid="workspace-seedance"'),
    "the template library should be the first top-level studio",
  );
  assert.ok(
    html.indexOf('data-testid="workspace-seedance"') <
      html.indexOf('data-testid="workspace-seedream"'),
    "Seedance should appear before Seedream",
  );
  assert.ok(
    html.indexOf('data-testid="workspace-responses"') <
      html.indexOf('data-testid="workspace-managed-agents"'),
    "Responses API should appear before Managed Agents in the presentation flow",
  );
  assert.ok(
    html.indexOf('data-testid="workspace-managed-agents"') <
      html.indexOf('data-testid="workspace-llm-trends"'),
    "LLM trends should appear before AI coding",
  );
  assert.ok(
    html.indexOf('data-testid="workspace-llm-trends"') <
      html.indexOf('data-testid="workspace-ai-coding"'),
    "AI coding should close the top-level presentation flow",
  );
  assert.match(html, /SEEDANCE API DEMO CONSOLE/);
  assert.match(html, /视频生成/);
  assert.match(html, /API 工作台/);
  assert.match(html, /八类官方示例/);
  assert.doesNotMatch(html, /从完整请求|一路演示到结果|八条能力链路/);
  assert.doesNotMatch(html, /共学|STEP 03|当前检测结果|环境就绪|共学路线/);
  assert.match(html, /将视频1礼盒中的香水替换成图片1中的面霜/);
  for (const title of [
    "官方示例任务一：把香水替换成面霜",
    "官方示例任务二：多模态参考",
    "官方示例任务三：延长视频",
    "官方示例任务四：输出 4k 视频",
    "官方示例任务五：使用联网搜索",
    "官方示例任务六：使用预置虚拟人像",
    "官方示例任务七：图生视频-基于首尾帧（含音频）",
    "官方示例任务八：生成多个连续视频",
  ]) {
    assert.match(html, new RegExp(title));
  }
  assert.equal((html.match(/填入参数/g) ?? []).length, 8);
  assert.ok(
    html.indexOf('id="sample"') < html.indexOf('id="operations"'),
    "the official sample should appear before the operations console",
  );
  assert.match(html, /ark\.cn-beijing\.volces\.com\/api\/v3/);
  assert.match(html, /官方 API（标准按量调用）/);
  assert.match(html, /Agent Plan API（套餐通道）/);
  assert.match(html, /doubao-seedance-2-0-fast-260128/);
  assert.match(html, /doubao-seedance-2-0-mini-260615/);
  assert.match(html, /doubao-seedance-1-5-pro-251215/);
  assert.match(html, /即将下线/);
  assert.match(html, /option value="official" selected=""/);
  assert.match(
    html,
    /option value="doubao-seedance-2-0-mini-260615" selected=""/,
  );
  assert.match(html, /type="password"/);
  assert.match(html, /演示模式已开启：Key 会保存在当前浏览器/);
  assert.match(html, /完整 API 请求详情/);
  assert.match(html, /完整 API 请求体/);
  assert.match(html, /双向联动/);
  assert.match(html, /执行真实视频生成任务/);
  assert.match(html, /每 30 秒查询一次/);
  assert.match(html, /产生费用/);
  assert.match(html, /演示模式：在当前浏览器记住 API Key/);
  assert.match(html, /历史任务/);
  assert.match(html, /暂无历史任务/);
  assert.doesNotMatch(html, /codex-preview/);
  assert.doesNotMatch(html, /react-loading-skeleton/);
});

test("keeps the seven-studio shell compact and anchor-safe across breakpoints", async () => {
  const source = await readFile(
    new URL("../app/components/WorkspaceShell.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(source, /const WORKSPACE_VIEWS/);
  assert.match(source, /data-short-label=\{item\.shortLabel\}/);
  assert.match(source, /className="module-position"/);
  assert.match(source, /getElementById\(targetId\)/);
  assert.match(source, /window\.requestAnimationFrame/);
  assert.match(source, /scrollIntoView\(\{ behavior: "auto", block: "start" \}\)/);
  assert.doesNotMatch(source, /"#flagship-matrix"/);
  assert.match(source, /"#benchmark-lens"/);
  assert.match(source, /"#leaderboards"/);
  assert.match(styles, /body\s*\{[^}]*overflow-x: clip/s);
  assert.match(
    styles,
    /#responses,[\s\S]*?scroll-margin-top: calc\(var\(--stage-topbar\) \+ 22px\)/,
  );
  assert.match(
    styles,
    /@media \(max-width: 860px\)[\s\S]*?grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/,
  );
  assert.match(styles, /content: attr\(data-short-label\)/);
});

test("server-renders the product-neutral AI coding practice studio", async () => {
  const response = await request();
  const html = await response.text();
  const source = await readFile(
    new URL("../app/components/AiCodingWorkbench.tsx", import.meta.url),
    "utf8",
  );
  const data = await readFile(
    new URL("../app/lib/ai-coding-data.ts", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(html, /ENTERPRISE AI DELIVERY SYSTEM/);
  assert.match(html, /可验证交付体系/);
  assert.match(html, /先解决三个生产问题/);
  assert.match(html, /用一个存量接口变更演示完整闭环/);
  assert.match(html, /知识分层：同一项目/);
  assert.match(html, /完成任务不是终点，护栏变强才是闭环/);
  for (const stage of ["SPECIFY", "CONTEXT", "PLAN", "IMPLEMENT", "VALIDATE", "EVOLVE"]) {
    assert.match(html, new RegExp(stage));
  }
  assert.match(html, /Agent 资产管理/);
  assert.doesNotMatch(html, /Agent 资产治理/);
  assert.match(html, /项目资产/);
  assert.match(html, /代码质量/);
  assert.match(html, /AI 效能度量/);
  assert.match(html, /核心场景/);
  assert.match(html, /最佳实践/);
  assert.match(html, /落地验收/);
  assert.match(html, /可复制模板/);
  assert.equal((html.match(/data-copy-template=/g) ?? []).length, 18);
  for (const asset of [
    "Rules",
    "Skills",
    "MCP",
    "Memory",
    "Hooks",
    "Plugins",
    "Commands",
    "Subagents",
  ]) {
    assert.match(html, new RegExp(`>${asset}<`));
  }
  for (const projectAsset of [
    "Wiki 文档",
    "知识卡片",
    "AGENTS.md",
    "启动入口",
    "验证入口",
    "测试规模",
  ]) {
    assert.match(html, new RegExp(projectAsset.replace(".", "\\.")));
  }
  for (const gate of [
    "AI 代码自检",
    "Review Agent",
    "Agent 验收",
    "人工审查",
  ]) {
    assert.match(html, new RegExp(gate));
  }
  for (const metric of [
    "AI 代码行数 TOP 3",
    "AI 代码入库率 TOP 3",
    "Skill 使用率 TOP 3",
    "MCP 使用率 TOP 3",
    "Token 消耗量 TOP 3",
    "需求交付周期 P50",
  ]) {
    assert.match(html, new RegExp(metric));
  }
  for (const ranking of [
    "128.6 万行",
    "78.6%",
    "代码审查",
    "68.2%",
    "代码仓库只读",
    "61.8%",
    "1.28 亿",
  ]) {
    assert.match(html, new RegExp(ranking));
  }
  assert.match(html, /北极星不是生成代码行数/);
  assert.match(html, /星河零售集团（模拟）/);
  assert.match(html, /SIMULATED DATA/);
  assert.match(html, /关联 API 接口详情/);
  assert.match(html, /\/api\/ai-coding\/metrics/);
  assert.match(html, /X-Data-Mode: simulation/);
  for (const productionPractice of [
    "idempotency_key",
    "git diff --check",
    "CODEOWNERS",
    "P0 | P1 | P2 | P3",
    "flaky_rate_max",
    "dependent_files",
    "source_files",
    "depends_on",
    "related_to",
    "概述.md",
    "架构设计.md",
    "_module.yaml",
    "_index.yaml",
    "repowiki-metadata.json",
    "来源 Diff 触发局部重建或失效",
  ]) {
    assert.match(html, new RegExp(productionPractice.replaceAll("|", "\\|")));
  }
  assert.match(source, /同源只读模拟接口；无凭证、无外部请求、无真实组织数据/);
  assert.match(source, /navigator\.clipboard\.writeText/);
  assert.match(data, /data_mode: "simulation"/);
  assert.match(data, /ai_code_lines_top3/);
  assert.match(data, /skill_usage_rate_top3/);
  assert.match(data, /token_consumption_top3/);
  assert.match(
    styles,
    /\.ai-coding-asset-grid article\s*\{[^}]*min-width: 0/s,
  );
  assert.match(
    styles,
    /@media \(max-width: 620px\)[\s\S]*?\.ai-coding-lifecycle,[\s\S]*?\.ai-coding-metric-grid\s*\{\s*grid-template-columns: minmax\(0, 1fr\)/,
  );
  assert.doesNotMatch(source, /模拟项目列表|REVIEW SAMPLE|PR #8421|AI_CODING_PROJECTS/);
  assert.doesNotMatch(source, /asset\.(count|coverage)/);
  const practiceStart = html.indexOf('id="practice-loop"');
  const metricsStart = html.indexOf('id="ai-metrics"');
  assert.ok(practiceStart >= 0 && metricsStart > practiceStart);
  assert.doesNotMatch(html.slice(practiceStart, metricsStart), /模拟|SIMULATION/);
  assert.doesNotMatch(source, />\s*(TRAE|Qoder)\s*</i);
});

test("serves organization-level AI coding rankings from the local simulation API", async () => {
  const response = await request(
    "/api/ai-coding/metrics?org_id=org_nebula_retail&period=30d&scope=organization",
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-data-mode"), "simulation");
  const payload = await response.json();
  assert.equal(payload.data_mode, "simulation");
  assert.equal(payload.filters.scope, "organization");
  assert.equal(payload.metrics.length, 6);
  assert.equal(payload.metrics[0].id, "ai_code_lines_top3");
  assert.equal(payload.metrics[0].ranking.length, 3);
  assert.equal(payload.metrics[0].ranking[0].name, "交易研发");
  assert.equal(payload.metrics[2].ranking[0].name, "代码审查");
  assert.equal(payload.quality.escaped_defects, 4);
  assert.equal(payload.quality.auto_merge_rate, 0);

  const invalid = await request(
    "/api/ai-coding/metrics?org_id=org_nebula_retail&period=365d&scope=organization",
  );
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, "unsupported_period");
});

test("server-renders the LLM trends research snapshot without live API work", async () => {
  const response = await request();
  const html = await response.text();
  const source = await readFile(
    new URL("../app/components/LlmTrendsWorkbench.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(html, /MARKET SNAPSHOT · 2026\.08\.04/);
  assert.match(html, /LLM/);
  assert.match(html, /第三方测评/);
  assert.doesNotMatch(html, /文本模型 Benchmark/);
  assert.doesNotMatch(source, /id="flagship-matrix"/);
  assert.match(html, /单项测评/);
  assert.match(html, /数据来源/);
  assert.doesNotMatch(html, /先分赛道/);
  assert.doesNotMatch(html, /两类榜单，各回答不同问题/);
  assert.doesNotMatch(html, /能力、Agent 表现与知识工作交付如何量化/);
  assert.match(html, /Doubao-Seed-2\.1-Pro/);
  assert.match(html, /Seedance 2\.5/);
  assert.match(html, /Seedream 5\.0 Pro/);
  assert.equal((html.match(/<span>友商比较<\/span>/g) ?? []).length, 3);
  assert.doesNotMatch(html, /COMPETITOR SET/);
  for (const model of [
    "Claude Fable 5",
    "GPT-5.6 Sol",
    "Qwen3.8-Max",
    "Kimi K3",
    "GLM-5.2",
    "DeepSeek-V4-Flash-0731",
    "MiniMax M3",
  ]) {
    assert.match(html, new RegExp(model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const model of [
    "Claude Opus 5",
    "Claude Sonnet 5",
    "GPT-5.6 Terra",
    "GPT-5.6 Luna",
    "Qwen3.7-Plus",
    "DeepSeek-V4-Flash-0731",
    "Sora 2 Pro",
    "Sora 2",
    "Wan2.7 T2V",
    "MiniMax H3",
    "Doubao-Seedance-2.0",
    "Doubao-Seedance-2.0-Fast",
    "Doubao-Seedance-2.0-Mini",
    "Doubao-Seedream-5.0-Pro",
    "Doubao-Seedream-5.0-Lite",
    "Qwen Image 2.0 Pro",
    "Qwen Image 2.0",
  ]) {
    assert.match(source, new RegExp(model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(
    source,
    /model: "Doubao-Seedream-5\.0-Pro",[\s\S]*?price: "¥0\.30 \/ ¥0\.60",[\s\S]*?priceNote: "≤2\.36MP \/ >2\.36MP · 每张"/,
  );
  assert.doesNotMatch(
    source,
    /model: "Doubao-Seedream-5\.0-Pro",[\s\S]{0,180}?price: "未公开"/,
  );
  assert.match(
    source,
    /model: "Seedance 2\.5",[\s\S]*?price: "¥1\.51 \/ 秒",[\s\S]*?priceNote: "720p · 16:9 · 5 秒 · 输入不含视频（官方估算）"/,
  );
  assert.match(
    source,
    /model: "Doubao-Seedance-2\.0",[\s\S]*?price: "¥0\.99 \/ 秒",[\s\S]*?spec: "720p：¥46 \/ 百万 tokens；含视频输入为 ¥28"/,
  );
  assert.match(
    source,
    /model: "Doubao-Seedance-2\.0-Fast",[\s\S]*?price: "¥0\.80 \/ 秒",[\s\S]*?spec: "720p：¥37 \/ 百万 tokens；含视频输入为 ¥22"/,
  );
  assert.match(
    source,
    /model: "Doubao-Seedance-2\.0-Mini",[\s\S]*?price: "¥0\.50 \/ 秒",[\s\S]*?spec: "720p：¥23 \/ 百万 tokens；含视频输入为 ¥14"/,
  );
  assert.match(
    source,
    /model: "MiniMax H3",[\s\S]*?price: "¥0\.50 \/ 秒",[\s\S]*?priceNote: "768P 输出；2K 为 ¥0\.80 \/ 秒"/,
  );
  assert.match(source, /纯生成、按输出秒比较：Seedance 系列为 720p、16:9、5 秒官方示例，H3 为 768P 刊例价/);
  assert.match(source, /const \[expandedTrack, setExpandedTrack\] = useState<TrackId \| null>\(null\)/);
  assert.match(source, /aria-expanded=\{expandedTrack === track\.id\}/);
  assert.match(source, /current === track\.id \? null : track\.id/);
  assert.doesNotMatch(source, /trend-price-strip/);
  assert.match(source, /Doubao-Seed-2\.1-Turbo/);
  assert.match(source, /className="trend-model-comparison-table"/);
  assert.match(source, /activeTrack\.id === "text"/);
  assert.match(source, /activeTrack\.id === "video"/);
  assert.doesNotMatch(source, /className="trend-competitor-grid"/);
  assert.match(styles, /\.trend-compare-button\s*\{/);
  assert.match(styles, /\.trend-track-expansion\s*\{/);
  assert.match(styles, /\.trend-model-comparison-table\s*\{[^}]*min-width: 1080px/s);
  for (const benchmark of [
    "NL2Repo-Bench",
    "SciCode",
    "Terminal-Bench 2.1",
    "SWE Pro",
    "Agents’ Last Exam (ALE)",
    "MCP-Atlas",
    "DeepSWE",
    "OSWorld",
    "MMMU-Pro",
  ]) {
    assert.match(html, new RegExp(benchmark.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(source, /id: "gdpval"/);
  assert.doesNotMatch(source, /label: "GDPval"/);
  assert.match(source, /id: "deepSwe"/);
  assert.match(source, /113 项长程软件工程任务；3 次运行平均 pass@1/);
  assert.match(source, /value: "72\.7%"[\s\S]*?OpenAI 官方发布 · DeepSWE v1\.1 \/ max/);
  assert.match(source, /value: "66\.0%"[\s\S]*?AA v1\.3 · Claude Code \/ max \+ fallback/);
  assert.match(source, /value: "67\.5%"[\s\S]*?Kimi 官方模型卡 · Kimi Code \/ max/);
  assert.match(source, /value: "46\.2%"[\s\S]*?GLM 官方模型卡 · mini-swe-agent/);
  assert.match(source, /model: "DeepSeek-V4-Flash-0731"[\s\S]*?value: "54\.2%"[\s\S]*?DeepSeek Harness 极简模式 \/ max/);
  assert.match(source, /value: "82\.7%"[\s\S]*?DeepSeek 官方 · DeepSeek Harness 极简模式 \/ max/);
  assert.match(source, /value: "25\.2%"[\s\S]*?Agent Last Exam \/ Agent 框架未单独披露/);
  assert.match(source, /value: "54\.4%"[\s\S]*?DeepSeek 官方 · DeepSeek Harness 极简模式 \/ max/);
  assert.match(source, /model: "DeepSeek-V4-Flash-0731"[\s\S]*?price: "¥1 \/ ¥2"/);
  assert.match(source, /model: "Qwen3\.8-Max"[\s\S]*?parameters: "2\.4T \/ 95B 激活"/);
  assert.match(source, /value: "86\.6%"[\s\S]*?Qwen 官方 · Claude Code \/ avg@10/);
  assert.match(source, /value: "67\.7%"[\s\S]*?Qwen 官方 · Claude Code/);
  assert.match(source, /value: "56\.6%"[\s\S]*?Qwen 官方 · DeepSWE 1\.1 \/ Claude Code/);
  assert.match(source, /value: "55\.9%"[\s\S]*?Qwen 官方 · Claude Code/);
  assert.match(source, /value: "27\.0%"[\s\S]*?Qwen 官方 · Pass \/ Agent 框架未披露/);
  assert.match(source, /value: "86\.1%"[\s\S]*?Qwen 官方 · OSWorld-Verified \/ 框架未披露/);
  assert.match(source, /value: "82\.3%"[\s\S]*?Qwen 官方 · 内部评估 \/ 无 Agent 框架/);
  assert.match(source, /Qwen 官方未发布 SciCode \/ Agent 框架/);
  assert.match(source, /DeepSeek 官方未发布 SciCode 同名结果/);
  assert.match(source, /DeepSeek V4 Flash High[\s\S]*?1577 \+18\/-18 · Preliminary/);
  assert.match(source, /DeepSeek V4 Flash 0731 · max：50；未进入 Top 10/);
  assert.match(source, /Qwen 官方未发布 MCP-Atlas \/ Agent 框架/);
  assert.doesNotMatch(source, /label: "AA Coding Agent Index"/);
  assert.match(source, /model: "Claude Opus 4\.6"/);
  assert.match(html, /标准对照/);
  assert.doesNotMatch(html, /data-priority="highlight"/);
  assert.doesNotMatch(html, />重点<\/b>/);
  assert.doesNotMatch(source, /featured: true/);
  assert.match(source, /useState<BenchmarkKey>\("ale"\)/);
  assert.match(html, /Long-Horizon/);
  assert.match(html, /本次检索未找到同口径公开值/);
  assert.match(source, /https:\/\/qwen\.ai\/blog\?id=qwen3\.8/);
  assert.doesNotMatch(source, /model: "Qwen3\.7-Max"/);
  assert.match(source, /https:\/\/llm-stats\.com\/benchmarks\/swe-bench-pro/);
  assert.match(source, /https:\/\/llm-stats\.com\/benchmarks\/mmmu-pro/);
  assert.match(styles, /\.trend-benchmark-switch\s*\{[^}]*grid-template-columns: repeat\(3/s);
  assert.doesNotMatch(styles, /\.trends-focus-switch button\.is-featured/);
  assert.match(styles, /\.trends-score-row\.is-reference\s*\{/);
  assert.match(styles, /\.trends-score-row\.is-na:not\(\.is-reference\)\s*\{/);
  assert.match(html, /LMArena/);
  assert.match(html, /Intelligence Index v4\.1/);
  assert.match(html, /Coding Agent Index/);
  assert.match(html, /Agentic Index/);
  assert.match(html, /AA-Briefcase/);
  assert.match(html, /评估方法/);
  assert.match(html, /权重 \/ 口径/);
  assert.match(html, /Agents/);
  assert.match(html, /34%/);
  assert.match(html, /Coding/);
  assert.match(html, /24%/);
  assert.match(html, /科学推理/);
  assert.match(html, /通用能力/);
  assert.match(html, /9 项基准按 4 类不等权合成/);
  for (const board of [
    "Text / Overall",
    "Coding Arena",
    "WebDev Arena",
    "Vision Arena",
    "Text-to-Image",
    "Text-to-Video",
  ]) {
    assert.match(source, new RegExp(board.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(source, /trend-provider-switch/);
  assert.match(source, /trend-board-switch/);
  for (const methodology of [
    "DeepSWE",
    "GDPval-AA v2",
    "Pairwise Elo",
    "Bradley–Terry",
    "约 15%",
    "同一提示生成两段匿名视频",
  ]) {
    assert.match(source, new RegExp(methodology.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(source, /trend-board-assessment/);
  assert.match(source, /aria-pressed=\{activeBoard\.name === board\.name\}/);
  assert.match(styles, /\.trend-board-switch button\.is-active\s*\{[^}]*background: #fffefa/s);
  assert.match(styles, /\.trend-board-switch\.is-arena\s*\{[^}]*grid-template-columns: repeat\(6/s);
  assert.match(styles, /\.trend-active-board\s*\{[^}]*grid-template-columns:/s);
  assert.match(styles, /\.trend-board-assessment table\s*\{[^}]*table-layout: fixed/s);
  assert.match(styles, /\.trend-board-assessment tr\.is-emphasis/s);
  assert.match(html, /静态快照，不自动抓榜或调用 API/);
});

test("server-renders all editable Seedream tutorial examples except the excluded appendix", async () => {
  const response = await request();
  const html = await response.text();

  assert.match(html, /SEEDREAM IMAGE API STUDIO/);
  assert.match(html, /Seedream/);
  assert.match(html, /图片工作台/);
  assert.doesNotMatch(html, /十类官方玩法|每一类都能现场编辑/);
  assert.match(html, /doubao-seedream-5-0-pro-260628/);
  assert.match(html, /doubao-seed-evolving/);
  for (const title of [
    "文生图",
    "图文生图 / 交互编辑",
    "多图融合",
    "文生组图",
    "单张图生组图",
    "多参考图生组图",
    "联网搜索生图",
    "流式组图输出",
    "图片 API 提示词优化模式",
    "自定义图片输出规格",
  ]) {
    assert.match(html, new RegExp(title.replace("/", "\\/")));
  }
  assert.equal(
    (html.match(/data-testid="seedream-example-/g) ?? []).length,
    10,
  );
  assert.match(html, /Prompt 使用技巧/);
  assert.match(html, /表单 ↔ JSON 双向联动/);
  assert.match(html, /执行真实图片生成/);
  assert.match(html, /当前浏览器记住 API Key/);
  assert.match(html, /最近 30 次 Seedream 操作/);
  assert.doesNotMatch(html, /附：故事书|故事书生成的工作流/);
});

test("keeps Seedream prompt optimization explicit, masked, and locally logged", async () => {
  const source = await readFile(
    new URL("../app/components/SeedreamWorkbench.tsx", import.meta.url),
    "utf8",
  );
  const exampleSource = await readFile(
    new URL("../app/lib/seedream-examples.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /\/api\/seedream\/optimize-prompt/);
  assert.match(source, /\/api\/seedream\/generate/);
  assert.match(source, /seedance-workbench:demo-credentials:v1/);
  assert.match(source, /seedream-workbench:history:v1/);
  assert.match(source, /authorization: `Bearer \$\{maskApiKey\(apiKey\)\}`/);
  assert.match(source, /costConfirmed/);
  assert.match(source, /applyApiDraft/);
  assert.match(source, /consumeSeedreamStream/);
  assert.match(exampleSource, /SEEDREAM_EXAMPLES/);
  assert.equal((exampleSource.match(/index: "\d\d"/g) ?? []).length, 10);
  assert.doesNotMatch(exampleSource, /故事书|连环画/);
});

test("server-renders the editable Managed Agents three-step workbench", async () => {
  const response = await request();
  const html = await response.text();

  assert.match(html, /Managed Agents/);
  assert.match(html, /工作台/);
  assert.doesNotMatch(html, /三步搭好一个|每轮资源 ID、请求与响应都可追溯/);
  assert.match(html, /管理 Agent/);
  assert.match(html, /创建 Agent/);
  assert.match(html, /更新 Agent/);
  assert.match(html, /description/);
  assert.match(html, /model\.speed/);
  assert.match(html, /Skills/);
  assert.match(html, /MCP Servers/);
  assert.match(html, /Multi Agent/);
  assert.match(html, /metadata/);
  assert.match(html, /添加 Skills/);
  assert.match(html, /添加 Tools/);
  assert.match(html, /添加 MCP/);
  assert.match(html, /添加 Multi Agent/);
  assert.match(html, /选填项未添加/);
  assert.match(html, /skills 一旦传入会整组覆盖/);
  assert.match(html, /配置 Agent 环境/);
  assert.match(html, /配置并创建环境/);
  assert.match(html, /config\.networking\.type/);
  assert.match(html, /config\.packages/);
  assert.match(html, /config\.env/);
  assert.match(html, /scope/);
  assert.match(html, /管理 Session/);
  assert.match(html, /Session 运行期间不能更新字段/);
  assert.match(html, /创建/);
  assert.match(html, /检索/);
  assert.match(html, /列出/);
  assert.match(html, /事件与流/);
  assert.match(html, /文件与挂载/);
  assert.match(html, /持久化记忆/);
  assert.match(html, /删除/);
  assert.match(html, /vault_ids/);
  assert.match(html, /idle/);
  assert.match(html, /running/);
  assert.match(html, /rescheduled/);
  assert.match(html, /terminated/);
  assert.match(html, /doubao-seed-evolving/);
  assert.match(html, /\/api\/v3\/agents/);
  assert.match(html, /\/api\/v3\/environments/);
  assert.match(html, /\/api\/v3\/sessions/);
  assert.match(html, /表单 ↔ JSON 双向联动/);
  assert.match(html, /完整 API 返回结果会显示在这里/);
  assert.match(html, /暂无 Managed Agents 演示记录/);
  assert.equal((html.match(/data-testid="managed-action-/g) ?? []).length, 3);
});

test("keeps optional Agent capabilities collapsed and captures management responses", async () => {
  const source = await readFile(
    new URL("../app/components/ManagedAgentsWorkbench.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /model: \{ id: "doubao-seed-evolving", speed: "standard" \}/,
  );
  assert.match(source, /body\.skills === undefined \? "添加 Skills"/);
  assert.match(source, /body\.tools === undefined \? "添加 Tools"/);
  assert.match(
    source,
    /body\.mcp_servers === undefined \? "添加 MCP" : "移除 MCP"/,
  );
  assert.match(
    source,
    /body\.multiagent \? "移除 Multi Agent" : "添加 Multi Agent"/,
  );
  assert.match(source, /setAgentApiResult\(\{/);
  assert.match(source, /httpStatus: response\.status/);
  assert.match(source, /<ManagedAgentApiResult result=\{agentApiResult\} \/>/);
});

test("uses a dedicated responsive layout for the Manage Agent step", async () => {
  const source = await readFile(
    new URL("../app/components/ManagedAgentsWorkbench.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(source, /data-step=\{number\}/);
  assert.match(source, /managed-agent-section managed-agent-basics/);
  const agentFieldsSource = source.slice(
    source.indexOf("function AgentFields"),
    source.indexOf("function CapabilityEditorHeading"),
  );
  assert.equal(
    (
      agentFieldsSource.match(
        /managed-agent-section managed-agent-optional-section/g,
      ) ?? []
    ).length,
    5,
  );
  assert.match(
    styles,
    /\.managed-step-card\[data-step="01"\] \.managed-step-grid\s*\{[^}]*grid-template-columns: minmax\(560px, 1\.45fr\) minmax\(390px, 0\.85fr\)/s,
  );
  assert.match(
    styles,
    /@media \(max-width: 1100px\)[\s\S]*?\.managed-step-card\[data-step="01"\] \.managed-step-grid\s*\{[^}]*grid-template-columns: 1fr/s,
  );
  assert.match(styles, /\.managed-agent-optional-section:focus-within/);
});

test("renders the complete Agent environment editor and response layout", async () => {
  const source = await readFile(
    new URL("../app/components/ManagedAgentsWorkbench.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(source, /function EnvironmentFields/);
  assert.match(source, /ENVIRONMENT_PACKAGE_MANAGERS/);
  assert.match(source, /allow_mcp_servers/);
  assert.match(source, /allow_package_managers/);
  assert.match(source, /allowed_hosts/);
  for (const packageManager of ["apt", "cargo", "gem", "go", "npm", "pip"]) {
    assert.match(source, new RegExp(`key: "${packageManager}"`));
  }
  assert.match(source, /setEnvironmentApiResult\(\{/);
  assert.match(
    source,
    /<ManagedEnvironmentApiResult result=\{environmentApiResult\} \/>/,
  );
  assert.match(
    styles,
    /\.managed-step-card\[data-step="02"\] \.managed-step-grid\s*\{[^}]*grid-template-columns: minmax\(560px, 1\.45fr\) minmax\(390px, 0\.85fr\)/s,
  );
  assert.match(
    styles,
    /@media \(max-width: 1100px\)[\s\S]*?\.managed-step-card\[data-step="02"\] \.managed-step-grid\s*\{[^}]*grid-template-columns: 1fr/s,
  );
  assert.match(styles, /\.managed-environment-fields/);
  assert.match(styles, /\.managed-package-grid/);
});

test("renders one full Session manager with lifecycle, events, and responsive API layout", async () => {
  const source = await readFile(
    new URL("../app/components/ManagedAgentsWorkbench.tsx", import.meta.url),
    "utf8",
  );
  const server = await readFile(
    new URL("../app/lib/managed-agents-server.ts", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /type SessionMode =[\s\S]*?\| "files"[\s\S]*?\| "memory"[\s\S]*?\| "delete"/,
  );
  assert.match(source, /function SessionManagerFields/);
  assert.match(source, /user\.interrupt/);
  assert.match(source, /user\.tool_confirmation/);
  assert.match(source, /system\.message/);
  assert.match(source, /STREAM FIRST · GET/);
  assert.match(source, /2553723/);
  assert.match(source, /2553724/);
  assert.match(source, /2553725/);
  assert.match(source, /2553727/);
  assert.match(source, /2553728/);
  assert.match(source, /purpose=agent/);
  assert.match(source, /\/mnt\/session\/uploads\//);
  assert.match(source, /\/mnt\/session\/storage\//);
  assert.match(source, /\/mnt\/memory\//);
  assert.match(source, /TOS 目录和 Memory Store 只能在上方/);
  assert.match(source, /单条上限 100 KB/);
  assert.match(server, /单个 Session 最多挂载 100 个文件资源/);
  assert.match(server, /单个 Session 最多挂载 10 个 Memory Store/);
  assert.match(server, /运行中的 Session 仅支持动态添加 file 资源/);
  assert.ok(
    source.indexOf('action: "stream"') < source.indexOf('action: "send"'),
    "the client must open SSE before sending the Session event",
  );
  assert.match(server, /action: "create"/);
  assert.match(server, /action: "retrieve"/);
  assert.match(server, /action: "list"/);
  assert.match(server, /action: "delete"/);
  assert.match(server, /parseSessionEvents/);
  assert.match(
    styles,
    /\.managed-step-card\[data-step="03"\] \.managed-step-grid\s*\{[^}]*grid-template-columns: minmax\(560px, 1\.45fr\) minmax\(390px, 0\.85fr\)/s,
  );
  assert.match(
    styles,
    /@media \(max-width: 1100px\)[\s\S]*?\.managed-step-card\[data-step="03"\] \.managed-step-grid\s*\{[^}]*grid-template-columns: 1fr/s,
  );
});

test("server-renders the four-category template asset library", async () => {
  const response = await request();
  const html = await response.text();

  for (const category of [
    "提示词模板",
    "电商宣发视频模板",
    "影视短剧模板",
    "营销短视频模板",
  ]) {
    assert.match(html, new RegExp(category));
  }
  for (const title of [
    "多模态参考基础公式",
    "视频元素增删改",
    "云朵面霜 · 三幕质感种草",
    "冰爽果茶 · 夏日转化广告",
    "武侠双人对决",
    "品牌 Slogan 收尾",
  ]) {
    assert.match(html, new RegExp(title));
  }

  assert.equal((html.match(/复制提示词/g) ?? []).length, 16);
  assert.equal((html.match(/data-testid="apply-template-/g) ?? []).length, 10);
  assert.match(html, /apply-template-drama-extend-reunion/);
  assert.match(html, /apply-template-marketing-golden-horse/);
  assert.match(html, /素材待补/);
  assert.match(html, /doubao-seedance-2-0-mini-260615/);
  assert.match(html, /9:16/);
  assert.match(html, /8 秒/);
  assert.match(html, /工作台预置案例/);
  assert.match(html, /火山方舟提示词指南/);
  assert.match(html, /模板与素材/);
  assert.match(html, /asset-section-templates/);
  assert.match(html, /asset-section-materials/);
});

test("keeps material library metadata local and exposes three preview types", async () => {
  const librarySource = await readFile(
    new URL("../app/components/TemplateAssetLibrary.tsx", import.meta.url),
    "utf8",
  );
  const materialSource = await readFile(
    new URL("../app/lib/material-assets.ts", import.meta.url),
    "utf8",
  );

  for (const kind of ["video", "image", "audio"]) {
    assert.match(librarySource, new RegExp(`id: "${kind}"`));
    assert.match(librarySource, new RegExp(`material-kind-\\$\\{kind\\.id\\}`));
  }
  assert.match(librarySource, /uploadManualMaterial/);
  assert.match(librarySource, /<video controls/);
  assert.match(librarySource, /<audio controls/);
  assert.match(librarySource, /<img alt=/);
  assert.match(materialSource, /template-material-library:v1/);
  assert.match(materialSource, /window\.localStorage/);
  assert.doesNotMatch(materialSource, /sourceValue.*localStorage/s);
});

test("keeps template application on the existing task runner path", async () => {
  const librarySource = await readFile(
    new URL("../app/components/TemplateAssetLibrary.tsx", import.meta.url),
    "utf8",
  );
  const assetSource = await readFile(
    new URL("../app/lib/template-assets.ts", import.meta.url),
    "utf8",
  );

  assert.match(librarySource, /APPLY_EXAMPLE_EVENT/);
  assert.match(librarySource, /navigateWorkspace\("seedance"\)/);
  assert.doesNotMatch(librarySource, /fetch\(/);
  assert.equal((assetSource.match(/runnableExample:/g) ?? []).length, 10);
  assert.match(assetSource, /template-commerce-cloud-cream/);
  assert.match(assetSource, /template-commerce-iced-tea/);
  assert.match(assetSource, /template-drama-extend-reunion/);
  assert.match(assetSource, /template-marketing-golden-horse/);
  assert.match(assetSource, /DRAMA_EXTEND_VIDEO_URL/);
  assert.match(assetSource, /MARKETING_GOLDEN_HORSE_VIDEO_URL/);
  assert.doesNotMatch(assetSource, /ark-[a-z0-9-]{20,}/i);
});

test("does not embed an API key in server HTML or the example environment", async () => {
  const response = await request();
  const html = await response.text();
  const envExample = await readFile(
    new URL("../.env.example", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(html, /AGENT_API_KEY\s*=/);
  assert.doesNotMatch(html, /NEXT_PUBLIC_(?:ARK|AGENT)_API_KEY/);
  assert.match(envExample, /^AGENT_API_KEY=$/m);
  assert.doesNotMatch(envExample, /^AGENT_API_KEY=.+$/m);
  assert.match(envExample, /^VOLC_ACCESS_KEY=$/m);
  assert.match(envExample, /^VOLC_SECRET_KEY=$/m);
  assert.doesNotMatch(envExample, /^VOLC_(?:ACCESS|SECRET)_KEY=.+$/m);
});

test("imports, uploads, and previews private TOS materials through signed routes", async () => {
  const originalFetch = globalThis.fetch;
  const previous = {
    access: process.env.VOLC_ACCESS_KEY,
    secret: process.env.VOLC_SECRET_KEY,
    bucket: process.env.TOS_BUCKET,
    endpoint: process.env.TOS_ENDPOINT,
    region: process.env.TOS_REGION,
    prefix: process.env.TOS_PREFIX,
  };
  process.env.VOLC_ACCESS_KEY = "test-access-key-not-real";
  process.env.VOLC_SECRET_KEY = "test-secret-key-not-real";
  process.env.TOS_BUCKET = "hh-tos-test";
  process.env.TOS_ENDPOINT = "https://hh-tos-test.tos-cn-beijing.volces.com";
  process.env.TOS_REGION = "cn-beijing";
  process.env.TOS_PREFIX = "demo/";
  const upstreamRequests = [];

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    upstreamRequests.push({ url, init });
    if (url === "https://generated.example.com/image.png") {
      return new Response(new Uint8Array([137, 80, 78, 71]), {
        headers: { "content-type": "image/png", "content-length": "4" },
      });
    }
    assert.match(url, /^https:\/\/hh-tos-test\.tos-cn-beijing\.volces\.com\/demo\//);
    assert.match(url, /X-Tos-Algorithm=TOS4-HMAC-SHA256/);
    assert.match(url, /X-Tos-Content-Sha256=UNSIGNED-PAYLOAD/);
    assert.match(url, /X-Tos-Signature=[a-f0-9]{64}/);
    assert.equal(init.method, "PUT");
    return new Response(null, { status: 200 });
  };

  try {
    const imported = await request("/api/materials/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "image",
        source: "seedream",
        sourceRef: "seedream:test-run:0",
        sourceValue: "https://generated.example.com/image.png",
        name: "测试图片.png",
      }),
    });
    assert.equal(imported.status, 201);
    const importedAsset = await imported.json();
    assert.equal(importedAsset.kind, "image");
    assert.equal(importedAsset.source, "seedream");
    assert.equal(importedAsset.size, 4);
    assert.match(importedAsset.objectKey, /^demo\/image\/generated\/[a-f0-9]{64}\.png$/);
    assert.equal("sourceValue" in importedAsset, false);

    const uploaded = await request(
      "/api/materials/upload?kind=audio&name=folder%5Csample.mp3",
      {
        method: "POST",
        headers: { "content-type": "audio/mpeg", "content-length": "4" },
        body: new Uint8Array([73, 68, 51, 4]),
      },
    );
    assert.equal(uploaded.status, 201);
    const uploadedAsset = await uploaded.json();
    assert.equal(uploadedAsset.kind, "audio");
    assert.equal(uploadedAsset.size, 4);
    assert.match(
      uploadedAsset.objectKey,
      /^demo\/audio\/uploads\/\d{8}\/[a-f0-9-]+-folder-sample\.mp3$/,
    );

    const preview = await request(
      `/api/materials/object?key=${encodeURIComponent(importedAsset.objectKey)}`,
    );
    assert.equal(preview.status, 302);
    assert.match(
      preview.headers.get("location") ?? "",
      /X-Tos-Expires=3600.*X-Tos-Signature=/,
    );
    assert.equal(preview.headers.get("cache-control"), "no-store");
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv("VOLC_ACCESS_KEY", previous.access);
    restoreEnv("VOLC_SECRET_KEY", previous.secret);
    restoreEnv("TOS_BUCKET", previous.bucket);
    restoreEnv("TOS_ENDPOINT", previous.endpoint);
    restoreEnv("TOS_REGION", previous.region);
    restoreEnv("TOS_PREFIX", previous.prefix);
  }
});

test("rejects unsafe material inputs before writing to TOS", async () => {
  const originalFetch = globalThis.fetch;
  const previousAccess = process.env.VOLC_ACCESS_KEY;
  const previousSecret = process.env.VOLC_SECRET_KEY;
  process.env.VOLC_ACCESS_KEY = "test-access-key-not-real";
  process.env.VOLC_SECRET_KEY = "test-secret-key-not-real";
  globalThis.fetch = async () =>
    new Response(null, {
      status: 302,
      headers: { location: "https://127.0.0.1/redirected.png" },
    });
  try {
    const privateImport = await request("/api/materials/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "image",
        source: "seedream",
        sourceRef: "unsafe",
        sourceValue: "https://127.0.0.1/private.png",
        name: "private.png",
      }),
    });
    assert.equal(privateImport.status, 400);
    assert.match(await privateImport.text(), /公网 HTTPS URL/);

    const privateRedirect = await request("/api/materials/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "image",
        source: "seedream",
        sourceRef: "unsafe-redirect",
        sourceValue: "https://generated.example.com/redirect.png",
        name: "redirect.png",
      }),
    });
    assert.equal(privateRedirect.status, 400);
    assert.match(await privateRedirect.text(), /公网 HTTPS URL/);

    const wrongMime = await request(
      "/api/materials/upload?kind=image&name=wrong.png",
      {
        method: "POST",
        headers: { "content-type": "audio/mpeg" },
        body: new Uint8Array([1]),
      },
    );
    assert.equal(wrongMime.status, 400);
    assert.match(await wrongMime.text(), /MIME/);

    const spoofedMime = await request(
      "/api/materials/upload?kind=image&name=spoofed.png",
      {
        method: "POST",
        headers: { "content-type": "image/png" },
        body: new Uint8Array([1, 2, 3, 4]),
      },
    );
    assert.equal(spoofedMime.status, 400);
    assert.match(await spoofedMime.text(), /文件内容.*MIME/);

    const oversized = await request(
      "/api/materials/upload?kind=image&name=oversized.png",
      {
        method: "POST",
        headers: {
          "content-type": "image/png",
          "content-length": String(20 * 1024 * 1024 + 1),
        },
        body: new Uint8Array([137, 80, 78, 71]),
      },
    );
    assert.equal(oversized.status, 400);
    assert.match(await oversized.text(), /20 MB/);

    const traversal = await request(
      `/api/materials/object?key=${encodeURIComponent("demo/../secret.txt")}`,
    );
    assert.equal(traversal.status, 400);
    assert.match(await traversal.text(), /demo\//);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv("VOLC_ACCESS_KEY", previousAccess);
    restoreEnv("VOLC_SECRET_KEY", previousSecret);
  }
});

test("fails closed when TOS server credentials are missing", async () => {
  const previousAccess = process.env.VOLC_ACCESS_KEY;
  const previousSecret = process.env.VOLC_SECRET_KEY;
  delete process.env.VOLC_ACCESS_KEY;
  delete process.env.VOLC_SECRET_KEY;
  try {
    const response = await request(
      `/api/materials/object?key=${encodeURIComponent("demo/image/generated/test.png")}`,
    );
    assert.equal(response.status, 502);
    assert.match(await response.text(), /服务端凭证未配置/);
  } finally {
    restoreEnv("VOLC_ACCESS_KEY", previousAccess);
    restoreEnv("VOLC_SECRET_KEY", previousSecret);
  }
});

test("persists task logs and repeats polling while a task remains active", async () => {
  const runnerSource = await readFile(
    new URL("../app/components/SeedanceTaskRunner.tsx", import.meta.url),
    "utf8",
  );

  assert.match(runnerSource, /seedance-workbench:task-history:v1/);
  assert.match(runnerSource, /seedance-workbench:demo-credentials:v1/);
  assert.match(runnerSource, /window\.localStorage\.setItem/);
  assert.match(runnerSource, /phase: "create"/);
  assert.match(runnerSource, /phase: "status"/);
  assert.match(runnerSource, /查看日志/);
  assert.match(runnerSource, /response: capturedResponse/);
  assert.match(runnerSource, /parseEditableApiBody/);
  assert.match(runnerSource, /模板资产可以用空 URL 表达“素材待补”/);
  assert.match(runnerSource, /setPollCycle\(\(current\) => current \+ 1\)/);
  assert.match(runnerSource, /状态查询暂时失败，将在 30 秒后重试/);
  assert.match(runnerSource, /lastFrameUrl/);
  assert.match(runnerSource, /runContinuousSequence/);
  assert.match(runnerSource, /执行.*段连续视频/);
  assert.match(runnerSource, /return_last_frame/);
  assert.match(runnerSource, /前一段成功返回尾帧后，才会创建下一段/);
});

test("keeps the official example section legible on dark and light surfaces", async () => {
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(styles, /\.sample-section \.eyebrow\s*\{[^}]*color: var\(--acid\)/s);
  assert.match(
    styles,
    /\.sample-section \.section-heading h2\s*\{[^}]*color: #f8faF3/s,
  );
  assert.match(
    styles,
    /\.example-card h3,[^}]*\{[^}]*color: #121612/s,
  );
  assert.match(styles, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(
    styles,
    /\.example-card:nth-child\(7\),\s*\.example-card:nth-child\(8\)\s*\{[^}]*grid-column: span 3/s,
  );
});

test("lists every current standard and Agent Plan video model", async () => {
  const selectorSource = await readFile(
    new URL("../app/lib/seedance-config.ts", import.meta.url),
    "utf8",
  );

  const standardModels = [
    "doubao-seedance-2-0-260128",
    "doubao-seedance-2-0-fast-260128",
    "doubao-seedance-2-0-mini-260615",
    "doubao-seedance-1-5-pro-251215",
    "doubao-seedance-1-0-pro-250528",
    "doubao-seedance-1-0-pro-fast-251015",
  ];
  const agentPlanModels = [
    "doubao-seedance-2.0",
    "doubao-seedance-2.0-fast",
    "doubao-seedance-2.0-mini",
    "doubao-seedance-1.5-pro",
  ];

  for (const model of [...standardModels, ...agentPlanModels]) {
    assert.match(selectorSource, new RegExp(model.replaceAll(".", "\\.")));
  }
});

test("rejects a Base URL that does not match the selected API path", async () => {
  const response = await request("/api/seedance/tasks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...validTaskInput(),
      baseUrl: "https://example.com/api/v3",
    }),
  });

  assert.equal(response.status, 400);
  assert.match(await response.text(), /必须使用/);
});

test("creates a task through the server without returning the API key", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-agent-key-not-real";
  let upstreamRequest;

  globalThis.fetch = async (input, init) => {
    upstreamRequest = { input: String(input), init };
    return Response.json({ id: "task-test-123", status: "queued" });
  };

  try {
    const response = await request("/api/seedance/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validTaskInput(), apiKey }),
    });
    const body = await response.text();

    assert.equal(response.status, 201);
    assert.match(body, /task-test-123/);
    assert.doesNotMatch(body, new RegExp(apiKey));
    assert.equal(
      upstreamRequest.input,
      "https://ark.cn-beijing.volces.com/api/plan/v3/contents/generations/tasks",
    );
    assert.equal(upstreamRequest.init.method, "POST");
    assert.equal(upstreamRequest.init.headers.authorization, `Bearer ${apiKey}`);

    const upstreamBody = JSON.parse(upstreamRequest.init.body);
    assert.equal(upstreamBody.model, "doubao-seedance-2.0");
    assert.equal(upstreamBody.duration, 5);
    assert.equal(upstreamBody.ratio, "16:9");
    assert.equal(upstreamBody.generate_audio, true);
    assert.equal(upstreamBody.watermark, true);
    assert.equal(upstreamBody.content.length, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("polls a task through POST so the API key never enters the URL", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-agent-key-not-real";
  let upstreamRequest;

  globalThis.fetch = async (input, init) => {
    upstreamRequest = { input: String(input), init };
    return Response.json({
      id: "task-test-123",
      status: "succeeded",
      content: {
        video_url: "https://example.com/result.mp4",
        last_frame_url: "https://example.com/last-frame.jpeg",
      },
    });
  };

  try {
    const response = await request("/api/seedance/tasks/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiPath: "agent-plan",
        baseUrl: "https://ark.cn-beijing.volces.com/api/plan/v3",
        model: "doubao-seedance-2.0",
        apiKey,
        taskId: "task-test-123",
      }),
    });
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /succeeded/);
    assert.match(body, /https:\/\/example\.com\/result\.mp4/);
    assert.match(body, /https:\/\/example\.com\/last-frame\.jpeg/);
    assert.doesNotMatch(body, new RegExp(apiKey));
    assert.equal(
      upstreamRequest.input,
      "https://ark.cn-beijing.volces.com/api/plan/v3/contents/generations/tasks/task-test-123",
    );
    assert.equal(upstreamRequest.init.method, "GET");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("enforces official 4K and web-search input constraints", async () => {
  const mini4k = validTaskInput();
  mini4k.model = "doubao-seedance-2.0-mini";
  mini4k.requestBody.model = mini4k.model;
  mini4k.requestBody.resolution = "4k";
  const fourKResponse = await request("/api/seedance/tasks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(mini4k),
  });
  assert.equal(fourKResponse.status, 400);
  assert.match(await fourKResponse.text(), /4K 仅支持/);

  const searchWithMedia = validTaskInput();
  searchWithMedia.requestBody.tools = [{ type: "web_search" }];
  const searchResponse = await request("/api/seedance/tasks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(searchWithMedia),
  });
  assert.equal(searchResponse.status, 400);
  assert.match(await searchResponse.text(), /仅适用于纯文本/);
});

test("accepts only strict preset asset IDs alongside public HTTPS media", async () => {
  const originalFetch = globalThis.fetch;
  let upstreamBody;
  globalThis.fetch = async (_input, init) => {
    upstreamBody = JSON.parse(init.body);
    return Response.json({ id: "task-preset-avatar", status: "queued" });
  };

  try {
    const presetAvatar = validTaskInput();
    presetAvatar.requestBody.content[1].image_url.url =
      "asset://asset-20260401123823-6d4x2";
    const accepted = await request("/api/seedance/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(presetAvatar),
    });
    assert.equal(accepted.status, 201);
    assert.equal(
      upstreamBody.content[1].image_url.url,
      "asset://asset-20260401123823-6d4x2",
    );

    presetAvatar.requestBody.content[1].image_url.url =
      "asset://portrait/../../private";
    const rejected = await request("/api/seedance/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(presetAvatar),
    });
    assert.equal(rejected.status, 400);
    assert.match(await rejected.text(), /asset:\/\/asset-\*/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("generates Seedream images through the strict standard API proxy", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-seedream-key-not-real";
  let upstreamRequest;

  globalThis.fetch = async (input, init) => {
    upstreamRequest = { input: String(input), init };
    return Response.json({
      created: 1780000000,
      data: [
        {
          url: "https://example.com/generated.png",
          size: "2048x2048",
        },
      ],
      usage: { generated_images: 1 },
    });
  };

  try {
    const response = await request("/api/seedream/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey,
        requestBody: validSeedreamInput(),
      }),
    });
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /generated\.png/);
    assert.doesNotMatch(body, new RegExp(apiKey));
    assert.equal(
      upstreamRequest.input,
      "https://ark.cn-beijing.volces.com/api/v3/images/generations",
    );
    assert.equal(upstreamRequest.init.method, "POST");
    assert.equal(upstreamRequest.init.headers.authorization, `Bearer ${apiKey}`);
    assert.deepEqual(
      JSON.parse(upstreamRequest.init.body),
      validSeedreamInput(),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("enforces Seedream model capability and public-image constraints", async () => {
  const proGroup = validSeedreamInput();
  proGroup.sequential_image_generation = "auto";
  proGroup.sequential_image_generation_options = { max_images: 4 };
  const proGroupResponse = await request("/api/seedream/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      apiKey: "test-seedream-key-not-real",
      requestBody: proGroup,
    }),
  });
  assert.equal(proGroupResponse.status, 400);
  assert.match(await proGroupResponse.text(), /Pro 暂不支持组图/);

  const privateImage = validSeedreamInput();
  privateImage.image = "https://127.0.0.1/private.png";
  const privateImageResponse = await request("/api/seedream/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      apiKey: "test-seedream-key-not-real",
      requestBody: privateImage,
    }),
  });
  assert.equal(privateImageResponse.status, 400);
  assert.match(await privateImageResponse.text(), /公网 HTTPS URL/);

  const liteFast = validSeedreamInput();
  liteFast.model = "doubao-seedream-5-0-lite-260128";
  liteFast.optimize_prompt_options = { mode: "fast" };
  const liteFastResponse = await request("/api/seedream/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      apiKey: "test-seedream-key-not-real",
      requestBody: liteFast,
    }),
  });
  assert.equal(liteFastResponse.status, 400);
  assert.match(await liteFastResponse.text(), /只支持 standard/);
});

test("relays Seedream streaming events without buffering or exposing the key", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-seedream-stream-key-not-real";
  let upstreamRequest;

  globalThis.fetch = async (input, init) => {
    upstreamRequest = { input: String(input), init };
    return new Response(
      [
        'data: {"type":"image_generation.partial_succeeded","url":"https://example.com/one.png"}',
        "",
        'data: {"type":"image_generation.completed","usage":{"generated_images":1}}',
        "",
      ].join("\n"),
      { headers: { "content-type": "text/event-stream" } },
    );
  };

  try {
    const requestBody = {
      ...validSeedreamInput(),
      model: "doubao-seedream-5-0-lite-260128",
      sequential_image_generation: "auto",
      sequential_image_generation_options: { max_images: 2 },
      stream: true,
    };
    const response = await request("/api/seedream/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey, requestBody }),
    });
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/);
    assert.match(body, /partial_succeeded/);
    assert.doesNotMatch(body, new RegExp(apiKey));
    assert.equal(upstreamRequest.init.method, "POST");
    assert.equal(JSON.parse(upstreamRequest.init.body).stream, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("optimizes a Seedream prompt with doubao-seed-evolving and scenario tips", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-seedream-optimize-key-not-real";
  let upstreamRequest;

  globalThis.fetch = async (input, init) => {
    upstreamRequest = { input: String(input), init };
    return Response.json({
      id: "chatcmpl-seedream-test",
      choices: [
        {
          message: {
            role: "assistant",
            content:
              "一只橘猫在雨后上海街头散步，低机位跟拍，霓虹倒影，电影感冷暖对比光。",
          },
        },
      ],
      usage: { prompt_tokens: 120, completion_tokens: 36 },
    });
  };

  try {
    const response = await request("/api/seedream/optimize-prompt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey,
        scenarioId: "text-to-image",
        prompt: "橘猫在街上",
      }),
    });
    const body = await response.text();
    const payload = JSON.parse(body);

    assert.equal(response.status, 200);
    assert.match(payload.optimizedPrompt, /橘猫/);
    assert.doesNotMatch(body, new RegExp(apiKey));
    assert.equal(
      upstreamRequest.input,
      "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    );
    const upstreamBody = JSON.parse(upstreamRequest.init.body);
    assert.equal(upstreamBody.model, "doubao-seed-evolving");
    assert.deepEqual(upstreamBody.thinking, { type: "disabled" });
    assert.match(upstreamBody.messages[0].content, /主体、行为与环境/);
    assert.equal(upstreamBody.messages[1].content, "橘猫在街上");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("preserves first/last frame roles and validates continuous-video requests", async () => {
  const originalFetch = globalThis.fetch;
  let upstreamBody;
  globalThis.fetch = async (_input, init) => {
    upstreamBody = JSON.parse(init.body);
    return Response.json({ id: "task-frame-chain", status: "queued" });
  };

  try {
    const firstLast = validTaskInput();
    firstLast.requestBody.content = [
      { type: "text", text: "图中女孩对着镜头说茄子，360度环绕运镜" },
      {
        type: "image_url",
        image_url: { url: "https://example.com/first.jpeg" },
        role: "first_frame",
      },
      {
        type: "image_url",
        image_url: { url: "https://example.com/last.jpeg" },
        role: "last_frame",
      },
    ];
    firstLast.requestBody.ratio = "adaptive";
    const acceptedFrames = await request("/api/seedance/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(firstLast),
    });
    assert.equal(acceptedFrames.status, 201);
    assert.equal(upstreamBody.content[1].role, "first_frame");
    assert.equal(upstreamBody.content[2].role, "last_frame");

    firstLast.requestBody.content[2].role = "first_frame";
    const rejectedFrames = await request("/api/seedance/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(firstLast),
    });
    assert.equal(rejectedFrames.status, 400);
    assert.match(await rejectedFrames.text(), /first_frame.*last_frame/);

    const chained = validTaskInput();
    chained.requestBody.content = [
      { type: "text", text: "女孩和狐狸继续向前奔跑" },
      {
        type: "image_url",
        image_url: { url: "https://example.com/previous-last-frame.jpeg" },
      },
    ];
    chained.requestBody.return_last_frame = true;
    chained.requestBody.ratio = "adaptive";
    const acceptedChain = await request("/api/seedance/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(chained),
    });
    assert.equal(acceptedChain.status, 201);
    assert.equal(upstreamBody.return_last_frame, true);
    assert.equal("role" in upstreamBody.content[1], false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("creates Managed Agents resources through the strict standard API proxy", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-managed-agents-key-not-real";
  const upstreamRequests = [];

  globalThis.fetch = async (input, init) => {
    upstreamRequests.push({ input: String(input), init });
    return Response.json({
      id: `managed-resource-${upstreamRequests.length}`,
      object: "managed_agent_resource",
    });
  };

  try {
    const cases = [
      {
        localPath: "/api/managed-agents/agents",
        upstreamPath: "/agents",
        proxyInput: { mode: "create" },
        requestBody: {
          name: "QuickStartAgent",
          description: "全字段创建验证",
          model: {
            id: "doubao-seed-2-1-pro-260628",
            speed: "standard",
          },
          system: "你是一个高效的编程助手。",
          skills: [
            { type: "skill_hub", skill_id: "s-example" },
            { type: "custom", skill_id: "skill-example", version: "1" },
          ],
          tools: [{ type: "agent_toolset_20260701" }],
          metadata: { source: "workbench" },
        },
      },
      {
        localPath: "/api/managed-agents/agents",
        upstreamPath: "/agents/agent-existing-123",
        proxyInput: {
          mode: "update",
          agentId: "agent-existing-123",
        },
        requestBody: {
          version: 2,
          description: "更新后的 Agent",
          tools: [
            {
              type: "agent_toolset_20260701",
              default_config: { enabled: false },
              configs: [
                { name: "read", enabled: true },
                { name: "grep", enabled: true },
              ],
            },
            {
              type: "evolution",
              configs: [{ name: "advisor", enabled: true }],
            },
            {
              type: "mcp_toolset",
              mcp_server_name: "github",
              default_config: { enabled: false },
              configs: [{ name: "list_issues", enabled: true }],
            },
          ],
          mcp_servers: [
            {
              type: "url",
              name: "github",
              url: "https://mcp.example.com/github",
            },
          ],
          multiagent: {
            type: "coordinator",
            agents: [
              { type: "agent", id: "agent-child-123", version: 1 },
              { type: "self" },
            ],
          },
        },
      },
      {
        localPath: "/api/managed-agents/environments",
        upstreamPath: "/environments",
        requestBody: {
          name: "demo-env-test",
          description: "Managed Agents 完整环境字段验证",
          config: {
            type: "cloud",
            networking: {
              type: "limited",
              allow_mcp_servers: true,
              allow_package_managers: false,
              allowed_hosts: ["api.example.com", "10.0.0.8"],
            },
            packages: {
              type: "packages",
              apt: ["curl"],
              cargo: ["ripgrep"],
              gem: ["bundler"],
              go: ["golang.org/x/tools"],
              npm: ["typescript@5"],
              pip: ["pandas==2.2.0"],
            },
            env: { MY_KEY_0: "value_0" },
          },
          metadata: { source: "workbench" },
          scope: "organization",
        },
      },
      {
        localPath: "/api/managed-agents/sessions",
        upstreamPath: "/sessions",
        proxyInput: { action: "create" },
        requestBody: {
          agent: {
            type: "agent",
            id: "agent-test-123",
            version: 3,
          },
          environment_id: "env-test-123",
          vault_ids: ["vlt-test-123"],
          resources: [
            {
              type: "file",
              file_id: "file-test-123",
              mount_path: "inputs/reference.md",
            },
            {
              type: "tos",
              tos_bucket: "agent-assets",
              tos_key: "project-resources/",
            },
            {
              type: "memory_store",
              memory_store_id: "memstore_test_123",
              instructions: "开始前读取用户偏好。",
            },
          ],
        },
      },
    ];

    for (const item of cases) {
      const response = await request(item.localPath, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
          apiKey,
          requestBody: item.requestBody,
          ...(item.proxyInput ?? {}),
        }),
      });
      const body = await response.text();
      assert.equal(response.status, 201);
      assert.doesNotMatch(body, new RegExp(apiKey));
      const upstream = upstreamRequests.at(-1);
      assert.equal(
        upstream.input,
        `https://ark.cn-beijing.volces.com/api/v3${item.upstreamPath}`,
      );
      assert.equal(upstream.init.method, "POST");
      assert.equal(upstream.init.headers.authorization, `Bearer ${apiKey}`);
      assert.deepEqual(JSON.parse(upstream.init.body), item.requestBody);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("opens the Managed Agents SSE stream before sending an event", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-managed-agents-key-not-real";
  const upstreamRequests = [];
  const messageBody = {
    events: [
      {
        type: "user.message",
        content: [{ type: "text", text: "生成 fibonacci.txt" }],
      },
    ],
  };

  globalThis.fetch = async (input, init) => {
    upstreamRequests.push({ input: String(input), init });
    if (upstreamRequests.length === 1) {
      return new Response(
        [
        'data: {"type":"agent.tool_use","name":"write"}',
        "",
        'data: {"type":"agent.message","content":[{"type":"text","text":"已完成"}]}',
        "",
        'data: {"type":"session.status_idle"}',
        "",
        ].join("\n"),
        {
          headers: { "content-type": "text/event-stream" },
        },
      );
    }
    return Response.json({ accepted: true }, { status: 202 });
  };

  try {
    const response = await request("/api/managed-agents/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey,
        sessionId: "session-test-123",
        requestBody: messageBody,
      }),
    });
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/);
    assert.match(body, /agent\.tool_use/);
    assert.match(body, /session\.status_idle/);
    assert.doesNotMatch(body, new RegExp(apiKey));
    assert.equal(upstreamRequests.length, 2);
    assert.equal(
      upstreamRequests[0].input,
      "https://ark.cn-beijing.volces.com/api/v3/sessions/session-test-123/events/stream",
    );
    assert.equal(upstreamRequests[0].init.method, "GET");
    assert.equal(upstreamRequests[0].init.headers.accept, "text/event-stream");
    assert.equal(
      upstreamRequests[1].input,
      "https://ark.cn-beijing.volces.com/api/v3/sessions/session-test-123/events",
    );
    assert.equal(upstreamRequests[1].init.method, "POST");
    assert.deepEqual(JSON.parse(upstreamRequests[1].init.body), messageBody);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("retrieves, lists, and deletes Sessions through the strict proxy", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-managed-session-key-not-real";
  const upstreamRequests = [];

  globalThis.fetch = async (input, init) => {
    upstreamRequests.push({ input: String(input), init });
    if (init.method === "DELETE") {
      return Response.json({ id: "sesn-test-123", deleted: true });
    }
    if (String(input).includes("?")) {
      return Response.json({ data: [{ id: "sesn-test-123", status: "idle" }] });
    }
    return Response.json({
      id: "sesn-test-123",
      status: "idle",
      usage: { input_tokens: 42, output_tokens: 7 },
    });
  };

  try {
    const cases = [
      {
        action: "retrieve",
        sessionId: "sesn-test-123",
        expectedUrl:
          "https://ark.cn-beijing.volces.com/api/v3/sessions/sesn-test-123",
        expectedMethod: "GET",
      },
      {
        action: "list",
        query: { agent_id: "agent-test-123", limit: 20 },
        expectedUrl:
          "https://ark.cn-beijing.volces.com/api/v3/sessions?agent_id=agent-test-123&limit=20",
        expectedMethod: "GET",
      },
      {
        action: "delete",
        sessionId: "sesn-test-123",
        expectedUrl:
          "https://ark.cn-beijing.volces.com/api/v3/sessions/sesn-test-123",
        expectedMethod: "DELETE",
      },
    ];

    for (const item of cases) {
      const response = await request("/api/managed-agents/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
          apiKey,
          action: item.action,
          ...(item.sessionId ? { sessionId: item.sessionId } : {}),
          ...(item.query ? { query: item.query } : {}),
        }),
      });
      const body = await response.text();
      assert.equal(response.status, 200);
      assert.doesNotMatch(body, new RegExp(apiKey));
      const upstream = upstreamRequests.at(-1);
      assert.equal(upstream.input, item.expectedUrl);
      assert.equal(upstream.init.method, item.expectedMethod);
      assert.equal(upstream.init.headers.authorization, `Bearer ${apiKey}`);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("validates and relays Session events through separate stream and send actions", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-managed-session-events-key-not-real";
  const upstreamRequests = [];
  const eventBody = {
    events: [
      {
        type: "user.message",
        content: [
          { type: "text", text: "分析附件" },
          {
            type: "image",
            source: { type: "url", url: "https://example.com/chart.png" },
          },
          {
            type: "document",
            source: {
              type: "text",
              media_type: "text/plain",
              data: "Q2 revenue",
            },
            title: "销售数据",
          },
        ],
      },
      {
        type: "system.message",
        content: [{ type: "text", text: "只输出异常项。" }],
      },
    ],
  };

  globalThis.fetch = async (input, init) => {
    upstreamRequests.push({ input: String(input), init });
    if (init.method === "GET") {
      return new Response('data: {"type":"session.status_idle"}\n\n', {
        headers: { "content-type": "text/event-stream" },
      });
    }
    return Response.json({ data: [{ id: "sevt-test-123" }] });
  };

  try {
    const streamResponse = await request(
      "/api/managed-agents/session-events",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
          apiKey,
          action: "stream",
          sessionId: "sesn-test-123",
        }),
      },
    );
    assert.equal(streamResponse.status, 200);
    assert.match(
      streamResponse.headers.get("content-type") ?? "",
      /text\/event-stream/,
    );
    assert.equal(upstreamRequests[0].init.method, "GET");

    const sendResponse = await request("/api/managed-agents/session-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey,
        action: "send",
        sessionId: "sesn-test-123",
        requestBody: eventBody,
      }),
    });
    assert.equal(sendResponse.status, 200);
    assert.deepEqual(
      JSON.parse(upstreamRequests[1].init.body),
      eventBody,
    );
    assert.doesNotMatch(await sendResponse.text(), new RegExp(apiKey));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("uploads files and manages Session file resources through strict proxies", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-managed-files-key-not-real";
  const upstreamRequests = [];

  globalThis.fetch = async (input, init) => {
    upstreamRequests.push({ input: String(input), init });
    if (init.method === "POST") {
      return Response.json({
        id: String(input).endsWith("/files")
          ? "file-test-123"
          : "resource-test-123",
      });
    }
    if (init.method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    return Response.json({ data: [] });
  };

  try {
    const upload = new FormData();
    upload.set("baseUrl", "https://ark.cn-beijing.volces.com/api/v3");
    upload.set("apiKey", apiKey);
    upload.set(
      "file",
      new File(["project rules"], "rules.md", { type: "text/markdown" }),
    );
    const uploadResponse = await request("/api/managed-agents/files", {
      method: "POST",
      body: upload,
    });
    assert.equal(uploadResponse.status, 200);
    const uploadRequest = upstreamRequests.at(-1);
    assert.equal(
      uploadRequest.input,
      "https://ark.cn-beijing.volces.com/api/v3/files",
    );
    assert.equal(uploadRequest.init.method, "POST");
    assert.equal(uploadRequest.init.headers.authorization, `Bearer ${apiKey}`);
    assert.equal(uploadRequest.init.body.get("purpose"), "agent");
    assert.equal(uploadRequest.init.body.get("file").name, "rules.md");

    const cases = [
      {
        action: "add",
        requestBody: {
          type: "file",
          file_id: "file-test-123",
          mount_path: "inputs/rules.md",
        },
        expectedMethod: "POST",
        expectedSuffix: "",
      },
      {
        action: "list",
        expectedMethod: "GET",
        expectedSuffix: "",
      },
      {
        action: "delete",
        resourceId: "resource-test-123",
        expectedMethod: "DELETE",
        expectedSuffix: "/resource-test-123",
      },
    ];
    for (const item of cases) {
      const response = await request(
        "/api/managed-agents/session-resources",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
            apiKey,
            action: item.action,
            sessionId: "sesn-test-123",
            ...(item.requestBody ? { requestBody: item.requestBody } : {}),
            ...(item.resourceId ? { resourceId: item.resourceId } : {}),
          }),
        },
      );
      assert.equal(response.status, 200);
      assert.doesNotMatch(await response.text(), new RegExp(apiKey));
      const upstream = upstreamRequests.at(-1);
      assert.equal(
        upstream.input,
        `https://ark.cn-beijing.volces.com/api/v3/sessions/sesn-test-123/resources${item.expectedSuffix}`,
      );
      assert.equal(upstream.init.method, item.expectedMethod);
    }

    const generatedResponse = await request("/api/managed-agents/files", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey,
        action: "list",
        scopeId: "sesn-test-123",
      }),
    });
    assert.equal(generatedResponse.status, 200);
    assert.equal(
      upstreamRequests.at(-1).input,
      "https://ark.cn-beijing.volces.com/api/v3/files?scope_id=sesn-test-123",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("manages Memory Stores and Memory content through the strict proxy", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-managed-memory-key-not-real";
  const upstreamRequests = [];

  globalThis.fetch = async (input, init) => {
    upstreamRequests.push({ input: String(input), init });
    if (init.method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    return Response.json({ id: "memory-result-123", data: [] });
  };

  try {
    const cases = [
      {
        action: "create-store",
        requestBody: {
          name: "ProjectContext",
          description: "项目规范和用户偏好",
        },
        method: "POST",
        url: "/memory_stores",
      },
      {
        action: "list-stores",
        method: "GET",
        url: "/memory_stores",
      },
      {
        action: "create-memory",
        storeId: "memstore_test_123",
        requestBody: {
          path: "/project/context.md",
          content: "中文输出",
        },
        method: "POST",
        url: "/memory_stores/memstore_test_123/memories",
      },
      {
        action: "list-memories",
        storeId: "memstore_test_123",
        query: { path_prefix: "/", order_by: "path", depth: 2 },
        method: "GET",
        url: "/memory_stores/memstore_test_123/memories?path_prefix=%2F&order_by=path&depth=2",
      },
      {
        action: "retrieve-memory",
        storeId: "memstore_test_123",
        memoryId: "memory-test-123",
        method: "GET",
        url: "/memory_stores/memstore_test_123/memories/memory-test-123",
      },
      {
        action: "update-memory",
        storeId: "memstore_test_123",
        memoryId: "memory-test-123",
        requestBody: { path: "/archive/context.md" },
        method: "POST",
        url: "/memory_stores/memstore_test_123/memories/memory-test-123",
      },
      {
        action: "delete-memory",
        storeId: "memstore_test_123",
        memoryId: "memory-test-123",
        method: "DELETE",
        url: "/memory_stores/memstore_test_123/memories/memory-test-123",
      },
    ];

    for (const item of cases) {
      const response = await request("/api/managed-agents/memory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
          apiKey,
          action: item.action,
          ...(item.storeId ? { storeId: item.storeId } : {}),
          ...(item.memoryId ? { memoryId: item.memoryId } : {}),
          ...(item.requestBody ? { requestBody: item.requestBody } : {}),
          ...(item.query ? { query: item.query } : {}),
        }),
      });
      assert.equal(response.status, 200);
      assert.doesNotMatch(await response.text(), new RegExp(apiKey));
      const upstream = upstreamRequests.at(-1);
      assert.equal(
        upstream.input,
        `https://ark.cn-beijing.volces.com/api/v3${item.url}`,
      );
      assert.equal(upstream.init.method, item.method);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects non-official Managed Agents Base URLs and unsupported payload fields", async () => {
  const invalidBase = await request("/api/managed-agents/agents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      baseUrl: "https://example.com/api/v3",
      apiKey: "test-key",
      requestBody: {
        name: "Agent",
        model: { id: "model-id" },
        system: "System",
        tools: [{ type: "agent_toolset_20260701" }],
      },
    }),
  });
  assert.equal(invalidBase.status, 400);
  assert.match(await invalidBase.text(), /必须使用/);

  const unsupportedField = await request("/api/managed-agents/environments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
      apiKey: "test-key",
      requestBody: {
        name: "demo-env",
        config: {
          type: "cloud",
          networking: { type: "unrestricted" },
        },
        redirect_url: "https://example.com",
      },
    }),
  });
  assert.equal(unsupportedField.status, 400);
  assert.match(await unsupportedField.text(), /未开放转发/);

  const unrestrictedWithLimitedFields = await request(
    "/api/managed-agents/environments",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey: "test-key",
        requestBody: {
          name: "demo-env",
          config: {
            type: "cloud",
            networking: {
              type: "unrestricted",
              allow_mcp_servers: true,
            },
          },
        },
      }),
    },
  );
  assert.equal(unrestrictedWithLimitedFields.status, 400);
  assert.match(await unrestrictedWithLimitedFields.text(), /limited 专用/);

  const reservedEnvironmentVariable = await request(
    "/api/managed-agents/environments",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey: "test-key",
        requestBody: {
          name: "demo-env",
          config: {
            type: "cloud",
            networking: { type: "unrestricted" },
            env: { ARK_TOKEN: "must-not-forward" },
          },
        },
      }),
    },
  );
  assert.equal(reservedEnvironmentVariable.status, 400);
  assert.match(await reservedEnvironmentVariable.text(), /保留前缀/);

  const missingVersion = await request("/api/managed-agents/agents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
      apiKey: "test-key",
      mode: "update",
      agentId: "agent-existing-123",
      requestBody: { system: "更新系统提示词" },
    }),
  });
  assert.equal(missingVersion.status, 400);
  assert.match(await missingVersion.text(), /必须传入当前整数 version/);

  const unmatchedMcp = await request("/api/managed-agents/agents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
      apiKey: "test-key",
      mode: "create",
      requestBody: {
        name: "MCPAgent",
        model: { id: "doubao-seed-2-1-pro-260628" },
        mcp_servers: [
          {
            type: "url",
            name: "github",
            url: "https://mcp.example.com/github",
          },
        ],
        tools: [{ type: "agent_toolset_20260701" }],
      },
    }),
  });
  assert.equal(unmatchedMcp.status, 400);
  assert.match(await unmatchedMcp.text(), /必须按名称一一对应/);

  const unsupportedSessionUpdate = await request(
    "/api/managed-agents/sessions",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey: "test-key",
        action: "update",
        sessionId: "sesn-test-123",
        requestBody: { environment_id: "env-test-456" },
      }),
    },
  );
  assert.equal(unsupportedSessionUpdate.status, 400);
  assert.match(await unsupportedSessionUpdate.text(), /action 必须为/);

  const reversedSessionEvents = await request(
    "/api/managed-agents/session-events",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey: "test-key",
        action: "send",
        sessionId: "sesn-test-123",
        requestBody: {
          events: [
            {
              type: "system.message",
              content: [{ type: "text", text: "系统补充" }],
            },
            {
              type: "user.message",
              content: [{ type: "text", text: "用户问题" }],
            },
          ],
        },
      }),
    },
  );
  assert.equal(reversedSessionEvents.status, 400);
  assert.match(await reversedSessionEvents.text(), /顺序|首个事件/);

  const invalidTosDirectory = await request(
    "/api/managed-agents/sessions",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey: "test-key",
        action: "create",
        requestBody: {
          agent: "agent-test-123",
          environment_id: "env-test-123",
          resources: [
            {
              type: "tos",
              tos_bucket: "agent-assets",
              tos_key: "project/file.txt",
            },
          ],
        },
      }),
    },
  );
  assert.equal(invalidTosDirectory.status, 400);
  assert.match(await invalidTosDirectory.text(), /以 \/ 结尾/);

  const runtimeMemoryMount = await request(
    "/api/managed-agents/session-resources",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey: "test-key",
        action: "add",
        sessionId: "sesn-test-123",
        requestBody: {
          type: "memory_store",
          memory_store_id: "memstore_test_123",
        },
      }),
    },
  );
  assert.equal(runtimeMemoryMount.status, 400);
  assert.match(await runtimeMemoryMount.text(), /仅支持动态添加 file/);
});

test("server-renders the editable Responses API studio and complete protocol catalog", async () => {
  const response = await request();
  const html = await response.text();

  assert.match(html, /Responses API/);
  assert.match(html, /VOLCENGINE RESPONSES API STUDIO/);
  assert.match(html, /能力场景/);
  assert.doesNotMatch(html, /一个接口|看懂输入、工具|八类可编辑演示/);
  assert.match(html, /完整参数结构/);
  assert.match(html, /表单 ↔ JSON 双向联动/);
  assert.match(html, /创建 Response/);
  assert.match(html, /查询详情/);
  assert.match(html, /列出输入项/);
  assert.match(html, /删除 Response/);
  assert.match(html, /X-Fornax-Trace/);
  assert.match(html, /当前浏览器记住 API Key/);
  assert.match(html, /执行真实 Responses API/);
  assert.match(html, /最近 30/);
  assert.match(html, /暂无 Responses API 演示记录/);
  assert.equal(
    (html.match(/data-testid="responses-scenario-/g) ?? []).length,
    8,
  );
  for (const title of [
    "文本生成",
    "多轮上下文",
    "深度思考",
    "多模态理解",
    "Function Calling",
    "内置工具与 MCP",
    "上下文缓存",
    "结构化输出",
  ]) {
    assert.match(html, new RegExp(title));
  }
  for (const field of [
    "context_management",
    "expire_at",
    "include",
    "max_tool_calls",
    "previous_response_id",
    "reasoning",
    "service_tier",
    "temperature",
    "tool_choice",
    "top_p",
    "incomplete_details",
    "usage",
  ]) {
    assert.match(html, new RegExp(field));
  }
  for (const variant of [
    "input_image",
    "input_video",
    "input_file",
    "input_audio",
    "function_call_output",
    "web_search_call",
    "knowledge_search_call",
    "mcp_approval_request",
    "doubao_app_call",
    "agent_tool_call",
  ]) {
    assert.match(html, new RegExp(variant));
  }
});

test("keeps Responses API requests same-origin, masked, explicit, and locally logged", async () => {
  const source = await readFile(
    new URL("../app/components/ResponsesWorkbench.tsx", import.meta.url),
    "utf8",
  );
  const server = await readFile(
    new URL("../app/lib/responses-server.ts", import.meta.url),
    "utf8",
  );
  const examples = await readFile(
    new URL("../app/lib/responses-examples.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /fetch\("\/api\/responses"/);
  assert.match(source, /responses-workbench:history:v1/);
  assert.match(source, /seedance-workbench:demo-credentials:v1/);
  assert.match(source, /costConfirmed/);
  assert.match(source, /deleteConfirmed/);
  assert.match(source, /Authorization: `Bearer \$\{maskApiKey\(apiKey\)\}`/);
  assert.match(source, /redactSensitive/);
  assert.match(source, /consumeResponsesStream/);
  assert.match(examples, /https:\/\/ark\.cn-beijing\.volces\.com\/api\/v3/);
  assert.match(server, /REQUEST_BODY_FIELDS/);
  assert.match(server, /TOOL_TYPES/);
  assert.match(server, /redactStream/);
  assert.doesNotMatch(server, /baseUrl/);
});

test("proxies create, retrieve, list, delete, and SSE Responses API operations", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const apiKey = "test-responses-key-not-real";

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith("/input_items")) {
      return Response.json({ data: [{ type: "message", role: "user" }] });
    }
    if (init?.method === "DELETE") {
      return Response.json({ id: "resp_test_123", deleted: true });
    }
    if (init?.method === "GET") {
      return Response.json({
        id: "resp_test_123",
        object: "response",
        status: "completed",
      });
    }
    const body = JSON.parse(String(init?.body ?? "{}"));
    if (body.stream) {
      const encoder = new TextEncoder();
      const payload = [
        'event: response.created\ndata: {"type":"response.created","response":{"id":"resp_test_stream"}}',
        `event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"${apiKey}"}`,
        'event: response.completed\ndata: {"type":"response.completed","response":{"id":"resp_test_stream","status":"completed"}}',
        "data: [DONE]",
        "",
      ].join("\n\n");
      const splitAt = payload.indexOf(apiKey) + Math.floor(apiKey.length / 2);
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(payload.slice(0, splitAt)));
            controller.enqueue(encoder.encode(payload.slice(splitAt)));
            controller.close();
          },
        }),
        { headers: { "content-type": "text/event-stream" } },
      );
    }
    return Response.json({
      id: "resp_test_123",
      object: "response",
      status: "completed",
      output: [{ type: "message", content: [{ type: "output_text", text: apiKey }] }],
    });
  };

  try {
    const createResponse = await request("/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "create",
        apiKey,
        trace: true,
        requestBody: {
          model: "doubao-seed-2-1-pro-260628",
          input: "hello",
          store: true,
          stream: false,
        },
      }),
    });
    assert.equal(createResponse.status, 200);
    const createText = await createResponse.text();
    assert.match(createText, /resp_test_123/);
    assert.doesNotMatch(createText, new RegExp(apiKey));
    assert.equal(calls[0].url, "https://ark.cn-beijing.volces.com/api/v3/responses");
    assert.equal(calls[0].init.method, "POST");
    assert.equal(calls[0].init.headers.authorization, `Bearer ${apiKey}`);
    assert.equal(calls[0].init.headers["x-fornax-trace"], "true");

    for (const [action, expectedSuffix, expectedMethod] of [
      ["retrieve", "/responses/resp_test_123", "GET"],
      ["list-input-items", "/responses/resp_test_123/input_items", "GET"],
      ["delete", "/responses/resp_test_123", "DELETE"],
    ]) {
      const managementResponse = await request("/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          apiKey,
          trace: false,
          responseId: "resp_test_123",
        }),
      });
      assert.equal(managementResponse.status, 200);
      const call = calls.at(-1);
      assert.equal(call.url, `https://ark.cn-beijing.volces.com/api/v3${expectedSuffix}`);
      assert.equal(call.init.method, expectedMethod);
      assert.equal(call.init.body, undefined);
    }

    const streamResponse = await request("/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "create",
        apiKey,
        trace: false,
        requestBody: {
          model: "doubao-seed-2-1-pro-260628",
          input: "stream hello",
          stream: true,
        },
      }),
    });
    assert.equal(streamResponse.status, 200);
    assert.match(
      streamResponse.headers.get("content-type") ?? "",
      /text\/event-stream/,
    );
    const streamText = await streamResponse.text();
    assert.match(streamText, /response\.completed/);
    assert.doesNotMatch(streamText, new RegExp(apiKey));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects unsafe or incompatible Responses API payloads before upstream calls", async () => {
  const apiKey = "test-responses-key-not-real";
  async function invalid(requestBody) {
    return request("/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "create",
        apiKey,
        trace: false,
        requestBody,
      }),
    });
  }

  const unknownField = await invalid({
    model: "doubao-seed-2-1-pro-260628",
    input: "hello",
    arbitrary_proxy_option: true,
  });
  assert.equal(unknownField.status, 400);
  assert.match(await unknownField.text(), /未支持字段/);

  const privateAsset = await invalid({
    model: "doubao-seed-2-1-pro-260628",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: "read" },
          { type: "input_image", image_url: "http://127.0.0.1/private.png" },
        ],
      },
    ],
  });
  assert.equal(privateAsset.status, 400);
  assert.match(await privateAsset.text(), /公网 HTTPS URL/);

  const instructionsCache = await invalid({
    model: "doubao-seed-2-1-pro-260628",
    input: "hello",
    instructions: "system",
    caching: { type: "enabled" },
  });
  assert.equal(instructionsCache.status, 400);
  assert.match(await instructionsCache.text(), /互斥/);

  const toolCache = await invalid({
    model: "doubao-seed-2-1-pro-260628",
    input: "weather",
    caching: { type: "enabled" },
    tools: [{ type: "web_search" }],
  });
  assert.equal(toolCache.status, 400);
  assert.match(await toolCache.text(), /Function Calling 以外/);

  const schemaCache = await invalid({
    model: "doubao-seed-2-1-pro-260628",
    input: "json",
    caching: { type: "enabled" },
    text: {
      format: {
        type: "json_schema",
        name: "demo",
        schema: { type: "object" },
      },
    },
  });
  assert.equal(schemaCache.status, 400);
  assert.match(await schemaCache.text(), /不支持 json_schema/);

  const prefixStream = await invalid({
    model: "doubao-seed-2-1-pro-260628",
    input: "long prefix",
    caching: { type: "enabled", prefix: true },
    stream: true,
  });
  assert.equal(prefixStream.status, 400);
  assert.match(await prefixStream.text(), /stream 不能/);

  const invalidId = await request("/api/responses", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "retrieve",
      apiKey,
      trace: false,
      responseId: "../../secrets",
    }),
  });
  assert.equal(invalidId.status, 400);
  assert.match(await invalidId.text(), /resp_/);
});

function validTaskInput() {
  return {
    apiPath: "agent-plan",
    baseUrl: "https://ark.cn-beijing.volces.com/api/plan/v3",
    model: "doubao-seedance-2.0",
    apiKey: "test-agent-key-not-real",
    requestBody: {
      model: "doubao-seedance-2.0",
      content: [
        {
          type: "text",
          text: "将视频1礼盒中的香水替换成图片1中的面霜，运镜不变",
        },
        {
          type: "image_url",
          image_url: {
            url: "https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_edit_pic1.jpg",
          },
          role: "reference_image",
        },
        {
          type: "video_url",
          video_url: {
            url: "https://ark-project.tos-cn-beijing.volces.com/doc_video/r2v_edit_video1.mp4",
          },
          role: "reference_video",
        },
      ],
      ratio: "16:9",
      duration: 5,
      generate_audio: true,
      watermark: true,
    },
  };
}

function validSeedreamInput() {
  return {
    model: "doubao-seedream-5-0-pro-260628",
    prompt:
      "一只橘猫在雨后街头散步，低机位跟拍，霓虹倒影，电影感光影。",
    size: "2K",
    output_format: "png",
    response_format: "url",
    watermark: false,
  };
}
