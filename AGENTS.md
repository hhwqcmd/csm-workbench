# AGENTS.md

## 项目概览

本项目是 Seedance 2.0 视频生成演示工作台，目标有两个：

1. 在一个可讲解的界面中展示连接配置、完整请求、异步任务、结果和请求/响应日志。
2. 保留官方 Python 快速示例作为协议与素材基线，便于排查 Web 适配与官方行为的差异。

页面定位是“演示工作台”，不得重新加入共学进度、环境安装步骤或教程路线等主流程内容。

## 模块地图

- `official-quickstart/`：官方压缩包的解压副本，是 Python 快速入门基线。
  - 关键入口：`python/demo_standard.py`。
  - 环境入口：`scripts/init_dev_env/setup_mac.sh` 和 `setup_windows.bat`。
  - 职责：验证官方 SDK 调用链；不要把 Web 工作台逻辑直接塞进这里。
- `app/`：演示工作台的产品界面。
  - 关键入口：`app/page.tsx`。
  - 双路径选择、任务参数、完整 API 编辑、费用确认、执行、轮询、历史与日志 UI：`app/components/SeedanceTaskRunner.tsx`。
  - 七个官方示例的提示词、素材、参数、模型选择和连续生成计划：`app/lib/seedance-examples.ts`。
  - 示例卡片与“填入参数”入口：`app/components/SeedanceExampleGallery.tsx`。
  - 路径、模型、比例和官方示例默认值：`app/lib/seedance-config.ts`。
  - 服务端校验、上游请求与错误脱敏：`app/lib/seedance-server.ts`。
  - 创建任务入口：`app/api/seedance/tasks/route.ts`。
  - 查询任务入口：`app/api/seedance/tasks/status/route.ts`。
  - 全局视觉与响应式规则：`app/globals.css`。
  - 元数据与页面语言：`app/layout.tsx`。
  - 真实 API 调用必须经同源服务端入口；浏览器不得直连火山方舟。
- `start_workbench.sh`：本地 Web 工作台启动入口。负责检查 Node.js、端口和依赖后以前台进程启动开发服务器；不得在此脚本中加入自动安装、浏览器操作或真实任务调用。
- `worker/`、`build/`、`vite.config.ts`：vinext/Cloudflare Worker 运行与构建适配层。
  - 只有新增服务端路由、持久化或托管能力时才进入这里。
- `db/`、`drizzle/`：预留的 D1/Drizzle 数据层。
  - 当前任务历史只需浏览器本地持久化，不启用服务端数据库；未经明确需求不要启用。
- `tests/`：服务端渲染与安全回归测试。
- `docs/`：背景、路线、架构与决策记录。规则留在本文件，细节放入 docs。

依赖方向：

`SeedanceTaskRunner` → `/api/seedance/tasks[/status]` → `seedance-server` → 火山方舟 API  
`official-quickstart/` → `volcenginesdkarkruntime` → 火山方舟 API  
`tests/` → 构建产物与页面契约  

`app/` 不得依赖或导入 `official-quickstart/` 的 Python 文件；二者共享的是协议认知，不共享运行时。

## docs 入口索引

- 需要理解模块边界、数据流或安全边界：读 `docs/architecture.md`。
- 需要检查或重建 Python 环境：读 `docs/environment.md`。
- 需要理解真实任务创建、轮询和密钥传递边界：读 `docs/task-runner.md`。
- 需要修改七个官方示例、首尾帧/连续生成逻辑或判断 Mini / 完整模型能力：读 `docs/official-examples.md`。
- 需要回到官方原始说明：从 `docs/README.md` 的官方链接进入。
- 需要修改模型参数或输入限制：先查官方教程最新版本，再更新本地决策记录；不要只凭示例代码推断。

## 非显而易见的工具和环境选择

