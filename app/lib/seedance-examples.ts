import type {
  SeedanceOutputFormat,
  SeedanceOmniReferenceTaskType,
  SeedanceRatio,
  SeedanceResolution,
} from "./seedance-config";

export type SeedanceMediaType = "image_url" | "video_url" | "audio_url";
export type SeedanceImageRole =
  | "reference_image"
  | "first_frame"
  | "last_frame";

export type SeedanceContentItem =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image_url";
      image_url: { url: string };
      role?: SeedanceImageRole;
    }
  | {
      type: "video_url";
      video_url: { url: string };
      role: "reference_video";
    }
  | {
      type: "audio_url";
      audio_url: { url: string };
      role: "reference_audio";
    };

export type SeedanceRequestBody = {
  model: string;
  content: SeedanceContentItem[];
  generate_audio?: boolean;
  resolution?: SeedanceResolution;
  ratio: SeedanceRatio;
  duration: number;
  output_format?: SeedanceOutputFormat;
  omni_reference_task_type?: SeedanceOmniReferenceTaskType;
  watermark: boolean;
  return_last_frame?: boolean;
  tools?: Array<{ type: "web_search" }>;
};

export type SeedanceSequencePlan = {
  model: string;
  initialImageUrl: string;
  prompts: string[];
  ratio: SeedanceRequestBody["ratio"];
  duration: number;
  watermark: boolean;
};

export type SeedanceExample = {
  id: string;
  title: string;
  summary: string;
  capability: string;
  modelNote: string;
  requestBody: SeedanceRequestBody;
  continuousSequence?: SeedanceSequencePlan;
};

const MINI_MODEL = "doubao-seedance-2-0-mini-260615";
const FULL_MODEL = "doubao-seedance-2-0-260128";
const CONTINUOUS_VIDEO_SEQUENCE: SeedanceSequencePlan = {
  model: FULL_MODEL,
  initialImageUrl:
    "https://ark-project.tos-cn-beijing.volces.com/doc_image/i2v_foxrgirl.png",
  prompts: [
    "女孩抱着狐狸，女孩睁开眼，温柔地看向镜头，狐狸友善地抱着，镜头缓缓拉出，女孩的头发被风吹动",
    "女孩和狐狸在草地上奔跑，阳光明媚，女孩的笑容灿烂，狐狸欢快地跳跃",
    "女孩和狐狸坐在树下休息，女孩轻轻抚摸狐狸的毛发，狐狸温顺地趴在女孩腿上",
  ],
  ratio: "adaptive",
  duration: 5,
  watermark: false,
};

