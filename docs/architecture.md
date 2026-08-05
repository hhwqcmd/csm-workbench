# 架构说明

## 当前形态

项目保留两条并行但隔离的路径：

```text
官方验证路径
run_demo.sh
  → official-quickstart/python/demo_standard.py
  → volcenginesdkarkruntime
  → 标准火山方舟 Content Generation Tasks API（官方基线）

演示产品路径
浏览器
  → SeedanceTaskRunner
  → POST /api/seedance/tasks 或 /api/seedance/tasks/status
  → app/lib/seedance-server.ts
  → 标准 API 或 Agent Plan 白名单 Base URL
  → Content Generation Tasks API

Managed Agents 路径
浏览器
  → ManagedAgentsWorkbench
  → POST /api/managed-agents/{agents|environments|sessions|session-events|files|session-resources|memory}
  → app/lib/managed-agents-server.ts
  → 标准 API 白名单 Base URL
  → Managed Agents 资源 API 与 SSE 事件流

Seedream 路径
浏览器
  → SeedreamWorkbench
  → POST /api/seedream/jobs（创建 / 查询可恢复任务）
  → app/lib/seedream-jobs-server.ts + D1（24 小时短期状态）
  → app/lib/seedream-server.ts
  → 标准 API 白名单 Base URL
  → Image generation API

浏览器 Prompt 优化
  → POST /api/seedream/optimize-prompt
  → app/lib/seedream-server.ts
  → doubao-seed-evolving Chat Completions

Responses API 路径
浏览器
  → ResponsesWorkbench
  → POST /api/responses
  → app/lib/responses-server.ts
  → 标准 API 白名单 Base URL
  → Responses API（创建、检索、Input Items、删除与 SSE）

素材沉淀路径
Seedance / Seedream / TemplateAssetLibrary
  → POST /api/materials/import 或 /api/materials/upload
  → app/lib/materials-server.ts（固定配置、输入校验、TOS4 签名）
  → 私有 TOS demo/{video|image|audio}/
  → 浏览器 localStorage 元数据索引
  → GET /api/materials/object 临时签名预览

LLM 趋势路径
浏览器
  → LlmTrendsWorkbench
  → 构建期静态数据与外部来源链接
  → 不调用模型、不代理第三方榜单、不产生费用

AI coding 路径
浏览器
  → AiCodingWorkbench
  → 本地六步交付演示（规格 / 知识 / 计划 / 执行 / 验收 / 回流）
  → GET /api/ai-coding/metrics
  → app/lib/ai-coding-data.ts 仓库内模拟快照
  → 不接入真实研发数据、员工身份或外部效能平台
```

官方路径用于回答“API 是否按教程跑通”；产品路径用于回答“如何安全、清楚地向别人演示”。

## 为什么不直接复用 Python 页面

官方 `preview.html` 只是运行脚本时生成的临时素材预览：

- 它没有任务状态管理。
- 它会被每次运行覆盖。
- 它无法安全保管用于浏览器调用的 API Key。
- 它适合教学验证，不适合作为长期演示产品。

因此工作台重新实现展示层，但保留相同的提示词、素材与参数作为对照。

## 服务端适配层职责

当前服务端模块负责：

1. 接收浏览器本次手工输入的 Key，但不在服务端持久化、记录或回显。
2. Seedance 将 API 路径限制为标准 API 与 Agent Plan 两个精确 Base URL；Seedream、Responses API 与 Managed Agents 只允许标准 `/api/v3`。
3. 校验模型属于对应路径；Agent Plan 使用套餐别名，标准 API 使用日期版本 Model ID。
4. 校验通用 `content` 多模态数组、素材 URL、时长、比例、4K 模型限制与联网搜索纯文本限制。
5. 创建任务并只向浏览器返回必要的任务 ID。
6. 查询并归一化任务状态。
7. 对错误进行安全脱敏，避免返回 Secret 或内部日志。
8. Managed Agents 校验 Agent 创建/版本化更新的完整字段、Skills/Tools/MCP/Multi Agent 约束，以及云环境、Session、事件、文件资源与 Memory Store/Memory 结构；事件流必须先建立上游 SSE，再发送用户事件。
9. Seedream 校验 Pro/Lite 模型能力、图片公网地址、输入数量、尺寸、组图、联网、流式与图片 API Prompt 优化参数；真实生成先创建可恢复任务并把匿名令牌写入浏览器，再由独立 `run` 请求执行长调用，D1 只保存 24 小时状态、URL 结果和脱敏错误，API Key、Prompt、参考图与完整请求只存在于执行请求内存；Prompt 一键优化只使用服务端内置场景技巧调用 `doubao-seed-evolving`。
10. Responses API 校验完整顶层字段、InputItem 素材 URL、工具必填项、缓存互斥和生命周期 ID；同步 JSON 与 SSE 均在返回浏览器前执行凭证脱敏。
11. 素材接口固定 TOS bucket、Endpoint、Region 与 `demo/` 前缀，校验 MIME、大小、对象键和公网 HTTPS 重定向；图片在校验后以不超过 20 MB 的固定长度二进制请求体上传，视频和音频保持限流流式上传；TOS AK/SK 只用于服务端签名，不进入浏览器或错误响应。

