import * as NeteaseCloudMusicApi from 'NeteaseCloudMusicApi';
import * as fs from 'fs';

export interface Song {
    name: string;
    artist: string;
    id: string;
    playlistId: string;
    playlistName: string;
}

export class NeteaseMusicService {
    constructor() { }

    // 刷新指定歌单缓存，缓存文件名自定义
    public async refreshPlaylistsCache(playlistIds: string[], cacheFile: string): Promise<Song[]> {
        const allSongs: Song[] = [];
        for (const pid of playlistIds) {
            try {
                // 获取歌单基本信息
                const detailRes = await NeteaseCloudMusicApi.playlist_detail({ id: pid });
                const playlist = detailRes.body && detailRes.body.playlist ? detailRes.body.playlist as any : {};
                let playlistName = '';
                if (playlist && typeof playlist.name === 'string') {
                    playlistName = playlist.name;
                }
                // 获取所有歌曲
                let offset = 0;
                const limit = 1000;
                while (true) {
                    const tracksRes = await NeteaseCloudMusicApi.playlist_track_all({ id: pid, limit, offset });
                    const songs = (tracksRes.body && Array.isArray(tracksRes.body.songs)) ? tracksRes.body.songs : [];
                    allSongs.push(...songs.map((song: any) => ({
                        name: song.name,
                        artist: song.ar?.[0]?.name || '未知',
                        id: song.id.toString(),
                        playlistId: pid,
                        playlistName
                    })));
                    if (songs.length < limit) break;
                    offset += limit;
                }
            } catch (e) {
                console.error(`歌单 ${pid} 获取失败:`, e);
            }
        }
        this.saveCache(allSongs, cacheFile);
        return allSongs;
    }

    // 读取缓存
    public getCachedSongs(cacheFile: string): Song[] {
        if (!fs.existsSync(cacheFile)) return [];
        try {
            const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
            return data;
        } catch (e) {
            return [];
        }
    }

    // 随机选歌（只从缓存中选）
    public getRandomSong(historySet: Set<string>, cacheFile: string): Song | null {
        const songs = this.getCachedSongs(cacheFile).filter(song => !historySet.has(song.id));
        if (songs.length === 0) return null;
        return songs[Math.floor(Math.random() * songs.length)];
    }

    // 保存缓存
    private saveCache(songs: Song[], cacheFile: string) {
        fs.writeFileSync(cacheFile, JSON.stringify(songs, null, 2), 'utf-8');
    }
} 