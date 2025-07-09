# 网易云音乐飞书定时推送机器人

## 项目简介

本项目是一个基于 TypeScript 的飞书群机器人，支持定时向多个群聊推送网易云音乐歌单中的随机歌曲，并结合天气和祝福语生成美化的卡片消息。支持多 webhook、多歌单、历史去重、天气预报、节假日祝福等功能，适合团队、兴趣群每日音乐推荐。

---

## 依赖与环境要求

- Node.js 16+
- pnpm（推荐）
- 需本地或远程可用的 NeteaseCloudMusicApi 服务
- 可选：WeatherAPI.com 免费 API Key

安装依赖：

```bash
pnpm install
```

---

## 配置说明

### 1. webhook_playlists.json

配置每个 webhook 绑定的歌单 ID 列表（支持多个 webhook、多个歌单）：

```json
{
  "https://open.feishu.cn/open-apis/bot/v2/hook/xxx": [
    "123456789",
    "987654321"
  ],
  "https://open.feishu.cn/open-apis/bot/v2/hook/yyy": [
    "222222222"
  ]
}
```

### 2. greetings/ 目录

存放祝福语文本文件，每种类型一份（每行为一句，随机抽取）：

- morning.txt 早安
- noon.txt 午安
- night.txt 晚安
- holiday.txt 节假日
- 其他如 sunny.txt、rain.txt、snow.txt、cloudy.txt、overcast.txt、wind.txt、fog.txt、haze.txt、thunder.txt、sandstorm.txt、sleet.txt、other.txt

### 3. history.json

自动生成，记录已推送过的歌曲 ID，防止重复推荐。

### 4. weather_cache.json

自动生成，缓存天气数据，减少 API 请求。

### 5. 依赖的环境变量（可选）

- WEATHER_API_KEY：天气 API Key（默认已内置测试 key）
- WEATHER_CITY：天气城市（默认 Shanghai）

---

## 主要功能

- **多 webhook 支持**：每个 webhook 可绑定多个歌单，独立推送。
- **定时推送**：工作日每天三次（10:00、13:00、19:00），自动跳过周末。
- **节假日祝福**：周五晚推送节假日祝福。
- **天气集成**：晚安推送附带明日天气和 emoji。
- **历史去重**：每个 webhook 独立历史，避免重复推荐。
- **美化卡片**：飞书交互式卡片，含歌名、歌手、歌单、天气、祝福语、直达链接。
- **缓存优化**：歌单和天气均有本地缓存，减少 API 压力。
- **命令行灵活调用**：支持多种推送类型和测试命令。

---

## 使用方法

### 1. 命令行用法

```bash
pnpm start morning      # 发送早安推送
pnpm start noon         # 发送午安推送
pnpm start night        # 发送晚安推送（含天气）
pnpm start holiday      # 发送节假日推送（周五晚）
pnpm start test-all     # 测试所有推送类型
pnpm start start        # 启动主循环（定时推送，推荐生产环境用）
```

### 2. 代码调用

```typescript
import { MusicBot } from './functions/MusicBot';

const bot = new MusicBot();
await bot.sendToFeishu('morning');
await bot.sendToFeishu('night', true); // 节假日模式
await bot.testAll();
await bot.startMainLoop(); // 永久定时主循环
```

---

## 主要类与方法说明

### MusicBot

- `constructor(weatherApiKey, weatherCity, greetingDir, historyFile, webhookPlaylistsFile)`
- `sendToFeishu(timeType: string, isFridayNight = false)`  
  推送指定类型（morning/noon/night/holiday）消息到所有 webhook。
- `testAll()`  
  依次推送所有类型，便于测试。
- `startMainLoop()`  
  启动定时主循环，自动在工作日三次推送。
- `getNextRunTime(now, targets)`  
  计算下次推送时间点。

### 其他服务类

- `NeteaseMusicService`：负责歌单拉取、缓存、随机选曲。
- `WeatherService`：负责天气拉取、缓存、emoji 匹配。
- `GreetingService`：负责祝福语文件读取、随机抽取。
- `HistoryService`：负责历史记录的读写。
- `WebhookService`：负责 webhook 配置加载与消息推送。

---

## 进阶说明

- **多 webhook 多歌单**：每个 webhook 可配置多个歌单，推送时随机选取未推送过的歌曲。
- **缓存机制**：歌单缓存每日自动刷新，天气缓存提前 5 分钟预取。
- **异常处理**：如所有歌曲已推送过，会自动清空历史重试。
- **主循环跳过周末**：自动检测周末，跳到下周一早上继续推送。
- **推送内容**：卡片内容包含祝福语、歌曲信息、天气（晚安）、直达网易云链接。

---

## 故障排查

- 推送失败：请检查 webhook 地址、网络连通性、歌单 ID 是否有效。
- 歌单为空：请确保歌单有歌曲且 API 可用。
- 天气获取失败：请检查 WeatherAPI Key 是否有效，或更换城市。
- 祝福语为空：请确保 greetings/ 目录下有对应类型的 txt 文件。

---

## 贡献与定制

- 欢迎自定义推送时间、祝福语、歌单等。
- 支持扩展更多推送类型和消息格式。

---

如需更详细的代码注释和扩展说明，请查阅 `/functions` 目录下各服务实现。 
