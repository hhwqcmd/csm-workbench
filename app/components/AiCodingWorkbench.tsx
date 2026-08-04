"use client";

import { useEffect, useState } from "react";
import {
  AI_CODING_METRICS,
  AI_CODING_ORGANIZATION,
  AI_CODING_TREND,
  buildAiCodingMetricsResponse,
} from "../lib/ai-coding-data";

const AGENT_ASSETS = [
  {
    name: "Rules",
    tag: "生产约束",
    scenarios: ["支付、退款、账户等高风险写链路", "生产配置、数据库迁移与敏感日志变更"],
    practices: [
      ["规则绑定目录与风险", "在 `services/checkout/**` 明确幂等键、脱敏字段和迁移要求；不要用“注意安全”这类无法验收的表述。"],
      ["每条规则附验证入口", "写出必须执行的测试和 lint 命令；规则变更与代码一起评审，用一次成功任务和一次违规任务做回放。"],
    ],
    check: "抽取任一规则，都能定位适用路径、失败条件和验证命令；违规示例会被测试或门禁拦住。",
    templateLabel: "services/checkout/AGENTS.md",
    template: `# Applies to
services/checkout/**

## Non-negotiables
- Create and refund APIs must accept and propagate idempotency_key.
- Never log access_token, mobile, address, or full request bodies.
- Database changes require a backward-compatible migration and rollback notes.

## Required validation
- pnpm test checkout --runInBand
- pnpm lint`,
    href: "https://docs.qoder.com/zh/user-guide/rules",
  },
  {
    name: "Skills",
    tag: "标准作业流程",
    scenarios: ["表结构迁移、接口升级、依赖替换", "故障定位、发布检查等多人重复执行的流程"],
    practices: [
      ["把停止条件写进流程", "例如迁移没有回滚方案、生产表无备份确认、验证命令失败时立即停止，不让 Agent 自行扩大范围。"],
      ["脚本化可重复步骤", "把 schema diff、测试数据和验证脚本放入 Skill；入口只负责选路，脚本要能在 CI 中独立执行。"],
    ],
    check: "新成员按模板执行时，输入、产物、停止条件和完成证据一致；连续运行两次不产生额外副作用。",
    templateLabel: "skills/schema-migration/SKILL.md",
    template: `---
name: schema-migration
description: Use for backward-compatible database schema changes.
---

## Inputs
- target table and desired schema
- traffic and rollback window

## Workflow
1. Generate and review schema diff.
2. Add backward-compatible migration and rollback SQL.
3. Run migration tests against an isolated database.
4. Produce rollout, observation, and rollback steps.

## Stop when
- backup or rollback owner is unknown
- destructive SQL is required
- any required validation fails`,
    href: "https://docs.trae.cn/cli_skills",
  },
  {
    name: "MCP",
    tag: "受控系统连接",
    scenarios: ["读取工单、CI、日志和服务目录辅助排障", "创建工单、准备发布等需要审批的写操作"],
    practices: [
      ["读写工具分组授权", "Review Agent 只允许 `ticket.get`、`ci.get_run`、`logs.search`；更新工单或部署必须切换到需人工批准的角色。"],
      ["只记录调用元数据", "凭证通过环境或密钥系统注入；日志只保留工具名、请求 ID、耗时和结果码，不记录 Prompt、代码或响应正文。"],
    ],
    check: "权限清单没有通配符；未授权写操作返回拒绝；撤销凭证后 Agent 无法继续访问，审计记录不含敏感正文。",
    templateLabel: "mcp-policy.yaml",
    template: `server: engineering-context
role: review-agent
allowed_tools:
  - ticket.get
  - ci.get_run
  - logs.search
denied_tools:
  - ticket.delete
  - deploy.execute
  - secret.read
approval_required:
  - ticket.update
  - deploy.prepare
credentials: env:MCP_TOKEN
audit_log: metadata_only`,
    href: "https://docs.trae.cn/cli_model-context-protocol",
  },
  {
    name: "Memory",
    tag: "可验证长期事实",
    scenarios: ["记录当前默认分支、运行入口和兼容版本", "沉淀架构决策、已知风险及下一次复核时间"],
    practices: [
      ["每条事实携带证据", "记录 `source`、`verified_at`、`owner` 和失效条件；“可能”“推测”只能留在会话，不能进入长期记忆。"],
      ["设定复核与清理机制", "版本、价格、端口和外部状态设置过期时间；密钥、个人信息、完整 Prompt 和代码正文永不写入。"],
    ],
    check: "随机抽查可用来源重新验证；超过复核日期会进入待确认状态；敏感信息扫描结果为零。",
    templateLabel: "docs/PROJECT_MEMORY.md",
    template: `# Verified facts

- fact: The local start command is ./start.sh --check.
  source: start.sh:1
  verified_at: YYYY-MM-DD
  owner: platform-team
  expires_when: start entry changes

# Decisions

- decision: Production writes always require human approval.
  source: docs/decisions.md#production-writes

# Never store

- credentials, personal data, full prompts, source code`,
    href: "https://docs.trae.cn/cli_memories",
  },
  {
    name: "Hooks",
    tag: "确定性安全门禁",
    scenarios: ["Shell 执行前拦截递归删除、生产 SQL 和越界路径", "写文件后运行格式化，任务结束时执行变更范围验证"],
    practices: [
      ["前置阻断只处理高确定性风险", "匹配具体工具和命令；阻断信息包含命中的规则与申请例外的路径，避免误伤所有 Shell 操作。"],
      ["单脚本单职责且快速", "目标耗时小于 2 秒、可重复执行；为允许、阻断、解析失败和超时分别写测试。"],
    ],
    check: "危险样例稳定返回阻断码，正常 lint/test 命令放行；解析异常不泄露输入，并产生可定位告警。",
    templateLabel: "hooks/pre-tool-check.sh",
    template: `#!/usr/bin/env bash
set -euo pipefail

input="$(cat)"
command_text="$(printf '%s' "$input" | jq -r '.tool_input.command // ""')"

if printf '%s' "$command_text" | grep -Eq 'rm[[:space:]]+-rf|DROP[[:space:]]+(TABLE|DATABASE)'; then
  echo "Blocked by safety policy: destructive command" >&2
  exit 2
fi

exit 0`,
    href: "https://docs.qoder.com/zh/extensions/hooks",
  },
  {
    name: "Plugins",
    tag: "企业能力分发",
    scenarios: ["为前端、数据或服务端团队分发成套检查能力", "统一新人环境和特定技术栈的标准工作流"],
    practices: [
      ["一个包只服务一个团队场景", "例如前端质量包只包含 React Rules、可访问性 Skill、只读设计 MCP 和 `/verify-ui`，不捆绑部署权限。"],
      ["发布前生成物料清单", "锁定每个组件版本和权限差异；先在样例仓验证安装、禁用、升级、回滚四条路径。"],
    ],
    check: "安装后不修改用户已有配置；禁用后所有组件失效；回滚到上一版本时验证用例仍通过。",
    templateLabel: "asset-pack.yaml",
    template: `name: frontend-quality-pack
version: 1.2.0
owner: frontend-platform
components:
  rules: [react-conventions@2.1.0]
  skills: [accessibility-review@1.4.2]
  commands: [verify-ui@1.3.0]
  mcp: [design-readonly@3.0.1]
permissions:
  filesystem: project_read
  network: approved_design_host_only
smoke_test: ./scripts/test-asset-pack.sh
rollback_to: 1.1.3`,
    href: "https://docs.qoder.com/zh/extensions/plugins",
  },
  {
    name: "Commands",
    tag: "显式可审计流程",
    scenarios: ["`/verify-changed`、`/review` 等高频开发动作", "发布准备、数据修复等必须由人主动触发的任务"],
    practices: [
      ["参数决定范围而不是扩大权限", "要求 `base_sha`、模块和环境；参数缺失时只打印用法，不猜测生产目标或默认执行发布。"],
      ["统一输出可粘贴到 PR", "固定包含变更范围、逐条命令与退出码、未验证项、风险和下一步；写操作前再次展示摘要并确认。"],
    ],
    check: "相同提交和参数得到一致的检查清单；失败命令不会被吞掉；命令定义中不存在隐式部署或删除步骤。",
    templateLabel: "commands/verify-changed.md",
    template: `# /verify-changed <base_sha> [module]

## Preconditions
- working tree and target base are known
- no production credentials are required

## Steps
1. List files changed from <base_sha>.
2. Map files to the repository validation matrix.
3. Run required commands and capture exit codes.
4. Report skipped checks and reasons.

## Output
- scope, commands, results, risks, unverified items

## Never
- deploy, delete, or call paid APIs`,
    href: "https://docs.trae.cn/cli_slash-commands",
  },
  {
    name: "Subagents",
    tag: "独立审查角色",
    scenarios: ["支付正确性、安全、数据库和可访问性专项审查", "测试、文档、依赖分析等互不写文件的并行任务"],
    practices: [
      ["审查 Agent 默认只读", "只开放 Read、Grep、Glob 和只读查询；禁止 Write、删除、部署和合并，避免审查者修掉自己发现的问题。"],
      ["任务说明包含边界与输出契约", "指定 base SHA、文件范围和检查维度；按 P0–P3 返回位置、影响、证据、最小修复和验证路径。"],
    ],
    check: "越界文件不进入结论；无证据时明确回复“没有”；主 Agent 可直接合并多名审查者的结构化结果。",
    templateLabel: "agents/code-review.md",
    template: `---
name: code-review
description: Read-only review for correctness, security, regressions, and tests.
tools: [Read, Grep, Glob]
---

Compare HEAD with the provided base SHA.
Only report issues introduced by this change.

For each finding return:
- severity: P0 | P1 | P2 | P3
- file and line
- trigger and impact
- evidence or reproduction path
- smallest safe fix
- verification command

If there are no evidence-backed findings, return: 没有`,
    href: "https://docs.qoder.com/zh/extensions/subagent",
  },
];

