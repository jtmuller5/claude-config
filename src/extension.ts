import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ConfigService } from "./services/configService";
import { ClaudeService } from "./services/claudeService";
import { createConfig } from "./commands/createConfig";
import { selectConfig } from "./commands/selectConfig";
import { deleteConfig } from "./commands/deleteConfig";
import { editConfig } from "./commands/editConfig";
import { restartClaude } from "./commands/restartClaude";

export function activate(context: vscode.ExtensionContext): void {
  console.log("Claude Config Switcher extension is now active");

  // Set up a file watcher for the Claude config file
  ClaudeService.setupConfigFileWatcher(context);

  // Register configuration settings
  vscode.workspace
    .getConfiguration("claude-config")
    .update(
      "autoRestartAfterConfigChange",
      vscode.workspace
        .getConfiguration("claude-config")
        .get("autoRestartAfterConfigChange", true),
      vscode.ConfigurationTarget.Global
    );

  vscode.workspace
    .getConfiguration("claude-config")
    .update(
      "restartDelay",
      vscode.workspace.getConfiguration("claude-config").get("restartDelay", 2),
      vscode.ConfigurationTarget.Global
    );

  // Initialize the configuration service
  const configService = new ConfigService(context);

  // Register the original directory switching command
  const switchDirectoryCommand = vscode.commands.registerCommand(
    "claude-config.switchActiveDirectory",
    async () => {
      // Check if a workspace folder is open
      if (
        !vscode.workspace.workspaceFolders ||
        vscode.workspace.workspaceFolders.length === 0
      ) {
        vscode.window.showErrorMessage(
          "Please open a folder or workspace first"
        );
        return;
      }

      // Get the current workspace root path
      const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

      // Path to Claude config file
      const configPath = configService.getClaudeConfigPath();

      try {
        // Check if the config file exists
        if (!fs.existsSync(configPath)) {
          vscode.window.showErrorMessage(
            `Claude config file not found at: ${configPath}`
          );
          return;
        }

        // Read the config file
        const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));

        // Check if the required structure exists
        if (
          !configData.mcpServers ||
          !configData.mcpServers.filesystem ||
          !Array.isArray(configData.mcpServers.filesystem.args)
        ) {
          vscode.window.showErrorMessage(
            "Claude config file has an unexpected structure"
          );
          return;
        }

        // Get the current directory path from the config
        const currentDirConfig = configData.mcpServers.filesystem.args[2];

        // Ask for confirmation before changing
        const result = await vscode.window.showInformationMessage(
          `Switch Claude's active directory from:\n${currentDirConfig}\nto:\n${workspaceRoot}`,
          "Yes",
          "No"
        );

        if (result !== "Yes") {
          return;
        }

        // Update the config
        configData.mcpServers.filesystem.args[2] = workspaceRoot;

        // Write the updated config back to the file
        fs.writeFileSync(
          configPath,
          JSON.stringify(configData, null, 2),
          "utf8"
        );

        vscode.window.showInformationMessage(
          `Successfully switched Claude's active directory to:\n${workspaceRoot}`
        );

        // Auto restart Claude after config change if enabled
        const autoRestart = vscode.workspace
          .getConfiguration("claude-config")
          .get<boolean>("autoRestartAfterConfigChange", true);
        if (autoRestart) {
          vscode.window.showInformationMessage(
            "Restarting Claude to apply changes..."
          );
          await ClaudeService.restartClaude();
        }

        // If we have an active config in our extension, update it
        const activeConfigName = configService.getActiveConfigName();
        if (activeConfigName) {
          await configService.updateConfig(activeConfigName, configData);
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error updating Claude config: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  );

  // Register new commands for configuration management
  const createConfigCommand = vscode.commands.registerCommand(
    "claude-config.createConfig",
    () => createConfig(configService)
  );

  const selectConfigCommand = vscode.commands.registerCommand(
    "claude-config.selectConfig",
    () => selectConfig(configService)
  );

  const deleteConfigCommand = vscode.commands.registerCommand(
    "claude-config.deleteConfig",
    () => deleteConfig(configService)
  );

  const editConfigCommand = vscode.commands.registerCommand(
    "claude-config.editConfig",
    () => editConfig(configService)
  );

  // Register the command to manually restart Claude
  const restartClaudeCommand = vscode.commands.registerCommand(
    "claude-config.restartClaude",
    () => restartClaude()
  );

  // Register new command for context menu - switch to selected folder
  let switchSelectedFolderCommand = vscode.commands.registerCommand(
    "claude-config.switchToSelectedFolder",
    switchActiveDirectoryToSelectedFolder
  );

  /**
   * Command handler: Switch Claude's active directory to selected folder
   * @param {vscode.Uri} folderUri - The URI of the selected folder
   */
  async function switchActiveDirectoryToSelectedFolder(
    folderUri?: vscode.Uri
  ): Promise<void> {
    if (!folderUri) {
      vscode.window.showErrorMessage(
        "No folder selected. Please right-click on a folder in the explorer view."
      );
      return;
    }

    // Get the selected folder path
    const folderPath = folderUri.fsPath;

    // Check if it's a directory
    try {
      const stats = fs.statSync(folderPath);
      if (!stats.isDirectory()) {
        vscode.window.showErrorMessage(
          "Selected item is not a directory. Please select a folder."
        );
        return;
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Error checking folder: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return;
    }

    // Path to Claude config file
    const configPath = configService.getClaudeConfigPath();

    try {
      // Check if the config file exists
      if (!fs.existsSync(configPath)) {
        vscode.window.showErrorMessage(
          `Claude config file not found at: ${configPath}`
        );
        return;
      }

      // Read the config file
      const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));

      // Check if the required structure exists
      if (
        !configData.mcpServers ||
        !configData.mcpServers.filesystem ||
        !Array.isArray(configData.mcpServers.filesystem.args)
      ) {
        vscode.window.showErrorMessage(
          "Claude config file has an unexpected structure"
        );
        return;
      }

      // Get the current directory path from the config
      const currentDirConfig = configData.mcpServers.filesystem.args[2];

      // Ask for confirmation before changing
      const result = await vscode.window.showInformationMessage(
        `Switch Claude's active directory from:\n${currentDirConfig}\nto:\n${folderPath}`,
        "Yes",
        "No"
      );

      if (result !== "Yes") {
        return;
      }

      // Update the config
      configData.mcpServers.filesystem.args[2] = folderPath;

      // Write the updated config back to the file
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), "utf8");

      vscode.window.showInformationMessage(
        `Successfully switched Claude's active directory to:\n${folderPath}`
      );

      // Auto restart Claude after config change if enabled
      const autoRestart = vscode.workspace
        .getConfiguration("claude-config")
        .get<boolean>("autoRestartAfterConfigChange", true);
      if (autoRestart) {
        vscode.window.showInformationMessage(
          "Restarting Claude to apply changes..."
        );
        await ClaudeService.restartClaude();
      }

      // If we have an active config in our extension, update it
      const activeConfigName = configService.getActiveConfigName();
      if (activeConfigName) {
        await configService.updateConfig(activeConfigName, configData);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Error updating Claude config: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // Add all commands to subscriptions
  context.subscriptions.push(
    switchDirectoryCommand,
    createConfigCommand,
    selectConfigCommand,
    deleteConfigCommand,
    editConfigCommand,
    restartClaudeCommand
  );
}

export function deactivate(): void {}
