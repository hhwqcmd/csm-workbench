"use client";

import { useMemo, useState } from "react";
import { CURRENT_LEADERBOARD_ROWS } from "../lib/llm-leaderboards";
import { PelicanTestPanel } from "./PelicanTestPanel";

type BenchmarkKey =
  | "nl2Repo"
  | "hleTools"
  | "gdpvalAaV2"
  | "terminal4"
  | "terminal3"
  | "terminal"
  | "swePro"
  | "frontierSwe"
  | "ale"
  | "mcpAtlas"
  | "deepSwe"
  | "osWorld"
  | "mmmuPro";

type Metric = {
  value: string;
  score: number | null;
  source: string;
  href: string;
};

type TextModel = {
  vendor: string;
  model: string;
  release: string;
  access: string;
  price: string;
  priceNote: string;
  estimatedCost: string;
  context: string;
  parameters: string;
  officialUrl: string;
  metrics: Record<BenchmarkKey, Metric>;
};

type TrackId = "text" | "video" | "image";

type CompetitorModel = {
  vendor: string;
  model: string;
  tier: string;
  price: string;
  priceNote: string;
  estimatedCost?: string;
  parameters: string;
  specLabel: string;
  spec: string;
  href: string;
  isPrimary?: boolean;
};

type ModelTrack = {
  id: TrackId;
  label: string;
  lead: string;
  summary: string;
  comparisonNote: string;
  scope: string;
  models: CompetitorModel[];
};

type Board = {
  eyebrow: string;
  name: string;
  snapshot: string;
  direction: string;
  note: string;
  href: string;
  assessment: {
    source: string;
    href: string;
    rows: Array<{
      category: string;
      weight: string;
      description: string;
      emphasis?: boolean;
    }>;
    summary: string;
  };
  rows: Array<{ model: string; lab: string; value: string; highlight?: boolean }>;
};

const NA = (href: string, source = "本次检索未找到同口径公开值"): Metric => ({
  value: "—",
  score: null,
  source,
  href,
});

const BENCHMARKS: Array<{
  id: BenchmarkKey;
  short: string;
  label: string;
  lens: string;
}> = [
  {
    id: "nl2Repo",
    short: "REPO",
    label: "NL2Repo-Bench",
    lens: "从自然语言需求生成完整代码仓库。",
  },
  {
    id: "hleTools",
    short: "HLE + TOOLS",
    label: "HLE with Tools",
    lens: "厂商披露的工具增强口径，非统一官方榜；题集子集、搜索、浏览与代码工具配置必须随来源阅读。",
  },
  {
    id: "gdpvalAaV2",
    short: "WORK PRODUCT",
    label: "GDPval-AA v2.1",
    lens: "220 项真实职业交付物的 Agent 盲评 Elo；Stirrup + Shell / Web，人类专家 = 1,000。",
  },
  {
    id: "terminal4",
    short: "TERMINAL 4.0",
    label: "Terminal-Bench 4.0",
    lens: "66 项专业终端任务；每项 5 次运行，统一 8 小时 Agent 时限。",
  },
  {
    id: "terminal3",
    short: "TERMINAL 3.0",
    label: "Terminal-Bench 3.0",
    lens: "更高难度、长时限的真实终端与软件工程任务。",
  },
  {
    id: "terminal",
    short: "TERMINAL",
    label: "Terminal-Bench 2.1",
    lens: "终端与软件工程任务。",
  },
  {
    id: "swePro",
    short: "SWE",
    label: "SWE Pro",
    lens: "复杂仓库软件工程。",
  },
  {
    id: "frontierSwe",
    short: "FRONTIER SWE",
    label: "FrontierSWE v2",
    lens: "34 项前沿软件工程任务；每项 5 次运行取 mean@5。",
  },
  {
    id: "ale",
    short: "Long-Horizon",
    label: "Agents’ Last Exam (ALE)",
    lens: "长程任务执行。",
  },
  {
    id: "mcpAtlas",
    short: "MCP",
    label: "MCP-Atlas",
    lens: "MCP 工具调用。",
  },
  {
    id: "deepSwe",
    short: "LONG-HORIZON SWE",
    label: "DeepSWE",
    lens: "113 项长程软件工程任务；3 次运行平均 pass@1。官方榜统一使用 mini-swe-agent；未收录型号保留厂商披露口径，Harness 随来源阅读。",
  },
  {
    id: "osWorld",
    short: "COMPUTER USE",
    label: "OSWorld",
    lens: "真实桌面环境中的视觉理解与操作。",
  },
  {
    id: "mmmuPro",
    short: "MULTIMODAL",
    label: "MMMU-Pro",
    lens: "多学科图文理解与推理。",
  },
];

type NewBenchmarkKey = "hleTools" | "gdpvalAaV2" | "terminal4" | "frontierSwe";

const GDPVAL_AA_V2_URL = "https://artificialanalysis.ai/evaluations/gdpval-aa";
const TERMINAL_BENCH_4_URL = "https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/latest?tab=leaderboard&leaderboard=4-0-0";
const FRONTIER_SWE_V2_URL = "https://www.frontierswe.com/";

const HLE_TOOLS = (score: number, source: string, href: string): Metric => ({
  value: `${score.toFixed(1)}%`,
  score,
  source,
  href,
});

const GDPVAL_AA = (score: number, config: string, confidence: number): Metric => ({
  value: `${score.toLocaleString("en-US")} Elo`,
  score,
  source: `Artificial Analysis · Stirrup / ${config} · 95% CI ±${confidence}`,
  href: GDPVAL_AA_V2_URL,
});

const TERMINAL_4 = (score: number, config: string, confidence: number): Metric => ({
  value: `${score.toFixed(1)}%`,
  score,
  source: `Terminal-Bench 4.0 官方榜 · ${config} · 5 trials/task · 95% CI ±${confidence}`,
  href: TERMINAL_BENCH_4_URL,
});

const FRONTIER_SWE = (score: number, config: string): Metric => ({
  value: `${score.toFixed(1)}%`,
  score,
  source: `FrontierSWE v2 官方榜 · ${config} · mean@5`,
  href: FRONTIER_SWE_V2_URL,
});

// LLM Stats 是聚合榜，只给分值不给 Agent harness 与 effort，来源串必须显式标出这一缺口
const LLM_STATS_UNDISCLOSED = (score: number, href: string): Metric => ({
  value: `${score.toFixed(1)}%`,
  score,
  source: "LLM Stats · 框架未披露",
  href,
});

const UNSCORED_NEW_METRICS = (model: string, href: string): Record<NewBenchmarkKey, Metric> => ({
  hleTools: NA(
    href,
    `${model} 当前快照未找到 HLE with Tools 同口径公开值`,
  ),
  gdpvalAaV2: NA(
    GDPVAL_AA_V2_URL,
    `GDPval-AA v2.1 完整榜未收录 ${model} 精确型号`,
  ),
  terminal4: NA(
    TERMINAL_BENCH_4_URL,
    `Terminal-Bench 4.0 官方榜未收录 ${model} 精确型号`,
  ),
  frontierSwe: NA(
    FRONTIER_SWE_V2_URL,
    `FrontierSWE v2 官方榜未收录 ${model} 精确型号`,
  ),
});

const UNSCORED_METRICS = (model: string, href: string): Record<BenchmarkKey, Metric> => {
  const newMetrics = UNSCORED_NEW_METRICS(model, href);
  return Object.fromEntries(
    BENCHMARKS.map((benchmark) => {
      if (
        benchmark.id === "hleTools"
        || benchmark.id === "gdpvalAaV2"
        || benchmark.id === "terminal4"
        || benchmark.id === "frontierSwe"
      ) {
        return [benchmark.id, newMetrics[benchmark.id]];
      }
      return [
        benchmark.id,
        NA(href, `${model} 当前快照未录入 ${benchmark.label} 同名同版本公开值`),
      ];
    }),
  ) as Record<BenchmarkKey, Metric>;
};

