import { Bot } from "grammy";
import * as dotenv from "dotenv";

// 載入 .env 檔案
dotenv.config();

/**
 * Telegram Bot 控制器
 * 負責通路 (Channel) 的連接與事件監聽
 */
export class TelegramBot {
    private bot: Bot;

    constructor() {
        // 從環境變量獲取 Telegram Bot Token (從 BotFather 取得)
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            throw new Error("找不到 TELEGRAM_BOT_TOKEN");
        }

        // 初始化 grammY Bot 實例
        this.bot = new Bot(token);
    }

    /**
     * 註冊消息處理器
     * @param handler 當收到消息時要執行的異步函數，支援傳入 chatId
     */
    onMessage(handler: (text: string, chatId: number) => Promise<string>) {
        // [偵錯層] 監聽所有類型的更新
        this.bot.use(async (ctx, next) => {
            await next();
        });

        // 加入一個簡單的 /start 指令測試
        this.bot.command("start", (ctx) => ctx.reply("機器人已啟動！請跟我說話。"));

        // 監聽所有文字消息 (Message context)
        this.bot.on("message:text", async (ctx) => {
            const userText = ctx.message.text;
            const chatId = ctx.chat.id;
            console.log(`收到來自 ${ctx.from?.first_name} (ID: ${chatId}) 的訊息: ${userText}`);

            // 讓用戶知道 Bot 正在思考 (顯示 'typing' 狀態)
            await ctx.replyWithChatAction("typing");

            // 呼叫外部傳入的處理器
            const aiResponse = await handler(userText, chatId);

            // 將 AI 的回答傳回給 Telegram 用戶
            await ctx.reply(aiResponse);
        });
    }

    /**
     * 啟動 Bot
     */
    async start() {
        // 加入錯誤處理器，捕捉網路問題或 Token 錯誤
        this.bot.catch((err) => {
            console.error("Telegram Bot 發生錯誤:", err);
        });

        console.log("Telegram Bot 正在啟動，這是一個 Polling 模式 (長輪詢)...");
        
        // 嘗試獲取 Bot 資訊，驗證 Token 是否有效
        try {
            const me = await this.bot.api.getMe();
            console.log(`Bot 已連線: @${me.username}`);
        } catch (error) {
            console.error("無法連線至 Telegram，請檢查 Token 或網路狀態 (例如是否需要 Proxy):", error);
        }

        // 啟動監聽
        this.bot.start();
    }
}
