import type { SeedanceExample } from "./seedance-examples";

export type TemplateCategoryId =
  | "prompt"
  | "commerce"
  | "drama"
  | "marketing";

export type TemplateAsset = {
  id: string;
  category: TemplateCategoryId;
  title: string;
  summary: string;
  prompt: string;
  tags: string[];
  inputHint: string;
  source: "火山方舟提示词指南" | "工作台预置案例";
  runnableExample?: SeedanceExample;
  previewImageUrl?: string;
};

export const TEMPLATE_SOURCE_URL =
  "https://docs.volcengine.com/docs/82379/2222480?lang=zh";

export const TEMPLATE_CATEGORIES: Array<{
  id: TemplateCategoryId;
  label: string;
  eyebrow: string;
  description: string;
}> = [
  {
    id: "prompt",
    label: "提示词模板",
    eyebrow: "Prompt Patterns",
    description: "把官方基础公式和进阶公式整理成可复制的创作骨架。",
  },
  {
    id: "commerce",
    label: "电商宣发视频模板",
    eyebrow: "Commerce",
    description: "两个已配好商品、公开素材与镜头脚本的可运行案例。",
  },
  {
    id: "drama",
    label: "影视短剧模板",
    eyebrow: "Drama",
    description: "面向人物一致性、分镜时序、动作和对白的官方案例。",
  },
  {
    id: "marketing",
    label: "营销短视频模板",
    eyebrow: "Marketing",
    description: "覆盖品牌露出、产品转化、视觉概念与特效参考。",
  },
];

const COMMERCE_MODEL = "doubao-seedance-2-0-mini-260615";
const CREAM_IMAGE_URL =
  "https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_edit_pic1.jpg";
const ICED_TEA_IMAGE_URL =
  "https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_tea_pic2.jpg";

const CLOUD_CREAM_PROMPT =
  "生成一支 8 秒竖屏电商种草视频。图片1中的云朵修护面霜摆在浅米色洞石台面上，背景是晨光照进的干净浴室。镜头1：微距缓慢推近，展示瓶身与柔和高光；镜头2：一只手自然打开瓶盖，用指尖轻轻带起绵密霜体，突出柔软、轻盈、易推开的质感；镜头3：面霜回到画面中央，周围出现轻薄水雾，定格为高级产品英雄镜头。全片暖白色调、真实商业摄影质感、动作连贯，无人物正脸、无字幕、无额外 Logo。背景为轻柔水声和细腻 ASMR 音效。";

const ICED_TEA_PROMPT =
  "生成一支 8 秒竖屏果茶产品广告。图片1中的苹果果茶放在铺满碎冰的银色托盘上，背景为夏日午后明亮的果茶店。镜头1：超近景扫过透明杯中的苹果果肉、冰块与奶盖分层，杯壁凝结水珠；镜头2：一只手自然拿起果茶轻轻旋转，镜头跟随杯身并捕捉冰块碰撞和果肉晃动；镜头3：果茶回到画面中央，新鲜苹果切片从侧后方缓慢落入碎冰，定格为清爽的产品英雄镜头。全片粉红与青绿色调、真实商业摄影质感、动作连贯，无人物正脸、无字幕、无额外 Logo。背景为轻快鼓点、冰块碰撞声和清脆气泡声。";