const PROJECT_ASSETS = [
  {
    name: "Wiki 文档",
    tag: "面向人的主题导航",
    scenarios: ["新人按阅读路径理解项目全貌、核心能力和架构", "开发或值班人员查阅 API、配置与故障排查专题"],
    practices: ["按人的阅读主题组织 `zh/content/`，而不是按代码模块机械分组：提供项目概述、快速开始、核心功能、架构、配置、API 参考和故障排查等完整文章。", "每篇文章包含目录和 `<cite>` 文件引用，关键图表与结论附 `file://path#Lx-Ly` 证据；`meta/repowiki-metadata.json` 单独维护父子关系、顺序和 `dependent_files`。"],
    check: "新成员能沿主题目录理解系统；随机抽取一条架构结论和一条排障建议，均可从 `<cite>` 或章节来源定位到当前代码；页面关系可从元数据重建。",
    templateLabel: "wiki/zh/content/前端架构/服务架构.md",
    template: `# 服务架构

<cite>
**本文引用的文件**
- [handler.ts](file://services/api/handler.ts)
- [repository.ts](file://services/api/repository.ts)
- [service.config.yaml](file://config/service.config.yaml)
</cite>

## 目录
1. [简介](#简介)
2. [架构总览](#架构总览)
3. [请求与数据链路](#请求与数据链路)
4. [故障排查](#故障排查)

## 简介
说明该专题解决什么问题、面向谁，以及与其他 Wiki 页的关系。

## 架构总览
Client -> Gateway -> Handler -> Repository -> Database

## 请求与数据链路
- Handler 校验身份与输入后才能访问 Repository。
- 写请求超时不得脱离原幂等键自动重试。

## 故障排查
| 现象 | 检查点 | 验证命令 | Owner |
| --- | --- | --- | --- |
| 5xx 增长 | handler error path | pnpm test api-errors | api-platform |

## 章节来源
- [handler.ts:40-96](file://services/api/handler.ts#L40-L96)
- [repository.ts:18-72](file://services/api/repository.ts#L18-L72)

## 维护信息
- Owner: api-platform
- Source commit: <commit_sha>
- Last verified: YYYY-MM-DD
- Review when: request path, dependency, or failure handling changes`,
  },
  {
    name: "知识卡片",
    tag: "面向机器的结构化知识",
    scenarios: ["AI 按改动路径检索模块架构、规范和启动命令", "工具根据依赖关系预取上下游模块知识"],
    practices: ["按代码模块组织 `knowledge/`：每个模块目录固定包含 `概述.md / 架构设计.md / 技术栈.md / 编码规范.md / 特殊配置与命令.md`，避免同类知识使用不同文件名和结构。", "模块 `_module.yaml` 声明 `scope / source_files / depends_on / related_to`；顶层 `_index.yaml` 固定 `schema_version` 并导出模块树。新增、移动或删除模块时必须同步重建索引。"],
    check: "给定一个变更文件，工具能从 `_index.yaml` 的 scope 定位模块，再按固定卡片类型读取所需上下文；上下游关系可解析，缺卡、重复 scope 或索引漂移会被校验阻断。",
    templateLabel: "knowledge/zh/services-api/_module.yaml",
    template: `# Module directory must contain:
# - 概述.md
# - 架构设计.md
# - 技术栈.md
# - 编码规范.md
# - 特殊配置与命令.md
# After changing this module, regenerate the top-level _index.yaml.

schema_version: 1
module_path: services_api
title: API 服务
scope:
  - services/api/
source_files:
  - services/api/handler.ts
  - services/api/repository.ts
depends_on:
  - request_validation
related_to:
  - path: persistence
owner: api-platform
source_commit: <commit_sha>
last_verified: YYYY-MM-DD
review_when:
  - scoped files, dependencies, or required cards change`,
  },
  {
    name: "AGENTS.md",
    tag: "声明工作契约",
    scenarios: ["Agent 第一次进入仓库判断能改什么", "在脏工作树中安全修改并选择正确验证命令"],
    practices: ["根级说明地图、安全边界、权威命令和禁改目录；模块级只覆盖本模块差异，避免复制整份根规则。", "命令、端口、默认配置和外部状态必须当前可验证；长期理由放 decisions，真实调用放 validation log。"],
    check: "从空上下文进入时，Agent 能识别仓库入口、用户已有改动、不可执行动作和完成标准；所有链接均存在。",
    templateLabel: "AGENTS.md",
    template: `# Project map
- app/: product code
- docs/: architecture and decisions
- scripts/: start and validation entrypoints

# Before editing
- Preserve unrelated user changes.
- Read the nearest nested AGENTS.md.
- Never read or log credentials.

# Required validation
- ./scripts/verify.sh

# Safety boundaries
- Do not deploy, delete production data, or call paid APIs without explicit approval.
- Do not edit generated directories.

# Delivery
- Report changed files, validation evidence, and unverified external state.`,
  },
  {
    name: "启动入口",
    tag: "降低运行歧义",
    scenarios: ["新环境启动前检查 Node、依赖和端口", "修改完成后启动本地服务做最小冒烟"],
    practices: ["`--check` 只诊断版本、依赖和端口并返回非零退出码；真实启动与安装依赖分离。", "启动脚本打印访问地址、PID 和停止方式；不得打开浏览器、部署或请求真实生产接口。"],
    check: "全新 checkout 按 README 可启动；端口冲突不会停止未知进程；重复启动不会覆盖 `.env` 或修改依赖。",
    templateLabel: "scripts/start.sh",
    template: `#!/usr/bin/env bash
set -euo pipefail

app_port="\${APP_PORT:-3000}"
command -v node >/dev/null || { echo "Node.js is required" >&2; exit 1; }
test -d node_modules || { echo "Run the approved dependency setup first" >&2; exit 1; }

if lsof -nP -iTCP:"$app_port" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $app_port is already in use; existing process was not stopped" >&2
  exit 1
fi

if [[ "\${1:-}" == "--check" ]]; then
  echo "Environment ready on port $app_port"
  exit 0
fi

echo "Local URL: http://localhost:$app_port"
exec npm run dev -- --port "$app_port"`,
  },
  {
    name: "验证入口",
    tag: "统一完成标准",
    scenarios: ["提交前一键检查 lint、类型、测试和构建", "CI、Review Agent 与人工复核共享同一完成标准"],
    practices: ["按最快失败顺序执行格式、静态检查、测试、构建和安全扫描；任何一步失败立即返回非零。", "测试固定 mock 上游并隔离网络；脚本打印版本和命令，不用 `|| true` 吞掉失败。"],
    check: "本地与 CI 对同一提交结论一致；故意破坏测试会使入口失败；验证过程不读取真实 Key 或创建外部资源。",
    templateLabel: "scripts/verify.sh",
    template: `#!/usr/bin/env bash
set -euo pipefail

echo "Node: $(node --version)"
git diff --check
npm run lint
npm run typecheck
npm test
npm run build

echo "Validation passed; no production API was called."`,
  },
  {
    name: "测试规模",
    tag: "按风险设计覆盖",
    scenarios: ["支付、登录、权限等关键链路评估回归保护", "新增模块时确定单元、契约、集成和端到端测试组合"],
    practices: ["按业务风险维护测试清单：关键写链路至少有单元 + 契约 + 集成，用户可见流程补端到端。", "统计总数同时记录关键路径覆盖、变异测试或故障注入结果、flaky 比例和最近失败；目标不是追求数量。"],
    check: "删除关键校验或改坏协议时至少一项测试失败；flaky 测试有 Owner 和隔离期限；测试规模可由命令重新生成。",
    templateLabel: "docs/test-inventory.yaml",
    template: `critical_paths:
  - name: create-payment
    owner: payments-team
    risk: critical
    required_layers: [unit, contract, integration]
    commands:
      - pnpm test payment-unit
      - pnpm test payment-contract
      - pnpm test payment-integration
    failure_cases:
      - duplicate idempotency key
      - upstream timeout
      - database rollback

quality_limits:
  flaky_rate_max: 1%
  quarantine_days_max: 7`,
  },
];

