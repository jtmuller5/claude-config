import * as vscode from 'vscode';
import { ClaudeService } from '../services/claudeService';

export async function restartClaude(): Promise<void> {
    try {
        await ClaudeService.restartClaude();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to restart Claude: ${error instanceof Error ? error.message : String(error)}`);
    }
}