const TEXT_MODELS: TextModel[] = [
  {
    vendor: "火山方舟",
    model: "Doubao-Seed-2.1-Pro",
    release: "2026.06",
    access: "闭源 API",
    price: "¥6 / ¥30",
    priceNote: "中国区标准输入 / 输出",
    estimatedCost: "¥1.68",
    context: "256K",
    parameters: "未披露",
    officialUrl: "https://www.volcengine.com/product/doubao",
    metrics: {
      ...UNSCORED_NEW_METRICS("Doubao-Seed-2.1-Pro", "https://www.volcengine.com/product/doubao"),
      nl2Repo: {
        value: "47.0%",
        score: 47,
        source: "Seed 2.1 发布数据",
        href: "https://www.volcengine.com/product/doubao",
      },
      terminal3: NA(
        "https://www.volcengine.com/product/doubao",
        "火山官方未发布 Terminal-Bench 3.0 同名结果",
      ),
      ale: {
        value: "19.5%",
        score: 19.5,
        source: "ALE 官方榜 · Claude Code",
        href: "https://agents-last-exam.org/leaderboard",
      },
      terminal: {
        value: "71.0%",
        score: 71,
        source: "Seed 2.1 发布数据",
        href: "https://www.volcengine.com/product/doubao",
      },
      mcpAtlas: {
        value: "83.8%",
        score: 83.8,
        source: "Seed 2.1 发布数据",
        href: "https://www.volcengine.com/product/doubao",
      },
      swePro: {
        value: "57.5%",
        score: 57.5,
        source: "Seed 2.1 发布数据",
        href: "https://www.volcengine.com/product/doubao",
      },
      deepSwe: NA(
        "https://artificialanalysis.ai/agents/coding-agents",
        "AA v1.5 未收录该模型 / Agent 配置",
      ),
      osWorld: {
        value: "78.8%",
        score: 78.8,
        source: "LLM Stats · 厂商披露",
        href: "https://llm-stats.com/benchmarks/osworld",
      },
      mmmuPro: {
        value: "82.7%",
        score: 82.7,
        source: "LLM Stats · 厂商披露",
        href: "https://llm-stats.com/benchmarks/mmmu-pro",
      },
    },
  },
  {
    vendor: "火山方舟",
    model: "Doubao-Seed-2.1-Turbo",
    release: "2026.06",
    access: "闭源 API",
    price: "¥3 / ¥15",
    priceNote: "中国区标准输入 / 输出",
    estimatedCost: "¥0.84",
    context: "256K",
    parameters: "未披露",
    officialUrl: "https://www.volcengine.com/product/doubao",
    metrics: {
      ...UNSCORED_METRICS(
        "Doubao-Seed-2.1-Turbo",
        "https://www.volcengine.com/product/doubao",
      ),
      swePro: LLM_STATS_UNDISCLOSED(57, "https://llm-stats.com/benchmarks/swe-bench-pro"),
      osWorld: LLM_STATS_UNDISCLOSED(76.4, "https://llm-stats.com/benchmarks/osworld"),
      mmmuPro: LLM_STATS_UNDISCLOSED(82.2, "https://llm-stats.com/benchmarks/mmmu-pro"),
    },
  },
  {
    vendor: "Anthropic",
    model: "Claude Fable 5",
    release: "2026.06",
    access: "闭源 API",
    price: "$10 / $50",
    priceNote: "全球 API 输入 / 输出",
    estimatedCost: "$1.85",
    context: "官方产品页未披露",
    parameters: "未披露",
    officialUrl: "https://www.anthropic.com/claude/fable",
    metrics: {
      ...UNSCORED_NEW_METRICS("Claude Fable 5", "https://www.anthropic.com/claude/fable"),
      hleTools: HLE_TOOLS(
        63.9,
        "Anthropic 系统卡 · full / Search + Fetch + Code + tools / adaptive max / Opus 4.8 fallback",
        "https://www-cdn.anthropic.com/c5fbac3f0b1280a933ebd26d3cb8bb9f5bdeaf48/Claude%20Opus%205%20System%20Card.pdf",
      ),
      gdpvalAaV2: GDPVAL_AA(1595, "adaptive / max / Opus 4.8 fallback", 21),
      terminal4: TERMINAL_4(44.5, "Claude Code 2.1.231 / max", 3.8),
      nl2Repo: NA("https://www.anthropic.com/claude/fable"),
      terminal3: {
        value: "34.1%",
        score: 34.1,
        source: "Terminal-Bench 3.0 官方榜 · Claude Code / max",
        href: "https://www.frontierbench.ai/",
      },
      ale: {
        value: "25.7%",
        score: 25.7,
        source: "ALE 官方榜 · Claude Code / xhigh（40% 任务降级）",
        href: "https://agents-last-exam.org/leaderboard",
      },
      terminal: {
        value: "88.0%",
        score: 88,
        source: "官方模型卡交叉表",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
      mcpAtlas: {
        value: "84.7%",
        score: 84.7,
        source: "官方模型卡交叉表",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
      swePro: {
        value: "80.0%",
        score: 80,
        source: "LLM Stats · 厂商披露",
        href: "https://llm-stats.com/benchmarks/swe-bench-pro",
      },
      deepSwe: {
        value: "70%",
        score: 70,
        source: "DeepSWE 官方榜 · mini-swe-agent / xhigh",
        href: "https://deepswe.datacurve.ai/",
      },
      osWorld: {
        value: "85.0%",
        score: 85,
        source: "Kimi 官方模型卡 · Verified",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
      mmmuPro: {
        value: "81.2%",
        score: 81.2,
        source: "Kimi 官方模型卡 · 无工具",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
    },
  },
  {
    vendor: "Anthropic",
    model: "Claude Fable 5.1",
    release: "2026.09.01",
    access: "闭源 API",
    price: "$10 / $50",
    priceNote: "全球 API 输入 / 输出；缓存读取 $0.25",
    estimatedCost: "$1.1375",
    context: "1M",
    parameters: "未披露",
    officialUrl: "https://www.anthropic.com/claude/fable",
    metrics: {
      ...UNSCORED_NEW_METRICS("Claude Fable 5.1", "https://www.anthropic.com/claude/fable"),
      hleTools: HLE_TOOLS(
        65.0,
        "Anthropic 官方 · full / Search + Fetch + Code + tools / max / Opus 4.8 fallback",
        "https://www.anthropic.com/claude/fable",
      ),
      gdpvalAaV2: GDPVAL_AA(1735, "adaptive / max / default fallback", 25),
      terminal4: TERMINAL_4(57.9, "Claude Code / max", 3.8),
      frontierSwe: FRONTIER_SWE(56.3, "proximus"),
      nl2Repo: NA(
        "https://www.anthropic.com/claude/fable",
        "Anthropic 与当前独立榜未发布 Fable 5.1 的 NL2Repo 同名结果",
      ),
      terminal3: NA(
        "https://www.frontierbench.ai/",
        "Terminal-Bench 3.0 官方榜未收录 Claude Fable 5.1",
      ),
      terminal: {
        value: "91.4%",
        score: 91.4,
        source: "Artificial Analysis · Terminal-Bench 2.1 / max",
        href: "https://artificialanalysis.ai/models/releases/claude-fable-5-1",
      },
      swePro: NA(
        "https://www.anthropic.com/claude/fable",
        "Anthropic 与当前独立榜未发布 Fable 5.1 的 SWE Pro 同名结果",
      ),
      ale: NA(
        "https://agents-last-exam.org/leaderboard",
        "ALE 官方榜未收录 Claude Fable 5.1",
      ),
      mcpAtlas: NA(
        "https://www.anthropic.com/claude/fable",
        "Anthropic 与当前独立榜未发布 Fable 5.1 的 MCP-Atlas 同名结果",
      ),
      deepSwe: NA(
        "https://deepswe.datacurve.ai/",
        "DeepSWE 官方榜未收录 Claude Fable 5.1",
      ),
      osWorld: {
        value: "77.9%",
        score: 77.9,
        source: "Anthropic 官方 · OSWorld 2.0 / max",
        href: "https://www.anthropic.com/claude/fable",
      },
      mmmuPro: NA(
        "https://www.anthropic.com/claude/fable",
        "Anthropic 未发布 Fable 5.1 的 MMMU-Pro 结果",
      ),
    },
  },
  {
    vendor: "Anthropic",
    model: "Claude Mythos 5.1",
    release: "2026.09.01",
    access: "闭源 API（Cyber 门控）",
    price: "$10 / $50",
    priceNote: "全球 API 输入 / 输出；缓存读取 $0.25",
    estimatedCost: "$1.1375",
    context: "1M / 128k 输出",
    parameters: "未披露",
    officialUrl: "https://platform.claude.com/docs/en/models/mythos-5-1/overview",
    metrics: {
      ...UNSCORED_NEW_METRICS(
        "Claude Mythos 5.1",
        "https://www.anthropic.com/claude-fable-5-1-mythos-5-1-system-card",
      ),
      terminal4: {
        value: "60.9%",
        score: 60.9,
        source: "Anthropic 系统卡 · Terminal-Bench 4.0 / Mythos（Cyber 门控）· 非统一榜口径",
        href: "https://www.anthropic.com/claude-fable-5-1-mythos-5-1-system-card",
      },
      nl2Repo: NA("https://www.anthropic.com/claude-fable-5-1-mythos-5-1-system-card"),
      terminal3: NA(
        "https://www.frontierbench.ai/",
        "Terminal-Bench 3.0 官方榜未收录 Claude Mythos 5.1",
      ),
      terminal: NA("https://www.anthropic.com/claude-fable-5-1-mythos-5-1-system-card"),
      ale: NA(
        "https://agents-last-exam.org/leaderboard",
        "ALE 官方榜未收录 Claude Mythos 5.1",
      ),
      mcpAtlas: NA("https://www.anthropic.com/claude-fable-5-1-mythos-5-1-system-card"),
      swePro: NA("https://www.anthropic.com/claude-fable-5-1-mythos-5-1-system-card"),
      deepSwe: NA(
        "https://deepswe.datacurve.ai/",
        "DeepSWE 官方榜未收录 Claude Mythos 5.1",
      ),
      osWorld: NA("https://www.anthropic.com/claude-fable-5-1-mythos-5-1-system-card"),
      mmmuPro: NA(
        "https://www.anthropic.com/claude-fable-5-1-mythos-5-1-system-card",
        "Anthropic 未发布 Mythos 5.1 的 MMMU-Pro 结果",
      ),
    },
  },
  {
    vendor: "Anthropic",
    model: "Claude Opus 5",
    release: "2026.07.24",
    access: "闭源 API",
    price: "$5 / $25",
    priceNote: "全球 API 输入 / 输出",
    estimatedCost: "$0.925",
    context: "1M",
    parameters: "未披露",
    officialUrl: "https://www.anthropic.com/news/claude-opus-5",
    metrics: {
      ...UNSCORED_NEW_METRICS("Claude Opus 5", "https://www.anthropic.com/news/claude-opus-5"),
      hleTools: HLE_TOOLS(
        64.7,
        "Anthropic 系统卡 · full / Search + Fetch + Code + tools / adaptive max",
        "https://www-cdn.anthropic.com/c5fbac3f0b1280a933ebd26d3cb8bb9f5bdeaf48/Claude%20Opus%205%20System%20Card.pdf",
      ),
      gdpvalAaV2: GDPVAL_AA(1708, "adaptive / max", 25),
      terminal4: TERMINAL_4(51.8, "Claude Code 2.1.231 / max", 3.4),
      nl2Repo: NA(
        "https://www.anthropic.com/news/claude-opus-5",
        "Anthropic 与当前独立榜未发布 Opus 5 的 NL2Repo 同名结果",
      ),
      terminal3: {
        value: "42.7%",
        score: 42.7,
        source: "Terminal-Bench 3.0 官方榜 · mini-SWE-agent / max",
        href: "https://www.frontierbench.ai/",
      },
      ale: {
        value: "31.6%",
        score: 31.6,
        source: "ALE 官方榜 · Claude Code / high",
        href: "https://agents-last-exam.org/leaderboard",
      },
      terminal: {
        value: "89.1%",
        score: 89.1,
        source: "Artificial Analysis · Terminal-Bench 2.1 / max",
        href: "https://artificialanalysis.ai/models/claude-opus-5",
      },
      mcpAtlas: {
        value: "85.8%",
        score: 85.8,
        source: "Anthropic 系统卡 · max",
        href: "https://www-cdn.anthropic.com/c5fbac3f0b1280a933ebd26d3cb8bb9f5bdeaf48/Claude%20Opus%205%20System%20Card.pdf",
      },
      swePro: {
        value: "79.2%",
        score: 79.2,
        source: "Anthropic 系统卡 · adaptive thinking / max",
        href: "https://www-cdn.anthropic.com/c5fbac3f0b1280a933ebd26d3cb8bb9f5bdeaf48/Claude%20Opus%205%20System%20Card.pdf",
      },
      deepSwe: {
        value: "74%",
        score: 74,
        source: "DeepSWE 官方榜 · mini-swe-agent / max",
        href: "https://deepswe.datacurve.ai/",
      },
      osWorld: {
        value: "70.6%",
        score: 70.6,
        source: "Anthropic 系统卡 · OSWorld 2.0 / max",
        href: "https://www-cdn.anthropic.com/c5fbac3f0b1280a933ebd26d3cb8bb9f5bdeaf48/Claude%20Opus%205%20System%20Card.pdf",
      },
      mmmuPro: NA(
        "https://www.anthropic.com/news/claude-opus-5",
        "Anthropic 系统卡未发布 Opus 5 的 MMMU-Pro 结果",
      ),
    },
  },
  {
    vendor: "Anthropic",
    model: "Claude Opus 5.5",
    release: "2026.09.22",
    access: "闭源 API",
    price: "$4 / $20",
    priceNote: "全球 API 输入 / 输出；缓存读取 $0.20",
    estimatedCost: "$0.55",
    context: "1M",
    parameters: "未披露",
    officialUrl: "https://www.anthropic.com/news/claude-opus-5-5",
    metrics: {
      ...UNSCORED_NEW_METRICS("Claude Opus 5.5", "https://www.anthropic.com/news/claude-opus-5-5"),
      hleTools: HLE_TOOLS(
        67.7,
        "Anthropic 官方 · HLE / tools / max",
        "https://www.anthropic.com/news/claude-opus-5-5",
      ),
      gdpvalAaV2: GDPVAL_AA(1846, "adaptive / max / default fallback", 23),
      terminal4: {
        value: "66.4%",
        score: 66.4,
        source: "Anthropic 官方 · Terminal-Bench 4.0 / xhigh / 生产护栏启用 · ±2.6 · 非官方榜口径",
        href: "https://www.anthropic.com/news/claude-opus-5-5",
      },
      nl2Repo: NA("https://www.anthropic.com/news/claude-opus-5-5"),
      terminal3: NA(
        "https://www.frontierbench.ai/",
        "Terminal-Bench 3.0 官方榜未收录 Claude Opus 5.5",
      ),
      ale: NA(
        "https://agents-last-exam.org/leaderboard",
        "ALE 官方榜未收录 Claude Opus 5.5",
      ),
      terminal: NA("https://www.anthropic.com/news/claude-opus-5-5"),
      mcpAtlas: NA("https://www.anthropic.com/news/claude-opus-5-5"),
      swePro: NA("https://www.anthropic.com/news/claude-opus-5-5"),
      deepSwe: NA(
        "https://deepswe.datacurve.ai/",
        "DeepSWE 官方榜未收录 Claude Opus 5.5",
      ),
      osWorld: {
        value: "81.8%",
        score: 81.8,
        source: "Anthropic 官方 · OSWorld 2.0 / partial",
        href: "https://www.anthropic.com/news/claude-opus-5-5",
      },
      mmmuPro: NA(
        "https://www.anthropic.com/news/claude-opus-5-5",
        "Anthropic 未发布 Opus 5.5 的 MMMU-Pro 结果",
      ),
    },
  },
  {
    vendor: "Anthropic",
    model: "Claude Sonnet 5",
    release: "2026.07",
    access: "闭源 API",
    price: "$2 / $10",
    priceNote: "全球 API 标准输入 / 输出",
    estimatedCost: "$0.37",
    context: "1M",
    parameters: "未披露",
    officialUrl: "https://platform.claude.com/docs/en/about-claude/models/overview",
    metrics: {
      ...UNSCORED_METRICS(
        "Claude Sonnet 5",
        "https://platform.claude.com/docs/en/about-claude/models/overview",
      ),
      hleTools: HLE_TOOLS(
        57.4,
        "Anthropic 系统卡 · full / Search + Fetch + Code + tools / auto max",
        "https://www.anthropic.com/claude-sonnet-5-system-card",
      ),
      gdpvalAaV2: GDPVAL_AA(1449, "adaptive / max", 22),
      terminal4: TERMINAL_4(12.4, "Claude Code 2.1.231 / max", 3.1),
      deepSwe: {
        value: "54%",
        score: 54,
        source: "DeepSWE 官方榜 · mini-swe-agent / max",
        href: "https://deepswe.datacurve.ai/",
      },
      swePro: LLM_STATS_UNDISCLOSED(63.2, "https://llm-stats.com/benchmarks/swe-bench-pro"),
    },
  },
  {
    vendor: "Anthropic",
    model: "Claude Sonnet 5.5",
    release: "2026.09.28",
    access: "闭源 API",
    price: "$2 / $10",
    priceNote: "全球 API 输入 / 输出；缓存读取 $0.20",
    estimatedCost: "$0.37",
    context: "1M / 128k 输出",
    parameters: "未披露",
    officialUrl: "https://www.anthropic.com/claude-sonnet-5-5",
    metrics: {
      ...UNSCORED_NEW_METRICS(
        "Claude Sonnet 5.5",
        "https://www.anthropic.com/claude-sonnet-5-5-system-card",
      ),
      hleTools: HLE_TOOLS(
        64.5,
        "Anthropic 官方 · HLE / with tools / max",
        "https://www.anthropic.com/claude-sonnet-5-5",
      ),
      gdpvalAaV2: GDPVAL_AA(1844, "adaptive / max / default fallback", 24),
      terminal4: {
        value: "70.6%",
        score: 70.6,
        source: "Anthropic 官方 · Terminal-Bench 4.0 / max · 非统一榜口径",
        href: "https://www.anthropic.com/claude-sonnet-5-5",
      },
      nl2Repo: NA("https://www.anthropic.com/claude-sonnet-5-5"),
      terminal3: NA(
        "https://www.frontierbench.ai/",
        "Terminal-Bench 3.0 官方榜未收录 Claude Sonnet 5.5",
      ),
      terminal: NA("https://www.anthropic.com/claude-sonnet-5-5"),
      ale: NA(
        "https://agents-last-exam.org/leaderboard",
        "ALE 官方榜未收录 Claude Sonnet 5.5",
      ),
      mcpAtlas: NA("https://www.anthropic.com/claude-sonnet-5-5"),
      swePro: NA("https://www.anthropic.com/claude-sonnet-5-5"),
      deepSwe: NA(
        "https://deepswe.datacurve.ai/",
        "DeepSWE 官方榜未收录 Claude Sonnet 5.5",
      ),
      osWorld: {
        value: "80.1%",
        score: 80.1,
        source: "Anthropic 官方 · OSWorld 2.1 / partial",
        href: "https://www.anthropic.com/claude-sonnet-5-5",
      },
      mmmuPro: NA(
        "https://www.anthropic.com/claude-sonnet-5-5",
        "Anthropic 未发布 Sonnet 5.5 的 MMMU-Pro 结果",
      ),
    },
  },
  {
    vendor: "OpenAI",
    model: "GPT-6 Astra",
    release: "2026.09.03",
    access: "闭源 API",
    price: "$10 / $50",
    priceNote: "全球 API 输入 / 输出",
    estimatedCost: "$1.85",
    context: "1.05M",
    parameters: "未披露",
    officialUrl: "https://developers.openai.com/api/docs/models/compare",
    metrics: {
      ...UNSCORED_NEW_METRICS("GPT-6 Astra", "https://developers.openai.com/api/docs/models/compare"),
      hleTools: HLE_TOOLS(
        57.2,
        "OpenAI 官方发布 · tools 口径",
        "https://developers.openai.com/api/docs/models/compare",
      ),
      gdpvalAaV2: GDPVAL_AA(1542, "max", 25),
      terminal4: TERMINAL_4(58.2, "Codex / max", 2.8),
      nl2Repo: NA("https://developers.openai.com/api/docs/models/compare"),
      terminal3: NA("https://developers.openai.com/api/docs/models/compare"),
      ale: {
        value: "59.3%",
        score: 59.3,
        source: "OpenAI 官方发布 · ALE 口径",
        href: "https://developers.openai.com/api/docs/models/compare",
      },
      terminal: NA("https://developers.openai.com/api/docs/models/compare"),
      mcpAtlas: NA("https://developers.openai.com/api/docs/models/compare"),
      swePro: NA("https://developers.openai.com/api/docs/models/compare"),
      deepSwe: {
        value: "74%",
        score: 74,
        source: "DeepSWE 官方榜 · mini-swe-agent / xhigh",
        href: "https://deepswe.datacurve.ai/",
      },
      osWorld: {
        value: "72.6%",
        score: 72.6,
        source: "OpenAI 官方发布 · OSWorld 2.0 口径",
        href: "https://developers.openai.com/api/docs/models/compare",
      },
      mmmuPro: NA("https://developers.openai.com/api/docs/models/compare"),
    },
  },
  {
    vendor: "OpenAI",
    model: "GPT-6.1 Sol",
    release: "2026.09.29",
    access: "闭源 API",
    price: "$2 / $10",
    priceNote: "全球 API 输入 / 输出；缓存输入 $0.10",
    estimatedCost: "$0.275",
    context: "1.1M",
    parameters: "未披露",
    officialUrl: "https://openai.com/index/introducing-gpt-6-1-sol/",
    metrics: UNSCORED_METRICS(
      "GPT-6.1 Sol",
      "https://openai.com/index/introducing-gpt-6-1-sol/",
    ),
  },
  {
    vendor: "OpenAI",
    model: "GPT-6 Sol",
    release: "2026.09.22",
    access: "闭源 API",
    price: "$2 / $10",
    priceNote: "全球 API 输入 / 输出；缓存输入 $0.20",
    estimatedCost: "$0.37",
    context: "872k",
    parameters: "未披露",
    officialUrl: "https://developers.openai.com/api/docs/models/compare",
    metrics: {
      ...UNSCORED_METRICS(
        "GPT-6 Sol",
        "https://developers.openai.com/api/docs/models/compare",
      ),
      gdpvalAaV2: GDPVAL_AA(1487, "max", 19),
    },
  },
  {
    vendor: "OpenAI",
    model: "GPT-6 Luna",
    release: "2026.09.22",
    access: "闭源 API",
    price: "$0.10 / $0.50",
    priceNote: "全球 API 输入 / 输出；缓存输入 $0.01",
    estimatedCost: "$0.0185",
    context: "1M",
    parameters: "未披露",
    officialUrl: "https://developers.openai.com/api/docs/models/compare",
    metrics: {
      ...UNSCORED_METRICS(
        "GPT-6 Luna",
        "https://developers.openai.com/api/docs/models/compare",
      ),
      gdpvalAaV2: GDPVAL_AA(1367, "max", 19),
    },
  },
  {
    vendor: "OpenAI",
    model: "GPT-5.6 Sol",
    release: "2026.07",
    access: "闭源 API",
    price: "$4 / $20",
    priceNote: "全球 API 输入 / 输出",
    estimatedCost: "$0.74",
    context: "1.05M",
    parameters: "未披露",
    officialUrl: "https://openai.com/index/gpt-5-6/",
    metrics: {
      ...UNSCORED_NEW_METRICS("GPT-5.6 Sol", "https://openai.com/index/gpt-5-6/"),
      hleTools: HLE_TOOLS(
        58,
        "Qwen 官方交叉评测 · max / tools 与 harness 未披露",
        "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B",
      ),
      gdpvalAaV2: GDPVAL_AA(1588, "max", 21),
      terminal4: TERMINAL_4(37.3, "Codex 0.149.1 / max", 3.8),
      nl2Repo: NA("https://openai.com/index/gpt-5-6/"),
      terminal3: {
        value: "34.6%",
        score: 34.6,
        source: "Terminal-Bench 3.0 官方榜 · Codex / max",
        href: "https://www.frontierbench.ai/",
      },
      ale: {
        value: "30.6%",
        score: 30.6,
        source: "ALE 官方榜 · Codex / xhigh",
        href: "https://agents-last-exam.org/leaderboard",
      },
      terminal: {
        value: "88.8%",
        score: 88.8,
        source: "OpenAI 官方发布",
        href: "https://openai.com/index/gpt-5-6/",
      },
      mcpAtlas: {
        value: "83.6%",
        score: 83.6,
        source: "官方模型卡交叉表",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
      swePro: {
        value: "64.6%",
        score: 64.6,
        source: "LLM Stats · 厂商披露",
        href: "https://llm-stats.com/benchmarks/swe-bench-pro",
      },
      frontierSwe: FRONTIER_SWE(32.2, "proximus"),
      deepSwe: {
        value: "73%",
        score: 73,
        source: "DeepSWE 官方榜 · mini-swe-agent / max",
        href: "https://deepswe.datacurve.ai/",
      },
      osWorld: {
        value: "83.0%",
        score: 83,
        source: "Kimi 官方模型卡 · Verified",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
      mmmuPro: {
        value: "83.0%",
        score: 83,
        source: "Kimi 官方模型卡 · 无工具",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
    },
  },
  {
    vendor: "OpenAI",
    model: "GPT-5.6 Terra",
    release: "2026.07",
    access: "闭源 API",
    price: "$2 / $12",
    priceNote: "全球 API 输入 / 输出",
    estimatedCost: "$0.39",
    context: "1.05M",
    parameters: "未披露",
    officialUrl: "https://developers.openai.com/api/docs/models/compare",
    metrics: {
      ...UNSCORED_METRICS(
        "GPT-5.6 Terra",
        "https://developers.openai.com/api/docs/models/compare",
      ),
      gdpvalAaV2: GDPVAL_AA(1432, "max", 22),
      terminal4: TERMINAL_4(21.5, "Codex 0.149.1 / max", 3.3),
      ale: {
        value: "28.0%",
        score: 28,
        source: "ALE 官方榜 · Codex / max",
        href: "https://agents-last-exam.org/leaderboard",
      },
      swePro: LLM_STATS_UNDISCLOSED(63.4, "https://llm-stats.com/benchmarks/swe-bench-pro"),
      mmmuPro: LLM_STATS_UNDISCLOSED(80.7, "https://llm-stats.com/benchmarks/mmmu-pro"),
    },
  },
  {
    vendor: "OpenAI",
    model: "GPT-5.6 Luna",
    release: "2026.07",
    access: "闭源 API",
    price: "$0.20 / $1.20",
    priceNote: "全球 API 输入 / 输出",
    estimatedCost: "$0.039",
    context: "1.05M",
    parameters: "未披露",
    officialUrl: "https://developers.openai.com/api/docs/models/compare",
    metrics: {
      ...UNSCORED_METRICS(
        "GPT-5.6 Luna",
        "https://developers.openai.com/api/docs/models/compare",
      ),
      gdpvalAaV2: GDPVAL_AA(1443, "max", 22),
      terminal4: TERMINAL_4(17.3, "Codex 0.149.1 / max", 2.8),
      ale: {
        value: "30.3%",
        score: 30.3,
        source: "ALE 官方榜 · Codex / xhigh",
        href: "https://agents-last-exam.org/leaderboard",
      },
      deepSwe: {
        value: "67%",
        score: 67,
        source: "DeepSWE 官方榜 · mini-swe-agent / max",
        href: "https://deepswe.datacurve.ai/",
      },
      swePro: LLM_STATS_UNDISCLOSED(62.7, "https://llm-stats.com/benchmarks/swe-bench-pro"),
      mmmuPro: LLM_STATS_UNDISCLOSED(78.4, "https://llm-stats.com/benchmarks/mmmu-pro"),
    },
  },
  {
    vendor: "腾讯",
    model: "Hy4 preview",
    release: "2026.08",
    access: "开放权重 / API",
    price: "¥6 / ¥18",
    priceNote: "腾讯云 TokenHub 广州输入 / 输出",
    estimatedCost: "¥0.705",
    context: "1M",
    parameters: "770B / 49B 激活",
    officialUrl: "https://github.com/Tencent-Hunyuan/Hy4-preview",
    metrics: {
      ...UNSCORED_NEW_METRICS("Hy4 preview", "https://github.com/Tencent-Hunyuan/Hy4-preview"),
      hleTools: HLE_TOOLS(
        55.4,
        "腾讯混元官方 · text-only / high / 约 2.23% 截断 / harness 未披露",
        "https://github.com/Tencent-Hunyuan/Hy4-preview",
      ),
      nl2Repo: {
        value: "58.9%",
        score: 58.9,
        source: "腾讯混元官方模型卡 · Claude Code / 1000 turns",
        href: "https://github.com/Tencent-Hunyuan/Hy4-preview",
      },
      terminal3: NA(
        "https://www.frontierbench.ai/",
        "腾讯混元官方与 Terminal-Bench 3.0 官方榜未发布同名结果",
      ),
      terminal: {
        value: "85.4%",
        score: 85.4,
        source: "腾讯混元官方模型卡 · Terminal-Bench 2.1 / Claude Code",
        href: "https://github.com/Tencent-Hunyuan/Hy4-preview",
      },
      swePro: {
        value: "65.7%",
        score: 65.7,
        source: "腾讯混元官方模型卡 · SWE-bench Pro / swe-agent",
        href: "https://github.com/Tencent-Hunyuan/Hy4-preview",
      },
      ale: {
        value: "22.8%",
        score: 22.8,
        source: "腾讯混元官方模型卡 · ALE-CLI / Claude Code",
        href: "https://github.com/Tencent-Hunyuan/Hy4-preview",
      },
      mcpAtlas: {
        value: "83.7%",
        score: 83.7,
        source: "腾讯混元官方模型卡 · MCP-Atlas public / Claude Code",
        href: "https://github.com/Tencent-Hunyuan/Hy4-preview",
      },
      deepSwe: {
        value: "64.3%",
        score: 64.3,
        source: "腾讯混元官方模型卡 · DeepSWE / mini-swe-agent",
        href: "https://github.com/Tencent-Hunyuan/Hy4-preview",
      },
      osWorld: NA(
        "https://github.com/Tencent-Hunyuan/Hy4-preview",
        "腾讯混元官方未发布 Hy4 preview 的 OSWorld 同名结果",
      ),
      mmmuPro: NA(
        "https://github.com/Tencent-Hunyuan/Hy4-preview",
        "腾讯混元官方未发布 Hy4 preview 的 MMMU-Pro 结果",
      ),
    },
  },
  {
    vendor: "阿里云",
    model: "Qwen3.8-Max",
    release: "2026.08",
    access: "API / 权重待开放",
    price: "¥12 / ¥36",
    priceNote: "中国区标准输入 / 输出",
    estimatedCost: "¥2.265",
    context: "1M",
    parameters: "2.4T / 95B 激活",
    officialUrl: "https://www.qianwenai.com/models/qwen3.8-max",
    metrics: {
      ...UNSCORED_NEW_METRICS("Qwen3.8-Max", "https://qwen.ai/blog?id=qwen3.8"),
      hleTools: HLE_TOOLS(
        56.2,
        "Qwen 官方模型卡 · tools / harness 与 effort 未披露",
        "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B",
      ),
      gdpvalAaV2: GDPVAL_AA(1668, "0902 checkpoint", 26),
      nl2Repo: {
        value: "55.9%",
        score: 55.9,
        source: "Qwen 官方 · Claude Code",
        href: "https://qwen.ai/blog?id=qwen3.8",
      },
      terminal3: NA(
        "https://qwen.ai/blog?id=qwen3.8",
        "Qwen 官方与 Terminal-Bench 3.0 官方榜未发布同名结果",
      ),
      ale: {
        value: "27.0%",
        score: 27,
        source: "Qwen 官方 · Pass / Agent 框架未披露",
        href: "https://qwen.ai/blog?id=qwen3.8",
      },
      terminal: {
        value: "86.6%",
        score: 86.6,
        source: "Qwen 官方 · Claude Code / avg@10",
        href: "https://qwen.ai/blog?id=qwen3.8",
      },
      mcpAtlas: NA(
        "https://qwen.ai/blog?id=qwen3.8",
        "Qwen 官方未发布 MCP-Atlas / Agent 框架",
      ),
      swePro: {
        value: "67.7%",
        score: 67.7,
        source: "Qwen 官方 · Claude Code",
        href: "https://qwen.ai/blog?id=qwen3.8",
      },
      frontierSwe: FRONTIER_SWE(15.8, "proximus"),
      deepSwe: {
        value: "57%",
        score: 57,
        source: "DeepSWE 官方榜 · mini-swe-agent / xhigh",
        href: "https://deepswe.datacurve.ai/",
      },
      osWorld: {
        value: "86.1%",
        score: 86.1,
        source: "Qwen 官方 · OSWorld-Verified / 框架未披露",
        href: "https://qwen.ai/blog?id=qwen3.8",
      },
      mmmuPro: {
        value: "82.3%",
        score: 82.3,
        source: "Qwen 官方 · 内部评估 / 无 Agent 框架",
        href: "https://qwen.ai/blog?id=qwen3.8",
      },
    },
  },
  {
    vendor: "阿里云",
    model: "Qwen3.8-Flash",
    release: "2026.08.26",
    access: "闭源 API",
    price: "¥0.8 / ¥2.7",
    priceNote: "中国区华北 2 输入 / 输出",
    estimatedCost: "¥0.154",
    context: "1M",
    parameters: "未独立披露",
    officialUrl: "https://help.aliyun.com/zh/model-studio/qwen3-8-flash",
    metrics: UNSCORED_METRICS(
      "Qwen3.8-Flash",
      "https://help.aliyun.com/zh/model-studio/qwen3-8-flash",
    ),
  },
  {
    vendor: "阿里云",
    model: "Qwen3.8-27B",
    release: "2026.08.14",
    access: "开放权重 / API",
    price: "¥3 / ¥12",
    priceNote: "中国区华北 2 输入 / 输出",
    estimatedCost: "¥0.81",
    context: "1M",
    parameters: "27B",
    officialUrl: "https://help.aliyun.com/zh/model-studio/qwen3-8-27b",
    metrics: {
      ...UNSCORED_NEW_METRICS("Qwen3.8-27B", "https://huggingface.co/Qwen/Qwen3.8-27B/blob/main/README.md"),
      gdpvalAaV2: GDPVAL_AA(1409, "xhigh", 26),
      nl2Repo: {
        value: "42.3%",
        score: 42.3,
        source: "Qwen 官方模型卡 · Claude Code",
        href: "https://huggingface.co/Qwen/Qwen3.8-27B/blob/main/README.md",
      },
      terminal3: NA(
        "https://www.frontierbench.ai/",
        "Qwen 官方与 Terminal-Bench 3.0 官方榜未发布同名结果",
      ),
      ale: {
        value: "20.4%",
        score: 20.4,
        source: "Qwen 官方模型卡 · Claude Code / max",
        href: "https://huggingface.co/Qwen/Qwen3.8-27B/blob/main/README.md",
      },
      terminal: {
        value: "73.0%",
        score: 73,
        source: "Qwen 官方模型卡 · Terminus",
        href: "https://huggingface.co/Qwen/Qwen3.8-27B/blob/main/README.md",
      },
      mcpAtlas: NA(
        "https://huggingface.co/Qwen/Qwen3.8-27B/blob/main/README.md",
        "Qwen 官方模型卡未发布 MCP-Atlas 同名结果",
      ),
      swePro: {
        value: "61.7%",
        score: 61.7,
        source: "Qwen 官方模型卡 · Claude Code / 256K",
        href: "https://huggingface.co/Qwen/Qwen3.8-27B/blob/main/README.md",
      },
      deepSwe: {
        value: "42.2%",
        score: 42.2,
        source: "Qwen 官方模型卡 · DeepSWE 1.1 / Claude Code / 256K",
        href: "https://huggingface.co/Qwen/Qwen3.8-27B/blob/main/README.md",
      },
      osWorld: {
        value: "84.3%",
        score: 84.3,
        source: "Qwen 官方模型卡 · OSWorld-Verified",
        href: "https://huggingface.co/Qwen/Qwen3.8-27B/blob/main/README.md",
      },
      mmmuPro: NA(
        "https://huggingface.co/Qwen/Qwen3.8-27B/blob/main/README.md",
        "Qwen 官方模型卡未发布 MMMU-Pro 结果",
      ),
    },
  },
  {
    vendor: "阶跃星辰",
    model: "Step 5 Preview",
    release: "2026.09",
    access: "闭源 API",
    price: "¥7 / ¥20",
    priceNote: "中国区缓存未命中输入 / 输出；缓存命中 ¥0.35",
    estimatedCost: "¥0.8125",
    context: "1M / 64k 输出",
    parameters: "600B / 27B 激活",
    officialUrl: "https://www.stepfun.com/step-5-preview",
    metrics: {
      ...UNSCORED_METRICS(
        "Step 5 Preview",
        "https://www.stepfun.com/step-5-preview",
      ),
      hleTools: HLE_TOOLS(
        59.4,
        "阶跃官方 · HLE with tools / High / 纯文本子集 · harness 未披露",
        "https://www.stepfun.com/step-5-preview",
      ),
      gdpvalAaV2: GDPVAL_AA(1566, "effort 未标注", 31),
      terminal4: {
        value: "33.3%",
        score: 33.3,
        source: "阶跃官方 · Terminal-Bench 4.0 / harness 未披露 · 非官方榜口径",
        href: "https://www.stepfun.com/step-5-preview",
      },
      terminal: {
        value: "85.0%",
        score: 85,
        source: "阶跃官方 · Terminal-Bench 2.1 / harness 未披露 · 非官方榜口径",
        href: "https://www.stepfun.com/step-5-preview",
      },
      ale: {
        value: "29.5%",
        score: 29.5,
        source: "阶跃官方 · ALE / harness 未披露 · 非官方榜口径",
        href: "https://www.stepfun.com/step-5-preview",
      },
      mcpAtlas: {
        value: "85.6%",
        score: 85.6,
        source: "阶跃官方 · MCP-Atlas / harness 未披露 · 非官方榜口径",
        href: "https://www.stepfun.com/step-5-preview",
      },
      mmmuPro: {
        value: "76.0%",
        score: 76,
        source: "阶跃官方 · MMMU-Pro / harness 未披露 · 非官方榜口径",
        href: "https://www.stepfun.com/step-5-preview",
      },
      deepSwe: {
        value: "67.7%",
        score: 67.7,
        source: "阶跃官方 · DeepSWE v1.1 / harness 未披露 · 非官方榜口径",
        href: "https://www.stepfun.com/step-5-preview",
      },
    },
  },
  {
    vendor: "小米",
    model: "MiMo-V2.6-Pro",
    release: "2026.09.22",
    access: "闭源 API",
    price: "¥3 / ¥6",
    priceNote: "中国区缓存未命中输入 / 输出；缓存命中 ¥0.025",
    estimatedCost: "¥0.20375",
    context: "1M",
    parameters: "1.02T / 42B 激活",
    officialUrl: "https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go",
    metrics: {
      ...UNSCORED_METRICS(
        "MiMo-V2.6-Pro",
        "https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go",
      ),
      gdpvalAaV2: GDPVAL_AA(1673, "effort 未标注", 19),
      deepSwe: {
        value: "72.6%",
        score: 72.6,
        source: "小米官方 · DeepSWE v1.1 / RL 后 · 非官方榜口径",
        href: "https://huggingface.co/collections/XiaomiMiMo/mimo-v26",
      },
    },
  },
  {
    vendor: "小米",
    model: "MiMo-V2.6-Flash",
    release: "2026.09.22",
    access: "闭源 API",
    price: "¥1 / ¥2",
    priceNote: "中国区缓存未命中输入 / 输出；缓存命中 ¥0.02",
    estimatedCost: "¥0.079",
    context: "未披露",
    parameters: "未披露",
    officialUrl: "https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go",
    metrics: {
      ...UNSCORED_METRICS(
        "MiMo-V2.6-Flash",
        "https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go",
      ),
      deepSwe: {
        value: "65.7%",
        score: 65.7,
        source: "小米官方 · DeepSWE v1.1 / RL 后 · 非官方榜口径",
        href: "https://huggingface.co/collections/XiaomiMiMo/mimo-v26",
      },
    },
  },
  {
    vendor: "月之暗面",
    model: "Kimi K3",
    release: "2026.07",
    access: "开放权重 / API",
    price: "¥20 / ¥100",
    priceNote: "中国区缓存未命中输入 / 输出；缓存命中 ¥2",
    estimatedCost: "¥3.7",
    context: "1.05M",
    parameters: "2.8T / 104B 激活",
    officialUrl: "https://www.kimi.com/zh-cn/resources/kimi-k3-pricing",
    metrics: {
      ...UNSCORED_NEW_METRICS("Kimi K3", "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md"),
      hleTools: HLE_TOOLS(
        56,
        "Kimi 官方模型卡 · HLE-Full / general tools / max",
        "https://huggingface.co/moonshotai/Kimi-K3",
      ),
      gdpvalAaV2: GDPVAL_AA(1524, "max", 24),
      nl2Repo: NA("https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md"),
      terminal3: {
        value: "17.4%",
        score: 17.4,
        source: "GLM 官方发布交叉表 · Claude Code / max",
        href: "https://z.ai/blog/glm-5.3",
      },
      ale: {
        value: "28.3%",
        score: 28.3,
        source: "Kimi 官方模型卡",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
      terminal: {
        value: "88.3%",
        score: 88.3,
        source: "Kimi 官方模型卡",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
      mcpAtlas: {
        value: "84.2%",
        score: 84.2,
        source: "Kimi 官方模型卡",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
      swePro: {
        value: "63.4%",
        score: 63.4,
        source: "Kimi 官方技术博客",
        href: "https://www.kimi.com/ko/blog/kimi-k2-6",
      },
      frontierSwe: FRONTIER_SWE(25.9, "proximus"),
      deepSwe: {
        value: "69%",
        score: 69,
        source: "DeepSWE 官方榜 · mini-swe-agent / max",
        href: "https://deepswe.datacurve.ai/",
      },
      osWorld: {
        value: "84.8%",
        score: 84.8,
        source: "Kimi 官方模型卡 · Verified",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
      mmmuPro: {
        value: "81.6%",
        score: 81.6,
        source: "Kimi 官方模型卡 · 无工具",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
    },
  },
  {
    vendor: "智谱",
    model: "GLM-5.3",
    release: "2026.08.14",
    access: "API / 权重两周后开放",
    price: "¥8 / ¥28",
    priceNote: "智谱开放平台中国区牌价输入 / 输出；缓存命中 ¥2",
    estimatedCost: "¥2.5",
    context: "1M（评测口径）",
    parameters: "同 GLM-5.2 底座",
    officialUrl: "https://z.ai/blog/glm-5.3",
    metrics: {
      ...UNSCORED_NEW_METRICS("GLM-5.3", "https://z.ai/blog/glm-5.3"),
      hleTools: HLE_TOOLS(
        62.5,
        "GLM 官方模型卡 · max / harness 与工具集未披露",
        "https://huggingface.co/zai-org/GLM-5.3",
      ),
      gdpvalAaV2: GDPVAL_AA(1646, "max", 25),
      terminal4: TERMINAL_4(41.8, "Claude Code 2.1.207 / max", 3.2),
      nl2Repo: {
        value: "58.0%",
        score: 58,
        source: "GLM 官方发布 · 1M context",
        href: "https://z.ai/blog/glm-5.3",
      },
      terminal3: {
        value: "28.3%",
        score: 28.3,
        source: "GLM 官方发布 · Claude Code 2.1.207 / max / avg@3",
        href: "https://z.ai/blog/glm-5.3",
      },
      terminal: {
        value: "88.2%",
        score: 88.2,
        source: "GLM 官方发布 · Claude Code 2.1.207 / max",
        href: "https://z.ai/blog/glm-5.3",
      },
      swePro: NA(
        "https://z.ai/blog/glm-5.3",
        "GLM 官方未发布 SWE Pro 同名结果",
      ),
      frontierSwe: FRONTIER_SWE(30.2, "proximus"),
      ale: {
        value: "28.5%",
        score: 28.5,
        source: "GLM 官方发布 · ALE-CLI / Claude Code / max",
        href: "https://z.ai/blog/glm-5.3",
      },
      mcpAtlas: NA(
        "https://z.ai/blog/glm-5.3",
        "GLM 官方未发布 MCP-Atlas 同名结果",
      ),
      deepSwe: {
        value: "69%",
        score: 69,
        source: "DeepSWE 官方榜 · mini-swe-agent / max",
        href: "https://deepswe.datacurve.ai/",
      },
      osWorld: NA(
        "https://z.ai/blog/glm-5.3",
        "GLM 官方未发布 OSWorld 同名结果",
      ),
      mmmuPro: NA(
        "https://z.ai/blog/glm-5.3",
        "GLM 官方未发布 MMMU-Pro 同名结果",
      ),
    },
  },
  {
    vendor: "智谱",
    model: "GLM-5.3-Flash",
    release: "2026.08.31",
    access: "开放权重 / API",
    price: "¥0.8 / ¥2.8",
    priceNote: "智谱开放平台中国区牌价输入 / 输出；限时折扣不进主值",
    estimatedCost: "¥0.2785",
    context: "1M（评测口径）",
    parameters: "320B / 18B 激活",
    officialUrl: "https://z.ai/blog/glm-5.3-flash",
    metrics: {
      ...UNSCORED_NEW_METRICS("GLM-5.3-Flash", "https://z.ai/blog/glm-5.3-flash"),
      hleTools: HLE_TOOLS(
        55.3,
        "GLM 官方模型卡 · full / max / harness 与工具集未披露",
        "https://huggingface.co/zai-org/GLM-5.3-Flash",
      ),
      gdpvalAaV2: GDPVAL_AA(1641, "effort 未标注", 23),
      nl2Repo: {
        value: "56.3%",
        score: 56.3,
        source: "GLM 官方模型卡 · 1M context / max",
        href: "https://huggingface.co/zai-org/GLM-5.3-Flash",
      },
      terminal3: NA(
        "https://www.frontierbench.ai/",
        "GLM 官方与 Terminal-Bench 3.0 官方榜未发布 GLM-5.3-Flash 同名结果",
      ),
      terminal: {
        value: "84.3%",
        score: 84.3,
        source: "GLM 官方模型卡 · Claude Code 2.1.207 / max",
        href: "https://huggingface.co/zai-org/GLM-5.3-Flash",
      },
      swePro: NA(
        "https://z.ai/blog/glm-5.3-flash",
        "GLM 官方未发布 GLM-5.3-Flash 的 SWE Pro 同名结果",
      ),
      ale: {
        value: "26.3%",
        score: 26.3,
        source: "GLM 官方发布 · Agents’ Last Exam / max",
        href: "https://z.ai/blog/glm-5.3-flash",
      },
      mcpAtlas: NA(
        "https://z.ai/blog/glm-5.3-flash",
        "GLM 官方未发布 GLM-5.3-Flash 的 MCP-Atlas 同名结果",
      ),
      deepSwe: {
        value: "63%",
        score: 63,
        source: "DeepSWE 官方榜 · mini-swe-agent / max",
        href: "https://deepswe.datacurve.ai/",
      },
      osWorld: NA(
        "https://z.ai/blog/glm-5.3-flash",
        "GLM 官方未发布 GLM-5.3-Flash 的 OSWorld 同名结果",
      ),
      mmmuPro: NA(
        "https://z.ai/blog/glm-5.3-flash",
        "GLM 官方未发布 GLM-5.3-Flash 的 MMMU-Pro 结果",
      ),
    },
  },
  {
    vendor: "深度求索",
    model: "DeepSeek-V4.1-Flash",
    release: "2026.09",
    access: "API 服务",
    price: "¥2 / ¥8",
    priceNote: "中国区缓存未命中输入 / 输出 · 高峰刊例",
    estimatedCost: "¥0.198",
    context: "1M",
    parameters: "未披露",
    officialUrl: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/",
    metrics: {
      ...UNSCORED_METRICS(
        "DeepSeek-V4.1-Flash",
        "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/",
      ),
      gdpvalAaV2: GDPVAL_AA(1600, "reasoning / max", 0),
    },
  },
  {
    vendor: "深度求索",
    model: "DeepSeek-V4-Pro-0813",
    release: "2026.08.13",
    access: "开放权重 / API",
    price: "¥9 / ¥27",
    priceNote: "中国区缓存未命中输入 / 输出 · 高峰刊例",
    estimatedCost: "¥0.915",
    context: "1M",
    parameters: "1.6T / 49B 激活",
    officialUrl: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/",
    metrics: {
      ...UNSCORED_NEW_METRICS("DeepSeek-V4-Pro-0813", "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813"),
      hleTools: HLE_TOOLS(
        60,
        "DeepSeek 官方模型卡 · websearch + Python / internal harness",
        "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813",
      ),
      gdpvalAaV2: GDPVAL_AA(1441, "reasoning / max", 25),
      nl2Repo: {
        value: "61.5%",
        score: 61.5,
        source: "DeepSeek 官方模型卡 · DeepSeek Harness / max",
        href: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813",
      },
      terminal3: NA(
        "https://www.frontierbench.ai/",
        "Terminal-Bench 3.0 官方榜未收录 DeepSeek-V4-Pro-0813",
      ),
      ale: {
        value: "25.7%",
        score: 25.7,
        source: "DeepSeek 官方模型卡 · DeepSeek Harness / max",
        href: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813",
      },
      terminal: {
        value: "87.9%",
        score: 87.9,
        source: "DeepSeek 官方模型卡 · DeepSeek Harness / max",
        href: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813",
      },
      mcpAtlas: NA(
        "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813",
        "DeepSeek 官方模型卡未发布 MCP-Atlas 同名结果",
      ),
      swePro: NA(
        "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813",
        "DeepSeek 官方模型卡未发布 SWE Pro 同名结果",
      ),
      deepSwe: {
        value: "63%",
        score: 63,
        source: "DeepSWE 官方榜 · mini-swe-agent / max",
        href: "https://deepswe.datacurve.ai/",
      },
      osWorld: NA(
        "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813",
        "DeepSeek 官方模型卡未发布 OSWorld 同名结果",
      ),
      mmmuPro: NA(
        "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813",
        "DeepSeek 官方模型卡未发布 MMMU-Pro 结果",
      ),
    },
  },
  {
    vendor: "深度求索",
    model: "DeepSeek-V4-Flash-0731",
    release: "2026.07.31",
    access: "开放权重 / API",
    price: "¥2 / ¥8",
    priceNote: "中国区缓存未命中输入 / 输出；API 已由 DeepSeek-V4.1-Flash 按同价服务",
    estimatedCost: "¥0.198",
    context: "1M",
    parameters: "284B / 13B 激活",
    officialUrl: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/",
    metrics: {
      ...UNSCORED_NEW_METRICS("DeepSeek-V4-Flash-0731", "https://api-docs.deepseek.com/zh-cn/updates/"),
      hleTools: HLE_TOOLS(
        51.5,
        "DeepSeek 官方模型卡 · websearch + Python / internal harness",
        "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813",
      ),
      gdpvalAaV2: GDPVAL_AA(1427, "reasoning / max", 25),
      nl2Repo: {
        value: "54.2%",
        score: 54.2,
        source: "DeepSeek 官方 · DeepSeek Harness 极简模式 / max",
        href: "https://api-docs.deepseek.com/zh-cn/updates/",
      },
      terminal3: NA(
        "https://www.frontierbench.ai/",
        "Terminal-Bench 3.0 官方榜未收录 DeepSeek-V4-Flash-0731",
      ),
      ale: {
        value: "25.2%",
        score: 25.2,
        source: "DeepSeek 官方 · Agent Last Exam / Agent 框架未单独披露",
        href: "https://api-docs.deepseek.com/zh-cn/updates/",
      },
      terminal: {
        value: "82.7%",
        score: 82.7,
        source: "DeepSeek 官方 · DeepSeek Harness 极简模式 / max",
        href: "https://api-docs.deepseek.com/zh-cn/updates/",
      },
      mcpAtlas: NA(
        "https://api-docs.deepseek.com/zh-cn/updates/",
        "DeepSeek 官方未发布 MCP-Atlas 同名结果",
      ),
      swePro: NA(
        "https://api-docs.deepseek.com/zh-cn/updates/",
        "DeepSeek 官方未发布 SWE Pro 同名结果",
      ),
      frontierSwe: FRONTIER_SWE(14.8, "proximus"),
      deepSwe: {
        value: "53%",
        score: 53,
        source: "DeepSWE 官方榜 · mini-swe-agent / max",
        href: "https://deepswe.datacurve.ai/",
      },
      osWorld: NA(
        "https://api-docs.deepseek.com/zh-cn/updates/",
        "DeepSeek 官方未发布 OSWorld 同名结果",
      ),
      mmmuPro: NA(
        "https://api-docs.deepseek.com/zh-cn/updates/",
        "DeepSeek 官方未发布 MMMU-Pro 同名结果",
      ),
    },
  },
  {
    vendor: "SpaceXAI",
    model: "Grok 4.6",
    release: "2026.08.12",
    access: "闭源 API",
    price: "$2 / $6",
    priceNote: "<200K 输入 / 输出；≥200K 为 $4 / $12",
    estimatedCost: "$0.615",
    context: "500K",
    parameters: "未披露",
    officialUrl: "https://docs.x.ai/developers/grok-4-6",
    metrics: {
      ...UNSCORED_NEW_METRICS("Grok 4.6", "https://x.ai/news/grok-4-6"),
      gdpvalAaV2: GDPVAL_AA(1632, "xhigh", 25),
      terminal4: TERMINAL_4(20.3, "Grok Build 1.0.5 / high", 3.1),
      nl2Repo: NA(
        "https://x.ai/news/grok-4-6",
        "xAI 与 AA 未发布 Grok 4.6 的 NL2Repo 同名结果",
      ),
      terminal3: {
        value: "26.5%",
        score: 26.5,
        source: "Terminal-Bench 3.0 官方榜 · Grok Build / high",
        href: "https://www.frontierbench.ai/",
      },
      ale: NA(
        "https://x.ai/news/grok-4-6",
        "xAI 与 AA 未发布 Grok 4.6 的 ALE 同名结果",
      ),
      terminal: {
        value: "88.4%",
        score: 88.4,
        source: "Artificial Analysis · Terminal-Bench 2.1 / high",
        href: "https://artificialanalysis.ai/models/grok-4-6",
      },
      mcpAtlas: NA(
        "https://x.ai/news/grok-4-6",
        "xAI 与 AA 未发布 Grok 4.6 的 MCP-Atlas 同名结果",
      ),
      swePro: NA(
        "https://x.ai/news/grok-4-6",
        "xAI 与 AA 未发布 Grok 4.6 的 SWE Pro 同名结果",
      ),
      frontierSwe: FRONTIER_SWE(25.3, "proximus"),
      deepSwe: {
        value: "67%",
        score: 67,
        source: "DeepSWE 官方榜 · mini-swe-agent / medium",
        href: "https://deepswe.datacurve.ai/",
      },
      osWorld: NA(
        "https://x.ai/news/grok-4-6",
        "xAI 与 AA 未发布 Grok 4.6 的 OSWorld 同名结果",
      ),
      mmmuPro: NA(
        "https://artificialanalysis.ai/models/grok-4-6",
        "AA 尚无 Grok 4.6 的 MMMU-Pro 成绩",
      ),
    },
  },
  {
    vendor: "SpaceXAI",
    model: "Grok 4.7",
    release: "2026.09.21",
    access: "闭源 API",
    price: "$2 / $6",
    priceNote: "<200K 输入 / 输出；≥200K 为 $4 / $12；缓存输入 $0.50",
    estimatedCost: "$0.615",
    context: "500K",
    parameters: "未披露",
    officialUrl: "https://x.ai/news/grok-4-7",
    metrics: {
      ...UNSCORED_METRICS(
        "Grok 4.7",
        "https://x.ai/news/grok-4-7",
      ),
      gdpvalAaV2: GDPVAL_AA(1695, "xhigh", 20),
      terminal4: {
        value: "37.6%",
        score: 37.6,
        source: "xAI 官方 · Terminal-Bench 4.0 / xhigh · 非官方榜口径",
        href: "https://x.ai/news/grok-4-7",
      },
      deepSwe: {
        value: "71.0%",
        score: 71,
        source: "xAI 官方 · DeepSWE v1.1 / high · 非官方榜口径",
        href: "https://x.ai/news/grok-4-7",
      },
    },
  },
  {
    vendor: "Meta",
    model: "Muse Spark 1.3",
    release: "2026.09.02",
    access: "闭源 API",
    price: "$1.25 / $4.25",
    priceNote: "全球 API 输入 / 输出",
    estimatedCost: "$0.235",
    context: "1M",
    parameters: "未披露",
    officialUrl: "https://developer.meta.com/ai/models/muse-spark/",
    metrics: {
      ...UNSCORED_NEW_METRICS("Muse Spark 1.3", "https://developer.meta.com/ai/models/muse-spark/"),
      hleTools: HLE_TOOLS(
        49.1,
        "Artificial Analysis · HLE / max",
        "https://artificialanalysis.ai/models/muse-spark-1-3",
      ),
      gdpvalAaV2: GDPVAL_AA(1674, "max", 24),
      terminal4: NA(
        TERMINAL_BENCH_4_URL,
        "Terminal-Bench 4.0 官方榜未收录 Muse Spark 1.3",
      ),
      frontierSwe: NA(
        FRONTIER_SWE_V2_URL,
        "FrontierSWE v2 官方榜未收录 Muse Spark 1.3；1.2 版为 12.0%",
      ),
      nl2Repo: NA(
        "https://developer.meta.com/ai/models/muse-spark/",
        "Meta 官方与当前独立榜未发布 Muse Spark 1.3 的 NL2Repo 同名结果",
      ),
      terminal3: NA(
        "https://www.frontierbench.ai/",
        "Terminal-Bench 3.0 官方榜未收录 Muse Spark 1.3",
      ),
      terminal: {
        value: "88.8%",
        score: 88.8,
        source: "Meta 官方 · Terminal-Bench 2.1 / Muse Code / max",
        href: "https://developer.meta.com/ai/models/muse-spark/",
      },
      swePro: NA(
        "https://developer.meta.com/ai/models/muse-spark/",
        "Meta 官方与当前独立榜未发布 Muse Spark 1.3 的 SWE Pro 同名结果",
      ),
      ale: NA(
        "https://agents-last-exam.org/leaderboard",
        "ALE 官方榜未收录 Muse Spark 1.3",
      ),
      mcpAtlas: NA(
        "https://developer.meta.com/ai/models/muse-spark/",
        "Meta 官方与当前独立榜未发布 Muse Spark 1.3 的 MCP-Atlas 同名结果",
      ),
      deepSwe: {
        value: "75.4%",
        score: 75.4,
        source: "Meta 官方 · DeepSWE v1.1 / Muse Code / max",
        href: "https://developer.meta.com/ai/models/muse-spark/",
      },
      osWorld: {
        value: "66.9%",
        score: 66.9,
        source: "Meta 官方 · OSWorld 2.0",
        href: "https://developer.meta.com/ai/models/muse-spark/",
      },
      mmmuPro: NA(
        "https://developer.meta.com/ai/models/muse-spark/",
        "Meta 官方未发布 Muse Spark 1.3 的 MMMU-Pro 结果",
      ),
    },
  },
  {
    vendor: "Google",
    model: "Gemini 3.8 Flash",
    release: "2026.09.02",
    access: "闭源 API",
    price: "$0.75 / $3.75",
    priceNote: "全球 API 输入 / 输出",
    estimatedCost: "$0.13875",
    context: "1M",
    parameters: "未披露",
    officialUrl: "https://deepmind.google/models/gemini/flash/",
    metrics: {
      ...UNSCORED_NEW_METRICS("Gemini 3.8 Flash", "https://deepmind.google/models/gemini/flash/"),
      hleTools: HLE_TOOLS(
        47.8,
        "Artificial Analysis · HLE / high",
        "https://artificialanalysis.ai/models/releases/gemini-3-8-flash",
      ),
      gdpvalAaV2: GDPVAL_AA(1412, "high", 25),
      terminal4: TERMINAL_4(19.1, "mini-SWE-agent / high", 3.4),
      frontierSwe: FRONTIER_SWE(19.6, "proximus"),
      nl2Repo: NA(
        "https://deepmind.google/models/gemini/flash/",
        "Google 官方与当前独立榜未发布 Gemini 3.8 Flash 的 NL2Repo 同名结果",
      ),
      terminal3: NA(
        "https://www.frontierbench.ai/",
        "Terminal-Bench 3.0 官方榜未收录 Gemini 3.8 Flash",
      ),
      terminal: {
        value: "89.4%",
        score: 89.4,
        source: "Google 官方 · Terminal-Bench 2.1 / high",
        href: "https://deepmind.google/models/gemini/flash/",
      },
      swePro: NA(
        "https://deepmind.google/models/gemini/flash/",
        "Google 官方与当前独立榜未发布 Gemini 3.8 Flash 的 SWE Pro 同名结果",
      ),
      ale: NA(
        "https://agents-last-exam.org/leaderboard",
        "ALE 官方榜未收录 Gemini 3.8 Flash",
      ),
      mcpAtlas: NA(
        "https://deepmind.google/models/gemini/flash/",
        "Google 官方与当前独立榜未发布 Gemini 3.8 Flash 的 MCP-Atlas 同名结果",
      ),
      deepSwe: {
        value: "74%",
        score: 74,
        source: "DeepSWE 官方榜 · mini-swe-agent / high",
        href: "https://deepswe.datacurve.ai/",
      },
      osWorld: {
        value: "59.0%",
        score: 59,
        source: "Google 官方 · OSWorld",
        href: "https://deepmind.google/models/gemini/flash/",
      },
      mmmuPro: NA(
        "https://deepmind.google/models/gemini/flash/",
        "Google 官方未发布 Gemini 3.8 Flash 的 MMMU-Pro 结果",
      ),
    },
  },
];

const OPUS_46_REFERENCE: Pick<TextModel, "vendor" | "model" | "metrics"> = {
  vendor: "Anthropic",
  model: "Claude Opus 4.6",
  metrics: {
    ...UNSCORED_NEW_METRICS("Claude Opus 4.6", "https://www.anthropic.com/news/claude-opus-4-6"),
    hleTools: HLE_TOOLS(
      53,
      "Anthropic 官方 · Search + Fetch + Code + tools / adaptive max / 3M 累计上下文",
      "https://www.anthropic.com/news/claude-opus-4-6",
    ),
    nl2Repo: NA("https://www.anthropic.com/news/claude-opus-4-6"),
    terminal3: NA(
      "https://www.frontierbench.ai/",
      "Terminal-Bench 3.0 官方榜未收录 Claude Opus 4.6",
    ),
    terminal: {
      value: "—",
      score: null,
      source: "仅公开 Terminal-Bench 2.0",
      href: "https://www.anthropic.com/news/claude-opus-4-6",
    },
    swePro: {
      value: "53.4%",
      score: 53.4,
      source: "Anthropic 官方发布",
      href: "https://www.anthropic.com/glasswing",
    },
    ale: {
      value: "15.1%",
      score: 15.1,
      source: "ALE 官方榜 · OpenClaw",
      href: "https://agents-last-exam.org/leaderboard",
    },
    mcpAtlas: {
      value: "59.5%",
      score: 59.5,
      source: "Anthropic 官方发布 · max",
      href: "https://www.anthropic.com/news/claude-opus-4-6",
    },
    deepSwe: {
      value: "—",
      score: null,
      source: "AA v1.5 分项未提供 DeepSWE 得分",
      href: "https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-kimi-code-cli",
    },
    osWorld: {
      value: "72.7%",
      score: 72.7,
      source: "Anthropic 官方 · Verified",
      href: "https://www.anthropic.com/news/claude-opus-4-6",
    },
    mmmuPro: {
      value: "73.9%",
      score: 73.9,
      source: "Anthropic 系统卡 · 无工具",
      href: "https://www-cdn.anthropic.com/14e4fb01875d2a69f646fa5e574dea2b1c0ff7b5.pdf",
    },
  },
};

const MODEL_TRACKS: ModelTrack[] = [
  {
    id: "text",
    label: "文本模型",
    lead: "Doubao-Seed-2.1-Pro",
    summary: "价格、参数、成本估算与十三项单项 Benchmark。",
    comparisonNote: "火山方舟与十二家厂商；价格为每百万 tokens 输入 / 输出；成本估算按 cache input : 非缓存输入 : 输出 = 95 : 4 : 1 混合。",
    scope:
      "火山方舟、Claude、GPT、腾讯混元、Qwen、阶跃星辰、小米 MiMo、Kimi、GLM、DeepSeek、SpaceXAI、Meta、Gemini。",
    models: [
      {
        vendor: "火山方舟",
        model: "Doubao-Seed-2.1-Pro",
        tier: "旗舰",
        price: "¥6 / ¥30",
        priceNote: "中国区标准输入 / 输出",
        estimatedCost: "¥1.68",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "256K",
        href: "https://www.volcengine.com/product/doubao",
        isPrimary: true,
      },
      {
        vendor: "火山方舟",
        model: "Doubao-Seed-2.1-Turbo",
        tier: "均衡",
        price: "¥3 / ¥15",
        priceNote: "中国区标准输入 / 输出",
        estimatedCost: "¥0.84",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "256K",
        href: "https://www.volcengine.com/product/doubao",
        isPrimary: true,
      },
      {
        vendor: "Anthropic",
        model: "Claude Fable 5",
        tier: "最高能力",
        price: "$10 / $50",
        priceNote: "全球 API 输入 / 输出",
        estimatedCost: "$1.85",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://platform.claude.com/docs/en/about-claude/models/overview",
      },
      {
        vendor: "Anthropic",
        model: "Claude Fable 5.1",
        tier: "最高能力 · 最新迭代",
        price: "$10 / $50",
        priceNote: "全球 API 输入 / 输出；缓存读取 $0.25",
        estimatedCost: "$1.1375",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://platform.claude.com/docs/en/about-claude/models/overview",
      },
      {
        vendor: "Anthropic",
        model: "Claude Opus 5",
        tier: "旗舰 Agent",
        price: "$5 / $25",
        priceNote: "全球 API 输入 / 输出",
        estimatedCost: "$0.925",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://platform.claude.com/docs/en/about-claude/models/overview",
      },
      {
        vendor: "Anthropic",
        model: "Claude Opus 5.5",
        tier: "旗舰 Agent · 最新",
        price: "$4 / $20",
        priceNote: "全球 API 输入 / 输出；缓存读取 $0.20",
        estimatedCost: "$0.55",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://www.anthropic.com/news/claude-opus-5-5",
      },
      {
        vendor: "Anthropic",
        model: "Claude Sonnet 5",
        tier: "均衡",
        price: "$2 / $10",
        priceNote: "全球 API 标准输入 / 输出；缓存读取 $0.20",
        estimatedCost: "$0.37",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://platform.claude.com/docs/en/about-claude/models/overview",
      },
      {
        vendor: "Anthropic",
        model: "Claude Mythos 5.1",
        tier: "最高能力 · Cyber 门控",
        price: "$10 / $50",
        priceNote: "全球 API 输入 / 输出；缓存读取 $0.25",
        estimatedCost: "$1.1375",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M / 128k 输出",
        href: "https://platform.claude.com/docs/en/models/mythos-5-1/overview",
      },
      {
        vendor: "Anthropic",
        model: "Claude Sonnet 5.5",
        tier: "均衡 · 最新",
        price: "$2 / $10",
        priceNote: "全球 API 输入 / 输出；缓存读取 $0.20",
        estimatedCost: "$0.37",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://www.anthropic.com/claude-sonnet-5-5",
      },
      {
        vendor: "OpenAI",
        model: "GPT-6 Astra",
        tier: "旗舰 · 最新",
        price: "$10 / $50",
        priceNote: "全球 API 输入 / 输出",
        estimatedCost: "$1.85",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1.05M",
        href: "https://developers.openai.com/api/docs/models/compare",
      },
      {
        vendor: "OpenAI",
        model: "GPT-6.1 Sol",
        tier: "旗舰 · 最新",
        price: "$2 / $10",
        priceNote: "全球 API 输入 / 输出；缓存输入 $0.10",
        estimatedCost: "$0.275",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1.1M",
        href: "https://openai.com/index/introducing-gpt-6-1-sol/",
      },
      {
        vendor: "OpenAI",
        model: "GPT-6 Sol",
        tier: "旗舰",
        price: "$2 / $10",
        priceNote: "全球 API 输入 / 输出；缓存输入 $0.20",
        estimatedCost: "$0.37",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "872k",
        href: "https://developers.openai.com/api/docs/models/compare",
      },
      {
        vendor: "OpenAI",
        model: "GPT-6 Luna",
        tier: "经济",
        price: "$0.10 / $0.50",
        priceNote: "全球 API 输入 / 输出；缓存输入 $0.01",
        estimatedCost: "$0.0185",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://developers.openai.com/api/docs/models/compare",
      },
      {
        vendor: "OpenAI",
        model: "GPT-5.6 Sol",
        tier: "旗舰",
        price: "$4 / $20",
        priceNote: "全球 API 输入 / 输出",
        estimatedCost: "$0.74",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1.05M",
        href: "https://developers.openai.com/api/docs/models/compare",
      },
      {
        vendor: "OpenAI",
        model: "GPT-5.6 Terra",
        tier: "均衡",
        price: "$2 / $12",
        priceNote: "全球 API 输入 / 输出",
        estimatedCost: "$0.39",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1.05M",
        href: "https://developers.openai.com/api/docs/models/compare",
      },
      {
        vendor: "OpenAI",
        model: "GPT-5.6 Luna",
        tier: "经济",
        price: "$0.20 / $1.20",
        priceNote: "全球 API 输入 / 输出",
        estimatedCost: "$0.039",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1.05M",
        href: "https://developers.openai.com/api/docs/models/compare",
      },
      {
        vendor: "腾讯",
        model: "Hy4 preview",
        tier: "旗舰预览",
        price: "¥6 / ¥18",
        priceNote: "腾讯云 TokenHub 广州输入 / 输出",
        estimatedCost: "¥0.705",
        parameters: "770B / 49B 激活",
        specLabel: "上下文",
        spec: "1M",
        href: "https://cloud.tencent.com/document/product/1823/130051",
      },
      {
        vendor: "阿里云",
        model: "Qwen3.8-Max",
        tier: "旗舰",
        price: "¥12 / ¥36",
        priceNote: "中国区标准输入 / 输出",
        estimatedCost: "¥2.265",
        parameters: "2.4T / 95B 激活",
        specLabel: "上下文",
        spec: "1M",
        href: "https://www.qianwenai.com/models/qwen3.8-max",
      },
      {
        vendor: "阿里云",
        model: "Qwen3.8-Flash",
        tier: "高性价比 API",
        price: "¥0.8 / ¥2.7",
        priceNote: "中国区华北 2 输入 / 输出",
        estimatedCost: "¥0.154",
        parameters: "未独立披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://help.aliyun.com/zh/model-studio/qwen3-8-flash",
      },
      {
        vendor: "阿里云",
        model: "Qwen3.8-27B",
        tier: "开放权重 · Dense",
        price: "¥3 / ¥12",
        priceNote: "中国区华北 2 输入 / 输出",
        estimatedCost: "¥0.81",
        parameters: "27B",
        specLabel: "上下文",
        spec: "262K 原生 / YaRN 1M",
        href: "https://help.aliyun.com/zh/model-studio/qwen3-8-27b",
      },
      {
        vendor: "阶跃星辰",
        model: "Step 5 Preview",
        tier: "旗舰预览",
        price: "¥7 / ¥20",
        priceNote: "中国区缓存未命中输入 / 输出；缓存命中 ¥0.35",
        estimatedCost: "¥0.8125",
        parameters: "600B / 27B 激活",
        specLabel: "上下文",
        spec: "1M / 64k 输出",
        href: "https://www.stepfun.com/step-5-preview",
      },
      {
        vendor: "小米",
        model: "MiMo-V2.6-Pro",
        tier: "旗舰",
        price: "¥3 / ¥6",
        priceNote: "中国区缓存未命中输入 / 输出；缓存命中 ¥0.025",
        estimatedCost: "¥0.20375",
        parameters: "1.02T / 42B 激活",
        specLabel: "上下文",
        spec: "1M",
        href: "https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go",
      },
      {
        vendor: "小米",
        model: "MiMo-V2.6-Flash",
        tier: "高性价比",
        price: "¥1 / ¥2",
        priceNote: "中国区缓存未命中输入 / 输出；缓存命中 ¥0.02",
        estimatedCost: "¥0.079",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "未披露",
        href: "https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go",
      },
      {
        vendor: "月之暗面",
        model: "Kimi K3",
        tier: "旗舰",
        price: "¥20 / ¥100",
        priceNote: "中国区缓存未命中输入 / 输出；缓存命中 ¥2",
        estimatedCost: "¥3.7",
        parameters: "2.8T / 104B 激活",
        specLabel: "上下文",
        spec: "1.05M",
        href: "https://www.kimi.com/zh-cn/resources/kimi-k3-pricing",
      },
      {
        vendor: "智谱",
        model: "GLM-5.3",
        tier: "最新旗舰",
        price: "¥8 / ¥28",
        priceNote: "智谱开放平台中国区牌价输入 / 输出；缓存命中 ¥2",
        estimatedCost: "¥2.5",
        parameters: "同 GLM-5.2 底座",
        specLabel: "上下文",
        spec: "1M（评测口径）",
        href: "https://z.ai/blog/glm-5.3",
      },
      {
        vendor: "智谱",
        model: "GLM-5.3-Flash",
        tier: "高性价比 · 原生多模态",
        price: "¥0.8 / ¥2.8",
        priceNote: "智谱开放平台中国区牌价输入 / 输出；限时折扣不进主值",
        estimatedCost: "¥0.2785",
        parameters: "320B / 18B 激活",
        specLabel: "上下文",
        spec: "1M（评测口径）",
        href: "https://z.ai/blog/glm-5.3-flash",
      },
      {
        vendor: "深度求索",
        model: "DeepSeek-V4.1-Flash",
        tier: "均衡 · 最新",
        price: "¥2 / ¥8",
        priceNote: "中国区缓存未命中输入 / 输出 · 高峰刊例",
        estimatedCost: "¥0.198",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/",
      },
      {
        vendor: "深度求索",
        model: "DeepSeek-V4-Pro-0813",
        tier: "旗舰",
        price: "¥9 / ¥27",
        priceNote: "中国区缓存未命中输入 / 输出 · 高峰刊例",
        estimatedCost: "¥0.915",
        parameters: "1.6T / 49B 激活",
        specLabel: "上下文",
        spec: "1M",
        href: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/",
      },
      {
        vendor: "深度求索",
        model: "DeepSeek-V4-Flash-0731",
        tier: "正式版 · 高性价比",
        price: "¥2 / ¥8",
        priceNote: "中国区缓存未命中输入 / 输出；API 已由 DeepSeek-V4.1-Flash 按同价服务",
        estimatedCost: "¥0.198",
        parameters: "284B / 13B 激活",
        specLabel: "上下文",
        spec: "1M",
        href: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/",
      },
      {
        vendor: "SpaceXAI",
        model: "Grok 4.6",
        tier: "旗舰 Agent",
        price: "$2 / $6",
        priceNote: "<200K 输入 / 输出；≥200K 为 $4 / $12",
        estimatedCost: "$0.615",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "500K",
        href: "https://docs.x.ai/developers/grok-4-6",
      },
      {
        vendor: "SpaceXAI",
        model: "Grok 4.7",
        tier: "旗舰 Agent · 最新",
        price: "$2 / $6",
        priceNote: "<200K 输入 / 输出；≥200K 为 $4 / $12；缓存输入 $0.50",
        estimatedCost: "$0.615",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "500K",
        href: "https://x.ai/news/grok-4-7",
      },
      {
        vendor: "Meta",
        model: "Muse Spark 1.3",
        tier: "旗舰 Agent",
        price: "$1.25 / $4.25",
        priceNote: "全球 API 输入 / 输出",
        estimatedCost: "$0.235",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://developer.meta.com/ai/models/muse-spark/",
      },
      {
        vendor: "Google",
        model: "Gemini 3.8 Flash",
        tier: "高性价比 · 原生多模态",
        price: "$0.75 / $3.75",
        priceNote: "全球 API 输入 / 输出",
        estimatedCost: "$0.13875",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://deepmind.google/models/gemini/flash/",
      },
    ],
  },
  {
    id: "video",
    label: "生视频模型",
    lead: "Seedance 2.5",
    summary: "最新发布：Seedance 2.5；Arena 可比版本：Seedance 2.0。",
    comparisonNote: "按输出秒比较：Seedance 系列为 720p、16:9、5 秒官方示例，Wan3.0 为 720P 刊例价，H3 为 768P 刊例价；H3 分辨率近似但不完全相同。",
    scope: "火山方舟、OpenAI、阿里云、MiniMax。",
    models: [
      {
        vendor: "火山方舟",
        model: "Seedance 2.5",
        tier: "最新发布",
        price: "¥1.51 / 秒",
        priceNote: "720p · 16:9 · 5 秒 · 输入不含视频（官方估算）",
        parameters: "未披露",
        specLabel: "计费",
        spec: "¥70 / 百万 tokens；含视频输入为 ¥42",
        href: "https://docs.volcengine.com/docs/82379/1544106?lang=zh#457edfd0",
        isPrimary: true,
      },
      {
        vendor: "火山方舟",
        model: "Doubao-Seedance-2.0",
        tier: "旗舰 API",
        price: "¥0.99 / 秒",
        priceNote: "720p · 16:9 · 5 秒 · 输入不含视频（官方估算）",
        parameters: "未披露",
        specLabel: "计费",
        spec: "720p：¥46 / 百万 tokens；含视频输入为 ¥28",
        href: "https://docs.volcengine.com/docs/82379/1544106?lang=zh#457edfd0",
        isPrimary: true,
      },
      {
        vendor: "火山方舟",
        model: "Doubao-Seedance-2.0-Fast",
        tier: "高效",
        price: "¥0.80 / 秒",
        priceNote: "720p · 16:9 · 5 秒 · 输入不含视频（官方估算）",
        parameters: "未披露",
        specLabel: "计费",
        spec: "720p：¥37 / 百万 tokens；含视频输入为 ¥22",
        href: "https://docs.volcengine.com/docs/82379/1544106?lang=zh#457edfd0",
        isPrimary: true,
      },
      {
        vendor: "火山方舟",
        model: "Doubao-Seedance-2.0-Mini",
        tier: "经济",
        price: "¥0.50 / 秒",
        priceNote: "720p · 16:9 · 5 秒 · 输入不含视频（官方估算）",
        parameters: "未披露",
        specLabel: "计费",
        spec: "720p：¥23 / 百万 tokens；含视频输入为 ¥14",
        href: "https://docs.volcengine.com/docs/82379/1544106?lang=zh#457edfd0",
        isPrimary: true,
      },
      {
        vendor: "OpenAI",
        model: "Sora 2 Pro",
        tier: "旗舰",
        price: "$0.30–0.70 / 秒",
        priceNote: "720p–1080p 标准调用",
        parameters: "未披露",
        specLabel: "分辨率",
        spec: "720p / 1024p / 1080p",
        href: "https://developers.openai.com/api/docs/pricing",
      },
      {
        vendor: "OpenAI",
        model: "Sora 2",
        tier: "标准",
        price: "$0.10 / 秒",
        priceNote: "720p 标准调用",
        parameters: "未披露",
        specLabel: "分辨率",
        spec: "720p",
        href: "https://developers.openai.com/api/docs/pricing",
      },
      {
        vendor: "阿里云",
        model: "Wan3.0 Video",
        tier: "全能视频生成",
        price: "¥0.60 / 秒",
        priceNote: "720P；480P 为 ¥0.30 / 秒，1080P 为 ¥1.20 / 秒",
        parameters: "未披露",
        specLabel: "时长 / 限流",
        spec: "最长 30 秒 · RPM 30",
        href: "https://bailian.console.aliyun.com/cn-beijing?tab=model#/model-market/detail/wan3.0-video?serviceSite=asia-pacific-china&ref=all",
      },
      {
        vendor: "MiniMax",
        model: "MiniMax H3",
        tier: "双分辨率",
        price: "¥0.50 / 秒",
        priceNote: "768P 输出；2K 为 ¥0.80 / 秒",
        parameters: "未披露",
        specLabel: "分辨率",
        spec: "768p / 2K",
        href: "https://platform.minimaxi.com/docs/guides/pricing-paygo#%E8%A7%86%E9%A2%91",
      },
    ],
  },
  {
    id: "image",
    label: "生图 / 图像编辑",
    lead: "Seedream 5.0 Pro",
    summary: "图像生成与编辑分榜。",
    comparisonNote: "火山方舟与指定厂商的最新图像模型；保留厂商原始计费单位。",
    scope: "火山方舟、OpenAI、阿里云、MiniMax。",
    models: [
      {
        vendor: "火山方舟",
        model: "Doubao-Seedream-5.0-Pro",
        tier: "旗舰",
        price: "¥0.30 / ¥0.60",
        priceNote: "≤2.36MP / >2.36MP · 每张",
        parameters: "未披露",
        specLabel: "能力",
        spec: "生成 + 编辑",
        href: "https://www.volcengine.com/product/doubao",
        isPrimary: true,
      },
      {
        vendor: "火山方舟",
        model: "Doubao-Seedream-5.0-Lite",
        tier: "多功能",
        price: "¥0.22 / 张",
        priceNote: "中国区按量付费",
        parameters: "未披露",
        specLabel: "能力",
        spec: "生成 + 编辑 + 组图 / 流式 / 联网",
        href: "https://www.volcengine.com/product/doubao",
        isPrimary: true,
      },
      {
        vendor: "OpenAI",
        model: "GPT Image 2",
        tier: "旗舰",
        price: "$8 / $30",
        priceNote: "每百万图像 tokens 输入 / 输出",
        parameters: "未披露",
        specLabel: "能力",
        spec: "生成 + 编辑",
        href: "https://developers.openai.com/api/docs/pricing",
      },
      {
        vendor: "阿里云",
        model: "Qwen Image 2.0 Pro",
        tier: "满血版",
        price: "¥0.5 / 张",
        priceNote: "中国区图片生成",
        parameters: "未披露",
        specLabel: "能力",
        spec: "生成 + 编辑",
        href: "https://help.aliyun.com/zh/model-studio/qwen-image-2-0-pro",
      },
      {
        vendor: "阿里云",
        model: "Qwen Image 2.0",
        tier: "加速版",
        price: "¥0.2 / 张",
        priceNote: "中国区图片生成",
        parameters: "未披露",
        specLabel: "能力",
        spec: "生成 + 编辑",
        href: "https://help.aliyun.com/zh/model-studio/qwen-image-2-0",
      },
      {
        vendor: "MiniMax",
        model: "image-01 / image-01-live",
        tier: "标准",
        price: "¥0.025 / 张",
        priceNote: "中国区图片生成",
        parameters: "未披露",
        specLabel: "能力",
        spec: "文本 / 参考图生成",
        href: "https://platform.minimaxi.com/docs/guides/pricing-paygo",
      },
    ],
  },
];

const ARENA_BOARDS: Board[] = [
  {
    eyebrow: "TEXT",
    name: "Text / Overall",
    snapshot: "2026-09-13 · Model ranking",
    direction: "偏好 Elo ↑",
    note: "claude-fable-5：第 1；gpt-6-astra-max：第 24；glm-5.3-flash：第 29；deepseek-v4-pro-high-20260813：第 50。fable-5.1-max 掉至第 5；本次前 50 已无火山方舟配置。",
    href: "https://arena.ai/leaderboard/text/overall",
    assessment: {
      source: "Arena FAQ 与排名方法",
      href: "https://arena.ai/faq",
      rows: [
        { category: "输入", weight: "开放文本", description: "真实用户自由提交提示" },
        { category: "对比", weight: "匿名双盲", description: "投票后才揭示模型名称", emphasis: true },
        { category: "计分", weight: "Bradley–Terry", description: "把两两胜负拟合为 Arena Score", emphasis: true },
        { category: "不确定性", weight: "95% CI", description: "排名需连同置信区间阅读" },
      ],
      summary: "开放文本的人类偏好相对排名。",
    },
    rows: CURRENT_LEADERBOARD_ROWS["Text / Overall"],
  },
  {
    eyebrow: "CODE",
    name: "Coding Arena",
    snapshot: "2026-09-13 · Model ranking",
    direction: "偏好 Elo ↑",
    note: "claude-fable-5：第 1；gpt-6-astra-max：第 6；kimi-k3-max：第 7；dola-seed-2.0-pro：第 44。fable-5.1-max 掉至第 32；deepseek-v4-pro-high-20260813（第 59）掉出前 50。",
    href: "https://arena.ai/leaderboard/text/coding",
    assessment: {
      source: "Arena Coding 分类说明",
      href: "https://arena.ai/blog/arena-category/",
      rows: [
        { category: "样本", weight: "代码相关", description: "理解、生成、调试与工程决策" },
        { category: "分类", weight: "启发式", description: "识别代码块、语言名与命令" },
        { category: "判断", weight: "匿名偏好", description: "用户选择更好的代码回答", emphasis: true },
        { category: "计分", weight: "Bradley–Terry", description: "基于两两投票形成相对排名" },
      ],
      summary: "Text Arena 代码样本的人类偏好排名。",
    },
    rows: CURRENT_LEADERBOARD_ROWS["Coding Arena"],
  },
  {
    eyebrow: "WEBDEV",
    name: "WebDev Arena",
    snapshot: "2026-09-11 · Model ranking",
    direction: "偏好 Elo ↑",
    note: "gpt-6-astra-max：第 1（发布首周登顶）；claude-fable-5.1-max：第 2；hy4-preview：第 11；deepseek-v4.1-flash-max：第 16；seed-2.1-pro-preview：第 38。",
    href: "https://arena.ai/leaderboard/code",
    assessment: {
      source: "Code Arena 官方方法",
      href: "https://arena.ai/blog/code-arena/",
      rows: [
        { category: "任务", weight: "可运行应用", description: "模型规划、写文件并生成网页" },
        { category: "验证", weight: "现场交互", description: "用户查看并操作真实渲染结果", emphasis: true },
        { category: "判断", weight: "综合偏好", description: "功能、可用性、忠实度与设计" },
        { category: "计分", weight: "人工投票 + CI", description: "结构化聚合并展示方差" },
      ],
      summary: "综合功能、交互与视觉完成度。",
    },
    rows: CURRENT_LEADERBOARD_ROWS["WebDev Arena"],
  },
  {
    eyebrow: "VISION",
    name: "Vision Arena",
    snapshot: "2026-09-13 · Model ranking",
    direction: "偏好 Elo ↑",
    note: "含图对话；按模型配置排名；claude-fable-5：第 1；qwen3.8-max：第 2；dola-seed-2.0-pro：第 41。",
    href: "https://arena.ai/leaderboard/vision",
    assessment: {
      source: "Vision Arena 官方说明",
      href: "https://arena.ai/blog/multimodal/",
      rows: [
        { category: "输入", weight: "含图片对话", description: "只统计包含图像的模型对战", emphasis: true },
        { category: "任务", weight: "开放分布", description: "描述、数学、文档、梗图等" },
        { category: "判断", weight: "匿名偏好", description: "用户比较两份多模态回答" },
        { category: "计分", weight: "Arena Score", description: "Bradley–Terry 系数映射后排名" },
      ],
      summary: "视觉理解回答的人类偏好排名。",
    },
    rows: CURRENT_LEADERBOARD_ROWS["Vision Arena"],
  },
  {
    eyebrow: "IMAGE",
    name: "Text-to-Image",
    snapshot: "2026-09-08 · Model ranking",
    direction: "偏好 Elo ↑",
    note: "文本生图偏好；Seedream 5.0 Pro：第 10；Seedream 4.5 / 4-2K / 5.0 Lite 分列第 34 / 36 / 37。",
    href: "https://arena.ai/leaderboard/text-to-image",
    assessment: {
      source: "Image Arena 质量过滤",
      href: "https://arena.ai/blog/image-arena-improvements/",
      rows: [
        { category: "输入", weight: "文本生图", description: "同一提示生成两张匿名图片" },
        { category: "判断", weight: "用户偏好", description: "用户选择更符合预期的结果", emphasis: true },
        { category: "过滤", weight: "约 15%", description: "移除无效或不完整提示降噪" },
        { category: "分类", weight: "7 类", description: "类别可重叠，主榜汇总全部领域" },
      ],
      summary: "同提示匿名生图偏好；不含图像编辑。",
    },
    rows: CURRENT_LEADERBOARD_ROWS["Text-to-Image"],
  },
  {
    eyebrow: "VIDEO",
    name: "Text-to-Video",
    snapshot: "2026-09-04 · Model ranking",
    direction: "偏好 Elo ↑",
    note: "文本生视频；榜单当前共发布 48 行，已全量录入；Seedance 2.5 / 2.0 的 720P 配置分列第 6 / 第 7。",
    href: "https://arena.ai/leaderboard/text-to-video",
    assessment: {
      source: "Video Arena 官方说明",
      href: "https://arena.ai/blog/video-arena/",
      rows: [
        { category: "输入", weight: "文本生视频", description: "同一提示生成两段匿名视频" },
        { category: "判断", weight: "整体偏好", description: "用户完整观看后选择更优结果", emphasis: true },
        { category: "赛道", weight: "独立榜", description: "与 Image-to-Video 分开统计" },
        { category: "更新", weight: "持续投票", description: "随模型、提示与用户分布变化" },
      ],
      summary: "同提示匿名视频偏好；无固定分项权重。",
    },
    rows: CURRENT_LEADERBOARD_ROWS["Text-to-Video"],
  },
];

const AA_BOARDS: Board[] = [
  {
    eyebrow: "INTELLIGENCE",
    name: "Intelligence Index v4.3.2",
    snapshot: "2026-09-30 · v4.3.2 · model configurations",
    direction: "综合指数 ↑",
    note: "完整榜共 664 个配置，录入前 50；Claude Opus 5.5 · max with fallback 以 58 分第 1，Claude Sonnet 5.5 · max with fallback 第 3，GPT-6 Astra · max 第 7，GPT-6.1 Sol · max 第 9，Grok 4.7 · xhigh 第 21，MiMo-V2.6-Pro 第 23 且为开源最高，GLM-5.3 · max 第 27，Step 5 Preview 第 31，DeepSeek V4.1 Flash · max 第 44。",
    href: "https://artificialanalysis.ai/leaderboards/models",
    assessment: {
      source: "AA Intelligence 方法学",
      href: "https://artificialanalysis.ai/methodology/intelligence-benchmarking",
      rows: [
        { category: "Agents", weight: "30%", description: "AA-Briefcase v1.1 15%、GDPval-AA v2.1 10%、AutomationBench-AA 5%", emphasis: true },
        { category: "Coding", weight: "20%", description: "Terminal-Bench v4.0 10%、SciCode 10%", emphasis: true },
        { category: "通用能力", weight: "30%", description: "AA-Omniscience 15%、GDP.pdf 10%、AA-LCR v1.1 5%" },
        { category: "科学推理", weight: "20%", description: "HLE 10%、CritPt 10%" },
      ],
      summary: "10 项基准按 4 类不等权合成；私有测试集 45%。",
    },
    rows: CURRENT_LEADERBOARD_ROWS["Intelligence Index v4.3.2"],
  },
  {
    eyebrow: "AA CODE",
    name: "Coding Agent Index",
    snapshot: "2026-09-22 · v1.5 · model + harness",
    direction: "Agent 编程指数 ↑",
    note: "官方当前发布 19 个配置（全量录入）；Claude Code - Fable 5.1 · max (with fallback) 以 62.2 分居首；新入榜 Devin Fusion CLI - Claude Fable 5.1 第 2、Devin Fusion CLI - GPT-6 Astra 第 5；v1.5 起 Terminal-Bench 4.0（66 项）替换 Terminal-Bench 2.1。",
    href: "https://artificialanalysis.ai/agents/coding-agents",
    assessment: {
      source: "AA Coding Agent 方法学",
      href: "https://artificialanalysis.ai/methodology/coding-agents-benchmarking",
      rows: [
        { category: "DeepSWE", weight: "⅓", description: "113 项长程软件工程任务", emphasis: true },
        { category: "Terminal-Bench v4.0", weight: "⅓", description: "66 项 Agent 终端任务", emphasis: true },
        { category: "SWE-Atlas-QnA", weight: "⅓", description: "124 项真实仓库问答" },
        { category: "重复运行", weight: "3 次", description: "先按任务平均，再汇总 pass@1" },
      ],
      summary: "模型、Agent harness 与推理设置共同计分。",
    },
    rows: CURRENT_LEADERBOARD_ROWS["Coding Agent Index"],
  },
  {
    eyebrow: "AGENTIC",
    name: "Agentic Index",
    snapshot: "2026-09-15 · Model-level mirror",
    direction: "Agentic 指数 ↑",
    note: "官方配置级入口已下线，本表为镜像口径（benchlm.ai，09-14 更新）、按模型聚合，与 09-03 配置级快照不可比；Claude Fable 5.1 第 1，Claude Opus 5 第 2，Muse Spark 1.3 第 3，GLM-5.3 与 Grok 4.6 并列第 4。",
    href: "https://artificialanalysis.ai/methodology/intelligence-benchmarking",
    assessment: {
      source: "AA Agentic Index 镜像（benchlm.ai）",
      href: "https://benchlm.ai/benchmarks/aaagenticindex",
      rows: [
        { category: "口径", weight: "镜像", description: "benchlm.ai 镜像 AA Agentic Index，按模型聚合", emphasis: true },
        { category: "更新", weight: "09-14", description: "镜像快照于 2026-09-14 更新" },
        { category: "能力焦点", weight: "Agent", description: "工具使用、规划与自主执行" },
        { category: "可比性", weight: "不可比", description: "与配置级快照口径不同，不跨口径比较" },
      ],
      summary: "官方配置级入口下线后的降级口径。",
    },
    rows: CURRENT_LEADERBOARD_ROWS["Agentic Index"],
  },
  {
    eyebrow: "KNOWLEDGE WORK",
    name: "AA-Briefcase",
    snapshot: "2026-09-30 · v1.1 · model-level mirror",
    direction: "综合 Elo ↑",
    note: "AA 官方页结构化数据不提供 v1.1 模型级序列；本表为 benchlm.ai 镜像（09-30 更新）、按模型聚合共 15 行全量录入；Claude Opus 5.5 以 1,822 Elo 第 1，Claude Sonnet 5.5 第 2（1,811），Claude Opus 5 第 3，Claude Fable 5.1 第 4。",
    href: "https://artificialanalysis.ai/evaluations/aa-briefcase",
    assessment: {
      source: "AA-Briefcase 方法学",
      href: "https://artificialanalysis.ai/articles/aa-briefcase/",
      rows: [
        { category: "事实正确性", weight: "Rubric", description: "二元检查任务要求与证据", emphasis: true },
        { category: "分析质量", weight: "Pairwise Elo", description: "比较严谨性、完整性与支撑" },
        { category: "呈现质量", weight: "Pairwise Elo", description: "比较交付物的专业呈现" },
        { category: "任务结构", weight: "91 项", description: "4 个跨周知识工作项目" },
      ],
      summary: "Rubric 与两项 Elo 综合；固定权重未公开。",
    },
    rows: CURRENT_LEADERBOARD_ROWS["AA-Briefcase"],
  },
];

const SOURCES = [
  ["火山方舟模型与价格", "https://docs.volcengine.com/docs/82379/1544106?lang=zh#457edfd0"],
  ["Claude 最新模型与价格", "https://platform.claude.com/docs/en/about-claude/models/overview"],
  ["Claude Opus 5 官方发布", "https://www.anthropic.com/news/claude-opus-5"],
  ["Claude Opus 5.5 官方发布", "https://www.anthropic.com/news/claude-opus-5-5"],
  ["Claude Opus 5 系统卡", "https://www-cdn.anthropic.com/c5fbac3f0b1280a933ebd26d3cb8bb9f5bdeaf48/Claude%20Opus%205%20System%20Card.pdf"],
  ["OpenAI 模型与价格", "https://developers.openai.com/api/docs/models/compare"],
  ["OpenAI GPT-5.6 官方发布", "https://openai.com/index/gpt-5-6/"],
  ["OpenAI 图像 / 视频价格", "https://developers.openai.com/api/docs/pricing"],
  ["腾讯云 Hy4 preview 模型列表", "https://cloud.tencent.com/document/product/1823/130051"],
  ["腾讯云 Hy4 preview 价格", "https://cloud.tencent.com/document/product/1823/130055"],
  ["腾讯混元 Hy4 preview 官方模型卡", "https://github.com/Tencent-Hunyuan/Hy4-preview"],
  ["阿里云百炼价格", "https://help.aliyun.com/zh/model-studio/model-pricing"],
  ["Qwen3.8-Max 模型与价格", "https://www.qianwenai.com/models/qwen3.8-max"],
  ["Qwen3.8-Max 官方发布", "https://qwen.ai/blog?id=qwen3.8"],
  ["Qwen3.8-Max 官方模型卡", "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B"],
  ["Qwen3.8-Flash 模型与价格", "https://help.aliyun.com/zh/model-studio/qwen3-8-flash"],
  ["Qwen3.8-27B 官方模型卡", "https://huggingface.co/Qwen/Qwen3.8-27B/blob/main/README.md"],
  ["Qwen3.8-27B 中国区模型与价格", "https://help.aliyun.com/zh/model-studio/qwen3-8-27b"],
  ["阿里云视频 / 图像模型", "https://help.aliyun.com/zh/model-studio/image-model"],
  ["Kimi K3 价格", "https://www.kimi.com/zh-cn/resources/kimi-k3-pricing"],
  ["Kimi K3 官方模型卡", "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md"],
  ["智谱开放平台价格", "https://bigmodel.cn/pricing"],
  ["GLM-5.3 官方发布", "https://z.ai/blog/glm-5.3"],
  ["GLM-5.3-Flash 官方发布", "https://z.ai/blog/glm-5.3-flash"],
  ["GLM-5.3-Flash 官方模型卡", "https://huggingface.co/zai-org/GLM-5.3-Flash"],
  ["DeepSeek 中国区价格", "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/"],
  ["DeepSeek V4 Flash 0731 官方更新", "https://api-docs.deepseek.com/zh-cn/updates/"],
  ["DeepSeek V4 Pro 0813 官方模型卡", "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813"],
  ["SpaceXAI Grok 4.6 官方发布", "https://x.ai/news/grok-4-6"],
  ["SpaceXAI Grok 4.6 模型与价格", "https://docs.x.ai/developers/grok-4-6"],
  ["SpaceXAI Grok 4.7 官方发布", "https://x.ai/news/grok-4-7"],
  ["Claude Fable 5.1 官方发布", "https://www.anthropic.com/claude/fable"],
  ["小米 MiMo 价格", "https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go"],
  ["小米 MiMo-V2.6 模型卡", "https://huggingface.co/collections/XiaomiMiMo/mimo-v26"],
  ["阶跃星辰 Step 5 Preview", "https://www.stepfun.com/step-5-preview"],
  ["Meta Muse Spark 官方模型页", "https://developer.meta.com/ai/models/muse-spark/"],
  ["Google Gemini Flash 官方模型页", "https://deepmind.google/models/gemini/flash/"],
  ["MiniMax 中国区价格", "https://platform.minimaxi.com/docs/guides/pricing-paygo"],
  ["HLE 官方基准", "https://labs.scale.com/leaderboard/humanitys_last_exam"],
  ["GDPval-AA v2.1 官方榜", "https://artificialanalysis.ai/evaluations/gdpval-aa"],
  ["FrontierSWE v2 官方榜", "https://www.frontierswe.com/"],
  ["DeepSWE 官方榜", "https://deepswe.datacurve.ai/"],
  ["Terminal-Bench 4.0 官方榜", "https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/latest?tab=leaderboard&leaderboard=4-0-0"],
  ["Terminal-Bench 4.0 发布说明", "https://www.tbench.ai/news/terminal-bench-4-0"],
  ["Terminal-Bench 3.0 官方榜", "https://www.frontierbench.ai/"],
  ["Agents’ Last Exam 官方榜", "https://agents-last-exam.org/leaderboard"],
  ["LLM Stats 单项测评", "https://llm-stats.com/benchmarks"],
  ["LMArena Leaderboard", "https://arena.ai/leaderboard"],
  ["Artificial Analysis Intelligence Index", "https://artificialanalysis.ai/leaderboards/models"],
  ["AA Coding Agents", "https://artificialanalysis.ai/agents/coding-agents"],
  ["AA Agentic Index 镜像（benchlm.ai）", "https://benchlm.ai/benchmarks/aaagenticindex"],
  ["AA-Briefcase", "https://artificialanalysis.ai/evaluations/aa-briefcase"],
  ["AA Intelligence Index v4.3 方法学", "https://artificialanalysis.ai/methodology/intelligence-benchmarking"],
  ["AA Coding Agent Index 方法学", "https://artificialanalysis.ai/methodology/coding-agents-benchmarking"],
] as const;

function BoardCard({ board, provider }: { board: Board; provider: string }) {
  return (
    <article className="trend-active-board">
      <header>
        <div>
          <span>{provider}</span>
          <a href={board.href} target="_blank" rel="noreferrer">实时榜单 ↗</a>
        </div>
        <small>{board.eyebrow}</small>
        <h3>{board.name}</h3>
        <dl>
          <div><dt>快照</dt><dd>{board.snapshot}</dd></div>
          <div><dt>排序</dt><dd>{board.direction}</dd></div>
        </dl>
        <section className="trend-board-assessment" aria-label={`${board.name} 评估逻辑`}>
          <div>
            <strong>评估方法</strong>
            <a href={board.assessment.href} target="_blank" rel="noreferrer">{board.assessment.source} ↗</a>
          </div>
          <table>
            <thead><tr><th>类别</th><th>权重 / 口径</th><th>说明</th></tr></thead>
            <tbody>
              {board.assessment.rows.map((row) => (
                <tr className={row.emphasis ? "is-emphasis" : ""} key={`${board.name}-${row.category}`}>
                  <td>{row.category}</td><td>{row.weight}</td><td>{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p><strong>评估逻辑</strong>{board.assessment.summary}</p>
        </section>
        <p className="trend-board-note">{board.note}</p>
      </header>
      <ol>
        {board.rows.slice(0, 50).map((row, index) => (
          <li className={row.highlight ? "is-highlight" : ""} key={`${board.name}-${row.model}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><strong>{row.model}</strong><small>{row.lab}</small></div>
            <b>{row.value}</b>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function LlmTrendsWorkbench() {
  const [expandedTrack, setExpandedTrack] = useState<TrackId | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkKey>("ale");
  const [leaderboardProvider, setLeaderboardProvider] = useState<"aa" | "arena">("aa");
  const [activeAaBoard, setActiveAaBoard] = useState(AA_BOARDS[0].name);
  const [activeArenaBoard, setActiveArenaBoard] = useState(ARENA_BOARDS[0].name);
  const benchmarkMeta = BENCHMARKS.find((item) => item.id === benchmark) ?? BENCHMARKS[0];
  const visibleBoards = leaderboardProvider === "aa" ? AA_BOARDS : ARENA_BOARDS;
  const activeBoardName = leaderboardProvider === "aa" ? activeAaBoard : activeArenaBoard;
  const activeBoard = visibleBoards.find((board) => board.name === activeBoardName) ?? visibleBoards[0];
  const activeTrack = MODEL_TRACKS.find((track) => track.id === expandedTrack) ?? null;
  const referenceMetric = OPUS_46_REFERENCE.metrics[benchmark];
  const benchmarkUnit = benchmark === "gdpvalAaV2"
    ? "Elo，越高越好；人类专家基线为 1,000"
    : benchmark === "hleTools"
      ? "准确率（%）；跨来源配置不完全可比"
      : "任务得分（%），越高越好";
  const providerMeta = leaderboardProvider === "aa"
    ? {
        label: "ARTIFICIAL ANALYSIS",
        question: "能力与 Agent 评测",
        description: "固定任务集与公开方法学。",
      }
    : {
        label: "LMARENA",
        question: "用户偏好评测",
        description: "匿名两两对比与 Bradley–Terry 排名。",
      };
  const benchmarkIsRanked = benchmark !== "hleTools";
  const orderedModels = useMemo(
    () => {
      if (benchmark === "hleTools") return [...TEXT_MODELS];
      return [...TEXT_MODELS].sort((a, b) => {
        const aScore = a.metrics[benchmark].score;
        const bScore = b.metrics[benchmark].score;
        if (aScore === null && bScore === null) return 0;
        if (aScore === null) return 1;
        if (bScore === null) return -1;
        return bScore - aScore;
      });
    },
    [benchmark],
  );

  return (
    <div className="llm-trends" id="llm-trends">
      <section className="trends-hero">
        <div className="trends-hero-copy">
          <div className="trends-kicker">2026.09.30 / STATIC RESEARCH SNAPSHOT</div>
          <h1>LLM 趋势</h1>
          <p>聚焦可复核的模型价格、参数、Agent 基准与第三方榜单。每个分数都绑定模型版本、Harness 和推理档位。</p>
          <div className="trends-hero-actions">
            <a className="trends-primary-action" href="#model-landscape">模型对比</a>
            <a className="trends-secondary-action" href="#leaderboards">第三方测评</a>
          </div>
        </div>
        <aside className="trends-snapshot-panel" aria-label="趋势栏目数据口径">
          <header><span>研究口径</span><strong>官方优先</strong></header>
          <div className="trends-snapshot-summary"><strong>13</strong><p>项单项基准，保留原有九项并新增四项 Agent 评测。</p></div>
          <dl className="trends-snapshot-stats">
            <div><dt>33</dt><dd>文本模型</dd></div>
            <div><dt>13</dt><dd>单项基准</dd></div>
            <div><dt>10</dt><dd>第三方榜单</dd></div>
            <div><dt>50</dt><dd>单榜最多名次</dd></div>
          </dl>
          <ul><li>同名同版本才录入</li><li>Harness 与 effort 随分数展示</li><li>未披露项保留为空</li></ul>
        </aside>
      </section>

      <nav className="trends-section-nav" aria-label="LLM 趋势页面目录">
        <a href="#model-landscape">模型对比</a><a href="#benchmark-lens">单项测评</a><a href="#leaderboards">第三方测评</a><a href="#pelican-test">鹈鹕测试</a><a href="#trend-sources">来源</a>
      </nav>

      <section className="trends-section trends-track-section" id="model-landscape">
        <div className="trends-section-heading"><div><h2>模型分类</h2></div><span>Seed、Seedance、Seedream 及同代竞品。</span></div>
        <div className="trend-track-grid">
          {MODEL_TRACKS.map((track) => (
            <article className={`trend-track-card is-${track.id}${expandedTrack === track.id ? " is-expanded" : ""}`} key={track.id}>
              <span>{track.models.length} 个模型</span><h3>{track.label}</h3>
              <strong>{track.lead}</strong><p>{track.summary}</p>
              <button
                aria-controls={`track-comparison-${track.id}`}
                aria-expanded={expandedTrack === track.id}
                className="trend-compare-button"
                onClick={() => setExpandedTrack((current) => current === track.id ? null : track.id)}
                type="button"
              >
                <span>{expandedTrack === track.id ? "收起比较" : "友商比较"}</span>
                <b>{expandedTrack === track.id ? "−" : "＋"}</b>
              </button>
            </article>
          ))}
        </div>
        {activeTrack ? (
          <section
            aria-label={`${activeTrack.label}对比`}
            className={`trend-track-expansion is-${activeTrack.id}`}
            id={`track-comparison-${activeTrack.id}`}
          >
            <header>
              <div><span>MODEL SET / {String(activeTrack.models.length).padStart(2, "0")}</span><h3>{activeTrack.label}对比</h3></div>
              <p>{activeTrack.comparisonNote}</p>
            </header>
            <div className="trend-model-comparison-wrap">
              <table className="trend-model-comparison-table">
                <thead>
                  <tr>
                    <th>厂商</th>
                    <th>模型</th>
                    <th>档位</th>
                    <th>{activeTrack.id === "text" ? "价格（输入 / 输出）" : "价格"}</th>
                    {activeTrack.id === "text" ? <th>成本估算</th> : null}
                    <th>参数量</th>
                    <th>{activeTrack.id === "text" ? "上下文" : activeTrack.id === "video" ? "关键规格" : "能力"}</th>
                    <th>来源</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTrack.models.map((item) => (
                    <tr className={item.isPrimary ? "is-primary" : ""} key={`${item.vendor}-${item.model}-${item.tier}`}>
                      <td><span>{item.vendor}</span>{item.isPrimary ? <b>ARK</b> : null}</td>
                      <td><strong>{item.model}</strong></td>
                      <td><em>{item.tier}</em></td>
                      <td><strong>{item.price}</strong><small>{item.priceNote}</small></td>
                      {activeTrack.id === "text" ? <td><strong>{item.estimatedCost ?? "—"}</strong><small>95:4:1 混合 / 百万 tokens</small></td> : null}
                      <td>{item.parameters}</td>
                      <td><span>{item.spec}</span><small>{item.specLabel}</small></td>
                      <td><a href={item.href} target="_blank" rel="noreferrer">官方 ↗</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer><span>范围</span><p>{activeTrack.scope}</p></footer>
          </section>
        ) : null}
      </section>

      <section className="trends-section trends-benchmark-section" id="benchmark-lens">
        <div className="trends-section-heading"><div><h2>单项测评</h2></div><span>完整列出目标模型；缺失值保留核验来源。</span></div>
        <div className="trends-focus-switch trend-benchmark-switch" role="group" aria-label="选择 benchmark">
          {BENCHMARKS.map((item) => (
            <button
              aria-pressed={benchmark === item.id}
              className={benchmark === item.id ? "is-active" : ""}
              key={item.id}
              onClick={() => setBenchmark(item.id)}
              type="button"
            >
              <span>{item.short}</span>
              <strong>{item.label}</strong>
            </button>
          ))}
        </div>
        <div className="trends-focus-layout">
          <aside className="trends-focus-brief"><span>{benchmarkMeta.short}</span><h3>{benchmarkMeta.label}</h3><p>{benchmarkMeta.lens}</p><dl><div><dt>读分数</dt><dd>{benchmarkUnit}</dd></div><div><dt>可比边界</dt><dd>{benchmarkIsRanked ? "模型版本 / Agent Harness / 推理档位" : "不同题集与工具配置只展示原始值，不做统一排名"}</dd></div><div><dt>缺失值</dt><dd>不以近似型号或旧版本补位</dd></div></dl></aside>
          <div className="trends-scoreboard">
            <div className={`trends-score-row is-reference${referenceMetric.score === null ? " is-na" : ""}`}>
              <span className="trends-score-rank">REF</span>
              <div>
                <strong>{OPUS_46_REFERENCE.model}<em>标准对照</em></strong>
                <small><a href={referenceMetric.href} target="_blank" rel="noreferrer">{referenceMetric.source} ↗</a></small>
              </div>
              <strong className="trends-score-value">{referenceMetric.value}</strong>
            </div>
            {orderedModels.map((item, index) => {
              const metric = item.metrics[benchmark];
              return (
                <div className={`trends-score-row${metric.score === null ? " is-na" : ""}`} key={item.model}>
                  <span
                    aria-label={benchmarkIsRanked && metric.score !== null ? `第 ${index + 1} 名` : benchmarkIsRanked ? "未收录" : metric.score === null ? "未收录" : "原始披露值，不排名"}
                    className="trends-score-rank"
                    title={!benchmarkIsRanked && metric.score !== null ? "跨来源原始值，不参与统一排名" : undefined}
                  >
                    {metric.score === null ? "—" : benchmarkIsRanked ? String(index + 1).padStart(2, "0") : "值"}
                  </span>
                  <div>
                    <strong>{item.model}</strong>
                    <small><a href={metric.href} target="_blank" rel="noreferrer">{metric.source} ↗</a></small>
                  </div>
                  <strong className="trends-score-value">{metric.value}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="trends-section trends-leaderboard-section" id="leaderboards">
        <div className="trends-section-heading trends-section-heading-light"><div><h2>第三方测评</h2></div><span>Artificial Analysis 4 项；LMArena 6 项；各取前 50，不足则全量。</span></div>
        <div className="trend-provider-switch" role="group" aria-label="选择排行榜平台">
          <button
            aria-pressed={leaderboardProvider === "aa"}
            className={leaderboardProvider === "aa" ? "is-active" : ""}
            onClick={() => setLeaderboardProvider("aa")}
            type="button"
          >
            <div><small>INDEPENDENT BENCHMARKS</small><strong>Artificial Analysis</strong></div>
          </button>
          <button
            aria-pressed={leaderboardProvider === "arena"}
            className={leaderboardProvider === "arena" ? "is-active" : ""}
            onClick={() => setLeaderboardProvider("arena")}
            type="button"
          >
            <div><small>HUMAN PREFERENCE</small><strong>LMArena</strong></div>
          </button>
        </div>
        <div className="trend-provider-context">
          <span>{providerMeta.label}</span>
          <h3>{providerMeta.question}</h3>
          <p>{providerMeta.description}</p>
          <b>{leaderboardProvider === "aa" ? "4 张榜单" : "6 张榜单"}</b>
        </div>
        <div
          className={`trend-board-switch is-${leaderboardProvider}`}
          role="group"
          aria-label={`选择 ${providerMeta.label} 榜单`}
        >
          {visibleBoards.map((board) => (
            <button
              aria-pressed={activeBoard.name === board.name}
              className={activeBoard.name === board.name ? "is-active" : ""}
              key={board.name}
              onClick={() => {
                if (leaderboardProvider === "aa") setActiveAaBoard(board.name);
                else setActiveArenaBoard(board.name);
              }}
              type="button"
            >
              <span>{board.eyebrow}</span>
              <strong>{board.name}</strong>
            </button>
          ))}
        </div>
        <BoardCard board={activeBoard} provider={providerMeta.label} />
        <p className="trends-leaderboard-note">当前榜已录入 {activeBoard.rows.length} 条；preliminary、reasoning effort 与置信区间按原榜口径保留。</p>
      </section>

      <section className="trends-section trends-pelican-section" id="pelican-test">
        <div className="trends-section-heading"><div><h2>鹈鹕测试</h2></div><span>社区非正式基准 · 演示模块 · 仅显式执行时调用真实 API。</span></div>
        <PelicanTestPanel />
      </section>

      <section className="trends-section trends-sources-section" id="trend-sources">
        <div className="trends-section-heading"><div><h2>数据来源</h2></div><span>厂商官网优先；缺失项使用独立榜单。</span></div>
        <div className="trends-source-grid trend-source-grid-compact">{SOURCES.map(([label, href]) => <article key={href}><a href={href} target="_blank" rel="noreferrer"><span>{label}</span><b>↗</b></a></article>)}</div>
        <div className="trends-method-note"><strong>范围</strong><p>截至 2026-09-23 可核验的正式模型；静态快照，不自动抓榜或调用 API。</p></div>
      </section>
    </div>
  );
}
