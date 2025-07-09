@echo off
chcp 65001 >nul
echo 🎵 网易云音乐定时推送服务状态检查
echo ==================================

REM 检查进程状态
cd ..
tasklist | findstr /I "tsx.exe" | findstr /I "watch index.ts" >nul
if %errorlevel%==0 (
    echo ✅ 服务正在运行
    echo 📊 进程信息：
    tasklist | findstr /I "tsx.exe"
) else (
    echo ❌ 服务未运行
)

echo.
echo 📋 配置信息：
echo - 歌单ID: %PLAYLIST_ID%
echo - 推送间隔: %INTERVAL_MINUTES%分钟
echo - Webhook: %WEBHOOK_URL%

echo.
echo 💡 使用 'pnpm dev' 启动服务
echo 💡 使用 'taskkill /F /IM tsx.exe' 停止服务 

pause 