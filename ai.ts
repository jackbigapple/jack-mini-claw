import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

// 載入 .env 檔案中的環境變量
dotenv.config();

/**
 * AI 處理器類別
 * 負責所有與 Google Gemini API 的直接交互
 */
export class AIProcessor {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        // 從環境變量讀取 API Key
        // 在正式環境中，這通常透過 'antigravity auth' 或系統加密存儲獲取
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("找不到 GEMINI_API_KEY");
        }

        // 初始化 Google AI SDK
        this.genAI = new GoogleGenerativeAI(apiKey);
        
        // --- 教學重點：定義工具 (Tools) ---
        // 我們告訴 Gemini：你有一個「函數工具」可以叫。
        const tools = [
            {
                functionDeclarations: [
                    {
                        name: "execute_command",
                        description: "在指定資料夾下執行本機指令 (如 ls, cat, echo)",
                        parameters: {
                            type: "object",
                            properties: {
                                command: {
                                    type: "string",
                                    description: "要執行的 shell 指令",
                                },
                            },
                            required: ["command"],
                        },
                    },
                ],
            },
        ];

        // 選定模型，使用最新的 Gemini 3 系列
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-3-flash-preview", 
            // 注入工具定義
            tools: tools as any,
            systemInstruction: "你是一個擁有系統管理權限的 AI 助手。你可以透過 execute_command 工具來查看目錄或檔案內容。請根據工具的回傳結果來回答用戶。"
        });
    }

    /**
     * 向 AI 傳送訊息，支援處理工具呼叫與對話歷史
     * @param prompt 用戶輸入
     * @param history 對話歷史 (選填)
     */
    async ask(prompt: string, history: any[] = []): Promise<any> {
        console.log(`[AI] 開始請求 Gemini，提示詞: ${prompt}`);
        try {
            // 教學重點：使用 startChat 並傳入歷史記錄
            // 這樣 AI 就能記得之前的對話內容
            const chat = this.model.startChat({
                history: history,
            });
            
            const result = await chat.sendMessage(prompt);
            const response = await result.response;
            
            // 這裡我們回傳整個 response 物件，讓外部 index.ts 判斷是否有 tool_calls
            return response;
        } catch (error) {
            console.error("AI 請求出錯:", error);
            throw error;
        }
    }

    /**
     * 將工具執行的結果傳回給 AI
     */
    async sendToolResult(callId: string, result: string): Promise<string> {
        // [簡化版] 在這個 MVP 中，我們直接讓 AI 知道工具結果
        // 實作上通常會維持一個 chat history 陣列
        return result; 
    }
}
