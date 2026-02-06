import { exec } from "child_process";
import { promisify } from "util";

// 將傳統的 callback 風格 exec 轉為支援 async/await 的版本
const execAsync = promisify(exec);

/**
 * 指令執行器
 * 負責在系統中運行指定的命令，具備基本的安全性檢查
 */
export class CommandExecutor {
    // 教學重點：定義危險指令黑名單
    // 防止 AI 執行毀滅性的指令或獲取不當權限
    private readonly BLACKLIST = [
        "rm", "mv", "chmod", "chown", "sudo", "su", "kill", "dd",
        ">", ">>", "|", ";"
    ];

    /**
     * 執行 Shell 指令
     * @param command 要執行的指令
     * @param cwd 執行工作目錄
     */
    async execute(command: string, cwd: string = "."): Promise<string> {
        console.log(`[Executor] 收到請求: "${command}"`);

        // 1. 安全過濾：檢查指令中是否包含黑名單關鍵字
        const lowercaseCmd = command.toLowerCase();
        for (const forbidden of this.BLACKLIST) {
            // 檢查指令字串是否包含禁用關鍵字
            if (lowercaseCmd.includes(forbidden)) {
                console.warn(`[Security] 攔截到危險指令關鍵字: "${forbidden}"`);
                return `[安全拒絕]: 偵測到危險指令關鍵字 "${forbidden}"，系統拒絕執行此操作。`;
            }
        }
        
        try {
            // 2. 正式執行指令
            const { stdout, stderr } = await execAsync(command, { cwd });
            
            if (stderr) {
                return `[標準錯誤輸出]:\n${stderr}\n[標準輸出]:\n${stdout}`;
            }
            
            return stdout || "(指令執行成功，但無輸出內容)";
        } catch (error: any) {
            console.error("[Executor] 執行出錯:", error.message);
            return `執行失敗: ${error.message}`;
        }
    }
}
