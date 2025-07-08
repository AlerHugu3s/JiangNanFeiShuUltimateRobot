# MusicBot TypeScript 版本

这是从 Python 版本迁移过来的飞书音乐祝福定时机器人，使用 TypeScript 重新实现。

## 功能特性

- ✅ **定时推送**：周一到周五每天三次（10:00, 13:00, 19:00）
- ✅ **音乐推荐**：从网易云音乐歌单随机选择歌曲
- ✅ **天气信息**：获取明日天气并匹配祝福语
- ✅ **飞书机器人**：发送交互式卡片消息到多个群聊
- ✅ **播放历史**：避免重复推荐同一首歌
- ✅ **祝福语系统**：根据时间、天气等条件选择不同祝福语
- ✅ **命令行测试**：支持各种测试命令

## 安装依赖

```bash
pnpm install
```

## 配置文件

### 1. webhook_urls.txt
飞书机器人的 Webhook 地址，每行一个：
```
https://open.feishu.cn/open-apis/bot/v2/hook/your-webhook-url-1
https://open.feishu.cn/open-apis/bot/v2/hook/your-webhook-url-2
```

### 2. playlist_ids.txt
网易云音乐歌单 ID，每行一个：
```
546475729
13049625829
49397202
13939900595
```

### 3. greetings/ 目录
包含各种祝福语文件：
- `morning.txt` - 早安祝福
- `noon.txt` - 午安祝福  
- `night.txt` - 晚安祝福
- `holiday.txt` - 节假日祝福
- `sunny.txt` - 晴天祝福
- `cloudy.txt` - 多云祝福
- `rain.txt` - 雨天祝福
- `snow.txt` - 雪天祝福
- `fog.txt` - 雾天祝福
- `haze.txt` - 霾天祝福
- `thunder.txt` - 雷雨祝福
- `sandstorm.txt` - 沙尘暴祝福
- `sleet.txt` - 雨夹雪祝福
- `wind.txt` - 大风祝福
- `other.txt` - 其他天气祝福

## 使用方法

### 1. 基本使用

```typescript
import { MusicBot } from './functions/MusicBot';

const musicBot = new MusicBot();

// 发送早安推送
await musicBot.sendToFeishu('morning');

// 发送午安推送
await musicBot.sendToFeishu('noon');

// 发送晚安推送
await musicBot.sendToFeishu('night');

// 发送周五晚上推送（节假日模式）
await musicBot.sendToFeishu('night', true);

// 测试所有推送类型
await musicBot.testAll();

// 启动主循环（定时推送）
await musicBot.startMainLoop();
```

### 2. 命令行使用

```bash
# 运行所有测试
tsx functions/musicBotExample.ts

# 发送早安推送
tsx functions/musicBotExample.ts morning

# 发送午安推送
tsx functions/musicBotExample.ts noon

# 发送晚安推送
tsx functions/musicBotExample.ts night

# 发送节假日推送
tsx functions/musicBotExample.ts holiday

# 测试所有推送类型
tsx functions/musicBotExample.ts test-all

# 启动主循环
tsx functions/musicBotExample.ts start
```

## 环境要求

1. **NeteaseCloudMusicApi**：需要本地运行网易云音乐 API 服务
   - 默认地址：`http://localhost:3000`
   - 可在 `MusicBot.ts` 中修改 `neteaseApiBase` 属性

2. **天气 API**：使用 WeatherAPI.com
   - API Key：`dedf75857d4f47f4a2973415250307`
   - 城市：上海（可在 `MusicBot.ts` 中修改 `weatherCity` 属性）

## 类结构

### MusicBot 类

#### 主要方法：
- `sendToFeishu(timeType: string, isFridayNight?: boolean)` - 发送飞书消息
- `startMainLoop()` - 启动主循环（定时推送）
- `testAll()` - 测试所有推送类型

#### 私有方法：
- `loadWebhookUrls()` - 加载 webhook URLs
- `loadPlaylistIds()` - 加载歌单 ID 列表
- `fetchPlaylist(playlistId: string)` - 获取歌单信息
- `loadHistory()` - 加载播放历史
- `saveHistory(playedSet: Set<string>)` - 保存播放历史
- `readRandomLine(filePath: string)` - 随机读取祝福语
- `getTomorrowWeather()` - 获取明日天气
- `sendToAllWebhooks(payload: any)` - 发送到所有 webhook

## 与原 Python 版本的差异

1. **类型安全**：使用 TypeScript 提供完整的类型检查
2. **异步处理**：使用 async/await 替代回调
3. **模块化**：所有功能封装在一个类中
4. **错误处理**：更完善的错误处理机制
5. **配置管理**：更灵活的配置管理方式

## 注意事项

1. 确保 `greetings/` 目录下的所有祝福语文件存在
2. 确保 `webhook_urls.txt` 和 `playlist_ids.txt` 文件存在且格式正确
3. 需要运行 NeteaseCloudMusicApi 服务
4. 天气 API 有调用限制，请合理使用

## 故障排除

1. **找不到配置文件**：检查文件路径和格式
2. **API 调用失败**：检查网络连接和 API 服务状态
3. **推送失败**：检查 webhook URL 是否正确
4. **歌单获取失败**：检查 NeteaseCloudMusicApi 服务是否运行 