export const SEEDANCE_EXAMPLES: SeedanceExample[] = [
  {
    id: "edit-product",
    title: "官方示例任务一：把香水替换成面霜",
    summary: "使用一张参考图替换原视频中的商品主体，同时保持原运镜。",
    capability: "1 张图片 + 1 段视频 · 16:9 · 5 秒",
    modelNote: "优先使用 Seedance 2.0 Mini",
    requestBody: {
      model: MINI_MODEL,
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
      generate_audio: true,
      ratio: "16:9",
      duration: 5,
      watermark: true,
    },
  },
  {
    id: "multimodal-reference",
    title: "官方示例任务二：多模态参考",
    summary: "组合两张图片、一段视频和一段音频，生成统一的果茶广告。",
    capability: "2 图 + 1 视频 + 1 音频 · 16:9 · 11 秒",
    modelNote: "Mini 支持多模态生视频",
    requestBody: {
      model: MINI_MODEL,
      content: [
        {
          type: "text",
          text: "全程使用视频1的第一视角构图，全程使用音频1作为背景音乐。第一人称视角果茶宣传广告，seedance牌「苹苹安安」苹果果茶限定款；首帧为图片1，你的手摘下一颗带晨露的阿克苏红苹果，轻脆的苹果碰撞声；2-4 秒：快速切镜，你的手将苹果块投入雪克杯，加入冰块与茶底，用力摇晃，冰块碰撞声与摇晃声卡点轻快鼓点，背景音：「鲜切现摇」；4-6 秒：第一人称成品特写，分层果茶倒入透明杯，你的手轻挤奶盖在顶部铺展，在杯身贴上粉红包标，镜头拉近看奶盖与果茶的分层纹理；6-8 秒：第一人称手持举杯，你将图片2中的果茶举到镜头前（模拟递到观众面前的视角），杯身标签清晰可见，背景音「来一口鲜爽」，尾帧定格为图片2。背景声音统一为女生音色。",
        },
        {
          type: "image_url",
          image_url: {
            url: "https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_tea_pic1.jpg",
          },
          role: "reference_image",
        },
        {
          type: "image_url",
          image_url: {
            url: "https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_tea_pic2.jpg",
          },
          role: "reference_image",
        },
        {
          type: "video_url",
          video_url: {
            url: "https://ark-project.tos-cn-beijing.volces.com/doc_video/r2v_tea_video1.mp4",
          },
          role: "reference_video",
        },
        {
          type: "audio_url",
          audio_url: {
            url: "https://ark-project.tos-cn-beijing.volces.com/doc_audio/r2v_tea_audio1.mp3",
          },
          role: "reference_audio",
        },
      ],
      generate_audio: true,
      ratio: "16:9",
      duration: 11,
      watermark: true,
    },
  },
  {
    id: "extend-video",
    title: "官方示例任务三：延长视频",
    summary: "串联三段参考视频，由模型补全片段之间的连续过渡。",
    capability: "3 段视频 · 16:9 · 8 秒",
    modelNote: "Mini 支持延长视频",
    requestBody: {
      model: MINI_MODEL,
      content: [
        {
          type: "text",
          text: "视频1中的拱形窗户打开，进入美术馆室内，接视频2，之后镜头进入画内，接视频3",
        },
        {
          type: "video_url",
          video_url: {
            url: "https://ark-project.tos-cn-beijing.volces.com/doc_video/r2v_extend_video1.mp4",
          },
          role: "reference_video",
        },
        {
          type: "video_url",
          video_url: {
            url: "https://ark-project.tos-cn-beijing.volces.com/doc_video/r2v_extend_video2.mp4",
          },
          role: "reference_video",
        },
        {
          type: "video_url",
          video_url: {
            url: "https://ark-project.tos-cn-beijing.volces.com/doc_video/r2v_extend_video3.mp4",
          },
          role: "reference_video",
        },
      ],
      generate_audio: true,
      ratio: "16:9",
      duration: 8,
      watermark: true,
    },
  },
  {
    id: "output-4k",
    title: "官方示例任务四：输出 4k 视频",
    summary: "以越野摩托参考图生成 15 秒广告短片，并输出 4K 10bit 视频。",
    capability: "1 张图片 · adaptive · 15 秒 · 4K",
    modelNote: "4K 仅 Seedance 2.0 完整模型支持",
    requestBody: {
      model: FULL_MODEL,
      content: [
        {
          type: "text",
          text: "生成一段15秒的越野摩托竞技广告感短片。参考图片作为中段飞跃高潮的参考。镜头逻辑依次为：1）中景跟拍，车手从远处沿土坡高速逼近跳台；2）超近低机位后轮飞砂特写，轮胎抓地甩出大量泥土和砂石；3）中近景展示骑手控车、手部发力、悬挂压缩与机械震动；4）侧向英雄中景拍车手冲坡腾空飞跃，画面状态接近图一，泥土在逆光中大面积飞散；5）腾空近景帅气细节，突出头盔护目镜、手部控把、轮胎悬空或车身侧面局部；6）中景跟拍落地，悬挂压缩回弹，随后继续沿土坡赛道高速冲刺收尾。全片同一名骑手、同一辆车、同一条赛道，镜头景别和角度区分清楚，不重复，动作连贯,画面有真实越野跟拍抖动感、速度感、扬土感和夕阳逆光竞技氛围。",
        },
        {
          type: "image_url",
          image_url: {
            url: "https://ark-project.tos-cn-beijing.volces.com/doc_image/i2v_4k.png",
          },
          role: "reference_image",
        },
      ],
      generate_audio: true,
      resolution: "4k",
      ratio: "adaptive",
      duration: 15,
      watermark: true,
    },
  },
  {
    id: "web-search",
    title: "官方示例任务五：使用联网搜索",
    summary: "以纯文本输入调用 web_search，让模型补充玻璃蛙的真实外观特征。",
    capability: "纯文本 + web_search · 16:9 · 11 秒",
    modelNote: "Mini 已通过官方 API 实测",
    requestBody: {
      model: MINI_MODEL,
      content: [
        {
          type: "text",
          text: "微距镜头对准叶片上翠绿的玻璃蛙。焦点逐渐从它光滑的皮肤，转移到它完全透明的腹部，一颗鲜红的心脏正在有力地、规律地收缩扩张。",
        },
      ],
      ratio: "16:9",
      duration: 11,
      watermark: false,
      tools: [{ type: "web_search" }],
    },
  },
  {
    id: "preset-avatar",
    title: "官方示例任务六：使用预置虚拟人像",
    summary: "组合虚拟人像库的预置人物和产品参考图，生成写实美妆口播视频。",
    capability: "1 个预置人像 + 1 张产品图 · adaptive · 11 秒",
    modelNote: "Mini 已通过官方 API 实测",
    requestBody: {
      model: MINI_MODEL,
      content: [
        {
          type: "text",
          text: "固定机位，近景镜头，清新自然风格。在室内自然光下，图片1中美妆博主面带笑容，向镜头介绍图片2中的面霜。博主将手里的面霜展示给镜头，开心地说“挖到本命面霜了！”；接着她一边用手指轻轻蘸取面霜展示那种软糯感，一边说“质地像云朵一样软糯，一抹就吸收”；最后她把面霜涂抹在脸颊上，展示着水润透亮的皮肤，同时自信地说“熬夜急救、补水保湿全搞定”。要求画面中人物居中，完整展示人物的整个脑袋和上半身，始终对焦人脸，人脸始终清晰，纯净无任何字幕。",
        },
        {
          type: "image_url",
          image_url: {
            url: "asset://asset-20260401123823-6d4x2",
          },
          role: "reference_image",
        },
        {
          type: "image_url",
          image_url: {
            url: "https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_edit_pic1.jpg",
          },
          role: "reference_image",
        },
      ],
      generate_audio: true,
      ratio: "adaptive",
      duration: 11,
      watermark: true,
    },
  },
  {
    id: "first-last-frame-audio",
    title: "官方示例任务七：图生视频-基于首尾帧（含音频）",
    summary: "指定女孩画面的首帧和尾帧，生成带有自然过渡和音频的视频。",
    capability: "首帧 + 尾帧 · adaptive · 5 秒 · 有声",
    modelNote: "完整模型；教程原图可能触发真人隐私审核",
    requestBody: {
      model: FULL_MODEL,
      content: [
        {
          type: "text",
          text: "图中女孩对着镜头说“茄子”，360度环绕运镜",
        },
        {
          type: "image_url",
          image_url: {
            url: "https://ark-project.tos-cn-beijing.volces.com/doc_image/seepro_first_frame.jpeg",
          },
          role: "first_frame",
        },
        {
          type: "image_url",
          image_url: {
            url: "https://ark-project.tos-cn-beijing.volces.com/doc_image/seepro_last_frame.jpeg",
          },
          role: "last_frame",
        },
      ],
      generate_audio: true,
      ratio: "adaptive",
      duration: 5,
      watermark: true,
    },
  },
  {
    id: "continuous-video-chain",
    title: "官方示例任务八：生成多个连续视频",
    summary: "把上一段视频返回的尾帧作为下一段首帧，严格串行生成三段连续内容。",
    capability: "3 段串行 · 每段 5 秒 · 返回尾帧",
    modelNote: "完整模型；三段真实任务已验证成功",
    requestBody: {
      model: FULL_MODEL,
      content: [
        {
          type: "text",
          text: CONTINUOUS_VIDEO_SEQUENCE.prompts[0],
        },
        {
          type: "image_url",
          image_url: {
            url: CONTINUOUS_VIDEO_SEQUENCE.initialImageUrl,
          },
        },
      ],
      ratio: "adaptive",
      duration: 5,
      watermark: false,
      return_last_frame: true,
    },
    continuousSequence: CONTINUOUS_VIDEO_SEQUENCE,
  },
];

export const DEFAULT_REQUEST_BODY = SEEDANCE_EXAMPLES[0].requestBody;
