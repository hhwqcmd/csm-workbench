export type ApiPath = "official" | "agent-plan";

export const RATIOS = [
  "adaptive",
  "21:9",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
] as const;

export type SeedanceRatio = (typeof RATIOS)[number];
export type SeedanceResolution = "480p" | "720p" | "1080p" | "4k";
export type SeedanceOutputFormat = "mp4" | "mov";
export type SeedanceOmniReferenceTaskType =
  | "auto"
  | "reference"
  | "edit"
  | "extend";
export type SeedanceTaskKind =
  | "text"
  | "reference"
  | "edit"
  | "extend"
  | "first-frame"
  | "first-last-frame";

type SeedanceModelCapabilities = {
  duration: {
    min: number;
    max: number;
    allowAuto: boolean;
    defaultValue: number;
  };
  resolutions: readonly SeedanceResolution[];
  outputFormats: readonly SeedanceOutputFormat[];
  mediaLimits: {
    images: number;
    videos: number;
    audios: number;
    total: number;
  };
  allowAudioOnly: boolean;
  isSeedance25: boolean;
};

type ModelOption = {
  value: string;
  label: string;
  capabilities: SeedanceModelCapabilities;
};

const MEDIA_LIMITS_20 = {
  images: 9,
  videos: 3,
  audios: 3,
  total: 15,
} as const;

const MEDIA_LIMITS_25 = {
  images: 30,
  videos: 10,
  audios: 10,
  total: 50,
} as const;

function capabilities(
  overrides: Partial<SeedanceModelCapabilities> &
    Pick<SeedanceModelCapabilities, "resolutions">,
): SeedanceModelCapabilities {
  return {
    duration: { min: 4, max: 15, allowAuto: false, defaultValue: 5 },
    outputFormats: ["mp4"],
    mediaLimits: MEDIA_LIMITS_20,
    allowAudioOnly: false,
    isSeedance25: false,
    ...overrides,
  };
}

const MODEL_CAPABILITIES = {
  seedance25: capabilities({
    duration: { min: 4, max: 30, allowAuto: true, defaultValue: -1 },
    resolutions: ["480p", "720p"],
    outputFormats: ["mp4", "mov"],
    mediaLimits: MEDIA_LIMITS_25,
    allowAudioOnly: true,
    isSeedance25: true,
  }),
  seedance20: capabilities({
    resolutions: ["480p", "720p", "1080p", "4k"],
  }),
  seedance20Lite: capabilities({ resolutions: ["480p", "720p"] }),
  seedance15: capabilities({
    duration: { min: 4, max: 12, allowAuto: false, defaultValue: 5 },
    resolutions: ["480p", "720p", "1080p"],
  }),
  seedance10: capabilities({
    duration: { min: 2, max: 12, allowAuto: false, defaultValue: 5 },
    resolutions: ["480p", "720p", "1080p"],
  }),
} as const;

export const API_PATHS = {
  official: {
    label: "官方 API（标准按量调用）",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    defaultModel: "doubao-seedance-2-0-mini-260615",
    models: [
      {
        value: "doubao-seedance-2-5-260628",
        label: "Seedance 2.5",
        capabilities: MODEL_CAPABILITIES.seedance25,
      },
      {
        value: "doubao-seedance-2-0-260128",
        label: "Seedance 2.0",
        capabilities: MODEL_CAPABILITIES.seedance20,
      },
      {
        value: "doubao-seedance-2-0-fast-260128",
        label: "Seedance 2.0 Fast",
        capabilities: MODEL_CAPABILITIES.seedance20Lite,
      },
      {
        value: "doubao-seedance-2-0-mini-260615",
        label: "Seedance 2.0 Mini",
        capabilities: MODEL_CAPABILITIES.seedance20Lite,
      },
      {
        value: "doubao-seedance-1-5-pro-251215",
        label: "Seedance 1.5 Pro（即将下线）",
        capabilities: MODEL_CAPABILITIES.seedance15,
      },
      {
        value: "doubao-seedance-1-0-pro-250528",
        label: "Seedance 1.0 Pro",
        capabilities: MODEL_CAPABILITIES.seedance10,
      },
      {
        value: "doubao-seedance-1-0-pro-fast-251015",
        label: "Seedance 1.0 Pro Fast",
        capabilities: MODEL_CAPABILITIES.seedance10,
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
        capabilities: MODEL_CAPABILITIES.seedance20,
      },
      {
        value: "doubao-seedance-2.0-fast",
        label: "Seedance 2.0 Fast",
        capabilities: MODEL_CAPABILITIES.seedance20Lite,
      },
      {
        value: "doubao-seedance-2.0-mini",
        label: "Seedance 2.0 Mini",
        capabilities: MODEL_CAPABILITIES.seedance20Lite,
      },
      {
        value: "doubao-seedance-1.5-pro",
        label: "Seedance 1.5 Pro（即将下线）",
        capabilities: MODEL_CAPABILITIES.seedance15,
      },
    ],
    keyName: "AGENT_API_KEY",
    billing: "使用 Agent Plan 专属 API Key，消耗套餐 AFP",
  },
} as const satisfies Record<
  ApiPath,
  {
    label: string;
    baseUrl: string;
    defaultModel: string;
    models: readonly ModelOption[];
    keyName: string;
    billing: string;
  }