const QUALITY_GATES = [
  {
    index: "01",
    title: "AI 代码自检",
    owner: "执行 Agent",
    scenarios: "代码写完、准备声明完成或提交 PR 前",
    practices: ["先把 Diff 对回 Spec 与任务清单：每个文件都能解释服务哪条验收条件，未计划文件必须删除或重新审批。", "再运行 `git diff --stat`、`git diff --check` 和受影响模块的验证入口；通过后立即形成可回滚的稳定提交点。"],
    evidence: "规格覆盖完整；所有必需命令 exit 0；无意外文件；未验证项单独列出",
    templateLabel: "PR 自检摘要",
    template: `## Self-check

- Spec: spec/<change>.md @ approved revision
- Plan tasks completed: <task ids>
- Scope: <changed modules>
- Diff reviewed: yes
- Unrelated changes: none
- Secrets / generated files: none

| Command | Result |
| --- | --- |
| git diff --check | pass |
| ./scripts/verify.sh | pass |
| browser: desktop + 375px | pass / n/a |

Unverified external state:
- production deployment
- real API behavior`,
  },
  {
    index: "02",
    title: "Review Agent",
    owner: "只读审查 Agent",
    scenarios: "PR 初审、跨文件回归、鉴权/并发/数据一致性专项审查",
    practices: ["同时读取 Spec、计划和 base SHA，沿调用链核对实现语义、同步变更与兼容性，只报告本次变更新增且可复现的问题。", "覆盖设计、正确性、复杂度、测试和文档；P0/P1 必须关联被违反的约束或验收条件，纯风格意见标为 Nit。"],
    evidence: "每条发现都有等级、位置、触发条件、影响、证据与验证路径",
    templateLabel: "Review Agent 输出",
    template: `## [P1] <short finding title>

- Location: path/to/file.ts:123
- Violated spec / constraint: <acceptance id or rule>
- Trigger: <specific input, state, or concurrency sequence>
- Impact: <user, security, data, or availability impact>
- Evidence: <code path, failing test, or reproduction>
- Minimal fix: <smallest safe direction>
- Verify: <exact command or scenario>

If no evidence-backed findings exist, return: 没有`,
  },
  {
    index: "03",
    title: "Agent 验收",
    owner: "验证 Agent",
    scenarios: "功能完成声明前、跨模块改造、UI 或 API 协议变化后",
    practices: ["直接从批准的 Spec 生成 Given / When / Then 验收矩阵，并关联实现文件、自动化测试和人工检查，不接受“测试已过”这一句结论。", "至少覆盖主路径、旧行为兼容、权限失败、边界输入和回滚；真实 API、云资源、付费调用与部署分别声明是否执行。"],
    evidence: "需求矩阵 100% 有证据；P0/P1 为零；失败与未执行项不隐藏",
    templateLabel: "验收矩阵",
    template: `| Spec acceptance | Evidence | Result |
| --- | --- | --- |
| AC-01 main path | test name / screenshot | pass |
| AC-02 old behavior stays compatible | contract test | pass |
| AC-03 unauthorized request is rejected | contract test | pass |
| AC-04 boundary input is handled | test name | pass |
| Rollback path exists | runbook link | pass |
| Real API call | not executed; approval required | not run |
| Production deployment | not executed | not run |

Blocking findings: 0
Unverified items: <list explicitly>`,
  },
  {
    index: "04",
    title: "人工审查",
    owner: "模块 Owner",
    scenarios: "业务意图、架构取舍、生产数据/权限/迁移变更和最终合并",
    practices: ["先判断 Spec 是否准确表达业务意图，再用 CODEOWNERS 将支付、鉴权、基础设施和迁移目录路由给对应团队。", "保护主分支：必需检查通过、禁止自审、推送新提交后撤销旧批准；人工负责模糊边界、风险接受和最终合并。"],
    evidence: "Owner 批准 + 必需检查通过 + 对话已解决 + 回滚责任人明确",
    templateLabel: ".github/CODEOWNERS",
    template: `# Default ownership
* @engineering-platform

# High-risk production areas
/services/payments/ @payments-team @security-team
/services/auth/ @identity-team @security-team
/infra/ @platform-team @sre-team
/migrations/ @database-team

# Repository policy and CI
/.github/ @engineering-platform
/scripts/ @engineering-platform`,
  },
];

