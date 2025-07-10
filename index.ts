import { MusicBot } from './functions/MusicBot';
import { Logger } from './functions/Logger';

async function main() {
  const musicBot = new MusicBot();
  // 启动时先检查webhook配置文件是否存在且有效
  musicBot['webhookService'].loadWebhookPlaylists();

  // 启动时自动运行 test-all
  // try {
  //   console.log('自动测试所有推送类型...');
  //   await musicBot.testAll();
  //   console.log('自动测试完成。');
  // } catch (e) {
  //   console.error('自动测试过程中发生错误：', e);
  //   console.error('请检查 webhook 配置、网络连接、歌单内容等。已知问题如历史已满会自动清空重试。');
  // }

  const args = process.argv.slice(2);

  if (args.length === 0) {
    Logger.info('用法:');
    Logger.info('  pnpm start morning      # 发送早安推送');
    Logger.info('  pnpm start noon         # 发送午安推送');
    Logger.info('  pnpm start night        # 发送晚安推送');
    Logger.info('  pnpm start holiday      # 发送节假日推送');
    Logger.info('  pnpm start test-all     # 测试所有推送类型');
    Logger.info('  pnpm start start        # 启动主循环（定时推送）');
    Logger.info('  pnpm start clear-cache  # 清除所有缓存');
    return;
  }

  const command = args[0].toLowerCase();
  switch (command) {
    case 'morning':
      await musicBot.sendToFeishu('morning');
      break;
    case 'noon':
      await musicBot.sendToFeishu('noon');
      break;
    case 'night':
      await musicBot.sendToFeishu('night');
      break;
    case 'holiday':
      await musicBot.sendToFeishu('night', true);
      break;
    case 'test-all':
      await musicBot.testAll();
      break;
    case 'start':
      Logger.info('启动主循环，按 Ctrl+C 停止...');
      // 新增定时日志功能
      const logIntervalMinutes = 5;
      let lastLogTime = 0;
      // 包装原有 startMainLoop
      const runTimes = [
        [10, 0, 'morning'],
        [13, 0, 'noon'],
        [19, 0, 'night']
      ];
      async function logLoop() {
        while (true) {
          const now = new Date();
          // 计算下次推送时间
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          let nextRun = null;
          for (const t of runTimes) {
            const hour = Number(t[0]);
            const minute = Number(t[1]);
            const runTime = new Date(today.getTime() + hour * 60 * 60 * 1000 + minute * 60 * 1000);
            if (runTime > now) {
              nextRun = runTime;
              break;
            }
          }
          if (!nextRun) {
            // 明天的第一个推送
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            const hour = Number(runTimes[0][0]);
            const minute = Number(runTimes[0][1]);
            nextRun = new Date(tomorrow.getTime() + hour * 60 * 60 * 1000 + minute * 60 * 1000);
          }
          Logger.info(`[定时提醒] 下次推送时间：${nextRun.toLocaleString()}`);
          // 计算剩余时间
          const msLeft = nextRun.getTime() - now.getTime();
          const hours = Math.floor(msLeft / (1000 * 60 * 60));
          const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((msLeft % (1000 * 60)) / 1000);
          Logger.info(`[定时提醒] 距离下次推送还有：${hours}小时${minutes}分${seconds}秒`);
          await new Promise(r => setTimeout(r, logIntervalMinutes * 60 * 1000));
        }
      }
      // 并行执行主循环和定时日志
      await Promise.race([
        musicBot.startMainLoop(),
        logLoop()
      ]);
      // 支持主循环期间实时接收命令
      process.stdin.setEncoding('utf-8');
      process.stdin.on('data', async (input) => {
        const cmd = (typeof input === 'string' ? input : input.toString()).trim();
        if (cmd === 'clear-cache') {
          await musicBot.clearCache();
          Logger.info('所有缓存已清除。');
        } else if (cmd.startsWith('push ')) {
          const type = cmd.split(' ')[1];
          if (['morning', 'noon', 'night', 'holiday'].includes(type)) {
            await musicBot.sendToFeishu(type, type === 'holiday');
            Logger.info(`已手动推送 ${type}`);
          } else {
            Logger.info('未知推送类型');
          }
        } else if (cmd === 'exit') {
          Logger.info('即将退出...');
          process.exit(0);
        } else if (cmd === 'help') {
          Logger.info('可用指令：');
          Logger.info('  help                # 查看所有可用指令');
          Logger.info('  clear-cache         # 清除所有缓存');
          Logger.info('  push morning        # 手动推送早安');
          Logger.info('  push noon           # 手动推送午安');
          Logger.info('  push night          # 手动推送晚安');
          Logger.info('  push holiday        # 手动推送节假日');
          Logger.info('  exit                # 退出主程序');
        } else {
          Logger.info('支持的命令：clear-cache, push morning/noon/night/holiday, exit');
        }
      });
      break;
    case 'clear-cache':
      await musicBot.clearCache();
      Logger.info('所有缓存已清除。');
      break;
    default:
      Logger.info('未知命令！可用命令：morning / noon / night / holiday / test-all / start / clear-cache');
  }
}

main().catch(err => Logger.error(err instanceof Error ? err.stack || err.message : String(err)));
