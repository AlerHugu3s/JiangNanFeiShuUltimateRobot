import { WeatherService, WeatherInfo } from './WeatherService';
import { NeteaseMusicService, Song } from './NeteaseMusicService';
import { GreetingService } from './GreetingService';
import { HistoryService } from './HistoryService';
import { WebhookService } from './WebhookService';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './Logger';

export class MusicBot {
    private weatherService: WeatherService;
    private musicService: NeteaseMusicService;
    private greetingService: GreetingService;
    private historyService: HistoryService;
    private webhookService: WebhookService;

    private weatherPreloadMinutes = 5;
    private lastPlaylistCacheDate: string = '';

    constructor(
        weatherApiKey = 'dedf75857d4f47f4a2973415250307',
        weatherCity = 'Shanghai',
        greetingDir = 'config/greetings',
        historyFile = 'cache/history.json',
        webhookPlaylistsFile = 'config/webhook_playlists.json'
    ) {
        this.weatherService = new WeatherService(weatherApiKey, weatherCity);
        this.musicService = new NeteaseMusicService();
        this.greetingService = new GreetingService(greetingDir);
        this.historyService = new HistoryService(historyFile);
        this.webhookService = new WebhookService(webhookPlaylistsFile);
    }

    // 每天0点或首次运行时刷新所有 webhook 的歌单缓存
    private async ensureAllPlaylistsCache() {
        const today = new Date().toISOString().slice(0, 10);
        if (this.lastPlaylistCacheDate !== today) {
            const webhookPlaylists = this.webhookService.loadWebhookPlaylists();
            for (const [webhook, playlistIds] of Object.entries(webhookPlaylists)) {
                const cacheFile = this.getPlaylistCacheFile(webhook);
                await this.musicService.refreshPlaylistsCache(playlistIds, cacheFile);
            }
            this.lastPlaylistCacheDate = today;
        }
    }

    // 推送前5分钟预取天气
    private async ensureWeatherCache() {
        await this.weatherService.preloadWeather();
    }

    // 获取 webhook 对应的歌单缓存文件名
    private getPlaylistCacheFile(webhook: string): string {
        // 以 webhook 的 hash 作为文件名，防止特殊字符
        const hash = Buffer.from(webhook).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
        return `cache/playlists_cache_${hash}.json`;
    }

    // 主推送方法：每个 webhook 独立推送
    public async sendToFeishu(timeType: string, isFridayNight = false): Promise<void> {
        const now = new Date(); // 保留now声明，供后续逻辑使用
        const stack = new Error().stack;
        const logMsg = `[日志追踪] sendToFeishu 被调用，类型: ${timeType}，isFridayNight: ${isFridayNight}`;
        Logger.info(logMsg);
        if (stack) {
            const stackLines = stack.split('\n').slice(1, 4).map(l => l.trim()).join(' | ');
            const stackMsg = `[日志追踪] 调用堆栈: ${stackLines}`;
            Logger.info(stackMsg);
        }
        await this.ensureAllPlaylistsCache();
        await this.ensureWeatherCache();

        const webhookPlaylists = this.webhookService.loadWebhookPlaylists();
        for (const [webhook, playlistIds] of Object.entries(webhookPlaylists)) {
            const cacheFile = this.getPlaylistCacheFile(webhook);
            // 读取历史
            const history = this.historyService.loadHistory();
            // 随机选歌
            const song = this.musicService.getRandomSong(history, cacheFile);
            if (!song) {
                Logger.info(`[${webhook}] 所有歌单歌曲已全部推荐过，清空历史后重试。`);
                this.historyService.saveHistory(new Set());
                continue;
            }
            // 更新历史
            history.add(song.id);
            this.historyService.saveHistory(history);

            // 祝福语
            let greeting = '';
            if (isFridayNight) {
                greeting = this.greetingService.readRandomLine('holiday.txt');
            } else {
                greeting = this.greetingService.readRandomLine(`${timeType}.txt`);
            }

            // 组装 JSON 对象
            const jsonMsg: any = {
                greeting,
                song: song.name,
                artist: song.artist,
                playlist: song.playlistName,
                link: `https://music.163.com/#/song?id=${song.id}`,
                timeType
            };
            if (timeType === 'night') {
                // 读取天气缓存
                const weather: WeatherInfo | null = this.weatherService.getCachedWeather();
                if (weather) {
                    jsonMsg.weather = {
                        message: weather.message,
                        type: weather.type,
                        emoji: weather.emoji
                    };
                }
            }

            // 组装美化后的飞书卡片消息体
            const elements: any[] = [
                {
                    tag: "div",
                    text: {
                        tag: "lark_md",
                        content: `**为你推荐一首来自 _${song.playlistName}_ 的歌曲**`
                    }
                },
                {
                    tag: "div",
                    text: {
                        tag: "lark_md",
                        content: `> 由 **${song.artist}** 创作的《${song.name}》送给各位！`
                    }
                }
            ];
            if (jsonMsg.weather && (jsonMsg.weather.emoji || jsonMsg.weather.message)) {
                elements.push({
                    tag: "div",
                    text: {
                        tag: "lark_md",
                        content: `${jsonMsg.weather.emoji || ''} ${jsonMsg.weather.message || ''}`
                    }
                });
                elements.push({ tag: "hr" });
            }
            // 构建按钮数组
            const actions: any[] = [
                {
                    tag: "button",
                    text: {
                        tag: "plain_text",
                        content: `🎧 ${song.name}`
                    },
                    url: `https://music.163.com/#/song?id=${song.id}`,
                    type: "primary"
                }
            ];

            // 为晚安推送和节假日推送添加打卡按钮
            Logger.info(`[调试] timeType: ${timeType}, isFridayNight: ${isFridayNight}`);
            if (timeType === 'night' || isFridayNight) {
                Logger.info(`[调试] 添加打卡按钮`);
                actions.push({
                    tag: "button",
                    text: {
                        tag: "lark_md",
                        content: "🕙 打卡"
                    },
                    url: "https://applink.feishu.cn/T8KT9eIznl76",
                    type: "primary"
                });
            } else {
                Logger.info(`[调试] 不添加打卡按钮`);
            }

            elements.push({
                tag: "action",
                actions: actions
            } as any);
            const card = {
                config: {
                    wide_screen_mode: true
                },
                header: {
                    title: {
                        tag: "plain_text",
                        content: greeting // 你可以在 greeting 里加 emoji
                    },
                    template: "blue"
                },
                elements: elements
            };
            const payload = {
                msg_type: "interactive",
                card
            };
            // 控制台输出标准 JSON 便于调试
            Logger.info(JSON.stringify(jsonMsg, null, 2));
            // webhook 推送卡片
            await this.webhookService.sendToWebhook(webhook, payload);
        }
    }

