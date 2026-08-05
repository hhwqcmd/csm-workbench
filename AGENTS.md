# AGENTS.md

## 当前项目定位

本项目是火山方舟 API 演示与模板资产平台，包含七个平级顶层栏目：

1. **模板资产库**：浏览提示词与场景模板，并以本机索引管理保存到私有 TOS 的视频、图片和音频素材。
2. **Seedance**：配置官方 API 或 Agent Plan、审核完整请求、创建异步任务、查看结果/历史/日志，并显式保存成功视频到素材库。
3. **Seedream**：覆盖官方图片教程的十类非故事书示例，提供 Prompt 优化、完整 API、结果、历史、日志和图片素材保存。
4. **Responses API**：覆盖文本、多轮、推理、多模态、Function、内置工具、缓存与结构化输出，联动展示完整输入/输出协议、SSE、历史和脱敏日志。
5. **Managed Agents**：创建或更新 Agent、配置 Agent 环境，并统一管理 Session 生命周期、事件流、文件挂载与持久化记忆。
6. **LLM 趋势**：以日期快照展示 Seed、Seedance、Seedream 主力模型，并对比各厂商最新文本旗舰的价格、参数、编程、长程、Agent benchmark 与第三方榜单。
7. **AI coding**：以存量接口变更为贯穿案例，演示“规格 → 知识 → 计划 → 护栏执行 → 验收 → 回流”的企业 AI coding 闭环；四个承载栏目仍为 Agent 资产管理、项目资产、代码质量门禁与模拟组织效能指标，不绑定具体产品。

官方 Python 快速示例作为协议和素材基线独立保留，不是产品页面主线。页面不得重新加入共学进度、环境安装步骤或教程路线。

当前事实（最后核对：2026-08-05）：

- 默认连接为标准官方 API + `doubao-seedance-2-0-mini-260615`，同时支持 Agent Plan 套餐通道。
- 生产 Sites 项目使用 `.openai/hosting.json` 中既有 `project_id`，访问策略为公开直达。
- 应用入口不要求登录；`app/chatgpt-auth.ts` 是未被引用的托管认证遗留代码，不得据此重新接回登录。
- 任务历史和演示凭证只保存在当前浏览器，不是跨设备或服务端审计记录。
- TOS 素材文件使用固定 `demo/` 前缀；素材索引只保存在当前浏览器，不使用 D1/R2，也不从 TOS 反向列举。
- 生产站公开直达，素材保存与手动上传接口按已确认方案不做写鉴权；输入校验不能消除公开写入带来的存储、流量与滥用风险。

## 模块地图

