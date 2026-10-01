#!/usr/bin/env bash

set -euo pipefail

readonly PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly REQUIRED_NODE_MAJOR=22
readonly REQUIRED_NODE_MINOR=13
readonly WORKBENCH_PORT="${SEEDANCE_WORKBENCH_PORT:-3001}"
readonly RUNTIME_DIR="$PROJECT_DIR/.workbench"
readonly PID_FILE="$RUNTIME_DIR/run-$WORKBENCH_PORT.pid"
readonly LOG_FILE="$RUNTIME_DIR/run-$WORKBENCH_PORT.log"
readonly READY_TIMEOUT_SECONDS=60
readonly ACTION="${1:-}"

usage() {
  cat <<'EOF'
用法：
  ./start_workbench.sh          在后台启动 Seedance 演示工作台
  ./start_workbench.sh --stop   停止后台运行的服务
  ./start_workbench.sh --check  仅检查启动环境
  ./start_workbench.sh --help   显示帮助

可选环境变量：
  SEEDANCE_WORKBENCH_PORT       监听端口，默认 3001（--stop 需与启动时一致）

运行状态保存在 .workbench/ 目录：run-<端口>.pid 记录后台进程，run-<端口>.log 记录日志。
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

port_is_listening() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
  else
    (exec 3<>"/dev/tcp/127.0.0.1/$1") >/dev/null 2>&1
  fi
}

port_listener_pids() {
  command -v lsof >/dev/null 2>&1 || return 1
  lsof -tiTCP:"$1" -sTCP:LISTEN 2>/dev/null || return 1
}

process_alive() {
  local pid="$1" state
  kill -0 "$pid" 2>/dev/null || return 1

  state="$(ps -o state= -p "$pid" 2>/dev/null | tr -d '[:space:]' || true)"
  if [[ "$state" == Z* ]]; then
    return 1
  fi
}

running_pid() {
  local pid
  [[ -f "$PID_FILE" ]] || return 1
  read -r pid <"$PID_FILE" || return 1
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  process_alive "$pid" || return 1

  printf '%s\n' "$pid"
}

is_workbench_process() {
  local args
  args="$(ps -ww -o command= -p "$1" 2>/dev/null || true)"
  if [[ "$args" == *"$PROJECT_DIR"* || "$args" == *"vinext"* ]]; then
    return 0
  fi
  return 1
}

kill_tree() {
  local pid="$1" signal="${2:-TERM}" child
  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_tree "$child" "$signal"
  done
  kill "-$signal" "$pid" 2>/dev/null || true
}

