const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Claude Config Switcher extension is now active');

  let disposable = vscode.commands.registerCommand(
    'claude-config-switcher.switchActiveDirectory',
    async function () {
      // Check if a workspace folder is open
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Please open a folder or workspace first');
        return;
      }

      // Get the current workspace root path
      const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
      
      // Path to Claude config file
      const configPath = path.join(
        process.env.HOME || process.env.USERPROFILE,
        'Library/Application Support/Claude/claude_desktop_config.json'
      );
      
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
      } catch (error) {
        vscode.window.showErrorMessage(`Error updating Claude config: ${error.message}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