- `app/page.tsx` → `app/components/WorkspaceShell.tsx`：页面入口、顶级栏目和整体组合。
- `app/components/SeedanceTaskRunner.tsx`：连接、参数、完整 API 编辑、费用确认、创建、轮询、历史和日志。
- `app/components/SeedreamWorkbench.tsx`：十类 Seedream 示例的表单/JSON 双向编辑、Prompt 技巧与 Seed-Evolving 优化、同步/流式结果、费用确认、历史和日志。
- `app/lib/seedream-examples.ts`、`app/lib/seedream-server.ts`：Seedream 示例、模型能力适配、严格字段/素材/尺寸校验与同源上游代理。
- `app/api/seedream/`：图片生成和 Prompt 优化同源路由。
- `app/components/ResponsesWorkbench.tsx`：Responses API 八类场景、表单/JSON 联动、生命周期操作、SSE、响应、完整协议目录、历史与日志。
- `app/lib/responses-examples.ts`、`app/lib/responses-server.ts`、`app/api/responses/route.ts`：示例与字段目录、标准 Base URL 白名单、请求校验、同步/流式代理和生命周期入口。
- `app/components/ManagedAgentsWorkbench.tsx`：Managed Agents 三步表单；第 3 步含 Session 生命周期、事件、Files/Resources、TOS 与 Memory Store/Memory 管理；三步都展示完整 API 与响应，并负责资源 ID、SSE、历史与日志。
- `app/components/LlmTrendsWorkbench.tsx`：Seed / Seedance / Seedream 与同赛道型号对比表、九项单项 benchmark、Arena / Artificial Analysis 快照与来源台账；纯静态展示，不调用任何模型。
- `app/components/AiCodingWorkbench.tsx`：产品中立的六步交付演示、Agent 执行护栏、分层知识生命周期、规格驱动质量门禁、任务后学习闭环、18 个可复制生产模板及模拟组织指标；仅效能区展示模拟数据。
- `app/lib/ai-coding-data.ts`、`app/api/ai-coding/metrics/route.ts`：模拟组织、团队与指标快照，以及只读同源指标接口；不接入真实研发数据平台。
- `app/lib/managed-agents-server.ts`：Managed Agents 标准 Base URL、Agent/环境/Session/文件/Memory 全字段校验、生命周期代理与 SSE 转发。
- `app/api/managed-agents/`：Agent、环境、Session、事件流、Files、Session Resources 与 Memory 的专用同源路由；`messages` 仅保留旧页面兼容。
- `app/lib/seedance-config.ts`：两条 API 路径、模型清单、默认模型和比例。
- `app/lib/seedance-server.ts`：服务端白名单校验、上游请求、响应归一化和错误脱敏。
- `app/api/seedance/tasks/route.ts`、`status/route.ts`：创建与查询的同源服务端入口。
- `app/lib/seedance-examples.ts`、`SeedanceExampleGallery.tsx`：八个官方示例及连续生成计划。
- `app/lib/template-assets.ts`、`TemplateAssetLibrary.tsx`：四类模板、十个场景预填案例，以及视频/图片/音频素材的本机索引、预览和手动上传。
- `app/lib/material-assets.ts`、`app/lib/materials-server.ts`、`app/api/materials/`：素材元数据契约、本地存储、固定 TOS 配置、TOS4 签名、远程结果导入、文件上传和私有对象临时预览。
- `app/globals.css`、`app/layout.tsx`：视觉规则、响应式布局和站点元数据。
- `official-quickstart/`：官方 Python 基线；关键入口为 `python/demo_standard.py`。
- `start_workbench.sh`：本地启动与环境检查，不安装依赖、不打开浏览器、不调用真实 API。
- `worker/`、`build/`、`vite.config.ts`：vinext/Cloudflare Worker 适配层。
- `db/`、`drizzle/`、`examples/d1/`：未启用的持久化样例与预留层。
- `tests/rendered-html.test.mjs`：页面契约、服务端边界和安全回归测试。

核心依赖方向：

`示例/模板 → SeedanceTaskRunner → 同源 API 路由 → seedance-server → 火山方舟 API`

`ManagedAgentsWorkbench → /api/managed-agents/* → managed-agents-server → 火山方舟 Managed Agents API`

`ResponsesWorkbench → /api/responses → responses-server → 火山方舟 Responses API`

`Seedance / Seedream / TemplateAssetLibrary → /api/materials/* → 私有 TOS demo/ → 浏览器本机素材索引`

`official-quickstart → volcenginesdkarkruntime → 火山方舟 API`

`app/` 不得导入 Python 示例；二者只共享协议认知和公开素材。

## 文档路由