export const TEMPLATE_ASSETS: TemplateAsset[] = [
  {
    id: "formula-multimodal",
    category: "prompt",
    title: "多模态参考基础公式",
    summary: "从图片、视频或音频中提取主体、动作、运镜、风格与音色。",
    prompt:
      "图片参考：参考<图片N>中的<主体N>，生成……\n视频参考：参考<视频N>中的<动作/运镜/风格/音效>，生成……\n音频参考：参考<音频N>中的音色，生成……",
    tags: ["图片参考", "视频参考", "音频参考"],
    inputHint: "按上传顺序把占位符替换为图片1、视频1、音频1等。",
    source: "火山方舟提示词指南",
  },
  {
    id: "formula-edit",
    category: "prompt",
    title: "视频元素增删改",
    summary: "在原视频基础上局部修改，未提及的部分默认保持不变。",
    prompt:
      "增加元素：清晰描述<元素特征> + <出现时机> + <出现位置>。\n修改元素：严格编辑<视频N>，将其中的<原特征>修改为<新特征>。\n删除元素：点明需要删除的元素，并强调其余元素保持不变。",
    tags: ["增加元素", "修改元素", "删除元素"],
    inputHint: "至少上传 1 段参考视频；替换元素时可再上传目标图片。",
    source: "火山方舟提示词指南",
  },
  {
    id: "formula-extend",
    category: "prompt",
    title: "延长与轨道补全",
    summary: "在时间维度延续原视频，或补齐多段素材之间的过渡。",
    prompt:
      "延长视频：向前/向后延长<视频N>，生成……\n轨道补全：<视频1> + <过渡画面描述> + 接<视频2> + <过渡画面描述> + 接<视频3>。",
    tags: ["向前延长", "向后延长", "轨道补全"],
    inputHint: "按故事时间顺序上传视频；最多 3 段、输入总时长不超过 15 秒。",
    source: "火山方舟提示词指南",
  },
  {
    id: "formula-advanced",
    category: "prompt",
    title: "进阶提示词公式",
    summary: "按导演思维同时约束空间元素与时间进程。",
    prompt:
      "精准主体 + 动作细节 + 场景环境 + 光影色调 + 镜头运镜 + 视觉风格 + 画质 + 约束条件",
    tags: ["主体", "动作", "运镜", "约束"],
    inputHint: "先锁定谁在做什么，再说明在哪里、怎么拍、最终画面边界。",
    source: "火山方舟提示词指南",
  },
  {
    id: "formula-storyboard",
    category: "prompt",
    title: "时间轴分镜模板",
    summary: "把复杂视频拆成镜头序列，逐镜描述主体、动作、空间和声音。",
    prompt:
      "镜头1：街巷侧拍，男人缓慢起跑，带有急促的呼吸感。\n镜头2：男人撞翻水果摊，镜头快速摇动并给到男人惊恐的特写。\n镜头3：男人翻过矮墙消失，镜头缓慢拉远定格在空荡的街道。",
    tags: ["分镜", "时序", "镜头语言"],
    inputHint: "每个镜头都写清谁、在哪、做什么、镜头怎么动。",
    source: "火山方舟提示词指南",
  },
  {
    id: "formula-constraints",
    category: "prompt",
    title: "稳定性约束模板",
    summary: "减少人脸变形、字幕、水印、闪烁与动作断裂。",
    prompt:
      "全程画面高清电影纪实风，色调统一，光影自然；主体面部稳定不变形，身体比例正常，动作自然连贯，无穿模、无卡顿、无闪烁；保持无字幕，不要生成水印，不要生成额外 Logo。",
    tags: ["稳定性", "无字幕", "无水印"],
    inputHint: "放在主体、场景和分镜描述之后，作为全局约束。",
    source: "火山方舟提示词指南",
  },
  {
    id: "commerce-cloud-cream",
    category: "commerce",
    title: "云朵面霜 · 三幕质感种草",
    summary: "用单张商品图完成微距质感、手部试用和产品定格三幕叙事。",
    prompt: CLOUD_CREAM_PROMPT,
    tags: ["美妆", "9:16", "8 秒", "有声"],
    inputHint: "已预置公开面霜商品图，可直接填入实操台。",
    source: "工作台预置案例",
    previewImageUrl: CREAM_IMAGE_URL,
    runnableExample: {
      id: "template-commerce-cloud-cream",
      title: "模板资产：云朵面霜 · 三幕质感种草",
      summary: "单图驱动的 8 秒竖屏美妆产品广告。",
      capability: "1 张商品图 · 9:16 · 8 秒 · 有声",
      modelNote: "Seedance 2.0 Mini",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          { type: "text", text: CLOUD_CREAM_PROMPT },
          {
            type: "image_url",
            image_url: { url: CREAM_IMAGE_URL },
            role: "reference_image",
          },
        ],
        generate_audio: true,
        ratio: "9:16",
        duration: 8,
        watermark: true,
      },
    },
  },
  {
    id: "commerce-iced-tea",
    category: "commerce",
    title: "冰爽果茶 · 夏日转化广告",
    summary: "用单张成品图表现果肉分层、冰块碰撞和夏日清爽氛围。",
    prompt: ICED_TEA_PROMPT,
    tags: ["饮品", "9:16", "8 秒", "有声"],
    inputHint: "已预置公开果茶商品图，可直接填入实操台。",
    source: "工作台预置案例",
    previewImageUrl: ICED_TEA_IMAGE_URL,
    runnableExample: {
      id: "template-commerce-iced-tea",
      title: "模板资产：冰爽果茶 · 夏日转化广告",
      summary: "单图驱动的 8 秒竖屏果茶产品广告。",
      capability: "1 张商品图 · 9:16 · 8 秒 · 有声",
      modelNote: "Seedance 2.0 Mini",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          { type: "text", text: ICED_TEA_PROMPT },
          {
            type: "image_url",
            image_url: { url: ICED_TEA_IMAGE_URL },
            role: "reference_image",
          },
        ],
        generate_audio: true,
        ratio: "9:16",
        duration: 8,
        watermark: true,
      },
    },
  },
  {
    id: "drama-wuxia",
    category: "drama",
    title: "武侠双人对决",
    summary: "绑定两位角色、悬崖竹林场景、参考动作节奏和背景音效。",
    prompt:
      "@图片1的红衣女子作为女主，@图片2的黑衣女子作为对手，场景参考@图片3的悬崖竹林环境，整体运镜和动作节奏参考@视频1，背景音效与@音频1同步。整体画面烟雨江湖电影感，冷调低饱和，电影胶片质感，光影层次丰富；人物面部和身体比例稳定不变形，动作连贯自然，不僵硬，无穿模无卡顿。",
    tags: ["武侠", "双角色", "动作参考"],
    inputHint: "需要 3 张图片、1 段动作视频和 1 段音频。",
    source: "火山方舟提示词指南",
  },
  {
    id: "drama-fight-reference",
    category: "drama",
    title: "影视打斗动作参考",
    summary: "复用参考视频中的人物动作和镜头语言，替换为指定角色。",
    prompt:
      "参考`视频1`的人物动作和镜头语言，生成`图片2`和`图片1`的打斗场面，`图片2`是左边人物，`图片1`是右边人物。有激烈的背景音乐。",
    tags: ["打斗", "运镜", "角色替换"],
    inputHint: "需要 2 张角色图和 1 段动作参考视频。",
    source: "火山方舟提示词指南",
  },
  {
    id: "drama-storyboard-dialogue",
    category: "drama",
    title: "父女对话分镜",
    summary: "用角色图和分镜构图驱动横摇、切换与韩语对白。",
    prompt:
      "参考`图片3`中的分镜构图，女孩正在等爸爸做好饭，她说：“아빠， 배고파요！ 밥 다 됐어요？”，女孩形象参考`图片1`。接着镜头向右横摇，切换至`图片4`的画面和构图，爸爸形象参考`图片2`，爸爸回答她：“거의 다 됐어， 조금만 기다려！”，接着镜头切换回女儿略显失落的面部表情特写，她说：“아직 멀었어요？ 맛있는 냄새 나는데。。。”，接着切换成爸爸的面部特写，他说：“이제 진짜 금방이야。＂빨리빨리＂ 하지 말고 손부터 씻고 와！”。",
    tags: ["分镜", "对白", "横摇"],
    inputHint: "需要 2 张角色图和 2 张分镜构图。",
    source: "火山方舟提示词指南",
  },
  {
    id: "drama-extend-reunion",
    category: "drama",
    title: "剧情向后延长",
    summary: "在原片结尾继续人物入场、重逢和交流。",
    prompt:
      "生成`视频1`之后的内容，迟到的两个男士跑向他们，五个人终于见面，友好聊天。",
    tags: ["视频延长", "群像", "剧情衔接"],
    inputHint: "需要 1 段待向后延长的剧情视频。",
    source: "火山方舟提示词指南",
  },
  {
    id: "marketing-slogan",
    category: "marketing",
    title: "品牌 Slogan 收尾",
    summary: "在场景收束后模糊画面，并在中部呈现品牌广告语。",
    prompt:
      "手绘漫画风格，三个人围坐在一起吃`图片1`中的炸鸡，气氛友好愉悦，后画面逐渐模糊，画面中部显示文字“快乐尽在 Seedance”。",
    tags: ["Slogan", "文字生成", "品牌收尾"],
    inputHint: "需要 1 张产品图；可替换广告语和文字出现位置。",
    source: "火山方舟提示词指南",
  },
  {
    id: "marketing-golden-horse",
    category: "marketing",
    title: "骏马变黄金吊坠",
    summary: "参考奔跑动态，把自然主体转化为珠宝产品英雄镜头。",
    prompt:
      "参考`视频1`中马的奔跑形态，生成一匹金色的骏马在草原上奔跑，随即定格其奔跑的华丽姿态，变成一个马形的金吊坠。",
    tags: ["珠宝", "形态转换", "动作参考"],
    inputHint: "需要 1 段马匹奔跑参考视频。",
    source: "火山方舟提示词指南",
  },
  {
    id: "marketing-tech-park",
    category: "marketing",
    title: "科技园区概念片",
    summary: "复用第一视角俯冲运镜，以园区高楼为视觉中心。",
    prompt:
      "参考`视频1`的运镜，做一个科技园区的概念视频，以`图片1`中的高楼为视觉中心，同为第一视角俯冲，体现出`图片1`中园区的科技感。",
    tags: ["科技", "第一视角", "概念片"],
    inputHint: "需要 1 段运镜参考视频和 1 张园区高楼图片。",
    source: "火山方舟提示词指南",
  },
  {
    id: "marketing-cyber-logo",
    category: "marketing",
    title: "赛博都市 Logo 露出",
    summary: "通过悬浮灯与城市远景完成情绪铺陈，最后露出品牌标识。",
    prompt:
      "背景是霓虹闪烁的未来都市空中廊道，飞行器与全息广告交织，参考`图片2`中的女孩，先用中景展示女孩放飞带有全息投影的银色悬浮灯，再镜头拉远展现漫天悬浮灯，画面逐渐模糊，后出现`图片1`的 Logo，整体风格为 3D 赛博朋克科幻动画风格。",
    tags: ["Logo", "赛博朋克", "品牌片"],
    inputHint: "需要 1 张 Logo 图片和 1 张人物参考图。",
    source: "火山方舟提示词指南",
  },
];
