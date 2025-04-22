import * as vscode from 'vscode';
import { ConfigService } from '../services/configService';
import { openConfigForEditing } from './editConfig';
import { createDefaultConfigTemplate } from '../utils/templates';

export async function createConfig(configService: ConfigService): Promise<void> {
    try {
        // Check if this is the first config - if so, use current Claude config and name it "Original Config"
        const existingConfigs = configService.getConfigs();
        
        if (existingConfigs.length === 0) {
            // First time configuration - read existing Claude config
            const currentConfig = configService.readCurrentClaudeConfig();
            
            if (!currentConfig) {
                vscode.window.showErrorMessage('Could not read current Claude configuration');
                return;
            }
            
            // Save it as "Original Config"
            await configService.createConfig('Original Config', currentConfig);
            vscode.window.showInformationMessage('Saved current Claude configuration as "Original Config"');
            
            // Open the config for editing
            const config = configService.getConfig('Original Config');
            if (config) {
                await openConfigForEditing(configService, config);
            }
            return;
        }
        
        // Prompt user for creation method
        const createMethod = await vscode.window.showQuickPick(
            [
                { label: 'Copy Current Config', description: 'Create a new config based on your current Claude configuration' },
                { label: 'Create Empty Template', description: 'Create a new config from a basic template' }
            ],
            { placeHolder: 'How would you like to create a new configuration?' }
        );
        
        if (!createMethod) {
            return; // User cancelled
        }
        
        // Prompt user for a new config name
        const configName = await vscode.window.showInputBox({
            prompt: 'Enter a name for the new configuration',
            placeHolder: 'My Config'
        });
        
        if (!configName) {
            return; // User cancelled
        }
        
        let configContent;
        
        if (createMethod.label === 'Copy Current Config') {
            // Read current Claude config and save it with the new name
            configContent = configService.readCurrentClaudeConfig();
            
            if (!configContent) {
                vscode.window.showErrorMessage('Could not read current Claude configuration');
                return;
            }
        } else {
            // Create from template
            configContent = createDefaultConfigTemplate();
        }
        
        await configService.createConfig(configName, configContent);
        vscode.window.showInformationMessage(`Created new configuration: ${configName}`);
        
        // Open the config for editing
        const config = configService.getConfig(configName);
        if (config) {
            await openConfigForEditing(configService, config);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error creating configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
}
