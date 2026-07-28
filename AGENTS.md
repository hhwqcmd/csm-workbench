# AGENTS.md

## 当前项目定位

本项目是 Seedance 2.0 视频生成演示与模板资产平台，包含两个平级顶层栏目：

1. **演示工作台**：配置官方 API 或 Agent Plan、审核完整请求、创建异步任务，并查看结果、历史和请求/响应日志。
2. **模板资产库**：浏览提示词、电商宣发、影视短剧和营销短视频模板，并将场景参数预填到同一个实操台。

官方 Python 快速示例作为协议和素材基线独立保留，不是产品页面主线。页面不得重新加入共学进度、环境安装步骤或教程路线。

当前事实（最后核对：2026-07-28）：

- 默认连接为标准官方 API + `doubao-seedance-2-0-mini-260615`，同时支持 Agent Plan 套餐通道。
- 生产 Sites 项目使用 `.openai/hosting.json` 中既有 `project_id`，访问策略为公开直达。
- 应用入口不要求登录；`app/chatgpt-auth.ts` 是未被引用的托管认证遗留代码，不得据此重新接回登录。
- 任务历史和演示凭证只保存在当前浏览器，不是跨设备或服务端审计记录。

## 模块地图

- `app/page.tsx` → `app/components/WorkspaceShell.tsx`：页面入口、顶级栏目和整体组合。
- `app/components/SeedanceTaskRunner.tsx`：连接、参数、完整 API 编辑、费用确认、创建、轮询、历史和日志。
- `app/lib/seedance-config.ts`：两条 API 路径、模型清单、默认模型和比例。
- `app/lib/seedance-server.ts`：服务端白名单校验、上游请求、响应归一化和错误脱敏。
- `app/api/seedance/tasks/route.ts`、`status/route.ts`：创建与查询的同源服务端入口。
- `app/lib/seedance-examples.ts`、`SeedanceExampleGallery.tsx`：八个官方示例及连续生成计划。
- `app/lib/template-assets.ts`、`TemplateAssetLibrary.tsx`：四类模板、十个场景预填案例及复制/跳转交互。
- `app/globals.css`、`app/layout.tsx`：视觉规则、响应式布局和站点元数据。
- `official-quickstart/`：官方 Python 基线；关键入口为 `python/demo_standard.py`。
- `start_workbench.sh`：本地启动与环境检查，不安装依赖、不打开浏览器、不调用真实 API。
- `worker/`、`build/`、`vite.config.ts`：vinext/Cloudflare Worker 适配层。
- `db/`、`drizzle/`、`examples/d1/`：未启用的持久化样例与预留层。
- `tests/rendered-html.test.mjs`：页面契约、服务端边界和安全回归测试。

核心依赖方向：

`示例/模板 → SeedanceTaskRunner → 同源 API 路由 → seedance-server → 火山方舟 API`

`official-quickstart → volcenginesdkarkruntime → 火山方舟 API`

`app/` 不得导入 Python 示例；二者只共享协议认知和公开素材。

## 文档路由

- 模块、数据流、安全边界：`docs/architecture.md`
- 当前有效的架构取舍：`docs/decisions.md`
- 真实 API 验证记录：`docs/validation-log.md`
- Python 环境与重建：`docs/environment.md`
- 创建、轮询、历史和日志：`docs/task-runner.md`
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
- 模板缺少素材时用空 URL 表达并显示“素材待补”；所有 URL 补齐前执行按钮必须禁用。

## 地雷与遗留区域

- `app/chatgpt-auth.ts` 当前未被引用。它是平台认证模板遗留，不代表站点需要登录；除非明确重新设计访问控制，否则不要接入或扩展。
- `db/`、`drizzle/`、`examples/d1/` 尚未启用。当前本地历史不需要数据库。
- `official-quickstart/python/preview.html` 会被官方脚本覆盖。
- `setup_mac.sh` 会创建或更新 `.venv` 和 `run_demo.sh`；运行后检查生成内容，不要自动接着运行示例。
- 官方 Python 示例未显式设置 Agent Plan Base URL，不能直接配 Agent Plan Key 使用。
- 不要删除 `pollCycle`、历史旧格式兼容或远端 `taskId` 与本地记录 `id` 的区分。
- 教程真人首尾帧可能触发隐私审核；不要重复提交同一失败素材或放宽安全校验。
- `.sample-section` 使用浅色前景，浅色卡片标题和规格必须显式设置深色。
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
