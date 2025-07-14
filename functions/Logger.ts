import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR';

export class Logger {
    private static logDir = path.join(__dirname, '../cache');
    private static logFile = path.join(Logger.logDir, 'logs.log');

    // 静态初始化，确保日志文件存在
    private static _init = (() => {
        if (!fs.existsSync(Logger.logDir)) fs.mkdirSync(Logger.logDir, { recursive: true });
        if (!fs.existsSync(Logger.logFile)) fs.writeFileSync(Logger.logFile, '', 'utf-8');
    })();

    private static format(level: LogLevel, content: string): string {
        const now = new Date();
        // 本地时区时间字符串
        const time = now.toLocaleString('zh-CN', { hour12: false });
        return `[${level}] [${time}] ${content}`;
    }

    public static info(content: string) {
        Logger.appendLog('INFO', content);
    }
    public static warn(content: string) {
        Logger.appendLog('WARNING', content);
    }
    public static error(content: string) {
        Logger.appendLog('ERROR', content);
    }

    private static appendLog(level: LogLevel, content: string) {
        // 这里不再重复创建，只写入
        const msg = Logger.format(level, content);
        fs.appendFileSync(Logger.logFile, msg + '\n', 'utf-8');
        console.log(msg);
    }
} 