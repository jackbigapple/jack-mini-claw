# AI 助手架構與實踐：從 MVP 到生產級架構 (OpenClaw)

## 🎓 第一課：AI 助手平台的五大支柱

OpenClaw 以最核心的五個組件構建 AI 助手平台：

1.  **網關 (Gateway)**：大腦的核心，負責會話分配、歷史記憶與協定轉換。
2.  **思考引擎 (Agent Runtime)**：AI 的推理循環，處理「思考 -> 行動 -> 觀察」的循環。
3.  **通路適配層 (Connectors)**：與不同 App（Telegram, WhatsApp）對接的橋樑。
4.  **工具系統 (Tooling/MCP)**：讓 AI 具備「手腳」，如執行指令、網頁爬蟲。
5.  **安全沙盒 (Sandbox)**：執行 AI 生成代碼時的隔離環境。

---

## 🛠️ 第二課：實踐教學級 MVP (`educational-mvp`)

我實作了一個隔離的專案：`educational-mvp`

### 1. 專案結構
*   `bot.ts`: 通路層。負責 Telegram 連線。
*   `ai.ts`: 思考層。負責 Gemini 訊息處理與工具定義。
*   `executor.ts`: 工具層。負責執行 Shell 指令。
*   `index.ts`: 網關層。串接訊息流動的邏輯。

### 2. 重點技術選型
*   **grammY**: Node.js 下最現代化的 Telegram Bot SDK。
*   **Google Gemini SDK**: 使用最新的 `gemini-3-flash-preview` 模型。
*   **TypeScript + ESM**: 使用現代化的模組化開發。

---

## ❓ 第三課：技術問題筆記 (Q&A)

### Q1：為什麼 Telegram 能跟我說話？運作原理是什麼？
**A**：
1.  **進來 (Polling)**：程式會「主動」詢問 Telegram 伺服器是否有新訊，這叫「長輪詢 (Long Polling)」。這能讓你在沒有公開網址的情況下，依然能在家裡接收全球的訊息。
2.  **出去 (API call)**：當 AI 給出答案，Node.js 發送一個 HTTP POST 請求給 Telegram API，指令它的伺服器把訊息推播到你的手機。

### Q2：這個 MVP 跟 OpenClaw 的組件怎麼對應？
*   `bot.ts` $\rightarrow$ OpenClaw 的 `src/connectors/`
*   `ai.ts` $\rightarrow$ OpenClaw 的 `src/agent/` (核心推理)
*   `index.ts` $\rightarrow$ OpenClaw 的 `src/gateway/`

### Q3：AI 是如何「動手」執行本機指令的？
**A**：
這是透過 **Function Calling (Tool Use)** 實現的：
1.  我們在 `ai.ts` 定義一份 JSON 指南，告訴 AI 有一個工具叫 `execute_command`。
2.  AI 判斷用戶需求（如：列出檔案），它會回傳一個標記：「請幫我執行指令：`ls`」。
3.  `index.ts` 攔截這個標記，交給 `executor.ts` 真實執行，再把結果傳回給 AI 總結成人類語言。

---

## 🧠 第四課：對話記憶的實作 (Memory)

為了讓 AI 能記得之前的對話，我們實作了以下機制：

1.  **會話識別**：透過 Telegram 的 `chatId` 來區分不同的用戶，確保每個人都有獨立的記憶空間。
2.  **存儲結構**：建立 `memory.ts`，使用 `Map<number, any[]>` 結構儲存對話。
3.  **SDK 整合**：Gemini SDK 提供 `startChat({ history })` 方法。我們在每次請求時，將該用戶的歷史記錄傳入，AI 就能根據上下文回應。
4.  **記憶長度控制**：為了節省 Token 並保持回應品質，我們設定只保留最近的 10 輪對話（先進先出）。

---

## 🛡️ 第五課：本機指令安全性 (Security)

讓 AI 執行指令非常強大，但也具備風險。我們採取的初步防護：

1.  **指令黑名單 (Blacklist)**：在 `executor.ts` 中定義了一組禁用關鍵字，如 `rm`, `sudo`, `mv`, `>`, `|` 等。
2.  **執行前掃描**：指令在交給系統執行前，會先過濾字串。一旦發現黑名單字眼，程式會立刻攔截並回報安全拒絕。
3.  **生產環境建議**：在正式的 OpenClaw 中，這種安全性通常透過「虛擬化/容器化 (Docker Sandbox)」來達成，讓 AI 在一個完全隔離、用完即丟的環境中工作。

---

## 🚀 已完成的進階挑戰 (Completed Steps)
- [x] **本機指令執行**：讓 AI 能操作指定資料夾。
- [x] **對話記憶**：能根據上下文回應訊息。
- [x] **安全性過濾**：自動攔截危險指令。

---
*整理日期：2026-02-05*
