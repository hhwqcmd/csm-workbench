import type { SeedanceExample } from "./seedance-examples";

export type TemplateCategoryId =
  | "prompt"
  | "commerce"
  | "drama"
  | "marketing";

export type TemplateMaterialSlot = {
  contentIndex: number;
  objectKey: string;
  kind: "image" | "video";
};

export type TemplateAsset = {
  id: string;
  category: TemplateCategoryId;
  title: string;
  summary: string;
  prompt: string;
  tags: string[];
  inputHint: string;
  source: "火山方舟提示词指南" | "工作台预置案例" | "Seedance 2.5 使用指南";
  runnableExample?: SeedanceExample;
  materialSlots?: TemplateMaterialSlot[];
  hasMissingMaterials?: boolean;
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
    description:
      "面向人物一致性、白模渲染、分镜时序、视频编辑与对白的可预填案例。",
  },
  {
    id: "marketing",
    label: "营销短视频模板",
    eyebrow: "Marketing",
    description:
      "覆盖品牌露出、产品转化、关键帧叙事、一键成片与无缝转场的可预填案例。",
  },
];

const COMMERCE_MODEL = "doubao-seedance-2-0-mini-260615";
const CREAM_IMAGE_URL =
  "https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_edit_pic1.jpg";
const ICED_TEA_IMAGE_URL =
  "https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_tea_pic2.jpg";
const DRAMA_FIGHT_IMAGE_URL =
  "https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/4b419b0cc45043dd8a865d719a50436b~tplv-goo7wpa0wc-image.image";
const DRAMA_FIGHT_VIDEO_URL =
  "https://p9-arcosite.byteimg.com/obj/tos-cn-i-goo7wpa0wc/06ffca9604a14ae4a289bed8cdc115b3";
const DRAMA_STORYBOARD_IMAGE_URL =
  "https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/54a850099e3341b7bb0d290d7e9aa7dc~tplv-goo7wpa0wc-image.image";
const DRAMA_EXTEND_VIDEO_URL =
  "https://p9-arcosite.byteimg.com/obj/tos-cn-i-goo7wpa0wc/127e451399294911aa6803c857ee262b";
const MARKETING_GOLDEN_HORSE_VIDEO_URL =
  "https://p9-arcosite.byteimg.com/obj/tos-cn-i-goo7wpa0wc/95339be0b83b446496bebcaac0ed62e4";
const MARKETING_TECH_VIDEO_URL =
  "https://p9-arcosite.byteimg.com/obj/tos-cn-i-goo7wpa0wc/94aa83c27b7f4731b82b4edda6b8e420";
const MARKETING_TECH_IMAGE_URL =
  "https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/37e0d8db140e42f3805addfef1c867b1~tplv-goo7wpa0wc-image.image";
const MARKETING_CYBER_IMAGE_URL =
  "https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/9462730dc4fe4bda8eca885357be15c1~tplv-goo7wpa0wc-image.image";

// 《Seedance 2.5 多模态生视频使用指南》"能力示例"的输入素材，已转存到工作台私有 TOS。
// 模板中 requestBody 的素材 url 留空占位，由 materialSlots 在填入实操台时换取签名 URL。
const SD25_TOS = {
  whitemodelVideo:
    "demo/video/uploads/20260806/b2503d7f-500f-47d0-af1f-e7e42ce6a945-sd25-01-coarse-whitemodel-video1-15s.mp4",
  whitemodelPic2:
    "demo/image/uploads/20260806/15e1ba3f-312e-4fb7-8a63-7cb2d596e0b3-sd25-01-coarse-whitemodel-pic2.png",
  whitemodelPic3:
    "demo/image/uploads/20260806/a1d74902-fa72-4f84-b270-4f3c96f5b58a-sd25-01-coarse-whitemodel-pic3.png",
  whitemodelPic4:
    "demo/image/uploads/20260806/e27c57bf-80b8-4433-a672-110b220a2647-sd25-01-coarse-whitemodel-pic4.png",
  whitemodelPic5:
    "demo/image/uploads/20260806/31d9a6b4-dc5b-48ba-80a1-4d3aba6a8553-sd25-01-coarse-whitemodel-pic5.jpg",
  whitemodelPic6:
    "demo/image/uploads/20260806/3b3e1236-acf8-45c4-9f50-eb2c0bc08f60-sd25-01-coarse-whitemodel-pic6.png",
  whitemodelPic7:
    "demo/image/uploads/20260806/fd65cdec-2a5e-4205-83a9-4b7ffc81df0a-sd25-01-coarse-whitemodel-pic7.png",
  whitemodelPic8:
    "demo/image/uploads/20260806/ee831ba0-2c42-4921-95f1-63042984227a-sd25-01-coarse-whitemodel-pic8.jpg",
  whitemodelPic9:
    "demo/image/uploads/20260806/a42cacc7-181b-4642-a496-7c8a6cd9b2ae-sd25-01-coarse-whitemodel-pic9.png",
  whitemodelPic10:
    "demo/image/uploads/20260806/a39aab26-82bc-42f5-acf6-9984738c9c4c-sd25-01-coarse-whitemodel-pic10.png",
  fineWhitemodelVideo:
    "demo/video/uploads/20260806/b1e4abb3-80f8-458d-8f69-3192bd2609df-sd25-02-fine-whitemodel-video1.mp4",
  storyboardGrid:
    "demo/image/uploads/20260806/b53beaaa-480f-4f57-926c-4b0d5d930742-sd25-03-storyboard-image1-grid.png",
  storyboardLaunchsite:
    "demo/image/uploads/20260806/e5771148-deb4-477d-af4d-ee5d32a959b8-sd25-03-storyboard-image2-launchsite.png",
  storyboardRobot:
    "demo/image/uploads/20260806/a715e228-c9cf-448d-b995-260f86bd3803-sd25-03-storyboard-image3-robot.png",
  storyboardGrandma:
    "demo/image/uploads/20260806/521060c3-cba1-4d46-8834-70675ef67d6d-sd25-03-storyboard-image4-grandma.png",
  keyframeLogo:
    "demo/image/uploads/20260806/c5d8872e-0a66-4044-89ba-71f13a5429f5-sd25-04-keyframe-image1-logo.png",
  keyframeFace:
    "demo/image/uploads/20260806/f80524d9-4afa-4457-b633-448ee277fa01-sd25-04-keyframe-image2-face.png",
  keyframeBook:
    "demo/image/uploads/20260806/9c1a2376-2b7d-49ff-8274-a0ef104e560f-sd25-04-keyframe-image3-book.png",
  keyframeJump:
    "demo/image/uploads/20260806/736dc33c-934a-4918-96a0-3800bd9b0b13-sd25-04-keyframe-image4-jump.png",
  keyframeRun:
    "demo/image/uploads/20260806/047b6c58-849c-4ef8-87a8-a9273b134237-sd25-04-keyframe-image5-run.png",
  keyframeUi:
    "demo/image/uploads/20260806/fed57ccb-1232-4c30-8075-04bd39e36074-sd25-04-keyframe-image6-ui.png",
  instructionEditVideo:
    "demo/video/uploads/20260806/4fad541d-9b3c-4b93-acc8-6c3727b13cb3-sd25-05-instruction-edit-video1.mp4",
  refEditGround:
    "demo/image/uploads/20260806/049d9ce7-ef7c-48d1-adf4-5729d8b706a3-sd25-06-ref-edit-image1-ground.png",
  refEditOutfitDark:
    "demo/image/uploads/20260806/f91c1e56-2733-4e6e-af2a-9b36bbc48a3d-sd25-06-ref-edit-image2-outfit-dark.png",
  refEditOutfitLight:
    "demo/image/uploads/20260806/ad66ffb4-c0c2-497d-b77d-03cfdd7a4ab8-sd25-06-ref-edit-image3-outfit-light.png",
  refEditVideo:
    "demo/video/uploads/20260806/bab13656-90c6-4e89-a9bb-9f2093dbe3b4-sd25-06-ref-edit-video1.mp4",
  audioEditVideo:
    "demo/video/uploads/20260806/8fd99665-ce29-4a6f-b7d1-023bb6d7f636-sd25-07-audio-edit-video1-15s.mp4",
  extendVideo:
    "demo/video/uploads/20260806/6eaefa2f-92db-4d77-8211-390e583d24d2-sd25-08-extend-video1.mp4",
  onefilm1:
    "demo/image/uploads/20260806/ceeae18c-7dd2-4554-823b-5f88a9f95bef-sd25-09-onefilm-image1.jpg",
  onefilm2:
    "demo/image/uploads/20260806/974bad92-b84d-4c10-bca0-35b458b69728-sd25-09-onefilm-image2.jpg",
  onefilm3:
    "demo/image/uploads/20260806/196440c6-0b71-4729-9746-5eba99846cdd-sd25-09-onefilm-image3.jpg",
  onefilm4:
    "demo/image/uploads/20260806/6a44ddcb-c447-4c52-9060-c8cc9c128d79-sd25-09-onefilm-image4.jpg",
  onefilm5:
    "demo/image/uploads/20260806/0111208f-c8b0-4666-ba75-cf37521d3a16-sd25-09-onefilm-image5.jpg",
  onefilm6:
    "demo/image/uploads/20260806/cd574c13-c01b-4ed6-873e-f75970d4ec51-sd25-09-onefilm-image6.jpg",
  onefilm7:
    "demo/image/uploads/20260806/489241be-6da7-4bc7-9a1d-a473ad0dc3e0-sd25-09-onefilm-image7.jpg",
  onefilm8:
    "demo/image/uploads/20260806/49934a06-d72f-46e6-9041-233de283956d-sd25-09-onefilm-image8.jpg",
  transitionVideo1:
    "demo/video/uploads/20260806/974bd2a3-9eaa-4ad6-8402-55b4196a930d-sd25-10-transition-video1.mp4",
  transitionVideo2:
    "demo/video/uploads/20260806/302bec9e-7062-45de-862e-e6e803a88d75-sd25-10-transition-video2.mp4",
} as const;

