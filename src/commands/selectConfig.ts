import * as vscode from 'vscode';
import { ConfigService, ConfigItem } from '../services/configService';

export async function selectConfig(configService: ConfigService): Promise<void> {
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
            placeHolder: 'Select a configuration to activate'
        });
        
        if (!selectedItem) {
            return; // User cancelled
        }
        
        await configService.setActiveConfig(selectedItem.config.name);
        vscode.window.showInformationMessage(`Activated configuration: ${selectedItem.config.name}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Error selecting configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
}
