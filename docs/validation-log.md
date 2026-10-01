# 真实验证记录

本文件记录会消耗额度或产生费用的真实 API 验收。自动化测试、构建和 Lint
不属于真实调用。不得在此保存 API Key、完整 Authorization、私有结果 URL 或用户素材。

## 2026-08-13：仅模拟回归，未计入真实验收

- `omni_reference_task_type` 四个枚举、模型/路径拒绝、Prompt 意图联动和上游转发均通过模拟上游测试。
- 受控批量的 2/12/13 边界、并发不超过 3、两级确认源码契约、条件化费用、错误分类与不可重试边界通过本地测试；未创建任何真实批次。
- Seedream point/bbox 的坐标归一化、反向 bbox、Prompt 解析/删除、多图/Lite/越界/格式校验以及桌面和 375px 页面布局完成本地验证；未执行真实图片生成。
- 以上结论只证明实现与模拟回归，不证明账号已开通、真实任务成功或计费口径与最终账单一致。

## 2026-07-24：基础任务与历史恢复

- 标准官方 API 的编辑任务达到 `succeeded`。
- 创建后和终态后分别刷新页面，任务状态、历史和结果入口均能恢复。
- 修复了上游连续返回 `running` 时只轮询一次的问题；`pollCycle` 能持续安排查询。
- 创建与状态日志均保留，Authorization 只保存掩码。

## 2026-07-24：官方示例一至五

- 示例一“替换商品”：Mini，成功。
- 示例二“多模态参考”：Mini，成功。
- 示例三“延长视频”：Mini，成功。
- 示例四“输出 4K”：完整模型，成功。
- 示例五“联网搜索”：Mini，成功。
- 刷新后五条任务、结果入口和结构化日志均恢复。

## 2026-07-24：预置虚拟人像

- Mini 接受严格的 `asset://asset-*` 预置人像引用并达到 `succeeded`。
- 非法 Asset ID 与其他非 HTTPS 协议由服务端拒绝。
- 刷新后任务、结果和创建/状态日志正常恢复。

## 2026-07-27：首尾帧和连续视频

- 教程原始真人首尾帧触发
  `InputImageSensitiveContentDetected.PrivacyInformation`，未重复提交同一失败素材。
- 替换为已通过审核的非真人素材后，`first_frame` + `last_frame`、5 秒、
  `adaptive`、有声请求达到 `succeeded`。
- 三段连续视频严格串行完成；每段都返回视频和 `last_frame_url`，后续段只在上一段成功后创建。

## 2026-07-28：电商模板

- “云朵面霜”使用 Mini 达到 `succeeded`。
- 最初的随行杯拼图宽高比为 2.87，超过输入图片允许范围 0.40–2.50，上游明确拒绝；失败请求和响应保留在本机日志。
- 替换为合规果茶商品图后，“冰爽果茶”使用 Mini 达到 `succeeded`。

## 2026-07-28：影视与营销模板

- 影视“剧情向后延长”使用 Mini 和官方公开视频达到 `succeeded`。
- 营销“骏马变黄金吊坠”使用 Mini 和官方公开视频达到 `succeeded`。
- 两条任务刷新后仍保留结果和完整请求/状态日志。
- “素材待补”模板预填空素材位后，真实执行按钮保持禁用。

## 2026-07-28：Managed Agents 四步快速入门

- 使用当前项目保存的标准官方 API Key 与 `/api/v3` 完成真实验收。
- `doubao-seed-2-1-pro-260628`、`agent_toolset_20260701`、`cloud` +
  `unrestricted` 均被上游接受。
- 创建 Agent、创建环境、开启 Session 均成功返回资源 ID，页面按顺序自动联动。
- `user.message` 提交成功，SSE 共收到 15 个事件；包含工具调用、工具结果和
  `session.status_idle`。
- Agent 在托管沙箱中生成 Python 脚本和 `fibonacci.txt`，最终文本响应成功返回。
- 修复了收到 `session.status_idle` 后仍等待长连接关闭的问题；现在主动结束读取并将本轮标记为成功。
- 刷新页面后 1 条 Managed Agents 历史及 5 类请求/响应日志仍可恢复；Authorization 只保留掩码。

## 2026-08-06：Seedance 2.5 能力示例模板

