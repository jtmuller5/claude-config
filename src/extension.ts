import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext) {
  console.log('Claude Config Switcher extension is now active');

  // Register the original command to switch active directory to current workspace
  let switchWorkspaceCommand = vscode.commands.registerCommand(
    'claude-config.switchActiveDirectory',
    switchActiveDirectoryToWorkspace
  );

  // Register new command for context menu - switch to selected folder
  let switchSelectedFolderCommand = vscode.commands.registerCommand(
    'claude-config.switchToSelectedFolder',
    switchActiveDirectoryToSelectedFolder
  );

  context.subscriptions.push(switchWorkspaceCommand);
  context.subscriptions.push(switchSelectedFolderCommand);
}

/**
 * Get the Claude Desktop config file path based on the OS
 * @returns {string} Path to the Claude Desktop config file
 */
function getClaudeConfigPath(): string {
  if (process.platform === 'darwin') {
    // macOS
    return path.join(
      os.homedir(),
      'Library/Application Support/Claude/claude_desktop_config.json'
    );
  } else if (process.platform === 'win32') {
    // Windows
    return path.join(
      process.env.APPDATA || '',
      'Claude/claude_desktop_config.json'
    );
  } else {
    // Linux or other platforms (not officially supported by Claude Desktop)
    return path.join(
      os.homedir(),
      '.config/claude/claude_desktop_config.json'
    );
  }
}

/**
 * Update Claude's active directory to the specified path
 * @param {string} targetPath - The new directory path to set
 */
async function updateClaudeActiveDirectory(targetPath: string): Promise<void> {
  // Path to Claude config file
  const configPath = getClaudeConfigPath();
  
  try {
    // Check if the config file exists
    if (!fs.existsSync(configPath)) {
      throw new Error(`Claude config file not found at: ${configPath}`);
    }
    
    // Read the config file
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Check if the required structure exists
    if (!configData.mcpServers || !configData.mcpServers.filesystem || 
        !Array.isArray(configData.mcpServers.filesystem.args)) {
      throw new Error('Claude config file has an unexpected structure');
    }
    
    // Get the current directory path from the config
    const currentDirConfig = configData.mcpServers.filesystem.args[2];
    
    // Ask for confirmation before changing
    const result = await vscode.window.showInformationMessage(
      `Switch Claude's active directory from:\n${currentDirConfig}\nto:\n${targetPath}`,
      'Yes', 'No'
    );
    
    if (result !== 'Yes') {
      return;
    }
    
    // Update the config
    configData.mcpServers.filesystem.args[2] = targetPath;
    
    // Write the updated config back to the file
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
    
    vscode.window.showInformationMessage(
      `Successfully switched Claude's active directory to:\n${targetPath}`
    );
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(`Error updating Claude config: ${error.message}`);
    } else {
      vscode.window.showErrorMessage(`Error updating Claude config: Unknown error`);
    }
  }
}

/**
 * Command handler: Switch Claude's active directory to current workspace folder
 */
async function switchActiveDirectoryToWorkspace(): Promise<void> {
  // Check if a workspace folder is open
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('Please open a folder or workspace first');
    return;
  }

  // Get the current workspace root path
  const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
  
  // Update Claude's active directory
  await updateClaudeActiveDirectory(workspaceRoot);
}

/**
 * Command handler: Switch Claude's active directory to selected folder
 * @param {vscode.Uri} folderUri - The URI of the selected folder
 */
async function switchActiveDirectoryToSelectedFolder(folderUri?: vscode.Uri): Promise<void> {
  if (!folderUri) {
    vscode.window.showErrorMessage('No folder selected. Please right-click on a folder in the explorer view.');
    return;
  }
  
  // Get the selected folder path
  const folderPath = folderUri.fsPath;
  
  // Check if it's a directory
  try {
    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
      vscode.window.showErrorMessage('Selected item is not a directory. Please select a folder.');
      return;
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error checking folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return;
  }
  
  // Update Claude's active directory
  await updateClaudeActiveDirectory(folderPath);
}

export function deactivate() {}
