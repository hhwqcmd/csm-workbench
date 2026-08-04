export const SEEDREAM_BASE_URL =
  "https://ark.cn-beijing.volces.com/api/v3";
export const SEEDREAM_DEFAULT_MODEL =
  "doubao-seedream-5-0-pro-260628";
export const SEEDREAM_LITE_MODEL =
  "doubao-seedream-5-0-lite-260128";
export const SEEDREAM_PROMPT_MODEL = "doubao-seed-evolving";

export type SeedreamModel =
  | typeof SEEDREAM_DEFAULT_MODEL
  | typeof SEEDREAM_LITE_MODEL;

export type SeedreamRequestBody = {
  model: SeedreamModel;
  prompt: string;
  image?: string | string[];
  size: string;
  sequential_image_generation?: "auto" | "disabled";
  sequential_image_generation_options?: {
    max_images: number;
  };
  stream?: boolean;
  tools?: Array<{ type: "web_search" }>;
  optimize_prompt_options?: {
    mode: "standard" | "fast";
  };
  output_format: "png" | "jpeg";
  response_format: "url" | "b64_json";
  watermark: boolean;
};

export type SeedreamExample = {
  id: string;
  index: string;
  title: string;
  category: "基础生成" | "组图生成" | "进阶能力";
  summary: string;
  modelNote?: string;
  instructions: string[];
  promptTips: string[];
  requestBody: SeedreamRequestBody;
};

const GENERAL_TIPS = [
  "使用简洁、连贯的自然语言，优先写清主体、行为与环境。",
  "有审美要求时再补充风格、色彩、光影与构图，避免重复堆叠华丽词汇。",
  "有明确用途时写出图片类型和应用场景；需要生成的文字放在双引号中。",
];

const GROUP_MODEL_NOTE =
  "官方能力表标注 Seedream 5.0 Pro 暂不支持组图；本示例自动使用 Seedream 5.0 Lite。";