const REVIEW_OUTPUT_ITEMS = [
  ["严重等级", "P0：立即止损；P1：合并前必须修；P2：高概率回归；P3：非阻断改进；纯风格标 Nit"],
  ["准确定位", "必须包含文件、行号和触发条件；无法定位到变更行时说明完整调用链"],
  ["影响说明", "明确用户、资金、权限、数据一致性、可用性或后续维护成本"],
  ["最小建议", "给出最小安全方向，避免 Reviewer 越权重写实现或扩大当前 PR"],
  ["验证路径", "提供能先失败后通过的测试、复现步骤或精确命令"],
];

const ACCEPTANCE_ITEMS = [
  ["需求符合", "所有验收条件可追溯到实现与测试"],
  ["范围受控", "无无关重构、依赖漂移或隐藏生成文件"],
  ["验证通过", "项目指定启动、测试、lint、构建入口全部通过"],
  ["安全合规", "权限、输入、密钥、日志与危险操作完成核查"],
  ["可维护", "命名、错误处理、注释和文档符合项目规则"],
  ["人工可审", "小批量 diff，包含 Why / What / Validation"],
];

const TRANSFORMATION_PROBLEMS = [
  {
    index: "01",
    title: "coding提效100% ≠ 交付提效100%",
    signal: "代码生成率上升，但需求澄清、Review、联调和返工继续排队。",
    response: "把优化边界扩展到需求、计划、实现、验收和知识回流，度量端到端交付而非生成量。",
  },
  {
    index: "02",
    title: "AI coding on 存量项目",
    signal: "局部测试通过，却遗漏参数顺序、下游调用、迁移窗口等隐性契约。",
    response: "先把契约写成可测试规格，再用项目知识、架构约束和契约测试限制实现空间。",
  },
  {
    index: "03",
    title: "复杂项目任务失焦",
    signal: "需求跨越多个模块后，上下文漂移、任务互相覆盖，变更范围越来越难审。",
    response: "把 Spec 编译成小任务，每项绑定输入、输出、Owner、依赖和验收证据，并及时形成稳定提交点。",
  },
];

