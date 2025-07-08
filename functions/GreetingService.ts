import * as fs from 'fs';
import * as path from 'path';

export class GreetingService {
    private greetingDir: string;

    constructor(greetingDir: string) {
        this.greetingDir = greetingDir;
    }

    // 随机读取祝福语文件的一行
    public readRandomLine(fileName: string): string {
        const filePath = path.join(this.greetingDir, fileName);
        if (!fs.existsSync(filePath)) return '';
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (lines.length === 0) return '';
            return lines[Math.floor(Math.random() * lines.length)];
        } catch (e) {
            return '';
        }
    }
} 