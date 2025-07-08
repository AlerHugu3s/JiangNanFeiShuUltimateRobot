#!/bin/bash

echo "🎵 网易云音乐定时推送服务状态检查"
echo "=================================="

# 检查进程状态
if pgrep -f "tsx watch index.ts" > /dev/null; then
    echo "✅ 服务正在运行"
    echo "📊 进程信息："
    ps aux | grep "tsx watch index.ts" | grep -v grep
else
    echo "❌ 服务未运行"
fi

echo ""
echo "📋 配置信息："
echo "- 歌单ID: ${PLAYLIST_ID:-2829816518}"
echo "- 推送间隔: ${INTERVAL_MINUTES:-1}分钟"
echo "- Webhook: ${WEBHOOK_URL:-未设置}"

echo ""
echo "💡 使用 'pnpm dev' 启动服务"
echo "💡 使用 'pkill -f \"tsx watch index.ts\"' 停止服务" 