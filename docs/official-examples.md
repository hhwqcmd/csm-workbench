# 官方示例任务映射

来源：[Doubao Seedance 2.0 系列教程](https://docs.volcengine.com/docs/82379/2291680?lang=zh)、[视频生成教程](https://docs.volcengine.com/docs/82379/2298881?lang=zh)（2026-07-07 更新版）与[官方模型列表](https://www.volcengine.com/docs/82379/1330310?lang=zh)。

工作台中的八个“填入参数”按钮只更新表单与完整 Request Body，不会自动创建计费任务。

| 示例 | 输入与关键参数 | 工作台模型 |
| --- | --- | --- |
| 任务一：把香水替换成面霜 | 1 图 + 1 视频；`16:9`、5 秒、有声 | `doubao-seedance-2-0-mini-260615` |
| 任务二：多模态参考 | 2 图 + 1 视频 + 1 音频；`16:9`、11 秒、有声 | `doubao-seedance-2-0-mini-260615` |
| 任务三：延长视频 | 3 视频；`16:9`、8 秒、有声 | `doubao-seedance-2-0-mini-260615` |
| 任务四：输出 4k 视频 | 1 图；`adaptive`、15 秒、有声、`resolution: "4k"` | `doubao-seedance-2-0-260128` |
| 任务五：使用联网搜索 | 纯文本；`tools: [{"type":"web_search"}]`、`16:9`、11 秒 | `doubao-seedance-2-0-mini-260615`（真实任务已成功） |
| 任务六：使用预置虚拟人像 | 1 个 `asset://asset-*` 预置人像 + 1 张产品图；`adaptive`、11 秒、有声 | `doubao-seedance-2-0-mini-260615`（真实任务已成功） |
| 任务七：图生视频-基于首尾帧（含音频） | `first_frame` + `last_frame`；`adaptive`、5 秒、`generate_audio: true` | `doubao-seedance-2-0-260128`（协议与兼容素材已真实验证） |
| 任务八：生成多个连续视频 | 3 段严格串行；每段 5 秒、`return_last_frame: true` | `doubao-seedance-2-0-260128`（三段真实任务已成功） |

## 模型选择依据

官方模型列表说明 Mini 支持多模态生视频、编辑视频、延长视频、首尾帧、首帧和文生视频，输出 480p / 720p、4–15 秒。因此任务一至三优先使用 Mini。

4K（10bit）只在完整 `doubao-seedance-2-0-260128` 的规格中列出，任务四必须切换完整模型。

联网搜索教程要求输入必须为纯文本，并配置 `tools.type = "web_search"`。2026-07-24 已用 Mini 完成真实任务，因此无需为该示例切换完整模型。不得在联网搜索请求中混入图片、视频或音频。

预置虚拟人像教程用 `asset://<asset ID>` 传入人物素材。工作台只额外允许严格的 `asset://asset-*` 形式，其他素材仍要求公网 HTTPS；提示词应按素材顺序写“图片1”，不要把 Asset ID 当作提示词中的人物名称。

首尾帧教程要求两张图片分别使用 `role: "first_frame"` 与 `role: "last_frame"`；工作台在素材编辑器中显式展示角色，避免 Request Body 回写表单时丢失。官方示例使用完整模型，5 秒、`adaptive`、有声、有水印。

2026-07-27 真实调用时，教程中的 `seepro_first_frame.jpeg` / `seepro_last_frame.jpeg` 被当前内容安全策略以 `InputImageSensitiveContentDetected.PrivacyInformation` 拒绝。工作台保留官方原始参数作为协议基线，并在界面模型说明中提示该限制；使用已通过审核的官方插画与连续任务返回尾帧替换素材后，相同首尾帧角色和有声参数成功生成视频。不要把教程素材被拒绝误判为请求结构错误。

## 生成多个连续视频

“生成多个连续视频”作为任务八与前七个官方示例并列。点击任务八的“填入参数”后，实操台会预填第一段请求，并展示独立的三段连续生成面板。它复刻官方三段示例：

1. 第一段使用官方女孩与狐狸图片作为初始帧。
2. 每段请求都带 `return_last_frame: true`。
3. 上一段响应中的 `content.last_frame_url` 自动成为下一段的图片输入。
4. 三段按顺序创建；任一段失败或缺少尾帧时停止，不会继续产生后续费用。

连续链路使用官方代码中的完整模型、`adaptive`、单段 5 秒、无水印配置。每段都是独立的远端任务和本地历史记录，创建与查询日志分别保存。工作台不自动调用 FFmpeg；官方文档把最终拼接留给调用方处理。

## 验收证据

八个示例、预置人像、首尾帧和三段连续生成的真实验收结论统一维护在
[`validation-log.md`](./validation-log.md)。本文件只保留当前请求结构和能力限制，
避免模型或验证结果在多处重复后发生漂移。结果视频 URL 属于用户任务产物，不写入仓库。

## 通用请求结构

工作台不再假设“一图一视频”。`content` 支持：

- 恰好一项 `text`。
- 最多 9 项 `image_url`；普通参考图用 `reference_image`，首尾帧模式分别用 `first_frame` / `last_frame`，连续链的单图输入按官方代码可省略角色。
- 最多 3 项 `video_url`，角色固定为 `reference_video`。
- 最多 3 项 `audio_url`，角色固定为 `reference_audio`。

表单、示例预填和“完整 API 请求详情”共享同一份状态。服务端只转发白名单字段：`model`、`content`、`generate_audio`、`resolution`、`ratio`、`duration`、`watermark`、`return_last_frame`、`tools`。