- 首次提交“能力示例·粗粒度白模”被上游拒绝（HTTP 400，InvalidParameter）：Mini r2v 参考视频时长上限 15.2 秒，文档原白模视频为 30 秒。
- 将示例 1（粗粒度白模）与示例 7（台词翻译中文）的输入视频截取前 15 秒后重新上传私有 TOS，模板 objectKey 与 inputHint 同步更新。
- 重试提交后任务创建成功并进入生成中；应用户要求未等待终态，未完成全部 10 个示例的串行运行与保存素材库。
- 预填链路已验证：模板一键带入完整提示词、10 个私有 TOS 签名素材 URL、16:9、15 秒、有声、有水印，提交前确认摘要与表单一致。

## 2026-09-24：鹈鹕测试视觉裁判单用例

- 在本地 `/#pelican-test` 通过浏览器填写模型并勾选费用确认，只点击一次“开始测试”；使用页面已有标准方舟 Key，不记录凭证明文。
- 固定 Prompt `Generate an SVG of a pelican riding a bicycle`；生成模型 `deepseek-v4-1-flash-260910`，视觉裁判 `doubao-seed-2-1-pro-260915`。生成 SVG、本地栅格化 PNG、结构化裁判评分均成功。
- 物种特征 8.5、车架结构 7.0、骑乘姿态 7.5、肢体交互 6.5、SVG 有效性 9.0，均值总分 7.7/10；页面与裁判 JSON 一致。页面合计 usage 为输入 2036、输出 14285 tokens，不代表最终结算账单。
- 浏览器资源计时记录显示 `/api/responses` 的两次 fetch 均为 HTTP 200；网络工具仅保留其中一次 POST，未完整留存两个 POST 的网络记录。
- 历史从 0 增至 1 条；刷新后仍在，普通点击历史“查看”后评分与 PNG 恢复。刷新后 `/api/responses` 资源条目为 0，未重复创建计费请求。
- 本次 PNG 为 100×100、约 11.1 KB，放大预览较模糊；固定导航会遮挡部分 SVG 预览区域，历史“查看”需调整滚动位置后才能点击。这些界面问题未在本次验收中修复。
- 未执行重评、TOS 保存或读取，也未测试源码裁判。截图：`screenshots/pelican-visual-live-20260924.png`、`screenshots/pelican-visual-history-20260924.png`（不含凭证）。

## 2026-09-26：鹈鹕测试 glm-5-3-flash-260828 截断诊断与修复

- 用户报告 glm-5-3-flash-260828 生成报错。经浏览器实测（用户授权，共三次生成调用；第一次被上游 429 过载拒绝、未消耗 token，退避后重试）定位根因：该模型为推理型，思维链 token 计入 `max_output_tokens`，旧上限 16384 中约 16046 被推理占用，可见输出不足以写出 `</svg>`，`normalizeSvg` 提取失败报“未找到 SVG”。这也解释了 9-24 三次约 140 秒的均匀失败。
- 修复一：`PELICAN_GENERATION_MAX_TOKENS` 16384→32768，为思维链预留余量；新增 `describeTruncatedGeneration`，当响应为 `incomplete/length` 截断时面板展示含 output_tokens 与 reasoning 占用的显式诊断，而非静默通用错误。
- 修复二：上限提高后 glm 推理超过代理旧 180 秒中止线（表现为 502 + “The operation was aborted due to timeout”）；`proxyResponses` 非流式 create 超时放宽到与流式一致的 300 秒（其余操作仍 180 秒），route 将 TimeoutError 转为明确中文诊断文案。
- 修复后实测一次通过：生成完整闭合 SVG（输出 31998/32768，未截断，`response.status` 非 incomplete），视觉裁判 `doubao-seed-2-1-pro-260915` 总分 9.7/10，历史新增 1 条，未触发 300 秒超时。`npm test` 67/67、`npm run lint` 0 警告。
- 未执行重评、TOS 保存或读取，也未测试源码裁判。截图：`screenshots/pelican-glm-truncated-20260926.png`（截断诊断）、`screenshots/pelican-glm-fixed-20260926.png`（修复后成功，不含凭证）。

## 记录新验收时

只记录：

1. 日期、路径、模型和场景；
2. 成功或失败终态；
3. 对架构或校验有长期意义的发现；
4. 历史、日志、刷新恢复等需要证明的行为。

不要记录可过期的签名结果 URL、完整请求头或真实 Key。