>;

export type SeedanceConstraintContentItem = {
  type: string;
  role?: string;
  text?: string;
};

export type SeedanceConstraintInput = {
  apiPath: ApiPath;
  model: string;
  content: SeedanceConstraintContentItem[];
  ratio: string;
  duration: unknown;
  resolution?: unknown;
  outputFormat?: unknown;
  webSearch?: boolean;
  omniReferenceTaskType?: unknown;
};

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

export function getModelCapabilities(
  apiPath: ApiPath,
  model: string,
): SeedanceModelCapabilities | undefined {
  return API_PATHS[apiPath].models.find((option) => option.value === model)
    ?.capabilities;
}

export function isAllowedDuration(
  modelCapabilities: SeedanceModelCapabilities,
  duration: unknown,
): duration is number {
  return (
    typeof duration === "number" &&
    Number.isInteger(duration) &&
    ((modelCapabilities.duration.allowAuto && duration === -1) ||
      (duration >= modelCapabilities.duration.min &&
        duration <= modelCapabilities.duration.max))
  );
}

export function inferSeedanceTaskKind(
  content: SeedanceConstraintContentItem[],
): SeedanceTaskKind {
  const firstFrames = content.filter((item) => item.role === "first_frame").length;
  const lastFrames = content.filter((item) => item.role === "last_frame").length;
  if (firstFrames > 0 || lastFrames > 0) {
    return lastFrames > 0 ? "first-last-frame" : "first-frame";
  }

  const prompt = content
    .filter((item) => item.type === "text")
    .map((item) => item.text ?? "")
    .join("\n");
  if (/(向前|向后)?延长|延续|续写/.test(prompt)) return "extend";
  if (/编辑视频|增加|加上|删除|去掉|修改|替换|改成/.test(prompt)) {
    return "edit";
  }
  return content.some((item) => item.type !== "text") ? "reference" : "text";
}