function sd25PreviewUrl(objectKey: string): string {
  return `/api/materials/object?key=${encodeURIComponent(objectKey)}`;
}

const SD25_MODEL_NOTE_30S =
  "文档原示例为 Seedance 2.5 · 30 秒；此处用 2.0 Mini 演示，duration 封顶 15 秒";

const SD25_COARSE_WHITEMODEL_PROMPT =
  "以白模参考视频 <video1> 作为整支视频唯一的运镜、镜头节奏、景别变化、主体运动轨迹和镜头调度参考，严格保持白模视频的镜头顺序、机位变化、运动方式和节奏，不改变镜头结构，不新增镜头，不改变主体运动逻辑。\n结合各阶段关键帧参考图，生成一部30秒电影级3D动画短片，整体风格梦幻、童话、温暖，具有儿童幻想色彩，角色外形与各阶段的关键帧保持一致，不要改变角色形象，人物表情情绪随场景变化而改变。\n0-3s（首帧参考 <2pic>）\n镜头由全景俯视缓缓推向地上的小女孩，小女孩坐在房间的地毯上玩飞机，小女孩起身左转，右手使劲一挥将手里的飞机放飞，玩具飞机从左到右弧线飞到前景。音乐从扔纸飞机的声音逐渐过渡到真实动画飞机引擎的声音，并伴随轻柔舒缓愉悦的背景乐。\n3-5s（参考 <3pic>）\n飞机从左至右穿过房间悬挂的星星挂件，小女孩乘坐飞机进入幻想的天空，镜头前一群小鸟飞过自然过渡画面，镜头继续侧跟旋转\n5-8s（参考 <4pic>）\n镜头继续侧跟，以小女孩为中心的环绕，在这个过程中小女孩一直驾驶小飞机翱翔在黄昏云海间，周围有一群飞奇异鸟群与鲲鹏伴飞，参考图中的白龙正在向前游走，天马在张开翅膀飞舞，飞天的鲸鱼在鸣叫，背景是悬浮岛屿。\n8-10s（参考 <5pic>）\n镜头环绕到小女孩驾驶的飞机背面、飞机开始缓缓俯冲海面，小女孩落入水中，画面中产生大量的气泡，小女孩游向海底，此时小女孩头上已经戴上了一个气泡氧气罩。\n10-19s（参考 <6pic>、参考 <7pic>）\n小女孩继续向海底游去，突然一条鳐鱼游过来入画，驮着小女孩继续向前方游去，镜头继续跟随鳐鱼和小女孩在海底穿梭在绚丽海底世界，小女孩为绚丽的海底美景惊叹，镜头继续推进，前方出现巨大的时空裂缝，裂缝的周围像破碎的镜子，裂缝内部是绚烂的宇宙银河，小女孩有些害怕，但最终还是被吸入时空裂缝，来到了幻想宇宙。\n19-23s（参考 <8pic>）\n小女孩从时空裂缝冲出来到幻想宇宙，服装也变成了关键帧中的宇航服，穿着宇航服的小女孩从一颗星球，跳到另一颗星球，伸手一跃，抓到一颗发光的星星，画面定格。\n23-24s（参考 <9pic>）\n前景小女孩和星球开始前翻转并，逐渐幻化消失，后背景缓缓呈现开场（参考 <1pic>）的俯视房间，淡入。\n24-28s（参考 <9pic>）\n俯视镜头持续推进，小女孩躺在地的毯上熟睡，手仍保持摘星星的姿势，身边放着玩具飞机和宇宙绘本。亚洲人脸爸爸从左下角走入画面，轻轻为她盖上被子，此时的光线，缓缓从傍晚黄昏光线为夜晚月光。\n28-30s（参考 <10pic>）\n镜头继续推进绘本，随后爸爸进入画面，右手地上的把绘本缓缓合上，画面定格绘本画面。\n整体要求：所有画面均参考对应关键帧，白模视频仅作为运镜、镜头运动和角色动画参考，不参考画面内容。长镜头衔接自然流畅，动作连续，角色比例统一，皮克斯电影级3D动画质感，高质量光影与空间层次，最终输出30秒16:9横构图宽屏视频。\"";

const SD25_FINE_WHITEMODEL_PROMPT =
  "将视频 1 进行白模渲染，无 bgm，只生成环境音和动作音：\n渲染要求：背景为深蓝与紫色色调的夜晚赛博朋克都市，密集的摩天大楼，楼宇间是巨大的全息广告牌与霓虹灯光，数个飞行器在空中穿梭，闪着微弱的灯光，发出微弱的机械声响；人物为一个身着黑色夜行衣的小浣熊，身影为一道剪影，脚步小心翼翼；人物移动的地点是摩天大楼中的一栋楼的屋顶。";

