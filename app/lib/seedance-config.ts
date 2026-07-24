export type ApiPath = "official" | "agent-plan";

export const API_PATHS = {
  official: {
    label: "官方 API（标准按量调用）",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    defaultModel: "doubao-seedance-2-0-mini-260615",
    models: [
      {
        value: "doubao-seedance-2-0-260128",
        label: "Seedance 2.0",
      },
      {
        value: "doubao-seedance-2-0-fast-260128",
        label: "Seedance 2.0 Fast",
      },
      {
        value: "doubao-seedance-2-0-mini-260615",
        label: "Seedance 2.0 Mini",
      },
      {
        value: "doubao-seedance-1-5-pro-251215",
        label: "Seedance 1.5 Pro（即将下线）",
      },
      {
        value: "doubao-seedance-1-0-pro-250528",
        label: "Seedance 1.0 Pro",
      },
      {
        value: "doubao-seedance-1-0-pro-fast-251015",
        label: "Seedance 1.0 Pro Fast",
      },
    ],
    keyName: "ARK_API_KEY",
    billing: "使用普通方舟 API Key，按标准 API 规则计费",
  },
  "agent-plan": {
    label: "Agent Plan API（套餐通道）",
    baseUrl: "https://ark.cn-beijing.volces.com/api/plan/v3",
    defaultModel: "doubao-seedance-2.0",
    models: [
      {
        value: "doubao-seedance-2.0",
        label: "Seedance 2.0",
      },
      {
        value: "doubao-seedance-2.0-fast",
        label: "Seedance 2.0 Fast",
      },
      {
        value: "doubao-seedance-2.0-mini",
        label: "Seedance 2.0 Mini",
      },
      {
        value: "doubao-seedance-1.5-pro",
        label: "Seedance 1.5 Pro（即将下线）",
      },
    ],
    keyName: "AGENT_API_KEY",
    billing: "使用 Agent Plan 专属 API Key，消耗套餐 AFP",
  },
} as const;

export const RATIOS = ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"] as const;

export const DEFAULT_TASK = {
  prompt: "将视频1礼盒中的香水替换成图片1中的面霜，运镜不变",
  imageUrl:
    "https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_edit_pic1.jpg",
  videoUrl:
    "https://ark-project.tos-cn-beijing.volces.com/doc_video/r2v_edit_video1.mp4",
  ratio: "16:9",
  duration: 5,
  generateAudio: true,
  watermark: true,
} as const;

export function isApiPath(value: unknown): value is ApiPath {
  return value === "official" || value === "agent-plan";
}

export function isAllowedModel(apiPath: ApiPath, model: string): boolean {
  return API_PATHS[apiPath].models.some((option) => option.value === model);
}