- 模块、数据流、安全边界：`docs/architecture.md`
- 当前有效的架构取舍：`docs/decisions.md`
- 真实 API 验证记录：`docs/validation-log.md`
- Python 环境与重建：`docs/environment.md`
- 创建、轮询、历史和日志：`docs/task-runner.md`
- Seedream 十类图片示例、Prompt 优化、流式输出与安全边界：`docs/seedream.md`
- Responses API 八类场景、完整协议、缓存、工具、SSE 与生命周期：`docs/responses-api.md`
- Managed Agents 三步协议、Session 生命周期、SSE、文件挂载、持久化记忆与日志：`docs/managed-agents.md`
- LLM 趋势数据口径、模型范围与更新流程：`docs/llm-trends.md`
- AI coding 最佳实践、模拟指标口径与 API：`docs/ai-coding.md`
- 八个官方示例与模型限制：`docs/official-examples.md`
- 四类模板与素材待补规则：`docs/template-library.md`
- 官方资料入口：`docs/README.md`
- 原共学过程：`docs/tutorial-roadmap.md`，仅作历史归档，不代表当前路线。

模型、能力、计费或输入限制可能变化。修改相关逻辑前必须重新核对官方文档，不能把本文件中的日期快照当成永久事实。

## 关键约束

- 标准 API 使用 `/api/v3`、日期版本模型 ID 和普通方舟 Key；Agent Plan 使用 `/api/plan/v3`、套餐别名和专属 Key，三者不得混用。
- 默认路径是标准 API；不要因早期项目曾优先考虑 Agent Plan 而改写当前默认值。
- 浏览器不得直连火山方舟。Key 只能随同源 POST 临时到达服务端并立即转发，不得持久化、缓存、记录或回显。
- 服务端只允许两组精确 Base URL，不得改造成任意主机代理。
- 演示模式可按路径把 Key 保存到当前浏览器 `localStorage`；关闭记住模式时必须删除已保存凭证。
- 历史最多保留 30 条；提交开始即建档，创建失败也保留，创建与查询日志中的 Authorization 必须掩码。
- 轮询继续使用 POST 请求体，禁止把 Key 放入 GET URL；连续 `running` 依靠 `pollCycle` 重调度。
- 页面加载、模板预填、构建、测试和健康检查绝不能创建真实任务。真实创建必须通过费用确认和显式执行。
- 普通素材仅允许公网 HTTPS；预置虚拟人像只额外允许严格的 `asset://asset-*`。
- 4K 只使用完整模型；联网搜索只允许纯文本；首尾帧必须保留 `first_frame` / `last_frame` 角色。
- 连续视频必须串行，并在取得上一段 `last_frame_url` 后才能创建下一段。
- Seedream 默认使用 `doubao-seedream-5-0-pro-260628`；组图、联网和流式按官方能力限制使用 Lite。Prompt 一键优化固定调用 `doubao-seed-evolving`，不能与图片 API 的 `optimize_prompt_options` 混为一谈。
- Seedream 图片只允许公网 HTTPS URL 或受控图片 Base64；Pro 最多 10 张参考图，Lite 最多 14 张，组图输入与输出合计最多 15 张。故事书/连环画附录不进入产品。
- Seedream 真实图片生成必须费用确认；Prompt 优化只在显式点击时调用。页面加载、示例切换、构建与自动化测试不得产生真实调用。
- Responses API 只使用标准 `https://ark.cn-beijing.volces.com/api/v3` 与普通方舟 Key。所有创建、查询、Input Items 和删除操作必须经同源 POST，不能开放任意 Base URL。
- AI coding 栏目只使用仓库内模拟组织与指标数据；同源 GET 接口不得接入员工身份、真实代码内容、会话 Prompt、凭证或生产效能平台。页面不得把模拟数据表述为真实客户成效。
- Responses 创建必须费用确认，永久删除必须不可逆确认；缓存要求 `store=true`，前缀缓存还要求 `stream=false`，且缓存不能与非 Function 内置工具混用。
- Responses 历史最多保留 30 条并仅存当前浏览器；Authorization、MCP headers、Token、Secret 与 Password 必须脱敏。自动化测试只允许模拟上游。
- Managed Agents 只使用标准 `https://ark.cn-beijing.volces.com/api/v3` 与普通方舟 Key，不支持 Agent Plan Base URL。
- Managed Agents 创建模式默认模型为 `doubao-seed-evolving`；Skills、Tools、MCP、Multi Agent 均为选填且默认不进入 Request Body，必须由用户添加后展开。创建响应的 Agent / Environment / Session ID 必须自动联动，不得使用伪造占位 ID 发起下一步。
- UpdateAgent 使用 `POST /agents/{agent_id}` 并必须携带当前 `version`；成功后要采用响应的新版本。`skills` 为整组覆盖，不能把用户的“新增一个 Skill”误实现为丢失既有 Skills。
- 创建或更新 Agent 后必须在第 1 步直接展示 HTTP 状态和完整脱敏响应，同时把请求/响应写入浏览器历史日志；失败响应也不能静默丢弃。
- `mcp_servers.name` 在 Agent 内唯一，并必须与 `mcp_toolset.mcp_server_name` 一一对应；MCP 用户凭证不进入 Agent 定义，应在 Session 通过 Vaults 注入。
- Multi Agent 只允许一层协调，最多 20 个成员；协调器不能作为其他协调器的子 Agent。
- Session 事件必须先连接 `/events/stream`，再 POST 用户事件；收到 `session.status_idle` 时主动结束本地读取。顺序不能反转，否则会漏掉连接前产生的事件。
- Session 管理只开放创建、检索、列出、事件与删除；官方当前不支持运行时更新 Session 字段，不得伪造 UpdateSession。
- 创建 Session 的 `agent` 支持最新版本字符串或固定版本对象，`vault_ids` 为选填；检索、列表、删除不发送上游 Request Body。
- 删除 Session 永久移除记录、事件和关联沙箱，必须由用户勾选不可逆确认；running 状态不能删除。自动化测试不得调用真实删除。
- Session 事件支持 message、interrupt、tool_confirmation；`system.message` 只能紧随 user.message 且为数组最后一项；多模态来源只允许协议明确的 HTTPS URL、file ID、base64 或文档内联文本。
- Files 上传固定 `purpose=agent`，成功返回的 `file_id` 与 Session 内 `resource_id` 不得混用；Session 创建可挂载 file、TOS 目录和 Memory Store，运行中仅允许动态添加 file。
- 文件 `mount_path` 必须是安全相对路径；TOS `tos_key` 必须是以 `/` 结尾的目录且与 Managed Agents 同账号。单 Session 最多 100 个文件资源。
- Memory Store 只能在创建 Session 时挂载，单 Session 最多 10 个；Agent 对 `/mnt/memory/` 只读且需要 Agent Toolset。单条 Memory 最大 100 KB，单 Store 最多 2,000 条。
- Files、Memory 写入和所有删除操作必须由用户显式点击；页面加载、构建和自动化测试不得上传文件、写记忆或删除真实资源。
- Managed Agents 环境名在当前 project 内唯一；默认值必须避免重复，页面加载本身不得创建资源。
- 配置 Agent 环境当前只开放 `config.type=cloud`；`allow_mcp_servers`、`allow_package_managers`、`allowed_hosts` 仅属于 `limited` 网络模式，不得在 `unrestricted` 下静默转发。
- 环境依赖包只开放 `apt`、`cargo`、`gem`、`go`、`npm`、`pip` 六类；`config.env` 键名不得使用 `ARK_` 或 `VOLC_` 保留前缀。`scope` 仅为兼容性预留，不应解释为已启用的隔离能力。
- 环境不提供版本机制；需要修改定义时创建新环境并更新后续 Session 的 `environment_id`。每个 Session 仍拥有隔离沙箱和文件系统。
- 模板缺少素材时用空 URL 表达并显示“素材待补”；所有 URL 补齐前执行按钮必须禁用。
- TOS AK/SK 只能来自服务端环境变量；不得进入 `NEXT_PUBLIC_*`、浏览器、本机素材索引、源码、日志或错误响应。`.env.example` 只保留空凭证占位。
- 素材接口只允许固定 bucket、北京 Region、bucket Endpoint 和 `demo/` 前缀；对象键不得包含路径穿越，远程结果必须是公网 HTTPS，重定向逐跳复验。
- 图片、音频、视频默认分别限制为 20 MB、50 MB、200 MB；MIME 必须与素材类型匹配。自动化测试只使用模拟 TOS，不得真实上传。
- 清空浏览器素材索引不会删除 TOS 对象；当前产品不提供删除、TOS 反向扫描、跨设备同步或账号级素材隔离。

