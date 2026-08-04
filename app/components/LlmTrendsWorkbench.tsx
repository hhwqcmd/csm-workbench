"use client";

import { useMemo, useState } from "react";

type BenchmarkKey =
  | "nl2Repo"
  | "sciCode"
  | "terminal"
  | "swePro"
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
  parameters: string;
  specLabel: string;
  spec: string;
  href: string;
  isPrimary?: boolean;
};

type ModelTrack = {
  id: TrackId;
  label: string;
  eyebrow: string;
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
    id: "sciCode",
    short: "SCI CODE",
    label: "SciCode",
    lens: "科研场景中的代码生成与问题求解。",
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
    lens: "113 项长程软件工程任务；3 次运行平均 pass@1。",
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

const TEXT_MODELS: TextModel[] = [
  {
    vendor: "火山方舟",
    model: "Doubao-Seed-2.1-Pro",
    release: "2026.06",
    access: "闭源 API",
    price: "¥6 / ¥30",
    priceNote: "中国区标准输入 / 输出",
    context: "256K",
    parameters: "未披露",
    officialUrl: "https://www.volcengine.com/product/doubao",
    metrics: {
      nl2Repo: {
        value: "47.0%",
        score: 47,
        source: "Seed 2.1 发布数据",
        href: "https://www.volcengine.com/product/doubao",
      },
      sciCode: {
        value: "59.8%",
        score: 59.8,
        source: "Seed 2.1 发布数据",
        href: "https://www.volcengine.com/product/doubao",
      },
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
        "AA v1.3 未收录该模型 / Agent 配置",
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
    vendor: "Anthropic",
    model: "Claude Fable 5",
    release: "2026.06",
    access: "闭源 API",
    price: "$10 / $50",
    priceNote: "全球 API 输入 / 输出",
    context: "官方产品页未披露",
    parameters: "未披露",
    officialUrl: "https://www.anthropic.com/claude/fable",
    metrics: {
      nl2Repo: NA("https://www.anthropic.com/claude/fable"),
      sciCode: {
        value: "60.2%",
        score: 60.2,
        source: "Kimi 官方模型卡交叉表",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
      ale: {
        value: "25.7%",
        score: 25.7,
        source: "ALE 官方榜 · Claude Code",
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
        value: "66.0%",
        score: 66,
        source: "AA v1.3 · Claude Code / max + fallback",
        href: "https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-kimi-code-cli",
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
    vendor: "OpenAI",
    model: "GPT-5.6 Sol",
    release: "2026.07",
    access: "闭源 API",
    price: "$5 / $30",
    priceNote: "全球 API 输入 / 输出",
    context: "1.05M",
    parameters: "未披露",
    officialUrl: "https://openai.com/index/gpt-5-6/",
    metrics: {
      nl2Repo: NA("https://openai.com/index/gpt-5-6/"),
      sciCode: {
        value: "56.1%",
        score: 56.1,
        source: "Kimi 官方模型卡交叉表",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
      ale: {
        value: "29.6%",
        score: 29.6,
        source: "Kimi 官方模型卡 · ALE / Codex",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
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
      deepSwe: {
        value: "72.7%",
        score: 72.7,
        source: "OpenAI 官方发布 · DeepSWE v1.1 / max",
        href: "https://openai.com/index/gpt-5-6/",
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
    vendor: "阿里云",
    model: "Qwen3.8-Max",
    release: "2026.08",
    access: "API / 权重待开放",
    price: "¥12 / ¥36",
    priceNote: "中国区标准输入 / 输出",
    context: "1M",
    parameters: "2.4T / 95B 激活",
    officialUrl: "https://www.qianwenai.com/models/qwen3.8-max",
    metrics: {
      nl2Repo: {
        value: "55.9%",
        score: 55.9,
        source: "Qwen 官方 · Claude Code",
        href: "https://qwen.ai/blog?id=qwen3.8",
      },
      sciCode: NA(
        "https://qwen.ai/blog?id=qwen3.8",
        "Qwen 官方未发布 SciCode / Agent 框架",
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
      deepSwe: {
        value: "56.6%",
        score: 56.6,
        source: "Qwen 官方 · DeepSWE 1.1 / Claude Code",
        href: "https://qwen.ai/blog?id=qwen3.8",
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
    vendor: "月之暗面",
    model: "Kimi K3",
    release: "2026.07",
    access: "开放权重 / API",
    price: "¥20 / ¥100",
    priceNote: "中国区缓存未命中输入 / 输出",
    context: "1.05M",
    parameters: "2.8T / 104B 激活",
    officialUrl: "https://www.kimi.com/zh-cn/resources/kimi-k3-pricing",
    metrics: {
      nl2Repo: NA("https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md"),
      sciCode: {
        value: "58.7%",
        score: 58.7,
        source: "Kimi 官方模型卡",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
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
      deepSwe: {
        value: "67.5%",
        score: 67.5,
        source: "Kimi 官方模型卡 · Kimi Code / max",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
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
    model: "GLM-5.2",
    release: "2026.06",
    access: "开放权重 / API",
    price: "¥8 / ¥28",
    priceNote: "中国区标准输入 / 输出",
    context: "1M",
    parameters: "753B",
    officialUrl: "https://bigmodel.cn/pricing",
    metrics: {
      nl2Repo: {
        value: "48.9%",
        score: 48.9,
        source: "GLM 官方发布",
        href: "https://z.ai/blog/glm-5.2",
      },
      sciCode: {
        value: "50.5%",
        score: 50.5,
        source: "Kimi 官方模型卡交叉表",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
      ale: {
        value: "20.4%",
        score: 20.4,
        source: "ALE 官方榜 · Claude Code",
        href: "https://agents-last-exam.org/leaderboard",
      },
      terminal: {
        value: "82.7%",
        score: 82.7,
        source: "GLM / Kimi 官方模型卡",
        href: "https://huggingface.co/zai-org/GLM-5.2",
      },
      mcpAtlas: {
        value: "82.6%",
        score: 82.6,
        source: "官方模型卡交叉表",
        href: "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md",
      },
      swePro: {
        value: "62.1%",
        score: 62.1,
        source: "GLM 官方模型卡",
        href: "https://huggingface.co/zai-org/GLM-5.2",
      },
      deepSwe: {
        value: "46.2%",
        score: 46.2,
        source: "GLM 官方模型卡 · mini-swe-agent",
        href: "https://huggingface.co/zai-org/GLM-5.2",
      },
      osWorld: NA("https://z.ai/blog/glm-5.2"),
      mmmuPro: NA("https://z.ai/blog/glm-5.2"),
    },
  },
  {
    vendor: "深度求索",
    model: "DeepSeek-V4-Flash-0731",
    release: "2026.07.31",
    access: "开放权重 / API",
    price: "¥1 / ¥2",
    priceNote: "中国区缓存未命中输入 / 输出",
    context: "1M",
    parameters: "284B / 13B 激活",
    officialUrl: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/",
    metrics: {
      nl2Repo: {
        value: "54.2%",
        score: 54.2,
        source: "DeepSeek 官方 · DeepSeek Harness 极简模式 / max",
        href: "https://api-docs.deepseek.com/zh-cn/updates/",
      },
      sciCode: NA(
        "https://api-docs.deepseek.com/zh-cn/updates/",
        "DeepSeek 官方未发布 SciCode 同名结果",
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
      deepSwe: {
        value: "54.4%",
        score: 54.4,
        source: "DeepSeek 官方 · DeepSeek Harness 极简模式 / max",
        href: "https://api-docs.deepseek.com/zh-cn/updates/",
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
    vendor: "MiniMax",
    model: "MiniMax M3",
    release: "2026.06",
    access: "开放权重 / API",
    price: "¥2.1 / ¥8.4 起",
    priceNote: "中国区 ≤512K 基础档输入 / 输出",
    context: "1M",
    parameters: "428B / 23B 激活",
    officialUrl: "https://platform.minimaxi.com/docs/guides/pricing-paygo",
    metrics: {
      nl2Repo: {
        value: "42.1%",
        score: 42.1,
        source: "MiniMax 官方发布",
        href: "https://www.minimax.io/blog/minimax-m3",
      },
      sciCode: NA("https://www.minimaxi.com/blog/minimax-m3"),
      ale: NA("https://agents-last-exam.org/leaderboard"),
      terminal: {
        value: "66.0%",
        score: 66,
        source: "MiniMax 官方发布",
        href: "https://www.minimaxi.com/blog/minimax-m3",
      },
      mcpAtlas: {
        value: "74.2%",
        score: 74.2,
        source: "MiniMax 官方发布",
        href: "https://www.minimaxi.com/blog/minimax-m3",
      },
      swePro: {
        value: "59.0%",
        score: 59,
        source: "MiniMax 官方发布",
        href: "https://www.minimaxi.com/blog/minimax-m3",
      },
      deepSwe: NA(
        "https://artificialanalysis.ai/agents/coding-agents",
        "AA v1.3 未收录该模型 / Agent 配置",
      ),
      osWorld: {
        value: "70.1%",
        score: 70.06,
        source: "MiniMax 官方 · OSWorld-Verified",
        href: "https://www.minimax.io/blog/minimax-m3",
      },
      mmmuPro: {
        value: "78.1%",
        score: 78.1,
        source: "MiniMax 官方模型卡",
        href: "https://huggingface.co/MiniMaxAI/MiniMax-M3",
      },
    },
  },
];

const OPUS_46_REFERENCE: Pick<TextModel, "vendor" | "model" | "metrics"> = {
  vendor: "Anthropic",
  model: "Claude Opus 4.6",
  metrics: {
    nl2Repo: NA("https://www.anthropic.com/news/claude-opus-4-6"),
    sciCode: {
      value: "51.9%",
      score: 51.9,
      source: "Kimi 官方模型卡交叉表",
      href: "https://huggingface.co/moonshotai/Kimi-K2.6",
    },
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
      source: "AA v1.3 分项未提供 DeepSWE 得分",
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
    eyebrow: "TEXT / REASONING / AGENT",
    lead: "Doubao-Seed-2.1-Pro",
    summary: "价格、参数与九项单项 Benchmark。",
    comparisonNote: "火山方舟与七家指定厂商；价格为每百万 tokens 输入 / 输出。",
    scope: "火山方舟、Claude、GPT、Qwen、Kimi、GLM、DeepSeek、MiniMax。",
    models: [
      {
        vendor: "火山方舟",
        model: "Doubao-Seed-2.1-Pro",
        tier: "旗舰",
        price: "¥6 / ¥30",
        priceNote: "中国区标准输入 / 输出",
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
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://platform.claude.com/docs/en/about-claude/models/overview",
      },
      {
        vendor: "Anthropic",
        model: "Claude Sonnet 5",
        tier: "均衡",
        price: "$3 / $15",
        priceNote: "标准价；8 月 31 日前有引入价",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://platform.claude.com/docs/en/about-claude/models/overview",
      },
      {
        vendor: "OpenAI",
        model: "GPT-5.6 Sol",
        tier: "旗舰",
        price: "$5 / $30",
        priceNote: "全球 API 输入 / 输出",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1.05M",
        href: "https://developers.openai.com/api/docs/models/compare",
      },
      {
        vendor: "OpenAI",
        model: "GPT-5.6 Terra",
        tier: "均衡",
        price: "$2.5 / $15",
        priceNote: "全球 API 输入 / 输出",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1.05M",
        href: "https://developers.openai.com/api/docs/models/compare",
      },
      {
        vendor: "OpenAI",
        model: "GPT-5.6 Luna",
        tier: "经济",
        price: "$1 / $6",
        priceNote: "全球 API 输入 / 输出",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1.05M",
        href: "https://developers.openai.com/api/docs/models/compare",
      },
      {
        vendor: "阿里云",
        model: "Qwen3.8-Max",
        tier: "旗舰",
        price: "¥12 / ¥36",
        priceNote: "中国区标准输入 / 输出",
        parameters: "2.4T / 95B 激活",
        specLabel: "上下文",
        spec: "1M",
        href: "https://www.qianwenai.com/models/qwen3.8-max",
      },
      {
        vendor: "阿里云",
        model: "Qwen3.7-Plus",
        tier: "均衡",
        price: "¥2 / ¥8 起",
        priceNote: "中国区 ≤256K 输入 / 输出",
        parameters: "未披露",
        specLabel: "上下文",
        spec: "1M",
        href: "https://help.aliyun.com/zh/model-studio/model-pricing",
      },
      {
        vendor: "月之暗面",
        model: "Kimi K3",
        tier: "旗舰",
        price: "¥20 / ¥100",
        priceNote: "中国区缓存未命中输入 / 输出",
        parameters: "2.8T / 104B 激活",
        specLabel: "上下文",
        spec: "1.05M",
        href: "https://www.kimi.com/zh-cn/resources/kimi-k3-pricing",
      },
      {
        vendor: "智谱",
        model: "GLM-5.2",
        tier: "旗舰",
        price: "¥8 / ¥28",
        priceNote: "中国区标准输入 / 输出",
        parameters: "753B",
        specLabel: "上下文",
        spec: "1M",
        href: "https://bigmodel.cn/pricing",
      },
      {
        vendor: "深度求索",
        model: "DeepSeek-V4 Pro",
        tier: "旗舰",
        price: "¥3 / ¥6",
        priceNote: "中国区缓存未命中输入 / 输出",
        parameters: "1.6T / 49B 激活",
        specLabel: "上下文",
        spec: "1M",
        href: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/",
      },
      {
        vendor: "深度求索",
        model: "DeepSeek-V4-Flash-0731",
        tier: "正式版 · 高性价比",
        price: "¥1 / ¥2",
        priceNote: "中国区缓存未命中输入 / 输出",
        parameters: "284B / 13B 激活",
        specLabel: "上下文",
        spec: "1M",
        href: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/",
      },
      {
        vendor: "MiniMax",
        model: "MiniMax M3",
        tier: "旗舰",
        price: "¥2.1 / ¥8.4 起",
        priceNote: "中国区基础档输入 / 输出",
        parameters: "428B / 23B 激活",
        specLabel: "上下文",
        spec: "1M",
        href: "https://www.minimaxi.com/models/text/m3",
      },
    ],
  },
  {
    id: "video",
    label: "生视频模型",
    eyebrow: "TEXT TO VIDEO",
    lead: "Seedance 2.5",
    summary: "最新发布：Seedance 2.5；Arena 可比版本：Seedance 2.0。",
    comparisonNote: "纯生成、按输出秒比较：Seedance 系列为 720p、16:9、5 秒官方示例，H3 为 768P 刊例价；分辨率近似但不完全相同。",
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
        model: "Wan2.7 T2V",
        tier: "旗舰",
        price: "¥0.6–¥1 / 秒",
        priceNote: "中国区 720p–1080p",
        parameters: "未披露",
        specLabel: "时长",
        spec: "2–15 秒",
        href: "https://help.aliyun.com/zh/model-studio/wan2-7-t2v",
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
    eyebrow: "IMAGE GENERATION + EDIT",
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
    snapshot: "2026-08-01 · Model ranking",
    direction: "偏好 Elo ↑",
    note: "DeepSeek V4 Flash：第 80，1436 ± 4；Arena 未标注 0731 版本。",
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
    rows: [
      ["Claude Fable 5", "Anthropic", "1509 ± 6"],
      ["Claude Opus 4.6 Thinking", "Anthropic", "1505 ± 4"],
      ["Claude Opus 4.7 Thinking", "Anthropic", "1502 ± 4"],
      ["Claude Opus 4.6", "Anthropic", "1497 ± 4"],
      ["Qwen3.8 Max", "Alibaba", "1496 ± 10 · Preliminary"],
      ["Claude Opus 4.7", "Anthropic", "1492 ± 4"],
      ["Claude Opus 5 High", "Anthropic", "1492 ± 6"],
      ["Claude Opus 5 Max", "Anthropic", "1490 ± 9 · Preliminary"],
      ["Muse Spark 1.1", "Meta", "1490 ± 6 · Preliminary"],
      ["Muse Spark", "Meta", "1488 ± 6 · Preliminary"],
    ].map(([model, lab, value]) => ({ model, lab, value })),
  },
  {
    eyebrow: "CODE",
    name: "Coding Arena",
    snapshot: "2026-08-01 · Model ranking",
    direction: "偏好 Elo ↑",
    note: "DeepSeek V4 Flash：第 81，1484 ± 6；Arena 未标注 0731 版本。",
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
    rows: [
      ["Claude Fable 5", "Anthropic", "1553 ± 9"],
      ["Claude Opus 4.7 Thinking", "Anthropic", "1552 ± 6"],
      ["Claude Opus 4.6 Thinking", "Anthropic", "1551 ± 6"],
      ["Claude Opus 4.6", "Anthropic", "1548 ± 6"],
      ["Claude Opus 4.7", "Anthropic", "1547 ± 6"],
      ["Claude Opus 4.8 Thinking", "Anthropic", "1534 ± 7"],
      ["Claude Opus 5 High", "Anthropic", "1532 ± 12"],
      ["Kimi K3 Max", "Moonshot", "1531 ± 20 · Preliminary"],
      ["Claude Opus 4.5 Thinking", "Anthropic", "1530 ± 7"],
      ["Qwen3.8 Max", "Alibaba", "1530 ± 19 · Preliminary"],
    ].map(([model, lab, value]) => ({ model, lab, value })),
  },
  {
    eyebrow: "WEBDEV",
    name: "WebDev Arena",
    snapshot: "2026-08-01 · Model ranking",
    direction: "偏好 Elo ↑",
    note: "DeepSeek V4 Flash High：第 8，Preliminary；Arena 未标注 0731 版本。",
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
    rows: [
      ["Claude Opus 5 Max", "Anthropic", "1705 +15/-15"],
      ["Kimi K3 Max", "Moonshot", "1676 +12/-12"],
      ["Claude Opus 5 High", "Anthropic", "1669 +11/-11"],
      ["Qwen3.8 Max", "Alibaba", "1668 +18/-18 · Preliminary"],
      ["Claude Fable 5", "Anthropic", "1630 +9/-9"],
      ["GPT-5.6 Sol xhigh · Codex", "OpenAI", "1620 +9/-9"],
      ["GLM-5.2 Max", "Z.ai", "1586 +9/-9"],
      ["DeepSeek V4 Flash High", "DeepSeek", "1577 +18/-18 · Preliminary"],
      ["Claude Opus 4.8 Thinking", "Anthropic", "1566 +8/-8"],
      ["Claude Opus 4.7", "Anthropic", "1561 +7/-7"],
    ].map(([model, lab, value]) => ({ model, lab, value })),
  },
  {
    eyebrow: "VISION",
    name: "Vision Arena",
    snapshot: "2026-07-26 · Lab ranking",
    direction: "偏好 Elo ↑",
    note: "含图对话；实验室聚合。",
    href: "https://arena.ai/leaderboard/vision?rankBy=labs",
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
    rows: [
      ["Claude Fable 5", "Anthropic", "1318 ± 9"],
      ["Gemini 3.6 Flash", "Google", "1301 ± 38"],
      ["Muse Spark", "Meta", "1295 ± 9"],
      ["GPT-5.5", "OpenAI", "1287 ± 7"],
      ["Grok 4.5", "xAI", "1282 ± 12"],
      ["Kimi K2.6", "Moonshot", "1264 ± 7"],
      ["Qwen3.7 Plus", "Alibaba", "1262 ± 9"],
      ["Dola-Seed-2.0-Pro", "ByteDance", "1258 ± 8"],
      ["MiniMax M3", "MiniMax", "1240 ± 8"],
      ["MiMo V2.5", "Xiaomi", "1240 ± 7"],
    ].map(([model, lab, value]) => ({
      model,
      lab,
      value,
      highlight: model.includes("Seed"),
    })),
  },
  {
    eyebrow: "IMAGE",
    name: "Text-to-Image",
    snapshot: "2026-07-10 · Model ranking",
    direction: "偏好 Elo ↑",
    note: "文本生图偏好；Seedream 5.0 Pro 当前第 11。",
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
    rows: [
      ["GPT Image 2 · medium", "OpenAI", "1385 ± 5"],
      ["Reve 2.1", "Reve", "1302 ± 12"],
      ["Muse Image", "Meta", "1280 ± 8"],
      ["Reve 2.0", "Reve", "1271 ± 6"],
      ["Gemini 3.1 Flash Image · web search", "Google", "1261 ± 7"],
      ["MAI Image 2.5", "Microsoft", "1257 ± 5"],
      ["Gemini 3.1 Flash Lite Image", "Google", "1250 ± 8"],
      ["Gemini 3 Pro Image 2K", "Google", "1245 ± 3"],
      ["GPT Image 1.5 High Fidelity", "OpenAI", "1240 ± 3"],
      ["Gemini 3 Pro Image Preview", "Google", "1232 ± 5"],
    ].map(([model, lab, value]) => ({ model, lab, value })),
  },
  {
    eyebrow: "VIDEO",
    name: "Text-to-Video",
    snapshot: "2026-07-05 · Model ranking",
    direction: "偏好 Elo ↑",
    note: "文本生视频；Seedance 2.0 为当前可比版本。",
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
    rows: [
      ["Gemini Omni Flash", "Google", "1527 ± 13"],
      ["Seedance 2.0 · 720p", "ByteDance", "1482 ± 10"],
      ["Muse Video", "Meta", "1459 ± 15"],
      ["HappyHorse 1.0", "Alibaba ATH", "1430 ± 13"],
      ["Sora 2 Pro", "OpenAI", "1366 ± 8"],
      ["Veo 3.1 Audio · 1080p", "Google", "1364 ± 11"],
      ["Veo 3.1 Audio", "Google", "1364 ± 14"],
      ["Veo 3.1 Fast Audio", "Google", "1362 ± 11"],
      ["Veo 3.1 Fast Audio · 1080p", "Google", "1360 ± 10"],
      ["Grok Imagine Video · 720p", "xAI", "1352 ± 8"],
    ].map(([model, lab, value]) => ({
      model,
      lab,
      value,
      highlight: model.includes("Seedance"),
    })),
  },
];

const AA_BOARDS: Board[] = [
  {
    eyebrow: "INTELLIGENCE",
    name: "Intelligence Index v4.1",
    snapshot: "2026-08-03 · model configurations",
    direction: "综合指数 ↑",
    note: "DeepSeek V4 Flash 0731 · max：50；未进入 Top 10。",
    href: "https://artificialanalysis.ai/models",
    assessment: {
      source: "AA Intelligence 方法学",
      href: "https://artificialanalysis.ai/methodology/intelligence-benchmarking",
      rows: [
        { category: "Agents", weight: "34%", description: "GDPval-AA v2、τ³-Banking", emphasis: true },
        { category: "Coding", weight: "24%", description: "Terminal-Bench 2.1、SciCode", emphasis: true },
        { category: "科学推理", weight: "24%", description: "HLE、GPQA Diamond、CritPt" },
        { category: "通用能力", weight: "18%", description: "AA-LCR、AA-Omniscience" },
      ],
      summary: "9 项基准按 4 类不等权合成：Agents 34%，Coding 24%。",
    },
    rows: [
      ["Claude Opus 5 · max", "Anthropic", "61"],
      ["Claude Opus 5 · xhigh", "Anthropic", "60"],
      ["Claude Fable 5 · max + fallback", "Anthropic", "60"],
      ["GPT-5.6 Sol · max", "OpenAI", "59"],
      ["Claude Opus 5 · high", "Anthropic", "59"],
      ["GPT-5.6 Sol · xhigh", "OpenAI", "58"],
      ["Kimi K3 · max", "Moonshot", "57"],
      ["Claude Opus 4.8 · max", "Anthropic", "56"],
      ["GPT-5.6 Sol · high", "OpenAI", "56"],
      ["GPT-5.6 Terra · max", "OpenAI", "55"],
    ].map(([model, lab, value]) => ({ model, lab, value })),
  },
  {
    eyebrow: "AA CODE",
    name: "Coding Agent Index",
    snapshot: "2026-07-31 · v1.3 · model + harness",
    direction: "Agent 编程指数 ↑",
    note: "0731 正式版尚未进入 AA v1.3 的 model + harness 配置榜。",
    href: "https://artificialanalysis.ai/agents/coding-agents",
    assessment: {
      source: "AA Coding Agent 方法学",
      href: "https://artificialanalysis.ai/methodology/coding-agents-benchmarking",
      rows: [
        { category: "DeepSWE", weight: "⅓", description: "113 项长程软件工程任务", emphasis: true },
        { category: "Terminal-Bench v2", weight: "⅓", description: "84 项 Agent 终端任务", emphasis: true },
        { category: "SWE-Atlas-QnA", weight: "⅓", description: "124 项真实仓库问答" },
        { category: "重复运行", weight: "3 次", description: "先按任务平均，再汇总 pass@1" },
      ],
      summary: "模型、Agent harness 与推理设置共同计分。",
    },
    rows: [
      ["Claude Opus 5 xhigh · Claude Code", "Anthropic", "67"],
      ["GPT-5.6 Sol max · Codex", "OpenAI", "67"],
      ["Claude Fable 5 max · Claude Code", "Anthropic", "66"],
      ["GPT-5.6 Sol xhigh · Codex", "OpenAI", "65"],
      ["GPT-5.6 Sol high · Codex", "OpenAI", "64"],
      ["Grok 4.5 high · Grok Build", "xAI", "64"],
      ["GPT-5.6 Terra max · Codex", "OpenAI", "62"],
      ["Kimi K3 · Kimi Code CLI", "Moonshot", "61"],
      ["GPT-5.5 xhigh · Codex", "OpenAI", "61"],
      ["GPT-5.6 Sol medium · Codex", "OpenAI", "61"],
    ].map(([model, lab, value]) => ({ model, lab, value })),
  },
  {
    eyebrow: "AGENTIC",
    name: "Agentic Index",
    snapshot: "2026-08-03 · Model configurations",
    direction: "Agentic 指数 ↑",
    note: "DeepSeek V4 Flash 0731 · max：46；未进入 Top 10。",
    href: "https://artificialanalysis.ai/models/capabilities/agentic/",
    assessment: {
      source: "AA Agentic Index 说明",
      href: "https://artificialanalysis.ai/models/capabilities/agentic/",
      rows: [
        { category: "GDPval-AA v2", weight: "50%", description: "44 个职业的真实知识工作", emphasis: true },
        { category: "τ³-Banking", weight: "50%", description: "知识检索与多步工具调用", emphasis: true },
        { category: "能力焦点", weight: "Agent", description: "工具使用、规划与自主执行" },
        { category: "指数尺度", weight: "AA 同尺度", description: "两项得分等权平均" },
      ],
      summary: "职业任务与银行工具任务各占 50%。",
    },
    rows: [
      ["Claude Opus 5 · max", "Anthropic", "55"],
      ["Claude Opus 5 · xhigh", "Anthropic", "55"],
      ["GPT-5.6 Sol · max", "OpenAI", "54"],
      ["Claude Fable 5 · max + fallback", "Anthropic", "53"],
      ["GPT-5.6 Sol · xhigh", "OpenAI", "52"],
      ["Claude Opus 5 · high", "Anthropic", "52"],
      ["Kimi K3 · max", "Moonshot", "51"],
      ["Grok 4.5 · high", "xAI", "50"],
      ["GPT-5.5 · xhigh", "OpenAI", "49"],
      ["GLM-5.2 · max", "Z.ai", "48"],
    ].map(([model, lab, value]) => ({ model, lab, value })),
  },
  {
    eyebrow: "KNOWLEDGE WORK",
    name: "AA-Briefcase",
    snapshot: "2026-07-31 · Elo leaderboard",
    direction: "综合 Elo ↑",
    note: "0731 正式版尚无 AA-Briefcase 同名配置成绩。",
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
    rows: [
      ["Claude Opus 5 · max", "Anthropic", "1721"],
      ["Claude Opus 5 · xhigh", "Anthropic", "1693"],
      ["Claude Opus 5 · high", "Anthropic", "1606"],
      ["Claude Fable 5 · max + fallback", "Anthropic", "1574"],
      ["Kimi K3", "Moonshot", "1540"],
      ["GPT-5.6 Sol · max", "OpenAI", "1504"],
      ["Claude Opus 5 · medium", "Anthropic", "1470"],
      ["Claude Sonnet 5 · max", "Anthropic", "1386"],
      ["Claude Opus 4.8 · max", "Anthropic", "1345"],
      ["Grok 4.5 · high", "xAI", "1317"],
    ].map(([model, lab, value]) => ({ model, lab, value })),
  },
];

const SOURCES = [
  ["火山方舟模型与价格", "https://docs.volcengine.com/docs/82379/1544106?lang=zh#457edfd0"],
  ["Claude 最新模型与价格", "https://platform.claude.com/docs/en/about-claude/models/overview"],
  ["OpenAI 模型与价格", "https://developers.openai.com/api/docs/models/compare"],
  ["OpenAI GPT-5.6 官方发布", "https://openai.com/index/gpt-5-6/"],
  ["OpenAI 图像 / 视频价格", "https://developers.openai.com/api/docs/pricing"],
  ["阿里云百炼价格", "https://help.aliyun.com/zh/model-studio/model-pricing"],
  ["Qwen3.8-Max 模型与价格", "https://www.qianwenai.com/models/qwen3.8-max"],
  ["Qwen3.8-Max 官方发布", "https://qwen.ai/blog?id=qwen3.8"],
  ["阿里云视频 / 图像模型", "https://help.aliyun.com/zh/model-studio/image-model"],
  ["Kimi K3 价格", "https://www.kimi.com/zh-cn/resources/kimi-k3-pricing"],
  ["Kimi K3 官方模型卡", "https://huggingface.co/moonshotai/Kimi-K3/blob/main/README.md"],
  ["智谱开放平台价格", "https://bigmodel.cn/pricing"],
  ["GLM-5.2 官方模型卡", "https://huggingface.co/zai-org/GLM-5.2"],
  ["DeepSeek 中国区价格", "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/"],
  ["DeepSeek V4 Flash 0731 官方更新", "https://api-docs.deepseek.com/zh-cn/updates/"],
  ["MiniMax 中国区价格", "https://platform.minimaxi.com/docs/guides/pricing-paygo"],
  ["MiniMax M3 官方发布", "https://www.minimax.io/blog/minimax-m3"],
  ["LLM Stats 单项测评", "https://llm-stats.com/benchmarks"],
  ["LMArena Leaderboard", "https://arena.ai/leaderboard"],
  ["Artificial Analysis Models", "https://artificialanalysis.ai/models"],
  ["AA Coding Agents", "https://artificialanalysis.ai/agents/coding-agents"],
  ["AA Agentic Index", "https://artificialanalysis.ai/models/capabilities/agentic/"],
  ["AA-Briefcase", "https://artificialanalysis.ai/evaluations/aa-briefcase"],
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
        {board.rows.slice(0, 10).map((row, index) => (
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
  const orderedModels = useMemo(
    () =>
      [...TEXT_MODELS].sort((a, b) => {
        const aScore = a.metrics[benchmark].score;
        const bScore = b.metrics[benchmark].score;
        if (aScore === null && bScore === null) return 0;
        if (aScore === null) return 1;
        if (bScore === null) return -1;
        return bScore - aScore;
      }),
    [benchmark],
  );

  return (
    <div className="llm-trends" id="llm-trends">
      <section className="trends-hero">
        <div className="trends-hero-copy">
          <div className="trends-kicker"><span className="trends-live-dot" />MARKET SNAPSHOT · 2026.08.04</div>
          <h1>LLM<br />趋势</h1>
          <p>主力模型、Agent Benchmark 与第三方榜单。</p>
          <div className="trends-hero-actions">
            <a className="trends-primary-action" href="#model-landscape">模型对比</a>
            <a className="trends-secondary-action" href="#leaderboards">第三方测评</a>
          </div>
        </div>
        <aside className="trends-radar" aria-label="趋势栏目数据口径">
          <div className="trends-radar-head"><span>RESEARCH LENS</span><strong>官方优先</strong></div>
          <div className="trends-radar-orbit"><span className="trends-radar-ring trends-radar-ring-one" /><span className="trends-radar-ring trends-radar-ring-two" /><span className="trends-radar-ring trends-radar-ring-three" /><strong>03</strong><small>模型赛道</small></div>
          <dl className="trends-radar-stats"><div><dt>07</dt><dd>指定友商</dd></div><div><dt>09</dt><dd>单项基准</dd></div><div><dt>10</dt><dd>Top 10 榜单</dd></div></dl>
          <p>官方与第三方来源独立标注；未披露项不推算。</p>
        </aside>
      </section>

      <nav className="trends-section-nav" aria-label="LLM 趋势页面目录">
        <a href="#model-landscape">模型对比</a><a href="#benchmark-lens">单项测评</a><a href="#leaderboards">第三方测评</a><a href="#trend-sources">来源</a>
      </nav>

      <section className="trends-section trends-track-section" id="model-landscape">
        <div className="trends-section-heading"><div><p>MODEL LANDSCAPE</p><h2>模型分类</h2></div><span>Seed、Seedance、Seedream 及同代竞品。</span></div>
        <div className="trend-track-grid">
          {MODEL_TRACKS.map((track, index) => (
            <article className={`trend-track-card is-${track.id}${expandedTrack === track.id ? " is-expanded" : ""}`} key={track.id}>
              <div className="trend-track-index">0{index + 1}</div>
              <span>{track.eyebrow}</span><h3>{track.label}</h3>
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
              <div><span>MODEL SET · {String(activeTrack.models.length).padStart(2, "0")}</span><h3>{activeTrack.label}对比</h3></div>
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
        <div className="trends-section-heading"><div><p>BENCHMARK LENS</p><h2>单项测评</h2></div><span>完整列出目标模型；缺失值保留核验来源。</span></div>
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
          <aside className="trends-focus-brief"><span>{benchmarkMeta.short}</span><h3>{benchmarkMeta.label}</h3><p>{benchmarkMeta.lens}</p><ul><li>版本 / 任务集</li><li>推理档位 / Agent harness</li><li>成本 / 方差</li></ul></aside>
          <div className="trends-scoreboard">
            <div className={`trends-score-row is-reference${referenceMetric.score === null ? " is-na" : ""}`}>
              <span className="trends-score-rank">REF</span>
              <div>
                <strong>{OPUS_46_REFERENCE.model}<em>标准对照</em></strong>
                <small><a href={referenceMetric.href} target="_blank" rel="noreferrer">{referenceMetric.source} ↗</a></small>
              </div>
              <div className="trends-score-track"><span style={{ width: `${Math.min(referenceMetric.score ?? 0, 100)}%` }} /></div>
              <strong>{referenceMetric.value}</strong>
            </div>
            {orderedModels.map((item, index) => {
              const metric = item.metrics[benchmark];
              return (
                <div className={`trends-score-row${metric.score === null ? " is-na" : ""}`} key={item.model}>
                  <span className="trends-score-rank">{metric.score === null ? "—" : String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{item.model}</strong>
                    <small><a href={metric.href} target="_blank" rel="noreferrer">{metric.source} ↗</a></small>
                  </div>
                  <div className="trends-score-track"><span style={{ width: `${Math.min(metric.score ?? 0, 100)}%` }} /></div>
                  <strong>{metric.value}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="trends-section trends-leaderboard-section" id="leaderboards">
        <div className="trends-section-heading trends-section-heading-light"><div><p>INDEPENDENT SIGNALS</p><h2>第三方测评</h2></div><span>Artificial Analysis 4 项；LMArena 6 项；各取 Top 10。</span></div>
        <div className="trend-provider-switch" role="group" aria-label="选择排行榜平台">
          <button
            aria-pressed={leaderboardProvider === "aa"}
            className={leaderboardProvider === "aa" ? "is-active" : ""}
            onClick={() => setLeaderboardProvider("aa")}
            type="button"
          >
            <span>01</span>
            <div><small>INDEPENDENT BENCHMARKS</small><strong>Artificial Analysis</strong></div>
          </button>
          <button
            aria-pressed={leaderboardProvider === "arena"}
            className={leaderboardProvider === "arena" ? "is-active" : ""}
            onClick={() => setLeaderboardProvider("arena")}
            type="button"
          >
            <span>02</span>
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
        <p className="trends-leaderboard-note">快照数据；preliminary、reasoning effort 与置信区间按原榜口径保留。</p>
      </section>

      <section className="trends-section trends-sources-section" id="trend-sources">
        <div className="trends-section-heading"><div><p>SOURCE LEDGER</p><h2>数据来源</h2></div><span>厂商官网优先；缺失项使用独立榜单。</span></div>
        <div className="trends-source-grid trend-source-grid-compact">{SOURCES.map(([label, href]) => <article key={href}><a href={href} target="_blank" rel="noreferrer"><span>{label}</span><b>↗</b></a></article>)}</div>
        <div className="trends-method-note"><strong>范围</strong><p>截至 2026-08-04 可核验的正式模型；静态快照，不自动抓榜或调用 API。</p></div>
      </section>
    </div>
  );
}
