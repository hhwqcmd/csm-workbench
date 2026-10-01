# 真实任务工作流

## 目标

工作台把官方 `demo_standard.py` 中的任务创建、30 秒轮询和结果读取逻辑实现为可托管的 Web 流程。它复用同一套 Content Generation Tasks 协议，但不会从网页启动本地 `run_demo.sh` 或 Python 子进程。

## 调用链

```text
SeedanceTaskRunner
  → POST /api/seedance/tasks
  → app/lib/seedance-server.ts
  → 火山方舟创建任务
  → 返回 task id

每 30 秒：
SeedanceTaskRunner
  → POST /api/seedance/tasks/status
  → app/lib/seedance-server.ts
  → 火山方舟查询任务
  → queued / running / succeeded / failed / cancelled / expired
```

查询路由使用 POST，是为了让 API Key 留在请求体中，避免进入 URL、浏览历史或访问日志。
每轮非终态查询结束后由 `pollCycle` 安排下一轮，即使上游状态仍是相同的 `running` 也会继续。临时网络错误保留远端任务状态，并在 30 秒后重试。

## 创建请求

工作台提供八个官方示例和通用多模态请求字段：

- API 路径：标准 API 或 Agent Plan；默认是标准 API。
- Base URL：只能是所选路径的官方精确地址。
- 模型：只能从所选路径的当前模型清单选择；标准 API 支持 `doubao-seedance-2-5-260628`，默认仍是 `doubao-seedance-2-0-mini-260615`。官方资料未提供 Seedance 2.5 的 Agent Plan 别名，因此套餐通道不开放 2.5。
- API Key：默认按 API 路径保存在当前浏览器，关闭“记住”后只存在组件内存；随本次同源请求转发。
- 提示词：默认使用“香水替换成面霜”的官方示例；有参考素材时可省略 text，纯文本任务仍必须填写。
- 素材：可组合图片、视频与音频；只接受公网 HTTPS URL 或严格的 `asset://asset-*` 素材 ID。为了避免把大体积或敏感素材写入本机历史和日志，本工作台不开放 Base64。
- 输出：按模型能力动态提供时长、比例、分辨率与输出格式，并保留有声参数和水印开关。
- 工具：当前只开放 `web_search`，服务端不接受任意工具或任意上游字段。
- 首帧：单首帧模式只包含一张 `first_frame`；首尾帧模式必须且只能各一张 `first_frame` / `last_frame`，两种模式都不能混入参考素材。
- 尾帧返回：可传 `return_last_frame: true`，查询结果中的 `last_frame_url` 会进入结果区、历史和脱敏日志。

服务端再做一次独立校验，不能只依赖浏览器禁用按钮。

## Seedance 2.5 能力与约束

标准 API 模型 ID 为 `doubao-seedance-2-5-260628`，继续使用既有 Content Generation Tasks 创建和查询地址。

- 时长支持 `duration: -1` 或 4–30 秒；`-1` 表示模型自适应，提交前只展示可能范围，结果以查询接口返回的实际 `duration` 为准。
- 分辨率仅支持 480p、720p；输出格式支持 mp4、mov。MOV 面向后期编辑，浏览器不兼容时仍可打开链接、下载或保存到素材库。
- 多模态参考最多 30 张图片、10 段视频、10 段音频，总计不超过 50 项；允许只传音频，不要求搭配图片或视频。
- 工作台根据 `content.role` 和官方关键词预判文生、参考、编辑、延长、首帧或首尾帧任务。标准 API 的 2.5 全模态参考任务会发送官方字段 `omni_reference_task_type`，默认 `auto`；纯文本、首帧、首尾帧、其他模型和 Agent Plan 均省略该字段。
- 显式 `reference` / `edit` / `extend` 必须与 Prompt 推断意图一致。`edit` 必须有参考视频并强制 `ratio: "adaptive"`、`duration: -1`；`extend` 必须有参考视频并强制 `ratio: "adaptive"`。前端与服务端执行同一约束。
- 视频编辑仅允许 `ratio: "adaptive"`、`duration: -1`；视频延长和首帧类任务仅允许 `ratio: "adaptive"`。违反任务类型约束可能在任务排队后异步返回 `InvalidParameter.TaskTypeConstraint`。
- 2.5 生成视频与尾帧 URL 有效期为 24 小时，下载次数上限为 100 次，应及时下载或显式保存到私有素材库。

## 受控批量实验

批量模式在浏览器内把多条 Prompt 与每条抽卡数展开为单任务矩阵。它不新增上游批量协议，每一项仍分别调用 `/api/seedance/tasks` 和 `/api/seedance/tasks/status`。

