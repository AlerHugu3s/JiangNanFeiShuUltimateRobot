import axios from 'axios';
import * as fs from 'fs';

export class WebhookService {
    private webhookPlaylistsFile: string;

    constructor(webhookPlaylistsFile = 'config/webhook_playlists.json') {
        this.webhookPlaylistsFile = webhookPlaylistsFile;
    }

    public loadWebhookPlaylists(): Record<string, string[]> {
        if (!fs.existsSync(this.webhookPlaylistsFile)) return {};
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