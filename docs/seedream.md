# Seedream 图片生成演示

## 产品入口

`Seedream 演示` 是与演示工作台、模板资产库、Managed Agents 平级的顶级栏目。
页面把官方图片生成教程中的示例类型整理为十个可编辑场景，并明确排除教程附录中的
故事书/连环画工作流。

十类场景：

1. 文生图；
2. 图文生图 / 交互编辑；
3. 多图融合；
4. 文生组图；
5. 单张图生组图；
6. 多参考图生组图；
7. 联网搜索生图；
8. 流式组图输出；
9. 图片 API 提示词优化模式；
10. 自定义图片输出规格。

每个场景都包含填写说明、官方参考参数、场景化 Prompt 技巧、表单与完整 JSON
双向编辑、费用确认、结果预览、本地历史和脱敏请求/响应日志。

## 模型与能力适配

- 默认图片模型：`doubao-seedream-5-0-pro-260628`。
- Prompt 一键优化模型：`doubao-seed-evolving`。
- 组图、联网搜索、流式输出：官方能力表标注 Seedream 5.0 Pro 暂不支持，因此这些
  示例显式使用 `doubao-seedream-5-0-lite-260128`，页面同步展示原因。
- Prompt 编辑框右下角的一键优化通过 Chat Completions 调用
  `doubao-seed-evolving`；它与 Image generation API 的
  `optimize_prompt_options.mode` 是两条不同能力。

## 调用链

```text
SeedreamWorkbench
  → POST /api/seedream/jobs action=create
  → app/lib/seedream-jobs-server.ts
  → D1 记录匿名任务 ID、恢复令牌哈希和 24 小时状态
  → 浏览器保存恢复令牌
  → POST /api/seedream/jobs action=run（携带本次 API Key 与 Request Body）
  → app/lib/seedream-server.ts
  → POST https://ark.cn-beijing.volces.com/api/v3/images/generations

SeedreamWorkbench 刷新恢复
  → POST /api/seedream/jobs action=status
  → 匿名任务 ID + 当前浏览器恢复令牌
  → 返回 pending / running / succeeded / failed

SeedreamWorkbench Prompt 优化按钮
  → POST /api/seedream/optimize-prompt
  → app/lib/seedream-server.ts
  → POST https://ark.cn-beijing.volces.com/api/v3/chat/completions
  → doubao-seed-evolving
```

浏览器只调用同源路由。普通方舟 API Key 复用演示工作台的当前浏览器凭证槽位，
不会进入 URL、Cookie、SSR HTML、源码、D1 或日志。服务端只在 `run` 请求执行期间临时持有
本次请求；D1 不保存 Prompt、参考图或完整 Request Body。任务 ID 与恢复令牌会在长调用开始前
先返回并写入浏览器，因此刷新后可查询同一次执行的终态。

## 服务端边界

- 上游地址固定为标准 `/api/v3`，不是任意主机代理。
- 只开放 Pro 与 Lite 两个 Seedream 5.0 模型。
- Request Body 采用字段白名单；未知字段直接拒绝。
- 图片只允许公网 HTTPS URL 或受控的图片 Base64 格式；拒绝 localhost、环回、
  链路本地与 RFC1918 私网地址。
- Pro 最多 10 张参考图；Lite 最多 14 张参考图。Lite 的参考图数量与组图
  `max_images` 合计不得超过 15。
- 按模型校验分辨率档位、自定义总像素范围与宽高比。
- Pro 不允许组图、流式输出和联网搜索；Lite 的 Image API Prompt 优化不允许
  `fast`。
- 后台任务可处理非流式或上游 SSE，结果完成后统一写入短期状态；页面轮询同源任务状态。
- 可刷新恢复的后台任务要求 `response_format=url`，不把大体积 Base64 图片写入 D1。

## point / bbox 坐标标注

Seedream 5.0 Pro 在存在参考图时提供 Prompt 原生坐标标注；Lite 保留 Prompt 文本但禁用可视化，并拒绝带坐标标签的真实提交。

- point 格式：`图N<point>x y</point>`；bbox 格式：`图N<bbox>x1 y1 x2 y2</bbox>`。坐标按实际渲染图片宽高归一化并 clamp 到 0–999，bbox 必须满足 `x1 < x2`、`y1 < y2`。
- 图片标签页中的 `图N` 严格对应当前 `image` 数组顺序。调整 URL 行顺序会改变已有标签语义，页面会提示但不会猜测重映射。
- 点击 point 或拖拽 bbox 只会向 Prompt 追加标准标签，不新增上游 Request Body 字段。小于 4px 的拖拽不生成标注。
- Prompt 是唯一事实源：覆盖层和标注芯片每次都从 Prompt 重新解析；手工编辑 Prompt、应用完整 JSON、删除具体 occurrence、撤销和清空都会同步恢复画布状态。
- 图片删除后仍引用不存在图号、坐标越界、标签格式错误或 bbox 顺序错误时，前端禁用真实提交，服务端执行同样校验。
- 单张图片预览失败只禁用该图的可视化标注；用户仍可修复 URL 或手工编辑 Prompt。本期不提供箭头、涂鸦、蒙版、图层或画布缩放平移。

## 历史、日志与大响应

- 最近 30 次图片生成或 Prompt 优化保存在当前浏览器。
- 当前浏览器额外保存一个匿名任务 ID 与恢复令牌；刷新或稍后返回时继续查询，不会重复提交图片生成。
- D1 只保留任务状态、URL 格式结果和脱敏错误 24 小时；过期后无法恢复，且该记录不是跨设备历史或审计日志。
- 日志记录实际 Method、URL、完整请求体、HTTP 状态与脱敏响应。
- Authorization 只保存首尾掩码。
- 兼容直连路由仍可返回 Base64 图片，但后台可恢复任务只接受 URL 结果；URL 结果可记录但官方只保留 24 小时。
- 页面加载、切换场景、自动化测试和健康检查不会调用真实 API。
- 图片生成必须勾选费用确认；Prompt 优化只在用户点击按钮时调用。

## 官方基线

- [图片生成教程](https://docs.volcengine.com/docs/82379/1824121?lang=zh)
- [Seedream 4.0–5.0 提示词指南](https://docs.volcengine.com/docs/82379/1829186?lang=zh)
- [Seed-Evolving](https://docs.volcengine.com/docs/82379/2549861?lang=zh)

模型能力、参数与价格会变化。涉及模型适配或真实验收时必须重新核对官方文档。
