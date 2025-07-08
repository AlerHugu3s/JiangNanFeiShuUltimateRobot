import { MusicBot } from './MusicBot';

async function main() {
    const musicBot = new MusicBot();

    // 示例 1: 测试所有推送类型
    console.log('=== 测试所有推送类型 ===');
    await musicBot.testAll();

    // 示例 2: 发送特定类型的推送
    console.log('\n=== 发送早安推送 ===');
    await musicBot.sendToFeishu('morning');

    console.log('\n=== 发送午安推送 ===');
    await musicBot.sendToFeishu('noon');

    console.log('\n=== 发送晚安推送 ===');
    await musicBot.sendToFeishu('night');

    console.log('\n=== 发送周五晚上推送 ===');
    await musicBot.sendToFeishu('night', true);

    // 示例 3: 启动主循环（定时推送）
    // console.log('\n=== 启动主循环 ===');
    // await musicBot.startMainLoop();
}

// 命令行参数处理
async function runWithArgs() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('使用方法:');
        console.log('  tsx functions/musicBotExample.ts                    # 运行所有测试');
        console.log('  tsx functions/musicBotExample.ts morning            # 发送早安推送');
        console.log('  tsx functions/musicBotExample.ts noon               # 发送午安推送');
        console.log('  tsx functions/musicBotExample.ts night              # 发送晚安推送');
        console.log('  tsx functions/musicBotExample.ts holiday            # 发送节假日推送');
        console.log('  tsx functions/musicBotExample.ts test-all           # 测试所有推送类型');
        console.log('  tsx functions/musicBotExample.ts start              # 启动主循环');
        return;
    }

    const musicBot = new MusicBot();
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

// 如果直接运行此文件
if (require.main === module) {
    if (process.argv.length > 2) {
        runWithArgs().catch(console.error);
    } else {
        main().catch(console.error);
    }
} 