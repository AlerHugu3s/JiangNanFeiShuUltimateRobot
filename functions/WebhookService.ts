import axios from 'axios';
import * as fs from 'fs';

export class WebhookService {
    private webhookPlaylistsFile: string;

    constructor(webhookPlaylistsFile = 'config/webhook_playlists.json') {
        this.webhookPlaylistsFile = webhookPlaylistsFile;
    }

    public loadWebhookPlaylists(): Record<string, string[]> {
        if (!fs.existsSync(this.webhookPlaylistsFile)) {
            // 创建示例配置
            const example = {
                "https://open.feishu.cn/open-apis/bot/v2/hook/your-webhook-url": [
                    "123456789",
                    "987654321"
                ]
            };
            fs.writeFileSync(this.webhookPlaylistsFile, JSON.stringify(example, null, 2), 'utf-8');
            const msg = `未检测到 webhook_playlists.json，已自动生成示例配置。\n请在 config/webhook_playlists.json 中填写如下格式：\n\n{
  "https://open.feishu.cn/open-apis/bot/v2/hook/你的webhook": [
    "歌单ID1",
    "歌单ID2"
  ]
}\n每个 webhook 可绑定多个网易云歌单ID（字符串），如需多个群推送可添加多组。`;
            // 日志输出并终止
            const { Logger } = require('./Logger');
            Logger.error(msg);
            throw new Error('请完善 webhook_playlists.json 后重新运行');
        }
        try {
            const data = JSON.parse(fs.readFileSync(this.webhookPlaylistsFile, 'utf-8'));
            return data;
        } catch (e) {
            return {};
        }
    }

    public async sendToWebhook(url: string, payload: any) {
        try {
            const res = await axios.post(url, payload);
            console.log(`[${url}] 状态码: ${res.status}`);
            console.log('响应内容：', res.data);
        } catch (e) {
            console.error(`[${url}] 推送失败：`, e);
        }
    }
} 