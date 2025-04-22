import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService, ConfigItem } from '../services/configService';

export async function editConfig(configService: ConfigService): Promise<void> {
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
            placeHolder: 'Select a configuration to edit'
        });
        
        if (!selectedItem) {
            return; // User cancelled
        }
        
        await openConfigForEditing(configService, selectedItem.config);
    } catch (error) {
        vscode.window.showErrorMessage(`Error editing configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Helper function to open a config for editing
export async function openConfigForEditing(configService: ConfigService, config: ConfigItem): Promise<void> {
    // Create a temp file in the extension's storage directory
    const storageDir = configService.getStoragePath();
    const tempFilePath = path.join(storageDir, `${config.name.replace(/[^a-z0-9]/gi, '_')}_config.json`);
    
    // Write the config to the temp file
    fs.writeFileSync(tempFilePath, JSON.stringify(config.content, null, 2), 'utf8');
    
    // Open the file in the editor
    const doc = await vscode.workspace.openTextDocument(tempFilePath);
    const editor = await vscode.window.showTextDocument(doc);
    
    // Register a command to save the config when the file is saved
    const disposable = vscode.workspace.onDidSaveTextDocument(async (savedDoc) => {
        if (savedDoc.fileName === tempFilePath) {
            try {
                // Parse the updated content
                const updatedContent = JSON.parse(savedDoc.getText());
                
                // Update the config
                await configService.updateConfig(config.name, updatedContent);
                
                // If this is the active config, update the Claude config file
                if (config.name === configService.getActiveConfigName()) {
                    await configService.setActiveConfig(config.name);
                }
                
                vscode.window.showInformationMessage(`Configuration "${config.name}" updated successfully.`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to update configuration: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });
    
    // Clean up the event listener when the editor is closed
    const closeDisposable = vscode.window.onDidChangeVisibleTextEditors((editors) => {
        if (!editors.some(e => e.document.fileName === tempFilePath)) {
            disposable.dispose();
            closeDisposable.dispose();
        }
    });
}