## 地雷与遗留区域

- `app/chatgpt-auth.ts` 当前未被引用。它是平台认证模板遗留，不代表站点需要登录；除非明确重新设计访问控制，否则不要接入或扩展。
- `db/`、`drizzle/`、`examples/d1/` 尚未启用。当前本地历史不需要数据库。
- `official-quickstart/python/preview.html` 会被官方脚本覆盖。
- `setup_mac.sh` 会创建或更新 `.venv` 和 `run_demo.sh`；运行后检查生成内容，不要自动接着运行示例。
- 官方 Python 示例未显式设置 Agent Plan Base URL，不能直接配 Agent Plan Key 使用。
- 不要删除 `pollCycle`、历史旧格式兼容或远端 `taskId` 与本地记录 `id` 的区分。
- 教程真人首尾帧可能触发隐私审核；不要重复提交同一失败素材或放宽安全校验。
- `.sample-section` 使用浅色前景，浅色卡片标题和规格必须显式设置深色。
- 管理 Agent 桌面端采用“宽表单 + 窄 API 详情”，基本信息及五组扩展配置使用独立分组卡片；1100px 以下必须恢复单列，不能让右侧粘性 API 面板遮挡字段。
- 配置 Agent 环境沿用“宽表单 + 窄 API 详情”，网络、依赖包与键值对编辑器必须分组；`limited` 专用字段只在选择后展开，移动端包管理器和键值对输入必须单列。
- 管理 Session 沿用“宽表单 + 窄 API 详情”；七种模式只展开相关字段，状态机必须常驻可见，查询/删除明确显示无 Request Body，Files 上传明确显示 multipart，移动端模式选择、资源卡片和状态卡片必须单列。
- `.env.example` 只能保留空占位符。
- 不手工修改或提交 `dist/`、`.next/`、`.wrangler/`、`node_modules/`、`.venv/`。
- `.openai/hosting.json` 的项目 ID 是不可改写的托管标识。

