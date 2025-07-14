import * as NeteaseCloudMusicApi from 'NeteaseCloudMusicApi';
import * as fs from 'fs';
import { randomBytes } from 'crypto';

export interface Song {
    name: string;
    artist: string;
    id: string;
    playlistId: string;
    playlistName: string;
}

export class NeteaseMusicService {
    constructor() { }

    // 使用更高质量的随机数生成器
    private getSecureRandom(max: number): number {
        const bytes = randomBytes(4);
        const value = bytes.readUInt32BE(0);
        return value % max;
    }

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

    // 改进的随机选歌算法
    public getRandomSong(historySet: Set<string>, cacheFile: string): Song | null {
        const allSongs = this.getCachedSongs(cacheFile);
        const availableSongs = allSongs.filter(song => !historySet.has(song.id));

        if (availableSongs.length === 0) return null;

        // 如果可用歌曲数量很少，考虑重置历史记录
        if (availableSongs.length < allSongs.length * 0.1) {
            console.log(`可用歌曲数量较少(${availableSongs.length}/${allSongs.length})，建议清空历史记录`);
        }

        // 使用更高质量的随机数生成器
        const randomIndex = this.getSecureRandom(availableSongs.length);
        return availableSongs[randomIndex];
    }

    // 带权重的随机选歌算法（避免某些歌曲被过度推荐）
    public getWeightedRandomSong(historySet: Set<string>, cacheFile: string): Song | null {
        const allSongs = this.getCachedSongs(cacheFile);
        const availableSongs = allSongs.filter(song => !historySet.has(song.id));

        if (availableSongs.length === 0) return null;

        // 计算每个歌单的权重
        const playlistWeights = new Map<string, number>();
        const totalSongs = allSongs.length;

        for (const song of allSongs) {
            const currentWeight = playlistWeights.get(song.playlistId) || 0;
            playlistWeights.set(song.playlistId, currentWeight + 1);
        }

        // 为每个可用歌曲计算权重（未被推荐的歌曲权重更高）
        const weightedSongs = availableSongs.map(song => {
            const baseWeight = playlistWeights.get(song.playlistId) || 1;
            const historyWeight = historySet.has(song.id) ? 0.1 : 1.0; // 历史中存在的歌曲权重降低
            return {
                song,
                weight: baseWeight * historyWeight
            };
        });

        // 计算总权重
        const totalWeight = weightedSongs.reduce((sum, item) => sum + item.weight, 0);

        // 使用权重随机选择
        let randomValue = this.getSecureRandom(Math.floor(totalWeight * 1000)) / 1000;

        for (const item of weightedSongs) {
            randomValue -= item.weight;
            if (randomValue <= 0) {
                return item.song;
            }
        }

        // 如果权重算法失败，回退到简单随机
        return availableSongs[this.getSecureRandom(availableSongs.length)];
    }

    // 公平随机选歌算法：每个歌单被选中的概率一致
    public getFairRandomSong(historySet: Set<string>, cacheFile: string): Song | null {
        const allSongs = this.getCachedSongs(cacheFile);
        if (allSongs.length === 0) return null;

        // 1. 按歌单分组，过滤掉已推荐完的歌单
        const playlistMap = new Map<string, Song[]>();
        for (const song of allSongs) {
            if (historySet.has(song.id)) continue;
            if (!playlistMap.has(song.playlistId)) {
                playlistMap.set(song.playlistId, []);
            }
            playlistMap.get(song.playlistId)!.push(song);
        }
        const availablePlaylists = Array.from(playlistMap.keys());
        if (availablePlaylists.length === 0) return null;

        // 2. 等概率随机选一个歌单
        const randomPlaylistIdx = this.getSecureRandom(availablePlaylists.length);
        const chosenPlaylistId = availablePlaylists[randomPlaylistIdx];
        const songsInPlaylist = playlistMap.get(chosenPlaylistId)!;

        // 3. 从该歌单中随机选一首
        const randomSongIdx = this.getSecureRandom(songsInPlaylist.length);
        return songsInPlaylist[randomSongIdx];
    }

    // 保存缓存
    private saveCache(songs: Song[], cacheFile: string) {
        fs.writeFileSync(cacheFile, JSON.stringify(songs, null, 2), 'utf-8');
    }
} 