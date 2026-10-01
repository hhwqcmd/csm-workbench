// Shared contract for the "鹈鹕测试" (Pelican Test) module.
// Imported by BOTH the browser panel and the server route, so this file must
// stay free of "server-only" and of any Node/Workers-only APIs.

// Community-standard prompt, verbatim. Do not translate or reformat.
export const PELICAN_PROMPT = "Generate an SVG of a pelican riding a bicycle";

// Default upstream base URL, prefilled in the panel's manual Base URL field.
// The dedicated /api/pelican/responses proxy re-validates whatever is sent.
export const PELICAN_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

// Generation and judging both go through the same-origin dedicated proxy
// /api/pelican/responses (manual Base URL, create-only).
// Reasoning models bill chain-of-thought tokens against max_output_tokens, so
// both budgets keep headroom for thinking plus the complete visible answer.
// The judge used to be 2048, which a reasoning judge (e.g. Kimi K3) can exhaust
// on thinking before emitting the scoring JSON; raised to avoid that truncation.
export const PELICAN_GENERATION_MAX_TOKENS = 32768;
export const PELICAN_JUDGE_MAX_TOKENS = 16384;

// Local-only storage slots (browser). Shared credential slot mirrors the one
// used by ResponsesWorkbench so a remembered key is reused across modules.
export const PELICAN_HISTORY_KEY = "llm-trends:pelican-history:v1";
export const PELICAN_CREDENTIAL_KEY = "seedance-workbench:demo-credentials:v1";
export const PELICAN_MAX_HISTORY = 30;

// Two judge modes share one json_schema so scores stay structurally comparable;
// only the svgValidity criterion differs (rendered pixels vs. source code).
export type JudgeMode = "vision" | "source";

export const PELICAN_DIMENSIONS = [
  "species",
  "bicycle",
  "posture",
  "interaction",
  "svgValidity",
] as const;

export type PelicanDimension = (typeof PELICAN_DIMENSIONS)[number];

export type PelicanScores = Record<PelicanDimension, number>;

export const PELICAN_DIMENSION_LABELS: Record<PelicanDimension, string> = {
  species: "物种特征",
  bicycle: "车架结构",
  posture: "骑乘姿态",
  interaction: "肢体交互",
  svgValidity: "SVG 有效性",
};

export const PELICAN_DIMENSION_HINTS: Record<PelicanDimension, string> = {
  species: "长喙、喉囊、体型是否可辨识为鹈鹕",
  bicycle: "双轮、车架、车把、车座、踏板是否齐备且连接合理",
  posture: "是否呈现坐在车上、准备踩踏的姿态",
  interaction: "翅膀/腿与车把、踏板之间的接触是否合理",
  svgValidity: "视觉模式看渲染画面，源码模式看代码结构",
};

// text.format value assigned directly on the judge request body.
export const PELICAN_JUDGE_SCHEMA: Record<string, unknown> = {
  type: "json_schema",
  name: "pelican_judgement",
  description: "Structured judgement for a pelican-riding-a-bicycle SVG.",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["dimensions", "overall", "comments"],
    properties: {
      dimensions: {
        type: "object",
        additionalProperties: false,
        required: [
          "species",
          "bicycle",
          "posture",
          "interaction",
          "svgValidity",
        ],
        properties: {
          species: {
            type: "number",
            description: "物种特征：长喙、喉囊、体型是否像鹈鹕（0-10）",
          },
          bicycle: {
            type: "number",
            description:
              "车架结构：双轮、车架、车把、车座、踏板是否齐备且连接合理（0-10）",
          },
          posture: {
            type: "number",
            description: "骑乘姿态：是否呈现坐在车上、准备踩踏的姿态（0-10）",
          },
          interaction: {
            type: "number",
            description:
              "肢体交互：翅膀/腿与车把、踏板之间的接触是否合理（0-10）",
          },
          svgValidity: {
            type: "number",
            description:
              "SVG 有效性：视觉模式看画面是否正常渲染无破损；源码模式看代码结构是否良好可渲染（0-10）",
          },
        },
      },
      overall: {
        type: "number",
        description: "五维算术均值总分（0-10）",
      },
      comments: {
        type: "string",
        description: "简要中文点评，指出主要优点与缺陷",
      },
    },
  },
};

