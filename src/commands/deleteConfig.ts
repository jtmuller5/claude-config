import * as vscode from 'vscode';
import { ConfigService } from '../services/configService';

export async function deleteConfig(configService: ConfigService): Promise<void> {
    try {
        const configs = configService.getConfigs();
        
        if (configs.length === 0) {
            vscode.window.showInformationMessage('No configurations found. Create a configuration first.');
            return;
        }
        
        const activeConfigName = configService.getActiveConfigName();
        
        const configItems = configs.map(config => ({
            label: config.name,
            description: config.name === activeConfigName ? '(active)' : '',
            config
        }));
        
        const selectedItem = await vscode.window.showQuickPick(configItems, {
            placeHolder: 'Select a configuration to delete'
        });
        
        if (!selectedItem) {
            return; // User cancelled
        }
        
        // Ask for confirmation before deleting
        const confirmed = await vscode.window.showWarningMessage(
            `Are you sure you want to delete "${selectedItem.config.name}"?`,
            { modal: true },
            'Delete',
            'Cancel'
        );
        
        if (confirmed !== 'Delete') {
            return; // User cancelled
        }
        
        await configService.deleteConfig(selectedItem.config.name);
        vscode.window.showInformationMessage(`Deleted configuration: ${selectedItem.config.name}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Error deleting configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
}
