import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

export class GreetingService {
    private greetingDir: string;
    private greetingHistory: Map<string, string> = new Map();

    constructor(greetingDir: string) {
        this.greetingDir = greetingDir;
    }

    // 使用更高质量的随机数生成器
    private getSecureRandom(max: number): number {
        const bytes = randomBytes(4);
        const value = bytes.readUInt32BE(0);
        return value % max;
    }

    // 改进的随机读取祝福语
    public readRandomLine(fileName: string): string {
        const filePath = path.join(this.greetingDir, fileName);
        if (!fs.existsSync(filePath)) return '';

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (lines.length === 0) return '';

            // 避免连续选择相同的祝福语
            const lastUsed = this.greetingHistory.get(fileName);
            let availableLines = lines;

            if (lastUsed && lines.length > 1) {
                availableLines = lines.filter(line => line !== lastUsed);
            }

            const selectedLine = availableLines[this.getSecureRandom(availableLines.length)];
            this.greetingHistory.set(fileName, selectedLine);

            return selectedLine;
        } catch (e) {
            return '';
        }
    }

    // 带权重的随机选择（根据时间类型调整权重）
    public readWeightedRandomLine(fileName: string, timeType?: string): string {
        const filePath = path.join(this.greetingDir, fileName);
        if (!fs.existsSync(filePath)) return '';

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (lines.length === 0) return '';

            // 根据时间类型调整权重
            const weights = lines.map((line, index) => {
                let weight = 1.0;

                // 根据时间类型调整权重
                if (timeType === 'morning') {
                    // 早安祝福语中，包含"阳光"、"活力"等词汇的权重更高
                    if (line.includes('阳光') || line.includes('活力') || line.includes('新的一天')) {
                        weight = 1.5;
                    }
                } else if (timeType === 'night') {
                    // 晚安祝福语中，包含"好梦"、"放松"等词汇的权重更高
                    if (line.includes('好梦') || line.includes('放松') || line.includes('晚安')) {
                        weight = 1.5;
                    }
                }

                return { line, weight };
            });

            // 计算总权重
            const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);

            // 使用权重随机选择
            let randomValue = this.getSecureRandom(Math.floor(totalWeight * 1000)) / 1000;

            for (const item of weights) {
                randomValue -= item.weight;
                if (randomValue <= 0) {
                    this.greetingHistory.set(fileName, item.line);
                    return item.line;
                }
            }

            // 如果权重算法失败，回退到简单随机
            const fallbackLine = lines[this.getSecureRandom(lines.length)];
            this.greetingHistory.set(fileName, fallbackLine);
            return fallbackLine;

        } catch (e) {
            return '';
        }
    }

    // 清除祝福语历史记录
    public clearHistory(): void {
        this.greetingHistory.clear();
    }
} 