- 官方样例固定使用 Python 3.12，并由 `uv` 创建 `.venv`、安装 `volcengine-python-sdk[ark]`。
- 当前已验证的本地环境是 Python 3.12.13、uv 0.11.26、`volcengine-python-sdk` 5.0.42；版本变化时先更新 `docs/environment.md`，不要假设环境仍一致。
- Web 工作台使用 Node.js `>=22.13.0`、vinext 与 Cloudflare Worker 兼容 ESM 输出。
- 本地 Web 预览优先通过 `./start_workbench.sh` 启动，底层仍是 `npm run dev`；默认端口 3001，可用 `SEEDANCE_WORKBENCH_PORT` 覆盖。托管声明位于 `.openai/hosting.json`。
- 工作台同时支持标准 API 与 Agent Plan。默认是标准 API + `doubao-seedance-2-0-mini-260615`；Agent Plan Base URL 固定为 `https://ark.cn-beijing.volces.com/api/plan/v3`。
- `AGENT_API_KEY` 是 Agent Plan 专属 Secret。普通方舟 API Key 或 Coding Plan API Key 不能混用。禁止使用 `NEXT_PUBLIC_` 前缀，禁止写入源码、测试快照、URL、Cookie、日志或服务端渲染回显。
- 工作台按演示需求提供 API Key 手工输入、显示/隐藏和“在当前浏览器记住”控件。记住模式默认开启，将标准 API 与 Agent Plan 的 Key 分别存入当前浏览器 `localStorage`；只适合受控的个人演示设备。关闭记住模式时必须删除已保存凭证。
- 任务历史最多保留 30 条，存于当前浏览器 `localStorage`；每次点击提交立即建档，成功与失败创建都保留，并追加创建/查询的请求响应日志。刷新后恢复最近的排队/运行任务并继续轮询。它不是跨设备、跨浏览器或服务端审计记录。
- 历史日志中的 Authorization 只能保存掩码，不能保存完整 Key；响应允许保存任务 ID、状态、脱敏错误和结果 URL。
- 手工输入的 Key 会随同源 POST 请求短暂到达服务端适配层并直接转发给火山方舟；服务端不得持久化、缓存、记录或回显。任务轮询也使用 POST 请求体，禁止把 Key 放入 GET URL。
- 服务端只允许两组精确 Base URL：标准 API `/api/v3` 与 Agent Plan `/api/plan/v3`。不得把工作台改造成可代理任意主机的通用转发器。
- 模型选择器按 API 路径维护两组官方当前清单：标准 API 使用带日期版本的 Model ID，Agent Plan 使用套餐别名。新增、下线或弃用状态必须以最新官方模型列表与 Agent Plan“接入视觉模型”文档为准。
- Agent Plan 模型使用套餐别名（当前目标为 `doubao-seedance-2.0`），不要直接沿用标准教程的日期版本 ID `doubao-seedance-2-0-260128`。
- 一般素材 URL 必须公网可访问；官方预置虚拟人像可使用严格的 `asset://asset-*` ID。换成自有素材时，优先使用 TOS 并按实际安全要求配置访问策略。
- Mini 支持多模态、编辑和延长，优先用于示例一至三；4K 仅完整 `doubao-seedance-2-0-260128` 支持。联网搜索只允许纯文本并使用 `tools: [{"type":"web_search"}]`。
- 首尾帧图片角色必须分别是 `first_frame`、`last_frame`。连续生成按官方示例使用完整模型和 `return_last_frame: true`；只有收到 `last_frame_url` 后才能创建下一段。

## 架构意图和历史决策

