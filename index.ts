import { MusicBot } from './functions/MusicBot';

async function main() {
  const musicBot = new MusicBot();

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
    console.log('用法:');
    console.log('  pnpm start morning      # 发送早安推送');
    console.log('  pnpm start noon         # 发送午安推送');
    console.log('  pnpm start night        # 发送晚安推送');
    console.log('  pnpm start holiday      # 发送节假日推送');
    console.log('  pnpm start test-all     # 测试所有推送类型');
    console.log('  pnpm start start        # 启动主循环（定时推送）');
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
      console.log('启动主循环，按 Ctrl+C 停止...');
      await musicBot.startMainLoop();
      break;
    default:
      console.log('未知命令！可用命令：morning / noon / night / holiday / test-all / start');
  }
}

main().catch(console.error);
