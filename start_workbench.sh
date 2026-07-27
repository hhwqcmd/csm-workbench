#!/usr/bin/env bash

set -euo pipefail

readonly PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly REQUIRED_NODE_MAJOR=22
readonly REQUIRED_NODE_MINOR=13
readonly WORKBENCH_PORT="${SEEDANCE_WORKBENCH_PORT:-3001}"

usage() {
  cat <<'EOF'
用法：
  ./start_workbench.sh          启动 Seedance 演示工作台
  ./start_workbench.sh --check  仅检查启动环境
  ./start_workbench.sh --help   显示帮助

可选环境变量：
  SEEDANCE_WORKBENCH_PORT       监听端口，默认 3001
EOF
}

fail() {
  printf '启动失败：%s\n' "$1" >&2
  exit 1
}

check_command() {
  command -v "$1" >/dev/null 2>&1 || fail "未找到 $1，请先安装 Node.js 22.13 或更高版本。"
}

check_node_version() {
  local version major minor
  version="$(node --version)"
  version="${version#v}"
  IFS=. read -r major minor _ <<<"$version"

  if ((major < REQUIRED_NODE_MAJOR)) ||
    ((major == REQUIRED_NODE_MAJOR && minor < REQUIRED_NODE_MINOR)); then
    fail "当前 Node.js 为 v${version}，项目要求 v${REQUIRED_NODE_MAJOR}.${REQUIRED_NODE_MINOR}.0 或更高版本。"
  fi
}

check_port() {
  if [[ ! "$WORKBENCH_PORT" =~ ^[0-9]+$ ]] ||
    ((WORKBENCH_PORT < 1 || WORKBENCH_PORT > 65535)); then
    fail "SEEDANCE_WORKBENCH_PORT 必须是 1 到 65535 之间的整数。"
  fi
}

check_dependencies() {
  if [[ ! -x "$PROJECT_DIR/node_modules/.bin/vinext" ]]; then
    fail "项目依赖尚未安装。请先在 $PROJECT_DIR 运行 npm install。"
  fi
}

case "${1:-}" in
  "")
    ;;
  --check)
    ;;
  --help | -h)
    usage
    exit 0
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

check_command node
check_command npm
check_node_version
check_port
check_dependencies

if [[ "${1:-}" == "--check" ]]; then
  printf '环境检查通过：Node.js %s，端口 %s，项目依赖已就绪。\n' \
    "$(node --version)" "$WORKBENCH_PORT"
  exit 0
fi

cd "$PROJECT_DIR"

printf '正在启动 Seedance 2.0 视频生成演示工作台…\n'
printf '访问地址：http://localhost:%s\n' "$WORKBENCH_PORT"
printf '按 Ctrl+C 停止服务。\n\n'

exec npm run dev -- --port "$WORKBENCH_PORT"