export type PelicanRenderMeta = {
  ok: boolean;
  width?: number;
  height?: number;
  bytes?: number;
  error?: string;
};

export type PelicanUsage = {
  inputTokens?: number;
  outputTokens?: number;
};

export type PelicanRun = {
  id: string;
  createdAt: string;
  model: string;
  judgeModel: string;
  judgeMode: JudgeMode;
  svg: string;
  scores: PelicanScores;
  overall: number;
  comments: string;
  renderMeta?: PelicanRenderMeta;
  usage?: PelicanUsage;
  tosObjectKey?: string;
};

export type PelicanJudgement = {
  scores: PelicanScores;
  overall: number;
  comments: string;
};

// Strip markdown fences and isolate the first <svg>…</svg> block.
// Returns "" when no SVG can be extracted.
export function normalizeSvg(raw: string): string {
  if (typeof raw !== "string") return "";
  let text = raw.trim();
  const fence = text.match(/```[a-zA-Z0-9_-]*\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("<svg");
  if (start === -1) return "";
  const end = text.lastIndexOf("</svg>");
  if (end !== -1 && end > start) {
    return text.slice(start, end + "</svg>".length).trim();
  }
  return "";
}

// Shared incomplete/length detector. Reasoning models can spend the whole
// max_output_tokens budget on chain-of-thought and stop before the visible
// answer completes; both the generation and the judge step surface this.
// Returns the token diagnostic suffix (possibly ""), or null when the response
// does not look truncated.
function lengthTruncationDetail(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  if (record.status !== "incomplete") return null;
  const details = record.incomplete_details;
  const reason =
    typeof details === "object" && details !== null
      ? (details as Record<string, unknown>).reason
      : undefined;
  if (reason !== "length") return null;
  const usage =
    typeof record.usage === "object" && record.usage !== null
      ? (record.usage as Record<string, unknown>)
      : undefined;
  const tokens: string[] = [];
  if (typeof usage?.output_tokens === "number") {
    tokens.push(`output_tokens=${usage.output_tokens}`);
  }
  const outputDetails = usage?.output_tokens_details;
  const reasoning =
    typeof outputDetails === "object" && outputDetails !== null
      ? (outputDetails as Record<string, unknown>).reasoning_tokens
      : undefined;
  if (typeof reasoning === "number") tokens.push(`reasoning=${reasoning}`);
  return tokens.length > 0 ? `，${tokens.join("、")}` : "";
}

// Explain a truncated generation: the model stopped mid-SVG (missing </svg>).
// Returns null when the response does not look truncated.
export function describeTruncatedGeneration(body: unknown): string | null {
  const detail = lengthTruncationDetail(body);
  if (detail === null) return null;
  return `模型输出在 max_output_tokens 上限处被截断（incomplete/length${detail}），SVG 缺少 </svg> 闭合；可重试，或改用推理占用更小的生成模型。`;
}

// Explain a truncated judgement: a reasoning judge can exhaust the whole
// max_output_tokens budget on chain-of-thought and never emit the complete
// scoring JSON, which would otherwise surface as a misleading
// “无法解析为评分 JSON”. Returns null when not a length truncation.
export function describeTruncatedJudgement(body: unknown): string | null {
  const detail = lengthTruncationDetail(body);
  if (detail === null) return null;
  return `裁判输出在 max_output_tokens 上限处被截断（incomplete/length${detail}），未吐出完整评分 JSON；可提高裁判 token 上限、改用推理占用更小的裁判模型，或改用源码裁判。`;
}

// Assemble the judge instruction. Source mode embeds the SVG text; vision mode
// declares that the attached image is the browser-local raster of that SVG.
export function buildJudgeText(svg: string, mode: JudgeMode): string {
  const rubric = [
    "你是严格的 SVG 插画评审。请针对『一只鹈鹕骑自行车』这一主题，对给定作品按以下五个维度打分，每维 0-10 分（可保留一位小数）：",
    "1. species 物种特征：长喙、喉囊、体型是否可辨识为鹈鹕。",
    "2. bicycle 车架结构：双轮、车架、车把、车座、踏板是否齐备且连接合理。",
    "3. posture 骑乘姿态：是否呈现坐在车上、准备踩踏的姿态。",
    "4. interaction 肢体交互：翅膀/腿与车把、踏板之间的接触关系是否合理。",
    mode === "vision"
      ? "5. svgValidity SVG 有效性：随附图片是该 SVG 在浏览器本地栅格化后的渲染结果，请据此判断画面是否正常渲染、无破损或缺失。"
      : "5. svgValidity SVG 有效性：请阅读 SVG 源码，判断其代码结构是否良好、能否被正常渲染（标签闭合、坐标合理、无明显语法错误）。",
    "",
    "overall 取五维算术均值（保留一位小数）。comments 用中文简要说明主要优点与缺陷。",
    "严格只输出符合 schema 的 JSON，不要输出任何多余文字或解释。",
  ].join("\n");
  if (mode === "source") {
    return `${rubric}\n\n待评审的 SVG 源码：\n${svg}`;
  }
  return `${rubric}\n\n（该 SVG 的本地栅格化渲染结果已作为图片随本条消息一并附上，请据图片评审。）`;
}

// Vision judge input: one user turn carrying the instruction text plus the PNG
// data URL. Mirrors the multimodal shape used by responses-examples.ts, and the
// data: URL is explicitly allowed by responses-server validateInputUrls.
export function buildVisionJudgeInput(
  svg: string,
  pngDataUrl: string,
): Array<Record<string, unknown>> {
  return [
    {
      role: "user",
      content: [
        { type: "input_text", text: buildJudgeText(svg, "vision") },
        { type: "input_image", image_url: pngDataUrl, detail: "auto" },
      ],
    },
  ];
}

function clampScore(value: number): number {
  return Math.min(10, Math.max(0, Math.round(value * 10) / 10));
}

function toScore(value: unknown): number | null {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(numeric)) return null;
  return clampScore(numeric);
}

export function meanScore(scores: PelicanScores): number {
  const values = PELICAN_DIMENSIONS.map((dimension) => scores[dimension]);
  const total = values.reduce((sum, value) => sum + value, 0);
  return clampScore(total / values.length);
}

// Tolerant parser: prefer the structured output, otherwise strip fences and
// grab the first {…} block. overall is always recomputed from the five
// dimensions so scores stay comparable regardless of what the model returned.
export function parseJudgePayload(text: string): PelicanJudgement | null {
  if (typeof text !== "string" || !text.trim()) return null;
  let candidate = text.trim();
  const fence = candidate.match(/```[a-zA-Z0-9_-]*\s*([\s\S]*?)```/);
  if (fence) candidate = fence[1].trim();

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      parsed = JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;
  const dimensionSource =
    record.dimensions && typeof record.dimensions === "object"
      ? (record.dimensions as Record<string, unknown>)
      : record;

  const scores = {} as PelicanScores;
  for (const dimension of PELICAN_DIMENSIONS) {
    const value = toScore(dimensionSource[dimension]);
    if (value === null) return null;
    scores[dimension] = value;
  }

  const comments =
    typeof record.comments === "string" ? record.comments.slice(0, 5000) : "";
  return { scores, overall: meanScore(scores), comments };
}

// Run id format: pel-{yyyyMMddHHmmss}-{8 hex}. Object key lives under the
// demo/pelican/ prefix so it never collides with the material library.
export function createPelicanRunId(now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const hex = [...bytes]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `pel-${stamp}-${hex}`;
}

export const PELICAN_OBJECT_KEY_PATTERN =
  /^demo\/pelican\/pel-[0-9]{14}-[a-f0-9]{8}\.json$/;

export function pelicanObjectKey(runId: string): string {
  return `demo/pelican/${runId}.json`;
}
