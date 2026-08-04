# Managed Agents 演示工作流

## 产品定位

“Managed Agents”是与“演示工作台”和“模板资产库”平行的顶级栏目，用于完整演示火山方舟托管 Agent 的代码快速入门：

1. 管理 Agent（创建或更新）；
2. 配置 Agent 环境；
3. 管理 Session（生命周期、事件流、文件挂载与持久化记忆）。

页面不是通用 HTTP 代理。浏览器只调用同源 `/api/managed-agents/*`，由
`app/lib/managed-agents-server.ts` 校验并转发到
`https://ark.cn-beijing.volces.com/api/v3`。

## 官方协议映射

| 步骤 | Method | 上游路径 | 成功后的联动 |
|---|---|---|---|
| 创建 Agent | POST | `/agents` | 响应稳定 `id` 与初始 `version=1`，ID 自动填入会话 |
| 更新 Agent | POST | `/agents/{agent_id}` | 请求携带当前 `version`，成功后返回新版本 |
| 配置 Agent 环境 | POST | `/environments` | 创建云端环境；响应 `id` 自动填入会话的 `environment_id` |
| 创建 Session | POST | `/sessions` | 响应 `id` 自动进入后续 Session 操作 |
| 检索 Session | GET | `/sessions/{id}` | 返回状态、usage、Agent 与 Environment 快照 |
| 列出 Session | GET | `/sessions?agent_id=…&limit=…` | 按创建时间倒序返回 `data` 数组 |
| 打开事件流 | GET | `/sessions/{id}/events/stream` | 必须在发送事件之前建立连接 |
| 发送事件 | POST | `/sessions/{id}/events` | 支持消息、中断、工具确认和动态系统提示词 |
| 上传文件 | POST multipart | `/files` | 固定 `purpose=agent`，返回 `file_id` |
| 管理 Session 文件资源 | POST / GET / DELETE | `/sessions/{id}/resources[/{resource_id}]` | 运行中添加、列出或移除文件副本 |
| 查询 Session 产出文件 | GET | `/files?scope_id={session_id}` | 返回 Agent 在该 Session 中生成的文件 |
| 管理 Memory Store | POST / GET / DELETE | `/memory_stores[/{store_id}]` | 创建、列出或删除跨 Session 记忆容器 |
| 管理 Memory | POST / GET / DELETE | `/memory_stores/{store_id}/memories[/{memory_id}]` | 创建、浏览、读取、更新或删除记忆内容 |
| 删除 Session | DELETE | `/sessions/{id}` | 永久删除 Session、事件与关联沙箱 |

默认创建请求用于演示最小可用 Agent：

- 模型：`doubao-seed-evolving`
- 模型速度：`standard`
- Skills、Tools、MCP、Multi Agent：默认不传入，按需添加
- 环境：`cloud` + `unrestricted`
- 消息：生成前 20 个斐波那契数并写入 `fibonacci.txt`

环境名称在当前 project 内必须唯一。页面挂载时会给默认名称加入时间后缀；用户也可手工修改。

## 管理 Agent 全字段

第 1 步提供“创建 Agent / 更新 Agent”模式切换，结构化表单与完整 Request Body 双向联动：

| 字段 | 创建 | 更新 | 页面说明与约束 |
|---|---|---|---|
| `version` | 不传 | 必填 | 当前版本不匹配会失败；更新成功生成新版本 |
| `name` | 必填 | 选填 | 英文字母、汉字、数字，1–64 字符 |
| `description` | 选填 | 选填 | 不超过 300 字符 |
| `model.id` | 必填 | 选填 | 已开通的模型 ID |
| `model.speed` | 选填 | 选填 | `standard` 或 `fast` |
| `system` | 选填 | 选填 | 长期角色、边界与工作方式 |
| `skills[]` | 选填 | 选填 | `skill_hub` / `custom`、`skill_id`、`version`；最多 20 项 |
| `tools[]` | 选填 | 选填 | `agent_toolset_20260701`、`evolution`、`mcp_toolset` |
| `mcp_servers[]` | 选填 | 选填 | `type=url`、唯一 `name`、HTTPS `url` |
| `multiagent` | 选填 | 选填 | `type=coordinator`，最多 20 个 `agent` / `self` 成员 |
| `metadata` | 选填 | 选填 | 业务侧 `map<string,string>` |