- 2026-07-24：保留官方快速示例为独立基线，Web 工作台另行演进。原因是便于逐步对照教程、隔离官方代码与产品代码，并在改造失败时保留可验证路径。
- 2026-07-24：先做只读演示，再接真实 API。原因是用户需要理解每个阶段，且密钥、计费和外部任务创建都应晚于前置条件确认。
- 2026-07-24：不在浏览器直接调用火山方舟。原因是浏览器会泄露 API Key；未来调用必须通过服务端适配层。
- 2026-07-24：当前不启用 D1/R2。教程主路径不需要持久化，避免在学习阶段引入无关基础设施。
- 2026-07-24：用户明确选择 Agent Plan。项目适配层将使用 Agent Plan 专属 Key、`/api/plan/v3` Base URL 和套餐模型别名；官方快速示例继续保留标准 API 基线，避免混淆来源。
- 2026-07-24：用户要求同时演示标准 API 与 Agent Plan API。工作台提供双路径配置器和可显示的 Key 输入；真实提交仍必须通过同源服务端适配层。
- 2026-07-24：模型改为路径联动下拉框。标准 API 当前列出 6 个模型，Agent Plan 当前列出 4 个套餐别名；Seedance 1.5 Pro 保留但显式标注“即将下线”。
- 2026-07-24：Python 环境按“先解释、后安装、再验证”拆成小步。安装脚本只负责本地 Python 3.12 `.venv`、SDK 和启动脚本，不得在同一步运行示例或创建计费任务。
- 2026-07-24：官方安装脚本执行成功并通过 Python 版本、SDK 导入与启动脚本检查；继续停在真实 API 调用之前。
- 2026-07-24：将 `run_demo.sh` 之后的创建、30 秒轮询和结果展示流程等价实现为 Web 同源服务端调用。Web 不启动本地 Python 子进程，原因是 Worker 托管环境不能依赖本地 shell，且协议级适配更易校验 Base URL、模型和密钥边界。
- 2026-07-24：真实执行必须经过独立费用确认复选框；页面加载、参数编辑、构建与测试均不得创建真实任务。
- 2026-07-24：为方便受控设备上的现场演示，默认允许把两条 API 路径的 Key 分别记在当前浏览器，并提供明确开关；Key 仍不得进入源码、URL、Cookie、SSR HTML、服务端持久化或日志。
- 2026-07-24：任务历史改为浏览器本地保存，最多 30 条；刷新后自动恢复最近的活跃任务。选择本地持久化而非 D1，是因为当前只需单机演示恢复，不需要账号体系或跨设备同步。
- 2026-07-24：活跃任务轮询由 `pollCycle` 显式驱动。上游持续返回相同的 `running` 状态时也必须安排下一轮；临时查询错误只提示并重试，不能直接把远端任务判为失败。
- 2026-07-24：官方 API 真实任务 `cgt-20260724165550-rwll7` 成功返回结果；创建后与终态后刷新均验证历史和结果入口可恢复。私有结果 URL 不进入文档或版本库。
- 2026-07-24：页面从“共学工作台”重构为纯演示工作台，官方示例素材位于实操控制台之前；环境安装与教程进度不再进入产品页面。
- 2026-07-24：默认连接改为官方 API + `doubao-seedance-2-0-mini-260615`；切换回官方路径也回到该默认模型。
- 2026-07-24：提交前新增完整 API 详情。Method、URL、Headers 实时展示，Request Body 可编辑并通过显式“应用参数”回写上方表单，避免两套参数状态漂移。
- 2026-07-24：每次点击提交先创建本地历史记录，再发起网络请求；每轮创建和状态查询都追加脱敏的请求/响应日志，因此没有取得远端 task ID 的失败提交也可复盘。
- 2026-07-24：官方示例扩展为编辑、多模态参考、延长、4K 与联网搜索五项，统一由 `seedance-examples.ts` 提供整份请求体和“填入参数”行为。
- 2026-07-24：请求状态从固定“一图一视频”升级为通用多模态数组；服务端仍只转发显式白名单字段，并额外限制素材数量、4K 模型和联网搜索纯文本输入。
- 2026-07-24：五个官方示例均通过标准 API 真实验证并到达 `succeeded`。任务一至三与任务五使用 Mini；任务四因 4K 限制使用完整模型。刷新后确认 5 条历史、结果入口和结构化日志均可恢复。
- 2026-07-24：视觉语言统一为“深色演示区 + 浅色操作区 + 荧光绿状态强调”。官方示例使用 6 栏响应式卡片网格，标题与规格在卡片内显式使用深色，不再继承深色 section 的浅色前景；这项显式颜色约束用于保证白色、荧光绿和浅色功能卡上的可读性。
- 2026-07-24：新增“使用预置虚拟人像”作为第六个官方示例；预置人物由 `asset://asset-*` 传入，服务端仅为这种严格格式开例外，不把素材校验放宽成任意协议转发。
- 2026-07-24：第六个预置虚拟人像示例使用 Mini 通过标准 API 真实验证并到达 `succeeded`；刷新后确认 6 条历史、结果入口和 7 条结构化日志可恢复，Authorization 仍为掩码。因此该示例无需切换完整模型。
- 2026-07-25：新增 `start_workbench.sh` 作为本地演示统一启动入口。脚本只做环境检查并以前台进程启动开发服务器，不自动安装依赖或打开浏览器，避免现场演示时产生隐藏下载、后台残留进程或意外外部操作。
- 2026-07-27：新增第七个“图生视频-基于首尾帧（含音频）”示例，并把官方“生成多个连续视频”实现为三段串行链路。选择串行而非并发，是因为下一段必须依赖上一段返回的尾帧；每段仍作为独立历史与日志记录，便于逐段复盘费用和失败点。
- 2026-07-27：标准官方 API 真实验证中，教程自带女孩首尾帧被当前真人隐私审核拒绝，但替换为已通过审核的官方插画与连续任务尾帧后，相同首尾帧角色、5 秒、`adaptive`、有声请求成功。三段连续任务全部成功并逐段返回视频和尾帧，证明 `return_last_frame` 依赖传递有效。

## 地雷

