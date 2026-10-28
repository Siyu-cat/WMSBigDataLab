#!/usr/bin/env bash
# GitHub Actions 自动部署脚本（由 .ssh/authorized_keys 中的 restrict,command 强制调用）
# 执行身份: ubuntu；无论 SSH 传入什么命令，都只会运行本脚本
set -euo pipefail

ts() { date '+%F %T'; }
REPO_DIR=/opt/wmsbigdatalab

echo "[$(ts)] ▶ 收到部署请求，开始拉取代码"
cd "$REPO_DIR"

# 公开仓库匿名拉取（不依赖任何令牌，撤销令牌不影响自动部署）
git -c credential.helper= pull --ff-only origin main

echo "[$(ts)] ▶ 构建镜像"
cd "$REPO_DIR/deploy"
sudo -n docker compose build

echo "[$(ts)] ▶ 启动/滚动替换容器"
sudo -n docker compose up -d

echo "[$(ts)] ✔ 部署完成，服务状态："
sudo -n docker compose ps --format 'table {{.Name}}\t{{.Status}}'
