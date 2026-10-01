import type { ApiPath, SeedanceRatio } from "./seedance-config";
import type { SeedanceContentItem } from "./seedance-examples";

export const SEEDANCE_PRICING_SOURCE = {
  checkedAt: "2026-08-04",
  label: "火山方舟模型价格页的 720p、16:9、输入不含视频估算口径",
  url: "https://www.volcengine.com/docs/82379/1544106",
} as const;

const OUTPUT_SECOND_RMB: Readonly<Record<string, number>> = {
  "doubao-seedance-2-5-260628": 1.51,
  "doubao-seedance-2-0-260128": 0.99,
  "doubao-seedance-2-0-fast-260128": 0.8,
  "doubao-seedance-2-0-mini-260615": 0.5,
};

export type SeedanceCostEstimate =
  | {
      kind: "agent-plan";
      label: string;
      disclaimer: string;
    }
  | {
      kind: "estimated";
      minRmb: number;
      maxRmb: number;
      perSecondRmb: number;
      label: string;
      disclaimer: string;
    }
  | {
      kind: "unavailable";
      label: string;
      disclaimer: string;
    };

export function estimateSeedanceBatchCost(input: {
  apiPath: ApiPath;
  model: string;
  ratio: SeedanceRatio;
  resolution?: string;
  duration: number;
  minimumDuration: number;
  maximumDuration: number;
  taskCount: number;
  content: readonly SeedanceContentItem[];
}): SeedanceCostEstimate {
  if (input.apiPath === "agent-plan") {
    return {
      kind: "agent-plan",
      label: "Agent Plan：本批次会按实际调用消耗 AFP，不换算人民币。",
      disclaimer: "AFP 消耗以套餐侧最终记录为准。",
    };
  }

  const perSecondRmb = OUTPUT_SECOND_RMB[input.model];
  const hasReferenceVideo = input.content.some(
    (item) => item.type === "video_url",
  );
  if (
    perSecondRmb === undefined ||
    input.resolution !== "720p" ||
    input.ratio !== "16:9" ||
    hasReferenceVideo
  ) {
    return {
      kind: "unavailable",
      label: "无法按当前公开口径准确估价。",
      disclaimer:
        "仅标准 API、已核验的四个 Seedance 2.x 型号、720p、16:9 且输入不含参考视频时展示人民币参考金额。",
    };
  }

  const minSeconds =
    input.duration === -1 ? input.minimumDuration : input.duration;
  const maxSeconds =
    input.duration === -1 ? input.maximumDuration : input.duration;
  const minRmb = roundCurrency(input.taskCount * minSeconds * perSecondRmb);
  const maxRmb = roundCurrency(input.taskCount * maxSeconds * perSecondRmb);
  return {
    kind: "estimated",
    minRmb,
    maxRmb,
    perSecondRmb,
    label:
      minRmb === maxRmb
        ? `参考估算 ¥${minRmb.toFixed(2)}`
        : `参考估算 ¥${minRmb.toFixed(2)}–¥${maxRmb.toFixed(2)}`,
    disclaimer: `参考估算，不是账单；价格来源口径复核于 ${SEEDANCE_PRICING_SOURCE.checkedAt}。`,
  };
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
