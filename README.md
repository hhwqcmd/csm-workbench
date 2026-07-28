# Seedance 2.0 视频生成演示与模板资产库

面向现场演示和方案验证的 Seedance 平台，包含平级的“演示工作台”和“模板资产库”：

- 选择 API 路径、Base URL、模型和 API Key。
- 浏览八个官方示例和四类模板资产，并一键预填实操参数。
- 编辑提示词、素材、比例、时长、音频和水印参数。
- 查看并编辑完整 API Request Body，和表单双向联动。
- 创建真实任务并每 30 秒查询状态。
- 在当前浏览器保存最近 30 次提交，查看每次创建和查询的请求/响应日志。

默认连接配置为官方 API 与 `doubao-seedance-2-0-mini-260615`。
生产站点采用公开直达；每位访问者自行输入凭证，服务端不保存 Key。

[打开生产站点](https://seedance-2-demo-workbench-0724.huanghewq.chatgpt.site/#templates)

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
```

当前规则、模块地图、安全边界和提交规范见 [AGENTS.md](./AGENTS.md)；
架构原因见 [docs/decisions.md](./docs/decisions.md)，真实 API 验收见
[docs/validation-log.md](./docs/validation-log.md)。
