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
  → POST /api/seedream/generate
  → app/lib/seedream-server.ts
  → POST https://ark.cn-beijing.volces.com/api/v3/images/generations

SeedreamWorkbench Prompt 优化按钮
  → POST /api/seedream/optimize-prompt
  → app/lib/seedream-server.ts
  → POST https://ark.cn-beijing.volces.com/api/v3/chat/completions
  → doubao-seed-evolving
```

浏览器只调用同源路由。普通方舟 API Key 复用演示工作台的当前浏览器凭证槽位，
不会进入 URL、Cookie、SSR HTML、源码、服务端持久化或日志。

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
- 流式响应保持 SSE 透传；非流式响应在返回浏览器前执行 Key 脱敏。

## 历史、日志与大响应

- 最近 30 次图片生成或 Prompt 优化保存在当前浏览器。
- 日志记录实际 Method、URL、完整请求体、HTTP 状态与脱敏响应。
- Authorization 只保存首尾掩码。
- Base64 图片会在当前结果区显示，但写入本地历史时只保存长度占位，避免超过
  `localStorage` 容量；URL 结果可记录但官方只保留 24 小时。
- 页面加载、切换场景、自动化测试和健康检查不会调用真实 API。
- 图片生成必须勾选费用确认；Prompt 优化只在用户点击按钮时调用。

## 官方基线

- [图片生成教程](https://docs.volcengine.com/docs/82379/1824121?lang=zh)
- [Seedream 4.0–5.0 提示词指南](https://docs.volcengine.com/docs/82379/1829186?lang=zh)
- [Seed-Evolving](https://docs.volcengine.com/docs/82379/2549861?lang=zh)

模型能力、参数与价格会变化。涉及模型适配或真实验收时必须重新核对官方文档。
