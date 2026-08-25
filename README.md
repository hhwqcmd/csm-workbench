# 火山方舟 API 演示与模板资产平台

面向本地现场演示和方案验证的统一工作台，包含八个平级顶级栏目：

- 01 模板资产库
- 02 Seedance
- 03 Seedream
- 04 Responses API
- 05 Messages API（Anthropic 兼容）
- 06 Managed Agents
- 07 LLM 趋势
- 08 AI coding

各执行型栏目提供完整 API 审核、显式费用确认、结果、浏览器本机历史和脱敏日志。Seedance 默认连接为标准官方 API 与 `doubao-seedance-2-0-mini-260615`；Messages API 只使用固定方舟 Anthropic 兼容入口、普通方舟 Key 和固定版本头。

项目当前仅用于本地开发、调试和验证，不保存或部署新的 Sites 版本，也不会在页面加载或自动化测试时执行真实付费调用。

## 本地运行

```bash
npm install
./start_workbench.sh
```

默认地址为 `http://localhost:3001`，按 `Ctrl+C` 停止服务。脚本会检查 Node.js
版本、端口和项目依赖，但不会自动安装依赖或打开浏览器。

只检查环境：

```bash
./start_workbench.sh --check
```

临时使用其他端口：

```bash
SEEDANCE_WORKBENCH_PORT=3100 ./start_workbench.sh
```

也可直接运行 `npm run dev -- --port 3001`。

## 验证

```bash
npm test
npm run lint
bash -n start_workbench.sh
./start_workbench.sh --check
python3 -m py_compile official-quickstart/python/demo_standard.py
bash -n official-quickstart/scripts/init_dev_env/setup_mac.sh
git diff --check
```

当前规则、模块地图、安全边界和提交规范见 [AGENTS.md](./AGENTS.md)；
架构原因见 [docs/decisions.md](./docs/decisions.md)，真实 API 验收见
[docs/validation-log.md](./docs/validation-log.md)。