- `official-quickstart/python/preview.html` 会被 `demo_standard.py` 每次运行时覆盖；不要把手工改动放在该文件。
- 官方示例会在未检测到环境变量时交互式询问 API Key。自动化或演示脚本中应预先注入进程环境，且不得记录输入。
- `setup_mac.sh` 会创建或更新 `official-quickstart/.venv` 和 `official-quickstart/run_demo.sh`；运行前先确认目标目录，运行后检查生成脚本，不要紧接着自动执行它。
- 官方示例中的模型开通/区域链接可能与当前控制台区域不一致；创建真实任务前以最新官方教程和当前账号控制台为准。
- 官方示例的 `Ark(api_key=api_key)` 未显式指定 Agent Plan Base URL，并使用标准日期版本模型 ID；直接传入 Agent Plan Key 不代表会自动切换到套餐通道。
- Agent Plan 调用地址必须包含 `/plan`。误用标准 `/api/v3` 可能调用失败或产生套餐外费用。
- 不要把 `/api/seedance/tasks/status` 改成携带 Key 的 GET 查询参数；URL 可能进入浏览历史、访问日志和监控。
- 任务处于 `queued` 或 `running` 时不能清空或切换连接配置，否则后续轮询会失去凭证或查询到错误通道。当前 UI 会锁定相关字段；记住模式关闭时，刷新页面后无法自动恢复轮询。
- 不要删除 `SeedanceTaskRunner` 的 `pollCycle` 重调度逻辑。仅依赖任务状态变化会在上游连续返回 `running` 时停止轮询。
- 浏览器历史只记录启用该功能后的任务；改造前已因刷新丢失的任务若没有 task ID，无法从前端恢复。
- 任何调试输出都不得记录 API Key 或完整 Authorization 请求头；浏览器本地保存是明确的演示便利选项，不代表可以放宽服务端日志边界。
- `.sample-section` 的默认前景是浅色，示例卡片却是浅色背景。修改示例卡时必须保留 `.example-card h3/dd/p` 的显式深色前景；只依赖继承会再次造成低对比度。
- 预置虚拟人像的 Asset ID 必须放在 `content.image_url.url`，提示词仍按素材顺序称“图片1”；不要把 Asset ID 写进提示词，也不要把 `asset://` 放宽成任意资源协议。
- 不要把首尾帧图片重写成普通 `reference_image`；角色丢失会改变生成模式。连续链路的单首帧输入按官方代码省略 role，并必须同时请求 `return_last_frame: true`。
- 教程自带 `seepro_first_frame.jpeg` / `seepro_last_frame.jpeg` 在 2026-07-27 真实调用中触发 `InputImageSensitiveContentDetected.PrivacyInformation`。保留它们作为官方协议基线，但排查失败时先查看结构化日志；不要反复重试同一真人素材，也不要为绕过审核而放宽校验。
- 连续链路不能并发创建，也不能在上一段失败或缺少 `last_frame_url` 时继续。页面刷新会保留已经创建的任务，但不会自动补建尚未开始的后续段。
- 历史记录的 `id` 是本地稳定记录 ID，远端任务号在 `taskId`；不要再假设两者相同。旧版记录没有 `taskId` 或 `logs` 时仍需兼容读取。
- `.env.example` 必须只保留空占位符；它被允许提交，严禁写入真实或看似真实的 Key。
- API 路由测试只能模拟火山方舟响应；禁止在 `npm test`、页面 SSR 或健康检查中使用真实 Key。
- `start_workbench.sh` 必须保持为纯本地启动入口；不得读取或注入 API Key，也不得把真实任务创建绑定到启动过程。
- `dist/`、`.next/`、`.wrangler/`、`node_modules/`、`.venv/` 是生成目录，不做手工修改，不提交。
- `.openai/hosting.json` 的站点 ID（产生后）是不可改写的托管标识；不得伪造、推导或替换。
- 未经明确需求不要修改 `app/chatgpt-auth.ts`、`worker/` 或启用 `db/`；它们是平台能力边界，不是本教程的当前步骤。

## 测试和验证

在仓库根目录运行：

```bash
npm run build
npm test
npm run lint
bash -n start_workbench.sh
./start_workbench.sh --check
python3 -m py_compile official-quickstart/python/demo_standard.py
bash -n official-quickstart/scripts/init_dev_env/setup_mac.sh
```

`npm test` 当前覆盖页面契约、模型清单、Base URL 拒绝、创建任务转发、轮询与密钥不回显。真实 API 验证仅在用户确认账号、额度、凭证和请求摘要后通过工作台执行；不能把它当普通单元测试。

## 提交规范

- 提交信息使用 Conventional Commits，例如：
  - `docs: record Seedance setup decisions`
  - `feat(workbench): add task status panel`
  - `test: cover server-side secret boundary`
- 一个提交只表达一个意图；不要把教程资料同步、界面改造和无关格式化混在一起。
- PR 描述至少包含：`Why`、`What`、`Validation`、`Screenshots`（界面变化时）、`Security/Cost impact`（涉及密钥或真实任务时）。
- 提交前至少运行 `npm test`、`npm run lint`、Python 语法检查和 shell 语法检查。
- 禁止提交 API Key、真实任务私有 URL、用户素材或包含敏感信息的日志。