浏览器负责收集参数、管理本机演示凭证、生成完整 API 预览、保存任务历史与脱敏日志、展示状态和播放结果。

按演示需求，浏览器也提供 API Key 临时输入框：

- 默认以密码形式遮蔽，可由用户主动切换显示。
- “在当前浏览器记住 API Key”默认开启，分别保存标准 API 与 Agent Plan 的 Key；关闭时删除已保存凭证。
- Key 不进入 URL、Cookie、SSR HTML、源码、服务端持久化或日志。
- 切换标准 API / Agent Plan API 时加载该路径独立保存的 Key，避免跨通道误用。
- 点击创建和每次轮询时，只能经同源 POST 请求交给服务端适配层；服务端不得回显 Key。
- 任务历史最多保存 30 条到当前浏览器；刷新时恢复最近的活跃任务并继续轮询。
- 每次点击提交先创建本地记录，再发起请求；创建失败但未取得远端任务 ID 的尝试仍可在历史中查看。
- 日志保存创建请求和后续状态查询的请求/响应。Authorization 只保存掩码，服务端仍不记录 Key。
- 八个官方示例集中定义在 `app/lib/seedance-examples.ts`；示例卡片通过显式事件把整份 Request Body 和可选连续生成计划交给实操台，避免页面展示值与实际请求分叉。连续生成是独立的任务八，不再依附任务七。
- `WorkspaceShell` 管理“模板资产库 / Seedance / Seedream / Responses API / Managed Agents / LLM 趋势 / AI coding”七个平级视图；无 Hash 默认展示模板资产库，视频示例与模板复用 `SeedanceTaskRunner`。
- 模板预填统一通过 `seedance:apply-example` 事件进入任务执行器；影视和营销模板允许用空 URL 表达缺失素材，执行器既有的 `requestReady` 校验会在补齐前阻止真实提交。
- 四类模板集中定义在 `app/lib/template-assets.ts`。提示词公式只提供复制；电商、影视和营销场景模板通过相同 `seedance:apply-example` 事件把整份 Request Body 交给实操台，缺失素材用空 URL 表达。
- 连续视频链路仍复用同一创建/查询 API；每段的 `last_frame_url` 只在上一段成功后作为下一段输入，不引入新的服务端代理入口。
- Managed Agents 最近 20 轮单独保存在当前浏览器；每轮记录三个资源 ID、三个步骤状态与各操作日志。Agent、环境与 Session 管理请求都记录实际 URL、完整脱敏请求、HTTP 状态和完整响应供现场展示。收到 `session.status_idle` 后页面主动结束 SSE 读取。
- Agent 创建默认只包含基本信息、`doubao-seed-evolving` 模型、system 与 metadata。Skills、Tools、MCP、Multi Agent 使用显式添加/移除控制，未添加时字段不会进入 Request Body。
- 配置 Agent 环境默认使用 `cloud` + `unrestricted`，依赖包、环境变量和 metadata 可按需添加/移除；切换为 `limited` 后才展开 MCP、包管理器联网开关和主机白名单。每个 Session 使用独立沙箱，环境本身不做版本化。
- 管理 Session 把生命周期、事件、文件与持久化记忆收敛在第 3 步；浏览器仍只向同源路由 POST 凭证，服务端根据操作转发为上游 POST / GET / DELETE。事件流单独分为“打开流”和“发送事件”两次同源请求，保证上游 SSE 先于事件建立。
- Files 上传使用同源 multipart 代理，服务端固定 `purpose=agent`，不接受浏览器指定任意 purpose。Session 创建可挂载 file、TOS 目录和 Memory Store；运行时资源路由只允许增删 file，避免伪造官方不支持的动态 Memory Store 挂载。
- Memory Store 与 Memory 内容通过独立同源路由管理。浏览器只保留当前演示所需的资源 ID，服务端不保存文件内容、Memory 内容或 API Key；所有请求/响应继续进入浏览器脱敏日志。
- Seedream 十类示例集中定义在 `app/lib/seedream-examples.ts`。默认图片模型为 `doubao-seedream-5-0-pro-260628`；官方未支持 Pro 的组图、联网和流式场景显式切换为 Lite。Prompt 编辑框的一键优化调用 `doubao-seed-evolving`，并把当前示例的服务端可信技巧作为约束。
- Seedream 最近 30 次生成与优化操作单独保存在当前浏览器，Authorization 只保存掩码。浏览器另存一份匿名恢复令牌，刷新后查询 D1 中最长保留 24 小时的活跃任务；服务端任务表不保存 API Key、Prompt、参考图或完整请求。可恢复任务固定要求 `response_format=url`，Base64 结果仍只适用于兼容直连路由。
- Responses API 八类示例集中定义在 `app/lib/responses-examples.ts`；高频参数表单与完整 JSON 共享同一份 Request Body。最近 30 次操作单独保存在当前浏览器，流式事件保留原始时间线并提取文本，所有敏感字段在记录前脱敏。
- 素材库的“模板分类”和“素材库”平级；素材库按视频、图片、音频分栏。`app/lib/material-assets.ts` 只保存对象元数据和稳定对象键，原始生成 URL、文件内容、TOS 凭证与预签名 URL都不进入本地索引。