start_workbench() {
  local pid="" listener i

  pid="$(running_pid || true)"
  if [[ -n "$pid" ]]; then
    if port_is_listening "$WORKBENCH_PORT"; then
      printf '工作台已在后台运行（PID %s）：http://localhost:%s\n' "$pid" "$WORKBENCH_PORT"
    else
      printf '后台进程仍在（PID %s），但端口 %s 尚未监听，可能正在启动中。\n' "$pid" "$WORKBENCH_PORT"
      printf '查看日志：%s（如确认异常请运行 ./start_workbench.sh --stop）\n' "$LOG_FILE"
    fi
    printf '如需重启：先运行 ./start_workbench.sh --stop。\n'
    return 0
  fi

  if port_is_listening "$WORKBENCH_PORT"; then
    listener="$(port_listener_pids "$WORKBENCH_PORT" | head -n 1 || true)"
    if [[ -n "$listener" ]] && is_workbench_process "$listener"; then
      fail "端口 ${WORKBENCH_PORT} 上已有工作台在运行（PID ${listener}）。请先运行 ./start_workbench.sh --stop，或改用其他端口。"
    fi
    fail "端口 ${WORKBENCH_PORT} 已被其他进程占用。请先释放端口，或用 SEEDANCE_WORKBENCH_PORT 指定其他端口。"
  fi

  mkdir -p "$RUNTIME_DIR"
  printf '\n[%s] 后台启动：npm run dev -- --port %s\n' \
    "$(date '+%Y-%m-%d %H:%M:%S')" "$WORKBENCH_PORT" >>"$LOG_FILE"

  printf '正在后台启动 Seedance 2.0 视频生成演示工作台…\n'

  cd "$PROJECT_DIR"
  nohup npm run dev -- --port "$WORKBENCH_PORT" </dev/null >>"$LOG_FILE" 2>&1 &
  pid=$!
  printf '%s\n' "$pid" >"$PID_FILE"

  for ((i = 0; i < READY_TIMEOUT_SECONDS * 2; i++)); do
    if ! process_alive "$pid"; then
      printf '启动失败：服务进程已退出。最近日志：\n' >&2
      tail -n 20 "$LOG_FILE" >&2 || true
      fail "请检查日志 ${LOG_FILE}。"
    fi
    if port_is_listening "$WORKBENCH_PORT"; then
      break
    fi
    sleep 0.5
  done

  if ! port_is_listening "$WORKBENCH_PORT"; then
    fail "等待 ${READY_TIMEOUT_SECONDS} 秒后端口 ${WORKBENCH_PORT} 仍未就绪，服务可能仍在启动或已卡住。请查看日志 ${LOG_FILE}，必要时运行 ./start_workbench.sh --stop。"
  fi

  printf '\nSeedance 2.0 演示工作台已在后台运行。\n'
  printf '访问地址：http://localhost:%s\n' "$WORKBENCH_PORT"
  printf '进程 PID：%s\n' "$pid"
  printf '日志文件：%s\n' "$LOG_FILE"
  printf '停止服务：./start_workbench.sh --stop\n'
}

stop_workbench() {
  local pid="" pids=() listener listeners i

  pid="$(running_pid || true)"
  if [[ -n "$pid" ]]; then
    pids+=("$pid")
  fi

  if listeners="$(port_listener_pids "$WORKBENCH_PORT")"; then
    while IFS= read -r listener; do
      [[ -n "$listener" ]] || continue
      if [[ -n "$pid" && "$listener" == "$pid" ]]; then
        continue
      fi
      if is_workbench_process "$listener"; then
        pids+=("$listener")
      else
        printf '警告：端口 %s 上的 PID %s 不是工作台进程，已跳过。\n' \
          "$WORKBENCH_PORT" "$listener" >&2
      fi
    done <<<"$listeners"
  fi

  if ((${#pids[@]} == 0)); then
    rm -f "$PID_FILE"
    printf '未发现正在后台运行的工作台服务。\n'
    return 0
  fi

  for pid in "${pids[@]}"; do
    kill_tree "$pid" TERM
  done

  for ((i = 0; i < 20; i++)); do
    if ! port_is_listening "$WORKBENCH_PORT"; then
      break
    fi
    sleep 0.3
  done

  if port_is_listening "$WORKBENCH_PORT"; then
    printf '正常停止超时，改为强制结束（PID %s）。\n' "${pids[*]}"
    for pid in "${pids[@]}"; do
      kill_tree "$pid" KILL
    done
    sleep 0.5
  fi

  rm -f "$PID_FILE"

  if port_is_listening "$WORKBENCH_PORT"; then
    printf '警告：端口 %s 仍被占用，请手动检查。\n' "$WORKBENCH_PORT" >&2
    return 1
  fi

  printf '工作台已停止（端口 %s）。\n' "$WORKBENCH_PORT"
}

case "$ACTION" in
  "" | --stop | --check)
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

if [[ "$ACTION" == "--stop" ]]; then
  stop_workbench
  exit $?
fi

check_command node
check_command npm
check_node_version
check_port
check_dependencies

if [[ "$ACTION" == "--check" ]]; then
  printf '环境检查通过：Node.js %s，端口 %s，项目依赖已就绪。\n' \
    "$(node --version)" "$WORKBENCH_PORT"
  exit 0
fi

start_workbench