const PRACTICE_JOURNEY = [
  {
    id: "specify",
    index: "01",
    stage: "SPECIFY",
    title: "把模糊需求编译成规格",
    question: "要解决什么？哪些行为绝不能改变？",
    mechanism: "用户故事 + 系统约束 + 可测试验收条件",
    evidence: "产品与接口 Owner 批准 spec/order-coupon.md",
    artifact: [
      "原始需求：订单接口支持优惠券",
      "约束：coupon_code 可选；现有参数顺序与错误码不变",
      "验收：旧调用方零修改；重复请求仍返回同一订单",
    ],
  },
  {
    id: "context",
    index: "02",
    stage: "CONTEXT",
    title: "在编码前装配项目知识",
    question: "目标模块依赖谁？隐性契约和历史决策在哪里？",
    mechanism: "Wiki 导航 + 知识卡片预取 + 代码现场核验",
    evidence: "定位 3 个调用方、1 条幂等规则和 2 个契约测试",
    artifact: [
      "入口：services/order/create-order.ts",
      "调用方：web-checkout / mobile-checkout / batch-retry",
      "契约：请求字段只可尾部追加；幂等键必须透传",
    ],
  },
  {
    id: "plan",
    index: "03",
    stage: "PLAN",
    title: "把规格拆成可审小任务",
    question: "如何让每一步都能独立验证、失败和回滚？",
    mechanism: "影响面 → 依赖顺序 → 小任务 → 验收命令",
    evidence: "计划覆盖接口、实现、测试和文档，无跨任务隐式依赖",
    artifact: [
      "T1 契约测试：锁定旧请求兼容性",
      "T2 最小实现：新增可选字段，不重排参数",
      "T3 调用链回归：三类消费者 + 幂等重试",
    ],
  },
  {
    id: "implement",
    index: "04",
    stage: "IMPLEMENT",
    title: "在护栏内执行最小变更",
    question: "Agent 能改什么、能调用什么、何时必须停？",
    mechanism: "Rules + Skills + 最小权限工具 + Hooks + 小批量提交",
    evidence: "Diff 只覆盖计划文件；越权路径和危险命令被确定性阻断",
    artifact: [
      "允许：订单模块、契约测试、对应文档",
      "禁止：部署、生产写入、删除、修改无关消费者",
      "停止：契约测试失败或发现未记录的调用方",
    ],
  },
  {
    id: "validate",
    index: "05",
    stage: "VALIDATE",
    title: "用证据证明符合规格",
    question: "完成声明能否逐条回到验收条件？",
    mechanism: "自检 → 独立 Review → 验收矩阵 → Owner 批准",
    evidence: "每条验收条件都有测试、命令或人工结论；未验证项显式列出",
    artifact: [
      "兼容性：3 个旧请求样例全部通过",
      "幂等性：重复请求返回同一 order_id",
      "人工门禁：接口 Owner 确认无破坏性变更",
    ],
  },
  {
    id: "evolve",
    index: "06",
    stage: "EVOLVE",
    title: "让本次经验进入下次任务",
    question: "这次成功或失败，应该改变哪项工程资产？",
    mechanism: "成功提炼复用模式；失败做根因分类并更新护栏",
    evidence: "新增兼容性知识卡与回归测试，来源提交和复核 Owner 可追溯",
    artifact: [
      "成功：把“字段尾部追加”写入接口兼容 Skill",
      "失败：若漏调用方，更新依赖卡片和契约测试",
      "边界：能力不足时缩小任务并升级人工处理",
    ],
  },
];

const KNOWLEDGE_LAYERS = [
  ["Wiki / zh/content/", "面向人的主题型系统叙事", "按阅读逻辑组织完整文章，包含目录、<cite> 文件引用与代码行级章节来源。"],
  ["知识卡片 / knowledge/", "面向 AI / 工具的固定结构上下文", "按模块保存五类固定卡片，用 _module.yaml 与 _index.yaml 描述 scope、模块树和依赖关系。"],
  ["Memory", "经过验证的长期经验", "保存有来源、有 Owner、有失效条件的项目事实与复盘结论。"],
];

const KNOWLEDGE_LIFECYCLE = [
  "扫描代码与文件关系",
  "按模块生成五类结构化知识卡",
  "更新 _module.yaml 与顶层 _index.yaml",
  "按阅读主题生成 Wiki 与代码引用",
  "任务按 scope 和依赖预取并核验",
  "来源 Diff 触发局部重建或失效",
];

const SPEC_STAGES = [
  ["01", "Specify", "spec.md", "用户故事、系统约束、可测试验收条件；有歧义就先提问。"],
  ["02", "Plan", "plan.md", "影响模块、任务依赖、Owner、风险、回滚与逐项验证命令。"],
  ["03", "Implement", "small diff", "一次只完成一个可验证意图，通过即形成稳定提交点。"],
  ["04", "Validate", "evidence.md", "从规格生成测试与验收矩阵，失败回到对应阶段修正。"],
];

const SOURCE_LINKS = [
  {
    label: "团队级工程治理案例",
    note: "从代码生成率转向规格驱动、全链路闭环与团队级护栏",
    href: "https://qoder.com/blog/qoder-case-amap",
  },
  {
    label: "自迭代知识工程案例",
    note: "Wiki、知识卡片与长期经验的分层、检索、治理和增量更新",
    href: "https://qoder.com/blog/qoder-knowledge-engine",
  },
  {
    label: "存量项目渐进改造案例",
    note: "小任务、上下文控制、及时提交与成功失败双向复盘",
    href: "https://qoder.com/blog/qoder-case-newloop",
  },
  {
    label: "上下文资产实践",
    note: "Rules 的适用范围、结构、示例与持续迭代",
    href: "https://docs.qoder.com/zh/user-guide/rules",
  },
  {
    label: "项目知识实践",
    note: "架构、Spec、技术栈知识的生成、共享与更新",
    href: "https://docs.qoder.com/zh/user-guide/knowledge-engine/knowledge-cards",
  },
  {
    label: "确定性门禁实践",
    note: "危险操作拦截、写后校验与失败反馈",
    href: "https://docs.qoder.com/zh/extensions/hooks",
  },
  {
    label: "代码审查实践",
    note: "设计、正确性、复杂度、测试、文档与人工判断",
    href: "https://google.github.io/eng-practices/review/reviewer/looking-for.html",
  },
  {
    label: "生产分支保护实践",
    note: "CODEOWNERS、必需审查、状态检查与受保护分支",
    href: "https://docs.github.com/en/pull-requests/reference/managing-and-standardizing-pull-requests",
  },
];

type CopyFeedback = {
  id: string;
  status: "copied" | "error";
} | null;

function CopyableTemplate({
  id,
  label,
  content,
  feedback,
  onCopy,
}: {
  id: string;
  label: string;
  content: string;
  feedback: CopyFeedback;
  onCopy: (id: string, content: string) => Promise<void>;
}) {
  const state = feedback?.id === id ? feedback.status : "idle";

  return (
    <details className="ai-coding-copy-block" data-copy-template={id}>
      <summary>
        <span>可复制模板</span>
        <b>{label}</b>
      </summary>
      <div>
        <header>
          <code>{label}</code>
          <button onClick={() => void onCopy(id, content)} type="button">
            {state === "copied" ? "已复制" : state === "error" ? "复制失败" : "复制"}
          </button>
        </header>
        <pre><code>{content}</code></pre>
      </div>
    </details>
  );
}

