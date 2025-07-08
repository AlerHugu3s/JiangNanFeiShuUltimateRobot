const NeteaseCloudMusicApi = require("NeteaseCloudMusicApi");
import * as https from "https";
import * as http from "http";
import * as url from "url";

// 配置
const CONFIG = {
  WEBHOOK_URL:
    process.env.WEBHOOK_URL ||
    "https://www.feishu.cn/flow/api/trigger-webhook/5a9c63456fa6f7fd2d60e03d3fb5cf7b", // 请替换为你的webhook地址
  PLAYLIST_ID: process.env.PLAYLIST_ID || "164657973", // 默认歌单ID，请替换为你的歌单ID
  TIMEZONE_OFFSET: 8, // 北京时间 UTC+8
  INTERVAL_MINUTES: parseInt(process.env.INTERVAL_MINUTES || "60"), // 推送间隔（分钟），默认1分钟
};

// 获取随机歌曲的函数
async function getRandomSong(playlistId: string) {
  try {
    // 获取歌单的所有歌曲
    const tracksRes = await NeteaseCloudMusicApi.playlist_track_all({
      id: playlistId,
    });

    if (
      !tracksRes ||
      !tracksRes.body ||
      !tracksRes.body.songs ||
      tracksRes.body.songs.length === 0
    ) {
      throw new Error("歌单不存在或没有歌曲");
    }

    // 随机选择一首歌曲
    const songs = tracksRes.body.songs;
    // 使用时间戳和随机数增加随机性
    const timestamp = Date.now();
    const randomSeed = Math.random() * timestamp;
    const randomIndex = Math.floor(randomSeed % songs.length);
    const randomSong = songs[randomIndex];

    // 格式化歌曲信息
    return {
      name: randomSong.name,
      artists:
        randomSong.ar?.map((artist: any) => artist.name).join(", ") ||
        "未知歌手",
      album: randomSong.al?.name || "未知专辑",
      duration: (() => {
        const totalSeconds = Math.floor(randomSong.dt / 1000); // 转换为秒
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
      })(),
      id: randomSong.id,
      picUrl: randomSong.al?.picUrl || "",
      url: `https://music.163.com/#/song?id=${randomSong.id}`,
    };
  } catch (error) {
    console.error("获取随机歌曲失败:", error);
    throw error;
  }
}

// 发送webhook的函数
async function sendWebhook(songInfo: any) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text: `🎵 音乐推荐：${songInfo.name} - ${songInfo.artists}`,
      attachments: [
        {
          title: songInfo.name,
          title_link: songInfo.url,
          text: `歌手：${songInfo.artists}\n专辑：${songInfo.album}\n时长：${songInfo.duration}`,
          image_url: songInfo.picUrl,
        },
      ],
    });

    const urlObj = new URL(CONFIG.WEBHOOK_URL);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log(
          `✅ Webhook发送成功: ${songInfo.name} - ${songInfo.artists}`
        );
        resolve(data);
      });
    });

    req.on("error", (error) => {
      console.error("❌ Webhook发送失败:", error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 定时任务函数
async function scheduledTask() {
  try {
    console.log(
      `⏰ 执行定时任务 - ${new Date().toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
      })}`
    );

    const songInfo = await getRandomSong(CONFIG.PLAYLIST_ID);
    await sendWebhook(songInfo);
  } catch (error) {
    console.error("❌ 定时任务执行失败:", error);
  }
}

// 设置定时器，使用可配置的间隔时间
function setupScheduler() {
  const intervalMs = CONFIG.INTERVAL_MINUTES * 60 * 1000;
  console.log(
    `⏰ 定时器已设置，每${CONFIG.INTERVAL_MINUTES}分钟推送一次随机歌曲`
  );

  // 立即执行一次
  scheduledTask();

  // 之后按配置的间隔时间执行
  setInterval(scheduledTask, intervalMs);
}

// 创建HTTP服务器用于手动测试
const server = http.createServer(async (req, res) => {
  // 设置CORS头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  // 处理OPTIONS请求
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url || "", true);
  const path = parsedUrl.pathname;

  try {
    if (req.method === "GET" && path === "/test") {
      // 手动测试接口
      console.log("🧪 手动触发测试推送...");
      try {
        const songInfo = await getRandomSong(CONFIG.PLAYLIST_ID);
        await sendWebhook(songInfo);
        res.writeHead(200);
        res.end(
          JSON.stringify({
            success: true,
            message: "测试推送成功",
            data: songInfo,
          })
        );
      } catch (error) {
        console.error("❌ 测试推送失败:", error);
        res.writeHead(500);
        res.end(
          JSON.stringify({
            success: false,
            message: "测试推送失败",
            error: error instanceof Error ? error.message : String(error),
          })
        );
      }
    } else if (req.method === "GET" && path === "/health") {
      // 健康检查接口
      res.writeHead(200);
      res.end(
        JSON.stringify({
          status: "ok",
          message: "服务运行正常",
          timestamp: new Date().toISOString(),
        })
      );
    } else if (req.method === "GET" && path === "/config") {
      // 配置查看接口
      res.writeHead(200);
      res.end(
        JSON.stringify({
          success: true,
          data: {
            playlistId: CONFIG.PLAYLIST_ID,
            intervalMinutes: CONFIG.INTERVAL_MINUTES,
            webhookUrl: CONFIG.WEBHOOK_URL.replace(/\/[^\/]+$/, "/***"),
            timezone: "Asia/Shanghai (UTC+8)",
          },
          message: "当前配置信息",
        })
      );
    } else {
      // 404 处理
      res.writeHead(404);
      res.end(
        JSON.stringify({
          success: false,
          message: "接口不存在",
          available: ["/test", "/health", "/config"],
        })
      );
    }
  } catch (error) {
    console.error("服务器错误:", error);
    res.writeHead(500);
    res.end(
      JSON.stringify({
        success: false,
        message: "服务器内部错误",
      })
    );
  }
});

// 启动服务器和定时推送服务
const PORT = 3045;
server.listen(PORT, () => {
  console.log(`🚀 定时推送服务启动成功`);
  console.log(`🎵 歌单ID: ${CONFIG.PLAYLIST_ID}`);
  console.log(`⏰ 推送间隔: ${CONFIG.INTERVAL_MINUTES}分钟`);
  console.log(`🔗 Webhook地址: ${CONFIG.WEBHOOK_URL}`);
  console.log(`🧪 手动测试: http://localhost:${PORT}/test`);
  console.log(`📡 健康检查: http://localhost:${PORT}/health`);
  console.log(`⚙️  配置查看: http://localhost:${PORT}/config`);

  // 启动定时器
  setupScheduler();
});