export const SEEDREAM_EXAMPLES: SeedreamExample[] = [
  {
    id: "text-to-image",
    index: "01",
    title: "文生图",
    category: "基础生成",
    summary: "纯文本输入，生成一张高质量图片。",
    instructions: [
      "填写希望生成的主体、动作、环境和画面风格。",
      "Pro 支持 1K、2K 或符合范围的自定义宽高。",
      "审核右侧完整请求后，确认费用并显式执行。",
    ],
    promptTips: [
      ...GENERAL_TIPS,
      "细节丰富的画面可按空间顺序描述对象，知识图或信息图应写明专业术语、版式与可视化形式。",
    ],
    requestBody: {
      model: SEEDREAM_DEFAULT_MODEL,
      prompt:
        "充满活力的特写编辑肖像，模特眼神犀利，头戴雕塑感帽子，色彩拼接丰富，眼部焦点锐利，景深较浅，具有时尚杂志封面的美学风格，采用中画幅拍摄，工作室灯光效果强烈。",
      size: "2K",
      output_format: "png",
      response_format: "url",
      watermark: false,
    },
  },
  {
    id: "image-edit",
    index: "02",
    title: "图文生图 / 交互编辑",
    category: "基础生成",
    summary: "对单张参考图执行增加、删除、替换、材质或局部修改。",
    instructions: [
      "填写一张可由火山方舟访问的 HTTPS 图片 URL。",
      "明确指出编辑对象、具体变化，以及必须保持不变的内容。",
      "复杂画面可上传带箭头、线框或涂鸦标记的图片来指定区域。",
    ],
    promptTips: [
      ...GENERAL_TIPS,
      "使用简洁明确的编辑指令，避免“它”“那里”等模糊指代。",
      "写清要改什么、怎么改，并补充“保持姿势/构图/其他区域不变”。",
      "带标记图片要说明标记颜色、区域与对应操作，最后要求移除草图或标记线。",
    ],
    requestBody: {
      model: SEEDREAM_DEFAULT_MODEL,
      prompt:
        "保持模特姿势和液态服装的流动形状不变。将服装材质从银色金属改为完全透明的清水或玻璃。透过液态水流可以看到模特的皮肤细节，光影从反射变为折射。",
      image:
        "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_5_imageToimage.png",
      size: "2K",
      output_format: "png",
      response_format: "url",
      watermark: false,
    },
  },
  {
    id: "multi-image-fusion",
    index: "03",
    title: "多图融合",
    category: "基础生成",
    summary: "融合多张参考图的主体、服装、风格或产品特征。",
    instructions: [
      "每行填写一张参考图 URL；Pro 最多支持 10 张参考图。",
      "按“图1、图2……”明确每张图提供什么，以及要执行的替换、组合或迁移操作。",
      "生成单图时保持组图参数关闭。",
    ],
    promptTips: [
      ...GENERAL_TIPS,
      "清楚指明不同图片的职责，例如主体来自图1、服装来自图2、风格参考图3。",
      "替换、组合、迁移等操作要逐项描述，避免只写“融合这些图片”。",
    ],
    requestBody: {
      model: SEEDREAM_DEFAULT_MODEL,
      prompt: "让图1人物穿上图2的服装，保持图1人物姿势、面部特征和背景不变。",
      image: [
        "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imagesToimage_1.png",
        "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_5_imagesToimage_2.png",
      ],
      size: "2K",
      output_format: "png",
      response_format: "url",
      watermark: false,
    },
  },
  {
    id: "text-to-sequence",
    index: "04",
    title: "文生组图",
    category: "组图生成",
    summary: "用一段文字生成角色连贯、风格统一的一组图片。",
    modelNote: GROUP_MODEL_NOTE,
    instructions: [
      "使用“一组”“一套”“系列”或明确数字来表达组图需求。",
      "逐张说明场景、时间、构图与光影，同时强调角色和风格一致。",
      "max_images 控制最多输出张数，输入图数量与输出图数量合计不得超过 15。",
    ],
    promptTips: [
      ...GENERAL_TIPS,
      "明确图片总数和每张图的主题；按“场景1、场景2……”给出顺序。",
      "写出贯穿全组的角色特征、视觉风格和叙事连续性要求。",
    ],
    requestBody: {
      model: SEEDREAM_LITE_MODEL,
      prompt:
        "生成一组电影级科幻写实风的4张影视分镜：场景1，宇航员在空间站维修飞船，中全景，冷色侧逆光；场景2，陨石带突然袭来，广角史诗镜头，紧张灾难氛围；场景3，宇航员失重状态下紧急躲避，近景动态抓拍；场景4，受伤后逃回飞船，舱内暖光与太空冷光形成对比。四张图保持同一宇航员、宇航服和整体美术风格一致。",
      size: "2K",
      sequential_image_generation: "auto",
      sequential_image_generation_options: { max_images: 4 },
      stream: false,
      output_format: "png",
      response_format: "url",
      watermark: false,
    },
  },
  {
    id: "single-image-to-sequence",
    index: "05",
    title: "单张图生组图",
    category: "组图生成",
    summary: "基于一张参考图扩展成品牌视觉、分镜或成套设计。",
    modelNote: GROUP_MODEL_NOTE,
    instructions: [
      "填写一张提供主体、Logo、角色或产品特征的参考图。",
      "列出需要生成的成套物料或不同场景，并强调统一的品牌语言。",
      "用 max_images 限制输出数量，避免提示词数量与参数不一致。",
    ],
    promptTips: [
      ...GENERAL_TIPS,
      "先说明要保留参考图的哪些关键特征，再列出每张图需要呈现的物料或场景。",
      "品牌视觉应写清品牌名、主色、材质、风格和各物料的一致性。",
    ],
    requestBody: {
      model: SEEDREAM_LITE_MODEL,
      prompt:
        "参考这个 Logo，做一套户外运动品牌视觉设计，品牌名称为“GREEN”，生成4张图片，分别展示包装袋、帽子、卡片和挂绳。绿色为视觉主色调，趣味、简约、现代，保持 Logo 造型和整套品牌语言一致。",
      image:
        "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imageToimages.png",
      size: "2K",
      sequential_image_generation: "auto",
      sequential_image_generation_options: { max_images: 4 },
      stream: false,
      output_format: "png",
      response_format: "url",
      watermark: false,
    },
  },
  {
    id: "multi-image-to-sequence",
    index: "06",
    title: "多参考图生组图",
    category: "组图生成",
    summary: "综合多个参考主体，生成跨时间或跨场景的一组一致图片。",
    modelNote: GROUP_MODEL_NOTE,
    instructions: [
      "每行填写一张参考图 URL，并在提示词中按顺序引用。",
      "明确每张输出的时间、场景或动作差异，以及需要保持一致的角色。",
      "参考图数量与 max_images 之和不得超过 15。",
    ],
    promptTips: [
      ...GENERAL_TIPS,
      "分别说明图1和图2提供的角色、物体或风格，不要让模型自行猜测。",
      "组图按时间或场景分段，并强调人物、玩偶、服装与画风跨图一致。",
    ],
    requestBody: {
      model: SEEDREAM_LITE_MODEL,
      prompt:
        "生成3张女孩和奶牛玩偶在游乐园开心乘坐过山车的图片，分别对应早晨、中午和晚上。女孩参考图1，奶牛玩偶参考图2，三张图保持角色外观、服装、玩偶造型和游乐园视觉风格一致。",
      image: [
        "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imagesToimages_1.png",
        "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imagesToimages_2.png",
      ],
      size: "2K",
      sequential_image_generation: "auto",
      sequential_image_generation_options: { max_images: 3 },
      stream: false,
      output_format: "png",
      response_format: "url",
      watermark: false,
    },
  },
  {
    id: "web-search",
    index: "07",
    title: "联网搜索生图",
    category: "进阶能力",
    summary: "让模型按需检索天气、商品等实时信息后生成图片。",
    modelNote:
      "官方能力表标注 Seedream 5.0 Pro 暂不支持联网搜索；本示例自动使用 Seedream 5.0 Lite。",
    instructions: [
      "该能力仅使用纯文本输入，不添加参考图。",
      "联网搜索会增加时延，模型会自行判断是否需要搜索。",
      "响应中的 usage.tool_usage.web_search 可用于确认实际搜索次数。",
    ],
    promptTips: [
      ...GENERAL_TIPS,
      "写清地点、时间范围、要展示的数据字段和信息截止时间。",
      "信息图要明确标题、卡片数量、排版方向、图标或人物风格。",
    ],
    requestBody: {
      model: SEEDREAM_LITE_MODEL,
      prompt:
        "制作一张上海未来5日天气预报图，采用现代扁平化插画风格，清晰展示每日天气、温度和穿搭建议。整体横向排版，标题为“上海未来5日天气预报”，包含5个等宽垂直卡片，线条清晰、色彩柔和。",
      size: "2048x2048",
      tools: [{ type: "web_search" }],
      output_format: "png",
      response_format: "url",
      watermark: false,
    },
  },
  {
    id: "streaming",
    index: "08",
    title: "流式组图输出",
    category: "进阶能力",
    summary: "每生成完一张图片就立即返回，缩短组图首屏等待时间。",
    modelNote:
      "官方能力表标注 Seedream 5.0 Pro 暂不支持流式输出；本示例自动使用 Seedream 5.0 Lite。",
    instructions: [
      "流式模式适合组图；页面会按事件逐张追加结果。",
      "partial_succeeded 表示单张完成，completed 表示整组完成。",
      "流中断或 partial_failed 会保留已返回图片和完整日志。",
    ],
    promptTips: [
      ...GENERAL_TIPS,
      "图片数量要与 max_images 一致，并逐项写清每张图的动作差异。",
      "强调参考角色、服装和画面风格在整组输出中保持一致。",
    ],
    requestBody: {
      model: SEEDREAM_LITE_MODEL,
      prompt:
        "参考图1生成4张图片，保持同一人物与视觉风格：第1张人物戴墨镜，第2张骑摩托，第3张戴帽子，第4张拿棒棒糖。",
      image:
        "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imageToimages_1.png",
      size: "2K",
      sequential_image_generation: "auto",
      sequential_image_generation_options: { max_images: 4 },
      stream: true,
      output_format: "png",
      response_format: "url",
      watermark: false,
    },
  },
  {
    id: "optimize-prompt-mode",
    index: "09",
    title: "图片 API 提示词优化模式",
    category: "进阶能力",
    summary: "控制图片生成 API 内置的 standard / fast 提示词优化策略。",
    instructions: [
      "standard 优先生成质量；fast 优先速度并可能牺牲部分画质。",
      "Seedream 5.0 Pro 支持 standard 与 fast，Lite 只支持 standard。",
      "该参数与编辑框右下角的 Seed-Evolving 一键优化是两条独立能力。",
    ],
    promptTips: [
      ...GENERAL_TIPS,
      "fast 模式仍应保留主体、动作、环境和关键美学约束，避免过度省略。",
      "若画面依赖复杂文字、精确位置或大量细节，优先使用 standard。",
    ],
    requestBody: {
      model: SEEDREAM_DEFAULT_MODEL,
      prompt:
        "同一庭院一角的秋日景象，银杏叶铺满石板路，木桌上放着热茶，午后暖光穿过树枝，安静温暖，写实摄影风格，横向构图。",
      size: "2K",
      optimize_prompt_options: { mode: "fast" },
      output_format: "png",
      response_format: "url",
      watermark: false,
    },
  },
  {
    id: "output-specs",
    index: "10",
    title: "自定义图片输出规格",
    category: "进阶能力",
    summary: "编辑尺寸、返回方式、图片格式和水印。",
    instructions: [
      "size 可填写 Pro 支持的 1K、2K，或满足像素与宽高比约束的“宽x高”。",
      "response_format 可返回 24 小时有效 URL 或 b64_json。",
      "output_format 支持 png / jpeg；watermark 控制右下角“AI生成”标识。",
    ],
    promptTips: [
      ...GENERAL_TIPS,
      "在提示词中补充横竖构图、宽高比或最终用途，帮助模型匹配尺寸。",
      "海报、封面和社交媒体素材应明确安全区、主体位置和文字内容。",
    ],
    requestBody: {
      model: SEEDREAM_DEFAULT_MODEL,
      prompt:
        "为精品咖啡品牌设计一张横版新品海报，产品为透明玻璃杯中的橙香冷萃，杯身位于画面右侧，左侧预留标题安全区，暖橙与深咖啡配色，商业产品摄影，16:9 构图。",
      size: "2816x1584",
      output_format: "jpeg",
      response_format: "url",
      watermark: true,
    },
  },
];

export function getSeedreamExample(id: string): SeedreamExample | undefined {
  return SEEDREAM_EXAMPLES.find((example) => example.id === id);
}