export function validateSeedanceConstraints(
  input: SeedanceConstraintInput,
): string[] {
  const errors: string[] = [];
  const modelCapabilities = getModelCapabilities(input.apiPath, input.model);
  if (!modelCapabilities) return ["模型与当前 API 路径不匹配。"];

  const textItems = input.content.filter((item) => item.type === "text");
  const imageItems = input.content.filter((item) => item.type === "image_url");
  const videoItems = input.content.filter((item) => item.type === "video_url");
  const audioItems = input.content.filter((item) => item.type === "audio_url");
  const mediaCount = imageItems.length + videoItems.length + audioItems.length;

  if (input.content.length === 0) errors.push("content 必须是非空数组。");
  if (textItems.length > 1) errors.push("content 最多包含一项 text。");
  if (
    textItems.some((item) => typeof item.text !== "string" || !item.text.trim())
  ) {
    errors.push("content.text 不能为空。若不需要提示词，请移除 text 项。");
  }
  if (textItems.length === 0 && mediaCount === 0) {
    errors.push("请求必须包含提示词或至少一项参考素材。");
  }

  const limits = modelCapabilities.mediaLimits;
  if (
    imageItems.length > limits.images ||
    videoItems.length > limits.videos ||
    audioItems.length > limits.audios ||
    mediaCount > limits.total
  ) {
    errors.push(
      `当前模型参考素材上限为 ${limits.images} 张图片、${limits.videos} 段视频、${limits.audios} 段音频，总计不超过 ${limits.total} 项。`,
    );
  }

  if (
    audioItems.length > 0 &&
    imageItems.length === 0 &&
    videoItems.length === 0 &&
    !modelCapabilities.allowAudioOnly
  ) {
    errors.push("当前模型的音频参考必须搭配至少一张图片或一段视频。");
  }

  const firstFrames = imageItems.filter((item) => item.role === "first_frame");
  const lastFrames = imageItems.filter((item) => item.role === "last_frame");
  if (firstFrames.length > 0 || lastFrames.length > 0) {
    const singleFirstFrame =
      firstFrames.length === 1 &&
      lastFrames.length === 0 &&
      imageItems.length === 1 &&
      mediaCount === 1;
    const firstLastFrame =
      firstFrames.length === 1 &&
      lastFrames.length === 1 &&
      imageItems.length === 2 &&
      mediaCount === 2;
    if (!singleFirstFrame && !firstLastFrame) {
      errors.push(
        "首帧模式只能包含一张 first_frame；首尾帧模式必须且只能包含一张 first_frame 和一张 last_frame，且不得混用参考素材。",
      );
    }
  }

  if (!RATIOS.includes(input.ratio as SeedanceRatio)) {
    errors.push("ratio 不在当前支持范围内。");
  }
  if (!isAllowedDuration(modelCapabilities, input.duration)) {
    const automatic = modelCapabilities.duration.allowAuto ? " 或 -1" : "";
    errors.push(
      `当前模型 duration 必须是 ${modelCapabilities.duration.min} 到 ${modelCapabilities.duration.max} 的整数${automatic}。`,
    );
  }
  if (
    input.resolution !== undefined &&
    !modelCapabilities.resolutions.includes(input.resolution as SeedanceResolution)
  ) {
    errors.push(
      `当前模型 resolution 只支持 ${modelCapabilities.resolutions.join("、")}。`,
    );
  }
  const outputFormat = input.outputFormat ?? "mp4";
  if (
    !modelCapabilities.outputFormats.includes(outputFormat as SeedanceOutputFormat)
  ) {
    errors.push(
      `当前模型 output_format 只支持 ${modelCapabilities.outputFormats.join("、")}。`,
    );
  }
  if (input.webSearch && mediaCount > 0) {
    errors.push("联网搜索能力仅适用于纯文本输入。");
  }

  const omniReferenceTaskType = input.omniReferenceTaskType;
  if (omniReferenceTaskType !== undefined) {
    if (
      omniReferenceTaskType !== "auto" &&
      omniReferenceTaskType !== "reference" &&
      omniReferenceTaskType !== "edit" &&
      omniReferenceTaskType !== "extend"
    ) {
      errors.push(
        "omni_reference_task_type 只支持 auto、reference、edit 或 extend。",
      );
    } else if (input.apiPath !== "official" || !modelCapabilities.isSeedance25) {
      errors.push("omni_reference_task_type 仅标准 API 的 Seedance 2.5 支持。");
    }
  }

  if (modelCapabilities.isSeedance25) {
    const taskKind = inferSeedanceTaskKind(input.content);
    const referenceImages = imageItems.filter(
      (item) => item.role === undefined || item.role === "reference_image",
    );
    const hasReferenceInput =
      referenceImages.length > 0 || videoItems.length > 0 || audioItems.length > 0;
    if (
      omniReferenceTaskType !== undefined &&
      (omniReferenceTaskType === "auto" ||
        omniReferenceTaskType === "reference" ||
        omniReferenceTaskType === "edit" ||
        omniReferenceTaskType === "extend") &&
      !hasReferenceInput
    ) {
      errors.push(
        "omni_reference_task_type 仅用于包含 reference 图片、视频或音频的全模态参考任务。",
      );
    }
    if (
      omniReferenceTaskType === "reference" &&
      taskKind !== "reference"
    ) {
      errors.push("任务类型 reference 与当前提示词意图不一致。");
    }
    if (omniReferenceTaskType === "edit" && taskKind !== "edit") {
      errors.push("任务类型 edit 与当前提示词意图不一致。");
    }
    if (omniReferenceTaskType === "extend" && taskKind !== "extend") {
      errors.push("任务类型 extend 与当前提示词意图不一致。");
    }
    if (
      (omniReferenceTaskType === "edit" ||
        omniReferenceTaskType === "extend") &&
      videoItems.length === 0
    ) {
      errors.push(
        `${omniReferenceTaskType} 任务要求至少包含一段 reference_video。`,
      );
    }
    const constrainedTaskKind =
      omniReferenceTaskType === "edit" || omniReferenceTaskType === "extend"
        ? omniReferenceTaskType
        : taskKind;
    if (
      (constrainedTaskKind === "edit" ||
        constrainedTaskKind === "extend" ||
        constrainedTaskKind === "first-frame" ||
        constrainedTaskKind === "first-last-frame") &&
      input.ratio !== "adaptive"
    ) {
      errors.push("Seedance 2.5 的编辑、延长和首帧类任务仅支持 ratio=adaptive。");
    }
    if (constrainedTaskKind === "edit" && input.duration !== -1) {
      errors.push("Seedance 2.5 视频编辑任务仅支持 duration=-1。");
    }
  }

  return errors;
}

export function seedanceTaskKindLabel(kind: SeedanceTaskKind): string {
  return {
    text: "文生视频",
    reference: "参考生视频",
    edit: "视频编辑",
    extend: "视频延长",
    "first-frame": "首帧生视频",
    "first-last-frame": "首尾帧生视频",
  }[kind];
}
