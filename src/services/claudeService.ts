import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class ClaudeService {
    /**
     * Get the Claude config file path based on the OS
     */
    public static getClaudeConfigPath(): string {
        if (process.platform === 'darwin') {
            // macOS
            return path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
        } else if (process.platform === 'win32') {
            // Windows
            return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
        } else {
            // Not supported
            throw new Error('Unsupported OS: Claude Desktop is only available on macOS and Windows');
        }
    }

    /**
     * Restart the Claude desktop application
     */
    public static async restartClaude(): Promise<boolean> {
        // Get restart delay from settings
        const config = vscode.workspace.getConfiguration('claude-config');
        const restartDelay = config.get<number>('restartDelay', 2);
        
        return new Promise((resolve) => {
            if (process.platform === 'darwin') {
                // macOS: Use AppleScript
                const appleScript = `
                    if application "Claude" is running then
                        tell application "Claude" to quit
                        delay ${restartDelay}
                    end if
                    tell application "Claude" to activate
                `;
                
                // Execute the AppleScript
                cp.exec(`osascript -e '${appleScript}'`, (error) => {
                    if (error) {
                        vscode.window.showErrorMessage(`Failed to restart Claude: ${error.message}`);
                        resolve(false);
                    } else {
                        vscode.window.showInformationMessage('Claude restarted successfully');
                        resolve(true);
                    }
                });
            } else if (process.platform === 'win32') {
                // Windows: Use PowerShell
                const psScript = `
                    $claudeProcess = Get-Process "Claude" -ErrorAction SilentlyContinue
                    if ($claudeProcess) {
                        Stop-Process -Name "Claude" -Force
                        Start-Sleep -Seconds ${restartDelay}
                    }
                    Start-Process "claude:" -WindowStyle Normal
                `;
                
                cp.exec(`powershell -Command "${psScript}"`, (error) => {
                    if (error) {
                        vscode.window.showErrorMessage(`Failed to restart Claude: ${error.message}`);
                        resolve(false);
                    } else {
                        vscode.window.showInformationMessage('Claude restarted successfully');
                        resolve(true);
                    }
                });
            } else {
                vscode.window.showErrorMessage('Unsupported OS: Claude Desktop is only available on macOS and Windows');
                resolve(false);
            }
        });
    }

    /**
     * Sets up a file watcher for the Claude config file to auto-restart when changes are detected
     */
    public static setupConfigFileWatcher(context: vscode.ExtensionContext): vscode.FileSystemWatcher | undefined {
        try {
            const configFilePath = ClaudeService.getClaudeConfigPath();
            
            // Check if the config file exists
            if (!fs.existsSync(configFilePath)) {
                vscode.window.showWarningMessage(`Claude config file not found at: ${configFilePath}. Auto-restart functionality will not work.`);
                return undefined;
            }
            
            // Create a file system watcher for the config file
            const fileWatcher = vscode.workspace.createFileSystemWatcher(configFilePath);
            
            // When the file is changed, restart Claude if auto restart is enabled
            fileWatcher.onDidChange(async () => {
                const config = vscode.workspace.getConfiguration('claude-config');
                const autoRestart = config.get<boolean>('autoRestartAfterConfigChange', true);
                
                if (autoRestart) {
                    vscode.window.showInformationMessage('Claude config file saved, restarting Claude...');
                    await ClaudeService.restartClaude();
                }
            });
            
            context.subscriptions.push(fileWatcher);
            return fileWatcher;
        } catch (error) {
            vscode.window.showErrorMessage(`Error setting up config file watcher: ${error instanceof Error ? error.message : String(error)}`);
            return undefined;
        }
    }
}