## 验证

在仓库根目录运行：

```bash
npm test
npm run lint
bash -n start_workbench.sh
./start_workbench.sh --check
python3 -m py_compile official-quickstart/python/demo_standard.py
bash -n official-quickstart/scripts/init_dev_env/setup_mac.sh
git diff --check
```

`npm test` 已包含构建；无需在它之前重复运行 `npm run build`。测试使用模拟上游，不能使用真实 Key。真实 API 验证必须取得用户对账号、额度、凭证和请求摘要的确认，并把结果记入 `docs/validation-log.md`。

## Sites 发布

- 始终复用 `.openai/hosting.json` 的既有项目，不创建或替换站点 ID。
- 发布前必须完成验证并提交准确源码；推送的分支头、保存版本的 `commit_sha` 和打包产物必须来自同一状态。
- 当前站点为公开访问；部署新版本属于公开生产发布，必须遵循 Sites 的公开部署审批要求。
- 访问模式是 Sites 外部状态，不写入或伪造在 `.openai/hosting.json`。若访问策略变化，同步更新本文件的“当前事实”。

## 提交规范

- 使用 Conventional Commits；一个提交只表达一个意图。
- PR 至少包含 `Why`、`What`、`Validation`；界面变化附 `Screenshots`，真实调用说明 `Security/Cost impact`。
- 禁止提交 API Key、私有结果 URL、用户素材或包含敏感信息的日志。
