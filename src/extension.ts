import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from './services/configService';
import { createConfig } from './commands/createConfig';
import { selectConfig } from './commands/selectConfig';
import { deleteConfig } from './commands/deleteConfig';
import { editConfig } from './commands/editConfig';

export function activate(context: vscode.ExtensionContext): void {
  console.log('Claude Config Switcher extension is now active');

  // Initialize the configuration service
  const configService = new ConfigService(context);

  // Register the original directory switching command
  const switchDirectoryCommand = vscode.commands.registerCommand(
    'claude-config.switchActiveDirectory',
    async () => {
      // Check if a workspace folder is open
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Please open a folder or workspace first');
        return;
      }

      // Get the current workspace root path
      const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
      
      // Path to Claude config file
      const configPath = configService.getClaudeConfigPath();
      
      try {
        // Check if the config file exists
        if (!fs.existsSync(configPath)) {
          vscode.window.showErrorMessage(`Claude config file not found at: ${configPath}`);
          return;
        }
        
        // Read the config file
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Check if the required structure exists
        if (!configData.mcpServers || !configData.mcpServers.filesystem || 
            !Array.isArray(configData.mcpServers.filesystem.args)) {
          vscode.window.showErrorMessage('Claude config file has an unexpected structure');
          return;
        }
        
        // Get the current directory path from the config
        const currentDirConfig = configData.mcpServers.filesystem.args[2];
        
        // Ask for confirmation before changing
        const result = await vscode.window.showInformationMessage(
          `Switch Claude's active directory from:\n${currentDirConfig}\nto:\n${workspaceRoot}`,
          'Yes', 'No'
        );
        
        if (result !== 'Yes') {
          return;
        }
        
        // Update the config
        configData.mcpServers.filesystem.args[2] = workspaceRoot;
        
        // Write the updated config back to the file
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
        
        vscode.window.showInformationMessage(
          `Successfully switched Claude's active directory to:\n${workspaceRoot}`
        );

        // If we have an active config in our extension, update it
        const activeConfigName = configService.getActiveConfigName();
        if (activeConfigName) {
          await configService.updateConfig(activeConfigName, configData);
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Error updating Claude config: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Register new commands for configuration management
  const createConfigCommand = vscode.commands.registerCommand(
    'claude-config.createConfig',
    () => createConfig(configService)
  );

  const selectConfigCommand = vscode.commands.registerCommand(
    'claude-config.selectConfig',
    () => selectConfig(configService)
  );

  const deleteConfigCommand = vscode.commands.registerCommand(
    'claude-config.deleteConfig',
    () => deleteConfig(configService)
  );

  const editConfigCommand = vscode.commands.registerCommand(
    'claude-config.editConfig',
    () => editConfig(configService)
  );

  // Add all commands to subscriptions
  context.subscriptions.push(
    switchDirectoryCommand,
    createConfigCommand,
    selectConfigCommand,
    deleteConfigCommand,
    editConfigCommand
  );
}

export function deactivate(): void {}
