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
  → queued / running / succeeded / failed
```

查询路由使用 POST，是为了让 API Key 留在请求体中，避免进入 URL、浏览历史或访问日志。
每轮非终态查询结束后由 `pollCycle` 安排下一轮，即使上游状态仍是相同的 `running` 也会继续。临时网络错误保留远端任务状态，并在 30 秒后重试。

## 创建请求

工作台当前提供官方视频编辑示例的完整字段：

- API 路径：标准 API 或 Agent Plan；默认是标准 API。
- Base URL：只能是所选路径的官方精确地址。
- 模型：只能从所选路径的当前模型清单选择；默认是 `doubao-seedance-2-0-mini-260615`。
- API Key：默认按 API 路径保存在当前浏览器，关闭“记住”后只存在组件内存；随本次同源请求转发。
- 提示词：默认使用“香水替换成面霜”的官方示例。
- 素材：一张 `reference_image` 与一段 `reference_video`，均要求公网 HTTPS URL。
- 输出：4–15 秒、官方支持的比例、有声开关和水印开关。

服务端再做一次独立校验，不能只依赖浏览器禁用按钮。

## 完整 API 详情

“提交前确认”之前展示实际的 Method、Request URL、Content-Type、Authorization 掩码和 Request Body。

- 上方表单变化会立即更新 Request Body。
- Request Body 可直接编辑 JSON；点击“应用参数”后回写模型、提示词、素材、比例、时长、音频和水印。
- JSON、字段类型、模型与路径、比例和时长会先在浏览器校验，服务端仍会再次校验。
- URL 和 Headers 由连接配置派生，避免出现显示值与真正发送目标不一致。

## 安全边界

- 禁止浏览器直接请求火山方舟。
- 演示模式可把 API Key 放入当前浏览器 `localStorage`；禁止进入 `sessionStorage`、Cookie、URL、SSR HTML、源码、服务端存储或日志。
- 服务端不得缓存、持久化或回显 Key。
- Base URL 使用精确白名单，避免把带有 Authorization 的请求转发到任意主机。
- 任务处于排队或运行状态时锁定连接和参数；刷新后从本地历史恢复最近的活跃任务。未开启记住模式时需要重新输入 Key 才能继续查询。
- 上游错误信息会截断并替换可能出现的 Key。
- `.env.example` 只能包含空占位符，不能保存真实凭证。

## 本地历史

- 每次点击提交都会立即创建历史记录，最多保留 30 条；即使创建失败或没有远端任务 ID，也会保留。
- 历史记录包含本地记录 ID、远端任务 ID（如有）、API 路径、模型、状态、时间、脱敏错误和结果 URL，不包含完整 API Key。
- “查看日志”记录创建与每次状态查询的 Method、URL、脱敏 Headers、Body、HTTP 状态和响应。
- 刷新后自动恢复最近的 `queued` 或 `running` 任务；也可在历史列表手动点击“恢复轮询”。
- 本地历史不是服务端数据库：清除站点数据、换浏览器或换设备后不可见。

## 费用边界

页面加载、字段编辑、构建、单元测试与模拟上游测试不会创建真实任务。只有同时满足以下条件才允许执行：

1. 连接信息和请求字段通过前端校验。
2. 用户勾选“理解会消耗额度或产生费用”。
3. 用户点击“执行真实视频生成任务”。

当前代码已接通流程，但项目记录中不能把测试通过写成真实任务已成功；只有获得真实任务 ID 和终态后才能更新 Step 3 验收状态。