更新请求允许只提交变化字段。右侧 JSON 编辑器可删除不变字段；结构化表单仍完整展示所有可配置项。`skills` 采用覆盖语义，只要更新请求包含 `skills`，就会整体替换旧数组。

### Skills、Tools、MCP 与 Multi Agent

- 四类字段均为选填项。默认只显示说明和“添加”入口，不进入 Request Body；选择添加后才展开条目编辑器，并可随时移除整个字段。
- 添加字段与新增条目分成两层操作：例如先“添加 Tools”，再按需新增内置、Evolution 或 MCP Tool；空数组也会如实显示在完整 API 详情中。
- Skills 用于复用专业知识、操作流程和最佳实践；单个 Agent 最多挂载 20 个。
- 内置工具集支持 Bash、Read、Write、Edit、Glob、Grep、Web Fetch 与 Web Search；`default_config.enabled` 控制默认状态，`configs[]` 按工具名覆盖。
- `evolution` 当前配置 `advisor`；显式开关写入 `configs[].enabled`。
- MCP Server 与同名 `mcp_toolset.mcp_server_name` 必须一一对应。Agent 只保存 Server 地址，终端用户凭证应在 Session 通过 Vaults 注入。
- Multi Agent 仅支持“协调器 → 子 Agent”一层委派；协调器最多配置 20 个不同子 Agent，并锁定子 Agent 版本。

