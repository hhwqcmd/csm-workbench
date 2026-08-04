export type AiCodingRankItem = {
  name: string;
  value: number;
  display: string;
};

export type AiCodingRankingMetric = {
  kind: "ranking";
  id: string;
  label: string;
  unit: "lines" | "percent" | "tokens";
  rankings: AiCodingRankItem[];
  formula: string;
  interpretation: string;
};

export type AiCodingScalarMetric = {
  kind: "scalar";
  id: string;
  label: string;
  value: number;
  display: string;
  delta: string;
  direction: "down";
  unit: "hours";
  formula: string;
  interpretation: string;
};

export type AiCodingMetric =
  | AiCodingRankingMetric
  | AiCodingScalarMetric;

export const AI_CODING_ORGANIZATION = {
  id: "org_nebula_retail",
  name: "星河零售集团（模拟）",
  period: "2026-07-01 — 2026-07-31",
  developers: 420,
  repositories: 36,
  projects: 12,
};

export const AI_CODING_METRICS: AiCodingMetric[] = [
  {
    kind: "ranking",
    id: "ai_code_lines_top3",
    label: "AI 代码行数 TOP 3",
    unit: "lines",
    rankings: [
      { name: "交易研发", value: 1286400, display: "128.6 万行" },
      { name: "工程平台", value: 964800, display: "96.5 万行" },
      { name: "数据平台", value: 782300, display: "78.2 万行" },
    ],
    formula:
      "统计期内带 AI 会话溯源且进入 PR 的新增与修改代码行；排除生成目录、锁文件、第三方代码与重复快照，按部门汇总。",
    interpretation: "观察组织使用规模，不单独作为效能或质量结论。",
  },
  {
    kind: "ranking",
    id: "ai_code_merge_rate_top3",
    label: "AI 代码入库率 TOP 3",
    unit: "percent",
    rankings: [
      { name: "工程平台", value: 78.6, display: "78.6%" },
      { name: "交易研发", value: 72.4, display: "72.4%" },
      { name: "数据平台", value: 65.8, display: "65.8%" },
    ],
    formula:
      "合并至受保护主干的 AI 辅助代码行 / 提交到 PR 的 AI 辅助代码行，按部门计算。",
    interpretation: "观察生成结果进入主干的比例，并结合审查与缺陷数据判断。",
  },
  {
    kind: "ranking",
    id: "skill_usage_rate_top3",
    label: "Skill 使用率 TOP 3",
    unit: "percent",
    rankings: [
      { name: "代码审查", value: 68.2, display: "68.2%" },
      { name: "接口契约变更", value: 54.7, display: "54.7%" },
      { name: "数据库迁移", value: 41.3, display: "41.3%" },
    ],
    formula:
      "调用指定 Skill 的有效 AI 任务 / 该 Skill 适用任务，按 Skill 汇总。",
    interpretation: "识别已形成稳定工作流的高复用能力，而非只统计安装量。",
  },
  {
    kind: "ranking",
    id: "mcp_usage_rate_top3",
    label: "MCP 使用率 TOP 3",
    unit: "percent",
    rankings: [
      { name: "代码仓库只读", value: 61.8, display: "61.8%" },
      { name: "CI 状态查询", value: 47.3, display: "47.3%" },
      { name: "日志检索", value: 39.6, display: "39.6%" },
    ],
    formula:
      "至少成功调用一次对应 MCP 的有效 AI 任务 / 允许使用该 MCP 的 AI 任务，按 MCP 汇总。",
    interpretation: "观察外部上下文接入深度，同时持续审计权限范围与失败率。",
  },
  {
    kind: "ranking",
    id: "token_consumption_top3",
    label: "Token 消耗量 TOP 3",
    unit: "tokens",
    rankings: [
      { name: "交易研发", value: 128400000, display: "1.28 亿" },
      { name: "数据平台", value: 96700000, display: "0.97 亿" },
      { name: "工程平台", value: 82100000, display: "0.82 亿" },
    ],
    formula:
      "统计期内模型输入 Token + 输出 Token，按任务归属部门汇总；缓存命中按实际计量口径计入。",
    interpretation: "用于容量与成本治理，需与有效任务数和交付结果联合解读。",
  },
  {
    kind: "scalar",
    id: "requirement_lead_time_p50",
    label: "需求交付周期 P50",
    value: 46,
    display: "46.0h",
    delta: "-31%",
    direction: "down",
    unit: "hours",
    formula: "需求进入规格澄清到通过全部门禁并合并的中位时长。",
    interpretation: "覆盖完整研发链路，并与返工和逃逸缺陷同时观察。",
  },
];

export const AI_CODING_TREND = [
  { week: "07/07", mergeRate: 61, skill: 38, mcp: 24 },
  { week: "07/14", mergeRate: 65, skill: 43, mcp: 29 },
  { week: "07/21", mergeRate: 69, skill: 49, mcp: 34 },
  { week: "07/28", mergeRate: 72, skill: 55, mcp: 40 },
];

export function buildAiCodingMetricsResponse() {
  return {
    object: "ai_coding_metrics_snapshot",
    data_mode: "simulation",
    request_id: "req_sim_20260803_001",
    generated_at: "2026-08-03T10:00:00+08:00",
    organization: AI_CODING_ORGANIZATION,
    filters: {
      period: "30d",
      scope: "organization",
    },
    metrics: AI_CODING_METRICS.map((item) =>
      item.kind === "ranking"
        ? {
            id: item.id,
            unit: item.unit,
            ranking: item.rankings,
          }
        : {
            id: item.id,
            value: item.value,
            unit: item.unit,
            delta: item.delta,
          },
    ),
    trend: AI_CODING_TREND,
    quality: {
      merged_ai_code_lines: 2413500,
      reviewed_ai_pull_requests: 816,
      escaped_defects: 4,
      unresolved_critical: 0,
      human_approval_rate: 100,
      auto_merge_rate: 0,
    },
  };
}
