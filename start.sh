#!/usr/bin/env bash
# 启动本地静态服务（ES Module 必须经 HTTP 访问；Three.js 需要 WebGL）
cd "$(dirname "$0")"

PORT="${1:-8090}"
# 若端口被占用，自动向后探测可用端口
while ! python3 -c "import socket; s=socket.socket(); s.bind(('127.0.0.1', $PORT)); s.close()" 2>/dev/null; do
  PORT=$((PORT + 1))
done

echo "→ 浏览器打开 http://localhost:${PORT}/ 查看场景（拖拽旋转，滚轮缩放）"
exec python3 -m http.server "$PORT"
