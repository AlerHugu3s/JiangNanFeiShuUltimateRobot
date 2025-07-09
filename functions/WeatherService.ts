import axios from 'axios';
import * as fs from 'fs';

export interface WeatherInfo {
    message: string;
    type: string;
    emoji: string;
    timestamp: number; // 缓存时间戳
}

export class WeatherService {
    private cacheFile = 'cache/weather_cache.json';
    private apiKey: string;
    private city: string;
    private conditionMap = [
        { keyword: '晴', type: 'sunny', emoji: '🌞' },
        { keyword: '多云', type: 'cloudy', emoji: '⛅' },
        { keyword: '阴', type: 'overcast', emoji: '🌥️' },
        { keyword: '雨', type: 'rain', emoji: '🌧️' },
        { keyword: '雪', type: 'snow', emoji: '🌨️' },
        { keyword: '雾', type: 'fog', emoji: '🌫️' },
        { keyword: '霾', type: 'haze', emoji: '🌫️' },
        { keyword: '雷', type: 'thunder', emoji: '⛈️' },
        { keyword: '沙尘', type: 'sandstorm', emoji: '🌪️' },
        { keyword: '雨夹雪', type: 'sleet', emoji: '🌨️' },
        { keyword: '风', type: 'wind', emoji: '💨' },
    ];

    constructor(apiKey: string, city: string) {
        this.apiKey = apiKey;
        this.city = city;
    }

    // 预取天气，失败重试3次
    public async preloadWeather(): Promise<WeatherInfo | null> {
        let lastError: any = null;
        for (let i = 0; i < 3; i++) {
            try {
                const info = await this.fetchWeather();
                this.saveCache(info);
                return info;
            } catch (err) {
                lastError = err;
                await this.sleep(1000);
            }
        }
        console.error('天气获取失败，已重试3次:', lastError);
        return null;
    }

    // 读取缓存
    public getCachedWeather(): WeatherInfo | null {
        if (!fs.existsSync(this.cacheFile)) return null;
        try {
            const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf-8'));
            return data;
        } catch (e) {
            return null;
        }
    }

    // 实际请求天气API
    private async fetchWeather(): Promise<WeatherInfo> {
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${this.apiKey}&q=${this.city}&days=2&lang=zh`;
        const res = await axios.get(url, { timeout: 5000 });
        const data = res.data;
        const tomorrow = data.forecast.forecastday[1].day;
        const maxTemp = tomorrow.maxtemp_c;
        const minTemp = tomorrow.mintemp_c;
        const condition = tomorrow.condition.text;
        let weatherType = 'other';
        let emoji = '🌈';
        for (const { keyword, type, emoji: emo } of this.conditionMap) {
            if (condition.includes(keyword)) {
                weatherType = type;
                emoji = emo;
                break;
            }
        }
        const message = `明日天气：${condition}，气温 ${minTemp.toFixed(0)}-${maxTemp.toFixed(0)}°C`;
        return { message, type: weatherType, emoji, timestamp: Date.now() };
    }

    // 保存缓存
    private saveCache(info: WeatherInfo) {
        fs.writeFileSync(this.cacheFile, JSON.stringify(info, null, 2), 'utf-8');
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
} 