## 状态模型

工作台统一使用以下演示状态：

- `draft`：参数尚未确认。
- `submitting`：本地历史已建档，正在请求创建远端任务。
- `queued`：远端已接受任务。
- `running`：生成中。
- `succeeded`：生成完成，可展示结果 URL。
- `failed`：任务失败，展示脱敏后的原因与下一步建议。

## 安全与成本边界

- API Key 可按用户选择保存在当前浏览器 `localStorage`，并短暂进入同源请求体；不得进入 SSR HTML、构建产物、服务端持久化、URL、Cookie 或日志。
- Agent Plan Key、普通方舟 Key、Coding Plan Key 是不同凭证；选择的 API 路径必须与对应 Key 匹配。
- Agent Plan API 地址必须包含 `/plan`。创建任务完整地址为 `https://ark.cn-beijing.volces.com/api/plan/v3/contents/generations/tasks`，查询地址在其后追加 `/{id}`。
- 标准 API 完整创建地址为 `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks`。
- Managed Agents 资源与事件 API 固定在标准 `/api/v3`；Agent Plan 地址不开放给该模块。
- Seedream 图片生成与 Prompt 优化固定在标准 `/api/v3`；页面加载、示例切换和自动化测试不会产生图片或文本模型调用。刷新只使用匿名令牌查询已创建任务，不会重复创建计费请求。
- Responses API 创建、检索、Input Items 和删除固定在标准 `/api/v3`；真实创建与工具调用需要费用确认，永久删除需要单独确认，页面加载和自动化测试不会产生真实调用。
- 素材保存和上传是独立显式操作，不会再次调用 Seedance 或 Seedream。生产写接口当前无身份鉴权，公开访客可产生真实 TOS 费用；固定路径、大小、MIME 与 SSRF 校验只限制请求形态。
- LLM 趋势不接收 Key、不调用任何模型或榜单 API；来源链接只在用户主动点击后打开厂商或第三方页面。
- AI coding 指标接口只读取代码库中的模拟快照；页面加载只会发起同源只读 GET，不请求外部系统，也不收集开发者、仓库或会话级真实数据。
- 真实“创建任务”是外部写操作且可能产生费用，不与页面加载或普通测试绑定。
- 用户素材与 Memory 可能包含隐私或商业信息；Files 上传和 Memory 写入只在用户显式执行时发生，不进入应用服务端持久化或日志以外的副本。浏览器日志仍会记录用户主动提交的脱敏请求体，因此演示时不要使用敏感内容。
- 官方教程可能更新模型 ID、限流、输入数量和价格。执行真实任务前重新核对权威文档。
