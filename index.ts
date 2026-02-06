import { TelegramBot } from "./bot.js";
import { AIProcessor } from "./ai.js";
import { CommandExecutor } from "./executor.js";
import { MemoryManager } from "./memory.js";

/**
 * 主程序入口
 */
async function main() {
    console.log("--- 啟動具備指令與記憶功能的 AI 助手 MVP ---");

    try {
        const ai = new AIProcessor();
        const bot = new TelegramBot();
        const executor = new CommandExecutor();
        const memory = new MemoryManager();

        bot.onMessage(async (userInput: string, chatId: number) => {
            try {
                // 0. 提取目前的歷史記錄
                const history = memory.getHistory(chatId);

                // 1. 第一次提問：邀請 AI 思考
                const response = await ai.ask(userInput, history);
                
                // 檢查是否有工具呼叫要求
                const toolCalls = response.functionCalls();
                let resultText = "";
                
                if (toolCalls && toolCalls.length > 0) {
                    const call = toolCalls[0];
                    console.log(`[Gateway] AI 要求執行工具: ${call.name} 參數: ${JSON.stringify(call.args)}`);
                    
                    if (call.name === "execute_command") {
                        const cmdResult = await executor.execute(call.args.command as string);
                        
                        // 將結果傳回給 AI 總結
                        const finalResponse = await ai.ask(`執行結果：\n${cmdResult}\n請根據結果回答。`, history);
                        resultText = finalResponse.text();
                    }
                } else {
                    resultText = response.text();
                }
                
                // --- 教學重點：對話結束後，將這輪對話存入記憶 ---
                // 我們存入用戶說的話，以及 AI 最後回的話
                memory.addMessage(chatId, "user", userInput);
                memory.addMessage(chatId, "model", resultText);
                
                return resultText;
            } catch (err) {
                console.error("處理流程出錯:", err);
                return "處理過程中發生錯誤，請查看日誌。";
            }
        });

        await bot.start();

    } catch (error) {
        console.error("啟動失敗:", error);
        process.exit(1);
    }
}

// 執行主程序
main();