export function AiCodingWorkbench() {
  const [selectedJourneyId, setSelectedJourneyId] = useState("specify");
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>(null);
  const [apiResponse, setApiResponse] = useState<unknown>(() =>
    buildAiCodingMetricsResponse(),
  );
  const [apiState, setApiState] = useState<"ready" | "loading" | "error">(
    "ready",
  );

  const selectedJourney =
    PRACTICE_JOURNEY.find((step) => step.id === selectedJourneyId) ??
    PRACTICE_JOURNEY[0];
  const metricsApiUrl = `/api/ai-coding/metrics?org_id=${AI_CODING_ORGANIZATION.id}&period=30d&scope=organization`;

  const copyTemplate = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyFeedback({ id, status: "copied" });
    } catch {
      setCopyFeedback({ id, status: "error" });
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch(metricsApiUrl, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error("mock metrics request failed");
        setApiResponse(body);
        setApiState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setApiState("error");
      });
    return () => controller.abort();
  }, [metricsApiUrl]);

  return (
    <div className="ai-coding" id="ai-coding">
      <section className="ai-coding-hero">
        <div className="ai-coding-hero-copy">
          <p className="ai-coding-kicker">
            <span aria-hidden="true" />
            ENTERPRISE AI DELIVERY SYSTEM
          </p>
          <h1>
            AI coding
            <br />
            可验证交付体系
          </h1>
          <p>
            演示如何把模糊需求变成规格，把项目知识变成任务上下文，把 Agent
            能力约束在工程护栏内，并让每次交付的证据与经验持续回流。
          </p>
          <div className="ai-coding-hero-actions">
            <a href="#practice-loop">运行交付演示</a>
            <a href="#ai-metrics">查看效能指标</a>
          </div>
        </div>

        <aside className="ai-coding-principles-card" aria-label="AI coding 工程化原则">
          <header>
            <div>
              <span>ENGINEERING THESIS</span>
              <strong>从“生成代码”到“交付系统”</strong>
            </div>
            <b>4 RULES</b>
          </header>
          <ol>
            <li><span>01</span><div><b>规格先于代码</b><p>先消除意图歧义，再允许执行。</p></div></li>
            <li><span>02</span><div><b>知识先于搜索</b><p>在任务开始时提供高密度项目语义。</p></div></li>
            <li><span>03</span><div><b>门禁先于信任</b><p>用架构约束、测试和权限控制结果。</p></div></li>
            <li><span>04</span><div><b>经验必须回流</b><p>把成功与失败沉淀成下一次的工程资产。</p></div></li>
          </ol>
          <footer>北极星不是生成代码行数，而是更快、更稳、更少返工的可验证交付。</footer>
        </aside>
      </section>

      <nav className="ai-coding-section-nav" aria-label="AI coding 栏目目录">
        <a href="#agent-assets"><span>01</span>Agent 资产管理</a>
        <a href="#project-assets"><span>02</span>项目资产</a>
        <a href="#code-quality"><span>03</span>代码质量</a>
        <a href="#ai-metrics"><span>04</span>AI 效能度量</a>
      </nav>

      <section className="ai-coding-thesis" aria-labelledby="ai-coding-thesis-title">
        <header>
          <div>
            <span>WHY ENGINEERING, NOT VIBES</span>
            <h2 id="ai-coding-thesis-title">先解决三个生产问题</h2>
          </div>
          <p>代码能生成只是起点；团队真正需要解决的是全链路等待、存量系统兼容和复杂任务失控。</p>
        </header>
        <div>
          {TRANSFORMATION_PROBLEMS.map((problem) => (
            <article key={problem.index}>
              <span>{problem.index}</span>
              <h3>{problem.title}</h3>
              <dl>
                <div><dt>失败信号</dt><dd>{problem.signal}</dd></div>
                <div><dt>工程响应</dt><dd>{problem.response}</dd></div>
              </dl>
            </article>
          ))}
        </div>
        <footer>
          <strong>价值判断</strong>
          <p>需求交付周期 × 一次验收通过 × 线上质量 × 知识复用，而不是单独展示代码生成率。</p>
        </footer>
      </section>

      <section className="ai-coding-journey" id="practice-loop" aria-labelledby="practice-loop-title">
        <header>
          <div>
            <span>RUNNING CASE · LEGACY ORDER API</span>
            <h2 id="practice-loop-title">用一个存量接口变更演示完整闭环</h2>
          </div>
          <p>演示任务：为订单创建接口增加可选优惠券字段，同时保持旧调用方、参数顺序、错误码和幂等行为不变。</p>
        </header>

        <div className="ai-coding-journey-shell">
          <nav aria-label="最佳实践闭环步骤">
            {PRACTICE_JOURNEY.map((step) => (
              <button
                aria-pressed={step.id === selectedJourney.id}
                className={step.id === selectedJourney.id ? "is-active" : ""}
                key={step.id}
                onClick={() => setSelectedJourneyId(step.id)}
                type="button"
              >
                <span>{step.index}</span>
                <b>{step.stage}</b>
                <small>{step.title}</small>
              </button>
            ))}
          </nav>

          <article key={selectedJourney.id}>
            <header>
              <div>
                <span>{selectedJourney.stage}</span>
                <h3>{selectedJourney.title}</h3>
              </div>
              <b>{selectedJourney.index} / 06</b>
            </header>
            <div className="ai-coding-journey-detail">
              <dl>
                <div><dt>关键问题</dt><dd>{selectedJourney.question}</dd></div>
                <div><dt>工程机制</dt><dd>{selectedJourney.mechanism}</dd></div>
                <div><dt>过关证据</dt><dd>{selectedJourney.evidence}</dd></div>
              </dl>
              <div>
                <span>当前产物</span>
                <ul>{selectedJourney.artifact.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>
            <footer>
              规格决定“做什么”，项目知识决定“理解什么”，工程护栏决定“如何受控执行”，证据决定“是否完成”。
            </footer>
          </article>
        </div>
      </section>

      <section className="ai-coding-section ai-coding-assets" id="agent-assets">
        <header className="ai-coding-heading">
          <div>
            <p>01 / AGENT ASSET MANAGEMENT</p>
            <h2>Agent 资产管理</h2>
          </div>
          <p>
            Agent 资产不是功能收藏，而是执行护栏。每项资产都必须回答：在哪个交付阶段生效、约束什么风险、产生什么证据、失败后如何更新。
          </p>
        </header>

        <div className="ai-coding-lifecycle" aria-label="Agent 受控交付流程">
          {[
            "规格输入",
            "知识预取",
            "任务拆解",
            "最小变更",
            "证据验收",
            "经验回流",
          ].map((step, index) => (
            <div key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>

        <div className="ai-coding-asset-grid">
          {AGENT_ASSETS.map((asset, index) => (
            <article key={asset.name}>
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{asset.tag}</b>
              </header>
              <h3>{asset.name}</h3>
              <div className="ai-coding-use-cases">
                <strong>核心场景</strong>
                <ul>{asset.scenarios.map((scenario) => <li key={scenario}>{scenario}</li>)}</ul>
              </div>
              <div className="ai-coding-practice-list">
                <strong>最佳实践</strong>
                {asset.practices.map(([title, detail]) => (
                  <div key={title}><b>{title}</b><p>{detail}</p></div>
                ))}
              </div>
              <CopyableTemplate
                content={asset.template}
                feedback={copyFeedback}
                id={`agent-${asset.name.toLowerCase()}`}
                label={asset.templateLabel}
                onCopy={copyTemplate}
              />
              <footer>
                <p><b>落地验收</b>{asset.check}</p>
                <a href={asset.href} rel="noreferrer" target="_blank">查看实践来源 ↗</a>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="ai-coding-section ai-coding-projects" id="project-assets">
        <header className="ai-coding-heading">
          <div>
            <p>02 / PROJECT HARNESS</p>
            <h2>项目资产</h2>
          </div>
          <p>
            项目资产的目标不是给模型更多文字，而是在正确时机提供高密度、可验证的工程语义，减少每次任务从零理解项目的随机性。
          </p>
        </header>

        <div className="ai-coding-knowledge-engine">
          <header>
            <div>
              <span>PROJECT UNDERSTANDING INFRASTRUCTURE</span>
              <h3>知识分层：同一项目，不同消费方式</h3>
            </div>
            <p>代码定位回答“在哪里”，项目知识还要回答“为什么这样做、不能破坏什么、改动必须同步到哪里”。</p>
          </header>
          <div className="ai-coding-knowledge-layout">
            <div className="ai-coding-knowledge-layers">
              {KNOWLEDGE_LAYERS.map(([name, role, detail], index) => (
                <article key={name}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><h4>{name}</h4><b>{role}</b><p>{detail}</p></div>
                </article>
              ))}
            </div>
            <div className="ai-coding-knowledge-cycle">
              <span>SELF-ITERATING LIFECYCLE</span>
              <ol>
                {KNOWLEDGE_LIFECYCLE.map((step, index) => (
                  <li key={step}><b>{String(index + 1).padStart(2, "0")}</b><p>{step}</p></li>
                ))}
              </ol>
            </div>
          </div>
          <footer>
            <strong>知识质量门槛</strong>
            <p>每条任务知识必须包含来源、适用范围、Owner、最近复核时间和失效触发器；过期内容不得自动注入。</p>
          </footer>
        </div>

        <div className="ai-coding-project-practice-grid">
          {PROJECT_ASSETS.map((asset, index) => (
            <article className="ai-coding-project-practice-card" key={asset.name}>
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <small>{asset.tag}</small>
                  <h3>{asset.name}</h3>
                </div>
              </header>
              <div className="ai-coding-project-scenarios">
                <strong>核心场景</strong>
                <ul>{asset.scenarios.map((scenario) => <li key={scenario}>{scenario}</li>)}</ul>
              </div>
              <div className="ai-coding-project-practices">
                <strong>最佳实践</strong>
                <ol>{asset.practices.map((practice) => <li key={practice}>{practice}</li>)}</ol>
              </div>
              <CopyableTemplate
                content={asset.template}
                feedback={copyFeedback}
                id={`project-${asset.name}`}
                label={asset.templateLabel}
                onCopy={copyTemplate}
              />
              <footer><b>完成标准</b><p>{asset.check}</p></footer>
            </article>
          ))}
        </div>
      </section>

      <section className="ai-coding-section ai-coding-quality" id="code-quality">
        <header className="ai-coding-heading ai-coding-heading-dark">
          <div>
            <p>03 / QUALITY GATES</p>
            <h2>代码质量</h2>
          </div>
          <p>
            代码质量首先是实现与规格一致，其次才是代码风格。规格、计划、最小变更和验收形成主循环，独立审查与人工批准负责兜底。
          </p>
        </header>

        <div className="ai-coding-spec-flow" aria-label="规格驱动交付流程">
          {SPEC_STAGES.map(([index, name, output, detail]) => (
            <article key={name}>
              <header><span>{index}</span><b>{name}</b></header>
              <code>{output}</code>
              <p>{detail}</p>
            </article>
          ))}
        </div>

        <div className="ai-coding-gate-grid">
          {QUALITY_GATES.map((gate) => (
            <article key={gate.index}>
              <span>{gate.index}</span>
              <small>{gate.owner}</small>
              <h3>{gate.title}</h3>
              <div className="ai-coding-gate-scene"><b>适用场景</b><p>{gate.scenarios}</p></div>
              <div className="ai-coding-gate-practices">
                <b>最佳实践</b>
                <ul>{gate.practices.map((practice) => <li key={practice}>{practice}</li>)}</ul>
              </div>
              <CopyableTemplate
                content={gate.template}
                feedback={copyFeedback}
                id={`quality-${gate.index}`}
                label={gate.templateLabel}
                onCopy={copyTemplate}
              />
              <footer><b>验收证据</b>{gate.evidence}</footer>
            </article>
          ))}
        </div>

        <div className="ai-coding-review-layout">
          <article className="ai-coding-review-guide">
            <header>
              <div>
                <span>REVIEW OUTPUT CONTRACT</span>
                <h3>高质量审查意见怎么写</h3>
              </div>
              <b>只报有证据的问题</b>
            </header>
            <ol>
              {REVIEW_OUTPUT_ITEMS.map(([title, detail], index) => (
                <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{title}</strong><p>{detail}</p></div></li>
              ))}
            </ol>
            <footer>
              <strong>人工审查边界</strong>
              <p>AI 负责扩大检查面和提供证据；模块 Owner 负责业务意图、架构取舍、风险接受与最终合并。</p>
            </footer>
          </article>

          <article className="ai-coding-acceptance">
            <header>
              <span>AGENT ACCEPTANCE STANDARD</span>
              <h3>Agent 验收标准</h3>
            </header>
            <ul>
              {ACCEPTANCE_ITEMS.map(([title, detail]) => (
                <li key={title}>
                  <span aria-hidden="true">✓</span>
                  <div><strong>{title}</strong><p>{detail}</p></div>
                </li>
              ))}
            </ul>
            <footer>任一 P0 / P1 未关闭，或关键验证无证据：不得交付。</footer>
          </article>
        </div>

        <div className="ai-coding-learning-loop">
          <header>
            <span>POST-TASK LEARNING LOOP</span>
            <h3>完成任务不是终点，护栏变强才是闭环</h3>
          </header>
          <div>
            <article>
              <span>SUCCESS</span>
              <h4>成功经验标准化</h4>
              <p>提炼可复用的方法，进入 Skill、Rule、知识卡片或测试；记录来源提交、适用范围和复核 Owner。</p>
            </article>
            <article>
              <span>CONTROLLABLE FAILURE</span>
              <h4>可控问题修工程系统</h4>
              <p>需求不清就补 Spec，知识缺失就补关系卡片，规则失效就加 Hook 或测试，代码难改就先处理结构债务。</p>
            </article>
            <article>
              <span>CAPABILITY BOUNDARY</span>
              <h4>能力边界不强行自动化</h4>
              <p>缩小任务、减少上下文、切换为人工主导或专项 Agent；把未验证项和接管点留在交付记录中。</p>
            </article>
          </div>
        </div>
      </section>

      <section className="ai-coding-section ai-coding-metrics" id="ai-metrics">
        <header className="ai-coding-heading">
          <div>
            <p>04 / AI ENGINEERING METRICS</p>
            <h2>AI 效能度量</h2>
          </div>
          <p>
            同时观察代码进入主干的规模、资产复用、模型资源消耗与端到端交付周期；TOP 3 用于发现差异，不等同于绩效排名。以下组织与数据均为模拟。
          </p>
        </header>

        <div className="ai-coding-filterbar">
          <div>
            <span>组织</span>
            <strong>{AI_CODING_ORGANIZATION.name}</strong>
          </div>
          <div>
            <span>排名范围</span>
            <strong>组织内部门 / 资产 TOP 3</strong>
          </div>
          <div>
            <span>统计周期</span>
            <strong>最近 30 天</strong>
          </div>
          <div className="ai-coding-data-badge">
            <span aria-hidden="true" />
            SIMULATED DATA
          </div>
        </div>

        <div className="ai-coding-metric-grid">
          {AI_CODING_METRICS.map((item, index) => (
            <article className={item.kind === "ranking" ? "is-ranking" : "is-scalar"} key={item.id}>
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b className={item.kind === "scalar" ? "is-down" : ""}>
                  {item.kind === "ranking" ? "TOP 3" : item.delta}
                </b>
              </header>
              {item.kind === "ranking" ? (
                <>
                  <h3>{item.label}</h3>
                  <ol className="ai-coding-ranking-list">
                    {item.rankings.map((ranking, rankingIndex) => (
                      <li key={ranking.name}>
                        <span>{rankingIndex + 1}</span>
                        <b>{ranking.name}</b>
                        <strong>{ranking.display}</strong>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <>
                  <strong>{item.display}</strong>
                  <h3>{item.label}</h3>
                </>
              )}
              <p>{item.interpretation}</p>
              <details>
                <summary>指标口径</summary>
                <span>{item.formula}</span>
              </details>
            </article>
          ))}
        </div>

        <div className="ai-coding-metric-detail-grid">
          <article className="ai-coding-trend-card">
            <header>
              <div>
                <span>4 WEEK TREND</span>
                <h3>入库、Skill 与 MCP 使用趋势</h3>
              </div>
              <ul>
                <li><i className="is-merge" />AI 代码入库率</li>
                <li><i className="is-skill" />Skill 使用率</li>
                <li><i className="is-mcp" />MCP 使用率</li>
              </ul>
            </header>
            <div className="ai-coding-trend-chart">
              {AI_CODING_TREND.map((point) => (
                <div key={point.week}>
                  <div className="ai-coding-bar-group">
                    <span className="is-merge" style={{ height: `${point.mergeRate}%` }} title={`AI 代码入库率 ${point.mergeRate}%`} />
                    <span className="is-skill" style={{ height: `${point.skill}%` }} title={`Skill 使用率 ${point.skill}%`} />
                    <span className="is-mcp" style={{ height: `${point.mcp}%` }} title={`MCP 使用率 ${point.mcp}%`} />
                  </div>
                  <small>{point.week}</small>
                </div>
              ))}
            </div>
            <footer>组织级趋势 · 仅用于演示指标间的联动关系</footer>
          </article>

          <article className="ai-coding-api-card">
            <header>
              <div>
                <span>METRICS API · MOCK</span>
                <h3>关联 API 接口详情</h3>
              </div>
              <b className={`is-${apiState}`}>
                {apiState === "loading" ? "请求中" : apiState === "error" ? "本地错误" : "HTTP 200"}
              </b>
            </header>
            <div className="ai-coding-api-request">
              <span>GET</span>
              <code>/api/ai-coding/metrics</code>
            </div>
            <dl>
              <div><dt>org_id</dt><dd>{AI_CODING_ORGANIZATION.id}</dd></div>
              <div><dt>period</dt><dd>30d</dd></div>
              <div><dt>scope</dt><dd>organization</dd></div>
            </dl>
            <pre aria-label="模拟指标 API 响应">{JSON.stringify(apiResponse, null, 2)}</pre>
            <footer>
              <span>X-Data-Mode: simulation</span>
              <p>同源只读模拟接口；无凭证、无外部请求、无真实组织数据。</p>
            </footer>
          </article>
        </div>
      </section>

      <section className="ai-coding-sources" aria-label="最佳实践研究依据">
        <header>
          <span>RESEARCH LEDGER</span>
          <h2>最佳实践研究依据</h2>
          <p>仅提炼跨工具可迁移的工程机制；栏目内容不绑定具体产品。</p>
        </header>
        <div>
          {SOURCE_LINKS.map((source, index) => (
            <a href={source.href} key={source.href} rel="noreferrer" target="_blank">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{source.label}</strong>
              <small>{source.note}</small>
              <b aria-hidden="true">↗</b>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
