# 网易云音乐定时推送服务配置

## 环境变量配置

请设置以下环境变量：

```bash
# Webhook地址（必需）
WEBHOOK_URL=https://your-webhook-url.com

# 网易云音乐歌单ID（必需）
PLAYLIST_ID=2829816518

# 推送间隔时间，单位：分钟（可选，默认1分钟）
INTERVAL_MINUTES=1
```

## 如何获取歌单 ID

1. 打开网易云音乐网页版
2. 找到你想要推送的歌单
3. 在浏览器地址栏中，歌单 ID 就是 URL 中的数字部分
   例如：`https://music.163.com/#/playlist?id=2829816518` 中的 `2829816518`

## Webhook 格式

服务会向 webhook 发送以下格式的 JSON 数据：

```json
{
  "text": "🎵 整点音乐推荐：歌曲名 - 歌手名",
  "attachments": [
    {
      "title": "歌曲名",
      "title_link": "https://music.163.com/#/song?id=歌曲ID",
      "text": "歌手：歌手名\n专辑：专辑名\n时长：时长",
      "image_url": "专辑封面URL"
    }
  ]
}
```

## 运行服务

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build
pnpm start:prod
```

## 功能说明

- 服务会按配置的时间间隔自动推送随机歌曲（默认 1 分钟）
- 纯定时推送服务，无需 HTTP 接口
- 支持环境变量配置 webhook 地址、歌单 ID 和推送间隔时间