官方依据：[Agent](https://docs.volcengine.com/docs/82379/2553716?lang=zh)、[Skills](https://docs.volcengine.com/docs/82379/2553717?lang=zh)、[Tools](https://docs.volcengine.com/docs/82379/2553719?lang=zh)、[MCP](https://docs.volcengine.com/docs/82379/2553718?lang=zh)、[Multi Agent](https://docs.volcengine.com/docs/82379/2553730?lang=zh)。

## 配置 Agent 环境全字段

第 2 步统一命名为“配置 Agent 环境”。它仍通过 `POST /environments`
创建可供多个 Session 复用的环境，但以结构化表单完整呈现当前云环境协议，
并与右侧 Request Body 双向联动：

| 字段 | 是否必填 | 页面说明与约束 |
|---|---|---|
| `name` | 必填 | 当前 project 内唯一的环境名称 |
| `description` | 选填 | 环境用途、依赖和适用 Agent 的说明 |
| `config.type` | 必填 | 当前演示范围固定为 `cloud` |
| `config.networking.type` | 必填 | `unrestricted` 或 `limited` |
| `config.networking.allow_mcp_servers` | 条件选填 | 仅 `limited` 时显示；是否允许访问 MCP Server |
| `config.networking.allow_package_managers` | 条件选填 | 仅 `limited` 时显示；是否允许包管理器联网 |
| `config.networking.allowed_hosts[]` | 条件选填 | 仅 `limited` 时显示；每行一个主机名或 IP，不填写协议与路径 |
| `config.packages.type` | 选填 | 添加依赖配置后可传 `packages` |
| `config.packages.apt[]` | 选填 | Debian/Ubuntu 系统包，每行一个，可固定版本 |
| `config.packages.cargo[]` | 选填 | Rust crate，每行一个 |
| `config.packages.gem[]` | 选填 | Ruby gem，每行一个 |
| `config.packages.go[]` | 选填 | Go module，每行一个 |
| `config.packages.npm[]` | 选填 | Node.js 包，每行一个，可使用 `name@version` |
| `config.packages.pip[]` | 选填 | Python 包，每行一个，可使用 `name==version` |
| `config.env` | 选填 | 环境变量 `map<string,string>`；键名不得使用 `ARK_` 或 `VOLC_` 保留前缀 |
| `metadata` | 选填 | 业务侧 `map<string,string>`，用于标记来源、负责人或场景 |
| `scope` | 选填 | `organization` / `account`；当前为兼容性预留字段，不代表已启用隔离能力 |

包依赖可在多个 Session 间复用缓存，但每个 Session 仍拥有隔离的沙箱与文件系统。
环境定义不提供版本机制；配置变化需要创建新环境并把 Session 切换到新的
`environment_id`。`limited` 专用字段不会在 `unrestricted` 模式下静默转发。

第 2 步与“管理 Agent”使用同一交付结构：

- 左侧按基本信息、网络策略、依赖包、环境变量和 metadata 分组编辑；
- 选填的依赖包、环境变量和 metadata 均可添加或移除；
- 右侧实时显示 Method、URL、脱敏 Authorization 和完整 Request Body；
- 执行后显示操作类型、HTTP 状态、接收时间和完整 API 响应；
- 成功与失败请求都进入最近 20 轮历史和脱敏日志。

官方依据：[配置 Agent 环境](https://docs.volcengine.com/docs/82379/2553721?lang=zh)、
[Create Environment API](https://docs.volcengine.com/docs/82379/2555922?lang=zh)。

## 管理 Session

第 3 步把原“开启会话”和“发送消息并流式传输响应”合并为一个管理环节，
提供七种互斥操作：

| 操作 | 可编辑字段 | 行为与限制 |
|---|---|---|
| 创建 | `agent`、`environment_id`、`vault_ids[]`、`resources[]` | Agent 可用字符串 ID 跟随最新版本，或对象形式固定 `id + version`；创建后为 `idle`，不会自动执行 |
| 检索 | `session_id` | 返回当前状态、累计用量、Agent 版本和 Environment 快照 |
| 列出 | `agent_id`、`limit` | `agent_id` 选填；`limit` 为 1–100，查询参数直接联动 URL |
| 事件与流 | `session_id`、事件类型及事件 Body | 先打开 SSE，再发送事件；收到 `session.status_idle` 后结束本地读取 |
| 文件与挂载 | 本地文件、`file_id`、`mount_path`、`resource_id`、`session_id` | 上传、运行时挂载/移除文件，或查询挂载资源与 Session 产出文件 |
| 持久化记忆 | Store / Memory 操作及其 ID、路径、内容 | 管理跨 Session 的 Store 与 Memory；挂载动作只允许在创建 Session 时完成 |
| 删除 | `session_id`、不可逆确认 | `running` 状态不能删除；删除不会影响独立的 Agent、Environment、Vault、文件或 Memory |

Session 运行时不支持修改名称、Agent 配置、Tools、MCP 或权限策略。需要变更
能力时，应发布 Agent 新版本并创建新的 Session。

### 创建与版本绑定

- `agent: "agent-…"`：创建时使用 Agent 最新版本。
- `agent: {type:"agent", id:"agent-…", version:3}`：固定版本，适合灰度、
  回滚或定版。
- `environment_id`：绑定第 2 步创建或已有的云环境。
- `vault_ids[]`：选填；为需鉴权的 MCP 工具注入终端用户凭据。
- `resources[]`：选填；可组合 Files ID、TOS 目录和 Memory Store。

### 上传与挂载文件

工作台把“上传”和“挂载”拆开，避免把 Files API 的 `file_id` 与 Session
内的 `resource_id` 混为一谈：

1. “上传到 Files API”使用 `multipart/form-data`，固定
   `purpose=agent`，响应 `file_id` 自动填入“运行中添加文件资源”。
2. 创建 Session 时，可在 `resources[]` 添加：
   - `{type:"file", file_id, mount_path?}`：挂载到
     `/mnt/session/uploads/{mount_path}`；
   - `{type:"tos", tos_bucket, tos_key}`：`tos_key` 必须是以 `/`
     结尾的目录，挂载到 `/mnt/session/storage/`；TOS 和 Managed Agents
     必须属于同一火山账号；
   - `{type:"memory_store", ...}`：见下一节。
3. Session 创建后，`POST /sessions/{id}/resources` 只开放动态添加
   `file`；查询会返回 Session 内的 `resource_id`，删除必须使用该 ID。
4. Agent 生成的文件通过 `GET /files?scope_id={session_id}` 查询，不与
   当前挂载资源列表混用。

单个 Session 最多挂载 100 个文件资源。挂载文件是只读副本，Agent
不能覆盖原始上传文件；需要修改时应写入沙箱新路径，并通过 Session
关联文件接口取回。工作台拒绝绝对 `mount_path`、反斜杠和 `..` 路径穿越。

支持的常见输入包括源码、CSV/JSON/XML/YAML、TXT/Markdown 和压缩包；
二进制文件能否处理取决于沙箱工具。浏览器上传仍受站点运行时请求大小限制。

### 管理和使用持久化记忆

Memory Store 为跨 Session 保留的长期上下文。默认情况下新 Session
不会继承上一轮偏好、规范或排障经验；创建并挂载 Store 后，Agent 可通过
标准文件工具从 `/mnt/memory/` 读取。

- Store 创建字段为 `name`、`description`；`description` 会展示给 Agent。
- Memory 创建字段为 `path`、`content`；创建不会覆盖同路径内容，更新使用
  `POST /memory_stores/{store_id}/memories/{memory_id}`。
- 列表支持 `path_prefix`、`order_by=path`、`depth`；读取单条会返回完整内容。
- 更新可修改内容、路径或二者；修改路径可用于重命名、归档。
- 单条 Memory 上限 100 KB（约 25k tokens）；单个 Store 最多 2,000 条。
- 单个 Session 最多挂载 10 个 Store；`instructions` 最长 4,096 字符。
- Memory Store **只能在创建 Session 时挂载**，运行中不能追加或移除。
- Agent 对 Memory 只有读取权限；人工创建、更新和删除必须走 API 或控制台。
- Agent 必须启用 Agent Toolset，才能使用标准文件工具读取挂载目录。
- 读取过程会作为 `agent.tool_use` / `agent.tool_result` 出现在事件流中。

工作台将 Store 创建响应的 `memstore_…` 自动保存到当前表单；回到“创建
Session”添加 Memory Store 资源时会预填该 ID。Store 与 Memory
删除属于外部不可逆操作，但测试只使用模拟上游，不会触发真实删除。

### 状态与保留期

- `idle`：等待输入；进入该状态时创建沙箱检查点。
- `running`：Agent 正在执行。
- `rescheduled`：暂时性错误，平台自动重试，客户端无需介入。
- `terminated`：不可恢复错误；Session 不再接收事件，但历史仍保留。
- Session 历史除非显式删除会永久保留；沙箱检查点自最后活动起保留 30 天。

### 事件与流

管理台支持三类常用用户事件：

- `user.message`：文本消息；图片、文档和其他多模态 `content` 块可在完整
  JSON 编辑器中添加。
- `user.interrupt`：中断当前执行；`session_thread_id` 选填，省略时中断所有
  活跃线程。
- `user.tool_confirmation`：按 `tool_use_id` 返回 `allow` 或 `deny`；
  拒绝时可附 `deny_message`。

消息可在同一请求末尾追加一个 `system.message`。它必须紧跟
`user.message` 且是 `events` 最后一项。服务端严格校验文本、图片 URL /
file / base64、文档 URL / file / base64 / 内联文本来源及事件顺序。

SSE 只推送连接建立之后产生的事件，因此工作台拆成两次同源请求：先通过
`session-events` 打开上游 GET 流，再 POST 用户事件。旧的 `messages`
路由仅保留兼容，也已修正为相同顺序。

官方依据：[启动 Session](https://docs.volcengine.com/docs/82379/2553723?lang=zh)、
[管理 Session](https://docs.volcengine.com/docs/82379/2553724?lang=zh)、
[Session 事件流](https://docs.volcengine.com/docs/82379/2553725?lang=zh)、
[上传与挂载文件](https://docs.volcengine.com/docs/82379/2553727?lang=zh)、
[持久化记忆](https://docs.volcengine.com/docs/82379/2553728?lang=zh)。

## 编辑与 API 联动

每一步都包含：

- 业务字段与填写说明；
- Method、URL、Authorization、Content-Type；
- 可编辑 Request Body；
- 表单到 JSON、JSON 到表单的双向联动；
- 显式执行按钮、步骤状态与响应资源 ID。

三个步骤都包含独立的“API RESPONSE”面板。执行完成后，面板显示操作类型、HTTP 状态、接收时间和完整 JSON 响应；上游返回业务错误或本地请求失败时也会保留错误结果，便于现场说明和排查。完整请求/响应仍同步写入最近 20 轮历史日志。

### 管理 Agent 页面层级

- 桌面端以“宽表单 + 窄 API 详情”并排，优先保证全字段编辑的阅读宽度；API 详情保持在右侧，便于边填边核对。
- 基本信息、Skills、Tools、MCP、Multi Agent、metadata 各自使用独立分组卡片；选填能力未添加时只保留紧凑说明，避免一次展开大量空字段。
- 创建/更新响应作为独立结果卡片置于表单与执行操作之间，不与 Request Body 混排。
- 1100px 以下改为表单、API 详情上下排列；移动端字段、能力条目和按钮均单列显示。

配置 Agent 环境沿用相同的信息密度与响应式规则：桌面端使用“宽字段编辑 +
窄 API 详情”，网络、包依赖和键值对编辑区分别成组；1100px 以下恢复单列，
移动端包管理器与键值对输入改为纵向排列。

管理 Session 沿用“宽字段 + 窄 API 详情”，七种模式只展开当前相关字段。
检索、列出、资源查询、Memory 查询与删除明确显示“无 Request Body”，全部
参数体现在 URL；事件模式同时显示 `STREAM FIRST · GET` 与发送事件的 POST
URL；文件上传明确展示 `multipart/form-data`，其他文件与 Memory 写操作
由左侧字段实时生成 Request Body。

## 历史、日志与凭证

- Managed Agents 与 Seedance 标准官方 API 共用当前浏览器保存的 `official` Key。
- Key 不进入源码、SSR HTML、URL、Cookie、服务端持久化或日志。
- 日志中的 Authorization 只保留掩码。
- 最近 20 轮 Managed Agents 记录保存在当前浏览器，包含资源 ID、步骤状态、请求、响应和流式事件。
- 页面刷新后历史仍可查看；未完成且已经取得资源 ID 的一轮可恢复步骤上下文。
- 自动化测试只使用模拟上游，页面加载、构建和健康检查不会创建真实资源。

## 验证

真实验收见 [`validation-log.md`](./validation-log.md)。自动化回归覆盖：

- Agent 创建/更新、环境及 Session 生命周期路由的 URL、Method、Body 与 Authorization 转发；
- Agent 全字段、Tools 配置、MCP 一一对应和 Multi Agent 成员的服务端校验；
- 环境全字段、`limited` 条件字段、六类包管理器、保留环境变量前缀和未知字段拒绝；
- 非官方 Base URL 和未开放字段拒绝；
- 先 GET SSE、再 POST 用户事件的官方顺序；
- Files multipart 上传、创建时三类资源挂载、运行时文件资源增删查与 Session 产出文件查询；
- Memory Store 与 Memory 增删查改、路径/容量/挂载阶段边界；
- SSE 内容转发且响应不包含完整 Key；
- 页面三步、Session 七种模式、完整 API 编辑器、响应、历史与日志契约。

快速入门依据：[火山方舟托管 Agent 快速入门](https://docs.volcengine.com/docs/82379/2553714?lang=zh)。