const SD25_STORYBOARD_PROMPT =
  "image1: 九宫格分镜参考，用于整体镜头结构、景别与运镜节奏。\nimage2: 火箭发射场黄昏草原实拍参考，用于环境构图、暖金夕照与冷暮蓝的写实彩色实拍质感基准。\nimage3: 主体 1 (守护机器人) 角色外观参考。\nimage4: 主体 2 (老奶奶) 角色外观参考。\n【主体设定】\n主体 1 (守护机器人): 参考 image3, 近未来做旧复古机器人，做旧蓝绿色金属机身、斑驳锈蚀，圆顶头，两只发光的红色圆形机眼，细天线，细长关节四肢；体型高大，约为人类两倍高。\n主体 2 (老奶奶): 参考 image4, 瘦小年迈女性，银发挽成低髻，皱纹深刻，身穿明黄金色及地长裙、缀金蓝刺绣胸襟，神情不舍；身高只及机器人胸口。\n环境 (黄昏草原・发射场): 参考 image2, 近未来黄昏草原，暮色天空由暖金渐入冷蓝，远处地平线一座发射台矗立白色火箭、蒸汽升腾；及膝野草随风起伏，广袤空旷。\n【整体风格】\n真人实拍彩色电影正片，写实照片级质感，全程真实彩色画面；彩色 35mm 电影胶片质感，细腻真实胶片颗粒，浓郁饱满的电影级调色，IMAX 大画幅质感；手持摄影，呼吸感摇晃，浅景深大光圈，前景持续飘散的草叶、火星与灰烬，微微倾斜荷兰角，暖金夕照与冷暮蓝、爆炸暖橙强烈对撞，16:9 横屏。近未来温情灾难片氛围，静谧、悲壮、守护与不舍。\n【严格排除】\n黑白、单色、灰度、去色；手绘、素描、线稿、插画、漫画、动画；分镜稿 / 故事板、草图；移轴微缩、玩偶感、塑料 CG、油腻过曝 CG。\n【分镜头】(镜头结构参考 image1 九宫格，9 镜 ≈ 30s)\n镜头 1 (0-3s): 超远景，超低机位贴地仰视，手持缓慢下压。参考 image2 的草原构图，黄昏草原极目空旷，前景及膝野草虚焦摇曳、暖金炫光掠过，画面下三分之一处两个渺小身影 —— 机器人搀着黄裙老奶奶，背对镜头望向远方地平线上升腾蒸汽的白色火箭，巨大暮色天空占据大半画幅。音效：风声、草叶摩擦、低沉引擎轰鸣由远及近。\n镜头 2 (3-6s): 正面中景，平视手持轻微呼吸晃动。主体 1 (机器人) 红色机眼微亮，金属手轻碰主体 2 (老奶奶) 手臂处，只及其胸口；风吹动她的黄裙与银发，两人并肩仰望天空，浅景深，前景虚焦火星飘过。音效：风声、引擎轰鸣升高。台词 (机器人，低沉温和，英文):\"I'm right here. I won't let go.\"\n镜头 3 (6-10s): 面部特写，低角度微仰，手持呼吸感。主体 2 (老奶奶) 脸部皱纹被夕阳镀成暖金，眼含不舍与期盼，嘴唇轻动低语，浮现悲伤微笑，真实皮肤纹理与泪光清晰，边缘柔和炫光。台词 (老奶奶，哽咽轻语，英文):\"Fly safe, my child. Come back to me.\"\n镜头 4 (10-14s): 超远景，低机位缓慢上摇，手持。前景两个渺小身影立于画面底缘仰望，远方地平线白色火箭点火升空，尾焰撕裂暮色、拖曳浓白烟迹直冲高空，角色与火箭距离极远；镜头随火箭不稳定上摇，前景野草与炫光划过，烟迹带动态模糊。音效：轰鸣达到顶点后被拉远变闷。台词 (老奶奶，屏息期盼，英文):\"There he goes... there he goes.\"\n镜头 5 (14-18s): 超远景，镜头随冲击波剧烈摇晃、极不稳定手持。远方高空正在上升的火箭骤然在半空猛烈爆炸碎裂，机身炸成翻飞残骸与浓黑烟 —— 不是烟花，而是悲壮惨烈的景象；爆炸暖橙强光炸开，前景刺目炫光与飞散火星，胶片颗粒骤增，前景两个身影僵住无助仰望。音效：一声沉闷爆炸轰鸣后骤然死寂。台词 (老奶奶，倒抽冷气，气若游丝，英文):\"No... no, no—\"\n镜头 6 (18-22s): 面部大特写，摇晃镜头缓缓稳定为不安定固定。主体 2 (老奶奶) 瞳孔骤缩，空茫难以置信的表情凝固一拍，随后一滴泪缓缓滑下皱纹脸颊，下唇颤抖，冷暖交错的余光映在她的泪眼中，浅景深，细腻胶片颗粒。台词 (老奶奶，空洞难以置信，英文):\"...he was almost there.\"\n镜头 7 (22-25s): 特写转近景，手持随抽泣抖动。主体 2 (老奶奶) 彻底崩溃痛哭，嘴张开却无声，颤抖双手捂住胸口，泪流满面，肩膀随抽泣剧烈起伏，黄裙沾满余烬灰，前景炫光与灰烬飘散。台词 (老奶奶，泣不成声，英文):\"Bring him back! Please— bring him back!\"\n镜头 8 (25-28s): 超低视角近乎垂直仰拍，镜头随坠落碎片剧烈摇晃。底部前景虚焦野草，主体 1 (机器人) 弯腰用细长双臂将主体 2 (老奶奶) 整个环抱、罩成保护穹顶；燃烧碎片如火雨从暗空拖着橙红尾迹坠落，机器人背上迸溅火星与炽热炫光，坠落碎片强动态模糊，极不稳定手持。音效：碎片破空尖啸、金属被击打的钝响。台词 (机器人，坚定护住她，英文):\"Don't look up. I've got you.\"\n镜头 9 (28-30s): 超远景背影，超低机位贴地，摇晃渐稳为缓慢后拉。前景虚焦野草与暖金余晖炫光，主体 1 (机器人) 与主体 2 (老奶奶) 在昏暗草原上紧紧相拥，她依偎进它细长的臂弯；地平线残留淡烟，余烬如萤火渐灭，暮色最后一缕光将两人凝成一座温柔剪影；镜头缓缓后拉定格。音效：风声重起，一段极轻钢琴单音收束。台词 (机器人，轻柔温存，英文):\"I'm still here. I'll stay... as long as you need.\"";

const SD25_KEYFRAME_PROMPT =
  "根据 @图片1 - @图片6 制作一镜到底的像素武侠主题竖版视频，背景音乐使用国风8bit武侠风格音乐。全片统一浅蓝底色，像素风格统一，画面干净通透。\n镜头1：静止展示 @图片1 的「江湖风云」水墨风格 logo，背景为统一浅蓝底色，画面保持约1秒静止。\n镜头2：@图片1 中的文字区域消失后， @图片2 的武侠男性角色像素脸部特写从画面底部滑入；角色眨眨眼看向镜头，随后快速向下位移离场；角色离场后，原本 logo 处变为 @图片3 的蓝色「武功秘籍」像素书。\n镜头3：紧接 @图片4，像素武侠小人角色从画面下方用力向上跃出，顶起上方的蓝色菱形问号标，问号标上方弹出深蓝色粗体字「今日闯江湖！」；角色落地后摆出 @图片4 的站姿 pose，随后抬手打招呼，接着做出预备跑动作，转身向画面右侧奔跑（奔跑姿态参考 @图片5），镜头跟随角色向右移动，角色从画面右侧跳出画面。\n镜头4：@图片6 的 UI 界面从画面右侧位移入画，像素武侠角色从画面右上角跳入，落在「三月廿七日」大字的右下方，张开双臂摆出热情展示的定格姿势，最终定格在该画面。\n整体像素武侠美术风格，色调统一浅蓝底，运镜连贯顺滑呈现一镜到底的连续位移与跟随，元素过渡自然、角色动作衔接流畅，画面无卡顿、无闪烁；文字与 UI 清晰稳定。";

