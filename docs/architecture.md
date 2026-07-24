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
2. 将 API 路径限制为标准 API 与 Agent Plan 两个精确 Base URL。
3. 校验模型属于对应路径；Agent Plan 使用套餐别名，标准 API 使用日期版本 Model ID。
4. 校验模型、素材 URL、时长、比例等允许参数。
5. 创建任务并只向浏览器返回必要的任务 ID。
6. 查询并归一化任务状态。
7. 对错误进行安全脱敏，避免返回 Secret 或内部日志。

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

## 状态模型

工作台统一使用以下演示状态：

- `draft`：参数尚未确认。
- `ready`：参数已校验，等待用户创建任务。
- `queued`：远端已接受任务。
- `running`：生成中。
- `succeeded`：生成完成，可展示结果 URL。
- `failed`：任务失败，展示脱敏后的原因与下一步建议。

## 安全与成本边界

- API Key 可按用户选择保存在当前浏览器 `localStorage`，并短暂进入同源请求体；不得进入 SSR HTML、构建产物、服务端持久化、URL、Cookie 或日志。
- Agent Plan Key、普通方舟 Key、Coding Plan Key 是不同凭证；选择的 API 路径必须与对应 Key 匹配。
- Agent Plan API 地址必须包含 `/plan`。创建任务完整地址为 `https://ark.cn-beijing.volces.com/api/plan/v3/contents/generations/tasks`，查询地址在其后追加 `/{id}`。
- 标准 API 完整创建地址为 `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks`。
- 真实“创建任务”是外部写操作且可能产生费用，不与页面加载或普通测试绑定。
- 用户素材可能包含隐私或商业信息；上传/托管策略在引入前单独决策。
- 官方教程可能更新模型 ID、限流、输入数量和价格。执行真实任务前重新核对权威文档。
