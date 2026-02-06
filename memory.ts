/**
 * 對話記憶管理器
 * 負責儲存與提取每個用戶的對話歷史
 */
export class MemoryManager {
    // 使用 Map 儲存每個 chatId 對應的對話歷史
    // 格式：{ role: "user" | "model", parts: [{ text: string }] }
    private historyMap: Map<number, any[]> = new Map();

    /**
     * 獲取指定會話的歷史記錄
     */
    getHistory(chatId: number): any[] {
        if (!this.historyMap.has(chatId)) {
            this.historyMap.set(chatId, []);
        }
        return this.historyMap.get(chatId)!;
    }

    /**
     * 新增一條對話到歷史中
     */
    addMessage(chatId: number, role: "user" | "model", text: string) {
        const history = this.getHistory(chatId);
        history.push({
            role: role,
            parts: [{ text: text }]
        });

        // 教學重點：為了防止記憶過大導致 API 噴錯，我們限制只保留最後 10 輪對話
        if (history.length > 20) { // 10 輪 = 20 則訊息
            history.shift();
            history.shift();
        }
    }

    /**
     * 清空歷史 (選用功能)
     */
    clear(chatId: number) {
        this.historyMap.set(chatId, []);
    }
}