const SD25_INSTRUCTION_EDIT_PROMPT =
  "保留@视频1的构图、机位、光线与表演节奏，只改写画面里女主的样貌与神情：让她从二十多岁自然地老去到六十岁，眼神里的隐忍慢慢化开，泪光滑过眼角，嘴角一点点扬起，最后破涕为笑。全程一镜到底，不跳切、不闪烁，五官随年龄渐变而不漂移。";

const SD25_REF_EDIT_PROMPT =
  "将两人武打素版视频 @视频1 替换为冷兵器对决前的空手试探风。\n场景替换为中世纪石堡平台、古老庭院平地、山间堡垒外平台或简洁石砖决斗场，背景为古堡墙体、风、雾、远处山线，地面平整石质 @图片1 。\n视频中深色衣服的男子的服饰替换为 @图片2 ，视频中浅色衣服的男子替换为 @图片3。动作仍然保持不变，不改变原始节奏。\nAI 特效仅做环境和质感强化：风吹衣摆、轻雾、接触点少量尘土、金属冷色反光质感、轻微颗粒和史诗感调色。整体风格为克制、真实、古典硬派决斗氛围。背景音乐卡点";

const SD25_AUDIO_EDIT_PROMPT =
  "将视频中的人声台词，翻译成中文，无字幕，口型做出对应的精准改变，其余均保持不变。";

const SD25_EXTEND_PROMPT =
  "在@视频 1 的基础上续写 5 秒的视频，讲一只蜜蜂飞来落在画上，接着微距特写蜜蜂腿部和腹部沾满金黄色花粉颗粒,蜜蜂振翅起飞,镜头跟随它飞向另一朵同种花上,慢镜头中,花粉从蜜蜂绒毛上抖落,精准落入花蕊——授粉瞬间被放大。";

const SD25_ONEFILM_PROMPT =
  "将所有图片进行一键成片，图片顺序自由安排，生成一个手绘动态涂鸦抠像风格的咖啡店 vlog，记录一只小狗穿着不同可爱服装在咖啡店打卡拍照的趣味日常。生成具有网感的趣味音频或者 bgm。\n图片可以微微动起来，live 图的效果，但不要改变原图，保持和原图的高度一致。";

