"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const configService_1 = require("./services/configService");
const createConfig_1 = require("./commands/createConfig");
const selectConfig_1 = require("./commands/selectConfig");
const deleteConfig_1 = require("./commands/deleteConfig");
const editConfig_1 = require("./commands/editConfig");
function activate(context) {
    console.log('Claude Config Switcher extension is now active');
    // Initialize the configuration service
    const configService = new configService_1.ConfigService(context);
    // Register the original directory switching command
    const switchDirectoryCommand = vscode.commands.registerCommand('claude-config.switchActiveDirectory', async () => {
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
            const result = await vscode.window.showInformationMessage(`Switch Claude's active directory from:\n${currentDirConfig}\nto:\n${workspaceRoot}`, 'Yes', 'No');
            if (result !== 'Yes') {
                return;
            }
            // Update the config
            configData.mcpServers.filesystem.args[2] = workspaceRoot;
            // Write the updated config back to the file
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            vscode.window.showInformationMessage(`Successfully switched Claude's active directory to:\n${workspaceRoot}`);
            // If we have an active config in our extension, update it
            const activeConfigName = configService.getActiveConfigName();
            if (activeConfigName) {
                await configService.updateConfig(activeConfigName, configData);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error updating Claude config: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    // Register new commands for configuration management
    const createConfigCommand = vscode.commands.registerCommand('claude-config.createConfig', () => (0, createConfig_1.createConfig)(configService));
    const selectConfigCommand = vscode.commands.registerCommand('claude-config.selectConfig', () => (0, selectConfig_1.selectConfig)(configService));
    const deleteConfigCommand = vscode.commands.registerCommand('claude-config.deleteConfig', () => (0, deleteConfig_1.deleteConfig)(configService));
    const editConfigCommand = vscode.commands.registerCommand('claude-config.editConfig', () => (0, editConfig_1.editConfig)(configService));
    // Add all commands to subscriptions
    context.subscriptions.push(switchDirectoryCommand, createConfigCommand, selectConfigCommand, deleteConfigCommand, editConfigCommand);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map