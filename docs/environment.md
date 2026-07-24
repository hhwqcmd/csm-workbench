# Python 环境

## 当前状态

2026-07-24 已运行官方 `scripts/init_dev_env/setup_mac.sh` 并完成验收：

- uv：0.11.26（系统已安装）
- 项目 Python：3.12.13
- 虚拟环境：`official-quickstart/.venv`
- `volcengine-python-sdk`：5.0.42
- SDK 入口：`from volcenginesdkarkruntime import Ark`
- 启动脚本：`official-quickstart/run_demo.sh`

系统默认 Python 3.11.15 未被修改。安装和验收阶段没有运行
`run_demo.sh`，因此没有读取 API Key 或创建视频任务。

## 验证命令

在 `official-quickstart/` 下运行：

```bash
./.venv/bin/python --version
./.venv/bin/python -c "from importlib.metadata import version; from volcenginesdkarkruntime import Ark; print(version('volcengine-python-sdk'))"
bash -n run_demo.sh
```

预期 Python 为 3.12.x、SDK 可以导入、启动脚本语法检查退出码为 0。

## 启动脚本边界

`run_demo.sh` 只做三件事：

1. 进入脚本所在目录。
2. 激活 `.venv`。
3. 运行 `python/demo_standard.py`。

第三步会进入 API Key 检查和真实任务流程，因此只有在请求参数、凭证与成本边界均经用户明确确认后才能执行。

## 重建

`.venv` 和 `run_demo.sh` 都是生成产物，不提交版本库。需要重建时，先确认没有正在使用该环境的进程，再从
`official-quickstart/` 运行：

```bash
bash scripts/init_dev_env/setup_mac.sh
```

不要把环境重建与 `run_demo.sh` 串联执行。