const SD25_TRANSITION_PROMPT =
  "将【视频 1】和【视频 2】衔接起来，【视频 1】的视角急需飞行至顶端快速折返，视角垂直向下俯冲，然后无缝自然地衔接转场到【视频 2】，在镜头切换的过程中麻将牌慢慢变成高楼。整个场景也对应变化，同时不要改变上传的两个视频";

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
    inputHint: "已预填 3 张图片、1 段视频和 1 段音频的空素材位，请按角色与场景顺序补齐。",
    source: "火山方舟提示词指南",
    hasMissingMaterials: true,
    runnableExample: {
      id: "template-drama-wuxia",
      title: "模板资产：武侠双人对决",
      summary: "双角色、场景、动作与音效共同驱动的武侠短剧。",
      capability: "3 图 + 1 视频 + 1 音频 · 素材待补",
      modelNote: "Seedance 2.0 Mini；提交前补齐全部素材",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          {
            type: "text",
            text: "@图片1的红衣女子作为女主，@图片2的黑衣女子作为对手，场景参考@图片3的悬崖竹林环境，整体运镜和动作节奏参考@视频1，背景音效与@音频1同步。整体画面烟雨江湖电影感，冷调低饱和，电影胶片质感，光影层次丰富；人物面部和身体比例稳定不变形，动作连贯自然，不僵硬，无穿模无卡顿。",
          },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          {
            type: "video_url",
            video_url: { url: "" },
            role: "reference_video",
          },
          {
            type: "audio_url",
            audio_url: { url: "" },
            role: "reference_audio",
          },
        ],
        generate_audio: true,
        ratio: "16:9",
        duration: 8,
        watermark: true,
      },
    },
  },
  {
    id: "drama-fight-reference",
    category: "drama",
    title: "影视打斗动作参考",
    summary: "复用参考视频中的人物动作和镜头语言，替换为指定角色。",
    prompt:
      "参考`视频1`的人物动作和镜头语言，生成`图片2`和`图片1`的打斗场面，`图片2`是左边人物，`图片1`是右边人物。有激烈的背景音乐。",
    tags: ["打斗", "运镜", "角色替换"],
    inputHint: "已预置官方角色拼图与动作视频；请补充第 2 张独立角色图后提交。",
    source: "火山方舟提示词指南",
    hasMissingMaterials: true,
    runnableExample: {
      id: "template-drama-fight-reference",
      title: "模板资产：影视打斗动作参考",
      summary: "复用动作视频的节奏与运镜，生成指定角色的打斗场面。",
      capability: "2 图 + 1 视频 · 1 张角色图待补",
      modelNote: "Seedance 2.0 Mini",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          {
            type: "text",
            text: "参考`视频1`的人物动作和镜头语言，生成`图片2`和`图片1`的打斗场面，`图片2`是左边人物，`图片1`是右边人物。有激烈的背景音乐。",
          },
          {
            type: "image_url",
            image_url: { url: DRAMA_FIGHT_IMAGE_URL },
            role: "reference_image",
          },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          {
            type: "video_url",
            video_url: { url: DRAMA_FIGHT_VIDEO_URL },
            role: "reference_video",
          },
        ],
        generate_audio: true,
        ratio: "16:9",
        duration: 5,
        watermark: true,
      },
    },
  },
  {
    id: "drama-storyboard-dialogue",
    category: "drama",
    title: "父女对话分镜",
    summary: "用角色图和分镜构图驱动横摇、切换与韩语对白。",
    prompt:
      "参考`图片3`中的分镜构图，女孩正在等爸爸做好饭，她说：“아빠， 배고파요！ 밥 다 됐어요？”，女孩形象参考`图片1`。接着镜头向右横摇，切换至`图片4`的画面和构图，爸爸形象参考`图片2`，爸爸回答她：“거의 다 됐어， 조금만 기다려！”，接着镜头切换回女儿略显失落的面部表情特写，她说：“아직 멀었어요？ 맛있는 냄새 나는데。。。”，接着切换成爸爸的面部特写，他说：“이제 진짜 금방이야。＂빨리빨리＂ 하지 말고 손부터 씻고 와！”。",
    tags: ["分镜", "对白", "横摇"],
    inputHint: "已预置官方分镜拼图；另外 3 个图片素材位留空，便于替换独立角色与构图。",
    source: "火山方舟提示词指南",
    hasMissingMaterials: true,
    runnableExample: {
      id: "template-drama-storyboard-dialogue",
      title: "模板资产：父女对话分镜",
      summary: "角色图与分镜构图共同驱动的多镜头韩语对白短剧。",
      capability: "4 图 · 3 个独立素材位待补",
      modelNote: "Seedance 2.0 Mini",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          {
            type: "text",
            text: "参考`图片3`中的分镜构图，女孩正在等爸爸做好饭，她说：“아빠， 배고파요！ 밥 다 됐어요？”，女孩形象参考`图片1`。接着镜头向右横摇，切换至`图片4`的画面和构图，爸爸形象参考`图片2`，爸爸回答她：“거의 다 됐어， 조금만 기다려！”，接着镜头切换回女儿略显失落的面部表情特写，她说：“아직 멀었어요？ 맛있는 냄새 나는데。。。”，接着切换成爸爸的面部特写，他说：“이제 진짜 금방이야。＂빨리빨리＂ 하지 말고 손부터 씻고 와！”。",
          },
          {
            type: "image_url",
            image_url: { url: DRAMA_STORYBOARD_IMAGE_URL },
            role: "reference_image",
          },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
        ],
        generate_audio: true,
        ratio: "16:9",
        duration: 12,
        watermark: true,
      },
    },
  },
  {
    id: "drama-extend-reunion",
    category: "drama",
    title: "剧情向后延长",
    summary: "在原片结尾继续人物入场、重逢和交流。",
    prompt:
      "生成`视频1`之后的内容，迟到的两个男士跑向他们，五个人终于见面，友好聊天。",
    tags: ["视频延长", "群像", "剧情衔接"],
    inputHint: "已预置官方待延长视频，可直接填入实操台。",
    source: "火山方舟提示词指南",
    runnableExample: {
      id: "template-drama-extend-reunion",
      title: "模板资产：剧情向后延长",
      summary: "从原片结尾继续人物入场、重逢与群像交流。",
      capability: "1 视频 · adaptive · 5 秒 · 有声",
      modelNote: "Seedance 2.0 Mini；官方公开素材",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          {
            type: "text",
            text: "生成`视频1`之后的内容，迟到的两个男士跑向他们，五个人终于见面，友好聊天。",
          },
          {
            type: "video_url",
            video_url: { url: DRAMA_EXTEND_VIDEO_URL },
            role: "reference_video",
          },
        ],
        generate_audio: true,
        ratio: "adaptive",
        duration: 5,
        watermark: true,
      },
    },
  },
  {
    id: "marketing-slogan",
    category: "marketing",
    title: "品牌 Slogan 收尾",
    summary: "在场景收束后模糊画面，并在中部呈现品牌广告语。",
    prompt:
      "手绘漫画风格，三个人围坐在一起吃`图片1`中的炸鸡，气氛友好愉悦，后画面逐渐模糊，画面中部显示文字“快乐尽在 Seedance”。",
    tags: ["Slogan", "文字生成", "品牌收尾"],
    inputHint: "已预填产品图片空素材位；可同时替换广告语和文字出现位置。",
    source: "火山方舟提示词指南",
    hasMissingMaterials: true,
    runnableExample: {
      id: "template-marketing-slogan",
      title: "模板资产：品牌 Slogan 收尾",
      summary: "用产品图驱动漫画风品牌短片，并以广告语收束。",
      capability: "1 图 · 素材待补 · 5 秒 · 有声",
      modelNote: "Seedance 2.0 Mini",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          {
            type: "text",
            text: "手绘漫画风格，三个人围坐在一起吃`图片1`中的炸鸡，气氛友好愉悦，后画面逐渐模糊，画面中部显示文字“快乐尽在 Seedance”。",
          },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
        ],
        generate_audio: true,
        ratio: "16:9",
        duration: 5,
        watermark: true,
      },
    },
  },
  {
    id: "marketing-golden-horse",
    category: "marketing",
    title: "骏马变黄金吊坠",
    summary: "参考奔跑动态，把自然主体转化为珠宝产品英雄镜头。",
    prompt:
      "参考`视频1`中马的奔跑形态，生成一匹金色的骏马在草原上奔跑，随即定格其奔跑的华丽姿态，变成一个马形的金吊坠。",
    tags: ["珠宝", "形态转换", "动作参考"],
    inputHint: "已预置官方马匹奔跑参考视频，可直接填入实操台。",
    source: "火山方舟提示词指南",
    runnableExample: {
      id: "template-marketing-golden-horse",
      title: "模板资产：骏马变黄金吊坠",
      summary: "复用奔跑动态，完成自然主体到珠宝英雄镜头的形态转换。",
      capability: "1 视频 · 16:9 · 5 秒 · 有声",
      modelNote: "Seedance 2.0 Mini；官方公开素材",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          {
            type: "text",
            text: "参考`视频1`中马的奔跑形态，生成一匹金色的骏马在草原上奔跑，随即定格其奔跑的华丽姿态，变成一个马形的金吊坠。",
          },
          {
            type: "video_url",
            video_url: { url: MARKETING_GOLDEN_HORSE_VIDEO_URL },
            role: "reference_video",
          },
        ],
        generate_audio: true,
        ratio: "16:9",
        duration: 5,
        watermark: true,
      },
    },
  },
  {
    id: "marketing-tech-park",
    category: "marketing",
    title: "科技园区概念片",
    summary: "复用第一视角俯冲运镜，以园区高楼为视觉中心。",
    prompt:
      "参考`视频1`的运镜，做一个科技园区的概念视频，以`图片1`中的高楼为视觉中心，同为第一视角俯冲，体现出`图片1`中园区的科技感。",
    tags: ["科技", "第一视角", "概念片"],
    inputHint: "已预置官方运镜视频和园区高楼图，可直接填入实操台。",
    source: "火山方舟提示词指南",
    runnableExample: {
      id: "template-marketing-tech-park",
      title: "模板资产：科技园区概念片",
      summary: "参考第一视角俯冲运镜，建立园区高楼的科技视觉中心。",
      capability: "1 图 + 1 视频 · 16:9 · 5 秒",
      modelNote: "Seedance 2.0 Mini；官方公开素材",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          {
            type: "text",
            text: "参考`视频1`的运镜，做一个科技园区的概念视频，以`图片1`中的高楼为视觉中心，同为第一视角俯冲，体现出`图片1`中园区的科技感。",
          },
          {
            type: "image_url",
            image_url: { url: MARKETING_TECH_IMAGE_URL },
            role: "reference_image",
          },
          {
            type: "video_url",
            video_url: { url: MARKETING_TECH_VIDEO_URL },
            role: "reference_video",
          },
        ],
        generate_audio: true,
        ratio: "16:9",
        duration: 5,
        watermark: true,
      },
    },
  },
  {
    id: "marketing-cyber-logo",
    category: "marketing",
    title: "赛博都市 Logo 露出",
    summary: "通过悬浮灯与城市远景完成情绪铺陈，最后露出品牌标识。",
    prompt:
      "背景是霓虹闪烁的未来都市空中廊道，飞行器与全息广告交织，参考`图片2`中的女孩，先用中景展示女孩放飞带有全息投影的银色悬浮灯，再镜头拉远展现漫天悬浮灯，画面逐渐模糊，后出现`图片1`的 Logo，整体风格为 3D 赛博朋克科幻动画风格。",
    tags: ["Logo", "赛博朋克", "品牌片"],
    inputHint: "已预置官方 Logo/人物拼图，另保留 1 个独立图片空素材位便于替换。",
    source: "火山方舟提示词指南",
    hasMissingMaterials: true,
    runnableExample: {
      id: "template-marketing-cyber-logo",
      title: "模板资产：赛博都市 Logo 露出",
      summary: "通过未来都市情绪铺陈和悬浮灯动作完成 Logo 收尾。",
      capability: "2 图 · 1 个独立素材位待补",
      modelNote: "Seedance 2.0 Mini",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          {
            type: "text",
            text: "背景是霓虹闪烁的未来都市空中廊道，飞行器与全息广告交织，参考`图片2`中的女孩，先用中景展示女孩放飞带有全息投影的银色悬浮灯，再镜头拉远展现漫天悬浮灯，画面逐渐模糊，后出现`图片1`的 Logo，整体风格为 3D 赛博朋克科幻动画风格。",
          },
          {
            type: "image_url",
            image_url: { url: MARKETING_CYBER_IMAGE_URL },
            role: "reference_image",
          },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
        ],
        generate_audio: true,
        ratio: "16:9",
        duration: 5,
        watermark: true,
      },
    },
  },
  {
    id: "sd25-prompt-coarse-whitemodel",
    category: "prompt",
    title: "粗粒度白模参考·童话动画长片",
    summary: "白模视频锁定运镜与镜头调度，关键帧逐段控制 30 秒分镜叙事。",
    prompt: SD25_COARSE_WHITEMODEL_PROMPT,
    tags: ["白模渲染", "运镜参考", "关键帧", "分镜时序"],
    inputHint: "需 1 段白模参考视频 + 9 张阶段关键帧图；原文档为 Seedance 2.5 · 30 秒示例。",
    source: "Seedance 2.5 使用指南",
  },
  {
    id: "sd25-prompt-fine-whitemodel",
    category: "prompt",
    title: "细粒度白模渲染",
    summary: "把白模视频渲染成指定风格场景，并约束声音只生成环境音与动作音。",
    prompt: SD25_FINE_WHITEMODEL_PROMPT,
    tags: ["白模渲染", "风格化", "环境音"],
    inputHint: "需 1 段白模视频；渲染要求按背景、人物、地点三段式描述。",
    source: "Seedance 2.5 使用指南",
  },
  {
    id: "sd25-prompt-storyboard-grid",
    category: "prompt",
    title: "多宫格分镜·守护机器人",
    summary: "九宫格分镜图控镜头结构，主体/环境参考图叠加台词完成 9 镜叙事。",
    prompt: SD25_STORYBOARD_PROMPT,
    tags: ["分镜参考", "多宫格", "角色一致性", "台词"],
    inputHint: "需 4 张图：九宫格分镜、环境参考、两个主体外观参考；原文档为 30 秒示例。",
    source: "Seedance 2.5 使用指南",
  },
  {
    id: "sd25-prompt-keyframe-wuxia",
    category: "prompt",
    title: "关键帧参考·像素武侠宣传",
    summary: "6 张关键帧串联一镜到底的竖版像素风宣传片，逐镜描述元素进出场。",
    prompt: SD25_KEYFRAME_PROMPT,
    tags: ["关键帧", "一镜到底", "像素风", "竖版"],
    inputHint: "需 6 张关键帧图（logo、角色、道具、动作、UI），按镜头顺序上传。",
    source: "Seedance 2.5 使用指南",
  },
  {
    id: "sd25-prompt-instruction-edit",
    category: "prompt",
    title: "视频指令编辑·一镜到底老去",
    summary: "保留原片构图与节奏，只改写人物年龄与神情的渐变。",
    prompt: SD25_INSTRUCTION_EDIT_PROMPT,
    tags: ["指令编辑", "人物渐变", "一镜到底"],
    inputHint: "需 1 段待编辑视频；先声明保留项，再描述唯一改写目标。",
    source: "Seedance 2.5 使用指南",
  },
  {
    id: "sd25-prompt-ref-edit",
    category: "prompt",
    title: "视频参考图编辑·武打换装",
    summary: "用参考图替换场景地面与两位角色服饰，动作节奏保持不变。",
    prompt: SD25_REF_EDIT_PROMPT,
    tags: ["参考图编辑", "服饰替换", "场景替换"],
    inputHint: "需 1 段武打素版视频 + 3 张参考图（地面、两套服饰）。",
    source: "Seedance 2.5 使用指南",
  },
  {
    id: "sd25-prompt-audio-edit",
    category: "prompt",
    title: "视频音频编辑·台词翻译对口型",
    summary: "只改人声台词语言与口型，画面其余内容全部保持不变。",
    prompt: SD25_AUDIO_EDIT_PROMPT,
    tags: ["音频编辑", "台词翻译", "口型同步"],
    inputHint: "需 1 段带人声台词的视频；原文档为 30 秒示例。",
    source: "Seedance 2.5 使用指南",
  },
  {
    id: "sd25-prompt-extend-bee",
    category: "prompt",
    title: "视频延长·蜜蜂授粉续写",
    summary: "在原片基础上续写 5 秒微距叙事，放大授粉瞬间。",
    prompt: SD25_EXTEND_PROMPT,
    tags: ["视频延长", "微距", "慢镜头"],
    inputHint: "需 1 段待延长视频；文档建议输出格式选择 MOV。",
    source: "Seedance 2.5 使用指南",
  },
  {
    id: "sd25-prompt-onefilm-dog",
    category: "prompt",
    title: "一键成片·狗狗咖啡店 vlog",
    summary: "多图自由编排成片，live 图微动效果不改变原图内容。",
    prompt: SD25_ONEFILM_PROMPT,
    tags: ["一键成片", "多图输入", "vlog"],
    inputHint: "需一组主题一致的图片（示例为 8 张），顺序可交给模型自由安排。",
    source: "Seedance 2.5 使用指南",
  },
  {
    id: "sd25-prompt-transition-mahjong",
    category: "prompt",
    title: "视频无缝转场·麻将变高楼",
    summary: "两段视频用俯冲运镜衔接，转场中完成主体形态过渡。",
    prompt: SD25_TRANSITION_PROMPT,
    tags: ["无缝转场", "双视频", "形态过渡"],
    inputHint: "需 2 段视频；描述衔接运镜与转场中的元素变化，并声明不改原片。",
    source: "Seedance 2.5 使用指南",
  },
  {
    id: "sd25-drama-coarse-whitemodel",
    category: "drama",
    title: "能力示例·粗粒度白模童话动画",
    summary: "白模视频锁定运镜，9 张关键帧驱动小女孩幻想之旅的皮克斯风动画。",
    prompt: SD25_COARSE_WHITEMODEL_PROMPT,
    tags: ["白模渲染", "关键帧", "16:9", "有声"],
    inputHint: "已预置文档白模视频（截取前 15 秒，Mini 参考视频上限 15.2 秒）与 9 张关键帧（私有 TOS）；原文档为 30 秒示例。",
    source: "Seedance 2.5 使用指南",
    previewImageUrl: sd25PreviewUrl(SD25_TOS.whitemodelPic2),
    materialSlots: [
      { contentIndex: 1, objectKey: SD25_TOS.whitemodelVideo, kind: "video" },
      { contentIndex: 2, objectKey: SD25_TOS.whitemodelPic2, kind: "image" },
      { contentIndex: 3, objectKey: SD25_TOS.whitemodelPic3, kind: "image" },
      { contentIndex: 4, objectKey: SD25_TOS.whitemodelPic4, kind: "image" },
      { contentIndex: 5, objectKey: SD25_TOS.whitemodelPic5, kind: "image" },
      { contentIndex: 6, objectKey: SD25_TOS.whitemodelPic6, kind: "image" },
      { contentIndex: 7, objectKey: SD25_TOS.whitemodelPic7, kind: "image" },
      { contentIndex: 8, objectKey: SD25_TOS.whitemodelPic8, kind: "image" },
      { contentIndex: 9, objectKey: SD25_TOS.whitemodelPic9, kind: "image" },
      { contentIndex: 10, objectKey: SD25_TOS.whitemodelPic10, kind: "image" },
    ],
    runnableExample: {
      id: "template-sd25-drama-coarse-whitemodel",
      title: "模板资产：能力示例·粗粒度白模童话动画",
      summary: "白模运镜 + 9 关键帧驱动的童话动画长镜头。",
      capability: "1 视频 + 9 图 · 16:9 · 15 秒 · 有声",
      modelNote: SD25_MODEL_NOTE_30S,
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          { type: "text", text: SD25_COARSE_WHITEMODEL_PROMPT },
          { type: "video_url", video_url: { url: "" }, role: "reference_video" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
        ],
        generate_audio: true,
        ratio: "16:9",
        duration: 15,
        watermark: true,
      },
    },
  },
  {
    id: "sd25-drama-fine-whitemodel",
    category: "drama",
    title: "能力示例·细粒度白模赛博浣熊",
    summary: "把白模视频渲染成夜晚赛博朋克都市里的夜行小浣熊。",
    prompt: SD25_FINE_WHITEMODEL_PROMPT,
    tags: ["白模渲染", "赛博朋克", "16:9", "环境音"],
    inputHint: "已预置文档白模视频（私有 TOS），可直接填入实操台。",
    source: "Seedance 2.5 使用指南",
    materialSlots: [
      {
        contentIndex: 1,
        objectKey: SD25_TOS.fineWhitemodelVideo,
        kind: "video",
      },
    ],
    runnableExample: {
      id: "template-sd25-drama-fine-whitemodel",
      title: "模板资产：能力示例·细粒度白模赛博浣熊",
      summary: "白模视频渲染为赛博朋克风格，只生成环境音与动作音。",
      capability: "1 视频 · 16:9 · 6 秒 · 环境音",
      modelNote: "文档原示例为 Seedance 2.5，此处用 2.0 Mini 演示",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          { type: "text", text: SD25_FINE_WHITEMODEL_PROMPT },
          { type: "video_url", video_url: { url: "" }, role: "reference_video" },
        ],
        generate_audio: true,
        ratio: "16:9",
        duration: 6,
        watermark: true,
      },
    },
  },
  {
    id: "sd25-drama-storyboard-robot",
    category: "drama",
    title: "能力示例·守护机器人火箭发射",
    summary: "九宫格分镜控 9 镜结构，机器人与老奶奶的悲壮发射场叙事。",
    prompt: SD25_STORYBOARD_PROMPT,
    tags: ["分镜参考", "台词", "16:9", "有声"],
    inputHint: "已预置九宫格分镜、环境与两个主体参考图（私有 TOS）；原文档为 30 秒示例。",
    source: "Seedance 2.5 使用指南",
    previewImageUrl: sd25PreviewUrl(SD25_TOS.storyboardGrid),
    materialSlots: [
      { contentIndex: 1, objectKey: SD25_TOS.storyboardGrid, kind: "image" },
      {
        contentIndex: 2,
        objectKey: SD25_TOS.storyboardLaunchsite,
        kind: "image",
      },
      { contentIndex: 3, objectKey: SD25_TOS.storyboardRobot, kind: "image" },
      { contentIndex: 4, objectKey: SD25_TOS.storyboardGrandma, kind: "image" },
    ],
    runnableExample: {
      id: "template-sd25-drama-storyboard-robot",
      title: "模板资产：能力示例·守护机器人火箭发射",
      summary: "多宫格分镜 + 主体参考驱动的近未来温情灾难短片。",
      capability: "4 图 · 16:9 · 15 秒 · 有声",
      modelNote: SD25_MODEL_NOTE_30S,
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          { type: "text", text: SD25_STORYBOARD_PROMPT },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
        ],
        generate_audio: true,
        ratio: "16:9",
        duration: 15,
        watermark: true,
      },
    },
  },
  {
    id: "sd25-drama-instruction-edit",
    category: "drama",
    title: "能力示例·女主一镜到底老去",
    summary: "保留原片构图与表演节奏，只改写女主从二十到六十岁的渐变。",
    prompt: SD25_INSTRUCTION_EDIT_PROMPT,
    tags: ["指令编辑", "人物渐变", "16:9"],
    inputHint: "已预置文档待编辑视频（私有 TOS），可直接填入实操台。",
    source: "Seedance 2.5 使用指南",
    materialSlots: [
      {
        contentIndex: 1,
        objectKey: SD25_TOS.instructionEditVideo,
        kind: "video",
      },
    ],
    runnableExample: {
      id: "template-sd25-drama-instruction-edit",
      title: "模板资产：能力示例·女主一镜到底老去",
      summary: "指令编辑驱动的人物年龄与神情渐变。",
      capability: "1 视频 · 16:9 · 15 秒 · 有声",
      modelNote: "文档原示例为 Seedance 2.5，此处用 2.0 Mini 演示",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          { type: "text", text: SD25_INSTRUCTION_EDIT_PROMPT },
          { type: "video_url", video_url: { url: "" }, role: "reference_video" },
        ],
        generate_audio: true,
        ratio: "16:9",
        duration: 15,
        watermark: true,
      },
    },
  },
  {
    id: "sd25-drama-ref-edit",
    category: "drama",
    title: "能力示例·武打场景换装编辑",
    summary: "参考图替换石质地面与两位角色服饰，武打动作节奏保持不变。",
    prompt: SD25_REF_EDIT_PROMPT,
    tags: ["参考图编辑", "服饰替换", "16:9", "有声"],
    inputHint: "已预置地面/两套服饰参考图与武打素版视频（私有 TOS）。",
    source: "Seedance 2.5 使用指南",
    previewImageUrl: sd25PreviewUrl(SD25_TOS.refEditGround),
    materialSlots: [
      { contentIndex: 1, objectKey: SD25_TOS.refEditGround, kind: "image" },
      { contentIndex: 2, objectKey: SD25_TOS.refEditOutfitDark, kind: "image" },
      {
        contentIndex: 3,
        objectKey: SD25_TOS.refEditOutfitLight,
        kind: "image",
      },
      { contentIndex: 4, objectKey: SD25_TOS.refEditVideo, kind: "video" },
    ],
    runnableExample: {
      id: "template-sd25-drama-ref-edit",
      title: "模板资产：能力示例·武打场景换装编辑",
      summary: "参考图驱动的场景与服饰替换，保留原始动作节奏。",
      capability: "3 图 + 1 视频 · 16:9 · 8 秒 · 有声",
      modelNote: "文档原示例为 Seedance 2.5，此处用 2.0 Mini 演示",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          { type: "text", text: SD25_REF_EDIT_PROMPT },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "video_url", video_url: { url: "" }, role: "reference_video" },
        ],
        generate_audio: true,
        ratio: "16:9",
        duration: 8,
        watermark: true,
      },
    },
  },
  {
    id: "sd25-drama-audio-edit",
    category: "drama",
    title: "能力示例·台词翻译中文对口型",
    summary: "人声台词翻译成中文并精准改口型，画面其余保持不变。",
    prompt: SD25_AUDIO_EDIT_PROMPT,
    tags: ["音频编辑", "口型同步", "16:9"],
    inputHint: "已预置文档带台词视频（截取前 15 秒，Mini 参考视频上限 15.2 秒）；原文档为 30 秒示例。",
    source: "Seedance 2.5 使用指南",
    materialSlots: [
      { contentIndex: 1, objectKey: SD25_TOS.audioEditVideo, kind: "video" },
    ],
    runnableExample: {
      id: "template-sd25-drama-audio-edit",
      title: "模板资产：能力示例·台词翻译中文对口型",
      summary: "只改台词语言与口型的音频编辑示例。",
      capability: "1 视频 · 16:9 · 15 秒 · 有声",
      modelNote: SD25_MODEL_NOTE_30S,
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          { type: "text", text: SD25_AUDIO_EDIT_PROMPT },
          { type: "video_url", video_url: { url: "" }, role: "reference_video" },
        ],
        generate_audio: true,
        ratio: "16:9",
        duration: 15,
        watermark: true,
      },
    },
  },
  {
    id: "sd25-drama-extend-bee",
    category: "drama",
    title: "能力示例·蜜蜂授粉视频延长",
    summary: "在原片基础上续写 5 秒蜜蜂授粉的微距慢镜头叙事。",
    prompt: SD25_EXTEND_PROMPT,
    tags: ["视频延长", "微距", "adaptive"],
    inputHint: "已预置文档待延长视频（私有 TOS）；文档建议输出格式选择 MOV。",
    source: "Seedance 2.5 使用指南",
    materialSlots: [
      { contentIndex: 1, objectKey: SD25_TOS.extendVideo, kind: "video" },
    ],
    runnableExample: {
      id: "template-sd25-drama-extend-bee",
      title: "模板资产：能力示例·蜜蜂授粉视频延长",
      summary: "在原片结尾续写蜜蜂授粉的 5 秒微距叙事。",
      capability: "1 视频 · adaptive · 5 秒 · 有声",
      modelNote: "文档原示例为 Seedance 2.5，此处用 2.0 Mini 演示",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          { type: "text", text: SD25_EXTEND_PROMPT },
          { type: "video_url", video_url: { url: "" }, role: "reference_video" },
        ],
        generate_audio: true,
        ratio: "adaptive",
        duration: 5,
        watermark: true,
      },
    },
  },
  {
    id: "sd25-marketing-keyframe-wuxia",
    category: "marketing",
    title: "能力示例·像素武侠游戏宣传",
    summary: "6 张关键帧串联一镜到底的竖版像素武侠宣传片。",
    prompt: SD25_KEYFRAME_PROMPT,
    tags: ["关键帧", "像素风", "9:16", "有声"],
    inputHint: "已预置文档 6 张关键帧图（私有 TOS），可直接填入实操台。",
    source: "Seedance 2.5 使用指南",
    previewImageUrl: sd25PreviewUrl(SD25_TOS.keyframeLogo),
    materialSlots: [
      { contentIndex: 1, objectKey: SD25_TOS.keyframeLogo, kind: "image" },
      { contentIndex: 2, objectKey: SD25_TOS.keyframeFace, kind: "image" },
      { contentIndex: 3, objectKey: SD25_TOS.keyframeBook, kind: "image" },
      { contentIndex: 4, objectKey: SD25_TOS.keyframeJump, kind: "image" },
      { contentIndex: 5, objectKey: SD25_TOS.keyframeRun, kind: "image" },
      { contentIndex: 6, objectKey: SD25_TOS.keyframeUi, kind: "image" },
    ],
    runnableExample: {
      id: "template-sd25-marketing-keyframe-wuxia",
      title: "模板资产：能力示例·像素武侠游戏宣传",
      summary: "关键帧驱动的一镜到底像素风游戏宣传视频。",
      capability: "6 图 · 9:16 · 12 秒 · 有声",
      modelNote: "文档原示例为 Seedance 2.5，此处用 2.0 Mini 演示",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          { type: "text", text: SD25_KEYFRAME_PROMPT },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
        ],
        generate_audio: true,
        ratio: "9:16",
        duration: 12,
        watermark: true,
      },
    },
  },
  {
    id: "sd25-marketing-onefilm-dog",
    category: "marketing",
    title: "能力示例·狗狗咖啡店一键成片",
    summary: "8 张图自由编排成手绘涂鸦风咖啡店 vlog，live 图微动不改原图。",
    prompt: SD25_ONEFILM_PROMPT,
    tags: ["一键成片", "vlog", "9:16", "有声"],
    inputHint: "已预置文档 8 张狗狗打卡图（私有 TOS），可直接填入实操台。",
    source: "Seedance 2.5 使用指南",
    previewImageUrl: sd25PreviewUrl(SD25_TOS.onefilm1),
    materialSlots: [
      { contentIndex: 1, objectKey: SD25_TOS.onefilm1, kind: "image" },
      { contentIndex: 2, objectKey: SD25_TOS.onefilm2, kind: "image" },
      { contentIndex: 3, objectKey: SD25_TOS.onefilm3, kind: "image" },
      { contentIndex: 4, objectKey: SD25_TOS.onefilm4, kind: "image" },
      { contentIndex: 5, objectKey: SD25_TOS.onefilm5, kind: "image" },
      { contentIndex: 6, objectKey: SD25_TOS.onefilm6, kind: "image" },
      { contentIndex: 7, objectKey: SD25_TOS.onefilm7, kind: "image" },
      { contentIndex: 8, objectKey: SD25_TOS.onefilm8, kind: "image" },
    ],
    runnableExample: {
      id: "template-sd25-marketing-onefilm-dog",
      title: "模板资产：能力示例·狗狗咖啡店一键成片",
      summary: "多图一键成片的趣味咖啡店 vlog。",
      capability: "8 图 · 9:16 · 15 秒 · 有声",
      modelNote: "文档原示例为 Seedance 2.5，此处用 2.0 Mini 演示",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          { type: "text", text: SD25_ONEFILM_PROMPT },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
          { type: "image_url", image_url: { url: "" }, role: "reference_image" },
        ],
        generate_audio: true,
        ratio: "9:16",
        duration: 15,
        watermark: true,
      },
    },
  },
  {
    id: "sd25-marketing-transition-mahjong",
    category: "marketing",
    title: "能力示例·麻将变高楼无缝转场",
    summary: "两段视频用俯冲运镜衔接，转场中麻将牌慢慢变成高楼。",
    prompt: SD25_TRANSITION_PROMPT,
    tags: ["无缝转场", "双视频", "adaptive", "有声"],
    inputHint: "已预置文档两段转场视频（私有 TOS），可直接填入实操台。",
    source: "Seedance 2.5 使用指南",
    materialSlots: [
      { contentIndex: 1, objectKey: SD25_TOS.transitionVideo1, kind: "video" },
      { contentIndex: 2, objectKey: SD25_TOS.transitionVideo2, kind: "video" },
    ],
    runnableExample: {
      id: "template-sd25-marketing-transition-mahjong",
      title: "模板资产：能力示例·麻将变高楼无缝转场",
      summary: "双视频无缝衔接与主体形态过渡的转场示例。",
      capability: "2 视频 · adaptive · 10 秒 · 有声",
      modelNote: "文档原示例为 Seedance 2.5，此处用 2.0 Mini 演示",
      requestBody: {
        model: COMMERCE_MODEL,
        content: [
          { type: "text", text: SD25_TRANSITION_PROMPT },
          { type: "video_url", video_url: { url: "" }, role: "reference_video" },
          { type: "video_url", video_url: { url: "" }, role: "reference_video" },
        ],
        generate_audio: true,
        ratio: "adaptive",
        duration: 10,
        watermark: true,
      },
    },
  },
];