    public async testAll(): Promise<void> {
        const logMsg = `[日志追踪] testAll 被调用`;
        Logger.info(logMsg);
        await this.ensureAllPlaylistsCache();
        await this.ensureWeatherCache();
        Logger.info('开始测试所有推送类型...');
        await this.sendToFeishu('morning');
        await this.sleep(2000);
        await this.sendToFeishu('noon');
        await this.sleep(2000);
        await this.sendToFeishu('night');
        await this.sleep(2000);
        await this.sendToFeishu('night', true);
        Logger.info('测试完成！');
    }

    public async startMainLoop(): Promise<void> {
        const logMsg = `[日志追踪] startMainLoop 启动`;
        Logger.info(logMsg);
        const runTimes: Array<[number, number, string]> = [
            [10, 0, 'morning'],
            [13, 0, 'noon'],
            [19, 0, 'night']
        ];
        while (true) {
            const now = new Date(); // 保留now声明，供后续逻辑使用
            const tickMsg = `[日志追踪] 主循环 tick`;
            Logger.info(tickMsg);
            // 周末跳过
            if (now.getDay() >= 6) {
                const daysToMonday = 8 - now.getDay();
                const nextMonday = new Date(now.getTime() + daysToMonday * 24 * 60 * 60 * 1000);
                nextMonday.setHours(10, 0, 0, 0);
                const sleepMs = nextMonday.getTime() - now.getTime();
                Logger.info(`本周已结束，${Math.floor(sleepMs / (1000 * 60 * 60))}小时后下次推送。`);
                await this.sleep(sleepMs);
                continue;
            }
            // 计算下次推送时间
            const [nextRun, timeType] = this.getNextRunTime(now, runTimes);
            // 提前5分钟预取天气
            const preloadTime = new Date(nextRun.getTime() - this.weatherPreloadMinutes * 60 * 1000);
            const msToPreload = preloadTime.getTime() - now.getTime();
            if (msToPreload > 0) {
                await this.sleep(msToPreload);
                await this.ensureWeatherCache();
                const msToPush = nextRun.getTime() - new Date().getTime();
                if (msToPush > 0) await this.sleep(msToPush);
            } else {
                // 已过预取时间，直接推送
                await this.ensureWeatherCache();
            }
            const isFridayNight = timeType === 'night' && nextRun.getDay() === 5;
            await this.sendToFeishu(timeType, isFridayNight);
        }
    }

    public async clearCache(): Promise<void> {
        // 清除天气缓存
        const fs = require('fs');
        if (fs.existsSync('cache/weather_cache.json')) fs.unlinkSync('cache/weather_cache.json');
        // 清除历史缓存
        if (fs.existsSync('cache/history.json')) fs.unlinkSync('cache/history.json');
        // 清除歌单缓存
        const cacheFiles = fs.readdirSync('cache').filter((f: string) => f.startsWith('playlists_cache_') && f.endsWith('.json'));
        for (const file of cacheFiles) {
            fs.unlinkSync(`cache/${file}`);
        }
        Logger.info('所有缓存已清除。');
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getNextRunTime(now: Date, targets: Array<[number, number, string]>): [Date, string] {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const nextTimes: Array<[Date, string]> = [];
        for (const [hour, minute, label] of targets) {
            const runTime = new Date(today.getTime() + hour * 60 * 60 * 1000 + minute * 60 * 1000);
            if (runTime > now) {
                nextTimes.push([runTime, label]);
            }
        }
        if (nextTimes.length === 0) {
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            for (const [hour, minute, label] of targets) {
                const runTime = new Date(tomorrow.getTime() + hour * 60 * 60 * 1000 + minute * 60 * 1000);
                nextTimes.push([runTime, label]);
            }
        }
        return nextTimes.reduce((earliest, current) => current[0] < earliest[0] ? current : earliest);
    }
}