- 总任务数为非空 Prompt 数 × 抽卡数，范围固定为 2–12；创建和查询并发上限都为 3。
- Prompt 之外的模型、素材与输出参数来自同一请求快照；每个单元格仍有独立本地历史 ID、远端 task ID、状态、结果、用量、错误、尝试次数和脱敏日志。
- 提交前展示调用数、组合、固定总秒数或智能时长范围、模型、分辨率、素材与联网状态。标准 API 只有四个已核验的 Seedance 2.x 型号在 720p、16:9、输入不含参考视频时显示人民币参考估算；其他条件明确显示无法准确估价。Agent Plan 只提示 AFP 消耗。
- 价格集中在 `app/lib/seedance-pricing.ts`，带复核日期和官方来源，并始终标记“参考估算，不是账单”。
- 第一级勾选确认会创建 N 个真实任务；第二级弹窗再次展示本地批次 ID、新增调用数和费用摘要，独立勾选后才进入创建队列。页面加载、编辑、预览和费用计算不创建任务。
- 服务端创建错误附加 `creationOutcome` 与 `retryable`。明确校验/4xx 拒绝且无 task ID 为“未创建”，可由用户重新完成两级确认后手动重试；网络中断、5xx 或缺少 task ID 为“创建结果未知”，禁止直接重试；取得 task ID 后的 failed/cancelled/expired 保留终态，本期不重试。
- 批次 ID 形如 `seedance-batch-<timestamp>-<random>`，只用于本机组织结果，不发送给上游。浏览器最多保存 10 个批次，不保存 API Key；有已记住的对应 Key 时刷新自动恢复轮询，否则允许重新输入后手动恢复。
- 页面恢复时若发现本机记录停在 `pending` / `submitting`，由于无法证明请求是否到达上游，会保守转为“创建结果未知”，避免重复计费。

## 完整 API 详情

“提交前确认”之前展示实际的 Method、Request URL、Content-Type、Authorization 掩码和 Request Body。

- 上方表单变化会立即更新 Request Body。
- Request Body 可直接编辑 JSON；点击“应用参数”后回写模型、提示词、多模态素材、比例、时长、分辨率、输出格式、音频、水印和联网工具。
- JSON、字段类型、模型与路径、比例和时长会先在浏览器校验，服务端仍会再次校验。
- URL 和 Headers 由连接配置派生，避免出现显示值与真正发送目标不一致。
- 点击“复制 cURL”会把当前已应用的 Method、URL、Headers 和 Request Body 拼成可直接粘贴执行的单行命令，并在 HTTP 失败时保留上游错误正文；已填写 Key 时剪贴板内容会包含该 Key，未填写时保留 `<ARK_API_KEY>` 占位符。

## 安全边界

- 禁止浏览器直接请求火山方舟。
- 演示模式可把 API Key 放入当前浏览器 `localStorage`；禁止进入 `sessionStorage`、Cookie、URL、SSR HTML、源码、服务端存储或日志。
- 服务端不得缓存、持久化或回显 Key。
- cURL 只在用户显式点击时于浏览器内生成并写入剪贴板，不进入历史、日志或服务端；复制后需按敏感凭证管理。
- Base URL 使用精确白名单，避免把带有 Authorization 的请求转发到任意主机。
- 任务处于排队或运行状态时锁定连接和参数；刷新后从本地历史恢复最近的活跃任务。未开启记住模式时需要重新输入 Key 才能继续查询。
- 上游错误信息会截断并替换可能出现的 Key。
- `.env.example` 只能包含空占位符，不能保存真实凭证。

## 本地历史

- 每次点击提交都会立即创建历史记录，最多保留 30 条；即使创建失败或没有远端任务 ID，也会保留。
- 历史记录包含本地记录 ID、远端任务 ID（如有）、API 路径、模型、状态、时间、脱敏错误和结果 URL，不包含完整 API Key。
- “查看日志”记录创建与每次状态查询的 Method、URL、脱敏 Headers、Body、HTTP 状态和响应。
- 查询结果保留实际 `duration`、`ratio`、`resolution`、`output_format` 和 token/tool 用量；`cancelled`、`expired` 与成功/失败一样视为终态，不再继续轮询。
- 刷新后自动恢复最近的 `queued` 或 `running` 任务；也可在历史列表手动点击“恢复轮询”。
- 本地历史不是服务端数据库：清除站点数据、换浏览器或换设备后不可见。

## 连续视频链路

任务八提供三段连续生成控制：

```text
初始图片
  → 创建第 1 段（return_last_frame: true）
  → 第 1 段 last_frame_url
  → 创建第 2 段
  → 第 2 段 last_frame_url
  → 创建第 3 段
```

- 三段严格串行，前一段成功且同时返回视频和尾帧后才创建下一段。
- 每段有独立任务 ID、历史记录、结果链接和创建/状态日志。
- 连续生成使用独立费用确认，明确显示会创建的真实任务数量。
- 连续链路运行期间锁定连接与参数。关闭或刷新页面会保留已经创建的任务，但不会自动创建尚未开始的后续段。

## 模板预填

模板资产库中的可运行案例复用同一预填入口。模板只负责设置
`selectedExampleTitle` 和完整 Request Body；连接配置、费用确认、创建、轮询、
历史与日志仍由本任务执行器负责。模板分类切换和“复制提示词”不触发真实 API。
影视与营销模板也走这一入口；素材不完整时会带入明确类型的空 URL 素材位，
因此完整 Request Body 可继续编辑，但真实执行按钮保持禁用。

## 费用边界

页面加载、字段编辑、构建、单元测试与模拟上游测试不会创建真实任务。只有同时满足以下条件才允许执行：

1. 连接信息和请求字段通过前端校验。
2. 用户勾选“理解会消耗额度或产生费用”。
3. 用户点击“执行真实视频生成任务”。

当前代码已接通流程，但项目记录中不能把测试通过写成真实任务已成功；只有获得真实任务 ID 和终态后才能更新 Step 3 验收状态。
本次 Seedance 2.5 自动化验证只使用模拟上游，不代表账号已开通模型、真实任务已成功或计费链路已验证。真实调用还要求账号余额或资源包满足官方开通条件，并再次完成费用确认。
