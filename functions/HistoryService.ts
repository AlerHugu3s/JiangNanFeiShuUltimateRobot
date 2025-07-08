import * as fs from 'fs';

export class HistoryService {
    private historyFile: string;

    constructor(historyFile: string) {
        this.historyFile = historyFile;
    }

    public loadHistory(): Set<string> {
        if (!fs.existsSync(this.historyFile)) return new Set();
        try {
            const data = JSON.parse(fs.readFileSync(this.historyFile, 'utf-8'));
            return new Set(data.played || []);
        } catch (e) {
            return new Set();
        }
    }

    public saveHistory(playedSet: Set<string>) {
        const data = { played: Array.from(playedSet) };
        fs.writeFileSync(this.historyFile, JSON.stringify(data, null, 2), 'utf-8');
    }
} 